'use client'

import {
  CITIZEN_LIFECYCLE_STEPS,
  resolveStatusToken,
  statusToneClasses,
} from '@/lib/status-tokens'
import { cn } from '@/lib/utils'

type Milestone = {
  description?: string
  actor?: string
  at?: string
  status?: string
}

type ProgressTimelineProps = {
  currentStatus?: string | null
  milestones?: Milestone[]
  className?: string
}

function actorLabel(actor?: string) {
  if (actor === 'you') return 'You'
  if (actor === 'municipality') return 'Municipality'
  return 'System'
}

/**
 * Citizen-safe lifecycle timeline.
 * Submitted → … → Closed. Never renders internal notes.
 */
export function ProgressTimeline({
  currentStatus,
  milestones = [],
  className,
}: ProgressTimelineProps) {
  const current = resolveStatusToken(currentStatus)
  const currentIdx = CITIZEN_LIFECYCLE_STEPS.findIndex(
    (s) => s === current.key || (current.key === 'in-progress' && s === 'in_progress')
  )

  return (
    <div className={cn('space-y-6', className)}>
      <ol className="grid gap-2 sm:grid-cols-6" aria-label="Case lifecycle">
        {CITIZEN_LIFECYCLE_STEPS.map((step, index) => {
          const token = resolveStatusToken(step)
          const Icon = token.icon
          const reached = currentIdx >= 0 && index <= currentIdx
          const active = currentIdx === index
          return (
            <li
              key={step}
              className={cn(
                'flex flex-col items-center gap-2 rounded-md border px-2 py-3 text-center',
                reached
                  ? statusToneClasses(token.tone)
                  : 'border-border bg-surface-muted/50 text-ink-subtle'
              )}
              aria-current={active ? 'step' : undefined}
            >
              <Icon
                className={cn('h-4 w-4', active && 'animate-pulse')}
                aria-hidden
                strokeWidth={1.75}
              />
              <span className="text-caption font-medium leading-tight">
                {token.label}
              </span>
            </li>
          )
        })}
      </ol>

      {milestones.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-h4 text-ink">Progress</h3>
          <ol className="relative space-y-4 border-l-2 border-primary-200 pl-5">
            {milestones.map((m, i) => (
              <li key={i} className="relative">
                <span
                  className="absolute -left-[1.4rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary-600 bg-surface"
                  aria-hidden
                />
                <p className="font-medium text-ink">{m.description}</p>
                <p className="text-caption text-ink-subtle">
                  {actorLabel(m.actor)}
                  {m.at ? ` · ${new Date(m.at).toLocaleString('en-ZA')}` : ''}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
