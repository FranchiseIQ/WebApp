#!/usr/bin/env python3
"""
Unified Sports Data Fetcher

Fetches NFL and NBA scores from ESPN API and finds YouTube highlights for completed games.
Outputs a single sports_data.json file that the frontend reads.
"""

import json
import requests
import os
from datetime import datetime, timedelta

# --- CONFIGURATION ---
DATA_FILE = "sports_data.json"
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# ESPN Endpoints (free, no key needed)
NFL_URL = "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
NBA_URL = "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Official YouTube channel IDs for better highlight search
CHANNEL_IDS = {
    "NFL": "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    "NBA": "UCWJ2lWNubArHWmf3FIHbfcQ"
}

# --- HELPER FUNCTIONS ---

def get_youtube_highlight(query, league, existing_cache=None):
    """Finds a highlight video for a completed game using YouTube Data API."""
    if not YOUTUBE_API_KEY:
        print(f"  No YouTube API key, skipping video search for: {query}")
        return None

    # Check cache first to save API quota
    cache_key = query.lower().replace(" ", "_")
    if existing_cache and cache_key in existing_cache:
        print(f"  Using cached video for: {query}")
        return existing_cache[cache_key]

    try:
        # First try: Search official channel
        params = {
            'part': 'snippet',
            'q': query,
            'key': YOUTUBE_API_KEY,
            'maxResults': 1,
            'type': 'video',
            'videoEmbeddable': 'true',
            'order': 'relevance'
        }

        # Try official channel first
        channel_id = CHANNEL_IDS.get(league)
        if channel_id:
            params['channelId'] = channel_id

        resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        data = resp.json()

        # Check for API errors
        if "error" in data:
            print(f"  YouTube API error: {data['error'].get('message', 'Unknown error')}")
            return None

        if "items" in data and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            embed_url = f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"
            print(f"  Found video: {video_id}")
            return embed_url

        # Fallback: Search without channel restriction
        if channel_id:
            del params['channelId']
            resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
            data = resp.json()

            if "items" in data and len(data["items"]) > 0:
                video_id = data["items"][0]["id"]["videoId"]
                embed_url = f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"
                print(f"  Found video (fallback): {video_id}")
                return embed_url

        print(f"  No video found for: {query}")
        return None

    except requests.exceptions.Timeout:
        print(f"  Timeout searching YouTube for: {query}")
        return None
    except Exception as e:
        print(f"  Error searching YouTube for {query}: {e}")
        return None


def process_game(event, sport_name, video_cache=None):
    """Standardizes game data for both NFL and NBA."""
    try:
        comp = event["competitions"][0]
        status_type = event["status"]["type"]
        status_state = status_type.get("state", "pre")  # pre, in, post

        # Teams
        home = next((t for t in comp["competitors"] if t["homeAway"] == "home"), None)
        away = next((t for t in comp["competitors"] if t["homeAway"] == "away"), None)

        if not home or not away:
            return None

        home_team = home.get("team", {})
        away_team = away.get("team", {})

        home_name = home_team.get("shortDisplayName") or home_team.get("displayName", "Home")
        away_name = away_team.get("shortDisplayName") or away_team.get("displayName", "Away")
        home_full = home_team.get("displayName", home_name)
        away_full = away_team.get("displayName", away_name)

        # Scores
        home_score = home.get("score", "0")
        away_score = away.get("score", "0")

        # Records
        home_records = home.get("records", [])
        away_records = away.get("records", [])
        home_record = home_records[0].get("summary", "") if home_records else ""
        away_record = away_records[0].get("summary", "") if away_records else ""

        # Status details
        is_final = status_state == "post" or status_type.get("completed", False)
        is_active = status_state == "in"
        status_detail = status_type.get("detail", "Scheduled")

        # Clock/Period for live games
        clock = ""
        period = ""
        if is_active:
            situation = comp.get("situation", {})
            clock = situation.get("lastPlay", {}).get("clock", comp.get("status", {}).get("displayClock", ""))
            period = comp.get("status", {}).get("period", "")

        # Video search for completed games only
        video_url = None
        if is_final:
            game_date = datetime.fromisoformat(event["date"].replace("Z", "+00:00"))
            query = f"{sport_name} {away_name} vs {home_name} highlights {game_date.strftime('%B %d %Y')}"
            video_url = get_youtube_highlight(query, sport_name, video_cache)

        # Venue
        venue = comp.get("venue", {})
        venue_name = venue.get("fullName", "")

        return {
            "id": event.get("id", ""),
            "date": event.get("date", ""),
            "status": status_detail,
            "is_active": is_active,
            "is_final": is_final,
            "clock": clock,
            "period": period,
            "venue": venue_name,
            "homeTeam": {
                "name": home_full,
                "shortName": home_name,
                "abbreviation": home_team.get("abbreviation", ""),
                "logoUrl": home_team.get("logo", ""),
                "record": home_record
            },
            "awayTeam": {
                "name": away_full,
                "shortName": away_name,
                "abbreviation": away_team.get("abbreviation", ""),
                "logoUrl": away_team.get("logo", ""),
                "record": away_record
            },
            "homeScore": home_score,
            "awayScore": away_score,
            "video_url": video_url  # YouTube embed URL
        }
    except Exception as e:
        print(f"  Error processing game: {e}")
        return None


# --- SPORT SPECIFIC FETCHERS ---

def fetch_nfl(video_cache=None):
    """Fetch NFL scores and standings."""
    print("Fetching NFL Data...")
    try:
        resp = requests.get(NFL_URL, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        week_info = data.get("week", {})
        week_num = week_info.get("number", "Unknown")

        events = data.get("events", [])
        print(f"  Found {len(events)} NFL games")

        games = []
        for event in events:
            game = process_game(event, "NFL", video_cache)
            if game:
                game["league"] = "NFL"
                games.append(game)

        return {"week": week_num, "games": games}
    except requests.exceptions.RequestException as e:
        print(f"  NFL fetch error: {e}")
        return {"week": "Unknown", "games": []}
    except Exception as e:
        print(f"  NFL processing error: {e}")
        return {"week": "Unknown", "games": []}


def fetch_nba(video_cache=None):
    """Fetch NBA scores - today's games and yesterday's games for highlights."""
    print("Fetching NBA Data...")
    all_games = []
    seen_ids = set()

    try:
        # 1. Get Today's Schedule (Default Endpoint)
        print("  Fetching today's NBA games...")
        today_resp = requests.get(NBA_URL, timeout=15)
        today_resp.raise_for_status()
        today_data = today_resp.json()

        for event in today_data.get("events", []):
            game = process_game(event, "NBA", video_cache)
            if game and game["id"] not in seen_ids:
                game["league"] = "NBA"
                all_games.append(game)
                seen_ids.add(game["id"])

        print(f"  Found {len(all_games)} games today")

        # 2. Get Yesterday's Scores (For Highlights)
        yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
        yst_url = f"{NBA_URL}?dates={yesterday}"

        print(f"  Fetching yesterday's NBA games ({yesterday})...")
        yst_resp = requests.get(yst_url, timeout=15)
        yst_resp.raise_for_status()
        yst_data = yst_resp.json()

        yesterday_count = 0
        for event in yst_data.get("events", []):
            game = process_game(event, "NBA", video_cache)
            if game and game["id"] not in seen_ids:
                game["league"] = "NBA"
                all_games.append(game)
                seen_ids.add(game["id"])
                yesterday_count += 1

        print(f"  Found {yesterday_count} games from yesterday")

        return {"games": all_games}
    except requests.exceptions.RequestException as e:
        print(f"  NBA fetch error: {e}")
        return {"games": []}
    except Exception as e:
        print(f"  NBA processing error: {e}")
        return {"games": []}


def load_existing_data():
    """Load existing data to preserve video cache."""
    try:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r") as f:
                return json.load(f)
    except Exception as e:
        print(f"Could not load existing data: {e}")
    return None


def build_video_cache(existing_data):
    """Build a cache of existing video URLs to save API quota."""
    cache = {}
    if not existing_data:
        return cache

    try:
        # Cache NFL videos
        nfl_games = existing_data.get("nfl", {}).get("games", [])
        for game in nfl_games:
            if game.get("video_url"):
                away = game.get("awayTeam", {}).get("shortName", "")
                home = game.get("homeTeam", {}).get("shortName", "")
                if away and home:
                    key = f"nfl_{away}_vs_{home}".lower().replace(" ", "_")
                    cache[key] = game["video_url"]

        # Cache NBA videos
        nba_games = existing_data.get("nba", {}).get("games", [])
        for game in nba_games:
            if game.get("video_url"):
                away = game.get("awayTeam", {}).get("shortName", "")
                home = game.get("homeTeam", {}).get("shortName", "")
                if away and home:
                    key = f"nba_{away}_vs_{home}".lower().replace(" ", "_")
                    cache[key] = game["video_url"]

        if cache:
            print(f"Loaded {len(cache)} cached video URLs")
    except Exception as e:
        print(f"Error building video cache: {e}")

    return cache


# --- MAIN ---

def main():
    print("=" * 50)
    print("Sports Data Updater")
    print("=" * 50)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"YouTube API Key: {'Present' if YOUTUBE_API_KEY else 'Not set'}")
    print()

    # Load existing data for video cache
    existing_data = load_existing_data()
    video_cache = build_video_cache(existing_data)

    # Fetch all sports data
    nfl_data = fetch_nfl(video_cache)
    nba_data = fetch_nba(video_cache)

    # Build final output
    final_data = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S EST"),
        "nfl": nfl_data,
        "nba": nba_data
    }

    # Summary stats
    nfl_games = len(nfl_data.get("games", []))
    nba_games = len(nba_data.get("games", []))
    nfl_final = len([g for g in nfl_data.get("games", []) if g.get("is_final")])
    nba_final = len([g for g in nba_data.get("games", []) if g.get("is_final")])
    nfl_videos = len([g for g in nfl_data.get("games", []) if g.get("video_url")])
    nba_videos = len([g for g in nba_data.get("games", []) if g.get("video_url")])

    print()
    print("=" * 50)
    print("Summary:")
    print(f"  NFL: {nfl_games} games ({nfl_final} final, {nfl_videos} with video)")
    print(f"  NBA: {nba_games} games ({nba_final} final, {nba_videos} with video)")
    print("=" * 50)

    # Save to JSON
    with open(DATA_FILE, "w") as f:
        json.dump(final_data, f, indent=2)

    print(f"\nSaved to {DATA_FILE}")
    print("Done!")


if __name__ == "__main__":
    main()
