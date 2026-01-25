/**
 * Sali AI - Israeli Price Transparency XML Scraper
 *
 * This module is designed to parse price transparency XML files from Israeli retailers
 * as mandated by the Israeli Ministry of Economy.
 *
 * The price transparency law requires supermarkets to publish their prices in XML format.
 * Files are available at: https://prices.shufersal.co.il (and similar URLs for other chains)
 *
 * XML File Types:
 * - PriceFull: Complete price list for a store
 * - Prices: Partial price updates
 * - Promos: Promotions and discounts
 * - Stores: Store information
 *
 * This is a skeleton implementation - actual URLs and parsing logic will need to be
 * customized based on each retailer's specific XML structure.
 */

import { parseStringPromise } from 'xml2js';

// Types for the XML structure
interface PriceItem {
  itemCode: string;
  itemName: string;
  manufacturerName: string;
  unitQuantity: string;
  unitOfMeasure: string;
  quantity: string;
  itemPrice: number;
  unitOfMeasurePrice: number;
  allowDiscount: boolean;
  itemStatus: string;
}

interface StoreInfo {
  storeId: string;
  storeName: string;
  address: string;
  city: string;
  chainId: string;
  chainName: string;
}

interface PromoItem {
  promotionId: string;
  promotionDescription: string;
  startDate: Date;
  endDate: Date;
  minQty: number;
  maxQty: number;
  discountRate: number;
  discountType: string;
  itemCodes: string[];
}

// Retailer configurations
const RETAILER_CONFIGS = {
  shufersal: {
    name: 'שופרסל',
    baseUrl: 'https://prices.shufersal.co.il',
    priceFilePattern: '/FileObject/UpdateCategory?catID={categoryId}&storeId={storeId}',
    chainId: '7290027600007',
  },
  rami_levy: {
    name: 'רמי לוי',
    baseUrl: 'https://url.publishedprices.co.il',
    priceFilePattern: '/file/d/{chainId}/{storeId}/{date}/PriceFull{storeId}.xml',
    chainId: '7290058140886',
  },
  victory: {
    name: 'ויקטורי',
    baseUrl: 'https://matrixcatalog.co.il',
    priceFilePattern: '/NBCompetitionReg498.aspx',
    chainId: '7290696200003',
  },
  carrefour: {
    name: 'קרפור',
    baseUrl: 'https://prices.carrefour.co.il',
    priceFilePattern: '/main/PriceFull{storeId}.xml',
    chainId: '7290633800006',
  },
  yohananof: {
    name: 'יוחננוף',
    baseUrl: 'https://publishprice.yohananof.co.il',
    priceFilePattern: '/prices/PriceFull{storeId}.xml',
    chainId: '7290803800003',
  },
};

/**
 * Fetch and parse a price XML file from a retailer
 */
async function fetchPriceFile(
  retailerId: keyof typeof RETAILER_CONFIGS,
  storeId: string
): Promise<PriceItem[]> {
  const config = RETAILER_CONFIGS[retailerId];

  // Build the URL (this is a simplified example)
  const url = `${config.baseUrl}${config.priceFilePattern
    .replace('{storeId}', storeId)
    .replace('{chainId}', config.chainId)
    .replace('{date}', formatDate(new Date()))}`;

  console.log(`Fetching prices from: ${url}`);

  try {
    // In production, use actual fetch
    // const response = await fetch(url);
    // const xml = await response.text();

    // Mock XML for demonstration
    const xml = getMockPriceXml();

    const result = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: true,
    });

    return parsePriceItems(result);
  } catch (error) {
    console.error(`Error fetching prices for ${retailerId}:`, error);
    return [];
  }
}

/**
 * Parse price items from the XML structure
 */
function parsePriceItems(xmlData: unknown): PriceItem[] {
  const items: PriceItem[] = [];

  try {
    // The exact path depends on the retailer's XML structure
    // This is a common pattern:
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = xmlData as any;
    const root = data?.Root || data;
    const priceItems = root?.Items?.Item || root?.Products?.Product || [];

    const itemArray = Array.isArray(priceItems) ? priceItems : [priceItems];

    for (const item of itemArray) {
      const itemRecord = item as Record<string, unknown>;
      items.push({
        itemCode: String(itemRecord.ItemCode || itemRecord.itemcode || ''),
        itemName: String(itemRecord.ItemName || itemRecord.itemname || ''),
        manufacturerName: String(itemRecord.ManufacturerName || itemRecord.manufacturer || ''),
        unitQuantity: String(itemRecord.UnitQty || itemRecord.unitqty || ''),
        unitOfMeasure: String(itemRecord.UnitOfMeasure || itemRecord.unitofmeasure || ''),
        quantity: String(itemRecord.Quantity || itemRecord.quantity || '1'),
        itemPrice: parseFloat(String(itemRecord.ItemPrice || itemRecord.price || '0')),
        unitOfMeasurePrice: parseFloat(
          String(itemRecord.UnitOfMeasurePrice || itemRecord.unitprice || '0')
        ),
        allowDiscount: String(itemRecord.AllowDiscount || itemRecord.allowdiscount) === '1',
        itemStatus: String(itemRecord.ItemStatus || itemRecord.itemstatus || ''),
      });
    }
  } catch (error) {
    console.error('Error parsing price items:', error);
  }

  return items;
}

/**
 * Fetch and parse promotions XML file
 */
async function fetchPromotions(
  retailerId: keyof typeof RETAILER_CONFIGS,
  storeId: string
): Promise<PromoItem[]> {
  const config = RETAILER_CONFIGS[retailerId];

  // Build promo URL (simplified)
  const url = `${config.baseUrl}/promos/Promo${storeId}.xml`;

  console.log(`Fetching promotions from: ${url}`);

  try {
    // Mock XML for demonstration
    const xml = getMockPromoXml();

    const result = await parseStringPromise(xml, {
      explicitArray: false,
      ignoreAttrs: true,
    });

    return parsePromoItems(result);
  } catch (error) {
    console.error(`Error fetching promotions for ${retailerId}:`, error);
    return [];
  }
}

/**
 * Parse promotion items from the XML structure
 */
function parsePromoItems(xmlData: unknown): PromoItem[] {
  const items: PromoItem[] = [];

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = xmlData as any;
    const root = data?.Root || data;
    const promoItems = root?.Promotions?.Promotion || root?.Promos?.Promo || [];

    const itemArray = Array.isArray(promoItems) ? promoItems : [promoItems];

    for (const promo of itemArray) {
      const promoRecord = promo as Record<string, unknown>;
      items.push({
        promotionId: String(promoRecord.PromotionId || ''),
        promotionDescription: String(promoRecord.PromotionDescription || ''),
        startDate: new Date(String(promoRecord.PromotionStartDate || '')),
        endDate: new Date(String(promoRecord.PromotionEndDate || '')),
        minQty: parseInt(String(promoRecord.MinQty || '0'), 10),
        maxQty: parseInt(String(promoRecord.MaxQty || '0'), 10),
        discountRate: parseFloat(String(promoRecord.DiscountRate || '0')),
        discountType: String(promoRecord.DiscountType || ''),
        itemCodes: parseItemCodes(promoRecord.PromotionItems),
      });
    }
  } catch (error) {
    console.error('Error parsing promo items:', error);
  }

  return items;
}

function parseItemCodes(items: unknown): string[] {
  if (!items) return [];
  const itemsRecord = items as Record<string, unknown>;
  const itemArray = Array.isArray(itemsRecord.Item) ? itemsRecord.Item : [itemsRecord.Item];
  return itemArray.map((item) => String((item as Record<string, unknown>)?.ItemCode || item));
}

/**
 * Main scraper function - updates prices for all stores
 */
async function updateAllPrices(): Promise<void> {
  console.log('Starting price update...');

  for (const [retailerId, config] of Object.entries(RETAILER_CONFIGS)) {
    console.log(`\nProcessing ${config.name}...`);

    // In production, you would:
    // 1. Fetch the list of stores for this retailer
    // 2. For each store, fetch the price file
    // 3. Parse and store the prices in your database
    // 4. Detect price anomalies

    // Example for a single store
    const storeId = '001'; // Example store ID
    const prices = await fetchPriceFile(
      retailerId as keyof typeof RETAILER_CONFIGS,
      storeId
    );
    const promos = await fetchPromotions(
      retailerId as keyof typeof RETAILER_CONFIGS,
      storeId
    );

    console.log(`  Found ${prices.length} products`);
    console.log(`  Found ${promos.length} promotions`);

    // Here you would:
    // - Store prices in database
    // - Calculate price changes
    // - Detect anomalies
    // - Update cache
  }

  console.log('\nPrice update complete!');
}

/**
 * Detect price anomalies (significant price changes)
 */
function detectAnomalies(
  currentPrices: PriceItem[],
  previousPrices: Map<string, number>,
  threshold: number = 0.3
): Array<{ item: PriceItem; previousPrice: number; changePercent: number }> {
  const anomalies: Array<{
    item: PriceItem;
    previousPrice: number;
    changePercent: number;
  }> = [];

  for (const item of currentPrices) {
    const prevPrice = previousPrices.get(item.itemCode);
    if (prevPrice) {
      const changePercent = (item.itemPrice - prevPrice) / prevPrice;
      if (Math.abs(changePercent) >= threshold) {
        anomalies.push({
          item,
          previousPrice: prevPrice,
          changePercent,
        });
      }
    }
  }

  return anomalies;
}

// Helper functions
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}

// Mock XML data for demonstration
function getMockPriceXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <Items>
    <Item>
      <ItemCode>7290000000001</ItemCode>
      <ItemName>חלב תנובה 3%</ItemName>
      <ManufacturerName>תנובה</ManufacturerName>
      <UnitQty>1</UnitQty>
      <UnitOfMeasure>ליטר</UnitOfMeasure>
      <ItemPrice>6.90</ItemPrice>
      <AllowDiscount>1</AllowDiscount>
    </Item>
    <Item>
      <ItemCode>7290000000002</ItemCode>
      <ItemName>קוטג' תנובה 5%</ItemName>
      <ManufacturerName>תנובה</ManufacturerName>
      <UnitQty>250</UnitQty>
      <UnitOfMeasure>גרם</UnitOfMeasure>
      <ItemPrice>11.90</ItemPrice>
      <AllowDiscount>1</AllowDiscount>
    </Item>
  </Items>
</Root>`;
}

function getMockPromoXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Root>
  <Promotions>
    <Promotion>
      <PromotionId>12345</PromotionId>
      <PromotionDescription>1+1 על מוצרי חלב</PromotionDescription>
      <PromotionStartDate>2024-01-01</PromotionStartDate>
      <PromotionEndDate>2024-01-31</PromotionEndDate>
      <MinQty>2</MinQty>
      <MaxQty>10</MaxQty>
      <DiscountRate>50</DiscountRate>
      <DiscountType>percent</DiscountType>
      <PromotionItems>
        <Item><ItemCode>7290000000001</ItemCode></Item>
        <Item><ItemCode>7290000000002</ItemCode></Item>
      </PromotionItems>
    </Promotion>
  </Promotions>
</Root>`;
}

// Export for use as a module
export {
  fetchPriceFile,
  fetchPromotions,
  updateAllPrices,
  detectAnomalies,
  RETAILER_CONFIGS,
  type PriceItem,
  type StoreInfo,
  type PromoItem,
};

// CLI entry point
if (require.main === module) {
  updateAllPrices().catch(console.error);
}
