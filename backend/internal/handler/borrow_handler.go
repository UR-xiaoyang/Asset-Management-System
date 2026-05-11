package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/service"

	"github.com/gin-gonic/gin"
)

type BorrowHandler struct {
	svc *service.BorrowService
}

func NewBorrowHandler() *BorrowHandler {
	return &BorrowHandler{
		svc: service.NewBorrowService(),
	}
}

// Create 创建借用记录
func (h *BorrowHandler) Create(c *gin.Context) {
	var req service.CreateBorrowReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	record, err := h.svc.Create(&req)
	if err != nil {
		if _, ok := err.(*service.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, record)
}

// Get 获取单个借用记录
func (h *BorrowHandler) Get(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	record, err := h.svc.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "record not found"})
		return
	}
	c.JSON(http.StatusOK, record)
}

// List 获取借用记录列表
func (h *BorrowHandler) List(c *gin.Context) {
	var req service.ListBorrowReq
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

// GetPending 获取待审批列表
func (h *BorrowHandler) GetPending(c *gin.Context) {
	records, err := h.svc.GetPending()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, records)
}

// GetMyRecords 获取我的借用记录
func (h *BorrowHandler) GetMyRecords(c *gin.Context) {
	borrowerName := c.Query("borrower_name")
	if borrowerName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "borrower_name is required"})
		return
	}
	records, err := h.svc.GetMyRecords(borrowerName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"records": records})
}

// Approve 审批通过
func (h *BorrowHandler) Approve(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// 从请求中获取审批人（实际应该从session/jwt中获取）
	approvedBy := c.GetHeader("X-Approver")
	if approvedBy == "" {
		approvedBy = "admin"
	}

	if err := h.svc.Approve(uint(id), approvedBy); err != nil {
		if _, ok := err.(*service.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "approved"})
}

// Reject 审批拒绝
func (h *BorrowHandler) Reject(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req service.RejectReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.Reject(uint(id), &req); err != nil {
		if _, ok := err.(*service.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "rejected"})
}

// Return 归还
func (h *BorrowHandler) Return(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	if err := h.svc.Return(uint(id)); err != nil {
		if _, ok := err.(*service.ValidationError); ok {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "returned"})
}

// Delete 删除记录
func (h *BorrowHandler) Delete(c *gin.Context) {
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

// SyncOffline 同步离线记录
func (h *BorrowHandler) SyncOffline(c *gin.Context) {
	var req service.OfflineBorrowReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.svc.SyncOffline(&req); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "synced"})
}

// RegisterRoutes 注册路由
func (h *BorrowHandler) RegisterRoutes(r *gin.RouterGroup) {
	borrows := r.Group("/borrows")
	{
		borrows.POST("", h.Create)
		borrows.GET("", h.List)
		borrows.GET("/pending", h.GetPending)
		borrows.GET("/my-records", h.GetMyRecords)
		borrows.GET("/:id", h.Get)
		borrows.POST("/:id/approve", h.Approve)
		borrows.POST("/:id/reject", h.Reject)
		borrows.POST("/:id/return", h.Return)
		borrows.DELETE("/:id", h.Delete)
		borrows.POST("/sync-offline", h.SyncOffline)
	}
}