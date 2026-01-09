'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function WeekDots({ weeks, currentSlug }) {
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const prefix = isEn ? '/en' : ''

  const formatWeekLabel = (week) => {
    // Prefer filename slug: YYYYMMDD
    const slug = String(week.slug || '')
    const match = slug.match(/^(\d{4})(\d{2})(\d{2})$/)
    if (match) {
      const year = Number(match[1])
      const monthIndex = Number(match[2]) - 1
      const day = Number(match[3])

      if (isEn) {
        const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
        const suffix = (d) => {
          if (d > 3 && d < 21) return 'th'
          switch (d % 10) {
            case 1: return 'st'
            case 2: return 'nd'
            case 3: return 'rd'
            default: return 'th'
          }
        }
        return `${monthNames[monthIndex]} ${day}${suffix(day)}`
      }

      return `${monthIndex + 1}月${day}日`
    }

    // Fallback: try frontmatter date (older weekly content)
    if (week.date) {
      const d = new Date(week.date)
      if (!Number.isNaN(d.getTime())) {
        const monthIndex = d.getMonth()
        const day = d.getDate()
        if (isEn) {
          const monthNames = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.']
          const suffix = (x) => {
            if (x > 3 && x < 21) return 'th'
            switch (x % 10) {
              case 1: return 'st'
              case 2: return 'nd'
              case 3: return 'rd'
              default: return 'th'
            }
          }
          return `${monthNames[monthIndex]} ${day}${suffix(day)}`
        }
        return `${monthIndex + 1}月${day}日`
      }
    }

    return slug
  }

  const formatWeekTitle = (week) => {
    const slug = String(week.slug || '')
    const match = slug.match(/^(\d{4})(\d{2})(\d{2})$/)
    if (match) {
      return `${match[1]}-${match[2]}-${match[3]}`
    }
    return slug
  }

  // Take the most recent weeks (up to 10)
  const displayWeeks = weeks.slice(0, 10)

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {displayWeeks.map((week, index) => {
        const isActive = currentSlug === week.slug
        
        return (
          <Link 
            key={week.slug}
            href={`${prefix}/week/${week.slug}`}
            className="week-pill"
            title={formatWeekTitle(week)}
            style={{
              animationDelay: `${index * 0.05}s`,
              background: isActive ? 'var(--text-primary)' : 'transparent',
              color: isActive ? 'var(--bg-primary)' : 'var(--text-secondary)',
              border: `1px solid ${isActive ? 'var(--text-primary)' : 'var(--border)'}`,
            }}
          >
            {formatWeekLabel(week)}
          </Link>
        )
      })}
    </div>
  )
}
