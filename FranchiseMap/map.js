// ============================================================================
// FRANCHISE LOCATION MAP - OpenStreetMap Version
// Using Leaflet.js with OpenStreetMap tiles
// FREE - No API key required!
// ============================================================================

// Sample franchise location data (representative locations)
const franchiseLocations = [
    // McDonald's (MCD) - Quick Service Restaurant
    { brand: 'MCD', name: "McDonald's - Times Square", type: 'QSR', lat: 40.7580, lng: -73.9855, address: '1528 Broadway, New York, NY', color: '#ff6b6b' },
    { brand: 'MCD', name: "McDonald's - Chicago Loop", type: 'QSR', lat: 41.8781, lng: -87.6298, address: 'State St, Chicago, IL', color: '#ff6b6b' },
    { brand: 'MCD', name: "McDonald's - LA Downtown", type: 'QSR', lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA', color: '#ff6b6b' },

    // Yum! Brands (YUM) - KFC/Taco Bell/Pizza Hut
    { brand: 'YUM', name: 'KFC - Manhattan', type: 'QSR', lat: 40.7489, lng: -73.9680, address: '5th Ave, New York, NY', color: '#ff6b6b' },
    { brand: 'YUM', name: 'Taco Bell - San Francisco', type: 'QSR', lat: 37.7749, lng: -122.4194, address: 'Market St, SF, CA', color: '#ff6b6b' },

    // Restaurant Brands (QSR) - Burger King/Tim Hortons/Popeyes
    { brand: 'QSR', name: 'Burger King - Miami', type: 'QSR', lat: 25.7617, lng: -80.1918, address: 'Brickell Ave, Miami, FL', color: '#ff6b6b' },
    { brand: 'QSR', name: "Tim Hortons - Toronto", type: 'QSR', lat: 43.6532, lng: -79.3832, address: 'Yonge St, Toronto, ON', color: '#ff6b6b' },

    // Wendy's (WEN)
    { brand: 'WEN', name: "Wendy's - Houston", type: 'QSR', lat: 29.7604, lng: -95.3698, address: 'Main St, Houston, TX', color: '#ff6b6b' },
    { brand: 'WEN', name: "Wendy's - Phoenix", type: 'QSR', lat: 33.4484, lng: -112.0740, address: 'Central Ave, Phoenix, AZ', color: '#ff6b6b' },

    // Domino's (DPZ) - Including Boston locations
    { brand: 'DPZ', name: "Domino's - Boston Common", type: 'QSR', lat: 42.3551, lng: -71.0656, address: 'Tremont St, Boston, MA', color: '#ff6b6b' },
    { brand: 'DPZ', name: "Domino's - Back Bay", type: 'QSR', lat: 42.3467, lng: -71.0824, address: 'Boylston St, Boston, MA', color: '#ff6b6b' },
    { brand: 'DPZ', name: "Domino's - Seattle", type: 'QSR', lat: 47.6062, lng: -122.3321, address: 'Pike St, Seattle, WA', color: '#ff6b6b' },

    // Shake Shack (SHAK)
    { brand: 'SHAK', name: 'Shake Shack - Madison Square Park', type: 'QSR', lat: 40.7410, lng: -73.9887, address: 'Madison Ave, New York, NY', color: '#ff6b6b' },

    // Casual Dining Examples
    { brand: 'DENN', name: "Denny's - Las Vegas", type: 'Casual', lat: 36.1699, lng: -115.1398, address: 'Las Vegas Blvd, NV', color: '#4ecdc4' },
    { brand: 'DIN', name: "IHOP - Dallas", type: 'Casual', lat: 32.7767, lng: -96.7970, address: 'Commerce St, Dallas, TX', color: '#4ecdc4' },

    // Hotels (MAR, HLT)
    { brand: 'MAR', name: 'Marriott Marquis - NYC', type: 'Hotel', lat: 40.7484, lng: -73.9857, address: '1535 Broadway, New York, NY', color: '#45b7d1' },
    { brand: 'HLT', name: 'Hilton - Chicago', type: 'Hotel', lat: 41.8902, lng: -87.6262, address: '720 S Michigan Ave, Chicago, IL', color: '#45b7d1' },

    // Fitness (PLNT)
    { brand: 'PLNT', name: 'Planet Fitness - Atlanta', type: 'Fitness', lat: 33.7490, lng: -84.3880, address: 'Peachtree St, Atlanta, GA', color: '#96ceb4' },
    { brand: 'PLNT', name: 'Planet Fitness - Philadelphia', type: 'Fitness', lat: 39.9526, lng: -75.1652, address: 'Market St, Philadelphia, PA', color: '#96ceb4' },

    // Business Services
    { brand: 'DRVN', name: 'Take 5 - Denver', type: 'Service', lat: 39.7392, lng: -104.9903, address: '16th St, Denver, CO', color: '#ffa07a' },
    { brand: 'ROL', name: 'Orkin - Atlanta', type: 'Service', lat: 33.7490, lng: -84.3880, address: 'Midtown, Atlanta, GA', color: '#ffa07a' },
];

// Global variables
let map;
let markers = [];
let markerLayer;
let currentFilter = 'all';

// Initialize map on page load
document.addEventListener('DOMContentLoaded', initMap);

function initMap() {
    // Create map centered on Boston, MA
    map = L.map('map', {
        center: [42.3601, -71.0589], // Boston, MA coordinates
        zoom: 11, // Zoomed in to show Boston area
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        boxZoom: true,
        keyboard: true,
        dragging: true
    });

    // Add OpenStreetMap tile layer (free, no API key needed!)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(map);

    // Create layer group for markers
    markerLayer = L.layerGroup().addTo(map);

    // Add markers
    addMarkers();

    // Add reset control after the map exists
    const resetViewButton = L.Control.extend({
        options: {
            position: 'topright'
        },

        onAdd: function(map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');

            container.style.backgroundColor = 'white';
            container.style.width = '34px';
            container.style.height = '34px';
            container.style.cursor = 'pointer';
            container.style.lineHeight = '34px';
            container.style.textAlign = 'center';
            container.style.fontSize = '18px';
            container.title = 'Reset view to Boston';
            container.innerHTML = '🏠';

            container.onclick = function() {
                map.setView([42.3601, -71.0589], 11);
            };

            return container;
        }
    });

    map.addControl(new resetViewButton());

    // Handle filter changes
    document.getElementById('brand-filter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterMarkers();
    });

    // Handle close panel button
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('active');
    });

    console.log('✓ Map initialized with OpenStreetMap');
    console.log(`✓ Loaded ${franchiseLocations.length} franchise locations`);
    console.log('✓ Default view: Boston, MA');
}

// Add markers to map
function addMarkers() {
    franchiseLocations.forEach(location => {
        // Create custom circle marker
        const marker = L.circleMarker([location.lat, location.lng], {
            radius: 10,
            fillColor: location.color,
            color: '#ffffff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        });

        // Create popup content
        const popupContent = `
            <div style="padding: 5px; min-width: 200px;">
                <h3 style="margin: 0 0 8px 0; color: #333; font-size: 1em; font-weight: 700;">${location.name}</h3>
                <p style="margin: 4px 0; color: #666; font-size: 0.9em;"><strong>Brand:</strong> ${location.brand}</p>
                <p style="margin: 4px 0; color: #666; font-size: 0.9em;">${location.address}</p>
            </div>
        `;

        // Bind popup
        marker.bindPopup(popupContent);

        // Click event to show details panel
        marker.on('click', () => {
            showLocationDetails(location);
            map.panTo([location.lat, location.lng]);
            if (map.getZoom() < 14) {
                map.setZoom(14);
            }
        });

        // Hover effects
        marker.on('mouseover', function() {
            this.setStyle({
                radius: 13,
                weight: 4
            });
        });

        marker.on('mouseout', function() {
            this.setStyle({
                radius: 10,
                weight: 3
            });
        });

        // Add to layer group
        marker.addTo(markerLayer);

        // Store marker reference
        markers.push({ marker, location });
    });
}

// Filter markers based on selected brand
function filterMarkers() {
    markers.forEach(({ marker, location }) => {
        if (currentFilter === 'all' || location.brand === currentFilter) {
            marker.addTo(markerLayer);
        } else {
            markerLayer.removeLayer(marker);
        }
    });

    // Close panel when filtering
    document.getElementById('info-panel').classList.remove('active');

    console.log(`Filter applied: ${currentFilter}`);
}

// Show location details in panel
function showLocationDetails(location) {
    const panel = document.getElementById('info-panel');
    const nameEl = document.getElementById('location-name');
    const detailsEl = document.getElementById('location-details');

    nameEl.textContent = location.name;

    const typeLabels = {
        'QSR': 'Quick Service Restaurant',
        'Casual': 'Casual Dining',
        'Hotel': 'Hotel/Hospitality',
        'Fitness': 'Fitness/Wellness',
        'Service': 'Business Services'
    };

    detailsEl.innerHTML = `
        <p><strong>Brand:</strong> ${location.brand}</p>
        <p><strong>Type:</strong> ${typeLabels[location.type] || location.type}</p>
        <p><strong>Address:</strong> ${location.address}</p>
        <p><strong>Coordinates:</strong><br>${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
        <p style="margin-top: 15px; font-size: 0.9em; color: #999;">
            <em>Sample location data for demonstration purposes</em>
        </p>
    `;

    panel.classList.add('active');
}

    console.log('✓ OpenStreetMap initialized successfully');
    console.log('✓ No API key required - completely free!');
}
