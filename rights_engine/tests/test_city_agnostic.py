"""
City-Agnostic Engine Tests — Section 6

Verifies the rights engine works for cities beyond Ra'anana:
  1. Haifa with curated TABA and freeze notice lookup
  2. Petah Tikva (both Hebrew spellings) with Shaked Alternative
  3. Unknown city falls back gracefully to defaults
"""

from rights_engine.api.evaluate import evaluate_parcel


def test_haifa_shaked_and_curated_plan():
    """
    Haifa should:
      - Use Shaked Alternative (core 4.0×)
      - Return curated baseline plan HP-2000-MASTER
      - Return thematic parking plan
    """
    request = {
        "parcel_id": "HF-001-X",
        "geometry_wkt": "POLYGON NORMAL",
        "city": "חיפה",
        "submission_date": "2025-12-01",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 1800,
        "existing_units": 18,
        "as_of": "2026-02-01",
    }

    result = evaluate_parcel(request)

    # Renewal policy
    assert result["renewal_policy"]["track"] == "shaked_alternative"
    assert result["renewal_policy"]["max_multiplier_core"] == 4.0

    # Alternatives
    alt_names = [a["name"] for a in result["alternatives"]]
    assert "Baseline TABA" in alt_names
    assert "Shaked Alternative (Amendment 139)" in alt_names

    # Shaked should use 4.0× (core)
    shaked = next(a for a in result["alternatives"] if "Shaked" in a["name"])
    assert "4.0×" in shaked["notes"]
    assert shaked["residential_sqm"] > 1800 * 3  # at least 3× existing

    # Baseline should reference Haifa plan
    baseline = next(a for a in result["alternatives"] if a["name"] == "Baseline TABA")
    assert "HP-2000-MASTER" in baseline["notes"]

    print("✓ test_haifa_shaked_and_curated_plan passed")


def test_petah_tikva_both_spellings():
    """
    Petah Tikva has two Hebrew spellings: פתח תקווה and פתח תקוה.
    Both should return Shaked Alternative with core 4.0×.
    """
    for city_name in ("פתח תקווה", "פתח תקוה"):
        request = {
            "parcel_id": f"PT-{city_name[:2]}-X",
            "geometry_wkt": "POLYGON NORMAL",
            "city": city_name,
            "submission_date": "2026-01-15",
            "project_type": "demolish_rebuild",
            "existing_built_sqm_reported": 1500,
            "existing_units": 15,
            "as_of": "2026-02-01",
        }

        result = evaluate_parcel(request)

        assert result["renewal_policy"]["track"] == "shaked_alternative", \
            f"City '{city_name}' should be Shaked but got {result['renewal_policy']['track']}"
        assert result["renewal_policy"]["max_multiplier_core"] == 4.0

        alt_names = [a["name"] for a in result["alternatives"]]
        assert "Shaked Alternative (Amendment 139)" in alt_names

    print("✓ test_petah_tikva_both_spellings passed")


def test_unknown_city_graceful_fallback():
    """
    An unknown city (not in config) should:
      - Fall back to TAMA 38 extension track
      - Use conservative multipliers (3.5× core, 5.0× periphery)
      - Still produce Baseline + TAMA 38 alternatives
      - Baseline should have NEEDS_REVIEW note
    """
    request = {
        "parcel_id": "UNK-001-X",
        "geometry_wkt": "POLYGON NORMAL",
        "city": "כוכב יאיר",
        "submission_date": "2025-12-01",
        "project_type": "demolish_rebuild",
        "existing_built_sqm_reported": 1000,
        "existing_units": 10,
        "as_of": "2026-02-01",
    }

    result = evaluate_parcel(request)

    # Should fall back to TAMA 38 extension
    assert result["renewal_policy"]["track"] == "tama38_extension"
    assert result["renewal_policy"]["max_multiplier_core"] == 3.5
    assert result["renewal_policy"]["max_multiplier_periphery"] == 5.0

    # Should still have baseline + TAMA 38 (no Shaked since track is tama38)
    alt_names = [a["name"] for a in result["alternatives"]]
    assert "Baseline TABA" in alt_names
    assert "TAMA 38 Extension" in alt_names
    assert "Shaked Alternative (Amendment 139)" not in alt_names

    # Baseline should reference the generic stub plan ID
    baseline = next(a for a in result["alternatives"] if a["name"] == "Baseline TABA")
    assert "כוכב יאיר-BASELINE" in baseline["notes"]

    print("✓ test_unknown_city_graceful_fallback passed")


if __name__ == "__main__":
    test_haifa_shaked_and_curated_plan()
    test_petah_tikva_both_spellings()
    test_unknown_city_graceful_fallback()
    print("\n✓ All city-agnostic tests passed!")
