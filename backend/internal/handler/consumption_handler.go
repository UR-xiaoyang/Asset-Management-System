package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/service"

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
	name := c.Query("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}

	items, err := h.svc.GetByReporterName(name)
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

	if err := h.svc.Revoke(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "revoked"})
}

func (h *ConsumptionHandler) RegisterRoutes(r *gin.RouterGroup) {
	consumptions := r.Group("/consumptions")
	{
		consumptions.POST("", h.Create)
		consumptions.GET("", h.List)
		consumptions.GET("/pending", h.GetPending)
		consumptions.GET("/my-records", h.GetMyRecords)
		consumptions.GET("/:id", h.Get)
		consumptions.POST("/:id/approve", h.Approve)
		consumptions.POST("/:id/reject", h.Reject)
		consumptions.POST("/:id/complete", h.Complete)
		consumptions.POST("/:id/revoke", h.Revoke)
		consumptions.DELETE("/:id", h.Delete)
	}
}
