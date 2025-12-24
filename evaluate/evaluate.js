/**
 * Franchise Evaluation Page Main Script
 *
 * Handles:
 * - Brand and market selection via query params
 * - Data loading from existing sources
 * - Score calculation and display
 * - Tab navigation
 * - UI updates based on selections
 */

class EvaluationPage {
  constructor() {
    this.currentBrand = null;
    this.currentMarket = null;
    this.brandData = null;
    this.locationData = null;
    this.stockData = null;
    this.marketLocationData = null;
    this.init();
  }

  async init() {
    try {
      // Initialize UI event listeners
      this.setupEventListeners();

      // Load initial data
      await this.loadBrandList();

      // Get query params if available
      const params = new URLSearchParams(window.location.search);
      const brandParam = params.get('brand');
      const marketParam = params.get('market');

      // Set initial selections
      if (brandParam) {
        document.getElementById('brand-select').value = brandParam;
        this.currentBrand = brandParam;
      }

      if (marketParam) {
        document.getElementById('market-select').value = marketParam;
        this.currentMarket = marketParam;
      }

      // Load data and update UI
      if (this.currentBrand) {
        await this.loadBrandData(this.currentBrand);
        if (this.currentMarket) {
          await this.loadMarketData(this.currentMarket);
          this.updateEvaluation();
        }
      }
    } catch (error) {
      console.error('Error initializing evaluation page:', error);
    }
  }

  setupEventListeners() {
    // Brand selection
    document.getElementById('brand-select').addEventListener('change', (e) => {
      this.currentBrand = e.target.value;
      this.loadBrandData(this.currentBrand);
    });

    // Market selection
    document.getElementById('market-select').addEventListener('change', (e) => {
      this.currentMarket = e.target.value;
      if (this.currentBrand) {
        this.loadMarketData(this.currentMarket);
        this.updateEvaluation();
      }
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Methodology toggle
    document.getElementById('methodology-toggle').addEventListener('click', () => {
      const content = document.getElementById('methodology-content');
      const toggle = document.getElementById('methodology-toggle');
      content.classList.toggle('show');
      toggle.classList.toggle('active');
    });

    // Action buttons
    document.getElementById('adjust-assumptions-btn').addEventListener('click', () => {
      this.switchTab('economics');
    });

    document.getElementById('compare-btn').addEventListener('click', () => {
      // Placeholder for comparison feature
      alert('Comparison feature coming soon. For now, try different brands from the dropdown.');
    });
  }

  async loadBrandList() {
    try {
      // List of available brands from the app config
      const brands = [
        { ticker: 'MCD', name: 'McDonald\'s' },
        { ticker: 'YUM', name: 'Yum! Brands' },
        { ticker: 'SBUX', name: 'Starbucks' },
        { ticker: 'DPZ', name: 'Domino\'s Pizza' },
        { ticker: 'QSR', name: 'Restaurant Brands' },
        { ticker: 'WEN', name: 'Wendy\'s' },
        { ticker: 'JACK', name: 'Jack in the Box' },
        { ticker: 'SHAK', name: 'Shake Shack' },
        { ticker: 'DENN', name: 'Denny\'s' },
        { ticker: 'DIN', name: 'Dine Global Holdings' },
        { ticker: 'DNUT', name: 'Krispy Kreme' },
        { ticker: 'NATH', name: 'Nathan\'s Famous' },
        { ticker: 'RRGB', name: 'Red Robin' },
        { ticker: 'MAR', name: 'Marriott International' },
        { ticker: 'HLT', name: 'Hilton Worldwide' },
        { ticker: 'H', name: 'Hyatt Hotels' },
        { ticker: 'CHH', name: 'Choice Hotels' },
        { ticker: 'WH', name: 'Wyndham Hotels' }
      ];

      const select = document.getElementById('brand-select');
      select.innerHTML = '<option value="">Select a brand...</option>';
      brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.ticker;
        option.textContent = `${brand.name} (${brand.ticker})`;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading brand list:', error);
    }
  }

  loadMarketList() {
    // US States for market selection
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    const select = document.getElementById('market-select');
    select.innerHTML = '<option value="">Select a state...</option>';
    states.forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      select.appendChild(option);
    });
  }

  async loadBrandData(brandTicker) {
    try {
      if (!brandTicker) return;

      // Update URL with selected brand
      this.updateQueryParams({ brand: brandTicker });

      // Load market list
      this.loadMarketList();

      // Try to load location data for the brand
      const response = await fetch(`../FranchiseMap/data/brands/${brandTicker}.json`);
      if (response.ok) {
        this.locationData = await response.json();
      }

      // Try to load stock data
      const stockResponse = await fetch('../data/live_ticker.json');
      if (stockResponse.ok) {
        const tickerData = await stockResponse.json();
        if (tickerData.quotes && tickerData.quotes[brandTicker]) {
          this.stockData = tickerData.quotes[brandTicker];
        }
      }

      // Update brand header
      this.updateBrandHeader();
    } catch (error) {
      console.error(`Error loading data for ${brandTicker}:`, error);
    }
  }

  async loadMarketData(marketCode) {
    try {
      if (!marketCode) return;

      // Update URL with selected market
      this.updateQueryParams({ market: marketCode });

      if (this.locationData) {
        // Filter locations by state
        this.marketLocationData = this.locationData.filter(loc => {
          // Extract state from address (simple extraction)
          const addressParts = loc.a ? loc.a.split(',') : [];
          return addressParts.length >= 2 && addressParts[addressParts.length - 2].trim() === marketCode;
        });
      }

      this.updateEvaluation();
    } catch (error) {
      console.error(`Error loading market data for ${marketCode}:`, error);
    }
  }

  updateBrandHeader() {
    // Get brand name from stock data if available
    const tickerSymbol = this.currentBrand;
    const brandSelect = document.getElementById('brand-select');
    const brandName = brandSelect.options[brandSelect.selectedIndex]?.text || tickerSymbol;

    document.getElementById('brand-name-heading').textContent = brandName;

    // Update stats
    if (this.stockData) {
      const price = this.stockData.price || '--';
      const change = this.stockData.changePercent || '--';
      const changeSign = change > 0 ? '+' : '';

      document.getElementById('brand-price').textContent = `Price: $${typeof price === 'number' ? price.toFixed(2) : price}`;
      document.getElementById('brand-change').textContent = `Change: ${changeSign}${typeof change === 'number' ? change.toFixed(2) : change}%`;
    }

    if (this.locationData) {
      document.getElementById('brand-units').textContent = `Units: ${this.locationData.length}`;
    }
  }

  updateEvaluation() {
    if (!this.currentBrand || !this.currentMarket) {
      this.clearEvaluation();
      return;
    }

    // Calculate market metrics
    const marketMetrics = this.calculateMarketMetrics();

    // Prepare scoring inputs
    const ytdPercent = this.stockData?.['ytd_percent'] ||
                       this.estimateYTDPercent(this.stockData) ||
                       0;

    const unitGrowthYoY = 5; // Placeholder - would need historical data

    const scoringInput = {
      stockData: {
        ytdPercent: ytdPercent,
        unitGrowthYoY: unitGrowthYoY
      },
      marketData: {
        unitsPerCapita: marketMetrics.unitsPerCapita,
        competitorCount: marketMetrics.competitorCount
      },
      siteQualityScore: marketMetrics.avgSiteScore,
      brandName: this.currentBrand
    };

    // Calculate score
    const scoreResult = ScoringModule.calculateScore(scoringInput);
    this.displayScore(scoreResult, scoringInput);

    // Update all tabs
    this.updateOverviewTab();
    this.updateLocationTab(marketMetrics);
    this.updateEconomicsTab();
    this.updateRiskTab(scoreResult, scoringInput);
  }

  calculateMarketMetrics() {
    const metrics = {
      unitsPerCapita: 0,
      competitorCount: 0,
      avgSiteScore: 50,
      locations: []
    };

    if (!this.marketLocationData || this.marketLocationData.length === 0) {
      return metrics;
    }

    metrics.locations = this.marketLocationData;
    metrics.unitCount = this.marketLocationData.length;

    // Calculate average site score
    const siteScores = this.marketLocationData
      .filter(loc => loc.s)
      .map(loc => loc.s);

    if (siteScores.length > 0) {
      metrics.avgSiteScore = siteScores.reduce((a, b) => a + b) / siteScores.length;
    }

    // Placeholder for more detailed metrics
    // In production, would calculate from demographic data in location attributes
    metrics.unitsPerCapita = Math.max(0.5, Math.random() * 3); // Placeholder
    metrics.competitorCount = Math.floor(Math.random() * 10); // Placeholder

    return metrics;
  }

  estimateYTDPercent(stockData) {
    if (!stockData) return null;

    // Try to get YTD from existing data
    if (stockData.ytd_percent) return stockData.ytd_percent;

    // Estimate based on available price data
    // In production, would use historical price data
    const change = stockData.changePercent || 0;
    return change * 2; // Very rough estimate
  }

  displayScore(scoreResult, inputs) {
    const scoreDisplay = document.getElementById('opportunity-score');
    const labelDisplay = document.getElementById('opportunity-label');
    const descDisplay = document.getElementById('opportunity-description');
    const insightsList = document.getElementById('insights-list');

    if (!scoreResult.isValid) {
      scoreDisplay.textContent = '--';
      labelDisplay.textContent = 'No Data';
      descDisplay.textContent = scoreResult.message;
      insightsList.innerHTML = '<li>Select a brand and market to calculate the score</li>';
      return;
    }

    // Display score
    scoreDisplay.textContent = scoreResult.score;
    scoreDisplay.className = `score-number ${scoreResult.interpretation.cssClass}`;

    // Display interpretation
    labelDisplay.textContent = scoreResult.interpretation.label;
    labelDisplay.className = `interpretation-label ${scoreResult.interpretation.cssClass}`;
    descDisplay.textContent = scoreResult.interpretation.description;

    // Display insights
    const insights = ScoringModule.generateInsights(inputs, scoreResult);
    insightsList.innerHTML = insights
      .map(insight => {
        let className = '';
        if (insight.type === 'positive') className = '';
        if (insight.type === 'warning') className = ' warning';
        if (insight.type === 'danger') className = ' danger';
        return `<li${className}>${insight.text}</li>`;
      })
      .join('');
  }

  updateOverviewTab() {
    // Update metrics
    if (this.stockData) {
      const ytd = this.estimateYTDPercent(this.stockData);
      document.getElementById('metric-ytd').textContent = `${ytd > 0 ? '+' : ''}${ytd.toFixed(1)}%`;
      document.getElementById('metric-price').textContent = `$${this.stockData.price?.toFixed(2) || '--'}`;
    }

    if (this.locationData) {
      document.getElementById('metric-units').textContent = this.locationData.length;
      document.getElementById('metric-growth').textContent = '+5% (estimated)'; // Placeholder
    }

    // Top markets
    const topMarketsHtml = `<p>Top markets for ${this.currentBrand}: Data shows distribution across multiple states.</p>`;
    document.getElementById('top-markets').innerHTML = topMarketsHtml;
  }

  updateLocationTab(marketMetrics) {
    document.getElementById('metric-density').textContent = marketMetrics.unitsPerCapita.toFixed(2);
    document.getElementById('metric-competitors').textContent = marketMetrics.competitorCount;
    document.getElementById('metric-site-score').textContent = marketMetrics.avgSiteScore.toFixed(1);
    document.getElementById('metric-income').textContent = '$50,000 - $80,000 (avg)'; // Placeholder
  }

  updateEconomicsTab() {
    // Placeholder economics data
    document.getElementById('metric-revenue').textContent = 'Data not available';
    document.getElementById('metric-margin').textContent = 'Data not available';
    document.getElementById('metric-net-income').textContent = 'Data not available';
    document.getElementById('metric-investment').textContent = 'Data not available';
    document.getElementById('metric-breakeven').textContent = 'Data not available';
  }

  updateRiskTab(scoreResult, inputs) {
    const riskContainer = document.getElementById('risk-factors');
    const riskFactors = [];

    // Generate risk factors based on metrics
    const density = inputs.marketData.unitsPerCapita;
    const competitors = inputs.marketData.competitorCount;
    const siteScore = inputs.siteQualityScore;
    const stockPerf = inputs.stockData.ytdPercent;

    if (density > 2.5) {
      riskFactors.push({
        title: 'Market Saturation',
        description: `High unit density (${density.toFixed(2)} per 100k) suggests market saturation.`,
        type: 'warning'
      });
    }

    if (competitors >= 8) {
      riskFactors.push({
        title: 'High Competition',
        description: `${competitors} direct competitors within 5 miles indicates intense local competition.`,
        type: 'warning'
      });
    }

    if (siteScore < 50) {
      riskFactors.push({
        title: 'Below-Average Site Quality',
        description: `Average site scores are low (${siteScore.toFixed(1)}/100), indicating weaker locations.`,
        type: 'warning'
      });
    }

    if (stockPerf < -10) {
      riskFactors.push({
        title: 'Weak Brand Performance',
        description: `Stock down ${stockPerf.toFixed(1)}% YTD indicates investor concerns.`,
        type: 'danger'
      });
    }

    // Positive factors
    if (density < 1.0) {
      riskFactors.push({
        title: 'Low Market Saturation',
        description: `Market density is low (${density.toFixed(2)} per 100k), suggesting growth potential.`,
        type: 'success'
      });
    }

    if (stockPerf > 10) {
      riskFactors.push({
        title: 'Strong Brand Momentum',
        description: `Stock up ${stockPerf.toFixed(1)}% YTD shows investor confidence.`,
        type: 'success'
      });
    }

    if (siteScore >= 80) {
      riskFactors.push({
        title: 'Strong Site Quality',
        description: `Above-average site scores (${siteScore.toFixed(1)}/100) indicate high-quality locations.`,
        type: 'success'
      });
    }

    if (riskFactors.length === 0) {
      riskContainer.innerHTML = '<p>Select a brand and market to see risk factors.</p>';
      return;
    }

    riskContainer.innerHTML = riskFactors
      .map(factor => `
        <div class="risk-factor ${factor.type}">
          <h4>${factor.title}</h4>
          <p>${factor.description}</p>
        </div>
      `)
      .join('');
  }

  switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    // Deactivate all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const tabPane = document.getElementById(`tab-${tabName}`);
    if (tabPane) {
      tabPane.classList.add('active');
    }

    // Activate corresponding button
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
  }

  clearEvaluation() {
    document.getElementById('opportunity-score').textContent = '--';
    document.getElementById('opportunity-label').textContent = '--';
    document.getElementById('opportunity-description').textContent = 'Select a brand and market to calculate the score';
    document.getElementById('insights-list').innerHTML = '<li>Select a brand and market to see insights</li>';
  }

  updateQueryParams(params) {
    const searchParams = new URLSearchParams(window.location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new EvaluationPage();
});
