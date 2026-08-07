import { readFileSync, writeFileSync } from 'fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'

function loadTokens() {
  const text = readFileSync('docs/reports/evidence/uat_tokens.env', 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^(?:export\s+)?([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}
function decode(token) {
  const raw = token.trim()
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return JSON.parse(Buffer.from(padded + pad, 'base64').toString('utf8'))
}

const tokens = loadTokens()
const official = decode(tokens.PILOT_UAT_OFFICIAL_TOKEN)
const caseId = 'CASE-MSIU81J7-KXEZ5R'
const app = initializeApp({
  apiKey: 'AIzaSyAJJmVgVCe8k5YmqjE7QKThOSs7tK_Dfac',
  authDomain: 'servesa-aad53.firebaseapp.com',
  projectId: 'servesa-aad53',
  storageBucket: 'servesa-aad53.firebasestorage.app',
  appId: '1:171401876896:web:29728c192852cc75a400c5',
})
const auth = getAuth(app)
const fn = getFunctions(app, 'africa-south1')
await signInWithEmailAndPassword(auth, official.email, official.password)
const assign = httpsCallable(fn, 'assignCaseFunction')
const update = httpsCallable(fn, 'updateCaseStatusFunction')
const timeline = httpsCallable(fn, 'getCitizenTimelineFunction')
const evidence = { caseId, steps: [] }

// list departments via upsert? try common dept id roads
for (const departmentId of ['roads', 'water', 'water-sanitation', 'jhb-water', 'water_sewage']) {
  try {
    const r = await assign({ caseId, departmentId })
    evidence.steps.push({ step: 'assign', ok: true, departmentId, data: r.data })
    console.log('PASS|assign', departmentId, JSON.stringify(r.data))
    break
  } catch (e) {
    evidence.steps.push({ step: 'assign', ok: false, departmentId, error: String(e.message||e).slice(0,180) })
    console.log('TRY|assign', departmentId, String(e.message||e).slice(0,120))
  }
}

try {
  const r = await update({ caseId, status: 'in_progress', comment: 'Enterprise cert field work started' })
  evidence.steps.push({ step: 'in_progress', ok: true, data: r.data })
  console.log('PASS|in_progress', JSON.stringify(r.data))
} catch (e) {
  evidence.steps.push({ step: 'in_progress', ok: false, error: String(e.message||e).slice(0,200) })
  console.log('FAIL|in_progress', String(e.message||e).slice(0,200))
}

// invalid skip transition from in_progress to submitted should fail
try {
  await update({ caseId, status: 'submitted', comment: 'illegal' })
  evidence.steps.push({ step: 'reject_illegal_back', ok: false })
  console.log('FAIL|reject_illegal_back accepted')
} catch (e) {
  evidence.steps.push({ step: 'reject_illegal_back', ok: true, error: String(e.message||e).slice(0,180) })
  console.log('PASS|reject_illegal_back', String(e.message||e).slice(0,120))
}

const tl = (await timeline({ caseId })).data
evidence.timelineStatus = tl.status
evidence.milestones = (tl.milestones||[]).map(m=>m.type)
evidence.publicUpdates = (tl.publicUpdates||[]).length
console.log('TIMELINE', tl.status, evidence.milestones, 'publicUpdates', evidence.publicUpdates)
writeFileSync('docs/reports/evidence/enterprise_lifecycle_followup.json', JSON.stringify(evidence, null, 2))
