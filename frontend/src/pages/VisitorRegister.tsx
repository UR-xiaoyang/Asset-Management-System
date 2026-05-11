import { useState } from 'react'
import { Form, Input, Button, Card, App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function VisitorRegister() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { message } = App.useApp()

  const handleRegister = async (values: { username: string; name: string; phone?: string; email?: string; password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码输入不一致')
      return
    }

    if (values.password.length < 6) {
      message.error('密码长度至少6位')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.visitorRegister({
        username: values.username,
        name: values.name,
        phone: values.phone,
        email: values.email,
        password: values.password,
      })
      login(res.data.token, res.data.user)
      message.success('注册成功！')
      setTimeout(() => navigate('/visitor/apply'), 500)
    } catch (error: any) {
      message.error(error.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <Card
        title={<span style={{ fontSize: 20, fontWeight: 600 }}>访客注册</span>}
        style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        headStyle={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}
      >
        <p style={{ color: '#666', marginBottom: 24 }}>
          注册后即可申请借用实验室资产
        </p>

        <Form layout="vertical" onFinish={handleRegister}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3个字符' }]}
          >
            <Input id="visitor-register-username" placeholder="请输入用户名（登录用）" />
          </Form.Item>

          <Form.Item
            name="name"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input id="visitor-register-name" placeholder="请输入真实姓名" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
          >
            <Input id="visitor-register-phone" placeholder="请输入联系电话（选填）" />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input id="visitor-register-email" placeholder="用于接收审批通知（选填）" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }, { min: 6, message: '密码至少6位' }]}
          >
            <Input.Password id="visitor-register-password" placeholder="请输入登录密码（至少6位）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次密码输入不一致'))
                },
              }),
            ]}
          >
            <Input.Password id="visitor-register-confirm" placeholder="请再次输入密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button id="visitor-register-submit" type="primary" htmlType="submit" loading={loading} block size="large">
              注册
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a id="visitor-register-login-link" onClick={() => navigate('/visitor/login')} style={{ cursor: 'pointer' }}>
            已有账号？立即登录
          </a>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <a id="visitor-register-admin-link" onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#999' }}>
            管理员登录入口
          </a>
        </div>
      </Card>
    </div>
  )
}