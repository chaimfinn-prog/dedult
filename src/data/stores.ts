import { Store } from '@/types';

export const stores: Store[] = [
  {
    id: 'shufersal',
    name: 'Shufersal',
    nameHe: 'שופרסל',
    logo: '/stores/shufersal.png',
    color: '#e31e24',
    deliveryFee: 34.9,
    minOrderForFreeDelivery: 250,
    estimatedDeliveryMinutes: 120,
    branches: [
      { id: 'shuf-tlv-1', storeId: 'shufersal', name: 'שופרסל דיל תל אביב', city: 'תל אביב', address: 'דיזנגוף 50' },
      { id: 'shuf-jer-1', storeId: 'shufersal', name: 'שופרסל אקספרס ירושלים', city: 'ירושלים', address: 'יפו 23' },
      { id: 'shuf-hfa-1', storeId: 'shufersal', name: 'שופרסל שלי חיפה', city: 'חיפה', address: 'הנמל 12' },
      { id: 'shuf-raa-1', storeId: 'shufersal', name: 'שופרסל דיל רעננה', city: 'רעננה', address: 'אחוזה 100' },
    ],
  },
  {
    id: 'rami_levy',
    name: 'Rami Levy',
    nameHe: 'רמי לוי',
    logo: '/stores/rami_levy.png',
    color: '#0066cc',
    deliveryFee: 29.9,
    minOrderForFreeDelivery: 200,
    estimatedDeliveryMinutes: 90,
    branches: [
      { id: 'rami-tlv-1', storeId: 'rami_levy', name: 'רמי לוי תל אביב', city: 'תל אביב', address: 'שלמה המלך 15' },
      { id: 'rami-mod-1', storeId: 'rami_levy', name: 'רמי לוי מודיעין', city: 'מודיעין', address: 'ליגד 5' },
      { id: 'rami-bsh-1', storeId: 'rami_levy', name: 'רמי לוי באר שבע', city: 'באר שבע', address: 'הנשיאים 30' },
    ],
  },
  {
    id: 'victory',
    name: 'Victory',
    nameHe: 'ויקטורי',
    logo: '/stores/victory.png',
    color: '#ff6600',
    deliveryFee: 39.9,
    minOrderForFreeDelivery: 300,
    estimatedDeliveryMinutes: 150,
    branches: [
      { id: 'vic-tlv-1', storeId: 'victory', name: 'ויקטורי תל אביב', city: 'תל אביב', address: 'אבן גבירול 80' },
      { id: 'vic-pt-1', storeId: 'victory', name: 'ויקטורי פתח תקווה', city: 'פתח תקווה', address: 'רוטשילד 55' },
      { id: 'vic-hfa-1', storeId: 'victory', name: 'ויקטורי חיפה', city: 'חיפה', address: 'העצמאות 10' },
    ],
  },
  {
    id: 'carrefour',
    name: 'Carrefour',
    nameHe: 'קרפור',
    logo: '/stores/carrefour.png',
    color: '#004e9f',
    deliveryFee: 35,
    minOrderForFreeDelivery: 275,
    estimatedDeliveryMinutes: 180,
    branches: [
      { id: 'car-tlv-1', storeId: 'carrefour', name: 'קרפור עזריאלי', city: 'תל אביב', address: 'מרכז עזריאלי' },
      { id: 'car-hd-1', storeId: 'carrefour', name: 'קרפור הוד השרון', city: 'הוד השרון', address: 'דרך רמתיים 20' },
    ],
  },
  {
    id: 'yohananof',
    name: 'Yohananof',
    nameHe: 'יוחננוף',
    logo: '/stores/yohananof.png',
    color: '#00a651',
    deliveryFee: 25,
    minOrderForFreeDelivery: 150,
    estimatedDeliveryMinutes: 60,
    branches: [
      { id: 'yoh-tlv-1', storeId: 'yohananof', name: 'יוחננוף פלורנטין', city: 'תל אביב', address: 'פלורנטין 45' },
      { id: 'yoh-rg-1', storeId: 'yohananof', name: 'יוחננוף רמת גן', city: 'רמת גן', address: 'בן גוריון 1' },
      { id: 'yoh-hfa-1', storeId: 'yohananof', name: 'יוחננוף חיפה', city: 'חיפה', address: 'הרצל 30' },
      { id: 'yoh-raa-1', storeId: 'yohananof', name: 'יוחננוף רעננה', city: 'רעננה', address: 'אחוזה 50' },
    ],
  },
];

export function getStoreById(id: string): Store | undefined {
  return stores.find((s) => s.id === id);
}

export function getStoreColor(id: string): string {
  return stores.find((s) => s.id === id)?.color || '#666666';
}
