'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { useAuth } from '@/components/providers/AuthProvider'
import { planningApi } from '@/lib/api/planning'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  PLAN_DOCUMENT_KIND_LABEL,
  MUNICIPAL_PROJECT_STATUS_LABEL,
  type PlanDocumentKind,
  type MunicipalProjectStatus,
} from '@servesa/case-contract'
import { FEATURE_FLAGS, isMunicipalPublishingEnabledFor } from '@/lib/constants'

type Tab = 'documents' | 'priorities' | 'projects' | 'budgets'

const TABS: { id: Tab; label: string }[] = [
  { id: 'documents', label: 'Documents' },
  { id: 'priorities', label: 'Priorities' },
  { id: 'projects', label: 'Projects' },
  { id: 'budgets', label: 'Budgets' },
]

const ENTITY_MAP: Record<Tab, 'document' | 'priority' | 'project' | 'budget_line'> =
  {
    documents: 'document',
    priorities: 'priority',
    projects: 'project',
    budgets: 'budget_line',
  }

export default function OpsPlanningPage() {
  const { municipalityCode } = useAuth()
  const muni = municipalityCode?.trim() || null
  const publishingEnabled = muni
    ? isMunicipalPublishingEnabledFor(muni)
    : false
  const [tab, setTab] = useState<Tab>('documents')
  const [items, setItems] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!muni) {
      setLoading(false)
      setItems([])
      setError('Municipality claim required for ops planning.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = (await planningApi.listEntities({
        municipalityCode: muni,
        entityType: ENTITY_MAP[tab],
        citizenView: false,
      })) as { items?: Record<string, unknown>[] }
      setItems(res.items || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load planning data')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [muni, tab])

  useEffect(() => {
    void load()
  }, [load])

  async function transition(
    entityId: string,
    toStatus: string,
    entityType: 'document' | 'priority' | 'project' | 'budget_line'
  ) {
    setBusyId(entityId)
    setMessage(null)
    try {
      await planningApi.transitionStatus({
        entityType,
        entityId,
        toStatus,
      })
      setMessage(`Moved ${entityId} → ${toStatus}`)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transition failed')
    } finally {
      setBusyId(null)
    }
  }

  function entityIdOf(item: Record<string, unknown>): string {
    return String(
      item.documentId ||
        item.priorityId ||
        item.projectId ||
        item.budgetLineId ||
        ''
    )
  }

  return (
    <OpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Municipal Planning
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Review documents, priorities, projects, and budgets. Verify before
            publish — AI drafts never auto-publish. Municipality:{' '}
            <strong>{muni || 'not assigned'}</strong>
          </p>
          {!FEATURE_FLAGS.enableMunicipalPlanning ? (
            <p className="mt-2 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs text-ink-muted">
              Citizen flag is OFF. Ops may still prepare drafts; citizens will not
              see published content until{' '}
              <code>NEXT_PUBLIC_ENABLE_MUNICIPAL_PLANNING</code> is left enabled
              (default) or explicitly set to <code>true</code>.
            </p>
          ) : null}
          {FEATURE_FLAGS.enableMunicipalPublishingEngine && publishingEnabled ? (
            <p className="mt-3">
              <Button asChild size="sm" variant="outline">
                <Link href="/ops/planning/documents">Document publishing engine</Link>
              </Button>
            </p>
          ) : null}
        </header>

        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Planning entities">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={
                tab === t.id
                  ? 'rounded-md bg-primary-600 px-3 py-2 text-sm text-white'
                  : 'rounded-md bg-surface-muted px-3 py-2 text-sm text-ink-muted hover:text-ink'
              }
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {message ? (
          <p className="mb-3 text-sm text-green-800" role="status">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="mb-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {loading ? (
          <div className="flex justify-center py-12" role="status">
            <Spinner />
          </div>
        ) : (
          <ul className="space-y-3">
            {!items.length ? (
              <li className="rounded-lg border border-border bg-surface p-4 text-ink-muted">
                No {tab} yet. Create drafts via planning callables / seed tools —
                no demo numbers are hard-coded here.
              </li>
            ) : null}
            {items.map((item) => {
              const id = entityIdOf(item)
              const status = String(item.publicationStatus || 'draft')
              const title = String(
                item.title || item.plainLanguageLabel || item.categoryLabel || id
              )
              return (
                <li
                  key={id}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-medium text-ink">{title}</h2>
                      <p className="mt-1 text-xs text-ink-subtle">{id}</p>
                      {tab === 'documents' && item.kind ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          {PLAN_DOCUMENT_KIND_LABEL[
                            item.kind as PlanDocumentKind
                          ] || String(item.kind)}
                        </p>
                      ) : null}
                      {tab === 'projects' && item.status ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          Project status:{' '}
                          {MUNICIPAL_PROJECT_STATUS_LABEL[
                            item.status as MunicipalProjectStatus
                          ] || String(item.status)}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant="outline">{status}</Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {status === 'draft' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === id}
                        onClick={() =>
                          transition(id, 'awaiting_review', ENTITY_MAP[tab])
                        }
                      >
                        Submit for review
                      </Button>
                    ) : null}
                    {status === 'awaiting_review' ? (
                      <>
                        <Button
                          size="sm"
                          disabled={busyId === id}
                          onClick={() =>
                            transition(id, 'verified', ENTITY_MAP[tab])
                          }
                        >
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={busyId === id}
                          onClick={() =>
                            transition(id, 'draft', ENTITY_MAP[tab])
                          }
                        >
                          Return to draft
                        </Button>
                      </>
                    ) : null}
                    {status === 'verified' ? (
                      <Button
                        size="sm"
                        disabled={busyId === id}
                        onClick={() =>
                          transition(id, 'published', ENTITY_MAP[tab])
                        }
                      >
                        Publish
                      </Button>
                    ) : null}
                    {status === 'published' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busyId === id}
                        onClick={() =>
                          transition(id, 'archived', ENTITY_MAP[tab])
                        }
                      >
                        Unpublish (archive)
                      </Button>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        <section className="mt-10 rounded-lg border border-dashed border-border p-4 text-sm text-ink-muted">
          <h2 className="font-medium text-ink">Ingestion pipeline</h2>
          <p className="mt-1">
            document → ingestion → extract → structured model → validation →
            human verify → publish. AI may assist summarisation only; budgets,
            dates, %, status, ward, and expenditure remain human-verified.
          </p>
        </section>
      </div>
    </OpsShell>
  )
}
