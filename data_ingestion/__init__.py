"""
FranchiseIQ Data Ingestion System

Production-ready framework for bulk loading franchise data, stock data,
sports data, and location information.

Example:
    Basic usage of a data ingestor:

    >>> from data_ingestion.examples.ingest_franchise_locations import FranchiseLocationsIngestor
    >>> ingestor = FranchiseLocationsIngestor()
    >>> success = ingestor.run()
    >>> if success:
    ...     print("Data loaded successfully!")
    ...     summary = ingestor.get_summary()
    ...     print(f"Loaded {summary['record_count']} records")
"""

from .base import DataIngestionScript, BulkIngestionScript, StreamingIngestionScript
from .config import (
    DATA_DIR,
    LOCATIONS_OUTPUT_DIR,
    STOCKS_OUTPUT_DIR,
    SPORTS_OUTPUT_DIR,
    get_output_path,
    validate_config
)

__version__ = "1.0.0"
__author__ = "FranchiseIQ Team"

__all__ = [
    "DataIngestionScript",
    "BulkIngestionScript",
    "StreamingIngestionScript",
    "DATA_DIR",
    "LOCATIONS_OUTPUT_DIR",
    "STOCKS_OUTPUT_DIR",
    "SPORTS_OUTPUT_DIR",
    "get_output_path",
    "validate_config",
]
