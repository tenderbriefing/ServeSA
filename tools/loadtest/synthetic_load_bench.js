#!/usr/bin/env ts-node
"use strict";
/**
 * Synthetic LOCAL load bench — 1000 active + 10k historical case-shaped objects.
 * Measures filter/sort latency mirroring listSmartWorkQueue / map listing pure logic.
 * Does NOT hammer production Firebase with writes.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const OUT_PATH = path.resolve(process.cwd().endsWith('loadtest')
    ? path.join(process.cwd(), '../../docs/reports/evidence/loadtest_baseline.json')
    : path.join(process.cwd(), 'docs/reports/evidence/loadtest_baseline.json'));
const UID = 'synth-official-001';
const MUNI = 'JHB';
const CATEGORIES = ['roads', 'water', 'electricity', 'waste', 'internet'];
const STATUSES_ACTIVE = [
    'submitted',
    'acknowledged',
    'assigned',
    'in_progress',
    'resolved',
];
const STATUSES_HIST = ['closed', 'rejected', 'resolved', 'citizen_confirmed'];
function bucketPriority(bucket) {
    const order = [
        'duplicate_review',
        'needs_ack',
        'triage',
        'reopened',
        'high_priority',
        'assigned_to_me',
        'in_progress',
        'ready_resolve',
        'ready_closure',
    ];
    return order.indexOf(bucket);
}
/** Mirrors apps/functions/src/cases/opsQueues.ts classifyCase */
function classifyCase(c, uid) {
    if (c.duplicateReview?.status === 'pending')
        return 'duplicate_review';
    if (c.triageQueue === true || c.routingPending === true)
        return 'triage';
    if (c.reopenedAt && ['acknowledged', 'assigned'].includes(c.status))
        return 'reopened';
    if (c.status === 'submitted')
        return 'needs_ack';
    if (c.assignedTo === uid && ['assigned', 'in_progress'].includes(c.status)) {
        return 'assigned_to_me';
    }
    if (['emergency', 'high'].includes(c.priority) &&
        !['resolved', 'closed', 'rejected'].includes(c.status)) {
        return 'high_priority';
    }
    if (c.status === 'in_progress')
        return 'in_progress';
    if (c.status === 'resolved')
        return 'ready_closure';
    if (c.status === 'assigned')
        return 'ready_resolve';
    return null;
}
function geohashPrefix(lat, lng, precision = 5) {
    // Lightweight synthetic geohash-like key for map bucketing (not GIS authority)
    const latBucket = Math.floor((lat + 90) * 100);
    const lngBucket = Math.floor((lng + 180) * 100);
    return `${latBucket.toString(36)}${lngBucket.toString(36)}`.slice(0, precision);
}
function buildCorpus() {
    const cases = [];
    const now = Date.now();
    for (let i = 0; i < 1000; i++) {
        const status = STATUSES_ACTIVE[i % STATUSES_ACTIVE.length];
        cases.push({
            caseId: `CASE-ACTIVE-${String(i).padStart(5, '0')}`,
            reference: `CASE-ACTIVE-${String(i).padStart(5, '0')}`,
            title: `Active synthetic ${i}`,
            category: CATEGORIES[i % CATEGORIES.length],
            status,
            priority: i % 17 === 0 ? 'high' : i % 41 === 0 ? 'emergency' : 'medium',
            muniCode: i % 11 === 0 ? 'CPT' : MUNI,
            wardId: `W${(i % 50) + 1}`,
            assignedDepartment: i % 3 === 0 ? 'Roads' : 'Water',
            assignedTo: i % 5 === 0 ? UID : i % 7 === 0 ? 'other-uid' : null,
            triageQueue: i % 29 === 0,
            reopenedAt: i % 37 === 0 ? new Date(now - 86400000).toISOString() : null,
            duplicateReview: i % 23 === 0 ? { status: 'pending', confidence: 'medium' } : null,
            mediaUrls: i % 2 === 0 ? [`media/${i}.jpg`] : [],
            location: {
                lat: -26.2 + (i % 100) * 0.001,
                lng: 28.0 + (i % 100) * 0.001,
            },
            createdAtMs: now - i * 60000,
        });
    }
    for (let i = 0; i < 10000; i++) {
        const status = STATUSES_HIST[i % STATUSES_HIST.length];
        cases.push({
            caseId: `CASE-HIST-${String(i).padStart(5, '0')}`,
            reference: `CASE-HIST-${String(i).padStart(5, '0')}`,
            title: `Historical synthetic ${i}`,
            category: CATEGORIES[i % CATEGORIES.length],
            status,
            priority: 'low',
            muniCode: i % 9 === 0 ? 'TSH' : MUNI,
            wardId: `W${(i % 80) + 1}`,
            assignedDepartment: 'Waste',
            assignedTo: null,
            location: {
                lat: -26.3 + (i % 200) * 0.0005,
                lng: 28.1 + (i % 200) * 0.0005,
            },
            createdAtMs: now - (1000 + i) * 3600000,
        });
    }
    return cases;
}
function percentile(sorted, p) {
    if (!sorted.length)
        return 0;
    const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
    return sorted[Math.max(0, idx)];
}
function bench(name, fn, iterations = 40) {
    const samples = [];
    // warmup
    for (let i = 0; i < 5; i++)
        fn();
    for (let i = 0; i < iterations; i++) {
        const t0 = process.hrtime.bigint();
        fn();
        const t1 = process.hrtime.bigint();
        samples.push(Number(t1 - t0) / 1e6);
    }
    samples.sort((a, b) => a - b);
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    return { p50: percentile(samples, 50), p95: percentile(samples, 95), mean };
}
function filterSmartQueue(cases, muni, limit = 40) {
    // Mirror: muni filter + drop closed/rejected + classify + sort + slice
    // Ops fetches ~120 newest; we scan full corpus to stress filter cost
    const items = [];
    for (const c of cases) {
        if (c.muniCode !== muni)
            continue;
        if (['closed', 'rejected'].includes(c.status))
            continue;
        const bucket = classifyCase(c, UID);
        if (!bucket)
            continue;
        items.push({ caseId: c.caseId, bucket, bucketRank: bucketPriority(bucket) });
    }
    items.sort((a, b) => a.bucketRank - b.bucketRank || b.caseId.localeCompare(a.caseId));
    return items.slice(0, limit);
}
function filterMapFeatures(cases, muni, opts) {
    const limit = opts.limit || 100;
    const features = [];
    for (const c of cases) {
        if (c.muniCode !== muni)
            continue;
        if (opts.status && c.status !== opts.status)
            continue;
        if (opts.category && c.category !== opts.category)
            continue;
        if (opts.ward && c.wardId !== opts.ward)
            continue;
        const lat = c.location?.lat;
        const lng = c.location?.lng;
        if (typeof lat !== 'number' || typeof lng !== 'number')
            continue;
        features.push({
            id: c.caseId,
            lat,
            lng,
            geohash: geohashPrefix(lat, lng),
            status: c.status,
            category: c.category,
        });
        if (features.length >= limit)
            break;
    }
    return features;
}
function paginateList(cases, muni, pageSize, cursorMs) {
    const scoped = cases
        .filter((c) => c.muniCode === muni)
        .sort((a, b) => b.createdAtMs - a.createdAtMs);
    const start = cursorMs == null ? 0 : scoped.findIndex((c) => c.createdAtMs < cursorMs);
    const from = start < 0 ? scoped.length : start;
    return scoped.slice(from, from + pageSize);
}
function main() {
    const corpus = buildCorpus();
    const active = corpus.filter((c) => c.caseId.startsWith('CASE-ACTIVE')).length;
    const hist = corpus.length - active;
    const queueBench = bench('smart_queue_filter_sort', () => {
        filterSmartQueue(corpus, MUNI, 40);
    });
    const mapBench = bench('map_filter', () => {
        filterMapFeatures(corpus, MUNI, { category: 'water', limit: 100 });
    });
    const pageBench = bench('list_pagination', () => {
        const page1 = paginateList(corpus, MUNI, 50, null);
        paginateList(corpus, MUNI, 50, page1[page1.length - 1]?.createdAtMs ?? null);
    });
    const geohashBench = bench('geohash_bucket', () => {
        const buckets = new Map();
        for (const c of corpus) {
            if (c.muniCode !== MUNI || !c.location)
                continue;
            const g = geohashPrefix(c.location.lat, c.location.lng);
            buckets.set(g, (buckets.get(g) || 0) + 1);
        }
    });
    const report = {
        generatedAt: new Date().toISOString(),
        disclaimer: 'LOCAL in-memory synthetic benchmark only. Does not write to or read from production Firebase. Not a production SLA claim.',
        corpus: {
            activeCases: active,
            historicalCases: hist,
            total: corpus.length,
            municipalityFilter: MUNI,
        },
        algorithms: {
            smartQueue: 'mirrors opsQueues.classifyCase + bucketPriority + sort/slice',
            mapFilter: 'mirrors listMapCasesOps client-side category/ward/status filters',
            pagination: 'createdAt desc page slices',
            geohash: 'synthetic lat/lng bucket keys (not authoritative GIS)',
        },
        latencyMs: {
            smart_queue_filter_sort: queueBench,
            map_filter: mapBench,
            list_pagination: pageBench,
            geohash_bucket: geohashBench,
        },
        p50: {
            smart_queue_filter_sort: queueBench.p50,
            map_filter: mapBench.p50,
            list_pagination: pageBench.p50,
            geohash_bucket: geohashBench.p50,
        },
        p95: {
            smart_queue_filter_sort: queueBench.p95,
            map_filter: mapBench.p95,
            list_pagination: pageBench.p95,
            geohash_bucket: geohashBench.p95,
        },
    };
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
    fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2));
    console.log(`Wrote ${OUT_PATH}`);
    console.log(`queue p50=${queueBench.p50.toFixed(2)}ms p95=${queueBench.p95.toFixed(2)}ms | map p50=${mapBench.p50.toFixed(2)}ms p95=${mapBench.p95.toFixed(2)}ms`);
}
main();
