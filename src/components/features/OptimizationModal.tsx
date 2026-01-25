'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  Sparkles,
  Zap,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  TrendingDown,
  Truck,
  Tag,
  Package,
  CheckCircle2,
} from 'lucide-react';
import { useBasket } from '@/context/BasketContext';
import { OptimizationResult, BasketAnalysis, SplitStrategy } from '@/types';
import { stores } from '@/data/stores';

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'cheapest' | 'smart' | 'fastest';

export function OptimizationModal({ isOpen, onClose }: OptimizationModalProps) {
  const { optimizationResult, clearOptimization } = useBasket();
  const [activeTab, setActiveTab] = useState<TabType>('smart');
  const [expandedStore, setExpandedStore] = useState<string | null>(null);

  const handleClose = () => {
    onClose();
    clearOptimization();
  };

  if (!optimizationResult) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl md:max-h-[85vh] z-50 glass-card-strong flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">תוצאות האופטימיזציה</h2>
                  <p className="text-sm text-foreground-secondary">
                    מצאנו לך את ההצעה הטובה ביותר
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                className="w-10 h-10 rounded-xl hover:bg-border flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-border overflow-x-auto">
              <TabButton
                active={activeTab === 'cheapest'}
                onClick={() => setActiveTab('cheapest')}
                icon={<Building2 className="w-4 h-4" />}
                label="חנות אחת"
                sublabel="הכי זול"
              />
              <TabButton
                active={activeTab === 'smart'}
                onClick={() => setActiveTab('smart')}
                icon={<Sparkles className="w-4 h-4" />}
                label="פיצול חכם"
                sublabel="חיסכון מקסימלי"
                recommended
              />
              <TabButton
                active={activeTab === 'fastest'}
                onClick={() => setActiveTab('fastest')}
                icon={<Zap className="w-4 h-4" />}
                label="משלוח מהיר"
                sublabel="הכי זריז"
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <AnimatePresence mode="wait">
                {activeTab === 'cheapest' && (
                  <CheapestStoreContent
                    key="cheapest"
                    result={optimizationResult}
                    expandedStore={expandedStore}
                    setExpandedStore={setExpandedStore}
                  />
                )}
                {activeTab === 'smart' && (
                  <SmartSplitContent
                    key="smart"
                    result={optimizationResult}
                    expandedStore={expandedStore}
                    setExpandedStore={setExpandedStore}
                  />
                )}
                {activeTab === 'fastest' && (
                  <FastestDeliveryContent
                    key="fastest"
                    result={optimizationResult}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-background/30">
              <div className="flex items-center justify-between text-sm text-foreground-secondary">
                <span>מחירים עודכנו לאחרונה היום</span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  מחירים חיים
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  sublabel,
  recommended,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  recommended?: boolean;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all whitespace-nowrap ${
        active
          ? 'bg-accent text-white'
          : 'bg-background-secondary hover:bg-border text-foreground-secondary'
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {recommended && !active && (
        <motion.span
          className="absolute -top-2 -right-2 px-2 py-0.5 bg-success text-white text-[10px] font-bold rounded-full"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          מומלץ
        </motion.span>
      )}
      {icon}
      <div className="text-right">
        <span className="block text-sm">{label}</span>
        <span className={`text-[10px] ${active ? 'text-white/80' : ''}`}>
          {sublabel}
        </span>
      </div>
    </motion.button>
  );
}

function CheapestStoreContent({
  result,
  expandedStore,
  setExpandedStore,
}: {
  result: OptimizationResult;
  expandedStore: string | null;
  setExpandedStore: (id: string | null) => void;
}) {
  const cheapest = result.cheapestSingleStore;
  const store = stores.find((s) => s.id === cheapest.storeId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Best Deal Card */}
      <div
        className="glass-card p-4 border-2"
        style={{ borderColor: store?.color }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: store?.color }}
            >
              {store?.nameHe.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-lg">{store?.nameHe}</h3>
              <p className="text-sm text-foreground-secondary">
                הכי זול לכל הסל
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-2xl font-bold price">₪{cheapest.total.toFixed(2)}</p>
            {cheapest.savings > 0 && (
              <p className="text-sm text-success flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                חיסכון של ₪{cheapest.savings.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-background/30 rounded-lg p-3">
            <p className="text-xs text-foreground-secondary">סה״כ מוצרים</p>
            <p className="font-semibold">₪{cheapest.subtotal.toFixed(2)}</p>
          </div>
          <div className="bg-background/30 rounded-lg p-3">
            <p className="text-xs text-foreground-secondary">משלוח</p>
            <p className="font-semibold">
              {cheapest.deliveryFee === 0 ? (
                <span className="text-success">חינם!</span>
              ) : (
                `₪${cheapest.deliveryFee.toFixed(2)}`
              )}
            </p>
          </div>
        </div>

        {/* Items List Toggle */}
        <button
          onClick={() =>
            setExpandedStore(expandedStore === cheapest.storeId ? null : cheapest.storeId)
          }
          className="w-full flex items-center justify-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
        >
          {expandedStore === cheapest.storeId ? (
            <>
              <ChevronUp className="w-4 h-4" />
              הסתר פריטים
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              הצג {cheapest.items.length} פריטים
            </>
          )}
        </button>

        <AnimatePresence>
          {expandedStore === cheapest.storeId && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 space-y-2 pt-4 border-t border-border">
                {cheapest.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>
                      {item.productName} ×{item.quantity}
                    </span>
                    <span className="price">
                      {item.isOnSale && (
                        <span className="price-original mr-2">
                          ₪{item.originalPrice?.toFixed(2)}
                        </span>
                      )}
                      <span className={item.isOnSale ? 'price-sale' : ''}>
                        ₪{item.totalPrice.toFixed(2)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Checkout Button */}
        <motion.a
          href="#"
          className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span>לקנייה ב{store?.nameHe}</span>
          <ExternalLink className="w-4 h-4" />
        </motion.a>
      </div>

      {/* Other Stores */}
      <h4 className="font-semibold text-foreground-secondary">חנויות נוספות</h4>
      <div className="space-y-2">
        {result.allStores
          .filter((s) => s.storeId !== cheapest.storeId)
          .map((analysis) => (
            <StoreComparisonRow key={analysis.storeId} analysis={analysis} />
          ))}
      </div>
    </motion.div>
  );
}

function SmartSplitContent({
  result,
  expandedStore,
  setExpandedStore,
}: {
  result: OptimizationResult;
  expandedStore: string | null;
  setExpandedStore: (id: string | null) => void;
}) {
  const split = result.smartSplit;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* AI Recommendation Card */}
      <div className="glass-card p-4 bg-gradient-to-l from-accent/10 to-transparent border border-accent/30">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-bold text-accent">המלצת ה-AI</h3>
            <p className="text-sm mt-1">{split.recommendation}</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-foreground-secondary">סה״כ לתשלום</p>
          <p className="text-lg font-bold price">₪{split.totalCost.toFixed(2)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-foreground-secondary">משלוחים</p>
          <p className="text-lg font-bold price">
            {split.totalDeliveryFees === 0 ? (
              <span className="text-success">חינם</span>
            ) : (
              `₪${split.totalDeliveryFees.toFixed(2)}`
            )}
          </p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-foreground-secondary">חיסכון</p>
          <p className="text-lg font-bold text-success">
            {split.totalSavings > 0 ? `₪${split.totalSavings.toFixed(2)}` : '-'}
          </p>
        </div>
      </div>

      {/* Split Orders */}
      <h4 className="font-semibold">פיצול ההזמנה ({split.stores.length} חנויות)</h4>
      <div className="space-y-3">
        {split.stores.map((order, index) => (
          <motion.div
            key={order.storeId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card overflow-hidden"
            style={{ borderRightWidth: 4, borderRightColor: order.storeColor }}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: order.storeColor }}
                  >
                    {order.storeName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold">{order.storeName}</h4>
                    <p className="text-xs text-foreground-secondary">
                      {order.items.length} פריטים
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold price">₪{order.total.toFixed(2)}</p>
                  <p className="text-xs text-foreground-secondary">
                    {order.deliveryFee === 0 ? (
                      <span className="text-success">משלוח חינם</span>
                    ) : (
                      `+₪${order.deliveryFee} משלוח`
                    )}
                  </p>
                </div>
              </div>

              {/* Toggle Items */}
              <button
                onClick={() =>
                  setExpandedStore(expandedStore === order.storeId ? null : order.storeId)
                }
                className="w-full flex items-center justify-center gap-2 text-sm text-foreground-secondary hover:text-foreground transition-colors"
              >
                {expandedStore === order.storeId ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    הסתר פריטים
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    הצג פריטים
                  </>
                )}
              </button>

              <AnimatePresence>
                {expandedStore === order.storeId && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-3 space-y-2 pt-3 border-t border-border">
                      {order.items.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {item.isOnSale && (
                              <Tag className="w-3 h-3 text-success" />
                            )}
                            <span>
                              {item.productName} ×{item.quantity}
                            </span>
                          </div>
                          <span className="price">
                            ₪{item.totalPrice.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Checkout */}
              <motion.a
                href={order.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full flex items-center justify-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: `${order.storeColor}20`,
                  color: order.storeColor,
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>לקנייה</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function FastestDeliveryContent({ result }: { result: OptimizationResult }) {
  const fastest = result.fastestDelivery;
  const store = stores.find((s) => s.id === fastest.storeId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Fastest Delivery Card */}
      <div className="glass-card p-4 border-2 border-warning">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{store?.nameHe}</h3>
              <p className="text-sm text-foreground-secondary">
                המשלוח המהיר ביותר
              </p>
            </div>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-warning" />
              <span className="text-xl font-bold">
                {store?.estimatedDeliveryMinutes} דקות
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-background/30 rounded-lg p-3">
            <p className="text-xs text-foreground-secondary">סה״כ לתשלום</p>
            <p className="font-semibold price">₪{fastest.total.toFixed(2)}</p>
          </div>
          <div className="bg-background/30 rounded-lg p-3">
            <p className="text-xs text-foreground-secondary">משלוח</p>
            <p className="font-semibold">
              {fastest.deliveryFee === 0 ? (
                <span className="text-success">חינם!</span>
              ) : (
                `₪${fastest.deliveryFee.toFixed(2)}`
              )}
            </p>
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-background/30 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-foreground-secondary" />
            <span className="text-sm font-medium">
              {fastest.items.length} פריטים בהזמנה
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {fastest.items.slice(0, 5).map((item) => (
              <span
                key={item.productId}
                className="text-xs px-2 py-1 rounded-full bg-background/50"
              >
                {item.productName}
              </span>
            ))}
            {fastest.items.length > 5 && (
              <span className="text-xs px-2 py-1 rounded-full bg-background/50">
                +{fastest.items.length - 5} נוספים
              </span>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>משלוח מהיר עד הדלת</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-success" />
            <span>מעקב הזמנה בזמן אמת</span>
          </div>
        </div>

        <motion.a
          href="#"
          className="w-full btn-primary flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Zap className="w-4 h-4" />
          <span>הזמן עכשיו ב{store?.nameHe}</span>
        </motion.a>
      </div>

      {/* Delivery Comparison */}
      <h4 className="font-semibold text-foreground-secondary">
        השוואת זמני משלוח
      </h4>
      <div className="space-y-2">
        {stores
          .sort((a, b) => a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes)
          .map((s, index) => {
            const analysis = result.allStores.find((a) => a.storeId === s.id);
            return (
              <div
                key={s.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? 'bg-warning/10 border border-warning/30' : 'bg-background/30'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: s.color }}
                  >
                    {s.nameHe.charAt(0)}
                  </div>
                  <span className="font-medium">{s.nameHe}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-foreground-secondary price">
                    ₪{analysis?.total.toFixed(2)}
                  </span>
                  <span className="font-semibold">
                    {s.estimatedDeliveryMinutes} דקות
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </motion.div>
  );
}

function StoreComparisonRow({ analysis }: { analysis: BasketAnalysis }) {
  const store = stores.find((s) => s.id === analysis.storeId);

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-background/30">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: store?.color }}
        >
          {store?.nameHe.charAt(0)}
        </div>
        <span className="font-medium">{store?.nameHe}</span>
      </div>
      <div className="text-left">
        <span className="font-semibold price">₪{analysis.total.toFixed(2)}</span>
        {analysis.savings > 0 && (
          <span className="text-xs text-foreground-secondary mr-2">
            +₪{analysis.savings.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
