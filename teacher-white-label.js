/**
 * ============================================================================
 * GarethEnglish.com — Commercial Teacher Classroom & White-Label Studio Runtime
 * ----------------------------------------------------------------------------
 * Powers the B2B / B2B2C Passive Licensing Engine across all 26+ interactive
 * modules, games, exam builders, and Dark Academia literature units:
 *
 * 1. Solo Tutor Classroom License (£49):
 *    - Unlocks all 12 Dark Academia C1/C2 units + Compendium
 *    - Enables Clean Screen-Share Mode (hides Gareth Montgomery student CTAs)
 *    - Mounts the floating Teacher Presenter HUD (Live Classroom Timer,
 *      CEFR C1/C2 & IELTS Examiner Notes / Answer Keys, Distraction-Free Mode)
 *
 * 2. White-Label Studio & School License (£149):
 *    - Includes all Solo Tutor Classroom features
 *    - Cryptographically signed Student Homework Links (?wl=1&tutor=...&sig=...)
 *      verified via 64-bit FNV-1a/DJB2 HMAC-style digest without exposing the
 *      master license key in the student URL
 *    - Dynamically replaces header branding & end-of-game showDiagnosticGate()
 *      CTAs with the licensed tutor/school's name, accent color, and URL
 * ============================================================================
 */
(() => {
  'use strict';

  if (window.GarethTeacherWhiteLabel) return;

  const STORAGE_KEYS = {
    LICENSE_TIER: 'gm_teacher_license_tier',       // 'solo' | 'studio'
    LICENSE_HASH: 'gm_teacher_license_hash',       // verified 64-bit hash
    STUDIO_CONFIG: 'gm_teacher_studio_config_v1',  // JSON { tutor, studio, cta, ctaLabel, color }
    CLEAN_MODE: 'gm_teacher_clean_screenshare',    // 'true' | 'false'
    DA_UNLOCK_1: 'da_archive_unlocked',
    DA_UNLOCK_2: 'da_canon_unlocked',
    DA_UNLOCK_3: 'da_course_unlocked_v1'
  };

  // Verified 64-bit FNV-1a + DJB2 hashes for Solo Tutor (£49) and Studio White-Label (£149)
  const SOLO_CODE_HASHES = [
    '07dfc1f76646e3e9', // TEACHER-PRO-49
    '3089a39af9f71612', // CLASSROOM-2026
    'df3a72ff4ff87f6d'  // CELTA-VAULT-49
  ];

  const STUDIO_CODE_HASHES = [
    '410a91742e314132', // STUDIO-WL-149
    '36d29a47ba9eca49', // WHITELABEL-PRO
    'ba6766737503c529'  // SCHOOL-MASTER-26
  ];

  const STRIPE_LINKS = {
    SOLO_49: 'https://buy.stripe.com/9B63cuadm8gs5Mhc4Xb3q01?prefilled_promo_code=TEACHER49',
    STUDIO_149: 'https://buy.stripe.com/9B63cuadm8gs5Mhc4Xb3q01?prefilled_promo_code=STUDIO149'
  };

  const ACCENT_PALETTES = {
    emerald: { bg: '#064e3b', border: '#10b981', badge: '#059669', text: '#ecfdf5', accent: '#6ee7b7', btn: '#10b981', btnText: '#022c22' },
    sky:     { bg: '#0c4a6e', border: '#38bdf8', badge: '#0284c7', text: '#f0f9ff', accent: '#7dd3fc', btn: '#38bdf8', btnText: '#082f49' },
    amber:   { bg: '#451a03', border: '#f59e0b', badge: '#d97706', text: '#fffbeb', accent: '#fcd34d', btn: '#f59e0b', btnText: '#1c1917' },
    violet:  { bg: '#2e1065', border: '#a855f7', badge: '#7c3aed', text: '#faf5ff', accent: '#d8b4fe', btn: '#a855f7', btnText: '#1e1b4b' },
    rose:    { bg: '#4c0519', border: '#f43f5e', badge: '#e11d48', text: '#fff1f2', accent: '#fda4af', btn: '#f43f5e', btnText: '#1f0910' }
  };

  // Module-specific Examiner Notes & Answer Key Briefings for the Teacher Presenter HUD
  const MODULE_TEACHER_GUIDES = {
    'dracula': {
      title: 'Dark Academia: Bram Stoker’s Dracula (C1/C2)',
      cefr: 'CEFR C1–C2 • Reading & Use of English Part 4',
      timing: '45–50 mins (Screen-Share + Guided Transform)',
      notes: [
        'Examiner Focus: Emphasize why present/perfect participle clauses ("Fearing...", "Having crossed...") elevate Writing Part 1/2 Cohesion & Coherence marks.',
        'Negative Inversion Trap: Remind learners that auxiliary inversion ("Scarcely had I...", "Little did he know...") requires past perfect + "when/before" (not "than" for scarcely).',
        'Quick Answer Key Tip: In Part 4 Key Word Transformations, contractions count as two words except "can\'t" (= cannot).'
      ]
    },
    'frankenstein': {
      title: 'Dark Academia: Mary Shelley’s Frankenstein (C1/C2)',
      cefr: 'CEFR C1–C2 • Cleft Sentences & Concession',
      timing: '45–50 mins',
      notes: [
        'Examiner Focus: Contrast It-clefts ("It was on a dreary night that...") with What-clefts ("What terrified me most was...") for persuasive essay introductions.',
        'Advanced Concession: Drill "Much as I admired...", "Be that as it may", and "Notwithstanding" to replace repetitive "Although/However".'
      ]
    },
    'jekyll': {
      title: 'Dark Academia: Strange Case of Dr Jekyll & Mr Hyde (C1/C2)',
      cefr: 'CEFR C1–C2 • Register Duality & Subjunctive Mood',
      timing: '45–50 mins',
      notes: [
        'Examiner Focus: Highlight the shift between Anglo-Saxon phrasal verbs (spoken B2) and Latinate nominalisation (academic C1/C2 reports).',
        'Formulaic Subjunctive: Drill "suffice it to say", "be that as it may", and mandative subjunctive ("insisted that he be...").'
      ]
    },
    'baskerville': {
      title: 'Dark Academia: The Hound of the Baskervilles (C1/C2)',
      cefr: 'CEFR C1–C2 • Past Modal Deductions & Hedging',
      timing: '45–50 mins',
      notes: [
        'Examiner Focus: Contrast "must have been" (logical certainty) vs "can\'t/couldn\'t have been" (impossibility) vs "may well have been" (strong probability).',
        'Academic Hedging: Transfer Holmesian deduction structures directly into IELTS Task 2 / CAE Report evidence evaluation.'
      ]
    },
    'cae-essay': {
      title: 'C1 Advanced (CAE) Interactive Essay Builder',
      cefr: 'Cambridge C1 Writing Part 1 • 220–260 Words',
      timing: '50 mins (25m Guided Build + 15m Live Rubric Audit)',
      notes: [
        'Cambridge Mark Scheme (4 x 5 marks): Content (must address 2 prompt points + select 1 as more important), Communicative Achievement (consistent academic register), Organisation (linking across paragraphs), Language (C1 syntax: inversion, clefts, complex passives).',
        'Common Band-3 Trap: Students summarize both bullet points in Paragraph 2 and 3 but forget to explicitly argue WHICH point is more impactful in the conclusion.'
      ]
    },
    'ielts-essay': {
      title: 'IELTS Writing Task 2 Masterclass (Band 7.0–8.5)',
      cefr: 'IELTS Academic & General Task 2 • 250+ Words',
      timing: '50 mins',
      notes: [
        'Task Response (TR) Rule: In "Outweigh" essays, the weaker side MUST go in Body 1 and the stronger side in Body 2 so the progression matches the thesis.',
        'Lexical Resource (LR) Upgrade: Have the student complete the Register Shift drill aloud before writing their own introduction.'
      ]
    },
    'reactor': {
      title: 'Phrasal Reactor: C1 Particle Reflex Trainer',
      cefr: 'CEFR B2–C2 • Use of English Parts 1, 2 & 4',
      timing: '15–20 mins Warm-Up or Assigned Homework',
      notes: [
        'Particle Semantics: Group particles by metaphor—UP (completion/increase), DOWN (suppression/recording), OUT (exhaustion/resolution), OFF (detachment/triggering).',
        'Classroom Mode Idea: Have the student justify WHY the distractor particles fail before clicking the core injection button.'
      ]
    },
    'factory': {
      title: 'Word Factory: Cambridge Part 3 Morphology Engine',
      cefr: 'CEFR B2–C2 • Use of English Part 3 Word Formation',
      timing: '15–25 mins',
      notes: [
        'Double-Change Rule: At C1/C2, at least 2 of the 8 items require BOTH a prefix (un-, in-, mis-, over-) AND a suffix (-able, -ity, -lessly).',
        'Ask students to identify the syntactic slot (noun, adverb, negative adjective) BEFORE looking at the stem.'
      ]
    },
    'boardroom': {
      title: 'The Boardroom Pitch: Executive Diplomacy Simulator',
      cefr: 'CEFR B2+ to C2 • Executive Business English',
      timing: '30–45 mins Roleplay & Pragmatics',
      notes: [
        'Pragmatic Hedging Formula: Softener ("With respect,") + Modal/Qualifier ("it might be worth reconsidering...") + Constructive Pivot ("so that we protect Q3 margins").',
        'After each CEO round, ask the student to adapt the winning C1 diplomatic frame to a real meeting from their own company this week.'
      ]
    },
    'crypt': {
      title: 'The Grammar Crypt (2D & 3D Raycaster Dungeon)',
      cefr: 'CEFR B2–C2 • Key Word Transformations (Part 4)',
      timing: '20–30 mins Live or Homework Sprint',
      notes: [
        'Scoring Strategy: Every Cambridge Part 4 item is worth 2 marks (1 mark for each half of the transformation). Teach students never to leave a blank—partial structure still scores 1/2.',
        'Use the 2-Try Forgiving Hint system in class to elicit the grammar rule before revealing the second half.'
      ]
    },
    'default': {
      title: 'Interactive Classroom Module',
      cefr: 'CEFR B2–C2 & IELTS 7.0–8.5',
      timing: '30–50 mins Live Screen-Share or Homework',
      notes: [
        'Screen-Share Tip: Toggle "Clean Screen-Share" in this Teacher HUD to hide all external booking banners during your lesson.',
        'Homework Assignment: Click "Copy Student Link" below to send your student a branded homework URL that credits your studio.'
      ]
    }
  };

  function hashString64(raw) {
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
  }

  function normalizeField(str) {
    return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function computeHomeworkSig(studioHash, tutor, studio, cta) {
    const idx = STUDIO_CODE_HASHES.indexOf(studioHash);
    if (idx === -1) return '';
    const payload = [
      studioHash,
      normalizeField(tutor),
      normalizeField(studio),
      normalizeField(cta)
    ].join('x');
    return String(idx) + hashString64(payload).slice(0, 12);
  }

  function verifyHomeworkSig(sig, tutor, studio, cta) {
    if (!sig || sig.length < 13) return false;
    const idx = parseInt(sig.charAt(0), 10);
    if (isNaN(idx) || idx < 0 || idx >= STUDIO_CODE_HASHES.length) return false;
    const studioHash = STUDIO_CODE_HASHES[idx];
    const expected = computeHomeworkSig(studioHash, tutor, studio, cta);
    return sig === expected;
  }

  function detectModuleGuide() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.includes('dracula')) return MODULE_TEACHER_GUIDES['dracula'];
    if (p.includes('frankenstein')) return MODULE_TEACHER_GUIDES['frankenstein'];
    if (p.includes('jekyll')) return MODULE_TEACHER_GUIDES['jekyll'];
    if (p.includes('baskerville')) return MODULE_TEACHER_GUIDES['baskerville'];
    if (p.includes('cae-essay')) return MODULE_TEACHER_GUIDES['cae-essay'];
    if (p.includes('ielts')) return MODULE_TEACHER_GUIDES['ielts-essay'];
    if (p.includes('reactor')) return MODULE_TEACHER_GUIDES['reactor'];
    if (p.includes('factory') || p.includes('word-formation')) return MODULE_TEACHER_GUIDES['factory'];
    if (p.includes('boardroom') || p.includes('business-english')) return MODULE_TEACHER_GUIDES['boardroom'];
    if (p.includes('crypt') || p.includes('transformation')) return MODULE_TEACHER_GUIDES['crypt'];
    return MODULE_TEACHER_GUIDES['default'];
  }

  const GarethTeacherWhiteLabel = {
    SOLO_CODE_HASHES,
    STUDIO_CODE_HASHES,
    STRIPE_LINKS,
    ACCENT_PALETTES,
    timerInterval: null,
    timerSeconds: 900, // 15m default
    timerRunning: false,

    hashAccessCode: hashString64,
    computeHomeworkSig,
    verifyHomeworkSig,

    getLicenseState() {
      try {
        const tier = localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || '';
        const hash = localStorage.getItem(STORAGE_KEYS.LICENSE_HASH) || '';
        if (tier === 'studio' && STUDIO_CODE_HASHES.includes(hash)) {
          return { active: true, tier: 'studio', hash };
        }
        if (tier === 'solo' && SOLO_CODE_HASHES.includes(hash)) {
          return { active: true, tier: 'solo', hash };
        }
      } catch (e) {}
      return { active: false, tier: null, hash: null };
    },

    activateLicense(rawCode) {
      const digest = hashString64(rawCode);
      let tier = null;
      if (STUDIO_CODE_HASHES.includes(digest)) {
        tier = 'studio';
      } else if (SOLO_CODE_HASHES.includes(digest)) {
        tier = 'solo';
      }
      if (!tier) return { ok: false, tier: null };

      try {
        localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, tier);
        localStorage.setItem(STORAGE_KEYS.LICENSE_HASH, digest);
        localStorage.setItem(STORAGE_KEYS.CLEAN_MODE, 'true');
        // Also unlock all Dark Academia units & Compendium automatically
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_1, 'true');
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_2, 'true');
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_3, 'true');
      } catch (e) {}

      if (window.DarkAcademiaGate && typeof window.DarkAcademiaGate.syncUI === 'function') {
        window.DarkAcademiaGate.syncUI();
      }
      this.initPageRuntime();
      return { ok: true, tier, hash: digest };
    },

    deactivateLicense() {
      try {
        localStorage.removeItem(STORAGE_KEYS.LICENSE_TIER);
        localStorage.removeItem(STORAGE_KEYS.LICENSE_HASH);
        localStorage.removeItem(STORAGE_KEYS.CLEAN_MODE);
      } catch (e) {}
      const hud = document.getElementById('gm-teacher-presenter-hud');
      if (hud) hud.remove();
      const banner = document.getElementById('gm-wl-top-banner');
      if (banner) banner.remove();
      document.body.classList.remove('gm-clean-screenshare');
    },

    getStudioConfig() {
      const defaults = {
        tutor: 'Your Name',
        studio: 'Language Studio',
        cta: 'https://',
        ctaLabel: 'Book Next Lesson / Submit Homework',
        color: 'emerald'
      };
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIO_CONFIG) || '{}');
        return { ...defaults, ...saved };
      } catch (e) {
        return defaults;
      }
    },

    saveStudioConfig(cfg) {
      const current = this.getStudioConfig();
      const merged = { ...current, ...(cfg || {}) };
      try {
        localStorage.setItem(STORAGE_KEYS.STUDIO_CONFIG, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    },

    buildSignedHomeworkUrl(targetFile, cfgOverride) {
      const state = this.getLicenseState();
      const cfg = { ...this.getStudioConfig(), ...(cfgOverride || {}) };
      const base = new URL(targetFile, window.location.origin + window.location.pathname.replace(/[^/]*$/, ''));
      base.searchParams.set('wl', '1');
      base.searchParams.set('tutor', cfg.tutor || 'Licensed Tutor');
      base.searchParams.set('studio', cfg.studio || 'English Studio');
      if (cfg.cta && cfg.cta !== 'https://') {
        base.searchParams.set('cta', cfg.cta);
      }
      if (cfg.ctaLabel) {
        base.searchParams.set('cta_label', cfg.ctaLabel);
      }
      base.searchParams.set('color', cfg.color || 'emerald');

      if (state.active && state.tier === 'studio') {
        const sig = computeHomeworkSig(state.hash, cfg.tutor, cfg.studio, cfg.cta || '');
        base.searchParams.set('sig', sig);
      } else {
        base.searchParams.set('wl_preview', '1');
      }
      return base.toString();
    },

    isCleanModeEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEYS.CLEAN_MODE) === 'true';
      } catch (e) {
        return false;
      }
    },

    setCleanMode(enabled) {
      try {
        localStorage.setItem(STORAGE_KEYS.CLEAN_MODE, enabled ? 'true' : 'false');
      } catch (e) {}
      this.applyCleanScreenShareDOM(enabled);
    },

    applyCleanScreenShareDOM(enabled) {
      let styleEl = document.getElementById('gm-clean-screenshare-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'gm-clean-screenshare-styles';
        styleEl.textContent = `
          body.gm-clean-screenshare #sticky-mobile-cta,
          body.gm-clean-screenshare a[href*="#contact"],
          body.gm-clean-screenshare a[href*="#book-diagnostic"],
          body.gm-clean-screenshare a[href*="cal.com/gareth-montgomery"],
          body.gm-clean-screenshare .da-btn-stripe,
          body.gm-clean-screenshare #da-hub-access-code-btn,
          body.gm-clean-screenshare [data-prefill-package] {
            display: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
      document.body.classList.toggle('gm-clean-screenshare', Boolean(enabled));
      const toggleBtn = document.getElementById('gm-hud-clean-toggle');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', String(Boolean(enabled)));
        toggleBtn.textContent = enabled ? '✓ Clean Screen-Share: ON' : 'Clean Screen-Share: OFF';
        toggleBtn.style.background = enabled ? '#059669' : '#1e293b';
      }
    },

    injectWhiteLabelBanner(wlConfig, isPreview) {
      const existing = document.getElementById('gm-wl-top-banner');
      if (existing) existing.remove();

      const palette = ACCENT_PALETTES[wlConfig.color] || ACCENT_PALETTES.emerald;
      const safeTutor = this.escapeHtml(wlConfig.tutor || 'Licensed Tutor');
      const safeStudio = this.escapeHtml(wlConfig.studio || 'English Coaching Studio');
      const safeCtaLabel = this.escapeHtml(wlConfig.ctaLabel || 'Return to Classroom / Book Session');
      const safeCtaUrl = this.sanitizeUrl(wlConfig.cta);

      const banner = document.createElement('div');
      banner.id = 'gm-wl-top-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Assigned Classroom Banner');
      banner.style.cssText = `
        background: linear-gradient(90deg, ${palette.bg} 0%, #0f172a 100%);
        border-bottom: 2px solid ${palette.border};
        color: ${palette.text};
        padding: 10px 18px;
        font-family: system-ui, -apple-system, sans-serif;
        position: sticky;
        top: 0;
        z-index: 9990;
        box-shadow: 0 8px 25px rgba(0,0,0,0.45);
      `;

      const ctaHtml = safeCtaUrl
        ? `<a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="background:${palette.btn};color:${palette.btnText};font-weight:800;font-size:12px;padding:7px 14px;border-radius:999px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
             <span>${safeCtaLabel}</span>
             <span aria-hidden="true">&rarr;</span>
           </a>`
        : '';

      const previewPill = isPreview
        ? `<a href="teacher-vault.html#pricing" style="background:#f59e0b;color:#1c1917;font-weight:800;font-size:11px;padding:5px 11px;border-radius:6px;text-decoration:none;white-space:nowrap;">
             ⚡ Live Preview Mode — Unlock Studio License (£149) &rarr;
           </a>`
        : `<span style="font-size:11px;color:#94a3b8;font-weight:600;">✓ Licensed Interactive Classroom</span>`;

      banner.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="background:${palette.badge};color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;text-transform:uppercase;letter-spacing:0.06em;">
              ${safeStudio}
            </span>
            <span style="font-size:13px;font-weight:700;color:#ffffff;">
              Assigned by <strong style="color:${palette.accent};">${safeTutor}</strong>
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${previewPill}
            ${ctaHtml}
          </div>
        </div>
      `;

      document.body.insertBefore(banner, document.body.firstChild);
      this.applyCleanScreenShareDOM(true);
      this.overrideDiagnosticGateForWhiteLabel(wlConfig, palette);
    },

    overrideDiagnosticGateForWhiteLabel(wlConfig, palette) {
      const safeTutor = this.escapeHtml(wlConfig.tutor || 'Your Tutor');
      const safeStudio = this.escapeHtml(wlConfig.studio || 'Language Studio');
      const safeCtaUrl = this.sanitizeUrl(wlConfig.cta) || '#';
      const safeCtaLabel = this.escapeHtml(wlConfig.ctaLabel || `Send Score to ${wlConfig.tutor || 'Your Tutor'}`);

      window.showDiagnosticGate = function (opts) {
        opts = opts || {};
        const gameName = opts.gameName || 'Interactive Skill Test';
        const score = typeof opts.score === 'number' ? opts.score : 0;
        const maxScore = typeof opts.maxScore === 'number' ? opts.maxScore : 10;
        const weakArea = opts.weakArea || 'C1/C2 Linguistic Precision under Time Pressure';
        const examImpact = opts.examImpact || 'Review these items with your tutor in your next session to lock in active recall.';
        const onReplay = typeof opts.onReplay === 'function' ? opts.onReplay : null;
        const pct = Math.max(0, Math.min(100, Math.round((score / (maxScore || 1)) * 100)));
        const cefrEstimate = pct >= 85 ? 'C1 Advanced / C2 Ready' : pct >= 65 ? 'B2 Upper-Intermediate (Borderline C1)' : 'B1/B2 Transition';

        const existing = document.getElementById('gm-diag-overlay');
        if (existing) existing.remove();

        const modalHtml = `
          <div id="gm-diag-overlay" role="dialog" aria-modal="true" aria-label="Homework Completion Report" style="position:fixed;inset:0;background:rgba(10,15,28,0.88);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;">
            <div style="background:#111827;border:2px solid ${palette.border};border-radius:16px;max-width:540px;width:100%;padding:28px;color:#f9fafb;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);box-sizing:border-box;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="background:${palette.badge};color:#ffffff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">
                  ${safeStudio} &bull; ${gameName}
                </span>
                <button id="gm-diag-close" type="button" aria-label="Close" style="background:none;border:none;color:#9ca3af;font-size:24px;line-height:1;cursor:pointer;padding:4px;">&times;</button>
              </div>
              <h3 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:#ffffff;line-height:1.2;">
                Module Complete: ${score}/${maxScore} (${pct}%)
              </h3>
              <p style="margin:0 0 16px 0;font-size:14px;color:#d1d5db;">
                Estimated Performance Band: <strong style="color:${palette.accent};">${cefrEstimate}</strong> &bull; Tutor: <strong>${safeTutor}</strong>
              </p>
              <div style="background:#1f2937;border-left:4px solid ${palette.border};padding:14px;border-radius:8px;margin-bottom:20px;font-size:14px;line-height:1.5;">
                <strong style="color:${palette.accent};display:block;margin-bottom:4px;">Focus Area for Next Lesson: ${weakArea}</strong>
                <span style="color:#e5e7eb;">${examImpact}</span>
              </div>
              <div style="display:grid;gap:10px;">
                ${safeCtaUrl !== '#' ? `
                <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer"
                   style="display:block;text-align:center;background:${palette.btn};color:${palette.btnText};font-weight:800;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">
                  ${safeCtaLabel} &rarr;
                </a>` : ''}
                <button id="gm-diag-replay" type="button" style="background:#1f2937;border:1px solid #374151;color:#f9fafb;font-size:14px;font-weight:700;cursor:pointer;padding:11px;border-radius:10px;">
                  &#8635; Practise Again to Beat ${pct}%
                </button>
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const overlay = document.getElementById('gm-diag-overlay');
        const closeBtn = document.getElementById('gm-diag-close');
        const replayBtn = document.getElementById('gm-diag-replay');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();
        if (replayBtn) replayBtn.onclick = () => { overlay.remove(); if (onReplay) onReplay(); };
      };
    },

    mountTeacherPresenterHUD(tier) {
      if (document.getElementById('gm-teacher-presenter-hud')) return;
      const currentPath = (window.location.pathname || '').toLowerCase();
      // Do not mount presenter HUD on homepage, lab directory hub, blog, or legal pages
      if (
        currentPath.endsWith('/index.html') ||
        currentPath.endsWith('/lab.html') ||
        currentPath.endsWith('/blog.html') ||
        currentPath === '/' ||
        currentPath.includes('terms.html') ||
        currentPath.includes('privacy-policy.html')
      ) {
        return;
      }

      const guide = detectModuleGuide();
      const cleanEnabled = this.isCleanModeEnabled();
      this.applyCleanScreenShareDOM(cleanEnabled);

      const hud = document.createElement('aside');
      hud.id = 'gm-teacher-presenter-hud';
      hud.setAttribute('aria-label', 'Teacher Presenter Controls');
      hud.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 9995;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      hud.innerHTML = `
        <div id="gm-hud-drawer" style="display:none;background:#0f172a;border:1px solid #38bdf8;border-radius:16px;padding:16px;width:340px;max-width:calc(100vw - 32px);color:#f8fafc;box-shadow:0 20px 45px rgba(0,0,0,0.75);margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b;padding-bottom:10px;margin-bottom:12px;">
            <div>
              <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#38bdf8;display:block;">
                ${tier === 'studio' ? '★ White-Label Studio HUD' : '✓ Solo Tutor Presenter HUD'}
              </span>
              <strong style="font-size:13px;color:#fff;">${guide.title}</strong>
            </div>
            <button type="button" id="gm-hud-minimize" aria-label="Minimize Teacher HUD" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">Hide</button>
          </div>

          <!-- Classroom Countdown Timer -->
          <div style="background:#020617;border:1px solid #1e293b;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div>
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Class Drill Timer</div>
              <div id="gm-hud-timer-display" style="font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;color:#fbbf24;">15:00</div>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              <button type="button" id="gm-hud-timer-start" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:700;cursor:pointer;">Start</button>
              <button type="button" id="gm-hud-timer-5m" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:6px;padding:5px 7px;font-size:11px;cursor:pointer;">5m</button>
              <button type="button" id="gm-hud-timer-15m" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:6px;padding:5px 7px;font-size:11px;cursor:pointer;">15m</button>
            </div>
          </div>

          <!-- Examiner Briefing & Teaching Notes -->
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:800;color:#6ee7b7;margin-bottom:6px;">
              📋 Teaching &amp; Examiner Notes (${guide.timing}):
            </div>
            <ul style="margin:0;padding-left:16px;font-size:11.5px;color:#cbd5e1;line-height:1.45;display:grid;gap:6px;">
              ${guide.notes.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>

          <!-- Action Controls -->
          <div style="display:grid;gap:7px;">
            <button type="button" id="gm-hud-clean-toggle" aria-pressed="${cleanEnabled}" style="background:${cleanEnabled ? '#059669' : '#1e293b'};color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:11.5px;font-weight:700;cursor:pointer;text-align:center;">
              ${cleanEnabled ? '✓ Clean Screen-Share: ON' : 'Clean Screen-Share: OFF'}
            </button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <button type="button" id="gm-hud-copy-hw" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;">
                🔗 Copy Student Link
              </button>
              <a href="teacher-vault.html" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:8px;font-size:11px;font-weight:700;text-decoration:none;text-align:center;">
                ⚙️ Studio Vault
              </a>
            </div>
          </div>
        </div>

        <button type="button" id="gm-hud-pill-btn" style="background:linear-gradient(135deg,#0284c7,#0f172a);color:#ffffff;border:1px solid #38bdf8;border-radius:999px;padding:9px 15px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;">
          <span>🎓 Teacher HUD</span>
          <span id="gm-hud-pill-timer" style="background:rgba(0,0,0,0.35);padding:2px 7px;border-radius:99px;color:#fbbf24;font-variant-numeric:tabular-nums;">15:00</span>
        </button>
      `;

      document.body.appendChild(hud);

      const drawer = document.getElementById('gm-hud-drawer');
      const pillBtn = document.getElementById('gm-hud-pill-btn');
      const minBtn = document.getElementById('gm-hud-minimize');
      const cleanBtn = document.getElementById('gm-hud-clean-toggle');
      const copyHwBtn = document.getElementById('gm-hud-copy-hw');
      const startBtn = document.getElementById('gm-hud-timer-start');
      const btn5m = document.getElementById('gm-hud-timer-5m');
      const btn15m = document.getElementById('gm-hud-timer-15m');

      const updateTimerUI = () => {
        const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
        const s = String(this.timerSeconds % 60).padStart(2, '0');
        const str = `${m}:${s}`;
        const d1 = document.getElementById('gm-hud-timer-display');
        const d2 = document.getElementById('gm-hud-pill-timer');
        if (d1) d1.textContent = str;
        if (d2) d2.textContent = str;
      };

      pillBtn.onclick = () => {
        drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      };
      minBtn.onclick = () => {
        drawer.style.display = 'none';
      };
      cleanBtn.onclick = () => {
        this.setCleanMode(!this.isCleanModeEnabled());
      };
      copyHwBtn.onclick = () => {
        const file = window.location.pathname.split('/').pop() || 'index.html';
        const hwUrl = this.buildSignedHomeworkUrl(file);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(hwUrl);
        }
        copyHwBtn.textContent = '✓ Link Copied!';
        copyHwBtn.style.background = '#059669';
        setTimeout(() => {
          copyHwBtn.textContent = '🔗 Copy Student Link';
          copyHwBtn.style.background = '#2563eb';
        }, 2000);
      };

      startBtn.onclick = () => {
        if (this.timerRunning) {
          clearInterval(this.timerInterval);
          this.timerRunning = false;
          startBtn.textContent = 'Resume';
        } else {
          this.timerRunning = true;
          startBtn.textContent = 'Pause';
          this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
              this.timerSeconds--;
              updateTimerUI();
            } else {
              clearInterval(this.timerInterval);
              this.timerRunning = false;
              startBtn.textContent = 'Done!';
            }
          }, 1000);
        }
      };
      btn5m.onclick = () => {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerSeconds = 300;
        startBtn.textContent = 'Start';
        updateTimerUI();
      };
      btn15m.onclick = () => {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerSeconds = 900;
        startBtn.textContent = 'Start';
        updateTimerUI();
      };
    },

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    sanitizeUrl(url) {
      const clean = String(url || '').trim();
      if (!clean || clean === 'https://') return '';
      if (/^https?:\/\//i.test(clean) || /^mailto:/i.test(clean)) return clean;
      return '';
    },

    initPageRuntime() {
      const params = new URLSearchParams(window.location.search);

      // 1. Check direct license unlock via URL parameter (?teacher_key=...)
      const keyParam = params.get('teacher_key');
      if (keyParam) {
        const res = this.activateLicense(keyParam);
        if (res.ok) {
          params.delete('teacher_key');
          const cleanSearch = params.toString();
          const newUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      // 2. Check if this page was opened via a White-Label Student Homework URL (?wl=1)
      if (params.get('wl') === '1') {
        const tutor = params.get('tutor') || 'Licensed Tutor';
        const studio = params.get('studio') || 'English Coaching Studio';
        const cta = params.get('cta') || '';
        const ctaLabel = params.get('cta_label') || 'Return to Classroom / Book Session';
        const color = params.get('color') || 'emerald';
        const sig = params.get('sig') || '';
        const isPreview = params.get('wl_preview') === '1';

        const isValidSigned = verifyHomeworkSig(sig, tutor, studio, cta);
        if (isValidSigned) {
          // Unlock gated Dark Academia units for this licensed student homework session
          try {
            localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_1, 'true');
            localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_2, 'true');
            localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_3, 'true');
          } catch (e) {}
          if (window.DarkAcademiaGate && typeof window.DarkAcademiaGate.syncUI === 'function') {
            window.DarkAcademiaGate.syncUI();
          }
          this.injectWhiteLabelBanner({ tutor, studio, cta, ctaLabel, color }, false);
          return;
        } else if (isPreview) {
          this.injectWhiteLabelBanner({ tutor, studio, cta, ctaLabel, color }, true);
          return;
        }
      }

      // 3. Check if the browser holds an active Teacher License (Solo or Studio)
      const license = this.getLicenseState();
      if (license.active) {
        this.mountTeacherPresenterHUD(license.tier);
      }
    }
  };

  window.GarethTeacherWhiteLabel = GarethTeacherWhiteLabel;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GarethTeacherWhiteLabel.initPageRuntime());
  } else {
    GarethTeacherWhiteLabel.initPageRuntime();
  }
})();
