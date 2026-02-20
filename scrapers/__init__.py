"""
PropCheck Web Scrapers
~~~~~~~~~~~~~~~~~~~~~

A set of Python scrapers for gathering official Israeli real estate data.

Scrapers:
  - MavatScraper: Planning information (Taba) from mavat.iplan.gov.il
  - TaxAuthorityScraper: Historical transaction data from gov.il

Usage:
    from scrapers import MavatScraper, TaxAuthorityScraper

    mavat = MavatScraper()
    plans = mavat.search_by_address("הרצל 10, תל אביב")

    tax = TaxAuthorityScraper()
    transactions = tax.search_transactions_by_address("הרצל 10, תל אביב")
"""

from .mavat_scraper import MavatScraper
from .tax_authority_scraper import TaxAuthorityScraper

__all__ = ["MavatScraper", "TaxAuthorityScraper"]
