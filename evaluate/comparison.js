/**
 * Brand Comparison Module
 * Enables side-by-side comparison of multiple brands in the same market
 */

const ComparisonModule = (() => {
  'use strict';

  /**
   * Compare multiple brands in a market
   * Returns structured comparison data
   */
  function compareBrands(brands, market, evaluationPage) {
    if (!brands || brands.length === 0) {
      return { error: 'No brands to compare' };
    }

    if (!market) {
      return { error: 'Market must be selected' };
    }

    const comparisons = [];

    brands.forEach(brandTicker => {
      // Would load data for each brand
      // For now, placeholder structure
      comparisons.push({
        ticker: brandTicker,
        name: brandTicker,
        score: Math.floor(Math.random() * 100),
        metrics: {
          ytdPerf: Math.random() * 40 - 10,
          unitGrowth: Math.random() * 20 - 5,
          locations: Math.floor(Math.random() * 500),
          avgSiteScore: Math.random() * 40 + 40
        }
      });
    });

    return {
      market,
      brands: comparisons,
      isValid: true
    };
  }

  /**
   * Format comparison table HTML
   */
  function formatComparisonTable(comparison) {
    if (!comparison.isValid) {
      return `<p>${comparison.error}</p>`;
    }

    const headers = ['Brand', 'Score', 'YTD Perf', 'Unit Growth', 'Locations', 'Avg Site Score'];
    const headerHtml = headers.map(h => `<th>${h}</th>`).join('');

    const rowsHtml = comparison.brands
      .map(brand => `
        <tr>
          <td><strong>${brand.name}</strong></td>
          <td>${brand.score}/100</td>
          <td>${brand.metrics.ytdPerf > 0 ? '+' : ''}${brand.metrics.ytdPerf.toFixed(1)}%</td>
          <td>${brand.metrics.unitGrowth > 0 ? '+' : ''}${brand.metrics.unitGrowth.toFixed(1)}%</td>
          <td>${brand.metrics.locations}</td>
          <td>${brand.metrics.avgSiteScore.toFixed(0)}/100</td>
        </tr>
      `)
      .join('');

    return `
      <table class="comparison-table">
        <thead>
          <tr>${headerHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
  }

  /**
   * Create comparison modal
   */
  function showComparisonModal(brands, market) {
    const comparison = compareBrands(brands, market);
    const html = formatComparisonTable(comparison);

    const modal = document.createElement('div');
    modal.className = 'comparison-modal';
    modal.innerHTML = `
      <div class="comparison-modal-overlay"></div>
      <div class="comparison-modal-content">
        <div class="comparison-modal-header">
          <h2>Brand Comparison - ${market}</h2>
          <button class="comparison-modal-close" onclick="this.closest('.comparison-modal').remove()">×</button>
        </div>
        <div class="comparison-modal-body">
          ${html}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.querySelector('.comparison-modal-overlay').addEventListener('click', () => {
      modal.remove();
    });
  }

  // Public API
  return {
    compareBrands,
    formatComparisonTable,
    showComparisonModal
  };
})();
