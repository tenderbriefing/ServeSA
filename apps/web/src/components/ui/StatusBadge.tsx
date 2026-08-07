import { cn } from '@/lib/utils'
import {
  resolveStatusToken,
  statusToneClasses,
  type StatusTone,
} from '@/lib/status-tokens'

type StatusBadgeProps = {
  status?: string | null
  label?: string
  tone?: StatusTone
  className?: string
  /** Show icon — default true (WCAG: not colour alone) */
  showIcon?: boolean
}

export function StatusBadge({
  status,
  label,
  tone,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  const token = resolveStatusToken(status)
  const resolvedTone = tone || token.tone
  const resolvedLabel = label || token.label
  const Icon = token.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        statusToneClasses(resolvedTone),
        className
      )}
      data-testid="status-badge"
      title={token.description}
    >
      {showIcon ? (
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden strokeWidth={2} />
      ) : (
        <span className="status-dot bg-current opacity-70" aria-hidden />
      )}
      <span>{resolvedLabel}</span>
    </span>
  )
}
