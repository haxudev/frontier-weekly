'use client'

import { usePathname, useRouter } from 'next/navigation'

function stripTrailingSlash(path) {
  if (path !== '/' && path.endsWith('/')) return path.slice(0, -1)
  return path
}

export default function LanguageToggle({ className = '' }) {
  const router = useRouter()
  const pathnameRaw = usePathname() || '/'
  const pathname = stripTrailingSlash(pathnameRaw)

  const isEn = pathname === '/en' || pathname.startsWith('/en/')

  const getTargetPath = (targetLang) => {
    const base = isEn ? pathname.replace(/^\/en/, '') || '/' : pathname
    if (targetLang === 'en') {
      return base === '/' ? '/en' : `/en${base}`
    }
    return base === '' ? '/' : base
  }

  const go = (targetLang) => {
    if ((targetLang === 'en' && isEn) || (targetLang === 'zh' && !isEn)) return
    router.push(getTargetPath(targetLang))
  }

  return (
    <div className={`relative inline-flex items-center gap-1 rounded-full border px-1.5 py-1 text-xs font-semibold shadow-sm transition-all duration-200 ${className}`} role="group" aria-label="Language switcher" style={{
      background: 'var(--toggle-bg)',
      borderColor: 'var(--border)',
      boxShadow: 'var(--shadow-soft)',
      backdropFilter: 'blur(10px)'
    }}>
      <span
        aria-hidden="true"
        className="absolute inset-y-1 w-1/2 rounded-full transition-transform duration-200"
        style={{
          transform: isEn ? 'translateX(100%)' : 'translateX(0)',
          background: 'var(--toggle-thumb)',
          boxShadow: 'var(--shadow-soft)'
        }}
      />

      <button
        type="button"
        onClick={() => go('zh')}
        aria-pressed={!isEn}
        className="relative z-10 w-16 px-3 py-1 text-center transition-colors duration-150"
        style={{ color: !isEn ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        中文
      </button>
      <button
        type="button"
        onClick={() => go('en')}
        aria-pressed={isEn}
        className="relative z-10 w-16 px-3 py-1 text-center transition-colors duration-150"
        style={{ color: isEn ? 'var(--text-primary)' : 'var(--text-muted)' }}
      >
        EN
      </button>
    </div>
  )
}
