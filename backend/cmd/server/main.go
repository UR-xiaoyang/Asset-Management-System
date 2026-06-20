package main

import (
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"lab-asset-manager/internal/handler"
	"lab-asset-manager/internal/middleware"
	"lab-asset-manager/internal/model"
	"lab-asset-manager/internal/web"

	"github.com/gin-gonic/gin"
)

func main() {
	// 强制要求 JWT_SECRET 配置（无 fallback）
	middleware.MustInitJWTSecret()

	// 初始化数据库
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/lab_asset.db"
	}

	if err := model.InitDB(dbPath); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	// 创建默认数据
	model.CreateDefaultAdmin()
	model.CreateDefaultCategories()
	model.CreateDefaultSettings()

	// 创建Gin实例
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS中间件 - 仅允许受信任的来源
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:3000,http://localhost:8080"
	}
	r.Use(func(c *gin.Context) {
		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}
		// 检查origin是否在白名单中
		allowed := false
		for _, o := range splitOrigins(allowedOrigins) {
			if o == origin {
				allowed = true
				break
			}
		}
		// 生产环境严格模式：不允许 * 通配符
		if os.Getenv("GIN_MODE") == "release" && !allowed {
			c.AbortWithStatusJSON(403, gin.H{"error": "不允许的来源"})
			return
		}
		if allowed {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Approver")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Content-Type")
		c.Header("Access-Control-Allow-Credentials", "true")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// 安全头部中间件
	r.Use(func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Next()
	})

	// 健康检查（公开）
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API路由
	api := r.Group("/api/v1")

	// 公开路由（无需认证，带限流）
	authHandler := handler.NewAuthHandler()
	authPublic := api.Group("")
	authPublic.Use(middleware.RateLimitMiddleware(10, time.Minute)) // 每分钟最多10次尝试
	authHandler.RegisterPublicRoutes(authPublic)

	// 需要认证的路由组（所有已登录用户）
	apiAuth := api.Group("")
	apiAuth.Use(middleware.AuthRequired())
	{
		// 认证（需认证的操作）
		authHandler.RegisterProtectedRoutes(apiAuth)

		// 分类
		categoryHandler := handler.NewCategoryHandler()
		categoryHandler.RegisterRoutes(apiAuth)

		// 资产
		assetHandler := handler.NewAssetHandler()
		assetHandler.RegisterRoutes(apiAuth)

		// 借用记录
		borrowHandler := handler.NewBorrowHandler()
		borrowHandler.RegisterRoutes(apiAuth)

		// 损耗记录
		consumptionHandler := handler.NewConsumptionHandler()
		consumptionHandler.RegisterRoutes(apiAuth)

		// 二维码
		qrHandler := handler.NewQRHandler()
		qrHandler.RegisterRoutes(apiAuth)

		// 批量导入（需管理员）
		importHandler := handler.NewImportHandler()
		importHandler.RegisterRoutes(apiAuth)

		// 用户管理（需超级管理员）
		userHandler := handler.NewUserHandler()
		userHandler.RegisterRoutes(apiAuth)

		// 系统设置
		settingHandler := handler.NewSettingHandler()
		settingHandler.RegisterRoutes(apiAuth)
	}

	// 公开路由：系统初始化状态（无需认证，用于前端判断是否跳转到 /setup）
	setupHandler := handler.NewSetupHandler()
	setupHandler.RegisterRoutes(api.Group(""))

	// 需要管理员权限的路由组（admin + super_admin）
	apiAdmin := api.Group("")
	apiAdmin.Use(middleware.AuthRequired(), middleware.AdminRequired())
	{
		// auth.Register 需要管理员权限
		authHandler.RegisterAdminRoutes(apiAdmin.Group("/auth"))

		// 借用记录删除需要管理员
		borrowHandler := handler.NewBorrowHandler()
		borrowHandler.RegisterAdminRoutes(apiAdmin)

		// 损耗记录删除需要管理员
		consumptionHandler := handler.NewConsumptionHandler()
		consumptionHandler.RegisterAdminRoutes(apiAdmin)
	}

	// 需要超级管理员权限的路由组（仅 super_admin）
	apiSuperAdmin := api.Group("")
	apiSuperAdmin.Use(middleware.AuthRequired(), middleware.SuperAdminRequired())
	{
		// 系统初始化/重置仅超级管理员
		setupHandler := handler.NewSetupHandler()
		setupHandler.RegisterSuperAdminRoutes(apiSuperAdmin)
	}

	registerStaticRoutes(r)

	// 启动服务器
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("服务器启动中，端口: %s", port)
	adminUsername := os.Getenv("ADMIN_USERNAME")
	if adminUsername == "" {
		adminUsername = "admin"
	}
	log.Printf("初始管理员账号: %s", adminUsername)
	log.Printf("数据库路径: %s", dbPath)
	log.Printf("访问地址: http://0.0.0.0:%s", port)

	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("服务器启动失败: %v", err)
	}
}

// splitOrigins 分割 origins 字符串
func splitOrigins(s string) []string {
	var result []string
	for _, part := range splitString(s, ",") {
		part = trimSpace(part)
		if part != "" {
			result = append(result, part)
		}
	}
	return result
}

func splitString(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i <= len(s)-len(sep); i++ {
		if s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func trimSpace(s string) string {
	start, end := 0, len(s)
	for start < end && (s[start] == ' ' || s[start] == '\t') {
		start++
	}
	for end > start && (s[end-1] == ' ' || s[end-1] == '\t') {
		end--
	}
	return s[start:end]
}

func registerStaticRoutes(r *gin.Engine) {
	publicFS := publicFileSystem()
	fileServer := http.FileServer(http.FS(publicFS))

	r.NoRoute(func(c *gin.Context) {
		path := strings.TrimPrefix(c.Request.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		if fileExists(publicFS, path) {
			fileServer.ServeHTTP(c.Writer, c.Request)
			return
		}

		c.Request.URL.Path = "/index.html"
		fileServer.ServeHTTP(c.Writer, c.Request)
	})
}

func publicFileSystem() fs.FS {
	if _, err := os.Stat(filepath.Join("public", "index.html")); err == nil {
		return os.DirFS("public")
	}
	return web.FS()
}

func fileExists(fileSystem fs.FS, path string) bool {
	info, err := fs.Stat(fileSystem, path)
	return err == nil && !info.IsDir()
}
