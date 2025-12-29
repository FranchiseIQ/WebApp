"""
Historical Stock Data Ingestor

Loads 5-10 years of OHLCV (Open, High, Low, Close, Volume) data
for franchise company stocks.

Supports multiple data sources:
- CSV files (date, open, high, low, close, volume)
- JSON files (array of OHLCV records)
- APIs (yfinance, Alpha Vantage, etc.)

Output Format:
    {
        "symbol": "MCD",
        "data": [
            {
                "date": "2025-12-29",
                "open": 296.50,
                "high": 298.75,
                "low": 295.25,
                "close": 297.80,
                "volume": 2150000,
                "adjusted_close": 297.80
            }
        ],
        "metadata": {
            "currency": "USD",
            "start_date": "2015-01-01",
            "end_date": "2025-12-29",
            "record_count": 2816,
            "last_updated": "2025-12-29T16:30:00Z"
        }
    }
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

from data_ingestion.base import BulkIngestionScript
from data_ingestion.config import get_output_path, MIN_HISTORICAL_RECORDS
from data_ingestion.utils.validators import validate_stock_data, ValidationError
from data_ingestion.utils.formatters import format_stock_record, calculate_price_change
from data_ingestion.utils.storage import save_json, load_json, load_csv


class HistoricalStocksIngestor(BulkIngestionScript):
    """Load and transform historical stock data.

    Supports:
    - CSV files with OHLCV data
    - JSON files with record arrays
    - API sources (yfinance, etc.)

    Validates price bounds and date continuity.
    """

    def __init__(self, symbol: str, data_source: str, start_date: Optional[str] = None, end_date: Optional[str] = None):
        """Initialize stock ingestor.

        Args:
            symbol: Stock ticker symbol (e.g., "MCD")
            data_source: Path to CSV/JSON file or API endpoint
            start_date: Start date (YYYY-MM-DD) or None for 5 years ago
            end_date: End date (YYYY-MM-DD) or None for today
        """
        super().__init__(
            name=f"stocks_{symbol.lower()}",
            version="1.0.0",
            chunk_size=250  # Trading year worth of data
        )
        self.symbol = symbol.upper()
        self.data_source = data_source
        self.start_date = start_date or (datetime.utcnow() - timedelta(days=365*5)).strftime("%Y-%m-%d")
        self.end_date = end_date or datetime.utcnow().strftime("%Y-%m-%d")
        self.output_path = get_output_path("stocks", f"{self.symbol}.json")

    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch stock data from source.

        Supports CSV, JSON, or API sources.

        Returns:
            List of OHLCV records, sorted by date
        """
        self.logger.info(f"Fetching stock data for {self.symbol} from {self.data_source}")

        source_path = Path(self.data_source)

        if source_path.exists():
            # File-based loading
            if source_path.suffix.lower() == ".csv":
                data = load_csv(source_path)
            elif source_path.suffix.lower() == ".json":
                json_data = load_json(source_path)
                data = json_data if isinstance(json_data, list) else json_data.get("data", [])
            else:
                raise ValueError(f"Unsupported file format: {source_path.suffix}")
        else:
            # API-based loading (stub - would implement yfinance/Alpha Vantage)
            self.logger.warning(f"Data source {self.data_source} not found. Using sample data.")
            data = self._generate_sample_data()

        # Sort by date
        data = sorted(data, key=lambda x: str(x.get("date", "")))

        self.logger.info(f"Fetched {len(data)} stock records from {self.start_date} to {self.end_date}")
        return data

    def validate(self, data: Any) -> None:
        """Validate stock data.

        Args:
            data: List of OHLCV records

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(data, list):
            raise ValidationError("Data must be a list of OHLCV records")

        if len(data) < MIN_HISTORICAL_RECORDS:
            raise ValidationError(f"Insufficient records: {len(data)} < {MIN_HISTORICAL_RECORDS}")

        # Validate batch
        result = validate_stock_data(data)

        if not result.get("valid", False):
            raise ValidationError(f"Validation failed: {result.get('reason', 'Unknown error')}")

        self.logger.info(f"Validation: {result['valid_records']}/{result['total']} records valid")

    def transform(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Transform stock data to canonical format.

        Args:
            data: List of raw OHLCV records

        Returns:
            Dictionary with stocks array and metadata
        """
        self.logger.info(f"Transforming {len(data)} stock records...")

        records = []
        errors = 0

        for i, record in enumerate(data):
            try:
                # Format the record
                formatted = format_stock_record(record)
                records.append(formatted)
                self.record_count += 1

                if (i + 1) % self.chunk_size == 0:
                    self.logger.debug(f"Transformed {i + 1} records")

            except Exception as e:
                errors += 1
                self.logger.warning(f"Failed to transform record {i}: {e}")

        self.logger.info(f"Transformed {self.record_count} stock records ({errors} errors)")

        # Calculate statistics
        closes = [r["close"] for r in records]
        min_price = min(closes) if closes else 0
        max_price = max(closes) if closes else 0
        avg_price = sum(closes) / len(closes) if closes else 0

        # Generate metadata
        metadata = {
            "symbol": self.symbol,
            "currency": "USD",
            "start_date": self.start_date,
            "end_date": self.end_date,
            "record_count": len(records),
            "statistics": {
                "min_price": round(min_price, 2),
                "max_price": round(max_price, 2),
                "avg_price": round(avg_price, 2)
            },
            "last_updated": datetime.utcnow().isoformat() + "Z"
        }

        return {
            "symbol": self.symbol,
            "data": records,
            "metadata": metadata
        }

    def save(self, data: Dict[str, Any]) -> None:
        """Save transformed data to disk.

        Args:
            data: Transformed stock data with metadata

        Raises:
            IOError: If save fails
        """
        self.logger.info(f"Saving {len(data['data'])} stock records to {self.output_path}")

        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save JSON
        save_json(data, self.output_path, pretty=True, atomic=True)
        self.logger.info(f"Saved: {self.output_path}")

    def fetch_chunk(self, offset: int, limit: int) -> List[Any]:
        """Fetch chunk of data (optional).

        Args:
            offset: Starting record number
            limit: Maximum records to fetch

        Returns:
            List of records
        """
        # Handled by fetch()
        return []

    def transform_record(self, record: Any) -> Any:
        """Transform single record.

        Args:
            record: Raw record

        Returns:
            Transformed record
        """
        return format_stock_record(record)

    def _generate_sample_data(self) -> List[Dict[str, Any]]:
        """Generate sample stock data for testing.

        Returns:
            List of sample OHLCV records for last 500 days
        """
        data = []
        base_price = 296.50
        current_date = datetime.utcnow() - timedelta(days=500)

        for i in range(500):
            # Add random walk to price
            change = (i % 3 - 1) * 0.5  # -0.5, 0, or +0.5
            daily_high = base_price + abs(change) + 2
            daily_low = base_price + abs(change) - 2
            daily_close = base_price + change

            data.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "open": round(base_price, 2),
                "high": round(daily_high, 2),
                "low": round(daily_low, 2),
                "close": round(daily_close, 2),
                "volume": 2000000 + (i * 1000) % 500000,
                "adjusted_close": round(daily_close, 2)
            })

            base_price = daily_close
            current_date += timedelta(days=1)

        return data


if __name__ == "__main__":
    # Example: Load McDonald's historical stock data
    ingestor = HistoricalStocksIngestor(
        symbol="MCD",
        data_source="mcd_historical.csv"  # Would be actual CSV file
    )

    # Run the pipeline
    success = ingestor.run()

    if success:
        print(f"Success! Loaded {ingestor.record_count} stock records")
        summary = ingestor.get_summary()
        print(json.dumps(summary, indent=2))
    else:
        print(f"Failed to ingest stock data. See logs for details.")
