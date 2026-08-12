/**
 * Extract plain text from official planning documents (PDF / DOCX).
 * Failures return null — original file remains accessible.
 */

import * as crypto from 'crypto'

export function computeSha256Hex(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; pageCount?: number } | null> {
  try {
    if (mimeType === 'application/pdf') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (
        data: Buffer
      ) => Promise<{ text: string; numpages?: number }>
      const parsed = await pdfParse(buffer)
      const text = (parsed.text || '').replace(/\s+/g, ' ').trim()
      if (!text) return null
      return { text, pageCount: parsed.numpages }
    }
    if (
      mimeType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mammoth = require('mammoth') as {
        extractRawText: (opts: {
          buffer: Buffer
        }) => Promise<{ value: string }>
      }
      const parsed = await mammoth.extractRawText({ buffer })
      const text = (parsed.value || '').replace(/\s+/g, ' ').trim()
      if (!text) return null
      return { text }
    }
    return null
  } catch {
    return null
  }
}

export function segmentText(text: string, maxSegment = 4000): string[] {
  if (text.length <= maxSegment) return [text]
  const segments: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + maxSegment, text.length)
    if (end < text.length) {
      const slice = text.slice(start, end)
      const lastBreak = Math.max(
        slice.lastIndexOf('. '),
        slice.lastIndexOf('\n')
      )
      if (lastBreak > maxSegment * 0.5) {
        end = start + lastBreak + 1
      }
    }
    segments.push(text.slice(start, end).trim())
    start = end
  }
  return segments.filter(Boolean)
}
