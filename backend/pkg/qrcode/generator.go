package qrcode

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"image/png"

	"github.com/boombuler/barcode"
	"github.com/boombuler/barcode/code128"
	"github.com/google/uuid"
	"github.com/skip2/go-qrcode"
)

// AssetQRData 二维码内容结构
type AssetQRData struct {
	UUID     string `json:"uuid"`
	Name     string `json:"name"`
	Owner    string `json:"owner"`
	Quantity int    `json:"quantity"`
	Date     string `json:"date"`
}

// GenerateQRCode 生成二维码图片
func GenerateQRCode(data *AssetQRData) ([]byte, error) {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return nil, err
	}

	png, err := qrcode.Encode(string(jsonData), qrcode.Medium, 256)
	if err != nil {
		return nil, err
	}
	return png, nil
}

// GenerateQRCodeBase64 生成Base64编码的二维码
func GenerateQRCodeBase64(data *AssetQRData) (string, error) {
	png, err := GenerateQRCode(data)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(png), nil
}

// GenerateBarcode 生成条形码图片 (Code128)
func GenerateBarcode(content string) ([]byte, error) {
	bar, err := code128.Encode(content)
	if err != nil {
		return nil, err
	}

	bounds := bar.Bounds()
	barWidth := bounds.Dx()

	targetWidth := barWidth
	targetHeight := 60

	scaledBar, err := barcode.Scale(bar, targetWidth, targetHeight)
	if err != nil {
		return nil, err
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, scaledBar); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// GenerateBarcodeBase64 生成Base64编码的条形码
func GenerateBarcodeBase64(content string) (string, error) {
	pngBytes, err := GenerateBarcode(content)
	if err != nil {
		return "", err
	}
	return base64.StdEncoding.EncodeToString(pngBytes), nil
}

// GenerateAssetQR 生成资产二维码数据
func GenerateAssetQR(uuid, name, owner string, quantity int) *AssetQRData {
	return &AssetQRData{
		UUID:     uuid,
		Name:     name,
		Owner:    owner,
		Quantity: quantity,
		Date:     fmt.Sprintf("%s", "auto"),
	}
}

// ParseQRData 解析二维码数据
func ParseQRData(qrContent string) (*AssetQRData, error) {
	var data AssetQRData
	if err := json.Unmarshal([]byte(qrContent), &data); err != nil {
		return nil, err
	}
	return &data, nil
}

// NewUUID 生成新的UUID
func NewUUID() string {
	return uuid.New().String()
}
