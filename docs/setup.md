# FranResearch Setup Guide

Complete setup instructions for the FranResearch stock analysis platform.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Project Structure](#project-structure)
3. [API Configuration](#api-configuration)
4. [GitHub Actions Setup](#github-actions-setup)
5. [Modules Overview](#modules-overview)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- GitHub account with repository access
- Node.js (optional, for local development)
- Python 3.11+ (for data scripts)

### Deployment

The site deploys automatically via GitHub Pages. Simply push changes to your branch and they'll be live within 2-5 minutes.

**Live Site:** https://monroegamble.github.io/WebApp/

---

## Project Structure

```
WebApp/
├── index.html              # Main landing page
├── about.html              # About page with contact form
├── sports.html             # Live sports dashboard
├── Website/                # Stock ticker module
│   ├── ticker.html
│   ├── ticker.js
│   └── style.css
├── StockChart/             # Interactive charting
│   ├── chart.html
│   ├── chart.js
│   └── style.css
├── FranchiseMap/           # Geographic visualization
│   ├── map.html
│   ├── map.js
│   └── map-style.css
├── FranchiseNews/          # News feed widgets
│   ├── news-feed.html
│   ├── newsService.js
│   └── news-widget.js
├── franchise_calculators_module/  # Financial calculators
├── data/                   # CSV data files
│   ├── franchise_stocks.csv
│   └── live_ticker.json
├── scripts/                # Python data scripts
│   ├── update_franchise_stocks.py
│   └── fetch_live_ticker_finnhub.py
└── .github/workflows/      # Automated workflows
    ├── update-stock-data.yml
    ├── update-live-ticker.yml
    └── update-sports-scores.yml
```

---

## API Configuration

### Finnhub API (Stock Quotes)

The stock ticker uses Finnhub for real-time quotes.

**Setup:**

1. Go to repository Settings > Secrets and variables > Actions
2. Add new secret:
   - **Name:** `FINNHUB_API_KEY`
   - **Value:** Your Finnhub API key from [finnhub.io](https://finnhub.io)

3. Trigger the workflow manually to test

**Rate Limits (Free Tier):**
- 60 API calls/minute
- Unlimited monthly calls

### TheSportsDB API (Sports Scores)

The sports dashboard uses TheSportsDB (free tier, no API key required).

**Endpoint:** `https://www.thesportsdb.com/api/v1/json/3/`

**Supported Leagues:**
- NFL, NBA, WNBA, NHL, MLB, MLS

### OpenStreetMap (Maps)

The franchise map uses OpenStreetMap/Nominatim (free, no API key required).

**Tile Server:** `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

**Geocoding:** Nominatim API for location search

---

## GitHub Actions Setup

### 1. Enable Workflow Permissions

1. Go to Settings > Actions > General
2. Under "Workflow permissions", select **Read and write permissions**
3. Click Save

### 2. Available Workflows

| Workflow | Schedule | Purpose |
|----------|----------|---------|
| Update Stock Data | Daily 5:30 PM ET | Updates historical CSV |
| Update Live Ticker | Hourly 9AM-4PM ET | Fetches real-time quotes |
| Update Sports Scores | Twice daily | Fetches live scores |

### 3. First-Time Run

Run each workflow manually once to initialize data:

1. Go to Actions tab
2. Select the workflow
3. Click "Run workflow"
4. Wait for completion

### 4. Verify Data Files

After workflows complete, verify:

- `data/franchise_stocks.csv` - Historical stock data
- `data/live_ticker.json` - Real-time quotes
- `data/sports_scores.json` - Sports scores (if applicable)

---

## Modules Overview

### Stock Ticker (`Website/`)

Real-time scrolling ticker with 40+ franchise stocks.

**Features:**
- Live price updates via Finnhub API
- Market status indicator (open/closed)
- Color-coded price changes (green/red)
- Auto-refresh during market hours

### Stock Charts (`StockChart/`)

Interactive charting with Chart.js.

**Features:**
- 10+ years of historical data
- Up to 10 simultaneous tickers
- Zoom/pan controls
- Percent-change comparison mode
- Historical data table

### Franchise Map (`FranchiseMap/`)

Geographic visualization with Leaflet.

**Features:**
- Interactive markers for franchise locations
- Brand filtering dropdown
- Location search (Nominatim geocoding)
- Radius filter for nearby locations

### News Feed (`FranchiseNews/`)

Curated franchise industry news.

**Features:**
- Vertical scroller widget
- Horizontal ticker widget
- Category filtering
- Auto-scrolling with pause-on-hover

### Sports Dashboard (`sports.html`)

Live scores for major sports leagues.

**Features:**
- League tabs (NFL, NBA, WNBA, NHL, MLS, MLB)
- 7-day date selector
- Franchisor team filter
- 12-hour EST time format
- Auto-refresh every 60 seconds

### Financial Calculators (`franchise_calculators_module/`)

Investment analysis tools.

**Features:**
- ROI calculator
- Loan amortization
- Payback period calculator

---

## Troubleshooting

### Workflow Fails: "Permission denied"

**Solution:** Enable write permissions for Actions (see GitHub Actions Setup above).

### Workflow Fails: "API key not set"

**Solution:** Add the FINNHUB_API_KEY secret to repository settings.

### Charts Show "Loading..." Forever

**Check:**
1. Browser console for errors (F12)
2. Verify CSV file exists in `data/` folder
3. Hard refresh the page (Ctrl+Shift+R)

### Map Doesn't Load

**Check:**
1. Browser console for JavaScript errors
2. Verify Leaflet library is loading
3. Check internet connection for tile server

### News Feed Empty

**Check:**
1. Verify `data/franchise_news.json` exists
2. Check newsService.js for fetch errors
3. Review browser console for API errors

### Sports Dashboard Empty

**Check:**
1. TheSportsDB API may be rate-limited
2. Try a different league tab
3. Check if games are scheduled for selected date

---

## Embedding Widgets

All widgets can be embedded via iframe:

### Stock Ticker
```html
<iframe src="https://monroegamble.github.io/WebApp/Website/ticker.html"
        width="100%" height="120" frameborder="0"></iframe>
```

### Stock Charts
```html
<iframe src="https://monroegamble.github.io/WebApp/StockChart/chart.html"
        width="100%" height="700" frameborder="0"></iframe>
```

### Franchise Map
```html
<iframe src="https://monroegamble.github.io/WebApp/FranchiseMap/map.html"
        width="100%" height="600" frameborder="0"></iframe>
```

### News Feed
```html
<iframe src="https://monroegamble.github.io/WebApp/FranchiseNews/news-feed.html"
        width="100%" height="600" frameborder="0"></iframe>
```

---

## Support

For issues or questions:
- Review the troubleshooting section above
- Check the browser console for error messages
- Review workflow logs in the Actions tab
- Open an issue on [GitHub](https://github.com/MonroeGamble/WebApp/issues)

---

*Last updated: November 2024*
