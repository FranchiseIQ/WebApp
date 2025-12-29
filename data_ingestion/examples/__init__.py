"""FranchiseIQ Data Ingestion Examples

Concrete implementations of DataIngestionScript for different data sources:

- FranchiseLocationsIngestor: Load franchise locations from CSV/JSON/API
- HistoricalStocksIngestor: Load historical OHLCV stock data
- SportsDataIngestor: Load sports game data from multiple leagues
"""

from .ingest_franchise_locations import FranchiseLocationsIngestor
from .ingest_historical_stocks import HistoricalStocksIngestor
from .ingest_sports_data import SportsDataIngestor

__all__ = [
    "FranchiseLocationsIngestor",
    "HistoricalStocksIngestor",
    "SportsDataIngestor",
]
