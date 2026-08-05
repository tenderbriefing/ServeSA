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
}
