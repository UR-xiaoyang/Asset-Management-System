import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, App } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authAPI } from '../services/api'
import { useAuthStore } from '../store/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { login, token } = useAuthStore()
  const { message: antMessage } = App.useApp()

  // 当 token 存在时跳转到首页
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true })
    }
  }, [token, navigate])

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await authAPI.login(values.username, values.password)
      login(res.data.token, res.data.user)
      antMessage.success('登录成功')
      navigate('/', { replace: true })
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '登录失败')
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-shape login-shape-1"></div>
        <div className="login-shape login-shape-2"></div>
        <div className="login-shape login-shape-3"></div>
      </div>

      <Card
        className="login-card"
        title={
          <div className="login-title">
            <div className="login-logo">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="4" fill="url(#gradient1)"/>
                <path d="M8 12h8M12 8v8" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="gradient1" x1="3" y1="3" x2="21" y2="21">
                    <stop stopColor="#667eea"/>
                    <stop offset="1" stopColor="#764ba2"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span>实验室资产管理系统</span>
          </div>
        }
        bordered={false}
      >
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              id="login-username"
              prefix={<UserOutlined />}
              placeholder="用户名"
              size="large"
              className="login-input"
            />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              id="login-password"
              prefix={<LockOutlined />}
              placeholder="密码"
              size="large"
              className="login-input"
            />
          </Form.Item>
          <Form.Item>
            <Button
              id="login-submit-btn"
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              className="login-btn"
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        <div className="login-hint">
          <span className="hint-label">默认账号:</span>
          <code>admin / admin123</code>
        </div>
        <div className="login-footer">
          <a id="login-visitor-link" onClick={() => navigate('/visitor/login')} className="visitor-link">
            访客登录/注册入口 →
          </a>
        </div>
      </Card>

      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
        }

        .login-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .login-shape {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
        }

        .login-shape-1 {
          width: 400px;
          height: 400px;
          background: #89f7fe;
          top: -100px;
          right: -100px;
          animation: float 6s ease-in-out infinite;
        }

        .login-shape-2 {
          width: 300px;
          height: 300px;
          background: #f093fb;
          bottom: -50px;
          left: -50px;
          animation: float 8s ease-in-out infinite reverse;
        }

        .login-shape-3 {
          width: 200px;
          height: 200px;
          background: #4facfe;
          top: 50%;
          left: 50%;
          animation: float 10s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, -20px); }
        }

        .login-card {
          width: 420px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          position: relative;
          z-index: 1;
          animation: slideUp 0.5s ease-out;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .login-card .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
          padding: 24px 24px 16px;
        }

        .login-card .ant-card-body {
          padding: 24px;
        }

        .login-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 700;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-input {
          border-radius: 10px;
          height: 48px;
          transition: all 0.2s;
        }

        .login-input:hover,
        .login-input:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.15);
        }

        .login-btn {
          height: 48px;
          border-radius: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          font-size: 16px;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          transition: all 0.3s;
        }

        .login-btn:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
        }

        .login-hint {
          text-align: center;
          margin-top: 16px;
          color: #8c8c8c;
        }

        .hint-label {
          margin-right: 8px;
        }

        .login-hint code {
          background: #f5f5f5;
          padding: 4px 10px;
          border-radius: 6px;
          font-family: 'SF Mono', Consolas, monospace;
          color: #667eea;
        }

        .login-footer {
          text-align: center;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #f0f0f0;
        }

        .visitor-link {
          color: #667eea;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.2s;
        }

        .visitor-link:hover {
          color: #764ba2;
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 20px;
            align-items: flex-start;
            padding-top: 60px;
          }

          .login-card {
            width: 100%;
            margin: 0;
            border-radius: 24px;
          }

          .login-card .ant-card-head {
            padding: 20px 20px 12px;
          }

          .login-card .ant-card-body {
            padding: 20px;
          }

          .login-title {
            font-size: 18px;
          }

          .login-btn {
            height: 50px;
            font-size: 16px;
          }

          .login-hint code {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
