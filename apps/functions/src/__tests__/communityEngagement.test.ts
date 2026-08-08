/**
 * Unit tests for community engagement auth helpers and transitions.
 */

import {
  assertCommsEditor,
  assertCommsPublisher,
  OpsError,
} from '../cases/municipalityOpsShared'
import { canTransitionUpdate } from '../../../../packages/case-contract/src/municipalUpdates'
import { canTransitionIdea } from '../../../../packages/case-contract/src/communityIdeas'

describe('comms RBAC', () => {
  it('rejects unauthenticated editors', () => {
    expect(() =>
      assertCommsEditor({ uid: '', token: null })
    ).toThrow(OpsError)
  })

  it('allows official as editor and publisher', () => {
    const ctx = {
      uid: 'u1',
      token: { roles: ['official'], municipalityCode: 'JHB' },
    }
    expect(assertCommsEditor(ctx).muniCode).toBe('JHB')
    expect(assertCommsPublisher(ctx).muniCode).toBe('JHB')
  })

  it('rejects field_worker-only for communications', () => {
    const ctx = {
      uid: 'u2',
      token: { roles: ['field_worker'], municipalityCode: 'JHB' },
    }
    expect(() => assertCommsEditor(ctx)).toThrow(OpsError)
  })

  it('comms_editor alone cannot publish', () => {
    const ctx = {
      uid: 'u3',
      token: { roles: ['comms_editor'], municipalityCode: 'JHB' },
    }
    expect(assertCommsEditor(ctx).muniCode).toBe('JHB')
    expect(() => assertCommsPublisher(ctx)).toThrow(OpsError)
  })
})

describe('lifecycle helpers', () => {
  it('update and idea transitions match contract', () => {
    expect(canTransitionUpdate('draft', 'published')).toBe(true)
    expect(canTransitionIdea('community_support', 'feasibility_review')).toBe(
      true
    )
  })
})
