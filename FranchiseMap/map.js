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
  { brand: 'XPOF', lat: 34.0522, lng: -118.2437, address: 'Club Pilates - LA, CA' },

  // === EXPANDED LOCATIONS ===

  // Additional McDonald's (MCD)
  { brand: 'MCD', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'MCD', lat: 36.1699, lng: -115.1398, address: 'Las Vegas Strip, NV' },
  { brand: 'MCD', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'MCD', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'MCD', lat: 30.2672, lng: -97.7431, address: 'Austin, TX' },
  { brand: 'MCD', lat: 39.0997, lng: -94.5786, address: 'Kansas City, MO' },
  { brand: 'MCD', lat: 44.9778, lng: -93.2650, address: 'Minneapolis, MN' },
  { brand: 'MCD', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'MCD', lat: 45.5051, lng: -122.6750, address: 'Portland, OR' },
  { brand: 'MCD', lat: 32.7157, lng: -117.1611, address: 'San Diego, CA' },

  // Additional Starbucks (SBUX)
  { brand: 'SBUX', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'SBUX', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'SBUX', lat: 38.9072, lng: -77.0369, address: 'Georgetown, Washington DC' },
  { brand: 'SBUX', lat: 45.5051, lng: -122.6750, address: 'Portland, OR' },
  { brand: 'SBUX', lat: 32.7157, lng: -117.1611, address: 'Gaslamp Quarter, San Diego, CA' },
  { brand: 'SBUX', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'SBUX', lat: 39.9612, lng: -82.9988, address: 'Columbus, OH' },
  { brand: 'SBUX', lat: 33.4484, lng: -112.0773, address: 'Scottsdale, AZ' },

  // Additional Chipotle (CMG)
  { brand: 'CMG', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'CMG', lat: 30.2672, lng: -97.7431, address: 'Austin, TX' },
  { brand: 'CMG', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'CMG', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'CMG', lat: 45.5051, lng: -122.6750, address: 'Portland, OR' },
  { brand: 'CMG', lat: 44.9778, lng: -93.2650, address: 'Minneapolis, MN' },

  // Additional Domino's (DPZ)
  { brand: 'DPZ', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'DPZ', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'DPZ', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'DPZ', lat: 30.2672, lng: -97.7431, address: 'Austin, TX' },
  { brand: 'DPZ', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'DPZ', lat: 25.7617, lng: -80.1918, address: 'Miami, FL' },
  { brand: 'DPZ', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },

  // Additional Wendy's (WEN)
  { brand: 'WEN', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'WEN', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'WEN', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'WEN', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'WEN', lat: 44.9778, lng: -93.2650, address: 'Minneapolis, MN' },
  { brand: 'WEN', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },

  // Additional Shake Shack (SHAK)
  { brand: 'SHAK', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'SHAK', lat: 33.7490, lng: -84.3880, address: 'Atlanta, GA' },
  { brand: 'SHAK', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },
  { brand: 'SHAK', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'SHAK', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },

  // Additional Yum! Brands (YUM)
  { brand: 'YUM', lat: 38.2527, lng: -85.7585, address: 'Yum! HQ - Louisville, KY' },
  { brand: 'YUM', lat: 39.7392, lng: -104.9903, address: 'Taco Bell - Denver, CO' },
  { brand: 'YUM', lat: 38.9072, lng: -77.0369, address: 'KFC - Washington DC' },
  { brand: 'YUM', lat: 36.1627, lng: -86.7816, address: 'Pizza Hut - Nashville, TN' },
  { brand: 'YUM', lat: 45.5051, lng: -122.6750, address: 'Taco Bell - Portland, OR' },
  { brand: 'YUM', lat: 32.7157, lng: -117.1611, address: 'KFC - San Diego, CA' },

  // Additional Restaurant Brands (QSR)
  { brand: 'QSR', lat: 38.9072, lng: -77.0369, address: 'Burger King - Washington DC' },
  { brand: 'QSR', lat: 39.7392, lng: -104.9903, address: 'Burger King - Denver, CO' },
  { brand: 'QSR', lat: 36.1699, lng: -115.1398, address: 'Burger King - Las Vegas, NV' },
  { brand: 'QSR', lat: 45.4215, lng: -75.6972, address: 'Tim Hortons - Ottawa, ON' },
  { brand: 'QSR', lat: 49.2827, lng: -123.1207, address: 'Tim Hortons - Vancouver, BC' },

  // Additional Wingstop (WING)
  { brand: 'WING', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'WING', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'WING', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'WING', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'WING', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },

  // Additional Papa John's (PZZA)
  { brand: 'PZZA', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'PZZA', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'PZZA', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'PZZA', lat: 39.9526, lng: -75.1652, address: 'Philadelphia, PA' },
  { brand: 'PZZA', lat: 42.3601, lng: -71.0589, address: 'Boston, MA' },

  // Additional Jack in the Box (JACK)
  { brand: 'JACK', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'JACK', lat: 34.0195, lng: -118.4912, address: 'Santa Monica, CA' },
  { brand: 'JACK', lat: 37.7749, lng: -122.4194, address: 'San Francisco, CA' },
  { brand: 'JACK', lat: 47.6062, lng: -122.3321, address: 'Seattle, WA' },
  { brand: 'JACK', lat: 33.4255, lng: -111.9400, address: 'Tempe, AZ' },

  // Additional Casual Dining
  { brand: 'DRI', lat: 38.9072, lng: -77.0369, address: 'Olive Garden - Washington DC' },
  { brand: 'DRI', lat: 39.7392, lng: -104.9903, address: 'LongHorn - Denver, CO' },
  { brand: 'DRI', lat: 36.1627, lng: -86.7816, address: 'Olive Garden - Nashville, TN' },
  { brand: 'TXRH', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'TXRH', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'TXRH', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'TXRH', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'CAKE', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'CAKE', lat: 36.1699, lng: -115.1398, address: 'Las Vegas, NV' },
  { brand: 'CAKE', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'DENN', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'DENN', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'DENN', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'DIN', lat: 38.9072, lng: -77.0369, address: 'IHOP - Washington DC' },
  { brand: 'DIN', lat: 39.7392, lng: -104.9903, address: 'Applebees - Denver, CO' },
  { brand: 'DIN', lat: 36.1627, lng: -86.7816, address: 'IHOP - Nashville, TN' },
  { brand: 'BLMN', lat: 38.9072, lng: -77.0369, address: 'Outback - Washington DC' },
  { brand: 'BLMN', lat: 39.7392, lng: -104.9903, address: 'Outback - Denver, CO' },
  { brand: 'BLMN', lat: 36.1627, lng: -86.7816, address: 'Outback - Nashville, TN' },
  { brand: 'EAT', lat: 38.9072, lng: -77.0369, address: 'Chilis - Washington DC' },
  { brand: 'EAT', lat: 39.7392, lng: -104.9903, address: 'Chilis - Denver, CO' },
  { brand: 'EAT', lat: 36.1627, lng: -86.7816, address: 'Chilis - Nashville, TN' },

  // Additional Hotels
  { brand: 'MAR', lat: 38.9072, lng: -77.0369, address: 'JW Marriott - Washington DC' },
  { brand: 'MAR', lat: 39.7392, lng: -104.9903, address: 'Renaissance - Denver, CO' },
  { brand: 'MAR', lat: 36.1627, lng: -86.7816, address: 'Marriott - Nashville, TN' },
  { brand: 'MAR', lat: 47.6062, lng: -122.3321, address: 'W Hotel - Seattle, WA' },
  { brand: 'MAR', lat: 32.7157, lng: -117.1611, address: 'Marriott - San Diego, CA' },
  { brand: 'HLT', lat: 38.9072, lng: -77.0369, address: 'Hilton - Washington DC' },
  { brand: 'HLT', lat: 39.7392, lng: -104.9903, address: 'Hilton - Denver, CO' },
  { brand: 'HLT', lat: 36.1627, lng: -86.7816, address: 'Hilton - Nashville, TN' },
  { brand: 'HLT', lat: 32.7157, lng: -117.1611, address: 'Hilton - San Diego, CA' },
  { brand: 'H', lat: 38.9072, lng: -77.0369, address: 'Hyatt - Washington DC' },
  { brand: 'H', lat: 39.7392, lng: -104.9903, address: 'Hyatt Regency - Denver, CO' },
  { brand: 'H', lat: 36.1627, lng: -86.7816, address: 'Hyatt Place - Nashville, TN' },
  { brand: 'IHG', lat: 38.9072, lng: -77.0369, address: 'Holiday Inn - Washington DC' },
  { brand: 'IHG', lat: 39.7392, lng: -104.9903, address: 'Crowne Plaza - Denver, CO' },
  { brand: 'IHG', lat: 36.1627, lng: -86.7816, address: 'Holiday Inn - Nashville, TN' },
  { brand: 'WH', lat: 38.9072, lng: -77.0369, address: 'Wyndham - Washington DC' },
  { brand: 'WH', lat: 39.7392, lng: -104.9903, address: 'La Quinta - Denver, CO' },
  { brand: 'CHH', lat: 38.9072, lng: -77.0369, address: 'Comfort Inn - Washington DC' },
  { brand: 'CHH', lat: 39.7392, lng: -104.9903, address: 'Quality Inn - Denver, CO' },

  // Additional Fitness
  { brand: 'PLNT', lat: 38.9072, lng: -77.0369, address: 'Washington DC' },
  { brand: 'PLNT', lat: 39.7392, lng: -104.9903, address: 'Denver, CO' },
  { brand: 'PLNT', lat: 36.1627, lng: -86.7816, address: 'Nashville, TN' },
  { brand: 'PLNT', lat: 35.2271, lng: -80.8431, address: 'Charlotte, NC' },
  { brand: 'PLNT', lat: 32.7767, lng: -96.7970, address: 'Dallas, TX' },
  { brand: 'PLNT', lat: 29.7604, lng: -95.3698, address: 'Houston, TX' },
  { brand: 'XPOF', lat: 38.9072, lng: -77.0369, address: 'Pure Barre - Washington DC' },
  { brand: 'XPOF', lat: 39.7392, lng: -104.9903, address: 'CycleBar - Denver, CO' },
  { brand: 'XPOF', lat: 36.1627, lng: -86.7816, address: 'Club Pilates - Nashville, TN' },
  { brand: 'XPOF', lat: 42.3601, lng: -71.0589, address: 'StretchLab - Boston, MA' },
  { brand: 'XPOF', lat: 41.8781, lng: -87.6298, address: 'YogaSix - Chicago, IL' }
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
let selectedCategories = new Set(['QSR', 'Casual', 'Hotel', 'Fitness']);
let currentView = 'cluster'; // 'markers', 'cluster', 'heat'
let selectedLocation = null;

// Tile layers
let streetLayer;
let satelliteLayer;
let currentMapStyle = 'street';

// New feature states
let droppedPin = null;
let measurementMode = false;
let measurePoints = [];
let measureLine = null;
let measureMarkers = [];
let drawMode = false;
let drawPolygon = null;
let drawPoints = [];
let isFullscreen = false;
let clusteringEnabled = true;

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

  // Create tile layers - Street (dark) and Satellite
  streetLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    maxZoom: 19
  });

  satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '© Esri, Maxar, Earthstar Geographics',
    maxZoom: 19
  });

  // Add default street layer
  streetLayer.addTo(map);

  // Create layers
  markerLayer = L.layerGroup();
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

  // Add cluster layer by default (matching currentView = 'cluster')
  map.addLayer(clusterLayer);

  // Build UI
  buildBrandPills();
  addMarkers();
  setupEventListeners();
  setupControlRail();
  addMapControls();
  addAdvancedControls();
  updateStats();
  updateVisibleCount();

  // Enable click-to-drop-pin for competitor analysis
  map.on('click', handleMapClick);

  console.log(`✓ Interactive map initialized with ${franchiseLocations.length} locations`);
}

// ============================================================================
// BRAND PILLS UI - Clickable text toggles
// ============================================================================

function buildBrandPills() {
  const container = document.getElementById('brand-pills');
  if (!container) return;

  // Group brands by type for organized display
  const grouped = {};
  Object.entries(BRANDS).forEach(([symbol, brand]) => {
    if (!grouped[brand.type]) grouped[brand.type] = [];
    grouped[brand.type].push({ symbol, ...brand });
  });

  let html = '';

  // Add all brands as pills (grouped by category)
  Object.entries(grouped).forEach(([type, brands]) => {
    brands.forEach(brand => {
      const count = franchiseLocations.filter(l => l.brand === brand.symbol).length;
      const isActive = selectedBrands.has(brand.symbol);
      html += `
        <button class="brand-pill ${isActive ? 'active' : ''}"
                data-brand="${brand.symbol}"
                data-category="${brand.type}"
                onclick="toggleBrandPill('${brand.symbol}')">
          <span class="pill-color" style="background: ${brand.color}"></span>
          <span class="pill-name">${brand.symbol}</span>
          <span class="pill-count">${count}</span>
        </button>
      `;
    });
  });

  container.innerHTML = html;
}

function toggleBrandPill(symbol) {
  const pill = document.querySelector(`.brand-pill[data-brand="${symbol}"]`);

  if (selectedBrands.has(symbol)) {
    selectedBrands.delete(symbol);
    pill?.classList.remove('active');
  } else {
    selectedBrands.add(symbol);
    pill?.classList.add('active');
  }

  filterMarkers();
  updateStats();
  updateVisibleCount();
  updateCategoryPillStates();
}

function updateCategoryPillStates() {
  // Update category pill states based on whether all brands in that category are selected
  ['QSR', 'Casual', 'Hotel', 'Fitness'].forEach(category => {
    const brandsInCategory = Object.entries(BRANDS)
      .filter(([_, b]) => b.type === category)
      .map(([symbol, _]) => symbol);

    const allSelected = brandsInCategory.every(b => selectedBrands.has(b));
    const someSelected = brandsInCategory.some(b => selectedBrands.has(b));

    const pill = document.querySelector(`.category-pill[data-category="${category}"]`);
    if (pill) {
      if (allSelected) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    }

    // Update selectedCategories set
    if (someSelected) {
      selectedCategories.add(category);
    } else {
      selectedCategories.delete(category);
    }
  });
}

// ============================================================================
// CONTROL RAIL SETUP
// ============================================================================

function setupControlRail() {
  // Map style buttons
  document.getElementById('style-street')?.addEventListener('click', () => switchMapStyle('street'));
  document.getElementById('style-satellite')?.addEventListener('click', () => switchMapStyle('satellite'));

  // Display toggle buttons
  document.getElementById('toggle-cluster')?.addEventListener('click', toggleClustering);
  document.getElementById('toggle-heat')?.addEventListener('click', toggleHeatMap);

  // Brand action buttons
  document.getElementById('select-all-brands')?.addEventListener('click', selectAllBrands);
  document.getElementById('select-none-brands')?.addEventListener('click', selectNoBrands);

  // Category pills
  document.querySelectorAll('.category-pill').forEach(pill => {
    pill.addEventListener('click', () => toggleCategory(pill.dataset.category));
  });

  // Update category counts
  updateCategoryCounts();
}

function switchMapStyle(style) {
  currentMapStyle = style;

  // Update button states
  document.getElementById('style-street')?.classList.toggle('active', style === 'street');
  document.getElementById('style-satellite')?.classList.toggle('active', style === 'satellite');

  // Switch layers
  if (style === 'street') {
    map.removeLayer(satelliteLayer);
    map.addLayer(streetLayer);
  } else {
    map.removeLayer(streetLayer);
    map.addLayer(satelliteLayer);
  }
}

function toggleClustering() {
  const btn = document.getElementById('toggle-cluster');
  clusteringEnabled = !clusteringEnabled;
  btn?.classList.toggle('active', clusteringEnabled);

  if (clusteringEnabled) {
    // Switch to cluster view
    currentView = 'cluster';
    map.removeLayer(markerLayer);
    if (heatLayer) map.removeLayer(heatLayer);
    map.addLayer(clusterLayer);
    document.getElementById('toggle-heat')?.classList.remove('active');
  } else {
    // Switch to markers view
    currentView = 'markers';
    map.removeLayer(clusterLayer);
    if (heatLayer) map.removeLayer(heatLayer);
    map.addLayer(markerLayer);
    document.getElementById('toggle-heat')?.classList.remove('active');
  }

  filterMarkers();
}

function toggleHeatMap() {
  const btn = document.getElementById('toggle-heat');
  const isHeatActive = btn?.classList.contains('active');

  if (isHeatActive) {
    // Turn off heat map, return to cluster or markers
    btn?.classList.remove('active');
    if (heatLayer) map.removeLayer(heatLayer);

    if (clusteringEnabled) {
      currentView = 'cluster';
      map.addLayer(clusterLayer);
    } else {
      currentView = 'markers';
      map.addLayer(markerLayer);
    }
  } else {
    // Turn on heat map
    btn?.classList.add('active');
    currentView = 'heat';
    map.removeLayer(markerLayer);
    map.removeLayer(clusterLayer);
    if (heatLayer) map.addLayer(heatLayer);
  }

  filterMarkers();
}

function toggleCategory(category) {
  const brandsInCategory = Object.entries(BRANDS)
    .filter(([_, b]) => b.type === category)
    .map(([symbol, _]) => symbol);

  const pill = document.querySelector(`.category-pill[data-category="${category}"]`);
  const isActive = pill?.classList.contains('active');

  if (isActive) {
    // Deselect all brands in this category
    brandsInCategory.forEach(b => selectedBrands.delete(b));
    pill?.classList.remove('active');
  } else {
    // Select all brands in this category
    brandsInCategory.forEach(b => selectedBrands.add(b));
    pill?.classList.add('active');
  }

  // Update brand pill states
  document.querySelectorAll('.brand-pill').forEach(pillEl => {
    const brand = pillEl.dataset.brand;
    pillEl.classList.toggle('active', selectedBrands.has(brand));
  });

  filterMarkers();
  updateStats();
  updateVisibleCount();
}

function updateCategoryCounts() {
  const counts = { QSR: 0, Casual: 0, Hotel: 0, Fitness: 0 };

  franchiseLocations.forEach(loc => {
    const brand = BRANDS[loc.brand];
    if (brand && counts[brand.type] !== undefined) {
      counts[brand.type]++;
    }
  });

  document.getElementById('cat-qsr')?.textContent = counts.QSR;
  document.getElementById('cat-casual')?.textContent = counts.Casual;
  document.getElementById('cat-hotel')?.textContent = counts.Hotel;
  document.getElementById('cat-fitness')?.textContent = counts.Fitness;
}

function updateVisibleCount() {
  const center = map.getCenter();
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect ? radiusSelect.value : 'all';

  let count = 0;
  markers.forEach(({ location }) => {
    if (!selectedBrands.has(location.brand)) return;

    const brand = BRANDS[location.brand];
    if (brand && !selectedCategories.has(brand.type)) return;

    if (radiusMiles !== 'all') {
      const radiusKm = parseFloat(radiusMiles) * 1.60934;
      const distance = map.distance(center, [location.lat, location.lng]) / 1000;
      if (distance > radiusKm) return;
    }

    count++;
  });

  const countEl = document.getElementById('visible-count');
  if (countEl) countEl.textContent = count;
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
  document.querySelectorAll('.brand-pill').forEach(pill => pill.classList.add('active'));
  document.querySelectorAll('.category-pill').forEach(pill => pill.classList.add('active'));
  filterMarkers();
  updateStats();
  updateVisibleCount();
}

function selectNoBrands() {
  selectedBrands.clear();
  document.querySelectorAll('.brand-pill').forEach(pill => pill.classList.remove('active'));
  document.querySelectorAll('.category-pill').forEach(pill => pill.classList.remove('active'));
  filterMarkers();
  updateStats();
  updateVisibleCount();
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
    updateVisibleCount();
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
// ADVANCED CONTROLS
// ============================================================================

function addAdvancedControls() {
  // Create toolbar container
  const ToolbarControl = L.Control.extend({
    options: { position: 'topleft' },
    onAdd: function() {
      const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control advanced-toolbar');
      container.innerHTML = `
        <a href="#" id="measure-tool" title="Measure Distance" class="toolbar-btn">📏</a>
        <a href="#" id="draw-tool" title="Draw Area Selection" class="toolbar-btn">✏️</a>
        <a href="#" id="drop-pin-tool" title="Drop Pin for Analysis" class="toolbar-btn">📌</a>
        <a href="#" id="export-csv" title="Export to CSV" class="toolbar-btn">📥</a>
        <a href="#" id="fullscreen-toggle" title="Toggle Fullscreen" class="toolbar-btn">⛶</a>
      `;

      // Prevent map interactions
      L.DomEvent.disableClickPropagation(container);

      return container;
    }
  });
  map.addControl(new ToolbarControl());

  // Set up toolbar event listeners
  setTimeout(() => {
    document.getElementById('measure-tool')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMeasureMode();
    });
    document.getElementById('draw-tool')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleDrawMode();
    });
    document.getElementById('drop-pin-tool')?.addEventListener('click', (e) => {
      e.preventDefault();
      enableDropPinMode();
    });
    document.getElementById('export-csv')?.addEventListener('click', (e) => {
      e.preventDefault();
      exportToCSV();
    });
    document.getElementById('fullscreen-toggle')?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleFullscreen();
    });
  }, 100);
}

// ============================================================================
// DROP PIN FOR COMPETITOR ANALYSIS
// ============================================================================

let dropPinMode = false;

function enableDropPinMode() {
  dropPinMode = !dropPinMode;
  const btn = document.getElementById('drop-pin-tool');

  if (dropPinMode) {
    btn?.classList.add('active');
    map.getContainer().style.cursor = 'crosshair';
    showNotification('Click anywhere on the map to drop a pin and analyze competitors', 'info');
  } else {
    btn?.classList.remove('active');
    map.getContainer().style.cursor = '';
    if (droppedPin) {
      map.removeLayer(droppedPin);
      droppedPin = null;
    }
  }
}

function handleMapClick(e) {
  // Only process if in drop pin mode or measurement mode
  if (measurementMode) {
    addMeasurePoint(e.latlng);
    return;
  }

  if (drawMode) {
    addDrawPoint(e.latlng);
    return;
  }

  if (!dropPinMode) return;

  const { lat, lng } = e.latlng;

  // Remove existing dropped pin
  if (droppedPin) {
    map.removeLayer(droppedPin);
  }

  // Create dropped pin
  droppedPin = L.marker([lat, lng], {
    icon: L.divIcon({
      className: 'dropped-pin',
      html: '<div style="background:#ff4444;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,0.4);position:relative;"><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(45deg);font-size:16px;">📍</div></div>',
      iconSize: [36, 36],
      iconAnchor: [18, 36]
    }),
    draggable: true
  }).addTo(map);

  // Analyze on drop
  analyzeDroppedPinLocation(lat, lng);

  // Re-analyze when dragged
  droppedPin.on('dragend', function() {
    const pos = droppedPin.getLatLng();
    analyzeDroppedPinLocation(pos.lat, pos.lng);
  });
}

function analyzeDroppedPinLocation(lat, lng) {
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect?.value !== 'all' ? parseFloat(radiusSelect.value) : 5;

  // Find competitors within radius
  const competitors = [];
  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;
    const distance = getDistanceKm(lat, lng, location.lat, location.lng) * 0.621371;
    if (distance <= radiusMiles) {
      competitors.push({ location, brand, distance });
    }
  });
  competitors.sort((a, b) => a.distance - b.distance);

  // Count by category
  const byCategory = { QSR: 0, Casual: 0, Hotel: 0, Fitness: 0 };
  const byBrand = {};
  competitors.forEach(c => {
    byCategory[c.brand.type] = (byCategory[c.brand.type] || 0) + 1;
    byBrand[c.brand.name] = (byBrand[c.brand.name] || 0) + 1;
  });

  // Show popup with analysis
  const popupContent = `
    <div class="popup-content">
      <div class="popup-header">
        <span class="popup-brand-color" style="background:#ff4444"></span>
        <span class="popup-brand-name">Competitor Analysis</span>
      </div>
      <div class="popup-address">
        ${lat.toFixed(4)}, ${lng.toFixed(4)}
      </div>
      <div style="margin:10px 0;padding:10px;background:rgba(255,255,255,0.1);border-radius:8px;">
        <div style="font-size:2em;font-weight:700;color:#fff;">${competitors.length}</div>
        <div style="font-size:0.8em;color:rgba(255,255,255,0.6);">Locations within ${radiusMiles} miles</div>
      </div>
      <div style="font-size:0.85em;color:rgba(255,255,255,0.8);">
        <div>QSR: ${byCategory.QSR || 0} | Casual: ${byCategory.Casual || 0}</div>
        <div>Hotels: ${byCategory.Hotel || 0} | Fitness: ${byCategory.Fitness || 0}</div>
      </div>
      <div class="popup-actions" style="margin-top:10px;">
        <button class="popup-btn popup-btn-primary" onclick="showDetailedAnalysis(${lat}, ${lng}, ${radiusMiles})">
          View Details
        </button>
        <button class="popup-btn popup-btn-secondary" onclick="clearDroppedPin()">
          Clear Pin
        </button>
      </div>
    </div>
  `;

  droppedPin.bindPopup(popupContent, { className: 'custom-popup', maxWidth: 300 }).openPopup();

  // Draw radius circle
  if (radiusCircle) map.removeLayer(radiusCircle);
  radiusCircle = L.circle([lat, lng], {
    radius: radiusMiles * 1609.34,
    color: '#ff4444',
    fillColor: '#ff4444',
    fillOpacity: 0.08,
    weight: 2,
    dashArray: '8, 8'
  }).addTo(map);
}

function showDetailedAnalysis(lat, lng, radiusMiles) {
  const competitors = [];
  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;
    const distance = getDistanceKm(lat, lng, location.lat, location.lng) * 0.621371;
    if (distance <= radiusMiles) {
      competitors.push({ location, brand, distance });
    }
  });
  competitors.sort((a, b) => a.distance - b.distance);

  const panel = document.getElementById('info-panel');
  const nameEl = document.getElementById('location-name');
  const detailsEl = document.getElementById('location-details');

  if (!panel || !nameEl || !detailsEl) return;

  nameEl.innerHTML = `<span style="color:#ff4444">📍</span> Area Analysis`;

  let brandSummary = {};
  competitors.forEach(c => {
    brandSummary[c.brand.name] = (brandSummary[c.brand.name] || 0) + 1;
  });

  let summaryHtml = Object.entries(brandSummary)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, count]) => `<div style="display:flex;justify-content:space-between;padding:4px 0;"><span>${name}</span><span style="color:rgba(255,255,255,0.5)">${count}</span></div>`)
    .join('');

  detailsEl.innerHTML = `
    <p><strong>Coordinates:</strong> ${lat.toFixed(4)}, ${lng.toFixed(4)}</p>
    <p><strong>Radius:</strong> ${radiusMiles} miles</p>
    <p><strong>Total Locations:</strong> ${competitors.length}</p>

    <div style="margin-top:12px;">
      <button onclick="exportAreaToCSV(${lat}, ${lng}, ${radiusMiles})"
              style="background:#667eea;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;width:100%;">
        📥 Export Area Data
      </button>
    </div>

    <div class="competitor-section">
      <h4>Top Brands in Area</h4>
      ${summaryHtml}
    </div>

    <div class="competitor-section">
      <h4>Nearest Locations (${Math.min(competitors.length, 10)} shown)</h4>
      <div class="competitor-list">
        ${competitors.slice(0, 10).map(c => `
          <div class="competitor-item" onclick="flyToLocation(${c.location.lat}, ${c.location.lng})">
            <span class="competitor-color" style="background:${c.brand.color}"></span>
            <span>${c.brand.name}</span>
            <span class="competitor-distance">${c.distance.toFixed(2)} mi</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  panel.classList.add('active');
}

function clearDroppedPin() {
  if (droppedPin) {
    map.removeLayer(droppedPin);
    droppedPin = null;
  }
  if (radiusCircle) {
    map.removeLayer(radiusCircle);
    radiusCircle = null;
  }
  dropPinMode = false;
  document.getElementById('drop-pin-tool')?.classList.remove('active');
  map.getContainer().style.cursor = '';
}

// ============================================================================
// DISTANCE MEASUREMENT TOOL
// ============================================================================

function toggleMeasureMode() {
  measurementMode = !measurementMode;
  const btn = document.getElementById('measure-tool');

  if (measurementMode) {
    btn?.classList.add('active');
    map.getContainer().style.cursor = 'crosshair';
    clearMeasurements();
    showNotification('Click points on the map to measure distance. Double-click to finish.', 'info');

    // Disable other modes
    dropPinMode = false;
    drawMode = false;
    document.getElementById('drop-pin-tool')?.classList.remove('active');
    document.getElementById('draw-tool')?.classList.remove('active');
  } else {
    btn?.classList.remove('active');
    map.getContainer().style.cursor = '';
    clearMeasurements();
  }
}

function addMeasurePoint(latlng) {
  measurePoints.push(latlng);

  // Add marker
  const marker = L.circleMarker(latlng, {
    radius: 6,
    fillColor: '#667eea',
    color: '#fff',
    weight: 2,
    fillOpacity: 1
  }).addTo(map);
  measureMarkers.push(marker);

  // Update line
  if (measureLine) map.removeLayer(measureLine);
  if (measurePoints.length > 1) {
    measureLine = L.polyline(measurePoints, {
      color: '#667eea',
      weight: 3,
      dashArray: '10, 10'
    }).addTo(map);

    // Calculate total distance
    let totalDistance = 0;
    for (let i = 1; i < measurePoints.length; i++) {
      totalDistance += getDistanceKm(
        measurePoints[i-1].lat, measurePoints[i-1].lng,
        measurePoints[i].lat, measurePoints[i].lng
      );
    }
    const distanceMiles = totalDistance * 0.621371;

    // Show distance popup on last point
    marker.bindPopup(`
      <div style="text-align:center;padding:5px;">
        <div style="font-size:1.2em;font-weight:700;">${distanceMiles.toFixed(2)} mi</div>
        <div style="font-size:0.8em;color:#666;">${totalDistance.toFixed(2)} km</div>
        <button onclick="clearMeasurements()" style="margin-top:8px;padding:4px 12px;border:none;background:#667eea;color:#fff;border-radius:4px;cursor:pointer;">Clear</button>
      </div>
    `, { className: 'measurement-popup' }).openPopup();
  }
}

function clearMeasurements() {
  measurePoints = [];
  measureMarkers.forEach(m => map.removeLayer(m));
  measureMarkers = [];
  if (measureLine) {
    map.removeLayer(measureLine);
    measureLine = null;
  }
}

// ============================================================================
// DRAW / POLYGON AREA SELECTION
// ============================================================================

function toggleDrawMode() {
  drawMode = !drawMode;
  const btn = document.getElementById('draw-tool');

  if (drawMode) {
    btn?.classList.add('active');
    map.getContainer().style.cursor = 'crosshair';
    clearDrawing();
    showNotification('Click to add polygon points. Double-click to complete the area.', 'info');

    // Disable other modes
    measurementMode = false;
    dropPinMode = false;
    document.getElementById('measure-tool')?.classList.remove('active');
    document.getElementById('drop-pin-tool')?.classList.remove('active');

    // Listen for double-click to complete
    map.once('dblclick', completeDrawing);
  } else {
    btn?.classList.remove('active');
    map.getContainer().style.cursor = '';
    clearDrawing();
  }
}

function addDrawPoint(latlng) {
  drawPoints.push(latlng);

  // Update polygon preview
  if (drawPolygon) map.removeLayer(drawPolygon);
  if (drawPoints.length > 1) {
    drawPolygon = L.polygon(drawPoints, {
      color: '#667eea',
      fillColor: '#667eea',
      fillOpacity: 0.2,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(map);
  }
}

function completeDrawing(e) {
  if (drawPoints.length < 3) {
    showNotification('Need at least 3 points to create an area', 'error');
    clearDrawing();
    return;
  }

  // Close the polygon
  if (drawPolygon) map.removeLayer(drawPolygon);
  drawPolygon = L.polygon(drawPoints, {
    color: '#667eea',
    fillColor: '#667eea',
    fillOpacity: 0.15,
    weight: 2
  }).addTo(map);

  // Find locations within polygon
  const locationsInArea = [];
  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;
    if (drawPolygon.getBounds().contains([location.lat, location.lng])) {
      // More precise check using ray casting
      if (isPointInPolygon([location.lat, location.lng], drawPoints)) {
        locationsInArea.push({ location, brand });
      }
    }
  });

  // Show popup
  const center = drawPolygon.getBounds().getCenter();
  L.popup({ className: 'custom-popup' })
    .setLatLng(center)
    .setContent(`
      <div class="popup-content">
        <div class="popup-header">
          <span class="popup-brand-color" style="background:#667eea"></span>
          <span class="popup-brand-name">Selected Area</span>
        </div>
        <div style="margin:10px 0;padding:10px;background:rgba(255,255,255,0.1);border-radius:8px;">
          <div style="font-size:2em;font-weight:700;color:#fff;">${locationsInArea.length}</div>
          <div style="font-size:0.8em;color:rgba(255,255,255,0.6);">Locations in area</div>
        </div>
        <div class="popup-actions">
          <button class="popup-btn popup-btn-primary" onclick="exportPolygonToCSV()">
            📥 Export
          </button>
          <button class="popup-btn popup-btn-secondary" onclick="clearDrawing()">
            Clear
          </button>
        </div>
      </div>
    `)
    .openOn(map);

  drawMode = false;
  document.getElementById('draw-tool')?.classList.remove('active');
  map.getContainer().style.cursor = '';
}

function isPointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = [polygon[i].lat, polygon[i].lng];
    const [xj, yj] = [polygon[j].lat, polygon[j].lng];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

function clearDrawing() {
  drawPoints = [];
  if (drawPolygon) {
    map.removeLayer(drawPolygon);
    drawPolygon = null;
  }
  map.closePopup();
}

// ============================================================================
// EXPORT TO CSV
// ============================================================================

function exportToCSV() {
  const visibleLocations = [];
  const center = map.getCenter();
  const radiusSelect = document.getElementById('radius-filter');
  const radiusMiles = radiusSelect?.value || 'all';

  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;

    if (radiusMiles !== 'all') {
      const radiusKm = parseFloat(radiusMiles) * 1.60934;
      const distance = map.distance(center, [location.lat, location.lng]) / 1000;
      if (distance > radiusKm) return;
    }

    visibleLocations.push({
      brand: brand.name,
      ticker: location.brand,
      category: brand.type,
      address: location.address,
      lat: location.lat,
      lng: location.lng
    });
  });

  if (visibleLocations.length === 0) {
    showNotification('No visible locations to export', 'error');
    return;
  }

  downloadCSV(visibleLocations, 'franchise_locations.csv');
  showNotification(`Exported ${visibleLocations.length} locations to CSV`, 'success');
}

function exportAreaToCSV(lat, lng, radiusMiles) {
  const locations = [];
  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;
    const distance = getDistanceKm(lat, lng, location.lat, location.lng) * 0.621371;
    if (distance <= radiusMiles) {
      locations.push({
        brand: brand.name,
        ticker: location.brand,
        category: brand.type,
        address: location.address,
        lat: location.lat,
        lng: location.lng,
        distance_miles: distance.toFixed(2)
      });
    }
  });

  if (locations.length === 0) {
    showNotification('No locations in this area', 'error');
    return;
  }

  downloadCSV(locations, `franchise_area_${lat.toFixed(2)}_${lng.toFixed(2)}.csv`);
  showNotification(`Exported ${locations.length} locations`, 'success');
}

function exportPolygonToCSV() {
  if (!drawPolygon || drawPoints.length < 3) return;

  const locations = [];
  markers.forEach(({ location, brand }) => {
    if (!selectedBrands.has(location.brand)) return;
    if (isPointInPolygon([location.lat, location.lng], drawPoints)) {
      locations.push({
        brand: brand.name,
        ticker: location.brand,
        category: brand.type,
        address: location.address,
        lat: location.lat,
        lng: location.lng
      });
    }
  });

  if (locations.length === 0) {
    showNotification('No locations in selected area', 'error');
    return;
  }

  downloadCSV(locations, 'franchise_selected_area.csv');
  showNotification(`Exported ${locations.length} locations`, 'success');
  clearDrawing();
}

function downloadCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

// ============================================================================
// FULLSCREEN MODE
// ============================================================================

function toggleFullscreen() {
  const container = document.querySelector('.map-container');
  const btn = document.getElementById('fullscreen-toggle');

  isFullscreen = !isFullscreen;

  if (isFullscreen) {
    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
      container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
      container.msRequestFullscreen();
    }
    btn.textContent = '⛶';
    btn.title = 'Exit Fullscreen';
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
    btn.textContent = '⛶';
    btn.title = 'Toggle Fullscreen';
  }

  // Invalidate map size after transition
  setTimeout(() => map.invalidateSize(), 300);
}

// Listen for fullscreen change
document.addEventListener('fullscreenchange', () => {
  isFullscreen = !!document.fullscreenElement;
  setTimeout(() => map.invalidateSize(), 100);
});

// ============================================================================
// NOTIFICATIONS
// ============================================================================

function showNotification(message, type = 'info') {
  // Remove existing notifications
  document.querySelectorAll('.map-notification').forEach(n => n.remove());

  const notification = document.createElement('div');
  notification.className = `map-notification map-notification-${type}`;
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:inherit;cursor:pointer;margin-left:10px;font-size:1.2em;">&times;</button>
  `;

  const mapEl = document.getElementById('map');
  mapEl.parentElement.insertBefore(notification, mapEl);

  // Auto-remove after 5 seconds
  setTimeout(() => notification.remove(), 5000);
}

// ============================================================================
// GLOBAL EXPORTS
// ============================================================================

window.toggleBrand = toggleBrand;
window.toggleBrandPill = toggleBrandPill;
window.selectAllBrands = selectAllBrands;
window.selectNoBrands = selectNoBrands;
window.analyzeCompetitors = analyzeCompetitors;
window.zoomToLocation = zoomToLocation;
window.flyToLocation = flyToLocation;
window.clearMeasurements = clearMeasurements;
window.clearDrawing = clearDrawing;
window.clearDroppedPin = clearDroppedPin;
window.showDetailedAnalysis = showDetailedAnalysis;
window.exportAreaToCSV = exportAreaToCSV;
window.exportPolygonToCSV = exportPolygonToCSV;
window.switchMapStyle = switchMapStyle;
window.toggleClustering = toggleClustering;
window.toggleHeatMap = toggleHeatMap;
window.toggleCategory = toggleCategory;
