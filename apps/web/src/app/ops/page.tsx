'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { OpsShell } from '@/components/ops/OpsShell'
import { opsApi } from '@/lib/opsApi'
import { useAuth } from '@/components/providers/AuthProvider'
import { StatusBadge } from '@/components/ui/StatusBadge'

type QueueItem = {
  caseId: string
  reference: string
  title: string
  category: string
  status: string
  priority: string
  wardId: string | null
  department: string | null
  assignee: string | null
  duplicateBadge: string | null
  bucket: string
  nextAction: string
}

const BUCKETS = [
  { id: '', label: 'All actions' },
  { id: 'needs_ack', label: 'Needs acknowledgement' },
  { id: 'duplicate_review', label: 'Duplicate review' },
  { id: 'assigned_to_me', label: 'Assigned to me' },
  { id: 'triage', label: 'Triage' },
  { id: 'high_priority', label: 'High priority' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'reopened', label: 'Reopened' },
  { id: 'ready_closure', label: 'Ready for closure' },
]

function SmartQueueInner() {
  const searchParams = useSearchParams()
  const { municipalityCode } = useAuth()
  const [items, setItems] = useState<QueueItem[]>([])
  const [bucket, setBucket] = useState(searchParams.get('bucket') || '')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setBucket(searchParams.get('bucket') || '')
  }, [searchParams])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await opsApi.smartQueue({
        ...(bucket ? { bucket } : {}),
        limit: 40,
      })
      setItems((res as any).items || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load queue')
    } finally {
      setLoading(false)
    }
  }, [bucket])

  useEffect(() => {
    if (municipalityCode) load()
  }, [municipalityCode, load])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.closest('input,textarea')) {
        e.preventDefault()
        document.getElementById('ops-search')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Smart Work Queue</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Deterministic next actions for {municipalityCode || 'your municipality'}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/ops/supervisor"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-muted"
          >
            Supervisor board
          </Link>
          <Link
            href="/ops/map"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-muted"
          >
            Map
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <input
          id="ops-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter' && search.trim().length >= 2) {
              try {
                const res = await opsApi.search({ q: search.trim() })
                setSearchResults((res as any).results || [])
              } catch (err: any) {
                setError(err?.message || 'Search failed')
              }
            }
          }}
          placeholder="Search cases (/) — reference, ward, category…"
          className="min-w-[240px] flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={load}
          className="rounded-md bg-surface-muted px-3 py-2 text-sm text-ink"
        >
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1">
        {BUCKETS.map((b) => (
          <button
            key={b.id || 'all'}
            type="button"
            onClick={() => {
              setBucket(b.id)
              setSearchResults(null)
            }}
            className={`rounded-md px-2.5 py-1 text-xs ${
              bucket === b.id
                ? 'bg-green-700 text-white'
                : 'bg-surface-muted text-ink-muted hover:bg-surface-muted'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {searchResults && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-3">
          <div className="mb-2 flex justify-between text-xs text-ink-muted">
            <span>Search results</span>
            <button type="button" onClick={() => setSearchResults(null)}>
              Clear
            </button>
          </div>
          <ul className="space-y-1">
            {searchResults.map((r) => (
              <li key={r.caseId}>
                <Link
                  href={`/ops/case?id=${encodeURIComponent(r.caseId)}`}
                  className="text-sm text-green-400 hover:underline"
                >
                  {r.caseId} · {r.title} · {r.status}
                </Link>
              </li>
            ))}
            {searchResults.length === 0 && (
              <li className="text-sm text-ink-subtle">No matches in municipality scope.</li>
            )}
          </ul>
        </div>
      )}

      {loading ? (
        <p className="text-ink-muted">Loading queue…</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.caseId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-subtle">
                  <span>{item.reference}</span>
                  <span>·</span>
                  <span>{item.bucket.replace(/_/g, ' ')}</span>
                  {item.duplicateBadge && (
                    <span className="rounded bg-warning-tint px-1.5 py-0.5 text-warning">
                      duplicate {item.duplicateBadge}
                    </span>
                  )}
                </div>
                <Link
                  href={`/ops/case?id=${encodeURIComponent(item.caseId)}`}
                  className="mt-0.5 block truncate font-medium text-white hover:text-green-300"
                >
                  {item.title}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <span>{item.category}</span>
                  <StatusBadge status={item.status} />
                  <span>ward {item.wardId || '—'}</span>
                  <span>{item.department || 'unassigned dept'}</span>
                </div>
              </div>
              <Link
                href={`/ops/case?id=${encodeURIComponent(item.caseId)}`}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-600"
              >
                {item.nextAction}
              </Link>
            </li>
          ))}
          {items.length === 0 && (
            <li className="text-sm text-ink-subtle">No actionable items in this bucket.</li>
          )}
        </ul>
      )}
    </>
  )
}

export default function OpsDashboardPage() {
  return (
    <OpsShell>
      <Suspense fallback={<p className="text-ink-muted">Loading queue…</p>}>
        <SmartQueueInner />
      </Suspense>
    </OpsShell>
  )
}
