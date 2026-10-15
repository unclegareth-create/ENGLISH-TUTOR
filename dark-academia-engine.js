/**
 * Dark Academia: The Gothic Canon — Master Interactive Interaction Engine
 * Handles:
 * - 2-mark Cambridge KWT scoring with multi-variant validation
 * - ARIA live announcements for screen readers
 * - Explanatory feedback for every question (why correct / why incorrect)
 * - LocalStorage persistence and reset
 * - Icon-reinforced non-color-reliant feedback (WCAG AA/AAA)
 */

class DarkAcademiaEngine {
  constructor(config) {
    this.unitId = config.unitId || 'generic_unit';
    this.totalMarks = config.totalMarks || 17; // 4 Sort (1 ea) + 3 MCQ (1 ea) + 5 KWT (2 ea)
    this.currentScore = 0;
    this.completedItems = new Set();
    this.storageKey = `dark_academia_${this.unitId}`;

    this.initAriaLive();
    this.initSortTasks(config.sortItems || []);
    this.initMCQs();
    this.initKWTs();
    this.initScoreBox();
    this.restoreProgress();
  }

  // 1. Accessibility: Screen Reader Live Region
  initAriaLive() {
    let liveRegion = document.getElementById('aria-live-status');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'aria-live-status';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.margin = '-1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';
      document.body.appendChild(liveRegion);
    }
    this.liveRegion = liveRegion;
  }

  announce(message) {
    if (this.liveRegion) {
      this.liveRegion.textContent = '';
      setTimeout(() => {
        this.liveRegion.textContent = message;
      }, 50);
    }
  }

  // 2. Score Management
  initScoreBox() {
    this.scoreDisplay = document.getElementById('score-display');
    this.updateScoreDisplay();
  }

  addMarks(itemId, marks) {
    if (!this.completedItems.has(itemId)) {
      this.completedItems.add(itemId);
      this.currentScore += marks;
      this.updateScoreDisplay();
      this.saveProgress();
    }
  }

  updateScoreDisplay() {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = `${this.currentScore} / ${this.totalMarks}`;
      this.scoreDisplay.setAttribute('aria-label', `Masterclass score: ${this.currentScore} out of ${this.totalMarks} marks`);
    }
  }

  // 3. Section 1: Lexicon Sort Tasks
  initSortTasks(sortItems) {
    const container = document.getElementById('sorting-container');
    if (!container || !sortItems.length) return;

    container.innerHTML = sortItems.map((item, idx) => {
      const itemId = `sort_${idx}`;
      return `
        <div class="sort-row" id="${itemId}" data-item-id="${itemId}" data-type="${item.type}">
          <div class="sort-word">
            ${idx + 1}. ${item.word}
            <small>${item.sub}</small>
          </div>
          <div class="sort-actions">
            <button class="btn-sort" onclick="darkEngine.handleSort(this, 'arsenal', '${item.type}', '${encodeURIComponent(item.exp)}')">
              Active Arsenal (C1/C2)
            </button>
            <button class="btn-sort" onclick="darkEngine.handleSort(this, 'museum', '${item.type}', '${encodeURIComponent(item.exp)}')">
              Museum Word (Historical)
            </button>
          </div>
          <div class="sort-explanation feedback-box" id="${itemId}_exp"></div>
        </div>
      `;
    }).join('');
  }

  handleSort(btn, chosen, actual, encodedExp) {
    const parentRow = btn.closest('.sort-row');
    const itemId = parentRow.getAttribute('data-item-id');
    const expBox = parentRow.querySelector('.sort-explanation');
    const allBtns = parentRow.querySelectorAll('button');
    const explanation = decodeURIComponent(encodedExp);

    allBtns.forEach(b => b.disabled = true);

    if (chosen === actual) {
      btn.classList.add('correct');
      btn.innerHTML = `✓ ${btn.textContent.trim()}`;
      expBox.style.background = 'rgba(16, 185, 129, 0.18)';
      expBox.style.color = '#86efac';
      expBox.innerHTML = `<strong>✓ Correct! (+1 Mark)</strong> ${explanation}`;
      this.addMarks(itemId, 1);
      this.announce(`Correct! You earned 1 mark. ${explanation}`);
    } else {
      btn.classList.add('wrong');
      btn.innerHTML = `✗ ${btn.textContent.trim()}`;
      const correctBtn = chosen === 'arsenal' ? allBtns[1] : allBtns[0];
      correctBtn.classList.add('correct');
      correctBtn.innerHTML = `✓ ${correctBtn.textContent.trim()}`;
      expBox.style.background = 'rgba(239, 68, 68, 0.18)';
      expBox.style.color = '#fca5a5';
      expBox.innerHTML = `<strong>✗ Distinct Category:</strong> ${explanation}`;
      this.completedItems.add(itemId); // Marked completed with 0 marks
      this.saveProgress();
      this.announce(`Incorrect. ${explanation}`);
    }
    expBox.style.display = 'block';
  }

  // 4. Section 2: Diagnostic MCQs with Pedagogical Feedback
  initMCQs() {
    const blocks = document.querySelectorAll('.mc-block');
    blocks.forEach((block, idx) => {
      block.setAttribute('data-mc-id', `mc_${idx}`);
    });
  }

  handleMC(btn, chosenIdx, encodedMsg) {
    const block = btn.closest('.mc-block');
    const itemId = block.getAttribute('data-mc-id');
    const correctIdx = parseInt(block.getAttribute('data-correct'), 10);
    const allBtns = block.querySelectorAll('.mc-btn');
    const fb = block.querySelector('.feedback-box');
    const msg = decodeURIComponent(encodedMsg);

    allBtns.forEach(b => b.disabled = true);

    if (chosenIdx === correctIdx) {
      btn.classList.add('correct');
      btn.innerHTML = `✓ ${btn.innerHTML}`;
      fb.style.background = 'rgba(16, 185, 129, 0.2)';
      fb.style.color = '#86efac';
      fb.innerHTML = `<strong>✓ Spot On (+1 Mark):</strong> ${msg}`;
      this.addMarks(itemId, 1);
      this.announce(`Correct! 1 mark awarded. ${msg}`);
    } else {
      btn.classList.add('wrong');
      btn.innerHTML = `✗ ${btn.innerHTML}`;
      allBtns[correctIdx].classList.add('correct');
      allBtns[correctIdx].innerHTML = `✓ ${allBtns[correctIdx].innerHTML}`;
      fb.style.background = 'rgba(239, 68, 68, 0.2)';
      fb.style.color = '#fca5a5';
      fb.innerHTML = `<strong>✗ Grammatical Revision:</strong> ${msg}`;
      this.completedItems.add(itemId);
      this.saveProgress();
      this.announce(`Incorrect. ${msg}`);
    }
    fb.style.display = 'block';
  }

  // 5. Section 3: Cambridge Key Word Transformations (2 Marks Each)
  initKWTs() {
    const cards = document.querySelectorAll('.kwt-card');
    cards.forEach((card, idx) => {
      card.setAttribute('data-kwt-id', `kwt_${idx}`);
      const input = card.querySelector('.kwt-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const btn = card.querySelector('.btn-main');
            if (btn && !btn.disabled) btn.click();
          }
        });
      }
    });
  }

  handleKWT(btn, modelAns, explanation) {
    const card = btn.closest('.kwt-card');
    const itemId = card.getAttribute('data-kwt-id');
    const input = card.querySelector('.kwt-input');
    const fb = card.querySelector('.feedback-box');
    const valid = card.getAttribute('data-valid').toLowerCase().split('|');
    
    // Normalize user response: trim, lowercase, collapse whitespace, strip trailing periods
    const rawVal = input.value.trim().toLowerCase().replace(/[.,!?;]+$/, '').replace(/\s+/g, ' ');

    if (!rawVal) {
      input.focus();
      return;
    }

    // Word count check (C1/C2: between 3 and 8 words)
    const wordCount = rawVal.split(' ').length;

    input.disabled = true;
    btn.disabled = true;

    const isFullMatch = valid.some(v => v.trim() === rawVal);

    if (isFullMatch) {
      input.style.borderColor = '#10b981';
      fb.style.background = 'rgba(16, 185, 129, 0.2)';
      fb.style.color = '#86efac';
      fb.innerHTML = `
        <strong>✓ Full 2 Marks!</strong><br>
        • Target Structure: <em>"${modelAns}"</em><br>
        • <strong>Grammar Analysis:</strong> ${explanation}
      `;
      this.addMarks(itemId, 2); // Exact 2-mark Cambridge award
      this.announce(`Full 2 marks awarded! Target structure: ${modelAns}. ${explanation}`);
    } else {
      input.style.borderColor = '#ef4444';
      fb.style.background = 'rgba(239, 68, 68, 0.2)';
      fb.style.color = '#fca5a5';
      
      let countWarning = '';
      if (wordCount < 3 || wordCount > 8) {
        countWarning = `<div style="margin-top:0.35rem; color:#fde68a;">⚠️ Word count penalty: You wrote ${wordCount} words. Cambridge requires strictly between 3 and 8 words.</div>`;
      }

      fb.innerHTML = `
        <strong>✗ Needs Revision (0 / 2 Marks):</strong><br>
        • Expected Cambridge Form: <em>"${modelAns}"</em><br>
        • <strong>Key Breakdown:</strong> ${explanation}
        ${countWarning}
      `;
      this.completedItems.add(itemId);
      this.saveProgress();
      this.announce(`Incorrect. Expected structure was: ${modelAns}. ${explanation}`);
    }
    fb.style.display = 'block';
  }

  // 6. Persistence: LocalStorage Auto-Save & Restore
  saveProgress() {
    try {
      const data = {
        score: this.currentScore,
        completed: Array.from(this.completedItems),
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Also update master course tracker
      const masterData = JSON.parse(localStorage.getItem('dark_academia_master') || '{}');
      masterData[this.unitId] = { score: this.currentScore, total: this.totalMarks };
      localStorage.setItem('dark_academia_master', JSON.stringify(masterData));
    } catch (e) {
      // LocalStorage not available or quota exceeded
    }
  }

  restoreProgress() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data && typeof data.score === 'number') {
        this.currentScore = data.score;
        this.completedItems = new Set(data.completed || []);
        this.updateScoreDisplay();
      }
    } catch (e) {}
  }

  resetProgress() {
    try {
      localStorage.removeItem(this.storageKey);
      const masterData = JSON.parse(localStorage.getItem('dark_academia_master') || '{}');
      delete masterData[this.unitId];
      localStorage.setItem('dark_academia_master', JSON.stringify(masterData));
    } catch (e) {}
    window.location.reload();
  }
}

// Global reset helper
function resetAll() {
  if (window.darkEngine) {
    window.darkEngine.resetProgress();
  } else {
    window.location.reload();
  }
}
