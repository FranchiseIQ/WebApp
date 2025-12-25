/**
 * FranResearch Market Utilities
 * Helper functions for market hours and status
 */

const MarketUtils = {
  /**
   * Market configuration
   */
  config: {
    timezone: 'America/New_York',
    openHour: 9,
    openMinute: 30,
    closeHour: 16,
    closeMinute: 0,
    earlyCloseHour: 13,
    earlyCloseMinute: 0,
    preMarketStart: 4,
    afterHoursEnd: 20,
    holidays: [
      // 2024 US Market Holidays
      '2024-01-01', '2024-01-15', '2024-02-19', '2024-03-29',
      '2024-05-27', '2024-06-19', '2024-07-04', '2024-09-02',
      '2024-11-28', '2024-12-25',
      // 2025 US Market Holidays
      '2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18',
      '2025-05-26', '2025-06-19', '2025-07-04', '2025-09-01',
      '2025-11-27', '2025-12-25',
      // 2026 US Market Holidays
      '2026-07-03'
    ],
    earlyCloseDays: [
      // 2024 Early-Close Days (1:00 PM ET)
      '2024-07-03',
      '2024-11-29',
      '2024-12-24',
      // 2025 Early-Close Days (1:00 PM ET)
      '2025-07-03',
      '2025-11-28',
      '2025-12-24',
      // 2026 Early-Close Days (1:00 PM ET)
      '2026-07-02',
      '2026-11-27',
      '2026-12-24'
    ]
  },

  /**
   * Get current time in Eastern timezone
   * @returns {Date} Current time in ET
   */
  getEasternTime() {
    return new Date(new Date().toLocaleString('en-US', { timeZone: this.config.timezone }));
  },

  /**
   * Format time for Eastern timezone display
   * @param {Date} date - Date to format (optional, defaults to now)
   * @returns {string} Formatted time string (e.g., "9:30:45 AM")
   */
  formatEasternTime(date = new Date()) {
    return date.toLocaleTimeString('en-US', {
      timeZone: this.config.timezone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  },

  /**
   * Check if today is a market holiday
   * @param {Date} date - Date to check (optional, defaults to today)
   * @returns {boolean} True if holiday
   */
  isHoliday(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return this.config.holidays.includes(dateStr);
  },

  /**
   * Check if today is an early-close day (1:00 PM ET)
   * @param {Date} date - Date to check (optional, defaults to today)
   * @returns {boolean} True if early-close day
   */
  isEarlyClose(date = new Date()) {
    const dateStr = date.toISOString().split('T')[0];
    return this.config.earlyCloseDays.includes(dateStr);
  },

  /**
   * Check if it's a weekend
   * @param {Date} date - Date to check (optional, defaults to today)
   * @returns {boolean} True if weekend
   */
  isWeekend(date = new Date()) {
    const day = date.getDay();
    return day === 0 || day === 6;
  },

  /**
   * Check if market is currently open
   * @returns {boolean} True if market is open
   */
  isMarketOpen() {
    const now = this.getEasternTime();

    if (this.isWeekend(now) || this.isHoliday(now)) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = this.config.openHour * 60 + this.config.openMinute;

    // Determine close time based on whether it's an early-close day
    const closeHour = this.isEarlyClose(now) ? this.config.earlyCloseHour : this.config.closeHour;
    const closeMinute = this.isEarlyClose(now) ? this.config.earlyCloseMinute : this.config.closeMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  },

  /**
   * Check if it's pre-market hours
   * @returns {boolean} True if pre-market
   */
  isPreMarket() {
    const now = this.getEasternTime();

    if (this.isWeekend(now) || this.isHoliday(now)) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const preMarketMinutes = this.config.preMarketStart * 60;
    const openMinutes = this.config.openHour * 60 + this.config.openMinute;

    return currentMinutes >= preMarketMinutes && currentMinutes < openMinutes;
  },

  /**
   * Check if it's after-hours trading
   * @returns {boolean} True if after-hours
   */
  isAfterHours() {
    const now = this.getEasternTime();

    if (this.isWeekend(now) || this.isHoliday(now)) {
      return false;
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // Determine close time based on whether it's an early-close day
    const closeHour = this.isEarlyClose(now) ? this.config.earlyCloseHour : this.config.closeHour;
    const closeMinute = this.isEarlyClose(now) ? this.config.earlyCloseMinute : this.config.closeMinute;
    const closeMinutes = closeHour * 60 + closeMinute;

    const afterHoursEndMinutes = this.config.afterHoursEnd * 60;

    return currentMinutes >= closeMinutes && currentMinutes < afterHoursEndMinutes;
  },

  /**
   * Get comprehensive market status
   * @returns {object} Market status with details
   */
  getMarketStatus() {
    const now = this.getEasternTime();
    const isWeekend = this.isWeekend(now);
    const isHoliday = this.isHoliday(now);
    const isEarlyClose = this.isEarlyClose(now);
    const isOpen = this.isMarketOpen();
    const isPreMarket = this.isPreMarket();
    const isAfterHours = this.isAfterHours();

    let status, label, indicator;

    if (isWeekend) {
      status = 'closed';
      label = 'Weekend - Market Closed';
      indicator = 'closed';
    } else if (isHoliday) {
      status = 'closed';
      label = 'Holiday - Market Closed';
      indicator = 'closed';
    } else if (isOpen && isEarlyClose) {
      status = 'open';
      label = 'Market Open - Early Close 1:00 PM ET';
      indicator = 'early-close';
    } else if (isOpen) {
      status = 'open';
      label = 'Market Open';
      indicator = 'open';
    } else if (isPreMarket) {
      status = 'pre-market';
      label = 'Pre-Market Trading';
      indicator = 'pre-market';
    } else if (isAfterHours) {
      status = 'after-hours';
      label = 'After-Hours Trading';
      indicator = 'after-hours';
    } else {
      status = 'closed';
      label = 'Market Closed';
      indicator = 'closed';
    }

    return {
      status,
      label,
      indicator,
      isOpen,
      isPreMarket,
      isAfterHours,
      isWeekend,
      isHoliday,
      isEarlyClose,
      currentTime: this.formatEasternTime(now),
      timezone: 'ET'
    };
  },

  /**
   * Get time until market opens
   * @returns {object} Time until open in hours and minutes
   */
  getTimeUntilOpen() {
    const now = this.getEasternTime();
    const openTime = new Date(now);
    openTime.setHours(this.config.openHour, this.config.openMinute, 0, 0);

    // If market already opened today or it's weekend/holiday, get next trading day
    if (now >= openTime || this.isWeekend(now) || this.isHoliday(now)) {
      openTime.setDate(openTime.getDate() + 1);

      // Skip weekends
      while (openTime.getDay() === 0 || openTime.getDay() === 6) {
        openTime.setDate(openTime.getDate() + 1);
      }

      openTime.setHours(this.config.openHour, this.config.openMinute, 0, 0);
    }

    const diffMs = openTime - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, openTime };
  },

  /**
   * Get time until market closes
   * @returns {object} Time until close in hours and minutes
   */
  getTimeUntilClose() {
    if (!this.isMarketOpen()) {
      return { hours: 0, minutes: 0, closeTime: null };
    }

    const now = this.getEasternTime();
    const closeTime = new Date(now);

    // Determine close time based on whether it's an early-close day
    const closeHour = this.isEarlyClose(now) ? this.config.earlyCloseHour : this.config.closeHour;
    const closeMinute = this.isEarlyClose(now) ? this.config.earlyCloseMinute : this.config.closeMinute;

    closeTime.setHours(closeHour, closeMinute, 0, 0);

    const diffMs = closeTime - now;
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return { hours, minutes, closeTime };
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MarketUtils;
}
if (typeof window !== 'undefined') {
  window.MarketUtils = MarketUtils;
}
