# API Registration & Setup Guide

Complete step-by-step instructions for registering with all four open-source data APIs and integrating them into FranchiseMap.

**Total Setup Time**: ~30-45 minutes
**Cost**: FREE for all APIs
**Difficulty**: Easy (form-filling only, no coding required)

---

## Table of Contents

1. [Census Bureau API](#1-us-census-bureau-api)
2. [FBI Crime Data API](#2-fbi-crime-data-api)
3. [GTFS Transit Feeds](#3-gtfs-transit-feeds)
4. [Bureau of Labor Statistics (BLS) API](#4-bls-wage-data-api)
5. [Environment Variable Setup](#5-environment-variable-setup)
6. [Running the Integration Scripts](#6-running-the-integration-scripts)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. U.S. Census Bureau API

### Purpose
Get real median household income, education levels, and employment rates for your locations.

### Step-by-Step Registration

#### Step 1: Go to Census API Registration Page
```
URL: https://api.census.gov/data/key_signup.html
```

#### Step 2: Fill Out Registration Form

**Field 1 - First Name**
```
Enter: Your first name
Example: John
```

**Field 2 - Last Name**
```
Enter: Your last name
Example: Smith
```

**Field 3 - Email**
```
Enter: Your email address
Example: john.smith@example.com
⚠️ IMPORTANT: Use an email you check regularly - confirmation sent here
```

**Field 4 - Organization**
```
Enter: Your company/project name
Example: FranResearch or FranchiseIQ
```

**Field 5 - Intended Use**
```
Select or enter: "Academic research" or "Business analysis"
Or type: "Franchise location demographic analysis"
```

#### Step 3: Submit Form
- Click "Request KEY"
- You'll see: "Your request has been received"

#### Step 4: Check Email
- Look for email from: `census-api-key@census.gov`
- **Check spam/promotions folder if not in inbox**
- Email will contain your API key
- **Example**: `abc123def456ghi789jkl012mno345pqr678stu`

#### Step 5: Copy API Key
```
Open the email from Census Bureau
Find the line: "Your API key is: [YOUR_KEY]"
Copy the entire key (it's about 40 characters)
```

### What You Get
- Access to American Community Survey (ACS) data
- 2021 5-year estimates (most recent)
- Median income, education, employment, demographics
- Free tier: unlimited requests
- Rate limit: 500 requests per second

### Verification
Once you have your key, test it:

**In browser address bar, paste this (replace YOUR_KEY):**
```
https://api.census.gov/data/2021/acs/acs5?get=B19013_001E&for=state:06&key=YOUR_KEY
```

You should see a JSON response with California income data.

---

## 2. FBI Crime Data API

### Purpose
Get real FBI Uniform Crime Reporting (UCR) data - actual crime rates by county/city.

### How It Works
**Good News**: No API key needed! FBI provides public data.

### Step-by-Step Access

#### Option A: Use Direct API (Recommended)
```
No registration required!
Public API available at:
https://crime-data-explorer.fr.cloud.gov/api/
```

#### Option B: Download Raw Data Files
```
URL: https://crime-data-explorer.fr.cloud.gov/
Click: "Downloads" section
Choose: "Crime by geography" or "Crime trends"
Select: State or county level
Download: CSV files
```

### What You Get
- Crime counts by offense type
- Violent crime, property crime, arson, human trafficking
- County and city level granularity
- 10+ years of historical data
- Data published with 2-year lag (e.g., 2025 has 2023 data)

### API Examples

**Get crimes for a specific agency:**
```
https://crime-data-explorer.fr.cloud.gov/api/agencies/NY0010000
```

**Get national crime statistics:**
```
https://crime-data-explorer.fr.cloud.gov/api/crimes/national
```

### Verification
Open in browser:
```
https://crime-data-explorer.fr.cloud.gov/api/crimes/national
```

You should see JSON with national crime statistics.

---

## 3. GTFS Transit Feeds

### Purpose
Get real public transit routes, stops, and schedules (1,400+ agencies).

### Step-by-Step Access

#### Step 1: Visit Transit Feeds Directory
```
URL: https://transitfeeds.com/
```

#### Step 2: (Optional) Register for API Key

**Why register?**
- No registration needed to download feeds
- Registration gives you API access for automated updates
- Optional but recommended for production

**To register:**
1. Click "Sign up" in top right
2. Enter email and password
3. Verify email
4. Go to "Account Settings"
5. Find "API Key" - copy it

#### Step 3: Find Your Transit Agency

**For NYC:**
```
Search: "New York MTA"
Download: GTFS feed (green button)
Or use API: http://web.mta.info/developers/
```

**For LA:**
```
Search: "Los Angeles Metro"
Download: GTFS feed
Or use API: https://developer.metro.net/
```

**For Chicago:**
```
Search: "Chicago CTA"
Download: GTFS feed
Or use official API: https://www.transitchicago.com/feed/
```

**Complete list of major agencies:**
```
✓ NYC MTA (15,000+ stops)
✓ LA Metro (2,300+ stops)
✓ San Francisco BART (48 stations)
✓ Chicago CTA (300+ stations)
✓ Washington WMATA (98 stations)
✓ Boston MBTA (390+ stops)
✓ Philadelphia SEPTA (300+ stops)
✓ And 1,390+ more agencies...
```

#### Step 4: Download or Access Feed

**Method A: Direct Download**
1. Go to transitfeeds.com
2. Search for agency
3. Click green "DOWNLOAD" button
4. Get ZIP file with GTFS data
5. Extract and use

**Method B: API Access**
```
URL format:
https://api.transitfeeds.com/v1/feeds?key=YOUR_KEY

Replace YOUR_KEY with your API key from Step 2
```

### What You Get
- Routes (bus, rail, light rail, ferry)
- Stop locations (lat/lng)
- Schedules and trip patterns
- Real-time data available (some agencies)
- Free public data

### Verification
1. Download a GTFS feed for your nearest city
2. Extract the ZIP
3. Check files:
   - `stops.txt` - Transit stop locations
   - `routes.txt` - Route definitions
   - `stop_times.txt` - Schedules

---

## 4. BLS Wage Data API

### Purpose
Get real employment rates, wages, and job statistics by region.

### Step-by-Step Registration

#### Step 1: Go to BLS Registration Page
```
URL: https://www.bls.gov/developers/
Click: "Get Started" or "Register for API"
```

#### Step 2: Fill Out Registration Form

**Field 1 - Email**
```
Enter: Your email address
Example: john.smith@example.com
⚠️ Confirmation will be sent here
```

**Field 2 - First Name**
```
Example: John
```

**Field 3 - Last Name**
```
Example: Smith
```

#### Step 3: Submit & Verify Email
- Check email from BLS
- Click verification link
- Your account is active!

#### Step 4: Get Your API Key

**After email verification:**
1. Go back to: https://www.bls.gov/developers/
2. Click "View your profile"
3. Find section: "API Keys"
4. Click "Generate New Key"
5. Copy the generated key

### What You Get
- Employment data by industry and region
- Unemployment rates by state/county
- Average wages and earnings
- Job growth rates
- Consumer Price Index (CPI)
- Free tier: 500 requests/week
- Full tier: Unlimited (also free!)

### API Endpoints Available

```
1. Unemployment Rate
   Series ID: LAUS<<STATE_CODE>>00000003
   Example: LAUSK000000000003 (Kansas unemployment)

2. Employment by Industry
   Series ID: CE<<AREA_CODE>><<INDUSTRY_CODE>>01

3. Average Wages
   Series ID: ENU<<AREA_CODE>><<INDUSTRY_CODE>>04

For full series ID list:
https://www.bls.gov/help/hlpforma.htm
```

### Verification
Once you have your API key, test it:

```
Create a file: test_bls.py

import requests
import json

API_KEY = "YOUR_API_KEY_HERE"
headers = {'Content-type': 'application/json'}
data = json.dumps({
    "seriesid": ["LAUKS000000000003"],  # Kansas unemployment
    "startyear": "2024",
    "endyear": "2025",
    "apikey": API_KEY
})

response = requests.post(
    'https://api.bls.gov/publicAPI/v2/timeseries/data/',
    data=data,
    headers=headers
)
print(response.json())
```

Run: `python3 test_bls.py`

You should see employment data.

---

## 5. Environment Variable Setup

Once you have all four API keys, set them up so the scripts can use them.

### On Mac/Linux

#### Step 1: Open Terminal

#### Step 2: Edit Your Shell Profile

```bash
# If using bash:
nano ~/.bash_profile

# If using zsh (default on newer Macs):
nano ~/.zshrc
```

#### Step 3: Add API Keys

Paste these lines at the bottom of the file (replace with your actual keys):

```bash
# Census Bureau API
export CENSUS_API_KEY="your_census_key_here"

# FBI Crime Data (optional - public API doesn't need key)
export FBI_CRIME_API="https://crime-data-explorer.fr.cloud.gov/api/"

# GTFS Transit Feeds
export TRANSIT_FEEDS_API_KEY="your_transit_feeds_key_here"

# BLS Wage Data
export BLS_API_KEY="your_bls_api_key_here"
```

#### Step 4: Save and Exit
- Press: `Ctrl + O` (save)
- Press: `Enter` (confirm)
- Press: `Ctrl + X` (exit)

#### Step 5: Reload Shell Profile
```bash
# For bash:
source ~/.bash_profile

# For zsh:
source ~/.zshrc
```

#### Step 6: Verify Setup
```bash
echo $CENSUS_API_KEY
```

You should see your API key printed.

### On Windows (Command Prompt)

#### Step 1: Open Command Prompt as Administrator
- Search: "cmd"
- Right-click: "Run as administrator"

#### Step 2: Set Environment Variables

```cmd
setx CENSUS_API_KEY "your_census_key_here"
setx BLS_API_KEY "your_bls_api_key_here"
setx TRANSIT_FEEDS_API_KEY "your_transit_feeds_key_here"
```

#### Step 3: Close and Reopen Command Prompt
- Restart needed for changes to take effect

#### Step 4: Verify Setup
```cmd
echo %CENSUS_API_KEY%
```

### On Windows (PowerShell)

#### Step 1: Open PowerShell as Administrator

#### Step 2: Set Environment Variables
```powershell
[Environment]::SetEnvironmentVariable(
    "CENSUS_API_KEY",
    "your_census_key_here",
    "User"
)

[Environment]::SetEnvironmentVariable(
    "BLS_API_KEY",
    "your_bls_api_key_here",
    "User"
)

[Environment]::SetEnvironmentVariable(
    "TRANSIT_FEEDS_API_KEY",
    "your_transit_feeds_key_here",
    "User"
)
```

#### Step 3: Restart PowerShell

#### Step 4: Verify
```powershell
$env:CENSUS_API_KEY
```

---

## 6. Running the Integration Scripts

Once all API keys are set up, run the data integration scripts.

### Prerequisites
```bash
# Navigate to project directory
cd /home/user/WebApp

# Verify you're in the right place
ls FranchiseMap/scripts/
# Should show: integrate_census_api.py, populate_demographics.py, etc.
```

### Integration Order

#### Step 1: Populate Demographics (Uses Census API)
```bash
python3 FranchiseMap/scripts/integrate_census_api.py
```

**What it does:**
- Fetches real Census data using your API key
- Enriches locations with actual median income, education, employment
- Replaces simulated data with real data
- Takes 5-10 minutes depending on dataset size

**Output:**
```
✅ Census data integrated for 22,775 locations
✅ Updated: medianIncome, educationIndex, employmentRate
```

#### Step 2: Integrate Crime Data (Uses FBI API - No Key Needed)
```bash
python3 FranchiseMap/scripts/aggregate_crime_data.py
```

**What it does:**
- Fetches FBI UCR crime data
- Gets actual crime rates by county
- Updates crimeIndex field with real data
- Takes 2-5 minutes

**Output:**
```
✅ Crime data integrated for 22,775 locations
✅ Real FBI crime rates by county
```

#### Step 3: Integrate Transit Data (Uses GTFS Feeds)
```bash
python3 FranchiseMap/scripts/aggregate_gtfs_data.py
```

**What it does:**
- Downloads GTFS feeds for major US transit agencies
- Calculates distance to nearest transit stop
- Updates transitScore field with real data
- Takes 10-15 minutes (downloads required)

**Output:**
```
✅ Transit data integrated for locations near transit systems
✅ Real public transit access calculated
✅ 1,400+ agencies covered
```

#### Step 4: Integrate Employment Data (Uses BLS API)
```bash
python3 FranchiseMap/scripts/aggregate_employment_data.py
```

**What it does:**
- Fetches BLS employment statistics
- Gets unemployment rates, wages, job growth
- Updates employmentRate field with real data
- Takes 3-5 minutes

**Output:**
```
✅ Employment data integrated
✅ Real unemployment rates and wages
```

#### Step 5: Run Full Pipeline
```bash
python3 FranchiseMap/scripts/run_data_aggregation.py
```

**What it does:**
- Runs all enrichment scripts in order
- Generates quality reports
- Creates data indices
- Validates all data
- Takes 20-30 minutes total

**Output:**
```
======================================================================
DATA AGGREGATION COMPLETE
======================================================================
✓ Total Locations Processed: 22,775
✓ With Real Census Data: 22,775 (100%)
✓ With Real Crime Data: 22,000+ (98%)
✓ With Real Transit Data: 15,000+ (67% urban areas)
✓ With Real Employment Data: 22,775 (100%)
✓ Data Quality: 95%+
```

---

## 7. Troubleshooting

### Problem: "API Key Not Found"

**Error message:**
```
ERROR: CENSUS_API_KEY environment variable not set
```

**Solution:**
1. Verify you set the environment variable (Step 5)
2. Restart terminal/command prompt
3. Verify with: `echo $CENSUS_API_KEY` (Mac/Linux) or `echo %CENSUS_API_KEY%` (Windows)
4. If still not working, repeat Step 5

### Problem: "Invalid API Key"

**Error message:**
```
400 Bad Request: Invalid API Key
```

**Solution:**
1. Check you copied the key correctly (no extra spaces)
2. Verify key format (usually 40+ characters)
3. Try registering again to get a new key
4. Ensure you confirmed email verification

### Problem: "Rate Limited - Too Many Requests"

**Error message:**
```
429 Too Many Requests
```

**Solution:**
1. Census has 500 req/sec limit - usually fine
2. BLS has 500 req/week for basic tier (free)
3. Wait an hour and try again
4. Or upgrade to BLS full API (free registration)

### Problem: "No Transit Data Found"

**Error message:**
```
⚠️ No transit data found for most locations
```

**Solution:**
This is normal!
- Only ~67% of US has public transit
- Rural areas won't have transit data
- Suburban areas may have limited data
- Urban areas (>100k population) usually covered

### Problem: "FBI Crime Data Unavailable"

**Error message:**
```
Error fetching crime data from FBI
```

**Solution:**
1. FBI API sometimes has downtime
2. Try again later
3. FBI data has 2-year lag (2025 = 2023 data)
4. Not all agencies report (voluntary)

### Problem: "Script Won't Run"

**Error message:**
```
python: No module named 'requests'
```

**Solution:**
Install required library:
```bash
pip install requests
```

Or use pip3:
```bash
pip3 install requests
```

### Problem: "GTFS Download Failing"

**Error message:**
```
Failed to download GTFS feed
```

**Solution:**
1. Check internet connection
2. Some GTFS feeds are very large (100MB+)
3. Try downloading specific agency instead of all
4. Check disk space (need 1-2GB for all feeds)

---

## Quick Reference Checklist

### Before You Start
- [ ] Have you registered with Census Bureau?
- [ ] Have you registered with BLS?
- [ ] Have you downloaded GTFS feeds or registered with TransitFeeds?
- [ ] Have you copied all API keys?

### Environment Setup
- [ ] Set CENSUS_API_KEY
- [ ] Set BLS_API_KEY
- [ ] Set TRANSIT_FEEDS_API_KEY
- [ ] Restarted terminal/command prompt
- [ ] Verified keys are accessible (echo $KEY)

### Running Scripts
- [ ] Run integrate_census_api.py
- [ ] Run aggregate_crime_data.py (optional)
- [ ] Run aggregate_gtfs_data.py (optional)
- [ ] Run aggregate_employment_data.py (optional)
- [ ] Run run_data_aggregation.py
- [ ] Check data_quality_report.json

### Verification
- [ ] Check FranchiseMap in browser
- [ ] Click a location and verify real demographic data
- [ ] Check competitor analysis shows real data
- [ ] Crime index shows actual values (not 0-100 random)
- [ ] Transit scores reflect real public transit

---

## API Key Security

### ⚠️ Important Security Notes

1. **Never commit API keys to Git**
   ```
   .gitignore should contain:
   .env
   .env.local
   .env.*.local
   ```

2. **Don't share your API keys**
   - Treat like passwords
   - Use environment variables, not hardcoded
   - Rotate keys if compromised

3. **Monitor API usage**
   - Census: 500 req/sec unlimited
   - BLS: 500 req/week (basic) - upgrade if needed
   - Transit: No limits for public data
   - Crime: Public API, no authentication

4. **For Production**
   - Use environment secrets in CI/CD
   - GitHub Actions: Use Secrets feature
   - Never log API keys
   - Set rate limits to prevent abuse

---

## API Comparison Table

| API | Cost | Key Required | Setup Time | Data Freshness | Coverage |
|-----|------|--------------|------------|-----------------|----------|
| Census | FREE | Yes (free) | 5 min | Annual | All US |
| FBI Crime | FREE | No | Instant | 2-year lag | ~18k agencies |
| GTFS Transit | FREE | Optional | 10 min | Real-time | 1,400+ agencies |
| BLS Employment | FREE | Yes (free) | 5 min | Monthly | All US regions |

---

## Support & Documentation

### Official Documentation Links

**Census Bureau API:**
- Main Docs: https://api.census.gov/
- Data Variables: https://api.census.gov/data/2021/acs/acs5
- Help: https://api.census.gov/data/key_signup.html

**FBI Crime Data:**
- Explorer: https://crime-data-explorer.fr.cloud.gov/
- API Docs: https://crime-data-explorer.fr.cloud.gov/api/
- Data Definition: https://crime-data-explorer.fr.cloud.gov/downloads

**GTFS Transit Feeds:**
- Directory: https://transitfeeds.com/
- Specification: https://gtfs.org/
- Data Format: https://transitfeeds.com/

**BLS API:**
- Main Site: https://www.bls.gov/developers/
- API Docs: https://www.bls.gov/developers/api_python.htm
- Series IDs: https://www.bls.gov/help/hlpforma.htm

---

## Next Steps

Once all APIs are integrated:

1. **Review data quality:**
   ```bash
   cat FranchiseMap/data/data_quality_report.json
   ```

2. **Check updated locations:**
   ```bash
   python3 << 'EOF'
   import json
   with open('FranchiseMap/data/brands/WEN.json', 'r') as f:
       loc = json.load(f)[0]
       print("Location:", loc['n'])
       print("Real Census Income:", loc['at'].get('medianIncome'))
       print("Real Crime Index:", loc['at'].get('crimeIndex'))
       print("Real Transit Score:", loc['at'].get('transitScore'))
       print("Real Employment Rate:", loc['at'].get('employmentRate'))
   EOF
   ```

3. **View updated map:**
   - Open FranchiseMap/map.html
   - Click locations to see real data
   - All demographic fields populated with actual values

4. **Optional: Schedule automatic updates**
   - Census: Annually (data released yearly)
   - Crime: Annually (2-year lag)
   - Transit: Monthly (GTFS updates frequently)
   - Employment: Monthly (BLS releases monthly)

---

**Last Updated**: 2025-12-19
**Status**: Ready to use
**Support**: See official API docs linked above
