package service

import (
	"html"
	"regexp"
	"strings"

	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"time"

	"github.com/google/uuid"
)

// pathTraversalRegex 检测路径遍历攻击
var pathTraversalRegex = regexp.MustCompile(`(?i)(\.\.[/\\]|%2e%2e[/\\]|\\/|/\\)`)

type AssetService struct {
	repo *repository.AssetRepository
}

func NewAssetService() *AssetService {
	return &AssetService{
		repo: repository.NewAssetRepository(),
	}
}

func timeNow() time.Time {
	return time.Now()
}

// sanitizeInput 对用户输入进行安全过滤
func sanitizeInput(s string) string {
	// HTML转义，防止XSS
	s = html.EscapeString(s)
	// 去除首尾空白
	s = strings.TrimSpace(s)
	return s
}

// validateAssetFields 验证并清理资产字段
func validateAssetFields(name, spec string) error {
	// 检测路径遍历
	if pathTraversalRegex.MatchString(name) || pathTraversalRegex.MatchString(spec) {
		return &AssetValidationError{Field: "spec", Message: "字段包含非法路径遍历字符"}
	}
	return nil
}

// AssetValidationError 资产验证错误
type AssetValidationError struct {
	Field   string
	Message string
}

func (e *AssetValidationError) Error() string {
	return e.Message
}

type CreateAssetReq struct {
	Name          string `json:"name" binding:"required,max=200"`
	CategoryID    *uint  `json:"category_id"`
	Spec          string `json:"spec" binding:"max=200"`
	Quantity      int    `json:"quantity"`
	Owner         string `json:"owner" binding:"max=100"`
	Location      string `json:"location" binding:"max=200"`
	RegisteredBy  string `json:"registered_by" binding:"max=100"`
	RegisteredAt  string `json:"registered_at"`
}

func (s *AssetService) Create(req *CreateAssetReq) (*model.Asset, error) {
	// 清理并验证输入
	req.Name = sanitizeInput(req.Name)
	req.Spec = sanitizeInput(req.Spec)
	req.Owner = sanitizeInput(req.Owner)
	req.Location = sanitizeInput(req.Location)
	req.RegisteredBy = sanitizeInput(req.RegisteredBy)

	// 验证字段长度，防止 DoS
	if len(req.Name) > 200 || len(req.Spec) > 200 || len(req.Owner) > 100 || len(req.Location) > 200 {
		return nil, &AssetValidationError{Field: "input", Message: "输入字段长度超出限制"}
	}

	// 验证字段
	if err := validateAssetFields(req.Name, req.Spec); err != nil {
		return nil, err
	}

	// 禁止危险内容模式
	dangerousPatterns := []string{
		"<script", "<iframe", "<object", "<embed",
		"javascript:", "onerror=", "onload=", "onclick=",
	}
	lowerName := strings.ToLower(req.Name)
	lowerSpec := strings.ToLower(req.Spec)
	for _, pattern := range dangerousPatterns {
		if strings.Contains(lowerName, pattern) || strings.Contains(lowerSpec, pattern) {
			return nil, &AssetValidationError{Field: "name/spec", Message: "字段包含危险内容，已被拦截"}
		}
	}

	asset := &model.Asset{
		UUID:         uuid.New().String(),
		Name:         req.Name,
		CategoryID:   req.CategoryID,
		Spec:         req.Spec,
		Quantity:     req.Quantity,
		Owner:        req.Owner,
		Location:     req.Location,
		RegisteredBy: req.RegisteredBy,
	}
	if req.Quantity <= 0 {
		asset.Quantity = 1
	}
	if req.RegisteredAt != "" {
		asset.RegisteredAt = timeNow()
	}
	if err := s.repo.Create(asset); err != nil {
		return nil, err
	}
	return s.repo.GetByID(asset.ID)
}

func (s *AssetService) GetByID(id uint) (*model.Asset, error) {
	return s.repo.GetByID(id)
}

func (s *AssetService) GetByUUID(uuid string) (*model.Asset, error) {
	return s.repo.GetByUUID(uuid)
}

type ListAssetsReq struct {
	Page       int    `form:"page"`
	PageSize   int    `form:"page_size" binding:"max=100"`
	Keyword    string `form:"keyword" binding:"max=100"`
	CategoryID *uint  `form:"category_id"`
	Status     string `form:"status"`
}

type AssetResponse struct {
	model.Asset
	AvailableQuantity int `json:"available_quantity"`
}

type ListAssetsResp struct {
	Items []AssetResponse `json:"items"`
	Total int64           `json:"total"`
	Page  int             `json:"page"`
}

func (s *AssetService) List(req *ListAssetsReq) (*ListAssetsResp, error) {
	if req.Page <= 0 {
		req.Page = 1
	}
	if req.PageSize <= 0 {
		req.PageSize = 10
	}
	assets, total, err := s.repo.GetAll(req.Page, req.PageSize, req.Keyword, req.CategoryID, req.Status)
	if err != nil {
		return nil, err
	}

	borrowRepo := repository.NewBorrowRepository()
	items := make([]AssetResponse, len(assets))
	for i, asset := range assets {
		borrowedQty, _ := borrowRepo.GetBorrowedQuantity(asset.UUID)
		availableQty := asset.Quantity - borrowedQty
		if availableQty < 0 {
			availableQty = 0
		}
		items[i] = AssetResponse{
			Asset:             asset,
			AvailableQuantity: availableQty,
		}
	}

	return &ListAssetsResp{
		Items: items,
		Total: total,
		Page:  req.Page,
	}, nil
}

type UpdateAssetReq struct {
	Name         string `json:"name" binding:"max=200"`
	CategoryID  *uint  `json:"category_id"`
	Spec        string `json:"spec" binding:"max=200"`
	Quantity    int    `json:"quantity"`
	Owner       string `json:"owner" binding:"max=100"`
	Location    string `json:"location" binding:"max=200"`
	RegisteredBy string `json:"registered_by" binding:"max=100"`
}

func (s *AssetService) Update(id uint, req *UpdateAssetReq) (*model.Asset, error) {
	asset, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}

	// 清理输入
	if req.Name != "" {
		req.Name = sanitizeInput(req.Name)
	}
	if req.Spec != "" {
		req.Spec = sanitizeInput(req.Spec)
	}
	if req.Owner != "" {
		req.Owner = sanitizeInput(req.Owner)
	}
	if req.Location != "" {
		req.Location = sanitizeInput(req.Location)
	}
	if req.RegisteredBy != "" {
		req.RegisteredBy = sanitizeInput(req.RegisteredBy)
	}

	// 验证
	if err := validateAssetFields(req.Name, req.Spec); err != nil {
		return nil, err
	}

	// 危险内容检测
	if req.Name != "" {
		lowerName := strings.ToLower(req.Name)
		dangerous := []string{"<script", "<iframe", "javascript:", "onerror=", "onload="}
		for _, p := range dangerous {
			if strings.Contains(lowerName, p) {
				return nil, &AssetValidationError{Field: "name", Message: "字段包含危险内容"}
			}
		}
	}
	if req.Spec != "" {
		lowerSpec := strings.ToLower(req.Spec)
		for _, p := range []string{"<script", "<iframe", "javascript:", "onerror=", "onload="} {
			if strings.Contains(lowerSpec, p) {
				return nil, &AssetValidationError{Field: "spec", Message: "字段包含危险内容"}
			}
		}
	}

	if req.Name != "" {
		asset.Name = req.Name
	}
	if req.CategoryID != nil {
		asset.CategoryID = req.CategoryID
	}
	if req.Spec != "" {
		asset.Spec = req.Spec
	}
	if req.Quantity > 0 {
		asset.Quantity = req.Quantity
	}
	if req.Owner != "" {
		asset.Owner = req.Owner
	}
	if req.Location != "" {
		asset.Location = req.Location
	}
	if req.RegisteredBy != "" {
		asset.RegisteredBy = req.RegisteredBy
	}
	if err := s.repo.Update(asset); err != nil {
		return nil, err
	}
	return s.repo.GetByID(id)
}

func (s *AssetService) Delete(id uint) error {
	return s.repo.Delete(id)
}

type BatchDeleteReq struct {
	IDs []uint `json:"ids" binding:"required,min=1"`
}

func (s *AssetService) DeleteBatch(req *BatchDeleteReq) (int64, error) {
	if err := s.repo.DeleteBatch(req.IDs); err != nil {
		return 0, err
	}
	return int64(len(req.IDs)), nil
}

type BatchUpdateReq struct {
	IDs        []uint  `json:"ids" binding:"required,min=1"`
	CategoryID *uint   `json:"category_id"`
	Spec       *string `json:"spec"`
	Quantity   *int    `json:"quantity"`
	Owner      *string `json:"owner"`
	Location   *string `json:"location"`
}

func (s *AssetService) UpdateBatch(req *BatchUpdateReq) (int64, error) {
	updates := make(map[string]interface{})

	if req.CategoryID != nil {
		updates["category_id"] = *req.CategoryID
	}
	if req.Spec != nil {
		spec := sanitizeInput(*req.Spec)
		if pathTraversalRegex.MatchString(spec) {
			return 0, &AssetValidationError{Field: "spec", Message: "字段包含非法路径遍历字符"}
		}
		updates["spec"] = spec
	}
	if req.Quantity != nil {
		updates["quantity"] = *req.Quantity
	}
	if req.Owner != nil {
		updates["owner"] = sanitizeInput(*req.Owner)
	}
	if req.Location != nil {
		updates["location"] = sanitizeInput(*req.Location)
	}

	if len(updates) == 0 {
		return 0, nil
	}

	if err := s.repo.UpdateBatch(req.IDs, updates); err != nil {
		return 0, err
	}
	return int64(len(req.IDs)), nil
}
