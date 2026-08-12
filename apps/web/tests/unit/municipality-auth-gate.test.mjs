/**
 * Landing must stay municipality-neutral for anonymous visitors.
 * Our Municipality is auth-gated with no JHB pilot fallback.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')

const page = fs.readFileSync(path.join(webRoot, 'src/app/page.tsx'), 'utf8')
const finalCta = fs.readFileSync(
  path.join(webRoot, 'src/components/landing/FinalCTA.tsx'),
  'utf8'
)
const header = fs.readFileSync(
  path.join(webRoot, 'src/components/layout/Header.tsx'),
  'utf8'
)
const municipalityPage = fs.readFileSync(
  path.join(webRoot, 'src/app/municipality/page.tsx'),
  'utf8'
)
const emptyCopy = fs.readFileSync(
  path.resolve(
    webRoot,
    '../../packages/case-contract/src/municipalPlanning.ts'
  ),
  'utf8'
)

test('homepage does not render Our Municipality / planning preview', () => {
  assert.doesNotMatch(page, /MunicipalityPlanningPreview/)
  assert.doesNotMatch(page, /Explore Your Municipality/)
  assert.doesNotMatch(page, /\bJHB\b/)
  assert.ok(
    !fs.existsSync(
      path.join(
        webRoot,
        'src/components/landing/MunicipalityPlanningPreview.tsx'
      )
    )
  )
})

test('FinalCTA only links Our Municipality when signed in', () => {
  assert.match(finalCta, /signedIn && FEATURE_FLAGS\.enableMunicipalPlanning/)
  assert.doesNotMatch(finalCta, /Explore Your Municipality/)
})

test('Header Our Municipality requires authenticated user', () => {
  assert.match(header, /Boolean\(user\) && FEATURE_FLAGS\.enableMunicipalPlanning/)
  assert.match(header, /label:\s*'Our Municipality'/)
})

test('municipality page requires AuthGate and has no JHB default', () => {
  assert.match(municipalityPage, /AuthGate/)
  assert.match(municipalityPage, /ConfirmMunicipalityPanel/)
  assert.doesNotMatch(municipalityPage, /DEFAULT_MUNI/)
  assert.doesNotMatch(municipalityPage, /['"]JHB['"]/)
  assert.doesNotMatch(municipalityPage, /pilot area/i)
  assert.doesNotMatch(municipalityPage, /savedCode/)
})

test('planning empty copy no longer promises pilot-area substitute', () => {
  assert.match(emptyCopy, /resolutionUnavailable/)
  assert.doesNotMatch(emptyCopy, /pilot area/i)
  assert.doesNotMatch(emptyCopy, /Showing published planning for the pilot/i)
})
