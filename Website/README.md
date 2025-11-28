# Stock Ticker Widget

A clean, self-contained, embeddable scrolling stock ticker widget displaying live prices for franchise-related companies. This widget can be embedded on Google Sites, hosted on GitHub Pages, Netlify, or any static hosting platform.

## Features

- **Live Real-Time Prices** – Fetches current stock prices from Yahoo Finance API
- **Auto-Refresh** – Updates every 60 seconds automatically
- **Smooth Scrolling** – Continuous left-to-right marquee animation
- **Color-Coded Changes** – Green for positive, red for negative, gray for neutral
- **100% Client-Side** – No server, no backend, no build process required
- **Embeddable** – Works perfectly in iframes on Google Sites and other platforms
- **Offline Fallback** – Displays cached data when API is unavailable
- **Responsive Design** – Adapts to different screen sizes and iframe heights
- **No Dependencies** – Pure vanilla JavaScript, HTML, and CSS

## Files Included

```
Website/
├── ticker.html    # Main HTML file
├── ticker.js      # JavaScript logic and API integration
├── style.css      # Styling and animation
└── README.md      # This file
```

## Default Ticker List

The widget displays the following franchise-related stocks:

**Quick Service & Restaurants:**
MCD (McDonald's), YUM (Yum! Brands), QSR (Restaurant Brands), WEN (Wendy's), DPZ (Domino's), JACK (Jack in the Box), WING (Wingstop), SHAK (Shake Shack), DENN (Denny's), DIN (Dine Brands), DNUT (Krispy Kreme), NATH (Nathan's Famous), RRGB (Red Robin)

**Automotive & Services:**
DRVN (Driven Brands), HRB (H&R Block), MCW (Mister Car Wash), SERV (ServiceMaster), ROL (Rollins)

**Fitness & Health:**
PLNT (Planet Fitness), BFT (F45 Training)

**Hospitality:**
MAR (Marriott), HLT (Hilton), H (Hyatt), CHH (Choice Hotels), WH (Wyndham), VAC (Marriott Vacations), TNL (Travel + Leisure)

**Retail & Other:**
RENT (Rent-A-Center), GNC, ADUS (Addus HomeCare), LOPE (Grand Canyon Education), PLAY (Dave & Buster's), ARCO (Arcos Dorados), TAST (Carrols Restaurant)

## How to Change the Ticker List

Open `ticker.js` and modify the `TICKER_SYMBOLS` array at the top of the file:

```javascript
const TICKER_SYMBOLS = [
  "MCD", "YUM", "QSR", // Keep existing
  "ARCO", "TAST",      // Add new symbols
  // "DNUT"             // Comment out to remove
];
```

**Examples:**

1. **Add a single stock:**
   ```javascript
   const TICKER_SYMBOLS = [
     "MCD", "YUM", "QSR",
     "ARCO"  // Added Arcos Dorados
   ];
   ```

2. **Remove a stock:**
   Simply delete the symbol from the array or comment it out with `//`

3. **Replace entire list:**
   ```javascript
   const TICKER_SYMBOLS = ["AAPL", "GOOGL", "MSFT", "TSLA"];
   ```

After making changes, save the file. The ticker will automatically fetch data for your new symbols on the next refresh.

## Embedding in Google Sites

1. **Upload Files:**
   - Host the widget on GitHub Pages, Netlify, or Google Drive (see hosting instructions below)

2. **Get the Embed Code:**
   ```html
   <iframe src="https://YOUR_HOSTED_LOCATION/ticker.html"
           width="100%"
           height="100"
           frameborder="0"
           style="border: none;">
   </iframe>
   ```

3. **Add to Google Site:**
   - Edit your Google Site page
   - Click **Insert** → **Embed**
   - Paste the iframe code
   - Click **Insert**

**Note:** Google Sites blocks `<script>` tags but allows iframes, which is why this widget is designed to work via iframe embedding.

## Hosting Options

### Option 1: GitHub Pages

1. **Create a GitHub repository** (or use existing)

2. **Upload files** to a folder in your repo:
   ```
   your-repo/
   └── Website/
       ├── ticker.html
       ├── ticker.js
       ├── style.css
       └── README.md
   ```

3. **Enable GitHub Pages:**
   - Go to repository **Settings** → **Pages**
   - Select branch (usually `main`)
   - Select folder (root or `/docs`)
   - Click **Save**

4. **Access your widget:**
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPO/Website/ticker.html
   ```

5. **Embed in Google Sites:**
   ```html
   <iframe src="https://YOUR_USERNAME.github.io/YOUR_REPO/Website/ticker.html"
           width="100%" height="100" frameborder="0"></iframe>
   ```

### Option 2: Netlify

1. **Sign up** at [netlify.com](https://www.netlify.com)

2. **Drag and drop** the `Website` folder onto Netlify's deploy zone

3. **Get your URL:**
   ```
   https://YOUR_SITE.netlify.app/ticker.html
   ```

4. **Embed in Google Sites:**
   ```html
   <iframe src="https://YOUR_SITE.netlify.app/ticker.html"
           width="100%" height="100" frameborder="0"></iframe>
   ```

### Option 3: Google Drive (Limited Support)

**Note:** Google Drive hosting has CORS restrictions and may not work reliably for API calls.

1. **Upload files** to Google Drive

2. **Share publicly:**
   - Right-click → **Share** → **Anyone with the link**

3. **Get shareable link** (format varies, not recommended for production)

**Recommendation:** Use GitHub Pages or Netlify instead of Google Drive for better reliability.

### Option 4: Local Testing

1. **Open directly in browser:**
   ```
   file:///C:/path/to/Website/ticker.html
   ```

2. **Use a local server** (recommended):
   ```bash
   # Python 3
   python -m http.server 8000

   # Navigate to:
   # http://localhost:8000/ticker.html
   ```

## Customization

### Change Refresh Interval

Edit `ticker.js` and modify `REFRESH_INTERVAL` (in milliseconds):

```javascript
// Refresh every 30 seconds instead of 60
const REFRESH_INTERVAL = 30000;
```

### Adjust Scrolling Speed

Edit `style.css` and change the animation duration:

```css
#ticker-content {
  animation: scroll-left 90s linear infinite; /* Make this larger for slower scrolling */
}
```

Examples:
- `60s` = faster scrolling
- `120s` = slower scrolling

### Change Colors

Edit `style.css`:

```css
/* Positive change color */
.ticker-change.positive {
  color: #00ff88;  /* Change to any color */
  background-color: rgba(0, 255, 136, 0.1);
}

/* Negative change color */
.ticker-change.negative {
  color: #ff4444;  /* Change to any color */
  background-color: rgba(255, 68, 68, 0.1);
}

/* Background */
#ticker-container {
  background: linear-gradient(90deg, #0f0f0f 0%, #1a1a1a 50%, #0f0f0f 100%);
}
```

### Adjust Font Size

Edit `style.css`:

```css
.ticker-item {
  font-size: 16px; /* Change base font size */
}

.ticker-symbol {
  font-size: 14px;
}

.ticker-price {
  font-size: 16px;
}
```

## Troubleshooting

### Issue: Ticker shows "N/A" for all prices

**Possible Causes:**
1. **CORS restrictions** – Yahoo Finance API may block requests from certain origins
2. **API rate limiting** – Too many requests in a short period
3. **Network issues** – No internet connection

**Solutions:**
- Check browser console (F12) for error messages
- Verify internet connection
- Wait a few minutes if rate limited
- Host on GitHub Pages or Netlify (better CORS support than local files)
- The widget will use cached prices if available

### Issue: Styles not loading (ticker looks unstyled)

**Possible Causes:**
1. Incorrect file paths
2. Files not in same directory

**Solutions:**
- Ensure all files (`ticker.html`, `ticker.js`, `style.css`) are in the same folder
- Check that file names match exactly (case-sensitive)
- Verify no typos in `<link>` and `<script>` tags
- Check browser console for 404 errors

### Issue: Ticker scrolling too fast or too slow

**Solutions:**
- Edit `style.css` and adjust animation duration:
  ```css
  #ticker-content {
    animation: scroll-left 120s linear infinite; /* Increase for slower */
  }
  ```
- Try values between `30s` (very fast) to `180s` (very slow)
- Default is `90s`

### Issue: Ticker not updating after 60 seconds

**Solutions:**
- Check browser console for JavaScript errors
- Verify API is responding (check Network tab in DevTools)
- Ensure `REFRESH_INTERVAL` is set correctly in `ticker.js`
- Try refreshing the page manually

### Issue: Some symbols showing "N/A" while others work

**Possible Causes:**
1. Invalid ticker symbols
2. Symbol not available on Yahoo Finance
3. Delisted or suspended stocks

**Solutions:**
- Verify ticker symbols are correct and actively traded
- Check Yahoo Finance directly: `https://finance.yahoo.com/quote/SYMBOL`
- Remove invalid symbols from the `TICKER_SYMBOLS` array

### Issue: Widget not displaying in iframe on Google Sites

**Possible Causes:**
1. HTTPS required – Google Sites only allows HTTPS iframes
2. X-Frame-Options blocking

**Solutions:**
- Ensure hosting uses HTTPS (GitHub Pages and Netlify do by default)
- Test the widget URL directly in browser first
- Check Google Sites console for errors

### Issue: Animation stuttering or lagging

**Solutions:**
- Reduce number of ticker symbols
- Increase animation duration (makes it slower but smoother)
- Disable hover pause effect if not needed:
  ```css
  #ticker-content:hover {
    /* Remove this block */
  }
  ```

## API Information

This widget uses the **Yahoo Finance API** to fetch live stock data:

**Endpoint:**
```
https://query1.finance.yahoo.com/v7/finance/quote?symbols=MCD,YUM,QSR...
```

**CORS Proxy:**
To bypass browser CORS restrictions, the widget uses `allorigins.win` as a CORS proxy:
```
https://api.allorigins.win/raw?url=[YAHOO_FINANCE_URL]
```

**Data Retrieved:**
- `regularMarketPrice` – Current stock price
- `regularMarketChangePercent` – Percentage change

**Rate Limits:**
- No official rate limits documented
- Widget refreshes every 60 seconds (safe rate)
- Uses caching to minimize API calls

**Fallback Behavior:**
- If API fails, displays cached data
- If no cache available, shows "N/A"

**Note:** CORS proxies are necessary because browsers block direct cross-origin requests to Yahoo Finance. The allorigins.win service is free and reliable for this purpose.

## Browser Compatibility

Tested and working on:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

This widget is provided as-is for educational and personal use.

## Support

For issues or questions:
1. Check the Troubleshooting section above
2. Verify all files are in the same directory
3. Test in a modern browser with JavaScript enabled
4. Check browser console for error messages

## Version

**Version 1.0** – Initial release

---

**Built for FranResearch** – Tracking the franchise industry's public companies
