package service

import (
	"fmt"
	"strings"

	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
	"lab-asset-manager/pkg/excel"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// ImportResult 导入结果
type ImportResult struct {
	Success     int              `json:"success"` // 成功数量
	Failed      int              `json:"failed"`  // 失败数量
	Errors      []ImportRowError `json:"errors"`  // 错误详情
	CategoryMap map[string]uint  // 分类名称->ID映射
}

// ImportRowError 单行错误
type ImportRowError struct {
	Row     int    `json:"row"`     // 行号
	Message string `json:"message"` // 错误信息
}

type ImportService struct {
	db           *gorm.DB
	assetRepo    *repository.AssetRepository
	categoryRepo *repository.CategoryRepository
}

func NewImportService() *ImportService {
	return &ImportService{
		db:           model.DB,
		assetRepo:    repository.NewAssetRepository(),
		categoryRepo: repository.NewCategoryRepository(),
	}
}

// ProcessImport 处理导入
func (s *ImportService) ProcessImport(rows []excel.AssetRow) (*ImportResult, error) {
	result := &ImportResult{
		Errors:      make([]ImportRowError, 0),
		CategoryMap: make(map[string]uint),
	}

	// 预加载所有分类，构建名称->ID映射
	categories, err := s.categoryRepo.GetAll()
	if err == nil {
		for _, cat := range categories {
			result.CategoryMap[cat.Name] = cat.ID
		}
	}

	// 使用事务处理：遇到错误时返回非 nil 触发回滚
	err = s.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			if err := s.validateAndCreateAsset(tx, &row, result); err != nil {
				result.Failed++
				result.Errors = append(result.Errors, ImportRowError{
					Row:     row.RowNum,
					Message: err.Error(),
				})
				// 继续处理下一行，不立即中断
			} else {
				result.Success++
			}
		}
		// 若失败数量过多（超过 50%），认为数据有问题，触发回滚
		if result.Failed > 0 && result.Failed > result.Success {
			return fmt.Errorf("失败行数过多 (%d/%d)，已回滚", result.Failed, result.Failed+result.Success)
		}
		return nil
	})

	return result, err
}

// validateAndCreateAsset 验证并创建资产
func (s *ImportService) validateAndCreateAsset(tx *gorm.DB, row *excel.AssetRow, result *ImportResult) error {
	// 验证必填项
	row.Name = strings.TrimSpace(row.Name)
	if row.Name == "" {
		return fmt.Errorf("资产名称不能为空")
	}

	// 处理分类
	var categoryID *uint
	if row.CategoryName != "" {
		categoryName := strings.TrimSpace(row.CategoryName)
		// 精确匹配（不再用模糊 Contains）
		if catID, ok := result.CategoryMap[categoryName]; ok {
			categoryID = &catID
		} else {
			// 未找到时创建新的顶级分类
			newCat := &model.Category{
				Name: categoryName,
			}
			if err := tx.Create(newCat).Error; err == nil {
				categoryID = &newCat.ID
				result.CategoryMap[categoryName] = newCat.ID
			}
		}
	}

	// 处理数量
	quantity := row.Quantity
	if quantity <= 0 {
		quantity = 1
	}

	// 创建资产
	asset := &model.Asset{
		UUID:         uuid.New().String(),
		Name:         row.Name,
		CategoryID:   categoryID,
		Spec:         row.Spec,
		Quantity:     quantity,
		Owner:        row.Owner,
		Location:     row.Location,
		RegisteredBy: row.RegisteredBy,
	}

	return tx.Create(asset).Error
}
