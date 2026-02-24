"""
Rights Calculators (Step 4 — compute alternatives)

Produces up to three RightsAlternative objects:
  1. Baseline TABA — what the current detailed plan allows.
  2. TAMA 38 Extension — standard TAMA 38 addition/reinforcement.
  3. Shaked Alternative (Amendment 139) — new multiplier-based track.

Each calculator respects the caps and flags in EffectiveRightsContext.
"""

from __future__ import annotations

import datetime
from typing import Optional

from rights_engine.domain.models import (
    ParcelInput,
    ProjectType,
    RenewalTrack,
    RightsAlternative,
)
from rights_engine.services.area_base_service import ExistingAreaBreakdown
from rights_engine.services.override_engine import EffectiveRightsContext


# ─── Baseline TABA alternative ──────────────────────────────────────


def calc_baseline_taba_alternative(
    existing: ExistingAreaBreakdown,
    ctx: EffectiveRightsContext,
) -> RightsAlternative:
    """
    Calculate the baseline rights under the current detailed plan.

    This is a simplified stub: the baseline residential area equals
    the existing main area (i.e. no expansion beyond what's already built).
    In production, this would parse the TABA's FAR, coverage, and
    coefficient tables.

    TODO: Implement full TABA parsing with coverage/coefficient per
    the specific plan (e.g. Ra/Ra/B for Ra'anana, etc.).
    """
    residential = existing.main_sqm
    service = existing.service_sqm

    # Apply floor cap if present (both national + plan caps apply to baseline)
    effective_floors = ctx.effective_max_floors
    if effective_floors is not None:
        # Stub: assume 80 sqm per unit per floor, 4 units/floor
        max_area_from_floors = effective_floors * 4 * 80
        residential = min(residential, max_area_from_floors)

    return RightsAlternative(
        name="Baseline TABA",
        residential_sqm=residential,
        service_sqm=service,
        notes=(
            f"Existing area per current plan. "
            f"Baseline plan: {ctx.baseline_plan.plan_id if ctx.baseline_plan else 'unknown'}. "
            f"Height cap: {ctx.effective_height_cap_m or 'none'} m. "
            f"Max floors: {effective_floors or 'none'}."
        ),
    )


# ─── TAMA 38 Extension alternative ─────────────────────────────────


def calc_tama38_alternative(
    parcel: ParcelInput,
    existing: ExistingAreaBreakdown,
    ctx: EffectiveRightsContext,
) -> Optional[RightsAlternative]:
    """
    Calculate TAMA 38 extension rights.

    Returns None if TAMA 38 is blocked (by Metro core, freeze, or
    Section 23 override).

    TODO: Replace the placeholder +50% with the actual TAMA 38 table
    (25 sqm per unit + 13 sqm shared per floor, etc.).
    """
    if not ctx.can_build_tama38:
        return None

    if ctx.renewal_policy and ctx.renewal_policy.track == RenewalTrack.SHAKED_ALTERNATIVE:
        # Shaked cities may still allow TAMA 38, but typically the
        # Shaked path is preferred.  We still compute it for comparison.
        pass

    # Placeholder: TAMA 38 typically adds ~50% residential area
    tama38_addition = existing.main_sqm * 0.50
    residential = existing.main_sqm + tama38_addition
    service = existing.service_sqm * 1.2  # slight increase for new stairs/lobby

    # Apply floor/height caps (both national + plan-level apply to TAMA 38)
    effective_floors = ctx.effective_max_floors
    if effective_floors is not None:
        max_area_from_floors = effective_floors * 4 * 80
        residential = min(residential, max_area_from_floors)

    notes = (
        f"TAMA 38 extension: +50% of existing {existing.main_sqm:.0f} sqm. "
        f"Height cap: {ctx.effective_height_cap_m or 'none'} m. "
        "NOTE: This is a simplified placeholder. Real calculation requires "
        "TAMA 38 table lookup (25 sqm/unit + 13 sqm shared/floor)."
    )

    return RightsAlternative(
        name="TAMA 38 Extension",
        residential_sqm=residential,
        service_sqm=service,
        estimated_units=parcel.existing_units + max(1, int(tama38_addition / 80)),
        notes=notes,
    )


# ─── Shaked Alternative (Amendment 139) ────────────────────────────

# Cut-off date: projects submitted on or after this date use the
# "total area" model (no separation of main vs service area).
SHAKED_TOTAL_AREA_CUTOFF = datetime.date(2025, 10, 30)


def calc_shaked_alternative(
    parcel: ParcelInput,
    existing: ExistingAreaBreakdown,
    ctx: EffectiveRightsContext,
    in_periphery_or_seismic_zone: bool = False,
) -> Optional[RightsAlternative]:
    """
    Calculate Shaked Alternative (Amendment 139) rights.

    Returns None if the renewal track is not SHAKED_ALTERNATIVE.

    Key rules:
      - Core cities: multiplier up to 400% of existing lawful area.
      - Periphery / seismic: multiplier up to 550%.
      - Public built share: 10–15% of total for public uses.
      - Submission date ≥ 30.10.2025: "total area" model
        (no separation of main vs service).
      - Addition to existing: keep a simple service area calculation.
      - Demolish+rebuild: all new construction.
    """
    if ctx.renewal_policy is None:
        return None
    if ctx.renewal_policy.track != RenewalTrack.SHAKED_ALTERNATIVE:
        return None

    # Select multiplier
    if in_periphery_or_seismic_zone:
        multiplier = ctx.renewal_policy.max_multiplier_periphery
    else:
        multiplier = ctx.renewal_policy.max_multiplier_core

    # Base area for calculation
    base_area = existing.total_sqm

    # Total permitted area
    total_permitted = base_area * multiplier

    # Public share
    public_share = ctx.renewal_policy.public_built_share
    public_sqm = total_permitted * public_share
    residential_sqm = total_permitted - public_sqm

    # Service area logic depends on submission date and project type
    service_sqm = 0.0
    if parcel.submission_date >= SHAKED_TOTAL_AREA_CUTOFF:
        # Post-cutoff: "total area" model — no separation
        # Service area is included in the total; we don't break it out
        notes_model = "Total area model (post-30.10.2025 reform)"
    else:
        # Pre-cutoff: separate service area
        if parcel.project_type == ProjectType.ADDITION_EXISTING:
            service_sqm = existing.service_sqm * 1.5
        else:
            service_sqm = residential_sqm * 0.15
        residential_sqm -= service_sqm
        notes_model = "Separated area model (pre-reform)"

    # Shaked Alternative OVERRIDES plan-level caps (TABA, thematic).
    # Only national-level caps (RATA height cones, etc.) still apply.
    if ctx.national_max_floors is not None:
        max_area_from_floors = ctx.national_max_floors * 4 * 80
        residential_sqm = min(residential_sqm, max_area_from_floors)

    estimated_units = max(1, int(residential_sqm / 80))

    notes = (
        f"Shaked Alternative (Amendment 139): "
        f"{multiplier:.1f}× of existing {base_area:.0f} sqm = "
        f"{total_permitted:.0f} sqm total. "
        f"Public share: {public_share:.0%} = {public_sqm:.0f} sqm. "
        f"Model: {notes_model}. "
        f"Project type: {parcel.project_type.value}."
    )

    return RightsAlternative(
        name="Shaked Alternative (Amendment 139)",
        residential_sqm=residential_sqm,
        public_built_sqm=public_sqm,
        service_sqm=service_sqm,
        estimated_units=estimated_units,
        notes=notes,
    )
