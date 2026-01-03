'use client'

import { usePathname, useRouter } from 'next/navigation'

function stripTrailingSlash(path) {
  if (path !== '/' && path.endsWith('/')) return path.slice(0, -1)
  return path
}

export default function LanguageToggle() {
  const router = useRouter()
  const pathnameRaw = usePathname() || '/'
  const pathname = stripTrailingSlash(pathnameRaw)

  const isEn = pathname === '/en' || pathname.startsWith('/en/')

  const targetPath = isEn
    ? (pathname.replace(/^\/en/, '') || '/')
    : (pathname === '/' ? '/en' : `/en${pathname}`)

  return (
    <div className="flex justify-center">
      <div
        className="inline-flex items-center rounded-full p-1"
        style={{
          background: 'rgba(235, 229, 217, 0.55)',
          border: '1px solid var(--border)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (!isEn) return
            router.push(targetPath)
          }}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          style={{
            background: !isEn ? 'var(--bg-card)' : 'transparent',
            color: !isEn ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: !isEn ? '0 6px 18px rgba(45, 42, 38, 0.10)' : 'none',
          }}
        >
          中文
        </button>
        <button
          type="button"
          onClick={() => {
            if (isEn) return
            router.push(targetPath)
          }}
          className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200"
          style={{
            background: isEn ? 'var(--bg-card)' : 'transparent',
            color: isEn ? 'var(--text-primary)' : 'var(--text-muted)',
            boxShadow: isEn ? '0 6px 18px rgba(45, 42, 38, 0.10)' : 'none',
          }}
        >
          EN
        </button>
      </div>
    </div>
  )
}
