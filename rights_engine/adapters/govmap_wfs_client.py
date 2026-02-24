"""
GovMap WFS Client — HTTP wrapper around Israel Survey of Israel open WFS.

Provides:
  - get_capabilities()         → dict of available layers
  - get_features_by_bbox()     → list of GeoJSON features in a bounding box
  - get_parcel_by_gush_helka() → single parcel feature or None
  - get_zoning_for_point()     → list of TABA features intersecting a point

Error handling:
  - HTTP 4xx/5xx → raises GovMapAPIError with status + body
  - Empty results → returns [] or None (no exception)
  - Timeout → raises GovMapAPIError with "timeout" message
"""

from __future__ import annotations

import xml.etree.ElementTree as ET
from typing import Optional

import requests

from rights_engine.config.govmap_config import (
    DEFAULT_CRS,
    DEFAULT_MAX_FEATURES,
    DEFAULT_OUTPUT_FORMAT,
    DEFAULT_TIMEOUT_SECONDS,
    DEFAULT_WFS_VERSION,
    GOVMAP_WFS_BASE,
    LAYER_PARCEL_ALL,
    PARCEL_FIELD_GUSH,
    PARCEL_FIELD_HELKA,
)


# ── Custom Exception ─────────────────────────────────────────


class GovMapAPIError(Exception):
    """Raised when GovMap WFS returns an error or is unreachable."""

    def __init__(self, message: str, status_code: int | None = None, body: str = ""):
        self.status_code = status_code
        self.body = body
        super().__init__(message)


# ── Shared Session ───────────────────────────────────────────

_session: requests.Session | None = None


def _get_session() -> requests.Session:
    """Lazy-init a requests.Session with default headers."""
    global _session
    if _session is None:
        _session = requests.Session()
        _session.headers.update({
            "Accept": "application/json, application/xml, */*",
            "User-Agent": "PropCheck/1.0 (statutory-engine)",
        })
    return _session


# ── Internal helpers ─────────────────────────────────────────


def _wfs_request(params: dict, timeout: int = DEFAULT_TIMEOUT_SECONDS) -> requests.Response:
    """
    Send a GET to GOVMAP_WFS_BASE with given params.
    Raises GovMapAPIError on HTTP errors or timeouts.
    """
    session = _get_session()
    try:
        resp = session.get(GOVMAP_WFS_BASE, params=params, timeout=timeout)
    except requests.exceptions.Timeout:
        raise GovMapAPIError("timeout", status_code=None, body="")
    except requests.exceptions.RequestException as e:
        raise GovMapAPIError(f"Network error: {e}", status_code=None, body="")

    if resp.status_code >= 400:
        raise GovMapAPIError(
            f"HTTP {resp.status_code}",
            status_code=resp.status_code,
            body=resp.text[:2000],
        )
    return resp


# ── Public API ───────────────────────────────────────────────


def get_capabilities() -> dict:
    """
    Fetch WFS GetCapabilities and parse available layers.

    Returns dict mapping layer name → title.
    Example: {"opendata:PARCEL_ALL": "חלקות", ...}
    """
    params = {
        "service": "WFS",
        "version": DEFAULT_WFS_VERSION,
        "request": "GetCapabilities",
    }
    resp = _wfs_request(params, timeout=60)

    ns = {
        "wfs": "http://www.opengis.net/wfs/2.0",
    }
    root = ET.fromstring(resp.text)
    feature_types = root.findall(".//wfs:FeatureType", ns)

    layers: dict[str, str] = {}
    for ft in feature_types:
        name_el = ft.find("wfs:Name", ns)
        title_el = ft.find("wfs:Title", ns)
        if name_el is not None and name_el.text:
            layers[name_el.text] = title_el.text if title_el is not None and title_el.text else ""

    return layers


def get_features_by_bbox(
    layer: str,
    lon_min: float,
    lat_min: float,
    lon_max: float,
    lat_max: float,
    max_features: int = DEFAULT_MAX_FEATURES,
) -> list[dict]:
    """
    WFS GetFeature with BBOX filter. Returns list of GeoJSON features.

    Coordinates are in EPSG:4326 (lon, lat).
    """
    params = {
        "service": "WFS",
        "version": DEFAULT_WFS_VERSION,
        "request": "GetFeature",
        "typeNames": layer,
        "outputFormat": DEFAULT_OUTPUT_FORMAT,
        "srsName": DEFAULT_CRS,
        "count": str(max_features),
        "BBOX": f"{lon_min},{lat_min},{lon_max},{lat_max},{DEFAULT_CRS}",
    }
    resp = _wfs_request(params)
    data = resp.json()
    return data.get("features", [])


def get_parcel_by_gush_helka(gush: str, helka: str) -> Optional[dict]:
    """
    Query PARCEL_ALL by gush number and helka (parcel) number.

    Returns the first matching GeoJSON feature, or None if not found.
    Geometry is returned in EPSG:4326 (WGS84).

    Field names used (verified via DescribeFeatureType 2026-02-24):
      GUSH_NUM (long), PARCEL (int)
    """
    cql = f"{PARCEL_FIELD_GUSH}={gush} AND {PARCEL_FIELD_HELKA}={helka}"
    params = {
        "service": "WFS",
        "version": DEFAULT_WFS_VERSION,
        "request": "GetFeature",
        "typeNames": LAYER_PARCEL_ALL,
        "outputFormat": DEFAULT_OUTPUT_FORMAT,
        "srsName": DEFAULT_CRS,
        "CQL_FILTER": cql,
        "count": "1",
    }
    resp = _wfs_request(params)
    data = resp.json()
    features = data.get("features", [])
    return features[0] if features else None


def get_parcels_by_locality_bbox(
    lon_min: float,
    lat_min: float,
    lon_max: float,
    lat_max: float,
    max_features: int = DEFAULT_MAX_FEATURES,
) -> list[dict]:
    """
    Convenience: get parcels from PARCEL_ALL within a bounding box.
    """
    return get_features_by_bbox(
        LAYER_PARCEL_ALL, lon_min, lat_min, lon_max, lat_max, max_features
    )


def get_zoning_for_point(lon: float, lat: float) -> list[dict]:
    """
    Query TABA_RECORD layer for zoning plans intersecting a point.

    NOTE: As of 2026-02-24, TABA_RECORD is NOT available in the open
    GovMap WFS. This function returns an empty list and logs a warning.
    Zoning plan data must come from Mavat (iplan.gov.il) instead.
    """
    # TABA_RECORD layer does not exist in open WFS.
    # When/if it becomes available, the query would be:
    #   CQL_FILTER=INTERSECTS(geometry, POINT({lon} {lat}))
    return []
