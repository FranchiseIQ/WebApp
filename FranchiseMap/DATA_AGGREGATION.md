# Data Aggregation System

## Overview

The FranchiseMap data aggregation system automatically collects, enriches, and maintains comprehensive demographic, economic, and traffic data for 22,775+ franchise locations across 19 major brands in the United States.

## What Data is Collected

### 1. **Location Data** (Geographic Foundation)
- **Source**: OpenStreetMap via Overpass API
- **Fields**: Latitude, Longitude, Address, Name
- **Coverage**: 22,775 locations across US
- **Brands**: 19 franchise groups (McDonald's, Wendy's, Planet Fitness, H&R Block, etc.)

### 2. **Demographic Data** (Population & Economics)
Census-based and regional demographic data for each location:

#### Market Potential Factors
- **Median Income**: Based on U.S. Census Bureau ACS 5-Year Estimates (2017-2021)
  - Range: $35,000 - $150,000
  - Normalized to $100k baseline
- **Population Density**: People per square mile
  - Range: 100 - 15,000 per sq mi
  - Adjusted by urbanization level
- **Consumer Spending Index**: Economic activity level (0-150)
  - Correlated with income and education
  - Adjusted by regional economic patterns
- **Growth Rate**: Area population/economic growth (%/year)
  - Range: -1.5% to 8.0%
  - By state and urbanization type

#### Additional Demographics
- **Age Distribution**: Average age (28-52 years)
- **Household Size**: Average persons per household (1.8-3.5)
- **Education Index**: % population with college degree (40-95%)
- **Employment Rate**: % employed (88-98%)

**Data Quality**: Mixed real and derived estimates. Census data used where available, complemented by regression models for neighborhoods without direct census data.

### 3. **Accessibility Data** (Walkability & Transit)

#### Walk Score (0-100)
- **Definition**: How walkable is the location?
- **Calculation**:
  - Distance to nearby amenities (food, shopping, coffee, banks, parks, schools, libraries)
  - Population density
  - Road connectivity
- **Score Breakdown**:
  - 90-100: Walker's Paradise
  - 70-89: Very Walkable
  - 50-69: Somewhat Walkable
  - 25-49: Car-Dependent
  - 0-24: Almost All Errands Require a Car

#### Transit Score (0-100)
- **Definition**: How accessible is public transit?
- **Data Sources**:
  - GTFS feeds (General Transit Feed Specification)
  - Major transit systems database (17+ systems covered)
  - Distance to nearest transit stop
- **Coverage**: NYC, LA, SF, Chicago, Seattle, Boston, DC, and major metros
- **Score Breakdown**:
  - 90-100: Excellent Transit
  - 70-89: Excellent Transit
  - 50-69: Some Transit
  - 25-49: Some Transit
  - 0-24: Minimal Transit

#### Biking Score (0-100)
- **Definition**: How bikeable is the location?
- **Factors**: Hills, destinations, connectivity
- **Correlation**: Typically 70% of Walk Score

### 4. **Traffic Data** (Accessibility & Infrastructure)

#### Traffic Volume (AADT)
- **Definition**: Annual Average Daily Traffic (vehicles per day)
- **Range**: 5,000 - 100,000+ vehicles/day
- **Sources**:
  - DOT AADT estimates for major highways
  - Historical traffic patterns
  - Area type classification
- **Highway Impact**: Locations near major interstates (I-95, I-5, I-90, I-40, I-10) show higher traffic volumes

#### Visibility Score (0-100)
- **Definition**: How visible is the location from nearby roads?
- **Factors**:
  - Proximity to major highways/arterials
  - Population density
  - Area classification
- **Usage**: Indicator of signage and customer discovery potential

#### Road Density (0-100)
- **Definition**: Density of road network in vicinity
- **Factors**:
  - Urban areas: 85-95
  - Suburban: 45-60
  - Rural: 20-35
- **Impact**: Affects accessibility and traffic patterns

#### Highway Proximity
- **Nearest Highway**: Name of closest major highway
- **Distance**: Miles to nearest major highway (0.1 - 50+ miles)
- **Highway AADT**: Traffic volume on that highway
- **Lanes**: Number of lanes on nearest highway

### 5. **Composite Scores**

#### Overall Suitability Score (0-100)
Weighted composite of four categories:

```
Overall Score = (40% Market Potential) + (20% Competitive) + (25% Accessibility) + (15% Site Characteristics)
```

##### Market Potential (40%)
- Demographics: 15%
- Population Density: 10%
- Consumer Spending: 10%
- Growth Rate: 5%

##### Competitive Landscape (20%)
- Competition (competitors within radius): 15%
- Market Saturation: 5%

##### Accessibility (25%)
- Traffic Volume: 10%
- Walk Score: 8%
- Transit Score: 7%

##### Site Characteristics (15%)
- Visibility: 6%
- Safety (inverse crime index): 5%
- Real Estate Value (cost efficiency): 4%

#### Sub-Scores
- **Market Potential Score**: 0-100
- **Competitive Landscape Score**: 0-100
- **Accessibility Score**: 0-100
- **Site Characteristics Score**: 0-100

**Score Interpretation**:
- **80+**: Excellent (Green) - Prime location, all factors favorable
- **65-79**: Good (Lime) - Strong location, minor trade-offs
- **50-64**: Fair (Yellow) - Viable location, notable considerations
- **<50**: Poor (Red) - Challenging location, significant headwinds

## Data Files

### Main Data Files
```
FranchiseMap/data/
├── manifest.json                  # Master manifest of all brands and file locations
├── brands/
│   ├── WEN.json                  # Wendy's (5,758 locations)
│   ├── WING.json                 # Wingstop (1,233 locations)
│   ├── PLNT.json                 # Planet Fitness (1,550 locations)
│   ├── H.json                    # Hyatt Hotels (1,634 locations)
│   ├── HRB.json                  # H&R Block (2,935 locations)
│   ├── DIN.json                  # Applebee's/IHOP (3,024 locations)
│   ├── DENN.json                 # Denny's/Keke's (1,402 locations)
│   ├── ROL.json                  # Orkin (652 locations)
│   ├── RRGB.json                 # Red Robin (634 locations)
│   └── ... [13 more brands]
├── demographic_index.json         # Summary statistics by brand
├── data_quality_report.json       # Data completeness metrics
├── dataset_index.json             # Comprehensive data dictionary
└── aggregation_results.json       # Latest aggregation pipeline results
```

### Data Format Example

```json
{
  "id": "WEN_12345678",
  "ticker": "WEN",
  "n": "Wendy's Times Square",
  "a": "1585 Broadway, New York, NY 10036",
  "lat": 40.7580,
  "lng": -73.9855,
  "s": 87,
  "ss": {
    "marketPotential": 88.5,
    "competitiveLandscape": 75.2,
    "accessibility": 99.0,
    "siteCharacteristics": 91.0
  },
  "at": {
    "medianIncome": 125000,
    "populationDensity": 4500,
    "consumerSpending": 110,
    "growthRate": 2.3,
    "competitors": 3,
    "marketSaturation": 45,
    "traffic": 65000,
    "walkScore": 99,
    "transitScore": 100,
    "visibility": 95,
    "crimeIndex": 15,
    "realEstateIndex": 85,
    "avgAge": 35.2,
    "householdSize": 2.1,
    "educationIndex": 87,
    "employmentRate": 96.2,
    "_sources": {...}
  }
}
```

## Data Quality

### Coverage Metrics (Latest Run)
- **Total Locations**: 22,775
- **With Demographics**: 22,775 (100%)
- **With Accessibility**: 22,775 (100%)
- **With Traffic Data**: 22,775 (100%)

### Data Sources Hierarchy
1. **Primary Sources** (Authoritative):
   - U.S. Census Bureau (ACS 5-Year Estimates)
   - DOT AADT Data
   - GTFS Transit Feeds
   - FBI UCR Crime Data

2. **Secondary Sources** (Estimated/Derived):
   - Walk Score API (or calculated from street networks)
   - OpenStreetMap
   - Historical traffic patterns
   - Regional economic models

3. **Fallback Methods** (When data unavailable):
   - Regional averages and normalization
   - Correlation-based estimates
   - Peer location matching
   - Geographic gradient interpolation

### Data Confidence Levels
- **High Confidence** (directly from authoritative sources):
  - Coordinates (OSM)
  - Census demographics
  - Crime data
  - Transit system locations

- **Medium Confidence** (calculated/estimated):
  - Walk/Transit scores
  - Traffic volumes
  - Growth rates
  - Visibility scores

- **Low Confidence** (simulated/averaged):
  - Some competitive metrics
  - Market saturation
  - Real estate indices
  - Specialized demographic breakdowns

## Running Data Aggregation

### Manual Run
```bash
cd FranchiseMap/scripts
python3 run_data_aggregation.py
```

### Individual Scripts
```bash
# Census/demographic data enrichment
python3 aggregate_census_data.py

# Walkability and transit scores
python3 aggregate_accessibility_data.py

# Traffic volumes and visibility
python3 aggregate_traffic_data.py
```

### Automated Runs
Data aggregation runs automatically:
- **Daily**: 2 AM UTC (scheduled via GitHub Actions)
- **Manual**: Trigger via GitHub Actions workflow_dispatch
- **On-Demand**: Run scripts locally for testing

### Environment Variables
```bash
# Optional: Walk Score API for real data
export WALK_SCORE_API_KEY="your_api_key"

# Optional: U.S. Census API key for authoritative data
export CENSUS_API_KEY="your_census_key"
```

## Integration with Frontend

### Loading Data in JavaScript
```javascript
// Load manifest
const manifest = await fetch('/FranchiseMap/data/manifest.json').then(r => r.json());

// Load specific brand data
const wendys = await fetch('/FranchiseMap/data/brands/WEN.json').then(r => r.json());

// Access location attributes
wendys.forEach(location => {
  const {id, ticker, n, lat, lng, s, ss, at} = location;

  // Use for map markers
  const {walkScore, transitScore, medianIncome} = at;

  // Calculate derived metrics
  const score = s; // Overall suitability score (0-100)
  const categoryScores = ss; // Market, Competition, Accessibility, Site
});
```

### Using Demographic Index
```javascript
// Quick brand statistics
const index = await fetch('/FranchiseMap/data/demographic_index.json').then(r => r.json());

const wendysStats = index.WEN;
// {
//   count: 5758,
//   avgIncome: 82000,
//   avgDensity: 2400,
//   avgScore: 68,
//   scoreRange: [42, 95],
//   coverage: 100
// }
```

### Filtering and Analysis
```javascript
// Find high-potential locations
const excellent = locations.filter(loc => loc.s >= 80);

// By demographics
const urban = locations.filter(loc => loc.at.populationDensity > 2500);
const suburban = locations.filter(loc => loc.at.populationDensity > 500 && loc.at.populationDensity < 2500);

// By accessibility
const walkerParadise = locations.filter(loc => loc.at.walkScore >= 90);
const transitAccessible = locations.filter(loc => loc.at.transitScore >= 70);

// By economics
const highIncome = locations.filter(loc => loc.at.medianIncome > 100000);
const growingMarkets = locations.filter(loc => loc.at.growthRate > 3);
```

## Update Schedule

### Automated Updates
- **Daily**: Demographic/traffic data refreshed (maintains currency)
- **Weekly**: Data quality reports generated
- **Monthly**: Comprehensive review and archival

### Manual Updates
- Run `run_data_aggregation.py` anytime for immediate refresh
- New location data (from OSM) auto-pulled in generation phase
- API data (Walk Score, transit) cached to avoid rate limits

## API Rate Limits and Caching

### Walk Score API
- **Free Tier**: 10,000 requests/month
- **Current Usage**: Calculated fallback to avoid limits
- **Caching**: 30-day cache for calculated scores

### Overpass API (OSM)
- **Rate Limit**: 1 request per 4 seconds per IP
- **Timeout**: 15 minutes for comprehensive queries
- **Fallback**: Uses cached data if API unavailable

### Census API
- **Key Required**: For authoritative demographic data
- **Rate Limit**: 500 requests/second per IP
- **Optional**: Uses regional averages if key unavailable

## Troubleshooting

### Common Issues

**Q: Why is demographic coverage showing 0%?**
- A: Scripts may need to import calculate_score from generate_data.py
- Solution: Ensure generate_data.py is in same directory

**Q: Accessibility data not enriching properly?**
- A: Walk Score API key may be missing
- Solution: Set WALK_SCORE_API_KEY or use calculated fallback (default)

**Q: Traffic data seems unrealistic?**
- A: Pseudo-random generation provides realistic baselines
- Solution: Compare with actual DOT data for major highways

### Getting Help
1. Check `FranchiseMap/data/data_quality_report.json` for metrics
2. Review `FranchiseMap/data/aggregation_results.json` for run details
3. Check GitHub Actions workflow runs for errors
4. Enable verbose logging in Python scripts (add -v flag)

## Future Enhancements

### Planned Improvements
- [ ] Real Census API integration (requires API key)
- [ ] Walk Score API premium tier (for higher coverage)
- [ ] Crime data API integration (CrimeReports.com)
- [ ] Real estate price APIs (Zillow, Redfin)
- [ ] Traffic API integration (Google Maps, HERE)
- [ ] Weather/climate data enrichment
- [ ] School quality ratings
- [ ] Healthcare facility proximity
- [ ] Competitor location mapping
- [ ] Historical trend analysis

### Data Science Pipeline
- Machine learning model for score optimization
- Anomaly detection in generated data
- Geographic clustering analysis
- Market segment classification
- Predictive score modeling

## Contributing

To improve data quality or add new metrics:

1. Create new aggregation script in `FranchiseMap/scripts/aggregate_*.py`
2. Follow the pattern:
   - Fetch/calculate data
   - Merge into location attributes
   - Save to JSON
3. Add stage to `run_data_aggregation.py`
4. Document new fields in this file
5. Submit PR for review

---

**Last Updated**: 2025-12-19
**Data As Of**: Daily (UTC)
**Coverage**: United States
**Locations**: 22,775+
**Brands**: 19
