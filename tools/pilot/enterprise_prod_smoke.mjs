/**
 * Enterprise production smoke — evidence only. Synthetic UAT identity. No secrets logged.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { createHash, randomUUID } from 'crypto'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore'

const API_KEY = 'AIzaSyAJJmVgVCe8k5YmqjE7QKThOSs7tK_Dfac'
const PROJECT = 'servesa-aad53'
const REGION = 'africa-south1'

function decodeUatPayload(token) {
  const raw = token.trim()
  if (raw.split('.').length === 3) return null
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return JSON.parse(Buffer.from(padded + pad, 'base64').toString('utf8'))
}

function loadTokens() {
  const envPath = new URL('./docs/reports/evidence/uat_tokens.env', import.meta.url)
  // path relative to cwd
  const text = readFileSync('docs/reports/evidence/uat_tokens.env', 'utf8')
  const out = {}
  for (const line of text.split('\n')) {
    const m = line.match(/^export\s+([A-Z0-9_]+)=(.*)$/) || line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    out[m[1]] = v
  }
  return out
}

const JPEG_MIN = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z',
  'base64'
)

const evidence = {
  captured_utc: new Date().toISOString(),
  project: PROJECT,
  checks: {},
  cases: {},
  errors: [],
}

function record(name, ok, detail) {
  evidence.checks[name] = { ok, ...detail }
  console.log(`${ok ? 'PASS' : 'FAIL'}|${name}|${JSON.stringify(detail)}`)
}

async function main() {
  const tokens = loadTokens()
  const citizenTok = tokens.PILOT_UAT_CITIZEN_TOKEN
  const officialTok = tokens.PILOT_UAT_OFFICIAL_TOKEN
  const fieldTok = tokens.PILOT_UAT_FIELD_TOKEN
  if (!citizenTok || !officialTok) {
    throw new Error('UAT tokens missing')
  }
  const citizenCreds = decodeUatPayload(citizenTok)
  const officialCreds = decodeUatPayload(officialTok)
  const fieldCreds = fieldTok ? decodeUatPayload(fieldTok) : null

  const app = initializeApp({
    apiKey: API_KEY,
    authDomain: `${PROJECT}.firebaseapp.com`,
    projectId: PROJECT,
    storageBucket: `${PROJECT}.firebasestorage.app`,
    appId: '1:171401876896:web:29728c192852cc75a400c5',
  })
  const auth = getAuth(app)
  const functions = getFunctions(app, REGION)
  const db = getFirestore(app)

  // Sign in citizen
  const cit = await signInWithEmailAndPassword(auth, citizenCreds.email, citizenCreds.password)
  record('auth_citizen', true, { uid: cit.user.uid, email: citizenCreds.email })

  const createCaseFn = httpsCallable(functions, 'createCaseFunction')
  const georesolveFn = httpsCallable(functions, 'georesolveFunction')
  const uploadMediaFn = httpsCallable(functions, 'uploadMediaFunction')
  const timelineFn = httpsCallable(functions, 'getCitizenTimelineFunction')

  // GIS unique
  try {
    const geoU = await georesolveFn({ latitude: -26.2041, longitude: 28.0473 })
    const g = geoU.data
    record('gis_unique_jhb', g.status === 'polygon_match' && g.wardId === '79800060' && g.municipalityId === 'JHB' && g.datasetVersion === 'mdb-wards-2020-v1', {
      status: g.status, wardId: g.wardId, municipalityId: g.municipalityId, datasetVersion: g.datasetVersion, method: g.method, candidateCount: g.candidateCount
    })
  } catch (e) {
    record('gis_unique_jhb', false, { error: String(e.message || e) })
  }

  // GIS unresolved ocean
  try {
    const geoO = await georesolveFn({ latitude: -30.0, longitude: 15.0 })
    const g = geoO.data
    record('gis_unresolved_ocean', g.status === 'unresolved' || g.candidateCount === 0, {
      status: g.status, candidateCount: g.candidateCount, failureReason: g.failureReason, method: g.method
    })
  } catch (e) {
    record('gis_unresolved_ocean', false, { error: String(e.message || e) })
  }

  const clientRequestId = randomUUID()
  const payload = {
    title: 'Enterprise cert — water leak (synthetic UAT)',
    description: 'Production certification smoke. Synthetic UAT citizen. Continuous water leak near curb for routing verification.',
    category: 'water-sewage',
    priority: 'medium',
    latitude: -26.2041,
    longitude: 28.0473,
    locationSource: 'map_pin',
    address: 'JHB CBD certification pin',
    reporter: { name: 'UAT Citizen Pilot', email: citizenCreds.email },
    consent: { dataProcessing: true },
    clientRequestId,
  }

  // Reject default coords (0,0) — client contract; also probe server
  try {
    await createCaseFn({ ...payload, clientRequestId: randomUUID(), latitude: 0, longitude: 0 })
    record('reject_default_coords', false, { note: 'server accepted 0,0' })
  } catch (e) {
    record('reject_default_coords', true, { error: String(e.code || e.message || e).slice(0, 200) })
  }

  // Create case
  let created
  try {
    const res = await createCaseFn(payload)
    created = res.data
    evidence.cases.primary = created
    record('create_case', Boolean(created?.caseId), {
      caseId: created.caseId,
      status: created.status,
      georesolutionStatus: created.georesolutionStatus,
      routingPending: created.routingPending,
      municipality: created.municipality,
      ward: created.ward,
      targetHours: created.targetHours,
    })
  } catch (e) {
    record('create_case', false, { error: String(e.message || e) })
    throw e
  }

  // Idempotency
  try {
    const res2 = await createCaseFn(payload)
    const same = res2.data?.caseId === created.caseId
    record('idempotency', same, { first: created.caseId, second: res2.data?.caseId })
  } catch (e) {
    record('idempotency', false, { error: String(e.message || e) })
  }

  // Upload JPEG media
  const hash = createHash('sha256').update(JPEG_MIN).digest('hex')
  try {
    const up = await uploadMediaFn({
      caseId: created.caseId,
      files: [{
        name: 'cert.jpg',
        type: 'image/jpeg',
        size: JPEG_MIN.length,
        data: JPEG_MIN.toString('base64'),
        contentHash: hash,
      }],
    })
    evidence.cases.media = up.data
    record('upload_jpeg', up.data?.status === 'completed' || (up.data?.mediaUrls?.length > 0), {
      status: up.data?.status, mediaCount: up.data?.mediaUrls?.length, failed: up.data?.failed
    })
  } catch (e) {
    record('upload_jpeg', false, { error: String(e.message || e) })
  }

  // Reject oversized / bad type probe — tiny invalid
  try {
    await uploadMediaFn({
      caseId: created.caseId,
      files: [{ name: 'bad.exe', type: 'application/octet-stream', size: 4, data: Buffer.from('MZ\0\0').toString('base64'), contentHash: createHash('sha256').update('MZ\0\0').digest('hex') }],
    })
    record('upload_reject_exe', false, { note: 'accepted exe' })
  } catch (e) {
    record('upload_reject_exe', true, { error: String(e.code || e.message || e).slice(0, 200) })
  }

  // Timeline
  try {
    const tl = await timelineFn({ caseId: created.caseId })
    const data = tl.data
    record('citizen_timeline', true, {
      keys: data && typeof data === 'object' ? Object.keys(data).slice(0, 12) : typeof data,
      status: data?.status || data?.case?.status,
    })
  } catch (e) {
    record('citizen_timeline', false, { error: String(e.message || e) })
  }

  // Track case via public page HTTP
  const trackUrls = [
    `https://servesa-aad53.web.app/case?id=${encodeURIComponent(created.caseId)}`,
    `https://servesa-aad53.web.app/case/${encodeURIComponent(created.caseId)}`,
  ]
  for (const u of trackUrls) {
    const r = await fetch(u)
    record(`track_http_${u.includes('?') ? 'query' : 'path'}`, r.status < 500, { url: u, status: r.status })
  }

  // Unresolved create (ocean) — routingPending expected
  try {
    const oceanPayload = {
      ...payload,
      clientRequestId: randomUUID(),
      title: 'Enterprise cert — unresolved ocean (synthetic)',
      latitude: -30.0,
      longitude: 15.0,
      address: 'Ocean unresolved pin',
      locationSource: 'map_pin',
    }
    const res = await createCaseFn(oceanPayload)
    evidence.cases.unresolved = res.data
    record('create_unresolved', res.data?.georesolutionStatus === 'unresolved' || res.data?.routingPending === true, {
      caseId: res.data?.caseId,
      georesolutionStatus: res.data?.georesolutionStatus,
      routingPending: res.data?.routingPending,
    })
  } catch (e) {
    record('create_unresolved', false, { error: String(e.message || e) })
  }

  // Official ops — sign in
  await auth.signOut()
  const off = await signInWithEmailAndPassword(auth, officialCreds.email, officialCreds.password)
  record('auth_official', true, { uid: off.user.uid })

  const searchOps = httpsCallable(functions, 'searchOpsCasesFunction')
  const updateStatus = httpsCallable(functions, 'updateCaseStatusFunction')
  const assignCase = httpsCallable(functions, 'assignCaseFunction')
  const addNote = httpsCallable(functions, 'addInternalNoteFunction')
  const addPublic = httpsCallable(functions, 'addPublicUpdateFunction')
  const listQueue = httpsCallable(functions, 'listSmartWorkQueueFunction')

  try {
    const q = await listQueue({})
    record('ops_smart_queue', true, { type: typeof q.data, keys: q.data && typeof q.data === 'object' ? Object.keys(q.data).slice(0, 10) : null })
  } catch (e) {
    record('ops_smart_queue', false, { error: String(e.message || e) })
  }

  try {
    const s = await searchOps({ query: created.caseId, limit: 5 })
    record('ops_search_case', true, { type: typeof s.data })
  } catch (e) {
    // search may use different shape
    record('ops_search_case', false, { error: String(e.message || e).slice(0, 200) })
  }

  // Valid transition submitted -> acknowledged/triaged/in_progress — try acknowledge
  let lifecycleOk = false
  for (const status of ['acknowledged', 'under_review', 'assigned', 'in_progress']) {
    try {
      const r = await updateStatus({ caseId: created.caseId, status, comment: `Enterprise cert transition to ${status}` })
      record(`ops_status_${status}`, true, { resultKeys: r.data && typeof r.data === 'object' ? Object.keys(r.data).slice(0, 8) : typeof r.data })
      lifecycleOk = true
      break
    } catch (e) {
      record(`ops_status_${status}`, false, { error: String(e.message || e).slice(0, 180) })
    }
  }

  // Invalid transition probe
  try {
    await updateStatus({ caseId: created.caseId, status: 'not_a_real_status', comment: 'invalid' })
    record('ops_reject_invalid_status', false, { note: 'accepted invalid' })
  } catch (e) {
    record('ops_reject_invalid_status', true, { error: String(e.message || e).slice(0, 180) })
  }

  try {
    await addNote({ caseId: created.caseId, note: 'Enterprise cert internal note (synthetic)' })
    record('ops_internal_note', true, {})
  } catch (e) {
    record('ops_internal_note', false, { error: String(e.message || e).slice(0, 180) })
  }

  try {
    await addPublic({ caseId: created.caseId, message: 'Enterprise cert public update (synthetic)' })
    record('ops_public_update', true, {})
  } catch (e) {
    record('ops_public_update', false, { error: String(e.message || e).slice(0, 180) })
  }

  // Cross-muni: CPT official if available
  const cptTok = tokens.PILOT_UAT_OFFICIAL_CPT_TOKEN
  if (cptTok) {
    const cptCreds = decodeUatPayload(cptTok)
    await auth.signOut()
    await signInWithEmailAndPassword(auth, cptCreds.email, cptCreds.password)
    try {
      await updateStatus({ caseId: created.caseId, status: 'in_progress', comment: 'CPT cross-muni probe' })
      record('ops_cross_muni_denial', false, { note: 'CPT official mutated JHB case' })
    } catch (e) {
      record('ops_cross_muni_denial', true, { error: String(e.message || e).slice(0, 180) })
    }
  } else {
    record('ops_cross_muni_denial', false, { error: 'CPT token missing' })
  }

  // Field
  if (fieldCreds) {
    await auth.signOut()
    await signInWithEmailAndPassword(auth, fieldCreds.email, fieldCreds.password)
    const listField = httpsCallable(functions, 'listFieldJobsFunction')
    try {
      const fj = await listField({})
      record('field_list_jobs', true, { keys: fj.data && typeof fj.data === 'object' ? Object.keys(fj.data).slice(0, 10) : typeof fj.data })
    } catch (e) {
      record('field_list_jobs', false, { error: String(e.message || e).slice(0, 180) })
    }
  }

  // Unauth storage list probe
  try {
    const r = await fetch('https://firebasestorage.googleapis.com/v0/b/servesa-aad53.firebasestorage.app/o?prefix=cases/')
    record('storage_unauth_list', r.status === 401 || r.status === 403, { status: r.status })
  } catch (e) {
    record('storage_unauth_list', false, { error: String(e.message || e) })
  }

  // Firestore unauth read case (should fail client rules without auth — we are signed as field; sign out)
  await auth.signOut()
  try {
    const snap = await getDoc(doc(db, 'cases', created.caseId))
    record('firestore_unauth_case_read', !snap.exists(), { exists: snap.exists() })
  } catch (e) {
    record('firestore_unauth_case_read', true, { denied: true, error: String(e.code || e.message || e).slice(0, 120) })
  }

  const failed = Object.entries(evidence.checks).filter(([, v]) => !v.ok).map(([k]) => k)
  evidence.summary = {
    total: Object.keys(evidence.checks).length,
    passed: Object.keys(evidence.checks).length - failed.length,
    failed,
    primaryCaseId: created?.caseId,
    unresolvedCaseId: evidence.cases.unresolved?.caseId,
  }

  mkdirSync('docs/reports/evidence', { recursive: true })
  writeFileSync('docs/reports/evidence/enterprise_prod_smoke.json', JSON.stringify(evidence, null, 2))
  console.log('SUMMARY', JSON.stringify(evidence.summary))
  if (failed.length) process.exitCode = 2
}

main().catch((e) => {
  console.error('FATAL', e)
  evidence.errors.push(String(e.stack || e))
  writeFileSync('docs/reports/evidence/enterprise_prod_smoke.json', JSON.stringify(evidence, null, 2))
  process.exit(1)
})
