import { useEffect, useState, useCallback, useRef } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Popconfirm } from 'antd'
import type { InputRef } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { userAPI } from '../services/api'
import type { User, CreateUserData, UpdateUserData } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { AxiosError } from 'axios'
import type { SorterResult } from 'antd/es/table/interface'

const roleColors: Record<string, string> = {
  super_admin: 'red',
  admin: 'blue',
  visitor: 'green',
}

const roleLabels: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  visitor: '访客',
}

export default function UserManage() {
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const { user: currentUser } = useAuthStore()
  const searchInput = useRef<InputRef>(null)
  const initialized = useRef(false)

  const loadUsers = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await userAPI.list({ page, page_size: pageSize, keyword })
      setData(res.data.items)
      setPagination({
        current: res.data.page,
        pageSize,
        total: res.data.total,
      })
    } catch (error) {
      const err = error as AxiosError<{ error: string }>
      message.error(err.response?.data?.error || '加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }, [keyword])

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      loadUsers()
    }
  }, [loadUsers])

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    _sorter: SorterResult<User> | SorterResult<User>[]
  ) => {
    if (pagination.current && pagination.pageSize) {
      loadUsers(pagination.current, pagination.pageSize)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    loadUsers(1, pagination.pageSize)
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)

      if (editingUser) {
        // 更新
        const data: UpdateUserData = {
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
        }
        await userAPI.update(editingUser.id, data)
        message.success('更新成功')
      } else {
        // 创建
        const data: CreateUserData = {
          username: values.username,
          password: values.password,
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
        }
        await userAPI.create(data)
        message.success('创建成功')
      }

      setModalVisible(false)
      loadUsers(pagination.current, pagination.pageSize)
    } catch (error) {
      const err = error as AxiosError<{ error: string }>
      const isValidationError = (err as unknown as { errorFields?: unknown }).errorFields
      if (!isValidationError) {
        message.error(err.response?.data?.error || '操作失败')
        setModalVisible(false)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (user: User) => {
    try {
      await userAPI.delete(user.id)
      message.success('删除成功')
      loadUsers(pagination.current, pagination.pageSize)
    } catch (error) {
      const err = error as AxiosError<{ error: string }>
      message.error(err.response?.data?.error || '删除失败')
    }
  }

  const handleResetPassword = async (user: User) => {
    try {
      await userAPI.resetPassword(user.id)
      message.success('密码已重置为 123456')
    } catch (error) {
      const err = error as AxiosError<{ error: string }>
      message.error(err.response?.data?.error || '重置密码失败')
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>
          {roleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString('zh-CN'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          {record.id !== currentUser?.id && record.role !== 'super_admin' && (
            <Popconfirm
              title="确定删除该用户？"
              description="删除后不可恢复"
              onConfirm={() => handleDelete(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="user-manage-container">
      <div className="user-manage-header">
        <div className="user-search-area">
          <Input
            ref={searchInput}
            placeholder="搜索用户名/姓名/邮箱"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={handleSearch}
            className="user-search-input"
            prefix={<SearchOutlined style={{ color: '#999' }} />}
            allowClear
          />
          <Button type="primary" onClick={handleSearch} className="user-search-btn">搜索</Button>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} className="user-add-btn">
          新增
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 900 }}
        size="small"
      />

      <style>{`
        .user-manage-container {
          padding: 0 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .user-manage-container .ant-table-wrapper {
          width: 100%;
          max-width: 1000px;
        }
        .user-manage-header {
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .user-search-area {
          display: flex;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }
        .user-search-input {
          flex: 1;
          min-width: 150px;
          max-width: 280px;
        }
        .user-search-btn {
          flex-shrink: 0;
        }
        .user-add-btn {
          flex-shrink: 0;
        }
        @media screen and (max-width: 480px) {
          .user-manage-header {
            flex-direction: column;
            align-items: stretch;
          }
          .user-search-area {
            width: 100%;
          }
          .user-search-input {
            max-width: none;
          }
          .user-add-btn {
            width: 100%;
            margin-top: 8px;
          }
        }
      `}</style>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          {!editingUser && (
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
              ]}
            >
              <Input placeholder="请输入用户名（登录用）" maxLength={50} />
            </Form.Item>
          )}

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' },
              ]}
            >
              <Input.Password placeholder="请输入密码" maxLength={50} />
            </Form.Item>
          )}

          <Form.Item name="name" label="姓名">
            <Input placeholder="请输入真实姓名" maxLength={100} />
          </Form.Item>

          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" maxLength={200} />
          </Form.Item>

          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入联系电话" maxLength={20} />
          </Form.Item>

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
            initialValue="admin"
          >
            <Select
              options={[
                { label: '管理员', value: 'admin' },
                { label: '超级管理员', value: 'super_admin' },
                { label: '访客', value: 'visitor' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}