# GitHub Actions Workflows

This directory contains automated workflows that keep your website data up-to-date.

## 🔄 Active Workflows

### 1. Update Stock Data for FranchiseMap Ticker (`update-stocks.yml`)

**Purpose**: Continuously updates franchise company stock prices during market hours.

**Schedule**: Every 30 minutes during market hours (Mon-Fri, 2:30 PM - 9:30 PM UTC / 9:30 AM - 4:30 PM ET)

**What it does**:
1. Fetches latest stock prices for 7+ franchise companies (CMG, SBUX, MCD, WEN, WING, SHAK, DPZ)
2. Updates `FranchiseMap/data/stocks.json` with current price, change, and percent change
3. Validates data before committing
4. Commits and pushes the updated file
5. Your FranchiseMap ticker displays the latest prices in real-time

**Manual Trigger**: Go to Actions tab → "Update Stock Data for FranchiseMap Ticker" → "Run workflow"

**Stock Data Source**: Yahoo Finance (yfinance)

### 2. Deploy to GitHub Pages (`deploy.yml`)

**Purpose**: Deploys the website to GitHub Pages when changes are pushed to main.

**Trigger**: Automatic on push to main branch, or manual via "Run workflow"

**What it does**:
1. Builds static site artifact
2. Deploys to GitHub Pages environment
3. Shows deployment URL and status

**Manual Trigger**: Go to Actions tab → "Deploy to GitHub Pages" → "Run workflow"

**Branch Policy**: Only main branch triggers automatic deployment (production-safe)

### 3. Batch Process Scheduler (`batch-process-scheduler.yml`)

**Purpose**: Continuously processes FranchiseMap location data in batches.

**Schedule**: Every 4 hours around the clock (adaptive batch processing)

**What it does**:
1. Runs adaptive batch processor to generate franchise locations
2. Processes next batch with intelligent queue management
3. Uploads logs and data artifacts
4. Commits processed location data to repository
5. Automatically schedules next run

**Manual Trigger**: Go to Actions tab → "24/7 FranchiseMap Batch Processing Scheduler" → "Run workflow"

**Optional Inputs**:
- `manual_batch_size`: Override default batch size (default is random 50-100)

### 4. Batch Generate Locations (`batch-generate-locations.yml`)

**Purpose**: Automatically and continuously generates franchise location data in batches.

**Schedule**: Daily at 2:00 AM UTC (⚙️ Automatic)

**Trigger**: Automatic daily + Manual override available

**What it does**:
1. Gets next batch of unprocessed brands
2. Generates location data for brands in batch
3. Enriches locations with full address data via reverse geocoding
4. Collects store hours, contact info, and other available details
5. Validates data completeness
6. Builds/updates brand metadata
7. Uploads data artifacts and completion report
8. Commits results with batch summary
9. Automatically queues next batch when complete

**Manual Trigger**: Go to Actions tab → "Batch Generate FranchiseMap Locations" → "Run workflow"

**Optional Inputs**:
- `batch_size`: Number of brands per batch (default: 50)

**Data Enrichment**: Each location now includes:
- ✅ Full address (City, State, Postal Code)
- ✅ Coordinates (latitude, longitude)
- ✅ Location name
- ✅ Store hours (when available)
- ✅ Contact information (when available)
- ✅ Country code

**Continuity**: Runs every day to process remaining brands until all locations are generated

### 5. Generate Data (`generate-data.yml`)

**Purpose**: Automatically generates and validates all FranchiseMap location data and metadata daily.

**Schedule**: Daily at 3:00 AM UTC (⚙️ Automatic) - runs after batch processing

**Trigger**: Automatic daily + Manual override available

**What it does**:
1. Generates all FranchiseMap locations with full data enrichment
2. Enriches all locations with complete address data via reverse geocoding
3. Validates data completeness across all brands and locations
4. Generates comprehensive metadata with brand information
5. Uploads complete data package and validation report as artifacts
6. Produces detailed completeness report showing:
   - Total brands and locations processed
   - Address coverage percentage
   - Coordinate and name coverage
   - Brand completion status
7. Commits consolidated data to repository

**Manual Trigger**: Go to Actions tab → "Generate FranchiseMap Locations & Metadata" → "Run workflow"

**Data Validation**: Reports on:
- ✅ Total locations with addresses
- ✅ Geocoding success rate
- ✅ Coordinate coverage
- ✅ Name coverage
- ✅ Brand completion percentage

### 6. Data Aggregation Pipeline (`data-aggregation.yml`)

**Purpose**: Comprehensive data aggregation from government and census sources.

**Trigger**: Manual only (resource-intensive operation)

**What it does**:
1. Aggregates data from Census Bureau, government agencies, and BLS
2. Generates data quality reports
3. Uploads aggregation artifacts and logs
4. Processes with API key authentication

**Manual Trigger**: Go to Actions tab → "Data Aggregation Pipeline" → "Run workflow"

**Requirements**: Set secrets `CENSUS_API_KEY`, `GOV_DATA_KEY`, `BLS_KEY` in repo settings

## 🔧 How to Use

### First Time Setup

1. **Enable GitHub Actions** (if not already enabled):
   - Go to your repository Settings
   - Navigate to Actions → General
   - Under "Workflow permissions", select "Read and write permissions"
   - Check "Allow GitHub Actions to create and approve pull requests"
   - Click "Save"

2. **Set Required Secrets** (for data aggregation):
   - Go to Settings → Secrets and Variables → Actions
   - Add `CENSUS_API_KEY` from [Census Bureau](https://api.census.gov/data/key_signup.html)
   - Add `GOV_DATA_KEY` if needed for government data sources
   - Add `BLS_KEY` for Bureau of Labor Statistics access

3. **Verify workflows are enabled**:
   - Go to the "Actions" tab in your repository
   - You should see all workflows listed

4. **Manually trigger a test run**:
   - Click on "Update Stock Data for FranchiseMap Ticker"
   - Click "Run workflow" dropdown
   - Click the green "Run workflow" button
   - Wait for it to complete (takes about 30-60 seconds)

### Monitoring Workflow Runs

- Go to the **Actions** tab to see all workflow runs
- Click on any run to see detailed logs
- Green checkmark ✓ = successful
- Red X ✗ = failed (check logs for errors)
- Filter by workflow name to see specific runs

### Common Issues

**Issue**: Stock data workflow fails
**Fix**:
1. Check if Yahoo Finance API is accessible (yfinance library)
2. Verify internet connectivity in workflow
3. Check if market is open when running manual trigger
4. Review logs in Actions tab

**Issue**: Batch processing fails
**Fix**:
1. Verify data_aggregation module is installed
2. Check batch processor queue status in logs
3. Review pipeline configuration
4. Manually trigger again (system auto-retries every 4 hours)

**Issue**: Workflow permission denied
**Fix**: Enable write permissions in Settings → Actions → General → Workflow permissions

## 📊 Data Files Updated by Workflows

| Workflow | Data File(s) | Schedule | Update Type |
|----------|-----------|----------|------------|
| Update Stock Data | `FranchiseMap/data/stocks.json` | Every 30 min (market hours) | Real-time pricing |
| Batch Process Scheduler | `FranchiseMap/data/brands/*` | Every 4 hours (24/7) | Live data enrichment |
| **Batch Generate Locations** | **`FranchiseMap/data/brands/*.json`** | **Daily at 2 AM UTC** | **New locations + addresses** |
| **Generate Data** | **`FranchiseMap/data/manifest.json`** | **Daily at 3 AM UTC** | **Complete dataset + validation** |
| Deploy to Pages | All files | On push to main | Deployment |

### Location Data Structure

Each location now includes:
```json
{
  "name": "Store Name",
  "lat": 40.7128,
  "lng": -74.0060,
  "address": "New York, NY 10001",
  "display_name": "Full address string",
  "country": "United States",
  "hours": "9 AM - 5 PM",
  "phone": "+1-XXX-XXX-XXXX",
  "website": "https://..."
}
```

These files are automatically committed by the workflows and deployed via GitHub Pages.

## 🔄 Workflow Schedule Summary

| Workflow | Schedule | Type | Next Run Time |
|----------|----------|------|---------------|
| Update Stock Data | Mon-Fri, every 30 min (2:30 PM - 9:30 PM UTC) | ⚙️ Automatic | During market hours |
| Deploy to GitHub Pages | On push to main branch | ⚙️ Automatic | On commit to main |
| Batch Process Scheduler | Every 4 hours (24/7) | ⚙️ Automatic | Every 4 hours |
| **Batch Generate Locations** | **Daily at 2:00 AM UTC** | **⚙️ Automatic** | **Tomorrow 2:00 AM UTC** |
| **Generate Data** | **Daily at 3:00 AM UTC** | **⚙️ Automatic** | **Tomorrow 3:00 AM UTC** |
| Data Aggregation | Manual trigger (on-demand) | 🎯 Manual | When triggered |

## 🚀 Benefits

✅ Stock prices update every 30 minutes during market hours
✅ **Franchise locations generated continuously (new batches processed daily)**
✅ **All locations enriched with complete addresses via geocoding**
✅ **Daily data validation and completeness reports**
✅ Batch processing runs continuously (24/7) for real-time updates
✅ Deployment to GitHub Pages is automatic on main branch push
✅ All workflows are fault-tolerant with automatic retries
✅ Manual triggers available for on-demand processing
✅ 100% free with GitHub Actions
✅ Comprehensive logging and artifact uploads for debugging

## 📖 More Info

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Cron Schedule Syntax](https://crontab.guru/)
- [Yahoo Finance Library](https://github.com/ranaroussi/yfinance)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
