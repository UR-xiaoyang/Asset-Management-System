package repository

import (
	"lab-asset-manager/internal/model"
	"time"

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

// UpdateStatusWithCAS 状态机 CAS 更新：仅当当前 status 等于 expectedStatus 时才更新
//   - 返回 rows affected；0 表示状态已被并发修改
func (r *ConsumptionRepository) UpdateStatusWithCAS(id uint, expectedStatus, newStatus model.ConsumptionStatus, updates map[string]interface{}) (int64, error) {
	if updates == nil {
		updates = map[string]interface{}{}
	}
	updates["status"] = newStatus
	res := r.db.Model(&model.Consumption{}).
		Where("id = ? AND status = ?", id, expectedStatus).
		Updates(updates)
	return res.RowsAffected, res.Error
}

// Revoke 撤销已批准/已完成的损耗记录（恢复库存）
func (r *ConsumptionRepository) Revoke(id uint, revokedBy string) (int64, error) {
	now := time.Now()
	// CAS：仅当 status 为 approved/completed 时才能撤销
	res := r.db.Model(&model.Consumption{}).
		Where("id = ? AND status IN ?", id, []model.ConsumptionStatus{
			model.ConsumptionStatusApproved, model.ConsumptionStatusCompleted,
		}).
		Updates(map[string]interface{}{
			"status":     model.ConsumptionStatusRevoked,
			"revoked_at": &now,
			"revoked_by": revokedBy,
		})
	return res.RowsAffected, res.Error
}

// UpdateFields 通用字段更新（不改变 status）
func (r *ConsumptionRepository) UpdateFields(id uint, updates map[string]interface{}) error {
	return r.db.Model(&model.Consumption{}).
		Where("id = ?", id).
		Updates(updates).Error
}

func (r *ConsumptionRepository) Delete(id uint) error {
	return r.db.Delete(&model.Consumption{}, id).Error
}

func (r *ConsumptionRepository) GetByReporterName(name string) ([]model.Consumption, error) {
	var consumptions []model.Consumption
	err := r.db.Preload("Asset").Where("reporter_name = ?", name).Order("created_at DESC").Find(&consumptions).Error
	return consumptions, err
}
