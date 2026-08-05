/**
 * Fixture subset for perceptual hash — uses sharp + image-hash (same pipeline as
 * imageDuplicate.perceptualHashFromBuffer) without loading firebase-admin.
 *
 * Assertions are fixture-labeled expectations for synthetic patterned images,
 * not claimed real-world accuracy.
 */

import * as crypto from 'crypto'
import { hammingHex, scorePair } from '../intelligence/scoring'

const sharp = require('sharp') as typeof import('sharp')

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
  } catch {
    return null
  }
}

async function drawBase(): Promise<Buffer> {
  const svg = `
    <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="480" fill="#1a5f2a"/>
      <rect x="40" y="40" width="280" height="200" fill="#c45c26"/>
      <rect x="340" y="80" width="240" height="280" fill="#2b6cb0"/>
      <circle cx="200" cy="360" r="70" fill="#e2b714"/>
      <text x="60" y="120" font-size="42" fill="#fff" font-family="sans-serif">ServeSA</text>
    </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

async function drawNegative(): Promise<Buffer> {
  const svg = `
    <svg width="640" height="480" xmlns="http://www.w3.org/2000/svg">
      <rect width="640" height="480" fill="#111827"/>
      <polygon points="320,40 600,440 40,440" fill="#7c3aed"/>
      <rect x="220" y="200" width="200" height="40" fill="#f472b6"/>
      <text x="80" y="100" font-size="36" fill="#a7f3d0" font-family="sans-serif">NEGATIVE</text>
    </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer()
}

describe('imageDuplicate phash fixtures (subset)', () => {
  it('exact copy scores as exact hash match', async () => {
    const base = await drawBase()
    const copy = Buffer.from(base)
    const phashA = await perceptualHashFromBuffer(base)
    const phashB = await perceptualHashFromBuffer(copy)
    expect(phashA).toBeTruthy()
    expect(phashB).toBe(phashA)

    const exact =
      crypto.createHash('sha256').update(base).digest('hex') ===
      crypto.createHash('sha256').update(copy).digest('hex')
    const scored = scorePair({
      exactHash: exact,
      phashA,
      phashB,
      distanceMeters: 10,
      radiusMeters: 50,
      categoryMatch: true,
      timeDiffHours: 1,
    })
    expect(exact).toBe(true)
    expect(scored.score).toBeGreaterThanOrEqual(0.75)
    expect(scored.reasons).toContain('exact_image_hash')
  }, 30_000)

  it('resized variant stays perceptually close', async () => {
    const base = await drawBase()
    const resized = await sharp(base).resize(320, 240).jpeg({ quality: 90 }).toBuffer()
    const phashA = await perceptualHashFromBuffer(base)
    const phashB = await perceptualHashFromBuffer(resized)
    expect(phashA && phashB).toBeTruthy()
    const dist = hammingHex(phashA!, phashB!)
    // Fixture threshold for patterned synthetic image (not real-world claim)
    expect(dist).toBeLessThanOrEqual(16)

    const scored = scorePair({
      exactHash: false,
      phashA,
      phashB,
      distanceMeters: 10,
      radiusMeters: 50,
      categoryMatch: true,
      timeDiffHours: 1,
    })
    expect(scored.breakdown.visual).toBeGreaterThanOrEqual(0.3)
  }, 30_000)

  it('unrelated negative image differs from base', async () => {
    const base = await drawBase()
    const neg = await drawNegative()
    const phashBase = await perceptualHashFromBuffer(base)
    const phashNeg = await perceptualHashFromBuffer(neg)
    expect(phashBase && phashNeg).toBeTruthy()
    const dNeg = hammingHex(phashBase!, phashNeg!)
    // Distinct patterns should not be exact phash equals
    expect(dNeg).toBeGreaterThan(0)
    expect(phashBase).not.toBe(phashNeg)
  }, 30_000)
})
