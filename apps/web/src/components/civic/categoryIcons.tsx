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

export function categoryOutlineIcon(uiId: string): LucideIcon {
  const raw = uiId.toLowerCase().trim()
  const underscored = raw.replace(/[^a-z0-9]+/g, '_')
  return (
    CATEGORY_ICONS[raw] ||
    CATEGORY_ICONS[underscored] ||
    CATEGORY_ICONS[underscored.split('_')[0]] ||
    Lightbulb
  )
}
