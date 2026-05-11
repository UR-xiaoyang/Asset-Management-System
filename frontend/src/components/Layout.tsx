import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Drawer } from 'antd'
import {
  DashboardOutlined,
  AppstoreOutlined,
  FolderOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuOutlined,
  TeamOutlined,
  SettingOutlined,
  FileTextOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../store/auth'

const { Sider, Content } = Layout

// 根据角色过滤菜单
const getMenuItems = (role: string) => {
  const items = [
    { key: '/', icon: <DashboardOutlined />, label: '首页' },
    { key: '/assets', icon: <AppstoreOutlined />, label: '资产管理' },
    { key: '/oa', icon: <FileTextOutlined />, label: 'OA审批' },
    { key: '/categories', icon: <FolderOutlined />, label: '分类管理' },
  ]

  // 管理员和超级管理员可以看到用户管理和系统设置
  if (role === 'admin' || role === 'super_admin') {
    items.push({ key: '/users', icon: <TeamOutlined />, label: '用户管理' })
    items.push({ key: '/settings', icon: <SettingOutlined />, label: '系统设置' })
  }

  return items
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMenuClick = (key: string) => {
    setMobileMenuOpen(false)
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }} className="app-layout">
      {/* 桌面端侧边栏 - 移动端隐藏 */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          breakpoint="lg"
          collapsedWidth={0}
          className="desktop-sider"
          width={220}
        >
          <div className="sider-logo">
            {collapsed ? '资产' : '实验室资产管理系统'}
          </div>
          <div className="sider-menu-container">
            <Menu
              theme="dark"
              mode="inline"
              selectedKeys={[location.pathname]}
              items={getMenuItems(user?.role || '')}
              onClick={({ key }) => navigate(key)}
            />
          </div>
          <Dropdown
            menu={{ items: [{ key: 'profile', icon: <UserOutlined />, label: '个人信息' }, { type: 'divider' as const }, { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' }], onClick: ({ key }) => key === 'logout' ? handleLogout() : navigate('/profile') }}
            placement="topRight"
            trigger={['click']}
            classNames={{ root: "sider-user-dropdown" }}
          >
            <div className="sider-user-info">
              <Avatar size="small" icon={<UserOutlined />} />
              {!collapsed && <span className="sider-username">{user?.username || 'Admin'}</span>}
            </div>
          </Dropdown>
        </Sider>
      )}

      {/* 移动端顶部栏 */}
      {isMobile && (
        <div className="mobile-header">
          <Button
            type="text"
            icon={<MenuOutlined style={{ fontSize: 22 }} />}
            onClick={() => setMobileMenuOpen(true)}
            className="mobile-menu-btn"
          />
          <span className="mobile-header-title">实验室资产管理系统</span>
          <div className="mobile-header-right">
            <Dropdown
              menu={{
                items: [
                  { key: 'profile', icon: <UserOutlined />, label: '个人信息', onClick: () => navigate('/profile') },
                  { type: 'divider' as const },
                  { key: 'logout', icon: <LogoutOutlined />, label: '退出登录' },
                ],
                onClick: ({ key }) => {
                  if (key === 'logout') handleLogout()
                },
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <Button type="text" className="mobile-user-btn">
                <Avatar size="small" icon={<UserOutlined />} />
              </Button>
            </Dropdown>
          </div>
        </div>
      )}

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="导航菜单"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        size="default"
        className="mobile-drawer"
        styles={{
          header: { background: '#001529', color: '#fff', borderBottom: 'none' },
          body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%', background: '#001529' },
          wrapper: { background: '#001529', width: 280 },
        }}
      >
        <div className="drawer-user-info">
          欢迎，{user?.username || 'Admin'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems(user?.role || '')}
          onClick={({ key }) => handleMenuClick(key)}
          className="drawer-menu"
        />
        <div className="drawer-footer">
          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              setMobileMenuOpen(false)
              handleLogout()
            }}
            className="drawer-logout-btn"
          >
            退出登录
          </Button>
        </div>
      </Drawer>

      <Layout className="main-layout">
        <Content className="main-content">
          <Outlet />
        </Content>
      </Layout>

      <style>{`
        /* 基础布局 */
        .app-layout {
          min-height: 100vh;
        }

        .desktop-sider {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: #001529;
        }

        .sider-logo {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          white-space: nowrap;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sider-menu-container {
          flex: 1;
          overflow-y: auto;
        }

        .sider-menu-container .ant-menu-dark .ant-menu-item-selected {
          background-color: #1677ff !important;
          color: #fff !important;
        }

        .sider-menu-container .ant-menu-dark .ant-menu-item-selected .anticon {
          color: #fff !important;
        }

        .sider-menu-container .ant-menu-dark.ant-menu-item-selected {
          background-color: #1677ff !important;
          color: #fff !important;
        }

        .sider-user-info {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          color: rgba(255,255,255,0.65);
          cursor: pointer;
          border-top: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }

        .sider-user-info:hover {
          color: #fff;
          background: rgba(255,255,255,0.08);
        }

        .sider-username {
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sider-user-dropdown {
          min-width: 160px;
        }

        .main-layout {
          background: #f0f2f5;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          padding: 24px;
          min-height: calc(100vh - 64px);
        }

        /* 移动端顶部栏 */
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          padding: 0 12px 0 8px;
          padding-top: env(safe-area-inset-top, 0px);
          background: #001529;
          color: #fff;
          z-index: 98;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }

        .mobile-header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .mobile-menu-btn {
          color: #fff !important;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .mobile-header-title {
          font-size: 15px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
        }

        .mobile-header-right {
          flex-shrink: 0;
          margin-left: 8px;
        }

        .mobile-user-btn {
          color: #fff !important;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* 抽屉菜单 */
        .drawer-user-info {
          padding: 16px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.65);
          font-size: 14px;
        }

        .drawer-menu {
          flex: 1;
        }

        .drawer-menu .ant-menu-item-selected {
          background-color: #1677ff !important;
          color: #fff !important;
        }

        .drawer-menu .ant-menu-item-selected .anticon {
          color: #fff !important;
        }

        .drawer-menu .ant-menu-dark .ant-menu-item-selected {
          background-color: #1677ff !important;
          color: #fff !important;
        }

        .drawer-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .drawer-logout-btn {
          color: rgba(255,255,255,0.65) !important;
          width: 100%;
          justify-content: flex-start;
        }

        /* 移动端适配 (768px及以下) */
        @media screen and (max-width: 768px) {
          .desktop-sider {
            display: none !important;
          }

          .mobile-header {
            display: flex;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(102, 126, 234, 0.1);
          }

          .mobile-menu-btn {
            color: #667eea !important;
          }

          .mobile-header-title {
            color: #1a1a2e;
            font-weight: 600;
          }

          .mobile-user-btn {
            color: #667eea !important;
          }

          .main-layout {
            padding-top: 56px;
            padding-top: calc(56px + env(safe-area-inset-top, 0px));
            background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
            min-height: 100vh;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          .main-content {
            padding: 12px;
            min-height: calc(100vh - 56px);
            box-sizing: border-box;
            overflow-y: auto;
          }
        }

        /* 超小屏幕 */
        @media screen and (max-width: 360px) {
          .mobile-header-title {
            font-size: 14px;
            max-width: 100px;
          }
        }

        @media (prefers-color-scheme: dark) {
          .mobile-header {
            background: rgba(30, 40, 70, 0.95);
            border-bottom-color: rgba(255, 255, 255, 0.1);
          }

          .mobile-header-title {
            color: #fff;
          }

          .mobile-menu-btn {
            color: #667eea !important;
          }

          .mobile-user-btn {
            color: #667eea !important;
          }

          .main-layout {
            background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
          }
        }

        /* 移动端抽屉样式 */
        .mobile-drawer {
          background: #001529;
        }

        .mobile-drawer .ant-drawer-content {
          background: #001529;
        }

        .mobile-drawer .ant-drawer-body {
          background: #001529;
          padding: 0;
        }

        .mobile-drawer .ant-drawer-wrapper {
          background: #001529 !important;
        }
      `}</style>
    </Layout>
  )
}