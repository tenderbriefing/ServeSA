/** South Africa geographic bounds used for case location validation */
export const SA_BOUNDS = {
  minLat: -35,
  maxLat: -22,
  minLng: 16,
  maxLng: 33,
} as const

export function isWithinSouthAfrica(lat: number, lng: number): boolean {
  if (lat === 0 && lng === 0) return false
  return (
    lat >= SA_BOUNDS.minLat &&
    lat <= SA_BOUNDS.maxLat &&
    lng >= SA_BOUNDS.minLng &&
    lng <= SA_BOUNDS.maxLng
  )
}

export function assertSouthAfricaCoords(lat: number, lng: number): void {
  if (!isWithinSouthAfrica(lat, lng)) {
    throw new Error('Coordinates must be within South Africa')
  }
}
