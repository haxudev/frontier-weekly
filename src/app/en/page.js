import { getRecentWeeks, getWeekContent } from '@/lib/weeks'
import HomeContent from '@/components/HomeContent'

export const metadata = {
  title: 'Frontier Weekly',
  description: 'Trends Discovery & Idea Insights',
}

export default async function EnHomePage() {
  const recentWeeks = getRecentWeeks(8, 'en')
  const latestWeekMeta = recentWeeks[0] || null

  const latestWeek = latestWeekMeta ? await getWeekContent(latestWeekMeta.slug, 'en') : null

  return <HomeContent latestWeek={latestWeek} recentWeeks={recentWeeks} />
}
