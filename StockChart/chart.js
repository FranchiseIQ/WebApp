// ============================================================================
// INTERACTIVE STOCK CHART WIDGET
// Using Yahoo Finance API with Adjusted Close Prices
// ============================================================================

// Configuration
const MAX_TICKERS = 10;
const DEFAULT_TICKERS = ['^GSPC', 'MCD', 'YUM', 'QSR', 'WEN', 'DPZ', 'MAR', 'HLT', 'PLNT', 'DNUT'];
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
  ''
];

// State Management
let chartInstance = null;
let currentRange = 'ytd';
let activeTickers = new Map(); // ticker -> {color, width, data, rawData}
let showLegend = true;
let showYearMarkers = true; // Toggle for year-end markers
let displayMode = 'percent'; // 'percent' or 'price'
let currentModal = null;

// Chart Data Cache (1 hour expiration)
const CHART_CACHE_DURATION = 3600000; // 1 hour
function getCachedChartData(ticker, range) {
  try {
    const cacheKey = `chart_${ticker}_${range}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CHART_CACHE_DURATION) {
        console.log(`✓ Using cached data for ${ticker} (${range})`);
        return data;
      }
    }
  } catch (e) {
    console.error('Cache read error:', e);
  }
  return null;
}

function setCachedChartData(ticker, range, data) {
  try {
    const cacheKey = `chart_${ticker}_${range}`;
    localStorage.setItem(cacheKey, JSON.stringify({
      data: data,
      timestamp: Date.now()
    }));
    console.log(`✓ Cached data for ${ticker} (${range})`);
  } catch (e) {
    console.error('Cache write error:', e);
  }
}

// Color Palette for auto-assignment (^GSPC gets black, others get colors)
const COLOR_PALETTE = [
  '#667eea', '#764ba2', '#f093fb', '#4facfe',
  '#43e97b', '#fa709a', '#fee140', '#30cfd0',
  '#a8edea', '#fed6e3'
];

// ============================================================================
// CSV DATA LOADING
// ============================================================================

/**
 * Load historical data from CSV file
 * @param {string} ticker - Stock symbol
 * @returns {Promise<Array>} Array of historical data points
 */
async function loadHistoricalDataFromCSV(ticker) {
  try {
    const response = await fetch('../data/franchise_stocks.csv');

    if (!response.ok) {
      console.log(`CSV file not found, will fetch all data from API`);
      return null;
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');

    // Parse CSV header
    const headers = lines[0].split(',');

    // Find data for this ticker
    const tickerData = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const row = {};

      headers.forEach((header, index) => {
        row[header.trim()] = values[index];
      });

      // Check if this row is for our ticker
      if (row.symbol === ticker) {
        tickerData.push({
          x: new Date(row.date),
          y: parseFloat(row.adjClose)
        });
      }
    }

    if (tickerData.length > 0) {
      console.log(`✓ Loaded ${tickerData.length} historical records for ${ticker} from CSV`);
      return tickerData;
    }

    return null;

  } catch (error) {
    console.error(`Error loading CSV data for ${ticker}:`, error);
    return null;
  }
}

/**
 * Fetch today's data from API
 * @param {string} ticker - Stock symbol
 * @returns {Promise<Array>} Array with today's data point(s)
 */
async function fetchTodayData(ticker) {
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    const url = proxy ? proxy + encodeURIComponent(yahooUrl) : yahooUrl;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
        throw new Error('Invalid response structure');
      }

      const result = data.chart.result[0];
      const timestamps = result.timestamp;
      const indicators = result.indicators;

      // Get adjusted close prices
      let prices;
      if (indicators.adjclose && indicators.adjclose[0]) {
        prices = indicators.adjclose[0].adjclose;
      } else {
        prices = indicators.quote[0].close;
      }

      // Get today's data
      const todayData = [];
      for (let i = 0; i < timestamps.length; i++) {
        if (prices[i] !== null && prices[i] !== undefined) {
          todayData.push({
            x: new Date(timestamps[i] * 1000),
            y: prices[i]
          });
        }
      }

      console.log(`✓ Fetched ${todayData.length} data points for ${ticker} from API`);
      return todayData;

    } catch (error) {
      if (i < CORS_PROXIES.length - 1) {
        continue;
      }
      throw error;
    }
  }

  return [];
}

// ============================================================================
// YAHOO FINANCE API - CHART DATA WITH ADJUSTED CLOSE
// ============================================================================

/**
 * Fetch current quote data for table display
 */
async function fetchQuoteData(ticker) {
  const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`;

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = CORS_PROXIES[i];
    const url = proxy ? proxy + encodeURIComponent(yahooUrl) : yahooUrl;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.quoteResponse || !data.quoteResponse.result || data.quoteResponse.result.length === 0) {
        throw new Error('Invalid response structure');
      }

      const quote = data.quoteResponse.result[0];

      return {
        symbol: quote.symbol,
        price: quote.regularMarketPrice || 0,
        change: quote.regularMarketChangePercent || 0,
        volume: quote.regularMarketVolume || 0,
        marketCap: quote.marketCap || 0,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0
      };

    } catch (error) {
      console.error(`Proxy ${i + 1} failed for quote ${ticker}:`, error.message);

      if (i < CORS_PROXIES.length - 1) {
        continue;
      }

      throw new Error(`Failed to fetch quote for ${ticker}`);
    }
  }
}

// ============================================================================
// YAHOO FINANCE API - CHART DATA WITH ADJUSTED CLOSE
// ============================================================================

/**
 * Fetch historical chart data with adjusted close prices
 * Loads from CSV when available, falls back to API
 */
async function fetchChartData(ticker, range) {
  // Check cache first
  const cachedData = getCachedChartData(ticker, range);
  if (cachedData) {
    return cachedData;
  }

  try {
    // Try to load historical data from CSV first
    let historicalData = await loadHistoricalDataFromCSV(ticker);

    // If CSV data exists, merge with today's data from API
    if (historicalData && historicalData.length > 0) {
      console.log(`Using CSV data for ${ticker}, fetching today's update...`);

      try {
        const todayData = await fetchTodayData(ticker);

        // Merge historical and today's data
        const mergedData = [...historicalData];

        // Add today's data if it doesn't overlap
        if (todayData && todayData.length > 0) {
          const lastHistoricalDate = new Date(historicalData[historicalData.length - 1].x);
          const todayDate = new Date(todayData[0].x);

          // Only add if today's data is newer
          if (todayDate > lastHistoricalDate) {
            mergedData.push(...todayData);
          }
        }

        // Filter to requested range
        const filteredData = filterDataByRange(mergedData, range);

        const result = {
          symbol: ticker,
          data: filteredData,
          meta: { fromCSV: true }
        };

        // Cache the result
        setCachedChartData(ticker, range, result);

        return result;

      } catch (error) {
        console.warn(`Could not fetch today's data, using CSV only: ${error.message}`);

        const filteredData = filterDataByRange(historicalData, range);

        const result = {
          symbol: ticker,
          data: filteredData,
          meta: { fromCSV: true }
        };

        // Cache the result
        setCachedChartData(ticker, range, result);

        return result;
      }
    }

    // Fallback: Fetch all data from API if CSV not available
    console.log(`CSV not available for ${ticker}, fetching from API...`);

    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${range}&interval=1d`;

    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      const url = proxy ? proxy + encodeURIComponent(yahooUrl) : yahooUrl;

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
          throw new Error('Invalid response structure');
        }

        const result = data.chart.result[0];
        const timestamps = result.timestamp;
        const indicators = result.indicators;

        // Get adjusted close prices
        let prices;
        if (indicators.adjclose && indicators.adjclose[0]) {
          prices = indicators.adjclose[0].adjclose;
          console.log(`✓ Using adjusted close for ${ticker}`);
        } else {
          prices = indicators.quote[0].close;
          console.warn(`⚠ Using regular close for ${ticker} (adjusted not available)`);
        }

        // Filter out null values
        const chartData = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (prices[i] !== null && prices[i] !== undefined) {
            chartData.push({
              x: new Date(timestamps[i] * 1000),
              y: prices[i]
            });
          }
        }

        console.log(`✓ Fetched ${chartData.length} data points for ${ticker} from API`);

        const apiResult = {
          symbol: ticker,
          data: chartData,
          meta: result.meta
        };

        // Cache the result
        setCachedChartData(ticker, range, apiResult);

        return apiResult;

      } catch (error) {
        if (i < CORS_PROXIES.length - 1) {
          console.log('Trying next proxy...');
          continue;
        }

        throw new Error(`Failed to fetch data for ${ticker}: ${error.message}`);
      }
    }

  } catch (error) {
    throw new Error(`Failed to load chart data for ${ticker}: ${error.message}`);
  }
}

/**
 * Filter data by time range
 */
function filterDataByRange(data, range) {
  if (!data || data.length === 0) return [];

  const now = new Date();
  let startDate;

  switch (range) {
    case '1d':
      startDate = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
      break;
    case '5d':
      startDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
      break;
    case '1mo':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3mo':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6mo':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case 'ytd':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case '1y':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '2y':
      startDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '5y':
      startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
      break;
    case '10y':
      startDate = new Date(now.getTime() - 10 * 365 * 24 * 60 * 60 * 1000);
      break;
    case 'max':
      return data; // Return all data
    default:
      startDate = new Date(now.getFullYear(), 0, 1); // Default to YTD
  }

  return data.filter(point => new Date(point.x) >= startDate);
}

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Convert price data to percent change from first point
 * @param {Array} data - Array of {x: Date, y: price} objects
 * @param {Date} startDate - Optional start date for visible range
 * @param {Date} endDate - Optional end date for visible range
 * @returns {Array} Array of {x: Date, y: percentChange} objects
 */
function convertToPercentChange(data, startDate = null, endDate = null) {
  if (!data || data.length === 0) return [];

  // Filter data to visible range if dates provided
  let visibleData = data;
  if (startDate && endDate) {
    visibleData = data.filter(point => {
      const pointDate = new Date(point.x);
      return pointDate >= startDate && pointDate <= endDate;
    });
  }

  if (visibleData.length === 0) return data; // Fallback to original if no visible data

  // Get the first price as baseline
  const baselinePrice = visibleData[0].y;

  // Convert all prices to percent change from baseline
  return data.map(point => ({
    x: point.x,
    y: ((point.y - baselinePrice) / baselinePrice) * 100,
    price: point.y // Store original price for tooltip
  }));
}

/**
 * Get visible date range from chart
 */
function getVisibleRange() {
  if (!chartInstance) return null;

  const xScale = chartInstance.scales.x;
  if (!xScale) return null;

  return {
    min: new Date(xScale.min),
    max: new Date(xScale.max)
  };
}

/**
 * Recalculate percent changes based on visible range
 */
function recalculatePercentChanges() {
  if (displayMode !== 'percent') return;

  const visibleRange = getVisibleRange();
  if (!visibleRange) return;

  let needsUpdate = false;

  activeTickers.forEach((tickerData, ticker) => {
    const newData = convertToPercentChange(
      tickerData.rawData.data,
      visibleRange.min,
      visibleRange.max
    );

    // Update only if data changed
    if (JSON.stringify(newData) !== JSON.stringify(tickerData.data.data)) {
      tickerData.data = {
        ...tickerData.rawData,
        data: newData
      };
      needsUpdate = true;
    }
  });

  if (needsUpdate) {
    updateChartData();
  }
}

/**
 * Update chart data without recreating entire chart
 */
function updateChartData() {
  if (!chartInstance) return;

  const datasets = [];
  activeTickers.forEach((tickerData, ticker) => {
    const dataToUse = displayMode === 'percent' ? tickerData.data : tickerData.rawData;

    datasets.push({
      label: ticker,
      data: dataToUse.data,
      borderColor: tickerData.color,
      backgroundColor: tickerData.color + '20',
      borderWidth: tickerData.width,
      fill: false,
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: tickerData.color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    });
  });

  chartInstance.data.datasets = datasets;
  chartInstance.update('none'); // Update without animation
}

// ============================================================================
// TICKER MANAGEMENT
// ============================================================================

/**
 * Add ticker to chart
 */
async function addTicker(ticker) {
  ticker = ticker.toUpperCase().trim();

  // Validation
  if (!ticker) {
    showError('Please enter a ticker symbol');
    return;
  }

  if (ticker.length > 10) {
    showError('Ticker symbol too long');
    return;
  }

  if (activeTickers.has(ticker)) {
    showError(`${ticker} is already on the chart`);
    return;
  }

  if (activeTickers.size >= MAX_TICKERS) {
    showError(`Maximum ${MAX_TICKERS} tickers allowed`);
    return;
  }

  // Show loading
  showLoading();
  clearError();

  try {
    // Fetch data
    const chartData = await fetchChartData(ticker, currentRange);

    // Special handling for ^GSPC (S&P 500) - thick black line as baseline
    let color, width;
    if (ticker === '^GSPC') {
      color = '#000000'; // Black
      width = 3; // Thicker line
    } else {
      // Auto-assign color from palette
      const colorIndex = activeTickers.size % COLOR_PALETTE.length;
      color = COLOR_PALETTE[colorIndex];
      width = 2;
    }

    // Store ticker data (both raw and processed)
    activeTickers.set(ticker, {
      color: color,
      width: width,
      rawData: chartData, // Store original data
      data: chartData // Will be transformed based on display mode
    });

    // Update UI
    renderTickerChip(ticker);
    updateChart();
    updateTable(); // Update table with new ticker
    clearInput();
    updateLastUpdatedTimestamp(); // Update timestamp

    console.log(`✓ Added ${ticker} to chart`);

  } catch (error) {
    showError(error.message);
    console.error('Error adding ticker:', error);
  } finally {
    hideLoading();
  }
}

/**
 * Remove ticker from chart
 */
function removeTicker(ticker) {
  if (activeTickers.has(ticker)) {
    activeTickers.delete(ticker);
    updateChart();
    renderAllTickerChips();
    updateTable(); // Update table after removing ticker
    console.log(`✓ Removed ${ticker} from chart`);
  }
}

/**
 * Open settings modal for ticker
 */
function openTickerSettings(ticker) {
  const tickerData = activeTickers.get(ticker);
  if (!tickerData) return;

  currentModal = ticker;

  // Set current values
  document.getElementById('modal-title').textContent = `${ticker} Settings`;
  document.getElementById('line-color').value = tickerData.color;
  document.getElementById('line-width').value = tickerData.width;
  document.getElementById('line-width-value').textContent = `${tickerData.width}px`;

  // Show modal
  document.getElementById('settings-modal').classList.add('active');
}

/**
 * Save ticker settings
 */
function saveTickerSettings() {
  if (!currentModal) return;

  const ticker = currentModal;
  const tickerData = activeTickers.get(ticker);
  if (!tickerData) return;

  // Update settings
  tickerData.color = document.getElementById('line-color').value;
  tickerData.width = parseInt(document.getElementById('line-width').value);

  // Close modal and update chart
  closeModal();
  updateChart();

  console.log(`✓ Updated settings for ${ticker}`);
}

// ============================================================================
// CHART RENDERING
// ============================================================================

/**
 * Create or update the chart
 */
function updateChart() {
  const canvas = document.getElementById('stock-chart');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart
  if (chartInstance) {
    chartInstance.destroy();
  }

  // Prepare datasets - use appropriate data based on display mode
  const datasets = [];
  activeTickers.forEach((tickerData, ticker) => {
    // Transform data to percent if in percent mode
    let dataToDisplay;
    if (displayMode === 'percent') {
      dataToDisplay = convertToPercentChange(tickerData.rawData.data);
      tickerData.data = { ...tickerData.rawData, data: dataToDisplay };
    } else {
      dataToDisplay = tickerData.rawData.data;
    }

    datasets.push({
      label: ticker,
      data: dataToDisplay,
      borderColor: tickerData.color,
      backgroundColor: tickerData.color + '20',
      borderWidth: tickerData.width,
      fill: false,
      tension: 0.1,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointHoverBackgroundColor: tickerData.color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2
    });
  });

  // Create chart
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 16,
              weight: '600'
            },
            boxWidth: 15,
            boxHeight: 15
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#667eea',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          callbacks: {
            title: function(context) {
              if (context[0] && context[0].parsed) {
                const date = new Date(context[0].parsed.x);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
              }
              return '';
            },
            label: function(context) {
              const label = context.dataset.label || '';
              const dataPoint = context.raw;

              if (displayMode === 'percent') {
                const percentChange = context.parsed.y;
                const price = dataPoint.price || 0;
                return [
                  `${label}: ${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`,
                  `Price: $${price.toFixed(2)}`
                ];
              } else {
                const price = context.parsed.y;
                return `${label}: $${price.toFixed(2)}`;
              }
            }
          }
        },
        zoom: {
          pan: {
            enabled: true,
            mode: 'x',
            modifierKey: 'shift',
            onPanComplete: function() {
              // Recalculate percent changes after pan
              setTimeout(() => recalculatePercentChanges(), 100);
            }
          },
          zoom: {
            wheel: {
              enabled: true,
              speed: 0.1
            },
            pinch: {
              enabled: true
            },
            mode: 'x',
            onZoomComplete: function() {
              // Recalculate percent changes after zoom
              setTimeout(() => recalculatePercentChanges(), 100);
            }
          },
          limits: {
            x: { min: 'original', max: 'original' }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: getTimeUnit(currentRange),
            displayFormats: {
              day: 'MMM d',
              week: 'MMM d',
              month: 'MMM yyyy',
              quarter: 'MMM yyyy',
              year: 'yyyy'
            }
          },
          grid: {
            display: showYearMarkers,
            color: function(context) {
              // Show year-end markers as dashed vertical lines
              if (!showYearMarkers) return 'transparent';

              const date = new Date(context.tick.value);
              const month = date.getMonth();
              const day = date.getDate();

              // Check if it's near year-end (December 31st)
              if (month === 11 && day >= 28) {
                return 'rgba(150, 150, 150, 0.3)';
              }
              return 'transparent';
            },
            borderDash: [5, 5],
            lineWidth: 1
          },
          ticks: {
            maxRotation: 0,
            autoSkipPadding: 20,
            font: {
              size: 14,
              weight: '500'
            }
          }
        },
        y: {
          position: 'right',
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            font: {
              size: 14,
              weight: '500'
            },
            callback: function(value) {
              if (displayMode === 'percent') {
                return (value >= 0 ? '+' : '') + value.toFixed(1) + '%';
              } else {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    }
  });
}

/**
 * Get appropriate time unit for range
 */
function getTimeUnit(range) {
  switch(range) {
    case '1d': return 'hour';
    case '5d': return 'day';
    case '1mo': return 'day';
    case '3mo': return 'week';
    case '6mo': return 'week';
    case 'ytd': return 'week';
    case '1y': return 'month';
    case '2y': return 'month';
    case '5y': return 'month';
    case '10y': return 'year';
    case 'max': return 'year';
    default: return 'day';
  }
}

// ============================================================================
// TIME RANGE MANAGEMENT
// ============================================================================

/**
 * Change time range and reload all ticker data
 */
async function changeTimeRange(range) {
  currentRange = range;

  // Update button states
  document.querySelectorAll('.btn-range').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-range="${range}"]`).classList.add('active');

  // Reload all tickers with new range
  if (activeTickers.size > 0) {
    showLoading();
    clearError();

    try {
      const tickers = Array.from(activeTickers.keys());

      for (const ticker of tickers) {
        const tickerData = activeTickers.get(ticker);
        const newData = await fetchChartData(ticker, range);
        tickerData.data = newData;
        activeTickers.set(ticker, tickerData);
      }

      updateChart();
      updateLastUpdatedTimestamp(); // Update timestamp
      console.log(`✓ Loaded ${range} data for all tickers`);

    } catch (error) {
      showError(`Failed to load ${range} data: ${error.message}`);
      console.error('Error changing time range:', error);
    } finally {
      hideLoading();
    }
  }
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

/**
 * Render ticker chip
 */
function renderTickerChip(ticker) {
  const container = document.getElementById('ticker-list');
  const tickerData = activeTickers.get(ticker);

  const chip = document.createElement('div');
  chip.className = 'ticker-chip';
  chip.style.borderColor = tickerData.color;

  chip.innerHTML = `
    <span class="ticker-name">${ticker}</span>
    <button class="ticker-settings" data-ticker="${ticker}">⚙️</button>
    <button class="ticker-remove" data-ticker="${ticker}">×</button>
  `;

  container.appendChild(chip);
}

/**
 * Render all ticker chips
 */
function renderAllTickerChips() {
  const container = document.getElementById('ticker-list');
  container.innerHTML = '';
  activeTickers.forEach((_, ticker) => renderTickerChip(ticker));
}

/**
 * Show loading indicator
 */
function showLoading() {
  document.getElementById('loading').classList.add('active');
}

/**
 * Hide loading indicator
 */
function hideLoading() {
  document.getElementById('loading').classList.remove('active');
}

/**
 * Show error message
 */
function showError(message) {
  const errorEl = document.getElementById('ticker-error');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

/**
 * Clear error message
 */
function clearError() {
  const errorEl = document.getElementById('ticker-error');
  errorEl.textContent = '';
  errorEl.style.display = 'none';
}

/**
 * Clear input field
 */
function clearInput() {
  document.getElementById('ticker-input').value = '';
}

/**
 * Close modal
 */
function closeModal() {
  document.getElementById('settings-modal').classList.remove('active');
  currentModal = null;
}

/**
 * Get stock data from CSV file
 */
async function getStockDataFromCSV(ticker) {
  try {
    const response = await fetch('../data/franchise_stocks.csv');
    if (!response.ok) {
      throw new Error('CSV file not found');
    }

    const csvText = await response.text();
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');

    // Find most recent data for this ticker
    let latestData = null;
    let latestDate = '';

    for (let i = lines.length - 1; i >= 1; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const symbol = values[1];

      if (symbol === ticker) {
        const date = values[0];
        if (!latestData || date > latestDate) {
          latestDate = date;
          latestData = {
            symbol: values[1],
            open: parseFloat(values[2]),
            high: parseFloat(values[3]),
            low: parseFloat(values[4]),
            close: parseFloat(values[5]),
            adjClose: parseFloat(values[6]),
            volume: parseInt(values[7])
          };
        }
      }
    }

    if (!latestData) {
      throw new Error(`No data found for ${ticker}`);
    }

    // Calculate 52-week high/low
    let fiftyTwoWeekHigh = latestData.high;
    let fiftyTwoWeekLow = latestData.low;
    const oneYearAgo = new Date(latestDate);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    for (let i = lines.length - 1; i >= 1; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const symbol = values[1];
      const date = values[0];

      if (symbol === ticker && date >= oneYearAgo.toISOString().split('T')[0]) {
        const high = parseFloat(values[3]);
        const low = parseFloat(values[4]);
        if (high > fiftyTwoWeekHigh) fiftyTwoWeekHigh = high;
        if (low < fiftyTwoWeekLow) fiftyTwoWeekLow = low;
      }
    }

    // Calculate change percent (compare adjClose to previous close)
    let changePercent = 0;
    for (let i = lines.length - 1; i >= 1; i--) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',');
      const symbol = values[1];
      const date = values[0];

      if (symbol === ticker && date < latestDate) {
        const prevClose = parseFloat(values[5]);
        changePercent = ((latestData.adjClose - prevClose) / prevClose) * 100;
        break;
      }
    }

    return {
      symbol: ticker,
      price: latestData.adjClose,
      change: changePercent,
      volume: latestData.volume,
      marketCap: 0, // Not available in CSV
      fiftyTwoWeekHigh: fiftyTwoWeekHigh,
      fiftyTwoWeekLow: fiftyTwoWeekLow
    };
  } catch (error) {
    console.error(`Error reading CSV for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Update stock data table
 */
async function updateTable() {
  const tableBody = document.getElementById('table-body');

  if (activeTickers.size === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 20px; color: #999;">
          Add tickers to see data in the table
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Loading...</td></tr>';

  const rows = [];

  for (const ticker of activeTickers.keys()) {
    try {
      const quote = await getStockDataFromCSV(ticker);

      const changeClass = quote.change > 0 ? 'positive-change' : (quote.change < 0 ? 'negative-change' : '');
      const changeSign = quote.change > 0 ? '+' : '';

      rows.push(`
        <tr>
          <td><strong>${quote.symbol}</strong></td>
          <td>$${quote.price.toFixed(2)}</td>
          <td class="${changeClass}">${changeSign}${quote.change.toFixed(2)}%</td>
          <td>${formatNumber(quote.volume)}</td>
          <td>${quote.marketCap > 0 ? formatMarketCap(quote.marketCap) : 'N/A'}</td>
          <td>$${quote.fiftyTwoWeekHigh.toFixed(2)}</td>
          <td>$${quote.fiftyTwoWeekLow.toFixed(2)}</td>
        </tr>
      `);
    } catch (error) {
      console.error(`Failed to get data for ${ticker}:`, error);
      rows.push(`
        <tr>
          <td><strong>${ticker}</strong></td>
          <td colspan="6" style="color: #fa709a;">No data available</td>
        </tr>
      `);
    }
  }

  tableBody.innerHTML = rows.join('');
}

/**
 * Format large numbers (volume)
 */
function formatNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(2) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(2) + 'K';
  }
  return num.toString();
}

/**
 * Format market cap
 */
function formatMarketCap(num) {
  if (num === 0) return 'N/A';
  if (num >= 1000000000000) {
    return '$' + (num / 1000000000000).toFixed(2) + 'T';
  } else if (num >= 1000000000) {
    return '$' + (num / 1000000000).toFixed(2) + 'B';
  } else if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(2) + 'M';
  }
  return '$' + num.toString();
}

// ============================================================================
// CLOCK AND MARKET STATUS (CHART PAGE)
// ============================================================================

/**
 * Get current Eastern Time
 */
function getEasternTime() {
  const now = new Date();
  return new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
}

/**
 * Format time as 12-hour clock
 */
function formatTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  hours = hours % 12;
  hours = hours ? hours : 12;

  return `${hours}:${minutes}:${seconds} ${ampm}`;
}

/**
 * Update the last updated timestamp display
 */
function updateLastUpdatedTimestamp() {
  const lastUpdatedEl = document.getElementById('chart-last-updated');
  if (lastUpdatedEl) {
    const now = new Date();
    const timeStr = formatTime(now);
    lastUpdatedEl.textContent = timeStr.split(' ')[0]; // Just time, not AM/PM
  }
}

/**
 * Check if market is open
 */
function isMarketOpen(etTime) {
  const day = etTime.getDay();
  if (day === 0 || day === 6) return false;

  const hours = etTime.getHours();
  const minutes = etTime.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

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
 * Get time until next market open
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
 * Update clock and market status
 */
function updateClockAndStatus() {
  const etTime = getEasternTime();
  const clockElement = document.getElementById('chart-clock');
  const indicatorElement = document.getElementById('chart-market-indicator');
  const labelElement = document.getElementById('chart-market-label');
  const marketTimeElement = document.getElementById('chart-market-time');
  const lastUpdatedElement = document.getElementById('chart-last-updated');

  if (clockElement) {
    clockElement.textContent = formatTime(etTime);
  }

  // Update last updated time
  if (lastUpdatedElement) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    lastUpdatedElement.textContent = `${displayHours}:${minutes} ${ampm}`;
  }

  if (indicatorElement && labelElement && marketTimeElement) {
    const marketOpen = isMarketOpen(etTime);
    const closingSoon = isClosingSoon(etTime);
    const openingSoon = isOpeningSoon(etTime);

    if (marketOpen && closingSoon) {
      indicatorElement.className = 'market-dot closing-soon';
      labelElement.textContent = 'Closing Soon';
      marketTimeElement.textContent = 'Market closes 4:00pm EST';
    } else if (openingSoon) {
      indicatorElement.className = 'market-dot opening-soon';
      labelElement.textContent = 'Opening Soon';
      marketTimeElement.textContent = 'Market opens 9:30am EST';
    } else if (marketOpen) {
      indicatorElement.className = 'market-dot open';
      labelElement.textContent = 'Market Open';
      marketTimeElement.textContent = 'Closes at 4:00pm EST';
    } else {
      // Market is closed
      indicatorElement.className = 'market-dot closed';
      labelElement.textContent = 'Market Closed';
      marketTimeElement.textContent = 'Opens at 9:30am EST';
    }
  }
}

/**
 * Start clock updates
 */
function startClock() {
  updateClockAndStatus();
  setInterval(updateClockAndStatus, 1000);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Add ticker button
  document.getElementById('add-ticker-btn').addEventListener('click', () => {
    const input = document.getElementById('ticker-input');
    addTicker(input.value);
  });

  // Add ticker on Enter key
  document.getElementById('ticker-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addTicker(e.target.value);
    }
  });

  // Ticker chip actions (event delegation)
  document.getElementById('ticker-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('ticker-remove')) {
      removeTicker(e.target.dataset.ticker);
    } else if (e.target.classList.contains('ticker-settings')) {
      openTickerSettings(e.target.dataset.ticker);
    }
  });

  // Time range buttons
  document.querySelectorAll('.btn-range').forEach(btn => {
    btn.addEventListener('click', () => {
      changeTimeRange(btn.dataset.range);
    });
  });

  // Chart controls
  document.getElementById('toggle-display-mode-btn').addEventListener('click', function() {
    // Toggle between percent and price modes
    displayMode = displayMode === 'percent' ? 'price' : 'percent';

    // Update button text
    this.textContent = displayMode === 'percent' ? '📊 Switch to Price View' : '📈 Switch to Percent View';

    // Update chart
    updateChart();
  });

  document.getElementById('reset-zoom-btn').addEventListener('click', () => {
    if (chartInstance) {
      chartInstance.resetZoom();
      // Recalculate percent changes after reset
      setTimeout(() => recalculatePercentChanges(), 100);
    }
  });

  document.getElementById('toggle-legend-btn').addEventListener('click', () => {
    showLegend = !showLegend;
    if (chartInstance) {
      chartInstance.options.plugins.legend.display = showLegend;
      chartInstance.update();
    }
  });

  document.getElementById('toggle-year-markers-btn').addEventListener('click', () => {
    showYearMarkers = !showYearMarkers;
    updateChart(); // Need to recreate chart to update grid display
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    changeTimeRange(currentRange);
  });

  // Modal controls
  document.querySelector('.modal-close').addEventListener('click', closeModal);
  document.querySelector('.modal-cancel').addEventListener('click', closeModal);
  document.querySelector('.modal-save').addEventListener('click', saveTickerSettings);

  // Line width slider update
  document.getElementById('line-width').addEventListener('input', (e) => {
    document.getElementById('line-width-value').textContent = `${e.target.value}px`;
  });

  // Close modal on outside click
  document.getElementById('settings-modal').addEventListener('click', (e) => {
    if (e.target.id === 'settings-modal') {
      closeModal();
    }
  });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Pre-load default ticker data in background for faster display
 */
async function preloadDefaultTickers() {
  console.log('Pre-loading default ticker data...');

  const ranges = ['ytd', '1y', '5y']; // Pre-load common ranges

  for (const ticker of DEFAULT_TICKERS) {
    for (const range of ranges) {
      try {
        // Check if already cached
        const cached = getCachedChartData(ticker, range);
        if (!cached) {
          // Fetch and cache in background
          await fetchChartData(ticker, range);
          console.log(`✓ Pre-loaded ${ticker} (${range})`);
        } else {
          console.log(`✓ ${ticker} (${range}) already cached`);
        }
      } catch (error) {
        console.error(`Failed to pre-load ${ticker} (${range}):`, error.message);
      }
    }
  }

  console.log('✓ Pre-loading complete');
}

/**
 * Initialize the application
 */
async function init() {
  console.log('Initializing FranResearch Interactive Stock Chart...');

  // Start clock and market status
  startClock();

  // Setup event listeners
  initEventListeners();

  // Load default tickers
  showLoading();

  for (const ticker of DEFAULT_TICKERS) {
    try {
      await addTicker(ticker);
    } catch (error) {
      console.error(`Failed to load default ticker ${ticker}:`, error);
    }
  }

  hideLoading();

  // Pre-load additional ranges in background for faster switching
  setTimeout(() => {
    preloadDefaultTickers();
  }, 2000); // Wait 2 seconds after initial load to pre-load other ranges

  console.log('✓ Chart initialized');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
