# Image Similarity Validation — Pilot Readiness

| Field | Value |
|-------|-------|
| Project | `servesa-aad53` |
| Policy | Multi-signal scoring `1.0.0` (hash-primary; phash when Storage readable) |
| Auto-merge | **Never** |
| Face recognition | **Disabled / not used** |
| GIS writes from images | **Forbidden** |
| Fixture evidence | `docs/reports/evidence/image_similarity_fixture_results.json` |
| Jest subset | `imageDuplicate.phash.fixture.test.ts` — 3/3 PASS |
| Measured (UTC) | 2026-08-05T11:40:49Z |

## Disclaimer

Fixture-labeled precision/recall only. **NOT** claimed real-world accuracy.

## Offline fixture outcomes (this sprint)

| Variant | Expected | Observed | Result |
|---------|----------|----------|--------|
| exact.jpg | match | match (exactHash, hamming 0) | **PASS** |
| resized.jpg | similar | partial (hamming 11, visual 0.542) | **PASS** (accepted as partial under similar policy) |
| rotated90.jpg | similar | non-match (hamming 89) | **KNOWN LIMITATION** |
| recompressed.jpg | similar | non-match (hamming 26) | **KNOWN LIMITATION** |
| cropped.jpg | similar-or-partial | non-match (hamming 79) | **KNOWN LIMITATION** |
| negative.jpg | non-match | non-match (hamming 81) | **PASS** |

Fixture precision = **1.000** · recall = **0.400** (tp=2 fp=0 fn=3 tn=1) — honest under current phash; exact + resize viable; rotation/crop/heavy recompress not relied upon for pilot.

## Production path (prior OI)

Exact nearby hash → high-confidence recommend; no auto-merge; citizen surfaces hide scores.

## Storage access for phash verification

`/qa/phash-fixtures/{fileName}` — admin-only; not public. Runtime phash uses Functions SA download / signed mediation.
