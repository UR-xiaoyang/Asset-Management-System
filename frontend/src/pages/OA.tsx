import { useEffect, useState } from 'react'
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, App, Tabs } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, UndoOutlined, ReloadOutlined } from '@ant-design/icons'
import { borrowAPI, consumptionAPI, assetAPI } from '../services/api'
import type { BorrowRecord, Consumption, Asset } from '../services/api'
import { useAuthStore } from '../store/auth'

const borrowStatusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'returned', label: '已归还' },
]

const consumptionStatusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已批准' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'completed', label: '已完成' },
]

export default function OA() {
  const [activeTab, setActiveTab] = useState('borrow')
  const [loading, setLoading] = useState(false)
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([])
  const [consumptionRecords, setConsumptionRecords] = useState<Consumption[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | Consumption | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [form] = Form.useForm()
  const user = useAuthStore((state) => state.user)
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    loadRecords()
  }, [page, status, activeTab])

  const loadRecords = async () => {
    setLoading(true)
    try {
      if (activeTab === 'borrow') {
        const res = await borrowAPI.list({ page, page_size: 10, status })
        setBorrowRecords(res.data.items)
        setTotal(res.data.total)
      } else {
        const res = await consumptionAPI.list({ page, page_size: 10, status })
        setConsumptionRecords(res.data.items)
        setTotal(res.data.total)
      }
    } catch (error) {
      antMessage.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (record: BorrowRecord | Consumption) => {
    try {
      if (activeTab === 'borrow') {
        await borrowAPI.approve(record.id, user?.username || 'admin')
        antMessage.success('审批通过')
      } else {
        await consumptionAPI.approve(record.id)
        antMessage.success('已批准')
      }
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
        if (activeTab === 'borrow') {
          await borrowAPI.reject(selectedRecord.id, user?.username || 'admin', rejectReason)
        } else {
          await consumptionAPI.reject(selectedRecord.id, user?.username || 'admin', rejectReason)
        }
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

  const handleReturn = async (record: BorrowRecord) => {
    try {
      await borrowAPI.return(record.id)
      antMessage.success('已归还')
      loadRecords()
    } catch (error) {
      antMessage.error('操作失败')
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

  const handleCreateBorrow = async (values: any) => {
    if (!selectedAsset) {
      antMessage.error('请选择资产')
      return
    }
    setSubmitLoading(true)
    try {
      await borrowAPI.create({
        asset_uuid: selectedAsset.uuid,
        borrower_name: values.borrower_name,
        borrower_email: values.borrower_email,
        borrower_phone: values.borrower_phone,
        quantity: values.quantity,
        remark: values.remark,
      })
      antMessage.success('借用申请已提交')
      closeCreateModal()
      loadRecords()
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '提交失败')
      closeCreateModal()
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleCreateConsumption = async (values: any) => {
    if (!selectedAsset) {
      antMessage.error('请选择资产')
      return
    }
    setSubmitLoading(true)
    try {
      const payload = {
        asset_uuid: selectedAsset.uuid,
        reporter_name: values.reporter_name,
        reporter_email: values.reporter_email || '',
        project_name: values.project_name,
        quantity: values.quantity,
        consume_date: values.consume_date || '',
        remark: values.remark || '',
      }
      await consumptionAPI.create(payload)
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

  const getBorrowStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: '#faad14', text: '待审批' },
      approved: { color: '#52c41a', text: '已通过' },
      rejected: { color: '#ff4d4f', text: '已拒绝' },
      returned: { color: '#1890ff', text: '已归还' },
    }
    const { color, text } = statusMap[status] || { color: '#d9d9d9', text: status }
    return <span style={{ color, padding: '2px 8px', borderRadius: 4, background: color + '20' }}>{text}</span>
  }

  const getConsumptionStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: '#faad14', text: '待审批' },
      approved: { color: '#52c41a', text: '已批准' },
      rejected: { color: '#ff4d4f', text: '已拒绝' },
      completed: { color: '#1890ff', text: '已完成' },
    }
    const { color, text } = statusMap[status] || { color: '#d9d9d9', text: status }
    return <span style={{ color, padding: '2px 8px', borderRadius: 4, background: color + '20' }}>{text}</span>
  }

  const borrowColumns = [
    {
      title: '资产',
      key: 'asset',
      render: (_: any, record: BorrowRecord) => (
        <div>
          <div>{(record as any).asset?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>UUID: {(record as any).asset_uuid.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: '借用人',
      key: 'borrower',
      render: (_: any, record: BorrowRecord) => (
        <div>
          <div>{record.borrower_name}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.borrower_phone || '-'}</div>
        </div>
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getBorrowStatusTag(status),
      width: 100,
    },
    {
      title: '借用日期',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
      width: 120,
    },
    {
      title: '审批人',
      dataIndex: 'approved_by',
      key: 'approved_by',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_: any, record: BorrowRecord) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>
                通过
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
            <Button size="small" icon={<UndoOutlined />} onClick={() => handleReturn(record)}>
              归还
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const consumptionColumns = [
    {
      title: '资产',
      key: 'asset',
      render: (_: any, record: Consumption) => (
        <div>
          <div>{(record as any).asset?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>UUID: {(record as any).asset_uuid.slice(0, 8)}...</div>
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
      render: (status: string) => getConsumptionStatusTag(status),
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
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'borrow',
      label: '借用管理',
      children: (
        <Card className="table-card">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={borrowRecords}
            columns={borrowColumns}
            pagination={{
              current: page,
              total,
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (p) => { setPage(p); },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'consumption',
      label: '损耗管理',
      children: (
        <Card className="table-card">
          <Table
            rowKey="id"
            loading={loading}
            dataSource={consumptionRecords}
            columns={consumptionColumns}
            pagination={{
              current: page,
              total,
              pageSize: 10,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (p) => { setPage(p); },
            }}
          />
        </Card>
      ),
    },
  ]

  return (
    <div className="oa-page">
      <div className="page-header">
        <div className="header-left">
          <h2>OA审批</h2>
          <span className="total-count">共 {total} 条记录</span>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={loadRecords}>刷新</Button>
          <Select
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={activeTab === 'borrow' ? borrowStatusOptions : consumptionStatusOptions}
            style={{ width: 120 }}
            className="status-select"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={openCreateModal}
            className="add-btn"
          >
            {activeTab === 'borrow' ? '发起借用' : '代申请损耗'}
          </Button>
        </Space>
      </div>

      <Card className="flow-card">
        <div className="flow-header">
          <span className="flow-icon">📋</span>
          <span className="flow-title">OA审批流程</span>
        </div>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">{activeTab === 'borrow' ? '发起借用' : '扫码/代申请'}</div>
              <div className="step-desc">{activeTab === 'borrow' ? '提交借用申请' : '使用耗材后扫码报告'}</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <div className="step-title">待审批</div>
              <div className="step-desc">等待管理员处理</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <div className="step-title">{activeTab === 'borrow' ? '管理员审批' : '批准'}</div>
              <div className="step-desc">{activeTab === 'borrow' ? '通过/拒绝申请' : '管理员审核通过'}</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">{activeTab === 'borrow' ? '归还' : '登记用量'}</div>
              <div className="step-desc">{activeTab === 'borrow' ? '确认归还资产' : '填写实际用量和项目记录'}</div>
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => { setActiveTab(key); setPage(1); setStatus(''); }}
        items={tabItems}
      />

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
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={4}
        />
      </Modal>

      <Modal
        title={activeTab === 'borrow' ? '发起借用申请' : '代申请损耗'}
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
            onFinish={activeTab === 'borrow' ? handleCreateBorrow : handleCreateConsumption}
            initialValues={{ quantity: 1 }}
          >
            <Form.Item
              name="asset_id"
              label="选择资产"
              rules={[{ required: true, message: '请选择资产' }]}
            >
              <Select
                placeholder="请选择资产"
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

            {activeTab === 'borrow' ? (
              <>
                <Form.Item
                  name="borrower_name"
                  label="借用人姓名"
                  rules={[{ required: true, message: '请输入借用人姓名' }]}
                >
                  <Input placeholder="请输入借用人姓名" />
                </Form.Item>
                <Form.Item name="borrower_email" label="借用人邮箱">
                  <Input type="email" placeholder="用于接收审批结果通知" />
                </Form.Item>
                <Form.Item name="borrower_phone" label="联系电话">
                  <Input placeholder="请输入联系电话" />
                </Form.Item>
                <Form.Item
                  name="quantity"
                  label="借用数量"
                  rules={[{ required: true, message: '请输入数量' }]}
                >
                  <InputNumber min={1} max={selectedAsset?.quantity || 1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="remark" label="借用原因/备注">
                  <Input.TextArea placeholder="请输入借用原因" rows={3} />
                </Form.Item>
              </>
            ) : (
              <>
                <Form.Item
                  name="reporter_name"
                  label="上报人姓名"
                  rules={[{ required: true, message: '请输入上报人姓名' }]}
                >
                  <Input placeholder="请输入上报人姓名" />
                </Form.Item>
                <Form.Item name="reporter_email" label="上报人邮箱">
                  <Input type="email" placeholder="用于接收审批结果通知" />
                </Form.Item>
                <Form.Item
                  name="project_name"
                  label="使用项目名称"
                  rules={[{ required: true, message: '请输入使用该耗材的项目名称' }]}
                >
                  <Input placeholder="请输入使用该耗材的项目名称" />
                </Form.Item>
                <Form.Item
                  name="quantity"
                  label="损耗数量"
                  rules={[{ required: true, message: '请输入数量' }]}
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="consume_date" label="损耗日期">
                  <Input type="date" />
                </Form.Item>
                <Form.Item name="remark" label="损耗原因/备注">
                  <Input.TextArea placeholder="请输入损耗原因或其他备注" rows={3} />
                </Form.Item>
              </>
            )}

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button type="primary" htmlType="submit" loading={submitLoading}>
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
        .oa-page {
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
          background: linear-gradient(135deg, #f0f5ff 0%, #fafbff 100%);
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          color: #667eea;
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