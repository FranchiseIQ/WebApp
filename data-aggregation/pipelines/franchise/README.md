# Franchise Data Pipeline

Centralized pipeline for generating and enriching franchise location data, with industry news aggregation.

## Overview

This pipeline consists of multiple stages for location generation and data enrichment:

### Current Implementation
1. **fetch_news.py** - Franchise industry news aggregation from RSS feeds

### Planned Stages (Future)
1. **generate_locations.py** - Generate franchise locations from OpenStreetMap
2. **enrich_demographics.py** - Add census demographic data
3. **enrich_traffic.py** - Add foot traffic and visibility scores
4. **enrich_accessibility.py** - Add Walk Score and Transit Score
5. **enrich_crime.py** (Optional) - Add crime statistics
6. **enrich_employment.py** (Optional) - Add employment data
7. **enrich_transit.py** (Optional) - Add public transit information

## Scripts

### fetch_news.py

**Purpose**: Aggregate franchise industry news from multiple RSS feed sources

**Data Sources**: RSS feeds from:
- Franchise Times
- 1851 Franchise
- Entrepreneur Magazine
- Franchising.com

**Output**: `data/franchise_news.json`

**Format**: JSON array of news articles with metadata:
```json
[
  {
    "id": "abc123def456",
    "title": "Article Title",
    "sourceId": "franchise-times",
    "url": "https://...",
    "publishedAt": "2025-12-20",
    "category": "Trade press and industry news",
    "shortSourceLabel": "Franchise Times"
  }
]
```

**Frequency**: Multiple times daily via `.github/workflows/update-franchise-news.yml`

**Run Locally**:
```bash
python3 -m data_aggregation.pipelines.franchise.fetch_news
```

**Features**:
- Fetches latest articles from multiple franchise industry sources
- Removes duplicate articles
- Filters to last 30 days of articles
- Limits to top 50 most recent articles
- Handles RSS feed parsing errors gracefully
- Generates unique IDs for deduplication

**Dependencies**:
- feedparser (Python package)
- python-dateutil (Python package)

**Install Dependencies**:
```bash
pip install feedparser python-dateutil
```

## Environment Variables

### Required for Local Development
None (all sources use public RSS feeds)

### Optional for GitHub Actions
None (script is self-contained)

## Output Files

| File | Script | Frequency | Format | Usage |
|------|--------|-----------|--------|-------|
| `data/franchise_news.json` | fetch_news | Daily | JSON | Latest franchise industry news |

## Future Implementation

### Location Generation Pipeline

The complete franchise pipeline will include location generation and enrichment stages:

```
generate_locations.py
    ↓ (OpenStreetMap data)
[Location Data Files]
    ↓
enrich_demographics.py (Census API)
    ↓
enrich_traffic.py (Traffic APIs)
    ↓
enrich_accessibility.py (Walk Score, Transit Score)
    ↓ (Optional)
enrich_crime.py (Crime statistics)
enrich_employment.py (BLS data)
enrich_transit.py (Transit data)
    ↓
[Final Enriched Location Data]
```

### Configuration

The pipeline stages and order are defined in `aggregation_config.json`:

```json
{
  "franchise": {
    "enabled": true,
    "scripts": [
      "generate_locations.py",
      "enrich_demographics.py",
      "enrich_traffic.py",
      "enrich_accessibility.py"
    ],
    "optional_scripts": [
      "enrich_crime.py",
      "enrich_employment.py",
      "enrich_transit.py"
    ],
    "dependencies": [
      "generate_locations.py must run first"
    ]
  }
}
```

## Usage in Frontend

### Displaying Latest News
```javascript
// Load franchise news
const news = await fetch('data/franchise_news.json').then(r => r.json());

// Display top articles
news.slice(0, 5).forEach(article => {
  console.log(`${article.title} - ${article.shortSourceLabel}`);
});
```

## Troubleshooting

### RSS Feed Errors
```
Warning: Feed may have errors
```
**Solution**: Feed still returned articles. Check `shortSourceLabel` to identify affected source.

### No Articles Returned
```
Error: 0 articles fetched
```
**Possible causes**:
- RSS feeds are temporarily unavailable
- Network connectivity issue
- All articles older than 30 days

**Solution**: Check internet connection and RSS feed status

### Duplicate Detection Not Working
**Solution**: The script uses URL-based deduplication. Manual cleanup of JSON file may be needed if URLs change.

## Related Files

- `data-aggregation/config/paths_config.py` - Output path management
- `data-aggregation/config/aggregation_config.json` - Pipeline configuration
- `.github/workflows/update-franchise-news.yml` - GitHub Actions scheduling
- `data-aggregation/README.md` - Main data aggregation documentation

## Testing

### Test News Fetching
```bash
python3 -m data_aggregation.pipelines.franchise.fetch_news
```

### Verify Output
```bash
python3 << 'EOF'
import json
with open('data/franchise_news.json') as f:
    articles = json.load(f)
    print(f"Found {len(articles)} articles")
    if articles:
        print(f"Latest: {articles[0]['title']}")
        print(f"Source: {articles[0]['shortSourceLabel']}")
EOF
```

### Check Feed URLs
```bash
python3 << 'EOF'
import feedparser

feeds = {
    'Franchise Times': 'https://www.franchisetimes.com/feed/',
    '1851 Franchise': 'https://1851franchise.com/feed/',
    'Entrepreneur': 'https://www.entrepreneur.com/topic/franchises.rss',
    'Franchising.com': 'https://www.franchising.com/news/rss.xml'
}

for name, url in feeds.items():
    feed = feedparser.parse(url)
    print(f"{name}: {len(feed.entries)} articles")
EOF
```

## Adding New News Sources

1. Find RSS feed URL for franchise news source
2. Add to `RSS_FEEDS` dict in `fetch_news.py`
3. Test with: `python3 -m data_aggregation.pipelines.franchise.fetch_news`
4. Commit with message: "Add [Source] to franchise news pipeline"

Example:
```python
'my-source': {
    'url': 'https://example.com/feed/',
    'category': 'Trade press and industry news',
    'label': 'My Source'
}
```

## Contributing

When modifying franchise pipeline scripts:

1. **Test locally** - Run scripts before pushing
2. **Verify output** - Check generated JSON files
3. **Update docs** - Document any RSS feed changes
4. **Test feeds** - Verify all RSS sources are accessible
