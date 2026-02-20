"""
Automatic Retry Mechanism with Exponential Backoff
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Provides a decorator that wraps scraping methods to handle transient failures
(timeouts, rate-limiting, network errors) without crashing.

Logic:
  1. Execute the wrapped function.
  2. On success, return the result immediately.
  3. On a retryable exception (TimeoutException, WebDriverException, ConnectionError):
     a. Log a warning with attempt number and wait time.
     b. Wait for base_wait * (2 ** attempt) seconds (60s, 120s, 240s, 480s, 960s).
     c. Retry the function.
  4. After max_retries exhausted, raise the last exception.
"""

import functools
import logging
import time
from typing import Callable, TypeVar, Any

from selenium.common.exceptions import (
    TimeoutException,
    WebDriverException,
    NoSuchElementException,
    StaleElementReferenceException,
)

logger = logging.getLogger("propcheck.scrapers")

F = TypeVar("F", bound=Callable[..., Any])

# Exceptions that indicate transient / rate-limit issues worth retrying
RETRYABLE_EXCEPTIONS = (
    TimeoutException,
    WebDriverException,
    ConnectionError,
    ConnectionResetError,
    OSError,
    StaleElementReferenceException,
)

# Exceptions that indicate a logic error — no point retrying
NON_RETRYABLE_EXCEPTIONS = (
    NoSuchElementException,
    ValueError,
    TypeError,
)


def with_retry(
    max_retries: int = 5,
    base_wait_seconds: int = 60,
    retryable: tuple = RETRYABLE_EXCEPTIONS,
) -> Callable[[F], F]:
    """
    Decorator factory for automatic retry with exponential backoff.

    Args:
        max_retries: Maximum number of retry attempts (default 5).
        base_wait_seconds: Initial wait time in seconds (default 60).
        retryable: Tuple of exception classes considered retryable.

    Returns:
        Decorated function with retry logic.

    Example:
        @with_retry(max_retries=3, base_wait_seconds=30)
        def fetch_data(self, query):
            ...
    """

    def decorator(func: F) -> F:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception = None

            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                except NON_RETRYABLE_EXCEPTIONS:
                    # Logic errors — no point retrying
                    raise
                except retryable as exc:
                    last_exception = exc

                    if attempt == max_retries:
                        logger.error(
                            "All %d retries exhausted for %s. Last error: %s",
                            max_retries,
                            func.__name__,
                            exc,
                        )
                        raise

                    wait_time = base_wait_seconds * (2 ** attempt)
                    logger.warning(
                        "Request failed for %s, attempt %d of %d. "
                        "Error: %s. Retrying in %d seconds...",
                        func.__name__,
                        attempt + 1,
                        max_retries,
                        exc,
                        wait_time,
                    )
                    time.sleep(wait_time)

            # Should never reach here, but just in case
            if last_exception:
                raise last_exception

        return wrapper  # type: ignore[return-value]

    return decorator
