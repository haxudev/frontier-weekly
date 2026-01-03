'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function WeekDots({ weeks, currentSlug }) {
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')
  const prefix = isEn ? '/en' : ''

  const formatWeekLabel = (week) => {
    const slug = String(week.slug || '')
    const match = slug.match(/^(\d{4})-week-(\d{1,2})$/)
    const year = match?.[1] || (week.date ? String(new Date(week.date).getFullYear()) : '')
    const weekNo = Number(match?.[2] || week.weekNumber || NaN)

    if (!year || Number.isNaN(weekNo)) return slug

    if (isEn) {
      const w = String(weekNo).padStart(2, '0')
      return `${year} · W${w}`
    }
    return `${year}第${weekNo}周`
  }

  // Take the most recent weeks (up to 8)
  const displayWeeks = weeks.slice(0, 8)

  return (
    <div className="flex flex-wrap gap-2 py-2">
      {displayWeeks.map((week, index) => {
        const isActive = currentSlug === week.slug
        
        return (
          <Link 
            key={week.slug}
            href={`${prefix}/week/${week.slug}`}
            className="week-pill"
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
