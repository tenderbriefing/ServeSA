'use client'

import { useEffect, useMemo, useState } from 'react'
import { MotionReveal } from './motion/MotionReveal'
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

const MARKERS = [
  { x: 48, y: 62, cat: 'water' },
  { x: 72, y: 48, cat: 'water' },
  { x: 90, y: 78, cat: 'water' },
  { x: 110, y: 40, cat: 'roads' },
  { x: 130, y: 70, cat: 'roads' },
  { x: 150, y: 55, cat: 'electricity' },
  { x: 170, y: 85, cat: 'water' },
  { x: 190, y: 45, cat: 'roads' },
  { x: 210, y: 68, cat: 'electricity' },
  { x: 230, y: 52, cat: 'roads' },
  { x: 250, y: 80, cat: 'water' },
  { x: 270, y: 42, cat: 'electricity' },
] as const

const CATEGORY_COLOUR: Record<string, string> = {
  water: 'rgb(0 35 149)',
  roads: 'rgb(0 122 77)',
  electricity: 'rgb(255 184 28)',
}

/**
 * Civic intelligence storytelling with clearly labelled example data.
 */
export function CivicImpactMap() {
  const reduced = usePrefersReducedMotion()
  const [visible, setVisible] = useState(reduced ? MARKERS.length : 0)

  useEffect(() => {
    if (reduced) {
      setVisible(MARKERS.length)
      return
    }
    if (visible >= MARKERS.length) return
    const t = window.setTimeout(() => setVisible((v) => v + 1), 220)
    return () => window.clearTimeout(t)
  }, [visible, reduced])

  const counts = useMemo(() => {
    const shown = MARKERS.slice(0, visible)
    return {
      water: shown.filter((m) => m.cat === 'water').length * 21 + 22,
      roads: shown.filter((m) => m.cat === 'roads').length * 17 + 16,
      electricity: shown.filter((m) => m.cat === 'electricity').length * 15 + 18,
    }
  }, [visible])

  return (
    <section
      className="border-b border-border bg-canvas py-14 sm:py-16"
      aria-labelledby="impact-heading"
    >
      <div className="container">
        <MotionReveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 id="impact-heading" className="font-display text-h2 text-ink">
              Every report can help build a clearer picture.
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Individual cases become actionable service-delivery intelligence.
            </p>
            <p className="mt-2 text-caption text-ink-subtle">
              Example demo clustering — not production statistics.
            </p>
          </div>
        </MotionReveal>

        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <MotionReveal>
            <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
              <svg viewBox="0 0 320 200" className="w-full" role="img" aria-label="Example municipal map with case markers">
                <rect width="320" height="200" fill="rgb(238 241 250)" />
                <path
                  d="M20 30 L100 20 L180 40 L280 25 L300 120 L240 180 L80 170 L30 100 Z"
                  fill="rgb(213 219 243)"
                  stroke="rgb(0 35 149)"
                  strokeWidth="1.5"
                  opacity="0.55"
                />
                {MARKERS.slice(0, visible).map((m, i) => (
                  <circle
                    key={i}
                    cx={m.x}
                    cy={m.y}
                    r={visible > 8 ? 10 : 5}
                    fill={CATEGORY_COLOUR[m.cat]}
                    opacity={visible > 8 ? 0.35 : 0.9}
                    className="transition-all duration-base ease-civic"
                  />
                ))}
              </svg>
            </div>
          </MotionReveal>

          <MotionReveal delayMs={80}>
            <ul className="space-y-3">
              {[
                { label: 'Water', value: counts.water, tone: 'bg-primary-50 text-primary-800 border-primary-200' },
                { label: 'Roads', value: counts.roads, tone: 'bg-green-50 text-green-800 border-green-200' },
                { label: 'Electricity', value: counts.electricity, tone: 'bg-gold-50 text-gold-800 border-gold-200' },
              ].map((card) => (
                <li
                  key={card.label}
                  className={cn('rounded-lg border px-4 py-3', card.tone)}
                >
                  <p className="text-caption font-medium">{card.label}</p>
                  <p className="font-display text-h3 tabular-nums">
                    {card.value}{' '}
                    <span className="text-body-sm font-normal opacity-80">reports</span>
                  </p>
                  <p className="text-[11px] opacity-70">Example demo count</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-body-sm text-ink-muted">
              Geographic clusters and category patterns help municipalities see
              where service pressure is building.
            </p>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
