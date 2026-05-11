import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Statistic, Tag, List, Avatar, Button } from 'antd'
import {
  AppstoreOutlined,
  ShoppingOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { assetAPI, borrowAPI } from '../services/api'
import type { BorrowRecord } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const [assetCount, setAssetCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [recentBorrows, setRecentBorrows] = useState<BorrowRecord[]>([])

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [assetRes, borrowRes, pendingRes] = await Promise.all([
        assetAPI.list({ page: 1, page_size: 1 }),
        borrowAPI.list({ page: 1, page_size: 100 }),
        borrowAPI.pending(),
      ])
      setAssetCount(assetRes.data.total)
      setPendingCount(pendingRes.data.length)

      const borrows = borrowRes.data.items
      setRecentBorrows(borrows.slice(0, 5))
      setApprovedCount(borrows.filter(b => b.status === 'approved').length)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审批' },
      approved: { color: 'green', text: '已通过' },
      rejected: { color: 'red', text: '已拒绝' },
      returned: { color: 'blue', text: '已归还' },
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 id="dashboard-title">欢迎回来 👋</h1>
        <p id="dashboard-subtitle" className="subtitle">实时查看实验室资产统计数据</p>
      </div>

      <Row gutter={[20, 20]}>
        {/* 资产总数 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-green">
            <div className="stat-icon-wrapper">
              <div className="stat-icon stat-icon-green">
                <AppstoreOutlined />
              </div>
            </div>
            <div className="stat-content">
              <Statistic
                title="资产总数"
                value={assetCount}
                styles={{ content: { color: '#52c41a', fontWeight: 600 } }}
              />
            </div>
            <div className="stat-trend up">
              <span>+12%</span> 较上月
            </div>
          </Card>
        </Col>

        {/* 待审批 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-orange">
            <div className="stat-icon-wrapper">
              <div className="stat-icon stat-icon-orange">
                <ClockCircleOutlined />
              </div>
            </div>
            <div className="stat-content">
              <Statistic
                title="待审批"
                value={pendingCount}
                styles={{ content: { color: '#fa8c16', fontWeight: 600 } }}
              />
            </div>
            <div className="stat-trend down">
              <span>-5%</span> 较上周
            </div>
          </Card>
        </Col>

        {/* 借用中 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-blue">
            <div className="stat-icon-wrapper">
              <div className="stat-icon stat-icon-blue">
                <ShoppingOutlined />
              </div>
            </div>
            <div className="stat-content">
              <Statistic
                title="借用中"
                value={approvedCount}
                styles={{ content: { color: '#1890ff', fontWeight: 600 } }}
              />
            </div>
            <div className="stat-trend up">
              <span>+3%</span> 较上周
            </div>
          </Card>
        </Col>

        {/* 本月借用 */}
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card stat-card-purple">
            <div className="stat-icon-wrapper">
              <div className="stat-icon stat-icon-purple">
                <FileTextOutlined />
              </div>
            </div>
            <div className="stat-content">
              <Statistic
                title="本月借用"
                value={recentBorrows.length}
                styles={{ content: { color: '#722ed1', fontWeight: 600 } }}
              />
            </div>
            <div className="stat-trend neutral">
              持续增长
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} xl={16}>
          <Card
            className="recent-card"
            title={
              <div className="card-title-wrapper">
                <span>最近借用记录</span>
                <Button type="link" id="dashboard-view-more-borrows" onClick={() => navigate('/borrows')} className="view-more">查看更多 →</Button>
              </div>
            }
          >
            {recentBorrows.length > 0 ? (
              <List
                dataSource={recentBorrows}
                renderItem={(item) => (
                  <List.Item className="borrow-item">
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          icon={<ShoppingOutlined />}
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
                          }}
                        />
                      }
                      title={`${item.borrower_name} · ${item.asset?.name || item.asset_uuid}`}
                      description={
                        <span className="borrow-meta">
                          借用了 <Tag color="blue">{item.quantity} 件</Tag> · {item.borrow_date}
                        </span>
                      }
                    />
                    <div className="borrow-action">
                      {getStatusTag(item.status)}
                    </div>
                  </List.Item>
                )}
              />
            ) : (
              <div className="empty-state">
                <FileTextOutlined className="empty-icon" />
                <p>暂无借用记录</p>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} xl={8}>
          <Card className="quick-card" title="快捷操作">
            <div className="quick-actions">
              <a id="dashboard-add-asset" onClick={() => navigate('/assets/new')} className="quick-action-item">
                <div className="quick-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <AppstoreOutlined />
                </div>
                <span>添加资产</span>
              </a>
              <a id="dashboard-borrow-approval" onClick={() => navigate('/borrows')} className="quick-action-item">
                <div className="quick-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <ShoppingOutlined />
                </div>
                <span>借用审批</span>
              </a>
              <a id="dashboard-category-manage" onClick={() => navigate('/categories')} className="quick-action-item">
                <div className="quick-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <FileTextOutlined />
                </div>
                <span>分类管理</span>
              </a>
              <a id="dashboard-scan-borrow" onClick={() => navigate('/scan')} className="quick-action-item">
                <div className="quick-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <AppstoreOutlined />
                </div>
                <span>扫码借用</span>
              </a>
            </div>
          </Card>

          <Card className="tips-card" style={{ marginTop: 20 }}>
            <div className="tips-header">
              <span>💡 小贴士</span>
            </div>
            <p className="tips-content">
              点击左侧菜单「资产管理」，可以快速添加新资产或批量导入现有资产。
            </p>
          </Card>
        </Col>
      </Row>

      <style>{`
        .dashboard-page {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .page-header {
          margin-bottom: 24px;
        }

        .page-header h1 {
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #8c8c8c;
          margin: 0;
          font-size: 15px;
        }

        /* 统计卡片 */
        .stat-card {
          border-radius: 16px;
          border: none;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
        }

        .stat-card-green::before { background: linear-gradient(90deg, #52c41a, #73d13d); }
        .stat-card-orange::before { background: linear-gradient(90deg, #fa8c16, #ffa940); }
        .stat-card-blue::before { background: linear-gradient(90deg, #1890ff, #40a9ff); }
        .stat-card-purple::before { background: linear-gradient(90deg, #722ed1, #9254de); }

        .stat-card .ant-card-body {
          padding: 20px;
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .stat-icon-wrapper {
          margin-bottom: 16px;
        }

        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          color: #fff;
        }

        .stat-icon-green { background: linear-gradient(135deg, #52c41a, #73d13d); }
        .stat-icon-orange { background: linear-gradient(135deg, #fa8c16, #ffa940); }
        .stat-icon-blue { background: linear-gradient(135deg, #1890ff, #40a9ff); }
        .stat-icon-purple { background: linear-gradient(135deg, #722ed1, #9254de); }

        .stat-content {
          flex: 1;
        }

        .stat-content .ant-statistic-title {
          color: #8c8c8c;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .stat-content .ant-statistic-content {
          font-size: 32px;
        }

        .stat-trend {
          margin-top: 12px;
          font-size: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .stat-trend.up { color: #52c41a; }
        .stat-trend.down { color: #f5222d; }
        .stat-trend.neutral { color: #8c8c8c; }

        .stat-trend span {
          font-weight: 600;
          margin-right: 4px;
        }

        /* 最近记录卡片 */
        .recent-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .recent-card .ant-card-head {
          border-bottom: 1px solid #f0f0f0;
        }

        .card-title-wrapper {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          font-weight: 600;
        }

        .view-more {
          font-weight: 400;
          font-size: 14px;
          color: #1890ff;
        }

        .borrow-item {
          padding: 16px 0;
          transition: background 0.2s;
        }

        .borrow-item:hover {
          background: #fafafa;
          margin: 0 -24px;
          padding: 16px 24px;
        }

        .borrow-meta {
          color: #8c8c8c;
        }

        .borrow-action {
          display: flex;
          align-items: center;
        }

        .empty-state {
          text-align: center;
          padding: 48px 0;
          color: #8c8c8c;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          color: #d9d9d9;
        }

        /* 快捷操作卡片 */
        .quick-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .quick-action-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 12px;
          background: #fafafa;
          border-radius: 12px;
          text-decoration: none;
          color: #333;
          transition: all 0.2s;
        }

        .quick-action-item:hover {
          background: #f0f0f0;
          transform: translateY(-2px);
        }

        .quick-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: #fff;
          margin-bottom: 10px;
        }

        .quick-action-item span {
          font-size: 13px;
          font-weight: 500;
        }

        /* 小贴士卡片 */
        .tips-card {
          border-radius: 16px;
          border: none;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%);
        }

        .tips-header {
          font-weight: 600;
          margin-bottom: 8px;
        }

        .tips-content {
          color: #8c6d1f;
          margin: 0;
          font-size: 14px;
          line-height: 1.6;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 22px;
          }

          .page-header {
            margin-bottom: 16px;
          }

          .stat-card {
            border-radius: 16px;
            margin-bottom: 4px;
          }

          .stat-card::before {
            height: 3px;
          }

          .stat-card .ant-card-body {
            padding: 16px;
            flex-direction: row;
            align-items: center;
            gap: 14px;
          }

          .stat-icon-wrapper {
            margin-bottom: 0;
          }

          .stat-icon {
            width: 44px;
            height: 44px;
            font-size: 20px;
          }

          .stat-content {
            flex: 1;
          }

          .stat-content .ant-statistic-title {
            font-size: 12px;
            margin-bottom: 2px;
          }

          .stat-content .ant-statistic-content {
            font-size: 22px;
          }

          .stat-trend {
            display: none;
          }

          .recent-card {
            border-radius: 16px;
          }

          .recent-card .ant-card-body {
            padding: 12px;
          }

          .card-title-wrapper {
            font-size: 14px;
          }

          .view-more {
            font-size: 12px;
            padding: 0;
          }

          .borrow-item {
            padding: 12px 0;
          }

          .borrow-item:hover {
            margin: 0 -12px;
            padding: 12px;
          }

          .quick-card {
            border-radius: 16px;
          }

          .quick-actions {
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
          }

          .quick-action-item {
            padding: 12px 6px;
          }

          .quick-icon {
            width: 36px;
            height: 36px;
            font-size: 16px;
            margin-bottom: 6px;
          }

          .quick-action-item span {
            font-size: 11px;
            text-align: center;
          }

          .tips-card {
            border-radius: 16px;
            margin-top: 12px;
          }
        }

        @media (max-width: 576px) {
          .page-header h1 {
            font-size: 20px;
          }

          .subtitle {
            font-size: 13px;
          }

          .stat-content .ant-statistic-content {
            font-size: 20px;
          }

          .quick-actions {
            grid-template-columns: repeat(2, 1fr);
          }

          .quick-action-item span {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
