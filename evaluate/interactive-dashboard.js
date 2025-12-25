/**
 * Interactive Dashboard Controls Module
 * Adds real-time sliders, toggles, and filters to existing dashboards
 */

const InteractiveDashboard = (() => {
  'use strict';

  /**
   * Create interactive assumption sliders for financial modeling
   */
  function createFinancialSliders(initialResults) {
    return `
      <div class="dashboard-controls">
        <h4>Financial Assumptions (Adjust to See Impact)</h4>

        <div class="sliders-container">
          <div class="slider-group">
            <label class="slider-label">
              <span class="slider-name">Annual Revenue</span>
              <span class="slider-value">$<span id="revenue-display">${(initialResults.annualRevenue / 1000000).toFixed(2)}</span>M</span>
            </label>
            <input type="range" id="revenue-slider" class="slider"
                   min="500000" max="5000000" step="50000"
                   value="${initialResults.annualRevenue}">
            <div class="slider-range">
              <span>$0.5M</span>
              <span>$5M</span>
            </div>
          </div>

          <div class="slider-group">
            <label class="slider-label">
              <span class="slider-name">Operating Margin</span>
              <span class="slider-value"><span id="margin-display">${initialResults.operatingMargin.toFixed(1)}</span>%</span>
            </label>
            <input type="range" id="margin-slider" class="slider"
                   min="5" max="40" step="0.5"
                   value="${initialResults.operatingMargin}">
            <div class="slider-range">
              <span>5%</span>
              <span>40%</span>
            </div>
          </div>

          <div class="slider-group">
            <label class="slider-label">
              <span class="slider-name">Initial Investment</span>
              <span class="slider-value">$<span id="investment-display">${(initialResults.initialInvestment / 1000).toFixed(0)}</span>k</span>
            </label>
            <input type="range" id="investment-slider" class="slider"
                   min="100000" max="1000000" step="25000"
                   value="${initialResults.initialInvestment}">
            <div class="slider-range">
              <span>$100k</span>
              <span>$1M</span>
            </div>
          </div>

          <div class="slider-group">
            <label class="slider-label">
              <span class="slider-name">Discount Rate (NPV)</span>
              <span class="slider-value"><span id="discount-display">10</span>%</span>
            </label>
            <input type="range" id="discount-slider" class="slider"
                   min="5" max="20" step="0.5"
                   value="10">
            <div class="slider-range">
              <span>5%</span>
              <span>20%</span>
            </div>
          </div>

          <div class="slider-group">
            <label class="slider-label">
              <span class="slider-name">Labor Cost %</span>
              <span class="slider-value"><span id="labor-display">30</span>%</span>
            </label>
            <input type="range" id="labor-slider" class="slider"
                   min="15" max="50" step="1"
                   value="30">
            <div class="slider-range">
              <span>15%</span>
              <span>50%</span>
            </div>
          </div>
        </div>

        <div class="slider-actions">
          <button class="reset-btn" id="reset-sliders">Reset to Base Case</button>
          <button class="apply-btn" id="apply-changes">Recalculate Impact</button>
        </div>

        <div class="impact-summary" id="impact-summary">
          <h5>Impact of Changes</h5>
          <div class="impact-metrics">
            <div class="impact-item">
              <span class="impact-label">New Operating Margin:</span>
              <span class="impact-value"><span id="new-margin">0</span>%</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">New Annual Income:</span>
              <span class="impact-value">$<span id="new-income">0</span>k</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">Payback Impact:</span>
              <span class="impact-value"><span id="payback-impact">0</span> months</span>
            </div>
            <div class="impact-item">
              <span class="impact-label">ROI Impact:</span>
              <span class="impact-value"><span id="roi-impact">0</span>%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create metric toggle switches for dashboard views
   */
  function createMetricToggles() {
    return `
      <div class="metric-toggles">
        <div class="toggle-label">Display Options:</div>
        <label class="toggle-switch">
          <input type="checkbox" class="metric-toggle" data-metric="revenue" checked>
          <span class="toggle-slider"></span>
          <span class="toggle-text">Revenue</span>
        </label>
        <label class="toggle-switch">
          <input type="checkbox" class="metric-toggle" data-metric="costs" checked>
          <span class="toggle-slider"></span>
          <span class="toggle-text">Costs</span>
        </label>
        <label class="toggle-switch">
          <input type="checkbox" class="metric-toggle" data-metric="profit" checked>
          <span class="toggle-slider"></span>
          <span class="toggle-text">Profit</span>
        </label>
        <label class="toggle-switch">
          <input type="checkbox" class="metric-toggle" data-metric="roi" checked>
          <span class="toggle-slider"></span>
          <span class="toggle-text">ROI</span>
        </label>
      </div>
    `;
  }

  /**
   * Create demographic filter controls
   */
  function createDemographicFilters() {
    return `
      <div class="filter-controls">
        <h4>Filter by Market Characteristics</h4>

        <div class="filter-group">
          <label>Minimum Median Income</label>
          <div class="filter-input-group">
            <input type="range" id="income-filter" min="30000" max="150000" step="5000" value="50000">
            <span id="income-filter-display">$50,000</span>
          </div>
        </div>

        <div class="filter-group">
          <label>Population Density Range</label>
          <div class="filter-input-group">
            <input type="range" id="density-filter" min="0" max="1000" step="50" value="100">
            <span id="density-filter-display">100 per sq mi</span>
          </div>
        </div>

        <div class="filter-group">
          <label>Growth Rate Minimum</label>
          <div class="filter-input-group">
            <input type="range" id="growth-filter" min="-5" max="10" step="0.5" value="1">
            <span id="growth-filter-display">1%</span>
          </div>
        </div>

        <div class="filter-group">
          <label>Employment Rate Minimum</label>
          <div class="filter-input-group">
            <input type="range" id="employment-filter" min="90" max="98" step="0.5" value="95">
            <span id="employment-filter-display">95%</span>
          </div>
        </div>

        <div class="filter-actions">
          <button class="apply-filters-btn">Apply Filters</button>
          <button class="clear-filters-btn">Clear All</button>
        </div>

        <div class="filter-summary">
          <p id="filter-count">No filters applied</p>
        </div>
      </div>
    `;
  }

  /**
   * Create comparison mode toggle
   */
  function createComparisonToggle() {
    return `
      <div class="comparison-controls">
        <label class="toggle-switch large">
          <input type="checkbox" id="comparison-mode" class="mode-toggle">
          <span class="toggle-slider"></span>
          <span class="toggle-text">Side-by-Side Comparison Mode</span>
        </label>
        <p class="toggle-description">Compare brands or markets simultaneously</p>
      </div>
    `;
  }

  /**
   * Create chart view options
   */
  function createChartViewOptions() {
    return `
      <div class="view-options">
        <div class="view-label">Chart View:</div>
        <div class="view-buttons">
          <button class="view-btn active" data-view="summary">
            <span class="icon">📊</span>Summary
          </button>
          <button class="view-btn" data-view="detailed">
            <span class="icon">📈</span>Detailed
          </button>
          <button class="view-btn" data-view="comparison">
            <span class="icon">⚖️</span>Comparison
          </button>
          <button class="view-btn" data-view="forecast">
            <span class="icon">🔮</span>Forecast
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Initialize sliders with event listeners
   */
  function initializeSliders(onChangeCallback) {
    const revenueSlider = document.getElementById('revenue-slider');
    const marginSlider = document.getElementById('margin-slider');
    const investmentSlider = document.getElementById('investment-slider');
    const discountSlider = document.getElementById('discount-slider');
    const laborSlider = document.getElementById('labor-slider');

    if (!revenueSlider) return;

    // Update display values on slider change
    const updateDisplay = () => {
      if (revenueSlider) document.getElementById('revenue-display').textContent =
        (revenueSlider.value / 1000000).toFixed(2);
      if (marginSlider) document.getElementById('margin-display').textContent =
        marginSlider.value;
      if (investmentSlider) document.getElementById('investment-display').textContent =
        (investmentSlider.value / 1000).toFixed(0);
      if (discountSlider) document.getElementById('discount-display').textContent =
        discountSlider.value;
      if (laborSlider) document.getElementById('labor-display').textContent =
        laborSlider.value;
    };

    // Add input event listeners
    [revenueSlider, marginSlider, investmentSlider, discountSlider, laborSlider].forEach(slider => {
      if (slider) {
        slider.addEventListener('input', updateDisplay);
      }
    });

    // Apply changes button
    const applyBtn = document.getElementById('apply-changes');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const newValues = {
          revenue: parseFloat(revenueSlider.value),
          margin: parseFloat(marginSlider.value),
          investment: parseFloat(investmentSlider.value),
          discount: parseFloat(discountSlider.value),
          labor: parseFloat(laborSlider.value)
        };
        onChangeCallback(newValues);
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-sliders');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        revenueSlider.value = revenueSlider.getAttribute('data-initial') || revenueSlider.value;
        marginSlider.value = marginSlider.getAttribute('data-initial') || marginSlider.value;
        investmentSlider.value = investmentSlider.getAttribute('data-initial') || investmentSlider.value;
        discountSlider.value = '10';
        laborSlider.value = '30';
        updateDisplay();
      });
    }
  }

  /**
   * Initialize filter controls
   */
  function initializeFilters(onFilterChange) {
    const incomeFilter = document.getElementById('income-filter');
    const densityFilter = document.getElementById('density-filter');
    const growthFilter = document.getElementById('growth-filter');
    const employmentFilter = document.getElementById('employment-filter');

    if (!incomeFilter) return;

    const formatCurrency = (val) => {
      return '$' + (Math.round(val / 1000) * 1000).toLocaleString();
    };

    incomeFilter.addEventListener('input', (e) => {
      document.getElementById('income-filter-display').textContent = formatCurrency(e.target.value);
    });

    densityFilter.addEventListener('input', (e) => {
      document.getElementById('density-filter-display').textContent = e.target.value + ' per sq mi';
    });

    growthFilter.addEventListener('input', (e) => {
      document.getElementById('growth-filter-display').textContent = e.target.value + '%';
    });

    employmentFilter.addEventListener('input', (e) => {
      document.getElementById('employment-filter-display').textContent = e.target.value + '%';
    });

    // Apply filters button
    const applyBtn = document.querySelector('.apply-filters-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        const filters = {
          minIncome: parseFloat(incomeFilter.value),
          maxDensity: parseFloat(densityFilter.value),
          minGrowth: parseFloat(growthFilter.value),
          minEmployment: parseFloat(employmentFilter.value)
        };
        onFilterChange(filters);
      });
    }

    // Clear filters button
    const clearBtn = document.querySelector('.clear-filters-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        incomeFilter.value = '50000';
        densityFilter.value = '100';
        growthFilter.value = '1';
        employmentFilter.value = '95';
        document.getElementById('income-filter-display').textContent = '$50,000';
        document.getElementById('density-filter-display').textContent = '100 per sq mi';
        document.getElementById('growth-filter-display').textContent = '1%';
        document.getElementById('employment-filter-display').textContent = '95%';
        onFilterChange(null);
      });
    }
  }

  /**
   * Initialize toggle switches
   */
  function initializeToggles(onToggleChange) {
    const toggles = document.querySelectorAll('.metric-toggle');

    toggles.forEach(toggle => {
      toggle.addEventListener('change', () => {
        const activeMetrics = Array.from(toggles)
          .filter(t => t.checked)
          .map(t => t.dataset.metric);
        onToggleChange(activeMetrics);
      });
    });
  }

  /**
   * Initialize view options
   */
  function initializeViewOptions(onViewChange) {
    const viewBtns = document.querySelectorAll('.view-btn');

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        viewBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onViewChange(btn.dataset.view);
      });
    });
  }

  /**
   * Update impact summary with calculated changes
   */
  function updateImpactSummary(originalResults, newResults) {
    const marginDiff = newResults.operatingMargin - originalResults.operatingMargin;
    const incomeDiff = newResults.netIncome - originalResults.netIncome;
    const paybackDiff = newResults.paybackMonths - originalResults.paybackMonths;
    const roiDiff = newResults.cashOnCash - originalResults.cashOnCash;

    document.getElementById('new-margin').textContent = newResults.operatingMargin.toFixed(1);
    document.getElementById('new-income').textContent = (newResults.netIncome / 1000).toFixed(0);
    document.getElementById('payback-impact').textContent =
      (paybackDiff > 0 ? '+' : '') + paybackDiff.toFixed(1);
    document.getElementById('roi-impact').textContent =
      (roiDiff > 0 ? '+' : '') + roiDiff.toFixed(1);

    // Color code impact
    const marginEl = document.getElementById('new-margin');
    const incomeEl = document.getElementById('new-income');
    marginEl.style.color = marginDiff > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
    incomeEl.style.color = incomeDiff > 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';
  }

  // Public API
  return {
    createFinancialSliders,
    createMetricToggles,
    createDemographicFilters,
    createComparisonToggle,
    createChartViewOptions,
    initializeSliders,
    initializeFilters,
    initializeToggles,
    initializeViewOptions,
    updateImpactSummary
  };
})();
