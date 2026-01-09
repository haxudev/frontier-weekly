import { notFound } from 'next/navigation'
import { getAllWeeks, getWeekContent, getRecentWeeks } from '@/lib/weeks'
import WeekDetailClient from './WeekDetailClient'

export async function generateStaticParams() {
  const weeks = getAllWeeks()
  return weeks.map((week) => ({
    slug: week.slug,
  }))
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params
  const week = await getWeekContent(resolvedParams.slug)
  
  if (!week) {
    return {
      title: 'Not Found',
    }
  }

  return {
    title: `${week.title} | 前沿今辰观`,
    description: week.excerpt || week.title,
  }
}

export default async function WeekPage({ params }) {
  const resolvedParams = await params
  const week = await getWeekContent(resolvedParams.slug)
  const recentWeeks = getRecentWeeks(10)

  if (!week) {
    notFound()
  }

  return (
    <WeekDetailClient
      week={week}
      recentWeeks={recentWeeks}
      currentSlug={resolvedParams.slug}
    />
  )
}
