import { getAllWeeks } from '@/lib/weeks'
import ArchivesContent from '@/components/ArchivesContent'

export const metadata = {
  title: 'Archives | Frontier Daily',
  description: 'No slop cutting-edge trends and high quality tech insights',
}

export default function EnArchivesPage() {
  const allWeeks = getAllWeeks('en')
  return <ArchivesContent allWeeks={allWeeks} />
}
