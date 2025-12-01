/**
 * FranResearch Utilities Index
 * Single import point for all utility modules
 */

// Import all utilities
// These are loaded via script tags in the HTML, so they're already on window

const FranResearch = {
  // Version info
  version: '1.0.0',

  // Utilities
  get Formatters() { return window.Formatters; },
  get DOM() { return window.DOM; },
  get Storage() { return window.Storage; },
  get MarketUtils() { return window.MarketUtils; },

  // Services
  get DataService() { return window.DataService; },

  // Configuration
  get config() { return window.APP_CONFIG; },

  /**
   * Initialize all utilities
   * Call this after all script files are loaded
   */
  init() {
    console.log(`FranResearch v${this.version} initialized`);

    // Set up global error handler
    window.addEventListener('error', (e) => {
      console.error('FranResearch Error:', e.message);
    });

    // Set up unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
      console.error('FranResearch Unhandled Promise:', e.reason);
    });

    return this;
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FranResearch;
}
if (typeof window !== 'undefined') {
  window.FranResearch = FranResearch;
}
