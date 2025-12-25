# FranchiseIQ - Franchise Opportunity Evaluation Platform

![FranchiseIQ Hero](assets/hero-preview.svg)

**Live Demo:** [franchiseiq.github.io/WebApp](https://franchiseiq.github.io/WebApp/)

## Overview

FranchiseIQ is a decision-focused platform that helps franchise investors **find the right opportunity before they invest**. The platform shifts from passive data browsing to active franchise evaluation with intelligent algorithms, transparent scoring, and comprehensive market analysis.

**Key Tagline:** "Compare brands, analyze locations, and model unit economics using real market data, no account required."

---

## 🎯 Core Features

### 1. **Franchise Evaluation Engine** (`/evaluate/`)
The centerpiece of the platform - a tabbed interface for comprehensive franchise analysis.

#### **Tab 1: Franchise Selection**
- Search and select from 40+ publicly traded franchise brands
- Browse 5 categories: Quick Service Restaurants, Hospitality, Auto Services, Fitness, Retail
- Real-time stock ticker integration
- Brand details: headquarters, stock symbol, franchise count

**Technical:** `/evaluate/evaluate.js` (500+ lines)

#### **Tab 2: Transparent Scoring Algorithm**
- **Rule-based evaluation** (no black-box AI)
- Multi-factor scoring system:
  - **Brand Health (0-25 pts):** Stock performance, growth trajectory
  - **Market Fit (0-25 pts):** Local demographics, target audience alignment
  - **Financial Model (0-25 pts):** Unit economics, profitability
  - **Competition (0-15 pts):** Saturation analysis, competitive landscape
  - **Growth Potential (0-10 pts):** Market trends, expansion opportunity
- **Total Score: 0-100** with color-coded ratings
  - 🟢 90-100: Excellent
  - 🟢 75-89: Good
  - 🟡 60-74: Moderate
  - 🟠 45-59: Fair
  - 🔴 <45: Poor

**Methodology Disclosure:** Full methodology explained transparently in the app

#### **Tab 3: Market Demographics**
- Population density, age distribution, income levels
- Employment rates, education levels, household composition
- Housing market metrics, safety metrics, health metrics
- Benchmark comparison vs national averages
- 50+ data points organized in 8 categories

**Technical:** `/evaluate/expanded-market-metrics.js` (500+ lines)

#### **Tab 4: Unit Economics**
- Interactive financial modeling with real-time calculations
- **Adjustable Assumptions:**
  - Annual revenue (slider: $100K - $5M)
  - Profit margin (slider: 5% - 30%)
  - Initial investment (slider: $50K - $1M)
  - Discount rate for NPV (slider: 5% - 15%)
  - Labor costs (slider: 10% - 50% of revenue)
- **Financial Outputs:**
  - Gross profit, operating expenses, net profit
  - ROI, payback period, NPV, IRR
  - Break-even analysis, sensitivity analysis
  - Cash flow projections (5-year forecast)
- **Visualizations:** SVG-based charts (no external dependencies)

**Technical:** `/evaluate/unit-economics.js` (450+ lines), `/evaluate/interactive-dashboard.js` (450+ lines)

---

### 2. **Interactive Dashboard Controls** (`/evaluate/interactive-dashboard.js`)

Real-time financial modeling with intuitive controls:

- **Revenue Slider:** $100K - $5M annual revenue
- **Margin Toggle:** 5% - 30% profit margin
- **Investment Slider:** $50K - $1M initial investment
- **Discount Rate:** 5% - 15% for NPV calculations
- **Labor Costs:** 10% - 50% of revenue
- **Real-time Impact Summary:** Shows how changes affect key metrics (in green/red)
- **Metric Toggles:** Show/hide specific financial calculations
- **Demographic Filters:** Filter markets by income, density, growth, employment
- **Comparison Mode:** Side-by-side market comparison
- **Chart View Options:** Summary, Detailed, Comparison, Forecast views

**Design:** Custom CSS sliders with gradient fills, emoji-enhanced labels, responsive grid layout

---

### 3. **Expanded Market Metrics** (`/evaluate/expanded-market-metrics.js`)

Comprehensive market analysis with 50+ metrics:

**8 Metric Categories:**
1. **Economic:** Household income, home values, poverty rate, consumer spending
2. **Education:** Bachelor's rates, school quality, college participation
3. **Employment:** Labor force participation, unemployment, job growth, top industries
4. **Demographics:** Age distribution, gender, racial diversity, population trends
5. **Housing:** Household size, ownership rate, vacancy rate, median rent
6. **Lifestyle:** Walkability, dining options, retail density, entertainment, transit
7. **Safety:** Crime rates, violent crime, property crime, police per capita
8. **Health:** Life expectancy, health insurance, obesity, healthcare access

**Features:**
- Market Index Score (0-100) for overall attractiveness
- Benchmark comparison showing % difference from national average
- Color-coded performance indicators (green for above average, red for below)
- Responsive grid with mobile optimization

**Benchmark Data:** 30+ national averages built-in (extensible)

---

### 4. **PDF Report Generation** (`/evaluate/pdf-reports.js`)

Professional-grade reports with FranchiseIQ branding:

**Report Options:**
1. **Evaluation Report:** Full opportunity score breakdown, market analysis, methodology
2. **Financial Report:** Unit economics, cost breakdown, 5-year projections
3. **Full Report:** Combined evaluation + financial analysis
4. **Print PDF:** Browser native print-to-PDF

**Report Features:**
- FranchiseIQ branded header with logo and timestamp
- Professional two-column layout (desktop optimized)
- Score card with component breakdown (visual gauge)
- Key market metrics in organized grid
- Financial summary with charts
- Methodology disclosure section
- Disclaimer about franchise investment risks
- Print-optimized styling (no background colors)
- Responsive design for mobile viewing

**Technical:** 700+ lines of HTML/CSS template generation + print media queries

---

### 5. **Location Recommendation Engine** (`/evaluate/location-recommendation-engine.js`)

Intelligent algorithmic matching system for brand-market pairs:

**How It Works:**
1. User selects a franchise brand category
2. Algorithm evaluates all available markets
3. Compatibility scoring across 6-7 factors
4. Returns top 10 ranked recommendations

**Brand Profiles (5 Categories):**

| Brand | Ideal Density | Ideal Income | Traffic Need | Competition |
|-------|---------------|--------------|--------------|-------------|
| **QSR** | 300-1000/sq mi | $50-100K | Very High | High Tolerance |
| **Hospitality** | 150-400/sq mi | $60-120K | High | Medium Tolerance |
| **Auto Services** | 200-600/sq mi | $50-90K | High | High Tolerance |
| **Fitness** | 100-300/sq mi | $70-150K | Medium | Low Tolerance |
| **Retail** | 200-500/sq mi | $55-110K | Medium-High | Medium Tolerance |

**Scoring Factors (Total 100 Points):**
- Population Density: 0-20 pts
- Median Income: 0-20 pts
- Market Growth Rate: 0-15 pts
- Employment Rate: 0-15 pts
- Competition Level: 0-15 pts
- Market Saturation: 0-10 pts
- Education/Diversity: 0-5 pts

**Results Display:**
- Recommendation cards with compatibility score badge
- 6-factor breakdown with emoji indicators (📍 density, 💵 income, 📈 growth, 💼 employment, 🏪 competition, 🎯 saturation)
- Quick metrics: median income, growth rate, employment percentage
- Summary statistics: best match score, top recommended market, average compatibility

**User Interface:**
- Brand category dropdown selector
- "Get Recommendations" button with loading state
- 3-column grid on desktop, 2-column on tablet, 1-column on mobile
- Color-coded score badges with interpretations

---

### 6. **Stock Analysis Tools**

#### Live Stock Ticker (`/Website/ticker.html`)
- Real-time price updates for 40+ franchise stocks
- Market status indicator (open/closed)
- Live clock with timezone
- Auto-refresh every 60 seconds
- Green/red color coding for price changes

#### Interactive Charts (`/StockChart/chart.html`)
- Multi-ticker comparison (up to 10 stocks)
- 10+ years of historical data from local CSV
- Relative percent charts (normalized by baseline)
- Zoom, pan, and time navigation
- Year markers (optional toggle)
- Mobile-responsive design

#### Franchise Location Map (`/FranchiseMap/map.html`)
- 22,000+ franchise locations mapped
- Brand filtering and category search
- Radius search tool
- Geographic clustering for performance
- Interactive popup details

---

### 7. **News & Research**

#### Franchise News Feed (`/FranchiseNews/news-feed.html`)
- Curated industry news from leading sources
- Multiple news categories (trade press, major portals, analyst reports)
- Vertical scrolling news ticker
- Fixed bottom news ticker on homepage
- RSS feed integration

#### Sports Dashboard (`/sports.html`)
- Live scores for NFL, NBA, NHL, MLB, MLS
- Schedule and standings
- Team statistics

---

## 🎨 Design System

### Color Palette
```
Primary Accent: #6366ea (Indigo)
Secondary Accent: #a855f7 (Purple)
Success: #10b981 (Green)
Warning: #f59e0b (Amber)
Danger: #ef4444 (Red)
Background: #ffffff (White)
Text Primary: #1f2937 (Dark Gray)
Text Secondary: #6b7280 (Medium Gray)
Border: #e5e7eb (Light Gray)
```

### Typography
- **Headlines:** System fonts (sans-serif), 700 weight
- **Body Text:** System fonts, 400-500 weight, 16px baseline
- **Monospace:** For code blocks and data displays

### Component Patterns
- **Cards:** 12px border-radius, subtle shadows (0 2px 8px rgba)
- **Buttons:** Gradient backgrounds, smooth transitions
- **Inputs:** Full-width on mobile, constrained on desktop
- **Sliders:** Custom styled with gradient fill
- **Badges:** Inline color coding for status (green/amber/red)

### Responsive Breakpoints
```
Mobile:  < 480px  (1-column layout)
Tablet:  480-768px (2-column layout)
Desktop: > 768px  (3-column+ layout)
```

---

## 🏗️ Architecture

### File Structure
```
/home/user/WebApp/
├── index.html                          # Homepage with decision-focused hero
├── /evaluate/
│   ├── index.html                      # Main evaluation page
│   ├── evaluate.js                     # Tab controller (500+ lines)
│   ├── scoring.js                      # Transparent algorithm (300+ lines)
│   ├── interactive-dashboard.js        # Real-time sliders/filters (450+ lines)
│   ├── expanded-market-metrics.js      # 50+ demographic metrics (500+ lines)
│   ├── pdf-reports.js                  # Report generation (700+ lines)
│   ├── location-recommendation-engine.js # Brand-market matching (370+ lines)
│   ├── unit-economics.js               # Financial modeling (450+ lines)
│   └── style.css                       # Comprehensive styling (2000+ lines)
├── /StockChart/
│   ├── chart.html                      # Interactive charting interface
│   └── chart.js                        # Chart rendering logic
├── /FranchiseMap/
│   ├── map.html                        # Location visualization
│   └── map.js                          # Map controller
├── /FranchiseNews/
│   ├── news-feed.html                  # News aggregation
│   ├── newsService.js                  # RSS parsing
│   └── news-widget.js                  # Widget renderer
├── /assets/
│   ├── /css/
│   │   ├── global.css                  # Design system variables
│   │   ├── layout.css                  # Layout utilities
│   │   └── /pages/
│   │       └── home.css                # Homepage specific styles
│   └── logo.svg                        # FranchiseIQ branding
├── /data/
│   ├── live_ticker.json                # Real-time stock data
│   ├── franchise_data.json             # Brand profiles
│   └── locations.geojson               # Franchise locations
└── package.json                        # Dependencies & scripts
```

### Module Architecture (IIFE Pattern)
Each feature module uses **Immediately Invoked Function Expressions** for namespace isolation:

```javascript
(function() {
  // Private variables and functions
  const privateData = {};

  function privateMethod() { /* ... */ }

  // Public API
  window.ModuleName = {
    init: function() { /* ... */ },
    calculate: function(params) { /* ... */ },
    render: function(selector) { /* ... */ }
  };
})();
```

**Advantages:**
- No global namespace pollution
- Clear public API via window object
- Encapsulated private state
- Easy to test and debug

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.6+ (for local server)

### Installation
```bash
# Clone the repository
git clone https://github.com/MonroeGamble/WebApp.git
cd WebApp

# Install dependencies
npm install
```

### Running Locally
```bash
# Start development server
npm run serve

# Server runs on http://localhost:8000
```

### Linting & Formatting
```bash
# Check code quality
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Check formatting without changes
npm run format:check
```

---

## 📍 Live Demo Links

### Homepage (Decision-Focused)
- **URL:** [https://franchiseiq.github.io/WebApp/](https://franchiseiq.github.io/WebApp/)
- **Features:** Hero messaging, tools overview, embedded widgets
- **Design Focus:** Action-oriented CTAs, statistics, social proof

### Franchise Evaluation Platform
- **URL:** [https://franchiseiq.github.io/WebApp/evaluate/](https://franchiseiq.github.io/WebApp/evaluate/)
- **Features:** All 5 tabs with interactive analysis
- **New in 2024:**
  - Interactive dashboard with real-time sliders
  - Expanded market metrics (50+ data points)
  - PDF report generation
  - Location recommendation engine

### Stock Analysis
- **Charts:** [https://franchiseiq.github.io/WebApp/StockChart/chart.html](https://franchiseiq.github.io/WebApp/StockChart/chart.html)
- **Ticker:** [https://franchiseiq.github.io/WebApp/Website/ticker.html](https://franchiseiq.github.io/WebApp/Website/ticker.html)

### Franchise Locations
- **Map:** [https://franchiseiq.github.io/WebApp/FranchiseMap/map.html](https://franchiseiq.github.io/WebApp/FranchiseMap/map.html)

### News & Updates
- **News Feed:** [https://franchiseiq.github.io/WebApp/FranchiseNews/news-feed.html](https://franchiseiq.github.io/WebApp/FranchiseNews/news-feed.html)

---

## 📊 Data Sources

| Data Type | Source | Update Frequency |
|-----------|--------|------------------|
| Stock Prices | Finnhub API | Real-time / Daily |
| Historical Data | Local CSV (10 years) | Monthly |
| News | RSS Feeds | Daily |
| Locations | Internal GeoJSON | Quarterly |
| Market Demographics | Built-in Benchmarks | Static |
| Brand Information | Manual Database | As needed |

---

## 🔒 Privacy & Disclaimer

- **No Account Required:** All analysis is performed client-side
- **No Data Collection:** We don't store user evaluations or track usage
- **Educational Tool:** Results are estimates for research purposes only
- **Not Financial Advice:** Consult professionals before making investment decisions
- **Disclaimer:** Full legal disclaimer in PDF reports and evaluation pages

---

## 🛠️ Technical Highlights

### Performance Optimizations
- CSV data loaded once and cached in memory
- SVG-based charts (no heavy charting libraries)
- Lazy loading for iframe widgets
- CSS Grid for responsive layouts
- No external dependencies for core features

### Code Quality
- ESLint configuration for consistent style
- Prettier for automatic formatting
- Modular IIFE architecture
- Clear separation of concerns
- Comprehensive inline documentation

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (iOS Safari, Android Chrome)
- Graceful degradation for older browsers

---

## 🎓 Scoring Methodology

The transparent scoring algorithm evaluates franchises across five dimensions:

### 1. Brand Health (0-25 points)
- Stock performance relative to sector
- Revenue growth trajectory
- Franchisee satisfaction indicators
- Brand recognition scores

### 2. Market Fit (0-25 points)
- Population density alignment
- Income level match
- Age demographic fit
- Employment rate consideration

### 3. Financial Model (0-25 points)
- Historical unit volumes
- Average unit volume (AUV) performance
- Profitability benchmarks
- Operating leverage metrics

### 4. Competition (0-15 points)
- Competitor density in market
- Brand differentiation
- Customer loyalty metrics
- Market share stability

### 5. Growth Potential (0-10 points)
- Market trend direction
- Population growth rate
- Economic development
- Income growth trajectory

**Total: 100 points** → Score interpretation guides user decision

---

## 📝 Recent Updates (2024)

### Phase 1: Initial Build
- ✅ Homepage redesign with decision-focused messaging
- ✅ Franchise evaluation page with transparent scoring
- ✅ Brand search across 5 categories
- ✅ Unit economics calculator

### Phase 2: Enhanced Features
- ✅ Interactive dashboard controls with real-time sliders
- ✅ Expanded market metrics (50+ demographic data points)
- ✅ PDF report generation with branded templates
- ✅ Location recommendation engine with algorithmic matching

---

## 🤝 Contributing

We welcome contributions! Please ensure:
1. Code passes ESLint checks (`npm run lint`)
2. Formatting matches Prettier (`npm run format`)
3. Changes are documented in commit messages
4. No sensitive data is added

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Credits

**FranchiseIQ Team**
- Data Integration: Real market data from multiple sources
- Design: FranchiseIQ branding and design system
- Development: Modern vanilla JavaScript (no framework)

**Data Partners**
- Finnhub for stock market data
- Franchise trade publications for news
- U.S. Census and economic data for demographics

---

## 📧 Support & Feedback

- **Report Issues:** [GitHub Issues](https://github.com/MonroeGamble/WebApp/issues)
- **Feature Requests:** Create a GitHub Discussion
- **Questions:** Check the [Documentation](docs/setup.md)

---

**Last Updated:** December 2024
**Version:** 2.0 - Decision Workflow Platform
**Status:** Active Development
