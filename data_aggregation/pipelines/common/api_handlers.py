"""
API handlers and utilities for data aggregation pipelines.

Provides reusable functions for making HTTP requests with retries,
error handling, and rate limiting.
"""

import time
import logging
import requests
from typing import Dict, Any, Optional, Callable
from functools import wraps


logger = logging.getLogger(__name__)


# ============================================================================
# Request Handling
# ============================================================================

class APIHandler:
    """Base class for API interactions with retry logic."""

    def __init__(self, timeout: int = 15, max_retries: int = 3, backoff_factor: float = 2.0):
        """
        Initialize API handler.

        Args:
            timeout: Request timeout in seconds
            max_retries: Maximum number of retry attempts
            backoff_factor: Exponential backoff multiplier
        """
        self.timeout = timeout
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self.session = requests.Session()

    def get(self, url: str, params: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        """
        Make GET request with automatic retry.

        Args:
            url: Request URL
            params: Query parameters
            **kwargs: Additional arguments to pass to requests.get()

        Returns:
            JSON response as dictionary

        Raises:
            requests.RequestException: If all retries fail
        """
        return self._request('GET', url, params=params, **kwargs)

    def post(self, url: str, data: Optional[Any] = None, json: Optional[Dict] = None, **kwargs) -> Dict[str, Any]:
        """
        Make POST request with automatic retry.

        Args:
            url: Request URL
            data: Form data
            json: JSON body
            **kwargs: Additional arguments to pass to requests.post()

        Returns:
            JSON response as dictionary
        """
        return self._request('POST', url, data=data, json=json, **kwargs)

    def _request(self, method: str, url: str, **kwargs) -> Dict[str, Any]:
        """
        Make HTTP request with retry logic and error handling.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Request URL
            **kwargs: Arguments to pass to requests

        Returns:
            JSON response as dictionary

        Raises:
            requests.RequestException: If all retries fail
        """
        kwargs['timeout'] = kwargs.get('timeout', self.timeout)
        last_error = None
        delay = 1.0

        for attempt in range(self.max_retries):
            try:
                response = self.session.request(method, url, **kwargs)

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"Rate limited. Waiting {retry_after}s before retry...")
                    time.sleep(retry_after)
                    continue

                # Raise for HTTP errors
                response.raise_for_status()

                # Try to parse JSON
                try:
                    return response.json()
                except ValueError:
                    logger.warning(f"Response is not JSON: {response.text[:100]}")
                    return {"status": "ok", "data": response.text}

            except requests.exceptions.Timeout:
                last_error = f"Timeout after {self.timeout}s"
                if attempt < self.max_retries - 1:
                    logger.warning(f"Timeout on attempt {attempt + 1}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= self.backoff_factor

            except requests.exceptions.ConnectionError as e:
                last_error = f"Connection error: {e}"
                if attempt < self.max_retries - 1:
                    logger.warning(f"Connection error on attempt {attempt + 1}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= self.backoff_factor

            except requests.exceptions.HTTPError as e:
                # Don't retry on client errors
                if e.response.status_code >= 400 and e.response.status_code < 500:
                    logger.error(f"Client error {e.response.status_code}: {e}")
                    raise
                # Retry on server errors
                last_error = f"HTTP {e.response.status_code}"
                if attempt < self.max_retries - 1:
                    logger.warning(f"Server error on attempt {attempt + 1}. Retrying in {delay}s...")
                    time.sleep(delay)
                    delay *= self.backoff_factor

            except Exception as e:
                last_error = str(e)
                logger.error(f"Unexpected error: {e}")
                raise

        # All retries exhausted
        logger.error(f"All {self.max_retries} attempts failed. Last error: {last_error}")
        raise requests.RequestException(f"Failed after {self.max_retries} attempts: {last_error}")

    def close(self) -> None:
        """Close the session."""
        self.session.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()


# ============================================================================
# Request Decorators
# ============================================================================

def rate_limit(calls_per_second: float):
    """
    Decorator to rate limit function calls.

    Args:
        calls_per_second: Maximum calls per second
    """
    min_interval = 1.0 / calls_per_second

    def decorator(func: Callable) -> Callable:
        last_call = [0.0]

        @wraps(func)
        def wrapper(*args, **kwargs):
            elapsed = time.time() - last_call[0]
            if elapsed < min_interval:
                time.sleep(min_interval - elapsed)
            result = func(*args, **kwargs)
            last_call[0] = time.time()
            return result

        return wrapper

    return decorator


def log_requests(func: Callable) -> Callable:
    """
    Decorator to log API requests and responses.

    Args:
        func: Function to decorate
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        logger.debug(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        try:
            result = func(*args, **kwargs)
            logger.debug(f"{func.__name__} returned successfully")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} raised {type(e).__name__}: {e}")
            raise

    return wrapper


# ============================================================================
# Specialized API Handlers
# ============================================================================

class ESPNAPIHandler(APIHandler):
    """Handler for ESPN API requests."""

    BASE_URL = "http://site.api.espn.com/apis/site/v2"

    def get_scoreboard(self, sport: str, league: str, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get scoreboard for a league.

        Args:
            sport: Sport type (e.g., 'football', 'basketball')
            league: League code (e.g., 'nfl', 'nba')
            date: Optional date in YYYYMMDD format

        Returns:
            Scoreboard data
        """
        url = f"{self.BASE_URL}/sports/{sport}/{league}/scoreboard"
        params = {}
        if date:
            params['dates'] = date

        return self.get(url, params=params)


class OverpassAPIHandler(APIHandler):
    """Handler for Overpass API requests (OpenStreetMap)."""

    BASE_URL = "https://overpass-api.de/api/interpreter"
    DEFAULT_TIMEOUT = 900  # 15 minutes

    def query(self, query_string: str) -> Dict[str, Any]:
        """
        Execute Overpass QL query.

        Args:
            query_string: Overpass QL query

        Returns:
            Query results
        """
        return self.post(
            self.BASE_URL,
            data={'data': query_string},
            timeout=self.DEFAULT_TIMEOUT
        )


class FinnhubAPIHandler(APIHandler):
    """Handler for Finnhub API requests."""

    BASE_URL = "https://finnhub.io/api/v1"

    def __init__(self, api_key: str, **kwargs):
        """
        Initialize Finnhub handler.

        Args:
            api_key: Finnhub API key
            **kwargs: Additional arguments for APIHandler
        """
        super().__init__(**kwargs)
        self.api_key = api_key

    def get_quote(self, symbol: str) -> Dict[str, Any]:
        """
        Get quote for a stock symbol.

        Args:
            symbol: Stock ticker symbol

        Returns:
            Quote data
        """
        url = f"{self.BASE_URL}/quote"
        params = {'symbol': symbol, 'token': self.api_key}
        return self.get(url, params=params)


class YouTubeAPIHandler(APIHandler):
    """Handler for YouTube Data API requests."""

    BASE_URL = "https://www.googleapis.com/youtube/v3"

    def __init__(self, api_key: str, **kwargs):
        """
        Initialize YouTube handler.

        Args:
            api_key: YouTube API key
            **kwargs: Additional arguments for APIHandler
        """
        super().__init__(**kwargs)
        self.api_key = api_key

    def search(self, query: str, max_results: int = 1, channel_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Search for videos.

        Args:
            query: Search query
            max_results: Maximum results to return
            channel_id: Optional channel ID to search within

        Returns:
            Search results
        """
        url = f"{self.BASE_URL}/search"
        params = {
            'part': 'snippet',
            'q': query,
            'key': self.api_key,
            'maxResults': max_results,
            'type': 'video',
            'videoEmbeddable': 'true',
            'order': 'relevance'
        }
        if channel_id:
            params['channelId'] = channel_id

        return self.get(url, params=params)


# ============================================================================
# Batch Operations
# ============================================================================

def batch_api_calls(
    urls: list,
    handler: APIHandler,
    max_concurrent: int = 5,
    delay_between_batches: float = 1.0
) -> Dict[str, Any]:
    """
    Make multiple API calls in batches with rate limiting.

    Args:
        urls: List of URLs to fetch
        handler: APIHandler instance
        max_concurrent: Maximum concurrent requests in a batch
        delay_between_batches: Delay between batches in seconds

    Returns:
        Dictionary mapping URLs to responses
    """
    results = {}

    for i in range(0, len(urls), max_concurrent):
        batch = urls[i:i + max_concurrent]
        logger.info(f"Processing batch {i // max_concurrent + 1} ({len(batch)} items)")

        for url in batch:
            try:
                results[url] = handler.get(url)
            except Exception as e:
                logger.error(f"Failed to fetch {url}: {e}")
                results[url] = {"error": str(e)}

        # Delay between batches (except last)
        if i + max_concurrent < len(urls):
            time.sleep(delay_between_batches)

    return results
