'use client'

import { useState, useRef, useEffect } from 'react'

/**
 * 微信分享海报生成器
 * 
 * 生成可保存的图片海报，包含：
 * - 文章标题
 * - 摘要
 * - 二维码（指向文章页面）
 * - 网站品牌
 * 
 * 用户可以长按保存图片，然后在微信中分享
 */
export default function SharePoster({ 
  title, 
  excerpt, 
  url, 
  date,
  keywords = [],
  onClose 
}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [posterUrl, setPosterUrl] = useState(null)
  const [qrCodeUrl, setQrCodeUrl] = useState(null)
  const canvasRef = useRef(null)

  // 生成二维码 URL（使用免费的二维码 API）
  useEffect(() => {
    if (url) {
      // 使用 QRCode API 生成二维码
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&bgcolor=ffffff&color=2d2a26`
      setQrCodeUrl(qrApiUrl)
    }
  }, [url])

  // 生成海报
  const generatePoster = async () => {
    setIsGenerating(true)
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    // 海报尺寸 (适合微信分享)
    const width = 750
    const height = 1334
    canvas.width = width
    canvas.height = height

    // 背景渐变
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(0.5, '#16213e')
    gradient.addColorStop(1, '#0f3460')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 装饰性元素
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)'
    ctx.beginPath()
    ctx.arc(width - 80, 120, 150, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)'
    ctx.beginPath()
    ctx.arc(100, height - 200, 200, 0, Math.PI * 2)
    ctx.fill()

    // 顶部品牌标识
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('前沿今辰观', width / 2, 100)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = '20px system-ui, -apple-system, sans-serif'
    ctx.fillText('无噪声前沿趋势发现与科技干货洞察', width / 2, 140)

    // 分隔线
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(80, 180)
    ctx.lineTo(width - 80, 180)
    ctx.stroke()

    // 日期
    if (date) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(date, 80, 230)
    }

    // 标题（自动换行）
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'left'
    const titleLines = wrapText(ctx, title, width - 160, 48)
    let yPos = 300
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 80, yPos + i * 60)
    })
    yPos += titleLines.length * 60 + 40

    // 关键词标签
    if (keywords.length > 0) {
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      const tagsText = keywords.slice(0, 4).map(k => `#${k}`).join('  ')
      ctx.fillStyle = 'rgba(99, 102, 241, 0.8)'
      ctx.fillText(tagsText, 80, yPos)
      yPos += 50
    }

    // 摘要（自动换行）
    if (excerpt) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '26px system-ui, -apple-system, sans-serif'
      const excerptLines = wrapText(ctx, excerpt, width - 160, 26)
      excerptLines.slice(0, 6).forEach((line, i) => {
        ctx.fillText(line, 80, yPos + 30 + i * 40)
      })
    }

    // 二维码区域
    const qrSize = 180
    const qrX = width / 2 - qrSize / 2
    const qrY = height - 350

    // 二维码背景
    ctx.fillStyle = '#ffffff'
    ctx.roundRect(qrX - 15, qrY - 15, qrSize + 30, qrSize + 30, 12)
    ctx.fill()

    // 加载并绘制二维码
    if (qrCodeUrl) {
      try {
        const qrImage = await loadImage(qrCodeUrl)
        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
      } catch (e) {
        // 二维码加载失败时显示文字
        ctx.fillStyle = '#2d2a26'
        ctx.font = '14px system-ui'
        ctx.textAlign = 'center'
        ctx.fillText('扫码阅读', width / 2, qrY + qrSize / 2)
      }
    }

    // 二维码下方提示
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('长按识别二维码阅读原文', width / 2, height - 120)

    // 底部水印
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '18px system-ui, -apple-system, sans-serif'
    ctx.fillText('Frontier Daily · 前沿今辰观', width / 2, height - 60)

    // 转换为图片 URL
    const dataUrl = canvas.toDataURL('image/png', 1.0)
    setPosterUrl(dataUrl)
    setIsGenerating(false)
  }

  // 文本自动换行
  function wrapText(ctx, text, maxWidth, fontSize) {
    const lines = []
    let currentLine = ''
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const testLine = currentLine + char
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }
    
    return lines
  }

  // 加载图片
  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // 下载海报
  const downloadPoster = () => {
    if (posterUrl) {
      const link = document.createElement('a')
      link.download = `frontier-daily-${Date.now()}.png`
      link.href = posterUrl
      link.click()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div 
        className="relative w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          ✕
        </button>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            生成分享海报
          </h3>

          {!posterUrl ? (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                生成精美海报，保存后可在微信朋友圈分享
              </p>
              <button
                onClick={generatePoster}
                disabled={isGenerating}
                className="w-full py-3 rounded-lg font-medium transition-all"
                style={{ 
                  background: isGenerating ? 'var(--bg-secondary)' : 'var(--accent)',
                  color: isGenerating ? 'var(--text-muted)' : 'white'
                }}
              >
                {isGenerating ? '生成中...' : '生成海报'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 海报预览 */}
              <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '750/1334' }}>
                <img 
                  src={posterUrl} 
                  alt="分享海报" 
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={downloadPoster}
                  className="flex-1 py-3 rounded-lg font-medium"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  保存图片
                </button>
                <button
                  onClick={() => setPosterUrl(null)}
                  className="flex-1 py-3 rounded-lg font-medium"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  重新生成
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                长按图片可保存到相册，然后在微信中分享
              </p>
            </div>
          )}
        </div>

        {/* 隐藏的 Canvas */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  )
}
