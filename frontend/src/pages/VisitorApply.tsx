import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Space, Input, Modal, Form, InputNumber, App, TreeSelect, Dropdown } from 'antd'
import { SearchOutlined, ShoppingCartOutlined, LogoutOutlined, UserOutlined, EditOutlined } from '@ant-design/icons'
import { assetAPI, borrowAPI, categoryAPI, userAPI } from '../services/api'
import type { Asset, Category } from '../services/api'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'

export default function VisitorApply() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()
  const { message: antMessage } = App.useApp()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [profileVisible, setProfileVisible] = useState(false)
  const [profileForm] = Form.useForm()
  const [profileSubmitting, setProfileSubmitting] = useState(false)

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.tree()
      setCategories(res.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await assetAPI.list({ page, page_size: 10, keyword: searchText, category_id: categoryId })
      setAssets(res.data.items)
      setTotal(res.data.total)
    } catch (error: any) {
      antMessage.error('加载资产列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadAssets()
  }, [page, categoryId])

  const handleLogout = () => {
    logout()
    navigate('/visitor/login')
  }

  const openProfileEdit = () => {
    profileForm.setFieldsValue({
      email: user?.email || '',
      phone: user?.phone || '',
    })
    setProfileVisible(true)
  }

  const handleProfileSubmit = async () => {
    try {
      const values = await profileForm.validateFields()
      setProfileSubmitting(true)
      await userAPI.update(user!.id, {
        email: values.email,
        phone: values.phone,
      })
      antMessage.success('个人信息更新成功')
      setProfileVisible(false)
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '更新失败')
    } finally {
      setProfileSubmitting(false)
    }
  }

  const handleApply = (asset: Asset) => {
    setSelectedAsset(asset)
    form.setFieldsValue({ quantity: 1 })
    setModalVisible(true)
  }

  const handleSubmit = async (values: { quantity: number }) => {
    if (!selectedAsset) return
    setSubmitting(true)
    try {
      await borrowAPI.create({
        asset_uuid: selectedAsset.uuid,
        borrower_name: user?.name || '',
        borrower_email: user?.email || '',
        borrower_phone: user?.phone || '',
        quantity: values.quantity,
      })
      antMessage.success('申请已提交，请等待审批')
      setModalVisible(false)
      form.resetFields()
      loadAssets()
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '提交失败')
      setModalVisible(false)
    } finally {
      setSubmitting(false)
    }
  }

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <b>{name}</b>
    },
    {
      title: '编号',
      dataIndex: 'code',
      key: 'code',
      render: (code: string, record: Asset) => code || record.uuid,
    },
    {
      title: '规格型号',
      dataIndex: 'spec',
      key: 'spec',
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (cat: { name?: string } | string) => typeof cat === 'string' && cat ? <Tag color="blue">{cat}</Tag> : (cat && typeof cat === 'object' && cat.name ? <Tag color="blue">{cat.name}</Tag> : '-')
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '可用数量',
      dataIndex: 'available_quantity',
      key: 'available_quantity',
      render: (qty: number) => qty > 0 ? <Tag color="success">{qty}</Tag> : <Tag color="red">无库存</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: unknown, record: Asset) => (
        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          disabled={record.available_quantity <= 0}
          onClick={() => handleApply(record)}
        >
          申请借用
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: 24 }}>
      <Card
        id="visitor-apply-card"
        title={<span style={{ fontSize: 20 }}>申请借用资产</span>}
        extra={<Space>
          <Button id="visitor-apply-view-records" onClick={() => navigate('/visitor/records')}>查看我的申请记录</Button>
          <Dropdown
            menu={{
              items: [
                { key: 'info', icon: <UserOutlined />, label: `${user?.name || user?.username}（访客）`, disabled: true },
                { type: 'divider' },
                { key: 'profile', icon: <EditOutlined />, label: '修改个人信息' },
                { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', danger: true },
              ],
              onClick: ({ key }) => { if (key === 'logout') handleLogout(); if (key === 'profile') openProfileEdit() },
            }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="text" id="visitor-apply-user-btn">{user?.name || user?.username} <UserOutlined /></Button>
          </Dropdown>
        </Space>}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Input
            id="visitor-apply-search"
            placeholder="搜索资产名称、编号或规格"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => { setSearchText(e.target.value); setPage(1); }}
            onPressEnter={() => { setPage(1); loadAssets(); }}
            style={{ width: 280 }}
          />
          <TreeSelect
            id="visitor-apply-category"
            placeholder="选择分类"
            style={{ width: 200 }}
            allowClear
            treeDefaultExpandAll
            value={categoryId}
            onChange={(value) => { setCategoryId(value); setPage(1); }}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
            treeData={categories}
          />
          <Button type="primary" onClick={() => { setPage(1); loadAssets(); }}>搜索</Button>
          {(searchText || categoryId) && (
            <Button onClick={() => { setSearchText(''); setCategoryId(undefined); setPage(1); loadAssets(); }}>清除筛选</Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={assets}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            total,
            current: page,
            onChange: (p) => setPage(p),
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="申请借用资产"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        {selectedAsset && (
          <>
            <div style={{ marginBottom: 16, color: '#666' }}>
              <p>申请人：{user?.name}（{user?.phone || '无电话'}）</p>
            </div>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
              <Form.Item
                name="quantity"
                label="借用数量"
                rules={[
                  { required: true, message: '请输入数量' },
                  { type: 'number', min: 1, message: '数量至少为1' },
                  { type: 'number', max: selectedAsset.available_quantity, message: `不能超过可用数量(${selectedAsset.available_quantity})` }
                ]}
              >
                <InputNumber id="visitor-apply-quantity" min={1} max={selectedAsset.available_quantity} style={{ width: 120 }} />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                <Space>
                  <Button id="visitor-apply-cancel" onClick={() => setModalVisible(false)}>取消</Button>
                  <Button id="visitor-apply-submit" type="primary" htmlType="submit" loading={submitting}>
                    提交申请
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>

      <Modal
        title="修改个人信息"
        open={profileVisible}
        onCancel={() => setProfileVisible(false)}
        onOk={handleProfileSubmit}
        confirmLoading={profileSubmitting}
        destroyOnHidden
      >
        <Form form={profileForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="用户名">
            <Input value={user?.username} disabled />
          </Form.Item>
          <Form.Item label="真实姓名">
            <Input value={user?.name} disabled />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}