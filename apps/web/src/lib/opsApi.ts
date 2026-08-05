import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'

export async function callOps<T = any>(name: string, data: Record<string, unknown>) {
  const fn = httpsCallable(functions, name)
  const res = await fn(data)
  return res.data as T
}

export const opsApi = {
  updateStatus: (data: Record<string, unknown>) =>
    callOps('updateCaseStatusFunction', data),
  assign: (data: Record<string, unknown>) => callOps('assignCaseFunction', data),
  addNote: (data: Record<string, unknown>) =>
    callOps('addInternalNoteFunction', data),
  addPublicUpdate: (data: Record<string, unknown>) =>
    callOps('addPublicUpdateFunction', data),
  upsertDepartment: (data: Record<string, unknown>) =>
    callOps('upsertDepartmentFunction', data),
  upsertCategoryMap: (data: Record<string, unknown>) =>
    callOps('upsertCategoryDepartmentMapFunction', data),
  setOfficialClaims: (data: Record<string, unknown>) =>
    callOps('setOfficialClaimsFunction', data),
  reviewDuplicate: (data: Record<string, unknown>) =>
    callOps('reviewDuplicateFunction', data),
  unlinkCases: (data: Record<string, unknown>) =>
    callOps('unlinkCasesFunction', data),
  smartQueue: (data: Record<string, unknown> = {}) =>
    callOps('listSmartWorkQueueFunction', data),
  supervisorBoard: (data: Record<string, unknown> = {}) =>
    callOps('listSupervisorBoardFunction', data),
  mapCases: (data: Record<string, unknown> = {}) =>
    callOps('listMapCasesFunction', data),
  fieldJobs: (data: Record<string, unknown> = {}) =>
    callOps('listFieldJobsFunction', data),
  startFieldWork: (data: Record<string, unknown>) =>
    callOps('startFieldWorkFunction', data),
  proposeCompletion: (data: Record<string, unknown>) =>
    callOps('proposeFieldCompletionFunction', data),
  search: (data: Record<string, unknown>) =>
    callOps('searchOpsCasesFunction', data),
}
