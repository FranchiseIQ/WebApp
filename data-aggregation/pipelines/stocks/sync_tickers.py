#!/usr/bin/env python3
"""
Stock Ticker Synchronization Utility

Verifies that all stock ticker lists across the system are synchronized.
This is CRITICAL because multiple scripts reference the master ticker list
and must stay in sync.

Run this script to verify synchronization:
    python3 -m data_aggregation.pipelines.stocks.sync_tickers

Exit code 0 = All lists synchronized
Exit code 1 = Synchronization error found
"""

import sys
from pathlib import Path

# Add repo root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.pipelines.stocks.update_historical_data import FRANCHISE_STOCKS as HISTORICAL_STOCKS
from data_aggregation.pipelines.stocks.fetch_live_ticker import TICKER_SYMBOLS as LIVE_TICKER_SYMBOLS
from data_aggregation.pipelines.stocks.fetch_current_prices import TICKER_SYMBOLS as MAP_TICKER_SYMBOLS


def sync_check():
    """
    Verify all ticker lists are synchronized.

    Returns:
        tuple: (success: bool, errors: list[str])
    """
    errors = []

    # Check 1: Historical vs Live Ticker
    historical_set = set(HISTORICAL_STOCKS)
    live_set = set(LIVE_TICKER_SYMBOLS)
    map_set = set(MAP_TICKER_SYMBOLS)

    if historical_set != live_set:
        missing_in_live = historical_set - live_set
        extra_in_live = live_set - historical_set

        if missing_in_live:
            errors.append(
                f"Missing in fetch_live_ticker.py: {sorted(missing_in_live)}"
            )

        if extra_in_live:
            errors.append(
                f"Extra in fetch_live_ticker.py: {sorted(extra_in_live)}"
            )

    # Check 2: Historical vs Map Ticker
    if historical_set != map_set:
        missing_in_map = historical_set - map_set
        extra_in_map = map_set - historical_set

        if missing_in_map:
            errors.append(
                f"Missing in fetch_current_prices.py: {sorted(missing_in_map)}"
            )

        if extra_in_map:
            errors.append(
                f"Extra in fetch_current_prices.py: {sorted(extra_in_map)}"
            )

    # Check 3: Verify no duplicates
    if len(HISTORICAL_STOCKS) != len(set(HISTORICAL_STOCKS)):
        duplicates = [t for t in HISTORICAL_STOCKS if HISTORICAL_STOCKS.count(t) > 1]
        errors.append(f"Duplicates in FRANCHISE_STOCKS: {set(duplicates)}")

    if len(LIVE_TICKER_SYMBOLS) != len(set(LIVE_TICKER_SYMBOLS)):
        duplicates = [t for t in LIVE_TICKER_SYMBOLS if LIVE_TICKER_SYMBOLS.count(t) > 1]
        errors.append(f"Duplicates in TICKER_SYMBOLS (live): {set(duplicates)}")

    if len(MAP_TICKER_SYMBOLS) != len(set(MAP_TICKER_SYMBOLS)):
        duplicates = [t for t in MAP_TICKER_SYMBOLS if MAP_TICKER_SYMBOLS.count(t) > 1]
        errors.append(f"Duplicates in TICKER_SYMBOLS (map): {set(duplicates)}")

    success = len(errors) == 0
    return success, errors


def print_results(success, errors):
    """Print synchronization results."""
    print("=" * 70)
    print("STOCK TICKER SYNCHRONIZATION CHECK")
    print("=" * 70)
    print()

    if success:
        print("✅ ALL TICKER LISTS ARE SYNCHRONIZED!")
        print()
        print(f"   Total tickers: {len(HISTORICAL_STOCKS)}")
        print(f"   Verified in: update_historical_data.py (MASTER)")
        print(f"   Verified in: fetch_live_ticker.py")
        print(f"   Verified in: fetch_current_prices.py")
        print()
        return 0

    else:
        print("❌ TICKER LISTS ARE OUT OF SYNC!")
        print()
        print("Errors found:")
        for i, error in enumerate(errors, 1):
            print(f"  {i}. {error}")
        print()
        print("HOW TO FIX:")
        print("  1. Edit the master list in: update_historical_data.py (FRANCHISE_STOCKS)")
        print("  2. Copy FRANCHISE_STOCKS to fetch_live_ticker.py as TICKER_SYMBOLS")
        print("  3. Copy FRANCHISE_STOCKS to fetch_current_prices.py as TICKER_SYMBOLS")
        print("  4. Run this script again to verify: python3 -m data_aggregation.pipelines.stocks.sync_tickers")
        print()
        print("CRITICAL: These ticker lists MUST be identical:")
        print("  - data-aggregation/pipelines/stocks/update_historical_data.py (MASTER)")
        print("  - data-aggregation/pipelines/stocks/fetch_live_ticker.py")
        print("  - data-aggregation/pipelines/stocks/fetch_current_prices.py")
        print()
        print("Also update documentation:")
        print("  - data-aggregation/pipelines/stocks/README.md (ticker count)")
        print("  - STOCK_DATA_ARCHITECTURE.md (if exists)")
        print()
        return 1


def main():
    """Main execution."""
    success, errors = sync_check()
    exit_code = print_results(success, errors)
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
