#!/usr/bin/env python3
"""
Sali AI - Israeli Price Transparency XML Scraper (Python Version)

This module is designed to parse price transparency XML files from Israeli retailers
as mandated by the Israeli Ministry of Economy.

The price transparency law requires supermarkets to publish their prices in XML format.
Files are available at: https://prices.shufersal.co.il (and similar URLs for other chains)

XML File Types:
- PriceFull: Complete price list for a store
- Prices: Partial price updates
- Promos: Promotions and discounts
- Stores: Store information

This is a skeleton implementation - actual URLs and parsing logic will need to be
customized based on each retailer's specific XML structure.

Usage:
    python price_scraper.py --retailer shufersal --store 001
    python price_scraper.py --all
"""

import argparse
import gzip
import io
import logging
import xml.etree.ElementTree as ET
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class PriceItem:
    """Represents a single product with its price"""
    item_code: str
    item_name: str
    manufacturer_name: str
    unit_quantity: str
    unit_of_measure: str
    quantity: str
    item_price: float
    unit_of_measure_price: float
    allow_discount: bool
    item_status: str


@dataclass
class StoreInfo:
    """Represents a store's information"""
    store_id: str
    store_name: str
    address: str
    city: str
    chain_id: str
    chain_name: str


@dataclass
class PromoItem:
    """Represents a promotion/discount"""
    promotion_id: str
    promotion_description: str
    start_date: datetime
    end_date: datetime
    min_qty: int
    max_qty: int
    discount_rate: float
    discount_type: str
    item_codes: List[str] = field(default_factory=list)


@dataclass
class PriceAnomaly:
    """Represents a significant price change"""
    item_code: str
    item_name: str
    store_id: str
    previous_price: float
    current_price: float
    change_percent: float
    detected_at: datetime


# Retailer configurations
RETAILER_CONFIGS = {
    'shufersal': {
        'name': 'שופרסל',
        'base_url': 'https://prices.shufersal.co.il',
        'price_file_pattern': '/FileObject/UpdateCategory?catID={category_id}&storeId={store_id}',
        'chain_id': '7290027600007',
        'stores_url': 'https://prices.shufersal.co.il/FileObject/UpdateCategory?catID=2',
    },
    'rami_levy': {
        'name': 'רמי לוי',
        'base_url': 'https://url.publishedprices.co.il',
        'price_file_pattern': '/file/d/{chain_id}/{store_id}/{date}/PriceFull{store_id}.xml',
        'chain_id': '7290058140886',
    },
    'victory': {
        'name': 'ויקטורי',
        'base_url': 'https://matrixcatalog.co.il',
        'price_file_pattern': '/NBCompetitionReg498.aspx',
        'chain_id': '7290696200003',
    },
    'carrefour': {
        'name': 'קרפור',
        'base_url': 'https://prices.carrefour.co.il',
        'price_file_pattern': '/main/PriceFull{store_id}.xml',
        'chain_id': '7290633800006',
    },
    'yohananof': {
        'name': 'יוחננוף',
        'base_url': 'https://publishprice.yohananof.co.il',
        'price_file_pattern': '/prices/PriceFull{store_id}.xml',
        'chain_id': '7290803800003',
    },
}


class PriceScraper:
    """Main scraper class for fetching and parsing price data"""

    def __init__(self, retailer_id: str):
        if retailer_id not in RETAILER_CONFIGS:
            raise ValueError(f"Unknown retailer: {retailer_id}")

        self.retailer_id = retailer_id
        self.config = RETAILER_CONFIGS[retailer_id]
        self.previous_prices: Dict[str, float] = {}

    def fetch_xml(self, url: str) -> Optional[ET.Element]:
        """Fetch and parse XML from a URL"""
        logger.info(f"Fetching: {url}")

        try:
            headers = {
                'User-Agent': 'SaliAI/1.0 Price Comparison Bot',
                'Accept': 'application/xml',
                'Accept-Encoding': 'gzip, deflate',
            }

            request = Request(url, headers=headers)

            with urlopen(request, timeout=30) as response:
                content = response.read()

                # Handle gzip compressed responses
                if response.info().get('Content-Encoding') == 'gzip':
                    content = gzip.decompress(content)

                # Try to decode
                try:
                    xml_string = content.decode('utf-8')
                except UnicodeDecodeError:
                    xml_string = content.decode('windows-1255')  # Hebrew encoding

                return ET.fromstring(xml_string)

        except HTTPError as e:
            logger.error(f"HTTP Error {e.code}: {e.reason}")
        except URLError as e:
            logger.error(f"URL Error: {e.reason}")
        except ET.ParseError as e:
            logger.error(f"XML Parse Error: {e}")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")

        return None

    def build_price_url(self, store_id: str) -> str:
        """Build the URL for fetching prices"""
        pattern = self.config['price_file_pattern']
        url = f"{self.config['base_url']}{pattern}"

        return url.format(
            store_id=store_id,
            chain_id=self.config['chain_id'],
            date=datetime.now().strftime('%Y%m%d'),
            category_id='1',
        )

    def parse_price_items(self, root: ET.Element) -> List[PriceItem]:
        """Parse price items from XML"""
        items = []

        # Try different possible XML structures
        item_paths = [
            './/Item',
            './/Product',
            './/Items/Item',
            './/Products/Product',
        ]

        for path in item_paths:
            elements = root.findall(path)
            if elements:
                break
        else:
            logger.warning("No price items found in XML")
            return items

        for elem in elements:
            try:
                item = PriceItem(
                    item_code=self._get_text(elem, ['ItemCode', 'itemcode', 'Barcode']),
                    item_name=self._get_text(elem, ['ItemName', 'itemname', 'ProductName']),
                    manufacturer_name=self._get_text(elem, ['ManufacturerName', 'manufacturer']),
                    unit_quantity=self._get_text(elem, ['UnitQty', 'unitqty', 'UnitQuantity']),
                    unit_of_measure=self._get_text(elem, ['UnitOfMeasure', 'unitofmeasure']),
                    quantity=self._get_text(elem, ['Quantity', 'quantity'], '1'),
                    item_price=self._get_float(elem, ['ItemPrice', 'price', 'Price']),
                    unit_of_measure_price=self._get_float(elem, ['UnitOfMeasurePrice', 'unitprice']),
                    allow_discount=self._get_text(elem, ['AllowDiscount', 'allowdiscount']) == '1',
                    item_status=self._get_text(elem, ['ItemStatus', 'itemstatus']),
                )
                items.append(item)
            except Exception as e:
                logger.warning(f"Error parsing item: {e}")

        return items

    def fetch_prices(self, store_id: str) -> List[PriceItem]:
        """Fetch and parse prices for a specific store"""
        url = self.build_price_url(store_id)

        # For demo purposes, use mock data
        # In production, use: root = self.fetch_xml(url)
        root = self._get_mock_price_xml()

        if root is None:
            return []

        return self.parse_price_items(root)

    def fetch_promotions(self, store_id: str) -> List[PromoItem]:
        """Fetch and parse promotions for a specific store"""
        url = f"{self.config['base_url']}/promos/Promo{store_id}.xml"

        # For demo purposes, use mock data
        root = self._get_mock_promo_xml()

        if root is None:
            return []

        return self._parse_promo_items(root)

    def _parse_promo_items(self, root: ET.Element) -> List[PromoItem]:
        """Parse promotion items from XML"""
        items = []

        promo_paths = ['.//Promotion', './/Promo', './/Promotions/Promotion']

        for path in promo_paths:
            elements = root.findall(path)
            if elements:
                break
        else:
            return items

        for elem in elements:
            try:
                item_codes = []
                items_elem = elem.find('.//PromotionItems') or elem.find('.//Items')
                if items_elem is not None:
                    for item_elem in items_elem.findall('.//Item'):
                        code = item_elem.findtext('ItemCode') or item_elem.text
                        if code:
                            item_codes.append(code)

                promo = PromoItem(
                    promotion_id=self._get_text(elem, ['PromotionId', 'promoId']),
                    promotion_description=self._get_text(elem, ['PromotionDescription', 'description']),
                    start_date=self._parse_date(self._get_text(elem, ['PromotionStartDate', 'startDate'])),
                    end_date=self._parse_date(self._get_text(elem, ['PromotionEndDate', 'endDate'])),
                    min_qty=int(self._get_text(elem, ['MinQty', 'minQty'], '0')),
                    max_qty=int(self._get_text(elem, ['MaxQty', 'maxQty'], '0')),
                    discount_rate=self._get_float(elem, ['DiscountRate', 'discountRate']),
                    discount_type=self._get_text(elem, ['DiscountType', 'discountType']),
                    item_codes=item_codes,
                )
                items.append(promo)
            except Exception as e:
                logger.warning(f"Error parsing promo: {e}")

        return items

    def detect_anomalies(
        self,
        current_prices: List[PriceItem],
        threshold: float = 0.3
    ) -> List[PriceAnomaly]:
        """Detect significant price changes"""
        anomalies = []

        for item in current_prices:
            prev_price = self.previous_prices.get(item.item_code)
            if prev_price and prev_price > 0:
                change_percent = (item.item_price - prev_price) / prev_price

                if abs(change_percent) >= threshold:
                    anomalies.append(PriceAnomaly(
                        item_code=item.item_code,
                        item_name=item.item_name,
                        store_id='',  # Would be set from context
                        previous_price=prev_price,
                        current_price=item.item_price,
                        change_percent=change_percent,
                        detected_at=datetime.now(),
                    ))

        return anomalies

    def update_price_history(self, prices: List[PriceItem]) -> None:
        """Update the previous prices cache"""
        for item in prices:
            self.previous_prices[item.item_code] = item.item_price

    # Helper methods
    def _get_text(
        self,
        elem: ET.Element,
        tags: List[str],
        default: str = ''
    ) -> str:
        """Get text from element, trying multiple tag names"""
        for tag in tags:
            child = elem.find(tag)
            if child is not None and child.text:
                return child.text.strip()
        return default

    def _get_float(
        self,
        elem: ET.Element,
        tags: List[str],
        default: float = 0.0
    ) -> float:
        """Get float value from element"""
        text = self._get_text(elem, tags)
        try:
            return float(text) if text else default
        except ValueError:
            return default

    def _parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime"""
        formats = ['%Y-%m-%d', '%d/%m/%Y', '%Y%m%d']
        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue
        return datetime.now()

    def _get_mock_price_xml(self) -> ET.Element:
        """Get mock price XML for testing"""
        xml_string = '''<?xml version="1.0" encoding="UTF-8"?>
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
        </Root>'''
        return ET.fromstring(xml_string)

    def _get_mock_promo_xml(self) -> ET.Element:
        """Get mock promo XML for testing"""
        xml_string = '''<?xml version="1.0" encoding="UTF-8"?>
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
        </Root>'''
        return ET.fromstring(xml_string)


def update_all_prices() -> Dict[str, dict]:
    """Update prices for all retailers"""
    results = {}

    for retailer_id, config in RETAILER_CONFIGS.items():
        logger.info(f"\nProcessing {config['name']}...")

        scraper = PriceScraper(retailer_id)

        # Example store ID
        store_id = '001'

        prices = scraper.fetch_prices(store_id)
        promos = scraper.fetch_promotions(store_id)

        results[retailer_id] = {
            'name': config['name'],
            'store_id': store_id,
            'products_count': len(prices),
            'promos_count': len(promos),
        }

        logger.info(f"  Found {len(prices)} products")
        logger.info(f"  Found {len(promos)} promotions")

    return results


def main():
    """CLI entry point"""
    parser = argparse.ArgumentParser(
        description='Sali AI Price Scraper - Israeli Price Transparency XML Parser'
    )
    parser.add_argument(
        '--retailer',
        choices=list(RETAILER_CONFIGS.keys()),
        help='Specific retailer to scrape'
    )
    parser.add_argument(
        '--store',
        default='001',
        help='Store ID to scrape (default: 001)'
    )
    parser.add_argument(
        '--all',
        action='store_true',
        help='Scrape all retailers'
    )
    parser.add_argument(
        '--output',
        help='Output file path (JSON format)'
    )

    args = parser.parse_args()

    if args.all:
        results = update_all_prices()
    elif args.retailer:
        scraper = PriceScraper(args.retailer)
        prices = scraper.fetch_prices(args.store)
        promos = scraper.fetch_promotions(args.store)

        results = {
            args.retailer: {
                'name': RETAILER_CONFIGS[args.retailer]['name'],
                'store_id': args.store,
                'products_count': len(prices),
                'promos_count': len(promos),
                'products': [vars(p) for p in prices[:10]],  # First 10 for demo
            }
        }
    else:
        parser.print_help()
        return

    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2, default=str)
        logger.info(f"Results saved to {args.output}")
    else:
        print(json.dumps(results, ensure_ascii=False, indent=2, default=str))


if __name__ == '__main__':
    main()
