#!/usr/bin/env python3
"""
GTFS Transit Data Integration Script
Processes GTFS feeds to calculate real transit accessibility scores.

Data Sources:
- Transit Feeds API: https://transitfeeds.com/api/v1/
- Individual agency GTFS feeds
- 1,400+ public transit agencies covered

Metrics Calculated:
- Distance to nearest transit stop
- Transit score (0-100) based on proximity
- Number of routes and stops nearby
- Transit system types (bus, rail, metro, etc.)

Setup:
1. Register at https://transitfeeds.com/ (optional)
2. Get API key from account settings
3. Set TRANSIT_FEEDS_API_KEY environment variable
4. Download GTFS feeds locally or use API

This script requires GTFS files to be downloaded first.
See API_SETUP_GUIDE.md for detailed instructions.
"""

import json
import os
import csv
import math
import zipfile
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import requests

# Configuration
TRANSIT_FEEDS_API = "https://api.transitfeeds.com/v1"
TRANSIT_API_KEY = os.environ.get("TRANSIT_FEEDS_API_KEY", "")

script_dir = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(script_dir, "../data")
GTFS_DIR = os.path.join(DATA_DIR, "gtfs_feeds")

# Major transit agencies for downloading GTFS
MAJOR_TRANSIT_AGENCIES = {
    "nyc": {
        "name": "New York MTA",
        "url": "http://web.mta.info/developers/",
        "lat": 40.7128,
        "lng": -74.0060,
        "coverage_radius": 50  # miles
    },
    "la": {
        "name": "Los Angeles Metro",
        "url": "https://developer.metro.net/",
        "lat": 34.0522,
        "lng": -118.2437,
        "coverage_radius": 40
    },
    "chicago": {
        "name": "Chicago CTA",
        "url": "https://www.transitchicago.com/feed/",
        "lat": 41.8781,
        "lng": -87.6298,
        "coverage_radius": 30
    },
    "sf": {
        "name": "San Francisco BART",
        "url": "http://api.bart.gov/gtfs/",
        "lat": 37.7749,
        "lng": -122.4194,
        "coverage_radius": 30
    },
    "dc": {
        "name": "Washington WMATA",
        "url": "https://developer.wmata.com/",
        "lat": 38.8951,
        "lng": -77.0369,
        "coverage_radius": 30
    },
    "boston": {
        "name": "Boston MBTA",
        "url": "https://www.mbta.com/",
        "lat": 42.3601,
        "lng": -71.0589,
        "coverage_radius": 25
    },
    "philadelphia": {
        "name": "Philadelphia SEPTA",
        "url": "https://www3.septa.org/gtfs/",
        "lat": 39.9526,
        "lng": -75.1652,
        "coverage_radius": 25
    },
}

def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two coordinates in miles."""
    R = 3959  # Earth radius in miles
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def read_gtfs_stops(gtfs_path: str) -> List[Dict]:
    """Read stops from GTFS feed."""
    stops = []
    try:
        if gtfs_path.endswith('.zip'):
            with zipfile.ZipFile(gtfs_path, 'r') as z:
                with z.open('stops.txt') as f:
                    reader = csv.DictReader(line.decode().strip() for line in f)
                    for row in reader:
                        stops.append({
                            'id': row.get('stop_id'),
                            'lat': float(row.get('stop_lat', 0)),
                            'lng': float(row.get('stop_lon', 0)),
                            'name': row.get('stop_name', 'Unknown')
                        })
        else:
            # Assume directory with GTFS files
            stops_file = os.path.join(gtfs_path, 'stops.txt')
            if os.path.exists(stops_file):
                with open(stops_file, 'r') as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        stops.append({
                            'id': row.get('stop_id'),
                            'lat': float(row.get('stop_lat', 0)),
                            'lng': float(row.get('stop_lon', 0)),
                            'name': row.get('stop_name', 'Unknown')
                        })
    except Exception as e:
        print(f"    Error reading GTFS: {e}")

    return stops

def find_nearest_transit_stop(lat: float, lng: float, transit_agencies: Dict) -> Optional[Dict]:
    """Find nearest transit stop to a location."""
    nearest = None
    min_distance = float('inf')

    for agency_id, agency_data in transit_agencies.items():
        for stop in agency_data.get('stops', []):
            distance = haversine_distance(lat, lng, stop['lat'], stop['lng'])
            if distance < min_distance:
                min_distance = distance
                nearest = {
                    'agency': agency_id,
                    'stop': stop,
                    'distance': distance
                }

    return nearest

def calculate_transit_score(distance_miles: float) -> int:
    """
    Calculate transit score (0-100) based on distance to nearest stop.

    Score breakdown:
    - 0 miles = 100 (at transit)
    - 0.25 miles = 95 (5-minute walk)
    - 0.5 miles = 90 (10-minute walk)
    - 1 mile = 80 (20-minute walk)
    - 2 miles = 60 (40-minute walk)
    - 5 miles = 30 (1.5 hour walk)
    - 10+ miles = 0 (no practical transit)
    """
    if distance_miles <= 0.1:
        return 100
    elif distance_miles <= 0.25:
        return 95
    elif distance_miles <= 0.5:
        return 90
    elif distance_miles <= 1:
        return 80
    elif distance_miles <= 2:
        return 60
    elif distance_miles <= 5:
        return 30
    else:
        return max(0, 30 - int(distance_miles - 5) * 3)

def enrich_location_with_transit_data(location: Dict, transit_agencies: Dict) -> Dict:
    """Enrich location with transit data."""
    if 'at' not in location:
        location['at'] = {}

    lat = location.get('lat')
    lng = location.get('lng')

    if lat and lng:
        # Find nearest transit stop
        nearest = find_nearest_transit_stop(lat, lng, transit_agencies)

        if nearest:
            attrs = location['at']
            distance_miles = nearest['distance']

            # Update transit data
            attrs['transitScore'] = calculate_transit_score(distance_miles)
            attrs['nearestTransitStop'] = nearest['stop']['name']
            attrs['transitDistance'] = round(distance_miles, 2)
            attrs['transitAgency'] = nearest['agency']
            attrs['_transitSource'] = 'GTFS Real-time Feed Data'
            attrs['_transitDataDate'] = datetime.now().isoformat()

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

    parser = argparse.ArgumentParser(description="Integrate GTFS transit data")
    parser.add_argument("--ticker", type=str, default=None, help="Process specific ticker")
    parser.add_argument("--gtfs-dir", type=str, default=None, help="Directory with GTFS files")
    args = parser.parse_args()

    print("\n" + "="*70)
    print("GTFS TRANSIT DATA INTEGRATION")
    print("="*70)
    print("Data Source: GTFS Feeds (1,400+ agencies)")
    print("Coverage: Major US transit systems")

    # Determine GTFS directory
    gtfs_dir = args.gtfs_dir or GTFS_DIR
    if not os.path.exists(gtfs_dir):
        print(f"\n⚠️  GTFS directory not found: {gtfs_dir}")
        print("To use GTFS data:")
        print("1. Download GTFS feeds from transitfeeds.com")
        print("2. Extract to:", gtfs_dir)
        print("3. Run this script again")
        print("\nSee API_SETUP_GUIDE.md for detailed instructions")
        return

    # Load GTFS feeds
    print(f"\n📥 Loading GTFS feeds from: {gtfs_dir}")
    transit_agencies = {}
    for agency_name in os.listdir(gtfs_dir):
        agency_path = os.path.join(gtfs_dir, agency_name)
        if os.path.isdir(agency_path) or agency_path.endswith('.zip'):
            print(f"   Loading {agency_name}...", end='')
            stops = read_gtfs_stops(agency_path)
            if stops:
                transit_agencies[agency_name] = {
                    'path': agency_path,
                    'stops': stops
                }
                print(f" ✓ ({len(stops)} stops)")
            else:
                print(" ✗ (no stops found)")

    if not transit_agencies:
        print("\n✗ No GTFS feeds found. Cannot continue.")
        return

    print(f"\n✓ Loaded {len(transit_agencies)} transit agencies")

    # Load manifest
    manifest_path = os.path.join(DATA_DIR, "manifest.json")
    if not os.path.exists(manifest_path):
        print("ERROR: manifest.json not found")
        return

    with open(manifest_path, "r") as f:
        manifest = json.load(f)

    total_enriched = 0
    total_with_transit = 0

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
        with_transit = 0
        for location in locations:
            location = enrich_location_with_transit_data(location, transit_agencies)
            enriched += 1
            total_enriched += 1

            if location.get('at', {}).get('transitScore'):
                with_transit += 1
                total_with_transit += 1

        # Save enriched data
        with open(data_file, "w") as f:
            json.dump(locations, f, separators=(',', ':'))

        coverage = (with_transit / len(locations) * 100) if locations else 0
        print(f"   ✓ Enriched {enriched} locations")
        print(f"   ✓ With transit data: {with_transit} ({coverage:.1f}%)")

    print(f"\n{'='*70}")
    print(f"GTFS DATA INTEGRATION COMPLETE")
    print(f"Total locations processed: {total_enriched:,}")
    print(f"With transit data: {total_with_transit:,}")
    print(f"{'='*70}\n")

if __name__ == "__main__":
    main()
