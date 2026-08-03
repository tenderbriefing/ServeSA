import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

// Case Management API
export class CasesAPI {
  private static instance: CasesAPI;
  
  public static getInstance(): CasesAPI {
    if (!CasesAPI.instance) {
      CasesAPI.instance = new CasesAPI();
    }
    return CasesAPI.instance;
  }

  /**
   * Create a new case
   */
  async createCase(caseData: {
    title: string;
    description: string;
    category: string;
    subcategory?: string;
    priority: 'low' | 'medium' | 'high' | 'emergency';
    location: {
      lat: number;
      lng: number;
      address?: string;
    };
    contactInfo?: {
      phone?: string;
      email?: string;
    };
    images?: string[];
    consent: boolean;
  }) {
    try {
      const createCaseFunction = httpsCallable(functions, 'createCaseFunction');
      const result = await createCaseFunction(caseData);
      return result.data;
    } catch (error) {
      console.error('Error creating case:', error);
      throw new Error('Failed to create case. Please try again.');
    }
  }

  /**
   * Update case status
   */
  async updateCaseStatus(caseId: string, status: string, comment?: string) {
    try {
      const updateStatusFunction = httpsCallable(functions, 'updateCaseStatusFunction');
      const result = await updateStatusFunction({
        caseId,
        status,
        comment
      });
      return result.data;
    } catch (error) {
      console.error('Error updating case status:', error);
      throw new Error('Failed to update case status. Please try again.');
    }
  }

  /**
   * Get case by ID
   */
  async getCase(caseId: string) {
    try {
      const getCaseFunction = httpsCallable(functions, 'getCaseFunction');
      const result = await getCaseFunction({ caseId });
      return result.data;
    } catch (error) {
      console.error('Error getting case:', error);
      throw new Error('Failed to load case details.');
    }
  }

  /**
   * Get case status history
   */
  async getCaseHistory(caseId: string) {
    try {
      const getHistoryFunction = httpsCallable(functions, 'getCaseHistoryFunction');
      const result = await getHistoryFunction({ caseId });
      return result.data;
    } catch (error) {
      console.error('Error getting case history:', error);
      throw new Error('Failed to load case history.');
    }
  }

  /**
   * Upload media files for a case
   */
  async uploadMedia(caseId: string, files: File[]) {
    try {
      const uploadMediaFunction = httpsCallable(functions, 'uploadMediaFunction');
      
      // Convert files to base64
      const fileData = await Promise.all(
        files.map(async (file) => {
          const base64 = await this.fileToBase64(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64
          };
        })
      );

      const result = await uploadMediaFunction({
        caseId,
        files: fileData
      });
      return result.data;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw new Error('Failed to upload files. Please try again.');
    }
  }

  /**
   * Generate PDF report for a case
   */
  async generatePDF(caseId: string, includeMedia: boolean = true, includeHistory: boolean = true) {
    try {
      const generatePDFFunction = httpsCallable(functions, 'generatePDFFunction');
      const result = await generatePDFFunction({
        caseId,
        includeMedia,
        includeHistory
      });
      return result.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF report.');
    }
  }

  /**
   * Check for duplicate cases
   */
  async checkDuplicates(caseId: string, threshold: number = 100, timeWindow: number = 24) {
    try {
      const dedupeFunction = httpsCallable(functions, 'dedupeCaseFunction');
      const result = await dedupeFunction({
        caseId,
        threshold,
        timeWindow
      });
      return result.data;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw new Error('Failed to check for duplicate cases.');
    }
  }

  /**
   * Get duplicate cases for a case
   */
  async getDuplicateCases(caseId: string) {
    try {
      const getDuplicatesFunction = httpsCallable(functions, 'getDuplicateCasesFunction');
      const result = await getDuplicatesFunction({ caseId });
      return result.data;
    } catch (error) {
      console.error('Error getting duplicate cases:', error);
      throw new Error('Failed to load duplicate cases.');
    }
  }

  /**
   * Convert file to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Export singleton instance
export const casesAPI = CasesAPI.getInstance();
