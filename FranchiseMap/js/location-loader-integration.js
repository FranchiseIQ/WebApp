/**
 * Location Loader Integration Example
 *
 * Shows how to use LocationLoader with Leaflet map for the FranchiseIQ
 * map feature. Demonstrates:
 *
 * - Loading brand locations
 * - Creating and rendering markers
 * - Filtering by score
 * - Calculating statistics
 * - Managing memory for large datasets
 *
 * Expected Data Structure (/data/brands/MCD.json):
 * {
 *   "locations": [
 *     {
 *       "id": "mcdonalds_ca_01234",
 *       "brand": "McDonald's",
 *       "symbol": "MCD",
 *       "latitude": 37.7749,
 *       "longitude": -122.4194,
 *       "address": "123 Market St, San Francisco, CA 94102",
 *       "city": "San Francisco",
 *       "state": "CA",
 *       "zip": "94102",
 *       "phone": "(415) 555-1234",
 *       "website": "https://example.com",
 *       "franchisee": "Franchisee Name LLC",
 *       "opened": 2010,
 *       "status": "operational",
 *       "score": 85,
 *       "units_nearby": 12
 *     }
 *   ],
 *   "metadata": {
 *     "brand": "McDonald's",
 *     "symbol": "MCD",
 *     "total_count": 13425,
 *     "country": "USA",
 *     "last_updated": "2025-12-29T10:00:00Z",
 *     "version": "2.0"
 *   }
 * }
 */

class LocationLoaderIntegration {
  constructor(mapElement, options = {}) {
    // Map instance
    this.map = L.map(mapElement).setView([39.8, -98.6], 4); // US center

    // Tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    // Marker cluster group
    this.markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 80,
      iconCreateFunction: this._createClusterIcon.bind(this)
    }).addTo(this.map);

    // Location loader
    this.loader = new LocationLoader();

    // UI state
    this.currentBrand = null;
    this.currentLocations = [];
    this.allMarkers = [];
    this.scoreFilter = { min: 0, max: 100 };

    // Setup UI controls
    this._setupUI();
  }

  /**
   * Load and display locations for a brand
   *
   * @param {string} brand - Brand symbol (e.g., 'MCD')
   */
  async loadBrand(brand) {
    try {
      console.log(`[Integration] Loading ${brand}...`);

      // Show loading state
      this._setLoading(true, `Loading ${brand} locations...`);

      // Load data
      const data = await this.loader.loadBrand(brand);

      // Store locations
      this.currentBrand = brand;
      this.currentLocations = data.locations;

      // Apply score filter
      const filtered = this.loader.filterByScore(
        this.currentLocations,
        this.scoreFilter.min,
        this.scoreFilter.max
      );

      console.log(`[Integration] Creating ${filtered.length} markers...`);

      // Clear existing markers
      this.markerClusterGroup.clearLayers();
      this.allMarkers = [];

      // Create markers in chunks
      await this._createAndRenderMarkers(filtered);

      // Calculate and display statistics
      this._updateStatistics(filtered);

      // Update UI
      this._updateUI(brand, data.metadata);

      this._setLoading(false);

    } catch (error) {
      console.error(`[Integration] Failed to load ${brand}:`, error);
      this._setLoading(false, `Error loading ${brand}: ${error.message}`);
    }
  }

  /**
   * Internal: Create and render markers progressively
   */
  async _createAndRenderMarkers(locations) {
    const startTime = performance.now();

    // Create markers with chunking
    this.allMarkers = await this.loader.createMarkers(locations, {
      chunked: true,
      chunkSize: 100,
      onEachFeature: this._onMarkerCreated.bind(this)
    });

    // Render to map progressively
    await this.loader.renderMarkersProgressive(this.allMarkers, {
      clusterGroup: this.markerClusterGroup,
      chunkSize: 100,
      onProgress: (rendered, total) => {
        const percent = Math.round((rendered / total) * 100);
        this._setLoading(true, `Rendering markers: ${percent}%`);
      }
    });

    const duration = (performance.now() - startTime).toFixed(0);
    console.log(`[Integration] Markers created and rendered in ${duration}ms`);

    // Fit bounds to all markers
    if (this.allMarkers.length > 0) {
      const group = new L.featureGroup(this.allMarkers);
      this.map.fitBounds(group.getBounds().pad(0.05));
    }
  }

  /**
   * Internal: Callback when marker is created
   */
  _onMarkerCreated(marker, location) {
    // Add click handler to show details
    marker.on('click', () => {
      this._showLocationDetails(location);
    });
  }

  /**
   * Internal: Show detailed location panel
   */
  _showLocationDetails(location) {
    const detailsPanel = document.getElementById('location-details-panel');
    if (!detailsPanel) return;

    const scoreColor = this._getScoreColor(location.score || 50);

    detailsPanel.innerHTML = `
      <div class="location-details">
        <h2>${location.address}</h2>
        <div class="details-grid">
          <div class="detail-row">
            <span class="label">City, State</span>
            <span class="value">${location.city}, ${location.state} ${location.zip}</span>
          </div>
          <div class="detail-row">
            <span class="label">Phone</span>
            <span class="value">${location.phone || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Franchisee</span>
            <span class="value">${location.franchisee || 'N/A'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Score</span>
            <span class="value" style="color: ${scoreColor}; font-weight: bold;">
              ${location.score || 50}/100
            </span>
          </div>
          <div class="detail-row">
            <span class="label">Status</span>
            <span class="value">${location.status || 'operational'}</span>
          </div>
          <div class="detail-row">
            <span class="label">Nearby Units</span>
            <span class="value">${location.units_nearby || 0}</span>
          </div>
        </div>
      </div>
    `;

    detailsPanel.style.display = 'block';
  }

  /**
   * Internal: Filter locations by score range
   */
  onScoreFilterChange(min, max) {
    this.scoreFilter = { min, max };

    if (!this.currentLocations) return;

    console.log(`[Integration] Filtering by score: ${min}-${max}`);

    // Filter locations
    const filtered = this.loader.filterByScore(
      this.currentLocations,
      min,
      max
    );

    // Update markers (only show filtered ones)
    this.markerClusterGroup.clearLayers();
    const filteredMarkers = this.allMarkers.filter(marker => {
      // Find matching location
      const id = marker.options.id;
      return filtered.some(loc => loc.id === id);
    });

    this.markerClusterGroup.addLayers(filteredMarkers);

    // Update statistics
    this._updateStatistics(filtered);
  }

  /**
   * Internal: Update UI with statistics
   */
  _updateStatistics(locations) {
    const stats = this.loader.calculateStatistics(locations);

    const statsPanel = document.getElementById('stats-panel');
    if (!statsPanel) return;

    const memory = this.loader.getMemoryStats();

    statsPanel.innerHTML = `
      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">Locations</span>
          <span class="stat-value">${stats.count.toLocaleString()}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Avg Score</span>
          <span class="stat-value">${stats.averageScore}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">States</span>
          <span class="stat-value">${stats.stateCount}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Memory</span>
          <span class="stat-value">${memory.memorySizeMB}MB</span>
        </div>
      </div>

      <h3>Top Performers</h3>
      <div class="top-performers">
        ${stats.highPerformers.slice(0, 5).map(loc => `
          <div class="performer">
            <div class="performer-name">${loc.city}, ${loc.state}</div>
            <div class="performer-score" style="color: ${this._getScoreColor(loc.score)};">
              ${loc.score}/100
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * Internal: Update UI controls
   */
  _updateUI(brand, metadata) {
    const titleElement = document.getElementById('map-title');
    if (titleElement) {
      titleElement.textContent = `${metadata.brand} - ${metadata.total_count.toLocaleString()} Locations`;
    }

    const infoElement = document.getElementById('map-info');
    if (infoElement) {
      infoElement.innerHTML = `
        <div>Last Updated: ${new Date(metadata.last_updated).toLocaleDateString()}</div>
        <div>Version: ${metadata.version}</div>
      `;
    }
  }

  /**
   * Internal: Setup UI controls
   */
  _setupUI() {
    // Brand selector
    const brandSelect = document.getElementById('brand-select');
    if (brandSelect) {
      brandSelect.addEventListener('change', (e) => {
        if (e.target.value) {
          this.loadBrand(e.target.value);
        }
      });
    }

    // Score filter
    const scoreSliderMin = document.getElementById('score-min');
    const scoreSliderMax = document.getElementById('score-max');
    if (scoreSliderMin && scoreSliderMax) {
      scoreSliderMin.addEventListener('input', () => {
        this.onScoreFilterChange(
          parseInt(scoreSliderMin.value),
          parseInt(scoreSliderMax.value)
        );
      });
      scoreSliderMax.addEventListener('input', () => {
        this.onScoreFilterChange(
          parseInt(scoreSliderMin.value),
          parseInt(scoreSliderMax.value)
        );
      });
    }
  }

  /**
   * Internal: Show/hide loading state
   */
  _setLoading(isLoading, message = '') {
    const loader = document.getElementById('loading-indicator');
    if (!loader) return;

    if (isLoading) {
      loader.style.display = 'block';
      if (message) {
        loader.textContent = message;
      }
    } else {
      loader.style.display = 'none';
    }
  }

  /**
   * Internal: Create cluster icon
   */
  _createClusterIcon(cluster) {
    const count = cluster.getChildCount();
    const size = count > 100 ? 'large' : count > 50 ? 'medium' : 'small';

    return L.divIcon({
      html: `<div class="cluster cluster-${size}">${count}</div>`,
      className: 'cluster-icon',
      iconSize: 40
    });
  }

  /**
   * Internal: Get color for score
   */
  _getScoreColor(score) {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f87171';
    return '#6b7280';
  }

  /**
   * Get memory usage stats
   */
  getMemoryStats() {
    return this.loader.getMemoryStats();
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.loader.cleanup();
    console.log('[Integration] Cleanup complete');
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LocationLoaderIntegration;
}
