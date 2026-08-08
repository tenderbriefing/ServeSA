import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const db = getFirestore();
const storage = getStorage();

interface PDFGenerationRequest {
  caseId: string;
  /** Authenticated caller uid — never trust client-supplied identity */
  authUid: string;
  authRoles?: string[];
  authMunicipalityCode?: string | null;
  includeMedia?: boolean;
  includeHistory?: boolean;
}

interface PDFGenerationResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

/**
 * Generate PDF report for a case
 */
export const generateCasePDF = async (data: PDFGenerationRequest): Promise<PDFGenerationResult> => {
  try {
    const {
      caseId,
      authUid,
      authRoles = [],
      authMunicipalityCode = null,
      includeMedia = true,
      includeHistory = true,
    } = data;

    if (!authUid) {
      throw new Error('Authentication required');
    }

    const caseDoc = await db.collection('cases').doc(caseId).get();
    
    if (!caseDoc.exists) {
      throw new Error('Case not found');
    }

    const caseData = caseDoc.data();
    validatePDFPermissions(caseData, {
      authUid,
      authRoles,
      authMunicipalityCode,
    });
    const pdfContent = await generatePDFContent(caseData, includeMedia, includeHistory);
    const pdfUrl = await uploadPDFToStorage(caseId, pdfContent, authUid);
    await logPDFGeneration(caseId, authUid, pdfUrl);

    return {
      success: true,
      pdfUrl
    };

  } catch (error) {
    console.error('Error generating case PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

function validatePDFPermissions(
  caseData: any,
  auth: { authUid: string; authRoles: string[]; authMunicipalityCode: string | null }
): void {
  const reporterUid = caseData?.reporterUid || caseData?.userId
  if (reporterUid && reporterUid === auth.authUid) {
    return
  }

  const isAdmin = auth.authRoles.includes('admin')
  const isOfficial =
    isAdmin ||
    auth.authRoles.includes('official') ||
    auth.authRoles.includes('moderator')
  if (!isOfficial) {
    throw new Error('Insufficient permissions to generate PDF')
  }

  if (isAdmin) return

  const caseMuni =
    caseData?.muniCode ||
    caseData?.municipalityCode ||
    caseData?.location?.municipalityId ||
    null
  if (!auth.authMunicipalityCode || !caseMuni || auth.authMunicipalityCode !== caseMuni) {
    throw new Error('User not authorized for this municipality')
  }
}

async function generatePDFContent(caseData: any, includeMedia: boolean, includeHistory: boolean): Promise<string> {
  try {
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Case Report - ${caseData.caseId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
          .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
          .section h3 { color: #2196F3; margin-top: 0; }
          .field { margin: 10px 0; }
          .field label { font-weight: bold; }
          .field value { margin-left: 10px; }
          .status { padding: 5px 10px; border-radius: 3px; color: white; }
          .status.submitted { background: #ff9800; }
          .status.acknowledged { background: #2196F3; }
          .status.in_progress { background: #4caf50; }
          .status.resolved { background: #8bc34a; }
          .status.closed { background: #607d8b; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ServeSA Case Report</h1>
          <h2>Case ID: ${caseData.caseId}</h2>
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <h3>Case Information</h3>
          <div class="field">
            <label>Title:</label>
            <value>${caseData.title}</value>
          </div>
          <div class="field">
            <label>Description:</label>
            <value>${caseData.description}</value>
          </div>
          <div class="field">
            <label>Category:</label>
            <value>${caseData.category}</value>
          </div>
          <div class="field">
            <label>Priority:</label>
            <value>${caseData.priority}</value>
          </div>
          <div class="field">
            <label>Status:</label>
            <value><span class="status ${caseData.status}">${caseData.status}</span></value>
          </div>
          <div class="field">
            <label>Created:</label>
            <value>${caseData.createdAt.toDate().toLocaleString()}</value>
          </div>
        </div>

        <div class="section">
          <h3>Location Information</h3>
          <div class="field">
            <label>Address:</label>
            <value>${caseData.location.address || 'Not specified'}</value>
          </div>
          <div class="field">
            <label>Ward:</label>
            <value>${caseData.location.wardName} (${caseData.location.wardId})</value>
          </div>
          <div class="field">
            <label>Municipality:</label>
            <value>${caseData.location.municipalityName}</value>
          </div>
        </div>
    `;

    if (includeMedia && caseData.mediaUrls && caseData.mediaUrls.length > 0) {
      htmlContent += `
        <div class="section">
          <h3>Media Files</h3>
          ${caseData.mediaUrls.map((url: string, index: number) => `
            <div>File ${index + 1}: ${url}</div>
          `).join('')}
        </div>
      `;
    }

    htmlContent += `
        <div class="footer">
          <p>This report was generated by ServeSA - South Africa's Service Delivery Platform</p>
        </div>
      </body>
      </html>
    `;

    return htmlContent;

  } catch (error) {
    console.error('Error generating PDF content:', error);
    throw error;
  }
}

async function uploadPDFToStorage(caseId: string, content: string, userId: string): Promise<string> {
  try {
    const bucket = storage.bucket();
    const fileName = `case-reports/${caseId}/${Date.now()}_case_report.html`;
    const fileRef = bucket.file(fileName);

    await fileRef.save(content, {
      metadata: {
        contentType: 'text/html',
        metadata: {
          caseId,
          generatedBy: userId,
          generatedAt: new Date().toISOString()
        }
      }
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return publicUrl;

  } catch (error) {
    console.error('Error uploading PDF to storage:', error);
    throw error;
  }
}

async function logPDFGeneration(caseId: string, userId: string, pdfUrl: string): Promise<void> {
  try {
    await db.collection('pdf_logs').add({
      caseId,
      userId,
      pdfUrl,
      generatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    await db.collection('case_events').add({
      caseId,
      eventType: 'pdf_generated',
      description: 'Case PDF report generated',
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: { pdfUrl }
    });

  } catch (error) {
    console.error('Error logging PDF generation:', error);
  }
}

export const getPDFHistory = async (caseId: string): Promise<any[]> => {
  try {
    const pdfLogsSnapshot = await db.collection('pdf_logs')
      .where('caseId', '==', caseId)
      .orderBy('generatedAt', 'desc')
      .get();

    return pdfLogsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error getting PDF history:', error);
    return [];
  }
};
