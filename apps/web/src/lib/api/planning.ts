import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { callOps } from '@/lib/opsApi'

async function callPlanning<T = unknown>(
  name: string,
  data: Record<string, unknown>
) {
  const fn = httpsCallable(functions, name)
  const res = await fn(data)
  return res.data as T
}

export const planningApi = {
  getSummary: (data: {
    municipalityCode: string
    wardId?: string | null
    fiscalYear?: string
  }) => callPlanning('getMunicipalPlanningSummaryFunction', data),

  getProject: (data: { projectId: string }) =>
    callPlanning('getMunicipalProjectFunction', data),

  listEntities: (data: Record<string, unknown>) =>
    callPlanning('listPlanningEntitiesFunction', data),

  upsertDocument: (data: Record<string, unknown>) =>
    callOps('upsertPlanDocumentFunction', data),
  upsertPriority: (data: Record<string, unknown>) =>
    callOps('upsertPriorityFunction', data),
  upsertProject: (data: Record<string, unknown>) =>
    callOps('upsertMunicipalProjectFunction', data),
  upsertBudgetLine: (data: Record<string, unknown>) =>
    callOps('upsertBudgetLineFunction', data),
  transitionStatus: (data: Record<string, unknown>) =>
    callOps('transitionPlanningStatusFunction', data),
}
