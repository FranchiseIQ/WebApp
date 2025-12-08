// ============================================================================
// FRANCHISE LOCATION MAP - Interactive Version
// Features: Clustering, Heat Map, Competitor Analysis, Statistics
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

// Expanded franchise location data
const franchiseLocations = [
  // McDonald's (MCD)
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

  // Starbucks (SBUX)
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

  // Chipotle (CMG)
  { brand: 'CMG', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY' },
  { brand: 'CMG', lat: 40.7484, lng: -73.9857, address: 'Midtown, New York, NY' },
  { brand: 'CMG', lat: 41.8781, lng: -87.6298, address: 'Chicago Loop, IL' },
  { brand: 'CMG', lat: 34.0522, lng: -118.2437, address: 'Downtown LA, CA' },
  { brand: 'CMG', lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  { brand: 'CMG', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'CMG', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'CMG', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },

  // Yum! Brands (YUM)
  { brand: 'YUM', lat: 40.7489, lng: -73.9680, address: 'KFC - Midtown, New York, NY' },
  { brand: 'YUM', lat: 40.7580, lng: -73.9855, address: 'Taco Bell - Times Square, NY' },
  { brand: 'YUM', lat: 37.7749, lng: -122.4194, address: 'Taco Bell - San Francisco, CA' },
  { brand: 'YUM', lat: 34.0522, lng: -118.2437, address: 'Pizza Hut - LA, CA' },
  { brand: 'YUM', lat: 41.8781, lng: -87.6298, address: 'KFC - Chicago, IL' },
  { brand: 'YUM', lat: 29.7604, lng: -95.3698, address: 'Taco Bell - Houston, TX' },
  { brand: 'YUM', lat: 33.4484, lng: -112.0740, address: 'Pizza Hut - Phoenix, AZ' },
  { brand: 'YUM', lat: 42.3601, lng: -71.0589, address: 'KFC - Boston, MA' },

  // Restaurant Brands (QSR)
  { brand: 'QSR', lat: 40.7580, lng: -73.9855, address: 'Burger King - Times Square, NY' },
  { brand: 'QSR', lat: 25.7617, lng: -80.1918, address: 'Burger King HQ - Miami, FL' },
  { brand: 'QSR', lat: 43.6532, lng: -79.3832, address: 'Tim Hortons - Toronto, ON' },
  { brand: 'QSR', lat: 43.6629, lng: -79.3957, address: 'Tim Hortons - Toronto, ON' },
  { brand: 'QSR', lat: 41.8781, lng: -87.6298, address: 'Burger King - Chicago, IL' },
  { brand: 'QSR', lat: 42.3601, lng: -71.0589, address: 'Burger King - Boston, MA' },
  { brand: 'QSR', lat: 34.0522, lng: -118.2437, address: 'Burger King - LA, CA' },

  // Wendy's (WEN)
  { brand: 'WEN', lat: 40.0150, lng: -83.0308, address: "Wendy's HQ - Columbus, OH" },
  { brand: 'WEN', lat: 40.7580, lng: -73.9855, address: 'Times Square, New York, NY' },
  { brand: 'WEN', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'WEN', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'WEN', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'WEN', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'WEN', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'WEN', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },

  // Domino's (DPZ)
  { brand: 'DPZ', lat: 42.3551, lng: -71.0656, address: 'Boston Common, MA' },
  { brand: 'DPZ', lat: 42.3467, lng: -71.0824, address: 'Back Bay, Boston, MA' },
  { brand: 'DPZ', lat: 42.3601, lng: -71.0589, address: 'Downtown Boston, MA' },
  { brand: 'DPZ', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'DPZ', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'DPZ', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'DPZ', lat: 47.6062, lng: -122.3321, address: 'Seattle, WA' },
  { brand: 'DPZ', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },

  // Shake Shack (SHAK)
  { brand: 'SHAK', lat: 40.7410, lng: -73.9887, address: 'Madison Square Park (Original), NY' },
  { brand: 'SHAK', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'SHAK', lat: 40.7061, lng: -74.0089, address: 'Financial District, NY' },
  { brand: 'SHAK', lat: 41.8827, lng: -87.6233, address: 'Chicago, IL' },
  { brand: 'SHAK', lat: 34.0195, lng: -118.4912, address: 'Santa Monica, CA' },
  { brand: 'SHAK', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },

  // Wingstop (WING)
  { brand: 'WING', lat: 32.7767, lng: -96.7970, address: 'Dallas HQ, TX' },
  { brand: 'WING', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'WING', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'WING', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'WING', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },

  // Jack in the Box (JACK)
  { brand: 'JACK', lat: 32.7157, lng: -117.1611, address: 'San Diego HQ, CA' },
  { brand: 'JACK', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'JACK', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'JACK', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'JACK', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },

  // Papa Johns (PZZA)
  { brand: 'PZZA', lat: 38.2527, lng: -85.7585, address: 'Louisville HQ, KY' },
  { brand: 'PZZA', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'PZZA', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'PZZA', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'PZZA', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },

  // Casual Dining
  { brand: 'DRI', lat: 28.4580, lng: -81.4697, address: 'Olive Garden - Orlando, FL' },
  { brand: 'DRI', lat: 40.7580, lng: -73.9855, address: 'Olive Garden - Times Square, NY' },
  { brand: 'DRI', lat: 41.8781, lng: -87.6298, address: 'LongHorn - Chicago, IL' },
  { brand: 'DRI', lat: 34.0522, lng: -118.2437, address: 'Olive Garden - LA, CA' },
  { brand: 'TXRH', lat: 38.2527, lng: -85.7585, address: 'Louisville HQ, KY' },
  { brand: 'TXRH', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'TXRH', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'TXRH', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },
  { brand: 'CAKE', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'CAKE', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'CAKE', lat: 41.8827, lng: -87.6233, address: 'Chicago, IL' },
  { brand: 'CAKE', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'DENN', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'DENN', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'DENN', lat: 33.4484, lng: -112.0740, address: 'Phoenix, AZ' },
  { brand: 'DENN', lat: 40.7580, lng: -73.9855, address: 'New York, NY' },
  { brand: 'DIN', lat: 34.1478, lng: -118.1445, address: 'IHOP HQ - Glendale, CA' },
  { brand: 'DIN', lat: 40.7580, lng: -73.9855, address: 'IHOP - New York, NY' },
  { brand: 'DIN', lat: 41.8781, lng: -87.6298, address: 'Applebees - Chicago, IL' },
  { brand: 'DIN', lat: 32.7767, lng: -96.7970, address: 'IHOP - Dallas, TX' },
  { brand: 'BLMN', lat: 27.9506, lng: -82.4572, address: 'Outback HQ - Tampa, FL' },
  { brand: 'BLMN', lat: 40.7580, lng: -73.9855, address: 'Outback - New York, NY' },
  { brand: 'BLMN', lat: 41.8781, lng: -87.6298, address: 'Outback - Chicago, IL' },
  { brand: 'EAT', lat: 32.7767, lng: -96.7970, address: 'Chilis HQ - Dallas, TX' },
  { brand: 'EAT', lat: 40.7580, lng: -73.9855, address: 'Chilis - New York, NY' },
  { brand: 'EAT', lat: 34.0522, lng: -118.2437, address: 'Maggianos - LA, CA' },

  // Hotels
  { brand: 'MAR', lat: 40.7484, lng: -73.9857, address: 'Marriott Marquis - Times Square, NY' },
  { brand: 'MAR', lat: 41.8902, lng: -87.6262, address: 'JW Marriott - Chicago, IL' },
  { brand: 'MAR', lat: 34.0522, lng: -118.2437, address: 'Ritz-Carlton - LA, CA' },
  { brand: 'MAR', lat: 37.7749, lng: -122.4194, address: 'W Hotel - San Francisco, CA' },
  { brand: 'MAR', lat: 25.7617, lng: -80.1918, address: 'Marriott - Miami, FL' },
  { brand: 'HLT', lat: 40.7614, lng: -73.9776, address: 'Hilton Midtown - New York, NY' },
  { brand: 'HLT', lat: 41.8902, lng: -87.6262, address: 'Hilton Chicago, IL' },
  { brand: 'HLT', lat: 36.1699, lng: -115.1398, address: 'Hilton - Las Vegas, NV' },
  { brand: 'HLT', lat: 33.7490, lng: -84.3880, address: 'Hilton - Atlanta, GA' },
  { brand: 'H', lat: 40.7527, lng: -73.9772, address: 'Grand Hyatt - New York, NY' },
  { brand: 'H', lat: 41.8781, lng: -87.6298, address: 'Hyatt Regency - Chicago, IL' },
  { brand: 'H', lat: 34.0522, lng: -118.2437, address: 'Andaz - LA, CA' },
  { brand: 'IHG', lat: 33.7490, lng: -84.3880, address: 'IHG HQ - Atlanta, GA' },
  { brand: 'IHG', lat: 40.7580, lng: -73.9855, address: 'Holiday Inn - Times Square, NY' },
  { brand: 'IHG', lat: 41.8781, lng: -87.6298, address: 'InterContinental - Chicago, IL' },
  { brand: 'WH', lat: 40.0150, lng: -74.1147, address: 'Wyndham - NJ' },
  { brand: 'WH', lat: 40.7580, lng: -73.9855, address: 'Days Inn - New York, NY' },
  { brand: 'WH', lat: 28.5383, lng: -81.3792, address: 'Ramada - Orlando, FL' },
  { brand: 'CHH', lat: 39.1434, lng: -77.2014, address: 'Choice HQ - Rockville, MD' },
  { brand: 'CHH', lat: 40.7580, lng: -73.9855, address: 'Comfort Inn - New York, NY' },
  { brand: 'CHH', lat: 34.0522, lng: -118.2437, address: 'Quality Inn - LA, CA' },

  // Fitness
  { brand: 'PLNT', lat: 40.6892, lng: -74.0445, address: 'Planet Fitness HQ - NJ' },
  { brand: 'PLNT', lat: 40.7580, lng: -73.9855, address: 'Times Square, NY' },
  { brand: 'PLNT', lat: 41.8781, lng: -87.6298, address: 'Chicago, IL' },
  { brand: 'PLNT', lat: 34.0522, lng: -118.2437, address: 'LA, CA' },
  { brand: 'PLNT', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'PLNT', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },
  { brand: 'PLNT', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },
  { brand: 'XPOF', lat: 33.6846, lng: -117.8265, address: 'Xponential HQ - Irvine, CA' },
  { brand: 'XPOF', lat: 40.7580, lng: -73.9855, address: 'CycleBar - New York, NY' },
  { brand: 'XPOF', lat: 34.0522, lng: -118.2437, address: 'Club Pilates - LA, CA' }
];

// ============================================================================
// GLOBAL STATE
// ============================================================================

let map;
let markers = [];
let markerLayer;
let clusterLayer;
let heatLayer;
let radiusCircle = null;
let selectedBrands = new Set(Object.keys(BRANDS));
let currentView = 'markers'; // 'markers', 'cluster', 'heat'
let selectedLocation = null;

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', initMap);

function initMap() {
  // Check for embed mode
  if (new URLSearchParams(window.location.search).get('embed') === 'true') {
    document.body.classList.add('embed-mode');
  }

  // Create map centered on US
  map = L.map('map', {
    center: [39.8283, -98.5795],
    zoom: 4,
    zoomControl: true,
    scrollWheelZoom: true
  });

  // Add OpenStreetMap tiles with dark style option
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(map);

  // Create layers
  markerLayer = L.layerGroup().addTo(map);
  clusterLayer = L.markerClusterGroup({
    chunkedLoading: true,
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: function(cluster) {
      const count = cluster.getChildCount();
      let size = 'small';
      if (count >= 100) size = 'large';
      else if (count >= 10) size = 'medium';

      return L.divIcon({
        html: `<div>${count}</div>`,
        className: `marker-cluster marker-cluster-${size}`,
        iconSize: L.point(40, 40)
      });
    }
  });

  // Build UI
  buildBrandCheckboxes();
  addMarkers();
  setupEventListeners();
  addMapControls();
  updateStats();

  console.log(`✓ Interactive map initialized with ${franchiseLocations.length} locations`);
}

// ============================================================================
// BRAND CHECKBOX UI
// ============================================================================

function buildBrandCheckboxes() {
  const container = document.getElementById('brand-checkboxes');
  if (!container) return;

  const grouped = {};
  Object.entries(BRANDS).forEach(([symbol, brand]) => {
    if (!grouped[brand.type]) grouped[brand.type] = [];
    grouped[brand.type].push({ symbol, ...brand });
  });

  let html = `
    <div class="brand-actions">
      <button type="button" class="select-all" onclick="selectAllBrands()">Select All</button>
      <button type="button" class="select-none" onclick="selectNoBrands()">Clear All</button>
    </div>
  `;

  Object.entries(grouped).forEach(([type, brands]) => {
    html += `<div class="brand-group">
      <div class="brand-group-title">${type}</div>`;

    brands.forEach(brand => {
      const count = franchiseLocations.filter(l => l.brand === brand.symbol).length;
      html += `
        <label class="brand-checkbox">
          <input type="checkbox" value="${brand.symbol}" checked onchange="toggleBrand('${brand.symbol}', this.checked)">
          <span class="brand-color" style="background: ${brand.color}"></span>
          <span class="brand-name">${brand.name}</span>
          <span class="brand-ticker">${brand.symbol} (${count})</span>
        </label>
      `;
    });

    html += '</div>';
  });

  container.innerHTML = html;
}

// ============================================================================
// MARKERS & LAYERS
// ============================================================================

function addMarkers() {
  franchiseLocations.forEach((location, index) => {
    const brand = BRANDS[location.brand];
    if (!brand) return;

    // Create circle marker for regular view
    const circleMarker = L.circleMarker([location.lat, location.lng], {
      radius: 8,
      fillColor: brand.color,
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.85
    });

    // Create icon marker for cluster view
    const iconMarker = L.marker([location.lat, location.lng], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div style="background:${brand.color};width:24px;height:24px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })
    });

    // Enhanced popup
    const popupContent = createPopupContent(location, brand);
    circleMarker.bindPopup(popupContent, { className: 'custom-popup', maxWidth: 280 });
    iconMarker.bindPopup(popupContent, { className: 'custom-popup', maxWidth: 280 });

    // Click handlers
    const clickHandler = () => {
      selectedLocation = { location, brand };
      showLocationDetails(location, brand);
    };

    circleMarker.on('click', clickHandler);
    iconMarker.on('click', clickHandler);

    // Hover effects
    circleMarker.on('mouseover', function() { this.setStyle({ radius: 12, weight: 3 }); });
    circleMarker.on('mouseout', function() { this.setStyle({ radius: 8, weight: 2 }); });

    circleMarker.addTo(markerLayer);
    clusterLayer.addLayer(iconMarker);

    markers.push({
      circleMarker,
      iconMarker,
      location,
      brand,
      index
    });
  });

  // Create heat layer data
  const heatData = franchiseLocations.map(l => [l.lat, l.lng, 0.5]);
  heatLayer = L.heatLayer(heatData, {
    radius: 25,
    blur: 15,
    maxZoom: 10,
    gradient: {
      0.2: '#667eea',
      0.4: '#764ba2',
      0.6: '#f093fb',
      0.8: '#f5576c',
      1.0: '#ff4444'
    }
  });
}

function createPopupContent(location, brand) {
  const nearbyCount = findNearbyCompetitors(location, 2).length;

  return `
    <div class="popup-content">
      <div class="popup-header">
        <span class="popup-brand-color" style="background:${brand.color}"></span>
        <span class="popup-brand-name">${brand.name}</span>
        <span class="popup-ticker">${location.brand}</span>
      </div>
      <div class="popup-address">${location.address}</div>
      <div style="font-size:0.8em;color:rgba(255,255,255,0.6);margin-bottom:10px;">
        ${nearbyCount} competitors within 2 miles
      </div>
      <div class="popup-actions">
        <button class="popup-btn popup-btn-primary" onclick="analyzeCompetitors(${location.lat}, ${location.lng})">
          Analyze Area
        </button>
        <button class="popup-btn popup-btn-secondary" onclick="zoomToLocation(${location.lat}, ${location.lng})">
          Zoom In
        </button>
      </div>
    </div>
  `;
}

// ============================================================================
// VIEW MODE SWITCHING
// ============================================================================

function switchView(mode) {
  currentView = mode;

  // Update button states
  document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`view-${mode === 'markers' ? 'markers' : mode === 'cluster' ? 'cluster' : 'heat'}`)?.classList.add('active');

  // Remove all layers
  map.removeLayer(markerLayer);
  map.removeLayer(clusterLayer);
  if (heatLayer) map.removeLayer(heatLayer);

  // Add appropriate layer
  switch(mode) {
    case 'markers':
      map.addLayer(markerLayer);
      break;
    case 'cluster':
      map.addLayer(clusterLayer);
      break;
    case 'heat':
      map.addLayer(heatLayer);
      break;
  }

  filterMarkers();
}

// ============================================================================
// FILTERING
// ============================================================================

function toggleBrand(symbol, checked) {
  if (checked) {
    selectedBrands.add(symbol);
  } else {
    selectedBrands.delete(symbol);
  }
  filterMarkers();
  updateStats();
}

function selectAllBrands() {
  selectedBrands = new Set(Object.keys(BRANDS));
  document.querySelectorAll('#brand-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = true);
  filterMarkers();
  updateStats();
}

function selectNoBrands() {
  selectedBrands.clear();
  document.querySelectorAll('#brand-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
  filterMarkers();
  updateStats();
}

function filterMarkers() {
  const center = map.getCenter();
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect ? radiusSelect.value : 'all';

  // Clear and rebuild cluster layer
  clusterLayer.clearLayers();

  markers.forEach(({ circleMarker, iconMarker, location }) => {
    let show = selectedBrands.has(location.brand);

    if (show && radiusMiles !== 'all') {
      const radiusKm = parseFloat(radiusMiles) * 1.60934;
      const distance = map.distance(center, [location.lat, location.lng]) / 1000;
      show = distance <= radiusKm;
    }

    if (show) {
      circleMarker.addTo(markerLayer);
      clusterLayer.addLayer(iconMarker);
    } else {
      markerLayer.removeLayer(circleMarker);
    }
  });

  // Update heat layer with filtered data
  if (heatLayer) {
    const heatData = markers
      .filter(({ location }) => {
        if (!selectedBrands.has(location.brand)) return false;
        if (radiusMiles !== 'all') {
          const radiusKm = parseFloat(radiusMiles) * 1.60934;
          const distance = map.distance(center, [location.lat, location.lng]) / 1000;
          return distance <= radiusKm;
        }
        return true;
      })
      .map(({ location }) => [location.lat, location.lng, 0.5]);

    heatLayer.setLatLngs(heatData);
  }

  updateStats();
}

// ============================================================================
// STATISTICS
// ============================================================================

function updateStats() {
  const center = map.getCenter();
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect ? radiusSelect.value : 'all';

  let visible = 0;
  let qsr = 0, casual = 0, hotel = 0, fitness = 0;
  const brandsVisible = new Set();

  markers.forEach(({ location }) => {
    if (!selectedBrands.has(location.brand)) return;

    if (radiusMiles !== 'all') {
      const radiusKm = parseFloat(radiusMiles) * 1.60934;
      const distance = map.distance(center, [location.lat, location.lng]) / 1000;
      if (distance > radiusKm) return;
    }

    visible++;
    brandsVisible.add(location.brand);

    const brand = BRANDS[location.brand];
    if (brand) {
      switch(brand.type) {
        case 'QSR': qsr++; break;
        case 'Casual': casual++; break;
        case 'Hotel': hotel++; break;
        case 'Fitness': fitness++; break;
      }
    }
  });

  // Update DOM
  const updateEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  updateEl('stat-visible', visible);
  updateEl('stat-brands', brandsVisible.size);
  updateEl('stat-qsr', qsr);
  updateEl('stat-casual', casual);
  updateEl('stat-hotel', hotel);
  updateEl('stat-fitness', fitness);
}

// ============================================================================
// COMPETITOR ANALYSIS
// ============================================================================

function findNearbyCompetitors(location, radiusMiles = 5) {
  const radiusKm = radiusMiles * 1.60934;
  const nearby = [];

  markers.forEach(({ location: loc, brand }) => {
    if (loc === location) return;

    const distance = getDistanceKm(location.lat, location.lng, loc.lat, loc.lng);
    if (distance <= radiusKm) {
      nearby.push({
        location: loc,
        brand,
        distance: distance * 0.621371 // Convert back to miles
      });
    }
  });

  return nearby.sort((a, b) => a.distance - b.distance);
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function showLocationDetails(location, brand) {
  const panel = document.getElementById('info-panel');
  const nameEl = document.getElementById('location-name');
  const detailsEl = document.getElementById('location-details');

  if (!panel || !nameEl || !detailsEl) return;

  const competitors = findNearbyCompetitors(location, 5);
  const competitorsByBrand = {};
  competitors.forEach(c => {
    if (!competitorsByBrand[c.brand.type]) competitorsByBrand[c.brand.type] = [];
    competitorsByBrand[c.brand.type].push(c);
  });

  nameEl.innerHTML = `<span style="color:${brand.color}">●</span> ${brand.name}`;

  let competitorHtml = '';
  if (competitors.length > 0) {
    competitorHtml = `
      <div class="competitor-section">
        <h4>🎯 Nearby Competitors (${competitors.length} within 5 mi)</h4>
        <div class="competitor-list">
          ${competitors.slice(0, 8).map(c => `
            <div class="competitor-item" onclick="flyToLocation(${c.location.lat}, ${c.location.lng})">
              <span class="competitor-color" style="background:${c.brand.color}"></span>
              <span>${c.brand.name}</span>
              <span class="competitor-distance">${c.distance.toFixed(1)} mi</span>
            </div>
          `).join('')}
          ${competitors.length > 8 ? `<div style="color:rgba(255,255,255,0.5);font-size:0.8em;padding:8px;">+${competitors.length - 8} more</div>` : ''}
        </div>
      </div>
    `;
  }

  detailsEl.innerHTML = `
    <p><strong>Ticker:</strong> ${location.brand}</p>
    <p><strong>Category:</strong> ${brand.type}</p>
    <p><strong>Address:</strong> ${location.address}</p>
    <p><strong>Coordinates:</strong> ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</p>
    <div style="margin-top:12px;">
      <button onclick="analyzeCompetitors(${location.lat}, ${location.lng})"
              style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;width:100%;">
        📊 Full Competitor Analysis
      </button>
    </div>
    ${competitorHtml}
  `;

  panel.classList.add('active');
}

function analyzeCompetitors(lat, lng) {
  // Zoom to location with radius
  map.setView([lat, lng], 13);

  // Apply 5-mile radius filter
  document.getElementById('radius-filter').value = '5';
  applyRadiusFilter('5');

  // Close panel
  document.getElementById('info-panel')?.classList.remove('active');
}

// ============================================================================
// SEARCH & NAVIGATION
// ============================================================================

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

      const searchMarker = L.marker([lat, lon], {
        icon: L.divIcon({
          className: 'search-marker',
          html: '<div style="background:#667eea;width:30px;height:30px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;">📍</div>',
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map);

      searchMarker.bindPopup(`<strong>Search Result</strong><br>${display_name}`).openPopup();
      setTimeout(() => map.removeLayer(searchMarker), 10000);

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

function applyRadiusFilter(miles) {
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }

  if (miles !== 'all') {
    const center = map.getCenter();
    const radiusMeters = parseFloat(miles) * 1609.34;

    radiusCircle = L.circle(center, {
      radius: radiusMeters,
      color: '#667eea',
      fillColor: '#667eea',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '8, 8'
    }).addTo(map);
  }

  filterMarkers();
}

function zoomToLocation(lat, lng) {
  map.setView([lat, lng], 15);
}

function flyToLocation(lat, lng) {
  map.flyTo([lat, lng], 14, { duration: 1 });
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

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
    radiusSelect.addEventListener('change', (e) => applyRadiusFilter(e.target.value));
  }

  // View mode buttons
  document.getElementById('view-markers')?.addEventListener('click', () => switchView('markers'));
  document.getElementById('view-cluster')?.addEventListener('click', () => switchView('cluster'));
  document.getElementById('view-heat')?.addEventListener('click', () => switchView('heat'));

  // Close panel
  document.getElementById('close-panel')?.addEventListener('click', () => {
    document.getElementById('info-panel')?.classList.remove('active');
  });

  // Update on map move
  map.on('moveend', () => {
    const radiusSelect = document.getElementById('radius-filter');
    if (radiusSelect && radiusSelect.value !== 'all') {
      applyRadiusFilter(radiusSelect.value);
    }
    updateStats();
  });
}

// ============================================================================
// MAP CONTROLS
// ============================================================================

function addMapControls() {
  // Reset view control
  const ResetControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      btn.innerHTML = '<a href="#" title="Reset View" style="display:block;width:34px;height:34px;line-height:34px;text-align:center;font-size:18px;text-decoration:none;background:#fff;">🏠</a>';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        map.setView([39.8283, -98.5795], 4);
        document.getElementById('radius-filter').value = 'all';
        applyRadiusFilter('all');
      };
      return btn;
    }
  });
  map.addControl(new ResetControl());

  // Locate me control
  const LocateControl = L.Control.extend({
    options: { position: 'topright' },
    onAdd: function() {
      const btn = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      btn.innerHTML = '<a href="#" title="My Location" style="display:block;width:34px;height:34px;line-height:34px;text-align:center;font-size:18px;text-decoration:none;background:#fff;">📍</a>';
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              map.setView([pos.coords.latitude, pos.coords.longitude], 12);
              filterMarkers();
            },
            () => alert('Could not get your location')
          );
        }
      };
      return btn;
    }
  });
  map.addControl(new LocateControl());
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.toggleBrand = toggleBrand;
window.selectAllBrands = selectAllBrands;
window.selectNoBrands = selectNoBrands;
window.analyzeCompetitors = analyzeCompetitors;
window.zoomToLocation = zoomToLocation;
window.flyToLocation = flyToLocation;
