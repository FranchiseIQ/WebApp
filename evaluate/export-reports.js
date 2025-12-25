/**
 * Export and Reporting Module
 * Generates PDF reports and downloadable summaries for franchise evaluations
 */

const ExportReports = (() => {
  'use strict';

  /**
   * Generate CSV from evaluation data
   */
  function generateCSV(evaluation) {
    const {
      brand,
      market,
      score,
      interpretation,
      components,
      metrics,
      timestamp
    } = evaluation;

    const rows = [
      ['Franchise Evaluation Report'],
      ['Generated:', new Date(timestamp).toLocaleString()],
      [],
      ['OPPORTUNITY SCORE', score],
      ['Interpretation', interpretation.label],
      ['Description', interpretation.description],
      [],
      ['SCORING COMPONENTS'],
      ['Brand Health', components.brandHealth],
      ['Market Attractiveness', components.marketAttractiveness],
      ['Site Quality', components.siteQuality],
      [],
      ['MARKET METRICS'],
      ['Brand', brand],
      ['Market', market],
      ['Units per Capita', metrics.unitsPerCapita],
      ['Competitor Count', metrics.competitorCount],
      ['Average Site Score', metrics.avgSiteScore],
      ['Median Income', metrics.avgIncome],
      ['Unit Count', metrics.unitCount]
    ];

    return rows.map(row => row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or quotes
      const str = String(cell);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    }).join(',')).join('\n');
  }

  /**
   * Generate JSON report
   */
  function generateJSON(evaluation) {
    return JSON.stringify({
      report: {
        type: 'Franchise Evaluation',
        version: '1.0',
        generatedAt: new Date(evaluation.timestamp).toISOString()
      },
      evaluation: {
        brand: evaluation.brand,
        market: evaluation.market,
        score: evaluation.score,
        interpretation: evaluation.interpretation,
        components: evaluation.components,
        metrics: evaluation.metrics,
        demographics: evaluation.demographics
      },
      metadata: {
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    }, null, 2);
  }

  /**
   * Generate HTML report
   */
  function generateHTML(evaluation) {
    const {
      brand,
      market,
      score,
      interpretation,
      components,
      metrics,
      timestamp
    } = evaluation;

    const date = new Date(timestamp).toLocaleString();
    const interpretationClass = interpretation.cssClass || 'neutral';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Franchise Evaluation Report - ${brand} (${market})</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #333;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px;
      font-size: 28px;
    }
    .meta {
      color: #666;
      font-size: 14px;
    }
    .score-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #f0f4ff 100%);
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
      text-align: center;
      border: 2px solid #e0e7ff;
    }
    .score-number {
      font-size: 72px;
      font-weight: 700;
      color: #0284c7;
      margin: 10px 0;
      font-family: 'Monaco', monospace;
    }
    .score-number.high {
      color: #22c55e;
    }
    .score-number.moderate {
      color: #f59e0b;
    }
    .score-number.low {
      color: #ef4444;
    }
    .interpretation {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .description {
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 18px;
      font-weight: 700;
      margin: 0 0 15px;
      color: #1f2937;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    .card {
      border: 1px solid #e5e7eb;
      padding: 15px;
      border-radius: 6px;
      background: #fafafa;
    }
    .card-label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #999;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .card-value {
      font-size: 20px;
      font-weight: 700;
      color: #0284c7;
      font-family: 'Monaco', monospace;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
    }
    .table th {
      background: #f3f4f6;
      padding: 10px;
      text-align: left;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 2px solid #e5e7eb;
    }
    .table td {
      padding: 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    .table tbody tr:hover {
      background: #f9fafb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #999;
    }
    .print-hidden {
      display: none;
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .container {
        box-shadow: none;
        padding: 0;
      }
      .print-hidden {
        display: none;
      }
      a {
        text-decoration: none;
        color: #0284c7;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Franchise Evaluation Report</h1>
      <div class="meta">
        <p><strong>${brand}</strong> in <strong>${market}</strong></p>
        <p>Generated: ${date}</p>
      </div>
    </div>

    <div class="score-section">
      <div class="score-number ${interpretationClass}">${score}</div>
      <div class="interpretation">${interpretation.label}</div>
      <div class="description">${interpretation.description}</div>
    </div>

    <div class="section">
      <h2>Scoring Components</h2>
      <div class="grid">
        <div class="card">
          <div class="card-label">Brand Health</div>
          <div class="card-value">${components.brandHealth.toFixed(1)}</div>
        </div>
        <div class="card">
          <div class="card-label">Market Attractiveness</div>
          <div class="card-value">${components.marketAttractiveness.toFixed(1)}</div>
        </div>
        <div class="card">
          <div class="card-label">Site Quality</div>
          <div class="card-value">${components.siteQuality.toFixed(1)}</div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Market Metrics</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Brand</td>
            <td>${brand}</td>
          </tr>
          <tr>
            <td>Market</td>
            <td>${market}</td>
          </tr>
          <tr>
            <td>Units per Capita</td>
            <td>${metrics.unitsPerCapita.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Competitor Count</td>
            <td>${metrics.competitorCount}</td>
          </tr>
          <tr>
            <td>Average Site Score</td>
            <td>${metrics.avgSiteScore.toFixed(1)}/100</td>
          </tr>
          <tr>
            <td>Median Income</td>
            <td>$${metrics.avgIncome.toLocaleString()}</td>
          </tr>
          <tr>
            <td>Unit Count</td>
            <td>${metrics.unitCount}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>This evaluation is based on available market data and financial benchmarks. Actual performance may vary based on individual franchise execution, local market conditions, and other factors. Always consult with a franchise advisor before making investment decisions.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Download file with content
   */
  function downloadFile(filename, content, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Export evaluation as CSV
   */
  function exportAsCSV(evaluation) {
    const csv = generateCSV(evaluation);
    const filename = `evaluation-${evaluation.brand}-${evaluation.market}-${Date.now()}.csv`;
    downloadFile(filename, csv, 'text/csv;charset=utf-8');
  }

  /**
   * Export evaluation as JSON
   */
  function exportAsJSON(evaluation) {
    const json = generateJSON(evaluation);
    const filename = `evaluation-${evaluation.brand}-${evaluation.market}-${Date.now()}.json`;
    downloadFile(filename, json, 'application/json');
  }

  /**
   * Export evaluation as HTML
   */
  function exportAsHTML(evaluation) {
    const html = generateHTML(evaluation);
    const filename = `evaluation-${evaluation.brand}-${evaluation.market}-${Date.now()}.html`;
    downloadFile(filename, html, 'text/html;charset=utf-8');
  }

  /**
   * Create export menu UI
   */
  function createExportMenu() {
    return `
      <div class="export-menu">
        <button class="export-btn export-csv" title="Download as CSV">
          <span class="icon">📊</span> CSV
        </button>
        <button class="export-btn export-json" title="Download as JSON">
          <span class="icon">{ }</span> JSON
        </button>
        <button class="export-btn export-html" title="Download as HTML">
          <span class="icon">📄</span> HTML
        </button>
        <button class="export-btn export-print" title="Print report">
          <span class="icon">🖨️</span> Print
        </button>
      </div>
    `;
  }

  /**
   * Initialize export controls
   */
  function initializeExport(evaluation) {
    const container = document.querySelector('.decision-actions');
    if (!container) return;

    const existingMenu = document.querySelector('.export-menu');
    if (existingMenu) existingMenu.remove();

    const menu = createExportMenu();
    container.insertAdjacentHTML('beforeend', menu);

    // Attach event listeners
    const csvBtn = document.querySelector('.export-csv');
    const jsonBtn = document.querySelector('.export-json');
    const htmlBtn = document.querySelector('.export-html');
    const printBtn = document.querySelector('.export-print');

    if (csvBtn) csvBtn.addEventListener('click', () => exportAsCSV(evaluation));
    if (jsonBtn) jsonBtn.addEventListener('click', () => exportAsJSON(evaluation));
    if (htmlBtn) htmlBtn.addEventListener('click', () => exportAsHTML(evaluation));
    if (printBtn) printBtn.addEventListener('click', () => {
      const html = generateHTML(evaluation);
      const printWindow = window.open('', '', 'height=800,width=1000');
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    });
  }

  /**
   * Create shareable report link
   */
  function generateShareLink(evaluation) {
    const params = new URLSearchParams();
    params.set('brand', evaluation.brand);
    params.set('market', evaluation.market);
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  }

  /**
   * Create summary text for clipboard
   */
  function generateSummaryText(evaluation) {
    return `
${evaluation.brand} - ${evaluation.market}
Opportunity Score: ${evaluation.score}
${evaluation.interpretation.label}

${evaluation.interpretation.description}

Scoring Breakdown:
• Brand Health: ${evaluation.components.brandHealth.toFixed(1)}/20
• Market Attractiveness: ${evaluation.components.marketAttractiveness.toFixed(1)}/30
• Site Quality: ${evaluation.components.siteQuality.toFixed(1)}/30

Key Metrics:
• Average Site Score: ${evaluation.metrics.avgSiteScore.toFixed(1)}/100
• Median Income: $${evaluation.metrics.avgIncome.toLocaleString()}
• Units in Market: ${evaluation.metrics.unitCount}

Generated: ${new Date(evaluation.timestamp).toLocaleString()}
    `.trim();
  }

  /**
   * Copy summary to clipboard
   */
  function copyToClipboard(evaluation) {
    const text = generateSummaryText(evaluation);
    navigator.clipboard.writeText(text).then(() => {
      // Show feedback
      const btn = document.querySelector('.copy-summary');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 2000);
      }
    });
  }

  // Public API
  return {
    exportAsCSV,
    exportAsJSON,
    exportAsHTML,
    generateShareLink,
    generateSummaryText,
    copyToClipboard,
    createExportMenu,
    initializeExport
  };
})();
