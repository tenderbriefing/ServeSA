/**
 * Dry-run legacy category normalisation for historical case documents.
 *
 * Usage:
 *   npx ts-node tools/migrations/normalize_case_categories.ts
 *   npx ts-node tools/migrations/normalize_case_categories.ts --apply
 *
 * Default is dry-run. Does not run automatically.
 */

import { mapUiCategoryToCanonical } from '../../packages/case-contract/src/categories'

type LegacyCase = {
  id: string
  category: string
  subcategory?: string
}

/** Sample legacy IDs observed in UI / seeds — replace with Firestore export in ops. */
const SAMPLE: LegacyCase[] = [
  { id: 'demo-1', category: 'water-sewage' },
  { id: 'demo-2', category: 'roads_infrastructure' },
  { id: 'demo-3', category: 'water' },
  { id: 'demo-4', category: 'digital-services' },
  { id: 'demo-5', category: 'unknown-old' },
]

function main() {
  const apply = process.argv.includes('--apply')
  const counts = {
    total: 0,
    mapped: 0,
    alreadyCanonical: 0,
    unmapped: 0,
  }

  const plan: Array<{ id: string; from: string; to: string; subcategory?: string }> = []

  for (const row of SAMPLE) {
    counts.total++
    const mapped = mapUiCategoryToCanonical(row.category)
    if (!mapped) {
      counts.unmapped++
      console.warn(`UNMAPPED ${row.id}: ${row.category}`)
      continue
    }
    if (row.category === mapped.category && !mapped.subcategory) {
      counts.alreadyCanonical++
      continue
    }
    counts.mapped++
    plan.push({
      id: row.id,
      from: row.category,
      to: mapped.category,
      subcategory: row.subcategory || mapped.subcategory,
    })
  }

  console.log('Normalisation plan counts:', counts)
  console.log('Changes:', plan)

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to write (not implemented against live DB in this script).')
    return
  }

  console.log(
    '--apply requested, but live Firestore writes are intentionally not automated. Export counts above and apply via reviewed ops job.'
  )
}

main()
