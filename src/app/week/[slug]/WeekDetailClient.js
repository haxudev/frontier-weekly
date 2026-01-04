'use client'

import WeekDots from '@/components/WeekDots'
import BackToTop from '@/components/BackToTop'
import LanguageToggle from '@/components/LanguageToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { useEffect, useRef } from 'react'

export default function WeekDetailClient({ week, recentWeeks, currentSlug }) {
  const { language } = useLanguage()
  const contentMaxWidth = language === 'en' ? 'max-w-4xl' : 'max-w-3xl'
  const contentRef = useRef(null)

  useEffect(() => {
    const rootEl = contentRef.current
    if (!rootEl) return
    if (!isCoarsePointer()) return

    const { popoverEl, linkEl } = ensureCitePopover()
    let activeCiteEl = null

    const closePopover = () => {
      if (activeCiteEl) {
        activeCiteEl.setAttribute('data-cite-open', 'false')
        activeCiteEl.setAttribute('aria-expanded', 'false')
      }
      activeCiteEl = null
      popoverEl.setAttribute('hidden', '')
    }

    const openPopover = (citeEl) => {
      closePopover()

      const title = citeEl.getAttribute('data-cite-title') || ''
      const href = citeEl.getAttribute('href') || ''

      activeCiteEl = citeEl
      activeCiteEl.setAttribute('data-cite-open', 'true')
      activeCiteEl.setAttribute('aria-expanded', 'true')

      linkEl.textContent = title || href
      linkEl.href = citeEl.href
      popoverEl.removeAttribute('hidden')
    }

    // Ensure deterministic initial state
    const citeLinks = rootEl.querySelectorAll('a[data-cite]')
    citeLinks.forEach((el) => {
      if (!el.hasAttribute('data-cite-open')) el.setAttribute('data-cite-open', 'false')
      if (!el.hasAttribute('aria-expanded')) el.setAttribute('aria-expanded', 'false')
    })

    const onRootClick = (e) => {
      // iOS/Safari may set target to a Text node; normalize to an Element.
      const targetEl =
        e.target instanceof Element
          ? e.target
          : e.target?.parentElement instanceof Element
            ? e.target.parentElement
            : null

      const citeEl = targetEl?.closest?.('a[data-cite]')
      if (!citeEl || !rootEl.contains(citeEl)) {
        closePopover()
        return
      }

      // Always prevent navigation on the marker itself on mobile.
      e.preventDefault()

      const isOpen = citeEl.getAttribute('data-cite-open') === 'true'
      if (isOpen) {
        closePopover()
      } else {
        openPopover(citeEl)
      }
    }

    const onDocumentClick = (e) => {
      const targetEl = e.target instanceof Element ? e.target : null
      if (!targetEl) return

      // Click on citation marker: handled by root listener.
      if (targetEl.closest('a[data-cite]')) return

      // Click on popover link should navigate; don't interfere.
      if (popoverEl.contains(targetEl)) return

      closePopover()
    }

    const onScroll = () => closePopover()

    // Use capture so preventDefault reliably beats navigation.
    rootEl.addEventListener('click', onRootClick, true)
    document.addEventListener('click', onDocumentClick)
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      rootEl.removeEventListener('click', onRootClick, true)
      document.removeEventListener('click', onDocumentClick)
      window.removeEventListener('scroll', onScroll)
      closePopover()
    }
  }, [week?.contentHtml])

  const t = {
    title: {
      zh: '礼拜观',
      en: 'Frontier Weekly'
    },
    subtitle: {
      zh: '前沿趋势发现与科技热点洞察',
      en: 'Trends Discovery & Idea Insights'
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Fixed Title */}
      <section className="pt-20 pb-8 px-4">
        <div className={`${contentMaxWidth} mx-auto text-center`}>
          <h1 
            className="text-4xl sm:text-5xl font-serif font-semibold mb-4 animate-fade-in"
            style={{
              color: 'var(--text-primary)',
              fontFamily: language === 'en' ? 'var(--font-serif-en)' : 'var(--font-serif)',
            }}
          >
            {t.title[language]}
          </h1>
          <p 
            className="text-lg mb-8 animate-fade-in"
            style={{ color: 'var(--text-muted)', animationDelay: '0.1s' }}
          >
            {t.subtitle[language]}
          </p>

          <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <LanguageToggle />
          </div>
        </div>
      </section>

      {/* Week Navigator - Left Aligned */}
      <section className="px-4 pb-6">
        <div className={`${contentMaxWidth} mx-auto`}>
          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <WeekDots weeks={recentWeeks} currentSlug={currentSlug} />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-20 px-4">
        <div className={`${contentMaxWidth} mx-auto`}>
          <article 
            className="card p-8 sm:p-10 animate-fade-in"
            style={{ animationDelay: '0.3s' }}
          >
            {Array.isArray(week.keywords) && week.keywords.length > 0 && (
              <div className="keyword-row mb-6">
                {week.keywords.map((kw) => (
                  <span key={kw} className="keyword-pill">
                    {kw}
                  </span>
                ))}
              </div>
            )}

            {/* Pure Markdown Content Only */}
            <div 
              className="markdown-content"
              lang={language}
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: week.contentHtml }}
            />
          </article>
        </div>
      </section>

      {/* Back to Top */}
      <BackToTop />

      {/* Footer */}
      <footer 
        className="py-8 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="space-y-1">
          {language === 'zh' ? (
            <>
              <p>本内容由领域记忆驱动的研究型内容生产工作流生成</p>
              <p>联系作者：xuhaoruins@hotmail.com</p>
            </>
          ) : (
            <>
              <p>Content generated by memory-based research-driven Agentic workflow.</p>
              <p>Contact Author: xuhaoruins@hotmail.com</p>
            </>
          )}
          <p className="pt-1">© {new Date().getFullYear()} {language === 'en' ? 'Frontier Weekly' : '礼拜观'}</p>
        </div>
      </footer>
    </div>
  )
}

function isCoarsePointer() {
  if (typeof window === 'undefined') return false
  return Boolean(
    window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches
  )
}

function closeAllCitations(rootEl) {
  if (!rootEl) return
  const openEls = rootEl.querySelectorAll('a[data-cite][data-cite-open="true"]')
  openEls.forEach((el) => {
    el.setAttribute('data-cite-open', 'false')
    el.setAttribute('aria-expanded', 'false')
  })
}

function ensureCitePopover() {
  let popoverEl = document.getElementById('cite-popover')
  if (!popoverEl) {
    popoverEl = document.createElement('div')
    popoverEl.id = 'cite-popover'
    popoverEl.className = 'cite-popover'
    popoverEl.setAttribute('role', 'dialog')
    popoverEl.setAttribute('aria-label', '引用来源')
    popoverEl.setAttribute('hidden', '')

    document.body.appendChild(popoverEl)
  }

  let linkEl = popoverEl.querySelector('a.cite-popover-link')
  if (!linkEl) {
    linkEl = document.createElement('a')
    linkEl.className = 'cite-popover-link'
    popoverEl.appendChild(linkEl)
  }

  return { popoverEl, linkEl }
}

