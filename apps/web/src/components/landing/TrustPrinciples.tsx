'use client'

import {
  Eye,
  MapPinned,
  Route,
  ShieldCheck,
  Workflow,
} from 'lucide-react'
import { MotionReveal } from './motion/MotionReveal'

const PRINCIPLES = [
  {
    title: 'Clear accountability',
    body: 'Every case has a traceable journey.',
    icon: Workflow,
  },
  {
    title: 'Correct routing',
    body: 'Location helps direct cases to the appropriate municipality.',
    icon: Route,
  },
  {
    title: 'Citizen visibility',
    body: 'Residents can follow progress.',
    icon: Eye,
  },
  {
    title: 'Operational clarity',
    body: 'Municipal teams receive structured cases instead of fragmented complaints.',
    icon: MapPinned,
  },
  {
    title: 'Privacy-aware',
    body: 'Citizen information must be handled responsibly.',
    icon: ShieldCheck,
  },
] as const

export function TrustPrinciples() {
  return (
    <section
      className="border-b border-border bg-surface py-14 sm:py-16"
      aria-labelledby="trust-heading"
    >
      <div className="container">
        <MotionReveal>
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <h2 id="trust-heading" className="font-display text-h2 text-ink">
              Designed for public service.
            </h2>
            <p className="mt-3 text-body-lg text-ink-muted">
              Platform principles for credible civic digital infrastructure.
            </p>
          </div>
        </MotionReveal>

        <ul className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => {
            const Icon = p.icon
            return (
              <MotionReveal key={p.title} delayMs={i * 50}>
                <li className="h-full rounded-lg border border-border bg-canvas p-4">
                  <Icon className="h-5 w-5 text-primary-600" aria-hidden />
                  <h3 className="mt-3 font-display text-h4 text-ink">{p.title}</h3>
                  <p className="mt-2 text-body-sm text-ink-muted">{p.body}</p>
                </li>
              </MotionReveal>
            )
          })}
        </ul>

        <MotionReveal>
          <div className="mx-auto mt-10 max-w-2xl rounded-md border border-info-border bg-info-tint p-4 text-body-sm text-info">
            <p className="font-medium">Is Serve SA official?</p>
            <p className="mt-1">
              Serve SA is a civic platform that routes reports to municipal
              teams. It is not a replacement for emergency services — if someone
              is in immediate danger, call the appropriate emergency number.
            </p>
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
