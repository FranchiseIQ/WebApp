# Open-Source Demographic Data Sources

This document catalogues free, open-source demographic data sources that can be integrated into the FranchiseMap system without requiring paid APIs or authentication.

## 1. U.S. Census Bureau (Primary Source)

### American Community Survey (ACS)
**URL**: https://data.census.gov/
**Data**: Income, education, employment, demographics
**Format**: CSV, JSON (via API)
**Coverage**: Census tracts, block groups, ZIP codes, counties
**Update Frequency**: Annual (5-year estimates), 1-year estimates
**Cost**: Free
**Key Metrics**:
- Median household income (B19013)
- Population density (P001001)
- Educational attainment (B06009)
- Employment status (B23001)
- Age distribution (P012)
- Household size (B11016)

**Direct Download**:
```
https://api.census.gov/data/2021/acs/acs5?get=NAME,B19013_001E&for=tract:*&in=state:06
# Requires API key (free registration)
```

### Decennial Census Data
**URL**: https://www.census.gov/data/datasets/2020/dec/
**Data**: Total population, housing, basic demographics
**Format**: CSV, shapefiles
**Coverage**: 100% of US
**Update Frequency**: Every 10 years (2020 data latest)
**Cost**: Free

### Census Bureau TIGER/Line Shapefiles
**URL**: https://www.census.gov/geographies/mapping-files/time-series/geo/tiger-line-file.html
**Data**: Geographic boundaries (counties, tracts, block groups)
**Format**: Shapefile, GeoJSON
**Usage**: Spatial joins with location data
**Cost**: Free

---

## 2. OpenStreetMap (OSM) Related Data

### Geofabrik Demographic Data
**URL**: https://www.geofabrik.de/
**Data**: Pre-processed OSM extracts with administrative boundaries
**Format**: GeoJSON, Shapefile, CSV
**Coverage**: Global, organized by region
**Cost**: Free

### OSM Building/Amenity Data
**URL**: https://www.openstreetmap.org/
**Query Tool**: Overpass API (already used in your system)
**Data Available**:
- Population estimates (from census, inferred)
- Building footprints
- Amenity locations
- Road networks
- Land use classification
**Cost**: Free (with rate limits)

### Natural Earth Data
**URL**: https://www.naturalearthdata.com/
**Data**: Global geographic, cultural, and demographic data
**Format**: Shapefile, GeoJSON, PNG raster
**Coverage**: Global at multiple scales (1:10m, 1:50m, 1:110m)
**Includes**:
- Administrative boundaries
- Urban areas (1km scale population data)
- Settlement points
- Land use
**Cost**: Free

---

## 3. Economic & Employment Data

### Bureau of Labor Statistics (BLS)
**URL**: https://www.bls.gov/
**Data**: Employment, unemployment, wages, prices
**Format**: JSON, CSV (via API)
**Coverage**: Metropolitan Statistical Areas, states, counties
**Key Metrics**:
- Unemployment rates
- Average wages
- Job growth rates
- Consumer Price Index (CPI)
**Cost**: Free API
**Example API**:
```
https://api.bls.gov/publicAPI/v2/timeseries/LAUS<<state_code>>00000003
# Unemployment rate by state/month
```

### OEWS (Occupational Employment Statistics)
**URL**: https://www.bls.gov/oes/
**Data**: Employment and wage statistics by occupation
**Format**: CSV
**Coverage**: Metropolitan areas, states, national
**Cost**: Free
**Update Frequency**: Annual

### Quarterly Workforce Indicators (QWI)
**URL**: https://qwiexplorer.ces.census.gov/
**Data**: Employment, earnings, hiring, separations by industry
**Format**: CSV, API
**Coverage**: County level and metros
**Cost**: Free
**Granularity**: Quarterly by age, gender, education, race, industry

---

## 4. Crime & Safety Data

### FBI Uniform Crime Reporting (UCR)
**URL**: https://crime-data-explorer.fr.cloud.gov/
**Data**: Crime rates, offense types, clearance rates
**Format**: CSV, JSON API
**Coverage**: State, county, city level
**Update Frequency**: Annual (with ~2-year lag)
**Cost**: Free
**Types**: Violent crime, property crime, arson, human trafficking
**Note**: Voluntarily reported by law enforcement (coverage gaps)

### NeighborhoodScout Crime Index
**URL**: https://www.neighborhoodscout.com/research/crime-rates/
**Data**: Crime index by neighborhood/city
**Format**: HTML (scrapeable), partial JSON APIs
**Cost**: Mostly free (detailed analysis paid)
**Coverage**: Extensive US coverage

---

## 5. Real Estate & Housing Data

### Zillow Research
**URL**: https://www.zillow.com/research/
**Data**: Home values, rental data, market trends
**Format**: CSV downloads
**Coverage**: Zip code, county, metro
**Cost**: Free (some restrictions on usage)
**Metrics**:
- Zillow Home Value Index (ZHVI)
- Zillow Rent Index (ZRI)
- Price-to-rent ratios
**Note**: Some data behind paywall, free tier available

### Redfin Market Data
**URL**: https://www.redfin.com/research
**Data**: Home prices, inventory, days on market
**Format**: CSV, JSON API
**Cost**: Partially free
**Coverage**: City and zip code level

### HUD Housing Data
**URL**: https://www.huduser.gov/portal/datasets/lihtc.html
**Data**: Low-income housing tax credit properties
**Format**: CSV
**Cost**: Free
**Coverage**: Nationwide affordable housing inventory

---

## 6. Education & Student Data

### NCES Common Core of Data (CCD)
**URL**: https://nces.ed.gov/ccd/
**Data**: School locations, enrollment, demographics
**Format**: CSV
**Coverage**: All US public schools
**Cost**: Free
**Includes**:
- School district boundaries
- Student enrollment by grade, race, demographics
- School performance metrics
- Per-pupil spending

### IPEDS (Integrated Postsecondary Education)
**URL**: https://nces.ed.gov/ipeds/
**Data**: College and university data
**Format**: CSV, IPEDS Analytics portal
**Cost**: Free
**Includes**:
- Institution locations
- Enrollment data
- Degrees awarded
- Student demographics

---

## 7. Traffic & Transportation Data

### USDOT Office of Transportation Statistics
**URL**: https://www.bts.gov/
**Data**: AADT (Annual Average Daily Traffic), congestion indices
**Format**: CSV, GIS layers
**Cost**: Free
**Coverage**: Major highways and interstates
**Update Frequency**: Annual

### Federal Highway Administration (FHWA) Traffic Volume Data
**URL**: https://www.fhwa.dot.gov/policyinformation/tables/tmasdata/
**Data**: Traffic monitoring for highways
**Format**: CSV, Excel
**Cost**: Free
**Coverage**: Interstate and US highways

### GTFS (General Transit Feed Specification) Feeds
**URL**: https://transitfeeds.com/ and agency websites
**Data**: Public transit routes, schedules, stops
**Format**: GTFS (CSV-based zip files)
**Cost**: Free
**Coverage**: 1,400+ agencies in ~100 countries

**Major US Transit GTFS Feeds**:
- NYC MTA: http://web.mta.info/developers/
- BART: http://api.bart.gov/gtfs/
- LA Metro: https://developer.metro.net/
- SEPTA: https://www3.septa.org/gtfs/
- Most agencies provide GTFS feeds for free

---

## 8. Demographic Geocoding & Boundary Services

### Census Tract/Block Group Boundaries (Shapefiles)
**URL**: https://www.census.gov/cgi-bin/geo/shapefiles/index.php
**Data**: Administrative geographic boundaries
**Format**: Shapefile (GIS-compatible)
**Cost**: Free
**Usage**: Spatial joins to assign census data to locations

### Google Maps API (Free Tier)
**URL**: https://developers.google.com/maps/documentation
**Data**: Geocoding, reverse geocoding
**Format**: JSON, XML
**Cost**: Free tier (first $200 credit/month)
**Rate**: 25,000 geocodes/day free
**Note**: Much cheaper than commercial alternatives

### Nominatim (OSM Geocoding)
**URL**: https://nominatim.org/
**Data**: Geocoding via OpenStreetMap
**Format**: JSON
**Cost**: Free (with rate limits: 1 req/sec)
**No API key required**: Can be self-hosted
**Rate Limit**: 1 request per second for public use

---

## 9. Urban/Rural Classification

### USDA Rural-Urban Commuting Area Code (RUCA)
**URL**: https://www.ers.usda.gov/webdocs/DataProducts/
**Data**: Classification of urban, rural, commuting patterns
**Format**: CSV with ZIP codes
**Cost**: Free
**Classification Codes**: 10 categories from urban core to isolated rural

### Census Urban/Rural Classification
**URL**: https://www.census.gov/programs-surveys/geography/guidance/geo-areas/urban-rural.html
**Data**: Official urban/rural status
**Format**: Shapefile, CSV
**Cost**: Free

---

## 10. Population & Growth Projections

### Census Bureau Population Projections
**URL**: https://www.census.gov/topics/population/projections.html
**Data**: Demographic projections (5-year, 10-year, 25-year)
**Format**: CSV, interactive tables
**Cost**: Free
**Coverage**: State level primarily (some metro areas)

### Moody's Analytics Demographic Forecasts
**URL**: https://www.moodysanalytics.com/
**Data**: Population growth forecasts
**Cost**: Subscription model (free estimates available)
**Note**: Some free access via partner sites

---

## 11. Environmental & Climate Data

### NOAA Climate Data
**URL**: https://www.ncdc.noaa.gov/cdo-web/
**Data**: Temperature, precipitation, climate normals
**Format**: CSV, NetCDF
**Cost**: Free
**Coverage**: Weather stations across US

### EPA Air Quality Data
**URL**: https://aqs.epa.gov/aqsweb/
**Data**: Air quality measurements, pollution indices
**Format**: CSV, XML, JSON API
**Cost**: Free
**Coverage**: EPA monitors nationwide

---

## 12. Public Health Data

### CDC/NCHS Vital Statistics
**URL**: https://www.cdc.gov/nchs/nvsr/
**Data**: Birth rates, mortality, life expectancy
**Format**: CSV, Excel
**Cost**: Free

### County Health Rankings Data
**URL**: https://www.countyhealthrankings.org/
**Data**: Health outcomes, health factors by county
**Format**: CSV downloads
**Cost**: Free

---

## 13. Business & Industry Data

### Census Bureau Economic Census
**URL**: https://www.census.gov/topics/econ/census-of-the-economy.html
**Data**: Business establishments, employment, revenue by industry
**Format**: CSV, Excel
**Cost**: Free
**Coverage**: Industry, geography
**Update Frequency**: 5 years

### BEA (Bureau of Economic Analysis) Regional Data
**URL**: https://www.bea.gov/data/gdp/gdp-county-metro
**Data**: Gross Domestic Product by region, metro area
**Format**: CSV, Excel
**Cost**: Free
**Coverage**: County and metropolitan areas

---

## 14. Distance/Routing Data

### OpenStreetMap Road Network
**URL**: https://www.openstreetmap.org/
**Data**: Complete road/street network
**Tools**: OSRM (Open Source Routing Machine)
**Cost**: Free
**Usage**: Calculate driving distances, travel times
**Self-hostable**: Yes, for large-scale operations

### GraphHopper
**URL**: https://www.graphhopper.com/
**Data**: Routing based on OSM
**Format**: JSON API
**Cost**: Free tier available
**Rate**: 1000 requests/day free

---

## Integration Strategy for FranchiseMap

### Phase 1: Immediate Implementation (Highest Value)
1. **Census Bureau API Integration**
   - Median income (B19013)
   - Population density (P001001)
   - Education (B06009)
   - Employment (B23001)
   - Cost: Free with registration

2. **GTFS Transit Data**
   - Integrate major transit systems
   - Calculate actual distance to nearest transit
   - Replace hardcoded transit systems
   - Cost: Free, available for 1,400+ agencies

3. **FBI Crime Data**
   - Replace simulated crime indices
   - Use actual UCR data by county/city
   - Cost: Free from FBI data explorer

### Phase 2: Enhanced Data (Medium Priority)
1. **BLS Employment Data**
   - Real unemployment rates
   - Wage data
   - Job growth statistics

2. **USDA RUCA Classification**
   - Classify locations as urban/suburban/rural
   - More accurate than current method
   - Inform traffic/density estimates

3. **School Quality Data (NCES)**
   - Nearby school information
   - Student demographics
   - Educational attainment patterns

### Phase 3: Advanced Analytics (Future)
1. **Real Estate Market Integration**
   - Zillow or Redfin housing data
   - Price trends
   - Market inventory

2. **Climate & Environmental**
   - Weather patterns
   - Air quality
   - Natural disaster risk

3. **Population Projections**
   - Growth forecasts
   - Demographic trends
   - Market demand prediction

---

## Data Quality Considerations

### Census Data Limitations
- **Privacy**: Suppressed data for small areas
- **Lag**: Data 2-3 years old typically
- **Margin of Error**: ACS data has uncertainty bands
- **Coverage**: Some areas have low sample sizes

### Crime Data Limitations
- **Voluntarily Reported**: Not all agencies report
- **Privacy**: Some detailed information redacted
- **Lag**: Published data typically 2 years old
- **Definition Variance**: Crimes defined differently by jurisdiction

### Transit Data Limitations
- **Service Hours**: Data reflects schedule, not actual ridership
- **Coverage Gaps**: Small towns may lack GTFS
- **Changes**: Agencies update feeds frequently
- **Speed**: Actual travel time varies (congestion, etc.)

---

## Free Data API Endpoints (Ready to Use)

### Census Bureau API
```
https://api.census.gov/data/2021/acs/acs5?
  get=B19013_001E,B06009_001E,B23001_001E
  &for=tract:*
  &in=state:06
  &key=YOUR_API_KEY
```

### FBI Crime Data
```
https://crime-data-explorer.fr.cloud.gov/api/
```

### GTFS Data Feeds
```
https://api.transitfeeds.com/v1/feeds?key=YOUR_KEY
```

### OpenStreetMap Overpass
```
https://overpass-api.de/api/interpreter?data=[...]
```

### Nominatim Geocoding
```
https://nominatim.openstreetmap.org/reverse?lat=40.7128&lon=-74.0060
```

---

## Recommended Priority Implementation

**Highest Impact / Easiest to Implement**:
1. Census API for income/education/employment
2. FBI UCR crime data
3. GTFS feeds for transit accuracy
4. RUCA classification for urban/rural

**Medium Effort / Good ROI**:
1. BLS employment data
2. School location/quality data
3. Zillow ZHVI (limited free tier)

**Complex / Future Consideration**:
1. Real estate market deep integration
2. Climate/environmental data
3. Population projection modeling

---

## Getting Started

### Step 1: Register for Free APIs
1. Census Bureau: https://api.census.gov/data/key_signup.html
2. TransitFeeds: https://transitfeeds.com/register
3. BLS: https://www.bls.gov/developers/

### Step 2: Download Bulk Data
- FBI UCR: https://crime-data-explorer.fr.cloud.gov/
- Census Shapefiles: https://www.census.gov/cgi-bin/geo/shapefiles/
- GTFS Feeds: https://transitfeeds.com/

### Step 3: Create Data Processing Scripts
- Parse CSV/JSON from sources
- Perform spatial joins with location data
- Validate data quality
- Store in JSON format

### Example Script Structure
```python
# aggregate_census_api_data.py - Fetch real Census data
# aggregate_crime_data.py - Get FBI UCR data
# aggregate_gtfs_data.py - Process GTFS feeds
# aggregate_employment_data.py - BLS wage/employment data
```

---

**Last Updated**: 2025-12-19
**Format**: Markdown guide with API references
**Target**: Integration with FranchiseMap demographic enrichment system
