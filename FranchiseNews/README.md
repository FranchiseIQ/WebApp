# Franchise News Aggregator Widget

A reusable, embeddable JavaScript widget system for displaying curated franchise industry news. Works standalone or as a white-label embed for franchisors, brokers, and consultants.

## Features

- **Two Display Modes:**
  - **Horizontal Scrolling Ticker**: Continuous news ticker similar to stock tickers
  - **Vertical News Feed**: Card-based feed widget for content areas

- **100% Client-Side**: Pure vanilla JavaScript with zero dependencies
- **Responsive Design**: Mobile, tablet, and desktop optimized
- **Embeddable**: Clean API for third-party websites
- **Configurable**: Extensive customization options
- **Accessible**: WCAG compliant with reduced motion support
- **Themeable**: Custom colors, fonts, and styling

## Live Demo

- **News Ticker**: [https://monroegamble.github.io/WebApp/FranchiseNews/news-ticker.html](FranchiseNews/news-ticker.html)
- **News Feed**: [https://monroegamble.github.io/WebApp/FranchiseNews/news-feed.html](FranchiseNews/news-feed.html)
- **Main Site** (ticker at bottom): [https://monroegamble.github.io/WebApp/](../)

## Quick Start

### 1. Basic HTML Setup

Include the required CSS and JavaScript files:

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="https://monroegamble.github.io/WebApp/FranchiseNews/news-widget.css">
</head>
<body>
    <!-- Your ticker or feed container -->
    <div id="franchise-news-ticker"></div>

    <!-- Required scripts -->
    <script src="https://monroegamble.github.io/WebApp/FranchiseNews/newsService.js"></script>
    <script src="https://monroegamble.github.io/WebApp/FranchiseNews/news-widget.js"></script>
</body>
</html>
```

### 2. Initialize a Ticker

```html
<div id="franchise-news-ticker"></div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    await window.FranchiseNewsWidget.initTicker({
        mountSelector: '#franchise-news-ticker',
        categories: ['Trade press and industry news', 'Big portals, directories, and lead-gen sites'],
        tickerSpeed: 90,
        pauseOnHover: true
    });
});
</script>
```

### 3. Initialize a Feed

```html
<div id="franchise-news-feed"></div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    await window.FranchiseNewsWidget.initFeed({
        mountSelector: '#franchise-news-feed',
        layout: 'list',
        maxItems: 10,
        categories: ['Trade press and industry news']
    });
});
</script>
```

## Data Sources

The widget aggregates news from these franchise industry sources:

### Trade Press and Industry News
- [Franchise Times](https://www.franchisetimes.com/)
- [1851 Franchise](https://1851franchise.com/)
- [FranchiseWire](https://www.franchisewire.com/)
- [QSR Magazine](https://www.qsrmagazine.com/franchising/)
- [Blue MauMau](https://www.bluemaumau.org/)

### Big Portals, Directories, and Lead-Gen Sites
- [Franchising.com](https://www.franchising.com/)
- [Franchise Direct](https://www.franchisedirect.com/)
- [Entrepreneur Franchises](https://www.entrepreneur.com/franchise500)
- [Franchise Gator](https://www.franchisegator.com/)

### Research, Reviews, and Investor-Oriented Info
- [Franchise Business Review](https://franchisebusinessreview.com/)
- [Franchising Magazine USA](https://franchisingmagazineusa.com/)

### Associations and Policy Hubs
- [International Franchise Association (IFA)](https://www.franchise.org/)

### Consultants, Suppliers, and Service Firms
- [StartBlox](https://startblox.com/)
- [Frannexus](https://frannexus.com/)
- [iFranchise Group](https://ifranchisegroup.com/)
- [GoodSpark Franchise Development](https://www.goodsparkfranchise.com/)
- [Field Coach Experts](https://fieldcoachexperts.com/)

## API Reference

### FranchiseNewsWidget.initTicker(config)

Initialize a horizontal scrolling news ticker.

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mountSelector` | string | `'#franchise-news-ticker'` | DOM selector for mount point |
| `categories` | array | `[]` | Filter by categories (see below) |
| `sources` | array | `[]` | Filter by specific source IDs |
| `tickerSpeed` | number | `90` | Animation speed in seconds |
| `pauseOnHover` | boolean | `true` | Pause scrolling on mouse hover |
| `showLabel` | boolean | `true` | Show label bar at top |
| `labelText` | string | `'Franchise News'` | Custom label text |
| `labelIcon` | string | `'📰'` | Custom label icon (emoji or HTML) |
| `theme` | object | `{}` | Theme customizations |

#### Theme Options

```javascript
theme: {
    backgroundColor: '#0a0a0a',
    textColor: '#ffffff',
    fontSize: '15px'
}
```

#### Example

```javascript
await window.FranchiseNewsWidget.initTicker({
    mountSelector: '#my-ticker',
    categories: [
        window.NEWS_CATEGORIES.TRADE_PRESS,
        window.NEWS_CATEGORIES.BIG_PORTALS
    ],
    tickerSpeed: 60,
    pauseOnHover: true,
    labelText: 'Latest Franchise News',
    labelIcon: '🔔',
    theme: {
        backgroundColor: '#1a1a2e',
        fontSize: '16px'
    }
});
```

### FranchiseNewsWidget.initFeed(config)

Initialize a vertical news feed widget.

#### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mountSelector` | string | `'#franchise-news-feed'` | DOM selector for mount point |
| `categories` | array | `[]` | Filter by categories |
| `sources` | array | `[]` | Filter by specific source IDs |
| `maxItems` | number | `20` | Maximum articles to display |
| `layout` | string | `'list'` | Layout style: `'list'` or `'compact'` |
| `showHeader` | boolean | `true` | Show header section |
| `headerTitle` | string | `'📰 Latest Franchise News'` | Custom header title |
| `headerSubtitle` | string | `'Industry updates...'` | Custom header subtitle |
| `showCategory` | boolean | `true` | Show category pills |
| `showDate` | boolean | `true` | Show published dates |
| `theme` | object | `{}` | Theme customizations |

#### Theme Options

```javascript
theme: {
    cardBorderRadius: '0.75rem',
    cardPadding: '0.75rem 1rem',
    backgroundColor: '#1a1a1a',
    textColor: '#e0e0e0'
}
```

#### Example

```javascript
await window.FranchiseNewsWidget.initFeed({
    mountSelector: '#my-feed',
    layout: 'compact',
    maxItems: 15,
    categories: [
        window.NEWS_CATEGORIES.TRADE_PRESS,
        window.NEWS_CATEGORIES.RESEARCH
    ],
    showHeader: true,
    headerTitle: '🔥 Trending News',
    showCategory: true,
    theme: {
        cardBorderRadius: '8px',
        cardPadding: '1rem'
    }
});
```

### News Categories

Access category constants via `window.NEWS_CATEGORIES`:

```javascript
window.NEWS_CATEGORIES = {
    TRADE_PRESS: 'Trade press and industry news',
    BIG_PORTALS: 'Big portals, directories, and lead-gen sites',
    RESEARCH: 'Research, reviews, and investor-oriented info',
    ASSOCIATIONS: 'Associations and policy hubs',
    CONSULTANTS: 'Consultants, suppliers, and franchisor service firms'
}
```

## Embed Code Examples

### For Websites (iframe)

#### Ticker Embed

```html
<iframe
    src="https://monroegamble.github.io/WebApp/FranchiseNews/news-ticker.html"
    width="100%"
    height="95"
    frameborder="0"
    style="border: none; display: block;">
</iframe>
```

#### Feed Embed

```html
<iframe
    src="https://monroegamble.github.io/WebApp/FranchiseNews/news-feed.html"
    width="100%"
    height="600"
    frameborder="0"
    style="border: none; display: block;">
</iframe>
```

### For Notion

1. Copy the URL:
   - Ticker: `https://monroegamble.github.io/WebApp/FranchiseNews/news-ticker.html`
   - Feed: `https://monroegamble.github.io/WebApp/FranchiseNews/news-feed.html`

2. In Notion, type `/embed` and paste the URL

3. Adjust height:
   - Ticker: 95-120px
   - Feed: 600-800px

### For WordPress

Use the "Custom HTML" block:

```html
<div id="franchise-news-ticker"></div>

<link rel="stylesheet" href="https://monroegamble.github.io/WebApp/FranchiseNews/news-widget.css">
<script src="https://monroegamble.github.io/WebApp/FranchiseNews/newsService.js"></script>
<script src="https://monroegamble.github.io/WebApp/FranchiseNews/news-widget.js"></script>
<script>
document.addEventListener('DOMContentLoaded', async () => {
    await window.FranchiseNewsWidget.initTicker({
        mountSelector: '#franchise-news-ticker',
        categories: ['Trade press and industry news']
    });
});
</script>
```

### For React Applications

```jsx
import { useEffect } from 'react';

function FranchiseNewsTicker() {
    useEffect(() => {
        // Load scripts dynamically
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.onload = resolve;
                script.onerror = reject;
                document.body.appendChild(script);
            });
        };

        const initWidget = async () => {
            await loadScript('https://monroegamble.github.io/WebApp/FranchiseNews/newsService.js');
            await loadScript('https://monroegamble.github.io/WebApp/FranchiseNews/news-widget.js');

            await window.FranchiseNewsWidget.initTicker({
                mountSelector: '#franchise-ticker',
                categories: ['Trade press and industry news']
            });
        };

        initWidget();
    }, []);

    return <div id="franchise-ticker"></div>;
}
```

## Custom Implementations

### Fixed Bottom Ticker (Full-Site)

Add to your main page layout:

```html
<style>
body {
    padding-bottom: 95px; /* Space for fixed ticker */
}
</style>

<div id="franchise-news-ticker-bottom" style="position: fixed; bottom: 0; left: 0; width: 100%; z-index: 999;"></div>

<script>
document.addEventListener('DOMContentLoaded', async () => {
    await window.FranchiseNewsWidget.initTicker({
        mountSelector: '#franchise-news-ticker-bottom',
        categories: ['Trade press and industry news', 'Big portals, directories, and lead-gen sites'],
        tickerSpeed: 90,
        pauseOnHover: true
    });
});
</script>
```

### Multi-Category Feed with Tabs

```html
<div class="news-tabs">
    <button onclick="loadCategory('trade')">Trade Press</button>
    <button onclick="loadCategory('research')">Research</button>
    <button onclick="loadCategory('all')">All News</button>
</div>

<div id="franchise-news-feed"></div>

<script>
async function loadCategory(category) {
    const categoryMap = {
        'trade': [window.NEWS_CATEGORIES.TRADE_PRESS],
        'research': [window.NEWS_CATEGORIES.RESEARCH],
        'all': Object.values(window.NEWS_CATEGORIES)
    };

    await window.FranchiseNewsWidget.initFeed({
        mountSelector: '#franchise-news-feed',
        categories: categoryMap[category],
        maxItems: 15
    });
}

// Load default category
document.addEventListener('DOMContentLoaded', () => loadCategory('all'));
</script>
```

## Switching from Mock Data to Real API

The widget currently uses mock data. To integrate with a real backend:

### Option 1: Static JSON File

1. Create a JSON file at `/data/news.json`:

```json
[
  {
    "id": "news-001",
    "title": "Your article title",
    "sourceId": "franchise-times",
    "url": "https://example.com/article",
    "publishedAt": "2025-01-15",
    "category": "Trade press and industry news",
    "shortSourceLabel": "Franchise Times"
  }
]
```

2. Edit `newsService.js` (line ~185):

```javascript
async getAllArticles() {
    // Replace mock data with fetch
    const response = await fetch('/data/news.json');
    return await response.json();
}
```

### Option 2: REST API

Edit `newsService.js` (line ~185):

```javascript
async getAllArticles() {
    // Fetch from your API endpoint
    const response = await fetch('https://api.yoursite.com/franchise-news');
    return await response.json();
}
```

### Option 3: RSS Feed Aggregation

Use a serverless function (AWS Lambda, Cloudflare Workers) to:
1. Fetch RSS feeds from source sites
2. Parse and normalize data
3. Return JSON in the expected format

Example endpoint structure:
```
GET /api/franchise-news
  ?categories=trade-press,big-portals
  &days=7
  &limit=20
```

## File Structure

```
FranchiseNews/
├── newsService.js         # Data service layer (mock data + API hooks)
├── news-widget.js         # Main widget controller (ticker + feed)
├── news-widget.css        # Widget styles (matches stock ticker)
├── news-ticker.html       # Standalone ticker page
├── news-feed.html         # Standalone feed page
└── README.md              # This documentation
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance

- **No dependencies**: Zero external libraries
- **Lazy loading**: Scripts load asynchronously
- **GPU acceleration**: CSS transforms with `will-change`
- **Efficient animations**: RequestAnimationFrame-based scrolling
- **Small footprint**: ~15KB combined (uncompressed)

## Accessibility

- **WCAG 2.1 AA compliant**
- **Keyboard navigation**: Full tab support
- **Screen reader friendly**: Semantic HTML5
- **Reduced motion support**: Respects `prefers-reduced-motion`
- **High contrast mode**: Adapts to system settings

## Customization Tips

### Match Your Brand Colors

```javascript
theme: {
    backgroundColor: '#your-brand-color',
    textColor: '#your-text-color'
}
```

### Adjust Animation Speed

```javascript
tickerSpeed: 60  // Faster (60 seconds)
tickerSpeed: 120 // Slower (120 seconds)
```

### Filter by Specific Sources

```javascript
sources: ['franchise-times', '1851-franchise', 'qsr-magazine']
```

### Compact Layout for Sidebars

```javascript
layout: 'compact',
maxItems: 5
```

## Troubleshooting

### Ticker Not Scrolling

- Check browser console for errors
- Verify all scripts are loaded
- Ensure container has width (not `display: none`)

### No Articles Displayed

- Check mock data in `newsService.js`
- Verify category filters match available categories
- Check browser console for fetch errors

### Styling Issues

- Ensure CSS file is loaded before JavaScript
- Check for CSS conflicts (use browser DevTools)
- Add `!important` to theme overrides if needed

## License

MIT License - Free for personal and commercial use

## Support

- **Issues**: [GitHub Issues](https://github.com/MonroeGamble/WebApp/issues)
- **Docs**: [Online Documentation](https://monroegamble.github.io/WebApp/FranchiseNews/)

## Changelog

### Version 1.0.0 (2025-01-15)
- Initial release
- Horizontal scrolling ticker widget
- Vertical news feed widget
- 17 franchise news sources
- Full embed support
- Responsive design
- Accessibility features

---

**Built with ❤️ for the franchise industry**
