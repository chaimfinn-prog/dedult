"""
Mavat Scraper — Israel Planning Administration (תב"ע)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Scrapes planning information from https://mavat.iplan.gov.il/SV3

Supports:
  - search_by_address(address)     → list of plan dicts
  - search_by_gush_helka(gush, helka) → list of plan dicts

Each plan dict contains:
  plan_number, plan_name, authority, location, status, approval_date
"""

import logging
import time
from typing import Any

from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import (
    TimeoutException,
    NoSuchElementException,
    StaleElementReferenceException,
)

from .base_scraper import BaseScraper
from .retry import with_retry

logger = logging.getLogger("propcheck.scrapers.mavat")

BASE_URL = "https://mavat.iplan.gov.il/SV3"

# CSS / XPath selectors — centralised for easy maintenance
SEL = {
    "search_input": "sv3-search__input",                       # id
    "search_button": "//button[contains(text(), 'חיפוש')]",    # xpath
    "advanced_btn": "//button[contains(text(), 'חיפוש מתקדם')]",
    "gush_input": "//input[@placeholder='גוש' or @aria-label='גוש']",
    "helka_input": "//input[@placeholder='חלקה' or @aria-label='חלקה']",
    "results_tbody": "//table[contains(@class,'result')]//tbody",
    "results_row": ".//tr",
    "no_results": "//*[contains(text(),'לא נמצאו תוצאות')]",
}


class MavatScraper(BaseScraper):
    """Scraper for the Mavat (Israel Planning Administration) portal."""

    def __init__(self, headless: bool = True, timeout: int = 20, output_dir: str = "output"):
        super().__init__(headless=headless, timeout=timeout, output_dir=output_dir)

    # ─── Task 1.1: Search by Address ─────────────────────────────

    @with_retry(max_retries=5, base_wait_seconds=60)
    def search_by_address(self, address: str) -> list[dict[str, Any]]:
        """
        Search Mavat by free-text address (e.g. "הרצל 10, תל אביב").

        Args:
            address: Hebrew address string.

        Returns:
            List of plan dictionaries.
        """
        self.start_browser()
        assert self.driver and self.wait

        logger.info("Mavat search by address: %s", address)
        self.driver.get(BASE_URL)
        time.sleep(2)  # let SPA hydrate

        # Locate the main search input
        search_input = self.wait.until(
            EC.presence_of_element_located((By.ID, SEL["search_input"]))
        )
        search_input.clear()
        search_input.send_keys(address)
        time.sleep(0.5)

        # Click the search button
        search_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, SEL["search_button"]))
        )
        search_btn.click()

        return self._parse_results_table()

    # ─── Task 1.2: Search by Gush/Helka ──────────────────────────

    @with_retry(max_retries=5, base_wait_seconds=60)
    def search_by_gush_helka(self, gush: str, helka: str) -> list[dict[str, Any]]:
        """
        Search Mavat by Gush (block) and Helka (parcel) numbers.

        Args:
            gush: Block number (גוש).
            helka: Parcel number (חלקה).

        Returns:
            List of plan dictionaries.
        """
        self.start_browser()
        assert self.driver and self.wait

        logger.info("Mavat search by gush=%s, helka=%s", gush, helka)
        self.driver.get(BASE_URL)
        time.sleep(2)

        # Open advanced search panel
        advanced_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, SEL["advanced_btn"]))
        )
        advanced_btn.click()
        time.sleep(1)

        # Fill Gush field
        gush_input = self.wait.until(
            EC.presence_of_element_located((By.XPATH, SEL["gush_input"]))
        )
        gush_input.clear()
        gush_input.send_keys(gush)

        # Fill Helka field
        helka_input = self.wait.until(
            EC.presence_of_element_located((By.XPATH, SEL["helka_input"]))
        )
        helka_input.clear()
        helka_input.send_keys(helka)

        time.sleep(0.5)

        # Click search
        search_btn = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, SEL["search_button"]))
        )
        search_btn.click()

        return self._parse_results_table()

    # ─── Shared results parser ────────────────────────────────────

    def _parse_results_table(self) -> list[dict[str, Any]]:
        """
        Wait for the results table and extract plan rows.

        Returns:
            List of plan dicts with keys:
            plan_number, plan_name, authority, location, status, approval_date

        Raises:
            TimeoutException: if results table never appears.
        """
        assert self.driver and self.wait

        # Wait for either a results table or a "no results" message
        try:
            self.wait.until(
                lambda d: (
                    d.find_elements(By.XPATH, SEL["results_tbody"])
                    or d.find_elements(By.XPATH, SEL["no_results"])
                )
            )
        except TimeoutException:
            logger.warning("Timed out waiting for Mavat results table")
            raise

        # Check for "no results" message
        no_results = self.driver.find_elements(By.XPATH, SEL["no_results"])
        if no_results:
            logger.info("No results found")
            return []

        # Parse each row in the results tbody
        tbody = self.driver.find_element(By.XPATH, SEL["results_tbody"])
        rows = tbody.find_elements(By.XPATH, SEL["results_row"])

        plans: list[dict[str, Any]] = []

        for row in rows:
            cells = row.find_elements(By.TAG_NAME, "td")
            if len(cells) < 6:
                continue

            plan = {
                "plan_number": cells[0].text.strip(),
                "plan_name": cells[1].text.strip(),
                "authority": cells[2].text.strip(),
                "location": cells[3].text.strip(),
                "status": cells[4].text.strip(),
                "approval_date": cells[5].text.strip(),
            }
            plans.append(plan)

        logger.info("Parsed %d plans from Mavat", len(plans))
        return plans

    # ─── Convenience: search + save ───────────────────────────────

    def search_and_save_by_address(
        self, address: str, filename: str = "mavat_address_results.json"
    ) -> list[dict[str, Any]]:
        """Search by address, save to JSON, and return results."""
        results = self.search_by_address(address)
        if results:
            self.save_to_json(results, filename)
        return results

    def search_and_save_by_gush_helka(
        self, gush: str, helka: str, filename: str = "mavat_gush_results.json"
    ) -> list[dict[str, Any]]:
        """Search by gush/helka, save to JSON, and return results."""
        results = self.search_by_gush_helka(gush, helka)
        if results:
            self.save_to_json(results, filename)
        return results
