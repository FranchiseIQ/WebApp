-- ============================================================================
-- FranchiseIQ Unified Database Schema
-- SQLite3 database containing all franchise data
--
-- Tables:
--   1. brands - Brand/ticker metadata and aggregated stats
--   2. locations - Franchise locations with geospatial data
--   3. stocks - Historical stock price data (OHLCV)
--   4. stock_quotes - Live/recent stock quotes
--   5. sports_games - Sports game data across all leagues
--   6. news_articles - Franchise news articles
--   7. restaurant_types - Lookup table for restaurant categories
--
-- Created: 2025-12-29
-- ============================================================================

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================================================
-- TABLE: brands
-- Brand metadata and stock ticker mappings
-- ============================================================================
CREATE TABLE IF NOT EXISTS brands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE NOT NULL,           -- Stock ticker symbol (e.g., "MCD")
    name TEXT NOT NULL,                     -- Primary brand name
    aliases TEXT,                           -- JSON array of alternative names
    category TEXT,                          -- Category: "QSR", "Casual Dining", "Hotel", etc.
    parent_company TEXT,                    -- Parent company name
    is_franchise BOOLEAN DEFAULT 1,         -- 1 = franchise, 0 = corporate-owned chain
    is_public BOOLEAN DEFAULT 1,            -- 1 = publicly traded, 0 = private
    location_count INTEGER DEFAULT 0,       -- Total US locations
    avg_score REAL,                         -- Average location score (0-100)
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_brands_ticker ON brands(ticker);
CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);
CREATE INDEX IF NOT EXISTS idx_brands_is_franchise ON brands(is_franchise);

-- ============================================================================
-- TABLE: restaurant_types
-- Lookup table for restaurant/business categories
-- ============================================================================
CREATE TABLE IF NOT EXISTS restaurant_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,              -- Short code (e.g., "QSR", "CASUAL")
    name TEXT NOT NULL,                     -- Full name (e.g., "Quick Service Restaurant")
    description TEXT,                       -- Description of category
    parent_type TEXT,                       -- Parent category code (for hierarchy)
    sort_order INTEGER DEFAULT 0            -- Display order
);

-- Pre-populate restaurant types
INSERT OR IGNORE INTO restaurant_types (code, name, description, sort_order) VALUES
    ('QSR', 'Quick Service Restaurant', 'Fast food and counter service', 1),
    ('FAST_CASUAL', 'Fast Casual', 'Fast food with higher quality/price point', 2),
    ('CASUAL', 'Casual Dining', 'Sit-down restaurants with table service', 3),
    ('FINE_DINING', 'Fine Dining', 'Upscale restaurants', 4),
    ('CAFE', 'Cafe/Coffee Shop', 'Coffee shops and cafes', 5),
    ('PIZZA', 'Pizza', 'Pizza chains', 6),
    ('CHICKEN', 'Chicken', 'Chicken-focused chains', 7),
    ('MEXICAN', 'Mexican', 'Mexican cuisine', 8),
    ('ASIAN', 'Asian', 'Asian cuisine restaurants', 9),
    ('HOTEL', 'Hotel/Lodging', 'Hotels and lodging', 10),
    ('FITNESS', 'Fitness', 'Gyms and fitness centers', 11),
    ('AUTO', 'Automotive', 'Auto service and repair', 12),
    ('RETAIL', 'Retail', 'Retail franchises', 13),
    ('SERVICES', 'Services', 'Service-based businesses', 14),
    ('INDEPENDENT', 'Independent Restaurant', 'Non-franchise independent restaurants', 15);

-- ============================================================================
-- TABLE: locations
-- Franchise and restaurant locations with geospatial data
-- ============================================================================
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,                       -- External ID from source (e.g., OSM node ID)
    brand_id INTEGER,                       -- FK to brands table
    ticker TEXT,                            -- Stock ticker (denormalized for performance)
    name TEXT NOT NULL,                     -- Location name
    address TEXT,                           -- Full address string
    city TEXT,                              -- City name
    state TEXT,                             -- State code (e.g., "CA")
    zip TEXT,                               -- ZIP/postal code
    country TEXT DEFAULT 'USA',             -- Country code
    latitude REAL NOT NULL,                 -- Latitude coordinate
    longitude REAL NOT NULL,                -- Longitude coordinate

    -- Scoring and attributes
    score INTEGER,                          -- Overall suitability score (0-100)
    market_score REAL,                      -- Market potential sub-score
    competition_score REAL,                 -- Competitive landscape sub-score
    accessibility_score REAL,               -- Accessibility sub-score
    site_score REAL,                        -- Site characteristics sub-score

    -- Demographic attributes (JSON for flexibility)
    attributes TEXT,                        -- JSON blob with demographic data

    -- Metadata
    is_franchise BOOLEAN DEFAULT 1,         -- 1 = franchise, 0 = corporate or independent
    is_verified BOOLEAN DEFAULT 0,          -- 1 = verified location, 0 = unverified
    source TEXT DEFAULT 'osm',              -- Data source: "osm", "manual", "api"
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Spatial index for geo queries (SQLite doesn't have native spatial, use compound index)
CREATE INDEX IF NOT EXISTS idx_locations_geo ON locations(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_locations_ticker ON locations(ticker);
CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state);
CREATE INDEX IF NOT EXISTS idx_locations_city ON locations(city);
CREATE INDEX IF NOT EXISTS idx_locations_score ON locations(score);
CREATE INDEX IF NOT EXISTS idx_locations_brand_id ON locations(brand_id);

-- ============================================================================
-- TABLE: stocks
-- Historical stock price data (OHLCV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,                   -- Stock ticker symbol
    date DATE NOT NULL,                     -- Trading date
    open REAL,                              -- Opening price
    high REAL,                              -- High price
    low REAL,                               -- Low price
    close REAL NOT NULL,                    -- Closing price
    adj_close REAL,                         -- Adjusted closing price
    volume INTEGER,                         -- Trading volume

    UNIQUE(ticker, date)
);

CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_stocks_date ON stocks(date);
CREATE INDEX IF NOT EXISTS idx_stocks_ticker_date ON stocks(ticker, date DESC);

-- ============================================================================
-- TABLE: stock_quotes
-- Live/recent stock quotes
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT UNIQUE NOT NULL,            -- Stock ticker symbol
    price REAL NOT NULL,                    -- Current/last price
    change REAL,                            -- Price change
    change_percent REAL,                    -- Percent change
    volume INTEGER,                         -- Volume
    market_cap REAL,                        -- Market capitalization
    pe_ratio REAL,                          -- P/E ratio
    high_52week REAL,                       -- 52-week high
    low_52week REAL,                        -- 52-week low
    is_market_open BOOLEAN DEFAULT 0,       -- Market status
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_quotes_ticker ON stock_quotes(ticker);

-- ============================================================================
-- TABLE: sports_games
-- Sports game data across all leagues
-- ============================================================================
CREATE TABLE IF NOT EXISTS sports_games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,                       -- External game ID from ESPN
    league TEXT NOT NULL,                   -- League: "NFL", "NBA", "NHL", "MLB", "MLS", "WNBA"
    season TEXT,                            -- Season (e.g., "2024-25")
    week INTEGER,                           -- Week number (for NFL)
    game_date DATE NOT NULL,                -- Game date
    game_time TEXT,                         -- Game time (local)
    status TEXT,                            -- "scheduled", "in_progress", "final"

    -- Teams
    home_team TEXT NOT NULL,                -- Home team name
    home_abbr TEXT,                         -- Home team abbreviation
    home_logo TEXT,                         -- Home team logo URL
    home_score INTEGER,                     -- Home team score
    home_record TEXT,                       -- Home team record (e.g., "10-3")

    away_team TEXT NOT NULL,                -- Away team name
    away_abbr TEXT,                         -- Away team abbreviation
    away_logo TEXT,                         -- Away team logo URL
    away_score INTEGER,                     -- Away team score
    away_record TEXT,                       -- Away team record

    -- Game details
    venue TEXT,                             -- Venue name
    broadcast TEXT,                         -- TV broadcast info
    headline TEXT,                          -- Game headline/summary
    video_url TEXT,                         -- Highlight video URL
    video_thumbnail TEXT,                   -- Video thumbnail URL

    -- Metadata
    is_final BOOLEAN DEFAULT 0,             -- 1 = game completed
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(external_id)
);

CREATE INDEX IF NOT EXISTS idx_sports_games_league ON sports_games(league);
CREATE INDEX IF NOT EXISTS idx_sports_games_date ON sports_games(game_date);
CREATE INDEX IF NOT EXISTS idx_sports_games_league_date ON sports_games(league, game_date DESC);

-- ============================================================================
-- TABLE: news_articles
-- Franchise news articles
-- ============================================================================
CREATE TABLE IF NOT EXISTS news_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT,                       -- External article ID/hash
    title TEXT NOT NULL,                    -- Article title
    description TEXT,                       -- Article summary
    url TEXT NOT NULL,                      -- Article URL
    source TEXT,                            -- Source name (e.g., "QSR Magazine")
    category TEXT,                          -- Category: "trade_press", "general", etc.
    image_url TEXT,                         -- Article image URL
    published_at TIMESTAMP,                 -- Publication date
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Related brands (JSON array of tickers)
    related_tickers TEXT,                   -- JSON array of related ticker symbols

    UNIQUE(url)
);

CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at DESC);

-- ============================================================================
-- VIEW: location_summary
-- Aggregated location statistics by brand
-- ============================================================================
CREATE VIEW IF NOT EXISTS location_summary AS
SELECT
    b.ticker,
    b.name AS brand_name,
    b.category,
    b.is_franchise,
    COUNT(l.id) AS location_count,
    ROUND(AVG(l.score), 1) AS avg_score,
    ROUND(AVG(l.market_score), 1) AS avg_market_score,
    ROUND(AVG(l.competition_score), 1) AS avg_competition_score,
    COUNT(DISTINCT l.state) AS states_present,
    MAX(l.last_updated) AS last_data_update
FROM brands b
LEFT JOIN locations l ON b.id = l.brand_id
GROUP BY b.id;

-- ============================================================================
-- VIEW: state_summary
-- Location counts by state
-- ============================================================================
CREATE VIEW IF NOT EXISTS state_summary AS
SELECT
    state,
    COUNT(*) AS total_locations,
    COUNT(DISTINCT ticker) AS brand_count,
    ROUND(AVG(score), 1) AS avg_score,
    SUM(CASE WHEN is_franchise = 1 THEN 1 ELSE 0 END) AS franchise_count,
    SUM(CASE WHEN is_franchise = 0 THEN 1 ELSE 0 END) AS corporate_count
FROM locations
WHERE state IS NOT NULL
GROUP BY state
ORDER BY total_locations DESC;

-- ============================================================================
-- Triggers for automatic updates
-- ============================================================================

-- Update brand location counts when locations change
CREATE TRIGGER IF NOT EXISTS update_brand_location_count_insert
AFTER INSERT ON locations
BEGIN
    UPDATE brands
    SET location_count = (SELECT COUNT(*) FROM locations WHERE brand_id = NEW.brand_id),
        avg_score = (SELECT ROUND(AVG(score), 1) FROM locations WHERE brand_id = NEW.brand_id),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = NEW.brand_id;
END;

CREATE TRIGGER IF NOT EXISTS update_brand_location_count_delete
AFTER DELETE ON locations
BEGIN
    UPDATE brands
    SET location_count = (SELECT COUNT(*) FROM locations WHERE brand_id = OLD.brand_id),
        avg_score = (SELECT ROUND(AVG(score), 1) FROM locations WHERE brand_id = OLD.brand_id),
        last_updated = CURRENT_TIMESTAMP
    WHERE id = OLD.brand_id;
END;
