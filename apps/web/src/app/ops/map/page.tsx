'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { opsApi } from '@/lib/opsApi'
import { useAuth } from '@/components/providers/AuthProvider'

type Feature = {
  id: string
  lat: number
  lng: number
  status: string
  category: string
  priority: string
  wardId: string | null
  duplicatePending?: boolean
  label: string
}

export default function OpsMapPage() {
  const { municipalityCode } = useAuth()
  const [features, setFeatures] = useState<Feature[]>([])
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Feature | null>(null)

  useEffect(() => {
    if (!municipalityCode) return
    opsApi
      .mapCases({
        ...(status ? { status } : {}),
        ...(category ? { category } : {}),
        limit: 150,
      })
      .then((res: any) => setFeatures(res.features || []))
      .catch((e) => setError(e?.message || 'Map load failed'))
  }, [municipalityCode, status, category])

  const bounds = useMemo(() => {
    if (!features.length) return null
    const lats = features.map((f) => f.lat)
    const lngs = features.map((f) => f.lng)
    return {
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    }
  }, [features])

  const project = (lat: number, lng: number) => {
    if (!bounds) return { x: 50, y: 50 }
    const pad = 0.02
    const w = bounds.maxLng - bounds.minLng || 0.01
    const h = bounds.maxLat - bounds.minLat || 0.01
    const x = ((lng - bounds.minLng + pad) / (w + pad * 2)) * 100
    const y = (1 - (lat - bounds.minLat + pad) / (h + pad * 2)) * 100
    return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) }
  }

  return (
    <OpsShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Operations Map</h1>
          <p className="text-sm text-ink-muted">
            Authoritative case coordinates only · municipality scoped · no contact PII
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All open statuses</option>
            <option value="submitted">submitted</option>
            <option value="acknowledged">acknowledged</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
          </select>
          <select
            className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            <option value="roads">roads</option>
            <option value="water">water</option>
            <option value="electricity">electricity</option>
            <option value="waste">waste</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-900/50 bg-red-950/40 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="relative h-[480px] overflow-hidden rounded-lg border border-border bg-canvas lg:col-span-2">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />
          {features.map((f) => {
            const { x, y } = project(f.lat, f.lng)
            return (
              <button
                key={f.id}
                type="button"
                title={`${f.label} ${f.category} ${f.status}`}
                aria-label={`Case ${f.label}, ${f.category}, ${f.status}`}
                onClick={() => setSelected(f)}
                className={`absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 ${
                  f.duplicatePending
                    ? 'bg-amber-400'
                    : f.priority === 'emergency' || f.priority === 'high'
                      ? 'bg-rose-500'
                      : 'bg-green-500'
                }`}
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            )
          })}
          {features.length === 0 && (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-ink-subtle">
              No mappable cases for current filters.
            </p>
          )}
        </div>
        <aside className="rounded-lg border border-border bg-surface p-4">
          <h2 className="mb-2 text-sm font-medium text-ink-muted">
            {features.length} cases · markers use shape+label (colour secondary)
          </h2>
          {selected ? (
            <div className="space-y-2 text-sm text-ink">
              <div className="font-mono text-xs text-ink-subtle">{selected.label}</div>
              <div>
                {selected.category} · {selected.status} · {selected.priority}
              </div>
              <div className="text-xs text-ink-muted">
                Ward {selected.wardId || '—'} · {selected.lat.toFixed(5)},{' '}
                {selected.lng.toFixed(5)}
              </div>
              {selected.duplicatePending && (
                <div className="text-warning">Duplicate review pending</div>
              )}
              <Link
                href={`/ops/case?id=${encodeURIComponent(selected.id)}`}
                className="inline-block text-green-400 hover:underline"
              >
                Open case
              </Link>
              <a
                className="ml-3 inline-block text-ink-muted hover:underline"
                href={`https://www.openstreetmap.org/?mlat=${selected.lat}&mlon=${selected.lng}#map=17/${selected.lat}/${selected.lng}`}
                target="_blank"
                rel="noreferrer"
              >
                Navigate (OSM)
              </a>
            </div>
          ) : (
            <p className="text-sm text-ink-subtle">Select a marker for details.</p>
          )}
          <ul className="mt-4 max-h-64 space-y-1 overflow-auto text-xs text-ink-muted">
            {features.slice(0, 40).map((f) => (
              <li key={f.id}>
                <button
                  type="button"
                  className="text-left hover:text-green-300"
                  onClick={() => setSelected(f)}
                >
                  ● {f.label} · {f.category}
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </OpsShell>
  )
}
