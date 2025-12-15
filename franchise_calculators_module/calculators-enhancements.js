/* ============================================================================
   CALCULATOR ENHANCEMENTS - Interactive Features & Dynamic Forecasts
   ============================================================================ */

// Enhanced ZIP code database with realistic demographic data
const ZIP_DATABASE = {
    '10001': { coords: [40.7506, -73.9971], city: 'New York, NY', population: 45000, medianIncome: 85000, trafficScore: 95 },
    '90001': { coords: [33.9731, -118.2479], city: 'Los Angeles, CA', population: 57000, medianIncome: 42000, trafficScore: 85 },
    '60601': { coords: [41.8856, -87.6212], city: 'Chicago, IL', population: 38000, medianIncome: 72000, trafficScore: 88 },
    '33101': { coords: [25.7749, -80.1947], city: 'Miami, FL', population: 52000, medianIncome: 55000, trafficScore: 82 },
    '94102': { coords: [37.7799, -122.4200], city: 'San Francisco, CA', population: 41000, medianIncome: 112000, trafficScore: 92 },
    '75201': { coords: [32.7831, -96.7968], city: 'Dallas, TX', population: 35000, medianIncome: 68000, trafficScore: 78 },
    '85001': { coords: [33.4484, -112.0740], city: 'Phoenix, AZ', population: 48000, medianIncome: 58000, trafficScore: 75 },
    '98101': { coords: [47.6062, -122.3321], city: 'Seattle, WA', population: 43000, medianIncome: 95000, trafficScore: 86 },
    '02101': { coords: [42.3601, -71.0589], city: 'Boston, MA', population: 39000, medianIncome: 88000, trafficScore: 90 },
    '30301': { coords: [33.7490, -84.3880], city: 'Atlanta, GA', population: 46000, medianIncome: 65000, trafficScore: 80 }
};

// ============================================================================
// SCENARIO PLANNING FOR FINANCIAL MODEL
// ============================================================================

/**
 * Add scenario planning sliders to Financial Model Builder
 */
window.addScenarioPlanning = function() {
    const container = document.createElement('div');
    container.className = 'scenario-planning';
    container.innerHTML = `
        <h3>📊 Scenario Planning</h3>
        <p class="scenario-subtitle">Adjust assumptions to see different outcomes</p>

        <div class="scenario-controls">
            <div class="scenario-slider">
                <label>
                    <span>Growth Rate: <strong id="growth-scenario-val">5%</strong></span>
                    <input type="range" id="growth-scenario" min="0" max="20" value="5" step="0.5"
                           oninput="updateScenario('growth', this.value)">
                    <div class="slider-labels">
                        <span>Conservative (0%)</span>
                        <span>Aggressive (20%)</span>
                    </div>
                </label>
            </div>

            <div class="scenario-slider">
                <label>
                    <span>Labor Cost: <strong id="labor-scenario-val">28%</strong></span>
                    <input type="range" id="labor-scenario" min="20" max="40" value="28" step="0.5"
                           oninput="updateScenario('labor', this.value)">
                    <div class="slider-labels">
                        <span>Lean (20%)</span>
                        <span>High (40%)</span>
                    </div>
                </label>
            </div>

            <div class="scenario-slider">
                <label>
                    <span>Revenue Multiplier: <strong id="revenue-scenario-val">100%</strong></span>
                    <input type="range" id="revenue-scenario" min="70" max="130" value="100" step="5"
                           oninput="updateScenario('revenue', this.value)">
                    <div class="slider-labels">
                        <span>Pessimistic (70%)</span>
                        <span>Optimistic (130%)</span>
                    </div>
                </label>
            </div>
        </div>

        <div class="scenario-presets">
            <button class="preset-btn" onclick="applyScenario('pessimistic')">😟 Pessimistic</button>
            <button class="preset-btn" onclick="applyScenario('realistic')">😐 Realistic</button>
            <button class="preset-btn" onclick="applyScenario('optimistic')">😊 Optimistic</button>
        </div>

        <div id="scenario-comparison"></div>
    `;

    return container;
};

window.updateScenario = function(type, value) {
    document.getElementById(`${type}-scenario-val`).textContent = value + '%';
    // Auto-rebuild model with new values
    if (window.scenarioAutoUpdate) {
        clearTimeout(window.scenarioAutoUpdate);
    }
    window.scenarioAutoUpdate = setTimeout(() => {
        buildFinancialModelWithScenarios();
    }, 500);
};

window.applyScenario = function(scenario) {
    const scenarios = {
        pessimistic: { growth: 2, labor: 35, revenue: 80 },
        realistic: { growth: 5, labor: 28, revenue: 100 },
        optimistic: { growth: 12, labor: 22, revenue: 120 }
    };

    const preset = scenarios[scenario];
    document.getElementById('growth-scenario').value = preset.growth;
    document.getElementById('labor-scenario').value = preset.labor;
    document.getElementById('revenue-scenario').value = preset.revenue;

    document.getElementById('growth-scenario-val').textContent = preset.growth + '%';
    document.getElementById('labor-scenario-val').textContent = preset.labor + '%';
    document.getElementById('revenue-scenario-val').textContent = preset.revenue + '%';

    buildFinancialModelWithScenarios();
};

window.buildFinancialModelWithScenarios = function() {
    // Get current inputs
    const avgTicket = parseFloat(document.getElementById('fm-ticket').value);
    const dailyTransactions = parseFloat(document.getElementById('fm-transactions').value);

    // Get scenario adjustments
    const growthRate = parseFloat(document.getElementById('growth-scenario').value) / 100;
    const laborPercent = parseFloat(document.getElementById('labor-scenario').value) / 100;
    const revenueMultiplier = parseFloat(document.getElementById('revenue-scenario').value) / 100;

    // Get other inputs
    const cogsPercent = parseFloat(document.getElementById('fm-cogs').value) / 100;
    const royaltyPercent = parseFloat(document.getElementById('fm-royalty').value) / 100;
    const rent = parseFloat(document.getElementById('fm-rent').value);
    const utilities = parseFloat(document.getElementById('fm-utilities').value);
    const marketing = parseFloat(document.getElementById('fm-marketing').value);
    const insurance = parseFloat(document.getElementById('fm-insurance').value);
    const initialInvestment = parseFloat(document.getElementById('fm-investment').value);

    // Calculate base monthly revenue with multiplier
    const baseMonthlyRevenue = avgTicket * dailyTransactions * 30 * revenueMultiplier;

    // Build 5-year model with scenarios
    const yearlyData = [];
    for (let year = 1; year <= 5; year++) {
        const yearRevenue = baseMonthlyRevenue * 12 * Math.pow(1 + growthRate, year - 1);
        const cogs = yearRevenue * cogsPercent;
        const labor = yearRevenue * laborPercent;
        const royalty = yearRevenue * royaltyPercent;
        const fixedCosts = (rent + utilities + marketing + insurance) * 12;
        const totalExpenses = cogs + labor + royalty + fixedCosts;
        const ebitda = yearRevenue - totalExpenses;
        const margin = (ebitda / yearRevenue) * 100;

        yearlyData.push({ year, revenue: yearRevenue, ebitda, margin });
    }

    // Update scenario comparison
    const comparisonDiv = document.getElementById('scenario-comparison');
    if (comparisonDiv) {
        comparisonDiv.innerHTML = `
            <div class="scenario-results">
                <h4>Scenario Impact</h4>
                <div class="scenario-metrics">
                    <div class="scenario-metric">
                        <span>Year 1 EBITDA:</span>
                        <strong class="${yearlyData[0].ebitda > 0 ? 'positive' : 'negative'}">
                            ${formatCurrency(yearlyData[0].ebitda)}
                        </strong>
                    </div>
                    <div class="scenario-metric">
                        <span>Year 5 Revenue:</span>
                        <strong>${formatCurrency(yearlyData[4].revenue)}</strong>
                    </div>
                    <div class="scenario-metric">
                        <span>5-Year Total:</span>
                        <strong>${formatCurrency(yearlyData.reduce((sum, y) => sum + y.ebitda, 0))}</strong>
                    </div>
                </div>
            </div>
        `;
    }
};

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

window.addSensitivityAnalysis = function() {
    const container = document.createElement('div');
    container.className = 'sensitivity-analysis';
    container.innerHTML = `
        <h3>🎯 Sensitivity Analysis</h3>
        <p class="sensitivity-subtitle">See how changes impact profitability</p>

        <div class="sensitivity-table-container">
            <table class="sensitivity-table">
                <thead>
                    <tr>
                        <th>Variable</th>
                        <th>-20%</th>
                        <th>-10%</th>
                        <th>Base</th>
                        <th>+10%</th>
                        <th>+20%</th>
                    </tr>
                </thead>
                <tbody id="sensitivity-tbody">
                    <!-- Populated dynamically -->
                </tbody>
            </table>
        </div>

        <div class="sensitivity-chart-container">
            <canvas id="sensitivity-chart"></canvas>
        </div>
    `;

    return container;
};

window.calculateSensitivity = function(baseEbitda, avgTicket, dailyTrans, cogsPercent, laborPercent) {
    const variables = [
        { name: 'Average Ticket', base: avgTicket, type: 'revenue' },
        { name: 'Daily Transactions', base: dailyTrans, type: 'revenue' },
        { name: 'COGS %', base: cogsPercent, type: 'expense' },
        { name: 'Labor %', base: laborPercent, type: 'expense' }
    ];

    const tbody = document.getElementById('sensitivity-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    variables.forEach(variable => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${variable.name}</strong></td>
            <td class="negative">${formatCurrency(calculateVariableImpact(baseEbitda, variable, -0.2))}</td>
            <td class="neutral">${formatCurrency(calculateVariableImpact(baseEbitda, variable, -0.1))}</td>
            <td><strong>${formatCurrency(baseEbitda)}</strong></td>
            <td class="neutral">${formatCurrency(calculateVariableImpact(baseEbitda, variable, 0.1))}</td>
            <td class="positive">${formatCurrency(calculateVariableImpact(baseEbitda, variable, 0.2))}</td>
        `;
    });
};

function calculateVariableImpact(baseEbitda, variable, change) {
    // Simplified impact calculation
    const revenueImpact = variable.type === 'revenue' ? change : 0;
    const expenseImpact = variable.type === 'expense' ? -change : 0;

    return baseEbitda * (1 + revenueImpact + expenseImpact);
}
