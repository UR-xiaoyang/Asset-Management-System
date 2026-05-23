package service

import (
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"
)

type CategoryService struct {
	repo *repository.CategoryRepository
}

func NewCategoryService() *CategoryService {
	return &CategoryService{
		repo: repository.NewCategoryRepository(),
	}
}

type CreateCategoryReq struct {
	ParentID  *uint  `json:"parent_id"`
	Name      string `json:"name"`
	Label     string `json:"label"`
	SortOrder int    `json:"sort_order"`
}

func (s *CategoryService) Create(req *CreateCategoryReq) (*model.Category, error) {
	category := &model.Category{
		ParentID:  req.ParentID,
		Name:      req.Name,
		Label:     req.Label,
		SortOrder: req.SortOrder,
	}
	if err := s.repo.Create(category); err != nil {
		return nil, err
	}
	return category, nil
}

func (s *CategoryService) GetByID(id uint) (*model.Category, error) {
	return s.repo.GetByID(id)
}

func (s *CategoryService) GetAll() ([]model.Category, error) {
	return s.repo.GetAll()
}

func (s *CategoryService) GetTree() ([]model.Category, error) {
	return s.repo.GetTree()
}

type UpdateCategoryReq struct {
	Name      string `json:"name"`
	Label     string `json:"label"`
	SortOrder int    `json:"sort_order"`
	ParentID  *uint  `json:"parent_id"`
}

func (s *CategoryService) Update(id uint, req *UpdateCategoryReq) (*model.Category, error) {
	category, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	category.Name = req.Name
	category.Label = req.Label
	category.SortOrder = req.SortOrder
	category.ParentID = req.ParentID
	if err := s.repo.Update(category); err != nil {
		return nil, err
	}
	return category, nil
}

func (s *CategoryService) Delete(id uint) error {
	return s.repo.Delete(id)
}

type BatchDeleteCategoryReq struct {
	IDs []uint `json:"ids" binding:"required,min=1"`
}

func (s *CategoryService) DeleteBatch(req *BatchDeleteCategoryReq) (int64, error) {
	if err := s.repo.DeleteBatch(req.IDs); err != nil {
		return 0, err
	}
	return int64(len(req.IDs)), nil
}
