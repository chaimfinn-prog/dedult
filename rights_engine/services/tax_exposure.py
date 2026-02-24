"""
Tax Exposure Service (Step 5 — Metro levy vs regular betterment levy)

Generates red flags related to betterment levy / Metro tax exposure.
"""

from __future__ import annotations

import datetime
from typing import List

from rights_engine.domain.models import (
    MetroZone,
    RedFlag,
    RedFlagSeverity,
    SpatialProfile,
)

# ─── Configuration ──────────────────────────────────────────────────

# Metro betterment levy rate (temporary regulations, subject to change).
# Standard betterment levy is 50% of value increase.
# Metro levy can be ~60% under current temporary regulations.
METRO_LEVY_RATE_PCT = 60.0
STANDARD_LEVY_RATE_PCT = 50.0

# Effective date range for Metro levy temporary regulations
METRO_LEVY_START = datetime.date(2024, 1, 1)
METRO_LEVY_END = datetime.date(2028, 12, 31)


def build_tax_red_flags(
    spatial: SpatialProfile,
    as_of: datetime.date,
) -> List[RedFlag]:
    """
    Generate red flags about betterment levy / Metro tax exposure.

    If the parcel is in any Metro zone (not OUTSIDE), the Metro betterment
    levy may apply at a higher rate than the standard 50%.
    """
    flags: List[RedFlag] = []

    if spatial.metro_zone != MetroZone.OUTSIDE:
        # Check if Metro levy temporary regulations are in effect
        if METRO_LEVY_START <= as_of <= METRO_LEVY_END:
            flags.append(RedFlag(
                code="METRO_LEVY",
                severity=RedFlagSeverity.STRONG_RISK,
                message=(
                    f"Metro betterment levy applies: ~{METRO_LEVY_RATE_PCT:.0f}% "
                    f"(vs standard {STANDARD_LEVY_RATE_PCT:.0f}%). "
                    f"Parcel is in Metro zone '{spatial.metro_zone.value}'. "
                    "Under temporary regulations (valid until "
                    f"{METRO_LEVY_END.isoformat()}), the betterment levy "
                    "near Metro stations is increased. This significantly "
                    "impacts project economics."
                ),
                source="tax_exposure / Metro Levy",
            ))
        else:
            flags.append(RedFlag(
                code="METRO_LEVY_POTENTIAL",
                severity=RedFlagSeverity.ATTENTION,
                message=(
                    "Parcel is in a Metro influence zone. "
                    "Metro betterment levy temporary regulations may be "
                    "renewed. Monitor legislative developments."
                ),
                source="tax_exposure / Metro Levy",
            ))

    return flags
