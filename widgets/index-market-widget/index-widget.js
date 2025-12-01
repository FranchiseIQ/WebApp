/**
 * Index Market Widget - S&P 500 Chart
 * Uses Lightweight-Charts (TradingView OSS) and Stooq for data
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        symbol: '^SPX',
        symbolName: 'S&P 500',
        corsProxy: 'https://api.allorigins.win/raw?url=',
        stooqBaseUrl: 'https://stooq.com/q/d/l/',
        defaultRange: '1Y',
        chartColors: {
            upColor: '#22c55e',
            downColor: '#ef4444',
            lineColor: '#6366f1',
            volumeUp: 'rgba(34, 197, 94, 0.3)',
            volumeDown: 'rgba(239, 68, 68, 0.3)',
            gridColor: 'rgba(255, 255, 255, 0.05)',
            textColor: '#94a3b8',
            backgroundColor: '#1e293b'
        }
    };

    // State
    let chart = null;
    let mainSeries = null;
    let volumeSeries = null;
    let currentChartType = 'line';
    let currentRange = CONFIG.defaultRange;
    let cachedData = {};

    // DOM Elements
    const elements = {
        chartContainer: null,
        currentPrice: null,
        priceChange: null,
        tooltip: null,
        loadingOverlay: null,
        errorMessage: null
    };

    // Time range configurations
    const TIME_RANGES = {
        '1D': { days: 1, interval: 'd' },
        '5D': { days: 5, interval: 'd' },
        '1M': { days: 30, interval: 'd' },
        '6M': { days: 180, interval: 'd' },
        'YTD': { days: 'ytd', interval: 'd' },
        '1Y': { days: 365, interval: 'd' },
        '5Y': { days: 1825, interval: 'w' },
        'MAX': { days: 3650, interval: 'w' }
    };

    /**
     * Initialize the widget
     */
    function init() {
        cacheElements();
        initChart();
        setupEventListeners();
        loadData(currentRange);
    }

    /**
     * Cache DOM elements
     */
    function cacheElements() {
        elements.chartContainer = document.getElementById('chart-container');
        elements.currentPrice = document.getElementById('current-price');
        elements.priceChange = document.getElementById('price-change');
        elements.tooltip = document.getElementById('chart-tooltip');
        elements.loadingOverlay = document.getElementById('loading-overlay');
        elements.errorMessage = document.getElementById('error-message');
    }

    /**
     * Initialize Lightweight Charts
     */
    function initChart() {
        if (!elements.chartContainer) return;

        chart = LightweightCharts.createChart(elements.chartContainer, {
            layout: {
                background: { type: 'solid', color: CONFIG.chartColors.backgroundColor },
                textColor: CONFIG.chartColors.textColor
            },
            grid: {
                vertLines: { color: CONFIG.chartColors.gridColor },
                horzLines: { color: CONFIG.chartColors.gridColor }
            },
            crosshair: {
                mode: LightweightCharts.CrosshairMode.Normal,
                vertLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: LightweightCharts.LineStyle.Dashed,
                    labelBackgroundColor: '#6366f1'
                },
                horzLine: {
                    color: 'rgba(255, 255, 255, 0.2)',
                    width: 1,
                    style: LightweightCharts.LineStyle.Dashed,
                    labelBackgroundColor: '#6366f1'
                }
            },
            rightPriceScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)'
            },
            timeScale: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                timeVisible: true,
                secondsVisible: false
            },
            handleScroll: true,
            handleScale: true
        });

        // Create volume series first (behind price)
        volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
            scaleMargins: { top: 0.85, bottom: 0 }
        });

        // Create main price series
        createMainSeries();

        // Auto-resize
        const resizeObserver = new ResizeObserver(() => {
            if (chart && elements.chartContainer) {
                chart.applyOptions({
                    width: elements.chartContainer.clientWidth,
                    height: elements.chartContainer.clientHeight
                });
            }
        });
        resizeObserver.observe(elements.chartContainer);

        // Subscribe to crosshair move for tooltip
        chart.subscribeCrosshairMove(handleCrosshairMove);
    }

    /**
     * Create or recreate the main price series
     */
    function createMainSeries() {
        if (mainSeries) {
            chart.removeSeries(mainSeries);
        }

        if (currentChartType === 'candlestick') {
            mainSeries = chart.addCandlestickSeries({
                upColor: CONFIG.chartColors.upColor,
                downColor: CONFIG.chartColors.downColor,
                borderUpColor: CONFIG.chartColors.upColor,
                borderDownColor: CONFIG.chartColors.downColor,
                wickUpColor: CONFIG.chartColors.upColor,
                wickDownColor: CONFIG.chartColors.downColor
            });
        } else {
            mainSeries = chart.addLineSeries({
                color: CONFIG.chartColors.lineColor,
                lineWidth: 2,
                crosshairMarkerVisible: true,
                crosshairMarkerRadius: 4
            });
        }
    }

    /**
     * Setup event listeners
     */
    function setupEventListeners() {
        // Time range buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const range = btn.dataset.range;
                if (range !== currentRange) {
                    setActiveTimeButton(btn);
                    currentRange = range;
                    loadData(range);
                }
            });
        });

        // Chart type buttons
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                if (type !== currentChartType) {
                    setActiveChartTypeButton(btn);
                    currentChartType = type;
                    createMainSeries();
                    // Re-apply cached data if available
                    if (cachedData[currentRange]) {
                        applyDataToChart(cachedData[currentRange]);
                    }
                }
            });
        });
    }

    /**
     * Set active time button
     */
    function setActiveTimeButton(activeBtn) {
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    /**
     * Set active chart type button
     */
    function setActiveChartTypeButton(activeBtn) {
        document.querySelectorAll('.chart-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    }

    /**
     * Load data from Stooq
     */
    async function loadData(range) {
        showLoading(true);
        hideError();

        // Check cache first
        if (cachedData[range]) {
            applyDataToChart(cachedData[range]);
            showLoading(false);
            return;
        }

        try {
            const rangeConfig = TIME_RANGES[range];
            const { startDate, endDate } = getDateRange(rangeConfig);

            const url = buildStooqUrl(startDate, endDate, rangeConfig.interval);
            const proxyUrl = CONFIG.corsProxy + encodeURIComponent(url);

            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch data');

            const csvText = await response.text();
            const data = parseStooqCSV(csvText);

            if (data.length === 0) {
                throw new Error('No data available');
            }

            // Cache the data
            cachedData[range] = data;

            applyDataToChart(data);
            showLoading(false);
        } catch (error) {
            console.error('Error loading data:', error);
            showError('Failed to load market data. Please try again.');
            showLoading(false);
        }
    }

    /**
     * Build Stooq URL
     */
    function buildStooqUrl(startDate, endDate, interval) {
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}${month}${day}`;
        };

        return `${CONFIG.stooqBaseUrl}?s=${CONFIG.symbol}&d1=${formatDate(startDate)}&d2=${formatDate(endDate)}&i=${interval}`;
    }

    /**
     * Get date range based on configuration
     */
    function getDateRange(config) {
        const endDate = new Date();
        let startDate;

        if (config.days === 'ytd') {
            startDate = new Date(endDate.getFullYear(), 0, 1);
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - config.days);
        }

        return { startDate, endDate };
    }

    /**
     * Parse Stooq CSV data
     */
    function parseStooqCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return [];

        // Skip header row
        const dataLines = lines.slice(1);
        const data = [];

        for (const line of dataLines) {
            const parts = line.split(',');
            if (parts.length < 6) continue;

            const [dateStr, open, high, low, close, volume] = parts;

            // Parse date (YYYY-MM-DD format from Stooq)
            const date = dateStr.trim();
            const timestamp = new Date(date).getTime() / 1000;

            if (isNaN(timestamp)) continue;

            data.push({
                time: date,
                open: parseFloat(open),
                high: parseFloat(high),
                low: parseFloat(low),
                close: parseFloat(close),
                volume: parseFloat(volume) || 0
            });
        }

        // Sort by date ascending
        data.sort((a, b) => new Date(a.time) - new Date(b.time));

        return data;
    }

    /**
     * Apply data to chart
     */
    function applyDataToChart(data) {
        if (!data || data.length === 0) return;

        // Format data for the chart type
        if (currentChartType === 'candlestick') {
            mainSeries.setData(data.map(d => ({
                time: d.time,
                open: d.open,
                high: d.high,
                low: d.low,
                close: d.close
            })));
        } else {
            mainSeries.setData(data.map(d => ({
                time: d.time,
                value: d.close
            })));
        }

        // Apply volume data
        volumeSeries.setData(data.map(d => ({
            time: d.time,
            value: d.volume,
            color: d.close >= d.open ? CONFIG.chartColors.volumeUp : CONFIG.chartColors.volumeDown
        })));

        // Update price display
        const latest = data[data.length - 1];
        const previous = data.length > 1 ? data[data.length - 2] : latest;
        updatePriceDisplay(latest.close, previous.close);

        // Fit content
        chart.timeScale().fitContent();
    }

    /**
     * Update price display
     */
    function updatePriceDisplay(currentPrice, previousPrice) {
        if (!elements.currentPrice || !elements.priceChange) return;

        elements.currentPrice.textContent = formatPrice(currentPrice);

        const change = currentPrice - previousPrice;
        const changePercent = ((change / previousPrice) * 100);
        const sign = change >= 0 ? '+' : '';

        elements.priceChange.textContent = `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
        elements.priceChange.className = 'price-change ' + (change >= 0 ? 'positive' : 'negative');
    }

    /**
     * Handle crosshair move for tooltip
     */
    function handleCrosshairMove(param) {
        if (!elements.tooltip) return;

        if (param.time && param.seriesData.size > 0) {
            const data = param.seriesData.get(mainSeries);
            if (!data) {
                elements.tooltip.classList.remove('visible');
                return;
            }

            let tooltipContent = `<div class="tooltip-date">${formatDate(param.time)}</div>`;

            if (currentChartType === 'candlestick' && data.open !== undefined) {
                tooltipContent += `
                    <div class="tooltip-price">$${data.close.toFixed(2)}</div>
                    <div class="tooltip-ohlc">
                        <span>O:</span><span>$${data.open.toFixed(2)}</span>
                        <span>H:</span><span>$${data.high.toFixed(2)}</span>
                        <span>L:</span><span>$${data.low.toFixed(2)}</span>
                        <span>C:</span><span>$${data.close.toFixed(2)}</span>
                    </div>
                `;
            } else {
                const value = data.value !== undefined ? data.value : data.close;
                tooltipContent += `<div class="tooltip-price">$${value.toFixed(2)}</div>`;
            }

            elements.tooltip.innerHTML = tooltipContent;
            elements.tooltip.classList.add('visible');
        } else {
            elements.tooltip.classList.remove('visible');
        }
    }

    /**
     * Format price
     */
    function formatPrice(price) {
        return '$' + price.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    /**
     * Format date
     */
    function formatDate(time) {
        if (typeof time === 'string') {
            return new Date(time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        }
        return new Date(time * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    /**
     * Show/hide loading overlay
     */
    function showLoading(show) {
        if (elements.loadingOverlay) {
            elements.loadingOverlay.classList.toggle('hidden', !show);
        }
    }

    /**
     * Show error message
     */
    function showError(message) {
        if (elements.errorMessage) {
            elements.errorMessage.textContent = message;
            elements.errorMessage.classList.add('visible');
        }
    }

    /**
     * Hide error message
     */
    function hideError() {
        if (elements.errorMessage) {
            elements.errorMessage.classList.remove('visible');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
