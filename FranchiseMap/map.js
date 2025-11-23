// ============================================================================
// FRANCHISE LOCATION MAP - Google Maps Version
// FRANCHISE LOCATION MAP - GOOGLE MAPS
// Using Google Maps JavaScript API
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

    // Domino's (DPZ)
    { brand: 'DPZ', name: "Domino's - Boston", type: 'QSR', lat: 42.3601, lng: -71.0589, address: 'Boylston St, Boston, MA', color: '#ff6b6b' },
    { brand: 'DPZ', name: "Domino's - Seattle", type: 'QSR', lat: 47.6062, lng: -122.3321, address: 'Pike St, Seattle, WA', color: '#ff6b6b' },

    // Starbucks (SBUX)
    { brand: 'SBUX', name: 'Starbucks Reserve - Seattle', type: 'QSR', lat: 47.6145, lng: -122.3418, address: '1124 Pike St, Seattle, WA', color: '#ff6b6b' },
    { brand: 'SBUX', name: 'Starbucks - Pike Place', type: 'QSR', lat: 47.6097, lng: -122.3421, address: '1912 Pike Pl, Seattle, WA', color: '#ff6b6b' },

    // Casual Dining Examples
    { brand: 'DENN', name: "Denny's - Las Vegas", type: 'Casual', lat: 36.1699, lng: -115.1398, address: 'Las Vegas Blvd, NV', color: '#4ecdc4' },
    { brand: 'DIN', name: 'Applebee's - Dallas', type: 'Casual', lat: 32.7767, lng: -96.7970, address: 'Commerce St, Dallas, TX', color: '#4ecdc4' },

    // Hotels (MAR, HLT)
    { brand: 'MAR', name: 'Marriott Marquis - NYC', type: 'Hotel', lat: 40.7484, lng: -73.9857, address: '1535 Broadway, New York, NY', color: '#45b7d1' },
    { brand: 'HLT', name: 'Hilton - Chicago', type: 'Hotel', lat: 41.8902, lng: -87.6262, address: '720 S Michigan Ave, Chicago, IL', color: '#45b7d1' },

    // Fitness (PLNT)
    { brand: 'PLNT', name: 'Planet Fitness - Atlanta', type: 'Fitness', lat: 33.7490, lng: -84.3880, address: 'Peachtree St, Atlanta, GA', color: '#96ceb4' },
    { brand: 'PLNT', name: 'Planet Fitness - Philadelphia', type: 'Fitness', lat: 39.9526, lng: -75.1652, address: 'Market St, Philadelphia, PA', color: '#96ceb4' },

    // Business Services
    { brand: 'HRB', name: 'H&R Block - Denver', type: 'Service', lat: 39.7392, lng: -104.9903, address: '16th St, Denver, CO', color: '#ffa07a' },
];

// Global variables
let map;
let markers = [];
let currentFilter = 'all';
let infoWindow;

// Initialize map (called by Google Maps API callback)
// Initialize map
function initMap() {
    // Create map centered on US
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 39.8283, lng: -98.5795 }, // Center of continental US
        zoom: 4,
        mapTypeControl: true,
        mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
        streetViewControl: true,
        streetViewControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
        },
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_BOTTOM
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
            position: google.maps.ControlPosition.RIGHT_TOP
        },
        gestureHandling: 'greedy', // Allow one-finger pan on mobile
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'on' }]
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER
        },
        gestureHandling: 'greedy', // Allow single-finger pan on mobile
        styles: [
            // Subtle custom styling
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }] // Hide POI labels for cleaner look
            }
        ]
    });

    // Create info window
    infoWindow = new google.maps.InfoWindow();

    // Add markers
    addMarkers();

    // Handle filter changes
    document.getElementById('brand-filter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterMarkers();
    });

    // Handle close panel button
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('active');
        infoWindow.close();
    });
}

// Add markers to map
function addMarkers() {
    franchiseLocations.forEach(location => {
        // Create custom marker icon (colored circle)
        const icon = {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: location.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3
        };

        // Create marker
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            icon: icon,
            title: location.name,
            animation: google.maps.Animation.DROP,
            optimized: false // Allow CSS animations
        });

        // Add hover effect
        marker.addListener('mouseover', () => {
            marker.setIcon({
                ...icon,
                scale: 13
            });
        });

        marker.addListener('mouseout', () => {
            marker.setIcon(icon);
        // Create custom marker icon
        const icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: location.color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
            scale: 10
        };

        // Create marker
        const marker = new google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.name,
            icon: icon,
            animation: google.maps.Animation.DROP
        });

        // Add click event
        marker.addListener('click', () => {
            showLocationDetails(location);
            map.panTo(marker.getPosition());
            map.setZoom(14);

            // Pan to marker and zoom in slightly
            map.panTo(marker.getPosition());
            if (map.getZoom() < 14) {
                map.setZoom(14);
            }

            // Show info window
            infoWindow.setContent(`
                <div style="padding: 10px;">
                    <h3 style="margin: 0 0 8px 0; color: #333; font-size: 1.1em;">${location.name}</h3>
                    <p style="margin: 4px 0; color: #666; font-size: 0.95em;"><strong>Brand:</strong> ${location.brand}</p>
                    <p style="margin: 4px 0; color: #666; font-size: 0.95em;">${location.address}</p>
                </div>
            `);
            infoWindow.open(map, marker);
        });

        // Hover effect
        marker.addListener('mouseover', () => {
            marker.setIcon({
                ...icon,
                scale: 13
            });
        });

        marker.addListener('mouseout', () => {
            marker.setIcon(icon);
        });

        // Store marker reference
        markers.push({ marker, location });
    });
}

// Filter markers based on selected brand
function filterMarkers() {
    markers.forEach(({ marker, location }) => {
        if (currentFilter === 'all' || location.brand === currentFilter) {
            marker.setVisible(true);
        } else {
            marker.setVisible(false);
        }
    });

    // Close info window and panel when filtering
    infoWindow.close();
    document.getElementById('info-panel').classList.remove('active');
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

// Make initMap globally accessible for Google Maps callback
window.initMap = initMap;
// Handle window errors gracefully
window.gm_authFailure = function() {
    document.getElementById('map').innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #f5f5f5; padding: 40px; text-align: center;">
            <div>
                <h2 style="color: #333; margin-bottom: 15px;">⚠️ Google Maps API Key Required</h2>
                <p style="color: #666; margin-bottom: 10px;">To use this map, you need a Google Maps API key.</p>
                <p style="color: #666; margin-bottom: 20px;">
                    <strong>Get a free API key at:</strong><br>
                    <a href="https://developers.google.com/maps/gmp-get-started" target="_blank" style="color: #667eea;">
                        https://developers.google.com/maps/gmp-get-started
                    </a>
                </p>
                <p style="color: #666; font-size: 0.9em;">
                    Replace YOUR_API_KEY in map.html with your actual key.
                </p>
            </div>
        </div>
    `;
};
