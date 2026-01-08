'use client'

import WeekDots from '@/components/WeekDots'
import BackToTop from '@/components/BackToTop'
import LanguageToggle from '@/components/LanguageToggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRef } from 'react'
import { useCitationInteractions } from '@/lib/useCitationInteractions'

export default function WeekDetailClient({ week, recentWeeks, currentSlug }) {
  const { language } = useLanguage()
  const contentMaxWidth = language === 'en' ? 'max-w-4xl' : 'max-w-3xl'
  const contentRef = useRef(null)

  useCitationInteractions(contentRef, [week?.contentHtml])

  const t = {
    title: {
      zh: '前沿今辰观',
      en: 'Frontier Daily'
    },
    subtitle: {
      zh: '无噪声前沿趋势发现与科技干货洞察',
      en: 'No slop frontier trends and firsthand tech insights'
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
              <p>本网站的发布和内容的撰写是由垂类记忆驱动的深度研究型多智能体协同工作流全自动完成</p>
              <p>联系作者：xuhaoruins@hotmail.com</p>
            </>
          ) : (
            <>
              <p>Content auto generated and published by memory-first deep-research Agentic workflow.</p>
              <p>Contact Author: xuhaoruins@hotmail.com</p>
            </>
          )}
          <p className="pt-1">© {new Date().getFullYear()} {language === 'en' ? 'Frontier Daily' : '前沿今辰观'}</p>
        </div>
      </footer>
    </div>
  )
}


