# ADR: Authoritative Ward GIS Sourcing and Boundary Semantics

- Status: Accepted
- Date: 2026-08-05
- Deciders: Serve SA Platform Architecture

## Context

Case routing must assign municipal wards without fabricating boundaries or guessing from addresses/centroids. Production previously returned `unresolved` / `routingPending=true` because `geo.wards` had zero polygons.

## Decision

1. **Authoritative source**: Municipal Demarcation Board (MDB) public ArcGIS item **MDB Wards 2020** (`SA_Wards2020` shapefile), ArcGIS item id `e0223a825ea2481fa72220ad3204276b`, FeatureServer `MDB_Wards_2020` (4 468 wards). This is the gazetted ward cycle used for the 2021 local government elections and remains the operational national ward layer until the 2026 delimitation becomes effective.

2. **Rejected for active production routing**: OCHA COD-AB ZAF admin4 (MDB-derived but 2016-cycle, 4 392 wards, obsolete relative to 2020/2021 LGE).

3. **Boundary semantics**: Production resolver uses BigQuery `ST_COVERS(polygon, point)`. Shared boundary points that cover multiple wards yield `ambiguous` with `routingPending=true` — never an arbitrary first-row pick.

4. **Fail-safe**: Unique `polygon_match` only clears `routingPending`. No nearest-centroid authoritative assignment.

5. **Provenance**: Raw shapefile stored privately at `gs://servesa-aad53-gis-sources/...` with SHA-256, version row in `geo.ward_dataset_versions`, validation report under `docs/reports/gis/`.

## Consequences

- Routing becomes authoritative for points inside a single certified ward polygon.
- Ambiguous/no-match/infra failures keep cases creatable with pending routing.
- 2026 MDB draft wards must not be promoted until gazette/effective date is confirmed.
