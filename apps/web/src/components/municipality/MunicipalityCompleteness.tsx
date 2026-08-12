'use client'

import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MunicipalityModuleStatus = {
  id: string
  label: string
  available: boolean
  href?: string
}

type MunicipalityCompletenessProps = {
  modules: MunicipalityModuleStatus[]
  className?: string
}

/**
 * Lightweight published-module availability — counts only, no invented scores.
 */
export function MunicipalityCompleteness({
  modules,
  className,
}: MunicipalityCompletenessProps) {
  const availableCount = modules.filter((m) => m.available).length
  const total = modules.length

  return (
    <section
      className={cn('rounded-lg border border-border bg-surface p-4', className)}
      aria-labelledby="muni-completeness-heading"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id="muni-completeness-heading"
          className="font-display text-h4 text-ink"
        >
          Municipality information
        </h2>
        <p className="text-caption text-ink-subtle">
          {availableCount} of {total} sections available
        </p>
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {modules.map((mod) => {
          const Icon = mod.available ? CheckCircle2 : Circle
          const content = (
            <>
              <Icon
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  mod.available ? 'text-green-600' : 'text-ink-subtle'
                )}
                aria-hidden
              />
              <span>
                <span className="font-medium text-ink">{mod.label}</span>
                <span className="mt-0.5 block text-caption text-ink-subtle">
                  {mod.available ? 'Available' : 'Not published yet'}
                </span>
              </span>
            </>
          )
          return (
            <li key={mod.id}>
              {mod.href && mod.available ? (
                <Link
                  href={mod.href}
                  className="flex items-start gap-2 rounded-md border border-border px-3 py-2 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                >
                  {content}
                </Link>
              ) : (
                <div className="flex items-start gap-2 rounded-md border border-transparent px-3 py-2">
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
