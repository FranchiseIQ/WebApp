# 📈 Interactive Stock Chart Widget

A powerful, interactive stock chart visualization tool built with Chart.js. Compare up to 10 stock tickers simultaneously with customizable colors, line widths, and time ranges. Features zoom, pan, and detailed tooltips with OHLC data.

## 🌟 Features

### Multi-Ticker Comparison
- **Add up to 10 tickers** simultaneously
- Real-time data from Yahoo Finance API
- Uses **adjusted close prices** for accurate historical analysis
- Automatic color assignment with custom color picker

### Interactive Chart Controls
- **Zoom & Pan**: Mouse wheel or pinch to zoom, click and drag to pan
- **Time Ranges**: 1D, 1W, 1M, 6M, YTD, 1Y, 2Y, 5Y, 10Y, MAX
- **Customizable Lines**: Adjust color and width (1-5px) for each ticker
- **Toggle Options**: Show/hide legend and grid lines

### Rich Tooltips
Hover over any point to see:
- Adjusted close price
- Open, High, Low prices
- Trading volume

### Responsive Design
- Works seamlessly on desktop, tablet, and mobile
- Optimized for embedding in iframes
- Clean, modern interface

## 🚀 Quick Start

### Direct Access
Simply open the widget in your browser:
# Interactive Stock Chart Widget

A powerful, interactive stock charting application with support for multiple tickers, custom styling, zoom/pan controls, and adjusted close prices.

## Features

### Core Functionality
- ✅ **Up to 10 simultaneous tickers** - Compare multiple stocks on one chart
- ✅ **Adjusted close prices** - Accurate historical analysis accounting for splits and dividends
- ✅ **11 time ranges** - 1D, 5D, 1M, 3M, 6M, YTD, 1Y, 2Y, 5Y, 10Y, MAX
- ✅ **Zoom & Pan** - Mouse wheel zoom, click and drag to pan (Shift+drag)
- ✅ **Custom line colors** - Pick any color for each ticker
- ✅ **Adjustable line width** - 1px to 5px thickness
- ✅ **Interactive tooltips** - Hover to see exact prices and dates
- ✅ **Toggle legend** - Show/hide ticker legend
- ✅ **Auto-refresh** - Reload data with one click

### Technical Features
- 100% client-side - No server required
- Yahoo Finance API integration
- Multi-proxy CORS fallback system
- Chart.js with zoom plugin
- Responsive design - works on mobile and desktop
- Embeddable via iframe

## Quick Start

### Standalone Usage

Open the chart directly:
```
https://monroegamble.github.io/WebApp/StockChart/chart.html
```

### Embedding on Your Website

#### Basic Embed (HTML)
```html
<iframe src="https://monroegamble.github.io/WebApp/StockChart/chart.html"
        width="100%"
        height="600"
        frameborder="0"
        style="border:none;">
</iframe>
```

#### Google Sites
1. Go to **Insert** → **Embed** → **Embed Code**
2. Paste the iframe code above
3. Adjust dimensions as needed
4. Click **Insert**

#### WordPress
```html
<!-- Use the HTML block -->
<iframe src="https://monroegamble.github.io/WebApp/StockChart/chart.html"
        width="100%"
        height="600"
        frameborder="0"
        style="border:none; min-height:600px;">
</iframe>
```

#### Wix
1. Click **Add** → **Embed** → **Custom Embeds** → **Embed a Widget**
2. Paste the iframe code
3. Adjust settings and save

## 📖 How to Use

### Adding Stocks
1. Enter a ticker symbol in the input field (e.g., `AAPL`, `MSFT`, `GOOGL`)
2. Click **Add Ticker** or press **Enter**
3. The stock will be added to your chart with a unique color
4. Repeat to add up to 10 tickers

### Customizing Display
- **Change Color**: Click the color box next to any ticker
- **Adjust Line Width**: Use the slider to change thickness (1-5px)
- **Select Time Range**: Click any time range button (1D, 1M, 6M, etc.)
- **Toggle Grid**: Check/uncheck "Show Grid Lines"
- **Toggle Legend**: Click "Toggle Legend" button

### Interacting with the Chart
- **Zoom In/Out**:
  - Desktop: Scroll mouse wheel up/down
  - Mobile: Pinch gesture
- **Pan**: Click and drag the chart
- **Reset View**: Click "Reset Zoom" button
- **View Details**: Hover over any point to see tooltip

### Removing Stocks
- Click the **✕** button next to any ticker to remove it from the chart

## 🔧 Technical Details

### Technology Stack
- **HTML5/CSS3/JavaScript**: Pure vanilla implementation
- **Chart.js 4.4.0**: Powerful charting library
- **Chart.js Zoom Plugin**: Interactive zoom and pan
- **Stooq API**: Free, reliable stock data with no rate limits

### Data Source
```
Endpoint: https://stooq.com/q/d/l/?s={TICKER}.US&i=d
```

Returns CSV format:
```csv
Date,Open,High,Low,Close,Volume
2024-01-02,290.30,293.48,289.97,292.12,2408700
2024-01-03,292.00,293.80,289.40,291.16,2898700
```

Benefits:
- **No authentication** required
- **No rate limits** - unlimited requests
- **Adjusted prices** included (splits, dividends)
- **Clean CSV format** - easy to parse
- **Historical data** going back decades
- **100% free** forever

### Price Data
The widget uses **adjusted close prices** which account for:
- Stock splits
- Dividends
- Corporate actions

This provides accurate historical performance comparison.

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📱 Responsive Breakpoints
- **Desktop**: > 768px (full features)
- **Tablet**: 481px - 768px (optimized layout)
- **Mobile**: ≤ 480px (stacked controls)

## ⚙️ Customization

### File Structure
```
StockChart/
├── chart.html      # Main HTML structure
├── chart.js        # JavaScript logic
├── style.css       # Styling and responsive design
└── README.md       # This file
```

### Modifying Default Settings

#### Change Default Time Range
In `chart.js`, find:
```javascript
let currentRange = '1y';  // Change to: '1d', '1mo', '6mo', etc.
```

#### Adjust Maximum Tickers
In `chart.js`, find:
```javascript
const MAX_TICKERS = 10;  // Change to desired limit
```

#### Modify Default Colors
In `chart.js`, edit the `DEFAULT_COLORS` array:
```javascript
const DEFAULT_COLORS = [
    '#3B82F6',  // Blue
    '#EF4444',  // Red
    '#10B981',  // Green
    // Add or modify colors...
];
```

#### Change Chart Height
In `style.css`, modify `.chart-container`:
```css
.chart-container {
    min-height: 400px;  /* Adjust as needed */
}
```

## 🎯 Use Cases

### Investment Analysis
- Compare multiple stocks in the same sector
- Analyze relative performance over different time periods
- Identify trends and patterns

### Educational Content
- Teaching students about stock market behavior
- Demonstrating portfolio diversification
- Explaining market correlations

### Financial Blogging
- Embed live charts in articles
- Create interactive portfolio showcases
- Provide real-time market commentary

### Client Presentations
- Showcase portfolio performance
- Compare investment options
- Present market research

## ⚠️ Limitations

### Data Availability
- Stooq primarily supports US stocks (append `.US` to ticker)
- Some tickers may have limited historical data
- Delisted stocks may not return data
- For international stocks: Use appropriate suffix (e.g., `.UK`, `.DE`)

### Data Updates
- Daily data updated after market close
- Not real-time intraday data (end-of-day only)
- Perfect for historical analysis and long-term charting
- Not suitable for day-trading or real-time monitoring

### CORS & Hosting
- Stooq API allows cross-origin requests
- Works directly from GitHub Pages, static hosts, or local files
- No server-side proxy required

## 🛠️ Troubleshooting

### "Failed to load data" Error
- Verify the ticker symbol is correct (US stocks only by default)
- Check internet connection
- Try a well-known ticker like AAPL or MSFT to test API
- Ensure ticker exists on Stooq (visit stooq.com to verify)

### Chart Not Displaying
- Check browser console for JavaScript errors
- Ensure Chart.js CDN is accessible
- Verify iframe dimensions are set correctly
- Try disabling browser extensions (ad blockers)

### Zoom Not Working
- Verify Chart.js Zoom plugin is loaded
- Check browser compatibility
- On mobile, use pinch gesture instead of scrolling

### Slow Performance
- Reduce number of tickers (fewer = faster)
- Use shorter time ranges
- Close other browser tabs
- Check internet speed

## 🔐 Privacy & Security

- **No data collection**: Widget runs entirely client-side
- **No cookies**: No tracking or user data storage
- **No backend**: All API calls made directly to Stooq
- **Open source**: All code is visible and auditable

## 📄 License

This project is provided as-is for educational and personal use. Stooq data is freely available for personal and commercial use.

## 🤝 Contributing

Found a bug or have a feature request? Please:
1. Check existing issues on GitHub
2. Create a new issue with detailed description
3. Include browser/device information
4. Provide steps to reproduce (for bugs)

## 📞 Support

For questions or issues:
- Review this README thoroughly
- Check the **Help** modal (? button) in the widget
- Search for similar issues on GitHub
- Create a new issue with detailed information

## 🔗 Related Tools

- **Stock Ticker Widget**: Scrolling ticker tape at `/Website/ticker.html`
- **Chart.js Documentation**: https://www.chartjs.org/docs/latest/
- **Stooq**: https://stooq.com/ (data source)

## 📊 Example Ticker Symbols

### Technology
- AAPL (Apple)
- MSFT (Microsoft)
- GOOGL (Google)
- AMZN (Amazon)
- META (Meta/Facebook)
- NVDA (NVIDIA)
- TSLA (Tesla)

### Finance
- JPM (JPMorgan Chase)
- BAC (Bank of America)
- WFC (Wells Fargo)
- GS (Goldman Sachs)

### Healthcare
- JNJ (Johnson & Johnson)
- PFE (Pfizer)
- UNH (UnitedHealth)
- ABBV (AbbVie)

### ETFs & Indices
- SPY (S&P 500 ETF)
- QQQ (NASDAQ-100 ETF)
- DIA (Dow Jones ETF)
- IWM (Russell 2000 ETF)

---

**Built with ❤️ using Chart.js and Stooq API**

*Last Updated: 2025*
