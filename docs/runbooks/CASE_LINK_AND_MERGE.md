# Case Link and Merge Runbook

## Link
`reviewDuplicateFunction` with `decision: link_same_incident`, `targetCaseId`.

## Operational merge
`decision: merge_operational` — support case `operationalLocked`; work primary only.

## Unmerge / unlink
`unlinkCasesFunction` — manager/admin; restores standalone; audited.

## Safeguards
Cross-municipality denied. Source records and media retained. Citizen ownership preserved.
