package main

import (
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("./data/lab_asset.db"), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// 生成 bcrypt 哈希
	hash, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		log.Fatal(err)
	}

	// 更新 admin 密码
	result := db.Exec("UPDATE users SET password_hash = ? WHERE username = 'admin'", string(hash))
	if result.Error != nil {
		log.Fatal(result.Error)
	}

	fmt.Printf("密码已更新! 新哈希: %s\n", string(hash))

	// 验证
	var storedHash string
	db.Raw("SELECT password_hash FROM users WHERE username = 'admin'").Scan(&storedHash)
	err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte("admin123"))
	if err == nil {
		fmt.Println("密码验证成功!")
	}
}