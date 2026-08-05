/**
 * Municipal case lifecycle — shared contract.
 * Do not invent municipalities; GIS remains source of tenancy.
 */

import { z } from 'zod'

export const CaseLifecycleStatusSchema = z.enum([
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'citizen_confirmed',
  'closed',
  'rejected',
])

export type CaseLifecycleStatus = z.infer<typeof CaseLifecycleStatusSchema>

/** Allowed transitions. Reopen paths go through acknowledged. */
export const CASE_STATUS_TRANSITIONS: Record<
  CaseLifecycleStatus,
  CaseLifecycleStatus[]
> = {
  submitted: ['acknowledged', 'rejected'],
  acknowledged: ['assigned', 'rejected'],
  assigned: ['in_progress', 'assigned', 'rejected'],
  in_progress: ['resolved', 'assigned', 'rejected'],
  resolved: ['citizen_confirmed', 'closed', 'acknowledged'],
  citizen_confirmed: ['closed', 'acknowledged'],
  closed: ['acknowledged'],
  rejected: ['acknowledged'],
}

export function canTransition(
  from: string,
  to: string
): boolean {
  const allowed = CASE_STATUS_TRANSITIONS[from as CaseLifecycleStatus]
  if (!allowed) return false
  return allowed.includes(to as CaseLifecycleStatus)
}

export function assertTransition(from: string, to: string): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`)
  }
}

/** Citizen-visible labels only — no internal ops language. */
export const CITIZEN_STATUS_LABEL: Record<CaseLifecycleStatus, string> = {
  submitted: 'Case received',
  acknowledged: 'Acknowledged',
  assigned: 'Assigned',
  in_progress: 'In progress',
  resolved: 'Resolved',
  citizen_confirmed: 'Confirmation received',
  closed: 'Closed',
  rejected: 'Closed',
}

export const OFFICIAL_PRIMARY_ACTION: Partial<
  Record<CaseLifecycleStatus, { action: string; nextStatus: CaseLifecycleStatus }>
> = {
  submitted: { action: 'Acknowledge', nextStatus: 'acknowledged' },
  acknowledged: { action: 'Assign', nextStatus: 'assigned' },
  assigned: { action: 'Start Work', nextStatus: 'in_progress' },
  in_progress: { action: 'Resolve', nextStatus: 'resolved' },
  resolved: { action: 'Close', nextStatus: 'closed' },
  citizen_confirmed: { action: 'Close', nextStatus: 'closed' },
}
