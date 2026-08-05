import type { CanonicalCategory } from './categories';
export declare const SLA_POLICY_VERSION = "1.0.0";
export type SlaPriority = 'emergency' | 'high' | 'medium' | 'low';
export type SLAConfig = Record<SlaPriority, number>;
export type MunicipalitySLAConfig = Record<CanonicalCategory, SLAConfig>;
/** Default SLA hours unless municipality overrides */
export declare const DEFAULT_SLA_HOURS: MunicipalitySLAConfig;
export interface SLACalculation {
    targetHours: number;
    slaStartedAt: Date;
    slaTarget: Date;
    slaBreach: false;
    policyVersion: string;
}
/**
 * Calculate SLA target using server clock (UTC).
 * Municipality config overrides defaults when present.
 */
export declare function calculateSlaFields(category: CanonicalCategory, priority: SlaPriority, municipalitySLA?: Partial<MunicipalitySLAConfig> | null, startedAt?: Date): SLACalculation;
export declare function getTargetHours(category: CanonicalCategory, priority: SlaPriority, municipalitySLA?: Partial<MunicipalitySLAConfig> | null): number;
