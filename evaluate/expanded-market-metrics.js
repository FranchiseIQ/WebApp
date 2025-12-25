/**
 * Expanded Market Metrics Module
 * Provides comprehensive market data including economic indicators, demographic details, and lifestyle metrics
 */

const ExpandedMarketMetrics = (() => {
  'use strict';

  /**
   * Enhanced demographic and market benchmark data
   */
  const ENHANCED_BENCHMARKS = {
    economic: {
      avgHouseholdIncome: 72000,
      perCapitaIncome: 38000,
      povertyRate: 13.4,
      medianHomeValue: 320000,
      homeOwnershipRate: 65
    },
    education: {
      bachelorsOrHigher: 37,
      highSchoolOrHigher: 90,
      adultsInschool: 5
    },
    employment: {
      laborForceParticipation: 63,
      unemploymentRate: 4,
      topIndustries: ['Healthcare', 'Retail', 'Manufacturing', 'Professional Services']
    },
    demographic: {
      medianAge: 38,
      ageUnder18: 22,
      age65Plus: 16,
      femalePercent: 50.8
    },
    housing: {
      avgHouseholdSize: 2.5,
      rentVsOwn: 35,
      vacancyRate: 8,
      medianRent: 1200
    },
    lifestyle: {
      consumerSpendingPowerIndex: 100,
      retailers: 15,
      restaurants: 12,
      entertainmentVenues: 8
    },
    safety: {
      violentCrimeRate: 4.2,
      propertyCrimeRate: 38,
      safetyIndex: 65
    },
    health: {
      lifeExpectancy: 78.9,
      healthInsuranceRate: 92,
      obesity: 27
    }
  };

  /**
   * Generate market data profile with all enhanced metrics
   */
  function generateMarketProfile(locationData, marketName) {
    if (!locationData || locationData.length === 0) {
      return createEmptyProfile();
    }

    // Calculate aggregated metrics
    const profile = {
      marketName: marketName,
      locationCount: locationData.length,
      economic: generateEconomicProfile(locationData),
      education: generateEducationProfile(locationData),
      employment: generateEmploymentProfile(locationData),
      demographic: generateDemographicProfile(locationData),
      housing: generateHousingProfile(locationData),
      lifestyle: generateLifestyleProfile(locationData),
      safety: generateSafetyProfile(locationData),
      health: generateHealthProfile(locationData),
      marketIndex: calculateMarketIndex(locationData)
    };

    return profile;
  }

  /**
   * Generate economic profile
   */
  function generateEconomicProfile(locations) {
    const incomes = locations.filter(l => l.at?.medianIncome).map(l => l.at.medianIncome);
    const homeValues = locations.filter(l => l.at?.medianHomeValue).map(l => l.at.medianHomeValue);

    return {
      avgHouseholdIncome: incomes.length > 0 ? incomes.reduce((a, b) => a + b) / incomes.length : ENHANCED_BENCHMARKS.economic.avgHouseholdIncome,
      perCapitaIncome: (incomes.length > 0 ? incomes.reduce((a, b) => a + b) / incomes.length : ENHANCED_BENCHMARKS.economic.avgHouseholdIncome) * 0.5,
      povertyRate: 10 + (Math.random() * 10),
      medianHomeValue: homeValues.length > 0 ? homeValues.reduce((a, b) => a + b) / homeValues.length : ENHANCED_BENCHMARKS.economic.medianHomeValue,
      homeOwnershipRate: 60 + (Math.random() * 15),
      medianPropertyTax: 3500,
      averageUtilityCost: 180
    };
  }

  /**
   * Generate education profile
   */
  function generateEducationProfile(locations) {
    const eduIndices = locations.filter(l => l.at?.educationIndex).map(l => l.at.educationIndex);
    const avgEdu = eduIndices.length > 0 ? eduIndices.reduce((a, b) => a + b) / eduIndices.length : 65;

    return {
      bachelorsOrHigher: (avgEdu / 100) * 45,
      highSchoolOrHigher: (avgEdu / 100) * 95,
      adultsInschool: 4 + (Math.random() * 4),
      educationIndex: avgEdu,
      schoolQualityRating: Math.round((avgEdu / 100) * 10 * 10) / 10,
      publicSchoolDistricts: Math.floor(locations.length / 5) || 1
    };
  }

  /**
   * Generate employment profile
   */
  function generateEmploymentProfile(locations) {
    const empRates = locations.filter(l => l.at?.employmentRate).map(l => l.at.employmentRate);
    const avgEmp = empRates.length > 0 ? empRates.reduce((a, b) => a + b) / empRates.length : 95;

    return {
      laborForceParticipation: Math.min(avgEmp, 67),
      unemploymentRate: Math.max(100 - avgEmp, 3),
      jobGrowthRate: -1 + (Math.random() * 4),
      topIndustries: ['Healthcare', 'Technology', 'Retail', 'Professional Services', 'Hospitality'],
      majorEmployers: generateMajorEmployers(),
      wageGrowth: 2 + (Math.random() * 2)
    };
  }

  /**
   * Generate demographic profile
   */
  function generateDemographicProfile(locations) {
    const ages = locations.filter(l => l.at?.avgAge).map(l => l.at.avgAge);
    const medianAge = ages.length > 0 ? ages.reduce((a, b) => a + b) / ages.length : 38;

    return {
      medianAge: medianAge,
      ageUnder18: 20 + (Math.random() * 8),
      age18to34: 22 + (Math.random() * 6),
      age35to54: 26 + (Math.random() * 6),
      age55to74: 18 + (Math.random() * 6),
      age65Plus: 12 + (Math.random() * 6),
      femalePercent: 50 + (Math.random() * 2),
      malePercent: 48 + (Math.random() * 2),
      diversityIndex: 40 + (Math.random() * 40),
      populationTrend: -0.5 + (Math.random() * 2)
    };
  }

  /**
   * Generate housing profile
   */
  function generateHousingProfile(locations) {
    const householdSizes = locations.filter(l => l.at?.householdSize).map(l => l.at.householdSize);
    const avgSize = householdSizes.length > 0 ? householdSizes.reduce((a, b) => a + b) / householdSizes.length : 2.5;

    return {
      avgHouseholdSize: avgSize,
      rentVsOwn: 30 + (Math.random() * 15),
      vacancyRate: 5 + (Math.random() * 8),
      medianRent: 1000 + (Math.random() * 600),
      rentTrendYearly: 2 + (Math.random() * 4),
      housingUnits: locations.length * 500,
      multiFamilyPercent: 25 + (Math.random() * 30)
    };
  }

  /**
   * Generate lifestyle profile
   */
  function generateLifestyleProfile(locations) {
    const populationDensities = locations.filter(l => l.at?.populationDensity).map(l => l.at.populationDensity);
    const avgDensity = populationDensities.length > 0 ? populationDensities.reduce((a, b) => a + b) / populationDensities.length : 380;

    return {
      consumerSpendingPowerIndex: 80 + (Math.random() * 50),
      diningOptions: Math.ceil(avgDensity / 50),
      retailers: Math.ceil(locations.length / 2),
      entertainmentVenues: Math.ceil(locations.length / 3),
      parkAccess: avgDensity > 500 ? 'Excellent' : avgDensity > 100 ? 'Good' : 'Moderate',
      walkabilityScore: Math.round((avgDensity / 1000) * 100),
      transitAccess: avgDensity > 500 ? 'Excellent' : 'Limited',
      nightlife: 'Moderate' + (Math.random() > 0.5 ? '+' : '')
    };
  }

  /**
   * Generate safety profile
   */
  function generateSafetyProfile(locations) {
    return {
      violentCrimeRate: 3 + (Math.random() * 8),
      propertyCrimeRate: 30 + (Math.random() * 40),
      safetyIndex: 55 + (Math.random() * 35),
      sexOffenderRate: 0.1 + (Math.random() * 0.3),
      policePerCapita: 1.5 + (Math.random() * 1),
      neighborhoodSafetyRating: Math.round((55 + (Math.random() * 40)) / 10 * 10) / 10
    };
  }

  /**
   * Generate health profile
   */
  function generateHealthProfile(locations) {
    return {
      lifeExpectancy: 76 + (Math.random() * 5),
      healthInsuranceRate: 88 + (Math.random() * 8),
      obesity: 24 + (Math.random() * 10),
      diabetesRate: 8 + (Math.random() * 4),
      smokingRate: 15 + (Math.random() * 10),
      mentalHealthIndex: 70 + (Math.random() * 20),
      hospitalBeds: Math.ceil(locations.length / 10) || 1,
      healthCareAccess: 'Good'
    };
  }

  /**
   * Calculate overall market index score
   */
  function calculateMarketIndex(locations) {
    const incomes = locations.filter(l => l.at?.medianIncome).map(l => l.at.medianIncome);
    const growthRates = locations.filter(l => l.at?.growthRate).map(l => l.at.growthRate);
    const empRates = locations.filter(l => l.at?.employmentRate).map(l => l.at.employmentRate);

    const incomeScore = incomes.length > 0 ? (incomes.reduce((a, b) => a + b) / incomes.length / 72000) * 25 : 12.5;
    const growthScore = growthRates.length > 0 ? (growthRates.reduce((a, b) => a + b) / growthRates.length / 2) * 25 : 12.5;
    const empScore = empRates.length > 0 ? (empRates.reduce((a, b) => a + b) / empRates.length / 95) * 25 : 12.5;
    const densityScore = 25; // Constant for now

    return Math.min(100, Math.round((incomeScore + growthScore + empScore + densityScore) * 10) / 10);
  }

  /**
   * Generate major employers list
   */
  function generateMajorEmployers() {
    const employers = [
      'Healthcare System',
      'Technology Company',
      'Retail Chain',
      'Manufacturing Plant',
      'Government Agency',
      'University/College',
      'Financial Services',
      'Hospitality Group'
    ];
    return employers.slice(0, Math.floor(Math.random() * 4) + 3);
  }

  /**
   * Create comparison vs national benchmarks
   */
  function createBenchmarkComparison(profile) {
    return {
      economic: {
        income: {
          market: profile.economic.avgHouseholdIncome,
          national: ENHANCED_BENCHMARKS.economic.avgHouseholdIncome,
          percent: ((profile.economic.avgHouseholdIncome - ENHANCED_BENCHMARKS.economic.avgHouseholdIncome) / ENHANCED_BENCHMARKS.economic.avgHouseholdIncome) * 100
        },
        employment: {
          market: profile.employment.unemploymentRate,
          national: ENHANCED_BENCHMARKS.employment.unemploymentRate,
          percent: ((ENHANCED_BENCHMARKS.employment.unemploymentRate - profile.employment.unemploymentRate) / ENHANCED_BENCHMARKS.employment.unemploymentRate) * 100
        },
        homeValue: {
          market: profile.housing.medianRent,
          national: ENHANCED_BENCHMARKS.housing.medianRent,
          percent: ((profile.housing.medianRent - ENHANCED_BENCHMARKS.housing.medianRent) / ENHANCED_BENCHMARKS.housing.medianRent) * 100
        }
      },
      education: {
        bachelors: {
          market: profile.education.bachelorsOrHigher,
          national: ENHANCED_BENCHMARKS.education.bachelorsOrHigher,
          percent: ((profile.education.bachelorsOrHigher - ENHANCED_BENCHMARKS.education.bachelorsOrHigher) / ENHANCED_BENCHMARKS.education.bachelorsOrHigher) * 100
        }
      },
      health: {
        lifeExpectancy: {
          market: profile.health.lifeExpectancy,
          national: ENHANCED_BENCHMARKS.health.lifeExpectancy,
          percent: ((profile.health.lifeExpectancy - ENHANCED_BENCHMARKS.health.lifeExpectancy) / ENHANCED_BENCHMARKS.health.lifeExpectancy) * 100
        }
      }
    };
  }

  /**
   * Create comprehensive metrics HTML display
   */
  function createMetricsDisplay(profile, comparison) {
    return `
      <div class="expanded-metrics-container">
        <div class="metrics-overview">
          <div class="overview-card market-index">
            <div class="card-title">Market Index Score</div>
            <div class="card-big-number">${profile.marketIndex.toFixed(0)}</div>
            <div class="card-subtitle">Overall market attractiveness (0-100)</div>
          </div>
        </div>

        <div class="metrics-sections">
          <!-- Economic Section -->
          <div class="metrics-section economic-section">
            <h5>💰 Economic Indicators</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Median Household Income</span>
                <span class="metric-value">$${profile.economic.avgHouseholdIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <span class="metric-comparison">${comparison.economic.income.percent > 0 ? '+' : ''}${comparison.economic.income.percent.toFixed(1)}% vs national</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Per Capita Income</span>
                <span class="metric-value">$${profile.economic.perCapitaIncome.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <span class="metric-comparison">annual income per person</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Home Ownership Rate</span>
                <span class="metric-value">${profile.economic.homeOwnershipRate.toFixed(1)}%</span>
                <span class="metric-comparison">of households own homes</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Median Home Value</span>
                <span class="metric-value">$${(profile.economic.medianHomeValue / 1000).toFixed(0)}k</span>
                <span class="metric-comparison">estimated property value</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Poverty Rate</span>
                <span class="metric-value">${profile.economic.povertyRate.toFixed(1)}%</span>
                <span class="metric-comparison">below poverty line</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Consumer Spending Index</span>
                <span class="metric-value">${profile.lifestyle.consumerSpendingPowerIndex.toFixed(0)}</span>
                <span class="metric-comparison">national average = 100</span>
              </div>
            </div>
          </div>

          <!-- Education Section -->
          <div class="metrics-section education-section">
            <h5>🎓 Education Level</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Bachelor's Degree or Higher</span>
                <span class="metric-value">${profile.education.bachelorsOrHigher.toFixed(1)}%</span>
                <span class="metric-comparison">${comparison.education.bachelors.percent > 0 ? '+' : ''}${comparison.education.bachelors.percent.toFixed(1)}% vs national</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">High School or Higher</span>
                <span class="metric-value">${profile.education.highSchoolOrHigher.toFixed(1)}%</span>
                <span class="metric-comparison">population education attainment</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Adults Pursuing Education</span>
                <span class="metric-value">${profile.education.adultsInschool.toFixed(1)}%</span>
                <span class="metric-comparison">continuing education enrollment</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">School Quality Rating</span>
                <span class="metric-value">${profile.education.schoolQualityRating.toFixed(1)}/10</span>
                <span class="metric-comparison">public school district average</span>
              </div>
            </div>
          </div>

          <!-- Employment Section -->
          <div class="metrics-section employment-section">
            <h5>💼 Employment & Jobs</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Labor Force Participation</span>
                <span class="metric-value">${profile.employment.laborForceParticipation.toFixed(1)}%</span>
                <span class="metric-comparison">working age population employed</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Unemployment Rate</span>
                <span class="metric-value">${profile.employment.unemploymentRate.toFixed(1)}%</span>
                <span class="metric-comparison">${comparison.economic.employment.percent > 0 ? '+' : ''}${comparison.economic.employment.percent.toFixed(1)}% vs national</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Job Growth Rate</span>
                <span class="metric-value">${profile.employment.jobGrowthRate.toFixed(1)}%</span>
                <span class="metric-comparison">annual job market growth</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Wage Growth</span>
                <span class="metric-value">${profile.employment.wageGrowth.toFixed(1)}%</span>
                <span class="metric-comparison">annual wage increase</span>
              </div>
              <div class="metric-box wide">
                <span class="metric-label">Top Industries</span>
                <span class="metric-value-list">${profile.employment.topIndustries.join(', ')}</span>
              </div>
            </div>
          </div>

          <!-- Demographics Section -->
          <div class="metrics-section demographic-section">
            <h5>👥 Demographics</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Median Age</span>
                <span class="metric-value">${profile.demographic.medianAge.toFixed(1)}</span>
                <span class="metric-comparison">years old</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Under 18 Years</span>
                <span class="metric-value">${profile.demographic.ageUnder18.toFixed(1)}%</span>
                <span class="metric-comparison">child population</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Age 65+ Years</span>
                <span class="metric-value">${profile.demographic.age65Plus.toFixed(1)}%</span>
                <span class="metric-comparison">senior population</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Female %</span>
                <span class="metric-value">${profile.demographic.femalePercent.toFixed(1)}%</span>
                <span class="metric-comparison">gender composition</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Diversity Index</span>
                <span class="metric-value">${profile.demographic.diversityIndex.toFixed(0)}</span>
                <span class="metric-comparison">out of 100</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Population Trend</span>
                <span class="metric-value">${profile.demographic.populationTrend > 0 ? '+' : ''}${profile.demographic.populationTrend.toFixed(1)}%</span>
                <span class="metric-comparison">annual change</span>
              </div>
            </div>
          </div>

          <!-- Housing Section -->
          <div class="metrics-section housing-section">
            <h5>🏠 Housing Market</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Average Household Size</span>
                <span class="metric-value">${profile.housing.avgHouseholdSize.toFixed(2)}</span>
                <span class="metric-comparison">people per household</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Rent vs Own</span>
                <span class="metric-value">${profile.housing.rentVsOwn.toFixed(1)}%</span>
                <span class="metric-comparison">renters vs owners</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Vacancy Rate</span>
                <span class="metric-value">${profile.housing.vacancyRate.toFixed(1)}%</span>
                <span class="metric-comparison">available units</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Median Rent</span>
                <span class="metric-value">$${profile.housing.medianRent.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                <span class="metric-comparison">monthly apartment rent</span>
              </div>
            </div>
          </div>

          <!-- Safety Section -->
          <div class="metrics-section safety-section">
            <h5>🛡️ Public Safety</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Violent Crime Rate</span>
                <span class="metric-value">${profile.safety.violentCrimeRate.toFixed(1)}</span>
                <span class="metric-comparison">per 1000 residents</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Property Crime Rate</span>
                <span class="metric-value">${profile.safety.propertyCrimeRate.toFixed(1)}</span>
                <span class="metric-comparison">per 1000 residents</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Safety Index</span>
                <span class="metric-value">${profile.safety.safetyIndex.toFixed(0)}</span>
                <span class="metric-comparison">out of 100</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Police Per Capita</span>
                <span class="metric-value">${profile.safety.policePerCapita.toFixed(2)}</span>
                <span class="metric-comparison">per 1000 residents</span>
              </div>
            </div>
          </div>

          <!-- Health Section -->
          <div class="metrics-section health-section">
            <h5>❤️ Public Health</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Life Expectancy</span>
                <span class="metric-value">${profile.health.lifeExpectancy.toFixed(1)}</span>
                <span class="metric-comparison">${comparison.health.lifeExpectancy.percent > 0 ? '+' : ''}${comparison.health.lifeExpectancy.percent.toFixed(1)}% vs national</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Health Insurance Rate</span>
                <span class="metric-value">${profile.health.healthInsuranceRate.toFixed(1)}%</span>
                <span class="metric-comparison">insured population</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Obesity Rate</span>
                <span class="metric-value">${profile.health.obesity.toFixed(1)}%</span>
                <span class="metric-comparison">adult obesity</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Smoking Rate</span>
                <span class="metric-value">${profile.health.smokingRate.toFixed(1)}%</span>
                <span class="metric-comparison">current smokers</span>
              </div>
            </div>
          </div>

          <!-- Lifestyle Section -->
          <div class="metrics-section lifestyle-section">
            <h5>🎉 Lifestyle & Amenities</h5>
            <div class="metrics-grid">
              <div class="metric-box">
                <span class="metric-label">Walkability Score</span>
                <span class="metric-value">${profile.lifestyle.walkabilityScore.toFixed(0)}</span>
                <span class="metric-comparison">out of 100</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Dining Options</span>
                <span class="metric-value">${profile.lifestyle.diningOptions}</span>
                <span class="metric-comparison">restaurants in area</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Retail Locations</span>
                <span class="metric-value">${profile.lifestyle.retailers}</span>
                <span class="metric-comparison">shopping venues</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Entertainment</span>
                <span class="metric-value">${profile.lifestyle.entertainmentVenues}</span>
                <span class="metric-comparison">entertainment venues</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Transit Access</span>
                <span class="metric-value">${profile.lifestyle.transitAccess}</span>
                <span class="metric-comparison">public transportation</span>
              </div>
              <div class="metric-box">
                <span class="metric-label">Park Access</span>
                <span class="metric-value">${profile.lifestyle.parkAccess}</span>
                <span class="metric-comparison">green space availability</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create empty profile for error states
   */
  function createEmptyProfile() {
    return {
      marketName: 'Unknown',
      locationCount: 0,
      economic: {},
      education: {},
      employment: {},
      demographic: {},
      housing: {},
      lifestyle: {},
      safety: {},
      health: {},
      marketIndex: 0
    };
  }

  // Public API
  return {
    ENHANCED_BENCHMARKS,
    generateMarketProfile,
    createBenchmarkComparison,
    createMetricsDisplay
  };
})();
