'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { useAuth } from '@/components/providers/AuthProvider'
import { planningApi } from '@/lib/api/planning'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPublishingEnabledFor,
} from '@/lib/constants'
import {
  PLAN_DOCUMENT_KIND_LABEL,
  type PlanDocumentKind,
} from '@servesa/case-contract'

type DashboardResponse = {
  counts?: {
    documentsUploaded: number
    awaitingProcessing: number
    aiDraftsAwaitingReview: number
    approvedUnpublished: number
    publishedDocuments: number
    extractionFailed: number
  }
  completeness?: { availableCount: number; total: number }
  latestPlanningPeriod?: string | null
}

export default function OpsPlanningDocumentsPage() {
  const { municipalityCode } = useAuth()
  const muni = municipalityCode || 'JHB'
  const enabled = isMunicipalPublishingEnabledFor(muni)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!FEATURE_FLAGS.enableMunicipalPublishingEngine || !enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [dash, list] = await Promise.all([
        planningApi.getPublishingDashboard({ municipalityCode: muni }),
        planningApi.listEntities({
          municipalityCode: muni,
          entityType: 'document',
          citizenView: false,
        }),
      ])
      setDashboard(dash as DashboardResponse)
      setDocuments((list as { items?: Record<string, unknown>[] }).items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load documents')
    } finally {
      setLoading(false)
    }
  }, [muni, enabled])

  useEffect(() => {
    void load()
  }, [load])

  if (!FEATURE_FLAGS.enableMunicipalPublishingEngine) {
    return (
      <OpsShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Municipal Publishing Engine
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Disabled. Set{' '}
            <code>NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE=true</code>{' '}
            for pilot environments.
          </p>
        </div>
      </OpsShell>
    )
  }

  if (!enabled) {
    return (
      <OpsShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Municipal Publishing Engine
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Not enabled for municipality <strong>{muni}</strong>. Configure{' '}
            <code>NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST</code>.
          </p>
        </div>
      </OpsShell>
    )
  }

  return (
    <OpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-label text-primary-700">Ops · Planning</p>
            <h1 className="font-display text-2xl font-semibold text-ink">
              Official documents
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              Upload → extract → review → approve → publish. AI never
              auto-publishes. Municipality: <strong>{muni}</strong>
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/ops/planning">Planning overview</Link>
            </Button>
            <Button asChild>
              <Link href="/ops/planning/documents/upload">Upload document</Link>
            </Button>
          </div>
        </header>

        {dashboard?.counts ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Uploaded', dashboard.counts.documentsUploaded],
              ['Awaiting processing', dashboard.counts.awaitingProcessing],
              ['Drafts to review', dashboard.counts.aiDraftsAwaitingReview],
              ['Approved unpublished', dashboard.counts.approvedUnpublished],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-lg border border-border bg-surface p-3"
              >
                <p className="text-caption text-ink-subtle">{label}</p>
                <p className="font-display text-xl font-semibold text-ink">
                  {value}
                </p>
              </div>
            ))}
          </div>
        ) : null}

        {dashboard?.completeness ? (
          <p className="mb-4 text-sm text-ink-muted">
            Content completeness: {dashboard.completeness.availableCount} of{' '}
            {dashboard.completeness.total} citizen modules published
            {dashboard.latestPlanningPeriod
              ? ` · Latest period ${dashboard.latestPlanningPeriod}`
              : ''}
          </p>
        ) : null}

        {error ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}

        {loading ? (
          <Spinner label="Loading documents" />
        ) : documents.length === 0 ? (
          <p className="text-sm text-ink-muted">No uploaded documents yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {documents.map((doc) => {
              const id = String(doc.documentId || '')
              const kind = String(doc.kind || '') as PlanDocumentKind
              return (
                <li
                  key={id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-ink">{String(doc.title)}</p>
                    <p className="text-caption text-ink-subtle">
                      {PLAN_DOCUMENT_KIND_LABEL[kind] || kind} ·{' '}
                      {String(doc.fiscalYear)} ·{' '}
                      {String(doc.processingStatus || 'unknown')} ·{' '}
                      {String(doc.publicationStatus || 'draft')}
                    </p>
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/ops/planning/documents/${id}`}>Review</Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </OpsShell>
  )
}
