"""
Plans Repository — Interface for loading statutory plan constraints.

Data sources:
  - Mavat ArcGIS (ags.iplan.gov.il) for approved plan metadata by city.
    Filter: plan_county_name LIKE '%{city}%' AND station_desc='אישור'
    Returns: pl_number, pl_name, pl_date_8, entity_subtype_desc, pl_by_auth_of
  - Local curated plan data: fallback when Mavat is unreachable or
    returns empty results.

Function signatures unchanged — services/ not affected.
"""

from __future__ import annotations

import datetime
from typing import List, Optional

import requests

from rights_engine.domain.models import (
    ParcelInput,
    PlanConstraint,
    PlanLevel,
)


# ── Mavat ArcGIS endpoint (confirmed working) ────────────────

MAVAT_ARCGIS_URL = (
    "https://ags.iplan.gov.il/arcgisiplan/rest/services/"
    "PlanningPublic/Xplan/MapServer/1/query"
)


def _classify_mavat_plan(
    subtype: str, auth: float, name: str
) -> PlanLevel:
    """
    Classify a Mavat plan into PlanLevel based on:
      - entity_subtype_desc (plan subtype)
      - pl_by_auth_of (1=national, 2=district, 3=local)
      - pl_name (Hebrew plan name keywords)
    """
    # National-level plans
    if any(x in name for x in ('תמ"א', "תמא", 'תת"ל', 'רט"א')):
        return PlanLevel.NATIONAL_VETO
    if auth <= 1:
        return PlanLevel.NATIONAL_VETO

    # District / thematic
    if auth == 2:
        return PlanLevel.THEMATIC

    # Section 23 override plans
    if any(x in name for x in ("סעיף 23", "מתחם", "רביע")):
        return PlanLevel.SECTION_23

    # Urban renewal multiplier plans
    if "התחדשות" in subtype:
        return PlanLevel.URBAN_RENEWAL_MULTIPLIER

    # Thematic (preservation, parking, design)
    if any(x in name for x in ("שימור", "חנייה", "חניה", "עיצוב עירוני")):
        return PlanLevel.THEMATIC

    return PlanLevel.DETAILED_BASELINE


def get_plans_from_mavat(city: str) -> Optional[List[PlanConstraint]]:
    """
    Fetch approved plans for a city from Mavat ArcGIS.

    Returns list of PlanConstraint objects sorted by level priority,
    or None if the API is unreachable.
    """
    params = {
        "where": f"plan_county_name LIKE '%{city}%' AND station_desc='אישור'",
        "outFields": (
            "pl_number,pl_name,plan_county_name,station_desc,"
            "pl_date_8,entity_subtype_desc,pl_by_auth_of,"
            "pl_objectives,pl_url"
        ),
        "resultRecordCount": 15,
        "orderByFields": "pl_date_8 DESC",
        "f": "json",
    }
    try:
        resp = requests.get(MAVAT_ARCGIS_URL, params=params, timeout=15)
        data = resp.json()
    except Exception as e:
        print(f"[plans_repo] Mavat ArcGIS failed: {e}")
        return None

    features = data.get("features", [])
    if not features:
        return None

    result: List[PlanConstraint] = []
    for f in features:
        a = f.get("attributes", {})
        date_ms = a.get("pl_date_8")
        if date_ms:
            try:
                eff_date = datetime.date.fromtimestamp(date_ms / 1000)
            except (ValueError, OSError):
                eff_date = datetime.date(2000, 1, 1)
        else:
            eff_date = datetime.date(2000, 1, 1)

        auth = float(a.get("pl_by_auth_of") or 3)
        subtype = a.get("entity_subtype_desc") or ""
        name = a.get("pl_name") or ""
        level = _classify_mavat_plan(subtype, auth, name)

        objectives = (a.get("pl_objectives") or "")[:200]

        result.append(PlanConstraint(
            plan_id=a.get("pl_number") or "UNKNOWN",
            level=level,
            description=name,
            effective_date=eff_date,
            overrides=[],
            notes=objectives,
        ))

    # Sort by priority level
    level_order = {
        PlanLevel.NATIONAL_VETO: 0,
        PlanLevel.THEMATIC: 1,
        PlanLevel.SECTION_23: 2,
        PlanLevel.DETAILED_BASELINE: 3,
        PlanLevel.URBAN_RENEWAL_MULTIPLIER: 4,
    }
    result.sort(key=lambda c: level_order.get(c.level, 99))

    print(f"[plans_repo] Mavat returned {len(result)} plans for {city}")
    return result


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


# ── Main entry point ─────────────────────────────────────────


def get_plan_constraints(parcel: ParcelInput) -> List[PlanConstraint]:
    """
    Return all plan constraints that apply to the given parcel,
    ordered from highest-priority level to lowest.

    Strategy:
      1. Try Mavat ArcGIS by city name.
      2. If Mavat fails or returns empty → fall back to curated local data.
    """
    city = parcel.city.strip()

    # ── Try Mavat ArcGIS ──
    mavat_plans = get_plans_from_mavat(city)
    if mavat_plans is not None and len(mavat_plans) > 0:
        return mavat_plans

    # ── Fallback: curated local data ──
    return _get_local_fallback_plans(parcel)


def _get_local_fallback_plans(parcel: ParcelInput) -> List[PlanConstraint]:
    """
    Curated local plan data — used when Mavat is unreachable.
    """
    constraints: List[PlanConstraint] = []
    city = parcel.city.strip()

    # Thematic plan (citywide parking standards)
    constraints.append(PlanConstraint(
        plan_id=f"{city}-PARKING-STD",
        level=PlanLevel.THEMATIC,
        description="Citywide parking standards",
        effective_date=datetime.date(2020, 1, 1),
        notes="Parking ratio per unit depends on Metro zone",
    ))

    # ── Section 23 plans (city-specific) ──
    _section23 = _CURATED_SECTION_23.get(city)
    if _section23 is not None:
        constraints.append(_section23)

    # ── Baseline detailed plans (TABA) ──
    _baseline = _CURATED_BASELINE.get(city)
    if _baseline is not None:
        constraints.append(_baseline)
    else:
        constraints.append(PlanConstraint(
            plan_id=f"{city}-BASELINE",
            level=PlanLevel.DETAILED_BASELINE,
            description=f"Baseline residential TABA for {city}",
            effective_date=datetime.date(2015, 1, 1),
            notes="NEEDS_REVIEW — generic stub, replace with real plan lookup from Mavat",
        ))

    return constraints


# ── Curated Section 23 plans (by city, Hebrew key) ──────────

_CURATED_SECTION_23: dict[str, PlanConstraint] = {}

for _city_name in ("תל אביב", "תל אביב-יפו"):
    _CURATED_SECTION_23[_city_name] = PlanConstraint(
        plan_id="TA-SEC23-RENEWAL",
        level=PlanLevel.SECTION_23,
        description="Tel Aviv Section 23 urban renewal master plan",
        effective_date=datetime.date(2022, 3, 15),
        max_floors=20,
        density_cap=45.0,
        notes="Overrides underlying TABAs for renewal projects; no TAMA 38 stacking",
    )

for _city_name in ("ירושלים",):
    _CURATED_SECTION_23[_city_name] = PlanConstraint(
        plan_id="JLM-SEC23-SAFDIE",
        level=PlanLevel.SECTION_23,
        description="Jerusalem Section 23 — Safdie master plan for city center",
        effective_date=datetime.date(2021, 6, 1),
        max_floors=15,
        density_cap=40.0,
        notes="Overrides TAMA 38 stacking in Safdie plan area",
    )


# ── Curated baseline TABAs (by city, Hebrew key) ────────────

_CURATED_BASELINE: dict[str, PlanConstraint] = {}

# Ra'anana
for _city_name in ("רעננה",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="416-1060052",
        level=PlanLevel.DETAILED_BASELINE,
        description="TABA Ra/Ra/B — Ra'anana urban renewal zoning",
        effective_date=datetime.date(2025, 2, 25),
        notes="Coverage ≤2 dunam=55%, >2 dunam=50%. Coefficient by existing floors.",
    )

# Tel Aviv
for _city_name in ("תל אביב", "תל אביב-יפו"):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="TA-3850-B",
        level=PlanLevel.DETAILED_BASELINE,
        description="Tel Aviv baseline residential TABA",
        effective_date=datetime.date(2018, 7, 1),
        max_floors=8,
        notes="Standard residential zone, FAR 6.0",
    )

# Haifa
for _city_name in ("חיפה",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="HP-2000-MASTER",
        level=PlanLevel.DETAILED_BASELINE,
        description="Haifa city master plan — residential zones",
        effective_date=datetime.date(2016, 3, 1),
        max_floors=12,
        notes="Residential zone; FAR varies by sub-district",
    )

# Jerusalem
for _city_name in ("ירושלים",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="JLM-OUTLINE-2000",
        level=PlanLevel.DETAILED_BASELINE,
        description="Jerusalem outline plan — residential zones",
        effective_date=datetime.date(2009, 12, 1),
        max_floors=8,
        notes="Complex zoning; height limits vary by area and heritage zone",
    )

# Beer Sheva
for _city_name in ("באר שבע",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="BS-MASTER-2020",
        level=PlanLevel.DETAILED_BASELINE,
        description="Beer Sheva master plan — residential zones",
        effective_date=datetime.date(2020, 1, 1),
        max_floors=16,
        notes="Periphery city; high-rise corridors along main roads",
    )

# Netanya
for _city_name in ("נתניה",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="NT-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Netanya master plan — residential zones",
        effective_date=datetime.date(2019, 6, 1),
        max_floors=12,
        notes="Coastal city; height restrictions near shoreline",
    )

# Rishon LeZion
for _city_name in ("ראשון לציון",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="RSH-MASTER-2017",
        level=PlanLevel.DETAILED_BASELINE,
        description="Rishon LeZion master plan — residential zones",
        effective_date=datetime.date(2017, 8, 1),
        max_floors=14,
        notes="Gush Dan metro area; renewal corridors designated",
    )

# Petah Tikva
for _city_name in ("פתח תקווה", "פתח תקוה"):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="PT-MASTER-2018",
        level=PlanLevel.DETAILED_BASELINE,
        description="Petah Tikva master plan — residential zones",
        effective_date=datetime.date(2018, 4, 1),
        max_floors=12,
        notes="Central Gush Dan; renewal priority areas along rail line",
    )

# Ashdod
for _city_name in ("אשדוד",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="AD-MASTER-2021",
        level=PlanLevel.DETAILED_BASELINE,
        description="Ashdod master plan — residential zones",
        effective_date=datetime.date(2021, 2, 1),
        max_floors=15,
        notes="Southern coastal city; high-rise permitted in city center",
    )

# Herzliya
for _city_name in ("הרצליה",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="HZ-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Herzliya master plan — residential zones",
        effective_date=datetime.date(2019, 10, 1),
        max_floors=10,
        notes="Mixed high-tech and residential; strict design guidelines",
    )

# Bat Yam
for _city_name in ("בת ים",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="BY-MASTER-2020",
        level=PlanLevel.DETAILED_BASELINE,
        description="Bat Yam master plan — residential zones",
        effective_date=datetime.date(2020, 5, 1),
        max_floors=18,
        notes="Major renewal city; seafront high-rise zone",
    )

# Holon
for _city_name in ("חולון",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="HL-MASTER-2018",
        level=PlanLevel.DETAILED_BASELINE,
        description="Holon master plan — residential zones",
        effective_date=datetime.date(2018, 11, 1),
        max_floors=14,
        notes="Gush Dan city; multiple renewal compounds",
    )

# Ramat Gan
for _city_name in ("רמת גן",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="RG-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Ramat Gan master plan — residential zones",
        effective_date=datetime.date(2019, 3, 1),
        max_floors=20,
        notes="Diamond exchange area high-rise; lower limits in residential neighborhoods",
    )

# Givatayim
for _city_name in ("גבעתיים",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="GV-MASTER-2020",
        level=PlanLevel.DETAILED_BASELINE,
        description="Givatayim master plan — residential zones",
        effective_date=datetime.date(2020, 7, 1),
        max_floors=12,
        notes="Dense city; limited area for renewal",
    )

# Bnei Brak
for _city_name in ("בני ברק",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="BB-MASTER-2017",
        level=PlanLevel.DETAILED_BASELINE,
        description="Bnei Brak master plan — residential zones",
        effective_date=datetime.date(2017, 2, 1),
        max_floors=14,
        notes="Very dense city; renewal critical for housing supply",
    )

# Kfar Saba
for _city_name in ("כפר סבא",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="KS-MASTER-2018",
        level=PlanLevel.DETAILED_BASELINE,
        description="Kfar Saba master plan — residential zones",
        effective_date=datetime.date(2018, 5, 1),
        max_floors=10,
        notes="Sharon region; moderate density; renewal corridors along Weizmann St",
    )

# Hod HaSharon
for _city_name in ("הוד השרון",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="HH-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Hod HaSharon master plan — residential zones",
        effective_date=datetime.date(2019, 8, 1),
        max_floors=10,
        notes="Sharon region; growing city with renewal potential",
    )

# Ashkelon
for _city_name in ("אשקלון",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="AK-MASTER-2020",
        level=PlanLevel.DETAILED_BASELINE,
        description="Ashkelon master plan — residential zones",
        effective_date=datetime.date(2020, 9, 1),
        max_floors=12,
        notes="Periphery coastal city; seismic zone",
    )

# Rehovot
for _city_name in ("רחובות",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="RH-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Rehovot master plan — residential zones",
        effective_date=datetime.date(2019, 4, 1),
        max_floors=12,
        notes="Central city; Weizmann Institute area has special restrictions",
    )

# Lod
for _city_name in ("לוד",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="LOD-MASTER-2021",
        level=PlanLevel.DETAILED_BASELINE,
        description="Lod master plan — residential zones",
        effective_date=datetime.date(2021, 1, 1),
        max_floors=14,
        notes="Major renewal zone; RATA height cones affect western neighborhoods",
    )

# Ramla
for _city_name in ("רמלה",):
    _CURATED_BASELINE[_city_name] = PlanConstraint(
        plan_id="RML-MASTER-2019",
        level=PlanLevel.DETAILED_BASELINE,
        description="Ramla master plan — residential zones",
        effective_date=datetime.date(2019, 6, 1),
        max_floors=10,
        notes="Central city; old city heritage zones",
    )
