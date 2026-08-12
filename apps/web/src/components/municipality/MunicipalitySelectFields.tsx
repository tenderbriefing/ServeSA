'use client'

import { useEffect, useState } from 'react'
import { Label } from '@/components/ui/Label'
import { Input } from '@/components/ui/Input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  getMunicipalitiesByProvince,
  getProvinceByMunicipality,
  southAfricaProvinces,
  type Municipality,
} from '@/lib/southAfricaData'

export type MunicipalitySelection = {
  province: string
  municipalityCode: string
  /** Optional — blank if citizen does not know their ward */
  wardId?: string
}

type MunicipalitySelectFieldsProps = {
  value: MunicipalitySelection
  onChange: (next: MunicipalitySelection) => void
  disabled?: boolean
  idPrefix?: string
  required?: boolean
  /** Show optional ward field (no fabricated ward catalogue) */
  showWard?: boolean
}

/**
 * Controlled province → municipality selectors from the static SA dataset.
 * No free-text municipality entry. Ward is optional free-text when enabled.
 */
export function MunicipalitySelectFields({
  value,
  onChange,
  disabled = false,
  idPrefix = 'muni',
  required = false,
  showWard = false,
}: MunicipalitySelectFieldsProps) {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([])

  useEffect(() => {
    if (!value.province) {
      setMunicipalities([])
      return
    }
    setMunicipalities(getMunicipalitiesByProvince(value.province))
  }, [value.province])

  // If only municipalityCode is known (e.g. profile), hydrate province
  useEffect(() => {
    if (value.province || !value.municipalityCode) return
    const province = getProvinceByMunicipality(value.municipalityCode)
    if (province) {
      onChange({
        province: province.code,
        municipalityCode: value.municipalityCode,
        wardId: value.wardId || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.municipalityCode])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-province`}>
          Province
          {required ? (
            <span className="ml-1 text-danger">*</span>
          ) : (
            <span className="ml-1 font-normal text-ink-subtle">(optional)</span>
          )}
        </Label>
        <Select
          value={value.province || undefined}
          disabled={disabled}
          onValueChange={(province) =>
            onChange({ province, municipalityCode: '', wardId: '' })
          }
        >
          <SelectTrigger
            id={`${idPrefix}-province`}
            className="min-h-touch"
            aria-required={required}
          >
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
        <Label htmlFor={`${idPrefix}-municipality`}>
          Municipality
          {required ? (
            <span className="ml-1 text-danger">*</span>
          ) : (
            <span className="ml-1 font-normal text-ink-subtle">(optional)</span>
          )}
        </Label>
        <Select
          value={value.municipalityCode || undefined}
          disabled={disabled || !value.province}
          onValueChange={(municipalityCode) =>
            onChange({
              province: value.province,
              municipalityCode,
              wardId: '',
            })
          }
        >
          <SelectTrigger
            id={`${idPrefix}-municipality`}
            className="min-h-touch"
            aria-required={required}
          >
            <SelectValue
              placeholder={
                value.province
                  ? 'Select municipality'
                  : 'Select a province first'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {municipalities.map((m) => (
              <SelectItem key={`${m.code}-${m.name}`} value={m.code}>
                {m.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showWard ? (
        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-ward`}>
            Ward — optional
            <span className="ml-1 font-normal text-ink-subtle">
              (if you know it)
            </span>
          </Label>
          <Input
            id={`${idPrefix}-ward`}
            className="min-h-touch"
            value={value.wardId || ''}
            disabled={disabled || !value.municipalityCode}
            placeholder="Select your ward if you know it"
            maxLength={64}
            onChange={(e) =>
              onChange({
                province: value.province,
                municipalityCode: value.municipalityCode,
                wardId: e.target.value,
              })
            }
            aria-describedby={`${idPrefix}-ward-hint`}
          />
          <p id={`${idPrefix}-ward-hint`} className="text-caption text-ink-subtle">
            You do not need your ward number to use Serve SA. When you report an
            issue, location-based GIS determines the authoritative ward for
            routing.
          </p>
        </div>
      ) : null}
    </div>
  )
}
