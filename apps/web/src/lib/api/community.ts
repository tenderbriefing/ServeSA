import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import { callOps } from '@/lib/opsApi'

async function callCommunity<T = any>(name: string, data: Record<string, unknown>) {
  const fn = httpsCallable(functions, name)
  const res = await fn(data)
  return res.data as T
}

export const communityApi = {
  listUpdates: (data: Record<string, unknown>) =>
    callCommunity('listMunicipalUpdatesFunction', data),
  getUpdate: (data: { updateId: string }) =>
    callCommunity('getMunicipalUpdateFunction', data),
  upsertUpdate: (data: Record<string, unknown>) =>
    callOps('upsertMunicipalUpdateFunction', data),
  publishUpdate: (data: Record<string, unknown>) =>
    callOps('publishMunicipalUpdateFunction', data),
  archiveUpdate: (data: Record<string, unknown>) =>
    callOps('archiveMunicipalUpdateFunction', data),

  listIdeas: (data: Record<string, unknown>) =>
    callCommunity('listCommunityIdeasFunction', data),
  getIdea: (data: { ideaId: string }) =>
    callCommunity('getCommunityIdeaFunction', data),
  submitIdea: (data: Record<string, unknown>) =>
    callCommunity('submitCommunityIdeaFunction', data),
  supportIdea: (data: { ideaId: string }) =>
    callCommunity('supportCommunityIdeaFunction', data),
  transitionIdea: (data: Record<string, unknown>) =>
    callOps('transitionCommunityIdeaFunction', data),
  respondIdea: (data: Record<string, unknown>) =>
    callOps('respondToCommunityIdeaFunction', data),
  addIdeaNote: (data: Record<string, unknown>) =>
    callOps('addIdeaInternalNoteFunction', data),

  insights: (data: { municipalityCode: string }) =>
    callCommunity('getCommunityInsightsFunction', data),
}
