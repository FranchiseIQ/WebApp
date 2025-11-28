# Stock Data Storage

This directory contains CSV files for historical stock data to reduce API calls and improve performance.

## Data Strategy

### Daily Updated Stocks (franchise_stocks.csv)
**Updated:** Every trading day via GitHub Actions
**Purpose:** Pure franchisor universe we actively track

Includes:
- Core franchisor list (MCD, YUM, QSR, WEN, DPZ, JACK, WING, SHAK, DENN, DIN, DNUT, NATH, RRGB, DRVN, HRB, MCW, SERV, ROL, PLNT, BFT, TNL, MAR, HLT, H, CHH, WH, VAC, RENT, GNC, ADUS, LOPE, PLAY, ARCO, TAST)
- User-searched tickers (cached after first search)

### CSV Format

```csv
date,symbol,open,high,low,close,adjClose,volume
2024-01-01,MCD,150.23,152.45,149.80,151.90,151.50,2500000
2024-01-02,MCD,152.00,153.20,151.50,152.80,152.40,2600000
```

**Fields:**
- `date`: Trading date (YYYY-MM-DD)
- `symbol`: Stock ticker symbol
- `open`: Opening price
- `high`: Day's high price
- `low`: Day's low price
- `close`: Closing price
- `adjClose`: Adjusted closing price (accounts for splits/dividends)
- `volume`: Trading volume

## Data Loading Strategy

1. **Load historical data from CSV** (fast, no API calls)
2. **Fetch today's data from Yahoo Finance** (real-time, live prices)
3. **Merge data** for complete chart display

## Benefits

- **Reduced API Calls:** Historical data loaded from local CSV
- **Faster Loading:** CSV loads instantly vs multiple API requests
- **Offline Capability:** Historical data available without internet
- **Cost Savings:** Thousands of fewer API calls per day

## GitHub Actions Workflow

Daily workflow (`update-stock-data.yml`):
- Runs at 5:30 PM ET (after market close)
- Fetches latest data for all franchise stocks
- Updates CSV file
- Commits changes to repository
- Auto-deploys to GitHub Pages

## File Size Management

- CSV uses efficient format
- Data compressed via Git LFS if needed
- Old data (>2 years) can be archived
- Current estimated size: ~40MB for 34 stocks over 10 years
