# ADR — Image-led Duplicate Detection

## Status
Accepted — Operational Intelligence release

## Context
Citizen reports always include at least one image. Text/geo-only dedupe produces false positives for similar issues at different places and misses different-angle photos of the same incident.

## Decision
1. Durable case creation remains non-blocking for image intelligence.
2. After media store, async pipeline: SHA-256 → perceptual hash → bounded candidate retrieval → multi-signal score → recommendation only.
3. Image is the primary signal (weight 0.55); GPS, category, and time support.
4. Category-sensitive radii (policy `scoring_policy_version` 1.0.0).
5. Never auto-merge. Officials link / dismiss / flag reuse via audited callables.
6. GIS fields are never written by this pipeline.
7. No facial recognition or biometric attributes.
8. External multimodal AI deferred; deterministic hashes are the production path.

## Consequences
- Fail-open: intelligence failure does not block routing or acknowledgement.
- Exact hash distant reuse is flagged as anomaly, not auto-linked.
- Embeddings / Vision API remain optional future enhancement.
