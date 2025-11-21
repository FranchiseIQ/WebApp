#!/usr/bin/env python3
"""
Update Franchise Stock Data
Fetches latest stock data for franchise companies and market indices.
Updates the CSV file with new data while preserving historical records.
"""

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta
import os
import sys

# Franchise stock symbols
FRANCHISE_STOCKS = [
    # Market Indices
    "^GSPC", "^IXIC", "^DJI",

    # Quick Service & Restaurants
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK", "CAVA",
    "DENN", "DIN", "DNUT", "NATH", "RRGB",

    # Auto & Services
    "DRVN", "HRB", "CAR", "UHAL",

    # Fitness
    "PLNT", "BFT",

    # Hospitality
    "MAR", "HLT", "H", "CHH", "WH", "IHG", "VAC", "TNL", "CWH",

    # Retail & Other
    "GNC", "RENT", "SERV", "ROL", "ADUS", "LOPE", "PLAY", "ARCO", "TAST"
]

CSV_FILE = "data/franchise_stocks.csv"


def fetch_stock_data(symbol, start_date, end_date):
    """Fetch historical stock data for a symbol."""
    try:
        ticker = yf.Ticker(symbol)
        df = ticker.history(start=start_date, end=end_date)

        if df.empty:
            print(f"Warning: No data returned for {symbol}")
            return None

        # Reset index to make Date a column
        df = df.reset_index()

        # Rename columns to match our CSV format
        df = df.rename(columns={
            'Date': 'date',
            'Open': 'open',
            'High': 'high',
            'Low': 'low',
            'Close': 'close',
            'Volume': 'volume'
        })

        # Add adjusted close (yfinance already adjusts Close for splits/dividends)
        df['adjClose'] = df['close']

        # Add symbol column
        df['symbol'] = symbol

        # Select only the columns we need
        df = df[['date', 'symbol', 'open', 'high', 'low', 'close', 'adjClose', 'volume']]

        # Convert date to string format
        df['date'] = df['date'].dt.strftime('%Y-%m-%d')

        print(f"✓ Fetched {len(df)} records for {symbol}")
        return df

    except Exception as e:
        print(f"✗ Error fetching data for {symbol}: {e}")
        return None


def main():
    print("=" * 70)
    print("Updating Franchise Stock Data")
    print("=" * 70)

    # Determine date range
    # If CSV exists, fetch data from last date + 1 day
    # Otherwise, fetch last 10 years of data

    if os.path.exists(CSV_FILE):
        print(f"\nExisting CSV found: {CSV_FILE}")
        existing_df = pd.read_csv(CSV_FILE)

        # Get the latest date in the CSV
        latest_date = pd.to_datetime(existing_df['date']).max()
        start_date = latest_date + timedelta(days=1)
        end_date = datetime.now()

        print(f"Fetching new data from {start_date.date()} to {end_date.date()}")

        # Check if we need to update
        if start_date.date() >= end_date.date():
            print("\n✓ CSV is already up to date!")
            sys.exit(0)
    else:
        print(f"\nNo existing CSV found. Creating new file: {CSV_FILE}")
        existing_df = None

        # Fetch last 10 years of data
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 10)

        print(f"Fetching 10 years of historical data from {start_date.date()} to {end_date.date()}")

    # Fetch data for all symbols
    all_data = []

    print(f"\nFetching data for {len(FRANCHISE_STOCKS)} stocks...")
    print("-" * 70)

    for symbol in FRANCHISE_STOCKS:
        df = fetch_stock_data(symbol, start_date, end_date)
        if df is not None and not df.empty:
            all_data.append(df)

    print("-" * 70)

    if not all_data:
        print("\n✗ No new data fetched. Exiting.")
        sys.exit(1)

    # Combine all new data
    new_df = pd.concat(all_data, ignore_index=True)

    # Merge with existing data if it exists
    if existing_df is not None:
        combined_df = pd.concat([existing_df, new_df], ignore_index=True)

        # Remove duplicates (keep latest)
        combined_df = combined_df.drop_duplicates(subset=['date', 'symbol'], keep='last')

        # Sort by date and symbol
        combined_df = combined_df.sort_values(['date', 'symbol'])
    else:
        combined_df = new_df.sort_values(['date', 'symbol'])

    # Create data directory if it doesn't exist
    os.makedirs('data', exist_ok=True)

    # Save to CSV
    combined_df.to_csv(CSV_FILE, index=False)

    print(f"\n✓ Successfully updated {CSV_FILE}")
    print(f"Total records: {len(combined_df)}")
    print(f"Date range: {combined_df['date'].min()} to {combined_df['date'].max()}")
    print(f"Stocks: {combined_df['symbol'].nunique()}")
    print("=" * 70)


if __name__ == "__main__":
    main()
