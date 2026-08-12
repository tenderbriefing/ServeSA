'use client'

import { useEffect, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { MapPin } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { db } from '@/lib/firebase'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  getMunicipalitiesByProvince,
  southAfricaProvinces,
  type Municipality,
} from '@/lib/southAfricaData'

type ConfirmMunicipalityPanelProps = {
  onSaved?: (municipalityCode: string) => void
}

/**
 * Authenticated onboarding when Serve SA cannot confirm the citizen's municipality.
 * Never substitutes pilot/JHB planning content.
 */
export function ConfirmMunicipalityPanel({
  onSaved,
}: ConfirmMunicipalityPanelProps) {
  const { user, userProfile } = useAuth()
  const [province, setProvince] = useState(userProfile?.province || '')
  const [municipalityCode, setMunicipalityCode] = useState('')
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!province) {
      setMunicipalities([])
      return
    }
    setMunicipalities(getMunicipalitiesByProvince(province))
  }, [province])

  const handleSave = async () => {
    if (!user || !municipalityCode) return
    setSaving(true)
    setError(null)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        province,
        municipalityCode,
        updatedAt: new Date(),
      })
      onSaved?.(municipalityCode)
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
            Confirm your municipality
          </h1>
          <p className="mt-2 text-body-sm text-ink-muted">
            Serve SA uses your municipality to show you local updates, community
            ideas, municipal plans and service information relevant to where you
            live.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="confirm-province">Province</Label>
          <Select
            value={province || undefined}
            onValueChange={(value) => {
              setProvince(value)
              setMunicipalityCode('')
            }}
          >
            <SelectTrigger id="confirm-province" className="min-h-touch">
              <SelectValue placeholder="Select province" />
            </SelectTrigger>
            <SelectContent>
              {southAfricaProvinces.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-municipality">Municipality</Label>
          <Select
            value={municipalityCode || undefined}
            onValueChange={setMunicipalityCode}
            disabled={!province}
          >
            <SelectTrigger id="confirm-municipality" className="min-h-touch">
              <SelectValue placeholder="Select municipality" />
            </SelectTrigger>
            <SelectContent>
              {municipalities.map((m) => (
                <SelectItem key={m.code} value={m.code}>
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error ? (
          <p className="text-body-sm text-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          className="min-h-touch w-full"
          disabled={!municipalityCode || saving}
          onClick={handleSave}
        >
          {saving ? 'Saving…' : 'Save municipality'}
        </Button>
        <p className="text-caption text-ink-subtle">
          You can update this later from your profile. We will not show another
          municipality’s plans while yours is unconfirmed.
        </p>
      </div>
    </section>
  )
}
