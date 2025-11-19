// ============================================================================
// STOCK TICKER CONFIGURATION
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
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsParam}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();
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
    return stockData;

  } catch (error) {
    console.warn('Failed to fetch stock data:', error.message);

    // Return cached data if available, otherwise return fallback
    if (Object.keys(lastKnownData).length > 0) {
      console.info('Using cached stock data');
      return lastKnownData;
    }

    // Return fallback data with N/A values
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
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the ticker widget
 */
function init() {
  // Initial load
  updateTicker();

  // Auto-refresh every 60 seconds
  setInterval(updateTicker, REFRESH_INTERVAL);
}

// Start the ticker when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
