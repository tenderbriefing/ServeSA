'use client'

import Link from 'next/link'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CivicMotif } from '@/components/civic/CivicMotif'
import { brandCopy } from '@/lib/design-tokens'
import { trackLandingEvent } from '@/lib/telemetry/landing'
import { HeroProductFilm } from './HeroProductFilm'
import { cn } from '@/lib/utils'

type LandingHeroProps = {
  className?: string
  trackHref?: string
  trackLabel?: string
}

export function LandingHero({
  className,
  trackHref = '/case',
  trackLabel = 'Track a Case',
}: LandingHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border bg-surface civic-topo',
        className
      )}
      aria-labelledby="landing-hero-heading"
    >
      <CivicMotif variant="panel" className="translate-x-[18%] opacity-70 sm:translate-x-[28%]" />
      <div className="container relative z-10 py-12 sm:py-14 lg:py-18">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="relative z-10">
            <p className="font-display text-label font-semibold tracking-wide text-primary-700">
              {brandCopy.name}
            </p>
            <h1
              id="landing-hero-heading"
              className="mt-3 font-display text-[2.15rem] font-semibold leading-[1.15] tracking-tight text-ink sm:text-[2.75rem] lg:text-[3.1rem]"
            >
              Your community.
              <br />
              Your municipality.
              <br />
              <span className="text-primary-700">Connected.</span>
            </h1>
            <p className="mt-5 max-w-md text-body-lg text-ink-muted">
              Report service-delivery issues, track progress and stay connected
              to what is happening in your municipality.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                href="/report"
                onClick={() => trackLandingEvent('hero_report_click')}
              >
                <Button
                  size="lg"
                  className="group w-full min-h-touch bg-green-600 hover:bg-green-700 sm:w-auto"
                >
                  Report an Issue
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-fast group-hover:translate-x-0.5" aria-hidden />
                </Button>
              </Link>
              <a
                href="#how-it-works"
                onClick={() => trackLandingEvent('hero_how_it_works_click')}
                className="inline-flex"
              >
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full min-h-touch border-primary-200 text-primary-800 sm:w-auto"
                >
                  See How Serve SA Works
                  <ArrowDown className="ml-2 h-4 w-4" aria-hidden />
                </Button>
              </a>
              <Link
                href={trackHref}
                onClick={() => trackLandingEvent('hero_track_case_click')}
                className="text-center text-body-sm font-medium text-primary-700 underline-offset-4 hover:underline sm:ml-1 sm:text-left"
              >
                {trackLabel}
              </Link>
            </div>
            <p className="mt-6 text-caption text-ink-subtle">
              {brandCopy.tagline}
            </p>
          </div>

          <div className="relative z-10">
            <HeroProductFilm />
          </div>
        </div>
      </div>
    </section>
  )
}
