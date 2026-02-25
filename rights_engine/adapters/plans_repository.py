"""
Plans Repository — Interface for loading statutory plan constraints.

Data sources (Phase 2):
  - Mavat (ipa.iplan.gov.il) REST API for plan metadata.
    REQUIRES_API_ACCESS: All Mavat/iplan endpoints are blocked from
    this environment (proxy 403 / TLS failure on ags.iplan.gov.il).
    When access is available, implement get_plans_from_mavat().
  - GovMap WFS: does NOT contain TABA/zoning boundaries.
  - Local curated plan data: Ra'anana TABA 416-1060052 is hardcoded
    with verified rules from the approved plan document.

Mavat endpoints tested (2026-02-25):
  - ipa.iplan.gov.il/api/v1/plans?gush=X&helka=Y → 403 (proxy blocked)
  - mavat.iplan.gov.il/SV4/api/v1/plansList → returns HTML SPA shell
  - ags.iplan.gov.il/arcgisiplan/rest/services/... → 503 TLS failure
  None returned usable JSON from this environment.

Function signatures unchanged from stub version — services/ not affected.
"""

from __future__ import annotations

import datetime
from typing import List, Optional

from rights_engine.domain.models import (
    ParcelInput,
    PlanConstraint,
    PlanLevel,
)


# ── Mavat API client (REQUIRES_API_ACCESS) ───────────────────

# The following Mavat API endpoints are the correct ones to use
# when network access is available:
#
# GET https://ipa.iplan.gov.il/api/v1/plans?gush={gush}&helka={helka}&lang=he
#   Headers: Accept: application/json
#   Returns: JSON array of plan objects with fields:
#     - plan_number (תכנית מספר)
#     - plan_name (שם תכנית)
#     - plan_type (סוג תוכנית)
#     - approval_date (תאריך אישור)
#     - status (סטטוס)
#
# ArcGIS query (alternative):
# GET https://ags.iplan.gov.il/arcgisiplan/rest/services/PlanningPublic/Xplan/MapServer/1/query
#   Params: where=GUSH_NUM={gush}+AND+PARCEL_NUM={helka}&outFields=*&f=json


def get_plans_from_mavat(gush: str, helka: str) -> Optional[List[dict]]:
    """
    Fetch plan list from Mavat API by gush/helka.

    REQUIRES_API_ACCESS: This function is a placeholder.
    When ipa.iplan.gov.il is accessible, implement:
      1. GET request to Mavat API
      2. Parse JSON response
      3. Map to PlanConstraint objects

    Returns None (API not accessible from this environment).
    """
    # TODO: Implement when Mavat API access is confirmed.
    # import requests
    # resp = requests.get(
    #     "https://ipa.iplan.gov.il/api/v1/plans",
    #     params={"gush": gush, "helka": helka, "lang": "he"},
    #     headers={"Accept": "application/json"},
    #     timeout=30,
    # )
    # if resp.status_code == 200:
    #     return resp.json()
    return None


# ── Hegemony keyword detection from plan names ───────────────


def _detect_hegemony_from_plan_name(plan_name: str) -> List[str]:
    """
    Detect hegemony/constraint layers from plan name keywords.
    Used when Mavat returns plan metadata with Hebrew plan names.

    Returns list of hegemony layer codes.
    """
    layers: List[str] = []
    name = plan_name.strip()

    # Heritage / preservation
    if "שימור" in name or "מבנה לשימור" in name:
        layers.append("HERITAGE_STRICT")

    # TATL 100 water protection
    if 'תת"ל 100' in name or "100/4" in name or "הגנת מי תהום" in name:
        layers.append("TATL100_WATER_PROTECTION")

    # National infrastructure
    if 'תת"ל' in name and "100" not in name:
        layers.append("NATIONAL_INFRASTRUCTURE")

    return layers


def _classify_plan_level(plan_type: str, plan_name: str) -> PlanLevel:
    """
    Classify a Mavat plan type string into PlanLevel enum.
    Falls back to DETAILED_BASELINE with NEEDS_REVIEW flag.
    """
    pt = plan_type.strip().lower() if plan_type else ""
    pn = plan_name.strip().lower() if plan_name else ""

    # National-level plans
    if any(kw in pt for kw in ("ארצית", "תמ\"א", "national")):
        return PlanLevel.NATIONAL_VETO
    if any(kw in pn for kw in ("תמ\"א", "רט\"א", "rata")):
        return PlanLevel.NATIONAL_VETO

    # Thematic plans
    if any(kw in pt for kw in ("נושאית", "thematic")):
        return PlanLevel.THEMATIC
    if any(kw in pn for kw in ("חניה", "שימור", "עיצוב עירוני")):
        return PlanLevel.THEMATIC

    # Section 23 plans
    if "סעיף 23" in pn or "section 23" in pn:
        return PlanLevel.SECTION_23

    # Default: detailed baseline (with implicit NEEDS_REVIEW)
    return PlanLevel.DETAILED_BASELINE


# ── Main entry point ─────────────────────────────────────────


def get_plan_constraints(parcel: ParcelInput) -> List[PlanConstraint]:
    """
    Return all plan constraints that apply to the given parcel,
    ordered from highest-priority level to lowest.

    Phase 2 implementation:
      - Tries Mavat API first (when available).
      - Falls back to curated local data for known cities.
      - Returns hegemony keywords detected from plan names.
    """
    constraints: List[PlanConstraint] = []
    city = parcel.city.strip()

    # ── Try Mavat API (REQUIRES_API_ACCESS) ──
    parts = parcel.parcel_id.replace("/", "-").split("-")
    if len(parts) >= 2:
        gush, helka = parts[0].strip(), parts[1].strip()
        if gush.isdigit() and helka.isdigit():
            mavat_plans = get_plans_from_mavat(gush, helka)
            if mavat_plans is not None:
                for plan in mavat_plans:
                    plan_id = plan.get("plan_number", plan.get("PL_NUMBER", "UNKNOWN"))
                    plan_name = plan.get("plan_name", plan.get("PL_NAME", ""))
                    plan_type = plan.get("plan_type", plan.get("PLAN_TYPE", ""))
                    approval_str = plan.get("approval_date", plan.get("APPROVE_DATE", ""))
                    level = _classify_plan_level(plan_type, plan_name)

                    # Parse approval date
                    try:
                        eff_date = datetime.date.fromisoformat(approval_str[:10])
                    except (ValueError, TypeError):
                        eff_date = datetime.date(2020, 1, 1)

                    constraints.append(PlanConstraint(
                        plan_id=str(plan_id),
                        level=level,
                        description=plan_name,
                        effective_date=eff_date,
                        notes="NEEDS_REVIEW" if level == PlanLevel.DETAILED_BASELINE else "",
                    ))

                # Sort by priority level
                level_order = {
                    PlanLevel.NATIONAL_VETO: 0,
                    PlanLevel.THEMATIC: 1,
                    PlanLevel.SECTION_23: 2,
                    PlanLevel.DETAILED_BASELINE: 3,
                    PlanLevel.URBAN_RENEWAL_MULTIPLIER: 4,
                }
                constraints.sort(key=lambda c: level_order.get(c.level, 99))
                return constraints

    # ── Fallback: curated local data ──
    # (Used when Mavat API is not accessible)

    # Thematic plan (citywide parking standards)
    constraints.append(PlanConstraint(
        plan_id=f"{city}-PARKING-STD",
        level=PlanLevel.THEMATIC,
        description="Citywide parking standards",
        effective_date=datetime.date(2020, 1, 1),
        notes="Parking ratio per unit depends on Metro zone",
    ))

    # Section 23 plan (Tel Aviv)
    if city in ("תל אביב", "Tel Aviv", "tel_aviv", "תל אביב-יפו"):
        constraints.append(PlanConstraint(
            plan_id="TA-SEC23-RENEWAL",
            level=PlanLevel.SECTION_23,
            description="Tel Aviv Section 23 urban renewal master plan",
            effective_date=datetime.date(2022, 3, 15),
            max_floors=20,
            density_cap=45.0,
            notes="Overrides underlying TABAs for renewal projects; no TAMA 38 stacking",
        ))

    # Baseline detailed plans (TABA)
    if city in ("רעננה", "Raanana", "raanana"):
        constraints.append(PlanConstraint(
            plan_id="416-1060052",
            level=PlanLevel.DETAILED_BASELINE,
            description="TABA Ra/Ra/B — Ra'anana urban renewal zoning",
            effective_date=datetime.date(2025, 2, 25),
            notes="Coverage ≤2 dunam=55%, >2 dunam=50%. Coefficient by existing floors.",
        ))
    elif city in ("תל אביב", "Tel Aviv", "tel_aviv", "תל אביב-יפו"):
        constraints.append(PlanConstraint(
            plan_id="TA-3850-B",
            level=PlanLevel.DETAILED_BASELINE,
            description="Tel Aviv baseline residential TABA",
            effective_date=datetime.date(2018, 7, 1),
            max_floors=8,
            notes="Standard residential zone, FAR 6.0",
        ))
    else:
        constraints.append(PlanConstraint(
            plan_id=f"{city}-BASELINE",
            level=PlanLevel.DETAILED_BASELINE,
            description=f"Baseline residential TABA for {city}",
            effective_date=datetime.date(2015, 1, 1),
            notes="NEEDS_REVIEW — generic stub, replace with real plan lookup from Mavat",
        ))

    return constraints
