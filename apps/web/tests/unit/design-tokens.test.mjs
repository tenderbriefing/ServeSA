/**
 * Assert SA civic design anchors and brand copy remain the token source of truth.
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '../..')
const tokensPath = path.join(webRoot, 'src/lib/design-tokens.ts')
const globalsPath = path.join(webRoot, 'src/app/globals.css')
const headerPath = path.join(webRoot, 'src/components/layout/Header.tsx')

const tokens = fs.readFileSync(tokensPath, 'utf8')
const globals = fs.readFileSync(globalsPath, 'utf8')
const header = fs.readFileSync(headerPath, 'utf8')

test('design-tokens anchors match SA civic palette', () => {
  assert.match(tokens, /#002395/)
  assert.match(tokens, /#007A4D/)
  assert.match(tokens, /#FFB81C/)
  assert.match(tokens, /#DE3831/)
  assert.match(tokens, /#1F2933/)
  assert.match(tokens, /#FAF8F3/)
})

test('brandCopy carries mandated Serve SA identity lines', () => {
  assert.match(tokens, /Building Better Communities Together/)
  assert.match(tokens, /Built for South Africa\. Built for every community\./)
  assert.match(tokens, /name:\s*'Serve SA'/)
})

test('globals.css defines the same SA anchors as RGB channels', () => {
  assert.match(globals, /--blue-600:\s*0\s+35\s+149/)
  assert.match(globals, /--green-600:\s*0\s+122\s+77/)
  assert.match(globals, /--gold-500:\s*255\s+184\s+28/)
  assert.match(globals, /--red-500:\s*222\s+56\s+49/)
  assert.match(globals, /--neutral-900:\s*31\s+41\s+51/)
  assert.match(globals, /--neutral-50:\s*250\s+248\s+243/)
})

test('citizen primary nav is Report / Track / My Cases / Help', () => {
  assert.match(header, /label:\s*'Report'/)
  assert.match(header, /label:\s*'Track'/)
  assert.match(header, /label:\s*'My Cases'/)
  assert.match(header, /label:\s*'Help'/)
  assert.doesNotMatch(header, /Explore|Community|Messaging|Budget/)
})
