'use client'

import { MotionReveal } from './motion/MotionReveal'
import { brandCopy } from '@/lib/design-tokens'

const LINES = [
  'A resident reports a problem.',
  'The municipality sees it.',
  'Someone takes responsibility.',
  'Progress becomes visible.',
  'Communities become part of improving where they live.',
] as const

export function NationalVision() {
  return (
    <section
      className="relative overflow-hidden border-b border-border bg-primary-900 text-white"
      aria-labelledby="vision-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 18% 30%, rgb(0 122 77 / 0.35), transparent 42%), radial-gradient(circle at 82% 70%, rgb(255 184 28 / 0.2), transparent 40%)',
        }}
      />
      <div className="container relative py-16 sm:py-20">
        <MotionReveal>
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-display text-label font-semibold text-gold-400">
              {brandCopy.name}
            </p>
            <h2
              id="vision-heading"
              className="mt-3 font-display text-h2 text-white sm:text-h1"
            >
              Imagine a different relationship between citizens and government.
            </h2>
            <ul className="mx-auto mt-8 max-w-lg space-y-3 text-left">
              {LINES.map((line) => (
                <li
                  key={line}
                  className="border-l-2 border-green-400/70 pl-4 text-body-lg text-white/90"
                >
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-10 font-display text-h4 text-gold-300">
              This is what Serve SA is building.
            </p>
          </div>
        </MotionReveal>
      </div>
    </section>
  )
}
