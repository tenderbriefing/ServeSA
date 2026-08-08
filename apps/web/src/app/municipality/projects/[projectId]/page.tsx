import MunicipalProjectDetailClient from './MunicipalProjectDetailClient'

export function generateStaticParams() {
  return [{ projectId: '_' }]
}

export default function MunicipalProjectDetailPage() {
  return <MunicipalProjectDetailClient />
}
