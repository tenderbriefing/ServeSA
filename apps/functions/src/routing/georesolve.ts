/**
 * ServeSA BigQuery GIS Georesolve
 * Parameterised ST_CONTAINS + nearest-ward fallback + Firestore cache.
 * Never assigns a random/default municipality.
 */

import { BigQuery } from '@google-cloud/bigquery'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'
import type { GeoresolutionStatus } from '@servesa/case-contract'
import { isWithinSouthAfrica } from '@servesa/case-contract'
import { logCaseTelemetry } from '../telemetry/caseEvents'

const bigquery = new BigQuery()
const db = getFirestore()

const GEO_DATASET =
  process.env.GEO_WARDS_TABLE || 'servesa-aad53.geo.wards'
const BQ_TIMEOUT_MS = Number(process.env.GEORESOLVE_TIMEOUT_MS || 8000)
const NEAREST_WARD_METERS = 10000

export interface GeoresolveResult {
  wardId: string
  wardName: string
  municipalityId: string
  municipalityName: string
  province: string
  confidence: number
  cached: boolean
  status: GeoresolutionStatus
  method: string
}

export interface SafeGeoresolveResult {
  wardId: string | null
  wardName: string | null
  municipalityId: string | null
  municipalityName: string | null
  province: string | null
  confidence: number
  cached: boolean
  status: GeoresolutionStatus
  method: string
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms
    )
    promise
      .then((v) => {
        clearTimeout(timer)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(timer)
        reject(e)
      })
  })
}

/**
 * Resolves coordinates to ward/municipality.
 * Throws only for invalid coordinates; use georesolveSafe for createCase.
 */
export async function georesolve(lat: number, lng: number): Promise<GeoresolveResult> {
  if (!isWithinSouthAfrica(lat, lng)) {
    throw new Error('Coordinates outside South Africa bounds')
  }

  const cached = await checkGeoresolveCache(lat, lng)
  if (cached) {
    return { ...cached, cached: true }
  }

  // Prefer polygon containment. ST_GEOGPOINT(longitude, latitude).
  const containQuery = `
    SELECT
      w.ward_id,
      w.ward_name,
      w.municipality_id,
      w.municipality_name,
      w.province,
      ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) AS distance_meters
    FROM \`${GEO_DATASET}\` w
    WHERE ST_CONTAINS(w.geometry, ST_GEOGPOINT(@lng, @lat))
    ORDER BY distance_meters ASC
    LIMIT 1
  `

  const [rows] = await withTimeout(
    bigquery.query({
      query: containQuery,
      params: { lat, lng },
      location: process.env.BQ_LOCATION || 'africa-south1',
    }),
    BQ_TIMEOUT_MS,
    'georesolve_polygon'
  )

  if (rows.length > 0) {
    const ward = rows[0]
    const result: GeoresolveResult = {
      wardId: ward.ward_id,
      wardName: ward.ward_name,
      municipalityId: ward.municipality_id,
      municipalityName: ward.municipality_name,
      province: ward.province,
      confidence: 1,
      cached: false,
      status: 'polygon_match',
      method: 'st_contains',
    }
    await cacheGeoresolveResult(lat, lng, result)
    return result
  }

  const fallbackQuery = `
    SELECT
      w.ward_id,
      w.ward_name,
      w.municipality_id,
      w.municipality_name,
      w.province,
      ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) AS distance_meters
    FROM \`${GEO_DATASET}\` w
    WHERE ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) < @maxDistance
    ORDER BY distance_meters ASC
    LIMIT 1
  `

  const [fallbackRows] = await withTimeout(
    bigquery.query({
      query: fallbackQuery,
      params: { lat, lng, maxDistance: NEAREST_WARD_METERS },
      location: process.env.BQ_LOCATION || 'africa-south1',
    }),
    BQ_TIMEOUT_MS,
    'georesolve_nearest'
  )

  if (fallbackRows.length === 0) {
    throw new Error('No ward found within 10km of coordinates')
  }

  const ward = fallbackRows[0]
  const result: GeoresolveResult = {
    wardId: ward.ward_id,
    wardName: ward.ward_name,
    municipalityId: ward.municipality_id,
    municipalityName: ward.municipality_name,
    province: ward.province,
    confidence: calculateConfidence(Number(ward.distance_meters)),
    cached: false,
    status: 'nearest_ward',
    method: 'nearest_centroid_10km',
  }

  await cacheGeoresolveResult(lat, lng, result)
  logCaseTelemetry('georesolution_fallback_used', {
    method: result.method,
    confidence: result.confidence,
  })
  return result
}

/**
 * Never throws for infrastructure failures — returns unresolved so case can be created
 * with routing-pending instead of inventing a municipality.
 */
export async function georesolveSafe(
  lat: number,
  lng: number
): Promise<SafeGeoresolveResult> {
  try {
    const result = await georesolve(lat, lng)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    logCaseTelemetry('municipality_unresolved', {
      reason: message.slice(0, 120),
    })
    return {
      wardId: null,
      wardName: null,
      municipalityId: null,
      municipalityName: null,
      province: null,
      confidence: 0,
      cached: false,
      status: 'unresolved',
      method: 'unresolved',
    }
  }
}

async function checkGeoresolveCache(
  lat: number,
  lng: number
): Promise<GeoresolveResult | null> {
  try {
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    const cacheKey = `georesolve_${roundedLat}_${roundedLng}`
    const cacheDoc = await db.collection('georesolve_cache').doc(cacheKey).get()

    if (!cacheDoc.exists) return null
    const data = cacheDoc.data() as any
    const cachedAt =
      data.cachedAt?.toDate?.() ||
      (data.cachedAt instanceof Date ? data.cachedAt : new Date(data.cachedAt))
    const cacheAge = Date.now() - cachedAt.getTime()
    if (cacheAge > 24 * 60 * 60 * 1000) return null

    if (!data.wardId || !data.municipalityId) return null

    return {
      wardId: data.wardId,
      wardName: data.wardName,
      municipalityId: data.municipalityId,
      municipalityName: data.municipalityName,
      province: data.province,
      confidence: data.confidence ?? 1,
      cached: true,
      status: (data.status as GeoresolutionStatus) || 'polygon_match',
      method: data.method || 'cache',
    }
  } catch (error) {
    console.error('Error checking georesolve cache:', error)
    return null
  }
}

async function cacheGeoresolveResult(
  lat: number,
  lng: number,
  result: GeoresolveResult
): Promise<void> {
  try {
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    const cacheKey = `georesolve_${roundedLat}_${roundedLng}`
    await db.collection('georesolve_cache').doc(cacheKey).set(
      {
        wardId: result.wardId,
        wardName: result.wardName,
        municipalityId: result.municipalityId,
        municipalityName: result.municipalityName,
        province: result.province,
        confidence: result.confidence,
        status: result.status,
        method: result.method,
        cachedAt: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error('Error caching georesolve result:', error)
  }
}

function calculateConfidence(distanceMeters: number): number {
  if (distanceMeters <= 100) return 1.0
  if (distanceMeters <= 500) return 0.9
  if (distanceMeters <= 1000) return 0.8
  if (distanceMeters <= 2000) return 0.7
  if (distanceMeters <= 5000) return 0.6
  if (distanceMeters <= 10000) return 0.5
  return 0.3
}

export const routingLookup = async (req: any, res: any) => {
  try {
    const { lat, lng } = req.body
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates. lat and lng must be numbers.',
      })
    }
    if (!isWithinSouthAfrica(lat, lng)) {
      return res
        .status(400)
        .json({ error: 'Coordinates outside South Africa bounds.' })
    }
    const result = await georesolveSafe(lat, lng)
    res.json({ success: true, data: result })
  } catch (error) {
    console.error('Error in routingLookup:', error)
    res.status(500).json({ error: 'Georesolve failed' })
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

export async function batchGeoresolve(
  coordinates: Array<{ lat: number; lng: number }>
): Promise<SafeGeoresolveResult[]> {
  const results: SafeGeoresolveResult[] = []
  for (const coord of coordinates) {
    results.push(await georesolveSafe(coord.lat, coord.lng))
  }
  return results
}

export async function getWardStats(wardId: string): Promise<any> {
  try {
    const query = `
      SELECT
        COUNT(*) as total_cases,
        AVG(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolution_rate,
        AVG(CASE WHEN sla_breach = true THEN 1 ELSE 0 END) as sla_breach_rate
      FROM \`servesa-aad53.geo.case_analytics\`
      WHERE ward_id = @wardId
      AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
    `
    const [rows] = await bigquery.query({
      query,
      params: { wardId },
      location: process.env.BQ_LOCATION || 'africa-south1',
    })
    return rows[0] || { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }
  } catch (error) {
    console.error('Error getting ward stats:', error)
    return { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }
  }
}
