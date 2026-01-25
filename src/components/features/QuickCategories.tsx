'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus } from 'lucide-react';
import { ProductCategory, categoryLabels, Product } from '@/types';
import { getProductsByCategory } from '@/data/products';
import { useBasket } from '@/context/BasketContext';

const categories: { id: ProductCategory; emoji: string }[] = [
  { id: 'dairy', emoji: '🥛' },
  { id: 'bread', emoji: '🍞' },
  { id: 'produce', emoji: '🥬' },
  { id: 'meat', emoji: '🥩' },
  { id: 'beverages', emoji: '🥤' },
  { id: 'dry_goods', emoji: '🍝' },
  { id: 'snacks', emoji: '🍿' },
  { id: 'frozen', emoji: '🧊' },
  { id: 'cleaning', emoji: '🧹' },
  { id: 'personal_care', emoji: '🧴' },
];

export function QuickCategories() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const { addItem } = useBasket();

  const categoryProducts = selectedCategory
    ? getProductsByCategory(selectedCategory)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-4"
    >
      <h3 className="font-semibold text-foreground-secondary">הוסף לפי קטגוריה</h3>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() =>
              setSelectedCategory(
                selectedCategory === category.id ? null : category.id
              )
            }
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category.id
                ? 'bg-accent text-white'
                : 'bg-background-secondary hover:bg-border'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{category.emoji}</span>
            <span>{categoryLabels[category.id]}</span>
          </motion.button>
        ))}
      </div>

      {/* Category Products */}
      <AnimatePresence mode="wait">
        {selectedCategory && (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">
                  {categoryLabels[selectedCategory]}
                </h4>
                <span className="text-sm text-foreground-secondary">
                  {categoryProducts.length} מוצרים
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categoryProducts.map((product, index) => (
                  <ProductQuickAdd
                    key={product.id}
                    product={product}
                    onAdd={() => addItem(product)}
                    index={index}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ProductQuickAdd({
  product,
  onAdd,
  index,
}: {
  product: Product;
  onAdd: () => void;
  index: number;
}) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setAdded(true);
    setTimeout(() => setAdded(false), 1000);
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={handleAdd}
      className={`flex items-center justify-between gap-2 p-3 rounded-xl transition-all ${
        added
          ? 'bg-success/20 border border-success'
          : 'bg-background/50 hover:bg-background/80 border border-transparent'
      }`}
      whileHover={{ scale: added ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">{getCategoryEmoji(product.category)}</span>
        <span className="text-sm truncate">{product.nameHe}</span>
      </div>
      <motion.div
        animate={{ rotate: added ? 45 : 0, scale: added ? 1.2 : 1 }}
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          added ? 'bg-success text-white' : 'bg-accent/10 text-accent'
        }`}
      >
        <Plus className="w-4 h-4" />
      </motion.div>
    </motion.button>
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
