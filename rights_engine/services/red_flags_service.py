"""
Red Flags Service (Step 5 — additional planning red flags)

Generates red flags beyond those produced by the override engine.
Covers: density caps from freezes, Metro ring warnings, heritage blocks.
"""

from __future__ import annotations

from typing import List

from rights_engine.domain.models import (
    FreezeStatus,
    MetroZone,
    RedFlag,
    RedFlagSeverity,
    SpatialProfile,
)


def build_additional_flags(
    spatial: SpatialProfile,
    freeze: FreezeStatus,
) -> List[RedFlag]:
    """
    Build red flags from spatial profile and freeze status that weren't
    already captured by the override engine.

    These are informational / attention-level flags.
    """
    flags: List[RedFlag] = []

    # Density cap from freeze (more detailed message)
    if freeze.density_capped and freeze.density_cap_value is not None:
        flags.append(RedFlag(
            code="DENSITY_CAP_DETAIL",
            severity=RedFlagSeverity.STRONG_RISK,
            message=(
                f"§77 density restriction in effect: maximum "
                f"{freeze.density_cap_value} units per dunam. "
                "New construction exceeding this cap will be rejected."
            ),
            source="red_flags_service / §77",
        ))

    # Metro ring 1 — special approval required
    if spatial.metro_zone == MetroZone.RING_1_300M:
        flags.append(RedFlag(
            code="METRO_RING1_SPECIAL",
            severity=RedFlagSeverity.ATTENTION,
            message=(
                "Property is within 300 m of a Metro station. "
                "Building permits require special NTA coordination. "
                "Expect longer processing times and possible design constraints."
            ),
            source="red_flags_service / TAMA 70",
        ))

    # Metro ring 2 — TOD compliance
    if spatial.metro_zone == MetroZone.RING_2_800M:
        flags.append(RedFlag(
            code="METRO_RING2_TOD",
            severity=RedFlagSeverity.ATTENTION,
            message=(
                "Property is within 800 m of a Metro station. "
                "Must comply with TOD (Transit-Oriented Development) standards: "
                "higher density, reduced parking ratios, active ground floor."
            ),
            source="red_flags_service / TAMA 70",
        ))

    # Strict preservation
    if "STRICT_PRESERVATION" in spatial.hegemony_layers:
        flags.append(RedFlag(
            code="HERITAGE_STRICT_DETAIL",
            severity=RedFlagSeverity.HARD_BLOCK,
            message=(
                "Heritage preservation zone: the building is listed for "
                "strict preservation. Demolition is prohibited. Any modification "
                "requires Conservation Council approval (months to years)."
            ),
            source="red_flags_service / Heritage",
        ))

    # RATA height cone
    if any("RATA" in layer for layer in spatial.hegemony_layers):
        flags.append(RedFlag(
            code="RATA_HEIGHT_DETAIL",
            severity=RedFlagSeverity.STRONG_RISK,
            message=(
                "RATA airport height-cone restriction. Maximum building height "
                "is limited by flight-path safety requirements. "
                "Floor additions may be blocked entirely."
            ),
            source="red_flags_service / RATA",
        ))

    # Multiple freeze notices — compound risk
    if len(freeze.active_notices) > 1:
        flags.append(RedFlag(
            code="MULTIPLE_FREEZES",
            severity=RedFlagSeverity.STRONG_RISK,
            message=(
                f"Multiple active freeze notices ({len(freeze.active_notices)}) "
                "affect this parcel. Compound restrictions may apply."
            ),
            source="red_flags_service / §77-78",
        ))

    return flags
