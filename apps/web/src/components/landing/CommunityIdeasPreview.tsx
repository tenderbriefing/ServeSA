'use client'

import Link from 'next/link'
import { CITIZEN_IDEA_STATUS_LABEL } from '@servesa/case-contract'
import { MotionReveal } from './motion/MotionReveal'
import { FEATURE_FLAGS } from '@/lib/constants'
import { cn } from '@/lib/utils'

const DEMO_STATES = [
  { key: 'community_support' as const, detail: '42 residents support this idea' },
  { key: 'under_review' as const, detail: 'Municipality has acknowledged the idea' },
  { key: 'feasibility_review' as const, detail: 'Under structured review' },
] as const

/**
 * Community ideas — constructive civic participation, not social media.
 */
export function CommunityIdeasPreview() {
  if (!FEATURE_FLAGS.enableCommunityEngagement) {
    return null
  }

  return (
    <section
      className="border-b border-border bg-surface py-14 sm:py-16"
      aria-labelledby="ideas-heading"
    >
      <div className="container">
        <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-2">
          <MotionReveal>
            <h2 id="ideas-heading" className="font-display text-h2 text-ink">
              Good ideas can come from anywhere.
            </h2>
            <p className="mt-3 max-w-md text-body-lg text-ink-muted">
              Give residents a structured way to share ideas that can improve
              their communities.
            </p>
            <Link
              href="/ideas"
              className="mt-6 inline-flex min-h-touch items-center text-body-sm font-medium text-primary-700 underline-offset-4 hover:underline"
            >
              Explore community ideas
            </Link>
          </MotionReveal>

          <MotionReveal delayMs={80}>
            <article className="rounded-xl border border-border bg-canvas p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-caption font-medium text-green-700">Community Idea</p>
                <span className="text-[11px] text-ink-subtle">Example demo</span>
              </div>
              <blockquote className="mt-3 font-display text-h4 text-ink">
                “Turn the unused field near our school into a safe community
                sports area.”
              </blockquote>
              <p className="mt-2 text-caption text-ink-muted">
                Parks & Recreation · Example ward
              </p>
              <ul className="mt-5 space-y-2">
                {DEMO_STATES.map((state, i) => (
                  <li
                    key={state.key}
                    className={cn(
                      'rounded-md border px-3 py-2 transition-colors duration-base',
                      i === 0
                        ? 'border-green-200 bg-green-50'
                        : 'border-border bg-surface'
                    )}
                  >
                    <p className="text-caption font-medium text-ink">
                      {CITIZEN_IDEA_STATUS_LABEL[state.key]}
                    </p>
                    <p className="text-[11px] text-ink-muted">{state.detail}</p>
                  </li>
                ))}
              </ul>
            </article>
          </MotionReveal>
        </div>
      </div>
    </section>
  )
}
