"""
Tax Authority Scraper — Israel Nadlan (Real Estate) Transactions
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Scrapes historical transaction data from the Israel Tax Authority portal:
  https://www.gov.il/he/service/real_estate_information

Supports:
  - search_transactions_by_address(address, ...)  → list of transaction dicts
  - search_transactions_by_gush_helka(gush, helka, ...) → list of transaction dicts

Each transaction dict contains:
  gush_helka, sale_date, declared_value_nis, property_type, built_area_sqm, year_built
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    ElementClickInterceptedException,
)

from .base_scraper import BaseScraper
from .retry import with_retry

logger = logging.getLogger("propcheck.scrapers.tax")

BASE_URL = "https://www.gov.il/he/service/real_estate_information"

# CSS / XPath selectors — centralised for easy maintenance
SEL = {
    # The main tool link/button on the service page
    "tool_link": (
        "//a[contains(@href,'nadlan') or contains(text(),'לכלי')]"
        " | //button[contains(text(),'לכלי')]"
        " | //a[contains(@class,'service-action')]"
    ),
    # Search type radio buttons / tabs
    "tab_address": (
        "//label[contains(text(),'כתובת')]"
        " | //button[contains(text(),'כתובת')]"
        " | //a[contains(text(),'כתובת')]"
    ),
    "tab_gush": (
        "//label[contains(text(),'גוש')]"
        " | //button[contains(text(),'גוש')]"
        " | //a[contains(text(),'גוש')]"
    ),
    # Input fields — address mode
    "city_input": "//input[contains(@placeholder,'עיר') or @aria-label='עיר' or @name='city']",
    "street_input": "//input[contains(@placeholder,'רחוב') or @aria-label='רחוב' or @name='street']",
    "house_input": "//input[contains(@placeholder,'בית') or @aria-label='מספר בית' or @name='houseNumber']",
    # Input fields — gush/helka mode
    "gush_input": "//input[contains(@placeholder,'גוש') or @aria-label='גוש' or @name='gush']",
    "helka_input": "//input[contains(@placeholder,'חלקה') or @aria-label='חלקה' or @name='helka']",
    # Date range
    "date_from": "//input[@name='fromDate' or @aria-label='מתאריך' or contains(@placeholder,'מתאריך')]",
    "date_to": "//input[@name='toDate' or @aria-label='עד תאריך' or contains(@placeholder,'עד')]",
    # Execute search
    "search_btn": (
        "//button[contains(text(),'הצגת נתונים')]"
        " | //button[contains(text(),'חפש')]"
        " | //button[contains(text(),'חיפוש')]"
        " | //button[@type='submit']"
    ),
    # Results
    "results_table": "//table[contains(@class,'result') or contains(@class,'deals')]//tbody",
    "results_row": ".//tr",
    "no_results": "//*[contains(text(),'לא נמצאו') or contains(text(),'אין נתונים')]",
    # Pagination
    "next_page_btn": (
        "//button[contains(text(),'הבא')]"
        " | //a[contains(text(),'הבא')]"
        " | //li[contains(@class,'next')]/a"
        " | //button[@aria-label='הבא']"
    ),
    "next_page_disabled": (
        "//button[contains(text(),'הבא') and @disabled]"
        " | //li[contains(@class,'next') and contains(@class,'disabled')]"
    ),
}


def _default_date_range() -> tuple[str, str]:
    """Return (from_date, to_date) strings for the last 12 months in DD/MM/YYYY."""
    today = datetime.now()
    one_year_ago = today - timedelta(days=365)
    return one_year_ago.strftime("%d/%m/%Y"), today.strftime("%d/%m/%Y")


class TaxAuthorityScraper(BaseScraper):
    """Scraper for Israel Tax Authority real estate transaction data."""

    def __init__(self, headless: bool = True, timeout: int = 25, output_dir: str = "output"):
        super().__init__(headless=headless, timeout=timeout, output_dir=output_dir)

    # ─── Navigate to the actual search tool ───────────────────────

    def _navigate_to_tool(self) -> None:
        """
        Open the service page and click through to the actual Nadlan search tool.
        Some gov.il service pages have an intermediate page before the real tool.
        """
        assert self.driver and self.wait

        self.driver.get(BASE_URL)
        time.sleep(3)  # gov.il is slow to hydrate

        # Try to find and click the link that opens the actual search tool
        try:
            tool_link = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, SEL["tool_link"]))
            )
            href = tool_link.get_attribute("href")

            # If it's a link to an external tool, navigate directly
            if href and href.startswith("http"):
                self.driver.get(href)
            else:
                tool_link.click()

            time.sleep(3)
        except TimeoutException:
            # Already on the tool page, or tool is embedded — continue
            logger.info("No intermediate tool link found; assuming tool is embedded.")

        # If a new window/tab was opened, switch to it
        if len(self.driver.window_handles) > 1:
            self.driver.switch_to.window(self.driver.window_handles[-1])
            time.sleep(2)

    # ─── Task 2.1a: Search by Address ─────────────────────────────

    @with_retry(max_retries=5, base_wait_seconds=60)
    def search_transactions_by_address(
        self,
        address: str,
        city: str | None = None,
        street: str | None = None,
        house_number: str | None = None,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search for real estate transactions by address.

        You can pass either a combined `address` string (which will be
        parsed into city/street/house) or individual fields.

        Args:
            address: Full address (e.g. "הרצל 10, תל אביב"). Used if
                     city/street/house_number are not provided.
            city: City name.
            street: Street name.
            house_number: House number.
            date_from: Start date DD/MM/YYYY (default: 12 months ago).
            date_to: End date DD/MM/YYYY (default: today).

        Returns:
            List of transaction dictionaries.
        """
        self.start_browser()
        assert self.driver and self.wait

        # Parse the combined address if individual parts weren't given
        if not city or not street:
            city, street, house_number = self._parse_address(address)

        logger.info("Tax Authority search: city=%s, street=%s, house=%s", city, street, house_number)

        self._navigate_to_tool()

        # Select "Search by Address" tab
        try:
            tab = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, SEL["tab_address"]))
            )
            tab.click()
            time.sleep(1)
        except TimeoutException:
            logger.info("Address tab not found — may already be selected.")

        # Fill city
        self._fill_field(SEL["city_input"], city)

        # Fill street
        self._fill_field(SEL["street_input"], street)

        # Fill house number (optional)
        if house_number:
            self._fill_field(SEL["house_input"], house_number)

        # Fill date range
        self._fill_date_range(date_from, date_to)

        # Click search
        self._click_search()

        # Parse all pages
        return self._parse_all_pages()

    # ─── Task 2.1b: Search by Gush/Helka ─────────────────────────

    @with_retry(max_retries=5, base_wait_seconds=60)
    def search_transactions_by_gush_helka(
        self,
        gush: str,
        helka: str,
        date_from: str | None = None,
        date_to: str | None = None,
    ) -> list[dict[str, Any]]:
        """
        Search for real estate transactions by Gush (block) and Helka (parcel).

        Args:
            gush: Block number.
            helka: Parcel number.
            date_from: Start date DD/MM/YYYY (default: 12 months ago).
            date_to: End date DD/MM/YYYY (default: today).

        Returns:
            List of transaction dictionaries.
        """
        self.start_browser()
        assert self.driver and self.wait

        logger.info("Tax Authority search: gush=%s, helka=%s", gush, helka)

        self._navigate_to_tool()

        # Select "Search by Gush/Helka" tab
        try:
            tab = self.wait.until(
                EC.element_to_be_clickable((By.XPATH, SEL["tab_gush"]))
            )
            tab.click()
            time.sleep(1)
        except TimeoutException:
            logger.info("Gush tab not found — may already be selected.")

        # Fill gush
        self._fill_field(SEL["gush_input"], gush)

        # Fill helka
        self._fill_field(SEL["helka_input"], helka)

        # Fill date range
        self._fill_date_range(date_from, date_to)

        # Click search
        self._click_search()

        # Parse all pages
        return self._parse_all_pages()

    # ─── Shared helpers ───────────────────────────────────────────

    @staticmethod
    def _parse_address(address: str) -> tuple[str, str, str]:
        """
        Best-effort parse of a Hebrew address string into (city, street, house_number).

        Handles common formats:
          "הרצל 10, תל אביב"  → ("תל אביב", "הרצל", "10")
          "תל אביב, הרצל 10"  → ("תל אביב", "הרצל", "10")
        """
        parts = [p.strip() for p in address.split(",")]

        if len(parts) >= 2:
            # Try to figure out which part is the city vs street+number
            # Heuristic: the part with a number is likely street+house
            import re

            street_part = None
            city_part = None

            for part in parts:
                if re.search(r"\d", part):
                    street_part = part
                else:
                    city_part = part

            if not street_part:
                street_part = parts[0]
            if not city_part:
                city_part = parts[-1]

            # Extract house number from street part
            match = re.search(r"(\d+)", street_part)
            house_number = match.group(1) if match else ""
            street_name = re.sub(r"\d+", "", street_part).strip()

            return city_part, street_name, house_number

        # Single part — treat the whole thing as a search query
        return address, "", ""

    def _fill_field(self, xpath: str, value: str) -> None:
        """Find an input by XPath, clear it, and type the value."""
        assert self.driver and self.wait

        if not value:
            return

        try:
            field = self.wait.until(
                EC.presence_of_element_located((By.XPATH, xpath))
            )
            field.clear()
            field.send_keys(value)
            time.sleep(0.5)

            # Some autocomplete dropdowns need an extra pause + Enter
            # to select the first suggestion
            try:
                time.sleep(1)
                suggestions = self.driver.find_elements(
                    By.XPATH,
                    "//ul[contains(@class,'autocomplete') or contains(@class,'suggestions')]//li"
                )
                if suggestions:
                    suggestions[0].click()
                    time.sleep(0.5)
            except (NoSuchElementException, ElementClickInterceptedException):
                pass

        except TimeoutException:
            logger.warning("Could not find field: %s", xpath)

    def _fill_date_range(self, date_from: str | None, date_to: str | None) -> None:
        """Fill the date range inputs, defaulting to last 12 months."""
        assert self.driver

        default_from, default_to = _default_date_range()
        from_val = date_from or default_from
        to_val = date_to or default_to

        try:
            from_field = self.driver.find_element(By.XPATH, SEL["date_from"])
            from_field.clear()
            from_field.send_keys(from_val)
        except NoSuchElementException:
            logger.info("Date-from field not found; skipping date filter.")

        try:
            to_field = self.driver.find_element(By.XPATH, SEL["date_to"])
            to_field.clear()
            to_field.send_keys(to_val)
        except NoSuchElementException:
            logger.info("Date-to field not found; skipping date filter.")

    def _click_search(self) -> None:
        """Click the main search/submit button."""
        assert self.wait

        btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, SEL["search_btn"]))
        )
        btn.click()
        time.sleep(3)  # results can take a few seconds

    def _parse_results_page(self) -> list[dict[str, Any]]:
        """
        Parse one page of results from the transaction table.

        Returns:
            List of transaction dicts for the current page.
        """
        assert self.driver and self.wait

        # Wait for either results or "no results" message
        try:
            self.wait.until(
                lambda d: (
                    d.find_elements(By.XPATH, SEL["results_table"])
                    or d.find_elements(By.XPATH, SEL["no_results"])
                )
            )
        except TimeoutException:
            logger.warning("Timed out waiting for Tax Authority results")
            raise

        # Check for "no results"
        if self.driver.find_elements(By.XPATH, SEL["no_results"]):
            logger.info("No transaction results found")
            return []

        tbody = self.driver.find_element(By.XPATH, SEL["results_table"])
        rows = tbody.find_elements(By.XPATH, SEL["results_row"])

        transactions: list[dict[str, Any]] = []

        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) < 6:
                continue

            txn = {
                "gush_helka": cells[0].text.strip(),
                "sale_date": cells[1].text.strip(),
                "declared_value_nis": cells[2].text.strip(),
                "property_type": cells[3].text.strip(),
                "built_area_sqm": cells[4].text.strip(),
                "year_built": cells[5].text.strip(),
            }
            transactions.append(txn)

        return transactions

    def _has_next_page(self) -> bool:
        """Check if there is an active (non-disabled) 'Next' button."""
        assert self.driver

        # If the disabled variant exists, there's no next page
        disabled = self.driver.find_elements(By.XPATH, SEL["next_page_disabled"])
        if disabled:
            return False

        # Check if the next button exists at all
        buttons = self.driver.find_elements(By.XPATH, SEL["next_page_btn"])
        return len(buttons) > 0

    def _click_next_page(self) -> bool:
        """
        Click the 'Next' pagination button.

        Returns:
            True if next page was clicked, False if no more pages.
        """
        assert self.driver

        if not self._has_next_page():
            return False

        try:
            btn = self.driver.find_element(By.XPATH, SEL["next_page_btn"])
            btn.click()
            time.sleep(2)  # wait for new page to render
            return True
        except (NoSuchElementException, ElementClickInterceptedException):
            return False

    def _parse_all_pages(self) -> list[dict[str, Any]]:
        """
        Parse the results table across all paginated pages.

        Continues clicking "Next" until the button is disabled or absent.

        Returns:
            Aggregated list of transaction dicts from all pages.
        """
        all_transactions: list[dict[str, Any]] = []
        page_num = 1

        while True:
            logger.info("Parsing results page %d", page_num)
            page_results = self._parse_results_page()
            all_transactions.extend(page_results)

            if not page_results:
                # Empty page — stop
                break

            if not self._click_next_page():
                # No more pages
                break

            page_num += 1

            # Safety limit to prevent infinite loops
            if page_num > 100:
                logger.warning("Reached page limit (100); stopping pagination.")
                break

        logger.info(
            "Parsed %d total transactions across %d pages",
            len(all_transactions),
            page_num,
        )
        return all_transactions

    # ─── Convenience: search + save ───────────────────────────────

    def search_and_save_by_address(
        self,
        address: str,
        filename: str = "tax_address_results.json",
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Search by address, save to JSON, and return results."""
        results = self.search_transactions_by_address(address, **kwargs)
        if results:
            self.save_to_json(results, filename)
        return results

    def search_and_save_by_gush_helka(
        self,
        gush: str,
        helka: str,
        filename: str = "tax_gush_results.json",
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Search by gush/helka, save to JSON, and return results."""
        results = self.search_transactions_by_gush_helka(gush, helka, **kwargs)
        if results:
            self.save_to_json(results, filename)
        return results
