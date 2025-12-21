# Sports Data Pipeline

Unified sports data collection system that fetches real-time scores and standings from ESPN API for multiple leagues.

## Overview

This pipeline collects current game information and highlights from ESPN for six major sports leagues:

- **NFL** - National Football League
- **NBA** - National Basketball Association
- **WNBA** - Women's National Basketball Association
- **NHL** - National Hockey League
- **MLB** - Major League Baseball
- **MLS** - Major League Soccer

## Critical: YouTube API Key

YouTube API access is **optional** but recommended for finding highlight videos.

- **For GitHub Actions**: Set `YOUTUBE_API_KEY` in repository secrets
- **For local development**: `export YOUTUBE_API_KEY="your_youtube_key"`
- **Without API key**: Script still works; highlight videos will be empty

## Scripts

### fetch_sports_data.py

**Purpose**: Fetch current game scores and standings for all sports leagues

**Data Source**: ESPN API (free, no authentication required)

**Optional Data Source**: YouTube API for highlight videos

**Output**:
- `FranchiseMap/data/sports_data.json` - Unified file with all leagues
- `data/football/current-week.json` - NFL current week and games
- `data/basketball/current-games.json` - NBA and WNBA current games
- `data/hockey/current-games.json` - NHL current games
- `data/baseball/current-games.json` - MLB current games
- `data/soccer/current-games.json` - MLS current games

**Format**: JSON with standardized game data including scores, teams, status, and optional YouTube highlights

**Frequency**: Multiple times daily during seasons, daily during off-season

**Run Locally**:
```bash
# Without YouTube integration
python3 -m data_aggregation.pipelines.sports.fetch_sports_data

# With YouTube integration (optional)
export YOUTUBE_API_KEY="your_key_here"
python3 -m data_aggregation.pipelines.sports.fetch_sports_data
```

**Features**:
- Fetches both today's and yesterday's games (for daily sports highlights)
- Automatically falls back to championship/playoff games during off-season
- Caches YouTube video URLs to save API quota
- Detects championship status for display purposes
- Handles ESPN API failures gracefully with fallback options

### Championship/Off-Season Fallback

When no regular season games are available, the script automatically searches for championship/playoff games:

- **NFL**: Super Bowl (February)
- **NBA**: NBA Finals (June)
- **WNBA**: WNBA Finals (October)
- **NHL**: Stanley Cup Finals (June)
- **MLB**: World Series (October/November)
- **MLS**: MLS Cup (December)

Games marked with `is_championship: true` can be styled differently in the frontend.

## Environment Variables

### Required for GitHub Actions
- None (ESPN API is free and requires no authentication)

### Optional for GitHub Actions & Local Development
- `YOUTUBE_API_KEY` - YouTube Data API key for finding highlight videos (optional)

### For Local Development
```bash
# Optional: Set YouTube API key for highlights
export YOUTUBE_API_KEY="your_youtube_api_key"

# Run the script
python3 -m data_aggregation.pipelines.sports.fetch_sports_data
```

## Output Format

### Unified Sports Data (`sports_data.json`)
```json
{
  "last_updated": "2025-12-20 15:30:00 EST",
  "nfl": {
    "games": [...],
    "week": 15,
    "showing_championship": false
  },
  "nba": {
    "games": [...]
  },
  "wnba": {
    "games": [...]
  },
  "nhl": {
    "games": [...]
  },
  "mlb": {
    "games": [...]
  },
  "mls": {
    "games": [...]
  }
}
```

### Individual League File Example (`football/current-week.json`)
```json
{
  "lastUpdated": "2025-12-20T15:30:00Z",
  "season": 2025,
  "week": 15,
  "games": [
    {
      "id": "nfl-401547839",
      "league": "NFL",
      "startTime": "2025-12-21T13:00Z",
      "homeTeam": {
        "name": "New England Patriots",
        "shortName": "Patriots",
        "abbreviation": "NE",
        "logoUrl": "https://...",
        "record": "5-10"
      },
      "awayTeam": {
        "name": "Los Angeles Chargers",
        "shortName": "Chargers",
        "abbreviation": "LAC",
        "logoUrl": "https://...",
        "record": "7-8"
      },
      "homeScore": 21,
      "awayScore": 17,
      "status": "final",
      "quarter": "4",
      "clock": "0:00",
      "network": "CBS",
      "video_url": "https://www.youtube.com/embed/...",
      "is_championship": false
    }
  ]
}
```

## Data Quality

- **ESPN API**: Reliable and regularly updated during games
- **Highlight Videos**: Best effort; some games may not have available highlights
- **Video Caching**: Existing video URLs are preserved to minimize API quota usage
- **Error Handling**: Script gracefully handles API failures and missing data

## Usage in Frontend

### Website Sports Display
```javascript
// Load unified sports data
const sportsData = await fetch('/FranchiseMap/data/sports_data.json').then(r => r.json());

// Access specific league
const nflGames = sportsData.nfl.games;
const nbaGames = sportsData.nba.games;
```

### Individual League Pages
```javascript
// Load NFL games
const nflData = await fetch('data/football/current-week.json').then(r => r.json());

// Load NBA games
const nbaData = await fetch('data/basketball/current-games.json').then(r => r.json());
```

## API Endpoints Used

### ESPN API (Free)
- `http://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/basketball/wnba/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard`
- `http://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard`

### YouTube API (Optional)
- `https://www.googleapis.com/youtube/v3/search` (requires API key)

## Troubleshooting

### No Games Returned
```
Error: 0 games returned for league
```
**Solutions**:
- Check if it's off-season (script will automatically look for championship games)
- Verify ESPN API is accessible (not region-blocked or down)
- Check internet connection

### YouTube Highlights Not Showing
```
YouTube API Key: Not set
```
**Solutions**:
- For GitHub Actions: Add `YOUTUBE_API_KEY` to repository secrets
- For local: Set environment variable: `export YOUTUBE_API_KEY="your_key"`
- Without key: Highlights feature is disabled (script still works)

### API Rate Limiting
```
YouTube API error: quotaExceeded
```
**Solution**: Video caching is enabled to reduce API calls. Wait 24 hours for quota reset.

## Performance Considerations

- **ESPN API**: Fast responses, no rate limiting
- **YouTube API**: ~100 requests per day free quota; caching helps preserve quota
- **Video Search**: Only searches for completed games to save quota
- **Cache Strategy**: Preserves existing video URLs across runs

## Related Files

- `data-aggregation/config/paths_config.py` - Centralized output path management
- `.github/workflows/update_sports.yml` - GitHub Actions workflow for scheduling
- `data-aggregation/README.md` - Main data aggregation pipeline documentation

## Testing

### Test Current Execution
```bash
python3 -m data_aggregation.pipelines.sports.fetch_sports_data
```

### Verify Output Files
```bash
ls -lh FranchiseMap/data/sports_data.json
ls -lh data/football/current-week.json
ls -lh data/basketball/current-games.json
ls -lh data/hockey/current-games.json
ls -lh data/baseball/current-games.json
ls -lh data/soccer/current-games.json
```

### Check Latest Games (Example)
```bash
python3 << 'EOF'
import json
with open('FranchiseMap/data/sports_data.json') as f:
    data = json.load(f)
    for league in ['nfl', 'nba', 'wnba', 'nhl', 'mlb', 'mls']:
        games = data[league].get('games', [])
        print(f"{league.upper()}: {len(games)} games")
        if games:
            print(f"  Latest: {games[0].get('homeTeam', {}).get('shortName')} vs {games[0].get('awayTeam', {}).get('shortName')}")
EOF
```
