# Sports Data Schema for Predictions

Complete data structure extracted from ESPN API for use in game outcome predictions and analysis.

## Game Object Structure

```json
{
  "id": "string",
  "date": "ISO 8601 datetime",
  "status": "string",
  "is_active": "boolean",
  "is_final": "boolean",
  "clock": "string",
  "period": "string or number",
  "network": "string",
  "league": "string (NFL, NBA, WNBA, NHL, MLB, MLS)",
  
  "venue": {
    "name": "string",
    "city": "string",
    "state": "string",
    "capacity": "string",
    "indoor": "boolean"
  },
  
  "weather": {
    "displayValue": "string",
    "temperature": "string",
    "wind": "string",
    "conditions": "string"
  },
  
  "homeTeam": {
    "name": "string",
    "shortName": "string",
    "abbreviation": "string",
    "logoUrl": "string",
    "record": "string (e.g., '12-3')",
    "rank": "string or number",
    "players": [{...}],
    "injuries": [{...}]
  },
  
  "awayTeam": {
    "name": "string",
    "shortName": "string",
    "abbreviation": "string",
    "logoUrl": "string",
    "record": "string (e.g., '12-3')",
    "rank": "string or number",
    "players": [{...}],
    "injuries": [{...}]
  },
  
  "homeScore": "number",
  "awayScore": "number",
  
  "odds": {
    "spread": "string or number",
    "overUnder": "string or number",
    "moneyline": {
      "home": "string (e.g., '-165')",
      "away": "string (e.g., '+145')"
    },
    "provider": "string",
    "lastUpdated": "ISO 8601 datetime"
  },
  
  "video_url": "string or null",
  "headlines": [{...}],
  "is_championship": "boolean"
}
```

## Player Object Structure

```json
{
  "id": "string",
  "name": "string",
  "position": "string (e.g., 'QB', 'WR', 'G')",
  "jersey": "string",
  "status": "string (e.g., 'Active', 'Out', 'Doubtful')",
  "stats": {
    "passingYards": "string (number)",
    "rushingYards": "string (number)",
    "receivingYards": "string (number)",
    "touchdowns": "string (number)",
    "interceptions": "string (number)",
    "tackles": "string (number)",
    "sacks": "string (number)",
    "points": "string (number)",
    "rebounds": "string (number)",
    "assists": "string (number)",
    "steals": "string (number)",
    "blockedShots": "string (number)",
    "goals": "string (number)"
  }
}
```

### Available Player Stats by Sport

**Football (NFL)**:
- Passing: `passingYards`, `touchdowns`, `interceptions`
- Rushing: `rushingYards`, `touchdowns`
- Receiving: `receivingYards`, `receivingTouchdowns`
- Defense: `tackles`, `sacks`, `interceptions`

**Basketball (NBA/WNBA)**:
- Scoring: `points`
- Rebounding: `rebounds`
- Playmaking: `assists`
- Defense: `steals`, `blockedShots`

**Baseball (MLB)**:
- Batting: `hits`, `homeRuns`, `RBIs`
- Pitching: `strikeOuts`, `inningsPitched`, `ERA`

**Hockey (NHL)**:
- Skating: `goals`, `assists`, `shots`
- Goalie: `saves`, `savePct`

**Soccer (MLS)**:
- Attacking: `goals`, `assists`, `shots`
- Defense: `tackles`, `clearances`

## Injury Object Structure

```json
{
  "playerName": "string",
  "position": "string",
  "status": "string (Out, Doubtful, Questionable, Probable)",
  "id": "string"
}
```

## Odds Object Structure

```json
{
  "spread": "string or number",
  "overUnder": "string or number",
  "moneyline": {
    "home": "string",
    "away": "string"
  },
  "provider": "string (e.g., 'DraftKings', 'ESPN')",
  "lastUpdated": "ISO 8601 datetime"
}
```

### Spread Interpretation
- Negative spread: Home team is favored by that amount
- Positive spread: Away team is favored by that amount
- Example: `-3.5` means home team is favored by 3.5 points

### Moneyline Interpretation
- Negative number: Favorite (amount to bet to win $100)
- Positive number: Underdog ($100 bet wins that amount)
- Example: `-165` (bet $165 to win $100) vs `+145` ($100 bet wins $145)

## Headlines Object Structure

```json
{
  "headline": "string",
  "description": "string",
  "type": "string (recap, update, story, etc.)",
  "lastModified": "ISO 8601 datetime",
  "url": "string (optional)"
}
```

## Usage for Predictions

### Data Available for Model Inputs

1. **Betting Odds** (Most Important)
   - Spread: Direct market prediction of point differential
   - Over/Under: Market total score prediction
   - Moneyline: Direct win probability in implied odds

2. **Team Data**
   - Records: Win-loss records for season performance analysis
   - Rankings: National ranking for strength assessment
   - Weather: Outdoor game conditions affecting gameplay

3. **Player Data**
   - Top performers: Key players' individual stats
   - Injuries: Missing players affecting team strength
   - Position-specific stats: Quarterback performance, RB stats, etc.

4. **Game Info**
   - Venue: Home field advantage, indoor/outdoor
   - Network: Less relevant but available
   - Time: Day of week, time of day affects performance

### Calculation Priority (Recommended)

For win probability models, weight inputs as:
1. **Betting Odds** (40-50%) - Professional oddsmakers' collective intelligence
2. **Team Records** (20-30%) - Season performance and consistency
3. **Player Stats & Injuries** (15-25%) - Individual talent and availability
4. **Weather & Venue** (5-10%) - Environmental factors

### Example: Converting Moneyline to Win Probability

```javascript
function impliedProbability(moneyline) {
  if (moneyline < 0) {
    // Negative moneyline (favorite)
    return Math.abs(moneyline) / (Math.abs(moneyline) + 100);
  } else {
    // Positive moneyline (underdog)
    return 100 / (moneyline + 100);
  }
}

// Example:
impliedProbability(-165); // 0.6226 (62.26% implied win probability)
impliedProbability(+145); // 0.4082 (40.82% implied win probability)
```

### Data Completeness

- **Guaranteed**: Game IDs, scores, dates, team names, records
- **Usually Available**: Venues, weather (for current games)
- **Varies**: Player stats (depends on ESPN data completeness), injury reports
- **Optional**: Odds (not always available from ESPN), headlines

### Notes for Prediction Engine

1. Convert string numbers to floats: Stats and scores come as strings
2. Parse records (e.g., "12-3" to wins=12, losses=3)
3. Handle null/missing values gracefully
4. Weather data more reliable for NFL (outdoor games)
5. Player stats only available during/after games
6. Injury status uses predictable keywords: "Out", "Doubtful", "Questionable", "Probable"
