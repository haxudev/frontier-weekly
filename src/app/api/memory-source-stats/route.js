import { NextResponse } from 'next/server'

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
    return { items: [], total: 0, fieldInfo: null }
  }

  const sample = rows[0]
  const sourceField = inferSourceField(sample)
  const countField = inferCountField(sample)

  if (!sourceField || !countField) {
    return {
      items: [],
      total: 0,
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

  const total = items.reduce((sum, item) => sum + item.count, 0)
  return { items, total, fieldInfo: { sourceField, countField } }
}

function toPercent(count, total) {
  if (!total) return 0
  return (count / total) * 100
}

async function readSupabaseError(res) {
  const text = await res.text().catch(() => '')
  try {
    const json = JSON.parse(text)
    return {
      status: res.status,
      code: json?.code,
      message: json?.message,
      hint: json?.hint,
      details: json?.details,
    }
  } catch {
    return { status: res.status, message: text?.slice(0, 300) }
  }
}

export async function GET(req) {
  const supabaseUrl = getEnv('SUPABASE_URL', ['NEXT_PUBLIC_SUPABASE_URL'])
  const supabaseKey = getEnv('SUPABASE_PUBLIC_KEY', [
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_KEY',
  ])
  const schema = getEnv('MEMORY_SOURCE_STATS_SCHEMA', ['SUPABASE_REST_SCHEMA']) || 'public'
  const table = getEnv('MEMORY_SOURCE_STATS_TABLE') || 'memory_source_stats'

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      {
        error:
          'Missing SUPABASE_URL / SUPABASE_PUBLIC_KEY (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).',
      },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(req.url)
  const top = Number(searchParams.get('top') || '10')
  const topN = Number.isFinite(top) && top > 0 ? Math.floor(top) : 10

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
    cache: 'no-store',
  })

  if (!res.ok) {
    const supabaseError = await readSupabaseError(res)
    return NextResponse.json(
      {
        error: 'Failed to fetch memory_source_stats from Supabase.',
        status: res.status,
        supabaseError,
        tried: { schema, table },
      },
      { status: 502 }
    )
  }

  const rows = await res.json()
  const normalized = normalizeRows(rows)

  if (normalized.items.length === 0) {
    return NextResponse.json(
      {
        total: 0,
        top: [],
        other: { count: 0, percent: 0, sources: 0 },
        fieldInfo: normalized.fieldInfo,
      },
      { status: 200 }
    )
  }

  const sorted = [...normalized.items].sort((a, b) => b.count - a.count)
  const topItems = sorted.slice(0, topN)
  const restItems = sorted.slice(topN)

  const topSum = topItems.reduce((sum, item) => sum + item.count, 0)
  const otherCount = normalized.total - topSum

  return NextResponse.json(
    {
      total: normalized.total,
      top: topItems.map((item) => ({
        ...item,
        percent: toPercent(item.count, normalized.total),
      })),
      other: {
        count: otherCount,
        percent: toPercent(otherCount, normalized.total),
        sources: restItems.length,
      },
    },
    { status: 200 }
  )
}
