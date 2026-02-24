"""
Plans Repository — Interface for loading statutory plan constraints.

In production this would query the Mavat planning portal API,
local PostGIS tables, or a curated plans database.

Current implementation returns deterministic fake data keyed on city name.

TODO: Wire up to real data sources:
  - Mavat REST API for plan metadata
  - OCR / NLP pipeline for legacy TABA text extraction
  - PostGIS for plan polygon intersection
"""

from __future__ import annotations

import datetime
from typing import List

from rights_engine.domain.models import (
    ParcelInput,
    PlanConstraint,
    PlanLevel,
)


def get_plan_constraints(parcel: ParcelInput) -> List[PlanConstraint]:
    """
    Return all plan constraints that apply to the given parcel,
    ordered from highest-priority level to lowest.

    TODO: Replace with real query.
    """
    constraints: List[PlanConstraint] = []
    city = parcel.city.strip()

    # ── National veto (always check) ──
    if any(layer_tag in parcel.parcel_id.upper() for layer_tag in ("RATA", "PRES")):
        if "RATA" in parcel.parcel_id.upper():
            constraints.append(PlanConstraint(
                plan_id="RATA-NOP",
                level=PlanLevel.NATIONAL_VETO,
                description="RATA airport height cone — limits building height",
                effective_date=datetime.date(2000, 1, 1),
                height_cap_m=120.0,
                max_floors=35,
                notes="Height measured from sea level; verify AGL for specific site",
            ))
        if "PRES" in parcel.parcel_id.upper():
            constraints.append(PlanConstraint(
                plan_id="HERITAGE-STRICT",
                level=PlanLevel.NATIONAL_VETO,
                description="Strict heritage preservation — no additional construction",
                effective_date=datetime.date(2010, 6, 1),
                height_cap_m=12.0,
                max_floors=3,
                notes="Cannot demolish or add floors without Council for Preservation approval",
            ))

    # ── Thematic plan (example: citywide parking standards) ──
    constraints.append(PlanConstraint(
        plan_id=f"{city}-PARKING-STD",
        level=PlanLevel.THEMATIC,
        description="Citywide parking standards",
        effective_date=datetime.date(2020, 1, 1),
        notes="Parking ratio per unit depends on Metro zone",
    ))

    # ── Section 23 plan (Tel Aviv example) ──
    if city in ("תל אביב", "Tel Aviv", "tel_aviv", "תל אביב-יפו"):
        constraints.append(PlanConstraint(
            plan_id="TA-SEC23-RENEWAL",
            level=PlanLevel.SECTION_23,
            description="Tel Aviv Section 23 urban renewal master plan",
            effective_date=datetime.date(2022, 3, 15),
            max_floors=20,
            density_cap=45.0,  # units per dunam
            notes="Overrides underlying TABAs for renewal projects; no TAMA 38 stacking",
        ))

    # ── Baseline detailed plan (TABA) ──
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
        # Generic baseline
        constraints.append(PlanConstraint(
            plan_id=f"{city}-BASELINE",
            level=PlanLevel.DETAILED_BASELINE,
            description=f"Baseline residential TABA for {city}",
            effective_date=datetime.date(2015, 1, 1),
            notes="Generic stub — replace with real plan lookup",
        ))

    return constraints
