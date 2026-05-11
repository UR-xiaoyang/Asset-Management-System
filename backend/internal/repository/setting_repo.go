package repository

import (
	"lab-asset-manager/internal/model"
)

type SettingRepository struct{}

func NewSettingRepository() *SettingRepository {
	return &SettingRepository{}
}

func (r *SettingRepository) GetByKey(key string) (*model.SystemSetting, error) {
	var setting model.SystemSetting
	err := model.DB.Where("key = ?", key).First(&setting).Error
	return &setting, err
}

func (r *SettingRepository) GetAll() ([]model.SystemSetting, error) {
	var settings []model.SystemSetting
	err := model.DB.Order("category, id").Find(&settings).Error
	return settings, err
}

func (r *SettingRepository) GetByCategory(category string) ([]model.SystemSetting, error) {
	var settings []model.SystemSetting
	err := model.DB.Where("category = ?", category).Order("id").Find(&settings).Error
	return settings, err
}

func (r *SettingRepository) Update(key string, value string) error {
	return model.DB.Model(&model.SystemSetting{}).Where("key = ?", key).Update("value", value).Error
}

func (r *SettingRepository) UpdateMany(settings map[string]string) error {
	for key, value := range settings {
		if err := model.DB.Model(&model.SystemSetting{}).Where("key = ?", key).Update("value", value).Error; err != nil {
			return err
		}
	}
	return nil
}
