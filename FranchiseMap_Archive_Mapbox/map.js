// ============================================================================
// FRANCHISE LOCATION MAP
// Using Mapbox GL JS and OpenStreetMap
// ============================================================================

// Mapbox access token (users should replace with their own)
// Get free token at https://account.mapbox.com/
mapboxgl.accessToken = 'pk.eyJ1IjoiZnJhbnJlc2VhcmNoIiwiYSI6ImNscXh5emRvYzBjZG0ybHF4YXR2ZXkwdTkifQ.example'; // Replace with your token

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

// Initialize map
let map;
let markers = [];
let currentFilter = 'all';

function initMap() {
    // Create map centered on US
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v12', // Use streets style
        center: [-98.5795, 39.8283], // Center of continental US
        zoom: 4,
        touchPitch: false, // Disable pitch on mobile
        dragRotate: false // Disable rotation
    });

    // Add navigation controls
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add scale control
    map.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    // Wait for map to load
    map.on('load', () => {
        addMarkers();
    });

    // Handle filter changes
    document.getElementById('brand-filter').addEventListener('change', (e) => {
        currentFilter = e.target.value;
        filterMarkers();
    });

    // Handle close panel button
    document.getElementById('close-panel').addEventListener('click', () => {
        document.getElementById('info-panel').classList.remove('active');
    });
}

// Add markers to map
function addMarkers() {
    franchiseLocations.forEach(location => {
        // Create marker element
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = location.color;
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.border = '3px solid white';
        el.style.cursor = 'pointer';
        el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
        el.style.transition = 'transform 0.2s';

        el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.3)';
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
        });

        // Create marker
        const marker = new mapboxgl.Marker(el)
            .setLngLat([location.lng, location.lat])
            .addTo(map);

        // Add click event
        el.addEventListener('click', () => {
            showLocationDetails(location);
            map.flyTo({
                center: [location.lng, location.lat],
                zoom: 14,
                duration: 1500
            });
        });

        // Store marker reference
        markers.push({ marker, location });
    });
}

// Filter markers based on selected brand
function filterMarkers() {
    markers.forEach(({ marker, location }) => {
        if (currentFilter === 'all' || location.brand === currentFilter) {
            marker.getElement().style.display = 'block';
        } else {
            marker.getElement().style.display = 'none';
        }
    });
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

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMap);
} else {
    initMap();
}
