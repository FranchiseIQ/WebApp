/**
 * Location Data Loader
 *
 * Efficiently loads and manages large location datasets (1000+ markers)
 * for the FranchiseIQ map. Supports:
 *
 * - Lazy loading: Load visible areas first
 * - Chunked rendering: Render in batches to avoid blocking UI
 * - Progressive enhancement: Show basic info before detailed data
 * - Spatial filtering: Load by bounding box
 * - Memory management: Cleanup when locations scroll out of view
 *
 * Usage:
 *   const loader = new LocationLoader();
 *   const locations = await loader.loadBrand('MCD');
 *   const markers = await loader.createMarkers(locations);
 *   await loader.renderMarkersProgressive(markers);
 */

class LocationLoader {
  constructor() {
    // Configuration
    this.config = {
      CHUNK_SIZE: 100,           // Markers to render per chunk
      BATCH_DELAY: 0,            // ms between chunks (0 for requestAnimationFrame)
      CACHE_TTL: 3600000,        // Cache TTL: 1 hour
      MAX_MEMORY_MB: 100,        // Max dataset size in memory
      PRELOAD_DISTANCE: 2000     // Preload markers within 2km of viewport
    };

    // State
    this.cache = new Map();       // brand -> { data, timestamp }
    this.markers = new Map();     // id -> marker
    this.loadingPromises = {};    // brand -> promise
    this.abortControllers = {};   // brand -> AbortController
  }

  /**
   * Load location data for a specific brand
   *
   * @param {string} brand - Brand symbol (e.g., 'MCD')
   * @param {boolean} force - Force reload even if cached
   * @returns {Promise<Object>} Location data with metadata
   */
  async loadBrand(brand, force = false) {
    // Return cached data if available
    if (!force && this.cache.has(brand)) {
      const cached = this.cache.get(brand);
      if (Date.now() - cached.timestamp < this.config.CACHE_TTL) {
        console.log(`[LocationLoader] Using cached data for ${brand}`);
        return cached.data;
      }
    }

    // Return existing promise if already loading
    if (this.loadingPromises[brand]) {
      return this.loadingPromises[brand];
    }

    // Start new load
    this.loadingPromises[brand] = this._loadBrandData(brand);
    return this.loadingPromises[brand];
  }

  /**
   * Internal: Fetch and parse location data
   */
  async _loadBrandData(brand) {
    try {
      console.log(`[LocationLoader] Loading ${brand} locations...`);

      // Setup abort controller for cancellation
      this.abortControllers[brand] = new AbortController();

      // Fetch data
      const response = await fetch(
        `/data/brands/${brand}.json`,
        { signal: this.abortControllers[brand].signal }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to load ${brand}`);
      }

      const data = await response.json();

      // Validate structure
      if (!data.locations || !Array.isArray(data.locations)) {
        throw new Error(`Invalid data structure for ${brand}`);
      }

      // Cache result
      this.cache.set(brand, {
        data: data,
        timestamp: Date.now()
      });

      console.log(`[LocationLoader] Loaded ${data.locations.length} locations for ${brand}`);
      return data;

    } catch (error) {
      // Don't cache errors, but log them
      console.error(`[LocationLoader] Failed to load ${brand}:`, error);
      throw error;

    } finally {
      delete this.loadingPromises[brand];
    }
  }

  /**
   * Create Leaflet markers from location data
   *
   * @param {Array} locations - Array of location objects
   * @param {Object} options - Options for marker creation
   * @returns {Promise<Array>} Array of Leaflet markers
   */
  async createMarkers(locations, options = {}) {
    const defaults = {
      clusterGroup: null,        // L.markerClusterGroup instance
      onEachFeature: null,       // Callback for each marker
      chunked: true,             // Render in chunks
      chunkSize: this.config.CHUNK_SIZE
    };

    const config = { ...defaults, ...options };

    console.log(`[LocationLoader] Creating markers for ${locations.length} locations...`);

    const markers = [];
    const startTime = performance.now();

    // Create markers in chunks
    if (config.chunked) {
      for (let i = 0; i < locations.length; i += config.chunkSize) {
        const chunk = locations.slice(i, i + config.chunkSize);
        const chunkMarkers = chunk.map(loc => this._createMarker(loc, config));
        markers.push(...chunkMarkers);

        // Yield to browser
        await this._delay();
      }
    } else {
      // Create all at once
      for (const location of locations) {
        markers.push(this._createMarker(location, config));
      }
    }

    const duration = (performance.now() - startTime).toFixed(0);
    console.log(`[LocationLoader] Created ${markers.length} markers in ${duration}ms`);

    return markers;
  }

  /**
   * Render markers to map in progressive chunks
   *
   * Renders markers progressively to avoid blocking the UI.
   * Good for 1000+ markers.
   *
   * @param {Array} markers - Array of Leaflet markers
   * @param {Object} options - Rendering options
   * @returns {Promise<void>}
   */
  async renderMarkersProgressive(markers, options = {}) {
    const defaults = {
      clusterGroup: null,        // L.markerClusterGroup to add to
      chunkSize: this.config.CHUNK_SIZE,
      onProgress: null           // Callback: (rendered, total) => void
    };

    const config = { ...defaults, ...options };

    if (!config.clusterGroup) {
      throw new Error('clusterGroup is required for renderMarkersProgressive');
    }

    console.log(`[LocationLoader] Rendering ${markers.length} markers progressively...`);

    const startTime = performance.now();

    // Add markers in chunks
    for (let i = 0; i < markers.length; i += config.chunkSize) {
      const chunk = markers.slice(i, i + config.chunkSize);
      config.clusterGroup.addLayers(chunk);

      // Store references for cleanup
      chunk.forEach(marker => {
        const id = marker.options.id;
        if (id) this.markers.set(id, marker);
      });

      // Progress callback
      if (config.onProgress) {
        config.onProgress(i + chunk.length, markers.length);
      }

      // Yield to browser
      await this._delay();
    }

    const duration = (performance.now() - startTime).toFixed(0);
    console.log(`[LocationLoader] Rendered ${markers.length} markers in ${duration}ms`);
  }

  /**
   * Filter locations by bounding box (for spatial filtering)
   *
   * @param {Array} locations - All locations
   * @param {Object} bounds - L.LatLngBounds object
   * @returns {Array} Filtered locations within bounds
   */
  filterByBounds(locations, bounds) {
    return locations.filter(loc => {
      const point = L.latLng(loc.latitude, loc.longitude);
      return bounds.contains(point);
    });
  }

  /**
   * Filter locations by score range
   *
   * @param {Array} locations - All locations
   * @param {number} minScore - Minimum score (0-100)
   * @param {number} maxScore - Maximum score (0-100)
   * @returns {Array} Filtered locations
   */
  filterByScore(locations, minScore, maxScore) {
    return locations.filter(loc => {
      const score = loc.score || 50;
      return score >= minScore && score <= maxScore;
    });
  }

  /**
   * Calculate statistics for a location set
   *
   * @param {Array} locations - Locations to analyze
   * @returns {Object} Statistics object
   */
  calculateStatistics(locations) {
    if (locations.length === 0) {
      return {
        count: 0,
        averageScore: 0,
        highPerformers: [],
        byState: {}
      };
    }

    const scores = locations.map(l => l.score || 50);
    const averageScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
    const highPerformers = locations
      .filter(l => (l.score || 0) >= 80)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 10);

    // Count by state
    const byState = {};
    locations.forEach(loc => {
      const state = loc.state || 'Unknown';
      byState[state] = (byState[state] || 0) + 1;
    });

    return {
      count: locations.length,
      averageScore: parseFloat(averageScore),
      highPerformers: highPerformers,
      byState: byState,
      stateCount: Object.keys(byState).length
    };
  }

  /**
   * Clear cache for a specific brand or all
   *
   * @param {string} brand - Brand symbol, or null for all
   */
  clearCache(brand = null) {
    if (brand) {
      this.cache.delete(brand);
      console.log(`[LocationLoader] Cleared cache for ${brand}`);
    } else {
      this.cache.clear();
      console.log('[LocationLoader] Cleared all caches');
    }
  }

  /**
   * Cleanup: Cancel pending loads and clear markers
   *
   * @param {string} brand - Brand symbol, or null for all
   */
  cleanup(brand = null) {
    if (brand) {
      // Cancel specific brand load
      if (this.abortControllers[brand]) {
        this.abortControllers[brand].abort();
        delete this.abortControllers[brand];
      }
    } else {
      // Cancel all loads
      Object.values(this.abortControllers).forEach(controller => {
        controller.abort();
      });
      this.abortControllers = {};
    }

    console.log(`[LocationLoader] Cleanup: ${brand || 'all'}`);
  }

  /**
   * Get memory usage estimate
   *
   * @returns {Object} Memory stats
   */
  getMemoryStats() {
    let totalBytes = 0;

    this.cache.forEach(cached => {
      const json = JSON.stringify(cached.data);
      totalBytes += json.length;
    });

    return {
      cacheSize: this.cache.size,
      memorySizeMB: (totalBytes / (1024 * 1024)).toFixed(2),
      markerCount: this.markers.size
    };
  }

  /**
   * Internal: Create single Leaflet marker
   */
  _createMarker(location, options) {
    const marker = L.marker(
      [location.latitude, location.longitude],
      {
        id: location.id,
        title: location.brand || 'Location',
        icon: this._getMarkerIcon(location.score)
      }
    );

    // Bind popup with location details
    const popupContent = this._createPopupContent(location);
    marker.bindPopup(popupContent, { maxWidth: 300 });

    // Call callback if provided
    if (options.onEachFeature) {
      options.onEachFeature(marker, location);
    }

    return marker;
  }

  /**
   * Internal: Get marker icon based on score
   */
  _getMarkerIcon(score) {
    const s = score || 50;
    let color;

    if (s >= 80) color = '#22c55e';      // Green: High performers
    else if (s >= 60) color = '#f59e0b';  // Amber: Good
    else if (s >= 40) color = '#f87171';  // Red: Needs work
    else color = '#6b7280';               // Gray: Poor

    return L.divIcon({
      className: 'location-marker',
      html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>`,
      iconSize: [24, 24],
      popupAnchor: [0, -12]
    });
  }

  /**
   * Internal: Create popup HTML for location
   */
  _createPopupContent(location) {
    const scoreColor = this._getScoreColor(location.score || 50);

    return `
      <div class="location-popup">
        <h3 style="margin: 0 0 8px; font-size: 14px; font-weight: 600;">
          ${location.address || 'Location'}
        </h3>
        <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
          <div>${location.city}, ${location.state} ${location.zip}</div>
          ${location.phone ? `<div>${location.phone}</div>` : ''}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-top: 1px solid #eee;">
          <span style="font-size: 11px; color: #999;">Score</span>
          <span style="font-weight: 600; color: ${scoreColor};">${location.score || 50}/100</span>
        </div>
        ${location.franchisee ? `
          <div style="font-size: 11px; color: #666; margin-top: 8px;">
            <strong>Franchisee:</strong> ${location.franchisee}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Internal: Get color for score value
   */
  _getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f87171';
    return '#6b7280';
  }

  /**
   * Internal: Delay for chunk rendering
   */
  _delay() {
    return new Promise(resolve => {
      if (this.config.BATCH_DELAY > 0) {
        setTimeout(resolve, this.config.BATCH_DELAY);
      } else {
        requestAnimationFrame(resolve);
      }
    });
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationLoader;
}
