# GitHub Actions Setup Instructions

## Initializing the Daily Stock Data Updates

The FranResearch platform includes a GitHub Actions workflow that automatically updates stock data daily. Follow these steps to activate it:

---

## Step 1: Verify Workflow File Exists

The workflow file should already be in your repository at:
```
.github/workflows/update-stock-data.yml
```

If you cloned/forked this repo, this file should already be present.

---

## Step 2: Run the Workflow Manually (First Time)

Since the CSV file doesn't exist yet, you need to run the workflow once to create the initial dataset with 10 years of historical data.

### Via GitHub Web Interface:

1. Go to your GitHub repository: `https://github.com/MonroeGamble/WebApp`

2. Click on the **"Actions"** tab at the top

3. In the left sidebar, click on **"Update Franchise Stock Data"**

4. On the right side, you'll see a **"Run workflow"** button (dropdown)

5. Click **"Run workflow"** → Select branch → Click green **"Run workflow"** button

6. Wait 5-10 minutes for the workflow to complete
   - It will download 10 years of data for 40 stocks
   - Creates `data/franchise_stocks.csv`
   - Commits and pushes the file to your repository

### Via Command Line (Alternative):

If you have GitHub CLI installed:

```bash
gh workflow run update-stock-data.yml
```

---

## Step 3: Verify the CSV Was Created

After the workflow completes:

1. Go to your repository on GitHub
2. Navigate to `data/franchise_stocks.csv`
3. The file should exist and contain thousands of records
4. Check the file size (should be ~5-10MB for 10 years of data)

You can also check locally:
```bash
git pull origin your-branch-name
ls -lh data/franchise_stocks.csv
```

---

## Step 4: Automatic Daily Updates

Once the initial CSV is created, the workflow will run automatically:

- **Schedule:** Every weekday at 5:30 PM ET (after market close)
- **Cron:** `30 21 * * 1-5` (9:30 PM UTC)
- **What it does:**
  - Fetches yesterday's closing prices
  - Updates the CSV file
  - Commits changes with message: "Update franchise stock data - YYYY-MM-DD"
  - Pushes to your repository
  - GitHub Pages automatically rebuilds

**No manual action required after initial setup!**

---

## Troubleshooting

### Workflow Fails with "No such file or directory"

**Problem:** The `data/` directory doesn't exist

**Solution:**
```bash
mkdir -p data
git add data/.gitkeep
git commit -m "Create data directory"
git push
```

Then re-run the workflow.

---

### Workflow Fails with "Permission denied"

**Problem:** GitHub Actions doesn't have write permissions

**Solution:**
1. Go to repository **Settings** → **Actions** → **General**
2. Under "Workflow permissions"
3. Select **"Read and write permissions"**
4. Click **Save**

Re-run the workflow.

---

### Python Dependencies Missing

**Problem:** `yfinance` or `pandas` not found

**Solution:** The workflow installs these automatically. If it fails:
- Check the workflow file has correct `pip install` command
- Verify Python 3.11 is being used
- Check workflow logs for specific error

---

### CSV File Not Loading in Charts

**Problem:** Chart shows "CSV not found" in console

**Solutions:**
1. **Verify file exists:** Check `data/franchise_stocks.csv` in your repo
2. **Check file path:** Chart looks for `../data/franchise_stocks.csv`
3. **GitHub Pages delay:** Wait 2-5 minutes after workflow completes for Pages to rebuild
4. **Hard refresh:** Press Ctrl+F5 (or Cmd+Shift+R on Mac) to clear cache
5. **Check console:** Open browser DevTools → Console tab for errors

---

## Manual Workflow Triggers

You can manually trigger the workflow anytime (e.g., to fetch missing days):

### Via GitHub Web Interface:
1. Actions tab → "Update Franchise Stock Data"
2. Run workflow → Select branch
3. Click "Run workflow"

### Via GitHub CLI:
```bash
gh workflow run update-stock-data.yml
```

---

## Monitoring Workflow Runs

### View All Runs:
1. Go to **Actions** tab
2. Click on **"Update Franchise Stock Data"** in left sidebar
3. See list of all runs with status

### View Specific Run:
1. Click on any run
2. Click on the job name (e.g., "update-data")
3. Expand steps to see detailed logs
4. Check for errors in "Fetch stock data" step

### GitHub Notifications:
- You'll receive email if workflow fails
- Check Settings → Notifications → Actions for preferences

---

## Customization

### Change Update Schedule:

Edit `.github/workflows/update-stock-data.yml`:

```yaml
on:
  schedule:
    - cron: '30 21 * * 1-5'  # Change this line
```

**Examples:**
- `0 22 * * 1-5` - 6:00 PM ET (10 PM UTC)
- `0 0 * * *` - Midnight UTC daily
- `0 */6 * * *` - Every 6 hours

Use [crontab.guru](https://crontab.guru/) to generate cron expressions.

### Add More Stocks:

Edit `scripts/update_franchise_stocks.py`:

```python
FRANCHISE_STOCKS = [
    "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK",
    "DENN", "DIN", "DNUT", "NATH", "RRGB", "DRVN", "HRB", "MCW",
    "SERV", "ROL", "PLNT", "BFT", "MAR", "HLT", "H", "CHH", "WH",
    "VAC", "TNL", "RENT", "GNC", "ADUS", "LOPE", "PLAY", "ARCO", "TAST"
]
```

Then re-run workflow to fetch historical data for new stocks.

---

## Expected Results

### After First Run:
- `data/franchise_stocks.csv` created
- ~85,000+ records (34 stocks × 10 years × ~250 trading days)
- File size: ~5-10 MB
- Commit in git history

### After Daily Runs:
- +34 records per day (one per stock)
- Commit message: "Update franchise stock data - YYYY-MM-DD"
- Charts load instantly with historical data
- Only today's data fetched via API (fast!)

### Performance Impact:
- **Before CSV:** 10 stocks = 10 API calls for full history
- **After CSV:** 10 stocks = 10 API calls for today only
- **Load time:** Reduced from 5-10 seconds to <1 second

---

## Need Help?

If you encounter issues:

1. **Check workflow logs:**
   - Actions tab → Click on failed run
   - Review error messages in each step

2. **Verify Python script:**
   - Ensure `scripts/update_franchise_stocks.py` exists
   - Check for syntax errors

3. **Test locally:**
   ```bash
   pip install yfinance pandas
   python scripts/update_franchise_stocks.py
   ```

4. **GitHub Support:**
   - Check [GitHub Actions documentation](https://docs.github.com/en/actions)
   - Search GitHub Community forums

---

## Summary Checklist

- [ ] Workflow file exists at `.github/workflows/update-stock-data.yml`
- [ ] Python script exists at `scripts/update_franchise_stocks.py`
- [ ] GitHub Actions has write permissions
- [ ] Ran workflow manually for first time
- [ ] Verified `data/franchise_stocks.csv` was created
- [ ] Charts load data from CSV (check browser console)
- [ ] Daily automatic updates working

---

**All set!** Your stock data will now update automatically every trading day at 5:30 PM ET. 📊🚀
