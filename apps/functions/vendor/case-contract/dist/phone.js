"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeSaPhone = normalizeSaPhone;
exports.isValidSaPhone = isValidSaPhone;
/**
 * Normalise South African phone numbers to E.164 (+27…).
 * Returns null when the number cannot be normalised.
 */
function normalizeSaPhone(input) {
    if (!input)
        return null;
    let digits = input.replace(/[^\d+]/g, '');
    if (digits.startsWith('00')) {
        digits = `+${digits.slice(2)}`;
    }
    if (digits.startsWith('+27')) {
        const rest = digits.slice(3).replace(/\D/g, '');
        if (rest.length === 9)
            return `+27${rest}`;
        return null;
    }
    if (digits.startsWith('27') && digits.length === 11) {
        return `+${digits}`;
    }
    // Local format 0XXXXXXXXX
    const local = digits.replace(/\D/g, '');
    if (local.length === 10 && local.startsWith('0')) {
        return `+27${local.slice(1)}`;
    }
    if (local.length === 9) {
        return `+27${local}`;
    }
    return null;
}
function isValidSaPhone(input) {
    return normalizeSaPhone(input) !== null;
}
