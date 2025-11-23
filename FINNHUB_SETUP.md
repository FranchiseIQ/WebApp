# 🔑 Finnhub API Setup Guide

This guide explains how to configure the Finnhub API for live stock ticker updates.

## 📋 Overview

The website now uses **Finnhub API** for real-time stock quotes instead of Yahoo Finance. This provides:

- ✅ More reliable data
- ✅ Better rate limits (60 calls/minute on free tier)
- ✅ Consistent data format
- ✅ No CORS issues
- ✅ Official API support

## 🚀 Quick Setup (2 Minutes)

### Step 1: Add API Key to GitHub Secrets

1. **Go to your repository settings**:
   ```
   https://github.com/MonroeGamble/WebApp/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Enter the secret details**:
   - **Name:** `FINNHUB_API_KEY`
   - **Value:** `d4ga5f9r01qm5b34l2s0d4ga5f9r01qm5b34l2sg`

4. **Click "Add secret"**

That's it! The workflow will now use this API key automatically.

### Step 2: Test the Workflow

1. **Go to Actions tab**:
   ```
   https://github.com/MonroeGamble/WebApp/actions
   ```

2. **Find "Update Live Stock Ticker"** in the left sidebar

3. **Click "Run workflow"** dropdown (top right)

4. **Select your branch** and click green "Run workflow" button

5. **Wait ~2-3 minutes** for completion

6. **Check the results**:
   - Green checkmark = Success! ✅
   - Red X = Check logs for errors ❌

### Step 3: Verify Live Data

1. **Check the data file** was created:
   ```
   https://github.com/MonroeGamble/WebApp/blob/YOUR_BRANCH/data/live_ticker.json
   ```

2. **Refresh your website** - ticker should show live data

3. **Open browser console** (F12) and look for:
   ```
   ✓ Loaded XX live quotes from Finnhub
   Last updated: 2025-11-21T14:30:00Z
   ```

## 📊 How It Works

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    GITHUB ACTIONS WORKFLOW                   │
│                                                              │
│  Trigger: Hourly (Mon-Fri, 9 AM - 4 PM ET)                  │
│           or Manual                                          │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │ 1. Checkout code                                   │     │
│  │ 2. Setup Python                                    │     │
│  │ 3. Install requests library                        │     │
│  │ 4. Run fetch_live_ticker_finnhub.py               │     │
│  │    - Reads FINNHUB_API_KEY from secrets           │     │
│  │    - Fetches 40+ stock quotes                      │     │
│  │    - Rate limited: 1.1s between calls             │     │
│  │    - Saves to data/live_ticker.json               │     │
│  │ 5. Commit & push changes                           │     │
│  │ 6. Trigger deployment workflow                     │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ GitHub Pages    │
                  │ Auto-deploys    │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ Website Updates │
                  │ ticker.js reads │
                  │ live_ticker.json│
                  └─────────────────┘
```

### Workflow Schedule

**Runs hourly during US market hours:**
- Monday - Friday
- 9:00 AM - 4:00 PM Eastern Time
- 2:00 PM - 9:00 PM UTC

**Total runs per week:** ~40 workflows
- 8 hours/day × 5 days = 40 runs
- Well within GitHub Actions free tier (2,000 minutes/month)

### Rate Limiting

Finnhub free tier allows **60 API calls per minute**.

Our script:
- Fetches 40+ symbols
- Waits 1.1 seconds between calls
- ~55 calls per minute (safe margin)
- Total runtime: ~60-90 seconds

## 🔒 Security

### Why Use GitHub Secrets?

✅ **API keys are encrypted** - Nobody can see them
✅ **Not visible in logs** - Shows `[REDACTED]` instead
✅ **Per-repository** - Only your repo can use them
✅ **Easy rotation** - Change key anytime without code changes

### Best Practices

1. **Never commit API keys to code**
   ```python
   # ❌ BAD
   API_KEY = "d4ga5f9r01qm5b34l2s0d4ga5f9r01qm5b34l2sg"

   # ✅ GOOD
   API_KEY = os.environ.get('FINNHUB_API_KEY')
   ```

2. **Don't share secrets publicly**
   - Don't paste in issues
   - Don't share in chat/email
   - Don't include in pull requests

3. **Rotate keys if exposed**
   - Generate new key at finnhub.io
   - Update GitHub Secret
   - Old key stops working immediately

## 🆓 Finnhub Free Tier Limits

Your current plan includes:

| Feature | Limit |
|---------|-------|
| API Calls | 60/minute |
| Monthly Calls | Unlimited |
| Real-time Data | ✅ Yes |
| Historical Data | ✅ Yes (limited) |
| WebSocket Streaming | ❌ No |
| Premium Data | ❌ No |

**This is perfect for our use case!** We only need:
- 40-60 calls per hour
- Real-time quotes
- Basic stock data

## 📈 Upgrading (Optional)

If you need more features:

| Plan | Price | API Calls | Features |
|------|-------|-----------|----------|
| Free | $0 | 60/min | Basic quotes |
| Starter | $79/mo | 300/min | WebSocket, news |
| Pro | $299/mo | 600/min | Advanced data |

**Current setup works great with free tier!**

## 🔧 Troubleshooting

### Error: "FINNHUB_API_KEY environment variable not set"

**Solution:** Add the API key to GitHub Secrets (see Step 1 above)

**Check:**
1. Did you name it exactly `FINNHUB_API_KEY`?
2. Did you save the secret?
3. Are you running the workflow from the correct branch?

### Error: "403 Forbidden" or "401 Unauthorized"

**Solution:** API key is invalid or expired

**Fix:**
1. Get new API key from [finnhub.io](https://finnhub.io/dashboard)
2. Update GitHub Secret with new key
3. Re-run workflow

### Error: "429 Too Many Requests"

**Solution:** You're hitting rate limits

**Fix:**
1. Increase delay in `fetch_live_ticker_finnhub.py`:
   ```python
   time.sleep(1.5)  # Increase from 1.1 to 1.5
   ```
2. Reduce number of symbols
3. Upgrade to paid plan

### Workflow Succeeds But Data Doesn't Update

**Check:**
1. Did workflow actually make changes?
   - Look for commit in repo history
   - Check `data/live_ticker.json` was updated
2. Did deployment workflow trigger?
   - Check Actions tab for "Deploy to GitHub Pages"
   - Should run after data update
3. Did you hard-refresh your browser?
   - Chrome/Firefox: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`

### Ticker Shows Old Data

**Check:**
1. What time is it?
   - Workflow only runs 9 AM - 4 PM ET
   - Outside market hours = shows last update
2. Is workflow enabled?
   - Check `.github/workflows/update-live-ticker.yml`
   - Make sure it's on your active branch
3. Is browser caching data?
   - Hard refresh (Ctrl + Shift + R)
   - Check Network tab in DevTools

## 📝 Manual Testing

Want to test locally without GitHub Actions?

### Option 1: Using Python

```bash
# Set API key
export FINNHUB_API_KEY="d4ga5f9r01qm5b34l2s0d4ga5f9r01qm5b34l2sg"

# Run script
cd /home/user/WebApp
python scripts/fetch_live_ticker_finnhub.py

# Check output
cat data/live_ticker.json
```

### Option 2: Using curl

Test a single quote:

```bash
curl "https://finnhub.io/api/v1/quote?symbol=MCD&token=d4ga5f9r01qm5b34l2s0d4ga5f9r01qm5b34l2sg"
```

Expected response:
```json
{
  "c": 295.50,
  "h": 297.20,
  "l": 294.10,
  "o": 296.00,
  "pc": 296.50,
  "t": 1700755200
}
```

## 🔄 Data Format

### Finnhub API Response

```json
{
  "c": 295.50,      // Current price
  "h": 297.20,      // High of day
  "l": 294.10,      // Low of day
  "o": 296.00,      // Open price
  "pc": 296.50,     // Previous close
  "t": 1700755200   // Timestamp (Unix)
}
```

### Our JSON Output

```json
{
  "quotes": {
    "MCD": {
      "symbol": "MCD",
      "price": 295.50,
      "change": -1.00,
      "changePercent": -0.34,
      "isPositive": false,
      "isNegative": true,
      "high": 297.20,
      "low": 294.10,
      "open": 296.00,
      "previousClose": 296.50,
      "timestamp": 1700755200,
      "source": "finnhub"
    }
  },
  "fetchedAt": "2025-11-21T14:30:00Z",
  "count": 40,
  "source": "finnhub"
}
```

## 📚 Additional Resources

### Finnhub Documentation
- [API Docs](https://finnhub.io/docs/api)
- [Stock Quote Endpoint](https://finnhub.io/docs/api/quote)
- [Symbol List](https://finnhub.io/docs/api/stock-symbols)

### GitHub Actions
- [Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)

### Our Files
- **Workflow:** `.github/workflows/update-live-ticker.yml`
- **Python Script:** `scripts/fetch_live_ticker_finnhub.py`
- **JavaScript:** `Website/ticker.js` (line 47-85)
- **Output:** `data/live_ticker.json`

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] API key added to GitHub Secrets
- [ ] Secret named exactly `FINNHUB_API_KEY`
- [ ] Workflow file exists: `.github/workflows/update-live-ticker.yml`
- [ ] Python script exists: `scripts/fetch_live_ticker_finnhub.py`
- [ ] Manual workflow run succeeds
- [ ] File created: `data/live_ticker.json`
- [ ] JSON contains quote data (not empty)
- [ ] Website ticker shows "Fetching live ticker data from Finnhub..."
- [ ] Browser console shows "✓ Loaded XX live quotes"
- [ ] Prices update when workflow runs

## 🎉 Success!

If all checks pass, you're done! The ticker will now:

- ✅ Update hourly during market hours
- ✅ Show real-time Finnhub data
- ✅ Fall back to CSV if Finnhub fails
- ✅ Auto-deploy to GitHub Pages

**Next Steps:**
- Monitor the Actions tab for successful runs
- Check website ticker updates hourly
- Add more symbols if needed (edit `TICKER_SYMBOLS` in script)

---

**Questions?** Check the troubleshooting section or review workflow logs in Actions tab.
