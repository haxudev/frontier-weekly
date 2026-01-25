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
  toc = [],
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
    
    // 海报尺寸 - 动态计算高度以容纳所有目录项
    const width = 750
    const filteredToc = (toc || []).filter(item => 
      item !== '目录' && item.toLowerCase() !== 'table of contents' && item.toLowerCase() !== 'contents'
    )
    // 基础高度 + 每个目录项的高度
    const baseHeight = 1000
    const tocItemHeight = 36
    const additionalHeight = Math.max(0, (filteredToc.length - 5) * tocItemHeight)
    const height = Math.min(Math.max(baseHeight + additionalHeight, 1100), 2000)
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

    // 日期（只显示日期部分，不含时间戳）
    if (date) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.font = '22px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'left'
      // 提取纯日期部分（格式如 2026-01-25 或 January 25, 2026）
      const pureDate = date.split(' ')[0].split('T')[0]
      ctx.fillText(pureDate, 80, 230)
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

    // 内容要点（从目录提取，不显示"目录"标题）
    // filteredToc 已在前面计算好
    
    if (filteredToc.length > 0) {
      // 添加一条细分隔线
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(80, yPos + 10)
      ctx.lineTo(width - 80, yPos + 10)
      ctx.stroke()
      yPos += 35
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '24px system-ui, -apple-system, sans-serif'
      
      // 显示所有目录项
      const itemHeight = 36
      
      for (let i = 0; i < filteredToc.length; i++) {
        let tocItem = filteredToc[i]
        // 只取冒号之后的部分
        const colonIndex = tocItem.indexOf('：') !== -1 ? tocItem.indexOf('：') : tocItem.indexOf(':')
        if (colonIndex !== -1) {
          tocItem = tocItem.slice(colonIndex + 1).trim()
        }
        // 按显示宽度截取（22个中文字符宽度）
        const displayText = truncateByWidth(tocItem, 22)
        const bulletText = `›  ${displayText}`
        ctx.fillText(bulletText, 80, yPos + 30)
        yPos += itemHeight
      }
    } else if (excerpt) {
      // 如果没有目录，显示摘要
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(80, yPos + 10)
      ctx.lineTo(width - 80, yPos + 10)
      ctx.stroke()
      yPos += 35
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '24px system-ui, -apple-system, sans-serif'
      const excerptLines = wrapText(ctx, excerpt, width - 160, 24)
      excerptLines.slice(0, 4).forEach((line, i) => {
        ctx.fillText(line, 80, yPos + 30 + i * 36)
      })
    }

    // 二维码区域 - 相对于内容结束位置
    const qrSize = 160
    const qrX = width / 2 - qrSize / 2
    const qrY = yPos + 60

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
    ctx.fillText('长按识别二维码阅读原文', width / 2, qrY + qrSize + 60)

    // 底部水印
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.font = '18px system-ui, -apple-system, sans-serif'
    ctx.fillText('Frontier Daily · 前沿今辰观', width / 2, qrY + qrSize + 110)

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

  // 计算字符显示宽度（中文=1，英文/数字=0.5）
  function getDisplayWidth(text) {
    let width = 0
    for (const char of text) {
      // 中文字符范围
      if (/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char)) {
        width += 1
      } else {
        width += 0.5
      }
    }
    return width
  }

  // 按显示宽度截取文本
  function truncateByWidth(text, maxWidth) {
    let width = 0
    let result = ''
    for (const char of text) {
      const charWidth = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/.test(char) ? 1 : 0.5
      if (width + charWidth > maxWidth) {
        return result + '...'
      }
      width += charWidth
      result += char
    }
    return result
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
    <div className="poster-modal-overlay" onClick={onClose}>
      <div 
        className="poster-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', maxWidth: '360px' }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 w-7 h-7 flex items-center justify-center rounded-full text-sm"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          ✕
        </button>

        <div className="p-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
            生成分享海报
          </h3>

          {!posterUrl ? (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                生成精美海报，保存后可在微信朋友圈分享
              </p>
              <button
                onClick={generatePoster}
                disabled={isGenerating}
                className="w-full py-2 rounded-md font-medium transition-all text-xs"
                style={{ 
                  background: isGenerating ? 'var(--bg-secondary)' : 'var(--accent)',
                  color: isGenerating ? 'var(--text-muted)' : 'white'
                }}
              >
                {isGenerating ? '生成中...' : '生成海报'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* 海报预览 - 居中显示 */}
              <div className="flex justify-center">
                <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ maxHeight: '60vh' }}>
                  <img 
                    src={posterUrl} 
                    alt="分享海报" 
                    className="h-auto max-h-[60vh] w-auto"
                    style={{ maxWidth: '100%' }}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 justify-center">
                <button
                  onClick={downloadPoster}
                  className="px-4 py-1.5 rounded-md font-medium text-xs"
                  style={{ background: 'var(--accent)', color: 'white' }}
                >
                  保存图片
                </button>
                <button
                  onClick={() => setPosterUrl(null)}
                  className="px-4 py-1.5 rounded-md font-medium text-xs"
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                >
                  重新生成
                </button>
              </div>

              <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                长按图片可保存到相册
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
