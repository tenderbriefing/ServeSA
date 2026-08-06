/**
 * Static certification assertions for language selector / US flag absence.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === 'node_modules' ||
      entry.name === '.next' ||
      entry.name === 'out' ||
      entry.name === 'coverage'
    ) {
      continue
    }
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (/\.(tsx?|jsx?|css|json|md)$/.test(entry.name)) files.push(full)
  }
  return files
}

const files = walk(path.join(webRoot, 'src'))

test('no LanguageSwitcher component files remain', () => {
  const offenders = files.filter((file) =>
    /LanguageSwitcher/i.test(path.basename(file))
  )
  assert.deepEqual(offenders, [])
})

test('no US flag emoji in source', () => {
  const offenders = []
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    if (text.includes('🇺🇸')) offenders.push(path.relative(webRoot, file))
  }
  assert.deepEqual(offenders, [])
})

test('no react-i18next / i18next imports in source', () => {
  const offenders = []
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8')
    if (
      /from ['"]react-i18next['"]/.test(text) ||
      /from ['"]i18next['"]/.test(text) ||
      /from ['"]next-i18next['"]/.test(text) ||
      /@\/i18n\//.test(text)
    ) {
      offenders.push(path.relative(webRoot, file))
    }
  }
  assert.deepEqual(offenders, [])
})

test('citizen navigation labels are present in Header', () => {
  const header = fs.readFileSync(
    path.join(webRoot, 'src/components/layout/Header.tsx'),
    'utf8'
  )
  assert.match(header, /Report an Issue/)
  assert.match(header, /My Cases/)
  assert.match(header, /Track a Case/)
  assert.doesNotMatch(header, /LanguageSwitcher/)
  assert.doesNotMatch(header, /GIS|georesolution/i)
})
