'use client'

import Link from 'next/link'
import {
  MUNICIPAL_PROJECT_STATUS_LABEL,
  PROJECT_SCOPE_LABEL,
  type MunicipalProjectStatus,
  type ProjectScope,
} from '@servesa/case-contract'
import { Badge } from '@/components/ui/Badge'
import { SourceCitation } from './SourceCitation'

export type ProjectCardModel = {
  projectId: string
  title: string
  plainLanguageSummary: string
  isServeSaSummary?: boolean
  status: string
  scope: string
  progressPercent?: number | null
  locationLabel?: string | null
  wardMappingAvailable?: boolean
  wardIds?: string[]
  sources?: Array<{
    documentKind: string
    title: string
    url?: string | null
    isServeSaSummary?: boolean
    pageOrSection?: string
  }>
}

export function ProjectCard({ project }: { project: ProjectCardModel }) {
  const statusLabel =
    MUNICIPAL_PROJECT_STATUS_LABEL[project.status as MunicipalProjectStatus] ||
    'Unknown'
  const scopeLabel =
    PROJECT_SCOPE_LABEL[project.scope as ProjectScope] || project.scope

  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-lg font-semibold text-ink">
          <Link
            href={`/municipality/projects/${project.projectId}`}
            className="hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600"
          >
            {project.title}
          </Link>
        </h3>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{statusLabel}</Badge>
          {project.scope && project.scope !== 'ward_specific' ? (
            <Badge variant="outline">{scopeLabel}</Badge>
          ) : null}
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-muted">{project.plainLanguageSummary}</p>
      {typeof project.progressPercent === 'number' ? (
        <p className="mt-2 text-xs text-ink-subtle">
          Progress (official): {project.progressPercent}%
        </p>
      ) : null}
      {project.locationLabel ? (
        <p className="mt-1 text-xs text-ink-subtle">Where: {project.locationLabel}</p>
      ) : null}
      {project.sources?.[0] ? (
        <div className="mt-2">
          <SourceCitation source={project.sources[0] as never} />
        </div>
      ) : null}
    </article>
  )
}
