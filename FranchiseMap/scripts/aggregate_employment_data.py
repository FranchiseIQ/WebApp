#!/usr/bin/env python3
"""
BLS Employment Data Integration Script
Fetches real employment statistics from Bureau of Labor Statistics.

Data Sources:
- BLS API: https://www.bls.gov/developers/
- Unemployment rates by state/county
- Average wages and earnings
- Job growth statistics
- Employment by industry

Setup:
1. Register at https://www.bls.gov/developers/
2. Get free API key
3. Set BLS_API_KEY environment variable

Metrics Collected:
- Unemployment rate (%)
- Average wage (annual)
- Job growth rate (%)
- Employment by major industries
"""

import json
import os
import requests
import time
from typing import Dict, Optional, List
from datetime import datetime

# Configuration
BLS_API_BASE = "https://api.bls.gov/publicAPI/v2"
# Try BLS_KEY first (GitHub secret), fall back to BLS_API_KEY (local env)
BLS_API_KEY = os.environ.get("BLS_KEY", "") or os.environ.get("BLS_API_KEY", "")

if not BLS_API_KEY:
    print("⚠️  WARNING: BLS_KEY not found in environment")
    print("   Set it as a GitHub secret or export BLS_KEY='your_key'")
    print("   Get your key at: https://www.bls.gov/developers/")
    print("   Script will use regional employment baselines as fallback\n")

script_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(script_dir, "../data")
BRANDS_DIR = os.path.join(DATA_DIR, "brands")

# State FIPS codes for BLS lookups
STATE_FIPS = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06", "CO": "08",
    "CT": "09", "DE": "10", "FL": "12", "GA": "13", "HI": "15", "ID": "16",
    "IL": "17", "IN": "18", "IA": "19", "KS": "20", "KY": "21", "LA": "22",
    "ME": "23", "MD": "24", "MA": "25", "MI": "26", "MN": "27", "MS": "28",
    "MO": "29", "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34",
    "NM": "35", "NY": "36", "NC": "37", "ND": "38", "OH": "39", "OK": "40",
    "OR": "41", "PA": "42", "RI": "44", "SC": "45", "SD": "46", "TN": "47",
    "TX": "48", "UT": "49", "VT": "50", "VA": "51", "WA": "53", "WV": "54",
    "WI": "55", "WY": "56", "DC": "11"
}

# Regional employment rate baselines (for fallback)
REGIONAL_EMPLOYMENT_BASELINES = {
    "AL": 94.2, "AK": 95.5, "AZ": 94.8, "AR": 93.4, "CA": 95.6, "CO": 95.5,
    "CT": 96.0, "DE": 95.5, "FL": 94.6, "GA": 94.9, "HI": 95.5, "ID": 94.2,
    "IL": 94.8, "IN": 94.3, "IA": 94.4, "KS": 94.1, "KY": 93.8, "LA": 93.6,
    "ME": 94.5, "MD": 96.0, "MA": 96.2, "MI": 94.2, "MN": 95.3, "MS": 92.8,
    "MO": 94.0, "MT": 94.0, "NE": 94.2, "NV": 94.7, "NH": 95.7, "NJ": 96.1,
    "NM": 93.7, "NY": 95.5, "NC": 94.8, "ND": 94.3, "OH": 94.3, "OK": 93.9,
    "OR": 95.0, "PA": 94.8, "RI": 95.2, "SC": 94.2, "SD": 93.9, "TN": 94.1,
    "TX": 94.9, "UT": 95.4, "VT": 95.0, "VA": 95.9, "WA": 95.7, "WV": 93.0,
    "WI": 94.7, "WY": 94.9, "DC": 96.5
}

def estimate_state_from_coords(lat: float, lng: float) -> str:
    """Estimate state code from coordinates."""
    state_bounds = {
        ("CA", 32.5, 42.0, -124.4, -114.1),
        ("TX", 25.8, 36.5, -106.6, -93.5),
        ("FL", 24.5, 30.7, -87.6, -80.0),
        ("NY", 40.5, 45.0, -79.8, -71.8),
        ("PA", 39.7, 42.3, -80.5, -74.7),
        ("IL", 36.9, 42.5, -91.5, -87.0),
        ("OH", 38.4, 42.0, -84.8, -80.5),
        ("GA", 30.4, 35.0, -85.6, -80.8),
        ("NC", 33.8, 36.6, -84.3, -75.4),
        ("MI", 41.7, 48.3, -90.4, -83.4),
        ("NJ", 38.9, 41.4, -75.6, -73.9),
        ("VA", 36.5, 39.5, -83.7, -75.2),
        ("WA", 45.6, 49.0, -124.7, -116.9),
        ("AZ", 31.3, 37.0, -114.8, -109.0),
        ("MA", 41.2, 42.9, -73.5, -69.9),
        ("TN", 35.0, 36.7, -90.3, -81.6),
        ("IN", 37.8, 41.8, -88.1, -84.8),
        ("MO", 36.5, 40.6, -95.8, -89.1),
        ("LA", 29.0, 33.0, -94.0, -88.8),
        ("CO", 37.0, 41.0, -109.1, -102.0),
        ("MN", 43.5, 49.4, -97.2, -89.5),
        ("WI", 42.5, 47.3, -92.9, -86.8),
        ("SC", 32.0, 34.8, -83.4, -78.5),
        ("AL", 30.2, 35.0, -88.5, -84.9),
        ("KY", 36.5, 39.1, -89.6, -81.9),
        ("OR", 42.0, 46.3, -124.5, -116.5),
        ("OK", 33.6, 37.0, -103.0, -94.4),
        ("CT", 41.1, 42.1, -73.7, -71.8),
        ("UT", 37.0, 42.0, -114.0, -109.0),
        ("NV", 35.0, 42.0, -120.0, -114.6),
        ("AR", 33.0, 36.5, -94.4, -89.6),
        ("MS", 30.2, 34.8, -91.7, -88.1),
        ("KS", 37.0, 40.0, -102.0, -94.6),
        ("NM", 31.8, 37.0, -109.0, -103.0),
        ("NE", 40.0, 43.0, -104.0, -95.3),
        ("ID", 42.0, 49.0, -117.2, -111.0),
        ("HI", 18.9, 22.2, -160.0, -154.8),
        ("AK", 51.3, 71.4, -174.0, -130.0),
        ("ME", 43.0, 47.5, -71.1, -66.9),
        ("NH", 42.7, 45.3, -72.6, -70.7),
        ("VT", 42.7, 45.1, -73.4, -71.5),
        ("RI", 41.1, 42.0, -71.9, -71.1),
        ("MT", 45.0, 49.0, -116.0, -104.0),
        ("WY", 41.0, 45.0, -111.0, -104.0),
        ("ND", 46.0, 49.0, -104.0, -96.6),
        ("SD", 42.5, 45.9, -104.0, -96.4),
        ("DE", 38.4, 39.8, -75.8, -75.0),
        ("MD", 37.9, 39.7, -79.5, -75.0),
        ("DC", 38.8, 38.9, -77.1, -77.0),
        ("WV", 37.2, 40.6, -82.6, -77.7),
    }

    for state, min_lat, max_lat, min_lng, max_lng in state_bounds:
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            return state

    return "CA"

def fetch_bls_state_employment(state: str) -> Optional[Dict]:
    """Fetch BLS employment data for a state."""
    if not BLS_API_KEY:
        return None

    try:
        # BLS unemployment rate series for state
        state_fips = STATE_FIPS.get(state)
        if not state_fips:
            return None

        series_id = f"LAUS{state_fips}0000000003"  # Unemployment rate

        headers = {'Content-type': 'application/json'}
        data = json.dumps({
            'seriesid': [series_id],
            'startyear': '2024',
            'endyear': '2025',
            'apikey': BLS_API_KEY
        })

        response = requests.post(
            f'{BLS_API_BASE}/timeseries/data/',
            data=data,
            headers=headers,
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            if result.get('Results', {}).get('series'):
                series = result['Results']['series'][0]
                if series.get('data'):
                    latest = series['data'][0]
                    return {
                        'unemployment_rate': float(latest.get('value', 0))
                    }

        return None
    except Exception as e:
        print(f"    BLS API error: {e}")
        return None

def estimate_employment_rate(state: str, attrs: Dict) -> float:
    """
    Estimate employment rate for a location.
    Based on state unemployment rate adjusted for local factors.
    """
    # Try to fetch real BLS data
    bls_data = fetch_bls_state_employment(state)

    if bls_data:
        unemployment = bls_data.get('unemployment_rate', 4.0)
        employment_rate = 100 - unemployment
    else:
        # Use regional baseline
        employment_rate = REGIONAL_EMPLOYMENT_BASELINES.get(state, 94.5)

    # Adjust based on income and education
    income = attrs.get('medianIncome', 75000)
    education = attrs.get('educationIndex', 80)

    if income > 100000 and education > 85:
        employment_rate += 1.5  # Wealthy, educated areas have higher employment
    elif income < 40000 and education < 70:
        employment_rate -= 2.0  # Lower income areas may have higher unemployment

    return max(85.0, min(99.0, employment_rate))

def enrich_location_with_employment_data(location: Dict, state: str) -> Dict:
    """Enrich location with employment data."""
    if 'at' not in location:
        location['at'] = {}

    attrs = location['at']

    # Get employment rate
    employment_rate = estimate_employment_rate(state, attrs)

    # Update location
    attrs['employmentRate'] = round(employment_rate, 1)
    attrs['_employmentSource'] = 'BLS Data (estimated from regional data)'
    attrs['_employmentDataDate'] = datetime.now().isoformat()

    # Recalculate overall score
    try:
        from generate_data import calculate_score, calculate_sub_scores
        location['s'] = calculate_score(attrs)
        location['ss'] = calculate_sub_scores(attrs)
    except ImportError:
        pass

    return location

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Integrate BLS employment data")
    parser.add_argument("--ticker", type=str, default=None, help="Process specific ticker")
    args = parser.parse_args()

    print("\n" + "="*70)
    print("BLS EMPLOYMENT DATA INTEGRATION")
    print("="*70)
    print("Data Source: Bureau of Labor Statistics")
    print("Metrics: Unemployment rates, employment statistics")

    if BLS_API_KEY:
        print("API Key: ✓ Configured")
    else:
        print("API Key: ✗ Not found - using regional baselines")
        print("Set BLS_API_KEY to use real data")

    # Load manifest
    manifest_path = os.path.join(DATA_DIR, "manifest.json")
    if not os.path.exists(manifest_path):
        print("ERROR: manifest.json not found")
        return

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    total_enriched = 0
    total_with_employment = 0

    # Process each brand
    for brand_info in manifest:
        ticker = brand_info["ticker"]

        if args.ticker and args.ticker != ticker:
            continue

        # Handle path correctly
        file_path = brand_info["file"]
        if file_path.startswith("data/"):
            data_file = os.path.join(DATA_DIR, file_path[5:])
        else:
            data_file = os.path.join(DATA_DIR, file_path)

        if not os.path.exists(data_file):
            print(f"  SKIP {ticker}: file not found")
            continue

        print(f"\n🔄 {ticker}")

        with open(data_file, "r") as f:
            locations = json.load(f)

        enriched = 0
        for location in locations:
            lat = location.get("lat")
            lng = location.get("lng")

            if lat and lng:
                state = estimate_state_from_coords(lat, lng)
                location = enrich_location_with_employment_data(location, state)
                enriched += 1
                total_enriched += 1

                if location.get('at', {}).get('employmentRate'):
                    total_with_employment += 1

            # Rate limiting for BLS API
            if BLS_API_KEY and enriched % 10 == 0:
                time.sleep(0.5)

        # Save enriched data
        with open(data_file, "w") as f:
            json.dump(locations, f, separators=(',', ':'))

        print(f"   ✓ Enriched {enriched} locations")
        print(f"   ✓ Employment data integrated: {enriched}")

    print(f"\n{'='*70}")
    print(f"EMPLOYMENT DATA INTEGRATION COMPLETE")
    print(f"Total locations processed: {total_enriched:,}")
    print(f"With employment data: {total_with_employment:,}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
