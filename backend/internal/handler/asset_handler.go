package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"lab-asset-manager/internal/service"
	"lab-asset-manager/pkg/excel"

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

// Export 导出资产
func (h *AssetHandler) Export(c *gin.Context) {
	keyword := c.Query("keyword")
	categoryID := c.Query("category_id")

	var categoryIDUint uint
	if categoryID != "" {
		if id, err := strconv.ParseUint(categoryID, 10, 64); err == nil {
			categoryIDUint = uint(id)
		}
	}

	format := c.DefaultQuery("format", "xlsx")

	items, err := h.svc.ListAll(keyword, categoryIDUint)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	rows := make([]excel.ExportAssetRow, len(items))
	for i, item := range items {
		categoryName := ""
		if item.Category != nil {
			categoryName = item.Category.Name
		}
		rows[i] = excel.ExportAssetRow{
			ID:           int(item.ID),
			UUID:         item.UUID,
			Name:         item.Name,
			CategoryName: categoryName,
			Spec:         item.Spec,
			Quantity:     item.Quantity,
			AvailableQty: item.Quantity, // 导出时默认显示总数量
			Owner:        item.Owner,
			Location:     item.Location,
			RegisteredBy: item.RegisteredBy,
			RegisteredAt: item.RegisteredAt.Format("2006-01-02"),
			CreatedAt:    item.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	filename := fmt.Sprintf("资产导出_%s", time.Now().Format("20060102150405"))
	if format == "csv" {
		filename += ".csv"
		c.Header("Content-Type", "text/csv; charset=utf-8")
	} else {
		filename += ".xlsx"
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename*=UTF-8''%s", filename))

	if err := excel.ExportAssets(c.Writer, rows, filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

// RegisterRoutes 注册路由
func (h *AssetHandler) RegisterRoutes(r *gin.RouterGroup) {
	assets := r.Group("/assets")
	{
		assets.POST("", h.Create)
		assets.GET("", h.List)
		assets.GET("/export", h.Export)
		assets.GET("/:id", h.Get)
		assets.GET("/uuid/:uuid", h.GetByUUID)
		assets.PUT("/:id", h.Update)
		assets.PUT("/batch", h.UpdateBatch)
		assets.POST("/batch/delete", h.DeleteBatch)
		assets.DELETE("/:id", h.Delete)
	}
}
