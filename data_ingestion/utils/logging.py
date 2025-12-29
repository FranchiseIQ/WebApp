"""
Structured Logging Utilities

Provides consistent logging across all data ingestors.
"""

import logging
import logging.handlers
from pathlib import Path
from typing import Optional

# ============================================================================
# LOGGER SETUP
# ============================================================================


def setup_logger(name: str, log_file: Optional[Path] = None, level: str = "INFO") -> logging.Logger:
    """Set up a structured logger.

    Args:
        name: Logger name (usually the ingestor name)
        log_file: Path to log file (optional)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)

    Returns:
        Configured logger instance
    """
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level.upper()))

    # Clear existing handlers
    logger.handlers.clear()

    # Format: timestamp - name - level - message
    formatter = logging.Formatter(
        "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console handler (always)
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File handler (if specified)
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)

    return logger


def log_progress(logger: logging.Logger, current: int, total: int, prefix: str = "") -> None:
    """Log progress of batch processing.

    Args:
        logger: Logger instance
        current: Current record number
        total: Total records
        prefix: Optional prefix message
    """
    if total == 0:
        return

    percent = (current / total) * 100
    message = f"{prefix} {current}/{total} ({percent:.1f}%)" if prefix else f"{current}/{total} ({percent:.1f}%)"
    logger.debug(message)


def log_error_record(logger: logging.Logger, record_id: int, field: str, error: str) -> None:
    """Log error for a specific record field.

    Args:
        logger: Logger instance
        record_id: Record number or ID
        field: Field name
        error: Error message
    """
    logger.warning(f"Record {record_id}, field '{field}': {error}")


class ProgressLogger:
    """Helper class for logging progress in batch operations."""

    def __init__(self, logger: logging.Logger, total: int, prefix: str = "Processing"):
        """Initialize progress logger.

        Args:
            logger: Logger instance
            total: Total records to process
            prefix: Message prefix
        """
        self.logger = logger
        self.total = total
        self.prefix = prefix
        self.current = 0

    def update(self, n: int = 1) -> None:
        """Update progress counter.

        Args:
            n: Number of records processed (default 1)
        """
        self.current += n

    def log(self) -> None:
        """Log current progress."""
        log_progress(self.logger, self.current, self.total, self.prefix)

    def finish(self) -> None:
        """Log completion."""
        self.logger.info(f"{self.prefix} complete: {self.current}/{self.total}")
