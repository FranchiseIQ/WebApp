/**
 * Stock Ticker Module
 * Displays real-time stock prices and market status
 */

(function() {
    const MARKET_OPEN_HOUR = 9;   // 9:30 AM ET
    const MARKET_OPEN_MINUTE = 30;
    const MARKET_CLOSE_HOUR = 16; // 4:00 PM ET
    const MARKET_CLOSE_MINUTE = 0;

    let stockData = null;
    let manifestData = null;
    let isMarketOpen = false;

    function init() {
        loadManifest();
        loadStockData();
        updateMarketStatus();

        // Update market status every second (for countdown with seconds)
        setInterval(updateMarketStatus, 1000);

        // Reload stock data every 5 minutes
        setInterval(loadStockData, 300000);
    }

    function loadManifest() {
        fetch('data/brands_manifest.json')
            .then(res => res.json())
            .then(data => {
                manifestData = data;
            })
            .catch(e => {
                console.log('Manifest not available:', e);
                manifestData = [];
            });
    }

    function loadStockData() {
        fetch('data/stocks.json')
            .then(res => res.json())
            .then(data => {
                stockData = data;
                // Handle both array format and quotes object format
                const quotes = Array.isArray(data) ? data : (data.quotes || {});
                renderTicker(quotes);
            })
            .catch(e => {
                console.log('Stock data not available:', e);
                const tape = document.getElementById('ticker-tape');
                tape.innerHTML = '<span class="ticker-empty">Stock data unavailable</span>';
                tape.classList.remove('has-data');
            });
    }

    function getCompanyName(ticker) {
        if (!manifestData) return ticker;
        const brand = manifestData.find(b => b.ticker === ticker);
        return brand ? brand.name : ticker;
    }

    function renderTicker(quotes) {
        const tape = document.getElementById('ticker-tape');

        // Handle both array and object formats
        let quotesList = Array.isArray(quotes) ? quotes : Object.values(quotes);

        if (!quotesList || quotesList.length === 0) {
            // Static placeholder for empty state - no scrolling
            tape.innerHTML = '<span class="ticker-empty">No stock data available</span>';
            tape.classList.remove('has-data');
            return;
        }

        let html = '';
        // Sort by changePercent (absolute) for most active, then by price
        const sorted = quotesList
            .filter(q => q.ticker && q.price !== undefined && q.changePercent !== undefined)
            .sort((a, b) => {
                // Sort by absolute change percent (most volatile first), then by price
                const absA = Math.abs(b.changePercent || 0);
                const absB = Math.abs(a.changePercent || 0);
                if (absA !== absB) return absA - absB;
                return (b.price || 0) - (a.price || 0);
            })
            .slice(0, 20);

        // Generate ticker items once
        sorted.forEach(quote => {
            const changeClass = quote.changePercent >= 0 ? 'up' : 'down';
            const changeSign = quote.changePercent >= 0 ? '+' : '';
            const symbol = quote.ticker || quote.symbol || 'N/A';
            const companyName = getCompanyName(symbol);
            const price = quote.price || 0;
            const changePercent = quote.changePercent || 0;

            html += `
                <div class="ticker-item">
                    <div class="ticker-info">
                        <span class="ticker-symbol">${symbol}</span>
                        <span class="ticker-company">${companyName}</span>
                    </div>
                    <span class="ticker-price">$${price.toFixed(2)}</span>
                    <span class="ticker-change ${changeClass}">${changeSign}${changePercent.toFixed(2)}%</span>
                </div>
            `;
        });

        // Duplicate HTML for seamless scrolling animation
        tape.innerHTML = html + html;
        tape.classList.add('has-data');

        // Update ticker color based on market state
        updateTickerColor();
    }

    function updateTickerColor() {
        const tape = document.getElementById('ticker-tape');
        if (isMarketOpen) {
            tape.classList.remove('market-closed');
            tape.classList.add('market-open');
        } else {
            tape.classList.remove('market-open');
            tape.classList.add('market-closed');
        }
    }

    function updateMarketStatus() {
        const statusEl = document.getElementById('market-status');
        const countdownEl = document.getElementById('market-countdown');

        const now = new Date();
        const etNow = getETTime(now);

        const dayOfWeek = etNow.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        const currentMinutes = etNow.getHours() * 60 + etNow.getMinutes();
        const openMinutes = MARKET_OPEN_HOUR * 60 + MARKET_OPEN_MINUTE;
        const closeMinutes = MARKET_CLOSE_HOUR * 60 + MARKET_CLOSE_MINUTE;

        let isOpen = false;
        let timeToEvent = 0;
        let eventLabel = '';

        if (isWeekend) {
            // Weekend - calculate time until Monday 9:30 AM
            const daysUntilMonday = dayOfWeek === 0 ? 1 : 2;
            const mondayOpen = new Date(etNow);
            mondayOpen.setDate(mondayOpen.getDate() + daysUntilMonday);
            mondayOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
            timeToEvent = mondayOpen - etNow;
            eventLabel = 'Opens';
            isOpen = false;
        } else if (currentMinutes < openMinutes) {
            // Before market open
            const todayOpen = new Date(etNow);
            todayOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
            timeToEvent = todayOpen - etNow;
            eventLabel = 'Opens';
            isOpen = false;
        } else if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            // Market is open
            const todayClose = new Date(etNow);
            todayClose.setHours(MARKET_CLOSE_HOUR, MARKET_CLOSE_MINUTE, 0, 0);
            timeToEvent = todayClose - etNow;
            eventLabel = 'Closes';
            isOpen = true;
        } else {
            // After market close
            // Calculate time until next open (tomorrow or Monday if Friday)
            let nextOpen = new Date(etNow);
            if (dayOfWeek === 5) {
                // Friday after close - next open is Monday
                nextOpen.setDate(nextOpen.getDate() + 3);
            } else {
                // Regular weekday - next open is tomorrow
                nextOpen.setDate(nextOpen.getDate() + 1);
            }
            nextOpen.setHours(MARKET_OPEN_HOUR, MARKET_OPEN_MINUTE, 0, 0);
            timeToEvent = nextOpen - etNow;
            eventLabel = 'Opens';
            isOpen = false;
        }

        // Store market state for ticker color updates
        isMarketOpen = isOpen;

        // Update status display
        if (isOpen) {
            statusEl.textContent = 'Market Open';
            statusEl.className = 'open';
        } else {
            statusEl.textContent = 'Market Closed';
            statusEl.className = 'closed';
        }

        // Format countdown with hours, minutes, and seconds
        const totalSeconds = Math.floor(timeToEvent / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        // Pad zeros for HH:MM:SS format
        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            const paddedRemainingHours = String(remainingHours).padStart(2, '0');
            countdownEl.textContent = `${eventLabel} in ${days}d ${paddedRemainingHours}h ${paddedMinutes}m`;
        } else {
            countdownEl.textContent = `${eventLabel} in ${hours}h ${paddedMinutes}m ${paddedSeconds}s`;
        }

        // Update ticker color based on market state
        updateTickerColor();
    }

    function getETTime(date) {
        // Convert to Eastern Time
        const etString = date.toLocaleString('en-US', { timeZone: 'America/New_York' });
        return new Date(etString);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
