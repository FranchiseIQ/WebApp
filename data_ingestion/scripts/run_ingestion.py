"""
Main Ingestion Orchestrator

Runs all configured data ingestors in sequence or parallel.

Usage:
    python scripts/run_ingestion.py          # Run all ingestors
    python scripts/run_ingestion.py --help   # Show options
"""

import argparse
import json
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import List

from data_ingestion.base import DataIngestionScript
from data_ingestion.examples import (
    FranchiseLocationsIngestor,
    HistoricalStocksIngestor,
    SportsDataIngestor
)
from data_ingestion.utils.logging import setup_logger
from data_ingestion.config import LOGS_DIR


# ============================================================================
# ORCHESTRATOR
# ============================================================================


class IngestionOrchestrator:
    """Orchestrates running multiple ingestors."""

    def __init__(self, parallel: bool = False, dry_run: bool = False):
        """Initialize orchestrator.

        Args:
            parallel: Run ingestors in parallel (not implemented yet)
            dry_run: Fetch and validate but don't save
        """
        self.parallel = parallel
        self.dry_run = dry_run
        self.logger = setup_logger("orchestrator", LOGS_DIR / "orchestrator.log")
        self.ingestors: List[DataIngestionScript] = []
        self.results = {}

    def register_ingestor(self, ingestor: DataIngestionScript) -> None:
        """Register an ingestor to run.

        Args:
            ingestor: DataIngestionScript instance
        """
        self.ingestors.append(ingestor)
        self.logger.info(f"Registered ingestor: {ingestor.name}")

    def run_all(self) -> bool:
        """Run all registered ingestors.

        Returns:
            True if all succeeded, False if any failed
        """
        if not self.ingestors:
            self.logger.error("No ingestors registered")
            return False

        self.logger.info(f"Starting ingestion pipeline with {len(self.ingestors)} ingestors")
        start_time = datetime.utcnow()

        # Run ingestors sequentially
        all_succeeded = True
        for ingestor in self.ingestors:
            try:
                self.logger.info(f"Running: {ingestor.name}")
                success = ingestor.run()

                summary = ingestor.get_summary()
                self.results[ingestor.name] = {
                    "success": success,
                    "summary": summary
                }

                if success:
                    self.logger.info(f"Completed: {ingestor.name}")
                else:
                    self.logger.error(f"Failed: {ingestor.name}")
                    all_succeeded = False

            except Exception as e:
                self.logger.error(f"Exception in {ingestor.name}: {e}", exc_info=True)
                all_succeeded = False

        end_time = datetime.utcnow()
        duration = (end_time - start_time).total_seconds()

        # Log summary
        self._log_summary(duration, all_succeeded)
        return all_succeeded

    def _log_summary(self, duration: float, all_succeeded: bool) -> None:
        """Log execution summary.

        Args:
            duration: Total execution time (seconds)
            all_succeeded: Whether all ingestors succeeded
        """
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "duration_seconds": duration,
            "total_ingestors": len(self.ingestors),
            "succeeded": sum(1 for r in self.results.values() if r["success"]),
            "failed": sum(1 for r in self.results.values() if not r["success"]),
            "all_succeeded": all_succeeded,
            "results": self.results
        }

        self.logger.info(json.dumps(summary, indent=2))

        # Also save to file
        summary_path = LOGS_DIR / f"ingestion_summary_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_path, "w") as f:
            json.dump(summary, f, indent=2)
        self.logger.info(f"Summary saved to: {summary_path}")


# ============================================================================
# COMMAND LINE INTERFACE
# ============================================================================


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="FranchiseIQ Data Ingestion Pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/run_ingestion.py                # Run all ingestors
  python scripts/run_ingestion.py --dry-run      # Validate without saving
  python scripts/run_ingestion.py --no-parallel  # Run sequentially
        """
    )

    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Fetch and validate without saving"
    )

    parser.add_argument(
        "--no-parallel",
        action="store_true",
        help="Run ingestors sequentially (default)"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    # Create orchestrator
    orchestrator = IngestionOrchestrator(
        parallel=not args.no_parallel,
        dry_run=args.dry_run
    )

    # Register example ingestors
    orchestrator.register_ingestor(
        FranchiseLocationsIngestor(
            brand="McDonald's",
            symbol="MCD",
            data_source="data/locations/mcd_locations.csv"
        )
    )

    orchestrator.register_ingestor(
        HistoricalStocksIngestor(
            symbol="MCD",
            data_source="data/stocks/mcd_historical.csv"
        )
    )

    orchestrator.register_ingestor(
        SportsDataIngestor(
            sport="baseball",
            league="MLB",
            data_source="data/sports/mlb_2025.csv",
            season=2025
        )
    )

    # Run all ingestors
    success = orchestrator.run_all()

    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
