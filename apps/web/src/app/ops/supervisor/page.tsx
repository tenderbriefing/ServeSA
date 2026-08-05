'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { opsApi } from '@/lib/opsApi'
import { useAuth } from '@/components/providers/AuthProvider'

export default function SupervisorBoardPage() {
  const { municipalityCode } = useAuth()
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!municipalityCode) return
    opsApi
      .supervisorBoard({})
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load board'))
  }, [municipalityCode])

  const counts = data?.counts || {}
  const cards: Array<{ key: string; label: string; count: number; href: string }> = [
    {
      key: 'unacknowledged',
      label: 'Unacknowledged',
      count: counts.unacknowledged || 0,
      href: '/ops?bucket=needs_ack',
    },
    {
      key: 'unassigned',
      label: 'Unassigned',
      count: counts.unassigned || 0,
      href: '/ops/cases',
    },
    {
      key: 'inProgress',
      label: 'In progress',
      count: counts.inProgress || 0,
      href: '/ops?bucket=in_progress',
    },
    {
      key: 'duplicateReviewsPending',
      label: 'Duplicate reviews',
      count: counts.duplicateReviewsPending || 0,
      href: '/ops?bucket=duplicate_review',
    },
    {
      key: 'triage',
      label: 'Routing triage',
      count: counts.triage || 0,
      href: '/ops?bucket=triage',
    },
    {
      key: 'reopened',
      label: 'Reopened',
      count: counts.reopened || 0,
      href: '/ops?bucket=reopened',
    },
    {
      key: 'readyForClosure',
      label: 'Ready for closure',
      count: counts.readyForClosure || 0,
      href: '/ops?bucket=ready_closure',
    },
    {
      key: 'highPriority',
      label: 'High priority',
      count: counts.highPriority || 0,
      href: '/ops?bucket=high_priority',
    },
  ]

  return (
    <OpsShell>
      <h1 className="mb-1 text-2xl font-semibold text-white">Supervisor Operations Board</h1>
      <p className="mb-6 text-sm text-slate-400">
        Actionable queues only — open a filtered work list from any metric.
      </p>
      {error && (
        <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.key}
            href={c.href}
            className="rounded-lg border border-slate-800 bg-[#151b22] p-4 hover:border-emerald-700"
          >
            <div className="text-3xl font-semibold text-white">{c.count}</div>
            <div className="mt-1 text-sm text-slate-400">{c.label}</div>
          </Link>
        ))}
      </div>
      <section className="mt-8 rounded-lg border border-slate-800 bg-[#151b22] p-4">
        <h2 className="mb-3 text-sm font-medium text-slate-300">Open workload by assignee</h2>
        <ul className="space-y-1 text-sm text-slate-300">
          {(data?.workload || []).map((w: { uid: string; openCases: number }) => (
            <li key={w.uid} className="flex justify-between">
              <span className="font-mono text-xs text-slate-500">{w.uid.slice(0, 12)}…</span>
              <span>{w.openCases}</span>
            </li>
          ))}
          {(!data?.workload || data.workload.length === 0) && (
            <li className="text-slate-500">No active assignments.</li>
          )}
        </ul>
      </section>
    </OpsShell>
  )
}
