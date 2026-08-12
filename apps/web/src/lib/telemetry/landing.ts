'use client'

/**
 * Public landing funnel telemetry — no PII.
 * Reuses the same gtag path as report/planning telemetry.
 */

type Payload = Record<string, string | number | boolean | null | undefined>

export function trackLandingEvent(event: string, payload: Payload = {}): void {
  if (typeof window === 'undefined') return
  const line = {
    service: 'servesa-web',
    surface: 'landing',
    event,
    ts: new Date().toISOString(),
    ...payload,
  }
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void }
    if (typeof w.gtag === 'function') {
      w.gtag('event', event, payload)
    }
  } catch {
    // ignore analytics failures
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info('[landing-telemetry]', line)
  }
}
