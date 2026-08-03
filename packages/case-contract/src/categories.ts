/**
 * Canonical category mapping for ServeSA UI IDs → backend enums.
 * Single source of truth — do not scatter conversions across components.
 */

export type CanonicalCategory =
  | 'water'
  | 'electricity'
  | 'roads'
  | 'waste'
  | 'internet'
  | 'emergency'

export interface CategoryDefinition {
  uiId: string
  category: CanonicalCategory
  subcategory?: string
  label: string
  description: string
  icon: string
  /** Illustrative citizen-facing SLA hint (server calculates actual target) */
  slaHintHours: number
  aliases: string[]
}

export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
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
]

export const CANONICAL_CATEGORIES = [
  'water',
  'electricity',
  'roads',
  'waste',
  'internet',
  'emergency',
] as const

const lookup = new Map<string, CategoryDefinition>()

function register(key: string, def: CategoryDefinition) {
  lookup.set(key.toLowerCase().trim(), def)
}

for (const def of CATEGORY_DEFINITIONS) {
  register(def.uiId, def)
  register(def.category, def)
  for (const alias of def.aliases) {
    register(alias, def)
  }
}

export interface MappedCategory {
  category: CanonicalCategory
  subcategory?: string
  uiId: string
  label: string
}

/**
 * Map any known UI / legacy / canonical ID to the canonical pair.
 * Returns null for unknown values (caller must fail safely).
 */
export function mapUiCategoryToCanonical(raw: string): MappedCategory | null {
  if (!raw || typeof raw !== 'string') return null
  const def = lookup.get(raw.toLowerCase().trim())
  if (!def) return null

  // If caller already passed a canonical id without wanting UI subcategory defaults,
  // preserve explicit canonical-only when raw === category and no hyphenated ui id.
  const isExactCanonical =
    CANONICAL_CATEGORIES.includes(raw as CanonicalCategory) &&
    raw === def.category

  return {
    category: def.category,
    subcategory: isExactCanonical ? undefined : def.subcategory,
    uiId: def.uiId,
    label: def.label,
  }
}

export function getCategoryDefinition(uiOrCanonical: string): CategoryDefinition | null {
  return lookup.get(uiOrCanonical.toLowerCase().trim()) ?? null
}

export function listCitizenCategories(): CategoryDefinition[] {
  return CATEGORY_DEFINITIONS
}

export function isCanonicalCategory(value: string): value is CanonicalCategory {
  return (CANONICAL_CATEGORIES as readonly string[]).includes(value)
}
