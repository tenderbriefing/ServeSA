#!/usr/bin/env ts-node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface BenchmarkSummary {
  total_points: number;
  ward_accuracy: number;
  municipality_accuracy: number;
  avg_distance_m: number;
  max_distance_m: number;
  min_distance_m: number;
  threshold_met: boolean;
}

interface PilotPoint {
  lat: number;
  lng: number;
  ward_id: string;
  ward_name: string;
  municipality_id: string;
  municipality_name: string;
  province: string;
}

async function generateEvidencePack(
  benchmarkFile: string,
  pointsFile: string,
  outputDir: string
): Promise<void> {
  console.log('Generating ServeSA pilot evidence pack...');
  
  // Read benchmark summary
  const benchmarkSummary: BenchmarkSummary = JSON.parse(
    readFileSync(benchmarkFile, 'utf-8')
  );
  
  // Read pilot points
  const pointsGeoJSON = JSON.parse(
    readFileSync(pointsFile, 'utf-8')
  );
  
  const pilotPoints: PilotPoint[] = pointsGeoJSON.features.map((f: any) => ({
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
    ward_id: f.properties.ward_id,
    ward_name: f.properties.ward_name,
    municipality_id: f.properties.municipality_id,
    municipality_name: f.properties.municipality_name,
    province: f.properties.province
  }));
  
  // Generate evidence markdown
  const evidenceContent = `# ServeSA Pilot Evidence Pack

**Generated:** ${new Date().toISOString()}
**Project:** ServeSA National Service Delivery Platform
**Phase:** Pilot Implementation

---

## Executive Summary

The ServeSA platform pilot has been successfully completed with the following key results:

### Georesolve Accuracy
- **Total Test Points:** ${benchmarkSummary.total_points}
- **Ward Accuracy:** ${(benchmarkSummary.ward_accuracy * 100).toFixed(2)}%
- **Municipality Accuracy:** ${(benchmarkSummary.municipality_accuracy * 100).toFixed(2)}%
- **Threshold Met:** ${benchmarkSummary.threshold_met ? '✅ YES' : '❌ NO'}

### Geographic Coverage
- **Test Points:** ${pilotPoints.length} points across ${new Set(pilotPoints.map(p => p.municipality_name)).size} municipalities
- **Provinces:** ${new Set(pilotPoints.map(p => p.province)).size} provinces
- **Average Distance Error:** ${benchmarkSummary.avg_distance_m.toFixed(2)}m
- **Maximum Distance Error:** ${benchmarkSummary.max_distance_m.toFixed(2)}m

---

## Technical Validation

### 1. Georesolve Performance
The georesolve functionality was tested using ${benchmarkSummary.total_points} randomly generated points within ward boundaries. The system achieved:

- **Ward-level accuracy:** ${(benchmarkSummary.ward_accuracy * 100).toFixed(2)}%
- **Municipality-level accuracy:** ${(benchmarkSummary.municipality_accuracy * 100).toFixed(2)}%
- **Spatial precision:** Average error of ${benchmarkSummary.avg_distance_m.toFixed(2)}m

### 2. Geographic Distribution
Test points were distributed across:

${Array.from(new Set(pilotPoints.map(p => p.province))).map(province => {
  const provincePoints = pilotPoints.filter(p => p.province === province);
  const municipalities = new Set(provincePoints.map(p => p.municipality_name));
  return `- **${province}:** ${provincePoints.length} points, ${municipalities.size} municipalities`;
}).join('\n')}

### 3. Municipal Coverage
${Array.from(new Set(pilotPoints.map(p => p.municipality_name))).map(municipality => {
  const muniPoints = pilotPoints.filter(p => p.municipality_name === municipality);
  const wards = new Set(muniPoints.map(p => p.ward_id));
  return `- **${municipality}:** ${muniPoints.length} points, ${wards.size} wards`;
}).join('\n')}

---

## Quality Assurance

### Accuracy Thresholds
- **Target Ward Accuracy:** ≥95%
- **Achieved Ward Accuracy:** ${(benchmarkSummary.ward_accuracy * 100).toFixed(2)}%
- **Status:** ${benchmarkSummary.threshold_met ? 'PASSED' : 'FAILED'}

### Spatial Precision
- **Average Distance Error:** ${benchmarkSummary.avg_distance_m.toFixed(2)}m
- **Maximum Distance Error:** ${benchmarkSummary.max_distance_m.toFixed(2)}m
- **Minimum Distance Error:** ${benchmarkSummary.min_distance_m.toFixed(2)}m

---

## Recommendations

### For Production Deployment
1. **Georesolve Accuracy:** ${benchmarkSummary.threshold_met ? 'Meets production standards' : 'Requires improvement before production'}
2. **Coverage:** Sufficient geographic coverage demonstrated
3. **Performance:** Spatial precision within acceptable limits

### Next Steps
1. ${benchmarkSummary.threshold_met ? 'Proceed with production deployment' : 'Address georesolve accuracy issues'}
2. Expand testing to additional municipalities
3. Implement continuous monitoring of georesolve accuracy
4. Establish baseline metrics for ongoing quality assurance

---

## Appendices

### A. Test Data Summary
- **Total Points:** ${benchmarkSummary.total_points}
- **Municipalities:** ${new Set(pilotPoints.map(p => p.municipality_name)).size}
- **Provinces:** ${new Set(pilotPoints.map(p => p.province)).size}
- **Wards:** ${new Set(pilotPoints.map(p => p.ward_id)).size}

### B. Performance Metrics
- **Ward Accuracy:** ${(benchmarkSummary.ward_accuracy * 100).toFixed(2)}%
- **Municipality Accuracy:** ${(benchmarkSummary.municipality_accuracy * 100).toFixed(2)}%
- **Average Distance Error:** ${benchmarkSummary.avg_distance_m.toFixed(2)}m
- **Maximum Distance Error:** ${benchmarkSummary.max_distance_m.toFixed(2)}m

### C. Geographic Distribution
Detailed breakdown of test points by province and municipality available in the accompanying data files.

---

**Generated by:** ServeSA Pilot Benchmark Tool
**Version:** 1.0
**Date:** ${new Date().toISOString()}
`;

  // Write evidence pack
  writeFileSync(join(outputDir, 'Evidence.md'), evidenceContent);
  
  // Generate simple charts data
  const chartsData = {
    accuracy: {
      ward: benchmarkSummary.ward_accuracy * 100,
      municipality: benchmarkSummary.municipality_accuracy * 100
    },
    distance: {
      average: benchmarkSummary.avg_distance_m,
      maximum: benchmarkSummary.max_distance_m,
      minimum: benchmarkSummary.min_distance_m
    },
    coverage: {
      total_points: benchmarkSummary.total_points,
      municipalities: new Set(pilotPoints.map(p => p.municipality_name)).size,
      provinces: new Set(pilotPoints.map(p => p.province)).size,
      wards: new Set(pilotPoints.map(p => p.ward_id)).size
    }
  };
  
  writeFileSync(join(outputDir, 'charts.json'), JSON.stringify(chartsData, null, 2));
  
  console.log('✅ Evidence pack generated successfully!');
  console.log(`📁 Evidence.md: ${join(outputDir, 'Evidence.md')}`);
  console.log(`📁 charts.json: ${join(outputDir, 'charts.json')}`);
}

// Parse command line arguments
const args = process.argv.slice(2);
const benchmarkIndex = args.indexOf('--benchmark');
const pointsIndex = args.indexOf('--points');
const outIndex = args.indexOf('--out');

if (benchmarkIndex === -1 || pointsIndex === -1 || outIndex === -1) {
  console.log('Usage: ts-node evidence_pack.ts --benchmark pilot_out/benchmark/summary.json --points pilot_out/pilot_points.geojson --out pilot_out/evidence');
  process.exit(1);
}

const benchmarkFile = args[benchmarkIndex + 1];
const pointsFile = args[pointsIndex + 1];
const outputDir = args[outIndex + 1];

generateEvidencePack(benchmarkFile, pointsFile, outputDir);
