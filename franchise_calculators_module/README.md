# 💰 Franchise Financial Calculators Module

A comprehensive, self-contained financial calculator suite designed specifically for franchise investment analysis and decision-making.

## ✨ Features

- **10 Professional Calculators** covering all aspects of franchise financial planning
- **Zero Dependencies** (except Leaflet.js for maps - loaded from CDN)
- **Pure Vanilla JavaScript** - No frameworks, no build tools
- **Responsive Design** - Works perfectly on mobile, tablet, and desktop
- **Drop-in Integration** - Embed anywhere with just 3 lines of code
- **Real-time Calculations** - Instant results as you type
- **Professional UI** - Clean, modern design with gradient themes

## 📊 Included Calculators

1. **ROI Calculator** - Calculate return on investment and break even timeline
2. **Item 7 Initial Investment Estimator** - Estimate total startup costs from FDD Item 7
3. **Royalty + Marketing Fee Breakdown** - Analyze monthly franchise fees and effective rates
4. **Franchisee Cash Flow Estimator** - Model monthly EBITDA and profit margins
5. **Unit Economics Simulator** - Analyze per-customer profitability
6. **Payback Period Estimator** - Calculate how long to recoup initial investment
7. **Multi-Unit Scaling Model** - Project financials for portfolio expansion
8. **Territory Penetration Estimator** - Analyze market saturation and coverage
9. **Franchise Saturation Map** - Interactive Leaflet map showing location density
10. **SBA Loan Payoff Estimator** - Calculate loan payoff timeline and interest savings

## 🚀 Quick Start

### Method 1: Standalone Page

Simply open `index.html` in your browser. No server required!

```bash
# Open in browser
open index.html

# Or serve with Python
python -m http.server 8000
```

### Method 2: Embed in Any Website

Add these 3 lines to your HTML:

```html
<link rel="stylesheet" href="path/to/styles.css">
<script src="path/to/calculators.js"></script>
<div id="franchise-calculators"></div>
```

That's it! The calculators will automatically initialize.

### Method 3: Manual Initialization

If you need more control:

```html
<link rel="stylesheet" href="path/to/styles.css">
<div id="franchise-calculators"></div>
<script src="path/to/calculators.js"></script>
<script>
    // Manually initialize
    window.initFranchiseCalculators();
</script>
```

## 📁 File Structure

```
franchise_calculators_module/
├── index.html           # Standalone calculator page
├── calculators.js       # All calculator logic (1 file, ~1200 lines)
├── styles.css           # All styles (responsive, mobile-ready)
├── README.md            # This file
└── assets/              # Optional assets directory
    ├── leaflet.css      # (Loaded from CDN by default)
    └── leaflet.js       # (Loaded from CDN by default)
```

## 🎨 Customization

### Branding

Edit `styles.css` to customize colors:

```css
/* Change primary gradient */
.calc-header {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}

.calc-button {
    background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adding More Calculators

1. **Create HTML Structure** in `index.html`:

```html
<div id="tab-yourcalc" class="calc-tab-content">
    <h2>🎯 Your Calculator Name</h2>
    <p class="calc-description">Description here</p>
    <div id="calculator-yourcalc"></div>
</div>
```

2. **Add Tab Button**:

```html
<button class="calc-tab" data-tab="yourcalc">Your Calculator</button>
```

3. **Create Render Function** in `calculators.js`:

```javascript
function renderYourCalc() {
    const container = document.getElementById('calculator-yourcalc');
    container.innerHTML = `
        <div class="calc-form">
            <!-- Your input fields here -->
        </div>
        <div id="yourcalc-results"></div>
    `;
}

// Add to initFranchiseCalculators():
function initFranchiseCalculators() {
    // ... existing code ...
    renderYourCalc(); // Add this line
}
```

4. **Create Calculation Function**:

```javascript
function calculateYourCalc() {
    // Your calculation logic here
    const resultsContainer = document.getElementById('yourcalc-results');
    resultsContainer.innerHTML = `
        <div class="calc-results">
            <!-- Your results here -->
        </div>
    `;
}
```

### Styling Tips

Use these pre-built CSS classes:

- `.calc-results` - Results container with gradient background
- `.calc-result-grid` - Responsive grid for result cards
- `.calc-result-card` - Individual result card
- `.calc-result-value.positive` - Green color for positive values
- `.calc-result-value.negative` - Red color for negative values
- `.calc-result-value.neutral` - Purple color for neutral values
- `.calc-alert.calc-alert-info` - Blue info alert
- `.calc-alert.calc-alert-success` - Green success alert
- `.calc-alert.calc-alert-warning` - Orange warning alert
- `.calc-table` - Styled table with hover effects

## 🌐 Publishing to GitHub Pages

1. **Push to GitHub**:

```bash
git add franchise_calculators_module/
git commit -m "Add franchise financial calculators"
git push origin main
```

2. **Enable GitHub Pages**:
   - Go to Settings → Pages
   - Select branch: `main`
   - Select folder: `/` (root)
   - Save

3. **Access Your Calculators**:
   ```
   https://yourusername.github.io/yourrepo/franchise_calculators_module/
   ```

4. **Embed Anywhere**:

```html
<link rel="stylesheet" href="https://yourusername.github.io/yourrepo/franchise_calculators_module/styles.css">
<script src="https://yourusername.github.io/yourrepo/franchise_calculators_module/calculators.js"></script>
<div id="franchise-calculators"></div>
```

## 🔧 Browser Compatibility

✅ **Fully Tested On:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

⚠️ **Not Supported:**
- Internet Explorer (use Chrome, Firefox, or Edge instead)

## 📱 Mobile Responsive

All calculators automatically adapt to mobile screens:
- Tabs convert to full-width buttons
- Two-column layouts become single column
- Input fields scale appropriately
- Touch-friendly button sizes
- Map works with touch gestures

## 🗺️ Maps (Calculator #9)

The Saturation Map calculator uses **Leaflet.js** loaded from CDN:

```html
<!-- Already included in index.html -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

**No API keys required!** Uses free OpenStreetMap tiles.

### Custom Map Tiles

To use different map tiles, edit the Leaflet tile layer in `calculators.js`:

```javascript
// Default (OpenStreetMap)
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Alternative: CartoDB Positron (lighter)
L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap, © CartoDB'
}).addTo(map);
```

## 💡 Usage Examples

### Embed Single Calculator

Want just one calculator? Modify the HTML:

```html
<div id="franchise-calculators" class="calc-container">
    <div class="calc-header">
        <h1>💰 ROI Calculator</h1>
    </div>
    <div class="calc-content-wrapper">
        <div id="calculator-roi"></div>
    </div>
</div>
<script>
    // Initialize just ROI calculator
    renderROI();
</script>
```

### Change Default Tab

Edit `index.html` to change which calculator shows first:

```html
<!-- Remove 'active' class from ROI tab -->
<button class="calc-tab" data-tab="roi">ROI Calculator</button>

<!-- Add 'active' class to your preferred tab -->
<button class="calc-tab active" data-tab="cashflow">Cash Flow</button>

<!-- Do the same for tab content divs -->
<div id="tab-roi" class="calc-tab-content">...</div>
<div id="tab-cashflow" class="calc-tab-content active">...</div>
```

### Pre-fill Values

Set custom default values in `calculators.js`:

```javascript
// In renderROI() function:
<input type="number" id="roi-profit" value="100000" min="0" step="1000">
```

## 🧮 Calculation Details

### ROI Calculator

**Formula:**
```
ROI = (Annual Net Profit / Total Investment) × 100
Years to Breakeven = Total Investment / Annual Net Profit
```

**Industry Benchmarks:**
- Excellent: ROI > 30%
- Good: ROI 20-30%
- Average: ROI 15-20%
- Below Average: ROI < 15%

### Payback Period

**Formula:**
```
Months to Payback = Initial Investment / Monthly Cash Flow
Years = Months / 12
```

**Industry Benchmarks:**
- Fast: < 3 years
- Average: 3-5 years
- Slow: > 5 years

### Cash Flow Margin

**Formula:**
```
EBITDA = Revenue - (COGS + Labor + Fixed Costs)
Cash Flow Margin = (EBITDA / Revenue) × 100
```

**Industry Benchmarks:**
- Excellent: > 20%
- Good: 15-20%
- Average: 10-15%
- Low: < 10%

### Territory Saturation

**Formula:**
```
Population per Unit = Total Population / Number of Units
Optimal Units = Total Population / Benchmark
Saturation % = (Planned Units / Optimal Units) × 100
```

**Classifications:**
- Under-penetrated: < 70%
- Optimal: 70-130%
- Over-saturated: > 130%

## 🎯 Best Practices

### For Users

1. **Use Realistic Numbers** - Base inputs on actual FDD data and market research
2. **Compare Multiple Scenarios** - Run calculations with best-case, worst-case, and expected-case numbers
3. **Consult Professionals** - Use calculators for planning, but verify with accountants and advisors
4. **Update Regularly** - Re-run calculations as you gather more accurate data
5. **Consider All Costs** - Don't forget working capital, licenses, permits, etc.

### For Developers

1. **Keep Dependencies Minimal** - Only Leaflet.js is required
2. **Use Semantic HTML** - All forms use proper labels and accessibility attributes
3. **Validate Inputs** - Check for zero/negative values before calculating
4. **Format Numbers Consistently** - Use built-in `formatCurrency()` and `formatPercent()` functions
5. **Add Helpful Hints** - Use `.calc-input-hint` for user guidance
6. **Test Mobile First** - Ensure everything works on small screens

## 🐛 Troubleshooting

### Calculators Don't Appear

**Check:**
1. Is `div#franchise-calculators` present in HTML?
2. Are `calculators.js` and `styles.css` loaded?
3. Open browser console - any JavaScript errors?
4. Try calling `window.initFranchiseCalculators()` manually

### Map Doesn't Load

**Check:**
1. Is Leaflet CSS loaded? (`<link rel="stylesheet" href="...leaflet.css">`)
2. Is Leaflet JS loaded? (`<script src="...leaflet.js"></script>`)
3. Do you have internet connection? (Leaflet loads from CDN)
4. Check console for errors

### Numbers Look Wrong

**Check:**
1. Are inputs positive numbers?
2. Are percentages entered as whole numbers (e.g., `15` not `0.15`)?
3. Is monthly vs annual data entered correctly?
4. Try refreshing the page

### Styling Issues

**Check:**
1. Is `styles.css` loaded?
2. Are there CSS conflicts with parent page?
3. Try adding `!important` to critical styles
4. Check if parent page has `box-sizing` set globally

## 📝 License

This module is provided as-is for use in franchise-related projects. Feel free to:
- ✅ Use in commercial projects
- ✅ Modify and customize
- ✅ Embed in your websites
- ✅ Share with clients

No attribution required (but appreciated!)

## 🤝 Contributing

Want to add more calculators or improve existing ones?

1. Fork the repository
2. Create a new branch: `git checkout -b feature/new-calculator`
3. Make your changes
4. Test thoroughly on desktop and mobile
5. Submit a pull request

## 📞 Support

For questions or issues:
- Check this README first
- Review the code comments in `calculators.js`
- Search for similar issues on GitHub
- Create a new issue with detailed description

## 🎓 Learn More

**About Franchise Investing:**
- [International Franchise Association](https://www.franchise.org/)
- [FTC Franchise Rule](https://www.ftc.gov/business-guidance/resources/franchise-rule)
- [SBA Franchise Directory](https://www.sba.gov/business-guide/launch-your-business/buy-franchise)

**About the Tech Stack:**
- [Vanilla JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Leaflet.js Documentation](https://leafletjs.com/reference.html)
- [CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout)
- [Responsive Web Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

## 🚀 Roadmap

**Planned Features:**
- [ ] Export results to PDF
- [ ] Save/load calculator sessions
- [ ] Multi-currency support
- [ ] Comparison mode (side-by-side)
- [ ] Chart visualizations
- [ ] Print-friendly layouts
- [ ] Dark mode toggle
- [ ] Calculator presets library
- [ ] Integration with FDD data APIs

## ⭐ Changelog

### v1.0.0 (2025-11-21)
- ✅ Initial release
- ✅ 10 comprehensive calculators
- ✅ Mobile-responsive design
- ✅ Zero-dependency architecture
- ✅ Interactive Leaflet maps
- ✅ Real-time calculations
- ✅ Professional UI/UX

---

**Made with ❤️ for the franchise community**

*Helping franchisees make informed financial decisions, one calculation at a time.*
