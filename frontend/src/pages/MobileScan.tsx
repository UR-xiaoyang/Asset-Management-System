import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from 'react-router-dom'
import { assetAPI } from '../services/api'
import './MobileScan.css'

// 可用模式
type CameraFacingMode = 'environment' | 'user'

const MobileScan: React.FC = () => {
  const navigate = useNavigate()
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('将二维码放入框内即可自动扫描')
  const [torchEnabled, setTorchEnabled] = useState(false)
  const [cameraFacing, setCameraFacing] = useState<CameraFacingMode>('environment')
  const [assetData, setAssetData] = useState<{ uuid: string; name: string } | null>(null)
  const [torchAvailable, setTorchAvailable] = useState(false)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const lastTorchState = useRef(false)

  // 初始化扫码器
  useEffect(() => {
    let mounted = true
    const scanner = new Html5Qrcode('qr-reader')

    const startScanner = async () => {
      try {
        await scanner.start(
          { facingMode: cameraFacing },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          async (decodedText) => {
            if (!mounted) return

            setScanStatus('scanning')
            setStatusMessage('正在识别...')

            try {
              // 解析二维码内容（可能是JSON格式的资产数据）
              let uuid = decodedText
              let assetName = ''

              try {
                // 尝试解析JSON格式的二维码数据
                const data = JSON.parse(decodedText)
                if (data.uuid) {
                  uuid = data.uuid
                  assetName = data.name || ''
                }
              } catch {
                // 不是JSON格式，直接使用原始内容作为UUID
              }

              // 使用UUID查询资产信息
              const response = await assetAPI.getByUUID(uuid)
              const asset = response.data

              setAssetData({ uuid, name: assetName || asset.name })
              setScanStatus('success')
              setStatusMessage('识别成功！')

              // 震动反馈
              if (navigator.vibrate) {
                navigator.vibrate(200)
              }

              // 2秒后跳转到借用页面
              setTimeout(() => {
                navigate(`/borrow/${uuid}`)
              }, 2000)
            } catch {
              setScanStatus('error')
              setStatusMessage('未找到该资产，请检查二维码是否正确')
              setTimeout(() => {
                setScanStatus('idle')
                setStatusMessage('将二维码放入框内即可自动扫描')
              }, 3000)
            }
          },
          () => {
            // 扫描中，无需处理
          }
        )

        if (mounted) {
          scannerRef.current = scanner
          setScanStatus('scanning')
          setStatusMessage('相机已启动，请扫描二维码')

          // 检测闪光灯是否可用
          const videoElement = document.querySelector('video')
          if (videoElement) {
            const stream = videoElement.srcObject as MediaStream | null
            if (stream) {
              const track = stream.getVideoTracks()[0]
              if (track && 'getCapabilities' in track) {
                const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
                setTorchAvailable(!!capabilities.torch)
              }
            }
          }
        }
      } catch (err) {
        console.error('启动扫码失败:', err)
        setScanStatus('error')
        setStatusMessage('无法访问相机，请检查权限设置')
      }
    }

    startScanner()

    return () => {
      mounted = false
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
        scannerRef.current = null
      }
    }
  }, [cameraFacing, navigate])

  // 切换前后摄像头
  const switchCamera = () => {
    setCameraFacing(prev => prev === 'environment' ? 'user' : 'environment')
  }

  // 切换闪光灯
  const toggleTorch = async () => {
    if (!videoRef.current) return

    const stream = videoRef.current.srcObject as MediaStream | null
    if (stream) {
      const track = stream.getVideoTracks()[0]
      if (track && 'applyConstraints' in track) {
        try {
          lastTorchState.current = !lastTorchState.current
          await track.applyConstraints({
          // @ts-expect-error - torch 是非标准属性
            advanced: [{ torch: lastTorchState.current }]
          })
          setTorchEnabled(lastTorchState.current)
        } catch (err) {
          console.error('闪光灯控制失败:', err)
        }
      }
    }
  }

  // 手动输入UUID
  const handleManualInput = () => {
    const uuid = prompt('请输入资产UUID或扫码内容：')
    if (uuid) {
      navigate(`/borrow/${uuid.trim()}`)
    }
  }

  return (
    <div className="mobile-scan-container safe-area-top safe-area-bottom">
      {/* 顶部状态栏 */}
      <div className="scan-header">
        <h1>扫码借用</h1>
        <button className="icon-btn" onClick={switchCamera} title="切换摄像头">
          <span className="icon">🔄</span>
        </button>
      </div>

      {/* 扫码区域 */}
      <div className="scan-area">
        <div id="qr-reader" className="qr-reader"></div>

        {/* 扫描框装饰 */}
        <div className={`scan-frame ${scanStatus}`}>
          <div className="corner tl"></div>
          <div className="corner tr"></div>
          <div className="corner bl"></div>
          <div className="corner br"></div>
        </div>

        {/* 状态指示器 */}
        <div className={`status-badge ${scanStatus}`}>
          {scanStatus === 'scanning' && '扫描中...'}
          {scanStatus === 'success' && '✓ 识别成功'}
          {scanStatus === 'error' && '✗ 识别失败'}
          {scanStatus === 'idle' && '准备就绪'}
        </div>
      </div>

      {/* 状态消息 */}
      <div className="status-message">
        <p>{statusMessage}</p>
        {assetData && (
          <div className="asset-preview">
            <span className="asset-name">{assetData.name}</span>
            <span className="asset-uuid">{assetData.uuid}</span>
          </div>
        )}
      </div>

      {/* 扫描成功后的操作选项 */}
      {scanStatus === 'success' && assetData && (
        <div className="scan-actions-card">
          <p className="action-title">选择操作</p>
          <div className="action-buttons">
            <button
              className="action-btn primary"
              onClick={() => navigate(`/borrow/${assetData.uuid}`)}
            >
              <span className="icon">📦</span>
              <span>借用资产</span>
            </button>
            <button
              className="action-btn warning"
              onClick={() => navigate(`/consumption/${assetData.uuid}`)}
            >
              <span className="icon">📉</span>
              <span>报告损耗</span>
            </button>
          </div>
        </div>
      )}

      {/* 底部操作区 */}
      <div className="scan-actions">
        {torchAvailable && (
          <button
            className={`action-btn ${torchEnabled ? 'active' : ''}`}
            onClick={toggleTorch}
          >
            <span className="icon">💡</span>
            <span>手电筒</span>
          </button>
        )}

        <button className="action-btn" onClick={handleManualInput}>
          <span className="icon">⌨️</span>
          <span>手动输入</span>
        </button>

        <button className="action-btn" onClick={() => navigate('/visitor/records')}>
          <span className="icon">📋</span>
          <span>我的记录</span>
        </button>
      </div>

      {/* 操作提示 */}
      <div className="scan-tips">
        <p>提示：将标签上的二维码对准摄像头即可自动扫描</p>
      </div>
    </div>
  )
}

export default MobileScan