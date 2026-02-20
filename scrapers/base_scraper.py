"""
Base Scraper
~~~~~~~~~~~~

Shared browser setup, teardown, and utility methods used by all scrapers.
"""

import json
import logging
import os
from pathlib import Path
from typing import Any

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait

logger = logging.getLogger("propcheck.scrapers")

# Realistic User-Agent to avoid bot detection
USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0.0.0 Safari/537.36"
)

DEFAULT_TIMEOUT = 20  # seconds to wait for elements
DEFAULT_OUTPUT_DIR = Path("output")


class BaseScraper:
    """Base class providing Selenium browser lifecycle and helper methods."""

    def __init__(
        self,
        headless: bool = True,
        timeout: int = DEFAULT_TIMEOUT,
        output_dir: str | Path = DEFAULT_OUTPUT_DIR,
    ):
        self.headless = headless
        self.timeout = timeout
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        self.driver: webdriver.Chrome | None = None
        self.wait: WebDriverWait | None = None

    def _build_chrome_options(self) -> Options:
        """Configure Chrome options for scraping."""
        opts = Options()

        if self.headless:
            opts.add_argument("--headless=new")

        opts.add_argument(f"--user-agent={USER_AGENT}")
        opts.add_argument("--disable-blink-features=AutomationControlled")
        opts.add_argument("--no-sandbox")
        opts.add_argument("--disable-dev-shm-usage")
        opts.add_argument("--disable-gpu")
        opts.add_argument("--window-size=1920,1080")
        opts.add_argument("--lang=he-IL")

        # Suppress automation indicators
        opts.add_experimental_option("excludeSwitches", ["enable-automation"])
        opts.add_experimental_option("useAutomationExtension", False)

        return opts

    def start_browser(self) -> None:
        """Launch Chrome and set up the WebDriverWait."""
        if self.driver is not None:
            return

        opts = self._build_chrome_options()

        # Try chromedriver from PATH; if unavailable, let webdriver-manager handle it
        try:
            self.driver = webdriver.Chrome(options=opts)
        except Exception:
            try:
                from webdriver_manager.chrome import ChromeDriverManager

                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=opts)
            except ImportError:
                raise RuntimeError(
                    "chromedriver not found in PATH and webdriver-manager "
                    "is not installed. Install it with: "
                    "pip install webdriver-manager"
                )

        # Remove navigator.webdriver flag
        self.driver.execute_cdp_cmd(
            "Page.addScriptToEvaluateOnNewDocument",
            {"source": "Object.defineProperty(navigator, 'webdriver', {get: () => undefined})"},
        )

        self.wait = WebDriverWait(self.driver, self.timeout)
        logger.info("Browser started (headless=%s)", self.headless)

    def stop_browser(self) -> None:
        """Quit the browser and clean up."""
        if self.driver:
            self.driver.quit()
            self.driver = None
            self.wait = None
            logger.info("Browser stopped")

    def save_to_json(self, data: list[dict[str, Any]], filename: str) -> Path:
        """Save a list of dictionaries to a JSON file.

        Args:
            data: The scraped data.
            filename: Output filename (without directory prefix).

        Returns:
            Path to the written file.
        """
        filepath = self.output_dir / filename
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info("Saved %d records to %s", len(data), filepath)
        return filepath

    def __enter__(self):
        self.start_browser()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_browser()
        return False
