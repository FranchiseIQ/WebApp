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

### Embed in Website

```html
<iframe src="https://monroegamble.github.io/WebApp/StockChart/chart.html"
        width="100%"
        height="700"
        frameborder="0"
        style="border: none;">
</iframe>
```

### Embed in Google Sites

1. Go to **Insert** → **Embed** → **Embed Code**
2. Paste the iframe code above
3. Adjust height as needed (recommended: 700px)
4. Click **Insert**

## How to Use

### Adding Tickers

1. Type a stock symbol in the "Add Ticker" input (e.g., AAPL, TSLA, MCD)
2. Click **Add** or press **Enter**
3. The ticker will appear as a colored chip below the input
4. Repeat to add up to 10 tickers

### Removing Tickers

Click the **×** button on any ticker chip to remove it from the chart.

### Customizing Tickers

1. Click the **⚙️** settings icon on any ticker chip
2. Choose a custom line color using the color picker
3. Adjust line width with the slider (1-5 pixels)
4. Click **Save** to apply changes

### Changing Time Range

Click any of the time range buttons:
- **1D** - Today's intraday data
- **5D** - Last 5 trading days
- **1M** - Last month
- **3M** - Last 3 months
- **6M** - Last 6 months
- **YTD** - Year to date
- **1Y** - Last year
- **2Y** - Last 2 years
- **5Y** - Last 5 years
- **10Y** - Last 10 years
- **MAX** - All available history

### Zooming and Panning

**Zoom:**
- Mouse wheel up/down
- Pinch gesture on touch devices

**Pan:**
- Hold **Shift** and drag the chart
- Touch and drag on mobile

**Reset:**
- Click **Reset Zoom** button to restore original view

## Default Tickers

The chart loads with three default franchise stocks:
- **MCD** - McDonald's
- **YUM** - Yum! Brands
- **QSR** - Restaurant Brands International

## Technical Details

### Data Source

**Yahoo Finance Chart API**
```
https://query1.finance.yahoo.com/v8/finance/chart/{TICKER}?range={RANGE}&interval=1d
```

### Adjusted Close Prices

The widget uses **adjusted close prices** (`adjclose`) which account for:
- Stock splits (e.g., 2-for-1, 3-for-1)
- Dividends
- Other corporate actions

This ensures accurate historical performance analysis.

**Example:**
```javascript
// Raw close: Shows apparent -50% drop after 2-for-1 split
// Adjusted close: Shows true performance (no artificial drop)
```

### CORS Proxy System

The widget uses a 4-tier fallback system:
1. `allorigins.win` (Primary - 90% reliability)
2. `corsproxy.io` (Backup - 85% reliability)
3. `codetabs.com` (Alternative - 75% reliability)
4. Direct connection (Fallback - may fail due to CORS)

### Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## API Rate Limits

**Yahoo Finance:**
- No official rate limits
- Recommended: Max 60 requests per minute
- Widget batches requests efficiently

**This widget:**
- 1 API call per ticker per time range change
- Cached data prevents redundant calls
- Example: Loading 5 tickers = 5 API calls

## Customization Guide

### Changing Default Tickers

Edit `chart.js` line 10:
```javascript
const DEFAULT_TICKERS = ['MCD', 'YUM', 'QSR']; // Change these
```

### Adjusting Color Palette

Edit `chart.js` lines 16-21:
```javascript
const COLOR_PALETTE = [
  '#667eea', // Purple
  '#764ba2', // Violet
  '#f093fb', // Pink
  // Add more hex colors...
];
```

### Modifying Max Tickers

Edit `chart.js` line 8:
```javascript
const MAX_TICKERS = 10; // Change to any number
```

### Changing Default Time Range

Edit `chart.js` line 11:
```javascript
let currentRange = 'ytd'; // Options: 1d, 5d, 1mo, 3mo, 6mo, ytd, 1y, 2y, 5y, 10y, max
```

## Embed Size Recommendations

### Full Desktop Experience
```html
<iframe src="..." width="100%" height="700" frameborder="0"></iframe>
```

### Compact View
```html
<iframe src="..." width="100%" height="500" frameborder="0"></iframe>
```

### Mobile Optimized
```html
<iframe src="..." width="100%" height="600" frameborder="0"></iframe>
```

## Troubleshooting

### No Data Loading

**Symptoms:** Spinning loader, no chart appears

**Solutions:**
1. Check browser console (F12) for errors
2. Verify ticker symbols are valid (check Yahoo Finance)
3. Try refreshing the page
4. Wait 10-15 seconds for API to respond
5. Check internet connection

### Chart Not Responding

**Symptoms:** Can't zoom/pan, buttons don't work

**Solutions:**
1. Ensure JavaScript is enabled
2. Try a hard refresh: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
3. Clear browser cache
4. Check console for JavaScript errors

### Ticker Won't Add

**Symptoms:** "Failed to fetch data" error

**Possible causes:**
- Invalid ticker symbol
- Delisted stock
- API temporarily unavailable
- CORS proxy down

**Solutions:**
- Verify ticker exists on Yahoo Finance: `https://finance.yahoo.com/quote/SYMBOL`
- Try again in 30 seconds (proxy may be rate limited)
- Try a different ticker first

### Adjusted Prices Not Showing

**Symptoms:** Chart shows sharp drops on split dates

**This should NOT happen** - the widget automatically uses adjusted prices. If you see this:
1. Check browser console for warnings
2. Look for message: "Using regular close (adjusted not available)"
3. This means Yahoo Finance didn't provide adjusted data for that ticker
4. Report the ticker symbol as an issue

### Slow Performance

**Symptoms:** Chart lags when adding tickers or changing ranges

**Solutions:**
- Reduce number of active tickers (max performance with 3-5)
- Use shorter time ranges (1M, 3M instead of MAX)
- Close unnecessary browser tabs
- Update to latest browser version

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| **Enter** | Add ticker (when input focused) |
| **Shift + Drag** | Pan chart |
| **Mouse Wheel** | Zoom in/out |
| **Esc** | Close modal |

## Performance Tips

1. **Limit tickers** - 5-7 tickers for best performance
2. **Use shorter ranges** - MAX range can load decades of data
3. **Close settings modal** - Modal overlay affects render speed
4. **Avoid rapid clicking** - Wait for data to load before changing range again

## Security & Privacy

- ✅ No user data collected
- ✅ No cookies or tracking
- ✅ No backend server
- ✅ All processing done in browser
- ✅ HTTPS encrypted connections
- ✅ No API keys exposed

## File Structure

```
StockChart/
├── chart.html      # Main HTML page
├── chart.js        # Application logic (400+ lines)
├── style.css       # Complete styling (600+ lines)
└── README.md       # This file
```

## Dependencies (CDN)

- **Chart.js 4.4.0** - Charting library
- **chartjs-plugin-zoom 2.0.1** - Zoom/pan functionality
- **chartjs-adapter-date-fns 3.0.0** - Date handling
- **Hammer.js 2.0.8** - Touch gesture support

All dependencies loaded via CDN - no local installation required.

## Limitations

1. **Maximum 10 tickers** - Technical limit to maintain performance
2. **Daily interval only** - Intraday (minute-level) data not supported for historical ranges
3. **US market focus** - Best support for US-listed stocks
4. **API dependency** - Requires Yahoo Finance to be accessible
5. **No real-time streaming** - Data refreshed on demand, not pushed

## Future Enhancements

Potential features for future versions:
- [ ] Save/load ticker configurations
- [ ] Export chart as image
- [ ] Multiple chart types (candlestick, area, bar)
- [ ] Technical indicators (SMA, EMA, RSI, MACD)
- [ ] Comparison mode (% change from baseline)
- [ ] Volume overlay
- [ ] Split/dividend markers
- [ ] News integration
- [ ] Earnings date markers

## Support

For issues, feature requests, or questions:
- Create an issue on GitHub
- Check browser console for error messages
- Verify ticker symbols on Yahoo Finance first

## License

This widget is provided as-is for educational and personal use.

---

**Built for FranchiseIQ** - Professional stock analysis for the franchise industry

**Version:** 1.0
**Last Updated:** November 2024
