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
    renderUnitEconomics();
    renderPayback();
    renderScaling();
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

// ============================================================================
// CALCULATOR 1: ROI CALCULATOR
// ============================================================================

function renderROI() {
    const container = document.getElementById('calculator-roi');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="roi-profit">Annual Net Profit</label>
                <input type="number" id="roi-profit" value="75000" min="0" step="1000">
                <span class="calc-input-hint">Expected net profit per year after all expenses</span>
            </div>

            <div class="calc-input-group">
                <label for="roi-investment">Total Initial Investment</label>
                <input type="number" id="roi-investment" value="350000" min="0" step="1000">
                <span class="calc-input-hint">Total amount invested to start the franchise</span>
            </div>

            <button class="calc-button" onclick="calculateROI()">Calculate ROI</button>
        </div>

        <div id="roi-results"></div>
    `;
}

function calculateROI() {
    const profit = parseFloat(document.getElementById('roi-profit').value);
    const investment = parseFloat(document.getElementById('roi-investment').value);

    if (!profit || !investment || investment === 0) {
        alert('Please enter valid values for profit and investment');
        return;
    }

    const roi = (profit / investment) * 100;
    const yearsToBreakeven = investment / profit;
    const monthsToBreakeven = yearsToBreakeven * 12;
    const monthlyBreakeven = investment / 12;

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
                    <div class="calc-result-label">Monthly Profit Needed</div>
                    <div class="calc-result-value neutral">
                        ${formatCurrency(monthlyBreakeven)}
                    </div>
                    <div class="calc-result-subtitle">For 1-year breakeven</div>
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
        </div>
    `;
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
                <input type="number" id="item7-min" value="250000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="item7-max">Maximum Investment (Item 7)</label>
                <input type="number" id="item7-max" value="500000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="item7-working">Working Capital (3 months)</label>
                <input type="number" id="item7-working" value="50000" min="0" step="1000">
                <span class="calc-input-hint">Recommended: 3-6 months of operating expenses</span>
            </div>

            <div class="calc-input-group">
                <label for="item7-franchise">Franchise Fee</label>
                <input type="number" id="item7-franchise" value="45000" min="0" step="1000">
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

            <button class="calc-button" onclick="calculateItem7()">Calculate Investment</button>
        </div>

        <div id="item7-results"></div>
    `;
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
                <input type="number" id="royalty-revenue" value="100000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="royalty-rate">Royalty Rate (%)</label>
                <input type="number" id="royalty-rate" value="6" min="0" max="100" step="0.1">
            </div>

            <div class="calc-input-group">
                <label for="royalty-marketing">Marketing Fund Rate (%)</label>
                <input type="number" id="royalty-marketing" value="2" min="0" max="100" step="0.1">
            </div>

            <div class="calc-input-group">
                <label for="royalty-local">Local Advertising Spend</label>
                <input type="number" id="royalty-local" value="2000" min="0" step="100">
            </div>

            <div class="calc-input-group">
                <label for="royalty-additional">Additional Franchise Fees</label>
                <input type="number" id="royalty-additional" value="500" min="0" step="50">
                <span class="calc-input-hint">Technology fees, training fees, etc.</span>
            </div>

            <button class="calc-button" onclick="calculateRoyalty()">Calculate Fees</button>
        </div>

        <div id="royalty-results"></div>
    `;
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
                <input type="number" id="cf-revenue" value="120000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="cf-cogs">Cost of Goods Sold (%)</label>
                <input type="number" id="cf-cogs" value="30" min="0" max="100" step="1">
            </div>

            <div class="calc-input-group">
                <label for="cf-labor">Labor Cost (%)</label>
                <input type="number" id="cf-labor" value="25" min="0" max="100" step="1">
            </div>

            <div class="calc-input-group">
                <label for="cf-rent">Monthly Rent</label>
                <input type="number" id="cf-rent" value="5000" min="0" step="100">
            </div>

            <div class="calc-input-group">
                <label for="cf-utilities">Utilities & Services</label>
                <input type="number" id="cf-utilities" value="1500" min="0" step="100">
            </div>

            <div class="calc-input-group">
                <label for="cf-insurance">Insurance</label>
                <input type="number" id="cf-insurance" value="800" min="0" step="50">
            </div>

            <div class="calc-input-group">
                <label for="cf-misc">Miscellaneous Expenses</label>
                <input type="number" id="cf-misc" value="2000" min="0" step="100">
            </div>

            <button class="calc-button" onclick="calculateCashFlow()">Calculate Cash Flow</button>
        </div>

        <div id="cf-results"></div>
    `;
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
                <input type="number" id="ue-revenue" value="25" min="0" step="0.5">
            </div>

            <div class="calc-input-group">
                <label for="ue-customers">Daily Customers</label>
                <input type="number" id="ue-customers" value="150" min="0" step="1">
            </div>

            <div class="calc-input-group">
                <label for="ue-days">Operating Days per Month</label>
                <input type="number" id="ue-days" value="30" min="1" max="31" step="1">
            </div>

            <div class="calc-input-group">
                <label for="ue-fixed">Monthly Fixed Costs</label>
                <input type="number" id="ue-fixed" value="30000" min="0" step="1000">
                <span class="calc-input-hint">Rent, salaries, insurance, etc.</span>
            </div>

            <div class="calc-input-group">
                <label for="ue-variable">Variable Costs (%)</label>
                <input type="number" id="ue-variable" value="40" min="0" max="100" step="1">
                <span class="calc-input-hint">COGS, supplies, commissions, etc.</span>
            </div>

            <button class="calc-button" onclick="calculateUnitEconomics()">Calculate Unit Economics</button>
        </div>

        <div id="ue-results"></div>
    `;
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
                <input type="number" id="pb-investment" value="350000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="pb-cashflow">Monthly Net Cash Flow</label>
                <input type="number" id="pb-cashflow" value="15000" min="0" step="100">
                <span class="calc-input-hint">Average monthly profit after all expenses</span>
            </div>

            <button class="calc-button" onclick="calculatePayback()">Calculate Payback Period</button>
        </div>

        <div id="pb-results"></div>
    `;
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

            <h3 class="calc-mt-20">📈 Cumulative Cash Flow Over Time</h3>
            <div class="calc-progress-bar">
                <div class="calc-progress-fill" style="width: ${Math.min((12 / monthsToPayback) * 100, 100)}%">
                    Year 1: ${formatCurrency(cashflow * 12)}
                </div>
            </div>
            <div class="calc-progress-bar">
                <div class="calc-progress-fill" style="width: ${Math.min((24 / monthsToPayback) * 100, 100)}%">
                    Year 2: ${formatCurrency(cashflow * 24)}
                </div>
            </div>
            <div class="calc-progress-bar">
                <div class="calc-progress-fill" style="width: ${Math.min((36 / monthsToPayback) * 100, 100)}%">
                    Year 3: ${formatCurrency(cashflow * 36)}
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
                <input type="number" id="sc-current" value="1" min="0" step="1">
            </div>

            <div class="calc-input-group">
                <label for="sc-planned">Planned Total Units</label>
                <input type="number" id="sc-planned" value="5" min="1" step="1">
            </div>

            <div class="calc-input-group">
                <label for="sc-revenue">Average Revenue per Unit</label>
                <input type="number" id="sc-revenue" value="1200000" min="0" step="10000">
                <span class="calc-input-hint">Annual revenue per location</span>
            </div>

            <div class="calc-input-group">
                <label for="sc-profit">Profit Margin (%)</label>
                <input type="number" id="sc-profit" value="15" min="0" max="100" step="1">
            </div>

            <div class="calc-input-group">
                <label for="sc-overhead">Corporate Overhead per Additional Unit</label>
                <input type="number" id="sc-overhead" value="20000" min="0" step="1000">
                <span class="calc-input-hint">Extra management/admin costs per unit</span>
            </div>

            <button class="calc-button" onclick="calculateScaling()">Calculate Multi-Unit Portfolio</button>
        </div>

        <div id="sc-results"></div>
    `;
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
// CALCULATOR 8: TERRITORY PENETRATION ESTIMATOR
// ============================================================================

function renderPenetration() {
    const container = document.getElementById('calculator-penetration');

    container.innerHTML = `
        <div class="calc-form">
            <div class="calc-input-group">
                <label for="pen-population">Target Population</label>
                <input type="number" id="pen-population" value="500000" min="0" step="1000">
                <span class="calc-input-hint">Total population in target territory</span>
            </div>

            <div class="calc-input-group">
                <label for="pen-units">Units Planned</label>
                <input type="number" id="pen-units" value="5" min="1" step="1">
            </div>

            <div class="calc-input-group">
                <label for="pen-benchmark">Population per Unit Benchmark</label>
                <input type="number" id="pen-benchmark" value="100000" min="0" step="1000">
                <span class="calc-input-hint">Industry standard or franchisor guidance</span>
            </div>

            <div class="calc-input-group">
                <label for="pen-competitors">Existing Competitors in Radius</label>
                <input type="number" id="pen-competitors" value="8" min="0" step="1">
            </div>

            <button class="calc-button" onclick="calculatePenetration()">Calculate Territory Penetration</button>
        </div>

        <div id="pen-results"></div>
    `;
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
                <input type="text" id="map-zip" value="10001" maxlength="5" placeholder="Enter ZIP code">
            </div>

            <div class="calc-input-group">
                <label for="map-radius">Radius (miles)</label>
                <input type="number" id="map-radius" value="10" min="1" max="100" step="1">
            </div>

            <div class="calc-input-group">
                <label for="map-locations">Number of Existing Locations</label>
                <input type="number" id="map-locations" value="5" min="0" step="1">
            </div>

            <button class="calc-button" onclick="generateSaturationMap()">Generate Map</button>
        </div>

        <div id="map-results"></div>
        <div id="saturation-map" class="calc-map-container" style="display: none;"></div>
    `;
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
                <input type="number" id="sba-amount" value="250000" min="0" step="1000">
            </div>

            <div class="calc-input-group">
                <label for="sba-rate">Interest Rate (%)</label>
                <input type="number" id="sba-rate" value="7.5" min="0" max="100" step="0.1">
            </div>

            <div class="calc-input-group">
                <label for="sba-payment">Monthly Payment</label>
                <input type="number" id="sba-payment" value="3500" min="0" step="50">
            </div>

            <div class="calc-input-group">
                <label for="sba-extra">Extra Principal Payment (Optional)</label>
                <input type="number" id="sba-extra" value="0" min="0" step="50">
                <span class="calc-input-hint">Additional payment toward principal each month</span>
            </div>

            <button class="calc-button" onclick="calculateSBALoan()">Calculate Loan Payoff</button>
        </div>

        <div id="sba-results"></div>
    `;
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
