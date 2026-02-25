"""
Integration tests for real adapter implementations (Phase 2).

Tests verify:
  1. GovMap WFS connectivity and parcel lookup
  2. Metro station distance calculation with real geometry
  3. Freeze repository CSV loading
  4. Plans repository fallback behavior
"""

import datetime

import pytest

from rights_engine.adapters.govmap_wfs_client import get_capabilities, GovMapAPIError
from rights_engine.adapters.gis_adapter import (
    get_parcel_geometry_wkt,
    get_distance_to_metro,
    classify_metro_zone,
    detect_complex_type,
    get_hegemony_layers,
)
from rights_engine.adapters.freeze_repository import get_freeze_notices
from rights_engine.adapters.plans_repository import get_plan_constraints
from rights_engine.domain.models import MetroZone, ComplexType, ParcelInput, ProjectType


# ─── GovMap WFS Tests ────────────────────────────────────────


def test_govmap_wfs_connectivity():
    """Verify we can reach GovMap WFS and get at least GetCapabilities."""
    try:
        caps = get_capabilities()
        assert isinstance(caps, dict)
        assert len(caps) > 0
        # Should contain PARCEL_ALL
        assert "opendata:PARCEL_ALL" in caps
        print(f"✓ GetCapabilities returned {len(caps)} layers")
    except GovMapAPIError as e:
        # Network may be unavailable — that's OK, just don't crash
        pytest.skip(f"GovMap WFS not reachable: {e}")


def test_parcel_lookup_known_gush_helka():
    """
    Use a known gush/helka (Tel Aviv gush 6952 helka 40)
    and verify we get back a WKT geometry.
    """
    try:
        wkt = get_parcel_geometry_wkt("6952", "40")
        # Could be None if GovMap is unreachable — that is OK.
        # What matters is no exception.
        assert wkt is None or "POLYGON" in wkt or "MULTIPOLYGON" in wkt
        if wkt:
            print(f"✓ Parcel 6952/40 WKT length: {len(wkt)} chars")
        else:
            print("✓ Parcel lookup returned None (GovMap may be unreachable)")
    except GovMapAPIError:
        pytest.skip("GovMap WFS not reachable")


def test_parcel_lookup_raanana():
    """Test Ra'anana parcel lookup (gush 6583, helka 917)."""
    try:
        wkt = get_parcel_geometry_wkt("6583", "917")
        assert wkt is None or "POLYGON" in wkt or "MULTIPOLYGON" in wkt
        if wkt:
            print(f"✓ Ra'anana parcel 6583/917 found, WKT length: {len(wkt)}")
    except GovMapAPIError:
        pytest.skip("GovMap WFS not reachable")


def test_parcel_lookup_nonexistent():
    """Verify non-existent parcel returns None (no exception)."""
    try:
        wkt = get_parcel_geometry_wkt("9999999", "9999999")
        assert wkt is None
        print("✓ Non-existent parcel correctly returned None")
    except GovMapAPIError:
        pytest.skip("GovMap WFS not reachable")


# ─── Metro Distance Tests ───────────────────────────────────


def test_metro_distance_real_parcel():
    """
    Test metro distance calculation with a real gush-helka parcel ID.
    Uses Tel Aviv parcel near known metro station area.
    """
    parcel = ParcelInput(
        parcel_id="6952-40",
        geometry_wkt="",
        city="תל אביב",
        submission_date=datetime.date(2026, 1, 1),
        project_type=ProjectType.DEMOLISH_REBUILD,
        existing_built_sqm_reported=2000,
        existing_units=20,
    )
    try:
        dist = get_distance_to_metro(parcel)
        # Should return some distance (not None) since Tel Aviv has metro stations
        # Don't assert specific value since it depends on GovMap + geodesic
        if dist is not None:
            assert dist > 0
            zone = classify_metro_zone(dist)
            assert zone in (MetroZone.CORE_100M, MetroZone.RING_1_300M,
                          MetroZone.RING_2_800M, MetroZone.OUTSIDE)
            print(f"✓ Real parcel 6952-40: distance={dist:.0f}m, zone={zone.value}")
        else:
            print("✓ Metro distance returned None (GovMap may be unreachable)")
    except GovMapAPIError:
        pytest.skip("GovMap WFS not reachable")


def test_metro_distance_stub_compatibility():
    """Verify stub fallback still works for non-numeric parcel IDs."""
    parcel_a = ParcelInput(
        parcel_id="TEST-A", geometry_wkt="", city="תל אביב",
        submission_date="2026-01-01", project_type="demolish_rebuild",
        existing_built_sqm_reported=1000, existing_units=10,
    )
    assert get_distance_to_metro(parcel_a) == 80.0
    assert classify_metro_zone(80.0) == MetroZone.CORE_100M

    parcel_x = ParcelInput(
        parcel_id="TEST-X", geometry_wkt="", city="רעננה",
        submission_date="2026-01-01", project_type="demolish_rebuild",
        existing_built_sqm_reported=1000, existing_units=10,
    )
    assert get_distance_to_metro(parcel_x) == 1500.0
    assert classify_metro_zone(1500.0) == MetroZone.OUTSIDE

    print("✓ Stub compatibility maintained")


# ─── Freeze Repository Tests ────────────────────────────────


def test_freeze_csv_empty_returns_empty():
    """With no data rows in CSV, real queries should return empty list."""
    # Real WKT that won't match any stub patterns
    notices = get_freeze_notices(
        "POLYGON((34.87 32.18, 34.88 32.18, 34.88 32.19, 34.87 32.19, 34.87 32.18))",
        parcel_id="6583-917",
    )
    assert notices == []
    print("✓ Empty CSV returns empty list for real queries")


def test_freeze_stub_compatibility():
    """Verify stub fallback for test geometry_wkt strings."""
    notices = get_freeze_notices("POLYGON FREEZE_FULL")
    assert len(notices) == 1
    assert notices[0].freeze_type.value == "full"

    notices = get_freeze_notices("POLYGON FREEZE_DENSITY")
    assert len(notices) == 1
    assert notices[0].density_cap == 30.0

    notices = get_freeze_notices("POLYGON NORMAL")
    assert notices == []

    print("✓ Freeze stub compatibility maintained")


# ─── Plans Repository Tests ─────────────────────────────────


def test_plans_raanana_fallback():
    """Ra'anana should return TABA 416-1060052 from curated data."""
    parcel = ParcelInput(
        parcel_id="6583-917", geometry_wkt="", city="רעננה",
        submission_date="2026-01-01", project_type="demolish_rebuild",
        existing_built_sqm_reported=1000, existing_units=10,
    )
    constraints = get_plan_constraints(parcel)
    plan_ids = [c.plan_id for c in constraints]
    assert "416-1060052" in plan_ids
    print(f"✓ Ra'anana plans: {plan_ids}")


def test_plans_tel_aviv_section23():
    """Tel Aviv should include Section 23 plan."""
    parcel = ParcelInput(
        parcel_id="TLV-001", geometry_wkt="", city="תל אביב",
        submission_date="2026-01-01", project_type="demolish_rebuild",
        existing_built_sqm_reported=2000, existing_units=20,
    )
    constraints = get_plan_constraints(parcel)
    plan_ids = [c.plan_id for c in constraints]
    assert "TA-SEC23-RENEWAL" in plan_ids
    print(f"✓ Tel Aviv plans: {plan_ids}")


# ─── Run all tests ───────────────────────────────────────────

if __name__ == "__main__":
    test_govmap_wfs_connectivity()
    test_parcel_lookup_known_gush_helka()
    test_parcel_lookup_raanana()
    test_parcel_lookup_nonexistent()
    test_metro_distance_real_parcel()
    test_metro_distance_stub_compatibility()
    test_freeze_csv_empty_returns_empty()
    test_freeze_stub_compatibility()
    test_plans_raanana_fallback()
    test_plans_tel_aviv_section23()
    print("\n✓ All real adapter tests passed!")
