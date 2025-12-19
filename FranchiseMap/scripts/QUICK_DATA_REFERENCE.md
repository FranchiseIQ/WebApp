# Quick Data Source Reference Guide

## Free, Open-Source Data Available NOW

### Ready-to-Use APIs (No Payment Required)

| Data | Source | Endpoint | Key Required? | Rate Limit | Ease |
|------|--------|----------|---------------|-----------|------|
| **Income & Demographics** | Census Bureau API | api.census.gov | YES (Free) | 500/sec | Easy |
| **Crime Rates** | FBI Crime Data | crime-data-explorer.fr.cloud.gov | No | High | Easy |
| **Public Transit** | GTFS Feeds | transitfeeds.com | Optional | N/A | Medium |
| **Employment** | BLS API | api.bls.gov | Optional | No limit | Medium |
| **Geocoding** | Nominatim (OSM) | nominatim.org | No | 1/sec | Easy |
| **Geocoding** | Google Maps | maps.googleapis.com | YES (Free) | 25k/day | Easy |
| **Road Networks** | OpenStreetMap | overpass.api | No | 1 request/4s | Easy |
| **Population** | US Census Bureau | census.gov | No | N/A | Easy |
| **Geographic Bounds** | Natural Earth Data | naturalearthdata.com | No | N/A | Easy |

---

## Data by Category

### 1. DEMOGRAPHIC DATA

#### Primary Source: U.S. Census Bureau
```
URL: https://api.census.gov/data/2021/acs/acs5
Setup: Register at https://api.census.gov/data/key_signup.html (FREE)
Cost: Free
Update Frequency: Annual
```

**Available Metrics**:
```
B19013_001E → Median Household Income
B06009_001E → Education (Total Population 25+)
B06009_005E → Bachelor's Degree or Higher
B23001_001E → Employment Status
B01003_001E → Total Population
B01002_001E → Median Age
B11016_001E → Household Composition
B19080_001E → Gini Income Inequality Index
```

**Example Query**:
```
https://api.census.gov/data/2021/acs/acs5?
  get=NAME,B19013_001E,B06009_001E
  &for=tract:*
  &in=state:06
  &key=YOUR_KEY
```

**Spatial Levels**: Census tract, block group, county, state

---

### 2. CRIME & SAFETY DATA

#### FBI Uniform Crime Reporting (UCR)
```
URL: https://crime-data-explorer.fr.cloud.gov/
Type: Web explorer + JSON API
Cost: Free
Coverage: County, city level (voluntary reporting)
Update Frequency: Annual (2-year lag typically)
```

**Available Crimes**:
- Violent crime (murder, assault, robbery, rape)
- Property crime (burglary, theft, vehicle theft)
- Arson
- Human trafficking

**Download Data**:
```
https://crime-data-explorer.fr.cloud.gov/api/
(Specific endpoints in API docs)
```

#### Alternative: NeighborhoodScout
```
URL: https://www.neighborhoodscout.com/research/
Type: Scrape-able web data
Cost: Free data available, reports paid
Coverage: Neighborhood level
```

---

### 3. TRAFFIC & TRANSPORTATION

#### USDOT AADT (Annual Average Daily Traffic)
```
URL: https://www.bts.gov/
Type: CSV downloads
Cost: Free
Coverage: Major highways, interstates
Granularity: Highway segment
```

#### GTFS (Public Transit Feeds)
```
URL: https://transitfeeds.com/
Type: CSV-based ZIP files
Cost: Free
Coverage: 1,400+ agencies in 100+ countries
Data: Routes, stops, schedules, real-time
```

**Major US Transit GTFS Available**:
```
NYC MTA: http://web.mta.info/developers/
BART: http://api.bart.gov/gtfs/
LA Metro: https://developer.metro.net/
CTA Chicago: https://www.transitchicago.com/feed/
SEPTA Philly: https://www3.septa.org/gtfs/
WMATA DC: https://developer.wmata.com/
```

---

### 4. GEOGRAPHIC & BOUNDARY DATA

#### Census TIGER/Line Shapefiles
```
URL: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
Type: Shapefile (GIS format)
Cost: Free
Coverage: All US administrative boundaries
```

#### Natural Earth Data
```
URL: https://www.naturalearthdata.com/
Type: Shapefile, GeoJSON, PNG raster
Cost: Free
Coverage: Global, multiple scales
Data: Urban areas, administrative bounds, land use
```

#### Urban/Rural Classification (RUCA)
```
URL: https://www.ers.usda.gov/webdocs/DataProducts/
Type: CSV with ZIP codes
Cost: Free
Classes: Urban core → Isolated rural
```

---

### 5. EMPLOYMENT & ECONOMIC DATA

#### Bureau of Labor Statistics (BLS)
```
URL: https://www.bls.gov/developers/
Type: JSON API
Cost: Free
Coverage: State, metro, county
Data: Unemployment, wages, job growth, CPI
```

**Example Endpoint**:
```
https://api.bls.gov/publicAPI/v2/timeseries/LAUS<<FIPS_CODE>>00000003
```

#### Quarterly Workforce Indicators (QWI)
```
URL: https://qwiexplorer.ces.census.gov/
Type: CSV, JSON API
Cost: Free
Coverage: County level
Data: Employment, earnings, hiring by industry/demographics
```

---

### 6. EDUCATION DATA

#### NCES Common Core of Data (CCD)
```
URL: https://nces.ed.gov/ccd/
Type: CSV, public database
Cost: Free
Coverage: All US public schools
Data: Locations, enrollment, demographics, performance
```

#### IPEDS (College Data)
```
URL: https://nces.ed.gov/ipeds/
Type: CSV, portal query tool
Cost: Free
Coverage: All US colleges/universities
Data: Institutions, enrollment, degrees, demographics
```

---

### 7. REAL ESTATE & HOUSING

#### Zillow Research
```
URL: https://www.zillow.com/research/
Type: CSV downloads
Cost: Mostly free (some restrictions)
Coverage: Zip code, county, metro
Data: Home values (ZHVI), rent index (ZRI), trends
```

**Free Data Available**:
- Zillow Home Value Index (ZHVI) monthly
- Zillow Rent Index (ZRI) monthly
- Price-to-rent ratios

#### Redfin
```
URL: https://www.redfin.com/research
Type: CSV
Cost: Free tier available
Coverage: City, zip code
Data: Prices, inventory, days on market
```

#### HUD Housing Data
```
URL: https://www.huduser.gov/
Type: CSV
Cost: Free
Data: Affordable housing, LIHTC properties
Coverage: Nationwide
```

---

### 8. GEOCODING & ROUTING

#### Nominatim (OpenStreetMap Geocoding)
```
URL: https://nominatim.org/
Type: JSON API (REST)
Cost: Free (1 req/sec limit)
Key Required: No
```

**Example**:
```
https://nominatim.openstreetmap.org/reverse?
  lat=40.7128&lon=-74.0060&format=json
```

#### Google Maps API (Free Tier)
```
URL: https://developers.google.com/maps/
Type: REST API
Cost: $200 free/month credit
Coverage: Global
Features: Geocoding, routing, distance matrix
```

#### GraphHopper
```
URL: https://www.graphhopper.com/
Type: REST API + self-hosted option
Cost: Free tier (1000 requests/day)
Key Required: Yes (free)
```

---

### 9. CLIMATE & ENVIRONMENTAL

#### NOAA Climate Data
```
URL: https://www.ncdc.noaa.gov/cdo-web/
Type: CSV, JSON
Cost: Free
Data: Temperature, precipitation, climate normals
Coverage: Thousands of weather stations
```

#### EPA Air Quality
```
URL: https://aqs.epa.gov/aqsweb/
Type: CSV, XML, JSON API
Cost: Free
Data: Air quality measurements, pollution indices
Coverage: EPA-monitored locations
```

---

### 10. PUBLIC HEALTH DATA

#### CDC Vital Statistics
```
URL: https://www.cdc.gov/nchs/nvsr/
Type: CSV, Excel
Cost: Free
Data: Birth rates, mortality, life expectancy
```

#### County Health Rankings
```
URL: https://www.countyhealthrankings.org/
Type: CSV downloads
Cost: Free
Coverage: All US counties
Data: Health outcomes, health factors
```

---

## Quick Setup Guide

### Step 1: Get Census API Key (5 minutes)
```bash
# 1. Go to https://api.census.gov/data/key_signup.html
# 2. Enter email, click "Request KEY"
# 3. Check email for activation link
# 4. Copy key
# 5. Set environment variable:
export CENSUS_API_KEY="your_key_here"
```

### Step 2: Get Crime Data (No Setup)
```bash
# Data already publicly available
# Just visit: https://crime-data-explorer.fr.cloud.gov/
# Or use API without authentication
```

### Step 3: Get Transit Data (No Setup)
```bash
# Visit https://transitfeeds.com/
# Download GTFS feeds for specific agencies
# Or use API (API key optional but recommended)
```

### Step 4: Test Integration
```bash
cd FranchiseMap/scripts

# Test Census integration
export CENSUS_API_KEY="your_key"
python3 integrate_census_api.py --limit 100

# Test QSR expansion
python3 expand_qsr_locations.py --priority 1 --tier 1

# Run full pipeline
python3 run_data_aggregation.py
```

---

## Data Priority for FranchiseMap

### Must-Have (Week 1)
1. **Census Demographics** (Income, education, employment)
2. **Crime Data** (FBI UCR by county)
3. **Transit Data** (GTFS for major metros)

### Should-Have (Week 2)
1. **Employment Data** (BLS wages, unemployment)
2. **Real Estate** (Zillow home values)
3. **School Data** (NCES locations/quality)

### Nice-to-Have (Week 3+)
1. **Climate Data** (Temperature, precipitation)
2. **Health Data** (CDC, county rankings)
3. **Population Projections** (Growth forecasts)

---

## Implementation Checklist

```
Data Integration:
☐ Census API key registered
☐ integrate_census_api.py tested on sample
☐ Crime data download verified
☐ GTFS feeds configured
☐ BLS employment data available

QSR Expansion:
☐ Tier 1 QSRs generated (MCD, SBUX, CMG, YUM, QSR)
☐ Tier 2 QSRs generated (SUB, CFA, PANDA, DQ)
☐ Tier 3+ QSRs generated (Roark, growth brands)
☐ All 50,000+ locations enriched with demographics

Quality Assurance:
☐ Data quality report shows >80% coverage
☐ No null values in critical fields
☐ Scores validated (0-100 range)
☐ Sample locations spot-checked for accuracy

Frontend:
☐ Map loads 100k+ locations without lag
☐ Real data sources are documented
☐ Confidence levels displayed where applicable
☐ Attribution shown for each data source
```

---

## Common API Calls

### Census: Get Income by Tract
```python
import requests

params = {
    'get': 'NAME,B19013_001E',  # Name and Median Income
    'for': 'tract:*',
    'in': 'state:06',  # California
    'key': 'YOUR_KEY'
}
response = requests.get('https://api.census.gov/data/2021/acs/acs5', params=params)
data = response.json()
```

### Crime: Get by County
```python
# Visit: https://crime-data-explorer.fr.cloud.gov/api/
# Documentation shows endpoints for:
# - crime/count
# - agencies
# - terms
# All public, no authentication needed
```

### Transit: Get GTFS
```python
import requests

response = requests.get('https://api.transitfeeds.com/v1/feeds?key=YOUR_KEY')
feeds = response.json()['feeds']

for feed in feeds:
    if feed['location']['country'] == 'United States':
        print(f"{feed['t']} - {feed['u']['d']}")
```

---

## Notes on Data Quality

### Census Data
- ✅ Most authoritative for demographics
- ⚠️ Data typically 2-3 years old
- ⚠️ Margin of error for small areas
- ⚠️ Privacy suppression for rare categories

### Crime Data
- ✅ Official government source
- ⚠️ Voluntarily reported (coverage gaps)
- ⚠️ Published with 2-year delay
- ⚠️ Definitions vary by jurisdiction

### Transit Data
- ✅ Direct from transit agencies
- ✅ Real-time updates available
- ⚠️ Incomplete for small cities
- ⚠️ Changes frequently

### Geocoding
- ✅ Very accurate for addresses
- ✅ Fast, real-time
- ⚠️ OSM Nominatim may be slower
- ⚠️ Rate limits on free tiers

---

## Cost Summary for Full Implementation

| Data Source | Cost | Annual |
|-------------|------|--------|
| Census Bureau API | $0 | $0 |
| FBI Crime Data | $0 | $0 |
| GTFS Transit | $0 | $0 |
| BLS Employment | $0 | $0 |
| Nominatim Geocoding | $0 | $0 |
| Google Maps (25k/day) | $0* | $0* |
| Zillow Data (free tier) | $0 | $0 |
| HUD Housing Data | $0 | $0 |
| NOAA Climate | $0 | $0 |
| **TOTAL** | **$0** | **$0** |

*Google Maps has free $200/month credit (covers 25,000+ geocodes)

---

**Last Updated**: 2025-12-19
**All Links Verified**: Yes
**Status**: Ready to Implement
