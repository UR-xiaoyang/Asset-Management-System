package model

import (
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB(dbPath string) error {
	// 确保目录存在
	dir := os.Getenv("DATA_DIR")
	if dir == "" {
		dir = "."
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// 打开数据库
	var err error
	DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return err
	}

	// 自动迁移
	if err := DB.AutoMigrate(
		&Category{},
		&Asset{},
		&BorrowRecord{},
		&User{},
		&OfflineRecord{},
		&SystemSetting{},
		&Consumption{},
	); err != nil {
		return err
	}

	log.Println("数据库初始化完成")
	return nil
}

// 创建默认管理员账号
func CreateDefaultAdmin() error {
	var count int64
	DB.Model(&User{}).Count(&count)
	if count == 0 {
		// 默认账号: admin / admin123
		admin := User{
			Username:     "admin",
			PasswordHash: HashPassword("admin123"),
			Email:       "admin@example.com",
			Role:        RoleSuperAdmin,
		}
		if err := DB.Create(&admin).Error; err != nil {
			return err
		}
		log.Println("默认管理员账号已创建: admin / admin123")
	}
	return nil
}

// 创建默认分类
func CreateDefaultCategories() error {
	var count int64
	DB.Model(&Category{}).Count(&count)
	if count == 0 {
		categories := []Category{
			{Name: "工具", Label: "工具类", SortOrder: 1},
			{Name: "电子设备", Label: "电子设备类", SortOrder: 2},
			{Name: "办公用品", Label: "办公用品类", SortOrder: 3},
			{Name: "耗材", Label: "耗材类", SortOrder: 4},
		}
		if err := DB.Create(&categories).Error; err != nil {
			return err
		}
		log.Println("默认分类已创建")
	}
	return nil
}

// 创建默认系统设置
func CreateDefaultSettings() error {
	var count int64
	DB.Model(&SystemSetting{}).Count(&count)
	if count == 0 {
		settings := []SystemSetting{
			{Key: "system_name", Value: "实验室资产管理系统", Category: "system", Label: "系统名称"},
			{Key: "lab_name", Value: "实验室", Category: "system", Label: "实验室名称"},
			{Key: "smtp_host", Value: "", Category: "email", Label: "SMTP服务器"},
			{Key: "smtp_port", Value: "587", Category: "email", Label: "SMTP端口"},
			{Key: "smtp_user", Value: "", Category: "email", Label: "SMTP用户名"},
			{Key: "smtp_pass", Value: "", Category: "email", Label: "SMTP密码"},
			{Key: "smtp_from", Value: "", Category: "email", Label: "发件人邮箱"},
			{Key: "smtp_enabled", Value: "false", Category: "email", Label: "启用邮件通知"},
			{Key: "smtp_secure", Value: "false", Category: "email", Label: "使用SSL"},
		}
		if err := DB.Create(&settings).Error; err != nil {
			return err
		}
		log.Println("默认系统设置已创建")
	}
	return nil
}
