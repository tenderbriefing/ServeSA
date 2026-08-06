'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Camera,
  CheckCircle,
  Copy,
  Send,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { LocationStep } from '@/components/Report/LocationStep'
import { PageHeader } from '@/components/ui/PageHeader'
import { Stepper } from '@/components/ui/Stepper'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Spinner } from '@/components/ui/LoadingSkeleton'
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

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((f) => {
      const okType = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ].includes(f.type)
      return okType && f.size > 0 && f.size <= 10 * 1024 * 1024
    })
    setPhotos((prev) => [...prev, ...files].slice(0, 5))
  }

  const buildPayload = () => {
    const categoryDef = getCategoryDefinition(state.uiCategoryId)
    return {
      title: state.title,
      description: state.description,
      category: state.uiCategoryId,
      subcategory: categoryDef?.subcategory,
      priority: state.priority,
      latitude: state.location.latitude as number,
      longitude: state.location.longitude as number,
      locationSource: state.location.locationSource as
        | 'device_gps'
        | 'map_pin'
        | 'address_search',
      address: state.location.address || state.location.summary,
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
      const created = await casesAPI.createCase(payload as any)
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
        <h3 className="text-lg font-semibold mb-4">What type of issue are you reporting?</h3>
        <div className="grid md:grid-cols-2 gap-4" role="listbox" aria-label="Categories">
          {CITIZEN_CATEGORIES.map((category) => (
            <button
              key={category.uiId}
              type="button"
              role="option"
              aria-selected={state.uiCategoryId === category.uiId}
              data-testid={`category-${category.uiId}`}
              onClick={() => update({ uiCategoryId: category.uiId })}
              className={`p-4 border rounded-lg text-left transition-colors min-h-[44px] ${
                state.uiCategoryId === category.uiId
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden>
                  {category.icon}
                </span>
                <div>
                  <div className="font-medium">{category.label}</div>
                  <div className="text-sm text-gray-500">{category.description}</div>
                </div>
              </div>
            </button>
          ))}
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
          <p className="text-sm text-red-600 mt-2" data-testid="category-error">
            {fieldErrors.category}
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="title">
          Issue title *
        </label>
        <input
          id="title"
          data-testid="title"
          value={state.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="Brief description of the issue"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
        />
        {fieldErrors.title && (
          <p className="text-sm text-red-600 mt-1" data-testid="title-error">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div>
        <label
          className="block text-sm font-medium text-gray-700 mb-2"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        />
        {fieldErrors.description && (
          <p className="text-sm text-red-600 mt-1" data-testid="description-error">
            {fieldErrors.description}
          </p>
        )}
      </div>

      <div>
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700 mb-2">
            Priority
          </legend>
          <div className="space-y-2">
            {PRIORITY_OPTIONS.map((priority) => (
              <label
                key={priority.id}
                className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 min-h-[44px]"
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
                  <div className="text-sm text-gray-500">{priority.description}</div>
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
            className="mt-3 flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3"
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
        <p className="text-gray-600 mb-4 text-sm">
          {user
            ? 'You are signed in. We will also link this case to your account.'
            : 'You can report without signing in. Provide at least an email or mobile number so we can send updates.'}
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="name">
              Full name *
            </label>
            <input
              id="name"
              data-testid="reporter-name"
              value={state.reporter.name}
              onChange={(e) =>
                update({ reporter: { ...state.reporter, name: e.target.value } })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="email">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="phone">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px] text-base"
            />
            <p id="phone-hint" className="mt-1 text-xs text-ink-subtle">
              Enter a South African mobile number, such as 082 123 4567.
            </p>
          </div>
          {fieldErrors.reporter && (
            <p className="text-sm text-red-600">{fieldErrors.reporter}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos <span className="text-red-600">*</span>
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-2">
            At least one clear photo is required so officials can see the issue.
            You may add up to 5 images (JPEG, PNG, WebP or HEIC), max 10MB each.
            Your case is saved first, then photos upload securely.
          </p>
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            onChange={handlePhotoUpload}
            className="hidden"
            id="photo-upload"
            data-testid="photo-upload"
            required
          />
          <label htmlFor="photo-upload" className="cursor-pointer inline-block">
            <span className="inline-flex items-center px-3 py-2 border rounded-md text-sm min-h-[44px]">
              <Camera className="w-4 h-4 mr-2" />
              Select photos
            </span>
          </label>
        </div>
        {photos.length > 0 ? (
          <p className="text-sm text-gray-600 mt-2">{photos.length} photo(s) selected</p>
        ) : (
          <p className="text-sm text-amber-700 mt-2">
            Add at least one clear photo of the issue to submit.
          </p>
        )}
      </div>

      <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
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
          <span className="text-sm text-gray-700">
            I consent to ServeSA processing my report and contact details to route this
            case to the responsible municipality. *
          </span>
        </label>
        {fieldErrors['consent.dataProcessing'] && (
          <p className="text-sm text-red-600" data-testid="consent-error">
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
          <span className="text-sm text-gray-700">
            Optional: send me status updates by email or push notification.
          </span>
        </label>
        <p className="text-xs text-gray-500">
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

    return (
      <div className="text-center py-8" data-testid="success-message">
        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Report submitted</h3>
        <p className="text-gray-600 mb-6">
          Your case has been created. Keep your reference number for follow-up.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-left space-y-3 mb-6">
          <div>
            <p className="text-sm text-gray-600">Case reference</p>
            <p className="text-lg font-mono font-bold" data-testid="case-reference">
              {result.reference}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Category</p>
              <p className="font-medium">{categoryLabel}</p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="font-medium capitalize">{result.status}</p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium">
                {state.location.summary ||
                  state.location.address ||
                  [
                    result.ward?.name,
                    result.municipality?.name,
                  ]
                    .filter(Boolean)
                    .join(', ') ||
                  'Captured'}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Target response</p>
              <p className="font-medium">
                {result.targetHours}h (by {new Date(result.slaTarget).toLocaleString()})
              </p>
            </div>
          </div>
          {result.routingPending && (
            <AlertBanner variant="warning" className="text-left">
              We are confirming which authority should receive this report. Your
              case reference is valid while that happens.
            </AlertBanner>
          )}
        </div>

        {mediaStatus === 'uploading' && (
          <p className="text-sm text-blue-700 mb-3">Photo upload in progress…</p>
        )}
        {(mediaStatus === 'failed' || mediaStatus === 'partial') && (
          <div className="mb-4 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p>{mediaError || 'Some photos could not be uploaded.'}</p>
            <p className="mt-1 font-medium">Your case was still created successfully.</p>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={retryMedia}>
              Retry photo upload
            </Button>
          </div>
        )}
        {mediaStatus === 'completed' && (
          <p className="text-sm text-green-700 mb-3">Photos uploaded successfully.</p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button type="button" variant="outline" onClick={copyReference}>
            <Copy className="w-4 h-4 mr-2" />
            {copied ? 'Copied' : 'Copy reference'}
          </Button>
          <Link href={result.shareUrl.replace(/^https?:\/\/[^/]+/, '') || `/case/${result.caseId}`}>
            <Button data-testid="view-case">View case</Button>
          </Link>
          <Button type="button" variant="outline" onClick={reportAnother}>
            Report another issue
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-4 break-all">Share link: {result.shareUrl}</p>
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
            steps={['What', 'Where', 'Who & photos']}
          />
        )}

        <div className="max-w-2xl mx-auto">
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
                  className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3"
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
                <div className="flex justify-between mt-8 gap-3">
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
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
