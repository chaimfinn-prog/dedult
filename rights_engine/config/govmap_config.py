"""
GovMap WFS/WMS Configuration — Discovered via GetCapabilities on 2026-02-24.

Base endpoint:
  https://open.govmap.gov.il/geoserver/opendata/wfs

Available layers (7 total from GetCapabilities):
  opendata:PARCEL_ALL         חלקות (WGS84)
  opendata:Parcels_ITM        חלקות (ITM)
  opendata:SUB_GUSH_ALL       גושים (WGS84)
  opendata:SUB_GUSH_ALL_ITM   גושים (ITM)
  opendata:muni_il            רשויות מוניציפאליות
  opendata:Nikuz              אגני ניקוז
  opendata:nechalim1          נחלים

NOT available in open WFS:
  - TABA_RECORD / zoning boundaries
  - METRO_STATIONS
  - Heritage / preservation polygons
  - RATA height-cone polygons
"""

# ── WFS / WMS Base URLs ─────────────────────────────────────

GOVMAP_WFS_BASE = "https://open.govmap.gov.il/geoserver/opendata/wfs"
GOVMAP_WMS_BASE = "https://open.govmap.gov.il/geoserver/opendata/wms"

# ── Layer Names (verified via GetCapabilities 2026-02-24) ────

LAYER_PARCEL_ALL = "opendata:PARCEL_ALL"         # Parcels in WGS84
LAYER_PARCEL_ITM = "opendata:Parcels_ITM"         # Parcels in ITM
LAYER_GUSH_ALL = "opendata:SUB_GUSH_ALL"          # Blocks in WGS84
LAYER_GUSH_ALL_ITM = "opendata:SUB_GUSH_ALL_ITM"  # Blocks in ITM
LAYER_MUNICIPALITIES = "opendata:muni_il"          # Municipal boundaries

# These layers do NOT exist in open WFS — kept for documentation:
# LAYER_TABA_BOUNDARIES = "opendata:TABA_RECORD"   # NOT AVAILABLE
# LAYER_METRO_STATIONS = "opendata:METRO_STATIONS"  # NOT AVAILABLE

# ── PARCEL_ALL Field Names (from DescribeFeatureType) ────────
# Verified 2026-02-24:
#   GUSH_NUM    (long)  — Block number
#   PARCEL      (int)   — Parcel number within block
#   LEGAL_AREA  (double)— Registered legal area (sqm)
#   LOCALITY_N  (str)   — City/locality name in Hebrew
#   LOCALITY_I  (long)  — Locality ID
#   COUNTY_NAM  (str)   — County name
#   REGION_NAM  (str)   — Region name
#   STATUS_TEX  (str)   — Registration status text
#   the_geom    (MultiSurface) — Parcel geometry

PARCEL_FIELD_GUSH = "GUSH_NUM"
PARCEL_FIELD_HELKA = "PARCEL"
PARCEL_FIELD_LEGAL_AREA = "LEGAL_AREA"
PARCEL_FIELD_LOCALITY = "LOCALITY_N"
PARCEL_FIELD_GEOM = "the_geom"

# ── Request Defaults ─────────────────────────────────────────

DEFAULT_CRS = "EPSG:4326"
DEFAULT_OUTPUT_FORMAT = "application/json"
DEFAULT_WFS_VERSION = "2.0.0"
DEFAULT_TIMEOUT_SECONDS = 30
DEFAULT_MAX_FEATURES = 50
