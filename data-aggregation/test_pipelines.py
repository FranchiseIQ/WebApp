#!/usr/bin/env python3
"""
Comprehensive testing and validation script for data-aggregation pipelines.

Validates:
- Pipeline module imports
- Ticker synchronization
- Configuration files
- Common utilities
- Directory structure
"""

import sys
from pathlib import Path

# Add repo root to Python path BEFORE any imports
repo_root = Path(__file__).parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))


def test_imports():
    """Test that all pipeline modules can be imported."""
    print("\n" + "="*70)
    print("TESTING PIPELINE IMPORTS")
    print("="*70)

    tests = [
        ("data_aggregation", "Main package"),
        ("data_aggregation.config", "Config package"),
        ("data_aggregation.config.paths_config", "Paths configuration"),
        ("data_aggregation.pipelines", "Pipelines package"),
        ("data_aggregation.pipelines.common", "Common utilities"),
        ("data_aggregation.pipelines.common.utils", "Utils module"),
        ("data_aggregation.pipelines.common.data_quality", "Data quality module"),
        ("data_aggregation.pipelines.common.api_handlers", "API handlers module"),
        ("data_aggregation.pipelines.stocks", "Stocks pipeline"),
        ("data_aggregation.pipelines.stocks.update_historical_data", "Update historical data"),
        ("data_aggregation.pipelines.stocks.fetch_live_ticker", "Fetch live ticker"),
        ("data_aggregation.pipelines.stocks.fetch_current_prices", "Fetch current prices"),
        ("data_aggregation.pipelines.stocks.sync_tickers", "Sync tickers"),
        ("data_aggregation.pipelines.sports", "Sports pipeline"),
        ("data_aggregation.pipelines.sports.fetch_sports_data", "Fetch sports data"),
        ("data_aggregation.pipelines.franchise", "Franchise pipeline"),
        ("data_aggregation.pipelines.franchise.fetch_news", "Fetch news"),
        ("data_aggregation.pipelines.franchise.generate_locations", "Generate locations"),
    ]

    passed = 0
    failed = 0

    for module_name, description in tests:
        try:
            __import__(module_name)
            print(f"  ✓ {module_name}")
            passed += 1
        except ImportError as e:
            print(f"  ✗ {module_name}: {e}")
            failed += 1

    print(f"\nResults: {passed}/{len(tests)} imports successful")
    return failed == 0


def test_ticker_sync():
    """Test stock ticker synchronization."""
    print("\n" + "="*70)
    print("TESTING TICKER SYNCHRONIZATION")
    print("="*70)

    try:
        from data_aggregation.pipelines.stocks.update_historical_data import FRANCHISE_STOCKS
        from data_aggregation.pipelines.stocks.fetch_live_ticker import TICKER_SYMBOLS as LIVE_SYMBOLS
        from data_aggregation.pipelines.stocks.fetch_current_prices import TICKER_SYMBOLS as MAP_SYMBOLS

        hist_set = set(FRANCHISE_STOCKS)
        live_set = set(LIVE_SYMBOLS)
        map_set = set(MAP_SYMBOLS)

        print(f"  Master list (FRANCHISE_STOCKS): {len(FRANCHISE_STOCKS)} tickers")
        print(f"  Live ticker list: {len(LIVE_SYMBOLS)} tickers")
        print(f"  Map ticker list: {len(MAP_SYMBOLS)} tickers")

        # Check synchronization
        tests_passed = True

        if hist_set != live_set:
            missing = hist_set - live_set
            extra = live_set - hist_set
            if missing:
                print(f"  ✗ Missing in live: {missing}")
                tests_passed = False
            if extra:
                print(f"  ✗ Extra in live: {extra}")
                tests_passed = False

        if hist_set != map_set:
            missing = hist_set - map_set
            extra = map_set - hist_set
            if missing:
                print(f"  ✗ Missing in map: {missing}")
                tests_passed = False
            if extra:
                print(f"  ✗ Extra in map: {extra}")
                tests_passed = False

        if tests_passed:
            print("  ✓ All ticker lists are synchronized!")
            return True
        else:
            return False

    except Exception as e:
        print(f"  ✗ Error testing ticker sync: {e}")
        return False


def test_configuration():
    """Test configuration files."""
    print("\n" + "="*70)
    print("TESTING CONFIGURATION")
    print("="*70)

    tests_passed = True

    # Test paths_config
    try:
        from data_aggregation.config.paths_config import (
            REPO_ROOT,
            STOCKS_DATA_DIR,
            SPORTS_DATA_DIR,
            BRANDS_DATA_DIR,
            MANIFEST_JSON,
            NEWS_JSON,
        )
        print(f"  ✓ Paths configured:")
        print(f"    - Repo root: {REPO_ROOT}")
        print(f"    - Stocks data: {STOCKS_DATA_DIR}")
        print(f"    - Sports data: {SPORTS_DATA_DIR}")
        print(f"    - Brands data: {BRANDS_DATA_DIR}")
        print(f"    - Manifest: {MANIFEST_JSON}")
        print(f"    - News: {NEWS_JSON}")
    except Exception as e:
        print(f"  ✗ Error loading paths_config: {e}")
        tests_passed = False

    # Test aggregation_config
    try:
        import json
        config_path = Path(__file__).parent / "config" / "aggregation_config.json"
        if config_path.exists():
            with open(config_path) as f:
                config = json.load(f)
            print(f"  ✓ Aggregation config loaded ({len(config)} sections)")
        else:
            print(f"  ⚠ aggregation_config.json not found at {config_path}")
    except Exception as e:
        print(f"  ✗ Error loading aggregation_config: {e}")
        tests_passed = False

    return tests_passed


def test_directory_structure():
    """Test that required directories exist."""
    print("\n" + "="*70)
    print("TESTING DIRECTORY STRUCTURE")
    print("="*70)

    from data_aggregation.config.paths_config import (
        REPO_ROOT,
        STOCKS_DATA_DIR,
        SPORTS_DATA_DIR,
        BRANDS_DATA_DIR,
    )

    required_dirs = [
        (REPO_ROOT / "data-aggregation", "data-aggregation root"),
        (REPO_ROOT / "data-aggregation" / "config", "config"),
        (REPO_ROOT / "data-aggregation" / "pipelines", "pipelines"),
        (REPO_ROOT / "data-aggregation" / "pipelines" / "common", "common"),
        (REPO_ROOT / "data-aggregation" / "pipelines" / "stocks", "stocks"),
        (REPO_ROOT / "data-aggregation" / "pipelines" / "sports", "sports"),
        (REPO_ROOT / "data-aggregation" / "pipelines" / "franchise", "franchise"),
        (STOCKS_DATA_DIR, "stocks data"),
        (SPORTS_DATA_DIR, "sports data"),
        (BRANDS_DATA_DIR, "brands data"),
    ]

    all_exist = True
    for dirpath, name in required_dirs:
        if dirpath.exists():
            print(f"  ✓ {name}: {dirpath}")
        else:
            print(f"  ✗ {name} missing: {dirpath}")
            all_exist = False

    return all_exist


def test_utilities():
    """Test common utility functions."""
    print("\n" + "="*70)
    print("TESTING COMMON UTILITIES")
    print("="*70)

    from data_aggregation.pipelines.common import (
        load_json,
        save_json,
        validate_required_fields,
        calculate_statistics,
    )

    tests_passed = True

    # Test validate_required_fields
    test_obj = {"name": "test", "value": 42}
    if validate_required_fields(test_obj, ["name", "value"]):
        print("  ✓ validate_required_fields works")
    else:
        print("  ✗ validate_required_fields failed")
        tests_passed = False

    # Test calculate_statistics
    try:
        stats = calculate_statistics([1, 2, 3, 4, 5])
        if stats["mean"] == 3.0 and stats["min"] == 1 and stats["max"] == 5:
            print("  ✓ calculate_statistics works")
        else:
            print("  ✗ calculate_statistics produced unexpected results")
            tests_passed = False
    except Exception as e:
        print(f"  ✗ calculate_statistics error: {e}")
        tests_passed = False

    return tests_passed


def test_data_quality():
    """Test data quality validation."""
    print("\n" + "="*70)
    print("TESTING DATA QUALITY VALIDATORS")
    print("="*70)

    from data_aggregation.pipelines.common.data_quality import (
        LocationDataValidator,
        DataQualityReport,
    )

    tests_passed = True

    # Test location validation
    valid_location = {
        "id": "MCD_123",
        "ticker": "MCD",
        "n": "McDonald's",
        "a": "123 Main St",
        "lat": 40.0,
        "lng": -74.0,
        "s": 75
    }

    is_valid, error = LocationDataValidator.validate_location(valid_location)
    if is_valid:
        print("  ✓ LocationDataValidator accepts valid location")
    else:
        print(f"  ✗ LocationDataValidator rejected valid location: {error}")
        tests_passed = False

    # Test data quality report
    try:
        report = DataQualityReport("Test")
        report.add_check("test_check", True)
        report.add_summary("test_metric", 42)
        report_data = report.get_report()
        if report_data["status"] == "PASS":
            print("  ✓ DataQualityReport works correctly")
        else:
            print("  ✗ DataQualityReport status incorrect")
            tests_passed = False
    except Exception as e:
        print(f"  ✗ DataQualityReport error: {e}")
        tests_passed = False

    return tests_passed


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("DATA AGGREGATION PIPELINE TEST SUITE")
    print("="*70)

    results = {
        "Imports": test_imports(),
        "Configuration": test_configuration(),
        "Directory Structure": test_directory_structure(),
        "Ticker Synchronization": test_ticker_sync(),
        "Common Utilities": test_utilities(),
        "Data Quality": test_data_quality(),
    }

    # Print summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status}: {name}")

    print(f"\nOverall: {passed}/{total} test groups passed")
    print("="*70 + "\n")

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
