'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { OpsShell } from '@/components/ops/OpsShell'
import { useAuth } from '@/components/providers/AuthProvider'
import { planningApi } from '@/lib/api/planning'
import { Button } from '@/components/ui/Button'
import {
  FEATURE_FLAGS,
  isMunicipalPublishingEnabledFor,
} from '@/lib/constants'
import {
  PLAN_DOCUMENT_KIND_LABEL,
  type PlanDocumentKind,
} from '@servesa/case-contract'

const KINDS = Object.keys(PLAN_DOCUMENT_KIND_LABEL) as PlanDocumentKind[]

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unable to read file'))
        return
      }
      const base64 = result.includes(',') ? result.split(',')[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error || new Error('Read failed'))
    reader.readAsDataURL(file)
  })
}

export default function UploadPlanningDocumentPage() {
  const router = useRouter()
  const { municipalityCode } = useAuth()
  const muni = municipalityCode?.trim() || null
  const enabled = muni ? isMunicipalPublishingEnabledFor(muni) : false
  const [kind, setKind] = useState<PlanDocumentKind>('idp')
  const [title, setTitle] = useState('')
  const [fiscalYear, setFiscalYear] = useState('2026/27')
  const [officialUrl, setOfficialUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!muni) {
    return (
      <OpsShell>
        <div className="mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-ink-muted">
            Municipality claim required for document upload.
          </p>
        </div>
      </OpsShell>
    )
  }

  if (!FEATURE_FLAGS.enableMunicipalPublishingEngine || !enabled) {
    return (
      <OpsShell>
        <div className="mx-auto max-w-xl px-4 py-10">
          <p className="text-sm text-ink-muted">Publishing engine not enabled.</p>
          <Button asChild className="mt-4" variant="outline">
            <Link href="/ops/planning/documents">Back</Link>
          </Button>
        </div>
      </OpsShell>
    )
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('Select a PDF or DOCX file')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const data = await fileToBase64(file)
      const res = (await planningApi.uploadDocument({
        municipalityCode: muni,
        kind,
        title,
        fiscalYear,
        officialUrl: officialUrl || null,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
          data,
        },
      })) as { documentId?: string }
      if (res.documentId) {
        await planningApi.processDocument({
          documentId: res.documentId,
          municipalityCode: muni,
        })
        router.push(`/ops/planning/documents/${res.documentId}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <OpsShell>
      <div className="mx-auto max-w-xl px-4 py-8">
        <h1 className="font-display text-2xl font-semibold text-ink">
          Upload official document
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          PDF or DOCX only. SHA-256 recorded for provenance. Saved as draft.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block text-sm">
            <span className="font-medium text-ink">Document type</span>
            <select
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={kind}
              onChange={(e) => setKind(e.target.value as PlanDocumentKind)}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {PLAN_DOCUMENT_KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Official title</span>
            <input
              required
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Financial / planning period</span>
            <input
              required
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Official source URL (optional)</span>
            <input
              type="url"
              className="mt-1 w-full rounded-md border border-border px-3 py-2"
              value={officialUrl}
              onChange={(e) => setOfficialUrl(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">Source file</span>
            <input
              required
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="mt-1 w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Uploading…' : 'Upload and process'}
            </Button>
            <Button asChild type="button" variant="outline">
              <Link href="/ops/planning/documents">Cancel</Link>
            </Button>
          </div>
        </form>
      </div>
    </OpsShell>
  )
}
