package handler

import (
	"net/http"

	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"

	"github.com/gin-gonic/gin"
)

type SettingHandler struct {
	repo *repository.SettingRepository
}

func NewSettingHandler() *SettingHandler {
	return &SettingHandler{
		repo: repository.NewSettingRepository(),
	}
}

type GetSettingsResp struct {
	System []model.SystemSetting `json:"system"`
	Email  []model.SystemSetting `json:"email"`
}

type UpdateSettingsReq struct {
	Settings map[string]string `json:"settings" binding:"required"`
}

// GetSettings 获取所有设置
func (h *SettingHandler) GetSettings(c *gin.Context) {
	settings, err := h.repo.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取设置失败"})
		return
	}

	resp := GetSettingsResp{
		System: []model.SystemSetting{},
		Email:  []model.SystemSetting{},
	}

	for _, s := range settings {
		switch s.Category {
		case "system":
			resp.System = append(resp.System, s)
		case "email":
			resp.Email = append(resp.Email, s)
		}
	}

	c.JSON(http.StatusOK, resp)
}

// UpdateSettings 更新设置
func (h *SettingHandler) UpdateSettings(c *gin.Context) {
	var req UpdateSettingsReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.repo.UpdateMany(req.Settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新设置失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "设置已更新"})
}

// GetEmailSettings 获取邮件配置（用于测试）
func (h *SettingHandler) GetEmailSettings(c *gin.Context) {
	settings, err := h.repo.GetByCategory("email")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取邮件设置失败"})
		return
	}

	result := make(map[string]string)
	for _, s := range settings {
		result[s.Key] = s.Value
	}

	c.JSON(http.StatusOK, result)
}

// RegisterRoutes 注册路由
func (h *SettingHandler) RegisterRoutes(r *gin.RouterGroup) {
	settings := r.Group("/settings")
	{
		settings.GET("", h.GetSettings)
		settings.PUT("", h.UpdateSettings)
		settings.GET("/email", h.GetEmailSettings)
	}
}
