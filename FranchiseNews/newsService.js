/* ============================================================================
   FRANCHISE NEWS SERVICE - Data Model & Mock Data Provider
   ============================================================================

   This module provides a clean abstraction for franchise news data.
   Currently returns mock data, but designed for easy integration with:
   - RSS feed aggregation
   - Static JSON files
   - Serverless API endpoints (AWS Lambda, Cloudflare Workers, etc.)

   DATA MODEL:

   NewsSource: {
     id: string           // Unique identifier (lowercase-hyphenated)
     name: string         // Full display name
     category: string     // One of the categories defined below
     homepageUrl: string  // Source homepage URL
     shortLabel: string   // Brief label for ticker display (2-4 words)
   }

   NewsArticle: {
     id: string           // Unique identifier
     title: string        // Article headline
     sourceId: string     // Reference to NewsSource.id
     url: string          // Direct article URL
     publishedAt: string  // ISO 8601 date string (YYYY-MM-DD)
     category: string     // Same as source category
     shortSourceLabel: string // Cached from source for convenience
   }

   ============================================================================ */

// Category constants
export const NEWS_CATEGORIES = {
  TRADE_PRESS: 'Trade press and industry news',
  BIG_PORTALS: 'Big portals, directories, and lead-gen sites',
  RESEARCH: 'Research, reviews, and investor-oriented info',
  ASSOCIATIONS: 'Associations and policy hubs',
  CONSULTANTS: 'Consultants, suppliers, and franchisor service firms'
};

// News source registry
const NEWS_SOURCES = [
  // Trade press and industry news
  {
    id: 'franchise-times',
    name: 'Franchise Times',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    homepageUrl: 'https://www.franchisetimes.com/',
    shortLabel: 'Franchise Times'
  },
  {
    id: '1851-franchise',
    name: '1851 Franchise',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    homepageUrl: 'https://1851franchise.com/',
    shortLabel: '1851 Franchise'
  },
  {
    id: 'franchisewire',
    name: 'FranchiseWire',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    homepageUrl: 'https://www.franchisewire.com/',
    shortLabel: 'FranchiseWire'
  },
  {
    id: 'qsr-magazine',
    name: 'QSR Magazine',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    homepageUrl: 'https://www.qsrmagazine.com/franchising/',
    shortLabel: 'QSR Magazine'
  },
  {
    id: 'blue-maumau',
    name: 'Blue MauMau',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    homepageUrl: 'https://www.bluemaumau.org/',
    shortLabel: 'Blue MauMau'
  },

  // Big portals, directories, and lead-gen sites
  {
    id: 'franchising-com',
    name: 'Franchising.com',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    homepageUrl: 'https://www.franchising.com/',
    shortLabel: 'Franchising.com'
  },
  {
    id: 'franchise-direct',
    name: 'Franchise Direct',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    homepageUrl: 'https://www.franchisedirect.com/',
    shortLabel: 'Franchise Direct'
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur Franchises',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    homepageUrl: 'https://www.entrepreneur.com/franchise500',
    shortLabel: 'Entrepreneur'
  },
  {
    id: 'franchise-gator',
    name: 'Franchise Gator',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    homepageUrl: 'https://www.franchisegator.com/',
    shortLabel: 'Franchise Gator'
  },

  // Research, reviews, and investor-oriented info
  {
    id: 'franchise-business-review',
    name: 'Franchise Business Review',
    category: NEWS_CATEGORIES.RESEARCH,
    homepageUrl: 'https://franchisebusinessreview.com/',
    shortLabel: 'FBR'
  },
  {
    id: 'franchising-magazine-usa',
    name: 'Franchising Magazine USA',
    category: NEWS_CATEGORIES.RESEARCH,
    homepageUrl: 'https://franchisingmagazineusa.com/',
    shortLabel: 'Franchising Magazine'
  },

  // Associations and policy hubs
  {
    id: 'ifa',
    name: 'International Franchise Association',
    category: NEWS_CATEGORIES.ASSOCIATIONS,
    homepageUrl: 'https://www.franchise.org/',
    shortLabel: 'IFA'
  },

  // Consultants, suppliers, and franchisor service firms
  {
    id: 'startblox',
    name: 'StartBlox',
    category: NEWS_CATEGORIES.CONSULTANTS,
    homepageUrl: 'https://startblox.com/',
    shortLabel: 'StartBlox'
  },
  {
    id: 'frannexus',
    name: 'Frannexus',
    category: NEWS_CATEGORIES.CONSULTANTS,
    homepageUrl: 'https://frannexus.com/',
    shortLabel: 'Frannexus'
  },
  {
    id: 'ifranchise-group',
    name: 'iFranchise Group',
    category: NEWS_CATEGORIES.CONSULTANTS,
    homepageUrl: 'https://ifranchisegroup.com/',
    shortLabel: 'iFranchise Group'
  },
  {
    id: 'goodspark',
    name: 'GoodSpark Franchise Development',
    category: NEWS_CATEGORIES.CONSULTANTS,
    homepageUrl: 'https://www.goodsparkfranchise.com/',
    shortLabel: 'GoodSpark'
  },
  {
    id: 'field-coach',
    name: 'Field Coach Experts',
    category: NEWS_CATEGORIES.CONSULTANTS,
    homepageUrl: 'https://fieldcoachexperts.com/',
    shortLabel: 'Field Coach'
  }
];

// Mock news articles (10 examples across different sources and categories)
const MOCK_NEWS_ARTICLES = [
  {
    id: 'news-001',
    title: 'QSR brands navigate new labor compliance regulations for 2025',
    sourceId: 'franchise-times',
    url: 'https://www.franchisetimes.com/',
    publishedAt: '2025-01-15',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    shortSourceLabel: 'Franchise Times'
  },
  {
    id: 'news-002',
    title: 'Multi-unit franchise deals surge 45% in Southwest region',
    sourceId: '1851-franchise',
    url: 'https://1851franchise.com/',
    publishedAt: '2025-01-14',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    shortSourceLabel: '1851 Franchise'
  },
  {
    id: 'news-003',
    title: 'Top 10 emerging franchise brands to watch in 2025',
    sourceId: 'entrepreneur',
    url: 'https://www.entrepreneur.com/franchise500',
    publishedAt: '2025-01-13',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    shortSourceLabel: 'Entrepreneur'
  },
  {
    id: 'news-004',
    title: 'Franchisee satisfaction scores reach 5-year high across QSR sector',
    sourceId: 'franchise-business-review',
    url: 'https://franchisebusinessreview.com/',
    publishedAt: '2025-01-12',
    category: NEWS_CATEGORIES.RESEARCH,
    shortSourceLabel: 'FBR'
  },
  {
    id: 'news-005',
    title: 'IFA releases new economic impact study showing $860B contribution',
    sourceId: 'ifa',
    url: 'https://www.franchise.org/',
    publishedAt: '2025-01-11',
    category: NEWS_CATEGORIES.ASSOCIATIONS,
    shortSourceLabel: 'IFA'
  },
  {
    id: 'news-006',
    title: 'Technology investment by franchisors increases 67% year-over-year',
    sourceId: 'franchisewire',
    url: 'https://www.franchisewire.com/',
    publishedAt: '2025-01-10',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    shortSourceLabel: 'FranchiseWire'
  },
  {
    id: 'news-007',
    title: 'Private equity firms show renewed interest in mid-sized franchise systems',
    sourceId: 'blue-maumau',
    url: 'https://www.bluemaumau.org/',
    publishedAt: '2025-01-09',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    shortSourceLabel: 'Blue MauMau'
  },
  {
    id: 'news-008',
    title: 'Franchise development strategies shift toward smaller markets',
    sourceId: 'franchising-com',
    url: 'https://www.franchising.com/',
    publishedAt: '2025-01-08',
    category: NEWS_CATEGORIES.BIG_PORTALS,
    shortSourceLabel: 'Franchising.com'
  },
  {
    id: 'news-009',
    title: 'New franchise disclosure requirements take effect in California',
    sourceId: 'qsr-magazine',
    url: 'https://www.qsrmagazine.com/franchising/',
    publishedAt: '2025-01-07',
    category: NEWS_CATEGORIES.TRADE_PRESS,
    shortSourceLabel: 'QSR Magazine'
  },
  {
    id: 'news-010',
    title: 'Best practices for franchise marketing automation released by consultants',
    sourceId: 'ifranchise-group',
    url: 'https://ifranchisegroup.com/',
    publishedAt: '2025-01-06',
    category: NEWS_CATEGORIES.CONSULTANTS,
    shortSourceLabel: 'iFranchise Group'
  },
  {
    id: 'news-011',
    title: 'Franchise veterans share insights on unit economics optimization',
    sourceId: 'goodspark',
    url: 'https://www.goodsparkfranchise.com/',
    publishedAt: '2025-01-05',
    category: NEWS_CATEGORIES.CONSULTANTS,
    shortSourceLabel: 'GoodSpark'
  },
  {
    id: 'news-012',
    title: 'Annual franchise industry outlook predicts 3.2% growth in 2025',
    sourceId: 'franchising-magazine-usa',
    url: 'https://franchisingmagazineusa.com/',
    publishedAt: '2025-01-04',
    category: NEWS_CATEGORIES.RESEARCH,
    shortSourceLabel: 'Franchising Magazine'
  }
];

/* ============================================================================
   NEWS SERVICE API
   ============================================================================ */

class NewsService {
  constructor() {
    this.sources = NEWS_SOURCES;
    this.articles = MOCK_NEWS_ARTICLES;
  }

  /**
   * Get all news sources
   * @returns {Array} Array of NewsSource objects
   */
  getAllSources() {
    return [...this.sources];
  }

  /**
   * Get sources filtered by category
   * @param {Array<string>} categories - Array of category names
   * @returns {Array} Filtered NewsSource objects
   */
  getSourcesByCategory(categories) {
    if (!categories || categories.length === 0) {
      return this.getAllSources();
    }
    return this.sources.filter(source => categories.includes(source.category));
  }

  /**
   * Get a single source by ID
   * @param {string} sourceId - Source identifier
   * @returns {Object|null} NewsSource object or null
   */
  getSourceById(sourceId) {
    return this.sources.find(source => source.id === sourceId) || null;
  }

  /**
   * Get all news articles (mock data for now)
   *
   * FUTURE: Replace this with:
   *   return fetch('/api/franchise-news').then(r => r.json());
   * or:
   *   return fetch('/data/news.json').then(r => r.json());
   *
   * @returns {Promise<Array>} Promise resolving to NewsArticle array
   */
  async getAllArticles() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return [...this.articles];
  }

  /**
   * Get articles with filtering options
   * @param {Object} options - Filter options
   * @param {Array<string>} options.categories - Filter by categories
   * @param {Array<string>} options.sources - Filter by source IDs
   * @param {number} options.days - Only show articles from last N days
   * @param {number} options.limit - Maximum number of articles to return
   * @returns {Promise<Array>} Filtered NewsArticle array
   */
  async getArticles(options = {}) {
    let articles = await this.getAllArticles();

    // Filter by categories
    if (options.categories && options.categories.length > 0) {
      articles = articles.filter(article =>
        options.categories.includes(article.category)
      );
    }

    // Filter by source IDs
    if (options.sources && options.sources.length > 0) {
      articles = articles.filter(article =>
        options.sources.includes(article.sourceId)
      );
    }

    // Filter by time window (last N days)
    if (options.days && options.days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.days);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      articles = articles.filter(article =>
        article.publishedAt >= cutoffStr
      );
    }

    // Sort by date (newest first)
    articles.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    // Limit results
    if (options.limit && options.limit > 0) {
      articles = articles.slice(0, options.limit);
    }

    return articles;
  }

  /**
   * Format date for display
   * @param {string} dateStr - ISO date string (YYYY-MM-DD)
   * @returns {string} Formatted date (e.g., "Jan 15, 2025")
   */
  formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Get relative time display (e.g., "2 days ago")
   * @param {string} dateStr - ISO date string (YYYY-MM-DD)
   * @returns {string} Relative time string
   */
  getRelativeTime(dateStr) {
    const articleDate = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const diffTime = now - articleDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    return this.formatDate(dateStr);
  }
}

// Export singleton instance
export const newsService = new NewsService();

// Also export for use in browser without module bundler
if (typeof window !== 'undefined') {
  window.FranchiseNewsService = newsService;
  window.NEWS_CATEGORIES = NEWS_CATEGORIES;
}
