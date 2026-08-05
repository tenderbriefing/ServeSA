/**
 * Municipal case lifecycle — shared contract.
 * Do not invent municipalities; GIS remains source of tenancy.
 */
import { z } from 'zod';
export declare const CaseLifecycleStatusSchema: z.ZodEnum<["submitted", "acknowledged", "assigned", "in_progress", "resolved", "citizen_confirmed", "closed", "rejected"]>;
export type CaseLifecycleStatus = z.infer<typeof CaseLifecycleStatusSchema>;
/** Allowed transitions. Reopen paths go through acknowledged. */
export declare const CASE_STATUS_TRANSITIONS: Record<CaseLifecycleStatus, CaseLifecycleStatus[]>;
export declare function canTransition(from: string, to: string): boolean;
export declare function assertTransition(from: string, to: string): void;
/** Citizen-visible labels only — no internal ops language. */
export declare const CITIZEN_STATUS_LABEL: Record<CaseLifecycleStatus, string>;
export declare const OFFICIAL_PRIMARY_ACTION: Partial<Record<CaseLifecycleStatus, {
    action: string;
    nextStatus: CaseLifecycleStatus;
}>>;
