/**
 * Privacy-conscious municipal planning analytics (no PII).
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPlanningEvent(
  event:
    | 'municipal_planning_page_viewed'
    | 'municipal_planning_kpi_focused'
    | 'municipal_planning_priority_cta'
    | 'municipal_planning_project_opened'
    | 'municipal_planning_official_source_clicked'
    | 'municipal_planning_idea_cta'
    | 'municipal_planning_budget_explored',
  payload: Record<string, unknown> = {}
) {
  const body = {
    service: 'servesa-web',
    feature: 'municipal_planning',
    ...payload,
  }
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', event, body)
  }
  if (process.env.NODE_ENV !== 'production') {
    console.info('[planning-telemetry]', event, body)
  }
}
