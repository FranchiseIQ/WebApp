import json
import random
import os
import time
import requests

# --- CONFIGURATION ---
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# EXPANDED TICKER LIST (Includes Private Equity & Private Chains)
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

# Fix output path
script_dir = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.join(script_dir, "../data/brands")
os.makedirs(OUTPUT_DIR, exist_ok=True)

def calculate_score(attrs):
    """
    Calculate suitability score (0-100) based on weighted attributes.

    Methodology:
    - Demographics (35%): Median income normalized to $100k baseline
    - Competition (25%): Penalty of 15% per nearby competitor (max 6)
    - Accessibility (25%): Traffic count normalized to 50k baseline
    - Site Quality (15%): Visibility score (60-100 scale)
    """
    s_demo = min(attrs['medianIncome'] / 100000, 1.0)
    s_comp = max(0, 1.0 - (attrs['competitors'] * 0.15))
    s_access = min(attrs['traffic'] / 50000, 1.0)
    s_site = attrs['visibility'] / 100
    total = (s_demo * 0.35) + (s_comp * 0.25) + (s_access * 0.25) + (s_site * 0.15)
    return int(total * 100)

def fetch_overpass_data(queries):
    """Query OpenStreetMap with 15-minute timeout for comprehensive data."""
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

def generate_real_data():
    manifest = []
    keys = list(TICKER_QUERIES.keys())
    random.shuffle(keys)  # Randomize order to distribute API load

    print(f"Fetching data for {len(keys)} brand groups...")
    print("This may take 60-90 minutes for full US coverage.\n")

    for ticker in keys:
        queries = TICKER_QUERIES[ticker]
        print(f"Querying {ticker} ({queries[0].replace('\"', '')}...)...")

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

                # Simulate attributes with methodology tracking
                attrs = {
                    "medianIncome": random.randint(40000, 130000),
                    "traffic": random.randint(10000, 60000),
                    "competitors": random.randint(0, 6),
                    "visibility": random.randint(60, 100),
                    "walkScore": random.randint(20, 95),
                    # Methodology notes for transparency
                    "_incomeSource": "ACS 5-Year Estimate (Simulated)",
                    "_trafficSource": "AADT Estimate (Simulated)",
                    "_walkSource": "Walk Score API (Simulated)"
                }

                loc = {
                    "id": f"{ticker}_{el['id']}",
                    "ticker": ticker,
                    "n": name,
                    "a": address,
                    "lat": round(lat, 6),
                    "lng": round(lng, 6),
                    "s": calculate_score(attrs),
                    "at": attrs
                }
                all_ticker_locs.append(loc)

        if len(all_ticker_locs) > 0:
            filename = f"{ticker}.json"
            with open(os.path.join(OUTPUT_DIR, filename), "w") as f:
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

        time.sleep(2)  # Be polite to the API

    # Save manifest
    with open(os.path.join(OUTPUT_DIR, "../manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)

    total = sum(m['count'] for m in manifest)
    print(f"\n{'='*50}")
    print(f"Data generation complete!")
    print(f"Total: {total:,} locations across {len(manifest)} brand groups")

if __name__ == "__main__":
    generate_real_data()
