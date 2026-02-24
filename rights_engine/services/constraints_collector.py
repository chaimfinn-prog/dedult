"""
Constraints Collector Service (Step 3 — gather plans)

Collects all applicable plan constraints for a parcel via the
plans repository adapter.
"""

from __future__ import annotations

from typing import List

from rights_engine.domain.models import ParcelInput, PlanConstraint
from rights_engine.adapters import plans_repository


def collect_plan_constraints(parcel: ParcelInput) -> List[PlanConstraint]:
    """
    Retrieve all plan constraints applicable to the parcel.

    Returns them sorted by PlanLevel priority (NATIONAL_VETO first,
    URBAN_RENEWAL_MULTIPLIER last).
    """
    constraints = plans_repository.get_plan_constraints(parcel)

    # Sort by level priority — PlanLevel enum order matches hierarchy
    level_order = {
        "national_veto": 0,
        "thematic": 1,
        "section_23": 2,
        "detailed_baseline": 3,
        "urban_renewal_multiplier": 4,
    }

    constraints.sort(key=lambda c: level_order.get(c.level.value, 99))
    return constraints
