package model

import (
	"crypto/sha256"
	"encoding/hex"
)

// HashPassword 生成密码哈希 (简化版本)
func HashPassword(password string) string {
	hash := sha256.Sum256([]byte(password + "lab_asset_salt"))
	return hex.EncodeToString(hash[:])
}

// CheckPassword 验证密码
func CheckPassword(password, hash string) bool {
	return HashPassword(password) == hash
}