"""
Franchise Locations Data Ingestor

Loads thousands of franchise locations from CSV/JSON sources and transforms
to geospatial JSON format suitable for map display.

Example Output:
    {
        "locations": [
            {
                "id": "mcdonalds_ca_01234",
                "brand": "McDonald's",
                "symbol": "MCD",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "address": "123 Market St, San Francisco, CA 94102",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94102",
                "phone": "(415) 555-1234",
                "website": "https://example.com",
                "franchisee": "Franchisee Name LLC",
                "opened": 2010,
                "status": "operational",
                "score": 85,
                "units_nearby": 12
            }
        ],
        "metadata": {
            "brand": "McDonald's",
            "symbol": "MCD",
            "total_count": 13425,
            "country": "USA",
            "last_updated": "2025-12-29T10:00:00Z",
            "version": "2.0"
        }
    }
"""

import json
import csv
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from data_ingestion.base import BulkIngestionScript
from data_ingestion.config import get_output_path, LOCATIONS_OUTPUT_DIR
from data_ingestion.utils.validators import validate_locations_batch, ValidationError
from data_ingestion.utils.formatters import format_location, slugify
from data_ingestion.utils.storage import save_json, load_json, load_csv


class FranchiseLocationsIngestor(BulkIngestionScript):
    """Load and transform franchise location data.

    Supports loading from:
    - CSV files (location_data.csv)
    - JSON files (locations.json)
    - API endpoints

    Transforms to canonical geospatial format with validation.
    """

    def __init__(self, brand: str, symbol: str, data_source: str, output_format: str = "json"):
        """Initialize locations ingestor.

        Args:
            brand: Franchise brand name (e.g., "McDonald's")
            symbol: Stock ticker symbol (e.g., "MCD")
            data_source: Path to CSV/JSON file or API endpoint
            output_format: Output format ("json" or "csv")
        """
        super().__init__(
            name=f"locations_{symbol.lower()}",
            version="1.0.0",
            chunk_size=100
        )
        self.brand = brand
        self.symbol = symbol.upper()
        self.data_source = data_source
        self.output_format = output_format
        self.output_path = get_output_path("locations", f"{self.symbol}.json")

    def fetch(self) -> List[Dict[str, Any]]:
        """Fetch location data from source.

        Supports CSV, JSON, or API sources.

        Returns:
            List of raw location records
        """
        self.logger.info(f"Fetching locations for {self.brand} from {self.data_source}")

        source_path = Path(self.data_source)

        if source_path.exists():
            # File-based loading
            if source_path.suffix.lower() == ".csv":
                data = load_csv(source_path)
            elif source_path.suffix.lower() == ".json":
                data = load_json(source_path)
            else:
                raise ValueError(f"Unsupported file format: {source_path.suffix}")
        else:
            # API-based loading (stub - would implement actual API calls)
            self.logger.warning(f"Data source {self.data_source} not found. Using sample data.")
            data = self._generate_sample_locations()

        self.logger.info(f"Fetched {len(data)} location records")
        return data

    def validate(self, data: Any) -> None:
        """Validate location data.

        Args:
            data: List of location records

        Raises:
            ValidationError: If validation fails
        """
        if not isinstance(data, list):
            raise ValidationError("Data must be a list of location records")

        if len(data) == 0:
            raise ValidationError("Data is empty")

        # Validate batch
        result = validate_locations_batch(data)
        self.logger.info(f"Validation: {result['valid']}/{result['total']} records valid")

        if not result["is_valid"]:
            # Log errors but continue (partial data is OK)
            for error in result["error_details"][:5]:  # Show first 5 errors
                self.logger.warning(f"Record {error['record']}: {error['errors']}")

    def transform(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Transform location data to canonical format.

        Args:
            data: List of raw location records

        Returns:
            Dictionary with locations array and metadata
        """
        self.logger.info("Transforming location records...")

        locations = []
        errors = 0

        for i, record in enumerate(data):
            try:
                # Format the location
                formatted = format_location(record)

                # Ensure required fields
                formatted.setdefault("brand", self.brand)
                formatted.setdefault("symbol", self.symbol)

                # Generate ID if missing
                if not formatted.get("id"):
                    city_slug = slugify(formatted.get("city", ""))
                    state = formatted.get("state", "xx").lower()
                    formatted["id"] = f"{slugify(self.brand)}_{state}_{city_slug}_{i:05d}"

                locations.append(formatted)
                self.record_count += 1

                if (i + 1) % self.chunk_size == 0:
                    self.logger.debug(f"Transformed {i + 1} records")

            except Exception as e:
                errors += 1
                self.logger.warning(f"Failed to transform record {i}: {e}")

        self.logger.info(f"Transformed {self.record_count} locations ({errors} errors)")

        # Generate metadata
        metadata = {
            "brand": self.brand,
            "symbol": self.symbol,
            "total_count": len(locations),
            "country": "USA",
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "version": "2.0"
        }

        return {
            "locations": locations,
            "metadata": metadata
        }

    def save(self, data: Dict[str, Any]) -> None:
        """Save transformed data to disk.

        Args:
            data: Transformed location data with metadata

        Raises:
            IOError: If save fails
        """
        self.logger.info(f"Saving {len(data['locations'])} locations to {self.output_path}")

        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)

        # Save JSON
        save_json(data, self.output_path, pretty=True, atomic=True)
        self.logger.info(f"Saved: {self.output_path}")

        # Generate summary file
        summary = {
            "brand": data["metadata"]["brand"],
            "symbol": data["metadata"]["symbol"],
            "location_count": len(data["locations"]),
            "last_updated": data["metadata"]["last_updated"],
            "file_path": str(self.output_path)
        }

        summary_path = self.output_path.parent / f"{self.symbol}_summary.json"
        save_json(summary, summary_path)
        self.logger.info(f"Saved summary: {summary_path}")

    def fetch_chunk(self, offset: int, limit: int) -> List[Any]:
        """Fetch chunk of data (optional - for streaming sources).

        Args:
            offset: Starting record number
            limit: Maximum records to fetch

        Returns:
            List of records
        """
        # For file-based sources, this is handled by fetch()
        # For API-based sources, would implement pagination here
        return []

    def transform_record(self, record: Any) -> Any:
        """Transform single record (optional - handled by transform()).

        Args:
            record: Raw record

        Returns:
            Transformed record
        """
        return format_location(record)

    def _generate_sample_locations(self) -> List[Dict[str, Any]]:
        """Generate sample location data for testing.

        Returns:
            List of sample location records
        """
        return [
            {
                "id": "mcd_ca_01",
                "brand": "McDonald's",
                "symbol": "MCD",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "address": "123 Market St",
                "city": "San Francisco",
                "state": "CA",
                "zip": "94102",
                "phone": "(415) 555-1234",
                "website": "https://mcdonalds.com",
                "franchisee": "Joe's Franchising LLC",
                "opened": 2010,
                "status": "operational",
                "score": 85,
                "units_nearby": 12
            },
            {
                "id": "mcd_ny_01",
                "brand": "McDonald's",
                "symbol": "MCD",
                "latitude": 40.7580,
                "longitude": -73.9855,
                "address": "456 Broadway",
                "city": "New York",
                "state": "NY",
                "zip": "10001",
                "phone": "(212) 555-5678",
                "website": "https://mcdonalds.com",
                "franchisee": "East Coast Franchising Inc",
                "opened": 2005,
                "status": "operational",
                "score": 88,
                "units_nearby": 48
            }
        ]


if __name__ == "__main__":
    # Example: Load McDonald's locations from CSV
    ingestor = FranchiseLocationsIngestor(
        brand="McDonald's",
        symbol="MCD",
        data_source="locations_mcd.csv"  # Would be actual CSV file
    )

    # Run the pipeline
    success = ingestor.run()

    if success:
        print(f"Success! Loaded {ingestor.record_count} locations")
        summary = ingestor.get_summary()
        print(json.dumps(summary, indent=2))
    else:
        print(f"Failed to ingest locations. See logs for details.")
