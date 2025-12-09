import json
import random
import os
import time
import requests

# --- CONFIGURATION ---

# The Overpass API Endpoint
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Mapping Tickers to OpenStreetMap Search Terms (Regex capable)
# We search for these names in the "name" or "brand" tags
TICKER_QUERIES = {
    "MCD":  ['"McDonald\'s"', '"McDonalds"'],
    "YUM":  ['"KFC"', '"Taco Bell"', '"Pizza Hut"', '"The Habit Burger"'],
    "QSR":  ['"Burger King"', '"Tim Hortons"', '"Popeyes"', '"Firehouse Subs"'],
    "WEN":  ['"Wendy\'s"'],
    "DPZ":  ['"Domino\'s Pizza"', '"Dominos Pizza"'],
    "JACK": ['"Jack in the Box"', '"Del Taco"'],
    "WING": ['"Wingstop"'],
    "SHAK": ['"Shake Shack"'],
    "DENN": ['"Denny\'s"', '"Keke\'s"'],
    "DIN":  ['"Applebee\'s"', '"IHOP"'],
    "DNUT": ['"Krispy Kreme"', '"Insomnia Cookies"'],
    "NATH": ['"Nathan\'s Famous"'],
    "RRGB": ['"Red Robin"'],
    "DRVN": ['"Take 5"', '"Meineke"', '"Maaco"'],
    "HRB":  ['"H&R Block"'],
    "MCW":  ['"Mister Car Wash"'],
    "SERV": ['"ServiceMaster"', '"Merry Maids"'],
    "ROL":  ['"Orkin"'],
    "PLNT": ['"Planet Fitness"'],
    "MAR":  ['"Marriott"', '"Sheraton"', '"Westin"', '"Ritz Carlton"', '"Courtyard by Marriott"'],
    "HLT":  ['"Hilton"', '"DoubleTree"', '"Hampton Inn"', '"Embassy Suites"'],
    "H":    ['"Hyatt"', '"Andaz"'],
    "CHH":  ['"Comfort Inn"', '"Quality Inn"', '"Econo Lodge"'],
    "WH":   ['"Wyndham"', '"Ramada"', '"Days Inn"', '"Super 8"'],
    "VAC":  ['"Marriott Vacation Club"'],
    "TNL":  ['"Club Wyndham"'],
    "PLAY": ['"Dave & Buster\'s"', '"Main Event"'],
    "ARCO": ['"McDonald\'s"'],  # Latin America - will filter by coords
    "CMG":  ['"Chipotle"'],
    "SBUX": ['"Starbucks"'],
    "PZZA": ['"Papa John\'s"', '"Papa Johns"'],
    "TXRH": ['"Texas Roadhouse"'],
    "CAKE": ['"Cheesecake Factory"'],
    "DRI":  ['"Olive Garden"', '"LongHorn Steakhouse"'],
    "EAT":  ['"Chili\'s"', '"Maggiano\'s"'],
    "BLMN": ['"Outback Steakhouse"', '"Carrabba\'s"'],
    "IHG":  ['"Holiday Inn"', '"Crowne Plaza"', '"InterContinental"'],
    "XPOF": ['"Pure Barre"', '"CycleBar"', '"Club Pilates"', '"StretchLab"']
}

# Brand metadata for the manifest
BRAND_META = {
    "MCD":  {"name": "McDonald's", "color": "#FFC72C", "type": "QSR"},
    "YUM":  {"name": "Yum! Brands", "color": "#E4002B", "type": "QSR"},
    "QSR":  {"name": "Restaurant Brands", "color": "#FF8732", "type": "QSR"},
    "WEN":  {"name": "Wendy's", "color": "#E2203C", "type": "QSR"},
    "DPZ":  {"name": "Domino's Pizza", "color": "#006491", "type": "QSR"},
    "JACK": {"name": "Jack in the Box", "color": "#E31837", "type": "QSR"},
    "WING": {"name": "Wingstop", "color": "#00503C", "type": "QSR"},
    "SHAK": {"name": "Shake Shack", "color": "#1F1F1F", "type": "QSR"},
    "DENN": {"name": "Denny's", "color": "#FFA500", "type": "Casual"},
    "DIN":  {"name": "Dine Brands", "color": "#1E90FF", "type": "Casual"},
    "DNUT": {"name": "Krispy Kreme", "color": "#00A94F", "type": "QSR"},
    "NATH": {"name": "Nathan's Famous", "color": "#FFD700", "type": "QSR"},
    "RRGB": {"name": "Red Robin", "color": "#C8102E", "type": "Casual"},
    "DRVN": {"name": "Driven Brands", "color": "#E31837", "type": "Services"},
    "HRB":  {"name": "H&R Block", "color": "#00A650", "type": "Services"},
    "MCW":  {"name": "Mister Car Wash", "color": "#0072CE", "type": "Services"},
    "SERV": {"name": "ServiceMaster", "color": "#E4002B", "type": "Services"},
    "ROL":  {"name": "Rollins/Orkin", "color": "#003DA5", "type": "Services"},
    "PLNT": {"name": "Planet Fitness", "color": "#5C2D91", "type": "Fitness"},
    "MAR":  {"name": "Marriott", "color": "#B4975A", "type": "Hotel"},
    "HLT":  {"name": "Hilton", "color": "#002855", "type": "Hotel"},
    "H":    {"name": "Hyatt", "color": "#6B6B6B", "type": "Hotel"},
    "CHH":  {"name": "Choice Hotels", "color": "#1C4587", "type": "Hotel"},
    "WH":   {"name": "Wyndham", "color": "#0077C8", "type": "Hotel"},
    "VAC":  {"name": "Marriott Vacations", "color": "#C4A052", "type": "Hotel"},
    "TNL":  {"name": "Travel + Leisure", "color": "#00A5E3", "type": "Hotel"},
    "PLAY": {"name": "Dave & Buster's", "color": "#E31837", "type": "Casual"},
    "ARCO": {"name": "Arcos Dorados", "color": "#DA291C", "type": "QSR"},
    "CMG":  {"name": "Chipotle", "color": "#441500", "type": "QSR"},
    "SBUX": {"name": "Starbucks", "color": "#00704A", "type": "QSR"},
    "PZZA": {"name": "Papa John's", "color": "#CD1126", "type": "QSR"},
    "TXRH": {"name": "Texas Roadhouse", "color": "#8B4513", "type": "Casual"},
    "CAKE": {"name": "Cheesecake Factory", "color": "#8B0000", "type": "Casual"},
    "DRI":  {"name": "Darden Restaurants", "color": "#6B8E23", "type": "Casual"},
    "EAT":  {"name": "Brinker International", "color": "#C41E3A", "type": "Casual"},
    "BLMN": {"name": "Bloomin' Brands", "color": "#CD853F", "type": "Casual"},
    "IHG":  {"name": "IHG Hotels", "color": "#007A53", "type": "Hotel"},
    "XPOF": {"name": "Xponential Fitness", "color": "#FF6B35", "type": "Fitness"}
}

# Fix output path
script_dir = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(script_dir, "../data/brands")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def calculate_score(attrs):
    """
    Assigns a simulated score to the REAL location.
    (We simulate this because we don't have free access to real Census data for these specific coords)
    """
    s_demo = min(attrs['medianIncome'] / 100000, 1.0)
    s_comp = max(0, 1.0 - (attrs['competitors'] * 0.15))
    s_access = min(attrs['traffic'] / 50000, 1.0)
    s_site = attrs['visibility'] / 100
    total = (s_demo * 0.35) + (s_comp * 0.25) + (s_access * 0.25) + (s_site * 0.15)
    return int(total * 100)

def fetch_overpass_data(queries, max_results=500):
    """
    Queries OpenStreetMap for the given brand names within the USA.
    """
    # Build the QL query
    # We use a bounding box for the roughly continental US to speed it up
    # (24.39, -125.0) to (49.38, -66.93)

    search_terms = ""
    for q in queries:
        # Search for nodes and ways (buildings) with the name
        search_terms += f'nwr["name"~{q},i](24.396308,-125.000000,49.384358,-66.934570);'
        search_terms += f'nwr["brand"~{q},i](24.396308,-125.000000,49.384358,-66.934570);'

    ql_query = f"""
    [out:json][timeout:180];
    (
      {search_terms}
    );
    out center {max_results};
    """

    try:
        response = requests.post(OVERPASS_URL, data={'data': ql_query}, timeout=200)
        if response.status_code == 200:
            return response.json().get('elements', [])
        elif response.status_code == 429:
            print("  Rate limited. Waiting 30s...")
            time.sleep(30)
            return fetch_overpass_data(queries, max_results) # Retry
        else:
            print(f"  Error {response.status_code}: {response.text[:200]}")
            return []
    except requests.exceptions.Timeout:
        print("  Request timed out. Retrying with smaller limit...")
        return fetch_overpass_data(queries, max_results // 2)
    except Exception as e:
        print(f"  Connection error: {e}")
        return []

def generate_real_data():
    manifest = []
    print(f"Fetching REAL data from OpenStreetMap for {len(TICKER_QUERIES)} tickers...")

    for ticker, queries in TICKER_QUERIES.items():
        print(f"Querying {ticker} ({queries[0]}...)...")

        elements = fetch_overpass_data(queries)

        all_ticker_locs = []

        for el in elements:
            # Extract Lat/Lng
            lat = el.get('lat')
            lng = el.get('lon')

            # If it's a 'way' (building outline), use the center point
            if not lat and 'center' in el:
                lat = el['center'].get('lat')
                lng = el['center'].get('lon')

            if lat and lng:
                # Extract clean name/address
                tags = el.get('tags', {})
                name = tags.get('name', tags.get('brand', queries[0].replace('"','')))

                # Try to build an address from OSM tags
                addr_house = tags.get('addr:housenumber', '')
                addr_street = tags.get('addr:street', '')
                addr_city = tags.get('addr:city', '')
                addr_state = tags.get('addr:state', '')

                if addr_house and addr_street:
                    address = f"{addr_house} {addr_street}"
                    if addr_city:
                        address += f", {addr_city}"
                    if addr_state:
                        address += f", {addr_state}"
                elif addr_city:
                    address = f"{name} - {addr_city}"
                    if addr_state:
                        address += f", {addr_state}"
                else:
                    # Fallback if OSM doesn't have the specific address tags
                    address = f"{name} ({round(lat, 4)}, {round(lng, 4)})"

                # Simulate Attributes for the Scoring Engine
                # (Since we don't have real proprietary data for this specific point)
                attrs = {
                    "medianIncome": random.randint(40000, 130000),
                    "traffic": random.randint(10000, 60000),
                    "competitors": random.randint(0, 6),
                    "visibility": random.randint(60, 100),
                    "walkScore": random.randint(20, 95)
                }

                score = calculate_score(attrs)

                loc = {
                    "id": f"{ticker}_{el['id']}",
                    "name": name,
                    "address": address,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "score": score,
                    "walkScore": attrs["walkScore"],
                    "brand": ticker
                }
                all_ticker_locs.append(loc)

        # Save Ticker JSON
        if len(all_ticker_locs) > 0:
            filename = f"{ticker}.json"
            # Use separators to minify JSON
            with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
                json.dump(all_ticker_locs, f, separators=(',', ':'))

            print(f"  > Saved {len(all_ticker_locs)} locations for {ticker}")

            meta = BRAND_META.get(ticker, {"name": ticker, "color": "#666666", "type": "Other"})
            manifest.append({
                "ticker": ticker,
                "name": meta["name"],
                "color": meta["color"],
                "type": meta["type"],
                "brands": [q.replace('"','') for q in queries],
                "file": f"brands/{filename}",
                "count": len(all_ticker_locs)
            })
        else:
            print(f"  > No locations found for {ticker}")

        # Be polite to the API
        time.sleep(2)

    # Save Manifest
    manifest_path = os.path.join(OUTPUT_DIR, "../manifest.json")
    with open(manifest_path, "w") as f:
        json.dump({
            "version": "2.0",
            "source": "OpenStreetMap",
            "generated": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
            "brands": manifest,
            "totalLocations": sum(m["count"] for m in manifest)
        }, f, indent=2)

    print(f"\nReal Data Fetch Complete.")
    print(f"Total: {sum(m['count'] for m in manifest)} locations across {len(manifest)} brands")

if __name__ == "__main__":
    generate_real_data()
