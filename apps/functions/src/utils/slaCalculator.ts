/**
 * ServeSA Phase-1: SLA Calculator
 * This utility calculates SLA targets based on category, priority, and municipality configuration
 */

interface SLAConfig {
  emergency: number
  high: number
  medium: number
  low: number
}

interface MunicipalitySLAConfig {
  water: SLAConfig
  electricity: SLAConfig
  roads: SLAConfig
  waste: SLAConfig
  internet: SLAConfig
  emergency: SLAConfig
}

/**
 * Calculate SLA target date based on category, priority, and municipality configuration
 */
export function calculateSLA(
  category: string,
  priority: string,
  municipalitySLA?: MunicipalitySLAConfig
): Date {
  // Default SLA hours if municipality config not available
  const defaultSLA: MunicipalitySLAConfig = {
    water: { emergency: 1, high: 24, medium: 72, low: 168 },
    electricity: { emergency: 1, high: 4, medium: 24, low: 72 },
    roads: { emergency: 4, high: 24, medium: 72, low: 168 },
    waste: { emergency: 24, high: 48, medium: 72, low: 168 },
    internet: { emergency: 24, high: 72, medium: 168, low: 336 },
    emergency: { emergency: 1, high: 2, medium: 4, low: 8 }
  }

  const slaConfig = municipalitySLA || defaultSLA
  const categorySLA = slaConfig[category as keyof MunicipalitySLAConfig] || defaultSLA[category as keyof MunicipalitySLAConfig]
  
  if (!categorySLA) {
    throw new Error(`Invalid category: ${category}`)
  }

  const hours = categorySLA[priority as keyof SLAConfig]
  if (hours === undefined) {
    throw new Error(`Invalid priority: ${priority}`)
  }

  const targetDate = new Date()
  targetDate.setHours(targetDate.getHours() + hours)

  return targetDate
}

/**
 * Check if SLA has been breached
 */
export function checkSLABreach(slaTarget: Date): boolean {
  const now = new Date()
  return now > slaTarget
}

/**
 * Calculate time remaining until SLA breach
 */
export function getSLARemaining(slaTarget: Date): {
  hours: number
  minutes: number
  breached: boolean
} {
  const now = new Date()
  const timeRemaining = slaTarget.getTime() - now.getTime()
  
  if (timeRemaining <= 0) {
    return {
      hours: 0,
      minutes: 0,
      breached: true
    }
  }

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60))
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60))

  return {
    hours,
    minutes,
    breached: false
  }
}

/**
 * Get SLA status description
 */
export function getSLAStatus(slaTarget: Date): {
  status: 'on_track' | 'urgent' | 'breached'
  description: string
  color: string
} {
  const remaining = getSLARemaining(slaTarget)
  
  if (remaining.breached) {
    return {
      status: 'breached',
      description: 'SLA breached',
      color: 'red'
    }
  }
  
  if (remaining.hours <= 24) {
    return {
      status: 'urgent',
      description: `Due in ${remaining.hours}h ${remaining.minutes}m`,
      color: 'orange'
    }
  }
  
  return {
    status: 'on_track',
    description: `Due in ${remaining.hours}h ${remaining.minutes}m`,
    color: 'green'
  }
}

/**
 * Calculate response time in hours
 */
export function calculateResponseTime(createdAt: Date, resolvedAt: Date): number {
  const responseTimeMs = resolvedAt.getTime() - createdAt.getTime()
  return responseTimeMs / (1000 * 60 * 60) // Convert to hours
}

/**
 * Get SLA performance metrics
 */
export function getSLAPerformance(cases: Array<{ slaTarget: Date; resolvedAt?: Date; createdAt: Date }>): {
  totalCases: number
  breachedCases: number
  breachRate: number
  avgResponseTime: number
  onTimeRate: number
} {
  const totalCases = cases.length
  const breachedCases = cases.filter(c => checkSLABreach(c.slaTarget)).length
  const resolvedCases = cases.filter(c => c.resolvedAt)
  
  const breachRate = totalCases > 0 ? (breachedCases / totalCases) * 100 : 0
  
  const avgResponseTime = resolvedCases.length > 0
    ? resolvedCases.reduce((sum, c) => sum + calculateResponseTime(c.createdAt, c.resolvedAt!), 0) / resolvedCases.length
    : 0
  
  const onTimeCases = resolvedCases.filter(c => c.resolvedAt! <= c.slaTarget).length
  const onTimeRate = resolvedCases.length > 0 ? (onTimeCases / resolvedCases.length) * 100 : 0

  return {
    totalCases,
    breachedCases,
    breachRate,
    avgResponseTime,
    onTimeRate
  }
}

/**
 * Get priority multiplier for SLA calculations
 */
export function getPriorityMultiplier(priority: string): number {
  switch (priority) {
    case 'emergency':
      return 1.0
    case 'high':
      return 1.5
    case 'medium':
      return 2.0
    case 'low':
      return 3.0
    default:
      return 2.0
  }
}

/**
 * Adjust SLA based on external factors
 */
export function adjustSLA(
  baseSLA: Date,
  factors: {
    weather?: 'normal' | 'rainy' | 'stormy'
    timeOfDay?: 'business' | 'after_hours' | 'weekend'
    complexity?: 'simple' | 'moderate' | 'complex'
  }
): Date {
  let adjustedSLA = new Date(baseSLA)
  let multiplier = 1.0

  // Weather adjustments
  if (factors.weather === 'rainy') multiplier *= 1.2
  if (factors.weather === 'stormy') multiplier *= 1.5

  // Time of day adjustments
  if (factors.timeOfDay === 'after_hours') multiplier *= 1.3
  if (factors.timeOfDay === 'weekend') multiplier *= 1.5

  // Complexity adjustments
  if (factors.complexity === 'moderate') multiplier *= 1.2
  if (factors.complexity === 'complex') multiplier *= 1.5

  const adjustedTime = baseSLA.getTime() * multiplier
  adjustedSLA.setTime(adjustedTime)

  return adjustedSLA
}
