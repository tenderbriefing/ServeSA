'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/providers/AuthProvider'
import { OpsShell } from '@/components/ops/OpsShell'
import { StatusBadge } from '@/components/ui/StatusBadge'

type CaseRow = {
  id: string
  title: string
  status: string
  priority: string
  category: string
  wardId?: string
  assignedDepartmentName?: string
  assignedTo?: string
  routingPending?: boolean
  triageQueue?: boolean
}

const PAGE = 25

function OpsCasesInner() {
  const { user, municipalityCode } = useAuth()
  const params = useSearchParams()
  const [rows, setRows] = useState<CaseRow[]>([])
  const [cursor, setCursor] = useState<QueryDocumentSnapshot<DocumentData> | null>(
    null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState(params.get('status') || '')
  const [priorityFilter, setPriorityFilter] = useState(
    params.get('priority') || ''
  )
  const [mine, setMine] = useState(params.get('mine') === '1')
  const [triage, setTriage] = useState(params.get('triage') === '1')

  async function load(reset = false) {
    if (!municipalityCode) return
    setLoading(true)
    setError(null)
    try {
      const base = collection(db, 'cases')
      let q = query(
        base,
        where('muniCode', '==', municipalityCode),
        orderBy('createdAt', 'desc'),
        limit(PAGE)
      )
      if (triage) {
        q = query(
          base,
          where('muniCode', '==', municipalityCode),
          where('triageQueue', '==', true),
          orderBy('createdAt', 'desc'),
          limit(PAGE)
        )
      } else if (mine && user) {
        q = query(
          base,
          where('muniCode', '==', municipalityCode),
          where('assignedTo', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(PAGE)
        )
      } else if (statusFilter && !statusFilter.includes(',')) {
        q = query(
          base,
          where('muniCode', '==', municipalityCode),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
          limit(PAGE)
        )
      } else if (priorityFilter === 'high') {
        q = query(
          base,
          where('muniCode', '==', municipalityCode),
          where('priority', 'in', ['emergency', 'high']),
          orderBy('createdAt', 'desc'),
          limit(PAGE)
        )
      }
      if (!reset && cursor) {
        q = query(q, startAfter(cursor))
      }
      const snap = await getDocs(q)
      const next = snap.docs.map((d) => {
        const data = d.data()
        return {
          id: d.id,
          title: data.title || d.id,
          status: data.status,
          priority: data.priority,
          category: data.category,
          wardId: data.wardId,
          assignedDepartmentName: data.assignedDepartmentName,
          assignedTo: data.assignedTo,
          routingPending: data.routingPending,
          triageQueue: data.triageQueue,
        } as CaseRow
      })
      setRows((prev) => (reset ? next : [...prev, ...next]))
      setCursor(snap.docs[snap.docs.length - 1] || null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load cases')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setRows([])
    setCursor(null)
    load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalityCode, statusFilter, priorityFilter, mine, triage, user?.uid])

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cases</h1>
          <p className="text-sm text-ink-muted">Filter fast. Open. Act.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <select
            className="rounded-md border border-border bg-surface px-2 py-1.5"
            value={statusFilter}
            onChange={(e) => {
              setTriage(false)
              setMine(false)
              setStatusFilter(e.target.value)
            }}
          >
            <option value="">All statuses</option>
            {[
              'submitted',
              'acknowledged',
              'assigned',
              'in_progress',
              'resolved',
              'citizen_confirmed',
              'closed',
              'rejected',
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            className="rounded-md border border-border px-3 py-1.5"
            onClick={() => {
              setMine(true)
              setTriage(false)
              setStatusFilter('')
            }}
          >
            Mine
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5"
            onClick={() => {
              setTriage(true)
              setMine(false)
              setStatusFilter('')
            }}
          >
            Triage
          </button>
          <button
            className="rounded-md border border-border px-3 py-1.5"
            onClick={() => {
              setPriorityFilter(priorityFilter === 'high' ? '' : 'high')
              setMine(false)
              setTriage(false)
            }}
          >
            Urgent
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-3 rounded-md border border-warning-border bg-warning-tint px-3 py-2 text-sm text-warning">
          {error}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-muted text-ink-muted">
            <tr>
              <th className="px-3 py-2 font-medium">Case</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Ward</th>
              <th className="px-3 py-2 font-medium">Department</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-border hover:bg-surface/50">
                <td className="px-3 py-2">
                  <Link href={`/ops/case?id=${r.id}`} className="text-green-400 hover:underline">
                    {r.id}
                  </Link>
                  <div className="text-xs text-ink-subtle line-clamp-1">{r.title}</div>
                </td>
                <td className="px-3 py-2">
                  <StatusBadge status={r.status} />
                  {r.routingPending ? (
                    <span className="ml-2 text-xs text-warning">routing</span>
                  ) : null}
                </td>
                <td className="px-3 py-2">{r.priority}</td>
                <td className="px-3 py-2">{r.wardId || '—'}</td>
                <td className="px-3 py-2">{r.assignedDepartmentName || '—'}</td>
              </tr>
            ))}
            {!rows.length && !loading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink-subtle">
                  No cases in this queue.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button
          disabled={loading || !cursor}
          onClick={() => load(false)}
          className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-40"
        >
          {loading ? 'Loading…' : 'Load more'}
        </button>
      </div>
    </>
  )
}

export default function OpsCasesPage() {
  return (
    <OpsShell>
      <Suspense fallback={<div className="text-ink-muted">Loading…</div>}>
        <OpsCasesInner />
      </Suspense>
    </OpsShell>
  )
}
