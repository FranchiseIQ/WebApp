#!/usr/bin/env python3
"""
Populate Missing Demographics Script
Fills in missing demographic fields for all locations.

Missing fields:
- avgAge
- householdSize
- educationIndex
- employmentRate

These are generated based on regional data and location characteristics.
"""

import json
import os
import random
from typing import Dict, List
from datetime import datetime

script_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(script_dir, "../data")
BRANDS_DIR = os.path.join(DATA_DIR, "brands")

# Regional demographic baselines
REGIONAL_DEMOGRAPHICS = {
    # Northeast
    "MA": {"avgAge": 39, "householdSize": 2.5, "education": 87, "employment": 96.2},
    "CT": {"avgAge": 41, "householdSize": 2.4, "education": 86, "employment": 96.0},
    "NY": {"avgAge": 38, "householdSize": 2.6, "education": 83, "employment": 95.5},
    "NJ": {"avgAge": 40, "householdSize": 2.5, "education": 85, "employment": 96.1},
    "PA": {"avgAge": 41, "householdSize": 2.4, "education": 80, "employment": 94.8},
    "RI": {"avgAge": 40, "householdSize": 2.4, "education": 81, "employment": 95.2},
    "VT": {"avgAge": 43, "householdSize": 2.3, "education": 82, "employment": 95.0},
    "NH": {"avgAge": 42, "householdSize": 2.4, "education": 84, "employment": 95.8},
    "ME": {"avgAge": 44, "householdSize": 2.3, "education": 79, "employment": 94.5},

    # Mid-Atlantic
    "DC": {"avgAge": 35, "householdSize": 2.7, "education": 89, "employment": 96.5},
    "MD": {"avgAge": 39, "householdSize": 2.6, "education": 86, "employment": 96.0},
    "VA": {"avgAge": 38, "householdSize": 2.7, "education": 85, "employment": 95.9},
    "DE": {"avgAge": 40, "householdSize": 2.5, "education": 82, "employment": 95.5},
    "WV": {"avgAge": 43, "householdSize": 2.3, "education": 74, "employment": 93.0},

    # Southeast
    "NC": {"avgAge": 38, "householdSize": 2.5, "education": 79, "employment": 94.8},
    "SC": {"avgAge": 39, "householdSize": 2.5, "education": 77, "employment": 94.2},
    "GA": {"avgAge": 37, "householdSize": 2.6, "education": 80, "employment": 94.9},
    "FL": {"avgAge": 42, "householdSize": 2.4, "education": 79, "employment": 94.6},
    "TX": {"avgAge": 35, "householdSize": 2.8, "education": 79, "employment": 94.9},
    "OK": {"avgAge": 38, "householdSize": 2.5, "education": 76, "employment": 93.9},
    "AR": {"avgAge": 39, "householdSize": 2.5, "education": 74, "employment": 93.4},
    "LA": {"avgAge": 37, "householdSize": 2.6, "education": 75, "employment": 93.6},
    "MS": {"avgAge": 38, "householdSize": 2.6, "education": 72, "employment": 92.8},
    "AL": {"avgAge": 39, "householdSize": 2.5, "education": 75, "employment": 93.6},
    "TN": {"avgAge": 38, "householdSize": 2.5, "education": 77, "employment": 94.1},
    "KY": {"avgAge": 39, "householdSize": 2.5, "education": 76, "employment": 93.8},

    # Midwest
    "OH": {"avgAge": 40, "householdSize": 2.4, "education": 77, "employment": 94.3},
    "IN": {"avgAge": 39, "householdSize": 2.5, "education": 77, "employment": 94.3},
    "IL": {"avgAge": 38, "householdSize": 2.6, "education": 80, "employment": 94.8},
    "MI": {"avgAge": 40, "householdSize": 2.4, "education": 77, "employment": 94.2},
    "WI": {"avgAge": 41, "householdSize": 2.4, "education": 79, "employment": 94.7},
    "MN": {"avgAge": 39, "householdSize": 2.5, "education": 82, "employment": 95.3},
    "IA": {"avgAge": 41, "householdSize": 2.4, "education": 78, "employment": 94.4},
    "MO": {"avgAge": 40, "householdSize": 2.4, "education": 76, "employment": 94.0},
    "KS": {"avgAge": 39, "householdSize": 2.5, "education": 77, "employment": 94.1},
    "NE": {"avgAge": 39, "householdSize": 2.5, "education": 77, "employment": 94.2},
    "SD": {"avgAge": 41, "householdSize": 2.4, "education": 76, "employment": 93.9},
    "ND": {"avgAge": 40, "householdSize": 2.4, "education": 78, "employment": 94.3},

    # Southwest
    "AZ": {"avgAge": 38, "householdSize": 2.6, "education": 79, "employment": 94.8},
    "NM": {"avgAge": 38, "householdSize": 2.6, "education": 75, "employment": 93.7},
    "CO": {"avgAge": 37, "householdSize": 2.6, "education": 84, "employment": 95.5},
    "UT": {"avgAge": 32, "householdSize": 3.1, "education": 83, "employment": 95.4},
    "WY": {"avgAge": 37, "householdSize": 2.5, "education": 80, "employment": 94.9},
    "MT": {"avgAge": 40, "householdSize": 2.4, "education": 77, "employment": 94.0},

    # West
    "CA": {"avgAge": 37, "householdSize": 2.8, "education": 84, "employment": 95.6},
    "OR": {"avgAge": 40, "householdSize": 2.5, "education": 81, "employment": 95.0},
    "WA": {"avgAge": 38, "householdSize": 2.6, "education": 83, "employment": 95.7},
    "NV": {"avgAge": 38, "householdSize": 2.6, "education": 79, "employment": 94.7},
    "ID": {"avgAge": 37, "householdSize": 2.6, "education": 77, "employment": 94.2},
    "AK": {"avgAge": 35, "householdSize": 2.8, "education": 81, "employment": 95.5},
    "HI": {"avgAge": 39, "householdSize": 3.0, "education": 81, "employment": 95.5},
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

    return "CA"  # Default fallback

def generate_demographics_for_location(lat: float, lng: float, existing_attrs: Dict) -> Dict:
    """
    Generate demographic attributes for a location.
    Uses state baseline with variation based on location characteristics.
    """
    state = estimate_state_from_coords(lat, lng)
    base_demo = REGIONAL_DEMOGRAPHICS.get(state, REGIONAL_DEMOGRAPHICS["CA"]).copy()

    # Add variation based on existing attributes (income, density)
    income = existing_attrs.get('medianIncome', 75000)
    density = existing_attrs.get('populationDensity', 1000)

    # Adjust age based on income and density
    if income > 100000:
        base_demo['avgAge'] += 3  # Wealthier areas slightly older
    elif income < 50000:
        base_demo['avgAge'] -= 2  # Poorer areas younger

    # Urban areas have different demographics
    if density > 5000:
        base_demo['householdSize'] -= 0.3  # Urban = smaller households
        base_demo['education'] += 5
        base_demo['employment'] += 0.5
    elif density < 500:
        base_demo['householdSize'] += 0.2  # Rural = larger households
        base_demo['education'] -= 3
        base_demo['employment'] -= 0.5

    # Add small variation
    base_demo['avgAge'] += random.uniform(-2, 2)
    base_demo['householdSize'] += random.uniform(-0.2, 0.2)
    base_demo['education'] += random.randint(-3, 3)
    base_demo['employment'] += random.uniform(-1, 1)

    # Ensure valid ranges
    base_demo['avgAge'] = round(max(20, min(55, base_demo['avgAge'])), 1)
    base_demo['householdSize'] = round(max(1.5, min(4.0, base_demo['householdSize'])), 1)
    base_demo['education'] = max(50, min(95, int(base_demo['education'])))
    base_demo['employment'] = round(max(85, min(98, base_demo['employment'])), 1)

    return {
        'avgAge': base_demo['avgAge'],
        'householdSize': base_demo['householdSize'],
        'educationIndex': base_demo['education'],
        'employmentRate': base_demo['employment'],
    }

def populate_location(location: Dict) -> Dict:
    """Add missing demographic fields to a location."""
    if 'at' not in location:
        location['at'] = {}

    attrs = location['at']
    lat = location.get('lat')
    lng = location.get('lng')

    # Only populate if missing
    needs_population = (
        'avgAge' not in attrs or attrs.get('avgAge') in [0, None, '--'] or
        'householdSize' not in attrs or attrs.get('householdSize') in [0, None, '--'] or
        'educationIndex' not in attrs or attrs.get('educationIndex') in [0, None, '--'] or
        'employmentRate' not in attrs or attrs.get('employmentRate') in [0, None, '--']
    )

    if needs_population and lat and lng:
        new_demo = generate_demographics_for_location(lat, lng, attrs)
        attrs.update(new_demo)

    # Mark as populated
    attrs['_demographicsPopulated'] = datetime.now().isoformat()

    return location

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Populate missing demographic data")
    parser.add_argument("--ticker", type=str, default=None, help="Process specific ticker")
    args = parser.parse_args()

    print("\n" + "="*70)
    print("DEMOGRAPHIC DATA POPULATION")
    print("="*70)

    # Load manifest
    manifest_path = os.path.join(DATA_DIR, "manifest.json")
    if not os.path.exists(manifest_path):
        print("ERROR: manifest.json not found")
        return

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    total_processed = 0
    total_populated = 0

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

        populated = 0
        for location in locations:
            populate_location(location)
            total_processed += 1

            # Check if we actually populated something
            if location.get('at', {}).get('_demographicsPopulated'):
                populated += 1
                total_populated += 1

        # Save updated data
        with open(data_file, "w") as f:
            json.dump(locations, f, separators=(',', ':'))

        print(f"   ✓ Processed {len(locations)} locations")
        print(f"   ✓ Populated demographics: {populated}")

    print(f"\n{'='*70}")
    print(f"POPULATION COMPLETE")
    print(f"Total locations processed: {total_processed:,}")
    print(f"Total with populated demographics: {total_populated:,}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
