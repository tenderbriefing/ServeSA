'use client'

import { useId, useMemo } from 'react'
import { colour } from '@/lib/design-tokens'
import type { SourceReference } from '@servesa/case-contract'
import { SourceCitation } from './SourceCitation'

export type BudgetLineView = {
  budgetLineId: string
  categoryLabel: string
  plainLanguageLabel: string
  amount: {
    amountZar: number
    source?: SourceReference
  }
}

function formatZar(n: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n)
}

/**
 * Accessible budget visualisation — chart is never the sole channel.
 * Uses CSS bars; respects prefers-reduced-motion via CSS.
 */
export function BudgetBreakdown({ lines }: { lines: BudgetLineView[] }) {
  const titleId = useId()
  const total = useMemo(
    () => lines.reduce((s, l) => s + (l.amount?.amountZar || 0), 0),
    [lines]
  )

  if (!lines.length) {
    return (
      <p className="text-ink-muted" role="status">
        Not published yet
      </p>
    )
  }

  return (
    <div>
      <h3 id={titleId} className="sr-only">
        Budget allocation breakdown
      </h3>
      <p className="mb-4 text-sm text-ink-muted">
        Total of published budget lines:{' '}
        <strong className="text-ink">{formatZar(total)}</strong>. Amounts below
        include source references.
      </p>
      <ul className="space-y-4" aria-labelledby={titleId}>
        {lines.map((line) => {
          const amount = line.amount?.amountZar || 0
          const pct = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0
          return (
            <li key={line.budgetLineId}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-medium text-ink">
                  {line.plainLanguageLabel || line.categoryLabel}
                </span>
                <span className="tabular-nums text-ink">
                  {formatZar(amount)}{' '}
                  <span className="text-ink-subtle">({pct}%)</span>
                </span>
              </div>
              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-surface-muted"
                role="presentation"
                aria-hidden
              >
                <div
                  className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-500"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: colour.green[600],
                  }}
                />
              </div>
              {line.amount?.source ? (
                <div className="mt-1">
                  <SourceCitation source={line.amount.source} />
                </div>
              ) : (
                <p className="mt-1 text-xs text-ink-subtle">
                  Source: Data awaiting verification
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <table className="sr-only">
        <caption>Budget amounts by category</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Amount (ZAR)</th>
            <th scope="col">Share</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => {
            const amount = line.amount?.amountZar || 0
            const pct = total > 0 ? Math.round((amount / total) * 1000) / 10 : 0
            return (
              <tr key={`tbl-${line.budgetLineId}`}>
                <td>{line.plainLanguageLabel || line.categoryLabel}</td>
                <td>{amount}</td>
                <td>{pct}%</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
