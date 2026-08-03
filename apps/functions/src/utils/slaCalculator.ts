/**
 * ServeSA Phase-1: SLA Calculator
 * Re-exports shared contract calculation for backend consumers.
 */

import {
  calculateSlaFields,
  DEFAULT_SLA_HOURS,
  SLA_POLICY_VERSION,
  type MunicipalitySLAConfig,
  type CanonicalCategory,
  type Priority,
} from '@servesa/case-contract'

export { DEFAULT_SLA_HOURS, SLA_POLICY_VERSION }

/**
 * Calculate SLA target date based on category, priority, and municipality configuration
 */
export function calculateSLA(
  category: string,
  priority: string,
  municipalitySLA?: MunicipalitySLAConfig
): Date {
  const result = calculateSlaFields(
    category as CanonicalCategory,
    priority as Priority,
    municipalitySLA
  )
  return result.slaTarget
}

export function calculateSLADetails(
  category: string,
  priority: string,
  municipalitySLA?: MunicipalitySLAConfig,
  startedAt?: Date
) {
  return calculateSlaFields(
    category as CanonicalCategory,
    priority as Priority,
    municipalitySLA,
    startedAt
  )
}

export function checkSLABreach(slaTarget: Date): boolean {
  return new Date() > slaTarget
}

export function getSLARemaining(slaTarget: Date): {
  hours: number
  minutes: number
  breached: boolean
} {
  const now = new Date()
  const timeRemaining = slaTarget.getTime() - now.getTime()

  if (timeRemaining <= 0) {
    return { hours: 0, minutes: 0, breached: true }
  }

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor(
    (timeRemaining % (1000 * 60 * 60)) / (1000 * 60)
  )

  return { hours, minutes, breached: false }
}

export function getSLAStatus(slaTarget: Date): {
  status: 'on_track' | 'urgent' | 'breached'
  description: string
  color: string
} {
  const remaining = getSLARemaining(slaTarget)

  if (remaining.breached) {
    return { status: 'breached', description: 'SLA breached', color: 'red' }
  }

  if (remaining.hours <= 24) {
    return {
      status: 'urgent',
      description: `Due in ${remaining.hours}h ${remaining.minutes}m`,
      color: 'orange',
    }
  }

  return {
    status: 'on_track',
    description: `Due in ${remaining.hours}h ${remaining.minutes}m`,
    color: 'green',
  }
}

export function calculateResponseTime(
  createdAt: Date,
  resolvedAt: Date
): number {
  return (resolvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
}

export function getSLAPerformance(
  cases: Array<{ slaTarget: Date; resolvedAt?: Date; createdAt: Date }>
): {
  totalCases: number
  breachedCases: number
  breachRate: number
  avgResponseTime: number
  onTimeRate: number
} {
  const totalCases = cases.length
  const breachedCases = cases.filter((c) => checkSLABreach(c.slaTarget)).length
  const resolvedCases = cases.filter((c) => c.resolvedAt)

  const breachRate =
    totalCases > 0 ? (breachedCases / totalCases) * 100 : 0

  const avgResponseTime =
    resolvedCases.length > 0
      ? resolvedCases.reduce(
          (sum, c) => sum + calculateResponseTime(c.createdAt, c.resolvedAt!),
          0
        ) / resolvedCases.length
      : 0

  const onTimeCases = resolvedCases.filter(
    (c) => c.resolvedAt! <= c.slaTarget
  ).length
  const onTimeRate =
    resolvedCases.length > 0
      ? (onTimeCases / resolvedCases.length) * 100
      : 0

  return {
    totalCases,
    breachedCases,
    breachRate,
    avgResponseTime,
    onTimeRate,
  }
}
