'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

export default function WeekCard({ week }) {
  const { t, lang } = useLanguage()
  
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    if (lang === 'zh') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  return (
    <Link href={`/week/${week.slug}`}>
      <article className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden card-hover">
        {/* Card Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="tag tag-primary">
              {week.weekNumber ? `${t('week')}${week.weekNumber}${t('weekSuffix')}` : t('briefLabel')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(week.date)}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
            {week.title}
          </h3>
          
          {week.excerpt && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
              {week.excerpt}
            </p>
          )}
        </div>

        {/* Tags */}
        {week.tags && week.tags.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap gap-2">
              {week.tags.slice(0, 4).map((tag, index) => (
                <span key={index} className="tag tag-secondary">
                  {tag}
                </span>
              ))}
              {week.tags.length > 4 && (
                <span className="tag tag-secondary">
                  +{week.tags.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Read More */}
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 flex items-center">
            {t('readMore')}
            <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </article>
    </Link>
  )
}
