import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Button, Space } from 'antd'
import { useAuthStore } from '../store/auth'

export default function VisitorHome() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!user) {
      navigate('/visitor/login')
    }
  }, [user, navigate])

  if (!user) return null

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{ textAlign: 'center', maxWidth: 600 }}>
        <h1 id="visitor-home-title" style={{ color: 'white', fontSize: 36, marginBottom: 8 }}>
          欢迎使用实验室资产管理系统
        </h1>
        <p id="visitor-home-username" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 48 }}>
          访客：{user.name}
        </p>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card
            id="visitor-home-apply-card"
            hoverable
            onClick={() => navigate('/visitor/apply')}
            style={{ width: '100%' }}
            headStyle={{ fontSize: 18, fontWeight: 600 }}
          >
            <h3>申请借用资产</h3>
            <p style={{ color: '#666', margin: 0 }}>浏览可借用资产，提交借用申请</p>
          </Card>

          <Card
            id="visitor-home-records-card"
            hoverable
            onClick={() => navigate('/visitor/records')}
            style={{ width: '100%' }}
            headStyle={{ fontSize: 18, fontWeight: 600 }}
          >
            <h3>我的借用记录</h3>
            <p style={{ color: '#666', margin: 0 }}>查看我的借用申请和审批状态</p>
          </Card>
        </Space>

        <div style={{ marginTop: 48 }}>
          <Button id="visitor-home-logout" type="text" onClick={() => navigate('/visitor/login')} style={{ color: 'rgba(255,255,255,0.8)' }}>
            退出登录
          </Button>
        </div>
      </div>
    </div>
  )
}