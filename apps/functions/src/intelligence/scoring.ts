/**
 * Pure multi-signal duplicate scoring — no I/O.
 */

export const SCORING_POLICY_VERSION = '1.0.0'

export const CATEGORY_RADIUS_M: Record<string, number> = {
  roads: 50,
  water: 100,
  electricity: 80,
  waste: 150,
  internet: 100,
  emergency: 200,
}

export type ConfidenceBand = 'none' | 'low' | 'medium' | 'high'

export interface ScoreBreakdown {
  visual: number
  gps: number
  category: number
  time: number
  exactHash: boolean
  distanceMeters: number | null
  timeDiffHours: number | null
}

export interface DuplicateCandidateShape {
  caseId: string
  mediaId: string
  score: number
  confidence: ConfidenceBand
  breakdown: ScoreBreakdown
  reasons: string[]
}

export function confidenceBand(score: number): ConfidenceBand {
  if (score >= 0.75) return 'high'
  if (score >= 0.5) return 'medium'
  if (score >= 0.35) return 'low'
  return 'none'
}

export function hammingHex(a: string, b: string): number {
  if (!a || !b || a.length !== b.length) return 64
  let dist = 0
  for (let i = 0; i < a.length; i++) {
    const x = parseInt(a[i], 16) ^ parseInt(b[i], 16)
    dist += x.toString(2).replace(/0/g, '').length
  }
  return dist
}

export function scorePair(input: {
  exactHash: boolean
  phashA: string | null
  phashB: string | null
  distanceMeters: number | null
  radiusMeters: number
  categoryMatch: boolean
  timeDiffHours: number | null
}): { score: number; breakdown: ScoreBreakdown; reasons: string[] } {
  const reasons: string[] = []
  let visual = 0
  if (input.exactHash) {
    visual = 1
    reasons.push('exact_image_hash')
  } else if (input.phashA && input.phashB) {
    const dist = hammingHex(input.phashA, input.phashB)
    visual = Math.max(0, 1 - dist / 24)
    if (visual >= 0.7) reasons.push('perceptual_similarity')
  }

  let gps = 0
  if (input.distanceMeters != null && input.distanceMeters <= input.radiusMeters * 3) {
    gps = Math.max(0, 1 - input.distanceMeters / (input.radiusMeters * 2))
    if (input.distanceMeters <= input.radiusMeters) reasons.push('within_category_radius')
  }

  const category = input.categoryMatch ? 1 : 0
  if (input.categoryMatch) reasons.push('category_match')

  let time = 0
  if (input.timeDiffHours != null && input.timeDiffHours <= 168) {
    time = Math.max(0, 1 - input.timeDiffHours / 168)
    if (input.timeDiffHours <= 72) reasons.push('recent_time_window')
  }

  let score = visual * 0.55 + gps * 0.25 + category * 0.12 + time * 0.08

  if (
    visual >= 0.7 &&
    (input.distanceMeters == null || input.distanceMeters > input.radiusMeters * 4)
  ) {
    score *= 0.35
    reasons.push('distant_visual_suppressed')
  }

  if (
    input.exactHash &&
    input.distanceMeters != null &&
    input.distanceMeters > input.radiusMeters * 5
  ) {
    reasons.push('exact_hash_distant_anomaly')
    // Cap so distant reuse cannot present as high-confidence same-incident
    score = Math.min(score, 0.49)
  }

  return {
    score: Math.min(1, Math.round(score * 1000) / 1000),
    breakdown: {
      visual: Math.round(visual * 1000) / 1000,
      gps: Math.round(gps * 1000) / 1000,
      category,
      time: Math.round(time * 1000) / 1000,
      exactHash: input.exactHash,
      distanceMeters: input.distanceMeters,
      timeDiffHours: input.timeDiffHours,
    },
    reasons,
  }
}
