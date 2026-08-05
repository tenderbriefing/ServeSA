"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_SLA_HOURS = exports.SLA_POLICY_VERSION = void 0;
exports.calculateSlaFields = calculateSlaFields;
exports.getTargetHours = getTargetHours;
exports.SLA_POLICY_VERSION = '1.0.0';
/** Default SLA hours unless municipality overrides */
exports.DEFAULT_SLA_HOURS = {
    water: { emergency: 1, high: 24, medium: 72, low: 168 },
    electricity: { emergency: 1, high: 4, medium: 24, low: 72 },
    roads: { emergency: 4, high: 24, medium: 72, low: 168 },
    waste: { emergency: 24, high: 48, medium: 72, low: 168 },
    internet: { emergency: 24, high: 72, medium: 168, low: 336 },
    emergency: { emergency: 1, high: 2, medium: 4, low: 8 },
};
/**
 * Calculate SLA target using server clock (UTC).
 * Municipality config overrides defaults when present.
 */
function calculateSlaFields(category, priority, municipalitySLA, startedAt = new Date()) {
    const categoryDefaults = exports.DEFAULT_SLA_HOURS[category];
    const override = municipalitySLA?.[category];
    const hours = override?.[priority] ?? categoryDefaults?.[priority];
    if (hours === undefined || typeof hours !== 'number' || hours < 0) {
        throw new Error(`Invalid SLA configuration for ${category}/${priority}`);
    }
    const slaTarget = new Date(startedAt.getTime() + hours * 60 * 60 * 1000);
    return {
        targetHours: hours,
        slaStartedAt: startedAt,
        slaTarget,
        slaBreach: false,
        policyVersion: exports.SLA_POLICY_VERSION,
    };
}
function getTargetHours(category, priority, municipalitySLA) {
    return calculateSlaFields(category, priority, municipalitySLA).targetHours;
}
