'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Hash } from 'lucide-react';
import { searchProperties, analyzeProperty } from '@/data/properties';
import { useView } from '@/context/ViewContext';
import type { Property } from '@/types';

export function PropertySearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Property[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { setSelectedAnalysis, setIsAnalyzing } = useView();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.trim().length >= 2) {
      const found = searchProperties(value);
      setResults(found);
      setShowResults(true);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelect = async (property: Property) => {
    setShowResults(false);
    setQuery(`${property.address}, ${property.city}`);
    setIsAnalyzing(true);

    // Simulate AI analysis
    await new Promise((resolve) => setTimeout(resolve, 3500));

    const analysis = analyzeProperty(property.id);
    setSelectedAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleQuickSearch = (q: string) => {
    setQuery(q);
    handleSearch(q);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-secondary" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="חפש כתובת או גוש/חלקה (לדוגמה: 6573/142)"
          className="input-glass pr-12 text-base"
          onFocus={() => query.length >= 2 && setShowResults(true)}
        />
      </div>

      {/* Quick Search Tags */}
      <div className="flex flex-wrap gap-2 mt-3">
        <QuickTag
          icon={<MapPin className="w-3 h-3" />}
          label='אחוזה 45, רעננה'
          onClick={() => handleQuickSearch('אחוזה 45')}
        />
        <QuickTag
          icon={<Hash className="w-3 h-3" />}
          label="6570/88"
          onClick={() => handleQuickSearch('6570/88')}
        />
        <QuickTag
          icon={<MapPin className="w-3 h-3" />}
          label='כצנלסון 78'
          onClick={() => handleQuickSearch('כצנלסון 78')}
        />
        <QuickTag
          icon={<Hash className="w-3 h-3" />}
          label="6571/56"
          onClick={() => handleQuickSearch('6571/56')}
        />
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-card mt-2 overflow-hidden"
          >
            {results.map((property) => (
              <button
                key={property.id}
                onClick={() => handleSelect(property)}
                className="w-full p-4 flex items-center gap-3 text-right hover:bg-cyan-dim transition-colors border-b border-border last:border-b-0"
              >
                <div className="w-10 h-10 rounded-xl bg-cyan-dim flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-cyan" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {property.address}, {property.city}
                  </p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    גוש {property.gush} | חלקה {property.chelka} | {property.plotArea} מ&quot;ר | {property.landUse}
                  </p>
                </div>
                <div className="text-xs text-foreground-secondary">
                  {property.neighborhoodName}
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {showResults && results.length === 0 && query.length >= 2 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-foreground-secondary text-center mt-3"
        >
          לא נמצאו נכסים. נסה כתובת אחרת או גוש/חלקה.
        </motion.p>
      )}
    </div>
  );
}

function QuickTag({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-foreground-secondary hover:text-cyan hover:border-cyan transition-colors"
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
