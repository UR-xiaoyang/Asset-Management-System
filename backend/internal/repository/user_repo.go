package repository

import (
	"lab-asset-manager/internal/model"
)

type UserRepository struct{}

func NewUserRepository() *UserRepository {
	return &UserRepository{}
}

func (r *UserRepository) GetByUsername(username string) (*model.User, error) {
	var user model.User
	err := model.DB.Where("username = ?", username).First(&user).Error
	return &user, err
}

func (r *UserRepository) Create(user *model.User) error {
	return model.DB.Create(user).Error
}

func (r *UserRepository) GetByID(id uint) (*model.User, error) {
	var user model.User
	err := model.DB.First(&user, id).Error
	return &user, err
}

func (r *UserRepository) GetByName(name string) ([]model.User, error) {
	var users []model.User
	err := model.DB.Where("name = ?", name).Find(&users).Error
	return users, err
}

func (r *UserRepository) GetAll() ([]model.User, error) {
	var users []model.User
	err := model.DB.Order("created_at").Find(&users).Error
	return users, err
}

func (r *UserRepository) GetAllPaginated(page, pageSize int, keyword string) ([]model.User, int64, error) {
	var users []model.User
	var total int64

	query := model.DB.Model(&model.User{})

	if keyword != "" {
		query = query.Where("username LIKE ? OR name LIKE ? OR email LIKE ?", "%"+keyword+"%", "%"+keyword+"%", "%"+keyword+"%")
	}

	// 获取总数
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// 分页查询
	offset := (page - 1) * pageSize
	if err := query.Order("created_at DESC").Offset(offset).Limit(pageSize).Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *UserRepository) Update(user *model.User) error {
	return model.DB.Save(user).Error
}

func (r *UserRepository) Delete(id uint) error {
	return model.DB.Delete(&model.User{}, id).Error
}
