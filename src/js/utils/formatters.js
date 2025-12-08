/**
 * FranResearch Formatting Utilities
 * Shared formatting functions for consistent data display
 */

const Formatters = {
  /**
   * Format a number as currency
   * @param {number} value - The value to format
   * @param {string} currency - Currency code (default: USD)
   * @param {number} decimals - Decimal places (default: 2)
   * @returns {string} Formatted currency string
   */
  currency(value, currency = 'USD', decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  },

  /**
   * Format a number with commas and decimals
   * @param {number} value - The value to format
   * @param {number} decimals - Decimal places (default: 2)
   * @returns {string} Formatted number string
   */
  number(value, decimals = 2) {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  },

  /**
   * Format a percentage value
   * @param {number} value - The percentage value (e.g., 0.05 for 5%)
   * @param {number} decimals - Decimal places (default: 2)
   * @param {boolean} includeSign - Include +/- sign (default: true)
   * @returns {string} Formatted percentage string
   */
  percent(value, decimals = 2, includeSign = true) {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }
    const formatted = Math.abs(value).toFixed(decimals);
    const sign = includeSign ? (value >= 0 ? '+' : '-') : (value < 0 ? '-' : '');
    return `${sign}${formatted}%`;
  },

  /**
   * Format a large number with abbreviations (K, M, B, T)
   * @param {number} value - The value to format
   * @param {number} decimals - Decimal places (default: 1)
   * @returns {string} Formatted abbreviated number
   */
  abbreviate(value, decimals = 1) {
    if (value === null || value === undefined || isNaN(value)) {
      return '--';
    }

    const abbreviations = [
      { threshold: 1e12, suffix: 'T' },
      { threshold: 1e9, suffix: 'B' },
      { threshold: 1e6, suffix: 'M' },
      { threshold: 1e3, suffix: 'K' }
    ];

    for (const { threshold, suffix } of abbreviations) {
      if (Math.abs(value) >= threshold) {
        return (value / threshold).toFixed(decimals) + suffix;
      }
    }

    return value.toFixed(decimals);
  },

  /**
   * Format a date object or string
   * @param {Date|string} date - The date to format
   * @param {string} format - Format type: 'short', 'long', 'time', 'datetime'
   * @returns {string} Formatted date string
   */
  date(date, format = 'short') {
    if (!date) return '--';

    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '--';

    const options = {
      short: { month: 'short', day: 'numeric', year: 'numeric' },
      long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
      time: { hour: 'numeric', minute: '2-digit', hour12: true },
      datetime: { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }
    };

    return new Intl.DateTimeFormat('en-US', options[format] || options.short).format(d);
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   * @param {Date|string} date - The date to format
   * @returns {string} Relative time string
   */
  relativeTime(date) {
    if (!date) return '--';

    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '--';

    const now = new Date();
    const diffMs = now - d;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;

    return this.date(d, 'short');
  },

  /**
   * Format a stock ticker symbol
   * @param {string} symbol - The ticker symbol
   * @returns {string} Formatted ticker symbol
   */
  ticker(symbol) {
    if (!symbol) return '--';
    return symbol.toUpperCase().trim();
  },

  /**
   * Format price change with arrow indicator
   * @param {number} change - The price change value
   * @param {number} changePercent - The percentage change
   * @returns {object} Object with text and className
   */
  priceChange(change, changePercent) {
    if (change === null || change === undefined || isNaN(change)) {
      return { text: '--', className: 'neutral' };
    }

    const arrow = change >= 0 ? '▲' : '▼';
    const sign = change >= 0 ? '+' : '';
    const text = `${arrow} ${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
    const className = change >= 0 ? 'positive' : 'negative';

    return { text, className };
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Formatters;
}
if (typeof window !== 'undefined') {
  window.Formatters = Formatters;
}
