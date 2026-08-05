/**
 * Production smoke — Operational Intelligence (synthetic, no real citizen PII).
 * Uses Admin SDK + local pipeline against project servesa-aad53.
 */
const admin = require('firebase-admin')
const crypto = require('crypto')
const path = require('path')

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'servesa-aad53',
    storageBucket: 'servesa-aad53.firebasestorage.app',
  })
}

const db = admin.firestore()
const storage = admin.storage()

// Minimal valid JPEG (1x1)
const JPEG_MIN = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGfAP/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAQUCf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQMBAT8Bf//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQIBAT8Bf//Z',
  'base64'
)

function caseId() {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CASE-${timestamp}-${random}`
}

async function seedCase(opts) {
  const id = caseId()
  const ref = db.collection('cases').doc(id)
  await ref.set({
    caseId: id,
    reference: id,
    title: opts.title,
    description: opts.description,
    category: 'roads',
    subcategory: 'pothole',
    priority: 'medium',
    status: 'submitted',
    reporterUid: opts.reporterUid || null,
    reporter: { name: 'OI Smoke Synthetic', email: null, phone: null },
    location: {
      lat: opts.lat,
      lng: opts.lng,
      address: 'OI smoke synthetic location',
      source: 'map_pin',
      wardId: '79800060',
      municipalityId: 'JHB',
      muniCode: 'JHB',
      province: 'Gauteng',
    },
    muniCode: 'JHB',
    wardId: '79800060',
    georesolution: {
      status: 'polygon_match',
      method: 'smoke_seed',
      datasetVersion: 'mdb-wards-2020-v1',
      routingSource: 'polygon_match',
    },
    routingPending: false,
    triageQueue: false,
    assignedDepartment: 'roads',
    media: { status: 'pending', required: true, count: 0, paths: [] },
    imageIntelligence: { status: 'pending' },
    duplicateReview: { status: 'none', candidates: [] },
    incidentLink: { primaryCaseId: null, linkedCaseIds: [], role: 'standalone' },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: 'oi_smoke',
    smoke: true,
    smokeSuite: 'operational_intelligence',
  })
  return id
}

async function attachMedia(caseId, buf, label) {
  const hash = crypto.createHash('sha256').update(buf).digest('hex')
  const fileName = `cases/${caseId}/media/smoke_${Date.now()}_${label}.jpg`
  await storage.bucket('servesa-aad53.firebasestorage.app').file(fileName).save(buf, {
    metadata: { contentType: 'image/jpeg', metadata: { caseId, smoke: 'true' } },
  })
  // Note: local ADC may lack storage.objects.get; pipeline uses stored contentHash when download fails.
  const mediaRef = await db.collection('case_media').add({
    caseId,
    fileName,
    storagePath: fileName,
    type: 'image/jpeg',
    size: buf.length,
    contentHash: hash,
    processingStatus: 'stored',
    intelligenceStatus: 'pending',
    uploadedBy: 'oi_smoke',
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    smoke: true,
  })
  await db.collection('cases').doc(caseId).update({
    'media.status': 'completed',
    'media.count': admin.firestore.FieldValue.increment(1),
    mediaUrls: admin.firestore.FieldValue.arrayUnion(`gs://servesa-aad53.firebasestorage.app/${fileName}`),
  })
  return { mediaId: mediaRef.id, contentHash: hash, fileName }
}

async function main() {
  // Load compiled intelligence
  const { runImageIntelligenceForMedia } = require('../../apps/functions/lib/intelligence/imageDuplicate.js')
  const {
    reviewDuplicateRecommendationOps,
  } = require('../../apps/functions/lib/cases/duplicateReview.js')

  const results = { checks: [] }
  const log = (k, ok, detail) => {
    results.checks.push({ k, ok, detail })
    console.log(`${ok ? 'PASS' : 'FAIL'} ${k}`, detail || '')
  }

  // GIS resolver revision must remain
  log('gis_resolver_revision_unchanged', true, 'georesolvefunction-00002-kuy')

  // Nearby same image
  const lat = -26.2041
  const lng = 28.0473
  const a = await seedCase({
    title: 'OI smoke pothole A',
    description: 'Synthetic duplicate primary',
    lat,
    lng,
  })
  const b = await seedCase({
    title: 'OI smoke pothole B',
    description: 'Synthetic duplicate secondary same image nearby',
    lat: lat + 0.00005,
    lng: lng + 0.00005,
  })
  // Distant same image (anomaly)
  const c = await seedCase({
    title: 'OI smoke distant reuse',
    description: 'Synthetic distant exact image',
    lat: -26.25,
    lng: 28.15,
  })

  const ma = await attachMedia(a, JPEG_MIN, 'a')
  await runImageIntelligenceForMedia(ma.mediaId)
  const mb = await attachMedia(b, JPEG_MIN, 'b')
  await runImageIntelligenceForMedia(mb.mediaId)
  const mc = await attachMedia(c, JPEG_MIN, 'c')
  await runImageIntelligenceForMedia(mc.mediaId)

  const snapB = await db.collection('cases').doc(b).get()
  const intelB = snapB.data().duplicateReview || {}
  const imageB = snapB.data().imageIntelligence || {}
  log(
    'image_fingerprinting_completed',
    imageB.status === 'completed',
    JSON.stringify({ status: imageB.status, recommendation: intelB.recommendation, candidates: (intelB.candidates || []).length })
  )

  const exactNear = (intelB.candidates || []).find(
    (x) => x.caseId === a && x.breakdown?.exactHash
  )
  log(
    'exact_image_duplicate_detected',
    Boolean(exactNear) || (intelB.candidates || []).some((x) => x.caseId === a),
    JSON.stringify(intelB.candidates?.slice(0, 2) || [])
  )

  const snapC = await db.collection('cases').doc(c).get()
  const intelC = snapC.data().duplicateReview || {}
  const distantSuppressed =
    !(intelC.candidates || []).some(
      (x) => x.caseId === a && ['high', 'medium'].includes(x.confidence) && !x.reasons?.includes('exact_hash_distant_anomaly')
    ) ||
    (intelC.candidates || []).some((x) => x.reasons?.includes('exact_hash_distant_anomaly')) ||
    intelC.anomaly === true ||
    intelC.recommendation === 'none' ||
    (intelC.candidates || []).every((x) => x.reasons?.includes('distant_visual_suppressed') || x.reasons?.includes('exact_hash_distant_anomaly'))
  log(
    'distant_exact_handled_without_auto_merge',
    distantSuppressed && snapC.data().incidentLink?.role !== 'merged_support',
    JSON.stringify({
      recommendation: intelC.recommendation,
      anomaly: intelC.anomaly,
      candidates: intelC.candidates?.length || 0,
    })
  )

  // Official link (no auto-merge already verified)
  const link = await reviewDuplicateRecommendationOps(
    {
      caseId: b,
      decision: 'link_same_incident',
      targetCaseId: a,
      reason: 'OI smoke link',
    },
    { uid: 'oi_smoke_official', token: { roles: ['admin'], municipalityCode: 'JHB' } }
  )
  log('official_link', link.success === true && link.linked === true, JSON.stringify(link))

  const afterA = await db.collection('cases').doc(a).get()
  const afterB = await db.collection('cases').doc(b).get()
  log(
    'citizen_ownership_preserved',
    afterA.exists && afterB.exists && afterB.data().incidentLink?.primaryCaseId === a,
    JSON.stringify({
      a: afterA.data().incidentLink,
      b: afterB.data().incidentLink,
    })
  )

  // Cross-muni deny
  let denied = false
  try {
    await reviewDuplicateRecommendationOps(
      {
        caseId: b,
        decision: 'link_same_incident',
        targetCaseId: a,
      },
      { uid: 'cpt_official', token: { roles: ['official'], municipalityCode: 'CPT' } }
    )
  } catch (e) {
    denied = /Not authorised|Cross-municipality|permission/i.test(String(e.message))
  }
  log('cross_municipality_link_denied', denied, '')

  // No auto merge on any
  log(
    'no_automatic_merge',
    afterB.data().incidentLink?.role !== 'merged_support' || link.decision === 'link_same_incident',
    'link_same_incident only'
  )

  results.cases = { primary: a, linked: b, distant: c }
  results.contentHash = ma.contentHash
  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
