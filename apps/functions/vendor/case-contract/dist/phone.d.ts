/**
 * Normalise South African phone numbers to E.164 (+27…).
 * Returns null when the number cannot be normalised.
 */
export declare function normalizeSaPhone(input: string): string | null;
export declare function isValidSaPhone(input: string): boolean;
