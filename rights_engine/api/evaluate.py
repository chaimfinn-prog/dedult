"""
API Entry Point — evaluate_parcel()

Public interface for the Israeli Building Rights Decision Engine.
Takes a request dict, runs the full pipeline, returns a JSON-serializable dict.

Pipeline:
  1. Parse input → ParcelInput
  2. Build spatial profile (Metro zone, complex type, hegemony layers)
  3. Build freeze status (§77–78)
  4. Collect plan constraints
  5. Build renewal policy
  6. Initialize EffectiveRightsContext and apply overrides
  7. Compute existing area
  8. Calculate rights alternatives (Baseline, TAMA 38, Shaked)
  9. Build red flags (additional + tax)
  10. Serialize and return
"""

from __future__ import annotations

import datetime
from typing import Any

from rights_engine.domain.models import (
    ParcelInput,
    ProjectType,
    RightsAlternative,
    RedFlag,
)
from rights_engine.services.spatial_profile import build_spatial_profile
from rights_engine.services.freeze_service import build_freeze_status
from rights_engine.services.constraints_collector import collect_plan_constraints
from rights_engine.services.override_engine import (
    EffectiveRightsContext,
    apply_national_veto,
    apply_plan_constraints,
    build_renewal_policy,
)
from rights_engine.services.area_base_service import compute_existing_area
from rights_engine.services.rights_calculators import (
    calc_baseline_taba_alternative,
    calc_shaked_alternative,
    calc_tama38_alternative,
)
from rights_engine.services.red_flags_service import build_additional_flags
from rights_engine.services.tax_exposure import build_tax_red_flags


# ─── Helpers ────────────────────────────────────────────────────────


def _parse_date(raw: Any) -> datetime.date:
    """Parse a date from string (YYYY-MM-DD) or return as-is if already a date."""
    if isinstance(raw, datetime.date):
        return raw
    return datetime.date.fromisoformat(str(raw))


def _parse_project_type(raw: str) -> ProjectType:
    """Parse project type string to enum."""
    raw_lower = raw.strip().lower().replace("-", "_").replace(" ", "_")
    for pt in ProjectType:
        if pt.value == raw_lower:
            return pt
    raise ValueError(f"Unknown project type: '{raw}'. Expected one of: {[e.value for e in ProjectType]}")


def _detect_periphery_or_seismic(city: str) -> bool:
    """
    Determine whether a city is in the periphery or a seismic-risk zone
    (which affects Shaked multiplier — 550% vs 400%).

    TODO: Replace with real geographic/seismic classification.
    """
    periphery_cities = {
        "באר שבע", "beer_sheva", "beersheba",
        "אשקלון", "ashkelon",
        "אילת", "eilat",
        "עפולה", "afula",
        "נצרת", "nazareth",
        "טבריה", "tiberias",
        "צפת", "safed", "tzfat",
        "קריית שמונה", "kiryat_shmona",
        "עכו", "akko", "acre",
        "כרמיאל", "carmiel",
        "דימונה", "dimona",
        "ערד", "arad",
        "יבנה", "yavne",
        "אופקים", "ofakim",
        "שדרות", "sderot",
        "נהריה", "nahariya",
    }
    return city.strip().lower() in periphery_cities or city.strip() in periphery_cities


def _serialize_alternative(alt: RightsAlternative) -> dict:
    """Serialize a RightsAlternative to a JSON-compatible dict."""
    return {
        "name": alt.name,
        "residential_sqm": round(alt.residential_sqm, 1),
        "public_built_sqm": round(alt.public_built_sqm, 1),
        "service_sqm": round(alt.service_sqm, 1),
        "total_sqm": round(alt.total_sqm, 1),
        "estimated_units": alt.estimated_units,
        "notes": alt.notes,
    }


def _serialize_red_flag(flag: RedFlag) -> dict:
    """Serialize a RedFlag to a JSON-compatible dict."""
    return {
        "code": flag.code,
        "severity": flag.severity.value,
        "message": flag.message,
        "source": flag.source,
    }


# ─── Main entry point ──────────────────────────────────────────────


def evaluate_parcel(request: dict) -> dict:
    """
    Evaluate building rights for an Israeli parcel.

    Args:
        request: Dict with keys:
            - parcel_id (str)
            - geometry_wkt (str)
            - city (str)
            - submission_date (str, YYYY-MM-DD)
            - project_type (str: "demolish_rebuild" or "addition_existing")
            - existing_built_sqm_reported (float)
            - existing_units (int)
            - as_of (str, optional — defaults to today)

    Returns:
        Dict with keys:
            - parcel_id
            - spatial_profile
            - freeze_status
            - alternatives (list of dicts)
            - red_flags (list of dicts)
    """

    # ── 1. Parse input ──
    parcel = ParcelInput(
        parcel_id=request["parcel_id"],
        geometry_wkt=request.get("geometry_wkt", ""),
        city=request["city"],
        submission_date=_parse_date(request["submission_date"]),
        project_type=_parse_project_type(request["project_type"]),
        existing_built_sqm_reported=float(request.get("existing_built_sqm_reported", 0)),
        existing_units=int(request.get("existing_units", 0)),
    )

    as_of = _parse_date(request["as_of"]) if "as_of" in request else datetime.date.today()

    # ── 2. Spatial profile ──
    spatial = build_spatial_profile(parcel)

    # ── 3. Freeze status ──
    freeze = build_freeze_status(parcel, as_of)

    # ── 4. Collect plan constraints ──
    constraints = collect_plan_constraints(parcel)

    # ── 5. Build renewal policy ──
    renewal_policy = build_renewal_policy(parcel.city, as_of)

    # ── 6. Initialize context and apply overrides ──
    ctx = EffectiveRightsContext(renewal_policy=renewal_policy)
    apply_national_veto(ctx, spatial, freeze)
    apply_plan_constraints(ctx, constraints)

    # ── 7. Compute existing area ──
    existing = compute_existing_area(parcel, ctx.baseline_plan)

    # ── 8. Detect periphery / seismic zone ──
    in_periphery = _detect_periphery_or_seismic(parcel.city)

    # ── 9. Calculate rights alternatives ──
    alternatives: list[RightsAlternative] = []

    baseline = calc_baseline_taba_alternative(existing, ctx)
    alternatives.append(baseline)

    tama38 = calc_tama38_alternative(parcel, existing, ctx)
    if tama38 is not None:
        alternatives.append(tama38)

    shaked = calc_shaked_alternative(parcel, existing, ctx, in_periphery)
    if shaked is not None:
        alternatives.append(shaked)

    # ── 10. Build red flags ──
    all_flags: list[RedFlag] = list(ctx.red_flags)  # from override engine
    all_flags.extend(build_additional_flags(spatial, freeze))
    all_flags.extend(build_tax_red_flags(spatial, as_of))

    # Deduplicate by code (keep first occurrence)
    seen_codes: set[str] = set()
    unique_flags: list[RedFlag] = []
    for f in all_flags:
        if f.code not in seen_codes:
            seen_codes.add(f.code)
            unique_flags.append(f)

    # ── 11. Serialize ──
    return {
        "parcel_id": parcel.parcel_id,
        "spatial_profile": {
            "complex_type": spatial.complex_type.value,
            "metro_zone": spatial.metro_zone.value,
            "distance_to_metro_m": spatial.distance_to_metro_m,
            "hegemony_layers": spatial.hegemony_layers,
        },
        "freeze_status": {
            "active_notices": len(freeze.active_notices),
            "is_full_freeze": freeze.is_full_freeze,
            "is_tama38_blocked": freeze.is_tama38_blocked,
            "density_capped": freeze.density_capped,
            "density_cap_value": freeze.density_cap_value,
        },
        "renewal_policy": {
            "track": renewal_policy.track.value,
            "max_multiplier_core": renewal_policy.max_multiplier_core,
            "max_multiplier_periphery": renewal_policy.max_multiplier_periphery,
            "public_built_share": renewal_policy.public_built_share,
        },
        "alternatives": [_serialize_alternative(a) for a in alternatives],
        "red_flags": [_serialize_red_flag(f) for f in unique_flags],
    }
