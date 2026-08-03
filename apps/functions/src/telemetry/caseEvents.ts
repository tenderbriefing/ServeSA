/**
 * Structured telemetry for case lifecycle (no PII).
 */

type TelemetryPayload = Record<string, string | number | boolean | null | undefined>

export function logCaseTelemetry(event: string, payload: TelemetryPayload = {}): void {
  const line = {
    service: 'servesa-functions',
    event,
    ts: new Date().toISOString(),
    ...payload,
  }
  // Structured JSON for Cloud Logging
  console.log(JSON.stringify(line))
}
