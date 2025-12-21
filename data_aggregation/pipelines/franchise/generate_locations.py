#!/usr/bin/env python3
"""
Generate Franchise Location Data from OpenStreetMap

Uses the Overpass API to fetch franchise locations across the United States
and generates a comprehensive dataset with demographic and market attributes
for suitability scoring.

Data Source: OpenStreetMap via Overpass API (free, no authentication required)

Output:
- data/brands/*.json - Individual franchise location files (one per ticker)
- data/manifest.json - Index of all brands and their location counts

Runtime: 60-90 minutes for full US coverage (depending on API availability)

Note: This script generates synthetic demographic data for demonstration.
In production, integrate real data sources (Census API, Walk Score API, etc.)
"""

import sys
import json
import random
import time
import argparse
import requests
from pathlib import Path

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import BRANDS_DATA_DIR, MANIFEST_JSON

# --- CONFIGURATION ---

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Expanded ticker list with query terms
# Maps stock ticker/company identifiers to search terms for OpenStreetMap
TICKER_QUERIES = {
    # --- PUBLIC GIANTS ---
    "MCD":  ['"McDonald\'s"', '"McDonalds"'],
    "SBUX": ['"Starbucks"'],
    "YUM":  ['"KFC"', '"Taco Bell"', '"Pizza Hut"', '"The Habit Burger"'],
    "QSR":  ['"Burger King"', '"Tim Hortons"', '"Popeyes"', '"Firehouse Subs"'],
    "WEN":  ['"Wendy\'s"'],
    "DPZ":  ['"Domino\'s Pizza"', '"Dominos Pizza"'],
    "CMG":  ['"Chipotle Mexican Grill"', '"Chipotle"'],
    "JACK": ['"Jack in the Box"', '"Del Taco"'],
    "WING": ['"Wingstop"'],
    "SHAK": ['"Shake Shack"'],
    "PZZA": ['"Papa John\'s"', '"Papa Johns"'],
    "DENN": ['"Denny\'s"', '"Keke\'s"'],
    "DIN":  ['"Applebee\'s"', '"IHOP"'],
    "DNUT": ['"Krispy Kreme"', '"Insomnia Cookies"'],
    "CBRL": ['"Cracker Barrel"'],
    "TXRH": ['"Texas Roadhouse"'],
    "BLMN": ['"Outback Steakhouse"', '"Carrabba\'s"', '"Bonefish Grill"'],
    "CAKE": ['"Cheesecake Factory"'],
    "BJRI": ['"BJ\'s Restaurant"'],
    "CHUY": ['"Chuy\'s"'],
    "EAT":  ['"Chili\'s"', '"Maggiano\'s"'],
    "DRI":  ['"Olive Garden"', '"LongHorn Steakhouse"', '"Cheddar\'s"'],
    "RRGB": ['"Red Robin"'],
    "PLAY": ['"Dave & Buster\'s"', '"Main Event"'],
    "NATH": ['"Nathan\'s Famous"'],

    # --- ROARK CAPITAL (The Big Portfolio) ---
    "INSPIRE": ['"Arby\'s"', '"Buffalo Wild Wings"', '"Sonic Drive-In"', '"Dunkin\'"', '"Baskin-Robbins"', '"Jimmy John\'s"'],
    "FOCUS":   ['"Auntie Anne\'s"', '"Carvel"', '"Cinnabon"', '"Jamba"', '"McAlister\'s Deli"', '"Moe\'s Southwest Grill"', '"Schlotzsky\'s"'],
    "DRIVEN":  ['"Take 5"', '"Meineke"', '"Maaco"', '"CARSTAR"', '"1-800-Radiator"', '"Auto Glass Now"'],
    "ROARK":   ['"Massage Envy"', '"Primrose Schools"', '"Mathnasium"', '"Nothing Bundt Cakes"', '"Naf Naf Grill"', '"Jim \'N Nick\'s BBQ"', '"Culver\'s"', '"Carl\'s Jr."', '"Hardee\'s"'],

    # --- PRIVATE GIANTS (The Missing Links) ---
    "SUB":   ['"Subway"'],
    "CFA":   ['"Chick-fil-A"'],
    "PANDA": ['"Panda Express"'],
    "DQ":    ['"Dairy Queen"'],
    "LCE":   ['"Little Caesars"'],
    "JM":    ['"Jersey Mike\'s"'],
    "FIVE":  ['"Five Guys"'],
    "CANE":  ['"Raising Cane\'s"'],
    "WHATA": ['"Whataburger"'],
    "ZAX":   ['"Zaxby\'s"'],
    "BO":    ['"Bojangles"'],
    "WAWA":  ['"Wawa"'],
    "SHEETZ":['"Sheetz"'],
    "INNOUT":['"In-N-Out Burger"'],
    "PANERA":['"Panera Bread"'],
    "DUTCH": ['"Dutch Bros"'],

    # --- HOTELS (Public & Private) ---
    "MAR":  ['"Marriott"', '"Sheraton"', '"Westin"', '"Ritz Carlton"', '"Courtyard by Marriott"', '"Residence Inn"', '"Fairfield Inn"'],
    "HLT":  ['"Hilton"', '"DoubleTree"', '"Hampton Inn"', '"Embassy Suites"', '"Homewood Suites"'],
    "H":    ['"Hyatt"', '"Andaz"', '"Hyatt Place"'],
    "IHG":  ['"Holiday Inn"', '"Crowne Plaza"', '"InterContinental"', '"Staybridge Suites"', '"Candlewood Suites"', '"Kimpton"'],
    "WH":   ['"Wyndham"', '"Ramada"', '"Days Inn"', '"Super 8"', '"La Quinta"', '"Microtel"'],
    "CHH":  ['"Comfort Inn"', '"Quality Inn"', '"Econo Lodge"', '"Rodeway Inn"', '"Cambria Hotels"'],
    "BW":   ['"Best Western"', '"SureStay"'],
    "G6":   ['"Motel 6"', '"Studio 6"'],
    "VAC":  ['"Marriott Vacation Club"'],
    "TNL":  ['"Club Wyndham"'],

    # --- SERVICES ---
    "MCW":  ['"Mister Car Wash"'],
    "PLNT": ['"Planet Fitness"'],
    "XPOF": ['"Pure Barre"', '"CycleBar"', '"Club Pilates"', '"StretchLab"'],
    "HRB":  ['"H&R Block"'],
    "SERV": ['"ServiceMaster"', '"Merry Maids"', '"Terminix"'],
    "ROL":  ['"Orkin"'],
    "HLE":  ['"Hertz"'],
    "CAR":  ['"Avis"', '"Budget"'],
    "UHAL": ['"U-Haul"']
}


def calculate_score(attrs):
    """
    Calculate comprehensive suitability score (0-100) based on 12 weighted factors.

    Enhanced Methodology with granular scoring:

    MARKET POTENTIAL (40% total):
    - Demographics (15%): Median income normalized to $100k baseline
    - Population Density (10%): People per sq mile normalized to 5000 baseline
    - Consumer Spending (10%): Spending index normalized to 100 baseline
    - Growth Rate (5%): Area growth rate normalized to 5% baseline

    COMPETITIVE LANDSCAPE (20% total):
    - Competition (15%): Penalty of 12% per nearby competitor (max 8)
    - Market Saturation (5%): Saturation index (0-100, lower is better)

    ACCESSIBILITY (25% total):
    - Traffic Volume (10%): AADT normalized to 50k baseline
    - Walk Score (8%): Walkability normalized to 100
    - Transit Score (7%): Public transit access normalized to 100

    SITE CHARACTERISTICS (15% total):
    - Visibility (6%): Site visibility score (0-100)
    - Safety Index (5%): Crime index inverted (lower crime = higher score)
    - Real Estate Value (4%): Cost efficiency ratio (moderate costs preferred)
    """
    # Market Potential Factors (40%)
    s_demo = min(attrs.get('medianIncome', 0) / 100000, 1.0)
    s_density = min(attrs.get('populationDensity', 0) / 5000, 1.0)
    s_spending = min(attrs.get('consumerSpending', 0) / 100, 1.0)
    s_growth = min(attrs.get('growthRate', 0) / 5.0, 1.0)

    # Competitive Landscape Factors (20%)
    s_comp = max(0, 1.0 - (attrs.get('competitors', 0) * 0.12))
    s_saturation = max(0, 1.0 - (attrs.get('marketSaturation', 0) / 100))

    # Accessibility Factors (25%)
    s_traffic = min(attrs.get('traffic', 0) / 50000, 1.0)
    s_walk = attrs.get('walkScore', 0) / 100
    s_transit = attrs.get('transitScore', 0) / 100

    # Site Characteristics Factors (15%)
    s_visibility = attrs.get('visibility', 0) / 100
    s_safety = max(0, 1.0 - (attrs.get('crimeIndex', 0) / 100))
    re_value = attrs.get('realEstateIndex', 50)
    s_realestate = 1.0 - abs(re_value - 60) / 60

    # Calculate weighted total
    total = (
        (s_demo * 0.15) +
        (s_density * 0.10) +
        (s_spending * 0.10) +
        (s_growth * 0.05) +
        (s_comp * 0.15) +
        (s_saturation * 0.05) +
        (s_traffic * 0.10) +
        (s_walk * 0.08) +
        (s_transit * 0.07) +
        (s_visibility * 0.06) +
        (s_safety * 0.05) +
        (s_realestate * 0.04)
    )

    return int(total * 100)


def calculate_sub_scores(attrs):
    """Calculate category sub-scores for detailed breakdown."""
    s_demo = min(attrs.get('medianIncome', 0) / 100000, 1.0)
    s_density = min(attrs.get('populationDensity', 0) / 5000, 1.0)
    s_spending = min(attrs.get('consumerSpending', 0) / 100, 1.0)
    s_growth = min(attrs.get('growthRate', 0) / 5.0, 1.0)
    market_score = ((s_demo * 0.375) + (s_density * 0.25) + (s_spending * 0.25) + (s_growth * 0.125)) * 100

    s_comp = max(0, 1.0 - (attrs.get('competitors', 0) * 0.12))
    s_saturation = max(0, 1.0 - (attrs.get('marketSaturation', 0) / 100))
    competition_score = ((s_comp * 0.75) + (s_saturation * 0.25)) * 100

    s_traffic = min(attrs.get('traffic', 0) / 50000, 1.0)
    s_walk = attrs.get('walkScore', 0) / 100
    s_transit = attrs.get('transitScore', 0) / 100
    accessibility_score = ((s_traffic * 0.40) + (s_walk * 0.32) + (s_transit * 0.28)) * 100

    s_visibility = attrs.get('visibility', 0) / 100
    s_safety = max(0, 1.0 - (attrs.get('crimeIndex', 0) / 100))
    re_value = attrs.get('realEstateIndex', 50)
    s_realestate = 1.0 - abs(re_value - 60) / 60
    site_score = ((s_visibility * 0.40) + (s_safety * 0.33) + (s_realestate * 0.27)) * 100

    return {
        "marketPotential": round(market_score, 1),
        "competitiveLandscape": round(competition_score, 1),
        "accessibility": round(accessibility_score, 1),
        "siteCharacteristics": round(site_score, 1)
    }


def fetch_overpass_data(queries):
    """Query OpenStreetMap with timeout for comprehensive data."""
    search_terms = ""
    for q in queries:
        search_terms += f'nwr["name"~{q},i](24.39,-125.0,49.38,-66.93);'
        search_terms += f'nwr["brand"~{q},i](24.39,-125.0,49.38,-66.93);'

    ql_query = f"[out:json][timeout:900];({search_terms});out center;"

    try:
        response = requests.post(OVERPASS_URL, data={'data': ql_query}, timeout=960)
        if response.status_code == 200:
            return response.json().get('elements', [])
        elif response.status_code == 429:
            print("  Rate limited. Waiting 60s...")
            time.sleep(60)
            return fetch_overpass_data(queries)
        else:
            print(f"  Error {response.status_code}")
        return []
    except requests.exceptions.Timeout:
        print("  Timeout - retrying...")
        time.sleep(30)
        return []
    except Exception as e:
        print(f"  Error: {e}")
        return []


def generate_real_data(batch_tickers=None):
    """
    Generate location data from OpenStreetMap.

    Args:
        batch_tickers: Optional list of ticker symbols to process.
                      If None, processes all available tickers.
    """
    # Ensure output directories exist
    BRANDS_DATA_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []

    # Use provided batch or all tickers
    if batch_tickers:
        keys = [t for t in batch_tickers if t in TICKER_QUERIES]
        if not keys:
            print(f"⚠️  No valid tickers in batch: {batch_tickers}")
            return False
    else:
        keys = list(TICKER_QUERIES.keys())
        random.shuffle(keys)

    print(f"Fetching data for {len(keys)} brand groups...")
    print("This may take 60-90 minutes for full US coverage.\n")

    for ticker in keys:
        queries = TICKER_QUERIES[ticker]
        query_name = queries[0].replace('"', '')
        print(f"Querying {ticker} ({query_name}...)...")

        elements = fetch_overpass_data(queries)
        all_ticker_locs = []

        for el in elements:
            lat = el.get('lat') or el.get('center', {}).get('lat')
            lng = el.get('lon') or el.get('center', {}).get('lon')

            if lat and lng:
                tags = el.get('tags', {})
                name = tags.get('name', queries[0].replace('"', ''))

                # Build address from OSM tags
                addr_parts = []
                if tags.get('addr:housenumber') and tags.get('addr:street'):
                    addr_parts.append(f"{tags['addr:housenumber']} {tags['addr:street']}")
                if tags.get('addr:city'):
                    addr_parts.append(tags['addr:city'])
                if tags.get('addr:state'):
                    addr_parts.append(tags['addr:state'])
                address = ", ".join(addr_parts) if addr_parts else f"US Location ({round(lat, 4)}, {round(lng, 4)})"

                # Simulate comprehensive attributes with methodology tracking
                base_income = random.randint(35000, 150000)
                income_factor = base_income / 100000

                attrs = {
                    # Market Potential Factors
                    "medianIncome": base_income,
                    "populationDensity": int(random.gauss(3000, 1500) * income_factor),
                    "consumerSpending": min(150, max(50, int(random.gauss(85, 20) * income_factor))),
                    "growthRate": round(random.uniform(-1.5, 8.0), 1),

                    # Competitive Landscape Factors
                    "competitors": random.randint(0, 8),
                    "marketSaturation": random.randint(10, 85),

                    # Accessibility Factors
                    "traffic": random.randint(8000, 75000),
                    "walkScore": random.randint(15, 98),
                    "transitScore": random.randint(0, 95),

                    # Site Characteristics Factors
                    "visibility": random.randint(55, 100),
                    "crimeIndex": random.randint(5, 75),
                    "realEstateIndex": int(random.gauss(60, 25)),

                    # Additional Demographic Data
                    "avgAge": round(random.uniform(28, 52), 1),
                    "householdSize": round(random.uniform(1.8, 3.5), 1),
                    "educationIndex": random.randint(40, 95),
                    "employmentRate": round(random.uniform(88, 98), 1),

                    # Methodology notes for transparency
                    "_incomeSource": "ACS 5-Year Estimate (Simulated)",
                    "_trafficSource": "AADT Estimate (Simulated)",
                    "_walkSource": "Walk Score API (Simulated)",
                    "_transitSource": "Transit Score API (Simulated)",
                    "_crimeSource": "FBI UCR Data (Simulated)",
                    "_realEstateSource": "Zillow ZHVI (Simulated)",
                    "_demographicSource": "Census Bureau (Simulated)"
                }

                # Ensure valid ranges
                attrs["populationDensity"] = max(100, min(15000, attrs["populationDensity"]))
                attrs["realEstateIndex"] = max(10, min(120, attrs["realEstateIndex"]))

                # Calculate sub-scores for UI display
                sub_scores = calculate_sub_scores(attrs)

                loc = {
                    "id": f"{ticker}_{el['id']}",
                    "ticker": ticker,
                    "n": name,
                    "a": address,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "s": calculate_score(attrs),
                    "ss": sub_scores,
                    "at": attrs
                }
                all_ticker_locs.append(loc)

        if len(all_ticker_locs) > 0:
            filename = f"{ticker}.json"
            filepath = BRANDS_DATA_DIR / filename
            with open(filepath, "w") as f:
                json.dump(all_ticker_locs, f, separators=(',', ':'))

            print(f"  > Saved {len(all_ticker_locs)} locations")

            manifest.append({
                "ticker": ticker,
                "brands": [q.replace('"', '') for q in queries],
                "file": f"data/brands/{filename}",
                "count": len(all_ticker_locs)
            })
        else:
            print(f"  > No locations found")

        time.sleep(2)

    # Save manifest
    MANIFEST_JSON.parent.mkdir(parents=True, exist_ok=True)
    with open(MANIFEST_JSON, "w") as f:
        json.dump(manifest, f, indent=2)

    total = sum(m['count'] for m in manifest)
    print(f"\n{'='*70}")
    print(f"✓ Data generation complete!")
    print(f"Total: {total:,} locations across {len(manifest)} brand groups")
    print(f"Output: {MANIFEST_JSON}")
    print(f"Location files: {BRANDS_DATA_DIR}/*.json")
    print("=" * 70)

    return True


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description='Generate franchise location data from OpenStreetMap'
    )
    parser.add_argument(
        '--batch',
        help='Comma-separated list of ticker symbols to process (e.g., "MCD,SBUX,YUM")',
        default=None
    )
    parser.add_argument(
        '--batch-size',
        type=int,
        help='Maximum number of brands to process',
        default=None
    )

    args = parser.parse_args()

    # Parse batch tickers if provided
    batch_tickers = None
    if args.batch:
        batch_tickers = [t.strip().upper() for t in args.batch.split(',')]
        if args.batch_size:
            batch_tickers = batch_tickers[:args.batch_size]

    success = generate_real_data(batch_tickers)
    sys.exit(0 if success else 1)
