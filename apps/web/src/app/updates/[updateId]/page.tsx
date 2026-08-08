import UpdateDetailClient from './UpdateDetailClient'

export function generateStaticParams() {
  return [{ updateId: '_' }]
}

export default function UpdateDetailPage() {
  return <UpdateDetailClient />
}
