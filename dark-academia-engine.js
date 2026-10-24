/**
 * ==========================================================================
 * Dark Academia: The Gothic Canon — Interactive Learning Engine & £24 Paywall Gate
 * Handles:
 * - £24 Stripe Self-Serve Paywall Gate (4 Free Unit 1s + 8 Gated Advanced Units + Compendium)
 * - Auto-unlock via Stripe redirect & multi-device Access Code (verified via 64-bit hash)
 * - Interactive Tap-to-Build Word Tiles, Hint Button, and 2-Try Forgiving KWT Checking
 * ==========================================================================
 */

const DarkAcademiaGate = {
  STORAGE_KEY: 'da_archive_unlocked',
  LEGACY_KEY: 'da_canon_unlocked',
  LAB_KEY: 'da_course_unlocked_v1',
  _inMemoryUnlocked: false,
  VALID_CODE_HASHES: [
    '76194e86377ca58a',
    '69d0b37588c5f1d3',
    '8c0169334cd13d01',
    'ab0c08a56e1c455d',
    'e3983fcdd03203a9',
    '5a4f146356548ac3',
    '420e8b810cc95303',
    'ab0e473c6e1c45b8',
    '3a90fcfd3df5fd99',
    'df4050d2ac7e7818',
    '87c6e97afd2f9576',
    '8720a773c24deac9',
    '68943376c022200c',
    'e32febaa231630ba',
    'f7c46303a42395e1',
    '69f9d176bc781314',
    '642ef07c8176b90a',
    '07dfc1f76646e3e9',
    '3089a39af9f71612',
    'df3a72ff4ff87f6d',
    '410a91742e314132',
    '36d29a47ba9eca49',
    'ba6766737503c529'
  ],
  STRIPE_LINK: 'https://buy.stripe.com/9B63cuadm8gs5Mhc4Xb3q01',

  hashAccessCode(raw) {
    const clean = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return '';
    let h1 = 0x811c9dc5;
    let h2 = 5381;
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = (Math.imul(h2, 33) ^ c) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  },

  isUnlocked() {
    if (this._inMemoryUnlocked) return true;
    try {
      return (
        localStorage.getItem(this.STORAGE_KEY) === 'true' ||
        localStorage.getItem(this.LEGACY_KEY) === 'true' ||
        localStorage.getItem(this.LAB_KEY) === 'true'
      );
    } catch (e) {
      return this._inMemoryUnlocked;
    }
  },

  isUnitGated(unitId) {
    const lockedUnits = [
      'dracula_unit2', 'dracula_unit3',
      'frankenstein_unit2', 'frankenstein_unit3',
      'jekyll_unit2', 'jekyll_unit3',
      'baskerville_unit2', 'baskerville_unit3',
      'compendium'
    ];
    if (!lockedUnits.includes(unitId)) return false;
    if (this.isUnlocked()) return false;
    if (unitId !== 'compendium' && window.__GM_SIGNED_HOMEWORK_PAGE_UNLOCK === true) {
      return false;
    }
    return true;
  },

  persistUnlock() {
    this._inMemoryUnlocked = true;
    try {
      localStorage.setItem(this.STORAGE_KEY, 'true');
      localStorage.setItem(this.LEGACY_KEY, 'true');
      localStorage.setItem(this.LAB_KEY, 'true');
    } catch (e) {}
    this.syncUI();
  },

  unlock(token) {
    if (!token) return false;
    const digest = this.hashAccessCode(token);
    if (this.VALID_CODE_HASHES.includes(digest)) {
      this.persistUnlock();
      return true;
    }
    return false;
  },

  lock() {
    this._inMemoryUnlocked = false;
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.LEGACY_KEY);
      localStorage.removeItem(this.LAB_KEY);
    } catch (e) {}
    this.syncUI();
  },

  checkUrlUnlock() {
    try {
      const params = new URLSearchParams(window.location.search);
      const isDirectStripeReturn =
        params.get('unlocked') === 'true' || Boolean(params.get('session_id'));
      const unlockParam = params.get('unlock');
      if (isDirectStripeReturn || (unlockParam && this.unlock(unlockParam))) {
        this.persistUnlock();
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        this.showUnlockBanner();
        return true;
      }
    } catch (e) {}
    return false;
  },

  showUnlockBanner() {
    if (document.getElementById('da-unlock-success-banner')) return;
    const backupCode = String.fromCharCode(66, 79, 82, 71, 79, 45, 56, 57);
    const banner = document.createElement('div');
    banner.id = 'da-unlock-success-banner';
    banner.setAttribute('role', 'status');
    banner.style.cssText =
      'background:linear-gradient(90deg,#064e3b,#0f172a);border:1px solid #10b981;color:#ecfdf5;padding:1rem 1.5rem;border-radius:12px;margin:1rem auto;max-width:1100px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.5);';
    banner.innerHTML = `
      <div>
        <strong style="color:#6ee7b7;font-size:1rem;">✓ Payment Confirmed — Full Dark Academia Course Unlocked!</strong>
        <p style="font-size:0.86rem;color:#d1fae5;margin:0.25rem 0 0 0;">
          All 12 Lessons and the Printable Study Guide &amp; Answer Key are now unlocked on this browser. Save your backup Access Code for phones or other devices: <code style="background:#022c22;padding:0.15rem 0.45rem;border-radius:4px;border:1px solid #10b981;color:#fde68a;font-weight:800;">${backupCode}</code>
        </p>
      </div>
      <button onclick="this.parentElement.remove()" style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);color:#fff;padding:0.4rem 0.85rem;border-radius:8px;cursor:pointer;font-size:0.8rem;font-weight:700;">Dismiss</button>
    `;
    const container =
      document.querySelector('.container') ||
      document.querySelector('.compendium-container') ||
      document.body;
    container.insertBefore(banner, container.firstChild);
  },

  syncUI() {
    const unlocked =
      this.isUnlocked() ||
      (window.__GM_SIGNED_HOMEWORK_PAGE_UNLOCK === true &&
        !window.location.pathname.includes('compendium'));
    if (unlocked) {
      document.body.classList.remove('da-is-locked');
    }

    // 1. Update index cards
    document.querySelectorAll('.unit-card').forEach((card) => {
      const isLockedUnit = card.getAttribute('data-locked') === 'true';
      const actionBtn = card.querySelector('.unit-action-btn') || card.querySelector('.unit-cta');
      const lockBadge = card.querySelector('.unit-lock-badge');
      const targetUrl = card.getAttribute('data-href') || card.getAttribute('href');

      if (targetUrl && !card.getAttribute('data-href')) {
        card.setAttribute('data-href', targetUrl);
      }

      if (isLockedUnit) {
        if (unlocked) {
          card.classList.remove('is-locked');
          if (targetUrl && card.tagName === 'A') {
            card.setAttribute('href', targetUrl);
            card.onclick = null;
          }
          if (lockBadge) {
            lockBadge.textContent = '✓ Unlocked';
            lockBadge.classList.remove('badge-locked');
            lockBadge.classList.add('badge-unlocked');
          }
          if (actionBtn) {
            actionBtn.textContent = 'Open Lesson →';
            if (targetUrl && actionBtn.tagName === 'A') actionBtn.setAttribute('href', targetUrl);
            actionBtn.removeAttribute('onclick');
          }
        } else {
          card.classList.add('is-locked');
          if (card.tagName === 'A') {
            card.removeAttribute('href');
            card.style.cursor = 'pointer';
            card.onclick = (e) => {
              e.preventDefault();
              DarkAcademiaGate.openModal(card.getAttribute('data-unit-id') || '');
            };
          }
          if (lockBadge) {
            lockBadge.textContent = '🔒 Full Course (£24)';
            lockBadge.classList.add('badge-locked');
            lockBadge.classList.remove('badge-unlocked');
          }
          if (actionBtn) {
            actionBtn.textContent = '🔒 Unlock Lesson (£24)';
            if (actionBtn.tagName === 'A') {
              actionBtn.removeAttribute('href');
              actionBtn.setAttribute(
                'onclick',
                `DarkAcademiaGate.openModal('${card.getAttribute('data-unit-id') || ''}')`
              );
            }
          }
        }
      }
    });

    // 1b. Update top hero buttons on index hub if unlocked
    const heroUnlockBtn =
      document.getElementById('da-hub-hero-unlock-btn') ||
      document.querySelector('.portal-hero .da-btn-stripe');
    if (heroUnlockBtn) {
      if (unlocked) {
        heroUnlockBtn.innerHTML = '<span>✓ Full Course Unlocked — Open Lesson 2 →</span>';
        heroUnlockBtn.style.background = 'linear-gradient(135deg, #065f46 0%, #047857 100%)';
        heroUnlockBtn.style.borderColor = '#10b981';
        heroUnlockBtn.onclick = () => {
          window.location.href = 'dracula-unit2-counts-hospitality.html';
        };
      } else {
        heroUnlockBtn.innerHTML =
          '<span>Unlock All 12 Lessons — £24</span><span aria-hidden="true">→</span>';
        heroUnlockBtn.style.background = '';
        heroUnlockBtn.style.borderColor = '';
        heroUnlockBtn.onclick = () => DarkAcademiaGate.openModal('hub');
      }
    }

    const passkeyTrigger =
      document.getElementById('da-hub-access-code-btn') ||
      document.getElementById('da-hub-passkey-btn');
    if (passkeyTrigger) {
      if (unlocked) {
        passkeyTrigger.innerHTML = '✓ All Lessons Unlocked';
        passkeyTrigger.style.borderColor = '#10b981';
        passkeyTrigger.style.color = '#86efac';
      } else {
        passkeyTrigger.innerHTML = '§ Enter Access Code';
        passkeyTrigger.style.borderColor = '';
        passkeyTrigger.style.color = '';
      }
    }

    // 2. Update locked screen veil if present
    const gateVeil = document.getElementById('da-gate-veil');
    if (gateVeil) {
      if (unlocked) {
        gateVeil.classList.add('unlocked');
        document.body.classList.remove('da-is-locked');
        document.body.style.overflow = '';
      } else {
        gateVeil.classList.remove('unlocked');
        document.body.classList.add('da-is-locked');
        document.body.style.overflow = 'hidden';
      }
    }

    // 3. Update completion cards on Unit 1
    if (window.darkEngine) {
      window.darkEngine.updateCompletionBanner();
    }
  },

  openModal(targetUnit) {
    let modal = document.getElementById('da-paywall-modal');
    if (!modal) {
      modal = this.createModalElement();
      document.body.appendChild(modal);
    }
    const feedback = modal.querySelector('.da-passkey-feedback');
    if (feedback) {
      feedback.textContent = '';
      feedback.innerHTML = '';
    }
    const input = modal.querySelector('.da-passkey-input');
    if (input) {
      input.value = '';
    }
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      const activeInput = modal.querySelector('.da-passkey-input');
      if (activeInput) activeInput.focus();
    }, 100);
  },

  closeModal() {
    const modal = document.getElementById('da-paywall-modal');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  createModalElement() {
    const backdrop = document.createElement('div');
    backdrop.id = 'da-paywall-modal';
    backdrop.className = 'da-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-labelledby', 'modal-gate-title');

    backdrop.innerHTML = `
      <div class="da-modal">
        <button class="da-modal-close" onclick="DarkAcademiaGate.closeModal()" aria-label="Close unlock modal">&times;</button>
        <div style="text-align:center;">
          <div class="da-modal-seal">🕯️</div>
          <span class="da-modal-badge">Full Course Access</span>
          <h2 id="modal-gate-title" class="da-modal-title">Unlock the Complete 12-Lesson Course</h2>
          <p class="da-modal-subtitle">
            Lesson 1 of each book is free to try. Unlock all 8 Advanced Lessons across <em>Dracula</em>, <em>Frankenstein</em>, <em>Jekyll &amp; Hyde</em>, and <em>The Hound of the Baskervilles</em> (+ the Printable Study Guide &amp; Complete Answer Key) for <strong>£24</strong> (one-time payment, lifetime access).
          </p>
        </div>

        <div class="da-modal-benefits">
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>All 12 Interactive C1/C2 Lessons:</strong> Complete 3-part modules for <em>Dracula</em>, <em>Frankenstein</em>, <em>Dr Jekyll &amp; Mr Hyde</em>, and <em>The Hound of the Baskervilles</em>.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>60 Interactive Key Word Transformations:</strong> With tap-to-build word tiles, instant hints, and Cambridge C1/C2 feedback.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>Modern Exam Writing Practice:</strong> Learn how to use every grammar pattern naturally in IELTS &amp; Cambridge essays, reviews, and reports.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>Printable Study Guide &amp; Answer Key:</strong> Complete grammar cheat sheet, vocabulary filter, and all 180 answers.</span>
          </div>
        </div>

        <a href="${this.STRIPE_LINK}" class="da-btn-stripe">
          <span>Unlock Instant Access via Stripe (£24)</span>
          <span aria-hidden="true">→</span>
        </a>
        <p style="font-size:0.75rem;color:#b5a792;margin:0.5rem 0 0.85rem 0;line-height:1.4;text-align:center;">
          Immediate digital supply: by purchasing, you consent to instant access and acknowledge that the 14-day statutory right to cancel ends once access begins (<a href="terms.html#digital-content" style="color:#e4c88c;text-decoration:underline;">UK Digital Content Terms</a>).
        </p>

        <div class="da-passkey-box">
          <p>Already purchased? Enter your <strong>Access Code</strong> from your confirmation screen:</p>
          <div class="da-passkey-row">
            <input type="text" class="da-passkey-input" id="da-modal-passkey" placeholder="ENTER ACCESS CODE" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Course access code input">
            <button class="da-passkey-btn" onclick="DarkAcademiaGate.submitPasskey()">Unlock</button>
          </div>
          <div class="da-passkey-feedback" id="da-modal-feedback"></div>
          <p style="font-size:0.74rem;color:#b5a792;margin-top:0.5rem;">
            Lost your access code or didn’t get redirected? <a href="index.html#enquiry-card" style="color:#e4c88c;text-decoration:underline;">Email me your Stripe receipt</a>.
          </p>
        </div>
      </div>
    `;

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) DarkAcademiaGate.closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        DarkAcademiaGate.closeModal();
      }
    });

    const input = backdrop.querySelector('.da-passkey-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') DarkAcademiaGate.submitPasskey();
      });
    }

    return backdrop;
  },

  submitPasskey() {
    const input = document.getElementById('da-modal-passkey');
    const feedback = document.getElementById('da-modal-feedback');
    if (!input || !feedback) return;

    const val = input.value.trim();
    if (!val) {
      feedback.style.color = '#fca5a5';
      feedback.textContent = 'Please enter your access code.';
      return;
    }

    if (this.unlock(val)) {
      feedback.style.color = '#86efac';
      feedback.innerHTML = '✓ Access Code Verified! Full Course Unlocked.';
      setTimeout(() => {
        this.closeModal();
        if (
          window.location.pathname.includes('unit2') ||
          window.location.pathname.includes('unit3') ||
          window.location.pathname.includes('compendium')
        ) {
          window.location.reload();
        }
      }, 600);
    } else {
      feedback.style.color = '#fca5a5';
      feedback.textContent = '✗ Invalid access code. Please check your confirmation screen or email Gareth your Stripe receipt.';
    }
  },

  enforceGate(unitId) {
    const lockedUnits = [
      'dracula_unit2', 'dracula_unit3',
      'frankenstein_unit2', 'frankenstein_unit3',
      'jekyll_unit2', 'jekyll_unit3',
      'baskerville_unit2', 'baskerville_unit3',
      'compendium'
    ];

    if (!lockedUnits.includes(unitId)) return;

    if (this.isUnitGated(unitId)) {
      document.body.classList.add('da-is-locked');
      let veil = document.getElementById('da-gate-veil');
      if (!veil) {
        veil = document.createElement('div');
        veil.id = 'da-gate-veil';
        veil.className = 'da-gate-veil';
        veil.innerHTML = `
          <div class="da-modal" style="max-width:540px;">
            <div style="text-align:center;">
              <div class="da-modal-seal">🔒</div>
              <span class="da-modal-badge">Full Course Lesson</span>
              <h2 class="da-modal-title">Unlock the Complete Course (£24)</h2>
              <p class="da-modal-subtitle">
                Lesson 1 of each book is free to try. Unlock all 12 lessons across <em>Dracula</em>, <em>Frankenstein</em>, <em>Jekyll &amp; Hyde</em>, and <em>The Hound of the Baskervilles</em> + the Printable Study Guide &amp; Answer Key.
              </p>
            </div>

            <div class="da-modal-benefits">
              <div class="da-benefit-item">
                <span class="da-benefit-icon">✓</span>
                <span>Full access to all 12 Interactive C1/C2 Lessons + the Printable Study Guide &amp; Complete Answer Key.</span>
              </div>
              <div class="da-benefit-item">
                <span class="da-benefit-icon">✓</span>
                <span>One-time payment (£24) — instant lifetime access on your browser plus a backup Access Code for all your devices.</span>
              </div>
            </div>

            <a href="${this.STRIPE_LINK}" class="da-btn-stripe">
              <span>Unlock Full Course via Stripe (£24)</span>
              <span aria-hidden="true">→</span>
            </a>
            <p style="font-size:0.75rem;color:#b5a792;margin:0.5rem 0 0.85rem 0;line-height:1.4;text-align:center;">
              Immediate digital supply: by purchasing, you consent to instant access and acknowledge that the 14-day statutory right to cancel ends once access begins (<a href="terms.html#digital-content" style="color:#e4c88c;text-decoration:underline;">UK Digital Content Terms</a>).
            </p>

            <div class="da-passkey-box">
              <p>Already purchased? Enter your Course Access Code:</p>
              <div class="da-passkey-row">
                <input type="text" class="da-passkey-input" id="veil-passkey-input" placeholder="ENTER ACCESS CODE" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Enter access code to unlock">
                <button class="da-passkey-btn" onclick="DarkAcademiaGate.submitVeilPasskey()">Unlock</button>
              </div>
              <div class="da-passkey-feedback" id="veil-passkey-feedback"></div>
              <p style="font-size:0.74rem;color:#b5a792;margin-top:0.5rem;">
                Lost your access code? <a href="index.html#enquiry-card" style="color:#e4c88c;text-decoration:underline;">Email me your Stripe receipt</a>.
              </p>
            </div>

            <div style="text-align:center; margin-top:1.25rem;">
              <a href="dark-academia-index.html" class="da-link-secondary">← Return to Free Lessons on Course Hub</a>
            </div>
          </div>
        `;
        document.body.appendChild(veil);
        const veilInput = veil.querySelector('#veil-passkey-input');
        if (veilInput) {
          veilInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') DarkAcademiaGate.submitVeilPasskey();
          });
        }
      }
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('da-is-locked');
      const veil = document.getElementById('da-gate-veil');
      if (veil) veil.classList.add('unlocked');
      document.body.style.overflow = '';
    }
  },

  submitVeilPasskey() {
    const input = document.getElementById('veil-passkey-input');
    const feedback = document.getElementById('veil-passkey-feedback');
    if (!input || !feedback) return;

    const val = input.value.trim();
    if (this.unlock(val)) {
      feedback.style.color = '#86efac';
      feedback.textContent = '✓ Unlocked! Loading lesson...';
      setTimeout(() => window.location.reload(), 500);
    } else {
      feedback.style.color = '#fca5a5';
      feedback.textContent = '✗ Invalid access code. Check your confirmation screen or email Gareth your Stripe receipt.';
    }
  }
};

window.DarkAcademiaGate = DarkAcademiaGate;

class DarkAcademiaEngine {
  constructor(config) {
    this.unitId = config.unitId || 'gothic_unit';
    this.totalMarks = config.totalMarks || 20;
    this.sortItems = config.sortItems || [];
    this.styleShiftItems = config.styleShiftItems || [];
    this.capstoneConfig = config.capstoneConfig || null;
    this.sortLabels = config.sortLabels || {
      arsenal: '✓ Modern C1/C2 Word',
      museum: '🏛 Old-Fashioned Word'
    };
    this.score = 0;

    this.init();
  }

  init() {
    this.injectHelperStyles();
    DarkAcademiaGate.checkUrlUnlock();
    DarkAcademiaGate.enforceGate(this.unitId);
    this.renderSortTask();
    this.renderStyleShiftDrills();
    this.initKWTScaffolds();
    this.bindKeyboardEvents();
    this.initCapstoneAudit();
    this.renderCompletionBanner();
    this.updateScoreDisplay();
    DarkAcademiaGate.syncUI();
    if (window.DarkAcademiaAtmosphere) {
      window.DarkAcademiaAtmosphere.initLesson(this.unitId);
    }

    window.resetAll = () => this.resetAll();
  }

  /**
   * Injects mobile-friendly styling for interactive KWT Word Tiles, Hint Bar & Paywall Fallback
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
      .unit-card.is-locked {
        opacity: 0.9;
      }
      .badge-locked {
        background: rgba(245, 158, 11, 0.16) !important;
        color: #fde68a !important;
        border: 1px solid rgba(245, 158, 11, 0.4) !important;
      }
      .badge-unlocked {
        background: rgba(16, 185, 129, 0.18) !important;
        color: #86efac !important;
        border: 1px solid #10b981 !important;
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
      el.style.color = '#4ade80';
    } else if (this.score >= Math.ceil(this.totalMarks * 0.5)) {
      el.style.color = '#fbbf24';
    } else {
      el.style.color = '';
    }

    this.saveProgress();
    this.updateCompletionBanner();
  }

  /**
   * Renders the completion banner at the bottom of the unit (with £24 Stripe CTA when locked)
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

    const unlocked = DarkAcademiaGate.isUnlocked();
    const pct = Math.round((this.score / this.totalMarks) * 100);

    const metaMap = {
      dracula_unit1: {
        mastered: 'Participle Clauses in Dracula Chapter 1',
        nextUrl: 'dracula-unit2-counts-hospitality.html',
        nextTitle: "Lesson 2: The Count's Hospitality",
        nextFreeUrl: 'frankenstein-unit1-spark-of-being.html',
        nextFreeTitle: 'Frankenstein Lesson 1'
      },
      dracula_unit2: {
        mastered: 'Negative Inversion in Castle Dracula',
        nextUrl: 'dracula-unit3-log-of-the-demeter.html',
        nextTitle: 'Lesson 3: The Shipwreck at Whitby',
        nextFreeUrl: 'frankenstein-unit1-spark-of-being.html',
        nextFreeTitle: 'Frankenstein Lesson 1'
      },
      dracula_unit3: {
        mastered: 'Formal Reporting Passives in Whitby',
        nextUrl: 'frankenstein-unit1-spark-of-being.html',
        nextTitle: 'Lesson 4: Frankenstein — The Spark of Being',
        nextFreeUrl: 'frankenstein-unit1-spark-of-being.html',
        nextFreeTitle: 'Frankenstein Lesson 1'
      },
      frankenstein_unit1: {
        mastered: 'Inverted Conditionals in Frankenstein',
        nextUrl: 'frankenstein-unit2-sea-of-ice.html',
        nextTitle: 'Lesson 5: The Sea of Ice',
        nextFreeUrl: 'jekyll-unit1-soho-threshold.html',
        nextFreeTitle: 'Jekyll & Hyde Lesson 1'
      },
      frankenstein_unit2: {
        mastered: 'Contrast Fronting & Subjunctives on the Glacier',
        nextUrl: 'frankenstein-unit3-creatures-apologia.html',
        nextTitle: "Lesson 6: The Creature's Case",
        nextFreeUrl: 'jekyll-unit1-soho-threshold.html',
        nextFreeTitle: 'Jekyll & Hyde Lesson 1'
      },
      frankenstein_unit3: {
        mastered: "Cleft Sentences in the Creature's Case",
        nextUrl: 'jekyll-unit1-soho-threshold.html',
        nextTitle: 'Lesson 7: The Mysterious Door in Soho',
        nextFreeUrl: 'jekyll-unit1-soho-threshold.html',
        nextFreeTitle: 'Jekyll & Hyde Lesson 1'
      },
      jekyll_unit1: {
        mastered: 'Concessive Clauses in Jekyll & Hyde',
        nextUrl: 'jekyll-unit2-lanyons-narrative.html',
        nextTitle: "Lesson 8: Dr Lanyon's Narrative",
        nextFreeUrl: 'baskerville-unit1-curse-of-the-moors.html',
        nextFreeTitle: 'Hound of the Baskervilles Lesson 1'
      },
      jekyll_unit2: {
        mastered: "Turning-Point Inversion in Dr Lanyon's Study",
        nextUrl: 'jekyll-unit3-full-statement.html',
        nextTitle: "Lesson 9: Henry Jekyll's Full Confession",
        nextFreeUrl: 'baskerville-unit1-curse-of-the-moors.html',
        nextFreeTitle: 'Hound of the Baskervilles Lesson 1'
      },
      jekyll_unit3: {
        mastered: "Emphasizing Causes & Jekyll's Double Life",
        nextUrl: 'baskerville-unit1-curse-of-the-moors.html',
        nextTitle: 'Lesson 10: The Mystery at Baskerville Hall',
        nextFreeUrl: 'baskerville-unit1-curse-of-the-moors.html',
        nextFreeTitle: 'Hound of the Baskervilles Lesson 1'
      },
      baskerville_unit1: {
        mastered: 'Past Modals of Deduction at 221B Baker Street',
        nextUrl: 'baskerville-unit2-grimpen-mire.html',
        nextTitle: 'Lesson 11: Across Dartmoor & Grimpen Mire',
        nextFreeUrl: 'dracula-unit1-carpathian-threshold.html',
        nextFreeTitle: 'Dracula Lesson 1'
      },
      baskerville_unit2: {
        mastered: 'Place Inversion on Grimpen Mire',
        nextUrl: 'baskerville-unit3-moorland-vigil.html',
        nextTitle: 'Lesson 12: The Hound Revealed',
        nextFreeUrl: 'dracula-unit1-carpathian-threshold.html',
        nextFreeTitle: 'Dracula Lesson 1'
      },
      baskerville_unit3: {
        mastered: 'Counterfactual Conditionals & The Final Dartmoor Deduction',
        nextUrl: 'the-gothic-canon-c1-c2-compendium.html',
        nextTitle: 'Printable Study Guide & Answer Key',
        nextFreeUrl: 'the-gothic-canon-c1-c2-compendium.html',
        nextFreeTitle: 'Study Guide & Answer Key'
      }
    };

    const meta = metaMap[this.unitId] || metaMap.dracula_unit1;
    const targetUrl = meta.nextUrl || meta.unit2Url;
    const targetTitle = meta.nextTitle || meta.unit2Title;

    if (unlocked) {
      container.innerHTML = `
        <div class="da-completion-top">
          <span class="da-score-callout">✓ Lesson Score: ${this.score} / ${this.totalMarks} Marks (${pct}%)</span>
          <span class="badge badge-verbatim">Full Course Unlocked</span>
        </div>
        <h3 class="da-completion-title">Ready for the Next Lesson?</h3>
        <p class="da-completion-body">
          You have practiced ${meta.mastered}. Continue to the next lesson or open the printable Study Guide &amp; Answer Key.
        </p>
        <div class="da-completion-actions">
          <a href="${targetUrl}" class="btn-main" style="text-decoration:none;">
            Continue to ${targetTitle} →
          </a>
          <a href="the-gothic-canon-c1-c2-compendium.html" class="dossier-pill-btn">
            📖 Open Study Guide &amp; Answer Key
          </a>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="da-completion-top">
          <span class="da-score-callout">Free Lesson Score: ${this.score} / ${this.totalMarks} Marks (${pct}%)</span>
          <span class="badge badge-canon-dracula">C1/C2 Complete Course</span>
        </div>
        <h3 class="da-completion-title">Enjoying the Course? Unlock All 12 Lessons</h3>
        <p class="da-completion-body">
          You've practiced ${meta.mastered}. Unlock the complete <strong>12-Lesson Dark Academia Course</strong> across <em>Dracula</em>, <em>Frankenstein</em>, <em>Dr Jekyll &amp; Mr Hyde</em>, and <em>The Hound of the Baskervilles</em> (+ the Printable Study Guide &amp; Complete Answer Key) for <strong>£24</strong>.
        </p>
        <div class="da-completion-perks">
          <div class="da-perk-chip"><span>🔓</span> 8 Advanced C1/C2 Lessons</div>
          <div class="da-perk-chip"><span>✓</span> 60 Interactive Transformations</div>
          <div class="da-perk-chip"><span>✍️</span> Modern Essay &amp; Review Practice</div>
          <div class="da-perk-chip"><span>📖</span> Printable Study Guide &amp; Answer Key</div>
        </div>
        <div class="da-completion-actions">
          <button class="da-btn-stripe" style="max-width:340px;" onclick="DarkAcademiaGate.openModal('${this.unitId}')">
            <span>Unlock Full 12-Lesson Course — £24</span>
            <span aria-hidden="true">→</span>
          </button>
          <a href="${meta.nextFreeUrl}" class="da-link-secondary">
            Or try ${meta.nextFreeTitle} for free first →
          </a>
        </div>
      `;
    }
  }

  /**
   * Task 1: Renders the 4-item Vocabulary Filter
   */
  renderSortTask() {
    const container = document.getElementById('sorting-container');
    if (!container || !this.sortItems.length) return;

    container.innerHTML = '';
    const arsenalLabel = (this.sortLabels && this.sortLabels.arsenal) || '✓ Modern C1/C2 Word';
    const museumLabel = (this.sortLabels && this.sortLabels.museum) || '🏛 Old-Fashioned Word';

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
          <button type="button" class="btn-sort" data-choice="arsenal" aria-label="Mark as ${arsenalLabel}">
            ${arsenalLabel}
          </button>
          <button type="button" class="btn-sort" data-choice="museum" aria-label="Mark as ${museumLabel}">
            ${museumLabel}
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
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('seal');
      if (fb) {
        fb.textContent = `✓ Correct! ${item.exp}`;
        fb.style.color = 'var(--green-text)';
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: 'register_shift',
          correct: true,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: item.word + ' — ' + (item.sub || ''),
          targetAnswer: item.type === 'arsenal' ? 'Modern C1/C2 Register' : 'Archaic Literary Register',
          explanation: item.exp
        });
      }
    } else {
      btnElement.classList.add('wrong');
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('miss');
      if (fb) {
        fb.textContent = `✗ Not quite. ${item.exp}`;
        fb.style.color = 'var(--red-text)';
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: 'register_shift',
          correct: false,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: 'Classify C1/C2 vs Archaic register: "' + item.word + '" (' + (item.sub || '') + ')',
          keyword: item.word.toUpperCase(),
          targetAnswer: item.type === 'arsenal' ? 'Modern C1/C2' : 'Archaic',
          userAttempt: choice === 'arsenal' ? 'Modern C1/C2' : 'Archaic',
          explanation: item.exp
        });
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

    const promptEl = block.querySelector('.mc-prompt');
    const promptTxt = promptEl ? promptEl.textContent.trim() : 'Gothic Canon Multiple Choice';
    const correctBtn = buttons[correctIndex];
    const correctTxt = correctBtn ? correctBtn.textContent.trim() : '';

    if (optionIndex === correctIndex) {
      btn.classList.add('correct');
      this.score += 1;
      this.updateScoreDisplay();
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('seal');
      if (fb) {
        fb.className = 'feedback-box correct';
        fb.innerHTML = `<strong>✓ Correct (+1 Mark):</strong> ${explanation}`;
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: 'nominalisation',
          correct: true,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: promptTxt,
          targetAnswer: correctTxt,
          explanation: explanation
        });
      }
    } else {
      btn.classList.add('wrong');
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('miss');
      if (buttons[correctIndex]) {
        buttons[correctIndex].classList.add('correct');
      }
      if (fb) {
        fb.className = 'feedback-box wrong';
        fb.innerHTML = `<strong>✗ Key Point:</strong> ${explanation}`;
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: 'nominalisation',
          correct: false,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: promptTxt,
          targetAnswer: correctTxt,
          userAttempt: btn.textContent.trim(),
          explanation: explanation
        });
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

    const kwtLead = card.querySelector('.kwt-lead');
    const kwtPromptText = kwtLead ? kwtLead.textContent.trim() : 'Key Word Transformation (' + (keyWord || '').toUpperCase() + ')';
    const inferCategory = (expStr) => {
      const low = String(expStr || '').toLowerCase();
      if (low.includes('inversion') || low.includes('invert') || low.includes('auxiliary')) return 'inversion';
      if (low.includes('cleft')) return 'cleft_clauses';
      if (low.includes('passive') || low.includes('nominal')) return 'nominalisation';
      return 'inversion';
    };
    const kwtCat = inferCategory(explanation);

    if (isExactMatch) {
      this.lockKWTCard(card, input, btn);
      if (input) {
        input.style.borderColor = 'var(--green)';
        input.style.color = 'var(--green-text)';
      }
      this.score += 2;
      this.updateScoreDisplay();
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('seal');
      if (fb) {
        fb.className = 'feedback-box correct';
        fb.innerHTML = `<strong>✓ Full Marks (+2/2):</strong> Excellent! <em>"${modelAnswer}"</em> — ${explanation}`;
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: kwtCat,
          correct: true,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: kwtPromptText,
          keyword: (keyWord || '').toUpperCase(),
          targetAnswer: modelAnswer,
          userAttempt: rawUser,
          explanation: explanation
        });
      }
      return;
    }

    if (attempts === 1) {
      const firstTwo = modelWords.slice(0, 2).join(' ');
      if (input) {
        input.style.borderColor = 'var(--amber)';
      }
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('quill');
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Almost there! Try once more:</strong> Start with <strong>"${firstTwo}..."</strong> (${modelWords.length} words total). Tap the word tiles or adjust your answer and click <strong>Check</strong> again!`;
      }
      return;
    }

    this.lockKWTCard(card, input, btn);

    if (isPartialMatch) {
      if (input) {
        input.style.borderColor = 'var(--amber)';
        input.style.color = '#fde68a';
      }
      this.score += 1;
      this.updateScoreDisplay();
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('quill');
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Partial Credit (+1/2):</strong> Good effort using the key word! Full answer: <strong>"${modelAnswer}"</strong>.<br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: kwtCat,
          correct: false,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: kwtPromptText,
          keyword: (keyWord || '').toUpperCase(),
          targetAnswer: modelAnswer,
          userAttempt: rawUser,
          explanation: explanation
        });
      }
    } else {
      if (input) {
        input.style.borderColor = 'var(--red)';
        input.style.color = 'var(--red-text)';
      }
      if (window.DarkAcademiaAtmosphere) window.DarkAcademiaAtmosphere.playSFX('miss');
      if (fb) {
        fb.className = 'feedback-box wrong';
        fb.innerHTML = `<strong>✗ Model Answer:</strong> <strong>"${modelAnswer}"</strong><br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
      }
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt({
          category: kwtCat,
          correct: false,
          game: 'Dark Academia (' + (this.unitId || 'Gothic Canon') + ')',
          prompt: kwtPromptText,
          keyword: (keyWord || '').toUpperCase(),
          targetAnswer: modelAnswer,
          userAttempt: rawUser,
          explanation: explanation
        });
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
    } catch (e) {}
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

/**
 * ==========================================================================
 * DarkAcademiaAtmosphere — Volumetric Canvas VFX, Classical/Gothic Soundscape
 * & British Dramatic Excerpt Narration Engine (Hub + All 12 Lessons)
 * ==========================================================================
 */
const DarkAcademiaAtmosphere = (() => {
  let audioCtx = null;
  let musicAudioEl = null;
  let voiceAudioEl = null;
  let synthTimer = null;
  let noiseNode = null;
  let noiseGain = null;
  let musicPlaying = false;
  let userMutedMusic = true;
  let autoplayUnlockArmed = false;
  let sfxEnabled = false;
  let currentTrackIdx = 0;
  let synthStep = 0;
  let clauseTimer = null;

  const SOUNDSCAPE_TRACKS = [
    {
      id: 'bach_minuet',
      name: 'Bach: Minuet in G',
      type: 'mp3',
      src: 'assets/audio/bach_minuet.mp3',
      tempoMs: 280,
      notes: [
        [587.33, 196.00], [392.00, 196.00], [440.00, 196.00], [493.88, 196.00],
        [523.25, 196.00], [587.33, 196.00], [392.00, 196.00], [392.00, 196.00]
      ]
    },
    {
      id: 'mozart_nacht',
      name: 'Mozart: Nachtmusik',
      type: 'mp3',
      src: 'assets/audio/mozart_nachtmusik.mp3',
      tempoMs: 250,
      notes: [
        [392.00, 196.00], [293.66, 146.83], [392.00, 196.00], [293.66, 146.83],
        [392.00, 196.00], [293.66, 146.83], [392.00, 196.00], [493.88, 246.94], [587.33, 293.66]
      ]
    },
    {
      id: 'tchaikovsky_nocturne',
      name: 'Tchaikovsky: Nocturne',
      type: 'mp3',
      src: 'assets/audio/tchaikovsky_sugarplum.mp3',
      tempoMs: 270,
      notes: [
        [659.25, 164.81], [587.33, 164.81], [659.25, 196.00], [587.33, 196.00],
        [622.25, 185.00], [587.33, 196.00], [523.25, 164.81], [493.88, 164.81]
      ]
    },
    {
      id: 'rain_hearth',
      name: 'Midnight Rain & Cello',
      type: 'procedural_rain',
      tempoMs: 420,
      notes: [
        [146.83, 220.00], [164.81, 246.94], [174.61, 261.63], [164.81, 246.94],
        [130.81, 196.00], [146.83, 220.00], [110.00, 220.00], [138.59, 207.65]
      ]
    },
    {
      id: 'carpathian_harpsichord',
      name: 'Carpathian Harpsichord',
      type: 'procedural_harpsichord',
      tempoMs: 240,
      notes: [
        [220.00, 440.00], [261.63, 523.25], [329.63, 659.25], [261.63, 523.25],
        [246.94, 493.88], [293.66, 587.33], [349.23, 698.46], [329.63, 659.25],
        [207.65, 415.30], [246.94, 493.88], [329.63, 659.25], [220.00, 440.00]
      ]
    }
  ];

  const BOOK_CINEMA_ACTS = [
    {
      bookKey: 'dracula',
      title: 'Book I • Bram Stoker’s Dracula (1897)',
      imgSrc: 'assets/gothic/dracula_carpathian.jpg',
      museumCredit: 'Plate I — Caspar David Friedrich, Abbey in the Oakwood (1809–1810), Oil on canvas • Alte Nationalgalerie, Berlin',
      audioSrc: 'assets/audio/gothic_act1_dracula.mp3?v=2',
      quote: '"Soon we were hemmed in with trees, which in places arched right over the roadway till we passed as through a tunnel..."',
      grammarFocus: 'C1/C2 Target: Participle Clauses (Fearing..., Hemmed in by...), Negative Inversion (Little did Harker realise...) & Reporting Passives.',
      freeUrl: 'dracula-unit1-carpathian-threshold.html',
      freeLabel: 'Read Free Lesson 1 →'
    },
    {
      bookKey: 'frankenstein',
      title: 'Book II • Mary Shelley’s Frankenstein (1818)',
      imgSrc: 'assets/gothic/frankenstein_lab.jpg',
      museumCredit: 'Plate II — Joseph Wright of Derby, An Experiment on a Bird in the Air Pump (1768), Oil on canvas • The National Gallery, London',
      audioSrc: 'assets/audio/gothic_act2_frankenstein.mp3?v=2',
      quote: '"It was on a dreary night of November that I beheld the accomplishment of my toils..."',
      grammarFocus: 'C1/C2 Target: Inverted Conditionals (Had he known..., Were we to...), Contrast Fronting (Bleak though it was...) & Cleft Sentences.',
      freeUrl: 'frankenstein-unit1-spark-of-being.html',
      freeLabel: 'Read Free Lesson 4 →'
    },
    {
      bookKey: 'jekyll',
      title: 'Book III • R.L. Stevenson’s Dr Jekyll & Mr Hyde (1886)',
      imgSrc: 'assets/gothic/jekyll_apothecary.jpg',
      museumCredit: 'Plate III — John Atkinson Grimshaw, Reflections on the Thames, Westminster (1880), Oil on canvas • Leeds Art Gallery',
      audioSrc: 'assets/audio/gothic_act3_jekyll.mp3?v=2',
      quote: '"Much as Utterson wished to trust his old friend, the sinister connection to Mr Hyde filled him with repugnance..."',
      grammarFocus: 'C1/C2 Target: Concessive Clauses (Much as..., Shocking though...), Time Inversions (Not until... did...) & Evaluative C2 Lexis.',
      freeUrl: 'jekyll-unit1-soho-threshold.html',
      freeLabel: 'Read Free Lesson 7 →'
    },
    {
      bookKey: 'baskerville',
      title: 'Book IV • Conan Doyle’s The Hound of the Baskervilles (1901)',
      imgSrc: 'assets/gothic/baskerville_moor.jpg',
      museumCredit: 'Plate IV — Caspar David Friedrich, Two Men Contemplating the Moon (1819–1820), Oil on canvas • Galerie Neue Meister, Dresden',
      audioSrc: 'assets/audio/gothic_act4_baskerville.mp3?v=2',
      quote: '"Sir Charles must have been waiting at the moor-gate, yet no footprints could be seen upon the gravel..."',
      grammarFocus: 'C1/C2 Target: Past Modals of Deduction (must have been, can’t have, might well have), Place Inversion & Counterfactuals (But for...).',
      freeUrl: 'baskerville-unit1-curse-of-the-moors.html',
      freeLabel: 'Read Free Lesson 10 →'
    }
  ];

  const UNIT_PAINTINGS = {
    dracula_unit1: {
      src: 'assets/gothic/dracula_carpathian.jpg',
      credit: 'Caspar David Friedrich, Abbey in the Oakwood (1809–1810) • Alte Nationalgalerie'
    },
    dracula_unit2: {
      src: 'assets/gothic/dracula_unit2.jpg',
      credit: 'Caspar David Friedrich, Ruins of Eldena (c. 1825) • Oil on canvas'
    },
    dracula_unit3: {
      src: 'assets/gothic/dracula_unit3.jpg',
      credit: 'Johan Christian Dahl, Shipwreck on the Coast (1832) • National Museum, Oslo'
    },
    frankenstein_unit1: {
      src: 'assets/gothic/frankenstein_lab.jpg',
      credit: 'Joseph Wright of Derby, An Experiment on a Bird in the Air Pump (1768) • National Gallery'
    },
    frankenstein_unit2: {
      src: 'assets/gothic/frankenstein_unit2.jpg',
      credit: 'Caspar David Friedrich, The Sea of Ice (1824) • Hamburger Kunsthalle'
    },
    frankenstein_unit3: {
      src: 'assets/gothic/frankenstein_unit3.jpg',
      credit: 'Caspar David Friedrich, Wanderer above the Sea of Fog (c. 1818) • Hamburger Kunsthalle'
    },
    jekyll_unit1: {
      src: 'assets/gothic/jekyll_apothecary.jpg',
      credit: 'John Atkinson Grimshaw, Reflections on the Thames, Westminster (1880) • Leeds Art Gallery'
    },
    jekyll_unit2: {
      src: 'assets/gothic/jekyll_unit2.jpg',
      credit: 'Joseph Wright of Derby, The Alchymist Discovering Phosphorus (1771) • Derby Museum'
    },
    jekyll_unit3: {
      src: 'assets/gothic/jekyll_unit3.jpg',
      credit: 'John Atkinson Grimshaw, Liverpool Quay by Moonlight (1887) • Tate Britain'
    },
    baskerville_unit1: {
      src: 'assets/gothic/baskerville_moor.jpg',
      credit: 'Caspar David Friedrich, Two Men Contemplating the Moon (1819) • Galerie Neue Meister'
    },
    baskerville_unit2: {
      src: 'assets/gothic/baskerville_unit2.jpg',
      credit: 'Caspar David Friedrich, Megalithic Tomb in Autumn (c. 1820) • Galerie Neue Meister'
    },
    baskerville_unit3: {
      src: 'assets/gothic/baskerville_unit3.jpg',
      credit: 'Caspar David Friedrich, Moonrise by the Sea (1822) • Alte Nationalgalerie'
    },
    alice_unit1: {
      src: 'assets/gothic/alice_unit1.jpg',
      credit: 'Sir John Tenniel & Dalziel Brothers, Alice Falling Down the Rabbit-Hole (1865) • Victorian Fine Art Plate'
    }
  };

  const preloadedImages = {};
  function getBookImage(keyOrUnitId) {
    const bookMap = {
      dracula: 'assets/gothic/dracula_carpathian.jpg',
      frankenstein: 'assets/gothic/frankenstein_lab.jpg',
      jekyll: 'assets/gothic/jekyll_apothecary.jpg',
      baskerville: 'assets/gothic/baskerville_moor.jpg',
      alice: 'assets/gothic/alice_unit1.jpg'
    };
    const key = String(keyOrUnitId || '').toLowerCase();
    const src =
      (UNIT_PAINTINGS[keyOrUnitId] && UNIT_PAINTINGS[keyOrUnitId].src) ||
      bookMap[keyOrUnitId] ||
      (key.includes('alice') ? 'assets/gothic/alice_unit1.jpg' : bookMap.dracula);
    if (!preloadedImages[src] && typeof Image !== 'undefined') {
      const img = new Image();
      img.src = src;
      preloadedImages[src] = img;
    }
    return preloadedImages[src];
  }

  function detectBookKey(unitId) {
    const u = (unitId || window.location.pathname || '').toLowerCase();
    if (u.includes('frankenstein')) return 'frankenstein';
    if (u.includes('jekyll')) return 'jekyll';
    if (u.includes('baskerville')) return 'baskerville';
    if (u.includes('alice')) return 'alice';
    return 'dracula';
  }

  function ensureAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function startRainNoise() {
    stopRainNoise();
    try {
      ensureAudio();
      if (!audioCtx) return;
      const bufferSize = audioCtx.sampleRate * 2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.03;
        b6 = white * 0.115926;
      }
      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, audioCtx.currentTime);

      noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.09, audioCtx.currentTime);

      noiseNode.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noiseNode.start();
    } catch (e) {}
  }

  function stopRainNoise() {
    try {
      if (noiseNode) {
        noiseNode.stop();
        noiseNode.disconnect();
        noiseNode = null;
      }
    } catch (e) {}
  }

  function playSynthStep() {
    if (!musicPlaying) return;
    try {
      ensureAudio();
      if (!audioCtx) return;
      const track = SOUNDSCAPE_TRACKS[currentTrackIdx % SOUNDSCAPE_TRACKS.length];
      const pair = track.notes[synthStep % track.notes.length];
      synthStep += 1;

      const now = audioCtx.currentTime;
      const isHarpsichord = track.type === 'procedural_harpsichord';
      const dur = (track.tempoMs / 1000) * (isHarpsichord ? 0.9 : 1.35);

      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = isHarpsichord ? 'sawtooth' : 'triangle';
      osc1.frequency.setValueAtTime(pair[0], now);
      gain1.gain.setValueAtTime(isHarpsichord ? 0.025 : 0.035, now);
      gain1.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + dur);

      if (pair[1]) {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(pair[1], now);
        gain2.gain.setValueAtTime(0.024, now);
        gain2.gain.exponentialRampToValueAtTime(0.0008, now + dur);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start(now);
        osc2.stop(now + dur);
      }
    } catch (e) {}
  }

  function armAutoplayUnlock() {
    if (autoplayUnlockArmed) return;
    autoplayUnlockArmed = true;
    const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
    const onFirstGesture = (e) => {
      if (e && e.target && e.target.closest && e.target.closest('#da-hud-music-toggle')) {
        return;
      }
      unlockEvents.forEach((ev) => window.removeEventListener(ev, onFirstGesture, true));
      autoplayUnlockArmed = false;
      if (!userMutedMusic) {
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        if (musicAudioEl && musicAudioEl.paused && musicPlaying) {
          musicAudioEl.play().catch(() => {});
        } else if (!musicPlaying) {
          startMusic();
        }
      }
    };
    unlockEvents.forEach((ev) => window.addEventListener(ev, onFirstGesture, { capture: true, passive: true }));
  }

  function startMusic() {
    stopMusic(false);
    musicPlaying = true;
    const track = SOUNDSCAPE_TRACKS[currentTrackIdx % SOUNDSCAPE_TRACKS.length];

    if (track.type === 'mp3' && track.src && typeof Audio !== 'undefined') {
      try {
        if (!musicAudioEl) {
          musicAudioEl = new Audio();
          musicAudioEl.loop = true;
          musicAudioEl.preload = 'auto';
        }
        if (!musicAudioEl.src || !musicAudioEl.src.endsWith(track.src)) {
          musicAudioEl.src = track.src;
        }
        musicAudioEl.volume = 0.28;
        const p = musicAudioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => {
            armAutoplayUnlock();
          });
        }
      } catch (e) {
        armAutoplayUnlock();
      }
    } else {
      if (track.type === 'procedural_rain') {
        startRainNoise();
      }
      playSynthStep();
      synthTimer = setInterval(playSynthStep, track.tempoMs);
      if (audioCtx && audioCtx.state === 'suspended') {
        armAutoplayUnlock();
      }
    }
    syncHUD();
  }

  function stopMusic(updateUI = true) {
    musicPlaying = false;
    if (synthTimer) {
      clearInterval(synthTimer);
      synthTimer = null;
    }
    stopRainNoise();
    try {
      if (musicAudioEl) {
        musicAudioEl.pause();
      }
    } catch (e) {}
    if (updateUI) syncHUD();
  }

  function toggleMusic() {
    if (musicPlaying) {
      userMutedMusic = true;
      stopMusic(true);
    } else {
      userMutedMusic = false;
      startMusic();
    }
  }

  function nextTrack() {
    currentTrackIdx = (currentTrackIdx + 1) % SOUNDSCAPE_TRACKS.length;
    synthStep = 0;
    startMusic();
  }

  function toggleSFX() {
    sfxEnabled = !sfxEnabled;
    if (sfxEnabled) playSFX('quill');
    syncHUD();
  }

  function toggleParchmentMode() {
    const isParchment = document.body.classList.toggle('da-parchment-mode');
    try {
      localStorage.setItem('da_parchment_mode', isParchment ? '1' : '0');
    } catch (e) {}
    playSFX('page');
    syncHUD();
  }

  function playSFX(type) {
    if (!sfxEnabled) return;
    try {
      ensureAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;

      if (type === 'seal') {
        // Warm wax-seal thud + golden C1/C2 chord chime
        [440.0, 554.37, 659.25, 880.0].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);
          gain.gain.setValueAtTime(0.075, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.34);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.35);
        });
      } else if (type === 'quill') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.06);
        gain.gain.setValueAtTime(0.045, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.075);
      } else if (type === 'page') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(340, now);
        osc.frequency.exponentialRampToValueAtTime(520, now + 0.11);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.13);
      } else if (type === 'miss') {
        [246.94, 196.0].forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.09);
          gain.gain.setValueAtTime(0.065, now + idx * 0.09);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.22);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start(now + idx * 0.09);
          osc.stop(now + idx * 0.09 + 0.24);
        });
      }
    } catch (e) {}
  }

  function setMusicDucking(ducked) {
    if (musicAudioEl) {
      musicAudioEl.volume = ducked ? 0.07 : 0.28;
    }
    if (noiseGain && audioCtx) {
      try {
        noiseGain.gain.setValueAtTime(ducked ? 0.025 : 0.09, audioCtx.currentTime);
      } catch (e) {}
    }
  }

  function hasHighQualityBritishVoice() {
    if (!('speechSynthesis' in window)) return false;
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      return voices.some((v) => {
        const name = (v.name || '').toLowerCase();
        const lang = (v.lang || '').toLowerCase();
        const isBritish = /^en[-_](gb|uk)/.test(lang) || name.includes('united kingdom') || name.includes('uk');
        return isBritish && (
          name.includes('natural') ||
          name.includes('neural') ||
          name.includes('online') ||
          name.includes('google') ||
          name.includes('serena') ||
          name.includes('daniel') ||
          name.includes('oliver') ||
          name.includes('ryan') ||
          name.includes('sonia')
        );
      });
    } catch (e) {
      return false;
    }
  }

  function selectBestBritishVoice() {
    if (!('speechSynthesis' in window)) return null;
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (!voices.length) return null;
      const gbVoices = voices.filter((v) => /^en[-_](GB|UK)/i.test(v.lang || '') || /Great Britain|United Kingdom|UK/i.test(v.name || ''));
      const pool = gbVoices.length ? gbVoices : voices.filter((v) => /^en/i.test(v.lang || ''));
      if (!pool.length) return null;

      const scoreVoice = (v) => {
        const name = (v.name || '').toLowerCase();
        let s = 0;
        if (name.includes('natural') || name.includes('neural')) s += 120;
        if (name.includes('online')) s += 80;
        if (name.includes('ryan') || name.includes('thomas') || name.includes('sonia') || name.includes('libby')) s += 60;
        if (name.includes('google uk english') || name.includes('google english')) s += 50;
        if (name.includes('daniel') || name.includes('oliver') || name.includes('serena') || name.includes('arthur')) s += 40;
        if (name.includes('hazel') || name.includes('desktop') || name.includes('david') || name.includes('zira')) s -= 80;
        return s;
      };

      return [...pool].sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
    } catch (e) {
      return null;
    }
  }

  function syncVoiceHUD(isSpeaking) {
    const btn = document.getElementById('da-hud-voice-stop');
    if (!btn) return;
    btn.style.display = isSpeaking ? 'inline-flex' : 'none';
  }

  function stopNarration() {
    if (clauseTimer) {
      clearInterval(clauseTimer);
      clauseTimer = null;
    }
    document.querySelectorAll('.highlight-clause.clause-speaking-now').forEach((el) => {
      el.classList.remove('clause-speaking-now');
    });
    document.querySelectorAll('.da-reader-btn.speaking').forEach((btn) => {
      btn.classList.remove('speaking');
      const lbl = btn.querySelector('.da-reader-btn-label');
      if (lbl && btn.dataset.defaultLabel) lbl.textContent = btn.dataset.defaultLabel;
    });
    document.querySelectorAll('.da-pronounce-btn.speaking').forEach((btn) => {
      btn.classList.remove('speaking');
    });
    document.querySelectorAll('.da-waveform.active').forEach((w) => {
      w.classList.remove('active');
    });
    try {
      if (voiceAudioEl) {
        voiceAudioEl.ontimeupdate = null;
        voiceAudioEl.pause();
        voiceAudioEl.currentTime = 0;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
    setMusicDucking(false);
    syncVoiceHUD(false);
  }

  // Keyboard shortcut: Press Escape at any time to immediately stop voice / audio
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        stopNarration();
      }
    });
  }

  function computeClauseWindows(fullText, clausesNodeList) {
    if (!fullText || !clausesNodeList || !clausesNodeList.length) return [];
    const normFull = fullText.replace(/\s+/g, ' ').trim();
    const totalLen = Math.max(1, normFull.length);
    let searchFrom = 0;

    return Array.from(clausesNodeList).map((el, idx) => {
      const clauseText = (el.textContent || '').replace(/\s+/g, ' ').trim();
      let pos = normFull.indexOf(clauseText, searchFrom);
      if (pos === -1) pos = normFull.indexOf(clauseText);
      if (pos !== -1) {
        searchFrom = pos + clauseText.length;
        const startRatio = Math.max(0, (pos - 12) / totalLen);
        const endRatio = Math.min(1, (pos + clauseText.length + 18) / totalLen);
        return { el, startRatio, endRatio };
      }
      const fallbackStart = idx / clausesNodeList.length;
      const fallbackEnd = (idx + 1) / clausesNodeList.length;
      return { el, startRatio: fallbackStart, endRatio: fallbackEnd };
    });
  }

  let lastFallbackContext = null;

  function playDramaticExtract(mp3Src, fallbackText, btnEl, waveformEl, clausesNodeList) {
    if (btnEl && btnEl.classList.contains('speaking')) {
      stopNarration();
      return;
    }
    stopNarration();

    if (btnEl) {
      btnEl.classList.add('speaking');
      const lbl = btnEl.querySelector('.da-reader-btn-label');
      if (lbl) lbl.textContent = '⏹ Stop Reading';
    }
    if (waveformEl) waveformEl.classList.add('active');
    setMusicDucking(true);
    syncVoiceHUD(true);

    const clauseWindows = computeClauseWindows(fallbackText, clausesNodeList);

    const startFallbackClauseTimer = () => {
      if (clausesNodeList && clausesNodeList.length > 0 && !clauseTimer) {
        let cIdx = 0;
        clausesNodeList[0].classList.add('clause-speaking-now');
        clauseTimer = setInterval(() => {
          clausesNodeList.forEach((c) => c.classList.remove('clause-speaking-now'));
          cIdx = (cIdx + 1) % clausesNodeList.length;
          clausesNodeList[cIdx].classList.add('clause-speaking-now');
        }, 3800);
      }
    };

    const speakFallback = (force = false) => {
      lastFallbackContext = { fallbackText, btnEl, waveformEl, clausesNodeList };

      // High-standard filter: Do not automatically foist robotic SAPI desktop voices on the student
      const hasQualityVoice = hasHighQualityBritishVoice();
      if (!hasQualityVoice && !force) {
        stopNarration();
        if (btnEl) {
          const lbl = btnEl.querySelector('.da-reader-btn-label');
          if (lbl) lbl.textContent = '🎙️ Studio British Audio in Production';
        }
        // Surface helpful, dignified explanation with opt-in control
        const parentBar = (waveformEl && waveformEl.closest('.da-audio-reader-bar')) || (btnEl && btnEl.closest('.da-audio-reader-bar'));
        if (parentBar && !parentBar.querySelector('.da-synth-quality-notice')) {
          const notice = document.createElement('div');
          notice.className = 'da-synth-quality-notice';
          notice.style.cssText = 'width:100%; margin-top:0.6rem; font-size:0.78rem; color:#fde68a; background:rgba(245,158,11,0.12); border-left:3px solid #f59e0b; padding:0.5rem 0.8rem; border-radius:4px; display:flex; align-items:center; justify-content:space-between; gap:0.6rem; flex-wrap:wrap;';
          notice.innerHTML = `
            <span>🎙️ <strong>Studio British Reading in Production:</strong> Metallic computer speech has been paused to maintain Cambridge pronunciation standards.</span>
            <button type="button" class="da-hud-pill" style="font-size:0.74rem; padding:0.25rem 0.65rem; cursor:pointer;" onclick="DarkAcademiaAtmosphere.speakFallbackExplicit()">
              ▶ Play System Voice (Experimental)
            </button>
          `;
          parentBar.appendChild(notice);
        }
        return;
      }

      startFallbackClauseTimer();
      if ('speechSynthesis' in window && fallbackText) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(fallbackText);
          utter.lang = 'en-GB';
          const bestVoice = selectBestBritishVoice();
          if (bestVoice) utter.voice = bestVoice;
          utter.rate = 0.94;
          utter.onend = () => stopNarration();
          utter.onerror = () => stopNarration();
          window.speechSynthesis.speak(utter);
          syncVoiceHUD(true);
          return;
        } catch (e) {}
      }
      setTimeout(() => stopNarration(), 4000);
    };

    if (mp3Src && typeof Audio !== 'undefined') {
      try {
        if (!voiceAudioEl) {
          voiceAudioEl = new Audio();
          voiceAudioEl.preload = 'auto';
        }
        voiceAudioEl.src = mp3Src;
        voiceAudioEl.volume = 1.0;
        voiceAudioEl.ontimeupdate = () => {
          if (!clauseWindows.length || !voiceAudioEl.duration) return;
          const progress = voiceAudioEl.currentTime / voiceAudioEl.duration;
          clauseWindows.forEach((w) => {
            const active = progress >= w.startRatio && progress <= w.endRatio;
            w.el.classList.toggle('clause-speaking-now', active);
          });
        };
        voiceAudioEl.onended = () => stopNarration();
        voiceAudioEl.onerror = () => speakFallback(false);
        const p = voiceAudioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => speakFallback(false));
        }
        return;
      } catch (e) {}
    }
    speakFallback(false);
  }

  function speakFallbackExplicit() {
    if (lastFallbackContext) {
      const { fallbackText, btnEl, waveformEl, clausesNodeList } = lastFallbackContext;
      if (btnEl) {
        btnEl.classList.add('speaking');
        const lbl = btnEl.querySelector('.da-reader-btn-label');
        if (lbl) lbl.textContent = '⏹ Stop Reading';
      }
      if (waveformEl) waveformEl.classList.add('active');
      setMusicDucking(true);
      syncVoiceHUD(true);

      if ('speechSynthesis' in window && fallbackText) {
        try {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(fallbackText);
          utter.lang = 'en-GB';
          const bestVoice = selectBestBritishVoice();
          if (bestVoice) utter.voice = bestVoice;
          utter.rate = 0.94;
          utter.onend = () => stopNarration();
          utter.onerror = () => stopNarration();
          window.speechSynthesis.speak(utter);
          return;
        } catch (e) {}
      }
    }
  }

  const VOCAB_SPRITE_SRC = 'assets/audio/da_vocab_lexicon.mp3?v=2';
  const VOCAB_SPRITE_INDEX = {
    'abhor': [0.0, 1.872],
    'abhorrence': [1.872, 3.744],
    'albeit': [3.744, 5.616],
    'apprehensive': [5.616, 7.488],
    'audacious': [7.488, 9.36],
    'audacity': [9.36, 11.232],
    'beetling / frowning crags': [11.232, 13.944],
    'beetling crags': [13.944, 15.816],
    'begone!': [15.816, 17.688],
    'benevolence': [17.688, 19.56],
    'benevolent': [19.56, 21.432],
    'bight': [21.432, 23.304],
    'brougham': [23.304, 25.176],
    'bulwark': [25.176, 27.048],
    'calamity': [27.048, 28.44],
    'callous': [28.44, 30.312],
    'calèche': [30.312, 32.184],
    'catastrophe': [32.184, 34.056],
    'catastrophic': [34.056, 35.928],
    'charnel-house': [35.928, 37.8],
    'cheval-glass': [37.8, 39.672],
    'circumstantial': [39.672, 41.544],
    'corroborate': [41.544, 43.416],
    'corroboration': [43.416, 45.288],
    'countenance': [45.288, 47.16],
    'coxswain': [47.16, 49.032],
    'cromlech': [49.032, 50.904],
    'daemon / fiend': [50.904, 52.944],
    'delineate': [52.944, 54.816],
    'depravity': [54.816, 56.688],
    'derelict': [56.688, 58.56],
    'desolate': [58.56, 60.432],
    'detestable': [60.432, 62.304],
    'dewlap': [62.304, 64.176],
    'disclose': [64.176, 66.048],
    'draught': [66.048, 67.92],
    'duplicity': [67.92, 69.792],
    'extricate': [69.792, 71.664],
    'extricate (oneself from)': [71.664, 74.352],
    'facade': [74.352, 76.224],
    'faggot': [76.224, 78.096],
    'fallacy': [78.096, 79.968],
    'formidable': [79.968, 81.84],
    'hansom': [81.84, 83.712],
    'hemmed in (by)': [83.712, 85.584],
    'hovel': [85.584, 87.456],
    'impenetrable': [87.456, 89.328],
    'imperious': [89.328, 91.2],
    'implausible': [91.2, 93.072],
    'incongruous': [93.072, 94.944],
    'inexorable': [94.944, 96.816],
    'inexorably': [96.816, 98.688],
    'jowl / muzzle': [98.688, 100.584],
    'juggernaut': [100.584, 102.456],
    'link-boy': [102.456, 104.328],
    'manifold': [104.328, 106.2],
    'melancholy': [106.2, 108.072],
    'minim': [108.072, 109.944],
    'moor-gate / wicket-gate': [109.944, 112.44],
    'nay': [112.44, 114.312],
    'ostracise': [114.312, 116.184],
    'ostracism': [116.184, 118.056],
    'perforce': [118.056, 119.928],
    'pernicious': [119.928, 121.8],
    'phial': [121.8, 123.672],
    'plausible': [123.672, 125.544],
    'premeditated': [125.544, 127.416],
    'quagmire': [127.416, 129.288],
    'repudiate': [129.288, 131.16],
    'repugnance': [131.16, 133.032],
    'repugnant': [133.032, 134.904],
    'sawbones': [134.904, 136.776],
    'scion': [136.776, 138.648],
    'sinister': [138.648, 140.52],
    'spectral': [140.52, 142.392],
    'spurn': [142.392, 144.264],
    'succour': [144.264, 146.136],
    'thou / thee / thy / wilt': [146.136, 149.568],
    'thou / thy': [149.568, 151.44],
    'toils': [151.44, 153.312],
    'treacherous': [153.312, 155.184],
    'trepidation': [155.184, 157.056],
    'ulster': [157.056, 158.928],
    'unaccountably': [158.928, 160.8],
    'unquenchable': [160.8, 162.672],
    'wagonette': [162.672, 164.544],
    'wicket-gate': [164.544, 166.416],
    'wretch': [166.416, 167.448],
    'yonder': [167.448, 168.6]
  };

  function pronounceText(text, triggerBtn) {
    if (!text) return;
    if (triggerBtn && triggerBtn.classList.contains('speaking')) {
      stopNarration();
      return;
    }
    stopNarration();

    if (triggerBtn) {
      triggerBtn.classList.add('speaking');
    }
    syncVoiceHUD(true);

    const key = text.replace(/\s+/g, ' ').trim().toLowerCase();
    const range = VOCAB_SPRITE_INDEX[key];

    if (range && typeof Audio !== 'undefined') {
      try {
        if (!voiceAudioEl) {
          voiceAudioEl = new Audio();
          voiceAudioEl.preload = 'auto';
        }
        const [startSec, endSec] = range;
        const startPlayback = () => {
          try {
            voiceAudioEl.currentTime = startSec;
            voiceAudioEl.ontimeupdate = () => {
              if (voiceAudioEl.currentTime >= endSec - 0.04) {
                voiceAudioEl.ontimeupdate = null;
                stopNarration();
              }
            };
            voiceAudioEl.onended = () => stopNarration();
            const p = voiceAudioEl.play();
            if (p && typeof p.catch === 'function') {
              p.catch(() => stopNarration());
            }
          } catch (e) {
            stopNarration();
          }
        };

        if (!voiceAudioEl.src || !voiceAudioEl.src.includes('da_vocab_lexicon.mp3')) {
          voiceAudioEl.src = VOCAB_SPRITE_SRC;
          voiceAudioEl.volume = 1.0;
          voiceAudioEl.addEventListener('loadedmetadata', startPlayback, { once: true });
          voiceAudioEl.load();
        } else {
          startPlayback();
        }
        return;
      } catch (e) {}
    }

    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'en-GB';
        const bestVoice = selectBestBritishVoice();
        if (bestVoice) utter.voice = bestVoice;
        utter.rate = 0.92;
        utter.onend = () => stopNarration();
        utter.onerror = () => stopNarration();
        window.speechSynthesis.speak(utter);
      } else {
        stopNarration();
      }
    } catch (e) {
      stopNarration();
    }
  }

  /* ==============================================================
     PERSISTENT SCHOLAR'S ATMOSPHERIC HUD BAR
     ============================================================== */
  function injectScholarHUD() {
    if (document.getElementById('da-scholar-hud')) return;
    const container =
      document.querySelector('.container') ||
      document.querySelector('.compendium-container');
    if (!container) return;

    try {
      if (localStorage.getItem('da_parchment_mode') === '1') {
        document.body.classList.add('da-parchment-mode');
      }
    } catch (e) {}

    const isHub = Boolean(document.querySelector('.portal-hero'));
    const hud = document.createElement('div');
    hud.id = 'da-scholar-hud';
    hud.className = 'da-scholar-hud';
    hud.setAttribute('role', 'region');
    hud.setAttribute('aria-label', 'Dark Academia Atmosphere & Sound Controls');

    hud.innerHTML = `
      <div class="da-hud-left">
        <a href="lab.html" class="da-hud-pill" title="Return to The Gareth English Interactive Lab">
          <span>← Interactive Lab</span>
        </a>
        ${
          !isHub
            ? `<a href="dark-academia-index.html" class="da-hud-pill" title="Return to Dark Academia Course Hub">
                 <span>§</span>
                 <span>Course Hub (12 Lessons)</span>
               </a>`
            : `<span class="da-hud-pill" style="cursor:default; border-color:rgba(197,160,89,0.45); color:#e6d3a7;">
                 <span>✦</span>
                 <span>The Gothic Canon • C1/C2 Literary Edition</span>
               </span>`
        }
      </div>

      <div class="da-hud-right">
        <button type="button" id="da-hud-voice-stop" class="da-hud-pill da-voice-stop-pill" onclick="DarkAcademiaAtmosphere.stopVoice()" title="Stop Voice Narration (Esc)" style="display:none;">
          <span>⏹</span>
          <span>Stop Voice</span>
        </button>

        <div class="da-hud-music-group" role="group" aria-label="Study Music Controls">
          <button type="button" id="da-hud-music-toggle" onclick="DarkAcademiaAtmosphere.toggleMusic()">
            <span id="da-hud-music-icon">♪</span>
            <span id="da-hud-music-status">Study Audio: Off</span>
          </button>
          <button type="button" id="da-hud-music-next" onclick="DarkAcademiaAtmosphere.nextTrack()" title="Switch Classical Track">
            <span>▸</span>
            <span id="da-hud-track-name">Midnight Rain &amp; Cello</span>
          </button>
        </div>

        <button type="button" id="da-hud-sfx-btn" class="da-hud-pill active-sound" onclick="DarkAcademiaAtmosphere.toggleSFX()">
          <span id="da-hud-sfx-label">SFX: ON</span>
        </button>

        <button type="button" id="da-hud-theme-btn" class="da-hud-pill" onclick="DarkAcademiaAtmosphere.toggleParchmentMode()">
          <span id="da-hud-theme-icon">✦</span>
          <span id="da-hud-theme-label">Candlelight</span>
        </button>
      </div>
    `;

    container.insertBefore(hud, container.firstChild);
    syncHUD();
  }

  function syncHUD() {
    const toggleBtn = document.getElementById('da-hud-music-toggle');
    const statusEl = document.getElementById('da-hud-music-status');
    const trackEl = document.getElementById('da-hud-track-name');
    const sfxBtn = document.getElementById('da-hud-sfx-btn');
    const sfxLbl = document.getElementById('da-hud-sfx-label');
    const themeLbl = document.getElementById('da-hud-theme-label');
    const themeIcon = document.getElementById('da-hud-theme-icon');

    const track = SOUNDSCAPE_TRACKS[currentTrackIdx % SOUNDSCAPE_TRACKS.length];
    if (toggleBtn) toggleBtn.classList.toggle('playing', musicPlaying);
    if (statusEl) statusEl.textContent = musicPlaying ? 'Playing' : 'Study Audio: Off';
    if (trackEl && track) trackEl.textContent = track.name;
    if (sfxBtn) sfxBtn.classList.toggle('active-sound', sfxEnabled);
    if (sfxLbl) sfxLbl.textContent = sfxEnabled ? 'SFX: ON' : 'SFX: OFF';

    const isParchment = document.body.classList.contains('da-parchment-mode');
    if (themeLbl) themeLbl.textContent = isParchment ? 'Parchment' : 'Candlelight';
    if (themeIcon) themeIcon.textContent = isParchment ? '§' : '✦';
  }

  /* ==============================================================
     CLASSICAL MUSEUM OIL PAINTING RENDERER (NO SYNTHETIC NEON VFX)
     ============================================================== */
  function drawAtmosphericCanvas(ctx, W, H, keyOrUnitId, timestamp, parallaxX = 0, parallaxY = 0) {
    const t = timestamp * 0.001;
    ctx.clearRect(0, 0, W, H);

    const img = getBookImage(keyOrUnitId);
    if (img && img.complete && img.naturalWidth > 0) {
      // Aspect-preserving cover crop with very subtle museum gallery drift
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const canvasAspect = W / H;
      let baseW, baseH;
      if (imgAspect > canvasAspect) {
        baseH = H;
        baseW = H * imgAspect;
      } else {
        baseW = W;
        baseH = W / imgAspect;
      }
      const zoom = 1.02 + 0.01 * Math.sin(t * 0.18);
      const dw = baseW * zoom;
      const dh = baseH * zoom;
      const dx = (W - dw) * 0.5 + parallaxX * 6;
      const dy = (H - dh) * 0.42 + parallaxY * 4;
      ctx.drawImage(img, dx, dy, dw, dh);
    } else {
      const bgGrad = ctx.createLinearGradient(0, 0, W, H);
      if (String(keyOrUnitId || '').toLowerCase().includes('alice')) {
        bgGrad.addColorStop(0, '#2e1065');
        bgGrad.addColorStop(1, '#090314');
      } else {
        bgGrad.addColorStop(0, '#16120f');
        bgGrad.addColorStop(1, '#0c0a08');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);
    }

    // Subtle classical museum frame vignette (no artificial coloured circles or neon bokeh)
    const vig = ctx.createRadialGradient(W * 0.5, H * 0.5, Math.min(W, H) * 0.28, W * 0.5, H * 0.5, Math.max(W, H) * 0.72);
    vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vig.addColorStop(1, 'rgba(10, 8, 6, 0.52)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  /* ==============================================================
      HUB SHOWCASE: 4-PLATE FINE ART GALLERY & ILLUSTRATED CARDS
     ============================================================== */
  let hubCinemaIdx = 0;
  let hubParallax = { x: 0, y: 0 };

  function initHubShowcase() {
    const hero = document.querySelector('.portal-hero');
    if (!hero || document.getElementById('da-cinema-stage')) return;

    // Preload all 4 book paintings and 12 unit paintings
    ['dracula', 'frankenstein', 'jekyll', 'baskerville'].forEach(getBookImage);
    Object.keys(UNIT_PAINTINGS).forEach(getBookImage);

    const stage = document.createElement('section');
    stage.id = 'da-cinema-stage';
    stage.className = 'da-cinema-stage';
    stage.setAttribute('aria-label', '19th-Century Fine Art & Audio Plate Gallery');

    stage.innerHTML = `
      <div class="da-cinema-topbar">
        <span class="da-cinema-eyebrow">
          <span>✦</span>
          <span>19th-Century Fine Art Plates &amp; Dramatic Readings</span>
        </span>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="da-hud-pill" onclick="DarkAcademiaAtmosphere.playCurrentBookOverview(this)">
            <span>♪</span>
            <span class="da-reader-btn-label">Listen to Book Overview</span>
          </button>
          <button type="button" class="da-hud-pill" onclick="DarkAcademiaAtmosphere.toggleMusic()">
            <span>✦</span>
            <span>Toggle Study Ambience</span>
          </button>
        </div>
      </div>

      <div class="da-cinema-tabs" role="tablist" aria-label="Select a Classic Gothic Novel">
        <button type="button" class="da-cinema-tab active" data-act-idx="0" onclick="DarkAcademiaAtmosphere.setCinemaAct(0, true)">
          <strong>I. Dracula (1897)</strong>
          <span>Caspar David Friedrich (1810)</span>
        </button>
        <button type="button" class="da-cinema-tab" data-act-idx="1" onclick="DarkAcademiaAtmosphere.setCinemaAct(1, true)">
          <strong>II. Frankenstein (1818)</strong>
          <span>Joseph Wright of Derby (1768)</span>
        </button>
        <button type="button" class="da-cinema-tab" data-act-idx="2" onclick="DarkAcademiaAtmosphere.setCinemaAct(2, true)">
          <strong>III. Jekyll &amp; Hyde (1886)</strong>
          <span>John Atkinson Grimshaw (1880)</span>
        </button>
        <button type="button" class="da-cinema-tab" data-act-idx="3" onclick="DarkAcademiaAtmosphere.setCinemaAct(3, true)">
          <strong>IV. Baskervilles (1901)</strong>
          <span>Caspar David Friedrich (1819)</span>
        </button>
      </div>

      <div class="da-cinema-viewport" id="da-cinema-viewport">
        <canvas id="da-cinema-canvas" class="da-cinema-canvas" width="960" height="492"></canvas>
        <div class="da-museum-plaque" id="da-cinema-museum-credit">${BOOK_CINEMA_ACTS[0].museumCredit}</div>
        <div class="da-cinema-overlay">
          <div class="da-cinema-caption-box">
            <span class="da-cinema-book-tag" id="da-cinema-book-tag">${BOOK_CINEMA_ACTS[0].title}</span>
            <div class="da-cinema-quote" id="da-cinema-quote">${BOOK_CINEMA_ACTS[0].quote}</div>
            <div class="da-cinema-grammar-note" id="da-cinema-grammar">${BOOK_CINEMA_ACTS[0].grammarFocus}</div>
          </div>
          <div class="da-cinema-controls">
            <a href="${BOOK_CINEMA_ACTS[0].freeUrl}" id="da-cinema-cta" class="da-btn-gold" style="text-decoration:none; font-size:0.86rem; padding:0.65rem 1.1rem;">
              ${BOOK_CINEMA_ACTS[0].freeLabel}
            </a>
          </div>
        </div>
      </div>
    `;

    hero.insertAdjacentElement('afterend', stage);

    const vp = document.getElementById('da-cinema-viewport');
    if (vp) {
      vp.addEventListener('mousemove', (e) => {
        const rect = vp.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        hubParallax.x = (e.clientX - rect.left) / rect.width - 0.5;
        hubParallax.y = (e.clientY - rect.top) / rect.height - 0.5;
      });
    }

    // Assign each unit card its own distinct 18th/19th-century fine art plate
    document.querySelectorAll('.unit-card').forEach((card) => {
      if (card.querySelector('.unit-art-strip')) return;
      const rawId = (card.id || '').replace(/^card-/, '') || card.getAttribute('data-unit-id') || '';
      const bKey = ['dracula', 'frankenstein', 'jekyll', 'baskerville', 'alice'].find((k) => 
        card.classList.contains(k) || card.classList.contains(`${k}-card`)
      ) || (rawId.includes('alice') ? 'alice' : 'dracula');
      const plate = UNIT_PAINTINGS[rawId] || UNIT_PAINTINGS[`${bKey}_unit1`];
      if (plate) {
        const strip = document.createElement('div');
        strip.className = 'unit-art-strip';
        strip.style.backgroundImage = `url('${plate.src}')`;
        strip.innerHTML = `<span class="unit-art-credit">${plate.credit}</span>`;
        card.insertBefore(strip, card.firstChild);
      }
    });

    const canvas = document.getElementById('da-cinema-canvas');
    if (canvas && canvas.getContext) {
      const ctx = canvas.getContext('2d');
      const loop = (ts) => {
        const act = BOOK_CINEMA_ACTS[hubCinemaIdx % BOOK_CINEMA_ACTS.length];
        drawAtmosphericCanvas(ctx, canvas.width, canvas.height, act.bookKey, ts, hubParallax.x, hubParallax.y);
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }
  }

  function setCinemaAct(idx, autoSpeak = false) {
    hubCinemaIdx = idx % BOOK_CINEMA_ACTS.length;
    const act = BOOK_CINEMA_ACTS[hubCinemaIdx];
    playSFX('page');

    document.querySelectorAll('.da-cinema-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === hubCinemaIdx);
    });

    const tagEl = document.getElementById('da-cinema-book-tag');
    const quoteEl = document.getElementById('da-cinema-quote');
    const gramEl = document.getElementById('da-cinema-grammar');
    const ctaEl = document.getElementById('da-cinema-cta');
    const creditEl = document.getElementById('da-cinema-museum-credit');

    if (tagEl) tagEl.textContent = act.title;
    if (quoteEl) quoteEl.textContent = act.quote;
    if (gramEl) gramEl.textContent = act.grammarFocus;
    if (creditEl && act.museumCredit) creditEl.textContent = act.museumCredit;
    if (ctaEl) {
      ctaEl.href = act.freeUrl;
      ctaEl.textContent = act.freeLabel;
    }

    if (autoSpeak) {
      playDramaticExtract(act.audioSrc, `${act.title}. ${act.quote} ${act.grammarFocus}`, null, null, null);
    }
  }

  function playCurrentBookOverview(btnEl) {
    const act = BOOK_CINEMA_ACTS[hubCinemaIdx % BOOK_CINEMA_ACTS.length];
    if (btnEl && !btnEl.dataset.defaultLabel) {
      btnEl.dataset.defaultLabel = 'Listen to Book Overview';
    }
    playDramaticExtract(act.audioSrc, `${act.title}. ${act.quote} ${act.grammarFocus}`, btnEl, null, null);
  }

  /* ==============================================================
     LESSON PAGE UPGRADE: MUSEUM OIL PAINTING PLATE + AUDIO READER
     ============================================================== */
  function initLesson(unitId) {
    injectScholarHUD();
    const bookKey = detectBookKey(unitId);
    const bookTrackMap = { dracula: 2, frankenstein: 0, jekyll: 1, baskerville: 2 };
    if (typeof bookTrackMap[bookKey] === 'number' && !musicPlaying) {
      currentTrackIdx = bookTrackMap[bookKey];
    }
    if (!musicPlaying && !userMutedMusic) {
      startMusic();
    }
    const paintKey = UNIT_PAINTINGS[unitId] ? unitId : bookKey;
    const plateInfo = UNIT_PAINTINGS[unitId] || UNIT_PAINTINGS[`${bookKey}_unit1`];
    getBookImage(paintKey);

    // 1. Upgrade .scene-illustration-frame with museum oil painting plate
    const sceneFrame = document.querySelector('.scene-illustration-frame');
    if (sceneFrame && !sceneFrame.classList.contains('has-painted-vfx')) {
      const origSvg = sceneFrame.querySelector('svg');
      const captionBar = sceneFrame.querySelector('.scene-caption-bar');
      sceneFrame.classList.add('has-painted-vfx');

      const stage = document.createElement('div');
      stage.className = 'da-scene-stage';

      const canvas = document.createElement('canvas');
      canvas.className = 'da-lesson-vfx-canvas';
      canvas.width = 640;
      canvas.height = 270;
      stage.appendChild(canvas);

      if (plateInfo && plateInfo.credit) {
        const plaque = document.createElement('div');
        plaque.className = 'da-museum-plaque';
        plaque.textContent = plateInfo.credit;
        stage.appendChild(plaque);
      }

      if (origSvg) {
        origSvg.classList.add('original-scene-svg');
        stage.appendChild(origSvg);
      }

      const controls = document.createElement('div');
      controls.className = 'da-scene-controls-overlay';
      controls.innerHTML = `
        <button type="button" class="da-scene-mini-btn" onclick="DarkAcademiaAtmosphere.toggleSceneBlueprint(this)">
          § View Structural Diagram
        </button>
      `;
      stage.appendChild(controls);

      sceneFrame.insertBefore(stage, captionBar || sceneFrame.firstChild);

      if (canvas.getContext) {
        const ctx = canvas.getContext('2d');
        const renderLessonCanvas = (ts) => {
          drawAtmosphericCanvas(ctx, canvas.width, canvas.height, paintKey, ts, 0, 0);
          requestAnimationFrame(renderLessonCanvas);
        };
        requestAnimationFrame(renderLessonCanvas);
      }
    }

    // 2. Inject Dramatic British Audio Reader Bar inside .reading-frame
    const readingFrame = document.querySelector('.reading-frame');
    if (readingFrame && !readingFrame.querySelector('.da-audio-reader-bar')) {
      const clauses = readingFrame.querySelectorAll('.highlight-clause');
      const clone = readingFrame.cloneNode(true);
      clone.querySelectorAll('div, cite').forEach((n) => n.remove());
      const cleanExtractText = clone.textContent.replace(/\s+/g, ' ').trim();
      const mp3Src = `assets/audio/extract_${unitId}.mp3?v=2`;

      const readerBar = document.createElement('div');
      readerBar.className = 'da-audio-reader-bar';
      readerBar.innerHTML = `
        <div style="display:flex; align-items:center; gap:0.65rem; flex-wrap:wrap;">
          <button type="button" class="da-reader-btn" data-default-label="Listen to Original Novel Extract">
            <span>♪</span>
            <span class="da-reader-btn-label">Listen to Original Novel Extract</span>
          </button>
          <div class="da-waveform" aria-hidden="true">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>
        <span style="font-size:0.78rem; color:#d8cfc0; font-style:italic; font-family:var(--serif);">
          British English Dramatic Reading — Highlighted clauses illuminate in sequence
        </span>
      `;

      const playBtn = readerBar.querySelector('.da-reader-btn');
      const waveEl = readerBar.querySelector('.da-waveform');
      playBtn.addEventListener('click', () => {
        playDramaticExtract(mp3Src, cleanExtractText, playBtn, waveEl, clauses);
      });

      readingFrame.insertBefore(readerBar, readingFrame.firstChild);
    }

    // 3. Add "🔊 Listen" buttons to Victorian vs. Modern C1/C2 Style-Shift panes (backed by Neural MP3s)
    document.querySelectorAll('.shift-pane').forEach((pane, idx) => {
      const labelEl = pane.querySelector('.shift-label');
      const textEl = pane.querySelector('.shift-text');
      if (!labelEl || !textEl || labelEl.querySelector('.da-pronounce-btn')) return;

      const shiftMp3 = `assets/audio/shift_${unitId}_${idx}.mp3?v=2`;
      const cleanShiftText = textEl.textContent.replace(/\s+/g, ' ').trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'da-pronounce-btn da-reader-btn';
      btn.dataset.defaultLabel = '🔊 Listen';
      btn.innerHTML = '<span class="da-reader-btn-label">🔊 Listen</span>';
      btn.addEventListener('click', () => {
        playDramaticExtract(shiftMp3, cleanShiftText, btn, null, null);
      });
      labelEl.appendChild(btn);
    });

    // 4. Add "🔊" pronunciation buttons to every .lex-item and .sort-word
    document.querySelectorAll('.lex-item strong').forEach((strongEl) => {
      if (strongEl.parentElement.querySelector('.da-pronounce-btn')) return;
      const word = strongEl.textContent.trim();
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'da-pronounce-btn';
      btn.title = `Hear British pronunciation of "${word}"`;
      btn.innerHTML = '🔊';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        pronounceText(word, btn);
      });
      strongEl.insertAdjacentElement('afterend', btn);
    });

    document.querySelectorAll('.sort-word').forEach((wordEl) => {
      if (wordEl.querySelector('.da-pronounce-btn')) return;
      const firstNode = wordEl.childNodes[0];
      const word = firstNode ? firstNode.textContent.trim() : '';
      if (!word) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'da-pronounce-btn';
      btn.title = `Hear pronunciation of "${word}"`;
      btn.innerHTML = '🔊';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        pronounceText(word, btn);
      });
      const spanEl = wordEl.querySelector('span');
      if (spanEl) {
        wordEl.insertBefore(btn, spanEl);
      } else {
        wordEl.appendChild(btn);
      }
    });
  }

  function toggleSceneBlueprint(btnEl) {
    const frame = btnEl.closest('.scene-illustration-frame');
    if (!frame) return;
    const showingBlueprint = frame.classList.toggle('show-blueprint-svg');
    playSFX('page');
    btnEl.textContent = showingBlueprint ? '✦ View Oil Painting Plate' : '§ View Structural Diagram';
  }

  function initGlobal() {
    injectScholarHUD();
    initHubShowcase();
    const bookKey = detectBookKey();
    const bookTrackMap = { dracula: 2, frankenstein: 0, jekyll: 1, baskerville: 2, alice: 2 };
    if (typeof bookTrackMap[bookKey] === 'number') {
      currentTrackIdx = bookTrackMap[bookKey];
    }
    if (!musicPlaying && !userMutedMusic) {
      startMusic();
    }
  }

  return {
    initGlobal,
    initLesson,
    toggleMusic,
    nextTrack,
    toggleSFX,
    toggleParchmentMode,
    playSFX,
    setCinemaAct,
    playCurrentBookOverview,
    toggleSceneBlueprint,
    pronounceText,
    stopVoice: stopNarration,
    speakFallbackExplicit
  };
})();

window.DarkAcademiaAtmosphere = DarkAcademiaAtmosphere;

function initDarkAcademiaBootstrap() {
  DarkAcademiaGate.checkUrlUnlock();
  DarkAcademiaGate.syncUI();
  if (window.DarkAcademiaAtmosphere && typeof window.DarkAcademiaAtmosphere.initGlobal === 'function') {
    DarkAcademiaAtmosphere.initGlobal();
  }
  if (!window.GarethTeacherWhiteLabel && !document.querySelector('script[src*="teacher-white-label.js"]')) {
    const wlScript = document.createElement('script');
    wlScript.src = 'teacher-white-label.js';
    wlScript.defer = true;
    document.head.appendChild(wlScript);
  }
  if (!window.CandidateDossier && !document.querySelector('script[src*="dossier.js"]')) {
    const dScript = document.createElement('script');
    dScript.src = 'dossier.js';
    dScript.defer = true;
    document.head.appendChild(dScript);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initDarkAcademiaBootstrap);
} else {
  initDarkAcademiaBootstrap();
}


