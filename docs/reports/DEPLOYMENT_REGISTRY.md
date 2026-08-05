# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T11:10:00Z |
| Verdict | PASS WITH CONDITIONS (Operational Intelligence + Field Productivity) |
| Project | servesa-aad53 |
| Branch | main |
| Starting SHA | `2316f2d4704e154d10af4ecf277f8833dc4c907f` |
| Deployed SHA | *(see git tip after OI commit)* |
| Hosting | https://servesa-aad53.web.app (`/report`, `/ops`, `/ops/map`, `/ops/supervisor`, `/field`, `/case`) |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards) |
| GIS resolver revision | georesolvefunction-00002-kuy (**unchanged**) |
| createCase | createcasefunction-00005-goh |
| uploadMedia | uploadmediafunction-00004-duf |
| runImageIntelligence | runimageintelligencefunction-00002-zay |
| OI smoke primary | CASE-MSFZ5GAE-H8KDCP |
| OI smoke linked | CASE-MSFZ5H52-79EE5V |
| Ops baseline | CASE-MSFN98YW-0TQWX7 |
| Cert | docs/reports/OPERATIONAL_INTELLIGENCE_CERTIFICATION.md |
| Rollback tip | `2316f2d` + georesolvefunction-00002-kuy |

## Prior entries

| Date | Release | SHA | Notes |
|------|---------|-----|-------|
| 2026-08-05 | Municipality Ops MVP | 8b70884 / cert 2316f2d | /ops lifecycle |
| 2026-08-05 | Geospatial Routing | 062323d | mdb-wards-2020-v1 |
