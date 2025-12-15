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

    function init() {
        loadStockData();
        updateMarketStatus();

        // Update market status every minute
        setInterval(updateMarketStatus, 60000);

        // Reload stock data every 5 minutes
        setInterval(loadStockData, 300000);
    }

    function loadStockData() {
        fetch('data/stocks.json')
            .then(res => res.json())
            .then(data => {
                stockData = data;
                renderTicker(data.quotes);
            })
            .catch(e => {
                console.log('Stock data not available:', e);
                document.getElementById('ticker-tape').innerHTML = '<span style="opacity:0.6;">Stock data loading...</span>';
            });
    }

    function renderTicker(quotes) {
        const tape = document.getElementById('ticker-tape');
        if (!quotes || Object.keys(quotes).length === 0) {
            tape.innerHTML = '<span style="opacity:0.6;">No stock data available</span>';
            return;
        }

        let html = '';
        // Show top 15 stocks by market cap
        const sorted = Object.values(quotes)
            .filter(q => q.marketCap)
            .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
            .slice(0, 15);

        sorted.forEach(quote => {
            const changeClass = quote.changePercent >= 0 ? 'up' : 'down';
            const changeSign = quote.changePercent >= 0 ? '+' : '';
            html += `
                <div class="ticker-item">
                    <span class="ticker-symbol">${quote.symbol}</span>
                    <span class="ticker-price">$${quote.price.toFixed(2)}</span>
                    <span class="ticker-change ${changeClass}">${changeSign}${quote.changePercent.toFixed(2)}%</span>
                </div>
            `;
        });

        tape.innerHTML = html;
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

        // Update status display
        if (isOpen) {
            statusEl.textContent = 'Market Open';
            statusEl.className = 'open';
        } else {
            statusEl.textContent = 'Market Closed';
            statusEl.className = 'closed';
        }

        // Format countdown
        const hours = Math.floor(timeToEvent / (1000 * 60 * 60));
        const minutes = Math.floor((timeToEvent % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            const remainingHours = hours % 24;
            countdownEl.textContent = `${eventLabel} in ${days}d ${remainingHours}h ${minutes}m`;
        } else {
            countdownEl.textContent = `${eventLabel} in ${hours}h ${minutes}m`;
        }
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
