/**
 * FranResearch DOM Utilities
 * Helper functions for DOM manipulation and event handling
 */

const DOM = {
  /**
   * Query a single element
   * @param {string} selector - CSS selector
   * @param {Element} context - Parent context (default: document)
   * @returns {Element|null} The matched element
   */
  $(selector, context = document) {
    return context.querySelector(selector);
  },

  /**
   * Query multiple elements
   * @param {string} selector - CSS selector
   * @param {Element} context - Parent context (default: document)
   * @returns {Element[]} Array of matched elements
   */
  $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
  },

  /**
   * Create an element with attributes and children
   * @param {string} tag - HTML tag name
   * @param {object} attrs - Attributes to set
   * @param {(string|Element)[]} children - Child elements or text
   * @returns {Element} The created element
   */
  create(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key === 'style' && typeof value === 'object') {
        Object.assign(el.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }

    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Element) {
        el.appendChild(child);
      }
    }

    return el;
  },

  /**
   * Add event listener with optional delegation
   * @param {Element|string} target - Element or selector
   * @param {string} event - Event type
   * @param {Function} handler - Event handler
   * @param {string} delegateSelector - Optional delegation selector
   */
  on(target, event, handler, delegateSelector = null) {
    const el = typeof target === 'string' ? this.$(target) : target;
    if (!el) return;

    if (delegateSelector) {
      el.addEventListener(event, (e) => {
        const delegateTarget = e.target.closest(delegateSelector);
        if (delegateTarget && el.contains(delegateTarget)) {
          handler.call(delegateTarget, e, delegateTarget);
        }
      });
    } else {
      el.addEventListener(event, handler);
    }
  },

  /**
   * Debounce a function
   * @param {Function} fn - Function to debounce
   * @param {number} delay - Delay in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(fn, delay = 150) {
    let timeoutId;
    return function(...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  },

  /**
   * Throttle a function
   * @param {Function} fn - Function to throttle
   * @param {number} limit - Minimum interval in milliseconds
   * @returns {Function} Throttled function
   */
  throttle(fn, limit = 100) {
    let inThrottle = false;
    return function(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Show an element
   * @param {Element|string} el - Element or selector
   * @param {string} display - Display value (default: 'block')
   */
  show(el, display = 'block') {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (element) element.style.display = display;
  },

  /**
   * Hide an element
   * @param {Element|string} el - Element or selector
   */
  hide(el) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (element) element.style.display = 'none';
  },

  /**
   * Toggle element visibility
   * @param {Element|string} el - Element or selector
   * @param {boolean} force - Force show/hide
   */
  toggle(el, force) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (!element) return;

    const isHidden = element.style.display === 'none' ||
                     getComputedStyle(element).display === 'none';

    if (force !== undefined) {
      element.style.display = force ? 'block' : 'none';
    } else {
      element.style.display = isHidden ? 'block' : 'none';
    }
  },

  /**
   * Add/remove/toggle classes
   * @param {Element|string} el - Element or selector
   * @param {string} className - Class name(s) to modify
   * @param {string} action - 'add', 'remove', or 'toggle'
   */
  classList(el, className, action = 'toggle') {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (!element) return;

    const classes = className.split(' ').filter(Boolean);
    classes.forEach(cls => element.classList[action](cls));
  },

  /**
   * Set HTML content safely
   * @param {Element|string} el - Element or selector
   * @param {string} html - HTML content
   */
  html(el, html) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (element) element.innerHTML = html;
  },

  /**
   * Set text content
   * @param {Element|string} el - Element or selector
   * @param {string} text - Text content
   */
  text(el, text) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (element) element.textContent = text;
  },

  /**
   * Wait for DOM ready
   * @param {Function} fn - Callback function
   */
  ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  },

  /**
   * Animate element with CSS transitions
   * @param {Element|string} el - Element or selector
   * @param {object} styles - CSS properties to animate
   * @param {number} duration - Duration in ms
   * @returns {Promise} Resolves when animation completes
   */
  animate(el, styles, duration = 200) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (!element) return Promise.resolve();

    return new Promise((resolve) => {
      element.style.transition = `all ${duration}ms ease`;
      Object.assign(element.style, styles);

      setTimeout(() => {
        element.style.transition = '';
        resolve();
      }, duration);
    });
  },

  /**
   * Scroll element into view smoothly
   * @param {Element|string} el - Element or selector
   * @param {object} options - ScrollIntoView options
   */
  scrollTo(el, options = {}) {
    const element = typeof el === 'string' ? this.$(el) : el;
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
        ...options
      });
    }
  }
};

// Export for both ES modules and global scope
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DOM;
}
if (typeof window !== 'undefined') {
  window.DOM = DOM;
}
