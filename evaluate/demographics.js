/**
 * Demographic Analytics Module
 * Provides detailed market demographic insights and analysis
 */

const DemographicsAnalytics = (() => {
  'use strict';

  // National demographic benchmarks
  const NATIONAL_BENCHMARKS = {
    medianIncome: 72000,
    populationDensity: 380, // per sq mile
    consumerSpending: 65000,
    householdSize: 2.5,
    avgAge: 38,
    educationIndex: 65,
    employmentRate: 95,
    growthRate: 1.2 // annual %
  };

  /**
   * Extract demographic data from location array
   */
  function extractDemographics(locations) {
    if (!locations || locations.length === 0) {
      return createEmptyDemographics();
    }

    const demographics = {
      locationCount: locations.length,
      medianIncome: [],
      populationDensity: [],
      consumerSpending: [],
      householdSize: [],
      avgAge: [],
      educationIndex: [],
      employmentRate: [],
      growthRate: [],
      marketSaturation: [],
      traffic: [],
      avgSiteScore: []
    };

    // Extract all demographic attributes from locations
    locations.forEach(loc => {
      if (loc.at) {
        if (loc.at.medianIncome) demographics.medianIncome.push(loc.at.medianIncome);
        if (loc.at.populationDensity) demographics.populationDensity.push(loc.at.populationDensity);
        if (loc.at.consumerSpending) demographics.consumerSpending.push(loc.at.consumerSpending);
        if (loc.at.householdSize) demographics.householdSize.push(loc.at.householdSize);
        if (loc.at.avgAge) demographics.avgAge.push(loc.at.avgAge);
        if (loc.at.educationIndex) demographics.educationIndex.push(loc.at.educationIndex);
        if (loc.at.employmentRate) demographics.employmentRate.push(loc.at.employmentRate);
        if (loc.at.growthRate) demographics.growthRate.push(loc.at.growthRate);
        if (loc.at.marketSaturation) demographics.marketSaturation.push(loc.at.marketSaturation);
        if (loc.at.traffic) demographics.traffic.push(loc.at.traffic);
      }
      if (loc.s) demographics.avgSiteScore.push(loc.s);
    });

    return demographics;
  }

  /**
   * Calculate aggregate statistics
   */
  function calculateStatistics(dataArray) {
    if (!dataArray || dataArray.length === 0) {
      return {
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0,
        count: 0
      };
    }

    const sorted = [...dataArray].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const mean = sum / n;
    const median = n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

    const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    return {
      mean: mean,
      median: median,
      min: sorted[0],
      max: sorted[n - 1],
      stdDev: stdDev,
      count: n
    };
  }

  /**
   * Create comparison metrics vs benchmarks
   */
  function createComparison(metric, stats) {
    const benchmark = NATIONAL_BENCHMARKS[metric];
    if (!benchmark || stats.count === 0) return null;

    const percentDiff = ((stats.mean - benchmark) / benchmark) * 100;
    const interpretation = interpretComparison(metric, percentDiff);

    return {
      metric: metric,
      marketMean: stats.mean,
      benchmark: benchmark,
      difference: stats.mean - benchmark,
      percentDifference: percentDiff,
      interpretation: interpretation,
      stats: stats
    };
  }

  /**
   * Interpret demographic comparison
   */
  function interpretComparison(metric, percentDiff) {
    const isPositive = isPositiveMetric(metric);
    const threshold = Math.abs(percentDiff);

    if (threshold < 5) return { level: 'similar', description: 'Similar to national average' };
    if (isPositive) {
      return percentDiff > 0
        ? { level: 'above', description: 'Above national average (positive)' }
        : { level: 'below', description: 'Below national average (concern)' };
    } else {
      return percentDiff < 0
        ? { level: 'below', description: 'Below national average (positive)' }
        : { level: 'above', description: 'Above national average (concern)' };
    }
  }

  /**
   * Determine if higher values are positive for a metric
   */
  function isPositiveMetric(metric) {
    const positiveMetrics = [
      'medianIncome',
      'consumerSpending',
      'educationIndex',
      'employmentRate',
      'growthRate',
      'avgAge',
      'householdSize'
    ];
    return positiveMetrics.includes(metric);
  }

  /**
   * Create empty demographics object for error states
   */
  function createEmptyDemographics() {
    return {
      locationCount: 0,
      medianIncome: [],
      populationDensity: [],
      consumerSpending: [],
      householdSize: [],
      avgAge: [],
      educationIndex: [],
      employmentRate: [],
      growthRate: [],
      marketSaturation: [],
      traffic: [],
      avgSiteScore: []
    };
  }

  /**
   * Generate demographic insights
   */
  function generateInsights(demographics, comparisons) {
    const insights = [];

    // Income analysis
    const incomeStats = calculateStatistics(demographics.medianIncome);
    if (incomeStats.count > 0 && incomeStats.mean > NATIONAL_BENCHMARKS.medianIncome * 1.2) {
      insights.push({
        type: 'positive',
        category: 'Income',
        text: `High-income market: Median income $${incomeStats.mean.toLocaleString()} (${((incomeStats.mean / NATIONAL_BENCHMARKS.medianIncome - 1) * 100).toFixed(0)}% above national)`
      });
    } else if (incomeStats.count > 0 && incomeStats.mean < NATIONAL_BENCHMARKS.medianIncome * 0.8) {
      insights.push({
        type: 'warning',
        category: 'Income',
        text: `Lower-income market: Median income $${incomeStats.mean.toLocaleString()} may limit customer spending`
      });
    }

    // Growth analysis
    const growthStats = calculateStatistics(demographics.growthRate);
    if (growthStats.count > 0 && growthStats.mean > 3) {
      insights.push({
        type: 'positive',
        category: 'Growth',
        text: `Expanding market: ${growthStats.mean.toFixed(1)}% annual growth rate`
      });
    } else if (growthStats.count > 0 && growthStats.mean < 0) {
      insights.push({
        type: 'danger',
        category: 'Growth',
        text: `Declining market: Negative growth rate (${growthStats.mean.toFixed(1)}%)`
      });
    }

    // Employment analysis
    const empStats = calculateStatistics(demographics.employmentRate);
    if (empStats.count > 0 && empStats.mean > 97) {
      insights.push({
        type: 'positive',
        category: 'Employment',
        text: `Strong employment: ${empStats.mean.toFixed(1)}% employment rate`
      });
    }

    // Education analysis
    const eduStats = calculateStatistics(demographics.educationIndex);
    if (eduStats.count > 0 && eduStats.mean > 75) {
      insights.push({
        type: 'positive',
        category: 'Education',
        text: `Well-educated population: ${eduStats.mean.toFixed(0)} education index`
      });
    }

    // Population density/saturation
    const densityStats = calculateStatistics(demographics.populationDensity);
    if (densityStats.count > 0) {
      if (densityStats.mean > 800) {
        insights.push({
          type: 'warning',
          category: 'Density',
          text: `High population density (${densityStats.mean.toFixed(0)} per sq mi) may indicate high competition`
        });
      } else if (densityStats.mean < 100) {
        insights.push({
          type: 'warning',
          category: 'Density',
          text: `Rural market with limited population base (${densityStats.mean.toFixed(0)} per sq mi)`
        });
      }
    }

    return insights.slice(0, 5); // Return top 5 insights
  }

  /**
   * Create demographic profile HTML
   */
  function createDemographicProfile(demographics, marketName) {
    const incomeStats = calculateStatistics(demographics.medianIncome);
    const growthStats = calculateStatistics(demographics.growthRate);
    const densityStats = calculateStatistics(demographics.populationDensity);
    const empStats = calculateStatistics(demographics.employmentRate);
    const eduStats = calculateStatistics(demographics.educationIndex);

    return `
      <div class="demographic-profile">
        <div class="profile-header">
          <h3>Market Demographics: ${marketName || 'Selected Market'}</h3>
          <span class="location-count">${demographics.locationCount} locations analyzed</span>
        </div>

        <div class="demographic-grid">
          <div class="demographic-card">
            <div class="card-label">Median Income</div>
            <div class="card-value">${incomeStats.count > 0 ? '$' + incomeStats.mean.toLocaleString(undefined, {maximumFractionDigits: 0}) : 'N/A'}</div>
            <div class="card-comparison">${incomeStats.count > 0 ? 'vs. $' + NATIONAL_BENCHMARKS.medianIncome.toLocaleString() + ' national' : ''}</div>
          </div>

          <div class="demographic-card">
            <div class="card-label">Population Density</div>
            <div class="card-value">${densityStats.count > 0 ? densityStats.mean.toFixed(0) : 'N/A'}</div>
            <div class="card-comparison">${densityStats.count > 0 ? 'per sq. mile' : ''}</div>
          </div>

          <div class="demographic-card">
            <div class="card-label">Annual Growth Rate</div>
            <div class="card-value">${growthStats.count > 0 ? growthStats.mean.toFixed(2) : 'N/A'}</div>
            <div class="card-comparison">${growthStats.count > 0 ? 'annual %' : ''}</div>
          </div>

          <div class="demographic-card">
            <div class="card-label">Employment Rate</div>
            <div class="card-value">${empStats.count > 0 ? empStats.mean.toFixed(1) : 'N/A'}</div>
            <div class="card-comparison">${empStats.count > 0 ? 'employed %' : ''}</div>
          </div>

          <div class="demographic-card">
            <div class="card-label">Education Index</div>
            <div class="card-value">${eduStats.count > 0 ? eduStats.mean.toFixed(0) : 'N/A'}</div>
            <div class="card-comparison">${eduStats.count > 0 ? 'out of 100' : ''}</div>
          </div>

          <div class="demographic-card">
            <div class="card-label">Avg Household Size</div>
            <div class="card-value">${demographics.householdSize.length > 0 ? (demographics.householdSize.reduce((a,b) => a+b) / demographics.householdSize.length).toFixed(2) : 'N/A'}</div>
            <div class="card-comparison">people per household</div>
          </div>
        </div>

        <div class="demographic-insights">
          <h4>Market Insights</h4>
          <ul class="insights-list">
            ${generateInsights(demographics, [])
              .map(insight => `
                <li class="${insight.type}">
                  <strong>${insight.category}:</strong> ${insight.text}
                </li>
              `)
              .join('')}
          </ul>
        </div>

        <div class="demographic-distribution">
          <h4>Income Distribution</h4>
          <div class="distribution-chart">
            ${createIncomeDistributionChart(demographics.medianIncome)}
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create income distribution visualization
   */
  function createIncomeDistributionChart(incomes) {
    if (!incomes || incomes.length === 0) {
      return '<p class="no-data">No income data available</p>';
    }

    const sorted = [...incomes].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const range = max - min || 1;

    // Create 5 income brackets
    const brackets = [
      { label: `$0-$${(min + range * 0.2).toLocaleString(undefined, {maximumFractionDigits: 0})}`, min: 0, max: min + range * 0.2 },
      { label: `$${(min + range * 0.2).toLocaleString(undefined, {maximumFractionDigits: 0})}-$${(min + range * 0.4).toLocaleString(undefined, {maximumFractionDigits: 0})}`, min: min + range * 0.2, max: min + range * 0.4 },
      { label: `$${(min + range * 0.4).toLocaleString(undefined, {maximumFractionDigits: 0})}-$${(min + range * 0.6).toLocaleString(undefined, {maximumFractionDigits: 0})}`, min: min + range * 0.4, max: min + range * 0.6 },
      { label: `$${(min + range * 0.6).toLocaleString(undefined, {maximumFractionDigits: 0})}-$${(min + range * 0.8).toLocaleString(undefined, {maximumFractionDigits: 0})}`, min: min + range * 0.6, max: min + range * 0.8 },
      { label: `$${(min + range * 0.8).toLocaleString(undefined, {maximumFractionDigits: 0})}+`, min: min + range * 0.8, max: max + 1 }
    ];

    const counts = brackets.map(b => sorted.filter(v => v >= b.min && v < b.max).length);
    const maxCount = Math.max(...counts);

    const bars = brackets.map((bracket, i) => {
      const percentage = (counts[i] / maxCount) * 100;
      return `
        <div class="distribution-bar">
          <div class="bar-label">${bracket.label}</div>
          <div class="bar-container">
            <div class="bar-fill" style="width: ${percentage}%"></div>
            <span class="bar-count">${counts[i]}</span>
          </div>
        </div>
      `;
    }).join('');

    return `<div class="income-bars">${bars}</div>`;
  }

  /**
   * Create comparison table vs national benchmarks
   */
  function createComparisonTable(demographics) {
    const metrics = [
      'medianIncome',
      'populationDensity',
      'consumerSpending',
      'householdSize',
      'avgAge',
      'educationIndex',
      'employmentRate',
      'growthRate'
    ];

    const rows = metrics.map(metric => {
      const data = demographics[metric] || [];
      const stats = calculateStatistics(data);
      const benchmark = NATIONAL_BENCHMARKS[metric];
      const comparison = createComparison(metric, stats);

      if (stats.count === 0) return '';

      let valueStr = '';
      let benchmarkStr = '';

      if (metric === 'medianIncome' || metric === 'consumerSpending') {
        valueStr = '$' + stats.mean.toLocaleString(undefined, {maximumFractionDigits: 0});
        benchmarkStr = '$' + benchmark.toLocaleString();
      } else {
        valueStr = stats.mean.toFixed(1);
        benchmarkStr = benchmark.toFixed(1);
      }

      const diffPercent = comparison ? comparison.percentDifference : 0;
      const diffClass = diffPercent > 5 ? 'above' : diffPercent < -5 ? 'below' : 'similar';

      return `
        <tr>
          <td class="metric-name">${formatMetricName(metric)}</td>
          <td class="metric-value">${valueStr}</td>
          <td class="metric-benchmark">${benchmarkStr}</td>
          <td class="metric-diff ${diffClass}">${diffPercent > 0 ? '+' : ''}${diffPercent.toFixed(1)}%</td>
        </tr>
      `;
    }).filter(r => r !== '');

    return `
      <div class="comparison-table-container">
        <h4>Market vs. National Benchmarks</h4>
        <table class="demographic-comparison">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Market Average</th>
              <th>National Avg</th>
              <th>Difference</th>
            </tr>
          </thead>
          <tbody>
            ${rows.join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Format metric name for display
   */
  function formatMetricName(metric) {
    const names = {
      'medianIncome': 'Median Income',
      'populationDensity': 'Population Density',
      'consumerSpending': 'Consumer Spending',
      'householdSize': 'Household Size',
      'avgAge': 'Average Age',
      'educationIndex': 'Education Index',
      'employmentRate': 'Employment Rate',
      'growthRate': 'Annual Growth Rate'
    };
    return names[metric] || metric;
  }

  /**
   * Initialize demographics display in Location Analysis tab
   */
  function initializeDemographics(tabElement, demographics, marketName) {
    if (!tabElement) return;

    const demographicsSection = document.createElement('div');
    demographicsSection.id = 'demographics-analytics';
    demographicsSection.innerHTML = createDemographicProfile(demographics, marketName);

    tabElement.appendChild(demographicsSection);

    // Add comparison table
    const comparisonSection = document.createElement('div');
    comparisonSection.id = 'demographic-comparison';
    comparisonSection.style.marginTop = '32px';
    comparisonSection.innerHTML = createComparisonTable(demographics);

    tabElement.appendChild(comparisonSection);
  }

  // Public API
  return {
    extractDemographics,
    calculateStatistics,
    createComparison,
    generateInsights,
    createDemographicProfile,
    createComparisonTable,
    initializeDemographics,
    NATIONAL_BENCHMARKS
  };
})();
