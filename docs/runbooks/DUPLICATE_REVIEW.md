# Duplicate Review Runbook

1. Open Smart Work Queue → **Duplicate review** or case detail amber panel.
2. Compare images, distance, category, timestamps, reasons (no citizen contact unless needed).
3. Actions:
   - **Link as same incident** — preserves both cases; primary = target; public link notice once each (ledger-deduped).
   - **Keep separate** / **Dismiss** — audited.
   - **Flag image reuse** — anomaly for distant exact-hash abuse.
4. Never auto-merge. Operational merge only via explicit `merge_operational` decision.
5. Unlink: manager/admin → `unlinkCasesFunction`.
