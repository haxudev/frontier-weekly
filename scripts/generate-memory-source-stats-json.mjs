import 'dotenv/config'

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

function getEnv(name, fallbacks = []) {
  if (process.env[name]) return process.env[name]
  for (const fallback of fallbacks) {
    if (process.env[fallback]) return process.env[fallback]
  }
  return undefined
}

function pickField(obj, candidates) {
  for (const key of candidates) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key)) return key
  }
  return null
}

function inferSourceField(row) {
  return (
    pickField(row, ['source', 'source_name', 'name', 'provider', 'channel', 'type']) ||
    Object.keys(row || {}).find((k) => typeof row[k] === 'string') ||
    null
  )
}

function inferCountField(row) {
  return (
    pickField(row, ['count', 'cnt', 'total', 'hits', 'num', 'n', 'value']) ||
    Object.keys(row || {}).find((k) => typeof row[k] === 'number') ||
    null
  )
}

function normalizeRows(rows) {
  if (!Array.isArray(rows) || rows.length === 0) {
    return { items: [], fieldInfo: null }
  }

  const sample = rows[0]
  const sourceField = inferSourceField(sample)
  const countField = inferCountField(sample)

  if (!sourceField || !countField) {
    return {
      items: [],
      fieldInfo: {
        sourceField,
        countField,
        sampleKeys: Object.keys(sample || {}),
      },
    }
  }

  const items = rows
    .map((row) => {
      const source = row?.[sourceField]
      const count = row?.[countField]
      if (typeof source !== 'string') return null
      if (typeof count !== 'number' || !Number.isFinite(count)) return null
      return { source, count }
    })
    .filter(Boolean)

  return { items, fieldInfo: { sourceField, countField } }
}

function cleanAndMergeItems(items) {
  const merged = new Map()

  for (const item of items) {
    let source = item.source

    if (source.startsWith('rss:')) {
      source = source.slice(4)
    }

    if (source.toLowerCase().startsWith('arxiv-') || source.toLowerCase() === 'arxiv') {
      source = 'arXiv'
    }

    const existing = merged.get(source)
    if (existing) {
      existing.count += item.count
    } else {
      merged.set(source, { source, count: item.count })
    }
  }

  return Array.from(merged.values())
}

function toPercent(count, total) {
  if (!total) return 0
  return (count / total) * 100
}

function buildEmptyPayload(extra = {}) {
  return {
    total: 0,
    top: [],
    other: { count: 0, percent: 0, sources: 0 },
    ...extra,
  }
}

async function fetchSupabaseRows() {
  const supabaseUrl = getEnv('SUPABASE_URL', ['NEXT_PUBLIC_SUPABASE_URL'])
  const supabaseKey = getEnv('SUPABASE_PUBLIC_KEY', [
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_KEY',
  ])
  const schema = getEnv('MEMORY_SOURCE_STATS_SCHEMA', ['SUPABASE_REST_SCHEMA']) || 'public'
  const table = getEnv('MEMORY_SOURCE_STATS_TABLE') || 'memory_source_stats'

  if (!supabaseUrl || !supabaseKey) {
    return { ok: false, reason: 'missing_env', rows: null, tried: { schema, table } }
  }

  const base = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`
  const url = new URL(`rest/v1/${table}`, base)
  url.searchParams.set('select', '*')

  const res = await fetch(url.toString(), {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      'Accept-Profile': schema,
      Accept: 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    return {
      ok: false,
      reason: 'fetch_failed',
      rows: null,
      tried: { schema, table, status: res.status, body: text.slice(0, 300) },
    }
  }

  const rows = await res.json().catch(() => null)
  if (!Array.isArray(rows)) {
    return { ok: false, reason: 'invalid_json', rows: null, tried: { schema, table } }
  }

  return { ok: true, rows, tried: { schema, table } }
}

async function main() {
  const outDir = path.join(process.cwd(), 'public')
  const outFile = path.join(outDir, 'memory-source-stats.json')

  const result = await fetchSupabaseRows().catch((e) => ({
    ok: false,
    reason: 'exception',
    rows: null,
    tried: { message: e?.message || String(e) },
  }))

  let payload

  if (!result.ok) {
    payload = buildEmptyPayload({
      fieldInfo: null,
      generatedAt: new Date().toISOString(),
      note:
        result.reason === 'missing_env'
          ? 'No Supabase env configured at build time; generated empty stats.'
          : 'Failed to fetch stats at build time; generated empty stats.',
      tried: result.tried,
    })
  } else {
    const normalized = normalizeRows(result.rows)

    if (normalized.items.length === 0) {
      payload = buildEmptyPayload({
        fieldInfo: normalized.fieldInfo,
        generatedAt: new Date().toISOString(),
        tried: result.tried,
      })
    } else {
      const cleanedItems = cleanAndMergeItems(normalized.items)
      const cleanedTotal = cleanedItems.reduce((sum, item) => sum + item.count, 0)
      const sorted = [...cleanedItems].sort((a, b) => b.count - a.count)
      const topN = 10

      const topItems = sorted.slice(0, topN)
      const restItems = sorted.slice(topN)
      const topSum = topItems.reduce((sum, item) => sum + item.count, 0)
      const otherCount = cleanedTotal - topSum

      payload = {
        total: cleanedTotal,
        top: topItems.map((item) => ({
          ...item,
          percent: toPercent(item.count, cleanedTotal),
        })),
        other: {
          count: otherCount,
          percent: toPercent(otherCount, cleanedTotal),
          sources: restItems.length,
        },
        generatedAt: new Date().toISOString(),
        tried: result.tried,
      }
    }
  }

  await mkdir(outDir, { recursive: true })
  await writeFile(outFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')

  // Always exit 0: static export should not be blocked by missing optional stats.
}

await main()
