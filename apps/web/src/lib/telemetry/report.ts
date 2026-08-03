'use client'

/**
 * Client-side report telemetry — no PII.
 */

type Payload = Record<string, string | number | boolean | null | undefined>

export function trackReportEvent(event: string, payload: Payload = {}): void {
  if (typeof window === 'undefined') return
  const line = {
    service: 'servesa-web',
    event,
    ts: new Date().toISOString(),
    ...payload,
  }
  // Prefer analytics if present; always console for ops
  try {
    const w = window as any
    if (typeof w.gtag === 'function') {
      w.gtag('event', event, payload)
    }
  } catch {
    // ignore
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info('[report-telemetry]', line)
  }
}
