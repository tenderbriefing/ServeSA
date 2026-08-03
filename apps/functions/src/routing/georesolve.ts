/**
 * ServeSA Phase-1: BigQuery GIS Georesolve Function
 * This function resolves coordinates to ward and municipality using BigQuery GIS
 */

import { BigQuery } from '@google-cloud/bigquery'
import { getFirestore } from 'firebase-admin/firestore'

const bigquery = new BigQuery()
const db = getFirestore()

interface GeoresolveResult {
  wardId: string
  wardName: string
  municipalityId: string
  municipalityName: string
  province: string
  confidence: number
  cached: boolean
}

interface CachedGeoresolve {
  wardId: string
  wardName: string
  municipalityId: string
  municipalityName: string
  province: string
  confidence: number
  cachedAt: Date
}

/**
 * Resolves coordinates to ward and municipality using BigQuery GIS
 * @param lat Latitude
 * @param lng Longitude
 * @returns GeoresolveResult with ward and municipality information
 */
export async function georesolve(lat: number, lng: number): Promise<GeoresolveResult> {
  try {
    // Check cache first
    const cached = await checkGeoresolveCache(lat, lng)
    if (cached) {
      return {
        ...cached,
        cached: true
      }
    }

    // Query BigQuery for ward resolution
    const query = `
      SELECT 
        w.ward_id,
        w.ward_name,
        w.municipality_id,
        w.municipality_name,
        w.province,
        ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) as distance_meters
      FROM \`servesa-aad53.geo.wards\` w
      WHERE ST_CONTAINS(w.geometry, ST_GEOGPOINT(@lng, @lat))
      ORDER BY distance_meters ASC
      LIMIT 1
    `

    const options = {
      query,
      params: { lat, lng },
      location: 'africa-south1'
    }

    const [rows] = await bigquery.query(options)

    if (rows.length === 0) {
      // Fallback: find nearest ward within reasonable distance
      const fallbackQuery = `
        SELECT 
          w.ward_id,
          w.ward_name,
          w.municipality_id,
          w.municipality_name,
          w.province,
          ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) as distance_meters
        FROM \`servesa-aad53.geo.wards\` w
        WHERE ST_DISTANCE(ST_GEOGPOINT(@lng, @lat), w.centroid) < 10000
        ORDER BY distance_meters ASC
        LIMIT 1
      `

      const fallbackOptions = {
        query: fallbackQuery,
        params: { lat, lng },
        location: 'africa-south1'
      }

      const [fallbackRows] = await bigquery.query(fallbackOptions)

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
        confidence: calculateConfidence(ward.distance_meters),
        cached: false
      }

      // Cache the result
      await cacheGeoresolveResult(lat, lng, result)
      return result
    }

    const ward = rows[0]
    const result: GeoresolveResult = {
      wardId: ward.ward_id,
      wardName: ward.ward_name,
      municipalityId: ward.municipality_id,
      municipalityName: ward.municipality_name,
      province: ward.province,
      confidence: 1.0, // Exact match
      cached: false
    }

    // Cache the result
    await cacheGeoresolveResult(lat, lng, result)
    return result

  } catch (error) {
    console.error('Error in georesolve:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Georesolve failed: ${errorMessage}`)
  }
}

/**
 * Check if georesolve result is cached
 */
async function checkGeoresolveCache(lat: number, lng: number): Promise<CachedGeoresolve | null> {
  try {
    // Round coordinates to reduce cache fragmentation
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    
    const cacheKey = `georesolve_${roundedLat}_${roundedLng}`
    const cacheDoc = await db.collection('georesolve_cache').doc(cacheKey).get()
    
    if (cacheDoc.exists) {
      const data = cacheDoc.data() as CachedGeoresolve
      const cacheAge = Date.now() - data.cachedAt.getTime()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours
      
      if (cacheAge < maxAge) {
        return data
      }
    }
    
    return null
  } catch (error) {
    console.error('Error checking georesolve cache:', error)
    return null
  }
}

/**
 * Cache georesolve result
 */
async function cacheGeoresolveResult(lat: number, lng: number, result: GeoresolveResult): Promise<void> {
  try {
    const roundedLat = Math.round(lat * 1000) / 1000
    const roundedLng = Math.round(lng * 1000) / 1000
    
    const cacheKey = `georesolve_${roundedLat}_${roundedLng}`
    const cacheData: CachedGeoresolve = {
      wardId: result.wardId,
      wardName: result.wardName,
      municipalityId: result.municipalityId,
      municipalityName: result.municipalityName,
      province: result.province,
      confidence: result.confidence,
      cachedAt: new Date()
    }
    
    await db.collection('georesolve_cache').doc(cacheKey).set(cacheData, { merge: true })
  } catch (error) {
    console.error('Error caching georesolve result:', error)
    // Don't throw - caching failure shouldn't break the main function
  }
}

/**
 * Calculate confidence based on distance
 */
function calculateConfidence(distanceMeters: number): number {
  if (distanceMeters <= 100) return 1.0
  if (distanceMeters <= 500) return 0.9
  if (distanceMeters <= 1000) return 0.8
  if (distanceMeters <= 2000) return 0.7
  if (distanceMeters <= 5000) return 0.6
  if (distanceMeters <= 10000) return 0.5
  return 0.3
}

/**
 * HTTP callable function for georesolve
 */
export const routingLookup = async (req: any, res: any) => {
  try {
    const { lat, lng } = req.body

    // Validate input
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({
        error: 'Invalid coordinates. lat and lng must be numbers.'
      })
    }

    if (lat < -35 || lat > -22 || lng < 16 || lng > 33) {
      return res.status(400).json({
        error: 'Coordinates outside South Africa bounds.'
      })
    }

    // Perform georesolve
    const result = await georesolve(lat, lng)

    // Return result
    res.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Error in routingLookup:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({
      error: 'Georesolve failed',
      message: errorMessage
    })
  }
}

/**
 * Reverse geocoding using Google Maps API (fallback)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // This would use Google Maps Geocoding API
    // For Phase-1, return a formatted address based on coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch (error) {
    console.error('Error in reverseGeocode:', error)
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  }
}

/**
 * Batch georesolve for multiple coordinates
 */
export async function batchGeoresolve(coordinates: Array<{ lat: number; lng: number }>): Promise<GeoresolveResult[]> {
  const results: GeoresolveResult[] = []
  
  for (const coord of coordinates) {
    try {
      const result = await georesolve(coord.lat, coord.lng)
      results.push(result)
    } catch (error) {
      console.error(`Error georesolving ${coord.lat}, ${coord.lng}:`, error)
      results.push({
        wardId: '',
        wardName: 'Unknown',
        municipalityId: '',
        municipalityName: 'Unknown',
        province: 'Unknown',
        confidence: 0,
        cached: false
      })
    }
  }
  
  return results
}

/**
 * Get ward statistics
 */
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

    const options = {
      query,
      params: { wardId },
      location: 'africa-south1'
    }

    const [rows] = await bigquery.query(options)
    return rows[0] || { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }

  } catch (error) {
    console.error('Error getting ward stats:', error)
    return { total_cases: 0, resolution_rate: 0, sla_breach_rate: 0 }
  }
}
