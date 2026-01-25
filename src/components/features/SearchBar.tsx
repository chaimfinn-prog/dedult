'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Barcode, Sparkles } from 'lucide-react';
import { Product, categoryLabels } from '@/types';
import { searchProducts } from '@/data/products';
import { useBasket } from '@/context/BasketContext';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addItem } = useBasket();

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (value.trim().length > 0) {
      const searchResults = searchProducts(value);
      setResults(searchResults);
      setIsOpen(true);
      setSelectedIndex(-1);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, []);

  const handleSelect = useCallback(
    (product: Product) => {
      addItem(product);
      setQuery('');
      setResults([]);
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [addItem]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen || results.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < results.length) {
            handleSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    },
    [isOpen, results, selectedIndex, handleSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <motion.div
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-foreground-secondary" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setIsOpen(true)}
          placeholder="חפש מוצרים... (חלב, לחם, תנובה...)"
          className="input-glass pr-12 pl-12 h-14 text-lg"
          autoComplete="off"
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {query && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              onClick={() => {
                setQuery('');
                setResults([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-border rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-foreground-secondary" />
            </motion.button>
          )}
          <motion.button
            className="p-1 hover:bg-border rounded-lg transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="סרוק ברקוד"
          >
            <Barcode className="w-5 h-5 text-foreground-secondary" />
          </motion.button>
        </div>
      </motion.div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full glass-card-strong overflow-hidden z-50"
          >
            <div className="max-h-80 overflow-y-auto">
              {results.map((product, index) => (
                <motion.button
                  key={product.id}
                  onClick={() => handleSelect(product)}
                  className={`w-full flex items-center gap-3 p-4 text-right transition-colors ${
                    index === selectedIndex
                      ? 'bg-accent/10'
                      : 'hover:bg-border/50'
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="w-12 h-12 rounded-xl bg-background-secondary flex items-center justify-center shrink-0">
                    <span className="text-2xl">
                      {getCategoryEmoji(product.category)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.nameHe}</p>
                    <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                      <span>{product.brand}</span>
                      <span>•</span>
                      <span>{categoryLabels[product.category]}</span>
                    </div>
                  </div>
                  <motion.div
                    className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center"
                    whileHover={{ scale: 1.1, backgroundColor: 'var(--accent)' }}
                  >
                    <Sparkles className="w-4 h-4 text-accent" />
                  </motion.div>
                </motion.button>
              ))}
            </div>
            <div className="p-3 border-t border-border bg-background/50">
              <p className="text-xs text-foreground-secondary text-center">
                נמצאו {results.length} מוצרים • לחץ Enter להוספה מהירה
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Results */}
      <AnimatePresence>
        {isOpen && query.trim() && results.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full glass-card-strong p-6 text-center z-50"
          >
            <p className="text-foreground-secondary">
              לא נמצאו מוצרים עבור &quot;{query}&quot;
            </p>
            <p className="text-sm text-foreground-secondary/70 mt-1">
              נסה לחפש שם מוצר, מותג או קטגוריה
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    dairy: '🥛',
    bread: '🍞',
    meat: '🥩',
    produce: '🥬',
    dry_goods: '🍝',
    beverages: '🥤',
    frozen: '🧊',
    snacks: '🍿',
    cleaning: '🧹',
    personal_care: '🧴',
  };
  return emojis[category] || '📦';
}
