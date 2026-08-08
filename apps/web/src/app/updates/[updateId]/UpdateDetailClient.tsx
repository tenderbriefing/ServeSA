'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { communityApi } from '@/lib/api/community'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { MUNICIPAL_UPDATE_TYPE_LABEL } from '@servesa/case-contract'

type UpdateDetail = {
  updateId: string
  type: string
  title: string
  body: string
  status: string
  municipalityCode: string
  publishedByDisplayName?: string | null
  updatedAt?: string | null
  publishedAt?: string | null
  expectedRestorationAt?: string | null
  targeting?: {
    affectedAreaLabel?: string | null
    wardIds?: string[]
    serviceCategories?: string[]
  }
  project?: {
    name: string
    stage: string
    progressPercent: number
    summary?: string
  } | null
}

export default function UpdateDetailClient() {
  const params = useParams()
  const updateId = String(params?.updateId || '')
  const [update, setUpdate] = useState<UpdateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!updateId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = (await communityApi.getUpdate({ updateId })) as {
          update?: UpdateDetail
        }
        if (!cancelled) setUpdate(res.update || null)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load update')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [updateId])

  if (loading) return <Spinner label="Loading update…" />
  if (error || !update) {
    return (
      <div className="container max-w-3xl py-12">
        <p className="text-danger">{error || 'Update not found'}</p>
        <Link href="/updates" className="mt-4 inline-block">
          <Button variant="outline">Back to updates</Button>
        </Link>
      </div>
    )
  }

  return (
    <article className="bg-canvas">
      <div className="container max-w-3xl py-10">
        <Link href="/updates" className="text-sm text-primary-700 hover:underline">
          ← Municipal Updates
        </Link>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge className="bg-primary-100 text-primary-800">
            {MUNICIPAL_UPDATE_TYPE_LABEL[
              update.type as keyof typeof MUNICIPAL_UPDATE_TYPE_LABEL
            ] || update.type}
          </Badge>
          <Badge variant="outline">{update.status}</Badge>
        </div>
        <h1 className="mt-3 font-display text-h1 text-ink">{update.title}</h1>
        <p className="mt-2 text-caption text-ink-subtle">
          Published by{' '}
          {update.publishedByDisplayName ||
            `Municipality ${update.municipalityCode}`}
          {update.updatedAt
            ? ` · Last updated ${new Date(update.updatedAt).toLocaleString('en-ZA')}`
            : ''}
        </p>
        {update.targeting?.affectedAreaLabel ? (
          <p className="mt-2 text-body-sm text-ink-muted">
            Area affected: {update.targeting.affectedAreaLabel}
          </p>
        ) : null}
        {update.expectedRestorationAt ? (
          <p className="mt-1 text-body-sm text-ink-muted">
            Expected restoration:{' '}
            {new Date(update.expectedRestorationAt).toLocaleString('en-ZA')}
          </p>
        ) : null}
        <div className="prose mt-6 max-w-none whitespace-pre-wrap text-body text-ink">
          {update.body}
        </div>
        {update.project ? (
          <section className="mt-8 rounded-md border border-border bg-surface p-4">
            <h2 className="font-display text-h4 text-ink">Project progress</h2>
            <p className="mt-2 text-body-sm text-ink">
              {update.project.name} — {update.project.stage.replace(/_/g, ' ')}
            </p>
            <div
              className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted"
              role="progressbar"
              aria-valuenow={update.project.progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Project progress"
            >
              <div
                className="h-full bg-green-600"
                style={{ width: `${update.project.progressPercent}%` }}
              />
            </div>
            <p className="mt-1 text-caption text-ink-subtle">
              {update.project.progressPercent}% complete
            </p>
            {update.project.summary ? (
              <p className="mt-2 text-body-sm text-ink-muted">
                {update.project.summary}
              </p>
            ) : null}
          </section>
        ) : null}
      </div>
    </article>
  )
}
