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
	return r.db.Model(&model.BorrowRecord{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":      model.BorrowStatusApproved,
		"approved_by": approvedBy,
		"approved_at": &now,
	}).Error
}

func (r *BorrowRepository) Reject(id uint, approvedBy string, reason string) error {
	now := time.Now()
	return r.db.Model(&model.BorrowRecord{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":        model.BorrowStatusRejected,
		"approved_by":   approvedBy,
		"approved_at":   &now,
		"reject_reason": reason,
	}).Error
}

func (r *BorrowRepository) Return(id uint) error {
	now := time.Now()
	return r.db.Model(&model.BorrowRecord{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status":      model.BorrowStatusReturned,
		"return_date": &now,
	}).Error
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
