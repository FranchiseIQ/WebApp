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

    // --- State ---
    let map, clusterGroup, markersLayer = L.layerGroup(), buildingsLayer;
    let allLocations = [], loadedTickers = new Set(), activeTickers = new Set();
    let isClusterView = true, currentRadiusCircle;
    let manifest = [];
    let tickerColors = {};
    let highlightedMarkers = [];
    let colorIndex = 0;

    // Predefined unique color palette - 60+ distinct colors
    const COLOR_PALETTE = [
        // Primary brands - highly distinct
        '#FFC72C', '#00704A', '#D62300', '#E2203D', '#006491', '#FF8732', '#E31837', '#00A94F',
        '#5C2D91', '#1E90FF', '#FFD700', '#C8102E', '#003DA5', '#00A650', '#0072CE', '#B4975A',
        '#002855', '#6B6B6B', '#1C4587', '#0077C8', '#C4A052', '#00A5E3', '#E4002B',
        // Extended palette - QSR & Casual
        '#FF6B35', '#2EC4B6', '#9B5DE5', '#F15BB5', '#00BBF9', '#FEE440', '#8338EC', '#FF006E',
        '#3A86FF', '#FB5607', '#FFBE0B', '#8AC926', '#1982C4', '#6A4C93', '#FF595E', '#FFCA3A',
        // Hotels & Services
        '#8ECAE6', '#219EBC', '#023047', '#FFB703', '#FB8500', '#264653', '#2A9D8F', '#E9C46A',
        '#F4A261', '#E76F51', '#606C38', '#283618', '#DDA15E', '#BC6C25', '#780000', '#C1121F',
        // Private chains
        '#003049', '#D62828', '#F77F00', '#FCBF49', '#EAE2B7', '#14213D', '#FCA311', '#E5E5E5',
        '#000814', '#001D3D', '#003566', '#FFC300', '#FFD60A', '#4CC9F0', '#4361EE', '#3A0CA3',
        // Additional distinct colors
        '#7209B7', '#B5179E', '#560BAD', '#480CA8', '#3F37C9', '#4895EF', '#4EA8DE', '#48BFE3',
        '#56CFE1', '#64DFDF', '#72EFDD', '#80FFDB', '#FF9F1C', '#2EC4B6', '#CBF3F0', '#FFBF69'
    ];

    // Auto-generate unique color for each ticker
    function getColor(str) {
        if (tickerColors[str]) return tickerColors[str];

        // Assign next color from palette, cycling if needed
        const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length];
        tickerColors[str] = color;
        colorIndex++;

        return color;
    }

    function initMap() {
        // Layers
        const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OSM' });
        const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles © Esri' });

        map = L.map('map', { zoomControl: false, preferCanvas: true, layers: [street] }).setView([39.82, -98.58], 4);

        // Controls
        const baseMaps = { "Street": street, "Satellite": satellite };
        const dummy3D = L.layerGroup();
        L.control.layers(baseMaps, { "3D Buildings": dummy3D }, { position: 'bottomright' }).addTo(map);
        L.control.zoom({ position: 'topleft' }).addTo(map);

        // Geocoder (Search Bar) - Nominatim
        L.Control.geocoder({
            defaultMarkGeocode: false,
            placeholder: "Search city, zip, or address...",
            geocoder: L.Control.Geocoder.nominatim()
        })
        .on('markgeocode', function(e) {
            map.fitBounds(e.geocode.bbox);
        })
        .addTo(map);

        // Clustering
        clusterGroup = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 40, chunkedLoading: true });
        map.addLayer(clusterGroup);

        // 3D Building Logic (Toggle)
        buildingsLayer = new OSMBuildings(map);
        map.on('overlayadd', e => { if(e.layer === dummy3D) loadBuildings(); });
        map.on('overlayremove', e => { if(e.layer === dummy3D) buildingsLayer.data([]); });
        map.on('moveend', () => { if(map.hasLayer(dummy3D)) loadBuildings(); });

        setupRail();
        setupFilters();
        loadManifest();
    }

    function loadManifest() {
        fetch('data/manifest.json')
            .then(res => res.json())
            .then(data => {
                manifest = data;
                renderLegend(manifest);
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
                    <div class="brand-ticker">${item.ticker}</div>
                    <div class="brand-name">${item.brands[0]}</div>
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
    }

    function refreshMap() {
        clusterGroup.clearLayers();
        markersLayer.clearLayers();
        highlightedMarkers = [];

        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));
        const markers = visible.map(createMarker);

        if (isClusterView) {
            clusterGroup.addLayers(markers);
            if (!map.hasLayer(clusterGroup)) map.addLayer(clusterGroup);
            if (map.hasLayer(markersLayer)) map.removeLayer(markersLayer);
        } else {
            markers.forEach(m => markersLayer.addLayer(m));
            if (!map.hasLayer(markersLayer)) map.addLayer(markersLayer);
            if (map.hasLayer(clusterGroup)) map.removeLayer(clusterGroup);
        }

        updateLocationCount();
    }

    function updateLocationCount() {
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));
        document.getElementById('visible-count').textContent = visible.length.toLocaleString();
    }

    function createMarker(loc) {
        const color = getColor(loc.ticker);
        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: 6, fillColor: color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.9
        });

        // Store location data on marker for competitor highlighting
        marker.locationData = loc;

        // Popup Content with Methodology
        const scoreColor = loc.s >= 80 ? '#48bb78' : (loc.s >= 60 ? '#ecc94b' : '#f56565');
        const attrs = loc.at || {};

        // Calculate individual component scores for methodology display
        const demoScore = Math.min((attrs.medianIncome || 0) / 100000, 1.0) * 100;
        const compScore = Math.max(0, 1.0 - ((attrs.competitors || 0) * 0.15)) * 100;
        const accessScore = Math.min((attrs.traffic || 0) / 50000, 1.0) * 100;
        const siteScore = (attrs.visibility || 0);
        const walkScore = attrs.walkScore || 0;

        const html = `
            <div style="min-width:260px; font-family:sans-serif;">
                <h3 style="margin:0 0 5px 0;">${loc.n}</h3>
                <div style="color:#666; font-size:0.85rem; margin-bottom:10px;">${loc.a}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f0f0f0; padding:5px 10px; border-radius:4px;">
                    <span>Site Score</span>
                    <span class="score-badge" style="background:${scoreColor}">${loc.s}/100</span>
                </div>

                <div class="methodology-section">
                    <h4>Score Methodology</h4>
                    <div class="methodology-row">
                        <span class="methodology-label">Demographics (35%)</span>
                        <span class="methodology-value">${demoScore.toFixed(0)}</span>
                    </div>
                    <div class="methodology-row" style="padding-left:10px; font-size:0.7rem;">
                        <span>Median Income: $${((attrs.medianIncome || 0)/1000).toFixed(0)}k</span>
                        <span class="methodology-weight">${attrs._incomeSource || 'ACS Estimate'}</span>
                    </div>
                    <div class="methodology-row">
                        <span class="methodology-label">Competition (25%)</span>
                        <span class="methodology-value">${compScore.toFixed(0)}</span>
                    </div>
                    <div class="methodology-row" style="padding-left:10px; font-size:0.7rem;">
                        <span>Nearby Competitors: ${attrs.competitors || 0}</span>
                        <span class="methodology-weight">-15% per competitor</span>
                    </div>
                    <div class="methodology-row">
                        <span class="methodology-label">Accessibility (25%)</span>
                        <span class="methodology-value">${accessScore.toFixed(0)}</span>
                    </div>
                    <div class="methodology-row" style="padding-left:10px; font-size:0.7rem;">
                        <span>Traffic: ${(attrs.traffic || 0).toLocaleString()} AADT</span>
                        <span class="methodology-weight">${attrs._trafficSource || 'AADT Estimate'}</span>
                    </div>
                    <div class="methodology-row">
                        <span class="methodology-label">Site Quality (15%)</span>
                        <span class="methodology-value">${siteScore}</span>
                    </div>
                    <div class="methodology-row" style="padding-left:10px; font-size:0.7rem;">
                        <span>Visibility Score: ${attrs.visibility || 0}/100</span>
                    </div>
                    <div class="methodology-row" style="border-top:1px solid #ddd; margin-top:5px; padding-top:5px;">
                        <span class="methodology-label">Walk Score</span>
                        <span class="methodology-value">${walkScore}/100</span>
                    </div>
                    <div class="methodology-row" style="padding-left:10px; font-size:0.7rem;">
                        <span>${attrs._walkSource || 'Walk Score API'}</span>
                    </div>
                </div>

                <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                <label style="font-size:0.8rem; font-weight:bold;">Competitor Analysis Radius</label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="range" id="slider-${loc.id}" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="3">
                    <span id="label-${loc.id}" style="font-size:0.8rem; font-weight:bold; width:60px;">1.0 mi</span>
                </div>
                <div id="competitors-${loc.id}" style="font-size:0.75rem; color:#666; margin-top:5px;"></div>
            </div>
        `;

        marker.bindPopup(html, { maxWidth: 320 });

        // Radius Slider Logic with Competitor Highlighting
        marker.on('popupopen', () => {
            const slider = document.getElementById(`slider-${loc.id}`);
            const label = document.getElementById(`label-${loc.id}`);
            const competitorsDiv = document.getElementById(`competitors-${loc.id}`);
            if(!slider) return;

            const updateRadius = function() {
                const miles = RADIUS_STEPS[slider.value];
                label.innerText = `${miles} mi`;

                // Remove existing circle
                if(currentRadiusCircle) map.removeLayer(currentRadiusCircle);

                // Draw new radius circle
                currentRadiusCircle = L.circle([loc.lat, loc.lng], {
                    radius: miles * 1609.34,
                    color: color, fillOpacity: 0.1, weight: 1
                }).addTo(map);

                // Find and highlight competitors within radius
                highlightCompetitors(loc, miles, competitorsDiv);
            };

            slider.oninput = updateRadius;
            // Initial update
            updateRadius();
        });

        marker.on('popupclose', () => {
            if(currentRadiusCircle) { map.removeLayer(currentRadiusCircle); currentRadiusCircle = null; }
            clearCompetitorHighlights();
        });

        return marker;
    }

    function highlightCompetitors(centerLoc, radiusMiles, displayDiv) {
        clearCompetitorHighlights();

        const radiusMeters = radiusMiles * 1609.34;
        const centerLatLng = L.latLng(centerLoc.lat, centerLoc.lng);

        // Find all visible locations within radius (excluding the center location)
        const visible = allLocations.filter(loc => activeTickers.has(loc.ticker));
        const competitors = visible.filter(loc => {
            if (loc.id === centerLoc.id) return false;
            const locLatLng = L.latLng(loc.lat, loc.lng);
            return centerLatLng.distanceTo(locLatLng) <= radiusMeters;
        });

        // Group by ticker for display
        const byTicker = {};
        competitors.forEach(c => {
            if (!byTicker[c.ticker]) byTicker[c.ticker] = [];
            byTicker[c.ticker].push(c);
        });

        // Update display
        if (competitors.length === 0) {
            displayDiv.innerHTML = '<em>No competitors in radius</em>';
        } else {
            let html = `<strong>${competitors.length} competitor${competitors.length > 1 ? 's' : ''} found:</strong><br>`;
            Object.keys(byTicker).forEach(ticker => {
                const color = getColor(ticker);
                html += `<span style="display:inline-block;width:8px;height:8px;background:${color};border-radius:50%;margin-right:4px;"></span>${ticker}: ${byTicker[ticker].length} `;
            });
            displayDiv.innerHTML = html;
        }
    }

    function clearCompetitorHighlights() {
        highlightedMarkers.forEach(m => {
            if (m._icon) m._icon.classList.remove('competitor-marker');
        });
        highlightedMarkers = [];
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
        document.getElementById('btn-locate').onclick = () => map.locate({setView: true, maxZoom: 14});
        document.getElementById('btn-cluster-toggle').onclick = function() {
            isClusterView = !isClusterView;
            this.classList.toggle('active');
            refreshMap();
        };

        // Panel toggle
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
        // Select All
        document.getElementById('btn-select-all').onclick = selectAll;

        // Deselect All
        document.getElementById('btn-deselect-all').onclick = deselectAll;

        // Roark Portfolio
        document.getElementById('btn-roark').onclick = function() {
            this.classList.toggle('active');
            if (this.classList.contains('active')) {
                selectRoark();
            } else {
                deselectRoark();
            }
        };

        // Category filters
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.onclick = function() {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                filterByCategory(this.dataset.category);
            };
        });
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

    initMap();
});
