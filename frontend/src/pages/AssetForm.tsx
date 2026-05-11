import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, InputNumber, Select, Button, Card, Row, Col, App } from 'antd'
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { assetAPI, categoryAPI } from '../services/api'
import { useAuthStore } from '../store/auth'
import type { Category } from '../services/api'

interface AssetFormData {
  name: string
  category_id?: number
  spec: string
  quantity: number
  owner: string
  location: string
  registered_by: string
}

export default function AssetForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const isEdit = !!id
  const { message: antMessage } = App.useApp()
  const { user } = useAuthStore()

  useEffect(() => {
    loadCategories()
    if (id) {
      loadAsset()
    }
  }, [id])

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.list()
      setCategories(res.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadAsset = async () => {
    try {
      const res = await assetAPI.get(Number(id))
      form.setFieldsValue({
        name: res.data.name,
        category_id: res.data.category_id,
        spec: res.data.spec,
        quantity: res.data.quantity,
        owner: res.data.owner,
        location: res.data.location,
        registered_by: res.data.registered_by,
      })
    } catch (error) {
      antMessage.error('加载资产失败')
      navigate('/assets')
    }
  }

  const onFinish = async (values: AssetFormData) => {
    setLoading(true)
    try {
      if (isEdit) {
        // 编辑模式：保留原登记人，不覆盖
        await assetAPI.update(Number(id), values)
      } else {
        // 新增模式：自动使用当前用户名
        await assetAPI.create({ ...values, registered_by: user?.username || '' })
      }
      // 成功后显示消息并跳转，延迟跳转让消息有时间显示
      const msg = isEdit ? '更新成功' : '创建成功'
      antMessage.success(msg)
      setTimeout(() => navigate('/assets'), 300)
    } catch (error: any) {
      antMessage.error(error.response?.data?.error || '操作失败')
      // 失败时表单保持打开，用户可修改后重试
      setLoading(false)
    }
  }

  return (
    <div>
      <Button id="asset-form-back-btn" icon={<ArrowLeftOutlined />} onClick={() => navigate('/assets')} style={{ marginBottom: 16 }}>
        返回列表
      </Button>
      <Card id="asset-form-card" title={isEdit ? '编辑资产' : '新增资产'}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ quantity: 1 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="资产名称"
                rules={[{ required: true, message: '请输入资产名称' }]}
              >
                <Input id="asset-form-name" placeholder="请输入资产名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category_id" label="分类">
                <Select
                  id="asset-form-category"
                  placeholder="请选择分类"
                  options={categories}
                  fieldNames={{ label: 'name', value: 'id' }}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="spec" label="规格">
                <Input id="asset-form-spec" placeholder="请输入规格" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="数量"
                rules={[{ required: true, message: '请输入数量' }]}
              >
                <InputNumber id="asset-form-quantity" min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="owner" label="所有人">
                <Input id="asset-form-owner" placeholder="请输入所有人" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="location" label="存放位置">
                <Input id="asset-form-location" placeholder="请输入存放位置" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="registered_by" label="登记人">
            <Input id="asset-form-registered-by" value={user?.username || ''} readOnly disabled />
          </Form.Item>
          <Form.Item>
            <Button id="asset-form-submit" type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}