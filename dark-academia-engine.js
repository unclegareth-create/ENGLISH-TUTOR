/**
 * ==========================================================================
 * Dark Academia: The Gothic Canon — Interactive Learning Engine & £24 Paywall Gate
 * Handles:
 * - £24 Stripe Self-Serve Paywall Gate (5 Free Unit 1s + 10 Gated Advanced Units + Compendium)
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
      'alice_unit2', 'alice_unit3',
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
          All 15 Lessons and the Printable Study Guide &amp; Answer Key are now unlocked on this browser. Save your backup Access Code for phones or other devices: <code style="background:#022c22;padding:0.15rem 0.45rem;border-radius:4px;border:1px solid #10b981;color:#fde68a;font-weight:800;">${backupCode}</code>
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
          '<span>Unlock All 15 Lessons — £24</span><span aria-hidden="true">→</span>';
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
    const reg37Error = modal.querySelector('#da-modal-reg37-error');
    const reg37Wrap = modal.querySelector('#da-modal-reg37-wrap');
    if (reg37Error) reg37Error.style.display = 'none';
    if (reg37Wrap) {
      reg37Wrap.style.borderColor = 'rgba(228,200,140,0.35)';
      reg37Wrap.style.background = 'rgba(15,23,42,0.75)';
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

  handleStripeCheckoutClick(event, checkboxId, wrapId, errorId) {
    const checkbox = document.getElementById(checkboxId);
    const wrap = document.getElementById(wrapId);
    const errorEl = document.getElementById(errorId);
    if (!checkbox || !checkbox.checked) {
      if (event) event.preventDefault();
      if (wrap) {
        wrap.style.borderColor = '#ef4444';
        wrap.style.background = 'rgba(127, 29, 29, 0.28)';
      }
      if (errorEl) {
        errorEl.style.display = 'block';
        errorEl.textContent = 'Please tick the box above to confirm immediate digital access before proceeding to Stripe checkout.';
      }
      if (checkbox) checkbox.focus();
      return false;
    }
    try {
      localStorage.setItem('da_reg37_consent_ts', new Date().toISOString());
    } catch (e) {}
    return true;
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
          <h2 id="modal-gate-title" class="da-modal-title">Unlock the Complete 15-Lesson Course</h2>
          <p class="da-modal-subtitle">
            Lesson 1 of each book is free to try. Unlock all 10 Advanced Lessons across <em>Dracula</em>, <em>Frankenstein</em>, <em>Jekyll &amp; Hyde</em>, <em>The Hound of the Baskervilles</em>, and <em>Alice in Wonderland</em> (+ the Printable Study Guide &amp; Complete Answer Key) for <strong>£24</strong> (one-time payment, lifetime access).
          </p>
        </div>

        <div class="da-modal-benefits">
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>All 15 Interactive C1/C2 Lessons:</strong> Complete 3-part modules for <em>Dracula</em>, <em>Frankenstein</em>, <em>Dr Jekyll &amp; Mr Hyde</em>, <em>The Hound of the Baskervilles</em>, and <em>Alice in Wonderland</em>.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>75 Interactive Key Word Transformations:</strong> With tap-to-build word tiles, instant hints, and Cambridge C1/C2 feedback.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>Modern Exam Writing Practice:</strong> Learn how to use every grammar pattern naturally in IELTS &amp; Cambridge essays, reviews, and reports.</span>
          </div>
          <div class="da-benefit-item">
            <span class="da-benefit-icon">✓</span>
            <span><strong>Printable Study Guide &amp; Answer Key:</strong> Complete grammar cheat sheet, vocabulary filter, and all 225 answers.</span>
          </div>
        </div>

        <div id="da-modal-reg37-wrap" style="background:rgba(15,23,42,0.75);border:1px solid rgba(228,200,140,0.35);border-radius:10px;padding:0.7rem 0.85rem;margin-bottom:0.75rem;text-align:left;transition:border-color 0.2s,background 0.2s;">
          <label for="da-modal-reg37-check" style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.8rem;color:#e6dcc8;line-height:1.45;">
            <input type="checkbox" id="da-modal-reg37-check" style="margin-top:0.2rem;width:16px;height:16px;accent-color:#d4af37;cursor:pointer;flex-shrink:0;">
            <span>I agree to immediate access to this digital pack and acknowledge that I lose my 14-day right to a refund once accessed (<a href="terms.html#digital-content" style="color:#e4c88c;text-decoration:underline;">UK Digital Content Terms</a>).</span>
          </label>
          <div id="da-modal-reg37-error" role="alert" aria-live="polite" style="display:none;color:#fca5a5;font-size:0.76rem;font-weight:700;margin-top:0.45rem;">
            Please tick the box above to confirm immediate digital access before proceeding to Stripe checkout.
          </div>
        </div>

        <a href="${this.STRIPE_LINK}" class="da-btn-stripe" id="da-modal-stripe-btn" onclick="return DarkAcademiaGate.handleStripeCheckoutClick(event, 'da-modal-reg37-check', 'da-modal-reg37-wrap', 'da-modal-reg37-error')">
          <span>Unlock Instant Access via Stripe (£24)</span>
          <span aria-hidden="true">→</span>
        </a>

        <div class="da-passkey-box" style="margin-top:0.85rem;">
          <p>Already purchased? Enter your <strong>Access Code</strong> from your confirmation screen:</p>
          <div class="da-passkey-row">
            <input type="text" class="da-passkey-input" id="da-modal-passkey" placeholder="ENTER ACCESS CODE" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Course access code input">
            <button class="da-passkey-btn" onclick="DarkAcademiaGate.submitPasskey()">Unlock</button>
          </div>
          <div class="da-passkey-feedback" id="da-modal-feedback"></div>
          <p style="font-size:0.74rem;color:#b5a792;margin-top:0.5rem;">
            Lost your access code or need billing/refund help? <a href="index.html?support=billing#enquiry-card" style="color:#e4c88c;text-decoration:underline;">Contact Billing &amp; Access Support (24h resolution)</a>.
          </p>
        </div>
      </div>
    `;

    const reg37Checkbox = backdrop.querySelector('#da-modal-reg37-check');
    if (reg37Checkbox) {
      reg37Checkbox.addEventListener('change', () => {
        if (reg37Checkbox.checked) {
          const wrap = backdrop.querySelector('#da-modal-reg37-wrap');
          const err = backdrop.querySelector('#da-modal-reg37-error');
          if (wrap) {
            wrap.style.borderColor = 'rgba(228,200,140,0.35)';
            wrap.style.background = 'rgba(15,23,42,0.75)';
          }
          if (err) err.style.display = 'none';
        }
      });
    }

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
          window.location.pathname.includes('unit14') ||
          window.location.pathname.includes('unit15') ||
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
      'alice_unit2', 'alice_unit3',
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
                The first lesson of each book is free to try. Unlock all 15 lessons across <em>Dracula</em>, <em>Frankenstein</em>, <em>Jekyll &amp; Hyde</em>, <em>The Hound of the Baskervilles</em>, and <em>Alice in Wonderland</em> + the Printable Study Guide &amp; Answer Key.
              </p>
            </div>

            <div class="da-modal-benefits">
              <div class="da-benefit-item">
                <span class="da-benefit-icon">✓</span>
                <span>Full access to all 15 Interactive C1/C2 Lessons + the Printable Study Guide &amp; Complete Answer Key.</span>
              </div>
              <div class="da-benefit-item">
                <span class="da-benefit-icon">✓</span>
                <span>One-time payment (£24) — instant lifetime access on your browser plus a backup Access Code for all your devices.</span>
              </div>
            </div>

            <div id="da-veil-reg37-wrap" style="background:rgba(15,23,42,0.75);border:1px solid rgba(228,200,140,0.35);border-radius:10px;padding:0.7rem 0.85rem;margin-bottom:0.75rem;text-align:left;transition:border-color 0.2s,background 0.2s;">
              <label for="da-veil-reg37-check" style="display:flex;align-items:flex-start;gap:0.6rem;cursor:pointer;font-size:0.8rem;color:#e6dcc8;line-height:1.45;">
                <input type="checkbox" id="da-veil-reg37-check" style="margin-top:0.2rem;width:16px;height:16px;accent-color:#d4af37;cursor:pointer;flex-shrink:0;">
                <span>I agree to immediate access to this digital pack and acknowledge that I lose my 14-day right to a refund once accessed (<a href="terms.html#digital-content" style="color:#e4c88c;text-decoration:underline;">UK Digital Content Terms</a>).</span>
              </label>
              <div id="da-veil-reg37-error" role="alert" aria-live="polite" style="display:none;color:#fca5a5;font-size:0.76rem;font-weight:700;margin-top:0.45rem;">
                Please tick the box above to confirm immediate digital access before proceeding to Stripe checkout.
              </div>
            </div>

            <a href="${this.STRIPE_LINK}" class="da-btn-stripe" id="da-veil-stripe-btn" onclick="return DarkAcademiaGate.handleStripeCheckoutClick(event, 'da-veil-reg37-check', 'da-veil-reg37-wrap', 'da-veil-reg37-error')">
              <span>Unlock Full Course via Stripe (£24)</span>
              <span aria-hidden="true">→</span>
            </a>

            <div class="da-passkey-box" style="margin-top:0.85rem;">
              <p>Already purchased? Enter your Course Access Code:</p>
              <div class="da-passkey-row">
                <input type="text" class="da-passkey-input" id="veil-passkey-input" placeholder="ENTER ACCESS CODE" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Enter access code to unlock">
                <button class="da-passkey-btn" onclick="DarkAcademiaGate.submitVeilPasskey()">Unlock</button>
              </div>
              <div class="da-passkey-feedback" id="veil-passkey-feedback"></div>
              <p style="font-size:0.74rem;color:#b5a792;margin-top:0.5rem;">
                Lost your access code or need billing/refund help? <a href="index.html?support=billing#enquiry-card" style="color:#e4c88c;text-decoration:underline;">Contact Billing &amp; Access Support (24h resolution)</a>.
              </p>
            </div>

            <div style="text-align:center; margin-top:1.25rem;">
              <a href="dark-academia-index.html" class="da-link-secondary">← Return to Free Lessons on Course Hub</a>
            </div>
          </div>
        `;
        document.body.appendChild(veil);
        const veilReg37Check = veil.querySelector('#da-veil-reg37-check');
        if (veilReg37Check) {
          veilReg37Check.addEventListener('change', () => {
            if (veilReg37Check.checked) {
              const wrap = veil.querySelector('#da-veil-reg37-wrap');
              const err = veil.querySelector('#da-veil-reg37-error');
              if (wrap) {
                wrap.style.borderColor = 'rgba(228,200,140,0.35)';
                wrap.style.background = 'rgba(15,23,42,0.75)';
              }
              if (err) err.style.display = 'none';
            }
          });
        }
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
  },

  copyShareLink(unitId, btnEl) {
    const unitPages = {
      dracula_unit1: 'dracula-unit1-carpathian-threshold.html',
      dracula_unit2: 'dracula-unit2-counts-hospitality.html',
      dracula_unit3: 'dracula-unit3-log-of-the-demeter.html',
      frankenstein_unit1: 'frankenstein-unit1-spark-of-being.html',
      frankenstein_unit2: 'frankenstein-unit2-sea-of-ice.html',
      frankenstein_unit3: 'frankenstein-unit3-creatures-apologia.html',
      jekyll_unit1: 'jekyll-unit1-soho-threshold.html',
      jekyll_unit2: 'jekyll-unit2-lanyons-narrative.html',
      jekyll_unit3: 'jekyll-unit3-full-statement.html',
      baskerville_unit1: 'baskerville-unit1-curse-of-the-moors.html',
      baskerville_unit2: 'baskerville-unit2-grimpen-mire.html',
      baskerville_unit3: 'baskerville-unit3-moorland-vigil.html',
      alice_unit1: 'alice-unit13-down-the-rabbit-hole.html',
      alice_unit2: 'alice-unit14-mad-tea-party.html',
      alice_unit3: 'alice-unit15-queens-trial.html'
    };
    const pathSlug = (window.location.pathname.split('/').pop() || '').trim();
    const pageFile = pathSlug.endsWith('.html') ? pathSlug : (unitPages[unitId] || 'dark-academia-index.html');
    const canonicalUrl = `https://garethenglish.com/${pageFile}`;

    const showCopiedState = () => {
      if (!btnEl) return;
      if (!btnEl.dataset.origLabel) {
        btnEl.dataset.origLabel = btnEl.textContent.trim();
      }
      btnEl.textContent = '✓ Link Copied — Send to a Study Partner!';
      btnEl.style.borderColor = '#10b981';
      btnEl.style.color = '#86efac';
      btnEl.style.background = 'rgba(16, 185, 129, 0.18)';
      clearTimeout(btnEl._copyTimer);
      btnEl._copyTimer = setTimeout(() => {
        btnEl.textContent = btnEl.dataset.origLabel;
        btnEl.style.borderColor = '';
        btnEl.style.color = '';
        btnEl.style.background = '';
      }, 3200);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(canonicalUrl).then(showCopiedState).catch(() => {
        this._fallbackCopyText(canonicalUrl);
        showCopiedState();
      });
    } else {
      this._fallbackCopyText(canonicalUrl);
      showCopiedState();
    }
    return canonicalUrl;
  },

  _fallbackCopyText(text) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    } catch (e) {}
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
    this.mountLessonEnhancements();
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

  mountLessonEnhancements() {
    const pack = LESSON_UPGRADE_PACKS[this.unitId];
    if (!pack) return;

    // 1. Stage 0 Active Speaking Warm-Up (inject before Section 1 if not already present)
    const sec1Heading = document.getElementById('section1-heading');
    const sec1Card = sec1Heading ? sec1Heading.closest('section.card') : null;
    if (sec1Card && !document.getElementById('speaking-heading') && pack.speaking) {
      const sp = pack.speaking;
      const speakingSec = document.createElement('section');
      speakingSec.className = 'card da-speaking-card';
      speakingSec.setAttribute('aria-labelledby', 'speaking-heading');
      speakingSec.innerHTML = `
        <div class="card-header">
          <h2 id="speaking-heading">0. Active Speaking Warm-Up: ${sp.title}</h2>
          <div style="display:flex; gap:0.5rem; align-items:center; flex-wrap:wrap;">
            <span class="badge badge-core">Core • 5 Mins</span>
            <span class="pill">IELTS Part 2 • C1/C2 Spoken Fluency</span>
          </div>
        </div>
        <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1rem;">
          ${sp.introHtml}
        </p>
        <div class="da-speaking-grid">
          <div class="da-cue-card da-cue-card-box">
            <div class="da-cue-header">
              <span class="badge badge-canon-dracula" style="font-size:0.74rem;">IELTS SPEAKING PART 2 CUE CARD</span>
              <div class="da-timer-controls da-timer-bar">
                <span id="da-speaking-timer" class="da-timer-pill da-timer-display" aria-live="off">01:00</span>
                <button type="button" class="kwt-mini-btn da-timer-btn" onclick="darkEngine.startSpeakingTimer(60)">⏱ 1m Prep</button>
                <button type="button" class="kwt-mini-btn da-timer-btn" onclick="darkEngine.startSpeakingTimer(120)">🎙️ 2m Speak</button>
                <button type="button" class="kwt-mini-btn da-timer-btn" onclick="darkEngine.resetSpeakingTimer()" aria-label="Reset timer">↺</button>
              </div>
            </div>
            <p class="da-cue-title" style="font-weight:700; color:#f8fafc; font-size:0.98rem; margin-bottom:0.5rem;">
              ${sp.prompt}
            </p>
            <p style="font-size:0.84rem; color:#cbd5e1; margin-bottom:0.35rem;">You should say:</p>
            <ul class="da-cue-list" style="font-size:0.86rem; color:#cbd5e1; padding-left:1.2rem; margin:0 0 0.85rem 0; line-height:1.55;">
              ${sp.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
            <div class="da-keyword-grid da-keyword-slots" aria-label="1-Minute Note Trigger Keywords">
              <input type="text" class="da-keyword-input da-kw-input" placeholder="1. Keyword" aria-label="Trigger keyword 1" autocapitalize="off" autocorrect="off">
              <input type="text" class="da-keyword-input da-kw-input" placeholder="2. Keyword" aria-label="Trigger keyword 2" autocapitalize="off" autocorrect="off">
              <input type="text" class="da-keyword-input da-kw-input" placeholder="3. Keyword" aria-label="Trigger keyword 3" autocapitalize="off" autocorrect="off">
              <input type="text" class="da-keyword-input da-kw-input" placeholder="4. Keyword" aria-label="Trigger keyword 4" autocapitalize="off" autocorrect="off">
            </div>
          </div>
          <div class="da-structuring-box">
            <h3 style="font-size:0.95rem; color:#fbbf24; margin:0 0 0.6rem 0;">🧭 How to Structure a High-Scoring 2-Minute Turn:</h3>
            <ol style="font-size:0.85rem; color:#e2e8f0; padding-left:1.15rem; margin:0 0 0.85rem 0; line-height:1.55;">
              <li style="margin-bottom:0.35rem;"><strong>The 1-Minute Note Secret:</strong> Write only 4 single trigger keywords in the boxes—never write full sentences or you will end up reading aloud in a flat monotone.</li>
              <li style="margin-bottom:0.35rem;"><strong>The 3-Act Story Arc:</strong> <em>Past Context (30s)</em> &rarr; <em>Sensory Snapshot / Core Scene (45s)</em> &rarr; <em>Reflection / 'So What?' (45s)</em>.</li>
              <li><strong>The Cambridge Anchor:</strong> The bullet points are springboards, not an interrogation checklist. If you finish early, compare that experience with your perspective today.</li>
            </ol>
            <div style="font-size:0.82rem; color:#94a3b8; border-top:1px solid rgba(148,163,184,0.2); padding-top:0.6rem;">
              <strong>Natural Spoken Frames:</strong> ${sp.spokenFramesHtml}
            </div>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; margin-top:0.75rem;">
              <button type="button" class="kwt-mini-btn da-reveal-btn" aria-expanded="false" onclick="darkEngine.toggleReveal(this, 'speaking-model-reveal')">
                👁️ Reveal Band 8.5 Spoken Model
              </button>
              <button type="button" class="kwt-mini-btn da-reveal-btn" onclick="DarkAcademiaAtmosphere.playPiperAudio('assets/audio/tts/speaking_${this.unitId}.mp3?v=3', this, '🎧 Listen (Piper British Neural)')">
                🎧 Listen (Piper British Neural)
              </button>
            </div>
          </div>
        </div>
        <div id="speaking-model-reveal" class="da-spoken-model-box da-reveal-panel" hidden>
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.65rem;">
            <div style="font-size:0.8rem; font-weight:700; color:#34d399; text-transform:uppercase; letter-spacing:0.04em;">
              🎙️ Band 8.5 Spoken Long Turn (~235 words • ~1m50s at natural pace):
            </div>
            <audio controls preload="none" src="assets/audio/tts/speaking_${this.unitId}.mp3?v=3" style="height:32px; max-width:260px;" aria-label="Piper British Neural audio for Band 8.5 Spoken Long Turn"></audio>
          </div>
          <p id="speaking-model-text" style="font-size:0.9rem; color:#e2e8f0; line-height:1.65; margin:0;">
            ${sp.modelHtml}
          </p>
        </div>
      `;
      sec1Card.parentNode.insertBefore(speakingSec, sec1Card);
    }

    // 2. Section 1 Close-Reading Breakdown & Syntax Lens
    if (sec1Card && !sec1Card.querySelector('.da-close-reading-box') && pack.closeReading) {
      const cr = pack.closeReading;
      const readingFrame = sec1Card.querySelector('.reading-frame');
      if (readingFrame) {
        const crBox = document.createElement('div');
        crBox.className = 'da-close-reading-box';
        crBox.innerHTML = `
          <h3 style="font-size:0.98rem; color:#f8fafc; margin:0 0 0.65rem 0;">🔍 Close-Reading Breakdown: ${cr.heading}</h3>
          <div class="da-close-reading-grid is-open">
            ${cr.cards.map(c => `
              <div class="da-close-note-card da-cr-card">
                <strong>${c.title}</strong>
                <p style="margin:0;">${c.bodyHtml}</p>
              </div>
            `).join('')}
          </div>
        `;
        readingFrame.insertAdjacentElement('afterend', crBox);
      }
    }

    // 3. Section 2 C2 Nuance Box & Interactive Live Drill Workout
    const sec2Heading = document.getElementById('section2-heading');
    const sec2Card = sec2Heading ? sec2Heading.closest('section.card') : null;
    if (sec2Card && !sec2Card.querySelector('.da-workout-box') && pack.section2) {
      const s2 = pack.section2;
      const pillarsGrid = sec2Card.querySelector('.pillars-grid');
      if (pillarsGrid) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div class="da-c2-exception-box">
            <div class="da-c2-badge">C2 PROFICIENCY NUANCE • ${s2.nuanceBadge}</div>
            <h3 style="font-size:0.98rem; color:#f8fafc; margin:0.35rem 0 0.5rem 0;">${s2.nuanceTitle}</h3>
            <p style="font-size:0.88rem; color:#cbd5e1; margin:0 0 0.65rem 0; line-height:1.55;">
              ${s2.nuanceIntroHtml}
            </p>
            <div class="da-c2-exception-grid">
              ${s2.nuanceCards.map(nc => `
                <div>
                  <strong>${nc.title}</strong>
                  <span>${nc.bodyHtml}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="da-workout-box">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom:0.75rem;">
              <h3 style="font-size:1.02rem; color:#f8fafc; margin:0;">🏋️ Interactive Practice Workout: Combine &amp; Upgrade Before the Quiz</h3>
              <span style="font-size:0.78rem; color:#94a3b8;">Try rewriting aloud or in your notebook first, then reveal the model</span>
            </div>
            ${s2.workouts.map((w, idx) => `
              <div class="da-workout-item">
                <p style="font-size:0.9rem; color:#e2e8f0; margin:0 0 0.45rem 0;">
                  <strong>Workout ${idx + 1} (${w.label}):</strong> ${w.promptHtml}
                </p>
                <button type="button" class="kwt-mini-btn da-reveal-btn" aria-expanded="false" onclick="darkEngine.toggleReveal(this, 'workout-reveal-${this.unitId}-${idx}')">
                  👁️ Reveal Cambridge Model
                </button>
                <div id="workout-reveal-${this.unitId}-${idx}" class="da-workout-reveal da-reveal-panel" hidden>
                  ${w.modelHtml}
                </div>
              </div>
            `).join('')}
          </div>
        `;
        pillarsGrid.insertAdjacentElement('afterend', wrap);
      }
    }

    // 4. Section 3 Gareth's 4-Step Part 4 Strategy Bar & Per-Question Breakdowns
    const sec3Heading = document.getElementById('section3-heading');
    const sec3Card = sec3Heading ? sec3Heading.closest('section.card') : null;
    if (sec3Card && !sec3Card.querySelector('.da-strategy-bar')) {
      const firstKwt = sec3Card.querySelector('.kwt-card');
      if (firstKwt) {
        const stratBar = document.createElement('div');
        stratBar.className = 'da-strategy-bar';
        stratBar.innerHTML = `
          <div style="font-size:0.82rem; font-weight:800; color:#fbbf24; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.45rem;">
            🎯 Gareth's 4-Step Part 4 Elimination &amp; Deconstruction Method
          </div>
          <div class="da-strategy-grid da-strategy-steps">
            <div><strong>1. Strike Out the Echoes:</strong> Cross out words in Sentence 1 that already appear in Sentence 2 to isolate the exact meaning gap.</div>
            <div><strong>2. Inspect Tense Harmony:</strong> Check the verb tense of Sentence 1 so your transformation keeps the exact timeframe.</div>
            <div><strong>3. Check Voice &amp; Inversion:</strong> Spot whether the new opening forces an auxiliary inversion, passive shift, or subjunctive.</div>
            <div><strong>4. Solve the C1 Frame:</strong> Lock the unchanged keyword into its required preposition, collocation, or grammatical frame (1 + 1 marks).</div>
          </div>
        `;
        sec3Card.insertBefore(stratBar, firstKwt);
      }

      if (Array.isArray(pack.kwtBreakdowns)) {
        const kwtCards = sec3Card.querySelectorAll('.kwt-card');
        kwtCards.forEach((card, idx) => {
          const bData = pack.kwtBreakdowns[idx];
          if (!bData || card.querySelector('.da-kwt-breakdown')) return;
          const bWrap = document.createElement('div');
          bWrap.innerHTML = `
            <button type="button" class="kwt-mini-btn da-reveal-btn da-reveal-sm" aria-expanded="false" onclick="darkEngine.toggleReveal(this, 'kwt-steps-${this.unitId}-${idx}')">
              🔍 Show 4-Step Deconstruction
            </button>
            <div id="kwt-steps-${this.unitId}-${idx}" class="da-reveal-panel da-kwt-breakdown" hidden>
              <strong>Step 1 (Echoes):</strong> ${bData.s1}<br>
              <strong>Step 2 &amp; 3 (Tense &amp; Structure):</strong> ${bData.s23}<br>
              <strong>Step 4 (1+1 Split Credit):</strong> ${bData.s4}
            </div>
          `;
          card.appendChild(bWrap);
        });
      }
    }
  }

  /**
   * Starts the IELTS Part 2 Speaking Warm-Up countdown timer (60s Prep or 120s Speak)
   */
  startSpeakingTimer(seconds = 60) {
    if (this.speakingTimerInterval) {
      clearInterval(this.speakingTimerInterval);
      this.speakingTimerInterval = null;
    }
    let remaining = Number(seconds) || 60;
    const isSpeak = remaining > 60;
    const display = document.getElementById('da-speaking-timer') || document.getElementById('drac1-timer-display');
    const render = () => {
      const m = String(Math.floor(remaining / 60)).padStart(2, '0');
      const s = String(remaining % 60).padStart(2, '0');
      if (display) {
        display.textContent = `${m}:${s}`;
        display.style.borderColor = isSpeak ? '#4ade80' : '#f59e0b';
        display.style.color = remaining <= 10 ? '#f87171' : (isSpeak ? '#86efac' : '#fde68a');
      }
    };
    render();
    this.speakingTimerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        remaining = 0;
        render();
        clearInterval(this.speakingTimerInterval);
        this.speakingTimerInterval = null;
        if (window.DarkAcademiaAtmosphere && typeof window.DarkAcademiaAtmosphere.playSFX === 'function') {
          window.DarkAcademiaAtmosphere.playSFX('seal');
        }
      } else {
        render();
      }
    }, 1000);
  }

  /**
   * Resets the IELTS Part 2 Speaking Warm-Up countdown timer to 01:00
   */
  resetSpeakingTimer() {
    if (this.speakingTimerInterval) {
      clearInterval(this.speakingTimerInterval);
      this.speakingTimerInterval = null;
    }
    const display = document.getElementById('da-speaking-timer') || document.getElementById('drac1-timer-display');
    if (display) {
      display.textContent = '01:00';
      display.style.borderColor = 'rgba(245, 158, 11, 0.4)';
      display.style.color = '#fde68a';
    }
  }

  /**
   * Toggles reveal panels (Spoken Model, Section 2 Workout Models, and Section 3 4-Step Breakdowns)
   */
  toggleReveal(btn, panelId) {
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const willOpen = panel.hasAttribute('hidden') ? true : !panel.classList.contains('is-open');
    if (willOpen) {
      panel.removeAttribute('hidden');
      panel.classList.add('is-open');
    } else {
      panel.setAttribute('hidden', '');
      panel.classList.remove('is-open');
    }
    if (btn) {
      if (!btn.dataset.showLabel) {
        btn.dataset.showLabel = btn.textContent.trim();
      }
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      if (willOpen) {
        const orig = btn.dataset.showLabel;
        if (orig.includes('Spoken Model')) btn.textContent = '▲ Hide Spoken Model';
        else if (orig.includes('Cambridge Model')) btn.textContent = '▲ Hide Model';
        else if (orig.includes('Deconstruction') || orig.includes('Breakdown')) btn.textContent = '▲ Hide Breakdown';
        else btn.textContent = '▲ Hide';
      } else {
        btn.textContent = btn.dataset.showLabel;
      }
    }
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
      .da-c2-badge {
        font-size: 0.72rem;
        font-weight: 800;
        color: #c4b5fd;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .da-c2-exception-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.65rem;
      }
      .da-c2-exception-grid > div {
        background: rgba(2, 6, 23, 0.55);
        padding: 0.65rem 0.85rem;
        border-radius: 6px;
        border: 1px solid rgba(167, 139, 250, 0.22);
      }
      .da-c2-exception-grid strong {
        display: block;
        color: #ede9fe;
        font-size: 0.84rem;
        margin-bottom: 0.2rem;
      }
      .da-workout-item + .da-workout-item {
        margin-top: 0.75rem;
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

      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('spellcheck', 'false');

      const fbBox = card.querySelector('.feedback-box');
      if (fbBox && !fbBox.getAttribute('aria-live')) {
        fbBox.setAttribute('aria-live', 'polite');
      }

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
          <span class="kwt-helper-label">Tap words to build your answer (or type directly): <strong style="color:#cbd5e1;">${modelWords.length} words in model</strong> (+1 decoy tile)</span>
          <div class="kwt-helper-actions">
            <button type="button" class="kwt-mini-btn kwt-hint-btn" aria-expanded="false">💡 Hint</button>
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
        const isVis = hintBox.classList.toggle('visible');
        hintBtn.setAttribute('aria-expanded', isVis ? 'true' : 'false');
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
        nextFreeUrl: 'alice-unit13-down-the-rabbit-hole.html',
        nextFreeTitle: 'Alice in Wonderland Lesson 13 (Free)'
      },
      baskerville_unit2: {
        mastered: 'Place Inversion on Grimpen Mire',
        nextUrl: 'baskerville-unit3-moorland-vigil.html',
        nextTitle: 'Lesson 12: The Hound Revealed',
        nextFreeUrl: 'alice-unit13-down-the-rabbit-hole.html',
        nextFreeTitle: 'Alice in Wonderland Lesson 13 (Free)'
      },
      baskerville_unit3: {
        mastered: 'Counterfactual Conditionals & The Final Dartmoor Deduction',
        nextUrl: 'alice-unit13-down-the-rabbit-hole.html',
        nextTitle: 'Lesson 13: Down the Rabbit-Hole',
        nextFreeUrl: 'alice-unit13-down-the-rabbit-hole.html',
        nextFreeTitle: 'Alice in Wonderland Lesson 13 (Free)'
      },
      alice_unit1: {
        mastered: 'Negative & Limiting Inversion Down the Rabbit-Hole',
        nextUrl: 'alice-unit14-mad-tea-party.html',
        nextTitle: 'Lesson 14: A Mad Tea-Party',
        nextFreeUrl: 'dracula-unit1-carpathian-threshold.html',
        nextFreeTitle: 'Dracula Lesson 1'
      },
      alice_unit2: {
        mastered: 'Inverted Conditionals & Unreal Past Subjunctives at Six O’Clock',
        nextUrl: 'alice-unit15-queens-trial.html',
        nextTitle: "Lesson 15: The Queen's Trial — Who Stole the Tarts?",
        nextFreeUrl: 'dracula-unit1-carpathian-threshold.html',
        nextFreeTitle: 'Dracula Lesson 1'
      },
      alice_unit3: {
        mastered: "Evidential Passives, Subjunctive Mandates & Cleft Focus",
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
          <button type="button" class="dossier-pill-btn" style="cursor:pointer;" onclick="DarkAcademiaGate.copyShareLink('${this.unitId}', this)">
            🔗 Share this lesson with a study partner (Copy Link)
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="da-completion-top">
          <span class="da-score-callout">Free Lesson Score: ${this.score} / ${this.totalMarks} Marks (${pct}%)</span>
          <span class="badge badge-canon-dracula">C1/C2 Complete Course</span>
        </div>
        <h3 class="da-completion-title">Enjoying the Course? Unlock All 15 Lessons</h3>
        <p class="da-completion-body">
          You've practiced ${meta.mastered}. Unlock the complete <strong>15-Lesson Dark Academia Course</strong> across <em>Dracula</em>, <em>Frankenstein</em>, <em>Dr Jekyll &amp; Mr Hyde</em>, <em>The Hound of the Baskervilles</em>, and <em>Alice in Wonderland</em> (+ the Printable Study Guide &amp; Complete Answer Key) for <strong>£24</strong>.
        </p>
        <div class="da-completion-perks">
          <div class="da-perk-chip"><span>🔓</span> 10 Advanced C1/C2 Lessons</div>
          <div class="da-perk-chip"><span>✓</span> 75 Interactive Transformations</div>
          <div class="da-perk-chip"><span>✍️</span> Modern Essay &amp; Review Practice</div>
          <div class="da-perk-chip"><span>📖</span> Printable Study Guide &amp; Answer Key</div>
        </div>
        <div class="da-completion-actions">
          <button class="da-btn-stripe" style="max-width:340px;" onclick="DarkAcademiaGate.openModal('${this.unitId}')">
            <span>Unlock Full 15-Lesson Course — £24</span>
            <span aria-hidden="true">→</span>
          </button>
          <a href="${meta.nextFreeUrl}" class="da-link-secondary">
            Or try ${meta.nextFreeTitle} for free first →
          </a>
          <button type="button" class="dossier-pill-btn" style="cursor:pointer;" onclick="DarkAcademiaGate.copyShareLink('${this.unitId}', this)">
            🔗 Share this lesson with a study partner (Copy Link)
          </button>
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
    const arsenalLabel = (this.sortLabels && this.sortLabels.arsenal) || '✓ Modern C1/C2';
    const literaryLabel = (this.sortLabels && this.sortLabels.literary) || '📜 Literary / Stylistic';
    const museumLabel = (this.sortLabels && this.sortLabels.museum) || '🏛 Archaic / Period';

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
          <button type="button" class="btn-sort" data-choice="literary" aria-label="Mark as ${literaryLabel}">
            ${literaryLabel}
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

    const labelMap = {
      arsenal: 'Modern C1/C2 Register',
      literary: 'Literary / Stylistic Only',
      museum: 'Archaic / Period Noun'
    };

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
          targetAnswer: labelMap[item.type] || 'Modern C1/C2 Register',
          explanation: item.exp
        });
      }
    } else {
      btnElement.classList.add('wrong');
      buttons.forEach((b) => {
        if (b.getAttribute('data-choice') === item.type) b.classList.add('correct');
      });
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
          prompt: 'Classify register: "' + item.word + '" (' + (item.sub || '') + ')',
          keyword: item.word.toUpperCase(),
          targetAnswer: labelMap[item.type] || 'Modern C1/C2',
          userAttempt: labelMap[choice] || choice,
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

    const userWords = userNorm.split(' ').filter(Boolean);
    const maxWords = parseInt(card.getAttribute('data-max-words') || '6', 10);
    const minWords = parseInt(card.getAttribute('data-min-words') || '3', 10);
    const withinWordLimit = userWords.length >= minWords && userWords.length <= maxWords;

    const keyPill = card.querySelector('.kwt-key');
    const keyWord = keyPill ? this.normalizeText(keyPill.textContent) : '';
    const hasExactKeyword = !keyWord || userWords.includes(keyWord);

    const validList = (card.getAttribute('data-valid') || '')
      .split('|')
      .map((s) => this.normalizeText(s))
      .filter(Boolean);

    const validRegexAttr = card.getAttribute('data-valid-regex');
    let matchesRegex = false;
    if (validRegexAttr) {
      try {
        const rx = new RegExp(`^(?:${validRegexAttr})$`, 'i');
        matchesRegex = rx.test(userNorm);
      } catch (e) {}
    }

    const isExactMatch = hasExactKeyword && withinWordLimit && (validList.includes(userNorm) || matchesRegex);

    let isPartialMatch = false;
    const modelWords = modelAnswer.trim().split(/\s+/);
    const partialRegexAttr = card.getAttribute('data-partial-regex');

    if (!isExactMatch && hasExactKeyword && userWords.length >= minWords && userWords.length <= 8) {
      if (partialRegexAttr) {
        try {
          const prx = new RegExp(partialRegexAttr, 'i');
          if (prx.test(userNorm)) isPartialMatch = true;
        } catch (e) {}
      }
      if (!isPartialMatch) {
        const normModelWords = this.normalizeText(modelAnswer).split(' ');
        const overlap = userWords.filter((w) => normModelWords.includes(w)).length;
        if (overlap >= Math.ceil(normModelWords.length * 0.65)) {
          isPartialMatch = true;
        }
      }
    }

    const attempts = parseInt(card.dataset.attempts || '0', 10) + 1;
    card.dataset.attempts = String(attempts);

    const kwtLead = card.querySelector('.kwt-lead') || card.querySelector('.kwt-original');
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
        fb.innerHTML = `<strong>✓ Full Marks (+2/2):</strong> Spot on! <em>"${rawUser.trim()}"</em> (${userWords.length} words) — ${explanation}`;
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
      let hintDiagnostic = `Start with <strong>"${firstTwo}..."</strong> (${minWords}–${maxWords} words allowed).`;
      if (!hasExactKeyword && keyWord) {
        hintDiagnostic = `Remember: you must include the exact unchanged key word <strong>${keyWord.toUpperCase()}</strong>!`;
      } else if (!withinWordLimit) {
        hintDiagnostic = `Your answer has <strong>${userWords.length} words</strong>—Cambridge Part 4 requires between <strong>${minWords} and ${maxWords} words</strong>.`;
      } else if (isPartialMatch) {
        hintDiagnostic = `You already have <strong>1 of the 2 marks</strong> (the core structure or key word phrase is there)! Check your preposition, article, or participle form to claim full 2/2 marks.`;
      }
      if (fb) {
        fb.className = 'feedback-box partial';
        fb.innerHTML = `<strong>⚡ Second Chance:</strong> ${hintDiagnostic} Adjust your answer and click <strong>Check</strong> again.`;
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
        fb.innerHTML = `<strong>⚡ Cambridge Split-Mark Credit (+1/2):</strong> You secured 1 mark for half the transformation! Full 2/2 model: <strong>"${modelAnswer}"</strong>.<br><span style="font-size:0.84rem; opacity:0.9;">Note: ${explanation}</span>`;
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
   * Section 5: Writing Sandbox & Live Checklist
   */
  initCapstoneAudit() {
    const textarea = document.getElementById('capstone-input');
    if (!textarea) return;

    const wordCounter = document.getElementById('capstone-word-counter');
    const checkInversion = document.getElementById('audit-inversion');
    const checkParticiple = document.getElementById('audit-participle');
    const checkArsenal = document.getElementById('audit-arsenal');

    const defaultInversionRegex = /(scarcely\s+had|hardly\s+had|no\s+sooner\s+had|under\s+no\s+circumstances|little\s+did|seldom\s+had|rarely\s+did|nowhere\s+could|nowhere\s+was|not\s+only\s+did|only\s+after|not\s+until|never\s+before\s+had|never\s+had|had\s+he\s+not|had\s+i\s+not|had\s+victor|had\s+holmes|had\s+we|were\s+he\s+to|were\s+it\s+not|much\s+as|so\s+[a-z]+\s+was|what\s+[a-z]+\s+most\s+was|it\s+was\s+only)/i;
    const defaultParticipleRegex = /(\bhaving\s+(?!a\b|an\b|the\b|to\b|no\b|some\b|any\b)(?:been\s+[a-z]{3,}|[a-z]{3,}(?:ed|en|wn|lt|pt|nt|st|nd|ld))\b|\b(?:hemmed\s+in|shrouded\s+in|driven\s+by|deprived\s+of|ostracis(?:ed|ed)\s+by|compounded\s+by|confronted\s+(?:with|by)|faced\s+with|burdened\s+(?:by|with)|exhausted\s+by|surrounded\s+by|filled\s+with|plunged\s+into|grounded\s+upon|lashed\s+to)\b)/i;
    const defaultArsenalList = [
      'apprehensive', 'apprehension', 'impenetrable', 'hemmed', 'sinister', 'formidable', 'trepidation',
      'unaccountably', 'derelict', 'disclose', 'disclosed', 'catastrophe', 'convulsive',
      'unquenchable', 'delineate', 'abhorrence', 'inexorable', 'insolent', 'malevolence',
      'benevolence', 'ostracise', 'ostracised', 'ostracize', 'ostracized', 'repudiate', 'repudiation', 'juggernaut',
      'detestable', 'callous', 'audacity', 'duplicity', 'facade', 'repugnance', 'cerebral',
      'incongruous', 'depravity', 'abominable', 'imperious', 'extricate', 'pernicious',
      'plausible', 'circumstantial', 'calamity', 'treacherous', 'quagmire', 'melancholy',
      'desolate', 'corroborate', 'corroborated', 'fallacy', 'premeditated', 'audacious'
    ];

    const invRegex = (this.capstoneConfig && this.capstoneConfig.invRegex) || defaultInversionRegex;
    const partRegex = (this.capstoneConfig && this.capstoneConfig.partRegex) || defaultParticipleRegex;
    const arsenalWords = (this.capstoneConfig && this.capstoneConfig.arsenalWords) || defaultArsenalList;
    const minOptimal = (this.capstoneConfig && this.capstoneConfig.minWords) || 80;
    const maxOptimal = (this.capstoneConfig && this.capstoneConfig.maxWords) || 280;
    const invPassMsg = (this.capstoneConfig && this.capstoneConfig.invPassMsg) || '✓ Target grammar structure spotted!';
    const partPassMsg = (this.capstoneConfig && this.capstoneConfig.partPassMsg) || '✓ Participle opener spotted — now verify your Same-Subject Rule below!';

    textarea.addEventListener('input', () => {
      const text = textarea.value.trim();
      const words = text ? text.split(/\s+/).length : 0;

      if (wordCounter) {
        wordCounter.textContent = `${words} Words`;
        if (words >= minOptimal && words <= maxOptimal) {
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
          hasInv ? invPassMsg : 'Try using one of the target structures.'
        );
      }

      if (checkParticiple) {
        const hasPart = partRegex.test(text);
        this.toggleAuditItem(
          checkParticiple,
          hasPart,
          hasPart ? partPassMsg : 'Try opening a sentence with a participle clause followed by a comma.'
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

  resetAll(skipConfirm = false) {
    if (!skipConfirm && typeof window !== 'undefined' && typeof window.confirm === 'function') {
      if (!window.confirm('Reset all answers and clear your score for this lesson?')) {
        return;
      }
    }
    this.score = 0;
    this.resetSpeakingTimer();
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
  let userMutedMusic = false;
  try {
    userMutedMusic = localStorage.getItem('da_music_muted') === '1';
  } catch (e) {}
  let autoplayUnlockArmed = false;
  let sfxEnabled = true;
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
      imgSrc: 'assets/gothic/dracula_carpathian.webp',
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
      imgSrc: 'assets/gothic/frankenstein_lab.webp',
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
      imgSrc: 'assets/gothic/jekyll_apothecary.webp',
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
      imgSrc: 'assets/gothic/baskerville_moor.webp',
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
      src: 'assets/gothic/dracula_carpathian.webp',
      credit: 'Caspar David Friedrich, Abbey in the Oakwood (1809–1810) • Alte Nationalgalerie'
    },
    dracula_unit2: {
      src: 'assets/gothic/dracula_unit2.webp',
      credit: 'Caspar David Friedrich, Ruins of Eldena (c. 1825) • Oil on canvas'
    },
    dracula_unit3: {
      src: 'assets/gothic/dracula_unit3.webp',
      credit: 'Johan Christian Dahl, Shipwreck on the Coast (1832) • National Museum, Oslo'
    },
    frankenstein_unit1: {
      src: 'assets/gothic/frankenstein_lab.webp',
      credit: 'Joseph Wright of Derby, An Experiment on a Bird in the Air Pump (1768) • National Gallery'
    },
    frankenstein_unit2: {
      src: 'assets/gothic/frankenstein_unit2.webp',
      credit: 'Caspar David Friedrich, The Sea of Ice (1824) • Hamburger Kunsthalle'
    },
    frankenstein_unit3: {
      src: 'assets/gothic/frankenstein_unit3.webp',
      credit: 'Caspar David Friedrich, Wanderer above the Sea of Fog (c. 1818) • Hamburger Kunsthalle'
    },
    jekyll_unit1: {
      src: 'assets/gothic/jekyll_apothecary.webp',
      credit: 'John Atkinson Grimshaw, Reflections on the Thames, Westminster (1880) • Leeds Art Gallery'
    },
    jekyll_unit2: {
      src: 'assets/gothic/jekyll_unit2.webp',
      credit: 'Joseph Wright of Derby, The Alchymist Discovering Phosphorus (1771) • Derby Museum'
    },
    jekyll_unit3: {
      src: 'assets/gothic/jekyll_unit3.webp',
      credit: 'John Atkinson Grimshaw, Liverpool Quay by Moonlight (1887) • Tate Britain'
    },
    baskerville_unit1: {
      src: 'assets/gothic/baskerville_moor.webp',
      credit: 'Caspar David Friedrich, Two Men Contemplating the Moon (1819) • Galerie Neue Meister'
    },
    baskerville_unit2: {
      src: 'assets/gothic/baskerville_unit2.webp',
      credit: 'Caspar David Friedrich, Megalithic Tomb in Autumn (c. 1820) • Galerie Neue Meister'
    },
    baskerville_unit3: {
      src: 'assets/gothic/baskerville_unit3.webp',
      credit: 'Caspar David Friedrich, Moonrise by the Sea (1822) • Alte Nationalgalerie'
    },
    alice_unit1: {
      src: 'assets/gothic/alice_unit1.webp',
      credit: 'Sir John Tenniel & Dalziel Brothers, Alice Falling Down the Rabbit-Hole (1865) • Victorian Fine Art Plate'
    },
    alice_unit2: {
      src: 'assets/gothic/alice_unit1.webp',
      credit: 'Sir John Tenniel & Dalziel Brothers, A Mad Tea-Party (1865) • Victorian Fine Art Plate'
    },
    alice_unit3: {
      src: 'assets/gothic/alice_unit1.webp',
      credit: 'Sir John Tenniel & Dalziel Brothers, Who Stole the Tarts? (1865) • Victorian Fine Art Plate'
    }
  };

  const preloadedImages = {};
  function getBookImage(keyOrUnitId) {
    const bookMap = {
      dracula: 'assets/gothic/dracula_carpathian.webp',
      frankenstein: 'assets/gothic/frankenstein_lab.webp',
      jekyll: 'assets/gothic/jekyll_apothecary.webp',
      baskerville: 'assets/gothic/baskerville_moor.webp',
      alice: 'assets/gothic/alice_unit1.webp'
    };
    const key = String(keyOrUnitId || '').toLowerCase();
    const src =
      (UNIT_PAINTINGS[keyOrUnitId] && UNIT_PAINTINGS[keyOrUnitId].src) ||
      bookMap[keyOrUnitId] ||
      (key.includes('alice') ? 'assets/gothic/alice_unit1.webp' : bookMap.dracula);
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
        musicAudioEl.volume = 0.20;
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
      try { localStorage.setItem('da_music_muted', '1'); } catch (e) {}
      stopMusic(true);
    } else {
      userMutedMusic = false;
      try { localStorage.setItem('da_music_muted', '0'); } catch (e) {}
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
      if (lbl && btn.dataset.defaultLabel) {
        lbl.textContent = btn.dataset.defaultLabel;
      } else if (btn.dataset.defaultLabel) {
        btn.textContent = btn.dataset.defaultLabel;
      }
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

  const VOCAB_STANDALONE_MP3 = {
    'frowning rocks': 'assets/audio/tts/vocab_frowning_rocks.mp3',
    'lofty steeps': 'assets/audio/tts/vocab_lofty_steeps.mp3',
    'calèche': 'assets/audio/tts/vocab_caleche.mp3',
    'apprehensive': 'assets/audio/tts/vocab_apprehensive.mp3',
    'impenetrable': 'assets/audio/tts/vocab_impenetrable.mp3',
    'hemmed in (by)': 'assets/audio/tts/vocab_hemmed_in_by.mp3',
    'waistcoat-pocket': 'assets/audio/tts/vocab_waistcoat_pocket.mp3',
    'antipathies': 'assets/audio/tts/vocab_antipathies.mp3',
    'pop down': 'assets/audio/tts/vocab_pop_down.mp3',
    'precipitous': 'assets/audio/tts/vocab_precipitous.mp3',
    'incongruous': 'assets/audio/tts/vocab_incongruous.mp3',
    'disorienting': 'assets/audio/tts/vocab_disorienting.mp3',
    'between whiles': 'assets/audio/tts/vocab_between_whiles.mp3',
    'tea-things': 'assets/audio/tts/vocab_tea_things.mp3',
    'twinkle': 'assets/audio/tts/vocab_twinkle.mp3',
    'perpetual': 'assets/audio/tts/vocab_perpetual.mp3',
    'arbitrary': 'assets/audio/tts/vocab_arbitrary.mp3',
    'futile': 'assets/audio/tts/vocab_futile.mp3',
    'herald': 'assets/audio/tts/vocab_herald.mp3',
    'parchment scroll': 'assets/audio/tts/vocab_parchment_scroll.mp3',
    'stuff and nonsense': 'assets/audio/tts/vocab_stuff_and_nonsense.mp3',
    'unsubstantiated': 'assets/audio/tts/vocab_unsubstantiated.mp3',
    'preposterous': 'assets/audio/tts/vocab_preposterous.mp3',
    'intimidate': 'assets/audio/tts/vocab_intimidate.mp3'
  };

  function playPiperAudio(mp3Src, btnEl, defaultLabel) {
    if (!mp3Src) return;
    if (btnEl && btnEl.classList.contains('speaking')) {
      stopNarration();
      if (defaultLabel) btnEl.textContent = defaultLabel;
      return;
    }
    stopNarration();

    if (btnEl) {
      btnEl.classList.add('da-reader-btn', 'speaking');
      if (defaultLabel) btnEl.dataset.defaultLabel = defaultLabel;
      const lbl = btnEl.querySelector('.da-reader-btn-label');
      if (lbl) {
        lbl.textContent = '⏹ Stop Audio';
      } else {
        btnEl.textContent = '⏹ Stop Audio';
      }
    }
    setMusicDucking(true);
    syncVoiceHUD(true);

    try {
      if (!voiceAudioEl) {
        voiceAudioEl = new Audio();
        voiceAudioEl.preload = 'auto';
      }
      voiceAudioEl.src = mp3Src;
      voiceAudioEl.volume = 1.0;
      voiceAudioEl.ontimeupdate = null;
      voiceAudioEl.onended = () => {
        if (btnEl && defaultLabel && !btnEl.querySelector('.da-reader-btn-label')) {
          btnEl.textContent = defaultLabel;
        }
        stopNarration();
      };
      voiceAudioEl.onerror = () => {
        if (btnEl && defaultLabel && !btnEl.querySelector('.da-reader-btn-label')) {
          btnEl.textContent = defaultLabel;
        }
        stopNarration();
      };
      const p = voiceAudioEl.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          if (btnEl && defaultLabel && !btnEl.querySelector('.da-reader-btn-label')) {
            btnEl.textContent = defaultLabel;
          }
          stopNarration();
        });
      }
    } catch (e) {
      stopNarration();
    }
  }

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
    const standaloneMp3 = VOCAB_STANDALONE_MP3[key];
    if (standaloneMp3 && typeof Audio !== 'undefined') {
      try {
        if (!voiceAudioEl) {
          voiceAudioEl = new Audio();
          voiceAudioEl.preload = 'auto';
        }
        voiceAudioEl.src = standaloneMp3;
        voiceAudioEl.volume = 1.0;
        voiceAudioEl.ontimeupdate = null;
        voiceAudioEl.onended = () => stopNarration();
        voiceAudioEl.onerror = () => stopNarration();
        const p = voiceAudioEl.play();
        if (p && typeof p.catch === 'function') {
          p.catch(() => stopNarration());
        }
        return;
      } catch (e) {}
    }

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
                 <span>Course Hub (15 Lessons)</span>
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
      const mp3Src = `assets/audio/extract_${unitId}.mp3?v=3`;

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

      const shiftMp3 = `assets/audio/shift_${unitId}_${idx}.mp3?v=3`;
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
    playPiperAudio,
    stopVoice: stopNarration,
    speakFallbackExplicit
  };
})();

const LESSON_UPGRADE_PACKS = {
  dracula_unit2: {
    speaking: {
      title: 'Hospitality, First Impressions & Hidden Rules',
      introHtml: 'Before we enter Castle Dracula, warm up your voice. Speak aloud for up to <strong>2 minutes</strong> on the IELTS Part 2 cue card below. Aim to drop <strong>one negative inversion</strong> (e.g. <em>Never before had I...</em> or <em>Not until... did I...</em>) naturally into your reflection.',
      prompt: 'Describe a time when you were welcomed as a guest in an unusual or memorable home or building.',
      bullets: [
        'where the building was and why you were visiting',
        'what the host or atmosphere was like when you arrived',
        'what rules, customs, or details stood out to you',
        'and explain why that visit left a lasting impression on you.'
      ],
      spokenFramesHtml: '<em>"Never before had I stepped into..."</em> • <em>"Not until we sat down did I notice..."</em>',
      modelHtml: `"I'd like to talk about a weekend stay I had three years ago at a seventeenth-century manor house in North Yorkshire that had been converted into a small academic retreat. I was attending a three-day seminar there, and because my train had been delayed, I arrived well after midnight in pouring rain.<br><br>When the caretaker opened the heavy oak door, the contrast with the storm outside was remarkable. <strong>Never before had I</strong> stepped into a private library with floor-to-ceiling timber galleries and a log fire still burning at one in the morning. The host was extraordinarily courteous—almost old-fashioned in his manners—and insisted on bringing out hot soup before showing me to my room. What struck me most, though, was the strict set of house rules: guests were asked to hand in their phones at the front desk, and <strong>under no circumstances were we</strong> allowed to enter the east wing where the rare manuscripts were stored.<br><br>At first, that restriction felt slightly intimidating, but by the second afternoon I realised how refreshing it was to work without constant digital interruptions. That visit has stayed with me because it showed how quickly an environment can shape your focus and state of mind."`
    },
    closeReading: {
      heading: 'How Stoker Uses Negative Inversion to Build Polite Menace',
      cards: [
        {
          title: '1. "At no time did the Count touch food..."',
          bodyHtml: 'By fronting the negative time phrase <em>At no time</em> and inverting the auxiliary <em>did</em> before <em>the Count</em>, Stoker turns an ordinary observation into an unsettling forensic clue.'
        },
        {
          title: '2. "Under no circumstances must you fall asleep..."',
          bodyHtml: 'The Count dresses up a lethal prison rule as fatherly concern. Fronting <em>Under no circumstances</em> + modal <em>must</em> makes the prohibition sound absolute and non-negotiable.'
        },
        {
          title: '3. "Not until I looked into the shaving-glass did I realise..."',
          bodyHtml: 'Notice where the inversion sits: the time clause (<em>Not until I looked...</em>) stays in normal order, and the inversion (<em>did I realise</em>) fires in the main clause for maximum shock.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'SUBORDINATE VS. MAIN CLAUSE INVERSION',
      nuanceTitle: 'Why "Not until" and "Only when" Delay Inversion Until the Main Clause',
      nuanceIntroHtml: 'One of the most common C1/C2 traps is inverting too early after <strong>Not until</strong>, <strong>Only when</strong>, or <strong>Only after</strong>. When these phrases introduce a full time clause, the first verb stays in normal order and only the <strong>second (main) clause</strong> inverts:',
      nuanceCards: [
        {
          title: 'Subordinate Time Clause (Normal Order)',
          bodyHtml: '<em>Not until Harker <strong>checked</strong> the mirror...</em> / <em>Only when the clock <strong>struck</strong> midnight...</em>'
        },
        {
          title: 'Main Clause Trigger (Auxiliary Inversion)',
          bodyHtml: '<em>...<strong>did he notice</strong> the Count standing behind him.</em> / <em>...<strong>did the wolves begin</strong> to howl.</em>'
        }
      ],
      workouts: [
        {
          label: 'Negative Prohibition',
          promptHtml: 'Rewrite starting with <strong>Under no circumstances</strong>: <em>"Visitors must not unlock the eastern gallery at night."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Under no circumstances must visitors unlock</strong> (or: <strong>are visitors to unlock</strong>) the eastern gallery at night."</em>'
        },
        {
          label: 'Delayed Inversion',
          promptHtml: 'Rewrite starting with <strong>Not until</strong>: <em>"He only understood the danger when he found the bolted doors."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Not until he found</strong> the bolted doors <strong>did he understand</strong> the danger."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "The Count... joined Harker at the dinner table". Deficit: "never once" + past tense.', s23: 'Past simple negative fronted ("At no time") triggers auxiliary "did" + subject + bare infinitive.', s4: '1 mark for "at no time did" + 1 mark for "the Count join".' },
      { s1: 'Cross out "the castle doors were locked from the outside". Deficit: "Harker only realised... when he tried the handle".', s23: '"Not until" + time clause ("he tried the handle") + inverted main clause ("did Harker realise").', s4: '1 mark for "he tried the handle" + 1 mark for "did Harker/he realise".' },
      { s1: 'Cross out "go into the old wing of the castle". Deficit: "You must never".', s23: 'Prepositional negative opener ("Under no circumstances") + inverted modal ("must you" / "should you").', s4: '1 mark for "no circumstances" + 1 mark for "must/should you".' },
      { s1: 'Cross out "I had... seen such a cold and frightening smile". Deficit: "never before".', s23: 'Past perfect ("had seen") inverts after "Never before" -> "Never before had I seen".', s4: '1 mark for "Never before" + 1 mark for "had I seen".' },
      { s1: 'Cross out "he noticed that there was no reflection in the mirror". Deficit: "As soon as he turned round".', s23: 'Correlative inversion: "No sooner had he turned round than...".', s4: '1 mark for "had he turned round" + 1 mark for "than".' }
    ]
  },

  dracula_unit3: {
    speaking: {
      title: 'Crisis Leadership & Decisions Under Pressure',
      introHtml: 'Before we read the Captain\'s log of the <em>Demeter</em>, warm up your voice for <strong>2 minutes</strong>. Aim to use <strong>one What-cleft or It-cleft</strong> (e.g. <em>What worried us most was...</em>) to spotlight the turning point of your story.',
      prompt: 'Describe a situation when you or a team had to deal with unexpected bad weather or a sudden disruption to a plan.',
      bullets: [
        'when and where this happened and who was involved',
        'what caused the disruption or difficulty',
        'how the group or leader responded to the situation',
        'and explain what you learned from how the crisis was handled.'
      ],
      spokenFramesHtml: '<em>"What caught everyone off guard was..."</em> • <em>"It was only when the power went out that..."</em>',
      modelHtml: `"I'd like to tell you about a coastal sailing trip off Northern Ireland four summers ago that turned into a genuine test of nerve. Four of us had chartered a small yacht to cross from Bangor toward the Scottish coast, expecting light winds all afternoon.<br><br>About halfway across the channel, however, a thick bank of sea fog rolled in within twenty minutes, and the wind picked up sharply. <strong>What caught us completely off guard was</strong> not the swell itself, but how quickly the visibility dropped to less than fifty metres. At the same time, our main navigation tablet lost battery power, which left everyone feeling noticeably apprehensive.<br><br>Fortunately, our skipper stayed remarkably calm. <strong>It was his quiet authority that</strong> kept the crew focused: he immediately assigned one person to the radar reflector, switched to the backup compass, and had us reef the mainsail before the squall hit its peak. <strong>Having practised</strong> emergency drills the day before, we managed to bring the boat safely into harbour just before dark. Looking back, that crossing taught me that in any high-pressure situation, clear communication matters far more than optimism."`
    },
    closeReading: {
      heading: 'How Cleft Sentences Spotlight Fear in the Captain\'s Log',
      cards: [
        {
          title: '1. "What unnerved the crew most was not the howling gale..."',
          bodyHtml: 'A <em>What</em>-cleft packages known background ("something unnerved the crew") into a noun clause so the true horror lands after <em>was</em> with full dramatic weight.'
        },
        {
          title: '2. "It was only when the first mate vanished that..."',
          bodyHtml: 'Combining an <em>It</em>-cleft with <em>only when</em> isolates the exact threshold where uneasy suspicion turned into open panic.'
        },
        {
          title: '3. Maritime Precision vs. Modern Metaphor',
          bodyHtml: 'Stoker grounds the supernatural in concrete sea-log terms (<em>coxswain, derelict</em>), while words like <em>inexorable</em> and <em>trepidation</em> transfer seamlessly into modern C1/C2 essays.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'VERB AGREEMENT & PLURAL FOCUS IN CLEFTS',
      nuanceTitle: 'Singular vs. Plural BE in What-Clefts and It-Clefts',
      nuanceIntroHtml: 'At C2 level, watch how verb agreement behaves differently in <strong>It-clefts</strong> versus <strong>What-clefts</strong> when the focused noun phrase is plural:',
      nuanceCards: [
        {
          title: 'It-Clefts: Always Singular "It is / was"',
          bodyHtml: 'Even when focusing a plural noun, <em>It</em> takes a singular verb: <em>"<strong>It was</strong> the sudden disappearances <strong>that</strong> broke their morale."</em>'
        },
        {
          title: 'What-Clefts: Can Take Plural BE Before a Plural Noun',
          bodyHtml: 'When a <em>What</em>-clause is followed by a plural noun, formal English allows <em>was</em> or <em>were</em>: <em>"<strong>What</strong> mattered most <strong>were</strong> the captain\'s final log entries."</em>'
        }
      ],
      workouts: [
        {
          label: 'What-Cleft Focus',
          promptHtml: 'Rewrite starting with <strong>What</strong> to emphasise the cause: <em>"The total silence below deck frightened the sailors most."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>What frightened the sailors most was</strong> the total silence below deck."</em>'
        },
        {
          label: 'It-Cleft Time Focus',
          promptHtml: 'Rewrite starting with <strong>It was not until</strong>: <em>"The coastguard only discovered the logbook when they boarded the wreck."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>It was not until</strong> the coastguard boarded the wreck <strong>that</strong> they discovered the logbook."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "frightened the sailors" and "the total silence below deck".', s23: 'Build a What-cleft subject clause ("What frightened the sailors most") + copula ("was") + "the".', s4: '1 mark for "What frightened the sailors (most)" + 1 mark for "was the".' },
      { s1: 'Cross out "the ship crashed into Whitby harbour" and "the storm finally died down".', s23: 'It-cleft time focus: "It was not until... that..." (no inversion after "that"!).', s4: '1 mark for "not until" + 1 mark for "that".' },
      { s1: 'Cross out "There was nothing the captain could do" -> "The captain was powerless".', s23: 'Collocation: "stop/prevent the crew (from) panicking" + adjective "inexorable".', s4: '1 mark for "stop/prevent the crew (from) panicking" + 1 mark for "inexorable".' },
      { s1: 'Cross out "the captain tied himself to the wheel". Deficit: "Because he knew no one else was left".', s23: 'Present participle opener ("Knowing that...") shares the same subject ("the captain").', s4: '1 mark for "Knowing (that) there was" + 1 mark for "no one / nobody".' },
      { s1: 'Cross out "The crew were" and "that they refused to go below deck". Deficit: "filled with such fear".', s23: 'Fronted degree inversion: "Such was the crew\'s trepidation" (or "So great was their trepidation").', s4: '1 mark for "Such was" / "So great was" + 1 mark for "trepidation".' }
    ]
  },

  frankenstein_unit1: {
    speaking: {
      title: 'Ambition, Breakthroughs & Unexpected Consequences',
      introHtml: 'Before we step into Victor Frankenstein\'s laboratory, warm up your voice for <strong>2 minutes</strong>. Try to include <strong>one counterfactual conditional</strong> (e.g. <em>Had I known how long it would take...</em>) when reflecting on your experience.',
      prompt: 'Describe an ambitious project, experiment, or goal that you worked hard to complete.',
      bullets: [
        'what the project or goal was and why you chose it',
        'what preparation or effort it required from you',
        'how you felt at the moment you finally finished it',
        'and explain whether the final result matched your original expectations.'
      ],
      spokenFramesHtml: '<em>"Had I realised at the start how..."</em> • <em>"exhausted by months of preparation..."</em>',
      modelHtml: `"I'd like to talk about a software prototype I built with two university friends during our final year of engineering. Our goal was to design an automated sensor system that could monitor soil moisture for local community gardens and send alerts before crops dried out.<br><br>At the beginning, we were completely swept up in the excitement of the idea. We spent nearly four months soldering circuit boards in a cramped basement lab and debugging code late into the night. <strong>Had we anticipated</strong> how temperamental the wireless sensors would be in cold weather, we would have designed a much simpler casing from the outset. By the final week before the demonstration, all three of us were running on four hours of sleep.<br><br>Curiously enough, when the system finally went live and worked on stage, my immediate reaction wasn't triumph—it was sheer exhaustion and a strange sense of anticlimax. Looking at the tangle of wires inside the box, I could only see the flaws we hadn't had time to fix. Still, that project taught me a vital lesson: single-minded ambition can get a project across the finish line, but sustainable pacing is what keeps the quality intact."`
    },
    closeReading: {
      heading: 'How Mary Shelley Contrasts Obsessive Hope with Instant Regret',
      cards: [
        {
          title: '1. "Hardly had the creature opened its dull yellow eye when..."',
          bodyHtml: 'The instant Victor succeeds, the dream collapses. Fronting <em>Hardly had... when</em> compresses two years of labour into a single second of revulsion.'
        },
        {
          title: '2. "Had I foreseen the misery my ambition would unleash..."',
          bodyHtml: 'By dropping <em>if</em> and inverting <em>Had I foreseen</em>, Shelley elevates Victor\'s hindsight into a formal tragic confession.'
        },
        {
          title: '3. Sensory Contrast: "dull yellow eye" vs. "lustrous black hair"',
          bodyHtml: 'Notice why the Creature is terrifying: Victor selected individual parts that were "beautiful" in isolation, but in combination they look <em>incongruous</em> and unnatural.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'NEGATIVE INVERTED CONDITIONALS',
      nuanceTitle: 'Why You Must Never Contract "Hadn\'t" in Inverted Conditionals',
      nuanceIntroHtml: 'In spoken English, <em>"If I hadn\'t seen it..."</em> is natural. In formal C1/C2 inverted conditionals, however, <strong>not</strong> must stay separated after the subject—never contracted onto <em>Had</em>:',
      nuanceCards: [
        {
          title: 'Correct C1/C2 Formal Order',
          bodyHtml: '<em>"<strong>Had Victor not abandoned</strong> the Creature on that first night, the tragedy might have been averted."</em>'
        },
        {
          title: 'Exam Error to Avoid',
          bodyHtml: '✗ <em>"Hadn\'t Victor abandoned..."</em> (Contracting <em>Hadn\'t</em> at the start of a statement turns it into a negative question).'
        }
      ],
      workouts: [
        {
          label: 'Inverted 3rd Conditional',
          promptHtml: 'Rewrite omitting <strong>if</strong>: <em>"If the researchers had tested the vaccine earlier, the outbreak would have been contained."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Had the researchers tested</strong> the vaccine earlier, the outbreak would have been contained."</em>'
        },
        {
          label: 'Correlative Time Inversion',
          promptHtml: 'Rewrite starting with <strong>Hardly</strong>: <em>"The machine had scarcely been switched on when the main fuse blew."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Hardly had the machine been</strong> switched on <strong>when</strong> the main fuse blew."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "he would never have created the monster". Deficit: "If Victor had known how much suffering it would cause".', s23: 'Drop "If" and invert past perfect: "Had Victor known/realised how much suffering".', s4: '1 mark for "Had Victor known/realised" + 1 mark for "how much suffering".' },
      { s1: 'Cross out "the creature opened its eyes" and "Victor rushed out".', s23: '"Hardly had [subject] [V3] when..." (remember: Hardly pairs with WHEN, whereas No sooner pairs with THAN).', s4: '1 mark for "Hardly had the creature opened" + 1 mark for "its eyes when".' },
      { s1: 'Cross out "his health would not have failed so quickly". Deficit: "If Victor had not worked so obsessively".', s23: 'Negative inverted conditional: "Had Victor not worked" (place NOT after the subject).', s4: '1 mark for "Had Victor not" + 1 mark for "worked so obsessively".' },
      { s1: 'Cross out "Victor immediately felt deep disgust". Deficit: "On seeing the creature move".', s23: 'Replace "disgust" with C1 noun "abhorrence": "filled Victor with abhorrence".', s4: '1 mark for "filled Victor" + 1 mark for "with abhorrence".' },
      { s1: 'Cross out "he forgot to eat or sleep for days". Deficit: "Victor\'s desire for knowledge was so unquenchable that".', s23: 'Fronted degree inversion: "So unquenchable was Victor\'s desire" (or "Such was Victor\'s unquenchable desire").', s4: '1 mark for "So unquenchable was" + 1 mark for "Victor\'s desire".' }
    ]
  },

  frankenstein_unit2: {
    speaking: {
      title: 'Sublime Landscapes & Resolve Dual Perspectives',
      introHtml: 'Before we ascend the Mer de Glace in the Alps, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one concession structure</strong> (e.g. <em>Much as I admired..., Cold though the wind was...</em>) during your description.',
      prompt: 'Describe a dramatic natural landscape (such as mountains, a coastline, or a forest) that you have visited.',
      bullets: [
        'where this landscape is and when you went there',
        'what the physical surroundings and weather were like',
        'what you did while you were there',
        'and explain how being in that landscape made you feel.'
      ],
      spokenFramesHtml: '<em>"Exhausting though the climb was..."</em> • <em>"Much as I enjoy city life..."</em>',
      modelHtml: `"I'd like to describe a hike I took two summers ago across the Glencoe ridge in the Scottish Highlands. I drove up early on a Saturday morning with a close friend because we wanted to reach the summit plateau before the afternoon clouds rolled in.<br><br>As we climbed above the valley floor, the scale of the landscape changed dramatically. On either side of the trail stood sheer basalt cliffs cut by narrow waterfalls, and the wind coming off the snow patches at the top was bitingly cold. <strong>Exhausting though the final scramble was</strong>, stepping out onto the high ridge gave us an unforgettable view across three different lochs stretching toward the coast.<br><br>We spent about an hour sitting behind a stone cairn drinking hot tea and watching the mist shift across the peaks. <strong>Much as I appreciate</strong> the convenience of living in a busy city, being up on that exposed granite ridge made everyday career stresses feel remarkably small. Even when a sudden hail shower forced us to hurry back down the path, the sense of mental clarity stayed with me for weeks afterwards."`
    },
    closeReading: {
      heading: 'How Shelley Balances Concession and Conflict on the Glacier',
      cards: [
        {
          title: '1. "Detestable though the creature appeared..."',
          bodyHtml: 'Fronting the adjective <em>Detestable</em> before <em>though</em> lets Shelley acknowledge Victor\'s physical revulsion first, so the Creature\'s eloquence hits with unexpected moral force.'
        },
        {
          title: '2. "Much as I loathed my creation..."',
          bodyHtml: '<em>Much as + subject + verb</em> concedes an intense emotion up front before pivoting to duty: Victor cannot deny that he owes the Creature a hearing.'
        },
        {
          title: '3. Archaic "Thou / Wilt" vs. Modern Formal Register',
          bodyHtml: 'The Creature speaks in Miltonic <em>thou/thee/thy</em> to sound like fallen Adam in <em>Paradise Lost</em>—a literary device to recognize in reading, while keeping <em>benevolent</em>, <em>callous</em>, and <em>abhor</em> for your own essays.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'ADJECTIVE VS. ADVERB FRONTING WITH AS / THOUGH',
      nuanceTitle: 'When to Use "Adjective + as/though" vs. "Much as"',
      nuanceIntroHtml: 'In Cambridge Part 4, pay close attention to the part of speech you are fronting when building a formal concession clause:',
      nuanceCards: [
        {
          title: 'Adjective / Adverb + as / though + Subject + Verb',
          bodyHtml: 'Never put <em>Although</em> before the adjective! Write: <em>"<strong>Formidable though</strong> the glacier was..."</em> (NOT <em>Although formidable though...</em>).'
        },
        {
          title: 'Much as + Subject + Verb (For Verbs of Feeling)',
          bodyHtml: 'When conceding a verb like <em>admire, respect, detest,</em> or <em>regret</em>, open with <strong>Much as</strong>: <em>"<strong>Much as</strong> Victor <strong>abhorred</strong> the sight, he listened."</em>'
        }
      ],
      workouts: [
        {
          label: 'Fronted Adjective Concession',
          promptHtml: 'Rewrite starting with the adjective <strong>Bleak</strong>: <em>"Although the alpine valley looked bleak, it offered Victor temporary peace."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Bleak though</strong> (or: <strong>Bleak as</strong>) the alpine valley looked, it offered Victor temporary peace."</em>'
        },
        {
          label: 'Prepositional Concession',
          promptHtml: 'Rewrite using <strong>notwithstanding</strong>: <em>"Despite his creator\'s hostility, the Creature spoke with calm precision."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Notwithstanding his creator\'s hostility</strong>, the Creature spoke with calm precision."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "the creature looked" and "its words were surprisingly gentle". Deficit: "Although... terrifying".', s23: 'Front the adjective before "though/as": "Terrifying though/as the creature looked".', s4: '1 mark for "Terrifying though/as" + 1 mark for "the creature looked".' },
      { s1: 'Cross out "Victor hated the creature" and "he felt forced to listen".', s23: 'Concessive verb opener: "Much as Victor hated/abhorred the creature".', s4: '1 mark for "Much as" + 1 mark for "Victor hated/abhorred".' },
      { s1: 'Cross out "the freezing wind on the glacier" and "Victor continued his climb".', s23: 'Formal prepositional concession: "In spite of" or "Notwithstanding" + noun phrase.', s4: '1 mark for "In spite of" + 1 mark for "the freezing wind".' },
      { s1: 'Cross out "Victor refused to show any kindness". Deficit: "Even though the creature begged for help".', s23: 'Use C1 adjective "callous" ("remained callous to") or verb "spurned".', s4: '1 mark for "remained callous" + 1 mark for "to the creature\'s pleas".' },
      { s1: 'Cross out "The creature had originally been" and "before people drove him away".', s23: 'Replace "kind and gentle" with C1 noun/adjective "benevolent / full of benevolence".', s4: '1 mark for "full of benevolence / benevolent by" + 1 mark for "nature".' }
    ]
  },

  frankenstein_unit3: {
    speaking: {
      title: 'Social Inclusion, First Languages & Belonging',
      introHtml: 'Before we read the Creature\'s account of how he secretly learned language at the De Lacey cottage, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one passive reporting verb or cleft sentence</strong>.',
      prompt: 'Describe a time when learning a new skill or language helped you understand another culture or group of people.',
      bullets: [
        'what the skill or language was and how you learned it',
        'what difficulties you faced in the early stages',
        'a specific moment when you realised you had made real progress',
        'and explain how that experience changed your perspective.'
      ],
      spokenFramesHtml: '<em>"What made the biggest difference was..."</em> • <em>"It is often assumed that..., yet..."</em>',
      modelHtml: `"I'd like to talk about the year I spent learning conversational German while working at a research institute in Munich. Before moving there, I had only studied grammar from textbooks, so during my first month I felt quite isolated whenever colleagues chatted over coffee.<br><br><strong>What made the biggest difference was</strong> joining a local evening rowing club where nobody spoke English during training. For the first six weeks, I mostly listened closely to how people phrased everyday requests and jokes—almost like an observer piecing together a code. <strong>Difficult though it was</strong> to keep up with regional idioms at first, having to respond in real time forced me to stop translating word-for-word in my head.<br><br>The turning point came one Saturday morning when our boat's rudder jammed mid-river and I managed to explain the mechanical problem clearly in German without hesitating. <strong>It is often assumed that</strong> fluency is just about passing exams, but that experience showed me that language is fundamentally about shared trust and belonging."`
    },
    closeReading: {
      heading: 'How the Creature Uses Formal Rhetoric to Appeal for Justice',
      cards: [
        {
          title: '1. "What I required of my creator was not indulgence, but justice..."',
          bodyHtml: 'The Creature rejects pity. Using a contrastive <em>What</em>-cleft (<em>What I required... was not X, but Y</em>), he frames his demand as a legal and moral right.'
        },
        {
          title: '2. "Driven from every human dwelling, I learned to abhor..."',
          bodyHtml: 'A past participle clause (<em>Driven from...</em>) places the blame squarely on society\'s rejection before stating the Creature\'s retaliation.'
        },
        {
          title: '3. Sociological Precision: "ostracism" & "repudiate"',
          bodyHtml: 'Shelley\'s central thesis—that <em>ostracism</em> breeds hostility—gives you two of the sharpest C1/C2 words for modern essays on crime, education, and social policy.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'CONTRASTIVE CLEFTS & PASSIVE REPORTING',
      nuanceTitle: 'Combining "What... was not X, but Y" with Impersonal Reporting',
      nuanceIntroHtml: 'In high-scoring C1/C2 discursive essays, you can pair a contrastive <strong>What-cleft</strong> with an <strong>impersonal passive</strong> to refute a simplistic popular belief and state your thesis cleanly:',
      nuanceCards: [
        {
          title: 'Step 1: Distance the Myth (Impersonal Passive)',
          bodyHtml: '<em>"<strong>It is widely assumed that</strong> harsher sentences deter youth offending..."</em>'
        },
        {
          title: 'Step 2: Deliver the Counter-Thesis (Contrastive What-Cleft)',
          bodyHtml: '<em>"...yet <strong>what actually reduces recidivism is not</strong> isolation, <strong>but</strong> structured rehabilitation."</em>'
        }
      ],
      workouts: [
        {
          label: 'Contrastive What-Cleft',
          promptHtml: 'Rewrite starting with <strong>What drove</strong>: <em>"Cruel social rejection, rather than natural malice, drove the Creature to revenge."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>What drove the Creature to revenge was not</strong> natural malice, <strong>but</strong> cruel social rejection."</em>'
        },
        {
          label: 'Participle + Vocabulary Upgrade',
          promptHtml: 'Combine using <strong>Ostracised by</strong>: <em>"The villagers excluded him because of his appearance. He hid in the forest."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Ostracised by the villagers</strong> because of his appearance, he hid in the forest."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "hurt the creature most" and "being rejected by the De Lacey family".', s23: 'Nominal What-cleft: "What hurt the creature most" + "was" + gerund phrase.', s4: '1 mark for "What hurt the creature (most)" + 1 mark for "was being".' },
      { s1: 'Cross out "he decided to seek revenge". Deficit: "Because he had been rejected by everyone".', s23: 'Passive perfect participle opener: "Having been rejected/ostracised/spurned by everyone".', s4: '1 mark for "Having been" + 1 mark for "rejected/ostracised/spurned by".' },
      { s1: 'Cross out "Victor refused to accept his responsibility".', s23: 'Replace "refused to accept" with C1 verb "repudiated" (or "chose to repudiate").', s4: '1 mark for "repudiated his" + 1 mark for "responsibility".' },
      { s1: 'Cross out "People often believe that" and "monsters are born evil".', s23: 'Impersonal passive reporting: "It is often believed/assumed that..." or personal "Monsters are often believed to be...".', s4: '1 mark for "It is often believed" + 1 mark for "that" (or "are believed to be").' },
      { s1: 'Cross out "the creature\'s loneliness" and "he begged Victor for a companion".', s23: 'Fronted degree inversion: "So intense/great was the creature\'s loneliness that...".', s4: '1 mark for "So intense/great was" + 1 mark for "that".' }
    ]
  },

  jekyll_unit1: {
    speaking: {
      title: 'Urban Architecture, Contrasts & Hidden Histories',
      introHtml: 'Before we walk through the fog-bound streets of Soho with Mr Utterson, warm up your voice for <strong>2 minutes</strong>. Aim to use <strong>one passive reporting structure</strong> (e.g. <em>is rumoured to have been..., is thought to date back to...</em>).',
      prompt: 'Describe an older building or street in a city you know that contrasts strongly with the modern buildings around it.',
      bullets: [
        'where this building or street is located',
        'what its exterior appearance and architecture look like',
        'what it is used for today (or what it is rumoured to have been in the past)',
        'and explain why it stands out so sharply from its surroundings.'
      ],
      spokenFramesHtml: '<em>"The building is thought to have been..."</em> • <em>"Behind its respectable facade..."</em>',
      modelHtml: `"I'd like to tell you about an old timber-and-brick apothecary building tucked away down a narrow cobbled entries alley in the Cathedral Quarter of Belfast. Whenever you walk past the surrounding glass office blocks and busy cafés, this narrow frontage looks as though it belongs to a completely different century.<br><br>On the outside, the brickwork is darkened by decades of coal smoke, with tall sash windows and worn stone steps. <strong>The building is rumoured to have been</strong> a ship's chandlery and medical dispensary back in the 1880s, and <strong>it is said to have</strong> connected to the old docks through a series of cellar vaults. For years, its peeling wooden doors gave it a slightly sinister, neglected air compared with the polished shopfronts nearby.<br><br>Recently, however, a local historical trust restored the ground floor into a small archive and reading room while leaving the original exterior untouched. What I love about that spot is how it reminds you that cities aren't built all at once—beneath the tidy modern <strong>facade</strong> of any commercial district, there are layers of older history waiting to be noticed."`
    },
    closeReading: {
      heading: 'How Stevenson Uses Passive Reporting to Build Urban Rumour',
      cards: [
        {
          title: '1. "The blistered door was rumoured to lead into..."',
          bodyHtml: 'Stevenson never reveals the connection between Jekyll and Hyde directly in Chapter 1; instead, passive reporting verbs (<em>was rumoured to, was said to</em>) filter the truth through polite Victorian gossip.'
        },
        {
          title: '2. Architectural Dualism: Front Square vs. Soho Back Door',
          bodyHtml: 'Dr Jekyll\'s house has two faces: a stately, respectable square in front (the public <em>facade</em>) and a windowless, discoloured laboratory door in a dingy Soho alley (the hidden shadow).'
        },
        {
          title: '3. "He is thought to have paid the family off..."',
          bodyHtml: 'Pairing a present passive reporting verb (<em>is thought</em>) with the perfect infinitive (<em>to have paid</em>) allows Utterson to weigh up a past scandal with legal detachment.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'INFINITIVE ASPECT IN PASSIVE REPORTING',
      nuanceTitle: 'Choosing Between Simple, Continuous, and Perfect Infinitives',
      nuanceIntroHtml: 'When converting an active rumour into a personal passive reporting structure (<em>Subject + BE + V3 + to-infinitive</em>), the form of the infinitive depends on whether the reported action is <strong>simultaneous</strong> or <strong>earlier</strong>:',
      nuanceCards: [
        {
          title: 'Simultaneous State / Action: to + V1 / to be + V-ing',
          bodyHtml: '<em>"Hyde <strong>is believed to hold</strong> a key to the laboratory."</em> / <em>"He <strong>is rumoured to be hiding</strong> in Soho."</em>'
        },
        {
          title: 'Earlier Completed Action: to have + V3 (or to have been + V3)',
          bodyHtml: '<em>"The cheque <strong>is known to have been signed</strong> by Dr Jekyll himself."</em> (Passive perfect infinitive).'
        }
      ],
      workouts: [
        {
          label: 'Personal Passive + Perfect Infinitive',
          promptHtml: 'Rewrite starting with <strong>The mysterious stranger</strong>: <em>"Witnesses claim that the mysterious stranger entered through the laboratory door."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>The mysterious stranger is claimed</strong> (or: <strong>was claimed</strong>) <strong>to have entered</strong> through the laboratory door."</em>'
        },
        {
          label: 'Passive Infinitive Shift',
          promptHtml: 'Rewrite starting with <strong>The signature</strong>: <em>"Clerks suspect that someone forged the signature on the will."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>The signature is suspected to have been forged</strong> on the will."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "People rumour that" and "the mysterious Mr Hyde uses the back door".', s23: 'Personal passive reporting with simultaneous action: "is rumoured to use".', s4: '1 mark for "is rumoured" + 1 mark for "to use".' },
      { s1: 'Cross out "Everyone believes that" and "Dr Jekyll wrote the strange will himself".', s23: 'Earlier past action ("wrote") requires perfect infinitive: "is believed to have written".', s4: '1 mark for "is believed" + 1 mark for "to have written".' },
      { s1: 'Cross out "Witnesses say that" and "the cheque was signed by a respectable doctor".', s23: 'Earlier passive action ("was signed") -> passive perfect infinitive: "is said to have been signed".', s4: '1 mark for "is said to" + 1 mark for "have been signed".' },
      { s1: 'Cross out "Nobody could explain why" -> "It was impossible to explain".', s23: 'Use C1 noun "repugnance": "felt such (strong/intense) repugnance towards".', s4: '1 mark for "felt such repugnance" + 1 mark for "towards/for".' },
      { s1: 'Cross out "Dr Jekyll\'s respectable reputation was only a false front".', s23: 'Replace "false front" with C1 noun "facade": "was nothing more than a facade".', s4: '1 mark for "nothing more than" + 1 mark for "a facade".' }
    ]
  },

  jekyll_unit2: {
    speaking: {
      title: 'Scientific Ethics, Curiosity & Professional Boundaries',
      introHtml: 'Before we open Dr Lanyon\'s sealed narrative, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one degree inversion or correlative structure</strong> (e.g. <em>So startling was the result that...</em> or <em>No sooner had... than...</em>).',
      prompt: 'Describe a scientific discovery, medical breakthrough, or technological invention that changed how people live or think.',
      bullets: [
        'what the discovery or invention is',
        'how people used to manage before it existed',
        'what positive changes it brought to society',
        'and explain any ethical questions or risks that came with it.'
      ],
      spokenFramesHtml: '<em>"So transformative was this breakthrough that..."</em> • <em>"No sooner had it become widespread than..."</em>',
      modelHtml: `"I'd like to talk about the development of CRISPR gene-editing technology over the past decade, which I first read about in depth during a university bioethics module. Before tools like CRISPR existed, modifying genetic sequences was slow, expensive, and imprecise, meaning that many inherited blood disorders could only be managed with lifelong symptom care rather than cured at the root.<br><br><strong>So rapid has been</strong> the progress in this field that clinical trials are now successfully treating patients with sickle-cell disease who previously had very few options. What makes the technology so remarkable is the sheer precision with which researchers can target a single faulty gene.<br><br>At the same time, however, <strong>no sooner had</strong> the first clinical successes been announced <strong>than</strong> serious ethical debates emerged around where to draw the line. Many scientists like Dr Lanyon in Stevenson's novel warn that when our technical capability outpaces our regulatory safeguards, we risk unintended consequences. For me, it's the clearest modern example of why scientific audacity always needs transparent ethical oversight."`
    },
    closeReading: {
      heading: 'How Lanyon\'s Eyewitness Account Uses Degree & Sequence Inversion',
      cards: [
        {
          title: '1. "No sooner had he swallowed the draught than..."',
          bodyHtml: 'Dr Lanyon is a sceptical materialist physician. Using <em>No sooner had... than</em> shows that the physical transformation was instantaneous—leaving no room for hallucination.'
        },
        {
          title: '2. "Such was the horror of the sight that my mind reeled..."',
          bodyHtml: 'Fronting <em>Such + BE + Noun Phrase + that</em> elevates Lanyon\'s clinical shock into an existential collapse that literally costs him his life.'
        },
        {
          title: '3. Apothecary Precision vs. C1 Evaluative Lexis',
          bodyHtml: 'Stevenson anchors the scene with Victorian pharmacy terms (<em>phial, minim, draught</em>), paired with timeless C1 nouns like <em>trepidation</em> and <em>audacity</em>.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'SO + ADJECTIVE VS. SUCH + NOUN INVERSION',
      nuanceTitle: 'Mastering the Exact Switch Between "So... that" and "Such... that"',
      nuanceIntroHtml: 'Cambridge Part 4 regularly tests whether candidates can switch between <strong>So</strong> and <strong>Such</strong> at the start of an inverted result sentence without mixing up adjectives and nouns:',
      nuanceCards: [
        {
          title: 'Formula A: So + Adjective / Adverb + BE + Subject + that',
          bodyHtml: '<em>"<strong>So violent was</strong> the chemical reaction <strong>that</strong> the glass cracked."</em> (Adjective sits immediately after <em>So</em>).'
        },
        {
          title: 'Formula B: Such + BE + Noun Phrase + that',
          bodyHtml: '<em>"<strong>Such was the violence of</strong> the chemical reaction <strong>that</strong> the glass cracked."</em> (Verb <em>was</em> sits immediately after <em>Such</em>).'
        }
      ],
      workouts: [
        {
          label: 'So -> Such Transformation',
          promptHtml: 'Rewrite starting with <strong>Such</strong>: <em>"The visitor\'s impatience was so great that he seized the graduated glass."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Such was the visitor\'s impatience that</strong> he seized the graduated glass."</em>'
        },
        {
          label: 'No sooner... than',
          promptHtml: 'Rewrite starting with <strong>No sooner</strong>: <em>"As soon as the red liquid touched the powder, the mixture began to boil."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>No sooner had</strong> the red liquid touched the powder <strong>than</strong> the mixture began to boil."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "he drank the potion" and "his face began to change". Deficit: "As soon as".', s23: 'Correlative past perfect inversion: "No sooner had he drunk the potion than...".', s4: '1 mark for "No sooner had he drunk" + 1 mark for "the potion than".' },
      { s1: 'Cross out "Lanyon\'s shock" and "that he could not sleep for weeks". Deficit: "was so great".', s23: 'Noun phrase ("Lanyon\'s shock") requires "Such was Lanyon\'s shock that...".', s4: '1 mark for "Such was" + 1 mark for "Lanyon\'s shock that".' },
      { s1: 'Cross out "The visitor was" and "that his hands were shaking". Deficit: "so desperate for the powder".', s23: 'Fronted adjective inversion: "So desperate was the visitor (for the powder) that...".', s4: '1 mark for "So desperate was" + 1 mark for "the visitor".' },
      { s1: 'Cross out "Hyde asked Lanyon if he wanted to let him go or know the secret".', s23: 'Use C1 verb "disclose": "offered to disclose the secret" (or "asked whether he should disclose").', s4: '1 mark for "disclose" + 1 mark for "the secret".' },
      { s1: 'Cross out "Lanyon opened the drawer" and "with a strong feeling of fear".', s23: 'Replace "fear/unease" with C1 prepositional phrase "with great/considerable trepidation".', s4: '1 mark for "with (great)" + 1 mark for "trepidation".' }
    ]
  },

  jekyll_unit3: {
    speaking: {
      title: 'Habits, Self-Discipline & Breaking Bad Routines',
      introHtml: 'Before we read Henry Jekyll\'s final confession, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one "Little did I..." or "Only when..." inversion</strong> as you describe how a habit or routine developed.',
      prompt: 'Describe a habit, routine, or lifestyle change you decided to make to improve your daily life.',
      bullets: [
        'what the old routine or habit was and how it started',
        'when you realised that it needed to change',
        'what steps you took to break the old habit or build the new one',
        'and explain how that change has affected your focus or wellbeing today.'
      ],
      spokenFramesHtml: '<em>"Little did I realise how much..."</em> • <em>"Only when I left my phone in another room did I..."</em>',
      modelHtml: `"I'd like to talk about how I broke the habit of checking work messages late at night about two years ago. It started quite innocently during a busy winter term when I kept my laptop on the kitchen table just in case an urgent email came through after dinner.<br><br><strong>Little did I realise at the time</strong> how quickly that small convenience would turn into an automatic reflex. Within a few months, I was scrolling through notifications at eleven o'clock every evening, which left my sleep fragmented and my concentration noticeably worse the next morning. <strong>Only when I caught myself</strong> replying to a routine spreadsheet query at midnight on a Sunday <strong>did I recognise</strong> how <strong>pernicious</strong> the habit had become.<br><br>To extricate myself from that cycle, I set a strict rule: at eight o'clock every evening, my phone and laptop go into a charging dock in the hallway, and I read a physical book for an hour before bed instead. The first week felt strangely uncomfortable, but within a fortnight my energy levels improved dramatically. It taught me that self-discipline works best when you change your physical environment rather than relying on willpower alone."`
    },
    closeReading: {
      heading: 'How Jekyll\'s Final Statement Uses "Little did..." & "Only when..."',
      cards: [
        {
          title: '1. "Little did I dream that I would soon be trapped..."',
          bodyHtml: 'Jekyll begins his experiment believing he can step back into his respectable life at will. Fronting <em>Little did I dream</em> captures his fatal overconfidence.'
        },
        {
          title: '2. "Only when I woke up in my own bed with Hyde\'s gnarled hand..."',
          bodyHtml: 'The subordinate time clause builds the morning scene in normal word order before the main clause inversion (<em>did I realise</em>) delivers the psychological turning point.'
        },
        {
          title: '3. High-Utility C1 Essay Vocabulary: "pernicious", "duplicity", "extricate"',
          bodyHtml: 'Jekyll\'s confession is a masterclass in vocabulary for modern essays on addiction, corporate ethics, and digital habits: <em>a pernicious influence</em>, <em>extricate oneself from a trap</em>.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'COGNITIVE VERBS WITH "LITTLE" & REFLEXIVE "EXTRICATE"',
      nuanceTitle: 'Using "Little did..." Naturally & Mastering Reflexive Prepositions',
      nuanceIntroHtml: 'In C1/C2 writing, <strong>Little</strong> only inverts when it means <em>"not at all"</em> before a verb of knowing or thinking, and <strong>extricate</strong> almost always requires a reflexive pronoun + <strong>from</strong>:',
      nuanceCards: [
        {
          title: 'Little + did / had + Subject + Cognitive Verb',
          bodyHtml: 'Pairs with <em>know, realise, suspect, dream, imagine, foresee</em>: <em>"<strong>Little did Jekyll suspect</strong> that the original salt was impure."</em>'
        },
        {
          title: 'Extricate + oneself / someone + from + Noun',
          bodyHtml: '<em>"By autumn, Jekyll could no longer <strong>extricate himself from</strong> the consequences of his <strong>duplicity</strong>."</em>'
        }
      ],
      workouts: [
        {
          label: 'Little did... Inversion',
          promptHtml: 'Rewrite starting with <strong>Little</strong>: <em>"Dr Jekyll had no idea that the first batch of chemicals contained a rare impurity."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Little did Dr Jekyll know</strong> (or: <strong>realise / suspect</strong>) that the first batch of chemicals contained a rare impurity."</em>'
        },
        {
          label: 'Only when... Delayed Inversion',
          promptHtml: 'Rewrite starting with <strong>Only when</strong>: <em>"He only understood the full danger when the supply of salt ran out."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Only when the supply of salt ran out did he understand</strong> the full danger."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "that the potion would soon stop working". Deficit: "Jekyll had no idea".', s23: 'Cognitive negative inversion: "Little did Jekyll know/realise/suspect".', s4: '1 mark for "Little did Jekyll" + 1 mark for "know/realise/suspect".' },
      { s1: 'Cross out "he saw his hand in the morning light" and "Jekyll realised he had changed in his sleep".', s23: '"Only when" + subordinate clause (normal order) + inverted main clause ("did Jekyll realise").', s4: '1 mark for "he saw his hand" + 1 mark for "did Jekyll/he realise".' },
      { s1: 'Cross out "Jekyll found it impossible to" and "the trap he had created".', s23: 'Reflexive C1 verb frame: "extricate himself from".', s4: '1 mark for "extricate himself" + 1 mark for "from".' },
      { s1: 'Cross out "Jekyll was" and "living a double life". Deficit: "exhausted by the dishonesty of".', s23: 'Replace "dishonesty" with C1 noun "duplicity": "exhausted by the duplicity of".', s4: '1 mark for "exhausted by" + 1 mark for "the duplicity of".' },
      { s1: 'Cross out "The drug had" and "on his mind and body". Deficit: "such a harmful effect".', s23: 'Use C1 adjective "pernicious": "such a pernicious effect on".', s4: '1 mark for "such a pernicious" + 1 mark for "effect on".' }
    ]
  },

  baskerville_unit1: {
    speaking: {
      title: 'Solving Mysteries & Weighing Up Clues',
      introHtml: 'Before we join Holmes and Watson at 221B Baker Street, warm up your voice for <strong>2 minutes</strong>. Aim to use <strong>at least two past modals of deduction</strong> (e.g. <em>must have been, can\'t have been, might well have...</em>).',
      prompt: 'Describe a time when you had to figure out the explanation for a puzzling problem, lost item, or misunderstanding.',
      bullets: [
        'what the problem or puzzle was and when it happened',
        'what initial clues or evidence you noticed',
        'what theories you ruled out as impossible',
        'and explain how you finally discovered the real explanation.'
      ],
      spokenFramesHtml: '<em>"At first I thought it must have been..."</em> • <em>"It can\'t have been a coincidence that..."</em>',
      modelHtml: `"I'd like to tell you about a puzzling incident that happened at our local community library last winter when an entire box of rare local history photographs went missing just two days before an exhibition. Because the archive room was locked with a keypad, everyone was initially baffled.<br><br>At first, several volunteers assumed the box <strong>must have been</strong> misplaced during the renovation work the week before. However, when we checked the sign-in log, we realised that <strong>can't have been</strong> the case because the curator had photographed the open box on the table the previous afternoon. Looking more closely at the table, I noticed two stacks of green recycling crates sitting right beside the archive shelves.<br><br>It suddenly occurred to me that the evening cleaning crew <strong>might well have</strong> mistaken the plain cardboard archive box for empty packaging—Wait: not empty packaging, because it was heavy, so they <strong>must have thought</strong> it was old magazines meant for the charity book sale downstairs! Sure enough, when we walked down to the basement sorting room, there was the box sitting untouched on the donation table. It was a great reminder that the most <strong>plausible</strong> explanation is almost always human routine rather than malice."`
    },
    closeReading: {
      heading: 'How Sherlock Holmes Uses Physical Clues to Reconstruct the Past',
      cards: [
        {
          title: '1. Cigar Ash Dropped Twice -> "He must have been waiting..."',
          bodyHtml: 'Holmes never guesses blindly: two heaps of cigar ash prove duration, justifying the continuous deduction <em>must have been waiting</em>.'
        },
        {
          title: '2. Running on His Toes -> Logical Impossibility ("can\'t have walked")',
          bodyHtml: 'Deep toe-prints in damp gravel rule out a calm evening stroll: Sir Charles <em>cannot have been walking</em> casually—he was fleeing for his life.'
        },
        {
          title: '3. Analytical Essay Lexis: "plausible" & "circumstantial"',
          bodyHtml: 'Weighing up whether a theory is <em>plausible</em> or rests merely on <em>circumstantial evidence</em> is one of the highest-scoring moves in IELTS Task 2 and C1/C2 essays.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'MODALS OF DEDUCTION VS. CRITICISM',
      nuanceTitle: 'Don\'t Confuse "can\'t have", "mustn\'t have", and "shouldn\'t have"',
      nuanceIntroHtml: 'In Cambridge exams, examiners frequently test whether you can separate <strong>epistemic deduction</strong> (what we deduce happened) from <strong>deontic criticism</strong> (what was a mistake):',
      nuanceCards: [
        {
          title: 'Logical Impossibility: can\'t / couldn\'t have + V3',
          bodyHtml: '<em>"The butler <strong>can\'t have heard</strong> the gunshot from the cellar."</em> (= It is logically impossible that he heard it).'
        },
        {
          title: 'Past Regret / Criticism: should not / ought not to have + V3',
          bodyHtml: '<em>"Sir Charles <strong>should not have waited</strong> by the gate alone."</em> (= He DID wait there, and it was unwise).'
        }
      ],
      workouts: [
        {
          label: 'Continuous Past Deduction',
          promptHtml: 'Rewrite using <strong>must have been</strong>: <em>"The mud on his boots proves that he was walking across the moor in the rain."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"Judging by the mud on his boots, he <strong>must have been walking</strong> across the moor in the rain."</em>'
        },
        {
          label: 'Strengthened Possibility (may well have)',
          promptHtml: 'Rewrite using <strong>well</strong>: <em>"It is very plausible that sudden panic triggered his heart failure."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"Sudden panic <strong>may well have triggered</strong> (or: <strong>might/could well have triggered</strong>) his heart failure."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "Based on the cigar ash, Sir Charles" and "at the gate". Deficit: "Holmes was certain that... had been standing expectantly... for someone".', s23: 'Certainty about past action in progress -> "must have been waiting for someone".', s4: '1 mark for "must have been waiting" + 1 mark for "for someone/somebody".' },
      { s1: 'Cross out "It" and "giant footprints were found near the alley". Deficit: "is logically impossible that... happened purely by chance".', s23: 'Logical impossibility in the past -> "cannot / can\'t / could not have been a coincidence that".', s4: '1 mark for "cannot/can\'t/could not have been" + 1 mark for "a coincidence that".' },
      { s1: 'Cross out "Sir Charles stood out in the cold rain". Deficit: "Nobody could offer a reasonable explanation for why".', s23: 'Noun phrase after "There was": "no plausible explanation for why / as to why".', s4: '1 mark for "no plausible explanation" + 1 mark for "for/as to why".' },
      { s1: 'Cross out "Sir Charles\'s heart attack" and "by sudden terror". Deficit: "It is very likely that... was brought on".', s23: 'Strong passive past possibility: "might/may/could well have been brought on".', s4: '1 mark for "might/may/could well" + 1 mark for "have been brought on".' },
      { s1: 'Cross out "Holmes refused to jump to conclusions" and "alone". Deficit: "when there was only indirect evidence".', s23: 'Prepositional collocation: "on the basis/strength of circumstantial evidence".', s4: '1 mark for "on the basis/strength of" + 1 mark for "circumstantial evidence".' }
    ]
  },

  baskerville_unit2: {
    speaking: {
      title: 'Atmospheric Places & Navigating Difficult Terrain',
      introHtml: 'Before we cross Dartmoor and Grimpen Mire with Dr Watson, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one place inversion</strong> (e.g. <em>Beyond the town lay..., At the top of the hill stood...</em>).',
      prompt: 'Describe a remote or wild place in the countryside that you have visited or travelled through.',
      bullets: [
        'where this place is and what took you there',
        'what the terrain, weather, and horizon looked like',
        'what sounds or details you noticed while walking or travelling through it',
        'and explain why that place felt memorable or atmospheric.'
      ],
      spokenFramesHtml: '<em>"Beyond the last village lay..."</em> • <em>"Nowhere along the road was..."</em>',
      modelHtml: `"I'd like to talk about a winter walk I took across the Mourne Mountains in County Down a couple of Januaries ago. A friend and I set off early from a quiet forestry car park hoping to follow the old granite wall up toward Hare's Gap before dusk.<br><br>Once we climbed past the treeline, the scenery opened out into a vast, <strong>desolate</strong> upland basin. <strong>Beyond the lower ridges lay</strong> miles of heather and peat bog dusted with frost, and <strong>at the head of the valley stood</strong> a line of jagged granite tors half-hidden in low cloud. Because the ground near the stream was marshy, some stretches of the path were quite <strong>treacherous</strong> underfoot, so we had to pick our way carefully from stone to stone.<br><br>What made the walk so memorable was the extraordinary stillness of the afternoon. <strong>Nowhere along the five-mile trail was</strong> a single house or road in sight, and the only sound coming out of the mist was the call of ravens echoing off the cliffs. Even though our boots were soaked by the time we got back to the car, that quiet, <strong>melancholy</strong> landscape completely cleared my head."`
    },
    closeReading: {
      heading: 'How Conan Doyle Uses Place Inversion like a Camera Lens',
      cards: [
        {
          title: '1. "Over the green squares of the fields... there rose in the distance a grey, melancholy hill"',
          bodyHtml: 'By placing the landscape frame first and delaying the subject until the end of the clause, Doyle makes the reader scan the horizon before spotting Dartmoor.'
        },
        {
          title: '2. "there came out of the heart of the great bog a strange, deep, melancholy cry"',
          bodyHtml: 'Directional inversion (<em>out of the bog came a cry</em>) mirrors how we experience sound in fog: we hear the direction before we know what made the noise.'
        },
        {
          title: '3. Literal Bog -> Modern Essay Metaphor ("quagmire")',
          bodyHtml: 'Grimpen Mire is a literal <em>quagmire</em> (bog), which gives modern C1/C2 writers the classic metaphor <em>a legal, bureaucratic, or political quagmire</em>.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'INTRANSITIVE POSITION VERBS & THE PRONOUN RESTRICTION',
      nuanceTitle: 'Why Positive Place Inversion Never Uses "Did" and Rejects Pronouns',
      nuanceIntroHtml: 'Unlike negative inversion (<em>Never did he...</em>), <strong>positive place inversion</strong> swaps the whole main verb before a full noun subject—and has two strict C1/C2 constraints:',
      nuanceCards: [
        {
          title: '1. No Auxiliary "Did" with Position/Motion Verbs',
          bodyHtml: 'Use the simple verb (<em>stood, lay, rose, hung, emerged, came</em>) directly: <em>"<strong>Beyond the ridge lay</strong> the mire"</em> (NEVER <em>did lie</em>).'
        },
        {
          title: '2. Full Noun Subjects Only (Never Short Pronouns)',
          bodyHtml: 'Write <em>"Out of the mist emerged <strong>a tall figure</strong>"</em>—but if the subject is a pronoun, keep normal order: <em>"Out of the mist <strong>he emerged</strong>."</em>'
        }
      ],
      workouts: [
        {
          label: 'Positive Place Inversion',
          promptHtml: 'Rewrite starting with <strong>At the edge of the moor</strong>: <em>"The stone towers of Baskerville Hall stood at the edge of the moor."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>At the edge of the moor stood</strong> the stone towers of Baskerville Hall."</em>'
        },
        {
          label: 'Negative Place Inversion ("Nowhere")',
          promptHtml: 'Rewrite starting with <strong>Nowhere</strong>: <em>"We could not see a single shepherd\'s hut anywhere on the hillside."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Nowhere on the hillside could we see</strong> (or: <strong>was there</strong>) a single shepherd\'s hut."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "Just" and "treacherous quagmire of Grimpen Mire". Deficit: "was situated... beyond the granite hills".', s23: 'Positive place inversion: "beyond the granite hills/tors" + past tense of lie ("lay") + "the".', s4: '1 mark for "beyond the granite hills/tors" + 1 mark for "lay the".' },
      { s1: 'Cross out "a low, melancholy cry that echoed across the valley". Deficit: "came out of the swirling moorland fog".', s23: 'Directional phrase opener + inverted motion verb: "Out of the swirling/rolling mist came/rose".', s4: '1 mark for "Out of the swirling/rolling mist" + 1 mark for "came/rose".' },
      { s1: 'Cross out "seen along the desolate horizon". Deficit: "Not a single cottage or dwelling could be... anywhere".', s23: 'Negative place opener "Nowhere" triggers auxiliary inversion: "Nowhere was a single/any house to be".', s4: '1 mark for "Nowhere was" + 1 mark for "a single/any house to be".' },
      { s1: 'Cross out "Ahead of us," and "twin towers of Baskerville Hall". Deficit: "stood... completely wrapped in thick fog".', s23: 'Fronted participle + inverted position verb: "shrouded in thick/dense fog stood the".', s4: '1 mark for "shrouded in thick/dense fog" + 1 mark for "stood the".' },
      { s1: 'Cross out "even the moorland ponies were afraid to cross it". Deficit: "The quagmire was so full of hidden dangers that".', s23: 'Fronted adjective inversion: "So treacherous was the quagmire/mire that".', s4: '1 mark for "So treacherous was" + 1 mark for "the quagmire/mire that".' }
    ]
  },

  baskerville_unit3: {
    speaking: {
      title: 'Debunking Myths & Evidence-Based Thinking',
      introHtml: 'Before we watch Holmes solve the case of the phosphorus hound, warm up your voice for <strong>2 minutes</strong>. Aim to use <strong>one "Had it not been for / But for" conditional</strong> and <strong>one evidence word</strong> (e.g. <em>corroborate, fallacy, plausible</em>).',
      prompt: 'Describe a popular myth, misconception, or rumour that you later discovered was untrue.',
      bullets: [
        'what the myth or misconception was and why people believed it',
        'how you first heard about it',
        'what evidence or experience proved that it was false',
        'and explain why people are often drawn to dramatic myths rather than simple facts.'
      ],
      spokenFramesHtml: '<em>"What exposed the fallacy was..."</em> • <em>"Had it not been for independent testing..."</em>',
      modelHtml: `"I'd like to talk about a widespread workplace myth I used to believe—namely, the idea that multitasking and keeping ten browser tabs open at once makes you more productive. When I started my first office job, almost everyone prided themselves on answering instant messages while drafting reports.<br><br>For a long time, I assumed that working that way was essential. <strong>Had it not been for</strong> a cognitive psychology seminar I attended two years ago, I might still be doing it today. During the workshop, the lecturer ran a timed experiment comparing people who switched tasks every two minutes with those who worked on one task at a time. The results <strong>corroborated</strong> what neuroscientists have argued for years: every time you switch context, your brain pays a measurable attention penalty.<br><br><strong>What exposed the fallacy of multitasking for me was</strong> seeing my own error rate drop by half when I simply turned off notifications for ninety-minute blocks. I think people cling to myths like multitasking—or superstitions in general—because dramatic stories flatter our ego or our fears, whereas the real explanation is usually much simpler and more disciplined."`
    },
    closeReading: {
      heading: 'How Holmes Replaces Supernatural Superstition with Forensic Proof',
      cards: [
        {
          title: '1. Counterfactual Ambush: "If it reached the path... our ambush would be useless"',
          bodyHtml: 'The rolling Dartmoor fog nearly ruins Holmes\'s plan—a moment naturally expressed in formal C1/C2 prose as <em>"But for their quick reaction..."</em> or <em>"Had they delayed a moment longer..."</em>.'
        },
        {
          title: '2. The Chemical Trick: Odourless Phosphorus',
          bodyHtml: 'Stapleton\'s "demon hound" is a coldly <em>premeditated</em> fraud: a giant bloodhound painted with glowing phosphorus to exploit the Baskerville family legend.'
        },
        {
          title: '3. High-Precision C1 Argument Verbs: "corroborate" & "expose a fallacy"',
          bodyHtml: 'Instead of writing "prove" five times in an essay, use <em>corroborate a claim</em> (confirm with evidence) and <em>expose the fallacy that...</em> (disprove a myth).'
        }
      ]
    },
    section2: {
      nuanceBadge: 'BUT FOR + NOUN PHRASE VS. HAD IT NOT BEEN FOR',
      nuanceTitle: 'Choosing Between "But for", "Had it not been for", and "If not for"',
      nuanceIntroHtml: 'When compressing a counterfactual condition into a noun phrase in Cambridge Part 4, watch the exact grammatical complement and main-clause tense:',
      nuanceCards: [
        {
          title: 'Noun Phrase Complement (Never a Full Verb Clause)',
          bodyHtml: 'Follow <strong>But for</strong> or <strong>Had it not been for</strong> with a noun phrase (or <em>the fact that + clause</em>): <em>"<strong>But for Holmes\'s vigilance</strong>, Sir Henry would have perished."</em>'
        },
        {
          title: 'Past vs. Present Consequence (Mixed Conditional)',
          bodyHtml: 'Past outcome: <em>"...would have died."</em> Present outcome of a past event: <em>"<strong>Had it not been for</strong> the portrait, the motive <strong>would still be</strong> unknown today."</em>'
        }
      ],
      workouts: [
        {
          label: 'Compact "But for" Conditional',
          promptHtml: 'Rewrite starting with <strong>But for</strong>: <em>"If the family portrait had not hung in the dining hall, Holmes would have missed the likeness."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>But for the family portrait</strong> in the dining hall, Holmes would have missed the likeness."</em>'
        },
        {
          label: 'What-Cleft + "expose the fallacy"',
          promptHtml: 'Combine starting with <strong>What exposed</strong>: <em>"The glowing phosphorus on Watson\'s fingers proved that the supernatural curse was a myth."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>What exposed the fallacy of</strong> the supernatural curse was the glowing phosphorus on Watson\'s fingers."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "in the portrait, Stapleton\'s motive would have gone undetected". Deficit: "If Holmes had not noticed the strong family likeness".', s23: 'Negative inverted 3rd conditional: "Had Holmes not noticed/spotted the family resemblance".', s4: '1 mark for "Had Holmes not noticed/spotted" + 1 mark for "the family resemblance".' },
      { s1: 'Cross out "Stapleton" and "by the quagmire during his flight in the dark". Deficit: "The police believe that... swallowed up".', s23: 'Personal passive reporting + passive perfect infinitive: "is/was presumed to have been swallowed up".', s4: '1 mark for "is/was presumed" + 1 mark for "to have been swallowed up".' },
      { s1: 'Cross out "thick moorland fog, their plan would have worked". Deficit: "If the... had not arrived so suddenly".', s23: 'Compact counterfactual noun phrase: "But for the sudden arrival of the" (or "Had it not been for the arrival of the").', s4: '1 mark for "But for / Had it not been for" + 1 mark for "the (sudden) arrival of the".' },
      { s1: 'Cross out "Holmes\'s theory" and "Sir Henry\'s stolen boot in the mire". Deficit: "Discovering... fully confirmed".', s23: 'Passive shift + nominalisation: "was (fully) corroborated by the discovery of".', s4: '1 mark for "was (fully) corroborated by" + 1 mark for "the discovery of".' },
      { s1: 'Cross out "curse was the phosphorus paint on the hound\'s muzzle". Deficit: "proved that the belief in a supernatural... was false".', s23: 'Nominal What-cleft: "What exposed/disproved the fallacy of a supernatural".', s4: '1 mark for "What exposed/disproved" + 1 mark for "the fallacy of a supernatural".' }
    ]
  },

  alice_unit1: {
    speaking: {
      title: 'Stepping Into the Unknown & Adapting to New Environments',
      introHtml: 'Before we follow Alice down the rabbit-hole, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one negative or restrictive inversion</strong> (e.g. <em>Never before had I..., Little did I suspect..., Only when... did I...</em>).',
      prompt: 'Describe a time when you entered a completely unfamiliar environment (such as a new school, job, or country) where the rules or customs felt very different.',
      bullets: [
        'what the new environment was and why you went there',
        'what surprised or disoriented you most on your first day',
        'how you adapted to the unfamiliar rules or expectations',
        'and explain what that transition taught you about adaptability.'
      ],
      spokenFramesHtml: '<em>"Never before had I experienced..."</em> • <em>"Only after the first week did I realise..."</em>',
      modelHtml: `"I'd like to talk about my first week as an exchange student at a technical university in Zurich a few years ago. I had travelled out with two suitcases and a basic grasp of high-school German, assuming that university life there would feel broadly similar to home.<br><br><strong>Little did I suspect</strong> how different the daily academic culture would be. On my very first morning, I walked into a mathematics lecture theatre at eight o'clock sharp, only to discover that students knocked on their wooden desks with their knuckles instead of clapping at the end of a lecture. <strong>Never before had I</strong> seen a timetable where seminars ran with railway precision and students were expected to defend their problem sets on the chalkboard in week one. At first, the speed of the Swiss-German dialect in the corridors was genuinely <strong>disorienting</strong>.<br><br><strong>Only by joining</strong> a small study group in the library <strong>did I manage</strong> to find my footing and realise how supportive my classmates actually were beneath that formal exterior. Looking back, stepping into an environment that initially felt slightly <strong>incongruous</strong> taught me not to panic when familiar reference points disappear."`
    },
    closeReading: {
      heading: 'How Lewis Carroll Uses Inversion to Turn Logic Upside Down',
      cards: [
        {
          title: '1. "never before had she seen a rabbit with either a waistcoat-pocket, or a watch"',
          bodyHtml: 'Carroll uses formal Victorian syntax to describe a surreal event: the contrast between dignified grammar (<em>never before had she seen</em>) and a talking rabbit in a waistcoat creates deadpan comedy.'
        },
        {
          title: '2. "So deep was the shaft that she had plenty of time..."',
          bodyHtml: 'Fronting <em>So deep was the shaft</em> suspends the law of gravity, turning a terrifying vertical fall into a leisurely Victorian drawing-room inspection.'
        },
        {
          title: '3. High-Value C1/C2 Adjectives: "precipitous", "incongruous", "disorienting"',
          bodyHtml: 'While <em>waistcoat-pocket</em> belongs to 1865, <em>a precipitous decline</em> and <em>an incongruous policy</em> are top-tier C1/C2 collocations for modern essays.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'ONLY BY / ONLY WHEN & NEGATIVE COGNITION',
      nuanceTitle: 'Separating Prepositional "Only by" from Clausal "Only when"',
      nuanceIntroHtml: 'When starting a sentence with <strong>Only</strong>, check whether it is followed by a short prepositional phrase or a full subordinate verb clause:',
      nuanceCards: [
        {
          title: 'Only by + -ing Phrase -> Invert Immediately After the Phrase',
          bodyHtml: '<em>"<strong>Only by drinking</strong> from the bottle <strong>could Alice pass</strong> through the tiny door."</em>'
        },
        {
          title: 'Only when / after + Subject + Verb -> Invert in the Second Clause',
          bodyHtml: '<em>"<strong>Only when she finished</strong> the cake <strong>did she begin</strong> to grow."</em>'
        }
      ],
      workouts: [
        {
          label: 'Only by + Gerund Inversion',
          promptHtml: 'Rewrite starting with <strong>Only by</strong>: <em>"Regulators can prevent sudden market crashes only by enforcing strict transparency rules."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Only by enforcing</strong> strict transparency rules <strong>can regulators prevent</strong> sudden market crashes."</em>'
        },
        {
          label: 'Fronted "So + Adjective" Inversion',
          promptHtml: 'Rewrite starting with <strong>So precipitous</strong>: <em>"The drop in temperature was so precipitous that the river froze overnight."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>So precipitous was</strong> the drop in temperature <strong>that</strong> the river froze overnight."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "Never" and "a creature that carried an ornamental pocket watch". Deficit: "Alice had... previously encountered".', s23: 'Fronted negative time adverbial: "Never before had Alice/she encountered".', s4: '1 mark for "before had Alice/she" + 1 mark for "encountered/met/come across".' },
      { s1: 'Cross out "Only when she saw maps hanging from the walls" and "how far she had plummeted". Deficit: "Alice only realized".', s23: 'Main-clause inversion after "Only when": "did Alice/she realize/realise".', s4: '1 mark for "did Alice/she" + 1 mark for "realize/realise".' },
      { s1: 'Cross out "Under" and "to squeeze through the fifteen-inch door". Deficit: "It was completely impossible for Alice".', s23: 'Negative prepositional phrase "Under no circumstances" + inverted verb "was Alice able".', s4: '1 mark for "no circumstances" + 1 mark for "was Alice able".' },
      { s1: 'Cross out "So" and "that Alice had plenty of time". Deficit: "The subterranean shaft was... deep".', s23: 'Fronted result inversion: "So deep was the (subterranean) shaft".', s4: '1 mark for "deep was" + 1 mark for "the (subterranean) shaft".' },
      { s1: 'Cross out "that drinking from the labeled bottle would alter her physical proportions". Deficit: "Alice had no idea".', s23: 'Negative cognition inversion: "Little did Alice/she suspect/know/imagine".', s4: '1 mark for "Little did Alice/she" + 1 mark for "suspect/know/imagine".' }
    ]
  },

  alice_unit2: {
    speaking: {
      title: 'Time Management, Bureaucracy & Overdue Reforms',
      introHtml: 'Before we take a seat at the Mad Hatter\'s tea-table, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one unreal past subjunctive</strong> (<em>It is high time..., I\'d rather people didn\'t...</em>) and <strong>one formal conditional</strong>.',
      prompt: 'Describe an outdated rule, habit, or bureaucratic process in work, travel, or education that you think is long overdue for change.',
      bullets: [
        'what the rule or process is and where you encounter it',
        'why it feels inefficient, arbitrary, or pointless today',
        'what would happen if organisations reformed or simplified it',
        'and explain why you think it has stayed in place for so long.'
      ],
      spokenFramesHtml: '<em>"It is high time institutions stopped..."</em> • <em>"Were companies to simplify..."</em>',
      modelHtml: `"I'd like to talk about a bureaucratic habit that still frustrates millions of job applicants every year: requiring candidates to upload a full CV PDF and then manually type every single job title and date all over again into twenty separate web boxes.<br><br>Whenever I encounter one of those portals, I'm reminded of the Mad Hatter's tea-table—everyone is kept busy moving from box to box, yet the exercise is completely <strong>futile</strong> because the document is already attached. <strong>Had it not been for</strong> poorly designed recruitment software from fifteen years ago, this duplicate data entry would never have become standard practice.<br><br>In my view, <strong>it is high time employers abolished</strong> redundant application forms and respected candidates' time. <strong>Were companies to streamline</strong> the initial screening process into a simple one-click upload, they would attract far more experienced professionals who currently walk away from <strong>arbitrary</strong> forty-minute forms. I think the only reason the system persists is institutional inertia—nobody in the department has to fill out the form themselves."`
    },
    closeReading: {
      heading: 'How Carroll Uses Hypotheticals & Subjunctives at Six O\'Clock',
      cards: [
        {
          title: '1. "He inspected the timepiece as though its stubborn hands were mocking him"',
          bodyHtml: 'After <em>as if / as though</em>, the unreal past subjunctive (<em>were mocking</em>) shows a hypothetical comparison that contradicts reality.'
        },
        {
          title: '2. "Had it not been for that catastrophic concert... / were they to stop moving"',
          bodyHtml: 'Carroll\'s tea-party is a closed conditional loop: a past quarrel froze the clock (3rd conditional), and any change in their present routine is hypothetical (<em>Were they to...</em>).'
        },
        {
          title: '3. Institutional Critique Lexis: "perpetual", "arbitrary", "futile"',
          bodyHtml: 'These three adjectives allow you to critique inefficient systems in IELTS Task 2 and C1 reports with calm, analytical authority.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'UNREAL PAST TENSE BACKSHIFT IN SUBJUNCTIVES',
      nuanceTitle: 'Why Present Urgency ("It is high time") Takes a Past-Tense Verb',
      nuanceIntroHtml: 'In English, stepping one tense backward (from present to past simple) signals <strong>psychological distance or unreality</strong>. That is why three high-frequency Part 4 frames use the past simple for <strong>present/future</strong> meaning:',
      nuanceCards: [
        {
          title: 'Present/Future Critique: Past Simple (stopped / did not)',
          bodyHtml: '<em>"It is <strong>high time you stopped</strong> guessing."</em> / <em>"I <strong>would rather you didn\'t interrupt</strong> right now."</em>'
        },
        {
          title: 'Past Regret About Someone Else: Past Perfect (had not)',
          bodyHtml: 'When regretting something that <strong>already happened</strong> in the past, step back to the past perfect: <em>"Alice <strong>would rather the Hatter had told</strong> her the truth earlier."</em>'
        }
      ],
      workouts: [
        {
          label: 'It is high time + Past Simple',
          promptHtml: 'Rewrite using <strong>high time</strong>: <em>"Municipal authorities really ought to replace these arbitrary parking rules now."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>It is high time municipal authorities replaced</strong> these arbitrary parking rules."</em>'
        },
        {
          label: 'Were + Subject + to-Infinitive',
          promptHtml: 'Rewrite omitting <strong>If</strong>: <em>"If the committee delayed its decision again, the funding would be lost."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"<strong>Were the committee to delay</strong> its decision again, the funding would be lost."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "According to the Hatter, it is" and "for logical explanations at the tea-table". Deficit: "Alice ought to stop asking".', s23: 'Unreal past after "It is (high/about) time": subject ("Alice") + past simple ("stopped") + "-ing" ("asking").', s4: '1 mark for "(high/about) time Alice/she" + 1 mark for "stopped asking".' },
      { s1: 'Cross out "Alice would" and "interrupt her with riddles". Deficit: "prefer the Hatter not to".', s23: '"Would rather" + new subject ("the Hatter") + past simple negative ("did not / didn\'t").', s4: '1 mark for "rather the Hatter/he" + 1 mark for "did not / didn\'t".' },
      { s1: 'Cross out "Had" and "Hatter\'s quarrel with Time last March, the clock would not stand at six".', s23: 'Inverted 3rd conditional noun phrase: "Had it not been for the".', s4: '1 mark for "it not been" + 1 mark for "for the".' },
      { s1: 'Cross out "up suddenly, the entire tea-table would be thrown into confusion". Deficit: "If the Dormouse woke".', s23: 'Inverted 2nd conditional with action verb: "Were the Dormouse to wake".', s4: '1 mark for "Were the Dormouse" + 1 mark for "to wake".' },
      { s1: 'Cross out "The March Hare addressed Alice" and "the riddle\'s answer all along". Deficit: "as if he knew".', s23: 'Unreal manner comparison: "as though he knew / had known".', s4: '1 mark for "as though" + 1 mark for "he knew / had known".' }
    ]
  },

  alice_unit3: {
    speaking: {
      title: 'Fairness, Evidence & Standing Up to Unfair Rules',
      introHtml: 'Before we enter the Queen of Hearts\' courtroom for the final lesson of the course, warm up your voice for <strong>2 minutes</strong>. Aim to include <strong>one What-cleft</strong> and <strong>one passive reporting verb or subjunctive</strong>.',
      prompt: 'Describe a time when you saw someone make a fair, well-reasoned argument to resolve a dispute or challenge an unfair decision.',
      bullets: [
        'what the dispute or unfair decision was about',
        'who spoke up and how they presented their evidence',
        'how the other people in the room reacted',
        'and explain why calm evidence is more persuasive than shouting or intimidation.'
      ],
      spokenFramesHtml: '<em>"What settled the argument was..."</em> • <em>"He insisted that the facts be checked..."</em>',
      modelHtml: `"I'd like to tell you about a student council hearing I attended at university when a campus photography society was threatened with having its funding cut. A rumour had circulated that members of the club <strong>were alleged to have</strong> damaged lighting equipment in the main studio, and the administrator wanted to suspend their room bookings immediately.<br><br>At the meeting, the atmosphere was initially quite tense. However, the club treasurer stood up with a folder of dated booking logs and timestamped photos from the previous Friday. <strong>What completely changed the tone of the room was</strong> her calm, methodical approach: rather than getting defensive, she <strong>insisted that the maintenance records be</strong> compared against the keycard swipe log.<br><br>Within five minutes, the log proved that the studio had actually been used by an external film crew the night the lights were broken, showing that the accusation against the students was wholly <strong>unsubstantiated</strong>. The administrator apologised on the spot. That afternoon stayed with me because it showed that when you are faced with an <strong>arbitrary</strong> or <strong>preposterous</strong> claim, quiet, verifiable evidence is always stronger than loud bluster."`
    },
    closeReading: {
      heading: 'How Carroll Satirises Kangaroo Courts Through Legal Syntax',
      cards: [
        {
          title: '1. "The prisoner was alleged to have purloined the royal tarts"',
          bodyHtml: 'The courtroom uses grand legal syntax (<em>was alleged to have...</em>) while possessing zero actual evidence—exposing the gap between pompous form and empty substance.'
        },
        {
          title: '2. "the King immediately demanded that the jury consider their verdict"',
          bodyHtml: 'The mandative subjunctive (<em>demanded that the jury consider</em>) mimics a real judge\'s decree, even though not a single witness has testified yet.'
        },
        {
          title: '3. "What astonished the courtroom was... her refusal to be intimidated"',
          bodyHtml: 'A nominal <em>What</em>-cleft spotlights the moral climax of the novel: Alice outgrows the bullying illusion of the court and calls them what they are—a pack of cards.'
        }
      ]
    },
    section2: {
      nuanceBadge: 'MANDATIVE SUBJUNCTIVE (ACTIVE, PASSIVE & NEGATIVE)',
      nuanceTitle: 'Forming Passive and Negative Mandative Subjunctives Cleanly',
      nuanceIntroHtml: 'After verbs and adjectives of formal demand or recommendation (<em>demand, insist, recommend, propose, essential, vital, imperative</em>), the <strong>that-clause</strong> uses the bare infinitive in all forms:',
      nuanceCards: [
        {
          title: 'Active & Passive Bare Infinitive (consider / be considered)',
          bodyHtml: 'Active: <em>"...demanded that the jury <strong>consider</strong> the evidence."</em><br>Passive: <em>"...insisted that the verdict <strong>be recorded</strong> in ink."</em>'
        },
        {
          title: 'Negative Subjunctive: "not + bare infinitive" (No "do/does"!)',
          bodyHtml: 'Place <strong>not</strong> directly before the bare infinitive: <em>"The judge ordered that the witness <strong>not leave</strong> the courtroom."</em>'
        }
      ],
      workouts: [
        {
          label: 'Passive Mandative Subjunctive',
          promptHtml: 'Rewrite using <strong>insisted that</strong>: <em>"The defence lawyer demanded the immediate dismissal of all unsubstantiated charges."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"The defence lawyer <strong>insisted that all unsubstantiated charges be dismissed</strong> immediately."</em>'
        },
        {
          label: 'Have no intention of + Passive Gerund',
          promptHtml: 'Rewrite using <strong>intention</strong>: <em>"Alice refused to let the Queen\'s threats intimidate her."</em>',
          modelHtml: '✓ <strong>Cambridge C1/C2 Model:</strong> <em>"Alice <strong>had no intention of being intimidated</strong> by the Queen\'s threats."</em>'
        }
      ]
    },
    kwtBreakdowns: [
      { s1: 'Cross out "The Knave of Hearts" and "the royal tarts before noon". Deficit: "The prosecutor claimed that... had stolen".', s23: 'Personal passive reporting + perfect infinitive: "was/is alleged to have stolen".', s4: '1 mark for "was/is alleged" + 1 mark for "to have stolen".' },
      { s1: 'Cross out "The King of Hearts" and "their verdict immediately". Deficit: "\'The jury must consider...!\' shouted".', s23: 'Mandative subjunctive: "demanded (that) the jury consider".', s4: '1 mark for "demanded (that)" + 1 mark for "the jury consider".' },
      { s1: 'Cross out "Queen\'s insistence on passing sentence before the verdict". Deficit: "outraged Alice".', s23: 'Nominal What-cleft: "What outraged Alice was the".', s4: '1 mark for "What outraged Alice" + 1 mark for "was the".' },
      { s1: 'Cross out "Alice had" and "by a pack of playing cards any longer". Deficit: "refused to be intimidated".', s23: 'Collocation + passive gerund: "(had) no intention of being intimidated".', s4: '1 mark for "no intention of" + 1 mark for "being intimidated".' },
      { s1: 'Cross out "In" and "evidence, the King ordered the witness to stand down". Deficit: "Even though the King lacked any credible".', s23: 'Prepositional contrast + gerund/noun: "spite of lacking any credible" (or "spite of his/the lack of").', s4: '1 mark for "spite of" + 1 mark for "lacking any credible / his lack of".' }
    ]
  }
};

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


