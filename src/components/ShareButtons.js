'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

// 动态导入海报组件，避免 SSR 问题
const SharePoster = dynamic(() => import('./SharePoster'), { ssr: false })

/**
 * 社交分享按钮组件
 * 支持微博、Twitter/X、复制链接（微信分享）、生成海报
 */
export default function ShareButtons({ 
  title, 
  url, 
  description = '',
  date = '',
  keywords = [] 
}) {
  const [copied, setCopied] = useState(false)
  const [showQRHint, setShowQRHint] = useState(false)
  const [showPoster, setShowPoster] = useState(false)

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)
  const encodedDesc = encodeURIComponent(description || title)

  // 复制链接到剪贴板（用于微信分享）
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // 降级方案
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 分享到微博
  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`
    window.open(weiboUrl, '_blank', 'width=600,height=500')
  }

  // 分享到 Twitter/X
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    window.open(twitterUrl, '_blank', 'width=600,height=500')
  }

  // 分享到 LinkedIn
  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    window.open(linkedInUrl, '_blank', 'width=600,height=500')
  }

  return (
    <div className="share-buttons flex flex-wrap items-center gap-3">
      {/* 微信分享 - 复制链接 */}
      <button
        onClick={handleCopyLink}
        onMouseEnter={() => setShowQRHint(true)}
        onMouseLeave={() => setShowQRHint(false)}
        className="share-btn share-btn-wechat"
        title="复制链接到微信分享"
      >
        <WeChatIcon />
        <span>{copied ? '已复制!' : '微信'}</span>
      </button>

      {/* 微博 */}
      <button
        onClick={shareToWeibo}
        className="share-btn share-btn-weibo"
        title="分享到微博"
      >
        <WeiboIcon />
        <span>微博</span>
      </button>

      {/* Twitter/X */}
      <button
        onClick={shareToTwitter}
        className="share-btn share-btn-twitter"
        title="分享到 Twitter/X"
      >
        <TwitterIcon />
        <span>Twitter</span>
      </button>

      {/* LinkedIn */}
      <button
        onClick={shareToLinkedIn}
        className="share-btn share-btn-linkedin"
        title="分享到 LinkedIn"
      >
        <LinkedInIcon />
        <span>LinkedIn</span>
      </button>

      {/* 复制链接 */}
      <button
        onClick={handleCopyLink}
        className="share-btn share-btn-copy"
        title="复制链接"
      >
        <CopyIcon />
        <span>{copied ? '已复制!' : '复制链接'}</span>
      </button>

      {/* 生成海报 */}
      <button
        onClick={() => setShowPoster(true)}
        className="share-btn share-btn-poster"
        title="生成分享海报"
      >
        <PosterIcon />
        <span>生成海报</span>
      </button>

      {/* 微信分享提示 */}
      {showQRHint && (
        <div className="share-hint text-xs" style={{ color: 'var(--text-muted)' }}>
          链接已复制，请在微信中粘贴分享
        </div>
      )}

      {/* 海报弹窗 */}
      {showPoster && (
        <SharePoster
          title={title}
          excerpt={description}
          url={url}
          date={date}
          keywords={keywords}
          onClose={() => setShowPoster(false)}
        />
      )}
    </div>
  )
}

// 图标组件
function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.06 6.06 0 0 1-.227-1.626c0-3.627 3.022-6.562 6.74-6.562.248 0 .492.02.734.048C15.858 4.623 12.545 2.188 8.691 2.188zM5.643 6.17a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm6.017 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zM24 14.833c0-3.26-3.268-5.909-7.297-5.909-4.028 0-7.297 2.65-7.297 5.91 0 3.258 3.269 5.908 7.297 5.908.74 0 1.463-.078 2.15-.22a.67.67 0 0 1 .543.078l1.44.844a.257.257 0 0 0 .127.045.222.222 0 0 0 .22-.224c0-.054-.022-.11-.036-.161l-.296-1.123a.452.452 0 0 1 .161-.503C22.959 18.395 24 16.73 24 14.833zm-9.568-1.363a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64zm4.54 0a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64z"/>
    </svg>
  )
}

function WeiboIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.579-.18-.402-.649.386-1.023.425-1.907.001-2.535-.793-1.17-2.966-1.109-5.419-.031 0 0-.776.34-.578-.275.381-1.206.324-2.215-.27-2.8-1.348-1.322-4.93.046-8.007 3.055C1.022 10.735 0 13.055 0 15.066c0 3.845 4.93 6.185 9.758 6.185 6.334 0 10.553-3.681 10.553-6.599 0-1.76-1.485-2.759-3.252-3.003h-.001zm.581-5.462c.678.762.768 1.799.403 2.897l-.046.13c-.085.253.003.428.2.479.195.05.41-.048.52-.265l.043-.097c.477-1.42.312-2.815-.584-3.824-.901-1.013-2.356-1.395-3.915-1.177-.286.04-.472.177-.487.432-.014.256.147.436.434.48 1.261.191 2.406.569 2.996 1.265l.436-.32zm2.173-1.782c1.03 1.158 1.329 2.714.86 4.468a.606.606 0 0 0 .411.72.593.593 0 0 0 .726-.379c.586-2.171.189-4.115-1.074-5.534-1.259-1.415-3.35-2.054-5.577-1.788a.59.59 0 0 0-.505.664.594.594 0 0 0 .665.509c1.807-.216 3.458.302 4.494 1.34z"/>
    </svg>
  )
}

function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

function PosterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}
