"""
Freeze Service (Step 2)

Determines the §77–78 freeze status for a parcel at a given date.
"""

from __future__ import annotations

import datetime
from typing import List

from rights_engine.domain.models import (
    FreezeNotice,
    FreezeStatus,
    FreezeType,
    ParcelInput,
)
from rights_engine.adapters import freeze_repository


def get_freeze_notices_for_geometry(geometry_wkt: str) -> List[FreezeNotice]:
    """
    Retrieve all §77–78 freeze notices that spatially intersect
    the given geometry.
    """
    return freeze_repository.get_freeze_notices(geometry_wkt)


def build_freeze_status(
    parcel: ParcelInput,
    as_of: datetime.date | None = None,
) -> FreezeStatus:
    """
    Build the aggregated freeze status for a parcel.

    Filters notices to only those active at `as_of` date, then sets
    the summary booleans (is_full_freeze, is_tama38_blocked, density_capped).
    """
    if as_of is None:
        as_of = datetime.date.today()

    all_notices = get_freeze_notices_for_geometry(parcel.geometry_wkt)

    # Filter to active notices only
    active: List[FreezeNotice] = [
        n for n in all_notices
        if n.start_date <= as_of <= n.expiry_date
    ]

    status = FreezeStatus(active_notices=active)

    for notice in active:
        if notice.freeze_type == FreezeType.FULL:
            status.is_full_freeze = True
            status.is_tama38_blocked = True
        elif notice.freeze_type == FreezeType.TAMA38_ONLY:
            status.is_tama38_blocked = True
        elif notice.freeze_type == FreezeType.RIGHTS_REDUCTION:
            status.density_capped = True
            if notice.density_cap is not None:
                if status.density_cap_value is None:
                    status.density_cap_value = notice.density_cap
                else:
                    # Take the most restrictive cap
                    status.density_cap_value = min(
                        status.density_cap_value, notice.density_cap
                    )

        # Also check explicit flags
        if notice.applies_to_tama38:
            status.is_tama38_blocked = True
        if notice.applies_to_all_permits:
            status.is_full_freeze = True

    return status
