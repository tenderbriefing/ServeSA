/**
 * Department routing AFTER authoritative municipality GIS resolution.
 * Never guesses municipality. Unresolved/ambiguous → triage only.
 */

import { getFirestore } from 'firebase-admin/firestore'

const db = getFirestore()

export type DepartmentRoutingResult = {
  triageQueue: boolean
  assignedDepartment: string | null
  departmentName: string | null
  departmentRoutingStatus:
    | 'mapped'
    | 'triage_unmapped'
    | 'triage_routing_pending'
    | 'triage_ambiguous'
  mappingSource: 'category_map' | 'none'
}

export async function resolveDepartmentRouting(input: {
  georesolutionStatus: string
  municipalityId: string | null
  category: string
}): Promise<DepartmentRoutingResult> {
  const { georesolutionStatus, municipalityId, category } = input

  if (georesolutionStatus === 'ambiguous') {
    return {
      triageQueue: true,
      assignedDepartment: null,
      departmentName: null,
      departmentRoutingStatus: 'triage_ambiguous',
      mappingSource: 'none',
    }
  }

  if (georesolutionStatus !== 'polygon_match' || !municipalityId) {
    return {
      triageQueue: true,
      assignedDepartment: null,
      departmentName: null,
      departmentRoutingStatus: 'triage_routing_pending',
      mappingSource: 'none',
    }
  }

  const mapRef = db
    .collection('municipalities')
    .doc(municipalityId)
    .collection('category_department_map')
    .doc(category)
  const mapDoc = await mapRef.get()
  if (!mapDoc.exists) {
    return {
      triageQueue: true,
      assignedDepartment: null,
      departmentName: null,
      departmentRoutingStatus: 'triage_unmapped',
      mappingSource: 'none',
    }
  }

  const data = mapDoc.data() || {}
  const departmentId = String(data.departmentId || '')
  if (!departmentId) {
    return {
      triageQueue: true,
      assignedDepartment: null,
      departmentName: null,
      departmentRoutingStatus: 'triage_unmapped',
      mappingSource: 'none',
    }
  }

  const deptDoc = await db
    .collection('municipalities')
    .doc(municipalityId)
    .collection('departments')
    .doc(departmentId)
    .get()

  return {
    triageQueue: false,
    assignedDepartment: departmentId,
    departmentName: deptDoc.exists
      ? String(deptDoc.data()?.name || departmentId)
      : String(data.departmentName || departmentId),
    departmentRoutingStatus: 'mapped',
    mappingSource: 'category_map',
  }
}
