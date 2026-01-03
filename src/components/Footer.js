'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const { t } = useLanguage()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-primary-500 to-primary-700 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">W</span>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('siteTitle')}
            </span>
          </div>
          
          <div className="text-sm text-gray-500 dark:text-gray-500">
            © {currentYear} {t('copyright')}
          </div>
        </div>
      </div>
    </footer>
  )
}
