package excel

import (
	"encoding/csv"
	"fmt"
	"io"
	"strings"

	"github.com/xuri/excelize/v2"
)

// ===== 损耗记录导出 =====

// ExportConsumptionRow 导出损耗的行
type ExportConsumptionRow struct {
	ID             int
	AssetName      string
	AssetUUID      string
	ReporterName   string
	ReporterEmail  string
	ProjectName    string
	Quantity       int
	ConsumeDate    string
	Status         string
	ApprovedBy     string
	ApprovedAt     string
	RejectReason   string
	ActualQuantity int
	ProjectRecord  string
	Remark         string
	CreatedAt      string
}

// ExportCSV 导出为 CSV
func ExportCSV(w io.Writer, rows []ExportConsumptionRow) error {
	writer := csv.NewWriter(w)
	writer.Write([]string{
		"ID", "资产名称", "资产UUID", "上报人", "上报人邮箱", "使用项目",
		"损耗数量", "损耗日期", "状态", "审批人", "审批时间",
		"拒绝原因", "实际用量", "项目用量记录", "备注", "创建时间",
	})

	for _, row := range rows {
		writer.Write([]string{
			fmt.Sprintf("%d", row.ID),
			row.AssetName,
			row.AssetUUID,
			row.ReporterName,
			row.ReporterEmail,
			row.ProjectName,
			fmt.Sprintf("%d", row.Quantity),
			row.ConsumeDate,
			row.Status,
			row.ApprovedBy,
			row.ApprovedAt,
			row.RejectReason,
			fmt.Sprintf("%d", row.ActualQuantity),
			row.ProjectRecord,
			row.Remark,
			row.CreatedAt,
		})
	}
	writer.Flush()
	return writer.Error()
}

// ExportExcel 导出为 Excel
func ExportExcel(w io.Writer, rows []ExportConsumptionRow) error {
	f := excelize.NewFile()
	defer f.Close()

	// 创建表头
	headers := []string{
		"ID", "资产名称", "资产UUID", "上报人", "上报人邮箱", "使用项目",
		"损耗数量", "损耗日期", "状态", "审批人", "审批时间",
		"拒绝原因", "实际用量", "项目用量记录", "备注", "创建时间",
	}

	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("Sheet1", cell, header)
	}

	// 写入数据
	for i, row := range rows {
		values := []string{
			fmt.Sprintf("%d", row.ID),
			row.AssetName,
			row.AssetUUID,
			row.ReporterName,
			row.ReporterEmail,
			row.ProjectName,
			fmt.Sprintf("%d", row.Quantity),
			row.ConsumeDate,
			row.Status,
			row.ApprovedBy,
			row.ApprovedAt,
			row.RejectReason,
			fmt.Sprintf("%d", row.ActualQuantity),
			row.ProjectRecord,
			row.Remark,
			row.CreatedAt,
		}
		for j, val := range values {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+2)
			f.SetCellValue("Sheet1", cell, val)
		}
	}

	return f.Write(w)
}

// ExportConsumptions 导出损耗记录（自动选择格式）
func ExportConsumptions(w io.Writer, rows []ExportConsumptionRow, filename string) error {
	ext := strings.ToLower(filename)
	if strings.HasSuffix(ext, ".csv") {
		return ExportCSV(w, rows)
	}
	return ExportExcel(w, rows)
}

// ===== 资产导出 =====

// ExportAssetRow 导出资产行
type ExportAssetRow struct {
	ID           int
	UUID         string
	Name         string
	CategoryName string
	Spec         string
	Quantity     int
	AvailableQty int
	Owner        string
	Location     string
	RegisteredBy string
	RegisteredAt string
	CreatedAt    string
}

// ExportAssetsToExcel 导出资产为 Excel
func ExportAssetsToExcel(w io.Writer, rows []ExportAssetRow) error {
	f := excelize.NewFile()
	defer f.Close()

	sheetName, _ := f.NewSheet("资产列表")
	f.SetActiveSheet(sheetName)

	// 删除默认的 Sheet1
	f.DeleteSheet("Sheet1")

	// 设置表头样式
	headerStyle, _ := f.NewStyle(&excelize.Style{
		Font:      &excelize.Font{Bold: true, Color: "#FFFFFF"},
		Fill:      excelize.Fill{Type: "pattern", Color: []string{"#667eea"}, Pattern: 1},
		Alignment: &excelize.Alignment{Horizontal: "center", Vertical: "center"},
	})
	f.SetCellStyle("资产列表", "A1", "L1", headerStyle)

	// 创建表头
	headers := []string{
		"ID", "UUID", "资产名称", "分类", "规格", "数量", "可用数量",
		"所有人", "存放位置", "登记人", "登记日期", "创建时间",
	}

	for i, header := range headers {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		f.SetCellValue("资产列表", cell, header)
	}

	// 设置列宽
	colWidths := []float64{8, 36, 20, 12, 15, 8, 10, 12, 15, 12, 12, 18}
	for i, width := range colWidths {
		col, _ := excelize.ColumnNumberToName(i + 1)
		f.SetColWidth("资产列表", col, col, width)
	}

	// 写入数据
	for i, row := range rows {
		values := []interface{}{
			row.ID,
			row.UUID,
			row.Name,
			row.CategoryName,
			row.Spec,
			row.Quantity,
			row.AvailableQty,
			row.Owner,
			row.Location,
			row.RegisteredBy,
			row.RegisteredAt,
			row.CreatedAt,
		}
		for j, val := range values {
			cell, _ := excelize.CoordinatesToCellName(j+1, i+2)
			f.SetCellValue("资产列表", cell, val)
		}
	}

	return f.Write(w)
}

// ExportAssetsToCSV 导出资产为 CSV
func ExportAssetsToCSV(w io.Writer, rows []ExportAssetRow) error {
	writer := csv.NewWriter(w)
	writer.Write([]string{
		"ID", "UUID", "资产名称", "分类", "规格", "数量", "可用数量",
		"所有人", "存放位置", "登记人", "登记日期", "创建时间",
	})

	for _, row := range rows {
		writer.Write([]string{
			fmt.Sprintf("%d", row.ID),
			row.UUID,
			row.Name,
			row.CategoryName,
			row.Spec,
			fmt.Sprintf("%d", row.Quantity),
			fmt.Sprintf("%d", row.AvailableQty),
			row.Owner,
			row.Location,
			row.RegisteredBy,
			row.RegisteredAt,
			row.CreatedAt,
		})
	}
	writer.Flush()
	return writer.Error()
}

// ExportAssets 导出资产（自动选择格式）
func ExportAssets(w io.Writer, rows []ExportAssetRow, filename string) error {
	ext := strings.ToLower(filename)
	if strings.HasSuffix(ext, ".csv") {
		return ExportAssetsToCSV(w, rows)
	}
	return ExportAssetsToExcel(w, rows)
}
