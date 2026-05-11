import { useState } from 'react'
import { Form, Input, Button, Card, App } from 'antd'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function VisitorLogin() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const { message } = App.useApp()

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authAPI.visitorLogin(values.username, values.password)
      login(res.data.token, res.data.user)
      message.success('登录成功！')
      setTimeout(() => navigate('/visitor/apply'), 500)
    } catch (error: any) {
      message.error(error.response?.data?.error || '登录失败，请检查用户名和密码')
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
        title={<span style={{ fontSize: 20, fontWeight: 600 }}>访客登录</span>}
        style={{ width: 400, boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}
        headStyle={{ textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}
      >
        <p style={{ color: '#666', marginBottom: 24 }}>
          请使用注册时填写的用户名和密码登录
        </p>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input id="visitor-login-username" placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password id="visitor-login-password" placeholder="请输入登录密码" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button id="visitor-login-submit" type="primary" htmlType="submit" loading={loading} block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <a id="visitor-login-register-link" onClick={() => navigate('/visitor/register')} style={{ cursor: 'pointer' }}>
            没有账号？立即注册
          </a>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
          <a id="visitor-login-admin-link" onClick={() => navigate('/login')} style={{ cursor: 'pointer', color: '#999' }}>
            管理员登录入口
          </a>
        </div>
      </Card>
    </div>
  )
}