/**
 * Phraxos: The Bourani Godgame — Zero-HUD Myst Immersion & Act VI "Eleutheria" Narrative Engine
 * Classic browser script (100% compatible with file:// and https://, zero ES module imports).
 * Exposes window.PhraxosNarrative implementing the shared IsleGame phraxosCtx contract.
 */
(function () {
  'use strict';

  const SAVE_KEY = 'phraxos-eleutheria-v1';
  const EDGE_PEEK_PX = 48;

  // The Five Etched Marble Seals of Eleutheria across the 5 Headlands of Phraxos
  const SEAL_DEFS = [
    {
      id: 0,
      roman: 'I',
      greek: 'ΑΠΟΛΛΩΝ',
      motif: 'lyre',
      headland: 'West Terrace',
      shortLine: 'ΑΠΟΛΛΩΝ · Scarcely had the schoolmaster stepped onto Bourani...',
      fullEpigraph: 'Scarcely had the schoolmaster stepped onto Bourani when the colonnade answered in light.',
      mastery: 'Inversion Mastery',
      blueprint: '[Negative Adverbial] + [Inverted Auxiliary + Subject] + [Main Clause]'
    },
    {
      id: 1,
      roman: 'II',
      greek: 'ΑΡΤΕΜΙΣ',
      motif: 'crescent',
      headland: 'East Colonnade',
      shortLine: 'ΑΡΤΕΜΙΣ · What Conchis had staged was a theatre without walls...',
      fullEpigraph: 'What Conchis had staged was a theatre without walls, lit by twin lanterns beneath the pines.',
      mastery: 'Cleft & Participle Mastery',
      blueprint: '[What + Clause] + [Singular BE] + [Focused Complement]'
    },
    {
      id: 2,
      roman: 'III',
      greek: 'ΔΕΥΚΑΛΙΩΝ',
      motif: 'wave',
      headland: '1943 Cove',
      shortLine: 'ΔΕΥΚΑΛΙΩΝ · Freedom that cannot be betrayed...',
      fullEpigraph: 'Freedom that cannot be betrayed is rumoured to endure beyond every occupation.',
      mastery: 'Passive Reporting Mastery',
      blueprint: '[Subject] + [Passive Reporting Verb] + [Infinitive Phrase]'
    },
    {
      id: 3,
      roman: 'IV',
      greek: 'ΜΥΣΤΗΣ',
      motif: 'torch',
      headland: 'Trial Court',
      shortLine: 'ΜΥΣΤΗΣ · Were you to unmask the actors...',
      fullEpigraph: 'Were you to unmask the actors, only your own reflection would remain in the court.',
      mastery: 'Inverted Conditional Mastery',
      blueprint: '[Were + Subject + to + Infinitive] + [Subject + would + Infinitive]'
    },
    {
      id: 4,
      roman: 'V',
      greek: 'ΕΛΕΥΘΕΡΙΑ',
      motif: 'wreath',
      headland: 'Parnassus',
      shortLine: 'ΕΛΕΥΘΕΡΙΑ · Not so much an answer as a doorway...',
      fullEpigraph: 'Not so much an answer as a doorway stood waiting at the northern brink of Phraxos.',
      mastery: 'Contrastive C2 Mastery',
      blueprint: '[Not so much X as Y] + [Finite Clause]'
    }
  ];

  // Optional Bonus Estate Contraption Glyphs from PhraxosMachinery
  const BONUS_DEFS = [
    {
      machineId: 'armillary',
      greek: 'ΦΩΣ',
      title: 'Equinox Armillary',
      note: 'Three brass astrolabe rings aligned on Bourani Terrace'
    },
    {
      machineId: 'harpsichord',
      greek: 'ΜΟΥΣΙΚΗ',
      title: 'Bourani Harpsichord',
      note: 'Conchis’s four-note prelude played in the villa loggia'
    }
  ];

  // Interactive Act VI Final Unmasking Synthesis Challenge on the Parnassus Stela
  const SYNTHESIS_SLOTS = [
    {
      id: 0,
      role: '1. Delayed Inversion Frame',
      blueprint: 'Only when + [Time Clause] + [did + Subject + Base Verb]',
      correctIdx: 0,
      options: [
        {
          text: 'Only when the final mask fell did I realise',
          feedback: 'Spot on: after fronted "Only when", the subordinate time clause keeps normal word order and the main clause inverts ("did I realise").'
        },
        {
          text: 'Only when did the final mask fall I realised',
          feedback: 'Watch the inversion placement: never invert inside the "Only when" time clause itself — save "did I realise" for the main clause.'
        },
        {
          text: 'Scarcely had the final mask fallen than I realised',
          feedback: 'Classic correlative trap: "Scarcely" pairs with "when", whereas "than" belongs strictly to comparative "No sooner".'
        }
      ]
    },
    {
      id: 1,
      role: '2. Nominal What-Cleft & Contrastive Pivot',
      blueprint: 'that + [what + Subject + Past Perfect] + [was not so much X]',
      correctIdx: 1,
      options: [
        {
          text: 'that what had Conchis staged on Phraxos were not so much a trap',
          feedback: 'Embedded nominal "what"-clauses use statement word order ("what Conchis had staged") and take a singular verb ("was").'
        },
        {
          text: 'that what Conchis had staged on Phraxos was not so much a trap',
          feedback: 'Clean C1/C2 control: singular nominal "what"-cleft paired smoothly with "was not so much [X]...".'
        },
        {
          text: 'that it was Conchis had staged on Phraxos not so much a trap',
          feedback: 'An "It"-cleft requires a relative linker ("that"), whereas a "what"-cleft acts directly as the subject of "was".'
        }
      ]
    },
    {
      id: 2,
      role: '3. Contrastive Resolution & Participle Clause',
      blueprint: 'as + [Parallel Noun Phrase] + [Past Participle Modifier]',
      correctIdx: 2,
      options: [
        {
          text: 'than an open theatre carving to test a sovereign mind.',
          feedback: '"Not so much [X]" must resolve with "as [Y]" (never "than"), and the theatre is passively "carved", not "carving".'
        },
        {
          text: 'as an open theatre was carved to test a sovereign mind.',
          feedback: 'After contrastive "as", keep the noun phrase parallel ("an open theatre carved...") without an extra finite "was".'
        },
        {
          text: 'as an open theatre carved to test a sovereign mind.',
          feedback: 'Exact parallel completion: "not so much a trap as an open theatre", refined by a concise past participle clause.'
        }
      ]
    }
  ];

  const SYNTHESIS_MODEL_SENTENCE =
    'Only when the final mask fell did I realise that what Conchis had staged on Phraxos was not so much a trap as an open theatre carved to test a sovereign mind.';

  let savedCtx = null;
  let initialized = false;
  let hasCompletedInitialSync = false;
  let immersionActive = false;

  // Seal & Finale State
  const sealLit = [false, false, false, false, false];
  const prevSealLit = [false, false, false, false, false];
  const bonusLit = { armillary: false, harpsichord: false };
  let eleutheriaAwakened = false;
  let synthesisChoices = [null, null, null];
  let synthesisSolved = false;
  let synthesisModelVisible = false;
  let lastSynthesisFeedback = '';
  let lastSynthesisStatus = 'neutral';
  let focusedSealIdx = -1;

  // Timers for Pure Myst View edge-peek & toast-peek
  let topPeekTimer = null;
  let bottomPeekTimer = null;
  let toastPeekTimer = null;
  let lastEffectSignature = '';

  // 3D Scene References for the Classical Attic Sanctuary Stela & Seamless Aurora Crown
  const stela3D = {
    root: null,
    headerPlaque: null,
    headerAwakenedState: null,
    acroterionGlowSprite: null,
    tympanumShieldMat: null,
    plaqueMeshes: [],
    medallionMeshes: [],
    medallionHaloSprites: [],
    bezelMats: [],
    plaqueStates: ['', '', '', '', ''],
    bonusMeshes: {},
    bonusStates: { armillary: null, harpsichord: null },
    stelaAmbientGlowSprite: null,
    auroraGroup: null,
    auroraUniforms: null,
    shaftUniforms: null,
    haloRingUniforms: null,
    starSprites: [],
    moteSprites: [],
    celebrationBurst: 0
  };

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================
  function loadSavedFinale() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        eleutheriaAwakened = Boolean(parsed.eleutheriaAwakened);
        synthesisSolved = Boolean(parsed.synthesisSolved);
        if (Array.isArray(parsed.synthesisChoices) && parsed.synthesisChoices.length === 3) {
          synthesisChoices = parsed.synthesisChoices.map((v) =>
            typeof v === 'number' && v >= 0 && v <= 2 ? v : null
          );
        }
        if (parsed.bonusLit && typeof parsed.bonusLit === 'object') {
          bonusLit.armillary = Boolean(parsed.bonusLit.armillary);
          bonusLit.harpsichord = Boolean(parsed.bonusLit.harpsichord);
        }
      }
    } catch (e) {
      // Ignore storage restrictions on locked-down browsers
    }
  }

  function saveFinaleState() {
    try {
      localStorage.setItem(
        SAVE_KEY,
        JSON.stringify({
          eleutheriaAwakened,
          synthesisSolved,
          synthesisChoices,
          bonusLit
        })
      );
    } catch (e) {
      // Ignore storage restrictions
    }
  }

  // ==========================================================================
  // SEAL EVALUATION HELPERS
  // ==========================================================================
  function computeSealsFromCtx(ctx) {
    const activeCtx = ctx || savedCtx;
    let discSet = null;
    if (activeCtx && typeof activeCtx.getDiscoveredSet === 'function') {
      discSet = activeCtx.getDiscoveredSet();
    }

    for (let a = 0; a < 5; a++) {
      let anyOnHeadland = false;
      if (discSet && typeof discSet.has === 'function') {
        for (let w = 0; w < 5; w++) {
          if (discSet.has(a + '_' + w)) {
            anyOnHeadland = true;
            break;
          }
        }
      }
      sealLit[a] = anyOnHeadland;
    }

    if (
      window.PhraxosMachinery &&
      typeof window.PhraxosMachinery.getSolvedMachines === 'function'
    ) {
      const solvedList = window.PhraxosMachinery.getSolvedMachines() || [];
      if (Array.isArray(solvedList)) {
        if (solvedList.indexOf('armillary') !== -1) bonusLit.armillary = true;
        if (solvedList.indexOf('harpsichord') !== -1) bonusLit.harpsichord = true;
      }
    }
  }

  function getLitHeadlandCount() {
    let n = 0;
    for (let i = 0; i < 5; i++) {
      if (sealLit[i]) n++;
    }
    return n;
  }

  function getSealStatus() {
    return {
      seals: sealLit.slice(),
      litCount: getLitHeadlandCount(),
      bonus: { armillary: bonusLit.armillary, harpsichord: bonusLit.harpsichord },
      eleutheriaAwakened,
      synthesisSolved
    };
  }

  // ==========================================================================
  // 1. ZERO-HUD PURE MYST IMMERSION CONTROLLER
  // ==========================================================================
  function isTypingInField(target) {
    const el = target || document.activeElement;
    if (!el || !el.tagName) return false;
    const tag = el.tagName.toUpperCase();
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      Boolean(el.isContentEditable)
    );
  }

  function isIntroScreenOpen(ctx) {
    const activeCtx = ctx || savedCtx;
    if (activeCtx && typeof activeCtx.inIntro === 'function' && activeCtx.inIntro()) {
      return true;
    }
    const introEl = document.getElementById('intro-screen');
    return Boolean(introEl && !introEl.classList.contains('dismissed'));
  }

  function updateImmersionUI() {
    const btn = document.getElementById('myst-immersion-btn');
    if (btn) {
      btn.classList.toggle('active', immersionActive);
      btn.setAttribute('aria-pressed', immersionActive ? 'true' : 'false');
      btn.innerHTML = immersionActive
        ? '<span>👁️ Pure Myst: ON <span class="hud-eye-kbd">H</span></span>'
        : '<span>👁️ Pure Myst View <span class="hud-eye-kbd">H</span></span>';
    }
    const wakePill = document.getElementById('myst-immersion-wake-pill');
    if (wakePill) {
      wakePill.setAttribute('aria-hidden', immersionActive ? 'false' : 'true');
    }
  }

  function triggerTransientToastPeek(durationMs) {
    if (!immersionActive) return;
    document.body.classList.add('myst-toast-peek');
    if (toastPeekTimer) clearTimeout(toastPeekTimer);
    toastPeekTimer = setTimeout(() => {
      document.body.classList.remove('myst-toast-peek');
    }, durationMs || 4000);
  }

  function toggleImmersionMode(force) {
    const nextState = typeof force === 'boolean' ? force : !immersionActive;
    immersionActive = nextState;
    document.body.classList.toggle('myst-immersion-mode', immersionActive);

    if (!immersionActive) {
      document.body.classList.remove('myst-peek-top', 'myst-peek-bottom', 'myst-toast-peek');
      if (topPeekTimer) clearTimeout(topPeekTimer);
      if (bottomPeekTimer) clearTimeout(bottomPeekTimer);
      if (toastPeekTimer) clearTimeout(toastPeekTimer);
    } else {
      syncDrawerStateClass();
    }

    updateImmersionUI();

    if (savedCtx && typeof savedCtx.playChord === 'function') {
      const st =
        typeof savedCtx.getAudioState === 'function' ? savedCtx.getAudioState() : false;
      const audioOn =
        typeof st === 'object' && st !== null
          ? Boolean(st.audioEnabled !== undefined ? st.audioEnabled : st.enabled)
          : Boolean(st);
      if (audioOn) {
        savedCtx.playChord(immersionActive ? [440.0, 659.25] : [392.0, 523.25], 0.45);
      }
    }
    return immersionActive;
  }

  function isImmersionMode() {
    return immersionActive;
  }

  function syncDrawerStateClass() {
    const drawer = document.getElementById('rack-drawer');
    const isOpen = Boolean(drawer && drawer.classList.contains('open'));
    document.body.classList.toggle('myst-tray-open', isOpen);
  }

  function injectImmersionControls() {
    if (!document.getElementById('myst-immersion-btn')) {
      const topBar = document.querySelector('.hud-layer .top-bar');
      if (topBar) {
        const pillGroups = topBar.querySelectorAll('.nav-pills');
        const utilityGroup = pillGroups.length > 1 ? pillGroups[pillGroups.length - 1] : pillGroups[0];
        const eyeBtn = document.createElement('button');
        eyeBtn.type = 'button';
        eyeBtn.id = 'myst-immersion-btn';
        eyeBtn.className = 'hud-btn myst-eye-btn';
        eyeBtn.title = 'Toggle Zero-HUD Pure Myst Cinema View [Key: H]';
        eyeBtn.setAttribute('aria-pressed', 'false');
        eyeBtn.innerHTML = '<span>👁️ Pure Myst View <span class="hud-eye-kbd">H</span></span>';
        eyeBtn.addEventListener('click', () => {
          toggleImmersionMode();
        });
        if (utilityGroup) {
          utilityGroup.insertBefore(eyeBtn, utilityGroup.firstChild);
        } else {
          topBar.appendChild(eyeBtn);
        }
      }
    }

    if (!document.getElementById('myst-immersion-wake-pill')) {
      const wakePill = document.createElement('button');
      wakePill.type = 'button';
      wakePill.id = 'myst-immersion-wake-pill';
      wakePill.className = 'myst-immersion-wake-pill';
      wakePill.title = 'Restore Full Bourani HUD [Key: H]';
      wakePill.innerHTML = '<span>👁️ Pure Myst View &bull; Exit [H]</span>';
      wakePill.addEventListener('click', () => {
        toggleImmersionMode(false);
      });
      document.body.appendChild(wakePill);
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        const stelaModal = document.getElementById('eleutheria-stela-modal');
        if (stelaModal && !stelaModal.classList.contains('hidden')) {
          closeStelaModal();
          return;
        }
      }
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.code === 'KeyH') {
        if (isTypingInField(e.target)) return;
        if (isIntroScreenOpen()) return;
        const journalModal = document.getElementById('journal-modal');
        if (journalModal && !journalModal.classList.contains('hidden')) return;
        const stelaModal = document.getElementById('eleutheria-stela-modal');
        if (stelaModal && !stelaModal.classList.contains('hidden')) return;
        e.preventDefault();
        toggleImmersionMode();
      }
    });

    window.addEventListener(
      'mousemove',
      (e) => {
        if (!immersionActive) return;
        const h = window.innerHeight || 768;
        const nearTop = e.clientY <= EDGE_PEEK_PX;
        const nearBottom = e.clientY >= h - EDGE_PEEK_PX;

        const topBar = document.querySelector('.hud-layer .top-bar');
        const effectStrip = document.getElementById('effect-strip');
        const altarDock = document.querySelector('.hud-layer .altar-dock');

        const overTopCluster =
          (topBar && topBar.matches(':hover')) || (effectStrip && effectStrip.matches(':hover'));
        const overBottomCluster = altarDock && altarDock.matches(':hover');

        if (nearTop || overTopCluster) {
          if (topPeekTimer) {
            clearTimeout(topPeekTimer);
            topPeekTimer = null;
          }
          document.body.classList.add('myst-peek-top');
        } else if (document.body.classList.contains('myst-peek-top') && !topPeekTimer) {
          topPeekTimer = setTimeout(() => {
            topPeekTimer = null;
            const stillOver =
              (topBar && topBar.matches(':hover')) ||
              (effectStrip && effectStrip.matches(':hover'));
            if (!stillOver) document.body.classList.remove('myst-peek-top');
          }, 420);
        }

        if (nearBottom || overBottomCluster) {
          if (bottomPeekTimer) {
            clearTimeout(bottomPeekTimer);
            bottomPeekTimer = null;
          }
          document.body.classList.add('myst-peek-bottom');
        } else if (document.body.classList.contains('myst-peek-bottom') && !bottomPeekTimer) {
          bottomPeekTimer = setTimeout(() => {
            bottomPeekTimer = null;
            const stillOver = altarDock && altarDock.matches(':hover');
            if (!stillOver) document.body.classList.remove('myst-peek-bottom');
          }, 420);
        }
      },
      { passive: true }
    );

    const rackDrawer = document.getElementById('rack-drawer');
    if (rackDrawer && typeof MutationObserver !== 'undefined') {
      syncDrawerStateClass();
      const drawerObs = new MutationObserver(() => syncDrawerStateClass());
      drawerObs.observe(rackDrawer, { attributes: true, attributeFilter: ['class'] });
    }

    const unlockToast = document.getElementById('unlock-toast');
    if (unlockToast && typeof MutationObserver !== 'undefined') {
      const toastObs = new MutationObserver(() => {
        if (unlockToast.classList.contains('show')) {
          triggerTransientToastPeek(4600);
        }
      });
      toastObs.observe(unlockToast, { attributes: true, attributeFilter: ['class', 'innerHTML'] });
    }

    const effectStrip = document.getElementById('effect-strip');
    const effectText = document.getElementById('effect-text');
    if (effectStrip && effectText && typeof MutationObserver !== 'undefined') {
      lastEffectSignature = effectText.textContent || '';
      const stripObs = new MutationObserver(() => {
        const sig = (effectStrip.className || '') + '|' + (effectText.textContent || '');
        if (sig !== lastEffectSignature) {
          lastEffectSignature = sig;
          if (
            effectStrip.classList.contains('solved') ||
            effectStrip.classList.contains('clue') ||
            effectStrip.classList.contains('clash')
          ) {
            triggerTransientToastPeek(3900);
          }
        }
      });
      stripObs.observe(effectStrip, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }

  // ==========================================================================
  // 2. BOURANI DOSSIER GODGAME CIPHER STRIP & ACT VI STELA MODAL
  // ==========================================================================
  function injectCipherStripAndModal() {
    if (!document.getElementById('godgame-cipher-strip')) {
      const stripEl = document.createElement('section');
      stripEl.id = 'godgame-cipher-strip';
      stripEl.className = 'godgame-cipher-strip';
      stripEl.setAttribute('aria-label', 'The Five Seals of Eleutheria Cipher');

      const tabsBar = document.querySelector('#journal-modal .journal-tabs-bar');
      const estatePane = document.getElementById('journal-estate-pane');
      if (tabsBar && tabsBar.parentNode) {
        tabsBar.parentNode.insertBefore(stripEl, tabsBar);
      } else if (estatePane && estatePane.parentNode) {
        estatePane.parentNode.insertBefore(stripEl, estatePane);
      }
    }

    if (!document.getElementById('eleutheria-stela-modal')) {
      const modalBackdrop = document.createElement('div');
      modalBackdrop.id = 'eleutheria-stela-modal';
      modalBackdrop.className = 'stela-modal-backdrop hidden';
      modalBackdrop.setAttribute('role', 'dialog');
      modalBackdrop.setAttribute('aria-modal', 'true');
      modalBackdrop.setAttribute('aria-labelledby', 'eleutheria-stela-heading');
      modalBackdrop.addEventListener('click', (e) => {
        if (e.target === modalBackdrop) closeStelaModal();
      });

      const card = document.createElement('div');
      card.className = 'stela-sanctuary-card';
      card.id = 'eleutheria-stela-card';
      modalBackdrop.appendChild(card);
      document.body.appendChild(modalBackdrop);
    }

    renderCipherStrip();
    renderStelaModal();
  }

  function jumpToHeadlandFromUI(altarId) {
    if (window.IsleGame && typeof window.IsleGame.toggleJournal === 'function') {
      window.IsleGame.toggleJournal(false);
    }
    closeStelaModal();
    if (savedCtx && typeof savedCtx.teleportToAltar === 'function') {
      savedCtx.teleportToAltar(altarId);
    } else if (window.IsleGame && typeof window.IsleGame.teleportToAltar === 'function') {
      window.IsleGame.teleportToAltar(altarId);
    }
  }

  function walkToParnassusStela() {
    if (window.IsleGame && typeof window.IsleGame.toggleJournal === 'function') {
      window.IsleGame.toggleJournal(false);
    }
    closeStelaModal();
    if (savedCtx && typeof savedCtx.teleportToAltar === 'function') {
      savedCtx.teleportToAltar(4);
    } else if (window.IsleGame && typeof window.IsleGame.teleportToAltar === 'function') {
      window.IsleGame.teleportToAltar(4);
    }
    if (savedCtx && savedCtx.player) {
      savedCtx.player.x = 0.0;
      savedCtx.player.z = -97.6;
      savedCtx.player.yaw = 0.0;
      savedCtx.player.pitch = -0.04;
    }
    if (savedCtx && typeof savedCtx.showBanner === 'function') {
      savedCtx.showBanner(
        '🏛️ Northern Overlook of Parnassus: Before you stands the Classical Attic Stela of Eleutheria. Click the Pentelic monument to inspect your Five Seals.',
        'clue'
      );
    }
  }

  function renderCipherStrip() {
    const stripEl = document.getElementById('godgame-cipher-strip');
    if (!stripEl) return;

    const litCount = getLitHeadlandCount();
    stripEl.classList.toggle('eleutheria-complete', eleutheriaAwakened);

    const cardsHtml = SEAL_DEFS.map((seal, idx) => {
      const isLit = sealLit[idx];
      return (
        '<button type="button" class="cipher-seal-card ' +
        (isLit ? 'seal-lit' : '') +
        '" data-seal-jump="' +
        idx +
        '" title="' +
        (isLit
          ? 'Seal illuminated — click to visit ' + seal.headland
          : 'Unsealed — solve at least 1 truth at ' + seal.headland + ' to illuminate') +
        '">' +
        '<div class="cipher-seal-top">' +
        '<span class="cipher-seal-greek">' +
        seal.roman +
        ' &bull; ' +
        seal.greek +
        '</span>' +
        '<span class="cipher-seal-lamp">' +
        (isLit ? '✦ LIT' : '◇ UNSEALED') +
        '</span>' +
        '</div>' +
        '<div class="cipher-seal-quote">“' +
        (isLit ? seal.fullEpigraph : seal.shortLine.split('·')[1].trim()) +
        '”</div>' +
        '<div class="cipher-seal-meta">' +
        seal.headland +
        ' &bull; ' +
        seal.mastery +
        '</div>' +
        '</button>'
      );
    }).join('');

    const bonusHtml = BONUS_DEFS.map((b) => {
      const lit = Boolean(bonusLit[b.machineId]);
      return (
        '<span class="cipher-bonus-pill ' +
        (lit ? 'bonus-lit' : '') +
        '" title="' +
        b.note +
        '">' +
        (lit ? '✦ ' : '◦ ') +
        b.greek +
        ' &middot; ' +
        b.title +
        '</span>'
      );
    }).join('');

    const epigraphHtml = eleutheriaAwakened
      ? '<div class="cipher-epigraph-banner">' +
        '<span>👑 <strong>Act VI &middot; Grand Eleutheria Illumination Active:</strong> <em>“The masque is ended; the language is yours.”</em> &mdash; Maurice Conchis</span>' +
        '<button type="button" class="hud-btn" id="cipher-open-stela-epigraph-btn">🏛️ View Sanctuary Stela</button>' +
        '</div>'
      : '';

    stripEl.innerHTML =
      '<div class="cipher-strip-head">' +
      '<div>' +
      '<div class="cipher-strip-eyebrow">Act VI Island-Wide Mystery &bull; The Five Seals of Eleutheria</div>' +
      '<div class="cipher-strip-title">🏛️ Conchis’s Cross-Headland Godgame Cipher</div>' +
      '</div>' +
      '<div class="cipher-strip-actions">' +
      '<span class="cipher-count-pill ' +
      (litCount === 5 ? 'all-lit' : '') +
      '">' +
      (litCount === 5 ? '✓ All 5 Headland Seals Lit' : litCount + ' / 5 Headland Seals Lit') +
      '</span>' +
      '<button type="button" class="hud-btn" id="cipher-walk-stela-btn" title="Stand before the 3D Eleutheria Stela at the north brink of Parnassus">' +
      '<span>🧭 Stand at Parnassus Stela &rarr;</span>' +
      '</button>' +
      '<button type="button" class="hud-btn" id="cipher-inspect-stela-btn" title="Open the Sanctuary Stela inscription &amp; Act VI Synthesis Challenge">' +
      '<span>🪨 Inspect Stela</span>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<div class="cipher-seals-grid">' +
      cardsHtml +
      '</div>' +
      '<div class="cipher-bonus-row">' +
      '<span><strong>Estate Contraption Signets:</strong> Align the Terrace Armillary or play the Villa Loggia Harpsichord to kindle bonus bronze signets on the Stela.</span>' +
      '<div class="cipher-bonus-badges">' +
      bonusHtml +
      '</div>' +
      '</div>' +
      epigraphHtml;

    stripEl.querySelectorAll('[data-seal-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-seal-jump'));
        if (!Number.isNaN(idx)) jumpToHeadlandFromUI(idx);
      });
    });

    const walkBtn = document.getElementById('cipher-walk-stela-btn');
    if (walkBtn) walkBtn.addEventListener('click', walkToParnassusStela);

    const inspectBtn = document.getElementById('cipher-inspect-stela-btn');
    if (inspectBtn) {
      inspectBtn.addEventListener('click', () => {
        if (window.IsleGame && typeof window.IsleGame.toggleJournal === 'function') {
          window.IsleGame.toggleJournal(false);
        }
        openStelaModal();
      });
    }

    const epigraphBtn = document.getElementById('cipher-open-stela-epigraph-btn');
    if (epigraphBtn) {
      epigraphBtn.addEventListener('click', () => {
        if (window.IsleGame && typeof window.IsleGame.toggleJournal === 'function') {
          window.IsleGame.toggleJournal(false);
        }
        openStelaModal();
      });
    }
  }

  function openStelaModal(highlightSealIdx) {
    focusedSealIdx = typeof highlightSealIdx === 'number' ? highlightSealIdx : -1;
    renderStelaModal();
    const modal = document.getElementById('eleutheria-stela-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeStelaModal() {
    const modal = document.getElementById('eleutheria-stela-modal');
    if (modal) modal.classList.add('hidden');
  }

  function evaluateSynthesisChallenge() {
    if (
      synthesisChoices[0] === null ||
      synthesisChoices[1] === null ||
      synthesisChoices[2] === null
    ) {
      lastSynthesisStatus = 'warn';
      lastSynthesisFeedback =
        'Select one carved clause in each of the three columns before testing the keystone inscription.';
      if (savedCtx && typeof savedCtx.playChord === 'function') {
        savedCtx.playChord([293.66, 349.23], 0.35);
      }
      renderStelaModal();
      return;
    }

    let firstFaultCol = -1;
    for (let c = 0; c < 3; c++) {
      if (synthesisChoices[c] !== SYNTHESIS_SLOTS[c].correctIdx) {
        firstFaultCol = c;
        break;
      }
    }

    if (firstFaultCol === -1) {
      synthesisSolved = true;
      lastSynthesisStatus = 'ok';
      lastSynthesisFeedback =
        '✓ Spot on! Delayed inversion after "Only when", a singular nominal "what"-cleft, and parallel contrastive "not so much X as Y" unite cleanly. The Sanctuary Stela awakens!';
      saveFinaleState();
      triggerGrandIllumination(savedCtx, 'synthesis');
      renderStelaModal();
      renderCipherStrip();
    } else {
      const chosenIdx = synthesisChoices[firstFaultCol];
      const slotDef = SYNTHESIS_SLOTS[firstFaultCol];
      lastSynthesisStatus = 'bad';
      lastSynthesisFeedback =
        '⚡ Column ' +
        (firstFaultCol + 1) +
        ' (' +
        slotDef.role +
        '): ' +
        slotDef.options[chosenIdx].feedback;
      if (savedCtx && typeof savedCtx.playChord === 'function') {
        savedCtx.playChord([196.0, 185.0], 0.35);
      }
      renderStelaModal();
    }
  }

  function renderStelaModal() {
    const card = document.getElementById('eleutheria-stela-card');
    if (!card) return;

    const litCount = getLitHeadlandCount();

    const sealsHtml = SEAL_DEFS.map((s, idx) => {
      const lit = sealLit[idx];
      const focused = idx === focusedSealIdx;
      return (
        '<div class="stela-seal-plaque ' +
        (lit ? 'lit' : '') +
        (focused ? ' focused-seal' : '') +
        '">' +
        '<div>' +
        '<div style="display:flex; justify-content:space-between; align-items:center; gap:0.25rem;">' +
        '<span style="font-family:var(--font-serif,Georgia,serif); font-size:0.76rem; font-weight:800; color:' +
        (lit ? '#fde68a' : '#94a3b8') +
        ';">' +
        s.roman +
        ' &middot; ' +
        s.greek +
        '</span>' +
        '<span style="font-size:0.65rem; font-weight:800; color:' +
        (lit ? '#34d399' : '#64748b') +
        ';">' +
        (lit ? '✦ SEAL LIT' : '◇ UNLIT') +
        '</span>' +
        '</div>' +
        '<div style="font-size:0.66rem; font-weight:700; color:#7dd3fc; margin-top:0.15rem;">' +
        s.headland +
        ' &bull; ' +
        s.mastery +
        '</div>' +
        '<p style="font-family:var(--font-serif,Georgia,serif); font-style:italic; font-size:0.73rem; line-height:1.4; color:' +
        (lit ? '#fef3c7' : '#94a3b8') +
        '; margin-top:0.32rem;">“' +
        (lit ? s.fullEpigraph : s.shortLine.split('·')[1].trim()) +
        '”</p>' +
        '</div>' +
        '<button type="button" class="hud-btn" style="width:100%; justify-content:center; margin-top:0.25rem;" data-stela-jump="' +
        idx +
        '">' +
        (lit ? '🏛️ Revisit ' + s.headland : '🧭 Visit ' + s.headland + ' &rarr;') +
        '</button>' +
        '</div>'
      );
    }).join('');

    const bonusBadgesHtml = BONUS_DEFS.map((b) => {
      const lit = Boolean(bonusLit[b.machineId]);
      return (
        '<span class="cipher-bonus-pill ' +
        (lit ? 'bonus-lit' : '') +
        '">' +
        (lit ? '✦ ' : '◦ ') +
        b.greek +
        ' &middot; ' +
        b.title +
        (lit ? ' (Kindled)' : ' (Optional)') +
        '</span>'
      );
    }).join('');

    const epigraphBlock = eleutheriaAwakened
      ? '<div class="stela-epigraph-crown">' +
        '<div style="font-size:0.68rem; text-transform:uppercase; letter-spacing:0.14em; color:#fde68a; font-weight:800;">' +
        '👑 Grand Eleutheria Illumination Awakened Across Phraxos' +
        '</div>' +
        '<div class="stela-epigraph-quote">“The masque is ended; the language is yours.”</div>' +
        '<div style="font-size:0.75rem; color:#e2e8f0;">' +
        'Maurice Conchis’s final inscription shines from the northern brink of Parnassus. Step back onto the terrace to behold the golden aurora crown arching above the Aegean.' +
        '</div>' +
        '</div>'
      : '';

    const sealUnlockCallout =
      litCount === 5 && !eleutheriaAwakened
        ? '<div style="margin-top:0.75rem; display:flex; justify-content:center;">' +
          '<button type="button" class="cta-primary" id="stela-ignite-seals-btn">' +
          '<span>🌅 All 5 Headland Seals Lit &mdash; Ignite Grand Eleutheria Illumination</span>' +
          '</button>' +
          '</div>'
        : '';

    const columnsHtml = SYNTHESIS_SLOTS.map((slot, cIdx) => {
      const selected = synthesisChoices[cIdx];
      const optsHtml = slot.options
        .map((opt, oIdx) => {
          const isSel = selected === oIdx;
          let stateCls = '';
          if (synthesisSolved && oIdx === slot.correctIdx) {
            stateCls = ' correct-choice';
          } else if (isSel && lastSynthesisStatus === 'bad' && oIdx !== slot.correctIdx) {
            stateCls = ' clash-choice';
          } else if (isSel) {
            stateCls = ' selected';
          }
          return (
            '<button type="button" class="stela-option-btn' +
            stateCls +
            '" data-syn-col="' +
            cIdx +
            '" data-syn-opt="' +
            oIdx +
            '">' +
            opt.text +
            '</button>'
          );
        })
        .join('');

      return (
        '<div class="stela-clause-col">' +
        '<div style="font-size:0.72rem; font-weight:800; color:#fde68a;">' +
        slot.role +
        '</div>' +
        '<div class="sanctuary-blueprint-tag" style="margin:0;">' +
        slot.blueprint +
        '</div>' +
        optsHtml +
        '</div>'
      );
    }).join('');

    const fbColor =
      lastSynthesisStatus === 'ok'
        ? '#6ee7b7'
        : lastSynthesisStatus === 'bad'
        ? '#fca5a5'
        : '#fde68a';

    card.innerHTML =
      '<div class="stela-header-row">' +
      '<div>' +
      '<div style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.13em; color:#38bdf8; font-weight:800;">' +
      'North Overlook of Parnassus (0, -101.5) &bull; Act VI Finale' +
      '</div>' +
      '<h2 id="eleutheria-stela-heading" style="font-family:var(--font-serif,Georgia,serif); font-size:1.48rem; color:#ffffff; margin-top:0.16rem;">' +
      '🏛️ The Sanctuary Stela of Eleutheria' +
      '</h2>' +
      '</div>' +
      '<div style="display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">' +
      '<span class="cipher-count-pill ' +
      (litCount === 5 ? 'all-lit' : '') +
      '">' +
      litCount +
      ' / 5 Seals Illuminated' +
      '</span>' +
      '<button type="button" class="cta-primary" id="stela-close-btn" style="padding:0.48rem 0.95rem; font-size:0.8rem;">' +
      '<span>Return to Parnassus &rarr;</span>' +
      '</button>' +
      '</div>' +
      '</div>' +
      '<p style="margin-top:0.55rem; font-size:0.82rem; line-height:1.52; color:#cbd5e1;">' +
      'Carved into Pentelic marble at the northern edge of Phraxos, this Classical Attic stela gathers the five syntactic seals of Maurice Conchis’s masque. Solving at least one truth on each of the five headlands &mdash; or completing the <strong>Final Unmasking Synthesis Challenge</strong> below &mdash; kindles the <strong>Grand Eleutheria Illumination</strong> across the island.' +
      '</p>' +
      '<div style="margin-top:0.5rem; display:flex; align-items:center; gap:0.45rem; flex-wrap:wrap;">' +
      bonusBadgesHtml +
      '</div>' +
      epigraphBlock +
      sealUnlockCallout +
      '<div class="stela-seals-list">' +
      sealsHtml +
      '</div>' +
      '<div class="stela-synthesis-box">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">' +
      '<div>' +
      '<div style="font-size:0.66rem; text-transform:uppercase; letter-spacing:0.11em; color:#fbbf24; font-weight:800;">' +
      'Interactive Keystone Workout &bull; C1/C2 Structural Synthesis' +
      '</div>' +
      '<h3 style="font-family:var(--font-serif,Georgia,serif); font-size:1.05rem; color:#fffbeb; margin-top:0.1rem;">' +
      '⚡ Final Unmasking Synthesis Challenge' +
      '</h3>' +
      '</div>' +
      '<div class="sanctuary-blueprint-tag">' +
      '[Only when + Clause + did + S + V] + [what + S + V + was not so much X as Y]' +
      '</div>' +
      '</div>' +
      '<p style="font-size:0.76rem; color:#cbd5e1; margin-top:0.3rem;">' +
      'Assemble Conchis’s parting sentence across all three marble slots, uniting delayed inversion, a nominal <em>what</em>-cleft, and contrastive <em>not so much X as Y</em>:' +
      '</p>' +
      '<div class="stela-clause-grid">' +
      columnsHtml +
      '</div>' +
      (lastSynthesisFeedback
        ? '<div style="margin-top:0.62rem; font-size:0.76rem; font-weight:700; line-height:1.45; color:' +
          fbColor +
          ';">' +
          lastSynthesisFeedback +
          '</div>'
        : '') +
      '<div style="margin-top:0.72rem; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:0.55rem;">' +
      '<button type="button" class="cta-primary" id="stela-verify-synthesis-btn" style="padding:0.52rem 1.15rem; font-size:0.8rem;">' +
      '<span>⚡ Inscribe Keystone &amp; Unmask Eleutheria</span>' +
      '</button>' +
      '<button type="button" class="reveal-cambridge-btn" id="stela-reveal-model-btn" style="width:auto; padding:0.46rem 0.88rem;">' +
      (synthesisModelVisible ? '🙈 Hide Cambridge Model' : '👁️ Reveal Cambridge Model') +
      '</button>' +
      '</div>' +
      '<div class="cambridge-model-reveal ' +
      (synthesisModelVisible ? 'visible' : '') +
      '" id="stela-cambridge-model-box">' +
      '<strong>✓ Cambridge Model:</strong> “' +
      SYNTHESIS_MODEL_SENTENCE +
      '”' +
      '<div style="font-size:0.72rem; color:#cbd5e1; margin-top:0.22rem;">' +
      'Three C1/C2 patterns work together effortlessly here: fronted <em>Only when</em> delays auxiliary inversion to the main clause (<em>did I realise</em>); <em>what Conchis had staged</em> acts as a singular nominal subject (<em>was</em>); and <em>not so much a trap as an open theatre</em> frames a crisp contrast without heavy vocabulary.' +
      '</div>' +
      '</div>' +
      '</div>';

    const closeBtn = document.getElementById('stela-close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeStelaModal);

    const igniteBtn = document.getElementById('stela-ignite-seals-btn');
    if (igniteBtn) {
      igniteBtn.addEventListener('click', () => {
        triggerGrandIllumination(savedCtx, 'seals');
        renderStelaModal();
        renderCipherStrip();
      });
    }

    card.querySelectorAll('[data-stela-jump]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-stela-jump'));
        if (!Number.isNaN(idx)) jumpToHeadlandFromUI(idx);
      });
    });

    card.querySelectorAll('[data-syn-col]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const col = Number(btn.getAttribute('data-syn-col'));
        const opt = Number(btn.getAttribute('data-syn-opt'));
        if (!Number.isNaN(col) && !Number.isNaN(opt)) {
          synthesisChoices[col] = opt;
          lastSynthesisFeedback = '';
          lastSynthesisStatus = 'neutral';
          saveFinaleState();
          if (savedCtx && typeof savedCtx.playChord === 'function') {
            savedCtx.playChord([330.0 + col * 55.0, 440.0 + opt * 40.0], 0.3);
          }
          renderStelaModal();
        }
      });
    });

    const verifyBtn = document.getElementById('stela-verify-synthesis-btn');
    if (verifyBtn) verifyBtn.addEventListener('click', evaluateSynthesisChallenge);

    const revealBtn = document.getElementById('stela-reveal-model-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        synthesisModelVisible = !synthesisModelVisible;
        if (savedCtx && typeof savedCtx.playChord === 'function') {
          savedCtx.playChord(synthesisModelVisible ? [440.0, 554.37, 659.25] : [330.0, 440.0], 0.4);
        }
        renderStelaModal();
      });
    }
  }

  // ==========================================================================
  // 3. MUSEUM-GRADE CLASSICAL ATTIC PENTELIC MARBLE STELA & SEAMLESS AURORA
  // ==========================================================================

  // Soft circular Gaussian + optional delicate star-glint sprite texture (zero square edges)
  function makeRadialStarSpriteTexture(THREE, withRays, warmTint) {
    const cnv = document.createElement('canvas');
    cnv.width = 128;
    cnv.height = 128;
    const g = cnv.getContext('2d');
    if (!g) return new THREE.CanvasTexture(cnv);

    g.clearRect(0, 0, 128, 128);

    const rad = g.createRadialGradient(64, 64, 0, 64, 64, 62);
    if (warmTint === 'aegean') {
      rad.addColorStop(0.0, 'rgba(255, 253, 240, 1.0)');
      rad.addColorStop(0.18, 'rgba(186, 230, 253, 0.82)');
      rad.addColorStop(0.48, 'rgba(56, 189, 248, 0.24)');
      rad.addColorStop(1.0, 'rgba(56, 189, 248, 0.0)');
    } else {
      rad.addColorStop(0.0, 'rgba(255, 253, 242, 1.0)');
      rad.addColorStop(0.18, 'rgba(253, 230, 138, 0.85)');
      rad.addColorStop(0.48, 'rgba(217, 155, 67, 0.25)');
      rad.addColorStop(1.0, 'rgba(217, 155, 67, 0.0)');
    }
    g.fillStyle = rad;
    g.fillRect(0, 0, 128, 128);

    if (withRays && typeof g.save === 'function') {
      g.save();
      g.translate(64, 64);
      for (let r = 0; r < 2; r++) {
        g.rotate((r * Math.PI) / 2);
        const rayGrad = g.createLinearGradient(-56, 0, 56, 0);
        rayGrad.addColorStop(0.0, 'rgba(255, 250, 220, 0.0)');
        rayGrad.addColorStop(0.42, 'rgba(253, 230, 138, 0.26)');
        rayGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.78)');
        rayGrad.addColorStop(0.58, 'rgba(253, 230, 138, 0.26)');
        rayGrad.addColorStop(1.0, 'rgba(255, 250, 220, 0.0)');
        g.fillStyle = rayGrad;
        g.fillRect(-56, -1.6, 112, 3.2);
      }
      g.restore();
    }

    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  // Procedural Attic Pentelic Marble Texture with subtle honey-ochre & dove-grey mineral veins
  function makePentelicMarbleTextures(THREE) {
    const cnv = document.createElement('canvas');
    cnv.width = 512;
    cnv.height = 512;
    const g = cnv.getContext('2d');

    const bumpCnv = document.createElement('canvas');
    bumpCnv.width = 512;
    bumpCnv.height = 512;
    const bg = bumpCnv.getContext('2d');

    if (g && bg) {
      const base = g.createLinearGradient(0, 0, 512, 512);
      base.addColorStop(0, '#f7f2e7');
      base.addColorStop(0.5, '#efe8d8');
      base.addColorStop(1, '#f4eee1');
      g.fillStyle = base;
      g.fillRect(0, 0, 512, 512);

      bg.fillStyle = '#808080';
      bg.fillRect(0, 0, 512, 512);

      // Soft warm Pentelic mineral veining
      for (let v = 0; v < 26; v++) {
        const yStart = (v * 23) % 512;
        if (typeof g.beginPath === 'function') {
          g.beginPath();
          bg.beginPath();
          g.moveTo(0, yStart);
          bg.moveTo(0, yStart);
          for (let x = 0; x <= 512; x += 32) {
            const wy =
              yStart +
              Math.sin(x * 0.014 + v * 1.7) * 24 +
              Math.cos(x * 0.031 - v * 0.9) * 11;
            g.lineTo(x, wy);
            bg.lineTo(x, wy);
          }
          g.strokeStyle =
            v % 3 === 0 ? 'rgba(202, 168, 118, 0.14)' : 'rgba(148, 155, 166, 0.11)';
          g.lineWidth = 1.2 + (v % 3) * 0.9;
          g.stroke();

          bg.strokeStyle = 'rgba(112, 112, 112, 0.22)';
          bg.lineWidth = 1.5;
          bg.stroke();
        }
      }
    }

    const map = new THREE.CanvasTexture(cnv);
    const bumpMap = new THREE.CanvasTexture(bumpCnv);
    if (THREE.RepeatWrapping) {
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      bumpMap.wrapS = THREE.RepeatWrapping;
      bumpMap.wrapT = THREE.RepeatWrapping;
    }
    map.needsUpdate = true;
    bumpMap.needsUpdate = true;
    return { map, bumpMap };
  }

  // Eleusinian dark blue-grey marble + inlaid bronze Greek key meander band for dado pedestal
  function makeDadoMeanderTexture(THREE) {
    const cnv = document.createElement('canvas');
    cnv.width = 512;
    cnv.height = 128;
    const g = cnv.getContext('2d');
    if (g) {
      const bg = g.createLinearGradient(0, 0, 0, 128);
      bg.addColorStop(0, '#1a2434');
      bg.addColorStop(0.5, '#222f42');
      bg.addColorStop(1, '#151d2b');
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 128);

      g.strokeStyle = '#c8913b';
      g.lineWidth = 3;
      g.strokeRect(4, 14, 504, 100);
      g.strokeRect(4, 22, 504, 84);

      // Classical Greek Meander (Key) Frieze Pattern
      if (typeof g.beginPath === 'function') {
        g.strokeStyle = 'rgba(232, 185, 102, 0.78)';
        g.lineWidth = 2.4;
        for (let x = 14; x < 492; x += 32) {
          g.beginPath();
          g.moveTo(x, 88);
          g.lineTo(x, 40);
          g.lineTo(x + 22, 40);
          g.lineTo(x + 22, 74);
          g.lineTo(x + 10, 74);
          g.lineTo(x + 10, 54);
          g.lineTo(x + 15, 54);
          g.stroke();
        }
      }
    }
    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  // Chiselled Pentelic Epistyle Frieze Plaque ("ΣΤΗΛΗ ΕΛΕΥΘΕΡΙΑΣ")
  function makeHeaderEntablatureTexture(THREE, allAwakened) {
    const cnv = document.createElement('canvas');
    cnv.width = 512;
    cnv.height = 112;
    const g = cnv.getContext('2d');
    if (g) {
      const grad = g.createLinearGradient(0, 0, 0, 112);
      if (allAwakened) {
        grad.addColorStop(0, '#3a2710');
        grad.addColorStop(0.5, '#261b0e');
        grad.addColorStop(1, '#162436');
      } else {
        grad.addColorStop(0, '#ebe3d1');
        grad.addColorStop(1, '#dcd1ba');
      }
      g.fillStyle = grad;
      g.fillRect(0, 0, 512, 112);

      g.strokeStyle = allAwakened ? '#fde68a' : '#9c7132';
      g.lineWidth = 5;
      g.strokeRect(5, 5, 502, 102);

      g.textAlign = 'center';
      g.fillStyle = allAwakened ? '#fde68a' : '#4a3314';
      g.font = 'bold 30px Georgia, serif';
      g.fillText('ΣΤΗΛΗ ΕΛΕΥΘΕΡΙΑΣ', 256, 52);

      g.fillStyle = allAwakened ? '#bae6fd' : '#6b532e';
      g.font = 'bold 15px Georgia, serif';
      g.fillText(
        allAwakened
          ? 'THE MASQUE IS ENDED · THE LANGUAGE IS YOURS'
          : 'NAISKOS OF THE FIVE SEALS · PARNASSUS OVERLOOK',
        256,
        85
      );
    }

    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  // Embossed Classical Bronze / Molten-Gold Relief Medallion Texture for each Seal (I–V)
  function makeSealMedallionReliefTexture(THREE, sealDef, isLit) {
    const cnv = document.createElement('canvas');
    cnv.width = 256;
    cnv.height = 256;
    const g = cnv.getContext('2d');
    if (g) {
      const cx = 128;
      const cy = 128;

      const bg = g.createRadialGradient(cx - 18, cy - 22, 8, cx, cy, 124);
      if (isLit) {
        bg.addColorStop(0.0, '#fffbeb');
        bg.addColorStop(0.28, '#fde68a');
        bg.addColorStop(0.66, '#d97706');
        bg.addColorStop(0.9, '#78350f');
        bg.addColorStop(1.0, '#451a03');
      } else {
        bg.addColorStop(0.0, '#6e563a');
        bg.addColorStop(0.55, '#463522');
        bg.addColorStop(0.88, '#2b2015');
        bg.addColorStop(1.0, '#1a130c');
      }
      g.fillStyle = bg;
      g.fillRect(0, 0, 256, 256);

      if (typeof g.beginPath === 'function') {
        // Outer beaded coin border & inner fillet ring
        g.strokeStyle = isLit ? '#fef3c7' : '#8c6d46';
        g.lineWidth = 6;
        g.beginPath();
        g.arc(cx, cy, 112, 0, Math.PI * 2);
        g.stroke();

        g.strokeStyle = isLit ? 'rgba(120, 53, 15, 0.65)' : 'rgba(18, 12, 8, 0.7)';
        g.lineWidth = 3;
        g.beginPath();
        g.arc(cx, cy, 96, 0, Math.PI * 2);
        g.stroke();

        // Bespoke Classical Attic Relief Emblem per Seal
        g.strokeStyle = isLit ? '#fffef5' : '#a88960';
        g.fillStyle = isLit ? '#fffbeb' : '#9c7c54';
        g.lineWidth = 5.5;
        g.lineCap = 'round';

        if (sealDef.motif === 'lyre') {
          // I. Apollo Sun-Burst & Kithara Horns
          for (let r = 0; r < 12; r++) {
            const a = (r / 12) * Math.PI * 2;
            g.beginPath();
            g.moveTo(cx + Math.cos(a) * 52, cy + Math.sin(a) * 52);
            g.lineTo(cx + Math.cos(a) * 76, cy + Math.sin(a) * 76);
            g.stroke();
          }
          g.beginPath();
          g.arc(cx, cy + 10, 30, 0.15 * Math.PI, 0.85 * Math.PI);
          g.stroke();
          g.beginPath();
          g.moveTo(cx - 26, cy + 22);
          g.quadraticCurveTo(cx - 34, cy - 28, cx - 16, cy - 42);
          g.moveTo(cx + 26, cy + 22);
          g.quadraticCurveTo(cx + 34, cy - 28, cx + 16, cy - 42);
          g.moveTo(cx - 24, cy - 30);
          g.lineTo(cx + 24, cy - 30);
          g.stroke();
        } else if (sealDef.motif === 'crescent') {
          // II. Artemis Crescent & Twin Crossed Pine Torches
          g.beginPath();
          g.arc(cx, cy - 6, 44, 0.2 * Math.PI, 1.8 * Math.PI);
          g.stroke();
          g.beginPath();
          g.moveTo(cx - 28, cy + 44);
          g.lineTo(cx + 24, cy - 36);
          g.moveTo(cx + 28, cy + 44);
          g.lineTo(cx - 24, cy - 36);
          g.stroke();
        } else if (sealDef.motif === 'wave') {
          // III. Deukalion Aegean Wave Scroll & Olive Sprig
          for (let w = -1; w <= 1; w++) {
            const wy = cy + w * 22;
            g.beginPath();
            g.moveTo(cx - 56, wy);
            g.bezierCurveTo(cx - 26, wy - 20, cx + 26, wy + 20, cx + 56, wy);
            g.stroke();
          }
        } else if (sealDef.motif === 'torch') {
          // IV. Mystes Sanctuary Flame & Unmasked Portal
          g.beginPath();
          g.moveTo(cx - 34, cy + 46);
          g.lineTo(cx - 34, cy - 24);
          g.arc(cx, cy - 24, 34, Math.PI, 0, false);
          g.lineTo(cx + 34, cy + 46);
          g.stroke();
          g.beginPath();
          g.moveTo(cx, cy + 40);
          g.lineTo(cx, cy - 8);
          g.moveTo(cx, cy - 36);
          g.quadraticCurveTo(cx + 18, cy - 16, cx, cy - 4);
          g.quadraticCurveTo(cx - 18, cy - 16, cx, cy - 36);
          g.stroke();
        } else {
          // V. Eleutheria Sovereign Laurel Wreath & Open Doorway
          for (let side = -1; side <= 1; side += 2) {
            g.beginPath();
            g.arc(
              cx,
              cy,
              56,
              side === -1 ? 0.58 * Math.PI : -0.42 * Math.PI,
              side === -1 ? 1.42 * Math.PI : 0.42 * Math.PI
            );
            g.stroke();
          }
          g.textAlign = 'center';
          g.font = 'bold 42px Georgia, serif';
          g.fillText('Ε', cx, cy + 15);
        }
      }

      // Roman numeral stamp at bottom of medallion
      g.textAlign = 'center';
      g.fillStyle = isLit ? '#451a03' : '#d6c5a9';
      g.font = 'bold 24px Georgia, serif';
      g.fillText(sealDef.roman, cx, 212);
    }

    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  // Chiselled Attic Marble & Molten-Gold Inscription Tablet Texture
  function makeSealPlaqueTexture(THREE, sealDef, isLit) {
    const cnv = document.createElement('canvas');
    cnv.width = 512;
    cnv.height = 144;
    const g = cnv.getContext('2d');
    if (g) {
      const bg = g.createLinearGradient(0, 0, 512, 144);
      if (isLit) {
        bg.addColorStop(0, '#2c1e0c');
        bg.addColorStop(0.55, '#1d2738');
        bg.addColorStop(1, '#3b250b');
      } else {
        bg.addColorStop(0, '#e8e0ce');
        bg.addColorStop(1, '#d5cab4');
      }
      g.fillStyle = bg;
      g.fillRect(0, 0, 512, 144);

      g.strokeStyle = isLit ? '#fbbf24' : '#8a6d43';
      g.lineWidth = isLit ? 4.5 : 3;
      g.strokeRect(5, 5, 502, 134);

      g.textAlign = 'left';
      g.fillStyle = isLit ? '#fde68a' : '#3e2b12';
      g.font = 'bold 26px Georgia, serif';
      g.fillText(sealDef.roman + ' · ' + sealDef.greek, 22, 42);

      g.textAlign = 'right';
      g.fillStyle = isLit ? '#fcd34d' : '#6b532e';
      g.font = 'bold 16px Georgia, serif';
      g.fillText(isLit ? '✦ ILLUMINATED' : '◇ UNSEALED', 490, 40);

      g.textAlign = 'left';
      g.fillStyle = isLit ? '#fffbeb' : '#47361f';
      g.font = 'italic 19px Georgia, serif';
      const snippet = sealDef.shortLine.split('·')[1]
        ? sealDef.shortLine.split('·')[1].trim()
        : sealDef.shortLine;
      g.fillText(snippet, 22, 84);

      g.fillStyle = isLit ? '#bae6fd' : '#6e5a3c';
      g.font = 'bold 15px system-ui, sans-serif';
      g.fillText(
        sealDef.headland.toUpperCase() + '  ·  ' + sealDef.mastery.toUpperCase(),
        22,
        118
      );
    }

    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  function makeBonusSignetTexture(THREE, bonusDef, isLit) {
    const cnv = document.createElement('canvas');
    cnv.width = 256;
    cnv.height = 256;
    const g = cnv.getContext('2d');
    if (g) {
      const grad = g.createRadialGradient(128, 128, 10, 128, 128, 122);
      if (isLit) {
        grad.addColorStop(0, '#fef3c7');
        grad.addColorStop(0.45, '#d99b43');
        grad.addColorStop(1, '#1e3a5f');
      } else {
        grad.addColorStop(0, '#4b3b28');
        grad.addColorStop(1, '#1f1912');
      }
      g.fillStyle = grad;
      g.fillRect(0, 0, 256, 256);

      if (typeof g.beginPath === 'function') {
        g.strokeStyle = isLit ? '#fde68a' : '#856a46';
        g.lineWidth = 6;
        g.beginPath();
        g.arc(128, 128, 110, 0, Math.PI * 2);
        g.stroke();
      }

      g.textAlign = 'center';
      g.fillStyle = isLit ? '#291504' : '#d6c5a9';
      g.font = 'bold 34px Georgia, serif';
      g.fillText(bonusDef.greek, 128, 118);

      g.font = 'bold 19px Georgia, serif';
      g.fillText(bonusDef.title.split(' ')[1] || bonusDef.title, 128, 154);

      g.font = 'bold 16px system-ui, sans-serif';
      g.fillStyle = isLit ? '#0c4a6e' : '#9c8669';
      g.fillText(isLit ? '✦ KINDLED' : '◦ DORMANT', 128, 186);
    }

    const tex = new THREE.CanvasTexture(cnv);
    tex.needsUpdate = true;
    return tex;
  }

  // Build extruded Classical Fluted Pilaster Shaft (symmetric front/back concave flutes)
  function createFlutedPilasterGeometry(THREE, width, depth, height) {
    if (typeof THREE.Shape !== 'function' || typeof THREE.ExtrudeGeometry !== 'function') {
      return new THREE.BoxGeometry(width, height, depth);
    }
    const hw = width * 0.5;
    const hd = depth * 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, -hd);

    // 5 concave flutes along the south (-y -> +Z) face
    const fluteCount = 5;
    const marginX = width * 0.1;
    const spanX = width - marginX * 2;
    const stepX = spanX / fluteCount;
    const fluteR = stepX * 0.38;

    shape.lineTo(-hw + marginX, -hd);
    for (let f = 0; f < fluteCount; f++) {
      const x0 = -hw + marginX + f * stepX;
      const cx = x0 + stepX * 0.5;
      shape.lineTo(cx - fluteR, -hd);
      shape.absarc(cx, -hd, fluteR, Math.PI, 0, true);
      shape.lineTo(x0 + stepX, -hd);
    }
    shape.lineTo(hw, -hd);

    // 3 flutes along the right (+x) lateral cheek
    const sideCount = 3;
    const marginZ = depth * 0.14;
    const spanZ = depth - marginZ * 2;
    const stepZ = spanZ / sideCount;
    const sideR = stepZ * 0.34;
    shape.lineTo(hw, -hd + marginZ);
    for (let s = 0; s < sideCount; s++) {
      const z0 = -hd + marginZ + s * stepZ;
      const cz = z0 + stepZ * 0.5;
      shape.lineTo(hw, cz - sideR);
      shape.absarc(hw, cz, sideR, -Math.PI * 0.5, Math.PI * 0.5, true);
      shape.lineTo(hw, z0 + stepZ);
    }
    shape.lineTo(hw, hd);

    // 5 symmetric flutes along the north (+y -> -Z) face
    shape.lineTo(hw - marginX, hd);
    for (let f = 0; f < fluteCount; f++) {
      const x0 = hw - marginX - f * stepX;
      const cx = x0 - stepX * 0.5;
      shape.lineTo(cx + fluteR, hd);
      shape.absarc(cx, hd, fluteR, 0, Math.PI, true);
      shape.lineTo(x0 - stepX, hd);
    }
    shape.lineTo(-hw, hd);

    // 3 flutes along the left (-x) lateral cheek
    shape.lineTo(-hw, hd - marginZ);
    for (let s = 0; s < sideCount; s++) {
      const z0 = hd - marginZ - s * stepZ;
      const cz = z0 - stepZ * 0.5;
      shape.lineTo(-hw, cz + sideR);
      shape.absarc(-hw, cz, sideR, Math.PI * 0.5, -Math.PI * 0.5, true);
      shape.lineTo(-hw, z0 - stepZ);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 8
    });
    if (typeof geo.rotateX === 'function') {
      geo.rotateX(-Math.PI * 0.5);
    }
    return geo;
  }

  // Build Classical Triangular Pediment Tympanum Geometry
  function createPedimentTympanumGeometry(THREE, spanWidth, peakHeight, depth) {
    if (typeof THREE.Shape !== 'function' || typeof THREE.ExtrudeGeometry !== 'function') {
      return new THREE.BoxGeometry(spanWidth, peakHeight, depth);
    }
    const hw = spanWidth * 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(0, peakHeight);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.018,
      bevelSegments: 2
    });
    if (typeof geo.translate === 'function') {
      geo.translate(0, 0, -depth * 0.5);
    }
    return geo;
  }

  // Build Carved Classical Attic Palmette (Anthemion) Acroterion Group
  function buildCarvedPalmetteAcroterion(THREE, matMarble, matBronze, scale, frondCount) {
    const palmette = new THREE.Group();

    // Acroterion plinth & double Ionic volute scroll calyx
    const baseBlock = new THREE.Mesh(
      new THREE.BoxGeometry(0.42 * scale, 0.09 * scale, 0.22 * scale),
      matMarble
    );
    baseBlock.position.y = 0.045 * scale;
    palmette.add(baseBlock);

    [-1, 1].forEach((dir) => {
      const volute = new THREE.Mesh(
        new THREE.CylinderGeometry(0.11 * scale, 0.11 * scale, 0.21 * scale, 18),
        matMarble
      );
      volute.rotation.x = Math.PI * 0.5;
      volute.position.set(dir * 0.16 * scale, 0.13 * scale, 0);
      palmette.add(volute);

      const eyeBoss = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055 * scale, 0.055 * scale, 0.23 * scale, 14),
        matBronze
      );
      eyeBoss.rotation.x = Math.PI * 0.5;
      eyeBoss.position.set(dir * 0.16 * scale, 0.13 * scale, 0);
      palmette.add(eyeBoss);
    });

    // Sculpted radiating Attic anthemion fronds (curved flame-tipped marble petals + gilt spine)
    const half = (frondCount - 1) * 0.5;
    for (let f = 0; f < frondCount; f++) {
      const norm = half > 0 ? (f - half) / half : 0; // -1 .. +1
      const absN = Math.abs(norm);
      const frondLen = (0.58 - absN * 0.24) * scale;
      const frondW = (0.078 - absN * 0.016) * scale;
      const splayAngle = -norm * 0.92;

      const frondPivot = new THREE.Group();
      frondPivot.position.set(norm * 0.075 * scale, 0.15 * scale, 0);
      frondPivot.rotation.z = splayAngle;

      if (typeof THREE.Shape === 'function' && typeof THREE.ExtrudeGeometry === 'function') {
        const pShape = new THREE.Shape();
        pShape.moveTo(-frondW * 0.45, 0);
        pShape.quadraticCurveTo(-frondW * 0.95, frondLen * 0.62, 0, frondLen);
        pShape.quadraticCurveTo(frondW * 0.95, frondLen * 0.62, frondW * 0.45, 0);
        pShape.closePath();

        const pGeo = new THREE.ExtrudeGeometry(pShape, {
          depth: 0.095 * scale,
          bevelEnabled: true,
          bevelThickness: 0.014 * scale,
          bevelSize: 0.012 * scale,
          bevelSegments: 2,
          curveSegments: 8
        });
        if (typeof pGeo.translate === 'function') {
          pGeo.translate(0, 0, -0.0475 * scale);
        }
        const petalMesh = new THREE.Mesh(pGeo, matMarble);
        frondPivot.add(petalMesh);
      } else {
        const fallbackPetal = new THREE.Mesh(
          new THREE.BoxGeometry(frondW, frondLen, 0.09 * scale),
          matMarble
        );
        fallbackPetal.position.y = frondLen * 0.5;
        frondPivot.add(fallbackPetal);
      }

      // Gilt bronze central midrib inlay along each palmette petal
      const spine = new THREE.Mesh(
        new THREE.BoxGeometry(frondW * 0.28, frondLen * 0.78, 0.125 * scale),
        matBronze
      );
      spine.position.y = frondLen * 0.42;
      frondPivot.add(spine);

      palmette.add(frondPivot);
    }

    return palmette;
  }

  // Merge non-indexed BufferGeometries into a single draw-call BufferGeometry
  function mergeNonIndexedGeometries(THREE, geos) {
    if (!geos || geos.length === 0) return null;
    if (geos.length === 1) return geos[0];

    let totalVerts = 0;
    const valid = [];
    for (let i = 0; i < geos.length; i++) {
      const g = geos[i];
      if (!g || !g.attributes || !g.attributes.position) continue;
      const count = g.attributes.position.count;
      if (!count || count <= 0) continue;
      if (!g.attributes.normal && typeof g.computeVertexNormals === 'function') {
        g.computeVertexNormals();
      }
      totalVerts += count;
      valid.push(g);
    }

    if (valid.length === 0 || totalVerts === 0) return null;
    if (typeof THREE.BufferGeometry !== 'function' || typeof THREE.BufferAttribute !== 'function') {
      return valid[0];
    }

    const posArr = new Float32Array(totalVerts * 3);
    const normArr = new Float32Array(totalVerts * 3);
    const uvArr = new Float32Array(totalVerts * 2);

    let vOffset = 0;
    for (let i = 0; i < valid.length; i++) {
      const g = valid[i];
      const count = g.attributes.position.count;
      const pSrc = g.attributes.position.array;
      posArr.set(pSrc.subarray(0, count * 3), vOffset * 3);

      if (g.attributes.normal && g.attributes.normal.array) {
        const nSrc = g.attributes.normal.array;
        normArr.set(nSrc.subarray(0, count * 3), vOffset * 3);
      } else {
        for (let k = 0; k < count; k++) {
          normArr[(vOffset + k) * 3 + 2] = 1.0;
        }
      }

      if (g.attributes.uv && g.attributes.uv.array) {
        const uSrc = g.attributes.uv.array;
        uvArr.set(uSrc.subarray(0, count * 2), vOffset * 2);
      }

      vOffset += count;
      if (typeof g.dispose === 'function') g.dispose();
    }

    const merged = new THREE.BufferGeometry();
    const setAttr = merged.setAttribute || merged.addAttribute;
    if (typeof setAttr === 'function') {
      setAttr.call(merged, 'position', new THREE.BufferAttribute(posArr, 3));
      setAttr.call(merged, 'normal', new THREE.BufferAttribute(normArr, 3));
      setAttr.call(merged, 'uv', new THREE.BufferAttribute(uvArr, 2));
    }
    if (typeof merged.computeBoundingSphere === 'function') merged.computeBoundingSphere();
    if (typeof merged.computeBoundingBox === 'function') merged.computeBoundingBox();
    return merged;
  }

  function bakeMeshListToMergedMesh(THREE, meshList, material, castShadow, receiveShadow) {
    if (!meshList || meshList.length === 0) return null;
    const sampleGeo = meshList[0].geometry;
    if (
      !sampleGeo ||
      !sampleGeo.attributes ||
      !sampleGeo.attributes.position ||
      typeof sampleGeo.clone !== 'function'
    ) {
      const fallbackMesh = new THREE.Mesh(sampleGeo, material);
      fallbackMesh.castShadow = Boolean(castShadow);
      fallbackMesh.receiveShadow = Boolean(receiveShadow);
      return fallbackMesh;
    }

    const baked = [];
    for (let i = 0; i < meshList.length; i++) {
      const m = meshList[i];
      if (!m || !m.geometry) continue;
      let g = m.geometry.clone();
      if (g.index && typeof g.toNonIndexed === 'function') {
        const expanded = g.toNonIndexed();
        if (typeof g.dispose === 'function') g.dispose();
        g = expanded;
      }
      if (typeof g.applyMatrix4 === 'function' && m.matrixWorld) {
        g.applyMatrix4(m.matrixWorld);
      }
      baked.push(g);
    }

    const mergedGeo = mergeNonIndexedGeometries(THREE, baked);
    if (!mergedGeo) return null;
    const outMesh = new THREE.Mesh(mergedGeo, material);
    outMesh.castShadow = Boolean(castShadow);
    outMesh.receiveShadow = Boolean(receiveShadow);
    return outMesh;
  }

  function bakeStaticStageByMaterial(THREE, stageGroup, targetRoot, shadowMats) {
    if (typeof stageGroup.updateMatrixWorld === 'function') {
      stageGroup.updateMatrixWorld(true);
    }
    const buckets = new Map();
    const sourceGeos = new Set();

    function walk(node) {
      if (!node) return;
      if (node.geometry && node.material) {
        let arr = buckets.get(node.material);
        if (!arr) {
          arr = [];
          buckets.set(node.material, arr);
        }
        arr.push(node);
        sourceGeos.add(node.geometry);
      }
      if (Array.isArray(node.children)) {
        for (let c = 0; c < node.children.length; c++) {
          walk(node.children[c]);
        }
      }
    }
    walk(stageGroup);

    buckets.forEach((meshList, mat) => {
      const castSh = Boolean(shadowMats && shadowMats.has(mat));
      const mergedMesh = bakeMeshListToMergedMesh(THREE, meshList, mat, castSh, true);
      if (mergedMesh) {
        targetRoot.add(mergedMesh);
      }
    });

    sourceGeos.forEach((srcG) => {
      if (srcG && typeof srcG.dispose === 'function') {
        srcG.dispose();
      }
    });
  }

  function mergeMeshPair(THREE, meshA, meshB, material) {
    const pairStage = new THREE.Group();
    pairStage.add(meshA);
    pairStage.add(meshB);
    if (typeof pairStage.updateMatrixWorld === 'function') {
      pairStage.updateMatrixWorld(true);
    }
    const merged = bakeMeshListToMergedMesh(THREE, [meshA, meshB], material, false, true);
    if (meshA.geometry && typeof meshA.geometry.dispose === 'function') meshA.geometry.dispose();
    if (
      meshB.geometry &&
      meshB.geometry !== meshA.geometry &&
      typeof meshB.geometry.dispose === 'function'
    ) {
      meshB.geometry.dispose();
    }
    return merged || meshA;
  }

  function buildStelaAndAurora3D(ctx) {
    if (!ctx || !ctx.THREE || !ctx.scene) return;
    const THREE = ctx.THREE;
    const scene = ctx.scene;
    const interactables = ctx.interactables || [];

    const root = new THREE.Group();
    root.name = 'PhraxosNarrativeStela';
    root.userData = {
      phraxosModule: 'PhraxosNarrative',
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    };
    root.position.set(0, 0.48, -101.5);
    scene.add(root);
    stela3D.root = root;

    // Staging group for non-interactive static architectural stonework & bronze trim
    const staticStage = new THREE.Group();

    const marbleMaps = makePentelicMarbleTextures(THREE);
    const matPentelic = new THREE.MeshStandardMaterial({
      color: 0xf7f3ea,
      emissive: 0x241a0c,
      emissiveIntensity: 0.06,
      map: marbleMaps.map,
      bumpMap: marbleMaps.bumpMap,
      bumpScale: 0.012,
      roughness: 0.34,
      metalness: 0.05
    });
    const matRecessedMarble = new THREE.MeshStandardMaterial({
      color: 0xe6dfd0,
      emissive: 0x1e1509,
      emissiveIntensity: 0.05,
      map: marbleMaps.map,
      bumpMap: marbleMaps.bumpMap,
      bumpScale: 0.015,
      roughness: 0.42,
      metalness: 0.06
    });
    const matAtticBronze = new THREE.MeshStandardMaterial({
      color: 0x7c5a32,
      roughness: 0.33,
      metalness: 0.82
    });
    const matGiltBronze = new THREE.MeshStandardMaterial({
      color: 0xd99b43,
      emissive: 0x3b1804,
      emissiveIntensity: 0.18,
      roughness: 0.25,
      metalness: 0.86
    });
    const matDadoMeander = new THREE.MeshStandardMaterial({
      map: makeDadoMeanderTexture(THREE),
      roughness: 0.38,
      metalness: 0.28
    });

    const softGlowTex = makeRadialStarSpriteTexture(THREE, false, 'gold');
    const starRayTex = makeRadialStarSpriteTexture(THREE, true, 'gold');
    const starAegeanTex = makeRadialStarSpriteTexture(THREE, true, 'aegean');

    function registerStelaMesh(mesh, extraData, castShadow) {
      mesh.userData = Object.assign({ interactType: 'narrative_stela' }, extraData || {});
      mesh.castShadow = Boolean(castShadow);
      mesh.receiveShadow = true;
      interactables.push(mesh);
      return mesh;
    }

    // ------------------------------------------------------------------------
    // 1. THREE-STEPPED ATTIC CREPIDOMA PLINTH & MEANDER DADO
    // ------------------------------------------------------------------------
    const stepSpecs = [
      { w: 2.94, h: 0.14, d: 1.66, y: 0.07 },
      { w: 2.62, h: 0.14, d: 1.40, y: 0.21 },
      { w: 2.32, h: 0.16, d: 1.16, y: 0.36 }
    ];
    stepSpecs.forEach((st) => {
      const stepMesh = new THREE.Mesh(new THREE.BoxGeometry(st.w, st.h, st.d), matPentelic);
      stepMesh.position.y = st.y;
      staticStage.add(stepMesh);
    });

    // Moulded Attic Base Torus & Eleusinian Dado Pedestal
    const dadoBaseMoulding = new THREE.Mesh(
      new THREE.BoxGeometry(2.18, 0.09, 1.04),
      matPentelic
    );
    dadoBaseMoulding.position.y = 0.485;
    staticStage.add(dadoBaseMoulding);

    const dadoCore = registerStelaMesh(
      new THREE.Mesh(new THREE.BoxGeometry(2.04, 0.42, 0.92), matDadoMeander),
      { part: 'dado' },
      true
    );
    dadoCore.position.y = 0.74;
    root.add(dadoCore);

    const dadoCrownLedge = new THREE.Mesh(
      new THREE.BoxGeometry(2.22, 0.1, 1.08),
      matPentelic
    );
    dadoCrownLedge.position.y = 1.00;
    staticStage.add(dadoCrownLedge);

    const dadoBronzeFillet = new THREE.Mesh(
      new THREE.BoxGeometry(2.25, 0.035, 1.10),
      matGiltBronze
    );
    dadoBronzeFillet.position.y = 1.055;
    staticStage.add(dadoBronzeFillet);

    // 2 Recessed Circular Bronze Contraption Signets on Dado Front (Armillary & Harpsichord)
    [-0.74, 0.74].forEach((bx, bIdx) => {
      const bDef = BONUS_DEFS[bIdx];
      const bezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.155, 0.024, 12, 28),
        matGiltBronze
      );
      bezel.position.set(bx, 0.74, 0.47);
      staticStage.add(bezel);

      const signetMat = new THREE.MeshStandardMaterial({
        map: makeBonusSignetTexture(THREE, bDef, false),
        roughness: 0.3,
        metalness: 0.62
      });
      const signetDisc = registerStelaMesh(
        new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.036, 28), signetMat),
        { part: 'bonus_signet', machineId: bDef.machineId },
        false
      );
      signetDisc.rotation.x = Math.PI * 0.5;
      signetDisc.position.set(bx, 0.74, 0.46);
      root.add(signetDisc);
      stela3D.bonusMeshes[bDef.machineId] = signetDisc;
    });

    // ------------------------------------------------------------------------
    // 2. RECESSED NAISKOS STELE SLAB & FLUTED ATTIC PILASTER JAMBS
    // ------------------------------------------------------------------------
    // Keep 12-tri central shaft clickable so eye-level reticle clicks between plaques always register
    const steleSlab = registerStelaMesh(
      new THREE.Mesh(new THREE.BoxGeometry(1.56, 2.86, 0.44), matRecessedMarble),
      { part: 'shaft' },
      true
    );
    steleSlab.position.y = 2.49;
    root.add(steleSlab);

    // Architectural bronze margin frame & fluted Pentelic pilasters (merged into static batch)
    const pilasterGeo = createFlutedPilasterGeometry(THREE, 0.31, 0.58, 2.52);

    [-0.89, 0.89].forEach((jx) => {
      // Attic Ionic Pilaster Base (plinth + double torus)
      const pPlinth = new THREE.Mesh(
        new THREE.BoxGeometry(0.39, 0.08, 0.66),
        matPentelic
      );
      pPlinth.position.set(jx, 1.10, 0);
      staticStage.add(pPlinth);

      const pTorus = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.07, 0.62),
        matGiltBronze
      );
      pTorus.position.set(jx, 1.175, 0);
      staticStage.add(pTorus);

      // True Fluted Pentelic Marble Pilaster Jamb
      const jambMesh = new THREE.Mesh(pilasterGeo, matPentelic);
      jambMesh.position.set(jx, 1.21, 0);
      staticStage.add(jambMesh);

      // Sculpted Anta / Ionic Volute Capital
      const necking = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.045, 0.62),
        matGiltBronze
      );
      necking.position.set(jx, 3.75, 0);
      staticStage.add(necking);

      const echinus = new THREE.Mesh(
        new THREE.BoxGeometry(0.41, 0.09, 0.66),
        matPentelic
      );
      echinus.position.set(jx, 3.815, 0);
      staticStage.add(echinus);

      // Twin carved Ionic volute scrolls flanking each pilaster capital
      [-0.19, 0.19].forEach((vx) => {
        const voluteRoll = new THREE.Mesh(
          new THREE.CylinderGeometry(0.068, 0.068, 0.68, 16),
          matPentelic
        );
        voluteRoll.rotation.x = Math.PI * 0.5;
        voluteRoll.position.set(jx + vx, 3.82, 0);
        staticStage.add(voluteRoll);

        const voluteEye = new THREE.Mesh(
          new THREE.CylinderGeometry(0.032, 0.032, 0.70, 12),
          matGiltBronze
        );
        voluteEye.rotation.x = Math.PI * 0.5;
        voluteEye.position.set(jx + vx, 3.82, 0);
        staticStage.add(voluteEye);
      });

      const abacus = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.065, 0.70),
        matPentelic
      );
      abacus.position.set(jx, 3.89, 0);
      staticStage.add(abacus);
    });

    // ------------------------------------------------------------------------
    // 3. CLASSICAL EPISTYLE, TRIANGULAR PEDIMENT & CARVED PALMETTE ACROTERIA
    // ------------------------------------------------------------------------
    const epistyleLower = new THREE.Mesh(
      new THREE.BoxGeometry(2.22, 0.14, 0.72),
      matPentelic
    );
    epistyleLower.position.y = 3.99;
    staticStage.add(epistyleLower);

    const taeniaBand = new THREE.Mesh(
      new THREE.BoxGeometry(2.28, 0.042, 0.76),
      matGiltBronze
    );
    taeniaBand.position.y = 4.08;
    staticStage.add(taeniaBand);

    const friezeBlock = new THREE.Mesh(
      new THREE.BoxGeometry(2.18, 0.24, 0.68),
      matPentelic
    );
    friezeBlock.position.y = 4.22;
    staticStage.add(friezeBlock);

    const headerMat = new THREE.MeshStandardMaterial({
      map: makeHeaderEntablatureTexture(THREE, false),
      emissive: 0x000000,
      emissiveIntensity: 0.0,
      roughness: 0.34,
      metalness: 0.2
    });
    const headerPlaque = registerStelaMesh(
      new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.21, 0.05), headerMat),
      { part: 'entablature' },
      false
    );
    headerPlaque.position.set(0, 4.22, 0.345);
    root.add(headerPlaque);
    stela3D.headerPlaque = headerPlaque;

    // Horizontal Geison Cornice Shelf
    const geisonShelf = new THREE.Mesh(
      new THREE.BoxGeometry(2.44, 0.085, 0.86),
      matPentelic
    );
    geisonShelf.position.y = 4.38;
    staticStage.add(geisonShelf);

    // Triangular Recessed Tympanum Field
    const tympanumGeo = createPedimentTympanumGeometry(THREE, 2.26, 0.50, 0.64);
    const tympanumMesh = new THREE.Mesh(tympanumGeo, matRecessedMarble);
    tympanumMesh.position.y = 4.41;
    staticStage.add(tympanumMesh);

    // Raking Sima Cornice Gables (Left & Right Slopes meeting cleanly at Pediment Apex)
    const slopeHalfSpan = 1.24;
    const slopeRise = 0.54;
    const slopeLen = Math.hypot(slopeHalfSpan, slopeRise);
    const slopeAngle = Math.atan2(slopeRise, slopeHalfSpan);

    [-1, 1].forEach((side) => {
      const rakingGroup = new THREE.Group();
      rakingGroup.position.set(
        side * (slopeHalfSpan * 0.5 - 0.02),
        4.41 + slopeRise * 0.5,
        0
      );
      rakingGroup.rotation.z = -side * slopeAngle;

      const rakingMarble = new THREE.Mesh(
        new THREE.BoxGeometry(slopeLen + 0.08, 0.085, 0.88),
        matPentelic
      );
      rakingGroup.add(rakingMarble);

      const rakingBronze = new THREE.Mesh(
        new THREE.BoxGeometry(slopeLen + 0.09, 0.028, 0.90),
        matGiltBronze
      );
      rakingBronze.position.y = -0.05;
      rakingGroup.add(rakingBronze);

      staticStage.add(rakingGroup);
    });

    // Sculpted Bronze Tympanum Rosette Shield in the centre of the Pediment
    const tympanumShieldMat = new THREE.MeshStandardMaterial({
      map: makeSealMedallionReliefTexture(THREE, SEAL_DEFS[4], false),
      emissive: 0x451a03,
      emissiveIntensity: 0.15,
      roughness: 0.28,
      metalness: 0.84
    });
    stela3D.tympanumShieldMat = tympanumShieldMat;

    const tympanumBezel = new THREE.Mesh(
      new THREE.TorusGeometry(0.155, 0.022, 12, 28),
      matGiltBronze
    );
    tympanumBezel.position.set(0, 4.60, 0.34);
    staticStage.add(tympanumBezel);

    const tympanumShield = registerStelaMesh(
      new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.145, 0.04, 28), tympanumShieldMat),
      { part: 'pediment_shield' },
      false
    );
    tympanumShield.rotation.x = Math.PI * 0.5;
    tympanumShield.position.set(0, 4.60, 0.33);
    root.add(tympanumShield);

    // Central Carved Attic Palmette Acroterion + Flanking Corner Palmette Acroteria
    const apexPalmette = buildCarvedPalmetteAcroterion(
      THREE,
      matPentelic,
      matGiltBronze,
      1.05,
      9
    );
    apexPalmette.position.set(0, 4.94, 0);
    staticStage.add(apexPalmette);

    [-1.14, 1.14].forEach((ax, aIdx) => {
      const cornerPalmette = buildCarvedPalmetteAcroterion(
        THREE,
        matPentelic,
        matGiltBronze,
        0.54,
        5
      );
      cornerPalmette.position.set(ax, 4.42, 0);
      cornerPalmette.rotation.z = aIdx === 0 ? 0.12 : -0.12;
      staticStage.add(cornerPalmette);
    });

    // Subtle soft radial golden aura behind the Apex Palmette Acroterion
    if (typeof THREE.Sprite === 'function' && typeof THREE.SpriteMaterial === 'function') {
      const acroGlowMat = new THREE.SpriteMaterial({
        map: softGlowTex,
        color: 0xfde68a,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const acroGlow = new THREE.Sprite(acroGlowMat);
      acroGlow.position.set(0, 5.26, -0.05);
      acroGlow.scale.set(1.65, 1.65, 1);
      root.add(acroGlow);
      stela3D.acroterionGlowSprite = acroGlow;
    }

    // ------------------------------------------------------------------------
    // 4. FIVE RECESSED BRONZE-FRAMED SEAL MEDALLIONS & CHISELLED RELIEF TABLETS
    // ------------------------------------------------------------------------
    stela3D.plaqueMeshes = [];
    stela3D.medallionMeshes = [];
    stela3D.medallionHaloSprites = [];
    stela3D.bezelMats = [];

    for (let i = 0; i < 5; i++) {
      const yPos = 3.46 - i * 0.51;

      // Recessed bronze coffer frame recessed into the Pentelic slab (+Z = 0.22)
      const cofferBack = new THREE.Mesh(
        new THREE.BoxGeometry(1.42, 0.42, 0.03),
        matAtticBronze
      );
      cofferBack.position.set(0, yPos, 0.215);
      staticStage.add(cofferBack);

      // Top & bottom moulded bronze coffer rails
      [-0.205, 0.205].forEach((dy) => {
        const hRail = new THREE.Mesh(
          new THREE.BoxGeometry(1.45, 0.026, 0.065),
          matAtticBronze
        );
        hRail.position.set(0, yPos + dy, 0.235);
        staticStage.add(hRail);
      });
      // Left, divider & right vertical bronze jambs
      [-0.71, -0.25, 0.71].forEach((dx) => {
        const vRail = new THREE.Mesh(
          new THREE.BoxGeometry(0.026, 0.42, 0.065),
          matAtticBronze
        );
        vRail.position.set(dx, yPos, 0.235);
        staticStage.add(vRail);
      });

      // Left Circular Bronze-Framed Embossed Seal Medallion (south + north faces merged per seal)
      const bezelMat = new THREE.MeshStandardMaterial({
        color: 0x8a6436,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        roughness: 0.26,
        metalness: 0.86
      });
      stela3D.bezelMats.push(bezelMat);

      const medBezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.162, 0.022, 12, 32),
        bezelMat
      );
      medBezel.position.set(-0.48, yPos, 0.248);

      const rearBezel = new THREE.Mesh(
        new THREE.TorusGeometry(0.14, 0.018, 10, 24),
        bezelMat
      );
      rearBezel.position.set(0, yPos, -0.23);

      root.add(mergeMeshPair(THREE, medBezel, rearBezel, bezelMat));

      const medTex = makeSealMedallionReliefTexture(THREE, SEAL_DEFS[i], false);
      const medMat = new THREE.MeshStandardMaterial({
        map: medTex,
        bumpMap: medTex,
        bumpScale: 0.022,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        roughness: 0.3,
        metalness: 0.78
      });

      const frontMed = new THREE.Mesh(
        new THREE.CylinderGeometry(0.152, 0.152, 0.036, 32),
        medMat
      );
      frontMed.rotation.x = Math.PI * 0.5;
      frontMed.position.set(-0.48, yPos, 0.24);

      const rearMedallion = new THREE.Mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.03, 24),
        medMat
      );
      rearMedallion.rotation.x = -Math.PI * 0.5;
      rearMedallion.position.set(0, yPos, -0.225);

      const medallionMesh = registerStelaMesh(
        mergeMeshPair(THREE, frontMed, rearMedallion, medMat),
        { part: 'seal_medallion', sealIdx: i },
        false
      );
      root.add(medallionMesh);
      stela3D.medallionMeshes.push(medallionMesh);

      // Soft warm radial molten-gold glow sprite behind lit medallion (hidden when unlit)
      if (typeof THREE.Sprite === 'function' && typeof THREE.SpriteMaterial === 'function') {
        const haloMat = new THREE.SpriteMaterial({
          map: softGlowTex,
          color: 0xfbbf24,
          transparent: true,
          opacity: 0.0,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const haloSprite = new THREE.Sprite(haloMat);
        haloSprite.position.set(-0.48, yPos, 0.27);
        haloSprite.scale.set(0.68, 0.68, 1);
        haloSprite.visible = false;
        root.add(haloSprite);
        stela3D.medallionHaloSprites.push(haloSprite);
      }

      // Right Chiselled Attic Inscription Tablet
      const pTex = makeSealPlaqueTexture(THREE, SEAL_DEFS[i], false);
      const pMat = new THREE.MeshStandardMaterial({
        map: pTex,
        bumpMap: pTex,
        bumpScale: 0.008,
        emissive: 0x000000,
        emissiveIntensity: 0.0,
        roughness: 0.34,
        metalness: 0.18
      });
      const plaque = registerStelaMesh(
        new THREE.Mesh(new THREE.BoxGeometry(0.91, 0.35, 0.038), pMat),
        { part: 'seal_plaque', sealIdx: i },
        false
      );
      plaque.position.set(0.225, yPos, 0.236);
      root.add(plaque);
      stela3D.plaqueMeshes.push(plaque);
    }

    // Bake ~110 static stonework & bronze trim parts into 4 single-material BufferGeometries
    bakeStaticStageByMaterial(
      THREE,
      staticStage,
      root,
      new Set([matPentelic, matRecessedMarble])
    );

    // Zero-ALU Warm Radial Ambient Glow Sprite (replaces PointLight to eliminate PBR shader bloat)
    if (typeof THREE.Sprite === 'function' && typeof THREE.SpriteMaterial === 'function') {
      const ambientGlowMat = new THREE.SpriteMaterial({
        map: softGlowTex,
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const ambientGlow = new THREE.Sprite(ambientGlowMat);
      ambientGlow.position.set(0, 2.68, 0.52);
      ambientGlow.scale.set(3.45, 4.25, 1);
      root.add(ambientGlow);
      stela3D.stelaAmbientGlowSprite = ambientGlow;
    }

    // ------------------------------------------------------------------------
    // 5. SEAMLESS GRAND ELEUTHERIA AURORA CROWN & SOFT RADIAL STAR SPRITES
    // ------------------------------------------------------------------------
    const auroraGroup = new THREE.Group();
    auroraGroup.name = 'PhraxosNarrativeAurora';
    auroraGroup.userData = {
      phraxosModule: 'PhraxosNarrative',
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    };
    auroraGroup.position.set(0, 0.48, -101.5);
    auroraGroup.visible = false;
    scene.add(auroraGroup);
    stela3D.auroraGroup = auroraGroup;
    ctx.narrativeGroups = [root, auroraGroup];

    // 5A. Seamless Volumetric Fresnel Sky-Shafts (dissolve silkily on all sides & ends)
    const shaftUniforms = {
      uTime: { value: 0 },
      uIntensity: { value: 1.0 }
    };
    stela3D.shaftUniforms = shaftUniforms;

    const volumetricShaftMat = new THREE.ShaderMaterial({
      uniforms: shaftUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vLocalPos;',
        'varying vec3 vViewNormal;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vUv = uv;',
        '  vLocalPos = position;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  vViewNormal = normalize(normalMatrix * normal);',
        '  vViewDir = normalize(-mvPos.xyz);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uIntensity;',
        'varying vec2 vUv;',
        'varying vec3 vLocalPos;',
        'varying vec3 vViewNormal;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  // Exact 2*PI periodic angle around cylinder axis -> zero UV seam!',
        '  float theta = atan(vLocalPos.x, vLocalPos.z);',
        '  float filaments = 0.72 + 0.28 * sin(theta * 5.0 + uTime * 0.95 - vUv.y * 5.0)',
        '                                * cos(theta * 3.0 - uTime * 0.65 + vUv.y * 3.5);',
        '  // View-angle Fresnel silhouette dissolution -> zero cylinder edge lines!',
        '  float ndv = abs(dot(normalize(vViewNormal), normalize(vViewDir)));',
        '  float edgeDissolve = pow(clamp(ndv, 0.0001, 1.0), 2.75);',
        '  // Silky smooth vertical fade at base and skyward crown -> zero cap cuts!',
        '  float topFade = max(1.0 - smoothstep(0.28, 1.0, vUv.y), 0.0001);',
        '  float vertDissolve = smoothstep(0.0, 0.22, vUv.y) * pow(topFade, 1.65);',
        '  float alpha = edgeDissolve * vertDissolve * filaments * 0.42 * uIntensity;',
        '  if (alpha < 0.004) discard;',
        '  vec3 warmCore = vec3(1.0, 0.95, 0.78);',
        '  vec3 moltenGold = vec3(0.98, 0.74, 0.28);',
        '  vec3 skyTint = vec3(0.38, 0.82, 0.98);',
        '  vec3 col = mix(moltenGold, warmCore, edgeDissolve * 0.65);',
        '  col = mix(col, skyTint, smoothstep(0.45, 0.95, vUv.y) * 0.45);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });

    [
      { rTop: 2.6, rBot: 0.95, h: 42.0, y: 22.8 },
      { rTop: 4.8, rBot: 1.75, h: 46.0, y: 24.5 }
    ].forEach((sCfg) => {
      const shaftMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(sCfg.rTop, sCfg.rBot, sCfg.h, 48, 16, true),
        volumetricShaftMat
      );
      shaftMesh.position.set(0, sCfg.y, -0.15);
      auroraGroup.add(shaftMesh);
    });

    // 5B. Seamless 360°-Periodic Undulating Aegean Aurora Curtains (zero cylinder/plane seams!)
    const auroraUniforms = {
      uTime: { value: 0 }
    };
    stela3D.auroraUniforms = auroraUniforms;

    const auroraMat = new THREE.ShaderMaterial({
      uniforms: auroraUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'varying vec3 vBaseLocal;',
        'varying vec3 vViewNormal;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vUv = uv;',
        '  vBaseLocal = position;',
        '  // Strictly integer angular harmonics around theta -> 100% seamless loop!',
        '  float theta = atan(position.x, position.z);',
        '  float hFade = sin(clamp(uv.y, 0.0, 1.0) * 3.14159265);',
        '  float radialWave = (sin(theta * 4.0 + uTime * 0.72) * 1.45',
        '                    + cos(theta * 7.0 - uTime * 1.08) * 0.75) * hFade;',
        '  vec2 radDir = normalize(vec2(position.x, position.z) + vec2(0.0001));',
        '  vec3 displaced = position;',
        '  displaced.x += radDir.x * radialWave;',
        '  displaced.z += radDir.y * radialWave;',
        '  displaced.y += sin(theta * 3.0 - uTime * 0.55) * 0.95 * hFade;',
        '  vec4 mvPos = modelViewMatrix * vec4(displaced, 1.0);',
        '  vViewNormal = normalize(normalMatrix * normal);',
        '  vViewDir = normalize(-mvPos.xyz);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'varying vec3 vBaseLocal;',
        'varying vec3 vViewNormal;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  float theta = atan(vBaseLocal.x, vBaseLocal.z);',
        '  // Seamless integer-harmonic draperyfolds around the sky dome',
        '  float folds = 0.52 + 0.48 * sin(theta * 9.0 + uTime * 1.25 - vUv.y * 2.4)',
        '                            * cos(theta * 5.0 - uTime * 0.85 + vUv.y * 1.8);',
        '  float fineShimmer = 0.76 + 0.24 * sin(theta * 16.0 - uTime * 1.9 + vUv.y * 4.0);',
        '  // Silky horizontal azimuth envelope (softly accentuates the northern Parnassus horizon)',
        '  float northWeight = 0.45 + 0.55 * smoothstep(-0.85, 0.85, -cos(theta));',
        '  // Silky vertical Gaussian-sine dissolution at both lower & upper curtain rims',
        '  float vBell = sin(clamp(vUv.y, 0.0, 1.0) * 3.14159265);',
        '  float vertEnvelope = pow(max(vBell, 0.0001), 2.35);',
        '  // Grazing view-angle softening so side silhouettes melt into night/dusk air',
        '  float ndv = abs(dot(normalize(vViewNormal), normalize(vViewDir)));',
        '  float viewSoft = pow(clamp(ndv, 0.0001, 1.0), 1.35);',
        '  float alpha = clamp(folds * fineShimmer * northWeight * vertEnvelope * viewSoft * 0.48, 0.0, 0.62);',
        '  if (alpha < 0.004) discard;',
        '  vec3 moltenGold = vec3(1.0, 0.80, 0.30);',
        '  vec3 ivoryCrown = vec3(1.0, 0.96, 0.82);',
        '  vec3 aegeanCyan = vec3(0.20, 0.78, 0.96);',
        '  vec3 col = mix(moltenGold, aegeanCyan, smoothstep(0.28, 0.88, vUv.y));',
        '  col = mix(col, ivoryCrown, smoothstep(0.55, 0.95, folds) * 0.48);',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });

    [
      { rTop: 21.0, rBot: 16.5, h: 15.0, y: 18.5, zOff: 10.0 },
      { rTop: 33.0, rBot: 26.0, h: 18.5, y: 23.5, zOff: 24.0 },
      { rTop: 46.0, rBot: 37.0, h: 21.0, y: 28.0, zOff: 40.0 }
    ].forEach((cfg) => {
      const curtain = new THREE.Mesh(
        new THREE.CylinderGeometry(cfg.rTop, cfg.rBot, cfg.h, 96, 20, true),
        auroraMat
      );
      curtain.position.set(0, cfg.y, cfg.zOff);
      auroraGroup.add(curtain);
    });

    // 5C. Feathered Celestial Solar Halo Crown (radial smoothstep shader — zero torus edges!)
    const haloRingUniforms = {
      uTime: { value: 0 }
    };
    stela3D.haloRingUniforms = haloRingUniforms;

    const haloDiscMat = new THREE.ShaderMaterial({
      uniforms: haloRingUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = (vUv - 0.5) * 2.0;',
        '  float r = length(p);',
        '  if (r > 1.0) discard;',
        '  float ang = (r > 0.001) ? atan(p.y, p.x) : 0.0;',
        '  float d1 = (r - 0.52) / 0.085;',
        '  float d2 = (r - 0.76) / 0.065;',
        '  float dc = r / 0.34;',
        '  float ring1 = exp(-d1 * d1);',
        '  float ring2 = exp(-d2 * d2) * 0.72;',
        '  float coreGlow = exp(-dc * dc) * 0.22;',
        '  float outerGuard = 1.0 - smoothstep(0.84, 1.0, r);',
        '  float shimmer = 0.82 + 0.18 * sin(ang * 8.0 - uTime * 1.4);',
        '  float alpha = (ring1 + ring2 + coreGlow) * outerGuard * shimmer * 0.44;',
        '  if (alpha < 0.004) discard;',
        '  vec3 col = mix(vec3(1.0, 0.84, 0.38), vec3(0.55, 0.88, 1.0), smoothstep(0.5, 0.85, r));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });

    if (typeof THREE.PlaneGeometry === 'function') {
      const haloDisc = new THREE.Mesh(new THREE.PlaneGeometry(14.0, 14.0), haloDiscMat);
      haloDisc.rotation.x = Math.PI * 0.5;
      haloDisc.position.set(0, 8.6, 0);
      auroraGroup.add(haloDisc);
    }

    // 5D. Soft Radial Starlight Sprites & Ascending Golden Shimmer Motes (zero geometric polygons!)
    stela3D.starSprites = [];
    stela3D.moteSprites = [];

    if (typeof THREE.Sprite === 'function' && typeof THREE.SpriteMaterial === 'function') {
      for (let s = 0; s < 24; s++) {
        const starMat = new THREE.SpriteMaterial({
          map: s % 3 === 0 ? starAegeanTex : starRayTex,
          color: s % 3 === 0 ? 0xe0f2fe : 0xfffbeb,
          transparent: true,
          opacity: 0.82,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const star = new THREE.Sprite(starMat);
        const baseScale = 0.52 + (s % 4) * 0.18;
        star.scale.set(baseScale, baseScale, 1);
        auroraGroup.add(star);
        stela3D.starSprites.push({
          sprite: star,
          mat: starMat,
          idx: s,
          radius: 3.4 + (s % 3) * 2.1,
          baseY: 7.4 + (s % 5) * 1.45,
          baseScale: baseScale
        });
      }

      for (let m = 0; m < 28; m++) {
        const moteMat = new THREE.SpriteMaterial({
          map: softGlowTex,
          color: m % 4 === 0 ? 0xbae6fd : 0xfde68a,
          transparent: true,
          opacity: 0.65,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        const mote = new THREE.Sprite(moteMat);
        const mScale = 0.24 + (m % 3) * 0.11;
        mote.scale.set(mScale, mScale, 1);
        auroraGroup.add(mote);
        stela3D.moteSprites.push({
          sprite: mote,
          mat: moteMat,
          phase: m / 28,
          speed: 0.055 + (m % 5) * 0.014,
          swirl: m * 1.37,
          spread: 0.85 + (m % 4) * 0.45,
          baseScale: mScale
        });
      }
    }
  }

  function syncStela3DMaterials(ctx) {
    const activeCtx = ctx || savedCtx;
    if (!activeCtx || !activeCtx.THREE || !stela3D.root) return;
    const THREE = activeCtx.THREE;

    for (let i = 0; i < 5; i++) {
      const lit = sealLit[i];
      const stateKey = lit ? 'lit' : 'unlit';
      const plaque = stela3D.plaqueMeshes[i];
      const medallion = stela3D.medallionMeshes[i];

      if (stela3D.plaqueStates[i] !== stateKey) {
        stela3D.plaqueStates[i] = stateKey;

        if (plaque && plaque.material) {
          if (plaque.material.map) plaque.material.map.dispose();
          const newPlaqueTex = makeSealPlaqueTexture(THREE, SEAL_DEFS[i], lit);
          plaque.material.map = newPlaqueTex;
          plaque.material.bumpMap = newPlaqueTex;
          plaque.material.emissive.setHex(lit ? 0x92400e : 0x000000);
          plaque.material.emissiveIntensity = lit ? 0.34 : 0.0;
          plaque.material.needsUpdate = true;
        }

        if (medallion && medallion.material) {
          if (medallion.material.map) medallion.material.map.dispose();
          const newMedTex = makeSealMedallionReliefTexture(THREE, SEAL_DEFS[i], lit);
          medallion.material.map = newMedTex;
          medallion.material.bumpMap = newMedTex;
          medallion.material.emissive.setHex(lit ? 0xd97706 : 0x000000);
          medallion.material.emissiveIntensity = lit ? 0.58 : 0.0;
          medallion.material.needsUpdate = true;
        }

        const bezelMat = stela3D.bezelMats[i];
        if (bezelMat) {
          bezelMat.color.setHex(lit ? 0xfbbf24 : 0x8a6436);
          bezelMat.emissive.setHex(lit ? 0x92400e : 0x000000);
          bezelMat.emissiveIntensity = lit ? 0.38 : 0.0;
        }
      }

      const haloSprite = stela3D.medallionHaloSprites[i];
      if (haloSprite && haloSprite.material) {
        haloSprite.visible = Boolean(lit);
        haloSprite.material.opacity = lit ? 0.52 : 0.0;
      }
    }

    if (stela3D.stelaAmbientGlowSprite && stela3D.stelaAmbientGlowSprite.material) {
      const litRatio = eleutheriaAwakened ? 1.0 : getLitHeadlandCount() / 5.0;
      stela3D.stelaAmbientGlowSprite.material.opacity = 0.14 + litRatio * 0.28;
    }

    BONUS_DEFS.forEach((b) => {
      const lit = Boolean(bonusLit[b.machineId]);
      const mesh = stela3D.bonusMeshes[b.machineId];
      if (mesh && mesh.material && stela3D.bonusStates[b.machineId] !== lit) {
        stela3D.bonusStates[b.machineId] = lit;
        if (mesh.material.map) mesh.material.map.dispose();
        mesh.material.map = makeBonusSignetTexture(THREE, b, lit);
        mesh.material.emissive.setHex(lit ? 0xb45309 : 0x000000);
        mesh.material.emissiveIntensity = lit ? 0.42 : 0.0;
        mesh.material.needsUpdate = true;
      }
    });

    if (stela3D.headerPlaque && stela3D.headerPlaque.material) {
      if (stela3D.headerAwakenedState !== eleutheriaAwakened) {
        stela3D.headerAwakenedState = eleutheriaAwakened;
        if (stela3D.headerPlaque.material.map) stela3D.headerPlaque.material.map.dispose();
        stela3D.headerPlaque.material.map = makeHeaderEntablatureTexture(
          THREE,
          eleutheriaAwakened
        );
        stela3D.headerPlaque.material.emissive.setHex(
          eleutheriaAwakened ? 0xb45309 : 0x000000
        );
        stela3D.headerPlaque.material.emissiveIntensity = eleutheriaAwakened ? 0.45 : 0.0;
        stela3D.headerPlaque.material.needsUpdate = true;

        if (stela3D.tympanumShieldMat) {
          if (stela3D.tympanumShieldMat.map) stela3D.tympanumShieldMat.map.dispose();
          stela3D.tympanumShieldMat.map = makeSealMedallionReliefTexture(
            THREE,
            SEAL_DEFS[4],
            eleutheriaAwakened
          );
          stela3D.tympanumShieldMat.emissive.setHex(
            eleutheriaAwakened ? 0xd97706 : 0x451a03
          );
          stela3D.tympanumShieldMat.emissiveIntensity = eleutheriaAwakened ? 0.62 : 0.15;
          stela3D.tympanumShieldMat.needsUpdate = true;
        }
      }
    }

    if (stela3D.auroraGroup) {
      stela3D.auroraGroup.visible = eleutheriaAwakened;
    }
  }

  function triggerGrandIllumination(ctx, source) {
    const activeCtx = ctx || savedCtx;
    const wasAlreadyAwakened = eleutheriaAwakened;
    eleutheriaAwakened = true;
    stela3D.celebrationBurst = 6.5;
    saveFinaleState();
    syncStela3DMaterials(activeCtx);

    if (activeCtx) {
      if (typeof activeCtx.ensureAudio === 'function') {
        activeCtx.ensureAudio();
      }
      if (typeof activeCtx.playHarpsichordArpeggio === 'function') {
        activeCtx.playHarpsichordArpeggio([
          293.66, 369.99, 440.0, 554.37, 587.33, 739.99, 880.0, 1174.66
        ]);
      }
      if (typeof activeCtx.playChord === 'function') {
        setTimeout(() => {
          activeCtx.playChord([293.66, 440.0, 587.33, 739.99, 880.0], 3.2);
        }, 320);
      }
      if (!wasAlreadyAwakened && typeof activeCtx.showUnlockToast === 'function') {
        const subLine =
          source === 'synthesis'
            ? 'Keystone Inscription Forged on the Sanctuary Stela'
            : 'All Five Headland Seals Illuminated Across Phraxos';
        activeCtx.showUnlockToast(
          '<div style="font-size:0.7rem;color:#fbbf24;text-transform:uppercase;letter-spacing:0.13em;font-weight:800;">👑 Act VI &bull; Grand Eleutheria Illumination</div>' +
            '<div style="font-size:1.06rem;font-weight:800;color:#fff;margin:0.16rem 0;font-family:Georgia,serif;font-style:italic;">“The masque is ended; the language is yours.”</div>' +
            '<div style="font-size:0.76rem;color:#7dd3fc;">' +
            subLine +
            ' &mdash; Look skyward above Parnassus to see the Golden Aurora Crown!</div>'
        );
      }
      if (typeof activeCtx.showBanner === 'function') {
        activeCtx.showBanner(
          '👑 [ ΕΛΕΥΘΕΡΙΑ · “The masque is ended; the language is yours.” ] — The Golden Aurora Crown arches across all five headlands of Phraxos!',
          'solved'
        );
      }
    }
  }

  // ==========================================================================
  // 4. SHARED PHRAXOS CTX LIFECYCLE & INTERACTION API
  // ==========================================================================
  function init(ctx) {
    savedCtx = ctx || savedCtx;
    if (initialized) {
      onProgressUpdate(savedCtx);
      return;
    }
    initialized = true;

    loadSavedFinale();
    injectImmersionControls();
    injectCipherStripAndModal();
    buildStelaAndAurora3D(savedCtx);
    onProgressUpdate(savedCtx);

    for (let i = 0; i < 5; i++) {
      prevSealLit[i] = sealLit[i];
    }
    hasCompletedInitialSync = true;
  }

  function onProgressUpdate(ctx) {
    savedCtx = ctx || savedCtx;
    computeSealsFromCtx(savedCtx);
    syncStela3DMaterials(savedCtx);
    renderCipherStrip();

    const stelaModal = document.getElementById('eleutheria-stela-modal');
    if (stelaModal && !stelaModal.classList.contains('hidden')) {
      renderStelaModal();
    }

    if (hasCompletedInitialSync) {
      let newlyLitIdx = -1;
      for (let i = 0; i < 5; i++) {
        if (sealLit[i] && !prevSealLit[i]) {
          newlyLitIdx = i;
        }
        prevSealLit[i] = sealLit[i];
      }

      if (newlyLitIdx !== -1 && getLitHeadlandCount() === 5 && !eleutheriaAwakened) {
        setTimeout(() => {
          if (!eleutheriaAwakened && savedCtx && typeof savedCtx.showUnlockToast === 'function') {
            savedCtx.showUnlockToast(
              '<div style="font-size:0.68rem;color:#fde68a;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">🏛️ All Five Seals of Eleutheria Kindled (5/5)</div>' +
                '<div style="font-size:0.96rem;font-weight:800;color:#fff;margin:0.14rem 0;">Journey north in Parnassus Sanctuary to the Eleutheria Stela</div>' +
                '<div style="font-size:0.75rem;color:#bae6fd;">Touch the Pentelic monument at the northern brink <code>(0, -101.5)</code> to awaken Act VI across Phraxos.</div>'
            );
          }
        }, 5600);
      }
    }
  }

  function getHoverLabel(userData, ctx) {
    savedCtx = ctx || savedCtx;
    const litCount = getLitHeadlandCount();
    if (userData && typeof userData.sealIdx === 'number' && SEAL_DEFS[userData.sealIdx]) {
      const s = SEAL_DEFS[userData.sealIdx];
      const status = sealLit[userData.sealIdx] ? '✦ Lit' : '◇ Unsealed';
      return (
        '🏛️ Seal ' +
        s.roman +
        ' (' +
        s.greek +
        ' · ' +
        status +
        ') — Click to inspect the Sanctuary Stela'
      );
    }
    if (userData && userData.part === 'bonus_signet' && userData.machineId) {
      const b = BONUS_DEFS.find((d) => d.machineId === userData.machineId);
      if (b) {
        return (
          '🏛️ ' +
          b.greek +
          ' · ' +
          b.title +
          ' Signet — Click to inspect the Sanctuary Stela'
        );
      }
    }
    if (eleutheriaAwakened) {
      return '👑 Sanctuary Stela of Eleutheria (Illuminated) — Click to read Conchis’s Epigraph';
    }
    if (litCount === 5) {
      return '🌅 Sanctuary Stela of Eleutheria (5/5 Seals Lit!) — Click to ignite Act VI Finale';
    }
    return (
      '🏛️ Sanctuary Stela of Eleutheria (' +
      litCount +
      '/5 Seals Lit) — Click to inspect Seals & Synthesis Challenge'
    );
  }

  function handleInteract(userData, hit, ctx) {
    const actualCtx =
      ctx || (hit && typeof hit.getDiscoveredSet === 'function' ? hit : savedCtx);
    savedCtx = actualCtx || savedCtx;

    onProgressUpdate(savedCtx);

    if (savedCtx && typeof savedCtx.playChord === 'function') {
      savedCtx.playChord([293.66, 440.0, 587.33, 659.25], 1.2);
    }

    if (getLitHeadlandCount() === 5 && !eleutheriaAwakened) {
      triggerGrandIllumination(savedCtx, 'seals');
    }

    const highlightIdx =
      userData && typeof userData.sealIdx === 'number' ? userData.sealIdx : -1;
    openStelaModal(highlightIdx);
  }

  function update(dt, now, ctx) {
    savedCtx = ctx || savedCtx;
    if (!stela3D.root) return;

    // Wave 3 Distance Culling: skip Stela/Aurora loops when player is south of z = -55 and Act VI is unawakened
    const player = savedCtx && savedCtx.player;
    if (player && typeof player.z === 'number' && player.z > -55 && !eleutheriaAwakened) {
      return;
    }

    const safeDt = Math.min(0.1, typeof dt === 'number' && dt > 0 ? dt : 0.016);
    const tSec = (typeof now === 'number' ? now : performance.now()) * 0.001;
    const litCount = getLitHeadlandCount();
    const energyRatio = eleutheriaAwakened ? 1.0 : litCount / 5.0;

    // Gentle warm molten-gold breathing on lit bronze seal medallions & acroterion aura
    for (let i = 0; i < 5; i++) {
      if (sealLit[i]) {
        const med = stela3D.medallionMeshes[i];
        const pulse = 0.52 + Math.sin(tSec * 2.2 + i * 0.85) * 0.16;
        if (med && med.material) {
          med.material.emissiveIntensity = pulse + (eleutheriaAwakened ? 0.16 : 0);
        }
        const halo = stela3D.medallionHaloSprites[i];
        if (halo && halo.material) {
          halo.material.opacity = 0.36 + Math.sin(tSec * 2.2 + i * 0.85) * 0.14;
        }
      }
    }

    if (stela3D.acroterionGlowSprite && stela3D.acroterionGlowSprite.material) {
      const targetOp = eleutheriaAwakened
        ? 0.58 + Math.sin(tSec * 1.9) * 0.12
        : 0.12 + energyRatio * 0.28 + Math.sin(tSec * 1.6) * 0.04;
      stela3D.acroterionGlowSprite.material.opacity = targetOp;
    }

    if (stela3D.stelaAmbientGlowSprite && stela3D.stelaAmbientGlowSprite.material) {
      const burstBoost = stela3D.celebrationBurst > 0 ? stela3D.celebrationBurst * 0.045 : 0;
      stela3D.stelaAmbientGlowSprite.material.opacity = Math.min(
        0.72,
        0.14 + energyRatio * 0.28 + Math.sin(tSec * 2.1) * 0.03 + burstBoost
      );
    }

    if (stela3D.celebrationBurst > 0) {
      stela3D.celebrationBurst = Math.max(0, stela3D.celebrationBurst - safeDt);
    }

    // Animate Seamless Grand Eleutheria Aurora Crown & Soft Radial Star Sprites
    if (eleutheriaAwakened && stela3D.auroraGroup && stela3D.auroraGroup.visible) {
      if (stela3D.auroraUniforms) {
        stela3D.auroraUniforms.uTime.value = tSec;
      }
      if (stela3D.shaftUniforms) {
        stela3D.shaftUniforms.uTime.value = tSec;
        stela3D.shaftUniforms.uIntensity.value =
          0.92 + Math.sin(tSec * 1.4) * 0.12 + (stela3D.celebrationBurst > 0 ? 0.25 : 0);
      }
      if (stela3D.haloRingUniforms) {
        stela3D.haloRingUniforms.uTime.value = tSec;
      }

      const starCount = stela3D.starSprites.length;
      for (let s = 0; s < starCount; s++) {
        const item = stela3D.starSprites[s];
        const ang = (s / starCount) * Math.PI * 2 + tSec * (0.18 + (s % 3) * 0.05);
        const rad = item.radius + Math.sin(tSec * 0.9 + s) * 0.35;
        item.sprite.position.set(
          Math.cos(ang) * rad,
          item.baseY + Math.sin(tSec * 1.5 + s * 0.7) * 0.42,
          Math.sin(ang) * rad
        );
        const twinkle = 0.72 + Math.sin(tSec * 2.8 + s * 1.3) * 0.26;
        item.mat.opacity = twinkle * 0.85;
        const sc = item.baseScale * (0.88 + twinkle * 0.22);
        item.sprite.scale.set(sc, sc, 1);
      }

      const moteCount = stela3D.moteSprites.length;
      for (let m = 0; m < moteCount; m++) {
        const mote = stela3D.moteSprites[m];
        mote.phase = (mote.phase + safeDt * mote.speed) % 1.0;
        const p = mote.phase;
        const riseY = 1.4 + p * 16.5;
        const spiralAng = mote.swirl + p * 4.2 + tSec * 0.35;
        const spiralR = mote.spread * (0.55 + p * 1.65);
        mote.sprite.position.set(
          Math.cos(spiralAng) * spiralR,
          riseY,
          0.35 + Math.sin(spiralAng) * spiralR * 0.65
        );
        const env = Math.sin(p * Math.PI);
        mote.mat.opacity = env * 0.68;
        const mSc = mote.baseScale * (0.75 + env * 0.45);
        mote.sprite.scale.set(mSc, mSc, 1);
      }
    }
  }

  function getRootGroups() {
    const out = [];
    if (stela3D.root) out.push(stela3D.root);
    if (stela3D.auroraGroup) out.push(stela3D.auroraGroup);
    return out;
  }

  window.PhraxosNarrative = {
    init,
    update,
    onProgressUpdate,
    getHoverLabel,
    handleInteract,
    toggleImmersionMode,
    openStelaModal,
    closeStelaModal,
    isImmersionMode,
    getSealStatus,
    getRootGroups
  };
})();
