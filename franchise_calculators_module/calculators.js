/* ============================================================================
   FRANCHISE FINANCIAL CALCULATORS - JAVASCRIPT
   Version: 1.0
   Zero Dependencies (except Leaflet for maps)
   ============================================================================ */

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the franchise calculators module
 * This is the main entry point that can be called from any page
 */
window.initFranchiseCalculators = function() {
    console.log('🧮 Initializing Franchise Calculators...');

    // Initialize tab system
    initTabs();

    // Render all calculators
    renderROI();
    renderItem7();
    renderRoyalty();
    renderCashFlow();
    renderBreakEven();
    renderGrossMargin();
    renderUnitEconomics();
    renderPayback();
    renderEmployeeCost();
    renderWorkingCapital();
    renderScaling();
    renderFranchiseCompare();
    renderPenetration();
    renderMap();
    renderSBALoan();

    console.log('✅ Franchise Calculators initialized successfully');
};

// ============================================================================
// TAB SYSTEM
// ============================================================================

function initTabs() {
    const tabs = document.querySelectorAll('.calc-tab');
    const contents = document.querySelectorAll('.calc-tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');

            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked tab and corresponding content
            this.classList.add('active');
            document.getElementById(`tab-${targetTab}`).classList.add('active');
        });
    });
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

function formatPercent(value) {
    return value.toFixed(2) + '%';
}

function formatNumber(value, decimals = 0) {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Validates a numeric input field
 * @param {string} value - The input value to validate
 * @param {string} fieldName - The name of the field for error messages
 * @param {number} min - Minimum allowed value (optional)
 * @returns {object} - {valid: boolean, error: string}
 */
function validateNumberInput(value, fieldName, min = 0) {
    const num = parseFloat(value);

    if (!value || value.trim() === '') {
        return { valid: false, error: `${fieldName} is required` };
    }

    if (isNaN(num)) {
        return { valid: false, error: `${fieldName} must be a valid number` };
    }

    if (num < min) {
        return { valid: false, error: `${fieldName} must be greater than ${min}` };
    }

    return { valid: true, error: null };
}

/**
 * Displays an error message in a user-friendly way
 * @param {string} message - The error message to display
 * @param {string} containerId - The ID of the container to display the error in
 */
function showError(message, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="calc-alert calc-alert-error">
            ⚠️ <strong>Error:</strong> ${message}
        </div>
    `;
}

// ============================================================================
// CHART UTILITIES
// ============================================================================

/**
 * Global chart instances to enable cleanup
 */
const chartInstances = {};

/**
 * Default Chart.js configuration for professional-looking charts
 */
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            labels: {
                color: '#e0e0e0',
                font: {
                    family: 'Inter, sans-serif',
                    size: 12,
                    weight: 500
                },
                padding: 15
            }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#fff',
            bodyColor: '#e0e0e0',
            borderColor: '#00897b',
            borderWidth: 1,
            padding: 12,
            displayColors: true,
            titleFont: {
                size: 13,
                weight: '600'
            },
            bodyFont: {
                size: 12
            },
            callbacks: {
                label: function(context) {
                    let label = context.dataset.label || '';
                    if (label) {
                        label += ': ';
                    }
                    if (context.parsed.y !== null) {
                        label += formatCurrency(context.parsed.y);
                    }
                    return label;
                }
            }
        }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                color: '#999',
                font: {
                    size: 11
                },
                callback: function(value) {
                    return formatCurrency(value);
                }
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.06)',
                drawBorder: false
            }
        },
        x: {
            ticks: {
                color: '#999',
                font: {
                    size: 11
                }
            },
            grid: {
                color: 'rgba(255, 255, 255, 0.06)',
                drawBorder: false
            }
        }
    }
};

/**
 * Creates a line chart for financial projections
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} labels - Array of labels (e.g., years, months)
 * @param {Array} datasets - Array of dataset objects
 * @param {string} title - Chart title
 * @returns {Chart} Chart instance
 */
function createLineChart(canvasId, labels, datasets, title) {
    // Destroy existing chart if it exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets.map(ds => ({
                ...ds,
                borderWidth: 3,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: ds.borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                fill: ds.fill !== undefined ? ds.fill : true,
                backgroundColor: ds.backgroundColor || 'rgba(0, 137, 123, 0.1)'
            }))
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                title: {
                    display: true,
                    text: title,
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: '600',
                        family: 'Inter, sans-serif'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        }
    });

    return chartInstances[canvasId];
}

/**
 * Creates a bar chart for comparisons
 * @param {string} canvasId - ID of the canvas element
 * @param {Array} labels - Array of labels
 * @param {Array} datasets - Array of dataset objects
 * @param {string} title - Chart title
 * @returns {Chart} Chart instance
 */
function createBarChart(canvasId, labels, datasets, title) {
    // Destroy existing chart if it exists
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const ctx = document.getElementById(canvasId).getContext('2d');

    chartInstances[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: datasets.map(ds => ({
                ...ds,
                borderWidth: 0,
                borderRadius: 6,
                backgroundColor: ds.backgroundColor || 'rgba(0, 137, 123, 0.8)'
            }))
        },
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                title: {
                    display: true,
                    text: title,
                    color: '#fff',
                    font: {
                        size: 16,
                        weight: '600',
                        family: 'Inter, sans-serif'
                    },
                    padding: {
                        top: 10,
                        bottom: 20
                    }
                }
            }
        }
    });

    return chartInstances[canvasId];
}

/**
 * Downloads a chart as PNG image
 * @param {string} canvasId - ID of the canvas element
 * @param {string} filename - Desired filename (without extension)
 */
function downloadChart(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = url;
    link.click();
}

// ============================================================================
// CALCULATOR 1: ROI CALCULATOR
// ============================================================================

function renderROI() {
    const container = document.getElementById('calculator-roi');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="roi-profit">Annual Net Profit</label>
                <input type="number" id="roi-profit" value="75000" min="0" step="1000" required>
                <span class="calc-input-hint">Expected net profit per year after all expenses</span>
            </div>

            <div class="calc-input-group">
                <label for="roi-investment">Total Initial Investment</label>
                <input type="number" id="roi-investment" value="350000" min="0" step="1000" required>
                <span class="calc-input-hint">Total amount invested to start the franchise</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateROI()">Calculate ROI</button>
                <button class="calc-button calc-button-secondary" onclick="resetROI()">Reset</button>
            </div>
        </div>

        <div id="roi-results"></div>
    `;
}

function resetROI() {
    document.getElementById('roi-profit').value = '75000';
    document.getElementById('roi-investment').value = '350000';
    document.getElementById('roi-results').innerHTML = '';
}

function calculateROI() {
    const profitValue = document.getElementById('roi-profit').value;
    const investmentValue = document.getElementById('roi-investment').value;

    // Validate inputs
    const profitValidation = validateNumberInput(profitValue, 'Annual Net Profit', 0);
    if (!profitValidation.valid) {
        showError(profitValidation.error, 'roi-results');
        return;
    }

    const investmentValidation = validateNumberInput(investmentValue, 'Total Initial Investment', 1);
    if (!investmentValidation.valid) {
        showError(investmentValidation.error, 'roi-results');
        return;
    }

    const profit = parseFloat(profitValue);
    const investment = parseFloat(investmentValue);

    const roi = (profit / investment) * 100;
    const yearsToBreakeven = investment / profit;
    const monthsToBreakeven = yearsToBreakeven * 12;
    const monthlyBreakeven = investment / 12;

    // Generate 5-year projection data
    const years = ['Year 0', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];
    const cumulativeProfit = [
        -investment,  // Year 0 (initial investment)
        profit - investment,  // Year 1
        (profit * 2) - investment,  // Year 2
        (profit * 3) - investment,  // Year 3
        (profit * 4) - investment,  // Year 4
        (profit * 5) - investment   // Year 5
    ];
    const annualProfit = [0, profit, profit, profit, profit, profit];

    const resultsContainer = document.getElementById('roi-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>📊 ROI Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Return on Investment</div>
                    <div class="calc-result-value ${roi > 20 ? 'positive' : roi > 10 ? 'neutral' : 'negative'}">
                        ${formatPercent(roi)}
                    </div>
                    <div class="calc-result-subtitle">Annual ROI</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Years to Breakeven</div>
                    <div class="calc-result-value neutral">
                        ${yearsToBreakeven.toFixed(1)}
                    </div>
                    <div class="calc-result-subtitle">(${monthsToBreakeven.toFixed(0)} months)</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">5-Year Net Profit</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency((profit * 5) - investment)}
                    </div>
                    <div class="calc-result-subtitle">Total after 5 years</div>
                </div>
            </div>

            ${roi < 15 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Note:</strong> ROI below 15% may indicate lower profitability. Industry standard for franchise ROI is typically 15-25%.
                </div>
            ` : roi > 30 ? `
                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Excellent!</strong> ROI above 30% indicates strong profitability potential.
                </div>
            ` : ''}

            <div class="calc-chart-container">
                <div class="calc-chart-header">
                    <h4>📈 5-Year Profit Projection</h4>
                    <button class="calc-button-small" onclick="downloadChart('roi-chart', 'roi-projection')">
                        💾 Download Chart
                    </button>
                </div>
                <canvas id="roi-chart"></canvas>
            </div>
        </div>
    `;

    // Create the chart
    createLineChart('roi-chart', years, [
        {
            label: 'Cumulative Profit',
            data: cumulativeProfit,
            borderColor: '#00897b',
            backgroundColor: 'rgba(0, 137, 123, 0.1)',
            fill: true
        },
        {
            label: 'Annual Profit',
            data: annualProfit,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true
        }
    ], 'Investment Recovery & Profit Timeline');
}

// ============================================================================
// CALCULATOR 2: ITEM 7 INITIAL INVESTMENT ESTIMATOR
// ============================================================================

function renderItem7() {
    const container = document.getElementById('calculator-item7');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="item7-min">Minimum Investment (Item 7)</label>
                <input type="number" id="item7-min" value="250000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="item7-max">Maximum Investment (Item 7)</label>
                <input type="number" id="item7-max" value="500000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="item7-working">Working Capital (3 months)</label>
                <input type="number" id="item7-working" value="50000" min="0" step="1000" required>
                <span class="calc-input-hint">Recommended: 3-6 months of operating expenses</span>
            </div>

            <div class="calc-input-group">
                <label for="item7-franchise">Franchise Fee</label>
                <input type="number" id="item7-franchise" value="45000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label>Real Estate Cost</label>
                <div class="calc-toggle">
                    <span>Not Included</span>
                    <label class="calc-toggle-switch">
                        <input type="checkbox" id="item7-realestate">
                        <span class="calc-toggle-slider"></span>
                    </label>
                    <span>Included in Item 7</span>
                </div>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateItem7()">Calculate Investment</button>
                <button class="calc-button calc-button-secondary" onclick="resetItem7()">Reset</button>
            </div>
        </div>

        <div id="item7-results"></div>
    `;
}

function resetItem7() {
    document.getElementById('item7-min').value = '250000';
    document.getElementById('item7-max').value = '500000';
    document.getElementById('item7-working').value = '50000';
    document.getElementById('item7-franchise').value = '45000';
    document.getElementById('item7-realestate').checked = false;
    document.getElementById('item7-results').innerHTML = '';
}

function calculateItem7() {
    const min = parseFloat(document.getElementById('item7-min').value);
    const max = parseFloat(document.getElementById('item7-max').value);
    const working = parseFloat(document.getElementById('item7-working').value);
    const franchise = parseFloat(document.getElementById('item7-franchise').value);
    const realEstateIncluded = document.getElementById('item7-realestate').checked;

    const totalMin = min + (realEstateIncluded ? 0 : working);
    const totalMax = max + (realEstateIncluded ? 0 : working);
    const avgInvestment = (totalMin + totalMax) / 2;
    const threeMonthBurn = working / 3;

    const resultsContainer = document.getElementById('item7-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>💼 Total Investment Required</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Minimum Required</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(totalMin)}
                    </div>
                    <div class="calc-result-subtitle">Low-end estimate</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Maximum Required</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(totalMax)}
                    </div>
                    <div class="calc-result-subtitle">High-end estimate</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Average Investment</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(avgInvestment)}
                    </div>
                    <div class="calc-result-subtitle">Expected total</div>
                </div>
            </div>

            <h3 class="calc-mt-20">🔍 Investment Breakdown</h3>
            <table class="calc-table">
                <tr>
                    <th>Component</th>
                    <th>Amount</th>
                    <th>% of Total</th>
                </tr>
                <tr>
                    <td>Franchise Fee</td>
                    <td>${formatCurrency(franchise)}</td>
                    <td>${((franchise / avgInvestment) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Working Capital</td>
                    <td>${formatCurrency(working)}</td>
                    <td>${((working / avgInvestment) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Equipment & Build-Out</td>
                    <td>${formatCurrency(avgInvestment - franchise - working)}</td>
                    <td>${(((avgInvestment - franchise - working) / avgInvestment) * 100).toFixed(1)}%</td>
                </tr>
            </table>

            <div class="calc-alert calc-alert-info calc-mt-20">
                💡 <strong>Cash Burn Estimate:</strong> ${formatCurrency(threeMonthBurn)}/month for first 3 months
            </div>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 3: ROYALTY + MARKETING FEE BREAKDOWN
// ============================================================================

function renderRoyalty() {
    const container = document.getElementById('calculator-royalty');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="royalty-revenue">Monthly Gross Revenue</label>
                <input type="number" id="royalty-revenue" value="100000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="royalty-rate">Royalty Rate (%)</label>
                <input type="number" id="royalty-rate" value="6" min="0" max="100" step="0.1" required>
            </div>

            <div class="calc-input-group">
                <label for="royalty-marketing">Marketing Fund Rate (%)</label>
                <input type="number" id="royalty-marketing" value="2" min="0" max="100" step="0.1" required>
            </div>

            <div class="calc-input-group">
                <label for="royalty-local">Local Advertising Spend</label>
                <input type="number" id="royalty-local" value="2000" min="0" step="100" required>
            </div>

            <div class="calc-input-group">
                <label for="royalty-additional">Additional Franchise Fees</label>
                <input type="number" id="royalty-additional" value="500" min="0" step="50" required>
                <span class="calc-input-hint">Technology fees, training fees, etc.</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateRoyalty()">Calculate Fees</button>
                <button class="calc-button calc-button-secondary" onclick="resetRoyalty()">Reset</button>
            </div>
        </div>

        <div id="royalty-results"></div>
    `;
}

function resetRoyalty() {
    document.getElementById('royalty-revenue').value = '100000';
    document.getElementById('royalty-rate').value = '6';
    document.getElementById('royalty-marketing').value = '2';
    document.getElementById('royalty-local').value = '2000';
    document.getElementById('royalty-additional').value = '500';
    document.getElementById('royalty-results').innerHTML = '';
}

function calculateRoyalty() {
    const revenue = parseFloat(document.getElementById('royalty-revenue').value);
    const royaltyRate = parseFloat(document.getElementById('royalty-rate').value);
    const marketingRate = parseFloat(document.getElementById('royalty-marketing').value);
    const localAd = parseFloat(document.getElementById('royalty-local').value);
    const additional = parseFloat(document.getElementById('royalty-additional').value);

    const royaltyAmount = revenue * (royaltyRate / 100);
    const marketingAmount = revenue * (marketingRate / 100);
    const totalFees = royaltyAmount + marketingAmount + localAd + additional;
    const effectiveRate = (totalFees / revenue) * 100;
    const annualFees = totalFees * 12;

    const resultsContainer = document.getElementById('royalty-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>💳 Monthly Franchise Fees</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Royalty Fee</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(royaltyAmount)}
                    </div>
                    <div class="calc-result-subtitle">${royaltyRate}% of revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Marketing Fund</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(marketingAmount)}
                    </div>
                    <div class="calc-result-subtitle">${marketingRate}% of revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Monthly Fees</div>
                    <div class="calc-result-value ${effectiveRate > 12 ? 'negative' : 'neutral'}">
                        ${formatCurrency(totalFees)}
                    </div>
                    <div class="calc-result-subtitle">All franchise costs</div>
                </div>
            </div>

            <div class="calc-result-grid calc-mt-20">
                <div class="calc-result-card">
                    <div class="calc-result-label">Effective Royalty Rate</div>
                    <div class="calc-result-value ${effectiveRate > 12 ? 'negative' : 'neutral'}">
                        ${formatPercent(effectiveRate)}
                    </div>
                    <div class="calc-result-subtitle">Total fees as % of revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Annual Franchise Fees</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(annualFees)}
                    </div>
                    <div class="calc-result-subtitle">12-month total</div>
                </div>
            </div>

            <h3 class="calc-mt-20">📊 Fee Breakdown</h3>
            <table class="calc-table">
                <tr>
                    <th>Fee Type</th>
                    <th>Monthly</th>
                    <th>Annual</th>
                    <th>% of Total Fees</th>
                </tr>
                <tr>
                    <td>Royalty</td>
                    <td>${formatCurrency(royaltyAmount)}</td>
                    <td>${formatCurrency(royaltyAmount * 12)}</td>
                    <td>${((royaltyAmount / totalFees) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Marketing Fund</td>
                    <td>${formatCurrency(marketingAmount)}</td>
                    <td>${formatCurrency(marketingAmount * 12)}</td>
                    <td>${((marketingAmount / totalFees) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Local Advertising</td>
                    <td>${formatCurrency(localAd)}</td>
                    <td>${formatCurrency(localAd * 12)}</td>
                    <td>${((localAd / totalFees) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Additional Fees</td>
                    <td>${formatCurrency(additional)}</td>
                    <td>${formatCurrency(additional * 12)}</td>
                    <td>${((additional / totalFees) * 100).toFixed(1)}%</td>
                </tr>
            </table>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 4: FRANCHISEE CASH FLOW ESTIMATOR
// ============================================================================

function renderCashFlow() {
    const container = document.getElementById('calculator-cashflow');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="cf-revenue">Monthly Gross Revenue</label>
                <input type="number" id="cf-revenue" value="120000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-cogs">Cost of Goods Sold (%)</label>
                <input type="number" id="cf-cogs" value="30" min="0" max="100" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-labor">Labor Cost (%)</label>
                <input type="number" id="cf-labor" value="25" min="0" max="100" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-rent">Monthly Rent</label>
                <input type="number" id="cf-rent" value="5000" min="0" step="100" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-utilities">Utilities & Services</label>
                <input type="number" id="cf-utilities" value="1500" min="0" step="100" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-insurance">Insurance</label>
                <input type="number" id="cf-insurance" value="800" min="0" step="50" required>
            </div>

            <div class="calc-input-group">
                <label for="cf-misc">Miscellaneous Expenses</label>
                <input type="number" id="cf-misc" value="2000" min="0" step="100" required>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateCashFlow()">Calculate Cash Flow</button>
                <button class="calc-button calc-button-secondary" onclick="resetCashFlow()">Reset</button>
            </div>
        </div>

        <div id="cf-results"></div>
    `;
}

function resetCashFlow() {
    document.getElementById('cf-revenue').value = '120000';
    document.getElementById('cf-cogs').value = '30';
    document.getElementById('cf-labor').value = '25';
    document.getElementById('cf-rent').value = '5000';
    document.getElementById('cf-utilities').value = '1500';
    document.getElementById('cf-insurance').value = '800';
    document.getElementById('cf-misc').value = '2000';
    document.getElementById('cf-results').innerHTML = '';
}

function calculateCashFlow() {
    const revenue = parseFloat(document.getElementById('cf-revenue').value);
    const cogsPercent = parseFloat(document.getElementById('cf-cogs').value);
    const laborPercent = parseFloat(document.getElementById('cf-labor').value);
    const rent = parseFloat(document.getElementById('cf-rent').value);
    const utilities = parseFloat(document.getElementById('cf-utilities').value);
    const insurance = parseFloat(document.getElementById('cf-insurance').value);
    const misc = parseFloat(document.getElementById('cf-misc').value);

    const cogs = revenue * (cogsPercent / 100);
    const labor = revenue * (laborPercent / 100);
    const totalExpenses = cogs + labor + rent + utilities + insurance + misc;
    const ebitda = revenue - totalExpenses;
    const cashFlowMargin = (ebitda / revenue) * 100;
    const annualCashFlow = ebitda * 12;

    const resultsContainer = document.getElementById('cf-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>💵 Monthly Cash Flow Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Gross Revenue</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(revenue)}
                    </div>
                    <div class="calc-result-subtitle">Total sales</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Expenses</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalExpenses)}
                    </div>
                    <div class="calc-result-subtitle">${((totalExpenses / revenue) * 100).toFixed(1)}% of revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">EBITDA / Net Cash Flow</div>
                    <div class="calc-result-value ${ebitda > 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(ebitda)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent(cashFlowMargin)} margin</div>
                </div>
            </div>

            <div class="calc-result-grid calc-mt-20">
                <div class="calc-result-card">
                    <div class="calc-result-label">Annual Cash Flow</div>
                    <div class="calc-result-value ${annualCashFlow > 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(annualCashFlow)}
                    </div>
                    <div class="calc-result-subtitle">12-month projection</div>
                </div>
            </div>

            <h3 class="calc-mt-20">📊 Expense Breakdown</h3>
            <table class="calc-table">
                <tr>
                    <th>Expense Category</th>
                    <th>Amount</th>
                    <th>% of Revenue</th>
                </tr>
                <tr>
                    <td>Cost of Goods Sold</td>
                    <td>${formatCurrency(cogs)}</td>
                    <td>${cogsPercent}%</td>
                </tr>
                <tr>
                    <td>Labor</td>
                    <td>${formatCurrency(labor)}</td>
                    <td>${laborPercent}%</td>
                </tr>
                <tr>
                    <td>Rent</td>
                    <td>${formatCurrency(rent)}</td>
                    <td>${((rent / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Utilities & Services</td>
                    <td>${formatCurrency(utilities)}</td>
                    <td>${((utilities / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Insurance</td>
                    <td>${formatCurrency(insurance)}</td>
                    <td>${((insurance / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Miscellaneous</td>
                    <td>${formatCurrency(misc)}</td>
                    <td>${((misc / revenue) * 100).toFixed(1)}%</td>
                </tr>
                <tr style="font-weight: 700; background: #f5f5f5;">
                    <td>Total</td>
                    <td>${formatCurrency(totalExpenses)}</td>
                    <td>${((totalExpenses / revenue) * 100).toFixed(1)}%</td>
                </tr>
            </table>

            ${cashFlowMargin < 10 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Low Margin:</strong> Cash flow margin below 10% may indicate tight profitability. Industry standard is typically 15-25%.
                </div>
            ` : cashFlowMargin > 20 ? `
                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Strong Performance:</strong> Cash flow margin above 20% indicates healthy profitability.
                </div>
            ` : ''}

            <div class="calc-chart-container">
                <div class="calc-chart-header">
                    <h4>📊 12-Month Cash Flow Projection</h4>
                    <button class="calc-button-small" onclick="downloadChart('cashflow-chart', 'cashflow-projection')">
                        💾 Download Chart
                    </button>
                </div>
                <canvas id="cashflow-chart"></canvas>
            </div>
        </div>
    `;

    // Generate 12-month projection data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const revenueData = new Array(12).fill(revenue);
    const expenseData = new Array(12).fill(totalExpenses);
    const cashFlowData = new Array(12).fill(ebitda);

    // Create the chart
    createLineChart('cashflow-chart', months, [
        {
            label: 'Revenue',
            data: revenueData,
            borderColor: '#00897b',
            backgroundColor: 'rgba(0, 137, 123, 0.1)',
            fill: true
        },
        {
            label: 'Expenses',
            data: expenseData,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fill: true
        },
        {
            label: 'Net Cash Flow',
            data: cashFlowData,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true
        }
    ], 'Monthly Financial Performance');
}

// ============================================================================
// CALCULATOR 4B: BREAK-EVEN ANALYSIS
// ============================================================================

function renderBreakEven() {
    const container = document.getElementById('calculator-breakeven');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="be-fixed">Monthly Fixed Costs</label>
                <input type="number" id="be-fixed" value="25000" min="0" step="500" required>
                <span class="calc-input-hint">Rent, salaries, insurance, utilities, etc.</span>
            </div>

            <div class="calc-input-group">
                <label for="be-price">Average Selling Price per Unit</label>
                <input type="number" id="be-price" value="15" min="0.01" step="0.5" required>
                <span class="calc-input-hint">Average price per product/service sold</span>
            </div>

            <div class="calc-input-group">
                <label for="be-variable">Variable Cost per Unit</label>
                <input type="number" id="be-variable" value="6" min="0" step="0.5" required>
                <span class="calc-input-hint">COGS, supplies, commissions per sale</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateBreakEven()">Calculate Break-Even Point</button>
                <button class="calc-button calc-button-secondary" onclick="resetBreakEven()">Reset</button>
            </div>
        </div>

        <div id="be-results"></div>
    `;
}

function resetBreakEven() {
    document.getElementById('be-fixed').value = '25000';
    document.getElementById('be-price').value = '15';
    document.getElementById('be-variable').value = '6';
    document.getElementById('be-results').innerHTML = '';
}

function calculateBreakEven() {
    const fixedCosts = parseFloat(document.getElementById('be-fixed').value);
    const price = parseFloat(document.getElementById('be-price').value);
    const variableCost = parseFloat(document.getElementById('be-variable').value);

    if (price <= variableCost) {
        alert('Selling price must be greater than variable cost per unit');
        return;
    }

    const contributionMargin = price - variableCost;
    const contributionMarginRatio = (contributionMargin / price) * 100;
    const breakEvenUnits = fixedCosts / contributionMargin;
    const breakEvenRevenue = breakEvenUnits * price;
    const breakEvenDaily = breakEvenUnits / 30;

    // Calculate profit at different volumes
    const volume150 = breakEvenUnits * 1.5;
    const profit150 = (volume150 * contributionMargin) - fixedCosts;
    const volume200 = breakEvenUnits * 2;
    const profit200 = (volume200 * contributionMargin) - fixedCosts;

    const resultsContainer = document.getElementById('be-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>📍 Break-Even Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Break-Even Units</div>
                    <div class="calc-result-value neutral">
                        ${formatNumber(breakEvenUnits, 0)}
                    </div>
                    <div class="calc-result-subtitle">${formatNumber(breakEvenDaily, 1)} units/day</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Break-Even Revenue</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(breakEvenRevenue)}
                    </div>
                    <div class="calc-result-subtitle">Monthly sales needed</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Contribution Margin</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(contributionMargin)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent(contributionMarginRatio)} per unit</div>
                </div>
            </div>

            <h3 class="calc-mt-20">📈 Profit Scenarios</h3>
            <table class="calc-table">
                <tr>
                    <th>Sales Volume</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                    <th>Monthly Profit</th>
                </tr>
                <tr style="background: #fff3e0;">
                    <td>Break-Even</td>
                    <td>${formatNumber(breakEvenUnits, 0)}</td>
                    <td>${formatCurrency(breakEvenRevenue)}</td>
                    <td>${formatCurrency(0)}</td>
                </tr>
                <tr style="background: #e8f5e9;">
                    <td>150% of Break-Even</td>
                    <td>${formatNumber(volume150, 0)}</td>
                    <td>${formatCurrency(volume150 * price)}</td>
                    <td>${formatCurrency(profit150)}</td>
                </tr>
                <tr style="background: #c8e6c9;">
                    <td>200% of Break-Even</td>
                    <td>${formatNumber(volume200, 0)}</td>
                    <td>${formatCurrency(volume200 * price)}</td>
                    <td>${formatCurrency(profit200)}</td>
                </tr>
            </table>

            <div class="calc-alert calc-alert-info calc-mt-20">
                💡 <strong>Key Insight:</strong> Every unit sold above ${formatNumber(breakEvenUnits, 0)} generates ${formatCurrency(contributionMargin)} in profit.
            </div>

            <div class="calc-chart-container">
                <div class="calc-chart-header">
                    <h4>📊 Break-Even Analysis Chart</h4>
                    <button class="calc-button-small" onclick="downloadChart('breakeven-chart', 'breakeven-analysis')">
                        💾 Download Chart
                    </button>
                </div>
                <canvas id="breakeven-chart"></canvas>
            </div>
        </div>
    `;

    // Generate break-even chart data
    const volumes = [];
    const revenueData = [];
    const totalCostData = [];
    const profitData = [];

    // Create data points from 0 to 250% of break-even volume
    const maxVolume = Math.ceil(breakEvenUnits * 2.5);
    const steps = 10;
    const stepSize = maxVolume / steps;

    for (let i = 0; i <= steps; i++) {
        const units = i * stepSize;
        volumes.push(Math.round(units));
        revenueData.push(units * price);
        totalCostData.push(fixedCosts + (units * variableCost));
        profitData.push((units * price) - (fixedCosts + (units * variableCost)));
    }

    // Create the chart
    createLineChart('breakeven-chart', volumes, [
        {
            label: 'Revenue',
            data: revenueData,
            borderColor: '#00897b',
            backgroundColor: 'rgba(0, 137, 123, 0.1)',
            fill: false
        },
        {
            label: 'Total Costs',
            data: totalCostData,
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            fill: false
        },
        {
            label: 'Profit/Loss',
            data: profitData,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true
        }
    ], 'Revenue vs Costs by Volume');
}

// ============================================================================
// CALCULATOR 4C: GROSS MARGIN CALCULATOR
// ============================================================================

function renderGrossMargin() {
    const container = document.getElementById('calculator-grossmargin');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="gm-cost">Cost of Goods/Service</label>
                <input type="number" id="gm-cost" value="8.50" min="0" step="0.01" required>
                <span class="calc-input-hint">Your cost to produce/provide</span>
            </div>

            <div class="calc-input-group">
                <label for="gm-price">Selling Price</label>
                <input type="number" id="gm-price" value="15.00" min="0.01" step="0.01" required>
                <span class="calc-input-hint">Price charged to customer</span>
            </div>

            <div class="calc-input-group">
                <label for="gm-units">Monthly Units Sold</label>
                <input type="number" id="gm-units" value="5000" min="0" step="100" required>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateGrossMargin()">Calculate Margins</button>
                <button class="calc-button calc-button-secondary" onclick="resetGrossMargin()">Reset</button>
            </div>
        </div>

        <div id="gm-results"></div>
    `;
}

function resetGrossMargin() {
    document.getElementById('gm-cost').value = '8.50';
    document.getElementById('gm-price').value = '15.00';
    document.getElementById('gm-units').value = '5000';
    document.getElementById('gm-results').innerHTML = '';
}

function calculateGrossMargin() {
    const cost = parseFloat(document.getElementById('gm-cost').value);
    const price = parseFloat(document.getElementById('gm-price').value);
    const units = parseFloat(document.getElementById('gm-units').value);

    const grossProfit = price - cost;
    const grossMarginPercent = (grossProfit / price) * 100;
    const markupPercent = (grossProfit / cost) * 100;
    const monthlyRevenue = price * units;
    const monthlyCOGS = cost * units;
    const monthlyGrossProfit = grossProfit * units;

    let marginRating = '';
    if (grossMarginPercent >= 60) {
        marginRating = 'Excellent';
    } else if (grossMarginPercent >= 40) {
        marginRating = 'Good';
    } else if (grossMarginPercent >= 25) {
        marginRating = 'Average';
    } else {
        marginRating = 'Low';
    }

    const resultsContainer = document.getElementById('gm-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>📊 Gross Margin Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Gross Margin</div>
                    <div class="calc-result-value ${grossMarginPercent >= 40 ? 'positive' : grossMarginPercent >= 25 ? 'neutral' : 'negative'}">
                        ${formatPercent(grossMarginPercent)}
                    </div>
                    <div class="calc-result-subtitle">${marginRating}</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Markup</div>
                    <div class="calc-result-value neutral">
                        ${formatPercent(markupPercent)}
                    </div>
                    <div class="calc-result-subtitle">Over cost</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Gross Profit per Unit</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(grossProfit)}
                    </div>
                    <div class="calc-result-subtitle">Revenue minus COGS</div>
                </div>
            </div>

            <h3 class="calc-mt-20">💰 Monthly Projections</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly Revenue</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(monthlyRevenue)}
                    </div>
                    <div class="calc-result-subtitle">${formatNumber(units, 0)} units</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly COGS</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(monthlyCOGS)}
                    </div>
                    <div class="calc-result-subtitle">Cost of goods</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly Gross Profit</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(monthlyGrossProfit)}
                    </div>
                    <div class="calc-result-subtitle">Before operating expenses</div>
                </div>
            </div>

            <table class="calc-table calc-mt-20">
                <tr>
                    <th>Metric</th>
                    <th>Per Unit</th>
                    <th>Monthly</th>
                    <th>Annual</th>
                </tr>
                <tr>
                    <td>Revenue</td>
                    <td>${formatCurrency(price)}</td>
                    <td>${formatCurrency(monthlyRevenue)}</td>
                    <td>${formatCurrency(monthlyRevenue * 12)}</td>
                </tr>
                <tr>
                    <td>COGS</td>
                    <td>${formatCurrency(cost)}</td>
                    <td>${formatCurrency(monthlyCOGS)}</td>
                    <td>${formatCurrency(monthlyCOGS * 12)}</td>
                </tr>
                <tr style="font-weight: 700; background: #e8f5e9;">
                    <td>Gross Profit</td>
                    <td>${formatCurrency(grossProfit)}</td>
                    <td>${formatCurrency(monthlyGrossProfit)}</td>
                    <td>${formatCurrency(monthlyGrossProfit * 12)}</td>
                </tr>
            </table>

            ${grossMarginPercent < 25 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Low Margin Alert:</strong> Gross margin below 25% leaves little room for operating expenses. Consider raising prices or reducing costs.
                </div>
            ` : ''}
        </div>
    `;
}

// ============================================================================
// CALCULATOR 5: UNIT ECONOMICS SIMULATOR
// ============================================================================

function renderUnitEconomics() {
    const container = document.getElementById('calculator-uniteco');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="ue-revenue">Revenue per Customer</label>
                <input type="number" id="ue-revenue" value="25" min="0" step="0.5" required>
            </div>

            <div class="calc-input-group">
                <label for="ue-customers">Daily Customers</label>
                <input type="number" id="ue-customers" value="150" min="0" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="ue-days">Operating Days per Month</label>
                <input type="number" id="ue-days" value="30" min="1" max="31" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="ue-fixed">Monthly Fixed Costs</label>
                <input type="number" id="ue-fixed" value="30000" min="0" step="1000" required>
                <span class="calc-input-hint">Rent, salaries, insurance, etc.</span>
            </div>

            <div class="calc-input-group">
                <label for="ue-variable">Variable Costs (%)</label>
                <input type="number" id="ue-variable" value="40" min="0" max="100" step="1" required>
                <span class="calc-input-hint">COGS, supplies, commissions, etc.</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateUnitEconomics()">Calculate Unit Economics</button>
                <button class="calc-button calc-button-secondary" onclick="resetUnitEconomics()">Reset</button>
            </div>
        </div>

        <div id="ue-results"></div>
    `;
}

function resetUnitEconomics() {
    document.getElementById('ue-revenue').value = '25';
    document.getElementById('ue-customers').value = '150';
    document.getElementById('ue-days').value = '30';
    document.getElementById('ue-fixed').value = '30000';
    document.getElementById('ue-variable').value = '40';
    document.getElementById('ue-results').innerHTML = '';
}

function calculateUnitEconomics() {
    const revenuePerCustomer = parseFloat(document.getElementById('ue-revenue').value);
    const dailyCustomers = parseFloat(document.getElementById('ue-customers').value);
    const daysPerMonth = parseFloat(document.getElementById('ue-days').value);
    const fixedCosts = parseFloat(document.getElementById('ue-fixed').value);
    const variablePercent = parseFloat(document.getElementById('ue-variable').value);

    const monthlyCustomers = dailyCustomers * daysPerMonth;
    const monthlyRevenue = monthlyCustomers * revenuePerCustomer;
    const variableCosts = monthlyRevenue * (variablePercent / 100);
    const grossMargin = monthlyRevenue - variableCosts;
    const grossMarginPercent = (grossMargin / monthlyRevenue) * 100;
    const netProfit = grossMargin - fixedCosts;
    const netMarginPercent = (netProfit / monthlyRevenue) * 100;
    const contributionMarginPerCustomer = revenuePerCustomer * (1 - variablePercent / 100);

    const resultsContainer = document.getElementById('ue-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>📊 Unit Economics Summary</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly Revenue</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(monthlyRevenue)}
                    </div>
                    <div class="calc-result-subtitle">${formatNumber(monthlyCustomers)} customers</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Gross Margin</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(grossMargin)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent(grossMarginPercent)}</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Net Profit</div>
                    <div class="calc-result-value ${netProfit > 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(netProfit)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent(netMarginPercent)} margin</div>
                </div>
            </div>

            <h3 class="calc-mt-20">🎯 Per-Customer Metrics</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Revenue per Customer</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(revenuePerCustomer)}
                    </div>
                    <div class="calc-result-subtitle">Average transaction</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Variable Cost per Customer</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(revenuePerCustomer * (variablePercent / 100))}
                    </div>
                    <div class="calc-result-subtitle">${variablePercent}% of revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Contribution Margin</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(contributionMarginPerCustomer)}
                    </div>
                    <div class="calc-result-subtitle">Profit per customer</div>
                </div>
            </div>

            <div class="calc-alert calc-alert-info calc-mt-20">
                💡 <strong>Breakeven Analysis:</strong> You need ${formatNumber(fixedCosts / contributionMarginPerCustomer, 0)} customers per month to break even (${formatNumber((fixedCosts / contributionMarginPerCustomer) / daysPerMonth, 1)} customers per day).
            </div>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 6: PAYBACK PERIOD ESTIMATOR
// ============================================================================

function renderPayback() {
    const container = document.getElementById('calculator-payback');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="pb-investment">Initial Investment</label>
                <input type="number" id="pb-investment" value="350000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="pb-cashflow">Monthly Net Cash Flow</label>
                <input type="number" id="pb-cashflow" value="15000" min="0" step="100" required>
                <span class="calc-input-hint">Average monthly profit after all expenses</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculatePayback()">Calculate Payback Period</button>
                <button class="calc-button calc-button-secondary" onclick="resetPayback()">Reset</button>
            </div>
        </div>

        <div id="pb-results"></div>
    `;
}

function resetPayback() {
    document.getElementById('pb-investment').value = '350000';
    document.getElementById('pb-cashflow').value = '15000';
    document.getElementById('pb-results').innerHTML = '';
}

function calculatePayback() {
    const investment = parseFloat(document.getElementById('pb-investment').value);
    const cashflow = parseFloat(document.getElementById('pb-cashflow').value);

    if (!cashflow || cashflow === 0) {
        alert('Monthly cash flow must be greater than zero');
        return;
    }

    const monthsToPayback = investment / cashflow;
    const yearsToPayback = monthsToPayback / 12;
    const annualROI = ((cashflow * 12) / investment) * 100;

    const resultsContainer = document.getElementById('pb-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>⏱️ Payback Period Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Payback Period</div>
                    <div class="calc-result-value ${yearsToPayback < 3 ? 'positive' : yearsToPayback < 5 ? 'neutral' : 'negative'}">
                        ${yearsToPayback.toFixed(1)} years
                    </div>
                    <div class="calc-result-subtitle">${monthsToPayback.toFixed(0)} months</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly Cash Flow</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(cashflow)}
                    </div>
                    <div class="calc-result-subtitle">Average profit</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Annual ROI</div>
                    <div class="calc-result-value ${annualROI > 20 ? 'positive' : 'neutral'}">
                        ${formatPercent(annualROI)}
                    </div>
                    <div class="calc-result-subtitle">Return on investment</div>
                </div>
            </div>

            ${yearsToPayback < 3 ? `
                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Fast Payback:</strong> Payback period under 3 years is considered excellent for franchise investments.
                </div>
            ` : yearsToPayback > 5 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Long Payback:</strong> Payback period over 5 years may indicate lower profitability or higher risk.
                </div>
            ` : ''}

            <div class="calc-chart-container">
                <div class="calc-chart-header">
                    <h4>📈 Investment Recovery Timeline</h4>
                    <button class="calc-button-small" onclick="downloadChart('payback-chart', 'payback-period')">
                        💾 Download Chart
                    </button>
                </div>
                <canvas id="payback-chart"></canvas>
            </div>
        </div>
    `;

    // Generate payback timeline data (show up to breakeven + 2 years)
    const totalYears = Math.ceil(yearsToPayback) + 2;
    const years = [];
    const cumulativeCashFlow = [];
    const investmentLine = [];

    for (let i = 0; i <= totalYears; i++) {
        years.push(`Year ${i}`);
        const totalCashFlow = (cashflow * 12 * i) - investment;
        cumulativeCashFlow.push(totalCashFlow);
        investmentLine.push(0); // Break-even line at $0
    }

    // Create the chart
    createLineChart('payback-chart', years, [
        {
            label: 'Cumulative Cash Flow',
            data: cumulativeCashFlow,
            borderColor: '#00897b',
            backgroundColor: 'rgba(0, 137, 123, 0.1)',
            fill: true
        },
        {
            label: 'Break-Even Point',
            data: investmentLine,
            borderColor: '#f44336',
            backgroundColor: 'transparent',
            borderDash: [10, 5],
            fill: false,
            pointRadius: 0
        }
    ], 'Cumulative Cash Flow Until Investment Recovery');
}

// ============================================================================
// CALCULATOR 6B: EMPLOYEE COST CALCULATOR
// ============================================================================

function renderEmployeeCost() {
    const container = document.getElementById('calculator-employee');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="emp-hourly">Hourly Wage</label>
                <input type="number" id="emp-hourly" value="15" min="0" step="0.5" required>
            </div>

            <div class="calc-input-group">
                <label for="emp-hours">Hours per Week</label>
                <input type="number" id="emp-hours" value="40" min="1" max="80" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="emp-count">Number of Employees</label>
                <input type="number" id="emp-count" value="8" min="1" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="emp-fica">Employer FICA (%)</label>
                <input type="number" id="emp-fica" value="7.65" min="0" max="20" step="0.1" required>
                <span class="calc-input-hint">Social Security (6.2%) + Medicare (1.45%)</span>
            </div>

            <div class="calc-input-group">
                <label for="emp-ui">Unemployment Insurance (%)</label>
                <input type="number" id="emp-ui" value="3" min="0" max="10" step="0.1" required>
                <span class="calc-input-hint">State + Federal unemployment taxes</span>
            </div>

            <div class="calc-input-group">
                <label for="emp-wc">Workers' Comp (%)</label>
                <input type="number" id="emp-wc" value="2" min="0" max="15" step="0.1" required>
                <span class="calc-input-hint">Varies by state and industry</span>
            </div>

            <div class="calc-input-group">
                <label for="emp-benefits">Benefits per Employee/Month</label>
                <input type="number" id="emp-benefits" value="400" min="0" step="50" required>
                <span class="calc-input-hint">Health insurance, 401k match, etc.</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateEmployeeCost()">Calculate Total Labor Cost</button>
                <button class="calc-button calc-button-secondary" onclick="resetEmployeeCost()">Reset</button>
            </div>
        </div>

        <div id="emp-results"></div>
    `;
}

function resetEmployeeCost() {
    document.getElementById('emp-hourly').value = '15';
    document.getElementById('emp-hours').value = '40';
    document.getElementById('emp-count').value = '8';
    document.getElementById('emp-fica').value = '7.65';
    document.getElementById('emp-ui').value = '3';
    document.getElementById('emp-wc').value = '2';
    document.getElementById('emp-benefits').value = '400';
    document.getElementById('emp-results').innerHTML = '';
}

function calculateEmployeeCost() {
    const hourly = parseFloat(document.getElementById('emp-hourly').value);
    const hours = parseFloat(document.getElementById('emp-hours').value);
    const count = parseFloat(document.getElementById('emp-count').value);
    const fica = parseFloat(document.getElementById('emp-fica').value);
    const ui = parseFloat(document.getElementById('emp-ui').value);
    const wc = parseFloat(document.getElementById('emp-wc').value);
    const benefits = parseFloat(document.getElementById('emp-benefits').value);

    const weeklyWages = hourly * hours;
    const monthlyWages = weeklyWages * 4.33; // Average weeks per month
    const annualWages = weeklyWages * 52;

    const totalTaxRate = (fica + ui + wc) / 100;
    const monthlyTaxes = monthlyWages * totalTaxRate;
    const monthlyBenefits = benefits;

    const totalMonthlyPerEmployee = monthlyWages + monthlyTaxes + monthlyBenefits;
    const totalAnnualPerEmployee = totalMonthlyPerEmployee * 12;
    const totalMonthlyAll = totalMonthlyPerEmployee * count;
    const totalAnnualAll = totalAnnualPerEmployee * count;

    const burdenRate = ((totalMonthlyPerEmployee - monthlyWages) / monthlyWages) * 100;

    const resultsContainer = document.getElementById('emp-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>👥 Employee Cost Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Cost per Employee</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(totalMonthlyPerEmployee)}
                    </div>
                    <div class="calc-result-subtitle">Monthly total</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Burden Rate</div>
                    <div class="calc-result-value neutral">
                        ${formatPercent(burdenRate)}
                    </div>
                    <div class="calc-result-subtitle">Above base wages</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Monthly Labor</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalMonthlyAll)}
                    </div>
                    <div class="calc-result-subtitle">${count} employees</div>
                </div>
            </div>

            <h3 class="calc-mt-20">💰 Cost Breakdown (per Employee)</h3>
            <table class="calc-table">
                <tr>
                    <th>Component</th>
                    <th>Monthly</th>
                    <th>Annual</th>
                    <th>% of Total</th>
                </tr>
                <tr>
                    <td>Base Wages</td>
                    <td>${formatCurrency(monthlyWages)}</td>
                    <td>${formatCurrency(annualWages)}</td>
                    <td>${((monthlyWages / totalMonthlyPerEmployee) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Employer Taxes</td>
                    <td>${formatCurrency(monthlyTaxes)}</td>
                    <td>${formatCurrency(monthlyTaxes * 12)}</td>
                    <td>${((monthlyTaxes / totalMonthlyPerEmployee) * 100).toFixed(1)}%</td>
                </tr>
                <tr>
                    <td>Benefits</td>
                    <td>${formatCurrency(monthlyBenefits)}</td>
                    <td>${formatCurrency(monthlyBenefits * 12)}</td>
                    <td>${((monthlyBenefits / totalMonthlyPerEmployee) * 100).toFixed(1)}%</td>
                </tr>
                <tr style="font-weight: 700; background: #f5f5f5;">
                    <td>Total</td>
                    <td>${formatCurrency(totalMonthlyPerEmployee)}</td>
                    <td>${formatCurrency(totalAnnualPerEmployee)}</td>
                    <td>100%</td>
                </tr>
            </table>

            <h3 class="calc-mt-20">📊 Team Summary (${count} Employees)</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Monthly Payroll</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalMonthlyAll)}
                    </div>
                    <div class="calc-result-subtitle">All employees</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Annual Labor Cost</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalAnnualAll)}
                    </div>
                    <div class="calc-result-subtitle">Full year</div>
                </div>
            </div>

            <div class="calc-alert calc-alert-info calc-mt-20">
                💡 <strong>Tip:</strong> True employee cost is typically ${formatPercent(burdenRate)} higher than base wages due to taxes and benefits.
            </div>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 6C: WORKING CAPITAL CALCULATOR
// ============================================================================

function renderWorkingCapital() {
    const container = document.getElementById('calculator-workingcap');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="wc-revenue">Monthly Revenue</label>
                <input type="number" id="wc-revenue" value="100000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="wc-ar">Accounts Receivable Days</label>
                <input type="number" id="wc-ar" value="30" min="0" max="180" step="1" required>
                <span class="calc-input-hint">Average days to collect payment</span>
            </div>

            <div class="calc-input-group">
                <label for="wc-inv">Inventory Days</label>
                <input type="number" id="wc-inv" value="15" min="0" max="180" step="1" required>
                <span class="calc-input-hint">Average days inventory is held</span>
            </div>

            <div class="calc-input-group">
                <label for="wc-ap">Accounts Payable Days</label>
                <input type="number" id="wc-ap" value="20" min="0" max="90" step="1" required>
                <span class="calc-input-hint">Average days to pay suppliers</span>
            </div>

            <div class="calc-input-group">
                <label for="wc-opex">Monthly Operating Expenses</label>
                <input type="number" id="wc-opex" value="75000" min="0" step="1000" required>
                <span class="calc-input-hint">Rent, payroll, utilities, etc.</span>
            </div>

            <div class="calc-input-group">
                <label for="wc-buffer">Safety Buffer (months)</label>
                <input type="number" id="wc-buffer" value="2" min="0" max="12" step="0.5" required>
                <span class="calc-input-hint">Emergency cash reserve</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateWorkingCapital()">Calculate Working Capital</button>
                <button class="calc-button calc-button-secondary" onclick="resetWorkingCapital()">Reset</button>
            </div>
        </div>

        <div id="wc-results"></div>
    `;
}

function resetWorkingCapital() {
    document.getElementById('wc-revenue').value = '100000';
    document.getElementById('wc-ar').value = '30';
    document.getElementById('wc-inv').value = '15';
    document.getElementById('wc-ap').value = '20';
    document.getElementById('wc-opex').value = '75000';
    document.getElementById('wc-buffer').value = '2';
    document.getElementById('wc-results').innerHTML = '';
}

function calculateWorkingCapital() {
    const revenue = parseFloat(document.getElementById('wc-revenue').value);
    const arDays = parseFloat(document.getElementById('wc-ar').value);
    const invDays = parseFloat(document.getElementById('wc-inv').value);
    const apDays = parseFloat(document.getElementById('wc-ap').value);
    const opex = parseFloat(document.getElementById('wc-opex').value);
    const buffer = parseFloat(document.getElementById('wc-buffer').value);

    const dailyRevenue = revenue / 30;
    const dailyOpex = opex / 30;

    // Cash conversion cycle
    const ccc = arDays + invDays - apDays;

    // Working capital components
    const arAmount = dailyRevenue * arDays;
    const invAmount = dailyOpex * invDays * 0.4; // Assuming 40% COGS ratio
    const apAmount = dailyOpex * apDays;

    // Net working capital needed
    const netWorkingCapital = arAmount + invAmount - apAmount;
    const safetyBuffer = opex * buffer;
    const totalCapitalNeeded = netWorkingCapital + safetyBuffer;

    const resultsContainer = document.getElementById('wc-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>💼 Working Capital Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Cash Conversion Cycle</div>
                    <div class="calc-result-value ${ccc < 30 ? 'positive' : ccc < 60 ? 'neutral' : 'negative'}">
                        ${ccc} days
                    </div>
                    <div class="calc-result-subtitle">${ccc < 0 ? 'Negative (good!)' : 'Days to convert'}</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Net Working Capital</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(netWorkingCapital)}
                    </div>
                    <div class="calc-result-subtitle">Operating requirement</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Capital Needed</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalCapitalNeeded)}
                    </div>
                    <div class="calc-result-subtitle">Including ${buffer}-month buffer</div>
                </div>
            </div>

            <h3 class="calc-mt-20">📊 Working Capital Components</h3>
            <table class="calc-table">
                <tr>
                    <th>Component</th>
                    <th>Days</th>
                    <th>Amount</th>
                    <th>Impact</th>
                </tr>
                <tr>
                    <td>Accounts Receivable</td>
                    <td>${arDays}</td>
                    <td>${formatCurrency(arAmount)}</td>
                    <td style="color: #e53935;">+ (cash tied up)</td>
                </tr>
                <tr>
                    <td>Inventory</td>
                    <td>${invDays}</td>
                    <td>${formatCurrency(invAmount)}</td>
                    <td style="color: #e53935;">+ (cash tied up)</td>
                </tr>
                <tr>
                    <td>Accounts Payable</td>
                    <td>${apDays}</td>
                    <td>${formatCurrency(apAmount)}</td>
                    <td style="color: #43a047;">- (free financing)</td>
                </tr>
                <tr style="font-weight: 700; background: #f5f5f5;">
                    <td>Net Working Capital</td>
                    <td>${ccc} days</td>
                    <td>${formatCurrency(netWorkingCapital)}</td>
                    <td>-</td>
                </tr>
                <tr>
                    <td>Safety Buffer</td>
                    <td>${buffer * 30} days</td>
                    <td>${formatCurrency(safetyBuffer)}</td>
                    <td style="color: #e53935;">+ (reserve)</td>
                </tr>
                <tr style="font-weight: 700; background: #e3f2fd;">
                    <td>Total Required</td>
                    <td>-</td>
                    <td>${formatCurrency(totalCapitalNeeded)}</td>
                    <td>-</td>
                </tr>
            </table>

            ${ccc < 0 ? `
                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Negative CCC:</strong> Your business generates cash before needing to pay suppliers. This is excellent for cash flow!
                </div>
            ` : ccc > 60 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Long CCC:</strong> Consider negotiating better payment terms with suppliers or collecting receivables faster to improve cash flow.
                </div>
            ` : `
                <div class="calc-alert calc-alert-info calc-mt-20">
                    💡 <strong>Tip:</strong> Reducing your cash conversion cycle by ${Math.min(10, ccc)} days would free up approximately ${formatCurrency(dailyRevenue * Math.min(10, ccc))} in working capital.
                </div>
            `}
        </div>
    `;
}

// ============================================================================
// CALCULATOR 7: MULTI-UNIT SCALING MODEL
// ============================================================================

function renderScaling() {
    const container = document.getElementById('calculator-scaling');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="sc-current">Current Units Owned</label>
                <input type="number" id="sc-current" value="1" min="0" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="sc-planned">Planned Total Units</label>
                <input type="number" id="sc-planned" value="5" min="1" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="sc-revenue">Average Revenue per Unit</label>
                <input type="number" id="sc-revenue" value="1200000" min="0" step="10000" required>
                <span class="calc-input-hint">Annual revenue per location</span>
            </div>

            <div class="calc-input-group">
                <label for="sc-profit">Profit Margin (%)</label>
                <input type="number" id="sc-profit" value="15" min="0" max="100" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="sc-overhead">Corporate Overhead per Additional Unit</label>
                <input type="number" id="sc-overhead" value="20000" min="0" step="1000" required>
                <span class="calc-input-hint">Extra management/admin costs per unit</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateScaling()">Calculate Multi-Unit Portfolio</button>
                <button class="calc-button calc-button-secondary" onclick="resetScaling()">Reset</button>
            </div>
        </div>

        <div id="sc-results"></div>
    `;
}

function resetScaling() {
    document.getElementById('sc-current').value = '1';
    document.getElementById('sc-planned').value = '5';
    document.getElementById('sc-revenue').value = '1200000';
    document.getElementById('sc-profit').value = '15';
    document.getElementById('sc-overhead').value = '20000';
    document.getElementById('sc-results').innerHTML = '';
}

function calculateScaling() {
    const currentUnits = parseInt(document.getElementById('sc-current').value);
    const plannedUnits = parseInt(document.getElementById('sc-planned').value);
    const revenuePerUnit = parseFloat(document.getElementById('sc-revenue').value);
    const profitMargin = parseFloat(document.getElementById('sc-profit').value);
    const overhead = parseFloat(document.getElementById('sc-overhead').value);

    const currentRevenue = currentUnits * revenuePerUnit;
    const plannedRevenue = plannedUnits * revenuePerUnit;
    const revenueGrowth = plannedRevenue - currentRevenue;

    const currentProfit = currentRevenue * (profitMargin / 100);
    const plannedProfit = (plannedRevenue * (profitMargin / 100)) - (plannedUnits * overhead);
    const profitGrowth = plannedProfit - currentProfit;

    const timeToScale = (plannedUnits - currentUnits) * 12; // Assuming 12 months per unit

    const resultsContainer = document.getElementById('sc-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>🚀 Multi-Unit Portfolio Projection</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Current Portfolio</div>
                    <div class="calc-result-value neutral">
                        ${currentUnits} units
                    </div>
                    <div class="calc-result-subtitle">${formatCurrency(currentRevenue)} revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Planned Portfolio</div>
                    <div class="calc-result-value positive">
                        ${plannedUnits} units
                    </div>
                    <div class="calc-result-subtitle">${formatCurrency(plannedRevenue)} revenue</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Revenue Growth</div>
                    <div class="calc-result-value positive">
                        ${formatCurrency(revenueGrowth)}
                    </div>
                    <div class="calc-result-subtitle">+${(((plannedRevenue / currentRevenue) - 1) * 100).toFixed(0)}%</div>
                </div>
            </div>

            <h3 class="calc-mt-20">💰 Profitability Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Current EBITDA</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(currentProfit)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent((currentProfit / currentRevenue) * 100)} margin</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Projected EBITDA</div>
                    <div class="calc-result-value ${plannedProfit > currentProfit ? 'positive' : 'negative'}">
                        ${formatCurrency(plannedProfit)}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent((plannedProfit / plannedRevenue) * 100)} margin</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Profit Growth</div>
                    <div class="calc-result-value ${profitGrowth > 0 ? 'positive' : 'negative'}">
                        ${formatCurrency(profitGrowth)}
                    </div>
                    <div class="calc-result-subtitle">${profitGrowth >= 0 ? '+' : ''}${(((plannedProfit / currentProfit) - 1) * 100).toFixed(0)}%</div>
                </div>
            </div>

            <table class="calc-table calc-mt-20">
                <tr>
                    <th>Units</th>
                    <th>Annual Revenue</th>
                    <th>Annual EBITDA</th>
                    <th>EBITDA Margin</th>
                </tr>
                <tr>
                    <td>1 unit</td>
                    <td>${formatCurrency(revenuePerUnit)}</td>
                    <td>${formatCurrency(revenuePerUnit * (profitMargin / 100) - overhead)}</td>
                    <td>${formatPercent(((revenuePerUnit * (profitMargin / 100) - overhead) / revenuePerUnit) * 100)}</td>
                </tr>
                <tr>
                    <td>${plannedUnits} units</td>
                    <td>${formatCurrency(plannedRevenue)}</td>
                    <td>${formatCurrency(plannedProfit)}</td>
                    <td>${formatPercent((plannedProfit / plannedRevenue) * 100)}</td>
                </tr>
            </table>

            <div class="calc-alert calc-alert-info calc-mt-20">
                ⏱️ <strong>Timeline:</strong> Estimated ${timeToScale} months to scale from ${currentUnits} to ${plannedUnits} units (assuming 12 months per new unit).
            </div>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 7B: FRANCHISE COMPARISON TOOL
// ============================================================================

function renderFranchiseCompare() {
    const container = document.getElementById('calculator-compare');
    if (!container) return;

    container.innerHTML = `
        <div class="calc-form">
            <h3>Franchise A</h3>
            <div class="calc-input-row">
                <div class="calc-input-group">
                    <label for="cmp-a-name">Name</label>
                    <input type="text" id="cmp-a-name" value="Franchise A" maxlength="20">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-a-investment">Total Investment</label>
                    <input type="number" id="cmp-a-investment" value="350000" min="0" step="10000" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-a-royalty">Royalty %</label>
                    <input type="number" id="cmp-a-royalty" value="6" min="0" max="20" step="0.5" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-a-revenue">Est. Annual Revenue</label>
                    <input type="number" id="cmp-a-revenue" value="800000" min="0" step="10000" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-a-margin">Net Margin %</label>
                    <input type="number" id="cmp-a-margin" value="12" min="0" max="50" step="1" required>
                </div>
            </div>

            <h3 class="calc-mt-20">Franchise B</h3>
            <div class="calc-input-row">
                <div class="calc-input-group">
                    <label for="cmp-b-name">Name</label>
                    <input type="text" id="cmp-b-name" value="Franchise B" maxlength="20">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-b-investment">Total Investment</label>
                    <input type="number" id="cmp-b-investment" value="500000" min="0" step="10000" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-b-royalty">Royalty %</label>
                    <input type="number" id="cmp-b-royalty" value="5" min="0" max="20" step="0.5" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-b-revenue">Est. Annual Revenue</label>
                    <input type="number" id="cmp-b-revenue" value="1200000" min="0" step="10000" required>
                </div>
                <div class="calc-input-group">
                    <label for="cmp-b-margin">Net Margin %</label>
                    <input type="number" id="cmp-b-margin" value="10" min="0" max="50" step="1" required>
                </div>
            </div>

            <h3 class="calc-mt-20">Franchise C (Optional)</h3>
            <div class="calc-input-row">
                <div class="calc-input-group">
                    <label for="cmp-c-name">Name</label>
                    <input type="text" id="cmp-c-name" value="" maxlength="20" placeholder="Leave blank to skip">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-c-investment">Total Investment</label>
                    <input type="number" id="cmp-c-investment" value="" min="0" step="10000" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-c-royalty">Royalty %</label>
                    <input type="number" id="cmp-c-royalty" value="" min="0" max="20" step="0.5" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-c-revenue">Est. Annual Revenue</label>
                    <input type="number" id="cmp-c-revenue" value="" min="0" step="10000" placeholder="0">
                </div>
                <div class="calc-input-group">
                    <label for="cmp-c-margin">Net Margin %</label>
                    <input type="number" id="cmp-c-margin" value="" min="0" max="50" step="1" placeholder="0">
                </div>
            </div>

            <div class="calc-button-group calc-mt-20">
                <button class="calc-button" onclick="calculateFranchiseCompare()">Compare Franchises</button>
                <button class="calc-button calc-button-secondary" onclick="resetFranchiseCompare()">Reset</button>
            </div>
        </div>

        <div id="cmp-results"></div>
    `;
}

function resetFranchiseCompare() {
    document.getElementById('cmp-a-name').value = 'Franchise A';
    document.getElementById('cmp-a-investment').value = '350000';
    document.getElementById('cmp-a-royalty').value = '6';
    document.getElementById('cmp-a-revenue').value = '800000';
    document.getElementById('cmp-a-margin').value = '12';
    document.getElementById('cmp-b-name').value = 'Franchise B';
    document.getElementById('cmp-b-investment').value = '500000';
    document.getElementById('cmp-b-royalty').value = '5';
    document.getElementById('cmp-b-revenue').value = '1200000';
    document.getElementById('cmp-b-margin').value = '10';
    document.getElementById('cmp-c-name').value = '';
    document.getElementById('cmp-c-investment').value = '';
    document.getElementById('cmp-c-royalty').value = '';
    document.getElementById('cmp-c-revenue').value = '';
    document.getElementById('cmp-c-margin').value = '';
    document.getElementById('cmp-results').innerHTML = '';
}

function calculateFranchiseCompare() {
    const franchises = [];

    // Franchise A
    const aName = document.getElementById('cmp-a-name').value || 'Franchise A';
    const aInvestment = parseFloat(document.getElementById('cmp-a-investment').value) || 0;
    const aRoyalty = parseFloat(document.getElementById('cmp-a-royalty').value) || 0;
    const aRevenue = parseFloat(document.getElementById('cmp-a-revenue').value) || 0;
    const aMargin = parseFloat(document.getElementById('cmp-a-margin').value) || 0;

    if (aInvestment > 0 && aRevenue > 0) {
        const aProfit = aRevenue * (aMargin / 100);
        const aRoyaltyAmt = aRevenue * (aRoyalty / 100);
        const aROI = (aProfit / aInvestment) * 100;
        const aPayback = aInvestment / aProfit;
        franchises.push({
            name: aName,
            investment: aInvestment,
            royalty: aRoyalty,
            royaltyAmt: aRoyaltyAmt,
            revenue: aRevenue,
            margin: aMargin,
            profit: aProfit,
            roi: aROI,
            payback: aPayback
        });
    }

    // Franchise B
    const bName = document.getElementById('cmp-b-name').value || 'Franchise B';
    const bInvestment = parseFloat(document.getElementById('cmp-b-investment').value) || 0;
    const bRoyalty = parseFloat(document.getElementById('cmp-b-royalty').value) || 0;
    const bRevenue = parseFloat(document.getElementById('cmp-b-revenue').value) || 0;
    const bMargin = parseFloat(document.getElementById('cmp-b-margin').value) || 0;

    if (bInvestment > 0 && bRevenue > 0) {
        const bProfit = bRevenue * (bMargin / 100);
        const bRoyaltyAmt = bRevenue * (bRoyalty / 100);
        const bROI = (bProfit / bInvestment) * 100;
        const bPayback = bInvestment / bProfit;
        franchises.push({
            name: bName,
            investment: bInvestment,
            royalty: bRoyalty,
            royaltyAmt: bRoyaltyAmt,
            revenue: bRevenue,
            margin: bMargin,
            profit: bProfit,
            roi: bROI,
            payback: bPayback
        });
    }

    // Franchise C (optional)
    const cName = document.getElementById('cmp-c-name').value;
    const cInvestment = parseFloat(document.getElementById('cmp-c-investment').value) || 0;
    const cRoyalty = parseFloat(document.getElementById('cmp-c-royalty').value) || 0;
    const cRevenue = parseFloat(document.getElementById('cmp-c-revenue').value) || 0;
    const cMargin = parseFloat(document.getElementById('cmp-c-margin').value) || 0;

    if (cName && cInvestment > 0 && cRevenue > 0) {
        const cProfit = cRevenue * (cMargin / 100);
        const cRoyaltyAmt = cRevenue * (cRoyalty / 100);
        const cROI = (cProfit / cInvestment) * 100;
        const cPayback = cInvestment / cProfit;
        franchises.push({
            name: cName,
            investment: cInvestment,
            royalty: cRoyalty,
            royaltyAmt: cRoyaltyAmt,
            revenue: cRevenue,
            margin: cMargin,
            profit: cProfit,
            roi: cROI,
            payback: cPayback
        });
    }

    if (franchises.length < 2) {
        alert('Please enter data for at least 2 franchises to compare');
        return;
    }

    // Find best in each category
    const bestROI = franchises.reduce((a, b) => a.roi > b.roi ? a : b);
    const bestPayback = franchises.reduce((a, b) => a.payback < b.payback ? a : b);
    const lowestInvestment = franchises.reduce((a, b) => a.investment < b.investment ? a : b);
    const highestProfit = franchises.reduce((a, b) => a.profit > b.profit ? a : b);

    const resultsContainer = document.getElementById('cmp-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>⚖️ Franchise Comparison Results</h3>
            <table class="calc-table">
                <tr>
                    <th>Metric</th>
                    ${franchises.map(f => `<th>${f.name}</th>`).join('')}
                </tr>
                <tr>
                    <td>Total Investment</td>
                    ${franchises.map(f => `<td ${f === lowestInvestment ? 'class="highlight-best"' : ''}>${formatCurrency(f.investment)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Annual Revenue</td>
                    ${franchises.map(f => `<td>${formatCurrency(f.revenue)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Royalty Rate</td>
                    ${franchises.map(f => `<td>${formatPercent(f.royalty)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Annual Royalty</td>
                    ${franchises.map(f => `<td>${formatCurrency(f.royaltyAmt)}</td>`).join('')}
                </tr>
                <tr>
                    <td>Net Margin</td>
                    ${franchises.map(f => `<td>${formatPercent(f.margin)}</td>`).join('')}
                </tr>
                <tr style="font-weight: 700;">
                    <td>Annual Profit</td>
                    ${franchises.map(f => `<td ${f === highestProfit ? 'class="highlight-best"' : ''}>${formatCurrency(f.profit)}</td>`).join('')}
                </tr>
                <tr style="font-weight: 700;">
                    <td>Annual ROI</td>
                    ${franchises.map(f => `<td ${f === bestROI ? 'class="highlight-best"' : ''}>${formatPercent(f.roi)}</td>`).join('')}
                </tr>
                <tr style="font-weight: 700;">
                    <td>Payback Period</td>
                    ${franchises.map(f => `<td ${f === bestPayback ? 'class="highlight-best"' : ''}>${f.payback.toFixed(1)} years</td>`).join('')}
                </tr>
            </table>

            <h3 class="calc-mt-20">🏆 Winners by Category</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Best ROI</div>
                    <div class="calc-result-value positive">
                        ${bestROI.name}
                    </div>
                    <div class="calc-result-subtitle">${formatPercent(bestROI.roi)} return</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Fastest Payback</div>
                    <div class="calc-result-value positive">
                        ${bestPayback.name}
                    </div>
                    <div class="calc-result-subtitle">${bestPayback.payback.toFixed(1)} years</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Highest Profit</div>
                    <div class="calc-result-value positive">
                        ${highestProfit.name}
                    </div>
                    <div class="calc-result-subtitle">${formatCurrency(highestProfit.profit)}/year</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Lowest Investment</div>
                    <div class="calc-result-value positive">
                        ${lowestInvestment.name}
                    </div>
                    <div class="calc-result-subtitle">${formatCurrency(lowestInvestment.investment)}</div>
                </div>
            </div>

            <div class="calc-alert calc-alert-info calc-mt-20">
                💡 <strong>Analysis:</strong> ${bestROI.name} offers the best return on investment at ${formatPercent(bestROI.roi)}.
                ${bestROI !== highestProfit ? `However, ${highestProfit.name} generates more absolute profit (${formatCurrency(highestProfit.profit)}/year) if capital isn't limited.` : ''}
            </div>
        </div>
    `;
}

// ============================================================================
// CALCULATOR 8: TERRITORY PENETRATION ESTIMATOR
// ============================================================================

function renderPenetration() {
    const container = document.getElementById('calculator-penetration');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="pen-population">Target Population</label>
                <input type="number" id="pen-population" value="500000" min="0" step="1000" required>
                <span class="calc-input-hint">Total population in target territory</span>
            </div>

            <div class="calc-input-group">
                <label for="pen-units">Units Planned</label>
                <input type="number" id="pen-units" value="5" min="1" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="pen-benchmark">Population per Unit Benchmark</label>
                <input type="number" id="pen-benchmark" value="100000" min="0" step="1000" required>
                <span class="calc-input-hint">Industry standard or franchisor guidance</span>
            </div>

            <div class="calc-input-group">
                <label for="pen-competitors">Existing Competitors in Radius</label>
                <input type="number" id="pen-competitors" value="8" min="0" step="1" required>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculatePenetration()">Calculate Territory Penetration</button>
                <button class="calc-button calc-button-secondary" onclick="resetPenetration()">Reset</button>
            </div>
        </div>

        <div id="pen-results"></div>
    `;
}

function resetPenetration() {
    document.getElementById('pen-population').value = '500000';
    document.getElementById('pen-units').value = '5';
    document.getElementById('pen-benchmark').value = '100000';
    document.getElementById('pen-competitors').value = '8';
    document.getElementById('pen-results').innerHTML = '';
}

function calculatePenetration() {
    const population = parseFloat(document.getElementById('pen-population').value);
    const units = parseFloat(document.getElementById('pen-units').value);
    const benchmark = parseFloat(document.getElementById('pen-benchmark').value);
    const competitors = parseFloat(document.getElementById('pen-competitors').value);

    const populationPerUnit = population / units;
    const optimalUnits = Math.floor(population / benchmark);
    const saturationPercent = (units / optimalUnits) * 100;
    const totalUnits = units + competitors;
    const marketShare = (units / totalUnits) * 100;

    let classification = '';
    if (saturationPercent < 70) {
        classification = 'Under-penetrated';
    } else if (saturationPercent <= 130) {
        classification = 'Optimal penetration';
    } else {
        classification = 'Over-saturated';
    }

    const resultsContainer = document.getElementById('pen-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>🎯 Territory Penetration Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Population per Unit</div>
                    <div class="calc-result-value neutral">
                        ${formatNumber(populationPerUnit, 0)}
                    </div>
                    <div class="calc-result-subtitle">People per location</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Saturation Level</div>
                    <div class="calc-result-value ${saturationPercent < 70 ? 'positive' : saturationPercent > 130 ? 'negative' : 'neutral'}">
                        ${formatPercent(saturationPercent)}
                    </div>
                    <div class="calc-result-subtitle">${classification}</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Your Market Share</div>
                    <div class="calc-result-value neutral">
                        ${formatPercent(marketShare)}
                    </div>
                    <div class="calc-result-subtitle">${units} of ${totalUnits} units</div>
                </div>
            </div>

            <h3 class="calc-mt-20">📊 Market Analysis</h3>
            <table class="calc-table">
                <tr>
                    <th>Metric</th>
                    <th>Your Plan</th>
                    <th>Benchmark</th>
                    <th>Status</th>
                </tr>
                <tr>
                    <td>Units in Territory</td>
                    <td>${units}</td>
                    <td>${optimalUnits}</td>
                    <td>${units <= optimalUnits ? '✅ Within range' : '⚠️ Above optimal'}</td>
                </tr>
                <tr>
                    <td>Population per Unit</td>
                    <td>${formatNumber(populationPerUnit, 0)}</td>
                    <td>${formatNumber(benchmark, 0)}</td>
                    <td>${populationPerUnit >= benchmark ? '✅ Adequate' : '⚠️ Low'}</td>
                </tr>
                <tr>
                    <td>Total Competition</td>
                    <td>${totalUnits} units</td>
                    <td>-</td>
                    <td>${marketShare > 30 ? '✅ Strong position' : '⚠️ High competition'}</td>
                </tr>
            </table>

            ${saturationPercent < 70 ? `
                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Growth Opportunity:</strong> Territory is under-penetrated. You could potentially add ${optimalUnits - units} more units.
                </div>
            ` : saturationPercent > 130 ? `
                <div class="calc-alert calc-alert-warning calc-mt-20">
                    ⚠️ <strong>Over-Saturation Risk:</strong> Territory may be over-saturated. Consider expanding to adjacent markets.
                </div>
            ` : `
                <div class="calc-alert calc-alert-info calc-mt-20">
                    💡 <strong>Optimal Density:</strong> Your planned units align well with territory population benchmarks.
                </div>
            `}
        </div>
    `;
}

// ============================================================================
// CALCULATOR 9: FRANCHISE SATURATION MAP
// ============================================================================

function renderMap() {
    const container = document.getElementById('calculator-saturation');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="map-zip">ZIP Code</label>
                <input type="text" id="map-zip" value="10001" maxlength="5" placeholder="Enter ZIP code" required>
            </div>

            <div class="calc-input-group">
                <label for="map-radius">Radius (miles)</label>
                <input type="number" id="map-radius" value="10" min="1" max="100" step="1" required>
            </div>

            <div class="calc-input-group">
                <label for="map-locations">Number of Existing Locations</label>
                <input type="number" id="map-locations" value="5" min="0" step="1" required>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="generateSaturationMap()">Generate Map</button>
                <button class="calc-button calc-button-secondary" onclick="resetMap()">Reset</button>
            </div>
        </div>

        <div id="map-results"></div>
        <div id="saturation-map" class="calc-map-container" style="display: none;"></div>
    `;
}

function resetMap() {
    document.getElementById('map-zip').value = '10001';
    document.getElementById('map-radius').value = '10';
    document.getElementById('map-locations').value = '5';
    document.getElementById('map-results').innerHTML = '';
    const mapContainer = document.getElementById('saturation-map');
    if (mapContainer) {
        mapContainer.style.display = 'none';
        mapContainer.innerHTML = '';
    }
}

function generateSaturationMap() {
    const zip = document.getElementById('map-zip').value;
    const radius = parseFloat(document.getElementById('map-radius').value);
    const locations = parseInt(document.getElementById('map-locations').value);

    // Simple ZIP to lat/lng mapping (in production, use a geocoding API)
    const zipToCoords = {
        '10001': [40.7506, -73.9971], // New York
        '90001': [33.9731, -118.2479], // Los Angeles
        '60601': [41.8856, -87.6212], // Chicago
        '33101': [25.7749, -80.1947], // Miami
        '94102': [37.7799, -122.4200] // San Francisco
    };

    const coords = zipToCoords[zip] || [39.8283, -98.5795]; // Default to center of US

    // Calculate density
    const area = Math.PI * radius * radius; // Square miles
    const density = locations / area;
    const densityLevel = density < 0.1 ? 'Low' : density < 0.3 ? 'Medium' : 'High';

    // Show results
    const resultsContainer = document.getElementById('map-results');
    resultsContainer.innerHTML = `
        <div class="calc-results calc-mt-20">
            <h3>🗺️ Saturation Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Coverage Area</div>
                    <div class="calc-result-value neutral">
                        ${area.toFixed(1)} mi²
                    </div>
                    <div class="calc-result-subtitle">${radius}-mile radius</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Location Density</div>
                    <div class="calc-result-value ${density < 0.1 ? 'positive' : density > 0.3 ? 'negative' : 'neutral'}">
                        ${density.toFixed(2)}
                    </div>
                    <div class="calc-result-subtitle">Units per square mile</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Saturation Level</div>
                    <div class="calc-result-value ${density < 0.1 ? 'positive' : density > 0.3 ? 'negative' : 'neutral'}">
                        ${densityLevel}
                    </div>
                    <div class="calc-result-subtitle">${locations} locations</div>
                </div>
            </div>
        </div>
    `;

    // Show map
    const mapContainer = document.getElementById('saturation-map');
    mapContainer.style.display = 'block';
    mapContainer.innerHTML = ''; // Clear previous map

    // Initialize Leaflet map
    const map = L.map('saturation-map').setView(coords, 10);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Add radius circle
    L.circle(coords, {
        color: density < 0.1 ? '#4caf50' : density > 0.3 ? '#f44336' : '#ff9800',
        fillColor: density < 0.1 ? '#4caf50' : density > 0.3 ? '#f44336' : '#ff9800',
        fillOpacity: 0.2,
        radius: radius * 1609.34 // Convert miles to meters
    }).addTo(map);

    // Add center marker
    L.marker(coords)
        .addTo(map)
        .bindPopup(`<strong>ZIP ${zip}</strong><br>${radius}-mile radius<br>${locations} locations<br>Density: ${densityLevel}`)
        .openPopup();

    // Add sample location markers (randomly distributed)
    for (let i = 0; i < locations; i++) {
        const randomLat = coords[0] + (Math.random() - 0.5) * 0.2;
        const randomLng = coords[1] + (Math.random() - 0.5) * 0.2;

        L.circleMarker([randomLat, randomLng], {
            color: '#667eea',
            fillColor: '#667eea',
            fillOpacity: 0.7,
            radius: 6
        }).addTo(map).bindPopup(`Location ${i + 1}`);
    }
}

// ============================================================================
// CALCULATOR 10: SBA LOAN PAYOFF ESTIMATOR
// ============================================================================

function renderSBALoan() {
    const container = document.getElementById('calculator-sba');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="sba-amount">Loan Amount</label>
                <input type="number" id="sba-amount" value="250000" min="0" step="1000" required>
            </div>

            <div class="calc-input-group">
                <label for="sba-rate">Interest Rate (%)</label>
                <input type="number" id="sba-rate" value="7.5" min="0" max="100" step="0.1" required>
            </div>

            <div class="calc-input-group">
                <label for="sba-payment">Monthly Payment</label>
                <input type="number" id="sba-payment" value="3500" min="0" step="50" required>
            </div>

            <div class="calc-input-group">
                <label for="sba-extra">Extra Principal Payment (Optional)</label>
                <input type="number" id="sba-extra" value="0" min="0" step="50" required>
                <span class="calc-input-hint">Additional payment toward principal each month</span>
            </div>

            <div class="calc-button-group">
                <button class="calc-button" onclick="calculateSBALoan()">Calculate Loan Payoff</button>
                <button class="calc-button calc-button-secondary" onclick="resetSBALoan()">Reset</button>
            </div>
        </div>

        <div id="sba-results"></div>
    `;
}

function resetSBALoan() {
    document.getElementById('sba-amount').value = '250000';
    document.getElementById('sba-rate').value = '7.5';
    document.getElementById('sba-payment').value = '3500';
    document.getElementById('sba-extra').value = '0';
    document.getElementById('sba-results').innerHTML = '';
}

function calculateSBALoan() {
    const principal = parseFloat(document.getElementById('sba-amount').value);
    const annualRate = parseFloat(document.getElementById('sba-rate').value);
    const monthlyPayment = parseFloat(document.getElementById('sba-payment').value);
    const extraPayment = parseFloat(document.getElementById('sba-extra').value);

    const monthlyRate = annualRate / 100 / 12;

    // Calculate standard payoff
    let balance = principal;
    let totalInterest = 0;
    let months = 0;

    while (balance > 0 && months < 360) { // Max 30 years
        const interest = balance * monthlyRate;
        const principalPayment = monthlyPayment - interest;

        if (principalPayment <= 0) {
            alert('Monthly payment is too low to cover interest. Please increase payment amount.');
            return;
        }

        totalInterest += interest;
        balance -= principalPayment;
        months++;
    }

    // Calculate with extra payments
    let balanceExtra = principal;
    let totalInterestExtra = 0;
    let monthsExtra = 0;

    while (balanceExtra > 0 && monthsExtra < 360) {
        const interest = balanceExtra * monthlyRate;
        const principalPayment = monthlyPayment + extraPayment - interest;

        totalInterestExtra += interest;
        balanceExtra -= principalPayment;
        monthsExtra++;
    }

    const years = months / 12;
    const yearsExtra = monthsExtra / 12;
    const interestSavings = totalInterest - totalInterestExtra;
    const timeSavings = months - monthsExtra;

    const resultsContainer = document.getElementById('sba-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <h3>🏦 Loan Payoff Analysis</h3>
            <div class="calc-result-grid">
                <div class="calc-result-card">
                    <div class="calc-result-label">Time to Payoff</div>
                    <div class="calc-result-value neutral">
                        ${years.toFixed(1)} years
                    </div>
                    <div class="calc-result-subtitle">${months} months (standard)</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Interest</div>
                    <div class="calc-result-value negative">
                        ${formatCurrency(totalInterest)}
                    </div>
                    <div class="calc-result-subtitle">Over loan term</div>
                </div>

                <div class="calc-result-card">
                    <div class="calc-result-label">Total Paid</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(principal + totalInterest)}
                    </div>
                    <div class="calc-result-subtitle">Principal + Interest</div>
                </div>
            </div>

            ${extraPayment > 0 ? `
                <h3 class="calc-mt-20">💰 With Extra Payments (${formatCurrency(extraPayment)}/month)</h3>
                <div class="calc-result-grid">
                    <div class="calc-result-card">
                        <div class="calc-result-label">New Payoff Time</div>
                        <div class="calc-result-value positive">
                            ${yearsExtra.toFixed(1)} years
                        </div>
                        <div class="calc-result-subtitle">${monthsExtra} months</div>
                    </div>

                    <div class="calc-result-card">
                        <div class="calc-result-label">Interest Savings</div>
                        <div class="calc-result-value positive">
                            ${formatCurrency(interestSavings)}
                        </div>
                        <div class="calc-result-subtitle">Total saved</div>
                    </div>

                    <div class="calc-result-card">
                        <div class="calc-result-label">Time Savings</div>
                        <div class="calc-result-value positive">
                            ${(timeSavings / 12).toFixed(1)} years
                        </div>
                        <div class="calc-result-subtitle">${timeSavings} months earlier</div>
                    </div>
                </div>

                <div class="calc-alert calc-alert-success calc-mt-20">
                    ✅ <strong>Impact:</strong> By paying an extra ${formatCurrency(extraPayment)}/month, you'll save ${formatCurrency(interestSavings)} in interest and pay off the loan ${(timeSavings / 12).toFixed(1)} years earlier.
                </div>
            ` : ''}

            <table class="calc-table calc-mt-20">
                <tr>
                    <th>Payment Type</th>
                    <th>Monthly Payment</th>
                    <th>Time to Payoff</th>
                    <th>Total Interest</th>
                </tr>
                <tr>
                    <td>Standard Payment</td>
                    <td>${formatCurrency(monthlyPayment)}</td>
                    <td>${years.toFixed(1)} years</td>
                    <td>${formatCurrency(totalInterest)}</td>
                </tr>
                ${extraPayment > 0 ? `
                <tr style="background: #e8f5e9;">
                    <td>With Extra Payment</td>
                    <td>${formatCurrency(monthlyPayment + extraPayment)}</td>
                    <td>${yearsExtra.toFixed(1)} years</td>
                    <td>${formatCurrency(totalInterestExtra)}</td>
                </tr>
                ` : ''}
            </table>
        </div>
    `;
}

// ============================================================================
// AUTO-INITIALIZE ON PAGE LOAD
// ============================================================================

// This will auto-run if the script is included in a page with the calculators div
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        if (document.getElementById('franchise-calculators')) {
            window.initFranchiseCalculators();
        }
    });
} else {
    if (document.getElementById('franchise-calculators')) {
        window.initFranchiseCalculators();
    }
}
