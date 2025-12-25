#!/usr/bin/env python3
"""
Unified Sports Data Fetcher

Fetches scores from ESPN API for all major sports leagues (NFL, NBA, WNBA, NHL, MLB, MLS)
and optionally finds YouTube highlights for completed games.

Data Sources:
- ESPN API (free, no key required)
- YouTube API (optional, requires YOUTUBE_API_KEY env var)

Output:
- FranchiseMap/data/sports_data.json - Unified file with all leagues
- data/[sport]/current-week.json - NFL current week
- data/[sport]/current-games.json - NBA, WNBA, NHL, MLB, MLS current games
"""

import sys
import json
import requests
from pathlib import Path
from datetime import datetime, timedelta
import os

# Add repo root to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent))

from data_aggregation.config.paths_config import (
    SPORTS_DATA_JSON,
    FOOTBALL_GAMES_JSON,
    BASKETBALL_GAMES_JSON,
    HOCKEY_GAMES_JSON,
    BASEBALL_GAMES_JSON,
    SOCCER_GAMES_JSON,
)

# --- CONFIGURATION ---

YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY")

# ESPN Endpoints (free, no key needed)
ESPN_URLS = {
    "NFL": "http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard",
    "NBA": "http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "WNBA": "http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard",
    "NHL": "http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard",
    "MLB": "http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard",
    "MLS": "http://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard"
}

# Championship/Finals dates for off-season fallback (approximate date ranges)
# Format: (start_month, start_day, end_month, end_day, year_offset)
# year_offset: 0 = current year, -1 = previous year
CHAMPIONSHIP_DATES = {
    "WNBA": [(10, 1, 10, 25, 0)],       # WNBA Finals: October
    "MLB": [(10, 25, 11, 5, 0)],         # World Series: late Oct - early Nov
    "MLS": [(12, 1, 12, 15, 0)],         # MLS Cup: early December
    "NHL": [(6, 1, 6, 25, 0)],           # Stanley Cup Finals: June
    "NBA": [(6, 1, 6, 25, 0)],           # NBA Finals: June
    "NFL": [(2, 1, 2, 15, 0)],           # Super Bowl: early February
}

YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search"

# Official YouTube channel IDs for better highlight search
CHANNEL_IDS = {
    "NFL": "UCDVYQ4Zhbm3S2dlz7P1GBDg",
    "NBA": "UCWJ2lWNubArHWmf3FIHbfcQ",
    "WNBA": "UCJm4Yt-5hzFqbfGH2xbIZWA",
    "NHL": "UCqFMzb-4AUf6WAIbl132QKA",
    "MLB": "UCoLrcjPV5PbUrUyXq5mjc_A",
    "MLS": "UCSZbXT5TLLW_i-5W8FZpFsg"
}

# --- HELPER FUNCTIONS ---

def get_youtube_highlight(query, league, existing_cache=None):
    """Finds a highlight video for a completed game using YouTube Data API."""
    if not YOUTUBE_API_KEY:
        return None

    # Check cache first to save API quota
    cache_key = query.lower().replace(" ", "_")
    if existing_cache and cache_key in existing_cache:
        print(f"  Using cached video for: {query[:50]}...")
        return existing_cache[cache_key]

    try:
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

        if "error" in data:
            print(f"  YouTube API error: {data['error'].get('message', 'Unknown')}")
            return None

        if "items" in data and len(data["items"]) > 0:
            video_id = data["items"][0]["id"]["videoId"]
            return f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"

        # Fallback: Search without channel restriction
        if channel_id:
            del params['channelId']
            resp = requests.get(YOUTUBE_SEARCH_URL, params=params, timeout=10)
            data = resp.json()

            if "items" in data and len(data["items"]) > 0:
                video_id = data["items"][0]["id"]["videoId"]
                return f"https://www.youtube.com/embed/{video_id}?autoplay=1&rel=0"

        return None

    except Exception as e:
        print(f"  YouTube error: {e}")
        return None


def extract_player_stats(competitor):
    """Extract key player statistics from competitor athletes."""
    athletes = competitor.get("athletes", [])
    players = []

    # Get top performers (limit to top 10 to reduce data size)
    for athlete in athletes[:10]:
        try:
            player = {
                "id": athlete.get("id", ""),
                "name": athlete.get("displayName", ""),
                "position": athlete.get("position", {}).get("abbreviation", ""),
                "jersey": athlete.get("jersey", ""),
                "status": athlete.get("status", ""),  # Out, Probable, etc.
                "stats": {}
            }

            # Extract player statistics
            stats_list = athlete.get("stats", [])
            for stat in stats_list:
                stat_name = stat.get("name", "").lower()
                stat_value = stat.get("displayValue", "0")
                # Store key stats (passing, rushing, receiving, tackles, etc.)
                if stat_name in ["passingYards", "rushingYards", "receivingYards", "tackles",
                                 "sacks", "interceptions", "touchdowns", "points", "rebounds",
                                 "assists", "steals", "blockedShots", "goals", "assists"]:
                    player["stats"][stat_name] = stat_value

            if player["stats"] or player["position"]:  # Only include if has stats or position
                players.append(player)
        except Exception as e:
            continue

    return players


def extract_injuries(competitor):
    """Extract injury information for players."""
    athletes = competitor.get("athletes", [])
    injuries = []

    for athlete in athletes:
        status = athlete.get("status", "").lower()
        if "out" in status or "doubtful" in status or "questionable" in status or "probable" in status:
            injury = {
                "playerName": athlete.get("displayName", ""),
                "position": athlete.get("position", {}).get("abbreviation", ""),
                "status": athlete.get("status", ""),
                "id": athlete.get("id", "")
            }
            injuries.append(injury)

    return injuries


def extract_betting_odds(competition):
    """Extract betting odds/lines from competition."""
    odds_data = competition.get("odds", [])

    if not odds_data:
        return None

    try:
        odds = odds_data[0]
        return {
            "spread": odds.get("spread", {}),
            "overUnder": odds.get("overUnder", ""),
            "moneyline": odds.get("moneyline", {}),
            "provider": odds.get("provider", {}).get("name", "ESPN"),
            "lastUpdated": odds.get("lastModified", "")
        }
    except Exception as e:
        return None


def extract_game_notes(event):
    """Extract headlines and notes about the game."""
    headlines = []

    # Get notes from the event
    notes = event.get("notes", [])
    for note in notes:
        try:
            headline = {
                "headline": note.get("headline", ""),
                "description": note.get("description", ""),
                "type": note.get("type", ""),
                "lastModified": note.get("lastModified", "")
            }
            if headline["headline"]:
                headlines.append(headline)
        except:
            continue

    # Get story links if available
    links = event.get("links", [])
    for link in links:
        try:
            if "recap" in link.get("text", "").lower() or "summary" in link.get("text", "").lower():
                headlines.append({
                    "headline": link.get("text", ""),
                    "description": "",
                    "type": "recap",
                    "url": link.get("href", "")
                })
        except:
            continue

    return headlines


def process_game(event, league, video_cache=None):
    """Standardizes game data from ESPN API with enhanced player and odds data."""
    try:
        comp = event["competitions"][0]
        status_type = event["status"]["type"]
        status_state = status_type.get("state", "pre")

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

        # Status
        is_final = status_state == "post" or status_type.get("completed", False)
        is_active = status_state == "in"
        status_detail = status_type.get("detail", "Scheduled")

        # Clock/Period for live games
        clock = ""
        period = ""
        if is_active:
            clock = event.get("status", {}).get("displayClock", "")
            period = event.get("status", {}).get("period", "")

        # Video search for completed games only (limit to save API quota)
        video_url = None
        if is_final and YOUTUBE_API_KEY:
            game_date = datetime.fromisoformat(event["date"].replace("Z", "+00:00"))
            query = f"{league} {away_name} vs {home_name} highlights {game_date.strftime('%B %d %Y')}"
            video_url = get_youtube_highlight(query, league, video_cache)

        # Broadcast info
        broadcasts = comp.get("broadcasts", [])
        network = ""
        if broadcasts:
            names = broadcasts[0].get("names", [])
            network = names[0] if names else ""

        # ENHANCED DATA EXTRACTION
        # Player statistics
        home_players = extract_player_stats(home)
        away_players = extract_player_stats(away)

        # Injury reports
        home_injuries = extract_injuries(home)
        away_injuries = extract_injuries(away)

        # Betting odds
        odds = extract_betting_odds(comp)

        # Game headlines and notes
        headlines = extract_game_notes(event)

        # Venue information
        venue = comp.get("venue", {})
        venue_info = {
            "name": venue.get("fullName", ""),
            "city": venue.get("address", {}).get("city", ""),
            "state": venue.get("address", {}).get("state", ""),
            "capacity": venue.get("capacity", ""),
            "indoor": venue.get("indoor", None)
        }

        # Wind and weather conditions (if available)
        weather = comp.get("weather", [])
        weather_info = None
        if weather:
            w = weather[0]
            weather_info = {
                "displayValue": w.get("displayValue", ""),
                "temperature": w.get("temperature", ""),
                "wind": w.get("wind", ""),
                "conditions": w.get("conditions", "")
            }

        return {
            "id": event.get("id", ""),
            "date": event.get("date", ""),
            "status": status_detail,
            "is_active": is_active,
            "is_final": is_final,
            "clock": clock,
            "period": period,
            "network": network,
            "venue": venue_info,
            "weather": weather_info,
            "homeTeam": {
                "name": home_full,
                "shortName": home_name,
                "abbreviation": home_team.get("abbreviation", ""),
                "logoUrl": home_team.get("logo", ""),
                "record": home_record,
                "players": home_players,
                "injuries": home_injuries,
                "rank": home_team.get("rank", "")
            },
            "awayTeam": {
                "name": away_full,
                "shortName": away_name,
                "abbreviation": away_team.get("abbreviation", ""),
                "logoUrl": away_team.get("logo", ""),
                "record": away_record,
                "players": away_players,
                "injuries": away_injuries,
                "rank": away_team.get("rank", "")
            },
            "homeScore": home_score,
            "awayScore": away_score,
            "video_url": video_url,
            "league": league,
            "odds": odds,
            "headlines": headlines
        }
    except Exception as e:
        print(f"  Error processing game: {e}")
        return None


def fetch_championship_games(league, url, video_cache=None):
    """Fetch championship/finals games for off-season leagues."""
    championship_dates = CHAMPIONSHIP_DATES.get(league)
    if not championship_dates:
        return []

    all_games = []
    seen_ids = set()
    now = datetime.now()

    for start_month, start_day, end_month, end_day, year_offset in championship_dates:
        # Determine the year to check
        check_year = now.year + year_offset

        # If we're before the championship period this year, check last year
        championship_start = datetime(check_year, start_month, start_day)
        if now < championship_start:
            check_year -= 1

        # Build date range to search
        start_date = datetime(check_year, start_month, start_day)
        end_date = datetime(check_year, end_month, end_day)

        print(f"  Checking {league} championship games from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

        # Fetch games for each day in the range (ESPN requires specific dates)
        current_date = end_date  # Start from end to get most recent first
        days_checked = 0
        max_days = 20  # Limit to prevent too many API calls

        while current_date >= start_date and days_checked < max_days:
            date_str = current_date.strftime("%Y%m%d")
            date_url = f"{url}?dates={date_str}"

            try:
                resp = requests.get(date_url, timeout=10)
                if resp.ok:
                    data = resp.json()
                    events = data.get("events", [])

                    for event in events:
                        # Check if this is a playoff/championship game
                        season_type = event.get("season", {}).get("type", 0)
                        # Type 3 = postseason, Type 4 = offseason/exhibition
                        # Also check event name for "Final", "Championship", "Cup", etc.
                        event_name = event.get("name", "").lower()
                        is_championship = (
                            season_type == 3 or
                            "final" in event_name or
                            "championship" in event_name or
                            "cup" in event_name or
                            "world series" in event_name or
                            "super bowl" in event_name or
                            "stanley cup" in event_name
                        )

                        if is_championship or len(all_games) < 5:  # Get at least some games
                            game = process_game(event, league, video_cache)
                            if game and game["id"] not in seen_ids:
                                game["is_championship"] = True
                                all_games.append(game)
                                seen_ids.add(game["id"])

            except Exception as e:
                pass  # Silently skip failed date fetches

            current_date -= timedelta(days=1)
            days_checked += 1

            # Stop if we have enough games
            if len(all_games) >= 10:
                break

    if all_games:
        print(f"  Found {len(all_games)} {league} championship/playoff games")

    return all_games


def fetch_league(league, video_cache=None, include_yesterday=False):
    """Generic function to fetch any league's data."""
    print(f"Fetching {league} Data...")
    url = ESPN_URLS.get(league)
    if not url:
        print(f"  No URL configured for {league}")
        return {"games": []}

    all_games = []
    seen_ids = set()

    try:
        # Fetch today's games
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # Get week info for NFL
        week_num = None
        if league == "NFL":
            week_info = data.get("week", {})
            week_num = week_info.get("number", "Unknown")

        events = data.get("events", [])
        print(f"  Found {len(events)} {league} games today")

        for event in events:
            game = process_game(event, league, video_cache)
            if game and game["id"] not in seen_ids:
                all_games.append(game)
                seen_ids.add(game["id"])

        # Fetch yesterday's games for highlights (for daily sports)
        if include_yesterday:
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y%m%d")
            yst_url = f"{url}?dates={yesterday}"

            try:
                yst_resp = requests.get(yst_url, timeout=15)
                yst_resp.raise_for_status()
                yst_data = yst_resp.json()

                yesterday_count = 0
                for event in yst_data.get("events", []):
                    game = process_game(event, league, video_cache)
                    if game and game["id"] not in seen_ids:
                        all_games.append(game)
                        seen_ids.add(game["id"])
                        yesterday_count += 1

                if yesterday_count > 0:
                    print(f"  Found {yesterday_count} {league} games from yesterday")
            except Exception as e:
                print(f"  Could not fetch yesterday's {league} games: {e}")

        # If no games found, try to fetch championship/finals games
        if len(all_games) == 0:
            print(f"  No current {league} games, checking for championship results...")
            championship_games = fetch_championship_games(league, url, video_cache)
            all_games.extend(championship_games)

        result = {"games": all_games}
        if week_num is not None:
            result["week"] = week_num

        # Mark if showing championship/off-season results
        if all_games and all(g.get("is_championship") for g in all_games):
            result["showing_championship"] = True

        return result

    except requests.exceptions.RequestException as e:
        print(f"  {league} fetch error: {e}")
        return {"games": [], "week": "Unknown"} if league == "NFL" else {"games": []}
    except Exception as e:
        print(f"  {league} processing error: {e}")
        return {"games": [], "week": "Unknown"} if league == "NFL" else {"games": []}


def load_existing_data():
    """Load existing data to preserve video cache."""
    try:
        if SPORTS_DATA_JSON.exists():
            with open(SPORTS_DATA_JSON, "r") as f:
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
        for league in ["nfl", "nba", "wnba", "nhl", "mlb", "mls"]:
            league_data = existing_data.get(league, {})
            games = league_data.get("games", [])
            for game in games:
                if game.get("video_url"):
                    away = game.get("awayTeam", {}).get("shortName", "")
                    home = game.get("homeTeam", {}).get("shortName", "")
                    if away and home:
                        key = f"{league}_{away}_vs_{home}".lower().replace(" ", "_")
                        cache[key] = game["video_url"]

        if cache:
            print(f"Loaded {len(cache)} cached video URLs")
    except Exception as e:
        print(f"Error building video cache: {e}")

    return cache


def save_league_data(league_key, data):
    """Save individual league data to separate files for the frontend."""
    # Map league keys to output files
    file_map = {
        "nfl": FOOTBALL_GAMES_JSON,
        "nba": BASKETBALL_GAMES_JSON,
        "wnba": BASKETBALL_GAMES_JSON,
        "nhl": HOCKEY_GAMES_JSON,
        "mlb": BASEBALL_GAMES_JSON,
        "mls": SOCCER_GAMES_JSON
    }

    filepath = file_map.get(league_key.lower())
    if not filepath:
        print(f"  No output file configured for {league_key}")
        return

    # Create directory if needed
    filepath.parent.mkdir(parents=True, exist_ok=True)

    # Format data for frontend
    games = data.get("games", [])
    output = {
        "lastUpdated": datetime.now().isoformat() + "Z",
        "games": []
    }

    if league_key.lower() == "nfl":
        output["season"] = 2025
        output["week"] = data.get("week", "Unknown")

    # Add championship flag if applicable
    if data.get("showing_championship"):
        output["showing_championship"] = True

    # Transform games to frontend format
    for game in games:
        frontend_game = {
            "id": f"{league_key.lower()}-{game.get('id', '')}",
            "league": league_key.upper(),
            "startTime": game.get("date", ""),
            "homeTeam": game.get("homeTeam", {}),
            "awayTeam": game.get("awayTeam", {}),
            "homeScore": game.get("homeScore", 0),
            "awayScore": game.get("awayScore", 0),
            "status": "final" if game.get("is_final") else ("in_progress" if game.get("is_active") else "scheduled"),
            "quarter": game.get("period", ""),
            "clock": game.get("clock", ""),
            "network": game.get("network", ""),
            "video_url": game.get("video_url", ""),
            "is_championship": game.get("is_championship", False)
        }
        output["games"].append(frontend_game)

    with open(filepath, "w") as f:
        json.dump(output, f, indent=2)

    print(f"  Saved {len(games)} games to {filepath}")


# --- MAIN ---

def main():
    print("=" * 70)
    print("Sports Data Updater - All Leagues")
    print("=" * 70)
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"YouTube API Key: {'Present' if YOUTUBE_API_KEY else 'Not set'}")
    print()

    # Load existing data for video cache
    existing_data = load_existing_data()
    video_cache = build_video_cache(existing_data)

    # Fetch all sports data
    # Daily sports get yesterday's games too for highlights
    nfl_data = fetch_league("NFL", video_cache, include_yesterday=False)
    nba_data = fetch_league("NBA", video_cache, include_yesterday=True)
    wnba_data = fetch_league("WNBA", video_cache, include_yesterday=True)
    nhl_data = fetch_league("NHL", video_cache, include_yesterday=True)
    mlb_data = fetch_league("MLB", video_cache, include_yesterday=True)
    mls_data = fetch_league("MLS", video_cache, include_yesterday=True)

    # Build final unified output
    final_data = {
        "last_updated": datetime.now().strftime("%Y-%m-%d %H:%M:%S EST"),
        "nfl": nfl_data,
        "nba": nba_data,
        "wnba": wnba_data,
        "nhl": nhl_data,
        "mlb": mlb_data,
        "mls": mls_data
    }

    # Ensure output directory exists
    SPORTS_DATA_JSON.parent.mkdir(parents=True, exist_ok=True)

    # Save unified file
    with open(SPORTS_DATA_JSON, "w") as f:
        json.dump(final_data, f, indent=2)
    print(f"✓ Saved unified data to {SPORTS_DATA_JSON}")

    # Also save individual league files for frontend compatibility
    print("\nSaving individual league files...")
    save_league_data("NFL", nfl_data)
    save_league_data("NBA", nba_data)
    save_league_data("WNBA", wnba_data)
    save_league_data("NHL", nhl_data)
    save_league_data("MLB", mlb_data)
    save_league_data("MLS", mls_data)

    # Summary
    print()
    print("=" * 70)
    print("Summary:")
    for league, data in [("NFL", nfl_data), ("NBA", nba_data), ("WNBA", wnba_data),
                          ("NHL", nhl_data), ("MLB", mlb_data), ("MLS", mls_data)]:
        games = data.get("games", [])
        final_count = len([g for g in games if g.get("is_final")])
        video_count = len([g for g in games if g.get("video_url")])
        print(f"  {league}: {len(games)} games ({final_count} final, {video_count} with video)")
    print("=" * 70)
    print("\n✓ Done!")


if __name__ == "__main__":
    main()
