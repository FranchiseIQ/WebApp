document.addEventListener('DOMContentLoaded', () => {
    // --- Config ---
    // Roark brands are now loaded dynamically from manifest with is_roark field
    const RADIUS_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

    // Legacy category map - kept for backward compatibility, but categories are now loaded from brand_metadata.json
    // This will be overridden by brandMetadata categories once loaded
    const CATEGORY_MAP = {
        'qsr': [],
        'casual': [],
        'hotels': [],
        'fitness': [],
        'services': [],
        'other': []
    };

    // Score tier configurations
    const SCORE_TIERS = {
        excellent: { min: 80, color: '#22c55e', label: 'Excellent' },
        good: { min: 65, color: '#84cc16', label: 'Good' },
        fair: { min: 50, color: '#eab308', label: 'Fair' },
        poor: { min: 0, color: '#ef4444', label: 'Poor' }
    };

    // --- State ---
    let map, clusterGroup, clusterLayer, individualLayer, markersLayer = L.layerGroup(), buildingsLayer, heatLayer;
    let allLocations = [], loadedTickers = new Set(), activeTickers = new Set();
    let isClusterView = true, isHeatmapView = false, currentRadiusCircle;
    let manifest = [];
    let tickerColors = {};
    let highlightedMarkers = [];
    let colorIndex = 0;
    let comparisonLocations = [];
    let scoreFilter = { min: 0, max: 100 };
    let proximityIndex = new ProximityIndex(0.02); // Grid-based spatial index
    let highPerformersOpen = false; // Track high performers panel state
    let competitorAnalysisOpen = false; // Track competitor analysis panel state
    let currentZoom = 4; // Track current zoom level for sizing

    // --- Viewport Metrics Tracking ---
    let prevViewportMetrics = {
        highPerformersCount: 0,
        competitorCount: 0,
        activeBrandsCount: 0
    };
    let viewportMetricsDebounceTimer = null;

    // --- Ownership Model Filter State ---
    let brandMetadata = null;  // Loaded from brand_metadata.json
    let ownershipModel = new Set(['franchise', 'non-franchise']);  // Show both by default
    let subtypes = new Set(['licensed', 'corporate', 'independent', 'unknown']);  // Show all by default

    // --- Data Refresh Status Tracking ---
    let dataLastUpdated = null;  // Track when location data was last loaded
    let manifestLastUpdated = null;  // Track when manifest was last loaded

    // --- Notification System (Toast Messages) ---
    const NotificationManager = {
        queue: [],
        show(message, type = 'info', duration = 3000) {
            const toastContainer = document.getElementById('toast-container') || this.createContainer();
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            toast.textContent = message;
            toastContainer.appendChild(toast);

            setTimeout(() => toast.classList.add('show'), 10);

            if (duration > 0) {
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, duration);
            }
            return toast;
        },
        success(message, duration = 2500) { return this.show(message, 'success', duration); },
        error(message, duration = 4000) { return this.show(message, 'error', duration); },
        info(message, duration = 3000) { return this.show(message, 'info', duration); },
        loading(message) { return this.show(message, 'loading', 0); },
        createContainer() {
            const container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
            return container;
        }
    };

    // Toast Styles (injected into head)
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            #toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 400px;
                pointer-events: none;
            }
            .toast {
                padding: 12px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: auto;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease forwards;
            }
            .toast.show { opacity: 1; }
            .toast-success { background: #10b981; color: white; }
            .toast-error { background: #ef4444; color: white; }
            .toast-info { background: #3b82f6; color: white; }
            .toast-loading { background: #8b5cf6; color: white; }
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @media (max-width: 768px) {
                #toast-container {
                    top: 10px;
                    right: 10px;
                    max-width: 90vw;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // --- Reverse Geocoding Cache & Batch System ---
    const GeocodeCache = {
        cache: new Map(),  // Store lat,lng -> address mappings
        queue: [],
        isProcessing: false,
        batchSize: 10,     // Process 10 requests per batch

        async get(lat, lng) {
            const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;

            // Check cache first
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Queue for batch processing
            return new Promise((resolve) => {
                this.queue.push({ lat, lng, key, resolve });
                this.processBatch();
            });
        },

        async processBatch() {
            if (this.isProcessing || this.queue.length === 0) return;

            this.isProcessing = true;
            const batch = this.queue.splice(0, this.batchSize);

            try {
                for (const item of batch) {
                    // Rate limiting: wait 150ms between requests
                    await new Promise(r => setTimeout(r, 150));

                    try {
                        const response = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${item.lat}&lon=${item.lng}`,
                            { signal: AbortSignal.timeout(4000) }
                        );
                        const data = await response.json();

                        let address = 'Address not available';
                        if (data.address) {
                            const addr = data.address;
                            const city = addr.city || addr.town || addr.village || '';
                            const state = addr.state || '';
                            if (city && state) address = `${city}, ${state}`;
                            else if (city) address = city;
                            else if (state) address = state;
                        }

                        this.cache.set(item.key, address);
                        item.resolve(address);
                    } catch (e) {
                        console.warn('Geocoding failed for', item.key, e);
                        const fallback = 'Address unavailable';
                        this.cache.set(item.key, fallback);
                        item.resolve(fallback);
                    }
                }
            } finally {
                this.isProcessing = false;
                if (this.queue.length > 0) {
                    this.processBatch();
                }
            }
        }
    };

    // --- Data Status Manager ---
    const DataStatusManager = {
        init() {
            // Initialize status display in dashboard
            this.createStatusElement();
            this.updateDisplay();
        },
        createStatusElement() {
            // Inject data status info into dashboard (top right area)
            const statusHTML = `
                <div id="data-status-badge" style="
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    font-size: 12px;
                    z-index: 1000;
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.2);
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    transition: all 0.3s ease;
                ">
                    <span id="data-status-indicator" style="
                        width: 8px;
                        height: 8px;
                        background: #10b981;
                        border-radius: 50%;
                        animation: pulse 2s infinite;
                    "></span>
                    <div id="data-status-text" style="display: flex; flex-direction: column; gap: 2px;">
                        <div style="font-weight: 600; font-size: 11px;">Data Loaded</div>
                        <div id="data-status-time" style="font-size: 10px; opacity: 0.9;">Just now</div>
                    </div>
                    <button id="data-refresh-btn" onclick="DataStatusManager.refresh()" style="
                        background: rgba(255,255,255,0.2);
                        border: none;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 11px;
                        font-weight: 600;
                        transition: background 0.2s;
                        margin-left: auto;
                    ">
                        ↻ Refresh
                    </button>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', statusHTML);

            // Add hover effect
            const badge = document.getElementById('data-status-badge');
            badge.addEventListener('mouseenter', () => {
                badge.style.background = 'rgba(59, 130, 246, 1)';
                badge.style.transform = 'translateY(-4px)';
            });
            badge.addEventListener('mouseleave', () => {
                badge.style.background = 'rgba(59, 130, 246, 0.9)';
                badge.style.transform = 'translateY(0)';
            });

            // Add CSS for pulse animation
            if (!document.getElementById('status-animation-styles')) {
                const style = document.createElement('style');
                style.id = 'status-animation-styles';
                style.textContent = `
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    #data-refresh-btn:hover {
                        background: rgba(255,255,255,0.3) !important;
                        transform: rotate(180deg);
                        transition: all 0.3s ease;
                    }
                `;
                document.head.appendChild(style);
            }
        },
        updateDisplay() {
            const timeEl = document.getElementById('data-status-time');
            if (!timeEl || !dataLastUpdated) return;

            const now = new Date();
            const diffMs = now - dataLastUpdated;
            const diffMins = Math.floor(diffMs / 60000);
            const diffHours = Math.floor(diffMins / 60);
            const diffDays = Math.floor(diffHours / 24);

            let timeStr = 'Just now';
            if (diffMins < 1) timeStr = 'Just now';
            else if (diffMins < 60) timeStr = `${diffMins}m ago`;
            else if (diffHours < 24) timeStr = `${diffHours}h ago`;
            else timeStr = `${diffDays}d ago`;

            timeEl.textContent = timeStr;
        },
        setUpdated() {
            dataLastUpdated = new Date();
            this.updateDisplay();
            NotificationManager.success('Data refreshed');
        },
        refresh() {
            NotificationManager.loading('Reloading manifest and brand data...');
            // Clear loaded data
            allLocations = [];
            loadedTickers.clear();
            activeTickers.clear();
            // Reload manifest and reselect all
            loadManifest();
            this.setUpdated();
        }
    };

    // --- Mobile Panel Manager (Phase 3) ---
    const MobilePanelManager = {
        isMobile: () => window.innerWidth <= 768,
        activePanel: null,
        panelStack: [],

        init() {
            // Register all managed panels
            this.registerPanel('location-panel', 'Location Details');
            this.registerPanel('high-performers-panel', 'High Performers');
            this.registerPanel('competitor-analysis-panel', 'Competitor Analysis');
            this.registerPanel('search-panel', 'Search Results');

            // Listen to window resize
            window.addEventListener('resize', () => this.handleResize());

            // Add backdrop click handler
            document.addEventListener('click', (e) => {
                if (e.target.id === 'mobile-panel-backdrop') {
                    this.closeActivePanel();
                }
            });
        },

        registerPanel(panelId, panelName) {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            // Store original close buttons
            const closeBtn = panel.querySelector('.close-location-panel-btn, .close-search-panel-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeActivePanel());
            }
        },

        openPanel(panelId) {
            if (!this.isMobile()) return; // Only manage on mobile

            // Close previous panel if exists
            if (this.activePanel && this.activePanel !== panelId) {
                this.closePanel(this.activePanel);
            }

            const panel = document.getElementById(panelId);
            if (!panel) return;

            // Create backdrop if needed
            let backdrop = document.getElementById('mobile-panel-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'mobile-panel-backdrop';
                backdrop.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0,0,0,0.5);
                    z-index: 2000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                `;
                document.body.appendChild(backdrop);
            }

            // Show backdrop
            setTimeout(() => {
                backdrop.style.opacity = '1';
                backdrop.style.pointerEvents = 'auto';
            }, 10);

            // Configure panel for modal display
            panel.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                width: 100%;
                max-height: 85vh;
                z-index: 2100;
                border-radius: 16px 16px 0 0;
                transform: translateY(0);
                transition: transform 0.3s ease;
                box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
            `;

            panel.classList.remove('hidden');
            this.activePanel = panelId;

            // Show notification for screen readers
            NotificationManager.info(`${document.getElementById(panelId)?.querySelector('.location-panel-title, .search-panel-title')?.textContent || 'Panel'} opened`);
        },

        closePanel(panelId) {
            const panel = document.getElementById(panelId);
            if (!panel) return;

            panel.classList.add('hidden');
            if (this.activePanel === panelId) {
                this.activePanel = null;
            }
        },

        closeActivePanel() {
            if (!this.activePanel) return;

            const backdrop = document.getElementById('mobile-panel-backdrop');
            if (backdrop) {
                backdrop.style.opacity = '0';
                backdrop.style.pointerEvents = 'none';
            }

            const panel = document.getElementById(this.activePanel);
            if (panel) {
                panel.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    panel.classList.add('hidden');
                    panel.style.transform = '';
                }, 300);
            }

            this.activePanel = null;
        },

        handleResize() {
            // On resize to desktop, restore normal panel behavior
            if (!this.isMobile() && this.activePanel) {
                this.closeActivePanel();
                // Restore panels to normal CSS positioning
                document.querySelectorAll('.location-panel, .high-performers-panel, .search-panel').forEach(panel => {
                    panel.style.cssText = '';
                });
            }
        }
    };

    // Predefined unique color palette - 60+ distinct colors
    const COLOR_PALETTE = [
        '#FFC72C', '#00704A', '#D62300', '#E2203D', '#006491', '#FF8732', '#E31837', '#00A94F',
        '#5C2D91', '#1E90FF', '#FFD700', '#C8102E', '#003DA5', '#00A650', '#0072CE', '#B4975A',
        '#002855', '#6B6B6B', '#1C4587', '#0077C8', '#C4A052', '#00A5E3', '#E4002B',
        '#FF6B35', '#2EC4B6', '#9B5DE5', '#F15BB5', '#00BBF9', '#FEE440', '#8338EC', '#FF006E',
        '#3A86FF', '#FB5607', '#FFBE0B', '#8AC926', '#1982C4', '#6A4C93', '#FF595E', '#FFCA3A',
        '#8ECAE6', '#219EBC', '#023047', '#FFB703', '#FB8500', '#264653', '#2A9D8F', '#E9C46A',
        '#F4A261', '#E76F51', '#606C38', '#283618', '#DDA15E', '#BC6C25', '#780000', '#C1121F',
        '#003049', '#D62828', '#F77F00', '#FCBF49', '#EAE2B7', '#14213D', '#FCA311', '#E5E5E5',
        '#000814', '#001D3D', '#003566', '#FFC300', '#FFD60A', '#4CC9F0', '#4361EE', '#3A0CA3',
        '#7209B7', '#B5179E', '#560BAD', '#480CA8', '#3F37C9', '#4895EF', '#4EA8DE', '#48BFE3',
        '#56CFE1', '#64DFDF', '#72EFDD', '#80FFDB', '#FF9F1C', '#2EC4B6', '#CBF3F0', '#FFBF69'
    ];

    // Non-franchise color palette - more muted/distinct from franchise colors
    const NON_FRANCHISE_PALETTE = [
        '#A0522D', '#8B4513', '#704214', '#696969', '#808080', '#778899', '#2F4F4F', '#4B0082',
        '#8B008B', '#DC143C', '#FF1493', '#FF69B4', '#FFB6C1', '#DDA0DD', '#EE82EE', '#BA55D3',
        '#9932CC', '#8A2BE2', '#4169E1', '#1E90FF', '#6495ED', '#87CEEB', '#00BFFF', '#00CED1',
        '#20B2AA', '#3CB371', '#2E8B57', '#228B22', '#556B2F', '#6B8E23', '#9ACD32', '#DAA520'
    ];

    function getColor(ticker) {
        if (tickerColors[ticker]) return tickerColors[ticker];

        // Check if this is a non-franchise brand
        let isNonFranchise = false;
        if (manifest && manifest.length > 0) {
            const brandInfo = manifest.find(item => item.ticker === ticker);
            if (brandInfo && brandInfo.category === 'Non-Franchise') {
                isNonFranchise = true;
            }
        }

        // Use appropriate palette based on brand type
        const palette = isNonFranchise ? NON_FRANCHISE_PALETTE : COLOR_PALETTE;
        const paletteIndex = isNonFranchise ?
            Object.keys(tickerColors).filter(t => {
                const bi = manifest?.find(i => i.ticker === t);
                return bi && bi.category === 'Non-Franchise';
            }).length :
            colorIndex;

        const color = palette[paletteIndex % palette.length];
        tickerColors[ticker] = color;
        if (!isNonFranchise) {
            colorIndex++;
        }
        return color;
    }

    function getScoreTier(score) {
        if (score >= SCORE_TIERS.excellent.min) return SCORE_TIERS.excellent;
        if (score >= SCORE_TIERS.good.min) return SCORE_TIERS.good;
        if (score >= SCORE_TIERS.fair.min) return SCORE_TIERS.fair;
        return SCORE_TIERS.poor;
    }

    // Convert hex color to lighter rgba version for background
    function getLightBackground(hexColor) {
        const colorMap = {
            '#22c55e': 'rgba(34, 197, 94, 0.15)',      // excellent green
            '#84cc16': 'rgba(132, 204, 22, 0.15)',     // good lime
            '#eab308': 'rgba(234, 179, 8, 0.15)',      // fair yellow
            '#ef4444': 'rgba(239, 68, 68, 0.15)'       // poor red
        };
        return colorMap[hexColor] || hexColor;
    }

    // Calculate marker radius based on zoom level and view mode
    function getMarkerRadius(zoom, isIndividual = false) {
        // Visual hierarchy: individual circles are MUCH smaller than clusters
        // Individual: 8-12px (zoom 0-14) - tiny dots, essentially no zoom scaling
        // Clusters: 14-32px (zoom 0-14) - prominent markers, 2.5-3x larger than individual
        // Individual circles should be subtle indicators, not prominent markers

        if (isIndividual) {
            // Individual location circles: tiny dots, minimal scaling with zoom
            const baseRadius = 8;           // 8px at zoom 0 (small but visible)
            const zoomFactor = 0.25;        // +0.25px per zoom level (minimal growth)
            return Math.min(baseRadius + (zoom * zoomFactor), 12);  // Cap at 12px max
        } else {
            // Cluster circles: much larger and more prominent
            const baseRadius = 14;          // 14px at zoom 0 (1.75x individual)
            const zoomFactor = 1.3;         // +1.3px per zoom level (faster growth)
            return baseRadius + (zoom * zoomFactor);
        }
    }

    function initMap() {
        // Base map layers
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        });

        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            maxZoom: 19,
            attribution: 'Tiles © Esri'
        });

        const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
            attribution: '© CartoDB'
        });

        const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenTopoMap contributors'
        });

        map = L.map('map', { zoomControl: false, preferCanvas: true, layers: [street] }).setView([39.82, -98.58], 4);
        currentZoom = map.getZoom();

        // State borders overlay layer
        const stateBorders = L.tileLayer('https://tile.openstreetmap.us/data/boundary/{z}/{x}/{y}.png', {
            maxZoom: 12,
            attribution: '© OpenStreetMap US',
            opacity: 0.5,
            tms: false
        });

        const baseMaps = {
            "Street Map": street,
            "Satellite": satellite,
            "Dark": dark,
            "Topographic": topo
        };

        // Create 3D Buildings layer placeholder
        const dummy3D = L.layerGroup();

        const overlayMaps = {
            "State Borders": stateBorders,
            "3D Buildings": dummy3D
        };

        L.control.layers(baseMaps, overlayMaps, { position: 'bottomright' }).addTo(map);
        L.control.zoom({ position: 'topleft' }).addTo(map);

        // Replace default geocoder with custom implementation
        geocoderControl = L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: "Search city, zip, or address...",
            geocoder: L.Control.Geocoder.nominatim()
        })
        .on('markgeocode', function(e) {
            map.fitBounds(e.geocode.bbox);
        });
        // Don't add to map - we'll use custom panel instead

        // Initialize layers
        // maxClusterRadius: 30 (reduced from 40) ensures clusters break apart earlier as users zoom
        // Combined with smaller individual circles, this improves clarity at all zoom levels
        clusterGroup = L.markerClusterGroup({
            showCoverageOnHover: false,
            maxClusterRadius: 30,
            chunkedLoading: true,
            disableClusteringAtZoom: 16  // Break clusters into individual markers at zoom 16+
        });
        clusterLayer = clusterGroup;
        individualLayer = L.layerGroup();

        // Add clustered layer by default
        map.addLayer(clusterLayer);

        buildingsLayer = new OSMBuildings(map);
        map.on('overlayadd', e => { if(e.layer === dummy3D) loadBuildings(); });
        map.on('overlayremove', e => { if(e.layer === dummy3D) buildingsLayer.data([]); });
        map.on('moveend', () => {
            if(map.hasLayer(dummy3D)) loadBuildings();
            updateVisibleStats();
        });
        map.on('zoomend', function() {
            currentZoom = map.getZoom();
            updateVisibleStats();
            // Refresh marker sizes on zoom
            refreshMarkerSizes();
        });

        setupRail();
        setupFilters();
        setupAdvancedControls();
        initComparisonPanelDragging();

        // Initialize map view (saved view → geolocation → fallback city)
        loadStartView();

        loadBrandMetadata().then(() => {
            loadManifest();
        });
    }

    // Build category map from brand metadata
    function buildCategoryMapFromMetadata() {
        // Reset category map
        Object.keys(CATEGORY_MAP).forEach(cat => CATEGORY_MAP[cat] = []);

        // Populate from brand metadata
        for (const [ticker, brand] of Object.entries(brandMetadata)) {
            const category = brand.category || 'other';
            if (!CATEGORY_MAP[category]) {
                CATEGORY_MAP[category] = [];
            }
            CATEGORY_MAP[category].push(ticker);
        }

        console.log('✓ Built dynamic category map from brand metadata');
    }

    // Load brand metadata (ownership classifications)
    function loadBrandMetadata() {
        return fetch('data/brand_metadata.json')
            .then(res => res.json())
            .then(data => {
                brandMetadata = data.brands;
                buildCategoryMapFromMetadata();
                console.log('✓ Loaded brand metadata for', Object.keys(brandMetadata).length, 'brands');
            })
            .catch(e => {
                console.warn('⚠ Failed to load brand metadata:', e);
                brandMetadata = {};
            });
    }

    function loadManifest() {
        // Try to load augmented manifest with Roark tagging, fall back to original manifest
        fetch('data/brands_manifest.json')
            .then(res => res.json())
            .then(data => {
                manifest = data;
                renderLegend(manifest);
                // Select all locations by default on page load
                selectAll();
                updateDashboardStats();
                // Track when data was loaded
                DataStatusManager.setUpdated();
            })
            .catch(e => {
                // Fallback to original manifest if brands_manifest.json doesn't exist
                console.log("brands_manifest.json not found, loading manifest.json");
                fetch('data/manifest.json')
                    .then(res => res.json())
                    .then(data => {
                        manifest = data;
                        renderLegend(manifest);
                        selectAll();
                        updateDashboardStats();
                        // Track when data was loaded
                        DataStatusManager.setUpdated();
                    })
                    .catch(e2 => {
                        console.log("Data not yet generated. Run GitHub Action.");
                        document.getElementById('brand-legend').innerHTML = '<p style="color:#999;font-size:0.85rem;">No data available. Run the GitHub Action to generate map data.</p>';
                    });
            });
    }

    function renderLegend(manifestData) {
        const container = document.getElementById('brand-legend');
        container.innerHTML = '';

        manifestData.forEach(item => {
            const color = getColor(item.ticker);
            const isRoark = item.is_roark || false;

            // Handle multi-brand companies (like DIN with IHOP, Applebee's, Fuzzy's Taco Shop)
            // Create separate buttons for each brand, but all reference the same ticker
            const brands = item.brands || [item.name || item.ticker];

            brands.forEach(brandName => {
                const btn = document.createElement('button');
                btn.className = 'brand-pill' + (isRoark ? ' roark' : '');
                btn.dataset.ticker = item.ticker;
                btn.dataset.file = item.file;
                btn.dataset.brand = brandName; // Track individual brand name

                // For multi-brand entries like DIN, show the brand name with ticker in parentheses
                const displayName = brands.length > 1
                    ? `${brandName} (${item.ticker})`
                    : brandName;

                btn.innerHTML = `
                    <span class="brand-dot" style="background-color: ${color}"></span>
                    <div class="brand-info">
                        <div class="brand-name">${displayName}</div>
                        <div class="brand-ticker">${item.ticker}</div>
                    </div>
                    <span class="brand-count">${item.count.toLocaleString()}</span>
                `;

                btn.onclick = () => {
                    toggleTicker(item.ticker, item.file);
                    btn.classList.toggle('active');
                };

                container.appendChild(btn);
            });
        });
    }

    // Merge ownership metadata into location objects
    function mergeOwnershipMetadata(locations, ticker) {
        if (!brandMetadata || !brandMetadata[ticker]) {
            // Fallback for unmapped tickers
            return locations.map(loc => ({
                ...loc,
                ownership: 'unknown',
                subtype: 'unknown'
            }));
        }

        const metadata = brandMetadata[ticker];
        return locations.map(loc => ({
            ...loc,
            ownership: metadata.ownership_model,
            subtype: metadata.primary_subtype
        }));
    }

    function toggleTicker(ticker, filePath) {
        if (activeTickers.has(ticker)) {
            activeTickers.delete(ticker);
            scheduleRefreshMap();
        } else {
            activeTickers.add(ticker);
            if (loadedTickers.has(ticker)) {
                scheduleRefreshMap();
            } else {
                // Show loading notification while fetching brand data
                const loadingToast = NotificationManager.loading(`Loading ${ticker}...`);
                fetch(filePath).then(r => r.json()).then(data => {
                    // Merge metadata before adding to allLocations
                    const enhancedData = mergeOwnershipMetadata(data, ticker);
                    allLocations = allLocations.concat(enhancedData);
                    loadedTickers.add(ticker);
                    // Remove loading toast
                    if (loadingToast) loadingToast.remove();
                    NotificationManager.success(`${ticker} loaded`);
                    refreshMap();
                }).catch(e => {
                    if (loadingToast) loadingToast.remove();
                    NotificationManager.error(`Failed to load ${ticker}`);
                    console.error(`Error loading ${ticker}:`, e);
                    activeTickers.delete(ticker);
                });
            }
        }
        updateLocationCount();
        updateDashboardStats();
    }

    function updateScoreDistribution(visibleLocations) {
        /**
         * Update the score distribution display based on visible locations
         * Calculates the proportion of locations in each score tier
         * and updates the segment widths accordingly
         */
        if (!visibleLocations || visibleLocations.length === 0) {
            // Show empty/disabled state
            document.getElementById('dist-poor').style.width = '25%';
            document.getElementById('dist-fair').style.width = '25%';
            document.getElementById('dist-good').style.width = '25%';
            document.getElementById('dist-excellent').style.width = '25%';
            return;
        }

        // Count locations in each tier
        const tiers = {
            poor: 0,      // <50
            fair: 0,      // 50-64
            good: 0,      // 65-79
            excellent: 0  // 80+
        };

        visibleLocations.forEach(loc => {
            const score = loc.s || 0;
            if (score < 50) tiers.poor++;
            else if (score < 65) tiers.fair++;
            else if (score < 80) tiers.good++;
            else tiers.excellent++;
        });

        const total = visibleLocations.length;
        const poorPct = (tiers.poor / total * 100);
        const fairPct = (tiers.fair / total * 100);
        const goodPct = (tiers.good / total * 100);
        const excellentPct = (tiers.excellent / total * 100);

        // Update segment widths with minimum 1% to show all segments
        document.getElementById('dist-poor').style.width = Math.max(1, poorPct) + '%';
        document.getElementById('dist-fair').style.width = Math.max(1, fairPct) + '%';
        document.getElementById('dist-good').style.width = Math.max(1, goodPct) + '%';
        document.getElementById('dist-excellent').style.width = Math.max(1, excellentPct) + '%';
    }

    function refreshMap() {
        clusterLayer.clearLayers();
        individualLayer.clearLayers();
        highlightedMarkers = [];

        // Apply all filters (AND logic)
        const visible = allLocations.filter(loc =>
            activeTickers.has(loc.ticker) &&
            loc.s >= scoreFilter.min &&
            loc.s <= scoreFilter.max &&
            ownershipModel.has(loc.ownership) &&
            subtypes.has(loc.subtype)
        );

        // Update proximity index with visible locations
        proximityIndex.addLocations(visible);

        // Create markers (without adding to map yet)
        const clusterMarkers = visible.map(loc => createMarker(loc, false));
        const individualMarkers = visible.map(loc => createMarker(loc, true));

        // Handle heat map (optional overlay)
        if (isHeatmapView) {
            updateHeatmap(visible);
        } else if (heatLayer) {
            map.removeLayer(heatLayer);
            heatLayer = null;
        }

        // Enforce mutually exclusive view modes
        if (isClusterView) {
            // Clustered view is active - add cluster markers, remove individual
            clusterLayer.addLayers(clusterMarkers);
            if (!map.hasLayer(clusterLayer)) map.addLayer(clusterLayer);
            if (map.hasLayer(individualLayer)) map.removeLayer(individualLayer);
        } else {
            // All locations view is active - add individual markers, remove clusters
            individualMarkers.forEach(m => individualLayer.addLayer(m));
            if (!map.hasLayer(individualLayer)) map.addLayer(individualLayer);
            if (map.hasLayer(clusterLayer)) map.removeLayer(clusterLayer);
        }

        updateLocationCount();
        updateDashboardStats();
        updateScoreDistribution(visible);

        // Update visible stats after map refresh (slight delay for rendering)
        setTimeout(updateVisibleStats, 100);
    }

    function refreshMarkerSizes() {
        // Update marker sizes when zoom changes
        if (isClusterView) {
            // Cluster view - update sizes of individual markers within clusters
            clusterLayer.eachLayer(marker => {
                if (marker.setRadius) {
                    const radius = getMarkerRadius(currentZoom, false);
                    marker.setRadius(radius);
                }
            });
        } else {
            // Individual view - update sizes of individual markers
            individualLayer.eachLayer(marker => {
                if (marker.setRadius) {
                    const radius = getMarkerRadius(currentZoom, true);
                    marker.setRadius(radius);
                }
            });
        }
    }

    function updateHeatmap(locations) {
        if (heatLayer) {
            map.removeLayer(heatLayer);
            heatLayer = null;
        }

        if (locations.length === 0 || typeof L.heatLayer === 'undefined') return;

        // Use site score as weight: normalized to 0-1 where 100 = 1.0
        // This makes "hotter" mean higher-scoring sites
        const heatData = locations.map(loc => [
            loc.lat,
            loc.lng,
            Math.min(1, loc.s / 100)  // Normalize score to 0-1 range
        ]);

        heatLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            // Gradient: cool (blue) = low scores, hot (red) = high scores
            gradient: {
                0.0: '#3b82f6',    // Blue: <25 (Poor)
                0.25: '#22c55e',   // Green: 25-50 (Fair)
                0.5: '#eab308',    // Yellow: 50-75 (Good)
                0.75: '#f97316',   // Orange: 75-90
                1.0: '#ef4444'     // Red: 90-100 (Excellent)
            }
        }).addTo(map);

        // Ensure heat layer is behind markers
        if (map.hasLayer(clusterLayer)) {
            clusterLayer.bringToFront();
        }
        if (map.hasLayer(individualLayer)) {
            individualLayer.bringToFront();
        }
    }

    function updateLocationCount() {
        const visible = allLocations.filter(loc =>
            activeTickers.has(loc.ticker) &&
            loc.s >= scoreFilter.min &&
            loc.s <= scoreFilter.max &&
            ownershipModel.has(loc.ownership) &&
            subtypes.has(loc.subtype)
        );
        document.getElementById('visible-count').textContent = visible.length.toLocaleString();
    }

    function updateDashboardStats() {
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));

        if (visible.length === 0) {
            document.getElementById('avg-score').textContent = '--';
            document.getElementById('high-score-count').textContent = '0';
            document.getElementById('competitor-count').textContent = '0';
            document.getElementById('brands-active').textContent = '0';
            return;
        }

        const avgScore = Math.round(visible.reduce((sum, loc) => sum + loc.s, 0) / visible.length);
        const highScoreCount = visible.filter(loc => loc.s >= 80).length;
        const competitorCount = visible.length;
        const brandsActive = activeTickers.size;

        document.getElementById('avg-score').textContent = avgScore;
        document.getElementById('high-score-count').textContent = highScoreCount.toLocaleString();
        document.getElementById('competitor-count').textContent = competitorCount.toLocaleString();
        document.getElementById('brands-active').textContent = brandsActive;

        // Update score distribution chart
        updateScoreDistribution(visible);
    }

    function updateVisibleStats() {
        // Get current map bounds
        if (!map) return;

        const bounds = map.getBounds();
        const visibleLocations = allLocations.filter(loc => {
            // Check if location is within bounds and passes all filters
            return activeTickers.has(loc.ticker) &&
                   bounds.contains([loc.lat, loc.lng]) &&
                   loc.s >= scoreFilter.min &&
                   loc.s <= scoreFilter.max &&
                   ownershipModel.has(loc.ownership) &&
                   subtypes.has(loc.subtype);
        });

        if (visibleLocations.length === 0) {
            document.getElementById('avg-score').textContent = '--';
            // Animate high performers count to 0
            animateKpiNumber('high-score-count', prevViewportMetrics.highPerformersCount, 0, {
                formatter: (v) => Math.round(v).toLocaleString()
            });
            // Animate competitor count to 0
            animateKpiNumber('competitor-count', prevViewportMetrics.competitorCount, 0, {
                formatter: (v) => Math.round(v).toLocaleString()
            });
            // Animate active brands count to 0
            animateKpiNumber('brands-active', prevViewportMetrics.activeBrandsCount, 0, {
                formatter: (v) => Math.round(v).toLocaleString()
            });
            prevViewportMetrics.highPerformersCount = 0;
            prevViewportMetrics.competitorCount = 0;
            prevViewportMetrics.activeBrandsCount = 0;
            return;
        }

        // Calculate stats for visible locations only
        const avgScore = Math.round(visibleLocations.reduce((sum, loc) => sum + loc.s, 0) / visibleLocations.length);
        const highScoreCount = visibleLocations.filter(loc => loc.s >= 80).length;
        const competitorCount = visibleLocations.length;

        // Calculate distinct active brands in viewport
        const activeBrandSet = new Set(visibleLocations.map(loc => loc.ticker));
        const activeBrandsCount = activeBrandSet.size;

        // Use animated score update
        animateAvgScore(avgScore);

        // Animate high performers count with proper formatting
        animateKpiNumber('high-score-count', prevViewportMetrics.highPerformersCount, highScoreCount, {
            formatter: (v) => Math.round(v).toLocaleString()
        });
        prevViewportMetrics.highPerformersCount = highScoreCount;

        // Animate competitor count with proper formatting
        animateKpiNumber('competitor-count', prevViewportMetrics.competitorCount, competitorCount, {
            formatter: (v) => Math.round(v).toLocaleString()
        });
        prevViewportMetrics.competitorCount = competitorCount;

        // Animate active brands count with proper formatting
        animateKpiNumber('brands-active', prevViewportMetrics.activeBrandsCount, activeBrandsCount, {
            formatter: (v) => Math.round(v).toLocaleString()
        });
        prevViewportMetrics.activeBrandsCount = activeBrandsCount;

        // Update score distribution for visible locations
        updateScoreDistribution(visibleLocations);

        // Update location list if panel is open
        if (locationPanelOpen) {
            updateLocationList();
        }
    }

    function createMarker(loc, isIndividual = false) {
        const color = getColor(loc.ticker);
        const tier = getScoreTier(loc.s);
        const radius = getMarkerRadius(currentZoom, isIndividual);

        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: radius,
            fillColor: color,
            color: tier.color,
            weight: 2,
            opacity: 1,
            fillOpacity: 0.85
        });

        marker.locationData = loc;

        const attrs = loc.at || {};
        const subScores = loc.ss || {};

        // Build enhanced popup with charts
        const html = createEnhancedPopup(loc, attrs, subScores, color, tier);

        marker.bindPopup(html, { maxWidth: 400, className: 'enhanced-popup' });

        marker.on('popupopen', () => {
            setupPopupInteractions(loc, color);
        });

        marker.on('popupclose', () => {
            if(currentRadiusCircle) { map.removeLayer(currentRadiusCircle); currentRadiusCircle = null; }
            clearCompetitorHighlights();
        });

        return marker;
    }

    function createEnhancedPopup(loc, attrs, subScores, color, tier) {
        // Calculate bar widths for visual representation
        const marketBar = subScores.marketPotential || 0;
        const compBar = subScores.competitiveLandscape || 0;
        const accessBar = subScores.accessibility || 0;
        const siteBar = subScores.siteCharacteristics || 0;

        return `
            <div class="popup-container" data-location-id="${loc.id}">
                <div class="popup-header popup-draghandle" data-location-id="${loc.id}">
                    <div class="popup-title">
                        <h3>${loc.n}</h3>
                        <span class="popup-ticker" style="background:${color}">${loc.ticker}</span>
                    </div>
                    <div class="popup-controls">
                        <button class="popup-pin-btn" data-location-id="${loc.id}" title="Pin to compare multiple locations">
                            <i class="fa-solid fa-thumbtack"></i>
                        </button>
                        <button class="popup-save-btn" data-location-id="${loc.id}" title="Save location">
                            <i class="fa-regular fa-bookmark"></i>
                        </button>
                    </div>
                </div>
                <div class="popup-address">${(loc.a && loc.a !== 'US Location (OSM)') ? loc.a : '<span style="color: var(--text-light);">Address not available</span>'}</div>

                <div class="score-hero">
                    <div class="score-circle" style="border-color:${tier.color}">
                        <span class="score-value">${Math.round(loc.s)}</span>
                        <span class="score-label">${tier.label}</span>
                    </div>
                    <div class="score-actions">
                        <button class="action-btn" onclick="window.addToComparison('${loc.id}')" title="Add to comparison">
                            <i class="fa-solid fa-code-compare"></i>
                        </button>
                        <button class="action-btn" onclick="window.exportLocation('${loc.id}')" title="Export data">
                            <i class="fa-solid fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="window.shareLocation('${loc.id}')" title="Share">
                            <i class="fa-solid fa-share-nodes"></i>
                        </button>
                    </div>
                </div>

                <div class="score-breakdown">
                    <h4><i class="fa-solid fa-chart-bar"></i> Score Breakdown</h4>

                    <div class="breakdown-category">
                        <div class="category-header">
                            <span class="category-name"><i class="fa-solid fa-users"></i> Market Potential</span>
                            <span class="category-score">${marketBar.toFixed(0)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="bar-fill market" style="width:${marketBar}%"></div>
                        </div>
                        <div class="category-details">
                            <span>Income: $${((attrs.medianIncome || 0)/1000).toFixed(0)}k</span>
                            <span>Density: ${(attrs.populationDensity || 0).toLocaleString()}/sq mi</span>
                            <span>Spending: ${attrs.consumerSpending || 0}</span>
                            <span>Growth: ${attrs.growthRate || 0}%</span>
                        </div>
                    </div>

                    <div class="breakdown-category">
                        <div class="category-header">
                            <span class="category-name"><i class="fa-solid fa-store"></i> Competition</span>
                            <span class="category-score">${compBar.toFixed(0)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="bar-fill competition" style="width:${compBar}%"></div>
                        </div>
                        <div class="category-details">
                            <span>Competitors: ${attrs.competitors || 0}</span>
                            <span>Saturation: ${attrs.marketSaturation || 0}%</span>
                        </div>
                    </div>

                    <div class="breakdown-category">
                        <div class="category-header">
                            <span class="category-name"><i class="fa-solid fa-road"></i> Accessibility</span>
                            <span class="category-score">${accessBar.toFixed(0)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="bar-fill accessibility" style="width:${accessBar}%"></div>
                        </div>
                        <div class="category-details">
                            <span>Traffic: ${(attrs.traffic || 0).toLocaleString()} AADT</span>
                            <span>Walk: ${attrs.walkScore || 0}</span>
                            <span>Transit: ${attrs.transitScore || 0}</span>
                        </div>
                    </div>

                    <div class="breakdown-category">
                        <div class="category-header">
                            <span class="category-name"><i class="fa-solid fa-building"></i> Site Quality</span>
                            <span class="category-score">${siteBar.toFixed(0)}</span>
                        </div>
                        <div class="category-bar">
                            <div class="bar-fill site" style="width:${siteBar}%"></div>
                        </div>
                        <div class="category-details">
                            <span>Visibility: ${attrs.visibility || 0}</span>
                            <span>Safety: ${100 - (attrs.crimeIndex || 0)}</span>
                            <span>RE Index: ${attrs.realEstateIndex || 0}</span>
                        </div>
                    </div>
                </div>

                <div class="mini-scores-row">
                    <div class="mini-score-circle">
                        <div class="mini-score-icon market" title="Market Potential Score">${marketBar.toFixed(0)}</div>
                        <span class="mini-score-label">Market</span>
                    </div>
                    <div class="mini-score-circle">
                        <div class="mini-score-icon competition" title="Competition Score">${compBar.toFixed(0)}</div>
                        <span class="mini-score-label">Competition</span>
                    </div>
                    <div class="mini-score-circle">
                        <div class="mini-score-icon accessibility" title="Accessibility Score">${accessBar.toFixed(0)}</div>
                        <span class="mini-score-label">Access</span>
                    </div>
                    <div class="mini-score-circle">
                        <div class="mini-score-icon site" title="Site Quality Score">${siteBar.toFixed(0)}</div>
                        <span class="mini-score-label">Site</span>
                    </div>
                </div>

                <div class="demographics-grid">
                    <h4><i class="fa-solid fa-chart-pie"></i> Demographics</h4>
                    <div class="demo-items">
                        <div class="demo-item">
                            <span class="demo-value">${attrs.avgAge || '--'}</span>
                            <span class="demo-label">Avg Age</span>
                        </div>
                        <div class="demo-item">
                            <span class="demo-value">${attrs.householdSize || '--'}</span>
                            <span class="demo-label">HH Size</span>
                        </div>
                        <div class="demo-item">
                            <span class="demo-value">${attrs.educationIndex || '--'}%</span>
                            <span class="demo-label">College+</span>
                        </div>
                        <div class="demo-item">
                            <span class="demo-value">${attrs.employmentRate || '--'}%</span>
                            <span class="demo-label">Employed</span>
                        </div>
                    </div>
                </div>

                <div class="competitor-analysis">
                    <h4><i class="fa-solid fa-radar"></i> Competitor Analysis</h4>
                    <div class="radius-control">
                        <input type="range" id="slider-${loc.id}" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="3">
                        <span id="label-${loc.id}" class="radius-label">1.0 mi</span>
                    </div>
                    <div id="competitors-${loc.id}" class="competitors-result"></div>
                </div>

                <div class="popup-footer">
                    <span class="data-source">Data: Census, Walk Score, AADT (Simulated)</span>
                </div>
            </div>
        `;
    }

    function setupPopupInteractions(loc, color) {
        const slider = document.getElementById(`slider-${loc.id}`);
        const label = document.getElementById(`label-${loc.id}`);
        const competitorsDiv = document.getElementById(`competitors-${loc.id}`);

        // Handle pin button
        const pinBtn = document.querySelector(`.popup-pin-btn[data-location-id="${loc.id}"]`);
        const popupContainer = document.querySelector(`.popup-container[data-location-id="${loc.id}"]`);

        if (pinBtn && popupContainer) {
            // Track pin state
            let isPinned = false;

            pinBtn.onclick = function(e) {
                e.stopPropagation();
                isPinned = !isPinned;
                popupContainer.classList.toggle('pinned', isPinned);
                pinBtn.classList.toggle('pinned', isPinned);

                // When pinned, store pin state so popup doesn't auto-close
                if (isPinned) {
                    popupContainer.dataset.pinned = 'true';
                } else {
                    delete popupContainer.dataset.pinned;
                }
            };

            // Handle drag functionality
            const dragHandle = document.querySelector(`.popup-draghandle[data-location-id="${loc.id}"]`);
            if (dragHandle) {
                let isDragging = false;
                let dragStartX = 0;
                let dragStartY = 0;
                let popupStartX = 0;
                let popupStartY = 0;

                dragHandle.addEventListener('mousedown', (e) => {
                    if (e.target.closest('.popup-pin-btn')) return; // Don't drag when clicking pin button
                    isDragging = true;
                    dragStartX = e.clientX;
                    dragStartY = e.clientY;

                    // Get popup element (Leaflet popup)
                    const leafletPopup = map._popup;
                    if (leafletPopup && leafletPopup._container) {
                        popupStartX = leafletPopup._container.offsetLeft;
                        popupStartY = leafletPopup._container.offsetTop;
                    }

                    e.preventDefault();
                });

                document.addEventListener('mousemove', (e) => {
                    if (!isDragging) return;

                    const leafletPopup = map._popup;
                    if (!leafletPopup || !leafletPopup._container) return;

                    const container = leafletPopup._container;
                    const deltaX = e.clientX - dragStartX;
                    const deltaY = e.clientY - dragStartY;

                    container.style.position = 'fixed';
                    container.style.left = (popupStartX + deltaX) + 'px';
                    container.style.top = (popupStartY + deltaY) + 'px';
                });

                document.addEventListener('mouseup', () => {
                    isDragging = false;
                });
            }
        }

        if(!slider) return;

        const updateRadius = function() {
            const miles = RADIUS_STEPS[slider.value];
            label.innerText = `${miles} mi`;

            if(currentRadiusCircle) map.removeLayer(currentRadiusCircle);

            currentRadiusCircle = L.circle([loc.lat, loc.lng], {
                radius: miles * 1609.34,
                color: color, fillOpacity: 0.08, weight: 2, dashArray: '5,5'
            }).addTo(map);

            highlightCompetitors(loc, miles, competitorsDiv);
        };

        slider.oninput = updateRadius;
        updateRadius();

        // Handle save button
        const saveBtn = document.querySelector(`.popup-save-btn[data-location-id="${loc.id}"]`);
        if (saveBtn) {
            // Check if location is already saved
            const savedLocations = getSavedLocations();
            const isSaved = savedLocations.some(sl => sl.id === loc.id);

            if (isSaved) {
                saveBtn.classList.add('saved');
                saveBtn.querySelector('i').classList.remove('fa-regular');
                saveBtn.querySelector('i').classList.add('fa-solid');
            }

            saveBtn.onclick = function(e) {
                e.stopPropagation();
                const locationData = {
                    id: loc.id,
                    name: loc.n,
                    ticker: loc.ticker,
                    address: loc.a,
                    lat: loc.lat,
                    lng: loc.lng,
                    score: loc.s,
                    savedAt: new Date().toISOString()
                };

                if (isSaved) {
                    removeFromSavedLocations(loc.id);
                    saveBtn.classList.remove('saved');
                    saveBtn.querySelector('i').classList.remove('fa-solid');
                    saveBtn.querySelector('i').classList.add('fa-regular');
                    showToast(`Removed "${loc.n}" from saved locations`, 'info');
                } else {
                    addToSavedLocations(locationData);
                    saveBtn.classList.add('saved');
                    saveBtn.querySelector('i').classList.add('fa-solid');
                    saveBtn.querySelector('i').classList.remove('fa-regular');
                    showToast(`Saved "${loc.n}" to your collection`, 'success');
                }
                updateSavedLocationsPanel();
            };
        }
    }

    function getSavedLocations() {
        const saved = localStorage.getItem('franchiseiq_saved_locations');
        return saved ? JSON.parse(saved) : [];
    }

    function addToSavedLocations(locationData) {
        const saved = getSavedLocations();
        if (!saved.some(l => l.id === locationData.id)) {
            saved.push(locationData);
            localStorage.setItem('franchiseiq_saved_locations', JSON.stringify(saved));
        }
    }

    function removeFromSavedLocations(locationId) {
        const saved = getSavedLocations();
        const filtered = saved.filter(l => l.id !== locationId);
        localStorage.setItem('franchiseiq_saved_locations', JSON.stringify(filtered));
    }

    function updateSavedLocationsPanel() {
        const saved = getSavedLocations();
        const panel = document.getElementById('saved-locations-panel');
        const content = document.getElementById('saved-locations-content');
        const countBadge = document.getElementById('saved-count');

        if (!content) return;

        countBadge.textContent = saved.length;

        if (saved.length === 0) {
            content.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-bookmark"></i>
                    <p>No saved locations yet. Click the bookmark icon on a location popup to save it.</p>
                </div>
            `;
        } else {
            // Sort by saved date (newest first)
            const sorted = [...saved].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));
            let html = '';

            sorted.forEach(loc => {
                const color = getColor(loc.ticker);
                html += `
                    <div class="saved-location-item" data-location-id="${loc.id}">
                        <div class="saved-location-header">
                            <h4>${loc.name}</h4>
                            <span class="saved-ticker" style="background: ${color}">${loc.ticker}</span>
                        </div>
                        <div class="saved-location-details">
                            <div class="saved-detail">
                                <i class="fa-solid fa-map-pin"></i>
                                <span>${loc.address && loc.address !== 'US Location (OSM)' ? loc.address : 'Address not available'}</span>
                            </div>
                            <div class="saved-detail">
                                <i class="fa-solid fa-star"></i>
                                <span>Score: ${Math.round(loc.score)}</span>
                            </div>
                            <div class="saved-detail">
                                <i class="fa-solid fa-calendar"></i>
                                <span>${new Date(loc.savedAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div class="saved-location-actions">
                            <button class="saved-location-btn view-btn" data-location-id="${loc.id}" title="Center map on location">
                                <i class="fa-solid fa-map"></i> View
                            </button>
                            <button class="saved-location-btn remove-btn" data-location-id="${loc.id}" title="Remove from saved">
                                <i class="fa-solid fa-trash"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            });

            content.innerHTML = html;

            // Add event listeners to view and remove buttons
            content.querySelectorAll('.view-btn').forEach(btn => {
                btn.onclick = function(e) {
                    e.stopPropagation();
                    const locId = this.dataset.locationId;
                    const savedLoc = saved.find(l => l.id === locId);
                    if (savedLoc && map) {
                        map.setView([savedLoc.lat, savedLoc.lng], 14);
                    }
                };
            });

            content.querySelectorAll('.remove-btn').forEach(btn => {
                btn.onclick = function(e) {
                    e.stopPropagation();
                    const locId = this.dataset.locationId;
                    const savedLoc = saved.find(l => l.id === locId);
                    removeFromSavedLocations(locId);
                    showToast(`Removed "${savedLoc.name}" from saved locations`, 'info');
                    updateSavedLocationsPanel();

                    // Update bookmark button if popup is open
                    const saveBtn = document.querySelector(`.popup-save-btn[data-location-id="${locId}"]`);
                    if (saveBtn) {
                        saveBtn.classList.remove('saved');
                        saveBtn.querySelector('i').classList.remove('fa-solid');
                        saveBtn.querySelector('i').classList.add('fa-regular');
                    }
                };
            });
        }
    }

    function highlightCompetitors(centerLoc, radiusMiles, displayDiv) {
        clearCompetitorHighlights();

        // Use proximity index for efficient spatial search
        const competitorResults = proximityIndex.findCompetitors(
            centerLoc.lat,
            centerLoc.lng,
            radiusMiles,
            activeTickers
        );

        const byTicker = {};
        Object.entries(competitorResults.byTicker).forEach(([ticker, locs]) => {
            byTicker[ticker] = locs.map(l => l.location).filter(loc => loc.id !== centerLoc.id);
        });

        // Remove center location from competitor count if present
        const competitors = Object.values(byTicker).flat();

        if (competitors.length === 0) {
            displayDiv.innerHTML = '<div class="no-competitors"><i class="fa-solid fa-check-circle"></i> No competitors in radius</div>';
        } else {
            let html = `<div class="competitors-header">${competitors.length} competitor${competitors.length > 1 ? 's' : ''} found</div>`;
            html += '<div class="competitors-list">';
            Object.keys(byTicker).sort((a, b) => byTicker[b].length - byTicker[a].length).forEach(ticker => {
                const color = getColor(ticker);
                const avgScore = Math.round(byTicker[ticker].reduce((s, l) => s + l.s, 0) / byTicker[ticker].length);
                html += `
                    <div class="competitor-item">
                        <span class="competitor-dot" style="background:${color}"></span>
                        <span class="competitor-ticker">${ticker}</span>
                        <span class="competitor-count">${byTicker[ticker].length}</span>
                        <span class="competitor-avg">avg: ${avgScore}</span>
                    </div>
                `;
            });
            html += '</div>';
            displayDiv.innerHTML = html;
        }
    }

    function clearCompetitorHighlights() {
        highlightedMarkers.forEach(m => {
            if (m._icon) m._icon.classList.remove('competitor-marker');
        });
        highlightedMarkers = [];
    }

    // Global functions for popup interactions
    window.addToComparison = function(locId) {
        const loc = allLocations.find(l => l.id === locId);
        if (!loc) return;

        if (comparisonLocations.length >= 4) {
            alert('Maximum 4 locations can be compared at once');
            return;
        }

        if (comparisonLocations.find(l => l.id === locId)) {
            alert('Location already in comparison');
            return;
        }

        comparisonLocations.push(loc);
        updateComparisonPanel();
        // Do not auto-show panel - user controls visibility via Score Distribution button
    };

    window.exportLocation = function(locId) {
        const loc = allLocations.find(l => l.id === locId);
        if (!loc) return;

        const data = {
            name: loc.n,
            ticker: loc.ticker,
            address: loc.a,
            coordinates: { lat: loc.lat, lng: loc.lng },
            score: loc.s,
            subScores: loc.ss,
            attributes: loc.at,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `location_${loc.ticker}_${loc.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    window.shareLocation = function(locId) {
        const loc = allLocations.find(l => l.id === locId);
        if (!loc) return;

        const shareUrl = `${window.location.origin}${window.location.pathname}?loc=${locId}&lat=${loc.lat}&lng=${loc.lng}`;

        if (navigator.share) {
            navigator.share({
                title: `${loc.n} - FranchiseIQ`,
                text: `Score: ${loc.s}/100 - ${loc.a}`,
                url: shareUrl
            });
        } else {
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    };

    window.removeFromComparison = function(locId) {
        comparisonLocations = comparisonLocations.filter(l => l.id !== locId);
        updateComparisonPanel();
        if (comparisonLocations.length === 0) {
            hideComparisonPanel();
        }
    };

    window.clearComparison = function() {
        comparisonLocations = [];
        updateComparisonPanel();
        hideComparisonPanel();
    };

    window.exportComparison = function() {
        if (comparisonLocations.length === 0) return;

        const data = {
            comparison: comparisonLocations.map(loc => ({
                name: loc.n,
                ticker: loc.ticker,
                address: loc.a,
                score: loc.s,
                subScores: loc.ss,
                attributes: loc.at
            })),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    function showComparisonPanel() {
        const panel = document.getElementById('comparison-panel');
        panel.classList.remove('hidden');
        panel.classList.add('visible');
    }

    function hideComparisonPanel() {
        const panel = document.getElementById('comparison-panel');
        panel.classList.remove('visible');
        panel.classList.add('hidden');
    }

    function toggleComparisonPanel() {
        const panel = document.getElementById('comparison-panel');
        if (panel.classList.contains('hidden') || !panel.classList.contains('visible')) {
            showComparisonPanel();
        } else {
            hideComparisonPanel();
        }
    }

    function openBrandComparisonTool() {
        // Get all active locations
        const activeLocations = allLocations.filter(loc => activeTickers.has(loc.ticker));

        if (activeLocations.length === 0) {
            alert('No active brands selected. Please select brands first.');
            return;
        }

        // Show comparison panel and populate with top performers for quick selection
        const topPerformers = activeLocations
            .sort((a, b) => b.s - a.s)
            .slice(0, 10);

        // Clear current comparison
        comparisonLocations = [];

        // Auto-select top 3 for quick comparison
        topPerformers.slice(0, 3).forEach(loc => {
            comparisonLocations.push(loc);
        });

        updateComparisonPanel();
        // Do not auto-show panel - user controls visibility via Score Distribution button

        // Show toast notification
        const msg = `Selected top 3 locations from ${activeLocations.length} active brands. Click locations on map to add/remove.`;
        showNotification(msg);
    }

    function showNotification(message, duration = 3000) {
        // Simple notification - could be enhanced with a toast notification system
        console.log('Notification:', message);
    }

    function updateComparisonPanel() {
        const container = document.getElementById('comparison-cards');
        const countBadge = document.getElementById('comparison-count');
        const exportBtn = document.getElementById('export-comparison-btn');
        const clearBtn = document.getElementById('clear-comparison-btn');

        // Update count badge
        countBadge.textContent = comparisonLocations.length;

        // Update button states
        const hasLocations = comparisonLocations.length > 0;
        exportBtn.disabled = !hasLocations;
        clearBtn.disabled = !hasLocations;

        container.innerHTML = '';

        if (comparisonLocations.length === 0) {
            container.innerHTML = '<div class="comparison-empty">Add locations to compare</div>';
            return;
        }

        comparisonLocations.forEach(loc => {
            const tier = getScoreTier(loc.s);
            const color = getColor(loc.ticker);
            const subScores = loc.ss || {};
            const address = (loc.a && loc.a !== 'US Location (OSM)') ? loc.a : '';

            // Build score bars for non-zero values
            let scoreBarsHtml = '';
            const scoreFields = [
                { key: 'marketPotential', label: 'Market', color: '#3b82f6' },
                { key: 'competitiveLandscape', label: 'Competition', color: '#22c55e' },
                { key: 'accessibility', label: 'Access', color: '#eab308' },
                { key: 'siteCharacteristics', label: 'Site', color: '#8b5cf6' }
            ];

            scoreFields.forEach(field => {
                const value = subScores[field.key] || 0;
                // Show field if it has a value > 0
                if (value > 0) {
                    scoreBarsHtml += `
                        <div class="comp-bar-row">
                            <span>${field.label}</span>
                            <div class="comp-bar"><div style="width:${value}%;background:${field.color}"></div></div>
                            <span class="comp-value">${value.toFixed(0)}</span>
                        </div>
                    `;
                }
            });

            // Fallback: if no sub-scores, show message
            if (!scoreBarsHtml) {
                scoreBarsHtml = '<p style="font-size: 0.75rem; opacity: 0.6; margin: 8px 0;">No detailed scores available</p>';
            }

            const card = document.createElement('div');
            card.className = 'comparison-card';
            card.innerHTML = `
                <div class="comp-card-header">
                    <span class="comp-ticker" style="background:${color}">${loc.ticker}</span>
                    <button class="comp-remove" onclick="window.removeFromComparison('${loc.id}')">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                <div class="comp-name">${loc.n}</div>
                ${address ? `<div class="comp-address">${address}</div>` : ''}
                <div class="comp-score" style="color:${tier.color}; margin: 8px 0;">${Math.round(loc.s)}</div>
                <div class="comp-bars">
                    ${scoreBarsHtml}
                </div>
            `;
            container.appendChild(card);
        });
    }

    // Comparison Panel Dragging & Position Persistence
    function initComparisonPanelDragging() {
        const panel = document.getElementById('comparison-panel');
        const dragHandle = document.getElementById('comparison-drag-handle');
        const STORAGE_KEY = 'franchiseiq_comparison_panel_position';

        let isDragging = false;
        let offset = { x: 0, y: 0 };
        let dragStart = { x: 0, y: 0 };

        // Restore saved position on initialization
        const savedPosition = localStorage.getItem(STORAGE_KEY);
        if (savedPosition) {
            try {
                const pos = JSON.parse(savedPosition);
                panel.style.top = pos.top;
                panel.style.right = pos.right;
                panel.style.left = pos.left;
                panel.style.bottom = pos.bottom;
            } catch (e) {
                console.warn('Failed to restore comparison panel position:', e);
            }
        }

        dragHandle.addEventListener('mousedown', (e) => {
            // Only drag from the header area, not from buttons
            if (e.target.closest('.comparison-actions')) return;

            isDragging = true;
            dragStart = { x: e.clientX, y: e.clientY };

            // Get current position
            const rect = panel.getBoundingClientRect();
            offset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };

            // Temporarily disable map interactions during drag
            if (map) {
                map.dragging.disable();
            }

            dragHandle.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const mapContainer = document.getElementById('map-container');
            const containerRect = mapContainer.getBoundingClientRect();

            // Calculate new position
            let newX = e.clientX - containerRect.left - offset.x;
            let newY = e.clientY - containerRect.top - offset.y;

            // Constrain to container bounds
            newX = Math.max(0, Math.min(newX, containerRect.width - panel.offsetWidth));
            newY = Math.max(0, Math.min(newY, containerRect.height - panel.offsetHeight));

            // Apply position
            panel.style.position = 'absolute';
            panel.style.left = newX + 'px';
            panel.style.right = 'auto';
            panel.style.top = newY + 'px';
            panel.style.bottom = 'auto';
            panel.style.transform = 'none';
        });

        document.addEventListener('mouseup', (e) => {
            if (!isDragging) return;

            isDragging = false;
            dragHandle.style.cursor = 'grab';

            // Re-enable map interactions
            if (map) {
                map.dragging.enable();
            }

            // Save position to localStorage
            const position = {
                top: panel.style.top,
                right: panel.style.right,
                left: panel.style.left,
                bottom: panel.style.bottom
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
        });
    }

    function loadBuildings() {
        if(map.getZoom() < 15) return;
        const b = map.getBounds();
        const q = `[out:json];(way["building"](${b.getSouth()},${b.getWest()},${b.getNorth()},${b.getEast()}););out body;>;out skel qt;`;
        fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: q })
            .then(r => r.json()).then(d => {
                const geo = osmtogeojson(d);
                buildingsLayer.geoJSON(geo);
                buildingsLayer.setStyle({ color: '#555', roofColor: '#777', weight: 1 });
            });
    }

    // Major cities for random fallback
    const MAJOR_CITIES = [
        { name: 'New York', lat: 40.7128, lng: -74.0060 },
        { name: 'Los Angeles', lat: 34.0522, lng: -118.2437 },
        { name: 'Chicago', lat: 41.8781, lng: -87.6298 },
        { name: 'Dallas', lat: 32.7767, lng: -96.7970 },
        { name: 'Atlanta', lat: 33.7490, lng: -84.3880 },
        { name: 'Houston', lat: 29.7604, lng: -95.3698 },
        { name: 'Phoenix', lat: 33.4484, lng: -112.0742 },
        { name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
        { name: 'Seattle', lat: 47.6062, lng: -122.3321 },
        { name: 'Miami', lat: 25.7617, lng: -80.1918 }
    ];

    function loadStartView() {
        // Check localStorage for saved start view
        const savedView = localStorage.getItem('franchiseMapStartView');

        if (savedView) {
            try {
                const view = JSON.parse(savedView);
                map.setView([view.lat, view.lng], view.zoom);
                return;
            } catch (e) {
                console.warn('Failed to load saved view:', e);
            }
        }

        // Try geolocation with timeout
        const geolocationTimeout = setTimeout(() => {
            // Timeout - use fallback city
            useRandomFallbackCity();
        }, 4000);

        map.locate({setView: false, maxZoom: 14});

        map.once('locationfound', function(e) {
            clearTimeout(geolocationTimeout);
            map.setView([e.latitude, e.longitude], 14);
        });

        map.once('locationerror', function(e) {
            clearTimeout(geolocationTimeout);
            useRandomFallbackCity();
        });
    }

    function useRandomFallbackCity() {
        const city = MAJOR_CITIES[Math.floor(Math.random() * MAJOR_CITIES.length)];
        map.setView([city.lat, city.lng], 12);
        showToast(`Using view centered on ${city.name} (location unavailable)`);
    }

    function updateSaveButtonState() {
        const btn = document.getElementById('btn-save-view');
        if (!btn) return;

        const hasSavedView = getSavedView() !== null;
        if (hasSavedView) {
            btn.classList.add('saved');
            btn.setAttribute('title', 'View saved • Click to update');
        } else {
            btn.classList.remove('saved');
            btn.setAttribute('title', 'Save current view');
        }
    }

    function saveStartView() {
        const center = map.getCenter();
        const zoom = map.getZoom();
        const view = { lat: center.lat, lng: center.lng, zoom: zoom };
        localStorage.setItem('franchiseMapStartView', JSON.stringify(view));
        updateSaveButtonState();
        showToast('Start view saved');
    }

    function resetStartView() {
        localStorage.removeItem('franchiseMapStartView');
        updateSaveButtonState();
        showToast('Saved view cleared');
    }

    function getSavedView() {
        const savedView = localStorage.getItem('franchiseMapStartView');
        if (savedView) {
            try {
                return JSON.parse(savedView);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            font-size: 0.9rem;
            z-index: 9999;
            animation: slideIn 0.3s ease-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    /**
     * Update toggle view button state, styling, and title
     * @param {boolean} isSaved - Whether a view is currently saved
     */
    function updateToggleViewButton(isSaved) {
        const btn = document.getElementById('btn-toggle-view');
        if (!btn) return;

        if (isSaved) {
            // View is saved - show "Reset View" state (gold/yellow)
            btn.classList.add('view-saved');
            btn.setAttribute('title', 'Reset View');
        } else {
            // View is not saved - show "Save View" state (white)
            btn.classList.remove('view-saved');
            btn.setAttribute('title', 'Save Current View');
        }
    }

    /**
     * Toggle between saving and resetting the current map view
     */
    function toggleSavedView() {
        const isSavedViewActive = getSavedView() !== null;

        if (isSavedViewActive) {
            // View is currently saved - reset it
            resetStartView();
            updateToggleViewButton(false);
        } else {
            // View is not saved - save it
            saveStartView();
            updateToggleViewButton(true);
        }
    }

    function setupRail() {
        // Home button - navigate to saved view or default US center
        document.getElementById('btn-home').onclick = () => {
            const savedView = getSavedView();
            if (savedView) {
                map.setView([savedView.lat, savedView.lng], savedView.zoom);
            } else {
                map.setView([39.82, -98.58], 4);
            }
        };

        // Target Location (Locate) button with error handling
        const locateBtn = document.getElementById('btn-locate');
        locateBtn.onclick = function() {
            locateBtn.classList.add('locating');
            map.locate({setView: true, maxZoom: 14});
        };

        // Handle geolocation success
        map.on('locationfound', function(e) {
            locateBtn.classList.remove('locating');
        });

        // Handle geolocation errors
        map.on('locationerror', function(e) {
            locateBtn.classList.remove('locating');
            console.warn('Geolocation error:', e);
            showToast('Unable to access your location. Check browser permissions.');
        });

        // Toggle View button - combines save and reset functionality
        const toggleViewBtn = document.getElementById('btn-toggle-view');
        if (toggleViewBtn) {
            toggleViewBtn.onclick = toggleSavedView;
            // Initialize button state based on whether a view is already saved
            const isSaved = getSavedView() !== null;
            updateToggleViewButton(isSaved);
        }

        // Initialize save button state on page load
        updateSaveButtonState();

        // Toggle between Clustered and All Locations views (mutually exclusive)
        const clusterToggle = document.getElementById('btn-cluster-toggle');
        clusterToggle.onclick = function() {
            isClusterView = !isClusterView;
            this.classList.toggle('active');

            // Update title based on state
            if (isClusterView) {
                this.setAttribute('title', 'Switch to All Locations');
            } else {
                this.setAttribute('title', 'Switch to Clustered View');
            }

            refreshMap();
        };

        // Set initial tooltip (clustered view is default and active)
        if (isClusterView) {
            clusterToggle.setAttribute('title', 'Switch to All Locations');
        }

        // Toggle heat map overlay (independent from cluster/all locations toggle)
        document.getElementById('btn-heatmap-toggle').onclick = function() {
            isHeatmapView = !isHeatmapView;
            this.classList.toggle('active');

            // Toggle heat map legend visibility
            const heatmapLegend = document.getElementById('heatmap-legend');
            if (isHeatmapView) {
                heatmapLegend.classList.remove('hidden');
                this.setAttribute('title', 'Turn off Heat Map');
            } else {
                heatmapLegend.classList.add('hidden');
                this.setAttribute('title', 'Turn on Heat Map');
            }

            refreshMap();
        };

        const panel = document.getElementById('info-panel');
        const panelToggle = document.getElementById('btn-panel-toggle');
        const collapseBtn = document.getElementById('collapse-panel');

        function togglePanel() {
            panel.classList.toggle('panel-collapsed');
            panel.classList.toggle('panel-expanded');
            panelToggle.classList.toggle('active');
        }

        panelToggle.onclick = togglePanel;
        collapseBtn.onclick = togglePanel;
    }

    function setupFilters() {
        document.getElementById('btn-select-all').onclick = selectAll;
        document.getElementById('btn-deselect-all').onclick = deselectAll;

        document.getElementById('btn-roark').onclick = function() {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                selectRoark();
            } else {
                deselectRoark();
            }
        };

        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterByCategory(this.dataset.category);
            };
        });

        // Ownership Model Filter Buttons
        document.querySelectorAll('.ownership-btn').forEach(btn => {
            btn.onclick = function() {
                const model = this.dataset.model;

                if (model === 'all') {
                    // Select all ownership models
                    ownershipModel.clear();
                    ownershipModel.add('franchise');
                    ownershipModel.add('non-franchise');
                    document.querySelectorAll('.ownership-btn').forEach(b => b.classList.add('active'));
                    updateSubtypeButtonVisibility();
                } else {
                    // Toggle individual model
                    if (ownershipModel.has(model)) {
                        ownershipModel.delete(model);
                        this.classList.remove('active');
                    } else {
                        ownershipModel.add(model);
                        this.classList.add('active');
                    }

                    // Update "All" button state
                    const allBtn = document.getElementById('btn-ownership-all');
                    if (ownershipModel.size === 2) {
                        allBtn.classList.add('active');
                    } else {
                        allBtn.classList.remove('active');
                    }

                    updateSubtypeButtonVisibility();
                }

                refreshMap();
            };
        });

        // Sub-Type Filter Buttons
        document.querySelectorAll('.subtype-btn').forEach(btn => {
            btn.onclick = function() {
                const subtype = this.dataset.subtype;

                if (subtype === 'all') {
                    // Select all subtypes
                    subtypes.clear();
                    subtypes.add('licensed');
                    subtypes.add('corporate');
                    subtypes.add('independent');
                    subtypes.add('unknown');
                    document.querySelectorAll('.subtype-btn').forEach(b => b.classList.add('active'));
                } else {
                    // Toggle individual subtype
                    if (subtypes.has(subtype)) {
                        subtypes.delete(subtype);
                        this.classList.remove('active');
                    } else {
                        subtypes.add(subtype);
                        this.classList.add('active');
                    }

                    // Update "All" button state
                    const allBtn = document.getElementById('btn-subtype-all');
                    if (subtypes.size === 4) {
                        allBtn.classList.add('active');
                    } else {
                        allBtn.classList.remove('active');
                    }
                }

                refreshMap();
            };
        });
    }

    function setupAdvancedControls() {
        // Note: Score range filter sliders (score-min/score-max) have been moved to modal
        // These will now be controlled via the score slider modal
        // Keeping null checks for backward compatibility

        // Export all visible
        const exportBtn = document.getElementById('btn-export-all');
        if (exportBtn) {
            exportBtn.onclick = exportAllVisible;
        }

        // High performers card click - toggle open/close
        const highScoreCount = document.getElementById('high-score-count');
        if (highScoreCount) {
            const highPerfCard = highScoreCount.closest('.stat-card');
            if (highPerfCard) {
                highPerfCard.style.cursor = 'pointer';
                highPerfCard.onclick = toggleHighPerformers;
            }
        }

        // Close high performers list
        const closeBtn = document.getElementById('close-performers');
        if (closeBtn) {
            closeBtn.onclick = hideHighPerformers;
        }

        // Average Score card - toggle location panel
        const avgScoreEl = document.getElementById('avg-score');
        if (avgScoreEl) {
            const avgScoreCard = avgScoreEl.closest('.stat-card');
            if (avgScoreCard) {
                avgScoreCard.style.cursor = 'pointer';
                avgScoreCard.onclick = toggleLocationPanel;
            }
        }

        // Close high performers panel button
        const closeHighPerformersBtn = document.getElementById('close-high-performers');
        if (closeHighPerformersBtn) {
            closeHighPerformersBtn.onclick = hideHighPerformers;
        }

        // Close location panel button
        const closeLocationPanelBtn = document.getElementById('close-location-panel');
        if (closeLocationPanelBtn) {
            closeLocationPanelBtn.onclick = toggleLocationPanel;
        }

        // Competitor Analysis card click - toggle open/close
        const competitorCount = document.getElementById('competitor-count');
        if (competitorCount) {
            const competitorCard = competitorCount.closest('.stat-card');
            if (competitorCard) {
                competitorCard.style.cursor = 'pointer';
                competitorCard.onclick = toggleCompetitorAnalysis;
            }
        }

        // Close competitor analysis panel button
        const closeCompetitorBtn = document.getElementById('close-competitor-analysis');
        if (closeCompetitorBtn) {
            closeCompetitorBtn.onclick = hideCompetitorAnalysis;
        }

        // Close saved locations panel button
        const closeSavedLocationsBtn = document.getElementById('close-saved-locations');
        if (closeSavedLocationsBtn) {
            closeSavedLocationsBtn.onclick = function() {
                const panel = document.getElementById('saved-locations-panel');
                if (panel) {
                    panel.classList.add('hidden');
                }
            };
        }

        // Score Distribution / Comparison Toggle button
        const comparisonToggleBtn = document.getElementById('btn-comparison-toggle');
        if (comparisonToggleBtn) {
            comparisonToggleBtn.onclick = toggleComparisonPanel;
        }

        // Active Brands card - open comparison tool
        const brandsActiveEl = document.getElementById('brands-active');
        if (brandsActiveEl) {
            const brandsActiveCard = brandsActiveEl.closest('.stat-card');
            if (brandsActiveCard) {
                brandsActiveCard.style.cursor = 'pointer';
                brandsActiveCard.onclick = openBrandComparisonTool;
            }
        }

        // Close slider modal
        const closeSliderBtn = document.getElementById('close-slider');
        if (closeSliderBtn) {
            closeSliderBtn.onclick = hideScoreSlider;
        }

        // Modal background click
        const sliderModal = document.getElementById('score-slider-modal');
        if (sliderModal) {
            sliderModal.onclick = function(e) {
                if (e.target === sliderModal) hideScoreSlider();
            };
        }

        // Modal Slider inputs
        const sliderMin = document.getElementById('slider-min');
        const sliderMax = document.getElementById('slider-max');

        if (sliderMin && sliderMax) {
            sliderMin.oninput = function() {
                const min = parseInt(this.value);
                const max = parseInt(sliderMax.value);
                if (min > max) {
                    this.value = max;
                    return;
                }
                // Keep panel sliders in sync
                const panelSliderMin = document.getElementById('panel-slider-min');
                if (panelSliderMin) panelSliderMin.value = min;

                updateScoreSliderDisplay();
                updatePanelSliderDisplay();

                scoreFilter.min = min;
                scheduleRefreshMap();
            };

            sliderMax.oninput = function() {
                const max = parseInt(this.value);
                const min = parseInt(sliderMin.value);
                if (max < min) {
                    this.value = min;
                    return;
                }
                // Keep panel sliders in sync
                const panelSliderMax = document.getElementById('panel-slider-max');
                if (panelSliderMax) panelSliderMax.value = max;

                updateScoreSliderDisplay();
                updatePanelSliderDisplay();

                scoreFilter.max = max;
                scheduleRefreshMap();
            };
        }

        // Reset modal slider button
        const resetBtn = document.getElementById('reset-slider');
        if (resetBtn) {
            resetBtn.onclick = function() {
                if (sliderMin && sliderMax) {
                    sliderMin.value = 0;
                    sliderMax.value = 100;

                    // Keep panel sliders in sync
                    const panelSliderMin = document.getElementById('panel-slider-min');
                    const panelSliderMax = document.getElementById('panel-slider-max');
                    if (panelSliderMin) panelSliderMin.value = 0;
                    if (panelSliderMax) panelSliderMax.value = 100;

                    updateScoreSliderDisplay();
                    updatePanelSliderDisplay();

                    scoreFilter.min = 0;
                    scoreFilter.max = 100;
                    scheduleRefreshMap();
                }
            };
        }

        // Initialize modal sliders with current values
        if (sliderMin && sliderMax) {
            sliderMin.value = scoreFilter.min;
            sliderMax.value = scoreFilter.max;
            updateScoreSliderDisplay();
        }

        // Panel-based score filter sliders (side panel)
        const panelSliderMin = document.getElementById('panel-slider-min');
        const panelSliderMax = document.getElementById('panel-slider-max');

        if (panelSliderMin && panelSliderMax) {
            panelSliderMin.oninput = function() {
                const min = parseInt(this.value);
                const max = parseInt(panelSliderMax.value);
                if (min > max) {
                    this.value = max;
                    return;
                }
                // Update both modal and panel sliders to keep them in sync
                const sliderMin = document.getElementById('slider-min');
                if (sliderMin) sliderMin.value = min;

                updatePanelSliderDisplay();
                updateScoreSliderDisplay();

                scoreFilter.min = min;
                scheduleRefreshMap();
            };

            panelSliderMax.oninput = function() {
                const max = parseInt(this.value);
                const min = parseInt(panelSliderMin.value);
                if (max < min) {
                    this.value = min;
                    return;
                }
                // Update both modal and panel sliders to keep them in sync
                const sliderMax = document.getElementById('slider-max');
                if (sliderMax) sliderMax.value = max;

                updatePanelSliderDisplay();
                updateScoreSliderDisplay();

                scoreFilter.max = max;
                scheduleRefreshMap();
            };
        }

        // Reset panel slider button
        const resetPanelSliderBtn = document.getElementById('panel-reset-slider');
        if (resetPanelSliderBtn) {
            resetPanelSliderBtn.onclick = function() {
                if (panelSliderMin && panelSliderMax) {
                    panelSliderMin.value = 0;
                    panelSliderMax.value = 100;

                    // Keep modal sliders in sync
                    const sliderMin = document.getElementById('slider-min');
                    const sliderMax = document.getElementById('slider-max');
                    if (sliderMin) sliderMin.value = 0;
                    if (sliderMax) sliderMax.value = 100;

                    updatePanelSliderDisplay();
                    updateScoreSliderDisplay();

                    scoreFilter.min = 0;
                    scoreFilter.max = 100;
                    scheduleRefreshMap();
                }
            };
        }

        // Initialize panel sliders with current values
        if (panelSliderMin && panelSliderMax) {
            panelSliderMin.value = scoreFilter.min;
            panelSliderMax.value = scoreFilter.max;
            updatePanelSliderDisplay();
        }

        // Initialize draggable panels
        makeElementDraggable('location-panel', '.location-panel-header');
        makeElementDraggable('high-performers-panel', '.high-performers-header');
        makeElementDraggable('info-panel', '.panel-header');
        makeElementDraggable('search-panel', '.search-panel-header');

        // Search panel functionality
        setupSearchPanel();
    }

    function setupSearchPanel() {
        const searchPanel = document.getElementById('search-panel');
        const searchInput = document.getElementById('search-input');
        const searchResults = document.getElementById('search-results');
        const closeSearchBtn = document.getElementById('close-search-panel');
        const searchToggleBtn = document.getElementById('search-toggle-btn');
        const resultCount = document.getElementById('search-result-count');

        if (!searchPanel || !searchInput) return;

        // Toggle button
        if (searchToggleBtn) {
            searchToggleBtn.onclick = function() {
                if (searchPanel.classList.contains('hidden')) {
                    searchPanel.classList.remove('hidden');
                    searchInput.focus();
                } else {
                    searchPanel.classList.add('hidden');
                }
            };
        }

        // Close button
        if (closeSearchBtn) {
            closeSearchBtn.onclick = function() {
                searchPanel.classList.add('hidden');
            };
        }

        // Search input handler
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                performSearch(this.value);
            }
        });

        searchInput.addEventListener('input', function() {
            if (this.value.length > 2) {
                performSearch(this.value);
            } else {
                searchResults.innerHTML = '';
                if (resultCount) resultCount.style.display = 'none';
            }
        });

        // Scroll indicator detection
        searchResults.addEventListener('scroll', () => {
            updateScrollIndicators(searchResults);
        });
    }

    // Setup saved locations toggle button
    {
        const savedLocationsToggleBtn = document.getElementById('saved-locations-toggle-btn');
        const savedLocationsPanel = document.getElementById('saved-locations-panel');

        if (savedLocationsToggleBtn && savedLocationsPanel) {
            savedLocationsToggleBtn.onclick = function() {
                updateSavedLocationsPanel();
                if (savedLocationsPanel.classList.contains('hidden')) {
                    savedLocationsPanel.classList.remove('hidden');
                } else {
                    savedLocationsPanel.classList.add('hidden');
                }
            };
        }
    }

    function updateScrollIndicators(element) {
        const hasScroll = element.scrollHeight > element.clientHeight;
        const isScrolled = element.scrollTop > 0;

        if (hasScroll) {
            element.classList.add('scrollable');
        } else {
            element.classList.remove('scrollable');
        }

        if (isScrolled && hasScroll) {
            element.classList.add('scrolling');
        } else {
            element.classList.remove('scrolling');
        }
    }

    function performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const resultCount = document.getElementById('search-result-count');
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us`;

        // Show loading state
        searchResults.innerHTML = '<div class="search-empty-state"><i class="fa-solid fa-hourglass-end"></i><div class="search-empty-state-title">Searching...</div></div>';
        if (resultCount) resultCount.style.display = 'none';

        fetch(url)
            .then(res => res.json())
            .then(results => {
                searchResults.innerHTML = '';
                if (results.length === 0) {
                    searchResults.innerHTML = `
                        <div class="search-empty-state">
                            <i class="fa-solid fa-magnifying-glass"></i>
                            <div class="search-empty-state-title">No results found</div>
                            <div class="search-empty-state-text">Try a different city, zip code, or address</div>
                        </div>
                    `;
                    if (resultCount) resultCount.style.display = 'none';
                    return;
                }

                // Show result count
                if (resultCount) {
                    resultCount.textContent = `${results.length}`;
                    resultCount.style.display = 'inline-block';
                }

                results.forEach((result, index) => {
                    const resultEl = document.createElement('div');
                    resultEl.className = 'search-result-item';
                    resultEl.textContent = result.display_name.split(',')[0];
                    resultEl.title = result.display_name;
                    resultEl.style.setProperty('--index', index);
                    resultEl.onclick = function() {
                        const bbox = result.boundingbox;
                        map.fitBounds([
                            [parseFloat(bbox[0]), parseFloat(bbox[2])],
                            [parseFloat(bbox[1]), parseFloat(bbox[3])]
                        ]);
                        NotificationManager.success(`Centered on ${result.display_name.split(',')[0]}`);
                    };
                    searchResults.appendChild(resultEl);
                });

                // Update scroll indicators after rendering
                setTimeout(() => updateScrollIndicators(searchResults), 0);
            })
            .catch(err => {
                console.error('Search error:', err);
                searchResults.innerHTML = `
                    <div class="search-empty-state">
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <div class="search-empty-state-title">Search error</div>
                        <div class="search-empty-state-text">Could not connect. Try again.</div>
                    </div>
                `;
                if (resultCount) resultCount.style.display = 'none';
            });
    }

    function openSearchPanel() {
        const searchPanel = document.getElementById('search-panel');
        if (searchPanel) {
            searchPanel.classList.remove('hidden');
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.focus();
        }
    }

    function makeElementDraggable(elementId, headerSelector) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const header = element.querySelector(headerSelector);
        if (!header) return;

        let isDragging = false;
        let dragStartX = 0;
        let dragStartY = 0;
        let elementStartX = 0;
        let elementStartY = 0;
        let hasTransform = false;

        header.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons within the header
            if (e.target.closest('button') || e.target.tagName === 'BUTTON') return;

            isDragging = true;
            dragStartX = e.clientX;
            dragStartY = e.clientY;

            // Save the current computed position
            const rect = element.getBoundingClientRect();
            elementStartX = rect.left;
            elementStartY = rect.top;

            // Check if element has transform applied
            hasTransform = element.style.transform && element.style.transform !== 'none';

            header.style.cursor = 'grabbing';
            element.style.transition = 'none';
            element.style.transform = 'none';
            element.style.right = 'auto';
            element.style.left = rect.left + 'px';
            element.style.top = rect.top + 'px';

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const deltaX = e.clientX - dragStartX;
            const deltaY = e.clientY - dragStartY;

            element.style.left = (elementStartX + deltaX) + 'px';
            element.style.top = (elementStartY + deltaY) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                header.style.cursor = 'grab';
                element.style.transition = 'all var(--transition-normal)';
            }
        });
    }

    function exportAllVisible() {
        const visible = allLocations.filter(loc =>
            activeTickers.has(loc.ticker) &&
            loc.s >= scoreFilter.min &&
            loc.s <= scoreFilter.max &&
            ownershipModel.has(loc.ownership) &&
            subtypes.has(loc.subtype)
        );

        if (visible.length === 0) {
            alert('No locations to export');
            return;
        }

        const data = {
            locations: visible.map(loc => ({
                name: loc.n,
                ticker: loc.ticker,
                address: loc.a,
                coordinates: { lat: loc.lat, lng: loc.lng },
                score: loc.s,
                subScores: loc.ss,
                attributes: loc.at
            })),
            filters: {
                brands: Array.from(activeTickers),
                scoreRange: scoreFilter
            },
            exportDate: new Date().toISOString(),
            totalCount: visible.length
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `franchiseiq_export_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function selectAll() {
        const pills = document.querySelectorAll('.brand-pill');
        const promises = [];

        pills.forEach(pill => {
            const ticker = pill.dataset.ticker;
            const file = pill.dataset.file;

            if (!activeTickers.has(ticker)) {
                activeTickers.add(ticker);
                pill.classList.add('active');

                if (!loadedTickers.has(ticker)) {
                    promises.push(
                        fetch(file).then(r => r.json()).then(data => {
                            // Merge metadata before adding to allLocations
                            const enhancedData = mergeOwnershipMetadata(data, ticker);
                            allLocations = allLocations.concat(enhancedData);
                            loadedTickers.add(ticker);
                        })
                    );
                }
            }
        });

        Promise.all(promises).then(() => refreshMap());
    }

    function deselectAll() {
        activeTickers.clear();
        document.querySelectorAll('.brand-pill').forEach(pill => pill.classList.remove('active'));
        document.getElementById('btn-roark').classList.remove('active');
        refreshMap();
    }

    function selectRoark() {
        const promises = [];

        manifest.filter(item => item.is_roark).forEach(item => {
            const pill = document.querySelector(`.brand-pill[data-ticker="${item.ticker}"]`);
            if (pill && !activeTickers.has(item.ticker)) {
                activeTickers.add(item.ticker);
                pill.classList.add('active');

                if (!loadedTickers.has(item.ticker)) {
                    promises.push(
                        fetch(item.file).then(r => r.json()).then(data => {
                            // Merge metadata before adding to allLocations
                            const enhancedData = mergeOwnershipMetadata(data, item.ticker);
                            allLocations = allLocations.concat(enhancedData);
                            loadedTickers.add(item.ticker);
                        })
                    );
                }
            }
        });

        Promise.all(promises).then(() => refreshMap());
    }

    function deselectRoark() {
        manifest.filter(item => item.is_roark).forEach(item => {
            activeTickers.delete(item.ticker);
            const pill = document.querySelector(`.brand-pill[data-ticker="${item.ticker}"]`);
            if (pill) pill.classList.remove('active');
        });
        refreshMap();
    }

    function filterByCategory(category) {
        const container = document.getElementById('brand-legend');
        const pills = container.querySelectorAll('.brand-pill');

        pills.forEach(pill => {
            const ticker = pill.dataset.ticker;
            if (category === 'all') {
                pill.style.display = 'flex';
            } else {
                const categoryTickers = CATEGORY_MAP[category] || [];
                pill.style.display = categoryTickers.includes(ticker) ? 'flex' : 'none';
            }
        });
    }

    // Show/hide subtype filter based on ownership selection
    function updateSubtypeButtonVisibility() {
        const subtypeContainer = document.getElementById('subtype-filter-container');

        // Only show subtype filter if "non-franchise" is selected AND "franchise" is not
        if (ownershipModel.has('non-franchise') && !ownershipModel.has('franchise')) {
            subtypeContainer.style.display = 'block';
        } else {
            subtypeContainer.style.display = 'none';
            // Reset subtypes to all if container is hidden
            subtypes.clear();
            subtypes.add('licensed');
            subtypes.add('corporate');
            subtypes.add('independent');
            subtypes.add('unknown');
            document.querySelectorAll('.subtype-btn').forEach(b => b.classList.add('active'));
        }
    }

    async function getLocationAddress(location) {
        // Return existing address if available and not generic
        if (location.a && location.a !== 'US Location (OSM)') {
            return location.a;
        }

        // Check if coordinates exist
        if (location.lat === undefined || location.lng === undefined) {
            return 'Location data pending';
        }

        // Use batch geocoding cache for efficient reverse geocoding
        try {
            return await GeocodeCache.get(location.lat, location.lng);
        } catch (e) {
            console.warn('Geocoding error for location', location.id, e);
            return 'Address unavailable';
        }
    }

    function showHighPerformers() {
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));
        const highPerformers = visible.filter(loc => loc.s >= 80)
            .sort((a, b) => b.s - a.s);

        const performersPanel = document.getElementById('high-performers-panel');
        const performersContent = document.getElementById('high-performers-content');

        // Update the stat card count
        document.getElementById('high-score-count').textContent = highPerformers.length;

        if (highPerformers.length === 0) {
            performersContent.innerHTML = '<p style="padding: 12px; text-align: center; color: var(--text-light); font-size: 0.85rem;">No high performers in current selection</p>';
            performersPanel.classList.remove('hidden');
            highPerformersOpen = true;
            return;
        }

        // First render the items (with placeholder addresses)
        performersContent.innerHTML = highPerformers.map((loc, idx) => {
            const tier = getScoreTier(loc.s);
            // Use existing address or placeholder for now
            const address = (loc.a && loc.a !== 'US Location (OSM)') ? loc.a : 'Loading location...';

            return `
                <div class="score-item" data-index="${idx}" data-location-id="${loc.id}">
                    <div class="score-circle" style="background: ${getLightBackground(tier.color)}; border-color: ${tier.color}; color: ${tier.color};">
                        ${Math.round(loc.s)}
                    </div>
                    <div class="score-item-content">
                        <div class="score-item-brand">${loc.n || 'Unknown'}</div>
                        <div class="score-item-address">${address}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to performer items
        performersContent.querySelectorAll('.score-item').forEach((item, idx) => {
            item.onclick = () => navigateToPerformer(highPerformers[idx]);
        });

        // Perform reverse geocoding for locations without addresses
        highPerformers.forEach(async (loc, idx) => {
            if (!loc.a || loc.a === 'US Location (OSM)') {
                const address = await getLocationAddress(loc);
                const itemEl = performersContent.querySelector(`[data-location-id="${loc.id}"] .score-item-address`);
                if (itemEl) {
                    itemEl.textContent = address;
                }
            }
        });

        performersPanel.classList.remove('hidden');
        highPerformersOpen = true;
    }

    function hideHighPerformers() {
        const performersPanel = document.getElementById('high-performers-panel');
        performersPanel.classList.add('hidden');
        highPerformersOpen = false;
    }

    function toggleHighPerformers() {
        const panel = document.getElementById('high-performers-panel');
        if (panel) {
            highPerformersOpen = !highPerformersOpen;
            if (highPerformersOpen) {
                showHighPerformers();
            } else {
                hideHighPerformers();
            }
        }
    }

    function showCompetitorAnalysis() {
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));

        // Extract all unique competitors (locations from other brands)
        const competitors = [];
        const seenIds = new Set();

        visible.forEach(loc => {
            if (!seenIds.has(loc.id)) {
                competitors.push(loc);
                seenIds.add(loc.id);
            }
        });

        // Sort by score descending
        competitors.sort((a, b) => b.s - a.s);

        const panel = document.getElementById('competitor-analysis-panel');
        const content = document.getElementById('competitor-analysis-content');

        // Update stat card count
        document.getElementById('competitor-count').textContent = competitors.length;

        if (competitors.length === 0) {
            content.innerHTML = '<p style="padding: 12px; text-align: center; color: var(--text-light); font-size: 0.85rem;">No competitors in visible area</p>';
            panel.classList.remove('hidden');
            competitorAnalysisOpen = true;
            return;
        }

        // Render competitor list
        content.innerHTML = competitors.map((loc, idx) => {
            const tier = getScoreTier(loc.s);
            const address = (loc.a && loc.a !== 'US Location (OSM)') ? loc.a : 'Loading location...';

            return `
                <div class="score-item" data-index="${idx}" data-location-id="${loc.id}">
                    <div class="score-circle" style="background: ${getLightBackground(tier.color)}; border-color: ${tier.color}; color: ${tier.color};">
                        ${Math.round(loc.s)}
                    </div>
                    <div class="score-item-content">
                        <div class="score-item-brand">${loc.n || 'Unknown'}</div>
                        <div class="score-item-address">${address}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers
        content.querySelectorAll('.score-item').forEach((item, idx) => {
            item.onclick = () => navigateToCompetitor(competitors[idx]);
        });

        // Perform reverse geocoding for locations without addresses
        competitors.forEach(async (loc, idx) => {
            if (!loc.a || loc.a === 'US Location (OSM)') {
                const address = await getLocationAddress(loc);
                const itemEl = content.querySelector(`[data-location-id="${loc.id}"] .score-item-address`);
                if (itemEl) {
                    itemEl.textContent = address;
                }
            }
        });

        panel.classList.remove('hidden');
        competitorAnalysisOpen = true;
    }

    function hideCompetitorAnalysis() {
        const panel = document.getElementById('competitor-analysis-panel');
        panel.classList.add('hidden');
        competitorAnalysisOpen = false;
    }

    function toggleCompetitorAnalysis() {
        const panel = document.getElementById('competitor-analysis-panel');
        if (panel) {
            competitorAnalysisOpen = !competitorAnalysisOpen;
            if (competitorAnalysisOpen) {
                showCompetitorAnalysis();
            } else {
                hideCompetitorAnalysis();
            }
        }
    }

    function navigateToCompetitor(location) {
        // Close the competitor list
        hideCompetitorAnalysis();

        // Pan to the location
        map.setView([location.lat, location.lng], 14);

        // Find and open the marker popup
        setTimeout(() => {
            if (clusterGroup) {
                // Try to find the marker in the cluster group
                let foundMarker = null;
                clusterGroup.eachLayer(layer => {
                    if (layer.locationData &&
                        layer.locationData.lat === location.lat &&
                        layer.locationData.lng === location.lng) {
                        foundMarker = layer;
                    }
                });

                if (foundMarker) {
                    foundMarker.openPopup();
                    // Highlight the marker briefly
                    const originalStyle = foundMarker.options;
                    foundMarker.setStyle({
                        weight: 4,
                        opacity: 1,
                        fillOpacity: 1
                    });
                    setTimeout(() => {
                        foundMarker.setStyle(originalStyle);
                    }, 1500);
                }
            }
        }, 300);
    }

    function showScoreSlider() {
        const modal = document.getElementById('score-slider-modal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function hideScoreSlider() {
        const modal = document.getElementById('score-slider-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    function updateScoreSliderDisplay() {
        const sliderMin = document.getElementById('slider-min');
        const sliderMax = document.getElementById('slider-max');
        const minValue = document.getElementById('slider-min-value');
        const maxValue = document.getElementById('slider-max-value');

        if (minValue) minValue.textContent = sliderMin.value;
        if (maxValue) maxValue.textContent = sliderMax.value;
    }

    function updatePanelSliderDisplay() {
        const panelSliderMin = document.getElementById('panel-slider-min');
        const panelSliderMax = document.getElementById('panel-slider-max');
        const panelMinValue = document.getElementById('panel-slider-min-value');
        const panelMaxValue = document.getElementById('panel-slider-max-value');

        if (panelMinValue && panelSliderMin) panelMinValue.textContent = panelSliderMin.value;
        if (panelMaxValue && panelSliderMax) panelMaxValue.textContent = panelSliderMax.value;
    }

    function updatePanelScoreDisplay() {
        const scoreMin = document.getElementById('score-min');
        const scoreMax = document.getElementById('score-max');
        const minLabel = document.getElementById('score-min-label');
        const maxLabel = document.getElementById('score-max-label');

        if (minLabel && scoreMin) minLabel.textContent = scoreMin.value;
        if (maxLabel && scoreMax) maxLabel.textContent = scoreMax.value;
    }

    function applyScoreFilter() {
        const sliderMin = document.getElementById('slider-min');
        const sliderMax = document.getElementById('slider-max');

        if (!sliderMin || !sliderMax) return;

        const min = parseInt(sliderMin.value);
        const max = parseInt(sliderMax.value);

        scoreFilter.min = min;
        scoreFilter.max = max;

        // Schedule map refresh with debouncing to prevent excessive updates during slider drag
        scheduleRefreshMap();
    }

    // ===== NEW LOCATION PANEL FUNCTIONS =====
    let locationPanelOpen = true; // Default state is open

    function toggleLocationPanel() {
        const panel = document.getElementById('location-panel');
        if (panel) {
            locationPanelOpen = !locationPanelOpen;
            if (locationPanelOpen) {
                panel.classList.remove('hidden');
                updateLocationList();
            } else {
                panel.classList.add('hidden');
            }
        }
    }

    function updateLocationList() {
        // Get current map bounds
        if (!map) return;

        const bounds = map.getBounds();
        const visibleLocations = allLocations.filter(loc => {
            // Check if location is within bounds and from active ticker
            return activeTickers.has(loc.ticker) &&
                   bounds.contains([loc.lat, loc.lng]) &&
                   loc.s >= scoreFilter.min &&
                   loc.s <= scoreFilter.max;
        });

        renderLocationList(visibleLocations);
    }

    function renderLocationList(locations) {
        const container = document.getElementById('location-list-content');
        const panel = document.getElementById('location-panel');
        const indicator = document.getElementById('locations-indicator');
        if (!container || !panel) return;

        // Sort locations by score descending
        const sorted = locations.sort((a, b) => b.s - a.s);

        if (sorted.length === 0) {
            // No locations visible - close the panel automatically
            if (!panel.classList.contains('hidden')) {
                panel.classList.add('hidden');
                locationPanelOpen = false;
            }

            // Hide the indicator
            if (indicator) {
                indicator.classList.remove('active');
            }

            container.innerHTML = `
                <div class="location-empty-state">
                    <div><i class="fa-solid fa-map-pin"></i></div>
                    <div>No locations in current view</div>
                </div>
            `;
            return;
        }

        // Locations exist - show the indicator
        if (indicator) {
            indicator.classList.add('active');
        }

        // Locations exist - keep panel open if user clicked to open it
        // (panel open state is managed by toggleLocationPanel)

        container.innerHTML = sorted.map(loc => {
            // Use the main address field (loc.a), show placeholder if it's generic
            const address = (loc.a && loc.a !== 'US Location (OSM)') ? loc.a : 'Location data pending';
            const name = loc.name || loc.n || 'Unknown';
            const score = Math.round(loc.s);
            const scoreTier = getScoreTier(score);

            // Determine score class
            let scoreClass = 'excellent';
            if (score < 80) scoreClass = score >= 65 ? 'good' : (score >= 50 ? 'fair' : 'poor');

            return `
                <div class="location-item" data-lat="${loc.lat}" data-lng="${loc.lng}">
                    <div class="location-item-info">
                        <div class="location-item-name">${name}</div>
                        <div class="location-item-address">${address}</div>
                    </div>
                    <div class="location-item-score">
                        <div class="location-score-circle ${scoreClass}">${score}</div>
                    </div>
                </div>
            `;
        }).join('');

        // Add click handlers to location items
        container.querySelectorAll('.location-item').forEach(item => {
            item.onclick = () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                navigateToLocation(lat, lng);
            };
        });
    }

    function navigateToLocation(lat, lng) {
        // Pan to the location
        map.setView([lat, lng], 14);

        // Find and open the marker popup
        setTimeout(() => {
            let foundMarker = null;

            if (clusterGroup) {
                clusterGroup.eachLayer(layer => {
                    if (layer.locationData &&
                        Math.abs(layer.locationData.lat - lat) < 0.0001 &&
                        Math.abs(layer.locationData.lng - lng) < 0.0001) {
                        foundMarker = layer;
                    }
                });
            }

            if (!foundMarker && markersLayer) {
                markersLayer.eachLayer(layer => {
                    if (layer.locationData &&
                        Math.abs(layer.locationData.lat - lat) < 0.0001 &&
                        Math.abs(layer.locationData.lng - lng) < 0.0001) {
                        foundMarker = layer;
                    }
                });
            }

            if (foundMarker) {
                foundMarker.openPopup();
                // Highlight the marker briefly
                const originalStyle = foundMarker.options;
                foundMarker.setStyle({
                    weight: 4,
                    opacity: 1,
                    fillOpacity: 1
                });
                setTimeout(() => {
                    foundMarker.setStyle(originalStyle);
                }, 1500);
            }
        }, 300);
    }

    // Generic KPI number animation - reusable for any KPI tile
    function animateKpiNumber(elementId, fromValue, toValue, options = {}) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const steps = options.steps || 30;
        const updateInterval = options.updateInterval || 16; // 60fps
        const formatter = options.formatter || ((v) => Math.round(v));

        if (fromValue === toValue) {
            element.textContent = formatter(toValue);
            return;
        }

        const difference = toValue - fromValue;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            // Ease-in-out quadratic
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress;

            const currentValue = fromValue + difference * easeProgress;
            element.textContent = formatter(currentValue);

            if (currentStep >= steps) {
                clearInterval(interval);
                element.textContent = formatter(toValue);
            }
        }, updateInterval);
    }

    // Animated average score display (wrapper for generic function)
    function animateAvgScore(newScore) {
        const avgScoreEl = document.getElementById('avg-score');
        if (!avgScoreEl) return;

        const currentScore = parseInt(avgScoreEl.textContent) || 0;
        animateKpiNumber('avg-score', currentScore, newScore);
    }

    // --- Debounced Map Refresh System ---
    let refreshMapDebounceTimer = null;
    function scheduleRefreshMap() {
        // Cancel previous timer if exists
        if (refreshMapDebounceTimer) {
            clearTimeout(refreshMapDebounceTimer);
        }
        // Schedule new refresh after 200ms of inactivity
        refreshMapDebounceTimer = setTimeout(() => {
            refreshMap();
            refreshMapDebounceTimer = null;
        }, 200);
    }

    // --- Keyboard Shortcuts System ---
    const KeyboardShortcuts = {
        init() {
            document.addEventListener('keydown', (e) => this.handleKeydown(e));
        },
        handleKeydown(e) {
            // Don't trigger shortcuts if user is typing in input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            const isCtrl = e.ctrlKey || e.metaKey;
            const isShift = e.shiftKey;

            // Ctrl+F: Toggle search panel
            if (isCtrl && e.key === 'f') {
                e.preventDefault();
                const searchToggleBtn = document.querySelector('[onclick*="toggleSearchPanel"]');
                if (searchToggleBtn) {
                    searchToggleBtn.click();
                } else {
                    // Fallback: toggle search panel manually
                    const searchPanel = document.getElementById('search-panel');
                    if (searchPanel) {
                        searchPanel.classList.toggle('hidden');
                        NotificationManager.info('Search panel toggled');
                    }
                }
            }

            // Ctrl+H: Toggle heatmap
            if (isCtrl && e.key === 'h') {
                e.preventDefault();
                const heatmapBtn = document.getElementById('btn-heatmap-toggle');
                if (heatmapBtn) {
                    heatmapBtn.click();
                    NotificationManager.info(`Heatmap ${isHeatmapView ? 'disabled' : 'enabled'}`);
                }
            }

            // Ctrl+C: Toggle clustering
            if (isCtrl && e.key === 'c') {
                e.preventDefault();
                const clusterBtn = document.getElementById('btn-cluster-toggle');
                if (clusterBtn) {
                    clusterBtn.click();
                    NotificationManager.info(`Clustering ${isClusterView ? 'disabled' : 'enabled'}`);
                }
            }

            // Ctrl+R: Reset view
            if (isCtrl && e.key === 'r') {
                e.preventDefault();
                const resetBtn = document.getElementById('btn-reset-view');
                if (resetBtn) {
                    resetBtn.click();
                    NotificationManager.info('View reset to default');
                }
            }

            // Ctrl+Shift+L: Load geolocation
            if (isCtrl && isShift && e.key === 'l') {
                e.preventDefault();
                const geoBtn = document.getElementById('btn-locate');
                if (geoBtn) {
                    geoBtn.click();
                    NotificationManager.info('Locating...');
                }
            }

            // ?: Show keyboard shortcuts help
            if (e.key === '?' && !isCtrl) {
                e.preventDefault();
                this.showHelp();
            }
        },
        showHelp() {
            const helpText = `
⌨️ Keyboard Shortcuts:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ctrl+F       Search/Filter
Ctrl+H       Toggle Heatmap
Ctrl+C       Toggle Clustering
Ctrl+R       Reset View
Ctrl+Shift+L  Use Geolocation
?            Show this help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
            `;
            NotificationManager.show(helpText, 'info', 5000);
        }
    };

    // --- Multi-Touch Gesture Manager (Phase 3) ---
    const MultiTouchManager = {
        touches: [],
        initialDistance: 0,
        initialRotation: 0,
        isMultiTouch: false,

        init() {
            const mapContainer = document.getElementById('map-container');
            if (!mapContainer) return;

            mapContainer.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
            mapContainer.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
            mapContainer.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        },

        handleTouchStart(e) {
            this.touches = Array.from(e.touches);
            this.isMultiTouch = this.touches.length >= 2;

            if (this.isMultiTouch) {
                e.preventDefault();
                this.initialDistance = this.calculateDistance(this.touches[0], this.touches[1]);
                this.initialRotation = this.calculateRotation(this.touches[0], this.touches[1]);
                // Disable map's default touch handling during multi-touch
                if (map) {
                    map.dragging.disable();
                    map.touchZoom.disable();
                }
            }
        },

        handleTouchMove(e) {
            if (!this.isMultiTouch || this.touches.length < 2) return;
            e.preventDefault();

            const currentTouches = Array.from(e.touches);
            const currentDistance = this.calculateDistance(currentTouches[0], currentTouches[1]);
            const currentRotation = this.calculateRotation(currentTouches[0], currentTouches[1]);

            // Two-finger pan/drag - move map
            const midX = (currentTouches[0].clientX + currentTouches[1].clientX) / 2;
            const midY = (currentTouches[0].clientY + currentTouches[1].clientY) / 2;
            const oldMidX = (this.touches[0].clientX + this.touches[1].clientX) / 2;
            const oldMidY = (this.touches[0].clientY + this.touches[1].clientY) / 2;

            const deltaX = midX - oldMidX;
            const deltaY = midY - oldMidY;

            // Convert screen coordinates to map movement
            const mapContainer = document.getElementById('map-container');
            if (map && mapContainer && (deltaX !== 0 || deltaY !== 0)) {
                const rect = mapContainer.getBoundingClientRect();
                const center = map.getCenter();
                const point = map.latLngToContainerPoint(center);
                const newPoint = L.point(point.x - deltaX, point.y - deltaY);
                const newCenter = map.containerPointToLatLng(newPoint);
                map.setView(newCenter, map.getZoom(), { animate: false });
            }

            // Store current touches for next move
            this.touches = currentTouches;
        },

        handleTouchEnd(e) {
            if (this.isMultiTouch) {
                // Re-enable default map touch handling
                if (map) {
                    map.dragging.enable();
                    map.touchZoom.enable();
                }
                this.isMultiTouch = false;
                this.touches = [];
            }
        },

        calculateDistance(touch1, touch2) {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        },

        calculateRotation(touch1, touch2) {
            const dx = touch2.clientX - touch1.clientX;
            const dy = touch2.clientY - touch1.clientY;
            return Math.atan2(dy, dx) * (180 / Math.PI);
        }
    };

    initMap();
    KeyboardShortcuts.init();
    DataStatusManager.init();
    MobilePanelManager.init();
    MultiTouchManager.init();
});
