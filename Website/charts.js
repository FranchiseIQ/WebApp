// ============================================================================
// STOCK CHARTS CONFIGURATION
// ============================================================================

let currentChart = null;
let currentSymbol = 'MCD';
let currentTimeframe = '5d';

// ============================================================================
// YAHOO FINANCE CHART API
// ============================================================================

/**
 * Fetch historical chart data from Yahoo Finance
 * @param {string} symbol - Stock symbol
 * @param {string} timeframe - Timeframe (1d, 5d, 1mo, 3mo, 6mo, 1y)
 * @returns {Promise<Object>} Chart data
 */
async function fetchChartData(symbol, timeframe) {
  // Convert timeframe to Yahoo Finance parameters
  const timeframeMap = {
    '1d': { range: '1d', interval: '5m' },
    '5d': { range: '5d', interval: '30m' },
    '1mo': { range: '1mo', interval: '1d' },
    '3mo': { range: '3mo', interval: '1d' },
    '6mo': { range: '6mo', interval: '1d' },
    '1y': { range: '1y', interval: '1wk' }
  };

  const params = timeframeMap[timeframe] || timeframeMap['5d'];
  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=${params.range}&interval=${params.interval}`;

  // Use CORS proxy
  const corsProxy = 'https://api.allorigins.win/raw?url=';
  const url = corsProxy + encodeURIComponent(yahooUrl);

  try {
    console.log(`Fetching chart data for ${symbol}...`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('Invalid chart data structure');
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;

    // Format data for Chart.js
    const chartData = {
      symbol: result.meta.symbol,
      currency: result.meta.currency,
      currentPrice: result.meta.regularMarketPrice,
      previousClose: result.meta.chartPreviousClose,
      timestamps: timestamps.map(ts => new Date(ts * 1000)),
      prices: quote.close,
      high: quote.high,
      low: quote.low,
      open: quote.open,
      volume: quote.volume
    };

    console.log(`Successfully fetched chart data for ${symbol}`);
    return chartData;

  } catch (error) {
    console.error('Failed to fetch chart data:', error.message);
    throw error;
  }
}

// ============================================================================
// CHART RENDERING
// ============================================================================

/**
 * Create or update the stock chart
 * @param {Object} chartData - Chart data object
 */
function renderChart(chartData) {
  const canvas = document.getElementById('stockChart');
  const ctx = canvas.getContext('2d');

  // Destroy existing chart
  if (currentChart) {
    currentChart.destroy();
  }

  // Calculate price change
  const priceChange = chartData.currentPrice - chartData.previousClose;
  const priceChangePercent = (priceChange / chartData.previousClose) * 100;

  // Update chart title and stats
  document.getElementById('chart-title').textContent = `${chartData.symbol} - ${chartData.currency}`;

  const statsHTML = `
    <div class="stat">
      <span class="stat-label">Current Price</span>
      <span class="stat-value">${chartData.currentPrice.toFixed(2)}</span>
    </div>
    <div class="stat">
      <span class="stat-label">Change</span>
      <span class="stat-value ${priceChange >= 0 ? 'positive' : 'negative'}">
        ${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)
      </span>
    </div>
    <div class="stat">
      <span class="stat-label">Previous Close</span>
      <span class="stat-value">${chartData.previousClose.toFixed(2)}</span>
    </div>
  `;
  document.getElementById('chart-stats').innerHTML = statsHTML;

  // Determine line color based on performance
  const lineColor = priceChange >= 0 ? 'rgba(0, 255, 136, 1)' : 'rgba(255, 68, 68, 1)';
  const backgroundColor = priceChange >= 0 ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 68, 0.1)';

  // Create chart
  currentChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartData.timestamps,
      datasets: [{
        label: 'Price',
        data: chartData.prices,
        borderColor: lineColor,
        backgroundColor: backgroundColor,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: lineColor,
          borderWidth: 1,
          padding: 12,
          displayColors: false,
          callbacks: {
            title: function(context) {
              const date = context[0].parsed.x;
              return new Date(date).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: currentTimeframe === '1d' ? 'numeric' : undefined,
                minute: currentTimeframe === '1d' ? '2-digit' : undefined
              });
            },
            label: function(context) {
              return `Price: ${chartData.currency} ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'time',
          time: {
            unit: currentTimeframe === '1d' ? 'hour' : currentTimeframe === '5d' ? 'day' : 'week',
            displayFormats: {
              hour: 'h:mm a',
              day: 'MMM d',
              week: 'MMM d'
            }
          },
          grid: {
            display: false
          },
          ticks: {
            color: '#666',
            maxRotation: 0,
            autoSkipPadding: 20
          }
        },
        y: {
          position: 'right',
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            color: '#666',
            callback: function(value) {
              return chartData.currency + ' ' + value.toFixed(2);
            }
          }
        }
      }
    }
  });
}

// ============================================================================
// UI MANAGEMENT
// ============================================================================

/**
 * Show loading state
 */
function showLoading() {
  document.getElementById('loading').style.display = 'block';
  document.getElementById('error').style.display = 'none';
  document.querySelector('.chart-container').style.opacity = '0.5';
}

/**
 * Hide loading state
 */
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.querySelector('.chart-container').style.opacity = '1';
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  const errorEl = document.getElementById('error');
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  hideLoading();
}

/**
 * Load and display chart
 */
async function loadChart() {
  showLoading();

  try {
    const chartData = await fetchChartData(currentSymbol, currentTimeframe);
    renderChart(chartData);
    hideLoading();
  } catch (error) {
    showError(`Failed to load chart: ${error.message}. Please try again.`);
  }
}

/**
 * Initialize the page
 */
function init() {
  // Set up event listeners
  document.getElementById('stock-select').addEventListener('change', (e) => {
    currentSymbol = e.target.value;
    loadChart();
  });

  document.getElementById('timeframe-select').addEventListener('change', (e) => {
    currentTimeframe = e.target.value;
    loadChart();
  });

  document.getElementById('refresh-btn').addEventListener('click', () => {
    loadChart();
  });

  // Initial chart load
  loadChart();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
