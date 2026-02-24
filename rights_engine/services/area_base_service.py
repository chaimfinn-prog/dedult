"""
Area Base Service (Step 4 — existing area breakdown)

Determines the existing lawful built area for a parcel, broken into:
  - main_sqm:           Residential / main-use area
  - service_sqm:        Measured service areas (lobbies, stairs, storage)
  - hidden_service_sqm: Un-measured service areas from legacy plans (OCR/NLP)

In this first version, we trust the reported figure and stub the rest.
"""

from __future__ import annotations

from dataclasses import dataclass

from rights_engine.domain.models import ParcelInput, PlanConstraint


@dataclass
class ExistingAreaBreakdown:
    """Breakdown of existing lawful built area."""
    main_sqm: float
    service_sqm: float = 0.0
    hidden_service_sqm: float = 0.0

    @property
    def total_sqm(self) -> float:
        return self.main_sqm + self.service_sqm + self.hidden_service_sqm


def compute_existing_area(
    parcel: ParcelInput,
    baseline_plan: PlanConstraint | None = None,
) -> ExistingAreaBreakdown:
    """
    Compute the existing area breakdown for a parcel.

    Current implementation:
      - Trusts `parcel.existing_built_sqm_reported` as main area.
      - Sets service and hidden service to 0.

    TODO: Integrate with:
      - Tabu (land registry) records for measured areas.
      - OCR / NLP pipeline on legacy TABA text to extract service
        area definitions that may add "hidden" buildable area.
      - Arnona (municipal tax) records as a cross-check.
      - Building permit files for as-built measurements.
    """
    return ExistingAreaBreakdown(
        main_sqm=parcel.existing_built_sqm_reported,
        service_sqm=0.0,
        hidden_service_sqm=0.0,
    )
