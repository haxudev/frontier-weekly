'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

// 动态导入海报组件
const SharePoster = dynamic(() => import('./SharePoster'), { ssr: false })

/**
 * 移动端浮动分享按钮 (FAB - Floating Action Button)
 * 
 * 在移动设备上显示固定在屏幕右下角的分享按钮
 * 点击后展开分享选项菜单，支持：
 * - Web Share API（原生分享到微信等应用）
 * - 复制链接
 * - 生成海报
 */
export default function MobileShareFab({
  title,
  url,
  description = '',
  date = '',
  keywords = [],
  lang = 'zh'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showPoster, setShowPoster] = useState(false)
  const [copied, setCopied] = useState(false)
  const [canShare, setCanShare] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检测是否支持 Web Share API
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share)
    // 检测是否是移动设备
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 只在移动端显示
  if (!isMobile) return null

  // 多语言文本
  const t = {
    shareToApp: lang === 'zh' ? '分享到应用' : 'Share to App',
    copyLink: lang === 'zh' ? '复制链接' : 'Copy Link',
    copied: lang === 'zh' ? '已复制!' : 'Copied!',
    generatePoster: lang === 'zh' ? '生成海报' : 'Create Poster',
    share: lang === 'zh' ? '分享' : 'Share'
  }

  // 使用 Web Share API 进行原生分享
  const handleNativeShare = async () => {
    if (!navigator.share) {
      // 降级到复制链接
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
      // 用户取消分享或出错
      if (err.name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }

  // 复制链接
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setIsOpen(false)
      }, 1500)
    } catch (err) {
      // 降级方案
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
        setIsOpen(false)
      }, 1500)
    }
  }

  // 打开海报生成
  const handlePoster = () => {
    setIsOpen(false)
    setShowPoster(true)
  }

  // 关闭菜单的背景点击
  const handleBackdropClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* 背景遮罩 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
          onClick={handleBackdropClick}
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        />
      )}

      {/* 分享菜单 */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-4 z-50 flex flex-col gap-3 items-end"
          style={{ animation: 'slideUp 0.2s ease-out' }}
        >
          {/* 原生分享（如果支持） */}
          {canShare && (
            <button
              onClick={handleNativeShare}
              className="share-fab-item"
              style={{ animationDelay: '0ms' }}
            >
              <span className="share-fab-label">{t.shareToApp}</span>
              <span className="share-fab-icon share-fab-icon-share">
                <ShareIcon />
              </span>
            </button>
          )}

          {/* 复制链接 */}
          <button
            onClick={handleCopyLink}
            className="share-fab-item"
            style={{ animationDelay: canShare ? '50ms' : '0ms' }}
          >
            <span className="share-fab-label">
              {copied ? t.copied : t.copyLink}
            </span>
            <span className="share-fab-icon share-fab-icon-copy">
              <CopyIcon />
            </span>
          </button>

          {/* 生成海报 */}
          <button
            onClick={handlePoster}
            className="share-fab-item"
            style={{ animationDelay: canShare ? '100ms' : '50ms' }}
          >
            <span className="share-fab-label">{t.generatePoster}</span>
            <span className="share-fab-icon share-fab-icon-poster">
              <PosterIcon />
            </span>
          </button>
        </div>
      )}

      {/* 主按钮 (FAB) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen ? 'rotate-45' : ''
        }`}
        style={{
          background: isOpen 
            ? 'var(--text-muted)' 
            : 'linear-gradient(135deg, #07c160, #06ae56)',
          color: 'white',
          boxShadow: '0 4px 20px rgba(7, 193, 96, 0.4)'
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
          onClose={() => setShowPoster(false)}
        />
      )}
    </>
  )
}

// 主分享图标（微信风格）
function ShareMainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05a6.06 6.06 0 0 1-.227-1.626c0-3.627 3.022-6.562 6.74-6.562.248 0 .492.02.734.048C15.858 4.623 12.545 2.188 8.691 2.188zM5.643 6.17a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zm6.017 0a1.09 1.09 0 1 1 0 2.18 1.09 1.09 0 0 1 0-2.18zM24 14.833c0-3.26-3.268-5.909-7.297-5.909-4.028 0-7.297 2.65-7.297 5.91 0 3.258 3.269 5.908 7.297 5.908.74 0 1.463-.078 2.15-.22a.67.67 0 0 1 .543.078l1.44.844a.257.257 0 0 0 .127.045.222.222 0 0 0 .22-.224c0-.054-.022-.11-.036-.161l-.296-1.123a.452.452 0 0 1 .161-.503C22.959 18.395 24 16.73 24 14.833zm-9.568-1.363a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64zm4.54 0a.82.82 0 1 1 0-1.64.82.82 0 0 1 0 1.64z"/>
    </svg>
  )
}

// 通用分享图标
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}
