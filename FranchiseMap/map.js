// ============================================================================
// FRANCHISE LOCATION MAP - OpenStreetMap Version
// Using Leaflet.js with OpenStreetMap tiles
// Multi-brand selection with checkbox filtering
// ============================================================================

// Brand configuration matching stock ticker symbols
const BRANDS = {
  // Quick Service Restaurants
  MCD: { name: "McDonald's", color: '#FFC72C', type: 'QSR' },
  YUM: { name: 'Yum! Brands (KFC/Taco Bell/Pizza Hut)', color: '#E4002B', type: 'QSR' },
  QSR: { name: 'Restaurant Brands (BK/Tim Hortons)', color: '#FF8732', type: 'QSR' },
  WEN: { name: "Wendy's", color: '#E2203C', type: 'QSR' },
  DPZ: { name: "Domino's Pizza", color: '#006491', type: 'QSR' },
  SHAK: { name: 'Shake Shack', color: '#1F1F1F', type: 'QSR' },
  CMG: { name: 'Chipotle', color: '#441500', type: 'QSR' },
  SBUX: { name: 'Starbucks', color: '#00704A', type: 'QSR' },
  JACK: { name: 'Jack in the Box', color: '#E31837', type: 'QSR' },
  WING: { name: 'Wingstop', color: '#00503C', type: 'QSR' },
  PZZA: { name: "Papa John's", color: '#CD1126', type: 'QSR' },

  // Casual Dining
  DRI: { name: 'Darden (Olive Garden/LongHorn)', color: '#6B8E23', type: 'Casual' },
  EAT: { name: 'Brinker (Chilis/Maggianos)', color: '#C41E3A', type: 'Casual' },
  TXRH: { name: 'Texas Roadhouse', color: '#8B4513', type: 'Casual' },
  CAKE: { name: 'Cheesecake Factory', color: '#8B0000', type: 'Casual' },
  DENN: { name: "Denny's", color: '#FFD700', type: 'Casual' },
  DIN: { name: 'Dine Brands (IHOP/Applebees)', color: '#1E90FF', type: 'Casual' },
  BLMN: { name: 'Bloomin Brands (Outback)', color: '#CD853F', type: 'Casual' },

  // Hotels
  MAR: { name: 'Marriott International', color: '#B4975A', type: 'Hotel' },
  HLT: { name: 'Hilton Hotels', color: '#002855', type: 'Hotel' },
  H: { name: 'Hyatt Hotels', color: '#6B6B6B', type: 'Hotel' },
  IHG: { name: 'IHG (Holiday Inn)', color: '#007A53', type: 'Hotel' },
  WH: { name: 'Wyndham Hotels', color: '#0077C8', type: 'Hotel' },
  CHH: { name: 'Choice Hotels', color: '#1C4587', type: 'Hotel' },

  // Fitness & Services
  PLNT: { name: 'Planet Fitness', color: '#5C2D91', type: 'Fitness' },
  XPOF: { name: 'Xponential Fitness', color: '#FF6B35', type: 'Fitness' }
};

// Expanded franchise location data (representative sample across major cities)
const franchiseLocations = [
  // ========== McDonald's (MCD) ==========
  { brand: 'MCD', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY' },
  { brand: 'MCD', lat: 40.7484, lng: -73.9857, address: 'Herald Square, New York, NY' },
  { brand: 'MCD', lat: 40.7614, lng: -73.9776, address: 'Midtown East, New York, NY' },
  { brand: 'MCD', lat: 41.8781, lng: -87.6298, address: 'Chicago Loop, IL' },
  { brand: 'MCD', lat: 41.8827, lng: -87.6233, address: 'Magnificent Mile, Chicago, IL' },
  { brand: 'MCD', lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA' },
  { brand: 'MCD', lat: 34.0195, lng: -118.4912, address: 'Santa Monica, CA' },
  { brand: 'MCD', lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  { brand: 'MCD', lat: 42.3601, lng: -71.0589, address: 'Boston Common, MA' },
  { brand: 'MCD', lat: 42.3467, lng: -71.0972, address: 'Fenway, Boston, MA' },
  { brand: 'MCD', lat: 47.6062, lng: -122.3321, address: 'Downtown Seattle, WA' },
  { brand: 'MCD', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'MCD', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'MCD', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },
  { brand: 'MCD', lat: 25.7617, lng: -80.1918, address: 'Miami, FL' },

  // ========== Starbucks (SBUX) ==========
  { brand: 'SBUX', lat: 40.7580, lng: -73.9690, address: 'Times Square, New York, NY' },
  { brand: 'SBUX', lat: 40.7527, lng: -73.9772, address: 'Grand Central, New York, NY' },
  { brand: 'SBUX', lat: 40.7061, lng: -74.0089, address: 'Wall Street, New York, NY' },
  { brand: 'SBUX', lat: 47.6097, lng: -122.3331, address: 'Pike Place (Original), Seattle, WA' },
  { brand: 'SBUX', lat: 47.6062, lng: -122.3321, address: 'Downtown Seattle, WA' },
  { brand: 'SBUX', lat: 41.8781, lng: -87.6298, address: 'Chicago Loop, IL' },
  { brand: 'SBUX', lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA' },
  { brand: 'SBUX', lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  { brand: 'SBUX', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'SBUX', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },

  // ========== Chipotle (CMG) ==========
  { brand: 'CMG', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY' },
  { brand: 'CMG', lat: 40.7484, lng: -73.9857, address: 'Midtown, New York, NY' },
  { brand: 'CMG', lat: 41.8781, lng: -87.6298, address: 'Chicago Loop, IL' },
  { brand: 'CMG', lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA' },
  { brand: 'CMG', lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  { brand: 'CMG', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'CMG', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'CMG', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },

  // ========== Yum! Brands (YUM) - KFC/Taco Bell/Pizza Hut ==========
  { brand: 'YUM', lat: 40.7489, lng: -73.9680, address: 'KFC - Midtown, New York, NY' },
  { brand: 'YUM', lat: 40.7580, lng: -73.9855, address: 'Taco Bell - Times Square, NY' },
  { brand: 'YUM', lat: 37.7749, lng: -122.4194, address: 'Taco Bell - San Francisco, CA' },
  { brand: 'YUM', lat: 34.0522, lng: -118.2437, address: 'Pizza Hut - LA, CA' },
  { brand: 'YUM', lat: 41.8781, lng: -87.6298, address: 'KFC - Chicago, IL' },
  { brand: 'YUM', lat: 29.7604, lng: -95.3698, address: 'Taco Bell - Houston, TX' },
  { brand: 'YUM', lat: 33.4484, lng: -112.0740, address: 'Pizza Hut - Phoenix, AZ' },
  { brand: 'YUM', lat: 42.3601, lng: -71.0589, address: 'KFC - Boston, MA' },

  // ========== Restaurant Brands (QSR) - Burger King/Tim Hortons ==========
  { brand: 'QSR', lat: 40.7580, lng: -73.9855, address: 'Burger King - Times Square, NY' },
  { brand: 'QSR', lat: 25.7617, lng: -80.1918, address: 'Burger King HQ - Miami, FL' },
  { brand: 'QSR', lat: 43.6532, lng: -79.3832, address: 'Tim Hortons - Toronto, ON' },
  { brand: 'QSR', lat: 43.6629, lng: -79.3957, address: 'Tim Hortons - Toronto, ON' },
  { brand: 'QSR', lat: 41.8781, lng: -87.6298, address: 'Burger King - Chicago, IL' },
  { brand: 'QSR', lat: 42.3601, lng: -71.0589, address: 'Burger King - Boston, MA' },
  { brand: 'QSR', lat: 34.0522, lng: -118.2437, address: 'Burger King - LA, CA' },

  // ========== Wendy's (WEN) ==========
  { brand: 'WEN', lat: 40.0150, lng: -83.0308, address: "Wendy's HQ - Columbus, OH" },
  { brand: 'WEN', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY' },
  { brand: 'WEN', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'WEN', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'WEN', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'WEN', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'WEN', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'WEN', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },

  // ========== Domino's (DPZ) ==========
  { brand: 'DPZ', lat: 42.3551, lng: -71.0656, address: 'Boston Common, MA' },
  { brand: 'DPZ', lat: 42.3467, lng: -71.0824, address: 'Back Bay, Boston, MA' },
  { brand: 'DPZ', lat: 42.3601, lng: -71.0589, address: 'Downtown Boston, MA' },
  { brand: 'DPZ', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'DPZ', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'DPZ', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'DPZ', lat: 47.6062, lng: -122.3321, address: 'Seattle, WA' },
  { brand: 'DPZ', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },

  // ========== Shake Shack (SHAK) ==========
  { brand: 'SHAK', lat: 40.7410, lng: -73.9887, address: 'Madison Square Park (Original), NY' },
  { brand: 'SHAK', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'SHAK', lat: 40.7061, lng: -74.0089, address: 'Financial District, NY' },
  { brand: 'SHAK', lat: 41.8827, lng: -87.6233, address: 'Chicago, IL' },
  { brand: 'SHAK', lat: 34.0195, lng: -118.4912, address: 'Santa Monica, CA' },
  { brand: 'SHAK', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },

  // ========== Wingstop (WING) ==========
  { brand: 'WING', lat: 32.7767, lng: -96.7970, address: 'Dallas HQ, TX' },
  { brand: 'WING', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'WING', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'WING', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'WING', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },

  // ========== Jack in the Box (JACK) ==========
  { brand: 'JACK', lat: 32.7157, lng: -117.1611, address: 'San Diego HQ, CA' },
  { brand: 'JACK', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'JACK', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'JACK', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'JACK', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },

  // ========== Papa Johns (PZZA) ==========
  { brand: 'PZZA', lat: 38.2527, lng: -85.7585, address: 'Louisville HQ, KY' },
  { brand: 'PZZA', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'PZZA', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'PZZA', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'PZZA', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },

  // ========== Casual Dining ==========
  // Darden (DRI)
  { brand: 'DRI', lat: 28.4580, lng: -81.4697, address: 'Olive Garden - Orlando, FL' },
  { brand: 'DRI', lat: 40.7580, lng: -73.9855, address: 'Olive Garden - Times Square, NY' },
  { brand: 'DRI', lat: 41.8781, lng: -87.6298, address: 'LongHorn - Chicago, IL' },
  { brand: 'DRI', lat: 34.0522, lng: -118.2437, address: 'Olive Garden - LA, CA' },

  // Texas Roadhouse (TXRH)
  { brand: 'TXRH', lat: 38.2527, lng: -85.7585, address: 'Louisville HQ, KY' },
  { brand: 'TXRH', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'TXRH', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'TXRH', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },

  // Cheesecake Factory (CAKE)
  { brand: 'CAKE', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'CAKE', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'CAKE', lat: 41.8827, lng: -87.6233, address: 'Chicago, IL' },
  { brand: 'CAKE', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },

  // Dennys (DENN)
  { brand: 'DENN', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'DENN', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'DENN', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'DENN', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },

  // Dine Brands (DIN) - IHOP/Applebees
  { brand: 'DIN', lat: 34.1478, lng: -118.1445, address: 'IHOP HQ - Glendale, CA' },
  { brand: 'DIN', lat: 40.7580, lng: -73.9855, address: 'IHOP - New York, NY' },
  { brand: 'DIN', lat: 41.8781, lng: -87.6298, address: 'Applebees - Chicago, IL' },
  { brand: 'DIN', lat: 32.7767, lng: -96.7970, address: 'IHOP - Dallas, TX' },

  // Bloomin Brands (BLMN) - Outback
  { brand: 'BLMN', lat: 27.9506, lng: -82.4572, address: 'Outback HQ - Tampa, FL' },
  { brand: 'BLMN', lat: 40.7580, lng: -73.9855, address: 'Outback - New York, NY' },
  { brand: 'BLMN', lat: 41.8781, lng: -87.6298, address: 'Outback - Chicago, IL' },

  // Brinker (EAT) - Chilis
  { brand: 'EAT', lat: 32.7767, lng: -96.7970, address: 'Chilis HQ - Dallas, TX' },
  { brand: 'EAT', lat: 40.7580, lng: -73.9855, address: 'Chilis - New York, NY' },
  { brand: 'EAT', lat: 34.0522, lng: -118.2437, address: 'Maggianos - LA, CA' },

  // ========== Hotels ==========
  // Marriott (MAR)
  { brand: 'MAR', lat: 40.7484, lng: -73.9857, address: 'Marriott Marquis - Times Square, NY' },
  { brand: 'MAR', lat: 41.8902, lng: -87.6262, address: 'JW Marriott - Chicago, IL' },
  { brand: 'MAR', lat: 34.0522, lng: -118.2437, address: 'Ritz-Carlton - LA, CA' },
  { brand: 'MAR', lat: 37.7749, lng: -122.4194, address: 'W Hotel - San Francisco, CA' },
  { brand: 'MAR', lat: 25.7617, lng: -80.1918, address: 'Marriott - Miami, FL' },

  // Hilton (HLT)
  { brand: 'HLT', lat: 40.7614, lng: -73.9776, address: 'Hilton Midtown - New York, NY' },
  { brand: 'HLT', lat: 41.8902, lng: -87.6262, address: 'Hilton Chicago, IL' },
  { brand: 'HLT', lat: 36.1699, lng: -115.1398, address: 'Hilton - Las Vegas, NV' },
  { brand: 'HLT', lat: 33.7490, lng: -84.3880, address: 'Hilton - Atlanta, GA' },

  // Hyatt (H)
  { brand: 'H', lat: 40.7527, lng: -73.9772, address: 'Grand Hyatt - New York, NY' },
  { brand: 'H', lat: 41.8781, lng: -87.6298, address: 'Hyatt Regency - Chicago, IL' },
  { brand: 'H', lat: 34.0522, lng: -118.2437, address: 'Andaz - LA, CA' },

  // IHG (IHG)
  { brand: 'IHG', lat: 33.7490, lng: -84.3880, address: 'IHG HQ - Atlanta, GA' },
  { brand: 'IHG', lat: 40.7580, lng: -73.9855, address: 'Holiday Inn - Times Square, NY' },
  { brand: 'IHG', lat: 41.8781, lng: -87.6298, address: 'InterContinental - Chicago, IL' },

  // Wyndham (WH)
  { brand: 'WH', lat: 40.0150, lng: -74.1147, address: 'Wyndham - NJ' },
  { brand: 'WH', lat: 40.7580, lng: -73.9855, address: 'Days Inn - New York, NY' },
  { brand: 'WH', lat: 28.5383, lng: -81.3792, address: 'Ramada - Orlando, FL' },

  // Choice Hotels (CHH)
  { brand: 'CHH', lat: 39.1434, lng: -77.2014, address: 'Choice HQ - Rockville, MD' },
  { brand: 'CHH', lat: 40.7580, lng: -73.9855, address: 'Comfort Inn - New York, NY' },
  { brand: 'CHH', lat: 34.0522, lng: -118.2437, address: 'Quality Inn - LA, CA' },

  // ========== Fitness ==========
  // Planet Fitness (PLNT)
  { brand: 'PLNT', lat: 40.6892, lng: -74.0445, address: 'Planet Fitness HQ - NJ' },
  { brand: 'PLNT', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'PLNT', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'PLNT', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'PLNT', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'PLNT', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },
  { brand: 'PLNT', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },

  // Xponential (XPOF)
  { brand: 'XPOF', lat: 33.6846, lng: -117.8265, address: 'Xponential HQ - Irvine, CA' },
  { brand: 'XPOF', lat: 40.7580, lng: -73.9855, address: 'CycleBar - New York, NY' },
  { brand: 'XPOF', lat: 34.0522, lng: -118.2437, address: 'Club Pilates - LA, CA' }
];

// Global variables
let map;
let markers = [];
let markerLayer;
let radiusCircle = null;
let selectedBrands = new Set(Object.keys(BRANDS)); // All selected by default

// Initialize map on page load
document.addEventListener('DOMContentLoaded', initMap);

function initMap() {
  // Check for embed mode
  if (new URLSearchParams(window.location.search).get('embed') === 'true') {
    document.body.classList.add('embed-mode');
  }

  // Create map centered on US
  map = L.map('map', {
    center: [39.8283, -98.5795], // Center of US
    zoom: 4,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // Create marker layer
  markerLayer = L.layerGroup().addTo(map);

  // Build brand checkboxes
  buildBrandCheckboxes();

  // Add markers
  addMarkers();

  // Setup event listeners
  setupEventListeners();

  // Add custom controls
  addMapControls();

  console.log(`✓ Map initialized with ${franchiseLocations.length} locations across ${Object.keys(BRANDS).length} brands`);
}

// Build checkbox UI for brand selection
function buildBrandCheckboxes() {
  const container = document.getElementById('brand-checkboxes');
  if (!container) return;

  // Group brands by type
  const grouped = {};
  Object.entries(BRANDS).forEach(([symbol, brand]) => {
    if (!grouped[brand.type]) grouped[brand.type] = [];
    grouped[brand.type].push({ symbol, ...brand });
  });

  let html = '';

  // Select All / None buttons
  html += `
    <div class="brand-actions">
      <button type="button" onclick="selectAllBrands()">Select All</button>
      <button type="button" onclick="selectNoBrands()">Clear All</button>
    </div>
  `;

  // Build checkboxes by category
  Object.entries(grouped).forEach(([type, brands]) => {
    html += `<div class="brand-group">
      <div class="brand-group-title">${type}</div>`;

    brands.forEach(brand => {
      html += `
        <label class="brand-checkbox">
          <input type="checkbox" value="${brand.symbol}" checked onchange="toggleBrand('${brand.symbol}', this.checked)">
          <span class="brand-color" style="background: ${brand.color}"></span>
          <span class="brand-name">${brand.symbol}</span>
        </label>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

// Toggle brand selection
function toggleBrand(symbol, checked) {
  if (checked) {
    selectedBrands.add(symbol);
  } else {
    selectedBrands.delete(symbol);
  }
  filterMarkers();
}

// Select all brands
function selectAllBrands() {
  selectedBrands = new Set(Object.keys(BRANDS));
  document.querySelectorAll('#brand-checkboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = true;
  });
  filterMarkers();
}

// Clear all brands
function selectNoBrands() {
  selectedBrands.clear();
  document.querySelectorAll('#brand-checkboxes input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });
  filterMarkers();
}

// Add markers to map
function addMarkers() {
  franchiseLocations.forEach(location => {
    const brand = BRANDS[location.brand];
    if (!brand) return;

    const marker = L.circleMarker([location.lat, location.lng], {
      radius: 8,
      fillColor: brand.color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    const popupContent = `
      <div class="map-popup">
        <strong>${brand.name}</strong><br>
        <span style="color: #666;">${location.address}</span>
      </div>
    `;

    marker.bindPopup(popupContent);

    marker.on('click', () => {
      showLocationDetails(location, brand);
    });

    marker.on('mouseover', function() {
      this.setStyle({ radius: 12, weight: 3 });
    });

    marker.on('mouseout', function() {
      this.setStyle({ radius: 8, weight: 2 });
    });

    marker.addTo(markerLayer);
    markers.push({ marker, location, brand });
  });
}

// Filter markers based on selected brands
function filterMarkers() {
  const center = map.getCenter();
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect ? radiusSelect.value : 'all';

  markers.forEach(({ marker, location }) => {
    let show = selectedBrands.has(location.brand);

    // Apply radius filter if set
    if (show && radiusMiles !== 'all') {
      const radiusKm = parseFloat(radiusMiles) * 1.60934;
      const distance = map.distance(center, [location.lat, location.lng]) / 1000;
      show = distance <= radiusKm;
    }

    if (show) {
      marker.addTo(markerLayer);
    } else {
      markerLayer.removeLayer(marker);
    }
  });

  updateLocationCount();
}

// Update visible location count
function updateLocationCount() {
  const count = markers.filter(({ marker }) => markerLayer.hasLayer(marker)).length;
  const countEl = document.getElementById('location-count');
  if (countEl) {
    countEl.textContent = `${count} locations`;
  }
}

// Show location details in panel
function showLocationDetails(location, brand) {
  const panel = document.getElementById('info-panel');
  const nameEl = document.getElementById('location-name');
  const detailsEl = document.getElementById('location-details');

  if (!panel || !nameEl || !detailsEl) return;

  nameEl.textContent = brand.name;
  detailsEl.innerHTML = `
    <p><strong>Ticker:</strong> ${location.brand}</p>
    <p><strong>Category:</strong> ${brand.type}</p>
    <p><strong>Address:</strong> ${location.address}</p>
    <p><strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
    <p class="note"><em>Sample data for demonstration</em></p>
  `;

  panel.classList.add('active');
}

// Search for location
async function searchLocation(query) {
  if (!query || query.trim().length < 2) {
    alert('Please enter a city, state, or zip code');
    return;
  }

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) searchBtn.textContent = '...';

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=us,ca&limit=1`,
      { headers: { 'User-Agent': 'FranResearch/1.0' } }
    );

    const results = await response.json();

    if (results.length > 0) {
      const { lat, lon, display_name } = results[0];
      map.setView([parseFloat(lat), parseFloat(lon)], 12);

      // Show temporary marker
      const searchMarker = L.marker([lat, lon]).addTo(map);
      searchMarker.bindPopup(`<strong>Search:</strong><br>${display_name}`).openPopup();
      setTimeout(() => map.removeLayer(searchMarker), 8000);

      // Refilter for radius
      filterMarkers();
    } else {
      alert('Location not found. Try a different search.');
    }
  } catch (error) {
    console.error('Search error:', error);
    alert('Search failed. Please try again.');
  } finally {
    if (searchBtn) searchBtn.textContent = 'Find';
  }
}

// Apply radius filter with visual circle
function applyRadiusFilter(miles) {
  // Remove existing circle
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  if (miles !== 'all') {
    const center = map.getCenter();
    const radiusMeters = parseFloat(miles) * 1609.34;

    radiusCircle = L.circle(center, {
      radius: radiusMeters,
      color: '#6366f1',
      fillColor: '#6366f1',
      fillOpacity: 0.1,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
  }

  filterMarkers();
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchInput = document.getElementById('location-search');
  const searchBtn = document.getElementById('search-btn');

  if (searchBtn) {
    searchBtn.addEventListener('click', () => searchLocation(searchInput?.value));
  }
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') searchLocation(searchInput.value);
    });
  }

  // Radius filter
  const radiusSelect = document.getElementById('radius-filter');
  if (radiusSelect) {
    radiusSelect.addEventListener('change', (e) => {
      applyRadiusFilter(e.target.value);
    });
  }

  // Close panel
  const closeBtn = document.getElementById('close-panel');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('info-panel')?.classList.remove('active');
    });
  }

  // Update radius on map move
  map.on('moveend', () => {
    const radiusSelect = document.getElementById('radius-filter');
    if (radiusSelect && radiusSelect.value !== 'all') {
      applyRadiusFilter(radiusSelect.value);
    }
  });
}

// Add map controls
function addMapControls() {
  // Reset view button
  const ResetControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      btn.innerHTML = '<a href="#" title="Reset View" style="display:block;width:34px;height:34px;line-height:34px;text-align:center;font-size:18px;text-decoration:none;">🏠</a>';
      btn.onclick = (e) => {
        e.preventDefault();
        map.setView([39.8283, -98.5795], 4);
        document.getElementById('radius-filter').value = 'all';
        applyRadiusFilter('all');
      };
      return btn;
    }
  });
  map.addControl(new ResetControl());
}

// Expose functions globally
window.toggleBrand = toggleBrand;
window.selectAllBrands = selectAllBrands;
window.selectNoBrands = selectNoBrands;
