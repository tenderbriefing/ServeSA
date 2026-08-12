'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Megaphone } from 'lucide-react'
import { communityApi } from '@/lib/api/community'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import { CitizenMunicipalityGate } from '@/components/municipality/CitizenMunicipalityGate'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { MUNICIPAL_UPDATE_TYPE_LABEL } from '@servesa/case-contract'
import { FEATURE_FLAGS } from '@/lib/constants'
import { getMunicipalityDisplayName } from '@/lib/southAfricaData'

type UpdateRow = {
  updateId: string
  type: string
  title: string
  summary: string
  status: string
  municipalityCode: string
  publishedByDisplayName?: string | null
  updatedAt?: string | null
  expectedRestorationAt?: string | null
  targeting?: { affectedAreaLabel?: string | null; wardIds?: string[] }
}

export default function UpdatesPage() {
  if (!FEATURE_FLAGS.enableCommunityEngagement) {
    return (
      <div className="container py-12">
        <p className="text-ink-muted">Municipal Updates are not enabled.</p>
      </div>
    )
  }

  return (
    <CitizenMunicipalityGate
      next="/updates"
      authTitle="Sign in to view Municipal Updates"
      authDescription="Municipal Updates are scoped to your confirmed municipality after you sign in."
      confirmTitle="Confirm your municipality for updates"
      confirmDescription="Serve SA shows verified local notices for your municipality only — never another municipality as a substitute."
    >
      <UpdatesContent />
    </CitizenMunicipalityGate>
  )
}

function UpdatesContent() {
  const { municipalityCode: muni, loading: muniLoading } =
    useCitizenMunicipality()
  const [updates, setUpdates] = useState<UpdateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')
  const displayName = getMunicipalityDisplayName(muni)

  useEffect(() => {
    if (muniLoading) return
    if (!muni) {
      setLoading(false)
      setUpdates([])
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = (await communityApi.listUpdates({
          municipalityCode: muni,
          citizenView: true,
          ...(typeFilter ? { type: typeFilter } : {}),
        })) as { updates?: UpdateRow[] }
        if (!cancelled) setUpdates(res.updates || [])
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Unable to load municipal updates'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [muni, muniLoading, typeFilter])

  return (
    <div className="bg-canvas">
      <section className="border-b border-border bg-surface py-10">
        <div className="container max-w-3xl">
          <p className="text-label font-display text-primary-700">
            Your Municipality · {displayName}
          </p>
          <h1 className="mt-2 font-display text-h1 text-ink">
            Verified information from your municipality
          </h1>
          <p className="mt-3 text-body text-ink-muted">
            Service alerts, planned work, and community notices — not a social
            feed.
          </p>
          <div className="mt-4">
            <label htmlFor="update-type" className="sr-only">
              Filter by type
            </label>
            <select
              id="update-type"
              className="min-h-touch rounded-md border border-border bg-surface px-3 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All types</option>
              {Object.entries(MUNICIPAL_UPDATE_TYPE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="container max-w-3xl py-8">
        {loading ? (
          <Spinner label="Loading updates…" />
        ) : error ? (
          <div className="rounded-md border border-danger-border bg-danger-tint p-4 text-danger">
            {error}
          </div>
        ) : updates.length === 0 ? (
          <div className="py-12 text-center text-ink-muted">
            <Megaphone className="mx-auto h-10 w-10 text-primary-600" aria-hidden />
            <p className="mt-4">
              No published updates for {displayName} yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {updates.map((u) => (
              <li key={u.updateId}>
                <Link
                  href={`/updates/${u.updateId}`}
                  className="block rounded-md border border-border bg-surface p-4 transition-colors hover:border-primary-200 hover:bg-primary-50/40"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary-100 text-primary-800">
                      {MUNICIPAL_UPDATE_TYPE_LABEL[
                        u.type as keyof typeof MUNICIPAL_UPDATE_TYPE_LABEL
                      ] || u.type}
                    </Badge>
                    <Badge variant="outline">{u.status}</Badge>
                  </div>
                  <h2 className="mt-2 font-display text-h4 text-ink">{u.title}</h2>
                  <p className="mt-1 text-body-sm text-ink-muted line-clamp-2">
                    {u.summary}
                  </p>
                  <p className="mt-3 text-caption text-ink-subtle">
                    {u.publishedByDisplayName || `Municipality ${u.municipalityCode}`}
                    {u.targeting?.affectedAreaLabel
                      ? ` · ${u.targeting.affectedAreaLabel}`
                      : ''}
                    {u.updatedAt
                      ? ` · Updated ${new Date(u.updatedAt).toLocaleDateString('en-ZA')}`
                      : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8">
          <Link href="/ideas">
            <Button variant="outline">Share an Idea instead</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
