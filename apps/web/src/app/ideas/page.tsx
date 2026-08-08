'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lightbulb } from 'lucide-react'
import { communityApi } from '@/lib/api/community'
import { useAuth } from '@/hooks/useAuth'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  COMMUNITY_IDEA_CATEGORY_LABEL,
  CITIZEN_IDEA_STATUS_LABEL,
} from '@servesa/case-contract'
import { FEATURE_FLAGS } from '@/lib/constants'

type IdeaRow = {
  ideaId: string
  title: string
  description: string
  category: string
  status: string
  statusLabel?: string
  supportCount: number
  municipalityCode: string
  suburbLabel?: string | null
}

const DEFAULT_MUNI = 'JHB'

export default function IdeasPage() {
  const { user, userProfile, municipalityCode } = useAuth()
  const muni =
    municipalityCode ||
    (userProfile as { municipalityCode?: string } | null)?.municipalityCode ||
    DEFAULT_MUNI
  const [ideas, setIdeas] = useState<IdeaRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!FEATURE_FLAGS.enableCommunityEngagement) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const res = (await communityApi.listIdeas({
          municipalityCode: muni,
        })) as { ideas?: IdeaRow[] }
        if (!cancelled) setIdeas(res.ideas || [])
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Unable to load ideas')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [muni])

  return (
    <div className="bg-canvas">
      <section className="border-b border-border bg-surface py-10">
        <div className="container max-w-3xl">
          <p className="text-label font-display text-green-700">
            Ideas for My Community
          </p>
          <h1 className="mt-2 font-display text-h1 text-ink">
            Suggest constructive improvements
          </h1>
          <p className="mt-3 text-body text-ink-muted">
            Ideas are proposals for better services — not reports of broken
            infrastructure. To report something that needs fixing, use{' '}
            <Link href="/report" className="text-primary-700 underline">
              Report an Issue
            </Link>
            .
          </p>
          <div className="mt-6">
            <Link href={user ? '/ideas/new' : '/auth/signin?next=/ideas/new'}>
              <Button className="min-h-touch bg-green-600 hover:bg-green-700">
                Share an Idea
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container max-w-3xl py-8">
        {loading ? (
          <Spinner label="Loading ideas…" />
        ) : error ? (
          <div className="rounded-md border border-danger-border bg-danger-tint p-4 text-danger">
            {error}
          </div>
        ) : ideas.length === 0 ? (
          <div className="py-12 text-center text-ink-muted">
            <Lightbulb className="mx-auto h-10 w-10 text-green-600" aria-hidden />
            <p className="mt-4">No community ideas yet for {muni}.</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {ideas.map((idea) => (
              <li key={idea.ideaId}>
                <Link
                  href={`/ideas/${idea.ideaId}`}
                  className="block rounded-md border border-border bg-surface p-4 hover:border-green-200 hover:bg-green-50/30"
                >
                  <div className="flex flex-wrap gap-2">
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
                  <h2 className="mt-2 font-display text-h4 text-ink">
                    {idea.title}
                  </h2>
                  <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">
                    {idea.description}
                  </p>
                  <p className="mt-3 text-caption text-ink-subtle">
                    {idea.supportCount} support
                    {idea.supportCount === 1 ? '' : 's'}
                    {idea.suburbLabel ? ` · ${idea.suburbLabel}` : ''}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
