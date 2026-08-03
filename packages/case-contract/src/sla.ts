import type { CanonicalCategory } from './categories'

export const SLA_POLICY_VERSION = '1.0.0'

export type SlaPriority = 'emergency' | 'high' | 'medium' | 'low'

export type SLAConfig = Record<SlaPriority, number>

export type MunicipalitySLAConfig = Record<CanonicalCategory, SLAConfig>

/** Default SLA hours unless municipality overrides */
export const DEFAULT_SLA_HOURS: MunicipalitySLAConfig = {
  water: { emergency: 1, high: 24, medium: 72, low: 168 },
  electricity: { emergency: 1, high: 4, medium: 24, low: 72 },
  roads: { emergency: 4, high: 24, medium: 72, low: 168 },
  waste: { emergency: 24, high: 48, medium: 72, low: 168 },
  internet: { emergency: 24, high: 72, medium: 168, low: 336 },
  emergency: { emergency: 1, high: 2, medium: 4, low: 8 },
}

export interface SLACalculation {
  targetHours: number
  slaStartedAt: Date
  slaTarget: Date
  slaBreach: false
  policyVersion: string
}

/**
 * Calculate SLA target using server clock (UTC).
 * Municipality config overrides defaults when present.
 */
export function calculateSlaFields(
  category: CanonicalCategory,
  priority: SlaPriority,
  municipalitySLA?: Partial<MunicipalitySLAConfig> | null,
  startedAt: Date = new Date()
): SLACalculation {
  const categoryDefaults = DEFAULT_SLA_HOURS[category]
  const override = municipalitySLA?.[category]
  const hours = override?.[priority] ?? categoryDefaults?.[priority]

  if (hours === undefined || typeof hours !== 'number' || hours < 0) {
    throw new Error(`Invalid SLA configuration for ${category}/${priority}`)
  }

  const slaTarget = new Date(startedAt.getTime() + hours * 60 * 60 * 1000)

  return {
    targetHours: hours,
    slaStartedAt: startedAt,
    slaTarget,
    slaBreach: false,
    policyVersion: SLA_POLICY_VERSION,
  }
}

export function getTargetHours(
  category: CanonicalCategory,
  priority: SlaPriority,
  municipalitySLA?: Partial<MunicipalitySLAConfig> | null
): number {
  return calculateSlaFields(category, priority, municipalitySLA).targetHours
}
