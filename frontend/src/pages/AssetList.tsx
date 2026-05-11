import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Input, Space, Tag, Popconfirm, Card, TreeSelect, Tooltip, App, Badge } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PrinterOutlined, SearchOutlined, CloseOutlined } from '@ant-design/icons'
import { assetAPI, categoryAPI } from '../services/api'
import type { Asset, Category } from '../services/api'
import ImportModal from '../components/ImportModal'
import PrintLabelModal from '../components/PrintLabelModal'
import BatchEditModal from '../components/BatchEditModal'

export default function AssetList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [keyword, setKeyword] = useState('')
  const [categoryId, setCategoryId] = useState<number | undefined>()
  const [categories, setCategories] = useState<Category[]>([])
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [printModalOpen, setPrintModalOpen] = useState(false)
  const [batchEditModalOpen, setBatchEditModalOpen] = useState(false)
  const { message: antMessage } = App.useApp()

  // 监听行选择变化
  const onSelectChange = (keys: React.Key[]) => {
    setSelectedRowKeys(keys)
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadAssets()
  }, [page, keyword, categoryId])

  const loadCategories = async () => {
    try {
      const res = await categoryAPI.tree()
      setCategories(res.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadAssets = async () => {
    setLoading(true)
    try {
      const res = await assetAPI.list({ page, page_size: 10, keyword, category_id: categoryId })
      setAssets(res.data.items)
      setTotal(res.data.total)
    } catch (error) {
      antMessage.error('加载资产失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await assetAPI.delete(id)
      antMessage.success('删除成功')
      loadAssets()
    } catch (error) {
      antMessage.error('删除失败')
    }
  }

  const handleBatchDelete = async () => {
    try {
      await assetAPI.deleteBatch(selectedRowKeys as number[])
      antMessage.success('批量删除成功')
      setSelectedRowKeys([])
      loadAssets()
    } catch (error) {
      antMessage.error('批量删除失败')
    }
  }

  const handlePrintSingle = (asset: Asset) => {
    setSelectedRowKeys([asset.id])
    setPrintModalOpen(true)
  }

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (name: string, record: Asset) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500 }}>{name}</span>
          {record.quantity > 0 && (
            <Badge count={record.quantity} style={{ backgroundColor: '#52c41a', fontSize: 10 }} showZero={false} />
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: Category) => category?.name ? (
        <Tag color="blue">{category.name}</Tag>
      ) : '-',
    },
    {
      title: '规格',
      dataIndex: 'spec',
      key: 'spec',
      minWidth: 100,
    },
    {
      title: '所有人',
      dataIndex: 'owner',
      key: 'owner',
      minWidth: 80,
    },
    {
      title: '存放位置',
      dataIndex: 'location',
      key: 'location',
      minWidth: 100,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 70,
      align: 'center' as const,
    },
    {
      title: 'UUID',
      dataIndex: 'uuid',
      key: 'uuid',
      width: 140,
      render: (uuid: string) => (
        <Tooltip title={uuid}>
          <Tag
            style={{ cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}
            onClick={() => { navigator.clipboard.writeText(uuid); antMessage.success('已复制'); }}
          >
            {uuid}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      // 移除 fixed 属性，避免移动端测量行问题
      render: (_: any, record: Asset) => (
        <Space size="small">
          <Tooltip title="打印标签">
            <Button type="text" icon={<PrinterOutlined />} size="small" onClick={() => handlePrintSingle(record)} />
          </Tooltip>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => navigate(`/assets/${record.id}`)} />
          </Tooltip>
          <Popconfirm
            title="确定删除？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div id="asset-list-page" className="asset-list-page">
      <div className="page-header">
        <div className="header-left">
          <h2 id="asset-list-title">资产管理</h2>
          <span id="asset-list-count" className="total-count">共 {total} 项</span>
        </div>
        <Space>
          <Button id="asset-list-import-btn" icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>
            批量导入
          </Button>
          <Button id="asset-list-add-btn" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/assets/new')}>
            新增资产
          </Button>
        </Space>
      </div>

      {/* 批量选择操作栏 - 当有选中项时显示 */}
      {selectedRowKeys.length > 0 && (
        <div id="asset-list-selection-bar" className="selection-bar">
          <div className="selection-info">
            <span id="asset-list-selection-count" className="selection-count">已选择 <strong>{selectedRowKeys.length}</strong> 项资产</span>
            <Button
              id="asset-list-clear-selection-btn"
              type="link"
              size="small"
              icon={<CloseOutlined />}
              onClick={() => setSelectedRowKeys([])}
            >
              清除选择
            </Button>
          </div>
          <Button
            id="asset-list-batch-print-btn"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={() => setPrintModalOpen(true)}
          >
            打印标签 ({selectedRowKeys.length})
          </Button>
          <Button
            id="asset-list-batch-edit-btn"
            icon={<EditOutlined />}
            onClick={() => setBatchEditModalOpen(true)}
          >
            批量修改
          </Button>
          <Popconfirm
            title={`确定删除选中的 ${selectedRowKeys.length} 项资产？`}
            onConfirm={handleBatchDelete}
            okText="确定"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button
              id="asset-list-batch-delete-btn"
              danger
              icon={<DeleteOutlined />}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          </Popconfirm>
        </div>
      )}

      <div id="asset-list-filter-section" className="filter-section">
        <div className="filter-row">
          <Input
            id="asset-list-search-input"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            placeholder="搜索资产名称/所有人/位置"
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            style={{ width: 280 }}
            allowClear
            className="search-input"
          />
          <TreeSelect
            id="asset-list-category-select"
            placeholder="选择分类"
            style={{ width: 200 }}
            allowClear
            treeDefaultExpandAll
            value={categoryId}
            onChange={(value) => { setCategoryId(value); setPage(1); }}
            fieldNames={{ label: 'name', value: 'id', children: 'children' }}
            treeData={categories}
            className="category-tree-select"
          />
          {(keyword || categoryId) && (
            <Button id="asset-list-clear-filter-btn" type="link" onClick={() => { setKeyword(''); setCategoryId(undefined); setPage(1); }} className="clear-filter-btn">
              清除筛选
            </Button>
          )}
        </div>
      </div>

      <Card id="asset-list-table-card" className="table-card">
        <Table
          id="asset-list-table"
          rowKey="id"
          loading={loading}
          dataSource={assets}
          columns={columns}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            total,
            pageSize: 10,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 条`,
            onChange: setPage,
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: onSelectChange,
          }}
          size="middle"
        />
      </Card>

      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onSuccess={loadAssets}
      />

      <PrintLabelModal
        open={printModalOpen}
        onClose={() => {
          setPrintModalOpen(false)
          setSelectedRowKeys([])
        }}
        assetIds={selectedRowKeys as number[]}
      />

      <BatchEditModal
        open={batchEditModalOpen}
        onClose={() => setBatchEditModalOpen(false)}
        onSuccess={loadAssets}
        assetIds={selectedRowKeys as number[]}
      />

      <style>{`
        .asset-list-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
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
          margin-bottom: 8px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
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

        .total-count {
          color: #8c8c8c;
          font-size: 14px;
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 12px;
        }

        /* 筛选区域 */
        .filter-section {
          background: #fff;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        /* 批量选择操作栏 */
        .selection-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          box-shadow: 0 2px 12px rgba(102, 126, 234, 0.3);
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

        .selection-bar .ant-btn-primary {
          background: #fff;
          color: #667eea;
          border: none;
          font-weight: 600;
        }

        .selection-bar .ant-btn-primary:hover {
          background: #f0f0f0;
          color: #5a6fd6;
        }

        .filter-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .search-input {
          border-radius: 8px;
          transition: all 0.2s;
        }

        .search-input:hover,
        .search-input:focus-within {
          border-color: #667eea;
          box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
        }

        .category-tree-select {
          border-radius: 8px;
        }

        .clear-filter-btn {
          color: #8c8c8c;
          padding-left: 8px;
        }

        .clear-filter-btn:hover {
          color: #667eea;
        }

        /* 表格卡片 */
        .table-card {
          border-radius: 12px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .table-card .ant-card-body {
          padding: 0;
        }

        .table-card .ant-table-wrapper {
          margin: 0;
        }

        /* 表格样式优化 */
        .table-card .ant-table-thead > tr > th {
          background: #fafafa;
          font-weight: 600;
          color: #333;
        }

        .table-card .ant-table-tbody > tr:hover > td {
          background: #f9f9ff;
        }

        /* 按钮样式优化 */
        .page-header .ant-btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
          transition: all 0.2s;
        }

        .page-header .ant-btn-primary:hover {
          background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .page-header .ant-btn:not(.ant-btn-primary) {
          border-color: #d9d9d9;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .page-header .ant-btn:not(.ant-btn-primary):hover {
          border-color: #667eea;
          color: #667eea;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 16px;
            border-radius: 16px;
            margin-bottom: 12px;
            box-shadow: 0 2px 12px rgba(102, 126, 234, 0.08);
          }

          .page-header .ant-space {
            width: 100%;
            justify-content: flex-start;
          }

          .filter-section {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(20px);
            padding: 14px 16px;
            border-radius: 14px;
            margin-bottom: 12px;
          }

          .filter-row {
            flex-direction: column;
            gap: 10px;
          }

          .filter-row .ant-input,
          .filter-row .ant-select,
          .filter-row .ant-tree-select {
            width: 100% !important;
            border-radius: 10px;
          }

          .page-header h2 {
            font-size: 18px;
          }

          .table-card {
            border-radius: 16px;
          }

          .total-count {
            font-size: 12px;
            padding: 3px 10px;
          }
        }

        /* 移动端表格适配 */
        @media (max-width: 576px) {
          .asset-list-page .ant-table {
            font-size: 12px;
            min-width: 600px;
            border-radius: 12px;
            overflow: hidden;
          }

          .asset-list-page .ant-table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            border-radius: 12px;
          }

          .asset-list-page .ant-table-container {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .asset-list-page .ant-table-body {
            overflow-x: auto;
          }
        }

        /* 移动端批量选择栏适配 */
        @media (max-width: 576px) {
          .selection-bar {
            flex-direction: column;
            gap: 14px;
            padding: 16px;
            border-radius: 14px;
          }

          .selection-info {
            width: 100%;
            justify-content: space-between;
          }

          .selection-bar .ant-btn-primary {
            width: 100%;
            height: 46px;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  )
}