'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { communityApi } from '@/lib/api/community'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import { CitizenMunicipalityGate } from '@/components/municipality/CitizenMunicipalityGate'
import { Button } from '@/components/ui/Button'
import { getMunicipalityDisplayName } from '@/lib/southAfricaData'
import {
  COMMUNITY_IDEA_CATEGORY_LABEL,
  CommunityIdeaCategorySchema,
} from '@servesa/case-contract'

const STEPS = ['What', 'Where', 'Type', 'Review'] as const

function NewIdeaForm() {
  const { municipalityCode: muni } = useCitizenMunicipality()
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [suburbLabel, setSuburbLabel] = useState('')
  const [category, setCategory] = useState('parks_and_recreation')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const displayName = getMunicipalityDisplayName(muni)

  const canNext =
    (step === 0 && title.trim().length >= 5 && description.trim().length >= 20) ||
    step === 1 ||
    (step === 2 && CommunityIdeaCategorySchema.safeParse(category).success) ||
    step === 3

  const submit = async () => {
    if (!muni) return
    setSubmitting(true)
    setError(null)
    try {
      const res = (await communityApi.submitIdea({
        title: title.trim(),
        description: description.trim(),
        category,
        municipalityCode: muni,
        suburbLabel: suburbLabel.trim() || undefined,
        clientRequestId:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : undefined,
      })) as { ideaId: string }
      router.push(`/ideas/${res.ideaId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to submit idea')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container max-w-xl py-10">
      <p className="text-label font-display text-green-700">Share an Idea</p>
      <h1 className="mt-2 font-display text-h2 text-ink">
        Guided idea submission
      </h1>
      <p className="mt-2 text-body-sm text-ink-muted">
        Your Municipality: <strong className="text-ink">{displayName}</strong>.
        This is for constructive suggestions. Broken infrastructure belongs on{' '}
        <Link href="/report" className="text-primary-700 underline">
          Report an Issue
        </Link>
        .
      </p>

      <ol className="mt-6 flex gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`rounded-md px-3 py-1 text-caption ${
              i === step
                ? 'bg-green-600 text-white'
                : i < step
                  ? 'bg-green-100 text-green-800'
                  : 'bg-surface-muted text-ink-subtle'
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-4">
        {step === 0 && (
          <>
            <label className="block text-sm font-medium text-ink" htmlFor="title">
              What is your idea?
            </label>
            <input
              id="title"
              className="w-full min-h-touch rounded-md border border-border px-3"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={160}
              required
            />
            <label
              className="block text-sm font-medium text-ink"
              htmlFor="description"
            >
              Describe it clearly
            </label>
            <textarea
              id="description"
              className="min-h-[140px] w-full rounded-md border border-border px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              required
            />
          </>
        )}
        {step === 1 && (
          <>
            <p className="text-body-sm text-ink-muted">
              Municipality: <strong>{displayName}</strong> (from your confirmed
              municipality)
            </p>
            <label className="block text-sm font-medium text-ink" htmlFor="suburb">
              Suburb or area (optional)
            </label>
            <input
              id="suburb"
              className="w-full min-h-touch rounded-md border border-border px-3"
              value={suburbLabel}
              onChange={(e) => setSuburbLabel(e.target.value)}
              maxLength={120}
            />
          </>
        )}
        {step === 2 && (
          <>
            <label
              className="block text-sm font-medium text-ink"
              htmlFor="category"
            >
              Idea type
            </label>
            <select
              id="category"
              className="w-full min-h-touch rounded-md border border-border px-3"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(COMMUNITY_IDEA_CATEGORY_LABEL).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </>
        )}
        {step === 3 && (
          <div className="rounded-md border border-border bg-surface p-4 text-body-sm">
            <p>
              <strong>Title:</strong> {title}
            </p>
            <p className="mt-2">
              <strong>Description:</strong> {description}
            </p>
            <p className="mt-2">
              <strong>Where:</strong> {displayName}
              {suburbLabel ? ` · ${suburbLabel}` : ''}
            </p>
            <p className="mt-2">
              <strong>Type:</strong>{' '}
              {
                COMMUNITY_IDEA_CATEGORY_LABEL[
                  category as keyof typeof COMMUNITY_IDEA_CATEGORY_LABEL
                ]
              }
            </p>
          </div>
        )}
      </div>

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex gap-3">
        {step > 0 ? (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
            Back
          </Button>
        ) : (
          <Link href="/ideas">
            <Button variant="outline">Cancel</Button>
          </Link>
        )}
        {step < STEPS.length - 1 ? (
          <Button
            disabled={!canNext}
            onClick={() => setStep((s) => s + 1)}
            className="bg-green-600 hover:bg-green-700"
          >
            Continue
          </Button>
        ) : (
          <Button
            disabled={submitting}
            onClick={submit}
            className="bg-green-600 hover:bg-green-700"
          >
            {submitting ? 'Submitting…' : 'Submit idea'}
          </Button>
        )}
      </div>
    </div>
  )
}

export default function NewIdeaPage() {
  return (
    <CitizenMunicipalityGate
      next="/ideas/new"
      authTitle="Sign in to share an idea"
      authDescription="Ideas are scoped to your municipality. Sign in, then confirm where you live if needed."
      confirmTitle="Confirm your municipality"
      confirmDescription="Ideas are scoped to your municipality. Confirm where you live before sharing an idea."
    >
      <NewIdeaForm />
    </CitizenMunicipalityGate>
  )
}
