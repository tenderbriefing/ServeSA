'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Camera, CheckCircle2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { DeviceFrame } from './DeviceFrame'
import { MotionReveal } from './motion/MotionReveal'
import { usePrefersReducedMotion } from './motion/usePrefersReducedMotion'
import { trackLandingEvent } from '@/lib/telemetry/landing'
import { cn } from '@/lib/utils'

const STEPS = ['What', 'Where', 'Who', 'Done'] as const

/**
 * Embedded simulation of the real Serve SA report wizard:
 * What → Where → Who → Done
 */
export function CitizenReportDemo() {
  const reduced = usePrefersReducedMotion()
  const [step, setStep] = useState(0)
  const completedRef = useRef(false)

  useEffect(() => {
    if (reduced) {
      setStep(3)
      if (!completedRef.current) {
        completedRef.current = true
        trackLandingEvent('report_demo_complete')
      }
      return
    }
    const t = window.setInterval(() => {
      setStep((s) => {
        const next = (s + 1) % STEPS.length
        if (next === 3 && !completedRef.current) {
          completedRef.current = true
          trackLandingEvent('report_demo_complete')
        }
        return next
      })
    }, 2600)
    return () => window.clearInterval(t)
  }, [reduced])

  return (
    <section
      className="border-b border-border bg-surface py-14 sm:py-16"
      aria-labelledby="report-demo-heading"
    >
      <div className="container">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <MotionReveal>
            <h2 id="report-demo-heading" className="font-display text-h2 text-ink">
              Reporting should be this simple.
            </h2>
            <p className="mt-3 max-w-md text-body-lg text-ink-muted">
              The same journey citizens use in Serve SA: describe the issue,
              confirm location, add contact details and a photo, then receive a
              case number.
            </p>
            <ol className="mt-6 flex flex-wrap gap-2" aria-label="Report steps">
              {STEPS.map((label, i) => (
                <li
                  key={label}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-caption font-medium transition-colors duration-base',
                    i === step
                      ? 'border-green-600 bg-green-50 text-green-800'
                      : i < step
                        ? 'border-primary-200 bg-primary-50 text-primary-800'
                        : 'border-border bg-canvas text-ink-subtle'
                  )}
                >
                  {label}
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Link
                href="/report"
                onClick={() => trackLandingEvent('report_demo_cta_click')}
              >
                <Button size="lg" className="min-h-touch bg-green-600 hover:bg-green-700">
                  Report an Issue
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
            </div>
          </MotionReveal>

          <MotionReveal delayMs={120}>
            <DeviceFrame label="Serve SA report wizard preview" className="max-w-[300px]">
              <div className="min-h-[380px] space-y-3 p-4 pt-7">
                <div className="flex items-center justify-between">
                  <p className="text-caption font-semibold text-primary-700">Serve SA</p>
                  <p className="text-[11px] text-ink-subtle">
                    Step {Math.min(step + 1, 4)} of 4
                  </p>
                </div>

                {step === 0 && (
                  <div className="space-y-3 motion-safe:animate-civic-fade-up">
                    <p className="font-display text-sm font-semibold text-ink">What happened?</p>
                    <div className="rounded-md border-2 border-green-600 bg-green-50 px-3 py-2.5">
                      <p className="text-body-sm font-medium text-green-900">
                        Roads & Infrastructure
                      </p>
                      <p className="text-caption text-green-700">
                        Potholes, damaged roads, stormwater
                      </p>
                    </div>
                    <div className="rounded-md border border-border px-3 py-2 opacity-60">
                      <p className="text-body-sm text-ink">Water & Sewage</p>
                    </div>
                    <div className="rounded-md border border-border px-3 py-2 opacity-60">
                      <p className="text-body-sm text-ink">Electricity</p>
                    </div>
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3 motion-safe:animate-civic-fade-up">
                    <p className="font-display text-sm font-semibold text-ink">Where is it?</p>
                    <div className="overflow-hidden rounded-md border border-border bg-primary-50">
                      <svg viewBox="0 0 240 140" className="w-full" aria-hidden>
                        <rect width="240" height="140" fill="rgb(213 219 243)" />
                        <path d="M0 100 H240" stroke="rgb(168 165 156)" strokeWidth="14" />
                        <circle cx="120" cy="78" r="8" fill="rgb(222 56 49)" />
                        <circle cx="120" cy="78" r="18" fill="none" stroke="rgb(222 56 49)" strokeWidth="2" opacity="0.4" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2 text-caption text-ink-muted">
                      <MapPin className="h-3.5 w-3.5 text-primary-600" aria-hidden />
                      Example area · Sample city
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3 motion-safe:animate-civic-fade-up">
                    <p className="font-display text-sm font-semibold text-ink">Who should we contact?</p>
                    <div className="rounded-md border border-border bg-surface px-3 py-2">
                      <p className="text-[11px] text-ink-subtle">Contact</p>
                      <p className="text-body-sm text-ink">Citizen · Optional account</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-neutral-200">
                        <Camera className="h-5 w-5 text-ink-muted" aria-hidden />
                      </div>
                      <div>
                        <p className="text-caption font-medium text-ink">Photo required</p>
                        <p className="text-[11px] text-ink-subtle">1 photo attached</p>
                      </div>
                      <CheckCircle2 className="ml-auto h-4 w-4 text-green-600" aria-hidden />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3 motion-safe:animate-civic-fade-up">
                    <div className="flex justify-center pt-4">
                      <CheckCircle2 className="h-10 w-10 text-green-600" aria-hidden />
                    </div>
                    <p className="text-center font-display text-sm font-semibold text-ink">
                      Report submitted
                    </p>
                    <div className="rounded-md border border-primary-200 bg-primary-50 px-3 py-3 text-center">
                      <p className="text-[11px] text-primary-700">Your case number</p>
                      <p className="font-mono text-base font-semibold text-primary-900">
                        CASE-DEMO-28471
                      </p>
                      <p className="mt-1 text-[10px] text-ink-subtle">Example demo reference</p>
                    </div>
                    <p className="text-center text-caption text-ink-muted">
                      Use this number to track progress.
                    </p>
                  </div>
                )}
              </div>
            </DeviceFrame>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
