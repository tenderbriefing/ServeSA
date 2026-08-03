'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { MapPin, Navigation, Search, AlertTriangle } from 'lucide-react'
import { isWithinSouthAfrica } from '@servesa/case-contract'
import type { ReportLocationState } from '@/lib/report/draft'
import { trackReportEvent } from '@/lib/telemetry/report'

interface LocationStepProps {
  value: ReportLocationState
  onChange: (next: ReportLocationState) => void
  debug?: boolean
}

type GpsErrorKind = 'denied' | 'unavailable' | 'timeout' | 'insecure' | 'unsupported' | null

export function LocationStep({ value, onChange, debug = false }: LocationStepProps) {
  const [gpsLoading, setGpsLoading] = useState(false)
  const [gpsError, setGpsError] = useState<GpsErrorKind>(null)
  const [addressInput, setAddressInput] = useState(value.address || '')
  const [pinLat, setPinLat] = useState(
    value.latitude != null ? String(value.latitude) : '-26.2041'
  )
  const [pinLng, setPinLng] = useState(
    value.longitude != null ? String(value.longitude) : '28.0473'
  )
  const [pinError, setPinError] = useState<string | null>(null)

  const applyLocation = (next: ReportLocationState) => {
    onChange(next)
  }

  const useDeviceLocation = () => {
    setGpsError(null)
    trackReportEvent('gps_requested')

    if (typeof window !== 'undefined' && !window.isSecureContext) {
      setGpsError('insecure')
      trackReportEvent('gps_denied', { reason: 'insecure' })
      return
    }

    if (!navigator.geolocation) {
      setGpsError('unsupported')
      trackReportEvent('gps_denied', { reason: 'unsupported' })
      return
    }

    setGpsLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false)
        const latitude = position.coords.latitude
        const longitude = position.coords.longitude
        if (!isWithinSouthAfrica(latitude, longitude)) {
          setGpsError('unavailable')
          trackReportEvent('gps_denied', { reason: 'outside_sa' })
          return
        }
        applyLocation({
          latitude,
          longitude,
          address: value.address,
          locationSource: 'device_gps',
          summary: `Current location (±${Math.round(position.coords.accuracy || 0)}m)`,
        })
        setPinLat(String(latitude))
        setPinLng(String(longitude))
        trackReportEvent('map_pin_selected', { source: 'device_gps' })
      },
      (error) => {
        setGpsLoading(false)
        if (error.code === error.PERMISSION_DENIED) setGpsError('denied')
        else if (error.code === error.TIMEOUT) setGpsError('timeout')
        else setGpsError('unavailable')
        trackReportEvent('gps_denied', { reason: error.code })
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  const confirmMapPin = () => {
    setPinError(null)
    const latitude = Number(pinLat)
    const longitude = Number(pinLng)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setPinError('Enter valid coordinates for the map pin.')
      return
    }
    if (!isWithinSouthAfrica(latitude, longitude)) {
      setPinError('Pin must be within South Africa.')
      return
    }
    // Never overwrite with GPS — this is an explicit pin confirmation
    applyLocation({
      latitude,
      longitude,
      address: addressInput || value.address,
      locationSource: 'map_pin',
      summary: addressInput
        ? `${addressInput} (map pin)`
        : `Map pin ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
    })
    trackReportEvent('map_pin_selected', { source: 'map_pin' })
  }

  const confirmAddress = () => {
    const trimmed = addressInput.trim()
    if (trimmed.length < 5) {
      setPinError('Enter a more detailed address or landmark description.')
      return
    }

    // Address search without inventing coordinates:
    // require an existing valid pin OR ask user to drop a pin after address.
    if (
      value.latitude != null &&
      value.longitude != null &&
      isWithinSouthAfrica(value.latitude, value.longitude)
    ) {
      applyLocation({
        ...value,
        address: trimmed,
        locationSource: value.locationSource || 'address_search',
        summary: trimmed,
      })
      trackReportEvent('address_selected')
      return
    }

    // If user has typed pin fields that are valid SA coords, use those with address
    const latitude = Number(pinLat)
    const longitude = Number(pinLng)
    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      isWithinSouthAfrica(latitude, longitude)
    ) {
      applyLocation({
        latitude,
        longitude,
        address: trimmed,
        locationSource: 'address_search',
        summary: trimmed,
      })
      trackReportEvent('address_selected')
      return
    }

    setPinError(
      'Address saved as text only needs a map pin or GPS fix so we can route your case. Drop a pin or use your current location.'
    )
  }

  const hasValidLocation =
    value.latitude != null &&
    value.longitude != null &&
    isWithinSouthAfrica(value.latitude, value.longitude)

  return (
    <div className="space-y-6" data-testid="location-step">
      <div>
        <h3 className="text-lg font-semibold mb-2">Where is this issue?</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose one method. We only request GPS after you tap the button.
        </p>
      </div>

      <div className="grid gap-3">
        <Button
          type="button"
          variant="outline"
          className="justify-start h-auto py-3"
          onClick={useDeviceLocation}
          disabled={gpsLoading}
          data-testid="use-gps"
        >
          <Navigation className="w-4 h-4 mr-2" />
          {gpsLoading ? 'Getting location…' : 'Use my current location'}
        </Button>

        {gpsError && (
          <div
            className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3"
            role="alert"
            data-testid="gps-error"
          >
            {gpsError === 'denied' &&
              'Location permission was denied. Use address search or drop a map pin instead.'}
            {gpsError === 'timeout' &&
              'Location request timed out. Try again or drop a map pin.'}
            {gpsError === 'unavailable' &&
              'Location is unavailable or outside South Africa. Use address + map pin.'}
            {gpsError === 'insecure' &&
              'GPS requires a secure (HTTPS) connection. Use address + map pin instead.'}
            {gpsError === 'unsupported' &&
              'This browser does not support GPS. Use address + map pin.'}
          </div>
        )}
      </div>

      <div data-testid="manual-location">
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="address">
          Search or enter an address
        </label>
        <textarea
          id="address"
          data-testid="address"
          value={addressInput}
          onChange={(e) => setAddressInput(e.target.value)}
          placeholder="Street, suburb, landmark…"
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 min-h-[44px]"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={confirmAddress}
          data-testid="confirm-address"
        >
          <Search className="w-4 h-4 mr-2" />
          Use this address
        </Button>
      </div>

      <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
        <div className="flex items-center gap-2 font-medium text-gray-800">
          <MapPin className="w-4 h-4" />
          Drop or adjust map pin
        </div>
        <p className="text-sm text-gray-600">
          Adjust the pin if GPS is unavailable. Coordinates are validated to South Africa.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-600 mb-1" htmlFor="pin-lat">
              Latitude
            </label>
            <input
              id="pin-lat"
              data-testid="lat"
              inputMode="decimal"
              value={pinLat}
              onChange={(e) => setPinLat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1" htmlFor="pin-lng">
              Longitude
            </label>
            <input
              id="pin-lng"
              data-testid="lng"
              inputMode="decimal"
              value={pinLng}
              onChange={(e) => setPinLng(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg min-h-[44px]"
            />
          </div>
        </div>
        <Button type="button" onClick={confirmMapPin} data-testid="confirm-pin">
          Confirm map pin
        </Button>
      </div>

      {pinError && (
        <div className="flex gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{pinError}</span>
        </div>
      )}

      {hasValidLocation ? (
        <div
          className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900"
          data-testid="location-summary"
        >
          <div className="font-medium mb-1">Location selected</div>
          <div>{value.summary || value.address || 'Pinned location'}</div>
          {debug && (
            <div className="mt-2 font-mono text-xs text-green-800">
              {value.latitude}, {value.longitude} ({value.locationSource})
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500" data-testid="location-required-hint">
          A valid South African location is required before continuing.
        </p>
      )}
    </div>
  )
}
