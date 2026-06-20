package repository

import (
	"lab-asset-manager/internal/model"

	"gorm.io/gorm"
)

type AssetRepository struct {
	db *gorm.DB
}

func NewAssetRepository() *AssetRepository {
	return &AssetRepository{db: model.DB}
}

func (r *AssetRepository) Create(asset *model.Asset) error {
	return r.db.Create(asset).Error
}

func (r *AssetRepository) GetByID(id uint) (*model.Asset, error) {
	var asset model.Asset
	err := r.db.Preload("Category").First(&asset, id).Error
	return &asset, err
}

func (r *AssetRepository) GetByUUID(uuid string) (*model.Asset, error) {
	var asset model.Asset
	err := r.db.Preload("Category").Where("uuid = ?", uuid).First(&asset).Error
	return &asset, err
}

func (r *AssetRepository) GetAll(page, pageSize int, keyword string, categoryID *uint, status string) ([]model.Asset, int64, error) {
	var assets []model.Asset
	var total int64

	query := r.db.Model(&model.Asset{})
	if keyword != "" {
		query = query.Where("name LIKE ? OR owner LIKE ? OR location LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}
	if categoryID != nil {
		query = query.Where("category_id = ?", *categoryID)
	}

	query.Count(&total)
	err := query.Preload("Category").Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&assets).Error
	return assets, total, err
}

func (r *AssetRepository) Update(asset *model.Asset) error {
	return r.db.Save(asset).Error
}

func (r *AssetRepository) Delete(id uint) error {
	return r.db.Delete(&model.Asset{}, id).Error
}

func (r *AssetRepository) DeleteBatch(ids []uint) error {
	return r.db.Delete(&model.Asset{}, "id IN ?", ids).Error
}

func (r *AssetRepository) UpdateBatch(ids []uint, updates map[string]interface{}) error {
	return r.db.Model(&model.Asset{}).Where("id IN ?", ids).Updates(updates).Error
}

// DecreaseQuantity 原子扣减库存；返回 rows affected
//   - 仅当 quantity >= n 时才扣减（避免负数）
//   - rows affected = 0 表示库存不足或资产不存在
func (r *AssetRepository) DecreaseQuantity(uuid string, n int) (int64, error) {
	res := r.db.Model(&model.Asset{}).
		Where("uuid = ? AND quantity >= ?", uuid, n).
		UpdateColumn("quantity", gorm.Expr("quantity - ?", n))
	return res.RowsAffected, res.Error
}

// IncreaseQuantity 原子加回库存
func (r *AssetRepository) IncreaseQuantity(uuid string, n int) error {
	return r.db.Model(&model.Asset{}).
		Where("uuid = ?", uuid).
		UpdateColumn("quantity", gorm.Expr("quantity + ?", n)).Error
}

// CountByCategory 统计引用某分类的资产数量（用于删除前检查）
func (r *AssetRepository) CountByCategory(categoryID uint) (int64, error) {
	var count int64
	err := r.db.Model(&model.Asset{}).
		Where("category_id = ?", categoryID).
		Count(&count).Error
	return count, err
}
