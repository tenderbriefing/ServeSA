'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MotionReveal } from './motion/MotionReveal'
import { trackLandingEvent } from '@/lib/telemetry/landing'
import { brandCopy } from '@/lib/design-tokens'
import { FEATURE_FLAGS } from '@/lib/constants'

type FinalCTAProps = {
  signedIn?: boolean
}

export function FinalCTA({ signedIn = false }: FinalCTAProps) {
  return (
    <section className="bg-canvas py-14 sm:py-16" aria-labelledby="final-cta-heading">
      <div className="container">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <h2 id="final-cta-heading" className="font-display text-h2 text-ink">
              Help improve your community.
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Report. Communicate. Understand. Participate. Resolve.
            </p>
            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link
                href="/report"
                onClick={() => trackLandingEvent('final_report_click')}
              >
                <Button
                  size="lg"
                  className="w-full min-h-touch bg-green-600 hover:bg-green-700 sm:w-auto"
                >
                  Report an Issue
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </Link>
              <Link href="/case">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-touch sm:w-auto"
                >
                  Track a Case
                </Button>
              </Link>
            </div>
            <div className="mt-6 flex flex-col items-center gap-2 text-body-sm">
              {FEATURE_FLAGS.enableMunicipalPlanning && (
                <Link
                  href="/municipality"
                  className="font-medium text-primary-700 underline-offset-4 hover:underline"
                >
                  Explore Your Municipality
                </Link>
              )}
              <Link
                href={signedIn ? '/dashboard' : '/auth/signin'}
                className="text-ink-muted underline-offset-4 hover:underline"
              >
                {signedIn ? 'Open My Cases' : 'For Municipalities — Sign in'}
              </Link>
            </div>
            <p className="mt-8 text-caption text-ink-subtle">{brandCopy.tagline}</p>
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
