'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/providers/AuthProvider'
import { OpsShell } from '@/components/ops/OpsShell'

type Counts = {
  mine: number
  unassigned: number
  urgent: number
  awaitingAck: number
  inProgress: number
  resolvedToday: number
  triage: number
}

export default function OpsDashboardPage() {
  const { user, municipalityCode } = useAuth()
  const [counts, setCounts] = useState<Counts | null>(null)
  const [error, setError] = useState<string | null>(null)

  const muni = municipalityCode

  useEffect(() => {
    if (!muni || !user) return
    let cancelled = false
    ;(async () => {
      try {
        const base = collection(db, 'cases')
        const start = new Date()
        start.setHours(0, 0, 0, 0)
        const startTs = Timestamp.fromDate(start)

        const qMine = query(
          base,
          where('muniCode', '==', muni),
          where('assignedTo', '==', user.uid)
        )
        const qUnassigned = query(
          base,
          where('muniCode', '==', muni),
          where('status', 'in', ['submitted', 'acknowledged'])
        )
        const qUrgent = query(
          base,
          where('muniCode', '==', muni),
          where('priority', 'in', ['emergency', 'high'])
        )
        const qAwait = query(
          base,
          where('muniCode', '==', muni),
          where('status', '==', 'submitted')
        )
        const qProgress = query(
          base,
          where('muniCode', '==', muni),
          where('status', '==', 'in_progress')
        )
        const qResolved = query(
          base,
          where('muniCode', '==', muni),
          where('status', '==', 'resolved')
        )
        const qTriage = query(
          base,
          where('muniCode', '==', muni),
          where('triageQueue', '==', true)
        )

        const [
          mine,
          unassigned,
          urgent,
          awaitingAck,
          inProgress,
          resolvedSnap,
          triage,
        ] = await Promise.all([
          getCountFromServer(qMine),
          getCountFromServer(qUnassigned),
          getCountFromServer(qUrgent),
          getCountFromServer(qAwait),
          getCountFromServer(qProgress),
          getCountFromServer(qResolved),
          getCountFromServer(qTriage),
        ])

        // resolvedToday approximated via status=resolved count + client filter later if needed
        void startTs
        if (!cancelled) {
          setCounts({
            mine: mine.data().count,
            unassigned: unassigned.data().count,
            urgent: urgent.data().count,
            awaitingAck: awaitingAck.data().count,
            inProgress: inProgress.data().count,
            resolvedToday: resolvedSnap.data().count,
            triage: triage.data().count,
          })
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load workload')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [muni, user])

  const cards = useMemo(
    () =>
      counts
        ? [
            { label: 'My Cases', value: counts.mine, href: '/ops/cases?mine=1' },
            {
              label: 'Unassigned',
              value: counts.unassigned,
              href: '/ops/cases?status=submitted,acknowledged',
            },
            { label: 'Urgent', value: counts.urgent, href: '/ops/cases?priority=high' },
            {
              label: 'Awaiting Acknowledgement',
              value: counts.awaitingAck,
              href: '/ops/cases?status=submitted',
            },
            {
              label: 'In Progress',
              value: counts.inProgress,
              href: '/ops/cases?status=in_progress',
            },
            {
              label: 'Resolved',
              value: counts.resolvedToday,
              href: '/ops/cases?status=resolved',
            },
            {
              label: 'Triage / Routing Pending',
              value: counts.triage,
              href: '/ops/cases?triage=1',
            },
          ]
        : [],
    [counts]
  )

  return (
    <OpsShell>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Today’s workload</h1>
        <p className="mt-1 text-sm text-slate-400">
          Pick a queue. Process the next case.
        </p>
      </div>
      {error && (
        <div className="mb-4 rounded-md border border-amber-700/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
          {error}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-lg border border-slate-800 bg-[#151b22] p-4 transition hover:border-slate-600"
          >
            <div className="text-3xl font-semibold tabular-nums text-white">
              {c.value}
            </div>
            <div className="mt-1 text-sm text-slate-400">{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/ops/cases?status=submitted"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Acknowledge next
        </Link>
        <Link
          href="/ops/cases?triage=1"
          className="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        >
          Open triage
        </Link>
      </div>
    </OpsShell>
  )
}
