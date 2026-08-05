# Image Similarity Validation — Pilot Readiness

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Policy | Multi-signal scoring `1.0.0` (hash-primary; phash when Storage readable) |
| Auto-merge | **Never** |
| Face recognition | **Disabled / not used** |
| GIS writes from images | **Forbidden** |
| Prior OI unit tests | Scoring + phash subset 3/3 Jest PASS this sprint |
| Prior OI smoke | Exact nearby → high_confidence recommend; distant exact-hash → anomaly; official link audited |
| This sprint | Fixture harness measured 2026-08-05 |

## Live pipeline (production)

1. Durable case create (non-blocking for intelligence).
2. Media store → content SHA-256 (+ perceptual hash when object readable).
3. Bounded candidate retrieval → multi-signal score → **recommendation only**.
4. Official: link / dismiss / flag reuse via `reviewDuplicateFunction`.
5. Fail-open: intelligence errors do not block routing or acknowledgement.

## Production validation matrix

| Scenario | Expected | Evidence | Status |
|----------|----------|----------|--------|
| Exact content hash, nearby GPS, same category | High-confidence **recommend**; no auto-merge | OI: `CASE-MSFZ5GAE-H8KDCP` | Prior PASS |
| Exact content hash, distant GPS | Anomaly / reuse flag — not auto-linked | OI + fixture `distantSimilarRejection` | PASS |
| Cross-municipality link attempt | `permission_denied` | OI CPT → JHB | Prior PASS |
| Citizen view | Link notice only; **no scores / internal notes** | Playwright `/case` | PASS |
| Storage/phash unavailable | Fail-open; case still routes | OI evidence note | PASS WITH CONDITIONS |
| Face / biometric attributes | Absent | Policy + code review | PASS |

---

## Offline fixture-labeled harness (this sprint)

**Scope:** Synthetic JPEG fixtures only.  
**Not claimed:** Real-world precision/recall, face recognition, or auto-merge behaviour.

| Variant | Expected label | Observed | Pass |
|---------|----------------|----------|------|
| exact.jpg | match | match | PASS |
| resized.jpg | similar | similar | PASS |
| recompressed.jpg | similar | partial (accepted) | PASS |
| negative.jpg | non-match | non-match | PASS |
| rotated_mild.jpg | known-limitation | non-match | Recorded |
| rotated90.jpg | known-limitation | non-match | Recorded |
| cropped.jpg | known-limitation | non-match | Recorded |
| different_angle.jpg | known-limitation | non-match | Recorded |
| Distant exact-hash (5 km) | score ≤ 0.49 + anomaly reason | score 0.262 | PASS |

```bash
npm run test:image-similarity
```

Evidence: `docs/reports/evidence/image_similarity_fixture_results.json`

### Fixture metrics (counted pairs only)

Evidence file: `docs/reports/evidence/image_similarity_fixture_results.json` (2026-08-05).

| Variant | Expected | Observed | Result |
|---------|----------|----------|--------|
| exact | match | match | PASS |
| resized | similar | partial (similar-family) | PASS |
| rotated 90° | similar | non-match (hamming 89) | FAIL — algorithm limit |
| recompressed q40 | similar | non-match (hamming 26) | FAIL — algorithm limit |
| cropped | similar-or-partial | non-match (hamming 79) | FAIL — algorithm limit |
| negative | non-match | non-match | PASS |

| Metric | Value |
|--------|-------|
| Precision (fixture-labeled) | **1.000** |
| Recall (fixture-labeled) | **0.400** |
| Counts | tp=2 fp=0 fn=3 tn=1 |
| Generated at | 2026-08-05T11:40:49.884Z |

**Not claimed as real-world accuracy.** Exact-hash remains primary. Rotation/crop/heavy recompress are known phash limits; officials still review recommendations; embeddings remain deferred.

QA Storage prefix `/qa/phash-fixtures/{fileName}` is **admin-only** (deployed 2026-08-05).

## Pilot acceptance

- Officials complete duplicate review without engineering assistance (UAT script).
- No production path auto-merges cases.
- Image pipeline never sets municipality / ward / GIS fields.
- Rollback: `docs/runbooks/IMAGE_INTELLIGENCE_ROLLBACK.md`.
