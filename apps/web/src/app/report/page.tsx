'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle,
  Copy,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LocationStep } from '@/components/Report/LocationStep'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stepper } from '@/components/ui/Stepper'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Spinner } from '@/components/ui/LoadingSkeleton'
import { PhotoUploader } from '@/components/civic/PhotoUploader'
import { MunicipalityIdentity } from '@/components/civic/MunicipalityIdentity'
import { categoryOutlineIcon } from '@/components/civic/categoryIcons'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { CivicMotif } from '@/components/civic/CivicMotif'
import { useAuth } from '@/hooks/useAuth'
import { casesAPI } from '@/lib/api/cases'
import {
  CITIZEN_CATEGORIES,
  PRIORITY_OPTIONS,
  clearDraft,
  createEmptyWizardState,
  loadDraft,
  newClientRequestId,
  saveDraft,
  type ReportWizardState,
} from '@/lib/report/draft'
import { trackReportEvent } from '@/lib/telemetry/report'
import {
  CreateCaseInputSchema,
  getCategoryDefinition,
  isWithinSouthAfrica,
  type CreateCaseResponse,
} from '@servesa/case-contract'

type MediaUiStatus = 'idle' | 'uploading' | 'completed' | 'partial' | 'failed'

export default function ReportPage() {
  const { user, loading: authLoading } = useAuth()
  const [state, setState] = useState<ReportWizardState>(() =>
    createEmptyWizardState(newClientRequestId())
  )
  const [photos, setPhotos] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CreateCaseResponse | null>(null)
  const [mediaStatus, setMediaStatus] = useState<MediaUiStatus>('idle')
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const submitLock = useRef(false)
  const hydrated = useRef(false)

  const debugLocation =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug')

  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const draft = loadDraft()
    if (draft && draft.step < 4) {
      setState(draft)
    }
    trackReportEvent('wizard_step_viewed', { step: draft?.step || 1 })
  }, [])

  useEffect(() => {
    if (state.step < 4) {
      saveDraft({
        ...state,
        photosMeta: photos.map((p) => ({
          name: p.name,
          size: p.size,
          type: p.type,
        })),
      })
    }
  }, [state, photos])

  useEffect(() => {
    trackReportEvent('wizard_step_viewed', { step: state.step })
  }, [state.step])

  const anonymousSessionId = useMemo(() => {
    if (typeof window === 'undefined') return state.clientRequestId
    const key = 'servesa.anonymousSessionId'
    let id = localStorage.getItem(key)
    if (!id) {
      id = newClientRequestId()
      localStorage.setItem(key, id)
    }
    return id
  }, [state.clientRequestId])

  const update = (patch: Partial<ReportWizardState>) => {
    setState((prev) => ({ ...prev, ...patch }))
  }

  const canProceedStep1 = Boolean(
    state.uiCategoryId &&
      state.title.trim().length >= 5 &&
      state.description.trim().length >= 10
  )

  const canProceedStep2 = Boolean(
    state.location.latitude != null &&
      state.location.longitude != null &&
      state.location.locationSource &&
      isWithinSouthAfrica(state.location.latitude, state.location.longitude)
  )

  const canProceedStep3 = Boolean(
    state.reporter.name.trim().length >= 2 &&
      (state.reporter.email.trim() || state.reporter.phone.trim()) &&
      state.consent.dataProcessing &&
      photos.length >= 1
  )

  const buildPayload = () => {
    const categoryDef = getCategoryDefinition(state.uiCategoryId)
    const address =
      state.location.address || state.location.summary || undefined
    return {
      title: state.title,
      description: state.description,
      category: state.uiCategoryId,
      subcategory: categoryDef?.subcategory || undefined,
      priority: state.priority,
      latitude: state.location.latitude as number,
      longitude: state.location.longitude as number,
      locationSource: state.location.locationSource as
        | 'device_gps'
        | 'map_pin'
        | 'address_search',
      address: address || undefined,
      reporter: {
        name: state.reporter.name,
        email: state.reporter.email || undefined,
        phone: state.reporter.phone || undefined,
      },
      consent: {
        dataProcessing: true as const,
        communications: state.consent.communications,
      },
      clientRequestId: state.clientRequestId,
      anonymousSessionId: user ? undefined : anonymousSessionId,
    }
  }

  const handleSubmit = async () => {
    if (submitLock.current || isSubmitting) return
    setSubmitError(null)
    setFieldErrors({})

    const payload = buildPayload()
    const parsed = CreateCaseInputSchema.safeParse(payload)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || 'form'
        if (!errors[key]) errors[key] = issue.message
      }
      setFieldErrors(errors)
      trackReportEvent('validation_failure', {
        count: parsed.error.issues.length,
      })
      return
    }

    submitLock.current = true
    setIsSubmitting(true)
    trackReportEvent('submission_started')

    if (photos.length < 1) {
      setSubmitError('At least one photo of the issue is required.')
      submitLock.current = false
      setIsSubmitting(false)
      return
    }

    try {
      const created = await casesAPI.createCase(parsed.data as any)
      setResult(created)
      trackReportEvent('case_created', {
        georesolutionStatus: created.georesolutionStatus,
      })

      // Mandatory media after durable case id
      setMediaStatus('uploading')
      trackReportEvent('media_upload_started', { count: photos.length })
      try {
        const mediaResult = await casesAPI.uploadMedia(created.caseId, photos)
        setMediaStatus(mediaResult.status)
        if (!mediaResult.success) {
          setMediaError(
            mediaResult.error ||
              'Photos could not be uploaded. Your case was created — please retry photos.'
          )
        }
        trackReportEvent('media_upload_completed', {
          status: mediaResult.status,
        })
      } catch (mediaErr) {
        setMediaStatus('failed')
        setMediaError(
          mediaErr instanceof Error
            ? mediaErr.message
            : 'Photo upload failed. Your case was still created — please retry.'
        )
      }

      // Duplicate assessment — non-blocking advisory (legacy geo+text)
      try {
        await casesAPI.checkDuplicates(created.caseId)
        trackReportEvent('duplicate_assessment_completed')
      } catch {
        // advisory only
      }

      clearDraft()
      setState((prev) => ({ ...prev, step: 4 }))
      // Keep submit lock after successful create (idempotency via clientRequestId)
    } catch (error) {
      trackReportEvent('case_creation_failed')
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'We could not submit your report. Your answers are saved on this device — check your connection and try again.'
      )
      submitLock.current = false
    } finally {
      setIsSubmitting(false)
    }
  }

  const retryMedia = async () => {
    if (!result?.caseId || photos.length === 0) return
    setMediaStatus('uploading')
    setMediaError(null)
    try {
      const mediaResult = await casesAPI.uploadMedia(result.caseId, photos)
      setMediaStatus(mediaResult.status)
      if (!mediaResult.success) {
        setMediaError(mediaResult.error || 'Upload failed')
      }
    } catch (error) {
      setMediaStatus('failed')
      setMediaError(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  const copyReference = async () => {
    if (!result?.reference) return
    try {
      await navigator.clipboard.writeText(result.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  const reportAnother = () => {
    submitLock.current = false
    setResult(null)
    setPhotos([])
    setMediaStatus('idle')
    setMediaError(null)
    setSubmitError(null)
    const next = createEmptyWizardState(newClientRequestId())
    setState(next)
    clearDraft()
  }

  if (authLoading) {
    return <Spinner label="Preparing the report form…" />
  }

  const renderStep1 = () => (
    <div className="space-y-6" aria-label="Step 1: What">
      <div>
        <h3 className="mb-4 font-display text-h4 text-ink">
          What type of issue are you reporting?
        </h3>
        <div className="grid gap-3 md:grid-cols-2" role="listbox" aria-label="Categories">
          {CITIZEN_CATEGORIES.map((category) => {
            const Icon = categoryOutlineIcon(category.uiId)
            const selected = state.uiCategoryId === category.uiId
            return (
            <button
              key={category.uiId}
              type="button"
              role="option"
              aria-selected={selected}
              data-testid={`category-${category.uiId}`}
              onClick={() => update({ uiCategoryId: category.uiId })}
              className={`min-h-touch rounded-lg border p-4 text-left transition-colors duration-fast ${
                selected
                  ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                  : 'border-border bg-surface hover:border-primary-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${
                    selected
                      ? 'border-primary-200 bg-primary-100 text-primary-800'
                      : 'border-border bg-surface-muted text-ink-muted'
                  }`}
                  aria-hidden
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <div className="font-medium text-ink">{category.label}</div>
                  <div className="text-body-sm text-ink-muted">{category.description}</div>
                </div>
              </div>
            </button>
            )
          })}
        </div>
        {/* Hidden select for e2e compatibility */}
        <select
          className="sr-only"
          data-testid="category"
          aria-label="Category"
          value={
            getCategoryDefinition(state.uiCategoryId)?.category || ''
          }
          onChange={(e) => {
            const match = CITIZEN_CATEGORIES.find(
              (c) => c.category === e.target.value || c.uiId === e.target.value
            )
            if (match) update({ uiCategoryId: match.uiId })
          }}
        >
          <option value="">Select</option>
          {CITIZEN_CATEGORIES.map((c) => (
            <option key={c.uiId} value={c.category}>
              {c.label}
            </option>
          ))}
        </select>
        {fieldErrors.category && (
          <p className="text-sm text-danger mt-2" data-testid="category-error">
            {fieldErrors.category}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2" htmlFor="title">
          Issue title *
        </label>
        <input
          id="title"
          data-testid="title"
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Brief description of the issue"
          className="w-full px-3 py-2 border border-border rounded-lg min-h-[44px]"
        />
        {fieldErrors.title && (
          <p className="text-sm text-danger mt-1" data-testid="title-error">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-ink mb-2"
          htmlFor="description"
        >
          Detailed description *
        </label>
        <textarea
          id="description"
          data-testid="description"
          value={state.description}
          onChange={(e) => update({ description: e.target.value })}
          placeholder="What happened, who is affected, and any useful landmarks…"
          rows={4}
          className="w-full px-3 py-2 border border-border rounded-lg"
        />
        {fieldErrors.description && (
          <p className="text-sm text-danger mt-1" data-testid="description-error">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-ink mb-2">
            Priority
          </legend>
          <div className="space-y-2">
            {PRIORITY_OPTIONS.map((priority) => (
              <label
                key={priority.id}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-surface-muted min-h-[44px]"
              >
                <input
                  type="radio"
                  name="priority"
                  data-testid={`priority-${priority.id}`}
                  value={priority.id}
                  checked={state.priority === priority.id}
                  onChange={() => update({ priority: priority.id })}
                  className="mt-1 text-primary-600"
                />
                <div>
                  <div className="font-medium">{priority.name}</div>
                  <div className="text-sm text-ink-subtle">{priority.description}</div>
                </div>
              </label>
            ))}
          </div>
          <select
            className="sr-only"
            data-testid="priority"
            aria-label="Priority"
            value={state.priority}
            onChange={(e) =>
              update({ priority: e.target.value as ReportWizardState['priority'] })
            }
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </fieldset>
        {state.priority === 'emergency' && (
          <div
            className="mt-3 flex gap-2 text-sm text-warning bg-warning-tint border border-warning-border rounded-lg p-3"
            role="status"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Emergency priority is for immediate danger to life, safety, or critical
              infrastructure. Misuse may delay genuine emergencies. If someone is in
              immediate danger, also contact emergency services.
            </span>
          </div>
        )}
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6" aria-label="Step 3: Who">
      <div>
        <h3 className="text-lg font-semibold mb-2">Your contact details</h3>
        <p className="text-ink-muted mb-4 text-sm">
          {user
            ? 'You are signed in. We will also link this case to your account.'
            : 'You can report without signing in. Provide at least an email or mobile number so we can send updates.'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-2" htmlFor="name">
              Full name *
            </label>
            <input
              id="name"
              data-testid="reporter-name"
              value={state.reporter.name}
              onChange={(e) =>
                update({ reporter: { ...state.reporter, name: e.target.value } })
              }
              className="w-full px-3 py-2 border border-border rounded-lg min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              data-testid="reporter-email"
              value={state.reporter.email}
              onChange={(e) =>
                update({ reporter: { ...state.reporter, email: e.target.value } })
              }
              className="w-full px-3 py-2 border border-border rounded-lg min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2" htmlFor="phone">
              Mobile number
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              data-testid="reporter-phone"
              value={state.reporter.phone}
              onChange={(e) =>
                update({ reporter: { ...state.reporter, phone: e.target.value } })
              }
              placeholder="082 123 4567"
              aria-describedby="phone-hint"
              className="w-full px-3 py-2 border border-border rounded-lg min-h-[44px] text-base"
            />
            <p id="phone-hint" className="mt-1 text-xs text-ink-subtle">
              Enter a South African mobile number, such as 082 123 4567.
            </p>
          </div>
          {fieldErrors.reporter && (
            <p className="text-sm text-danger">{fieldErrors.reporter}</p>
          )}
        </div>
      </div>

      <PhotoUploader photos={photos} onChange={setPhotos} />

      <div className="space-y-3 border rounded-lg p-4 bg-surface-muted">
        <label className="flex items-start gap-3 min-h-[44px]">
          <input
            type="checkbox"
            data-testid="consent"
            checked={state.consent.dataProcessing}
            onChange={(e) =>
              update({
                consent: { ...state.consent, dataProcessing: e.target.checked },
              })
            }
            className="mt-1"
          />
          <span className="text-sm text-ink">
            I consent to Serve SA processing my report and contact details to route this
            case to the responsible municipality. *
          </span>
        </label>
        {fieldErrors['consent.dataProcessing'] && (
          <p className="text-sm text-danger" data-testid="consent-error">
            {fieldErrors['consent.dataProcessing']}
          </p>
        )}
        <label className="flex items-start gap-3 min-h-[44px]">
          <input
            type="checkbox"
            checked={state.consent.communications}
            onChange={(e) =>
              update({
                consent: { ...state.consent, communications: e.target.checked },
              })
            }
            className="mt-1"
          />
          <span className="text-sm text-ink">
            Optional: send me status updates by email or push notification.
          </span>
        </label>
        <p className="text-xs text-ink-subtle">
          Contact details are used only for case updates and municipal routing. They are
          not shown on the public map.
        </p>
      </div>
    </div>
  )

  const renderStep4 = () => {
    if (!result) return null
    const categoryLabel =
      getCategoryDefinition(state.uiCategoryId)?.label || result.ward?.name || state.uiCategoryId
    const caseNumber = result.reference || result.caseId

    return (
      <div className="relative overflow-hidden py-8 text-center" data-testid="success-message">
        <CivicMotif variant="panel" className="opacity-80" />
        <div className="relative">
          <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" aria-hidden />
          <h3 className="mb-2 font-display text-h2 text-ink">Report submitted</h3>
          <p className="mb-6 text-ink-muted">
            Your case has been created. Keep your Case Number for follow-up.
          </p>

          <div className="mb-6 space-y-4 rounded-lg border border-green-200 bg-green-50/60 p-5 text-left">
            <div>
              <p className="text-label text-green-800">Case Number</p>
              <p
                className="mt-1 font-mono text-2xl font-bold tracking-wide text-ink sm:text-3xl"
                data-testid="case-reference"
              >
                {caseNumber}
              </p>
            </div>
            <MunicipalityIdentity
              municipalityName={result.municipality?.name}
              municipalityCode={result.municipality?.id}
              wardName={result.ward?.name || result.ward?.number}
              wardCode={result.ward?.id}
              routingPending={result.routingPending}
            />
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-ink-muted">Category</p>
                <p className="font-medium text-ink">{categoryLabel}</p>
              </div>
              <div>
                <p className="text-ink-muted">Status</p>
                <StatusBadge status={result.status} />
              </div>
              <div>
                <p className="text-ink-muted">Your Location</p>
                <p className="font-medium text-ink">
                  {state.location.summary ||
                    state.location.address ||
                    [result.ward?.name, result.municipality?.name]
                      .filter(Boolean)
                      .join(', ') ||
                    'Captured'}
                </p>
              </div>
              <div>
                <p className="text-ink-muted">Target response</p>
                <p className="font-medium text-ink">
                  {result.targetHours}h (by{' '}
                  {new Date(result.slaTarget).toLocaleString('en-ZA')})
                </p>
              </div>
            </div>
            {result.routingPending && (
              <AlertBanner variant="warning" className="text-left">
                We are confirming which authority should receive this report. Your
                Case Number is valid while that happens.
              </AlertBanner>
            )}
          </div>

          {mediaStatus === 'uploading' && (
            <p className="mb-3 text-sm text-info">Photo upload in progress…</p>
          )}
          {(mediaStatus === 'failed' || mediaStatus === 'partial') && (
            <div className="mb-4 rounded-lg border border-warning-border bg-warning-tint p-3 text-sm text-warning">
              <p>{mediaError || 'Some photos could not be uploaded.'}</p>
              <p className="mt-1 font-medium">Your case was still created successfully.</p>
              <Button type="button" variant="outline" size="sm" className="mt-2" onClick={retryMedia}>
                Retry photo upload
              </Button>
            </div>
          )}
          {mediaStatus === 'completed' && (
            <p className="mb-3 text-sm text-green-700">Photos uploaded successfully.</p>
          )}

          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button type="button" variant="outline" onClick={copyReference}>
              <Copy className="mr-2 h-4 w-4" aria-hidden />
              {copied ? 'Copied' : 'Copy Case Number'}
            </Button>
            <Link href={result.shareUrl.replace(/^https?:\/\/[^/]+/, '') || `/case/${result.caseId}`}>
              <Button data-testid="view-case">View case</Button>
            </Link>
            <Button type="button" variant="outline" onClick={reportAnother}>
              Report another issue
            </Button>
          </div>

          <p className="mt-4 break-all text-xs text-ink-subtle">Share link: {result.shareUrl}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-8">
        <PageHeader
          title="Report an Issue"
          description="Describe the problem, confirm the place, add at least one photo, and submit. Sign-in is optional."
          breadcrumbs={[
            { href: '/', label: 'Home' },
            { label: 'Report an Issue' },
          ]}
        />

        {state.step < 4 && (
          <Stepper
            className="mb-8 max-w-2xl"
            current={state.step}
            steps={['What', 'Where', 'Who', 'Done']}
          />
        )}

        {state.step === 4 && (
          <Stepper
            className="mb-8 max-w-2xl"
            current={4}
            steps={['What', 'Where', 'Who', 'Done']}
          />
        )}

        <div className="mx-auto max-w-2xl">
          <Card>
            <CardContent className="p-6">
              {state.step === 1 && renderStep1()}
              {state.step === 2 && (
                <LocationStep
                  value={state.location}
                  onChange={(location) => update({ location })}
                  debug={debugLocation}
                />
              )}
              {state.step === 3 && renderStep3()}
              {state.step === 4 && renderStep4()}

              {submitError && (
                <div
                  className="mt-4 rounded-lg border border-danger-border bg-danger-tint p-3 text-sm text-danger"
                  role="alert"
                  data-testid="submit-error"
                >
                  {submitError}
                  <p className="mt-1 text-xs">
                    Your form answers are preserved. Check your connection and try again.
                  </p>
                </div>
              )}

              {state.step < 4 && (
                <div className="mt-8 flex justify-between gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      update({ step: Math.max(1, state.step - 1) as 1 | 2 | 3 })
                    }
                    disabled={state.step === 1 || isSubmitting}
                  >
                    Previous
                  </Button>

                  {state.step < 3 ? (
                    <Button
                      onClick={() =>
                        update({ step: (state.step + 1) as 2 | 3 })
                      }
                      disabled={
                        (state.step === 1 && !canProceedStep1) ||
                        (state.step === 2 && !canProceedStep2)
                      }
                      data-testid="next-step"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!canProceedStep3 || isSubmitting}
                      data-testid="submit"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" aria-hidden />
                          Submit report
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
