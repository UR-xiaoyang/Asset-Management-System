import { useState, useEffect } from 'react'
import { Card, Form, Input, InputNumber, Button, Switch, Tabs, App } from 'antd'
import { SettingOutlined, MailOutlined, InfoCircleOutlined } from '@ant-design/icons'
import api from '../services/api'

interface SystemSetting {
  key: string
  value: string
  label: string
  category: string
}

export default function Settings() {
  const [systemForm] = Form.useForm()
  const [emailForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setInitialLoading(true)
    try {
      const res = await api.get('/settings')
      const { system, email } = res.data

      const systemValues: Record<string, string> = {}
      system.forEach((s: SystemSetting) => {
        systemValues[s.key] = s.value
      })
      systemForm.setFieldsValue(systemValues)

      const emailValues: Record<string, string> = {}
      email.forEach((s: SystemSetting) => {
        emailValues[s.key] = s.value
      })
      emailForm.setFieldsValue(emailValues)
    } catch (error: any) {
      antMessage.error('加载设置失败')
    } finally {
      setInitialLoading(false)
    }
  }

  const handleSystemSave = async () => {
    try {
      const values = await systemForm.validateFields()
      setLoading(true)
      await api.put('/settings', { settings: values })
      antMessage.success('系统设置已保存')
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSave = async () => {
    try {
      const values = await emailForm.validateFields()
      setLoading(true)
      await api.put('/settings', { settings: values })
      antMessage.success('邮件设置已保存')
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const systemTabItems = [
    {
      key: 'info',
      label: <span><InfoCircleOutlined /> 系统信息</span>,
      children: (
        <Form form={systemForm} layout="vertical" disabled={initialLoading}>
          <Form.Item name="system_name" label="系统名称">
            <Input placeholder="请输入系统名称" maxLength={100} />
          </Form.Item>
          <Form.Item name="lab_name" label="实验室名称">
            <Input placeholder="请输入实验室名称" maxLength={100} />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" onClick={handleSystemSave} loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  const emailTabItems = [
    {
      key: 'smtp',
      label: <span><MailOutlined /> 邮件配置</span>,
      children: (
        <Form form={emailForm} layout="vertical" disabled={initialLoading}>
          <Form.Item name="smtp_enabled" label="启用邮件通知" valuePropName="checked" extra="开启后，系统将发送邮件通知">
            <Switch />
          </Form.Item>
          <Form.Item name="smtp_host" label="SMTP服务器" rules={[{ required: true, message: '请输入SMTP服务器地址' }]}>
            <Input placeholder="如: smtp.example.com" />
          </Form.Item>
          <Form.Item name="smtp_port" label="SMTP端口" rules={[{ required: true, message: '请输入SMTP端口' }]}>
            <InputNumber placeholder="如: 587" style={{ width: 200 }} min={1} max={65535} />
          </Form.Item>
          <Form.Item name="smtp_user" label="SMTP用户名" rules={[{ required: true, message: '请输入SMTP用户名' }]}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item name="smtp_pass" label="SMTP密码">
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item name="smtp_from" label="发件人邮箱" rules={[{ required: true, message: '请输入发件人邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
            <Input placeholder="如: noreply@example.com" />
          </Form.Item>
          <Form.Item name="smtp_secure" label="使用SSL/TLS" valuePropName="checked" extra="通常465端口需要开启SSL，587端口不需要">
            <Switch />
          </Form.Item>
          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" onClick={handleEmailSave} loading={loading}>
              保存设置
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div style={{ padding: 24, maxWidth: 800 }}>
      <Card
        title={<span><SettingOutlined /> 系统设置</span>}
      >
        <Tabs items={[...systemTabItems, ...emailTabItems]} />
      </Card>
    </div>
  )
}
