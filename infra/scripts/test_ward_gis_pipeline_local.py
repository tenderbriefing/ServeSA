#!/usr/bin/env python3
"""Local ingestion unit tests (no live BigQuery)."""
import json
import tempfile
import unittest
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "infra" / "scripts"))
from ward_gis_pipeline import (  # noqa: E402
    sha256_file,
    validate_features,
    normalize_mdb_props,
    write_ndjson,
)


class WardIngestLocalTests(unittest.TestCase):
    def test_normalize_mdb_props(self):
        props = normalize_mdb_props(
            {
                "WardID": "79800060",
                "WardNo": 60,
                "WardLabel": "JHB_60",
                "CAT_B": "JHB",
                "Municipali": "City of Johannesburg Metropolitan Municipality",
                "Province": "Gauteng",
                "District": "City of Johannesburg",
                "DistrictCo": "JHB",
            }
        )
        self.assertEqual(props["ward_id"], "79800060")
        self.assertEqual(props["municipality_id"], "JHB")

    def test_missing_provenance_ids_rejected(self):
        features = [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [28.0, -26.0],
                            [28.1, -26.0],
                            [28.1, -26.1],
                            [28.0, -26.1],
                            [28.0, -26.0],
                        ]
                    ],
                },
                "properties": {"WardID": "X"},  # missing muni/province
            }
        ]
        rows, report = validate_features(features)
        self.assertEqual(len(rows), 0)
        self.assertGreater(report["error_count"], 0)

    def test_valid_polygon_accepted_and_checksum(self):
        features = [
            {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [28.0, -26.0],
                            [28.1, -26.0],
                            [28.1, -26.1],
                            [28.0, -26.1],
                            [28.0, -26.0],
                        ]
                    ],
                },
                "properties": {
                    "WardID": "79800060",
                    "WardNo": 60,
                    "WardLabel": "JHB_60",
                    "CAT_B": "JHB",
                    "Municipali": "City of Johannesburg Metropolitan Municipality",
                    "Province": "Gauteng",
                    "DistrictCo": "JHB",
                    "District": "City of Johannesburg",
                },
            }
        ]
        rows, report = validate_features(features)
        self.assertEqual(len(rows), 1)
        self.assertEqual(report["error_count"], 0)
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "t.ndjson"
            write_ndjson(rows, path, "test-v1", "2020-LGE", "test")
            self.assertTrue(path.exists())
            digest = sha256_file(path)
            self.assertEqual(len(digest), 64)

    def test_duplicate_ward_rejected(self):
        feat = {
            "type": "Feature",
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [[28.0, -26.0], [28.1, -26.0], [28.1, -26.1], [28.0, -26.1], [28.0, -26.0]]
                ],
            },
            "properties": {
                "WardID": "1",
                "CAT_B": "JHB",
                "Municipali": "JHB",
                "Province": "Gauteng",
            },
        }
        rows, report = validate_features([feat, json.loads(json.dumps(feat))])
        self.assertEqual(len(rows), 1)
        self.assertGreaterEqual(report["error_count"], 1)


if __name__ == "__main__":
    unittest.main()
