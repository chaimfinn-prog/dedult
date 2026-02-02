'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Ruler, Building2, ArrowLeft } from 'lucide-react';
import { useZoning } from '@/context/ZoningContext';
import { getAvailableAddresses, findPlanByAddress } from '@/data/zoning-plans';

export function AddressSearch() {
  const { analyze } = useZoning();
  const [address, setAddress] = useState('');
  const [plotSize, setPlotSize] = useState('');
  const [currentArea, setCurrentArea] = useState('');
  const [currentFloors, setCurrentFloors] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const availableAddresses = getAvailableAddresses();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleAddressChange(value: string) {
    setAddress(value);
    if (value.length >= 2) {
      const filtered = availableAddresses.filter((a) =>
        a.includes(value)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }

  function selectAddress(addr: string) {
    setAddress(addr);
    setShowSuggestions(false);
    setShowDetails(true);

    // Auto-fill property data from mapping
    const mapping = findPlanByAddress(addr);
    if (mapping) {
      setPlotSize(String(mapping.plotSize));
      setCurrentArea(String(mapping.existingArea));
      setCurrentFloors(String(mapping.existingFloors));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address.trim()) return;

    const size = parseFloat(plotSize) || 0;
    const built = parseFloat(currentArea) || 0;
    const floors = parseInt(currentFloors) || 0;

    analyze(address.trim(), size, built, floors);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main address search */}
        <div className="relative" ref={suggestionsRef}>
          <div className="glass-card-strong p-2">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-accent" />
              </div>
              <input
                ref={inputRef}
                type="text"
                value={address}
                onChange={(e) => handleAddressChange(e.target.value)}
                onFocus={() => {
                  if (address.length >= 2 && suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="הכנס כתובת (למשל: רחוב הרצל 15, רעננה)"
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-foreground-secondary/50"
                dir="rtl"
              />
              <button
                type={showDetails ? 'submit' : 'button'}
                onClick={() => {
                  if (!showDetails && address.trim()) {
                    setShowDetails(true);
                  }
                }}
                className="btn-primary flex items-center gap-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                <span>בדוק זכויות</span>
              </button>
            </div>
          </div>

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-50 w-full mt-2 glass-card-strong overflow-hidden"
              >
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => selectAddress(s)}
                    className="w-full px-4 py-3 text-right hover:bg-accent/10 transition-colors flex items-center gap-3 border-b border-border/30 last:border-0"
                  >
                    <MapPin className="w-4 h-4 text-accent flex-shrink-0" />
                    <span>{s}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Property details (expandable) */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-semibold text-foreground-secondary text-sm">
                  פרטי הנכס (אופציונלי - לתוצאה מדויקת יותר)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm text-foreground-secondary mb-1">
                      <Ruler className="w-3.5 h-3.5 inline ml-1" />
                      גודל מגרש (מ&quot;ר)
                    </label>
                    <input
                      type="number"
                      value={plotSize}
                      onChange={(e) => setPlotSize(e.target.value)}
                      placeholder="300"
                      className="input-glass text-center"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-secondary mb-1">
                      <Building2 className="w-3.5 h-3.5 inline ml-1" />
                      שטח בנוי קיים (מ&quot;ר)
                    </label>
                    <input
                      type="number"
                      value={currentArea}
                      onChange={(e) => setCurrentArea(e.target.value)}
                      placeholder="0"
                      className="input-glass text-center"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-foreground-secondary mb-1">
                      <Building2 className="w-3.5 h-3.5 inline ml-1" />
                      קומות קיימות
                    </label>
                    <input
                      type="number"
                      value={currentFloors}
                      onChange={(e) => setCurrentFloors(e.target.value)}
                      placeholder="0"
                      className="input-glass text-center"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2"
                >
                  <span>נתח זכויות בנייה</span>
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Quick demo addresses */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6"
      >
        <p className="text-sm text-foreground-secondary text-center mb-3">
          נסה כתובת לדוגמה:
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {availableAddresses.slice(0, 4).map((addr) => (
            <button
              key={addr}
              onClick={() => selectAddress(addr)}
              className="glass-button px-3 py-2 text-sm flex items-center gap-1.5"
            >
              <MapPin className="w-3 h-3 text-accent" />
              {addr.replace(', רעננה', '')}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
