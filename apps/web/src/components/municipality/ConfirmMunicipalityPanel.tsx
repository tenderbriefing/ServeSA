'use client'

import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import {
  MunicipalitySelectFields,
  type MunicipalitySelection,
} from '@/components/municipality/MunicipalitySelectFields'
import {
  isValidMunicipalitySelection,
  normalizeOptionalWard,
} from '@/lib/southAfricaData'

type ConfirmMunicipalityPanelProps = {
  onSaved?: (municipalityCode: string) => void
  title?: string
  description?: string
}

/**
 * Authenticated onboarding when Serve SA cannot confirm the citizen's municipality.
 * Persists profile then refreshes shared auth/profile context — no stale override.
 */
export function ConfirmMunicipalityPanel({
  onSaved,
  title = 'Confirm your municipality',
  description = 'Serve SA uses your municipality to show you local updates, community ideas, municipal plans and service information relevant to where you live.',
}: ConfirmMunicipalityPanelProps) {
  const { user, userProfile, refreshProfile } = useAuth()
  const [selection, setSelection] = useState<MunicipalitySelection>({
    province: userProfile?.province || '',
    municipalityCode: '',
    wardId: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!user) return
    if (!isValidMunicipalitySelection(selection.province, selection.municipalityCode)) {
      setError('Select a valid province and municipality.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const wardId = normalizeOptionalWard(selection.wardId)
      await updateDoc(doc(db, 'users', user.uid), {
        province: selection.province,
        municipalityCode: selection.municipalityCode,
        wardId: wardId,
        updatedAt: new Date(),
      })
      await refreshProfile()
      onSaved?.(selection.municipalityCode)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Unable to save your municipality. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="mx-auto max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm"
      aria-labelledby="confirm-muni-heading"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
          <MapPin className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h1
            id="confirm-muni-heading"
            className="font-display text-h3 text-ink"
          >
            {title}
          </h1>
          <p className="mt-2 text-body-sm text-ink-muted">{description}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <MunicipalitySelectFields
          idPrefix="confirm"
          required
          showWard
          value={selection}
          onChange={setSelection}
          disabled={saving}
        />

        {error ? (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="min-h-touch w-full"
          disabled={
            !isValidMunicipalitySelection(
              selection.province,
              selection.municipalityCode
            ) || saving
          }
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save municipality'}
        </Button>
        <p className="text-caption text-ink-subtle">
          Changing this only updates your citizen location context. It does not
          grant municipal staff access. We will not show another municipality’s
          plans while yours is unconfirmed.
        </p>
      </div>
    </section>
  )
}
