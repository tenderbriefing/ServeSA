#!/usr/bin/env ts-node

import { BigQuery } from '@google-cloud/bigquery';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface PilotPoint {
  lat: number;
  lng: number;
  ward_id: string;
  ward_name: string;
  municipality_id: string;
  municipality_name: string;
  province: string;
}

interface PilotPointGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    geometry: {
      type: 'Point';
      coordinates: [number, number];
    };
    properties: {
      ward_id: string;
      ward_name: string;
      municipality_id: string;
      municipality_name: string;
      province: string;
    };
  }>;
}

async function generatePilotPoints(
  municipalities: string[],
  pointsPerWard: number,
  outputDir: string
): Promise<void> {
  const bigquery = new BigQuery();
  
  console.log(`Generating ${pointsPerWard} points per ward for municipalities: ${municipalities.join(', ')}`);
  
  // Query to get ward centroids and generate random points within each ward
  const query = `
    WITH ward_centroids AS (
      SELECT 
        ward_id,
        ward_name,
        municipality_id,
        municipality_name,
        province,
        ST_CENTROID(geometry) as centroid,
        ST_AREA(geometry) as area
      FROM \`servesa-aad53.geo.wards\`
      WHERE municipality_id IN (${municipalities.map(m => `'${m}'`).join(', ')})
    ),
    random_points AS (
      SELECT 
        ward_id,
        ward_name,
        municipality_id,
        municipality_name,
        province,
        ST_X(ST_POINTN(ST_GENERATE_POINTS(geometry, ${pointsPerWard}), 1)) as lng,
        ST_Y(ST_POINTN(ST_GENERATE_POINTS(geometry, ${pointsPerWard}), 1)) as lat
      FROM \`servesa-aad53.geo.wards\`
      WHERE municipality_id IN (${municipalities.map(m => `'${m}'`).join(', ')})
    )
    SELECT * FROM random_points
    ORDER BY municipality_id, ward_id
  `;
  
  try {
    const [rows] = await bigquery.query({ query });
    
    const pilotPoints: PilotPoint[] = rows.map((row: any) => ({
      lat: row.lat,
      lng: row.lng,
      ward_id: row.ward_id,
      ward_name: row.ward_name,
      municipality_id: row.municipality_id,
      municipality_name: row.municipality_name,
      province: row.province
    }));
    
    // Generate CSV
    const csvContent = [
      'lat,lng,ward_id,ward_name,municipality_id,municipality_name,province',
      ...pilotPoints.map(p => `${p.lat},${p.lng},${p.ward_id},${p.ward_name},${p.municipality_id},${p.municipality_name},${p.province}`)
    ].join('\n');
    
    // Generate GeoJSON
    const geoJson: PilotPointGeoJSON = {
      type: 'FeatureCollection',
      features: pilotPoints.map(p => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [p.lng, p.lat]
        },
        properties: {
          ward_id: p.ward_id,
          ward_name: p.ward_name,
          municipality_id: p.municipality_id,
          municipality_name: p.municipality_name,
          province: p.province
        }
      }))
    };
    
    // Write files
    writeFileSync(join(outputDir, 'pilot_points.csv'), csvContent);
    writeFileSync(join(outputDir, 'pilot_points.geojson'), JSON.stringify(geoJson, null, 2));
    
    console.log(`✅ Generated ${pilotPoints.length} pilot points`);
    console.log(`📁 CSV: ${join(outputDir, 'pilot_points.csv')}`);
    console.log(`📁 GeoJSON: ${join(outputDir, 'pilot_points.geojson')}`);
    
    // Print summary
    const summary = pilotPoints.reduce((acc, p) => {
      if (!acc[p.municipality_name]) {
        acc[p.municipality_name] = { wards: new Set(), points: 0 };
      }
      acc[p.municipality_name].wards.add(p.ward_id);
      acc[p.municipality_name].points++;
      return acc;
    }, {} as Record<string, { wards: Set<string>; points: number }>);
    
    console.log('\n📊 Summary:');
    Object.entries(summary).forEach(([municipality, data]) => {
      console.log(`  ${municipality}: ${data.wards.size} wards, ${data.points} points`);
    });
    
  } catch (error) {
    console.error('❌ Error generating pilot points:', error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const muniIndex = args.indexOf('--muni');
const perWardIndex = args.indexOf('--perWard');
const outIndex = args.indexOf('--out');

if (muniIndex === -1 || perWardIndex === -1 || outIndex === -1) {
  console.log('Usage: ts-node generate_pilot_points.ts --muni JHB,CPT,TSH --perWard 20 --out pilot_out/pilot_points');
  process.exit(1);
}

const municipalities = args[muniIndex + 1].split(',');
const pointsPerWard = parseInt(args[perWardIndex + 1]);
const outputDir = args[outIndex + 1];

generatePilotPoints(municipalities, pointsPerWard, outputDir);
