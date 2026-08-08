'use client'

import { colour } from '@/lib/design-tokens'
import { DATA_CONFIDENCE_LABEL, type DataConfidence } from '@servesa/case-contract'
import { cn } from '@/lib/utils'

export type PlanningKpi = {
  id: string
  label: string
  value: number
  unit: 'count' | 'zar'
  confidence: DataConfidence | string
}

function formatValue(kpi: PlanningKpi): string {
  if (kpi.confidence === 'not_published') return '—'
  if (kpi.unit === 'zar') {
    if (!kpi.value) return 'Not published yet'
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(kpi.value)
  }
  return String(kpi.value)
}

export function PlanningKpiCards({ kpis }: { kpis: PlanningKpi[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {kpis.map((kpi, index) => (
        <li
          key={kpi.id}
          className={cn(
            'rounded-lg border border-border bg-surface p-4 motion-safe:animate-civic-fade-up',
            'transition-shadow duration-200 hover:shadow-sm'
          )}
          style={{
            animationDelay: `${Math.min(index, 5) * 40}ms`,
            borderTopColor: colour.blue[600],
            borderTopWidth: 3,
          }}
        >
          <p className="text-label text-ink-muted">{kpi.label}</p>
          <p className="mt-2 font-display text-2xl font-semibold tabular-nums text-ink">
            {formatValue(kpi)}
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            {DATA_CONFIDENCE_LABEL[kpi.confidence as DataConfidence] ||
              'Data awaiting verification'}
          </p>
        </li>
      ))}
    </ul>
  )
}
