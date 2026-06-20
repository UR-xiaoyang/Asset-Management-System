package repository

import (
	"lab-asset-manager/internal/model"

	"gorm.io/gorm"
)

type CategoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository() *CategoryRepository {
	return &CategoryRepository{db: model.DB}
}

func (r *CategoryRepository) Create(category *model.Category) error {
	return r.db.Create(category).Error
}

func (r *CategoryRepository) GetByID(id uint) (*model.Category, error) {
	var category model.Category
	err := r.db.First(&category, id).Error
	return &category, err
}

func (r *CategoryRepository) GetAll() ([]model.Category, error) {
	var categories []model.Category
	err := r.db.Order("sort_order").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) GetTree() ([]model.Category, error) {
	var categories []model.Category
	err := r.db.Where("parent_id IS NULL").Preload("Children").Order("sort_order").Find(&categories).Error
	return categories, err
}

func (r *CategoryRepository) Update(category *model.Category) error {
	return r.db.Save(category).Error
}

func (r *CategoryRepository) Delete(id uint) error {
	// 软删除：配合 model.Category 上的 gorm.DeletedAt 自动过滤已删记录
	return r.db.Delete(&model.Category{}, id).Error
}

func (r *CategoryRepository) DeleteBatch(ids []uint) error {
	return r.db.Delete(&model.Category{}, "id IN ?", ids).Error
}

// HasChildren 检查是否有子分类
func (r *CategoryRepository) HasChildren(parentID uint) (bool, error) {
	var count int64
	err := r.db.Model(&model.Category{}).
		Where("parent_id = ?", parentID).
		Count(&count).Error
	return count > 0, err
}
