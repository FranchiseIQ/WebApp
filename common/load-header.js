/**
 * Shared Header Loader
 *
 * Dynamically loads the shared header component and adjusts paths based on
 * the current page's location (root vs subdirectory).
 *
 * Usage:
 *   <div id="shared-header"></div>
 *   <script src="common/load-header.js"></script>
 *
 * For subdirectory pages:
 *   <div id="shared-header"></div>
 *   <script src="../common/load-header.js"></script>
 */

(function() {
    'use strict';

    // Determine if we're in a subdirectory
    const scriptTag = document.currentScript;
    const scriptSrc = scriptTag ? scriptTag.src : '';
    const isSubdirectory = scriptSrc.includes('../common/');
    const pathPrefix = isSubdirectory ? '../' : '';

    // Determine current page for active nav highlighting
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';

    /**
     * Load and inject the shared header
     */
    async function loadHeader() {
        const container = document.getElementById('shared-header');
        if (!container) {
            console.warn('[load-header.js] No #shared-header container found');
            return;
        }

        try {
            // Fetch header HTML
            const headerPath = pathPrefix + 'common/header.html';
            const response = await fetch(headerPath);

            if (!response.ok) {
                throw new Error(`Failed to load header: ${response.status}`);
            }

            let html = await response.text();

            // Adjust paths for subdirectory pages
            if (isSubdirectory) {
                html = adjustPaths(html, pathPrefix);
            }

            // Insert header HTML
            container.innerHTML = html;

            // Add body classes for proper spacing
            document.body.classList.add('has-fixed-ticker', 'has-fixed-nav');

            // Highlight active nav link
            highlightActiveLink(currentPage);

            // Load ticker script
            loadTickerScript();

            console.log('[load-header.js] Header loaded successfully');

        } catch (error) {
            console.error('[load-header.js] Error loading header:', error);
            // Fallback: show minimal header
            container.innerHTML = createFallbackHeader(pathPrefix);
        }
    }

    /**
     * Adjust href and src paths for subdirectory pages
     */
    function adjustPaths(html, prefix) {
        // Adjust all data-base-href attributes to actual href
        html = html.replace(/href="([^"]+)"/g, (match, href) => {
            // Don't modify external links or anchors
            if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) {
                return match;
            }
            return `href="${prefix}${href}"`;
        });

        // Adjust all src attributes
        html = html.replace(/src="([^"]+)"/g, (match, src) => {
            // Don't modify external sources
            if (src.startsWith('http') || src.startsWith('//')) {
                return match;
            }
            return `src="${prefix}${src}"`;
        });

        return html;
    }

    /**
     * Highlight the current page's nav link
     */
    function highlightActiveLink(currentPage) {
        const navLinks = document.querySelectorAll('.site-nav .nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && href.includes(currentPage)) {
                link.classList.add('active');
            }
        });
    }

    /**
     * Load the ticker JavaScript
     */
    function loadTickerScript() {
        const tickerScriptPath = pathPrefix + 'Website/ticker.js';

        // Check if ticker script is already loaded
        const existingScript = document.querySelector(`script[src*="ticker.js"]`);
        if (existingScript) {
            console.log('[load-header.js] Ticker script already loaded');
            return;
        }

        const script = document.createElement('script');
        script.src = tickerScriptPath;
        script.async = true;
        script.onload = () => {
            console.log('[load-header.js] Ticker script loaded');
            // Initialize ticker if function exists
            if (typeof initTicker === 'function') {
                initTicker();
            }
        };
        script.onerror = () => {
            console.warn('[load-header.js] Failed to load ticker script');
        };
        document.body.appendChild(script);
    }

    /**
     * Create a minimal fallback header if loading fails
     */
    function createFallbackHeader(prefix) {
        return `
            <nav class="site-nav below-ticker" style="position:fixed;top:0;left:0;right:0;background:#0f172a;padding:16px 24px;z-index:300;">
                <a href="${prefix}index.html" class="nav-brand" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#f8fafc;font-weight:700;">
                    <img src="${prefix}logo.svg" alt="FranResearch" width="32" height="32">
                    <span>FranResearch</span>
                </a>
                <div class="nav-links" style="display:flex;gap:24px;margin-left:auto;">
                    <a href="${prefix}StockChart/chart.html" style="color:#94a3b8;text-decoration:none;">Charts</a>
                    <a href="${prefix}FranchiseMap/map.html" style="color:#94a3b8;text-decoration:none;">Map</a>
                    <a href="${prefix}sports.html" style="color:#94a3b8;text-decoration:none;">Sports</a>
                    <a href="${prefix}about.html" style="color:#94a3b8;text-decoration:none;">About</a>
                </div>
            </nav>
        `;
    }

    // Load header when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadHeader);
    } else {
        loadHeader();
    }
})();
