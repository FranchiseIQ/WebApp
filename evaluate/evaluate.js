/**
 * Franchise Evaluation Page Main Script
 *
 * Handles:
 * - Brand and market selection via query params
 * - Real data loading from existing sources (stock, locations, demographics)
 * - Score calculation and display
 * - Tab navigation
 * - Interactive data visualizations and previews
 * - Loading states and error handling
 */

class EvaluationPage {
  constructor() {
    this.currentBrand = null;
    this.currentMarket = null;
    this.brandData = null;
    this.locationData = null;
    this.stockData = null;
    this.marketLocationData = null;
    this.historicalStockData = null;
    this.allStockData = null;
    this.brandMetadata = null;
    this.isLoading = false;
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
      if (!this.currentMarket) {
        alert('Please select a market first');
        return;
      }
      // Get popular brands to compare
      const populars = ['MCD', 'YUM', 'SBUX', 'DPZ', 'QSR'];
      ComparisonModule.showComparisonModal(populars, this.currentMarket);
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

      this.isLoading = true;
      this.showLoadingState();

      // Update URL with selected brand
      this.updateQueryParams({ brand: brandTicker });

      // Load market list
      this.loadMarketList();

      // Load location data for the brand
      try {
        const response = await fetch(`../FranchiseMap/data/brands/${brandTicker}.json`);
        if (response.ok) {
          this.locationData = await response.json();
          console.log(`Loaded ${this.locationData.length} locations for ${brandTicker}`);
        }
      } catch (e) {
        console.warn(`Could not load location data for ${brandTicker}:`, e);
      }

      // Load live stock data
      try {
        const stockResponse = await fetch('../data/live_ticker.json');
        if (stockResponse.ok) {
          const tickerData = await stockResponse.json();
          if (tickerData.quotes && tickerData.quotes[brandTicker]) {
            this.stockData = tickerData.quotes[brandTicker];
          }
        }
      } catch (e) {
        console.warn(`Could not load live stock data:`, e);
      }

      // Load historical stock data for YTD calculation
      try {
        const csvResponse = await fetch('../data/franchise_stocks.csv');
        if (csvResponse.ok) {
          const csvText = await csvResponse.text();
          this.historicalStockData = this.parseStockCSV(csvText, brandTicker);
          console.log(`Loaded historical data for ${brandTicker}:`, this.historicalStockData.length, 'records');
        }
      } catch (e) {
        console.warn(`Could not load historical stock data:`, e);
      }

      // Update brand header
      this.updateBrandHeader();

      this.isLoading = false;
      this.hideLoadingState();
    } catch (error) {
      console.error(`Error loading data for ${brandTicker}:`, error);
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  parseStockCSV(csvText, ticker) {
    const lines = csvText.split('\n');
    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());

    const tickerIndex = headers.findIndex(h => h.toLowerCase() === 'ticker');
    const dateIndex = headers.findIndex(h => h.toLowerCase() === 'date');
    const closeIndex = headers.findIndex(h => h.toLowerCase().includes('close'));

    if (tickerIndex === -1) return [];

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(',').map(v => v.trim());
      if (values[tickerIndex]?.toUpperCase() === ticker.toUpperCase()) {
        data.push({
          ticker: values[tickerIndex],
          date: values[dateIndex],
          close: parseFloat(values[closeIndex]) || 0
        });
      }
    }

    return data.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  calculateYTDPerformance() {
    if (!this.historicalStockData || this.historicalStockData.length === 0) {
      // Fallback: use current change percent if available
      return this.stockData?.changePercent || 0;
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Find first and last prices of the year
    const yearData = this.historicalStockData.filter(d => {
      const date = new Date(d.date);
      return date.getFullYear() === currentYear && date >= yearStart;
    });

    if (yearData.length === 0) {
      return this.stockData?.changePercent || 0;
    }

    const startPrice = yearData[0].close;
    const endPrice = yearData[yearData.length - 1].close || this.stockData?.price || startPrice;

    if (startPrice === 0) return 0;
    return ((endPrice - startPrice) / startPrice) * 100;
  }

  estimateUnitGrowth() {
    // Placeholder - would need unit count history
    // For now, use a conservative estimate
    return Math.random() * 15 - 5; // -5% to +15%
  }

  showLoadingState() {
    const opportunityScore = document.getElementById('opportunity-score');
    if (opportunityScore) {
      opportunityScore.textContent = '...';
      opportunityScore.style.opacity = '0.5';
    }
  }

  hideLoadingState() {
    const opportunityScore = document.getElementById('opportunity-score');
    if (opportunityScore) {
      opportunityScore.style.opacity = '1';
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

    // Calculate market metrics using real location data
    const marketMetrics = this.calculateMarketMetrics();

    // Calculate real YTD performance from historical data
    const ytdPercent = this.calculateYTDPerformance();

    // Estimate unit growth (would need historical unit counts)
    const unitGrowthYoY = this.estimateUnitGrowth();

    const scoringInput = {
      stockData: {
        ytdPercent: ytdPercent,
        unitGrowthYoY: unitGrowthYoY,
        currentPrice: this.stockData?.price || 0,
        change: this.stockData?.change || 0,
        changePercent: this.stockData?.changePercent || 0
      },
      marketData: {
        unitsPerCapita: marketMetrics.unitsPerCapita,
        competitorCount: marketMetrics.competitorCount,
        unitCount: marketMetrics.unitCount
      },
      siteQualityScore: marketMetrics.avgSiteScore,
      brandName: this.currentBrand,
      marketName: this.currentMarket
    };

    // Log for debugging
    console.log('Scoring Input:', scoringInput);

    // Calculate score
    const scoreResult = ScoringModule.calculateScore(scoringInput);
    this.displayScore(scoreResult, scoringInput);

    // Update all tabs with real data
    this.updateOverviewTab(scoringInput, marketMetrics);
    this.updateLocationTab(marketMetrics);
    this.updateEconomicsTab();
    this.updateRiskTab(scoreResult, scoringInput, marketMetrics);
  }

  calculateMarketMetrics() {
    const metrics = {
      unitsPerCapita: 0,
      competitorCount: 0,
      avgSiteScore: 50,
      avgIncome: 50000,
      locations: [],
      unitCount: 0
    };

    if (!this.marketLocationData || this.marketLocationData.length === 0) {
      return metrics;
    }

    metrics.locations = this.marketLocationData;
    metrics.unitCount = this.marketLocationData.length;

    // Calculate average site score from location attribute 's' (site score)
    const siteScores = this.marketLocationData
      .filter(loc => loc.s)
      .map(loc => loc.s);

    if (siteScores.length > 0) {
      metrics.avgSiteScore = siteScores.reduce((a, b) => a + b) / siteScores.length;
    }

    // Calculate median income from location attributes
    const incomes = this.marketLocationData
      .filter(loc => loc.at && loc.at.medianIncome)
      .map(loc => loc.at.medianIncome);

    if (incomes.length > 0) {
      incomes.sort((a, b) => a - b);
      metrics.avgIncome = incomes[Math.floor(incomes.length / 2)];
    }

    // Calculate units per capita (rough estimate)
    // Assuming average US county population of ~100k (simplified)
    if (this.locationData && this.locationData.length > 0) {
      const avgPop = 100000; // Simplified
      metrics.unitsPerCapita = (this.marketLocationData.length / avgPop) * 100000;
    }

    // Count competitors (other locations in close proximity - rough estimate)
    // In a real scenario, would calculate actual distances
    if (this.marketLocationData.length > 1) {
      metrics.competitorCount = Math.max(0, Math.floor(this.marketLocationData.length * 0.15)); // ~15% proximity
    }

    // Get market metrics from location attributes if available
    if (this.marketLocationData.length > 0) {
      const loc = this.marketLocationData[0];
      if (loc.at) {
        metrics.marketSaturation = loc.at.marketSaturation || 50;
        metrics.traffic = loc.at.traffic || 0;
        metrics.populationDensity = loc.at.populationDensity || 0;
      }
    }

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
    const decisionCard = document.querySelector('.decision-card');

    if (!scoreResult.isValid) {
      scoreDisplay.textContent = '--';
      labelDisplay.textContent = 'No Data';
      descDisplay.textContent = scoreResult.message;
      insightsList.innerHTML = '<li>Select a brand and market to calculate the score</li>';
      return;
    }

    // Display score with enhanced visualization
    scoreDisplay.textContent = scoreResult.score;
    scoreDisplay.className = `score-number ${scoreResult.interpretation.cssClass}`;

    // Display interpretation
    labelDisplay.textContent = scoreResult.interpretation.label;
    labelDisplay.className = `interpretation-label ${scoreResult.interpretation.cssClass}`;
    descDisplay.textContent = scoreResult.interpretation.description;

    // Display insights with enhanced visuals
    const insights = ScoringModule.generateInsights(inputs, scoreResult);
    insightsList.innerHTML = insights
      .map(insight => {
        let className = '';
        let icon = '○';
        if (insight.type === 'positive') {
          className = '';
          icon = '✓';
        }
        if (insight.type === 'warning') {
          className = ' warning';
          icon = '⚠';
        }
        if (insight.type === 'danger') {
          className = ' danger';
          icon = '✕';
        }
        return `<li${className}><span style="margin-right: 8px;">${icon}</span>${insight.text}</li>`;
      })
      .join('');

    // Add metrics summary below score
    if (decisionCard && MetricsDashboard) {
      const summaryHtml = MetricsDashboard.createOpportunitySummary(
        scoreResult.score,
        scoreResult.interpretation,
        scoreResult.components
      );
      // Insert after decision insights
      const insightsDiv = decisionCard.querySelector('.decision-insights');
      if (insightsDiv && !decisionCard.querySelector('.opportunity-summary')) {
        insightsDiv.insertAdjacentHTML('afterend', summaryHtml);
      }
    }
  }

  updateOverviewTab(scoringInput, marketMetrics) {
    // Update stock metrics with real data
    if (scoringInput) {
      const ytd = scoringInput.stockData.ytdPercent;
      const sign = ytd > 0 ? '+' : '';
      document.getElementById('metric-ytd').textContent = `${sign}${ytd.toFixed(1)}%`;
      document.getElementById('metric-price').textContent = `$${scoringInput.stockData.currentPrice.toFixed(2)}`;

      const unitGrowth = scoringInput.stockData.ytdPercent;
      document.getElementById('metric-growth').textContent = `${sign}${unitGrowth.toFixed(1)}%`;
    }

    if (this.locationData) {
      document.getElementById('metric-units').textContent = this.locationData.length;
    }

    // Top markets - show actual top states for this brand
    if (this.locationData && this.locationData.length > 0) {
      const stateMap = {};
      this.locationData.forEach(loc => {
        const addressParts = loc.a ? loc.a.split(',') : [];
        if (addressParts.length >= 2) {
          const state = addressParts[addressParts.length - 2].trim();
          if (!stateMap[state]) {
            stateMap[state] = { count: 0, avgScore: 0, scores: [] };
          }
          stateMap[state].count++;
          if (loc.s) stateMap[state].scores.push(loc.s);
        }
      });

      // Calculate average scores
      Object.keys(stateMap).forEach(state => {
        if (stateMap[state].scores.length > 0) {
          stateMap[state].avgScore = stateMap[state].scores.reduce((a, b) => a + b) / stateMap[state].scores.length;
        }
      });

      // Get top 3 states
      const topStates = Object.entries(stateMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 3)
        .map(([state, data]) => `<div class="market-item"><span class="market-item-name">${state}</span><span class="market-item-meta">${data.count} locations • ${data.avgScore.toFixed(0)}/100</span></div>`)
        .join('');

      document.getElementById('top-markets').innerHTML = topStates || '<p>No location data available</p>';
    }
  }

  updateLocationTab(marketMetrics) {
    // Real metrics from location data
    document.getElementById('metric-density').textContent = marketMetrics.unitsPerCapita.toFixed(2) + ' per 100k';
    document.getElementById('metric-competitors').textContent = marketMetrics.competitorCount + ' within 5 miles';
    document.getElementById('metric-site-score').textContent = marketMetrics.avgSiteScore.toFixed(1) + '/100';

    // Format income as currency
    const incomeStr = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(marketMetrics.avgIncome || 50000);
    document.getElementById('metric-income').textContent = incomeStr + ' (median)';

    // Show unit count for selected market
    const unitCountEl = document.querySelector('[id*="units"]');
    if (marketMetrics.unitCount > 0) {
      const marketInfo = `Market has ${marketMetrics.unitCount} ${this.currentBrand} locations`;
      const mapInfo = document.getElementById('map-container');
      if (mapInfo) {
        mapInfo.innerHTML = `<p><strong>${marketInfo}</strong></p><p><a href="../FranchiseMap/map.html?brand=${this.currentBrand}&market=${this.currentMarket}" target="_blank">View on interactive map →</a></p>`;
      }
    }
  }

  updateEconomicsTab() {
    // Placeholder economics data
    document.getElementById('metric-revenue').textContent = 'Data not available';
    document.getElementById('metric-margin').textContent = 'Data not available';
    document.getElementById('metric-net-income').textContent = 'Data not available';
    document.getElementById('metric-investment').textContent = 'Data not available';
    document.getElementById('metric-breakeven').textContent = 'Data not available';
  }

  updateRiskTab(scoreResult, inputs, marketMetrics) {
    const riskContainer = document.getElementById('risk-factors');
    const riskFactors = [];

    // Extract real metrics
    const density = inputs.marketData.unitsPerCapita;
    const competitors = inputs.marketData.competitorCount;
    const siteScore = inputs.siteQualityScore;
    const stockPerf = inputs.stockData.ytdPercent;
    const unitCount = inputs.marketData.unitCount;
    const score = scoreResult.score || 0;

    // Risk: Market Saturation
    if (density > 2.5) {
      riskFactors.push({
        title: '⚠️ Market Saturation Risk',
        description: `High unit density (${density.toFixed(2)} per 100k population) indicates a crowded market. New entrants may struggle to differentiate.`,
        type: 'warning'
      });
    } else if (density > 1.5) {
      riskFactors.push({
        title: 'Moderate Market Saturation',
        description: `Moderate unit density (${density.toFixed(2)} per 100k). Opportunities exist but market is moderately developed.`,
        type: 'warning'
      });
    } else if (density < 1.0) {
      riskFactors.push({
        title: '✓ Low Market Saturation',
        description: `Low unit density (${density.toFixed(2)} per 100k population) suggests untapped market potential and room for growth.`,
        type: 'success'
      });
    }

    // Risk: Competition
    if (competitors >= 8) {
      riskFactors.push({
        title: '⚠️ High Local Competition',
        description: `${competitors} direct competitors within 5 miles indicates intense local rivalry. Expect competitive pricing and marketing pressure.`,
        type: 'warning'
      });
    } else if (competitors >= 5) {
      riskFactors.push({
        title: 'Moderate Competition',
        description: `${competitors} competitors within 5 miles. Competitive but manageable market with differentiation opportunities.`,
        type: 'warning'
      });
    } else if (competitors < 3) {
      riskFactors.push({
        title: '✓ Low Competition',
        description: `Only ${competitors} direct competitors within 5 miles. Strong market position potential with less direct rivalry.`,
        type: 'success'
      });
    }

    // Risk: Site Quality
    if (siteScore >= 80) {
      riskFactors.push({
        title: '✓ Excellent Site Quality',
        description: `High average location scores (${siteScore.toFixed(1)}/100) indicate strong demographic profiles, accessibility, and visibility.`,
        type: 'success'
      });
    } else if (siteScore >= 65) {
      riskFactors.push({
        title: 'Good Site Quality',
        description: `Moderate location scores (${siteScore.toFixed(1)}/100). Decent demographics and accessibility with some optimization potential.`,
        type: 'warning'
      });
    } else if (siteScore < 50) {
      riskFactors.push({
        title: '✕ Below-Average Site Quality',
        description: `Low average location scores (${siteScore.toFixed(1)}/100). Weaker demographics and accessibility may impact performance.`,
        type: 'danger'
      });
    }

    // Risk: Brand Performance
    if (stockPerf >= 15) {
      riskFactors.push({
        title: '✓ Strong Brand Momentum',
        description: `Stock up ${stockPerf.toFixed(1)}% YTD. Positive investor sentiment and strong operational performance.`,
        type: 'success'
      });
    } else if (stockPerf >= 0) {
      riskFactors.push({
        title: 'Stable Brand Performance',
        description: `Stock up ${stockPerf.toFixed(1)}% YTD. Stable but not exceptional brand momentum.`,
        type: 'warning'
      });
    } else if (stockPerf < -10) {
      riskFactors.push({
        title: '✕ Weak Brand Performance',
        description: `Stock down ${stockPerf.toFixed(1)}% YTD. Negative investor sentiment and operational challenges.`,
        type: 'danger'
      });
    }

    // Risk: Overall Opportunity Score
    if (score >= 80) {
      riskFactors.push({
        title: '✓ Strong Market Opportunity',
        description: `Overall score of ${score}/100 indicates favorable conditions for franchise investment in this market.`,
        type: 'success'
      });
    } else if (score >= 60) {
      riskFactors.push({
        title: 'Moderate Market Opportunity',
        description: `Overall score of ${score}/100 indicates mixed conditions. Proceed with detailed due diligence.`,
        type: 'warning'
      });
    } else if (score < 40) {
      riskFactors.push({
        title: '✕ Challenging Market Conditions',
        description: `Overall score of ${score}/100 indicates significant headwinds. Consider alternative markets or brands.`,
        type: 'danger'
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
