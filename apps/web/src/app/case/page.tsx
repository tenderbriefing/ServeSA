'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ProgressTimeline } from '@/components/civic/ProgressTimeline'
import { MunicipalityIdentity } from '@/components/civic/MunicipalityIdentity'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { useAuth } from '@/hooks/useAuth'
import { casesAPI } from '@/lib/api/cases'
import { Search } from 'lucide-react'

/**
 * Citizen progress timeline — safe milestones only.
 * Internal notes, duplicate scores, and contact PII are never shown.
 */
export default function CasePage() {
  const { user, loading: authLoading } = useAuth()
  const [caseId, setCaseId] = useState('')
  const [lookupId, setLookupId] = useState('')
  const [ready, setReady] = useState(false)
  const [timeline, setTimeline] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    const path = window.location.pathname.replace(/\/$/, '')
    const fromPath = path.startsWith('/case/') ? path.slice('/case/'.length) : ''
    const fromQuery = new URLSearchParams(window.location.search).get('id') || ''
    const id = decodeURIComponent(fromPath || fromQuery)
    setCaseId(id)
    setLookupId(id)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!caseId || !user) return
    setError(null)
    casesAPI
      .getCitizenTimeline(caseId)
      .then(setTimeline)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load timeline'))
  }, [caseId, user])

  if (!ready || authLoading) {
    return <Spinner label="Loading case tracking…" />
  }

  return (
    <div className="bg-canvas px-4 py-10">
      <div className="container mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Track a Case"
          description="Enter your Case Number to follow progress. Sign in with the account used to submit the report to view the full timeline."
          breadcrumbs={[
            { href: '/', label: 'Home' },
            { label: 'Track a Case' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-h4">Case Number</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              className="flex flex-col gap-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                const next = lookupId.trim()
                if (!next) return
                setCaseId(next)
                const url = new URL(window.location.href)
                url.searchParams.set('id', next)
                window.history.replaceState({}, '', url.toString())
              }}
            >
              <label className="sr-only" htmlFor="case-number">
                Case Number
              </label>
              <input
                id="case-number"
                value={lookupId}
                onChange={(e) => setLookupId(e.target.value)}
                placeholder="CASE-…"
                className="min-h-touch w-full flex-1 rounded-md border border-border bg-surface px-3 text-base text-ink"
                autoComplete="off"
              />
              <Button type="submit" variant="brand" className="min-h-touch">
                <Search className="mr-2 h-4 w-4" aria-hidden />
                Look up
              </Button>
            </form>

            {!user && (
              <p className="text-body-sm text-ink-muted">
                Sign in with the account used to submit this report to view your
                progress timeline. Contact details are never shown on public share
                pages.
              </p>
            )}
            {error && (
              <p className="rounded-md border border-danger-border bg-danger-tint p-3 text-body-sm text-danger" role="alert">
                {error}
              </p>
            )}
            {msg && (
              <p className="rounded-md border border-success-border bg-success-tint p-3 text-body-sm text-success" role="status">
                {msg}
              </p>
            )}

            {user && caseId && !timeline && !error && (
              <Spinner label="Loading timeline…" />
            )}

            {user && !caseId && (
              <EmptyState
                title="Enter a Case Number"
                description="Use the Case Number from your submission confirmation to track progress."
                icon={<Search className="h-6 w-6" aria-hidden />}
              />
            )}

            {timeline && (
              <div className="space-y-6">
                <div>
                  <p className="text-caption uppercase tracking-wide text-ink-subtle">
                    Status
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <StatusBadge status={timeline.status} />
                    <h2 className="font-display text-h3 text-ink">
                      {timeline.title || caseId}
                    </h2>
                  </div>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    Case Number:{' '}
                    <span className="font-mono font-semibold text-ink">
                      {timeline.reference || caseId}
                    </span>
                  </p>
                  {timeline.linkedPrimary && (
                    <p className="mt-3 rounded-md border border-info-border bg-info-tint p-3 text-body-sm text-info">
                      Your report appears to relate to an existing incident. It has
                      been linked so that you can receive progress updates.
                    </p>
                  )}
                </div>

                <MunicipalityIdentity
                  municipalityName={timeline.municipality?.name || timeline.municipalityName}
                  municipalityCode={timeline.municipality?.code || timeline.municipalityCode}
                  wardName={timeline.ward?.name || timeline.wardName}
                  wardCode={timeline.ward?.code || timeline.wardCode}
                  department={timeline.department || timeline.departmentName}
                  routingPending={timeline.routingPending}
                />

                <ProgressTimeline
                  currentStatus={timeline.status}
                  milestones={timeline.milestones || []}
                />

                {(timeline.publicUpdates || []).length > 0 && (
                  <div>
                    <h3 className="mb-2 font-display text-h4 text-ink">Updates</h3>
                    <ul className="space-y-2">
                      {timeline.publicUpdates.map((u: any, i: number) => (
                        <li
                          key={i}
                          className="rounded-md border border-border bg-surface p-3 text-body-sm text-ink"
                        >
                          {u.body}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {timeline.canConfirm && (
                  <div className="space-y-2 rounded-md border border-border bg-surface p-4">
                    <h3 className="font-display text-h4 text-ink">
                      Is the issue resolved?
                    </h3>
                    <textarea
                      className="w-full rounded-md border border-border bg-surface p-2 text-base text-ink"
                      rows={2}
                      placeholder="Optional comment"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                    <div className="flex flex-wrap gap-2">
                      <Button
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await casesAPI.citizenConfirm(caseId, true, reason || undefined)
                            setMsg('Thank you — confirmation recorded')
                            const t = await casesAPI.getCitizenTimeline(caseId)
                            setTimeline(t)
                          } catch (e: any) {
                            setMsg(e?.message || 'Confirmation failed')
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Confirm resolved
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={async () => {
                          setBusy(true)
                          try {
                            await casesAPI.citizenConfirm(
                              caseId,
                              false,
                              reason || 'Issue still unresolved'
                            )
                            setMsg('We reopened your case for follow-up')
                            const t = await casesAPI.getCitizenTimeline(caseId)
                            setTimeline(t)
                          } catch (e: any) {
                            setMsg(e?.message || 'Reopen failed')
                          } finally {
                            setBusy(false)
                          }
                        }}
                      >
                        Still unresolved
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Link href="/report">
                <Button variant="outline">Report another issue</Button>
              </Link>
              <Link href="/">
                <Button variant="brand">Home</Button>
              </Link>
              {!user && (
                <Link
                  href={`/auth/signin?next=${encodeURIComponent(`/case?id=${caseId || ''}`)}`}
                >
                  <Button variant="outline">Sign in</Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
