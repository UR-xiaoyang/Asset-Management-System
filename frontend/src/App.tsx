import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { lazy, Suspense, useEffect, useState } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Borrow from './pages/Borrow'
import Consumption from './pages/Consumption'
import MobileScan from './pages/MobileScan'
import VisitorLogin from './pages/VisitorLogin'
import VisitorRegister from './pages/VisitorRegister'
import { useAuthStore } from './store/auth'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const AssetList = lazy(() => import('./pages/AssetList'))
const AssetForm = lazy(() => import('./pages/AssetForm'))
const OA = lazy(() => import('./pages/OA'))
const CategoryManage = lazy(() => import('./pages/CategoryManage'))
const UserManage = lazy(() => import('./pages/UserManage'))
const VisitorApply = lazy(() => import('./pages/VisitorApply'))
const VisitorRecords = lazy(() => import('./pages/VisitorRecords'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Setup = lazy(() => import('./pages/Setup'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      加载中...
    </div>
  )
}

const getAuthState = () => useAuthStore.getState()

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const initialState = getAuthState()
  const [hydrated, setHydrated] = useState(initialState.hasHydrated)
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    if (!hydrated) {
      const checkHydration = () => {
        if (getAuthState().hasHydrated) {
          setHydrated(true)
          return true
        }
        return false
      }
      if (!checkHydration()) {
        const interval = setInterval(() => {
          if (checkHydration()) {
            setHydrated(true)
            clearInterval(interval)
          }
        }, 10)
        return () => clearInterval(interval)
      }
    }
  }, [hydrated])

  if (!hydrated) {
    return null
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }
  if (user?.role === 'visitor') {
    return <Navigate to="/visitor/apply" replace />
  }
  return <>{children}</>
}

const VisitorRoute = ({ children }: { children: React.ReactNode }) => {
  const initialState = getAuthState()
  const [hydrated, setHydrated] = useState(initialState.hasHydrated)
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  useEffect(() => {
    if (!hydrated) {
      const checkHydration = () => {
        if (getAuthState().hasHydrated) {
          setHydrated(true)
          return true
        }
        return false
      }
      if (!checkHydration()) {
        const interval = setInterval(() => {
          if (checkHydration()) {
            setHydrated(true)
            clearInterval(interval)
          }
        }, 10)
        return () => clearInterval(interval)
      }
    }
  }, [hydrated])

  if (!hydrated) {
    return null
  }

  if (!token) {
    return <Navigate to="/visitor/login" replace />
  }
  if (user && user.role !== 'visitor') {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

function AppContent() {
  const [initialized, setInitialized] = useState<boolean | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    const checkSetup = async () => {
      try {
        const res = await fetch('/api/v1/setup/status')
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!cancelled) {
          setInitialized(data.initialized)
          setChecked(true)
        }
      } catch (err) {
        console.error('Check setup failed:', err)
        if (!cancelled) {
          setInitialized(true)
          setChecked(true)
        }
      }
    }
    checkSetup()
    return () => { cancelled = true }
  }, [])

  if (!checked || initialized === null) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        加载中...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/setup" element={<Suspense fallback={<PageLoader />}><Setup /></Suspense>} />
      <Route path="/login" element={initialized ? <Login /> : <Navigate to="/setup" replace />} />
      <Route path="/borrow/:uuid" element={<Borrow />} />
      <Route path="/consumption/:uuid" element={<Consumption />} />
      <Route path="/visitor/login" element={<VisitorLogin />} />
      <Route path="/visitor/register" element={<VisitorRegister />} />
      <Route path="/visitor/apply" element={<VisitorRoute><Suspense fallback={<PageLoader />}><VisitorApply /></Suspense></VisitorRoute>} />
      <Route path="/visitor/records" element={<VisitorRoute><Suspense fallback={<PageLoader />}><VisitorRecords /></Suspense></VisitorRoute>} />
      <Route path="/scan" element={<MobileScan />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
        <Route path="assets" element={<Suspense fallback={<PageLoader />}><AssetList /></Suspense>} />
        <Route path="assets/new" element={<Suspense fallback={<PageLoader />}><AssetForm /></Suspense>} />
        <Route path="assets/:id" element={<Suspense fallback={<PageLoader />}><AssetForm /></Suspense>} />
        <Route path="oa" element={<Suspense fallback={<PageLoader />}><OA /></Suspense>} />
        <Route path="categories" element={<Suspense fallback={<PageLoader />}><CategoryManage /></Suspense>} />
        <Route path="users" element={<Suspense fallback={<PageLoader />}><UserManage /></Suspense>} />
        <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
        <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      </Route>
    </Routes>
  )
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  )
}

export default App