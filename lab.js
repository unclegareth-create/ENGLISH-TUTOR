/* ==========================================================================
   Gareth English Interactive Lab: 4-Door Track Controller (lab.js)
   ========================================================================== */
const LabStudio = (() => {
  'use strict';

  const SFX_STORAGE_KEY = 'gm_lab_sfx';
  const VALID_TRACKS = ['overview', 'ielts', 'cae', 'c2', 'games'];

  const VALID_CODE_HASHES = [
    'df3a72ff4ff87f6d',
    '410a91742e314132',
    '36d29a47ba9eca49',
    'ba6766737503c529'
  ];

  const LEGACY_HASH_ROUTES = {
    '#exam-lab': { track: 'cae', scrollTarget: '#lab-panels' },
    '#arcade': { track: 'games', scrollTarget: '#lab-panels' },
    '#chronicle-88': { track: 'games', scrollTarget: '#lab-panels' },
    '#interactive-tools': { track: 'games', scrollTarget: '#lab-panels' },
    '#bespoke-samples': { track: 'games', scrollTarget: '#bespoke-samples' },
    '#professor-west': { track: 'games', scrollTarget: '#professor-west' },
    '#courses': { track: 'c2', scrollTarget: '#gothic-course' },
    '#gothic-course': { track: 'c2', scrollTarget: '#gothic-course' },
    '#study-guides': { track: 'overview', scrollTarget: '#study-guides-bridge' },
    '#classroom-research': { track: 'overview', scrollTarget: '#study-guides-bridge' },
    '#resources': { track: 'overview', scrollTarget: '#study-guides-bridge' },
    '#belfast-desk-dropbox': { openDesk: true, scrollTarget: '#belfast-desk-dropbox' }
  };

  const SAMPLE_QUIZZES = [
    {
      track: 'ielts',
      trackLabel: 'Open IELTS 7.0 to 8.5 track',
      tag: 'IELTS Syntax: Passive Reporting',
      toolTitle: 'IELTS & C1 Syntax Workbench',
      toolSummary: 'Replace memorised thesaurus padding with the five C1 sentence structures examiners actually credit at Band 7.5+.',
      toolUrl: 'ielts-c1-syntax-workbench.html',
      prompt: 'Rewrite without "People": "People widely believe that urban green spaces reduce stress." -> "Urban green spaces _______ reduce stress."',
      options: [
        {
          text: 'A) are widely believed to',
          correct: true,
          explain: 'Spot on. Subject + passive reporting verb ("are widely believed") + to-infinitive is a crisp Band 8.0+ / C1 academic shift.'
        },
        {
          text: 'B) widely believe to',
          correct: false,
          explain: 'Careful: "spaces" are the subject of the belief, not the thinker, so you need the passive form "are widely believed to".'
        }
      ]
    },
    {
      track: 'cae',
      trackLabel: 'Open Cambridge C1 (CAE) track',
      tag: 'CAE Part 4: Key Word Transformation (WORD: CHANCE)',
      toolTitle: 'C1 Part 4 Deconstructor (40 Items)',
      toolSummary: 'Practise my 4-Step Strike Out the Echoes method with strict 3 to 6 word guardrails and instant error hints.',
      toolUrl: 'c1-part4-deconstructor.html',
      prompt: '"I happened to meet my old lecturer on the train." -> "I met my old lecturer _______ on the train." (Use CHANCE, unchanged)',
      options: [
        {
          text: 'A) purely by chance',
          correct: true,
          explain: 'Spot on (2/2 marks). "Purely by chance" keeps CHANCE unchanged, fits 3 to 6 words, and captures "happened to".'
        },
        {
          text: 'B) by a pure chance',
          correct: false,
          explain: 'Watch the article: the fixed Cambridge phrase is "by chance" (no "a"), so "purely by chance" or "entirely by chance" scores full marks.'
        }
      ]
    },
    {
      track: 'c2',
      trackLabel: 'Open Cambridge C2 (CPE) track',
      tag: 'CPE Subtext: British Understatement',
      toolTitle: 'Between the Lines: C1/C2 Subtext',
      toolSummary: 'Decode polite hedging, diplomatic pushback, and quiet irony across high-level C2 reading, listening, and workplace exchanges.',
      toolUrl: 'between-the-lines.html',
      prompt: 'In a project review, a senior colleague says: "That is certainly an ambitious timeline." What are they actually signalling?',
      options: [
        {
          text: 'A) The deadline looks unrealistic and needs revision.',
          correct: true,
          explain: 'Spot on. In British professional English, "certainly ambitious" paired with steady tone is polite code for "this schedule will slip".'
        },
        {
          text: 'B) They are thrilled by the speed of the plan.',
          correct: false,
          explain: 'Watch the hedge: "certainly" softens a sceptical judgement rather than praising the deadline.'
        }
      ]
    },
    {
      track: 'games',
      trackLabel: 'Open Games & Bespoke Studio',
      tag: 'Chronicle \'88: Narrative Tenses',
      toolTitle: 'Chronicle \'88 (5 Playable Tapes)',
      toolSummary: 'Interrogate suspects, catch broken alibis, and roll the dice under pressure across five retro detective episodes (B1 to C2).',
      toolUrl: 'chronicle-88.html',
      prompt: 'Which suspect was ALREADY out of the vault when the 23:15 alarm went off?',
      options: [
        {
          text: 'A) "When the alarm went off, I left the vault."',
          correct: false,
          explain: 'Past Simple ("I left") puts their exit AFTER the alarm sounded. Caught red-handed.'
        },
        {
          text: 'B) "When the alarm went off, I had already left the vault."',
          correct: true,
          explain: 'Alibi confirmed. Past Perfect ("had already left") places the exit cleanly before the 23:15 alarm.'
        }
      ]
    }
  ];

  // Default SFX to OFF unless explicitly enabled by the visitor
  let sfxOn = false;
  try {
    sfxOn = localStorage.getItem(SFX_STORAGE_KEY) === 'on';
  } catch (_) {}

  let audioCtx = null;
  let activeTrack = 'overview';
  let activeQuizIdx = 0;

  /* ---------- Click-Only Web Audio Feedback ---------- */
  function ensureAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playTone(freq = 640, dur = 0.05, type = 'sine', vol = 0.03) {
    if (!sfxOn) return;
    try {
      ensureAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (_) {}
  }

  function syncSFXButtons() {
    document.querySelectorAll('[data-sfx-toggle]').forEach((btn) => {
      btn.classList.toggle('sfx-on', sfxOn);
      btn.setAttribute('aria-pressed', String(sfxOn));
      const lbl = btn.querySelector('[data-sfx-label]');
      const icon = btn.querySelector('[data-sfx-icon]');
      if (lbl) lbl.textContent = sfxOn ? 'SFX: ON' : 'SFX: OFF';
      if (icon) icon.className = sfxOn ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    });
  }

  function toggleSFX() {
    sfxOn = !sfxOn;
    try {
      localStorage.setItem(SFX_STORAGE_KEY, sfxOn ? 'on' : 'off');
    } catch (_) {}
    syncSFXButtons();
    if (sfxOn) playTone(880, 0.06, 'triangle', 0.035);
  }

  /* ---------- Track Switcher & URL State Sync ---------- */
  function normalizeTrack(raw) {
    const clean = String(raw || '').trim().toLowerCase();
    return VALID_TRACKS.includes(clean) ? clean : 'overview';
  }

  function buildTrackUrl(track) {
    const url = new URL(window.location.href);
    url.searchParams.delete('wing');
    if (track === 'overview') {
      url.searchParams.delete('track');
    } else {
      url.searchParams.set('track', track);
    }
    url.hash = '';
    return url.pathname + (url.search ? url.search : '');
  }

  function selectTrack(track, options = {}) {
    const {
      updateHistory = true,
      replaceHistory = false,
      scrollToPanels = false,
      focusTab = false,
      silent = false
    } = options;

    const targetTrack = normalizeTrack(track);
    activeTrack = targetTrack;

    if (!silent) {
      playTone(targetTrack === 'overview' ? 520 : 640, 0.05, 'triangle', 0.03);
    }

    // 1. Update single-row Track Tablist (ARIA + roving tabindex + scrollIntoView)
    const tablist = document.getElementById('lab-track-tablist');
    if (tablist) {
      tablist.querySelectorAll('[role="tab"]').forEach((tab) => {
        const isSelected = tab.dataset.track === targetTrack;
        tab.setAttribute('aria-selected', String(isSelected));
        tab.setAttribute('tabindex', isSelected ? '0' : '-1');
        if (isSelected) {
          try {
            tab.scrollIntoView({ block: 'nearest', inline: 'nearest', container: 'nearest' });
          } catch (_) {
            tab.scrollIntoView({ block: 'nearest', inline: 'nearest' });
          }
          if (focusTab) tab.focus();
        }
      });
    }

    // 2. Sync the 4 Entry Door cards
    document.querySelectorAll('.lab-door[data-door]').forEach((door) => {
      const isSelected = door.dataset.door === targetTrack;
      door.classList.toggle('is-active', isSelected);
      door.setAttribute('aria-pressed', String(isSelected));
    });

    // 3. Toggle panels using hidden="until-found" for inactive panels
    document.querySelectorAll('#lab-panels > .track-panel').forEach((panel) => {
      if (panel.dataset.panel === targetTrack) {
        panel.removeAttribute('hidden');
      } else {
        panel.hidden = 'until-found';
      }
    });

    // 4. Sync URL query param (?track=)
    if (updateHistory && window.history && typeof window.history.pushState === 'function') {
      const nextUrl = buildTrackUrl(targetTrack);
      const currentUrl = window.location.pathname + window.location.search;
      if (nextUrl !== currentUrl) {
        if (replaceHistory) {
          window.history.replaceState({ track: targetTrack }, '', nextUrl);
        } else {
          window.history.pushState({ track: targetTrack }, '', nextUrl);
        }
      }
    }

    if (scrollToPanels) {
      const anchor = document.getElementById('lab-track-nav');
      if (anchor) {
        anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /* ---------- Keyboard Roving Focus (Selection by Activation) ---------- */
  function initTrackTablist() {
    const tablist = document.getElementById('lab-track-tablist');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    tablist.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab || !tab.dataset.track) return;
      selectTrack(tab.dataset.track, { updateHistory: true, scrollToPanels: false });
    });

    tablist.addEventListener('keydown', (e) => {
      const current = e.target.closest('[role="tab"]');
      if (!current) return;
      const idx = tabs.indexOf(current);
      if (idx === -1) return;

      let nextIdx = null;
      if (e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = tabs.length - 1;
      }

      if (nextIdx !== null) {
        e.preventDefault();
        tabs.forEach((t, i) => t.setAttribute('tabindex', i === nextIdx ? '0' : '-1'));
        tabs[nextIdx].focus();
      }
    });

    // Return roving tabindex to the selected tab when focus leaves the tablist
    tablist.addEventListener('focusout', (e) => {
      if (!tablist.contains(e.relatedTarget)) {
        tabs.forEach((t) => {
          const isSelected = t.getAttribute('aria-selected') === 'true';
          t.setAttribute('tabindex', isSelected ? '0' : '-1');
        });
      }
    });

    // IntersectionObserver fallback for edge scroll fades when scroll-driven animations are unsupported
    if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && !CSS.supports('animation-timeline', 'scroll()') && 'IntersectionObserver' in window) {
      const first = tablist.firstElementChild;
      const last = tablist.lastElementChild;
      if (first && last) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach(({ target, intersectionRatio }) => {
              tablist.classList.toggle(target === first ? 'more-start' : 'more-end', intersectionRatio < 1);
            });
          },
          { root: tablist, threshold: 1, rootMargin: '1px' }
        );
        observer.observe(first);
        observer.observe(last);
      }
    }
  }

  /* ---------- Find-in-Page beforematch Sync (search-hidden-content) ---------- */
  function initBeforeMatchSync() {
    const panelsRoot = document.getElementById('lab-panels');
    if (!panelsRoot) return;

    if ('onbeforematch' in HTMLElement.prototype) {
      panelsRoot.addEventListener('beforematch', (e) => {
        const matchedPanel = e.target && e.target.closest ? e.target.closest('.track-panel') : null;
        if (!matchedPanel || !matchedPanel.dataset.panel) return;
        selectTrack(matchedPanel.dataset.panel, {
          updateHistory: true,
          replaceHistory: true,
          scrollToPanels: false,
          focusTab: false,
          silent: true
        });
      });
    }
  }

  /* ---------- Overview Section B: 4-Track Live Sample Question ---------- */
  function renderSampleQuiz(idx, focusTab = false, silent = false) {
    const safeIdx = ((idx % SAMPLE_QUIZZES.length) + SAMPLE_QUIZZES.length) % SAMPLE_QUIZZES.length;
    activeQuizIdx = safeIdx;
    const item = SAMPLE_QUIZZES[safeIdx];

    if (!silent) {
      playTone(540 + safeIdx * 70, 0.05, 'triangle', 0.03);
    }

    const tabs = document.querySelectorAll('#sample-quiz-tablist [role="tab"]');
    tabs.forEach((tab, i) => {
      const selected = i === safeIdx;
      tab.setAttribute('aria-selected', String(selected));
      tab.setAttribute('tabindex', selected ? '0' : '-1');
      if (focusTab && selected) tab.focus();
    });

    const panel = document.getElementById('sample-quiz-panel');
    if (panel) panel.setAttribute('aria-labelledby', `sample-quiz-tab-${safeIdx}`);

    const tagEl = document.getElementById('sample-quiz-tag');
    const statusEl = document.getElementById('sample-quiz-status');
    const promptEl = document.getElementById('sample-quiz-prompt');
    const optionsEl = document.getElementById('sample-quiz-options');
    const feedbackEl = document.getElementById('sample-quiz-feedback');
    const asideTitle = document.getElementById('sample-quiz-tool-title');
    const asideDesc = document.getElementById('sample-quiz-tool-desc');
    const trackBtn = document.getElementById('sample-quiz-track-btn');
    const toolLink = document.getElementById('sample-quiz-tool-link');

    if (tagEl) tagEl.textContent = item.tag;
    if (statusEl) statusEl.textContent = 'Pick one option';
    if (promptEl) promptEl.textContent = item.prompt;
    if (asideTitle) asideTitle.textContent = item.toolTitle;
    if (asideDesc) asideDesc.textContent = item.toolSummary;
    if (trackBtn) {
      trackBtn.textContent = item.trackLabel;
      trackBtn.dataset.trackJump = item.track;
    }
    if (toolLink) toolLink.href = item.toolUrl;

    if (feedbackEl) {
      feedbackEl.classList.add('hidden');
      feedbackEl.textContent = '';
    }

    if (optionsEl) {
      optionsEl.innerHTML = '';
      item.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz-option-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          optionsEl.querySelectorAll('.quiz-option-btn').forEach((b) => {
            b.classList.remove('is-correct', 'is-wrong');
          });
          btn.classList.add(opt.correct ? 'is-correct' : 'is-wrong');
          if (statusEl) statusEl.textContent = opt.correct ? 'Correct' : 'Try the other option';
          if (feedbackEl) {
            feedbackEl.textContent = opt.explain;
            feedbackEl.classList.remove('hidden');
          }
          if (opt.correct) {
            playTone(660, 0.08, 'triangle', 0.045);
            setTimeout(() => playTone(880, 0.1, 'triangle', 0.045), 70);
          } else {
            playTone(230, 0.1, 'sawtooth', 0.035);
          }
        });
        optionsEl.appendChild(btn);
      });
    }
  }

  function initSampleQuiz() {
    const tablist = document.getElementById('sample-quiz-tablist');
    if (!tablist) return;

    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    tablist.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab) return;
      const idx = Number(tab.dataset.quiz);
      if (!Number.isNaN(idx)) renderSampleQuiz(idx, false, false);
    });

    // Selection follows focus on the instant micro-quiz (no URL side effects)
    tablist.addEventListener('keydown', (e) => {
      const current = e.target.closest('[role="tab"]');
      if (!current) return;
      const idx = tabs.indexOf(current);
      if (idx === -1) return;

      let nextIdx = null;
      if (e.key === 'ArrowRight') nextIdx = (idx + 1) % tabs.length;
      else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') nextIdx = 0;
      else if (e.key === 'End') nextIdx = tabs.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        renderSampleQuiz(nextIdx, true, false);
      }
    });

    renderSampleQuiz(0, false, true);
  }

  /* ---------- Post-Stripe Safety Unlock Handler ---------- */
  function hashAccessCode(raw) {
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

  function handleStripeUnlock(params) {
    const unlockParam = params.get('unlock');
    const sessionId = params.get('session_id') || '';
    const isDirectUnlock =
      params.get('unlocked') === 'true' ||
      /^cs_(?:live|test)_[A-Za-z0-9_]{20,}$/.test(sessionId);

    if (isDirectUnlock || (unlockParam && VALID_CODE_HASHES.includes(hashAccessCode(unlockParam)))) {
      try {
        localStorage.setItem('da_archive_unlocked', 'true');
        localStorage.setItem('da_canon_unlocked', 'true');
        localStorage.setItem('da_course_unlocked_v1', 'true');
      } catch (_) {}

      const banner = document.getElementById('lab-unlock-banner');
      if (banner) banner.classList.remove('hidden');
    }
  }

  /* ---------- Belfast Desk Drop-Box (#belfast-desk-dropbox) ---------- */
  function openBelfastDesk(scrollIntoView = true) {
    const details = document.getElementById('belfast-desk-dropbox');
    if (!details) return;
    details.open = true;
    if (scrollIntoView) {
      setTimeout(() => {
        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  }

  function readDeskDropboxTelemetry() {
    let lastFreeTool = 'lab';
    try {
      lastFreeTool = localStorage.getItem('gm_last_free_tool') || 'lab';
    } catch (_) {}

    let candidateDossier = '';
    try {
      const rawSummary = localStorage.getItem('gm_active_dossier_summary');
      const rawState = localStorage.getItem('gm_candidate_dossier_v1');
      let parsedState = null;
      if (rawState) {
        try { parsedState = JSON.parse(rawState); } catch (_) {}
      }
      const hasUpdatedSkill = Boolean(
        parsedState &&
        parsedState.skills &&
        Object.values(parsedState.skills).some((sk) => sk && sk.lastUpdated)
      );
      if (rawSummary) {
        let summary = null;
        try { summary = JSON.parse(rawSummary); } catch (_) {}
        const hasPlayed = Boolean(
          summary && (
            (summary.gamesCompleted || 0) > 0 ||
            (summary.drillsCompleted || 0) > 0 ||
            hasUpdatedSkill ||
            (summary.gamesCompleted === undefined && summary.drillsCompleted === undefined && summary.code)
          )
        );
        if (hasPlayed) {
          const parts = [];
          if (summary.code) parts.push(summary.code);
          if (summary.cefrShort || summary.cefrBand) parts.push(summary.cefrShort || summary.cefrBand);
          if (typeof summary.overallAccuracy === 'number') parts.push(`Overall ${summary.overallAccuracy}%`);
          if (summary.weakestSkill) {
            parts.push(
              `Focus: ${summary.weakestSkill}${typeof summary.weakestAccuracy === 'number' ? ` (${summary.weakestAccuracy}%)` : ''}`
            );
          }
          candidateDossier = parts.join(' | ') || rawSummary.slice(0, 400);
        }
      }
    } catch (_) {}

    return { lastFreeTool, candidateDossier };
  }

  function initBelfastDeskDropbox() {
    const deskForm = document.getElementById('belfast-desk-dropbox-form');
    if (!deskForm) return;

    const lastToolField = document.getElementById('dropbox-last-free-tool');
    const dossierField = document.getElementById('dropbox-candidate-dossier');
    const successBanner = document.getElementById('dropbox-success-banner');
    const resetBtn = document.getElementById('dropbox-reset-btn');
    const statusEl = document.getElementById('dropbox-form-status');
    const submitBtn = document.getElementById('dropbox-submit-btn');
    const emailInput = document.getElementById('dropbox-email');
    const messageInput = document.getElementById('dropbox-message');

    const syncTelemetryInputs = () => {
      const tel = readDeskDropboxTelemetry();
      if (lastToolField) lastToolField.value = tel.lastFreeTool;
      if (dossierField) dossierField.value = tel.candidateDossier;
    };

    syncTelemetryInputs();

    [emailInput, messageInput].forEach((field) => {
      if (!field) return;
      field.addEventListener('input', () => {
        if (field.getAttribute('aria-invalid') === 'true') {
          field.removeAttribute('aria-invalid');
        }
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (successBanner) successBanner.classList.add('hidden');
        deskForm.classList.remove('hidden');
        if (statusEl) {
          statusEl.textContent = '';
          statusEl.className = 'desk-status';
        }
        if (messageInput) messageInput.focus();
      });
    }

    deskForm.addEventListener('submit', async (e) => {
      if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;
      if (deskForm.dataset.submitting === 'true') {
        e.preventDefault();
        return;
      }
      e.preventDefault();

      const emailVal = emailInput ? emailInput.value.trim() : '';
      const msgVal = messageInput ? messageInput.value.trim() : '';

      if (!emailVal || !emailVal.includes('@')) {
        if (emailInput) {
          emailInput.setAttribute('aria-invalid', 'true');
          emailInput.focus();
        }
        if (statusEl) {
          statusEl.className = 'desk-status desk-status--error';
          statusEl.textContent = 'Please enter a valid email address so I can send your 24h red-pen note.';
        }
        return;
      }

      if (!msgVal) {
        if (messageInput) {
          messageInput.setAttribute('aria-invalid', 'true');
          messageInput.focus();
        }
        if (statusEl) {
          statusEl.className = 'desk-status desk-status--error';
          statusEl.textContent = 'Please add your question, short paragraph, or Part 4 attempts first.';
        }
        return;
      }

      syncTelemetryInputs();
      const originalBtnText = submitBtn ? submitBtn.textContent : 'Send to My Belfast Desk (Free 24h Note)';
      deskForm.dataset.submitting = 'true';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending to Gareth...';
      }
      if (statusEl) {
        statusEl.textContent = '';
        statusEl.className = 'desk-status';
      }

      try {
        const response = await fetch(deskForm.action || 'https://formspree.io/f/mvkgrwvj', {
          method: 'POST',
          body: new FormData(deskForm),
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) {
          let errorMessage = 'Could not send your message right now.';
          try {
            const payload = await response.json();
            if (payload && Array.isArray(payload.errors) && payload.errors.length) {
              errorMessage = payload.errors.map((err) => err.message).filter(Boolean).join(' ');
            }
          } catch (_) {}
          throw new Error(errorMessage);
        }

        if (window.CandidateDossier && typeof window.CandidateDossier.saveEmail === 'function') {
          window.CandidateDossier.saveEmail(emailVal);
        }
        if (typeof window.trackFunnelEvent === 'function') {
          window.trackFunnelEvent('lab_desk_dropbox_succeeded', { source: 'lab_inline_desk_dropbox' });
        }

        deskForm.reset();
        syncTelemetryInputs();
        deskForm.classList.add('hidden');
        if (successBanner) successBanner.classList.remove('hidden');
      } catch (_) {
        if (statusEl) {
          statusEl.className = 'desk-status desk-status--error';
          statusEl.innerHTML =
            'Your message was not sent yet (your text above is still saved). Please try again in a moment, or email me directly at <a href="mailto:gareth@garethenglish.com?subject=Lab%20Free%2024h%20Red-Pen%20Note">gareth@garethenglish.com</a>.';
        }
      } finally {
        delete deskForm.dataset.submitting;
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtnText;
        }
      }
    });
  }

  /* ---------- Legacy Hash & Query Param Routing ---------- */
  function routeFromLocation(isInitial = false) {
    let params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (_) {
      params = new URLSearchParams('');
    }

    if (isInitial) {
      handleStripeUnlock(params);
    }

    const hash = window.location.hash;
    if (hash && LEGACY_HASH_ROUTES[hash]) {
      const route = LEGACY_HASH_ROUTES[hash];
      if (route.openDesk) {
        openBelfastDesk(true);
        return;
      }
      if (route.track) {
        selectTrack(route.track, {
          updateHistory: false,
          scrollToPanels: false,
          silent: true
        });
        if (route.scrollTarget) {
          const target = document.querySelector(route.scrollTarget);
          if (target) {
            setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
          }
        }
        return;
      }
    }

    const trackParam = params.get('track');
    if (trackParam && VALID_TRACKS.includes(trackParam.toLowerCase())) {
      selectTrack(trackParam, { updateHistory: false, silent: true });
      return;
    }

    // Legacy ?wing= compatibility
    const wingParam = (params.get('wing') || '').toLowerCase();
    if (wingParam === 'adults') {
      selectTrack('cae', { updateHistory: true, replaceHistory: true, silent: true });
      return;
    }
    if (wingParam === 'teens') {
      selectTrack('games', { updateHistory: true, replaceHistory: true, silent: true });
      return;
    }

    selectTrack('overview', { updateHistory: false, silent: true });
  }

  /* ---------- Global Click Delegations ---------- */
  function initInteractions() {
    // 4 Entry Door Buttons
    document.querySelectorAll('.lab-door[data-door]').forEach((door) => {
      door.addEventListener('click', () => {
        const target = door.dataset.door;
        if (!target) return;
        selectTrack(target, { updateHistory: true, scrollToPanels: true });
      });
    });

    // Track Back Buttons ("All Tracks") & Quiz Track Bridge Buttons
    document.addEventListener('click', (e) => {
      const jumpBtn = e.target.closest('[data-track-jump]');
      if (jumpBtn) {
        const target = jumpBtn.dataset.trackJump;
        if (target) {
          selectTrack(target, { updateHistory: true, scrollToPanels: true });
        }
        return;
      }

      const sfxBtn = e.target.closest('[data-sfx-toggle]');
      if (sfxBtn) {
        toggleSFX();
        return;
      }

      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (hash === '#belfast-desk-dropbox') {
        e.preventDefault();
        openBelfastDesk(true);
      } else if (hash && LEGACY_HASH_ROUTES[hash]) {
        e.preventDefault();
        const route = LEGACY_HASH_ROUTES[hash];
        if (route.track) {
          selectTrack(route.track, { updateHistory: true, scrollToPanels: false });
          const target = route.scrollTarget ? document.querySelector(route.scrollTarget) : null;
          if (target) {
            setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
          }
        }
      }
    });

    window.addEventListener('popstate', () => {
      routeFromLocation(false);
    });

    window.addEventListener('hashchange', () => {
      routeFromLocation(false);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncSFXButtons();
    initTrackTablist();
    initBeforeMatchSync();
    initSampleQuiz();
    initBelfastDeskDropbox();
    initInteractions();
    routeFromLocation(true);
  });

  return {
    selectTrack,
    toggleSFX,
    openBelfastDesk,
    getActiveTrack: () => activeTrack,
    getActiveQuizIdx: () => activeQuizIdx
  };
})();

window.LabStudio = LabStudio;
// Keep lightweight alias so any external snippet checking LabObservatory.toggleSFX stays safe
window.LabObservatory = LabStudio;
