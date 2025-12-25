/**
 * Saved Evaluations Module
 * Stores and manages franchise evaluations in localStorage
 */

const SavedEvaluations = (() => {
  'use strict';

  const STORAGE_KEY = 'franchiseEvaluations';
  const MAX_SAVED = 20;

  /**
   * Save an evaluation
   */
  function saveEvaluation(evaluation) {
    if (!evaluation.brand || !evaluation.market) {
      console.warn('Invalid evaluation data');
      return false;
    }

    try {
      const saved = getAllEvaluations();

      // Create evaluation record
      const record = {
        id: generateId(),
        brand: evaluation.brand,
        brandName: evaluation.brandName,
        market: evaluation.market,
        score: evaluation.score,
        interpretation: evaluation.interpretation,
        timestamp: new Date().toISOString(),
        url: `evaluate/?brand=${evaluation.brand}&market=${evaluation.market}`
      };

      // Add to beginning of array
      saved.unshift(record);

      // Keep only latest MAX_SAVED
      if (saved.length > MAX_SAVED) {
        saved.pop();
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
      return true;
    } catch (e) {
      console.error('Error saving evaluation:', e);
      return false;
    }
  }

  /**
   * Get all saved evaluations
   */
  function getAllEvaluations() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error loading evaluations:', err);
      return [];
    }
  }

  /**
   * Get evaluation by ID
   */
  function getEvaluation(id) {
    return getAllEvaluations().find(record => record.id === id);
  }

  /**
   * Delete evaluation
   */
  function deleteEvaluation(id) {
    try {
      const saved = getAllEvaluations();
      const filtered = saved.filter(record => record.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (err) {
      console.error('Error deleting evaluation:', err);
      return false;
    }
  }

  /**
   * Clear all evaluations
   */
  function clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      console.error('Error clearing evaluations:', e);
      return false;
    }
  }

  /**
   * Generate unique ID
   */
  function generateId() {
    return 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Create saved evaluations UI
   */
  function createHistoryPanel() {
    const evaluations = getAllEvaluations();

    if (evaluations.length === 0) {
      return `
        <div class="history-empty">
          <p>No saved evaluations yet</p>
          <p style="font-size: 12px; color: var(--text-muted);">
            Evaluations are automatically saved when you calculate a score
          </p>
        </div>
      `;
    }

    const html = evaluations
      .map(item => `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-header">
            <strong>${item.brandName}</strong>
            <span class="history-item-market">${item.market}</span>
          </div>
          <div class="history-item-body">
            <div class="history-score">
              Score: <strong>${item.score}/100</strong>
              <span class="history-interpretation">${item.interpretation}</span>
            </div>
            <div class="history-date">
              ${new Date(item.timestamp).toLocaleDateString()}
            </div>
          </div>
          <div class="history-item-actions">
            <button class="history-btn load-eval" data-url="${item.url}">Load</button>
            <button class="history-btn delete-eval" data-id="${item.id}">Delete</button>
          </div>
        </div>
      `)
      .join('');

    return html;
  }

  /**
   * Show history modal
   */
  function showHistoryModal() {
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
      <div class="history-modal-overlay"></div>
      <div class="history-modal-content">
        <div class="history-modal-header">
          <h2>Evaluation History</h2>
          <button class="history-modal-close">×</button>
        </div>
        <div class="history-modal-body">
          ${createHistoryPanel()}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('.history-modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.history-modal-overlay').addEventListener('click', () => modal.remove());

    // Load handlers
    modal.querySelectorAll('.load-eval').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = btn.dataset.url;
        modal.remove();
      });
    });

    // Delete handlers
    modal.querySelectorAll('.delete-eval').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        deleteEvaluation(id);
        btn.closest('.history-item').remove();

        // Refresh panel
        const body = modal.querySelector('.history-modal-body');
        body.innerHTML = createHistoryPanel();

        // Re-attach event listeners
        reattachHistoryHandlers(modal);
      });
    });
  }

  /**
   * Re-attach event listeners after DOM update
   */
  function reattachHistoryHandlers(modal) {
    modal.querySelectorAll('.load-eval').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = btn.dataset.url;
        modal.remove();
      });
    });

    modal.querySelectorAll('.delete-eval').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        deleteEvaluation(id);
        btn.closest('.history-item').remove();
      });
    });
  }

  // Public API
  return {
    saveEvaluation,
    getAllEvaluations,
    getEvaluation,
    deleteEvaluation,
    clearAll,
    createHistoryPanel,
    showHistoryModal
  };
})();
