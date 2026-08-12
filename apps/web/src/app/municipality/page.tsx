'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Building2, Lightbulb } from 'lucide-react'
import { planningApi } from '@/lib/api/planning'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import { AuthGate } from '@/components/Auth/AuthGate'
import { ConfirmMunicipalityPanel } from '@/components/municipality/ConfirmMunicipalityPanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPlanningEnabledFor,
} from '@/lib/constants'
import {
  PLANNING_EMPTY_COPY,
  PLAN_DOCUMENT_KIND_LABEL,
  type PlanDocumentKind,
} from '@servesa/case-contract'
import { ProjectCard, type ProjectCardModel } from '@/components/planning/ProjectCard'
import { ServeSaSummaryBanner } from '@/components/planning/SourceCitation'
import { trackPlanningEvent } from '@/lib/telemetry/planning'
import { trackPublishingEvent } from '@/lib/telemetry/publishing'
import {
  getMunicipalityDisplayName,
  getProvinceByMunicipality,
} from '@/lib/southAfricaData'

const BudgetBreakdown = dynamic(
  () =>
    import('@/components/planning/BudgetBreakdown').then((m) => m.BudgetBreakdown),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-ink-muted" role="status">
        Loading budget breakdown…
      </p>
    ),
  }
)

type SummaryResponse = {
  municipalityCode: string
  priorities: Array<{
    priorityId: string
    title: string
    plainLanguageSummary: string
    isServeSaSummary?: boolean
    budgeted?: { amountZar: number } | null
    sources?: unknown[]
  }>
  projects: ProjectCardModel[]
  budgetLines: Array<{
    budgetLineId: string
    fiscalYear?: string
    categoryLabel: string
    plainLanguageLabel: string
    amount: { amountZar: number; source?: never }
  }>
  documents?: Array<{
    documentId: string
    title: string
    kind?: string
    fiscalYear?: string | null
    officialUrl?: string | null
    publishedStoragePath?: string | null
    publishedAt?: string | null
  }>
  empty: boolean
  emptyCopy?: string
  emptyBody?: string
}

function formatZar(n: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n)
}

function resolveFiscalYearLabel(
  lines: SummaryResponse['budgetLines']
): string | null {
  const years = [
    ...new Set(
      lines
        .map((l) => (l.fiscalYear || '').trim())
        .filter(Boolean)
    ),
  ]
  if (years.length === 1) return `${years[0]} Municipal Budget`
  if (years.length > 1) return 'Municipal budget (multiple financial years)'
  return null
}

function pickNamedBudgetMetrics(lines: SummaryResponse['budgetLines']) {
  const find = (re: RegExp) =>
    lines.find((l) =>
      re.test(`${l.plainLanguageLabel} ${l.categoryLabel}`)
    )
  const total = find(/total\s+(municipal\s+)?budget|municipal\s+budget\s+total/i)
  const operating = find(/operating\s+budget/i)
  const capital = find(/capital\s+budget/i)
  const infra = find(/infrastructure/i)
  return { total, operating, capital, infra }
}

function MunicipalitySnapshotContent({
  municipalityCode,
}: {
  municipalityCode: string
}) {
  const enabled = isMunicipalPlanningEnabledFor(municipalityCode)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const displayName = getMunicipalityDisplayName(municipalityCode)
  const province = getProvinceByMunicipality(municipalityCode)

  useEffect(() => {
    if (!FEATURE_FLAGS.enableMunicipalPlanning || !enabled) {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        // Municipality snapshot only — never pass citizen ward into planning summary
        const res = (await planningApi.getSummary({
          municipalityCode,
        })) as SummaryResponse
        if (!cancelled) {
          setSummary(res)
          trackPlanningEvent('municipal_planning_page_viewed', {
            municipalityCode,
            empty: Boolean(res.empty),
          })
          trackPublishingEvent('municipality_page_viewed', { municipalityCode })
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load municipality snapshot'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [municipalityCode, enabled])

  const fiscalYearLabel = useMemo(
    () => resolveFiscalYearLabel(summary?.budgetLines || []),
    [summary]
  )
  const namedBudget = useMemo(
    () => pickNamedBudgetMetrics(summary?.budgetLines || []),
    [summary]
  )

  if (!FEATURE_FLAGS.enableMunicipalPlanning || !enabled) {
    return (
      <div className="container max-w-xl space-y-3 py-12">
        <p className="text-label font-display text-primary-700">My Municipality</p>
        <h1 className="font-display text-h2 text-ink">{displayName}</h1>
        {province ? (
          <p className="text-body text-ink-muted">{province.name}</p>
        ) : null}
        <h2 className="pt-2 font-display text-h3 text-ink">
          Municipal information coming soon
        </h2>
        <p className="text-ink-muted" role="status">
          We have identified your municipality. Verified planning and budget
          information has not yet been activated for this municipality on Serve
          SA.
        </p>
        <p className="text-body-sm text-ink-subtle">
          You can still report issues and track cases. Serve SA never shows
          another municipality&apos;s plans in place of yours.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild>
            <Link href="/report">Report an Issue</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/updates">Municipal Updates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">Change municipality</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-canvas">
      <section className="border-b border-border bg-surface py-8">
        <div className="container max-w-xl">
          <p className="text-label font-display text-primary-700">My Municipality</p>
          <h1 className="mt-2 flex items-start gap-2 font-display text-h1 text-ink">
            <Building2
              className="mt-1 h-7 w-7 shrink-0 text-primary-600"
              aria-hidden
            />
            <span>{displayName}</span>
          </h1>
          {province ? (
            <p className="mt-2 text-body text-ink-muted">{province.name}</p>
          ) : null}
          <p className="mt-3 text-body-sm text-ink-subtle">
            What your municipality plans to do and where its money is going —
            from verified official documents only.
          </p>
        </div>
      </section>

      <div className="container max-w-xl space-y-10 py-8">
        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Spinner />
            <span className="sr-only">Loading municipality snapshot</span>
          </div>
        ) : null}

        {error ? (
          <p className="text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && summary?.empty ? (
          <div className="space-y-3">
            <h2 className="font-display text-h3 text-ink">
              {summary.emptyCopy ||
                PLANNING_EMPTY_COPY.municipalitySnapshotComingSoon}
            </h2>
            <p className="text-ink-muted">
              {summary.emptyBody ||
                PLANNING_EMPTY_COPY.municipalitySnapshotComingSoonBody}
            </p>
            <p className="text-body-sm text-ink-subtle">
              You can still report issues and track cases. Serve SA never shows
              another municipality&apos;s plans in place of yours.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button asChild>
                <Link href="/report">Report an Issue</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/updates">Municipal Updates</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/account">Change municipality</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && summary && !summary.empty ? (
          <>
            <section aria-labelledby="snapshot-heading">
              <h2 id="snapshot-heading" className="font-display text-h2 text-ink">
                Municipality Snapshot
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Verified official municipal information only.
              </p>
            </section>

            {(namedBudget.total ||
              namedBudget.operating ||
              namedBudget.capital ||
              namedBudget.infra ||
              summary.budgetLines?.length) ? (
              <section aria-labelledby="budget-heading">
                <h2 id="budget-heading" className="font-display text-h2 text-ink">
                  {fiscalYearLabel || 'Municipal budget'}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Figures appear only when published from verified official
                  documents.
                </p>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    namedBudget.total && {
                      id: 'total',
                      label: 'Total municipal budget',
                      amount: namedBudget.total.amount.amountZar,
                    },
                    namedBudget.operating && {
                      id: 'operating',
                      label: 'Operating budget',
                      amount: namedBudget.operating.amount.amountZar,
                    },
                    namedBudget.capital && {
                      id: 'capital',
                      label: 'Capital budget',
                      amount: namedBudget.capital.amount.amountZar,
                    },
                    namedBudget.infra && {
                      id: 'infra',
                      label: 'Infrastructure investment',
                      amount: namedBudget.infra.amount.amountZar,
                    },
                  ]
                    .filter(Boolean)
                    .map((metric) => {
                      const m = metric as {
                        id: string
                        label: string
                        amount: number
                      }
                      return (
                        <li
                          key={m.id}
                          className="rounded-lg border border-border bg-surface p-4"
                          style={{ borderTopColor: 'rgb(0 35 149)', borderTopWidth: 3 }}
                        >
                          <p className="text-label text-ink-muted">{m.label}</p>
                          <p className="mt-2 font-display text-xl font-semibold tabular-nums text-ink">
                            {formatZar(m.amount)}
                          </p>
                        </li>
                      )
                    })}
                </ul>
              </section>
            ) : null}

            <section aria-labelledby="allocations-heading">
              <h2
                id="allocations-heading"
                className="font-display text-h2 text-ink"
              >
                Where the money goes
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Categories shown only when the municipality&apos;s verified
                budget supports them.
              </p>
              <div className="mt-4">
                <BudgetBreakdown lines={summary.budgetLines || []} />
              </div>
            </section>

            <section aria-labelledby="priorities-heading">
              <h2
                id="priorities-heading"
                className="font-display text-h2 text-ink"
              >
                What your municipality plans to do
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Major priorities from verified planning documents.
              </p>
              {!summary.priorities?.length ? (
                <p className="mt-4 text-ink-muted">
                  {PLANNING_EMPTY_COPY.notPublished}
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {summary.priorities.map((p) => (
                    <li
                      key={p.priorityId}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-ink-subtle">
                          Priority
                        </p>
                        {p.budgeted?.amountZar ? (
                          <p className="text-xs font-medium text-primary-700">
                            Budgeted · {formatZar(p.budgeted.amountZar)}
                          </p>
                        ) : null}
                      </div>
                      <h3 className="mt-1 font-display text-lg font-semibold text-ink">
                        {p.title}
                      </h3>
                      <ServeSaSummaryBanner show={p.isServeSaSummary !== false} />
                      <p className="mt-2 text-sm text-ink-muted">
                        {p.plainLanguageSummary}
                      </p>
                      <div className="mt-3">
                        <Button asChild variant="secondary" size="sm">
                          <Link
                            href="/ideas/new"
                            onClick={() =>
                              trackPlanningEvent(
                                'municipal_planning_priority_cta',
                                { municipalityCode }
                              )
                            }
                          >
                            <Lightbulb className="mr-1.5 h-4 w-4" aria-hidden />
                            Share an idea on this priority
                          </Link>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="projects-heading">
              <h2 id="projects-heading" className="font-display text-h2 text-ink">
                Major plans and projects
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                A small set of major published items — status only when
                officially supported.
              </p>
              {!summary.projects?.length ? (
                <p className="mt-4 text-ink-muted">
                  {PLANNING_EMPTY_COPY.notPublished}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.projects.map((project) => (
                    <li key={project.projectId}>
                      <ProjectCard project={project} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="sources-heading">
              <h2 id="sources-heading" className="font-display text-h2 text-ink">
                Official sources
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Documents used for this Municipality Snapshot.
              </p>
              {!summary.documents?.length ? (
                <p className="mt-4 text-ink-muted">
                  {PLANNING_EMPTY_COPY.notPublished}
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.documents.map((doc) => {
                    const kindLabel =
                      PLAN_DOCUMENT_KIND_LABEL[
                        doc.kind as PlanDocumentKind
                      ] || doc.kind
                    return (
                      <li
                        key={doc.documentId}
                        className="border-b border-border pb-3 last:border-0"
                      >
                        {doc.officialUrl ? (
                          <a
                            href={doc.officialUrl}
                            className="text-sm font-medium text-primary-700 underline"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() =>
                              trackPublishingEvent('source_document_opened', {
                                documentId: doc.documentId,
                                municipalityCode,
                              })
                            }
                          >
                            {doc.title}
                          </a>
                        ) : (
                          <span className="text-sm font-medium text-ink">
                            {doc.title}
                          </span>
                        )}
                        <p className="mt-1 text-xs text-ink-subtle">
                          {[
                            kindLabel,
                            doc.fiscalYear ? `Period ${doc.fiscalYear}` : null,
                            displayName,
                            doc.publishedAt
                              ? `Verified ${new Date(doc.publishedAt).toLocaleDateString('en-ZA')}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="border-t border-border pt-6">
              <h2 className="font-display text-lg font-semibold text-ink">
                Stay connected locally
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Follow updates and share ideas for this municipality.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild>
                  <Link href="/report">Report an Issue</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/updates">Municipal Updates</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link
                    href="/ideas/new"
                    onClick={() =>
                      trackPlanningEvent('municipal_planning_idea_cta', {
                        municipalityCode,
                      })
                    }
                  >
                    Share an Idea
                  </Link>
                </Button>
              </div>
            </section>
          </>
        ) : null}
      </div>
    </div>
  )
}

function MunicipalityAuthenticatedView() {
  const resolution = useCitizenMunicipality()
  const municipalityCode = resolution.municipalityCode

  if (resolution.loading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <Spinner label="Loading your municipality…" />
      </div>
    )
  }

  if (!municipalityCode) {
    return (
      <div className="bg-canvas py-12">
        <div className="container">
          <ConfirmMunicipalityPanel />
        </div>
      </div>
    )
  }

  return <MunicipalitySnapshotContent municipalityCode={municipalityCode} />
}

/**
 * My Municipality — authenticated citizens with a confirmed municipality.
 * Municipality-level snapshot only. Never uses ward for planning content.
 * Never falls back to JHB for anonymous or unresolved users.
 */
export default function MunicipalityPage() {
  return (
    <AuthGate
      next="/municipality"
      title="Sign in to view My Municipality"
      description="Your municipality snapshot — plans, budget and priorities — is available after you sign in and confirm your municipality. Reporting an issue does not require an account."
    >
      <MunicipalityAuthenticatedView />
    </AuthGate>
  )
}
