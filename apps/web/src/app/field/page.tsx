'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/providers/AuthProvider'
import { opsApi } from '@/lib/opsApi'

type Job = {
  caseId: string
  reference: string
  category: string
  status: string
  priority: string
  title: string
  location: { lat: number | null; lng: number | null; address: string | null }
  hasMedia: boolean
}

export default function FieldWorkerPage() {
  const { user, loading, isOfficial, municipalityCode } = useAuth()
  const [tab, setTab] = useState<'today' | 'map' | 'done'>('today')
  const [jobs, setJobs] = useState<Job[]>([])
  const [error, setError] = useState<string | null>(null)
  const [offline, setOffline] = useState(false)
  const [draftNote, setDraftNote] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine)
    sync()
    window.addEventListener('online', sync)
    window.addEventListener('offline', sync)
    return () => {
      window.removeEventListener('online', sync)
      window.removeEventListener('offline', sync)
    }
  }, [])

  useEffect(() => {
    if (!user || !municipalityCode) return
    // Cache last jobs for offline view
    const cached = localStorage.getItem('servesa.field.jobs')
    if (cached) {
      try {
        setJobs(JSON.parse(cached))
      } catch {
        /* ignore */
      }
    }
    if (!navigator.onLine) return
    opsApi
      .fieldJobs({ limit: 40 })
      .then((res: any) => {
        setJobs(res.jobs || [])
        localStorage.setItem('servesa.field.jobs', JSON.stringify(res.jobs || []))
      })
      .catch((e) => setError(e?.message || 'Failed to load jobs'))
  }, [user, municipalityCode])

  useEffect(() => {
    const d = localStorage.getItem('servesa.field.draftNote')
    if (d) setDraftNote(d)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        Checking access…
      </div>
    )
  }
  if (!user || !isOfficial) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 px-4">
        <p className="text-slate-700">Sign in with a field or official account.</p>
        <Link href="/auth/signin?next=/field" className="text-emerald-700 underline">
          Sign in
        </Link>
      </div>
    )
  }

  const active = jobs.filter((j) => !['resolved', 'closed', 'rejected', 'citizen_confirmed'].includes(j.status))
  const done = jobs.filter((j) => ['resolved', 'closed', 'citizen_confirmed'].includes(j.status))
  const list = tab === 'done' ? done : active

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-slate-50 pb-24 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Field</h1>
          <span className="text-xs text-slate-500">{municipalityCode}</span>
        </div>
        {offline && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Offline — showing cached jobs. Drafts save locally; lifecycle waits for server.
          </p>
        )}
      </header>

      <nav className="flex border-b border-slate-200 bg-white">
        {(
          [
            ['today', 'Today'],
            ['map', 'Map'],
            ['done', 'Completed'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-3 text-sm font-medium ${
              tab === id ? 'border-b-2 border-emerald-600 text-emerald-800' : 'text-slate-500'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && <p className="px-4 py-2 text-sm text-red-600">{error}</p>}
      {msg && <p className="px-4 py-2 text-sm text-emerald-700">{msg}</p>}

      {tab === 'map' ? (
        <div className="space-y-2 p-4">
          {active.map((j) =>
            j.location.lat != null && j.location.lng != null ? (
              <a
                key={j.caseId}
                className="block rounded-lg border border-slate-200 bg-white p-4 text-base"
                href={`https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${j.location.lat}%2C${j.location.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Navigate · {j.reference} · {j.category}
              </a>
            ) : null
          )}
        </div>
      ) : (
        <ul className="space-y-3 p-4">
          {list.map((j) => (
            <li key={j.caseId} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-slate-500">{j.reference}</div>
              <div className="mt-1 text-lg font-medium">{j.title}</div>
              <div className="mt-1 text-sm text-slate-600">
                {j.category} · {j.status} · {j.priority}
              </div>
              {j.location.address && (
                <div className="mt-2 text-sm text-slate-500">{j.location.address}</div>
              )}
              <div className="mt-4 grid grid-cols-2 gap-2">
                {j.location.lat != null && (
                  <a
                    className="rounded-lg bg-slate-900 px-3 py-3 text-center text-sm font-medium text-white"
                    href={`https://www.openstreetmap.org/?mlat=${j.location.lat}&mlon=${j.location.lng}#map=18/${j.location.lat}/${j.location.lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Navigate
                  </a>
                )}
                <button
                  type="button"
                  disabled={offline || busyId === j.caseId}
                  className="rounded-lg bg-emerald-600 px-3 py-3 text-sm font-medium text-white disabled:opacity-40"
                  onClick={async () => {
                    setBusyId(j.caseId)
                    setMsg(null)
                    try {
                      await opsApi.startFieldWork({ caseId: j.caseId })
                      setMsg('Work started (server confirmed)')
                      const res = await opsApi.fieldJobs({})
                      setJobs((res as any).jobs || [])
                    } catch (e: any) {
                      setMsg(e?.message || 'Start failed')
                    } finally {
                      setBusyId(null)
                    }
                  }}
                >
                  Start work
                </button>
                <button
                  type="button"
                  disabled={offline || busyId === j.caseId}
                  className="col-span-2 rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium disabled:opacity-40"
                  onClick={async () => {
                    setBusyId(j.caseId)
                    try {
                      await opsApi.proposeCompletion({
                        caseId: j.caseId,
                        note: draftNote || undefined,
                      })
                      setMsg('Completion proposed — awaiting official')
                      localStorage.removeItem('servesa.field.draftNote')
                      setDraftNote('')
                    } catch (e: any) {
                      setMsg(e?.message || 'Propose failed')
                    } finally {
                      setBusyId(null)
                    }
                  }}
                >
                  Propose completion
                </button>
              </div>
            </li>
          ))}
          {list.length === 0 && (
            <li className="text-center text-sm text-slate-500">No jobs in this view.</li>
          )}
        </ul>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white p-3">
        <label className="block text-xs text-slate-500">Draft note (offline-safe)</label>
        <textarea
          className="mt-1 w-full rounded-md border border-slate-300 p-2 text-sm"
          rows={2}
          value={draftNote}
          onChange={(e) => {
            setDraftNote(e.target.value)
            localStorage.setItem('servesa.field.draftNote', e.target.value)
          }}
          placeholder="Notes sync when you propose completion online"
        />
      </div>
    </div>
  )
}
