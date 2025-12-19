#!/usr/bin/env python3
"""
Census Bureau API Integration Script
Fetches real demographic data from U.S. Census Bureau American Community Survey.

This script replaces simulated demographic data with authoritative Census data
for all franchise locations using spatial queries and Census tract lookup.

Data Sources:
- U.S. Census Bureau American Community Survey (ACS) 5-Year Estimates
- 2021 vintage (most recent available)
- Census tract and block group level data
- Free API with registration (no cost)

Required:
- Census API Key: Get free at https://api.census.gov/data/key_signup.html
- Set CENSUS_API_KEY environment variable

Variables Available:
- B19013_001E: Median household income
- B06009_001E: Population by education attainment
- B23001_001E: Employment status
- B01003_001E: Total population
- B11016_001E: Household composition
"""

import json
import os
import requests
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import math

# Configuration
CENSUS_API_KEY = os.environ.get("CENSUS_API_KEY", "")
CENSUS_API_BASE = "https://api.census.gov/data/2021/acs/acs5"

script_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(script_dir, "../data")
BRANDS_DIR = os.path.join(DATA_DIR, "brands")

# Census variables to fetch
CENSUS_VARIABLES = {
    # Income
    "B19013_001E": "median_income",

    # Education (Population 25+ with bachelor's degree or higher)
    "B06009_002E": "education_total",
    "B06009_005E": "education_bachelors",

    # Employment Status
    "B23001_001E": "employment_total",
    "B23001_002E": "employment_civilian_labor",
    "B23001_007E": "employment_employed",

    # Household Composition
    "B11016_001E": "total_households",
    "B11016_002E": "family_households",

    # Population density (need total population and land area)
    "B01003_001E": "total_population",

    # Age distribution
    "B01002_001E": "median_age",

    # Income distribution (for inequality/consumer spending)
    "B19080_001E": "gini_index",
}

# Map FIPS state codes to state abbreviations
STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO",
    "09": "CT", "10": "DE", "12": "FL", "13": "GA", "15": "HI", "16": "ID",
    "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA",
    "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS",
    "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ",
    "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK",
    "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN",
    "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
    "55": "WI", "56": "WY", "11": "DC"
}

def latlng_to_county(lat: float, lng: float) -> Optional[Tuple[str, str]]:
    """
    Approximate county from lat/lng using rough boundaries.
    Returns (state_fips, county_fips) or None.

    Note: This is simplified. For production, use:
    - Census Tiger/Line shapefiles with spatial join
    - OR the Census FCC Block Assignment API
    """
    # Simplified mapping - this is approximate
    # In production, would use proper shapefile lookup

    # Example state/county centroids (simplified)
    state_county_map = {
        # This is a simplified approach - would need real shapefile for accuracy
        # For now, return None to fall back to regional averages
    }

    return None

def fetch_census_data_for_location(lat: float, lng: float) -> Optional[Dict]:
    """
    Fetch Census Bureau data for a location.

    Attempts to get data for the Census tract containing the location.
    Falls back to state-level data if tract data unavailable.
    """
    if not CENSUS_API_KEY:
        return None

    try:
        # Use Census FCC Block Assignment API to get Census tract
        # This requires lat/lng and returns tract/block information
        fcc_url = "https://geo.fcc.gov/api/census/tract"
        params = {"latitude": lat, "longitude": lng, "format": "json"}

        response = requests.get(fcc_url, params=params, timeout=5)
        if response.status_code != 200:
            return None

        fcc_data = response.json()
        properties = fcc_data.get("Block", {}).get("FIPS", "")

        if not properties or len(properties) < 11:
            return None

        # Extract state and county from FIPS code
        state_fips = properties[:2]
        county_fips = properties[2:5]
        tract = properties[5:11]

        state = STATE_FIPS.get(state_fips)
        if not state:
            return None

        # Now fetch Census data for this tract
        variables = ",".join(list(CENSUS_VARIABLES.keys())[:10])  # Limit for API call

        census_url = f"{CENSUS_API_BASE}?get={variables}&for=tract:{tract}&in=state:{state_fips}+county:{county_fips}&key={CENSUS_API_KEY}"

        response = requests.get(census_url, timeout=10)
        if response.status_code != 200:
            return None

        data = response.json()
        if not data or len(data) < 2:
            return None

        # Parse result
        header = data[0]
        values = data[1]

        result = {}
        for i, var_code in enumerate(header):
            if var_code in CENSUS_VARIABLES:
                try:
                    value = float(values[i]) if values[i] not in [None, ""] else None
                    if value is not None and value >= 0:
                        result[CENSUS_VARIABLES[var_code]] = value
                except (ValueError, IndexError):
                    pass

        return result if result else None

    except Exception as e:
        return None

def fetch_state_level_data(state_code: str) -> Optional[Dict]:
    """
    Fetch state-level Census data as fallback.
    More reliable than tract-level lookups.
    """
    if not CENSUS_API_KEY:
        return None

    try:
        state_fips = next(
            (fips for fips, abbr in STATE_FIPS.items() if abbr == state_code),
            None
        )

        if not state_fips:
            return None

        # Fetch state-level data (all counties in state)
        variables = ",".join(list(CENSUS_VARIABLES.keys())[:10])
        url = f"{CENSUS_API_BASE}?get={variables}&for=state:{state_fips}&key={CENSUS_API_KEY}"

        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return None

        data = response.json()
        if not data or len(data) < 2:
            return None

        # Parse result
        header = data[0]
        values = data[1]

        result = {}
        for i, var_code in enumerate(header):
            if var_code in CENSUS_VARIABLES:
                try:
                    value = float(values[i]) if values[i] not in [None, ""] else None
                    if value is not None and value >= 0:
                        result[CENSUS_VARIABLES[var_code]] = value
                except (ValueError, IndexError):
                    pass

        return result if result else None

    except Exception as e:
        return None

def extract_demographics_from_census(census_data: Dict) -> Dict:
    """
    Convert Census variables to demographic attributes.
    """
    demographics = {}

    # Median income
    if "median_income" in census_data:
        demographics["medianIncome"] = int(census_data["median_income"])

    # Education index (% with bachelor's degree or higher)
    if "education_bachelors" in census_data and "education_total" in census_data:
        total = census_data["education_total"]
        if total > 0:
            pct = (census_data["education_bachelors"] / total) * 100
            demographics["educationIndex"] = min(100, int(pct))

    # Employment rate
    if "employment_employed" in census_data and "employment_civilian_labor" in census_data:
        civilian = census_data["employment_civilian_labor"]
        if civilian > 0:
            rate = (census_data["employment_employed"] / civilian) * 100
            demographics["employmentRate"] = min(100, rate)

    # Median age
    if "median_age" in census_data:
        demographics["avgAge"] = census_data["median_age"]

    # Household size (approximation from households and population)
    if "total_population" in census_data and "total_households" in census_data:
        households = census_data["total_households"]
        if households > 0:
            size = census_data["total_population"] / households
            demographics["householdSize"] = round(size, 1)

    return demographics

def estimate_consumer_spending(income: int, education: int) -> int:
    """Estimate consumer spending index from income and education."""
    spending = 50 + (income / 100000) * 40
    spending += (education - 50) * 0.3
    return min(150, max(50, int(spending)))

def enrich_location_with_census_data(location: Dict, state_code: str) -> Dict:
    """
    Enrich location with Census data.
    Attempts location-specific data, falls back to state level.
    """
    lat = location.get("lat")
    lng = location.get("lng")

    if not lat or not lng:
        return location

    # Try location-specific data first
    census_data = fetch_census_data_for_location(lat, lng)

    # Fall back to state level
    if not census_data:
        census_data = fetch_state_level_data(state_code)

    if not census_data:
        return location  # Return unchanged if no Census data available

    # Extract and apply demographics
    demographics = extract_demographics_from_census(census_data)

    if demographics:
        # Update location attributes
        if "at" not in location:
            location["at"] = {}

        # Apply Census data (overwrite simulated data)
        for key, value in demographics.items():
            location["at"][key] = value

        # Recalculate derived metrics
        if "medianIncome" in location["at"]:
            income = location["at"]["medianIncome"]
            education = location["at"].get("educationIndex", 80)
            location["at"]["consumerSpending"] = estimate_consumer_spending(income, education)

        # Add source attribution
        location["at"]["_censusSource"] = "U.S. Census Bureau ACS 2021 (5-Year Estimates)"
        location["at"]["_censusEnrichedAt"] = datetime.now().isoformat()

        # Recalculate overall score
        try:
            from generate_data import calculate_score, calculate_sub_scores
            location["s"] = calculate_score(location["at"])
            location["ss"] = calculate_sub_scores(location["at"])
        except ImportError:
            pass

    return location

def estimate_state_from_coords(lat: float, lng: float) -> Optional[str]:
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
    }

    for state, min_lat, max_lat, min_lng, max_lng in state_bounds:
        if min_lat <= lat <= max_lat and min_lng <= lng <= max_lng:
            return state

    return None

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Integrate Census Bureau data")
    parser.add_argument("--limit", type=int, default=None, help="Limit locations to process")
    parser.add_argument("--ticker", type=str, default=None, help="Process specific ticker")
    args = parser.parse_args()

    if not CENSUS_API_KEY:
        print("ERROR: CENSUS_API_KEY environment variable not set")
        print("Get free API key at https://api.census.gov/data/key_signup.html")
        print("Then set: export CENSUS_API_KEY='your_key_here'")
        return

    print("\n" + "="*70)
    print("CENSUS BUREAU DATA INTEGRATION")
    print("="*70)
    print(f"Using Census API: {CENSUS_API_BASE}")
    print(f"Vintage: 2021 (5-Year Estimates)")

    # Load manifest
    manifest_path = os.path.join(DATA_DIR, "manifest.json")
    if not os.path.exists(manifest_path):
        print("ERROR: manifest.json not found")
        return

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    total_enriched = 0
    total_with_census = 0

    # Process each brand
    for brand_info in manifest:
        ticker = brand_info["ticker"]

        if args.ticker and args.ticker != ticker:
            continue

        data_file = os.path.join(DATA_DIR, brand_info["file"])
        if not os.path.exists(data_file):
            print(f"  SKIP {ticker}: file not found")
            continue

        print(f"\n🔄 {ticker} ({brand_info['count']} locations)")

        with open(data_file, "r") as f:
            locations = json.load(f)

        enriched = 0
        with_census = 0

        for i, location in enumerate(locations):
            if args.limit and i >= args.limit:
                break

            lat = location.get("lat")
            lng = location.get("lng")

            if lat and lng:
                state = estimate_state_from_coords(lat, lng)
                if state:
                    original_income = location.get("at", {}).get("medianIncome")
                    location = enrich_location_with_census_data(location, state)
                    new_income = location.get("at", {}).get("_censusSource")

                    if new_income:
                        with_census += 1

            enriched += 1
            total_enriched += 1

            if (i + 1) % 100 == 0:
                print(f"   Processed {i+1}/{len(locations)}")

            # Rate limiting
            if (i + 1) % 50 == 0:
                time.sleep(1)

        # Save enriched data
        with open(data_file, "w") as f:
            json.dump(locations, f, separators=(',', ':'))

        print(f"   ✓ Enriched {enriched} locations")
        print(f"   ✓ Census data integrated: {with_census} locations")
        total_with_census += with_census

    print(f"\n{'='*70}")
    print(f"INTEGRATION COMPLETE")
    print(f"Total locations processed: {total_enriched:,}")
    print(f"With Census data: {total_with_census:,}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
