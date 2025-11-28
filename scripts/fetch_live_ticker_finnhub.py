#!/usr/bin/env python3
"""
Fetch live stock ticker data from Finnhub API
Outputs to: data/live_ticker.json

This script fetches real-time stock quotes from Finnhub.io and saves them
in a format compatible with the stock ticker widget.
"""

import os
import json
import time
import requests
from datetime import datetime, timezone

# Ticker symbols (same as in ticker.js)
TICKER_SYMBOLS = [
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK",
    "DENN", "DIN", "DNUT", "NATH", "RRGB",
    "DRVN", "HRB", "MCW", "SERV", "ROL",
    "PLNT", "BFT",
    "MAR", "HLT", "H", "CHH", "WH", "VAC", "TNL",
    "RENT", "GNC",
    "ADUS", "LOPE",
    "PLAY", "ARCO",
    "TAST"
]

# Map Yahoo symbols to Finnhub symbols (none needed for pure franchisors)
SYMBOL_MAP = {}

# API Configuration
FINNHUB_API_KEY = os.environ.get('FINNHUB_API_KEY', '')
FINNHUB_BASE_URL = "https://finnhub.io/api/v1"

# Output file
OUTPUT_FILE = "data/live_ticker.json"

# US Stock Market Holidays (2024-2026)
# Source: NYSE/NASDAQ official holiday schedules
US_MARKET_HOLIDAYS = {
    # 2024
    "2024-01-01",  # New Year's Day
    "2024-01-15",  # Martin Luther King Jr. Day
    "2024-02-19",  # Presidents' Day
    "2024-03-29",  # Good Friday
    "2024-05-27",  # Memorial Day
    "2024-06-19",  # Juneteenth
    "2024-07-04",  # Independence Day
    "2024-09-02",  # Labor Day
    "2024-11-28",  # Thanksgiving Day
    "2024-12-25",  # Christmas Day

    # 2025
    "2025-01-01",  # New Year's Day
    "2025-01-20",  # Martin Luther King Jr. Day
    "2025-02-17",  # Presidents' Day
    "2025-04-18",  # Good Friday
    "2025-05-26",  # Memorial Day
    "2025-06-19",  # Juneteenth
    "2025-07-04",  # Independence Day
    "2025-09-01",  # Labor Day
    "2025-11-27",  # Thanksgiving Day
    "2025-12-25",  # Christmas Day

    # 2026
    "2026-01-01",  # New Year's Day
    "2026-01-19",  # Martin Luther King Jr. Day
    "2026-02-16",  # Presidents' Day
    "2026-04-03",  # Good Friday
    "2026-05-25",  # Memorial Day
    "2026-06-19",  # Juneteenth
    "2026-07-03",  # Independence Day (observed, July 4 is Saturday)
    "2026-09-07",  # Labor Day
    "2026-11-26",  # Thanksgiving Day
    "2026-12-25",  # Christmas Day
}


def is_market_holiday():
    """
    Check if today is a US market holiday

    Returns:
        bool: True if today is a market holiday
    """
    # Get current date in ET timezone
    from datetime import datetime
    import pytz

    try:
        et_tz = pytz.timezone('America/New_York')
        now_et = datetime.now(et_tz)
        today = now_et.strftime('%Y-%m-%d')

        if today in US_MARKET_HOLIDAYS:
            holiday_name = get_holiday_name(today)
            print(f"🏖️  Market is closed today for {holiday_name}")
            return True

        return False
    except ImportError:
        # If pytz is not available, use UTC date as fallback
        # This is less accurate but still works
        today = datetime.utcnow().strftime('%Y-%m-%d')
        return today in US_MARKET_HOLIDAYS


def get_holiday_name(date_str):
    """Get holiday name from date"""
    holiday_names = {
        "-01-01": "New Year's Day",
        "-01-15": "Martin Luther King Jr. Day",
        "-01-19": "Martin Luther King Jr. Day",
        "-01-20": "Martin Luther King Jr. Day",
        "-02-16": "Presidents' Day",
        "-02-17": "Presidents' Day",
        "-02-19": "Presidents' Day",
        "-03-29": "Good Friday",
        "-04-03": "Good Friday",
        "-04-18": "Good Friday",
        "-05-25": "Memorial Day",
        "-05-26": "Memorial Day",
        "-05-27": "Memorial Day",
        "-06-19": "Juneteenth",
        "-07-03": "Independence Day",
        "-07-04": "Independence Day",
        "-09-01": "Labor Day",
        "-09-02": "Labor Day",
        "-09-07": "Labor Day",
        "-11-26": "Thanksgiving Day",
        "-11-27": "Thanksgiving Day",
        "-11-28": "Thanksgiving Day",
        "-12-25": "Christmas Day",
    }

    for suffix, name in holiday_names.items():
        if date_str.endswith(suffix):
            return name

    return "Market Holiday"


def fetch_quote(symbol):
    """
    Fetch a single quote from Finnhub API

    Args:
        symbol: Stock symbol (e.g., "AAPL")

    Returns:
        dict: Quote data or None if failed
    """
    # Map Yahoo-style symbols to Finnhub symbols
    finnhub_symbol = SYMBOL_MAP.get(symbol, symbol)

    url = f"{FINNHUB_BASE_URL}/quote"
    params = {
        'symbol': finnhub_symbol,
        'token': FINNHUB_API_KEY
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        # Finnhub returns: c (current), h (high), l (low), o (open), pc (previous close), t (timestamp)
        if data.get('c') and data.get('c') > 0:
            current = data['c']
            prev_close = data.get('pc', current)

            # Calculate change
            change = current - prev_close
            change_percent = (change / prev_close * 100) if prev_close > 0 else 0

            return {
                'symbol': symbol,  # Use original symbol for consistency
                'price': round(current, 2),
                'change': round(change, 2),
                'changePercent': round(change_percent, 2),
                'isPositive': change > 0,
                'isNegative': change < 0,
                'high': round(data.get('h', current), 2),
                'low': round(data.get('l', current), 2),
                'open': round(data.get('o', current), 2),
                'previousClose': round(prev_close, 2),
                'timestamp': data.get('t', int(time.time())),
                'source': 'finnhub'
            }
        else:
            print(f"⚠️  {symbol}: No valid data returned")
            return None

    except requests.exceptions.RequestException as e:
        print(f"❌ {symbol}: Request failed - {e}")
        return None
    except Exception as e:
        print(f"❌ {symbol}: Unexpected error - {e}")
        return None


def fetch_all_quotes():
    """
    Fetch quotes for all symbols with rate limiting

    Returns:
        dict: All quotes keyed by symbol
    """
    quotes = {}
    total = len(TICKER_SYMBOLS)

    print(f"📊 Fetching {total} stock quotes from Finnhub...")
    print(f"⏰ Started at {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}")

    for i, symbol in enumerate(TICKER_SYMBOLS, 1):
        print(f"[{i}/{total}] Fetching {symbol}...", end=" ")

        quote = fetch_quote(symbol)

        if quote:
            quotes[symbol] = quote
            print(f"✓ ${quote['price']} ({quote['changePercent']:+.2f}%)")
        else:
            print("✗ Failed")

        # Rate limiting: Finnhub free tier allows 60 calls/minute
        # Sleep 1.1 seconds between calls to stay under limit (55 calls/minute)
        if i < total:
            time.sleep(1.1)

    print(f"\n✅ Successfully fetched {len(quotes)}/{total} quotes")
    return quotes


def save_quotes(quotes):
    """
    Save quotes to JSON file

    Args:
        quotes: Dictionary of quotes
    """
    # Ensure data directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    # Add metadata
    output = {
        'quotes': quotes,
        'fetchedAt': datetime.utcnow().isoformat() + 'Z',
        'count': len(quotes),
        'source': 'finnhub'
    }

    # Write to file
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\n💾 Saved {len(quotes)} quotes to {OUTPUT_FILE}")


def main():
    """Main execution"""
    if not FINNHUB_API_KEY:
        print("❌ Error: FINNHUB_API_KEY environment variable not set")
        print("Please set it in GitHub Secrets or export it locally")
        exit(1)

    print("=" * 60)
    print("📈 FINNHUB LIVE TICKER FETCHER")
    print("=" * 60)

    # Check if today is a market holiday
    if is_market_holiday():
        print("\n⏸️  Skipping API calls - market is closed for holiday")
        print("💡 No charges incurred, no actions used")
        print("\n" + "=" * 60)
        exit(0)

    # Fetch all quotes
    quotes = fetch_all_quotes()

    if not quotes:
        print("\n❌ Failed to fetch any quotes")
        exit(1)

    # Save to file
    save_quotes(quotes)

    print("\n" + "=" * 60)
    print("✅ DONE!")
    print("=" * 60)


if __name__ == '__main__':
    main()
