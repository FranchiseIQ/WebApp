// ============================================================================
// STOCK TICKER CONFIGURATION
// Version: 1.1 - CORS Proxy Enabled
// ============================================================================
// Modify this array to add or remove ticker symbols
const TICKER_SYMBOLS = [
  "MCD", "YUM", "QSR", "WEN", "DPZ", "JACK", "WING", "SHAK",
  "DENN", "DIN", "DNUT", "NATH", "RRGB",
  "DRVN", "HRB", "MCW", "SERV", "ROL",
  "PLNT", "BFT",
  "MAR", "HLT", "H", "CHH", "WH", "VAC", "TNL",
  "RENT", "GNC",
  "ADUS", "LOPE",
  "PLAY", "ARCO",
  "TAST"
];

// Refresh interval in milliseconds (1 hour = 3600 seconds)
const REFRESH_INTERVAL = 3600000; // 1 hour

// Cache for last known prices (for offline fallback)
let lastKnownData = {};
let lastMarketData = {}; // Store last market close data for after-hours
let historicalSnapshots = null; // { symbol: { latest, previous, previousDate } }

// Load cached data from localStorage on initialization
try {
  const cached = localStorage.getItem('franresearch_ticker_cache');
  if (cached) {
    lastKnownData = JSON.parse(cached);
    console.log('Loaded cached data from localStorage');
  }
} catch (e) {
  console.error('Failed to load cache from localStorage:', e);
}

// ============================================================================
// LOCAL HISTORICAL CACHE (CSV)
// ============================================================================

async function loadHistoricalSnapshots() {
  if (historicalSnapshots) {
    return historicalSnapshots;
  }

  const csvUrl = new URL('../data/franchise_stocks.csv', window.location.href).toString();

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`CSV fetch failed with status ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    if (lines.length < 3) {
      throw new Error('CSV missing enough rows for snapshot calculation');
    }

    const snapshots = {};
    // iterate newest to oldest
    for (let i = lines.length - 1; i >= 1; i--) {
      const [date, symbol, open, high, low, close, adjClose] = lines[i].split(',');
      const price = parseFloat(adjClose || close);
      if (!symbol || isNaN(price)) continue;

      if (!snapshots[symbol]) {
        snapshots[symbol] = { latest: price, latestDate: date, previous: null, previousDate: null };
      } else if (!snapshots[symbol].previous) {
        snapshots[symbol].previous = price;
        snapshots[symbol].previousDate = date;
      }
    }

    historicalSnapshots = snapshots;
    return snapshots;
  } catch (error) {
    console.warn('Unable to load historical CSV snapshots:', error);
    historicalSnapshots = {};
    return historicalSnapshots;
  }
}

// ============================================================================
// FINNHUB LIVE DATA INTEGRATION
// ============================================================================

/**
 * Fetch live stock data from Finnhub (updated hourly by GitHub Actions)
 * @returns {Promise<Object>} Stock data keyed by symbol
 */
async function fetchLiveTickerData() {
  try {
    console.log('Fetching live ticker data from Finnhub...');
    const response = await fetch('data/live_ticker.json');

    if (!response.ok) {
      throw new Error(`Failed to fetch live ticker: ${response.status}`);
    }

    const data = await response.json();

    if (!data.quotes || Object.keys(data.quotes).length === 0) {
      throw new Error('Live ticker data is empty');
    }

    // Transform Finnhub format to ticker format
    const stockData = {};
    const snapshots = await loadHistoricalSnapshots();

    for (const [symbol, quote] of Object.entries(data.quotes)) {
      let changePercent = quote.changePercent;

      const snapshot = snapshots[symbol];
      if (snapshot && snapshot.previous && snapshot.latest) {
        changePercent = ((snapshot.latest - snapshot.previous) / snapshot.previous) * 100;
      }

      stockData[symbol] = {
        symbol: quote.symbol,
        price: quote.price.toFixed(2),
        changePercent: Number.isFinite(changePercent) ? changePercent.toFixed(2) : '–',
        isPositive: changePercent > 0,
        isNegative: changePercent < 0,
        afterHours: false,
        source: 'finnhub',
        fetchedAt: data.fetchedAt
      };
    }

    console.log(`✓ Loaded ${Object.keys(stockData).length} live quotes from Finnhub`);
    console.log(`  Last updated: ${data.fetchedAt}`);
    return stockData;

  } catch (error) {
    console.error('Failed to fetch live ticker data:', error);
    return {};
  }
}

// ============================================================================
// CSV DATA INTEGRATION (FOR CHART HISTORICAL DATA)
// ============================================================================

/**
 * Fetch stock data from local CSV file (populated by GitHub Actions)
 * This is used primarily for the chart's historical data, not the ticker
 * @returns {Promise<Object>} Stock data keyed by symbol
 */
async function fetchStockDataFromCSV() {
  try {
    console.log('Fetching stock data from CSV...');
    const response = await fetch('data/franchise_stocks.csv');

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid');
    }

    // Parse CSV header
    const headers = lines[0].split(',');

    // Build map of most recent data for each symbol
    const stockData = {};
    const snapshots = {};

    // Process lines in reverse (most recent first)
    for (let i = lines.length - 1; i >= 1; i--) {
      const values = lines[i].split(',');

      if (values.length < headers.length) continue;

      const date = values[0];
      const symbol = values[1];
      const close = parseFloat(values[5]); // adjClose column

      if (!symbol || isNaN(close)) continue;

      if (!snapshots[symbol]) {
        snapshots[symbol] = { latest: close, latestDate: date, previous: null, previousDate: null };
      } else if (!snapshots[symbol].previous) {
        snapshots[symbol].previous = close;
        snapshots[symbol].previousDate = date;
      }
    }

    Object.entries(snapshots).forEach(([symbol, snapshot]) => {
      const changePercent = snapshot.previous
        ? ((snapshot.latest - snapshot.previous) / snapshot.previous) * 100
        : 0;

      stockData[symbol] = {
        symbol: symbol,
        price: snapshot.latest.toFixed(2),
        changePercent: Number.isFinite(changePercent) ? changePercent.toFixed(2) : '–',
        isPositive: changePercent > 0,
        isNegative: changePercent < 0,
        afterHours: false,
        source: 'csv',
        date: snapshot.latestDate
      };
    });

    historicalSnapshots = historicalSnapshots || snapshots;

    console.log(`✓ Loaded ${Object.keys(stockData).length} stocks from CSV`);
    return stockData;

  } catch (error) {
    console.error('Failed to fetch CSV data:', error);
    return {};
  }
}

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

  // Try multiple CORS proxies for reliability
  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    ''  // Try direct as last resort
  ];

  for (let i = 0; i < corsProxies.length; i++) {
    const proxy = corsProxies[i];
    const url = proxy ? proxy + encodeURIComponent(yahooUrl) : yahooUrl;

    try {
      console.log(`Attempt ${i + 1}: Fetching stock data using ${proxy ? 'proxy' : 'direct'}...`);
      console.log(`URL: ${url.substring(0, 100)}...`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log(`Response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      // Check if we got valid data
      if (!data.quoteResponse || !data.quoteResponse.result) {
        throw new Error('Invalid API response structure');
      }

      const quotes = data.quoteResponse.result;
      console.log(`Found ${quotes.length} quotes`);

      const stockData = {};

      quotes.forEach(quote => {
        const symbol = quote.symbol;

        // Use appropriate price based on market status
        const etTime = getEasternTime();
        const marketOpen = isMarketOpen(etTime);

        let price, change;

        if (marketOpen) {
          // During market hours: use regular market price
          price = quote.regularMarketPrice;
          change = quote.regularMarketChangePercent;
        } else {
          // After hours: use previous close (adjusted close if available)
          price = quote.regularMarketPreviousClose || quote.regularMarketPrice;
          change = quote.regularMarketChangePercent;
        }

        // Only add to stockData if we have valid price
        if (price !== undefined && price !== null && !isNaN(price)) {
          stockData[symbol] = {
            symbol: symbol,
            price: price.toFixed(2),
            changePercent: change !== undefined && change !== null && !isNaN(change) ? change.toFixed(2) : '–',
            isPositive: change > 0,
            isNegative: change < 0,
            afterHours: !marketOpen
          };
        }
      });

    // Only update cache if we got valid data
    if (Object.keys(stockData).length > 0) {
      const snapshots = await loadHistoricalSnapshots();
      Object.values(stockData).forEach(entry => {
        const snap = snapshots[entry.symbol];
        if (snap && snap.previous && snap.latest) {
          const changePct = ((snap.latest - snap.previous) / snap.previous) * 100;
          entry.changePercent = changePct.toFixed(2);
          entry.isPositive = changePct > 0;
          entry.isNegative = changePct < 0;
        }
      });

      // Merge with existing cache to preserve symbols that weren't updated
      lastKnownData = { ...lastKnownData, ...stockData };

        // Store in localStorage for persistence
        try {
          localStorage.setItem('franresearch_ticker_cache', JSON.stringify(lastKnownData));
          console.log(`Cached ${Object.keys(lastKnownData).length} symbols to localStorage`);
        } catch (e) {
          console.error('Failed to save to localStorage:', e);
        }

        // Store as last market data if market is closed
        if (!isMarketOpen(getEasternTime())) {
          lastMarketData = lastKnownData;
        }
      }

      console.log(`✓ Successfully fetched data for ${Object.keys(stockData).length} valid stocks`);
      return lastKnownData; // Return merged cache (includes all historical + new data)

    } catch (error) {
      console.error(`Proxy ${i + 1} failed:`, error.message);

      // If this isn't the last proxy, continue to next one
      if (i < corsProxies.length - 1) {
        console.log('Trying next proxy...');
        continue;
      }

      // All proxies failed
      console.error('All fetch attempts failed');

      // Return cached data if available
      if (Object.keys(lastKnownData).length > 0) {
        console.info('Using cached stock data');
        return lastKnownData;
      }

      // Return fallback data with N/A values
      console.warn('No cached data available, using fallback');
      return getFallbackData();
    }
  }

  // This shouldn't be reached, but just in case
  return getFallbackData();
}

/**
 * Generate fallback data when API is unavailable
 * Uses last known prices or reasonable defaults
 * @returns {Object} Fallback stock data
 */
function getFallbackData() {
  const fallbackData = {};

  // If we have cached data, use it
  if (Object.keys(lastKnownData).length > 0) {
    return lastKnownData;
  }

  // If we have last market data, use it
  if (Object.keys(lastMarketData).length > 0) {
    return lastMarketData;
  }

  // Last resort: return placeholder showing "Loading..."
  TICKER_SYMBOLS.forEach(symbol => {
    fallbackData[symbol] = {
      symbol: symbol,
      price: '---',
      changePercent: '---',
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

  // Make ticker item clickable - navigate to charts
  item.style.cursor = 'pointer';
  item.title = `Click to view ${stockInfo.symbol} chart`;
  item.addEventListener('click', () => {
    // Navigate to charts page with stock symbol in URL
    window.location.href = `../StockChart/chart.html?symbol=${stockInfo.symbol}`;
  });

  const symbol = document.createElement('span');
  symbol.className = 'ticker-symbol';
  symbol.textContent = stockInfo.symbol;

  const price = document.createElement('span');
  price.className = 'ticker-price';
  price.textContent = stockInfo.price;

  const change = document.createElement('span');
  change.className = 'ticker-change';

  // Add arrow indicators based on daily performance
  let arrow = '';
  if (stockInfo.isPositive) {
    change.classList.add('positive');
    arrow = '▲ '; // Green up arrow
    change.textContent = `${arrow}+${stockInfo.changePercent}%`;
  } else if (stockInfo.isNegative) {
    change.classList.add('negative');
    arrow = '▼ '; // Red down arrow
    change.textContent = `${arrow}${stockInfo.changePercent}%`;
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

function ensurePlaceholders(stockData) {
  TICKER_SYMBOLS.forEach(symbol => {
    if (!stockData[symbol]) {
      stockData[symbol] = {
        symbol,
        price: 'N/A',
        changePercent: '–',
        isPositive: false,
        isNegative: false,
        afterHours: false,
        source: 'unavailable'
      };
    }
  });
}

/**
 * Update the ticker with fresh data
 */
async function updateTicker() {
  const etTime = getEasternTime();
  const marketOpen = isMarketOpen(etTime);
  const closingMessageEl = document.getElementById('closing-message');
  const lastUpdatedEl = document.getElementById('last-updated');

  let stockData = {};

  if (marketOpen) {
    // Market is open: Try Finnhub live data first, fall back to CSV
    console.log('Market is open - fetching live data from Finnhub...');
    stockData = await fetchLiveTickerData();

    // If Finnhub data failed or insufficient, try CSV as fallback
    if (Object.keys(stockData).length < TICKER_SYMBOLS.length / 2) {
      console.log('Finnhub data insufficient, trying CSV...');
      const csvData = await fetchStockDataFromCSV();
      // Merge CSV data for any missing symbols
      TICKER_SYMBOLS.forEach(symbol => {
        if (!stockData[symbol] && csvData[symbol]) {
          stockData[symbol] = csvData[symbol];
        }
      });
    }

    ensurePlaceholders(stockData);
    renderTicker(stockData);
    resetCountdown(); // Reset countdown after refresh

    // Update last updated timestamp
    if (lastUpdatedEl) {
      const now = new Date();
      const timeStr = formatTime(now);
      lastUpdatedEl.textContent = timeStr.split(' ')[0]; // Just time, not AM/PM
    }

    // Hide closing message during market hours
    if (closingMessageEl) {
      closingMessageEl.style.display = 'none';
    }
  } else {
    // Market is closed: Use most recent data (Finnhub or CSV)
    console.log('Market is closed - loading most recent data...');

    if (Object.keys(lastMarketData).length === 0) {
      // Try Finnhub first (may have after-hours data)
      stockData = await fetchLiveTickerData();

      // If Finnhub failed, fall back to CSV
      if (Object.keys(stockData).length === 0) {
        console.log('Finnhub unavailable, trying CSV...');
        stockData = await fetchStockDataFromCSV();
      }

      lastMarketData = stockData;
      ensurePlaceholders(stockData);
      renderTicker(stockData);

      // Update timestamp
      if (lastUpdatedEl) {
        const now = new Date();
        lastUpdatedEl.textContent = formatTime(now).split(' ')[0];
      }
    } else {
      // Use cached after-hours data
      ensurePlaceholders(lastMarketData);
      renderTicker(lastMarketData);

      // Show when data was last fetched (from cache)
      if (lastUpdatedEl) {
        lastUpdatedEl.textContent = 'Cached';
      }
    }

    // Show closing message when market is closed
    if (closingMessageEl) {
      closingMessageEl.style.display = 'block';
    }
  }
}

// ============================================================================
// CLOCK AND STATUS MANAGEMENT
// ============================================================================

// Countdown tracking
let countdownSeconds = 3600; // 1 hour
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
 * Check if market is closing soon (last 30 minutes)
 */
function isClosingSoon(etTime) {
  const day = etTime.getDay();
  if (day === 0 || day === 6) return false;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const closingSoonStart = 15 * 60 + 30;  // 3:30 PM
  const marketClose = 16 * 60;             // 4:00 PM

  return timeInMinutes >= closingSoonStart && timeInMinutes < marketClose;
}

/**
 * Check if market is opening soon (30 minutes before open)
 */
function isOpeningSoon(etTime) {
  const day = etTime.getDay();
  if (day === 0 || day === 6) return false;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  const openingSoonStart = 9 * 60;       // 9:00 AM
  const marketOpen = 9 * 60 + 30;        // 9:30 AM

  return timeInMinutes >= openingSoonStart && timeInMinutes < marketOpen;
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
  const closingSoon = isClosingSoon(etTime);
  const openingSoon = isOpeningSoon(etTime);

  if (indicatorElement && labelElement) {
    if (marketOpen && closingSoon) {
      indicatorElement.className = 'closing-soon';
      labelElement.textContent = 'Closing Soon';
    } else if (openingSoon) {
      indicatorElement.className = 'opening-soon';
      labelElement.textContent = 'Opening Soon';
    } else if (marketOpen) {
      indicatorElement.className = 'open';
      labelElement.textContent = 'Market Open';
    } else {
      indicatorElement.className = 'closed';
      labelElement.textContent = 'Market Closed';
    }
  }
}

/**
 * Get time until market close in seconds
 */
function getTimeUntilClose(etTime) {
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const seconds = etTime.getSeconds();

  // Market closes at 4:00 PM (16:00)
  const marketClose = 16 * 60; // 4:00 PM in minutes
  const currentTimeInMinutes = hours * 60 + minutes;

  // Calculate minutes until close
  const minutesUntilClose = marketClose - currentTimeInMinutes;

  if (minutesUntilClose <= 0) {
    return 0;
  }

  // Convert to seconds
  const secondsUntilClose = (minutesUntilClose * 60) - seconds;
  return secondsUntilClose > 0 ? secondsUntilClose : 0;
}

/**
 * Get time until next market open in seconds
 */
function getTimeUntilOpen(etTime) {
  const day = etTime.getDay();
  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const seconds = etTime.getSeconds();

  // If it's weekend, calculate to Monday 9:30 AM
  if (day === 0) { // Sunday
    const hoursUntilMonday = 24 + 9;
    const minutesUntilMonday = 30;
    const totalMinutes = (hoursUntilMonday * 60 + minutesUntilMonday) - (hours * 60 + minutes);
    const totalSeconds = (totalMinutes * 60) - seconds;
    return totalSeconds;
  } else if (day === 6) { // Saturday
    const hoursUntilMonday = 48 + 9;
    const minutesUntilMonday = 30;
    const totalMinutes = (hoursUntilMonday * 60 + minutesUntilMonday) - (hours * 60 + minutes);
    const totalSeconds = (totalMinutes * 60) - seconds;
    return totalSeconds;
  }

  // Weekday logic
  const timeInMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 30;  // 9:30 AM

  // If before market open today
  if (timeInMinutes < marketOpen) {
    const minutesUntilOpen = marketOpen - timeInMinutes;
    return (minutesUntilOpen * 60) - seconds;
  }

  // If after market close, calculate to next day (or Monday if Friday)
  if (day === 5) { // Friday
    const hoursUntilMonday = (24 - hours) + 48 + 9;
    const minutesUntilMonday = 30 - minutes;
    const totalMinutes = (hoursUntilMonday * 60 + minutesUntilMonday);
    return (totalMinutes * 60) - seconds;
  } else {
    const hoursUntilTomorrow = (24 - hours) + 9;
    const minutesUntilTomorrow = 30 - minutes;
    const totalMinutes = (hoursUntilTomorrow * 60 + minutesUntilTomorrow);
    return (totalMinutes * 60) - seconds;
  }
}

/**
 * Format seconds to countdown string (HH:MM:SS or DD:HH:MM:SS)
 */
function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * Update giant countdown clock
 */
function updateGiantCountdown() {
  const giantCountdown = document.getElementById('giant-countdown');
  const hoursEl = document.getElementById('countdown-hours');
  const minutesEl = document.getElementById('countdown-minutes');
  const secondsEl = document.getElementById('countdown-seconds');

  if (!giantCountdown || !hoursEl || !minutesEl || !secondsEl) return;

  const etTime = getEasternTime();
  const marketOpen = isMarketOpen(etTime);

  if (!marketOpen) {
    // Hide when market is closed
    giantCountdown.style.display = 'none';
    return;
  }

  const secondsUntilClose = getTimeUntilClose(etTime);
  const twoHoursInSeconds = 2 * 60 * 60; // 2 hours

  // Only show if within 2 hours of close
  if (secondsUntilClose <= twoHoursInSeconds && secondsUntilClose > 0) {
    giantCountdown.style.display = 'block';

    // Calculate time components
    const hours = Math.floor(secondsUntilClose / 3600);
    const minutes = Math.floor((secondsUntilClose % 3600) / 60);
    const seconds = secondsUntilClose % 60;

    // Update display
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');

    // Change colors based on time remaining
    giantCountdown.classList.remove('warning-orange', 'warning-red', 'complete-green');

    if (secondsUntilClose <= 60 * 60) {
      // Less than 1 hour: RED (critical)
      giantCountdown.classList.add('warning-red');
    } else {
      // 1-2 hours: ORANGE (warning)
      giantCountdown.classList.add('warning-orange');
    }
  } else if (secondsUntilClose <= 0) {
    // Market just closed - show green briefly
    giantCountdown.style.display = 'block';
    giantCountdown.classList.remove('warning-orange', 'warning-red');
    giantCountdown.classList.add('complete-green');
    hoursEl.textContent = '00';
    minutesEl.textContent = '00';
    secondsEl.textContent = '00';

    // Hide after 5 seconds
    setTimeout(() => {
      giantCountdown.style.display = 'none';
    }, 5000);
  } else {
    // More than 2 hours until close - hide
    giantCountdown.style.display = 'none';
  }
}

/**
 * Update countdown timer
 */
function updateCountdown() {
  const countdownElement = document.getElementById('countdown');
  const refreshLabelElement = document.getElementById('refresh-label');
  const marketCloseSection = document.getElementById('market-close-section');
  const marketCloseCountdown = document.getElementById('market-close-countdown');
  const etTime = getEasternTime();
  const marketOpen = isMarketOpen(etTime);

  if (!countdownElement || !refreshLabelElement) return;

  if (marketOpen) {
    // Market is open - show refresh countdown
    refreshLabelElement.textContent = 'Next:';
    const minutes = Math.floor(countdownSeconds / 60);
    const seconds = countdownSeconds % 60;
    countdownElement.textContent = `${minutes}:${String(seconds).padStart(2, '0')}`;

    countdownSeconds--;
    if (countdownSeconds < 0) {
      countdownSeconds = 0;
    }

    // Show market close countdown
    if (marketCloseSection && marketCloseCountdown) {
      marketCloseSection.style.display = 'flex';
      const secondsUntilClose = getTimeUntilClose(etTime);
      const hours = Math.floor(secondsUntilClose / 3600);
      const minutes = Math.floor((secondsUntilClose % 3600) / 60);
      const secs = secondsUntilClose % 60;

      if (hours > 0) {
        marketCloseCountdown.textContent = `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      } else {
        marketCloseCountdown.textContent = `${minutes}:${String(secs).padStart(2, '0')}`;
      }
    }
  } else {
    // Market is closed - hide market close countdown
    if (marketCloseSection) {
      marketCloseSection.style.display = 'none';
    }

    // Show time until open
    refreshLabelElement.textContent = 'Opens:';
    const secondsUntilOpen = getTimeUntilOpen(etTime);
    const countdown = formatCountdown(secondsUntilOpen);
    countdownElement.textContent = countdown;
  }

  // Update giant countdown clock
  updateGiantCountdown();
}

/**
 * Reset countdown to 1 hour
 */
function resetCountdown() {
  countdownSeconds = 3600; // 1 hour
  const countdownElement = document.getElementById('countdown');
  if (countdownElement) {
    countdownElement.textContent = '60:00';
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
