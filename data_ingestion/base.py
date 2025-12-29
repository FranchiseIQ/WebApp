"""
FranchiseIQ Data Ingestion Base Classes

Abstract base class and common patterns for all data ingestors.
Ensures consistency and provides error handling, validation, and logging.
"""

from abc import ABC, abstractmethod
from datetime import datetime
import json
import logging
from pathlib import Path
from typing import Any, Dict, List, Optional

from .utils.logging import setup_logger
from .config import LOGS_DIR


class DataIngestionScript(ABC):
    """Abstract base class for all data ingestors.

    Defines the lifecycle: fetch -> validate -> transform -> save
    with built-in error handling, logging, and progress tracking.

    Subclasses must implement:
    - fetch(): Retrieve raw data from source
    - validate(data): Validate against expected schema
    - transform(data): Standardize to canonical format
    - save(data): Write to disk

    Optional:
    - on_error(error): Handle errors gracefully
    - get_summary(): Return execution summary
    """

    def __init__(self, name: str, version: str = "1.0.0", output_format: str = "json"):
        """Initialize ingestor.

        Args:
            name: Ingestor name (e.g., 'franchise_locations')
            version: Semantic version (e.g., '1.0.0')
            output_format: 'json', 'csv', or 'sqlite'
        """
        self.name = name
        self.version = version
        self.output_format = output_format

        # Initialize logger
        self.logger = setup_logger(name, LOGS_DIR / f"{name}.log")

        # Execution tracking
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.raw_data: Optional[Any] = None
        self.transformed_data: Optional[Any] = None
        self.record_count = 0
        self.error_count = 0
        self.error_records: List[Dict[str, Any]] = []

    def run(self) -> bool:
        """Execute full pipeline: fetch -> validate -> transform -> save.

        Returns:
            True if successful, False if failed

        The method handles all error cases and logs progress.
        """
        self.start_time = datetime.utcnow()
        self.logger.info(f"Starting {self.name} v{self.version}")

        try:
            # Step 1: Fetch data
            self.logger.info("Step 1: Fetching data...")
            self.raw_data = self.fetch()
            if self.raw_data is None:
                raise ValueError("fetch() returned None")
            self.logger.info(f"Fetched {len(self.raw_data) if isinstance(self.raw_data, (list, dict)) else '?'} records")

            # Step 2: Validate data
            self.logger.info("Step 2: Validating data...")
            self.validate(self.raw_data)
            self.logger.info("Validation passed")

            # Step 3: Transform data
            self.logger.info("Step 3: Transforming data...")
            self.transformed_data = self.transform(self.raw_data)
            if self.transformed_data is None:
                raise ValueError("transform() returned None")
            self.logger.info("Transformation complete")

            # Step 4: Save data
            self.logger.info("Step 4: Saving data...")
            self.save(self.transformed_data)
            self.logger.info("Data saved successfully")

            # Success
            self.end_time = datetime.utcnow()
            self._log_summary()
            return True

        except Exception as e:
            self.error_count += 1
            self.logger.error(f"Pipeline failed: {e}", exc_info=True)
            self.on_error(e)
            self.end_time = datetime.utcnow()
            return False

    @abstractmethod
    def fetch(self) -> Any:
        """Retrieve raw data from source.

        Should return data in original format (dict, list, etc.)
        Data will be validated and transformed by subsequent steps.

        Returns:
            Raw data structure (dict, list, etc.)

        Raises:
            Exception: If fetch fails (will be caught and logged)
        """
        pass

    @abstractmethod
    def validate(self, data: Any) -> None:
        """Validate data against expected schema.

        Should raise ValidationError if data is invalid.
        Partial validation is OK (invalid records can be logged and skipped).

        Args:
            data: Raw data to validate

        Raises:
            ValueError: If validation fails
        """
        pass

    @abstractmethod
    def transform(self, data: Any) -> Any:
        """Transform raw data to canonical output format.

        Args:
            data: Raw (validated) data

        Returns:
            Transformed data ready to save
        """
        pass

    @abstractmethod
    def save(self, data: Any) -> None:
        """Save transformed data to disk.

        Should use atomic operations (write to temp file, then rename).

        Args:
            data: Transformed data to save

        Raises:
            IOError: If save fails
        """
        pass

    def on_error(self, error: Exception) -> None:
        """Handle errors gracefully (optional override).

        Default: just logs the error.
        Subclasses can override to send alerts, rollback, etc.

        Args:
            error: Exception that occurred
        """
        pass

    def get_summary(self) -> Dict[str, Any]:
        """Return execution summary.

        Returns:
            Dictionary with execution stats
        """
        duration = None
        if self.start_time and self.end_time:
            duration = (self.end_time - self.start_time).total_seconds()

        return {
            "name": self.name,
            "version": self.version,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": duration,
            "record_count": self.record_count,
            "error_count": self.error_count,
            "success": self.error_count == 0
        }

    def _log_summary(self) -> None:
        """Log execution summary."""
        summary = self.get_summary()
        self.logger.info(f"Execution Summary: {json.dumps(summary, indent=2)}")


class BulkIngestionScript(DataIngestionScript):
    """Base class for bulk data ingestion with chunking support.

    Useful for handling large datasets (1000s of records) that need
    to be processed in chunks to avoid memory issues.

    Subclasses should implement:
    - fetch_chunk(offset, limit): Fetch chunk of data
    - transform_record(record): Transform single record
    """

    def __init__(self, name: str, version: str = "1.0.0", chunk_size: int = 100):
        """Initialize bulk ingestor.

        Args:
            name: Ingestor name
            version: Semantic version
            chunk_size: Records per chunk
        """
        super().__init__(name, version)
        self.chunk_size = chunk_size
        self.total_records = 0
        self.processed_records = 0

    def fetch(self) -> List[Any]:
        """Fetch all data in chunks.

        Returns:
            List of all records
        """
        all_records = []
        offset = 0

        self.logger.info(f"Fetching data in chunks of {self.chunk_size}")

        while True:
            chunk = self.fetch_chunk(offset, self.chunk_size)
            if not chunk:
                break

            all_records.extend(chunk)
            offset += len(chunk)
            self.logger.debug(f"Fetched {len(chunk)} records, total: {len(all_records)}")

            if len(chunk) < self.chunk_size:
                break

        self.total_records = len(all_records)
        self.logger.info(f"Total records fetched: {self.total_records}")
        return all_records

    def transform(self, data: List[Any]) -> List[Any]:
        """Transform records in chunks.

        Args:
            data: List of raw records

        Returns:
            List of transformed records
        """
        self.logger.info(f"Transforming {len(data)} records")
        transformed = []

        for i, record in enumerate(data):
            try:
                transformed_record = self.transform_record(record)
                transformed.append(transformed_record)
                self.processed_records += 1

                if (i + 1) % self.chunk_size == 0:
                    self.logger.debug(f"Transformed {i + 1} records")

            except Exception as e:
                self.error_count += 1
                self.logger.warning(f"Failed to transform record {i}: {e}")
                self.error_records.append({"index": i, "error": str(e)})

        self.logger.info(f"Transformed {len(transformed)} records ({self.error_count} errors)")
        return transformed

    def fetch_chunk(self, offset: int, limit: int) -> List[Any]:
        """Fetch chunk of data (must implement in subclass).

        Args:
            offset: Starting record number
            limit: Maximum records to fetch

        Returns:
            List of records, empty list if no more data
        """
        raise NotImplementedError("Subclasses must implement fetch_chunk()")

    def transform_record(self, record: Any) -> Any:
        """Transform single record (must implement in subclass).

        Args:
            record: Raw record

        Returns:
            Transformed record
        """
        raise NotImplementedError("Subclasses must implement transform_record()")


class StreamingIngestionScript(DataIngestionScript):
    """Base class for streaming data ingestion (real-time updates).

    Useful for continuously refreshing data (e.g., live sports scores,
    real-time stock prices).

    Subclasses should implement:
    - get_stream(): Generator yielding records
    - should_stop(): Return True to stop streaming
    """

    def __init__(self, name: str, version: str = "1.0.0", update_interval: int = 60):
        """Initialize streaming ingestor.

        Args:
            name: Ingestor name
            version: Semantic version
            update_interval: Seconds between updates
        """
        super().__init__(name, version)
        self.update_interval = update_interval
        self.last_update: Optional[datetime] = None

    def fetch(self) -> List[Any]:
        """Fetch streaming data.

        Returns:
            List of records from stream
        """
        self.logger.info(f"Starting stream with {self.update_interval}s interval")
        records = []

        try:
            for record in self.get_stream():
                records.append(record)
                self.record_count += 1

                if self.should_stop():
                    break

            self.last_update = datetime.utcnow()
            self.logger.info(f"Stream yielded {len(records)} records")

        except Exception as e:
            self.logger.error(f"Stream error: {e}", exc_info=True)
            raise

        return records

    def get_stream(self):
        """Get streaming data (generator).

        Should yield records one at a time.

        Yields:
            Record data
        """
        raise NotImplementedError("Subclasses must implement get_stream()")

    def should_stop(self) -> bool:
        """Determine if streaming should stop.

        Default: False (continue forever)
        Override to add stop conditions.

        Returns:
            True if streaming should stop
        """
        return False
