package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/service"
	"lab-asset-manager/pkg/qrcode"

	"github.com/gin-gonic/gin"
)

type QRHandler struct {
	assetSvc *service.AssetService
}

func NewQRHandler() *QRHandler {
	return &QRHandler{
		assetSvc: service.NewAssetService(),
	}
}

// GenerateQR 生成单个资产的二维码
func (h *QRHandler) GenerateQR(c *gin.Context) {
	uuid := c.Param("uuid")

	asset, err := h.assetSvc.GetByUUID(uuid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "asset not found"})
		return
	}

	qrData := qrcode.GenerateAssetQR(asset.UUID, asset.Name, asset.Owner, asset.Quantity)
	qrBase64, err := qrcode.GenerateQRCodeBase64(qrData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"uuid":    asset.UUID,
		"name":    asset.Name,
		"qr_base64": qrBase64,
	})
}

// GenerateQRByID 通过ID生成二维码
func (h *QRHandler) GenerateQRByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	asset, err := h.assetSvc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "asset not found"})
		return
	}

	qrData := qrcode.GenerateAssetQR(asset.UUID, asset.Name, asset.Owner, asset.Quantity)
	qrBase64, err := qrcode.GenerateQRCodeBase64(qrData)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate QR code"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"uuid":     asset.UUID,
		"name":     asset.Name,
		"qr_base64": qrBase64,
	})
}

// ParseQR 解析二维码内容
func (h *QRHandler) ParseQR(c *gin.Context) {
	var req struct {
		Content string `json:"content" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	data, err := qrcode.ParseQRData(req.Content)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid QR code content"})
		return
	}

	c.JSON(http.StatusOK, data)
}

// GenerateBatchQR 批量生成二维码
func (h *QRHandler) GenerateBatchQR(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids cannot be empty"})
		return
	}

	if len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "最多支持100个资产"})
		return
	}

	items := make([]gin.H, 0, len(req.IDs))
	for _, id := range req.IDs {
		asset, err := h.assetSvc.GetByID(id)
		if err != nil {
			continue // 跳过不存在的资产
		}

		qrData := qrcode.GenerateAssetQR(asset.UUID, asset.Name, asset.Owner, asset.Quantity)
		qrBase64, err := qrcode.GenerateQRCodeBase64(qrData)
		if err != nil {
			continue // 跳过生成失败的
		}

		items = append(items, gin.H{
			"id":        asset.ID,
			"uuid":      asset.UUID,
			"name":      asset.Name,
			"spec":      asset.Spec,
			"quantity":  asset.Quantity,
			"owner":     asset.Owner,
			"category":  "",
			"qr_base64": qrBase64,
			"location":  asset.Location,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// GenerateBatchBarcode 批量生成条形码
func (h *QRHandler) GenerateBatchBarcode(c *gin.Context) {
	var req struct {
		IDs []uint `json:"ids" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
		return
	}

	if len(req.IDs) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ids cannot be empty"})
		return
	}

	if len(req.IDs) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "最多支持100个资产"})
		return
	}

	items := make([]gin.H, 0, len(req.IDs))
	for _, id := range req.IDs {
		asset, err := h.assetSvc.GetByID(id)
		if err != nil {
			continue
		}

		barcodeBase64, err := qrcode.GenerateBarcodeBase64(asset.UUID)
		if err != nil {
			continue
		}

		items = append(items, gin.H{
			"id":            asset.ID,
			"uuid":          asset.UUID,
			"name":          asset.Name,
			"spec":          asset.Spec,
			"quantity":      asset.Quantity,
			"owner":         asset.Owner,
			"category":      "",
			"barcode_base64": barcodeBase64,
			"location":      asset.Location,
		})
	}

	c.JSON(http.StatusOK, gin.H{"items": items})
}

// RegisterRoutes 注册路由
func (h *QRHandler) RegisterRoutes(r *gin.RouterGroup) {
	qr := r.Group("/qr")
	{
		qr.GET("/:uuid", h.GenerateQR)
		qr.GET("/id/:id", h.GenerateQRByID)
		qr.POST("/parse", h.ParseQR)
		qr.POST("/batch", h.GenerateBatchQR)
		qr.POST("/batch/barcode", h.GenerateBatchBarcode)
	}
}