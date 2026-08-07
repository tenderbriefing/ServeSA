/**
 * Case lifecycle status tokens — label + colour + icon (never colour alone).
 * Aligns with citizen-safe status vocabulary; no internal notes.
 */
import type { LucideIcon } from 'lucide-react'
import {
  CheckCircle2,
  CircleDot,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Link2,
  Loader2,
  Send,
  UserCheck,
  XCircle,
} from 'lucide-react'

export type StatusTone =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'primary'

export type StatusToken = {
  key: string
  label: string
  tone: StatusTone
  icon: LucideIcon
  /** Short accessible description for screen readers */
  description: string
}

const tokens: StatusToken[] = [
  {
    key: 'submitted',
    label: 'Submitted',
    tone: 'info',
    icon: Send,
    description: 'Report received by Serve SA',
  },
  {
    key: 'received',
    label: 'Received',
    tone: 'info',
    icon: FileCheck2,
    description: 'Case registered',
  },
  {
    key: 'acknowledged',
    label: 'Acknowledged',
    tone: 'primary',
    icon: ClipboardCheck,
    description: 'Municipality has acknowledged the case',
  },
  {
    key: 'assigned',
    label: 'Assigned',
    tone: 'primary',
    icon: UserCheck,
    description: 'Case assigned to a team',
  },
  {
    key: 'in_progress',
    label: 'In progress',
    tone: 'warning',
    icon: Loader2,
    description: 'Work is underway',
  },
  {
    key: 'in-progress',
    label: 'In progress',
    tone: 'warning',
    icon: Loader2,
    description: 'Work is underway',
  },
  {
    key: 'pending',
    label: 'Pending review',
    tone: 'warning',
    icon: Clock,
    description: 'Awaiting review',
  },
  {
    key: 'routing_pending',
    label: 'Confirming authority',
    tone: 'warning',
    icon: CircleDot,
    description: 'Confirming which authority should receive this report',
  },
  {
    key: 'resolved',
    label: 'Resolved',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Issue marked resolved',
  },
  {
    key: 'closed',
    label: 'Closed',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Case closed',
  },
  {
    key: 'rejected',
    label: 'Not accepted',
    tone: 'danger',
    icon: XCircle,
    description: 'Case was not accepted',
  },
  {
    key: 'duplicate',
    label: 'Linked to existing case',
    tone: 'default',
    icon: Link2,
    description: 'Linked to an existing case',
  },
]

const byKey = Object.fromEntries(tokens.map((t) => [t.key, t])) as Record<
  string,
  StatusToken
>

export const CITIZEN_LIFECYCLE_STEPS = [
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
] as const

export function resolveStatusToken(
  status?: string | null
): StatusToken {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_')
  return (
    byKey[key] || {
      key: key || 'unknown',
      label: status
        ? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
        : 'Unknown',
      tone: 'default' as StatusTone,
      icon: CircleDot,
      description: 'Case status',
    }
  )
}

export function statusToneClasses(tone: StatusTone): string {
  switch (tone) {
    case 'success':
      return 'bg-success-tint text-success border-success-border'
    case 'warning':
      return 'bg-warning-tint text-warning border-warning-border'
    case 'danger':
      return 'bg-danger-tint text-danger border-danger-border'
    case 'info':
      return 'bg-info-tint text-info border-info-border'
    case 'primary':
      return 'bg-primary-50 text-primary-800 border-primary-200'
    default:
      return 'bg-surface-muted text-ink border-border'
  }
}
