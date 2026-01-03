'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function TableOfContents({ content }) {
  const { t } = useLanguage()
  const [activeId, setActiveId] = useState('')
  const [headings, setHeadings] = useState([])

  useEffect(() => {
    // Extract headings from content
    const regex = /^(#{2,3})\s+(.+)$/gm
    const matches = [...content.matchAll(regex)]
    const extracted = matches.map((match, index) => ({
      id: `heading-${index}`,
      level: match[1].length,
      text: match[2].replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'),
    }))
    setHeadings(extracted)
  }, [content])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0% -66%' }
    )

    headings.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) {
        observer.observe(element)
      }
    })

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {t('tableOfContents')}
      </h3>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block py-1 border-l-2 pl-3 transition-colors ${
                activeId === heading.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
