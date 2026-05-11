import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, App, Steps, Result, Typography } from 'antd'
import { SafetyCertificateOutlined, UserOutlined, GlobalOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

interface SetupStatus {
  initialized: boolean
  has_admin: boolean
  system_name: string
}

export default function Setup() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<SetupStatus | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [initResult, setInitResult] = useState<{ success: boolean; admin_user: string } | null>(null)
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/v1/setup/status')
      const data = await res.json()
      setStatus(data)
      if (data.initialized) {
        setInitResult({ success: true, admin_user: 'admin' })
        setCurrentStep(2)
      }
    } catch {
      message.error('检查系统状态失败')
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  const handleInit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)
      const res = await fetch('/api/v1/setup/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || '初始化失败')
      }
      setInitResult({ success: true, admin_user: values.admin_username })
      setCurrentStep(2)
      message.success('系统初始化成功')
    } catch (err: unknown) {
      message.error(err instanceof Error ? err.message : '初始化失败')
    } finally {
      setLoading(false)
    }
  }

  if (!status) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        加载中...
      </div>
    )
  }

  if (currentStep === 2 && initResult) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
        <Card style={{ width: 500, textAlign: 'center' }}>
          <Result
            status="success"
            title="系统初始化完成"
            subTitle={
              <div>
                <p>管理员账号: <strong>{initResult.admin_user}</strong></p>
                <p style={{ color: '#ff4d4f', marginTop: 8 }}>请牢记您的管理员密码</p>
              </div>
            }
            extra={[
              <Button type="primary" key="login" href="/login">
                前往登录
              </Button>,
            ]}
          />
        </Card>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5', padding: 24 }}>
      <Card style={{ width: 550, maxWidth: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <SafetyCertificateOutlined style={{ fontSize: 64, color: '#1890ff' }} />
          <Title level={3} style={{ marginTop: 16, marginBottom: 0 }}>
            {status.system_name || '实验室资产管理系统'}
          </Title>
          <Text type="secondary">首次配置向导</Text>
        </div>

        <Steps current={currentStep} items={[
          { title: '管理员账号', icon: <UserOutlined /> },
          { title: '系统配置', icon: <GlobalOutlined /> },
          { title: '完成', icon: <SafetyCertificateOutlined /> },
        ]} style={{ marginBottom: 32 }} />

        <Form form={form} layout="vertical">
          {currentStep === 0 && (
            <>
              <Form.Item
                name="admin_username"
                label="管理员用户名"
                rules={[
                  { required: true, message: '请输入管理员用户名' },
                  { min: 3, message: '用户名至少3个字符' },
                  { max: 50, message: '用户名最多50个字符' },
                ]}
                initialValue="admin"
              >
                <Input placeholder="请输入管理员用户名" maxLength={50} />
              </Form.Item>
              <Form.Item
                name="admin_password"
                label="管理员密码"
                rules={[
                  { required: true, message: '请输入管理员密码' },
                  { min: 6, message: '密码至少6个字符' },
                  { max: 100, message: '密码最多100个字符' },
                ]}
              >
                <Input.Password placeholder="请输入管理员密码" maxLength={100} />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label="确认密码"
                dependencies={['admin_password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('admin_password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次密码输入不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入密码" maxLength={100} />
              </Form.Item>
              <Button type="primary" onClick={() => setCurrentStep(1)} block size="large">
                下一步
              </Button>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Form.Item name="system_name" label="系统名称" initialValue="实验室资产管理系统">
                <Input placeholder="请输入系统名称" maxLength={100} />
              </Form.Item>
              <Form.Item name="lab_name" label="实验室名称" initialValue="实验室">
                <Input placeholder="请输入实验室名称" maxLength={100} />
              </Form.Item>
              <div style={{ display: 'flex', gap: 12 }}>
                <Button onClick={() => setCurrentStep(0)} block size="large">
                  上一步
                </Button>
                <Button type="primary" onClick={handleInit} loading={loading} block size="large">
                  完成初始化
                </Button>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  )
}