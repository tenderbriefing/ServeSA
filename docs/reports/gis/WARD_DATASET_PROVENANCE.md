# Dataset provenance — MDB Wards 2020

| Field | Value |
|-------|-------|
| Publisher | Municipal Demarcation Board (MDB) |
| ArcGIS owner | `MDBUser1` |
| Dataset title | MDB Wards 2020 |
| Shapefile internal name | `SA_Wards2020` |
| ArcGIS item id | `e0223a825ea2481fa72220ad3204276b` |
| FeatureServer | https://services7.arcgis.com/oeoyTUJC8HEeYsRB/arcgis/rest/services/MDB_Wards_2020/FeatureServer/0 |
| Item URL | https://www.arcgis.com/home/item.html?id=e0223a825ea2481fa72220ad3204276b |
| Access | public |
| Boundary cycle | 2020-LGE (gazetted wards for 2021 LGE) |
| Feature date field sample | 2020-11-24 |
| CRS | GCS_WGS_1984 (EPSG:4326) |
| Geometry | Polygon |
| Row count | 4468 |
| Provinces | 9 |
| Municipalities (CAT_B) | 213 |
| Ward identifier field | `WardID` |
| Municipality code field | `CAT_B` |
| Licence on ArcGIS item | `licenseInfo` empty; public MDB Spatial Knowledge Hub publication — **attribution to Municipal Demarcation Board required** |
| Raw SHA-256 | `5206e877d08b428bb3136b1a41dd4fe54cd8b49a97f457764bbdd3b664b3c036` |
| Private GCS URI | `gs://servesa-aad53-gis-sources/mdb/wards_2020/MDB_Wards_2020_shapefile.zip` |
| ServeSA dataset_version | `mdb-wards-2020-v1` |
| Importer version | `1.0.0` |
| Validation report | `docs/reports/gis/ward_validation_mdb_wards_2020.json` |

## Rejected candidates

| Source | Reason |
|--------|--------|
| HDX COD-AB ZAF admin4 | MDB-origin but 2016 cycle (4392 wards); obsolete vs 2020 LGE |
| Provincial gazette PDF ZIPs on demarcation.org.za | Not GIS polygons |
| MDB Wards 2026 FeatureServers | Draft/future cycle; not effective for current routing |
| IEC GIS Ward API | Unreliable (500 on probe); not bulk authoritative polygons |
