document.addEventListener('DOMContentLoaded', () => {
    // --- Config ---
    const TICKER_STYLES = {
        'MCD': { color: '#FFC72C' }, 'YUM': { color: '#D62300' }, 'QSR': { color: '#FF8732' },
        'WEN': { color: '#E2203D' }, 'DPZ': { color: '#006491' }, 'SBUX': { color: '#00704A' },
        'JACK': { color: '#E31837' }, 'WING': { color: '#00503C' }, 'SHAK': { color: '#1F1F1F' },
        'DENN': { color: '#FFA500' }, 'DIN': { color: '#1E90FF' }, 'DNUT': { color: '#00A94F' },
        'NATH': { color: '#FFD700' }, 'RRGB': { color: '#C8102E' }, 'DRVN': { color: '#E31837' },
        'HRB': { color: '#00A650' }, 'MCW': { color: '#0072CE' }, 'SERV': { color: '#E4002B' },
        'ROL': { color: '#003DA5' }, 'PLNT': { color: '#5C2D91' }, 'MAR': { color: '#B4975A' },
        'HLT': { color: '#002855' }, 'H': { color: '#6B6B6B' }, 'CHH': { color: '#1C4587' },
        'WH': { color: '#0077C8' }, 'VAC': { color: '#C4A052' }, 'TNL': { color: '#00A5E3' },
        'PLAY': { color: '#E31837' },
        'default': { color: '#555555' }
    };
    const RADIUS_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

    // --- State ---
    let map, clusterGroup, markersLayer = L.layerGroup(), buildingsLayer;
    let allLocations = [], loadedTickers = new Set(), activeTickers = new Set();
    let isClusterView = true, currentRadiusCircle;

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

        // Geocoder (Search Bar) - Hybrid Logic
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
        map.on('overlayremove', e => { if(e.layer === dummy3D) buildingsLayer.data([]); }); // Clear data
        map.on('moveend', () => { if(map.hasLayer(dummy3D)) loadBuildings(); });

        setupRail();
        loadManifest();
    }

    function loadManifest() {
        fetch('data/manifest.json')
            .then(res => res.json())
            .then(manifest => renderLegend(manifest))
            .catch(e => console.log("Data not yet generated. Run GitHub Action."));
    }

    function renderLegend(manifest) {
        const container = document.getElementById('brand-legend');
        container.innerHTML = '';
        manifest.forEach(item => {
            const style = TICKER_STYLES[item.ticker] || TICKER_STYLES['default'];
            const btn = document.createElement('button');
            btn.className = 'brand-pill';
            btn.innerHTML = `<span class="brand-dot" style="background-color: ${style.color}"></span><b>${item.ticker}</b>&nbsp;<small>(${item.brands[0]})</small>`;
            btn.onclick = () => { toggleTicker(item.ticker, item.file); btn.classList.toggle('active'); };
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
    }

    function refreshMap() {
        clusterGroup.clearLayers(); markersLayer.clearLayers();
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
    }

    function createMarker(loc) {
        const style = TICKER_STYLES[loc.ticker] || TICKER_STYLES['default'];
        const marker = L.circleMarker([loc.lat, loc.lng], {
            radius: 6, fillColor: style.color, color: '#fff', weight: 1, opacity: 1, fillOpacity: 0.9
        });

        // Popup Content
        const scoreColor = loc.s >= 80 ? '#48bb78' : (loc.s >= 60 ? '#ecc94b' : '#f56565');
        const popupId = `popup-${loc.id}`;

        const html = `
            <div style="min-width:220px; font-family:sans-serif;">
                <h3 style="margin:0 0 5px 0;">${loc.n}</h3>
                <div style="color:#666; font-size:0.85rem; margin-bottom:10px;">${loc.a}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; background:#f0f0f0; padding:5px 10px; border-radius:4px;">
                    <span>Site Score</span>
                    <span class="score-badge" style="background:${scoreColor}">${loc.s}/100</span>
                </div>
                <div style="margin-top:10px; font-size:0.8rem; display:grid; grid-template-columns:1fr 1fr; gap:5px;">
                    <div>Traffic: <b>${loc.at.traffic.toLocaleString()}</b></div>
                    <div>Income: <b>$${(loc.at.medianIncome/1000).toFixed(0)}k</b></div>
                </div>
                <hr style="border:0; border-top:1px solid #eee; margin:10px 0;">
                <label style="font-size:0.8rem; font-weight:bold;">Competitor Analysis Radius</label>
                <div style="display:flex; align-items:center; gap:10px;">
                    <input type="range" id="slider-${loc.id}" min="0" max="${RADIUS_STEPS.length - 1}" step="1" value="3">
                    <span id="label-${loc.id}" style="font-size:0.8rem; font-weight:bold; width:60px;">1.0 mi</span>
                </div>
            </div>
        `;

        marker.bindPopup(html);

        // Radius Slider Logic
        marker.on('popupopen', () => {
            const slider = document.getElementById(`slider-${loc.id}`);
            const label = document.getElementById(`label-${loc.id}`);
            if(!slider) return;

            slider.oninput = function() {
                const miles = RADIUS_STEPS[this.value];
                label.innerText = `${miles} mi`;
                if(currentRadiusCircle) map.removeLayer(currentRadiusCircle);
                currentRadiusCircle = L.circle([loc.lat, loc.lng], {
                    radius: miles * 1609.34, // Miles to Meters
                    color: style.color, fillOpacity: 0.1, weight: 1
                }).addTo(map);
            };
        });

        marker.on('popupclose', () => {
            if(currentRadiusCircle) { map.removeLayer(currentRadiusCircle); currentRadiusCircle = null; }
        });

        return marker;
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
    }

    initMap();
});
