#!/usr/bin/env python3
"""
NFL Scores & Highlights Fetcher

Fetches NFL scores from ESPN API and finds YouTube highlights using the YouTube Data API.
Saves data to nfl_data.json for the frontend to consume.

Usage:
    python fetch_scores.py

Requires:
    - YOUTUBE_API_KEY environment variable (from GitHub Secrets)
    - requests library (pip install requests)
"""

import json
import requests
import os
from datetime import datetime

# Configuration
DATA_FILE = "nfl_data.json"
ESPN_URL = "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard"
YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# NFL Official YouTube Channel ID for better quality results
NFL_CHANNEL_ID = "UCDVYQ4Zhbm3S2dlz7P1GBDg"


def load_existing_data():
    """Load existing data file or return empty structure."""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Warning: Could not parse existing data file")
            return {"weeks": {}}
    return {"weeks": {}}


def get_youtube_highlight(query, game_id, existing_videos=None):
    """
    Search YouTube for game highlights and return embeddable URL.

    Args:
        query: Search query string
        game_id: Game ID to check cache
        existing_videos: Dict of existing video URLs by game ID (to save API quota)

    Returns:
        Embeddable YouTube URL or None
    """
    # Check if we already have a video for this game (quota optimization)
    if existing_videos and game_id in existing_videos:
        cached_url = existing_videos.get(game_id)
        if cached_url:
            print(f"  Using cached video for game {game_id}")
            return cached_url

    if not YOUTUBE_API_KEY:
        print("  No YouTube API Key found, skipping video search")
        return None

    try:
        params = {
            'part': 'snippet',
            'q': query,
            'key': YOUTUBE_API_KEY,
            'maxResults': 1,
            'type': 'video',
            'order': 'relevance',
            'videoDuration': 'medium',  # 4-20 minutes (typical highlight length)
            'channelId': NFL_CHANNEL_ID  # Restrict to NFL official channel
        }

        resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
        resp.raise_for_status()
        data = resp.json()

        if "items" in data and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            title = data["items"][0]["snippet"]["title"]
            print(f"  Found: {title}")
            return f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"
        else:
            # Try again without channel restriction
            print("  No results from NFL channel, trying broader search...")
            params.pop('channelId', None)
            resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
            data = resp.json()

            if "items" in data and len(data["items"]) > 0:
                video_id = data["items"][0]["id"]["videoId"]
                title = data["items"][0]["snippet"]["title"]
                print(f"  Found: {title}")
                return f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"

    except requests.exceptions.RequestException as e:
        print(f"  YouTube API Error: {e}")
    except KeyError as e:
        print(f"  YouTube Response Error: {e}")

    return None


def fetch_espn_data():
    """Fetch current NFL scoreboard from ESPN API."""
    try:
        print("Fetching NFL data from ESPN...")
        resp = requests.get(ESPN_URL, timeout=10)
        resp.raise_for_status()
        return resp.json()
    except requests.exceptions.RequestException as e:
        print(f"ESPN API Error: {e}")
        return None


def get_team_record(team_data):
    """Extract team record from ESPN data."""
    records = team_data.get("records", [])
    if records and len(records) > 0:
        return records[0].get("summary", "0-0")
    return "0-0"


def main():
    print(f"=== NFL Scores Fetcher ===")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"YouTube API Key: {'Present' if YOUTUBE_API_KEY else 'Missing'}")
    print()

    # Load existing data (for video caching)
    data = load_existing_data()

    # Build cache of existing videos
    existing_videos = {}
    for week_num, week_data in data.get("weeks", {}).items():
        for game in week_data.get("games", []):
            if game.get("video_url"):
                existing_videos[game["id"]] = game["video_url"]

    # Fetch fresh data from ESPN
    api_data = fetch_espn_data()
    if not api_data:
        print("Failed to fetch ESPN data. Exiting.")
        return

    # Extract week info
    week_info = api_data.get("week", {})
    week_num = str(week_info.get("number", 1))
    season_type = api_data.get("season", {}).get("type", 2)  # 1=Pre, 2=Reg, 3=Post

    if season_type == 3:
        label = "Playoffs"
    elif season_type == 1:
        label = f"Preseason Week {week_num}"
    else:
        label = f"Week {week_num}"

    print(f"Processing: {label}")
    print(f"Season Type: {season_type}")
    print()

    current_week_games = []
    videos_found = 0

    for event in api_data.get("events", []):
        competition = event["competitions"][0]
        status_state = event["status"]["type"]["state"]  # pre, in, post
        status_detail = event["status"]["type"]["detail"]  # "Final", "10:00 - 4th", etc.

        # Get teams
        home_team = next(t for t in competition["competitors"] if t["homeAway"] == "home")
        away_team = next(t for t in competition["competitors"] if t["homeAway"] == "away")

        home_name = home_team["team"]["displayName"]
        away_name = away_team["team"]["displayName"]

        print(f"Game: {away_name} @ {home_name} - {status_detail}")

        # Determine game status
        if status_state == "post":
            game_status = "Final"
        elif status_state == "in":
            game_status = "Live"
        else:
            game_status = "Scheduled"

        # Search for video highlights if game is completed
        video_url = None
        if status_state == "post":
            query = f"NFL {away_name} vs {home_name} Week {week_num} highlights"
            video_url = get_youtube_highlight(query, event["id"], existing_videos)
            if video_url:
                videos_found += 1

        # Build game object
        game_obj = {
            "id": event["id"],
            "date": event["date"],
            "status": game_status,
            "status_detail": status_detail,
            "venue": competition.get("venue", {}).get("fullName", ""),
            "home": {
                "name": home_name,
                "abbreviation": home_team["team"]["abbreviation"],
                "logo": home_team["team"]["logo"],
                "score": home_team.get("score", "0"),
                "record": get_team_record(home_team)
            },
            "away": {
                "name": away_name,
                "abbreviation": away_team["team"]["abbreviation"],
                "logo": away_team["team"]["logo"],
                "score": away_team.get("score", "0"),
                "record": get_team_record(away_team)
            },
            "video_url": video_url
        }
        current_week_games.append(game_obj)

    # Update data structure
    data["current_week"] = week_num
    data["season_type"] = season_type
    data["weeks"][week_num] = {
        "label": label,
        "games": current_week_games
    }
    data["last_updated"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")

    # Save to file
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)

    print()
    print(f"=== Summary ===")
    print(f"Games processed: {len(current_week_games)}")
    print(f"Videos found: {videos_found}")
    print(f"Data saved to: {DATA_FILE}")
    print("Done!")


if __name__ == "__main__":
    main()
