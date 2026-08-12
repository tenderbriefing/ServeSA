'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert, AlertDescription } from '@/components/ui/Alert'
import { Phone, AlertCircle, CheckCircle } from 'lucide-react'
import {
  MunicipalitySelectFields,
  type MunicipalitySelection,
} from '@/components/municipality/MunicipalitySelectFields'
import {
  isValidMunicipalitySelection,
  normalizeOptionalWard,
} from '@/lib/southAfricaData'

interface CompleteProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Legacy profile completion modal. Aligns with national onboarding:
 * province + municipality required when saving; ward optional.
 * Prefer ConfirmMunicipalityPanel / CitizenMunicipalityGate for gated routes.
 */
export function CompleteProfileModal({
  isOpen,
  onClose,
}: CompleteProfileModalProps) {
  const { user, userProfile, refreshProfile } = useAuth()
  const [phone, setPhone] = useState(userProfile?.phone || '')
  const [selection, setSelection] = useState<MunicipalitySelection>({
    province: userProfile?.province || '',
    municipalityCode: userProfile?.municipalityCode || '',
    wardId: (userProfile as { wardId?: string } | null)?.wardId || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (
      !isValidMunicipalitySelection(
        selection.province,
        selection.municipalityCode
      )
    ) {
      setError('Select a valid province and municipality.')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const userDocRef = doc(db, 'users', user.uid)
      await updateDoc(userDocRef, {
        phone: phone.trim() || null,
        province: selection.province,
        municipalityCode: selection.municipalityCode,
        wardId: normalizeOptionalWard(selection.wardId),
        updatedAt: new Date(),
      })
      await refreshProfile()

      setSuccess(true)
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save profile')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">
            Confirm your municipality
          </CardTitle>
          <CardDescription>
            Province and municipality are required so Serve SA can show the
            correct local civic services. Ward is optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="py-6 text-center">
              <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold text-green-700">
                Profile updated
              </h3>
              <p className="text-ink-muted">
                Your municipality context has been saved.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Mobile number{' '}
                  <span className="font-normal text-ink-subtle">(optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle" />
                  <Input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="082 123 4567"
                    className="min-h-touch pl-10"
                  />
                </div>
              </div>

              <MunicipalitySelectFields
                value={selection}
                onChange={setSelection}
                required
                showWard
                idPrefix="complete-profile"
                disabled={isSubmitting}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving…' : 'Save municipality'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
