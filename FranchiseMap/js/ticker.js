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
    let isMarketOpen = false;

    function init() {
        loadStockData();
        updateMarketStatus();

        // Update market status every second (for countdown with seconds)
        setInterval(updateMarketStatus, 1000);

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
                const tape = document.getElementById('ticker-tape');
                tape.innerHTML = '<span class="ticker-empty">Stock data loading...</span>';
                tape.classList.remove('has-data');
            });
    }

    function renderTicker(quotes) {
        const tape = document.getElementById('ticker-tape');
        if (!quotes || Object.keys(quotes).length === 0) {
            // Static placeholder for empty state - no scrolling
            tape.innerHTML = '<span class="ticker-empty">No stock data available</span>';
            tape.classList.remove('has-data');
            return;
        }

        let html = '';
        // Show top 15 stocks by market cap
        const sorted = Object.values(quotes)
            .filter(q => q.marketCap)
            .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
            .slice(0, 15);

        // Generate ticker items once
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
