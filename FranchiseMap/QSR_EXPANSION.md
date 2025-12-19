# QSR Location Expansion & Open Data Integration

## Overview

This initiative expands FranchiseMap from **15,425 locations (10 QSR brands)** to a comprehensive **national QSR database** by:

1. **Generating locations for 40+ missing QSR chains** defined in code but not yet populated
2. **Integrating authoritative open-source demographic data** to replace simulated data
3. **Building a real-data foundation** for franchise site selection analysis

## Current State vs. Target

### Current Coverage (As of 2025-12-19)
| Category | Count |
|----------|-------|
| QSR Brands Tracked | 10 |
| Total Locations | 15,425 |
| Data Type | 100% Simulated |

### Target State (After Expansion)
| Category | Count |
|----------|-------|
| QSR Brands Tracked | 50+ |
| Total Locations | 100,000+ |
| Real Data Sources | Census, DOT, FBI, GTFS, etc. |

## Missing QSRs by Priority

### TIER 1: Critical - Top 5 National Chains (Est. 60,000+ locations)

| Ticker | Chain(s) | Est. US Locations | Category |
|--------|----------|-------------------|----------|
| **MCD** | McDonald's | 13,500 | Fast Food Burgers |
| **SBUX** | Starbucks | 15,000 | Coffee/Beverages |
| **CMG** | Chipotle | 3,200 | Fast Casual Mexican |
| **YUM** | KFC, Taco Bell, Pizza Hut | 30,000 | Yum! Brands |
| **QSR** | Burger King, Popeyes, Tim Hortons | 18,000 | RBI Portfolio |

**Impact**: Adding just these 5 would **4x the dataset** to ~75,000 locations

### TIER 2: High Priority - Major Brands (Est. 25,000+ locations)

| Ticker | Chain(s) | Est. Locations |
|--------|----------|-----------------|
| **SUB** | Subway | 21,000 |
| **CFA** | Chick-fil-A | 3,000 |
| **PANDA** | Panda Express | 2,400 |
| **DQ** | Dairy Queen | 4,500 |
| **LCE** | Little Caesars | 4,000 |
| **PZZA** | Papa John's | 3,200 |
| **PANERA** | Panera Bread | 2,100 |

### TIER 3: Additional Chains (Est. 20,000+ locations)

- **Roark Capital Portfolio**: Arby's, Buffalo Wild Wings, Sonic, Dunkin', Cinnabon, etc. (~15,000)
- **Growing Concepts**: Five Guys, Raising Cane's, Dutch Bros (~3,000)
- **Regional Leaders**: In-N-Out, Whataburger, Zaxby's, Bojangles (~3,000)

## Getting Started

### Quick Start: Generate Missing QSRs

```bash
# 1. Generate Tier 1 (critical) QSRs
cd FranchiseMap/scripts
python3 expand_qsr_locations.py --priority 1 --tier 1

# 2. Generate Tier 2 (high priority)
python3 expand_qsr_locations.py --priority 2 --tier 2

# 3. Generate all remaining tiers
python3 expand_qsr_locations.py --tier 6
```

**Expected Output**:
- ~60,000-70,000 new locations
- New JSON files in `FranchiseMap/data/brands/`
- Updated `manifest.json` with new brands
- Data quality report

### Step 2: Integrate Real Census Data

```bash
# Get free Census API key
# 1. Go to: https://api.census.gov/data/key_signup.html
# 2. Register for free account
# 3. Copy your API key

# 4. Set environment variable
export CENSUS_API_KEY="your_key_here"

# 5. Enrich locations with real Census data
python3 integrate_census_api.py

# Optional: Process specific ticker
python3 integrate_census_api.py --ticker WEN
```

### Step 3: Add Additional Open Data

```bash
# (Future implementations)

# FBI Crime Data (Real crime rates replace simulated)
# python3 aggregate_crime_data.py

# GTFS Transit Data (Real transit accuracy)
# python3 aggregate_gtfs_data.py

# BLS Employment Data (Real wage/employment stats)
# python3 aggregate_employment_data.py
```

### Step 4: Run Full Data Pipeline

```bash
# Run complete enrichment pipeline
python3 run_data_aggregation.py

# View quality report
cat ../data/data_quality_report.json
```

## Available Open Data Sources

See **OPEN_DATA_SOURCES.md** for complete documentation of:

### High Priority (Easiest to integrate)
1. **U.S. Census Bureau API** (FREE)
   - Median income, education, employment, demographics
   - API: https://api.census.gov/
   - Get key: https://api.census.gov/data/key_signup.html

2. **FBI Uniform Crime Reporting** (FREE)
   - Crime rates by county/city
   - API: https://crime-data-explorer.fr.cloud.gov/

3. **GTFS Transit Feeds** (FREE)
   - 1,400+ public transit agencies
   - Feeds at: https://transitfeeds.com/

4. **Bureau of Labor Statistics** (FREE)
   - Employment, wages, unemployment
   - API: https://www.bls.gov/developers/

### Medium Priority
- USDA Rural-Urban Classification
- School quality data (NCES)
- Real estate indices (Zillow, partial free tier)

### Advanced
- Climate/weather data (NOAA)
- Population projections
- Business census data

## Expected Improvements

### Data Quality Metrics

**Before**:
```
Total Locations: 22,775
With Demographics: 0 (0%)
With Accessibility: 0 (0%)
With Traffic Data: 22,775 (100% simulated)
```

**After Expansion**:
```
Total Locations: 100,000+
With Demographics: 80,000+ (80%)
With Crime Data: 70,000+ (70%)
With Transit Data: 40,000+ (40% urban areas)
With Real Data: 85,000+ (85%)
```

### Visualization Improvements

**Current Map**:
- Shows 15,425 locations
- All demographic data is pseudo-random
- Limited brand diversity

**Expanded Map**:
- Shows 100,000+ locations
- Real Census demographics
- Actual crime, transit, employment data
- 50+ franchise brands
- Accurate site suitability scoring

## Implementation Timeline

### Phase 1: Location Generation (1-2 days)
- [ ] Generate Tier 1 QSRs (McDonald's, Starbucks, Chipotle, etc.)
- [ ] Verify location counts match national estimates
- [ ] Update manifest.json
- [ ] Run data quality checks

### Phase 2: Census Integration (1-2 days)
- [ ] Set up Census API key
- [ ] Implement Census tract lookup
- [ ] Batch process all 80,000+ locations
- [ ] Validate demographic data accuracy
- [ ] Generate updated quality report

### Phase 3: Additional Data Sources (1-2 days)
- [ ] Integrate FBI crime data
- [ ] Add GTFS transit feed processing
- [ ] Include BLS employment data
- [ ] Combine all sources in enrichment pipeline

### Phase 4: Frontend Integration (1-2 days)
- [ ] Update map to handle 100k+ locations
- [ ] Add filtering by real demographics
- [ ] Show real accessibility metrics
- [ ] Implement data source attribution

### Phase 5: Automation (1 day)
- [ ] Schedule monthly full refresh
- [ ] Set up data quality monitoring
- [ ] Create PR workflow for data updates
- [ ] Document maintenance procedures

## Scripts Available

### Location Generation
```
expand_qsr_locations.py
├── Priority-based QSR generation
├── Support for 40+ brands
├── OpenStreetMap data fetching
├── Automatic manifest updates
└── Summary reporting
```

### Data Enrichment
```
integrate_census_api.py
├── Census Bureau API integration
├── Tract/block group lookup
├── Demographic extraction
├── Score recalculation
└── Source attribution
```

```
aggregate_crime_data.py (TODO)
├── FBI UCR data integration
├── County/city crime rates
├── Crime index calculation
└── Data validation
```

```
aggregate_gtfs_data.py (TODO)
├── GTFS feed processing
├── Transit stop proximity
├── Accurate transit scoring
└── Service area mapping
```

## Data Validation

### Quality Checks Performed

1. **Location Completeness**
   - All locations have lat/lng
   - All locations have name/address
   - No duplicate IDs

2. **Demographic Validation**
   - Income within realistic ranges ($20k-$250k)
   - Education 0-100%
   - Employment 0-100%
   - Density reasonable (not negative)

3. **Score Validation**
   - Scores 0-100
   - Sub-scores proportional
   - Scoring logic consistent

4. **Data Source Documentation**
   - All fields have source attribution
   - API data vs. calculated vs. simulated labeled
   - Timestamps recorded

### Running Quality Checks

```bash
python3 run_data_aggregation.py

# Output: data_quality_report.json with:
# - Coverage percentages
# - Data type breakdown
# - Missing data statistics
# - Quality by brand
```

## API Endpoints Created

### Census Bureau
```
GET /data/2021/acs/acs5?get=B19013_001E,B06009_001E&for=tract:*&in=state:06
```

### FBI Crime Explorer
```
GET /api/crimes/...
```

### GTFS (Static)
```
https://transitfeeds.com/api/1/feeds
```

## Performance Considerations

### Current System
- 22,775 locations: ~50MB data
- Map loads in: ~2 seconds
- Filtering: Real-time (all data in browser)

### After Expansion
- 100,000+ locations: ~200MB data
- Recommended: Progressive loading or server-side filtering
- Pagination: Load by region or brand

### Optimization Options

1. **Geographic Tiling**
   - Split by state or metro area
   - Load tiles on map pan/zoom

2. **Server-Side Filtering**
   - REST API for filtered results
   - Caching by filter combination

3. **Data Compression**
   - Reduce attribute storage
   - Gzip compression
   - Binary format (MessagePack) alternative

## Troubleshooting

### Issue: "Too many locations from OSM"

**Solution**: Limit by bounding box or use smaller area queries

### Issue: "Census API rate limiting"

**Solution**: Add request batching and caching (150 requests/min limit)

### Issue: "Location accuracy concerns"

**Solution**:
- Verify OSM data quality per area
- Cross-reference with brand official data
- Flag low-confidence locations

### Issue: "Demographic data gaps"

**Solution**:
- Use state-level fallback for rural areas
- Interpolate from nearby tracts
- Document confidence levels per location

## Contributing

To add new data sources:

1. Create `aggregate_[datasource].py` script
2. Follow the pattern:
   ```python
   def fetch_data(locations): ...
   def enrich_location(location, data): ...
   def main(): ...
   ```
3. Add to `run_data_aggregation.py`
4. Document in `OPEN_DATA_SOURCES.md`
5. Add quality checks for new data
6. Submit PR with sample results

## Next Steps

1. **Immediate**: Run `expand_qsr_locations.py` for Tier 1 QSRs
2. **This week**: Set up Census API integration
3. **Next week**: Add crime and employment data
4. **Following week**: Optimize frontend for large dataset

## Resources

- **Census Bureau**: https://api.census.gov/
- **FBI Crime Data**: https://crime-data-explorer.fr.cloud.gov/
- **Transit Feeds**: https://transitfeeds.com/
- **OpenStreetMap**: https://www.openstreetmap.org/
- **USDA RUCA**: https://www.ers.usda.gov/webdocs/DataProducts/

## Questions?

Refer to:
- `OPEN_DATA_SOURCES.md` - Complete data source documentation
- `DATA_AGGREGATION.md` - Technical implementation details
- Script docstrings for usage examples

---

**Last Updated**: 2025-12-19
**Status**: Planning Phase
**Next Milestone**: Tier 1 QSR Generation
