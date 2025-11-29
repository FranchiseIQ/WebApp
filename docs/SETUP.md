# FranResearch Setup Checklist

This document provides explicit step-by-step instructions for completing the setup of your FranResearch website.

---

## Prerequisites

Before starting, ensure you have:
- [ ] A GitHub account
- [ ] Git installed locally
- [ ] A web browser
- [ ] 30-60 minutes of time

---

## Phase 1: Repository Setup (5 minutes)

### Step 1.1: Fork or Clone Repository
- [ ] Go to the WebApp repository on GitHub
- [ ] Click **Fork** (or clone if you own it)
- [ ] Note your repository URL: `https://github.com/YOUR_USERNAME/WebApp`

### Step 1.2: Enable GitHub Pages
- [ ] Go to **Settings** → **Pages**
- [ ] Under "Source", select **GitHub Actions**
- [ ] Note your site URL: `https://YOUR_USERNAME.github.io/WebApp/`

---

## Phase 2: Finnhub API Setup (5 minutes)

This enables live stock data on the ticker.

### Step 2.1: Get Finnhub API Key
- [ ] Go to [finnhub.io](https://finnhub.io/)
- [ ] Click **Get free API key**
- [ ] Sign up with email or Google
- [ ] Copy your API key from the dashboard (looks like: `abc123def456...`)

### Step 2.2: Add API Key to GitHub Secrets
- [ ] Go to your repo: `https://github.com/YOUR_USERNAME/WebApp/settings/secrets/actions`
- [ ] Click **New repository secret**
- [ ] Enter:
  - Name: `FINNHUB_API_KEY`
  - Secret: (paste your API key)
- [ ] Click **Add secret**

### Step 2.3: Test Stock Data Workflow
- [ ] Go to **Actions** tab
- [ ] Click **Update Live Stock Ticker** (left sidebar)
- [ ] Click **Run workflow** → **Run workflow**
- [ ] Wait 2-3 minutes
- [ ] Verify green checkmark appears

---

## Phase 3: Google Analytics Setup (10 minutes)

This enables visitor tracking.

### Step 3.1: Create GA4 Property
- [ ] Go to [analytics.google.com](https://analytics.google.com/)
- [ ] Click **Start measuring** or **Admin** → **Create Property**
- [ ] Property name: `FranResearch`
- [ ] Click **Next** through the setup

### Step 3.2: Create Web Data Stream
- [ ] In Admin → Data Streams, click **Add stream** → **Web**
- [ ] Enter URL: `https://YOUR_USERNAME.github.io`
- [ ] Stream name: `GitHub Pages`
- [ ] Click **Create stream**
- [ ] Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 3.3: Add Measurement ID to Code
- [ ] In your local repo, open these files and replace `G-XXXXXXXXXX` with your ID:
  - [ ] `index.html`
  - [ ] `FranchiseNews/news-feed.html`
  - [ ] `FranchiseNews/news-ticker.html`
  - [ ] `FranchiseNews/news-scroller.html`

**Or use command line:**
```bash
sed -i 's/G-XXXXXXXXXX/G-YOUR-ACTUAL-ID/g' index.html FranchiseNews/*.html
```

### Step 3.4: Commit and Push
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Add Google Analytics tracking"`
- [ ] Run: `git push`

### Step 3.5: Verify Analytics
- [ ] Wait 2-3 minutes for deployment
- [ ] Visit your site
- [ ] Check GA4 **Realtime** report - you should appear

---

## Phase 4: Update Branding (10 minutes)

### Step 4.1: Update Logo
- [ ] Replace `logo.svg` with your logo (keep same filename)
- [ ] Recommended size: 32x32px minimum

### Step 4.2: Update Site Title
- [ ] Edit `index.html` - update `<title>` tag
- [ ] Edit other HTML files as needed

### Step 4.3: Update Footer
- [ ] Edit `index.html` - update footer copyright
- [ ] Update links to your GitHub/website

### Step 4.4: Commit Changes
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Update branding"`
- [ ] Run: `git push`

---

## Phase 5: Customize Stock Symbols (Optional)

### Step 5.1: Edit Ticker Symbols
- [ ] Open `scripts/fetch_live_ticker_finnhub.py`
- [ ] Find `TICKER_SYMBOLS` list
- [ ] Add/remove stock symbols as needed
- [ ] Save file

### Step 5.2: Edit CSV Data (for historical charts)
- [ ] Open `data/stock_history.csv`
- [ ] Add new columns for new symbols
- [ ] Format: `Date,SYMBOL1,SYMBOL2,...`

### Step 5.3: Commit Changes
- [ ] Run: `git add .`
- [ ] Run: `git commit -m "Update stock symbols"`
- [ ] Run: `git push`

---

## Phase 6: Verify Everything Works (5 minutes)

### Final Checklist
- [ ] Visit `https://YOUR_USERNAME.github.io/WebApp/`
- [ ] Verify stock ticker shows live prices
- [ ] Verify ticker scrolls smoothly
- [ ] Click **Charts** - verify charts load
- [ ] Click **Map** - verify map displays
- [ ] Click **News** - verify news loads
- [ ] Click **Sports** - verify sports data loads
- [ ] Open browser DevTools (F12) - check for errors

### Common Issues

| Issue | Solution |
|-------|----------|
| Ticker shows "Loading..." forever | Check Finnhub API key in Secrets |
| Charts don't load | Check `data/stock_history.csv` exists |
| 404 on GitHub Pages | Enable GitHub Pages in Settings |
| Analytics not tracking | Verify Measurement ID is correct |

---

## Maintenance

### Daily (Automated)
- Stock ticker updates hourly during market hours (M-F 9am-4pm ET)
- News feed updates every 6 hours

### Weekly
- [ ] Check GitHub Actions for any failed workflows
- [ ] Review analytics for traffic insights

### Monthly
- [ ] Review and update stock symbols if needed
- [ ] Check for any deprecation warnings

---

## Support Resources

- **API Setup:** See [docs/API_SETUP.md](API_SETUP.md)
- **Deployment:** See [docs/DEPLOYMENT.md](DEPLOYMENT.md)
- **Feature Docs:** Each folder has its own README.md

---

## Quick Reference

| Item | Value |
|------|-------|
| Live Site | `https://YOUR_USERNAME.github.io/WebApp/` |
| Finnhub Dashboard | [finnhub.io/dashboard](https://finnhub.io/dashboard) |
| GA4 Dashboard | [analytics.google.com](https://analytics.google.com/) |
| GitHub Actions | `https://github.com/YOUR_USERNAME/WebApp/actions` |
| GitHub Secrets | `https://github.com/YOUR_USERNAME/WebApp/settings/secrets/actions` |

---

**Setup Complete!** Your FranResearch site should now be fully functional.
