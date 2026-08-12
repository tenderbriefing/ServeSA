/**
 * National Treasury Municipal Finance — shared contract for My Municipality.
 *
 * Source: municipaldata.treasury.gov.za (Section 71 / mSCOA cubes).
 * Citizen UI must consume this normalised shape — never raw Treasury payloads.
 */
import { z } from 'zod';
export declare const TREASURY_MUNICIPAL_FINANCE_CONTRACT_VERSION = "1.0.0";
/** Official Municipal Finance API base (no credentials required). */
export declare const TREASURY_MUNICIPAL_DATA_API_BASE = "https://municipaldata.treasury.gov.za/api";
export declare const TREASURY_AMOUNT_TYPE_CODES: readonly ["ORGB", "ADJB", "TABB", "ACT", "AUDA", "PAUD", "RAUD", "IBY1", "IBY2", "ITY1", "ITY2", "SCHD", "TRFR"];
export type TreasuryAmountTypeCode = (typeof TREASURY_AMOUNT_TYPE_CODES)[number];
export declare const TREASURY_AMOUNT_TYPE_LABEL: Record<TreasuryAmountTypeCode, string>;
/**
 * Citizen Municipal Budget Snapshot amount-type preference (ordered).
 * Prefer approved/adopted original budget; fall back to adjusted; never mix
 * budget with YTD/actual in the same snapshot metrics.
 */
export declare const CITIZEN_BUDGET_AMOUNT_TYPE_PREFERENCE: readonly TreasuryAmountTypeCode[];
/** Capital acquisition types included in citizen capital budget (excludes depreciation & repairs). */
export declare const CAPITAL_ACQUISITION_TYPES: readonly ["NEW", "RENEWAL", "UPGRADING"];
export declare const TreasuryDataQualitySchema: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
export type TreasuryDataQuality = z.infer<typeof TreasuryDataQualitySchema>;
export declare const TreasuryProvenanceSchema: z.ZodObject<{
    sourceType: z.ZodLiteral<"national_treasury">;
    dataset: z.ZodString;
    municipalityCode: z.ZodString;
    treasuryDemarcationCode: z.ZodString;
    financialYearEnd: z.ZodNumber;
    financialYearLabel: z.ZodString;
    amountType: z.ZodString;
    amountTypeLabel: z.ZodString;
    dataPeriod: z.ZodString;
    periodLength: z.ZodLiteral<"year">;
    retrievedAt: z.ZodString;
    sourceUpdatedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceUrl: z.ZodString;
    reference: z.ZodOptional<z.ZodString>;
    verificationState: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
    cubeLastUpdated: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    sourceType: "national_treasury";
    dataset: string;
    treasuryDemarcationCode: string;
    financialYearEnd: number;
    financialYearLabel: string;
    amountType: string;
    amountTypeLabel: string;
    dataPeriod: string;
    periodLength: "year";
    retrievedAt: string;
    sourceUrl: string;
    verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    reference?: string | undefined;
    sourceUpdatedAt?: string | null | undefined;
    cubeLastUpdated?: string | null | undefined;
}, {
    municipalityCode: string;
    sourceType: "national_treasury";
    dataset: string;
    treasuryDemarcationCode: string;
    financialYearEnd: number;
    financialYearLabel: string;
    amountType: string;
    amountTypeLabel: string;
    dataPeriod: string;
    periodLength: "year";
    retrievedAt: string;
    sourceUrl: string;
    verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    reference?: string | undefined;
    sourceUpdatedAt?: string | null | undefined;
    cubeLastUpdated?: string | null | undefined;
}>;
export type TreasuryProvenance = z.infer<typeof TreasuryProvenanceSchema>;
export declare const MajorAllocationSchema: z.ZodObject<{
    id: z.ZodString;
    rawTreasuryLabel: z.ZodString;
    displayLabel: z.ZodString;
    amountZar: z.ZodNumber;
    percentage: z.ZodNumber;
    denominatorZar: z.ZodNumber;
    financialYearLabel: z.ZodString;
    amountType: z.ZodString;
    sourceDataset: z.ZodString;
    sourceRetrievalDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    amountZar: number;
    financialYearLabel: string;
    amountType: string;
    rawTreasuryLabel: string;
    displayLabel: string;
    percentage: number;
    denominatorZar: number;
    sourceDataset: string;
    sourceRetrievalDate: string;
}, {
    id: string;
    amountZar: number;
    financialYearLabel: string;
    amountType: string;
    rawTreasuryLabel: string;
    displayLabel: string;
    percentage: number;
    denominatorZar: number;
    sourceDataset: string;
    sourceRetrievalDate: string;
}>;
export type MajorAllocation = z.infer<typeof MajorAllocationSchema>;
export declare const BudgetMetricSchema: z.ZodObject<{
    amountZar: z.ZodNumber;
    financialYearLabel: z.ZodString;
    amountType: z.ZodString;
    amountTypeLabel: z.ZodString;
    derivation: z.ZodString;
    dataset: z.ZodString;
}, "strip", z.ZodTypeAny, {
    amountZar: number;
    dataset: string;
    financialYearLabel: string;
    amountType: string;
    amountTypeLabel: string;
    derivation: string;
}, {
    amountZar: number;
    dataset: string;
    financialYearLabel: string;
    amountType: string;
    amountTypeLabel: string;
    derivation: string;
}>;
export type BudgetMetric = z.infer<typeof BudgetMetricSchema>;
export declare const MunicipalityTreasuryIdentitySchema: z.ZodObject<{
    demarcationCode: z.ZodString;
    name: z.ZodString;
    longName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    provinceCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    provinceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    miifCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    demarcationCode: string;
    category?: string | null | undefined;
    longName?: string | null | undefined;
    provinceCode?: string | null | undefined;
    provinceName?: string | null | undefined;
    miifCategory?: string | null | undefined;
}, {
    name: string;
    demarcationCode: string;
    category?: string | null | undefined;
    longName?: string | null | undefined;
    provinceCode?: string | null | undefined;
    provinceName?: string | null | undefined;
    miifCategory?: string | null | undefined;
}>;
export type MunicipalityTreasuryIdentity = z.infer<typeof MunicipalityTreasuryIdentitySchema>;
export declare const MunicipalFinanceSnapshotSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<"1.0.0">;
    municipalityCode: z.ZodString;
    treasuryDemarcationCode: z.ZodString;
    identity: z.ZodNullable<z.ZodObject<{
        demarcationCode: z.ZodString;
        name: z.ZodString;
        longName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        provinceCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        provinceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        miifCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    }, {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    }>>;
    financialYearEnd: z.ZodNullable<z.ZodNumber>;
    financialYearLabel: z.ZodNullable<z.ZodString>;
    amountType: z.ZodNullable<z.ZodString>;
    amountTypeLabel: z.ZodNullable<z.ZodString>;
    periodLength: z.ZodNullable<z.ZodLiteral<"year">>;
    dataPeriod: z.ZodNullable<z.ZodString>;
    /** Operating: incexp_v2 item 4400 Total Expenditure (sum across functions). */
    operatingBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    /**
     * Capital: capital_v2 NEW+RENEWAL+UPGRADING only
     * (excludes DEPRECIATION and REPAIR_MNT).
     */
    capitalBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    /**
     * Derived only when both operating and capital exist for the same FY + amount type.
     * Formula: operatingBudget + capitalBudget.
     */
    totalBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    majorAllocations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        rawTreasuryLabel: z.ZodString;
        displayLabel: z.ZodString;
        amountZar: z.ZodNumber;
        percentage: z.ZodNumber;
        denominatorZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        sourceDataset: z.ZodString;
        sourceRetrievalDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }, {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        sourceType: z.ZodLiteral<"national_treasury">;
        dataset: z.ZodString;
        municipalityCode: z.ZodString;
        treasuryDemarcationCode: z.ZodString;
        financialYearEnd: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        dataPeriod: z.ZodString;
        periodLength: z.ZodLiteral<"year">;
        retrievedAt: z.ZodString;
        sourceUpdatedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sourceUrl: z.ZodString;
        reference: z.ZodOptional<z.ZodString>;
        verificationState: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
        cubeLastUpdated: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }, {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }>, "many">;
    dataUpdatedAt: z.ZodNullable<z.ZodString>;
    retrievedAt: z.ZodString;
    cacheStatus: z.ZodEnum<["fresh", "stale", "miss", "error"]>;
    dataQuality: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
    completenessWarning: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    empty: z.ZodBoolean;
    emptyReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    sources: {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }[];
    treasuryDemarcationCode: string;
    financialYearEnd: number | null;
    financialYearLabel: string | null;
    amountType: string | null;
    amountTypeLabel: string | null;
    dataPeriod: string | null;
    periodLength: "year" | null;
    retrievedAt: string;
    contractVersion: "1.0.0";
    identity: {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    } | null;
    operatingBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    capitalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    totalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    majorAllocations: {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }[];
    dataUpdatedAt: string | null;
    cacheStatus: "fresh" | "stale" | "miss" | "error";
    dataQuality: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    empty: boolean;
    completenessWarning?: string | null | undefined;
    emptyReason?: string | null | undefined;
}, {
    municipalityCode: string;
    sources: {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }[];
    treasuryDemarcationCode: string;
    financialYearEnd: number | null;
    financialYearLabel: string | null;
    amountType: string | null;
    amountTypeLabel: string | null;
    dataPeriod: string | null;
    periodLength: "year" | null;
    retrievedAt: string;
    contractVersion: "1.0.0";
    identity: {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    } | null;
    operatingBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    capitalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    totalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    majorAllocations: {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }[];
    dataUpdatedAt: string | null;
    cacheStatus: "fresh" | "stale" | "miss" | "error";
    dataQuality: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    empty: boolean;
    completenessWarning?: string | null | undefined;
    emptyReason?: string | null | undefined;
}>;
export type MunicipalFinanceSnapshot = z.infer<typeof MunicipalFinanceSnapshotSchema>;
export declare const MunicipalFinanceCacheRecordSchema: z.ZodObject<{
    contractVersion: z.ZodLiteral<"1.0.0">;
    municipalityCode: z.ZodString;
    treasuryDemarcationCode: z.ZodString;
    identity: z.ZodNullable<z.ZodObject<{
        demarcationCode: z.ZodString;
        name: z.ZodString;
        longName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        provinceCode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        provinceName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        miifCategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    }, {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    }>>;
    financialYearEnd: z.ZodNullable<z.ZodNumber>;
    financialYearLabel: z.ZodNullable<z.ZodString>;
    amountType: z.ZodNullable<z.ZodString>;
    amountTypeLabel: z.ZodNullable<z.ZodString>;
    periodLength: z.ZodNullable<z.ZodLiteral<"year">>;
    dataPeriod: z.ZodNullable<z.ZodString>;
    /** Operating: incexp_v2 item 4400 Total Expenditure (sum across functions). */
    operatingBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    /**
     * Capital: capital_v2 NEW+RENEWAL+UPGRADING only
     * (excludes DEPRECIATION and REPAIR_MNT).
     */
    capitalBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    /**
     * Derived only when both operating and capital exist for the same FY + amount type.
     * Formula: operatingBudget + capitalBudget.
     */
    totalBudget: z.ZodNullable<z.ZodObject<{
        amountZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        derivation: z.ZodString;
        dataset: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }, {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    }>>;
    majorAllocations: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        rawTreasuryLabel: z.ZodString;
        displayLabel: z.ZodString;
        amountZar: z.ZodNumber;
        percentage: z.ZodNumber;
        denominatorZar: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        sourceDataset: z.ZodString;
        sourceRetrievalDate: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }, {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }>, "many">;
    sources: z.ZodArray<z.ZodObject<{
        sourceType: z.ZodLiteral<"national_treasury">;
        dataset: z.ZodString;
        municipalityCode: z.ZodString;
        treasuryDemarcationCode: z.ZodString;
        financialYearEnd: z.ZodNumber;
        financialYearLabel: z.ZodString;
        amountType: z.ZodString;
        amountTypeLabel: z.ZodString;
        dataPeriod: z.ZodString;
        periodLength: z.ZodLiteral<"year">;
        retrievedAt: z.ZodString;
        sourceUpdatedAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        sourceUrl: z.ZodString;
        reference: z.ZodOptional<z.ZodString>;
        verificationState: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
        cubeLastUpdated: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }, {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }>, "many">;
    dataUpdatedAt: z.ZodNullable<z.ZodString>;
    retrievedAt: z.ZodString;
    cacheStatus: z.ZodEnum<["fresh", "stale", "miss", "error"]>;
    dataQuality: z.ZodEnum<["official_source", "official_source_under_verification", "partial", "unavailable", "stale_cache"]>;
    completenessWarning: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    empty: z.ZodBoolean;
    emptyReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
} & {
    previousFingerprint: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fingerprint: z.ZodString;
    lastSuccessfulAt: z.ZodString;
    lastAttemptAt: z.ZodString;
    lastError: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    municipalityCode: string;
    sources: {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }[];
    treasuryDemarcationCode: string;
    financialYearEnd: number | null;
    financialYearLabel: string | null;
    amountType: string | null;
    amountTypeLabel: string | null;
    dataPeriod: string | null;
    periodLength: "year" | null;
    retrievedAt: string;
    contractVersion: "1.0.0";
    identity: {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    } | null;
    operatingBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    capitalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    totalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    majorAllocations: {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }[];
    dataUpdatedAt: string | null;
    cacheStatus: "fresh" | "stale" | "miss" | "error";
    dataQuality: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    empty: boolean;
    fingerprint: string;
    lastSuccessfulAt: string;
    lastAttemptAt: string;
    completenessWarning?: string | null | undefined;
    emptyReason?: string | null | undefined;
    previousFingerprint?: string | null | undefined;
    lastError?: string | null | undefined;
}, {
    municipalityCode: string;
    sources: {
        municipalityCode: string;
        sourceType: "national_treasury";
        dataset: string;
        treasuryDemarcationCode: string;
        financialYearEnd: number;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        dataPeriod: string;
        periodLength: "year";
        retrievedAt: string;
        sourceUrl: string;
        verificationState: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
        reference?: string | undefined;
        sourceUpdatedAt?: string | null | undefined;
        cubeLastUpdated?: string | null | undefined;
    }[];
    treasuryDemarcationCode: string;
    financialYearEnd: number | null;
    financialYearLabel: string | null;
    amountType: string | null;
    amountTypeLabel: string | null;
    dataPeriod: string | null;
    periodLength: "year" | null;
    retrievedAt: string;
    contractVersion: "1.0.0";
    identity: {
        name: string;
        demarcationCode: string;
        category?: string | null | undefined;
        longName?: string | null | undefined;
        provinceCode?: string | null | undefined;
        provinceName?: string | null | undefined;
        miifCategory?: string | null | undefined;
    } | null;
    operatingBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    capitalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    totalBudget: {
        amountZar: number;
        dataset: string;
        financialYearLabel: string;
        amountType: string;
        amountTypeLabel: string;
        derivation: string;
    } | null;
    majorAllocations: {
        id: string;
        amountZar: number;
        financialYearLabel: string;
        amountType: string;
        rawTreasuryLabel: string;
        displayLabel: string;
        percentage: number;
        denominatorZar: number;
        sourceDataset: string;
        sourceRetrievalDate: string;
    }[];
    dataUpdatedAt: string | null;
    cacheStatus: "fresh" | "stale" | "miss" | "error";
    dataQuality: "partial" | "official_source" | "official_source_under_verification" | "unavailable" | "stale_cache";
    empty: boolean;
    fingerprint: string;
    lastSuccessfulAt: string;
    lastAttemptAt: string;
    completenessWarning?: string | null | undefined;
    emptyReason?: string | null | undefined;
    previousFingerprint?: string | null | undefined;
    lastError?: string | null | undefined;
}>;
export type MunicipalFinanceCacheRecord = z.infer<typeof MunicipalFinanceCacheRecordSchema>;
/**
 * Explicit Serve SA → Treasury demarcation aliases.
 * Prefer 1:1 MDB codes; only list stable identifier mismatches (never name matching).
 * Metsweding (MTS) is intentionally unmapped — district was disestablished; do not
 * substitute Tshwane financials.
 */
export declare const SERVE_SA_TO_TREASURY_DEMARCATION: Readonly<Record<string, string>>;
export type MunicipalityCodeMappingResult = {
    serveSaCode: string;
    treasuryDemarcationCode: string | null;
    mapping: 'identity' | 'alias' | 'unmapped';
    aliasReason?: string;
};
export declare function mapServeSaMunicipalityCodeToTreasury(municipalityCode: string | null | undefined): MunicipalityCodeMappingResult;
/** SA municipal FY ends 30 June; yearEnd 2026 ⇒ label 2025/26 */
export declare function financialYearLabelFromEnd(yearEnd: number): string;
/**
 * Current municipal financial year-end as of a calendar date (Africa/Johannesburg).
 * FY runs 1 July → 30 June.
 */
export declare function currentMunicipalFinancialYearEnd(asOf?: Date): number;
export declare function formatCitizenBudgetPeriodLabel(input: {
    financialYearLabel: string;
    amountType: string;
    amountTypeLabel: string;
}): string;
export declare function citizenLabelForFunctionCategory(raw: string): string;
/**
 * Deterministic percentage to 1 decimal place.
 * Shares are computed from integer minor units (cents) where possible to avoid drift.
 */
export declare function allocatePercentages(amountsZar: number[], options?: {
    precision?: number;
}): number[];
export declare function buildMajorAllocations(input: {
    categories: Array<{
        rawLabel: string;
        amountZar: number;
    }>;
    financialYearLabel: string;
    amountType: string;
    sourceDataset: string;
    sourceRetrievalDate: string;
    maxCategories?: number;
}): MajorAllocation[];
export declare function emptyMunicipalFinanceSnapshot(municipalityCode: string, opts?: {
    treasuryDemarcationCode?: string | null;
    reason?: string;
    cacheStatus?: MunicipalFinanceSnapshot['cacheStatus'];
    dataQuality?: TreasuryDataQuality;
    retrievedAt?: string;
}): MunicipalFinanceSnapshot;
export declare function fingerprintMunicipalFinanceSnapshot(snapshot: Pick<MunicipalFinanceSnapshot, 'treasuryDemarcationCode' | 'financialYearEnd' | 'amountType' | 'operatingBudget' | 'capitalBudget' | 'majorAllocations'>): string;
