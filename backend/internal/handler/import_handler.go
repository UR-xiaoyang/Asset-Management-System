package handler

import (
	"net/http"
	"path/filepath"
	"strings"

	"lab-asset-manager/internal/service"
	"lab-asset-manager/pkg/excel"

	"github.com/gin-gonic/gin"
)

type ImportHandler struct {
	svc *service.ImportService
}

func NewImportHandler() *ImportHandler {
	return &ImportHandler{
		svc: service.NewImportService(),
	}
}

// ImportAssets 批量导入资产（需管理员权限）
func (h *ImportHandler) ImportAssets(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请上传文件"})
		return
	}

	// 检查文件大小（限制10MB）
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件大小不能超过10MB"})
		return
	}

	// 验证文件扩展名 - 只允许 .xlsx 和 .xls
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".xlsx" && ext != ".xls" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "仅支持 .xlsx 或 .xls 格式的文件"})
		return
	}

	// 清理文件名，防止路径穿越
	safeName := filepath.Base(file.Filename)
	if safeName == "" || strings.HasPrefix(safeName, ".") {
		safeName = "import.xlsx"
	}

	// 打开文件
	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "无法读取文件"})
		return
	}
	defer f.Close()

	// 解析文件
	rows, err := excel.ParseFile(f, safeName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(rows) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "文件中没有数据"})
		return
	}

	if len(rows) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "单次导入不能超过1000条记录"})
		return
	}

	// 处理导入
	result, err := h.svc.ProcessImport(rows)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "导入失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

// RegisterRoutes 注册路由
func (h *ImportHandler) RegisterRoutes(r *gin.RouterGroup) {
	r.POST("/assets/import", h.ImportAssets)
}
