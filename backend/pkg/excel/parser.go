package excel

import (
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

// AssetRow 资产导入行
type AssetRow struct {
	Name         string // 资产名称（必填）
	CategoryName string // 分类名称
	Spec         string // 规格
	Quantity     int    // 数量
	Owner        string // 所有人
	Location     string // 存放位置
	RegisteredBy string // 登记人
	RowNum       int    // 行号（从1开始，用于错误提示）
}

// ParseFile 解析 Excel 或 CSV 文件
func ParseFile(file io.Reader, filename string) ([]AssetRow, error) {
	ext := strings.ToLower(filename)
	if strings.HasSuffix(ext, ".csv") {
		return parseCSV(file)
	}
	return parseExcel(file)
}

// parseCSV 解析 CSV 文件
func parseCSV(r io.Reader) ([]AssetRow, error) {
	reader := csv.NewReader(r)
	reader.TrimLeadingSpace = true

	// 读取表头
	header, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("读取表头失败: %w", err)
	}

	// 构建列索引映射
	colMap := buildColumnMap(header)
	if colMap["name"] == -1 {
		return nil, fmt.Errorf("缺少必填列: 资产名称")
	}

	var rows []AssetRow
	rowNum := 1 // 从1开始，0是表头

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return nil, fmt.Errorf("读取第%d行失败: %w", rowNum+1, err)
		}

		rowNum++
		row := AssetRow{RowNum: rowNum}

		if idx := colMap["name"]; idx >= 0 && idx < len(record) {
			row.Name = strings.TrimSpace(record[idx])
		}
		if idx := colMap["category"]; idx >= 0 && idx < len(record) {
			row.CategoryName = strings.TrimSpace(record[idx])
		}
		if idx := colMap["spec"]; idx >= 0 && idx < len(record) {
			row.Spec = strings.TrimSpace(record[idx])
		}
		if idx := colMap["quantity"]; idx >= 0 && idx < len(record) {
			if qty, err := strconv.Atoi(strings.TrimSpace(record[idx])); err == nil {
				row.Quantity = qty
			}
		}
		if idx := colMap["owner"]; idx >= 0 && idx < len(record) {
			row.Owner = strings.TrimSpace(record[idx])
		}
		if idx := colMap["location"]; idx >= 0 && idx < len(record) {
			row.Location = strings.TrimSpace(record[idx])
		}
		if idx := colMap["registered_by"]; idx >= 0 && idx < len(record) {
			row.RegisteredBy = strings.TrimSpace(record[idx])
		}

		rows = append(rows, row)
	}

	return rows, nil
}

// parseExcel 解析 Excel 文件
func parseExcel(r io.Reader) ([]AssetRow, error) {
	f, err := excelize.OpenReader(r)
	if err != nil {
		return nil, fmt.Errorf("打开Excel文件失败: %w", err)
	}
	defer f.Close()

	sheets := f.GetSheetList()
	if len(sheets) == 0 {
		return nil, fmt.Errorf("Excel文件中没有工作表")
	}

	// 读取第一个sheet
	rows, err := f.GetRows(sheets[0])
	if err != nil {
		return nil, fmt.Errorf("读取工作表失败: %w", err)
	}

	if len(rows) == 0 {
		return nil, fmt.Errorf("工作表为空")
	}

	// 读取表头
	header := rows[0]
	colMap := buildColumnMap(header)
	if colMap["name"] == -1 {
		return nil, fmt.Errorf("缺少必填列: 资产名称")
	}

	var assetRows []AssetRow

	for i, row := range rows[1:] {
		rowNum := i + 2 // 行号从2开始（1是表头）
		asset := AssetRow{RowNum: rowNum}

		getCellValue := func(colIdx int) string {
			if colIdx >= 0 && colIdx < len(row) {
				return strings.TrimSpace(row[colIdx])
			}
			return ""
		}

		asset.Name = getCellValue(colMap["name"])
		asset.CategoryName = getCellValue(colMap["category"])
		asset.Spec = getCellValue(colMap["spec"])
		if qty, err := strconv.Atoi(getCellValue(colMap["quantity"])); err == nil {
			asset.Quantity = qty
		}
		asset.Owner = getCellValue(colMap["owner"])
		asset.Location = getCellValue(colMap["location"])
		asset.RegisteredBy = getCellValue(colMap["registered_by"])

		assetRows = append(assetRows, asset)
	}

	return assetRows, nil
}

// buildColumnMap 根据表头构建列索引映射
func buildColumnMap(header []string) map[string]int {
	m := make(map[string]int)
	for i, col := range header {
		col = strings.TrimSpace(col)
		switch col {
		case "资产名称", "名称", "name":
			m["name"] = i
		case "分类", "分类名称", "category":
			m["category"] = i
		case "规格", "型号", "spec":
			m["spec"] = i
		case "数量", "qty", "quantity":
			m["quantity"] = i
		case "所有人", "owner":
			m["owner"] = i
		case "存放位置", "位置", "location":
			m["location"] = i
		case "登记人", "registered_by":
			m["registered_by"] = i
		}
	}
	return m
}
