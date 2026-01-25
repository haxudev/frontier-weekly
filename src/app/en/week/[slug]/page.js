import { notFound } from 'next/navigation'
import { getAllWeeks, getWeekContent, getRecentWeeks } from '@/lib/weeks'
import { siteConfig, getPageUrl, getOgImageUrl } from '@/lib/siteConfig'
import WeekDetailClient from '../../../week/[slug]/WeekDetailClient'

export async function generateStaticParams() {
  const weeks = getAllWeeks('en')
  return weeks.map((week) => ({
    slug: week.slug,
  }))
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const week = await getWeekContent(resolvedParams.slug, 'en')

  if (!week) {
    return { title: 'Not Found' }
  }

  const title = `${week.title} | Frontier Daily`
  const description = week.excerpt || week.title
  const url = getPageUrl(`/week/${resolvedParams.slug}`, 'en')
  const ogImageUrl = getOgImageUrl(week.title, 'en')

  return {
    title,
    description,
    // Canonical URL
    alternates: {
      canonical: url,
    },
    // Open Graph
    openGraph: {
      title: week.title,
      description,
      url,
      siteName: siteConfig.name.en,
      type: 'article',
      locale: 'en_US',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: week.title,
        },
      ],
      article: {
        publishedTime: week.date,
        authors: [siteConfig.author.name],
        tags: week.keywords || [],
      },
    },
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: week.title,
      description,
      images: [ogImageUrl],
      ...(siteConfig.twitter.site && { site: siteConfig.twitter.site }),
      ...(siteConfig.twitter.creator && { creator: siteConfig.twitter.creator }),
    },
    // 其他 meta 标签
    keywords: week.keywords?.join(', '),
    authors: [{ name: siteConfig.author.name }],
  }
}

export default async function EnWeekPage({ params }) {
  const resolvedParams = await params
  const week = await getWeekContent(resolvedParams.slug, 'en')
  const recentWeeks = getRecentWeeks(10, 'en')

  if (!week) {
    notFound()
  }

  return <WeekDetailClient week={week} recentWeeks={recentWeeks} currentSlug={resolvedParams.slug} />
}
