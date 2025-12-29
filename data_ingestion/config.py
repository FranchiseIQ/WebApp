"""
FranchiseIQ Data Ingestion Configuration

Centralized settings for data paths, API endpoints, and validation rules.
Environment variables override defaults.
"""

import os
import json
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data"
LOGS_DIR = Path(__file__).parent / "logs"

# Ensure directories exist
DATA_DIR.mkdir(exist_ok=True)
LOGS_DIR.mkdir(exist_ok=True)

# ============================================================================
# DATA SOURCE CONFIGURATION
# ============================================================================

# Franchise Locations API/Data Sources
FRANCHISE_LOCATIONS_API = os.getenv(
    "FRANCHISE_LOCATIONS_API",
    "https://api.franchiseiq.com/locations"
)

# Stock data sources
STOCK_DATA_API = os.getenv(
    "STOCK_DATA_API",
    "https://api.example.com/stocks"
)

# Sports data sources
SPORTS_DATA_API = os.getenv(
    "SPORTS_DATA_API",
    "https://api.example.com/sports"
)

# ============================================================================
# OUTPUT DIRECTORIES
# ============================================================================

# Brand location data output
LOCATIONS_OUTPUT_DIR = DATA_DIR / "brands"
LOCATIONS_OUTPUT_DIR.mkdir(exist_ok=True)

# Stock data output
STOCKS_OUTPUT_DIR = DATA_DIR / "stocks"
STOCKS_OUTPUT_DIR.mkdir(exist_ok=True)

# Sports data output
SPORTS_OUTPUT_DIR = DATA_DIR / "sports"
SPORTS_OUTPUT_DIR.mkdir(exist_ok=True)

# ============================================================================
# VALIDATION RULES - Geographic Coordinates
# ============================================================================

# Latitude and longitude bounds (WGS84)
MIN_LATITUDE = -90.0
MAX_LATITUDE = 90.0
MIN_LONGITUDE = -180.0
MAX_LONGITUDE = 180.0

# Valid country codes (ISO 3166-1 alpha-2)
VALID_COUNTRIES = {"US", "CA", "MX"}

# Valid US state codes (2-letter abbreviations)
VALID_US_STATES = {
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
}

# Valid Canadian province codes
VALID_CANADIAN_PROVINCES = {
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE",
    "QC", "SK", "YT"
}

# ============================================================================
# VALIDATION RULES - Stock Data
# ============================================================================

# Price bounds (reasonable for stock market)
MIN_STOCK_PRICE = 0.01
MAX_STOCK_PRICE = 100000.00

# Minimum historical data (days)
MIN_HISTORICAL_RECORDS = 252  # 1 trading year

# Date range for historical data
START_DATE = "2015-01-01"
END_DATE = None  # None means current date

# ============================================================================
# VALIDATION RULES - Sports Data
# ============================================================================

VALID_SPORTS = {"baseball", "basketball", "football", "hockey", "soccer"}
VALID_LEAGUES = {
    "MLB": "baseball",
    "NBA": "basketball",
    "NFL": "football",
    "NHL": "hockey",
    "MLS": "soccer",
    "EPL": "soccer"
}

# ============================================================================
# BATCH PROCESSING
# ============================================================================

# Chunk size for processing large datasets
BATCH_SIZE = 100

# Chunk size for API pagination
API_PAGE_SIZE = 50

# Maximum retries for API calls
MAX_RETRIES = 3

# Retry backoff (seconds)
RETRY_BACKOFF = [1, 2, 5]  # 1s, 2s, 5s

# ============================================================================
# LOGGING
# ============================================================================

# Log level: DEBUG, INFO, WARNING, ERROR, CRITICAL
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Log format
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ============================================================================
# CACHE AND STATE
# ============================================================================

# Enable caching of API responses (useful for testing)
ENABLE_CACHE = os.getenv("ENABLE_CACHE", "false").lower() == "true"

# Cache directory
CACHE_DIR = Path(__file__).parent / "cache"
CACHE_DIR.mkdir(exist_ok=True)

# Cache TTL (hours)
CACHE_TTL = 24

# ============================================================================
# API CREDENTIALS
# ============================================================================

# API keys - Set via environment variables
STOCK_API_KEY = os.getenv("STOCK_API_KEY", "")
SPORTS_API_KEY = os.getenv("SPORTS_API_KEY", "")

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Enable dry-run mode (fetch and validate, but don't save)
DRY_RUN = os.getenv("DRY_RUN", "false").lower() == "true"

# Enable parallel processing (experimental)
ENABLE_PARALLEL = os.getenv("ENABLE_PARALLEL", "false").lower() == "true"

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_output_path(data_type, filename):
    """Get the full output path for a data file.

    Args:
        data_type: 'locations', 'stocks', 'sports'
        filename: Name of the output file

    Returns:
        Path object for the output file
    """
    if data_type == "locations":
        return LOCATIONS_OUTPUT_DIR / filename
    elif data_type == "stocks":
        return STOCKS_OUTPUT_DIR / filename
    elif data_type == "sports":
        return SPORTS_OUTPUT_DIR / filename
    else:
        raise ValueError(f"Unknown data type: {data_type}")


def load_api_config(config_file):
    """Load API configuration from JSON file.

    Args:
        config_file: Path to JSON config file

    Returns:
        Dictionary of API settings
    """
    if not config_file.exists():
        return {}

    with open(config_file, 'r') as f:
        return json.load(f)


def validate_config():
    """Validate configuration consistency.

    Raises:
        ValueError if configuration is invalid
    """
    # Check that output directories are writable
    for dir_path in [LOCATIONS_OUTPUT_DIR, STOCKS_OUTPUT_DIR, SPORTS_OUTPUT_DIR, LOGS_DIR]:
        if not dir_path.exists():
            try:
                dir_path.mkdir(parents=True, exist_ok=True)
            except OSError as e:
                raise ValueError(f"Cannot create directory {dir_path}: {e}")

        if not os.access(dir_path, os.W_OK):
            raise ValueError(f"No write permission for {dir_path}")


if __name__ == "__main__":
    # Print current configuration
    print("FranchiseIQ Data Ingestion Configuration")
    print("=" * 60)
    print(f"Base Directory: {BASE_DIR}")
    print(f"Data Directory: {DATA_DIR}")
    print(f"Logs Directory: {LOGS_DIR}")
    print(f"Locations Output: {LOCATIONS_OUTPUT_DIR}")
    print(f"Stocks Output: {STOCKS_OUTPUT_DIR}")
    print(f"Sports Output: {SPORTS_OUTPUT_DIR}")
    print(f"Log Level: {LOG_LEVEL}")
    print(f"Batch Size: {BATCH_SIZE}")
    print(f"Dry Run: {DRY_RUN}")
    print("=" * 60)

    # Validate configuration
    try:
        validate_config()
        print("Configuration is valid!")
    except ValueError as e:
        print(f"Configuration Error: {e}")
