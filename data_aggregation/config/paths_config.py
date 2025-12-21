"""
Centralized path configuration for data aggregation pipelines.

This module provides a single source of truth for all output paths used across
pipeline scripts. All scripts import paths from here to ensure consistency.

Key benefits:
- Single place to update paths for all pipelines
- Prevents path duplication across scripts
- Enables easy relocation of data directories
- Automatic directory creation
"""

from pathlib import Path

# ============================================================================
# REPO STRUCTURE & ROOT PATHS
# ============================================================================

# Repository root (parent of data-aggregation directory)
REPO_ROOT = Path(__file__).parent.parent.parent

# Data aggregation root
DATA_AGGREGATION_ROOT = Path(__file__).parent.parent

# ============================================================================
# DATA DIRECTORIES
# ============================================================================

# FranchiseMap main data directory
FRANCHISEMAP_DATA_DIR = REPO_ROOT / "FranchiseMap" / "data"
BRAND_METADATA_JSON = FRANCHISEMAP_DATA_DIR / 'brand_metadata.json'

# Stock data directories
STOCKS_DATA_DIR = REPO_ROOT / "data" / "stocks"
HISTORICAL_STOCKS_CSV = STOCKS_DATA_DIR / "franchise_stocks_historical.csv"
LIVE_TICKER_JSON = STOCKS_DATA_DIR / "live_ticker.json"
MAP_STOCKS_JSON = FRANCHISEMAP_DATA_DIR / "stocks.json"

# Sports data directories
SPORTS_DATA_DIR = REPO_ROOT / "data" / "sports"
SPORTS_DATA_JSON = FRANCHISEMAP_DATA_DIR / "sports_data.json"

# Sports league-specific directories
FOOTBALL_DATA_DIR = SPORTS_DATA_DIR / "football"
FOOTBALL_GAMES_JSON = FOOTBALL_DATA_DIR / "current-week.json"

BASKETBALL_DATA_DIR = SPORTS_DATA_DIR / "basketball"
BASKETBALL_GAMES_JSON = BASKETBALL_DATA_DIR / "current-games.json"

HOCKEY_DATA_DIR = SPORTS_DATA_DIR / "hockey"
HOCKEY_GAMES_JSON = HOCKEY_DATA_DIR / "current-games.json"

BASEBALL_DATA_DIR = SPORTS_DATA_DIR / "baseball"
BASEBALL_GAMES_JSON = BASEBALL_DATA_DIR / "current-games.json"

SOCCER_DATA_DIR = SPORTS_DATA_DIR / "soccer"
SOCCER_GAMES_JSON = SOCCER_DATA_DIR / "current-games.json"

# Franchise data directories
BRANDS_DATA_DIR = REPO_ROOT / "data" / "brands"
MANIFEST_JSON = REPO_ROOT / "data" / "manifest.json"
NEWS_JSON = REPO_ROOT / "data" / "franchise_news.json"

# ============================================================================
# UTILITY FUNCTIONS
# ============================================================================

def ensure_dir_exists(dirpath: Path) -> Path:
    """
    Ensure directory exists, creating if necessary.

    Args:
        dirpath: Path to directory

    Returns:
        The directory path
    """
    dirpath.mkdir(parents=True, exist_ok=True)
    return dirpath


def get_output_dir(key: str) -> Path:
    """
    Get output directory by key.

    Args:
        key: Directory key (e.g., 'stocks', 'sports', 'brands')

    Returns:
        Path to requested directory

    Raises:
        KeyError: If key is not recognized
    """
    dirs = {
        'stocks': STOCKS_DATA_DIR,
        'sports': SPORTS_DATA_DIR,
        'football': FOOTBALL_DATA_DIR,
        'basketball': BASKETBALL_DATA_DIR,
        'hockey': HOCKEY_DATA_DIR,
        'baseball': BASEBALL_DATA_DIR,
        'soccer': SOCCER_DATA_DIR,
        'brands': BRANDS_DATA_DIR,
        'franchisemap': FRANCHISEMAP_DATA_DIR,
    }
    return dirs[key.lower()]


def get_log_file(pipeline: str) -> Path:
    """
    Get log file path for a pipeline.

    Args:
        pipeline: Pipeline name (e.g., 'stocks', 'sports')

    Returns:
        Path to log file
    """
    log_dir = DATA_AGGREGATION_ROOT / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / f"{pipeline}.log"


# ============================================================================
# INITIALIZE DIRECTORIES
# ============================================================================

# Ensure all required directories exist on module import
_required_dirs = [
    STOCKS_DATA_DIR,
    SPORTS_DATA_DIR,
    FOOTBALL_DATA_DIR,
    BASKETBALL_DATA_DIR,
    HOCKEY_DATA_DIR,
    BASEBALL_DATA_DIR,
    SOCCER_DATA_DIR,
    BRANDS_DATA_DIR,
    FRANCHISEMAP_DATA_DIR,
    DATA_AGGREGATION_ROOT / "logs",
]

for _dir in _required_dirs:
    ensure_dir_exists(_dir)

del _required_dirs, _dir
