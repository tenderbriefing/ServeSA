/**
 * Production-readiness checks for auth-gated municipality finalisation.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')

const read = (rel) => fs.readFileSync(path.join(webRoot, rel), 'utf8')

test('AuthProvider exposes refreshProfile and claimsMunicipalityCode', () => {
  const auth = read('src/components/providers/AuthProvider.tsx')
  assert.match(auth, /refreshProfile/)
  assert.match(auth, /claimsMunicipalityCode/)
  assert.doesNotMatch(
    auth,
    /municipalityCode:\s*\n\s*municipalityCode \|\|\s*\n\s*\(userProfile as any\)/
  )
})

test('useCitizenMunicipality uses claimsMunicipalityCode not merged convenience field', () => {
  const hook = read('src/hooks/useCitizenMunicipality.ts')
  assert.match(hook, /claimsMunicipalityCode/)
  assert.match(hook, /refreshProfile/)
})

test('ConfirmMunicipalityPanel refreshes profile after save', () => {
  const panel = read('src/components/municipality/ConfirmMunicipalityPanel.tsx')
  assert.match(panel, /refreshProfile\(\)/)
  assert.match(panel, /MunicipalitySelectFields/)
})

test('account page provides municipality change with confirmation', () => {
  const account = read('src/app/account/page.tsx')
  assert.match(account, /AuthGate/)
  assert.match(account, /Change municipality|Confirm municipality/)
  assert.match(account, /Confirm and save/)
  assert.match(account, /never grants municipal staff/)
  assert.match(account, /refreshProfile/)
})

test('signup persists province with municipalityCode', () => {
  const signup = read('src/components/Auth/SignupForm.tsx')
  const authLib = read('src/lib/auth.ts')
  assert.match(signup, /province:\s*formData\.province/)
  assert.match(authLib, /province\?: string/)
  assert.match(authLib, /userData\.province/)
})

test('municipality page has no local savedCode override', () => {
  const page = read('src/app/municipality/page.tsx')
  assert.doesNotMatch(page, /savedCode/)
  assert.match(page, /MunicipalityCompleteness/)
  assert.match(page, /Change municipality/)
})

test('landing demo cases are labelled DEMO not live JHB fallbacks', () => {
  const film = read('src/components/landing/HeroProductFilm.tsx')
  const updates = read('src/components/landing/MunicipalUpdatesPreview.tsx')
  assert.match(film, /CASE-DEMO-28471/)
  assert.doesNotMatch(film, /CASE-JHB-28471/)
  assert.match(updates, /Sample illustration only|Example demo/)
  assert.doesNotMatch(updates, /Johannesburg Water/)
})

test('citizen municipality write paths never set roles or staff claims', () => {
  const panel = read('src/components/municipality/ConfirmMunicipalityPanel.tsx')
  const account = read('src/app/account/page.tsx')
  for (const src of [panel, account]) {
    assert.match(src, /municipalityCode/)
    assert.doesNotMatch(src, /roles:\s*\[/)
    assert.doesNotMatch(src, /claims\.roles|setCustomUserClaims/)
  }
})
