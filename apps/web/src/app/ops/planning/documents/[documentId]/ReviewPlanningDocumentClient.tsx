'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { OpsShell } from '@/components/ops/OpsShell'
import { useAuth } from '@/components/providers/AuthProvider'
import { planningApi } from '@/lib/api/planning'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import {
  FEATURE_FLAGS,
  isMunicipalPublishingEnabledFor,
} from '@/lib/constants'
import type { AiExtractDraft } from '@servesa/case-contract'
import { trackPublishingEvent } from '@/lib/telemetry/publishing'

export default function ReviewPlanningDocumentClient() {
  const params = useParams()
  const documentId = String(params.documentId || '')
  const { municipalityCode } = useAuth()
  const muni = municipalityCode?.trim() || null
  const enabled = muni ? isMunicipalPublishingEnabledFor(muni) : false
  const [doc, setDoc] = useState<Record<string, unknown> | null>(null)
  const [draftJson, setDraftJson] = useState('')
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!documentId || !muni || !enabled) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const list = (await planningApi.listEntities({
        municipalityCode: muni,
        entityType: 'document',
        citizenView: false,
      })) as { items?: Record<string, unknown>[] }
      const found =
        list.items?.find((d) => String(d.documentId) === documentId) || null
      setDoc(found)
      if (found?.aiExtractDraft) {
        setDraftJson(JSON.stringify(found.aiExtractDraft, null, 2))
      }
      try {
        const urlRes = (await planningApi.getDocumentSourceUrl({
          documentId,
        })) as { url?: string }
        setSourceUrl(urlRes.url || null)
      } catch {
        setSourceUrl(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load document')
    } finally {
      setLoading(false)
    }
  }, [documentId, muni, enabled])

  useEffect(() => {
    void load()
  }, [load])

  async function saveDraft() {
    setBusy(true)
    setError(null)
    try {
      const aiExtractDraft = JSON.parse(draftJson) as AiExtractDraft
      await planningApi.updateAiDraft({
        documentId,
        municipalityCode: muni,
        aiExtractDraft,
      })
      setMessage('Draft saved for review')
      trackPublishingEvent('ai_draft_reviewed', { documentId, municipalityCode: muni })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    setBusy(true)
    setError(null)
    try {
      await planningApi.approveDocument({ documentId, municipalityCode: muni })
      setMessage('Document approved — ready for publish')
      trackPublishingEvent('planning_content_approved', {
        documentId,
        municipalityCode: muni,
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed')
    } finally {
      setBusy(false)
    }
  }

  async function publish() {
    setBusy(true)
    setError(null)
    try {
      await planningApi.publishDocument({ documentId })
      setMessage('Published to citizens')
      trackPublishingEvent('planning_content_published', {
        documentId,
        municipalityCode: muni,
      })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setBusy(false)
    }
  }

  async function reprocess() {
    setBusy(true)
    setError(null)
    try {
      await planningApi.processDocument({
        documentId,
        municipalityCode: muni,
        regenerate: true,
      })
      setMessage('Reprocessed — review new draft')
      trackPublishingEvent('ai_draft_generated', { documentId, municipalityCode: muni })
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reprocess failed')
    } finally {
      setBusy(false)
    }
  }

  if (!FEATURE_FLAGS.enableMunicipalPublishingEngine || !enabled) {
    return (
      <OpsShell>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-ink-muted">Publishing engine not enabled.</p>
        </div>
      </OpsShell>
    )
  }

  return (
    <OpsShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <header className="mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/ops/planning/documents">← Documents</Link>
          </Button>
          <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
            Review document
          </h1>
          {doc ? (
            <p className="mt-1 text-sm text-ink-muted">
              {String(doc.title)} · {String(doc.processingStatus)} ·{' '}
              {String(doc.publicationStatus)}
            </p>
          ) : null}
        </header>

        {loading ? (
          <Spinner label="Loading review" />
        ) : !doc ? (
          <p className="text-sm text-ink-muted">Document not found.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-display text-h4 text-ink">Source document</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div>
                  <dt className="text-ink-subtle">SHA-256</dt>
                  <dd className="break-all font-mono text-xs">{String(doc.sha256 || '—')}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Processing</dt>
                  <dd>{String(doc.processingStatus || '—')}</dd>
                </div>
                {doc.processingError ? (
                  <div>
                    <dt className="text-ink-subtle">Extraction note</dt>
                    <dd className="text-amber-800">{String(doc.processingError)}</dd>
                  </div>
                ) : null}
              </dl>
              {sourceUrl ? (
                <Button asChild className="mt-4" variant="outline" size="sm">
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
                    Open source file
                  </a>
                </Button>
              ) : (
                <p className="mt-4 text-caption text-ink-subtle">
                  Source available to authorised ops via signed URL.
                </p>
              )}
            </section>

            <section className="rounded-lg border border-border bg-surface p-4">
              <h2 className="font-display text-h4 text-ink">
                AI draft (editable)
              </h2>
              <p className="mt-1 text-caption text-ink-subtle">
                ServeSA plain-language summary — verify before publish. No
                auto-publish.
              </p>
              <textarea
                className="mt-3 h-80 w-full rounded-md border border-border bg-canvas p-3 font-mono text-xs"
                value={draftJson}
                onChange={(e) => setDraftJson(e.target.value)}
                spellCheck={false}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" onClick={saveDraft} disabled={busy}>
                  Save draft
                </Button>
                <Button size="sm" variant="outline" onClick={reprocess} disabled={busy}>
                  Regenerate
                </Button>
                <Button size="sm" variant="outline" onClick={approve} disabled={busy}>
                  Mark approved
                </Button>
                <Button size="sm" onClick={publish} disabled={busy}>
                  Publish
                </Button>
              </div>
            </section>
          </div>
        )}

        {message ? (
          <p className="mt-4 text-sm text-green-800">{message}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : null}
      </div>
    </OpsShell>
  )
}
