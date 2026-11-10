/* ==========================================================
   Analytics, Click Tracking (GoatCounter + Optional GA4) &
   LLM / AI Referral Telemetry
   ----------------------------------------------------------
   GoatCounter is free for personal sites and sets NO cookies,
   so no cookie-consent banner is needed under UK/EU rules.
   If a GA4 Measurement ID (G-XXXXXXXXXX) is configured below
   or via window.GA_MEASUREMENT_ID, GA4 loads with cookieless
   Consent Mode v2 defaults (analytics_storage: 'denied').
   Also tracks AI/LLM referrals (ChatGPT, Perplexity, Claude,
   Gemini, Copilot) and attaches attribution to enquiries.
   ========================================================== */
(() => {
    'use strict';

    // Local file:/// Protocol Guard:
    // Prevent browser hanging on external analytics when files are opened locally off disk.
    if (!window.location.protocol.startsWith('http')) {
        window.trackFunnelEvent = function () {};
        window.showDiagnosticGate = function () {};
        return;
    }

    // UK ICO Children's Code (Age-Appropriate Design Code) & Private Portal Guard:
    // Never load external analytics or store attribution trails on Young Learners pages (ages 6-12),
    // private 1-to-1 student portals (/s/*), or pages explicitly opting out via meta tag.
    const currentPath = (window.location.pathname || '').toLowerCase();
    const metaOptOut = document.querySelector('meta[name="gm-no-analytics"][content="1"]');
    if (
        metaOptOut ||
        currentPath.includes('professor-west-study') ||
        /(^|\/)s(\/|$)/.test(currentPath)
    ) {
        window.trackFunnelEvent = function () {};
        window.showDiagnosticGate = function () {};
        return;
    }

    const GOATCOUNTER_CODE = 'garethenglish';   // <-- Registered GoatCounter site code
    const GA4_MEASUREMENT_ID = window.GA_MEASUREMENT_ID || ''; // <-- Optional GA4 ID (e.g. 'G-XXXXXXXXXX')
    const LAST_FREE_TOOL_KEY = 'gm_last_free_tool';
    const AI_REFERRER_KEY = 'gm_ai_referrer';

    // Optional Google Analytics 4 (GA4) Bootstrap with UK/EU Cookieless Consent Mode v2
    if (GA4_MEASUREMENT_ID && /^G-[A-Z0-9]+$/i.test(GA4_MEASUREMENT_ID) && typeof window.gtag !== 'function') {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', {
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            analytics_storage: 'denied',
            wait_for_update: 500
        });
        window.gtag('js', new Date());
        window.gtag('config', GA4_MEASUREMENT_ID, {
            anonymize_ip: true,
            allow_google_signals: false,
            allow_ad_personalization_signals: false
        });
        const gaScript = document.createElement('script');
        gaScript.async = true;
        gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
        document.head.appendChild(gaScript);
    }

    // Detect & Persist LLM / AI Search Engine Referrals (ChatGPT, Perplexity, Claude, Gemini, Copilot, etc.)
    const detectAiSource = () => {
        try {
            const params = new URLSearchParams(window.location.search);
            const utmSource = (params.get('utm_source') || params.get('ref') || '').toLowerCase();
            const ref = (document.referrer || '').toLowerCase();

            const aiMatchers = [
                { id: 'chatgpt', re: /chatgpt\.com|chat\.openai\.com|openai/ },
                { id: 'perplexity', re: /perplexity\.ai|perplexity/ },
                { id: 'claude', re: /claude\.ai|anthropic/ },
                { id: 'gemini', re: /gemini\.google\.com|bard\.google\.com/ },
                { id: 'copilot', re: /copilot\.microsoft\.com|bing\.com\/chat/ },
                { id: 'you_ai', re: /you\.com/ },
                { id: 'phind', re: /phind\.com/ },
                { id: 'mistral', re: /chat\.mistral\.ai/ },
                { id: 'deepseek', re: /chat\.deepseek\.com/ },
                { id: 'grok', re: /grok\.com|x\.ai/ }
            ];

            for (const m of aiMatchers) {
                if (m.re.test(utmSource) || m.re.test(ref)) {
                    const existing = sessionStorage.getItem(AI_REFERRER_KEY);
                    try { localStorage.setItem(AI_REFERRER_KEY, m.id); } catch (_) {}
                    try { sessionStorage.setItem(AI_REFERRER_KEY, m.id); } catch (_) {}
                    return { source: m.id, isNewSessionHit: existing !== m.id, rawRef: ref || utmSource };
                }
            }
        } catch (_) {}
        return null;
    };

    const getAiSource = () => {
        try {
            return sessionStorage.getItem(AI_REFERRER_KEY) || localStorage.getItem(AI_REFERRER_KEY) || '';
        } catch (_) {
            return '';
        }
    };

    const detectedAi = detectAiSource();

    const FREE_GAME_RE = /(^|\/)(grammar-crypt(?:-3d)?|reactor|factory|boardroom|phrasal-reactor|word-factory|boardroom-pitch|abyssal-bathysphere|darjeeling-signal-box|midnight-study-desk|blueprint-vault|chronicle-88|myst-island|operation-nobody|midnight-radio|belfast-tape-lab)\.html/i;
    const EXAM_LAB_RE = /(^|\/)(lab|teacher-vault|fce-friendship-conditionals|cae-essay-builder(?:-v2)?|cpe-psychometrics-passives|ielts-essay-masterclass|fce-interactive-lesson|c1-syntactic-research-lab|sprucefield-research|cpe-part4-top-10-patterns|c1-50-key-word-transformations-checklist|c1-report-proposal-builder|ielts-task1-academic-verbs-drill|fordow-hash-c1-pack|preply-worksheets-backup\/[^/]+)\.html/i;
    const FREE_GOTHIC_RE = /(^|\/)(dracula-unit[123]-[a-z-]+|frankenstein-unit[123]-[a-z-]+|jekyll-unit[123]-[a-z-]+|baskerville-unit[123]-[a-z-]+|alice-unit1[345]-[a-z-]+|the-gothic-canon-c1-c2-compendium|dark-academia-world)\.html/i;
    const STUDY_GUIDE_RE = /(^|\/)(cpe-inversion|cpe-part4-top-10-patterns|ielts-7-syllabus|ielts-writing-task-2|c1-c2-common-mistakes|how-i-mark|video-courses|key-word-transformations|word-formation|ielts-c1-structural-shifts|ielts-speaking-part-3|business-english-meetings)\.(html|pdf)/i;

    const getLastFreeTool = () => {
        try {
            return localStorage.getItem(LAST_FREE_TOOL_KEY) || 'direct';
        } catch (e) {
            return 'direct';
        }
    };

    const setLastFreeTool = (toolSlug) => {
        if (!toolSlug) return;
        try {
            localStorage.setItem(LAST_FREE_TOOL_KEY, String(toolSlug).replace(/\.(html|pdf)$/i, ''));
        } catch (e) {}
    };

    // Auto-record if the visitor lands directly on a free game, exam lab, free Gothic lesson, or study guide
    const currentSlug = (currentPath.split('/').pop() || '').split(/[?#]/)[0];
    if (
        FREE_GAME_RE.test(currentPath) ||
        EXAM_LAB_RE.test(currentPath) ||
        FREE_GOTHIC_RE.test(currentPath) ||
        STUDY_GUIDE_RE.test(currentPath)
    ) {
        setLastFreeTool(currentSlug);
    }

    if (GOATCOUNTER_CODE) {
        // Load the GoatCounter counter script (cookieless, privacy-friendly).
        const s = document.createElement('script');
        s.async = true;
        s.src = 'https://gc.zgo.at/count.js';
        s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
        document.head.appendChild(s);

        // Events clicked before the counter script has loaded are queued, then sent.
        const queue = [];
        const send = (name) => {
            const gc = window.goatcounter;
            if (gc && typeof gc.count === 'function') {
                gc.count({ path: name, title: name, event: true });
            } else {
                queue.push(name);
            }
        };
        s.addEventListener('load', () => { while (queue.length) send(queue.shift()); });

        // Fire LLM / AI Referral Telemetry when a visitor lands from ChatGPT, Perplexity, Claude, Gemini, Copilot, etc.
        if (detectedAi && detectedAi.isNewSessionHit) {
            const landingPage = currentSlug || 'index.html';
            send(`ai-referral: ${detectedAi.source} -> ${landingPage}`);
            if (typeof window.gtag === 'function') {
                window.gtag('event', 'ai_referral_landing', {
                    ai_source: detectedAi.source,
                    landing_page: landingPage
                });
            }
        }

        // Attach AI referral & attribution trail into contact/booking forms automatically
        const enrichFormsWithAttribution = () => {
            const aiSrc = getAiSource();
            const lastTool = getLastFreeTool();
            const forms = document.querySelectorAll('#contact-form, #lead-form');
            forms.forEach((form) => {
                if (aiSrc && !form.querySelector('input[name="ai_referrer"]')) {
                    const inp = document.createElement('input');
                    inp.type = 'hidden';
                    inp.name = 'ai_referrer';
                    inp.value = aiSrc;
                    form.appendChild(inp);
                }
                if (lastTool && !form.querySelector('input[name="last_free_tool"]')) {
                    const inp = document.createElement('input');
                    inp.type = 'hidden';
                    inp.name = 'last_free_tool';
                    inp.value = lastTool;
                    form.appendChild(inp);
                }
            });
        };
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', enrichFormsWithAttribution);
        } else {
            enrichFormsWithAttribution();
        }

        const label = (el) => (el.textContent || el.getAttribute('aria-label') || '')
            .replace(/\s+/g, ' ').trim().slice(0, 60) || 'link';
        const page = (href) => href.split('/').pop().split(/[?#]/)[0] || 'index.html';

        // One delegated listener covers every link on the page, including the mobile menu.
        document.addEventListener('click', (e) => {
            const a = e.target.closest('a[href]');
            if (!a) return;
            const href = a.getAttribute('href');

            if (href.includes('buy.stripe.com/9B63cuadm8gs5Mhc4Xb3q01') || a.getAttribute('data-tier') === 'gothic_canon_24') {
                const fromTool = getLastFreeTool();
                send(`course-checkout: from=${fromTool}`);
                if (typeof window.trackFunnelEvent === 'function') {
                    window.trackFunnelEvent('course_checkout_clicked', { tier: 'gothic_canon_24', from_free_tool: fromTool });
                }
            } else if (/(^|\/)dark-academia-index\.html/i.test(href)) {
                const fromTool = getLastFreeTool();
                send(`course-hub: from=${fromTool}`);
                if (typeof window.trackFunnelEvent === 'function') {
                    window.trackFunnelEvent('course_hub_clicked', { tier: 'gothic_canon_24', from_free_tool: fromTool });
                }
            } else if (href === '#contact' || href.includes('#contact')) {
                send(`booking-cta: ${label(a)} (from=${getLastFreeTool()})`);
            } else if (href.includes('cal.com/gareth-montgomery-jgaefz')) {
                send(`booking-external: cal.com (from=${getLastFreeTool()})`);
            } else if (href.includes('#prosody-lab')) {
                setLastFreeTool('prosody-lab');
                send('study-guide: prosody-lab');
            } else if (EXAM_LAB_RE.test(href)) {
                setLastFreeTool(page(href));
                send(`exam-lab: ${page(href)}`);
            } else if (FREE_GAME_RE.test(href)) {
                setLastFreeTool(page(href));
                send(`game: ${page(href)}`);
            } else if (FREE_GOTHIC_RE.test(href)) {
                setLastFreeTool(page(href));
                send(`free-gothic-lesson: ${page(href)}`);
            } else if (STUDY_GUIDE_RE.test(href) || a.closest('[data-track="articles"]')) {
                setLastFreeTool(page(href));
                send(`article: ${page(href)}`);
            }
        });

        // Form submission tracking
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (!form) return;
            if (form.closest('#cheat-sheet') || form.closest('#arcade-signup')) {
                setLastFreeTool('cheat-sheet-study-pack');
                send('lead-magnet: cheat-sheet-download');
            } else if (form.id === 'contact-form' || form.id === 'lead-form') {
                send(`contact-form: enquiry-sent (from=${getLastFreeTool()})`);
            }
        });
    }

    /* ---------- Conversion Funnel Telemetry & Diagnostic Gate ---------- */
    if (!window.trackFunnelEvent) {
        const FUNNEL_KEY = 'gm_attribution_trail';

        const getTrail = () => {
            try {
                return JSON.parse(localStorage.getItem(FUNNEL_KEY) || '[]');
            } catch (e) {
                return [];
            }
        };

        window.trackFunnelEvent = function (eventName, params) {
            params = params || {};
            const lastFreeTool = getLastFreeTool();
            const aiReferrer = getAiSource();
            const payload = {
                event: eventName,
                path: window.location.pathname,
                last_free_tool: lastFreeTool,
                ...(aiReferrer ? { ai_referrer: aiReferrer } : {}),
                timestamp: new Date().toISOString(),
                ...params
            };

            const trail = getTrail();
            trail.push(payload);
            if (trail.length > 10) trail.shift();
            try {
                localStorage.setItem(FUNNEL_KEY, JSON.stringify(trail));
            } catch (e) {}

            if (typeof window.gtag === 'function') {
                window.gtag('event', eventName, {
                    last_free_tool: lastFreeTool,
                    ...(aiReferrer ? { ai_referrer: aiReferrer } : {}),
                    ...params
                });
            }
            if (typeof window.clarity === 'function') {
                window.clarity('set', 'last_funnel_step', eventName);
                if (params.tier) window.clarity('set', 'selected_tier', params.tier);
                if (aiReferrer) window.clarity('set', 'ai_referrer', aiReferrer);
            }
            if (window.goatcounter && typeof window.goatcounter.count === 'function') {
                try {
                    window.goatcounter.count({
                        path: eventName + (params.tier ? '/' + params.tier : '') + (lastFreeTool ? '/from=' + lastFreeTool : '') + (aiReferrer ? '/ai=' + aiReferrer : ''),
                        title: 'Funnel Event: ' + eventName,
                        event: true
                    });
                } catch (e) {}
            }
            if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
                console.info('[GM Funnel Telemetry]', eventName, payload);
            }
        };

        window.showDiagnosticGate = function (opts) {
            opts = opts || {};
            const esc = (str) => String(str || '').replace(/[&<>"']/g, (c) => ({
                '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
            }[c]));
            const gameName = esc(opts.gameName || 'Interactive Skill Test');
            const score = typeof opts.score === 'number' ? opts.score : 0;
            const maxScore = typeof opts.maxScore === 'number' ? opts.maxScore : 10;
            const weakArea = esc(opts.weakArea || 'C1/C2 Linguistic Precision under Time Pressure');
            const examImpact = esc(opts.examImpact || 'In Cambridge C1/C2 and IELTS examinations, hesitation and syntax friction reduce your Lexical Resource & Grammar scores by up to a full band.');
            const onReplay = typeof opts.onReplay === 'function' ? opts.onReplay : null;

            const pct = Math.max(0, Math.min(100, Math.round((score / (maxScore || 1)) * 100)));
            const cefrEstimate = pct >= 85 ? 'C1 Advanced / C2 Ready' : pct >= 65 ? 'B2 Upper-Intermediate (Borderline C1)' : 'B1/B2 Transition';

            if (currentSlug) {
                setLastFreeTool(currentSlug);
            }
            window.trackFunnelEvent('diagnostic_gate_shown', { gameName, score, maxScore, pct, cefrEstimate });

            const existing = document.getElementById('gm-diag-overlay');
            if (existing) existing.remove();

            const modalHtml = `
              <div id="gm-diag-overlay" role="dialog" aria-modal="true" aria-label="Your Practice Score" style="position:fixed;inset:0;background:rgba(10,15,28,0.88);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;">
                <div style="background:#111827;border:1px solid #374151;border-radius:16px;max-width:540px;width:100%;padding:28px;color:#f9fafb;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);box-sizing:border-box;">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                    <span style="background:#1e3a8a;color:#93c5fd;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">
                      Your Practice Score &bull; ${gameName}
                    </span>
                    <button id="gm-diag-close" type="button" aria-label="Close" style="background:none;border:none;color:#9ca3af;font-size:24px;line-height:1;cursor:pointer;padding:4px;">&times;</button>
                  </div>
                  <h3 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:#ffffff;line-height:1.2;">
                    Your Score: ${score}/${maxScore} (${pct}%)
                  </h3>
                  <p style="margin:0 0 16px 0;font-size:14px;color:#d1d5db;">
                    Estimated Level: <strong style="color:#fbbf24;">${cefrEstimate}</strong>
                  </p>
                  <div style="background:#1f2937;border-left:4px solid #f59e0b;padding:14px;border-radius:8px;margin-bottom:20px;font-size:14px;line-height:1.5;">
                    <strong style="color:#fcd34d;display:block;margin-bottom:4px;">💡 Focus Area: ${weakArea}</strong>
                    <span style="color:#e5e7eb;">${examImpact}</span>
                  </div>
                  <p style="font-size:14px;color:#d1d5db;margin-bottom:18px;line-height:1.5;">
                    Ready for your next step? Continue with the self-paced Gothic course or get personal 1-to-1 feedback:
                  </p>
                  <div style="display:grid;gap:10px;">
                    <a href="dark-academia-index.html"
                       onclick="window.trackFunnelEvent?.('game_cta_clicked', { gameName: '${gameName}', target: 'gothic_canon_24', pct: ${pct} })"
                       style="display:block;text-align:center;background:#78350f;border:1px solid #f59e0b;color:#fef3c7;font-weight:700;padding:13px;border-radius:10px;text-decoration:none;font-size:14px;">
                      Explore the C1/C2 Gothic Course (5 Free Lessons / &pound;24 Full Course) &rarr;
                    </a>
                    <a href="index.html#contact"
                       onclick="window.trackFunnelEvent?.('game_cta_clicked', { gameName: '${gameName}', target: 'trial_35', pct: ${pct} })"
                       style="display:block;text-align:center;background:#2563eb;color:#ffffff;font-weight:700;padding:13px;border-radius:10px;text-decoration:none;font-size:14px;box-shadow:0 4px 6px -1px rgba(37,99,235,0.4);">
                      Book a 30-Min 1-to-1 Trial with Gareth (&pound;35) &rarr;
                    </a>
                    <a href="index.html?package=Written+essay+feedback+(%C2%A329)&tier=audit_async_29#enquiry-card"
                       onclick="window.trackFunnelEvent?.('game_cta_clicked', { gameName: '${gameName}', target: 'async_audit_29', pct: ${pct} })"
                       style="display:block;text-align:center;background:#1f2937;border:1px solid #4b5563;color:#e5e7eb;font-weight:600;padding:12px;border-radius:10px;text-decoration:none;font-size:14px;">
                      Get Written Essay Feedback (&pound;29) &rarr;
                    </a>
                  </div>
                  <button id="gm-diag-replay" type="button" style="margin-top:14px;width:100%;background:none;border:none;color:#9ca3af;font-size:13px;cursor:pointer;text-decoration:underline;">
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

            const keyHandler = (e) => {
                if (e.key === 'Escape') {
                    cleanup();
                    return;
                }
                if (e.key === 'Tab' && overlay) {
                    const focusables = overlay.querySelectorAll('a[href], button:not([disabled])');
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
                    window.trackFunnelEvent('game_replay_clicked', { gameName, score });
                    cleanup();
                    if (onReplay) onReplay();
                };
            }

            document.addEventListener('keydown', keyHandler);
        };

        document.addEventListener('click', function (e) {
            const target = e.target.closest('[data-track]');
            if (!target) return;
            const eventName = target.getAttribute('data-track');
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
})();

