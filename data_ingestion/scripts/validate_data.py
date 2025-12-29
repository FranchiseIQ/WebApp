"""
Data Validation Script

Validates all ingested data files for quality and consistency.

Usage:
    python scripts/validate_data.py              # Validate all data
    python scripts/validate_data.py --data-type locations  # Validate locations
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from data_ingestion.config import (
    LOCATIONS_OUTPUT_DIR,
    STOCKS_OUTPUT_DIR,
    SPORTS_OUTPUT_DIR,
    LOGS_DIR
)
from data_ingestion.utils.logging import setup_logger
from data_ingestion.utils.validators import (
    validate_locations_batch,
    validate_stock_data
)
from data_ingestion.utils.storage import load_json


# ============================================================================
# VALIDATORS
# ============================================================================


class DataValidator:
    """Validates ingested data files."""

    def __init__(self):
        """Initialize validator."""
        self.logger = setup_logger("validator", LOGS_DIR / "validator.log")
        self.results = {}

    def validate_locations(self) -> Dict[str, Any]:
        """Validate all location files.

        Returns:
            Validation summary
        """
        self.logger.info("Validating location files...")
        summary = {
            "data_type": "locations",
            "file_count": 0,
            "total_locations": 0,
            "valid_locations": 0,
            "invalid_locations": 0,
            "files": {}
        }

        if not LOCATIONS_OUTPUT_DIR.exists():
            self.logger.warning(f"Location directory not found: {LOCATIONS_OUTPUT_DIR}")
            return summary

        # Find all location files
        for json_file in LOCATIONS_OUTPUT_DIR.glob("*.json"):
            if json_file.name.endswith("_summary.json"):
                continue

            try:
                data = load_json(json_file)

                if isinstance(data, dict) and "locations" in data:
                    locations = data["locations"]
                elif isinstance(data, list):
                    locations = data
                else:
                    self.logger.warning(f"Invalid format in {json_file.name}")
                    continue

                # Validate
                result = validate_locations_batch(locations)

                summary["file_count"] += 1
                summary["total_locations"] += result["total"]
                summary["valid_locations"] += result["valid"]
                summary["invalid_locations"] += result["invalid"]

                summary["files"][json_file.name] = {
                    "total": result["total"],
                    "valid": result["valid"],
                    "invalid": result["invalid"],
                    "error_count": len(result["error_details"])
                }

                self.logger.info(f"Validated {json_file.name}: {result['valid']}/{result['total']} valid")

            except Exception as e:
                self.logger.error(f"Failed to validate {json_file.name}: {e}")

        return summary

    def validate_stocks(self) -> Dict[str, Any]:
        """Validate all stock files.

        Returns:
            Validation summary
        """
        self.logger.info("Validating stock files...")
        summary = {
            "data_type": "stocks",
            "file_count": 0,
            "total_records": 0,
            "valid_records": 0,
            "invalid_records": 0,
            "files": {}
        }

        if not STOCKS_OUTPUT_DIR.exists():
            self.logger.warning(f"Stock directory not found: {STOCKS_OUTPUT_DIR}")
            return summary

        # Find all stock files
        for json_file in STOCKS_OUTPUT_DIR.glob("*.json"):
            try:
                data = load_json(json_file)

                if isinstance(data, dict) and "data" in data:
                    records = data["data"]
                elif isinstance(data, list):
                    records = data
                else:
                    self.logger.warning(f"Invalid format in {json_file.name}")
                    continue

                # Validate
                result = validate_stock_data(records)

                summary["file_count"] += 1
                summary["total_records"] += result.get("total", 0)
                summary["valid_records"] += result.get("valid_records", 0)
                summary["invalid_records"] += result.get("invalid_records", 0)

                summary["files"][json_file.name] = {
                    "total": result.get("total", 0),
                    "valid": result.get("valid_records", 0),
                    "invalid": result.get("invalid_records", 0),
                    "valid": result.get("valid", False)
                }

                self.logger.info(f"Validated {json_file.name}: {result.get('valid_records', 0)}/{result.get('total', 0)} valid")

            except Exception as e:
                self.logger.error(f"Failed to validate {json_file.name}: {e}")

        return summary

    def validate_sports(self) -> Dict[str, Any]:
        """Validate all sports files.

        Returns:
            Validation summary
        """
        self.logger.info("Validating sports files...")
        summary = {
            "data_type": "sports",
            "file_count": 0,
            "total_games": 0,
            "files": {}
        }

        if not SPORTS_OUTPUT_DIR.exists():
            self.logger.warning(f"Sports directory not found: {SPORTS_OUTPUT_DIR}")
            return summary

        # Find all sports files
        for json_file in SPORTS_OUTPUT_DIR.rglob("*.json"):
            try:
                data = load_json(json_file)

                if isinstance(data, dict) and "games" in data:
                    games = data["games"]
                elif isinstance(data, list):
                    games = data
                else:
                    self.logger.warning(f"Invalid format in {json_file.name}")
                    continue

                summary["file_count"] += 1
                summary["total_games"] += len(games)

                summary["files"][str(json_file.relative_to(SPORTS_OUTPUT_DIR))] = {
                    "game_count": len(games),
                    "valid": len(games) > 0
                }

                self.logger.info(f"Validated {json_file.name}: {len(games)} games")

            except Exception as e:
                self.logger.error(f"Failed to validate {json_file.name}: {e}")

        return summary

    def validate_all(self) -> Dict[str, Any]:
        """Validate all data.

        Returns:
            Overall validation summary
        """
        self.logger.info("Starting comprehensive data validation")

        overall_summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "validation_results": {}
        }

        # Validate each data type
        overall_summary["validation_results"]["locations"] = self.validate_locations()
        overall_summary["validation_results"]["stocks"] = self.validate_stocks()
        overall_summary["validation_results"]["sports"] = self.validate_sports()

        # Calculate overall stats
        total_valid = 0
        total_invalid = 0

        for data_type, result in overall_summary["validation_results"].items():
            total_valid += result.get("valid_locations", result.get("valid_records", 0))
            total_invalid += result.get("invalid_locations", result.get("invalid_records", 0))

        overall_summary["overall"] = {
            "total_valid": total_valid,
            "total_invalid": total_invalid,
            "all_valid": total_invalid == 0
        }

        return overall_summary

    def report(self, summary: Dict[str, Any]) -> None:
        """Print validation report.

        Args:
            summary: Validation summary
        """
        print("\n" + "=" * 70)
        print("DATA VALIDATION REPORT")
        print("=" * 70)

        print(f"\nTimestamp: {summary['timestamp']}")

        for data_type, result in summary["validation_results"].items():
            print(f"\n{data_type.upper()}")
            print("-" * 70)

            if data_type == "locations":
                print(f"  Files: {result['file_count']}")
                print(f"  Total Locations: {result['total_locations']}")
                print(f"  Valid: {result['valid_locations']}")
                print(f"  Invalid: {result['invalid_locations']}")
                if result['total_locations'] > 0:
                    pct = (result['valid_locations'] / result['total_locations']) * 100
                    print(f"  Validity: {pct:.1f}%")

            elif data_type == "stocks":
                print(f"  Files: {result['file_count']}")
                print(f"  Total Records: {result['total_records']}")
                print(f"  Valid: {result['valid_records']}")
                print(f"  Invalid: {result['invalid_records']}")

            elif data_type == "sports":
                print(f"  Files: {result['file_count']}")
                print(f"  Total Games: {result['total_games']}")

        print(f"\n{'OVERALL'}")
        print("-" * 70)
        overall = summary["overall"]
        print(f"  Total Valid Records: {overall['total_valid']}")
        print(f"  Total Invalid Records: {overall['total_invalid']}")
        print(f"  Status: {'PASS' if overall['all_valid'] else 'FAIL'}")

        print("\n" + "=" * 70)


# ============================================================================
# COMMAND LINE INTERFACE
# ============================================================================


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="FranchiseIQ Data Validation",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/validate_data.py                  # Validate all data
  python scripts/validate_data.py --data-type locations  # Validate locations
  python scripts/validate_data.py --data-type stocks     # Validate stocks
        """
    )

    parser.add_argument(
        "--data-type",
        choices=["all", "locations", "stocks", "sports"],
        default="all",
        help="Data type to validate (default: all)"
    )

    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Enable verbose logging"
    )

    args = parser.parse_args()

    # Create validator
    validator = DataValidator()

    # Run validation
    if args.data_type == "all":
        summary = validator.validate_all()
    elif args.data_type == "locations":
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "validation_results": {
                "locations": validator.validate_locations()
            }
        }
    elif args.data_type == "stocks":
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "validation_results": {
                "stocks": validator.validate_stocks()
            }
        }
    elif args.data_type == "sports":
        summary = {
            "timestamp": datetime.utcnow().isoformat(),
            "validation_results": {
                "sports": validator.validate_sports()
            }
        }

    # Print report
    validator.report(summary)

    # Save report to file
    report_path = LOGS_DIR / f"validation_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nDetailed report saved to: {report_path}")

    # Exit with appropriate code
    is_valid = summary["overall"].get("all_valid", False)
    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
