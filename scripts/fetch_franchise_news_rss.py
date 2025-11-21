#!/usr/bin/env python3
"""
=============================================================================
FRANCHISE NEWS RSS AGGREGATOR
=============================================================================

Fetches RSS feeds from franchise industry publications and Google News,
normalizes and deduplicates articles, then saves to a single JSON file
for consumption by frontend widgets.

Usage:
    python scripts/fetch_franchise_news_rss.py

Output:
    data/franchise_news.json

Dependencies:
    pip install feedparser python-dateutil
=============================================================================
"""

import feedparser
import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
import time
import sys

# =============================================================================
# CONFIGURATION
# =============================================================================

# Core franchise publication RSS feeds
RSS_FEEDS = [
    # TRADE PRESS & NEWS (Confirmed working feeds)
    {
        'url': 'https://www.franchisetimes.com/search/?f=rss&t=article&c=franchise_news&s=start_time&sd=desc&l=50',
        'name': 'Franchise Times',
        'category': 'trade_press',
        'status': 'confirmed'
    },
    {
        'url': 'http://www.qsrmagazine.com/taxonomy/term/602/0/feed',
        'name': 'QSR Magazine - Franchising',
        'category': 'trade_press',
        'status': 'confirmed'
    },
    {
        'url': 'http://www.bluemaumau.org/frontpagestories/rss.xml?quicktabs_1=0',
        'name': 'Blue MauMau',
        'category': 'trade_press',
        'status': 'confirmed'
    },
    {
        'url': 'https://franchisingmagazineusa.com/feed',
        'name': 'Franchising Magazine USA',
        'category': 'trade_press',
        'status': 'confirmed'
    },

    # TRADE PRESS (Best guesses - WordPress standard)
    {
        'url': 'https://1851franchise.com/feed/',
        'name': '1851 Franchise',
        'category': 'trade_press',
        'status': 'best_guess'
    },
    {
        'url': 'https://www.franchisewire.com/feed/',
        'name': 'FranchiseWire',
        'category': 'trade_press',
        'status': 'best_guess'
    },

    # BIG PORTALS & DIRECTORIES
    {
        'url': 'https://www.franchisedirect.com/blog/feed/',
        'name': 'Franchise Direct Blog',
        'category': 'directory',
        'status': 'best_guess'
    },
    {
        'url': 'https://www.franchisegator.com/articles/feed/',
        'name': 'Franchise Gator',
        'category': 'directory',
        'status': 'best_guess'
    },

    # RESEARCH & REVIEWS
    {
        'url': 'https://franchisebusinessreview.com/feed/',
        'name': 'Franchise Business Review',
        'category': 'research',
        'status': 'best_guess'
    },
    {
        'url': 'https://www.vettedbiz.com/feed',
        'name': 'Vetted Biz',
        'category': 'research',
        'status': 'confirmed'
    },

    # ASSOCIATIONS (IFA - try multiple endpoints)
    {
        'url': 'https://www.franchise.org/blog/rss',
        'name': 'IFA FranBlog',
        'category': 'association',
        'status': 'best_guess'
    },
    {
        'url': 'https://www.franchise.org/blog/feed',
        'name': 'IFA FranBlog (alt)',
        'category': 'association',
        'status': 'best_guess'
    },
]

# Google News RSS feeds for topic-based enrichment
GOOGLE_NEWS_FEEDS = [
    {
        'url': 'https://news.google.com/rss/search?q=franchise+news&hl=en-US&gl=US&ceid=US:en',
        'name': 'Google News - Franchise News',
        'query': 'franchise news'
    },
    {
        'url': 'https://news.google.com/rss/search?q=franchising+OR+franchisor&hl=en-US&gl=US&ceid=US:en',
        'name': 'Google News - Franchising',
        'query': 'franchising OR franchisor'
    },
    {
        'url': 'https://news.google.com/rss/search?q=%22private+equity%22+franchise+acquisition&hl=en-US&gl=US&ceid=US:en',
        'name': 'Google News - PE & Acquisitions',
        'query': 'private equity franchise acquisition'
    },
]

# Output configuration
OUTPUT_PATH = Path("data/franchise_news.json")
MAX_ARTICLES_PER_FEED = 20  # Limit articles per feed
MAX_TOTAL_ARTICLES = 100    # Total articles to keep in final output
MAX_AGE_DAYS = 30           # Only keep articles from last 30 days

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def generate_article_id(url):
    """Generate unique ID from article URL"""
    return hashlib.md5(url.encode('utf-8')).hexdigest()[:16]

def parse_date(date_string):
    """
    Parse various date formats from RSS feeds and return ISO 8601 string.
    Returns None if parsing fails.
    """
    if not date_string:
        return None

    try:
        # feedparser returns time_struct
        if hasattr(date_string, 'tm_year'):
            dt = datetime(*date_string[:6], tzinfo=timezone.utc)
            return dt.isoformat()

        # Try parsing as string
        from dateutil import parser
        dt = parser.parse(date_string)

        # Ensure timezone aware
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)

        return dt.isoformat()

    except Exception as e:
        print(f"  ⚠️  Failed to parse date '{date_string}': {e}")
        return None

def is_recent(published_iso, max_days=MAX_AGE_DAYS):
    """Check if article is within max_days old"""
    if not published_iso:
        return True  # Include if we can't determine age

    try:
        from dateutil import parser
        pub_date = parser.parse(published_iso)
        age = datetime.now(timezone.utc) - pub_date
        return age.days <= max_days
    except:
        return True  # Include on error

def clean_text(text):
    """Clean and truncate text"""
    if not text:
        return ""

    # Remove extra whitespace
    text = ' '.join(text.split())

    # Truncate if too long
    if len(text) > 500:
        text = text[:497] + "..."

    return text

# =============================================================================
# RSS FETCHING FUNCTIONS
# =============================================================================

def fetch_rss_feed(feed_config, source_type='rss'):
    """
    Fetch and parse a single RSS feed.

    Args:
        feed_config: Dict with 'url', 'name', and optional 'category'
        source_type: 'rss' or 'google_news'

    Returns:
        List of normalized article dicts
    """
    url = feed_config['url']
    feed_name = feed_config.get('name', 'Unknown Source')
    category = feed_config.get('category', 'general')

    print(f"\n📡 Fetching: {feed_name}")
    print(f"   URL: {url}")

    articles = []

    try:
        # Fetch with timeout
        feed = feedparser.parse(url)

        # Check for errors
        if feed.bozo:
            print(f"  ⚠️  Feed may have issues: {feed.bozo_exception}")

        # Check if we got entries
        if not hasattr(feed, 'entries') or len(feed.entries) == 0:
            print(f"  ❌ No entries found")
            return articles

        print(f"  ✓ Found {len(feed.entries)} entries")

        # Extract feed-level info
        feed_title = getattr(feed.feed, 'title', feed_name)

        # Process each entry
        for entry in feed.entries[:MAX_ARTICLES_PER_FEED]:
            try:
                # Extract title
                title = clean_text(entry.get('title', ''))
                if not title:
                    continue

                # Extract link
                link = entry.get('link', '')
                if not link:
                    continue

                # Generate unique ID
                article_id = generate_article_id(link)

                # Extract summary/description
                summary = ''
                if hasattr(entry, 'summary'):
                    summary = clean_text(entry.summary)
                elif hasattr(entry, 'description'):
                    summary = clean_text(entry.description)

                # Extract publication date
                published_raw = None
                published_iso = None

                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    published_raw = entry.published
                    published_iso = parse_date(entry.published_parsed)
                elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                    published_raw = entry.updated
                    published_iso = parse_date(entry.updated_parsed)

                # If no date, use current time
                if not published_iso:
                    published_iso = datetime.now(timezone.utc).isoformat()

                # Extract author if available
                author = entry.get('author', '')

                # Build article dict
                article = {
                    'id': article_id,
                    'title': title,
                    'url': link,
                    'summary': summary,
                    'source_name': feed_title,
                    'source_feed_url': url,
                    'source_type': source_type,
                    'category': category if source_type == 'rss' else 'google_news',
                    'published_raw': published_raw,
                    'published_iso': published_iso,
                    'author': author,
                    'fetched_at': datetime.now(timezone.utc).isoformat()
                }

                articles.append(article)

            except Exception as e:
                print(f"  ⚠️  Error processing entry: {e}")
                continue

        print(f"  ✓ Extracted {len(articles)} articles")

    except Exception as e:
        print(f"  ❌ Failed to fetch feed: {e}")

    return articles

# =============================================================================
# MAIN AGGREGATION LOGIC
# =============================================================================

def fetch_all_feeds():
    """Fetch all RSS feeds and return combined article list"""
    all_articles = []

    print("=" * 70)
    print("🔄 FETCHING RSS FEEDS")
    print("=" * 70)

    # Fetch publication RSS feeds
    print(f"\n📚 Fetching {len(RSS_FEEDS)} publication feeds...")
    for feed_config in RSS_FEEDS:
        articles = fetch_rss_feed(feed_config, source_type='rss')
        all_articles.extend(articles)
        time.sleep(0.5)  # Be nice to servers

    # Fetch Google News feeds
    print(f"\n🔍 Fetching {len(GOOGLE_NEWS_FEEDS)} Google News feeds...")
    for feed_config in GOOGLE_NEWS_FEEDS:
        articles = fetch_rss_feed(feed_config, source_type='google_news')
        all_articles.extend(articles)
        time.sleep(0.5)

    return all_articles

def deduplicate_articles(articles):
    """Remove duplicate articles based on URL"""
    seen_urls = set()
    unique_articles = []

    for article in articles:
        url = article['url']
        if url not in seen_urls:
            seen_urls.add(url)
            unique_articles.append(article)

    return unique_articles

def filter_recent_articles(articles):
    """Keep only recent articles"""
    recent = [a for a in articles if is_recent(a['published_iso'])]
    return recent

def sort_articles(articles):
    """Sort articles by published date (newest first)"""
    return sorted(
        articles,
        key=lambda x: x.get('published_iso', ''),
        reverse=True
    )

def save_to_json(articles, output_path):
    """Save articles to JSON file"""
    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Write JSON
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved {len(articles)} articles to {output_path}")

# =============================================================================
# MAIN
# =============================================================================

def main():
    """Main execution"""
    print("\n" + "=" * 70)
    print("🚀 FRANCHISE NEWS RSS AGGREGATOR")
    print("=" * 70)
    print(f"Output: {OUTPUT_PATH}")
    print(f"Max age: {MAX_AGE_DAYS} days")
    print(f"Max total articles: {MAX_TOTAL_ARTICLES}")

    # Fetch all feeds
    all_articles = fetch_all_feeds()

    print("\n" + "=" * 70)
    print("📊 PROCESSING RESULTS")
    print("=" * 70)
    print(f"Total articles fetched: {len(all_articles)}")

    # Deduplicate
    unique_articles = deduplicate_articles(all_articles)
    print(f"After deduplication: {len(unique_articles)}")

    # Filter by date
    recent_articles = filter_recent_articles(unique_articles)
    print(f"After date filter ({MAX_AGE_DAYS} days): {len(recent_articles)}")

    # Sort by date
    sorted_articles = sort_articles(recent_articles)

    # Limit total count
    final_articles = sorted_articles[:MAX_TOTAL_ARTICLES]
    print(f"Final article count (max {MAX_TOTAL_ARTICLES}): {len(final_articles)}")

    # Save to JSON
    save_to_json(final_articles, OUTPUT_PATH)

    # Print summary by category
    print("\n📈 ARTICLES BY CATEGORY:")
    categories = {}
    for article in final_articles:
        cat = article['category']
        categories[cat] = categories.get(cat, 0) + 1

    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")

    print("\n" + "=" * 70)
    print("✅ COMPLETE!")
    print("=" * 70)

    return 0

if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
