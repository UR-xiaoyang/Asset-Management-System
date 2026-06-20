package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/service"

	"github.com/gin-gonic/gin"
)

type CategoryHandler struct {
	svc *service.CategoryService
}

func NewCategoryHandler() *CategoryHandler {
	return &CategoryHandler{
		svc: service.NewCategoryService(),
	}
}

// Create 创建分类
func (h *CategoryHandler) Create(c *gin.Context) {
	var req service.CreateCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.svc.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建分类失败"})
		return
	}
	c.JSON(http.StatusCreated, category)
}

// Get 获取单个分类
func (h *CategoryHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	category, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "category not found"})
		return
	}
	c.JSON(http.StatusOK, category)
}

// List 获取所有分类
func (h *CategoryHandler) List(c *gin.Context) {
	categories, err := h.svc.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取分类列表失败"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

// GetTree 获取分类树
func (h *CategoryHandler) GetTree(c *gin.Context) {
	tree, err := h.svc.GetTree()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取分类树失败"})
		return
	}
	c.JSON(http.StatusOK, tree)
}

// Update 更新分类
func (h *CategoryHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.UpdateCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.svc.Update(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新分类失败"})
		return
	}
	c.JSON(http.StatusOK, category)
}

// Delete 删除分类
func (h *CategoryHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		// 保留业务错误信息（如"该分类下有资产"）
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// DeleteBatch 批量删除分类
func (h *CategoryHandler) DeleteBatch(c *gin.Context) {
	var req service.BatchDeleteCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "最多支持批量删除100条记录"})
		return
	}

	affected, err := h.svc.DeleteBatch(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted", "affected": affected})
}

// RegisterRoutes 注册路由
func (h *CategoryHandler) RegisterRoutes(r *gin.RouterGroup) {
	categories := r.Group("/categories")
	{
		categories.POST("", h.Create)
		categories.GET("", h.List)
		categories.GET("/tree", h.GetTree)
		categories.GET("/:id", h.Get)
		categories.PUT("/:id", h.Update)
		categories.DELETE("/:id", h.Delete)
		categories.POST("/batch/delete", h.DeleteBatch)
	}
}
