"use strict";
/**
 * National Treasury Municipal Finance — shared contract for My Municipality.
 *
 * Source: municipaldata.treasury.gov.za (Section 71 / mSCOA cubes).
 * Citizen UI must consume this normalised shape — never raw Treasury payloads.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVE_SA_TO_TREASURY_DEMARCATION = exports.MunicipalFinanceCacheRecordSchema = exports.MunicipalFinanceSnapshotSchema = exports.MunicipalityTreasuryIdentitySchema = exports.BudgetMetricSchema = exports.MajorAllocationSchema = exports.TreasuryProvenanceSchema = exports.TreasuryDataQualitySchema = exports.CAPITAL_ACQUISITION_TYPES = exports.CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE = exports.TREASURY_AMOUNT_TYPE_LABEL = exports.TREASURY_AMOUNT_TYPE_CODES = exports.TREASURY_MUNICIPAL_DATA_API_BASE = exports.TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION = void 0;
exports.mapServeSaMunicipalityCodeToTreasury = mapServeSaMunicipalityCodeToTreasury;
exports.financialYearLabelFromEnd = financialYearLabelFromEnd;
exports.currentMunicipalFinancialYearEnd = currentMunicipalFinancialYearEnd;
exports.formatCitizenBudgetPeriodLabel = formatCitizenBudgetPeriodLabel;
exports.citizenLabelForFunctionCategory = citizenLabelForFunctionCategory;
exports.allocatePercentages = allocatePercentages;
exports.buildMajorAllocations = buildMajorAllocations;
exports.emptyMunicipalFinanceSnapshot = emptyMunicipalFinanceSnapshot;
exports.fingerprintMunicipalFinanceSnapshot = fingerprintMunicipalFinanceSnapshot;
const zod_1 = require("zod");
exports.TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION = '1.0.0';
/** Official Municipal Finance API base (no credentials required). */
exports.TREASURY_MUNICIPAL_DATA_API_BASE = 'https://municipaldata.treasury.gov.za/api';
exports.TREASURY_AMOUNT_TYPE_CODES = [
    'ORGB',
    'ADJB',
    'TABB',
    'ACT',
    'AUDA',
    'PAUD',
    'RAUD',
    'IBY1',
    'IBY2',
    'ITY1',
    'ITY2',
    'SCHD',
    'TRFR',
];
exports.TREASURY_AMOUNT_TYPE_LABEL = {
    ORGB: 'Original Budget',
    ADJB: 'Adjusted Budget',
    TABB: 'Tabled Budget',
    ACT: 'Actual',
    AUDA: 'Audited Actual',
    PAUD: 'Pre-audit',
    RAUD: 'Restructured Audit',
    IBY1: 'Forecast 1 year ahead of budget year',
    IBY2: 'Forecast 2 years ahead of budget year',
    ITY1: 'ITY1',
    ITY2: 'ITY2',
    SCHD: 'Approved payment schedule',
    TRFR: 'Transferred from Provincial Departments to Municipalities',
};
/**
 * Citizen Municipal Budget Snapshot amount-type preference (ordered).
 * Prefer approved/adopted original budget; fall back to adjusted; never mix
 * budget with YTD/actual in the same snapshot metrics.
 */
exports.CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE = ['ORGB', 'ADJB'];
/** Capital acquisition types included in citizen capital budget (excludes depreciation & repairs). */
exports.CAPITAL_ACQUISITION_TYPES = [
    'NEW',
    'RENEWAL',
    'UPGRADING',
];
exports.TreasuryDataQualitySchema = zod_1.z.enum([
    'official_source',
    'official_source_under_verification',
    'partial',
    'unavailable',
    'stale_cache',
]);
exports.TreasuryProvenanceSchema = zod_1.z.object({
    sourceType: zod_1.z.literal('national_treasury'),
    dataset: zod_1.z.string().min(1).max(64),
    municipalityCode: zod_1.z.string().min(1).max(32),
    treasuryDemarcationCode: zod_1.z.string().min(1).max(32),
    financialYearEnd: zod_1.z.number().int().min(2000).max(2100),
    financialYearLabel: zod_1.z.string().min(4).max(16),
    amountType: zod_1.z.string().min(1).max(16),
    amountTypeLabel: zod_1.z.string().min(1).max(120),
    dataPeriod: zod_1.z.string().min(1).max(64),
    periodLength: zod_1.z.literal('year'),
    retrievedAt: zod_1.z.string().datetime(),
    sourceUpdatedAt: zod_1.z.string().max(64).optional().nullable(),
    sourceUrl: zod_1.z.string().url().max(2048),
    reference: zod_1.z.string().max(240).optional(),
    verificationState: exports.TreasuryDataQualitySchema,
    cubeLastUpdated: zod_1.z.string().max(64).optional().nullable(),
});
exports.MajorAllocationSchema = zod_1.z.object({
    id: zod_1.z.string().min(1).max(64),
    rawTreasuryLabel: zod_1.z.string().min(1).max(200),
    displayLabel: zod_1.z.string().min(1).max(200),
    amountZar: zod_1.z.number().finite().nonnegative(),
    percentage: zod_1.z.number().finite().nonnegative().max(100),
    denominatorZar: zod_1.z.number().finite().nonnegative(),
    financialYearLabel: zod_1.z.string().min(4).max(16),
    amountType: zod_1.z.string().min(1).max(16),
    sourceDataset: zod_1.z.string().min(1).max(64),
    sourceRetrievalDate: zod_1.z.string().datetime(),
});
exports.BudgetMetricSchema = zod_1.z.object({
    amountZar: zod_1.z.number().finite().nonnegative(),
    financialYearLabel: zod_1.z.string().min(4).max(16),
    amountType: zod_1.z.string().min(1).max(16),
    amountTypeLabel: zod_1.z.string().min(1).max(120),
    derivation: zod_1.z.string().min(1).max(240),
    dataset: zod_1.z.string().min(1).max(64),
});
exports.MunicipalityTreasuryIdentitySchema = zod_1.z.object({
    demarcationCode: zod_1.z.string().min(1).max(32),
    name: zod_1.z.string().min(1).max(200),
    longName: zod_1.z.string().max(240).optional().nullable(),
    provinceCode: zod_1.z.string().max(8).optional().nullable(),
    provinceName: zod_1.z.string().max(120).optional().nullable(),
    category: zod_1.z.string().max(8).optional().nullable(),
    miifCategory: zod_1.z.string().max(8).optional().nullable(),
});
exports.MunicipalFinanceSnapshotSchema = zod_1.z.object({
    contractVersion: zod_1.z.literal(exports.TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION),
    municipalityCode: zod_1.z.string().min(1).max(32),
    treasuryDemarcationCode: zod_1.z.string().min(1).max(32),
    identity: exports.MunicipalityTreasuryIdentitySchema.nullable(),
    financialYearEnd: zod_1.z.number().int().min(2000).max(2100).nullable(),
    financialYearLabel: zod_1.z.string().min(4).max(16).nullable(),
    amountType: zod_1.z.string().min(1).max(16).nullable(),
    amountTypeLabel: zod_1.z.string().min(1).max(120).nullable(),
    periodLength: zod_1.z.literal('year').nullable(),
    dataPeriod: zod_1.z.string().max(64).nullable(),
    /** Operating: incexp_v2 item 4400 Total Expenditure (sum across functions). */
    operatingBudget: exports.BudgetMetricSchema.nullable(),
    /**
     * Capital: capital_v2 NEW+RENEWAL+UPGRADING only
     * (excludes DEPRECIATION and REPAIR_MNT).
     */
    capitalBudget: exports.BudgetMetricSchema.nullable(),
    /**
     * Derived only when both operating and capital exist for the same FY + amount type.
     * Formula: operatingBudget + capitalBudget.
     */
    totalBudget: exports.BudgetMetricSchema.nullable(),
    majorAllocations: zod_1.z.array(exports.MajorAllocationSchema).max(12),
    sources: zod_1.z.array(exports.TreasuryProvenanceSchema).max(12),
    dataUpdatedAt: zod_1.z.string().datetime().nullable(),
    retrievedAt: zod_1.z.string().datetime(),
    cacheStatus: zod_1.z.enum(['fresh', 'stale', 'miss', 'error']),
    dataQuality: exports.TreasuryDataQualitySchema,
    completenessWarning: zod_1.z.string().max(500).optional().nullable(),
    empty: zod_1.z.boolean(),
    emptyReason: zod_1.z.string().max(240).optional().nullable(),
});
exports.MunicipalFinanceCacheRecordSchema = exports.MunicipalFinanceSnapshotSchema.extend({
    previousFingerprint: zod_1.z.string().max(128).optional().nullable(),
    fingerprint: zod_1.z.string().min(1).max(128),
    lastSuccessfulAt: zod_1.z.string().datetime(),
    lastAttemptAt: zod_1.z.string().datetime(),
    lastError: zod_1.z.string().max(500).optional().nullable(),
});
/**
 * Explicit Serve SA → Treasury demarcation aliases.
 * Prefer 1:1 MDB codes; only list stable identifier mismatches (never name matching).
 * Metsweding (MTS) is intentionally unmapped — district was disestablished; do not
 * substitute Tshwane financials.
 */
exports.SERVE_SA_TO_TREASURY_DEMARCATION = {
    WTS: 'DC48', // West Rand District
    SED: 'DC42', // Sedibeng District
    DBN: 'ETH', // eThekwini (legacy Serve SA alias)
};
function mapServeSaMunicipalityCodeToTreasury(municipalityCode) {
    const serveSaCode = (municipalityCode || '').trim().toUpperCase();
    if (!serveSaCode) {
        return {
            serveSaCode: '',
            treasuryDemarcationCode: null,
            mapping: 'unmapped',
            aliasReason: 'empty_municipality_code',
        };
    }
    if (Object.prototype.hasOwnProperty.call(exports.SERVE_SA_TO_TREASURY_DEMARCATION, serveSaCode)) {
        return {
            serveSaCode,
            treasuryDemarcationCode: exports.SERVE_SA_TO_TREASURY_DEMARCATION[serveSaCode],
            mapping: 'alias',
            aliasReason: `explicit_alias:${serveSaCode}`,
        };
    }
    // Known Serve SA codes with no safe Treasury substitute
    if (serveSaCode === 'MTS') {
        return {
            serveSaCode,
            treasuryDemarcationCode: null,
            mapping: 'unmapped',
            aliasReason: 'metsweding_disestablished_no_safe_substitute',
        };
    }
    return {
        serveSaCode,
        treasuryDemarcationCode: serveSaCode,
        mapping: 'identity',
    };
}
/** SA municipal FY ends 30 June; yearEnd 2026 ⇒ label 2025/26 */
function financialYearLabelFromEnd(yearEnd) {
    const start = yearEnd - 1;
    const endShort = String(yearEnd).slice(-2);
    return `${start}/${endShort}`;
}
/**
 * Current municipal financial year-end as of a calendar date (Africa/Johannesburg).
 * FY runs 1 July → 30 June.
 */
function currentMunicipalFinancialYearEnd(asOf = new Date()) {
    const year = asOf.getUTCFullYear();
    const month = asOf.getUTCMonth(); // 0-based
    // Before July → previous FY still current (year-end = this calendar year)
    // On/after 1 July → new FY (year-end = next calendar year)
    return month >= 6 ? year + 1 : year;
}
function formatCitizenBudgetPeriodLabel(input) {
    if (input.amountType === 'ORGB' || input.amountType === 'ADJB' || input.amountType === 'TABB') {
        return `${input.financialYearLabel} Municipal Budget (${input.amountTypeLabel})`;
    }
    if (input.amountType === 'AUDA' || input.amountType === 'ACT' || input.amountType === 'PAUD') {
        return `${input.financialYearLabel} Actual Expenditure (${input.amountTypeLabel})`;
    }
    return `${input.financialYearLabel} (${input.amountTypeLabel})`;
}
const FUNCTION_CATEGORY_DISPLAY = {
    'Trading services': 'Trading services',
    'Municipal governance and administration': 'Municipal governance & administration',
    'Community and public safety': 'Community & public safety',
    'Economic and environmental services': 'Economic & environmental services',
    Other: 'Other municipal services',
};
function citizenLabelForFunctionCategory(raw) {
    return FUNCTION_CATEGORY_DISPLAY[raw] || raw;
}
/**
 * Deterministic percentage to 1 decimal place.
 * Shares are computed from integer minor units (cents) where possible to avoid drift.
 */
function allocatePercentages(amountsZar, options) {
    const precision = options?.precision ?? 1;
    const factor = 10 ** precision;
    if (!amountsZar.length)
        return [];
    const total = amountsZar.reduce((s, n) => s + (Number.isFinite(n) ? n : 0), 0);
    if (total <= 0)
        return amountsZar.map(() => 0);
    const raw = amountsZar.map((n) => (n / total) * 100);
    const floored = raw.map((p) => Math.floor(p * factor));
    let remainder = Math.round(100 * factor - floored.reduce((s, n) => s + n, 0));
    const order = raw
        .map((p, i) => ({ i, frac: p * factor - floored[i] }))
        .sort((a, b) => b.frac - a.frac);
    const out = [...floored];
    let idx = 0;
    while (remainder > 0 && order.length) {
        out[order[idx % order.length].i] += 1;
        remainder -= 1;
        idx += 1;
    }
    return out.map((n) => n / factor);
}
function buildMajorAllocations(input) {
    const max = input.maxCategories ?? 7;
    const sorted = [...input.categories]
        .filter((c) => Number.isFinite(c.amountZar) && c.amountZar > 0)
        .sort((a, b) => b.amountZar - a.amountZar)
        .slice(0, max);
    const denominator = sorted.reduce((s, c) => s + c.amountZar, 0);
    const percentages = allocatePercentages(sorted.map((c) => c.amountZar));
    return sorted.map((c, i) => ({
        id: `alloc-${i + 1}-${slugify(c.rawLabel)}`,
        rawTreasuryLabel: c.rawLabel,
        displayLabel: citizenLabelForFunctionCategory(c.rawLabel),
        amountZar: c.amountZar,
        percentage: percentages[i] ?? 0,
        denominatorZar: denominator,
        financialYearLabel: input.financialYearLabel,
        amountType: input.amountType,
        sourceDataset: input.sourceDataset,
        sourceRetrievalDate: input.sourceRetrievalDate,
    }));
}
function slugify(value) {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40);
}
function emptyMunicipalFinanceSnapshot(municipalityCode, opts) {
    const retrievedAt = opts?.retrievedAt || new Date().toISOString();
    return {
        contractVersion: exports.TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION,
        municipalityCode: municipalityCode.trim().toUpperCase() || 'UNKNOWN',
        treasuryDemarcationCode: opts?.treasuryDemarcationCode ||
            municipalityCode.trim().toUpperCase() ||
            'UNKNOWN',
        identity: null,
        financialYearEnd: null,
        financialYearLabel: null,
        amountType: null,
        amountTypeLabel: null,
        periodLength: null,
        dataPeriod: null,
        operatingBudget: null,
        capitalBudget: null,
        totalBudget: null,
        majorAllocations: [],
        sources: [],
        dataUpdatedAt: null,
        retrievedAt,
        cacheStatus: opts?.cacheStatus || 'miss',
        dataQuality: opts?.dataQuality || 'unavailable',
        completenessWarning: null,
        empty: true,
        emptyReason: opts?.reason || 'treasury_data_unavailable',
    };
}
function fingerprintMunicipalFinanceSnapshot(snapshot) {
    const payload = JSON.stringify({
        code: snapshot.treasuryDemarcationCode,
        fy: snapshot.financialYearEnd,
        at: snapshot.amountType,
        op: snapshot.operatingBudget?.amountZar ?? null,
        cap: snapshot.capitalBudget?.amountZar ?? null,
        alloc: snapshot.majorAllocations.map((a) => [
            a.rawTreasuryLabel,
            a.amountZar,
            a.percentage,
        ]),
    });
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
        hash = (hash * 31 + payload.charCodeAt(i)) >>> 0;
    }
    return `tf_${hash.toString(16)}_${payload.length}`;
}
