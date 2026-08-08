'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Building2, Lightbulb } from 'lucide-react'
import { planningApi } from '@/lib/api/planning'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPlanningEnabledFor,
} from '@/lib/constants'
import { PLANNING_EMPTY_COPY } from '@servesa/case-contract'
import { PlanningKpiCards, type PlanningKpi } from '@/components/planning/PlanningKpiCards'
import { ProjectCard, type ProjectCardModel } from '@/components/planning/ProjectCard'
import { ServeSaSummaryBanner } from '@/components/planning/SourceCitation'
import { trackPlanningEvent } from '@/lib/telemetry/planning'

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

const DEFAULT_MUNI = 'JHB'

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
  empty: boolean
  emptyCopy: string
}

export default function MunicipalityPage() {
  const { userProfile, municipalityCode } = useAuth()
  const profile = userProfile as {
    municipalityCode?: string
    wardId?: string
  } | null
  const muni =
    municipalityCode || profile?.municipalityCode || DEFAULT_MUNI
  const wardId = profile?.wardId || null
  const resolutionFallback = !municipalityCode && !profile?.municipalityCode

  const enabled = isMunicipalPlanningEnabledFor(muni)
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
          municipalityCode: muni,
          wardId,
        })) as SummaryResponse
        if (!cancelled) {
          setSummary(res)
          trackPlanningEvent('municipal_planning_page_viewed', {
            municipalityCode: muni,
            hasWard: Boolean(wardId),
            empty: Boolean(res.empty),
          })
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
  }, [muni, wardId, enabled])

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
          <p className="text-label font-display text-primary-700">
            Our Municipality
          </p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-h1 text-ink">
            <Building2 className="h-8 w-8 shrink-0 text-primary-600" aria-hidden />
            What your municipality plans to do
          </h1>
          <p className="mt-3 text-body text-ink-muted">
            Plain-language view of priorities, budgets, and projects — based on
            verified official documents, not social posts.
          </p>
          <p className="mt-2 text-sm text-ink-subtle">
            Showing municipality <strong className="text-ink">{muni}</strong>
            {wardId ? (
              <>
                {' '}
                · your ward reference <strong className="text-ink">{wardId}</strong>
              </>
            ) : null}
            .
          </p>
          {resolutionFallback ? (
            <p className="mt-3 rounded-md border border-border bg-surface-muted px-3 py-2 text-sm text-ink-muted">
              {PLANNING_EMPTY_COPY.resolutionUnavailable}
            </p>
          ) : null}
        </div>
      </section>

      <div className="container max-w-3xl space-y-12 py-10">
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
          <p className="rounded-lg border border-border bg-surface p-6 text-ink-muted">
            {summary.emptyCopy || PLANNING_EMPTY_COPY.notPublished} Official
            planning documents are still being reviewed for publication.
          </p>
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
                Our priorities
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
                                {
                                  municipalityCode: muni,
                                }
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
                Where the money goes
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
                Projects
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

            <section className="rounded-lg border border-border bg-surface p-5">
              <h2 className="font-display text-lg font-semibold text-ink">
                Have a constructive idea?
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Share it through Community Ideas — the same channel used across
                Serve SA. This is not for reporting broken infrastructure.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button asChild>
                  <Link
                    href="/ideas/new"
                    onClick={() =>
                      trackPlanningEvent('municipal_planning_idea_cta', {
                        municipalityCode: muni,
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
