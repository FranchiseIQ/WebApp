// ============================================================================
// STOCK TICKER CONFIGURATION
// Version: 1.1 - CORS Proxy Enabled
// ============================================================================
// Modify this array to add or remove ticker symbols
const TICKER_SYMBOLS = [
  "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK", "CAVA",
  "DENN", "DIN", "DNUT", "NATH", "RRGB",
  "DRVN", "HRB", "CAR", "UHAL",
  "PLNT", "BFT",
  "MAR", "HLT", "H", "CHH", "WH", "VAC", "TNL", "CWH",
  "GNC", "RENT",
  "SERV", "ROL",
  "ADUS",
  "LOPE",
  "PLAY", "ARCO",
  "TAST"
];

// Refresh interval in milliseconds (60 seconds)
const REFRESH_INTERVAL = 60000;

// Cache for last known prices (for offline fallback)
let lastKnownData = {};

// ============================================================================
// YAHOO FINANCE API INTEGRATION
// ============================================================================

/**
 * Fetch live stock quotes from Yahoo Finance API
 * @returns {Promise<Object>} Stock data keyed by symbol
 */
async function fetchStockData() {
  const symbolsParam = TICKER_SYMBOLS.join(',');
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;

  // Use CORS proxy to bypass browser CORS restrictions
  const corsProxy = 'https://api.allorigins.win/raw?url=';
  const url = corsProxy + encodeURIComponent(yahooUrl);

  try {
    console.log('Fetching stock data...');
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    // Check if we got valid data
    if (!data.quoteResponse || !data.quoteResponse.result) {
      throw new Error('Invalid API response structure');
    }

    const quotes = data.quoteResponse.result;
    const stockData = {};

    quotes.forEach(quote => {
      const symbol = quote.symbol;
      const price = quote.regularMarketPrice;
      const change = quote.regularMarketChangePercent;

      stockData[symbol] = {
        symbol: symbol,
        price: price !== undefined && price !== null ? price.toFixed(2) : 'N/A',
        changePercent: change !== undefined && change !== null ? change.toFixed(2) : '–',
        isPositive: change > 0,
        isNegative: change < 0
      };
    });

    // Update cache with successful data
    lastKnownData = stockData;
    console.log(`Successfully fetched data for ${Object.keys(stockData).length} stocks`);
    return stockData;

  } catch (error) {
    console.error('Failed to fetch stock data:', error.message);

    // Return cached data if available, otherwise return fallback
    if (Object.keys(lastKnownData).length > 0) {
      console.info('Using cached stock data');
      return lastKnownData;
    }

    // Return fallback data with N/A values
    console.warn('No cached data available, using fallback');
    return getFallbackData();
  }
}

/**
 * Generate fallback data when API is unavailable
 * @returns {Object} Fallback stock data
 */
function getFallbackData() {
  const fallbackData = {};

  TICKER_SYMBOLS.forEach(symbol => {
    fallbackData[symbol] = {
      symbol: symbol,
      price: 'N/A',
      changePercent: '–',
      isPositive: false,
      isNegative: false
    };
  });

  return fallbackData;
}

// ============================================================================
// DOM MANIPULATION
// ============================================================================

/**
 * Create a ticker item DOM element
 * @param {Object} stockInfo - Stock information object
 * @returns {HTMLElement} Ticker item element
 */
function createTickerItem(stockInfo) {
  const item = document.createElement('div');
  item.className = 'ticker-item';

  const symbol = document.createElement('span');
  symbol.className = 'ticker-symbol';
  symbol.textContent = stockInfo.symbol;

  const price = document.createElement('span');
  price.className = 'ticker-price';
  price.textContent = stockInfo.price;

  const change = document.createElement('span');
  change.className = 'ticker-change';

  if (stockInfo.isPositive) {
    change.classList.add('positive');
    change.textContent = `+${stockInfo.changePercent}%`;
  } else if (stockInfo.isNegative) {
    change.classList.add('negative');
    change.textContent = `${stockInfo.changePercent}%`;
  } else {
    change.classList.add('neutral');
    change.textContent = stockInfo.changePercent === '–' ? '–' : `${stockInfo.changePercent}%`;
  }

  item.appendChild(symbol);
  item.appendChild(price);
  item.appendChild(change);

  return item;
}

/**
 * Render all ticker items to the DOM
 * @param {Object} stockData - Stock data keyed by symbol
 */
function renderTicker(stockData) {
  const tickerContent = document.getElementById('ticker-content');

  // Clear existing content
  tickerContent.innerHTML = '';

  // Create ticker items for each symbol
  TICKER_SYMBOLS.forEach(symbol => {
    const stockInfo = stockData[symbol];
    if (stockInfo) {
      const item = createTickerItem(stockInfo);
      tickerContent.appendChild(item);
    }
  });

  // Duplicate items for seamless scrolling
  TICKER_SYMBOLS.forEach(symbol => {
    const stockInfo = stockData[symbol];
    if (stockInfo) {
      const item = createTickerItem(stockInfo);
      tickerContent.appendChild(item);
    }
  });
}

/**
 * Update the ticker with fresh data
 */
async function updateTicker() {
  const stockData = await fetchStockData();
  renderTicker(stockData);
  resetCountdown(); // Reset countdown after refresh
}

// ============================================================================
// CLOCK AND STATUS MANAGEMENT
// ============================================================================

// Countdown tracking
let countdownSeconds = 60;
let countdownInterval = null;

/**
 * Get current Eastern Time
 * @returns {Date} Current time in ET
 */
function getEasternTime() {
  const now = new Date();
  // Convert to Eastern Time (handles EST/EDT automatically)
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

/**
 * Format time as 12-hour clock with AM/PM
 * @param {Date} date - Date object
 * @returns {string} Formatted time string
 */
function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  return `${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Check if US stock market is open
 * @param {Date} etTime - Current Eastern Time
 * @returns {boolean} True if market is open
 */
function isMarketOpen(etTime) {
  const day = etTime.getDay(); // 0 = Sunday, 6 = Saturday

  // Market closed on weekends
  if (day === 0 || day === 6) {
    return false;
  }

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Market hours: 9:30 AM to 4:00 PM ET
  const marketOpen = 9 * 60 + 30;  // 9:30 AM
  const marketClose = 16 * 60;      // 4:00 PM

  return timeInMinutes >= marketOpen && timeInMinutes < marketClose;
}

/**
 * Update clock display
 */
function updateClock() {
  const etTime = getEasternTime();
  const clockElement = document.getElementById('clock');
  const indicatorElement = document.getElementById('market-indicator');
  const labelElement = document.getElementById('market-label');

  if (clockElement) {
    clockElement.textContent = formatTime(etTime);
  }

  // Update market status
  const marketOpen = isMarketOpen(etTime);

  if (indicatorElement && labelElement) {
    if (marketOpen) {
      indicatorElement.className = 'open';
      labelElement.textContent = 'Market Open';
    } else {
      indicatorElement.className = 'closed';
      labelElement.textContent = 'Market Closed';
    }
  }
}

/**
 * Update countdown timer
 */
function updateCountdown() {
  const countdownElement = document.getElementById('countdown');

  if (countdownElement) {
    countdownElement.textContent = `${countdownSeconds}s`;
  }

  countdownSeconds--;

  // When countdown reaches 0, it will be reset by the refresh
  if (countdownSeconds < 0) {
    countdownSeconds = 0;
  }
}

/**
 * Reset countdown to 60 seconds
 */
function resetCountdown() {
  countdownSeconds = 60;
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = '60s';
  }
}

/**
 * Start all timers (clock and countdown)
 */
function startTimers() {
  // Update clock immediately
  updateClock();

  // Update clock every second
  setInterval(updateClock, 1000);

  // Start countdown immediately
  updateCountdown();

  // Update countdown every second
  setInterval(updateCountdown, 1000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the ticker widget
 */
function init() {
  // Start clock and countdown timers
  startTimers();

  // Initial load
  updateTicker();

  // Auto-refresh every 60 seconds (synced with countdown)
  setInterval(updateTicker, REFRESH_INTERVAL);
}

// Start the ticker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
