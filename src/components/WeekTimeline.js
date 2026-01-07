'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function WeekTimeline({ weeks, currentSlug }) {
  const { t, lang } = useLanguage()

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (lang === 'zh') {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {t('pastWeeks')}
      </h3>
      <div className="space-y-2">
        {weeks.map((week) => (
          <Link
            key={week.slug}
            href={`/week/${week.slug}`}
            className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
              week.slug === currentSlug
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {week.weekNumber ? `${t('week')}${week.weekNumber}${t('weekSuffix')}` : t('briefLabel')}
              </span>
              <span className="text-xs opacity-75">
                {formatDate(week.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>
      
      <Link
        href="/archives"
        className="mt-4 block text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
      >
        {t('viewAll')} →
      </Link>
    </div>
  )
}
