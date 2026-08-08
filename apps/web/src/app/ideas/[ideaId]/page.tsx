'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { communityApi } from '@/lib/api/community'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  COMMUNITY_IDEA_CATEGORY_LABEL,
  CITIZEN_IDEA_STATUS_LABEL,
} from '@servesa/case-contract'

type IdeaDetail = {
  ideaId: string
  title: string
  description: string
  category: string
  status: string
  statusLabel?: string
  supportCount: number
  municipalityCode: string
  suburbLabel?: string | null
  officialResponse?: {
    body: string
    publishedByDisplayName?: string
    createdAt?: string
  } | null
}

export default function IdeaDetailPage() {
  const params = useParams()
  const ideaId = String(params?.ideaId || '')
  const { user } = useAuth()
  const [idea, setIdea] = useState<IdeaDetail | null>(null)
  const [supportedByMe, setSupportedByMe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supporting, setSupporting] = useState(false)

  const load = async () => {
    const res = (await communityApi.getIdea({ ideaId })) as {
      idea?: IdeaDetail
      supportedByMe?: boolean
    }
    setIdea(res.idea || null)
    setSupportedByMe(Boolean(res.supportedByMe))
  }

  useEffect(() => {
    if (!ideaId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await load()
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load idea')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideaId])

  const onSupport = async () => {
    if (!user) return
    setSupporting(true)
    try {
      const res = (await communityApi.supportIdea({ ideaId })) as {
        supportCount: number
        alreadySupported?: boolean
      }
      setSupportedByMe(true)
      setIdea((prev) =>
        prev ? { ...prev, supportCount: res.supportCount } : prev
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to record support')
    } finally {
      setSupporting(false)
    }
  }

  if (loading) return <Spinner label="Loading idea…" />
  if (error || !idea) {
    return (
      <div className="container max-w-3xl py-12">
        <p className="text-danger">{error || 'Idea not found'}</p>
        <Link href="/ideas">
          <Button variant="outline" className="mt-4">
            Back to ideas
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <article className="container max-w-3xl py-10">
      <Link href="/ideas" className="text-sm text-green-700 hover:underline">
        ← Ideas for My Community
      </Link>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className="bg-green-100 text-green-800">
          {COMMUNITY_IDEA_CATEGORY_LABEL[
            idea.category as keyof typeof COMMUNITY_IDEA_CATEGORY_LABEL
          ] || idea.category}
        </Badge>
        <Badge variant="outline">
          {idea.statusLabel ||
            CITIZEN_IDEA_STATUS_LABEL[
              idea.status as keyof typeof CITIZEN_IDEA_STATUS_LABEL
            ] ||
            idea.status}
        </Badge>
      </div>
      <h1 className="mt-3 font-display text-h1 text-ink">{idea.title}</h1>
      <p className="mt-2 text-caption text-ink-subtle">
        Municipality {idea.municipalityCode}
        {idea.suburbLabel ? ` · ${idea.suburbLabel}` : ''}
      </p>
      <div className="mt-6 whitespace-pre-wrap text-body text-ink">
        {idea.description}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <p className="text-body-sm text-ink-muted">
          {idea.supportCount} community support
          {idea.supportCount === 1 ? '' : 's'}
        </p>
        {user ? (
          <Button
            variant="outline"
            disabled={supportedByMe || supporting}
            onClick={onSupport}
          >
            {supportedByMe ? 'Supported' : supporting ? 'Saving…' : 'Support this idea'}
          </Button>
        ) : (
          <Link href={`/auth/signin?next=/ideas/${ideaId}`}>
            <Button variant="outline">Sign in to support</Button>
          </Link>
        )}
      </div>

      {idea.officialResponse ? (
        <section className="mt-8 rounded-md border border-border bg-surface p-4">
          <h2 className="font-display text-h4 text-ink">Municipal response</h2>
          <p className="mt-2 whitespace-pre-wrap text-body-sm text-ink">
            {idea.officialResponse.body}
          </p>
          <p className="mt-2 text-caption text-ink-subtle">
            {idea.officialResponse.publishedByDisplayName || 'Municipality'}
            {idea.officialResponse.createdAt
              ? ` · ${new Date(idea.officialResponse.createdAt).toLocaleDateString('en-ZA')}`
              : ''}
          </p>
        </section>
      ) : null}

      <p className="mt-8 text-caption text-ink-subtle">
        Open comments are not available. Officials respond through verified
        municipal channels only.
      </p>
    </article>
  )
}
