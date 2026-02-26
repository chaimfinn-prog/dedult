"""
CBS Price Index Adapter

Source: Israel Central Bureau of Statistics (הלמ"ס)
  API: https://api.cbs.gov.il/index/data/price
  Series ID 180010: Producer price index (confirmed working endpoint)

Response format: { month: [{ code, name, date: [{ year, month, percent, percentYear,
    currBase: { baseDesc, value } }] }] }

NOTE: The CBS public API does not expose a dedicated housing price per-city series.
Real per-city transaction data requires nadlan.gov.il (Cognito-gated).
We use this for national trend data only.
"""

from __future__ import annotations

from typing import Optional

import requests


CBS_API = "https://api.cbs.gov.il/index/data/price"
CBS_INDEX_ID = 180010


def get_cbs_price_index(periods: int = 12) -> dict:
    """
    Fetch national price index from CBS.

    Returns dict with:
      - source: "הלמ\"ס — מדד מחירים"
      - latest_value: float (index value, base=2020 avg)
      - latest_period: str (e.g. "ינואר 2026")
      - yoy_change_pct: float (year-over-year % change)
      - monthly_change_pct: float (month-over-month % change)
      - note: disclaimer text
    """
    try:
        resp = requests.get(
            CBS_API,
            params={
                "id": CBS_INDEX_ID,
                "format": "json",
                "download": "false",
                "lang": "he",
            },
            timeout=10,
        )
        data = resp.json()
    except Exception as e:
        return {"error": str(e), "source": "CBS API"}

    months = data.get("month", [])
    if not months:
        return {"error": "No data in CBS response", "source": "CBS API"}

    date_entries = months[0].get("date", [])
    if not date_entries:
        return {"error": "No date entries in CBS response", "source": "CBS API"}

    # Take the most recent entries (sorted newest first)
    recent = date_entries[:periods]

    latest = recent[0] if recent else {}
    latest_value: Optional[float] = None
    if latest.get("currBase"):
        latest_value = latest["currBase"].get("value")

    return {
        "source": 'הלמ"ס — מדד מחירים',
        "series_id": CBS_INDEX_ID,
        "scope": "כלל ארצי — מדד מחירים ליצרן",
        "latest_value": latest_value,
        "latest_period": f"{latest.get('monthDesc', '')} {latest.get('year', '')}",
        "yoy_change_pct": latest.get("percentYear"),
        "monthly_change_pct": latest.get("percent"),
        "base_description": latest.get("currBase", {}).get("baseDesc", ""),
        "note": 'מדד חודשי. אינו מחיר מ"ר — הוא אינדקס שינוי יחסי. לנתוני דירות ספציפיים ראו nadlan.gov.il',
    }
