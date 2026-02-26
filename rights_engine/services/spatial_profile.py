"""
Spatial Profile Service (Step 1)

Builds a SpatialProfile for a parcel by querying the GIS adapter.
Provides helper booleans for Metro-zone-specific constraints.
"""

from __future__ import annotations

from rights_engine.domain.models import (
    MetroZone,
    ParcelInput,
    SpatialProfile,
)
from rights_engine.adapters import gis_adapter


def build_spatial_profile(parcel: ParcelInput) -> SpatialProfile:
    """
    Assemble the full spatial and statutory profile for a parcel.

    Steps:
      1. Measure distance to nearest Metro station.
      2. Classify into TAMA 70 Metro zone.
      3. Detect complex type (single building / point plan / urban renewal).
      4. Retrieve hegemony / constraint layers.
    """
    distance = gis_adapter.get_distance_to_metro(parcel)
    metro_zone = gis_adapter.classify_metro_zone(distance)
    complex_type = gis_adapter.detect_complex_type(parcel)
    layers = gis_adapter.get_hegemony_layers(parcel)

    return SpatialProfile(
        complex_type=complex_type,
        metro_zone=metro_zone,
        distance_to_metro_m=distance,
        hegemony_layers=layers,
    )


# ─── Helper booleans ────────────────────────────────────────────────


def is_tama38_absolutely_blocked(spatial: SpatialProfile) -> bool:
    """
    TAMA 38 is absolutely blocked inside the Metro core (0–100 m).
    TAMA 70 §X — no TAMA 38 permits in the immediate station area.
    """
    return spatial.metro_zone == MetroZone.CORE_100M


def requires_special_metro_approval(spatial: SpatialProfile) -> bool:
    """
    Within 100–300 m of a Metro station, any building permit
    requires special approval from NTA / Metro authority.
    """
    return spatial.metro_zone == MetroZone.RING_1_300M


def requires_tod_compliance(spatial: SpatialProfile) -> bool:
    """
    Within 300–800 m, new construction must comply with TOD
    (Transit-Oriented Development) density and design standards.
    """
    return spatial.metro_zone == MetroZone.RING_2_800M


def has_height_veto(spatial: SpatialProfile) -> bool:
    """
    Returns True if a confirmed RATA airport height cone or similar national
    height restriction layer is present.

    RATA_UNKNOWN is NOT a confirmed veto — it means we couldn't check.
    Only actual cone layers (RATA_HEIGHT_CONE_*) trigger a veto.
    """
    for layer in spatial.hegemony_layers:
        if "RATA" in layer and layer != "RATA_UNKNOWN":
            return True
    return False


def has_strict_preservation(spatial: SpatialProfile) -> bool:
    """
    Returns True if the parcel is in a strict heritage preservation zone.
    """
    return "STRICT_PRESERVATION" in spatial.hegemony_layers
