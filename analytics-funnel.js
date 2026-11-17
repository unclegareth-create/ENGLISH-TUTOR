/**
 * GarethEnglish.com - Conversion Funnel Telemetry & Attribution Tracker
 * Tracks: game_start -> diagnostic_gate_shown -> select_tier -> checkout_initiated
 */
(function () {
  'use strict';

  if (window.__gmFunnelBooted) return;
  window.__gmFunnelBooted = true;

  const makeNoop = () => {
    const fn = function () {};
    fn.__gmNoop = true;
    return fn;
  };

  if (!window.location.protocol.startsWith('http')) {
    if (typeof window.trackFunnelEvent !== 'function') window.trackFunnelEvent = makeNoop();
    if (typeof window.showDiagnosticGate !== 'function') window.showDiagnosticGate = makeNoop();
    return;
  }

  const currentPath = (window.location.pathname || '').toLowerCase();
  const metaOptOut = document.querySelector('meta[name="gm-no-analytics"][content="1"]');
  const isStudentPortal = /(^|\/)s(\/|$)/.test(currentPath);
  if (
    metaOptOut ||
    currentPath.includes('professor-west-study') ||
    isStudentPortal
  ) {
    if (typeof window.trackFunnelEvent !== 'function') window.trackFunnelEvent = makeNoop();
    if (typeof window.showDiagnosticGate !== 'function') window.showDiagnosticGate = makeNoop();
    return;
  }

  const FUNNEL_KEY = 'gm_attribution_trail';
  const LAST_FREE_TOOL_KEY = 'gm_last_free_tool';
  const AI_REFERRER_KEY = 'gm_ai_referrer';

  const RESEARCH_ARTICLE_RE = /(^|\/)(c1-syntactic-research-lab|cambridge-use-of-english-research|why-exam-templates-backfire|english-compression-1818-2026|spoken-vs-written-c1-slips|grammar-error-vs-style-audit)\.html/i;
  const EXAM_LAB_RE = /(^|\/)(lab|teacher-vault|fce-friendship-conditionals|cae-essay-builder(?:-v2)?|cpe-psychometrics-passives|ielts-essay-masterclass|fce-interactive-lesson|c1-syntactic-research-lab|cambridge-use-of-english-research|why-exam-templates-backfire|english-compression-1818-2026|spoken-vs-written-c1-slips|grammar-error-vs-style-audit|sprucefield-research|cpe-part4-top-10-patterns|c1-50-key-word-transformations-checklist|c1-report-proposal-builder|ielts-task1-academic-verbs-drill|c1-part4-deconstructor|ielts-c1-syntax-workbench|speaking-part2-arc-trainer|academy|fordow-hash-c1-pack|preply-worksheets-backup\/[^/]+)\.html/i;
  const STUDY_GUIDE_RE = /(^|\/)(cpe-inversion|cpe-part4-top-10-patterns|ielts-7-syllabus|ielts-writing-task-2|c1-c2-common-mistakes|how-i-mark|video-courses|key-word-transformations|word-formation|ielts-c1-structural-shifts|ielts-speaking-part-3|business-english-meetings|c1-syntactic-research-lab|cambridge-use-of-english-research|why-exam-templates-backfire|english-compression-1818-2026|spoken-vs-written-c1-slips|grammar-error-vs-style-audit)\.(html|pdf)/i;
  const FREE_GAME_RE = /(^|\/)(between-the-lines|grammar-crypt(?:-3d)?|reactor|factory|boardroom|phrasal-verbs|phrasal-reactor|word-factory|boardroom-pitch|chronicle-88|abyssal-bathysphere|gareth_english_arcade_observatory|c1_arcade_showcase)\.html/i;

  function getTrail() {
    try {
      return JSON.parse(localStorage.getItem(FUNNEL_KEY) || '[]');
    } catch (e) {
      return [];
    }
  }

  function getLastFreeTool() {
    try {
      return localStorage.getItem(LAST_FREE_TOOL_KEY) || 'direct';
    } catch (e) {
      return 'direct';
    }
  }

  function setLastFreeTool(toolSlug) {
    if (!toolSlug) return;
    try {
      localStorage.setItem(LAST_FREE_TOOL_KEY, String(toolSlug).replace(/\.(html|pdf)$/i, ''));
    } catch (e) {}
  }

  function getAiReferrer() {
    try {
      return sessionStorage.getItem(AI_REFERRER_KEY) || localStorage.getItem(AI_REFERRER_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  const enqueueOrSendGoatCounter = (gcPath, gcTitle) => {
    if (typeof window.__gmEnqueueGoatCounter === 'function') {
      try {
        window.__gmEnqueueGoatCounter(gcPath, gcTitle);
      } catch (e) {}
    } else if (window.goatcounter && typeof window.goatcounter.count === 'function') {
      try {
        window.goatcounter.count({ path: gcPath, title: gcTitle, event: true });
      } catch (e) {}
    } else {
      window.__gmGcQueue = window.__gmGcQueue || [];
      window.__gmGcQueue.push([gcPath, gcTitle]);
    }
  };

  const currentSlug = (currentPath.split('/').pop() || '').split(/[?#]/)[0];
  if (RESEARCH_ARTICLE_RE.test(currentPath) || EXAM_LAB_RE.test(currentPath) || STUDY_GUIDE_RE.test(currentPath) || FREE_GAME_RE.test(currentPath)) {
    setLastFreeTool(currentSlug);
  }
  if (RESEARCH_ARTICLE_RE.test(currentPath) && !window.__gmResearchViewTracked) {
    window.__gmResearchViewTracked = true;
    const researchSlug = currentSlug.replace(/\.html$/i, '');
    enqueueOrSendGoatCounter('article: ' + currentSlug, 'Research Article: ' + researchSlug);
    if (typeof window.gtag === 'function') {
      const aiSrc = getAiReferrer();
      window.gtag('event', 'research_article_view', {
        article: researchSlug,
        landing_page: currentSlug,
        ...(aiSrc ? { ai_source: aiSrc } : {})
      });
    }
  }

  if (typeof window.trackFunnelEvent !== 'function' || window.trackFunnelEvent.__gmNoop) {
    window.trackFunnelEvent = function (eventName, params) {
      params = params || {};
      if (eventName === 'research_tool_used' && !params.article && RESEARCH_ARTICLE_RE.test(currentPath)) {
        params = { article: currentSlug.replace(/\.html$/i, ''), ...params };
      }
      if (params.article || eventName === 'research_tool_used') {
        setLastFreeTool(params.article || currentSlug);
      }
      const lastFreeTool = getLastFreeTool();
      const aiReferrer = getAiReferrer();
      const payload = {
        event: eventName,
        path: window.location.pathname,
        last_free_tool: lastFreeTool,
        ...(aiReferrer ? { ai_referrer: aiReferrer } : {}),
        timestamp: new Date().toISOString(),
        ...params
      };

      // 1. Save to local attribution trail (last 10 touchpoints before booking)
      const trail = getTrail();
      trail.push(payload);
      if (trail.length > 10) trail.shift();
      try {
        localStorage.setItem(FUNNEL_KEY, JSON.stringify(trail));
      } catch (e) {}

      // 2. Forward to GA4 if present
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, {
          last_free_tool: lastFreeTool,
          ...(aiReferrer ? { ai_referrer: aiReferrer } : {}),
          ...params
        });
      }

      // 3. Forward custom tags to Microsoft Clarity if present
      if (typeof window.clarity === 'function') {
        window.clarity('set', 'last_funnel_step', eventName);
        if (params.tier) window.clarity('set', 'selected_tier', params.tier);
        if (params.tool) window.clarity('set', 'research_tool', params.tool);
        if (aiReferrer) window.clarity('set', 'ai_referrer', aiReferrer);
      }

      // 4. Forward to GoatCounter once (or queue for analytics.js)
      const detailSegment = params.tier
        ? '/' + params.tier
        : (params.article || params.tool ? '/' + [params.article, params.tool].filter(Boolean).join('/') : '');
      const gcPath = eventName + detailSegment + (lastFreeTool ? '/from=' + lastFreeTool : '') + (aiReferrer ? '/ai=' + aiReferrer : '');
      const gcTitle = 'Funnel Event: ' + eventName + (params.tool ? ' (' + params.tool + ')' : '');
      enqueueOrSendGoatCounter(gcPath, gcTitle);

      // 5. Console trace on localhost / staging
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        console.info('[GM Funnel Telemetry]', eventName, payload);
      }
    };
  }

  /**
   * GarethEnglish.com - In-Game Clinical Diagnostic Gate
   * Triggers on game completion to convert free players into £35 Live Diagnostic / Audit leads.
   */
  if (typeof window.showDiagnosticGate !== 'function' || window.showDiagnosticGate.__gmNoop) {
    window.showDiagnosticGate = function (opts) {
      if (isStudentPortal) return;
      opts = opts || {};
      const esc = (str) => String(str || '').replace(/[&<>"']/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
      }[c]));

      const rawGameName = String(opts.gameName || 'Interactive Skill Test');
      const score = typeof opts.score === 'number' ? opts.score : 0;
      const maxScore = typeof opts.maxScore === 'number' ? opts.maxScore : 10;
      const rawWeakArea = String(opts.weakArea || 'C1/C2 Linguistic Precision under Time Pressure');
      const rawExamImpact = String(opts.examImpact || 'In Cambridge C1/C2 and IELTS examinations, hesitation and syntax friction reduce your Lexical Resource & Grammar scores by up to a full band.');
      const onReplay = typeof opts.onReplay === 'function' ? opts.onReplay : null;

      // Feed score into Unified Candidate Dossier once per completion
      const recordKey = `${rawGameName}|${score}|${maxScore}`;
      const nowTs = Date.now();
      const prevRec = window.__gmLastDossierCompletion;
      let dossierSummary = null;
      if (prevRec && prevRec.key === recordKey && nowTs - prevRec.ts < 2000) {
        dossierSummary = window.CandidateDossier?.getSummary?.() || prevRec.summary || null;
      } else {
        dossierSummary = window.CandidateDossier?.recordGameCompletion?.({
          gameName: rawGameName,
          score,
          maxScore,
          weakArea: rawWeakArea,
          category: opts.category
        }) || null;
        window.__gmLastDossierCompletion = { key: recordKey, ts: nowTs, summary: dossierSummary };
      }

      const pct = Math.max(0, Math.min(100, Math.round((score / (maxScore || 1)) * 100)));
      const cefrEstimate = dossierSummary?.cefrBand || (pct >= 85 ? 'C1 Advanced / C2 Ready' : pct >= 65 ? 'B2 Upper-Intermediate (Borderline C1)' : 'B1/B2 Transition');
      const rawDiagnosedWeakness = String(dossierSummary?.weakestSkill || rawWeakArea);
      const diagnosedAccuracy = typeof dossierSummary?.weakestAccuracy === 'number' ? dossierSummary.weakestAccuracy : pct;
      const dossierCode = String(dossierSummary?.code || '');
      const savedEmail = String(window.CandidateDossier?.getState?.()?.savedEmail || '');
      const hasRecallDrill = typeof window.CandidateDossier?.openRecallDrill === 'function';

      const dossierParam = dossierCode ? `&dossier=${encodeURIComponent(dossierCode)}` : '';
      const trialHref = `index.html?offer=live_diagnostic_35${dossierParam}#cal-booking-box`;
      const auditHref = `index.html?offer=async_essay_audit_29${dossierParam}#enquiry-card`;
      const freeHref = `index.html?tier=waitlist_free${dossierParam}#enquiry-card`;

      const gameName = esc(rawGameName);
      const cefrEstimateEsc = esc(cefrEstimate);
      const diagnosedWeakness = esc(rawDiagnosedWeakness);
      const examImpact = esc(rawExamImpact);
      const dossierCodeEsc = esc(dossierCode);
      const savedEmailEsc = esc(savedEmail);

      if (currentSlug) {
        setLastFreeTool(currentSlug);
      }

      // Fire telemetry event
      window.trackFunnelEvent('diagnostic_gate_shown', { gameName: rawGameName, score, maxScore, pct, cefrEstimate, dossierCode });

      const existing = document.getElementById('gm-diag-overlay');
      if (existing) existing.remove();

      const recallButtonHtml = hasRecallDrill
        ? `<button id="gm-gate-recall-btn" type="button"
               style="display:block;width:100%;text-align:center;background:rgba(212,175,55,0.14);border:1px solid #d4af37;color:#fde68a;font-weight:700;padding:11px;border-radius:10px;font-size:13.5px;cursor:pointer;">
              ⚡ Run 90s Mistake Recall Drill (Ebbinghaus Vault)
            </button>`
        : '';

      const modalHtml = `
        <div id="gm-diag-overlay" role="dialog" aria-modal="true" aria-label="Practice Score Summary" style="position:fixed;inset:0;background:rgba(10,15,28,0.88);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;">
          <div style="background:#111827;border:1px solid #374151;border-radius:16px;max-width:540px;width:100%;max-height:92vh;overflow-y:auto;padding:26px;color:#f9fafb;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);box-sizing:border-box;">
            
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <span style="background:#1e3a8a;color:#93c5fd;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">
                Practice Score &bull; ${gameName}
              </span>
              <button id="gm-diag-close" type="button" aria-label="Close" style="background:none;border:none;color:#9ca3af;font-size:24px;line-height:1;cursor:pointer;padding:4px;">&times;</button>
            </div>

            <h3 style="font-size:22px;font-weight:800;margin:0 0 6px 0;color:#ffffff;line-height:1.2;">
              Your Score: ${score}/${maxScore} (${pct}%)
            </h3>
            <p style="margin:0 0 14px 0;font-size:14px;color:#d1d5db;">
              Estimated Level: <strong style="color:#fbbf24;">${cefrEstimateEsc}</strong>${dossierCodeEsc ? ` &bull; <code style="color:#93c5fd;font-size:12px;">${dossierCodeEsc}</code>` : ''}
            </p>

            <div style="background:#1f2937;border-left:4px solid #f59e0b;padding:13px;border-radius:8px;margin-bottom:16px;font-size:13.5px;line-height:1.5;">
              <strong style="color:#fcd34d;display:block;margin-bottom:4px;">Focus Area: ${diagnosedWeakness} (${diagnosedAccuracy}% Accuracy)</strong>
              <span style="color:#e5e7eb;">${examImpact}</span>
            </div>

            <div style="background:#162032;border:1px solid #26354d;border-radius:10px;padding:12px;margin-bottom:16px;">
              <div style="font-size:12px;font-weight:700;color:#f8fafc;margin-bottom:6px;">
                📩 Save Score &amp; Unlock C1/C2 Cheat Sheet
              </div>
              <form id="gm-gate-email-form" action="https://formspree.io/f/mvkgrwvj" method="POST" style="display:flex;gap:6px;">
                <input type="email" id="gm-gate-email-input" name="email" required value="${savedEmailEsc}" placeholder="Enter your email to save report..." style="flex:1;background:#0b0f19;border:1px solid #374151;color:#ffffff;padding:8px 10px;border-radius:7px;font-size:13px;" />
                <button type="submit" style="background:#d4af37;color:#0b0f19;border:none;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:800;cursor:pointer;white-space:nowrap;">
                  Save &amp; Unlock
                </button>
              </form>
              <div id="gm-gate-email-confirm" role="status" style="display:none;font-size:12px;color:#34d399;margin-top:6px;line-height:1.45;">
                ✓ Saved to your Lab Dossier! <a href="cpe-inversion.html" style="color:#fbbf24;text-decoration:underline;">Open C1/C2 Cheat Sheet &rarr;</a>
              </div>
              <div id="gm-gate-email-error" role="alert" style="display:none;font-size:12px;color:#fca5a5;margin-top:6px;line-height:1.45;"></div>
            </div>

            <p style="font-size:13.5px;color:#d1d5db;margin-bottom:14px;line-height:1.5;">
              Your practice score shows <strong style="color:#fbbf24;">${diagnosedAccuracy}%</strong> accuracy on <strong style="color:#ffffff;">${diagnosedWeakness}</strong>. Work through these exact patterns in a live session or get written essay feedback:
            </p>

            <div style="display:grid;gap:10px;">
              <a href="${trialHref}"
                 data-gate-cta="trial_35"
                 style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;box-shadow:0 4px 6px -1px rgba(37,99,235,0.4);">
                Book a 30-Min Starter Session with Gareth (&pound;35) &rarr;
              </a>
              <a href="${auditHref}"
                 data-gate-cta="async_audit_29"
                 style="display:block;text-align:center;background:#1f2937;border:1px solid #10b981;color:#a7f3d0;font-weight:700;padding:12px;border-radius:10px;text-decoration:none;font-size:14px;">
                Get 48h Written Essay Feedback (&pound;29) &rarr;
              </a>
              ${recallButtonHtml}
              <a href="${freeHref}"
                 data-gate-cta="waitlist_free"
                 style="display:block;text-align:center;color:#93c5fd;font-weight:600;padding:6px 10px;text-decoration:underline;font-size:13px;">
                Or send 1 short paragraph for a free 24h red-pen note &rarr;
              </a>
            </div>

            <button id="gm-diag-replay" type="button" style="margin-top:12px;width:100%;background:none;border:none;color:#9ca3af;font-size:13px;cursor:pointer;text-decoration:underline;">
              Play again to beat ${score}/${maxScore}
            </button>
          </div>
        </div>
      `;

      const previousFocus = document.activeElement;
      document.body.insertAdjacentHTML('beforeend', modalHtml);
      const overlay = document.getElementById('gm-diag-overlay');
      const closeBtn = document.getElementById('gm-diag-close');
      const replayBtn = document.getElementById('gm-diag-replay');
      const recallBtn = document.getElementById('gm-gate-recall-btn');
      const emailForm = document.getElementById('gm-gate-email-form');

      const keyHandler = (e) => {
        if (e.key === 'Escape') {
          cleanup();
          return;
        }
        if (e.key === 'Tab' && overlay) {
          const focusables = overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])');
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      const cleanup = () => {
        document.removeEventListener('keydown', keyHandler);
        if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (previousFocus && typeof previousFocus.focus === 'function') {
          try { previousFocus.focus(); } catch (_) {}
        }
      };

      if (closeBtn) {
        closeBtn.onclick = cleanup;
        closeBtn.focus();
      }
      if (replayBtn) {
        replayBtn.onclick = () => {
          window.trackFunnelEvent('game_replay_clicked', { gameName: rawGameName, score });
          cleanup();
          if (onReplay) onReplay();
        };
      }
      if (recallBtn) {
        recallBtn.onclick = () => {
          window.trackFunnelEvent('gate_recall_drill_clicked', { gameName: rawGameName, score, dossierCode });
          cleanup();
          if (window.CandidateDossier && typeof window.CandidateDossier.openRecallDrill === 'function') {
            window.CandidateDossier.openRecallDrill();
          }
        };
      }
      if (overlay) {
        overlay.querySelectorAll('[data-gate-cta]').forEach((el) => {
          el.addEventListener('click', () => {
            window.trackFunnelEvent?.('game_cta_clicked', {
              gameName: rawGameName,
              target: el.getAttribute('data-gate-cta'),
              pct,
              dossierCode
            });
          });
        });
      }
      if (emailForm) {
        emailForm.onsubmit = async (e) => {
          e.preventDefault();
          if (emailForm.dataset.submitting === 'true') return;
          const input = document.getElementById('gm-gate-email-input');
          const submitBtn = emailForm.querySelector('button[type="submit"]');
          const confirmEl = document.getElementById('gm-gate-email-confirm');
          const errorEl = document.getElementById('gm-gate-email-error');
          const email = input ? input.value.trim() : '';
          if (!email) return;

          emailForm.dataset.submitting = 'true';
          if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Saving...';
          }
          if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.textContent = '';
          }

          const aiReferrer = getAiReferrer();
          const formData = typeof FormData === 'function' ? new FormData() : null;
          if (formData) {
            formData.append('email', email);
            formData.append('_subject', `Diagnostic Gate Report & Cheat Sheet: ${rawGameName} (${pct}%)`);
            formData.append('form_source', 'diagnostic_gate');
            formData.append('game_name', rawGameName);
            formData.append('score', `${score}/${maxScore} (${pct}%)`);
            formData.append('cefr_estimate', cefrEstimate);
            formData.append('focus_area', `${rawDiagnosedWeakness} (${diagnosedAccuracy}%)`);
            if (dossierCode) formData.append('dossier_code', dossierCode);
            formData.append('last_free_tool', getLastFreeTool());
            if (aiReferrer) formData.append('ai_referrer', aiReferrer);
            formData.append('page_path', window.location.pathname || '');
          }

          try {
            if (typeof window.fetch !== 'function') throw new Error('Fetch unavailable');
            const response = await window.fetch('https://formspree.io/f/mvkgrwvj', {
              method: 'POST',
              headers: { Accept: 'application/json' },
              body: formData
            });
            if (!response || !response.ok) {
              throw new Error('Could not send report');
            }

            window.CandidateDossier?.saveEmail?.(email);
            window.trackFunnelEvent('gate_email_captured', { gameName: rawGameName, pct, dossierCode });

            if (confirmEl) {
              confirmEl.style.display = 'block';
              confirmEl.innerHTML = `✓ Sent &amp; saved to your Lab Dossier (<strong>${esc(email)}</strong>)! <a href="cpe-inversion.html" style="color:#fbbf24;text-decoration:underline;">Open C1/C2 Cheat Sheet &rarr;</a>`;
            }
          } catch (_) {
            if (confirmEl) confirmEl.style.display = 'none';
            if (errorEl) {
              const mailSubject = encodeURIComponent(`Diagnostic Report & Cheat Sheet (${rawGameName})`);
              errorEl.style.display = 'block';
              errorEl.innerHTML = `Your email could not be sent automatically — it is still in the box above. Please try again, email <a href="mailto:gareth@garethenglish.com?subject=${mailSubject}" style="color:#fca5a5;text-decoration:underline;">gareth@garethenglish.com</a>, or <a href="cpe-inversion.html" style="color:#fbbf24;text-decoration:underline;">open the C1/C2 Cheat Sheet anyway &rarr;</a>`;
            }
          } finally {
            delete emailForm.dataset.submitting;
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.textContent = 'Save & Unlock';
            }
          }
        };
      }

      document.addEventListener('keydown', keyHandler);
    };
  }

  // Auto-bind all elements with [data-track] attributes
  if (!window.__gmDataTrackBound) {
    window.__gmDataTrackBound = true;
    document.addEventListener('click', function (e) {
      if (e.__gmFunnelTracked) return;
      const target = e.target.closest('[data-track]');
      if (!target) return;

      const eventName = target.getAttribute('data-track');
      if (!eventName || eventName === 'articles') return;
      const tier = target.getAttribute('data-tier') || null;
      window.trackFunnelEvent(eventName, {
        tier: tier,
        cta_text: (target.innerText || '').trim().slice(0, 50)
      });
    });
  }

  // Load Teacher Classroom & White-Label Studio Runtime only when relevant
  const needsTeacherRuntime = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.has('teacher_key') || params.get('wl') === '1') return true;
      if (localStorage.getItem('gm_teacher_license_tier') || localStorage.getItem('gm_teacher_license_hash')) return true;
      if (document.querySelector('.lab-vault-mount, #da-gate-veil, #da-hub-access-code-btn')) return true;
      return false;
    } catch (_) {
      return false;
    }
  };

  if (!window.GarethTeacherWhiteLabel && !document.querySelector('script[src*="teacher-white-label.js"]') && needsTeacherRuntime()) {
    const wlScript = document.createElement('script');
    wlScript.src = 'teacher-white-label.js';
    wlScript.defer = true;
    document.head.appendChild(wlScript);
  }

  // Dynamically load Unified Candidate Dossier & Ebbinghaus Mistake Vault runtime
  if (!window.CandidateDossier && !document.querySelector('script[src*="dossier.js"]')) {
    const dossierScript = document.createElement('script');
    dossierScript.src = 'dossier.js';
    dossierScript.defer = true;
    document.head.appendChild(dossierScript);
  }
})();

