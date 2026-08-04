import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  slaHours: number;
  priority: 'low' | 'medium' | 'high' | 'emergency';
  subcategories: ServiceSubcategory[];
  isActive: boolean;
  municipalitySpecific?: boolean;
}

interface ServiceSubcategory {
  id: string;
  name: string;
  description: string;
  slaHours?: number;
  priority?: 'low' | 'medium' | 'high' | 'emergency';
}

interface CategoryRequest {
  municipalityId?: string;
  includeInactive?: boolean;
}

/**
 * Get service categories
 */
export const getServiceCategories = async (data: CategoryRequest): Promise<{ categories: ServiceCategory[] }> => {
  try {
    const { municipalityId, includeInactive = false } = data;

    let query = db.collection('service_categories') as admin.firestore.Query;

    if (!includeInactive) {
      query = query.where('isActive', '==', true);
    }

    // Firestore Query.or is not available on all Admin SDK typings used here.
    // Fetch global + municipality-specific categories and merge.
    let categoriesSnapshot = await query.get();
    if (municipalityId) {
      let muniQuery: admin.firestore.Query = db.collection('service_categories')
        .where('municipalityId', '==', municipalityId);
      if (!includeInactive) {
        muniQuery = muniQuery.where('isActive', '==', true);
      }
      const [globalSnap, muniSnap] = await Promise.all([
        query.where('municipalitySpecific', '==', false).get(),
        muniQuery.get(),
      ]);
      const byId = new Map<string, admin.firestore.QueryDocumentSnapshot>();
      for (const doc of [...globalSnap.docs, ...muniSnap.docs]) {
        byId.set(doc.id, doc);
      }
      categoriesSnapshot = {
        empty: byId.size === 0,
        docs: Array.from(byId.values()),
      } as admin.firestore.QuerySnapshot;
    }

    if (categoriesSnapshot.empty) {
      // Return default categories if none found
      return { categories: getDefaultCategories() };
    }

    const categories = categoriesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as ServiceCategory[];

    return { categories };

  } catch (error) {
    console.error('Error getting service categories:', error);
    // Return default categories on error
    return { categories: getDefaultCategories() };
  }
};

/**
 * Get default service categories
 */
function getDefaultCategories(): ServiceCategory[] {
  return [
    {
      id: 'water-sewage',
      name: 'Water & Sewage',
      description: 'Water supply, leaks, sewage issues, and water quality problems',
      icon: '💧',
      slaHours: 24,
      priority: 'high',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'water-leak',
          name: 'Water Leak',
          description: 'Water leaking from pipes, taps, or infrastructure',
          slaHours: 4,
          priority: 'high'
        },
        {
          id: 'water-shortage',
          name: 'Water Shortage',
          description: 'No water supply or low water pressure',
          slaHours: 2,
          priority: 'emergency'
        },
        {
          id: 'sewage-blockage',
          name: 'Sewage Blockage',
          description: 'Blocked drains or sewage overflow',
          slaHours: 8,
          priority: 'high'
        },
        {
          id: 'water-quality',
          name: 'Water Quality',
          description: 'Discolored, smelly, or contaminated water',
          slaHours: 12,
          priority: 'high'
        }
      ]
    },
    {
      id: 'electricity',
      name: 'Electricity',
      description: 'Power outages, electrical hazards, and street lighting issues',
      icon: '⚡',
      slaHours: 4,
      priority: 'high',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'power-outage',
          name: 'Power Outage',
          description: 'Complete loss of electricity supply',
          slaHours: 2,
          priority: 'emergency'
        },
        {
          id: 'electrical-hazard',
          name: 'Electrical Hazard',
          description: 'Exposed wires, sparking, or electrical danger',
          slaHours: 1,
          priority: 'emergency'
        },
        {
          id: 'street-lighting',
          name: 'Street Lighting',
          description: 'Non-working street lights or lighting issues',
          slaHours: 48,
          priority: 'medium'
        },
        {
          id: 'power-fluctuation',
          name: 'Power Fluctuation',
          description: 'Inconsistent power supply or voltage issues',
          slaHours: 8,
          priority: 'high'
        }
      ]
    },
    {
      id: 'roads-infrastructure',
      name: 'Roads & Infrastructure',
      description: 'Road maintenance, potholes, traffic signs, and infrastructure issues',
      icon: '🛣️',
      slaHours: 72,
      priority: 'medium',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'pothole',
          name: 'Pothole',
          description: 'Road surface damage requiring repair',
          slaHours: 48,
          priority: 'medium'
        },
        {
          id: 'road-surface',
          name: 'Road Surface',
          description: 'General road surface deterioration',
          slaHours: 168,
          priority: 'low'
        },
        {
          id: 'traffic-signs',
          name: 'Traffic Signs',
          description: 'Missing, damaged, or unclear traffic signs',
          slaHours: 72,
          priority: 'medium'
        },
        {
          id: 'road-markings',
          name: 'Road Markings',
          description: 'Faded or missing road markings',
          slaHours: 120,
          priority: 'low'
        }
      ]
    },
    {
      id: 'waste-management',
      name: 'Waste Management',
      description: 'Garbage collection, recycling, and waste disposal issues',
      icon: '🗑️',
      slaHours: 48,
      priority: 'medium',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'garbage-collection',
          name: 'Garbage Collection',
          description: 'Missed garbage collection or collection issues',
          slaHours: 24,
          priority: 'medium'
        },
        {
          id: 'illegal-dumping',
          name: 'Illegal Dumping',
          description: 'Unauthorized waste dumping or littering',
          slaHours: 72,
          priority: 'low'
        },
        {
          id: 'waste-bins',
          name: 'Waste Bins',
          description: 'Damaged, missing, or overflowing waste bins',
          slaHours: 48,
          priority: 'medium'
        },
        {
          id: 'recycling',
          name: 'Recycling',
          description: 'Recycling collection or processing issues',
          slaHours: 72,
          priority: 'low'
        }
      ]
    },
    {
      id: 'digital-services',
      name: 'Digital Services',
      description: 'Online services, website issues, and digital infrastructure',
      icon: '💻',
      slaHours: 168,
      priority: 'low',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'website-issues',
          name: 'Website Issues',
          description: 'Municipal website not working or errors',
          slaHours: 48,
          priority: 'medium'
        },
        {
          id: 'online-services',
          name: 'Online Services',
          description: 'Online payment or service portal issues',
          slaHours: 72,
          priority: 'medium'
        },
        {
          id: 'digital-access',
          name: 'Digital Access',
          description: 'Public WiFi or digital access issues',
          slaHours: 168,
          priority: 'low'
        }
      ]
    },
    {
      id: 'emergency-services',
      name: 'Emergency Services',
      description: 'Urgent safety and emergency response issues',
      icon: '🚨',
      slaHours: 1,
      priority: 'emergency',
      isActive: true,
      municipalitySpecific: false,
      subcategories: [
        {
          id: 'safety-hazard',
          name: 'Safety Hazard',
          description: 'Immediate safety risk requiring urgent attention',
          slaHours: 1,
          priority: 'emergency'
        },
        {
          id: 'emergency-access',
          name: 'Emergency Access',
          description: 'Blocked emergency vehicle access',
          slaHours: 1,
          priority: 'emergency'
        },
        {
          id: 'public-safety',
          name: 'Public Safety',
          description: 'General public safety concerns',
          slaHours: 4,
          priority: 'high'
        }
      ]
    }
  ];
}

/**
 * Get category by ID
 */
export const getServiceCategory = async (categoryId: string): Promise<ServiceCategory | null> => {
  try {
    const categoryDoc = await db.collection('service_categories').doc(categoryId).get();
    
    if (!categoryDoc.exists) {
      // Check default categories
      const defaultCategories = getDefaultCategories();
      return defaultCategories.find(cat => cat.id === categoryId) || null;
    }

    return {
      id: categoryDoc.id,
      ...categoryDoc.data()
    } as ServiceCategory;

  } catch (error) {
    console.error('Error getting service category:', error);
    return null;
  }
};

/**
 * Create or update service category
 */
export const upsertServiceCategory = async (
  category: Omit<ServiceCategory, 'id'>,
  categoryId?: string
): Promise<{ success: boolean; categoryId?: string; error?: string }> => {
  try {
    if (categoryId) {
      // Update existing category
      await db.collection('service_categories').doc(categoryId).update({
        ...category,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, categoryId };
    } else {
      // Create new category
      const docRef = await db.collection('service_categories').add({
        ...category,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, categoryId: docRef.id };
    }

  } catch (error) {
    console.error('Error upserting service category:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Get category statistics
 */
export const getCategoryStatistics = async (municipalityId?: string): Promise<any> => {
  try {
    let query = db.collection('cases') as admin.firestore.Query;

    if (municipalityId) {
      query = query.where('location.municipalityId', '==', municipalityId);
    }

    const casesSnapshot = await query.get();
    const cases = casesSnapshot.docs.map(doc => doc.data());

    // Group by category
    const categoryStats = cases.reduce((acc, case_) => {
      const category = case_.category;
      if (!acc[category]) {
        acc[category] = {
          total: 0,
          resolved: 0,
          active: 0,
          slaBreaches: 0,
          averageResolutionTime: 0
        };
      }

      acc[category].total++;
      if (case_.status === 'resolved') acc[category].resolved++;
      if (['submitted', 'acknowledged', 'in_progress'].includes(case_.status)) {
        acc[category].active++;
      }
      if (case_.slaBreach) acc[category].slaBreaches++;

      return acc;
    }, {} as Record<string, any>);

    // Calculate resolution rates and average times
    Object.keys(categoryStats).forEach(category => {
      const stats = categoryStats[category];
      stats.resolutionRate = stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0;
      stats.slaBreachRate = stats.total > 0 ? (stats.slaBreaches / stats.total) * 100 : 0;
    });

    return categoryStats;

  } catch (error) {
    console.error('Error getting category statistics:', error);
    return {};
  }
};
