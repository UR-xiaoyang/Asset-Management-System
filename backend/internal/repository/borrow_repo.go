package repository

import (
	"lab-asset-manager/internal/model"
	"time"

	"gorm.io/gorm"
)

type BorrowRepository struct {
	db *gorm.DB
}

func NewBorrowRepository() *BorrowRepository {
	return &BorrowRepository{db: model.DB}
}

func (r *BorrowRepository) Create(record *model.BorrowRecord) error {
	return r.db.Create(record).Error
}

func (r *BorrowRepository) GetByID(id uint) (*model.BorrowRecord, error) {
	var record model.BorrowRecord
	err := r.db.Preload("Asset").First(&record, id).Error
	return &record, err
}

func (r *BorrowRepository) GetByUUID(uuid string) (*model.BorrowRecord, error) {
	var record model.BorrowRecord
	err := r.db.Preload("Asset").Where("asset_uuid = ?", uuid).First(&record).Error
	return &record, err
}

func (r *BorrowRepository) GetAll(page, pageSize int, status string, keyword string) ([]model.BorrowRecord, int64, error) {
	var records []model.BorrowRecord
	var total int64

	query := r.db.Model(&model.BorrowRecord{}).Preload("Asset")
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if keyword != "" {
		query = query.Where("borrower_name LIKE ? OR asset_uuid LIKE ? OR remark LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	query.Count(&total)
	err := query.Order("created_at DESC").Offset((page - 1) * pageSize).Limit(pageSize).Find(&records).Error
	return records, total, err
}

func (r *BorrowRepository) GetPending() ([]model.BorrowRecord, error) {
	var records []model.BorrowRecord
	err := r.db.Preload("Asset").Where("status = ?", model.BorrowStatusPending).Order("created_at DESC").Find(&records).Error
	return records, err
}

func (r *BorrowRepository) Approve(id uint, approvedBy string) error {
	now := time.Now()
	// CAS：仅当 status 仍为 pending 时才更新为 approved
	return r.db.Model(&model.BorrowRecord{}).
		Where("id = ? AND status = ?", id, model.BorrowStatusPending).
		Updates(map[string]interface{}{
			"status":      model.BorrowStatusApproved,
			"approved_by": approvedBy,
			"approved_at": &now,
		}).Error
}

func (r *BorrowRepository) Reject(id uint, approvedBy string, reason string) error {
	now := time.Now()
	// CAS：仅当 status 仍为 pending 时才更新为 rejected
	return r.db.Model(&model.BorrowRecord{}).
		Where("id = ? AND status = ?", id, model.BorrowStatusPending).
		Updates(map[string]interface{}{
			"status":        model.BorrowStatusRejected,
			"approved_by":   approvedBy,
			"approved_at":   &now,
			"reject_reason": reason,
		}).Error
}

func (r *BorrowRepository) Return(id uint) error {
	now := time.Now()
	// CAS：仅当 status 为 approved 时才标记为 returned
	return r.db.Model(&model.BorrowRecord{}).
		Where("id = ? AND status = ?", id, model.BorrowStatusApproved).
		Updates(map[string]interface{}{
			"status":      model.BorrowStatusReturned,
			"return_date": &now,
		}).Error
}

// Revoke 撤销借用（管理员撤回/审批拒绝后由用户撤销）
func (r *BorrowRepository) Revoke(id uint, revokedBy string) error {
	now := time.Now()
	// 仅当 status 为 pending/approved 时才能撤销；approved 时需先归还库存（在 service 层处理）
	return r.db.Model(&model.BorrowRecord{}).
		Where("id = ? AND status IN ?", id, []model.BorrowStatus{
			model.BorrowStatusPending, model.BorrowStatusApproved,
		}).
		Updates(map[string]interface{}{
			"status":     model.BorrowStatusRevoked,
			"revoked_at": &now,
			"revoked_by": revokedBy,
		}).Error
}

// CountActiveByUUID 统计某资产当前活跃借用数量（pending/approved）
func (r *BorrowRepository) CountActiveByUUID(uuid string) (int, error) {
	var total int64
	err := r.db.Model(&model.BorrowRecord{}).
		Where("asset_uuid = ? AND status IN ?", uuid, []model.BorrowStatus{
			model.BorrowStatusPending, model.BorrowStatusApproved,
		}).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&total).Error
	return int(total), err
}

func (r *BorrowRepository) Delete(id uint) error {
	return r.db.Delete(&model.BorrowRecord{}, id).Error
}

func (r *BorrowRepository) GetBorrowedQuantity(assetUUID string) (int, error) {
	var total int64
	err := r.db.Model(&model.BorrowRecord{}).
		Where("asset_uuid = ? AND status IN ?", assetUUID, []string{"pending", "approved"}).
		Select("COALESCE(SUM(quantity), 0)").
		Scan(&total).Error
	return int(total), err
}

// Offline sync
func (r *BorrowRepository) SyncOffline(record *model.OfflineRecord) error {
	// 先标记为已同步
	record.Synced = true
	return r.db.Save(record).Error
}

func (r *BorrowRepository) GetOfflinePending() ([]model.OfflineRecord, error) {
	var records []model.OfflineRecord
	err := r.db.Where("synced = ?", false).Find(&records).Error
	return records, err
}

func (r *BorrowRepository) GetByBorrowerName(borrowerName string) ([]model.BorrowRecord, error) {
	var records []model.BorrowRecord
	err := r.db.Preload("Asset").Where("borrower_name = ?", borrowerName).Order("created_at DESC").Find(&records).Error
	return records, err
}

// GetBorrowedQuantitiesByUUIDs 批量查询多个资产的已借数量（解决 N+1）
//   - 返回 map[uuid]int，缺失的 uuid 默认 0
//   - 仅统计 pending/approved 状态
func (r *BorrowRepository) GetBorrowedQuantitiesByUUIDs(uuids []string) (map[string]int, error) {
	type row struct {
		AssetUUID string
		Total     int64
	}
	result := make(map[string]int, len(uuids))
	if len(uuids) == 0 {
		return result, nil
	}
	var rows []row
	err := r.db.Model(&model.BorrowRecord{}).
		Select("asset_uuid, COALESCE(SUM(quantity),0) as total").
		Where("asset_uuid IN ? AND status IN ?", uuids, []model.BorrowStatus{
			model.BorrowStatusPending, model.BorrowStatusApproved,
		}).
		Group("asset_uuid").
		Scan(&rows).Error
	if err != nil {
		return result, err
	}
	for _, r := range rows {
		result[r.AssetUUID] = int(r.Total)
	}
	return result, nil
}
