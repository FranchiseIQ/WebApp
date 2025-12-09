import json
import random
import os
import time
import requests

# --- CONFIGURATION ---
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Mapping Tickers to OpenStreetMap Search Terms
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
    "PLAY": ['"Dave & Buster\'s"', '"Main Event"']
}

# Fix output path relative to script
script_dir = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(script_dir, "../data/brands")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def calculate_score(attrs):
    # Simulates score (0-100) based on simulated attributes
    s_demo = min(attrs['medianIncome'] / 100000, 1.0)
    s_comp = max(0, 1.0 - (attrs['competitors'] * 0.15))
    s_access = min(attrs['traffic'] / 50000, 1.0)
    s_site = attrs['visibility'] / 100
    total = (s_demo * 0.35) + (s_comp * 0.25) + (s_access * 0.25) + (s_site * 0.15)
    return int(total * 100)

def fetch_overpass_data(queries):
    # Search within rough US Bounding Box
    search_terms = ""
    for q in queries:
        search_terms += f'nwr["name"~{q},i](24.39,-125.0,49.38,-66.93);'
        search_terms += f'nwr["brand"~{q},i](24.39,-125.0,49.38,-66.93);'

    ql_query = f"[out:json][timeout:180];({search_terms});out center;"

    try:
        response = requests.post(OVERPASS_URL, data={'data': ql_query})
        if response.status_code == 200:
            return response.json().get('elements', [])
        elif response.status_code == 429:
            time.sleep(30)
            return fetch_overpass_data(queries)
        return []
    except:
        return []

def generate_real_data():
    manifest = []
    for ticker, queries in TICKER_QUERIES.items():
        print(f"Querying {ticker}...")
        elements = fetch_overpass_data(queries)
        all_ticker_locs = []

        for el in elements:
            lat = el.get('lat') or el.get('center', {}).get('lat')
            lng = el.get('lon') or el.get('center', {}).get('lon')

            if lat and lng:
                tags = el.get('tags', {})
                name = tags.get('name', queries[0].replace('"',''))

                # Simulate Attributes (Missing from free OSM data)
                attrs = {
                    "medianIncome": random.randint(40000, 130000),
                    "traffic": random.randint(10000, 60000),
                    "competitors": random.randint(0, 6),
                    "visibility": random.randint(60, 100),
                    "walkScore": random.randint(20, 95)
                }

                loc = {
                    "id": f"{ticker}_{el['id']}",
                    "ticker": ticker,
                    "n": name,
                    "a": "US Location (OSM)", # Placeholder address to save space
                    "lat": lat,
                    "lng": lng,
                    "s": calculate_score(attrs),
                    "at": attrs
                }
                all_ticker_locs.append(loc)

        if len(all_ticker_locs) > 0:
            filename = f"{ticker}.json"
            with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
                json.dump(all_ticker_locs, f, separators=(',', ':'))

            manifest.append({
                "ticker": ticker,
                "brands": [q.replace('"','') for q in queries],
                "file": f"data/brands/{filename}",
                "count": len(all_ticker_locs)
            })
        time.sleep(1)

    with open(os.path.join(OUTPUT_DIR, "../manifest.json"), "w") as f:
        json.dump(manifest, f)

if __name__ == "__main__":
    generate_real_data()
