'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 动态导入海报组件
const SharePoster = dynamic(() => import('./SharePoster'), { ssr: false })

/**
 * 统一的浮动分享按钮 (FAB - Floating Action Button)
 * 
 * PC和移动端统一体验：
 * - 固定在屏幕右下角的分享按钮
 * - 点击后展开分享选项菜单
 * - 支持多个社交平台分享
 */
export default function ShareFab({
  title,
  url,
  description = '',
  date = '',
  keywords = [],
  toc = [],
  lang = 'zh'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPoster, setShowPoster] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)

  useEffect(() => {
    // 检测是否支持 Web Share API
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  // 多语言文本
  const t = {
    shareToApp: lang === 'zh' ? '分享到应用' : 'Share to App',
    wechat: lang === 'zh' ? '微信' : 'WeChat',
    weibo: lang === 'zh' ? '微博' : 'Weibo',
    copyLink: lang === 'zh' ? '复制链接' : 'Copy Link',
    copied: lang === 'zh' ? '已复制!' : 'Copied!',
    generatePoster: lang === 'zh' ? '生成海报' : 'Create Poster',
    share: lang === 'zh' ? '分享' : 'Share'
  }

  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  // 使用 Web Share API 进行原生分享
  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopyLink()
      return
    }

    try {
      await navigator.share({
        title: title,
        text: description || title,
        url: url
      })
      setIsOpen(false)
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  // 复制链接（微信分享）
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (err) {
      const textarea = document.createElement('textarea')
      textarea.value = url
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    }
  }

  // 分享到微博
  const shareToWeibo = () => {
    const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodedUrl}&title=${encodedTitle}`
    window.open(weiboUrl, '_blank', 'width=600,height=500')
    setIsOpen(false)
  }

  // 分享到 Twitter/X
  const shareToTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    window.open(twitterUrl, '_blank', 'width=600,height=500')
    setIsOpen(false)
  }

  // 分享到 LinkedIn
  const shareToLinkedIn = () => {
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`
    window.open(linkedInUrl, '_blank', 'width=600,height=500')
    setIsOpen(false)
  }

  // 打开海报生成
  const handlePoster = () => {
    setIsOpen(false)
    setShowPoster(true)
  }

  // 关闭菜单
  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/20"
          onClick={handleBackdropClick}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        />
      )}

      {/* 分享菜单 - 只显示图标，右对齐 */}
      {isOpen && (
        <div 
          className="fixed bottom-[140px] right-5 z-[65] flex flex-col gap-2 items-end"
          style={{ animation: 'slideUp 0.2s ease-out' }}
        >
          {/* 原生分享（移动端） */}
          {canShare && (
            <button 
              onClick={handleNativeShare} 
              className="share-fab-icon-only share-fab-icon-share"
              title={t.shareToApp}
            >
              <ShareIcon />
            </button>
          )}

          {/* 微信 - 复制链接 */}
          <button 
            onClick={handleCopyLink} 
            className="share-fab-icon-only share-fab-icon-wechat"
            title={copied ? t.copied : t.wechat}
          >
            <WeChatIcon />
          </button>

          {/* 微博 */}
          <button 
            onClick={shareToWeibo} 
            className="share-fab-icon-only share-fab-icon-weibo"
            title={t.weibo}
          >
            <WeiboIcon />
          </button>

          {/* Twitter */}
          <button 
            onClick={shareToTwitter} 
            className="share-fab-icon-only share-fab-icon-twitter"
            title="Twitter"
          >
            <TwitterIcon />
          </button>

          {/* LinkedIn */}
          <button 
            onClick={shareToLinkedIn} 
            className="share-fab-icon-only share-fab-icon-linkedin"
            title="LinkedIn"
          >
            <LinkedInIcon />
          </button>

          {/* 复制链接 */}
          <button 
            onClick={handleCopyLink} 
            className="share-fab-icon-only share-fab-icon-copy"
            title={copied ? t.copied : t.copyLink}
          >
            <CopyIcon />
          </button>

          {/* 生成海报 */}
          <button 
            onClick={handlePoster} 
            className="share-fab-icon-only share-fab-icon-poster"
            title={t.generatePoster}
          >
            <PosterIcon />
          </button>
        </div>
      )}

      {/* 主按钮 (FAB) - 放在记忆按钮上方 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-[88px] right-5 z-[65] w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-45' : ''
        }`}
        style={{
          background: isOpen 
            ? 'var(--text-muted)' 
            : 'linear-gradient(135deg, #07c160, #06ae56)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(7, 193, 96, 0.35)'
        }}
        aria-label={t.share}
      >
        {isOpen ? <CloseIcon /> : <ShareMainIcon />}
      </button>

      {/* 海报弹窗 */}
      {showPoster && (
        <SharePoster
          title={title}
          excerpt={description}
          url={url}
          date={date}
          keywords={keywords}
          toc={toc}
          onClose={() => setShowPoster(false)}
        />
      )}
    </>
  )
}

// 主分享图标
function ShareMainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 md:w-6 md:h-6">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  )
}

// 微信图标
function WeChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.06 6.06 0 0 1-.227-1.626c0-3.627 3.022-6.562 6.74-6.562.248 0 .492.02.734.048C15.858 4.623 12.545 2.188 8.691 2.188zM5.643 6.17a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm6.017 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zM24 14.833c0-3.26-3.268-5.909-7.297-5.909-4.028 0-7.297 2.65-7.297 5.91 0 3.258 3.269 5.908 7.297 5.908.74 0 1.463-.078 2.15-.22a.67.67 0 0 1 .543.078l1.44.844a.257.257 0 0 0 .127.045.222.222 0 0 0 .22-.224c0-.054-.022-.11-.036-.161l-.296-1.123a.452.452 0 0 1 .161-.503C22.959 18.395 24 16.73 24 14.833zm-9.568-1.363a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64zm4.54 0a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64z"/>
    </svg>
  )
}

// 微博图标
function WeiboIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.739 5.443zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.194.573zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149z"/>
    </svg>
  )
}

// Twitter图标
function TwitterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

// LinkedIn图标
function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )
}

// 分享图标
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  )
}

// 复制图标
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  )
}

// 海报图标
function PosterIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

// 关闭图标
function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 md:w-6 md:h-6">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
