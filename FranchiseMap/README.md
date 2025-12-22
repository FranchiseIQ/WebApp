# FranchiseIQ Interactive Map

An interactive map showing franchise locations across North America using **OpenStreetMap** data, **Leaflet.js** for visualization, and **Overpass API** for location queries.

## Features

- 🗺️ **Interactive Pan & Zoom** - Smooth map navigation with mouse and touch controls
- 📍 **Detailed Location Markers** - Click any marker to see site score, demographics, and competitive analysis
- 🎨 **Color-Coded by Brand** - 60+ unique colors for visual distinction between franchises
- 🔍 **Real-Time Filtering** - Filter by brand, category (QSR, Casual, Hotels, etc), score range, and ownership model
- 🌐 **Open-Source Stack** - No API keys required, built entirely on open geospatial data
- 📱 **Mobile Responsive** - Full functionality on desktop, tablet, and mobile devices
- 📊 **Market Analysis Dashboard** - View brand statistics, high performers, and score distribution
- 🔥 **Heat Map View** - Visualize location density weighted by site quality scores
- 📈 **Stock Ticker** - Live market status and stock price updates for major franchise corporations

## Technology Stack

### Frontend Mapping
- **Leaflet.js** (v1.9.4) - Lightweight, open-source map library
- **Leaflet MarkerCluster** - Efficient clustering of location markers at different zoom levels
- **OpenStreetMap** - Base map tiles and geographic reference data
- **Leaflet.heat** - Heat map layer for density visualization

### Location Data
- **Overpass API** - Real-time OSM query engine for location data
- **OSM Data** - Community-contributed geographic and business information
- **Synthetic Data Fallback** - When Overpass API is unavailable

### Data Management
- **Manifest System** - Central registry of all franchise brands
- **Ownership Classification** - Automatic franchise/non-franchise categorization
- **Site Scoring Engine** - Multi-factor location quality assessment
- **Batch Processing Pipeline** - Automated GitHub Actions for daily data updates

## Data Structure

### Core Data Files

```
FranchiseMap/data/
├── manifest.json                    # Master brand registry (19 franchises)
├── brand_metadata.json             # Ownership and category classifications
├── brand_quality_report.json        # Data completeness audit
├── brands/
│   ├── WEN.json                    # Wendy's locations (5,758)
│   ├── PLNT.json                   # Planet Fitness (1,550)
│   ├── WING.json                   # Wingstop (1,233)
│   └── ...                         # 16 other brands
└── stocks.json                     # Real-time stock ticker data
```

### Manifest Structure

The `manifest.json` file is the **source of truth** for the UI:

```json
{
  "ticker": "SHAK",
  "brands": ["Shake Shack"],
  "name": "Shake Shack",
  "file": "data/brands/SHAK.json",
  "color": "#1F1F1F",
  "category": "QSR",
  "count": 325
}
```

- **ticker**: Stock symbol (uppercase), used as unique brand ID
- **name**: Display name shown in Market Analysis panel
- **file**: Path to location data JSON
- **color**: Unique color for map markers
- **category**: Type (QSR, Casual, Hotels, Fitness, Services)
- **count**: Total locations

### Brand Location Schema

Each location in the brand JSON files:

```json
{
  "id": "SHAK_123456",
  "ticker": "SHAK",
  "n": "Shake Shack - Downtown",
  "a": "123 Main St, New York, NY",
  "lat": 40.7580,
  "lng": -73.9855,
  "s": 78,
  "ss": {
    "marketPotential": 80,
    "competitiveLandscape": 75,
    "accessibility": 85,
    "siteCharacteristics": 70
  },
  "at": {
    "medianIncome": 95000,
    "traffic": 50000,
    "competitors": 5,
    "visibility": 75,
    "walkScore": 88,
    "avgAge": 38,
    "householdSize": 2.6,
    "educationIndex": 87,
    "employmentRate": 95
  }
}
```

- **s**: Site Score (0-100) - overall location quality
- **ss**: Sub-scores for different factors
- **at**: Attributes including demographics and infrastructure

## Setup Instructions

### 1. No API Key Required!

Unlike Google Maps, Leaflet and OpenStreetMap tiles require **no API key**:
- OpenStreetMap tiles are free and open-source
- Attribution is automatically included
- No signup, registration, or credit card required

### 2. Deploy

The map is ready to use! Deploy to:
- GitHub Pages
- Netlify
- Vercel
- Any static hosting service

No build step required - just serve the HTML files as-is.

### 3. Optional: Regenerate Data

To update location data from OSM:

```bash
cd FranchiseMap/data_aggregation
python franchises_batch_processor.py
```

This fetches fresh location data from Overpass API for all configured brands.

## Customization

### Adding a New Brand

1. **Add entry to manifest.json**:
```json
{
  "ticker": "ABC",
  "brands": ["ABC Brand"],
  "name": "ABC Brand",
  "file": "data/brands/ABC.json",
  "color": "#FF5500",
  "category": "QSR",
  "count": 0
}
```

2. **Create data file**: `data/brands/ABC.json` with location array

3. **Add to brand_metadata.json**:
```json
"ABC": {
  "ownership_model": "franchise",
  "primary_subtype": "licensed",
  "category": "qsr"
}
```

4. **Run batch processor** to populate locations from OSM

### Brand Categories

- `qsr` - Quick Service Restaurant
- `casual` - Casual Dining
- `hotels` - Hotel/Hospitality
- `fitness` - Fitness Centers
- `services` - Business Services
- `other` - Miscellaneous

### Map Tile Layers

Default layers provided by Leaflet:
- **Street** - OpenStreetMap standard street map (default)
- **Satellite** - Esri World Imagery satellites
- **Dark** - CartoDB Dark map
- **Topographic** - OpenTopoMap with elevation contours

Switch layers using the selector in the map controls (bottom-right).

## Data Quality

### Audit Report

Run the audit script to check data completeness:

```bash
python data_aggregation/audit_and_normalize_brands.py
```

This generates `data_quality_report.json` with:
- Duplicate brand detection
- Missing display names
- Suspiciously low location counts
- Data file mismatch warnings

### Known Limitations

- **DPZ (Domino's)**: 64 locations (incomplete, Overpass query may need refinement)
- Some brands have test data (NATH: 1 location, VAC: 19 locations)
- Non-major franchises may have limited location coverage

## Performance

### Marker Clustering

- **Clustered by default** at national/regional scales
- **Auto-clusters** break apart as user zooms in
- **All Locations view** available for detailed inspection
- **Heat map** optional overlay showing location density/quality

### Data Loading

- **Lazy loading**: Individual brand files loaded only when selected
- **Efficient clustering**: Uses Leaflet.markercluster for optimal rendering
- **Pagination**: UI sorts by location count for best performance

## Attribution & License

### Data Attribution

As required by OpenStreetMap:
- © OpenStreetMap contributors (https://www.openstreetmap.org/copyright)
- Map tiles from OpenStreetMap, CartoDB, and Esri (as labeled)
- Attribution automatically shown in map corner

### Library Attribution

- Leaflet.js (BSD 2-Clause License)
- Leaflet MarkerCluster (MIT License)
- Leaflet.heat (BSD 2-Clause License)
- OpenTopoMap (CC-BY-SA)

### Code License

MIT License - Free for commercial and personal use

## Support & Debugging

### Check Data Quality

```bash
# View quality report
cat FranchiseMap/data/data_quality_report.json

# Audit brands
python data_aggregation/audit_and_normalize_brands.py

# Check manifest
jq . FranchiseMap/data/manifest.json
```

### Browser Developer Console

Open DevTools (F12) to see:
- Data loading progress
- API errors
- Marker counts by view
- Filter application logs

### Common Issues

| Issue | Solution |
|-------|----------|
| Map not loading | Check browser console for errors; verify file paths are correct |
| Markers not showing | Verify manifest.json is loading; check brand file exists |
| Slow performance | Use Clustered view (default); reduce number of active brands |
| Missing locations | Check Overpass API availability; may need query refinement |

## Documentation Links

- **Leaflet.js**: https://leafletjs.com/reference.html
- **OpenStreetMap**: https://wiki.openstreetmap.org/wiki/Main_Page
- **Overpass API**: https://wiki.openstreetmap.org/wiki/Overpass_API
- **Font Awesome Icons**: https://fontawesome.com/icons
- **CartoDB Tiles**: https://carto.com/basemaps

## Contributing

To improve location data:
1. Edit locations in OpenStreetMap directly
2. Overpass API will pick up changes in 1-2 hours
3. Regenerate data via batch processor
4. Submit pull request with updated JSON files

---

**Last Updated**: December 2025
**Data Last Refreshed**: Check GitHub Actions workflow logs
**Total Brands**: 19 | **Total Locations**: 22,775+
