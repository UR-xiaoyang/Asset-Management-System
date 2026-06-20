package service

import (
	"errors"
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"time"

	"gorm.io/gorm"
)

type BorrowService struct {
	repo         *repository.BorrowRepository
	assetRepo    *repository.AssetRepository
	emailService *EmailService
}

func NewBorrowService() *BorrowService {
	return &BorrowService{
		repo:      repository.NewBorrowRepository(),
		assetRepo: repository.NewAssetRepository(),
	}
}

type CreateBorrowReq struct {
	AssetUUID     string `json:"asset_uuid" binding:"required"`
	BorrowerName  string `json:"borrower_name" binding:"required"`
	BorrowerEmail string `json:"borrower_email"`
	BorrowerPhone string `json:"borrower_phone"`
	Quantity      int    `json:"quantity" binding:"required,min=1"`
	Remark        string `json:"remark"`
}

// Create 创建借用申请（事务化）
// 1) 校验库存
// 2) 创建借用记录（pending）
// 3) 暂不扣库存——库存仅在 approved 时通过事务扣减
func (s *BorrowService) Create(req *CreateBorrowReq) (*model.BorrowRecord, error) {
	var record *model.BorrowRecord
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		var asset model.Asset
		if err := tx.Where("uuid = ?", req.AssetUUID).First(&asset).Error; err != nil {
			return err
		}
		// 校验当前可用库存（total - pending/approved 数量）
		borrowed, err := s.repo.CountActiveByUUID(req.AssetUUID)
		if err != nil {
			return err
		}
		if asset.Quantity-borrowed < req.Quantity {
			return ErrInsufficientStock
		}
		record = &model.BorrowRecord{
			AssetID:       asset.ID,
			AssetUUID:     req.AssetUUID,
			BorrowerName:  req.BorrowerName,
			BorrowerEmail: req.BorrowerEmail,
			BorrowerPhone: req.BorrowerPhone,
			Quantity:      req.Quantity,
			BorrowDate:    time.Now(),
			Status:        model.BorrowStatusPending,
			Remark:        req.Remark,
		}
		return tx.Create(record).Error
	})
	if err != nil {
		return nil, err
	}
	return s.repo.GetByID(record.ID)
}

func (s *BorrowService) GetByID(id uint) (*model.BorrowRecord, error) {
	return s.repo.GetByID(id)
}

type ListBorrowReq struct {
	Page     int    `form:"page"`
	PageSize int    `form:"page_size" binding:"max=100"`
	Status   string `form:"status"`
	Keyword  string `form:"keyword"`
}

type ListBorrowResp struct {
	Items []model.BorrowRecord `json:"items"`
	Total int64                `json:"total"`
	Page  int                  `json:"page"`
}

func (s *BorrowService) List(req *ListBorrowReq) (*ListBorrowResp, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}
	records, total, err := s.repo.GetAll(req.Page, req.PageSize, req.Status, req.Keyword)
	if err != nil {
		return nil, err
	}
	return &ListBorrowResp{
		Items: records,
		Total: total,
		Page:  req.Page,
	}, nil
}

func (s *BorrowService) GetPending() ([]model.BorrowRecord, error) {
	return s.repo.GetPending()
}

func (s *BorrowService) GetMyRecords(borrowerName string) ([]model.BorrowRecord, error) {
	return s.repo.GetByBorrowerName(borrowerName)
}

type ApproveReq struct {
	ApprovedBy string `json:"approved_by"`
}

// Approve 审批通过：CAS 状态 + 原子扣库存，全部在一个事务内
func (s *BorrowService) Approve(id uint, approvedBy string) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var record model.BorrowRecord
		if err := tx.First(&record, id).Error; err != nil {
			return err
		}
		if record.Status != model.BorrowStatusPending {
			return ErrInvalidStatus
		}
		// 再次校验库存（防止 approve 阶段被并发修改）
		borrowed, err := s.repo.CountActiveByUUID(record.AssetUUID)
		if err != nil {
			return err
		}
		var asset model.Asset
		if err := tx.Where("uuid = ?", record.AssetUUID).First(&asset).Error; err != nil {
			return err
		}
		if asset.Quantity-borrowed < record.Quantity {
			return ErrInsufficientStock
		}
		now := time.Now()
		// CAS 更新
		res := tx.Model(&model.BorrowRecord{}).
			Where("id = ? AND status = ?", id, model.BorrowStatusPending).
			Updates(map[string]interface{}{
				"status":      model.BorrowStatusApproved,
				"approved_by": approvedBy,
				"approved_at": &now,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		// 扣库存
		if _, err := s.assetRepo.DecreaseQuantity(record.AssetUUID, record.Quantity); err != nil {
			return err
		}
		s.sendApprovalEmail(&record, true, "")
		return nil
	})
}

type RejectReq struct {
	ApprovedBy   string `json:"approved_by"`
	RejectReason string `json:"reject_reason" binding:"required"`
}

// Reject 审批拒绝：CAS + 状态切换
func (s *BorrowService) Reject(id uint, req *RejectReq) error {
	var record model.BorrowRecord
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.First(&record, id).Error; err != nil {
			return err
		}
		if record.Status != model.BorrowStatusPending {
			return ErrInvalidStatus
		}
		now := time.Now()
		res := tx.Model(&model.BorrowRecord{}).
			Where("id = ? AND status = ?", id, model.BorrowStatusPending).
			Updates(map[string]interface{}{
				"status":        model.BorrowStatusRejected,
				"approved_by":   req.ApprovedBy,
				"approved_at":   &now,
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
	if err != nil {
		return err
	}
	s.sendApprovalEmail(&record, false, req.RejectReason)
	return nil
}

// Return 归还：CAS 状态 + 恢复库存，全部在一个事务内
func (s *BorrowService) Return(id uint) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var record model.BorrowRecord
		if err := tx.First(&record, id).Error; err != nil {
			return err
		}
		if record.Status != model.BorrowStatusApproved {
			return ErrInvalidStatus
		}
		now := time.Now()
		res := tx.Model(&model.BorrowRecord{}).
			Where("id = ? AND status = ?", id, model.BorrowStatusApproved).
			Updates(map[string]interface{}{
				"status":      model.BorrowStatusReturned,
				"return_date": &now,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		// 恢复库存
		return s.assetRepo.IncreaseQuantity(record.AssetUUID, record.Quantity)
	})
}

// Revoke 撤销借用：CAS 状态；若原状态为 approved 则需先恢复库存
func (s *BorrowService) Revoke(id uint, revokedBy string) error {
	return model.DB.Transaction(func(tx *gorm.DB) error {
		var record model.BorrowRecord
		if err := tx.First(&record, id).Error; err != nil {
			return err
		}
		if record.Status != model.BorrowStatusPending && record.Status != model.BorrowStatusApproved {
			return ErrInvalidStatus
		}
		now := time.Now()
		res := tx.Model(&model.BorrowRecord{}).
			Where("id = ? AND status IN ?", id, []model.BorrowStatus{
				model.BorrowStatusPending, model.BorrowStatusApproved,
			}).
			Updates(map[string]interface{}{
				"status":     model.BorrowStatusRevoked,
				"revoked_at": &now,
				"revoked_by": revokedBy,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return ErrInvalidStatus
		}
		// 若原状态是 approved，库存已被扣减，需恢复
		if record.Status == model.BorrowStatusApproved {
			if err := s.assetRepo.IncreaseQuantity(record.AssetUUID, record.Quantity); err != nil {
				return err
			}
		}
		return nil
	})
}

func (s *BorrowService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *BorrowService) sendApprovalEmail(record *model.BorrowRecord, approved bool, reason string) {
	if record.BorrowerEmail == "" {
		return
	}
	if s.emailService == nil {
		s.emailService = NewEmailService()
	}
	if approved {
		_ = s.emailService.SendBorrowApproval(record.BorrowerEmail, record.AssetUUID, record.AssetUUID, true, reason)
	} else {
		_ = s.emailService.SendBorrowApproval(record.BorrowerEmail, record.AssetUUID, record.AssetUUID, false, reason)
	}
}

// Offline record sync
type OfflineBorrowReq struct {
	AssetUUID     string `json:"asset_uuid" binding:"required"`
	BorrowerName  string `json:"borrower_name" binding:"required"`
	BorrowerPhone string `json:"borrower_phone"`
	Quantity      int    `json:"quantity" binding:"required,min=1"`
	RecordTime    string `json:"record_time"`
}

// SyncOffline 链通：先 tx 内写 offline record → 再 tx 内创建 borrow，原子性保证
func (s *BorrowService) SyncOffline(req *OfflineBorrowReq) error {
	recordTime := time.Now()
	if req.RecordTime != "" {
		if parsedTime, err := time.Parse(time.RFC3339, req.RecordTime); err == nil {
			recordTime = parsedTime
		}
	}

	offlineRecord := &model.OfflineRecord{
		AssetUUID:     req.AssetUUID,
		BorrowerName:  req.BorrowerName,
		BorrowerPhone: req.BorrowerPhone,
		Quantity:      req.Quantity,
		RecordTime:    recordTime,
		Synced:        true,
	}

	return model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(offlineRecord).Error; err != nil {
			return err
		}
		// 在同一事务内创建正式借用记录
		borrowReq := &CreateBorrowReq{
			AssetUUID:     req.AssetUUID,
			BorrowerName:  req.BorrowerName,
			BorrowerPhone: req.BorrowerPhone,
			Quantity:      req.Quantity,
		}
		// 复用 Create 但切换到当前 tx：直接内联实现
		var asset model.Asset
		if err := tx.Where("uuid = ?", borrowReq.AssetUUID).First(&asset).Error; err != nil {
			return err
		}
		borrowed, err := s.repo.CountActiveByUUID(borrowReq.AssetUUID)
		if err != nil {
			return err
		}
		if asset.Quantity-borrowed < borrowReq.Quantity {
			return ErrInsufficientStock
		}
		record := &model.BorrowRecord{
			AssetID:       asset.ID,
			AssetUUID:     borrowReq.AssetUUID,
			BorrowerName:  borrowReq.BorrowerName,
			BorrowerPhone: borrowReq.BorrowerPhone,
			Quantity:      borrowReq.Quantity,
			BorrowDate:    time.Now(),
			Status:        model.BorrowStatusPending,
		}
		return tx.Create(record).Error
	})
}

// Custom errors
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

var (
	ErrInsufficientStock  = &ValidationError{Message: "库存不足"}
	ErrInvalidStatus      = &ValidationError{Message: "状态不允许此操作"}
	ErrAssetInUse         = &ValidationError{Message: "资产存在未完成借用，无法删除"}
	ErrCategoryInUse      = &ValidationError{Message: "分类下还有资产或子分类，无法删除"}
	ErrInvalidQuantity    = &ValidationError{Message: "新数量不能小于已借数量"}
	ErrEmailInvalid       = &ValidationError{Message: "邮箱格式不正确"}
	ErrRoleNotAllowed     = errors.New("角色不允许")
)