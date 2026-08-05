'use client'

import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/providers/AuthProvider'
import { OpsShell } from '@/components/ops/OpsShell'

export default function OpsTeamPage() {
  const { municipalityCode } = useAuth()
  const [officials, setOfficials] = useState<any[]>([])
  const [departments, setDepartments] = useState<any[]>([])
  const [workload, setWorkload] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!municipalityCode) return
    ;(async () => {
      const [usersSnap, deptSnap, openCases] = await Promise.all([
        getDocs(
          query(
            collection(db, 'users'),
            where('municipalityCode', '==', municipalityCode)
          )
        ),
        getDocs(
          collection(db, 'municipalities', municipalityCode, 'departments')
        ),
        getDocs(
          query(
            collection(db, 'cases'),
            where('muniCode', '==', municipalityCode),
            where('status', 'in', [
              'assigned',
              'in_progress',
              'acknowledged',
            ])
          )
        ),
      ])
      setOfficials(usersSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setDepartments(deptSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
      const load: Record<string, number> = {}
      openCases.docs.forEach((d) => {
        const a = d.data().assignedTo
        if (a) load[a] = (load[a] || 0) + 1
      })
      setWorkload(load)
    })().catch(console.error)
  }, [municipalityCode])

  return (
    <OpsShell>
      <h1 className="mb-1 text-2xl font-semibold text-white">Team</h1>
      <p className="mb-6 text-sm text-slate-400">
        Officials, departments, and open workload.
      </p>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">Officials</h2>
          <ul className="space-y-2 text-sm">
            {officials.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between border-b border-slate-800 pb-2"
              >
                <div>
                  <div className="text-slate-100">
                    {o.displayName || o.email || o.id}
                  </div>
                  <div className="text-xs text-slate-500">
                    {(o.roles || []).join(', ') || o.role || 'official'}
                  </div>
                </div>
                <div className="tabular-nums text-slate-300">
                  {workload[o.id] || 0} open
                </div>
              </li>
            ))}
            {!officials.length && (
              <li className="text-slate-500">No officials listed yet.</li>
            )}
          </ul>
        </section>
        <section className="rounded-lg border border-slate-800 bg-[#151b22] p-4">
          <h2 className="mb-3 text-sm font-medium text-slate-300">Departments</h2>
          <ul className="space-y-2 text-sm">
            {departments.map((d) => (
              <li key={d.id} className="border-b border-slate-800 pb-2 text-slate-200">
                {d.name || d.id}
                {d.active === false ? (
                  <span className="ml-2 text-xs text-slate-500">inactive</span>
                ) : null}
              </li>
            ))}
            {!departments.length && (
              <li className="text-slate-500">
                Add departments in Settings.
              </li>
            )}
          </ul>
        </section>
      </div>
    </OpsShell>
  )
}
