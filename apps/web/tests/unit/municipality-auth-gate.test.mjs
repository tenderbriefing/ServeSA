/**
 * Landing must stay municipality-neutral for anonymous visitors.
 * My Municipality is auth-gated with no JHB pilot fallback.
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

test('homepage does not render My Municipality / planning preview', () => {
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

test('FinalCTA only links My Municipality when signed in', () => {
  assert.match(finalCta, /signedIn && FEATURE_FLAGS\.enableMunicipalPlanning/)
  assert.doesNotMatch(finalCta, /Explore Your Municipality/)
  assert.match(finalCta, /My Municipality/)
})

test('Header My Municipality requires authenticated user', () => {
  assert.match(header, /Boolean\(user\) && FEATURE_FLAGS\.enableMunicipalPlanning/)
  assert.match(header, /label:\s*'My Municipality'/)
})

test('municipality page requires AuthGate and has no JHB default', () => {
  assert.match(municipalityPage, /AuthGate/)
  assert.match(municipalityPage, /ConfirmMunicipalityPanel/)
  assert.match(municipalityPage, /My Municipality/)
  assert.match(municipalityPage, /Municipality Snapshot/)
  assert.doesNotMatch(municipalityPage, /Your community/)
  assert.doesNotMatch(municipalityPage, /getSummary\(\{\s*municipalityCode\s*,\s*ward/)
  assert.doesNotMatch(municipalityPage, /DEFAULT_MUNI/)
  assert.doesNotMatch(municipalityPage, /['"]JHB['"]/)
  assert.doesNotMatch(municipalityPage, /pilot area/i)
  assert.doesNotMatch(municipalityPage, /savedCode/)
})

test('constants default My Municipality allow-list to Gauteng', () => {
  const constants = fs.readFileSync(
    path.join(webRoot, 'src/lib/constants.ts'),
    'utf8'
  )
  assert.match(constants, /GAUTENG_MUNICIPALITY_CODES/)
  assert.match(constants, /'JHB'/)
  assert.match(constants, /'TSH'/)
  assert.match(constants, /'EKU'/)
  assert.match(constants, /GAUTENG_MUNICIPALITY_CODES\.join/)
  assert.doesNotMatch(
    constants,
    /MUNICIPAL_PLANNING_ALLOWLIST[\s\S]{0,120}\|\|\s*'\*'/
  )
})

test('planning empty copy no longer promises pilot-area substitute', () => {
  assert.match(emptyCopy, /resolutionUnavailable/)
  assert.match(emptyCopy, /municipalitySnapshotComingSoon/)
  assert.doesNotMatch(emptyCopy, /pilot area/i)
})
