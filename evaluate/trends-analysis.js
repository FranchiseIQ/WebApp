/**
 * Trends and Forecasting Analysis Module
 * Provides historical performance trends, analysis, and basic forecasting
 */

const TrendsAnalysis = (() => {
  'use strict';

  /**
   * Calculate Simple Moving Average
   */
  function calculateSMA(prices, period = 20) {
    const sma = [];
    for (let i = 0; i < prices.length; i++) {
      if (i < period - 1) {
        sma.push(null);
      } else {
        const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
        sma.push(sum / period);
      }
    }
    return sma;
  }

  /**
   * Calculate Exponential Moving Average
   */
  function calculateEMA(prices, period = 12) {
    if (prices.length === 0) return [];

    const k = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * k + ema[i - 1] * (1 - k));
    }

    return ema;
  }

  /**
   * Calculate trend metrics
   */
  function calculateTrendMetrics(historicalData) {
    if (!historicalData || historicalData.length < 2) {
      return {
        currentPrice: 0,
        yearAgoPrice: 0,
        ytdChange: 0,
        trend: 'neutral',
        volatility: 0,
        momentum: 0
      };
    }

    const prices = historicalData.map(d => d.close);
    const currentPrice = prices[prices.length - 1];
    const yearAgoPrice = prices[0];

    // YTD Change
    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearData = historicalData.filter(d => {
      const date = new Date(d.date);
      return date.getFullYear() === currentYear && date >= yearStart;
    });

    let ytdChange = 0;
    if (yearData.length > 0) {
      const yearStartPrice = yearData[0].close;
      const yearEndPrice = yearData[yearData.length - 1].close;
      ytdChange = ((yearEndPrice - yearStartPrice) / yearStartPrice) * 100;
    }

    // Trend (3-month moving average)
    const threeMonthData = historicalData.slice(-60); // Approx 60 trading days = 3 months
    const threeMonthPrices = threeMonthData.map(d => d.close);
    const sma20 = calculateSMA(threeMonthPrices, 20);
    const validSMA = sma20.filter(v => v !== null);
    const trend = validSMA.length > 0
      ? (threeMonthPrices[threeMonthPrices.length - 1] > validSMA[validSMA.length - 1] ? 'uptrend' : 'downtrend')
      : 'neutral';

    // Volatility (standard deviation)
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100; // Convert to percentage

    // Momentum (rate of change over last 12 periods)
    const momentum = prices.length > 12
      ? ((prices[prices.length - 1] - prices[prices.length - 12]) / prices[prices.length - 12]) * 100
      : 0;

    return {
      currentPrice: currentPrice,
      yearAgoPrice: yearAgoPrice,
      ytdChange: ytdChange,
      annualChange: ((currentPrice - yearAgoPrice) / yearAgoPrice) * 100,
      trend: trend,
      volatility: volatility,
      momentum: momentum,
      dataPoints: prices.length
    };
  }

  /**
   * Simple forecast using linear regression
   */
  function generateForecast(historicalData, periods = 30) {
    if (!historicalData || historicalData.length < 5) {
      return [];
    }

    const prices = historicalData.map(d => d.close);
    const n = prices.length;

    // Calculate linear regression slope and intercept
    const x = Array.from({length: n}, (_, i) => i);
    const y = prices;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Project forward
    const forecast = [];
    for (let i = 0; i < periods; i++) {
      const projectedIndex = n + i;
      const projectedPrice = intercept + slope * projectedIndex;
      forecast.push({
        period: i + 1,
        price: Math.max(projectedPrice, 0.01) // Ensure positive price
      });
    }

    return forecast;
  }

  /**
   * Create trend chart SVG
   */
  function createTrendChart(historicalData, width = 600, height = 300) {
    if (!historicalData || historicalData.length === 0) {
      return `<p class="no-data">No historical data available</p>`;
    }

    const prices = historicalData.map(d => d.close);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Calculate simple moving average
    const sma = calculateSMA(prices, Math.floor(prices.length / 10));

    // Create SVG path for price line
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    const points = prices.map((price, i) => {
      const x = padding + (i / (prices.length - 1)) * chartWidth;
      const y = height - padding - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    const smaPoints = sma.map((price, i) => {
      if (price === null) return null;
      const x = padding + (i / (sma.length - 1)) * chartWidth;
      const y = height - padding - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).filter(p => p !== null).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(99,102,241,0.3);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(99,102,241,0);stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>

        <!-- Price range labels -->
        <text x="${padding - 5}" y="${padding - 5}" text-anchor="end" font-size="12" fill="#999">$${maxPrice.toFixed(2)}</text>
        <text x="${padding - 5}" y="${height - padding + 15}" text-anchor="end" font-size="12" fill="#999">$${minPrice.toFixed(2)}</text>

        <!-- SMA line (if available) -->
        ${smaPoints ? `<polyline points="${smaPoints}" fill="none" stroke="rgba(250, 204, 21, 0.5)" stroke-width="2" vector-effect="non-scaling-stroke"/>` : ''}

        <!-- Price area -->
        <polygon points="${points} ${width - padding},${height - padding} ${padding},${height - padding}" fill="url(#priceGradient)"/>

        <!-- Price line -->
        <polyline points="${points}" fill="none" stroke="rgb(99, 102, 241)" stroke-width="2" vector-effect="non-scaling-stroke"/>

        <!-- Data points -->
        ${prices.map((price, i) => {
          const x = padding + (i / (prices.length - 1)) * chartWidth;
          const y = height - padding - ((price - minPrice) / priceRange) * chartHeight;
          return i % Math.max(1, Math.floor(prices.length / 10)) === 0
            ? `<circle cx="${x}" cy="${y}" r="3" fill="rgb(99, 102, 241)"/>`
            : '';
        }).join('')}
      </svg>
    `;
  }

  /**
   * Create forecast visualization
   */
  function createForecastChart(historicalData, forecast, width = 600, height = 300) {
    if (!historicalData || !forecast || forecast.length === 0) {
      return '<p class="no-data">No forecast data available</p>';
    }

    const historicalPrices = historicalData.map(d => d.close);
    const forecastPrices = forecast.map(f => f.price);
    const allPrices = [...historicalPrices, ...forecastPrices];

    const minPrice = Math.min(...allPrices);
    const maxPrice = Math.max(...allPrices);
    const priceRange = maxPrice - minPrice || 1;

    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Historical prices
    const historicalPoints = historicalPrices.map((price, i) => {
      const x = padding + (i / (allPrices.length - 1)) * chartWidth;
      const y = height - padding - ((price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    // Forecast prices (starting from last historical price)
    const forecastStartX = padding + (historicalPrices.length / (allPrices.length - 1)) * chartWidth;
    const lastHistoricalY = height - padding - ((historicalPrices[historicalPrices.length - 1] - minPrice) / priceRange) * chartHeight;

    const forecastPoints = forecast.map((f, i) => {
      const x = forecastStartX + ((i + 1) / (allPrices.length - 1)) * chartWidth;
      const y = height - padding - ((f.price - minPrice) / priceRange) * chartHeight;
      return `${x},${y}`;
    }).join(' ');

    return `
      <svg viewBox="0 0 ${width} ${height}" class="forecast-chart">
        <defs>
          <linearGradient id="historicalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(34,197,94,0.3);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(34,197,94,0);stop-opacity:1" />
          </linearGradient>
          <pattern id="dashed" x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="4" y2="4" stroke="rgba(99,102,241,0.5)" stroke-width="1"/>
          </pattern>
        </defs>

        <!-- Grid lines -->
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#e5e7eb" stroke-width="1"/>
        <line x1="${forecastStartX}" y1="${padding}" x2="${forecastStartX}" y2="${height - padding}" stroke="#ccc" stroke-width="1" stroke-dasharray="4"/>

        <!-- Labels -->
        <text x="${padding + 5}" y="${padding - 10}" font-size="12" fill="#666" font-weight="600">Historical</text>
        <text x="${forecastStartX + 5}" y="${padding - 10}" font-size="12" fill="#666" font-weight="600">Forecast</text>

        <!-- Historical area -->
        <polygon points="${historicalPoints} ${forecastStartX},${height - padding} ${padding},${height - padding}" fill="url(#historicalGradient)"/>

        <!-- Historical line -->
        <polyline points="${historicalPoints}" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2" vector-effect="non-scaling-stroke"/>

        <!-- Forecast line -->
        <polyline points="${lastHistoricalY},${lastHistoricalY} ${forecastPoints}" fill="none" stroke="rgb(99, 102, 241)" stroke-width="2" stroke-dasharray="4" vector-effect="non-scaling-stroke"/>
      </svg>
    `;
  }

  /**
   * Create trends summary panel
   */
  function createTrendsSummary(metrics) {
    const trendEmoji = metrics.trend === 'uptrend' ? '📈' : metrics.trend === 'downtrend' ? '📉' : '➡️';
    const trendLabel = metrics.trend.charAt(0).toUpperCase() + metrics.trend.slice(1);
    const ytdColor = metrics.ytdChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    const momentumColor = metrics.momentum >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

    return `
      <div class="trends-summary">
        <div class="metrics-row">
          <div class="metric-item">
            <div class="metric-icon">${trendEmoji}</div>
            <div class="metric-info">
              <div class="metric-name">Current Trend</div>
              <div class="metric-value">${trendLabel}</div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon">📊</div>
            <div class="metric-info">
              <div class="metric-name">YTD Change</div>
              <div class="metric-value" style="color: ${ytdColor};">${metrics.ytdChange > 0 ? '+' : ''}${metrics.ytdChange.toFixed(2)}%</div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon">⚡</div>
            <div class="metric-info">
              <div class="metric-name">Momentum (30d)</div>
              <div class="metric-value" style="color: ${momentumColor};">${metrics.momentum > 0 ? '+' : ''}${metrics.momentum.toFixed(2)}%</div>
            </div>
          </div>

          <div class="metric-item">
            <div class="metric-icon">📈</div>
            <div class="metric-info">
              <div class="metric-name">Volatility</div>
              <div class="metric-value">${metrics.volatility.toFixed(2)}%</div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create performance interpretation
   */
  function generatePerformanceInsights(metrics) {
    const insights = [];

    // Trend insight
    if (metrics.trend === 'uptrend') {
      insights.push({
        type: 'positive',
        text: `Strong ${metrics.momentum > 0 ? 'upward' : 'upward but weakening'} trend in recent months`
      });
    } else if (metrics.trend === 'downtrend') {
      insights.push({
        type: metrics.momentum < -5 ? 'danger' : 'warning',
        text: `Downtrend detected with ${Math.abs(metrics.momentum).toFixed(1)}% negative momentum`
      });
    }

    // YTD performance
    if (metrics.ytdChange > 15) {
      insights.push({
        type: 'positive',
        text: `Strong year-to-date performance at +${metrics.ytdChange.toFixed(1)}%`
      });
    } else if (metrics.ytdChange < -10) {
      insights.push({
        type: 'warning',
        text: `Below-average year-to-date at ${metrics.ytdChange.toFixed(1)}%`
      });
    }

    // Volatility insight
    if (metrics.volatility > 30) {
      insights.push({
        type: 'warning',
        text: `High volatility (${metrics.volatility.toFixed(1)}%) indicates significant price swings`
      });
    } else if (metrics.volatility < 15) {
      insights.push({
        type: 'positive',
        text: `Stable price movement with low volatility (${metrics.volatility.toFixed(1)}%)`
      });
    }

    return insights;
  }

  /**
   * Initialize trends display in Overview tab
   */
  function initializeTrends(tabElement, historicalData) {
    if (!tabElement || !historicalData || historicalData.length === 0) return;

    // Calculate metrics
    const metrics = calculateTrendMetrics(historicalData);
    const forecast = generateForecast(historicalData, 30);

    // Create trends section
    const trendsSection = document.createElement('div');
    trendsSection.id = 'trends-analysis';
    trendsSection.style.marginTop = '24px';

    // Trends summary
    let html = createTrendsSummary(metrics);
    html += `
      <div class="trends-section" style="margin-top: 24px;">
        <h4>Historical Performance</h4>
        ${createTrendChart(historicalData)}
      </div>
    `;

    // Forecast
    if (forecast.length > 0) {
      html += `
        <div class="trends-section" style="margin-top: 24px;">
          <h4>30-Day Forecast (Linear Projection)</h4>
          ${createForecastChart(historicalData, forecast)}
          <p class="forecast-disclaimer" style="font-size: 12px; color: #999; margin-top: 12px; font-style: italic;">
            Forecast based on linear regression of historical data. Actual performance may differ significantly based on market conditions and company-specific events.
          </p>
        </div>
      `;
    }

    // Insights
    const insights = generatePerformanceInsights(metrics);
    if (insights.length > 0) {
      html += `
        <div class="trends-section" style="margin-top: 24px;">
          <h4>Performance Insights</h4>
          <ul class="insights-list">
            ${insights.map(insight => `
              <li class="${insight.type}">
                ${insight.text}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
    }

    trendsSection.innerHTML = html;
    tabElement.appendChild(trendsSection);
  }

  // Public API
  return {
    calculateTrendMetrics,
    calculateSMA,
    calculateEMA,
    generateForecast,
    createTrendChart,
    createForecastChart,
    createTrendsSummary,
    generatePerformanceInsights,
    initializeTrends
  };
})();
