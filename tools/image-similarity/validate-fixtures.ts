#!/usr/bin/env ts-node
/**
 * Validate synthetic fixtures against production scoring + phash algorithm.
 *
 * Imports pure scorePair / hammingHex from apps/functions scoring.ts.
 * Mirrors perceptualHashFromBuffer from imageDuplicate.ts (same sharp + image-hash
 * pipeline) because imageDuplicate.ts initialises firebase-admin at module load.
 *
 * Outputs fixture-labeled precision/recall — NOT claimed real-world accuracy.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'
import {
  scorePair,
  hammingHex,
  confidenceBand,
} from '../../apps/functions/src/intelligence/scoring'

const sharp = require('sharp') as typeof import('sharp')

const FIXTURE_DIR = path.join(__dirname, 'fixtures')
const OUT_PATH = path.resolve(
  process.cwd().endsWith('image-similarity')
    ? path.join(process.cwd(), '../../docs/reports/evidence/image_similarity_fixture_results.json')
    : path.join(process.cwd(), 'docs/reports/evidence/image_similarity_fixture_results.json')
)

type ExpectedLabel =
  | 'match'
  | 'similar'
  | 'similar-or-partial'
  | 'non-match'
  | 'known-limitation'

type ObservedLabel = 'match' | 'similar' | 'partial' | 'non-match'

/**
 * Mirrors apps/functions/src/intelligence/imageDuplicate.ts perceptualHashFromBuffer
 */
async function perceptualHashFromBuffer(buf: Buffer): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { imageHash } = require('image-hash')
    const normalised = await sharp(buf)
      .rotate()
      .resize(256, 256, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer()
    const hash: string = await new Promise((resolve, reject) => {
      imageHash(
        { ext: 'image/jpeg', data: normalised },
        16,
        true,
        (err: Error | null, data: string) => {
          if (err) reject(err)
          else resolve(data)
        }
      )
    })
    return hash
  } catch (e) {
    console.warn('perceptual hash failed', e)
    return null
  }
}

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex')
}

function observeLabel(opts: {
  exactHash: boolean
  hamming: number | null
  visual: number
  score: number
}): ObservedLabel {
  if (opts.exactHash) return 'match'
  if (opts.visual >= 0.85 || (opts.hamming != null && opts.hamming <= 4)) return 'similar'
  if (opts.visual >= 0.55 || (opts.hamming != null && opts.hamming <= 12)) return 'partial'
  return 'non-match'
}

function expectedAccepts(expected: ExpectedLabel, observed: ObservedLabel): boolean {
  switch (expected) {
    case 'match':
      return observed === 'match' || observed === 'similar'
    case 'similar':
      return observed === 'similar' || observed === 'match' || observed === 'partial'
    case 'similar-or-partial':
      return observed === 'similar' || observed === 'partial' || observed === 'match'
    case 'non-match':
      return observed === 'non-match'
    case 'known-limitation':
      // Recorded for evidence; does not count toward precision/recall
      return true
    default:
      return false
  }
}

async function main() {
  const manifestPath = path.join(FIXTURE_DIR, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    console.error('Fixtures missing — run generate-fixtures.ts first')
    process.exit(1)
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
    base: string
    variants: Array<{ file: string; expectedLabel: ExpectedLabel; notes: string }>
  }

  const baseBuf = fs.readFileSync(path.join(FIXTURE_DIR, manifest.base))
  const baseHash = await perceptualHashFromBuffer(baseBuf)
  const baseSha = sha256(baseBuf)

  const pairs = []
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0

  for (const v of manifest.variants) {
    const buf = fs.readFileSync(path.join(FIXTURE_DIR, v.file))
    const phash = await perceptualHashFromBuffer(buf)
    const exact = sha256(buf) === baseSha
    const ham = baseHash && phash ? hammingHex(baseHash, phash) : null
    const scored = scorePair({
      exactHash: exact,
      phashA: baseHash,
      phashB: phash,
      distanceMeters: 15,
      radiusMeters: 50,
      categoryMatch: true,
      timeDiffHours: 2,
    })
    const observed = observeLabel({
      exactHash: exact,
      hamming: ham,
      visual: scored.breakdown.visual,
      score: scored.score,
    })
    const ok = expectedAccepts(v.expectedLabel, observed)
    const counted = v.expectedLabel !== 'known-limitation'
    if (counted) {
      const isPositiveExpected = v.expectedLabel !== 'non-match'
      if (isPositiveExpected && ok) tp++
      else if (isPositiveExpected && !ok) fn++
      else if (!isPositiveExpected && ok) tn++
      else fp++
    }

    pairs.push({
      file: v.file,
      expectedLabel: v.expectedLabel,
      observedLabel: observed,
      pass: ok,
      countedTowardMetrics: counted,
      notes: v.notes,
      exactHash: exact,
      hammingDistance: ham,
      phashBase: baseHash,
      phashVariant: phash,
      score: scored.score,
      confidence: confidenceBand(scored.score),
      visual: scored.breakdown.visual,
      reasons: scored.reasons,
    })
  }

  // Distant-similar rejection: exact hash at far GPS must not present as high-confidence same-incident
  const distant = scorePair({
    exactHash: true,
    phashA: baseHash,
    phashB: baseHash,
    distanceMeters: 5000,
    radiusMeters: 50,
    categoryMatch: true,
    timeDiffHours: 2,
  })
  const distantReject =
    distant.reasons.includes('exact_hash_distant_anomaly') && distant.score <= 0.49

  const precision = tp + fp === 0 ? null : tp / (tp + fp)
  const recall = tp + fn === 0 ? null : tp / (tp + fn)

  const report = {
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Fixture-labeled precision/recall only. NOT claimed real-world accuracy. No face recognition. No auto-merge.',
    expectedLabels: {
      exact: 'match',
      resized: 'similar',
      rotated_mild: 'known-limitation',
      rotated90: 'known-limitation',
      recompressed: 'similar',
      cropped: 'known-limitation',
      different_angle: 'known-limitation',
      negative: 'non-match',
    },
    algorithm: {
      phash: 'mirrors imageDuplicate.perceptualHashFromBuffer (sharp rotate+256 + image-hash bit 16)',
      scoring: 'apps/functions/src/intelligence/scoring.ts scorePair',
      scoringPolicyVersion: '1.0.0',
    },
    counts: { tp, fp, fn, tn },
    precision,
    recall,
    distantSimilarRejection: {
      pass: distantReject,
      score: distant.score,
      confidence: confidenceBand(distant.score),
      reasons: distant.reasons,
      note: 'Exact hash at 5km must be capped ≤0.49 (exact_hash_distant_anomaly)',
    },
    pairs,
  }

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })
  fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2))
  console.log(`Wrote ${OUT_PATH}`)
  console.log(
    `precision=${precision?.toFixed(3) ?? 'n/a'} recall=${recall?.toFixed(3) ?? 'n/a'} pairs=${pairs.length} distantReject=${distantReject}`
  )
  const failed = pairs.filter((p) => !p.pass)
  if (failed.length) {
    console.warn(
      'Label mismatches (informational for fixture tuning):',
      failed.map((f) => `${f.file}:${f.expectedLabel}->${f.observedLabel}`).join(', ')
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
