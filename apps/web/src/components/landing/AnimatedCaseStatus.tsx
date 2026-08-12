'use client'

import { cn } from '@/lib/utils'
import { resolveStatusToken } from '@/lib/status-tokens'

const DEMO_STATUSES = [
  'submitted',
  'acknowledged',
  'assigned',
  'in_progress',
  'resolved',
] as const

type AnimatedCaseStatusProps = {
  /** Index into the demo lifecycle, or absolute status key */
  activeIndex?: number
  statusKey?: string
  className?: string
  compact?: boolean
}

/**
 * Visual status progression using real Serve SA status labels.
 */
export function AnimatedCaseStatus({
  activeIndex = 0,
  statusKey,
  className,
  compact = false,
}: AnimatedCaseStatusProps) {
  const resolvedKey =
    statusKey ?? DEMO_STATUSES[Math.min(activeIndex, DEMO_STATUSES.length - 1)]
  const current = resolveStatusToken(resolvedKey)

  if (compact) {
    const Icon = current.icon
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-caption font-medium text-ink transition-colors duration-base ease-civic',
          className
        )}
      >
        <Icon className="h-3.5 w-3.5 text-primary-600" aria-hidden />
        {current.label}
      </span>
    )
  }

  return (
    <ol
      className={cn('flex flex-wrap items-center gap-1.5', className)}
      aria-label={`Case status: ${current.label}`}
    >
      {DEMO_STATUSES.map((key, i) => {
        const token = resolveStatusToken(key)
        const Icon = token.icon
        const active = i === Math.min(activeIndex, DEMO_STATUSES.length - 1)
        const done = i < activeIndex
        return (
          <li
            key={key}
            className={cn(
              'inline-flex items-center gap-1 rounded-md border px-2 py-1 text-caption transition-all duration-base ease-civic',
              active && 'border-green-600 bg-green-50 text-green-800 shadow-sm',
              done && !active && 'border-primary-200 bg-primary-50/60 text-primary-800',
              !active && !done && 'border-border bg-surface text-ink-subtle'
            )}
          >
            <Icon className="h-3 w-3 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{token.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </li>
        )
      })}
    </ol>
  )
}

export const LANDING_DEMO_STATUSES = DEMO_STATUSES
