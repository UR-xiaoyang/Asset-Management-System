import { useEffect, useState } from 'react'
import { Table, Button, Card, Space, Modal, Form, Input, InputNumber, Select, App } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, UndoOutlined, ReloadOutlined } from '@ant-design/icons'
import { borrowAPI, assetAPI } from '../services/api'
import type { BorrowRecord, Asset } from '../services/api'

const statusOptions = [
  { value: '', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'returned', label: '已归还' },
]

export default function BorrowList() {
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [rejectModalVisible, setRejectModalVisible] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null)
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
      const res = await borrowAPI.list({ page, page_size: 10, status })
      setRecords(res.data.items)
      setTotal(res.data.total)
    } catch (error) {
      antMessage.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (record: BorrowRecord) => {
    try {
      await borrowAPI.approve(record.id)
      antMessage.success('审批通过')
      loadRecords()
    } catch (error) {
      antMessage.error('操作失败')
    }
  }

  const handleReject = async () => {
    if (!selectedRecord || !rejectReason) {
      antMessage.warning('请输入拒绝原因')
      return
    }
    try {
      await borrowAPI.reject(selectedRecord.id, rejectReason)
      antMessage.success('已拒绝')
      setRejectModalVisible(false)
      setRejectReason('')
      loadRecords()
    } catch (error) {
      antMessage.error('操作失败')
      // 失败时保持弹窗打开
    }
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
      // 失败时保持弹窗打开，不调用 closeCreateModal()
    } finally {
      setSubmitLoading(false)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: '#faad14', text: '待审批' },
      approved: { color: '#52c41a', text: '已通过' },
      rejected: { color: '#ff4d4f', text: '已拒绝' },
      returned: { color: '#1890ff', text: '已归还' },
    }
    const { color, text } = statusMap[status] || { color: '#d9d9d9', text: status }
    return <span style={{ color, padding: '2px 8px', borderRadius: 4, background: color + '20' }}>{text}</span>
  }

  const columns = [
    {
      title: '资产',
      key: 'asset',
      render: (_: any, record: BorrowRecord) => (
        <div>
          <div>{record.asset?.name || '-'}</div>
          <div style={{ fontSize: 12, color: '#999' }}>UUID: {record.asset_uuid.slice(0, 8)}...</div>
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
      render: (status: string) => getStatusTag(status),
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

  return (
    <div className="borrow-list-page">
      <div className="page-header">
        <div className="header-left">
          <h2 id="borrow-list-title">借用管理</h2>
          <span id="borrow-list-count" className="total-count">共 {total} 条记录</span>
        </div>
        <Space>
          <Button id="borrow-list-refresh-btn" icon={<ReloadOutlined />} onClick={loadRecords}>刷新</Button>
          <Select
            id="borrow-list-status-select"
            value={status}
            onChange={(value) => { setStatus(value); setPage(1); }}
            options={statusOptions}
            style={{ width: 120 }}
            className="status-select"
          />
          <Button id="borrow-list-add-btn" type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="add-btn">
            发起借用
          </Button>
        </Space>
      </div>

      {/* 流程说明 */}
      <Card className="flow-card">
        <div className="flow-header">
          <span className="flow-icon">📋</span>
          <span className="flow-title">OA审批流程</span>
        </div>
        <div className="flow-steps">
          <div className="flow-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <div className="step-title">发起借用</div>
              <div className="step-desc">提交借用申请</div>
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
              <div className="step-title">管理员审批</div>
              <div className="step-desc">通过/拒绝申请</div>
            </div>
          </div>
          <div className="flow-arrow">→</div>
          <div className="flow-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <div className="step-title">归还</div>
              <div className="step-desc">确认归还资产</div>
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
          id="borrow-reject-reason"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="请输入拒绝原因"
          rows={4}
        />
      </Modal>

      {/* 发起借用弹窗 */}
      <Modal
        title="发起借用申请"
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
            onFinish={handleCreateBorrow}
            initialValues={{ quantity: 1 }}
          >
            <Form.Item
              name="asset_id"
              label="选择资产"
              rules={[{ required: true, message: '请选择资产' }]}
            >
              <Select
                placeholder="请选择要借用的资产"
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
              name="borrower_name"
              label="借用人姓名"
              rules={[{ required: true, message: '请输入借用人姓名' }]}
            >
              <Input id="borrow-create-borrower-name" placeholder="请输入借用人姓名" />
            </Form.Item>

            <Form.Item name="borrower_email" label="借用人邮箱">
              <Input id="borrow-create-email" type="email" placeholder="用于接收审批结果通知" />
            </Form.Item>

            <Form.Item name="borrower_phone" label="联系电话">
              <Input id="borrow-create-phone" placeholder="请输入联系电话" />
            </Form.Item>

            <Form.Item
              name="quantity"
              label="借用数量"
              rules={[
                { required: true, message: '请输入数量' },
              ]}
            >
              <InputNumber min={1} max={selectedAsset?.quantity || 1} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="remark" label="借用原因/备注">
              <Input.TextArea id="borrow-create-remark" placeholder="请输入借用原因" rows={3} />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Space>
                <Button id="borrow-create-submit-btn" type="primary" htmlType="submit" loading={submitLoading}>
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
        .borrow-list-page {
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

        /* 流程卡片 */
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

        /* 表格卡片 */
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

        /* 移动端表格适配 */
        @media (max-width: 576px) {
          .borrow-list-page .ant-table {
            font-size: 12px;
            min-width: 600px;
            border-radius: 12px;
            overflow: hidden;
          }

          .borrow-list-page .ant-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 12px;
          }

          .borrow-list-page .ant-table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .borrow-list-page .ant-table-body {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  )
}