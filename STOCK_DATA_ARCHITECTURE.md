# Centralized Stock Data Architecture

## Overview

This document describes the unified stock data pipeline for the WebApp. All stock data originates from a single, centralized list of tickers defined in Python scripts. This ensures consistency across the entire application.

## Single Source of Truth

### Central Ticker List
The definitive list of stock tickers is defined in:
- **`scripts/update_franchise_stocks.py`** (lines 17-39) - MASTER DEFINITION

This list includes:
- All active franchise company stocks
- Market indices (SPY)
- Dead/delisted stocks (kept for historical data: GNC, TAST)

**When you need to add a new ticker:**
1. Add it to `FRANCHISE_STOCKS` in `scripts/update_franchise_stocks.py`
2. Update `TICKER_SYMBOLS` in `scripts/fetch_live_ticker_finnhub.py`
3. Update `TICKER_SYMBOLS` in `FranchiseMap/scripts/fetch_stocks.py`
4. The frontend JavaScript lists will automatically sync with these Python scripts

### Current Ticker List

```
Quick Service & Restaurants:
  MCD, YUM, QSR, WEN, DPZ, JACK, WING, SHAK, DENN, DIN, DNUT, NATH, RRGB

Auto & Services:
  DRVN, HRB, MCW, SERV, ROL

Fitness & Recreation:
  PLNT, TNL, PLAY

Hospitality:
  MAR, HLT, H, CHH, WH, VAC

Retail & Other:
  RENT, ADUS, LOPE, ARCO, TAST

Market Indices:
  SPY (S&P 500, used in charts as benchmark)

Historical (Dead but kept):
  GNC
```

## Data Pipeline

### 1. Update Scripts (Fetch from APIs)

Three Python scripts fetch data from external APIs and generate different datasets:

#### A. `scripts/update_franchise_stocks.py`
- **Source:** Yahoo Finance (yfinance)
- **Output:** `data/franchise_stocks.csv`
- **Frequency:** Once daily via `update-stock-charts.yml` GitHub Action
- **Data Type:** OHLCV (Open, High, Low, Close, Volume) - Historical
- **Update Method:** Incremental (appends new data since last run)
- **Use Case:** Historical price data for the Stock Chart widget
- **Command:** `python3 scripts/update_franchise_stocks.py`

#### B. `scripts/fetch_live_ticker_finnhub.py`
- **Source:** Finnhub API
- **Output:** `data/live_ticker.json`
- **Frequency:** Hourly during market hours via `update-stock-ticker.yml` GitHub Action
- **Data Type:** Current quotes with change percent
- **Use Case:** Live ticker display on Website (ticker.html, ticker.js)
- **Command:** `python3 scripts/fetch_live_ticker_finnhub.py`
- **Requirement:** `FINNHUB_API_KEY` environment variable in GitHub Secrets

#### C. `FranchiseMap/scripts/fetch_stocks.py`
- **Source:** Yahoo Finance (yfinance)
- **Output:** `FranchiseMap/data/stocks.json`
- **Frequency:** Every 30 minutes during market hours via `update-stocks.yml` GitHub Action
- **Data Type:** Current quotes with price, change, market cap
- **Use Case:** Current price data for FranchiseMap ticker widget
- **Command:** `python3 FranchiseMap/scripts/fetch_stocks.py`

### 2. Data Files (Single Source of Truth per Type)

| File | Script | Frequency | Purpose | Consumer |
|------|--------|-----------|---------|----------|
| `data/franchise_stocks.csv` | update_franchise_stocks.py | Daily | Historical OHLCV data | StockChart (chart.js) |
| `data/live_ticker.json` | fetch_live_ticker_finnhub.py | Hourly | Live quotes from Finnhub | Website ticker (ticker.js) |
| `FranchiseMap/data/stocks.json` | FranchiseMap/scripts/fetch_stocks.py | 30 min | Current prices (with market cap) | FranchiseMap ticker |

### 3. Frontend Consumers (Read-Only)

All frontend code READS from the data files, doesn't fetch directly from APIs.

#### A. Stock Chart Widget (`StockChart/chart.js`)
- **Primary Data:** `data/franchise_stocks.csv` (historical)
- **Fallback:** Stooq API (for missing data)
- **Tickers:** SPY + 9 top franchise stocks (configurable in DEFAULT_STOCKS)
- **How it Works:**
  1. Loads CSV on page load
  2. Extracts OHLCV data for each symbol
  3. Renders candlestick chart with user-selected indicators
  4. Allows adding/removing stocks up to MAX_TICKERS (10)

#### B. Website Ticker (`Website/ticker.js`)
- **Primary Data:** `data/live_ticker.json` (from Finnhub)
- **Fallback 1:** Yahoo Finance API (CORS proxy)
- **Fallback 2:** `data/franchise_stocks.csv` (latest prices)
- **How it Works:**
  1. Tries to load live_ticker.json
  2. If that fails, falls back to Yahoo Finance API
  3. If market is closed, uses CSV data from last trading day
  4. Updates every 1 hour
  5. Shows scrolling ticker of all symbols (displays top by market cap)

#### C. FranchiseMap Ticker (`FranchiseMap/js/ticker.js`)
- **Primary Data:** `FranchiseMap/data/stocks.json`
- **How it Works:**
  1. Loads stocks.json on page load
  2. Displays top 15 stocks by market cap in scrolling ticker
  3. Updates every 5 minutes (reloads the JSON)
  4. Shows current prices and % change

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    External APIs                                │
│  Yahoo Finance (yfinance) │ Finnhub API                         │
└────┬──────────────────────┬────────────────────────┬────────────┘
     │                      │                        │
     ▼                      ▼                        ▼
┌─────────────────┐  ┌──────────────────────┐  ┌─────────────┐
│update_franchise │  │fetch_live_ticker_    │  │fetch_stocks │
│_stocks.py       │  │finnhub.py            │  │.py          │
└────────┬────────┘  └──────────┬───────────┘  └─────────┬───┘
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│franchise_stocks  │  │live_ticker.json      │  │FranchiseMap/    │
│.csv              │  │                      │  │data/stocks.json │
│(OHLCV, daily)    │  │(Quotes, hourly)      │  │(Quotes, 30min)  │
└────────┬─────────┘  └──────────┬───────────┘  └────────┬────────┘
         │                       │                       │
         ▼                       ▼                       ▼
    ┌─────────────────────────────────────────────────────────┐
    │            Frontend: Read-Only Consumers                 │
    ├─────────────────────────────────────────────────────────┤
    │                                                          │
    │  StockChart/chart.js      Website/ticker.js             │
    │  (Loads CSV,              (Loads live_ticker.json,      │
    │   displays history)        displays live quotes)         │
    │                                                          │
    │                FranchiseMap/js/ticker.js               │
    │                (Loads stocks.json,                      │
    │                 displays current prices)                │
    └─────────────────────────────────────────────────────────┘
```

## GitHub Actions

Three workflows manage the update pipeline:

### 1. `update-stock-charts.yml`
- **Schedule:** Daily at 10:00 UTC (5 AM ET) on weekdays
- **Script:** `scripts/update_franchise_stocks.py`
- **Output:** `data/franchise_stocks.csv`
- **Purpose:** Keep historical data current for chart widget

### 2. `update-stock-ticker.yml`
- **Schedule:** Hourly (9 AM - 4 PM ET) on weekdays
- **Script:** `scripts/fetch_live_ticker_finnhub.py`
- **Output:** `data/live_ticker.json`
- **Purpose:** Keep Website ticker updated with live prices
- **Requires:** `FINNHUB_API_KEY` secret

### 3. `update-stocks.yml`
- **Schedule:** Every 30 minutes (9:30 AM - 4:30 PM ET) on weekdays
- **Script:** `FranchiseMap/scripts/fetch_stocks.py`
- **Output:** `FranchiseMap/data/stocks.json`
- **Purpose:** Keep FranchiseMap ticker updated with current prices

## Adding a New Ticker

### Step 1: Update the Central List
Edit `scripts/update_franchise_stocks.py` and add the ticker to `FRANCHISE_STOCKS`:

```python
FRANCHISE_STOCKS = [
    # Quick Service & Restaurants
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK",
    # ... existing tickers ...
    "NEW_TICKER",  # Add here in appropriate category
]
```

### Step 2: Sync Other Scripts
Update the same ticker list in:
- `scripts/fetch_live_ticker_finnhub.py` (TICKER_SYMBOLS)
- `FranchiseMap/scripts/fetch_stocks.py` (TICKER_SYMBOLS)

### Step 3: Sync Frontend
Update the same ticker list in:
- `Website/ticker.js` (TICKER_SYMBOLS)
- `StockChart/chart.js` (comment/documentation)

### Step 4: Test (Optional)
Run the update scripts manually to populate the data files:
```bash
python3 scripts/update_franchise_stocks.py
python3 scripts/fetch_live_ticker_finnhub.py
python3 FranchiseMap/scripts/fetch_stocks.py
```

GitHub Actions will pick it up on the next scheduled run.

## Architecture Principles

1. **Single Source of Truth**: Ticker list is defined once in Python scripts
2. **Decoupled Updates**: Each script updates independently at different frequencies
3. **Incremental Updates**: CSV uses incremental updates to avoid refetching all history
4. **Fallback Strategy**: Frontend has fallbacks if primary data source fails
5. **No Backend API**: Data is served as static files, not through an API
6. **Market-Aware**: Finnhub script skips US market holidays automatically
7. **Historical Preservation**: Dead tickers are kept for historical data analysis

## Troubleshooting

### Why isn't my new ticker appearing?
1. Check if it's in `FRANCHISE_STOCKS` in `scripts/update_franchise_stocks.py`
2. Verify it's also in `scripts/fetch_live_ticker_finnhub.py` and `FranchiseMap/scripts/fetch_stocks.py`
3. Run the update scripts manually to generate data
4. Check if the ticker exists on Yahoo Finance (valid symbol)

### Website ticker shows old data?
- The live_ticker.json is updated hourly
- During market hours, it comes from Finnhub API
- After hours, it falls back to CSV (closing prices)
- Wait for the next hourly update or run the script manually

### Stock Chart missing historical data?
- Historical data is updated once daily
- Only 10 years of history is fetched initially (see update_franchise_stocks.py line 109)
- Try adding the ticker manually to the chart and it will attempt to fetch from Stooq

## Dependencies

- `yfinance` - for Yahoo Finance data
- `pandas` - for CSV handling
- `requests` - for Finnhub API calls
- Finnhub API key (stored in GitHub Secrets as `FINNHUB_API_KEY`)
