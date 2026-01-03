import { getRecentWeeks, getWeekContent } from '@/lib/weeks'
import HomeContent from '@/components/HomeContent'

export default async function HomePage() {
  const recentWeeks = getRecentWeeks(8)
  const latestWeekMeta = recentWeeks[0] || null
  
  // Get full content for the latest week
  const latestWeek = latestWeekMeta 
    ? await getWeekContent(latestWeekMeta.slug)
    : null

  return <HomeContent latestWeek={latestWeek} recentWeeks={recentWeeks} />
}
