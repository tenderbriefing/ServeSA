# Municipal Publishing Engine

AI-assisted workflow for municipal officials: **Upload → Review → Approve → Publish**.

## Principles

- AI never auto-publishes
- Every figure must trace to an uploaded official document (SHA-256)
- Citizens see **published** content only
- Extraction failure does not block access to the original upload

## Feature flag

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE` | `false` | Master switch |
| `NEXT_PUBLIC_MUNICIPAL_PUBLISHING_ALLOWLIST` | empty (= all when flag on) | Pilot municipality codes |

## Ops routes

| Route | Purpose |
|-------|---------|
| `/ops/planning/documents` | Document list + editorial dashboard counts |
| `/ops/planning/documents/upload` | Upload official PDF/DOCX |
| `/ops/planning/documents/[documentId]` | Side-by-side review |

## Lifecycle

```
uploaded → processing → draft_generated → under_review → approved → published
                      ↘ extraction_failed (source file retained)
```

Publication status (existing contract): `draft → awaiting_review → verified → published`.

Blocked: `draft_generated → published` without review/approval.

## Callables

| Function | Role |
|----------|------|
| `uploadPlanningDocumentFunction` | Editor — upload + SHA-256 |
| `processPlanningDocumentFunction` | Editor — extract + conservative draft |
| `updatePlanningAiDraftFunction` | Editor — manual edits |
| `approvePlanningDocumentFunction` | Editor — mark verified |
| `publishPlanningDocumentFunction` | Publisher — copy to public storage path |
| `getPlanningPublishingDashboardFunction` | Editor — governance counts |
| `getPlanningDocumentSourceUrlFunction` | Editor — signed URL for source |

## Storage layout

```
municipal_planning/{muniCode}/documents/{docId}/{file}   # private — Admin SDK only
municipal_planning/{muniCode}/processing/{docId}/...     # private extracted text
municipal_planning/{muniCode}/published/{docId}/{file}   # public read when published
```

## AI safeguards

- Conservative rule-based extractor (`servesa-conservative-extractor`) — no internet
- Amounts only when regex matches source text; `verificationStatus: needs_review`
- Missing data → `null` or `not_generated`
- Optional Vertex upgrade later — must preserve provenance model

## Citizen integration

`/municipality` renders published modules and lists official source documents with links.

## Staff quick guide

1. **Upload** official PDF/DOCX at `/ops/planning/documents/upload`
2. **Review** AI draft; edit JSON or regenerate section
3. **Approve** when verified against source
4. **Publish** (publisher role) — citizens see sources on `/municipality`

## Rollback

1. Set `NEXT_PUBLIC_ENABLE_MUNICIPAL_PUBLISHING_ENGINE=false`
2. Unpublish documents via existing `transitionPlanningStatusFunction` → `archived`
3. Redeploy hosting; functions remain but UI hidden

See also: `docs/architecture/ADR_MUNICIPAL_PLANNING.md`, `docs/pilot/PRODUCTION_PILOT_UAT_CHECKLIST.md`
