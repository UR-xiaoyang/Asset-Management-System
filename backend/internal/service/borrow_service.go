package service

import (
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"log"
	"strconv"
	"time"
)

type BorrowService struct {
	repo        *repository.BorrowRepository
	assetRepo   *repository.AssetRepository
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

func (s *BorrowService) Create(req *CreateBorrowReq) (*model.BorrowRecord, error) {
	// 查找资产
	asset, err := s.assetRepo.GetByUUID(req.AssetUUID)
	if err != nil {
		return nil, err
	}

	// 检查库存
	if asset.Quantity < req.Quantity {
		return nil, ErrInsufficientStock
	}

	record := &model.BorrowRecord{
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

	if err := s.repo.Create(record); err != nil {
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

func (s *BorrowService) Approve(id uint, approvedBy string) error {
	record, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if record.Status != model.BorrowStatusPending {
		return ErrInvalidStatus
	}
	if err := s.repo.Approve(id, approvedBy); err != nil {
		return err
	}
	// 发送邮件通知
	s.sendApprovalEmail(record, true, "")
	return nil
}

type RejectReq struct {
	ApprovedBy  string `json:"approved_by"`
	RejectReason string `json:"reject_reason" binding:"required"`
}

func (s *BorrowService) Reject(id uint, req *RejectReq) error {
	record, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if record.Status != model.BorrowStatusPending {
		return ErrInvalidStatus
	}
	if err := s.repo.Reject(id, req.ApprovedBy, req.RejectReason); err != nil {
		return err
	}
	// 发送邮件通知
	s.sendApprovalEmail(record, false, req.RejectReason)
	return nil
}

func (s *BorrowService) Return(id uint) error {
	record, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if record.Status != model.BorrowStatusApproved {
		return ErrInvalidStatus
	}
	return s.repo.Return(id)
}

func (s *BorrowService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *BorrowService) sendApprovalEmail(record *model.BorrowRecord, approved bool, reason string) {
	if record.BorrowerEmail == "" {
		return
	}
	var subject, body string
	if approved {
		subject = "借用申请已通过"
		body = "您的借用申请已通过，资产: " + record.AssetUUID + ", 数量: " + strconv.Itoa(record.Quantity)
	} else {
		subject = "借用申请被拒绝"
		body = "您的借用申请被拒绝，原因: " + reason
	}
	log.Printf("[Email] To: %s, Subject: %s, Body: %s", record.BorrowerEmail, subject, body)
}

// Offline record sync
type OfflineBorrowReq struct {
	AssetUUID     string `json:"asset_uuid" binding:"required"`
	BorrowerName  string `json:"borrower_name" binding:"required"`
	BorrowerPhone string `json:"borrower_phone"`
	Quantity      int    `json:"quantity" binding:"required,min=1"`
	RecordTime    string `json:"record_time"`
}

func (s *BorrowService) SyncOffline(req *OfflineBorrowReq) error {
	recordTime := time.Now()
	if req.RecordTime != "" {
		// 解析时间字符串
		parsedTime, err := time.Parse(time.RFC3339, req.RecordTime)
		if err == nil {
			recordTime = parsedTime
		}
	}

	offlineRecord := &model.OfflineRecord{
		AssetUUID:     req.AssetUUID,
		BorrowerName:  req.BorrowerName,
		BorrowerPhone: req.BorrowerPhone,
		Quantity:      req.Quantity,
		RecordTime:    recordTime,
	}

	// 保存离线记录
	if err := model.DB.Create(offlineRecord).Error; err != nil {
		return err
	}

	// 自动创建正式借用记录
	borrowReq := &CreateBorrowReq{
		AssetUUID:     req.AssetUUID,
		BorrowerName:  req.BorrowerName,
		BorrowerPhone: req.BorrowerPhone,
		Quantity:      req.Quantity,
	}
	_, err := s.Create(borrowReq)
	return err
}

// Custom errors
type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

var (
	ErrInsufficientStock = &ValidationError{Message: "库存不足"}
	ErrInvalidStatus     = &ValidationError{Message: "状态不允许此操作"}
)