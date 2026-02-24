"""
Integration tests for the Israeli Building Rights Decision Engine.

Tests cover the full pipeline via evaluate_parcel() for various scenarios:
  1. Metro core parcel with full freeze — TAMA 38 blocked, Shaked available
  2. Metro ring 1 parcel with density cap — TAMA 38 blocked by Section 23
  3. Normal parcel outside Metro — all alternatives available
  4. Strict preservation — hard block on everything
  5. Periphery city with high multiplier
"""

import json

from rights_engine.api.evaluate import evaluate_parcel


# ─── Scenario 1: Metro core + full freeze ───────────────────────────
# Parcel ending "A" → Metro core (80 m)
# geometry_wkt containing "FREEZE_FULL" → full freeze active
# City: Tel Aviv → Shaked Alternative available

def test_metro_core_full_freeze():
    """
    Metro core (100 m) parcel in Tel Aviv with a full §78 freeze.
    Expected:
      - Baseline alternative exists
      - Shaked alternative exists (Shaked is independent of freeze for evaluation)
      - TAMA 38 alternative is blocked (both by Metro core AND full freeze)
      - Red flags include:
        - METRO_CORE_BLOCK (hard block)
        - FULL_FREEZE (hard block)
        - METRO_LEVY (strong risk — Metro betterment levy)
    """
    request = {
        "parcel_id": "TLV-001-A",          # ends with A → Metro core
        "geometry_wkt": "POLYGON FREEZE_FULL",  # triggers full freeze
        "city": "תל אביב",
        "submission_date": "2025-11-15",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 2400,
        "existing_units": 24,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    # Spatial profile
    assert result["spatial_profile"]["metro_zone"] == "core_100m"
    assert result["spatial_profile"]["complex_type"] == "urban_renewal_complex"  # 24 units
    assert result["spatial_profile"]["distance_to_metro_m"] == 80.0

    # Freeze
    assert result["freeze_status"]["is_full_freeze"] is True
    assert result["freeze_status"]["is_tama38_blocked"] is True

    # Alternatives
    alt_names = [a["name"] for a in result["alternatives"]]
    assert "Baseline TABA" in alt_names
    assert "TAMA 38 Extension" not in alt_names  # blocked
    assert "Shaked Alternative (Amendment 139)" in alt_names

    # Red flags
    flag_codes = [f["code"] for f in result["red_flags"]]
    assert "METRO_CORE_BLOCK" in flag_codes
    assert "FULL_FREEZE" in flag_codes
    assert "METRO_LEVY" in flag_codes

    # Severity checks
    flag_by_code = {f["code"]: f for f in result["red_flags"]}
    assert flag_by_code["METRO_CORE_BLOCK"]["severity"] == "hard_block"
    assert flag_by_code["FULL_FREEZE"]["severity"] == "hard_block"
    assert flag_by_code["METRO_LEVY"]["severity"] == "strong_risk"

    # Shaked alternative should use 4.0× multiplier (core city)
    shaked = next(a for a in result["alternatives"] if "Shaked" in a["name"])
    assert shaked["residential_sqm"] > 0
    assert shaked["public_built_sqm"] > 0
    assert "4.0×" in shaked["notes"]

    print("✓ test_metro_core_full_freeze passed")


# ─── Scenario 2: Ring 1 + Section 23 + density cap ─────────────────

def test_ring1_section23_density_cap():
    """
    Metro ring 1 (200 m) parcel in Tel Aviv with a density-cap freeze.
    Tel Aviv has a Section 23 plan → TAMA 38 stacking disabled.
    Expected:
      - TAMA 38 blocked (Section 23 no-stacking rule)
      - Shaked available
      - Density cap red flag
      - Metro ring 1 attention flag
    """
    request = {
        "parcel_id": "TLV-002-B",          # ends with B → ring 1 (200 m)
        "geometry_wkt": "POLYGON FREEZE_DENSITY",
        "city": "תל אביב",
        "submission_date": "2025-08-01",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 1600,
        "existing_units": 16,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    assert result["spatial_profile"]["metro_zone"] == "ring_1_300m"

    # TAMA 38 should be blocked by Section 23
    alt_names = [a["name"] for a in result["alternatives"]]
    assert "TAMA 38 Extension" not in alt_names
    assert "Shaked Alternative (Amendment 139)" in alt_names

    # Red flags
    flag_codes = [f["code"] for f in result["red_flags"]]
    assert "SECTION_23_NO_STACKING" in flag_codes
    assert "DENSITY_CAP" in flag_codes
    assert "METRO_LEVY" in flag_codes

    print("✓ test_ring1_section23_density_cap passed")


# ─── Scenario 3: Normal parcel outside Metro ────────────────────────

def test_normal_parcel_outside_metro():
    """
    Parcel outside Metro influence in Ra'anana.
    Expected:
      - All three alternatives available
      - No Metro-related red flags
      - Baseline references Ra/Ra/B plan
    """
    request = {
        "parcel_id": "RAN-005-X",          # ends with X → outside Metro
        "geometry_wkt": "POLYGON NORMAL",
        "city": "רעננה",
        "submission_date": "2025-12-01",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 1200,
        "existing_units": 12,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    assert result["spatial_profile"]["metro_zone"] == "outside"

    alt_names = [a["name"] for a in result["alternatives"]]
    assert "Baseline TABA" in alt_names
    assert "TAMA 38 Extension" in alt_names
    assert "Shaked Alternative (Amendment 139)" in alt_names

    # No Metro red flags
    flag_codes = [f["code"] for f in result["red_flags"]]
    assert "METRO_CORE_BLOCK" not in flag_codes
    assert "METRO_LEVY" not in flag_codes

    # Baseline should reference Ra/Ra/B
    baseline = next(a for a in result["alternatives"] if a["name"] == "Baseline TABA")
    assert "416-1060052" in baseline["notes"]

    print("✓ test_normal_parcel_outside_metro passed")


# ─── Scenario 4: Strict preservation ────────────────────────────────

def test_strict_preservation():
    """
    Parcel with PRES in ID → strict preservation layer.
    Expected:
      - Everything blocked
      - Heritage red flags
    """
    request = {
        "parcel_id": "TLV-PRES-001-X",
        "geometry_wkt": "POLYGON NORMAL",
        "city": "תל אביב",
        "submission_date": "2025-06-01",
        "project_type": "addition_existing",
        "existing_built_sqm_reported": 800,
        "existing_units": 8,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    # Heritage strict layer should be present
    assert "STRICT_PRESERVATION" in result["spatial_profile"]["hegemony_layers"]

    # TAMA 38 should be blocked
    alt_names = [a["name"] for a in result["alternatives"]]
    assert "TAMA 38 Extension" not in alt_names

    # Heritage red flags
    flag_codes = [f["code"] for f in result["red_flags"]]
    assert "HERITAGE_STRICT" in flag_codes

    print("✓ test_strict_preservation passed")


# ─── Scenario 5: Periphery city — high Shaked multiplier ────────────

def test_periphery_high_multiplier():
    """
    Beer Sheva (periphery) — should get 5.5× Shaked multiplier.
    """
    request = {
        "parcel_id": "BS-010-X",
        "geometry_wkt": "POLYGON NORMAL",
        "city": "באר שבע",
        "submission_date": "2025-11-01",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 2000,
        "existing_units": 20,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    # Shaked should be present with 5.5× multiplier
    shaked = next(
        (a for a in result["alternatives"] if "Shaked" in a["name"]),
        None,
    )
    assert shaked is not None
    assert "5.5×" in shaked["notes"]
    # Residential area should be significantly larger than existing
    assert shaked["residential_sqm"] > 2000 * 4  # at least 4× existing

    # Public share should be 15% for Beer Sheva
    assert result["renewal_policy"]["public_built_share"] == 0.15

    print("✓ test_periphery_high_multiplier passed")


# ─── Scenario 6: Pre-reform submission date ─────────────────────────

def test_pre_reform_submission_date():
    """
    Submission date before 30.10.2025 → separated area model.
    """
    request = {
        "parcel_id": "RAN-PRE-X",
        "geometry_wkt": "POLYGON NORMAL",
        "city": "רעננה",
        "submission_date": "2025-06-01",  # Before cutoff
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 1500,
        "existing_units": 15,
        "as_of": "2026-01-15",
    }

    result = evaluate_parcel(request)

    shaked = next(
        (a for a in result["alternatives"] if "Shaked" in a["name"]),
        None,
    )
    assert shaked is not None
    assert "Separated area model" in shaked["notes"]
    assert shaked["service_sqm"] > 0  # Should have separate service area

    print("✓ test_pre_reform_submission_date passed")


# ─── Run all tests ──────────────────────────────────────────────────

if __name__ == "__main__":
    test_metro_core_full_freeze()
    test_ring1_section23_density_cap()
    test_normal_parcel_outside_metro()
    test_strict_preservation()
    test_periphery_high_multiplier()
    test_pre_reform_submission_date()
    print("\n✓ All tests passed!")
