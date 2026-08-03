'use client'

import { listCitizenCategories, type Priority } from '@servesa/case-contract'

export const REPORT_DRAFT_KEY = 'servesa.report.draft.v1'

export type WizardStep = 1 | 2 | 3 | 4

export interface ReportLocationState {
  latitude: number | null
  longitude: number | null
  address?: string
  locationSource: 'device_gps' | 'map_pin' | 'address_search' | null
  summary?: string
}

export interface ReportWizardState {
  step: WizardStep
  uiCategoryId: string
  title: string
  description: string
  priority: Priority
  location: ReportLocationState
  reporter: {
    name: string
    email: string
    phone: string
  }
  consent: {
    dataProcessing: boolean
    communications: boolean
  }
  clientRequestId: string
  photosMeta: Array<{ name: string; size: number; type: string }>
}

export function createEmptyWizardState(clientRequestId: string): ReportWizardState {
  return {
    step: 1,
    uiCategoryId: '',
    title: '',
    description: '',
    priority: 'medium',
    location: {
      latitude: null,
      longitude: null,
      address: '',
      locationSource: null,
      summary: '',
    },
    reporter: { name: '', email: '', phone: '' },
    consent: { dataProcessing: false, communications: false },
    clientRequestId,
    photosMeta: [],
  }
}

export function loadDraft(): ReportWizardState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(REPORT_DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ReportWizardState
  } catch {
    return null
  }
}

export function saveDraft(state: ReportWizardState): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REPORT_DRAFT_KEY, JSON.stringify(state))
  } catch {
    // quota / private mode
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(REPORT_DRAFT_KEY)
}

export function newClientRequestId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const CITIZEN_CATEGORIES = listCitizenCategories()

export const PRIORITY_OPTIONS: Array<{
  id: Priority
  name: string
  description: string
  warn?: boolean
}> = [
  {
    id: 'emergency',
    name: 'Emergency',
    description:
      'Immediate danger to life, safety, or critical infrastructure',
    warn: true,
  },
  {
    id: 'high',
    name: 'High',
    description: 'Major disruption affecting many people',
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Material service issue without immediate danger',
  },
  {
    id: 'low',
    name: 'Low',
    description: 'Non-urgent maintenance or minor service issue',
  },
]
