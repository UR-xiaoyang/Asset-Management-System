package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("/tmp/recovered.db"), &gorm.Config{})
	if err != nil {
		fmt.Println("打开数据库失败:", err)
		return
	}

	// 检查各表记录数
	var count int64

	db.Raw("SELECT COUNT(*) FROM users").Scan(&count)
	fmt.Println("用户数:", count)

	// 显示用户数据
	fmt.Println("\n=== 用户数据 ===")
	var users []struct {
		ID           uint
		Username     string
		Name         string
		Role         string
		PasswordHash string
	}
	db.Raw("SELECT id, username, name, role, password_hash FROM users").Scan(&users)
	for _, u := range users {
		fmt.Printf("ID:%d 用户名:%s 姓名:%s 角色:%s 密码哈希:%s\n", u.ID, u.Username, u.Name, u.Role, u.PasswordHash)
	}

	// 测试 admin 密码
	fmt.Println("\n=== 测试 admin 密码 ===")
	var adminHash string
	db.Raw("SELECT password_hash FROM users WHERE username = 'admin'").Scan(&adminHash)
	fmt.Printf("admin hash: %s\n", adminHash)

	// 尝试用 bcrypt 验证
	hashBytes := []byte(adminHash)
	err = bcrypt.CompareHashAndPassword(hashBytes, []byte("admin123"))
	if err == nil {
		fmt.Println("admin123 验证成功!")
	} else {
		fmt.Println("admin123 验证失败:", err)
	}
}