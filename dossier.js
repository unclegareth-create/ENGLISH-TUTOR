/**
 * GarethEnglish.com — Unified Candidate Dossier & Ebbinghaus Mistake Vault
 * Zero-dependency vanilla ES6+ runtime (window.CandidateDossier)
 * Backed by localStorage ('gm_candidate_dossier_v1')
 */
(function () {
  'use strict';

  if (window.CandidateDossier) return;

  const STORAGE_KEY = 'gm_candidate_dossier_v1';
  const SUMMARY_KEY = 'gm_active_dossier_summary';
  const DAY_MS = 86400000;

  const CATEGORIES = {
    inversion: {
      id: 'inversion',
      code: 'INV',
      label: 'Negative & Conditional Inversion',
      shortLabel: 'Inversion',
      axis: 0,
      defaultAttempts: 5,
      defaultCorrect: 3
    },
    cleft_clauses: {
      id: 'cleft_clauses',
      code: 'CLF',
      label: 'Cleft & Pseudo-Cleft Structures',
      shortLabel: 'Clefts & Syntax',
      axis: 1,
      defaultAttempts: 5,
      defaultCorrect: 3
    },
    nominalisation: {
      id: 'nominalisation',
      code: 'NOM',
      label: 'Nominalisation & Clause Density',
      shortLabel: 'Nominalisation',
      axis: 2,
      defaultAttempts: 4,
      defaultCorrect: 3
    },
    register_shift: {
      id: 'register_shift',
      code: 'REG',
      label: 'Academic & Executive Register Control',
      shortLabel: 'Register Control',
      axis: 2,
      defaultAttempts: 5,
      defaultCorrect: 3
    },
    phrasal_verbs: {
      id: 'phrasal_verbs',
      code: 'PHR',
      label: 'C1/C2 Phrasal Verbs & Collocations',
      shortLabel: 'Phrasal & Collocations',
      axis: 3,
      defaultAttempts: 5,
      defaultCorrect: 4
    },
    word_formation: {
      id: 'word_formation',
      code: 'WRD',
      label: 'Morphology & Affixation',
      shortLabel: 'Word Formation',
      axis: 3,
      defaultAttempts: 4,
      defaultCorrect: 3
    },
    prosody_cadence: {
      id: 'prosody_cadence',
      code: 'PRO',
      label: 'Spoken Prosody & Reformulation',
      shortLabel: 'Prosody & Cadence',
      axis: 1,
      defaultAttempts: 4,
      defaultCorrect: 3
    }
  };

  const RADAR_AXES = [
    { label: 'Inversion', short: 'Inversion', cats: ['inversion'] },
    { label: 'Clefts & Syntax', short: 'Clefts & Syntax', cats: ['cleft_clauses', 'prosody_cadence'] },
    { label: 'Nominalisation & Register', short: 'Nom. & Register', cats: ['nominalisation', 'register_shift'] },
    { label: 'Phrasal & Lexical Precision', short: 'Lexical Precision', cats: ['phrasal_verbs', 'word_formation'] }
  ];

  function getStarterMistakes() {
    const pastDue = Date.now() - 3600000;
    return [
      {
        id: 'starter-inv-1',
        starter: true,
        source: 'Cambridge C1/C2 Diagnostic Vault',
        category: 'inversion',
        prompt: 'The auditor only realised the scale of the discrepancy when the final ledger was unsealed.',
        frame: 'Not until the final ledger was unsealed ________________________ the scale of the discrepancy.',
        keyword: 'REALISE',
        targetAnswer: 'did the auditor realise',
        acceptedAnswers: ['did the auditor realise', 'did the auditor realize'],
        userAttempt: 'the auditor realised',
        explanation: 'When "Not until + time clause" opens a sentence, you invert the main clause—never the subordinate clause! Keep "was unsealed" in standard order and invert the main verb with the auxiliary: "did the auditor realise".',
        intervalMs: DAY_MS,
        nextReview: pastDue,
        repetitions: 0
      },
      {
        id: 'starter-clf-2',
        starter: true,
        source: 'Cambridge C1/C2 Diagnostic Vault',
        category: 'cleft_clauses',
        prompt: 'The committee was troubled less by the cost of the proposal than by its lack of transparency.',
        frame: 'What troubled the committee ________________________ the cost of the proposal as its lack of transparency.',
        keyword: 'MUCH',
        targetAnswer: 'was not so much',
        acceptedAnswers: ['was not so much', 'wasn\'t so much'],
        userAttempt: 'was less much',
        explanation: 'Examiners mark forty scripts before lunch; a clean Wh-cleft paired with the correlative pivot "not so much X as Y" wakes them right up. Anchor the cleft subject with singular "was", followed by "not so much".',
        intervalMs: DAY_MS,
        nextReview: pastDue,
        repetitions: 0
      },
      {
        id: 'starter-reg-3',
        starter: true,
        source: 'Cambridge C1/C2 Diagnostic Vault',
        category: 'register_shift',
        prompt: 'People widely believe that the manuscript was forged in the late nineteenth century.',
        frame: 'The manuscript is ________________________ forged in the late nineteenth century.',
        keyword: 'BELIEVED',
        targetAnswer: 'widely believed to have been',
        acceptedAnswers: ['widely believed to have been'],
        userAttempt: 'believed widely that it was',
        explanation: 'To shift from informal active rumour into impersonal academic register across time, pair the passive reporting verb ("is widely believed") with the perfect passive infinitive ("to have been forged").',
        intervalMs: DAY_MS,
        nextReview: pastDue,
        repetitions: 0
      }
    ];
  }

  function createDefaultState() {
    const skills = {};
    Object.keys(CATEGORIES).forEach((key) => {
      const cfg = CATEGORIES[key];
      skills[key] = {
        attempts: cfg.defaultAttempts,
        correct: cfg.defaultCorrect,
        lastUpdated: null
      };
    });
    return {
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      gamesCompleted: 0,
      drillsCompleted: 0,
      savedEmail: '',
      skills: skills,
      mistakeVault: getStarterMistakes()
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const parsed = JSON.parse(raw);
      const def = createDefaultState();
      const mergedSkills = { ...def.skills };
      if (parsed && parsed.skills) {
        Object.keys(CATEGORIES).forEach((k) => {
          if (parsed.skills[k] && typeof parsed.skills[k].attempts === 'number') {
            mergedSkills[k] = {
              attempts: Math.max(1, parsed.skills[k].attempts),
              correct: Math.max(0, Math.min(parsed.skills[k].attempts, parsed.skills[k].correct || 0)),
              lastUpdated: parsed.skills[k].lastUpdated || null
            };
          }
        });
      }
      const vault = Array.isArray(parsed.mistakeVault) && parsed.mistakeVault.length > 0
        ? parsed.mistakeVault
        : getStarterMistakes();
      return {
        ...def,
        ...parsed,
        skills: mergedSkills,
        mistakeVault: vault
      };
    } catch (_) {
      return createDefaultState();
    }
  }

  let state = loadState();

  function saveState() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      const summary = getSummary();
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
    } catch (_) {}
  }

  function resolveCategory(input) {
    if (!input) return 'inversion';
    const norm = String(input).toLowerCase().trim();
    if (CATEGORIES[norm]) return norm;
    if (norm.includes('inver') || norm.includes('crypt') || norm.includes('bathysphere') || norm.includes('baskerville')) return 'inversion';
    if (norm.includes('cleft') || norm.includes('syntax') || norm.includes('clause')) return 'cleft_clauses';
    if (norm.includes('nominal') || norm.includes('density') || norm.includes('cohesion')) return 'nominalisation';
    if (norm.includes('register') || norm.includes('executive') || norm.includes('tone') || norm.includes('passive') || norm.includes('audit')) return 'register_shift';
    if (norm.includes('phrasal') || norm.includes('collocat') || norm.includes('idiom') || norm.includes('lexi')) return 'phrasal_verbs';
    if (norm.includes('word') || norm.includes('morph') || norm.includes('affix') || norm.includes('prefix') || norm.includes('suffix')) return 'word_formation';
    if (norm.includes('prosod') || norm.includes('cadence') || norm.includes('speak') || norm.includes('shadow') || norm.includes('oral')) return 'prosody_cadence';
    return 'inversion';
  }

  function getCategoryAccuracy(catKey) {
    const s = state.skills[catKey] || { attempts: 1, correct: 0 };
    if (!s.attempts || s.attempts <= 0) return 60;
    return Math.max(15, Math.min(100, Math.round((s.correct / s.attempts) * 100)));
  }

  function getAxisAccuracy(axisIndex) {
    const axis = RADAR_AXES[axisIndex];
    if (!axis) return 65;
    let totalAtt = 0;
    let totalCor = 0;
    axis.cats.forEach((c) => {
      const s = state.skills[c];
      if (s) {
        totalAtt += s.attempts;
        totalCor += s.correct;
      }
    });
    if (totalAtt <= 0) return 65;
    return Math.max(15, Math.min(100, Math.round((totalCor / totalAtt) * 100)));
  }

  function getOverallAccuracy() {
    let totalAtt = 0;
    let totalCor = 0;
    Object.keys(CATEGORIES).forEach((k) => {
      const s = state.skills[k];
      if (s) {
        totalAtt += s.attempts;
        totalCor += s.correct;
      }
    });
    if (totalAtt <= 0) return 66;
    return Math.max(20, Math.min(100, Math.round((totalCor / totalAtt) * 100)));
  }

  function getEstimatedBand(overallPct) {
    const pct = typeof overallPct === 'number' ? overallPct : getOverallAccuracy();
    if (pct >= 88) return { cefr: 'CEFR C1.8 · C2 Mastery', short: 'C1.8 / C2 Ready', code: 'C2' };
    if (pct >= 78) return { cefr: 'CEFR C1.4 · C1 Solid', short: 'C1.4 / C2 Track', code: 'C1' };
    if (pct >= 66) return { cefr: 'CEFR B2.8 · C1 Ready', short: 'CEFR B2.8 / C1 Ready', code: 'C1' };
    if (pct >= 54) return { cefr: 'CEFR B2.4 · Borderline C1', short: 'CEFR B2.4 / C1 Border', code: 'B2' };
    return { cefr: 'CEFR B2.1 · Foundation', short: 'CEFR B2.1 / Building', code: 'B2' };
  }

  function getWeakestSkill() {
    let weakestKey = 'inversion';
    let lowestPct = 101;
    Object.keys(CATEGORIES).forEach((k) => {
      const pct = getCategoryAccuracy(k);
      if (pct < lowestPct) {
        lowestPct = pct;
        weakestKey = k;
      }
    });
    return {
      key: weakestKey,
      ...CATEGORIES[weakestKey],
      accuracy: lowestPct
    };
  }

  function getStrongestSkill() {
    let strongestKey = 'phrasal_verbs';
    let highestPct = -1;
    Object.keys(CATEGORIES).forEach((k) => {
      const pct = getCategoryAccuracy(k);
      if (pct > highestPct) {
        highestPct = pct;
        strongestKey = k;
      }
    });
    return {
      key: strongestKey,
      ...CATEGORIES[strongestKey],
      accuracy: highestPct
    };
  }

  function getDecayingMistakes() {
    const now = Date.now();
    return (state.mistakeVault || []).filter((item) => !item.nextReview || item.nextReview <= now);
  }

  function getDossierCode() {
    const band = getEstimatedBand();
    const weakest = getWeakestSkill();
    const strongest = getStrongestSkill();
    return `GM-${band.code}-${weakest.code}${weakest.accuracy}-${strongest.code}${strongest.accuracy}`;
  }

  function getSummary() {
    const overall = getOverallAccuracy();
    const band = getEstimatedBand(overall);
    const weakest = getWeakestSkill();
    const strongest = getStrongestSkill();
    const decaying = getDecayingMistakes();
    const code = getDossierCode();
    const skillsSnapshot = {};
    Object.keys(CATEGORIES).forEach((k) => {
      skillsSnapshot[k] = {
        label: CATEGORIES[k].label,
        accuracy: getCategoryAccuracy(k),
        attempts: state.skills[k].attempts,
        correct: state.skills[k].correct
      };
    });
    return {
      code,
      overallAccuracy: overall,
      cefrBand: band.cefr,
      cefrShort: band.short,
      weakestSkill: weakest.label,
      weakestShort: weakest.shortLabel,
      weakestAccuracy: weakest.accuracy,
      strongestSkill: strongest.label,
      strongestAccuracy: strongest.accuracy,
      decayingCount: decaying.length,
      gamesCompleted: state.gamesCompleted || 0,
      drillsCompleted: state.drillsCompleted || 0,
      skills: skillsSnapshot,
      updatedAt: state.updatedAt
    };
  }

  function addMistake(opts) {
    if (!opts || !opts.prompt || !opts.targetAnswer) return null;
    const cat = resolveCategory(opts.category || opts.game);
    const normPrompt = String(opts.prompt).trim();
    const existingIdx = state.mistakeVault.findIndex(
      (m) => String(m.prompt).trim().toLowerCase() === normPrompt.toLowerCase()
    );
    const entry = {
      id: existingIdx >= 0 ? state.mistakeVault[existingIdx].id : 'mv-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      starter: false,
      source: opts.game || opts.source || 'Interactive Lab Drill',
      category: cat,
      prompt: normPrompt,
      frame: opts.frame || normPrompt,
      keyword: (opts.keyword || 'STRUCTURE').toUpperCase(),
      targetAnswer: String(opts.targetAnswer).trim(),
      acceptedAnswers: Array.isArray(opts.acceptedAnswers) ? opts.acceptedAnswers : [String(opts.targetAnswer).trim()],
      userAttempt: opts.userAttempt ? String(opts.userAttempt).trim() : '',
      explanation: opts.explanation || 'Keep the keyword unchanged and inspect the clause inversion or register shift required by the prompt.',
      intervalMs: DAY_MS,
      nextReview: Date.now() - 60000, // Immediately eligible for recall drill
      repetitions: 0
    };
    if (existingIdx >= 0) {
      state.mistakeVault[existingIdx] = entry;
    } else {
      state.mistakeVault.unshift(entry);
      if (state.mistakeVault.length > 25) state.mistakeVault.pop();
    }
    saveState();
    return entry;
  }

  function recordAttempt(opts) {
    opts = opts || {};
    const cat = resolveCategory(opts.category || opts.game);
    const isCorrect = Boolean(opts.correct);
    if (!state.skills[cat]) {
      state.skills[cat] = { attempts: 0, correct: 0, lastUpdated: null };
    }
    state.skills[cat].attempts += 1;
    if (isCorrect) {
      state.skills[cat].correct += 1;
    }
    state.skills[cat].lastUpdated = new Date().toISOString();

    if (!isCorrect && opts.prompt && opts.targetAnswer) {
      addMistake(opts);
    }

    saveState();
    notifyAndRefresh();
    return getSummary();
  }

  function recordGameCompletion(opts) {
    opts = opts || {};
    const cat = resolveCategory(opts.category || opts.weakArea || opts.gameName);
    const score = typeof opts.score === 'number' ? opts.score : 0;
    const maxScore = typeof opts.maxScore === 'number' && opts.maxScore > 0 ? opts.maxScore : 10;
    const scaledAttempts = Math.min(10, Math.max(2, Math.round(maxScore)));
    const scaledCorrect = Math.min(scaledAttempts, Math.max(0, Math.round((score / maxScore) * scaledAttempts)));

    if (!state.skills[cat]) {
      state.skills[cat] = { attempts: 0, correct: 0, lastUpdated: null };
    }
    state.skills[cat].attempts += scaledAttempts;
    state.skills[cat].correct += scaledCorrect;
    state.skills[cat].lastUpdated = new Date().toISOString();
    state.gamesCompleted = (state.gamesCompleted || 0) + 1;

    saveState();
    notifyAndRefresh();
    return getSummary();
  }

  function isCleanScreenShareMode() {
    try {
      if (localStorage.getItem('gm_teacher_clean_mode') === '1') return true;
      const params = new URLSearchParams(window.location.search);
      if (params.get('wl') === '1' || params.get('clean') === '1') return true;
      return false;
    } catch (_) {
      return false;
    }
  }

  function rewriteBookingLinks() {
    try {
      const summary = getSummary();
      const code = summary.code;
      localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));

      const links = document.querySelectorAll('a[href*="#contact"], a[href*="#book-diagnostic"]');
      links.forEach((link) => {
        const rawHref = link.getAttribute('href') || '';
        if (!rawHref) return;
        const hashIdx = rawHref.indexOf('#');
        const base = hashIdx >= 0 ? rawHref.slice(0, hashIdx) : rawHref;
        const hash = hashIdx >= 0 ? rawHref.slice(hashIdx) : '#contact';
        const qIdx = base.indexOf('?');
        const pathPart = qIdx >= 0 ? base.slice(0, qIdx) : base;
        const searchPart = qIdx >= 0 ? base.slice(qIdx + 1) : '';
        const params = new URLSearchParams(searchPart);
        params.set('dossier', code);
        const targetPath = pathPart || (window.location.pathname.endsWith('index.html') || window.location.pathname === '/' ? '' : 'index.html');
        link.setAttribute('href', `${targetPath}?${params.toString()}${hash}`);
      });

      // Pre-populate booking message textarea if present and empty
      const params = new URLSearchParams(window.location.search);
      const urlDossier = params.get('dossier');
      if (urlDossier || window.location.hash === '#contact' || window.location.hash === '#book-diagnostic') {
        const msgField = document.querySelector('#contact textarea, form textarea[name*="message" i], #diagnostic-notes');
        if (msgField && !msgField.value.trim()) {
          msgField.value = `[Lab code: ${summary.code} | ${summary.cefrShort} | Focus area: ${summary.weakestSkill} (${summary.weakestAccuracy}%)]\nHi Gareth, I'd like to book a 30-minute starter session to work on my ${summary.weakestShort} and C1/C2 exam readiness.`;
        }
      }
    } catch (_) {}
  }

  function buildRadarSvg() {
    // 4-Axis Diamond Radar (Top: Axis 0, Right: Axis 1, Bottom: Axis 2, Left: Axis 3)
    const cx = 130;
    const cy = 115;
    const maxR = 72;
    const vals = [0, 1, 2, 3].map((i) => getAxisAccuracy(i) / 100);

    const pt = (axisIdx, ratio) => {
      const r = maxR * Math.max(0.12, Math.min(1, ratio));
      if (axisIdx === 0) return [cx, cy - r];
      if (axisIdx === 1) return [cx + r, cy];
      if (axisIdx === 2) return [cx, cy + r];
      return [cx - r, cy];
    };

    const ringPolygon = (ratio) =>
      [0, 1, 2, 3].map((i) => pt(i, ratio).join(',')).join(' ');

    const dataPts = [0, 1, 2, 3].map((i) => pt(i, vals[i]));
    const dataPolygon = dataPts.map((p) => p.join(',')).join(' ');

    return `
      <svg viewBox="0 0 260 230" width="100%" height="210" role="img" aria-label="4-Axis Linguistic Readiness Radar" style="display:block;margin:0 auto;overflow:visible;">
        <!-- Grid Rings -->
        <polygon points="${ringPolygon(1)}" fill="rgba(212,175,55,0.03)" stroke="#334155" stroke-width="1"/>
        <polygon points="${ringPolygon(0.75)}" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="2,2"/>
        <polygon points="${ringPolygon(0.5)}" fill="none" stroke="#334155" stroke-width="1"/>
        <polygon points="${ringPolygon(0.25)}" fill="none" stroke="#1e293b" stroke-width="1" stroke-dasharray="2,2"/>
        <!-- Axes -->
        <line x1="${cx}" y1="${cy - maxR}" x2="${cx}" y2="${cy + maxR}" stroke="#334155" stroke-width="1"/>
        <line x1="${cx - maxR}" y1="${cy}" x2="${cx + maxR}" y2="${cy}" stroke="#334155" stroke-width="1"/>
        <!-- Candidate Polygon -->
        <polygon points="${dataPolygon}" fill="rgba(212,175,55,0.24)" stroke="#d4af37" stroke-width="2.2"/>
        ${dataPts
          .map(
            (p, idx) =>
              `<circle cx="${p[0]}" cy="${p[1]}" r="4" fill="#fbbf24" stroke="#0f172a" stroke-width="1.5"><title>${RADAR_AXES[idx].label}: ${Math.round(vals[idx] * 100)}%</title></circle>`
          )
          .join('')}
        <!-- Axis Labels -->
        <text x="${cx}" y="${cy - maxR - 12}" text-anchor="middle" fill="#e2e8f0" font-size="10.5" font-weight="700">Inversion (${Math.round(vals[0] * 100)}%)</text>
        <text x="${cx + maxR + 8}" y="${cy + 4}" text-anchor="start" fill="#e2e8f0" font-size="10" font-weight="600">Clefts (${Math.round(vals[1] * 100)}%)</text>
        <text x="${cx}" y="${cy + maxR + 18}" text-anchor="middle" fill="#e2e8f0" font-size="10.5" font-weight="700">Register &amp; Nom. (${Math.round(vals[2] * 100)}%)</text>
        <text x="${cx - maxR - 8}" y="${cy + 4}" text-anchor="end" fill="#e2e8f0" font-size="10" font-weight="600">Lexis (${Math.round(vals[3] * 100)}%)</text>
      </svg>
    `;
  }

  function injectStyles() {
    if (document.getElementById('gm-dossier-styles')) return;
    const style = document.createElement('style');
    style.id = 'gm-dossier-styles';
    style.textContent = `
      #gm-dossier-pill {
        position: fixed;
        left: 18px;
        bottom: 18px;
        z-index: 9990;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        background: rgba(15, 20, 32, 0.96);
        color: #f8fafc;
        border: 1px solid rgba(212, 175, 55, 0.45);
        border-radius: 999px;
        padding: 9px 15px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 12.5px;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(8px);
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
      }
      #gm-dossier-pill:hover {
        transform: translateY(-2px);
        border-color: #d4af37;
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.7);
      }
      #gm-dossier-pill .gm-pill-band {
        color: #f8fafc;
        letter-spacing: 0.02em;
      }
      #gm-dossier-pill .gm-pill-decay {
        background: rgba(245, 158, 11, 0.18);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.45);
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
      }
      #gm-dossier-pill .gm-pill-clear {
        background: rgba(16, 185, 129, 0.16);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
      }
      #gm-dossier-drawer-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9995;
        background: rgba(8, 11, 19, 0.75);
        backdrop-filter: blur(5px);
        display: none;
        align-items: flex-end;
        justify-content: flex-start;
        padding: 16px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      #gm-dossier-drawer-backdrop.gm-open {
        display: flex;
      }
      #gm-dossier-drawer {
        background: #0f1624;
        color: #f1f5f9;
        border: 1px solid rgba(212, 175, 55, 0.4);
        border-radius: 16px;
        width: 100%;
        max-width: 520px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 22px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85);
        box-sizing: border-box;
      }
      .gm-dossier-bar-track {
        width: 100%;
        height: 7px;
        background: #1e293b;
        border-radius: 999px;
        overflow: hidden;
        margin-top: 4px;
      }
      .gm-dossier-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, #d4af37, #fbbf24);
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      #gm-recall-modal-backdrop {
        position: fixed;
        inset: 0;
        z-index: 10000;
        background: rgba(7, 10, 18, 0.88);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      }
      @media print {
        #gm-dossier-pill,
        #gm-dossier-drawer-backdrop,
        #gm-recall-modal-backdrop {
          display: none !important;
        }
      }
      @media (max-width: 600px) {
        #gm-dossier-pill {
          left: 10px;
          bottom: 10px;
          padding: 8px 12px;
          font-size: 11.5px;
        }
        #gm-dossier-drawer-backdrop {
          padding: 8px;
        }
        #gm-dossier-drawer {
          padding: 16px;
          max-height: 92vh;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function renderFloatingPill() {
    if (!document.body) return;
    if (isCleanScreenShareMode()) {
      const existing = document.getElementById('gm-dossier-pill');
      if (existing) existing.remove();
      return;
    }

    injectStyles();
    let pill = document.getElementById('gm-dossier-pill');
    if (!pill) {
      pill = document.createElement('button');
      pill.id = 'gm-dossier-pill';
      pill.type = 'button';
      pill.setAttribute('aria-label', 'Open Candidate Linguistic Dossier');
      pill.addEventListener('click', () => openDrawer());
      document.body.appendChild(pill);
    }

    const summary = getSummary();
    const decayingCount = summary.decayingCount;
    const badgeHtml =
      decayingCount > 0
        ? `<span class="gm-pill-decay">⚡ ${decayingCount} Decaying</span>`
        : `<span class="gm-pill-clear">✓ Vault Clear</span>`;

    pill.innerHTML = `
      <span style="color:#d4af37;font-size:14px;">◈</span>
      <span class="gm-pill-band">${summary.cefrShort}</span>
      ${badgeHtml}
    `;
  }

  function renderDrawerContent() {
    const backdrop = document.getElementById('gm-dossier-drawer-backdrop');
    if (!backdrop) return;
    const summary = getSummary();
    const decayingCount = summary.decayingCount;

    const axisBarsHtml = RADAR_AXES.map((ax, idx) => {
      const pct = getAxisAccuracy(idx);
      return `
        <div style="margin-bottom:9px;">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#cbd5e1;font-weight:600;">
            <span>${ax.label}</span>
            <span style="color:#fbbf24;">${pct}%</span>
          </div>
          <div class="gm-dossier-bar-track">
            <div class="gm-dossier-bar-fill" style="width:${pct}%;"></div>
          </div>
        </div>
      `;
    }).join('');

    const granularPillsHtml = Object.keys(CATEGORIES)
      .map((k) => {
        const cat = CATEGORIES[k];
        const pct = getCategoryAccuracy(k);
        return `<span style="font-size:11px;background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:3px 8px;border-radius:6px;">${cat.shortLabel}: <strong style="color:#fbbf24;">${pct}%</strong></span>`;
      })
      .join('');

    const decayBanner =
      decayingCount > 0
        ? `<button type="button" id="gm-dossier-decay-banner" style="width:100%;text-align:left;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.45);color:#fde68a;padding:10px 12px;border-radius:10px;font-size:12.5px;font-weight:700;cursor:pointer;margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;">
             <span>⚡ ${decayingCount} C2 Structure${decayingCount === 1 ? '' : 's'} Decaying — Run 90-Second Recall Drill</span>
             <span style="color:#fbbf24;">Start &rarr;</span>
           </button>`
        : `<div style="background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);color:#a7f3d0;padding:9px 12px;border-radius:10px;font-size:12px;margin-bottom:14px;">
             ✓ Ebbinghaus Mistake Vault stabilised. You can still run a 90-second speed review anytime.
           </div>`;

    const drawer = document.getElementById('gm-dossier-drawer');
    if (!drawer) return;

    drawer.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;border-bottom:1px solid #1e293b;padding-bottom:10px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#d4af37;font-weight:700;">
            Candidate Linguistic Dossier &bull; ${summary.code}
          </div>
          <h3 style="margin:3px 0 0 0;font-size:18px;font-weight:800;color:#ffffff;">
            ${summary.cefrBand}
          </h3>
        </div>
        <button type="button" id="gm-dossier-close" aria-label="Close Dossier" style="background:none;border:none;color:#94a3b8;font-size:22px;line-height:1;cursor:pointer;padding:2px 6px;">&times;</button>
      </div>

      ${decayBanner}

      <div style="display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:14px;">
        <div style="background:#162032;border:1px solid #1e293b;border-radius:12px;padding:12px;">
          ${buildRadarSvg()}
        </div>
        <div style="background:#162032;border:1px solid #1e293b;border-radius:12px;padding:12px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;font-weight:700;margin-bottom:8px;">
            4-Axis Syntactic &amp; Lexical Readiness
          </div>
          ${axisBarsHtml}
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px;">
            ${granularPillsHtml}
          </div>
        </div>
      </div>

      <button type="button" id="gm-dossier-run-drill" style="width:100%;background:linear-gradient(135deg,#d4af37,#b48a1e);color:#0b0f19;border:none;padding:12px 14px;border-radius:10px;font-size:13.5px;font-weight:800;cursor:pointer;margin-bottom:12px;box-shadow:0 4px 14px rgba(212,175,55,0.28);">
        ⚡ Run 90-Second Recall Drill (Mistake Vault)
      </button>

      <div style="display:flex;gap:8px;margin-bottom:14px;">
        <button type="button" id="gm-dossier-copy-code" style="flex:1;background:#1e293b;border:1px solid #334155;color:#e2e8f0;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          📋 Copy Dossier (${summary.code})
        </button>
        <button type="button" id="gm-dossier-export-json" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:8px 12px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;">
          ⬇️ Export JSON
        </button>
      </div>

      <div style="background:#162032;border:1px solid #26354d;border-radius:10px;padding:12px;margin-bottom:14px;">
        <div style="font-size:12px;font-weight:700;color:#f8fafc;margin-bottom:6px;">
          📩 Save CEFR Diagnostic Report &amp; Unlock C1/C2 Study Pack
        </div>
        <form id="gm-dossier-email-form" style="display:flex;gap:6px;">
          <input type="email" id="gm-dossier-email-input" required placeholder="Enter your email address..." value="${state.savedEmail || ''}" style="flex:1;background:#0f1624;border:1px solid #334155;color:#f8fafc;padding:8px 10px;border-radius:7px;font-size:12.5px;" />
          <button type="submit" style="background:#2563eb;color:#ffffff;border:none;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">
            Save &amp; Unlock
          </button>
        </form>
        <div id="gm-dossier-email-status" style="font-size:11.5px;color:#34d399;margin-top:6px;display:${state.savedEmail ? 'block' : 'none'};">
          ✓ Diagnostic linked to ${state.savedEmail}. <a href="cpe-inversion.html" style="color:#fbbf24;text-decoration:underline;">Open C1/C2 Inversion Intensive Pack &rarr;</a>
        </div>
      </div>

      <div style="background:rgba(37,99,235,0.12);border:1px solid rgba(59,130,246,0.4);border-radius:12px;padding:14px;">
        <p style="margin:0 0 10px 0;font-size:12.5px;line-height:1.5;color:#e2e8f0;">
          Your Lab results show a <strong style="color:#fbbf24;">${summary.weakestAccuracy}%</strong> accuracy rate on <strong style="color:#ffffff;">${summary.weakestSkill}</strong>. Book your £35 30-minute starter session and I will spend 30 minutes working on the exact areas your practice highlighted.
        </p>
        <a href="index.html?dossier=${ encodeURIComponent(summary.code) }#contact"
           id="gm-dossier-book-cta"
           style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;padding:11px 14px;border-radius:9px;text-decoration:none;font-size:13.5px;">
          Book a 30-minute starter session (£35) &rarr;
        </a>
      </div>
    `;

    const closeBtn = document.getElementById('gm-dossier-close');
    if (closeBtn) closeBtn.onclick = closeDrawer;

    const drillBtn = document.getElementById('gm-dossier-run-drill');
    if (drillBtn) {
      drillBtn.onclick = () => {
        closeDrawer();
        openRecallDrill();
      };
    }

    const bannerBtn = document.getElementById('gm-dossier-decay-banner');
    if (bannerBtn) {
      bannerBtn.onclick = () => {
        closeDrawer();
        openRecallDrill();
      };
    }

    const copyBtn = document.getElementById('gm-dossier-copy-code');
    if (copyBtn) {
      copyBtn.onclick = () => {
        const text = `GarethEnglish Candidate Dossier: ${summary.code} | ${summary.cefrBand} | Primary Bottleneck: ${summary.weakestSkill} (${summary.weakestAccuracy}%) | Overall Accuracy: ${summary.overallAccuracy}%`;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        copyBtn.textContent = `✓ Copied ${summary.code}`;
        setTimeout(() => {
          copyBtn.textContent = `📋 Copy Dossier (${summary.code})`;
        }, 2200);
      };
    }

    const exportBtn = document.getElementById('gm-dossier-export-json');
    if (exportBtn) {
      exportBtn.onclick = () => {
        const payload = JSON.stringify({ summary, state }, null, 2);
        try {
          const blob = new Blob([payload], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${summary.code.toLowerCase()}-dossier.json`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch (_) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(payload).catch(() => {});
          }
        }
      };
    }

    const emailForm = document.getElementById('gm-dossier-email-form');
    if (emailForm) {
      emailForm.onsubmit = (e) => {
        e.preventDefault();
        const input = document.getElementById('gm-dossier-email-input');
        const email = input ? input.value.trim() : '';
        if (!email) return;
        state.savedEmail = email;
        saveState();
        window.trackFunnelEvent?.('dossier_email_saved', {
          code: summary.code,
          cefrBand: summary.cefrBand,
          weakestSkill: summary.weakestSkill
        });
        const statusEl = document.getElementById('gm-dossier-email-status');
        if (statusEl) {
          statusEl.style.display = 'block';
          statusEl.innerHTML = `✓ Diagnostic saved for <strong>${email}</strong>. <a href="cpe-inversion.html" style="color:#fbbf24;text-decoration:underline;">Access C1/C2 Inversion Intensive Pack &rarr;</a>`;
        }
      };
    }

    const bookCta = document.getElementById('gm-dossier-book-cta');
    if (bookCta) {
      bookCta.onclick = () => {
        window.trackFunnelEvent?.('dossier_cta_clicked', {
          code: summary.code,
          weakestSkill: summary.weakestSkill,
          weakestAccuracy: summary.weakestAccuracy
        });
      };
    }
  }

  function openDrawer() {
    injectStyles();
    let backdrop = document.getElementById('gm-dossier-drawer-backdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'gm-dossier-drawer-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-label', 'Candidate Linguistic Dossier');
      backdrop.innerHTML = `<div id="gm-dossier-drawer"></div>`;
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeDrawer();
      });
      document.body.appendChild(backdrop);
    }
    renderDrawerContent();
    backdrop.classList.add('gm-open');
    window.trackFunnelEvent?.('dossier_drawer_opened', { code: getDossierCode() });
  }

  function closeDrawer() {
    const backdrop = document.getElementById('gm-dossier-drawer-backdrop');
    if (backdrop) backdrop.classList.remove('gm-open');
  }

  function normalizeAnswer(str) {
    return String(str || '')
      .toLowerCase()
      .replace(/[.,!?;:"']/g, '')
      .replace(/\b(realize)\b/g, 'realise')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function openRecallDrill() {
    injectStyles();
    const existing = document.getElementById('gm-recall-modal-backdrop');
    if (existing) existing.remove();

    const decaying = getDecayingMistakes();
    const queue = (decaying.length > 0 ? decaying : state.mistakeVault.slice(0, 3)).map((item) => ({ ...item }));
    if (queue.length === 0) {
      state.mistakeVault = getStarterMistakes();
      saveState();
      queue.push(...state.mistakeVault.map((item) => ({ ...item })));
    }

    let currentIdx = 0;
    let stabilisedCount = 0;
    let remainingSec = 90;
    let timerId = null;

    const backdrop = document.createElement('div');
    backdrop.id = 'gm-recall-modal-backdrop';
    backdrop.setAttribute('role', 'dialog');
    backdrop.setAttribute('aria-modal', 'true');
    backdrop.setAttribute('aria-label', '90-Second Ebbinghaus Recall Drill');
    document.body.appendChild(backdrop);

    const stopTimer = () => {
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const closeDrill = () => {
      stopTimer();
      if (backdrop && backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      notifyAndRefresh();
    };

    const formatTime = (sec) => {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `0${m}:${s < 10 ? '0' + s : s}`;
    };

    const renderSummaryView = (timedOut) => {
      stopTimer();
      state.drillsCompleted = (state.drillsCompleted || 0) + 1;
      saveState();
      notifyAndRefresh();
      const summary = getSummary();

      backdrop.innerHTML = `
        <div style="background:#0f1624;border:1px solid #d4af37;border-radius:16px;max-width:540px;width:100%;padding:26px;color:#f8fafc;box-shadow:0 25px 60px rgba(0,0,0,0.85);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="background:rgba(212,175,55,0.18);color:#fbbf24;font-size:11.5px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.06em;">
              ${timedOut ? '⏱️ 90s Recall Clock Complete' : '✓ Ebbinghaus Vault Updated'}
            </span>
            <button type="button" id="gm-drill-close-end" style="background:none;border:none;color:#94a3b8;font-size:24px;cursor:pointer;">&times;</button>
          </div>
          <h3 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:#ffffff;">
            ${stabilisedCount}/${queue.length} C1/C2 Structures Stabilised
          </h3>
          <p style="font-size:13.5px;color:#cbd5e1;margin:0 0 16px 0;line-height:1.5;">
            Updated Execution Band: <strong style="color:#fbbf24;">${summary.cefrBand}</strong> &bull; Dossier Code: <code style="color:#93c5fd;">${summary.code}</code>
          </p>
          <div style="background:#162032;border-left:4px solid #d4af37;padding:12px 14px;border-radius:8px;margin-bottom:18px;font-size:13px;line-height:1.5;color:#e2e8f0;">
            Spaced repetition locks syntactic frames into working memory—now let's make sure you deploy them naturally under live speaking and essay pressure.
          </div>
          <div style="display:grid;gap:10px;">
            <a href="index.html?dossier=${encodeURIComponent(summary.code)}#contact"
               style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;padding:13px;border-radius:10px;text-decoration:none;font-size:14px;">
              Book a 30-minute starter session (£35) &rarr;
            </a>
            <button type="button" id="gm-drill-open-dossier" style="background:#1e293b;border:1px solid #334155;color:#e2e8f0;font-weight:600;padding:11px;border-radius:10px;cursor:pointer;font-size:13px;">
              Inspect Full Radar Dossier
            </button>
          </div>
        </div>
      `;

      const closeEnd = document.getElementById('gm-drill-close-end');
      if (closeEnd) closeEnd.onclick = closeDrill;
      const openDosBtn = document.getElementById('gm-drill-open-dossier');
      if (openDosBtn) {
        openDosBtn.onclick = () => {
          closeDrill();
          openDrawer();
        };
      }
    };

    const renderCard = () => {
      if (currentIdx >= queue.length) {
        renderSummaryView(false);
        return;
      }
      const item = queue[currentIdx];
      const catInfo = CATEGORIES[item.category] || CATEGORIES.inversion;
      const words = item.targetAnswer.split(/\s+/);
      const distractors = ['having', 'been', 'had', 'would', 'much', 'little'].filter(
        (w) => !words.map((x) => x.toLowerCase()).includes(w)
      );
      const chipPool = [...words, ...distractors.slice(0, 2)].sort((a, b) => a.localeCompare(b));

      backdrop.innerHTML = `
        <div style="background:#0f1624;border:1px solid rgba(212,175,55,0.5);border-radius:16px;max-width:560px;width:100%;padding:24px;color:#f8fafc;box-shadow:0 25px 60px rgba(0,0,0,0.88);box-sizing:border-box;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11.5px;font-weight:700;color:#d4af37;text-transform:uppercase;letter-spacing:0.06em;">
              Mistake Vault ${currentIdx + 1} of ${queue.length} &bull; ${catInfo.shortLabel}
            </span>
            <div style="display:flex;align-items:center;gap:10px;">
              <span id="gm-drill-timer" style="background:#1e293b;border:1px solid #475569;color:#fbbf24;font-family:monospace;font-size:13px;font-weight:700;padding:3px 9px;border-radius:6px;">
                ⏱️ ${formatTime(remainingSec)}
              </span>
              <button type="button" id="gm-drill-close" aria-label="Close Recall Drill" style="background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;">&times;</button>
            </div>
          </div>

          <div style="background:#162032;border:1px solid #26354d;border-radius:10px;padding:13px;margin-bottom:12px;">
            <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">Original Prompt</div>
            <div style="font-size:14px;color:#e2e8f0;line-height:1.45;">"${item.prompt}"</div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:6px;">
            <span style="background:rgba(212,175,55,0.16);border:1px solid #d4af37;color:#fde68a;font-family:monospace;font-size:12px;font-weight:700;padding:4px 10px;border-radius:6px;">
              KEYWORD: ${item.keyword} (Unchanged &bull; 3–6 words)
            </span>
            <span style="font-size:11.5px;color:#94a3b8;">Tap chips or type below</span>
          </div>

          <div style="font-size:14.5px;color:#ffffff;font-weight:600;margin-bottom:12px;line-height:1.5;background:#111827;padding:12px;border-radius:8px;border:1px dashed #334155;">
            ${item.frame || item.prompt}
          </div>

          <div id="gm-drill-chips" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
            ${chipPool
              .map(
                (w) =>
                  `<button type="button" class="gm-chip-btn" data-word="${w}" style="background:#1e293b;border:1px solid #475569;color:#f1f5f9;padding:5px 10px;border-radius:6px;font-size:12.5px;cursor:pointer;">${w}</button>`
              )
              .join('')}
          </div>

          <div style="display:flex;gap:8px;margin-bottom:12px;">
            <input type="text" id="gm-drill-input" autocomplete="off" placeholder="Type the 3–6 word transformation..." style="flex:1;background:#090d16;border:1px solid #475569;color:#ffffff;padding:10px 12px;border-radius:8px;font-size:14px;" />
            <button type="button" id="gm-drill-check" style="background:#d4af37;color:#0b0f19;border:none;padding:10px 16px;border-radius:8px;font-weight:800;font-size:13px;cursor:pointer;">
              Check
            </button>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;">
            <button type="button" id="gm-drill-reveal" style="background:none;border:none;color:#93c5fd;font-size:12.5px;cursor:pointer;text-decoration:underline;padding:0;">
              👁️ Reveal Cambridge Model
            </button>
            <button type="button" id="gm-drill-clear" style="background:none;border:none;color:#94a3b8;font-size:12px;cursor:pointer;padding:0;">
              Clear Input
            </button>
          </div>

          <div id="gm-drill-feedback" style="display:none;margin-top:14px;padding:13px;border-radius:10px;font-size:13px;line-height:1.5;"></div>
        </div>
      `;

      const inputEl = document.getElementById('gm-drill-input');
      const checkBtn = document.getElementById('gm-drill-check');
      const revealBtn = document.getElementById('gm-drill-reveal');
      const clearBtn = document.getElementById('gm-drill-clear');
      const closeBtn = document.getElementById('gm-drill-close');
      const feedbackEl = document.getElementById('gm-drill-feedback');

      if (closeBtn) closeBtn.onclick = closeDrill;
      if (inputEl) inputEl.focus();

      backdrop.querySelectorAll('.gm-chip-btn').forEach((btn) => {
        btn.onclick = () => {
          const w = btn.getAttribute('data-word');
          if (!inputEl) return;
          inputEl.value = (inputEl.value.trim() ? inputEl.value.trim() + ' ' : '') + w;
          inputEl.focus();
        };
      });

      if (clearBtn) {
        clearBtn.onclick = () => {
          if (inputEl) {
            inputEl.value = '';
            inputEl.focus();
          }
        };
      }

      let resolved = false;
      const evaluate = (revealed) => {
        if (resolved) {
          currentIdx += 1;
          renderCard();
          return;
        }
        const rawUser = inputEl ? inputEl.value : '';
        const normUser = normalizeAnswer(rawUser);
        const accepted = (item.acceptedAnswers || [item.targetAnswer]).map(normalizeAnswer);
        const isCorrect = !revealed && accepted.includes(normUser);
        resolved = true;

        // Update Ebbinghaus schedule in state.mistakeVault
        const vaultItem = state.mistakeVault.find((m) => m.id === item.id);
        if (isCorrect) {
          stabilisedCount += 1;
          if (vaultItem) {
            vaultItem.repetitions = (vaultItem.repetitions || 0) + 1;
            vaultItem.intervalMs = DAY_MS * Math.pow(2.2, vaultItem.repetitions);
            vaultItem.nextReview = Date.now() + vaultItem.intervalMs;
          }
          if (state.skills[item.category]) {
            state.skills[item.category].attempts += 1;
            state.skills[item.category].correct += 1;
          }
        } else {
          if (vaultItem) {
            vaultItem.repetitions = 1;
            vaultItem.intervalMs = DAY_MS * 0.5;
            vaultItem.nextReview = Date.now() + DAY_MS * 0.5;
          }
          if (state.skills[item.category]) {
            state.skills[item.category].attempts += 1;
          }
        }
        saveState();

        if (feedbackEl) {
          feedbackEl.style.display = 'block';
          feedbackEl.style.background = isCorrect ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)';
          feedbackEl.style.border = isCorrect ? '1px solid rgba(16,185,129,0.45)' : '1px solid rgba(245,158,11,0.45)';
          const nextDays = vaultItem ? Math.max(1, Math.round((vaultItem.intervalMs || DAY_MS) / DAY_MS)) : 2;
          feedbackEl.innerHTML = `
            <div style="font-weight:800;color:${isCorrect ? '#34d399' : '#fbbf24'};margin-bottom:4px;">
              ${isCorrect ? `✓ Spot on! Next Ebbinghaus review scheduled in ${nextDays} days.` : `Cambridge Model: "${item.targetAnswer}"`}
            </div>
            <div style="color:#e2e8f0;margin-bottom:10px;">${item.explanation}</div>
            <button type="button" id="gm-drill-next" style="background:#2563eb;color:#ffffff;border:none;padding:8px 14px;border-radius:7px;font-weight:700;font-size:12.5px;cursor:pointer;">
              ${currentIdx + 1 < queue.length ? 'Next Decaying Structure &rarr;' : 'Finish Recall Drill &rarr;'}
            </button>
          `;
          const nextBtn = document.getElementById('gm-drill-next');
          if (nextBtn) {
            nextBtn.onclick = () => {
              currentIdx += 1;
              renderCard();
            };
            nextBtn.focus();
          }
        }
        if (checkBtn) {
          checkBtn.textContent = currentIdx + 1 < queue.length ? 'Next →' : 'Finish →';
        }
      };

      if (checkBtn) checkBtn.onclick = () => evaluate(false);
      if (revealBtn) revealBtn.onclick = () => evaluate(true);
      if (inputEl) {
        inputEl.onkeydown = (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            evaluate(false);
          }
        };
      }
    };

    timerId = setInterval(() => {
      remainingSec -= 1;
      const timerEl = document.getElementById('gm-drill-timer');
      if (timerEl) timerEl.textContent = `⏱️ ${formatTime(Math.max(0, remainingSec))}`;
      if (remainingSec <= 0) {
        renderSummaryView(true);
      }
    }, 1000);

    renderCard();
    window.trackFunnelEvent?.('recall_drill_started', { decayingCount: decaying.length });
  }

  function notifyAndRefresh() {
    renderFloatingPill();
    const backdrop = document.getElementById('gm-dossier-drawer-backdrop');
    if (backdrop && backdrop.classList.contains('gm-open')) {
      renderDrawerContent();
    }
    rewriteBookingLinks();
    try {
      window.dispatchEvent(new CustomEvent('gm:dossier-updated', { detail: getSummary() }));
    } catch (_) {}
  }

  const api = {
    getState: () => state,
    getSummary,
    getDossierCode,
    getDecayingMistakes,
    getWeakestSkill,
    recordAttempt,
    recordGameCompletion,
    addMistake,
    openDrawer,
    closeDrawer,
    openRecallDrill,
    rewriteBookingLinks,
    saveEmail: (email) => {
      if (!email) return false;
      state.savedEmail = String(email).trim();
      saveState();
      notifyAndRefresh();
      return true;
    }
  };

  window.CandidateDossier = api;

  const init = () => {
    saveState();
    renderFloatingPill();
    rewriteBookingLinks();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
