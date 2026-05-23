import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Tabs, App, Descriptions, Dropdown } from 'antd'
import { borrowAPI } from '../services/api'
import type { BorrowRecord } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { LogoutOutlined, UserOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const statusMap: Record<string, { color: string; text: string }> = {
  pending: { color: 'orange', text: '待审批' },
  approved: { color: 'green', text: '已借出' },
  rejected: { color: 'red', text: '已拒绝' },
  returned: { color: 'blue', text: '已归还' },
}

export default function VisitorRecords() {
  const [pendingRecords, setPendingRecords] = useState<BorrowRecord[]>([])
  const [historyRecords, setHistoryRecords] = useState<BorrowRecord[]>([])
  const [loading, setLoading] = useState(false)
  const { message: antMessage } = App.useApp()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const loadRecords = async () => {
    if (!user?.name) return
    setLoading(true)
    try {
      const res = await borrowAPI.myRecords(user.name)
      const records = res.data.records
      setPendingRecords(records.filter((r: BorrowRecord) => r.status === 'pending' || r.status === 'approved'))
      setHistoryRecords(records.filter((r: BorrowRecord) => r.status === 'rejected' || r.status === 'returned'))
    } catch (error: any) {
      antMessage.error('加载申请记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/visitor/login')
  }

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'asset_name',
      key: 'asset_name',
      render: (name: string, record: BorrowRecord) => (
        <Space direction="vertical" size={0}>
          <b>{name || '-'}</b>
          <span style={{ fontSize: 12, color: '#999' }}>编号: {record.asset_code || '-'}</span>
        </Space>
      )
    },
    {
      title: '借用数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const info = statusMap[status] || { color: 'default', text: status }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '审批时间',
      dataIndex: 'approved_at',
      key: 'approved_at',
      render: (time: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '审批人',
      dataIndex: 'approver_name',
      key: 'approver_name',
      render: (name: string) => name || '-'
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
    }
  ]

  const pendingColumns = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: BorrowRecord) => {
        if (record.status === 'approved') {
          return <Tag color="success">使用中</Tag>
        }
        return <Tag color="orange">等待审批</Tag>
      }
    }
  ]

  const items = [
    {
      key: 'pending',
      label: `进行中的申请 (${pendingRecords.length})`,
      children: (
        <Table
          columns={pendingColumns}
          dataSource={pendingRecords}
          rowKey="id"
          loading={loading}
          pagination={false}
          expandable={{
            expandedRowRender: (record: BorrowRecord) => (
              <Descriptions column={2} size="small">
                <Descriptions.Item label="借用原因">{record.remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{record.borrower_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{record.borrower_email || '-'}</Descriptions.Item>
                {record.approver_remark && (
                  <Descriptions.Item label="审批备注" span={2}>{record.approver_remark}</Descriptions.Item>
                )}
              </Descriptions>
            )
          }}
        />
      )
    },
    {
      key: 'history',
      label: `历史记录 (${historyRecords.length})`,
      children: (
        <Table
          columns={columns}
          dataSource={historyRecords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record: BorrowRecord) => (
              <Descriptions column={2} size="small">
                <Descriptions.Item label="借用原因">{record.remark || '-'}</Descriptions.Item>
                <Descriptions.Item label="联系电话">{record.borrower_phone || '-'}</Descriptions.Item>
                <Descriptions.Item label="邮箱">{record.borrower_email || '-'}</Descriptions.Item>
                {record.approver_remark && (
                  <Descriptions.Item label="审批备注" span={2}>{record.approver_remark}</Descriptions.Item>
                )}
              </Descriptions>
            )
          }}
        />
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Button onClick={() => navigate('/visitor/apply')} style={{ marginBottom: 16 }}>返回申请页面</Button>
      <Card
        id="visitor-records-card"
        title={<span style={{ fontSize: 20 }}>我的借用记录</span>}
        extra={<Space>
          <Button id="visitor-records-apply-btn" onClick={() => navigate('/visitor/apply')}>申请借用资产</Button>
          <Dropdown
            menu={{
              items: [
                { key: 'info', icon: <UserOutlined />, label: `${user?.name || user?.username}（访客）`, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
              ],
              onClick: ({ key }) => { if (key === 'logout') handleLogout() },
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" id="visitor-records-user-btn">{user?.name || user?.username} <UserOutlined /></Button>
          </Dropdown>
        </Space>}
      >
        <Tabs items={items} />
      </Card>
    </div>
  )
}