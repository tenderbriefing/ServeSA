'use client'

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/components/providers/AuthProvider'
import { OpsShell } from '@/components/ops/OpsShell'
import { opsApi } from '@/lib/opsApi'

const CATEGORIES = [
  'water',
  'electricity',
  'roads',
  'waste',
  'internet',
  'emergency',
]

export default function OpsSettingsPage() {
  const { municipalityCode, isAdmin, refreshClaims } = useAuth()
  const [departments, setDepartments] = useState<any[]>([])
  const [maps, setMaps] = useState<Record<string, string>>({})
  const [deptId, setDeptId] = useState('roads')
  const [deptName, setDeptName] = useState('Roads')
  const [claimUid, setClaimUid] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  async function reload() {
    if (!municipalityCode) return
    const [deps, mapSnap] = await Promise.all([
      getDocs(collection(db, 'municipalities', municipalityCode, 'departments')),
      getDocs(
        collection(db, 'municipalities', municipalityCode, 'category_department_map')
      ),
    ])
    setDepartments(deps.docs.map((d) => ({ id: d.id, ...d.data() })))
    const m: Record<string, string> = {}
    mapSnap.docs.forEach((d) => {
      m[d.id] = String(d.data().departmentId || '')
    })
    setMaps(m)
  }

  useEffect(() => {
    reload().catch(console.error)
  }, [municipalityCode])

  if (!municipalityCode) {
    return (
      <OpsShell>
        <p className="text-warning">
          Your account has no municipality claim. An admin must provision access.
        </p>
      </OpsShell>
    )
  }

  return (
    <OpsShell>
      <h1 className="mb-1 text-2xl font-semibold text-white">Settings</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Municipality {municipalityCode} — departments and category routing.
      </p>
      {msg && (
        <div className="mb-4 rounded-md border border-border bg-surface px-3 py-2 text-sm">
          {msg}
        </div>
      )}

      <section className="mb-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-ink-muted">Departments</h2>
        <div className="mb-3 flex flex-wrap gap-2">
          <input
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            value={deptId}
            onChange={(e) => setDeptId(e.target.value)}
            placeholder="department id"
          />
          <input
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            value={deptName}
            onChange={(e) => setDeptName(e.target.value)}
            placeholder="name"
          />
          <button
            className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white"
            onClick={async () => {
              await opsApi.upsertDepartment({
                municipalityCode,
                departmentId: deptId,
                name: deptName,
              })
              setMsg('Department saved')
              await reload()
            }}
          >
            Save department
          </button>
        </div>
        <ul className="text-sm text-ink-muted">
          {departments.map((d) => (
            <li key={d.id}>
              {d.id} — {d.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8 rounded-lg border border-border bg-surface p-4">
        <h2 className="mb-3 text-sm font-medium text-ink-muted">
          Category → department
        </h2>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <div key={cat} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-ink-muted">{cat}</span>
              <select
                className="rounded-md border border-border bg-surface px-2 py-1"
                value={maps[cat] || ''}
                onChange={async (e) => {
                  const departmentId = e.target.value
                  if (!departmentId) return
                  await opsApi.upsertCategoryMap({
                    municipalityCode,
                    category: cat,
                    departmentId,
                  })
                  setMaps((prev) => ({ ...prev, [cat]: departmentId }))
                  setMsg(`Mapped ${cat}`)
                }}
              >
                <option value="">Triage (unmapped)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.id}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </section>

      {isAdmin && (
        <section className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-3 text-sm font-medium text-ink-muted">
            Provision official (admin)
          </h2>
          <div className="flex flex-wrap gap-2">
            <input
              className="min-w-[280px] rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
              value={claimUid}
              onChange={(e) => setClaimUid(e.target.value)}
              placeholder="Firebase Auth UID"
            />
            <button
              className="rounded-md bg-green-600 px-3 py-1.5 text-sm text-white"
              onClick={async () => {
                await opsApi.setOfficialClaims({
                  uid: claimUid,
                  roles: ['official'],
                  municipalityCode,
                })
                await refreshClaims()
                setMsg('Claims set — user must refresh session')
              }}
            >
              Grant official access
            </button>
          </div>
        </section>
      )}
    </OpsShell>
  )
}
