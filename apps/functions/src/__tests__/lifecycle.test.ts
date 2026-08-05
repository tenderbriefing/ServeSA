/**
 * Lifecycle + municipality ops unit tests (no live Firebase).
 */
import {
  canTransition,
  assertTransition,
  CASE_STATUS_TRANSITIONS,
} from '@servesa/case-contract'

describe('case lifecycle transitions', () => {
  it('allows submitted → acknowledged → assigned → in_progress → resolved → closed', () => {
    expect(canTransition('submitted', 'acknowledged')).toBe(true)
    expect(canTransition('acknowledged', 'assigned')).toBe(true)
    expect(canTransition('assigned', 'in_progress')).toBe(true)
    expect(canTransition('in_progress', 'resolved')).toBe(true)
    expect(canTransition('resolved', 'closed')).toBe(true)
  })

  it('rejects invalid jumps', () => {
    expect(canTransition('submitted', 'resolved')).toBe(false)
    expect(() => assertTransition('submitted', 'closed')).toThrow(/Invalid/)
  })

  it('allows reopen from closed/rejected to acknowledged', () => {
    expect(canTransition('closed', 'acknowledged')).toBe(true)
    expect(canTransition('rejected', 'acknowledged')).toBe(true)
  })

  it('defines transitions for every status', () => {
    for (const status of Object.keys(CASE_STATUS_TRANSITIONS)) {
      expect(Array.isArray(CASE_STATUS_TRANSITIONS[status as keyof typeof CASE_STATUS_TRANSITIONS])).toBe(true)
    }
  })
})
