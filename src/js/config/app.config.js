/**
 * FranResearch Application Configuration
 * Centralized configuration for all application settings
 */

const APP_CONFIG = {
  // Application metadata
  app: {
    name: 'FranResearch',
    version: '1.0.0',
    description: 'Franchise Stock Analysis Platform'
  },

  // API endpoints
  api: {
    // Data files (relative to root)
    liveTickerData: 'data/live_ticker.json',
    franchiseStocksCSV: 'data/franchise_stocks.csv',
    franchiseNews: 'FranchiseNews/data/franchise_news.json',
    footballData: 'data/football/current-week.json',
    basketballData: 'data/basketball/',

    // External APIs
    corsProxy: 'https://api.allorigins.win/raw?url=',
    yahooFinance: 'https://query1.finance.yahoo.com/v8/finance/chart/',
    stooqHistorical: 'https://stooq.com/q/d/l/?s=',

    // Supabase (optional real-time)
    supabaseUrl: null,
    supabaseKey: null
  },

  // Stock ticker configuration
  ticker: {
    symbols: [
      'MCD', 'YUM', 'DPZ', 'QSR', 'WEN', 'SHAK', 'CMG', 'TXRH', 'DRI', 'EAT',
      'CAKE', 'DENN', 'BJRI', 'BLMN', 'DIN', 'ARCO', 'LOCO', 'FAT', 'PZZA', 'WING',
      'JACK', 'BROS', 'CAVA', 'SBUX', 'MAR', 'HLT', 'H', 'IHG', 'WH', 'CHH',
      'MGM', 'WYNN', 'CZR', 'GDEN', 'PLNT', 'XPOF', 'FWRG', 'PTLO', 'CHUY', 'KRUS', 'SG'
    ],
    refreshInterval: 60000, // 60 seconds
    scrollSpeed: 50,
    pauseOnHover: true
  },

  // Market hours (Eastern Time)
  market: {
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    holidays: [
      // 2024 US Market Holidays
      '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29',
      '2024-05-27', '2024-06-19', '2024-07-04', '2024-09-02',
      '2024-11-28', '2024-12-25',
      // 2025 US Market Holidays
      '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18',
      '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
      '2025-11-27', '2025-12-25'
    ]
  },

  // Chart configuration
  charts: {
    defaultTimeRange: '1Y',
    timeRanges: ['1M', '3M', '6M', 'YTD', '1Y', '3Y', '5Y', '10Y', 'ALL'],
    maxTickers: 10,
    colors: [
      '#6366f1', '#a855f7', '#22c55e', '#eab308', '#ef4444',
      '#06b6d4', '#f97316', '#ec4899', '#8b5cf6', '#14b8a6'
    ]
  },

  // News categories
  news: {
    categories: {
      TRADE_PRESS: 'trade_press',
      BIG_PORTALS: 'big_portals',
      FRANCHISE_BRANDS: 'franchise_brands',
      FINANCE: 'finance',
      INDUSTRY: 'industry'
    },
    refreshInterval: 300000, // 5 minutes
    maxItems: 50
  },

  // Cache settings
  cache: {
    tickerDataKey: 'franresearch_ticker_cache',
    newsDataKey: 'franresearch_news_cache',
    chartDataKey: 'franresearch_chart_cache',
    expirationMs: 3600000 // 1 hour
  },

  // UI settings
  ui: {
    animationDuration: 200,
    debounceDelay: 150,
    toastDuration: 3000
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APP_CONFIG;
}
if (typeof window !== 'undefined') {
  window.APP_CONFIG = APP_CONFIG;
}
