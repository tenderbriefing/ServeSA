# ADR: Community Engagement (Municipal Updates + Ideas)

- Status: Accepted
- Date: 2026-08-08

## Context

ServeSA is a certified report-and-resolve platform. Municipalities and citizens also need **two-way civic engagement** without becoming a social network: verified municipal communications and constructive community ideas.

## Decisions

1. **Three civic intents:** Report an Issue, Municipal Updates, Community Ideas (plus Track / My Cases). No open forums, likes/dislikes, followers, or unrestricted public comments.
2. **Collections:** `municipal_updates`, `community_ideas` (+ `supports`, `internal_notes`), event/audit collections. All privileged writes via Admin SDK callables only.
3. **Municipality identity for writes** always comes from JWT custom claims (`municipalityCode`), never trusted from the client alone.
4. **RBAC:** `comms_editor` / `comms_publisher` claims plus existing `official` / `moderator` / `admin`. Field workers cannot edit communications.
5. **Notifications:** In-app ledger first; push/email callables are **admin-only**. Ordinary clients cannot invoke `sendPushNotificationFunction` / `sendEmailNotificationFunction`.
6. **Insights:** Deterministic Firestore aggregates with explicit provenance — no predictive AI.
7. **GIS / case loop unchanged.** Community modules do not invent municipalities or weaken georesolution.

## Consequences

- New Firestore indexes for updates/ideas queries.
- OpsShell gains **Community** workspace (`/ops/community`).
- Citizen shell gains `/updates` and `/ideas`.
- Security audit findings (media ownership, notification callables, profile role forge, PDF auth, thumbnail public read, analytics/dedupe gating) are remediated as prerequisites.
