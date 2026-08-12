'use client'

import { useEffect, useState } from 'react'
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
  getProvinceByMunicipality,
  southAfricaProvinces,
  type Municipality,
} from '@/lib/southAfricaData'

export type MunicipalitySelection = {
  province: string
  municipalityCode: string
}

type MunicipalitySelectFieldsProps = {
  value: MunicipalitySelection
  onChange: (next: MunicipalitySelection) => void
  disabled?: boolean
  idPrefix?: string
  required?: boolean
}

/**
 * Controlled province → municipality selectors from the static SA dataset.
 * No free-text municipality entry.
 */
export function MunicipalitySelectFields({
  value,
  onChange,
  disabled = false,
  idPrefix = 'muni',
  required = false,
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
      })
    }
    // intentionally only when municipalityCode arrives without province
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.municipalityCode])

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-province`}>
          Province
          {required ? '' : (
            <span className="ml-1 font-normal text-ink-subtle">(optional)</span>
          )}
        </Label>
        <Select
          value={value.province || undefined}
          disabled={disabled}
          onValueChange={(province) =>
            onChange({ province, municipalityCode: '' })
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
          {required ? '' : (
            <span className="ml-1 font-normal text-ink-subtle">(optional)</span>
          )}
        </Label>
        <Select
          value={value.municipalityCode || undefined}
          disabled={disabled || !value.province}
          onValueChange={(municipalityCode) =>
            onChange({ province: value.province, municipalityCode })
          }
        >
          <SelectTrigger
            id={`${idPrefix}-municipality`}
            className="min-h-touch"
            aria-required={required}
          >
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
    </div>
  )
}
