'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  type FC,
} from 'react';
import dynamic from 'next/dynamic';
import type { Lang } from '@/lib/i18n';

// ── Types ────────────────────────────────────────────────────

export interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  city: string;
}

export interface MapAddressInputProps {
  /** Called when user selects an address (search or map click) */
  onAddressSelect: (result: AddressResult) => void;
  /** 'he' for RTL Hebrew, 'en' for LTR English */
  lang?: Lang;
  /** Placeholder text for the search bar */
  placeholder?: string;
  /** Map height in pixels (default 250) */
  height?: number;
  /** Initial center [lat, lng] — defaults to Israel center */
  center?: [number, number];
  /** Initial zoom level (default 8) */
  zoom?: number;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
}

// ── Constants ────────────────────────────────────────────────

const PURPLE = '#a78bfa';
const DEFAULT_CENTER: [number, number] = [31.5, 34.8];
const DEFAULT_ZOOM = 8;
const DEBOUNCE_MS = 300;

const LABELS = {
  he: {
    placeholder: 'חפש כתובת...',
    noResults: 'לא נמצאו תוצאות',
    loading: 'מחפש...',
  },
  en: {
    placeholder: 'Search address...',
    noResults: 'No results found',
    loading: 'Searching...',
  },
} as const;

// ── Nominatim helpers ────────────────────────────────────────

function extractCity(addr?: NominatimResult['address']): string {
  if (!addr) return '';
  return addr.city || addr.town || addr.village || addr.municipality || '';
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (!query.trim()) return [];
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    addressdetails: '1',
    limit: '5',
    countrycodes: 'il',
    'accept-language': 'he,en',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    { headers: { 'User-Agent': 'PROPCHECK/1.0' } },
  );
  if (!res.ok) return [];
  return res.json();
}

async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<NominatimResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: 'json',
    addressdetails: '1',
    'accept-language': 'he,en',
  });
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    { headers: { 'User-Agent': 'PROPCHECK/1.0' } },
  );
  if (!res.ok) return null;
  return res.json();
}

// ── Inner map component (client-only, dynamically imported) ──

interface InnerMapProps {
  center: [number, number];
  zoom: number;
  height: number;
  marker: [number, number] | null;
  onMapClick: (lat: number, lng: number) => void;
}

function InnerMapComponent({
  center,
  zoom,
  height,
  marker,
  onMapClick,
}: InnerMapProps) {
  /* eslint-disable @typescript-eslint/no-require-imports */
  // Leaflet CSS — must be imported client-side only
  require('leaflet/dist/leaflet.css');

  const L = require('leaflet') as typeof import('leaflet');
  const {
    MapContainer,
    TileLayer,
    Marker,
    useMapEvents,
    useMap,
  } = require('react-leaflet') as typeof import('react-leaflet');
  /* eslint-enable @typescript-eslint/no-require-imports */

  // Fix default marker icons (webpack breaks leaflet icon paths)
  const defaultIcon = useMemo(
    () =>
      L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    [L],
  );

  // Handle clicks on the map
  function ClickHandler() {
    useMapEvents({
      click(e: { latlng: { lat: number; lng: number } }) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      },
    });
    return null;
  }

  // Re-center map when marker changes
  function RecenterOnMarker() {
    const map = useMap();
    useEffect(() => {
      if (marker) {
        map.setView(marker, Math.max(map.getZoom(), 14), { animate: true });
      }
    }, [marker, map]);
    return null;
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ width: '100%', height, borderRadius: '0 0 12px 12px' }}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler />
      <RecenterOnMarker />
      {marker && <Marker position={marker} icon={defaultIcon} />}
    </MapContainer>
  );
}

// Dynamic import to prevent SSR
const DynamicMap = dynamic(() => Promise.resolve(InnerMapComponent), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '100%',
        height: 250,
        borderRadius: '0 0 12px 12px',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        fontSize: 14,
      }}
    >
      Loading map...
    </div>
  ),
});

// ── Main component ───────────────────────────────────────────

const MapAddressInput: FC<MapAddressInputProps> = ({
  onAddressSelect,
  lang = 'he',
  placeholder,
  height = 250,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
}) => {
  const isRtl = lang === 'he';
  const labels = LABELS[lang];

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [marker, setMarker] = useState<[number, number] | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (!value.trim()) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setIsLoading(true);
      setShowDropdown(true);

      debounceRef.current = setTimeout(async () => {
        const results = await searchAddress(value);
        setSuggestions(results);
        setIsLoading(false);
      }, DEBOUNCE_MS);
    },
    [],
  );

  // Select from autocomplete
  const handleSelect = useCallback(
    (result: NominatimResult) => {
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const city = extractCity(result.address);
      const address = result.display_name;

      setQuery(address);
      setMarker([lat, lng]);
      setSuggestions([]);
      setShowDropdown(false);

      onAddressSelect({ address, lat, lng, city });
    },
    [onAddressSelect],
  );

  // Click on map → reverse geocode
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setMarker([lat, lng]);
      const result = await reverseGeocode(lat, lng);
      if (result) {
        const city = extractCity(result.address);
        const address = result.display_name;
        setQuery(address);
        onAddressSelect({ address, lat, lng, city });
      }
    },
    [onAddressSelect],
  );

  return (
    <div
      ref={wrapperRef}
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid rgba(167,139,250,0.25)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* ── Search bar ──────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 14px',
            borderBottom: '1px solid rgba(167,139,250,0.15)',
          }}
        >
          {/* Search icon */}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke={PURPLE}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0 }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder={placeholder || labels.placeholder}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              lineHeight: '20px',
              color: '#1a1a2e',
              direction: isRtl ? 'rtl' : 'ltr',
              textAlign: isRtl ? 'right' : 'left',
              fontFamily: 'inherit',
            }}
          />

          {/* Clear button */}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setShowDropdown(false);
                setMarker(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: 'none',
                background: 'rgba(167,139,250,0.15)',
                color: PURPLE,
                cursor: 'pointer',
                fontSize: 13,
                lineHeight: 1,
                flexShrink: 0,
                padding: 0,
              }}
              aria-label="Clear"
            >
              &times;
            </button>
          )}
        </div>

        {/* ── Autocomplete dropdown ─────────────────────── */}
        {showDropdown && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 20,
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderTop: '1px solid rgba(167,139,250,0.1)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              maxHeight: 200,
              overflowY: 'auto',
            }}
          >
            {isLoading ? (
              <div
                style={{
                  padding: '12px 14px',
                  fontSize: 13,
                  color: '#888',
                  textAlign: 'center',
                }}
              >
                {labels.loading}
              </div>
            ) : suggestions.length === 0 ? (
              <div
                style={{
                  padding: '12px 14px',
                  fontSize: 13,
                  color: '#888',
                  textAlign: 'center',
                }}
              >
                {labels.noResults}
              </div>
            ) : (
              suggestions.map((s) => (
                <button
                  key={s.place_id}
                  type="button"
                  onClick={() => handleSelect(s)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    width: '100%',
                    padding: '10px 14px',
                    border: 'none',
                    borderBottom: '1px solid rgba(167,139,250,0.08)',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: isRtl ? 'right' : 'left',
                    direction: isRtl ? 'rtl' : 'ltr',
                    fontSize: 13,
                    lineHeight: '18px',
                    color: '#1a1a2e',
                    fontFamily: 'inherit',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'rgba(167,139,250,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background =
                      'transparent';
                  }}
                >
                  {/* Pin icon */}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill={PURPLE}
                    stroke="none"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </svg>
                  <span style={{ flex: 1 }}>{s.display_name}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Map ─────────────────────────────────────────── */}
      <DynamicMap
        center={center}
        zoom={zoom}
        height={height}
        marker={marker}
        onMapClick={handleMapClick}
      />
    </div>
  );
};

export default MapAddressInput;
