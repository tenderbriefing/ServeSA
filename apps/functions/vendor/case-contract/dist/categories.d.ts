/**
 * Canonical category mapping for ServeSA UI IDs → backend enums.
 * Single source of truth — do not scatter conversions across components.
 */
export type CanonicalCategory = 'water' | 'electricity' | 'roads' | 'waste' | 'internet' | 'emergency';
export interface CategoryDefinition {
    uiId: string;
    category: CanonicalCategory;
    subcategory?: string;
    label: string;
    description: string;
    icon: string;
    /** Illustrative citizen-facing SLA hint (server calculates actual target) */
    slaHintHours: number;
    aliases: string[];
}
export declare const CATEGORY_DEFINITIONS: CategoryDefinition[];
export declare const CANONICAL_CATEGORIES: readonly ["water", "electricity", "roads", "waste", "internet", "emergency"];
export interface MappedCategory {
    category: CanonicalCategory;
    subcategory?: string;
    uiId: string;
    label: string;
}
/**
 * Map any known UI / legacy / canonical ID to the canonical pair.
 * Returns null for unknown values (caller must fail safely).
 */
export declare function mapUiCategoryToCanonical(raw: string): MappedCategory | null;
export declare function getCategoryDefinition(uiOrCanonical: string): CategoryDefinition | null;
export declare function listCitizenCategories(): CategoryDefinition[];
export declare function isCanonicalCategory(value: string): value is CanonicalCategory;
