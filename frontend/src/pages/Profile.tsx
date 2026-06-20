import { useEffect, useState } from 'react'
import { Form, Input, Button, message, Card, Divider } from 'antd'
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { userAPI } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { AxiosError } from 'axios'

export default function Profile() {
  const { user: currentUser } = useAuthStore()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      form.setFieldsValue({
        username: currentUser.username,
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role,
      })
    }
  }, [currentUser, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      await userAPI.update(currentUser!.id, {
        name: values.name,
        email: values.email,
        phone: values.phone,
      })

      // 更新成功后同步到 store
      useAuthStore.getState().updateUser({
        name: values.name,
        email: values.email,
        phone: values.phone,
      })

      message.success('个人信息更新成功')
    } catch (error) {
      const err = error as AxiosError<{ error: string }>
      message.error(err.response?.data?.error || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-container">
      <Card title="个人信息" className="profile-card">
        <Form form={form} layout="vertical" disabled>
          <Form.Item name="username" label="用户名">
            <Input prefix={<UserOutlined />} />
          </Form.Item>

          <Form.Item name="role" label="角色">
            <Input />
          </Form.Item>
        </Form>

        <Divider />

        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="请输入姓名" maxLength={100} />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="请输入邮箱" maxLength={200} />
          </Form.Item>

          <Form.Item
            name="phone"
            label="电话"
          >
            <Input prefix={<PhoneOutlined />} placeholder="请输入联系电话" maxLength={20} />
          </Form.Item>
        </Form>

        <div className="profile-actions">
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            保存修改
          </Button>
        </div>
      </Card>

      <style>{`
        .profile-container {
          max-width: 500px;
          margin: 0 auto;
          padding: 0 8px;
        }

        .profile-card {
          margin-bottom: 24px;
        }

        .profile-actions {
          margin-top: 24px;
          display: flex;
          justify-content: flex-end;
        }

        @media screen and (max-width: 480px) {
          .profile-container {
            padding: 0;
          }
        }
      `}</style>
    </div>
  )
}
