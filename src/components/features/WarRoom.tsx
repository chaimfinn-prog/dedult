'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Clock,
  MapPin,
  ExternalLink,
  Bell,
  BellOff,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { PriceAnomaly } from '@/types';
import { priceAnomalies } from '@/data/prices';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export function WarRoom() {
  const [filter, setFilter] = useState<'all' | 'drop' | 'spike'>('all');
  const [notifications, setNotifications] = useState(true);

  const filteredAnomalies = priceAnomalies.filter((a) => {
    if (filter === 'all') return true;
    return a.type === filter;
  });

  const dropCount = priceAnomalies.filter((a) => a.type === 'drop').length;
  const spikeCount = priceAnomalies.filter((a) => a.type === 'spike').length;

  return (
    <section id="warroom" className="py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-danger/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h2 className="text-xl font-bold">חדר המבצעים</h2>
              <p className="text-sm text-foreground-secondary">
                {priceAnomalies.length} אנומליות מחיר נמצאו
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setNotifications(!notifications)}
            className={`p-2 rounded-xl transition-colors ${
              notifications ? 'bg-accent/10 text-accent' : 'bg-border text-foreground-secondary'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {notifications ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
          </motion.button>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <FilterPill
            active={filter === 'all'}
            onClick={() => setFilter('all')}
            label="הכל"
            count={priceAnomalies.length}
          />
          <FilterPill
            active={filter === 'drop'}
            onClick={() => setFilter('drop')}
            label="ירידות מחיר"
            count={dropCount}
            variant="success"
          />
          <FilterPill
            active={filter === 'spike'}
            onClick={() => setFilter('spike')}
            label="עליות מחיר"
            count={spikeCount}
            variant="danger"
          />
        </div>

        {/* Anomalies List */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredAnomalies.map((anomaly, index) => (
              <AnomalyCard key={anomaly.id} anomaly={anomaly} index={index} />
            ))}
          </AnimatePresence>
        </div>

        {filteredAnomalies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-8 text-center"
          >
            <Filter className="w-10 h-10 mx-auto mb-3 text-foreground-secondary" />
            <p className="text-foreground-secondary">
              אין אנומליות מחיר בקטגוריה זו
            </p>
          </motion.div>
        )}

        {/* Info Box */}
        <motion.div
          className="glass-card p-4 bg-gradient-to-l from-warning/5 to-transparent border border-warning/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-warning">איך זה עובד?</p>
              <p className="text-foreground-secondary mt-1">
                המערכת סורקת שינויי מחירים חריגים בזמן אמת. ירידה של מעל 30% או עלייה של מעל 40% מסומנות כאנומליה ומופיעות כאן.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
  variant = 'default',
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  variant?: 'default' | 'success' | 'danger';
}) {
  const colors = {
    default: active ? 'bg-accent text-white' : 'bg-background-secondary text-foreground-secondary',
    success: active ? 'bg-success text-white' : 'bg-success/10 text-success',
    danger: active ? 'bg-danger text-white' : 'bg-danger/10 text-danger',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${colors[variant]}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {label}
      <span
        className={`px-1.5 py-0.5 rounded-full text-xs ${
          active ? 'bg-white/20' : 'bg-current/10'
        }`}
      >
        {count}
      </span>
    </motion.button>
  );
}

function AnomalyCard({ anomaly, index }: { anomaly: PriceAnomaly; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const isDrop = anomaly.type === 'drop';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className={`glass-card overflow-hidden ${
        isDrop ? 'border-r-4 border-r-success' : 'border-r-4 border-r-danger'
      }`}
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDrop ? 'bg-success/10' : 'bg-danger/10'
              }`}
            >
              {isDrop ? (
                <TrendingDown className="w-5 h-5 text-success" />
              ) : (
                <TrendingUp className="w-5 h-5 text-danger" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold truncate">{anomaly.productName}</h3>
              <div className="flex items-center gap-2 text-sm text-foreground-secondary mt-1">
                <span>{anomaly.storeName}</span>
                {anomaly.branchName && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {anomaly.branchName}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Price Change */}
          <div className="text-left shrink-0">
            <div
              className={`text-lg font-bold ${isDrop ? 'text-success' : 'text-danger'}`}
            >
              {isDrop ? '' : '+'}
              {anomaly.percentageChange}%
            </div>
            <div className="flex items-center gap-1 text-xs text-foreground-secondary">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(anomaly.detectedAt, { locale: he, addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Expand Indicator */}
        <motion.div
          className="flex items-center justify-center mt-3 text-foreground-secondary"
          animate={{ rotate: expanded ? 180 : 0 }}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-border">
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-background/30 rounded-lg p-3">
                  <p className="text-xs text-foreground-secondary">מחיר קודם</p>
                  <p className="font-semibold price-original">
                    ₪{anomaly.previousPrice.toFixed(2)}
                  </p>
                </div>
                <div className="bg-background/30 rounded-lg p-3">
                  <p className="text-xs text-foreground-secondary">מחיר נוכחי</p>
                  <p className={`font-semibold price ${isDrop ? 'price-sale' : 'text-danger'}`}>
                    ₪{anomaly.currentPrice.toFixed(2)}
                  </p>
                </div>
              </div>

              {isDrop && (
                <motion.a
                  href="#"
                  className="mt-4 w-full flex items-center justify-center gap-2 btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>הוסף לסל</span>
                  <ExternalLink className="w-4 h-4" />
                </motion.a>
              )}

              {!isDrop && (
                <div className="mt-4 p-3 rounded-lg bg-danger/10 text-danger text-sm">
                  <p>
                    <strong>אזהרה:</strong> המחיר עלה משמעותית. כדאי לבדוק חלופות בחנויות אחרות.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
