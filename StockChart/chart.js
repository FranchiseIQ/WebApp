// Global state
let chartInstance = null;
let tickers = [];
let currentRange = '1y';
let showLegend = true;
let showGrid = true;
let priceMode = 'percent'; // 'percent' or 'dollar' - default to percent
let historicalCache = new Map();
let customCache = {};

const MAX_TICKERS = 10;
// Default stocks: SPY (market index) + 9 top franchise stocks
// IMPORTANT: Available tickers come from data/franchise_stocks.csv (centralized dataset)
// To add new tickers to the system, update scripts/update_franchise_stocks.py
const DEFAULT_STOCKS = [
    'SPY',    // Market benchmark (black)
    'MCD', 'YUM', 'QSR', 'WEN', 'DPZ', 'JACK', 'WING', 'SHAK', 'DENN'  // Top franchise stocks
];
const DEFAULT_COLORS = [
    '#000000', // SPY in black (market index)
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4'
];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Detect if in iframe and apply iframe mode
    if (window.self !== window.top) {
        document.documentElement.classList.add('iframe-mode');
    }

    initializeApp();
});

function initializeApp() {
    try {
        customCache = JSON.parse(localStorage.getItem('franresearch_chart_cache')) || {};
    } catch (e) {
        customCache = {};
    }

    setupEventListeners();
    initializeChart();

    // Check for symbol in URL parameter (e.g., ?symbol=MCD)
    const urlParams = new URLSearchParams(window.location.search);
    const symbolParam = urlParams.get('symbol');
    const symbolsParam = urlParams.get('symbols');

    if (symbolsParam) {
        const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase()).filter(Boolean).slice(0, MAX_TICKERS);
        loadPresetSymbols(symbols);
    } else if (symbolParam) {
        console.log(`Loading chart for ${symbolParam} from URL parameter`);
        document.getElementById('tickerInput').value = symbolParam;
        addTicker();
    } else {
        loadDefaultStocks();
    }
}

async function loadPresetSymbols(symbols) {
    showLoading(true);
    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        try {
            const data = await fetchAdjustedPrices(symbol, currentRange);
            if (data && data.length) {
                tickers.push({
                    symbol,
                    color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                    lineWidth: symbol === 'SPY' ? 3 : 2,
                    data
                });
            }
        } catch (err) {
            console.warn(`Skipping ${symbol}:`, err);
        }
    }
    showLoading(false);
    if (tickers.length) {
        renderTickerList();
        updateChart();
        hideEmptyState();
    } else {
        showEmptyState();
    }
}

// Load 10 default franchise stocks
async function loadDefaultStocks() {
    showLoading(true);

    for (let i = 0; i < DEFAULT_STOCKS.length; i++) {
        const symbol = DEFAULT_STOCKS[i];
        try {
            let data = null;

            // Special handling for SPY - try multiple approaches
            if (symbol === 'SPY') {
                data = await loadSPYData(currentRange);
            } else {
                data = await fetchAdjustedPrices(symbol, currentRange);
            }

            if (!data || data.length === 0) {
                console.warn(`No data available for ${symbol}`);
                continue;
            }

            const tickerObj = {
                symbol: symbol,
                color: DEFAULT_COLORS[i],
                lineWidth: symbol === 'SPY' ? 3 : 2, // SPY thicker as market reference
                data: data
            };

            tickers.push(tickerObj);
        } catch (error) {
            console.error(`Error loading ${symbol}:`, error);
        }
    }

    showLoading(false);

    if (tickers.length > 0) {
        renderTickerList();
        updateChart();
        hideEmptyState();
    } else {
        showEmptyState();
    }
}

/**
 * Load SPY data with multiple fallback strategies
 */
async function loadSPYData(range) {
    try {
        // First try: load from local cache/CSV
        const cachedSeries = await getLocalSeries('SPY');
        if (cachedSeries && cachedSeries.length) {
            return filterDataByRange(cachedSeries, range);
        }
    } catch (e) {
        console.debug('SPY not in local CSV, trying Stooq...');
    }

    try {
        // Second try: fetch from Stooq with increased timeout
        const remoteSeries = await Promise.race([
            fetchFromStooq('SPY'),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Stooq fetch timeout')), 8000)
            )
        ]);

        if (remoteSeries && remoteSeries.length) {
            saveCustomSeries('SPY', remoteSeries);
            return filterDataByRange(remoteSeries, range);
        }
    } catch (e) {
        console.warn('Failed to fetch SPY from Stooq:', e.message);
    }

    try {
        // Third try: Alternative source - Yahoo Finance via different method
        const spyData = await fetchSPYFromYahoo();
        if (spyData && spyData.length) {
            saveCustomSeries('SPY', spyData);
            return filterDataByRange(spyData, range);
        }
    } catch (e) {
        console.warn('Failed to fetch SPY from Yahoo Finance:', e.message);
    }

    // If all else fails, return null (SPY will be skipped)
    throw new Error('Unable to load SPY data from any source');
}

/**
 * Alternative SPY data fetch using Yahoo Finance API
 */
async function fetchSPYFromYahoo() {
    try {
        // Use a different CORS proxy approach for Yahoo Finance
        const url = 'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=10y';
        const response = await Promise.race([
            fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Fetch timeout')), 5000)
            )
        ]);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!data.chart || !data.chart.result || !data.chart.result[0]) {
            throw new Error('Invalid Yahoo Finance response');
        }

        const result = data.chart.result[0];
        const timestamps = result.timestamp || [];
        const quotes = result.indicators.quote[0] || {};
        const allData = [];

        for (let i = 0; i < timestamps.length; i++) {
            const date = new Date(timestamps[i] * 1000);
            const close = quotes.close?.[i];
            const open = quotes.open?.[i];
            const high = quotes.high?.[i];
            const low = quotes.low?.[i];
            const volume = quotes.volume?.[i];

            if (close !== undefined && close !== null && !isNaN(close)) {
                allData.push({
                    date: date,
                    price: parseFloat(close),
                    open: open ? parseFloat(open) : null,
                    high: high ? parseFloat(high) : null,
                    low: low ? parseFloat(low) : null,
                    volume: volume ? parseInt(volume) : null
                });
            }
        }

        allData.sort((a, b) => a.date - b.date);
        return allData.length > 0 ? allData : null;
    } catch (error) {
        throw error;
    }
}

function setupEventListeners() {
    // Add ticker
    document.getElementById('addTickerBtn').addEventListener('click', addTicker);
    document.getElementById('tickerInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTicker();
    });

    // Time range buttons
    document.querySelectorAll('.time-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentRange = btn.dataset.range;
            refreshChart();
        });
    });

    // Chart controls
    document.getElementById('resetZoomBtn').addEventListener('click', resetZoom);
    document.getElementById('toggleLegendBtn').addEventListener('click', toggleLegend);
    document.getElementById('showGridLines').addEventListener('change', toggleGridLines);

    // Price mode toggle
    const togglePriceBtn = document.getElementById('togglePriceMode');
    if (togglePriceBtn) {
        togglePriceBtn.addEventListener('click', () => {
            priceMode = priceMode === 'percent' ? 'dollar' : 'percent';
            togglePriceBtn.textContent = priceMode === 'percent' ? 'Show $ Prices' : 'Show % Change';
            updateChart();
        });
    }

    // Help modal
    document.getElementById('helpBtn').addEventListener('click', () => {
        document.getElementById('helpModal').style.display = 'block';
    });
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('helpModal').style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('helpModal');
        if (e.target === modal) modal.style.display = 'none';
    });
}

function initializeChart() {
    const ctx = document.getElementById('stockChart').getContext('2d');

    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: []
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        weight: 'bold'
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            const dataset = context.dataset;
                            const firstPoint = dataset.rawData?.[0];
                            const currentPoint = dataset.rawData?.[context.dataIndex];

                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += priceMode === 'percent'
                                    ? `${context.parsed.y.toFixed(2)}%`
                                    : '$' + context.parsed.y.toFixed(2);
                            }

                            if (firstPoint && currentPoint) {
                                const delta = currentPoint.price - firstPoint.price;
                                const pct = (delta / firstPoint.price) * 100;
                                label += ` (${delta >= 0 ? '+' : ''}$${delta.toFixed(2)}, ${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%)`;
                            }

                            return label;
                        },
                        afterLabel: function(context) {
                            const dataset = context.dataset;
                            if (dataset.rawData && dataset.rawData[context.dataIndex]) {
                                const point = dataset.rawData[context.dataIndex];
                                return [
                                    `Open: $${point.open?.toFixed(2) || 'N/A'}`,
                                    `High: $${point.high?.toFixed(2) || 'N/A'}`,
                                    `Low: $${point.low?.toFixed(2) || 'N/A'}`,
                                    `Volume: ${formatVolume(point.volume)}`
                                ];
                            }
                            return '';
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: true,
                            speed: 0.1
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: true,
                        mode: 'x',
                    },
                    limits: {
                        x: {min: 'original', max: 'original'},
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM d',
                            week: 'MMM d',
                            month: 'MMM yyyy',
                            year: 'yyyy'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Date',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: priceMode === 'percent' ? '% Change from Start' : 'Price (USD)',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return priceMode === 'percent' ? `${value.toFixed(1)}%` : '$' + value.toFixed(2);
                        }
                    },
                    grid: {
                        display: true,
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                }
            }
        }
    });
}

async function addTicker() {
    const input = document.getElementById('tickerInput');
    const ticker = input.value.trim().toUpperCase();

    if (!ticker) {
        showError('Please enter a ticker symbol');
        return;
    }

    if (tickers.length >= MAX_TICKERS) {
        showError(`Maximum ${MAX_TICKERS} tickers allowed`);
        return;
    }

    if (tickers.find(t => t.symbol === ticker)) {
        showError(`${ticker} is already added`);
        return;
    }

    // Show loading
    showLoading(true);

    try {
        // Fetch data to validate ticker
        const data = await fetchAdjustedPrices(ticker, currentRange);

        if (!data || data.length === 0) {
            throw new Error('No data available');
        }

        // Add ticker to list
        const tickerObj = {
            symbol: ticker,
            color: DEFAULT_COLORS[tickers.length % DEFAULT_COLORS.length],
            lineWidth: 2,
            data: data
        };

        tickers.push(tickerObj);
        input.value = '';

        renderTickerList();
        updateChart();
        hideEmptyState();

    } catch (error) {
        console.error('Error adding ticker:', error);
        showError(`Failed to load data for ${ticker}. Please check the ticker symbol.`);
    } finally {
        showLoading(false);
    }
}

function removeTicker(symbol) {
    tickers = tickers.filter(t => t.symbol !== symbol);
    renderTickerList();

    if (tickers.length === 0) {
        showEmptyState();
        chartInstance.data.datasets = [];
        chartInstance.update();
    } else {
        updateChart();
    }
}

function renderTickerList() {
    const container = document.getElementById('tickerList');

    if (tickers.length === 0) {
        container.innerHTML = '<p class="no-tickers">No tickers added yet</p>';
        return;
    }

    container.innerHTML = tickers.map(ticker => `
        <div class="ticker-item" style="border-left: 4px solid ${ticker.color};">
            <div class="ticker-info">
                <input type="color"
                       class="color-picker"
                       value="${ticker.color}"
                       onchange="updateTickerColor('${ticker.symbol}', this.value)"
                       title="Change line color">
                <span class="ticker-symbol">${ticker.symbol}</span>
                ${ticker.symbol === 'SPY' ? '<span style="font-size: 10px; color: #666; margin-left: 5px;">(Market)</span>' : ''}
            </div>
            <div class="ticker-controls">
                <label class="width-control">
                    <span>Width:</span>
                    <input type="range"
                           min="1"
                           max="5"
                           value="${ticker.lineWidth}"
                           data-symbol="${ticker.symbol}"
                           oninput="updateTickerWidth('${ticker.symbol}', this.value)"
                           class="width-slider">
                    <span class="width-value">${ticker.lineWidth}px</span>
                </label>
                <button class="btn-remove" onclick="removeTicker('${ticker.symbol}')" title="Remove ticker">✕</button>
            </div>
        </div>
    `).join('');
}

function updateTickerColor(symbol, color) {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (ticker) {
        ticker.color = color;
        updateChart();
    }
}

function updateTickerWidth(symbol, width) {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (ticker) {
        ticker.lineWidth = parseInt(width);
        // Update display
        const slider = document.querySelector(`.width-slider[data-symbol="${symbol}"]`);
        if (slider) {
            const widthValue = slider.parentElement.querySelector('.width-value');
            if (widthValue) widthValue.textContent = width + 'px';
        }
        updateChart();
    }
}

async function refreshChart() {
    if (tickers.length === 0) return;

    showLoading(true);

    try {
        // Fetch new data for all tickers
        const promises = tickers.map(async ticker => {
            const data = await fetchAdjustedPrices(ticker.symbol, currentRange);
            ticker.data = data;
        });

        await Promise.all(promises);
        updateChart();
    } catch (error) {
        console.error('Error refreshing chart:', error);
        showError('Failed to refresh chart data');
    } finally {
        showLoading(false);
    }
}

async function updateChart() {
    if (!chartInstance || tickers.length === 0) return;

    const datasets = tickers.map(ticker => {
        const basePrice = ticker.data?.[0]?.price || 1;
        return {
            label: ticker.symbol,
            data: ticker.data.map(d => ({
                x: d.date,
                y: priceMode === 'percent'
                    ? ((d.price - basePrice) / basePrice) * 100
                    : d.price
            })),
            rawData: ticker.data,
            borderColor: ticker.color,
            backgroundColor: ticker.color + '20',
            borderWidth: ticker.lineWidth,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: ticker.color,
            pointHoverBorderColor: '#fff',
            pointHoverBorderWidth: 2
        };
    });

    chartInstance.data.datasets = datasets;
    chartInstance.options.scales.y.title.text = priceMode === 'percent' ? '% Change from Start' : 'Price (USD)';
    chartInstance.options.scales.y.ticks.callback = function(value) {
        return priceMode === 'percent' ? `${value.toFixed(1)}%` : '$' + value.toFixed(2);
    };

    chartInstance.update('none');
    chartInstance.resetZoom();

    // Update supporting UI
    await updateStockTable();
    updateEmbedSnippet();
}

// Update the stock data table with historical prices and daily percent changes
async function updateStockTable() {
    const tableContainer = document.getElementById('stockTableContainer');
    const tableBody = document.getElementById('stock-table-body');
    const tableHead = document.getElementById('stock-table-head');

    if (!tableBody || !tableHead || !tableContainer) return;

    if (tickers.length === 0) {
        tableContainer.style.display = 'none';
        return;
    }

    tableContainer.style.display = 'block';
    tableBody.innerHTML = '';
    tableHead.innerHTML = '';

    const symbols = tickers.map(t => t.symbol);
    const seriesBySymbol = {};
    const dateSet = new Set();

    for (const symbol of symbols) {
        const series = await getLocalSeries(symbol);
        if (series && series.length) {
            const last30 = series.slice(-30);
            seriesBySymbol[symbol] = last30;
            last30.forEach(point => dateSet.add(point.date.toISOString().split('T')[0]));
        }
    }

    const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a)).slice(0, 30).reverse();

    // Create header row with Price and Change columns for each symbol
    const headerRow = document.createElement('tr');
    let headerHTML = '<th>Date</th>';
    symbols.forEach(s => {
        headerHTML += `<th colspan="2" style="text-align: center; border-left: 2px solid #e0e0e0;">${s}</th>`;
    });
    headerRow.innerHTML = headerHTML;
    tableHead.appendChild(headerRow);

    // Create sub-header for Price/Change
    const subHeaderRow = document.createElement('tr');
    let subHeaderHTML = '<th></th>';
    symbols.forEach(() => {
        subHeaderHTML += `<th style="border-left: 2px solid #e0e0e0;">Price</th><th>Daily %</th>`;
    });
    subHeaderRow.innerHTML = subHeaderHTML;
    tableHead.appendChild(subHeaderRow);

    // Create data rows
    dates.forEach((dateStr, dateIdx) => {
        const row = document.createElement('tr');
        let cellsHTML = `<td style="font-weight: 600;">${formatDateShort(dateStr)}</td>`;

        symbols.forEach(symbol => {
            const series = seriesBySymbol[symbol] || [];
            const point = series.find(p => p.date.toISOString().startsWith(dateStr));
            const prevDateStr = dates[dateIdx - 1];
            const prevPoint = prevDateStr ? series.find(p => p.date.toISOString().startsWith(prevDateStr)) : null;

            let priceStr = '–';
            let changeStr = '–';
            let changeClass = '';

            if (point) {
                priceStr = `$${point.price.toFixed(2)}`;

                if (prevPoint) {
                    const change = ((point.price - prevPoint.price) / prevPoint.price) * 100;
                    changeStr = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
                    changeClass = change >= 0 ? 'positive-change' : 'negative-change';
                }
            }

            cellsHTML += `<td style="border-left: 2px solid #e0e0e0;">${priceStr}</td>`;
            cellsHTML += `<td class="${changeClass}">${changeStr}</td>`;
        });

        row.innerHTML = cellsHTML;
        tableBody.appendChild(row);
    });
}

function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

async function fetchAdjustedPrices(ticker, range) {
    const cachedSeries = await getLocalSeries(ticker);
    if (cachedSeries && cachedSeries.length) {
        return filterDataByRange(cachedSeries, range);
    }

    const remoteSeries = await fetchFromStooq(ticker);

    if (remoteSeries && remoteSeries.length) {
        saveCustomSeries(ticker, remoteSeries);
        return filterDataByRange(remoteSeries, range);
    }

    throw new Error(`No data available for ${ticker}`);
}

async function getLocalSeries(symbol) {
    await loadCsvIntoCache();

    if (historicalCache.has(symbol)) {
        return historicalCache.get(symbol);
    }

    if (customCache[symbol]) {
        return customCache[symbol].map(point => ({
            ...point,
            date: new Date(point.date)
        }));
    }

    return null;
}

async function loadCsvIntoCache() {
    if (historicalCache.size > 0) return;

    const csvUrl = new URL('../data/franchise_stocks.csv', window.location.href).toString();
    const response = await fetch(csvUrl);
    if (!response.ok) {
        console.warn('Failed to preload franchise_stocks.csv:', response.status);
        return;
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return;

    for (let i = 1; i < lines.length; i++) {
        const [dateStr, symbol, open, high, low, close, adjClose, volume] = lines[i].split(',');
        const parsedDate = new Date(dateStr);
        const parsedClose = parseFloat(adjClose || close);
        if (!symbol || isNaN(parsedClose) || isNaN(parsedDate.getTime())) continue;

        const parsedOpen = parseFloat(open);
        const parsedHigh = parseFloat(high);
        const parsedLow = parseFloat(low);
        const parsedVolume = parseInt(volume);

        if (!historicalCache.has(symbol)) {
            historicalCache.set(symbol, []);
        }

        historicalCache.get(symbol).push({
            date: parsedDate,
            price: parsedClose,
            open: isNaN(parsedOpen) ? null : parsedOpen,
            high: isNaN(parsedHigh) ? null : parsedHigh,
            low: isNaN(parsedLow) ? null : parsedLow,
            volume: isNaN(parsedVolume) ? null : parsedVolume
        });
    }

    // Ensure arrays are sorted
    historicalCache.forEach(series => series.sort((a, b) => a.date - b.date));
}

async function fetchFromStooq(ticker) {
    const url = `https://stooq.com/q/d/l/?s=${ticker}.US&i=d`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
        throw new Error('No data in response');
    }

    const dataRows = lines.slice(1);
    const allData = [];
    for (const row of dataRows) {
        const [dateStr, open, high, low, close, volume] = row.split(',');
        if (!dateStr || !close) continue;
        const parsedDate = new Date(dateStr);
        const parsedClose = parseFloat(close);
        const parsedOpen = parseFloat(open);
        const parsedHigh = parseFloat(high);
        const parsedLow = parseFloat(low);
        const parsedVolume = parseInt(volume);

        if (isNaN(parsedClose) || isNaN(parsedDate.getTime())) continue;

        allData.push({
            date: parsedDate,
            price: parsedClose,
            open: isNaN(parsedOpen) ? null : parsedOpen,
            high: isNaN(parsedHigh) ? null : parsedHigh,
            low: isNaN(parsedLow) ? null : parsedLow,
            volume: isNaN(parsedVolume) ? null : parsedVolume
        });
    }

    allData.sort((a, b) => a.date - b.date);
    return allData;
}

function saveCustomSeries(symbol, series) {
    customCache[symbol] = series.map(point => ({
        ...point,
        date: point.date.toISOString()
    }));

    localStorage.setItem('franresearch_chart_cache', JSON.stringify(customCache));
}

function filterDataByRange(data, range) {
    if (!data || data.length === 0) return data;

    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    let cutoffDate;

    switch (range) {
        case '1d':
            return data.slice(-1);
        case '5d':
            return data.slice(-5);
        case '1mo':
            cutoffDate = new Date(now);
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            break;
        case '6mo':
            cutoffDate = new Date(now);
            cutoffDate.setDate(cutoffDate.getDate() - 180);
            break;
        case 'ytd':
            cutoffDate = startOfYear;
            break;
        case '1y':
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
            break;
        case '2y':
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
            break;
        case '5y':
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
            break;
        case '10y':
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
            break;
        case 'max':
        default:
            return data;
    }

    return data.filter(d => d.date >= cutoffDate);
}

function resetZoom() {
    if (chartInstance) {
        chartInstance.resetZoom();
    }
}

function toggleLegend() {
    showLegend = !showLegend;
    if (chartInstance) {
        chartInstance.options.plugins.legend.display = showLegend;
        chartInstance.update();
    }
}

function toggleGridLines() {
    showGrid = document.getElementById('showGridLines').checked;
    if (chartInstance) {
        chartInstance.options.scales.x.grid.display = showGrid;
        chartInstance.options.scales.y.grid.display = showGrid;
        chartInstance.update();
    }
}

function showEmptyState() {
    document.getElementById('emptyState').style.display = 'flex';
    document.querySelector('.chart-container').style.display = 'none';
}

function hideEmptyState() {
    document.getElementById('emptyState').style.display = 'none';
    document.querySelector('.chart-container').style.display = 'block';
}

function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'flex' : 'none';
}

function showError(message) {
    const toast = document.getElementById('errorToast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

function formatVolume(volume) {
    if (!volume) return 'N/A';
    if (volume >= 1e9) return (volume / 1e9).toFixed(2) + 'B';
    if (volume >= 1e6) return (volume / 1e6).toFixed(2) + 'M';
    if (volume >= 1e3) return (volume / 1e3).toFixed(2) + 'K';
    return volume.toString();
}

function updateEmbedSnippet() {
    const embed = document.getElementById('embedCode');
    if (!embed) return;
    const symbolsParam = tickers.length ? `?symbols=${tickers.map(t => t.symbol).join(',')}` : '';
    const src = `https://monroegamble.github.io/WebApp/StockChart/chart.html${symbolsParam}`;
    embed.value = `<iframe src="${src}" width="100%" height="900" frameborder="0" style="border:none;"></iframe>`;
}

// Make functions available globally for inline event handlers
window.removeTicker = removeTicker;
window.updateTickerColor = updateTickerColor;
window.updateTickerWidth = updateTickerWidth;
