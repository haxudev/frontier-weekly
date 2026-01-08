import fs from 'fs/promises'
import path from 'path'

const listFile = process.argv[2] || 'added_zh_files.txt'
const token = process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN
const endpoint = process.env.GITHUB_MODELS_ENDPOINT || process.env.GITHUB_MODEL_ENDPOINT || 'https://models.inference.ai.azure.com'
const model = process.env.MODEL_ID || 'gpt-5'

if (!token) {
  console.error('Missing token. Set env GITHUB_MODELS_TOKEN (CI) or GITHUB_TOKEN (local).')
  process.exit(1)
}

async function readList(filePath) {
  try {
    const txt = await fs.readFile(filePath, 'utf-8')
    return txt.split('\n').map(s => s.trim()).filter(Boolean)
  } catch (e) {
    return []
  }
}

async function translateMarkdown(markdown) {
  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: 'You are GitHub Copilot coding agent. Translate the provided Markdown from Simplified Chinese to native English. Preserve ALL Markdown/HTML tags, anchors, IDs, link targets, code blocks, and formatting. Do not change href/src, id values, or list/item structure. Output ONLY the translated Markdown.'
      },
      {
        role: 'user',
        content: markdown
      }
    ]
  }

  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })

  if (!res.ok) {
    const errTxt = await res.text()
    throw new Error(`Model call failed: ${res.status} ${res.statusText} ${errTxt}`)
  }

  const data = await res.json()
  const choice = (data.choices && data.choices[0]) || null
  const content = choice?.message?.content ?? choice?.content
  if (!content) throw new Error('No content returned from model')
  return content
}

async function main() {
  console.log(`Using endpoint=${endpoint}`)
  console.log(`Using model=${model}`)
  console.log(`Using listFile=${listFile}`)

  const zhFiles = await readList(listFile)
  if (zhFiles.length === 0) {
    console.log('No zh files to translate')
    return
  }
  await fs.mkdir(path.join('content', 'en'), { recursive: true })
  for (const zhPath of zhFiles) {
    const base = path.basename(zhPath)
    const enPath = path.join('content', 'en', base)
    try {
      await fs.access(zhPath)
      const src = await fs.readFile(zhPath, 'utf-8')
      const out = await translateMarkdown(src)
      await fs.writeFile(enPath, out, 'utf-8')
      console.log(`Translated: ${zhPath} -> ${enPath}`)
    } catch (e) {
      console.error(`Failed to translate ${zhPath}:`, e.message)
      process.exitCode = 1
    }
  }
}

main().catch(err => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
