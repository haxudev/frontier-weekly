import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

function escapeHtmlAttribute(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 预处理 Markdown：修复粗体/斜体在中文标点前后无法正确解析的问题
function fixCjkEmphasis(content) {
  if (typeof content !== 'string') return content

  // 中日韩标点符号集合（用 Unicode 转义避免解析问题）
  // 。，、；：？！""''【】（）《》〈〉「」『』…—～·
  const cjkPunct = '\u3002\uff0c\u3001\uff1b\uff1a\uff1f\uff01\u201c\u201d\u2018\u2019\u3010\u3011\uff08\uff09\u300a\u300b\u3008\u3009\u300c\u300d\u300e\u300f\u2026\u2014\uff5e\u00b7'
  // 常规西文标点
  const latinPunct = '.,;:?!\'"()\\[\\]{}\\-'

  // 修复：**文字**后紧跟标点时，在 ** 和标点之间加零宽空格
  // 例如：**跨模型可复现性仍未被证明。** → 能正常渲染
  
  let result = content

  // 处理粗体：**text** 其中 text 可能以标点结尾
  // 关键：remark-gfm 在某些情况下无法识别 **text。** 这种模式
  // 解决方案：在闭合 ** 前的标点后添加零宽空格
  
  // 方案1：修复 **内容以标点结尾** 的情况（在结尾标点后、** 前加零宽空格）
  const punctPattern = new RegExp(`([${cjkPunct}${latinPunct}])\\*\\*(?=[^*]|$)`, 'g')
  result = result.replace(punctPattern, '$1\u200B**')

  return result
}

function compactCitationLinks(contentHtml) {
  if (typeof contentHtml !== 'string' || !contentHtml) return contentHtml

  // Convert links like: <a ...>[2]Title</a> into a compact citation marker.
  // We keep the title in a data attribute so CSS can show a tooltip on hover/focus.
  return contentHtml.replace(
    /<a\b([^>]*?)>(\s*\[(\d+)\]([\s\S]*?))<\/a>/g,
    (match, attrs, fullText, citeNumber, restText) => {
      const titleText = String(restText || '').trim()
      const escapedTitle = escapeHtmlAttribute(titleText)
      const escapedAria = escapeHtmlAttribute(`[${citeNumber}] ${titleText}`.trim())

      // If this anchor is already processed, keep it.
      if (/\bdata-cite=/.test(attrs)) return match

      return `<a${attrs} data-cite="${citeNumber}" data-cite-title="${escapedTitle}" data-cite-open="false" aria-label="${escapedAria}" aria-expanded="false">[${citeNumber}]</a>`
    }
  )
}

function getWeeksDirectory(locale = 'zh') {
  if (locale === 'en') {
    return path.join(process.cwd(), 'content/en')
  }
  return path.join(process.cwd(), 'content/zh')
}

function deriveTitle({ data, content, slug }) {
  const fmTitle = typeof data?.title === 'string' ? data.title.trim() : ''
  if (fmTitle) return fmTitle

  const h1Match = typeof content === 'string' ? content.match(/^#\s+(.+?)\s*$/m) : null
  const h1Title = h1Match?.[1]?.trim() || ''
  if (h1Title) return h1Title

  return slug
}

function parseDateFromSlug(slug) {
  const s = String(slug || '')
  const m = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (!m) return null
  const year = Number(m[1])
  const monthIndex = Number(m[2]) - 1
  const day = Number(m[3])
  const d = new Date(year, monthIndex, day)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function deriveDateIso({ data, slug }) {
  if (data?.date) {
    const d = new Date(data.date)
    if (!Number.isNaN(d.getTime())) return d.toISOString()
  }

  const fromSlug = parseDateFromSlug(slug)
  if (fromSlug) return fromSlug.toISOString()

  return new Date().toISOString()
}

export function getAllWeeks(locale = 'zh') {
  const weeksDirectory = getWeeksDirectory(locale)
  // Ensure directory exists
  if (!fs.existsSync(weeksDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(weeksDirectory)
  const allWeeks = fileNames
    .filter(fileName => fileName.endsWith('.md'))
    .map(fileName => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(weeksDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      const keywords = (() => {
        const raw = data.keywords
        if (!raw) return []
        if (Array.isArray(raw)) return raw.map((k) => String(k).trim()).filter(Boolean)
        return String(raw)
          .split(/[、,，]/g)
          .map((k) => k.trim())
          .filter(Boolean)
      })()

      // Extract first paragraph as excerpt
      const excerptMatch = content.match(/^(?!#)(.+?)(?:\n\n|\n#)/s)
      const excerpt = excerptMatch 
        ? excerptMatch[1].replace(/\n/g, ' ').slice(0, 200) + '...'
        : ''

      const title = deriveTitle({ data, content, slug })

      return {
        slug,
        title,
        date: deriveDateIso({ data, slug }),
        weekNumber: data.weekNumber || parseInt(slug.replace(/\D/g, '')) || 1,
        tags: data.tags || [],
        keywords,
        excerpt,
      }
    })

  // Sort by date descending
  return allWeeks.sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getWeekBySlug(slug, locale = 'zh') {
  const weeksDirectory = getWeeksDirectory(locale)
  const fullPath = path.join(weeksDirectory, `${slug}.md`)
  
  if (!fs.existsSync(fullPath)) {
    return null
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const keywords = (() => {
    const raw = data.keywords
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map((k) => String(k).trim()).filter(Boolean)
    return String(raw)
      .split(/[、,，]/g)
      .map((k) => k.trim())
      .filter(Boolean)
  })()

  const title = deriveTitle({ data, content, slug })

  return {
    slug,
    title,
    date: deriveDateIso({ data, slug }),
    weekNumber: data.weekNumber || parseInt(slug.replace(/\D/g, '')) || 1,
    tags: data.tags || [],
    keywords,
    content,
  }
}

export async function getWeekContent(slug, locale = 'zh') {
  const week = getWeekBySlug(slug, locale)
  
  if (!week) {
    return null
  }

  // 预处理：修复中文标点与粗体/斜体的兼容问题
  const fixedContent = fixCjkEmphasis(week.content)

  // Process markdown to HTML
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(fixedContent)

  let contentHtml = processedContent.toString()

  // Make dense citation lists less wordy: show only [n] and keep the title in a tooltip.
  contentHtml = compactCitationLinks(contentHtml)

  // Add IDs to headings for table of contents
  let headingIndex = 0
  contentHtml = contentHtml.replace(/<h([23])>(.+?)<\/h\1>/g, (match, level, text) => {
    const id = `heading-${headingIndex++}`
    return `<h${level} id="${id}">${text}</h${level}>`
  })

  return {
    ...week,
    contentHtml,
  }
}

export function getRecentWeeks(count = 5, locale = 'zh') {
  const allWeeks = getAllWeeks(locale)
  return allWeeks.slice(0, count)
}
