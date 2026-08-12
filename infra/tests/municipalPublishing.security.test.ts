/**
 * Municipal publishing engine security intent tests.
 */

import fs from 'fs'
import path from 'path'

const storageRules = fs.readFileSync(
  path.join(__dirname, '../storage.rules'),
  'utf8'
)

function canPublishFromDraft(processingStatus: string, publicationStatus: string) {
  if (processingStatus === 'draft_generated') return false
  if (processingStatus !== 'approved' && publicationStatus !== 'verified') {
    return false
  }
  return publicationStatus === 'verified' || processingStatus === 'approved'
}

function citizenCanReadStoragePath(storagePath: string) {
  if (storagePath.includes('/documents/')) return false
  if (storagePath.includes('/processing/')) return false
  if (storagePath.includes('/published/')) return true
  return false
}

describe('municipal publishing — storage rules intent', () => {
  it('denies client access to private document and processing prefixes', () => {
    expect(storageRules).toMatch(
      /match \/municipal_planning\/\{muniCode\}\/documents\//
    )
    expect(storageRules).toMatch(
      /match \/municipal_planning\/\{muniCode\}\/processing\//
    )
    expect(storageRules).toMatch(
      /match \/municipal_planning\/\{muniCode\}\/published\//
    )
    const documentsBlock = storageRules.slice(
      storageRules.indexOf('match /municipal_planning/{muniCode}/documents/')
    )
    expect(documentsBlock).toMatch(/allow read, write: if false/)
  })

  it('allows public read only on published prefix', () => {
    const publishedBlock = storageRules.slice(
      storageRules.indexOf('match /municipal_planning/{muniCode}/published/')
    )
    expect(publishedBlock).toMatch(/allow read: if true/)
    expect(publishedBlock).toMatch(/allow write: if false/)
  })
})

describe('municipal publishing — human-in-the-loop', () => {
  it('denies publish from unapproved AI draft', () => {
    expect(canPublishFromDraft('draft_generated', 'awaiting_review')).toBe(false)
    expect(canPublishFromDraft('under_review', 'awaiting_review')).toBe(false)
  })

  it('allows publish only after approval/verified state', () => {
    expect(canPublishFromDraft('approved', 'verified')).toBe(true)
    expect(canPublishFromDraft('draft_generated', 'verified')).toBe(false)
  })
})

describe('municipal publishing — citizen storage access model', () => {
  it('citizens cannot read private source paths', () => {
    expect(
      citizenCanReadStoragePath(
        'municipal_planning/JHB/documents/DOC-1/idp.pdf'
      )
    ).toBe(false)
    expect(
      citizenCanReadStoragePath(
        'municipal_planning/JHB/processing/DOC-1/extract.txt'
      )
    ).toBe(false)
  })

  it('citizens may read explicitly published paths only', () => {
    expect(
      citizenCanReadStoragePath(
        'municipal_planning/JHB/published/DOC-1/idp.pdf'
      )
    ).toBe(true)
  })
})
