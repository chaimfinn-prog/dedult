// Core data types for Sali AI

export interface Product {
  id: string;
  name: string;
  nameHe: string;
  barcode: string;
  category: ProductCategory;
  image?: string;
  brand: string;
  unit: string;
  unitAmount: number;
}

export type ProductCategory =
  | 'dairy'
  | 'bread'
  | 'meat'
  | 'produce'
  | 'dry_goods'
  | 'beverages'
  | 'frozen'
  | 'snacks'
  | 'cleaning'
  | 'personal_care';

export const categoryLabels: Record<ProductCategory, string> = {
  dairy: 'מוצרי חלב',
  bread: 'לחם ומאפים',
  meat: 'בשר ודגים',
  produce: 'פירות וירקות',
  dry_goods: 'מזון יבש',
  beverages: 'משקאות',
  frozen: 'קפואים',
  snacks: 'חטיפים',
  cleaning: 'ניקיון',
  personal_care: 'טיפוח אישי',
};

export interface Store {
  id: string;
  name: string;
  nameHe: string;
  logo: string;
  color: string;
  deliveryFee: number;
  minOrderForFreeDelivery: number;
  estimatedDeliveryMinutes: number;
  branches: StoreBranch[];
}

export interface StoreBranch {
  id: string;
  storeId: string;
  name: string;
  city: string;
  address: string;
}

export interface StorePrice {
  productId: string;
  storeId: string;
  branchId?: string;
  price: number;
  salePrice?: number;
  updateDate: Date;
  priceHistory: PricePoint[];
}

export interface PricePoint {
  date: Date;
  price: number;
}

export interface BasketItem {
  product: Product;
  quantity: number;
}

export interface BasketAnalysis {
  storeId: string;
  storeName: string;
  storeColor: string;
  items: BasketItemPrice[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  savings: number;
  hasMissingItems: boolean;
  missingItems: string[];
}

export interface BasketItemPrice {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isOnSale: boolean;
  originalPrice?: number;
}

export interface SplitStrategy {
  stores: SplitStoreOrder[];
  totalCost: number;
  totalDeliveryFees: number;
  totalSavings: number;
  savingsVsSingleStore: number;
  recommendation: string;
}

export interface SplitStoreOrder {
  storeId: string;
  storeName: string;
  storeColor: string;
  items: BasketItemPrice[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  deepLink: string;
}

export interface OptimizationResult {
  cheapestSingleStore: BasketAnalysis;
  smartSplit: SplitStrategy;
  fastestDelivery: BasketAnalysis;
  allStores: BasketAnalysis[];
}

export interface PriceAnomaly {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  branchId?: string;
  branchName?: string;
  previousPrice: number;
  currentPrice: number;
  percentageChange: number;
  detectedAt: Date;
  type: 'drop' | 'spike';
}

export interface UserStats {
  totalSavings: number;
  basketsOptimized: number;
  favoriteStore: string;
  lastOptimization: Date;
  monthlySavings: { month: string; savings: number }[];
}
