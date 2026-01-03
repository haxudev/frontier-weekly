import { getAllWeeks } from '@/lib/weeks'
import ArchivesContent from '@/components/ArchivesContent'

export const metadata = {
  title: 'Archives | Frontier Weekly',
  description: 'Trends Discovery & Idea Insights',
}

export default function EnArchivesPage() {
  const allWeeks = getAllWeeks('en')
  return <ArchivesContent allWeeks={allWeeks} />
}
