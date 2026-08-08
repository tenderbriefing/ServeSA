/**
 * Municipal planning RBAC + publication transition unit tests.
 */

import {
  assertCommsEditor,
  assertCommsPublisher,
  OpsError,
} from '../cases/municipalityOpsShared'
import {
  canTransitionPlanPublication,
  PLANNING_EMPTY_COPY,
} from '../../../../packages/case-contract/src/municipalPlanning'

describe('planning RBAC', () => {
  it('allows official editors and publishers', () => {
    const ctx = {
      uid: 'u1',
      token: { roles: ['official'], municipalityCode: 'JHB' },
    }
    expect(assertCommsEditor(ctx).muniCode).toBe('JHB')
    expect(assertCommsPublisher(ctx).muniCode).toBe('JHB')
  })

  it('rejects field_worker-only for planning edits', () => {
    const ctx = {
      uid: 'u2',
      token: { roles: ['field_worker'], municipalityCode: 'JHB' },
    }
    expect(() => assertCommsEditor(ctx)).toThrow(OpsError)
  })

  it('comms_editor alone cannot publish (publisher required)', () => {
    const ctx = {
      uid: 'u3',
      token: { roles: ['comms_editor'], municipalityCode: 'JHB' },
    }
    expect(assertCommsEditor(ctx).muniCode).toBe('JHB')
    expect(() => assertCommsPublisher(ctx)).toThrow(OpsError)
  })
})

describe('planning lifecycle', () => {
  it('requires verify before publish', () => {
    expect(canTransitionPlanPublication('verified', 'published')).toBe(true)
    expect(canTransitionPlanPublication('draft', 'published')).toBe(false)
    expect(canTransitionPlanPublication('awaiting_review', 'published')).toBe(
      false
    )
  })

  it('keeps honest empty copy constants', () => {
    expect(PLANNING_EMPTY_COPY.noWardMapping).toMatch(/Ward-level/i)
  })
})
