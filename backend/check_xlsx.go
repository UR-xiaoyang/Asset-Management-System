package main

import (
	"fmt"
	"github.com/xuri/excelize/v2"
)

func main() {
	f, err := excelize.OpenFile("/tmp/assets_export.xlsx")
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer f.Close()

	sheets := f.GetSheetList()
	fmt.Println("工作表:", sheets)

	for _, sheet := range sheets {
		rows, _ := f.GetRows(sheet)
		fmt.Printf("表 '%s' 行数: %d\n", sheet, len(rows))
		if len(rows) > 0 {
			fmt.Println("表头:", rows[0])
		}
		if len(rows) > 1 {
			fmt.Println("第一行数据:", rows[1])
		}
	}
}