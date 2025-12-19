#!/usr/bin/env python3
"""
QSR Location Expansion Script
Generates location data for missing major Quick Service Restaurant chains.

This script identifies gaps in the current dataset and generates complete
location coverage for major QSR brands using OpenStreetMap via Overpass API.

Missing QSRs to populate:
- McDonald's (MCD): ~13,000 locations
- Starbucks (SBUX): ~15,000 locations
- Subway (SUB): ~21,000 locations (private, estimated)
- Chick-fil-A (CFA): ~3,000 locations (private)
- Chipotle (CMG): ~3,000 locations
- Yum! Brands (YUM): KFC, Taco Bell, Pizza Hut (~30,000 combined)
- And 40+ additional brands currently in generate_data.py but not generated
"""

import json
import os
import time
import requests
import random
from datetime import datetime
from typing import Dict, List, Optional

# Configuration
OVERPASS_URL = "https://overpass-api.de/api/interpreter"
script_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(script_dir, "../data")
BRANDS_DIR = os.path.join(DATA_DIR, "brands")

# Priority expansion list - brands defined in generate_data.py but not in manifest.json
# These are the most important QSRs to add
PRIORITY_QSRS = {
    # TIER 1: CRITICAL (Top national chains by unit count)
    "MCD": {
        "names": ["McDonald's", "McDonalds"],
        "priority": 1,
        "est_locations": 13500,
        "category": "Fast Food Burgers"
    },
    "SBUX": {
        "names": ["Starbucks"],
        "priority": 1,
        "est_locations": 15000,
        "category": "Coffee/Beverages"
    },
    "CMG": {
        "names": ["Chipotle Mexican Grill", "Chipotle"],
        "priority": 1,
        "est_locations": 3200,
        "category": "Fast Casual Mexican"
    },
    "YUM": {
        "names": ["KFC", "Taco Bell", "Pizza Hut", "The Habit Burger"],
        "priority": 1,
        "est_locations": 30000,
        "category": "Yum! Brands Portfolio"
    },
    "QSR": {
        "names": ["Burger King", "Tim Hortons", "Popeyes", "Firehouse Subs"],
        "priority": 1,
        "est_locations": 18000,
        "category": "Restaurant Brands International"
    },

    # TIER 2: HIGH PRIORITY (Major national presence)
    "PZZA": {
        "names": ["Papa John's", "Papa Johns"],
        "priority": 2,
        "est_locations": 3200,
        "category": "Pizza Delivery"
    },
    "PANERA": {
        "names": ["Panera Bread"],
        "priority": 2,
        "est_locations": 2100,
        "category": "Fast Casual Bakery"
    },

    # TIER 3: IMPORTANT PRIVATE CHAINS
    "SUB": {
        "names": ["Subway"],
        "priority": 3,
        "est_locations": 21000,
        "category": "Fast Food Subs (Private)"
    },
    "CFA": {
        "names": ["Chick-fil-A"],
        "priority": 3,
        "est_locations": 3000,
        "category": "Fast Food Chicken (Private)"
    },
    "PANDA": {
        "names": ["Panda Express"],
        "priority": 3,
        "est_locations": 2400,
        "category": "Asian Fast Food (Private)"
    },
    "DQ": {
        "names": ["Dairy Queen"],
        "priority": 3,
        "est_locations": 4500,
        "category": "Ice Cream/Burgers (Private)"
    },
    "LCE": {
        "names": ["Little Caesars"],
        "priority": 3,
        "est_locations": 4000,
        "category": "Pizza (Private)"
    },
    "INNOUT": {
        "names": ["In-N-Out Burger"],
        "priority": 3,
        "est_locations": 360,
        "category": "Regional Burger (Private)"
    },

    # TIER 4: ROARK CAPITAL PORTFOLIO
    "INSPIRE": {
        "names": ["Arby's", "Buffalo Wild Wings", "Sonic Drive-In", "Dunkin'", "Baskin-Robbins", "Jimmy John's"],
        "priority": 4,
        "est_locations": 15000,
        "category": "Roark Capital INSPIRE"
    },
    "FOCUS": {
        "names": ["Auntie Anne's", "Carvel", "Cinnabon", "Jamba", "McAlister's Deli", "Moe's Southwest Grill", "Schlotzsky's"],
        "priority": 4,
        "est_locations": 5000,
        "category": "Roark Capital FOCUS"
    },
    "ROARK": {
        "names": ["Culver's", "Carl's Jr.", "Hardee's", "Nothing Bundt Cakes", "Naf Naf Grill", "Jim 'N Nick's BBQ"],
        "priority": 4,
        "est_locations": 8000,
        "category": "Roark Capital Portfolio"
    },

    # TIER 5: ADDITIONAL MAJOR CHAINS
    "CBRL": {
        "names": ["Cracker Barrel"],
        "priority": 5,
        "est_locations": 660,
        "category": "Casual Dining"
    },
    "TXRH": {
        "names": ["Texas Roadhouse"],
        "priority": 5,
        "est_locations": 640,
        "category": "Casual Dining Steakhouse"
    },
    "BLMN": {
        "names": ["Outback Steakhouse", "Carrabba's", "Bonefish Grill"],
        "priority": 5,
        "est_locations": 1180,
        "category": "Bloomin' Brands Casual Dining"
    },
    "CAKE": {
        "names": ["Cheesecake Factory"],
        "priority": 5,
        "est_locations": 365,
        "category": "Upscale Casual Dining"
    },
    "BJRI": {
        "names": ["BJ's Restaurant & Brewhouse"],
        "priority": 5,
        "est_locations": 210,
        "category": "Casual Dining Brewpub"
    },
    "EAT": {
        "names": ["Chili's", "Maggiano's"],
        "priority": 5,
        "est_locations": 1550,
        "category": "Brinker International Casual Dining"
    },
    "DRI": {
        "names": ["Olive Garden", "LongHorn Steakhouse", "Cheddar's Scratch Kitchen"],
        "priority": 5,
        "est_locations": 2100,
        "category": "Dine Global Casual Dining"
    },

    # TIER 6: GROWING/REGIONAL CHAINS
    "FIVE": {
        "names": ["Five Guys"],
        "priority": 6,
        "est_locations": 1500,
        "category": "Premium Fast Casual Burgers"
    },
    "CANE": {
        "names": ["Raising Cane's"],
        "priority": 6,
        "est_locations": 800,
        "category": "Fast Food Chicken (Growing)"
    },
    "WHATA": {
        "names": ["Whataburger"],
        "priority": 6,
        "est_locations": 950,
        "category": "Regional Fast Food Burgers (TX)"
    },
    "ZAX": {
        "names": ["Zaxby's"],
        "priority": 6,
        "est_locations": 900,
        "category": "Regional Fast Food Chicken (SE)"
    },
    "BO": {
        "names": ["Bojangles"],
        "priority": 6,
        "est_locations": 800,
        "category": "Regional Fast Food Chicken (SE)"
    },
    "JM": {
        "names": ["Jersey Mike's"],
        "priority": 6,
        "est_locations": 2300,
        "category": "Growing Fast Casual Subs"
    },
    "DUTCH": {
        "names": ["Dutch Bros"],
        "priority": 6,
        "est_locations": 700,
        "category": "Growing Coffee Chain"
    },
}

# Additional chains from generate_data.py not yet classified
ADDITIONAL_CHAINS = {
    "VAC": {"names": ["Marriott Vacation Club"], "category": "Lodging", "is_qsr": False},
    "TNL": {"names": ["Club Wyndham"], "category": "Lodging", "is_qsr": False},
}

def fetch_overpass_data(queries: List[str], ticker: str, timeout: int = 120) -> List[Dict]:
    """
    Fetch location data from OpenStreetMap via Overpass API.
    """
    elements = []

    for query in queries:
        search_terms = f'nwr["name"~{query},i](24.39,-125.0,49.38,-66.93);'
        search_terms += f'nwr["brand"~{query},i](24.39,-125.0,49.38,-66.93);'

        ql_query = f"[out:json][timeout:{timeout}];({search_terms});out center;"

        try:
            print(f"    Querying: {query}...")
            response = requests.post(OVERPASS_URL, data={'data': ql_query}, timeout=timeout + 30)

            if response.status_code == 200:
                data = response.json().get('elements', [])
                elements.extend(data)
                print(f"      Found {len(data)} locations")
            elif response.status_code == 429:
                print(f"    Rate limited on {ticker}. Waiting 60s...")
                time.sleep(60)
                # Retry
                response = requests.post(OVERPASS_URL, data={'data': ql_query}, timeout=timeout + 30)
                if response.status_code == 200:
                    data = response.json().get('elements', [])
                    elements.extend(data)
                    print(f"      Found {len(data)} locations (after retry)")
            else:
                print(f"    Error {response.status_code} on {query}")

        except requests.exceptions.Timeout:
            print(f"    Timeout on {ticker}")
        except Exception as e:
            print(f"    Error on {ticker}: {e}")

        time.sleep(2)  # Be polite to the API

    return elements

def generate_location_with_attrs(element: Dict, ticker: str, brand_names: List[str]) -> Optional[Dict]:
    """Convert OSM element to location with attributes."""
    lat = element.get('lat') or element.get('center', {}).get('lat')
    lng = element.get('lon') or element.get('center', {}).get('lon')

    if not lat or not lng:
        return None

    tags = element.get('tags', {})
    name = tags.get('name', brand_names[0].replace('"', ''))

    # Build address
    addr_parts = []
    if tags.get('addr:housenumber') and tags.get('addr:street'):
        addr_parts.append(f"{tags['addr:housenumber']} {tags['addr:street']}")
    if tags.get('addr:city'):
        addr_parts.append(tags['addr:city'])
    if tags.get('addr:state'):
        addr_parts.append(tags['addr:state'])
    address = ", ".join(addr_parts) if addr_parts else f"US Location ({round(lat, 4)}, {round(lng, 4)})"

    # Generate correlated attributes
    base_income = random.randint(35000, 150000)
    income_factor = base_income / 100000

    attrs = {
        # Market Potential
        "medianIncome": base_income,
        "populationDensity": int(random.gauss(3000, 1500) * income_factor),
        "consumerSpending": min(150, max(50, int(random.gauss(85, 20) * income_factor))),
        "growthRate": round(random.uniform(-1.5, 8.0), 1),

        # Competitive Landscape
        "competitors": random.randint(0, 8),
        "marketSaturation": random.randint(10, 85),

        # Accessibility
        "traffic": random.randint(8000, 75000),
        "walkScore": random.randint(15, 98),
        "transitScore": random.randint(0, 95),
        "bikingScore": random.randint(10, 95),

        # Site Characteristics
        "visibility": random.randint(55, 100),
        "crimeIndex": random.randint(5, 75),
        "realEstateIndex": int(random.gauss(60, 25)),

        # Additional Demographics
        "avgAge": round(random.uniform(28, 52), 1),
        "householdSize": round(random.uniform(1.8, 3.5), 1),
        "educationIndex": random.randint(40, 95),
        "employmentRate": round(random.uniform(88, 98), 1),
        "roadDensity": random.randint(20, 95),

        # Data source documentation
        "_dataSource": "OpenStreetMap + Simulated Attributes",
        "_generatedAt": datetime.now().isoformat(),
    }

    # Ensure valid ranges
    attrs["populationDensity"] = max(100, min(15000, attrs["populationDensity"]))
    attrs["realEstateIndex"] = max(10, min(120, attrs["realEstateIndex"]))

    # Calculate scores (import from generate_data)
    try:
        from generate_data import calculate_score, calculate_sub_scores
        score = calculate_score(attrs)
        sub_scores = calculate_sub_scores(attrs)
    except ImportError:
        # Fallback calculation
        score = int((
            (attrs["medianIncome"] / 100000 * 0.15) +
            (attrs["populationDensity"] / 5000 * 0.10) +
            (attrs["consumerSpending"] / 100 * 0.10) +
            (attrs["growthRate"] / 5 * 0.05) +
            (max(0, 1 - attrs["competitors"] * 0.12) * 0.15) +
            (max(0, 1 - attrs["marketSaturation"] / 100) * 0.05) +
            (attrs["traffic"] / 50000 * 0.10) +
            (attrs["walkScore"] / 100 * 0.08) +
            (attrs["transitScore"] / 100 * 0.07) +
            (attrs["visibility"] / 100 * 0.06) +
            (max(0, 1 - attrs["crimeIndex"] / 100) * 0.05) +
            (max(0, 1 - abs(attrs["realEstateIndex"] - 60) / 60) * 0.04)
        ) * 100)
        sub_scores = {
            "marketPotential": int((attrs["medianIncome"] / 100000) * 100),
            "competitiveLandscape": int((max(0, 1 - attrs["competitors"] * 0.12)) * 100),
            "accessibility": int(((attrs["traffic"] / 50000 + attrs["walkScore"] / 100 + attrs["transitScore"] / 100) / 3) * 100),
            "siteCharacteristics": int((attrs["visibility"] / 100) * 100),
        }

    return {
        "id": f"{ticker}_{element['id']}",
        "ticker": ticker,
        "n": name,
        "a": address,
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "s": score,
        "ss": sub_scores,
        "at": attrs
    }

def generate_qsr_locations(priority_min: int = 1, priority_max: int = 6) -> Dict[str, List[Dict]]:
    """
    Generate location data for priority QSRs.
    """
    print("\n" + "="*70)
    print("QSR LOCATION EXPANSION")
    print("="*70)

    os.makedirs(BRANDS_DIR, exist_ok=True)

    results = {
        "generated": [],
        "failed": [],
        "skipped": []
    }

    # Load existing manifest
    manifest_path = os.path.join(DATA_DIR, "manifest.json")
    existing_manifest = []
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            existing_manifest = json.load(f)

    existing_tickers = {item["ticker"] for item in existing_manifest}

    # Process each QSR
    for ticker, info in sorted(PRIORITY_QSRS.items(), key=lambda x: x[1]["priority"]):
        priority = info["priority"]

        if priority_min <= priority <= priority_max:
            # Skip if already in manifest
            if ticker in existing_tickers:
                print(f"\n⏭️  {ticker} ({info['category']}) - ALREADY IN MANIFEST")
                results["skipped"].append(ticker)
                continue

            print(f"\n🔄 {ticker} ({info['category']}) - EST. {info['est_locations']:,} locations")
            print(f"   Chains: {', '.join(info['names'][:3])}")

            try:
                # Fetch locations from OSM
                elements = fetch_overpass_data(
                    [f'"{name}"' for name in info["names"]],
                    ticker
                )

                if elements:
                    # Convert to location format
                    locations = []
                    for element in elements:
                        loc = generate_location_with_attrs(element, ticker, info["names"])
                        if loc:
                            locations.append(loc)

                    if locations:
                        # Save brand data
                        output_file = os.path.join(BRANDS_DIR, f"{ticker}.json")
                        with open(output_file, "w") as f:
                            json.dump(locations, f, separators=(',', ':'))

                        print(f"   ✅ SAVED: {len(locations):,} locations to {ticker}.json")
                        results["generated"].append({
                            "ticker": ticker,
                            "count": len(locations),
                            "category": info["category"]
                        })
                    else:
                        print(f"   ❌ No valid locations parsed")
                        results["failed"].append(ticker)
                else:
                    print(f"   ⚠️  No locations found from OSM")
                    results["failed"].append(ticker)

            except Exception as e:
                print(f"   ❌ ERROR: {e}")
                results["failed"].append(ticker)

            time.sleep(3)  # Rate limiting

    return results

def update_manifest(new_brands: Dict[str, List[Dict]]):
    """Add newly generated brands to manifest."""
    manifest_path = os.path.join(DATA_DIR, "manifest.json")

    # Load existing manifest
    if os.path.exists(manifest_path):
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
    else:
        manifest = []

    existing_tickers = {item["ticker"] for item in manifest}

    # Add new brands
    for brand_info in new_brands["generated"]:
        if brand_info["ticker"] not in existing_tickers:
            ticker = brand_info["ticker"]
            qsr_info = PRIORITY_QSRS[ticker]

            manifest.append({
                "ticker": ticker,
                "brands": qsr_info["names"],
                "file": f"data/brands/{ticker}.json",
                "count": brand_info["count"],
                "category": qsr_info["category"],
                "generatedAt": datetime.now().isoformat()
            })

    # Save updated manifest
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n✅ Updated manifest with {len(new_brands['generated'])} new brands")

def print_summary(results: Dict):
    """Print summary of expansion."""
    print("\n" + "="*70)
    print("EXPANSION SUMMARY")
    print("="*70)

    if results["generated"]:
        print(f"\n✅ GENERATED: {len(results['generated'])} brands")
        total_locations = 0
        for brand in results["generated"]:
            print(f"   {brand['ticker']:6} {brand['category']:40} {brand['count']:6,} locations")
            total_locations += brand["count"]
        print(f"   {'TOTAL':6} {' '*40} {total_locations:6,} locations")

    if results["failed"]:
        print(f"\n❌ FAILED: {len(results['failed'])} brands")
        for ticker in results["failed"]:
            print(f"   {ticker}")

    if results["skipped"]:
        print(f"\n⏭️  SKIPPED (Already in manifest): {len(results['skipped'])} brands")
        for ticker in results["skipped"]:
            print(f"   {ticker}")

    print("\n" + "="*70)

def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Expand QSR location coverage")
    parser.add_argument("--priority", type=int, default=1, help="Priority level (1-6)")
    parser.add_argument("--tier", type=int, default=3, help="Max priority tier to generate")
    args = parser.parse_args()

    # Generate locations for specified priority range
    results = generate_qsr_locations(priority_min=args.priority, priority_max=args.tier)

    # Update manifest
    if results["generated"]:
        update_manifest(results)

    # Print summary
    print_summary(results)

if __name__ == "__main__":
    main()
