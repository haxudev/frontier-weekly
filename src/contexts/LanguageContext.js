'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const translations = {
  zh: {
    siteTitle: '前沿今辰观',
    siteSubtitle: '无噪声前沿趋势发现与高质量科技热点洞察',
    home: '首页',
    archives: '历史回顾',
    about: '关于',
    latestBrief: '最新日报',
    pastWeeks: '往期回顾',
    viewAll: '查看全部',
    briefLabel: '日报',
    readMore: '阅读全文',
    publishedOn: '发布于',
    tableOfContents: '目录',
    backToTop: '返回顶部',
    noContent: '暂无内容',
    week: '第',
    weekSuffix: '周',
    copyright: '版权所有',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    language: '语言',
  },
  en: {
    siteTitle: 'Frontier Daily',
    siteSubtitle: 'No slop cutting-edge trends and high quality tech insights',
    home: 'Home',
    archives: 'Archives',
    about: 'About',
    latestBrief: 'Latest Brief',
    pastWeeks: 'Past Weeks',
    viewAll: 'View All',
    briefLabel: 'Brief',
    readMore: 'Read More',
    publishedOn: 'Published on',
    tableOfContents: 'Table of Contents',
    backToTop: 'Back to Top',
    noContent: 'No content available',
    week: 'Week ',
    weekSuffix: '',
    copyright: 'All rights reserved',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
  }
}

const LanguageContext = createContext({
  lang: 'zh',
  language: 'zh',
  setLang: () => {},
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }) {
  const pathname = usePathname() || '/'
  const [lang, setLang] = useState('zh')

  useEffect(() => {
    const isEn = pathname === '/en' || pathname.startsWith('/en/')
    const nextLang = isEn ? 'en' : 'zh'
    setLang(nextLang)
  }, [pathname])

  const t = (key) => {
    return translations[lang]?.[key] || translations['en'][key] || key
  }

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'zh' ? 'en' : 'zh'))
  }

  return (
    <LanguageContext.Provider
      value={{
        lang,
        language: lang,
        setLang,
        setLanguage: setLang,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
