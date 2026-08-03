import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const db = getFirestore();
const storage = getStorage();

interface MediaUploadData {
  caseId: string;
  files: Array<{
    name: string;
    type: string;
    size: number;
    data: string; // Base64 encoded data
  }>;
  userId: string;
}

interface MediaProcessingResult {
  success: boolean;
  mediaUrls: string[];
  error?: string;
}

/**
 * Process media upload for a case
 */
export const processMediaUpload = async (data: MediaUploadData): Promise<MediaProcessingResult> => {
  try {
    const { caseId, files, userId } = data;

    // Validate case exists
    const caseDoc = await db.collection('cases').doc(caseId).get();
    if (!caseDoc.exists) {
      throw new Error('Case not found');
    }

    const mediaUrls: string[] = [];
    const processedFiles: any[] = [];

    // Process each file
    for (const file of files) {
      try {
        const processedFile = await processFile(file, caseId, userId);
        mediaUrls.push(processedFile.url);
        processedFiles.push(processedFile);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue processing other files
      }
    }

    if (mediaUrls.length === 0) {
      throw new Error('No files were successfully processed');
    }

    // Update case with media URLs
    await db.collection('cases').doc(caseId).update({
      mediaUrls: admin.firestore.FieldValue.arrayUnion(...mediaUrls),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: userId
    });

    // Create media upload event
    await db.collection('case_events').add({
      caseId,
      eventType: 'media_uploaded',
      description: `${mediaUrls.length} media file(s) uploaded`,
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        fileCount: mediaUrls.length,
        fileTypes: processedFiles.map(f => f.type),
        totalSize: processedFiles.reduce((sum, f) => sum + f.size, 0)
      }
    });

    return {
      success: true,
      mediaUrls
    };

  } catch (error) {
    console.error('Error processing media upload:', error);
    return {
      success: false,
      mediaUrls: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Process individual file
 */
async function processFile(file: any, caseId: string, userId: string): Promise<any> {
  try {
    // Validate file
    validateFile(file);

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = getFileExtension(file.name);
    const fileName = `${caseId}/${timestamp}_${sanitizeFileName(file.name)}`;
    
    // Convert base64 to buffer
    const fileBuffer = Buffer.from(file.data, 'base64');

    // Upload to Firebase Storage
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    await fileRef.save(fileBuffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          caseId,
          userId,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Make file publicly accessible
    await fileRef.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Store file metadata in database
    const fileMetadata = {
      caseId,
      fileName,
      originalName: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      uploadedBy: userId,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('case_media').add(fileMetadata);

    return {
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl
    };

  } catch (error) {
    console.error('Error processing file:', error);
    throw error;
  }
}

/**
 * Validate file
 */
function validateFile(file: any): void {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/avi',
    'video/mov',
    'application/pdf',
    'text/plain'
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(`File type ${file.type} is not allowed.`);
  }

  // Check file name
  if (!file.name || file.name.length === 0) {
    throw new Error('File name is required.');
  }
}

/**
 * Get file extension
 */
function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.');
  return lastDot !== -1 ? fileName.substring(lastDot + 1) : '';
}

/**
 * Sanitize file name
 */
function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Delete media files for a case
 */
export const deleteCaseMedia = async (caseId: string, userId: string): Promise<void> => {
  try {
    // Get all media files for the case
    const mediaSnapshot = await db.collection('case_media')
      .where('caseId', '==', caseId)
      .get();

    const bucket = storage.bucket();

    // Delete each file from storage
    for (const mediaDoc of mediaSnapshot.docs) {
      const mediaData = mediaDoc.data();
      
      try {
        const fileRef = bucket.file(mediaData.fileName);
        await fileRef.delete();
      } catch (error) {
        console.error(`Error deleting file ${mediaData.fileName}:`, error);
      }

      // Delete metadata
      await mediaDoc.ref.delete();
    }

    // Create deletion event
    await db.collection('case_events').add({
      caseId,
      eventType: 'media_deleted',
      description: 'All media files deleted',
      userId,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

  } catch (error) {
    console.error('Error deleting case media:', error);
    throw error;
  }
};

/**
 * Get media files for a case
 */
export const getCaseMedia = async (caseId: string): Promise<any[]> => {
  try {
    const mediaSnapshot = await db.collection('case_media')
      .where('caseId', '==', caseId)
      .orderBy('uploadedAt', 'desc')
      .get();

    return mediaSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error getting case media:', error);
    return [];
  }
};

/**
 * Generate signed URL for private file access
 */
export const generateSignedUrl = async (fileName: string, expiresIn: number = 3600): Promise<string> => {
  try {
    const bucket = storage.bucket();
    const fileRef = bucket.file(fileName);

    const [signedUrl] = await fileRef.getSignedUrl({
      action: 'read',
      expires: Date.now() + expiresIn * 1000
    });

    return signedUrl;

  } catch (error) {
    console.error('Error generating signed URL:', error);
    throw error;
  }
};

/**
 * Compress image file
 */
export const compressImage = async (fileBuffer: Buffer, quality: number = 80): Promise<Buffer> => {
  try {
    // For Phase-1, return original buffer
    // In production, this would use Sharp or similar library for image compression
    return fileBuffer;

  } catch (error) {
    console.error('Error compressing image:', error);
    return fileBuffer;
  }
};

/**
 * Extract metadata from image
 */
export const extractImageMetadata = async (fileBuffer: Buffer): Promise<any> => {
  try {
    // For Phase-1, return basic metadata
    // In production, this would use ExifReader or similar library
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      hasLocation: false,
      location: null
    };

  } catch (error) {
    console.error('Error extracting image metadata:', error);
    return {
      width: 0,
      height: 0,
      format: 'unknown',
      hasLocation: false,
      location: null
    };
  }
};
