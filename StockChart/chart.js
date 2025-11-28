// Global state
let chartInstance = null;
let tickers = [];
let currentRange = '1y';
let showLegend = true;
let showGrid = true;
let historicalCache = new Map();
let customCache = {};

const MAX_TICKERS = 10;
const DEFAULT_STOCKS = ['MCD', 'YUM', 'QSR', 'WEN', 'DPZ', 'JACK', 'WING', 'SHAK', 'DENN', 'DIN'];
const DEFAULT_COLORS = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
    '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#84CC16'
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
    for (const symbol of symbols) {
        try {
            const data = await fetchAdjustedPrices(symbol, currentRange);
            if (data && data.length) {
                tickers.push({
                    symbol,
                    color: DEFAULT_COLORS[tickers.length % DEFAULT_COLORS.length],
                    lineWidth: 2,
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

    for (const symbol of DEFAULT_STOCKS) {
        try {
            const data = await fetchAdjustedPrices(symbol, currentRange);

            if (!data || data.length === 0) {
                console.warn(`No data available for ${symbol}`);
                continue;
            }

            const tickerObj = {
                symbol: symbol,
                color: DEFAULT_COLORS[tickers.length % DEFAULT_COLORS.length],
                lineWidth: 2,
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
                                label += '$' + context.parsed.y.toFixed(2);
                            }

                            if (firstPoint && currentPoint) {
                                const delta = currentPoint.price - firstPoint.price;
                                const pct = (delta / firstPoint.price) * 100;
                                label += ` (${delta >= 0 ? '+' : ''}${delta.toFixed(2)}, ${pct.toFixed(2)}%)`;
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
                        text: 'Price (USD)',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(2);
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
        <div class="ticker-item">
            <div class="ticker-info">
                <input type="color"
                       class="color-picker"
                       value="${ticker.color}"
                       onchange="updateTickerColor('${ticker.symbol}', this.value)"
                       title="Change line color">
                <span class="ticker-symbol">${ticker.symbol}</span>
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

    const datasets = tickers.map(ticker => ({
        label: ticker.symbol,
        data: ticker.data.map(d => ({
            x: d.date,
            y: d.price
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
    }));

    chartInstance.data.datasets = datasets;
    chartInstance.update('none');
    chartInstance.resetZoom();

    // Update supporting UI
    await updateStockTable();
    updateEmbedSnippet();
}

// Update the stock data table
async function updateStockTable() {
    const tableContainer = document.getElementById('stockTableContainer');
    const tableBody = document.getElementById('stock-table-body');
    const tableHead = document.getElementById('stock-table-head');

    if (!tableBody || !tableHead) return;

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

    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `<th>Date</th>${symbols.map(s => `<th>${s}</th>`).join('')}`;
    tableHead.appendChild(headerRow);

    dates.forEach(dateStr => {
        const row = document.createElement('tr');
        const cells = [`<td>${dateStr}</td>`];

        symbols.forEach(symbol => {
            const point = (seriesBySymbol[symbol] || []).find(p => p.date.toISOString().startsWith(dateStr));
            cells.push(`<td>${point ? `$${point.price.toFixed(2)}` : '–'}</td>`);
        });

        row.innerHTML = cells.join('');
        tableBody.appendChild(row);
    });
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
            // Last trading day
            return data.slice(-1);
        case '5d':
            // Last 5 trading days (approximately 1 week)
            return data.slice(-5);
        case '1mo':
            // Last ~30 days
            cutoffDate = new Date(now);
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            break;
        case '6mo':
            // Last ~180 days
            cutoffDate = new Date(now);
            cutoffDate.setDate(cutoffDate.getDate() - 180);
            break;
        case 'ytd':
            // Year to date
            cutoffDate = startOfYear;
            break;
        case '1y':
            // Last 365 days
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);
            break;
        case '2y':
            // Last 2 years
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 2);
            break;
        case '5y':
            // Last 5 years
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 5);
            break;
        case '10y':
            // Last 10 years
            cutoffDate = new Date(now);
            cutoffDate.setFullYear(cutoffDate.getFullYear() - 10);
            break;
        case 'max':
        default:
            // Return all data
            return data;
    }

    // Filter data after cutoff date
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
    embed.value = `<iframe src="${src}" width="100%" height="640" frameborder="0" style="border:none;"></iframe>`;
}

// Make functions available globally for inline event handlers
window.removeTicker = removeTicker;
window.updateTickerColor = updateTickerColor;
window.updateTickerWidth = updateTickerWidth;
