/* ==========================================================
   Red-Pen Speed-Run: C1 Error, Register & Restraint Clinic
   Runtime Controller: 90s Speed-Run, Desk Audit, Daily 5,
   Timed Duel Mode, Web Audio Pen-Tick SFX & ?selftest=1
   ========================================================== */
(() => {
    'use strict';

    const D = window.RED_PEN_DATA;
    if (!D) {
        console.error('red-pen-data.js must be loaded before red-pen.js');
        return;
    }

    const STORAGE_KEY = 'gm_red_pen_state_v1';
    const CLEAN_KEY = 'gm_teacher_clean_screenshare';
    const SHARE_BASE_URL = 'https://garethenglish.com/red-pen-speedrun.html';
    const SPRINT_DURATION_MS = 90000;

    const $ = (id) => document.getElementById(id);

    /* ---------------- STATE ---------------- */
    let state = {
        currentIdx: 0,
        dailyStreak: 0,
        lastDailyDate: '',
        lastDailyGrid: '',
        bestSprintCorrect: 0,
        playerName: ''
    };

    let playMode = 'speedrun'; // 'speedrun' | 'audit'
    let currentParagraph = D.allParagraphs[0];
    let activeSpanIdx = 0;

    // Run telemetry (per active session: speedrun, audit, daily, or duel)
    let judgmentsBySpanId = Object.create(null);
    let ledgerEntries = [];
    let comboStreak = 0;
    let maxStreak = 0;
    let lastNotedSpanId = null;
    let modelRevealed = false;
    let blueprintOpen = false;

    // Sprint timer (Speed-Run & Daily 5)
    let sprintStarted = false;
    let sprintFinished = false;
    let sprintStartedAt = null;
    let remainingMs = SPRINT_DURATION_MS;
    let sprintTimerInterval = null;
    let autoAdvanceTimeout = null;

    // Daily 5 state
    let dailyActive = false;
    let dailyData = null;
    let dailyStep = 0;

    // Duel state
    let duelActive = false;
    let duelSpec = null;
    let duelStep = 0;
    let duelElapsedMs = 0;
    let duelTurnStartedAt = null;
    let duelTimerInterval = null;

    // Modal & audio
    let activeRecapMode = null;
    let recapReturnFocus = null;
    let inSelfTest = false;
    let soundEnabled = false;
    let audioCtx = null;

    /* ---------------- DEFAULT-OFF WEB AUDIO PEN-TICK SFX ---------------- */
    function playTone(freq, dur, vol, type = 'sine', delay = 0) {
        if (!soundEnabled || inSelfTest) return;
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        try {
            if (!audioCtx) audioCtx = new Ctx();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().catch(() => {});
            }
            const t = audioCtx.currentTime + delay;
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(vol, t + 0.004);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + dur + 0.015);
        } catch (_) {}
    }

    function sfx(kind) {
        if (!soundEnabled || inSelfTest) return;
        if (kind === 'penTick') {
            playTone(880, 0.025, 0.024, 'triangle', 0);
        } else if (kind === 'correct') {
            playTone(620, 0.032, 0.028, 'triangle', 0);
            playTone(790, 0.055, 0.025, 'sine', 0.028);
        } else if (kind === 'error') {
            playTone(195, 0.08, 0.032, 'sine', 0);
        } else if (kind === 'finish') {
            playTone(523.25, 0.11, 0.03, 'sine', 0);
            playTone(659.25, 0.16, 0.03, 'sine', 0.08);
        }
    }

    /* ---------------- TELEMETRY & STORAGE ---------------- */
    function trackRedPenEvent(eventName, params) {
        if (inSelfTest) return;
        try {
            if (typeof window.trackFunnelEvent === 'function') {
                window.trackFunnelEvent(eventName, { tool: 'red-pen-speedrun', ...(params || {}) });
            }
        } catch (_) {}
    }

    function ensureState(raw) {
        const out = {
            currentIdx: 0,
            dailyStreak: 0,
            lastDailyDate: '',
            lastDailyGrid: '',
            bestSprintCorrect: 0,
            playerName: ''
        };
        if (raw && typeof raw === 'object') {
            const idx = parseInt(raw.currentIdx, 10);
            if (!Number.isNaN(idx) && idx >= 0 && idx < D.allParagraphs.length) out.currentIdx = idx;
            out.dailyStreak = Math.max(0, parseInt(raw.dailyStreak, 10) || 0);
            out.lastDailyDate = typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : '';
            out.lastDailyGrid = typeof raw.lastDailyGrid === 'string' ? raw.lastDailyGrid : '';
            out.bestSprintCorrect = Math.max(0, parseInt(raw.bestSprintCorrect, 10) || 0);
            if (typeof raw.playerName === 'string') {
                out.playerName = raw.playerName.replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 18);
            }
        }
        return out;
    }

    function loadState() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            state = ensureState(raw ? JSON.parse(raw) : null);
        } catch (_) {
            state = ensureState(null);
        }
    }

    function saveState() {
        if (inSelfTest) return;
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (_) {}
    }

    /* ---------------- CLEAN SCREENSHARE GUARD ---------------- */
    function isCleanMode(forceClean) {
        if (forceClean === true) return true;
        try {
            if (localStorage.getItem(CLEAN_KEY) === 'true') return true;
        } catch (_) {}
        try {
            if (new URLSearchParams(location.search).get('wl') === '1') return true;
        } catch (_) {}
        return !!(document.body && document.body.classList.contains('gm-clean-screenshare'));
    }

    function syncCleanModeUI(forceClean) {
        const clean = isCleanMode(forceClean);
        if (clean && document.body && !document.body.classList.contains('gm-clean-screenshare')) {
            document.body.classList.add('gm-clean-screenshare');
        } else if (forceClean === false && document.body) {
            document.body.classList.remove('gm-clean-screenshare');
        }
        const strip = $('belfast-desk-strip');
        if (strip) strip.classList.toggle('hidden', clean);
        const bridgeWrap = document.querySelector('[data-course-bridge]');
        if (bridgeWrap) bridgeWrap.classList.toggle('hidden', clean);
        const bridgeCard = $('gm-course-bridge');
        if (bridgeCard) bridgeCard.classList.toggle('hidden', clean);
    }

    /* ---------------- SCORE & METRIC COMPUTATIONS ---------------- */
    function computeMetrics() {
        const totalJudged = ledgerEntries.length;
        const totalCorrect = ledgerEntries.filter((e) => e.correct).length;
        const precisionPct = totalJudged === 0 ? 100 : Math.round((totalCorrect / totalJudged) * 100);

        const naturalEntries = ledgerEntries.filter((e) => e.verdict === 'natural');
        const naturalSpared = naturalEntries.filter((e) => e.choice === 'natural').length;
        const falseAlarms = naturalEntries.length - naturalSpared;
        const restraintPct = naturalEntries.length === 0 ? 100 : Math.round((naturalSpared / naturalEntries.length) * 100);

        return {
            totalJudged,
            totalCorrect,
            precisionPct,
            naturalTotal: naturalEntries.length,
            naturalSpared,
            falseAlarms,
            restraintPct
        };
    }

    function activeDeckParagraphs() {
        if (duelActive && duelSpec) return duelSpec.steps.map((s) => s.paragraph);
        if (dailyActive && dailyData) return dailyData.steps.map((s) => s.paragraph);
        return D.allParagraphs;
    }

    function currentDeckIndex() {
        if (duelActive) return duelStep;
        if (dailyActive) return dailyStep;
        return state.currentIdx;
    }

    function formatClock(sec) {
        const s = Math.max(0, Math.floor(Number(sec) || 0));
        const m = Math.floor(s / 60);
        const rem = String(s % 60).padStart(2, '0');
        return `${m}:${rem}`;
    }

    function previousDaySeed(seedStr) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(seedStr || ''))) return '';
        const [y, m, d] = seedStr.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() - 1);
        return dt.toISOString().slice(0, 10);
    }

    function currentDuelSeconds() {
        let totalMs = duelElapsedMs;
        if (duelTurnStartedAt !== null) {
            totalMs += Math.max(0, Date.now() - duelTurnStartedAt);
        }
        return Math.round(totalMs / 1000);
    }

    /* ---------------- TIMERS ---------------- */
    function clearAutoAdvance() {
        if (autoAdvanceTimeout) {
            clearTimeout(autoAdvanceTimeout);
            autoAdvanceTimeout = null;
        }
    }

    function stopSprintTimer() {
        if (sprintTimerInterval) {
            clearInterval(sprintTimerInterval);
            sprintTimerInterval = null;
        }
    }

    function updateTimerPill() {
        const timerEl = $('hud-timer');
        if (!timerEl) return;

        if (duelActive && duelSpec) {
            timerEl.className = 'hud-pill hud-timer';
            timerEl.textContent = `⚔️ ${formatClock(currentDuelSeconds())}`;
            return;
        }
        if (playMode === 'audit' && !dailyActive) {
            timerEl.className = 'hud-pill hud-timer is-untimed';
            timerEl.textContent = '📖 Untimed';
            return;
        }

        const secs = (Math.max(0, remainingMs) / 1000).toFixed(1);
        timerEl.className = 'hud-pill hud-timer' + (remainingMs <= 15000 && sprintStarted && !sprintFinished ? ' is-urgent' : '');
        timerEl.textContent = `⏱️ ${secs}s`;
    }

    function startSprintTimer() {
        if ((playMode !== 'speedrun' && !dailyActive) || duelActive) return;
        if (sprintStarted || sprintFinished) return;
        sprintStarted = true;
        sprintStartedAt = Date.now();
        remainingMs = SPRINT_DURATION_MS;
        if ($('btn-start-sprint')) $('btn-start-sprint').classList.add('hidden');

        if (!inSelfTest && !sprintTimerInterval) {
            sprintTimerInterval = setInterval(() => {
                if (!sprintStarted || sprintFinished) return;
                remainingMs = Math.max(0, SPRINT_DURATION_MS - (Date.now() - sprintStartedAt));
                updateTimerPill();
                if (remainingMs <= 0) {
                    finishSprintNow();
                }
            }, 100);
        }
        updateTimerPill();
    }

    function finishSprintNow() {
        clearAutoAdvance();
        stopSprintTimer();
        sprintFinished = true;
        remainingMs = Math.max(0, remainingMs);
        updateTimerPill();
        sfx('finish');

        const m = computeMetrics();
        if (!inSelfTest && m.totalCorrect > state.bestSprintCorrect) {
            state.bestSprintCorrect = m.totalCorrect;
            saveState();
        }
        openRecapModal(dailyActive ? 'daily' : 'speedrun');
    }

    function resumeDuelTimer() {
        if (!duelActive || sprintFinished) return;
        if (duelTurnStartedAt === null) {
            duelTurnStartedAt = Date.now();
        }
        if (!duelTimerInterval && !inSelfTest) {
            duelTimerInterval = setInterval(() => {
                updateModeBadge();
                updateTimerPill();
            }, 250);
        }
        updateModeBadge();
        updateTimerPill();
    }

    function pauseDuelTimer() {
        if (duelTurnStartedAt !== null) {
            duelElapsedMs += Math.max(0, Date.now() - duelTurnStartedAt);
            duelTurnStartedAt = null;
        }
        if (duelTimerInterval) {
            clearInterval(duelTimerInterval);
            duelTimerInterval = null;
        }
        updateModeBadge();
        updateTimerPill();
    }

    function stopDuelTimer() {
        duelTurnStartedAt = null;
        if (duelTimerInterval) {
            clearInterval(duelTimerInterval);
            duelTimerInterval = null;
        }
    }

    function resetRunSession() {
        clearAutoAdvance();
        stopSprintTimer();
        stopDuelTimer();
        judgmentsBySpanId = Object.create(null);
        ledgerEntries = [];
        comboStreak = 0;
        maxStreak = 0;
        lastNotedSpanId = null;
        sprintStarted = false;
        sprintFinished = false;
        sprintStartedAt = null;
        remainingMs = SPRINT_DURATION_MS;
        duelElapsedMs = 0;
        duelTurnStartedAt = null;
    }

    /* ---------------- HUD & FEEDBACK ---------------- */
    function setFeedback(el, text, kind) {
        if (!el) return;
        el.textContent = text || '';
        el.className = 'feedback-line' + (kind ? ` is-${kind}` : '');
    }

    function updateModeBadge() {
        const badge = $('mode-badge');
        const exitBtn = $('exit-mode-btn');
        if (!badge || !exitBtn) return;

        if (duelActive && duelSpec) {
            badge.classList.remove('hidden', 'daily-active');
            exitBtn.classList.remove('hidden');
            badge.textContent = `⚔️ Duel ${duelStep + 1}/${duelSpec.steps.length} · ${formatClock(currentDuelSeconds())}`;
        } else if (dailyActive && dailyData) {
            badge.classList.remove('hidden');
            badge.classList.add('daily-active');
            exitBtn.classList.remove('hidden');
            badge.textContent = `🎲 Daily ${dailyStep + 1}/${dailyData.steps.length}`;
        } else {
            badge.classList.add('hidden');
            badge.classList.remove('daily-active');
            exitBtn.classList.add('hidden');
            badge.textContent = '';
        }
    }

    function refreshHud(restraintPenaltyHit) {
        const m = computeMetrics();
        const deck = activeDeckParagraphs();
        const pos = currentDeckIndex() + 1;
        const maxSpans = deck.length * 3;

        if ($('hud-progress')) {
            if (duelActive && duelSpec) {
                $('hud-progress').textContent = `Duel ${pos}/${deck.length} · ${m.totalJudged}/${maxSpans}`;
            } else if (dailyActive && dailyData) {
                $('hud-progress').textContent = `Daily ${pos}/${deck.length} · ${m.totalJudged}/${maxSpans}`;
            } else {
                $('hud-progress').textContent = `Para ${pos}/${deck.length} · ${m.totalJudged}/${maxSpans}`;
            }
        }
        if ($('streak-display')) {
            $('streak-display').textContent = `🔥 ${comboStreak}`;
        }
        if ($('precision-display')) {
            $('precision-display').textContent = `🎯 Precision ${m.precisionPct}%`;
        }
        const restEl = $('restraint-display');
        if (restEl) {
            restEl.textContent = `🛡️ Restraint ${m.restraintPct}%`;
            restEl.classList.remove('is-warn', 'is-danger', 'pulse-penalty');
            if (m.restraintPct < 70) restEl.classList.add('is-danger');
            else if (m.restraintPct < 100) restEl.classList.add('is-warn');
            if (restraintPenaltyHit) {
                void restEl.offsetWidth;
                restEl.classList.add('pulse-penalty');
            }
        }

        document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
            const btnAct = parseInt(btn.dataset.act || '', 10);
            const btnMode = btn.dataset.mode || '';
            const btnPlay = btn.dataset.playmode || '';
            let isActive = false;

            if (btnPlay) {
                isActive = !duelActive && !dailyActive && playMode === btnPlay;
            } else if (duelActive) {
                isActive = btnMode === 'duel';
            } else if (dailyActive) {
                isActive = btnMode === 'daily';
            } else if (!Number.isNaN(btnAct)) {
                isActive = currentParagraph && currentParagraph.act === btnAct;
            }
            btn.classList.toggle('active', isActive);
        });

        updateTimerPill();
        updateModeBadge();
    }

    /* ---------------- BLUEPRINT & CAMBRIDGE MODEL ---------------- */
    function updateBlueprintCard(revealModelNow) {
        const p = currentParagraph;
        if (!p) return;
        if ($('blueprint-device')) $('blueprint-device').textContent = p.blueprint.device;
        if ($('blueprint-cefr')) $('blueprint-cefr').textContent = p.cefr;
        if ($('blueprint-formula')) $('blueprint-formula').textContent = p.blueprint.formula;
        if ($('blueprint-note')) $('blueprint-note').textContent = p.blueprint.note;

        if (revealModelNow === true) modelRevealed = true;
        const modelOut = $('blueprint-model-output');
        const revealBtn = $('btn-reveal-model');
        if (modelOut) {
            if (modelRevealed) {
                modelOut.textContent = `✔ Cambridge Model: ${D.renderCleanModel(p)}`;
                modelOut.classList.remove('hidden');
            } else {
                modelOut.textContent = '';
                modelOut.classList.add('hidden');
            }
        }
        if (revealBtn) {
            revealBtn.classList.toggle('hidden', modelRevealed);
        }
    }

    function toggleBlueprint(forceOpen, revealModelNow) {
        const panel = $('blueprint-panel');
        const btn = $('btn-blueprint');
        if (!panel) return;
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
        blueprintOpen = willOpen;
        panel.classList.toggle('hidden', !willOpen);
        if (btn) {
            btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            btn.textContent = willOpen ? '🙈 Hide Structural Blueprint' : '👁️ Reveal Structural Blueprint';
        }
        if (willOpen || revealModelNow) {
            updateBlueprintCard(revealModelNow);
        }
    }

    /* ---------------- DESK DIAGNOSTIC NOTE ---------------- */
    function verdictMeta(verdict) {
        if (verdict === 'error') {
            return { label: '🔴 Actual Grammar Error', badgeCls: 'badge-error', cardCls: 'note-error' };
        }
        if (verdict === 'spoken') {
            return { label: '🟡 Spoken-Register Slip', badgeCls: 'badge-spoken', cardCls: 'note-spoken' };
        }
        return { label: '🟢 Leave It Alone (Natural C1)', badgeCls: 'badge-natural', cardCls: 'note-natural' };
    }

    function renderDeskNote(span, entry) {
        const card = $('desk-note-card');
        if (!card) return;
        const showDeskNote = (playMode === 'audit' && !dailyActive && !duelActive) || Boolean(entry && playMode === 'audit');
        if (!showDeskNote || !span || !entry) {
            card.classList.add('hidden');
            return;
        }

        const meta = verdictMeta(span.verdict);
        card.className = `desk-note-card ${meta.cardCls}`;
        if ($('desk-verdict-badge')) {
            $('desk-verdict-badge').className = `desk-verdict-badge ${meta.badgeCls}`;
            $('desk-verdict-badge').textContent = entry.correct
                ? `${meta.label} · Accurate`
                : `${meta.label} · You chose ${verdictMeta(entry.choice).label}`;
        }
        if ($('desk-grammar-tag')) {
            $('desk-grammar-tag').textContent = span.grammarLabel;
        }
        const diffEl = $('desk-diff-line');
        if (diffEl) {
            diffEl.textContent = '';
            if (span.verdict === 'natural') {
                const keep = document.createElement('span');
                keep.className = 'rp-keep';
                keep.textContent = `✓ Leave unchanged: “${span.text}”`;
                diffEl.appendChild(keep);
            } else {
                const del = document.createElement('del');
                del.className = span.verdict === 'error' ? 'rp-del' : 'rp-del-spoken';
                del.textContent = span.text;
                const arrow = document.createTextNode(' → ');
                const ins = document.createElement('ins');
                ins.className = span.verdict === 'error' ? 'rp-ins' : 'rp-ins-spoken';
                ins.textContent = span.correction;
                diffEl.append(del, arrow, ins);
            }
        }
        if ($('desk-formula-code')) $('desk-formula-code').textContent = span.formula;
        if ($('desk-explanation')) $('desk-explanation').textContent = span.explanation;
    }

    /* ---------------- PARAGRAPH & SPAN RENDERING ---------------- */
    function updateSpanSelectionUI() {
        const p = currentParagraph;
        if (!p) return;
        const spans = p.spans;
        const activeSpan = spans[activeSpanIdx] || spans[0];
        const entry = activeSpan ? judgmentsBySpanId[activeSpan.id] : null;

        document.querySelectorAll('#prose-sheet .rp-span').forEach((btn, idx) => {
            btn.classList.toggle('is-active-span', idx === activeSpanIdx);
        });

        const pillsEl = $('span-nav-pills');
        if (pillsEl) {
            pillsEl.textContent = '';
            spans.forEach((sp, idx) => {
                const pb = document.createElement('button');
                pb.type = 'button';
                pb.className = 'span-pill-btn';
                pb.textContent = `[${idx + 1}]`;
                pb.setAttribute('aria-label', `Select target span ${idx + 1}`);
                if (idx === activeSpanIdx) pb.classList.add('is-active');
                const j = judgmentsBySpanId[sp.id];
                if (j) pb.classList.add(j.correct ? 'is-judged-right' : 'is-judged-wrong');
                pb.addEventListener('click', () => selectSpan(idx, true));
                pillsEl.appendChild(pb);
            });
        }

        if ($('active-span-label')) {
            $('active-span-label').textContent = `Active Target (Span ${activeSpanIdx + 1} of ${spans.length}):`;
        }
        if ($('active-span-quote') && activeSpan) {
            $('active-span-quote').textContent = entry
                ? (activeSpan.verdict === 'natural' ? `${activeSpan.text} (✓ Spared)` : `${activeSpan.text} → ${activeSpan.correction}`)
                : activeSpan.text;
        }

        const alreadyJudged = Boolean(entry);
        const disableVerdicts = sprintFinished || alreadyJudged;
        document.querySelectorAll('.verdict-btn').forEach((vb) => {
            vb.disabled = disableVerdicts;
        });

        if (playMode === 'audit' && lastNotedSpanId) {
            const notedSpan = spans.find((s) => s.id === lastNotedSpanId) || activeSpan;
            const notedEntry = notedSpan ? judgmentsBySpanId[notedSpan.id] : null;
            renderDeskNote(notedSpan, notedEntry);
        } else if (playMode === 'audit' && entry) {
            renderDeskNote(activeSpan, entry);
        } else if (playMode !== 'audit') {
            if ($('desk-note-card')) $('desk-note-card').classList.add('hidden');
        }
    }

    function selectSpan(idx, focusBtn) {
        const p = currentParagraph;
        if (!p || !p.spans[idx]) return;
        activeSpanIdx = idx;
        const j = judgmentsBySpanId[p.spans[idx].id];
        if (j && playMode === 'audit') {
            lastNotedSpanId = p.spans[idx].id;
        }
        updateSpanSelectionUI();
        if (focusBtn) {
            const btn = document.querySelector(`#prose-sheet .rp-span[data-span-idx="${idx}"]`);
            if (btn) btn.focus();
        }
    }

    function renderSpanContents(btn, sp, idx, entry) {
        btn.textContent = '';
        btn.className = 'rp-span';
        if (idx === activeSpanIdx) btn.classList.add('is-active-span');

        const num = document.createElement('span');
        num.className = 'rp-span-num';
        num.textContent = String(idx + 1);
        btn.appendChild(num);

        if (!entry) {
            btn.appendChild(document.createTextNode(sp.text));
            btn.setAttribute('aria-label', `Target ${idx + 1}: ${sp.text}`);
            return;
        }

        btn.classList.add(`is-verdict-${sp.verdict}`);
        if (!entry.correct) btn.classList.add('is-miss');

        if (sp.verdict === 'natural') {
            const keep = document.createElement('span');
            keep.className = 'rp-keep';
            keep.textContent = `${sp.text} ✓`;
            btn.appendChild(keep);
        } else {
            const del = document.createElement('del');
            del.className = sp.verdict === 'error' ? 'rp-del' : 'rp-del-spoken';
            del.textContent = sp.text;
            const spc = document.createTextNode(' ');
            const ins = document.createElement('ins');
            ins.className = sp.verdict === 'error' ? 'rp-ins' : 'rp-ins-spoken';
            ins.textContent = sp.correction;
            btn.append(del, spc, ins);
        }
        btn.setAttribute('aria-label', `Target ${idx + 1} (${sp.verdict}): ${sp.text}`);
    }

    function renderParagraph() {
        const p = currentParagraph;
        if (!p) return;

        modelRevealed = false;
        const firstUnjudged = p.spans.findIndex((s) => !judgmentsBySpanId[s.id]);
        activeSpanIdx = firstUnjudged >= 0 ? firstUnjudged : 0;
        lastNotedSpanId = null;

        // Duel target banner
        const banner = $('duel-target-banner');
        if (banner) {
            if (duelActive && duelSpec) {
                banner.classList.remove('hidden');
                if (duelSpec.sec > 0) {
                    const who = duelSpec.by || 'Challenger';
                    banner.textContent = `🎯 Target to beat: ${who} scored ${duelSpec.correct}/${duelSpec.steps.length * 3} · ${duelSpec.restraint}% Restraint in ${formatClock(duelSpec.sec)}`;
                } else {
                    banner.textContent = `⚔️ Custom ${duelSpec.steps.length}-Paragraph Duel — set the benchmark!`;
                }
            } else {
                banner.classList.add('hidden');
                banner.textContent = '';
            }
        }

        const actInfo = D.acts.find((a) => a.act === p.act) || D.acts[0];
        if ($('para-meta-tag')) {
            const globalNum = D.allParagraphs.findIndex((item) => item.id === p.id) + 1;
            $('para-meta-tag').textContent = `ACT ${['I', 'II', 'III', 'IV'][p.act - 1]} · ${p.cefr} · ${p.genre.toUpperCase()} (${globalNum}/${D.allParagraphs.length})`;
        }

        const modePill = $('mode-pill');
        if (modePill) {
            if (duelActive) {
                modePill.textContent = '⚔️ Timed Duel · Press 1 / 2 / 3';
                modePill.classList.remove('audit-active');
            } else if (dailyActive) {
                modePill.textContent = '🎲 Daily 5 · 90s Clock';
                modePill.classList.remove('audit-active');
            } else if (playMode === 'audit') {
                modePill.textContent = '📖 Untimed Desk Audit';
                modePill.classList.add('audit-active');
            } else {
                modePill.textContent = '⏱️ 90s Speed-Run · Press 1 / 2 / 3';
                modePill.classList.remove('audit-active');
            }
        }

        const startBtn = $('btn-start-sprint');
        if (startBtn) {
            const showStart = (playMode === 'speedrun' || dailyActive) && !duelActive && !sprintStarted && !sprintFinished;
            startBtn.classList.toggle('hidden', !showStart);
            startBtn.textContent = dailyActive ? '▶ Start Daily 90.0s' : '▶ Start 90.0s Sprint';
        }

        if ($('para-title')) $('para-title').textContent = `${p.title} (${actInfo.shortTitle})`;
        if ($('scene-context')) $('scene-context').textContent = p.context;

        const sheet = $('prose-sheet');
        if (sheet) {
            sheet.textContent = '';
            let spanCounter = 0;
            p.parts.forEach((part) => {
                if (!part.id) {
                    sheet.appendChild(document.createTextNode(part.text));
                    return;
                }
                const sIdx = spanCounter++;
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.dataset.spanIdx = String(sIdx);
                btn.dataset.spanId = part.id;
                renderSpanContents(btn, part, sIdx, judgmentsBySpanId[part.id]);
                btn.addEventListener('click', () => selectSpan(sIdx, false));
                btn.addEventListener('focus', () => {
                    if (activeSpanIdx !== sIdx) {
                        activeSpanIdx = sIdx;
                        updateSpanSelectionUI();
                    }
                });
                sheet.appendChild(btn);
            });
        }

        setFeedback($('verdict-feedback'), '', '');
        if ($('desk-note-card')) $('desk-note-card').classList.add('hidden');
        toggleBlueprint(false, false);

        if ($('btn-prev')) $('btn-prev').disabled = currentDeckIndex() <= 0;
        updateNextButtonState();
        updateSpanSelectionUI();
        refreshHud(false);

        if (duelActive && !sprintFinished) {
            resumeDuelTimer();
        }
    }

    function updateNextButtonState() {
        const nextBtn = $('btn-next');
        if (!nextBtn) return;
        const deck = activeDeckParagraphs();
        const pos = currentDeckIndex();
        const allThreeJudged = currentParagraph.spans.every((s) => Boolean(judgmentsBySpanId[s.id]));

        if (duelActive && duelSpec) {
            nextBtn.disabled = !allThreeJudged;
            nextBtn.textContent = pos >= deck.length - 1 ? 'Finish Duel ⚔️' : `Next Duel (${pos + 2}/${deck.length}) →`;
        } else if (dailyActive && dailyData) {
            nextBtn.disabled = false;
            nextBtn.textContent = pos >= deck.length - 1 ? 'Finish Daily 5 ✔' : `Next Seed (${pos + 2}/${deck.length}) →`;
        } else if (playMode === 'audit') {
            nextBtn.disabled = false;
            nextBtn.textContent = pos >= deck.length - 1 ? 'Finish Desk Audit 🏆' : 'Next Paragraph →';
        } else {
            nextBtn.disabled = false;
            nextBtn.textContent = pos >= deck.length - 1 ? 'Finish Run 🏆' : 'Next Paragraph →';
        }
    }

    /* ---------------- VERDICT SUBMISSION ---------------- */
    function judgeActiveSpan(choice) {
        if (sprintFinished) return false;
        const p = currentParagraph;
        const sp = p && p.spans[activeSpanIdx];
        if (!p || !sp || judgmentsBySpanId[sp.id]) return false;

        if ((playMode === 'speedrun' || dailyActive) && !duelActive && !sprintStarted) {
            startSprintTimer();
        }

        const isCorrect = choice === sp.verdict;
        const isRestraintPenalty = sp.verdict === 'natural' && choice !== 'natural';

        const entry = {
            paraId: p.id,
            paraTitle: p.title,
            cefr: p.cefr,
            spanId: sp.id,
            spanText: sp.text,
            correction: sp.correction,
            verdict: sp.verdict,
            choice,
            correct: isCorrect,
            restraintPenalty: isRestraintPenalty,
            grammarLabel: sp.grammarLabel,
            formula: sp.formula,
            explanation: sp.explanation
        };

        judgmentsBySpanId[sp.id] = entry;
        ledgerEntries.push(entry);
        lastNotedSpanId = sp.id;

        if (isCorrect) {
            comboStreak++;
            if (comboStreak > maxStreak) maxStreak = comboStreak;
            sfx('correct');
        } else {
            comboStreak = 0;
            sfx('error');
        }

        // Update inline span button
        const spanBtn = document.querySelector(`#prose-sheet .rp-span[data-span-idx="${activeSpanIdx}"]`);
        if (spanBtn) {
            renderSpanContents(spanBtn, sp, activeSpanIdx, entry);
        }

        // Feedback line
        const fb = $('verdict-feedback');
        if (isRestraintPenalty) {
            setFeedback(fb, `Restraint penalty! “${sp.text}” is clean C1 prose (${sp.grammarLabel}) — leave it alone.`, 'error');
        } else if (isCorrect) {
            if (sp.verdict === 'natural') {
                setFeedback(fb, `Spot on — clean C1 phrasing spared (${sp.grammarLabel}).`, 'success');
            } else {
                setFeedback(fb, `Marked: “${sp.text}” → “${sp.correction}” (${sp.grammarLabel}).`, 'success');
            }
        } else {
            const vName = verdictMeta(sp.verdict).label;
            setFeedback(fb, `Not quite: “${sp.text}” is ${vName} → “${sp.correction}”.`, 'hint');
        }

        if (!inSelfTest) {
            if (!isCorrect && sp.verdict !== 'natural') {
                const rawParts = p.parts.map((part) => (part.id === sp.id ? '___GAP___' : part.text)).join('');
                const sentenceHit = rawParts.split(/(?<=[.!?])\s+/).find((s) => s.includes('___GAP___')) || rawParts;
                const spanSentenceFrame = sentenceHit.replace('___GAP___', '________');
                window.CandidateDossier?.recordAttempt({
                    category: p.dossierCategory,
                    correct: false,
                    game: 'Red-Pen Speed-Run',
                    prompt: `${p.genre}: Replace "${sp.text}" (${sp.verdict === 'error' ? 'grammar error' : 'spoken slip'})`,
                    frame: spanSentenceFrame,
                    keyword: sp.grammarLabel,
                    targetAnswer: sp.correction,
                    acceptedAnswers: [sp.correction],
                    userAttempt: sp.text,
                    explanation: `${sp.formula} — ${sp.explanation}`
                });
            } else {
                window.CandidateDossier?.recordAttempt({
                    category: p.dossierCategory,
                    correct: isCorrect,
                    game: 'Red-Pen Speed-Run'
                });
            }
        }

        refreshHud(isRestraintPenalty);
        if (playMode === 'audit' && !dailyActive && !duelActive) {
            renderDeskNote(sp, entry);
        }

        // Check if all 3 spans in current paragraph are judged
        const nextUnjudged = p.spans.findIndex((s) => !judgmentsBySpanId[s.id]);
        if (nextUnjudged >= 0) {
            activeSpanIdx = nextUnjudged;
            updateSpanSelectionUI();
            if (!inSelfTest) {
                const nextBtn = document.querySelector(`#prose-sheet .rp-span[data-span-idx="${nextUnjudged}"]`);
                if (nextBtn) nextBtn.focus();
            }
        } else {
            updateSpanSelectionUI();
            updateNextButtonState();
            handleParagraphCompleted();
        }

        trackRedPenEvent('redpen_span_judged', {
            id: sp.id,
            verdict: sp.verdict,
            correct: isCorrect,
            mode: duelActive ? 'duel' : (dailyActive ? 'daily' : playMode)
        });
        return true;
    }

    function handleParagraphCompleted() {
        const deck = activeDeckParagraphs();
        const pos = currentDeckIndex();
        const isLast = pos >= deck.length - 1;

        if (duelActive && duelSpec) {
            if (isLast) {
                pauseDuelTimer();
                sprintFinished = true;
                sfx('finish');
                openRecapModal('duel');
            } else if (!inSelfTest) {
                clearAutoAdvance();
                autoAdvanceTimeout = setTimeout(() => {
                    nextParagraph();
                }, 420);
            }
            return;
        }

        if (dailyActive && dailyData) {
            if (isLast) {
                finishSprintNow();
            } else if (!inSelfTest) {
                clearAutoAdvance();
                autoAdvanceTimeout = setTimeout(() => {
                    nextParagraph();
                }, 420);
            }
            return;
        }

        if (playMode === 'speedrun') {
            if (isLast) {
                finishSprintNow();
            } else if (!inSelfTest) {
                clearAutoAdvance();
                autoAdvanceTimeout = setTimeout(() => {
                    nextParagraph();
                }, 380);
            }
        } else {
            // Untimed Desk Audit: auto-open Structural Blueprint when all 3 spans done
            toggleBlueprint(true, false);
        }
    }

    /* ---------------- NAVIGATION & MODES ---------------- */
    function exitSpecialModes() {
        clearAutoAdvance();
        stopSprintTimer();
        stopDuelTimer();
        dailyActive = false;
        dailyData = null;
        dailyStep = 0;
        duelActive = false;
        duelSpec = null;
        duelStep = 0;
        updateModeBadge();
    }

    function setPlayMode(mode) {
        if (mode !== 'speedrun' && mode !== 'audit') return;
        exitSpecialModes();
        playMode = mode;
        resetRunSession();
        currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
        renderParagraph();
        trackRedPenEvent('redpen_mode_selected', { mode });
    }

    function jumpToAct(actNum) {
        const idx = D.allParagraphs.findIndex((p) => p.act === actNum);
        if (idx < 0) return;

        if (dailyActive || duelActive) {
            exitSpecialModes();
            resetRunSession();
        }
        clearAutoAdvance();
        state.currentIdx = idx;
        currentParagraph = D.allParagraphs[idx];
        saveState();
        renderParagraph();
        trackRedPenEvent('redpen_act_jump', { act: actNum });
    }

    function prevParagraph() {
        clearAutoAdvance();
        const pos = currentDeckIndex();
        if (pos <= 0) return;
        if (duelActive && duelSpec) {
            duelStep--;
            currentParagraph = duelSpec.steps[duelStep].paragraph;
        } else if (dailyActive && dailyData) {
            dailyStep--;
            currentParagraph = dailyData.steps[dailyStep].paragraph;
        } else {
            state.currentIdx--;
            currentParagraph = D.allParagraphs[state.currentIdx];
            saveState();
        }
        renderParagraph();
    }

    function nextParagraph() {
        clearAutoAdvance();
        const deck = activeDeckParagraphs();
        const pos = currentDeckIndex();

        if (pos < deck.length - 1) {
            if (duelActive && duelSpec) {
                duelStep++;
                currentParagraph = duelSpec.steps[duelStep].paragraph;
            } else if (dailyActive && dailyData) {
                dailyStep++;
                currentParagraph = dailyData.steps[dailyStep].paragraph;
            } else {
                state.currentIdx++;
                currentParagraph = D.allParagraphs[state.currentIdx];
                saveState();
            }
            renderParagraph();
        } else {
            if (duelActive) {
                pauseDuelTimer();
                sprintFinished = true;
                openRecapModal('duel');
            } else if (dailyActive || playMode === 'speedrun') {
                finishSprintNow();
            } else {
                openRecapModal('audit');
            }
        }
    }

    function startDailyMode() {
        exitSpecialModes();
        playMode = 'speedrun';
        resetRunSession();
        dailyData = D.dailyGauntlet();
        dailyActive = true;
        dailyStep = 0;
        currentParagraph = dailyData.steps[0].paragraph;
        toggleDuelDrawer(false);
        renderParagraph();
        trackRedPenEvent('redpen_mode_started', { mode: 'daily', seed: dailyData.seed });
    }

    function startDuelMode(spec) {
        if (!spec || !Array.isArray(spec.steps) || spec.steps.length < 3) return false;
        exitSpecialModes();
        playMode = 'speedrun';
        resetRunSession();
        duelSpec = spec;
        duelActive = true;
        duelStep = 0;
        currentParagraph = duelSpec.steps[0].paragraph;
        toggleDuelDrawer(false);
        renderParagraph();
        trackRedPenEvent('redpen_mode_started', { mode: 'duel', count: duelSpec.steps.length });
        return true;
    }

    function restartCurrentRun() {
        if (duelActive && duelSpec) {
            startDuelMode(duelSpec);
            return;
        }
        if (dailyActive) {
            startDailyMode();
            return;
        }
        resetRunSession();
        currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
        renderParagraph();
    }

    /* ---------------- RECAP MODAL & RED-PEN AUDIT LEDGER ---------------- */
    function computeDuelVerdict(correctCount, restraintPct, totalSec, spec) {
        if (!spec || spec.sec <= 0) return { kind: '', text: '' };
        const opp = spec.by || 'Challenger';
        const maxSpans = spec.steps.length * 3;
        if (correctCount > spec.correct) {
            return { kind: 'win', text: `🏆 Victory over ${opp}: ${correctCount}/${maxSpans} Precision beats ${spec.correct}/${maxSpans}!` };
        }
        if (correctCount < spec.correct) {
            return { kind: 'loss', text: `⚔️ Narrow Defeat to ${opp}: ${correctCount}/${maxSpans} Precision vs ${spec.correct}/${maxSpans}.` };
        }
        if (restraintPct > spec.restraint) {
            return { kind: 'win', text: `🏆 Victory on Restraint over ${opp}: both ${correctCount}/${maxSpans}, Restraint ${restraintPct}% vs ${spec.restraint}%.` };
        }
        if (restraintPct < spec.restraint) {
            return { kind: 'loss', text: `⚔️ Narrow Defeat on Restraint to ${opp}: both ${correctCount}/${maxSpans}, Restraint ${restraintPct}% vs ${spec.restraint}%.` };
        }
        if (totalSec < spec.sec) {
            return { kind: 'win', text: `🏆 Victory on time over ${opp}: ${correctCount}/${maxSpans} · ${restraintPct}% Restraint (${formatClock(totalSec)} vs ${formatClock(spec.sec)}).` };
        }
        if (totalSec > spec.sec) {
            return { kind: 'loss', text: `⚔️ Narrow Defeat on time to ${opp}: ${correctCount}/${maxSpans} · ${restraintPct}% Restraint (${formatClock(totalSec)} vs ${formatClock(spec.sec)}).` };
        }
        return { kind: '', text: `🤝 Dead Heat with ${opp}: ${correctCount}/${maxSpans} · ${restraintPct}% Restraint in ${formatClock(totalSec)}.` };
    }

    function getRecapStats(mode) {
        const m = computeMetrics();
        const elapsedSec = duelActive
            ? currentDuelSeconds()
            : Math.max(0, Math.round((SPRINT_DURATION_MS - remainingMs) / 1000));

        if (mode === 'daily' && dailyData) {
            const paraEmojis = dailyData.steps.map((st) => {
                const entries = st.paragraph.spans.map((sp) => judgmentsBySpanId[sp.id]).filter(Boolean);
                if (entries.length < 3) return '⬜';
                const rightCount = entries.filter((e) => e.correct).length;
                return rightCount === 3 ? '🟩' : (rightCount >= 2 ? '🟨' : '🟥');
            }).join('');
            return {
                ...m,
                maxSpans: dailyData.steps.length * 3,
                grid: paraEmojis,
                seed: dailyData.seed,
                ids: dailyData.steps.map((s) => s.id),
                sec: elapsedSec
            };
        }
        if (mode === 'duel' && duelSpec) {
            const paraEmojis = duelSpec.steps.map((st) => {
                const entries = st.paragraph.spans.map((sp) => judgmentsBySpanId[sp.id]).filter(Boolean);
                const rightCount = entries.filter((e) => e.correct).length;
                return rightCount === 3 ? '🟩' : (rightCount >= 2 ? '🟨' : '🟥');
            }).join('');
            return {
                ...m,
                maxSpans: duelSpec.steps.length * 3,
                grid: paraEmojis,
                ids: duelSpec.ids,
                sec: currentDuelSeconds(),
                verdict: computeDuelVerdict(m.totalCorrect, m.restraintPct, currentDuelSeconds(), duelSpec)
            };
        }
        return {
            ...m,
            maxSpans: D.allParagraphs.length * 3,
            grid: '',
            sec: elapsedSec
        };
    }

    function openRecapModal(mode) {
        const modal = $('recap-modal');
        if (!modal) return;
        activeRecapMode = mode;
        recapReturnFocus = document.activeElement;

        const heading = $('recap-heading');
        const summary = $('recap-summary');
        const metricsGrid = $('recap-metrics-grid');
        const verdictEl = $('recap-verdict');
        const listEl = $('recap-step-list');
        const copyDailyBtn = $('btn-copy-daily');
        const copyDuelBtn = $('btn-copy-duel');

        const stats = getRecapStats(mode);
        if (listEl) listEl.textContent = '';
        if (metricsGrid) metricsGrid.textContent = '';
        if (verdictEl) {
            verdictEl.className = 'recap-verdict hidden';
            verdictEl.textContent = '';
        }

        const tiles = [
            { label: 'Correct', value: `${stats.totalCorrect}/${stats.totalJudged || 0}` },
            { label: 'Precision', value: `${stats.precisionPct}%` },
            { label: 'Restraint', value: `${stats.restraintPct}%` },
            { label: 'Max Streak', value: `🔥 ${maxStreak}` }
        ];
        if (metricsGrid) {
            tiles.forEach((t) => {
                const tile = document.createElement('div');
                tile.className = 'recap-metric-tile';
                const lbl = document.createElement('span');
                lbl.className = 'recap-metric-label';
                lbl.textContent = t.label;
                const val = document.createElement('span');
                val.className = 'recap-metric-value';
                val.textContent = t.value;
                tile.append(lbl, val);
                metricsGrid.appendChild(tile);
            });
        }

        if (mode === 'daily') {
            if (!inSelfTest && state.lastDailyDate !== stats.seed) {
                state.dailyStreak = state.lastDailyDate === previousDaySeed(stats.seed)
                    ? (state.dailyStreak || 0) + 1
                    : 1;
                state.lastDailyDate = stats.seed;
                state.lastDailyGrid = stats.grid;
                saveState();
            }
            if (heading) heading.textContent = `🎲 Daily 5 Seed (${stats.seed})`;
            if (summary) summary.textContent = `${stats.grid} · ${stats.totalCorrect}/${stats.maxSpans} right (${stats.precisionPct}% Precision · ${stats.restraintPct}% Restraint) · Daily Streak: 🔥 ${state.dailyStreak || 1}`;
            if (copyDailyBtn) {
                copyDailyBtn.classList.remove('hidden');
                copyDailyBtn.textContent = '📋 Copy Daily Result';
            }
            if (copyDuelBtn) {
                copyDuelBtn.classList.remove('hidden');
                copyDuelBtn.textContent = '⚔️ Challenge a Friend on These 5';
            }
        } else if (mode === 'duel') {
            if (heading) heading.textContent = '⚔️ Red-Pen Duel Complete';
            if (summary) summary.textContent = `${stats.totalCorrect}/${stats.maxSpans} Precision (${stats.precisionPct}%) · ${stats.restraintPct}% Restraint in ${formatClock(stats.sec)} · ${stats.grid}`;
            if (verdictEl && stats.verdict && stats.verdict.text) {
                verdictEl.classList.remove('hidden');
                if (stats.verdict.kind === 'win') verdictEl.classList.add('verdict-win');
                else if (stats.verdict.kind === 'loss') verdictEl.classList.add('verdict-loss');
                verdictEl.textContent = stats.verdict.text;
            }
            if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
            if (copyDuelBtn) {
                copyDuelBtn.classList.remove('hidden');
                copyDuelBtn.textContent = '⚔️ Copy Counter-Duel Link';
            }
        } else if (mode === 'audit') {
            if (heading) heading.textContent = '📖 Desk Audit Complete';
            if (summary) summary.textContent = `${stats.totalCorrect}/${stats.totalJudged} accurate · ${stats.precisionPct}% Precision · ${stats.restraintPct}% Restraint (${stats.naturalSpared}/${stats.naturalTotal} clean phrases spared).`;
            if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
            if (copyDuelBtn) copyDuelBtn.classList.add('hidden');
        } else {
            if (heading) heading.textContent = '⏱️ 90-Second Speed-Run Complete';
            if (summary) summary.textContent = `${stats.totalCorrect}/${stats.totalJudged} accurate in ${stats.sec}s · ${stats.precisionPct}% Precision · ${stats.restraintPct}% Restraint (${stats.falseAlarms} false alarm${stats.falseAlarms === 1 ? '' : 's'}).`;
            if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
            if (copyDuelBtn) copyDuelBtn.classList.add('hidden');
        }

        // Populate full <del>/<ins> Red-Pen Audit Ledger
        if (listEl) {
            if (ledgerEntries.length === 0) {
                const empty = document.createElement('div');
                empty.className = 'recap-step-row';
                empty.textContent = 'No phrases judged yet — mark an underlined span with 1, 2, or 3 to populate your ledger.';
                listEl.appendChild(empty);
            } else {
                ledgerEntries.forEach((entry) => {
                    const row = document.createElement('div');
                    row.className = 'recap-step-row';

                    const badge = document.createElement('span');
                    badge.className = 'recap-step-badge';
                    badge.textContent = `${entry.correct ? '✅' : '❌'} ${entry.verdict.toUpperCase()}`;

                    const body = document.createElement('div');
                    body.className = 'recap-step-body';

                    const sent = document.createElement('div');
                    sent.className = 'recap-step-sentence';
                    if (entry.verdict === 'natural') {
                        const keep = document.createElement('span');
                        keep.className = 'rp-keep';
                        keep.textContent = `✓ Keep: “${entry.spanText}”`;
                        sent.appendChild(keep);
                    } else {
                        const del = document.createElement('del');
                        del.className = entry.verdict === 'error' ? 'rp-del' : 'rp-del-spoken';
                        del.textContent = entry.spanText;
                        const arrow = document.createTextNode(' → ');
                        const ins = document.createElement('ins');
                        ins.className = entry.verdict === 'error' ? 'rp-ins' : 'rp-ins-spoken';
                        ins.textContent = entry.correction;
                        sent.append(del, arrow, ins);
                    }

                    const meta = document.createElement('span');
                    meta.className = 'recap-step-meta';
                    meta.textContent = `${entry.paraTitle} · ${entry.grammarLabel}`;

                    const note = document.createElement('span');
                    note.className = 'recap-step-note';
                    note.textContent = entry.explanation;

                    body.append(sent, meta, note);
                    row.append(badge, body);
                    listEl.appendChild(row);
                });
            }
        }

        trackRedPenEvent('redpen_mode_completed', {
            mode,
            correct: stats.totalCorrect,
            judged: stats.totalJudged,
            precision: stats.precisionPct,
            restraint: stats.restraintPct
        });

        modal.classList.add('open');
        const firstFocus = (copyDuelBtn && !copyDuelBtn.classList.contains('hidden'))
            ? copyDuelBtn
            : ($('btn-replay-sprint') || $('btn-close-recap'));
        if (firstFocus && !inSelfTest) firstFocus.focus();
    }

    function closeRecapModal(restoreMode) {
        const modal = $('recap-modal');
        if (!modal) return;
        const closedMode = activeRecapMode;
        modal.classList.remove('open');
        activeRecapMode = null;

        if (restoreMode && (closedMode === 'daily' || closedMode === 'duel')) {
            exitSpecialModes();
            resetRunSession();
            currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
            renderParagraph();
        }
        if (recapReturnFocus && document.contains(recapReturnFocus)) {
            try { recapReturnFocus.focus(); } catch (_) {}
        }
    }

    function copyTextWithFallback(text, onDone) {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(text).then(onDone).catch(() => fallbackCopy(text, onDone));
        } else {
            fallbackCopy(text, onDone);
        }
    }

    function fallbackCopy(text, onDone) {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            if (onDone) onDone();
        } catch (_) {}
    }

    function copyDailyResult() {
        const stats = getRecapStats('daily');
        const shareText = `Red-Pen Speed-Run · ${stats.seed} · ${stats.totalCorrect}/${stats.maxSpans} (${stats.restraintPct}% Restraint)\n${stats.grid} 🔥 Streak: ${state.dailyStreak || 1}\n${SHARE_BASE_URL}?mode=daily`;
        const btn = $('btn-copy-daily');
        copyTextWithFallback(shareText, () => {
            if (btn) {
                btn.textContent = '✓ Copied! Paste in chat';
                setTimeout(() => { if (btn) btn.textContent = '📋 Copy Daily Result'; }, 2200);
            }
            trackRedPenEvent('redpen_share_copied', { kind: 'daily', seed: stats.seed });
        });
    }

    function buildDuelUrl(token) {
        if (location.protocol.startsWith('http')) {
            return `${location.origin}${location.pathname}?duel=${encodeURIComponent(token)}`;
        }
        return `${SHARE_BASE_URL}?duel=${encodeURIComponent(token)}`;
    }

    function copyCounterDuelLink() {
        const mode = activeRecapMode === 'daily' ? 'daily' : 'duel';
        const stats = getRecapStats(mode);
        const token = D.encodeDuel({
            ids: stats.ids,
            correct: stats.totalCorrect,
            restraint: stats.restraintPct,
            sec: stats.sec || 0,
            by: state.playerName
        });
        if (!token) return;
        const url = buildDuelUrl(token);
        const shareText = mode === 'duel'
            ? `Red-Pen Speed-Run Duel · ${stats.totalCorrect}/${stats.maxSpans} · ${stats.restraintPct}% Restraint in ${formatClock(stats.sec)}\nCan you beat my score?\n${url}`
            : `Red-Pen Speed-Run 5-Paragraph Challenge · ${stats.totalCorrect}/${stats.maxSpans} · ${stats.restraintPct}% Restraint\n${url}`;
        const btn = $('btn-copy-duel');
        copyTextWithFallback(shareText, () => {
            if (btn) {
                btn.textContent = '✓ Duel Link Copied!';
                setTimeout(() => { if (btn) btn.textContent = mode === 'duel' ? '⚔️ Copy Counter-Duel Link' : '⚔️ Challenge a Friend on These 5'; }, 2200);
            }
            trackRedPenEvent('redpen_share_copied', { kind: 'duel' });
        });
    }

    function openDiagnosticFromRecap() {
        const mode = activeRecapMode || playMode;
        const stats = getRecapStats(mode);
        closeRecapModal(false);

        if (location.protocol.startsWith('http') && typeof window.showDiagnosticGate === 'function') {
            window.showDiagnosticGate({
                gameName: mode === 'daily'
                    ? 'Red-Pen Speed-Run (Daily 5)'
                    : (mode === 'duel' ? 'Red-Pen Speed-Run (Duel)' : 'Red-Pen Speed-Run (C1 Clinic)'),
                score: stats.totalCorrect,
                maxScore: Math.max(1, stats.totalJudged || stats.maxSpans),
                category: 'register_shift',
                weakArea: 'Distinguishing Actual Grammar Errors from Register & Clean C1 Style',
                examImpact: 'In IELTS and Cambridge C1 writing, over-correcting clean prose lowers natural fluency while uncountable nouns and preposition slips cost Grammatical Accuracy.',
                onReplay: () => {
                    if (mode === 'daily') startDailyMode();
                    else {
                        setPlayMode('speedrun');
                    }
                }
            });
        } else {
            window.location.href = 'index.html?offer=live_diagnostic_35#cal-booking-box';
        }
    }

    /* ---------------- DUEL FORGE DRAWER ---------------- */
    function initDuelForgeUI() {
        const grid = $('duel-slots-grid');
        if (!grid) return;
        grid.textContent = '';

        const initial = D.duelPreset('c1_mix').ids;
        for (let slot = 0; slot < 5; slot++) {
            const field = document.createElement('div');
            field.className = 'duel-slot-field';
            const lbl = document.createElement('label');
            lbl.setAttribute('for', `duel-slot-${slot}`);
            lbl.textContent = `Paragraph ${slot + 1}`;
            const sel = document.createElement('select');
            sel.id = `duel-slot-${slot}`;
            sel.className = 'duel-slot-select';

            D.acts.forEach((actMeta) => {
                const grp = document.createElement('optgroup');
                grp.label = actMeta.title;
                D.allParagraphs.filter((p) => p.act === actMeta.act).forEach((para) => {
                    const opt = document.createElement('option');
                    opt.value = para.id;
                    opt.textContent = `${para.id.toUpperCase()} · ${para.title} (${para.cefr})`;
                    grp.appendChild(opt);
                });
                sel.appendChild(grp);
            });

            sel.value = initial[slot];
            sel.addEventListener('change', updateDuelPreview);
            field.append(lbl, sel);
            grid.appendChild(field);
        }
        updateDuelPreview();
    }

    function getSelectedDuelIds() {
        const sels = Array.from(document.querySelectorAll('#duel-slots-grid .duel-slot-select'));
        return sels.map((s) => s.value);
    }

    function applyDuelPreset(presetKey) {
        const preset = D.duelPreset(presetKey);
        const sels = Array.from(document.querySelectorAll('#duel-slots-grid .duel-slot-select'));
        preset.ids.forEach((id, idx) => {
            if (sels[idx]) sels[idx].value = id;
        });
        setFeedback($('duel-forge-status'), '', '');
        updateDuelPreview();
    }

    function updateDuelPreview() {
        const preview = $('duel-preview-list');
        if (!preview || preview.classList.contains('hidden')) return;
        preview.textContent = '';
        const ids = getSelectedDuelIds();
        ids.forEach((id, idx) => {
            const p = D.findById(id);
            if (!p) return;
            const line = document.createElement('div');
            line.textContent = `${idx + 1}. [${p.cefr}] ${p.title} → ${D.renderCleanModel(p)}`;
            preview.appendChild(line);
        });
    }

    function toggleDuelDrawer(forceOpen) {
        const drawer = $('duel-forge-drawer');
        const btn = $('duel-forge-btn');
        if (!drawer) return;
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : drawer.classList.contains('hidden');
        drawer.classList.toggle('hidden', !willOpen);
        if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    }

    /* ---------------- URL ROUTE HANDLING ---------------- */
    function applyUrlRoute() {
        const params = new URLSearchParams(location.search);

        const duelRaw = params.get('duel');
        if (duelRaw !== null) {
            const decoded = D.decodeDuel(duelRaw);
            if (decoded && startDuelMode(decoded)) {
                trackRedPenEvent('redpen_entry', { entry: 'duel' });
                return true;
            }
            currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
            renderParagraph();
            setFeedback($('verdict-feedback'), 'That duel link could not be read — loaded Act I instead.', 'error');
            return true;
        }

        const mode = (params.get('mode') || '').toLowerCase();
        if (mode === 'daily') {
            startDailyMode();
            trackRedPenEvent('redpen_entry', { entry: 'daily' });
            return true;
        }
        if (mode === 'audit') {
            setPlayMode('audit');
            trackRedPenEvent('redpen_entry', { entry: 'audit' });
            return true;
        }

        if (params.has('act')) {
            const actNum = parseInt(params.get('act'), 10);
            if (actNum >= 1 && actNum <= 4) {
                jumpToAct(actNum);
                trackRedPenEvent('redpen_entry', { entry: `act_${actNum}` });
                return true;
            }
        }

        return false;
    }

    /* ---------------- ?selftest=1 ---------------- */
    function runSelfTest() {
        const out = document.createElement('pre');
        out.id = 'selftest';
        const checks = [];
        const recordCheck = (name, ok, detail) => {
            checks.push({ name, pass: Boolean(ok), detail });
        };

        const dataRes = D.dataTests();
        recordCheck('data_tests', dataRes.pass, dataRes.lines.join(' | '));
        let pass = dataRes.pass;
        const lines = ['RED-PEN SPEED-RUN SELFTEST'].concat(dataRes.lines);

        let savedRawStorage = null;
        try { savedRawStorage = localStorage.getItem(STORAGE_KEY); } catch (_) {}
        const savedStateJson = JSON.stringify(state);

        inSelfTest = true;
        exitSpecialModes();

        try {
            // 1. Default 90s Speed-Run UI check
            playMode = 'speedrun';
            resetRunSession();
            state.currentIdx = 0;
            currentParagraph = D.allParagraphs[0];
            renderParagraph();

            const defaultUiOk = $('hud-timer').textContent.includes('90.0s') &&
                document.querySelectorAll('#prose-sheet .rp-span').length === 3 &&
                document.querySelectorAll('.verdict-btn').length === 3;
            recordCheck('speedrun_default_ui', defaultUiOk, $('hud-timer').textContent);
            if (!defaultUiOk) {
                pass = false;
                lines.push('FAIL default 90.0s Speed-Run UI check');
            }

            // 2. Untimed Desk Audit across ALL 20 paragraphs (60 spans)
            setPlayMode('audit');
            let solvedAllSpans = 0;
            let modelMatches = 0;

            for (let idx = 0; idx < D.allParagraphs.length; idx++) {
                const p = D.allParagraphs[idx];
                state.currentIdx = idx;
                currentParagraph = p;
                renderParagraph();

                for (let s = 0; s < p.spans.length; s++) {
                    selectSpan(s, false);
                    const sp = p.spans[s];
                    const ok = judgeActiveSpan(sp.verdict);
                    if (ok) solvedAllSpans++;
                    if ($('desk-note-card').classList.contains('hidden') ||
                        $('desk-grammar-tag').textContent !== sp.grammarLabel) {
                        pass = false;
                        lines.push(`FAIL ${sp.id}: Desk Audit note card mismatch`);
                    }
                }

                // Reveal Structural Blueprint + Cambridge Model
                toggleBlueprint(true, true);
                const expectedModel = `✔ Cambridge Model: ${D.renderCleanModel(p)}`;
                if (!$('blueprint-model-output').classList.contains('hidden') &&
                    $('blueprint-model-output').textContent === expectedModel) {
                    modelMatches++;
                } else {
                    pass = false;
                    lines.push(`FAIL ${p.id}: Cambridge Model output mismatch`);
                }
            }
            const audit60Ok = solvedAllSpans === 60 && modelMatches === 20;
            recordCheck('desk_audit_all_60', audit60Ok, `${solvedAllSpans}/60 spans, ${modelMatches}/20 models`);
            lines.push(`(e2e) Desk Audit solved ${solvedAllSpans}/60 spans and matched ${modelMatches}/20 Cambridge Models`);

            // 3. Restraint Penalty check: flagging a 'natural' span as 'error' drops Restraint below 100%
            setPlayMode('speedrun');
            state.currentIdx = 0;
            currentParagraph = D.allParagraphs[0]; // p1a-1 is 'natural'
            renderParagraph();
            selectSpan(0, false);
            judgeActiveSpan('error');
            const mAfterPenalty = computeMetrics();
            const restraintOk = mAfterPenalty.falseAlarms === 1 && mAfterPenalty.restraintPct === 0 &&
                $('restraint-display').textContent.includes('0%');
            recordCheck('restraint_penalty', restraintOk, `restraintPct=${mAfterPenalty.restraintPct}, falseAlarms=${mAfterPenalty.falseAlarms}`);
            if (!restraintOk) {
                pass = false;
                lines.push(`FAIL restraint penalty check: ${JSON.stringify(mAfterPenalty)}`);
            }

            // 4. Keyboard navigation (ArrowRight/ArrowLeft + keys '1','2','3')
            setPlayMode('speedrun');
            state.currentIdx = 0;
            currentParagraph = D.allParagraphs[0];
            renderParagraph();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
            const movedRight = activeSpanIdx === 1;
            document.dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true })); // p1a-2 is 'spoken'
            const kbJudged = Boolean(judgmentsBySpanId['p1a-2'] && judgmentsBySpanId['p1a-2'].correct);
            recordCheck('keyboard_nav_and_verdicts', movedRight && kbJudged, `movedRight=${movedRight}, kbJudged=${kbJudged}`);
            if (!movedRight || !kbJudged) {
                pass = false;
                lines.push(`FAIL keyboard nav/verdict check (movedRight=${movedRight}, kbJudged=${kbJudged})`);
            }

            // 5. Speed-Run Finish & <del>/<ins> Audit Ledger Modal
            finishSprintNow();
            const ledgerRows = document.querySelectorAll('#recap-step-list .recap-step-row');
            const ledgerHasDelIns = document.querySelectorAll('#recap-step-list del, #recap-step-list ins').length >= 2;
            const modalOk = $('recap-modal').classList.contains('open') && ledgerRows.length >= 1 && ledgerHasDelIns;
            recordCheck('speedrun_recap_ledger', modalOk, `rows=${ledgerRows.length}, delIns=${ledgerHasDelIns}`);
            if (!modalOk) {
                pass = false;
                lines.push('FAIL Speed-Run recap modal / <del><ins> ledger check');
            }
            closeRecapModal(false);

            // 6. Daily 5 Mode check
            startDailyMode();
            const dailyOk = dailyActive && dailyData && dailyData.steps.length === 5 &&
                $('mode-badge').textContent.includes('Daily 1/5');
            recordCheck('daily_5_mode', dailyOk, dailyData ? dailyData.seed : 'none');
            if (!dailyOk) {
                pass = false;
                lines.push('FAIL Daily 5 mode check');
            }

            // 7. Timed Duel Mode + Encode/Decode + Verdict check (anonymised name 'Tester')
            const tok = D.encodeDuel({ ids: ['p1a', 'p2b', 'p3d', 'p4a', 'p4e'], correct: 14, restraint: 100, sec: 58, by: 'Tester' });
            const parsedDuel = D.decodeDuel(tok);
            startDuelMode(parsedDuel);
            const duelBannerOk = duelActive && !$('duel-target-banner').classList.contains('hidden') &&
                $('duel-target-banner').textContent.includes('Tester');
            // Judge all 5 duel paragraphs cleanly
            for (let stepIdx = 0; stepIdx < duelSpec.steps.length; stepIdx++) {
                const dp = duelSpec.steps[stepIdx].paragraph;
                duelStep = stepIdx;
                currentParagraph = dp;
                renderParagraph();
                for (let s = 0; s < 3; s++) {
                    selectSpan(s, false);
                    judgeActiveSpan(dp.spans[s].verdict);
                }
            }
            const duelDoneOk = duelBannerOk && sprintFinished && duelTurnStartedAt === null &&
                $('recap-modal').classList.contains('open') &&
                !$('btn-copy-duel').classList.contains('hidden');
            recordCheck('duel_mode_and_verdict', duelDoneOk, $('recap-verdict').textContent);
            if (!duelDoneOk) {
                pass = false;
                lines.push('FAIL Timed Duel mode / verdict / recap modal check');
            }
            closeRecapModal(false);

            // 8. Clean screen-share guard (?wl=1)
            syncCleanModeUI(true);
            const wlHidden = $('belfast-desk-strip').classList.contains('hidden');
            syncCleanModeUI(false);
            recordCheck('wl_screenshare_guard', wlHidden, `hidden=${wlHidden}`);
            if (!wlHidden) {
                pass = false;
                lines.push('FAIL clean screenshare guard did not hide #belfast-desk-strip');
            }
        } catch (err) {
            pass = false;
            lines.push('FAIL runtime error: ' + err.message);
            recordCheck('runtime_exception', false, err.message);
        }

        // Restore clean state without touching real localStorage
        exitSpecialModes();
        playMode = 'speedrun';
        resetRunSession();
        inSelfTest = false;
        state = ensureState(JSON.parse(savedStateJson));
        try {
            if (savedRawStorage === null) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, savedRawStorage);
        } catch (_) {}
        syncCleanModeUI();
        currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
        renderParagraph();

        lines.push(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
        window.__SELFTEST_RESULT__ = { pass, checks };

        out.textContent = lines.join('\n');
        out.dataset.pass = pass ? 'true' : 'false';
        out.style.cssText = `white-space:pre-wrap;background:#0f172a;color:${pass ? '#34d399' : '#fda4af'};padding:14px;border-radius:10px;font-family:monospace;font-size:12px;margin:16px auto;max-width:920px;border:2px solid ${pass ? '#047857' : '#be123c'};`;
        document.body.appendChild(out);
    }

    /* ---------------- BOOT & EVENT WIRING ---------------- */
    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        syncCleanModeUI();

        try {
            new MutationObserver(() => syncCleanModeUI()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        } catch (_) {}
        window.addEventListener('storage', (e) => {
            if (e.key === CLEAN_KEY) syncCleanModeUI();
        });

        initDuelForgeUI();

        if ($('player-name-input')) {
            $('player-name-input').value = state.playerName || '';
            $('player-name-input').addEventListener('input', () => {
                state.playerName = $('player-name-input').value.replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 18);
                saveState();
            });
        }

        if ($('audio-toggle')) {
            $('audio-toggle').addEventListener('click', () => {
                soundEnabled = !soundEnabled;
                $('audio-toggle').setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
                $('audio-toggle').textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
                if (soundEnabled) sfx('penTick');
            });
        }

        if ($('daily-seed-btn')) $('daily-seed-btn').addEventListener('click', startDailyMode);
        if ($('duel-forge-btn')) $('duel-forge-btn').addEventListener('click', () => toggleDuelDrawer());
        if ($('duel-forge-close')) $('duel-forge-close').addEventListener('click', () => toggleDuelDrawer(false));

        if ($('exit-mode-btn')) {
            $('exit-mode-btn').addEventListener('click', () => {
                exitSpecialModes();
                playMode = 'speedrun';
                resetRunSession();
                currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
                renderParagraph();
            });
        }

        document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                const playAttr = btn.dataset.playmode || '';
                const actNum = parseInt(btn.dataset.act || '', 10);
                if (playAttr) {
                    setPlayMode(playAttr);
                } else if (!Number.isNaN(actNum)) {
                    jumpToAct(actNum);
                } else if (btn.dataset.mode === 'daily') {
                    startDailyMode();
                } else if (btn.dataset.mode === 'duel') {
                    toggleDuelDrawer();
                }
            });
        });

        document.querySelectorAll('[data-duel-preset]').forEach((btn) => {
            btn.addEventListener('click', () => applyDuelPreset(btn.dataset.duelPreset));
        });

        if ($('duel-preview-toggle')) {
            $('duel-preview-toggle').addEventListener('click', () => {
                const list = $('duel-preview-list');
                if (!list) return;
                const willShow = list.classList.contains('hidden');
                list.classList.toggle('hidden', !willShow);
                $('duel-preview-toggle').setAttribute('aria-pressed', willShow ? 'true' : 'false');
                $('duel-preview-toggle').textContent = willShow ? '🙈 Hide clean models' : '👁️ Show clean models';
                updateDuelPreview();
            });
        }

        if ($('btn-copy-instant-duel')) {
            $('btn-copy-instant-duel').addEventListener('click', () => {
                const uniqueIds = [...new Set(getSelectedDuelIds())];
                if (uniqueIds.length < 3) {
                    setFeedback($('duel-forge-status'), 'Choose at least 3 distinct paragraphs for a duel.', 'error');
                    return;
                }
                const tok = D.encodeDuel({ ids: uniqueIds, correct: 0, restraint: 100, sec: 0, by: state.playerName });
                if (!tok) {
                    setFeedback($('duel-forge-status'), 'Select 3–5 distinct paragraphs.', 'error');
                    return;
                }
                const url = buildDuelUrl(tok);
                copyTextWithFallback(url, () => {
                    setFeedback($('duel-forge-status'), '✓ Instant duel link copied!', 'success');
                });
            });
        }

        if ($('btn-start-duel')) {
            $('btn-start-duel').addEventListener('click', () => {
                const uniqueIds = [...new Set(getSelectedDuelIds())];
                if (uniqueIds.length < 3) {
                    setFeedback($('duel-forge-status'), 'Choose at least 3 distinct paragraphs to start.', 'error');
                    return;
                }
                const tok = D.encodeDuel({ ids: uniqueIds, correct: 0, restraint: 100, sec: 0, by: state.playerName });
                const spec = D.decodeDuel(tok);
                if (spec) startDuelMode(spec);
            });
        }

        if ($('btn-start-sprint')) $('btn-start-sprint').addEventListener('click', startSprintTimer);
        if ($('btn-verdict-error')) $('btn-verdict-error').addEventListener('click', () => judgeActiveSpan('error'));
        if ($('btn-verdict-spoken')) $('btn-verdict-spoken').addEventListener('click', () => judgeActiveSpan('spoken'));
        if ($('btn-verdict-natural')) $('btn-verdict-natural').addEventListener('click', () => judgeActiveSpan('natural'));

        if ($('btn-prev')) $('btn-prev').addEventListener('click', prevParagraph);
        if ($('btn-next')) $('btn-next').addEventListener('click', nextParagraph);
        if ($('btn-restart')) $('btn-restart').addEventListener('click', restartCurrentRun);
        if ($('btn-finish-early')) {
            $('btn-finish-early').addEventListener('click', () => {
                if (duelActive) {
                    pauseDuelTimer();
                    sprintFinished = true;
                    openRecapModal('duel');
                } else if (dailyActive || playMode === 'speedrun') {
                    finishSprintNow();
                } else {
                    openRecapModal('audit');
                }
            });
        }

        if ($('btn-blueprint')) $('btn-blueprint').addEventListener('click', () => toggleBlueprint());
        if ($('btn-reveal-model')) {
            $('btn-reveal-model').addEventListener('click', () => {
                updateBlueprintCard(true);
                sfx('penTick');
            });
        }

        if ($('btn-replay-sprint')) {
            $('btn-replay-sprint').addEventListener('click', () => {
                closeRecapModal(false);
                if (duelActive && duelSpec) startDuelMode(duelSpec);
                else if (dailyActive) startDailyMode();
                else setPlayMode('speedrun');
            });
        }
        if ($('btn-switch-audit')) {
            $('btn-switch-audit').addEventListener('click', () => {
                closeRecapModal(false);
                setPlayMode('audit');
            });
        }
        if ($('btn-copy-daily')) $('btn-copy-daily').addEventListener('click', copyDailyResult);
        if ($('btn-copy-duel')) $('btn-copy-duel').addEventListener('click', copyCounterDuelLink);
        if ($('btn-open-diagnostic')) $('btn-open-diagnostic').addEventListener('click', openDiagnosticFromRecap);
        if ($('btn-close-recap')) $('btn-close-recap').addEventListener('click', () => closeRecapModal(true));

        /* ---------------- BELFAST DESK INLINE DRAWER ---------------- */
        function syncRedPenDeskContext() {
            const summaryEl = $('redpen-desk-active-summary');
            const ctxHidden = $('redpen-desk-context-hidden');
            const dossierEl = $('redpen-desk-dossier');
            const p = currentParagraph;
            const m = computeMetrics();
            const paraLabel = p ? `${p.genre} · ${p.title}` : 'Red-Pen Speed-Run';
            const scoreLabel = `Judged ${m.totalJudged} · Restraint ${m.restraintPct}% · Precision ${m.precisionPct}%`;
            if (summaryEl) summaryEl.textContent = `${paraLabel} · ${scoreLabel}`;
            if (ctxHidden) ctxHidden.value = `${paraLabel} | ${scoreLabel}`;
            if (dossierEl) {
                let dossierVal = '';
                try {
                    if (window.CandidateDossier && typeof window.CandidateDossier.getSummary === 'function') {
                        const ds = window.CandidateDossier.getSummary();
                        if (ds && ds.playedCategories > 0) {
                            dossierVal = `${ds.code} | ${ds.cefrBand} | Focus: ${ds.weakestSkill || 'Register Control'}`;
                        }
                    }
                } catch (_) {}
                dossierEl.value = dossierVal;
            }
        }

        const toggleDeskBtn = $('btn-toggle-redpen-desk');
        const deskDrawer = $('redpen-desk-drawer');
        if (toggleDeskBtn && deskDrawer) {
            toggleDeskBtn.addEventListener('click', () => {
                const willOpen = deskDrawer.classList.contains('hidden');
                deskDrawer.classList.toggle('hidden', !willOpen);
                toggleDeskBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                if (willOpen) {
                    syncRedPenDeskContext();
                    const msgEl = $('redpen-desk-message');
                    if (msgEl) msgEl.focus();
                }
            });
        }

        const redPenDeskForm = $('redpen-desk-form');
        if (redPenDeskForm) {
            redPenDeskForm.addEventListener('submit', async (e) => {
                if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;
                e.preventDefault();
                if (redPenDeskForm.dataset.submitting === 'true') return;

                const gotcha = redPenDeskForm.querySelector('input[name="_gotcha"]');
                const statusEl = $('redpen-desk-status');
                const submitBtn = $('redpen-desk-submit');
                const origText = submitBtn ? submitBtn.textContent : 'Send to My Desk →';

                if (gotcha && gotcha.value.trim()) {
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-success';
                        statusEl.textContent = 'Sent to my desk — thank you.';
                    }
                    return;
                }

                syncRedPenDeskContext();
                redPenDeskForm.dataset.submitting = 'true';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
                if (statusEl) {
                    statusEl.className = 'desk-form-status';
                    statusEl.textContent = '';
                }

                try {
                    const res = await fetch(redPenDeskForm.action || 'https://formspree.io/f/mvkgrwvj', {
                        method: 'POST',
                        body: new FormData(redPenDeskForm),
                        headers: { Accept: 'application/json' }
                    });
                    if (!res.ok) throw new Error('Request failed');
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-success';
                        statusEl.textContent = 'Received at my desk in Northern Ireland. I will send a sentence-level Error vs Style note back within 24 hours.';
                    }
                    if (submitBtn) submitBtn.textContent = 'Sent to My Desk ✓';
                    trackRedPenEvent('desk_dropbox_submitted', { tool: 'red_pen_speedrun' });
                } catch (_) {
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-error';
                        statusEl.innerHTML = 'Something stopped the form from sending. Please email me directly at <a href="mailto:gareth@garethenglish.com?subject=Red-Pen%20Error%20vs%20Style%20Check" style="color:inherit;text-decoration:underline;font-weight:700;">gareth@garethenglish.com</a>.';
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = origText;
                    }
                } finally {
                    redPenDeskForm.dataset.submitting = 'false';
                }
            });
        }

        // Keyboard shortcuts: 1=Error, 2=Spoken, 3=Leave Alone, ArrowLeft/Right, Enter
        document.addEventListener('keydown', (e) => {
            const modal = $('recap-modal');
            if (modal && modal.classList.contains('open')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeRecapModal(true);
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = Array.from(modal.querySelectorAll('button:not(.hidden):not([disabled]), a[href]:not(.hidden)'));
                    if (focusables.length > 0) {
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
                }
                return;
            }
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;

            if (e.key === '1') {
                e.preventDefault();
                judgeActiveSpan('error');
                return;
            }
            if (e.key === '2') {
                e.preventDefault();
                judgeActiveSpan('spoken');
                return;
            }
            if (e.key === '3') {
                e.preventDefault();
                judgeActiveSpan('natural');
                return;
            }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                const len = currentParagraph.spans.length;
                selectSpan((activeSpanIdx + 1) % len, true);
                sfx('penTick');
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                const len = currentParagraph.spans.length;
                selectSpan((activeSpanIdx - 1 + len) % len, true);
                sfx('penTick');
                return;
            }
            if (e.key === 'Enter' && !sprintFinished) {
                if (tag !== 'BUTTON' && $('btn-next') && !$('btn-next').disabled) {
                    e.preventDefault();
                    nextParagraph();
                }
            }
        });

        const routed = applyUrlRoute();
        if (!routed) {
            currentParagraph = D.allParagraphs[state.currentIdx] || D.allParagraphs[0];
            renderParagraph();
            trackRedPenEvent('redpen_entry', { entry: 'direct', mode: playMode });
        }

        if (/[?&]selftest=1\b/.test(location.search)) {
            runSelfTest();
        }
    });
})();
