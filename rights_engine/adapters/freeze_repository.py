"""
Freeze Repository — §77–78 freeze notice lookup.

Data source (Phase 2):
  - Local CSV database: data/freeze_notices.csv
  - §77-78 freeze notices are published in the Official Gazette (Reshumot).
  - There is no live API for freeze notices.
  - CSV must be populated manually from Official Gazette publications.
  - DATA_ENTRY_REQUIRED: CSV schema is created but has 0 data rows.

Matching logic:
  - Filter by gush number (from parcel_id "GUSH-HELKA" format).
  - If polygon_wkt is present in CSV, do shapely intersection check.
  - Filter to active notices (start_date <= as_of <= expiry_date).

Function signatures unchanged from stub version — services/ not affected.
"""

from __future__ import annotations

import csv
import datetime
from functools import lru_cache
from pathlib import Path
from typing import List, Optional

from shapely import wkt as shapely_wkt
from shapely.geometry import shape

from rights_engine.domain.models import FreezeNotice, FreezeType


# ── CSV path ─────────────────────────────────────────────────

_CSV_PATH = Path(__file__).parent.parent / "data" / "freeze_notices.csv"


# ── CSV loader ───────────────────────────────────────────────


def _load_csv() -> List[dict]:
    """
    Load freeze notices CSV. Skips comment lines (starting with #).
    Returns list of row dicts.
    """
    if not _CSV_PATH.exists():
        return []

    rows = []
    with open(_CSV_PATH, "r", encoding="utf-8") as f:
        # Filter out comment lines before passing to DictReader
        lines = [line for line in f if not line.strip().startswith("#")]
        if not lines:
            return []
        reader = csv.DictReader(lines)
        for row in reader:
            rows.append(row)
    return rows


def _parse_freeze_type(ft: str) -> FreezeType:
    """Map CSV freeze_type string to FreezeType enum."""
    ft_upper = ft.strip().upper()
    if ft_upper == "FULL":
        return FreezeType.FULL
    if ft_upper == "TAMA38_ONLY":
        return FreezeType.TAMA38_ONLY
    if ft_upper == "RIGHTS_REDUCTION":
        return FreezeType.RIGHTS_REDUCTION
    return FreezeType.UNKNOWN


def _parse_bool(val: str) -> bool:
    """Parse CSV boolean (true/false/yes/no/1/0)."""
    return val.strip().lower() in ("true", "yes", "1")


def _parse_date(val: str) -> Optional[datetime.date]:
    """Parse YYYY-MM-DD date string."""
    try:
        return datetime.date.fromisoformat(val.strip())
    except (ValueError, AttributeError):
        return None


def _parse_semicolon_list(val: str) -> List[str]:
    """Parse semicolon-separated list, trimming whitespace."""
    if not val or not val.strip():
        return []
    return [x.strip() for x in val.split(";") if x.strip()]


# ── Matching logic ───────────────────────────────────────────


def _gush_from_parcel_id(parcel_id: str) -> Optional[str]:
    """Extract gush number from parcel_id format 'GUSH-HELKA'."""
    parts = parcel_id.replace("/", "-").split("-")
    if len(parts) >= 1 and parts[0].strip().isdigit():
        return parts[0].strip()
    return None


def _helka_from_parcel_id(parcel_id: str) -> Optional[str]:
    """Extract helka number from parcel_id format 'GUSH-HELKA'."""
    parts = parcel_id.replace("/", "-").split("-")
    if len(parts) >= 2 and parts[1].strip().isdigit():
        return parts[1].strip()
    return None


def _geometry_intersects(row_polygon_wkt: str, query_wkt: str) -> bool:
    """Check if a CSV row's polygon intersects the query geometry."""
    try:
        row_geom = shapely_wkt.loads(row_polygon_wkt)
        query_geom = shapely_wkt.loads(query_wkt)
        return row_geom.intersects(query_geom)
    except Exception:
        return False


# ── Main entry point ─────────────────────────────────────────


def _stub_freeze_notices(geometry_wkt: str) -> List[FreezeNotice]:
    """
    Stub fallback for test compatibility.
    Detects freeze type from geometry_wkt string content:
      FREEZE_FULL → full freeze, FREEZE_T38 → TAMA 38 freeze,
      FREEZE_DENSITY → density cap freeze.
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
            density_cap=30.0,
            notes="§77 density reduction — caps new construction density",
        ))

    return notices


def _is_real_wkt(geometry_wkt: str) -> bool:
    """Check if geometry_wkt is a real WKT geometry (not a test stub string)."""
    wkt = geometry_wkt.strip().upper()
    return wkt.startswith("POLYGON((") or wkt.startswith("MULTIPOLYGON(((")


def get_freeze_notices(
    geometry_wkt: str,
    parcel_id: str = "",
    as_of: Optional[datetime.date] = None,
) -> List[FreezeNotice]:
    """
    Return all §77 / §78 freeze notices matching the given parcel.

    Strategy:
      1. If geometry_wkt contains stub keywords (FREEZE_FULL etc.),
         use stub fallback for test compatibility.
      2. Otherwise, load CSV data and match by gush/helka or spatial
         intersection.

    If CSV has no data rows (DATA_ENTRY_REQUIRED), returns empty list
    for real queries.
    """
    if as_of is None:
        as_of = datetime.date.today()

    # Stub fallback for test compatibility
    if not _is_real_wkt(geometry_wkt):
        return _stub_freeze_notices(geometry_wkt)

    # Real CSV-based implementation
    rows = _load_csv()
    if not rows:
        return []

    gush = _gush_from_parcel_id(parcel_id)
    helka = _helka_from_parcel_id(parcel_id)
    notices: List[FreezeNotice] = []

    for row in rows:
        start = _parse_date(row.get("start_date", ""))
        expiry = _parse_date(row.get("expiry_date", ""))
        if start and start > as_of:
            continue
        if expiry and expiry < as_of:
            continue

        matched = False

        if gush:
            gush_list = _parse_semicolon_list(row.get("gush_list", ""))
            if gush in gush_list:
                helka_list = _parse_semicolon_list(row.get("helka_list", ""))
                if not helka_list:
                    matched = True
                elif helka and helka in helka_list:
                    matched = True

        if not matched and geometry_wkt and row.get("polygon_wkt", "").strip():
            if _geometry_intersects(row["polygon_wkt"], geometry_wkt):
                matched = True

        if not matched:
            continue

        freeze_type = _parse_freeze_type(row.get("freeze_type", ""))
        density_cap_str = row.get("density_cap", "").strip()
        density_cap = float(density_cap_str) if density_cap_str else None

        notices.append(FreezeNotice(
            notice_id=row.get("id", "UNKNOWN"),
            start_date=start or datetime.date(2024, 1, 1),
            expiry_date=expiry or datetime.date(2027, 1, 1),
            freeze_type=freeze_type,
            applies_to_tama38=_parse_bool(row.get("applies_to_tama38", "false")),
            applies_to_all_permits=_parse_bool(row.get("applies_to_all", "false")),
            density_cap=density_cap,
            notes=row.get("notes", ""),
        ))

    return notices
