package handler

import (
	"net/http"
	"net/mail"
	"time"

	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/repository"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthHandler struct {
	userRepo *repository.UserRepository
}

func NewAuthHandler() *AuthHandler {
	return &AuthHandler{
		userRepo: repository.NewUserRepository(),
	}
}

type LoginReq struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResp struct {
	Token    string     `json:"token"`
	User     model.User `json:"user"`
	ExpireAt time.Time  `json:"expire_at"`
}

// Login 登录（公开）
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginReq
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.userRepo.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if !model.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	// 使用 JWT token
	token, expireAt, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token生成失败"})
		return
	}

	c.JSON(http.StatusOK, LoginResp{
		Token:    token,
		User:     *user,
		ExpireAt: expireAt,
	})
}

// Register 注册（需管理员权限，路由层已加 AdminRequired 中间件）
func (h *AuthHandler) Register(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required,min=6"`
		Email    string `json:"email"`
		Role     string `json:"role"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 邮箱格式校验（若提供）
	if req.Email != "" {
		if _, err := mail.ParseAddress(req.Email); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "邮箱格式不正确"})
			return
		}
	}

	// 检查用户名是否已存在
	if _, err := h.userRepo.GetByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
		return
	}

	// 角色白名单：仅允许创建 admin/super_admin（visitor 通过公开接口注册）
	role := model.RoleAdmin
	if req.Role == "super_admin" {
		role = model.RoleSuperAdmin
	} else if req.Role == "visitor" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "不允许通过此接口创建 visitor，请使用 /auth/visitor-register"})
		return
	}

	user := &model.User{
		Username:     req.Username,
		PasswordHash: model.HashPassword(req.Password),
		Email:        req.Email,
		Role:         role,
	}

	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// VisitorRegister 访客注册（公开）
func (h *AuthHandler) VisitorRegister(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Name     string `json:"name" binding:"required"`
		Phone    string `json:"phone"`
		Email    string `json:"email"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请填写用户名、姓名和密码"})
		return
	}

	// 检查用户名是否已存在
	if _, err := h.userRepo.GetByUsername(req.Username); err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "用户名已存在"})
		return
	}

	visitorUUID := uuid.New().String()

	user := &model.User{
		UUID:         visitorUUID,
		Username:     req.Username,
		PasswordHash: model.HashPassword(req.Password),
		Name:         req.Name,
		Phone:        req.Phone,
		Email:        req.Email,
		Role:         model.RoleVisitor,
	}

	if err := h.userRepo.Create(user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "注册失败"})
		return
	}

	// 自动登录
	token, expireAt, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token生成失败"})
		return
	}

	c.JSON(http.StatusCreated, LoginResp{
		Token:    token,
		User:     *user,
		ExpireAt: expireAt,
	})
}

// VisitorLogin 访客登录（公开）
func (h *AuthHandler) VisitorLogin(c *gin.Context) {
	var req struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请输入用户名和密码"})
		return
	}

	user, err := h.userRepo.GetByUsername(req.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	if user.Role != model.RoleVisitor {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "该账号不是访客账号"})
		return
	}

	if !model.CheckPassword(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名或密码错误"})
		return
	}

	token, expireAt, err := middleware.GenerateToken(user.ID, user.Username, string(user.Role))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "token生成失败"})
		return
	}

	c.JSON(http.StatusOK, LoginResp{
		Token:    token,
		User:     *user,
		ExpireAt: expireAt,
	})
}

// GetCurrentUser 获取当前用户（需认证）
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not logged in"})
		return
	}

	user, err := h.userRepo.GetByID(userID.(uint))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// RegisterPublicRoutes 注册公开路由（无需认证）
func (h *AuthHandler) RegisterPublicRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.POST("/login", h.Login)
		auth.POST("/visitor-register", h.VisitorRegister)
		auth.POST("/visitor-login", h.VisitorLogin)
	}
}

// RegisterProtectedRoutes 注册受保护的路由（需认证）
func (h *AuthHandler) RegisterProtectedRoutes(r *gin.RouterGroup) {
	auth := r.Group("/auth")
	{
		auth.GET("/me", h.GetCurrentUser)
	}
}

// RegisterAdminRoutes 注册管理员路由（需 AdminRequired 中间件）
func (h *AuthHandler) RegisterAdminRoutes(r *gin.RouterGroup) {
	r.POST("/register", h.Register)
}
