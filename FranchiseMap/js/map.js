document.addEventListener('DOMContentLoaded', () => {
    // --- Config ---
    const ROARK_TICKERS = ['INSPIRE', 'FOCUS', 'DRIVEN', 'ROARK'];
    const RADIUS_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

    // Category mappings for filters
    const CATEGORY_MAP = {
        'qsr': ['MCD', 'SBUX', 'YUM', 'QSR', 'WEN', 'DPZ', 'CMG', 'JACK', 'WING', 'SHAK', 'PZZA', 'DNUT', 'NATH', 'INSPIRE', 'FOCUS'],
        'casual': ['DENN', 'DIN', 'CBRL', 'TXRH', 'BLMN', 'CAKE', 'BJRI', 'CHUY', 'EAT', 'DRI', 'RRGB', 'PLAY'],
        'hotels': ['MAR', 'HLT', 'H', 'IHG', 'WH', 'CHH', 'BW', 'G6', 'VAC', 'TNL'],
        'services': ['MCW', 'PLNT', 'XPOF', 'HRB', 'SERV', 'ROL', 'HLE', 'CAR', 'UHAL', 'DRIVEN'],
        'private': ['SUB', 'CFA', 'PANDA', 'DQ', 'LCE', 'JM', 'FIVE', 'CANE', 'WHATA', 'ZAX', 'BO', 'WAWA', 'SHEETZ', 'INNOUT', 'PANERA', 'DUTCH']
    };

    // Score tier configurations
    const SCORE_TIERS = {
        excellent: { min: 80, color: '#22c55e', label: 'Excellent' },
        good: { min: 65, color: '#84cc16', label: 'Good' },
        fair: { min: 50, color: '#eab308', label: 'Fair' },
        poor: { min: 0, color: '#ef4444', label: 'Poor' }
    };

    // --- State ---
    let map, clusterGroup, markersLayer = L.layerGroup(), buildingsLayer, heatLayer;
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

    function getColor(str) {
        if (tickerColors[str]) return tickerColors[str];
        const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        tickerColors[str] = color;
        colorIndex++;
        return color;
    }

    function getScoreTier(score) {
        if (score >= SCORE_TIERS.excellent.min) return SCORE_TIERS.excellent;
        if (score >= SCORE_TIERS.good.min) return SCORE_TIERS.good;
        if (score >= SCORE_TIERS.fair.min) return SCORE_TIERS.fair;
        return SCORE_TIERS.poor;
    }

    function initMap() {
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' });
        const dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, attribution: '© CartoDB' });

        map = L.map('map', { zoomControl: false, preferCanvas: true, layers: [street] }).setView([39.82, -98.58], 4);

        const baseMaps = { "Street": street, "Satellite": satellite, "Dark": dark };
        const dummy3D = L.layerGroup();
        L.control.layers(baseMaps, { "3D Buildings": dummy3D }, { position: 'bottomright' }).addTo(map);
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

        clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40, chunkedLoading: true });
        map.addLayer(clusterGroup);

        buildingsLayer = new OSMBuildings(map);
        map.on('overlayadd', e => { if(e.layer === dummy3D) loadBuildings(); });
        map.on('overlayremove', e => { if(e.layer === dummy3D) buildingsLayer.data([]); });
        map.on('moveend', () => {
            if(map.hasLayer(dummy3D)) loadBuildings();
            updateVisibleStats();
        });
        map.on('zoomend', updateVisibleStats);

        setupRail();
        setupFilters();
        setupAdvancedControls();
        loadManifest();
    }

    function loadManifest() {
        fetch('data/manifest.json')
            .then(res => res.json())
            .then(data => {
                manifest = data;
                renderLegend(manifest);
                // Select all locations by default on page load
                selectAll();
                updateDashboardStats();
            })
            .catch(e => {
                console.log("Data not yet generated. Run GitHub Action.");
                document.getElementById('brand-legend').innerHTML = '<p style="color:#999;font-size:0.85rem;">No data available. Run the GitHub Action to generate map data.</p>';
            });
    }

    function renderLegend(manifestData) {
        const container = document.getElementById('brand-legend');
        container.innerHTML = '';

        manifestData.forEach(item => {
            const color = getColor(item.ticker);
            const isRoark = ROARK_TICKERS.includes(item.ticker);

            const btn = document.createElement('button');
            btn.className = 'brand-pill' + (isRoark ? ' roark' : '');
            btn.dataset.ticker = item.ticker;
            btn.dataset.file = item.file;

            btn.innerHTML = `
                <span class="brand-dot" style="background-color: ${color}"></span>
                <div class="brand-info">
                    <div class="brand-name">${item.brands[0]}</div>
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
    }

    function toggleTicker(ticker, filePath) {
        if (activeTickers.has(ticker)) {
            activeTickers.delete(ticker);
            refreshMap();
        } else {
            activeTickers.add(ticker);
            if (loadedTickers.has(ticker)) {
                refreshMap();
            } else {
                fetch(filePath).then(r => r.json()).then(data => {
                    allLocations = allLocations.concat(data);
                    loadedTickers.add(ticker);
                    refreshMap();
                });
            }
        }
        updateLocationCount();
        updateDashboardStats();
    }

    function refreshMap() {
        clusterGroup.clearLayers();
        markersLayer.clearLayers();
        highlightedMarkers = [];

        // Apply score filter
        const visible = allLocations.filter(loc =>
            activeTickers.has(loc.ticker) &&
            loc.s >= scoreFilter.min &&
            loc.s <= scoreFilter.max
        );

        // Update proximity index with visible locations
        proximityIndex.addLocations(visible);

        const markers = visible.map(createMarker);

        if (isHeatmapView) {
            updateHeatmap(visible);
        } else if (heatLayer) {
            map.removeLayer(heatLayer);
        }

        if (isClusterView && !isHeatmapView) {
            clusterGroup.addLayers(markers);
            if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup);
            if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
        } else {
            markers.forEach(m => markersLayer.addLayer(m));
            if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);
            if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
        }

        updateLocationCount();
        updateDashboardStats();

        // Update visible stats after map refresh (slight delay for rendering)
        setTimeout(updateVisibleStats, 100);
    }

    function updateHeatmap(locations) {
        if (heatLayer) {
            map.removeLayer(heatLayer);
        }

        if (locations.length === 0 || typeof L.heatLayer === 'undefined') return;

        const heatData = locations.map(loc => [loc.lat, loc.lng, loc.s / 100]);
        heatLayer = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.0: '#3b82f6',
                0.25: '#22c55e',
                0.5: '#eab308',
                0.75: '#f97316',
                1.0: '#ef4444'
            }
        }).addTo(map);
    }

    function updateLocationCount() {
        const visible = allLocations.filter(loc =>
            activeTickers.has(loc.ticker) &&
            loc.s >= scoreFilter.min &&
            loc.s <= scoreFilter.max
        );
        document.getElementById('visible-count').textContent = visible.length.toLocaleString();
    }

    function updateDashboardStats() {
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));

        if (visible.length === 0) {
            document.getElementById('avg-score').textContent = '--';
            document.getElementById('high-score-count').textContent = '0';
            document.getElementById('brands-active').textContent = '0';
            return;
        }

        const avgScore = Math.round(visible.reduce((sum, loc) => sum + loc.s, 0) / visible.length);
        const highScoreCount = visible.filter(loc => loc.s >= 80).length;
        const brandsActive = activeTickers.size;

        document.getElementById('avg-score').textContent = avgScore;
        document.getElementById('high-score-count').textContent = highScoreCount.toLocaleString();
        document.getElementById('brands-active').textContent = brandsActive;

        // Update score distribution chart
        updateScoreDistribution(visible);
    }

    function updateVisibleStats() {
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

        if (visibleLocations.length === 0) {
            document.getElementById('avg-score').textContent = '--';
            document.getElementById('high-score-count').textContent = '0';
            return;
        }

        // Calculate stats for visible locations only
        const avgScore = Math.round(visibleLocations.reduce((sum, loc) => sum + loc.s, 0) / visibleLocations.length);
        const highScoreCount = visibleLocations.filter(loc => loc.s >= 80).length;

        // Use animated score update
        animateAvgScore(avgScore);
        document.getElementById('high-score-count').textContent = highScoreCount.toLocaleString();

        // Update score distribution for visible locations
        updateScoreDistribution(visibleLocations);

        // Update location list if panel is open
        if (locationPanelOpen) {
            updateLocationList();
        }
    }

    function updateScoreDistribution(locations) {
        const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
        locations.forEach(loc => {
            if (loc.s >= 80) distribution.excellent++;
            else if (loc.s >= 65) distribution.good++;
            else if (loc.s >= 50) distribution.fair++;
            else distribution.poor++;
        });

        const total = locations.length || 1;
        document.getElementById('dist-excellent').style.width = `${(distribution.excellent / total) * 100}%`;
        document.getElementById('dist-good').style.width = `${(distribution.good / total) * 100}%`;
        document.getElementById('dist-fair').style.width = `${(distribution.fair / total) * 100}%`;
        document.getElementById('dist-poor').style.width = `${(distribution.poor / total) * 100}%`;
    }

    function createMarker(loc) {
        const color = getColor(loc.ticker);
        const tier = getScoreTier(loc.s);

        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: 7,
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
                    </div>
                </div>
                <div class="popup-address">${loc.a}</div>

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
        showComparisonPanel();
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
        document.getElementById('comparison-panel').classList.add('visible');
    }

    function hideComparisonPanel() {
        document.getElementById('comparison-panel').classList.remove('visible');
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
        showComparisonPanel();

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
        container.innerHTML = '';

        if (comparisonLocations.length === 0) {
            container.innerHTML = '<div class="comparison-empty">Add locations to compare</div>';
            return;
        }

        comparisonLocations.forEach(loc => {
            const tier = getScoreTier(loc.s);
            const color = getColor(loc.ticker);
            const subScores = loc.ss || {};

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
                <div class="comp-score" style="color:${tier.color}">${loc.s}</div>
                <div class="comp-bars">
                    <div class="comp-bar-row">
                        <span>Market</span>
                        <div class="comp-bar"><div style="width:${subScores.marketPotential || 0}%;background:#3b82f6"></div></div>
                    </div>
                    <div class="comp-bar-row">
                        <span>Comp</span>
                        <div class="comp-bar"><div style="width:${subScores.competitiveLandscape || 0}%;background:#22c55e"></div></div>
                    </div>
                    <div class="comp-bar-row">
                        <span>Access</span>
                        <div class="comp-bar"><div style="width:${subScores.accessibility || 0}%;background:#eab308"></div></div>
                    </div>
                    <div class="comp-bar-row">
                        <span>Site</span>
                        <div class="comp-bar"><div style="width:${subScores.siteCharacteristics || 0}%;background:#8b5cf6"></div></div>
                    </div>
                </div>
            `;
            container.appendChild(card);
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

    function setupRail() {
        document.getElementById('btn-home').onclick = () => map.setView([39.82, -98.58], 4);

        // Near Me button with error handling
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
            alert('Unable to access your location. Please ensure:\n1. Location services are enabled\n2. Browser has permission to access location\n3. You are viewing over HTTPS (if required)');
        });

        document.getElementById('btn-cluster-toggle').onclick = function() {
            isClusterView = !isClusterView;
            this.classList.toggle('active');
            refreshMap();
        };

        document.getElementById('btn-heatmap-toggle').onclick = function() {
            isHeatmapView = !isHeatmapView;
            this.classList.toggle('active');
            if (isHeatmapView) {
                document.getElementById('btn-cluster-toggle').classList.remove('active');
                isClusterView = false;
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

        // Slider inputs
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
                updateScoreSliderDisplay();
                applyScoreFilter();
            };

            sliderMax.oninput = function() {
                const max = parseInt(this.value);
                const min = parseInt(sliderMin.value);
                if (max < min) {
                    this.value = min;
                    return;
                }
                updateScoreSliderDisplay();
                applyScoreFilter();
            };
        }

        // Reset slider button
        const resetBtn = document.getElementById('reset-slider');
        if (resetBtn) {
            resetBtn.onclick = function() {
                sliderMin.value = 0;
                sliderMax.value = 100;
                updateScoreSliderDisplay();
                applyScoreFilter();
            };
        }

        // Initialize slider with current values
        if (sliderMin && sliderMax) {
            sliderMin.value = scoreFilter.min;
            sliderMax.value = scoreFilter.max;
            updateScoreSliderDisplay();
        }

        // Panel-based score filter sliders
        const scoreMin = document.getElementById('score-min');
        const scoreMax = document.getElementById('score-max');

        if (scoreMin && scoreMax) {
            scoreMin.oninput = function() {
                const min = parseInt(this.value);
                const max = parseInt(scoreMax.value);
                if (min > max) {
                    this.value = max;
                    return;
                }
                updatePanelScoreDisplay();
                applyScoreFilter();
            };

            scoreMax.oninput = function() {
                const max = parseInt(this.value);
                const min = parseInt(scoreMin.value);
                if (max < min) {
                    this.value = min;
                    return;
                }
                updatePanelScoreDisplay();
                applyScoreFilter();
            };
        }

        // Reset panel score filter button
        const resetScoreBtn = document.getElementById('reset-score-filter');
        if (resetScoreBtn) {
            resetScoreBtn.onclick = function() {
                if (scoreMin && scoreMax) {
                    scoreMin.value = 0;
                    scoreMax.value = 100;
                    updatePanelScoreDisplay();
                    applyScoreFilter();
                }
            };
        }

        // Initialize panel sliders with current values
        if (scoreMin && scoreMax) {
            scoreMin.value = scoreFilter.min;
            scoreMax.value = scoreFilter.max;
            updatePanelScoreDisplay();
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
            }
        });
    }

    function performSearch(query) {
        const searchResults = document.getElementById('search-results');
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=us`;

        fetch(url)
            .then(res => res.json())
            .then(results => {
                searchResults.innerHTML = '';
                if (results.length === 0) {
                    searchResults.innerHTML = '<div style="padding: 8px; color: var(--text-light); font-size: 0.85rem;">No results found</div>';
                    return;
                }

                results.forEach(result => {
                    const resultEl = document.createElement('div');
                    resultEl.className = 'search-result-item';
                    resultEl.textContent = result.display_name.split(',')[0];
                    resultEl.onclick = function() {
                        const bbox = result.boundingbox;
                        map.fitBounds([
                            [parseFloat(bbox[0]), parseFloat(bbox[2])],
                            [parseFloat(bbox[1]), parseFloat(bbox[3])]
                        ]);
                    };
                    searchResults.appendChild(resultEl);
                });
            })
            .catch(err => {
                console.error('Search error:', err);
                searchResults.innerHTML = '<div style="padding: 8px; color: red; font-size: 0.85rem;">Search error</div>';
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
            loc.s <= scoreFilter.max
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
                            allLocations = allLocations.concat(data);
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

        manifest.filter(item => ROARK_TICKERS.includes(item.ticker)).forEach(item => {
            const pill = document.querySelector(`.brand-pill[data-ticker="${item.ticker}"]`);
            if (pill && !activeTickers.has(item.ticker)) {
                activeTickers.add(item.ticker);
                pill.classList.add('active');

                if (!loadedTickers.has(item.ticker)) {
                    promises.push(
                        fetch(item.file).then(r => r.json()).then(data => {
                            allLocations = allLocations.concat(data);
                            loadedTickers.add(item.ticker);
                        })
                    );
                }
            }
        });

        Promise.all(promises).then(() => refreshMap());
    }

    function deselectRoark() {
        ROARK_TICKERS.forEach(ticker => {
            activeTickers.delete(ticker);
            const pill = document.querySelector(`.brand-pill[data-ticker="${ticker}"]`);
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

    function toggleHighPerformers() {
        const performersPanel = document.getElementById('high-performers-panel');
        const isCurrentlyHidden = performersPanel.classList.contains('hidden');

        if (isCurrentlyHidden) {
            // Opening - show high performers
            showHighPerformers();
        } else {
            // Closing
            hideHighPerformers();
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

        performersContent.innerHTML = highPerformers.map((loc, idx) => {
            const tier = getScoreTier(loc.s);
            // Prefer actual address from location object, fallback to OSM default
            const address = loc.a && loc.a !== 'US Location (OSM)' ? loc.a : 'Location data pending';

            return `
                <div class="score-item" data-index="${idx}">
                    <div class="score-circle" style="background: ${tier.color};">
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

        performersPanel.classList.remove('hidden');
        highPerformersOpen = true;
    }

    function hideHighPerformers() {
        const performersPanel = document.getElementById('high-performers-panel');
        performersPanel.classList.add('hidden');
        highPerformersOpen = false;
    }

    function navigateToPerformer(location) {
        // Close the high performers list
        hideHighPerformers();

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

        // Refresh map with new filter
        refreshMap();
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

    // Animated average score display
    function animateAvgScore(newScore) {
        const avgScoreEl = document.getElementById('avg-score');
        if (!avgScoreEl) return;

        const currentScore = parseInt(avgScoreEl.textContent) || 0;

        if (currentScore === newScore) return;

        const difference = newScore - currentScore;
        const steps = 30;
        let currentStep = 0;

        const interval = setInterval(() => {
            currentStep++;
            const progress = currentStep / steps;
            const easeProgress = progress < 0.5
                ? 2 * progress * progress
                : -1 + (4 - 2 * progress) * progress; // Ease-in-out

            const currentValue = Math.round(currentScore + difference * easeProgress);
            avgScoreEl.textContent = currentValue;

            if (currentStep >= steps) {
                clearInterval(interval);
                avgScoreEl.textContent = newScore;
            }
        }, 16); // 60fps
    }

    initMap();
});
