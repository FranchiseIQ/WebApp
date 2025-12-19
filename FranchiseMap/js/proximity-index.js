/**
 * Proximity Index Module
 * Provides efficient spatial indexing for location-based proximity searches
 * Uses a simple grid-based index for O(1) lookups
 *
 * Features:
 * - Grid-based spatial partitioning
 * - Efficient radius searches
 * - Can be run in Web Worker for non-blocking processing
 */

class ProximityIndex {
    constructor(cellSize = 0.02) {
        // cellSize in degrees (~2.2km at equator with 0.02 degrees)
        this.cellSize = cellSize;
        this.grid = new Map(); // key: "lat,lng" -> array of locations
        this.locations = [];
        this.bounds = { n: -90, s: 90, e: -180, w: 180 };
    }

    /**
     * Add locations to the index
     */
    addLocations(locations) {
        this.locations = locations;
        this.grid.clear();

        locations.forEach(loc => {
            const cellKey = this.getCellKey(loc.lat, loc.lng);
            if (!this.grid.has(cellKey)) {
                this.grid.set(cellKey, []);
            }
            this.grid.get(cellKey).push(loc);

            // Update bounds
            this.bounds.n = Math.max(this.bounds.n, loc.lat);
            this.bounds.s = Math.min(this.bounds.s, loc.lat);
            this.bounds.e = Math.max(this.bounds.e, loc.lng);
            this.bounds.w = Math.min(this.bounds.w, loc.lng);
        });

        console.log(`ProximityIndex: Indexed ${locations.length} locations in ${this.grid.size} cells`);
    }

    /**
     * Get grid cell key for coordinates
     */
    getCellKey(lat, lng) {
        const cellLat = Math.floor(lat / this.cellSize);
        const cellLng = Math.floor(lng / this.cellSize);
        return `${cellLat},${cellLng}`;
    }

    /**
     * Get neighboring cell keys (including the center cell)
     */
    getNeighboringCells(lat, lng) {
        const cellLat = Math.floor(lat / this.cellSize);
        const cellLng = Math.floor(lng / this.cellSize);
        const cells = [];

        // 3x3 grid of cells around center
        for (let dl = -1; dl <= 1; dl++) {
            for (let dn = -1; dn <= 1; dn++) {
                cells.push(`${cellLat + dn},${cellLng + dl}`);
            }
        }

        return cells;
    }

    /**
     * Find locations within radius of a point
     * @param {number} lat - Center latitude
     * @param {number} lng - Center longitude
     * @param {number} radiusMiles - Search radius in miles
     * @param {Function} filterFn - Optional filter function
     * @returns {Array} Locations within radius
     */
    findNearby(lat, lng, radiusMiles, filterFn = null) {
        const radiusMeters = radiusMiles * 1609.34;
        const radiusDegrees = radiusMiles / 69; // rough conversion

        // Get all potentially nearby cells
        const cells = this.getNeighboringCells(lat, lng);
        let candidates = [];

        cells.forEach(cellKey => {
            if (this.grid.has(cellKey)) {
                candidates = candidates.concat(this.grid.get(cellKey));
            }
        });

        // Filter by actual distance
        const nearby = [];
        const centerLatRad = this.degreesToRadians(lat);
        const centerLngRad = this.degreesToRadians(lng);

        candidates.forEach(loc => {
            const distance = this.haversineDistance(lat, lng, loc.lat, loc.lng);
            if (distance <= radiusMeters) {
                if (!filterFn || filterFn(loc)) {
                    nearby.push({
                        location: loc,
                        distance: distance,
                        distanceMiles: distance / 1609.34
                    });
                }
            }
        });

        // Sort by distance
        nearby.sort((a, b) => a.distance - b.distance);
        return nearby;
    }

    /**
     * Find nearest N locations to a point
     */
    findNearest(lat, lng, count = 5, filterFn = null) {
        const results = [];
        let searchRadius = 1; // start with 1 mile

        // Expand search radius until we find enough results
        while (results.length < count && searchRadius < 200) {
            const nearby = this.findNearby(lat, lng, searchRadius, filterFn);
            results.length = 0; // clear and refill
            results.push(...nearby);
            searchRadius *= 2;
        }

        return results.slice(0, count);
    }

    /**
     * Get competitors within radius, grouped by ticker
     */
    findCompetitors(lat, lng, radiusMiles, activeTickers = null) {
        const nearby = this.findNearby(lat, lng, radiusMiles, loc => {
            return !activeTickers || activeTickers.has(loc.ticker);
        });

        // Group by ticker
        const byTicker = {};
        nearby.forEach(({ location, distance, distanceMiles }) => {
            if (!byTicker[location.ticker]) {
                byTicker[location.ticker] = [];
            }
            byTicker[location.ticker].push({
                location,
                distance,
                distanceMiles
            });
        });

        return {
            total: nearby.length,
            byTicker: byTicker
        };
    }

    /**
     * Get summary statistics for nearby competitors
     */
    getCompetitorStats(lat, lng, radiusMiles, activeTickers = null) {
        const competitors = this.findCompetitors(lat, lng, radiusMiles, activeTickers);

        const stats = {
            totalCompetitors: competitors.total,
            competitorsByTicker: {},
            stats: {
                avgDistance: 0,
                minDistance: Infinity,
                maxDistance: 0,
                avgScore: 0
            }
        };

        let totalDistance = 0;
        let totalScore = 0;
        let count = 0;

        Object.entries(competitors.byTicker).forEach(([ticker, locs]) => {
            stats.competitorsByTicker[ticker] = {
                count: locs.length,
                avgDistance: locs.reduce((sum, l) => sum + l.distanceMiles, 0) / locs.length,
                avgScore: Math.round(locs.reduce((sum, l) => sum + (l.location.s || 0), 0) / locs.length),
                locations: locs
            };

            locs.forEach(({ location, distanceMiles }) => {
                totalDistance += distanceMiles;
                totalScore += location.s || 0;
                stats.stats.minDistance = Math.min(stats.stats.minDistance, distanceMiles);
                stats.stats.maxDistance = Math.max(stats.stats.maxDistance, distanceMiles);
                count++;
            });
        });

        if (count > 0) {
            stats.stats.avgDistance = (totalDistance / count).toFixed(2);
            stats.stats.avgScore = Math.round(totalScore / count);
        } else {
            stats.stats.minDistance = 0;
        }

        return stats;
    }

    /**
     * Haversine distance calculation
     */
    haversineDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth radius in meters
        const dLat = this.degreesToRadians(lat2 - lat1);
        const dLng = this.degreesToRadians(lng2 - lng1);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);

        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    /**
     * Convert degrees to radians
     */
    degreesToRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    /**
     * Get statistics about the index
     */
    getStats() {
        return {
            totalLocations: this.locations.length,
            gridCells: this.grid.size,
            averageLocationsPerCell: (this.locations.length / this.grid.size).toFixed(2),
            bounds: this.bounds
        };
    }
}

// Export for use in browsers and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProximityIndex;
}
