/**
 * ==========================================================================
 * Dark Academia: The Gothic Canon — Interactive Learning Engine
 * Clean, student-friendly scoring, interactive tap-to-build word tiles,
 * instant feedback, hints, and forgiving 2-try KWT checking
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
    this.injectHelperStyles();
    this.renderSortTask();
    this.renderStyleShiftDrills();
    this.initKWTScaffolds();
    this.bindKeyboardEvents();
    this.initCapstoneAudit();
    this.renderCompletionBanner();
    this.updateScoreDisplay();

    window.resetAll = () => this.resetAll();
  }

  /**
   * Injects mobile-friendly styling for interactive KWT Word Tiles & Hint Bar
   */
  injectHelperStyles() {
    if (document.getElementById('da-kwt-helper-styles')) return;
    const style = document.createElement('style');
    style.id = 'da-kwt-helper-styles';
    style.textContent = `
      .kwt-helper-wrap {
        margin-top: 0.75rem;
        padding-top: 0.7rem;
        border-top: 1px dashed rgba(255, 255, 255, 0.12);
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .kwt-helper-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      .kwt-helper-label {
        font-size: 0.78rem;
        color: #94a3b8;
        font-weight: 500;
      }
      .kwt-helper-actions {
        display: flex;
        gap: 0.45rem;
      }
      .kwt-mini-btn {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.16);
        color: #e2e8f0;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
        font-size: 0.76rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s ease;
      }
      .kwt-mini-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.14);
        border-color: rgba(255, 255, 255, 0.3);
      }
      .kwt-mini-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .kwt-tiles-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.42rem;
      }
      .kwt-word-tile {
        background: #1e293b;
        border: 1px solid #475569;
        color: #f8fafc;
        padding: 0.35rem 0.72rem;
        border-radius: 999px;
        font-size: 0.86rem;
        font-weight: 600;
        cursor: pointer;
        user-select: none;
        transition: transform 0.12s ease, background 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
      }
      .kwt-word-tile:hover:not(:disabled) {
        background: #334155;
        border-color: #94a3b8;
        transform: translateY(-1px);
      }
      .kwt-word-tile.used {
        opacity: 0.35;
        background: #0f172a;
        border-style: dashed;
        text-decoration: line-through;
      }
      .kwt-word-tile:disabled {
        cursor: not-allowed;
      }
      .kwt-hint-box {
        display: none;
        font-size: 0.84rem;
        color: #fde68a;
        background: rgba(245, 158, 11, 0.12);
        border-left: 3px solid #f59e0b;
        padding: 0.5rem 0.75rem;
        border-radius: 4px;
      }
      .kwt-hint-box.visible {
        display: block;
      }
      @media print {
        .kwt-helper-wrap { display: none !important; }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Automatically attaches tap-to-build word tiles, Hint button, and Clear button
   * to every .kwt-card across all 12 lessons so mobile & desktop users never get stuck.
   */
  initKWTScaffolds() {
    const cards = document.querySelectorAll('.kwt-card');
    cards.forEach((card, cIdx) => {
      if (card.querySelector('.kwt-helper-wrap')) return;

      const checkBtn = card.querySelector('.btn-main');
      const input = card.querySelector('.kwt-input');
      const inputRow = card.querySelector('.kwt-input-row');
      if (!checkBtn || !input || !inputRow) return;

      const onclickAttr = checkBtn.getAttribute('onclick') || '';
      const match = onclickAttr.match(/handleKWT\(\s*this\s*,\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'/);
      if (!match) return;

      const modelAnswer = match[1].replace(/\\'/g, "'").trim();
      const explanation = match[2].replace(/\\'/g, "'").trim();
      card.dataset.modelAnswer = modelAnswer;
      card.dataset.explanation = explanation;
      card.dataset.attempts = '0';

      const modelWords = modelAnswer.split(/\s+/);
      const distractorPool = ['being', 'has', 'did', 'for', 'having', 'were', 'which', 'by'];
      const modelLower = modelWords.map((w) => w.toLowerCase());
      const distractor = distractorPool.find((d) => !modelLower.includes(d)) || 'being';

      const tileItems = [
        ...modelWords.map((w, i) => ({ word: w, id: `m-${cIdx}-${i}` })),
        { word: distractor, id: `d-${cIdx}` }
      ];

      // Deterministic shuffle so each card looks natural
      for (let i = tileItems.length - 1; i > 0; i--) {
        const j = (i * 7 + cIdx * 3) % (i + 1);
        const temp = tileItems[i];
        tileItems[i] = tileItems[j];
        tileItems[j] = temp;
      }

      const helperWrap = document.createElement('div');
      helperWrap.className = 'kwt-helper-wrap';

      const firstTwo = modelWords.slice(0, 2).join(' ');
      helperWrap.innerHTML = `
        <div class="kwt-helper-top">
          <span class="kwt-helper-label">Tap words to build your answer (or type directly): <strong style="color:#cbd5e1;">${modelWords.length} words needed</strong> (+1 extra decoy word)</span>
          <div class="kwt-helper-actions">
            <button type="button" class="kwt-mini-btn kwt-hint-btn">💡 Hint</button>
            <button type="button" class="kwt-mini-btn kwt-clear-btn">↺ Clear</button>
          </div>
        </div>
        <div class="kwt-tiles-row"></div>
        <div class="kwt-hint-box">
          <strong>💡 Hint (${modelWords.length} words):</strong> Start with <em>"${firstTwo}..."</em> — ${explanation}
        </div>
      `;

      const tilesRow = helperWrap.querySelector('.kwt-tiles-row');
      tileItems.forEach((item) => {
        const tileBtn = document.createElement('button');
        tileBtn.type = 'button';
        tileBtn.className = 'kwt-word-tile';
        tileBtn.textContent = item.word;
        tileBtn.dataset.word = item.word;

        tileBtn.addEventListener('click', () => {
          if (card.dataset.answered === 'true') return;
          if (tileBtn.classList.contains('used')) {
            // Remove one instance of this word from the input
            tileBtn.classList.remove('used');
            const currentWords = input.value.trim() ? input.value.trim().split(/\s+/) : [];
            const removeIdx = currentWords.lastIndexOf(item.word);
            if (removeIdx !== -1) {
              currentWords.splice(removeIdx, 1);
              input.value = currentWords.join(' ');
            }
          } else {
            tileBtn.classList.add('used');
            const curr = input.value.trim();
            input.value = curr ? `${curr} ${item.word}` : item.word;
          }
        });

        tilesRow.appendChild(tileBtn);
      });

      // Sync tile highlights if user types manually
      input.addEventListener('input', () => {
        const typedWords = input.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
        const remaining = [...typedWords];
        tilesRow.querySelectorAll('.kwt-word-tile').forEach((tile) => {
          const wLow = (tile.dataset.word || '').toLowerCase();
          const idx = remaining.indexOf(wLow);
          if (idx !== -1) {
            tile.classList.add('used');
            remaining.splice(idx, 1);
          } else {
            tile.classList.remove('used');
          }
        });
      });

      const hintBtn = helperWrap.querySelector('.kwt-hint-btn');
      const clearBtn = helperWrap.querySelector('.kwt-clear-btn');
      const hintBox = helperWrap.querySelector('.kwt-hint-box');

      hintBtn.addEventListener('click', () => {
        hintBox.classList.toggle('visible');
      });

      clearBtn.addEventListener('click', () => {
        if (card.dataset.answered === 'true') return;
        input.value = '';
        tilesRow.querySelectorAll('.kwt-word-tile').forEach((t) => t.classList.remove('used'));
        input.focus();
      });

      inputRow.insertAdjacentElement('afterend', helperWrap);
    });
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
   * Includes a forgiving 1st-attempt hint before locking on the 2nd attempt.
   */
  normalizeText(str) {
    return str
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "'")
      .replace(/[.,!?;:]+$/g, '')
      .replace(/\s+/g, ' ');
  }

  lockKWTCard(card, input, btn) {
    card.dataset.answered = 'true';
    if (input) input.disabled = true;
    if (btn) btn.disabled = true;
    card.querySelectorAll('.kwt-word-tile, .kwt-mini-btn').forEach((b) => {
      b.disabled = true;
    });
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
        fb.innerHTML = `<strong>⚠️ Tap the word tiles below or type your answer before checking.</strong>`;
      }
      if (input) input.focus();
      return;
    }

    const validList = (card.getAttribute('data-valid') || '')
      .split('|')
      .map((s) => this.normalizeText(s))
      .filter(Boolean);

    const isExactMatch = validList.includes(userNorm);

    let isPartialMatch = false;
    const keyPill = card.querySelector('.kwt-key');
    const keyWord = keyPill ? this.normalizeText(keyPill.textContent) : '';
    const modelWords = modelAnswer.trim().split(/\s+/);

    if (!isExactMatch && keyWord && userNorm.includes(keyWord)) {
      const normModelWords = this.normalizeText(modelAnswer).split(' ');
      const userWords = userNorm.split(' ');
      const overlap = userWords.filter((w) => normModelWords.includes(w)).length;
      if (overlap >= Math.ceil(normModelWords.length * 0.65) && userWords.length >= 3 && userWords.length <= 8) {
        isPartialMatch = true;
      }
    }

    const attempts = parseInt(card.dataset.attempts || '0', 10) + 1;
    card.dataset.attempts = String(attempts);

    if (isExactMatch) {
      this.lockKWTCard(card, input, btn);
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
      return;
    }

    // First wrong/partial attempt: give a gentle hint and let the learner adjust!
    if (attempts === 1) {
      const firstTwo = modelWords.slice(0, 2).join(' ');
      if (input) {
        input.style.borderColor = 'var(--amber)';
      }
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Almost there! Try once more:</strong> Start with <strong>"${firstTwo}..."</strong> (${modelWords.length} words total). Tap the word tiles or adjust your answer and click <strong>Check</strong> again!`;
      }
      return;
    }

    // Second attempt: lock and award partial or show model answer
    this.lockKWTCard(card, input, btn);

    if (isPartialMatch) {
      if (input) {
        input.style.borderColor = 'var(--amber)';
        input.style.color = '#fde68a';
      }
      this.score += 1;
      this.updateScoreDisplay();
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Partial Credit (+1/2):</strong> Good effort using the key word! Full answer: <strong>"${modelAnswer}"</strong>.<br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
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
      card.dataset.attempts = '0';
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
      card.querySelectorAll('.kwt-word-tile, .kwt-mini-btn').forEach((b) => {
        b.disabled = false;
        b.classList.remove('used');
      });
      const hintBox = card.querySelector('.kwt-hint-box');
      if (hintBox) hintBox.classList.remove('visible');
    });
  }
}

window.DarkAcademiaEngine = DarkAcademiaEngine;
