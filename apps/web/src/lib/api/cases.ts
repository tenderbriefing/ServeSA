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
        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
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
