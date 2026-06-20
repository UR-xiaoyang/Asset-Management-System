import { useEffect, useState, useRef } from 'react'
import { Modal, Button, Spin, Empty, Select, Space, App } from 'antd'
import { PrinterOutlined, DownloadOutlined } from '@ant-design/icons'
import { qrAPI } from '../services/api'

const jsPDFModule = () => import('jspdf')
const html2canvasModule = () => import('html2canvas')

interface LabelItem {
  id: number
  uuid: string
  name: string
  spec?: string
  quantity: number
  owner?: string
  qr_base64?: string
  barcode_base64?: string
  location?: string
}

interface PrintLabelModalProps {
  open: boolean
  onClose: () => void
  assetIds: number[]
}

// 预设标签尺寸
const LABEL_PRESETS = [
  { label: '40x20mm (小标签-条形码)', width: 40, height: 20, cols: 4, useBarcode: true },
  { label: '50x25mm (标准)', width: 50, height: 25, cols: 4, useBarcode: false },
  { label: '50x30mm', width: 50, height: 30, cols: 4, useBarcode: false },
  { label: '60x40mm', width: 60, height: 40, cols: 2, useBarcode: false },
  { label: '70x25mm', width: 70, height: 25, cols: 3, useBarcode: false },
  { label: '70x35mm', width: 70, height: 35, cols: 3, useBarcode: false },
  { label: '90x40mm (标准)', width: 90, height: 40, cols: 2, useBarcode: false },
  { label: '100x50mm (大标签)', width: 100, height: 50, cols: 2, useBarcode: false },
  { label: '自定义', width: 0, height: 0, cols: 2, useBarcode: false },
]

export default function PrintLabelModal({ open, onClose, assetIds }: PrintLabelModalProps) {
  const [loading, setLoading] = useState(false)
  const [labels, setLabels] = useState<LabelItem[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string>('90x40mm')
  const [customWidth, setCustomWidth] = useState<number>(90)
  const [customHeight, setCustomHeight] = useState<number>(40)
  const [exporting, setExporting] = useState(false)
  const labelRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const abortControllerRef = useRef<AbortController | null>(null)
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    if (open && assetIds.length > 0) {
      setLabels([])
      loadLabels()
    }

    return () => {
      // cleanup: 取消未完成的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [open, assetIds, selectedPreset])

  useEffect(() => {
    if (labels.length === 0) {
      labelRefs.current.clear()
    }
  }, [labels])

  const loadLabels = async () => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setLoading(true)
    try {
      const size = getCurrentSize()
      let res
      if (size.useBarcode) {
        res = await qrAPI.generateBatchBarcode(assetIds)
      } else {
        res = await qrAPI.generateBatch(assetIds)
      }

      // 检查是否已被取消
      if (controller.signal.aborted) return

      setLabels(res.data.items)
    } catch (error) {
      if (controller.signal.aborted) return
      console.error('Failed to load labels:', error)
      setLabels([])
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
      abortControllerRef.current = null
    }
  }

  const getCurrentSize = () => {
    const preset = LABEL_PRESETS.find(p => p.label === selectedPreset)
    if (preset && preset.width > 0) {
      return preset
    }
    const isSmall = customWidth <= 40 || customHeight <= 20
    return { label: '自定义', width: customWidth, height: customHeight, cols: 2, useBarcode: isSmall }
  }

  const handlePrint = () => {
    window.print()
  }

  // 导出 PDF - 使用固定尺寸渲染确保清晰度
  const handleExportPDF = async () => {
    if (labels.length === 0) return

    setExporting(true)
    try {
      const [jsPDF, html2canvas] = await Promise.all([
        jsPDFModule(),
        html2canvasModule(),
      ])

      const { jsPDF: JsPDF } = jsPDF
      const html2canvasFn = html2canvas.default || html2canvas

      const size = getCurrentSize()

      // 创建临时容器
      const tempContainer = document.createElement('div')
      tempContainer.style.cssText = 'position: fixed; left: 0; top: 0; background: white; z-index: -1; overflow: hidden;'
      document.body.appendChild(tempContainer)

      // 根据标签实际尺寸计算渲染尺寸（保持 10px/mm 的清晰度）
      const RENDER_WIDTH = size.width * 10
      const RENDER_HEIGHT = size.height * 10
      const QR_SIZE = RENDER_WIDTH * 0.55
      const FONT_SIZE = size.useBarcode ? RENDER_HEIGHT * 0.12 : RENDER_HEIGHT * 0.1

      const pdf = new JsPDF({
        orientation: size.width > size.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [size.width, size.height],
      })

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i]

        // 条形码尺寸：占标签宽度的85%，高度适当
        const BARCODE_WIDTH = size.useBarcode ? RENDER_WIDTH * 0.85 : 300
        const BARCODE_HEIGHT = size.useBarcode ? RENDER_HEIGHT * 0.5 : 80

        // 创建标签元素
        const labelEl = document.createElement('div')
        labelEl.style.cssText = `
          width: ${RENDER_WIDTH}px;
          height: ${RENDER_HEIGHT}px;
          padding: ${RENDER_WIDTH * 0.02}px;
          box-sizing: border-box;
          border: ${RENDER_WIDTH * 0.005}px solid #000000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: ${RENDER_HEIGHT * 0.02}px;
          font-size: ${FONT_SIZE}px;
          font-family: "Microsoft YaHei", "PingFang SC", "SimHei", sans-serif;
          color: #000000;
          background: #ffffff;
        `

        const codeImg = size.useBarcode
          ? `<img src="data:image/png;base64,${label.barcode_base64}" style="width: ${BARCODE_WIDTH}px; height: ${BARCODE_HEIGHT}px; object-fit: contain;" />`
          : `<div style="width: ${QR_SIZE}px; height: ${RENDER_HEIGHT * 0.6}px; flex-shrink: 0; border: 1px solid #000000; padding: 5px; box-sizing: border-box; background: #ffffff;">
              <img src="data:image/png;base64,${label.qr_base64}" style="width: 100%; height: 100%; object-fit: contain;" />
            </div>`

        let labelContent: string
        if (size.useBarcode) {
          // 条形码模式：上下排列
          labelContent = `
            <div style="display: flex; flex-direction: column; align-items: center; width: 100%; gap: ${RENDER_HEIGHT * 0.02}px;">
              ${codeImg}
              <div style="width: 100%; display: flex; flex-direction: column; justify-content: center; overflow: hidden; color: #000000; text-align: center;">
                <div style="font-weight: bold; margin-bottom: ${FONT_SIZE * 0.2}px; text-align: center; font-size: ${FONT_SIZE * 1.2}px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000000;">${label.name}</div>
                <div style="margin-bottom: ${FONT_SIZE * 0.1}px; text-align: center; font-size: ${FONT_SIZE * 0.7}px; color: #000000;">规格: ${label.spec || '-'}</div>
                <div style="margin-bottom: ${FONT_SIZE * 0.1}px; text-align: center; font-size: ${FONT_SIZE * 0.7}px; color: #000000;">数量: ${label.quantity}</div>
                <div style="font-size: ${FONT_SIZE * 0.5}px; color: #000000; text-align: center; font-family: monospace; word-break: break-all;">UUID: ${label.uuid}</div>
              </div>
            </div>
          `
        } else {
          // 二维码模式：左右排列，二维码为正方形
          const qrSize = Math.min(QR_SIZE, RENDER_HEIGHT * 0.65)
          labelContent = `
            <div style="display: flex; flex-direction: row; align-items: center; width: 100%;">
              <div style="width: ${qrSize}px; height: ${qrSize}px; flex-shrink: 0; border: 1px solid #000000; padding: ${RENDER_WIDTH * 0.005}px; box-sizing: border-box; background: #ffffff;">
                <img src="data:image/png;base64,${label.qr_base64}" style="width: 100%; height: 100%; object-fit: contain;" />
              </div>
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; overflow: hidden; color: #000000; padding-left: ${RENDER_WIDTH * 0.02}px;">
                <div style="font-weight: bold; margin-bottom: ${FONT_SIZE * 0.25}px; text-align: left; font-size: ${FONT_SIZE * 1.1}px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #000000;">${label.name}</div>
                <div style="margin-bottom: ${FONT_SIZE * 0.1}px; text-align: left; font-size: ${FONT_SIZE * 0.7}px; color: #000000;">规格: ${label.spec || '-'}</div>
                <div style="margin-bottom: ${FONT_SIZE * 0.1}px; text-align: left; font-size: ${FONT_SIZE * 0.7}px; color: #000000;">数量: ${label.quantity}</div>
                <div style="font-size: ${FONT_SIZE * 0.5}px; color: #000000; text-align: left; font-family: monospace; word-break: break-all;">UUID: ${label.uuid}</div>
              </div>
            </div>
          `
        }

        labelEl.innerHTML = labelContent

        tempContainer.appendChild(labelEl)

        // 等待图片加载
        const imgEl = labelEl.querySelector('img') as HTMLImageElement
        if (imgEl) {
          await new Promise<void>((resolve) => {
            if (imgEl.complete) resolve()
            else {
              imgEl.onload = () => resolve()
              imgEl.onerror = () => resolve()
            }
          })
        }

        // 渲染标签
        const canvas = await html2canvasFn(labelEl, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
        })

        tempContainer.removeChild(labelEl)

        if (i > 0) {
          pdf.addPage([size.width, size.height])
        }

        // 添加到 PDF，填满整页
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 0, size.width, size.height)
      }

      document.body.removeChild(tempContainer)

      pdf.save(`资产标签_${labels.length}张.pdf`)
      antMessage.success(`已导出 ${labels.length} 张标签`)
    } catch (error) {
      console.error('导出 PDF 失败:', error)
      antMessage.error('导出 PDF 失败')
    } finally {
      setExporting(false)
    }
  }

  const currentSize = getCurrentSize()

  return (
    <Modal
      title={`打印标签 (${labels.length}个)`}
      open={open}
      onCancel={onClose}
      width={900}
      footer={
        <div className="print-modal-footer">
          <Button onClick={onClose}>取消</Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportPDF}
            loading={exporting}
            disabled={labels.length === 0}
          >
            导出 PDF
          </Button>
          <Button type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>
            打印
          </Button>
        </div>
      }
    >
      <style>{`
        @page {
          margin: 0;
          size: auto;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .print-labels-container,
          .print-labels-container * {
            visibility: visible;
          }
          .print-labels-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
          }
          .ant-modal-footer,
          .ant-modal-header {
            display: none !important;
          }
          .ant-modal-content {
            box-shadow: none !important;
            padding: 0 !important;
          }
          .label-card {
            border: 1px solid #000000;
            padding: 2mm;
            margin: 0;
            page-break-inside: avoid;
            display: inline-block;
            vertical-align: top;
            box-sizing: border-box;
          }
          .label-card .label-header { display: none; }
          .label-card .label-qr img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .label-card .label-info {
            flex: 1;
            overflow: hidden;
          }
          .label-card .label-info .info-row {
            margin-bottom: 1px;
            color: #000000;
          }
          .label-card .label-title-right {
            font-weight: bold;
            text-align: left;
            margin-bottom: 1mm;
            color: #000000;
          }
          .label-card .label-uuid {
            color: #000000;
            font-family: monospace;
            word-break: break-all;
            text-align: left;
          }
        }
        .print-labels-container {
          min-height: 200px;
          padding-top: 8px;
        }
        .label-preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #000000;
          margin-bottom: 12px;
        }
        .label-preview-header .preset-select { width: 180px; }
        .label-preview-header .custom-size {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .label-preview-header .custom-size input { width: 70px; }
        .label-preview-grid {
          display: grid;
          gap: 16px;
          padding: 12px 0;
        }
        .label-card-preview {
          border: 1px solid #000000;
          border-radius: 4px;
          padding: 12px;
          background: #ffffff;
          display: flex;
          gap: 12px;
        }
        .label-card-preview .label-header { display: none; }
        .label-card-preview .label-qr { flex-shrink: 0; }
        .label-card-preview .label-qr img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .label-card-preview .label-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .label-card-preview .label-title-right {
          font-weight: bold;
          font-size: 16px;
          text-align: left;
          margin-bottom: 6px;
          color: #000000;
        }
        .label-card-preview .label-info .info-row {
          display: flex;
          gap: 6px;
          margin-bottom: 4px;
          font-size: 14px;
          text-align: left;
          color: #000000;
        }
        .label-card-preview .label-info .info-label {
          color: #000000;
          min-width: 50px;
          flex-shrink: 0;
        }
        .label-card-preview .label-info .info-value {
          font-weight: 500;
          word-break: break-word;
          color: #000000;
        }
        .label-card-preview .label-uuid {
          font-size: 11px;
          color: #000000;
          font-family: monospace;
          word-break: break-all;
          text-align: left;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px dashed #000000;
        }
      `}</style>

      <div className="print-labels-container" style={{ minHeight: 200 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#999' }}>正在生成标签...</p>
          </div>
        ) : labels.length === 0 ? (
          <Empty description="暂无标签数据" />
        ) : (
          <>
            <div className="label-preview-header">
              <span style={{ fontWeight: 500 }}>标签尺寸：</span>
              <Space>
                <Select
                  className="preset-select"
                  value={selectedPreset}
                  onChange={(value) => {
                    setSelectedPreset(value)
                    if (value !== '自定义') {
                      const preset = LABEL_PRESETS.find(p => p.label === value)
                      if (preset) {
                        setCustomWidth(preset.width)
                        setCustomHeight(preset.height)
                      }
                    }
                  }}
                  options={LABEL_PRESETS.map(p => ({ label: p.label, value: p.label }))}
                />
                {selectedPreset === '自定义' && (
                  <Space className="custom-size">
                    <span>宽:</span>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      min="20"
                      max="200"
                    />
                    <span>mm</span>
                    <span>高:</span>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      min="10"
                      max="200"
                    />
                    <span>mm</span>
                  </Space>
                )}
              </Space>
            </div>
            <div
              className="label-preview-grid"
              style={{
                gridTemplateColumns: `repeat(${getCurrentSize().cols}, 1fr)`,
              }}
            >
              {labels.map((label) => {
                // 预览：保持比例
                const aspectRatio = currentSize.width / currentSize.height
                const maxHeight = 100
                const previewHeight = Math.min(maxHeight, currentSize.height * 1.5)
                const previewWidth = previewHeight * aspectRatio
                const previewQrSize = previewWidth * 0.6

                return (
                  <div
                    key={label.id}
                    ref={(el) => {
                      if (el) labelRefs.current.set(label.id, el)
                    }}
                    className="label-card-preview label-card"
                    style={currentSize.useBarcode ? { display: 'flex', flexDirection: 'column', alignItems: 'center' } : {}}
                  >
                    {currentSize.useBarcode ? (
                      <div
                        className="label-barcode"
                        style={{
                          width: previewWidth * 0.85,
                          height: previewHeight * 0.5,
                        }}
                      >
                        <img src={`data:image/png;base64,${label.barcode_base64}`} alt="条形码" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      </div>
                    ) : (
                      <div
                        className="label-qr"
                        style={{
                          width: previewQrSize,
                          height: previewHeight - 24,
                        }}
                      >
                        <img src={`data:image/png;base64,${label.qr_base64}`} alt="二维码" />
                      </div>
                    )}
                    <div className="label-info" style={currentSize.useBarcode ? { width: '100%' } : {}}>
                      <div className="label-title-right">{label.name}</div>
                      <div className="info-row">
                        <span className="info-label">规格:</span>
                        <span className="info-value">{label.spec || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">数量:</span>
                        <span className="info-value">{label.quantity}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">所有人:</span>
                        <span className="info-value">{label.owner || '-'}</span>
                      </div>
                      <div className="label-uuid">UUID: {label.uuid}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 8, padding: '6px 8px', background: '#e6f7ff', borderRadius: 4, fontSize: 11, color: '#1890ff' }}>
              💡 提示：导出 PDF 每张标签独立一页；打印时每页可排布多个标签
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}