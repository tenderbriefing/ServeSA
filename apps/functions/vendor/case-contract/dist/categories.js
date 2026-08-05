"use strict";
/**
 * Canonical category mapping for ServeSA UI IDs → backend enums.
 * Single source of truth — do not scatter conversions across components.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_CATEGORIES = exports.CATEGORY_DEFINITIONS = void 0;
exports.mapUiCategoryToCanonical = mapUiCategoryToCanonical;
exports.getCategoryDefinition = getCategoryDefinition;
exports.listCitizenCategories = listCitizenCategories;
exports.isCanonicalCategory = isCanonicalCategory;
exports.CATEGORY_DEFINITIONS = [
    {
        uiId: 'water-sewage',
        category: 'water',
        subcategory: 'sewage',
        label: 'Water & Sewage',
        description: 'Leaks, bursts, sewage overflows, no water supply',
        icon: '💧',
        slaHintHours: 24,
        aliases: ['water', 'water_sewage', 'water-and-sewage', 'sanitation'],
    },
    {
        uiId: 'electricity',
        category: 'electricity',
        label: 'Electricity',
        description: 'Outages, exposed cables, street lights, meter issues',
        icon: '⚡',
        slaHintHours: 4,
        aliases: ['power', 'electric', 'streetlights'],
    },
    {
        uiId: 'roads-infrastructure',
        category: 'roads',
        subcategory: 'infrastructure',
        label: 'Roads & Infrastructure',
        description: 'Potholes, damaged roads, stormwater, bridges',
        icon: '🛣️',
        slaHintHours: 72,
        aliases: ['roads', 'roads_infrastructure', 'potholes'],
    },
    {
        uiId: 'waste-management',
        category: 'waste',
        subcategory: 'management',
        label: 'Waste Management',
        description: 'Missed collections, illegal dumping, bins',
        icon: '🗑️',
        slaHintHours: 48,
        aliases: ['waste', 'waste_management', 'refuse'],
    },
    {
        uiId: 'digital-services',
        category: 'internet',
        subcategory: 'digital-services',
        label: 'Digital Services',
        description: 'Public Wi-Fi, municipal digital service outages',
        icon: '💻',
        slaHintHours: 168,
        aliases: ['internet', 'digital_services', 'wifi'],
    },
    {
        uiId: 'emergency-services',
        category: 'emergency',
        subcategory: 'services',
        label: 'Emergency Services',
        description: 'Immediate danger to life, safety, or critical infrastructure',
        icon: '🚨',
        slaHintHours: 1,
        aliases: ['emergency', 'emergency_services'],
    },
];
exports.CANONICAL_CATEGORIES = [
    'water',
    'electricity',
    'roads',
    'waste',
    'internet',
    'emergency',
];
const lookup = new Map();
function register(key, def) {
    lookup.set(key.toLowerCase().trim(), def);
}
for (const def of exports.CATEGORY_DEFINITIONS) {
    register(def.uiId, def);
    register(def.category, def);
    for (const alias of def.aliases) {
        register(alias, def);
    }
}
/**
 * Map any known UI / legacy / canonical ID to the canonical pair.
 * Returns null for unknown values (caller must fail safely).
 */
function mapUiCategoryToCanonical(raw) {
    if (!raw || typeof raw !== 'string')
        return null;
    const def = lookup.get(raw.toLowerCase().trim());
    if (!def)
        return null;
    // If caller already passed a canonical id without wanting UI subcategory defaults,
    // preserve explicit canonical-only when raw === category and no hyphenated ui id.
    const isExactCanonical = exports.CANONICAL_CATEGORIES.includes(raw) &&
        raw === def.category;
    return {
        category: def.category,
        subcategory: isExactCanonical ? undefined : def.subcategory,
        uiId: def.uiId,
        label: def.label,
    };
}
function getCategoryDefinition(uiOrCanonical) {
    return lookup.get(uiOrCanonical.toLowerCase().trim()) ?? null;
}
function listCitizenCategories() {
    return exports.CATEGORY_DEFINITIONS;
}
function isCanonicalCategory(value) {
    return exports.CANONICAL_CATEGORIES.includes(value);
}
