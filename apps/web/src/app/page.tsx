'use client'

import { useAuth } from '@/hooks/useAuth'
import { LandingHero } from '@/components/landing/LandingHero'
import { CaseJourney } from '@/components/landing/CaseJourney'
import { CitizenReportDemo } from '@/components/landing/CitizenReportDemo'
import { MunicipalityWorkflow } from '@/components/landing/MunicipalityWorkflow'
import { MunicipalUpdatesPreview } from '@/components/landing/MunicipalUpdatesPreview'
import { MunicipalityPlanningPreview } from '@/components/landing/MunicipalityPlanningPreview'
import { CommunityIdeasPreview } from '@/components/landing/CommunityIdeasPreview'
import { CivicImpactMap } from '@/components/landing/CivicImpactMap'
import { TrustPrinciples } from '@/components/landing/TrustPrinciples'
import { NationalVision } from '@/components/landing/NationalVision'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { CivicYDivider } from '@/components/civic/CivicMotif'

/**
 * Public landing — cinematic civic product storytelling.
 * Preserves all citizen routes and feature-flag gated sections.
 */
export default function HomePage() {
  // Do not gate the entire homepage on auth loading — Firebase session restore
  // can take seconds and left citizens staring at an empty "Loading Serve SA…" shell.
  const { user } = useAuth()

  return (
    <div className="bg-canvas">
      <LandingHero
        trackHref={user ? '/dashboard' : '/case'}
        trackLabel={user ? 'View My Cases' : 'Track a Case'}
      />
      <CivicYDivider />
      <CaseJourney />
      <CitizenReportDemo />
      <MunicipalityWorkflow />
      <MunicipalUpdatesPreview />
      <MunicipalityPlanningPreview />
      <CommunityIdeasPreview />
      <CivicImpactMap />
      <TrustPrinciples />
      <NationalVision />
      <FinalCTA signedIn={Boolean(user)} />
    </div>
  )
}
