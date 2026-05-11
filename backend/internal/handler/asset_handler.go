package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/service"

	"github.com/gin-gonic/gin"
)

type AssetHandler struct {
	svc *service.AssetService
}

func NewAssetHandler() *AssetHandler {
	return &AssetHandler{
		svc: service.NewAssetService(),
	}
}

// Create 创建资产
func (h *AssetHandler) Create(c *gin.Context) {
	var req service.CreateAssetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	asset, err := h.svc.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, asset)
}

// Get 获取单个资产
func (h *AssetHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	asset, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "asset not found"})
		return
	}
	c.JSON(http.StatusOK, asset)
}

// GetByUUID 通过UUID获取资产
func (h *AssetHandler) GetByUUID(c *gin.Context) {
	uuid := c.Param("uuid")

	asset, err := h.svc.GetByUUID(uuid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "asset not found"})
		return
	}
	c.JSON(http.StatusOK, asset)
}

// List 获取资产列表
func (h *AssetHandler) List(c *gin.Context) {
	var req service.ListAssetsReq
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.svc.List(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

// Update 更新资产
func (h *AssetHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.UpdateAssetReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	asset, err := h.svc.Update(uint(id), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, asset)
}

// Delete 删除资产
func (h *AssetHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "deleted"})
}

// DeleteBatch 批量删除资产
func (h *AssetHandler) DeleteBatch(c *gin.Context) {
	var req service.BatchDeleteReq
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

// UpdateBatch 批量更新资产
func (h *AssetHandler) UpdateBatch(c *gin.Context) {
	var req service.BatchUpdateReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "最多支持批量更新100条记录"})
		return
	}

	affected, err := h.svc.UpdateBatch(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "updated", "affected": affected})
}

// RegisterRoutes 注册路由
func (h *AssetHandler) RegisterRoutes(r *gin.RouterGroup) {
	assets := r.Group("/assets")
	{
		assets.POST("", h.Create)
		assets.GET("", h.List)
		assets.GET("/:id", h.Get)
		assets.GET("/uuid/:uuid", h.GetByUUID)
		assets.PUT("/:id", h.Update)
		assets.PUT("/batch", h.UpdateBatch)
		assets.POST("/batch/delete", h.DeleteBatch)
		assets.DELETE("/:id", h.Delete)
	}
}