#!/usr/bin/env python3
"""
Fetch Current Stock Prices for FranchiseMap Ticker Widget

Fetches current prices for all franchise stock tickers and outputs to JSON.
This lightweight script runs frequently (every 30 minutes) to keep the map
ticker widget up-to-date with current price information.

Data Source: Yahoo Finance (yfinance library)
Output: FranchiseMap/data/stocks.json

Note: Removed tickers like GNC, TAST (no longer public) are kept in
update_historical_data.py for historical data preservation.
"""

import sys
import json
from pathlib import Path
from datetime import datetime
import yfinance as yf

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import MAP_STOCKS_JSON

# ============================================================================
# TICKER SYMBOLS - MUST SYNCHRONIZE WITH MASTER LIST
# ============================================================================
# CRITICAL: This list MUST match FRANCHISE_STOCKS in update_historical_data.py
# AND match TICKER_SYMBOLS in fetch_live_ticker.py
#
# If you update this list:
#   1. First update FRANCHISE_STOCKS in update_historical_data.py (MASTER)
#   2. Then copy to TICKER_SYMBOLS in fetch_live_ticker.py
#   3. Then copy to TICKER_SYMBOLS here
#   4. Run sync_tickers.py to verify synchronization
#
# Run this to verify: python3 -m data_aggregation.pipelines.stocks.sync_tickers
# ============================================================================

TICKER_SYMBOLS = [
    # Quick Service & Restaurants
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK",
    "DENN", "DIN", "DNUT", "NATH", "RRGB",

    # Auto & Services
    "DRVN", "HRB", "MCW", "SERV", "ROL",

    # Fitness & Recreation
    "PLNT", "TNL", "PLAY",

    # Hospitality
    "MAR", "HLT", "H", "CHH", "WH", "VAC",

    # Retail & Other
    "RENT", "ADUS", "LOPE", "ARCO", "TAST",

    # Market index/benchmark (for charts)
    "SPY",

    # Additional relevant tickers (may be dead but kept for historical data)
    "GNC"
]


def fetch_stock_data():
    """Fetch current stock data for all tickers."""
    print(f"Fetching data for {len(TICKER_SYMBOLS)} tickers...")

    results = {}
    errors = []

    for symbol in TICKER_SYMBOLS:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            # Get current price
            current_price = info.get('currentPrice') or info.get('regularMarketPrice')
            previous_close = info.get('previousClose') or info.get('regularMarketPreviousClose')

            if current_price is None:
                # Try getting from history
                hist = ticker.history(period="1d")
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]

            if current_price is not None:
                # Calculate change
                change = 0
                change_percent = 0
                if previous_close and previous_close > 0:
                    change = current_price - previous_close
                    change_percent = (change / previous_close) * 100

                results[symbol] = {
                    "symbol": symbol,
                    "price": round(current_price, 2),
                    "previousClose": round(previous_close, 2) if previous_close else None,
                    "change": round(change, 2),
                    "changePercent": round(change_percent, 2),
                    "name": info.get('shortName', symbol),
                    "marketCap": info.get('marketCap'),
                    "volume": info.get('volume'),
                }
                print(f"  ✓ {symbol}: ${current_price:.2f} ({change_percent:+.2f}%)")
            else:
                errors.append(symbol)
                print(f"  ✗ {symbol}: No price data")

        except Exception as e:
            errors.append(symbol)
            print(f"  ✗ {symbol}: Error - {str(e)[:50]}")

    return results, errors


def main():
    print("=" * 70)
    print("Fetching Current Stock Prices for FranchiseMap Ticker Widget")
    print("=" * 70)
    print()

    # Fetch data
    stock_data, errors = fetch_stock_data()

    # Build output
    output = {
        "fetchedAt": datetime.utcnow().isoformat() + "Z",
        "totalSymbols": len(TICKER_SYMBOLS),
        "successCount": len(stock_data),
        "errorCount": len(errors),
        "errors": errors,
        "quotes": stock_data
    }

    # Ensure output directory exists
    MAP_STOCKS_JSON.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON
    with open(MAP_STOCKS_JSON, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n{'='*70}")
    print(f"✓ Stock data saved to: {MAP_STOCKS_JSON}")
    print(f"Success: {len(stock_data)}/{len(TICKER_SYMBOLS)} tickers")
    if errors:
        print(f"Errors: {', '.join(errors)}")
    print("=" * 70)


if __name__ == "__main__":
    main()
