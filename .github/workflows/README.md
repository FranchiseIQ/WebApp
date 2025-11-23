# GitHub Actions Workflows

This directory contains automated workflows that keep your website data up-to-date.

## 🔄 Active Workflows

### 1. Update Franchise News (`update-franchise-news.yml`)

**Purpose**: Automatically fetches the latest franchise industry news from RSS feeds every 6 hours.

**Schedule**: Runs at 00:00, 06:00, 12:00, and 18:00 UTC daily

**What it does**:
1. Fetches RSS feeds from franchise news sources
2. Parses and normalizes the data
3. Saves to `FranchiseNews/data/news.json`
4. Commits and pushes the updated file
5. Your website automatically displays the latest news

**Manual Trigger**: Go to Actions tab → "Update Franchise News" → "Run workflow"

**News Sources**:
- Franchise Times
- 1851 Franchise
- Entrepreneur (Franchises)
- Franchising.com
- More sources can be added to `scripts/fetch-franchise-news.py`

### 2. Update Franchise Stock Data (`update-stock-data.yml`)

**Purpose**: Updates franchise company stock prices after market close.

**Schedule**: Runs at 9:30 PM UTC (5:30 PM ET) Monday-Friday after market close

**What it does**:
1. Fetches latest stock prices for 40+ franchise companies
2. Updates `data/franchise_stocks.csv`
3. Commits and pushes the updated file
4. Your stock ticker displays the latest prices

**Manual Trigger**: Go to Actions tab → "Update Franchise Stock Data" → "Run workflow"

## 🔧 How to Use

### First Time Setup

1. **Enable GitHub Actions** (if not already enabled):
   - Go to your repository Settings
   - Navigate to Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Click "Save"

2. **Verify workflows are enabled**:
   - Go to the "Actions" tab in your repository
   - You should see the workflows listed

3. **Manually trigger a test run**:
   - Click on "Update Franchise News"
   - Click "Run workflow" dropdown
   - Click the green "Run workflow" button
   - Wait for it to complete (takes about 30 seconds)

### Monitoring Workflow Runs

- Go to the **Actions** tab to see all workflow runs
- Click on any run to see detailed logs
- Green checkmark ✓ = successful
- Red X ✗ = failed (check logs for errors)

### Common Issues

**Issue**: Workflow fails with "Permission denied"
**Fix**: Enable write permissions in Settings → Actions → General → Workflow permissions

**Issue**: News not updating
**Fix**:
1. Check if RSS feeds are accessible (some sites block bots)
2. Check workflow logs in Actions tab
3. Manually trigger the workflow to test

**Issue**: Stock data not updating
**Fix**:
1. Verify market is closed when workflow runs (5:30 PM ET)
2. Check if Yahoo Finance API is accessible
3. Review logs in Actions tab

## 📝 Adding More News Sources

To add more RSS feeds:

1. Edit `scripts/fetch-franchise-news.py`
2. Add new entries to the `RSS_FEEDS` dictionary:

```python
RSS_FEEDS = {
    'new-source-id': {
        'url': 'https://example.com/feed/',
        'category': 'Trade press and industry news',
        'label': 'Source Name'
    },
    # ... existing sources
}
```

3. Commit and push
4. The workflow will automatically start fetching from the new source

## 🎯 Manual Testing

You can test the scripts locally before committing:

```bash
# Test news fetching
python scripts/fetch-franchise-news.py

# Test stock data (if you have the script)
python scripts/update_franchise_stocks.py
```

## 📊 Data Files Updated by Workflows

- `FranchiseNews/data/news.json` - Updated every 6 hours
- `data/franchise_stocks.csv` - Updated daily after market close

These files are automatically committed by the workflows and deployed via GitHub Pages.

## 🚀 Benefits

✅ Always show fresh franchise news (updated 4x daily)
✅ Stock prices update automatically after market close
✅ No manual intervention required
✅ 100% free with GitHub Actions
✅ Works perfectly with GitHub Pages

## 📖 More Info

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Schedule Syntax](https://crontab.guru/)
- Python RSS Library: [feedparser](https://feedparser.readthedocs.io/)
