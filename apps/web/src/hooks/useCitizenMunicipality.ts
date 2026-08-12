'use client'

import { useMemo } from 'react'
import { useAuth } from '@/hooks/useAuth'
import {
  resolveCitizenMunicipality,
  type CitizenMunicipalityResolution,
} from '@/lib/municipality/resolveCitizenMunicipality'

/**
 * Shared citizen municipality context for Our Municipality, updates, ideas, etc.
 * Precedence: JWT claims → persisted profile → null (never invents JHB).
 */
export function useCitizenMunicipality(): CitizenMunicipalityResolution & {
  loading: boolean
  refreshProfile: () => Promise<void>
} {
  const {
    claimsMunicipalityCode,
    userProfile,
    loading,
    refreshProfile,
  } = useAuth()
  const profileCode = (userProfile as { municipalityCode?: string } | null)
    ?.municipalityCode

  const resolved = useMemo(
    () =>
      resolveCitizenMunicipality({
        claimsMunicipalityCode,
        profileMunicipalityCode: profileCode,
      }),
    [claimsMunicipalityCode, profileCode]
  )

  return { ...resolved, loading, refreshProfile }
}
