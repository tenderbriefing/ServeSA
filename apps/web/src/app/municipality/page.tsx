'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Building2, Lightbulb } from 'lucide-react'
import { planningApi } from '@/lib/api/planning'
import { useAuth } from '@/hooks/useAuth'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import { AuthGate } from '@/components/Auth/AuthGate'
import { ConfirmMunicipalityPanel } from '@/components/municipality/ConfirmMunicipalityPanel'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPlanningEnabledFor,
} from '@/lib/constants'
import { PLANNING_EMPTY_COPY, PLANNING_CONTENT_MODULE_LABEL } from '@servesa/case-contract'
import { PlanningKpiCards, type PlanningKpi } from '@/components/planning/PlanningKpiCards'
import { ProjectCard, type ProjectCardModel } from '@/components/planning/ProjectCard'
import { ServeSaSummaryBanner } from '@/components/planning/SourceCitation'
import { MunicipalityCompleteness } from '@/components/municipality/MunicipalityCompleteness'
import { trackPlanningEvent } from '@/lib/telemetry/planning'
import { trackPublishingEvent } from '@/lib/telemetry/publishing'
import { getMunicipalityDisplayName } from '@/lib/southAfricaData'

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
  wardId?: string | null
  kpis: PlanningKpi[]
  priorities: Array<{
    priorityId: string
    title: string
    plainLanguageSummary: string
    isServeSaSummary?: boolean
    progressPercent?: number | null
    budgeted?: { amountZar: number } | null
    sources?: unknown[]
  }>
  projects: ProjectCardModel[]
  budgetLines: Array<{
    budgetLineId: string
    categoryLabel: string
    plainLanguageLabel: string
    amount: { amountZar: number; source?: never }
  }>
  community: {
    wardId: string | null
    wardMappingAvailable: boolean
    wardProjects: ProjectCardModel[]
    emptyCopy: string | null
  }
  documents?: Array<{
    documentId: string
    title: string
    kind?: string
    officialUrl?: string | null
    publishedStoragePath?: string | null
  }>
  empty: boolean
  emptyCopy: string
}

function MunicipalityPlanningContent({
  municipalityCode,
  wardId,
}: {
  municipalityCode: string
  wardId: string | null
}) {
  const enabled = isMunicipalPlanningEnabledFor(municipalityCode)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const displayName = getMunicipalityDisplayName(municipalityCode)

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
        const res = (await planningApi.getSummary({
          municipalityCode,
          wardId,
        })) as SummaryResponse
        if (!cancelled) {
          setSummary(res)
          trackPlanningEvent('municipal_planning_page_viewed', {
            municipalityCode,
            hasWard: Boolean(wardId),
            empty: Boolean(res.empty),
          })
          trackPublishingEvent('municipality_page_viewed', { municipalityCode })
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load municipal planning summary'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [municipalityCode, wardId, enabled])

  if (!FEATURE_FLAGS.enableMunicipalPlanning || !enabled) {
    return (
      <div className="container py-12">
        <p className="text-ink-muted" role="status">
          Our Municipality planning summary is not enabled for this area yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-canvas">
      <section className="border-b border-border bg-surface py-10">
        <div className="container max-w-3xl">
          <p className="mt-1 text-label font-display text-primary-700">
            Your Municipality
          </p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-h1 text-ink">
            <Building2 className="h-8 w-8 shrink-0 text-primary-600" aria-hidden />
            {displayName}
          </h1>
          <p className="mt-3 text-body text-ink-muted">
            Understand what your municipality plans to deliver and how those
            plans affect your community — based on verified official documents,
            not social posts.
          </p>
          {wardId ? (
            <p className="mt-2 text-sm text-ink-subtle">
              Ward reference <strong className="text-ink">{wardId}</strong>
            </p>
          ) : null}
        </div>
      </section>

      <div className="container max-w-3xl space-y-12 py-10">
        {!loading ? (
          <MunicipalityCompleteness
            modules={[
              {
                id: 'municipality_overview',
                label: PLANNING_CONTENT_MODULE_LABEL.municipality_overview,
                available: Boolean(summary && !summary.empty),
              },
              {
                id: 'strategic_priorities',
                label: PLANNING_CONTENT_MODULE_LABEL.strategic_priorities,
                available: Boolean(summary?.priorities?.length),
              },
              {
                id: 'idp_summary',
                label: PLANNING_CONTENT_MODULE_LABEL.idp_summary,
                available: Boolean(summary?.priorities?.length),
              },
              {
                id: 'budget_overview',
                label: PLANNING_CONTENT_MODULE_LABEL.budget_overview,
                available: Boolean(summary?.budgetLines?.length),
              },
              {
                id: 'capital_projects',
                label: PLANNING_CONTENT_MODULE_LABEL.capital_projects,
                available: Boolean(summary?.projects?.length),
              },
              {
                id: 'service_delivery_priorities',
                label: PLANNING_CONTENT_MODULE_LABEL.service_delivery_priorities,
                available: false,
              },
              {
                id: 'service_contacts',
                label: PLANNING_CONTENT_MODULE_LABEL.service_contacts,
                available: false,
              },
            ]}
          />
        ) : null}

        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Spinner />
            <span className="sr-only">Loading municipal planning</span>
          </div>
        ) : null}

        {error ? (
          <p className="text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && !error && summary?.empty ? (
          <div className="rounded-lg border border-border bg-surface p-6">
            <p className="text-label font-display text-primary-700">Your Municipality</p>
            <h2 className="mt-1 font-display text-h3 text-ink">{displayName}</h2>
            <h3 className="mt-4 font-display text-h4 text-ink">
              Planning information is not available yet
            </h3>
            <p className="mt-2 text-ink-muted">
              Your municipality&apos;s verified planning information has not yet
              been published on Serve SA.
            </p>
            <p className="mt-3 text-body-sm text-ink-subtle">
              Serve SA only publishes information verified from official municipal
              documents. We will not show another municipality’s plans in its
              place.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/updates">Municipal Updates</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/ideas">Community Ideas</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/report">Report an Issue</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/account">Change municipality</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {!loading && summary && !summary.empty ? (
          <>
            <section aria-labelledby="overview-heading">
              <h2 id="overview-heading" className="font-display text-h2 text-ink">
                Municipality overview
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Figures come only from published, verified municipal data.
              </p>
              <div className="mt-4">
                <PlanningKpiCards kpis={summary.kpis || []} />
              </div>
            </section>

            <section aria-labelledby="priorities-heading">
              <h2 id="priorities-heading" className="font-display text-h2 text-ink">
                Key priorities
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                What the municipality says it will focus on — in everyday
                language.
              </p>
              {!summary.priorities?.length ? (
                <p className="mt-4 text-ink-muted">Not published yet</p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {summary.priorities.map((p) => (
                    <li
                      key={p.priorityId}
                      className="rounded-lg border border-border bg-surface p-4"
                    >
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {p.title}
                      </h3>
                      <ServeSaSummaryBanner show={p.isServeSaSummary !== false} />
                      <p className="mt-2 text-sm text-ink-muted">
                        {p.plainLanguageSummary}
                      </p>
                      {typeof p.progressPercent === 'number' ? (
                        <p className="mt-2 text-xs text-ink-subtle">
                          Progress: {p.progressPercent}%
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-ink-subtle">
                          Progress: Not published yet
                        </p>
                      )}
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

            <section aria-labelledby="budget-heading">
              <h2 id="budget-heading" className="font-display text-h2 text-ink">
                Budget highlights
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Published budget lines with source references for every amount.
              </p>
              <div className="mt-4 rounded-lg border border-border bg-surface p-4">
                <BudgetBreakdown lines={summary.budgetLines || []} />
              </div>
            </section>

            <section aria-labelledby="projects-heading">
              <h2 id="projects-heading" className="font-display text-h2 text-ink">
                Planned projects
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Structured municipal projects with official statuses only.
              </p>
              {!summary.projects?.length ? (
                <p className="mt-4 text-ink-muted">Not published yet</p>
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

            <section aria-labelledby="community-heading">
              <h2 id="community-heading" className="font-display text-h2 text-ink">
                Your community
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Ward-specific projects when official documents include ward
                mapping.
              </p>
              {summary.community?.emptyCopy ? (
                <p className="mt-4 text-ink-muted">{summary.community.emptyCopy}</p>
              ) : !summary.community?.wardProjects?.length ? (
                <p className="mt-4 text-ink-muted">Not published yet</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {summary.community.wardProjects.map((project) => (
                    <li key={project.projectId}>
                      <ProjectCard project={project} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {summary.documents?.length ? (
              <section aria-labelledby="sources-heading">
                <h2 id="sources-heading" className="font-display text-h2 text-ink">
                  Official source documents
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Verified municipal documents behind this summary.
                </p>
                <ul className="mt-4 space-y-2">
                  {summary.documents.map((doc) => (
                    <li key={doc.documentId}>
                      {doc.officialUrl ? (
                        <a
                          href={doc.officialUrl}
                          className="text-sm text-primary-700 underline"
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
                        <span className="text-sm text-ink">{doc.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Stay connected locally
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Follow municipal updates and share constructive community ideas
                for this municipality.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild>
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
                <Button asChild variant="secondary">
                  <Link href="/updates">Municipal Updates</Link>
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
  const { userProfile } = useAuth()
  const resolution = useCitizenMunicipality()
  const municipalityCode = resolution.municipalityCode
  const wardId =
    (userProfile as { wardId?: string } | null)?.wardId || null

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

  return (
    <MunicipalityPlanningContent
      municipalityCode={municipalityCode}
      wardId={wardId}
    />
  )
}

/**
 * Our Municipality / Visual IDP — authenticated citizens with a confirmed
 * municipality only. Never falls back to JHB or pilot planning for anonymous
 * or unresolved users.
 */
export default function MunicipalityPage() {
  return (
    <AuthGate
      next="/municipality"
      title="Sign in to view Our Municipality"
      description="Municipal plans, priorities and projects are available after you sign in and confirm your municipality. Reporting an issue does not require an account."
    >
      <MunicipalityAuthenticatedView />
    </AuthGate>
  )
}
