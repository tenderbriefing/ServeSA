import IdeaDetailClient from './IdeaDetailClient'

export function generateStaticParams() {
  return [{ ideaId: '_' }]
}

export default function IdeaDetailPage() {
  return <IdeaDetailClient />
}
