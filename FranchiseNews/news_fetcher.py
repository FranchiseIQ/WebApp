import json
import time
from datetime import datetime
from pathlib import Path

import feedparser
import requests

FEEDS = [
    ("Franchise Times", "https://www.franchisetimes.com/search/?f=rt%3Aarticle%2Csection%3Afeatures%2Ctype%3Astore%2Ctype%3Aarticle%2Ctype%3Apages&l=100&sd=desc&st=article&f_site=franchisetimes.com&f_type=article&sort=pubdate&rss=1"),
    ("QSR Magazine", "https://www.qsrmagazine.com/rss.xml"),
    ("1851 Franchise", "https://1851franchise.com/rss/all"),
    ("FranchiseWire", "https://www.franchisewire.com/feed/"),
    ("Franchise Direct", "https://www.franchisedirect.com/news/rss/"),
]

OUTPUT_PATH = Path(__file__).resolve().parent / "news.json"
MAX_ITEMS = 60


def fetch_feed(name: str, url: str):
    try:
        response = requests.get(url, timeout=15)
        response.raise_for_status()
        parsed = feedparser.parse(response.text)
        articles = []
        for entry in parsed.entries:
            title = entry.get("title") or "Untitled"
            link = entry.get("link") or ""
            if not link:
                continue
            published = entry.get("published") or entry.get("updated")
            try:
                published_iso = (
                    datetime(*entry.published_parsed[:6]).isoformat()
                    if getattr(entry, "published_parsed", None)
                    else datetime.utcnow().isoformat()
                )
            except Exception:
                published_iso = datetime.utcnow().isoformat()

            articles.append(
                {
                    "title": title,
                    "url": link,
                    "source": name,
                    "published_iso": published_iso,
                }
            )
        return articles
    except Exception as exc:  # noqa: BLE001
        print(f"[warn] Failed to fetch {name}: {exc}")
        return []


def gather_articles():
    all_articles = []
    for source_name, url in FEEDS:
        all_articles.extend(fetch_feed(source_name, url))
        time.sleep(0.25)

    # Sort newest first and trim
    all_articles.sort(key=lambda a: a.get("published_iso", ""), reverse=True)
    return all_articles[:MAX_ITEMS]


def main():
    articles = gather_articles()
    if not articles:
        articles = [
            {
                "title": "No news available", 
                "url": "https://www.franchisetimes.com/", 
                "source": "Franchise Times", 
                "published_iso": datetime.utcnow().isoformat()
            }
        ]

    OUTPUT_PATH.write_text(json.dumps(articles, indent=2), encoding="utf-8")
    print(f"Saved {len(articles)} articles to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
