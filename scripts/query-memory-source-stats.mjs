import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    'Missing env: SUPABASE_URL and SUPABASE_PUBLIC_KEY (or NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY).'
  )
  process.exit(1)
}

const base = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`
const url = new URL('rest/v1/memory_source_stats', base)
url.searchParams.set('select', '*')

const res = await fetch(url.toString(), {
  headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    Accept: 'application/json',
  },
})

if (!res.ok) {
  const body = await res.text().catch(() => '')
  console.error(`HTTP ${res.status}: failed to fetch memory_source_stats`)
  if (body) console.error(body)
  process.exit(2)
}

const rows = await res.json()

function inferField(row, candidates) {
  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(row, key)) return key
  }
  return null
}

function inferSourceField(row) {
  return (
    inferField(row, ['source', 'source_name', 'name', 'provider', 'channel', 'type']) ||
    Object.keys(row).find((k) => typeof row[k] === 'string')
  )
}

function inferCountField(row) {
  return (
    inferField(row, ['count', 'cnt', 'total', 'hits', 'num', 'n', 'value']) ||
    Object.keys(row).find((k) => typeof row[k] === 'number')
  )
}

if (!Array.isArray(rows) || rows.length === 0) {
  console.log('No rows returned.')
  process.exit(0)
}

const sample = rows[0]
const sourceField = inferSourceField(sample)
const countField = inferCountField(sample)

if (!sourceField || !countField) {
  console.error('Unable to infer source/count fields. Keys:', Object.keys(sample))
  process.exit(3)
}

const items = rows
  .map((r) => ({ source: r[sourceField], count: r[countField] }))
  .filter((x) => typeof x.source === 'string' && typeof x.count === 'number')
  .sort((a, b) => b.count - a.count)

const total = items.reduce((s, x) => s + x.count, 0)
const top = items.slice(0, 10)
const other = items.slice(10)
const topSum = top.reduce((s, x) => s + x.count, 0)
const otherCount = total - topSum

const pct = (n) => (total ? (n / total) * 100 : 0)

console.log(`total=${total}, sources=${items.length}`)
console.log('--- top 10 ---')
for (const x of top) {
  console.log(`${x.source}\t${x.count}\t${pct(x.count).toFixed(2)}%`)
}
if (other.length) {
  console.log('--- other ---')
  console.log(`other\t${otherCount}\t${pct(otherCount).toFixed(2)}%\t(${other.length} sources)`)
}
