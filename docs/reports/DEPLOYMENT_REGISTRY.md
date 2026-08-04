# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-04T21:15:00Z |
| Verdict | PASS WITH CONDITIONS |
| Project | servesa-aad53 |
| Hosting | https://servesa-aad53.web.app (`/report` live, static Next export) |
| Functions region | africa-south1 (Gen2); schedulers europe-west1 |
| createCase | ACTIVE (`createcasefunction-00002-wif` family) |
| Storage bucket | servesa-aad53.firebasestorage.app (AFRICA-SOUTH1) |
| Storage ruleset | ffaa80b8-1070-4415-9ff0-abd4ff21457a |
| BQ | servesa-aad53.geo.wards (0 rows — polygons pending) |
| SERVICE_ACCOUNT CI | PASS (firebase-adminsdk-fbsvc@servesa-aad53) |
| Smoke case | CASE-MSF4EWJK-XR0COE |
| Cert report | docs/reports/CASE_CREATION_PRODUCTION_CERTIFICATION.md |
