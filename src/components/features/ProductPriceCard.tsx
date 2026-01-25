'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  Store,
  Tag,
} from 'lucide-react';
import { Product, StorePrice, categoryLabels } from '@/types';
import { stores } from '@/data/stores';
import { storePrices, getEffectivePrice } from '@/data/prices';
import { PriceHistoryChart, StoreLegend } from '@/components/charts/PriceHistoryChart';

interface ProductPriceCardProps {
  product: Product;
}

export function ProductPriceCard({ product }: ProductPriceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedStores, setSelectedStores] = useState<string[]>(
    stores.map((s) => s.id)
  );

  // Get prices for this product across all stores
  const productPrices = storePrices.filter((p) => p.productId === product.id);

  // Find cheapest and most expensive
  const sortedPrices = [...productPrices].sort(
    (a, b) => getEffectivePrice(a) - getEffectivePrice(b)
  );
  const cheapest = sortedPrices[0];
  const mostExpensive = sortedPrices[sortedPrices.length - 1];

  const cheapestStore = stores.find((s) => s.id === cheapest?.storeId);
  const priceDiff = mostExpensive && cheapest
    ? ((getEffectivePrice(mostExpensive) - getEffectivePrice(cheapest)) / getEffectivePrice(cheapest)) * 100
    : 0;

  // Prepare price history data
  const priceHistoryData = productPrices.map((p) => ({
    storeId: p.storeId,
    history: p.priceHistory,
  }));

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId]
    );
  };

  return (
    <motion.div
      layout
      className="glass-card overflow-hidden"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main Content */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start gap-4">
          {/* Product Image/Icon */}
          <div className="w-16 h-16 rounded-xl bg-background-secondary flex items-center justify-center shrink-0">
            <span className="text-3xl">{getCategoryEmoji(product.category)}</span>
          </div>

          {/* Product Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{product.nameHe}</h3>
            <p className="text-sm text-foreground-secondary">
              {product.brand} • {categoryLabels[product.category]}
            </p>
            <p className="text-xs text-foreground-secondary/70 mt-1">
              {product.unitAmount} {product.unit}
            </p>
          </div>

          {/* Price Info */}
          <div className="text-left shrink-0">
            {cheapest && (
              <>
                <p className="text-lg font-bold price">
                  {cheapest.salePrice ? (
                    <span className="price-sale">₪{cheapest.salePrice.toFixed(2)}</span>
                  ) : (
                    `₪${cheapest.price.toFixed(2)}`
                  )}
                </p>
                {cheapest.salePrice && (
                  <p className="text-xs price-original">
                    ₪{cheapest.price.toFixed(2)}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cheapestStore?.color }}
                  />
                  <span className="text-xs text-foreground-secondary">
                    {cheapestStore?.nameHe}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Store className="w-4 h-4 text-foreground-secondary" />
            <span className="text-foreground-secondary">
              {productPrices.length} חנויות
            </span>
          </div>
          {priceDiff > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <TrendingDown className="w-4 h-4 text-success" />
              <span className="text-success">
                הפרש עד {priceDiff.toFixed(0)}%
              </span>
            </div>
          )}
          {cheapest?.salePrice && (
            <div className="flex items-center gap-1 text-sm">
              <Tag className="w-4 h-4 text-warning" />
              <span className="text-warning">במבצע</span>
            </div>
          )}
          <motion.div
            className="mr-auto"
            animate={{ rotate: expanded ? 180 : 0 }}
          >
            <ChevronDown className="w-5 h-5 text-foreground-secondary" />
          </motion.div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-border">
              {/* Price Comparison */}
              <h4 className="font-semibold mt-4 mb-3">השוואת מחירים</h4>
              <div className="space-y-2">
                {sortedPrices.map((price, index) => {
                  const store = stores.find((s) => s.id === price.storeId);
                  const effectivePrice = getEffectivePrice(price);
                  const isCheapest = index === 0;
                  const isExpensive = index === sortedPrices.length - 1;

                  return (
                    <div
                      key={price.storeId}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isCheapest
                          ? 'bg-success/10 border border-success/30'
                          : 'bg-background/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: store?.color }}
                        >
                          {store?.nameHe.charAt(0)}
                        </div>
                        <span className="font-medium">{store?.nameHe}</span>
                        {isCheapest && (
                          <span className="badge badge-success">הכי זול</span>
                        )}
                        {price.salePrice && (
                          <span className="badge badge-warning">מבצע</span>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-semibold price">
                          ₪{effectivePrice.toFixed(2)}
                        </span>
                        {price.salePrice && (
                          <span className="text-xs price-original mr-2">
                            ₪{price.price.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price History Chart */}
              <h4 className="font-semibold mt-6 mb-3">היסטוריית מחירים</h4>
              <StoreLegend
                stores={stores.map((s) => s.id)}
                selected={selectedStores}
                onToggle={toggleStore}
              />
              <div className="mt-4">
                <PriceHistoryChart
                  productId={product.id}
                  priceHistory={priceHistoryData}
                  selectedStores={selectedStores}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
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
