/**
 * ServeSA BigQuery GIS Georesolve
 *
 * Deterministic point-in-polygon against the certified active ward dataset.
 * Boundary semantics: ST_COVERS (includes boundary). If multiple active
 * polygons cover the point, return ambiguous — never pick an arbitrary row.
 * Never assigns municipality/ward from nearest-centroid fallback.
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
const BQ_LOCATION = process.env.BQ_LOCATION || 'africa-south1'
const BQ_TIMEOUT_MS = Number(process.env.GEORESOLVE_TIMEOUT_MS || 8000)

export type GeoresolveErrorClass =
  | 'outside_bounds'
  | 'no_match'
  | 'ambiguous'
  | 'inactive_dataset'
  | 'timeout'
  | 'permission'
  | 'malformed'
  | 'infrastructure'

export interface GeoresolveResult {
  wardId: string | null
  wardName: string | null
  wardNumber: string | null
  municipalityId: string | null
  municipalityName: string | null
  districtCode: string | null
  districtName: string | null
  province: string | null
  confidence: number
  cached: boolean
  status: GeoresolutionStatus
  method: string
  datasetVersion: string | null
  boundaryCycle: string | null
  resolvedAt: string
  routingSource: 'authoritative_gis' | 'none'
  candidateCount: number
  failureReason: string | null
  errorClass: GeoresolveErrorClass | null
}

export type SafeGeoresolveResult = GeoresolveResult

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(Object.assign(new Error(`${label} timed out after ${ms}ms`), { errorClass: 'timeout' })),
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

function classifyError(error: unknown): GeoresolveErrorClass {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()
  if ((error as any)?.errorClass === 'timeout' || lower.includes('timed out')) return 'timeout'
  if (lower.includes('permission') || lower.includes('access denied') || lower.includes('403')) {
    return 'permission'
  }
  if (lower.includes('outside south africa')) return 'outside_bounds'
  if (lower.includes('malformed') || lower.includes('unexpected')) return 'malformed'
  return 'infrastructure'
}

function emptyResult(
  partial: Partial<GeoresolveResult> & Pick<GeoresolveResult, 'status' | 'method'>
): GeoresolveResult {
  return {
    wardId: null,
    wardName: null,
    wardNumber: null,
    municipalityId: null,
    municipalityName: null,
    districtCode: null,
    districtName: null,
    province: null,
    confidence: 0,
    cached: false,
    datasetVersion: null,
    boundaryCycle: null,
    resolvedAt: new Date().toISOString(),
    routingSource: 'none',
    candidateCount: 0,
    failureReason: null,
    errorClass: null,
    ...partial,
  }
}

/**
 * Resolves coordinates to ward/municipality via authoritative GIS only.
 */
export async function georesolve(lat: number, lng: number): Promise<GeoresolveResult> {
  if (!isWithinSouthAfrica(lat, lng)) {
    return emptyResult({
      status: 'unresolved',
      method: 'bounds_check',
      failureReason: 'coordinates_outside_south_africa',
      errorClass: 'outside_bounds',
    })
  }

  const cached = await checkGeoresolveCache(lat, lng)
  if (cached) {
    return { ...cached, cached: true }
  }

  // ST_COVERS: boundary points are covered by the polygon.
  // If adjacent wards both cover a shared boundary point, candidate_count > 1 → ambiguous.
  const containQuery = `
    SELECT
      w.ward_id,
      w.ward_name,
      w.ward_number,
      w.ward_label,
      w.municipality_id,
      w.municipality_name,
      w.district_code,
      w.district_name,
      w.province,
      w.dataset_version,
      w.boundary_cycle,
      COUNT(*) OVER() AS candidate_count
    FROM \`${GEO_DATASET}\` w
    WHERE IFNULL(w.active, TRUE) = TRUE
      AND w.geometry IS NOT NULL
      AND ST_COVERS(w.geometry, ST_GEOGPOINT(@lng, @lat))
    ORDER BY w.ward_id
    LIMIT 5
  `

  let rows: any[]
  try {
    const [result] = await withTimeout(
      bigquery.query({
        query: containQuery,
        params: { lat, lng },
        location: BQ_LOCATION,
        maximumBytesBilled: process.env.GEORESOLVE_MAX_BYTES || '1000000000',
      }),
      BQ_TIMEOUT_MS,
      'georesolve_polygon'
    )
    rows = result
  } catch (error) {
    const errorClass = classifyError(error)
    throw Object.assign(
      error instanceof Error ? error : new Error(String(error)),
      { errorClass }
    )
  }

  if (!Array.isArray(rows)) {
    throw Object.assign(new Error('malformed BigQuery result'), { errorClass: 'malformed' })
  }

  if (rows.length === 0) {
    const result = emptyResult({
      status: 'unresolved',
      method: 'st_covers',
      failureReason: 'no_polygon_contains_point',
      errorClass: 'no_match',
      candidateCount: 0,
    })
    await cacheGeoresolveResult(lat, lng, result)
    return result
  }

  const candidateCount = Number(rows[0].candidate_count || rows.length)
  if (candidateCount > 1 || rows.length > 1) {
    const result = emptyResult({
      status: 'ambiguous',
      method: 'st_covers',
      failureReason: 'multiple_polygons_cover_point',
      errorClass: 'ambiguous',
      candidateCount,
      datasetVersion: rows[0].dataset_version || null,
      boundaryCycle: rows[0].boundary_cycle || null,
    })
    logCaseTelemetry('georesolution_ambiguous', {
      candidateCount,
      datasetVersion: result.datasetVersion,
    })
    await cacheGeoresolveResult(lat, lng, result)
    return result
  }

  const ward = rows[0]
  if (!ward.ward_id || !ward.municipality_id || !ward.province) {
    throw Object.assign(new Error('malformed ward row missing identifiers'), {
      errorClass: 'malformed',
    })
  }

  const result: GeoresolveResult = {
    wardId: String(ward.ward_id),
    wardName: ward.ward_name || ward.ward_label || `Ward ${ward.ward_number || ward.ward_id}`,
    wardNumber: ward.ward_number != null ? String(ward.ward_number) : null,
    municipalityId: String(ward.municipality_id),
    municipalityName: String(ward.municipality_name || ward.municipality_id),
    districtCode: ward.district_code ? String(ward.district_code) : null,
    districtName: ward.district_name ? String(ward.district_name) : null,
    province: String(ward.province),
    confidence: 1,
    cached: false,
    status: 'polygon_match',
    method: 'st_covers',
    datasetVersion: ward.dataset_version ? String(ward.dataset_version) : null,
    boundaryCycle: ward.boundary_cycle ? String(ward.boundary_cycle) : null,
    resolvedAt: new Date().toISOString(),
    routingSource: 'authoritative_gis',
    candidateCount: 1,
    failureReason: null,
    errorClass: null,
  }
  await cacheGeoresolveResult(lat, lng, result)
  return result
}

/**
 * Never throws for infrastructure failures — returns unresolved so case can be created.
 */
export async function georesolveSafe(
  lat: number,
  lng: number
): Promise<SafeGeoresolveResult> {
  try {
    return await georesolve(lat, lng)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown'
    const errorClass = classifyError(error)
    logCaseTelemetry('municipality_unresolved', {
      reason: message.slice(0, 120),
      errorClass,
    })
    return emptyResult({
      status: 'unresolved',
      method: 'unresolved',
      failureReason: errorClass,
      errorClass,
    })
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

    // Never restore authoritative assignment from cache unless polygon_match
    const status = (data.status as GeoresolutionStatus) || 'unresolved'
    return {
      wardId: data.wardId ?? null,
      wardName: data.wardName ?? null,
      wardNumber: data.wardNumber ?? null,
      municipalityId: data.municipalityId ?? null,
      municipalityName: data.municipalityName ?? null,
      districtCode: data.districtCode ?? null,
      districtName: data.districtName ?? null,
      province: data.province ?? null,
      confidence: data.confidence ?? 0,
      cached: true,
      status,
      method: data.method || 'cache',
      datasetVersion: data.datasetVersion ?? null,
      boundaryCycle: data.boundaryCycle ?? null,
      resolvedAt: data.resolvedAt || new Date().toISOString(),
      routingSource: status === 'polygon_match' ? 'authoritative_gis' : 'none',
      candidateCount: data.candidateCount ?? 0,
      failureReason: data.failureReason ?? null,
      errorClass: data.errorClass ?? null,
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
        wardNumber: result.wardNumber,
        municipalityId: result.municipalityId,
        municipalityName: result.municipalityName,
        districtCode: result.districtCode,
        districtName: result.districtName,
        province: result.province,
        confidence: result.confidence,
        status: result.status,
        method: result.method,
        datasetVersion: result.datasetVersion,
        boundaryCycle: result.boundaryCycle,
        resolvedAt: result.resolvedAt,
        routingSource: result.routingSource,
        candidateCount: result.candidateCount,
        failureReason: result.failureReason,
        errorClass: result.errorClass,
        cachedAt: Timestamp.now(),
      },
      { merge: true }
    )
  } catch (error) {
    console.error('Error caching georesolve result:', error)
  }
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
      location: BQ_LOCATION,
    })
    return rows[0] || { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }
  } catch (error) {
    console.error('Error getting ward stats:', error)
    return { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }
  }
}
