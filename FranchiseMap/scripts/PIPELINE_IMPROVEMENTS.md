# Data Aggregation Pipeline - Improvements

## Overview
The data aggregation pipeline has been completely rewritten with a focus on **robustness, reliability, and maintainability**.

## Major Improvements

### 1. **Structured Logging**
**Before:** Basic print statements with inconsistent formatting
**After:**
- Proper `logging` module with DEBUG/INFO/WARNING/ERROR levels
- Consistent timestamp and level formatting
- Clear separation of concerns (logging, data processing, etc.)
- Example output:
  ```
  2025-12-19 08:59:43 [INFO] DataAggregation: ✓ Quality metrics calculated
  2025-12-19 08:59:43 [ERROR] DataAggregation: Failed to calculate metrics
  ```

### 2. **Error Handling & Retry Logic**
**Before:** Single attempt, failure = fatal
**After:**
- Automatic retry with exponential backoff (5s between attempts)
- Configurable max retries (default: 2 retries = 3 total attempts)
- Subprocess timeout handling (5 minutes per stage)
- Graceful degradation for optional stages
- Detailed error messages with stderr preview

### 3. **Data Validation**
**Before:** Minimal validation, errors discovered late in pipeline
**After:**
- `DataValidator` class validates:
  - JSON file integrity before processing
  - Required location fields (`id`, `ticker`, `n`, `lat`, `lng`)
  - Data structure (must be a list of dictionaries)
  - File existence and readability
- Early detection prevents cascade failures

### 4. **Process Management**
**Before:** Simple subprocess calls with minimal error info
**After:**
- `ProcessRunner` class with:
  - Timeout handling
  - Retry logic with delays
  - Environment variable merging for API keys
  - Captured stdout/stderr for debugging
  - Return success/failure status

### 5. **Configuration Management**
**Before:** Hardcoded values scattered throughout code
**After:**
- `Config` class with centralized settings:
  - `MAX_RETRIES = 2`
  - `RETRY_DELAY = 5` (seconds)
  - `SUBPROCESS_TIMEOUT = 300` (5 minutes)
  - `LOG_FORMAT` and `LOG_DATE_FORMAT`
- Easy to adjust behavior without code changes

### 6. **Type Safety & Data Classes**
**Before:** Dictionary-based results, unclear structure
**After:**
- `StageResult` dataclass tracks: name, status, duration, message, details
- `QualityMetrics` dataclass tracks: coverage percentages, location counts
- Type hints throughout for IDE support and documentation

### 7. **Quality Metrics & Reporting**
**Before:** Basic metrics, limited insights
**After:**
- Comprehensive metrics:
  - Total locations and locations with attributes
  - Coverage by data type (demographics, accessibility, crime, employment, transit)
  - Per-brand metrics (if needed)
- Detailed reports saved to JSON:
  - `data_quality_report.json` - Coverage percentages
  - `aggregation_results.json` - Complete execution summary

### 8. **Better Error Messages**
**Before:** Generic error messages, hard to diagnose
**After:**
- Specific error context
- File paths and line numbers in exceptions
- Helpful guidance (e.g., "Script not found: aggregate_census_data.py")
- Preview of stderr for debugging

### 9. **Path Handling**
**Before:** String-based paths, OS-specific issues
**After:**
- Uses `pathlib.Path` for cross-platform compatibility
- Automatic path resolution
- Clear path joining and resolution logic

### 10. **Code Organization**
**Before:** Large monolithic class with many methods
**After:**
- Clear separation of concerns:
  - `setup_logging()` - Logging configuration
  - `DataValidator` - Data integrity checks
  - `ProcessRunner` - Subprocess execution
  - `DataAggregationPipeline` - Orchestration
- Each class has single responsibility
- Easy to unit test individual components

## Architecture

```
run_data_aggregation.py
├── Config (Constants & Configuration)
├── setup_logging() (Logger Factory)
├── DataValidator (Data Integrity Checks)
│   ├── is_valid_json_file()
│   ├── validate_location()
│   └── validate_brand_file()
├── ProcessRunner (Subprocess Execution)
│   └── run_script() (with retry logic)
└── DataAggregationPipeline (Orchestrator)
    ├── verify_prerequisites()
    ├── verify_brand_data()
    ├── run_enrichment_stage()
    ├── calculate_quality_metrics()
    ├── save_quality_report()
    ├── save_pipeline_summary()
    └── run() (Main orchestration)
```

## Pipeline Flow

```
1. Prerequisites Check
   ├─ Data directory exists
   ├─ Manifest file exists
   └─ Manifest is valid JSON

2. Brand Data Verification
   ├─ Verify each brand file exists
   ├─ Validate JSON structure
   └─ Check for required location fields

3. Census Data Enrichment (with 3 retry attempts)
   └─ Run aggregate_census_data.py

4. Crime Data Enrichment (optional, 3 retry attempts)
   └─ Run aggregate_crime_data.py

5. Employment Data Enrichment (optional, 3 retry attempts)
   └─ Run aggregate_employment_data.py

6. Quality Metrics & Reporting
   ├─ Calculate coverage percentages
   ├─ Generate data_quality_report.json
   └─ Generate aggregation_results.json
```

## Configuration

Edit the `Config` class to adjust:
- `MAX_RETRIES`: Number of retry attempts (default: 2)
- `RETRY_DELAY`: Delay between retries in seconds (default: 5)
- `SUBPROCESS_TIMEOUT`: Time limit per stage in seconds (default: 300)
- `MIN_LOCATIONS_THRESHOLD`: Warning threshold for low location counts

## Output Files

### `data_quality_report.json`
```json
{
  "timestamp": "2025-12-19T08:59:43.xxx",
  "totalLocations": 22775,
  "coverage": {
    "demographic": 100.0,
    "accessibility": 100.0,
    "crimeData": 0.0,
    "employment": 0.0,
    "transit": 0.0
  },
  "counts": {
    "withAttributes": 22775,
    "withScores": 22775,
    ...
  }
}
```

### `aggregation_results.json`
```json
{
  "executedAt": "2025-12-19T08:59:43.xxx",
  "completedAt": "2025-12-19T08:59:43.xxx",
  "totalDuration": 44.4,
  "stages": [
    {
      "name": "Brand Data Verification",
      "status": "completed",
      "duration": 0.1,
      "message": "Verified 19/27 brands...",
      "details": {...}
    },
    ...
  ],
  "metrics": {...},
  "success": false
}
```

## Exit Codes

- `0` - Success
- `1` - Error
- `130` - Interrupted by user (Ctrl+C)

## Example Usage

```bash
# Run pipeline with default settings
python3 run_data_aggregation.py

# Run with custom environment
CENSUS_API_KEY=your_key GOV_DATA_KEY=your_key BLS_KEY=your_key python3 run_data_aggregation.py
```

## Future Enhancements

Potential improvements for future iterations:
- [ ] Parallel stage execution
- [ ] Database persistence instead of JSON files
- [ ] Webhook notifications on failure
- [ ] Progress persistence for resuming failed runs
- [ ] Incremental data updates (only process changed brands)
- [ ] Performance metrics and benchmarking
- [ ] Data validation against schema
- [ ] Integration tests with mock data

## Troubleshooting

### Pipeline Fails at Census Enrichment
**Cause:** CENSUS_API_KEY not set
**Solution:**
```bash
export CENSUS_API_KEY='your_api_key'
python3 run_data_aggregation.py
```

### Data Quality Report Shows 0% Coverage
**Cause:** Brand data files have invalid structure
**Solution:** Check `brand_data_verification.json` for invalid files, validate JSON structure

### Subprocess Timeout
**Cause:** An enrichment stage takes >5 minutes
**Solution:** Increase `SUBPROCESS_TIMEOUT` in Config class or optimize the script

## Credits

Rewritten with focus on:
- Reliability and error handling
- Maintainability and code organization
- Clear reporting and diagnostics
- Robustness under adverse conditions
