"""
Freeze Repository — Interface for §77–78 freeze notice lookup.

In production this would query the planning portal's freeze notice
database or a curated local table.

Current implementation returns deterministic fake data for testing.

TODO: Wire to real data:
  - IPA (Israel Planning Administration) notice feed
  - NLP classifier for freeze notice text (scope determination)
"""

from __future__ import annotations

import datetime
from typing import List

from rights_engine.domain.models import FreezeNotice, FreezeType


def get_freeze_notices(geometry_wkt: str) -> List[FreezeNotice]:
    """
    Return all §77 / §78 freeze notices whose polygon intersects
    the given geometry.

    Stub conventions (based on geometry_wkt content):
      - Contains "FREEZE_FULL"   → returns a full freeze notice
      - Contains "FREEZE_T38"    → returns a TAMA-38-only freeze
      - Contains "FREEZE_DENSITY" → returns a density-cap freeze
      - Otherwise                → empty list (no freezes)
    """
    notices: List[FreezeNotice] = []
    wkt_upper = geometry_wkt.upper()

    if "FREEZE_FULL" in wkt_upper:
        notices.append(FreezeNotice(
            notice_id="FRZ-2024-001",
            start_date=datetime.date(2024, 1, 15),
            expiry_date=datetime.date(2027, 1, 15),
            freeze_type=FreezeType.FULL,
            applies_to_tama38=True,
            applies_to_all_permits=True,
            linked_plan_ids=["CITY-MASTER-2024"],
            notes="Full §78 freeze pending new master plan approval",
        ))

    if "FREEZE_T38" in wkt_upper:
        notices.append(FreezeNotice(
            notice_id="FRZ-2024-002",
            start_date=datetime.date(2024, 6, 1),
            expiry_date=datetime.date(2026, 6, 1),
            freeze_type=FreezeType.TAMA38_ONLY,
            applies_to_tama38=True,
            applies_to_all_permits=False,
            notes="§77 freeze on TAMA 38 permits only; baseline permits allowed",
        ))

    if "FREEZE_DENSITY" in wkt_upper:
        notices.append(FreezeNotice(
            notice_id="FRZ-2024-003",
            start_date=datetime.date(2024, 3, 1),
            expiry_date=datetime.date(2027, 3, 1),
            freeze_type=FreezeType.RIGHTS_REDUCTION,
            applies_to_tama38=False,
            applies_to_all_permits=False,
            density_cap=30.0,  # max 30 units per dunam
            notes="§77 density reduction — caps new construction density",
        ))

    return notices
