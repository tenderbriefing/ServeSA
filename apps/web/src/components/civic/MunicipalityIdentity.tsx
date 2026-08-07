'use client'

import { Building2, Layers, MapPinned } from 'lucide-react'
import { cn } from '@/lib/utils'

type MunicipalityIdentityProps = {
  municipalityName?: string | null
  municipalityCode?: string | null
  wardName?: string | null
  wardCode?: string | null
  department?: string | null
  routingPending?: boolean
  className?: string
}

/**
 * Shows resolved municipal identity only — never invents logos.
 */
export function MunicipalityIdentity({
  municipalityName,
  municipalityCode,
  wardName,
  wardCode,
  department,
  routingPending,
  className,
}: MunicipalityIdentityProps) {
  if (routingPending) {
    return (
      <div
        className={cn(
          'rounded-md border border-warning-border bg-warning-tint p-3 text-body-sm text-warning',
          className
        )}
        role="status"
      >
        We are confirming which authority should receive this report. Your case
        number remains valid while that happens.
      </div>
    )
  }

  const hasAnything = municipalityName || wardName || department || municipalityCode
  if (!hasAnything) return null

  return (
    <div
      className={cn(
        'rounded-md border border-primary-100 bg-primary-50/60 p-4',
        className
      )}
      data-testid="municipality-identity"
    >
      <p className="text-caption font-medium uppercase tracking-wide text-primary-700">
        Responsible authority
      </p>
      <ul className="mt-3 space-y-2 text-body-sm text-ink">
        {(municipalityName || municipalityCode) && (
          <li className="flex items-start gap-2">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden />
            <span>
              <span className="font-medium">
                {municipalityName || municipalityCode}
              </span>
              {municipalityName && municipalityCode ? (
                <span className="text-ink-subtle"> ({municipalityCode})</span>
              ) : null}
            </span>
          </li>
        )}
        {(wardName || wardCode) && (
          <li className="flex items-start gap-2">
            <MapPinned className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden />
            <span>
              Ward {wardName || wardCode}
              {wardName && wardCode ? (
                <span className="text-ink-subtle"> · {wardCode}</span>
              ) : null}
            </span>
          </li>
        )}
        {department && (
          <li className="flex items-start gap-2">
            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" aria-hidden />
            <span>{department}</span>
          </li>
        )}
      </ul>
    </div>
  )
}
