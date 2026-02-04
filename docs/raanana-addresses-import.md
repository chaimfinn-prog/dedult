# Raanana Address Import

This project supports bulk-loading Raanana addresses and GIS data in two steps:

1. **Enrich** a CSV of addresses using GovMap (MAPI) to obtain block/parcel/plot size.
2. **Upload** the enriched CSV in the Admin → Addresses tab.

## 1) Enrich CSV with GovMap (MAPI)

Prepare a CSV with at least an `address` column:

```
address
רחוב אחוזה 100, רעננה
רחוב הרצל 15, רעננה
```

Run the enrichment script:

```
node scripts/enrich-addresses.ts input.csv output.csv
```

Optional environment overrides (useful on Vercel):

```
MAPI_GEOCODE_URL=https://es.govmap.gov.il/TldSearch/api/DetailsByQuery
MAPI_PARCEL_URL=https://ags.govmap.gov.il/Gis/ArcGIS/rest/services/Parcels/MapServer/0/query
```

The output CSV follows the required schema:

```
address,block,parcel,plotSize,existingArea,existingFloors,existingUnits,neighborhood
```

## 2) Upload in Admin UI

1. Go to **Admin → כתובות**.
2. Click **ייבוא CSV כתובות**.
3. Select the `output.csv` from step 1.

The system will store the imported mappings in local storage and use them as a fallback when APIs are unavailable.
