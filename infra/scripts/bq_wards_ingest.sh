#!/usr/bin/env bash
# Thin wrapper — prefer infra/scripts/ward_gis_pipeline.py for governed ingestion.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
exec python3 "${ROOT}/infra/scripts/ward_gis_pipeline.py" "$@"
