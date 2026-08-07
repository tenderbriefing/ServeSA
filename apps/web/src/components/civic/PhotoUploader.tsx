'use client'

import { Camera, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type PhotoUploaderProps = {
  photos: File[]
  onChange: (files: File[]) => void
  maxFiles?: number
  className?: string
  inputId?: string
  testId?: string
}

/**
 * Citizen photo capture UX — "Add a photo of the issue".
 * Does not change upload/validation contracts; UI only.
 */
export function PhotoUploader({
  photos,
  onChange,
  maxFiles = 5,
  className,
  inputId = 'photo-upload',
  testId = 'photo-upload',
}: PhotoUploaderProps) {
  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((f) => {
      const okType = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ].includes(f.type)
      return okType && f.size > 0 && f.size <= 10 * 1024 * 1024
    })
    onChange([...photos, ...files].slice(0, maxFiles))
    event.target.value = ''
  }

  const removeAt = (index: number) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  return (
    <div className={cn('space-y-3', className)}>
      <label className="text-label block text-ink" htmlFor={inputId}>
        Add a photo of the issue <span className="text-danger">*</span>
      </label>
      <div className="rounded-lg border-2 border-dashed border-border bg-surface-muted/40 p-6 text-center">
        <Upload className="mx-auto mb-2 h-8 w-8 text-ink-subtle" aria-hidden />
        <p className="mb-1 text-body-sm font-medium text-ink">
          Clear photos help officials act faster
        </p>
        <p className="mb-4 text-body-sm text-ink-muted">
          At least one photo is required. Up to {maxFiles} images (JPEG, PNG,
          WebP or HEIC), max 10MB each. Your case is saved first, then photos
          upload securely.
        </p>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          onChange={handleUpload}
          className="hidden"
          id={inputId}
          data-testid={testId}
          required
        />
        <label htmlFor={inputId} className="inline-block cursor-pointer">
          <span className="inline-flex min-h-touch items-center rounded-md border border-primary-200 bg-surface px-4 py-2 text-sm font-medium text-primary-800 hover:bg-primary-50">
            <Camera className="mr-2 h-4 w-4" aria-hidden />
            Add a photo of the issue
          </span>
        </label>
      </div>
      {photos.length > 0 ? (
        <ul className="flex flex-wrap gap-2" aria-label="Selected photos">
          {photos.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-body-sm"
            >
              <span className="max-w-[160px] truncate">{file.name}</span>
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-muted hover:bg-danger-tint hover:text-danger"
                aria-label={`Remove ${file.name}`}
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-body-sm text-warning">
          Add at least one clear photo of the issue to submit.
        </p>
      )}
    </div>
  )
}
