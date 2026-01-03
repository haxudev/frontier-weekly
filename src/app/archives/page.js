import { getAllWeeks } from '@/lib/weeks'
import ArchivesContent from '@/components/ArchivesContent'

export default function ArchivesPage() {
  const allWeeks = getAllWeeks()

  return <ArchivesContent allWeeks={allWeeks} />
}
