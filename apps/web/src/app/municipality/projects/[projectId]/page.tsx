import { AuthGate } from '@/components/Auth/AuthGate'
import MunicipalProjectDetailClient from './MunicipalProjectDetailClient'

export function generateStaticParams() {
  return [{ projectId: '_' }]
}

export default function MunicipalProjectDetailPage() {
  return (
    <AuthGate
      next="/municipality"
      title="Sign in to view municipal projects"
      description="Project details from Our Municipality are available after you sign in."
    >
      <MunicipalProjectDetailClient />
    </AuthGate>
  )
}
