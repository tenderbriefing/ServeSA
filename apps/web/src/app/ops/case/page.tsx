'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/providers/AuthProvider'
import { OpsShell } from '@/components/ops/OpsShell'
import { opsApi } from '@/lib/opsApi'
import { OFFICIAL_PRIMARY_ACTION } from '@servesa/case-contract'

function CaseDetailInner() {
  const search = useSearchParams()
  const caseId = String(search.get('id') || '')
  const { municipalityCode } = useAuth()
  const [caseDoc, setCaseDoc] = useState<any>(null)
  const [events, setEvents] = useState<any[]>([])
  const [notes, setNotes] = useState<any[]>([])
  const [updates, setUpdates] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [deptId, setDeptId] = useState('')
  const [note, setNote] = useState('')
  const [publicBody, setPublicBody] = useState('')
  const [resolution, setResolution] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  async function reload() {
    if (!caseId) return
    const snap = await getDoc(doc(db, 'cases', caseId))
    setCaseDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null)
    const [ev, nt, pu] = await Promise.all([
      getDocs(
        query(collection(db, 'cases', caseId, 'events'), orderBy('timestamp', 'desc'))
      ),
      getDocs(collection(db, 'cases', caseId, 'internal_notes')),
      getDocs(collection(db, 'cases', caseId, 'public_updates')),
    ])
    setEvents(ev.docs.map((d) => ({ id: d.id, ...d.data() })))
    setNotes(nt.docs.map((d) => ({ id: d.id, ...d.data() })))
    setUpdates(pu.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  useEffect(() => {
    reload().catch((e) => setMsg(e.message))
  }, [caseId])

  useEffect(() => {
    if (!municipalityCode) return
    getDocs(collection(db, 'municipalities', municipalityCode, 'departments')).then(
      (snap) => setDepartments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    )
  }, [municipalityCode])

  const primary = useMemo(() => {
    if (!caseDoc?.status) return null
    return (
      OFFICIAL_PRIMARY_ACTION[
        caseDoc.status as keyof typeof OFFICIAL_PRIMARY_ACTION
      ] || null
    )
  }, [caseDoc])

  if (!caseId) {
    return <div className="text-slate-400">Missing case id.</div>
  }
  if (!caseDoc) {
    return <div className="text-slate-400">Loading case…</div>
  }

  const loc = caseDoc.location || {}

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{caseDoc.id}</div>
          <h1 className="text-2xl font-semibold text-white">{caseDoc.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
            <span>{caseDoc.status}</span>
            <span>·</span>
            <span>{caseDoc.priority}</span>
            <span>·</span>
            <span>{caseDoc.category}</span>
            {caseDoc.routingPending && (
              <span className="text-amber-400">· routing pending / triage</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {primary?.nextStatus === 'assigned' && (
            <select
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
            >
              <option value="">Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name || d.id}
                </option>
              ))}
            </select>
          )}
          {primary?.nextStatus === 'resolved' && (
            <input
              className="w-72 rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm"
              placeholder="Resolution summary"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
          )}
          {primary && (
            <button
              disabled={
                busy ||
                (caseDoc.routingPending && primary.nextStatus === 'assigned')
              }
              onClick={async () => {
                setBusy(true)
                setMsg(null)
                try {
                  if (primary.nextStatus === 'assigned') {
                    if (!deptId) {
                      setMsg('Select a department first')
                      return
                    }
                    await opsApi.assign({ caseId, departmentId: deptId })
                  } else if (primary.nextStatus === 'resolved') {
                    if (!resolution.trim()) {
                      setMsg('Resolution summary required')
                      return
                    }
                    await opsApi.updateStatus({
                      caseId,
                      status: 'resolved',
                      resolutionSummary: resolution,
                    })
                  } else {
                    await opsApi.updateStatus({
                      caseId,
                      status: primary.nextStatus,
                    })
                  }
                  await reload()
                  setMsg('Updated')
                } catch (e: any) {
                  setMsg(e?.message || 'Action failed')
                } finally {
                  setBusy(false)
                }
              }}
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              {busy ? 'Working…' : primary.action}
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="mb-4 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200">
          {msg}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="space-y-4 lg:col-span-2">
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Description</h2>
            <p className="whitespace-pre-wrap text-sm text-slate-200">
              {caseDoc.description}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Location</h2>
            <p className="text-sm text-slate-300">
              {loc.address || `${loc.lat}, ${loc.lng}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Ward {caseDoc.wardId || '—'} · {caseDoc.muniCode || '—'} ·{' '}
              {loc.province || '—'}
            </p>
            {typeof loc.lat === 'number' && typeof loc.lng === 'number' && (
              <a
                className="mt-2 inline-block text-sm text-emerald-400 hover:underline"
                href={`https://www.openstreetmap.org/?mlat=${loc.lat}&mlon=${loc.lng}#map=17/${loc.lat}/${loc.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Open map
              </a>
            )}
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Timeline</h2>
            <ul className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="border-b border-slate-800/80 pb-2">
                  <div className="text-slate-200">{e.eventType}</div>
                  <div className="text-xs text-slate-500">{e.description}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Assignment</h2>
            <p className="text-sm">{caseDoc.assignedDepartmentName || 'Unassigned'}</p>
            <p className="text-xs text-slate-500">
              Official: {caseDoc.assignedTo || '—'}
            </p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Internal notes</h2>
            <ul className="mb-2 max-h-40 space-y-2 overflow-auto text-sm">
              {notes.map((n) => (
                <li key={n.id} className="text-slate-300">
                  {n.body}
                </li>
              ))}
            </ul>
            <textarea
              className="mb-2 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <button
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs"
              onClick={async () => {
                await opsApi.addNote({ caseId, body: note })
                setNote('')
                await reload()
              }}
            >
              Add note
            </button>
          </div>
          <div className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
            <h2 className="mb-2 text-sm font-medium text-slate-300">Public updates</h2>
            <ul className="mb-2 max-h-40 space-y-2 overflow-auto text-sm">
              {updates.map((u) => (
                <li key={u.id} className="text-slate-300">
                  {u.body}
                </li>
              ))}
            </ul>
            <textarea
              className="mb-2 w-full rounded-md border border-slate-700 bg-slate-900 p-2 text-sm"
              rows={2}
              value={publicBody}
              onChange={(e) => setPublicBody(e.target.value)}
            />
            <button
              className="rounded-md border border-slate-700 px-3 py-1.5 text-xs"
              onClick={async () => {
                await opsApi.addPublicUpdate({ caseId, body: publicBody })
                setPublicBody('')
                await reload()
              }}
            >
              Post update
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

export default function OpsCaseDetailPage() {
  return (
    <OpsShell>
      <Suspense fallback={<div className="text-slate-400">Loading…</div>}>
        <CaseDetailInner />
      </Suspense>
    </OpsShell>
  )
}
