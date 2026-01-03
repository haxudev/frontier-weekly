import { notFound } from 'next/navigation'
import { getAllWeeks, getWeekContent, getRecentWeeks } from '@/lib/weeks'
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

  return {
    title: `${week.title} | Frontier Weekly`,
    description: week.excerpt || week.title,
  }
}

export default async function EnWeekPage({ params }) {
  const resolvedParams = await params
  const week = await getWeekContent(resolvedParams.slug, 'en')
  const recentWeeks = getRecentWeeks(8, 'en')

  if (!week) {
    notFound()
  }

  return <WeekDetailClient week={week} recentWeeks={recentWeeks} currentSlug={resolvedParams.slug} />
}
