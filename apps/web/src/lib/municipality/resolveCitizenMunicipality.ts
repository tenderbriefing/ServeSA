/**
 * Citizen municipality association — profile/claims only.
 * Never defaults to JHB or any pilot municipality.
 * Does not call GIS; case georesolution remains the authoritative boundary path.
 */

export type CitizenMunicipalitySource = 'claims' | 'profile' | 'none'

export type CitizenMunicipalityResolution = {
  municipalityCode: string | null
  source: CitizenMunicipalitySource
  /** True when Serve SA has a verified/stored municipality for this citizen */
  confirmed: boolean
}

export function resolveCitizenMunicipality(input: {
  claimsMunicipalityCode?: string | null
  profileMunicipalityCode?: string | null
}): CitizenMunicipalityResolution {
  const fromClaims = normalizeMunicipalityCode(input.claimsMunicipalityCode)
  if (fromClaims) {
    return {
      municipalityCode: fromClaims,
      source: 'claims',
      confirmed: true,
    }
  }
  const fromProfile = normalizeMunicipalityCode(input.profileMunicipalityCode)
  if (fromProfile) {
    return {
      municipalityCode: fromProfile,
      source: 'profile',
      confirmed: true,
    }
  }
  return {
    municipalityCode: null,
    source: 'none',
    confirmed: false,
  }
}

export function normalizeMunicipalityCode(
  code?: string | null
): string | null {
  const trimmed = (code || '').trim().toUpperCase()
  return trimmed || null
}
