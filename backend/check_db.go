package main

import (
	"fmt"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func main() {
	db, err := gorm.Open(sqlite.Open("./data/lab_asset.db"), &gorm.Config{})
	if err != nil {
		fmt.Println("打开数据库失败:", err)
		return
	}

	var tables []string
	db.Raw("SELECT name FROM sqlite_master WHERE type='table'").Scan(&tables)
	fmt.Println("表:", tables)

	var count int64
	db.Raw("SELECT COUNT(*) FROM users").Scan(&count)
	fmt.Println("用户数:", count)

	db.Raw("SELECT COUNT(*) FROM assets").Scan(&count)
	fmt.Println("资产数:", count)

	db.Raw("SELECT COUNT(*) FROM consumptions").Scan(&count)
	fmt.Println("损耗记录数:", count)
}