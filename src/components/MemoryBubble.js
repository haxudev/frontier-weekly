'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/contexts/LanguageContext'

function formatNumber(value, language) {
  try {
    return new Intl.NumberFormat(language === 'en' ? 'en-US' : 'zh-CN').format(value)
  } catch {
    return String(value)
  }
}

function formatPercent(value) {
  const safe = Number.isFinite(value) ? value : 0
  const decimals = safe >= 10 ? 1 : 2
  return `${safe.toFixed(decimals)}%`
}

// 优雅的配色方案（暖色系，与网站风格一致）
const COLORS = [
  '#b8860b', // 金色（主色）
  '#d4a84b', // 浅金
  '#8b7355', // 棕褐
  '#a0522d', // 赭石
  '#cd853f', // 秘鲁色
  '#daa520', // 金麒麟
  '#bc8f8f', // 玫瑰棕
  '#c4a35a', // 暗金
  '#9c7e65', // 灰褐
  '#b5916d', // 浅棕
  '#9a9a9a', // 其他（灰色）
]

// 生成环形饼图的 SVG 路径
function generateDonutPaths(items, cx, cy, outerR, innerR) {
  const paths = []
  let cumulative = 0

  items.forEach((item, index) => {
    const startAngle = cumulative * 3.6 - 90 // 从顶部开始
    const endAngle = (cumulative + item.percent) * 3.6 - 90
    cumulative += item.percent

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    const x1Outer = cx + outerR * Math.cos(startAngleRad)
    const y1Outer = cy + outerR * Math.sin(startAngleRad)
    const x2Outer = cx + outerR * Math.cos(endAngleRad)
    const y2Outer = cy + outerR * Math.sin(endAngleRad)

    const x1Inner = cx + innerR * Math.cos(endAngleRad)
    const y1Inner = cy + innerR * Math.sin(endAngleRad)
    const x2Inner = cx + innerR * Math.cos(startAngleRad)
    const y2Inner = cy + innerR * Math.sin(startAngleRad)

    const largeArcFlag = item.percent > 50 ? 1 : 0

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerR} ${outerR} 0 ${largeArcFlag} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerR} ${innerR} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ')

    paths.push({
      d,
      color: COLORS[index % COLORS.length],
      ...item,
    })
  })

  return paths
}

export default function MemoryBubble() {
  const { language } = useLanguage()
  const pathname = usePathname() || '/'
  const isEn = pathname === '/en' || pathname.startsWith('/en/')

  const [open, setOpen] = useState(false)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hoveredIndex, setHoveredIndex] = useState(null)

  const t = useMemo(
    () => ({
      button: { zh: '记忆', en: 'Memory' },
      title: { zh: '记忆概览', en: 'Memory Overview' },
      subtitle: { zh: 'Top 10 来源分布', en: 'Top 10 Source Distribution' },
      total: { zh: '总计', en: 'Total' },
      sources: { zh: '来源数', en: 'Sources' },
      other: { zh: '其他', en: 'Other' },
      loading: { zh: '正在加载…', en: 'Loading…' },
      empty: { zh: '暂无统计数据', en: 'No stats available' },
      error: { zh: '统计加载失败', en: 'Failed to load stats' },
      close: { zh: '关闭', en: 'Close' },
      hint: {
        zh: '提示：若出现 PGRST205，说明 PostgREST 找不到 public.memory_source_stats（表/视图名或 schema 不对，或未暴露）。',
        en: 'Hint: PGRST205 usually means PostgREST cannot find public.memory_source_stats (wrong table/schema or not exposed).',
      },
    }),
    []
  )

  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/memory-source-stats.json', {
          headers: { Accept: 'application/json' },
        })
        const json = await res
          .json()
          .catch(async () => ({ error: await res.text().catch(() => '') }))
        if (!res.ok) {
          const supa = json?.supabaseError
          const supaMsg =
            supa?.code && supa?.message ? `${supa.code}: ${supa.message}` : supa?.message
          throw new Error(supaMsg || json?.error || `HTTP ${res.status}`)
        }
        if (!cancelled) setData(json)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', onKeyDown)
      return () => document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const top = Array.isArray(data?.top) ? data.top : []
  const other = data?.other || { count: 0, percent: 0, sources: 0 }
  const total = typeof data?.total === 'number' ? data.total : 0
  const sourceCount = top.length + (other?.sources ? other.sources : 0)

  // 合并 top + other 用于饼图
  const chartItems = useMemo(() => {
    const items = top.map((item, i) => ({
      label: item.source,
      percent: item.percent,
      count: item.count,
      index: i,
    }))
    if (other?.count > 0) {
      items.push({
        label: t.other[language],
        percent: other.percent,
        count: other.count,
        index: top.length,
        isOther: true,
      })
    }
    return items
  }, [top, other, language, t])

  const donutPaths = useMemo(
    () => generateDonutPaths(chartItems, 100, 100, 90, 55),
    [chartItems]
  )

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[70] rounded-full shadow-lg px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-105"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
        aria-label={t.button[language]}
      >
        <span className="inline-flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full"
            style={{ background: 'rgba(184, 134, 11, 0.12)', color: 'var(--accent)' }}
            aria-hidden
          >
            ◎
          </span>
          {t.button[language]}
        </span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-[80]"
          role="dialog"
          aria-modal="true"
          aria-label={t.title[language]}
        >
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0, 0, 0, 0.35)' }}
            onClick={() => setOpen(false)}
          />

          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
            <div
              className="w-full max-w-2xl card overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{ boxShadow: '0 18px 48px rgba(0,0,0,0.18)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 sm:p-6 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div
                      className="text-lg font-semibold"
                      style={{
                        color: 'var(--text-primary)',
                        fontFamily: language === 'en' ? 'var(--font-serif-en)' : 'var(--font-serif)',
                      }}
                    >
                      {t.title[language]}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.subtitle[language]}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="text-sm px-3 py-1.5 rounded-md transition-colors"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {t.close[language]}
                  </button>
                </div>

                {/* Stats summary */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.total[language]}
                    </div>
                    <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {formatNumber(total, language)}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.sources[language]}
                    </div>
                    <div className="mt-1 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {sourceCount}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6">
                {loading ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t.loading[language]}
                  </div>
                ) : error ? (
                  <div className="py-2">
                    <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {t.error[language]}
                    </div>
                    <div className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {t.hint[language]}
                    </div>
                    <div className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {String(error).slice(0, 260)}
                    </div>
                  </div>
                ) : chartItems.length === 0 ? (
                  <div className="py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                    {t.empty[language]}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    {/* Donut Chart */}
                    <div className="relative flex-shrink-0">
                      <svg
                        width="200"
                        height="200"
                        viewBox="0 0 200 200"
                        className="drop-shadow-sm"
                      >
                        {donutPaths.map((path, i) => (
                          <path
                            key={i}
                            d={path.d}
                            fill={path.color}
                            stroke="var(--bg-card)"
                            strokeWidth="1.5"
                            className="transition-all duration-200 cursor-pointer"
                            style={{
                              opacity: hoveredIndex === null || hoveredIndex === i ? 1 : 0.4,
                              transform: hoveredIndex === i ? 'scale(1.03)' : 'scale(1)',
                              transformOrigin: 'center',
                            }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                        ))}
                        {/* 中心数字 */}
                        <text
                          x="100"
                          y="95"
                          textAnchor="middle"
                          className="text-2xl font-semibold"
                          style={{ fill: 'var(--text-primary)' }}
                        >
                          {hoveredIndex !== null
                            ? formatPercent(chartItems[hoveredIndex]?.percent || 0)
                            : formatNumber(total, language)}
                        </text>
                        <text
                          x="100"
                          y="115"
                          textAnchor="middle"
                          className="text-xs"
                          style={{ fill: 'var(--text-muted)' }}
                        >
                          {hoveredIndex !== null
                            ? chartItems[hoveredIndex]?.label?.slice(0, 12) || ''
                            : t.total[language]}
                        </text>
                      </svg>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 w-full sm:w-auto">
                      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2">
                        {chartItems.map((item, i) => (
                          <div
                            key={item.label}
                            className="flex items-center gap-3 p-2 rounded-md transition-all duration-200 cursor-pointer"
                            style={{
                              background: hoveredIndex === i ? 'var(--bg-secondary)' : 'transparent',
                            }}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          >
                            <div
                              className="w-3 h-3 rounded-sm flex-shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}
                            />
                            <div className="flex-1 min-w-0">
                              <div
                                className="text-sm truncate"
                                style={{ color: 'var(--text-primary)' }}
                                title={item.label}
                              >
                                {item.label}
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div
                                className="text-sm font-medium"
                                style={{ color: 'var(--text-primary)' }}
                              >
                                {formatPercent(item.percent)}
                              </div>
                              <div
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {formatNumber(item.count, language)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
