'use client'

import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { DeviceFrame } from './DeviceFrame'
import { MotionReveal } from './motion/MotionReveal'
import { AnimatedCaseStatus } from './AnimatedCaseStatus'
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion'
import { trackLandingEvent } from '@/lib/telemetry/landing'
import { cn } from '@/lib/utils'
import { useRef } from 'react'

const OPS_FLOW = [
  'New case',
  'Department',
  'Assigned official',
  'In progress',
  'Resolution',
] as const

/**
 * Dual-sided storytelling: citizen phone → municipal operations.
 */
export function MunicipalityWorkflow() {
  const reduced = usePrefersReducedMotion()
  const [phase, setPhase] = useState(0)
  const viewed = useRef(false)

  useEffect(() => {
    if (reduced) {
      setPhase(OPS_FLOW.length - 1)
      return
    }
    const t = window.setInterval(() => {
      setPhase((p) => (p + 1) % OPS_FLOW.length)
    }, 2200)
    return () => window.clearInterval(t)
  }, [reduced])

  return (
    <section
      className="border-b border-border bg-canvas py-14 sm:py-16"
      aria-labelledby="both-sides-heading"
      ref={(node) => {
        if (!node || viewed.current) return
        const obs = new IntersectionObserver(
          ([e]) => {
            if (e?.isIntersecting) {
              viewed.current = true
              trackLandingEvent('municipality_section_view')
              obs.disconnect()
            }
          },
          { threshold: 0.25 }
        )
        obs.observe(node)
      }}
    >
      <div className="container">
        <MotionReveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 id="both-sides-heading" className="font-display text-h2 text-ink">
              Built for both sides of service delivery.
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Citizens get visibility. Municipal teams get structured, actionable
              service-delivery information.
            </p>
          </div>
        </MotionReveal>

        <div className="relative mx-auto grid max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <MotionReveal>
            <DeviceFrame label="Citizen case view preview" className="max-w-[260px]">
              <div className="space-y-3 p-4 pt-7">
                <p className="text-caption font-semibold text-primary-700">My Case</p>
                <p className="font-mono text-sm font-semibold text-ink">CASE-JHB-28471</p>
                <p className="text-body-sm text-ink-muted">Roads & Infrastructure · Pothole</p>
                <AnimatedCaseStatus activeIndex={Math.min(phase, 4)} />
                <div className="rounded-md border border-border bg-surface-muted/60 px-3 py-2 text-caption text-ink-muted">
                  Midrand · Photo attached · Submitted today
                </div>
              </div>
            </DeviceFrame>
          </MotionReveal>

          {/* Travelling case indicator */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
            aria-hidden
          >
            <div
              className={cn(
                'flex items-center gap-1 rounded-full border border-primary-200 bg-surface px-3 py-1.5 text-caption font-medium text-primary-800 shadow-sm',
                !reduced && 'animate-landing-travel'
              )}
            >
              Case
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <MotionReveal delayMs={100}>
            <DeviceFrame variant="panel" label="Municipal operations preview">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold text-ink">Incoming cases</p>
                  <span className="rounded bg-primary-50 px-2 py-0.5 text-[11px] font-medium text-primary-800">
                    Example demo
                  </span>
                </div>
                <div className="rounded-md border border-primary-200 bg-primary-50/50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-caption font-semibold text-ink">
                      CASE-JHB-28471
                    </p>
                    <span className="text-[11px] text-ink-subtle">Ward 84</span>
                  </div>
                  <p className="mt-1 text-body-sm text-ink">Pothole · Roads & Infrastructure</p>
                  <ol className="mt-3 flex flex-wrap gap-1.5">
                    {OPS_FLOW.map((label, i) => (
                      <li
                        key={label}
                        className={cn(
                          'rounded border px-2 py-0.5 text-[11px] transition-colors duration-base',
                          i === phase
                            ? 'border-green-600 bg-green-50 text-green-800'
                            : i < phase
                              ? 'border-primary-200 bg-surface text-primary-800'
                              : 'border-border bg-canvas text-ink-subtle'
                        )}
                      >
                        {label}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="grid grid-cols-2 gap-2 text-caption">
                  <div className="rounded-md border border-border bg-surface px-2.5 py-2">
                    <p className="text-ink-subtle">Department</p>
                    <p className="font-medium text-ink">Roads</p>
                  </div>
                  <div className="rounded-md border border-border bg-surface px-2.5 py-2">
                    <p className="text-ink-subtle">Assignee</p>
                    <p className="font-medium text-ink">Field team</p>
                  </div>
                </div>
              </div>
            </DeviceFrame>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
