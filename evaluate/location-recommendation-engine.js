/**
 * Location Recommendation Engine
 * Intelligent algorithmic matching system for optimal brand-market pairs
 */

const LocationRecommendation = (() => {
  'use strict';

  /**
   * Brand characteristic profiles
   */
  const BRAND_PROFILES = {
    QSR: {
      name: 'Quick Service Restaurant',
      idealDensity: { min: 300, max: 1000 },
      idealIncome: { min: 50000, max: 100000 },
      idealGrowth: { min: 0.5, max: 5 },
      idealEmployment: { min: 93, max: 100 },
      trafficImportance: 'very_high',
      competitionTolerance: 'high',
      populationMinimum: 50000
    },
    Hospitality: {
      name: 'Hotel & Hospitality',
      idealDensity: { min: 200, max: 800 },
      idealIncome: { min: 60000, max: 120000 },
      idealGrowth: { min: 1, max: 4 },
      idealEmployment: { min: 92, max: 100 },
      trafficImportance: 'high',
      competitionTolerance: 'medium',
      populationMinimum: 100000
    },
    AutoServices: {
      name: 'Auto Services & Repair',
      idealDensity: { min: 150, max: 600 },
      idealIncome: { min: 55000, max: 95000 },
      idealGrowth: { min: 0, max: 3 },
      idealEmployment: { min: 91, max: 100 },
      trafficImportance: 'high',
      competitionTolerance: 'medium',
      populationMinimum: 30000
    },
    Fitness: {
      name: 'Fitness & Wellness',
      idealDensity: { min: 400, max: 1200 },
      idealIncome: { min: 70000, max: 150000 },
      idealGrowth: { min: 1, max: 5 },
      idealEmployment: { min: 93, max: 100 },
      trafficImportance: 'medium',
      competitionTolerance: 'low',
      populationMinimum: 80000
    },
    Retail: {
      name: 'Retail Store',
      idealDensity: { min: 500, max: 1500 },
      idealIncome: { min: 65000, max: 130000 },
      idealGrowth: { min: 1.5, max: 5 },
      idealEmployment: { min: 93, max: 100 },
      trafficImportance: 'very_high',
      competitionTolerance: 'high',
      populationMinimum: 75000
    }
  };

  /**
   * Calculate brand-market compatibility score
   */
  function calculateCompatibilityScore(brandCategory, marketMetrics) {
    if (!BRAND_PROFILES[brandCategory]) {
      return { score: 0, message: 'Unknown brand category' };
    }

    const profile = BRAND_PROFILES[brandCategory];
    const metrics = marketMetrics || {};

    let score = 0;
    const factors = {};

    // Density score (0-20 points)
    const densityScore = calculateRangeScore(
      metrics.populationDensity || 300,
      profile.idealDensity.min,
      profile.idealDensity.max,
      20
    );
    factors.density = densityScore;
    score += densityScore;

    // Income score (0-20 points)
    const incomeScore = calculateRangeScore(
      metrics.medianIncome || 60000,
      profile.idealIncome.min,
      profile.idealIncome.max,
      20
    );
    factors.income = incomeScore;
    score += incomeScore;

    // Growth score (0-15 points)
    const growthScore = calculateRangeScore(
      metrics.growthRate || 2,
      profile.idealGrowth.min,
      profile.idealGrowth.max,
      15
    );
    factors.growth = growthScore;
    score += growthScore;

    // Employment score (0-15 points)
    const empScore = calculateRangeScore(
      metrics.employmentRate || 95,
      profile.idealEmployment.min,
      profile.idealEmployment.max,
      15
    );
    factors.employment = empScore;
    score += empScore;

    // Competition score (0-15 points)
    const competitionScore = calculateCompetitionScore(
      metrics.competitorCount || 0,
      profile.competitionTolerance
    );
    factors.competition = competitionScore;
    score += competitionScore;

    // Market saturation score (0-10 points)
    const saturationScore = calculateSaturationScore(metrics.unitsPerCapita || 0);
    factors.saturation = saturationScore;
    score += saturationScore;

    // Education and income diversity (0-5 points)
    const diversityScore = Math.min(5, (metrics.educationIndex || 65) / 13);
    factors.diversity = diversityScore;
    score += diversityScore;

    return {
      score: Math.round(score * 10) / 10,
      factors: factors,
      interpretation: interpretScore(Math.round(score))
    };
  }

  /**
   * Calculate range-based score
   */
  function calculateRangeScore(value, minIdeal, maxIdeal, maxPoints) {
    if (value >= minIdeal && value <= maxIdeal) {
      return maxPoints; // Perfect fit
    }

    const belowMin = value < minIdeal;
    const distance = belowMin ? minIdeal - value : value - maxIdeal;
    const tolerance = belowMin ? minIdeal * 0.5 : maxIdeal * 0.5;

    if (distance > tolerance) {
      return 0; // Too far from ideal
    }

    // Partial credit based on proximity
    const proximityPercent = ((tolerance - distance) / tolerance) * 100;
    return (proximityPercent / 100) * maxPoints;
  }

  /**
   * Calculate competition score
   */
  function calculateCompetitionScore(competitorCount, tolerance) {
    const maxCompetitors = {
      'very_high': 2,
      'high': 5,
      'medium': 8,
      'low': 3
    };

    const max = maxCompetitors[tolerance] || 5;

    if (competitorCount <= max * 0.5) return 15; // Excellent
    if (competitorCount <= max) return 12; // Good
    if (competitorCount <= max * 1.5) return 8; // Moderate
    if (competitorCount <= max * 2) return 4; // Challenging
    return 0; // Too saturated
  }

  /**
   * Calculate market saturation score
   */
  function calculateSaturationScore(unitsPerCapita) {
    if (unitsPerCapita < 2) return 10;
    if (unitsPerCapita < 4) return 8;
    if (unitsPerCapita < 6) return 6;
    if (unitsPerCapita < 8) return 4;
    if (unitsPerCapita < 10) return 2;
    return 0;
  }

  /**
   * Interpret compatibility score
   */
  function interpretScore(score) {
    if (score >= 85) return { label: 'Excellent Fit', color: 'rgb(34, 197, 94)', icon: '✓✓' };
    if (score >= 70) return { label: 'Good Fit', color: 'rgb(99, 102, 241)', icon: '✓' };
    if (score >= 55) return { label: 'Moderate Fit', color: 'rgb(250, 204, 21)', icon: '→' };
    if (score >= 40) return { label: 'Fair Fit', color: 'rgb(245, 158, 11)', icon: '○' };
    return { label: 'Poor Fit', color: 'rgb(239, 68, 68)', icon: '✕' };
  }

  /**
   * Generate recommendations for a brand
   */
  function generateRecommendations(brand, availableMarkets) {
    if (!availableMarkets || availableMarkets.length === 0) {
      return [];
    }

    const recommendations = availableMarkets.map(market => {
      const metrics = extractMarketMetrics(market);
      const compatibility = calculateCompatibilityScore(brand.category || 'QSR', metrics);

      return {
        market: market.name,
        state: market.state || extractState(market.address),
        score: compatibility.score,
        interpretation: compatibility.interpretation,
        factors: compatibility.factors,
        metrics: metrics,
        rank: 0 // Will be set after sorting
      };
    });

    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);

    // Assign ranks
    recommendations.forEach((rec, index) => {
      rec.rank = index + 1;
    });

    return recommendations;
  }

  /**
   * Extract market metrics from raw data
   */
  function extractMarketMetrics(market) {
    return {
      populationDensity: market.at?.populationDensity || 300,
      medianIncome: market.at?.medianIncome || 60000,
      growthRate: market.at?.growthRate || 2,
      employmentRate: market.at?.employmentRate || 95,
      competitorCount: market.competitorCount || 0,
      unitsPerCapita: market.unitsPerCapita || 0,
      educationIndex: market.at?.educationIndex || 65
    };
  }

  /**
   * Extract state from address string
   */
  function extractState(address) {
    if (!address) return 'Unknown';
    const parts = address.split(',');
    return parts.length >= 2 ? parts[parts.length - 2].trim().substring(0, 2).toUpperCase() : 'Unknown';
  }

  /**
   * Create recommendation card HTML
   */
  function createRecommendationCard(recommendation) {
    const { market, state, score, interpretation, factors } = recommendation;

    return `
      <div class="recommendation-card" style="border-left: 4px solid ${interpretation.color};">
        <div class="card-header">
          <div class="card-title">
            <span class="rank-badge">#${recommendation.rank}</span>
            <h4>${market}, ${state}</h4>
          </div>
          <div class="score-badge" style="background-color: ${interpretation.color}">
            ${score}
            <span class="badge-label">${interpretation.label}</span>
          </div>
        </div>

        <div class="factors-breakdown">
          <div class="factor-item">
            <span class="factor-icon">📍</span>
            <span class="factor-label">Density</span>
            <span class="factor-value">${factors.density.toFixed(0)}/20</span>
          </div>
          <div class="factor-item">
            <span class="factor-icon">💰</span>
            <span class="factor-label">Income</span>
            <span class="factor-value">${factors.income.toFixed(0)}/20</span>
          </div>
          <div class="factor-item">
            <span class="factor-icon">📈</span>
            <span class="factor-label">Growth</span>
            <span class="factor-value">${factors.growth.toFixed(0)}/15</span>
          </div>
          <div class="factor-item">
            <span class="factor-icon">💼</span>
            <span class="factor-label">Employment</span>
            <span class="factor-value">${factors.employment.toFixed(0)}/15</span>
          </div>
          <div class="factor-item">
            <span class="factor-icon">🏪</span>
            <span class="factor-label">Competition</span>
            <span class="factor-value">${factors.competition.toFixed(0)}/15</span>
          </div>
          <div class="factor-item">
            <span class="factor-icon">🎯</span>
            <span class="factor-label">Saturation</span>
            <span class="factor-value">${factors.saturation.toFixed(0)}/10</span>
          </div>
        </div>

        <div class="quick-metrics">
          <div class="quick-metric">
            <span class="metric-label">Median Income</span>
            <span class="metric-value">$${(recommendation.metrics.medianIncome / 1000).toFixed(0)}k</span>
          </div>
          <div class="quick-metric">
            <span class="metric-label">Growth Rate</span>
            <span class="metric-value">${recommendation.metrics.growthRate.toFixed(2)}%</span>
          </div>
          <div class="quick-metric">
            <span class="metric-label">Employment</span>
            <span class="metric-value">${recommendation.metrics.employmentRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create recommendations display
   */
  function createRecommendationsDisplay(recommendations, brandName) {
    if (!recommendations || recommendations.length === 0) {
      return `
        <div class="no-recommendations">
          <p>No recommendations available. Select a brand and market to analyze.</p>
        </div>
      `;
    }

    const topRecommendations = recommendations.slice(0, 10);
    const cards = topRecommendations.map(rec => createRecommendationCard(rec)).join('');

    return `
      <div class="recommendations-container">
        <div class="recommendations-header">
          <h3>Top 10 Market Recommendations for ${brandName}</h3>
          <p class="rec-subtitle">${recommendations.length} markets analyzed • Ranked by compatibility score</p>
        </div>

        <div class="recommendations-grid">
          ${cards}
        </div>

        <div class="recommendations-summary">
          <div class="summary-stat">
            <div class="stat-value">${recommendations[0].score}</div>
            <div class="stat-label">Best Match Score</div>
          </div>
          <div class="summary-stat">
            <div class="stat-value">${recommendations[0].market}</div>
            <div class="stat-label">Top Recommended Market</div>
          </div>
          <div class="summary-stat">
            <div class="stat-value">${(recommendations.reduce((sum, r) => sum + r.score, 0) / recommendations.length).toFixed(1)}</div>
            <div class="stat-label">Average Compatibility</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create recommendation engine UI controls
   */
  function createRecommendationControls() {
    return `
      <div class="recommendation-controls">
        <h4>Find Your Ideal Market</h4>
        <p class="controls-description">Get AI-powered recommendations for the best franchise markets</p>

        <div class="controls-layout">
          <div class="control-group">
            <label>Select Brand Category</label>
            <select id="rec-brand-select" class="rec-select">
              <option value="">-- Select a brand --</option>
              <option value="QSR">Quick Service Restaurant</option>
              <option value="Hospitality">Hotel & Hospitality</option>
              <option value="AutoServices">Auto Services</option>
              <option value="Fitness">Fitness & Wellness</option>
              <option value="Retail">Retail Store</option>
            </select>
          </div>

          <button class="recommend-btn" id="get-recommendations">
            <span class="icon">🎯</span> Get Recommendations
          </button>
        </div>

        <div id="recommendations-result"></div>
      </div>
    `;
  }

  /**
   * Initialize recommendation controls
   */
  function initializeRecommendationControls(allMarkets, onRecommend) {
    const selectEl = document.getElementById('rec-brand-select');
    const btnEl = document.getElementById('get-recommendations');
    const resultEl = document.getElementById('recommendations-result');

    if (!selectEl || !btnEl) return;

    btnEl.addEventListener('click', () => {
      const category = selectEl.value;

      if (!category) {
        resultEl.innerHTML = '<div class="error-message">Please select a brand category</div>';
        return;
      }

      const recommendations = generateRecommendations(
        { category: category },
        allMarkets
      );

      const html = createRecommendationsDisplay(recommendations, BRAND_PROFILES[category].name);
      resultEl.innerHTML = html;

      if (onRecommend) {
        onRecommend(recommendations);
      }
    });
  }

  // Public API
  return {
    BRAND_PROFILES,
    calculateCompatibilityScore,
    generateRecommendations,
    createRecommendationControls,
    createRecommendationsDisplay,
    initializeRecommendationControls,
    extractMarketMetrics
  };
})();
