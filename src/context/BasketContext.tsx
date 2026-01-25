'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Product, BasketItem, OptimizationResult, BasketAnalysis, SplitStrategy, BasketItemPrice } from '@/types';
import { stores } from '@/data/stores';
import { storePrices, getEffectivePrice } from '@/data/prices';

interface BasketContextType {
  items: BasketItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearBasket: () => void;
  totalItems: number;
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  optimize: () => Promise<void>;
  clearOptimization: () => void;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const addItem = useCallback((product: Product) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setOptimizationResult(null);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    setOptimizationResult(null);
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity } : item))
    );
    setOptimizationResult(null);
  }, [removeItem]);

  const clearBasket = useCallback(() => {
    setItems([]);
    setOptimizationResult(null);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate price for all items at a specific store
  const calculateStoreTotal = useCallback((storeId: string): BasketAnalysis => {
    const store = stores.find((s) => s.id === storeId)!;
    const itemPrices: BasketItemPrice[] = [];
    let subtotal = 0;
    const missingItems: string[] = [];

    for (const item of items) {
      const priceData = storePrices.find(
        (p) => p.productId === item.product.id && p.storeId === storeId
      );

      if (priceData) {
        const effectivePrice = getEffectivePrice(priceData);
        const totalPrice = effectivePrice * item.quantity;
        subtotal += totalPrice;

        itemPrices.push({
          productId: item.product.id,
          productName: item.product.nameHe,
          quantity: item.quantity,
          unitPrice: effectivePrice,
          totalPrice,
          isOnSale: !!priceData.salePrice,
          originalPrice: priceData.salePrice ? priceData.price : undefined,
        });
      } else {
        missingItems.push(item.product.nameHe);
      }
    }

    const deliveryFee = subtotal >= store.minOrderForFreeDelivery ? 0 : store.deliveryFee;

    return {
      storeId,
      storeName: store.nameHe,
      storeColor: store.color,
      items: itemPrices,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      total: Math.round((subtotal + deliveryFee) * 100) / 100,
      savings: 0, // Will be calculated after comparing all stores
      hasMissingItems: missingItems.length > 0,
      missingItems,
    };
  }, [items]);

  // AI Split Strategy - Find the optimal distribution across stores
  const calculateSplitStrategy = useCallback((allStoreAnalyses: BasketAnalysis[]): SplitStrategy => {
    // For each product, find the cheapest store
    const productBestPrices: Map<string, { storeId: string; price: number; item: BasketItemPrice }> = new Map();

    for (const analysis of allStoreAnalyses) {
      for (const item of analysis.items) {
        const existing = productBestPrices.get(item.productId);
        if (!existing || item.unitPrice < existing.price) {
          productBestPrices.set(item.productId, {
            storeId: analysis.storeId,
            price: item.unitPrice,
            item,
          });
        }
      }
    }

    // Group items by store
    const storeGroups: Map<string, BasketItemPrice[]> = new Map();
    for (const [, data] of productBestPrices) {
      const existing = storeGroups.get(data.storeId) || [];
      existing.push(data.item);
      storeGroups.set(data.storeId, existing);
    }

    // Build split orders
    const splitOrders: SplitStrategy['stores'] = [];
    let totalCost = 0;
    let totalDeliveryFees = 0;

    for (const [storeId, storeItems] of storeGroups) {
      const store = stores.find((s) => s.id === storeId)!;
      const subtotal = storeItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee = subtotal >= store.minOrderForFreeDelivery ? 0 : store.deliveryFee;

      splitOrders.push({
        storeId,
        storeName: store.nameHe,
        storeColor: store.color,
        items: storeItems,
        subtotal: Math.round(subtotal * 100) / 100,
        deliveryFee,
        total: Math.round((subtotal + deliveryFee) * 100) / 100,
        deepLink: generateDeepLink(storeId, storeItems),
      });

      totalCost += subtotal + deliveryFee;
      totalDeliveryFees += deliveryFee;
    }

    // Find cheapest single store for comparison
    const cheapestSingle = allStoreAnalyses.reduce((min, analysis) =>
      analysis.total < min.total ? analysis : min
    );

    const totalSavings = Math.round((cheapestSingle.total - totalCost) * 100) / 100;

    // Generate recommendation
    let recommendation = '';
    if (splitOrders.length === 1) {
      recommendation = `הכי משתלם לקנות הכל ב${splitOrders[0].storeName}`;
    } else if (totalSavings > 0) {
      const storeNames = splitOrders.map((o) => o.storeName).join(' ו-');
      recommendation = `פצל את ההזמנה בין ${storeNames} וחסוך ₪${Math.abs(totalSavings).toFixed(2)}`;
    } else {
      recommendation = `קנה הכל ב${cheapestSingle.storeName} - פיצול לא משתלם בגלל דמי משלוח`;
    }

    return {
      stores: splitOrders,
      totalCost: Math.round(totalCost * 100) / 100,
      totalDeliveryFees: Math.round(totalDeliveryFees * 100) / 100,
      totalSavings: Math.max(0, totalSavings),
      savingsVsSingleStore: totalSavings,
      recommendation,
    };
  }, []);

  // Generate mock deep link for a store
  const generateDeepLink = (storeId: string, items: BasketItemPrice[]): string => {
    const baseUrls: Record<string, string> = {
      shufersal: 'https://www.shufersal.co.il/online/he/cart?items=',
      rami_levy: 'https://www.rami-levy.co.il/he/online/cart?products=',
      victory: 'https://www.victoryonline.co.il/cart?add=',
      carrefour: 'https://www.carrefour.co.il/cart?items=',
      yohananof: 'https://www.yohananof.co.il/cart?products=',
    };

    const itemParams = items.map((item) => `${item.productId}:${item.quantity}`).join(',');
    return `${baseUrls[storeId] || '#'}${itemParams}`;
  };

  const optimize = useCallback(async () => {
    if (items.length === 0) return;

    setIsOptimizing(true);

    // Simulate API delay for realistic feel
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Calculate totals for all stores
    const allStores: BasketAnalysis[] = stores.map((store) => calculateStoreTotal(store.id));

    // Find cheapest single store
    const cheapestSingle = allStores.reduce((min, analysis) =>
      analysis.total < min.total ? analysis : min
    );

    // Calculate savings for each store compared to most expensive
    const mostExpensive = allStores.reduce((max, analysis) =>
      analysis.total > max.total ? analysis : max
    );

    const allStoresWithSavings = allStores.map((analysis) => ({
      ...analysis,
      savings: Math.round((mostExpensive.total - analysis.total) * 100) / 100,
    }));

    // Calculate smart split strategy
    const smartSplit = calculateSplitStrategy(allStores);

    // Find fastest delivery (lowest estimated delivery time)
    const sortedByDelivery = [...stores].sort(
      (a, b) => a.estimatedDeliveryMinutes - b.estimatedDeliveryMinutes
    );
    const fastestStore = sortedByDelivery[0];
    const fastestDelivery = allStoresWithSavings.find((a) => a.storeId === fastestStore.id)!;

    setOptimizationResult({
      cheapestSingleStore: { ...cheapestSingle, savings: mostExpensive.total - cheapestSingle.total },
      smartSplit,
      fastestDelivery,
      allStores: allStoresWithSavings.sort((a, b) => a.total - b.total),
    });

    setIsOptimizing(false);
  }, [items, calculateStoreTotal, calculateSplitStrategy]);

  const clearOptimization = useCallback(() => {
    setOptimizationResult(null);
  }, []);

  return (
    <BasketContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearBasket,
        totalItems,
        optimizationResult,
        isOptimizing,
        optimize,
        clearOptimization,
      }}
    >
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}
