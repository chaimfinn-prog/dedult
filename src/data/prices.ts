import { StorePrice, PriceAnomaly } from '@/types';
import { products } from './products';
import { stores } from './stores';

// Generate realistic price variations for each product across stores
function generatePriceHistory(basePrice: number, days: number = 30): { date: Date; price: number }[] {
  const history: { date: Date; price: number }[] = [];
  let currentPrice = basePrice;

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    // Random price fluctuation (-5% to +5%)
    const fluctuation = 1 + (Math.random() - 0.5) * 0.1;
    currentPrice = Math.round(basePrice * fluctuation * 100) / 100;

    // Occasional sales (10% chance)
    if (Math.random() < 0.1) {
      currentPrice = Math.round(currentPrice * 0.8 * 100) / 100;
    }

    history.push({ date, price: currentPrice });
  }

  return history;
}

// Base prices for products (these will vary by store)
const basePrices: Record<string, number> = {
  p1: 6.9, // Milk
  p2: 11.9, // Cottage
  p3: 18.9, // Emek Cheese
  p4: 5.5, // Yogurt
  p5: 5.9, // Milky
  p6: 9.9, // White Bread
  p7: 12.9, // Whole Wheat Bread
  p8: 7.9, // Pita
  p9: 8.5, // Spaghetti
  p10: 9.9, // Couscous
  p11: 14.9, // Rice
  p12: 22.9, // Turkish Coffee
  p13: 34.9, // Instant Coffee
  p14: 8.9, // Coca Cola
  p15: 4.5, // Water
  p16: 12.9, // Orange Juice
  p17: 8.9, // Tomatoes
  p18: 6.9, // Cucumbers
  p19: 12.9, // Apples
  p20: 9.9, // Bananas
  p21: 39.9, // Chicken Breast
  p22: 54.9, // Ground Beef
  p23: 5.9, // Bamba
  p24: 5.9, // Bisli
  p25: 14.9, // Dish Soap
  p26: 29.9, // Pizza
  p27: 34.9, // Ice Cream
  p28: 29.9, // Shampoo
  p29: 14.9, // Toothpaste
  p30: 22.9, // Eggs
};

// Store-specific price multipliers (some stores are cheaper for certain categories)
const storeMultipliers: Record<string, Record<string, number>> = {
  shufersal: {
    dairy: 0.95,
    bread: 1.0,
    meat: 1.05,
    produce: 1.1,
    dry_goods: 0.98,
    beverages: 1.0,
    frozen: 0.95,
    snacks: 1.0,
    cleaning: 0.9,
    personal_care: 0.95,
  },
  rami_levy: {
    dairy: 0.9,
    bread: 0.92,
    meat: 0.88,
    produce: 0.85,
    dry_goods: 0.9,
    beverages: 0.95,
    frozen: 1.0,
    snacks: 0.95,
    cleaning: 0.95,
    personal_care: 1.05,
  },
  victory: {
    dairy: 1.02,
    bread: 1.05,
    meat: 0.95,
    produce: 0.88,
    dry_goods: 1.02,
    beverages: 0.92,
    frozen: 0.98,
    snacks: 1.0,
    cleaning: 1.0,
    personal_care: 0.98,
  },
  carrefour: {
    dairy: 1.0,
    bread: 0.98,
    meat: 1.0,
    produce: 1.05,
    dry_goods: 0.95,
    beverages: 0.98,
    frozen: 1.02,
    snacks: 0.9,
    cleaning: 1.0,
    personal_care: 1.0,
  },
  yohananof: {
    dairy: 1.08,
    bread: 1.1,
    meat: 1.1,
    produce: 1.0,
    dry_goods: 1.05,
    beverages: 1.05,
    frozen: 1.1,
    snacks: 1.05,
    cleaning: 1.08,
    personal_care: 1.1,
  },
};

// Generate all store prices
export function generateStorePrices(): StorePrice[] {
  const prices: StorePrice[] = [];

  for (const product of products) {
    const basePrice = basePrices[product.id] || 10;

    for (const store of stores) {
      const multiplier = storeMultipliers[store.id]?.[product.category] || 1;
      const storePrice = Math.round(basePrice * multiplier * 100) / 100;

      // Some products have sales (15% chance)
      const isOnSale = Math.random() < 0.15;
      const salePrice = isOnSale ? Math.round(storePrice * 0.8 * 100) / 100 : undefined;

      prices.push({
        productId: product.id,
        storeId: store.id,
        price: storePrice,
        salePrice,
        updateDate: new Date(),
        priceHistory: generatePriceHistory(storePrice),
      });
    }
  }

  return prices;
}

// Get price for a specific product at a specific store
export function getPrice(productId: string, storeId: string, prices: StorePrice[]): StorePrice | undefined {
  return prices.find((p) => p.productId === productId && p.storeId === storeId);
}

// Get the effective price (sale price if available, otherwise regular price)
export function getEffectivePrice(storePrice: StorePrice): number {
  return storePrice.salePrice || storePrice.price;
}

// Get all prices for a product across all stores
export function getProductPrices(productId: string, prices: StorePrice[]): StorePrice[] {
  return prices.filter((p) => p.productId === productId);
}

// Generate mock price anomalies
export function generatePriceAnomalies(): PriceAnomaly[] {
  const anomalies: PriceAnomaly[] = [
    {
      id: 'anomaly-1',
      productId: 'p12',
      productName: 'קפה טורקי עלית',
      storeId: 'rami_levy',
      storeName: 'רמי לוי',
      branchId: 'rami-mod-1',
      branchName: 'רמי לוי מודיעין',
      previousPrice: 22.9,
      currentPrice: 11.45,
      percentageChange: -50,
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      type: 'drop',
    },
    {
      id: 'anomaly-2',
      productId: 'p21',
      productName: 'חזה עוף',
      storeId: 'victory',
      storeName: 'ויקטורי',
      branchId: 'vic-tlv-1',
      branchName: 'ויקטורי תל אביב',
      previousPrice: 39.9,
      currentPrice: 23.94,
      percentageChange: -40,
      detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      type: 'drop',
    },
    {
      id: 'anomaly-3',
      productId: 'p23',
      productName: 'במבה',
      storeId: 'shufersal',
      storeName: 'שופרסל',
      branchId: 'shuf-raa-1',
      branchName: 'שופרסל דיל רעננה',
      previousPrice: 5.9,
      currentPrice: 2.95,
      percentageChange: -50,
      detectedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      type: 'drop',
    },
    {
      id: 'anomaly-4',
      productId: 'p13',
      productName: 'נס קפה טסטר\'ס צ\'ויס',
      storeId: 'yohananof',
      storeName: 'יוחננוף',
      branchId: 'yoh-raa-1',
      branchName: 'יוחננוף רעננה',
      previousPrice: 34.9,
      currentPrice: 17.45,
      percentageChange: -50,
      detectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      type: 'drop',
    },
    {
      id: 'anomaly-5',
      productId: 'p27',
      productName: 'גלידה וניל',
      storeId: 'carrefour',
      storeName: 'קרפור',
      previousPrice: 34.9,
      currentPrice: 52.35,
      percentageChange: 50,
      detectedAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      type: 'spike',
    },
  ];

  return anomalies;
}

// Initialize prices on module load
export const storePrices = generateStorePrices();
export const priceAnomalies = generatePriceAnomalies();
