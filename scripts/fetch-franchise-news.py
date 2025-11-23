#!/usr/bin/env python3
"""
Fetch franchise industry news from RSS feeds and save to JSON.
This script is designed to run via GitHub Actions every 6 hours.
"""

import feedparser
import json
import hashlib
from datetime import datetime, timedelta
from dateutil import parser as date_parser

# RSS feed URLs for franchise news sources
# Note: Not all sites have RSS feeds, these are the ones that do
RSS_FEEDS = {
    'franchise-times': {
        'url': 'https://www.franchisetimes.com/feed/',
        'category': 'Trade press and industry news',
        'label': 'Franchise Times'
    },
    '1851-franchise': {
        'url': 'https://1851franchise.com/feed/',
        'category': 'Trade press and industry news',
        'label': '1851 Franchise'
    },
    'entrepreneur': {
        'url': 'https://www.entrepreneur.com/topic/franchises.rss',
        'category': 'Big portals, directories, and lead-gen sites',
        'label': 'Entrepreneur'
    },
    'franchising-com': {
        'url': 'https://www.franchising.com/news/rss.xml',
        'category': 'Big portals, directories, and lead-gen sites',
        'label': 'Franchising.com'
    },
    # Add more RSS feeds as you discover them
    # Many franchise sites don't have RSS, but these are good starting points
}

def generate_id(source_id, url):
    """Generate a unique ID for an article based on source and URL"""
    hash_input = f"{source_id}-{url}"
    return hashlib.md5(hash_input.encode()).hexdigest()[:12]

def parse_date(date_string):
    """Parse various date formats and return ISO format (YYYY-MM-DD)"""
    try:
        parsed_date = date_parser.parse(date_string)
        return parsed_date.strftime('%Y-%m-%d')
    except:
        # If parsing fails, use today's date
        return datetime.now().strftime('%Y-%m-%d')

def fetch_feed(source_id, feed_info):
    """Fetch and parse a single RSS feed"""
    articles = []

    try:
        print(f"Fetching {feed_info['label']}...")
        feed = feedparser.parse(feed_info['url'])

        if feed.bozo:
            print(f"  Warning: Feed may have errors - {feed_info['label']}")

        # Get the latest 10 articles from each feed
        for entry in feed.entries[:10]:
            # Get published date
            pub_date = None
            if hasattr(entry, 'published'):
                pub_date = parse_date(entry.published)
            elif hasattr(entry, 'updated'):
                pub_date = parse_date(entry.updated)
            else:
                pub_date = datetime.now().strftime('%Y-%m-%d')

            # Create article object
            article = {
                'id': generate_id(source_id, entry.link),
                'title': entry.title.strip(),
                'sourceId': source_id,
                'url': entry.link,
                'publishedAt': pub_date,
                'category': feed_info['category'],
                'shortSourceLabel': feed_info['label']
            }

            articles.append(article)

        print(f"  ✓ Fetched {len(articles)} articles from {feed_info['label']}")

    except Exception as e:
        print(f"  ✗ Error fetching {feed_info['label']}: {str(e)}")

    return articles

def main():
    """Main function to fetch all feeds and save to JSON"""
    print("=" * 60)
    print("FRANCHISE NEWS AGGREGATOR")
    print("=" * 60)

    all_articles = []

    # Fetch from all RSS feeds
    for source_id, feed_info in RSS_FEEDS.items():
        articles = fetch_feed(source_id, feed_info)
        all_articles.extend(articles)

    # Remove duplicates based on URL
    seen_urls = set()
    unique_articles = []
    for article in all_articles:
        if article['url'] not in seen_urls:
            seen_urls.add(article['url'])
            unique_articles.append(article)

    # Sort by published date (newest first)
    unique_articles.sort(key=lambda x: x['publishedAt'], reverse=True)

    # Only keep articles from the last 30 days
    cutoff_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    recent_articles = [a for a in unique_articles if a['publishedAt'] >= cutoff_date]

    # Limit to top 50 articles
    final_articles = recent_articles[:50]

    print("\n" + "=" * 60)
    print(f"SUMMARY")
    print("=" * 60)
    print(f"Total articles fetched: {len(all_articles)}")
    print(f"Unique articles: {len(unique_articles)}")
    print(f"Articles from last 30 days: {len(recent_articles)}")
    print(f"Final article count: {len(final_articles)}")

    # Save to JSON file
    output_file = 'FranchiseNews/data/news.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_articles, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Saved to {output_file}")
    print("=" * 60)

if __name__ == '__main__':
    main()
