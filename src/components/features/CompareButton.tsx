'use client';

import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { useBasket } from '@/context/BasketContext';

interface CompareButtonProps {
  onOptimize: () => void;
}

export function CompareButton({ onOptimize }: CompareButtonProps) {
  const { items, isOptimizing, optimize } = useBasket();

  const handleClick = async () => {
    await optimize();
    onOptimize();
  };

  if (items.length === 0) return null;

  return (
    <motion.button
      onClick={handleClick}
      disabled={isOptimizing}
      className="w-full btn-primary h-14 text-lg flex items-center justify-center gap-3 disabled:opacity-70"
      whileHover={{ scale: isOptimizing ? 1 : 1.02 }}
      whileTap={{ scale: isOptimizing ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {isOptimizing ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          >
            <Loader2 className="w-5 h-5" />
          </motion.div>
          <span>מחשב את ההצעה הטובה ביותר...</span>
        </>
      ) : (
        <>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.div>
          <span>השווה מחירים ב-5 רשתות</span>
        </>
      )}
    </motion.button>
  );
}
