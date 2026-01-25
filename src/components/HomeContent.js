'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRef, useState, useEffect } from 'react'
import WeekDots from '@/components/WeekDots'
import ShareButtons from '@/components/ShareButtons'
import MobileShareFab from '@/components/MobileShareFab'
import { useLanguage } from '@/contexts/LanguageContext'
import { useCitationInteractions } from '@/lib/useCitationInteractions'

export default function HomeContent({ latestWeek, recentWeeks }) {
  const { language } = useLanguage()
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const prefix = isEn ? '/en' : ''
  const contentMaxWidth = language === 'en' ? 'max-w-4xl' : 'max-w-3xl'
  const contentRef = useRef(null)
  useCitationInteractions(contentRef, [latestWeek?.contentHtml])
  
  // 获取当前页面 URL（客户端）
  const [pageUrl, setPageUrl] = useState('')
  useEffect(() => {
    if (latestWeek?.slug) {
      // 首页分享链接指向具体的文章页面
      setPageUrl(`${window.location.origin}${prefix}/week/${latestWeek.slug}`)
    } else {
      setPageUrl(window.location.href)
    }
  }, [latestWeek?.slug, prefix])

  const t = {
    title: {
      zh: '前沿今辰观',
      en: 'Frontier Daily'
    },
    subtitle: {
      zh: '无噪声前沿趋势发现与科技干货洞察',
      en: 'No slop frontier trends and firsthand tech insights'
    },
    archives: {
      zh: '查看全部日报',
      en: 'View All Briefs'
    },
    noContent: {
      zh: '暂无内容，敬请期待',
      en: 'Content coming soon'
    },
    share: {
      zh: '分享这篇文章',
      en: 'Share this article'
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

        </div>
      </section>

      {/* Week Navigator - Left Aligned */}
      <section className="px-4 pb-6">
        <div className={`${contentMaxWidth} mx-auto`}>
          {recentWeeks.length > 0 && (
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <WeekDots weeks={recentWeeks} currentSlug={latestWeek?.slug} />
            </div>
          )}
        </div>
      </section>

      {/* Main Content - Pure Markdown */}
      <section className="pb-20 px-4">
        <div className={`${contentMaxWidth} mx-auto`}>
          {latestWeek ? (
            <article 
              className="card p-8 sm:p-10 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
            >
              {Array.isArray(latestWeek.keywords) && latestWeek.keywords.length > 0 && (
                <div className="keyword-row mb-6">
                  {latestWeek.keywords.map((kw) => (
                    <span key={kw} className="keyword-pill">
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Pure Markdown Content Only */}
              {latestWeek.contentHtml && (
                <div 
                  className="markdown-content"
                  lang={language}
                  ref={contentRef}
                  dangerouslySetInnerHTML={{ __html: latestWeek.contentHtml }}
                />
              )}

              {/* 分享按钮 */}
              <div className="mt-10 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>
                  {t.share[language]}
                </p>
                <ShareButtons 
                  title={latestWeek.title}
                  url={pageUrl}
                  description={latestWeek.excerpt}
                  date={latestWeek.date}
                  keywords={latestWeek.keywords}
                  toc={latestWeek.toc}
                />
              </div>
            </article>
          ) : (
            <div 
              className="text-center py-20"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.noContent[language]}
            </div>
          )}

          {/* Archives Link */}
          {recentWeeks.length > 0 && (
            <div className="text-center mt-12 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <Link 
                href={`${prefix}/archives`}
                className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 hover:scale-105"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)'
                }}
              >
                {t.archives[language]}
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 移动端浮动分享按钮 */}
      {latestWeek && (
        <MobileShareFab
          title={latestWeek.title}
          url={pageUrl}
          description={latestWeek.excerpt}
          date={latestWeek.date}
          keywords={latestWeek.keywords}
          toc={latestWeek.toc}
          lang={language}
        />
      )}

      {/* Footer */}
      <footer 
        className="py-8 text-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        <div className="space-y-1">
          {language === 'zh' ? (
            <>
              <p>本网站的发布和内容的撰写是由垂类记忆驱动的深度研究型多智能体协同工作流全自动完成</p>
              <p>联系作者：xuhaoruins@hotmail.com</p>
            </>
          ) : (
            <>
              <p>Content generated by memory-based research-driven Agentic workflow.</p>
              <p>Contact Author: xuhaoruins@hotmail.com</p>
            </>
          )}
          <p className="pt-1">© {new Date().getFullYear()} {language === 'en' ? 'Frontier Daily' : '前沿今辰观'}</p>
        </div>
      </footer>
    </div>
  )
}
