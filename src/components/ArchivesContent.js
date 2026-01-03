'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LanguageToggle from '@/components/LanguageToggle'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ArchivesContent({ allWeeks }) {
  const { language } = useLanguage()
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const prefix = isEn ? '/en' : ''

  const t = {
    title: {
      zh: '历史回顾',
      en: 'Archives'
    },
    back: {
      zh: '← 返回首页',
      en: '← Back Home'
    },
    briefs: {
      zh: '篇周报',
      en: 'briefs'
    },
    week: {
      zh: '周',
      en: 'Week'
    },
    noContent: {
      zh: '暂无历史内容',
      en: 'No archives yet'
    }
  }

  // Group weeks by year
  const weeksByYear = allWeeks.reduce((acc, week) => {
    const year = new Date(week.date).getFullYear()
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(week)
    return acc
  }, {})

  const years = Object.keys(weeksByYear).sort((a, b) => b - a)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (language === 'en') {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <Link 
            href={prefix || '/'}
            className="inline-block mb-6 text-sm transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
          >
            {t.back[language]}
          </Link>

          <h1 
            className="text-3xl sm:text-4xl font-serif font-semibold animate-fade-in"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-serif)' }}
          >
            {t.title[language]}
          </h1>

          <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <LanguageToggle />
          </div>
        </div>
      </section>

      {/* Archives List */}
      <section className="pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {years.length > 0 ? (
            <div className="space-y-10">
              {years.map((year, yearIndex) => (
                <div 
                  key={year}
                  className="animate-fade-in"
                  style={{ animationDelay: `${yearIndex * 0.1}s` }}
                >
                  {/* Year Header */}
                  <div className="flex items-center gap-3 mb-6">
                    <span 
                      className="text-2xl font-serif font-semibold"
                      style={{ color: 'var(--accent)', fontFamily: 'var(--font-serif)' }}
                    >
                      {year}
                    </span>
                    <span 
                      className="text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {weeksByYear[year].length} {t.briefs[language]}
                    </span>
                  </div>

                  {/* Weeks List */}
                  <div className="space-y-3">
                    {weeksByYear[year].map((week, index) => (
                      <Link 
                        key={week.slug}
                        href={`${prefix}/week/${week.slug}`}
                        className="card block p-5 transition-all duration-200 hover:shadow-md"
                        style={{
                          animationDelay: `${(yearIndex * 0.1) + (index * 0.05)}s`
                        }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="tag tag-accent text-xs">
                                {language === 'en' ? `${t.week.en} ${week.weekNumber}` : `第${week.weekNumber}${t.week.zh}`}
                              </span>
                              <span 
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {formatDate(week.date)}
                              </span>
                            </div>
                            <h3 
                              className="font-medium truncate"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {week.title}
                            </h3>
                          </div>
                          <span 
                            className="text-sm flex-shrink-0"
                            style={{ color: 'var(--accent)' }}
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div 
              className="text-center py-20"
              style={{ color: 'var(--text-muted)' }}
            >
              {t.noContent[language]}
            </div>
          )}
        </div>
      </section>

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
