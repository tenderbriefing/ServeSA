'use client'

import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  resolveCitizenMunicipality,
  type CitizenMunicipalityResolution,
} from '@/lib/municipality/resolveCitizenMunicipality'

/**
 * Shared citizen municipality context for Our Municipality, updates, ideas, etc.
 */
export function useCitizenMunicipality(): CitizenMunicipalityResolution & {
  loading: boolean
} {
  const { municipalityCode, userProfile, loading } = useAuth()
  const profileCode = (userProfile as { municipalityCode?: string } | null)
    ?.municipalityCode

  const resolved = useMemo(
    () =>
      resolveCitizenMunicipality({
        claimsMunicipalityCode: municipalityCode,
        profileMunicipalityCode: profileCode,
      }),
    [municipalityCode, profileCode]
  )

  return { ...resolved, loading }
}
