'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { casesAPI } from '@/lib/api/cases'
import { CITIZEN_STATUS_LABEL } from '@servesa/case-contract'

/**
 * Citizen progress timeline — safe milestones only.
 * Internal notes, duplicate scores, and contact PII are never shown.
 */
export default function CasePage() {
  const { user, loading: authLoading } = useAuth()
  const [caseId, setCaseId] = useState('')
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
    setCaseId(decodeURIComponent(fromPath || fromQuery))
    setReady(true)
  }, [])

  useEffect(() => {
    if (!caseId || !user) return
    casesAPI
      .getCitizenTimeline(caseId)
      .then(setTimeline)
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load timeline'))
  }, [caseId, user])

  if (!ready || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    )
  }

  const statusLabel =
    timeline?.status &&
    (CITIZEN_STATUS_LABEL[timeline.status as keyof typeof CITIZEN_STATUS_LABEL] ||
      timeline.status)

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Case {caseId || '(missing id)'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-700">
            {!user && (
              <p>
                Sign in with the account used to submit this report to view your progress
                timeline. Contact details are never shown on public share pages.
              </p>
            )}
            {error && <p className="text-red-600">{error}</p>}
            {msg && <p className="text-emerald-700">{msg}</p>}

            {timeline && (
              <>
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">Status</div>
                  <div className="text-lg font-medium text-slate-900">{statusLabel}</div>
                  <div className="text-slate-600">{timeline.title}</div>
                  {timeline.linkedPrimary && (
                    <p className="mt-2 rounded-md bg-sky-50 p-2 text-sky-900">
                      Your report appears to relate to an existing incident. It has been
                      linked so that you can receive progress updates.
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="mb-2 font-medium text-slate-900">Progress</h3>
                  <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                    {(timeline.milestones || []).map((m: any, i: number) => (
                      <li key={i}>
                        <div className="font-medium text-slate-800">{m.description}</div>
                        <div className="text-xs text-slate-500">
                          {m.actor === 'you'
                            ? 'You'
                            : m.actor === 'municipality'
                              ? 'Municipality'
                              : 'System'}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {(timeline.publicUpdates || []).length > 0 && (
                  <div>
                    <h3 className="mb-2 font-medium text-slate-900">Updates</h3>
                    <ul className="space-y-2">
                      {timeline.publicUpdates.map((u: any, i: number) => (
                        <li key={i} className="rounded-md bg-white p-3 border border-slate-200">
                          {u.body}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {timeline.canConfirm && (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-white p-4">
                    <h3 className="font-medium">Is the issue resolved?</h3>
                    <textarea
                      className="w-full rounded border border-slate-300 p-2 text-sm"
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
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Link href="/report">
                <Button variant="outline">Report another issue</Button>
              </Link>
              <Link href="/">
                <Button>Home</Button>
              </Link>
              {!user && (
                <Link href={`/auth/signin?next=${encodeURIComponent(`/case?id=${caseId}`)}`}>
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
