package service

import (
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"time"
)

type ConsumptionService struct {
	repo *repository.ConsumptionRepository
}

func NewConsumptionService() *ConsumptionService {
	return &ConsumptionService{
		repo: repository.NewConsumptionRepository(),
	}
}

type CreateConsumptionReq struct {
	AssetUUID    string `json:"asset_uuid" binding:"required"`
	ReporterName string `json:"reporter_name" binding:"required"`
	ReporterEmail string `json:"reporter_email"`
	ProjectName  string `json:"project_name" binding:"required"`
	Quantity     int    `json:"quantity" binding:"required,min=1"`
	ConsumeDate  string `json:"consume_date"`
	Remark       string `json:"remark"`
}

func (s *ConsumptionService) Create(req *CreateConsumptionReq) (*model.Consumption, error) {
	assetRepo := repository.NewAssetRepository()
	asset, err := assetRepo.GetByUUID(req.AssetUUID)
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
		// 解析日期字符串
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

func (s *ConsumptionService) Approve(id uint, req *ApproveConsumptionReq) error {
	consumption, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if consumption.Status != model.ConsumptionStatusPending {
		return ErrInvalidStatus
	}

	now := time.Now()
	consumption.Status = model.ConsumptionStatusApproved
	consumption.ApprovedBy = req.ApprovedBy
	consumption.ApprovedAt = &now

	return s.repo.Update(consumption)
}

type RejectConsumptionReq struct {
	ApprovedBy   string `json:"approved_by"`
	RejectReason string `json:"reject_reason" binding:"required"`
}

func (s *ConsumptionService) Reject(id uint, req *RejectConsumptionReq) error {
	consumption, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if consumption.Status != model.ConsumptionStatusPending {
		return ErrInvalidStatus
	}

	consumption.Status = model.ConsumptionStatusRejected
	consumption.ApprovedBy = req.ApprovedBy
	consumption.RejectReason = req.RejectReason

	return s.repo.Update(consumption)
}

type CompleteConsumptionReq struct {
	ActualQuantity int    `json:"actual_quantity" binding:"required,min=1"`
	ProjectRecord string `json:"project_record" binding:"required"`
	Remark        string `json:"remark"`
}

func (s *ConsumptionService) Complete(id uint, req *CompleteConsumptionReq) error {
	consumption, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if consumption.Status != model.ConsumptionStatusApproved {
		return ErrInvalidStatus
	}

	consumption.Status = model.ConsumptionStatusCompleted
	consumption.ActualQuantity = req.ActualQuantity
	consumption.ProjectRecord = req.ProjectRecord
	if req.Remark != "" {
		consumption.Remark = req.Remark
	}

	return s.repo.Update(consumption)
}

func (s *ConsumptionService) GetByReporterName(name string) ([]model.Consumption, error) {
	return s.repo.GetByReporterName(name)
}

func (s *ConsumptionService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *ConsumptionService) Revoke(id uint) error {
	consumption, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}

	if consumption.Status != model.ConsumptionStatusApproved && consumption.Status != model.ConsumptionStatusCompleted {
		return ErrInvalidStatus
	}

	consumption.Status = model.ConsumptionStatusPending
	consumption.ApprovedBy = ""
	consumption.ApprovedAt = nil
	consumption.ActualQuantity = 0
	consumption.ProjectRecord = ""

	return s.repo.Update(consumption)
}
