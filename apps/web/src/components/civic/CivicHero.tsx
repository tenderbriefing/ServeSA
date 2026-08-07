'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CivicMotif, CivicYDivider } from '@/components/civic/CivicMotif'
import { brandCopy } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

type CivicHeroProps = {
  className?: string
  primaryHref?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function CivicHero({
  className,
  primaryHref = '/report',
  secondaryHref = '/case',
  secondaryLabel = 'Track a Case',
}: CivicHeroProps) {
  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border bg-surface civic-topo',
        className
      )}
    >
      <CivicMotif variant="hero" />
      <div className="container relative py-14 sm:py-16 lg:py-22">
        <div className="mx-auto max-w-3xl text-center motion-safe:animate-civic-fade-up">
          <p className="text-label font-display text-primary-700">
            {brandCopy.name}
          </p>
          <h1 className="mt-3 font-display text-display text-ink sm:text-[3.25rem]">
            {brandCopy.motto}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-body-lg text-ink-muted">
            {brandCopy.tagline} Report local service issues, get a case number,
            and follow progress with your municipality — honestly and securely.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link href={primaryHref}>
              <Button
                size="lg"
                className="w-full min-h-touch bg-green-600 hover:bg-green-700 sm:w-auto"
              >
                Report an Issue
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Button>
            </Link>
            <Link href={secondaryHref}>
              <Button
                variant="outline"
                size="lg"
                className="w-full min-h-touch border-primary-200 text-primary-800 sm:w-auto"
              >
                {secondaryLabel}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-caption text-ink-subtle">
            {brandCopy.motifCaption}
          </p>
        </div>
      </div>
      <CivicYDivider />
    </section>
  )
}
