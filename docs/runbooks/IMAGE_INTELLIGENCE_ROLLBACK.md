# Image Intelligence Rollback

1. Disable trigger path: redeploy `uploadMediaFunction` without `runImageIntelligenceForMedia` call (or feature-flag env if added).
2. Do **not** rollback GIS resolver.
3. Existing `duplicateReview` / `imageIntelligence` fields are advisory; leave in place.
4. Rollback hosting to previous release if UI-only issue.
5. Target: previous certified tip before this release (see DEPLOYMENT_REGISTRY).
