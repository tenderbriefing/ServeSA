import { cn } from '@/lib/utils'

const toneStyles = {
  default: 'bg-surface-muted text-ink border-border',
  success: 'bg-success-tint text-success border-success-border',
  warning: 'bg-warning-tint text-warning border-warning-border',
  danger: 'bg-danger-tint text-danger border-danger-border',
  info: 'bg-info-tint text-info border-info-border',
  primary: 'bg-primary-50 text-primary-800 border-primary-200',
} as const

const statusCopy: Record<string, { label: string; tone: keyof typeof toneStyles }> = {
  submitted: { label: 'Submitted', tone: 'info' },
  received: { label: 'Received', tone: 'info' },
  acknowledged: { label: 'Acknowledged', tone: 'primary' },
  assigned: { label: 'Assigned', tone: 'primary' },
  in_progress: { label: 'In progress', tone: 'warning' },
  'in-progress': { label: 'In progress', tone: 'warning' },
  pending: { label: 'Pending review', tone: 'warning' },
  routing_pending: {
    label: 'Confirming the responsible authority',
    tone: 'warning',
  },
  resolved: { label: 'Resolved', tone: 'success' },
  closed: { label: 'Closed', tone: 'success' },
  rejected: { label: 'Not accepted', tone: 'danger' },
  duplicate: { label: 'Linked to an existing case', tone: 'default' },
}

type StatusBadgeProps = {
  status?: string | null
  label?: string
  tone?: keyof typeof toneStyles
  className?: string
}

export function StatusBadge({
  status,
  label,
  tone,
  className,
}: StatusBadgeProps) {
  const key = (status || '').toLowerCase().replace(/\s+/g, '_')
  const mapped = statusCopy[key]
  const resolvedTone = tone || mapped?.tone || 'default'
  const resolvedLabel =
    label ||
    mapped?.label ||
    (status
      ? status.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
      : 'Unknown')

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        toneStyles[resolvedTone],
        className
      )}
      data-testid="status-badge"
    >
      <span className="status-dot bg-current opacity-70" aria-hidden />
      <span>{resolvedLabel}</span>
    </span>
  )
}
