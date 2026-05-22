import { useEffect, useState } from 'react'
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, App } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, EditOutlined, ReloadOutlined, UndoOutlined, DownloadOutlined } from '@ant-design/icons'
import { consumptionAPI, assetAPI } from '../services/api'
import type { Consumption, Asset } from '../services/api'

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'completed', label: '已完成' },
]

export default function ConsumptionList() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<Consumption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Consumption | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [form] = Form.useForm()
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    loadRecords()
  }, [page, status])

  const loadRecords = async () => {
    setLoading(true)
    try {
      const res = await consumptionAPI.list({ page, page_size: 10, status })
      setRecords(res.data.items)
      setTotal(res.data.total)
    } catch (error) {
      antMessage.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (record: Consumption) => {
    try {
      await consumptionAPI.approve(record.id)
      antMessage.success('已批准')
      loadRecords()
    } catch (error) {
      antMessage.error('操作失败')
    }
  }

  const handleReject = () => {
    if (!selectedRecord || !rejectReason) {
      antMessage.warning('请输入拒绝原因')
      return false
    }
    return (async () => {
      try {
        await consumptionAPI.reject(selectedRecord.id, rejectReason)
        antMessage.success('已拒绝')
        setRejectModalVisible(false)
        setRejectReason('')
        loadRecords()
        return true
      } catch (error) {
        antMessage.error('操作失败')
        return false
      }
    })()
  }

  const handleComplete = async (values: { actual_quantity: number; project_record: string; remark?: string }) => {
    if (!selectedRecord) return

    setSubmitLoading(true)
    try {
      await consumptionAPI.complete(selectedRecord.id, {
        actual_quantity: values.actual_quantity,
        project_record: values.project_record,
        remark: values.remark,
      })
      antMessage.success('已完成用量登记')
      setCompleteModalVisible(false)
      loadRecords()
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '操作失败')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleRevoke = async (record: Consumption) => {
    try {
      await consumptionAPI.revoke(record.id)
      antMessage.success('已撤销')
      loadRecords()
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '操作失败')
    }
  }

  const [exportLoading, setExportLoading] = useState(false)
  const handleExport = async (format: 'xlsx' | 'csv') => {
    setExportLoading(true)
    try {
      const result = await consumptionAPI.export({ status, format })
      const url = URL.createObjectURL(result.data)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      antMessage.success('导出成功')
    } catch (error) {
      antMessage.error('导出失败')
    } finally {
      setExportLoading(false)
    }
  }

  const openCreateModal = async () => {
    try {
      const res = await assetAPI.list({ page: 1, page_size: 100 })
      setAssets(res.data.items)
      setCreateModalVisible(true)
      form.resetFields()
      setSelectedAsset(null)
    } catch (error) {
      antMessage.error('加载资产列表失败')
    }
  }

  const closeCreateModal = () => {
    setCreateModalVisible(false)
    form.resetFields()
    setSelectedAsset(null)
  }

  const handleCreateConsumption = async (values: any) => {
    if (!selectedAsset) {
      antMessage.error('请选择资产')
      return
    }

    setSubmitLoading(true)
    try {
      await consumptionAPI.create({
        asset_uuid: selectedAsset.uuid,
        reporter_name: values.reporter_name,
        reporter_email: values.reporter_email,
        project_name: values.project_name,
        quantity: values.quantity,
        consume_date: values.consume_date,
        remark: values.remark,
      })
      antMessage.success('损耗报告已提交')
      closeCreateModal()
      loadRecords()
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '提交失败')
      closeCreateModal()
    } finally {
      setSubmitLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: '#faad14', text: '待审批' },
      approved: { color: '#52c41a', text: '已批准' },
      rejected: { color: '#ff4d4f', text: '已拒绝' },
      completed: { color: '#1890ff', text: '已完成' },
    }
    const { color, text } = statusMap[status] || { color: '#d9d9d9', text: status }
    return <span style={{ color, padding: '2px 8px', borderRadius: 4, background: color + '20' }}>{text}</span>
  }

  const columns = [
    {
      title: '资产',
      key: 'asset',
      render: (_: any, record: Consumption) => (
        <div>
          <div>{record.asset?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>UUID: {record.asset_uuid.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: '上报人',
      key: 'reporter',
      render: (_: any, record: Consumption) => (
        <div>
          <div>{record.reporter_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.reporter_email || '-'}</div>
        </div>
      ),
    },
    {
      title: '使用项目',
      dataIndex: 'project_name',
      key: 'project_name',
      width: 150,
    },
    {
      title: '损耗数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
      width: 100,
    },
    {
      title: '损耗日期',
      dataIndex: 'consume_date',
      key: 'consume_date',
      width: 120,
    },
    {
      title: '实际用量',
      dataIndex: 'actual_quantity',
      key: 'actual_quantity',
      width: 80,
      render: (qty: number) => qty || '-',
    },
    {
      title: '审批人',
      dataIndex: 'approved_by',
      key: 'approved_by',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_: any, record: Consumption) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                批准
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => {
                setSelectedRecord(record)
                setRejectModalVisible(true)
              }}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <>
              <Button size="small" type="primary" icon={<EditOutlined />} onClick={() => {
                setSelectedRecord(record)
                setCompleteModalVisible(true)
              }}>
                登记用量
              </Button>
              <Button size="small" icon={<UndoOutlined />} onClick={() => handleRevoke(record)}>
                撤销
              </Button>
            </>
          )}
          {record.status === 'completed' && (
            <Button size="small" danger icon={<UndoOutlined />} onClick={() => handleRevoke(record)}>
              撤销
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="consumption-list-page">
      <div className="page-header">
        <div className="header-left">
          <h2 id="consumption-list-title">损耗管理</h2>
          <span id="consumption-list-count" className="total-count">共 {total} 条记录</span>
        </div>
        <Space>
          <Button id="consumption-list-refresh-btn" icon={<ReloadOutlined />} onClick={loadRecords}>刷新</Button>
          <Select
            id="consumption-list-status-select"
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={statusOptions}
            style={{ width: 120 }}
            className="status-select"
          />
          <Button
            id="consumption-list-export-btn"
            icon={<DownloadOutlined />}
            loading={exportLoading}
            onClick={() => handleExport('xlsx')}
          >
            导出 Excel
          </Button>
          <Button id="consumption-list-add-btn" type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="add-btn">
            代申请损耗
          </Button>
        </Space>
      </div>

      {/* 流程说明 */}
      <Card className="flow-card">
        <div className="flow-header">
          <span className="flow-icon">📋</span>
          <span className="flow-title">损耗OA流程</span>
        </div>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">扫码/代申请</div>
              <div className="step-desc">使用耗材后扫码报告</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">待审批</div>
              <div className="step-desc">等待管理员审批</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">批准</div>
              <div className="step-desc">管理员审核通过</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">登记用量</div>
              <div className="step-desc">填写实际用量和项目记录</div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="table-card">
        <Table
          rowKey="id"
          loading={loading}
          dataSource={records}
          columns={columns}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: setPage,
          }}
        />
      </Card>

      {/* 拒绝弹窗 */}
      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleReject}
        onCancel={() => setRejectModalVisible(false)}
        okText="确认拒绝"
        cancelText="取消"
        destroyOnHidden
      >
        <Input.TextArea
          id="consumption-reject-reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={4}
        />
      </Modal>

      {/* 登记用量弹窗 */}
      <Modal
        title="登记实际用量"
        open={completeModalVisible}
        onCancel={() => setCompleteModalVisible(false)}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {completeModalVisible && selectedRecord && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleComplete}
            initialValues={{ actual_quantity: selectedRecord.quantity }}
          >
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
              <div><b>损耗报告信息</b></div>
              <div style={{ display: 'flex', gap: 16 }}>
                <span>资产：{selectedRecord.asset?.name || '-'}</span>
                <span>报告数量：{selectedRecord.quantity}</span>
              </div>
              <div>使用项目：{selectedRecord.project_name}</div>
            </div>

            <Form.Item
              name="actual_quantity"
              label="实际用量"
              rules={[
                { required: true, message: '请输入实际用量' },
                { type: 'number', min: 1, message: '用量最少为1' },
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="project_record"
              label="项目用量记录"
              rules={[{ required: true, message: '请输入项目用量记录' }]}
            >
              <Input.TextArea
                placeholder="请详细记录该耗材在本项目中的使用情况"
                rows={4}
              />
            </Form.Item>

            <Form.Item name="remark" label="备注">
              <Input.TextArea placeholder="其他备注信息" rows={2} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button id="consumption-complete-submit-btn" type="primary" htmlType="submit" loading={submitLoading}>
                  确认完成
                </Button>
                <Button onClick={() => setCompleteModalVisible(false)}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* 代申请损耗弹窗 */}
      <Modal
        title="代申请损耗"
        open={createModalVisible}
        onCancel={closeCreateModal}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {createModalVisible && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateConsumption}
            initialValues={{ quantity: 1 }}
          >
            <Form.Item
              name="asset_id"
              label="选择资产"
              rules={[{ required: true, message: '请选择资产' }]}
            >
              <Select
                placeholder="请选择要报告损耗的资产"
                showSearch
                optionFilterProp="children"
                onChange={(value: number) => {
                  const asset = assets.find(a => a.id === value)
                  setSelectedAsset(asset || null)
                }}
              >
                {assets.map(asset => (
                  <Select.Option key={asset.id} value={asset.id}>
                    {asset.name} - {asset.owner || '无所有人'} (库存: {asset.quantity})
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            {selectedAsset && (
              <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <div><b>资产信息</b></div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span>名称：{selectedAsset.name}</span>
                  <span>规格：{selectedAsset.spec || '-'}</span>
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span>库存：{selectedAsset.quantity}</span>
                  <span>位置：{selectedAsset.location || '-'}</span>
                </div>
              </div>
            )}

            <Form.Item
              name="reporter_name"
              label="上报人姓名"
              rules={[{ required: true, message: '请输入上报人姓名' }]}
            >
              <Input id="consumption-create-reporter-name" placeholder="请输入上报人姓名" />
            </Form.Item>

            <Form.Item name="reporter_email" label="上报人邮箱">
              <Input id="consumption-create-email" type="email" placeholder="用于接收审批结果通知" />
            </Form.Item>

            <Form.Item
              name="project_name"
              label="使用项目名称"
              rules={[{ required: true, message: '请输入使用该耗材的项目名称' }]}
            >
              <Input id="consumption-create-project-name" placeholder="请输入使用该耗材的项目名称" />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="损耗数量"
              rules={[
                { required: true, message: '请输入数量' },
              ]}
            >
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="consume_date" label="损耗日期">
              <Input id="consumption-create-date" type="date" />
            </Form.Item>

            <Form.Item name="remark" label="损耗原因/备注">
              <Input.TextArea id="consumption-create-remark" placeholder="请输入损耗原因或其他备注" rows={3} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button id="consumption-create-submit-btn" type="primary" htmlType="submit" loading={submitLoading}>
                  提交申请
                </Button>
                <Button onClick={closeCreateModal}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>

      <style>{`
        .consumption-list-page {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .page-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .total-count {
          color: #8c8c8c;
          font-size: 14px;
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 12px;
        }

        .add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .add-btn:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
        }

        .status-select {
          border-radius: 6px;
        }

        .flow-card {
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #fff7e6 0%, #fffbf0 100%);
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
          margin-bottom: 20px;
        }

        .flow-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .flow-icon {
          font-size: 20px;
        }

        .flow-title {
          font-weight: 600;
          font-size: 16px;
          color: #333;
        }

        .flow-steps {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .flow-step {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          min-width: 120px;
        }

        .step-number {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fa8c16 0%, #faad14 100%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 14px;
        }

        .step-content {
          display: flex;
          flex-direction: column;
        }

        .step-title {
          font-weight: 600;
          font-size: 14px;
          color: #333;
        }

        .step-desc {
          font-size: 12px;
          color: #8c8c8c;
        }

        .flow-arrow {
          color: #fa8c16;
          font-size: 18px;
          font-weight: 600;
        }

        .table-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .table-card .ant-card-body {
          padding: 0;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
          }

          .page-header .ant-space {
            width: 100%;
            justify-content: flex-start;
            flex-wrap: wrap;
            gap: 8px;
          }

          .page-header h2 {
            font-size: 18px;
          }

          .flow-card {
            border-radius: 16px;
            padding: 4px;
          }

          .flow-steps {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .flow-arrow {
            transform: rotate(90deg);
            margin: 2px 0;
          }

          .flow-step {
            width: 100%;
            padding: 10px 14px;
          }

          .table-card {
            border-radius: 16px;
          }

          .total-count {
            font-size: 12px;
            padding: 3px 10px;
          }
        }
      `}</style>
    </div>
  )
}
