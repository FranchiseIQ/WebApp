# API & Service Setup Guide

This guide covers setup for all external APIs and services used by FranResearch.

---

## Table of Contents

1. [Finnhub API (Stock Data)](#finnhub-api-stock-data)
2. [Google Analytics (Tracking)](#google-analytics-tracking)
3. [TheSportsDB (Sports Scores)](#thesportsdb-sports-scores)

---

## Finnhub API (Stock Data)

The website uses **Finnhub API** for real-time stock quotes.

### Quick Setup (2 Minutes)

#### Step 1: Get API Key

1. Sign up at [finnhub.io](https://finnhub.io/)
2. Copy your API key from the dashboard

#### Step 2: Add to GitHub Secrets

1. Go to: `https://github.com/YOUR_USERNAME/WebApp/settings/secrets/actions`
2. Click **"New repository secret"**
3. Enter:
   - **Name:** `FINNHUB_API_KEY`
   - **Value:** Your API key
4. Click **"Add secret"**

#### Step 3: Test the Workflow

1. Go to Actions tab in your repo
2. Find **"Update Live Stock Ticker"**
3. Click **"Run workflow"**
4. Check for green checkmark

### Rate Limits

| Plan | API Calls | Price |
|------|-----------|-------|
| Free | 60/minute | $0 |
| Starter | 300/minute | $79/mo |
| Pro | 600/minute | $299/mo |

**Free tier is sufficient for this project.**

### Troubleshooting

| Error | Solution |
|-------|----------|
| "API key not set" | Add FINNHUB_API_KEY to GitHub Secrets |
| "403 Forbidden" | API key invalid - regenerate at finnhub.io |
| "429 Too Many Requests" | Increase delay between calls in script |

### Related Files

- Workflow: `.github/workflows/update-live-ticker.yml`
- Python Script: `scripts/fetch_live_ticker_finnhub.py`
- Output: `data/live_ticker.json`

---

## Google Analytics (Tracking)

GA4 tracking is pre-installed. You just need to add your Measurement ID.

### Quick Setup

#### Step 1: Create GA4 Property

1. Go to [analytics.google.com](https://analytics.google.com/)
2. Create account/property
3. Add web stream for your GitHub Pages URL
4. Copy Measurement ID (format: `G-XXXXXXXXXX`)

#### Step 2: Replace Placeholder

Find and replace `G-XXXXXXXXXX` in these files:
- `index.html`
- `FranchiseNews/news-feed.html`
- `FranchiseNews/news-ticker.html`
- `FranchiseNews/news-scroller.html`

**Using command line:**
```bash
sed -i 's/G-XXXXXXXXXX/G-YOUR-ID/g' index.html FranchiseNews/*.html
```

#### Step 3: Deploy and Test

1. Commit and push changes
2. Visit your site
3. Check GA4 Realtime report - you should appear within 30 seconds

### What's Tracked

- Page views
- User sessions
- Traffic sources
- Device types
- Location (anonymized)

### Privacy Features

- IP anonymization enabled
- No personal data collected
- Secure cookie flags

---

## TheSportsDB (Sports Scores)

The sports dashboard uses TheSportsDB free API.

### No Setup Required

The free tier (no API key needed) is used:
- **Endpoint:** `https://www.thesportsdb.com/api/v1/json/3`
- **Rate Limit:** Reasonable use (no hard limit published)
- **Supports:** NFL, NBA, NHL, MLB, MLS, WNBA

### Upgrading (Optional)

If you need higher rate limits:
1. Sign up at [thesportsdb.com](https://www.thesportsdb.com/)
2. Get premium API key
3. Update `sports.html` API_BASE constant

### Related Files

- Sports Page: `sports.html`
- API Base: `https://www.thesportsdb.com/api/v1/json/3`

---

## Quick Reference

| Service | API Key Required | Setup Location |
|---------|------------------|----------------|
| Finnhub | Yes | GitHub Secrets |
| Google Analytics | Yes (Measurement ID) | HTML files |
| TheSportsDB | No (free tier) | None |
| OpenStreetMap | No | None |
| Leaflet Maps | No | None |

---

## Support

- **Finnhub:** [finnhub.io/docs](https://finnhub.io/docs/api)
- **Google Analytics:** [support.google.com/analytics](https://support.google.com/analytics/)
- **TheSportsDB:** [thesportsdb.com/api.php](https://www.thesportsdb.com/api.php)
