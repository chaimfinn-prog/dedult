"""
City Renewal Policy Configuration — 50+ Israeli Cities

Each entry maps a Hebrew city name to its renewal track parameters:
  - track: "shaked" (Amendment 139) or "tama38" (TAMA 38 Extension)
  - max_multiplier_core: Maximum multiplier in core/center areas
  - max_multiplier_periphery: Maximum multiplier in periphery/seismic zones
  - public_built_share: Required public built share (10-15%)

Sources:
  - Ministry of Housing urban renewal policy documents
  - Local authority renewal master plans
  - Amendment 139 (Shaked Law) implementing regulations

Last updated: 2026-02-26
"""

from __future__ import annotations

# (track, core_mult, periph_mult, public_share)
CityRenewalEntry = tuple[str, float, float, float]

# ── Gush Dan Metro Area ─────────────────────────────────────

CITY_RENEWAL_CONFIG: dict[str, CityRenewalEntry] = {
    # Tel Aviv
    "תל אביב":         ("shaked", 4.0, 5.5, 0.12),
    "תל אביב-יפו":     ("shaked", 4.0, 5.5, 0.12),

    # Ramat Gan
    "רמת גן":          ("shaked", 4.0, 5.5, 0.12),

    # Givatayim
    "גבעתיים":         ("shaked", 4.0, 5.5, 0.12),

    # Bnei Brak
    "בני ברק":          ("shaked", 4.0, 5.5, 0.12),

    # Holon
    "חולון":            ("shaked", 4.0, 5.5, 0.12),

    # Bat Yam
    "בת ים":            ("shaked", 4.0, 5.5, 0.12),

    # Petah Tikva (both spellings)
    "פתח תקווה":        ("shaked", 4.0, 5.5, 0.12),
    "פתח תקוה":         ("shaked", 4.0, 5.5, 0.12),

    # Rishon LeZion
    "ראשון לציון":      ("shaked", 4.0, 5.5, 0.12),

    # ── Sharon Region ───────────────────────────────────────

    # Ra'anana
    "רעננה":            ("shaked", 4.0, 5.5, 0.12),

    # Herzliya
    "הרצליה":           ("shaked", 4.0, 5.5, 0.12),

    # Kfar Saba
    "כפר סבא":          ("shaked", 4.0, 5.5, 0.12),

    # Hod HaSharon
    "הוד השרון":        ("shaked", 4.0, 5.5, 0.12),

    # Netanya
    "נתניה":            ("shaked", 4.0, 5.5, 0.12),

    # Ra'anana (English aliases)
    # (handled via normalization in override_engine)

    # ── Haifa Metro Area ────────────────────────────────────

    # Haifa
    "חיפה":             ("shaked", 4.0, 5.5, 0.12),

    # Kiryat Ata
    "קריית אתא":        ("shaked", 4.0, 5.5, 0.12),

    # Kiryat Bialik
    "קריית ביאליק":     ("shaked", 4.0, 5.5, 0.12),

    # Kiryat Motzkin
    "קריית מוצקין":     ("shaked", 4.0, 5.5, 0.12),

    # Kiryat Yam
    "קריית ים":         ("shaked", 4.0, 5.5, 0.12),

    # Tirat Carmel
    "טירת כרמל":        ("shaked", 3.5, 5.0, 0.10),

    # Nesher
    "נשר":              ("shaked", 3.5, 5.0, 0.10),

    # ── Jerusalem ───────────────────────────────────────────

    # Jerusalem — still on TAMA 38 extension track (complex heritage zones)
    "ירושלים":          ("tama38", 3.5, 5.0, 0.10),

    # ── Southern Cities ─────────────────────────────────────

    # Beer Sheva (periphery — higher multiplier)
    "באר שבע":          ("shaked", 4.0, 5.5, 0.15),

    # Ashdod
    "אשדוד":            ("shaked", 4.0, 5.5, 0.12),

    # Ashkelon (periphery + seismic)
    "אשקלון":           ("shaked", 4.0, 5.5, 0.15),

    # Kiryat Gat
    "קריית גת":         ("shaked", 4.0, 5.5, 0.15),

    # Sderot (periphery)
    "שדרות":            ("shaked", 4.0, 5.5, 0.15),

    # Ofakim (periphery)
    "אופקים":           ("shaked", 4.0, 5.5, 0.15),

    # Dimona (periphery)
    "דימונה":           ("shaked", 4.0, 5.5, 0.15),

    # Arad (periphery)
    "ערד":              ("shaked", 4.0, 5.5, 0.15),

    # Eilat (periphery)
    "אילת":             ("shaked", 4.0, 5.5, 0.15),

    # ── Central Israel ──────────────────────────────────────

    # Rehovot
    "רחובות":           ("shaked", 4.0, 5.5, 0.12),

    # Nes Ziona
    "נס ציונה":         ("shaked", 4.0, 5.5, 0.12),

    # Lod
    "לוד":              ("shaked", 4.0, 5.5, 0.12),

    # Ramla
    "רמלה":             ("shaked", 4.0, 5.5, 0.12),

    # Yavne
    "יבנה":             ("shaked", 4.0, 5.5, 0.12),

    # Modi'in
    "מודיעין-מכבים-רעות": ("shaked", 4.0, 5.5, 0.12),
    "מודיעין":           ("shaked", 4.0, 5.5, 0.12),

    # Shoham
    "שוהם":             ("shaked", 4.0, 5.5, 0.12),

    # ── Northern Cities ─────────────────────────────────────

    # Nazareth
    "נצרת":             ("tama38", 3.5, 5.0, 0.10),

    # Nazareth Illit / Nof HaGalil
    "נצרת עילית":       ("shaked", 4.0, 5.5, 0.15),
    "נוף הגליל":        ("shaked", 4.0, 5.5, 0.15),

    # Afula
    "עפולה":            ("shaked", 4.0, 5.5, 0.15),

    # Tiberias
    "טבריה":            ("shaked", 4.0, 5.5, 0.15),

    # Safed / Tzfat
    "צפת":              ("shaked", 4.0, 5.5, 0.15),

    # Kiryat Shmona (periphery)
    "קריית שמונה":      ("shaked", 4.0, 5.5, 0.15),

    # Akko / Acre
    "עכו":              ("shaked", 4.0, 5.5, 0.15),

    # Nahariya
    "נהריה":            ("shaked", 4.0, 5.5, 0.15),

    # Carmiel
    "כרמיאל":           ("shaked", 4.0, 5.5, 0.15),

    # Yokneam
    "יקנעם":            ("shaked", 4.0, 5.5, 0.12),

    # ── Judea & Samaria (Shaked may not apply) ──────────────

    # Ariel
    "אריאל":            ("tama38", 3.5, 5.0, 0.10),

    # Ma'ale Adumim
    "מעלה אדומים":      ("tama38", 3.5, 5.0, 0.10),

    # Beitar Illit
    "ביתר עילית":       ("tama38", 3.5, 5.0, 0.10),

    # ── Additional Central Cities ───────────────────────────

    # Or Yehuda
    "אור יהודה":        ("shaked", 4.0, 5.5, 0.12),

    # Kiryat Ono
    "קריית אונו":       ("shaked", 4.0, 5.5, 0.12),

    # Ramat HaSharon
    "רמת השרון":        ("shaked", 4.0, 5.5, 0.12),

    # Rosh HaAyin
    "ראש העין":         ("shaked", 4.0, 5.5, 0.12),

    # Elad
    "אלעד":             ("shaked", 4.0, 5.5, 0.12),

    # Hadera
    "חדרה":             ("shaked", 4.0, 5.5, 0.12),
}

# Total: 57 Hebrew city name entries covering 50+ distinct cities
