"""
Israeli Statutory Building Rights — Domain Models

All enums and dataclasses used across the decision engine.
Covers: parcel input, spatial profiling, freeze notices, plan constraints,
renewal policies, rights alternatives, and red-flag matrix.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from enum import Enum
from typing import List, Optional


# ═══════════════════════════════════════════════════════════════════════
# ENUMS
# ═══════════════════════════════════════════════════════════════════════


class ComplexType(Enum):
    """Type of building complex the parcel belongs to."""
    SINGLE_BUILDING = "single_building"
    POINT_PLAN = "point_plan"
    URBAN_RENEWAL_COMPLEX = "urban_renewal_complex"


class MetroZone(Enum):
    """
    TAMA 70 Metro influence rings.
    - CORE_100M:   0–100 m from station — TAMA 38 absolutely blocked.
    - RING_1_300M: 100–300 m — requires special Metro NTA approval.
    - RING_2_800M: 300–800 m — must comply with TOD standards.
    - OUTSIDE:     > 800 m — no Metro-specific constraints.
    """
    CORE_100M = "core_100m"
    RING_1_300M = "ring_1_300m"
    RING_2_800M = "ring_2_800m"
    OUTSIDE = "outside"


class FreezeType(Enum):
    """Classification of a §77–78 freeze notice."""
    FULL = "full"                     # All building permits frozen
    TAMA38_ONLY = "tama38_only"       # Only TAMA 38 permits frozen
    RIGHTS_REDUCTION = "rights_reduction"  # Density / rights cap
    UNKNOWN = "unknown"


class PlanLevel(Enum):
    """
    Hierarchy of statutory planning levels (highest override first).
    """
    NATIONAL_VETO = "national_veto"               # TAMA 70, RATA height, national infra
    THEMATIC = "thematic"                          # Preservation, parking, city design
    SECTION_23 = "section_23"                      # Section 23 override plans
    DETAILED_BASELINE = "detailed_baseline"        # Latest approved TABA
    URBAN_RENEWAL_MULTIPLIER = "urban_renewal_multiplier"


class RenewalTrack(Enum):
    """Which urban renewal mechanism is applicable."""
    NONE = "none"
    TAMA38_EXTENSION = "tama38_extension"
    SHAKED_ALTERNATIVE = "shaked_alternative"       # Amendment 139 / Shaked


class ProjectType(Enum):
    """Type of construction project the developer is proposing."""
    DEMOLISH_REBUILD = "demolish_rebuild"
    ADDITION_EXISTING = "addition_existing"


class RedFlagSeverity(Enum):
    """How severe a red flag is for the developer."""
    HARD_BLOCK = "hard_block"       # Cannot proceed at all
    STRONG_RISK = "strong_risk"     # Major obstacle, may require waiver/appeal
    ATTENTION = "attention"         # Informational, needs due diligence


# ═══════════════════════════════════════════════════════════════════════
# INPUT
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class ParcelInput:
    """
    Input data describing a parcel and the proposed project.
    """
    parcel_id: str
    geometry_wkt: str                          # WKT polygon / point
    city: str
    submission_date: datetime.date
    project_type: ProjectType
    existing_built_sqm_reported: float         # Total existing built area (sqm)
    existing_units: int                        # Number of existing residential units


# ═══════════════════════════════════════════════════════════════════════
# SPATIAL PROFILE (Step 1)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class SpatialProfile:
    """
    Result of spatial analysis — where the parcel sits in the statutory landscape.
    """
    complex_type: ComplexType
    metro_zone: MetroZone
    distance_to_metro_m: Optional[float]       # Actual distance in meters
    hegemony_layers: List[str] = field(default_factory=list)
    # Examples of hegemony layers:
    #   "RATA_HEIGHT_CONE_120"
    #   "TAMA_70_STATION_AREA"
    #   "NATIONAL_INFRA_HIGHVOLTAGE"
    #   "STRICT_PRESERVATION"


# ═══════════════════════════════════════════════════════════════════════
# FREEZE STATUS (Step 2)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class FreezeNotice:
    """
    A single §77 or §78 freeze notice affecting a parcel.
    """
    notice_id: str
    start_date: datetime.date
    expiry_date: datetime.date
    freeze_type: FreezeType
    applies_to_tama38: bool                    # Does this freeze block TAMA 38 specifically?
    applies_to_all_permits: bool               # Does it block ALL permit types?
    density_cap: Optional[float] = None        # Max density if RIGHTS_REDUCTION
    polygon_wkt: Optional[str] = None          # Spatial extent of the freeze
    linked_plan_ids: List[str] = field(default_factory=list)
    notes: str = ""


@dataclass
class FreezeStatus:
    """
    Aggregated freeze picture for a parcel at a point in time.
    """
    active_notices: List[FreezeNotice] = field(default_factory=list)
    is_full_freeze: bool = False               # Any active FULL freeze?
    is_tama38_blocked: bool = False            # Any freeze blocking TAMA 38?
    density_capped: bool = False               # Any density cap in effect?
    density_cap_value: Optional[float] = None  # Lowest active cap


# ═══════════════════════════════════════════════════════════════════════
# PLAN CONSTRAINTS (Step 3)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class PlanConstraint:
    """
    A single statutory plan or constraint layer affecting the parcel.
    """
    plan_id: str
    level: PlanLevel
    description: str
    effective_date: datetime.date
    overrides: List[str] = field(default_factory=list)  # IDs of plans this one overrides
    height_cap_m: Optional[float] = None       # Max building height in meters
    max_floors: Optional[int] = None           # Max floors allowed
    density_cap: Optional[float] = None        # Max units per dunam or FAR
    notes: str = ""


# ═══════════════════════════════════════════════════════════════════════
# RENEWAL POLICY (Step 4)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class RenewalPolicy:
    """
    City-level or area-level renewal track configuration.
    Represents the Shaked Alternative / Amendment 139 or TAMA 38 policy.
    """
    track: RenewalTrack
    max_multiplier_core: float = 4.0           # Up to 400% of existing lawful area (core/center)
    max_multiplier_periphery: float = 5.5      # Up to 550% in periphery / seismic zones
    public_built_share: float = 0.12           # 10–15% of total for public uses
    valid_until: datetime.date = field(
        default_factory=lambda: datetime.date(2030, 12, 31)
    )


# ═══════════════════════════════════════════════════════════════════════
# RIGHTS ALTERNATIVES (Step 4 output)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class RightsAlternative:
    """
    One possible development alternative (e.g. Baseline, TAMA 38, Shaked).
    """
    name: str
    residential_sqm: float
    public_built_sqm: float = 0.0
    service_sqm: float = 0.0
    total_sqm: float = 0.0
    estimated_units: Optional[int] = None
    notes: str = ""

    def __post_init__(self) -> None:
        if self.total_sqm == 0.0:
            self.total_sqm = self.residential_sqm + self.public_built_sqm + self.service_sqm


# ═══════════════════════════════════════════════════════════════════════
# RED FLAGS (Step 5)
# ═══════════════════════════════════════════════════════════════════════


@dataclass
class RedFlag:
    """
    A risk or blocker identified during the statutory evaluation.
    """
    code: str                                  # Machine-readable code, e.g. "METRO_CORE_BLOCK"
    severity: RedFlagSeverity
    message: str                               # Human-readable explanation
    source: str                                # Which layer/service generated this flag
