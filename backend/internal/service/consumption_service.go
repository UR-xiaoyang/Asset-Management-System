package service

import (
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"time"

	"gorm.io/gorm"
)

type ConsumptionService struct {
	repo      *repository.ConsumptionRepository
	assetRepo *repository.AssetRepository
}

func NewConsumptionService() *ConsumptionService {
	return &ConsumptionService{
		repo:      repository.NewConsumptionRepository(),
		assetRepo: repository.NewAssetRepository(),
	}
}

type CreateConsumptionReq struct {
	AssetUUID     string `json:"asset_uuid" binding:"required"`
	ReporterName  string `json:"reporter_name" binding:"required"`
	ReporterEmail string `json:"reporter_email"`
	ProjectName   string `json:"project_name" binding:"required"`
	Quantity      int    `json:"quantity" binding:"required,min=1"`
	ConsumeDate   string `json:"consume_date"`
	Remark        string `json:"remark"`
}

func (s *ConsumptionService) Create(req *CreateConsumptionReq) (*model.Consumption, error) {
	asset, err := s.assetRepo.GetByUUID(req.AssetUUID)
	if err != nil {
		return nil, err
	}

	consumption := &model.Consumption{
		AssetID:       asset.ID,
		AssetUUID:     req.AssetUUID,
		ReporterName:  req.ReporterName,
		ReporterEmail: req.ReporterEmail,
		ProjectName:   req.ProjectName,
		Quantity:      req.Quantity,
		ConsumeDate:   time.Now(),
		Status:        model.ConsumptionStatusPending,
		Remark:        req.Remark,
	}

	if req.ConsumeDate != "" {
		if parsedDate, err := time.Parse("2006-01-02", req.ConsumeDate); err == nil {
			consumption.ConsumeDate = parsedDate
		}
	}

	if err := s.repo.Create(consumption); err != nil {
		return nil, err
	}
	return s.repo.GetByID(consumption.ID)
}

func (s *ConsumptionService) GetByID(id uint) (*model.Consumption, error) {
	return s.repo.GetByID(id)
}

type ListConsumptionReq struct {
	Page         int    `form:"page"`
	PageSize     int    `form:"page_size" binding:"max=100"`
	Status       string `form:"status"`
	ReporterName string `form:"reporter_name"`
}

type ListConsumptionResp struct {
	Items []model.Consumption `json:"items"`
	Total int64               `json:"total"`
	Page  int                 `json:"page"`
}

func (s *ConsumptionService) List(req *ListConsumptionReq) (*ListConsumptionResp, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}

	items, total, err := s.repo.GetAll(req.Page, req.PageSize, req.Status, req.ReporterName)
	if err != nil {
		return nil, err
	}

	return &ListConsumptionResp{
		Items: items,
		Total: total,
		Page:  req.Page,
	}, nil
}

func (s *ConsumptionService) GetPending() ([]model.Consumption, error) {
	return s.repo.GetPending()
}

type ApproveConsumptionReq struct {
	ApprovedBy string `json:"approved_by"`
}

// Approve CAS 状态切换（事务）
func (s *ConsumptionService) Approve(id uint, req *ApproveConsumptionReq) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var c model.Consumption
		if err := tx.First(&c, id).Error; err != nil {
			return err
		}
		if c.Status != model.ConsumptionStatusPending {
			return ErrInvalidStatus
		}
		now := time.Now()
		res := tx.Model(&model.Consumption{}).
			Where("id = ? AND status = ?", id, model.ConsumptionStatusPending).
			Updates(map[string]interface{}{
				"status":      model.ConsumptionStatusApproved,
				"approved_by": req.ApprovedBy,
				"approved_at": &now,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		return nil
	})
}

type RejectConsumptionReq struct {
	ApprovedBy   string `json:"approved_by"`
	RejectReason string `json:"reject_reason" binding:"required"`
}

// Reject CAS 状态切换（事务）
func (s *ConsumptionService) Reject(id uint, req *RejectConsumptionReq) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var c model.Consumption
		if err := tx.First(&c, id).Error; err != nil {
			return err
		}
		if c.Status != model.ConsumptionStatusPending {
			return ErrInvalidStatus
		}
		res := tx.Model(&model.Consumption{}).
			Where("id = ? AND status = ?", id, model.ConsumptionStatusPending).
			Updates(map[string]interface{}{
				"status":        model.ConsumptionStatusRejected,
				"approved_by":   req.ApprovedBy,
				"reject_reason": req.RejectReason,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		return nil
	})
}

type CompleteConsumptionReq struct {
	ActualQuantity int    `json:"actual_quantity" binding:"required,min=1"`
	ProjectRecord  string `json:"project_record" binding:"required"`
	Remark         string `json:"remark"`
}

// Complete 完成登记实际用量：CAS approved → completed + 原子扣库存（事务）
func (s *ConsumptionService) Complete(id uint, req *CompleteConsumptionReq) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var c model.Consumption
		if err := tx.First(&c, id).Error; err != nil {
			return err
		}
		if c.Status != model.ConsumptionStatusApproved {
			return ErrInvalidStatus
		}
		// 原子扣库存
		affected, err := s.assetRepo.DecreaseQuantity(c.AssetUUID, req.ActualQuantity)
		if err != nil {
			return err
		}
		if affected == 0 {
			return ErrInsufficientStock
		}
		now := time.Now()
		res := tx.Model(&model.Consumption{}).
			Where("id = ? AND status = ?", id, model.ConsumptionStatusApproved).
			Updates(map[string]interface{}{
				"status":          model.ConsumptionStatusCompleted,
				"actual_quantity": req.ActualQuantity,
				"project_record":  req.ProjectRecord,
				"remark":          req.Remark,
				"approved_at":     &now,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		return nil
	})
}

func (s *ConsumptionService) GetByReporterName(name string) ([]model.Consumption, error) {
	return s.repo.GetByReporterName(name)
}

func (s *ConsumptionService) Delete(id uint) error {
	return s.repo.Delete(id)
}

// Revoke 撤销损耗：状态改 revoked；若原状态为 completed 则恢复库存（事务）
func (s *ConsumptionService) Revoke(id uint, revokedBy string) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var c model.Consumption
		if err := tx.First(&c, id).Error; err != nil {
			return err
		}
		if c.Status != model.ConsumptionStatusApproved && c.Status != model.ConsumptionStatusCompleted {
			return ErrInvalidStatus
		}
		// CAS：仅当原状态在允许集合内
		now := time.Now()
		res := tx.Model(&model.Consumption{}).
			Where("id = ? AND status IN ?", id, []model.ConsumptionStatus{
				model.ConsumptionStatusApproved, model.ConsumptionStatusCompleted,
			}).
			Updates(map[string]interface{}{
				"status":     model.ConsumptionStatusRevoked,
				"revoked_at": &now,
				"revoked_by": revokedBy,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		// 若原状态为 completed，库存已被扣减，需恢复实际用量
		if c.Status == model.ConsumptionStatusCompleted && c.ActualQuantity > 0 {
			if err := s.assetRepo.IncreaseQuantity(c.AssetUUID, c.ActualQuantity); err != nil {
				return err
			}
		}
		return nil
	})
}

type ExportConsumptionReq struct {
	Status       string `form:"status"`
	ReporterName string `form:"reporter_name"`
}

func (s *ConsumptionService) ListForExport(req *ExportConsumptionReq) ([]model.Consumption, error) {
	items, _, err := s.repo.GetAll(1, 10000, req.Status, req.ReporterName)
	if err != nil {
		return nil, err
	}
	return items, nil
}
