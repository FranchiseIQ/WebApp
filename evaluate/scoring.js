/**
 * Market Opportunity Score Calculator
 *
 * Transparent rule-based scoring system that evaluates franchise opportunities
 * based on Brand Health (40%), Market Attractiveness (30%), and Site Quality (30%)
 */

const ScoringModule = (() => {
  'use strict';

  /**
   * Calculate Stock Performance score (0-20)
   * YTD % return indicates momentum and investor confidence
   */
  function calculateStockPerformance(ytdPercent) {
    if (ytdPercent == null) return 0;
    if (ytdPercent > 20) return 20;
    if (ytdPercent > 10) return 15;
    if (ytdPercent > 0) return 10;
    if (ytdPercent > -10) return 5;
    return 0;
  }

  /**
   * Calculate Unit Growth score (0-20)
   * YoY unit expansion shows market acceptance and growth trajectory
   */
  function calculateUnitGrowth(yoyPercent) {
    if (yoyPercent == null) return 0;
    if (yoyPercent > 15) return 20;
    if (yoyPercent > 8) return 15;
    if (yoyPercent > 3) return 10;
    if (yoyPercent > 0) return 5;
    return 0;
  }

  /**
   * Calculate Brand Health (0-40)
   * Combines stock performance (20) and unit growth (20)
   */
  function calculateBrandHealth(stockData) {
    let score = 0;
    let componentCount = 0;

    if (stockData.ytdPercent != null) {
      score += calculateStockPerformance(stockData.ytdPercent);
      componentCount++;
    }

    if (stockData.unitGrowthYoY != null) {
      score += calculateUnitGrowth(stockData.unitGrowthYoY);
      componentCount++;
    }

    // If missing data, rescale
    if (componentCount === 0) return null;
    if (componentCount === 1) {
      return score * 2; // Scale up to compensate for missing component
    }

    return score;
  }

  /**
   * Calculate Density score (0-15)
   * Units per 100k population - lower is better for new entrants
   */
  function calculateDensity(unitsPerCapita) {
    if (unitsPerCapita == null) return 0;
    if (unitsPerCapita < 1.0) return 15;
    if (unitsPerCapita < 2.0) return 10;
    if (unitsPerCapita < 3.0) return 5;
    return 0; // Saturated market
  }

  /**
   * Calculate Competition score (0-15)
   * Direct competitors within 5 miles - fewer is better
   */
  function calculateCompetition(competitorCount) {
    if (competitorCount == null) return 0;
    if (competitorCount < 3) return 15;
    if (competitorCount < 5) return 10;
    if (competitorCount < 8) return 5;
    return 0; // Highly competitive
  }

  /**
   * Calculate Market Attractiveness (0-30)
   * Combines density (15) and competition (15)
   */
  function calculateMarketAttractiveness(marketData) {
    let score = 0;
    let componentCount = 0;

    if (marketData.unitsPerCapita != null) {
      score += calculateDensity(marketData.unitsPerCapita);
      componentCount++;
    }

    if (marketData.competitorCount != null) {
      score += calculateCompetition(marketData.competitorCount);
      componentCount++;
    }

    // If missing data, rescale
    if (componentCount === 0) return null;
    if (componentCount === 1) {
      return score * 2; // Scale up to compensate for missing component
    }

    return score;
  }

  /**
   * Calculate Site Quality score (0-30)
   * Average site score in market reflects visibility, accessibility, and demographics
   */
  function calculateSiteQuality(avgSiteScore) {
    if (avgSiteScore == null) return 0;
    if (avgSiteScore >= 80) return 30;
    if (avgSiteScore >= 65) return 20;
    if (avgSiteScore >= 50) return 10;
    return 0;
  }

  /**
   * Get interpretation label for score
   */
  function getInterpretationLabel(score) {
    if (score >= 80) return 'Strong Opportunity';
    if (score >= 60) return 'Moderate Opportunity';
    if (score >= 40) return 'Challenging Market';
    return 'High Risk';
  }

  /**
   * Get CSS class for score interpretation
   */
  function getInterpretationClass(score) {
    if (score >= 80) return 'score-strong';
    if (score >= 60) return 'score-moderate';
    if (score >= 40) return 'score-challenging';
    return 'score-high-risk';
  }

  /**
   * Get interpretation description
   */
  function getInterpretationDescription(score) {
    if (score >= 80) {
      return 'This market presents strong fundamentals with favorable brand momentum, low saturation, and high-quality locations.';
    }
    if (score >= 60) {
      return 'This market shows reasonable opportunity with mixed fundamentals. Consider carefully and model various scenarios.';
    }
    if (score >= 40) {
      return 'Market conditions are challenging. Additional due diligence recommended before investment.';
    }
    return 'Market presents significant risks. Invest with caution and seek professional advice.';
  }

  /**
   * Calculate complete Market Opportunity Score
   * Returns object with score, interpretation, and component breakdown
   */
  function calculateScore(inputs) {
    const {
      stockData = {},
      marketData = {},
      siteQualityScore = null
    } = inputs;

    // Calculate components
    const brandHealth = calculateBrandHealth(stockData);
    const marketAttractiveness = calculateMarketAttractiveness(marketData);
    const siteQuality = calculateSiteQuality(siteQualityScore);

    // Check if we have any data
    if (brandHealth == null && marketAttractiveness == null && siteQuality == null) {
      return {
        score: null,
        isValid: false,
        message: 'Insufficient data to calculate score. Select a brand and market.'
      };
    }

    // Calculate total score
    let totalScore = 0;
    let weightedSum = 0;
    let totalWeight = 0;

    if (brandHealth != null) {
      weightedSum += brandHealth * 0.40;
      totalWeight += 0.40;
    }
    if (marketAttractiveness != null) {
      weightedSum += marketAttractiveness * 0.30;
      totalWeight += 0.30;
    }
    if (siteQuality != null) {
      weightedSum += siteQuality * 0.30;
      totalWeight += 0.30;
    }

    // Rescale if missing components
    if (totalWeight > 0) {
      totalScore = (weightedSum / totalWeight);
    }

    return {
      score: Math.round(totalScore),
      isValid: true,
      interpretation: {
        label: getInterpretationLabel(totalScore),
        description: getInterpretationDescription(totalScore),
        cssClass: getInterpretationClass(totalScore)
      },
      components: {
        brandHealth: brandHealth != null ? Math.round(brandHealth) : null,
        marketAttractiveness: marketAttractiveness != null ? Math.round(marketAttractiveness) : null,
        siteQuality: siteQuality != null ? siteQuality : null
      },
      details: {
        stockPerformance: stockData.ytdPercent != null ? calculateStockPerformance(stockData.ytdPercent) : null,
        unitGrowth: stockData.unitGrowthYoY != null ? calculateUnitGrowth(stockData.unitGrowthYoY) : null,
        density: marketData.unitsPerCapita != null ? calculateDensity(marketData.unitsPerCapita) : null,
        competition: marketData.competitorCount != null ? calculateCompetition(marketData.competitorCount) : null,
        siteQuality: siteQuality
      }
    };
  }

  /**
   * Generate insights based on score components
   */
  function generateInsights(inputs, scoreResult) {
    const insights = [];
    const {
      stockData = {},
      marketData = {},
      brandName = 'Brand'
    } = inputs;

    // Brand momentum
    if (stockData.ytdPercent != null) {
      const perfScore = calculateStockPerformance(stockData.ytdPercent);
      if (perfScore >= 15) {
        insights.push({
          text: `Strong brand momentum (${stockData.ytdPercent > 0 ? '+' : ''}${stockData.ytdPercent.toFixed(1)}% YTD)`,
          type: 'positive'
        });
      } else if (perfScore < 5 && stockData.ytdPercent < -10) {
        insights.push({
          text: `Weak stock performance (${stockData.ytdPercent.toFixed(1)}% YTD)`,
          type: 'warning'
        });
      }
    }

    // Unit growth
    if (stockData.unitGrowthYoY != null) {
      const growthScore = calculateUnitGrowth(stockData.unitGrowthYoY);
      if (growthScore >= 15) {
        insights.push({
          text: `Rapid unit expansion (+${stockData.unitGrowthYoY.toFixed(1)}% YoY)`,
          type: 'positive'
        });
      } else if (growthScore < 5 && stockData.unitGrowthYoY <= 0) {
        insights.push({
          text: `Stagnant or declining units (${stockData.unitGrowthYoY.toFixed(1)}% YoY)`,
          type: 'warning'
        });
      }
    }

    // Market density
    if (marketData.unitsPerCapita != null) {
      const densityScore = calculateDensity(marketData.unitsPerCapita);
      if (densityScore >= 15) {
        insights.push({
          text: `Uncrowded market (${marketData.unitsPerCapita.toFixed(2)} units per 100k)`,
          type: 'positive'
        });
      } else if (densityScore === 0) {
        insights.push({
          text: `High market saturation (${marketData.unitsPerCapita.toFixed(2)} units per 100k)`,
          type: 'danger'
        });
      }
    }

    // Competition
    if (marketData.competitorCount != null) {
      const compScore = calculateCompetition(marketData.competitorCount);
      if (compScore === 0 && marketData.competitorCount >= 8) {
        insights.push({
          text: `Heavy competition (${marketData.competitorCount} direct competitors within 5 miles)`,
          type: 'warning'
        });
      } else if (compScore >= 15) {
        insights.push({
          text: `Low competition (${marketData.competitorCount} direct competitors within 5 miles)`,
          type: 'positive'
        });
      }
    }

    // Site quality
    if (scoreResult.details.siteQuality != null) {
      const avgScore = inputs.siteQualityScore;
      if (avgScore >= 80) {
        insights.push({
          text: `Above-average site scores in market (${avgScore.toFixed(1)}/100)`,
          type: 'positive'
        });
      } else if (avgScore < 50) {
        insights.push({
          text: `Below-average site scores in market (${avgScore.toFixed(1)}/100)`,
          type: 'warning'
        });
      }
    }

    return insights.length > 0 ? insights : [
      { text: 'Select a brand and market to see insights', type: 'neutral' }
    ];
  }

  // Public API
  return {
    calculateScore,
    generateInsights,
    getInterpretationLabel,
    getInterpretationDescription,
    getInterpretationClass
  };
})();
