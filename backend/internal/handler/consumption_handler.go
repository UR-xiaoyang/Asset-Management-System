package handler

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/service"
	"lab-asset-manager/pkg/excel"

	"github.com/gin-gonic/gin"
)

type ConsumptionHandler struct {
	svc *service.ConsumptionService
}

func NewConsumptionHandler() *ConsumptionHandler {
	return &ConsumptionHandler{
		svc: service.NewConsumptionService(),
	}
}

func (h *ConsumptionHandler) Create(c *gin.Context) {
	var req service.CreateConsumptionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	consumption, err := h.svc.Create(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, consumption)
}

func (h *ConsumptionHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	consumption, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "not found"})
		return
	}
	c.JSON(http.StatusOK, consumption)
}

func (h *ConsumptionHandler) List(c *gin.Context) {
	var req service.ListConsumptionReq
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

func (h *ConsumptionHandler) GetPending(c *gin.Context) {
	items, err := h.svc.GetPending()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, items)
}

func (h *ConsumptionHandler) Approve(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// 从 JWT token 获取审批人，禁止从请求体读取
	approvedBy, exists := c.Get("username")
	if !exists {
		approvedBy = "unknown"
	}

	req := &service.ApproveConsumptionReq{ApprovedBy: approvedBy.(string)}

	if err := h.svc.Approve(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

func (h *ConsumptionHandler) Reject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var reqBody struct {
		RejectReason string `json:"reject_reason" binding:"required"`
	}
	if err := c.ShouldBindJSON(&reqBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 从 JWT token 获取审批人信息
	approvedBy, _ := c.Get("username")
	if approvedBy == nil {
		approvedBy = "unknown"
	}

	req := &service.RejectConsumptionReq{
		ApprovedBy:   approvedBy.(string),
		RejectReason: reqBody.RejectReason,
	}

	if err := h.svc.Reject(uint(id), req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "rejected"})
}

func (h *ConsumptionHandler) Complete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.CompleteConsumptionReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.Complete(uint(id), &req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "completed"})
}

func (h *ConsumptionHandler) GetMyRecords(c *gin.Context) {
	// 从 JWT token 获取当前用户名，防止越权
	username, exists := c.Get("username")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
		return
	}

	role, _ := c.Get("role")
	var items []model.Consumption
	var err error

	// 管理员可查询任意用户；普通用户只能查自己
	if role == "super_admin" || role == "admin" {
		name := c.Query("name")
		if name != "" {
			items, err = h.svc.GetByReporterName(name)
		} else {
			items, err = h.svc.GetByReporterName(username.(string))
		}
	} else {
		items, err = h.svc.GetByReporterName(username.(string))
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"records": items})
}

func (h *ConsumptionHandler) Delete(c *gin.Context) {
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

func (h *ConsumptionHandler) Revoke(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// 从 JWT 获取操作人
	revokedBy, exists := c.Get("username")
	if !exists {
		revokedBy = "unknown"
	}

	if err := h.svc.Revoke(uint(id), revokedBy.(string)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "revoked"})
}

func (h *ConsumptionHandler) Export(c *gin.Context) {
	status := c.Query("status")
	reporterName := c.Query("reporter_name")
	format := c.DefaultQuery("format", "xlsx")

	items, err := h.svc.ListForExport(&service.ExportConsumptionReq{
		Status:       status,
		ReporterName: reporterName,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 转换数据
	rows := make([]excel.ExportConsumptionRow, len(items))
	for i, item := range items {
		statusText := string(item.Status)
		switch item.Status {
		case model.ConsumptionStatusPending:
			statusText = "待审批"
		case model.ConsumptionStatusApproved:
			statusText = "已批准"
		case model.ConsumptionStatusRejected:
			statusText = "已拒绝"
		case model.ConsumptionStatusCompleted:
			statusText = "已完成"
		}

		approvedAt := ""
		if item.ApprovedAt != nil {
			approvedAt = item.ApprovedAt.Format("2006-01-02 15:04:05")
		}

		assetName := ""
		if item.Asset != nil {
			assetName = item.Asset.Name
		}

		rows[i] = excel.ExportConsumptionRow{
			ID:             int(item.ID),
			AssetName:      assetName,
			AssetUUID:      item.AssetUUID,
			ReporterName:   item.ReporterName,
			ReporterEmail:  item.ReporterEmail,
			ProjectName:    item.ProjectName,
			Quantity:       item.Quantity,
			ConsumeDate:    item.ConsumeDate.Format("2006-01-02"),
			Status:         statusText,
			ApprovedBy:     item.ApprovedBy,
			ApprovedAt:     approvedAt,
			RejectReason:   item.RejectReason,
			ActualQuantity: item.ActualQuantity,
			ProjectRecord:  item.ProjectRecord,
			Remark:         item.Remark,
			CreatedAt:      item.CreatedAt.Format("2006-01-02 15:04:05"),
		}
	}

	// 设置文件名
	filename := fmt.Sprintf("consumption_export_%s", time.Now().Format("20060102150405"))
	if format == "csv" {
		filename += ".csv"
		c.Header("Content-Type", "text/csv; charset=utf-8")
	} else {
		filename += ".xlsx"
		c.Header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
	}
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename*=UTF-8''%s", filename))

	if err := excel.ExportConsumptions(c.Writer, rows, filename); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
}

func (h *ConsumptionHandler) RegisterRoutes(r *gin.RouterGroup) {
	consumptions := r.Group("/consumptions")
	{
		consumptions.POST("", h.Create)
		consumptions.GET("", h.List)
		consumptions.GET("/pending", h.GetPending)
		consumptions.GET("/my-records", h.GetMyRecords)
		consumptions.GET("/export", h.Export)
		consumptions.GET("/:id", h.Get)
		consumptions.POST("/:id/approve", h.Approve)
		consumptions.POST("/:id/reject", h.Reject)
		consumptions.POST("/:id/complete", h.Complete)
		consumptions.POST("/:id/revoke", h.Revoke)
		// DELETE 需管理员权限，由 main.go 在 apiAdmin 组注册
	}
}

// RegisterAdminRoutes 注册管理员路由（需 AdminRequired 中间件）
func (h *ConsumptionHandler) RegisterAdminRoutes(r *gin.RouterGroup) {
	r.DELETE("/consumptions/:id", h.Delete)
}
