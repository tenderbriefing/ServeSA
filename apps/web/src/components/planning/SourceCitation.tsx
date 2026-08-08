import type { SourceReference } from '@servesa/case-contract'
import { PLAN_DOCUMENT_KIND_LABEL } from '@servesa/case-contract'

export function SourceCitation({
  source,
}: {
  source: SourceReference | null | undefined
}) {
  if (!source) {
    return (
      <p className="text-xs text-ink-subtle">Source: Not published yet</p>
    )
  }

  const kindLabel =
    PLAN_DOCUMENT_KIND_LABEL[source.documentKind] || source.documentKind

  return (
    <p className="text-xs text-ink-subtle">
      <span className="font-medium text-ink-muted">Source:</span> {source.title}
      {' · '}
      {kindLabel}
      {source.pageOrSection ? ` · ${source.pageOrSection}` : null}
      {source.isServeSaSummary ? (
        <span className="ml-1 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-ink-muted">
          ServeSA plain-language summary
        </span>
      ) : null}
      {source.url ? (
        <>
          {' · '}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-700 underline-offset-2 hover:underline"
          >
            Official document
          </a>
        </>
      ) : null}
    </p>
  )
}

export function ServeSaSummaryBanner({ show }: { show: boolean }) {
  if (!show) return null
  return (
    <p
      className="rounded-md border border-border bg-surface-muted px-3 py-2 text-xs text-ink-muted"
      role="note"
    >
      This explanation is a ServeSA plain-language summary. It is not the
      original municipal wording. Always check the linked official source.
    </p>
  )
}
