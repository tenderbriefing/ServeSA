#!/usr/bin/env ts-node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { BigQuery } from '@google-cloud/bigquery';

interface PilotPoint {
  lat: number;
  lng: number;
  ward_id: string;
  ward_name: string;
  municipality_id: string;
  municipality_name: string;
  province: string;
}

interface BenchmarkResult {
  point: PilotPoint;
  expected: {
    ward_id: string;
    ward_name: string;
    municipality_id: string;
    municipality_name: string;
  };
  actual: {
    ward_id: string;
    ward_name: string;
    municipality_id: string;
    municipality_name: string;
  };
  accuracy: {
    ward_match: boolean;
    municipality_match: boolean;
    distance_m: number;
  };
}

interface BenchmarkSummary {
  total_points: number;
  ward_accuracy: number;
  municipality_accuracy: number;
  avg_distance_m: number;
  max_distance_m: number;
  min_distance_m: number;
  threshold_met: boolean;
  results: BenchmarkResult[];
}

async function benchmarkGeoresolve(
  pointsFile: string,
  outputDir: string,
  threshold: number = 0.95
): Promise<void> {
  const bigquery = new BigQuery();
  
  console.log(`Benchmarking georesolve accuracy with threshold: ${threshold * 100}%`);
  
  // Read pilot points
  const csvContent = readFileSync(pointsFile, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  const pilotPoints: PilotPoint[] = lines
    .filter(line => line.trim())
    .map(line => {
      const [lat, lng, ward_id, ward_name, municipality_id, municipality_name, province] = line.split(',');
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        ward_id,
        ward_name,
        municipality_id,
        municipality_name,
        province
      };
    });
  
  console.log(`Testing ${pilotPoints.length} points...`);
  
  const results: BenchmarkResult[] = [];
  
  // Test each point
  for (const point of pilotPoints) {
    try {
      // Query BigQuery to get the ward for this point
      const query = `
        SELECT 
          w.ward_id,
          w.ward_name,
          w.municipality_id,
          w.municipality_name,
          ST_DISTANCE(ST_GEOGPOINT(${point.lng}, ${point.lat}), w.centroid) as distance_m
        FROM \`servesa-aad53.geo.wards\` w
        WHERE ST_CONTAINS(w.geometry, ST_GEOGPOINT(${point.lng}, ${point.lat}))
        ORDER BY distance_m ASC
        LIMIT 1
      `;
      
      const [rows] = await bigquery.query({ query });
      const actual = rows[0];
      
      if (!actual) {
        // Point not found in any ward, find nearest
        const nearestQuery = `
          SELECT 
            w.ward_id,
            w.ward_name,
            w.municipality_id,
            w.municipality_name,
            ST_DISTANCE(ST_GEOGPOINT(${point.lng}, ${point.lat}), w.centroid) as distance_m
          FROM \`servesa-aad53.geo.wards\` w
          ORDER BY distance_m ASC
          LIMIT 1
        `;
        
        const [nearestRows] = await bigquery.query({ query: nearestQuery });
        const nearest = nearestRows[0];
        
        results.push({
          point,
          expected: {
            ward_id: point.ward_id,
            ward_name: point.ward_name,
            municipality_id: point.municipality_id,
            municipality_name: point.municipality_name
          },
          actual: {
            ward_id: nearest.ward_id,
            ward_name: nearest.ward_name,
            municipality_id: nearest.municipality_id,
            municipality_name: nearest.municipality_name
          },
          accuracy: {
            ward_match: false,
            municipality_match: false,
            distance_m: nearest.distance_m
          }
        });
      } else {
        results.push({
          point,
          expected: {
            ward_id: point.ward_id,
            ward_name: point.ward_name,
            municipality_id: point.municipality_id,
            municipality_name: point.municipality_name
          },
          actual: {
            ward_id: actual.ward_id,
            ward_name: actual.ward_name,
            municipality_id: actual.municipality_id,
            municipality_name: actual.municipality_name
          },
          accuracy: {
            ward_match: actual.ward_id === point.ward_id,
            municipality_match: actual.municipality_id === point.municipality_id,
            distance_m: actual.distance_m
          }
        });
      }
    } catch (error) {
      console.error(`Error testing point ${point.lat}, ${point.lng}:`, error);
    }
  }
  
  // Calculate summary
  const totalPoints = results.length;
  const wardMatches = results.filter(r => r.accuracy.ward_match).length;
  const municipalityMatches = results.filter(r => r.accuracy.municipality_match).length;
  const distances = results.map(r => r.accuracy.distance_m);
  
  const summary: BenchmarkSummary = {
    total_points: totalPoints,
    ward_accuracy: wardMatches / totalPoints,
    municipality_accuracy: municipalityMatches / totalPoints,
    avg_distance_m: distances.reduce((sum, d) => sum + d, 0) / distances.length,
    max_distance_m: Math.max(...distances),
    min_distance_m: Math.min(...distances),
    threshold_met: (wardMatches / totalPoints) >= threshold,
    results
  };
  
  // Write results
  writeFileSync(join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  writeFileSync(join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
  
  // Generate CSV report
  const csvContent = [
    'lat,lng,expected_ward_id,expected_ward_name,actual_ward_id,actual_ward_name,ward_match,municipality_match,distance_m',
    ...results.map(r => `${r.point.lat},${r.point.lng},${r.expected.ward_id},${r.expected.ward_name},${r.actual.ward_id},${r.actual.ward_name},${r.accuracy.ward_match},${r.accuracy.municipality_match},${r.accuracy.distance_m}`)
  ].join('\n');
  
  writeFileSync(join(outputDir, 'results.csv'), csvContent);
  
  // Print summary
  console.log('\n📊 Benchmark Results:');
  console.log(`  Total Points: ${summary.total_points}`);
  console.log(`  Ward Accuracy: ${(summary.ward_accuracy * 100).toFixed(2)}%`);
  console.log(`  Municipality Accuracy: ${(summary.municipality_accuracy * 100).toFixed(2)}%`);
  console.log(`  Average Distance: ${summary.avg_distance_m.toFixed(2)}m`);
  console.log(`  Max Distance: ${summary.max_distance_m.toFixed(2)}m`);
  console.log(`  Min Distance: ${summary.min_distance_m.toFixed(2)}m`);
  console.log(`  Threshold Met: ${summary.threshold_met ? '✅' : '❌'}`);
  
  if (!summary.threshold_met) {
    console.log(`\n⚠️  Accuracy ${(summary.ward_accuracy * 100).toFixed(2)}% is below threshold ${(threshold * 100).toFixed(2)}%`);
    process.exit(1);
  }
  
  console.log('\n✅ Benchmark completed successfully!');
}

// Parse command line arguments
const args = process.argv.slice(2);
const pointsIndex = args.indexOf('--points');
const outIndex = args.indexOf('--out');
const thresholdIndex = args.indexOf('--threshold');

if (pointsIndex === -1 || outIndex === -1) {
  console.log('Usage: ts-node benchmark_georesolve.ts --points pilot_out/pilot_points.csv --out pilot_out/benchmark --threshold 0.95');
  process.exit(1);
}

const pointsFile = args[pointsIndex + 1];
const outputDir = args[outIndex + 1];
const threshold = thresholdIndex !== -1 ? parseFloat(args[thresholdIndex + 1]) : 0.95;

benchmarkGeoresolve(pointsFile, outputDir, threshold);
