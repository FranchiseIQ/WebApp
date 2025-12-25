/**
 * Financial Visualizations Module
 * Interactive charts and visualizations for unit economics modeling
 */

const FinancialVisualizations = (() => {
  'use strict';

  /**
   * Create revenue breakdown pie chart (SVG)
   */
  function createRevenueBreakdown(revenue, costs) {
    const operatingIncome = revenue - costs;
    const incomePercent = (operatingIncome / revenue) * 100;
    const costPercent = (costs / revenue) * 100;

    const size = 200;
    const radius = 70;
    const centerX = size / 2;
    const centerY = size / 2;

    // Calculate angles
    const costAngle = (costPercent / 100) * 360;
    const x1 = centerX + radius * Math.cos((costAngle / 2) * Math.PI / 180);
    const y1 = centerY + radius * Math.sin((costAngle / 2) * Math.PI / 180);
    const x2 = centerX + radius * Math.cos(((costAngle + 180) / 2) * Math.PI / 180);
    const y2 = centerY + radius * Math.sin(((costAngle + 180) / 2) * Math.PI / 180);

    const largeArc = costAngle > 180 ? 1 : 0;

    return `
      <div class="chart-container">
        <svg viewBox="0 0 ${size} ${size}" class="pie-chart">
          <!-- Cost segment -->
          <path d="M ${centerX} ${centerY} L ${centerX + radius} ${centerY} A ${radius} ${radius} 0 ${largeArc} 1 ${x1} ${y1} Z"
                fill="rgb(239, 68, 68)" opacity="0.8"/>

          <!-- Income segment -->
          <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${1 - largeArc} 1 ${centerX + radius} ${centerY} Z"
                fill="rgb(34, 197, 94)" opacity="0.8"/>

          <!-- Center circle for donut effect -->
          <circle cx="${centerX}" cy="${centerY}" r="40" fill="white"/>

          <!-- Center text -->
          <text x="${centerX}" y="${centerY - 5}" text-anchor="middle" font-size="18" font-weight="700" fill="#333">
            ${incomePercent.toFixed(0)}%
          </text>
          <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-size="12" fill="#999">
            Margin
          </text>
        </svg>

        <div class="chart-legend">
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(34, 197, 94);"></div>
            <span>Net Income: ${incomePercent.toFixed(1)}%</span>
          </div>
          <div class="legend-item">
            <div class="legend-color" style="background-color: rgb(239, 68, 68);"></div>
            <span>Operating Costs: ${costPercent.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create cost structure breakdown bar chart
   */
  function createCostBreakdown(results) {
    const costs = [
      { label: 'Labor', value: results.laborCost, percent: (results.laborCost / results.totalCosts) * 100 },
      { label: 'COGS', value: results.totalCosts * 0.35, percent: 35 },
      { label: 'Occupancy', value: results.totalCosts * 0.10, percent: 10 },
      { label: 'Other', value: results.totalCosts * 0.55, percent: 45 }
    ];

    const maxCost = Math.max(...costs.map(c => c.value));
    const chartHeight = 200;
    const barHeight = chartHeight / costs.length;

    const bars = costs.map((cost, i) => {
      const barWidth = (cost.value / maxCost) * 300;
      const y = i * barHeight + barHeight / 2 - 10;
      return `
        <g class="cost-bar">
          <rect x="100" y="${y}" width="${barWidth}" height="20" fill="url(#costGradient${i})" rx="3"/>
          <text x="410" y="${y + 15}" font-size="12" font-weight="600" fill="#333">${cost.label}</text>
          <text x="520" y="${y + 15}" font-size="12" fill="#666">${cost.percent.toFixed(0)}%</text>
        </g>
      `;
    }).join('');

    return `
      <div class="chart-container">
        <svg viewBox="0 0 600 ${chartHeight}" class="cost-chart">
          <defs>
            <linearGradient id="costGradient0" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgb(99,102,241);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(168,85,247);stop-opacity:1" />
            </linearGradient>
            <linearGradient id="costGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgb(34,197,94);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(59,130,246);stop-opacity:1" />
            </linearGradient>
            <linearGradient id="costGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgb(250,204,21);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(245,158,11);stop-opacity:1" />
            </linearGradient>
            <linearGradient id="costGradient3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:rgb(239,68,68);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgb(244,63,94);stop-opacity:1" />
            </linearGradient>
          </defs>
          ${bars}
        </svg>
      </div>
    `;
  }

  /**
   * Create profitability projection chart
   */
  function createProfitabilityProjection(results, yearsToProject = 5) {
    const yearData = [];
    const initialInvestment = results.initialInvestment;
    let cumulativeCashFlow = -initialInvestment;

    for (let year = 1; year <= yearsToProject; year++) {
      const annualProfit = results.netIncome;
      cumulativeCashFlow += annualProfit;
      yearData.push({
        year: year,
        profit: annualProfit,
        cumulative: cumulativeCashFlow
      });
    }

    const maxValue = Math.max(...yearData.map(d => Math.abs(d.cumulative))) || 1;
    const chartHeight = 250;
    const chartWidth = 400;
    const padding = 40;

    const bars = yearData.map((data, i) => {
      const barWidth = (chartWidth - 2 * padding) / yearsToProject - 10;
      const x = padding + i * (chartWidth - 2 * padding) / yearsToProject + 5;
      const value = data.cumulative;
      const isPositive = value >= 0;
      const barHeight = Math.abs(value) / maxValue * (chartHeight - 2 * padding);
      const y = isPositive
        ? (chartHeight / 2) - barHeight
        : (chartHeight / 2);

      const color = isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)';

      return `
        <g>
          <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${color}" opacity="0.8" rx="2"/>
          <text x="${x + barWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" font-size="11" fill="#666">Year ${data.year}</text>
          <text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" font-weight="600" fill="#333">
            $${(value / 1000).toFixed(0)}k
          </text>
        </g>
      `;
    }).join('');

    return `
      <div class="chart-container">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="projection-chart">
          <!-- Break-even line -->
          <line x1="${padding}" y1="${chartHeight / 2}" x2="${chartWidth - padding}" y2="${chartHeight / 2}"
                stroke="#ccc" stroke-width="1" stroke-dasharray="4"/>
          <text x="${chartWidth - padding + 5}" y="${chartHeight / 2 + 4}" font-size="10" fill="#999">Break-even</text>

          <!-- Y-axis -->
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${chartHeight - padding}"
                stroke="#e5e7eb" stroke-width="2"/>

          <!-- X-axis -->
          <line x1="${padding}" y1="${chartHeight - padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}"
                stroke="#e5e7eb" stroke-width="2"/>

          <!-- Bars -->
          ${bars}
        </svg>
      </div>
    `;
  }

  /**
   * Create ROI timeline visualization
   */
  function createROITimeline(results) {
    const paybackMonths = results.paybackMonths;
    const cashOnCash = results.cashOnCash;
    const irr = results.irr;

    const months = Math.min(36, Math.ceil(paybackMonths * 1.5));
    const monthsArray = Array.from({length: months}, (_, i) => i + 1);

    const chartWidth = 500;
    const chartHeight = 200;
    const padding = 40;
    const graphWidth = chartWidth - 2 * padding;
    const graphHeight = chartHeight - 2 * padding;

    const points = monthsArray.map(month => {
      const x = padding + (month / months) * graphWidth;
      const invested = results.initialInvestment;
      const recovered = (results.netIncome / 12) * month;
      const roi = ((recovered - invested) / invested) * 100;
      const yPercent = Math.max(-100, Math.min(100, roi));
      const y = (chartHeight / 2) - (yPercent / 200) * graphHeight;
      return {x, y, month, roi};
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const breakEvenPoint = points.find(p => p.roi >= 0);

    return `
      <div class="chart-container">
        <svg viewBox="0 0 ${chartWidth} ${chartHeight}" class="roi-chart">
          <defs>
            <linearGradient id="roiGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:rgba(34,197,94,0.3);stop-opacity:1" />
              <stop offset="100%" style="stop-color:rgba(34,197,94,0);stop-opacity:1" />
            </linearGradient>
          </defs>

          <!-- Grid lines -->
          <line x1="${padding}" y1="${chartHeight / 2}" x2="${chartWidth - padding}" y2="${chartHeight / 2}"
                stroke="#e5e7eb" stroke-width="1"/>
          <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${chartHeight - padding}"
                stroke="#e5e7eb" stroke-width="2"/>
          <line x1="${padding}" y1="${chartHeight - padding}" x2="${chartWidth - padding}" y2="${chartHeight - padding}"
                stroke="#e5e7eb" stroke-width="2"/>

          <!-- Labels -->
          <text x="${padding - 10}" y="${chartHeight / 2 + 4}" text-anchor="end" font-size="10" fill="#999">0% ROI</text>
          <text x="${padding - 10}" y="${padding + 5}" text-anchor="end" font-size="10" fill="#999">100%</text>

          <!-- ROI area -->
          <polygon points="${pathData} ${chartWidth - padding},${chartHeight / 2} ${padding},${chartHeight / 2}"
                   fill="url(#roiGradient)" stroke="none"/>

          <!-- ROI line -->
          <polyline points="${pathData}" fill="none" stroke="rgb(34, 197, 94)" stroke-width="2" vector-effect="non-scaling-stroke"/>

          <!-- Break-even marker -->
          ${breakEvenPoint ? `
            <circle cx="${breakEvenPoint.x}" cy="${breakEvenPoint.y}" r="4" fill="rgb(34, 197, 94)"/>
            <text x="${breakEvenPoint.x}" y="${breakEvenPoint.y - 10}" text-anchor="middle" font-size="11" font-weight="600" fill="#22c55e">
              Payback: ${paybackMonths.toFixed(0)} mo
            </text>
          ` : ''}

          <!-- Axis labels -->
          <text x="${chartWidth / 2}" y="${chartHeight - 10}" text-anchor="middle" font-size="10" fill="#999">Months</text>
        </svg>
      </div>
    `;
  }

  /**
   * Create scenario comparison table
   */
  function createScenarioComparison(baseResults) {
    // Create 3 scenarios: conservative, base, optimistic
    const scenarios = [
      {
        name: 'Conservative',
        revenueMultiplier: 0.8,
        marginMultiplier: 0.9,
        color: 'rgb(239, 68, 68)'
      },
      {
        name: 'Base Case',
        revenueMultiplier: 1.0,
        marginMultiplier: 1.0,
        color: 'rgb(99, 102, 241)'
      },
      {
        name: 'Optimistic',
        revenueMultiplier: 1.2,
        marginMultiplier: 1.1,
        color: 'rgb(34, 197, 94)'
      }
    ];

    const rows = scenarios.map(scenario => {
      const revenue = baseResults.annualRevenue * scenario.revenueMultiplier;
      const margin = baseResults.operatingMargin * scenario.marginMultiplier;
      const netIncome = revenue * (margin / 100);
      const cashOnCash = (netIncome / baseResults.initialInvestment) * 100;
      const payback = (baseResults.initialInvestment / (netIncome / 12));

      return `
        <tr>
          <td class="scenario-name">
            <span class="scenario-dot" style="background-color: ${scenario.color};"></span>
            ${scenario.name}
          </td>
          <td>$${(revenue / 1000000).toFixed(2)}M</td>
          <td>${margin.toFixed(1)}%</td>
          <td>$${(netIncome / 1000).toFixed(0)}k</td>
          <td>${cashOnCash.toFixed(1)}%</td>
          <td>${payback.toFixed(1)} mo</td>
        </tr>
      `;
    }).join('');

    return `
      <div class="scenario-comparison">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>Annual Revenue</th>
              <th>Operating Margin</th>
              <th>Annual Income</th>
              <th>Cash-on-Cash</th>
              <th>Payback Period</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Create financial summary dashboard
   */
  function createFinancialDashboard(results) {
    return `
      <div class="financial-dashboard">
        <div class="dashboard-grid">
          <div class="dashboard-card">
            <div class="card-label">Annual Revenue</div>
            <div class="card-value">$${(results.annualRevenue / 1000000).toFixed(2)}M</div>
            <div class="card-meta">per unit location</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Operating Margin</div>
            <div class="card-value">${results.operatingMargin.toFixed(1)}%</div>
            <div class="card-meta">net profitability</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Annual Net Income</div>
            <div class="card-value">$${(results.netIncome / 1000).toFixed(0)}k</div>
            <div class="card-meta">per location annually</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Initial Investment</div>
            <div class="card-value">$${(results.initialInvestment / 1000).toFixed(0)}k</div>
            <div class="card-meta">startup capital required</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Cash-on-Cash Return</div>
            <div class="card-value">${results.cashOnCash.toFixed(1)}%</div>
            <div class="card-meta">annual return on investment</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Payback Period</div>
            <div class="card-value">${results.paybackMonths.toFixed(1)} mo</div>
            <div class="card-meta">to recover investment</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">5-Year NPV</div>
            <div class="card-value">$${(results.npvFiveYear / 1000).toFixed(0)}k</div>
            <div class="card-meta">net present value</div>
          </div>

          <div class="dashboard-card">
            <div class="card-label">Estimated IRR</div>
            <div class="card-value">${results.irr.toFixed(1)}%</div>
            <div class="card-meta">internal rate of return</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Initialize financial visualizations in economics tab
   */
  function initializeVisualizations(tabElement, results) {
    if (!tabElement || !results) return;

    const visualizationSection = document.createElement('div');
    visualizationSection.id = 'financial-visualizations';
    visualizationSection.style.marginTop = '24px';

    let html = `<h4>Financial Analysis & Visualizations</h4>`;

    // Financial Dashboard
    html += createFinancialDashboard(results);

    // Revenue Breakdown
    html += `
      <div class="viz-section">
        <h5>Revenue Breakdown</h5>
        ${createRevenueBreakdown(results.annualRevenue, results.totalCosts)}
      </div>
    `;

    // Cost Structure
    html += `
      <div class="viz-section">
        <h5>Operating Cost Structure</h5>
        ${createCostBreakdown(results)}
      </div>
    `;

    // Profitability Projection
    html += `
      <div class="viz-section">
        <h5>5-Year Profitability Projection</h5>
        ${createProfitabilityProjection(results)}
      </div>
    `;

    // ROI Timeline
    html += `
      <div class="viz-section">
        <h5>Return on Investment Timeline</h5>
        ${createROITimeline(results)}
      </div>
    `;

    // Scenario Comparison
    html += `
      <div class="viz-section">
        <h5>Scenario Analysis</h5>
        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
          Comparison of conservative, base case, and optimistic financial scenarios
        </p>
        ${createScenarioComparison(results)}
      </div>
    `;

    visualizationSection.innerHTML = html;
    tabElement.appendChild(visualizationSection);
  }

  // Public API
  return {
    createRevenueBreakdown,
    createCostBreakdown,
    createProfitabilityProjection,
    createROITimeline,
    createScenarioComparison,
    createFinancialDashboard,
    initializeVisualizations
  };
})();
