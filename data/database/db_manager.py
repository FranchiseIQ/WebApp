#!/usr/bin/env python3
"""
FranchiseIQ Database Manager

Unified SQLite database for all franchise data. Provides:
- Database initialization from schema
- Data migration from JSON/CSV files
- CRUD operations for all tables
- Export to JSON for frontend consumption

Usage:
    python db_manager.py init          # Initialize database
    python db_manager.py migrate       # Migrate existing JSON/CSV data
    python db_manager.py export        # Export to JSON for frontend
    python db_manager.py stats         # Show database statistics
"""

import sys
import json
import csv
import sqlite3
import argparse
from pathlib import Path
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

# Paths
DB_DIR = Path(__file__).parent
SCHEMA_FILE = DB_DIR / "schema.sql"
DB_FILE = DB_DIR / "franchiseiq.db"

# Data directories (relative to WebApp root)
WEBAPP_ROOT = DB_DIR.parent.parent
DATA_DIR = WEBAPP_ROOT / "data"
BRANDS_DIR = DATA_DIR / "brands"
SPORTS_DIR = DATA_DIR / "sports"


class DatabaseManager:
    """Manages the FranchiseIQ SQLite database."""

    def __init__(self, db_path: Path = DB_FILE):
        self.db_path = db_path
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self) -> sqlite3.Connection:
        """Connect to the database."""
        if self.conn is None:
            self.conn = sqlite3.connect(str(self.db_path))
            self.conn.row_factory = sqlite3.Row
            self.conn.execute("PRAGMA foreign_keys = ON")
        return self.conn

    def close(self):
        """Close the database connection."""
        if self.conn:
            self.conn.close()
            self.conn = None

    def __enter__(self):
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    # =========================================================================
    # Initialization
    # =========================================================================

    def init_database(self) -> bool:
        """Initialize database from schema file."""
        print(f"Initializing database: {self.db_path}")

        if not SCHEMA_FILE.exists():
            print(f"ERROR: Schema file not found: {SCHEMA_FILE}")
            return False

        # Create database directory if needed
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

        # Read and execute schema
        with open(SCHEMA_FILE, 'r') as f:
            schema_sql = f.read()

        conn = self.connect()
        try:
            conn.executescript(schema_sql)
            conn.commit()
            print("[OK] Database initialized successfully")
            return True
        except sqlite3.Error as e:
            print(f"ERROR: Failed to initialize database: {e}")
            return False

    # =========================================================================
    # Migration from JSON/CSV
    # =========================================================================

    def migrate_all(self) -> Dict[str, int]:
        """Migrate all existing data to the database."""
        results = {
            "brands": 0,
            "locations": 0,
            "stocks": 0,
            "sports_games": 0,
            "news_articles": 0
        }

        print("\n" + "=" * 60)
        print("Migrating data to SQLite database")
        print("=" * 60)

        # Migrate brands and locations
        results["brands"], results["locations"] = self.migrate_locations()

        # Migrate stock data
        results["stocks"] = self.migrate_stocks()

        # Migrate sports data
        results["sports_games"] = self.migrate_sports()

        # Migrate news
        results["news_articles"] = self.migrate_news()

        print("\n" + "=" * 60)
        print("Migration Summary:")
        for table, count in results.items():
            print(f"  {table}: {count:,} records")
        print("=" * 60)

        return results

    def migrate_locations(self) -> Tuple[int, int]:
        """Migrate location data from JSON files."""
        print("\n[1/4] Migrating locations from data/brands/*.json...")

        conn = self.connect()
        cursor = conn.cursor()

        brand_count = 0
        location_count = 0

        # Load manifest for brand metadata
        manifest_file = DATA_DIR / "manifest.json"
        manifest = []
        if manifest_file.exists():
            with open(manifest_file, 'r') as f:
                manifest = json.load(f)

        # Process each brand JSON file
        for json_file in BRANDS_DIR.glob("*.json"):
            ticker = json_file.stem.upper()

            try:
                with open(json_file, 'r') as f:
                    locations = json.load(f)

                if not locations or len(locations) == 0:
                    continue

                # Get brand info from manifest
                brand_info = next((b for b in manifest if b.get('ticker') == ticker), None)
                brand_names = brand_info.get('brands', [ticker]) if brand_info else [ticker]
                primary_name = brand_names[0] if brand_names else ticker

                # Determine category based on ticker
                category = self._categorize_brand(ticker)

                # Insert or update brand
                cursor.execute("""
                    INSERT OR REPLACE INTO brands (ticker, name, aliases, category, location_count)
                    VALUES (?, ?, ?, ?, ?)
                """, (ticker, primary_name, json.dumps(brand_names), category, len(locations)))

                brand_id = cursor.lastrowid

                # Get brand_id if it was an update
                if brand_id == 0:
                    cursor.execute("SELECT id FROM brands WHERE ticker = ?", (ticker,))
                    row = cursor.fetchone()
                    brand_id = row['id'] if row else None

                if brand_id is None:
                    print(f"  WARNING: Could not get brand_id for {ticker}")
                    continue

                brand_count += 1

                # Insert locations in batches
                batch = []
                for loc in locations:
                    lat = loc.get('lat')
                    lng = loc.get('lng')
                    if lat is None or lng is None:
                        continue

                    # Extract sub-scores
                    ss = loc.get('ss', {})
                    attrs = loc.get('at', {})

                    batch.append((
                        loc.get('id'),
                        brand_id,
                        ticker,
                        loc.get('n', primary_name),
                        loc.get('a', ''),
                        None,  # city (parse from address if needed)
                        None,  # state
                        None,  # zip
                        'USA',
                        lat,
                        lng,
                        loc.get('s'),
                        ss.get('marketPotential'),
                        ss.get('competitiveLandscape'),
                        ss.get('accessibility'),
                        ss.get('siteCharacteristics'),
                        json.dumps(attrs) if attrs else None,
                        1,  # is_franchise
                        0,  # is_verified
                        'osm'
                    ))

                    if len(batch) >= 1000:
                        cursor.executemany("""
                            INSERT OR REPLACE INTO locations
                            (external_id, brand_id, ticker, name, address, city, state, zip, country,
                             latitude, longitude, score, market_score, competition_score,
                             accessibility_score, site_score, attributes, is_franchise, is_verified, source)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, batch)
                        location_count += len(batch)
                        batch = []

                # Insert remaining
                if batch:
                    cursor.executemany("""
                        INSERT OR REPLACE INTO locations
                        (external_id, brand_id, ticker, name, address, city, state, zip, country,
                         latitude, longitude, score, market_score, competition_score,
                         accessibility_score, site_score, attributes, is_franchise, is_verified, source)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, batch)
                    location_count += len(batch)

                print(f"  {ticker}: {len(locations):,} locations")

            except json.JSONDecodeError as e:
                print(f"  WARNING: Failed to parse {json_file.name}: {e}")
            except Exception as e:
                print(f"  WARNING: Error processing {json_file.name}: {e}")

        conn.commit()
        print(f"  [OK] Migrated {brand_count} brands, {location_count:,} locations")
        return brand_count, location_count

    def migrate_stocks(self) -> int:
        """Migrate stock data from CSV file."""
        print("\n[2/4] Migrating stocks from data/franchise_stocks.csv...")

        csv_file = DATA_DIR / "franchise_stocks.csv"
        if not csv_file.exists():
            print("  No stock CSV file found, skipping")
            return 0

        conn = self.connect()
        cursor = conn.cursor()
        count = 0

        try:
            with open(csv_file, 'r', newline='') as f:
                reader = csv.DictReader(f)

                batch = []
                for row in reader:
                    try:
                        batch.append((
                            row.get('Symbol', row.get('ticker', '')),
                            row.get('Date', row.get('date', '')),
                            float(row.get('Open', 0) or 0),
                            float(row.get('High', 0) or 0),
                            float(row.get('Low', 0) or 0),
                            float(row.get('Close', 0) or 0),
                            float(row.get('Adj Close', row.get('AdjClose', 0)) or 0),
                            int(float(row.get('Volume', 0) or 0))
                        ))

                        if len(batch) >= 5000:
                            cursor.executemany("""
                                INSERT OR REPLACE INTO stocks
                                (ticker, date, open, high, low, close, adj_close, volume)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                            """, batch)
                            count += len(batch)
                            batch = []

                    except (ValueError, KeyError) as e:
                        continue

                if batch:
                    cursor.executemany("""
                        INSERT OR REPLACE INTO stocks
                        (ticker, date, open, high, low, close, adj_close, volume)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, batch)
                    count += len(batch)

            conn.commit()
            print(f"  [OK] Migrated {count:,} stock records")

        except Exception as e:
            print(f"  ERROR: Failed to migrate stocks: {e}")

        return count

    def migrate_sports(self) -> int:
        """Migrate sports data from JSON files."""
        print("\n[3/4] Migrating sports from data/sports/...")

        conn = self.connect()
        cursor = conn.cursor()
        count = 0

        league_files = {
            'NFL': SPORTS_DIR / 'football' / 'current-week.json',
            'NBA': SPORTS_DIR / 'basketball' / 'current-games.json',
            'NHL': SPORTS_DIR / 'hockey' / 'current-games.json',
            'MLB': SPORTS_DIR / 'baseball' / 'current-games.json',
            'MLS': SPORTS_DIR / 'soccer' / 'current-games.json',
        }

        for league, filepath in league_files.items():
            if not filepath.exists():
                continue

            try:
                with open(filepath, 'r') as f:
                    data = json.load(f)

                games = data.get('games', [])
                if not games:
                    continue

                for game in games:
                    cursor.execute("""
                        INSERT OR REPLACE INTO sports_games
                        (external_id, league, game_date, game_time, status,
                         home_team, home_abbr, home_logo, home_score, home_record,
                         away_team, away_abbr, away_logo, away_score, away_record,
                         venue, broadcast, headline, video_url, is_final)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        game.get('id'),
                        league,
                        game.get('date'),
                        game.get('time'),
                        game.get('status', 'scheduled'),
                        game.get('home_team'),
                        game.get('home_abbr'),
                        game.get('home_logo'),
                        game.get('home_score'),
                        game.get('home_record'),
                        game.get('away_team'),
                        game.get('away_abbr'),
                        game.get('away_logo'),
                        game.get('away_score'),
                        game.get('away_record'),
                        game.get('venue'),
                        game.get('broadcast'),
                        game.get('headline'),
                        game.get('video_url'),
                        1 if game.get('is_final') else 0
                    ))
                    count += 1

                print(f"  {league}: {len(games)} games")

            except Exception as e:
                print(f"  WARNING: Failed to migrate {league}: {e}")

        conn.commit()
        print(f"  [OK] Migrated {count} sports games")
        return count

    def migrate_news(self) -> int:
        """Migrate news articles from JSON file."""
        print("\n[4/4] Migrating news from data/franchise_news.json...")

        news_file = DATA_DIR / "franchise_news.json"
        if not news_file.exists():
            print("  No news file found, skipping")
            return 0

        conn = self.connect()
        cursor = conn.cursor()
        count = 0

        try:
            with open(news_file, 'r') as f:
                data = json.load(f)

            articles = data if isinstance(data, list) else data.get('articles', [])

            for article in articles:
                cursor.execute("""
                    INSERT OR IGNORE INTO news_articles
                    (external_id, title, description, url, source, category, image_url, published_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    article.get('id'),
                    article.get('title'),
                    article.get('description'),
                    article.get('url', article.get('link')),
                    article.get('source'),
                    article.get('category'),
                    article.get('image_url', article.get('image')),
                    article.get('published_at', article.get('pubDate'))
                ))
                count += 1

            conn.commit()
            print(f"  [OK] Migrated {count} news articles")

        except Exception as e:
            print(f"  ERROR: Failed to migrate news: {e}")

        return count

    # =========================================================================
    # Helper methods
    # =========================================================================

    def _categorize_brand(self, ticker: str) -> str:
        """Categorize a brand based on ticker."""
        categories = {
            'QSR': ['MCD', 'WEN', 'YUM', 'QSR', 'JACK', 'SHAK', 'WING', 'CFA', 'SUB', 'DQ', 'FIVE', 'CANE', 'WHATA', 'ZAX', 'BO', 'INNOUT'],
            'Pizza': ['DPZ', 'PZZA'],
            'Cafe': ['SBUX', 'DNUT', 'DUTCH'],
            'Fast Casual': ['CMG', 'PANERA', 'JM', 'PANDA'],
            'Casual Dining': ['DIN', 'DENN', 'CBRL', 'TXRH', 'BLMN', 'CAKE', 'BJRI', 'CHUY', 'EAT', 'DRI', 'RRGB', 'PLAY', 'NATH'],
            'Hotel': ['MAR', 'HLT', 'H', 'IHG', 'WH', 'CHH', 'BW', 'G6', 'VAC', 'TNL'],
            'Fitness': ['PLNT', 'XPOF'],
            'Auto': ['DRVN', 'HLE', 'CAR', 'MCW', 'UHAL'],
            'Services': ['HRB', 'SERV', 'ROL'],
            'Convenience': ['WAWA', 'SHEETZ'],
            'Conglomerate': ['INSPIRE', 'FOCUS', 'DRIVEN', 'ROARK']
        }

        for category, tickers in categories.items():
            if ticker in tickers:
                return category
        return 'Other'

    # =========================================================================
    # Export to JSON for frontend
    # =========================================================================

    def export_locations_json(self, output_dir: Optional[Path] = None) -> int:
        """Export locations to JSON files for frontend map."""
        output_dir = output_dir or BRANDS_DIR
        output_dir.mkdir(parents=True, exist_ok=True)

        conn = self.connect()
        cursor = conn.cursor()

        # Get all tickers with locations
        cursor.execute("SELECT DISTINCT ticker FROM locations WHERE ticker IS NOT NULL")
        tickers = [row['ticker'] for row in cursor.fetchall()]

        count = 0
        for ticker in tickers:
            cursor.execute("""
                SELECT external_id as id, ticker, name as n, address as a,
                       latitude as lat, longitude as lng, score as s,
                       market_score, competition_score, accessibility_score, site_score,
                       attributes
                FROM locations
                WHERE ticker = ?
            """, (ticker,))

            locations = []
            for row in cursor.fetchall():
                loc = dict(row)
                # Build sub-scores object
                loc['ss'] = {
                    'marketPotential': loc.pop('market_score'),
                    'competitiveLandscape': loc.pop('competition_score'),
                    'accessibility': loc.pop('accessibility_score'),
                    'siteCharacteristics': loc.pop('site_score')
                }
                # Parse attributes JSON
                attrs = loc.pop('attributes')
                loc['at'] = json.loads(attrs) if attrs else {}
                locations.append(loc)

            if locations:
                output_file = output_dir / f"{ticker}.json"
                with open(output_file, 'w') as f:
                    json.dump(locations, f, separators=(',', ':'))
                count += len(locations)
                print(f"  Exported {ticker}: {len(locations):,} locations")

        print(f"[OK] Exported {count:,} total locations to {output_dir}")
        return count

    # =========================================================================
    # Statistics
    # =========================================================================

    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        conn = self.connect()
        cursor = conn.cursor()

        stats = {}

        # Table counts
        tables = ['brands', 'locations', 'stocks', 'stock_quotes', 'sports_games', 'news_articles']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) as count FROM {table}")
            stats[table] = cursor.fetchone()['count']

        # Location breakdown by category
        cursor.execute("""
            SELECT b.category, COUNT(l.id) as count
            FROM brands b
            LEFT JOIN locations l ON b.id = l.brand_id
            GROUP BY b.category
            ORDER BY count DESC
        """)
        stats['locations_by_category'] = {row['category']: row['count'] for row in cursor.fetchall()}

        # Top 10 brands by location count
        cursor.execute("""
            SELECT ticker, name, location_count, avg_score
            FROM brands
            ORDER BY location_count DESC
            LIMIT 10
        """)
        stats['top_brands'] = [dict(row) for row in cursor.fetchall()]

        # Database file size
        if self.db_path.exists():
            stats['db_size_mb'] = round(self.db_path.stat().st_size / (1024 * 1024), 2)

        return stats

    def print_stats(self):
        """Print formatted database statistics."""
        stats = self.get_stats()

        print("\n" + "=" * 60)
        print("FranchiseIQ Database Statistics")
        print("=" * 60)

        print("\nTable Row Counts:")
        for table in ['brands', 'locations', 'stocks', 'stock_quotes', 'sports_games', 'news_articles']:
            print(f"  {table}: {stats.get(table, 0):,}")

        print("\nLocations by Category:")
        for category, count in stats.get('locations_by_category', {}).items():
            if count > 0:
                print(f"  {category or 'Unknown'}: {count:,}")

        print("\nTop 10 Brands by Location Count:")
        for brand in stats.get('top_brands', []):
            print(f"  {brand['ticker']}: {brand['name']} - {brand['location_count']:,} locations (avg score: {brand['avg_score'] or 'N/A'})")

        print(f"\nDatabase Size: {stats.get('db_size_mb', 0)} MB")
        print("=" * 60)


def main():
    parser = argparse.ArgumentParser(description='FranchiseIQ Database Manager')
    parser.add_argument('command', choices=['init', 'migrate', 'export', 'stats'],
                        help='Command to run')
    parser.add_argument('--db', type=Path, default=DB_FILE,
                        help='Database file path')

    args = parser.parse_args()

    with DatabaseManager(args.db) as db:
        if args.command == 'init':
            db.init_database()
        elif args.command == 'migrate':
            db.init_database()
            db.migrate_all()
        elif args.command == 'export':
            db.export_locations_json()
        elif args.command == 'stats':
            db.print_stats()


if __name__ == "__main__":
    main()
