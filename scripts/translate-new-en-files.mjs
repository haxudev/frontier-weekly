import fs from 'fs/promises'
import path from 'path'

const listFile = process.argv[2] || 'added_zh_files.txt'

// Azure OpenAI config
const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT?.replace(/\/+$/, '')
const azureKey = process.env.AZURE_OPENAI_KEY
// Fallback: GitHub Models (legacy)
const ghToken = process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN
const ghEndpoint = process.env.GITHUB_MODELS_ENDPOINT || 'https://models.inference.ai.azure.com'

const model = process.env.MODEL_ID || 'gpt-5.4-mini'
const apiVersion = process.env.AZURE_API_VERSION || '2025-01-01-preview'
const MAX_RETRIES = 3

function getApiConfig() {
  if (azureEndpoint && azureKey) {
    return {
      url: `${azureEndpoint}/openai/deployments/${model}/chat/completions?api-version=${apiVersion}`,
      headers: { 'api-key': azureKey, 'Content-Type': 'application/json' },
      label: `Azure OpenAI (${model})`
    }
  }
  if (ghToken) {
    return {
      url: `${ghEndpoint}/chat/completions`,
      headers: { 'Authorization': `Bearer ${ghToken}`, 'Content-Type': 'application/json' },
      label: `GitHub Models (${model})`
    }
  }
  throw new Error('Missing credentials. Set AZURE_OPENAI_ENDPOINT+AZURE_OPENAI_KEY or GITHUB_MODELS_TOKEN.')
}

async function readList(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf-8')
    return txt.split('\n').map(s => s.trim()).filter(Boolean)
  } catch (e) {
    return []
  }
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function translateMarkdown(markdown) {
  const api = getApiConfig()

  const body = {
    messages: [
      {
        role: 'system',
        content: 'You are a professional translator. Translate the provided Markdown from Simplified Chinese to native English. Preserve ALL Markdown/HTML tags, anchors, IDs, link targets, code blocks, and formatting. Do not change href/src, id values, or list/item structure. Output ONLY the translated Markdown.'
      },
      { role: 'user', content: markdown }
    ]
  }
  // GitHub Models needs model in body; Azure OpenAI uses deployment URL
  if (!azureEndpoint) body.model = model

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(api.url, {
      method: 'POST',
      headers: api.headers,
      body: JSON.stringify(body)
    })

    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get('retry-after') || '60', 10)
      const waitSec = Math.max(retryAfter, 30) * attempt
      console.warn(`  429 rate limited, waiting ${waitSec}s (attempt ${attempt}/${MAX_RETRIES})...`)
      await sleep(waitSec * 1000)
      continue
    }

    if (!res.ok) {
      const errTxt = await res.text()
      if (attempt < MAX_RETRIES && res.status >= 500) {
        console.warn(`  Server error ${res.status}, retrying in ${30 * attempt}s...`)
        await sleep(30 * attempt * 1000)
        continue
      }
      throw new Error(`API call failed: ${res.status} ${res.statusText} ${errTxt}`)
    }

    const data = await res.json()
    const choice = (data.choices && data.choices[0]) || null
    const content = choice?.message?.content ?? choice?.content
    if (!content) throw new Error('No content returned from model')
    return content
  }

  throw new Error(`Failed after ${MAX_RETRIES} retries (rate limited)`)
}

async function main() {
  const api = getApiConfig()
  console.log(`Using: ${api.label}`)
  console.log(`Using listFile=${listFile}`)

  const zhFiles = await readList(listFile)
  if (zhFiles.length === 0) {
    console.log('No zh files to translate')
    return
  }
  await fs.mkdir(path.join('content', 'en'), { recursive: true })

  let needTranslateCount = 0
  for (const zhPath of zhFiles) {
    const base = path.basename(zhPath)
    const enPath = path.join('content', 'en', base)
    try {
      await fs.access(zhPath)

      try {
        await fs.access(enPath)
        console.log(`Skip (en exists): ${zhPath} -> ${enPath}`)
        continue
      } catch { /* en does not exist; proceed */ }

      needTranslateCount++
      console.log(`Translating: ${zhPath}...`)
      const src = await fs.readFile(zhPath, 'utf-8')
      const out = await translateMarkdown(src)
      await fs.writeFile(enPath, out, 'utf-8')
      console.log(`  Done: ${zhPath} -> ${enPath}`)
    } catch (e) {
      console.error(`Failed to translate ${zhPath}:`, e.message)
      process.exitCode = 1
    }
  }

  if (needTranslateCount === 0) {
    console.log('Nothing to translate (all en files already exist).')
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
