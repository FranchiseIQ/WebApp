/**
 * Unit Economics Calculator
 * Advanced financial modeling for franchise unit-level economics
 */

const UnitEconomicsCalculator = (() => {
  'use strict';

  // Industry benchmark data by category
  const BENCHMARKS = {
    QSR: {
      avgUnitRevenue: 1200000,
      revenueLow: 800000,
      revenueHigh: 2500000,
      operatingMargin: 0.15,
      laborCost: 0.30,
      foodCost: 0.28,
      occupancyCost: 0.08,
      otherCost: 0.19,
      initialInvestment: 600000,
      breakEvenMonths: 24
    },
    Hospitality: {
      avgUnitRevenue: 2800000,
      revenueLow: 1500000,
      revenueHigh: 5000000,
      operatingMargin: 0.20,
      laborCost: 0.35,
      operatingCost: 0.40,
      utilities: 0.05,
      otherCost: 0.10,
      initialInvestment: 2500000,
      breakEvenMonths: 36
    },
    AutoServices: {
      avgUnitRevenue: 1400000,
      revenueLow: 700000,
      revenueHigh: 2500000,
      operatingMargin: 0.22,
      laborCost: 0.25,
      materialCost: 0.35,
      occupancyCost: 0.10,
      otherCost: 0.08,
      initialInvestment: 350000,
      breakEvenMonths: 18
    }
  };

  /**
   * Calculate unit economics based on assumptions
   */
  function calculateUnitEconomics(inputs) {
    const {
      category = 'QSR',
      annualRevenue = null,
      operatingMargin = null,
      laborCostPercent = null,
      occupancyCostPercent = null,
      initialInvestment = null,
      discountRate = 0.10,
      yearsToAnalyze = 5
    } = inputs;

    const benchmark = BENCHMARKS[category] || BENCHMARKS.QSR;

    // Use inputs or defaults
    const revenue = annualRevenue || benchmark.avgUnitRevenue;
    const margin = operatingMargin !== null ? operatingMargin : benchmark.operatingMargin;
    const investment = initialInvestment || benchmark.initialInvestment;

    // Calculate costs
    const operatingIncome = revenue * margin;
    const totalCosts = revenue * (1 - margin);
    const laborCost = laborCostPercent !== null
      ? revenue * (laborCostPercent / 100)
      : revenue * benchmark.laborCost;

    // Calculate other metrics
    const netIncome = operatingIncome;
    const cashOnCash = (netIncome / investment) * 100;
    const paybackMonths = (investment / (netIncome / 12));

    // Calculate 5-year NPV
    let npv = -investment;
    for (let year = 1; year <= yearsToAnalyze; year++) {
      const futureValue = netIncome * Math.pow(1 + discountRate, year);
      npv += netIncome / Math.pow(1 + discountRate, year);
    }

    return {
      annualRevenue: revenue,
      operatingMargin: margin * 100,
      operatingIncome: operatingIncome,
      laborCost: laborCost,
      totalCosts: totalCosts,
      netIncome: netIncome,
      initialInvestment: investment,
      cashOnCash: cashOnCash,
      paybackMonths: paybackMonths,
      npvFiveYear: npv,
      irr: calculateIRR(investment, netIncome, yearsToAnalyze)
    };
  }

  /**
   * Calculate IRR (simplified)
   */
  function calculateIRR(investment, annualCashFlow, years) {
    // Simplified IRR calculation
    // In production, would use Newton-Raphson method
    const totalCashIn = annualCashFlow * years;
    const roi = (totalCashIn - investment) / investment;
    return (roi / years) * 100;
  }

  /**
   * Format currency
   */
  function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Create financial modeling UI
   */
  function createModelingPanel(category = 'QSR') {
    const benchmark = BENCHMARKS[category] || BENCHMARKS.QSR;

    return `
      <div class="economics-modeling-panel">
        <div class="modeling-section">
          <h4>Revenue Assumptions</h4>
          <div class="input-group">
            <label for="annual-revenue">Annual Unit Revenue:</label>
            <div class="input-with-help">
              <input type="number" id="annual-revenue" class="modeling-input"
                value="${benchmark.avgUnitRevenue}" min="0" step="10000">
              <span class="help-text">Range: ${formatCurrency(benchmark.revenueLow)} - ${formatCurrency(benchmark.revenueHigh)}</span>
            </div>
          </div>
          <div class="input-group">
            <label for="operating-margin">Operating Margin (%):</label>
            <div class="input-with-help">
              <input type="number" id="operating-margin" class="modeling-input"
                value="${(benchmark.operatingMargin * 100).toFixed(1)}" min="0" max="100" step="0.1">
              <span class="help-text">Industry average: ${(benchmark.operatingMargin * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div class="modeling-section">
          <h4>Cost Assumptions</h4>
          <div class="input-group">
            <label for="labor-cost">Labor Cost (%):</label>
            <input type="number" id="labor-cost" class="modeling-input"
              value="${(benchmark.laborCost * 100).toFixed(1)}" min="0" max="100" step="0.1">
          </div>
          <div class="input-group">
            <label for="occupancy-cost">Occupancy Cost (%):</label>
            <input type="number" id="occupancy-cost" class="modeling-input"
              value="${(benchmark.occupancyCost * 100).toFixed(1)}" min="0" max="100" step="0.1">
          </div>
        </div>

        <div class="modeling-section">
          <h4>Investment & Returns</h4>
          <div class="input-group">
            <label for="initial-investment">Initial Investment:</label>
            <input type="number" id="initial-investment" class="modeling-input"
              value="${benchmark.initialInvestment}" min="0" step="10000">
          </div>
          <div class="input-group">
            <label for="discount-rate">Discount Rate (%):</label>
            <input type="number" id="discount-rate" class="modeling-input"
              value="10" min="0" max="100" step="0.1">
          </div>
        </div>

        <button id="calculate-economics-btn" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
          Calculate Economics
        </button>

        <div id="economics-results" style="display: none; margin-top: 24px;">
          <!-- Results will be inserted here -->
        </div>
      </div>
    `;
  }

  /**
   * Display calculated results
   */
  function displayResults(results) {
    const resultsDiv = document.getElementById('economics-results');
    if (!resultsDiv) return;

    const html = `
      <div class="economics-results">
        <div class="results-grid">
          <div class="result-item">
            <span class="result-label">Annual Revenue</span>
            <span class="result-value">${formatCurrency(results.annualRevenue)}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Operating Margin</span>
            <span class="result-value">${results.operatingMargin.toFixed(1)}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Annual Net Income</span>
            <span class="result-value">${formatCurrency(results.netIncome)}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Initial Investment</span>
            <span class="result-value">${formatCurrency(results.initialInvestment)}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Cash-on-Cash Return</span>
            <span class="result-value">${results.cashOnCash.toFixed(1)}%</span>
          </div>
          <div class="result-item">
            <span class="result-label">Payback Period</span>
            <span class="result-value">${results.paybackMonths.toFixed(1)} months</span>
          </div>
          <div class="result-item">
            <span class="result-label">5-Year NPV</span>
            <span class="result-value">${formatCurrency(results.npvFiveYear)}</span>
          </div>
          <div class="result-item">
            <span class="result-label">Estimated IRR</span>
            <span class="result-value">${results.irr.toFixed(1)}%</span>
          </div>
        </div>

        <div class="results-summary">
          <h4>Financial Summary</h4>
          <ul>
            <li>Annual labor cost: ${formatCurrency(results.laborCost)}</li>
            <li>Total operating costs: ${formatCurrency(results.totalCosts)}</li>
            <li>Monthly net income: ${formatCurrency(results.netIncome / 12)}</li>
            <li>ROI in first 5 years: ${((results.npvFiveYear / results.initialInvestment) * 100).toFixed(1)}%</li>
          </ul>
        </div>
      </div>
    `;

    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';

    // Initialize financial visualizations if module is available
    if (typeof FinancialVisualizations !== 'undefined') {
      const tabElement = document.getElementById('tab-economics');
      if (tabElement) {
        // Remove any existing visualizations section
        const existingViz = document.getElementById('financial-visualizations');
        if (existingViz) existingViz.remove();

        // Initialize visualizations
        FinancialVisualizations.initializeVisualizations(tabElement, results);
      }
    }
  }

  /**
   * Initialize calculator in DOM
   */
  function initializeCalculator(category = 'QSR') {
    const tabContent = document.getElementById('tab-economics');
    if (!tabContent) return;

    // Insert modeling panel
    const insertPoint = tabContent.querySelector('.economics-card:last-of-type');
    if (insertPoint) {
      insertPoint.insertAdjacentHTML('afterend', createModelingPanel(category));
    }

    // Attach calculate button handler
    const calculateBtn = document.getElementById('calculate-economics-btn');
    if (calculateBtn) {
      calculateBtn.addEventListener('click', () => {
        const revenue = parseFloat(document.getElementById('annual-revenue').value);
        const margin = parseFloat(document.getElementById('operating-margin').value) / 100;
        const investment = parseFloat(document.getElementById('initial-investment').value);
        const discountRate = parseFloat(document.getElementById('discount-rate').value) / 100;

        const results = calculateUnitEconomics({
          category,
          annualRevenue: revenue,
          operatingMargin: margin,
          initialInvestment: investment,
          discountRate: discountRate
        });

        displayResults(results);
      });
    }
  }

  // Public API
  return {
    calculateUnitEconomics,
    formatCurrency,
    createModelingPanel,
    displayResults,
    initializeCalculator,
    BENCHMARKS
  };
})();
