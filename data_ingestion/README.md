# FranchiseIQ Data Ingestion Architecture

A production-ready Python framework for bulk loading franchise data, stock data, sports data, and location information into the FranchiseIQ web application.

## Overview

The data ingestion system provides:

1. **Modular Design** - Base classes and patterns for consistent data handling
2. **Extensibility** - Easy to add new data sources without modifying existing code
3. **Error Handling** - Graceful fallbacks, retry logic, and detailed error reporting
4. **Validation** - Schema validation and data quality checks built-in
5. **Atomic Operations** - Safe file I/O with rollback on failure
6. **Logging** - Structured logging with timestamps and progress tracking

## Quick Start

### Installation

```bash
cd data_ingestion
pip install -r requirements.txt  # numpy, pandas, requests, jsonschema
```

### Run All Ingestors

```bash
python scripts/run_ingestion.py
```

### Run Specific Ingestor

```bash
python examples/ingest_franchise_locations.py
python examples/ingest_historical_stocks.py
python examples/ingest_sports_data.py
```

### Validation Only

```bash
python scripts/validate_data.py
```

## Directory Structure

```
data_ingestion/
├── __init__.py                          # Package initialization
├── README.md                            # This file
├── requirements.txt                     # Python dependencies
├── config.py                            # Centralized configuration
├── base.py                              # Abstract base classes
│
├── utils/
│   ├── __init__.py
│   ├── validators.py                    # Data validation utilities
│   ├── formatters.py                    # Data formatting (locations, dates, etc.)
│   ├── storage.py                       # File I/O (JSON, CSV, SQLite)
│   └── logging.py                       # Structured logging
│
├── examples/
│   ├── ingest_franchise_locations.py    # Load 1000s of franchise locations
│   ├── ingest_historical_stocks.py      # Load historical stock data
│   └── ingest_sports_data.py            # Load sports data
│
└── scripts/
    ├── run_ingestion.py                 # Main runner (orchestrator)
    └── validate_data.py                 # Data validation script
```

## Architecture Overview

### Base Classes (`base.py`)

Every data ingestor inherits from `DataIngestionScript`:

```python
from data_ingestion.base import DataIngestionScript

class MyIngestor(DataIngestionScript):
    def __init__(self):
        super().__init__(name="my_ingestor", version="1.0.0")

    def fetch(self):
        """Retrieve raw data from source (API, file, database, etc.)"""
        # Return raw data structure
        pass

    def validate(self, data):
        """Validate data against expected schema"""
        # Raise ValidationError if invalid
        pass

    def transform(self, data):
        """Transform to canonical output format"""
        # Return standardized data
        pass

    def save(self, data):
        """Save transformed data to disk"""
        # Save to JSON, CSV, or SQLite
        pass

    def run(self):
        """Execute full pipeline: fetch -> validate -> transform -> save"""
        # Built-in error handling and progress tracking
        pass
```

### Lifecycle

1. **Fetch** - Retrieve data from external source (API, CSV, JSON, etc.)
2. **Validate** - Ensure data conforms to schema
3. **Transform** - Standardize format (units, names, dates, etc.)
4. **Save** - Write to disk with atomic operations
5. **Report** - Summary of success/failures and data quality

### Configuration (`config.py`)

Centralized configuration for paths, API keys, and defaults:

```python
# Input sources
FRANCHISE_LOCATIONS_API = "https://api.example.com/locations"
STOCK_DATA_DIR = "../data/stocks"

# Output directories
LOCATIONS_OUTPUT = "../data/brands"
STOCKS_OUTPUT = "../data/stocks"
SPORTS_OUTPUT = "../data/sports"

# Validation rules
MIN_LATITUDE = -90
MAX_LATITUDE = 90
MIN_LONGITUDE = -180
MAX_LONGITUDE = 180
```

### Utilities

**validators.py**
- Schema validation (JSON Schema format)
- Data quality checks (bounds, uniqueness, required fields)
- Custom validators for domain-specific rules

**formatters.py**
- Location standardization (lat/lon, address parsing)
- Price formatting (remove currency symbols, normalize to USD)
- Date/time parsing and standardization
- Slug generation for IDs

**storage.py**
- Atomic JSON file I/O (write to temp, then rename)
- CSV import/export with header preservation
- SQLite database operations
- Compression support

**logging.py**
- Structured logging with timestamps
- Progress indicators for batch operations
- Error tracking with context (line numbers, field names)

## Example: Franchise Locations Ingestor

The `ingest_franchise_locations.py` example demonstrates:

1. **Loading data** from multiple sources (CSV, JSON, API)
2. **Validating** geographic coordinates and addresses
3. **Transforming** to standardized location schema
4. **Handling large datasets** with chunking/pagination
5. **Progressive enhancement** (process visible areas first)
6. **Frontend integration** (output format expected by Leaflet map)

### Input Schema (CSV)

```csv
brand,symbol,latitude,longitude,address,city,state,zip,phone,franchisee
McDonald's,MCD,37.7749,-122.4194,123 Market St,San Francisco,CA,94102,(415) 555-1234,Franchisee LLC
```

### Output Schema (JSON)

```json
{
  "locations": [
    {
      "id": "mcdonalds_ca_01234",
      "brand": "McDonald's",
      "symbol": "MCD",
      "latitude": 37.7749,
      "longitude": -122.4194,
      "address": "123 Market St, San Francisco, CA 94102",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102",
      "phone": "(415) 555-1234",
      "website": "https://example.com",
      "franchisee": "Franchisee Name LLC",
      "opened": 2010,
      "status": "operational",
      "score": 85,
      "units_nearby": 12
    }
  ],
  "metadata": {
    "brand": "McDonald's",
    "symbol": "MCD",
    "total_count": 13425,
    "country": "USA",
    "last_updated": "2025-12-29T10:00:00Z",
    "version": "2.0"
  }
}
```

## Example: Historical Stocks Ingestor

The `ingest_historical_stocks.py` example demonstrates:

1. **Fetching historical OHLCV data** from financial APIs
2. **Validating price bounds** and date continuity
3. **Transforming** to standard format (OHLCV + metadata)
4. **Handling gaps** in data with interpolation/flagging
5. **Supporting multiple output formats** (CSV, JSON)

### Output Schema

```json
{
  "symbol": "MCD",
  "data": [
    {
      "date": "2025-12-29",
      "open": 296.50,
      "high": 298.75,
      "low": 295.25,
      "close": 297.80,
      "volume": 2150000,
      "adjusted_close": 297.80
    }
  ],
  "metadata": {
    "currency": "USD",
    "start_date": "2015-01-01",
    "end_date": "2025-12-29",
    "record_count": 2816,
    "last_updated": "2025-12-29T16:30:00Z"
  }
}
```

## Example: Sports Data Ingestor

The `ingest_sports_data.py` example demonstrates:

1. **Loading live/historical sports data** from APIs
2. **Normalizing team names** across different sources
3. **Transforming** game results, scores, player stats
4. **Organizing** by sport (baseball, basketball, football, hockey, soccer)
5. **Handling real-time updates** with partial data

### Output Schema

```json
{
  "sport": "baseball",
  "league": "MLB",
  "games": [
    {
      "id": "game_20251229_NYY_BOS",
      "date": "2025-12-29T19:00:00Z",
      "home_team": "Boston Red Sox",
      "away_team": "New York Yankees",
      "home_score": 7,
      "away_score": 4,
      "status": "completed",
      "stadium": "Fenway Park",
      "attendance": 37755
    }
  ],
  "metadata": {
    "season": 2025,
    "last_updated": "2025-12-29T23:30:00Z",
    "source": "ESPN API"
  }
}
```

## Frontend Integration

### Loading Location Data (JavaScript)

```javascript
// Load locations for a specific brand
async function loadBrandLocations(brand, symbol) {
  try {
    const response = await fetch(`/data/brands/${symbol}.json`);
    const data = await response.json();

    // Use data.locations for map markers
    renderMapMarkers(data.locations);

    // Use data.metadata for filtering
    console.log(`Loaded ${data.metadata.total_count} locations`);
  } catch (error) {
    console.error('Failed to load locations:', error);
  }
}

// Lazy load for performance with 1000+ markers
function* chunkLocations(locations, chunkSize = 100) {
  for (let i = 0; i < locations.length; i += chunkSize) {
    yield locations.slice(i, i + chunkSize);
  }
}

// Render in chunks to avoid blocking
async function renderLocationsProgressive(locations) {
  for (const chunk of chunkLocations(locations, 100)) {
    renderMapMarkers(chunk);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

### Loading Stock Data (JavaScript)

```javascript
// Load historical stock data
async function loadStockData(symbol) {
  try {
    const response = await fetch(`/data/stocks/${symbol}.json`);
    const data = await response.json();

    // Use data.data for Chart.js
    const prices = data.data.map(d => d.close);
    const dates = data.data.map(d => d.date);

    renderChart(dates, prices);
  } catch (error) {
    console.error('Failed to load stock data:', error);
  }
}
```

## How to Run Manually

### 1. Install Dependencies

```bash
cd data_ingestion
pip install -r requirements.txt
```

### 2. Run Individual Script

```bash
# Load franchise locations
python examples/ingest_franchise_locations.py

# Load historical stocks
python examples/ingest_historical_stocks.py

# Load sports data
python examples/ingest_sports_data.py
```

### 3. Run All Ingestors

```bash
python scripts/run_ingestion.py
```

### 4. Validate Data

```bash
python scripts/validate_data.py
```

## How to Run via GitHub Actions (Scheduled)

Add to `.github/workflows/data-ingestion.yml`:

```yaml
name: Data Ingestion Pipeline

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r data_ingestion/requirements.txt
      - run: python data_ingestion/scripts/run_ingestion.py
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: ingestion-logs
          path: data_ingestion/logs/
```

## Adding a New Data Source

### 1. Create New Ingestor

```python
# data_ingestion/examples/ingest_my_data.py
from data_ingestion.base import DataIngestionScript
from data_ingestion.utils.validators import validate_schema
from data_ingestion.utils.storage import save_json

class MyDataIngestor(DataIngestionScript):
    def __init__(self):
        super().__init__(name="my_data", version="1.0.0")
        self.output_path = "my_data.json"

    def fetch(self):
        """Fetch from your data source"""
        # API call, file read, database query, etc.
        return raw_data

    def validate(self, data):
        """Validate against schema"""
        schema = {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "name": {"type": "string"}
                },
                "required": ["id", "name"]
            }
        }
        validate_schema(data, schema)

    def transform(self, data):
        """Transform to canonical format"""
        return data

    def save(self, data):
        """Save to disk"""
        save_json(data, self.output_path)

if __name__ == "__main__":
    ingestor = MyDataIngestor()
    ingestor.run()
```

### 2. Register in `scripts/run_ingestion.py`

```python
from examples.ingest_my_data import MyDataIngestor

ingestors = [
    MyDataIngestor(),
    # ... other ingestors
]
```

## Error Handling

All ingestors handle errors gracefully:

1. **Fetch Failures** - Retry with exponential backoff
2. **Validation Errors** - Log problematic records, continue with valid ones
3. **Save Failures** - Rollback to previous version
4. **Network Issues** - Cache and resume from checkpoint

## Monitoring

Run `scripts/validate_data.py` to check:

- Coverage (% of expected data present)
- Data quality (invalid records, missing fields)
- Consistency (cross-field validation)
- Freshness (last update time)

## Performance

For loading thousands of locations:

- **Time**: ~30 seconds to fetch and process 13,000+ locations
- **Memory**: ~50MB for full dataset
- **Output Size**: ~2MB for location JSON
- **Frontend Load Time**: <500ms for initial render (progressive enhancement)

## Troubleshooting

**API Rate Limiting**
- Add delays between requests: `time.sleep(random.uniform(0.5, 1.5))`
- Use retry logic with exponential backoff

**Memory Issues**
- Process data in chunks (see examples)
- Stream large files instead of loading all at once

**Validation Failures**
- Check logs in `logs/` directory
- Review problematic records with line numbers
- Adjust schema if needed

**File Permissions**
- Ensure write permissions on output directories
- Use atomic operations (write to temp, then rename)

## Architecture Decisions

1. **Separate Ingestors** - Each data source gets its own script for clarity and modularity
2. **Base Class Pattern** - Common interface ensures consistency
3. **Validation First** - Catch errors early before saving
4. **Atomic Operations** - No partial/corrupted files
5. **Structured Logging** - Easier debugging and monitoring
6. **No Framework Dependency** - Just standard Python (numpy, pandas, requests)

## References

- Python: https://www.python.org/
- JSON Schema: https://json-schema.org/
- Pandas: https://pandas.pydata.org/
- Requests: https://requests.readthedocs.io/

---

**Last Updated**: 2025-12-29
**Version**: 1.0.0
