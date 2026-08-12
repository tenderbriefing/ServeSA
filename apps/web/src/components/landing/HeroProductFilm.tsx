'use client'

import { useEffect, useState } from 'react'
import { Camera, CheckCircle2, MapPin, Bell } from 'lucide-react'
import { DeviceFrame } from './DeviceFrame'
import { AnimatedCaseStatus } from './AnimatedCaseStatus'
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion'
import { cn } from '@/lib/utils'

const FRAMES = [
  {
    id: 'notice',
    caption: 'Something needs attention.',
    durationMs: 2800,
  },
  {
    id: 'report',
    caption: 'Citizen captures the issue.',
    durationMs: 3200,
  },
  {
    id: 'case',
    caption: 'Case created.',
    durationMs: 2800,
  },
  {
    id: 'route',
    caption: 'Sent to the correct municipality.',
    durationMs: 3000,
  },
  {
    id: 'ops',
    caption: 'Municipal teams take ownership.',
    durationMs: 3400,
  },
  {
    id: 'resolved',
    caption: 'You stay informed from report to resolution.',
    durationMs: 3600,
  },
] as const

/**
 * Cinematic product film for the hero — DOM/SVG only, no video.
 * Loops gracefully; static composite when reduced motion is preferred.
 */
export function HeroProductFilm({ className }: { className?: string }) {
  const reduced = usePrefersReducedMotion()
  const [frame, setFrame] = useState(1)

  useEffect(() => {
    if (reduced) {
      setFrame(FRAMES.length - 1)
      return
    }
    const ms = FRAMES[frame]?.durationMs ?? 3000
    const t = window.setTimeout(() => {
      setFrame((f) => (f + 1) % FRAMES.length)
    }, ms)
    return () => window.clearTimeout(t)
  }, [frame, reduced])

  const caption = FRAMES[frame]?.caption ?? FRAMES[FRAMES.length - 1].caption

  return (
    <div className={cn('relative', className)}>
      <div className="relative min-h-[420px] sm:min-h-[460px]">
        {/* Civic street context */}
        <div
          className={cn(
            'absolute inset-0 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-50 via-canvas to-green-50 transition-opacity duration-slow ease-civic',
            frame === 0 ? 'opacity-100' : 'opacity-40'
          )}
          aria-hidden
        >
          <svg viewBox="0 0 400 320" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
            <rect width="400" height="320" fill="rgb(250 248 243)" />
            <path d="M0 220 H400" stroke="rgb(208 205 197)" strokeWidth="28" />
            <path d="M0 220 H400" stroke="rgb(255 255 255)" strokeWidth="2" strokeDasharray="18 14" opacity="0.7" />
            <rect x="40" y="80" width="70" height="110" fill="rgb(213 219 243)" />
            <rect x="130" y="100" width="55" height="90" fill="rgb(213 239 227)" />
            <rect x="280" y="70" width="80" height="120" fill="rgb(213 219 243)" />
            <circle
              cx="210"
              cy="200"
              r="10"
              fill="rgb(222 56 49)"
              className={cn(!reduced && frame === 0 && 'animate-landing-pulse')}
            />
            <circle
              cx="210"
              cy="200"
              r="22"
              fill="none"
              stroke="rgb(222 56 49)"
              strokeWidth="2"
              opacity="0.45"
              className={cn(!reduced && frame === 0 && 'animate-landing-pulse')}
            />
          </svg>
        </div>

        {/* Mobile report UI */}
        <div
          className={cn(
            'absolute left-1/2 top-8 w-[78%] max-w-[240px] -translate-x-1/2 transition-all duration-[1100ms] ease-civic sm:left-[8%] sm:translate-x-0',
            frame >= 1 && frame <= 2
              ? 'translate-y-0 opacity-100'
              : frame > 2
                ? '-translate-y-4 opacity-0'
                : 'translate-y-8 opacity-0'
          )}
        >
          <DeviceFrame label="Serve SA reporting interface preview">
            <div className="space-y-3 p-3 pt-6">
              <p className="text-caption font-medium text-primary-700">Serve SA</p>
              <p className="font-display text-sm font-semibold text-ink">Report an Issue</p>
              <div className="rounded-md border border-green-200 bg-green-50 px-2.5 py-2">
                <p className="text-caption font-medium text-green-800">Roads & Infrastructure</p>
                <p className="text-[11px] text-green-700">Pothole on main road</p>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-2">
                <div className="flex h-10 w-10 items-center justify-center rounded bg-neutral-200">
                  <Camera className="h-4 w-4 text-ink-muted" aria-hidden />
                </div>
                <div>
                  <p className="text-caption font-medium text-ink">Photo attached</p>
                  <p className="text-[11px] text-ink-subtle">IMG_2847.jpg</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-caption text-ink-muted">
                <MapPin className="h-3.5 w-3.5 text-primary-600" aria-hidden />
                Location confirmed
              </div>
              {frame === 2 && (
                <div className="rounded-md border border-primary-200 bg-primary-50 px-2.5 py-2">
                  <p className="text-[11px] text-primary-700">Case created</p>
                  <p className="font-mono text-sm font-semibold text-primary-900">
                    CASE-DEMO-28471
                  </p>
                  <p className="mt-0.5 text-[10px] text-ink-subtle">Example demo reference</p>
                </div>
              )}
            </div>
          </DeviceFrame>
        </div>

        {/* Map routing */}
        <div
          className={cn(
            'absolute right-3 top-16 w-[55%] max-w-[220px] transition-all duration-[1100ms] ease-civic sm:right-6 sm:top-20',
            frame === 3 ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
          )}
        >
          <div className="overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-md">
            <p className="text-caption font-medium text-ink">Municipal routing</p>
            <svg viewBox="0 0 200 120" className="mt-2 w-full" aria-hidden>
              <rect width="200" height="120" fill="rgb(238 241 250)" rx="6" />
              <path
                d="M20 90 L70 40 L120 70 L180 30"
                fill="none"
                stroke="rgb(0 35 149)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                className={cn(!reduced && 'animate-landing-route')}
              />
              <circle cx="70" cy="40" r="5" fill="rgb(0 122 77)" />
              <circle cx="180" cy="30" r="6" fill="rgb(0 35 149)" />
              <text x="100" y="108" fontSize="9" fill="rgb(70 83 95)">
                City of Example Metro
              </text>
            </svg>
          </div>
        </div>

        {/* Ops card */}
        <div
          className={cn(
            'absolute bottom-16 left-1/2 w-[90%] max-w-[300px] -translate-x-1/2 transition-all duration-[1100ms] ease-civic sm:bottom-14 sm:left-auto sm:right-4 sm:translate-x-0',
            frame >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
          )}
        >
          <div className="rounded-xl border border-border bg-surface p-3 shadow-md">
            <div className="flex items-center justify-between gap-2">
              <p className="text-caption font-medium text-ink">Operations queue</p>
              <span className="font-mono text-[11px] text-ink-subtle">CASE-DEMO-28471</span>
            </div>
            <p className="mt-1 text-body-sm text-ink-muted">Roads · Ward 84 · Pothole</p>
            <div className="mt-3">
              <AnimatedCaseStatus
                activeIndex={frame === 5 ? 4 : frame === 4 ? 3 : 0}
                compact={false}
              />
            </div>
            {frame === 5 && (
              <div className="mt-3 flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-2">
                <Bell className="mt-0.5 h-3.5 w-3.5 text-green-700" aria-hidden />
                <div>
                  <p className="text-caption font-medium text-green-800">Citizen update</p>
                  <p className="text-[11px] text-green-700">
                    Your case is resolved. Thank you for reporting.
                  </p>
                </div>
                <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" aria-hidden />
              </div>
            )}
          </div>
        </div>
      </div>

      <p
        className="mt-4 text-center text-body-sm font-medium text-ink-muted transition-opacity duration-base"
        aria-live="polite"
      >
        {caption}
      </p>
      <div className="mt-2 flex justify-center gap-1.5" aria-hidden>
        {FRAMES.map((f, i) => (
          <span
            key={f.id}
            className={cn(
              'h-1 w-5 rounded-full transition-colors duration-base',
              i === frame ? 'bg-primary-600' : 'bg-neutral-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}
