/**
 * Municipal publishing engine analytics — no PII.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPublishingEvent(
  event:
    | 'planning_document_uploaded'
    | 'planning_document_processed'
    | 'ai_draft_generated'
    | 'ai_draft_reviewed'
    | 'planning_content_approved'
    | 'planning_content_published'
    | 'municipality_page_viewed'
    | 'planning_module_viewed'
    | 'source_document_opened',
  payload: Record<string, unknown> = {}
) {
  const body = {
    service: 'servesa-web',
    feature: 'municipal_publishing',
    ...payload,
  }
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, body)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info('[publishing-telemetry]', event, body)
  }
}
