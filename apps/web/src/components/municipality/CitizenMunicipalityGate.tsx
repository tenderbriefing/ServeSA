'use client'

import { AuthGate } from '@/components/Auth/AuthGate'
import { ConfirmMunicipalityPanel } from '@/components/municipality/ConfirmMunicipalityPanel'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import { Spinner } from '@/components/ui/LoadingSkeleton'

type CitizenMunicipalityGateProps = {
  children: React.ReactNode
  /** AuthGate redirect target */
  next: string
  authTitle?: string
  authDescription?: string
  confirmTitle?: string
  confirmDescription?: string
}

/**
 * Shared gate for municipality-dependent citizen surfaces.
 * Unauthenticated → AuthGate
 * Authenticated without municipality → ConfirmMunicipalityPanel
 * Authenticated with municipality → children
 */
export function CitizenMunicipalityGate({
  children,
  next,
  authTitle = 'Sign in to continue',
  authDescription = 'Confirm your municipality after signing in to see local civic services.',
  confirmTitle,
  confirmDescription,
}: CitizenMunicipalityGateProps) {
  return (
    <AuthGate next={next} title={authTitle} description={authDescription}>
      <CitizenMunicipalityGateInner
        confirmTitle={confirmTitle}
        confirmDescription={confirmDescription}
      >
        {children}
      </CitizenMunicipalityGateInner>
    </AuthGate>
  )
}

function CitizenMunicipalityGateInner({
  children,
  confirmTitle,
  confirmDescription,
}: {
  children: React.ReactNode
  confirmTitle?: string
  confirmDescription?: string
}) {
  const { municipalityCode, loading } = useCitizenMunicipality()

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner label="Loading your municipality…" />
      </div>
    )
  }

  if (!municipalityCode) {
    return (
      <div className="bg-canvas py-12">
        <div className="container">
          <ConfirmMunicipalityPanel
            title={confirmTitle}
            description={confirmDescription}
          />
        </div>
      </div>
    )
  }

  return <>{children}</>
}
