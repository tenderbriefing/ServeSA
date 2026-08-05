# Deployment Registry — Serve SA

| Field | Value |
|-------|-------|
| Updated (UTC) | 2026-08-05T05:30:00Z |
| Verdict | PASS WITH CONDITIONS (Ops MVP + GIS routing) |
| Project | servesa-aad53 |
| Branch | main |
| Deployed SHA | `8b7088406357867973fd6429eb3c7be94c0ef6c8` |
| Hosting | https://servesa-aad53.web.app (`/report`, `/ops`) |
| Functions region | africa-south1 (Gen2) |
| GIS dataset | mdb-wards-2020-v1 (4468 wards) |
| Ops smoke case | CASE-MSFN98YW-0TQWX7 |
| GIS resolved smoke | CASE-MSFMCCIU-JN1FTG |
| Certs | docs/reports/MUNICIPALITY_OPERATIONS_CERTIFICATION.md ; docs/reports/GEOSPATIAL_ROUTING_CERTIFICATION.md |
| Rollback GIS | geo.wards_previous |
| Rollback createCase tip | createcasefunction-00003-qem (pre-ops) → redeploy from `062323d` if required |
