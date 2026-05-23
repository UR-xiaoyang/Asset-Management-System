package handler

import (
	"net/http"

	"lab-asset-manager/internal/model"

	"github.com/gin-gonic/gin"
)

type SetupHandler struct{}

func NewSetupHandler() *SetupHandler {
	return &SetupHandler{}
}

type SetupStatus struct {
	Initialized bool   `json:"initialized"`
	HasAdmin    bool   `json:"has_admin"`
	SystemName  string `json:"system_name"`
}

type InitRequest struct {
	AdminUsername string `json:"admin_username" binding:"required,min=3,max=50"`
	AdminPassword string `json:"admin_password" binding:"required,min=6,max=100"`
	SystemName    string `json:"system_name"`
	LabName       string `json:"lab_name"`
}

type InitResponse struct {
	Success   bool   `json:"success"`
	Message   string `json:"message"`
	AdminUser string `json:"admin_user"`
}

func (h *SetupHandler) GetStatus(c *gin.Context) {
	var adminCount int64
	model.DB.Model(&model.User{}).Count(&adminCount)

	systemName := "实验室资产管理系统"
	var setting model.SystemSetting
	if err := model.DB.Where("`key` = ?", "system_name").First(&setting).Error; err == nil {
		systemName = setting.Value
	}

	c.JSON(http.StatusOK, SetupStatus{
		Initialized: adminCount > 0,
		HasAdmin:    adminCount > 0,
		SystemName:  systemName,
	})
}

func (h *SetupHandler) Init(c *gin.Context) {
	var req InitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var adminCount int64
	model.DB.Model(&model.User{}).Count(&adminCount)
	if adminCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "系统已初始化，不能重复初始化"})
		return
	}

	admin := model.User{
		Username:     req.AdminUsername,
		PasswordHash: model.HashPassword(req.AdminPassword),
		Email:        "admin@" + req.AdminUsername + ".local",
		Role:         model.RoleSuperAdmin,
	}
	if err := model.DB.Create(&admin).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建管理员失败: " + err.Error()})
		return
	}

	systemName := req.SystemName
	if systemName == "" {
		systemName = "实验室资产管理系统"
	}
	labName := req.LabName
	if labName == "" {
		labName = "实验室"
	}

	model.DB.Model(&model.SystemSetting{}).Where("`key` = ?", "system_name").Update("value", systemName)
	model.DB.Model(&model.SystemSetting{}).Where("`key` = ?", "lab_name").Update("value", labName)

	if err := model.CreateDefaultCategories(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建默认分类失败"})
		return
	}

	c.JSON(http.StatusOK, InitResponse{
		Success:   true,
		Message:   "系统初始化完成",
		AdminUser: req.AdminUsername,
	})
}

func (h *SetupHandler) Reset(c *gin.Context) {
	var adminCount int64
	model.DB.Model(&model.User{}).Count(&adminCount)
	if adminCount == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "系统尚未初始化"})
		return
	}

	model.DB.Exec("DELETE FROM borrow_records")
	model.DB.Exec("DELETE FROM offline_records")
	model.DB.Exec("DELETE FROM assets")
	model.DB.Exec("DELETE FROM categories")
	model.DB.Exec("DELETE FROM users")

	model.DB.Exec("DELETE FROM system_settings")

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "系统已重置，请重新初始化",
	})
}

func (h *SetupHandler) RegisterRoutes(r *gin.RouterGroup) {
	setup := r.Group("/setup")
	{
		setup.GET("/status", h.GetStatus)
		setup.POST("/init", h.Init)
		setup.POST("/reset", h.Reset)
	}
}
