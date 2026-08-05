"use strict";
/**
 * Municipal case lifecycle — shared contract.
 * Do not invent municipalities; GIS remains source of tenancy.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.OFFICIAL_PRIMARY_ACTION = exports.CITIZEN_STATUS_LABEL = exports.CASE_STATUS_TRANSITIONS = exports.CaseLifecycleStatusSchema = void 0;
exports.canTransition = canTransition;
exports.assertTransition = assertTransition;
const zod_1 = require("zod");
exports.CaseLifecycleStatusSchema = zod_1.z.enum([
    'submitted',
    'acknowledged',
    'assigned',
    'in_progress',
    'resolved',
    'citizen_confirmed',
    'closed',
    'rejected',
]);
/** Allowed transitions. Reopen paths go through acknowledged. */
exports.CASE_STATUS_TRANSITIONS = {
    submitted: ['acknowledged', 'rejected'],
    acknowledged: ['assigned', 'rejected'],
    assigned: ['in_progress', 'assigned', 'rejected'],
    in_progress: ['resolved', 'assigned', 'rejected'],
    resolved: ['citizen_confirmed', 'closed', 'acknowledged'],
    citizen_confirmed: ['closed', 'acknowledged'],
    closed: ['acknowledged'],
    rejected: ['acknowledged'],
};
function canTransition(from, to) {
    const allowed = exports.CASE_STATUS_TRANSITIONS[from];
    if (!allowed)
        return false;
    return allowed.includes(to);
}
function assertTransition(from, to) {
    if (!canTransition(from, to)) {
        throw new Error(`Invalid status transition from ${from} to ${to}`);
    }
}
/** Citizen-visible labels only — no internal ops language. */
exports.CITIZEN_STATUS_LABEL = {
    submitted: 'Case received',
    acknowledged: 'Acknowledged',
    assigned: 'Assigned',
    in_progress: 'In progress',
    resolved: 'Resolved',
    citizen_confirmed: 'Confirmation received',
    closed: 'Closed',
    rejected: 'Closed',
};
exports.OFFICIAL_PRIMARY_ACTION = {
    submitted: { action: 'Acknowledge', nextStatus: 'acknowledged' },
    acknowledged: { action: 'Assign', nextStatus: 'assigned' },
    assigned: { action: 'Start Work', nextStatus: 'in_progress' },
    in_progress: { action: 'Resolve', nextStatus: 'resolved' },
    resolved: { action: 'Close', nextStatus: 'closed' },
    citizen_confirmed: { action: 'Close', nextStatus: 'closed' },
};
