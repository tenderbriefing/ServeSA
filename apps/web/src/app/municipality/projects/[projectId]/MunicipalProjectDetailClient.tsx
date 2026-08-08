'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ExternalLink, Lightbulb } from 'lucide-react'
import { planningApi } from '@/lib/api/planning'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPlanningEnabledFor,
} from '@/lib/constants'
import {
  MUNICIPAL_PROJECT_STATUS_LABEL,
  PROJECT_SCOPE_LABEL,
  type MunicipalProjectStatus,
  type ProjectScope,
} from '@servesa/case-contract'
import {
  ServeSaSummaryBanner,
  SourceCitation,
} from '@/components/planning/SourceCitation'
import { trackPlanningEvent } from '@/lib/telemetry/planning'

type ProjectDetail = {
  projectId: string
  title: string
  plainLanguageSummary: string
  isServeSaSummary?: boolean
  officialDescription?: string | null
  status: string
  scope: string
  municipalityCode: string
  progressPercent?: number | null
  locationLabel?: string | null
  departmentLabel?: string | null
  wardMappingAvailable?: boolean
  wardIds?: string[]
  officialSourceUrl?: string | null
  budgeted?: { amountZar: number } | null
  spent?: { amountZar: number } | null
  sources?: Array<{
    documentKind: string
    title: string
    url?: string | null
    isServeSaSummary?: boolean
    pageOrSection?: string
    publisher?: string
  }>
}

function formatZar(n: number) {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function MunicipalProjectDetailClient() {
  const params = useParams()
  const projectId = String(params?.projectId || '')
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [relatedUpdates, setRelatedUpdates] = useState<
    Array<{ updateId: string; title: string; summary?: string; status: string }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!projectId || projectId === '_') {
      setLoading(false)
      return
    }
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = (await planningApi.getProject({ projectId })) as {
          project?: ProjectDetail
          relatedUpdates?: Array<{
            updateId: string
            title: string
            summary?: string
            status: string
          }>
        }
        if (!cancelled) {
          setProject(res.project || null)
          setRelatedUpdates(res.relatedUpdates || [])
          if (res.project) {
            trackPlanningEvent('municipal_planning_project_opened', {
              municipalityCode: res.project.municipalityCode,
              projectId,
            })
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'Unable to load project details'
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [projectId])

  if (projectId === '_') {
    return (
      <div className="container py-12">
        <p className="text-ink-muted">Select a project from Our Municipality.</p>
        <Link href="/municipality" className="mt-2 inline-block text-primary-700">
          Back to Our Municipality
        </Link>
      </div>
    )
  }

  if (
    project &&
    (!FEATURE_FLAGS.enableMunicipalPlanning ||
      !isMunicipalPlanningEnabledFor(project.municipalityCode))
  ) {
    return (
      <div className="container py-12">
        <p className="text-ink-muted">
          Our Municipality planning summary is not enabled for this area yet.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-canvas">
      <div className="container max-w-3xl py-10">
        <p className="text-sm">
          <Link href="/municipality" className="text-primary-700 hover:underline">
            ← Our Municipality
          </Link>
        </p>

        {loading ? (
          <div className="flex justify-center py-16" role="status">
            <Spinner />
          </div>
        ) : null}

        {error ? (
          <p className="mt-6 text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        {!loading && project ? (
          <article className="mt-6 space-y-6">
            <header>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {MUNICIPAL_PROJECT_STATUS_LABEL[
                    project.status as MunicipalProjectStatus
                  ] || 'Unknown'}
                </Badge>
                <Badge variant="outline">
                  {PROJECT_SCOPE_LABEL[project.scope as ProjectScope] ||
                    project.scope}
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-h1 text-ink">
                {project.title}
              </h1>
              <ServeSaSummaryBanner show={project.isServeSaSummary !== false} />
              <p className="mt-3 text-body text-ink-muted">
                {project.plainLanguageSummary}
              </p>
            </header>

            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-label text-ink-subtle">Progress</dt>
                <dd className="text-ink">
                  {typeof project.progressPercent === 'number'
                    ? `${project.progressPercent}%`
                    : 'Not published yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-subtle">Where</dt>
                <dd className="text-ink">
                  {project.locationLabel || 'Not published yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-subtle">Department</dt>
                <dd className="text-ink">
                  {project.departmentLabel || 'Not published yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-subtle">Ward mapping</dt>
                <dd className="text-ink">
                  {project.wardMappingAvailable && project.wardIds?.length
                    ? project.wardIds.join(', ')
                    : 'Not published yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-subtle">Budgeted</dt>
                <dd className="text-ink">
                  {project.budgeted?.amountZar != null
                    ? formatZar(project.budgeted.amountZar)
                    : 'Not published yet'}
                </dd>
              </div>
              <div>
                <dt className="text-label text-ink-subtle">Spent</dt>
                <dd className="text-ink">
                  {project.spent?.amountZar != null
                    ? formatZar(project.spent.amountZar)
                    : 'Not published yet'}
                </dd>
              </div>
            </dl>

            {project.officialDescription ? (
              <section>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Official wording
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">
                  {project.officialDescription}
                </p>
              </section>
            ) : null}

            <section>
              <h2 className="font-display text-lg font-semibold text-ink">
                Sources
              </h2>
              <ul className="mt-2 space-y-2">
                {(project.sources || []).map((source, i) => (
                  <li key={`${source.title}-${i}`}>
                    <SourceCitation source={source as never} />
                  </li>
                ))}
                {!project.sources?.length ? (
                  <li className="text-sm text-ink-muted">Not published yet</li>
                ) : null}
              </ul>
              {project.officialSourceUrl ? (
                <div className="mt-3">
                  <Button asChild variant="secondary">
                    <a
                      href={project.officialSourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() =>
                        trackPlanningEvent(
                          'municipal_planning_official_source_clicked',
                          {
                            municipalityCode: project.municipalityCode,
                            projectId,
                          }
                        )
                      }
                    >
                      <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
                      View Official Source
                    </a>
                  </Button>
                </div>
              ) : null}
            </section>

            <section>
              <h2 className="font-display text-lg font-semibold text-ink">
                Related municipal updates
              </h2>
              {!relatedUpdates.length ? (
                <p className="mt-2 text-sm text-ink-muted">
                  No related updates published yet.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {relatedUpdates.map((u) => (
                    <li key={u.updateId}>
                      <Link
                        href={`/updates/${u.updateId}`}
                        className="text-primary-700 hover:underline"
                      >
                        {u.title}
                      </Link>
                      {u.summary ? (
                        <p className="text-xs text-ink-subtle">{u.summary}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-display text-base font-semibold text-ink">
                Participate
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Suggest a constructive improvement related to this project via
                Community Ideas.
              </p>
              <Button asChild className="mt-3" size="sm">
                <Link href="/ideas/new">
                  <Lightbulb className="mr-1.5 h-4 w-4" aria-hidden />
                  Share an Idea
                </Link>
              </Button>
            </section>
          </article>
        ) : null}
      </div>
    </div>
  )
}
