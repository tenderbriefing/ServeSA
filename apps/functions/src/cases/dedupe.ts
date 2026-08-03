import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface DedupeRequest {
  caseId: string;
  threshold?: number;
  timeWindow?: number;
}

interface DedupeResult {
  success: boolean;
  caseId: string;
  duplicates: Array<{
    caseId: string;
    similarity: number;
    distance: number;
    timeDiff: number;
  }>;
  merged?: boolean;
  error?: string;
}

/**
 * Find and handle duplicate cases
 */
export const dedupeCase = async (data: DedupeRequest): Promise<DedupeResult> => {
  try {
    const { caseId, threshold = 100, timeWindow = 24 } = data;

    const caseDoc = await db.collection('cases').doc(caseId).get();
    
    if (!caseDoc.exists) {
      throw new Error('Case not found');
    }

    const caseData = caseDoc.data();
    const duplicates = await findPotentialDuplicates(caseData, threshold, timeWindow);

    if (duplicates.length === 0) {
      return {
        success: true,
        caseId,
        duplicates: []
      };
    }

    const shouldMerge = await shouldMergeDuplicates(caseData, duplicates);

    if (shouldMerge) {
      await mergeDuplicateCases(caseData, duplicates);
      
      return {
        success: true,
        caseId,
        duplicates,
        merged: true
      };
    }

    await markAsPotentialDuplicates(caseData, duplicates);

    return {
      success: true,
      caseId,
      duplicates,
      merged: false
    };

  } catch (error) {
    console.error('Error in case deduplication:', error);
    return {
      success: false,
      caseId: data.caseId,
      duplicates: [],
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

async function findPotentialDuplicates(
  caseData: any,
  threshold: number,
  timeWindow: number
): Promise<Array<{
  caseId: string;
  similarity: number;
  distance: number;
  timeDiff: number;
}>> {
  try {
    const timeWindowMs = timeWindow * 60 * 60 * 1000;
    const timeThreshold = new Date(caseData.createdAt.toDate().getTime() - timeWindowMs);

    const potentialDuplicatesSnapshot = await db.collection('cases')
      .where('category', '==', caseData.category)
      .where('status', 'in', ['submitted', 'acknowledged', 'in_progress'])
      .where('createdAt', '>=', timeThreshold)
      .where('createdAt', '<=', caseData.createdAt.toDate())
      .get();

    const duplicates: Array<{
      caseId: string;
      similarity: number;
      distance: number;
      timeDiff: number;
    }> = [];

    for (const doc of potentialDuplicatesSnapshot.docs) {
      if (doc.id === caseData.caseId) continue;

      const duplicateData = doc.data();
      
      const distance = calculateDistance(
        caseData.location.lat,
        caseData.location.lng,
        duplicateData.location.lat,
        duplicateData.location.lng
      );

      if (distance <= threshold) {
        const similarity = calculateSimilarity(caseData, duplicateData);
        
        const timeDiff = Math.abs(
          caseData.createdAt.toDate().getTime() - duplicateData.createdAt.toDate().getTime()
        );

        duplicates.push({
          caseId: doc.id,
          similarity,
          distance,
          timeDiff
        });
      }
    }

    return duplicates.sort((a, b) => b.similarity - a.similarity);

  } catch (error) {
    console.error('Error finding potential duplicates:', error);
    return [];
  }
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function calculateSimilarity(case1: any, case2: any): number {
  let score = 0;
  let factors = 0;

  const titleSimilarity = calculateTextSimilarity(case1.title, case2.title);
  score += titleSimilarity * 30;
  factors += 30;

  const descSimilarity = calculateTextSimilarity(case1.description, case2.description);
  score += descSimilarity * 25;
  factors += 25;

  if (case1.category === case2.category) {
    score += 20;
  }
  factors += 20;

  if (case1.priority === case2.priority) {
    score += 10;
  }
  factors += 10;

  const distance = calculateDistance(
    case1.location.lat, case1.location.lng,
    case2.location.lat, case2.location.lng
  );
  const locationScore = Math.max(0, 15 - (distance / 10));
  score += locationScore;
  factors += 15;

  return factors > 0 ? score / factors : 0;
}

function calculateTextSimilarity(text1: string, text2: string): number {
  if (!text1 || !text2) return 0;

  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return union.size > 0 ? intersection.size / union.size : 0;
}

async function shouldMergeDuplicates(caseData: any, duplicates: any[]): Promise<boolean> {
  const highSimilarityDuplicates = duplicates.filter(d => 
    d.similarity > 0.9 && d.distance < 10
  );

  return highSimilarityDuplicates.length > 0;
}

async function mergeDuplicateCases(primaryCase: any, duplicates: any[]): Promise<void> {
  try {
    const batch = db.batch();

    const primaryRef = db.collection('cases').doc(primaryCase.caseId);
    
    const allMediaUrls = [primaryCase.mediaUrls || []];

    for (const duplicate of duplicates) {
      const duplicateDoc = await db.collection('cases').doc(duplicate.caseId).get();
      if (duplicateDoc.exists) {
        const duplicateData = duplicateDoc.data();
        allMediaUrls.push(duplicateData.mediaUrls || []);
      }
    }

    const mergedMediaUrls = [...new Set(allMediaUrls.flat())];

    batch.update(primaryRef, {
      mediaUrls: mergedMediaUrls,
      mergedFrom: duplicates.map(d => d.caseId),
      mergedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    for (const duplicate of duplicates) {
      const duplicateRef = db.collection('cases').doc(duplicate.caseId);
      batch.update(duplicateRef, {
        status: 'merged',
        mergedInto: primaryCase.caseId,
        mergedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

  } catch (error) {
    console.error('Error merging duplicate cases:', error);
    throw error;
  }
}

async function markAsPotentialDuplicates(primaryCase: any, duplicates: any[]): Promise<void> {
  try {
    const batch = db.batch();

    const primaryRef = db.collection('cases').doc(primaryCase.caseId);
    batch.update(primaryRef, {
      potentialDuplicates: duplicates.map(d => d.caseId),
      duplicateCheckAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    for (const duplicate of duplicates) {
      const duplicateRef = db.collection('cases').doc(duplicate.caseId);
      batch.update(duplicateRef, {
        potentialDuplicateOf: primaryCase.caseId,
        duplicateCheckAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    await batch.commit();

  } catch (error) {
    console.error('Error marking potential duplicates:', error);
    throw error;
  }
}

export const getDuplicateCases = async (caseId: string): Promise<any[]> => {
  try {
    const caseDoc = await db.collection('cases').doc(caseId).get();
    
    if (!caseDoc.exists) {
      throw new Error('Case not found');
    }

    const caseData = caseDoc.data();
    const duplicateIds = caseData.potentialDuplicates || [];

    if (duplicateIds.length === 0) {
      return [];
    }

    const duplicatesSnapshot = await db.collection('cases')
      .where(admin.firestore.FieldPath.documentId(), 'in', duplicateIds)
      .get();

    return duplicatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

  } catch (error) {
    console.error('Error getting duplicate cases:', error);
    return [];
  }
};
