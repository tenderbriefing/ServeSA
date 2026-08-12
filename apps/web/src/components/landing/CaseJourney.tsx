'use client'

import { useEffect, useMemo, useRef } from 'react'
import {
  Camera,
  MapPin,
  Route,
  UserCheck,
  Wrench,
  Bell,
} from 'lucide-react'
import { MotionReveal } from './motion/MotionReveal'
import { useInViewProgress } from './motion/useInViewProgress'
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion'
import { AnimatedCaseStatus } from './AnimatedCaseStatus'
import { cn } from '@/lib/utils'
import { trackLandingEvent } from '@/lib/telemetry/landing'

const STEPS = [
  {
    n: '01',
    title: 'Report',
    body: 'Citizen captures the problem with a photo and clear description.',
    icon: Camera,
  },
  {
    n: '02',
    title: 'Locate',
    body: 'Serve SA identifies where it happened inside South Africa.',
    icon: MapPin,
  },
  {
    n: '03',
    title: 'Route',
    body: 'The case reaches the appropriate municipality.',
    icon: Route,
  },
  {
    n: '04',
    title: 'Assign',
    body: 'Municipal teams take ownership.',
    icon: UserCheck,
  },
  {
    n: '05',
    title: 'Resolve',
    body: 'Work is completed and recorded.',
    icon: Wrench,
  },
  {
    n: '06',
    title: 'Inform',
    body: 'The citizen sees what happened.',
    icon: Bell,
  },
] as const

/**
 * From report to resolution — scroll-driven lifecycle storytelling.
 */
export function CaseJourney() {
  const { ref, progress } = useInViewProgress()
  const reduced = usePrefersReducedMotion()
  const tracked = useRef(false)

  const active = useMemo(() => {
    if (reduced) return STEPS.length - 1
    return Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))
  }, [progress, reduced])

  useEffect(() => {
    if (progress > 0.15 && !tracked.current) {
      tracked.current = true
      trackLandingEvent('how_it_works_view')
    }
  }, [progress])

  return (
    <section
      id="how-it-works"
      className="border-b border-border bg-surface-muted/40"
      aria-labelledby="journey-heading"
    >
      <div
        ref={ref}
        className="relative"
        style={{ minHeight: reduced ? undefined : '140vh' }}
      >
        <div className={cn('container py-14', !reduced && 'lg:sticky lg:top-20 lg:py-16')}>
          <MotionReveal>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <h2 id="journey-heading" className="font-display text-h2 text-ink">
                From report to resolution.
              </h2>
              <p className="mt-3 text-body-lg text-ink-muted">
                One clear journey for citizens and municipalities.
              </p>
            </div>
          </MotionReveal>

          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const Icon = step.icon
                const on = i <= active
                return (
                  <li
                    key={step.n}
                    className={cn(
                      'flex gap-3 rounded-lg border px-3 py-3 transition-all duration-base ease-civic',
                      on
                        ? 'border-primary-200 bg-surface shadow-sm'
                        : 'border-transparent bg-transparent opacity-55'
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-caption font-semibold',
                        on ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-ink-muted'
                      )}
                    >
                      {step.n}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-green-700" aria-hidden />
                        <h3 className="font-display text-h4 text-ink">{step.title}</h3>
                      </div>
                      <p className="mt-1 text-body-sm text-ink-muted">{step.body}</p>
                    </div>
                  </li>
                )
              })}
            </ol>

            <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <p className="text-caption text-ink-subtle">Example demo case</p>
                  <p className="font-mono text-sm font-semibold text-ink">CASE-DEMO-28471</p>
                </div>
                <AnimatedCaseStatus
                  activeIndex={Math.min(4, Math.floor((active / (STEPS.length - 1)) * 4))}
                  compact
                />
              </div>

              <svg viewBox="0 0 360 200" className="w-full" aria-hidden>
                <rect width="360" height="200" rx="12" fill="rgb(238 241 250)" />
                <path
                  d="M30 160 C80 120, 120 170, 170 110 S260 40, 330 70"
                  fill="none"
                  stroke="rgb(0 35 149)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="420"
                  strokeDashoffset={reduced ? 0 : 420 - progress * 420}
                  className="transition-[stroke-dashoffset] duration-base ease-civic"
                />
                {[0.05, 0.25, 0.45, 0.65, 0.82, 0.95].map((t, i) => {
                  const x = 30 + t * 300
                  const y = 160 - Math.sin(t * Math.PI) * 90
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={i <= active ? 7 : 4}
                      fill={i <= active ? 'rgb(0 122 77)' : 'rgb(168 165 156)'}
                      className="transition-all duration-base"
                    />
                  )
                })}
              </svg>

              <p className="mt-4 text-body-sm text-ink-muted">
                {STEPS[active]?.body}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
