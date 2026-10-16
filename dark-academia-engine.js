/**
 * ==========================================================================
 * Dark Academia: The Gothic Canon — Interactive Learning Engine
 * Clean, student-friendly scoring, instant feedback, and keyboard support
 * ==========================================================================
 */

const DarkAcademiaGate = {
  STORAGE_KEY: 'da_canon_unlocked',

  isUnlocked() {
    return true;
  },

  isUnitGated() {
    return false;
  },

  openModal() {},
  closeModal() {},
  enforceGate() {}
};

window.DarkAcademiaGate = DarkAcademiaGate;

class DarkAcademiaEngine {
  constructor(config) {
    this.unitId = config.unitId || 'gothic_unit';
    this.totalMarks = config.totalMarks || 20;
    this.sortItems = config.sortItems || [];
    this.styleShiftItems = config.styleShiftItems || [];
    this.capstoneConfig = config.capstoneConfig || null;
    this.score = 0;

    this.init();
  }

  init() {
    this.renderSortTask();
    this.renderStyleShiftDrills();
    this.bindKeyboardEvents();
    this.initCapstoneAudit();
    this.renderCompletionBanner();
    this.updateScoreDisplay();

    window.resetAll = () => this.resetAll();
  }

  /**
   * Updates the score display in the header and checks for completion
   */
  updateScoreDisplay() {
    const el = document.getElementById('score-display');
    if (!el) return;

    el.textContent = `${this.score} / ${this.totalMarks}`;

    if (this.score >= Math.ceil(this.totalMarks * 0.8)) {
      el.style.color = '#4ade80'; // Green for 80%+
    } else if (this.score >= Math.ceil(this.totalMarks * 0.5)) {
      el.style.color = '#fbbf24'; // Amber for 50%+
    } else {
      el.style.color = ''; // Default theme accent
    }

    this.saveProgress();
    this.updateCompletionBanner();
  }

  /**
   * Renders the completion banner at the bottom of the unit
   */
  renderCompletionBanner() {
    const container = document.getElementById('dynamic-completion-card');
    if (!container) return;

    container.className = 'da-completion-card';
    this.updateCompletionBanner();
  }

  updateCompletionBanner() {
    const container = document.getElementById('dynamic-completion-card');
    if (!container) return;

    const pct = Math.round((this.score / this.totalMarks) * 100);

    container.innerHTML = `
      <div class="da-completion-flex">
        <div>
          <span class="da-completion-eyebrow">Lesson Progress • ${this.score} / ${this.totalMarks} Marks (${pct}%)</span>
          <h3>Want to review all 12 lessons side by side?</h3>
          <p>Open the printable <strong>Course Study Guide</strong> for a clean summary of every grammar pattern, key vocabulary item, and answer key, or return to the course hub to choose another story.</p>
        </div>
        <div class="da-completion-actions">
          <a href="the-gothic-canon-c1-c2-compendium.html" class="da-btn-gold">📖 Open Study Guide</a>
          <a href="dark-academia-index.html" class="da-btn-outline">← Back to Course Hub</a>
        </div>
      </div>
    `;
  }

  /**
   * Task 1: Renders the 4-item Vocabulary Filter
   */
  renderSortTask() {
    const container = document.getElementById('sorting-container');
    if (!container || !this.sortItems.length) return;

    container.innerHTML = '';

    this.sortItems.forEach((item, index) => {
      const row = document.createElement('div');
      row.className = 'sort-row';
      row.id = `sort-row-${index}`;

      row.innerHTML = `
        <div class="sort-word">
          ${item.word}
          <span>${item.sub}</span>
        </div>
        <div class="sort-controls" role="group" aria-label="Classify ${item.word}">
          <button type="button" class="btn-sort" data-choice="arsenal" aria-label="Mark ${item.word} as a Modern C1/C2 Word">
            ✓ Modern C1/C2 Word
          </button>
          <button type="button" class="btn-sort" data-choice="museum" aria-label="Mark ${item.word} as an Old-Fashioned Word">
            🏛 Old-Fashioned Word
          </button>
        </div>
        <div class="sort-feedback" id="sort-fb-${index}" aria-live="polite"></div>
      `;

      const buttons = row.querySelectorAll('.btn-sort');
      buttons.forEach((btn) => {
        btn.addEventListener('click', () => {
          this.handleSort(index, btn.getAttribute('data-choice'), btn);
        });
      });

      container.appendChild(row);
    });
  }

  handleSort(index, choice, btnElement) {
    const row = document.getElementById(`sort-row-${index}`);
    if (!row || row.dataset.answered === 'true') return;
    row.dataset.answered = 'true';

    const item = this.sortItems[index];
    const buttons = row.querySelectorAll('.btn-sort');
    const fb = document.getElementById(`sort-fb-${index}`);

    buttons.forEach((b) => (b.disabled = true));

    if (choice === item.type) {
      btnElement.classList.add('correct');
      this.score += 1;
      this.updateScoreDisplay();
      if (fb) {
        fb.textContent = `✓ Correct! ${item.exp}`;
        fb.style.color = 'var(--green-text)';
      }
    } else {
      btnElement.classList.add('wrong');
      if (fb) {
        fb.textContent = `✗ Not quite. ${item.exp}`;
        fb.style.color = 'var(--red-text)';
      }
    }
  }

  /**
   * Section 2: Multiple Choice Grammar Questions
   */
  handleMC(btn, optionIndex, explanation) {
    const block = btn.closest('.mc-block');
    if (!block || block.dataset.answered === 'true') return;
    block.dataset.answered = 'true';

    const correctIndex = parseInt(block.getAttribute('data-correct'), 10);
    const buttons = block.querySelectorAll('.mc-btn');
    const fb = block.querySelector('.feedback-box');

    buttons.forEach((b) => (b.disabled = true));

    if (optionIndex === correctIndex) {
      btn.classList.add('correct');
      this.score += 1;
      this.updateScoreDisplay();
      if (fb) {
        fb.className = 'feedback-box correct';
        fb.innerHTML = `<strong>✓ Correct (+1 Mark):</strong> ${explanation}`;
      }
    } else {
      btn.classList.add('wrong');
      if (buttons[correctIndex]) {
        buttons[correctIndex].classList.add('correct');
      }
      if (fb) {
        fb.className = 'feedback-box wrong';
        fb.innerHTML = `<strong>✗ Key Point:</strong> ${explanation}`;
      }
    }
  }

  /**
   * Section 4: Modern Exam Writing Practice (3 Marks)
   */
  renderStyleShiftDrills() {
    const container = document.getElementById('style-shift-drills');
    if (!container || !this.styleShiftItems.length) return;

    container.innerHTML = '';

    this.styleShiftItems.forEach((item, idx) => {
      const qNum = 13 + idx;
      const block = document.createElement('div');
      block.className = 'mc-block';
      block.setAttribute('data-correct', item.correctIdx);

      const optionsHtml = item.options
        .map(
          (opt, oIdx) => `
        <button type="button" class="mc-btn" data-opt-idx="${oIdx}">
          ${String.fromCharCode(65 + oIdx)}) ${opt}
        </button>
      `
        )
        .join('');

      block.innerHTML = `
        <div class="mc-prompt">${qNum}. ${item.prompt}</div>
        <div class="mc-options">
          ${optionsHtml}
        </div>
        <div class="feedback-box" aria-live="polite"></div>
      `;

      const btns = block.querySelectorAll('.mc-btn');
      btns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const selectedIdx = parseInt(btn.getAttribute('data-opt-idx'), 10);
          this.handleMC(btn, selectedIdx, item.exp);
        });
      });

      container.appendChild(block);
    });
  }

  /**
   * Section 3: Cambridge Part 4 Key Word Transformations (2 Marks Each)
   */
  normalizeText(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "'")
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ');
  }

  handleKWT(btn, modelAnswer, explanation) {
    const card = btn.closest('.kwt-card');
    if (!card || card.dataset.answered === 'true') return;

    const input = card.querySelector('.kwt-input');
    const fb = card.querySelector('.feedback-box');
    const rawUser = input ? input.value : '';
    const userNorm = this.normalizeText(rawUser);

    if (!userNorm) {
      if (fb) {
        fb.className = 'feedback-box wrong';
        fb.innerHTML = `<strong>⚠️ Please type your transformation before checking.</strong>`;
      }
      if (input) input.focus();
      return;
    }

    card.dataset.answered = 'true';
    if (input) input.disabled = true;
    btn.disabled = true;

    const validList = (card.getAttribute('data-valid') || '')
      .split('|')
      .map((s) => this.normalizeText(s))
      .filter(Boolean);

    const isExactMatch = validList.includes(userNorm);

    let isPartialMatch = false;
    const keyPill = card.querySelector('.kwt-key');
    const keyWord = keyPill ? this.normalizeText(keyPill.textContent) : '';

    if (!isExactMatch && keyWord && userNorm.includes(keyWord)) {
      const modelWords = this.normalizeText(modelAnswer).split(' ');
      const userWords = userNorm.split(' ');
      const overlap = userWords.filter((w) => modelWords.includes(w)).length;
      if (overlap >= Math.ceil(modelWords.length * 0.65) && userWords.length >= 3 && userWords.length <= 8) {
        isPartialMatch = true;
      }
    }

    if (isExactMatch) {
      if (input) {
        input.style.borderColor = 'var(--green)';
        input.style.color = 'var(--green-text)';
      }
      this.score += 2;
      this.updateScoreDisplay();
      if (fb) {
        fb.className = 'feedback-box correct';
        fb.innerHTML = `<strong>✓ Full Marks (+2/2):</strong> Excellent! <em>"${modelAnswer}"</em> — ${explanation}`;
      }
    } else if (isPartialMatch) {
      if (input) {
        input.style.borderColor = 'var(--amber)';
        input.style.color = '#fde68a';
      }
      this.score += 1;
      this.updateScoreDisplay();
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Partial Credit (+1/2):</strong> You used the right key word and idea! Full model answer: <strong>"${modelAnswer}"</strong>.<br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
      }
    } else {
      if (input) {
        input.style.borderColor = 'var(--red)';
        input.style.color = 'var(--red-text)';
      }
      if (fb) {
        fb.className = 'feedback-box wrong';
        fb.innerHTML = `<strong>✗ Model Answer:</strong> <strong>"${modelAnswer}"</strong><br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
      }
    }
  }

  /**
   * Keyboard support: Enter submits KWT input
   */
  bindKeyboardEvents() {
    const inputs = document.querySelectorAll('.kwt-input');
    inputs.forEach((input) => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const card = input.closest('.kwt-card');
          const btn = card ? card.querySelector('.btn-main') : null;
          if (btn && !btn.disabled) {
            btn.click();
          }
        }
      });
    });
  }

  /**
   * Section 5 (Unit 3s): Optional Writing Sandbox & Live Checklist
   */
  initCapstoneAudit() {
    const textarea = document.getElementById('capstone-input');
    if (!textarea) return;

    const wordCounter = document.getElementById('capstone-word-counter');
    const checkInversion = document.getElementById('audit-inversion');
    const checkParticiple = document.getElementById('audit-participle');
    const checkArsenal = document.getElementById('audit-arsenal');

    const defaultInversionRegex = /(scarcely\s+had|hardly\s+had|no\s+sooner\s+had|under\s+no\s+circumstances|little\s+did|seldom\s+had|rarely\s+did|nowhere\s+could|nowhere\s+was|not\s+only\s+did|only\s+after|not\s+until|never\s+before\s+had|never\s+had|had\s+he\s+not|had\s+i\s+not|had\s+victor|had\s+holmes|had\s+we|were\s+he\s+to|were\s+it\s+not|much\s+as|so\s+[a-z]+\s+was|what\s+[a-z]+\s+most\s+was|it\s+was\s+only)/i;
    const defaultParticipleRegex = /(having\s+[a-z]+ed|having\s+been|hemmed\s+in|shrouded\s+in|driven\s+by|deprived\s+of|ostracised\s+by|compounded\s+by|confronted\s+with|confronted\s+by|grounded\s+upon|lashed\s+to|What\s+struck|What\s+drove|What\s+exposed|It\s+was\s+the|beyond\s+the|out\s+of\s+the)/i;
    const defaultArsenalList = [
      'apprehensive', 'impenetrable', 'hemmed', 'sinister', 'formidable', 'trepidation',
      'unaccountably', 'derelict', 'disclose', 'disclosed', 'catastrophe', 'convulsive',
      'unquenchable', 'delineate', 'abhorrence', 'inexorable', 'insolent', 'malevolence',
      'benevolence', 'ostracise', 'ostracised', 'repudiate', 'repudiation', 'juggernaut',
      'detestable', 'callous', 'audacity', 'duplicity', 'facade', 'repugnance', 'cerebral',
      'incongruous', 'depravity', 'abominable', 'imperious', 'extricate', 'pernicious',
      'plausible', 'circumstantial', 'calamity', 'treacherous', 'quagmire', 'melancholy',
      'desolate', 'corroborate', 'corroborated', 'fallacy', 'premeditated', 'audacious'
    ];

    const invRegex = (this.capstoneConfig && this.capstoneConfig.invRegex) || defaultInversionRegex;
    const partRegex = (this.capstoneConfig && this.capstoneConfig.partRegex) || defaultParticipleRegex;
    const arsenalWords = (this.capstoneConfig && this.capstoneConfig.arsenalWords) || defaultArsenalList;

    textarea.addEventListener('input', () => {
      const text = textarea.value.trim();
      const words = text ? text.split(/\s+/).length : 0;

      if (wordCounter) {
        wordCounter.textContent = `${words} Words`;
        if (words >= 150 && words <= 280) {
          wordCounter.className = 'word-counter-pill optimal';
        } else {
          wordCounter.className = 'word-counter-pill';
        }
      }

      if (checkInversion) {
        const hasInv = invRegex.test(text);
        this.toggleAuditItem(
          checkInversion,
          hasInv,
          hasInv ? '✓ Target grammar structure spotted!' : 'Try using one of the unit grammar structures.'
        );
      }

      if (checkParticiple) {
        const hasPart = partRegex.test(text);
        this.toggleAuditItem(
          checkParticiple,
          hasPart,
          hasPart ? '✓ Second target structure spotted!' : 'Try adding a participle opener or emphasis structure.'
        );
      }

      if (checkArsenal) {
        const lower = text.toLowerCase();
        const matched = arsenalWords.filter((w) => lower.includes(w));
        const uniqueMatched = [...new Set(matched)];
        const passed = uniqueMatched.length >= 2;
        this.toggleAuditItem(
          checkArsenal,
          passed,
          passed
            ? `✓ C1/C2 vocabulary used (${uniqueMatched.slice(0, 4).join(', ')})`
            : `C1/C2 words used: ${uniqueMatched.length}/2 (${uniqueMatched.join(', ') || 'none yet'})`
        );
      }
    });
  }

  toggleAuditItem(el, passed, message) {
    if (!el) return;
    const badge = el.querySelector('.audit-badge');
    const note = el.querySelector('.audit-note');
    if (passed) {
      el.classList.add('passed');
      if (badge) badge.textContent = '✓';
    } else {
      el.classList.remove('passed');
      if (badge) badge.textContent = '○';
    }
    if (note && message) {
      note.textContent = message;
    }
  }

  toggleModelAnswer() {
    const panel = document.getElementById('capstone-model-panel');
    if (!panel) return;
    panel.classList.toggle('active');
  }

  showCriterion(critIdx) {
    const tabs = document.querySelectorAll('.model-crit-btn');
    const highlights = document.querySelectorAll('.hl-annotated');
    const commentary = document.getElementById('criterion-commentary');

    tabs.forEach((t, i) => t.classList.toggle('active', i === critIdx));
    highlights.forEach((h) => {
      const c = parseInt(h.getAttribute('data-criterion'), 10);
      h.classList.toggle('active', c === critIdx);
    });

    if (commentary && this.capstoneConfig && this.capstoneConfig.rubrics) {
      commentary.innerHTML = this.capstoneConfig.rubrics[critIdx] || '';
    }
  }

  saveProgress() {
    try {
      localStorage.setItem(
        `da_progress_${this.unitId}`,
        JSON.stringify({
          score: this.score,
          total: this.totalMarks,
          updatedAt: new Date().toISOString()
        })
      );
    } catch (e) {
      // Ignore storage quota errors
    }
  }

  resetAll() {
    this.score = 0;
    this.updateScoreDisplay();

    this.renderSortTask();
    this.renderStyleShiftDrills();

    document.querySelectorAll('.card:not(:has(#style-shift-drills)) .mc-block').forEach((block) => {
      delete block.dataset.answered;
      block.querySelectorAll('.mc-btn').forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove('correct', 'wrong');
      });
      const fb = block.querySelector('.feedback-box');
      if (fb) {
        fb.className = 'feedback-box';
        fb.innerHTML = '';
      }
    });

    document.querySelectorAll('.kwt-card').forEach((card) => {
      delete card.dataset.answered;
      const input = card.querySelector('.kwt-input');
      const btn = card.querySelector('.btn-main');
      const fb = card.querySelector('.feedback-box');
      if (input) {
        input.value = '';
        input.disabled = false;
        input.style.borderColor = '';
        input.style.color = '';
      }
      if (btn) btn.disabled = false;
      if (fb) {
        fb.className = 'feedback-box';
        fb.innerHTML = '';
      }
    });
  }
}

window.DarkAcademiaEngine = DarkAcademiaEngine;
