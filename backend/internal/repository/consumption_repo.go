package repository

import (
	"lab-asset-manager/internal/model"

	"gorm.io/gorm"
)

type ConsumptionRepository struct {
	db *gorm.DB
}

func NewConsumptionRepository() *ConsumptionRepository {
	return &ConsumptionRepository{db: model.DB}
}

func (r *ConsumptionRepository) Create(consumption *model.Consumption) error {
	return r.db.Create(consumption).Error
}

func (r *ConsumptionRepository) GetByID(id uint) (*model.Consumption, error) {
	var consumption model.Consumption
	err := r.db.Preload("Asset").First(&consumption, id).Error
	return &consumption, err
}

func (r *ConsumptionRepository) GetByAssetUUID(uuid string) ([]model.Consumption, error) {
	var consumptions []model.Consumption
	err := r.db.Preload("Asset").Where("asset_uuid = ?", uuid).Order("created_at DESC").Find(&consumptions).Error
	return consumptions, err
}

func (r *ConsumptionRepository) GetAll(page, pageSize int, status string, reporterName string) ([]model.Consumption, int64, error) {
	var consumptions []model.Consumption
	var total int64

	query := r.db.Model(&model.Consumption{})
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if reporterName != "" {
		query = query.Where("reporter_name LIKE ?", "%"+reporterName+"%")
	}

	query.Count(&total)
	err := query.Preload("Asset").Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&consumptions).Error
	return consumptions, total, err
}

func (r *ConsumptionRepository) GetPending() ([]model.Consumption, error) {
	var consumptions []model.Consumption
	err := r.db.Preload("Asset").Where("status = ?", model.ConsumptionStatusPending).Order("created_at DESC").Find(&consumptions).Error
	return consumptions, err
}

func (r *ConsumptionRepository) Update(consumption *model.Consumption) error {
	return r.db.Save(consumption).Error
}

func (r *ConsumptionRepository) Delete(id uint) error {
	return r.db.Delete(&model.Consumption{}, id).Error
}

func (r *ConsumptionRepository) GetByReporterName(name string) ([]model.Consumption, error) {
	var consumptions []model.Consumption
	err := r.db.Preload("Asset").Where("reporter_name = ?", name).Order("created_at DESC").Find(&consumptions).Error
	return consumptions, err
}
