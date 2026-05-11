import { useState, useEffect } from 'react'
import { Modal, Form, Input, InputNumber, TreeSelect, Button, Space, Alert, App } from 'antd'
import { assetAPI, categoryAPI, type Category } from '../services/api'

interface BatchEditModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  assetIds: number[]
}

export default function BatchEditModal({ open, onClose, onSuccess, assetIds }: BatchEditModalProps) {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const { message: antMessage } = App.useApp()

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.tree()
      setCategories(res.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  useEffect(() => {
    if (open) {
      loadCategories()
      form.resetFields()
    }
  }, [open])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const data: { ids: number[]; category_id?: number; spec?: string; quantity?: number; owner?: string; location?: string } = {
        ids: assetIds,
      }

      if (values.category_id) {
        data.category_id = values.category_id
      }
      if (values.spec) {
        data.spec = values.spec
      }
      if (values.quantity !== undefined && values.quantity !== null) {
        data.quantity = values.quantity
      }
      if (values.owner) {
        data.owner = values.owner
      }
      if (values.location) {
        data.location = values.location
      }

      if (Object.keys(data).length === 1) {
        antMessage.warning('请至少选择一个要修改的字段')
        setLoading(false)
        return
      }

      await assetAPI.updateBatch(data)
      antMessage.success(`成功更新 ${assetIds.length} 条资产`)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      if (error.errorFields) {
        return
      }
      antMessage.error(error.response?.data?.error || '批量修改失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      title={`批量修改资产 (${assetIds.length}项)`}
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit} loading={loading}>
            确认修改
          </Button>
        </Space>
      }
      width={500}
      destroyOnHidden
    >
      <div style={{ padding: '16px 0' }}>
        <Alert
          type="info"
          showIcon
          message="批量修改说明"
          description="只填写需要修改的字段，留空的字段将保持不变。"
          style={{ marginBottom: 16 }}
        />

        <Form form={form} layout="vertical">
          <Form.Item name="category_id" label="分类">
            <TreeSelect
              placeholder="选择分类（留空则不修改）"
              allowClear
              treeDefaultExpandAll
              fieldNames={{ label: 'name', value: 'id', children: 'children' }}
              treeData={categories}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="spec" label="规格">
            <Input placeholder="输入规格（留空则不修改）" />
          </Form.Item>

          <Form.Item name="quantity" label="数量">
            <InputNumber
              placeholder="输入数量（留空则不修改）"
              min={1}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="owner" label="所有人">
            <Input placeholder="输入所有人（留空则不修改）" />
          </Form.Item>

          <Form.Item name="location" label="存放位置">
            <Input placeholder="输入存放位置（留空则不修改）" />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  )
}