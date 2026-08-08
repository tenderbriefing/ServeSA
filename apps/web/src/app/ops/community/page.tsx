'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { useAuth } from '@/components/providers/AuthProvider'
import { opsApi } from '@/lib/opsApi'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  MUNICIPAL_UPDATE_TYPE_LABEL,
  COMMUNITY_IDEA_CATEGORY_LABEL,
  CITIZEN_IDEA_STATUS_LABEL,
} from '@servesa/case-contract'

type Tab = 'updates' | 'ideas' | 'insights'

export default function OpsCommunityPage() {
  const { municipalityCode } = useAuth()
  const [tab, setTab] = useState<Tab>('updates')
  const [updates, setUpdates] = useState<any[]>([])
  const [ideas, setIdeas] = useState<any[]>([])
  const [insights, setInsights] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [draftTitle, setDraftTitle] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftType, setDraftType] = useState('community_notice')
  const [busy, setBusy] = useState(false)
  const [responseIdeaId, setResponseIdeaId] = useState('')
  const [responseBody, setResponseBody] = useState('')

  const muni = municipalityCode || ''

  const refresh = async () => {
    if (!muni) return
    setError(null)
    try {
      if (tab === 'updates') {
        const res = (await opsApi.listMunicipalUpdates({
          municipalityCode: muni,
          citizenView: false,
        })) as { updates?: any[] }
        setUpdates(res.updates || [])
      } else if (tab === 'ideas') {
        const res = (await opsApi.listCommunityIdeas({
          municipalityCode: muni,
          opsView: true,
        })) as { ideas?: any[] }
        setIdeas(res.ideas || [])
      } else {
        const res = await opsApi.communityInsights({ municipalityCode: muni })
        setInsights(res)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load community data')
    }
  }

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, muni])

  const createDraft = async () => {
    if (!muni) return
    setBusy(true)
    setError(null)
    try {
      await opsApi.upsertMunicipalUpdate({
        type: draftType,
        title: draftTitle,
        body: draftBody,
        targeting: { municipalityCode: muni },
        status: 'draft',
      })
      setDraftTitle('')
      setDraftBody('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save draft')
    } finally {
      setBusy(false)
    }
  }

  const publish = async (updateId: string) => {
    setBusy(true)
    try {
      await opsApi.publishMunicipalUpdate({ updateId })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  const archive = async (updateId: string) => {
    setBusy(true)
    try {
      await opsApi.archiveMunicipalUpdate({ updateId })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Archive failed')
    } finally {
      setBusy(false)
    }
  }

  const transition = async (ideaId: string, status: string) => {
    setBusy(true)
    try {
      await opsApi.transitionCommunityIdea({ ideaId, status })
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transition failed')
    } finally {
      setBusy(false)
    }
  }

  const respond = async () => {
    if (!responseIdeaId || !responseBody.trim()) return
    setBusy(true)
    try {
      await opsApi.respondToCommunityIdea({
        ideaId: responseIdeaId,
        body: responseBody.trim(),
      })
      setResponseBody('')
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Response failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <OpsShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-h2 text-ink">Community</h1>
          <p className="mt-1 text-body-sm text-ink-muted">
            Municipal Updates, Community Ideas, and Insights for{' '}
            {muni || 'your municipality'}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Community sections">
          {(
            [
              ['updates', 'Updates'],
              ['ideas', 'Ideas'],
              ['insights', 'Insights'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`min-h-touch rounded-md px-3 text-sm ${
                tab === id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-muted text-ink-muted'
              }`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {!muni ? (
          <p className="text-ink-muted">
            Municipality claim missing — cannot load community workspace.
          </p>
        ) : null}

        {tab === 'updates' && muni ? (
          <div className="grid gap-8 lg:grid-cols-2">
            <section className="space-y-3">
              <h2 className="font-display text-h4">Draft update</h2>
              <select
                className="w-full min-h-touch rounded-md border border-border px-3 text-sm"
                value={draftType}
                onChange={(e) => setDraftType(e.target.value)}
                aria-label="Update type"
              >
                {Object.entries(MUNICIPAL_UPDATE_TYPE_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
              <input
                className="w-full min-h-touch rounded-md border border-border px-3"
                placeholder="Title"
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
              />
              <textarea
                className="min-h-[120px] w-full rounded-md border border-border px-3 py-2"
                placeholder="Body"
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
              />
              <Button
                disabled={busy || draftTitle.length < 3 || draftBody.length < 10}
                onClick={createDraft}
              >
                Save draft
              </Button>
              <p className="text-caption text-ink-subtle">
                Publishing requires publisher/moderator/admin claims.
              </p>
            </section>
            <section className="space-y-3">
              <h2 className="font-display text-h4">Queue</h2>
              <ul className="space-y-3">
                {updates.map((u) => (
                  <li
                    key={u.updateId}
                    className="rounded-md border border-border bg-surface p-3"
                  >
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{u.status}</Badge>
                      <Badge className="bg-primary-100 text-primary-800">
                        {MUNICIPAL_UPDATE_TYPE_LABEL[
                          u.type as keyof typeof MUNICIPAL_UPDATE_TYPE_LABEL
                        ] || u.type}
                      </Badge>
                    </div>
                    <p className="mt-2 font-medium text-ink">{u.title}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(u.status === 'draft' ||
                        u.status === 'scheduled' ||
                        u.status === 'published' ||
                        u.status === 'updated') && (
                        <Button
                          size="sm"
                          disabled={busy}
                          onClick={() => publish(u.updateId)}
                        >
                          {u.status === 'published' || u.status === 'updated'
                            ? 'Mark updated'
                            : 'Publish'}
                        </Button>
                      )}
                      {u.status !== 'archived' && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => archive(u.updateId)}
                        >
                          Archive
                        </Button>
                      )}
                      <Link
                        href={`/updates/${u.updateId}`}
                        className="text-sm text-primary-700 underline"
                      >
                        Citizen view
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}

        {tab === 'ideas' && muni ? (
          <div className="space-y-6">
            <section className="space-y-3 rounded-md border border-border bg-surface p-4">
              <h2 className="font-display text-h4">Official response</h2>
              <input
                className="w-full min-h-touch rounded-md border border-border px-3"
                placeholder="Idea ID"
                value={responseIdeaId}
                onChange={(e) => setResponseIdeaId(e.target.value)}
              />
              <textarea
                className="min-h-[80px] w-full rounded-md border border-border px-3 py-2"
                placeholder="Public response (visible to citizens)"
                value={responseBody}
                onChange={(e) => setResponseBody(e.target.value)}
              />
              <Button disabled={busy} onClick={respond}>
                Publish response
              </Button>
            </section>
            <ul className="space-y-3">
              {ideas.map((idea) => (
                <li
                  key={idea.ideaId}
                  className="rounded-md border border-border bg-surface p-3"
                >
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {idea.statusLabel ||
                        CITIZEN_IDEA_STATUS_LABEL[
                          idea.status as keyof typeof CITIZEN_IDEA_STATUS_LABEL
                        ] ||
                        idea.status}
                    </Badge>
                    <Badge className="bg-green-100 text-green-800">
                      {COMMUNITY_IDEA_CATEGORY_LABEL[
                        idea.category as keyof typeof COMMUNITY_IDEA_CATEGORY_LABEL
                      ] || idea.category}
                    </Badge>
                    <span className="text-caption text-ink-subtle">
                      {idea.supportCount} supports · {idea.ideaId}
                    </span>
                  </div>
                  <p className="mt-2 font-medium">{idea.title}</p>
                  <p className="mt-1 line-clamp-2 text-body-sm text-ink-muted">
                    {idea.description}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[
                      'under_review',
                      'community_support',
                      'feasibility_review',
                      'planned',
                      'in_progress',
                      'implemented',
                      'declined',
                    ].map((status) => (
                      <Button
                        key={status}
                        size="sm"
                        variant="outline"
                        disabled={busy || idea.status === status}
                        onClick={() => transition(idea.ideaId, status)}
                      >
                        {status.replace(/_/g, ' ')}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setResponseIdeaId(idea.ideaId)}
                    >
                      Respond
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {tab === 'insights' && insights ? (
          <section className="space-y-4">
            <h2 className="font-display text-h4">Community Insights</h2>
            <p className="text-body-sm text-ink-muted">
              Deterministic aggregates only. Provenance:{' '}
              {insights.provenance?.method}. Predictive AI: none.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-border p-3">
                <dt className="text-caption text-ink-subtle">Published updates</dt>
                <dd className="text-h3 font-display">
                  {insights.metrics?.publishedUpdates ?? 0}
                </dd>
              </div>
              <div className="rounded-md border border-border p-3">
                <dt className="text-caption text-ink-subtle">Open ideas (sample)</dt>
                <dd className="text-h3 font-display">
                  {insights.metrics?.openIdeas ?? 0}
                </dd>
              </div>
              <div className="rounded-md border border-border p-3">
                <dt className="text-caption text-ink-subtle">Total idea supports</dt>
                <dd className="text-h3 font-display">
                  {insights.metrics?.totalIdeaSupports ?? 0}
                </dd>
              </div>
              <div className="rounded-md border border-border p-3">
                <dt className="text-caption text-ink-subtle">Cases sampled</dt>
                <dd className="text-h3 font-display">
                  {insights.metrics?.recentCasesSampled ?? 0}
                </dd>
              </div>
            </dl>
            <p className="text-caption text-ink-subtle">
              Generated {insights.generatedAt} · case sample capped at{' '}
              {insights.provenance?.caseSampleCappedAt}
            </p>
          </section>
        ) : null}
      </div>
    </OpsShell>
  )
}
