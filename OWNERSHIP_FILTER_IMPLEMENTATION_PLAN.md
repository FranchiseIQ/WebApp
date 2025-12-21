# Ownership Model Filter Implementation Plan

## Executive Summary

Add ownership classification filtering (Franchise / Non-Franchise) to FranchiseMap with adaptive sub-type filtering (Licensed, Corporate, Independent, Unknown). Implements as data-driven feature with zero impact to existing filter logic.

**Key Principle**: Minimal UI changes, 100% backward compatible, brand_metadata.json as single source of truth.

---

## Architecture Overview

### Data Flow

```
brand_metadata.json (ownership per ticker)
        ↓
Load via AJAX during initial render
        ↓
Merge into location objects as they load
        ↓
Filter in refreshMap() with AND logic
        ↓
Display filtered markers on map
```

### Filter Composition

```javascript
visible = allLocations.filter(loc =>
  activeTickers.has(loc.ticker) &&           // Brand selection
  loc.s >= scoreFilter.min &&                // Score range
  loc.s <= scoreFilter.max &&                // (existing)

  ownershipModel.includes(loc.ownership) &&  // NEW: Ownership
  subtypes.includes(loc.subtype)             // NEW: Sub-type (if non-franchise)
);
```

---

## Phase 1: Schema Design & Data Structure

### 1.1 brand_metadata.json Schema

**File Location**: `FranchiseMap/data/brand_metadata.json`

```json
{
  "schema_version": "1.0",
  "generated_date": "2025-12-21",
  "brands": {
    "MCD": {
      "name": "McDonald's",
      "ownership_model": "franchise",
      "primary_subtype": "licensed",
      "count": 1234,
      "notes": ""
    },
    "SBUX": {
      "name": "Starbucks",
      "ownership_model": "non-franchise",
      "primary_subtype": "corporate",
      "count": 456,
      "notes": "Mixed corporate and licensed locations"
    },
    "SUB": {
      "name": "Subway",
      "ownership_model": "franchise",
      "primary_subtype": "independent",
      "count": 2345,
      "notes": ""
    },
    "UNKNOWN_BRAND": {
      "name": "Unknown",
      "ownership_model": "unknown",
      "primary_subtype": "unknown",
      "count": 0,
      "notes": "Placeholder for unclassified brands"
    }
  }
}
```

**Schema Definition**:
- `schema_version`: Version number for migrations
- `generated_date`: ISO 8601 timestamp
- `brands`: Object keyed by ticker
  - `name`: Display name
  - `ownership_model`: Enum [franchise, non-franchise, unknown]
  - `primary_subtype`: Enum [licensed, corporate, independent, unknown]
  - `count`: Location count for UX display
  - `notes`: Internal notes (not displayed)

### 1.2 Location Object Extension

**Current**: `{ ticker, lat, lng, s, n, a, at, ss }`

**After Metadata Merge**:
```javascript
{
  ticker: "MCD",
  lat: 40.123,
  lng: -74.456,
  s: 85,
  n: "McDonald's",
  a: "123 Main St",
  at: { address: "...", city: "..." },
  ss: { ... },

  // NEW FIELDS (merged from brand_metadata.json)
  ownership: "franchise",           // Inherited from ticker
  subtype: "licensed"               // Inherited from ticker
}
```

**Inheritance Rule**: All locations of a brand inherit the brand's ownership_model and primary_subtype from brand_metadata.json.

### 1.3 State Variables (map.js)

```javascript
// NEW state for ownership filter
let ownershipModel = new Set(['franchise', 'non-franchise']);  // Default: show both
let subtypes = new Set(['licensed', 'corporate', 'independent', 'unknown']); // Default: all
let brandMetadata = null;  // Loaded from brand_metadata.json

// NEW helper to track filter visibility
let ownershipFilterVisible = true;  // Show ownership buttons
let subtypeFilterVisible = true;    // Show subtype buttons
```

---

## Phase 2: Generator Script (build_brand_metadata.py)

### 2.1 Script Location & Purpose

**File**: `data-aggregation/pipelines/franchise/build_brand_metadata.py`

**Purpose**: Generate `brand_metadata.json` from canonical dataset and seed lists.

### 2.2 Implementation

```python
#!/usr/bin/env python3
"""
Generate brand_metadata.json for ownership-model filtering.

Seed lists map tickers to ownership models and subtypes.
Single source of truth for FranchiseMap brand classification.
"""

import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Set

# Add repo root to path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from config.paths_config import BRANDS_DATA_DIR, FRANCHISEMAP_DATA_DIR

# SEED LISTS: Define ownership classification for all known brands
FRANCHISE_BRANDS = {
    'MCD': {'name': 'McDonald\'s', 'subtype': 'licensed'},
    'SBUX': {'name': 'Starbucks', 'subtype': 'licensed'},
    'YUM': {'name': 'Yum! Brands', 'subtype': 'licensed'},
    'QSR': {'name': 'Restaurant Brands', 'subtype': 'licensed'},
    'DPZ': {'name': 'Domino\'s', 'subtype': 'licensed'},
    'JACK': {'name': 'Jack in the Box', 'subtype': 'licensed'},
    'WEN': {'name': 'Wendy\'s', 'subtype': 'licensed'},
    'CMG': {'name': 'Chipotle', 'subtype': 'licensed'},
    'WING': {'name': 'Wingstop', 'subtype': 'licensed'},
    'SHAK': {'name': 'The Habit', 'subtype': 'licensed'},
    'PZZA': {'name': 'Papa John\'s', 'subtype': 'licensed'},
    'DNUT': {'name': 'Dunkin\'', 'subtype': 'licensed'},
    'NATH': {'name': 'Nath\'s', 'subtype': 'licensed'},
    'INSPIRE': {'name': 'Inspire Brands', 'subtype': 'licensed'},
    'FOCUS': {'name': 'Focusrite', 'subtype': 'licensed'},
    'DENN': {'name': 'Denny\'s', 'subtype': 'independent'},
    'DIN': {'name': 'Dine Global', 'subtype': 'independent'},
    'CBRL': {'name': 'Cracker Barrel', 'subtype': 'independent'},
    'TXRH': {'name': 'Texas Roadhouse', 'subtype': 'independent'},
    'BLMN': {'name': 'Bloomin\' Brands', 'subtype': 'independent'},
    'CAKE': {'name': 'The Cheesecake Factory', 'subtype': 'independent'},
    'BJRI': {'name': 'BJ\'s Restaurants', 'subtype': 'independent'},
    'CHUY': {'name': 'Chuy Holdings', 'subtype': 'independent'},
    'EAT': {'name': 'Ark Restaurants', 'subtype': 'independent'},
    'DRI': {'name': 'Dine Global Holdings', 'subtype': 'independent'},
    'RRGB': {'name': 'Red Robin', 'subtype': 'independent'},
    'PLAY': {'name': 'Dave & Buster\'s', 'subtype': 'independent'},
}

NON_FRANCHISE_BRANDS = {
    'SUB': {'name': 'Subway', 'subtype': 'corporate'},
    'CFA': {'name': 'Chick-fil-A', 'subtype': 'corporate'},
    'PANDA': {'name': 'Panda Express', 'subtype': 'corporate'},
    'DQ': {'name': 'Dairy Queen', 'subtype': 'corporate'},
    'LCE': {'name': 'Little Caesars', 'subtype': 'corporate'},
    'JM': {'name': 'Jimmy John\'s', 'subtype': 'corporate'},
    'FIVE': {'name': 'Five Guys', 'subtype': 'corporate'},
    'CANE': {'name': 'Raising Cane\'s', 'subtype': 'corporate'},
    'WHATA': {'name': 'Whataburger', 'subtype': 'corporate'},
    'ZAX': {'name': 'Zaxby\'s', 'subtype': 'corporate'},
    'BO': {'name': 'Back Yard Burgers', 'subtype': 'corporate'},
    'WAWA': {'name': 'Wawa', 'subtype': 'corporate'},
    'SHEETZ': {'name': 'Sheetz', 'subtype': 'corporate'},
    'INNOUT': {'name': 'In-N-Out', 'subtype': 'corporate'},
    'PANERA': {'name': 'Panera Bread', 'subtype': 'corporate'},
    'DUTCH': {'name': 'Dutch Bros', 'subtype': 'corporate'},
}

HOTELS_BRANDS = {
    'MAR': {'name': 'Marriott', 'subtype': 'licensed'},
    'HLT': {'name': 'Hilton', 'subtype': 'licensed'},
    'H': {'name': 'Hyatt', 'subtype': 'licensed'},
    'IHG': {'name': 'IHG', 'subtype': 'licensed'},
    'WH': {'name': 'Wyndham', 'subtype': 'licensed'},
    'CHH': {'name': 'Choice Hotels', 'subtype': 'licensed'},
    'BW': {'name': 'Best Western', 'subtype': 'licensed'},
    'G6': {'name': 'G6 Hospitality', 'subtype': 'licensed'},
    'VAC': {'name': 'Vici Properties', 'subtype': 'licensed'},
    'TNL': {'name': 'Travel Leaders', 'subtype': 'licensed'},
}

SERVICES_BRANDS = {
    'MCW': {'name': 'Massage Envy', 'subtype': 'licensed'},
    'PLNT': {'name': 'Planet Fitness', 'subtype': 'licensed'},
    'XPOF': {'name': 'Xponential', 'subtype': 'licensed'},
    'HRB': {'name': 'H&R Block', 'subtype': 'licensed'},
    'SERV': {'name': 'ServiceMaster', 'subtype': 'licensed'},
    'ROL': {'name': 'Rollover', 'subtype': 'licensed'},
    'HLE': {'name': 'Healthylife', 'subtype': 'licensed'},
    'CAR': {'name': 'Carmax', 'subtype': 'licensed'},
    'UHAL': {'name': 'U-Haul', 'subtype': 'licensed'},
    'DRIVEN': {'name': 'Driven', 'subtype': 'licensed'},
}

ROARK_BRANDS = {
    'INSPIRE': {'name': 'Inspire Brands', 'subtype': 'licensed'},
    'FOCUS': {'name': 'Focusrite', 'subtype': 'licensed'},
    'DRIVEN': {'name': 'Driven', 'subtype': 'licensed'},
    'ROARK': {'name': 'Roark Capital', 'subtype': 'licensed'},
}


def build_metadata() -> Dict:
    """Generate brand_metadata.json from seed lists."""

    metadata = {
        "schema_version": "1.0",
        "generated_date": datetime.utcnow().isoformat() + "Z",
        "brands": {}
    }

    # Combine all seed lists
    all_brands = {
        **{k: {**v, 'ownership_model': 'franchise'} for k, v in FRANCHISE_BRANDS.items()},
        **{k: {**v, 'ownership_model': 'non-franchise'} for k, v in NON_FRANCHISE_BRANDS.items()},
        **{k: {**v, 'ownership_model': 'franchise'} for k, v in HOTELS_BRANDS.items()},
        **{k: {**v, 'ownership_model': 'franchise'} for k, v in SERVICES_BRANDS.items()},
    }

    # Load location counts from manifest
    manifest_path = FRANCHISEMAP_DATA_DIR / 'manifest.json'
    manifest = {}
    if manifest_path.exists():
        with open(manifest_path) as f:
            manifest_data = json.load(f)
            manifest = {item['ticker']: item['count'] for item in manifest_data}

    # Build final metadata
    for ticker, brand_info in sorted(all_brands.items()):
        metadata['brands'][ticker] = {
            'name': brand_info['name'],
            'ownership_model': brand_info['ownership_model'],
            'primary_subtype': brand_info['subtype'],
            'count': manifest.get(ticker, 0),
            'notes': ''
        }

    # Add unknown placeholder
    metadata['brands']['UNKNOWN'] = {
        'name': 'Unknown',
        'ownership_model': 'unknown',
        'primary_subtype': 'unknown',
        'count': 0,
        'notes': 'Placeholder for unclassified brands'
    }

    return metadata


def validate_metadata(metadata: Dict) -> List[str]:
    """Validate metadata structure and values."""
    errors = []

    # Check schema version
    if 'schema_version' not in metadata:
        errors.append("Missing schema_version")

    # Check generated_date
    if 'generated_date' not in metadata:
        errors.append("Missing generated_date")

    # Check brands object
    if 'brands' not in metadata or not isinstance(metadata['brands'], dict):
        errors.append("Missing or invalid brands object")
        return errors

    # Validate each brand
    valid_ownership = {'franchise', 'non-franchise', 'unknown'}
    valid_subtypes = {'licensed', 'corporate', 'independent', 'unknown'}

    for ticker, brand in metadata['brands'].items():
        if not isinstance(brand, dict):
            errors.append(f"Brand {ticker} is not an object")
            continue

        if 'ownership_model' not in brand:
            errors.append(f"Brand {ticker} missing ownership_model")
        elif brand['ownership_model'] not in valid_ownership:
            errors.append(f"Brand {ticker} has invalid ownership_model: {brand['ownership_model']}")

        if 'primary_subtype' not in brand:
            errors.append(f"Brand {ticker} missing primary_subtype")
        elif brand['primary_subtype'] not in valid_subtypes:
            errors.append(f"Brand {ticker} has invalid primary_subtype: {brand['primary_subtype']}")

        if 'name' not in brand:
            errors.append(f"Brand {ticker} missing name")

        if 'count' not in brand or not isinstance(brand['count'], int):
            errors.append(f"Brand {ticker} missing or invalid count")

    return errors


def main():
    """Generate and save brand_metadata.json."""

    # Generate metadata
    metadata = build_metadata()

    # Validate
    errors = validate_metadata(metadata)
    if errors:
        print("Validation errors found:")
        for error in errors:
            print(f"  ❌ {error}")
        return False

    # Save
    output_path = FRANCHISEMAP_DATA_DIR / 'brand_metadata.json'
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"✅ Generated {output_path}")
    print(f"   Brands: {len(metadata['brands'])}")
    print(f"   Ownership models: franchise={sum(1 for b in metadata['brands'].values() if b['ownership_model']=='franchise')}, non-franchise={sum(1 for b in metadata['brands'].values() if b['ownership_model']=='non-franchise')}, unknown={sum(1 for b in metadata['brands'].values() if b['ownership_model']=='unknown')}")

    return True


if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
```

### 2.3 Integration Points

- **Called by**: GitHub Action step after generating locations
- **Input**: manifest.json (location counts), seed lists (hardcoded)
- **Output**: `FranchiseMap/data/brand_metadata.json`
- **Error handling**: Validation with detailed error messages

---

## Phase 3: Location Loading & Metadata Merge

### 3.1 Metadata Loading (map.js)

Add to `initMap()` or separate initialization:

```javascript
// NEW: Load brand metadata once on page load
let brandMetadata = null;

function loadBrandMetadata() {
    return fetch('data/brand_metadata.json')
        .then(res => res.json())
        .then(data => {
            brandMetadata = data.brands;
            console.log('Loaded brand metadata for', Object.keys(brandMetadata).length, 'brands');
            return data;
        })
        .catch(e => {
            console.warn('Failed to load brand metadata:', e);
            brandMetadata = {};
        });
}
```

### 3.2 Metadata Merge on Location Load

Modify `toggleTicker()` and `selectAll()` to merge metadata when fetching location data:

```javascript
function toggleTicker(ticker, filePath) {
    if (activeTickers.has(ticker)) {
        activeTickers.delete(ticker);
        refreshMap();
    } else {
        activeTickers.add(ticker);
        if (loadedTickers.has(ticker)) {
            refreshMap();
        } else {
            fetch(filePath)
                .then(r => r.json())
                .then(data => {
                    // MERGE: Add ownership/subtype metadata to each location
                    const enhancedData = mergeOwnershipMetadata(data, ticker);
                    allLocations = allLocations.concat(enhancedData);
                    loadedTickers.add(ticker);
                    refreshMap();
                });
        }
    }
    updateLocationCount();
    updateDashboardStats();
}

// NEW: Merge metadata into location objects
function mergeOwnershipMetadata(locations, ticker) {
    if (!brandMetadata || !brandMetadata[ticker]) {
        // Fallback for unknown brands
        return locations.map(loc => ({
            ...loc,
            ownership: 'unknown',
            subtype: 'unknown'
        }));
    }

    const metadata = brandMetadata[ticker];
    return locations.map(loc => ({
        ...loc,
        ownership: metadata.ownership_model,
        subtype: metadata.primary_subtype
    }));
}
```

### 3.3 Initialization Order

In `initMap()`, ensure metadata loads before locations:

```javascript
function initMap() {
    // ... existing map setup ...
    setupRail();
    setupFilters();
    setupAdvancedControls();

    // NEW: Load metadata BEFORE loading locations
    loadBrandMetadata().then(() => {
        loadManifest();
    });
}
```

---

## Phase 4: Ownership Filter UI & Handlers

### 4.1 HTML Changes (map.html)

Add after category filters (~lines 194-200):

```html
<!-- OWNERSHIP MODEL FILTER -->
<div class="ownership-filters">
    <label class="filter-label">Ownership Model</label>
    <div class="ownership-buttons">
        <button id="btn-ownership-all" class="ownership-btn active" data-model="all">All</button>
        <button id="btn-ownership-franchise" class="ownership-btn active" data-model="franchise">Franchise</button>
        <button id="btn-ownership-non-franchise" class="ownership-btn active" data-model="non-franchise">Non-Franchise</button>
    </div>
</div>

<!-- SUB-TYPE FILTER (visible only when non-franchise is selected) -->
<div class="subtype-filters" id="subtype-filter-container" style="display: none;">
    <label class="filter-label">Non-Franchise Sub-Type</label>
    <div class="subtype-buttons">
        <button id="btn-subtype-all" class="subtype-btn active" data-subtype="all">All</button>
        <button id="btn-subtype-licensed" class="subtype-btn active" data-subtype="licensed">Licensed</button>
        <button id="btn-subtype-corporate" class="subtype-btn active" data-subtype="corporate">Corporate</button>
        <button id="btn-subtype-independent" class="subtype-btn active" data-subtype="independent">Independent</button>
        <button id="btn-subtype-unknown" class="subtype-btn active" data-subtype="unknown">Unknown</button>
    </div>
</div>
```

### 4.2 CSS Styling (map.html style section)

```css
.ownership-filters, .subtype-filters {
    margin-bottom: 16px;
}

.filter-label {
    display: block;
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--text-light);
    margin-bottom: 8px;
}

.ownership-buttons, .subtype-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.ownership-btn, .subtype-btn {
    flex: 1;
    min-width: 80px;
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    background: var(--bg-secondary);
    color: var(--text-light);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.ownership-btn:hover, .subtype-btn:hover {
    background: var(--bg-tertiary);
}

.ownership-btn.active, .subtype-btn.active {
    background: var(--primary-color);
    border-color: var(--primary-color);
    color: white;
}
```

### 4.3 JavaScript Handlers (map.js)

Add to `setupFilters()`:

```javascript
function setupFilters() {
    // ... existing button handlers ...

    // NEW: Ownership model buttons
    document.querySelectorAll('.ownership-btn').forEach(btn => {
        btn.onclick = function() {
            const model = this.dataset.model;

            if (model === 'all') {
                // Select all ownership models
                ownershipModel.clear();
                ownershipModel.add('franchise');
                ownershipModel.add('non-franchise');
                document.querySelectorAll('.ownership-btn').forEach(b => b.classList.add('active'));
                updateSubtypeButtonVisibility();
            } else {
                // Toggle individual model
                if (ownershipModel.has(model)) {
                    ownershipModel.delete(model);
                    this.classList.remove('active');
                } else {
                    ownershipModel.add(model);
                    this.classList.add('active');
                }

                // Remove "All" button active state if not all are selected
                const allBtn = document.getElementById('btn-ownership-all');
                if (ownershipModel.size === 2) {
                    allBtn.classList.add('active');
                } else {
                    allBtn.classList.remove('active');
                }

                updateSubtypeButtonVisibility();
            }

            refreshMap();
        };
    });

    // NEW: Sub-type buttons
    document.querySelectorAll('.subtype-btn').forEach(btn => {
        btn.onclick = function() {
            const subtype = this.dataset.subtype;

            if (subtype === 'all') {
                // Select all subtypes
                subtypes.clear();
                subtypes.add('licensed');
                subtypes.add('corporate');
                subtypes.add('independent');
                subtypes.add('unknown');
                document.querySelectorAll('.subtype-btn').forEach(b => b.classList.add('active'));
            } else {
                // Toggle individual subtype
                if (subtypes.has(subtype)) {
                    subtypes.delete(subtype);
                    this.classList.remove('active');
                } else {
                    subtypes.add(subtype);
                    this.classList.add('active');
                }

                // Remove "All" button active state if not all are selected
                const allBtn = document.getElementById('btn-subtype-all');
                if (subtypes.size === 4) {
                    allBtn.classList.add('active');
                } else {
                    allBtn.classList.remove('active');
                }
            }

            refreshMap();
        };
    });
}

// NEW: Helper to show/hide subtype filter based on ownership selection
function updateSubtypeButtonVisibility() {
    const subtypeContainer = document.getElementById('subtype-filter-container');

    // Only show subtype filter if "non-franchise" is selected AND "franchise" is not
    if (ownershipModel.has('non-franchise') && !ownershipModel.has('franchise')) {
        subtypeContainer.style.display = 'block';
    } else {
        subtypeContainer.style.display = 'none';
        // Reset subtypes to all if container is hidden
        subtypes.clear();
        subtypes.add('licensed');
        subtypes.add('corporate');
        subtypes.add('independent');
        subtypes.add('unknown');
        document.querySelectorAll('.subtype-btn').forEach(b => b.classList.add('active'));
    }
}
```

### 4.4 Update Filter Logic in refreshMap()

Modify the visible filter (around line 178):

```javascript
function refreshMap() {
    clusterGroup.clearLayers();
    markersLayer.clearLayers();
    highlightedMarkers = [];

    // Apply score filter
    const visible = allLocations.filter(loc =>
        activeTickers.has(loc.ticker) &&
        loc.s >= scoreFilter.min &&
        loc.s <= scoreFilter.max &&
        ownershipModel.has(loc.ownership) &&              // NEW
        subtypes.has(loc.subtype)                         // NEW
    );

    // ... rest of refreshMap remains the same ...
}
```

### 4.5 Update updateLocationCount()

Same filter logic for consistency:

```javascript
function updateLocationCount() {
    const visible = allLocations.filter(loc =>
        activeTickers.has(loc.ticker) &&
        loc.s >= scoreFilter.min &&
        loc.s <= scoreFilter.max &&
        ownershipModel.has(loc.ownership) &&              // NEW
        subtypes.has(loc.subtype)                         // NEW
    );
    document.getElementById('visible-count').textContent = visible.length.toLocaleString();
}
```

### 4.6 Initialize State in map.js

At top of DOMContentLoaded, add:

```javascript
// NEW: Ownership and sub-type filters
let ownershipModel = new Set(['franchise', 'non-franchise']);  // Both by default
let subtypes = new Set(['licensed', 'corporate', 'independent', 'unknown']); // All by default
let brandMetadata = null;
```

---

## Phase 5: Testing & Validation

### 5.1 Manual Testing Checklist

- [ ] Verify brand_metadata.json generates without errors
- [ ] Confirm metadata loads on page load (check console)
- [ ] Test ownership filter buttons appear in correct location
- [ ] Verify subtype buttons are hidden initially
- [ ] Click "Non-Franchise" button → subtype buttons appear
- [ ] Click "Franchise" button → subtype buttons disappear
- [ ] Test each ownership model combination:
  - [ ] All selected (both franchise + non-franchise)
  - [ ] Franchise only
  - [ ] Non-Franchise only
  - [ ] None selected (should show no markers)
- [ ] Test subtype filtering with non-franchise selected
- [ ] Verify marker counts update correctly
- [ ] Confirm score filter AND ownership filter work together
- [ ] Verify category filter AND ownership filter work together
- [ ] Test export includes ownership/subtype in metadata

### 5.2 Data Validation

- [ ] All tickers in manifest exist in brand_metadata
- [ ] All ownership_model values are valid (franchise/non-franchise/unknown)
- [ ] All primary_subtype values are valid (licensed/corporate/independent/unknown)
- [ ] Location counts in metadata match manifest counts

### 5.3 Edge Cases

- [ ] Brand with unknown ownership_model is handled gracefully
- [ ] Location without ownership field defaults to 'unknown'
- [ ] Refreshing page with filters applied preserves state (if using URL params)
- [ ] Responsive design on mobile devices

---

## Phase 6: GitHub Actions Integration

### 6.1 Update generate-data.yml

Add step to generate brand_metadata.json after generating locations:

```yaml
- name: Generate brand metadata
  run: python -m data_aggregation.pipelines.franchise.build_brand_metadata

- name: Commit brand metadata
  run: |
    cd FranchiseMap
    git add data/brand_metadata.json
    git commit -m "Update brand metadata" || true
```

### 6.2 Version Control

- Commit `brand_metadata.json` to repository
- Update `.gitignore` if needed (should be tracked)
- Include in git operations after generation

---

## Implementation Sequence

1. **Phase 1**: Create brand_metadata.json schema
2. **Phase 2**: Write build_brand_metadata.py generator
3. **Phase 3**: Implement metadata loading and merging in map.js
4. **Phase 4**: Add UI buttons and filter handlers
5. **Phase 5**: Manual testing and validation
6. **Phase 6**: GitHub Actions integration

**Estimated Effort**:
- Phase 1: ~1 hour (schema design)
- Phase 2: ~2 hours (generator script with seed lists)
- Phase 3: ~1 hour (metadata loading)
- Phase 4: ~2 hours (UI and handlers)
- Phase 5: ~1 hour (testing)
- Phase 6: ~30 minutes (Actions integration)

**Total**: ~7-8 hours development time

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Old browsers lack Set/Map support | Use Array fallback or transpile with Babel |
| Missing metadata causes errors | Fallback to 'unknown' ownership for unmapped tickers |
| Metadata becomes stale | Regenerated automatically in GitHub Actions |
| Performance impact from metadata merge | Metadata merge is O(n) on-demand, negligible for <10k locations |
| UI overflow on small screens | Use flexbox wrapping and truncate labels |

---

## Files Modified/Created

**New Files**:
- `data-aggregation/pipelines/franchise/build_brand_metadata.py`
- `FranchiseMap/data/brand_metadata.json` (generated)

**Modified Files**:
- `FranchiseMap/map.html` (+20 lines for ownership/subtype buttons)
- `FranchiseMap/js/map.js` (+150 lines for new state, handlers, merge logic)
- `.github/workflows/generate-data.yml` (+5 lines for metadata generation step)

**Lines of Code**:
- New: ~350 lines
- Modified: ~175 lines
- Total: ~525 lines

---

## Success Criteria

✅ Ownership model filtering works for all combinations
✅ Sub-type filtering only appears when appropriate
✅ Marker counts update correctly with filter changes
✅ Zero regression in existing filters (category, score, brand, Roark)
✅ brand_metadata.json generated automatically
✅ All brand tickers classified in seed lists
✅ UI responsive on desktop and mobile
✅ Console shows no errors when loading/filtering
