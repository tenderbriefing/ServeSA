'use client'

import Link from 'next/link'
import { MUNICIPAL_UPDATE_TYPE_LABEL } from '@servesa/case-contract'
import { MotionReveal } from './motion/MotionReveal'
import { FEATURE_FLAGS } from '@/lib/constants'
import { cn } from '@/lib/utils'

type DemoUpdate = {
  org: string
  type: keyof typeof MUNICIPAL_UPDATE_TYPE_LABEL
  title: string
  when: string
  areas: string
}

const DEMO_UPDATES: DemoUpdate[] = [
  {
    org: 'Johannesburg Water',
    type: 'planned_maintenance',
    title: 'Planned maintenance',
    when: 'Wednesday · 08:00–16:00',
    areas: 'Midrand · Vorna Valley · Halfway Gardens',
  },
  {
    org: 'City Power',
    type: 'electricity_interruption',
    title: 'Electricity updates',
    when: 'Thursday · 09:00–14:00',
    areas: 'Alexandra · Wynberg',
  },
  {
    org: 'JRA',
    type: 'road_closure',
    title: 'Road closures',
    when: 'Friday · 06:00–18:00',
    areas: 'Sandton Drive · Grayston',
  },
  {
    org: 'City of Johannesburg',
    type: 'public_meeting',
    title: 'Community meetings',
    when: 'Saturday · 10:00',
    areas: 'Ward 84 community hall',
  },
  {
    org: 'Johannesburg Water',
    type: 'water_interruption',
    title: 'Water interruptions',
    when: 'Monday · 22:00–04:00',
    areas: 'Diepsloot Ext. 5',
  },
  {
    org: 'Development Planning',
    type: 'development_update',
    title: 'New developments',
    when: 'Programme update',
    areas: 'Corridor improvements · public facilities',
  },
]

/**
 * Municipal communications preview — clearly labelled demo content.
 */
export function MunicipalUpdatesPreview() {
  if (!FEATURE_FLAGS.enableCommunityEngagement) {
    return null
  }

  return (
    <section
      className="border-b border-border bg-surface py-14 sm:py-16"
      aria-labelledby="updates-heading"
    >
      <div className="container">
        <MotionReveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 id="updates-heading" className="font-display text-h2 text-ink">
              Your municipality can keep you informed.
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Verified municipal notices — not a social feed.
            </p>
            <p className="mt-2 text-caption text-ink-subtle">
              Example demo notices for illustration only.
            </p>
          </div>
        </MotionReveal>

        <div className="mx-auto grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_UPDATES.map((item, i) => (
            <MotionReveal key={item.title} delayMs={i * 60}>
              <article
                className={cn(
                  'h-full rounded-lg border border-border bg-canvas p-4 transition-shadow duration-base hover:shadow-sm'
                )}
              >
                <p className="text-caption font-medium text-primary-700">{item.org}</p>
                <h3 className="mt-1 font-display text-h4 text-ink">{item.title}</h3>
                <p className="mt-1 text-caption text-ink-subtle">
                  {MUNICIPAL_UPDATE_TYPE_LABEL[item.type]}
                </p>
                <p className="mt-3 text-body-sm text-ink">{item.when}</p>
                <p className="mt-2 text-body-sm text-ink-muted">
                  <span className="font-medium text-ink">Affected areas:</span>{' '}
                  {item.areas}
                </p>
              </article>
            </MotionReveal>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/updates"
            className="inline-flex min-h-touch items-center text-body-sm font-medium text-primary-700 underline-offset-4 hover:underline"
          >
            Browse municipal updates
          </Link>
        </div>
      </div>
    </section>
  )
}
