/**
 * Metrics Dashboard Module
 * Provides interactive visualizations and metric displays
 */

const MetricsDashboard = (() => {
  'use strict';

  /**
   * Create a simple bar chart SVG
   */
  function createBarChart(values, labels, title) {
    if (!values || values.length === 0) return null;

    const width = 400;
    const height = 200;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const maxValue = Math.max(...values, 100);
    const barWidth = chartWidth / values.length;
    const spacing = barWidth * 0.1;
    const actualBarWidth = barWidth - spacing;

    let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Background
    svg += `<rect width="${width}" height="${height}" fill="rgba(255, 255, 255, 0.02)"/>`;

    // Title
    svg += `<text x="${width / 2}" y="25" text-anchor="middle" font-weight="600" font-size="14" fill="rgba(248, 250, 252, 1)">${title}</text>`;

    // Y-axis labels
    for (let i = 0; i <= 4; i++) {
      const value = (maxValue / 4) * i;
      const y = height - padding - (chartHeight / 4) * i;
      svg += `<text x="${padding - 5}" y="${y + 4}" text-anchor="end" font-size="11" fill="rgba(148, 163, 184, 0.8)">${Math.round(value)}</text>`;
    }

    // Grid lines
    svg += `<line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="rgba(255, 255, 255, 0.08)" stroke-width="1"/>`;
    for (let i = 1; i <= 3; i++) {
      const y = height - padding - (chartHeight / 4) * i;
      svg += `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="rgba(255, 255, 255, 0.04)" stroke-width="1"/>`;
    }

    // Bars
    values.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + spacing / 2;
      const y = height - padding - barHeight;

      const color = value > 60 ? '#22c55e' : value > 40 ? '#f59e0b' : '#ef4444';

      svg += `<rect x="${x}" y="${y}" width="${actualBarWidth}" height="${barHeight}" fill="${color}" rx="2"/>`;

      // Label
      if (labels && labels[index]) {
        svg += `<text x="${x + actualBarWidth / 2}" y="${height - padding + 20}" text-anchor="middle" font-size="11" fill="rgba(248, 250, 252, 0.7)">${labels[index]}</text>`;
      }
    });

    svg += '</svg>';

    return svg;
  }

  /**
   * Create score gauge
   */
  function createScoreGauge(score, label) {
    const size = 120;
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    let color = '#22c55e';
    if (score < 40) color = '#ef4444';
    else if (score < 60) color = '#f59e0b';
    else if (score < 80) color = '#3b82f6';

    const svg = `
      <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgba(255, 255, 255, 0.1)" stroke-width="8"/>
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
          stroke-linecap="round" transform="rotate(-90 ${size/2} ${size/2})"/>
        <text x="${size/2}" y="${size/2 + 8}" text-anchor="middle" font-size="24" font-weight="700" fill="${color}">${Math.round(score)}</text>
        <text x="${size/2}" y="${size/2 + 28}" text-anchor="middle" font-size="12" fill="rgba(148, 163, 184, 0.8)">${label}</text>
      </svg>
    `;

    return svg;
  }

  /**
   * Format metric card
   */
  function formatMetricCard(title, value, unit, trend) {
    let trendHtml = '';
    if (trend !== undefined && trend !== null) {
      const trendColor = trend > 0 ? '#22c55e' : '#ef4444';
      const trendSign = trend > 0 ? '+' : '';
      trendHtml = `<span style="color: ${trendColor}; font-size: 12px;">${trendSign}${trend.toFixed(1)}%</span>`;
    }

    return `
      <div class="metric-card">
        <div class="metric-card-title">${title}</div>
        <div class="metric-card-value">${value}</div>
        <div class="metric-card-unit">${unit}</div>
        ${trendHtml}
      </div>
    `;
  }

  /**
   * Create market opportunity summary
   */
  function createOpportunitySummary(score, interpretation, components) {
    const gaugeHtml = createScoreGauge(score, 'Opportunity\nScore');

    const componentValues = [
      components.brandHealth || 0,
      components.marketAttractiveness || 0,
      components.siteQuality || 0
    ];
    const componentLabels = ['Brand\nHealth', 'Market\nAttr.', 'Site\nQuality'];
    const barChartHtml = createBarChart(componentValues, componentLabels, 'Score Components');

    return `
      <div class="opportunity-summary">
        <div class="summary-gauge">
          ${gaugeHtml}
        </div>
        <div class="summary-interpretation">
          <h3>${interpretation.label}</h3>
          <p>${interpretation.description}</p>
        </div>
        <div class="summary-components">
          ${barChartHtml}
        </div>
      </div>
    `;
  }

  /**
   * Create quick stats grid
   */
  function createQuickStats(metrics) {
    if (!metrics) return '';

    const stats = [
      {
        title: 'Units in Market',
        value: metrics.unitCount || 0,
        unit: 'locations'
      },
      {
        title: 'Market Density',
        value: metrics.unitsPerCapita?.toFixed(2) || 'N/A',
        unit: 'per 100k pop'
      },
      {
        title: 'Site Score',
        value: metrics.avgSiteScore?.toFixed(0) || 'N/A',
        unit: '/100'
      },
      {
        title: 'Median Income',
        value: metrics.avgIncome ? '$' + Math.round(metrics.avgIncome / 1000) + 'k' : 'N/A',
        unit: 'market avg'
      }
    ];

    return `
      <div class="quick-stats-grid">
        ${stats.map(stat => formatMetricCard(stat.title, stat.value, stat.unit)).join('')}
      </div>
    `;
  }

  // Public API
  return {
    createBarChart,
    createScoreGauge,
    formatMetricCard,
    createOpportunitySummary,
    createQuickStats
  };
})();
