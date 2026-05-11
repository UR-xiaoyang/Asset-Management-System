import { useState } from 'react'
import { Modal, Upload, Button, Table, Alert, Space, Typography } from 'antd'
import { UploadOutlined, DownloadOutlined, FileExcelOutlined } from '@ant-design/icons'
import { importAPI, type ImportResult } from '../services/api'

const { Text } = Typography

interface ImportModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ImportModal({ open, onClose, onSuccess }: ImportModalProps) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleImport = async (file: File) => {
    setUploading(true)

    try {
      const res = await importAPI.importAssets(file)
      setResult(res.data)

      if (res.data.success > 0 && onSuccess) {
        onSuccess()
      }
    } catch (error: any) {
      setResult(null)
      Modal.error({
        title: '导入失败',
        content: error.response?.data?.error || '服务器错误',
      })
    } finally {
      setUploading(false)
    }

    // 返回false阻止默认上传行为
    return false
  }

  const handleClose = () => {
    setResult(null)
    onClose()
  }

  const downloadTemplate = () => {
    // 生成CSV模板
    const headers = ['资产名称', '分类', '规格', '数量', '所有人', '存放位置', '登记人']
    const example = ['笔记本电脑', '电子设备', 'ThinkPad X1', '1', '张三', '实验室A', '管理员']
    const csvContent = [headers.join(','), example.join(',')].join('\n')

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = '资产导入模板.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const errorColumns = [
    {
      title: '行号',
      dataIndex: 'row',
      key: 'row',
      width: 80,
    },
    {
      title: '错误信息',
      dataIndex: 'message',
      key: 'message',
    },
  ]

  return (
    <Modal
      title="批量导入资产"
      open={open}
      onCancel={handleClose}
      footer={null}
      width={600}
        destroyOnHidden
    >
      <div style={{ padding: '16px 0' }}>
        <Space orientation="vertical" style={{ width: '100%' }} size="large">
          {/* 操作区 */}
          <div style={{ textAlign: 'center' }}>
            <Space size="large">
              <Upload
                accept=".xlsx,.xls,.csv"
                beforeUpload={handleImport}
                showUploadList={false}
                disabled={uploading}
              >
                <Button
                  type="primary"
                  icon={<UploadOutlined />}
                  loading={uploading}
                >
                  选择文件
                </Button>
              </Upload>

              <Button
                icon={<DownloadOutlined />}
                onClick={downloadTemplate}
              >
                下载模板
              </Button>
            </Space>

            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                支持 .xlsx、.xls、.csv 格式，单次最多导入1000条
              </Text>
            </div>
          </div>

          {/* 格式说明 */}
          <Alert
            type="info"
            showIcon
            icon={<FileExcelOutlined />}
            title="文件格式说明"
            description={
              <div>
                <p style={{ marginBottom: 4 }}>
                  <strong>必填列：</strong>资产名称
                </p>
                <p style={{ marginBottom: 4 }}>
                  <strong>可选列：</strong>分类、规格、数量（默认1）、所有人、存放位置、登记人
                </p>
                <p style={{ margin: 0 }}>
                  如果分类不存在，会自动创建
                </p>
              </div>
            }
          />
        </Space>

        {/* 导入结果 */}
        {result && (
          <div style={{ marginTop: 24 }}>
            <Alert
              type={result.failed === 0 ? 'success' : 'warning'}
              message={
                <span>
                  导入完成：成功 <strong>{result.success}</strong> 条，
                  失败 <strong>{result.failed}</strong> 条
                </span>
              }
              style={{ marginBottom: 16 }}
            />

            {(result.errors?.length ?? 0) > 0 && (
              <>
                <h4 style={{ marginBottom: 8 }}>失败详情：</h4>
                <Table
                  size="small"
                  dataSource={result.errors}
                  columns={errorColumns}
                  pagination={false}
                  scroll={{ y: 200 }}
                  rowKey="row"
                />
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}