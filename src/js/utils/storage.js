/**
 * FranResearch Storage Utilities
 * Helper functions for localStorage and sessionStorage with expiration
 */

const Storage = {
  /**
   * Default expiration time (1 hour)
   */
  DEFAULT_EXPIRATION: 3600000,

  /**
   * Set an item in localStorage with optional expiration
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be JSON stringified)
   * @param {number} expirationMs - Expiration time in milliseconds
   */
  set(key, value, expirationMs = this.DEFAULT_EXPIRATION) {
    try {
      const item = {
        value: value,
        timestamp: Date.now(),
        expiration: expirationMs
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (e) {
      console.warn('Storage.set failed:', e.message);
    }
  },

  /**
   * Get an item from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found or expired
   * @returns {*} The stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return defaultValue;

      const item = JSON.parse(itemStr);

      // Check for expiration
      if (item.expiration && (Date.now() - item.timestamp) > item.expiration) {
        this.remove(key);
        return defaultValue;
      }

      return item.value;
    } catch (e) {
      console.warn('Storage.get failed:', e.message);
      return defaultValue;
    }
  },

  /**
   * Check if a cached item exists and is valid
   * @param {string} key - Storage key
   * @returns {boolean} True if valid cache exists
   */
  has(key) {
    return this.get(key) !== null;
  },

  /**
   * Remove an item from localStorage
   * @param {string} key - Storage key
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage.remove failed:', e.message);
    }
  },

  /**
   * Clear all items with a specific prefix
   * @param {string} prefix - Key prefix to match
   */
  clearPrefix(prefix) {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(prefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Storage.clearPrefix failed:', e.message);
    }
  },

  /**
   * Clear all FranResearch cache
   */
  clearAll() {
    this.clearPrefix('franresearch_');
  },

  /**
   * Get all keys with a specific prefix
   * @param {string} prefix - Key prefix to match
   * @returns {string[]} Array of matching keys
   */
  keys(prefix = '') {
    try {
      return Object.keys(localStorage).filter(key => key.startsWith(prefix));
    } catch (e) {
      console.warn('Storage.keys failed:', e.message);
      return [];
    }
  },

  /**
   * Get storage usage statistics
   * @returns {object} Storage usage info
   */
  usage() {
    try {
      let totalSize = 0;
      let itemCount = 0;

      for (const key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length + key.length;
          itemCount++;
        }
      }

      return {
        itemCount,
        totalSizeBytes: totalSize * 2, // UTF-16
        totalSizeKB: ((totalSize * 2) / 1024).toFixed(2)
      };
    } catch (e) {
      console.warn('Storage.usage failed:', e.message);
      return { itemCount: 0, totalSizeBytes: 0, totalSizeKB: '0.00' };
    }
  },

  /**
   * Session storage wrapper - set
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  sessionSet(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage.sessionSet failed:', e.message);
    }
  },

  /**
   * Session storage wrapper - get
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} The stored value or default
   */
  sessionGet(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn('Storage.sessionGet failed:', e.message);
      return defaultValue;
    }
  },

  /**
   * Session storage wrapper - remove
   * @param {string} key - Storage key
   */
  sessionRemove(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {
      console.warn('Storage.sessionRemove failed:', e.message);
    }
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Storage;
}
if (typeof window !== 'undefined') {
  window.Storage = Storage;
}
