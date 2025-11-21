/* ============================================================================
   FRANCHISE NEWS WIDGET - Main Widget Controller
   ============================================================================

   Provides two main widget types:
   1. Horizontal scrolling news ticker (Mode A)
   2. Vertical news feed widget (Mode B)

   USAGE EXAMPLES:

   // Ticker (horizontal scrolling at bottom of page)
   window.FranchiseNewsWidget.initTicker({
     mountSelector: '#franchise-news-ticker',
     categories: ['Trade press and industry news', 'Big portals, directories, and lead-gen sites'],
     tickerSpeed: 90,
     pauseOnHover: true
   });

   // Feed (vertical embeddable widget)
   window.FranchiseNewsWidget.initFeed({
     mountSelector: '#franchise-news-feed',
     layout: 'list',
     maxItems: 10,
     categories: ['Trade press and industry news']
   });

   ============================================================================ */

(function() {
  'use strict';

  // Import news service (works with ES6 modules or global)
  const newsService = window.FranchiseNewsService;
  const NEWS_CATEGORIES = window.NEWS_CATEGORIES;

  /* ==========================================================================
     UTILITY FUNCTIONS
     ========================================================================== */

  /**
   * Get category CSS class for styling
   */
  function getCategoryClass(category) {
    const categoryMap = {
      [NEWS_CATEGORIES.TRADE_PRESS]: 'trade-press',
      [NEWS_CATEGORIES.BIG_PORTALS]: 'big-portals',
      [NEWS_CATEGORIES.RESEARCH]: 'research',
      [NEWS_CATEGORIES.ASSOCIATIONS]: 'associations',
      [NEWS_CATEGORIES.CONSULTANTS]: 'consultants'
    };
    return categoryMap[category] || 'default';
  }

  /**
   * Get short category label for display
   */
  function getShortCategoryLabel(category) {
    const labelMap = {
      [NEWS_CATEGORIES.TRADE_PRESS]: 'Trade Press',
      [NEWS_CATEGORIES.BIG_PORTALS]: 'Directory',
      [NEWS_CATEGORIES.RESEARCH]: 'Research',
      [NEWS_CATEGORIES.ASSOCIATIONS]: 'Association',
      [NEWS_CATEGORIES.CONSULTANTS]: 'Consultant'
    };
    return labelMap[category] || 'News';
  }

  /* ==========================================================================
     NEWS TICKER (Mode A - Horizontal Scrolling)
     ========================================================================== */

  class NewsTickerWidget {
    constructor(config) {
      this.config = {
        mountSelector: config.mountSelector || '#franchise-news-ticker',
        categories: config.categories || [],
        sources: config.sources || [],
        tickerSpeed: config.tickerSpeed || 90,
        pauseOnHover: config.pauseOnHover !== false,
        showLabel: config.showLabel !== false,
        labelText: config.labelText || 'Franchise News',
        labelIcon: config.labelIcon || '📰',
        theme: config.theme || {}
      };

      this.articles = [];
      this.container = null;
    }

    /**
     * Initialize the ticker widget
     */
    async init() {
      try {
        // Get container element
        this.container = document.querySelector(this.config.mountSelector);
        if (!this.container) {
          console.error(`[NewsTickerWidget] Container not found: ${this.config.mountSelector}`);
          return;
        }

        // Fetch articles
        this.articles = await newsService.getArticles({
          categories: this.config.categories,
          sources: this.config.sources,
          days: 30 // Last 30 days
        });

        // Render ticker
        this.render();

        // Apply theme customizations
        this.applyTheme();

        console.log(`[NewsTickerWidget] Initialized with ${this.articles.length} articles`);
      } catch (error) {
        console.error('[NewsTickerWidget] Initialization error:', error);
        this.renderError();
      }
    }

    /**
     * Render the ticker HTML
     */
    render() {
      if (this.articles.length === 0) {
        this.renderEmpty();
        return;
      }

      // Build ticker HTML structure
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'fiq-news-ticker-wrapper';

      // Add label bar (optional)
      if (this.config.showLabel) {
        const labelDiv = document.createElement('div');
        labelDiv.className = 'fiq-news-ticker-label';
        labelDiv.innerHTML = `
          <div class="fiq-news-ticker-label-text">
            <span class="fiq-news-ticker-label-icon">${this.config.labelIcon}</span>
            <span>${this.config.labelText}</span>
          </div>
          <div class="fiq-news-ticker-label-source">
            Live Updates
          </div>
        `;
        wrapperDiv.appendChild(labelDiv);
      }

      // Add ticker container
      const tickerContainer = document.createElement('div');
      tickerContainer.className = 'fiq-news-ticker-container';

      const tickerContent = document.createElement('div');
      tickerContent.className = 'fiq-news-ticker-content';

      // Duplicate animation speed customization
      if (this.config.tickerSpeed !== 90) {
        tickerContent.style.animationDuration = `${this.config.tickerSpeed}s`;
      }

      // Disable pause on hover if configured
      if (!this.config.pauseOnHover) {
        tickerContent.style.animationPlayState = 'running';
        tickerContent.addEventListener('mouseenter', (e) => {
          e.currentTarget.style.animationPlayState = 'running';
        });
      }

      // Create ticker items (duplicate for seamless loop)
      const tickerHTML = this.articles.map(article => this.createTickerItem(article)).join('');
      tickerContent.innerHTML = tickerHTML + tickerHTML; // Duplicate for seamless scroll

      tickerContainer.appendChild(tickerContent);
      wrapperDiv.appendChild(tickerContainer);

      // Mount to DOM
      this.container.innerHTML = '';
      this.container.appendChild(wrapperDiv);
    }

    /**
     * Create a single ticker item HTML
     */
    createTickerItem(article) {
      return `
        <div class="fiq-news-ticker-item">
          <span class="fiq-news-ticker-headline">
            <a href="${article.url}" target="_blank" rel="noopener noreferrer">
              ${article.title}
            </a>
          </span>
          <span class="fiq-news-ticker-source">${article.shortSourceLabel}</span>
        </div>
      `;
    }

    /**
     * Apply theme customizations
     */
    applyTheme() {
      if (!this.config.theme || Object.keys(this.config.theme).length === 0) {
        return;
      }

      const wrapper = this.container.querySelector('.fiq-news-ticker-wrapper');
      if (!wrapper) return;

      const theme = this.config.theme;

      if (theme.backgroundColor) {
        wrapper.style.backgroundColor = theme.backgroundColor;
      }
      if (theme.textColor) {
        wrapper.style.color = theme.textColor;
      }
      if (theme.fontSize) {
        const items = wrapper.querySelectorAll('.fiq-news-ticker-headline');
        items.forEach(item => item.style.fontSize = theme.fontSize);
      }
    }

    /**
     * Render empty state
     */
    renderEmpty() {
      this.container.innerHTML = `
        <div class="fiq-news-ticker-wrapper">
          <div class="fiq-news-ticker-container">
            <div style="padding: 15px 20px; color: #999; font-size: 14px;">
              No news articles available
            </div>
          </div>
        </div>
      `;
    }

    /**
     * Render error state
     */
    renderError() {
      this.container.innerHTML = `
        <div class="fiq-news-ticker-wrapper">
          <div class="fiq-news-ticker-container">
            <div style="padding: 15px 20px; color: #ff4444; font-size: 14px;">
              Error loading news feed
            </div>
          </div>
        </div>
      `;
    }
  }

  /* ==========================================================================
     NEWS FEED (Mode B - Vertical List)
     ========================================================================== */

  class NewsFeedWidget {
    constructor(config) {
      this.config = {
        mountSelector: config.mountSelector || '#franchise-news-feed',
        categories: config.categories || [],
        sources: config.sources || [],
        maxItems: config.maxItems || 20,
        layout: config.layout || 'list', // 'list' or 'compact'
        showHeader: config.showHeader !== false,
        headerTitle: config.headerTitle || '📰 Latest Franchise News',
        headerSubtitle: config.headerSubtitle || 'Industry updates from leading sources',
        showCategory: config.showCategory !== false,
        showDate: config.showDate !== false,
        theme: config.theme || {}
      };

      this.articles = [];
      this.container = null;
    }

    /**
     * Initialize the feed widget
     */
    async init() {
      try {
        // Get container element
        this.container = document.querySelector(this.config.mountSelector);
        if (!this.container) {
          console.error(`[NewsFeedWidget] Container not found: ${this.config.mountSelector}`);
          return;
        }

        // Show loading state
        this.renderLoading();

        // Fetch articles
        this.articles = await newsService.getArticles({
          categories: this.config.categories,
          sources: this.config.sources,
          days: 30, // Last 30 days
          limit: this.config.maxItems
        });

        // Render feed
        this.render();

        // Apply theme customizations
        this.applyTheme();

        console.log(`[NewsFeedWidget] Initialized with ${this.articles.length} articles`);
      } catch (error) {
        console.error('[NewsFeedWidget] Initialization error:', error);
        this.renderError();
      }
    }

    /**
     * Render the feed HTML
     */
    render() {
      if (this.articles.length === 0) {
        this.renderEmpty();
        return;
      }

      // Build feed HTML structure
      const feedDiv = document.createElement('div');
      feedDiv.className = `fiq-news-feed ${this.config.layout}`;

      // Add header (optional)
      if (this.config.showHeader) {
        const headerDiv = document.createElement('div');
        headerDiv.className = 'fiq-news-feed-header';
        headerDiv.innerHTML = `
          <h2 class="fiq-news-feed-title">${this.config.headerTitle}</h2>
          <p class="fiq-news-feed-subtitle">${this.config.headerSubtitle}</p>
        `;
        feedDiv.appendChild(headerDiv);
      }

      // Add items container
      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'fiq-news-feed-items';

      // Create news items
      this.articles.forEach(article => {
        const itemDiv = this.createFeedItem(article);
        itemsDiv.appendChild(itemDiv);
      });

      feedDiv.appendChild(itemsDiv);

      // Mount to DOM
      this.container.innerHTML = '';
      this.container.appendChild(feedDiv);
    }

    /**
     * Create a single feed item element
     */
    createFeedItem(article) {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'fiq-news-item';

      // Title
      const titleDiv = document.createElement('h3');
      titleDiv.className = 'fiq-news-item-title';
      titleDiv.innerHTML = `
        <a href="${article.url}" target="_blank" rel="noopener noreferrer">
          ${article.title}
        </a>
      `;

      // Metadata
      const metaDiv = document.createElement('div');
      metaDiv.className = 'fiq-news-item-meta';

      // Source
      const sourceSpan = document.createElement('span');
      sourceSpan.className = 'fiq-news-item-source';
      sourceSpan.textContent = article.shortSourceLabel;
      metaDiv.appendChild(sourceSpan);

      // Date
      if (this.config.showDate) {
        const dateSpan = document.createElement('span');
        dateSpan.className = 'fiq-news-item-date';
        dateSpan.textContent = newsService.getRelativeTime(article.publishedAt);
        metaDiv.appendChild(dateSpan);
      }

      // Category
      if (this.config.showCategory) {
        const categorySpan = document.createElement('span');
        categorySpan.className = `fiq-news-item-category ${getCategoryClass(article.category)}`;
        categorySpan.textContent = getShortCategoryLabel(article.category);
        metaDiv.appendChild(categorySpan);
      }

      // Assemble item
      itemDiv.appendChild(titleDiv);
      itemDiv.appendChild(metaDiv);

      // Make entire item clickable
      itemDiv.addEventListener('click', (e) => {
        if (e.target.tagName !== 'A') {
          window.open(article.url, '_blank', 'noopener,noreferrer');
        }
      });

      return itemDiv;
    }

    /**
     * Apply theme customizations
     */
    applyTheme() {
      if (!this.config.theme || Object.keys(this.config.theme).length === 0) {
        return;
      }

      const feed = this.container.querySelector('.fiq-news-feed');
      if (!feed) return;

      const theme = this.config.theme;

      if (theme.cardBorderRadius) {
        feed.style.borderRadius = theme.cardBorderRadius;
      }
      if (theme.cardPadding) {
        const items = feed.querySelectorAll('.fiq-news-item');
        items.forEach(item => item.style.padding = theme.cardPadding);
      }
      if (theme.backgroundColor) {
        feed.style.backgroundColor = theme.backgroundColor;
      }
      if (theme.textColor) {
        feed.style.color = theme.textColor;
      }
    }

    /**
     * Render loading state
     */
    renderLoading() {
      this.container.innerHTML = `
        <div class="fiq-news-feed">
          <div class="fiq-news-feed-loading">
            Loading franchise news...
          </div>
        </div>
      `;
    }

    /**
     * Render empty state
     */
    renderEmpty() {
      this.container.innerHTML = `
        <div class="fiq-news-feed">
          ${this.config.showHeader ? `
            <div class="fiq-news-feed-header">
              <h2 class="fiq-news-feed-title">${this.config.headerTitle}</h2>
            </div>
          ` : ''}
          <div class="fiq-news-feed-empty">
            No news articles available
          </div>
        </div>
      `;
    }

    /**
     * Render error state
     */
    renderError() {
      this.container.innerHTML = `
        <div class="fiq-news-feed">
          ${this.config.showHeader ? `
            <div class="fiq-news-feed-header">
              <h2 class="fiq-news-feed-title">${this.config.headerTitle}</h2>
            </div>
          ` : ''}
          <div class="fiq-news-feed-empty" style="color: #ff4444;">
            Error loading news feed. Please try again later.
          </div>
        </div>
      `;
    }
  }

  /* ==========================================================================
     GLOBAL API
     ========================================================================== */

  const FranchiseNewsWidget = {
    /**
     * Initialize a horizontal scrolling news ticker
     *
     * @param {Object} config - Configuration options
     * @param {string} config.mountSelector - DOM selector to mount the ticker
     * @param {Array<string>} config.categories - Filter by categories
     * @param {Array<string>} config.sources - Filter by source IDs
     * @param {number} config.tickerSpeed - Animation speed in seconds (default: 90)
     * @param {boolean} config.pauseOnHover - Pause animation on hover (default: true)
     * @param {boolean} config.showLabel - Show label bar (default: true)
     * @param {string} config.labelText - Custom label text
     * @param {string} config.labelIcon - Custom label icon
     * @param {Object} config.theme - Theme customizations
     * @returns {Promise<NewsTickerWidget>}
     */
    async initTicker(config) {
      const ticker = new NewsTickerWidget(config);
      await ticker.init();
      return ticker;
    },

    /**
     * Initialize a vertical news feed widget
     *
     * @param {Object} config - Configuration options
     * @param {string} config.mountSelector - DOM selector to mount the feed
     * @param {Array<string>} config.categories - Filter by categories
     * @param {Array<string>} config.sources - Filter by source IDs
     * @param {number} config.maxItems - Maximum number of articles (default: 20)
     * @param {string} config.layout - Layout style: 'list' or 'compact' (default: 'list')
     * @param {boolean} config.showHeader - Show header section (default: true)
     * @param {string} config.headerTitle - Custom header title
     * @param {string} config.headerSubtitle - Custom header subtitle
     * @param {boolean} config.showCategory - Show category pills (default: true)
     * @param {boolean} config.showDate - Show published dates (default: true)
     * @param {Object} config.theme - Theme customizations
     * @returns {Promise<NewsFeedWidget>}
     */
    async initFeed(config) {
      const feed = new NewsFeedWidget(config);
      await feed.init();
      return feed;
    },

    /**
     * Get news service instance for custom queries
     * @returns {Object} News service instance
     */
    getNewsService() {
      return newsService;
    },

    /**
     * Get available news categories
     * @returns {Object} Category constants
     */
    getCategories() {
      return NEWS_CATEGORIES;
    }
  };

  // Export to global window object
  window.FranchiseNewsWidget = FranchiseNewsWidget;

  console.log('[FranchiseNewsWidget] Widget API loaded and ready');

})();
