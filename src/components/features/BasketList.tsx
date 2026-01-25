'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useBasket } from '@/context/BasketContext';
import { categoryLabels } from '@/types';

export function BasketList() {
  const { items, updateQuantity, removeItem, clearBasket, totalItems } = useBasket();

  if (items.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-20 h-20 mx-auto mb-4 rounded-full bg-accent/10 flex items-center justify-center"
        >
          <ShoppingBag className="w-10 h-10 text-accent" />
        </motion.div>
        <h3 className="text-lg font-semibold mb-2">הסל שלך ריק</h3>
        <p className="text-foreground-secondary">
          התחל לחפש מוצרים והוסף אותם לסל
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-accent" />
          <h2 className="font-semibold">סל הקניות</h2>
          <span className="badge badge-accent">{totalItems} פריטים</span>
        </div>
        <motion.button
          onClick={clearBasket}
          className="text-sm text-danger hover:underline"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          נקה הכל
        </motion.button>
      </div>

      {/* Items */}
      <div className="divide-y divide-border max-h-96 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {items.map((item, index) => (
            <motion.div
              key={item.product.id}
              layout
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50, height: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center gap-3 p-4"
            >
              {/* Product Icon */}
              <div className="w-12 h-12 rounded-xl bg-background-secondary flex items-center justify-center shrink-0">
                <span className="text-2xl">
                  {getCategoryEmoji(item.product.category)}
                </span>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.product.nameHe}</p>
                <p className="text-sm text-foreground-secondary">
                  {item.product.brand} • {categoryLabels[item.product.category]}
                </p>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                <motion.button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-background-secondary hover:bg-border flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Minus className="w-4 h-4" />
                </motion.button>
                <motion.span
                  key={item.quantity}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="w-8 text-center font-semibold"
                >
                  {item.quantity}
                </motion.span>
                <motion.button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-background-secondary hover:bg-border flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Remove Button */}
              <motion.button
                onClick={() => removeItem(item.product.id)}
                className="w-8 h-8 rounded-lg hover:bg-danger/10 flex items-center justify-center transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="w-4 h-4 text-danger" />
              </motion.button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-border bg-background/30">
        <div className="flex items-center justify-between text-sm text-foreground-secondary mb-3">
          <span>סה״כ פריטים:</span>
          <span className="font-medium">{totalItems}</span>
        </div>
        <p className="text-xs text-foreground-secondary/70 text-center">
          לחץ על &quot;השווה מחירים&quot; לראות את ההצעות הטובות ביותר
        </p>
      </div>
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
