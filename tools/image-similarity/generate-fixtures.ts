#!/usr/bin/env ts-node
/**
 * Generate synthetic JPEG fixtures for perceptual-hash / scorePair validation.
 * Does not touch Firebase Storage or production.
 *
 * Transforms are intentionally mild where 90° geometric rotation is a known
 * phash limitation (documented separately as rotated90).
 */

import * as fs from 'fs'
import * as path from 'path'

const sharp = require('sharp') as typeof import('sharp')

const FIXTURE_DIR = path.join(__dirname, 'fixtures')

async function drawBase(): Promise<Buffer> {
  // Large, high-contrast blocks with a unique central motif — more stable under
  // mild resize/recompress than thin text alone.
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f3d2e"/>
          <stop offset="100%" stop-color="#1a5f2a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <rect x="40" y="40" width="320" height="220" fill="#c45c26"/>
      <rect x="420" y="80" width="300" height="320" fill="#2b6cb0"/>
      <circle cx="240" cy="420" r="90" fill="#e2b714"/>
      <rect x="480" y="430" width="220" height="100" fill="#f97316"/>
      <polygon points="120,500 200,320 280,500" fill="#22d3ee"/>
      <text x="60" y="120" font-size="48" fill="#fff" font-family="sans-serif">ServeSA</text>
      <text x="60" y="175" font-size="28" fill="#e8f5e9" font-family="sans-serif">phash fixture</text>
    </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer()
}

async function drawNegative(): Promise<Buffer> {
  const svg = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="#111827"/>
      <polygon points="400,40 760,560 40,560" fill="#7c3aed"/>
      <rect x="280" y="260" width="240" height="50" fill="#f472b6"/>
      <circle cx="600" cy="160" r="80" fill="#10b981"/>
      <text x="80" y="100" font-size="40" fill="#a7f3d0" font-family="sans-serif">NEGATIVE</text>
    </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toBuffer()
}

/** Mild "different angle" via affine shear (not face recognition). */
async function differentAngle(base: Buffer): Promise<Buffer> {
  // Approximate a small viewpoint shift with resize + slight rotation
  return sharp(base)
    .rotate(8, { background: '#0f3d2e' })
    .resize(760, 560, { fit: 'cover' })
    .jpeg({ quality: 88 })
    .toBuffer()
}

async function main() {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true })
  const base = await drawBase()
  const files: Record<string, Buffer> = {
    'base.jpg': base,
    'exact.jpg': Buffer.from(base),
    'resized.jpg': await sharp(base).resize(400, 300).jpeg({ quality: 90 }).toBuffer(),
    'rotated_mild.jpg': await sharp(base)
      .rotate(5, { background: '#0f3d2e' })
      .jpeg({ quality: 90 })
      .toBuffer(),
    'rotated90.jpg': await sharp(base).rotate(90).jpeg({ quality: 90 }).toBuffer(),
    'recompressed.jpg': await sharp(base).jpeg({ quality: 55 }).toBuffer(),
    'cropped.jpg': await sharp(base)
      .extract({ left: 40, top: 30, width: 720, height: 540 })
      .jpeg({ quality: 90 })
      .toBuffer(),
    'different_angle.jpg': await differentAngle(base),
    'negative.jpg': await drawNegative(),
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    base: 'base.jpg',
    variants: [
      { file: 'exact.jpg', expectedLabel: 'match', notes: 'byte-identical copy of base' },
      { file: 'resized.jpg', expectedLabel: 'similar', notes: 'half resolution' },
      {
        file: 'rotated_mild.jpg',
        expectedLabel: 'known-limitation',
        notes:
          '5° rotation — current block-hash phash is rotation-sensitive; exact+resize+recompress remain primary',
      },
      {
        file: 'rotated90.jpg',
        expectedLabel: 'known-limitation',
        notes:
          '90° geometric rotation — known phash limitation (auto-orient only handles EXIF)',
      },
      { file: 'recompressed.jpg', expectedLabel: 'similar', notes: 'JPEG quality 55' },
      {
        file: 'cropped.jpg',
        expectedLabel: 'known-limitation',
        notes:
          'edge crop — current phash is crop-sensitive; officials still review recommendations manually',
      },
      {
        file: 'different_angle.jpg',
        expectedLabel: 'known-limitation',
        notes:
          '8° rotate + cover crop — viewpoint shifts not in production hash-primary policy; embeddings deferred',
      },
      { file: 'negative.jpg', expectedLabel: 'non-match', notes: 'unrelated synthetic image' },
    ],
  }

  for (const [name, buf] of Object.entries(files)) {
    fs.writeFileSync(path.join(FIXTURE_DIR, name), buf)
  }
  fs.writeFileSync(
    path.join(FIXTURE_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )
  console.log(`Wrote ${Object.keys(files).length} fixtures → ${FIXTURE_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
