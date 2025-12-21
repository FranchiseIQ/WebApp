# Stock Market Data Pipeline

Centralized pipeline for collecting and managing stock market data including live quotes, historical prices, and current prices for frontend displays.

## Overview

This pipeline consists of three coordinated scripts that fetch and maintain stock data:

1. **update_historical_data.py** - Fetches historical OHLCV data from Yahoo Finance
2. **fetch_live_ticker.py** - Fetches real-time quotes from Finnhub API
3. **fetch_current_prices.py** - Fetches current prices for map widget display

## Critical: Ticker Synchronization

⚠️ **IMPORTANT**: All three scripts MUST maintain identical ticker lists!

### Master Ticker List

The authoritative ticker list is defined in `update_historical_data.py` (lines 33-50).

When adding new tickers:
1. Edit `FRANCHISE_STOCKS` in `update_historical_data.py`
2. Copy the updated list to `TICKER_SYMBOLS` in `fetch_live_ticker.py`
3. Copy the updated list to `TICKER_SYMBOLS` in `fetch_current_prices.py`
4. Run `sync_tickers.py` to verify synchronization
5. Update `STOCK_DATA_ARCHITECTURE.md` documentation

### Current Tickers (42 total)

- **Quick Service Restaurants (13)**: MCD, YUM, QSR, WEN, DPZ, JACK, WING, SHAK, DENN, DIN, DNUT, NATH, RRGB
- **Auto & Services (5)**: DRVN, HRB, MCW, SERV, ROL
- **Fitness & Recreation (3)**: PLNT, TNL, PLAY
- **Hospitality (6)**: MAR, HLT, H, CHH, WH, VAC
- **Retail & Other (5)**: RENT, ADUS, LOPE, ARCO, TAST
- **Market Indices (1)**: SPY
- **Historical (1)**: GNC

### Synchronization Verification

Run this command to verify synchronization:
```bash
python3 -m data_aggregation.pipelines.stocks.sync_tickers
```

Should output:
```
✅ ALL TICKER LISTS ARE SYNCHRONIZED!
   Total tickers: 42
```

## Scripts

### 1. update_historical_data.py

**Purpose**: Fetch and maintain historical stock data

**Data Source**: Yahoo Finance (yfinance library)

**Output**: `data/franchise_stocks.csv`

**Format**: CSV with columns:
- date (YYYY-MM-DD)
- symbol (stock ticker)
- open, high, low, close (prices)
- adjClose (adjusted close)
- volume

**Frequency**: Daily via `.github/workflows/update-stock-charts.yml` at 10:00 UTC (M-F)

**Run Locally**:
```bash
python3 -m data_aggregation.pipelines.stocks.update_historical_data
```

**Features**:
- Incremental updates (only fetches data since last run)
- Initial fetch includes 10 years of historical data
- Removes duplicate date/symbol combinations
- Preserves historical data for discontinued tickers

### 2. fetch_live_ticker.py

**Purpose**: Fetch real-time stock quotes for ticker display

**Data Source**: Finnhub API

**API Key**: `FINNHUB_API_KEY` (from GitHub Secrets: `FINNHUB`)

**Output**: `data/live_ticker.json`

**Format**: JSON with quotes keyed by symbol:
```json
{
  "quotes": {
    "MCD": {
      "symbol": "MCD",
      "price": 315.84,
      "change": 2.50,
      "changePercent": 0.80,
      "isPositive": true,
      "isNegative": false,
      "high": 316.50,
      "low": 313.00,
      "open": 313.34,
      "previousClose": 313.34,
      "timestamp": 1735689600,
      "source": "finnhub"
    }
  },
  "fetchedAt": "2025-12-20T15:30:00Z",
  "count": 42,
  "source": "finnhub"
}
```

**Frequency**: Hourly during market hours via `.github/workflows/update-stock-ticker.yml` (14:00-20:00 UTC, M-F)

**Run Locally**:
```bash
export FINNHUB_API_KEY="your_key_here"
python3 -m data_aggregation.pipelines.stocks.fetch_live_ticker
```

**Features**:
- Real-time quotes from Finnhub
- Rate limiting to stay under API limits (60 calls/minute)
- Skips execution on US market holidays
- Calculates change and change percent

**Market Holidays**:
- Automatically detects market holidays and skips API calls
- Covers holidays through 2026

### 3. fetch_current_prices.py

**Purpose**: Fetch current prices for FranchiseMap ticker widget

**Data Source**: Yahoo Finance (yfinance library)

**Output**: `FranchiseMap/data/stocks.json`

**Format**: JSON with current prices and metadata:
```json
[
  {
    "symbol": "MCD",
    "name": "McDonald's Corporation",
    "price": 315.84,
    "change": 2.50,
    "changePercent": 0.80,
    "marketCap": 232000000000,
    "lastUpdate": "2025-12-20T15:30:00Z"
  }
]
```

**Frequency**: Every 30 minutes during market hours via `.github/workflows/update-stocks.yml` (13:00-21:00 UTC, M-F)

**Run Locally**:
```bash
python3 -m data_aggregation.pipelines.stocks.fetch_current_prices
```

**Features**:
- Lightweight current price fetching
- Used by FranchiseMap for real-time ticker display
- Optimized for frequent updates (every 30 minutes)

## Environment Variables

### Required for GitHub Actions
- `FINNHUB_API_KEY` - API key from Finnhub (GitHub Secret: `FINNHUB`)

### Required for Local Development
```bash
export FINNHUB_API_KEY="your_finnhub_api_key"
```

## Output Files

| File | Script | Frequency | Format | Usage |
|------|--------|-----------|--------|-------|
| `data/franchise_stocks.csv` | update_historical_data | Daily | CSV | Historical data for stock charts |
| `data/live_ticker.json` | fetch_live_ticker | Hourly | JSON | Live ticker display |
| `FranchiseMap/data/stocks.json` | fetch_current_prices | 30 min | JSON | Map ticker widget |

## Usage in Frontend

### Stock Chart (StockChart/chart.js)
```javascript
// Loads from data/franchise_stocks.csv
// Uses historical data for candlestick charts
const historicalData = await fetch('/data/franchise_stocks.csv').then(r => r.text());
```

### Website Ticker (Website/ticker.js)
```javascript
// Loads from data/live_ticker.json
// Falls back to CSV if live data unavailable
const liveTicker = await fetch('/data/live_ticker.json').then(r => r.json());
```

### FranchiseMap Ticker (FranchiseMap/js/ticker.js)
```javascript
// Loads from FranchiseMap/data/stocks.json
// Updates every 5 minutes
const mapTicker = await fetch('data/stocks.json').then(r => r.json());
```

## Adding New Tickers

1. **Update Master List**:
   ```python
   # In update_historical_data.py, line 33:
   FRANCHISE_STOCKS = [
       # ... existing tickers ...
       "NEWTICKER",
   ]
   ```

2. **Sync Other Scripts**:
   - Copy updated `FRANCHISE_STOCKS` to `fetch_live_ticker.py` as `TICKER_SYMBOLS`
   - Copy to `fetch_current_prices.py` as `TICKER_SYMBOLS`

3. **Verify Synchronization**:
   ```bash
   python3 -m data_aggregation.pipelines.stocks.sync_tickers
   ```

4. **Test Locally**:
   ```bash
   python3 -m data_aggregation.pipelines.stocks.update_historical_data
   python3 -m data_aggregation.pipelines.stocks.fetch_live_ticker
   python3 -m data_aggregation.pipelines.stocks.fetch_current_prices
   ```

5. **Update Documentation**:
   - Update ticker count in `STOCK_DATA_ARCHITECTURE.md`
   - Update ticker list section

## Troubleshooting

### Ticker Sync Errors
```bash
❌ TICKER LISTS ARE OUT OF SYNC!
```
**Solution**: Run sync_tickers.py to see which lists don't match, then update the out-of-sync files.

### Finnhub API Key Issues
```bash
❌ Error: FINNHUB_API_KEY environment variable not set
```
**Solution**:
- For GitHub Actions: Add `FINNHUB` secret in repository settings
- For local: `export FINNHUB_API_KEY="your_key_here"`

### No Data Returned
```bash
⚠️  Symbol: No valid data returned
```
**Possible causes**:
- Ticker symbol doesn't exist
- API rate limit exceeded
- API service temporarily unavailable

### Output Files Empty
**Solution**: Verify API keys are correct and scripts ran without errors. Check GitHub Actions logs if running via automation.

## Related Files

- `STOCK_DATA_ARCHITECTURE.md` - Comprehensive documentation
- `.github/workflows/update-stock-charts.yml` - Historical data workflow
- `.github/workflows/update-stock-ticker.yml` - Live ticker workflow
- `.github/workflows/update-stocks.yml` - Current prices workflow

## Testing

### Unit Test Synchronization
```bash
python3 -m data_aggregation.pipelines.stocks.sync_tickers
```

### Integration Test (All Scripts)
```bash
# Set API key
export FINNHUB_API_KEY="test_key"

# Run historical update
python3 -m data_aggregation.pipelines.stocks.update_historical_data

# Run live ticker fetch
python3 -m data_aggregation.pipelines.stocks.fetch_live_ticker

# Run current prices fetch
python3 -m data_aggregation.pipelines.stocks.fetch_current_prices

# Verify output files
ls -lh data/franchise_stocks.csv
ls -lh data/live_ticker.json
ls -lh FranchiseMap/data/stocks.json
```
