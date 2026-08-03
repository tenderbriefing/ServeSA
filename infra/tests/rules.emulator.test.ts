/**
 * Emulator-backed Firestore + Storage rules tests.
 * Source under test: infra/firestore.rules and infra/storage.rules
 */
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  addDoc,
} from 'firebase/firestore'
import { ref, uploadBytes, getBytes } from 'firebase/storage'

const PROJECT_ID = 'demo-servesa-rules'
const ROOT = resolve(__dirname, '../..')

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(ROOT, 'infra/firestore.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 8080,
    },
    storage: {
      rules: readFileSync(resolve(ROOT, 'infra/storage.rules'), 'utf8'),
      host: '127.0.0.1',
      port: 9199,
    },
  })
}, 60000)

afterAll(async () => {
  await testEnv.cleanup()
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
})

describe('Firestore rules (emulator)', () => {
  it('denies direct citizen case creation (backend-only writes)', async () => {
    const ctx = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(
      setDoc(doc(ctx.firestore(), 'cases/CASE1'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
        title: 'x',
      })
    )
  })

  it('citizen A cannot read citizen B private case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_B'), {
        reporterUid: 'citizenB',
        muniCode: 'JHB',
        title: 'Private',
        reporter: { email: 'b@example.com', phone: '+27820000000' },
      })
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(getDoc(doc(a.firestore(), 'cases/CASE_B')))
  })

  it('citizen A can read own case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
        title: 'Own case',
      })
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertSucceeds(getDoc(doc(a.firestore(), 'cases/CASE_A')))
  })

  it('unauthenticated cannot read private case fields', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
        reporter: { email: 'a@example.com' },
      })
    })
    const unauth = testEnv.unauthenticatedContext()
    await assertFails(getDoc(doc(unauth.firestore(), 'cases/CASE_A')))
  })

  it('municipality A official cannot read municipality B case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_CPT'), {
        reporterUid: 'citizenX',
        muniCode: 'CPT',
        title: 'Cape Town case',
      })
    })
    const official = testEnv.authenticatedContext('offJhb', {
      roles: ['official'],
      municipalityCode: 'JHB',
    })
    await assertFails(getDoc(doc(official.firestore(), 'cases/CASE_CPT')))
  })

  it('municipality A official can read own municipality case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_JHB'), {
        reporterUid: 'citizenX',
        muniCode: 'JHB',
        status: 'submitted',
      })
    })
    const official = testEnv.authenticatedContext('offJhbRead', {
      roles: ['official'],
      municipalityCode: 'JHB',
    })
    await assertSucceeds(getDoc(doc(official.firestore(), 'cases/CASE_JHB')))
  })

  it('municipality A official can update own municipality case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_JHB2'), {
        reporterUid: 'citizenX',
        muniCode: 'JHB',
        status: 'submitted',
      })
    })
    const official = testEnv.authenticatedContext('offJhbWrite', {
      roles: ['official'],
      municipalityCode: 'JHB',
    })
    await assertSucceeds(
      updateDoc(doc(official.firestore(), 'cases/CASE_JHB2'), {
        status: 'acknowledged',
      })
    )
  })

  it('municipality B official cannot update municipality A case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_JHB'), {
        reporterUid: 'citizenX',
        muniCode: 'JHB',
        status: 'submitted',
      })
    })
    const official = testEnv.authenticatedContext('offCpt', {
      roles: ['official'],
      municipalityCode: 'CPT',
    })
    await assertFails(
      updateDoc(doc(official.firestore(), 'cases/CASE_JHB'), {
        status: 'closed',
      })
    )
  })

  it('citizen cannot forge case events', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
      })
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(
      addDoc(collection(a.firestore(), 'cases/CASE_A/events'), {
        eventType: 'case_created',
        description: 'forged',
      })
    )
  })

  it('citizen cannot write notification ledger', async () => {
    const a = testEnv.authenticatedContext('citizenLedger', {
      roles: ['citizen'],
    })
    await assertFails(
      setDoc(doc(a.firestore(), 'notification_ledger/CASE_A_citizen_ack'), {
        status: 'sent',
      })
    )
  })

  it('citizen cannot write idempotency docs', async () => {
    const a = testEnv.authenticatedContext('citizenIdem', {
      roles: ['citizen'],
    })
    await assertFails(
      setDoc(doc(a.firestore(), 'case_idempotency/abc'), { caseId: 'x' })
    )
  })

  it('admin can read across municipalities', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_CPT'), {
        reporterUid: 'citizenX',
        muniCode: 'CPT',
      })
    })
    const admin = testEnv.authenticatedContext('admin1', { roles: ['admin'] })
    await assertSucceeds(getDoc(doc(admin.firestore(), 'cases/CASE_CPT')))
  })
})

describe('Storage rules (emulator)', () => {
  const pngBytes = (() => {
    const bytes = new Uint8Array(2048)
    bytes[0] = 0x89
    bytes[1] = 0x50
    bytes[2] = 0x4e
    bytes[3] = 0x47
    return bytes
  })()

  it('denies media upload when case does not exist', async () => {
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(
      uploadBytes(ref(a.storage(), 'cases/MISSING/media/photo.png'), pngBytes, {
        contentType: 'image/png',
      })
    )
  })

  it('citizen A cannot upload to citizen B case', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_B'), {
        reporterUid: 'citizenB',
        muniCode: 'JHB',
      })
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(
      uploadBytes(ref(a.storage(), 'cases/CASE_B/media/photo.png'), pngBytes, {
        contentType: 'image/png',
      })
    )
  })

  it('citizen A can upload to own case with valid image type', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
      })
    })
    // Confirm seed visible via rules-disabled read
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      const snap = await getDoc(doc(ctx.firestore(), 'cases/CASE_A'))
      expect(snap.exists()).toBe(true)
      expect(snap.data()?.reporterUid).toBe('citizenA')
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertSucceeds(
      uploadBytes(ref(a.storage(), 'cases/CASE_A/media/photo.png'), pngBytes, {
        contentType: 'image/png',
      })
    )
  })

  it('rejects unsupported executable content type', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
      })
    })
    const a = testEnv.authenticatedContext('citizenA', { roles: ['citizen'] })
    await assertFails(
      uploadBytes(ref(a.storage(), 'cases/CASE_A/media/malware.exe'), pngBytes, {
        contentType: 'application/x-msdownload',
      })
    )
  })

  it('municipality A official cannot read municipality B media', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_CPT'), {
        reporterUid: 'citizenX',
        muniCode: 'CPT',
      })
      await uploadBytes(
        ref(ctx.storage(), 'cases/CASE_CPT/media/photo.png'),
        pngBytes,
        { contentType: 'image/png' }
      )
    })
    const official = testEnv.authenticatedContext('offJhb', {
      roles: ['official'],
      municipalityCode: 'JHB',
    })
    await assertFails(
      getBytes(ref(official.storage(), 'cases/CASE_CPT/media/photo.png'))
    )
  })

  it('unauthenticated cannot read private media', async () => {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'cases/CASE_A'), {
        reporterUid: 'citizenA',
        muniCode: 'JHB',
      })
      await uploadBytes(
        ref(ctx.storage(), 'cases/CASE_A/media/photo.png'),
        pngBytes,
        { contentType: 'image/png' }
      )
    })
    const unauth = testEnv.unauthenticatedContext()
    await assertFails(
      getBytes(ref(unauth.storage(), 'cases/CASE_A/media/photo.png'))
    )
  })
})
