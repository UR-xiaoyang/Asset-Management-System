import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { Form, Input, InputNumber, Button, Result, App, Spin } from 'antd'
import { assetAPI, borrowAPI } from '../services/api'
import type { Asset, BorrowRecord } from '../services/api'
import './Borrow.css'

export default function Borrow() {
  const { uuid } = useParams()
  const [searchParams] = useSearchParams()
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [submittedRecord, setSubmittedRecord] = useState<BorrowRecord | null>(null)
  const [form] = Form.useForm()
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    loadAsset()
  }, [uuid])

  const loadAsset = async () => {
    if (!uuid) {
      const uuidParam = searchParams.get('uuid')
      if (uuidParam) {
        await fetchAsset(uuidParam)
      } else {
        setLoading(false)
      }
      return
    }
    await fetchAsset(uuid)
  }

  const fetchAsset = async (assetUUID: string) => {
    setLoading(true)
    try {
      const res = await assetAPI.getByUUID(assetUUID)
      setAsset(res.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        antMessage.error('未找到该资产')
      } else {
        antMessage.error('加载失败')
      }
    } finally {
      setLoading(false)
    }
  }

  const onFinish = async (values: { borrower_name: string; borrower_email?: string; borrower_phone?: string; quantity: number; remark?: string }) => {
    if (!uuid && !asset) {
      antMessage.error('资产信息加载失败')
      return
    }
    setSubmitting(true)
    try {
      const res = await borrowAPI.create({
        asset_uuid: asset!.uuid,
        borrower_name: values.borrower_name,
        borrower_email: values.borrower_email,
        borrower_phone: values.borrower_phone,
        quantity: values.quantity,
        remark: values.remark,
      })
      setSubmittedRecord(res.data)
      setSuccess(true)
      antMessage.success('申请已提交，请等待审批')
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="mobile-page-container">
        <div className="mobile-loading">
          <Spin size="large" />
          <p>加载中...</p>
        </div>
      </div>
    )
  }

  if (!asset) {
    return (
      <div className="mobile-page-container">
        <Result
          className="mobile-result"
          status="error"
          title="资产未找到"
          subTitle="请扫描正确的资产二维码，或联系管理员"
        />
      </div>
    )
  }

  if (success && submittedRecord) {
    return (
      <div className="mobile-page-container">
        <div className="mobile-success-card">
          <div className="success-icon">✓</div>
          <h2>借用申请已提交</h2>
          <p className="success-desc">您的借用申请已提交，正在等待管理员审批。</p>
          <div className="success-info">
            <div className="info-row">
              <span className="label">申请编号</span>
              <span className="value">{submittedRecord.id}</span>
            </div>
            <div className="info-row">
              <span className="label">资产名称</span>
              <span className="value">{asset.name}</span>
            </div>
            <div className="info-row">
              <span className="label">借用数量</span>
              <span className="value">{submittedRecord.quantity}</span>
            </div>
          </div>
          <p className="success-tip">审批结果将通过邮件通知您，请注意查收。</p>
          <Button type="primary" block size="large" onClick={() => window.close()}>
            关闭页面
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-page-container">
      {/* 资产信息卡片 */}
      <div className="mobile-asset-card">
        <div className="asset-header">
          <h2>{asset.name}</h2>
          <span className={`quantity-badge ${asset.quantity > 0 ? 'available' : 'unavailable'}`}>
            {asset.quantity > 0 ? `可借 ${asset.quantity}` : '已借完'}
          </span>
        </div>
        <div className="asset-details">
          <div className="detail-row">
            <span className="detail-label">规格</span>
            <span className="detail-value">{asset.spec || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">所有人</span>
            <span className="detail-value">{asset.owner || '-'}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label">位置</span>
            <span className="detail-value">{asset.location || '-'}</span>
          </div>
        </div>
      </div>

      {/* 借用表单 */}
      <div className="mobile-form-card">
        <h3>填写借用信息</h3>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1 }}
        >
          <Form.Item
            name="borrower_name"
            label="姓名"
            rules={[{ required: true, message: '请输入您的姓名' }]}
          >
            <Input id="borrow-name-input" placeholder="请输入您的姓名" size="large" />
          </Form.Item>

          <Form.Item
            name="borrower_phone"
            label="联系电话"
          >
            <Input id="borrow-phone-input" placeholder="请输入联系电话" size="large" type="tel" />
          </Form.Item>

          <Form.Item
            name="borrower_email"
            label="邮箱"
            rules={[{ type: 'email', message: '请输入有效的邮箱' }]}
          >
            <Input id="borrow-email-input" placeholder="用于接收审批通知" size="large" type="email" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="借用数量"
            rules={[
              { required: true, message: '请输入数量' },
              { type: 'number', min: 1, message: '数量最少为1' },
              { type: 'number', max: asset.quantity, message: `不能超过可用数量(${asset.quantity})` },
            ]}
          >
            <InputNumber min={1} max={asset.quantity} style={{ width: '100%' }} size="large" />
          </Form.Item>

          <Form.Item name="remark" label="备注">
            <Input.TextArea id="borrow-remark-input" placeholder="请输入借用原因或其他备注" rows={3} />
          </Form.Item>

          <Form.Item>
            <Button id="borrow-submit-btn"
              type="primary"
              htmlType="submit"
              loading={submitting}
              block
              size="large"
              disabled={asset.quantity <= 0}
            >
              提交申请
            </Button>
          </Form.Item>
        </Form>
      </div>

      <div className="mobile-tip">
        提交申请后，管理员将在1-2个工作日内完成审批
      </div>
    </div>
  )
}