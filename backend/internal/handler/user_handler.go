package handler

import (
	"net/http"
	"strconv"

	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	userRepo *repository.UserRepository
}

func NewUserHandler() *UserHandler {
	return &UserHandler{
		userRepo: repository.NewUserRepository(),
	}
}

type UserListResp struct {
	Items []model.User `json:"items"`
	Total int64        `json:"total"`
	Page  int          `json:"page"`
}

type CreateUserReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Role     string `json:"role"`
}

type UpdateUserReq struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Phone string `json:"phone"`
	Role  string `json:"role"`
}

// List 获取用户列表（需管理员）
func (h *UserHandler) List(c *gin.Context) {
	// 权限检查
	role, _ := c.Get("role")
	if role != "super_admin" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	users, total, err := h.userRepo.GetAllPaginated(page, pageSize, keyword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取用户列表失败"})
		return
	}

	c.JSON(http.StatusOK, UserListResp{
		Items: users,
		Total: total,
		Page:  page,
	})
}

// Get 获取单个用户（需管理员）
func (h *UserHandler) Get(c *gin.Context) {
	role, _ := c.Get("role")
	if role != "super_admin" && role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要管理员权限"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	user, err := h.userRepo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// Create 创建用户（需超级管理员）
func (h *UserHandler) Create(c *gin.Context) {
	// 权限检查
	role, _ := c.Get("role")
	if role != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要超级管理员权限"})
		return
	}

	var req CreateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 检查用户名是否已存在
	if _, err := h.userRepo.GetByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
		return
	}

	roleEnum := model.RoleAdmin
	switch req.Role {
	case "super_admin":
		roleEnum = model.RoleSuperAdmin
	case "visitor":
		roleEnum = model.RoleVisitor
	}

	user := &model.User{
		Username:     req.Username,
		PasswordHash: model.HashPassword(req.Password),
		Name:         req.Name,
		Email:        req.Email,
		Phone:        req.Phone,
		Role:         roleEnum,
	}

	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "创建用户失败"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// Update 更新用户（需超级管理员）
func (h *UserHandler) Update(c *gin.Context) {
	// 权限检查
	roleVal, _ := c.Get("role")
	if roleVal != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要超级管理员权限"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	var req UpdateUserReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if req.Name != "" {
		user.Name = req.Name
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Phone != "" {
		user.Phone = req.Phone
	}
	if req.Role != "" {
		switch req.Role {
		case "super_admin":
			user.Role = model.RoleSuperAdmin
		case "admin":
			user.Role = model.RoleAdmin
		case "visitor":
			user.Role = model.RoleVisitor
		}
	}

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "更新用户失败"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// Delete 删除用户（需超级管理员）
func (h *UserHandler) Delete(c *gin.Context) {
	// 权限检查
	roleVal, _ := c.Get("role")
	if roleVal != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要超级管理员权限"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	// 不允许删除自己
	currentUserID, exists := c.Get("user_id")
	if exists && currentUserID.(uint) == uint(id) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不能删除自己"})
		return
	}

	user, err := h.userRepo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	if user.Role == model.RoleSuperAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "不能删除超级管理员"})
		return
	}

	if err := h.userRepo.Delete(uint(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "删除用户失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// ResetPassword 重置密码（需超级管理员）
func (h *UserHandler) ResetPassword(c *gin.Context) {
	// 权限检查
	roleVal, _ := c.Get("role")
	if roleVal != "super_admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "需要超级管理员权限"})
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的用户ID"})
		return
	}

	user, err := h.userRepo.GetByID(uint(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "用户不存在"})
		return
	}

	defaultPassword := "123456"
	user.PasswordHash = model.HashPassword(defaultPassword)

	if err := h.userRepo.Update(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "重置密码失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "密码已重置为123456"})
}

// RegisterRoutes 注册路由
func (h *UserHandler) RegisterRoutes(r *gin.RouterGroup) {
	users := r.Group("/users")
	{
		users.GET("", middleware.AdminRequired(), h.List)
		users.GET("/:id", middleware.AdminRequired(), h.Get)
		users.POST("", middleware.SuperAdminRequired(), h.Create)
		users.PUT("/:id", middleware.SuperAdminRequired(), h.Update)
		users.DELETE("/:id", middleware.SuperAdminRequired(), h.Delete)
		users.POST("/:id/reset-password", middleware.SuperAdminRequired(), h.ResetPassword)
	}
}

// AuthorizeMiddleware 角色授权中间件
func AuthorizeMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "未登录"})
			c.Abort()
			return
		}
		roleStr := role.(string)
		for _, r := range allowedRoles {
			if roleStr == r {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, gin.H{"error": "权限不足"})
		c.Abort()
	}
}
