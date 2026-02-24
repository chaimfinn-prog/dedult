"""
Override Engine (Step 3 — apply hierarchy)

Applies the statutory plan hierarchy:
  national veto → thematic → Section 23 → baseline TABA → renewal multipliers

Produces an EffectiveRightsContext that downstream calculators consume.
"""

from __future__ import annotations

import datetime
from dataclasses import dataclass, field
from typing import List, Optional

from rights_engine.domain.models import (
    FreezeStatus,
    PlanConstraint,
    PlanLevel,
    RedFlag,
    RedFlagSeverity,
    RenewalPolicy,
    RenewalTrack,
    SpatialProfile,
)
from rights_engine.services.spatial_profile import (
    has_height_veto,
    has_strict_preservation,
    is_tama38_absolutely_blocked,
    requires_special_metro_approval,
)


# ─── Effective Rights Context ───────────────────────────────────────


@dataclass
class EffectiveRightsContext:
    """
    Accumulated context after applying the full plan hierarchy.
    This is what the rights calculators consume.

    Caps are split into two tiers:
      - national_*: From RATA, TAMA 70, etc. — cannot be overridden.
      - plan_*:     From TABA and thematic plans — can be overridden by
                    Shaked Alternative (Amendment 139).
    """
    # Capability flags
    can_build_tama38: bool = True
    can_build_baseline: bool = True
    can_add_floors: bool = True
    can_add_units: bool = True

    # National-level caps (hard limits — RATA, TAMA 70, etc.)
    national_height_cap_m: Optional[float] = None
    national_max_floors: Optional[int] = None

    # Plan-level caps (from TABA, thematic — overridable by Shaked)
    plan_height_cap_m: Optional[float] = None
    plan_max_floors: Optional[int] = None
    plan_density_cap: Optional[float] = None

    # Freeze-level density cap (hard limit)
    density_cap: Optional[float] = None

    # Selected plans
    section_23_plan: Optional[PlanConstraint] = None
    baseline_plan: Optional[PlanConstraint] = None

    # Renewal policy
    renewal_policy: Optional[RenewalPolicy] = None

    # Accumulated red flags
    red_flags: List[RedFlag] = field(default_factory=list)

    @property
    def effective_max_floors(self) -> Optional[int]:
        """Most restrictive floor cap from all sources."""
        caps = [c for c in (self.national_max_floors, self.plan_max_floors) if c is not None]
        return min(caps) if caps else None

    @property
    def effective_height_cap_m(self) -> Optional[float]:
        """Most restrictive height cap from all sources."""
        caps = [c for c in (self.national_height_cap_m, self.plan_height_cap_m) if c is not None]
        return min(caps) if caps else None


# ─── Renewal policy lookup ──────────────────────────────────────────

# City-level renewal policy configuration.
# In production, this would come from a database or config file.
# Keys are normalized city names; values are (track, core_mult, periph_mult, public_share).
_CITY_RENEWAL_CONFIG: dict[str, tuple[str, float, float, float]] = {
    "תל אביב":     ("shaked", 4.0, 5.5, 0.12),
    "תל אביב-יפו": ("shaked", 4.0, 5.5, 0.12),
    "tel_aviv":     ("shaked", 4.0, 5.5, 0.12),
    "רעננה":        ("shaked", 4.0, 5.5, 0.12),
    "raanana":      ("shaked", 4.0, 5.5, 0.12),
    "ירושלים":      ("tama38", 3.5, 5.0, 0.10),
    "jerusalem":    ("tama38", 3.5, 5.0, 0.10),
    "חיפה":         ("shaked", 4.0, 5.5, 0.12),
    "haifa":        ("shaked", 4.0, 5.5, 0.12),
    "באר שבע":      ("shaked", 4.0, 5.5, 0.15),
    "beer_sheva":   ("shaked", 4.0, 5.5, 0.15),
    "נתניה":        ("shaked", 4.0, 5.5, 0.12),
    "netanya":      ("shaked", 4.0, 5.5, 0.12),
    "ראשון לציון":  ("shaked", 4.0, 5.5, 0.12),
    "rishon":       ("shaked", 4.0, 5.5, 0.12),
    "פתח תקוה":     ("shaked", 4.0, 5.5, 0.12),
    "petah_tikva":  ("shaked", 4.0, 5.5, 0.12),
    "אשדוד":        ("shaked", 4.0, 5.5, 0.12),
    "ashdod":       ("shaked", 4.0, 5.5, 0.12),
    "הרצליה":       ("shaked", 4.0, 5.5, 0.12),
    "herzliya":     ("shaked", 4.0, 5.5, 0.12),
    "בת ים":        ("shaked", 4.0, 5.5, 0.12),
    "bat_yam":      ("shaked", 4.0, 5.5, 0.12),
    "חולון":        ("shaked", 4.0, 5.5, 0.12),
    "holon":        ("shaked", 4.0, 5.5, 0.12),
    "רמת גן":      ("shaked", 4.0, 5.5, 0.12),
    "ramat_gan":    ("shaked", 4.0, 5.5, 0.12),
    "גבעתיים":     ("shaked", 4.0, 5.5, 0.12),
    "givatayim":    ("shaked", 4.0, 5.5, 0.12),
    "בני ברק":      ("shaked", 4.0, 5.5, 0.12),
    "bnei_brak":    ("shaked", 4.0, 5.5, 0.12),
    "כפר סבא":      ("shaked", 4.0, 5.5, 0.12),
    "kfar_saba":    ("shaked", 4.0, 5.5, 0.12),
    "הוד השרון":    ("shaked", 4.0, 5.5, 0.12),
    "hod_hasharon": ("shaked", 4.0, 5.5, 0.12),
}


def build_renewal_policy(city: str, as_of: datetime.date) -> RenewalPolicy:
    """
    Look up the applicable renewal track and multipliers for a city.

    TODO: Replace with DB/config-file lookup.  Currently uses a
    hardcoded dictionary covering major Israeli cities.
    """
    city_lower = city.strip().lower()

    # Try exact match first, then partial
    config = _CITY_RENEWAL_CONFIG.get(city)
    if config is None:
        config = _CITY_RENEWAL_CONFIG.get(city_lower)
    if config is None:
        # Try matching against lowercase keys
        for key, val in _CITY_RENEWAL_CONFIG.items():
            if key.lower() == city_lower:
                config = val
                break

    if config is None:
        # Default: TAMA 38 extension with moderate multipliers
        return RenewalPolicy(
            track=RenewalTrack.TAMA38_EXTENSION,
            max_multiplier_core=3.5,
            max_multiplier_periphery=5.0,
            public_built_share=0.10,
        )

    track_str, core_m, periph_m, pub_share = config
    track = (
        RenewalTrack.SHAKED_ALTERNATIVE
        if track_str == "shaked"
        else RenewalTrack.TAMA38_EXTENSION
    )

    return RenewalPolicy(
        track=track,
        max_multiplier_core=core_m,
        max_multiplier_periphery=periph_m,
        public_built_share=pub_share,
    )


# ─── National veto application ──────────────────────────────────────


def apply_national_veto(
    ctx: EffectiveRightsContext,
    spatial: SpatialProfile,
    freeze: FreezeStatus,
) -> None:
    """
    Apply national-level vetoes to the context:
      - Metro core → block TAMA 38
      - Full freeze → block all building
      - TAMA 38 freeze → block TAMA 38
      - Density freeze → cap units
      - RATA height cone → cap floors
      - Strict preservation → hard block
    """
    # Metro core — TAMA 38 absolutely blocked
    if is_tama38_absolutely_blocked(spatial):
        ctx.can_build_tama38 = False
        ctx.red_flags.append(RedFlag(
            code="METRO_CORE_BLOCK",
            severity=RedFlagSeverity.HARD_BLOCK,
            message="Parcel is within 100 m of Metro station (TAMA 70 core). "
                    "TAMA 38 permits are absolutely blocked.",
            source="override_engine / TAMA 70",
        ))

    # Metro ring 1 — requires special approval
    if requires_special_metro_approval(spatial):
        ctx.red_flags.append(RedFlag(
            code="METRO_RING1_APPROVAL",
            severity=RedFlagSeverity.ATTENTION,
            message="Parcel is within 100–300 m of Metro station. "
                    "Building permits require special NTA/Metro approval.",
            source="override_engine / TAMA 70",
        ))

    # Full freeze — block all baseline and addition
    if freeze.is_full_freeze:
        ctx.can_build_baseline = False
        ctx.can_build_tama38 = False
        ctx.can_add_floors = False
        ctx.can_add_units = False
        ctx.red_flags.append(RedFlag(
            code="FULL_FREEZE",
            severity=RedFlagSeverity.HARD_BLOCK,
            message="Active §78 full freeze — all building permits are blocked.",
            source="override_engine / §78",
        ))

    # TAMA 38 freeze
    if freeze.is_tama38_blocked and not freeze.is_full_freeze:
        ctx.can_build_tama38 = False
        ctx.red_flags.append(RedFlag(
            code="TAMA38_FREEZE",
            severity=RedFlagSeverity.HARD_BLOCK,
            message="Active freeze blocking TAMA 38 permits.",
            source="override_engine / §77-78",
        ))

    # Density cap
    if freeze.density_capped:
        ctx.density_cap = freeze.density_cap_value
        ctx.can_add_units = False
        ctx.red_flags.append(RedFlag(
            code="DENSITY_CAP",
            severity=RedFlagSeverity.STRONG_RISK,
            message=f"Active density cap: max {freeze.density_cap_value} units/dunam. "
                    "Cannot add units beyond cap.",
            source="override_engine / §77",
        ))

    # RATA height cone
    if has_height_veto(spatial):
        ctx.can_add_floors = False
        ctx.red_flags.append(RedFlag(
            code="RATA_HEIGHT_VETO",
            severity=RedFlagSeverity.HARD_BLOCK,
            message="RATA airport height-cone restriction in effect. "
                    "Cannot add floors beyond current height limit.",
            source="override_engine / RATA NOP",
        ))

    # Strict preservation
    if has_strict_preservation(spatial):
        ctx.can_build_baseline = False
        ctx.can_build_tama38 = False
        ctx.can_add_floors = False
        ctx.can_add_units = False
        ctx.red_flags.append(RedFlag(
            code="HERITAGE_STRICT",
            severity=RedFlagSeverity.HARD_BLOCK,
            message="Strict heritage preservation zone — "
                    "no demolition or additional construction permitted.",
            source="override_engine / Heritage",
        ))


# ─── Plan constraints application ──────────────────────────────────


def apply_plan_constraints(
    ctx: EffectiveRightsContext,
    constraints: List[PlanConstraint],
) -> None:
    """
    Apply the plan hierarchy to the context.

    Rules:
      - Section 23 plan: store in context, disable TAMA 38 stacking
        (unless the plan explicitly allows it — not modelled yet).
      - Baseline plan: store in context.
      - Thematic plans: apply height/density caps (take the minimum).
      - National veto plans: apply caps.
    """
    for constraint in constraints:
        # Store Section 23 plan
        if constraint.level == PlanLevel.SECTION_23:
            ctx.section_23_plan = constraint
            # Section 23 plans typically override TAMA 38 stacking
            ctx.can_build_tama38 = False
            ctx.red_flags.append(RedFlag(
                code="SECTION_23_NO_STACKING",
                severity=RedFlagSeverity.ATTENTION,
                message=f"Section 23 plan '{constraint.plan_id}' overrides TAMA 38 stacking.",
                source="override_engine / Section 23",
            ))

        # Store baseline plan
        if constraint.level == PlanLevel.DETAILED_BASELINE:
            ctx.baseline_plan = constraint

        # Route caps to the correct tier based on plan level
        is_national = constraint.level == PlanLevel.NATIONAL_VETO

        # Apply height caps
        if constraint.height_cap_m is not None:
            if is_national:
                if ctx.national_height_cap_m is None:
                    ctx.national_height_cap_m = constraint.height_cap_m
                else:
                    ctx.national_height_cap_m = min(ctx.national_height_cap_m, constraint.height_cap_m)
            else:
                if ctx.plan_height_cap_m is None:
                    ctx.plan_height_cap_m = constraint.height_cap_m
                else:
                    ctx.plan_height_cap_m = min(ctx.plan_height_cap_m, constraint.height_cap_m)

        # Apply floor caps
        if constraint.max_floors is not None:
            if is_national:
                if ctx.national_max_floors is None:
                    ctx.national_max_floors = constraint.max_floors
                else:
                    ctx.national_max_floors = min(ctx.national_max_floors, constraint.max_floors)
            else:
                if ctx.plan_max_floors is None:
                    ctx.plan_max_floors = constraint.max_floors
                else:
                    ctx.plan_max_floors = min(ctx.plan_max_floors, constraint.max_floors)

        # Apply density caps (plan-level — freeze density caps are separate)
        if constraint.density_cap is not None:
            if ctx.plan_density_cap is None:
                ctx.plan_density_cap = constraint.density_cap
            else:
                ctx.plan_density_cap = min(ctx.plan_density_cap, constraint.density_cap)
