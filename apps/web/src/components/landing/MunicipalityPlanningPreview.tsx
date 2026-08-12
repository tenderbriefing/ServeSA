'use client'

import Link from 'next/link'
import { ArrowRight, Droplets, Home, Lamp, Map as MapIcon, Route } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MotionReveal } from './motion/MotionReveal'
import { FEATURE_FLAGS } from '@/lib/constants'
import { trackLandingEvent } from '@/lib/telemetry/landing'

const PRIORITIES = [
  { label: 'Roads', icon: Route, progress: 62 },
  { label: 'Water', icon: Droplets, progress: 48 },
  { label: 'Electricity', icon: Lamp, progress: 71 },
  { label: 'Housing', icon: Home, progress: 35 },
  { label: 'Community facilities', icon: MapIcon, progress: 54 },
] as const

/**
 * Visual IDP / municipality planning — gated by feature flag.
 */
export function MunicipalityPlanningPreview() {
  if (!FEATURE_FLAGS.enableMunicipalPlanning) {
    return null
  }

  return (
    <section
      className="border-b border-border bg-surface-muted/40 py-14 sm:py-16"
      aria-labelledby="planning-heading"
    >
      <div className="container">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <MotionReveal>
            <h2 id="planning-heading" className="font-display text-h2 text-ink">
              Understand what your municipality is planning.
            </h2>
            <p className="mt-3 max-w-md text-body-lg text-ink-muted">
              Municipal plans should be understandable to everyone — priorities,
              infrastructure programmes, and project locations in plain language.
            </p>
            <div className="mt-8">
              <Link
                href="/municipality"
                onClick={() => trackLandingEvent('municipality_cta_click')}
              >
                <Button variant="brand" size="lg" className="min-h-touch">
                  Explore Your Municipality
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
            <p className="mt-3 text-caption text-ink-subtle">
              Illustrative planning view — not live municipal data.
            </p>
          </MotionReveal>

          <MotionReveal delayMs={100}>
            <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-caption text-ink-subtle">Our Municipality</p>
                  <p className="font-display text-h4 text-ink">Priorities at a glance</p>
                </div>
                <span className="rounded bg-gold-100 px-2 py-0.5 text-[11px] font-medium text-gold-800">
                  Example demo
                </span>
              </div>
              <ul className="space-y-3">
                {PRIORITIES.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.label}>
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-2 text-body-sm font-medium text-ink">
                          <Icon className="h-4 w-4 text-primary-600" aria-hidden />
                          {item.label}
                        </span>
                        <span className="text-caption text-ink-subtle">{item.progress}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                        <div
                          className="h-full rounded-full bg-green-600 transition-[width] duration-slow ease-civic"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
              <div className="mt-5 overflow-hidden rounded-lg border border-border">
                <svg viewBox="0 0 320 120" className="w-full" aria-hidden>
                  <rect width="320" height="120" fill="rgb(238 241 250)" />
                  <path d="M20 90 L90 40 L160 70 L240 35 L300 80" fill="none" stroke="rgb(0 35 149)" strokeWidth="2" opacity="0.5" />
                  <circle cx="90" cy="40" r="5" fill="rgb(0 122 77)" />
                  <circle cx="160" cy="70" r="5" fill="rgb(255 184 28)" />
                  <circle cx="240" cy="35" r="5" fill="rgb(0 35 149)" />
                  <text x="16" y="18" fontSize="10" fill="rgb(70 83 95)">
                    Map-based project locations
                  </text>
                </svg>
              </div>
            </div>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
