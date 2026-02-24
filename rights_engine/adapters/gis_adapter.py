"""
GIS Adapter — Interface for spatial queries.

In production, this would query PostGIS, a shapefile server, or the Israeli
Cadastre (MAPI) API.  For now, all methods return **deterministic fake data**
based on simple parcel_id conventions so the pipeline can be tested end-to-end.

Stub conventions (for testing):
  - parcel_id ending with "A"  → Metro core (80 m from station)
  - parcel_id ending with "B"  → Metro ring 1 (200 m)
  - parcel_id ending with "C"  → Metro ring 2 (600 m)
  - anything else              → outside Metro influence
  - parcel_id containing "RATA" → has RATA height-cone layer
  - parcel_id containing "PRES" → has strict-preservation layer
"""

from __future__ import annotations

from typing import List, Optional

from rights_engine.domain.models import (
    ComplexType,
    MetroZone,
    ParcelInput,
)


# ─── Distance to nearest Metro station ─────────────────────────────

def get_distance_to_metro(parcel: ParcelInput) -> Optional[float]:
    """
    Return distance (metres) from the parcel centroid to the nearest
    NTA Metro station entrance.

    TODO: Replace with real GIS query (PostGIS ST_Distance or similar).
    """
    pid = parcel.parcel_id.upper()
    if pid.endswith("A"):
        return 80.0
    if pid.endswith("B"):
        return 200.0
    if pid.endswith("C"):
        return 600.0
    return 1500.0  # well outside any ring


def classify_metro_zone(distance_m: Optional[float]) -> MetroZone:
    """Classify distance into a TAMA 70 ring."""
    if distance_m is None:
        return MetroZone.OUTSIDE
    if distance_m <= 100:
        return MetroZone.CORE_100M
    if distance_m <= 300:
        return MetroZone.RING_1_300M
    if distance_m <= 800:
        return MetroZone.RING_2_800M
    return MetroZone.OUTSIDE


# ─── Complex type detection ─────────────────────────────────────────

def detect_complex_type(parcel: ParcelInput) -> ComplexType:
    """
    Detect whether the parcel is a single building, a point plan, or an
    urban renewal complex.

    TODO: Replace with real spatial lookup (e.g. check intersection with
    declared urban renewal complexes from Rashut L'Hitchadshut).
    """
    if parcel.existing_units >= 24:
        return ComplexType.URBAN_RENEWAL_COMPLEX
    if parcel.existing_units >= 8:
        return ComplexType.POINT_PLAN
    return ComplexType.SINGLE_BUILDING


# ─── Hegemony / constraint layers ──────────────────────────────────

def get_hegemony_layers(parcel: ParcelInput) -> List[str]:
    """
    Return a list of national / hegemony constraint layer codes that
    intersect the parcel.

    TODO: Replace with real GIS intersection query against national
    plans (RATA height cones, TATL infrastructure corridors,
    heritage polygons, etc.).
    """
    layers: List[str] = []
    pid = parcel.parcel_id.upper()

    if "RATA" in pid:
        layers.append("RATA_HEIGHT_CONE_120")
    if "PRES" in pid:
        layers.append("STRICT_PRESERVATION")
    if pid.endswith("A") or pid.endswith("B"):
        layers.append("TAMA_70_STATION_AREA")
    return layers
