/**
 * FranResearch Data Service
 * Centralized data fetching with caching and error handling
 */

const DataService = {
  /**
   * Base configuration
   */
  config: {
    corsProxy: 'https://api.allorigins.win/raw?url=',
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 10000
  },

  /**
   * Cache storage
   */
  cache: new Map(),

  /**
   * Fetch with timeout and retry
   * @param {string} url - URL to fetch
   * @param {object} options - Fetch options
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Response>} Fetch response
   */
  async fetchWithRetry(url, options = {}, retries = this.config.retryAttempts) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (retries > 0 && !error.name?.includes('Abort')) {
        await new Promise(r => setTimeout(r, this.config.retryDelay));
        return this.fetchWithRetry(url, options, retries - 1);
      }

      throw error;
    }
  },

  /**
   * Fetch JSON data with caching
   * @param {string} url - URL to fetch
   * @param {object} options - Options including cacheKey and cacheDuration
   * @returns {Promise<object>} Parsed JSON data
   */
  async fetchJSON(url, options = {}) {
    const { cacheKey, cacheDuration = 300000, useCors = false } = options;
    const finalUrl = useCors ? `${this.config.corsProxy}${encodeURIComponent(url)}` : url;

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        return cached.data;
      }
    }

    try {
      const response = await this.fetchWithRetry(finalUrl);
      const data = await response.json();

      // Update cache
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error(`DataService.fetchJSON failed for ${url}:`, error.message);

      // Return cached data if available (even if expired)
      if (cacheKey && this.cache.has(cacheKey)) {
        console.warn('Returning stale cache data');
        return this.cache.get(cacheKey).data;
      }

      throw error;
    }
  },

  /**
   * Fetch CSV data and parse to array
   * @param {string} url - URL to fetch
   * @param {object} options - Parse options
   * @returns {Promise<object[]>} Parsed CSV data
   */
  async fetchCSV(url, options = {}) {
    const { cacheKey, cacheDuration = 3600000 } = options;

    // Check cache first
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheDuration) {
        return cached.data;
      }
    }

    try {
      const response = await this.fetchWithRetry(url);
      const text = await response.text();
      const data = this.parseCSV(text);

      // Update cache
      if (cacheKey) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      }

      return data;
    } catch (error) {
      console.error(`DataService.fetchCSV failed for ${url}:`, error.message);

      // Return cached data if available
      if (cacheKey && this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey).data;
      }

      throw error;
    }
  },

  /**
   * Parse CSV text to array of objects
   * @param {string} text - CSV text
   * @returns {object[]} Array of parsed objects
   */
  parseCSV(text) {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          const value = values[index];
          // Auto-convert numbers
          row[header] = isNaN(value) || value === '' ? value : parseFloat(value);
        });
        data.push(row);
      }
    }

    return data;
  },

  /**
   * Fetch live ticker data
   * @returns {Promise<object>} Ticker data
   */
  async getLiveTickerData() {
    return this.fetchJSON('data/live_ticker.json', {
      cacheKey: 'live_ticker',
      cacheDuration: 60000 // 1 minute
    });
  },

  /**
   * Fetch historical stock data
   * @returns {Promise<object[]>} Historical stock data
   */
  async getHistoricalStockData() {
    return this.fetchCSV('data/franchise_stocks.csv', {
      cacheKey: 'historical_stocks',
      cacheDuration: 3600000 // 1 hour
    });
  },

  /**
   * Fetch franchise news
   * @returns {Promise<object[]>} News articles
   */
  async getFranchiseNews() {
    return this.fetchJSON('FranchiseNews/data/franchise_news.json', {
      cacheKey: 'franchise_news',
      cacheDuration: 300000 // 5 minutes
    });
  },

  /**
   * Fetch sports data
   * @param {string} sport - Sport type ('football', 'basketball', etc.)
   * @returns {Promise<object>} Sports data
   */
  async getSportsData(sport) {
    const endpoints = {
      football: 'data/football/current-week.json',
      basketball: 'data/basketball/games.json'
    };

    return this.fetchJSON(endpoints[sport] || endpoints.football, {
      cacheKey: `sports_${sport}`,
      cacheDuration: 300000 // 5 minutes
    });
  },

  /**
   * Fetch stock quote from Yahoo Finance (via CORS proxy)
   * @param {string} symbol - Stock ticker symbol
   * @returns {Promise<object>} Stock quote data
   */
  async getStockQuote(symbol) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    try {
      const data = await this.fetchJSON(url, {
        useCors: true,
        cacheKey: `quote_${symbol}`,
        cacheDuration: 60000 // 1 minute
      });

      if (data?.chart?.result?.[0]) {
        const result = data.chart.result[0];
        const meta = result.meta;
        const quote = result.indicators?.quote?.[0];

        return {
          symbol: meta.symbol,
          price: meta.regularMarketPrice,
          previousClose: meta.previousClose,
          change: meta.regularMarketPrice - meta.previousClose,
          changePercent: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
          volume: quote?.volume?.[quote.volume.length - 1] || 0,
          timestamp: meta.regularMarketTime * 1000
        };
      }

      throw new Error('Invalid response format');
    } catch (error) {
      console.error(`Failed to fetch quote for ${symbol}:`, error.message);
      return null;
    }
  },

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
  },

  /**
   * Clear specific cache entry
   * @param {string} key - Cache key to clear
   */
  clearCacheEntry(key) {
    this.cache.delete(key);
  },

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataService;
}
if (typeof window !== 'undefined') {
  window.DataService = DataService;
}
