/**
 * Brand Search and Filter Module
 * Enables quick discovery and filtering of franchise brands
 */

const BrandSearch = (() => {
  'use strict';

  // Comprehensive brand database with categories
  const BRANDS_DATABASE = {
    QSR: [
      { ticker: 'MCD', name: 'McDonald\'s', founded: 1955, units: 4000, avgUnitVolume: 2.7 },
      { ticker: 'YUM', name: 'Yum! Brands', founded: 1997, units: 1200, avgUnitVolume: 1.8 },
      { ticker: 'SBUX', name: 'Starbucks', founded: 1971, units: 3000, avgUnitVolume: 1.5 },
      { ticker: 'DPZ', name: 'Domino\'s Pizza', founded: 1960, units: 2000, avgUnitVolume: 1.2 },
      { ticker: 'QSR', name: 'Restaurant Brands', founded: 1954, units: 800, avgUnitVolume: 1.4 },
      { ticker: 'WEN', name: 'Wendy\'s', founded: 1969, units: 1200, avgUnitVolume: 1.3 },
      { ticker: 'JACK', name: 'Jack in the Box', founded: 1951, units: 400, avgUnitVolume: 1.1 },
      { ticker: 'SHAK', name: 'Shake Shack', founded: 2004, units: 400, avgUnitVolume: 1.8 },
      { ticker: 'DENN', name: 'Denny\'s', founded: 1953, units: 600, avgUnitVolume: 1.2 },
      { ticker: 'DIN', name: 'Dine Global Holdings', founded: 1988, units: 500, avgUnitVolume: 1.1 },
      { ticker: 'DNUT', name: 'Krispy Kreme', founded: 1937, units: 1500, avgUnitVolume: 0.8 },
      { ticker: 'NATH', name: 'Nathan\'s Famous', founded: 1916, units: 300, avgUnitVolume: 0.6 },
      { ticker: 'RRGB', name: 'Red Robin', founded: 1969, units: 300, avgUnitVolume: 1.3 }
    ],
    Hospitality: [
      { ticker: 'MAR', name: 'Marriott International', founded: 1927, units: 8000, avgUnitVolume: 2.5 },
      { ticker: 'HLT', name: 'Hilton Worldwide', founded: 1919, units: 7000, avgUnitVolume: 2.3 },
      { ticker: 'H', name: 'Hyatt Hotels', founded: 1957, units: 1500, avgUnitVolume: 2.8 },
      { ticker: 'CHH', name: 'Choice Hotels', founded: 1939, units: 3000, avgUnitVolume: 1.8 },
      { ticker: 'WH', name: 'Wyndham Hotels', founded: 1981, units: 5500, avgUnitVolume: 1.6 },
      { ticker: 'VAC', name: 'Marriott Vacations', founded: 2011, units: 2000, avgUnitVolume: 3.2 }
    ],
    AutoServices: [
      { ticker: 'DRVN', name: 'Driven Brands', founded: 2015, units: 1200, avgUnitVolume: 1.5 },
      { ticker: 'HRB', name: 'H&R Block', founded: 1955, units: 4000, avgUnitVolume: 0.9 },
      { ticker: 'MCW', name: 'Monro Muffler', founded: 1957, units: 1100, avgUnitVolume: 1.2 },
      { ticker: 'SERV', name: 'ServiceMaster', founded: 1929, units: 2000, avgUnitVolume: 1.4 },
      { ticker: 'ROL', name: 'Rollins Inc', founded: 1948, units: 3500, avgUnitVolume: 1.1 }
    ],
    Fitness: [
      { ticker: 'PLNT', name: 'Planet Fitness', founded: 1992, units: 3000, avgUnitVolume: 2.2 },
      { ticker: 'TNL', name: 'F45 Training', founded: 2017, units: 1800, avgUnitVolume: 1.6 },
      { ticker: 'PLAY', name: 'Dave & Buster\'s', founded: 1982, units: 150, avgUnitVolume: 2.5 }
    ],
    Retail: [
      { ticker: 'RENT', name: 'Rent-A-Center', founded: 1986, units: 3200, avgUnitVolume: 1.8 },
      { ticker: 'ADUS', name: 'Adidas', founded: 1949, units: 2400, avgUnitVolume: 2.1 },
      { ticker: 'LOPE', name: 'L Brands', founded: 1963, units: 1300, avgUnitVolume: 1.9 },
      { ticker: 'ARCO', name: 'Arcos Dorados', founded: 1999, units: 1000, avgUnitVolume: 1.5 }
    ]
  };

  /**
   * Get all brands
   */
  function getAllBrands() {
    const brands = [];
    Object.values(BRANDS_DATABASE).forEach(category => {
      brands.push(...category);
    });
    return brands.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get brands by category
   */
  function getBrandsByCategory(category) {
    return BRANDS_DATABASE[category] || [];
  }

  /**
   * Search brands by name or ticker
   */
  function searchBrands(query) {
    if (!query || query.trim().length === 0) {
      return getAllBrands();
    }

    const q = query.toLowerCase();
    return getAllBrands().filter(brand =>
      brand.name.toLowerCase().includes(q) ||
      brand.ticker.toLowerCase().includes(q)
    );
  }

  /**
   * Get brand info
   */
  function getBrandInfo(ticker) {
    for (const category in BRANDS_DATABASE) {
      const brand = BRANDS_DATABASE[category].find(b => b.ticker === ticker);
      if (brand) return { ...brand, category };
    }
    return null;
  }

  /**
   * Get similar brands (same category or similar size)
   */
  function getSimilarBrands(ticker, limit = 5) {
    const brand = getBrandInfo(ticker);
    if (!brand) return [];

    const similar = getAllBrands()
      .filter(b => b.ticker !== ticker)
      .filter(b => b.category === brand.category || Math.abs(b.units - brand.units) < 500)
      .sort((a, b) => Math.abs(a.units - brand.units) - Math.abs(b.units - brand.units))
      .slice(0, limit);

    return similar;
  }

  /**
   * Create brand search UI component
   */
  function createSearchComponent() {
    return `
      <div class="brand-search-container">
        <div class="brand-search-input-wrapper">
          <input
            type="text"
            id="brand-search-input"
            class="brand-search-input"
            placeholder="Search brands by name or ticker... (e.g., McDonald's, MCD)"
            autocomplete="off"
          />
          <button id="brand-search-clear" class="brand-search-clear" style="display: none;">✕</button>
        </div>
        <div class="brand-category-filters">
          <button class="category-filter active" data-category="all">All</button>
          <button class="category-filter" data-category="QSR">QSR</button>
          <button class="category-filter" data-category="Hospitality">Hotels</button>
          <button class="category-filter" data-category="AutoServices">Auto/Services</button>
          <button class="category-filter" data-category="Fitness">Fitness</button>
          <button class="category-filter" data-category="Retail">Retail</button>
        </div>
        <div id="brand-search-results" class="brand-search-results"></div>
      </div>
    `;
  }

  /**
   * Render search results
   */
  function renderResults(brands, targetElement) {
    if (!targetElement) return;

    if (brands.length === 0) {
      targetElement.innerHTML = '<p class="search-no-results">No brands found</p>';
      return;
    }

    const html = brands
      .map(brand => `
        <div class="brand-result-item" data-ticker="${brand.ticker}">
          <div class="brand-result-name">${brand.name}</div>
          <div class="brand-result-ticker">${brand.ticker}</div>
          <div class="brand-result-meta">
            <span>${brand.units.toLocaleString()} units</span>
            <span>Avg Vol: $${brand.avgUnitVolume}M</span>
          </div>
        </div>
      `)
      .join('');

    targetElement.innerHTML = html;
  }

  /**
   * Initialize search UI
   */
  function initializeSearch(evaluationPage) {
    const container = document.querySelector('.brand-controls');
    if (!container) return;

    // Insert search component before the select dropdowns
    container.insertAdjacentHTML('afterbegin', createSearchComponent());

    const searchInput = document.getElementById('brand-search-input');
    const clearBtn = document.getElementById('brand-search-clear');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const resultsContainer = document.getElementById('brand-search-results');

    let currentCategory = 'all';

    // Search handler
    function performSearch() {
      const query = searchInput.value;
      let results = searchBrands(query);

      if (currentCategory !== 'all') {
        results = results.filter(b => getBrandInfo(b.ticker).category === currentCategory);
      }

      renderResults(results, resultsContainer);
      clearBtn.style.display = query.length > 0 ? 'block' : 'none';

      // Add click handlers to results
      document.querySelectorAll('.brand-result-item').forEach(item => {
        item.addEventListener('click', () => {
          const ticker = item.dataset.ticker;
          document.getElementById('brand-select').value = ticker;
          // Trigger change event
          const event = new Event('change', { bubbles: true });
          document.getElementById('brand-select').dispatchEvent(event);
          searchInput.value = '';
          clearBtn.style.display = 'none';
          resultsContainer.innerHTML = '';
        });
      });
    }

    // Event listeners
    searchInput.addEventListener('input', performSearch);
    searchInput.addEventListener('focus', performSearch);

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      clearBtn.style.display = 'none';
      performSearch();
    });

    categoryFilters.forEach(filter => {
      filter.addEventListener('click', () => {
        categoryFilters.forEach(f => f.classList.remove('active'));
        filter.classList.add('active');
        currentCategory = filter.dataset.category;
        performSearch();
      });
    });
  }

  // Public API
  return {
    getAllBrands,
    getBrandsByCategory,
    searchBrands,
    getBrandInfo,
    getSimilarBrands,
    createSearchComponent,
    renderResults,
    initializeSearch
  };
})();
