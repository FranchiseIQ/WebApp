#!/usr/bin/env python3
"""
Fetch stock data for franchise tickers using yfinance.
Removes dead tickers (GNC, TAST) and outputs to data/stocks.json
"""

import json
import os
from datetime import datetime
import yfinance as yf

# Active franchise stock tickers (removed GNC, TAST - no longer public)
TICKER_SYMBOLS = [
    # QSR
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK", "CMG", "SBUX", "PZZA",
    "DNUT", "NATH",
    # Casual Dining
    "DENN", "DIN", "RRGB", "TXRH", "CAKE", "DRI", "EAT", "BLMN", "PLAY",
    # Hotels
    "MAR", "HLT", "H", "CHH", "WH", "IHG", "VAC", "TNL",
    # Services (Roark public: DRVN)
    "DRVN", "HRB", "MCW", "SERV", "ROL",
    # Fitness
    "PLNT", "XPOF",
    # Other
    "ARCO", "ADUS", "LOPE"
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
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "../data/stocks.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write JSON
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\n{'='*50}")
    print(f"Stock data saved to: {output_path}")
    print(f"Success: {len(stock_data)}/{len(TICKER_SYMBOLS)} tickers")
    if errors:
        print(f"Errors: {', '.join(errors)}")

if __name__ == "__main__":
    main()
