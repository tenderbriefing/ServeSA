/**
 * Landing architecture smoke checks — storytelling components and SEO copy.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')
const pagePath = path.join(webRoot, 'src/app/page.tsx')
const layoutPath = path.join(webRoot, 'src/app/layout.tsx')
const landingDir = path.join(webRoot, 'src/components/landing')

const page = fs.readFileSync(pagePath, 'utf8')
const layout = fs.readFileSync(layoutPath, 'utf8')

test('homepage composes cinematic landing sections', () => {
  for (const name of [
    'LandingHero',
    'CaseJourney',
    'CitizenReportDemo',
    'MunicipalityWorkflow',
    'MunicipalUpdatesPreview',
    'MunicipalityPlanningPreview',
    'CommunityIdeasPreview',
    'CivicImpactMap',
    'TrustPrinciples',
    'NationalVision',
    'FinalCTA',
  ]) {
    assert.match(page, new RegExp(name))
  }
})

test('landing components exist as modular files', () => {
  const required = [
    'LandingHero.tsx',
    'HeroProductFilm.tsx',
    'CaseJourney.tsx',
    'CitizenReportDemo.tsx',
    'MunicipalityWorkflow.tsx',
    'DeviceFrame.tsx',
    'AnimatedCaseStatus.tsx',
    'motion/MotionReveal.tsx',
  ]
  for (const file of required) {
    assert.ok(
      fs.existsSync(path.join(landingDir, file)),
      `missing ${file}`
    )
  }
})

test('root metadata positions Serve SA as civic connection', () => {
  assert.match(layout, /Citizens and Municipalities, Connected/)
  assert.match(layout, /Report municipal service-delivery issues/)
})

test('landing CTAs preserve citizen routes', () => {
  const hero = fs.readFileSync(
    path.join(landingDir, 'LandingHero.tsx'),
    'utf8'
  )
  assert.match(hero, /href="\/report"/)
  assert.match(hero, /Track a Case|trackHref/)
  assert.match(hero, /#how-it-works/)
})
