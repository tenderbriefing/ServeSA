'use client'

import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  Droplets,
  Laptop,
  Lightbulb,
  Route,
  Trash2,
  Zap,
} from 'lucide-react'

/**
 * Outline icons for citizen categories — replaces emoji in the wizard UI.
 * Contract `icon` emoji fields remain unchanged for backwards compatibility.
 */
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  'water-sewage': Droplets,
  water: Droplets,
  electricity: Zap,
  'roads-infrastructure': Route,
  roads: Route,
  'waste-management': Trash2,
  waste: Trash2,
  'digital-services': Laptop,
  internet: Laptop,
  'emergency-services': AlertTriangle,
  emergency: AlertTriangle,
}

/**
 * Soft tinted containers + coloured strokes for category icons.
 * Uses SA design tokens (blue / gold / green / red / neutral) where possible;
 * cyan for digital so it stays distinct from water without inventing a new brand colour.
 */
const CATEGORY_ICON_TONES: Record<string, string> = {
  'water-sewage': 'border-blue-200 bg-blue-50 text-blue-700',
  water: 'border-blue-200 bg-blue-50 text-blue-700',
  electricity: 'border-gold-200 bg-gold-50 text-gold-800',
  'roads-infrastructure': 'border-neutral-300 bg-neutral-100 text-neutral-700',
  roads: 'border-neutral-300 bg-neutral-100 text-neutral-700',
  'waste-management': 'border-green-200 bg-green-50 text-green-700',
  waste: 'border-green-200 bg-green-50 text-green-700',
  'digital-services': 'border-cyan-200 bg-cyan-50 text-cyan-700',
  internet: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  'emergency-services': 'border-red-200 bg-red-50 text-red-700',
  emergency: 'border-red-200 bg-red-50 text-red-700',
}

const DEFAULT_ICON_TONE = 'border-border bg-surface-muted text-ink-muted'

function resolveCategoryKey(uiId: string): string {
  const raw = uiId.toLowerCase().trim()
  const underscored = raw.replace(/[^a-z0-9]+/g, '_')
  if (CATEGORY_ICONS[raw] || CATEGORY_ICON_TONES[raw]) return raw
  if (CATEGORY_ICONS[underscored] || CATEGORY_ICON_TONES[underscored]) {
    return underscored
  }
  return underscored.split('_')[0] || raw
}

export function categoryOutlineIcon(uiId: string): LucideIcon {
  const key = resolveCategoryKey(uiId)
  return CATEGORY_ICONS[key] || Lightbulb
}

/** Tailwind classes for the icon container (border + tint + icon colour). */
export function categoryIconTone(uiId: string): string {
  const key = resolveCategoryKey(uiId)
  return CATEGORY_ICON_TONES[key] || DEFAULT_ICON_TONE
}
