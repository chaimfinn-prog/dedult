#!/usr/bin/env python3
"""
PropCheck Scrapers — Example Usage
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Run:  python -m scrapers.example_usage
"""

import json
import logging

# Set up logging so you can see retry messages and progress
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

from scrapers import MavatScraper, TaxAuthorityScraper


def example_mavat():
    """Demonstrate Mavat (planning information) scraping."""

    print("\n" + "=" * 60)
    print("  MAVAT — Israel Planning Administration (תב\"ע)")
    print("=" * 60)

    # Using context manager ensures browser is closed on exit
    with MavatScraper(headless=True) as mavat:

        # ── Search by address ──
        print("\n▸ Searching by address: הרצל 10, תל אביב")
        plans = mavat.search_by_address("הרצל 10, תל אביב")
        print(f"  Found {len(plans)} plans:")
        for p in plans[:3]:  # show first 3
            print(f"    • {p['plan_number']} — {p['plan_name']} [{p['status']}]")

        # Save to JSON
        if plans:
            mavat.save_to_json(plans, "mavat_herzl_tel_aviv.json")

        # ── Search by Gush/Helka ──
        print("\n▸ Searching by gush=6158, helka=30")
        plans = mavat.search_by_gush_helka("6158", "30")
        print(f"  Found {len(plans)} plans:")
        for p in plans[:3]:
            print(f"    • {p['plan_number']} — {p['plan_name']} [{p['status']}]")


def example_tax_authority():
    """Demonstrate Tax Authority (transaction history) scraping."""

    print("\n" + "=" * 60)
    print("  TAX AUTHORITY — Real Estate Transactions (נדל\"ן)")
    print("=" * 60)

    with TaxAuthorityScraper(headless=True) as tax:

        # ── Search by address ──
        print("\n▸ Searching transactions: הרצל 10, תל אביב")
        txns = tax.search_transactions_by_address("הרצל 10, תל אביב")
        print(f"  Found {len(txns)} transactions:")
        for t in txns[:5]:  # show first 5
            print(
                f"    • {t['sale_date']} — ₪{t['declared_value_nis']} "
                f"({t['property_type']}, {t['built_area_sqm']} sqm)"
            )

        # Save to JSON
        if txns:
            tax.save_to_json(txns, "tax_herzl_tel_aviv.json")

        # ── Search by Gush/Helka ──
        print("\n▸ Searching transactions: gush=6158, helka=30")
        txns = tax.search_transactions_by_gush_helka("6158", "30")
        print(f"  Found {len(txns)} transactions:")
        for t in txns[:5]:
            print(
                f"    • {t['sale_date']} — ₪{t['declared_value_nis']} "
                f"({t['property_type']}, {t['built_area_sqm']} sqm)"
            )


if __name__ == "__main__":
    example_mavat()
    example_tax_authority()
    print("\n✓ Done. Check the 'output/' directory for JSON files.")
