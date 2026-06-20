import { useEffect, useState } from 'react'
import { Tree, Button, Modal, Form, Input, Card, Space, Popconfirm, App, Tag, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons'
import { categoryAPI } from '../services/api'
import type { Category } from '../services/api'

export default function CategoryManage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<React.Key[]>([])
  const [form] = Form.useForm()
  const { message: antMessage } = App.useApp()

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    try {
      const res = await categoryAPI.tree()
      setCategories(res.data)
    } catch (error) {
      antMessage.error('加载分类失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = (parentId?: number) => {
    setEditingCategory(null)
    form.resetFields()
    form.setFieldsValue({ parent_id: parentId })
    setModalVisible(true)
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    form.setFieldsValue({
      name: category.name,
      label: category.label,
      parent_id: category.parent_id,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await categoryAPI.delete(id)
      antMessage.success('删除成功')
      loadCategories()
    } catch (error: any) {
      // 显示后端返回的具体错误信息（如"该分类下有资产，无法删除"）
      antMessage.error(error.response?.data?.error || '删除失败')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedKeys.length === 0) return
    try {
      await categoryAPI.deleteBatch(selectedKeys as number[])
      antMessage.success('批量删除成功')
      setSelectedKeys([])
      loadCategories()
    } catch (error) {
      antMessage.error('批量删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, values)
        antMessage.success('更新成功')
      } else {
        await categoryAPI.create(values)
        antMessage.success('创建成功')
      }
      setModalVisible(false)
      loadCategories()
    } catch (error: any) {
      // 只有非表单校验错误才提示
      if (!error.errorFields) {
        antMessage.error(error.response?.data?.error || '操作失败')
      }
      // 失败时保持弹窗打开，不调用 setModalVisible(false)
    }
  }

  const buildTreeData = (cats: Category[]): any[] => {
    return cats.map(cat => ({
      key: cat.id,
      title: (
        <div className="category-tree-item">
          <div className="category-info">
            <span className="category-name">{cat.name}</span>
            {cat.label && <Tag color="blue" className="category-label">{cat.label}</Tag>}
          </div>
          <Space size="small" className="category-actions">
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => handleAdd(cat.id)} className="action-btn add-action-btn">
              添加
            </Button>
            <Button size="small" type="text" icon={<EditOutlined />} onClick={() => handleEdit(cat)} className="action-btn edit-action-btn">
              编辑
            </Button>
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(cat.id)}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} className="action-btn delete-action-btn">
                删除
              </Button>
            </Popconfirm>
          </Space>
        </div>
      ),
      children: cat.children ? buildTreeData(cat.children) : undefined,
    }))
  }

  // 递归渲染分类选项
  const renderCategoryOptions = (cats: Category[], depth = 0): React.ReactNode[] => {
    const result: React.ReactNode[] = []
    cats.forEach(cat => {
      // 编辑时排除自己及其子节点
      if (editingCategory && cat.id === editingCategory.id) return

      result.push(
        <Select.Option key={cat.id} value={cat.id}>
          {'  '.repeat(depth)}{cat.name}
        </Select.Option>
      )
      if (cat.children && cat.children.length > 0) {
        result.push(...renderCategoryOptions(cat.children, depth + 1))
      }
    })
    return result
  }

  const treeData = buildTreeData(categories)

  return (
    <div className="category-page">
      <div className="page-header">
        <div className="header-left">
          <h2 id="category-manage-title">分类管理</h2>
          <Tag id="category-manage-count" color="blue">{categories.length} 个分类</Tag>
        </div>
        <Button id="category-manage-add-btn" type="primary" icon={<PlusOutlined />} onClick={() => handleAdd()} className="add-btn">
          添加顶级分类
        </Button>
      </div>

      {selectedKeys.length > 0 && (
        <div className="selection-bar">
          <div className="selection-info">
            <span className="selection-count">已选择 <strong>{selectedKeys.length}</strong> 项</span>
            <Button
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setSelectedKeys([])}
            >
              清除选择
            </Button>
          </div>
          <Popconfirm
            title={`确定删除选中的 ${selectedKeys.length} 项分类？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<DeleteOutlined />}>
              批量删除
            </Button>
          </Popconfirm>
        </div>
      )}

      <Card loading={loading} className="tree-card">
        <Tree
          showLine
          defaultExpandAll
          checkable
          checkedKeys={selectedKeys}
          onCheck={(checked) => {
            setSelectedKeys(checked as React.Key[])
          }}
          treeData={treeData}
        />
      </Card>

      <Modal
        title={editingCategory ? '编辑分类' : '添加分类'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        className="category-modal"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="分类名称"
            rules={[{ required: true, message: '请输入分类名称' }]}
          >
            <Input id="category-form-name" placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="label" label="自定义标签">
            <Input id="category-form-label" placeholder="请输入自定义标签（可选）" />
          </Form.Item>
          <Form.Item name="parent_id" label="父级分类">
            <Select
              id="category-form-parent"
              placeholder="留空为顶级分类"
              allowClear
              showSearch
              optionFilterProp="children"
            >
              <Select.Option value={undefined}>顶级分类</Select.Option>
              {renderCategoryOptions(categories)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .category-page {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .page-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .add-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .add-btn:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
        }

        .selection-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
          margin-bottom: 16px;
          animation: slideDown 0.2s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .selection-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .selection-count {
          color: #fff;
          font-size: 14px;
        }

        .selection-count strong {
          font-size: 16px;
          margin-right: 4px;
        }

        .selection-bar .ant-btn-link {
          color: rgba(255, 255, 255, 0.8);
          padding: 0;
        }

        .selection-bar .ant-btn-link:hover {
          color: #fff;
        }

        .selection-bar .ant-btn-danger {
          background: #fff;
          color: #ff4d4f;
          border: none;
          font-weight: 600;
        }

        .selection-bar .ant-btn-danger:hover {
          background: #f0f0f0;
          color: #ff7875;
        }

        .tree-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .tree-card .ant-tree-node-selected {
          background-color: #f0f0f0 !important;
          color: #000 !important;
        }

        .tree-card .ant-tree-node-content-wrapper.ant-tree-node-selected {
          background-color: #f0f0f0 !important;
          color: #000 !important;
        }

        .tree-card .ant-tree-node-content-wrapper.ant-tree-node-selected .category-name {
          color: #000 !important;
        }

        .tree-card .ant-tree-node-content-wrapper.ant-tree-node-selected .ant-tag {
          background-color: #722ed1 !important;
          border-color: #722ed1 !important;
          color: #fff !important;
        }

        .tree-card .ant-tree-switcher {
          background: transparent !important;
        }

        .category-tree-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
        }

        .category-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .category-name {
          font-weight: 500;
        }

        .category-label {
          font-size: 11px;
        }

        .category-actions {
          opacity: 0;
          transition: opacity 0.2s;
        }

        .category-tree-item:hover .category-actions {
          opacity: 1;
        }

        .action-btn {
          padding: 4px 8px;
          font-size: 12px;
        }

        .action-btn:hover {
          background: #f0f0f0;
          border-radius: 4px;
        }

        .add-action-btn,
        .edit-action-btn {
          color: #52c41a !important;
        }

        .add-action-btn:hover,
        .edit-action-btn:hover {
          background: #f0f7e6 !important;
          color: #73d13d !important;
        }

        .delete-action-btn {
          color: #ff4d4f !important;
        }

        .delete-action-btn:hover {
          background: #fff1f0 !important;
          color: #ff7875 !important;
        }

        .category-modal .ant-modal-content {
          border-radius: 12px;
        }
      `}</style>
    </div>
  )
}
