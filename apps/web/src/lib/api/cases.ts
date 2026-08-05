import { httpsCallable } from 'firebase/functions'
import { functions } from '@/lib/firebase'
import type {
  CreateCaseInput,
  CreateCaseResponse,
} from '@servesa/case-contract'

export class CasesAPI {
  private static instance: CasesAPI

  public static getInstance(): CasesAPI {
    if (!CasesAPI.instance) {
      CasesAPI.instance = new CasesAPI()
    }
    return CasesAPI.instance
  }

  async createCase(
    caseData: CreateCaseInput & { anonymousSessionId?: string }
  ): Promise<CreateCaseResponse> {
    try {
      const createCaseFunction = httpsCallable(functions, 'createCaseFunction')
      const result = await createCaseFunction(caseData)
      return result.data as CreateCaseResponse
    } catch (error: any) {
      const message =
        error?.message ||
        error?.code ||
        'Failed to create case. Please try again.'
      throw new Error(message)
    }
  }

  async updateCaseStatus(caseId: string, status: string, comment?: string) {
    const updateStatusFunction = httpsCallable(
      functions,
      'updateCaseStatusFunction'
    )
    const result = await updateStatusFunction({ caseId, status, comment })
    return result.data
  }

  async getCase(caseId: string) {
    const getCaseFunction = httpsCallable(functions, 'getCaseFunction')
    const result = await getCaseFunction({ caseId })
    return result.data
  }

  async uploadMedia(caseId: string, files: File[]) {
    const uploadMediaFunction = httpsCallable(functions, 'uploadMediaFunction')

    const fileData = await Promise.all(
      files.map(async (file) => {
        const base64 = await this.fileToBase64(file)
        const contentHash = await this.sha256Hex(file)
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          contentHash,
        }
      })
    )

    const result = await uploadMediaFunction({
      caseId,
      files: fileData,
    })
    return result.data as {
      success: boolean
      mediaUrls: string[]
      failed: Array<{ name: string; reason: string }>
      status: 'completed' | 'partial' | 'failed'
      error?: string
    }
  }

  async checkDuplicates(
    caseId: string,
    threshold: number = 150,
    timeWindow: number = 48
  ) {
    const dedupeFunction = httpsCallable(functions, 'dedupeCaseFunction')
    const result = await dedupeFunction({
      caseId,
      threshold,
      timeWindow,
    })
    return result.data
  }

  async citizenConfirm(caseId: string, confirmed: boolean, reason?: string, rating?: number) {
    const fn = httpsCallable(functions, 'citizenConfirmResolutionFunction')
    const result = await fn({ caseId, confirmed, reason, rating })
    return result.data
  }

  async getCitizenTimeline(caseId: string) {
    const fn = httpsCallable(functions, 'getCitizenTimelineFunction')
    const result = await fn({ caseId })
    return result.data
  }

  private async sha256Hex(file: File): Promise<string> {
    const buf = await file.arrayBuffer()
    const hash = await crypto.subtle.digest('SHA-256', buf)
    return Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        resolve(result.split(',')[1])
      }
      reader.onerror = (error) => reject(error)
    })
  }
}

export const casesAPI = CasesAPI.getInstance()
