'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Building2, User } from 'lucide-react'
import { doc, updateDoc } from 'firebase/firestore'
import { AuthGate } from '@/components/Auth/AuthGate'
import { useAuth } from '@/hooks/useAuth'
import { useCitizenMunicipality } from '@/hooks/useCitizenMunicipality'
import {
  MunicipalitySelectFields,
  type MunicipalitySelection,
} from '@/components/municipality/MunicipalitySelectFields'
import { Button } from '@/components/ui/Button'
import { db } from '@/lib/firebase'
import {
  getMunicipalityDisplayName,
  isValidMunicipalitySelection,
  normalizeOptionalWard,
} from '@/lib/southAfricaData'
import { FEATURE_FLAGS } from '@/lib/constants'

function AccountMunicipalitySection() {
  const { user, userProfile, refreshProfile, isOfficial } = useAuth()
  const { municipalityCode, confirmed } = useCitizenMunicipality()
  const profileWard =
    (userProfile as { wardId?: string } | null)?.wardId || ''
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [selection, setSelection] = useState<MunicipalitySelection>({
    province: userProfile?.province || '',
    municipalityCode: municipalityCode || '',
    wardId: profileWard,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSelection({
      province: userProfile?.province || '',
      municipalityCode: municipalityCode || '',
      wardId: profileWard,
    })
  }, [userProfile?.province, municipalityCode, profileWard])

  const displayName = getMunicipalityDisplayName(municipalityCode)

  const persist = async () => {
    if (!user) return
    if (
      !isValidMunicipalitySelection(selection.province, selection.municipalityCode)
    ) {
      setError('Select a valid province and municipality.')
      return
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const municipalityChanged =
        selection.municipalityCode !== (municipalityCode || '')
      const wardId = municipalityChanged
        ? normalizeOptionalWard(selection.wardId)
        : normalizeOptionalWard(selection.wardId)
      await updateDoc(doc(db, 'users', user.uid), {
        province: selection.province,
        municipalityCode: selection.municipalityCode,
        wardId,
        updatedAt: new Date(),
      })
      await refreshProfile()
      setEditing(false)
      setConfirming(false)
      setMessage(
        'Municipality updated. Local updates and plans will use this municipality. Historical cases keep their original jurisdiction.'
      )
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Unable to update municipality.'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <section
      className="rounded-xl border border-border bg-surface p-5"
      aria-labelledby="account-muni-heading"
    >
      <div className="flex items-start gap-3">
        <Building2 className="mt-0.5 h-5 w-5 text-primary-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="account-muni-heading" className="font-display text-h4 text-ink">
            Your Municipality
          </h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Used for My Municipality, Municipal Updates and Community Ideas.
            Changing this never grants municipal staff permissions and does not
            move historical cases between municipalities.
          </p>

          {!editing ? (
            <div className="mt-4 space-y-3">
              <p className="text-body text-ink">
                {confirmed ? (
                  <>
                    Current municipality:{' '}
                    <strong>{displayName}</strong>
                  </>
                ) : (
                  <span>No municipality confirmed yet.</span>
                )}
              </p>
              {profileWard ? (
                <p className="text-body-sm text-ink-muted">
                  Ward (optional profile): <strong>{profileWard}</strong>
                </p>
              ) : (
                <p className="text-body-sm text-ink-subtle">
                  Ward — optional. Not set. Issue routing uses authoritative GIS
                  location, not this profile field.
                </p>
              )}
              {isOfficial ? (
                <p className="rounded-md border border-border bg-surface-muted px-3 py-2 text-caption text-ink-muted">
                  Staff access comes from server-issued claims, not this citizen
                  municipality setting.
                </p>
              ) : null}
              <Button
                variant="outline"
                className="min-h-touch"
                onClick={() => {
                  setEditing(true)
                  setConfirming(false)
                  setMessage(null)
                }}
              >
                {confirmed ? 'Change municipality' : 'Confirm municipality'}
              </Button>
              {FEATURE_FLAGS.enableMunicipalPlanning ? (
                <Link
                  href="/municipality"
                  className="ml-3 text-body-sm font-medium text-primary-700 underline-offset-4 hover:underline"
                >
                  Open My Municipality
                </Link>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <MunicipalitySelectFields
                idPrefix="account"
                required
                showWard
                value={selection}
                onChange={(next) => {
                  setSelection(next)
                  setConfirming(false)
                }}
                disabled={saving}
              />
              {!confirming ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    className="min-h-touch"
                    disabled={
                      !isValidMunicipalitySelection(
                        selection.province,
                        selection.municipalityCode
                      )
                    }
                    onClick={() => setConfirming(true)}
                  >
                    Review change
                  </Button>
                  <Button
                    variant="ghost"
                    className="min-h-touch"
                    onClick={() => {
                      setEditing(false)
                      setConfirming(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="rounded-md border border-primary-200 bg-primary-50/50 p-4">
                  <p className="text-body-sm text-ink">
                    Save municipality as{' '}
                    <strong>
                      {getMunicipalityDisplayName(selection.municipalityCode)}
                    </strong>
                    ?
                  </p>
                  <p className="mt-1 text-caption text-ink-muted">
                    Updates, ideas and municipal plans will switch to this
                    municipality after you save. Existing cases keep their
                    original municipality.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="min-h-touch"
                      disabled={saving}
                      onClick={persist}
                    >
                      {saving ? 'Saving…' : 'Confirm and save'}
                    </Button>
                    <Button
                      variant="outline"
                      className="min-h-touch"
                      disabled={saving}
                      onClick={() => setConfirming(false)}
                    >
                      Back
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {message ? (
            <p className="mt-3 text-body-sm text-green-700" role="status">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-body-sm text-danger" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function AccountContent() {
  const { user, userProfile } = useAuth()
  const name =
    userProfile?.firstName && userProfile?.lastName
      ? `${userProfile.firstName} ${userProfile.lastName}`
      : user?.displayName || user?.email || 'Your account'

  return (
    <div className="bg-canvas py-10">
      <div className="container max-w-2xl space-y-6">
        <header>
          <p className="text-label font-display text-primary-700">Account</p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-h1 text-ink">
            <User className="h-8 w-8 text-primary-600" aria-hidden />
            {name}
          </h1>
          <p className="mt-2 text-body text-ink-muted">
            Manage your Serve SA citizen profile settings.
          </p>
        </header>
        <AccountMunicipalitySection />
        <p className="text-caption text-ink-subtle">
          Need your cases?{' '}
          <Link href="/dashboard" className="text-primary-700 underline">
            Open My Cases
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function AccountPage() {
  return (
    <AuthGate
      next="/account"
      title="Sign in to manage your account"
      description="Municipality and profile settings are available after you sign in."
    >
      <AccountContent />
    </AuthGate>
  )
}
