import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'

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
        date: data.date || new Date().toISOString(),
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
    date: data.date || new Date().toISOString(),
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

  // Process markdown to HTML
  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(week.content)

  let contentHtml = processedContent.toString()

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
