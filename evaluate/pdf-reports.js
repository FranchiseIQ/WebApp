/**
 * Professional PDF Report Generation Module
 * Creates branded, printer-friendly PDF reports for franchise evaluations
 */

const PDFReports = (() => {
  'use strict';

  /**
   * Generate comprehensive evaluation PDF
   */
  function generateEvaluationPDF(evaluation, demographics, metrics) {
    const timestamp = new Date().toLocaleString();
    const {
      brand,
      market,
      score,
      interpretation,
      components,
      metrics: evalMetrics
    } = evaluation;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>FranchiseIQ Evaluation Report - ${brand} (${market})</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #333;
      line-height: 1.6;
      background: white;
    }

    .page {
      width: 8.5in;
      height: 11in;
      margin: 0 auto;
      padding: 0.5in;
      page-break-after: always;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    }

    .page:last-child {
      page-break-after: avoid;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 3px solid #0284c7;
    }

    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #0284c7;
      letter-spacing: -0.5px;
    }

    .report-date {
      font-size: 11px;
      color: #999;
      text-align: right;
    }

    /* Title Section */
    .title-section {
      margin-bottom: 30px;
      background: linear-gradient(135deg, #f0f9ff 0%, #f0f4ff 100%);
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #0284c7;
    }

    .title-section h1 {
      font-size: 28px;
      margin-bottom: 8px;
      color: #1f2937;
    }

    .title-section p {
      font-size: 13px;
      color: #666;
    }

    /* Score Card */
    .score-card {
      display: flex;
      gap: 30px;
      margin-bottom: 30px;
      align-items: center;
    }

    .score-display {
      text-align: center;
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      padding: 20px;
      min-width: 120px;
    }

    .score-number {
      font-size: 48px;
      font-weight: 700;
      color: #0284c7;
      font-family: monospace;
    }

    .score-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      margin-top: 8px;
    }

    .score-interpretation {
      flex: 1;
    }

    .interpretation-title {
      font-size: 18px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8px;
    }

    .interpretation-desc {
      font-size: 13px;
      color: #666;
      margin-bottom: 12px;
    }

    .score-components {
      display: flex;
      gap: 15px;
    }

    .component {
      flex: 1;
      background: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
      font-size: 11px;
    }

    .component-label {
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      font-size: 10px;
      margin-bottom: 4px;
    }

    .component-value {
      font-size: 16px;
      font-weight: 700;
      color: #0284c7;
      font-family: monospace;
    }

    /* Two Column Grid */
    .two-column {
      display: flex;
      gap: 20px;
      margin-bottom: 20px;
    }

    .column {
      flex: 1;
    }

    /* Section */
    .section {
      margin-bottom: 25px;
    }

    .section h2 {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Metrics Table */
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin-bottom: 12px;
    }

    .metrics-table th {
      background: #f3f4f6;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metrics-table td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .metrics-table tr:hover {
      background: #f9fafb;
    }

    /* Insight List */
    .insight-list {
      list-style: none;
      padding: 0;
    }

    .insight-list li {
      padding: 8px 0;
      padding-left: 20px;
      position: relative;
      font-size: 12px;
      line-height: 1.5;
    }

    .insight-list li:before {
      content: '→';
      position: absolute;
      left: 0;
      font-weight: 700;
      color: #0284c7;
    }

    .insight-list li.warning:before {
      content: '⚠';
      color: #f59e0b;
    }

    .insight-list li.danger:before {
      content: '✕';
      color: #ef4444;
    }

    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .metric-card {
      background: #f9fafb;
      padding: 12px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 4px;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #0284c7;
      font-family: monospace;
      margin-bottom: 2px;
    }

    .metric-note {
      font-size: 10px;
      color: #999;
    }

    /* Financial Summary */
    .financial-summary {
      background: #f0f9ff;
      border-left: 4px solid #0284c7;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 12px;
    }

    .financial-summary h3 {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #1f2937;
    }

    .financial-items {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 11px;
    }

    .financial-item {
      flex: 1;
      min-width: 120px;
    }

    .financial-item-label {
      font-weight: 600;
      color: #666;
    }

    .financial-item-value {
      font-weight: 700;
      color: #0284c7;
      font-family: monospace;
    }

    /* Demographics Section */
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }

    .demo-card {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 4px;
    }

    .demo-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 3px;
    }

    .demo-value {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      font-family: monospace;
    }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #e5e7eb;
      font-size: 10px;
      color: #999;
      text-align: center;
    }

    .disclaimer {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 4px;
      padding: 10px;
      margin-top: 20px;
      font-size: 10px;
      line-height: 1.4;
    }

    /* Print optimizations */
    @media print {
      body {
        background: white;
      }

      .page {
        box-shadow: none;
        page-break-after: always;
      }

      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="logo">FranchiseIQ</div>
      <div class="report-date">
        <div>Evaluation Report</div>
        <div>${timestamp}</div>
      </div>
    </div>

    <!-- Title Section -->
    <div class="title-section">
      <h1>${brand} Franchise Evaluation</h1>
      <p>Market Analysis for <strong>${market}</strong></p>
    </div>

    <!-- Score Card -->
    <div class="score-card">
      <div class="score-display">
        <div class="score-number">${score}</div>
        <div class="score-label">Opportunity Score</div>
      </div>
      <div class="score-interpretation">
        <div class="interpretation-title">${interpretation.label}</div>
        <div class="interpretation-desc">${interpretation.description}</div>
        <div class="score-components">
          <div class="component">
            <div class="component-label">Brand Health</div>
            <div class="component-value">${components.brandHealth.toFixed(1)}</div>
          </div>
          <div class="component">
            <div class="component-label">Market Attractiveness</div>
            <div class="component-value">${components.marketAttractiveness.toFixed(1)}</div>
          </div>
          <div class="component">
            <div class="component-label">Site Quality</div>
            <div class="component-value">${components.siteQuality.toFixed(1)}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="section">
      <h2>Key Market Metrics</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Average Site Score</div>
          <div class="metric-value">${evalMetrics.avgSiteScore.toFixed(1)}/100</div>
          <div class="metric-note">location quality rating</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Median Income</div>
          <div class="metric-value">$${(evalMetrics.avgIncome / 1000).toFixed(0)}k</div>
          <div class="metric-note">household income</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Units in Market</div>
          <div class="metric-value">${evalMetrics.unitCount}</div>
          <div class="metric-note">franchise locations</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Units Per Capita</div>
          <div class="metric-value">${evalMetrics.unitsPerCapita.toFixed(2)}</div>
          <div class="metric-note">per 100,000 residents</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Competitors Nearby</div>
          <div class="metric-value">${evalMetrics.competitorCount}</div>
          <div class="metric-note">within 5 miles</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Market Saturation</div>
          <div class="metric-value">${(evalMetrics.unitsPerCapita * 10).toFixed(0)}%</div>
          <div class="metric-note">competitive intensity</div>
        </div>
      </div>
    </div>

    <!-- Market Overview -->
    <div class="two-column">
      <div class="column">
        <div class="section">
          <h2>Market Overview</h2>
          <ul class="insight-list">
            <li>Market located in ${market}</li>
            <li>${evalMetrics.unitCount} existing franchise locations</li>
            <li>Average site score of ${evalMetrics.avgSiteScore.toFixed(0)}/100</li>
            <li>Median market income of $${evalMetrics.avgIncome.toLocaleString()}</li>
            <li>Competition level: ${evalMetrics.competitorCount > 5 ? 'High' : evalMetrics.competitorCount > 2 ? 'Moderate' : 'Low'}</li>
          </ul>
        </div>
      </div>
      <div class="column">
        <div class="financial-summary">
          <h3>Financial Opportunity</h3>
          <div class="financial-items">
            <div class="financial-item">
              <div class="financial-item-label">Market Attractiveness</div>
              <div class="financial-item-value">${(score / 100 * 100).toFixed(0)}%</div>
            </div>
            <div class="financial-item">
              <div class="financial-item-label">Growth Potential</div>
              <div class="financial-item-value">Moderate</div>
            </div>
            <div class="financial-item">
              <div class="financial-item-label">Risk Level</div>
              <div class="financial-item-value">${score > 70 ? 'Low' : score > 40 ? 'Moderate' : 'High'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Methodology -->
    <div class="section">
      <h2>Evaluation Methodology</h2>
      <p style="font-size: 11px; line-height: 1.5; margin-bottom: 10px;">
        This evaluation uses a transparent, rule-based scoring algorithm that assesses franchise opportunities across three key dimensions:
      </p>
      <ul class="insight-list">
        <li><strong>Brand Health (40%):</strong> Evaluates stock performance and unit growth of the franchise brand</li>
        <li><strong>Market Attractiveness (30%):</strong> Analyzes market density, competition, and demographic factors</li>
        <li><strong>Site Quality (30%):</strong> Assesses location-specific characteristics and suitability</li>
      </ul>
    </div>

    <!-- Disclaimer -->
    <div class="disclaimer">
      <strong>Important Disclaimer:</strong> This evaluation is based on available market data and historical performance benchmarks. Actual franchise performance depends on individual execution, local market conditions, operational management, and unforeseen factors. This analysis should not be considered investment advice. Always consult with a franchise advisor, accountant, and legal professional before making franchise investment decisions.
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} FranchiseIQ. All rights reserved. | www.franchiseiq.com</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Generate financial analysis PDF
   */
  function generateFinancialPDF(results, brand, market) {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Financial Analysis Report - ${brand} (${market})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #333;
      padding: 0.5in;
      font-size: 12px;
      line-height: 1.5;
    }

    .header {
      border-bottom: 3px solid #0284c7;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .header h1 {
      margin: 0 0 5px;
      color: #0284c7;
    }

    h2 {
      font-size: 14px;
      margin: 15px 0 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      margin-bottom: 20px;
    }

    .metric-box {
      background: #f3f4f6;
      padding: 12px;
      border-radius: 4px;
      border-left: 3px solid #0284c7;
    }

    .metric-label {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 5px;
    }

    .metric-value {
      font-size: 18px;
      font-weight: 700;
      color: #0284c7;
      font-family: monospace;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
      font-size: 11px;
    }

    th {
      background: #f3f4f6;
      padding: 8px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #e5e7eb;
    }

    td {
      padding: 8px;
      border-bottom: 1px solid #e5e7eb;
    }

    .page-break {
      page-break-after: always;
    }

    @media print {
      body { background: white; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Financial Analysis: ${brand}</h1>
    <p>Market: ${market}</p>
  </div>

  <h2>Financial Metrics Summary</h2>
  <div class="metrics-grid">
    <div class="metric-box">
      <div class="metric-label">Annual Revenue</div>
      <div class="metric-value">$${(results.annualRevenue / 1000000).toFixed(2)}M</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Operating Margin</div>
      <div class="metric-value">${results.operatingMargin.toFixed(1)}%</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Annual Net Income</div>
      <div class="metric-value">$${(results.netIncome / 1000).toFixed(0)}k</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Initial Investment</div>
      <div class="metric-value">$${(results.initialInvestment / 1000).toFixed(0)}k</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Payback Period</div>
      <div class="metric-value">${results.paybackMonths.toFixed(1)} months</div>
    </div>
    <div class="metric-box">
      <div class="metric-label">Cash-on-Cash Return</div>
      <div class="metric-value">${results.cashOnCash.toFixed(1)}%</div>
    </div>
  </div>

  <h2>Operating Economics</h2>
  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Amount</th>
        <th>Percentage of Revenue</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Annual Revenue</td>
        <td>$${results.annualRevenue.toLocaleString()}</td>
        <td>100%</td>
      </tr>
      <tr>
        <td>Labor Costs</td>
        <td>$${results.laborCost.toLocaleString()}</td>
        <td>${((results.laborCost / results.annualRevenue) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Total Operating Costs</td>
        <td>$${results.totalCosts.toLocaleString()}</td>
        <td>${((results.totalCosts / results.annualRevenue) * 100).toFixed(1)}%</td>
      </tr>
      <tr>
        <td><strong>Net Operating Income</strong></td>
        <td><strong>$${results.netIncome.toLocaleString()}</strong></td>
        <td><strong>${results.operatingMargin.toFixed(1)}%</strong></td>
      </tr>
    </tbody>
  </table>

  <h2>Investment Analysis</h2>
  <table>
    <thead>
      <tr>
        <th>Metric</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Initial Investment Required</td>
        <td>$${results.initialInvestment.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Monthly Net Income</td>
        <td>$${(results.netIncome / 12).toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
      </tr>
      <tr>
        <td>Payback Period</td>
        <td>${results.paybackMonths.toFixed(1)} months</td>
      </tr>
      <tr>
        <td>Cash-on-Cash Return (Annual)</td>
        <td>${results.cashOnCash.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>5-Year Net Present Value</td>
        <td>$${results.npvFiveYear.toLocaleString()}</td>
      </tr>
      <tr>
        <td>Estimated Internal Rate of Return</td>
        <td>${results.irr.toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <p style="font-size: 10px; color: #999; margin-top: 20px;">
    <strong>Disclaimer:</strong> These financial projections are based on industry benchmarks and assumptions provided. Actual performance will vary based on execution, local market conditions, and economic factors. Consult with a financial advisor before making investment decisions.
  </p>
</body>
</html>
    `;

    return html;
  }

  /**
   * Open PDF in print dialog
   */
  function printPDF(htmlContent) {
    const printWindow = window.open('', '', 'height=800,width=1000');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  }

  /**
   * Download PDF using HTML2PDF approach
   */
  function downloadPDF(htmlContent, filename) {
    // Create blob from HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename + '.html';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Create PDF controls UI
   */
  function createPDFControls(evaluation) {
    return `
      <div class="pdf-controls">
        <h4>Generate Reports</h4>
        <div class="pdf-buttons">
          <button class="pdf-btn evaluation-pdf" title="Generate evaluation report">
            <span class="icon">📋</span> Evaluation Report
          </button>
          <button class="pdf-btn financial-pdf" title="Generate financial analysis">
            <span class="icon">💰</span> Financial Analysis
          </button>
          <button class="pdf-btn full-pdf" title="Generate comprehensive report">
            <span class="icon">📊</span> Full Report
          </button>
          <button class="pdf-btn print-pdf" title="Print to PDF">
            <span class="icon">🖨️</span> Print
          </button>
        </div>
        <div class="pdf-format-note" style="font-size: 12px; color: var(--text-muted); margin-top: 12px;">
          Reports optimized for PDF export via browser print function (Ctrl+P or Cmd+P)
        </div>
      </div>
    `;
  }

  /**
   * Initialize PDF controls
   */
  function initializePDFControls(evaluation, results) {
    const evalBtn = document.querySelector('.evaluation-pdf');
    const finBtn = document.querySelector('.financial-pdf');
    const fullBtn = document.querySelector('.full-pdf');
    const printBtn = document.querySelector('.print-pdf');

    if (!evalBtn) return;

    evalBtn.addEventListener('click', () => {
      const html = generateEvaluationPDF(evaluation, {}, evaluation.metrics);
      printPDF(html);
    });

    finBtn.addEventListener('click', () => {
      const html = generateFinancialPDF(results, evaluation.brand, evaluation.market);
      printPDF(html);
    });

    fullBtn.addEventListener('click', () => {
      const evalHtml = generateEvaluationPDF(evaluation, {}, evaluation.metrics);
      const finHtml = generateFinancialPDF(results, evaluation.brand, evaluation.market);
      const combined = evalHtml.replace('</body>', `<div style="page-break-after: always;"></div>${finHtml.replace(/^[\s\S]*<body>/,'').replace(/<\/body>[\s\S]*$/,'')}</body>`);
      printPDF(combined);
    });

    printBtn.addEventListener('click', () => {
      const html = generateEvaluationPDF(evaluation, {}, evaluation.metrics);
      printPDF(html);
    });
  }

  // Public API
  return {
    generateEvaluationPDF,
    generateFinancialPDF,
    createPDFControls,
    initializePDFControls,
    printPDF,
    downloadPDF
  };
})();
