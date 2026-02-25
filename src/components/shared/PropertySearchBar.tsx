'use client';

import { useState, useRef, useCallback } from 'react';
import { Search, MapPin, Hash } from 'lucide-react';
import { useLang } from '@/lib/i18n';

// ── City list (same 30+ cities from override engine) ────────

const CITY_LIST = [
  'תל אביב-יפו', 'תל אביב', 'רעננה', 'ירושלים', 'חיפה', 'באר שבע',
  'נתניה', 'ראשון לציון', 'פתח תקוה', 'אשדוד', 'הרצליה', 'בת ים',
  'חולון', 'רמת גן', 'גבעתיים', 'בני ברק', 'כפר סבא', 'הוד השרון',
  'אשקלון', 'לוד', 'רמלה', 'מודיעין', 'קריית אונו', 'עפולה',
  'צפת', 'טבריה', 'אילת', 'רחובות', 'נס ציונה', 'קריית גת',
];

// ── Types ────────────────────────────────────────────────────

export interface SearchParams {
  city?: string;
  street?: string;
  gush?: string;
  helka?: string;
  lat?: number;
  lon?: number;
  raw: string;
}

interface Props {
  onSearch: (params: SearchParams) => void;
  placeholder?: string;
  defaultValue?: string;
}

// ── Component ────────────────────────────────────────────────

export default function PropertySearchBar({ onSearch, placeholder, defaultValue = '' }: Props) {
  const { lang } = useLang();
  const isHe = lang === 'he';
  const t = (he: string, en: string) => (isHe ? he : en);

  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseQuery = useCallback((raw: string): SearchParams => {
    const trimmed = raw.trim();

    // Gush/Helka pattern: "6952/40" or "6952-40"
    const gushMatch = trimmed.match(/^(\d{3,7})\s*[/\-]\s*(\d{1,5})$/);
    if (gushMatch) {
      return { gush: gushMatch[1], helka: gushMatch[2], raw: trimmed };
    }

    // City match (exact or partial)
    const cityMatch = CITY_LIST.find(
      c => c === trimmed || trimmed.startsWith(c) || c.startsWith(trimmed)
    );
    if (cityMatch) {
      const rest = trimmed.replace(cityMatch, '').replace(/^[\s,]+/, '').trim();
      return { city: cityMatch, street: rest || undefined, raw: trimmed };
    }

    // Street + city pattern: "הרצל 12, ראשון לציון"
    const commaIdx = trimmed.indexOf(',');
    if (commaIdx > 0) {
      const street = trimmed.slice(0, commaIdx).trim();
      const cityPart = trimmed.slice(commaIdx + 1).trim();
      const matchedCity = CITY_LIST.find(c => c === cityPart || cityPart.startsWith(c));
      if (matchedCity) {
        return { city: matchedCity, street, raw: trimmed };
      }
    }

    return { raw: trimmed };
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (value.length >= 2) {
      const filtered = CITY_LIST.filter(c => c.includes(value));
      setSuggestions(filtered.slice(0, 6));
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setShowSuggestions(false);
    if (query.trim()) {
      onSearch(parseQuery(query));
    }
  };

  const handleSuggestionClick = (city: string) => {
    setQuery(city);
    setShowSuggestions(false);
    onSearch({ city, raw: city });
  };

  const defaultPlaceholder = t(
    'חיפוש עיר / כתובת / גוש-חלקה (לדוגמה: 6952/40)',
    'Search city / address / gush-helka (e.g. 6952/40)'
  );

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div
        className="flex items-center gap-2 rounded-xl px-4 py-3 transition-all"
        style={{
          background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}
      >
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: '#a78bfa' }} />
        <input
          ref={inputRef}
          type="text"
          dir="auto"
          value={query}
          onChange={e => handleInput(e.target.value)}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder || defaultPlaceholder}
          className="flex-1 bg-transparent border-0 outline-none text-sm"
          style={{ color: '#1a1a2e', fontFamily: "'Space Grotesk', sans-serif" }}
        />
        {query && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
            background: query.match(/^\d{3,7}\s*[/\-]\s*\d{1,5}$/) ? 'rgba(59,130,246,0.1)' : 'rgba(167,139,250,0.1)',
            color: query.match(/^\d{3,7}\s*[/\-]\s*\d{1,5}$/) ? '#3b82f6' : '#a78bfa',
          }}>
            {query.match(/^\d{3,7}\s*[/\-]\s*\d{1,5}$/) ? (
              <><Hash className="w-2.5 h-2.5 inline" /> {t('גוש/חלקה', 'Gush/Helka')}</>
            ) : (
              <><MapPin className="w-2.5 h-2.5 inline" /> {t('עיר/כתובת', 'City/Address')}</>
            )}
          </span>
        )}
        <button
          type="submit"
          className="px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer border-0 transition-all"
          style={{ background: '#a78bfa', color: '#fff' }}
        >
          {t('חפש', 'Search')}
        </button>
      </div>

      {/* Autocomplete suggestions */}
      {showSuggestions && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg overflow-hidden z-50"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {suggestions.map((city, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSuggestionClick(city)}
              className="w-full text-right px-4 py-2.5 text-sm cursor-pointer border-0 bg-transparent transition-all hover:bg-gray-50"
              style={{ color: '#1a1a2e' }}
            >
              <MapPin className="w-3 h-3 inline ml-2" style={{ color: '#a78bfa' }} />
              {city}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
