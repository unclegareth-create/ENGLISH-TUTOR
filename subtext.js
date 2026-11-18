/* ==========================================================
   Between the Lines: C1/C2 Subtext & Surgical Politeness
   Runtime Controller, Two-Phase Card Engine, Duel Timer & Self-Test
   ========================================================== */
(() => {
    'use strict';

    const D = window.SUBTEXT_DATA;
    if (!D) {
        console.error('subtext-data.js must be loaded before subtext.js');
        return;
    }

    const STORAGE_KEY = 'gm_subtext_state_v1';
    const CLEAN_KEY = 'gm_teacher_clean_screenshare';
    const SHARE_BASE_URL = 'https://garethenglish.com/between-the-lines.html';

    const $ = (id) => document.getElementById(id);

    /* ---------------- STATE ---------------- */
    let state = {
        currentIdx: 0,
        streak: 0,
        dailyStreak: 0,
        lastDailyDate: '',
        lastDailyGrid: '',
        solvedIds: [],
        playerName: ''
    };

    let currentExchange = D.allExchanges[0];
    let scalpelFound = false;
    let meaningSolved = false;
    let phase2Solved = false;
    let scalpelWrongClicks = 0;
    let meaningWrongClicks = 0;
    let phase2Mistakes = 0;
    let hintsUsed = 0;
    let modelRevealedBeforeSolve = false;

    let slotAssignments = [];
    let bankChips = [];
    let targetedSlot = null;

    let dailyActive = false;
    let dailyData = null;
    let dailyStep = 0;
    let dailyResults = [];

    let duelActive = false;
    let duelSpec = null;
    let duelStep = 0;
    let duelResults = [];
    let duelElapsedMs = 0;
    let duelTurnStartedAt = null;
    let duelTimerInterval = null;

    let activeRecapMode = null;
    let recapReturnFocus = null;
    let inSelfTest = false;
    let soundEnabled = false;
    let audioCtx = null;

    /* ---------------- GENTLE WEB AUDIO (DEFAULT OFF) ---------------- */
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
            gain.gain.linearRampToValueAtTime(vol, t + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        } catch (_) {}
    }

    function sfx(kind) {
        if (!soundEnabled || inSelfTest) return;
        if (kind === 'tap') playTone(460, 0.04, 0.025, 'sine');
        else if (kind === 'scalpel') {
            playTone(540, 0.05, 0.03, 'triangle', 0);
            playTone(680, 0.07, 0.03, 'sine', 0.04);
        } else if (kind === 'error') {
            playTone(200, 0.08, 0.03, 'sine', 0);
        } else if (kind === 'solve') {
            playTone(523.25, 0.12, 0.032, 'sine', 0);
            playTone(659.25, 0.16, 0.032, 'sine', 0.08);
        }
    }

    /* ---------------- TELEMETRY & STORAGE ---------------- */
    function trackSubtextEvent(eventName, params) {
        if (inSelfTest) return;
        try {
            if (typeof window.trackFunnelEvent === 'function') {
                window.trackFunnelEvent(eventName, { tool: 'between-the-lines', ...(params || {}) });
            }
        } catch (_) {}
    }

    function ensureState(raw) {
        const out = {
            currentIdx: 0,
            streak: 0,
            dailyStreak: 0,
            lastDailyDate: '',
            lastDailyGrid: '',
            solvedIds: [],
            playerName: ''
        };
        if (raw && typeof raw === 'object') {
            const idx = parseInt(raw.currentIdx, 10);
            if (!Number.isNaN(idx) && idx >= 0 && idx < D.allExchanges.length) out.currentIdx = idx;
            out.streak = Math.max(0, parseInt(raw.streak, 10) || 0);
            out.dailyStreak = Math.max(0, parseInt(raw.dailyStreak, 10) || 0);
            out.lastDailyDate = typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : '';
            out.lastDailyGrid = typeof raw.lastDailyGrid === 'string' ? raw.lastDailyGrid : '';
            if (Array.isArray(raw.solvedIds)) {
                out.solvedIds = [...new Set(raw.solvedIds.filter((id) => Boolean(D.findById(id))))];
            }
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

    /* ---------------- HELPERS ---------------- */
    function shuffleArray(arr) {
        const copy = arr.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        return copy;
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

    function resumeDuelTimer() {
        if (!duelActive || phase2Solved) return;
        if (duelTurnStartedAt === null) {
            duelTurnStartedAt = Date.now();
        }
        if (!duelTimerInterval && !inSelfTest) {
            duelTimerInterval = setInterval(updateModeBadge, 250);
        }
        updateModeBadge();
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
    }

    function stopDuelTimer() {
        duelTurnStartedAt = null;
        if (duelTimerInterval) {
            clearInterval(duelTimerInterval);
            duelTimerInterval = null;
        }
    }

    function refreshHud() {
        const progressEl = $('hud-progress');
        const streakEl = $('streak-display');

        if (progressEl) {
            if (duelActive && duelSpec) {
                progressEl.textContent = `Duel ${duelStep + 1}/${duelSpec.steps.length}`;
            } else if (dailyActive && dailyData) {
                progressEl.textContent = `Daily ${dailyStep + 1}/${dailyData.steps.length}`;
            } else {
                progressEl.textContent = `Exchange ${state.currentIdx + 1}/${D.allExchanges.length}`;
            }
        }
        if (streakEl) {
            streakEl.textContent = `🔥 ${state.streak}`;
        }

        document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
            const btnAct = parseInt(btn.dataset.act || '', 10);
            const btnMode = btn.dataset.mode || '';
            let isActive = false;
            if (duelActive) isActive = btnMode === 'duel';
            else if (dailyActive) isActive = btnMode === 'daily';
            else if (!Number.isNaN(btnAct)) isActive = currentExchange && currentExchange.act === btnAct;
            btn.classList.toggle('active', isActive);
        });

        updateModeBadge();
    }

    function setFeedback(el, text, kind) {
        if (!el) return;
        el.textContent = text || '';
        el.className = 'feedback-line' + (kind ? ` is-${kind}` : '');
    }

    /* ---------------- BLUEPRINT & MODEL PANEL ---------------- */
    function updateBlueprintCard(revealModel) {
        const ex = currentExchange;
        if (!ex) return;
        if ($('blueprint-device')) $('blueprint-device').textContent = ex.speakerB.scalpelDevice;
        if ($('blueprint-cefr')) $('blueprint-cefr').textContent = ex.cefr;
        if ($('blueprint-formula')) $('blueprint-formula').textContent = ex.formula;
        if ($('blueprint-note')) $('blueprint-note').textContent = ex.modelNote;

        const fullModel = D.formatReply(ex.replyBefore, ex.targetTokens, ex.replyAfter);
        const showModel = Boolean(phase2Solved || revealModel);
        const modelOut = $('blueprint-model-output');
        const revealBtn = $('btn-reveal-model');
        if (modelOut) {
            modelOut.textContent = showModel ? `✔ Cambridge Model: "${fullModel}"` : '';
            modelOut.classList.toggle('hidden', !showModel);
        }
        if (revealBtn) {
            revealBtn.classList.toggle('hidden', showModel);
        }
    }

    function toggleBlueprint(forceOpen, revealModel) {
        const panel = $('blueprint-panel');
        const btn = $('btn-blueprint');
        if (!panel) return;
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : panel.classList.contains('hidden');
        panel.classList.toggle('hidden', !willOpen);
        if (btn) {
            btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            btn.textContent = willOpen ? '🙈 Hide Structural Blueprint' : '👁️ Reveal Structural Blueprint';
        }
        if (willOpen) {
            updateBlueprintCard(Boolean(revealModel));
        }
    }

    /* ---------------- RENDER EXCHANGE ---------------- */
    function renderExchange() {
        const ex = currentExchange;
        if (!ex) return;

        scalpelFound = false;
        meaningSolved = false;
        phase2Solved = false;
        scalpelWrongClicks = 0;
        meaningWrongClicks = 0;
        phase2Mistakes = 0;
        hintsUsed = 0;
        modelRevealedBeforeSolve = false;
        targetedSlot = null;

        // Duel target banner
        const banner = $('duel-target-banner');
        if (banner) {
            if (duelActive && duelSpec) {
                banner.classList.remove('hidden');
                if (duelSpec.sec > 0) {
                    const who = duelSpec.by || 'Challenger';
                    banner.textContent = `🎯 Target to beat: ${who} scored ${duelSpec.clean}/${duelSpec.steps.length} Clean in ${formatClock(duelSpec.sec)}`;
                } else {
                    banner.textContent = `⚔️ Custom ${duelSpec.steps.length}-Exchange Duel — set the benchmark!`;
                }
            } else {
                banner.classList.add('hidden');
                banner.textContent = '';
            }
        }

        const actInfo = D.acts.find((a) => a.act === ex.act) || D.acts[0];
        if ($('exchange-meta-tag')) {
            const globalNum = D.allExchanges.findIndex((item) => item.id === ex.id) + 1;
            $('exchange-meta-tag').textContent = `ACT ${['I', 'II', 'III', 'IV'][ex.act - 1]} · ${ex.cefr} · EXCHANGE ${globalNum}/${D.allExchanges.length}`;
        }
        if ($('phase-pill')) {
            $('phase-pill').textContent = 'Phase 1 of 2 · Read the Knife';
            $('phase-pill').classList.remove('phase-two-active');
        }
        if ($('exchange-title')) $('exchange-title').textContent = `${ex.title} (${actInfo.shortTitle})`;
        if ($('scene-context')) $('scene-context').textContent = ex.context;
        if ($('speaker-a-name')) $('speaker-a-name').textContent = `Speaker A · ${ex.speakerA.name}`;
        if ($('speaker-a-line')) $('speaker-a-line').textContent = `“${ex.speakerA.line}”`;
        if ($('speaker-b-name')) $('speaker-b-name').textContent = `Speaker B · ${ex.speakerB.name}`;
        if ($('phase1-rubric')) {
            $('phase1-rubric').textContent = `Click or press 1–${ex.speakerB.segments.length} to isolate the exact phrase carrying the subtext.`;
        }

        // Phase 1 segments
        const segWrap = $('speaker-b-segments');
        if (segWrap) {
            segWrap.textContent = '';
            ex.speakerB.segments.forEach((segText, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'phrase-seg';
                btn.dataset.segIdx = String(idx);
                const num = document.createElement('span');
                num.className = 'seg-num';
                num.textContent = String(idx + 1);
                const label = document.createElement('span');
                label.textContent = segText;
                btn.append(num, label);
                btn.addEventListener('click', () => handleSegmentClick(idx, btn));
                segWrap.appendChild(btn);
            });
        }

        if ($('scalpel-badge')) {
            $('scalpel-badge').classList.add('hidden');
            $('scalpel-badge').textContent = '';
        }
        setFeedback($('phase1-feedback'), '', '');

        // Meaning options
        const meaningStage = $('meaning-stage');
        const meaningOptsEl = $('meaning-options');
        if (meaningStage) meaningStage.classList.add('hidden');
        setFeedback($('meaning-feedback'), '', '');
        if (meaningOptsEl) {
            meaningOptsEl.textContent = '';
            const letters = ['A', 'B', 'C'];
            ex.meanings.forEach((m, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'meaning-btn';
                btn.dataset.meaningIdx = String(idx);
                btn.dataset.correct = m.correct ? 'true' : 'false';
                const keySpan = document.createElement('span');
                keySpan.className = 'meaning-key';
                keySpan.textContent = letters[idx];
                const textSpan = document.createElement('span');
                textSpan.textContent = m.text;
                btn.append(keySpan, textSpan);
                btn.addEventListener('click', () => handleMeaningClick(idx, btn));
                meaningOptsEl.appendChild(btn);
            });
        }

        // Phase 2 setup (hidden until Phase 1 complete)
        if ($('phase2-section')) $('phase2-section').classList.add('hidden');
        if ($('blunt-prompt')) $('blunt-prompt').textContent = `“${ex.bluntPrompt}”`;
        if ($('reply-before')) $('reply-before').textContent = ex.replyBefore || '';
        if ($('reply-after')) $('reply-after').textContent = ex.replyAfter || '';
        setFeedback($('phase2-status'), '', '');

        slotAssignments = new Array(ex.targetTokens.length).fill(null);
        const rawPool = ex.targetTokens
            .map((t, i) => ({ chipId: `t-${i}`, token: t }))
            .concat(ex.distractorTokens.map((t, i) => ({ chipId: `d-${i}`, token: t })));
        bankChips = shuffleArray(rawPool);
        // Prevent accidental exact pre-ordering at start of bank
        if (bankChips.slice(0, ex.targetTokens.length).every((c, idx) => c.token === ex.targetTokens[idx])) {
            bankChips.reverse();
        }
        renderPhase2Board();

        // Action buttons & blueprint
        if ($('btn-undo')) $('btn-undo').disabled = true;
        if ($('btn-next')) {
            $('btn-next').disabled = true;
            $('btn-next').textContent = getNextButtonLabel();
        }
        toggleBlueprint(false, false);
        refreshHud();

        if (duelActive) {
            resumeDuelTimer();
        }
    }

    function getNextButtonLabel() {
        if (duelActive && duelSpec) {
            return (duelStep >= duelSpec.steps.length - 1)
                ? 'Finish Duel ⚔️'
                : `Next Duel (${duelStep + 2}/${duelSpec.steps.length}) →`;
        }
        if (dailyActive && dailyData) {
            return (dailyStep >= dailyData.steps.length - 1)
                ? 'Finish Daily 5 ✔'
                : `Next Seed (${dailyStep + 2}/${dailyData.steps.length}) →`;
        }
        if (state.currentIdx >= D.allExchanges.length - 1) {
            return 'Finish All 24 🏆';
        }
        return 'Next Exchange →';
    }

    /* ---------------- PHASE 1 INTERACTIONS ---------------- */
    function handleSegmentClick(idx, btn) {
        if (scalpelFound) return;
        const ex = currentExchange;
        if (idx === ex.speakerB.scalpelIndex) {
            scalpelFound = true;
            btn.classList.remove('seg-wrong');
            btn.classList.add('seg-scalpel');
            btn.setAttribute('aria-pressed', 'true');
            document.querySelectorAll('#speaker-b-segments .phrase-seg').forEach((el) => {
                el.disabled = true;
            });
            const badge = $('scalpel-badge');
            if (badge) {
                badge.textContent = `✂️ ${ex.speakerB.scalpelDevice}`;
                badge.classList.remove('hidden');
            }
            setFeedback($('phase1-feedback'), 'Spot on — you isolated the surgical phrase.', 'success');
            if ($('meaning-stage')) $('meaning-stage').classList.remove('hidden');
            sfx('scalpel');
        } else {
            scalpelWrongClicks++;
            btn.classList.add('seg-wrong');
            setFeedback($('phase1-feedback'), ex.speakerB.wrongSpanHint, 'error');
            sfx('error');
        }
    }

    function handleMeaningClick(idx, btn) {
        if (!scalpelFound || meaningSolved) return;
        const ex = currentExchange;
        const option = ex.meanings[idx];
        if (!option) return;

        if (option.correct) {
            meaningSolved = true;
            btn.classList.add('is-correct');
            document.querySelectorAll('#meaning-options .meaning-btn').forEach((el) => {
                el.disabled = true;
            });
            setFeedback($('meaning-feedback'), option.explanation, 'success');
            if ($('phase-pill')) {
                $('phase-pill').textContent = 'Phase 2 of 2 · Return Serve';
                $('phase-pill').classList.add('phase-two-active');
            }
            if ($('phase2-section')) $('phase2-section').classList.remove('hidden');
            sfx('tap');
        } else {
            meaningWrongClicks++;
            btn.classList.add('is-wrong');
            btn.disabled = true;
            setFeedback($('meaning-feedback'), option.explanation, 'error');
            sfx('error');
        }
    }

    /* ---------------- PHASE 2 SURGICAL FORGE ---------------- */
    function renderPhase2Board() {
        const slotTrack = $('slot-track');
        const bankEl = $('chip-bank');
        const ex = currentExchange;
        if (!slotTrack || !bankEl || !ex) return;

        slotTrack.textContent = '';
        let anyFilled = false;

        slotAssignments.forEach((chipId, sIdx) => {
            const slotBtn = document.createElement('button');
            slotBtn.type = 'button';
            slotBtn.className = 'forge-slot';
            slotBtn.dataset.slotIdx = String(sIdx);
            if (phase2Solved) {
                slotBtn.classList.add('is-solved');
                slotBtn.disabled = true;
            } else if (targetedSlot === sIdx) {
                slotBtn.classList.add('is-targeted');
            }

            if (chipId) {
                anyFilled = true;
                const chip = bankChips.find((c) => c.chipId === chipId);
                slotBtn.textContent = chip ? chip.token : '';
                slotBtn.classList.add('is-filled');
                slotBtn.setAttribute('aria-label', `Slot ${sIdx + 1}: ${chip ? chip.token : ''}. Click to remove`);
            } else {
                slotBtn.textContent = `_${sIdx + 1}_`;
                slotBtn.setAttribute('aria-label', `Empty slot ${sIdx + 1}`);
            }

            slotBtn.addEventListener('click', () => handleSlotClick(sIdx));
            slotTrack.appendChild(slotBtn);
        });

        bankEl.textContent = '';
        const placedIds = new Set(slotAssignments.filter(Boolean));
        let visibleIdx = 0;
        bankChips.forEach((chip) => {
            if (placedIds.has(chip.chipId)) return;
            visibleIdx++;
            const chipBtn = document.createElement('button');
            chipBtn.type = 'button';
            chipBtn.className = 'word-chip';
            chipBtn.dataset.chipId = chip.chipId;
            chipBtn.dataset.token = chip.token;
            if (visibleIdx <= 9) {
                chipBtn.dataset.key = String(visibleIdx);
                const k = document.createElement('span');
                k.className = 'chip-key';
                k.textContent = String(visibleIdx);
                chipBtn.appendChild(k);
            }
            const t = document.createElement('span');
            t.textContent = chip.token;
            chipBtn.appendChild(t);
            if (phase2Solved) chipBtn.disabled = true;
            chipBtn.addEventListener('click', () => placeChip(chip.chipId));
            bankEl.appendChild(chipBtn);
        });

        if ($('btn-undo')) {
            $('btn-undo').disabled = phase2Solved || !anyFilled;
        }
    }

    function handleSlotClick(slotIdx) {
        if (!meaningSolved || phase2Solved) return;
        if (slotAssignments[slotIdx]) {
            slotAssignments[slotIdx] = null;
            targetedSlot = slotIdx;
            setFeedback($('phase2-status'), '', '');
            sfx('tap');
            renderPhase2Board();
        } else {
            targetedSlot = targetedSlot === slotIdx ? null : slotIdx;
            renderPhase2Board();
        }
    }

    function placeChip(chipId) {
        if (!meaningSolved || phase2Solved) return;
        let dest = (targetedSlot !== null && !slotAssignments[targetedSlot])
            ? targetedSlot
            : slotAssignments.findIndex((x) => x === null);
        if (dest < 0) return;

        slotAssignments[dest] = chipId;
        targetedSlot = null;
        setFeedback($('phase2-status'), '', '');
        sfx('tap');
        renderPhase2Board();

        if (slotAssignments.every((x) => x !== null)) {
            validatePhase2();
        }
    }

    function undoLastChip() {
        if (!meaningSolved || phase2Solved) return false;
        for (let i = slotAssignments.length - 1; i >= 0; i--) {
            if (slotAssignments[i]) {
                slotAssignments[i] = null;
                targetedSlot = null;
                setFeedback($('phase2-status'), '', '');
                sfx('tap');
                renderPhase2Board();
                return true;
            }
        }
        return false;
    }

    function resetCurrentBoard() {
        if (phase2Solved) return;
        if (!meaningSolved) {
            if (!scalpelFound) {
                scalpelWrongClicks = 0;
                document.querySelectorAll('#speaker-b-segments .phrase-seg').forEach((el) => el.classList.remove('seg-wrong'));
                setFeedback($('phase1-feedback'), '', '');
            } else {
                meaningWrongClicks = 0;
                document.querySelectorAll('#meaning-options .meaning-btn').forEach((el) => {
                    el.classList.remove('is-wrong');
                    el.disabled = false;
                });
                setFeedback($('meaning-feedback'), '', '');
            }
            return;
        }
        slotAssignments = new Array(currentExchange.targetTokens.length).fill(null);
        targetedSlot = null;
        setFeedback($('phase2-status'), '', '');
        renderPhase2Board();
    }

    function useHint() {
        if (phase2Solved) return;
        const ex = currentExchange;
        hintsUsed++;
        if (!scalpelFound) {
            setFeedback($('phase1-feedback'), ex.speakerB.wrongSpanHint, 'hint');
            sfx('tap');
            return;
        }
        if (!meaningSolved) {
            setFeedback($('meaning-feedback'), 'Look past surface politeness — pick the interpretation matching the scalpel phrase.', 'hint');
            sfx('tap');
            return;
        }

        const currentTokens = slotAssignments.map((cid) => {
            const c = bankChips.find((item) => item.chipId === cid);
            return c ? c.token : null;
        });
        let firstDiff = ex.targetTokens.findIndex((tok, i) => currentTokens[i] !== tok);
        if (firstDiff < 0) firstDiff = 0;
        const neededToken = ex.targetTokens[firstDiff];

        const chipBtn = Array.from(document.querySelectorAll('#chip-bank .word-chip')).find((b) => b.dataset.token === neededToken);
        if (chipBtn) {
            chipBtn.classList.add('is-hint');
            if (!inSelfTest) {
                setTimeout(() => chipBtn.classList.remove('is-hint'), 2200);
            }
        }
        setFeedback($('phase2-status'), `Hint for slot ${firstDiff + 1}: follow "${ex.formula}"`, 'hint');
        sfx('tap');
    }

    function validatePhase2() {
        const ex = currentExchange;
        const placed = slotAssignments.map((cid) => {
            const c = bankChips.find((item) => item.chipId === cid);
            return c ? c.token : '';
        });

        const isMatch = placed.length === ex.targetTokens.length &&
            placed.every((tok, idx) => tok === ex.targetTokens[idx]);

        const fullModel = D.formatReply(ex.replyBefore, ex.targetTokens, ex.replyAfter);

        if (isMatch) {
            solvePhase2(placed, fullModel);
            return;
        }

        phase2Mistakes++;
        state.streak = 0;
        saveState();
        refreshHud();

        const slotBtns = Array.from(document.querySelectorAll('#slot-track .forge-slot'));
        let firstWrong = -1;
        let trapWord = '';
        placed.forEach((tok, idx) => {
            if (tok !== ex.targetTokens[idx]) {
                if (firstWrong < 0) firstWrong = idx;
                if (slotBtns[idx]) slotBtns[idx].classList.add('is-wrong');
                if (!trapWord && ex.distractorTokens.includes(tok)) trapWord = tok;
            }
        });

        const frame = document.querySelector('.forge-sentence-box');
        if (frame) {
            frame.classList.remove('shake');
            void frame.offsetWidth;
            frame.classList.add('shake');
        }

        const msg = trapWord
            ? `Watch out: "${trapWord}" is a distractor trap. Tap the highlighted slot or press ↩ Undo.`
            : `Slot ${firstWrong + 1} does not quite fit the structure yet. Tap a slot or press ↩ Undo.`;
        setFeedback($('phase2-status'), msg, 'error');
        sfx('error');

        if (!inSelfTest) {
            window.CandidateDossier?.recordAttempt({
                category: ex.dossierCategory,
                correct: false,
                game: 'Between the Lines',
                prompt: ex.bluntPrompt,
                keyword: ex.speakerB.scalpelDevice,
                targetAnswer: fullModel,
                userAttempt: D.formatReply(ex.replyBefore, placed, ex.replyAfter),
                explanation: `${ex.formula} — ${ex.modelNote}`
            });
        }
    }

    function solvePhase2(placed, fullModel) {
        // Pause active duel timer immediately so reading blueprint/model never penalises the clock
        if (duelActive) {
            pauseDuelTimer();
        }

        phase2Solved = true;
        const ex = currentExchange;
        if (!state.solvedIds.includes(ex.id)) {
            state.solvedIds.push(ex.id);
        }
        state.streak++;
        saveState();

        renderPhase2Board();
        setFeedback($('phase2-status'), `Surgical reply complete: "${fullModel}"`, 'success');

        const isClean = scalpelWrongClicks === 0 &&
            meaningWrongClicks === 0 &&
            phase2Mistakes === 0 &&
            hintsUsed === 0 &&
            !modelRevealedBeforeSolve;
        const totalErrors = scalpelWrongClicks + meaningWrongClicks + phase2Mistakes + hintsUsed + (modelRevealedBeforeSolve ? 1 : 0);
        const stepEmoji = isClean ? '🟩' : (totalErrors <= 1 ? '🟨' : '🟥');

        if (dailyActive && dailyData) {
            dailyResults[dailyStep] = {
                step: dailyStep + 1,
                id: ex.id,
                cefr: ex.cefr,
                title: ex.title,
                sentence: fullModel,
                note: ex.modelNote,
                emoji: stepEmoji
            };
        }
        if (duelActive && duelSpec) {
            duelResults[duelStep] = {
                step: duelStep + 1,
                id: ex.id,
                cefr: ex.cefr,
                title: ex.title,
                sentence: fullModel,
                note: ex.modelNote,
                emoji: stepEmoji
            };
        }

        if (!inSelfTest) {
            window.CandidateDossier?.recordAttempt({
                category: ex.dossierCategory,
                correct: phase2Mistakes === 0 && meaningWrongClicks === 0,
                game: 'Between the Lines',
                prompt: ex.bluntPrompt,
                keyword: ex.speakerB.scalpelDevice,
                targetAnswer: fullModel,
                userAttempt: D.formatReply(ex.replyBefore, placed, ex.replyAfter),
                explanation: `${ex.formula} — ${ex.modelNote}`
            });
        }

        trackSubtextEvent('subtext_exchange_solved', {
            act: ex.act,
            id: ex.id,
            cefr: ex.cefr,
            clean: isClean
        });

        toggleBlueprint(true, true);

        if ($('btn-next')) {
            $('btn-next').disabled = false;
            $('btn-next').textContent = getNextButtonLabel();
        }
        refreshHud();
        sfx('solve');
    }

    /* ---------------- NAVIGATION & MODES ---------------- */
    function exitSpecialModes() {
        dailyActive = false;
        dailyData = null;
        dailyStep = 0;
        dailyResults = [];

        duelActive = false;
        duelSpec = null;
        duelStep = 0;
        duelResults = [];
        duelElapsedMs = 0;
        stopDuelTimer();
        updateModeBadge();
    }

    function jumpToAct(actNum) {
        exitSpecialModes();
        const idx = D.allExchanges.findIndex((e) => e.act === actNum);
        if (idx >= 0) {
            state.currentIdx = idx;
            currentExchange = D.allExchanges[idx];
            saveState();
            renderExchange();
            trackSubtextEvent('subtext_act_jump', { act: actNum });
        }
    }

    function startDailyMode() {
        exitSpecialModes();
        dailyData = D.dailyGauntlet();
        dailyActive = true;
        dailyStep = 0;
        dailyResults = [];
        currentExchange = dailyData.steps[0].exchange;
        toggleDuelDrawer(false);
        renderExchange();
        trackSubtextEvent('subtext_mode_started', { mode: 'daily', seed: dailyData.seed });
    }

    function startDuelMode(spec) {
        if (!spec || !Array.isArray(spec.steps) || spec.steps.length < 3) return false;
        exitSpecialModes();
        duelSpec = spec;
        duelActive = true;
        duelStep = 0;
        duelResults = [];
        duelElapsedMs = 0;
        duelTurnStartedAt = null;
        currentExchange = duelSpec.steps[0].exchange;
        toggleDuelDrawer(false);
        renderExchange();
        trackSubtextEvent('subtext_mode_started', { mode: 'duel', count: duelSpec.steps.length });
        return true;
    }

    function nextExchange() {
        if (!phase2Solved) return;

        if (duelActive && duelSpec) {
            if (duelStep < duelSpec.steps.length - 1) {
                duelStep++;
                currentExchange = duelSpec.steps[duelStep].exchange;
                renderExchange();
                return;
            }
            openRecapModal('duel');
            return;
        }

        if (dailyActive && dailyData) {
            if (dailyStep < dailyData.steps.length - 1) {
                dailyStep++;
                currentExchange = dailyData.steps[dailyStep].exchange;
                renderExchange();
                return;
            }
            openRecapModal('daily');
            return;
        }

        if (state.currentIdx < D.allExchanges.length - 1) {
            state.currentIdx++;
            currentExchange = D.allExchanges[state.currentIdx];
            saveState();
            renderExchange();
        } else {
            openRecapModal('campaign');
        }
    }

    /* ---------------- RECAP MODAL & DIAGNOSTIC GATE ---------------- */
    function computeDuelVerdict(cleanCount, totalSec, spec) {
        if (!spec || spec.sec <= 0) return { kind: '', text: '' };
        const opp = spec.by || 'Challenger';
        if (cleanCount > spec.clean) {
            return { kind: 'win', text: `🏆 Victory over ${opp}: ${cleanCount}/${spec.steps.length} Clean beats ${spec.clean}/${spec.steps.length} Clean!` };
        }
        if (cleanCount < spec.clean) {
            return { kind: 'loss', text: `⚔️ Narrow Defeat to ${opp}: ${cleanCount}/${spec.steps.length} Clean vs ${spec.clean}/${spec.steps.length} Clean.` };
        }
        if (totalSec < spec.sec) {
            return { kind: 'win', text: `🏆 Victory on time over ${opp}: both ${cleanCount}/${spec.steps.length} Clean (${formatClock(totalSec)} vs ${formatClock(spec.sec)}).` };
        }
        if (totalSec > spec.sec) {
            return { kind: 'loss', text: `⚔️ Narrow Defeat on time to ${opp}: both ${cleanCount}/${spec.steps.length} Clean (${formatClock(totalSec)} vs ${formatClock(spec.sec)}).` };
        }
        return { kind: '', text: `🤝 Dead Heat with ${opp}: ${cleanCount}/${spec.steps.length} Clean in ${formatClock(totalSec)}.` };
    }

    function getRecapStats(mode) {
        if (mode === 'daily' && dailyData) {
            const steps = dailyResults.filter(Boolean);
            const clean = steps.filter((s) => s.emoji === '🟩').length;
            return {
                score: clean,
                maxScore: dailyData.steps.length,
                grid: steps.map((s) => s.emoji).join(''),
                seed: dailyData.seed,
                ids: dailyData.steps.map((s) => s.id),
                steps
            };
        }
        if (mode === 'duel' && duelSpec) {
            const steps = duelResults.filter(Boolean);
            const clean = steps.filter((s) => s.emoji === '🟩').length;
            const sec = currentDuelSeconds();
            return {
                score: clean,
                maxScore: duelSpec.steps.length,
                grid: steps.map((s) => s.emoji).join(''),
                sec,
                ids: duelSpec.ids,
                verdict: computeDuelVerdict(clean, sec, duelSpec),
                steps
            };
        }
        const solvedCount = state.solvedIds.length;
        return {
            score: solvedCount,
            maxScore: D.allExchanges.length,
            grid: '',
            steps: []
        };
    }

    function openRecapModal(mode) {
        const modal = $('recap-modal');
        if (!modal) return;
        activeRecapMode = mode;
        recapReturnFocus = document.activeElement;

        const heading = $('recap-heading');
        const summary = $('recap-summary');
        const verdictEl = $('recap-verdict');
        const listEl = $('recap-step-list');
        const copyDailyBtn = $('btn-copy-daily');
        const copyDuelBtn = $('btn-copy-duel');

        const stats = getRecapStats(mode);
        if (listEl) listEl.textContent = '';
        if (verdictEl) {
            verdictEl.className = 'recap-verdict hidden';
            verdictEl.textContent = '';
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
            if (heading) heading.textContent = `🎲 Daily Subtext Seed (${stats.seed})`;
            if (summary) summary.textContent = `${stats.score}/${stats.maxScore} Clean · ${stats.grid} · Daily Streak: 🔥 ${state.dailyStreak || 1}`;
            if (copyDailyBtn) {
                copyDailyBtn.classList.remove('hidden');
                copyDailyBtn.textContent = '📋 Copy Daily Result';
            }
            if (copyDuelBtn) {
                copyDuelBtn.classList.remove('hidden');
                copyDuelBtn.textContent = '⚔️ Challenge a Friend on These 5 Exchanges';
            }
        } else if (mode === 'duel') {
            if (heading) heading.textContent = '⚔️ Subtext Duel Complete';
            if (summary) summary.textContent = `${stats.score}/${stats.maxScore} Clean in ${formatClock(stats.sec)} · ${stats.grid}`;
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
        } else {
            if (heading) heading.textContent = '🏆 All 24 Exchanges Complete!';
            if (summary) summary.textContent = `${stats.score}/${stats.maxScore} Exchanges Mastered across 4 Acts · Clean Streak: 🔥 ${state.streak}`;
            if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
            if (copyDuelBtn) copyDuelBtn.classList.add('hidden');
        }

        if (listEl) {
            stats.steps.forEach((st) => {
                const row = document.createElement('div');
                row.className = 'recap-step-row';
                const badge = document.createElement('span');
                badge.className = 'recap-step-badge';
                badge.textContent = `${st.emoji} ${st.cefr}`;
                const body = document.createElement('div');
                body.className = 'recap-step-body';
                const sent = document.createElement('span');
                sent.className = 'recap-step-sentence';
                sent.textContent = st.sentence;
                const note = document.createElement('span');
                note.className = 'recap-step-note';
                note.textContent = st.note;
                body.append(sent, note);
                row.append(badge, body);
                listEl.appendChild(row);
            });
        }

        trackSubtextEvent('subtext_mode_completed', {
            mode,
            score: stats.score,
            maxScore: stats.maxScore
        });

        modal.classList.add('open');
        const firstFocus = (copyDuelBtn && !copyDuelBtn.classList.contains('hidden'))
            ? copyDuelBtn
            : ($('btn-open-diagnostic') || $('btn-close-recap'));
        if (firstFocus && !inSelfTest) firstFocus.focus();
    }

    function closeRecapModal(restoreCampaign) {
        const modal = $('recap-modal');
        if (!modal) return;
        const closedMode = activeRecapMode;
        modal.classList.remove('open');
        activeRecapMode = null;

        if (restoreCampaign && (closedMode === 'daily' || closedMode === 'duel')) {
            exitSpecialModes();
            currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
            renderExchange();
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
        const shareText = `Between the Lines · ${stats.seed} · ${stats.score}/${stats.maxScore} Clean\n${stats.grid} 🔥 Streak: ${state.dailyStreak || 1}\n${SHARE_BASE_URL}?mode=daily`;
        const btn = $('btn-copy-daily');
        copyTextWithFallback(shareText, () => {
            if (btn) {
                btn.textContent = '✓ Copied! Paste in chat';
                setTimeout(() => { if (btn) btn.textContent = '📋 Copy Daily Result'; }, 2200);
            }
            trackSubtextEvent('subtext_share_copied', { kind: 'daily', seed: stats.seed });
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
            clean: stats.score,
            sec: stats.sec || 0,
            by: state.playerName
        });
        if (!token) return;
        const url = buildDuelUrl(token);
        const shareText = mode === 'duel'
            ? `Between the Lines Duel · ${stats.score}/${stats.maxScore} Clean in ${formatClock(stats.sec)}\nCan you beat my score?\n${url}`
            : `Between the Lines 5-Exchange Challenge · ${stats.score}/${stats.maxScore} Clean\n${url}`;
        const btn = $('btn-copy-duel');
        copyTextWithFallback(shareText, () => {
            if (btn) {
                btn.textContent = '✓ Duel Link Copied!';
                setTimeout(() => { if (btn) btn.textContent = mode === 'duel' ? '⚔️ Copy Counter-Duel Link' : '⚔️ Challenge a Friend on These 5 Exchanges'; }, 2200);
            }
            trackSubtextEvent('subtext_share_copied', { kind: 'duel' });
        });
    }

    function openDiagnosticFromRecap() {
        const mode = activeRecapMode || 'campaign';
        const stats = getRecapStats(mode);
        closeRecapModal(false);
        if (mode === 'daily' || mode === 'duel') {
            exitSpecialModes();
            currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
            renderExchange();
        }

        if (location.protocol.startsWith('http') && typeof window.showDiagnosticGate === 'function') {
            window.showDiagnosticGate({
                gameName: mode === 'daily'
                    ? 'Between the Lines (Daily 5)'
                    : (mode === 'duel' ? 'Between the Lines (Duel)' : 'Between the Lines (4 Acts)'),
                score: stats.score,
                maxScore: stats.maxScore,
                category: 'register_shift',
                weakArea: 'C1/C2 Subtext, Hedging & Polite Inversion',
                examImpact: 'In Cambridge C1/C2 Speaking and IELTS Writing, blunt or literal phrasing costs marks in Lexical Resource and Grammatical Range.',
                onReplay: () => {
                    if (mode === 'daily') startDailyMode();
                    else jumpToAct(1);
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

        const initial = D.duelPreset('c1_random').ids;
        for (let slot = 0; slot < 5; slot++) {
            const field = document.createElement('div');
            field.className = 'duel-slot-field';
            const lbl = document.createElement('label');
            lbl.setAttribute('for', `duel-slot-${slot}`);
            lbl.textContent = `Exchange ${slot + 1}`;
            const sel = document.createElement('select');
            sel.id = `duel-slot-${slot}`;
            sel.className = 'duel-slot-select';

            D.acts.forEach((actMeta) => {
                const grp = document.createElement('optgroup');
                grp.label = actMeta.title;
                D.allExchanges.filter((e) => e.act === actMeta.act).forEach((ex) => {
                    const opt = document.createElement('option');
                    opt.value = ex.id;
                    opt.textContent = `${ex.id.toUpperCase()} · ${ex.title} (${ex.cefr})`;
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
            const ex = D.findById(id);
            if (!ex) return;
            const line = document.createElement('div');
            line.textContent = `${idx + 1}. [${ex.cefr}] ${ex.title} → "${D.formatReply(ex.replyBefore, ex.targetTokens, ex.replyAfter)}"`;
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
                trackSubtextEvent('subtext_entry', { entry: 'duel', tier: 'c1' });
                return true;
            }
            currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
            renderExchange();
            setFeedback($('phase1-feedback'), 'That duel link could not be read — loaded Act I instead.', 'error');
            trackSubtextEvent('subtext_entry', { entry: 'duel_invalid', tier: 'c1' });
            return true;
        }

        const mode = (params.get('mode') || '').toLowerCase();
        if (mode === 'daily') {
            startDailyMode();
            trackSubtextEvent('subtext_entry', { entry: 'daily', tier: 'c1' });
            return true;
        }

        if (params.has('act')) {
            const actNum = parseInt(params.get('act'), 10);
            if (actNum >= 1 && actNum <= 4) {
                jumpToAct(actNum);
                trackSubtextEvent('subtext_entry', { entry: `act_${actNum}`, tier: actNum === 1 ? 'b2' : 'c1' });
                return true;
            }
        }

        return false;
    }

    /* ---------------- ?selftest=1 ---------------- */
    function runSelfTest() {
        const out = document.createElement('pre');
        out.id = 'selftest';
        const dataRes = D.dataTests();
        let pass = dataRes.pass;
        const lines = ['BETWEEN THE LINES SELFTEST'].concat(dataRes.lines);

        let savedRawStorage = null;
        try { savedRawStorage = localStorage.getItem(STORAGE_KEY); } catch (_) {}
        const savedStateJson = JSON.stringify(state);

        inSelfTest = true;
        exitSpecialModes();

        try {
            let solvedAll = 0;
            for (let idx = 0; idx < D.allExchanges.length; idx++) {
                const ex = D.allExchanges[idx];
                state.currentIdx = idx;
                currentExchange = ex;
                renderExchange();

                const segBtns = Array.from(document.querySelectorAll('#speaker-b-segments .phrase-seg'));
                if (segBtns.length !== ex.speakerB.segments.length) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: expected ${ex.speakerB.segments.length} segments, got ${segBtns.length}`);
                }

                // Test wrong segment first, then exact scalpel
                const wrongSegIdx = ex.speakerB.scalpelIndex === 0 ? 1 : 0;
                segBtns[wrongSegIdx].click();
                if (scalpelFound) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: wrong segment unlocked scalpel`);
                }
                segBtns[ex.speakerB.scalpelIndex].click();
                if (!scalpelFound || $('meaning-stage').classList.contains('hidden')) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: scalpel click did not reveal meanings`);
                }

                // Click correct meaning
                const correctMeaningBtn = document.querySelector('#meaning-options .meaning-btn[data-correct="true"]');
                if (!correctMeaningBtn) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: missing correct meaning button`);
                } else {
                    correctMeaningBtn.click();
                }
                if (!meaningSolved || $('phase2-section').classList.contains('hidden')) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: meaning click did not reveal Phase 2`);
                }

                // Assemble targetTokens in Phase 2
                ex.targetTokens.forEach((tok) => {
                    const chipBtn = Array.from(document.querySelectorAll('#chip-bank .word-chip'))
                        .find((b) => b.dataset.token === tok);
                    if (chipBtn) chipBtn.click();
                });

                if (!phase2Solved || $('btn-next').disabled || $('blueprint-panel').classList.contains('hidden')) {
                    pass = false;
                    lines.push(`FAIL ${ex.id}: Phase 2 did not solve cleanly`);
                } else {
                    solvedAll++;
                }
            }

            // Test Undo + Hint on Exchange 0
            state.currentIdx = 0;
            currentExchange = D.allExchanges[0];
            renderExchange();
            document.querySelectorAll('#speaker-b-segments .phrase-seg')[currentExchange.speakerB.scalpelIndex].click();
            document.querySelector('#meaning-options .meaning-btn[data-correct="true"]').click();
            const firstChip = document.querySelector('#chip-bank .word-chip');
            if (firstChip) firstChip.click();
            if (!undoLastChip()) {
                pass = false;
                lines.push('FAIL undoLastChip() did not restore chip');
            }
            useHint();
            if ($('phase2-status').textContent.length === 0) {
                pass = false;
                lines.push('FAIL useHint() produced empty hint');
            }

            // Test Daily 5 mode
            startDailyMode();
            if (!dailyActive || !dailyData || dailyData.steps.length !== 5) {
                pass = false;
                lines.push('FAIL startDailyMode() did not load 5 C1/C2 steps');
            }

            // Test Duel mode + timer pause on solve + verdict
            const tok = D.encodeDuel({ ids: ['s1c', 's2b', 's3b', 's4a', 's4f'], clean: 4, sec: 45, by: 'Igor' });
            const parsedDuel = D.decodeDuel(tok);
            startDuelMode(parsedDuel);
            if (!duelActive || $('duel-target-banner').classList.contains('hidden') || !$('duel-target-banner').textContent.includes('Igor')) {
                pass = false;
                lines.push('FAIL startDuelMode() target banner check failed');
            }
            const duelEx = currentExchange;
            document.querySelectorAll('#speaker-b-segments .phrase-seg')[duelEx.speakerB.scalpelIndex].click();
            document.querySelector('#meaning-options .meaning-btn[data-correct="true"]').click();
            duelEx.targetTokens.forEach((tokWord) => {
                const chipBtn = Array.from(document.querySelectorAll('#chip-bank .word-chip'))
                    .find((b) => b.dataset.token === tokWord);
                if (chipBtn) chipBtn.click();
            });
            if (!phase2Solved || duelTurnStartedAt !== null) {
                pass = false;
                lines.push('FAIL duel timer did not pause immediately on solve');
            }
            openRecapModal('duel');
            if (!$('recap-modal').classList.contains('open') || $('btn-copy-duel').classList.contains('hidden')) {
                pass = false;
                lines.push('FAIL duel recap modal check failed');
            }
            closeRecapModal(false);

            // Test clean screenshare guard helper
            syncCleanModeUI(true);
            if (!$('belfast-desk-strip').classList.contains('hidden')) {
                pass = false;
                lines.push('FAIL clean screenshare guard did not hide #belfast-desk-strip');
            }
            syncCleanModeUI(false);

            lines.push(`(e2e) solved ${solvedAll}/24 exchanges across Phase 1 & Phase 2 + Undo/Hint + Daily 5 + Duel timer pause + WL guard`);
        } catch (err) {
            pass = false;
            lines.push('FAIL runtime error: ' + err.message);
        }

        // Restore clean state without touching real localStorage
        exitSpecialModes();
        inSelfTest = false;
        state = ensureState(JSON.parse(savedStateJson));
        try {
            if (savedRawStorage === null) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, savedRawStorage);
        } catch (_) {}
        syncCleanModeUI();
        currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
        renderExchange();

        lines.push(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
        out.textContent = lines.join('\n');
        out.dataset.pass = pass ? 'true' : 'false';
        out.style.cssText = 'white-space:pre-wrap;background:#0f172a;color:#34d399;padding:14px;border-radius:10px;font-family:monospace;font-size:12px;margin:16px auto;max-width:920px;';
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
                if (soundEnabled) sfx('tap');
            });
        }

        if ($('daily-seed-btn')) $('daily-seed-btn').addEventListener('click', startDailyMode);
        if ($('duel-forge-btn')) $('duel-forge-btn').addEventListener('click', () => toggleDuelDrawer());
        if ($('duel-forge-close')) $('duel-forge-close').addEventListener('click', () => toggleDuelDrawer(false));

        if ($('exit-mode-btn')) {
            $('exit-mode-btn').addEventListener('click', () => {
                exitSpecialModes();
                currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
                renderExchange();
            });
        }

        document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
            btn.addEventListener('click', () => {
                const actNum = parseInt(btn.dataset.act || '', 10);
                if (!Number.isNaN(actNum)) {
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
                $('duel-preview-toggle').textContent = willShow ? '🙈 Hide replies' : '👁️ Show replies';
                updateDuelPreview();
            });
        }

        if ($('btn-copy-instant-duel')) {
            $('btn-copy-instant-duel').addEventListener('click', () => {
                const ids = getSelectedDuelIds();
                if (new Set(ids).size < 3) {
                    setFeedback($('duel-forge-status'), 'Choose at least 3 distinct exchanges for a duel.', 'error');
                    return;
                }
                const uniqueIds = [...new Set(ids)];
                const tok = D.encodeDuel({ ids: uniqueIds, clean: 0, sec: 0, by: state.playerName });
                if (!tok) {
                    setFeedback($('duel-forge-status'), 'Select 3–5 distinct exchanges.', 'error');
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
                const ids = [...new Set(getSelectedDuelIds())];
                if (ids.length < 3) {
                    setFeedback($('duel-forge-status'), 'Choose at least 3 distinct exchanges to start.', 'error');
                    return;
                }
                const tok = D.encodeDuel({ ids, clean: 0, sec: 0, by: state.playerName });
                const spec = D.decodeDuel(tok);
                if (spec) startDuelMode(spec);
            });
        }

        if ($('btn-undo')) $('btn-undo').addEventListener('click', undoLastChip);
        if ($('btn-reset')) $('btn-reset').addEventListener('click', resetCurrentBoard);
        if ($('btn-hint')) $('btn-hint').addEventListener('click', useHint);
        if ($('btn-next')) $('btn-next').addEventListener('click', nextExchange);
        if ($('btn-blueprint')) $('btn-blueprint').addEventListener('click', () => toggleBlueprint());
        if ($('btn-reveal-model')) {
            $('btn-reveal-model').addEventListener('click', () => {
                if (!phase2Solved) modelRevealedBeforeSolve = true;
                updateBlueprintCard(true);
                sfx('tap');
            });
        }

        if ($('btn-copy-daily')) $('btn-copy-daily').addEventListener('click', copyDailyResult);
        if ($('btn-copy-duel')) $('btn-copy-duel').addEventListener('click', copyCounterDuelLink);
        if ($('btn-open-diagnostic')) $('btn-open-diagnostic').addEventListener('click', openDiagnosticFromRecap);
        if ($('btn-close-recap')) $('btn-close-recap').addEventListener('click', () => closeRecapModal(true));

        /* ---------------- BELFAST DESK INLINE DRAWER ---------------- */
        function syncSubtextDeskContext() {
            const summaryEl = $('subtext-desk-active-summary');
            const ctxHidden = $('subtext-desk-context-hidden');
            const dossierEl = $('subtext-desk-dossier');
            const ex = currentExchange;
            const actLabel = ex ? `Act ${ex.act} (${ex.cefr}) · ${ex.title}` : 'Between the Lines';
            const scoreLabel = `Solved ${state.solvedIds.length}/${D.allExchanges.length} · Streak ${state.streak}`;
            if (summaryEl) summaryEl.textContent = `${actLabel} · ${scoreLabel}`;
            if (ctxHidden) ctxHidden.value = `${actLabel} | ${scoreLabel}`;
            if (dossierEl) {
                try { dossierEl.value = localStorage.getItem('gm_active_dossier_summary') || ''; } catch (_) {}
            }
        }

        const toggleDeskBtn = $('btn-toggle-subtext-desk');
        const deskDrawer = $('subtext-desk-drawer');
        if (toggleDeskBtn && deskDrawer) {
            toggleDeskBtn.addEventListener('click', () => {
                const willOpen = deskDrawer.classList.contains('hidden');
                deskDrawer.classList.toggle('hidden', !willOpen);
                toggleDeskBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                if (willOpen) {
                    syncSubtextDeskContext();
                    const msgEl = $('subtext-desk-message');
                    if (msgEl) msgEl.focus();
                }
            });
        }

        const subtextDeskForm = $('subtext-desk-form');
        if (subtextDeskForm) {
            subtextDeskForm.addEventListener('submit', async (e) => {
                if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;
                e.preventDefault();
                if (subtextDeskForm.dataset.submitting === 'true') return;

                const gotcha = subtextDeskForm.querySelector('input[name="_gotcha"]');
                const statusEl = $('subtext-desk-status');
                const submitBtn = $('subtext-desk-submit');
                const origText = submitBtn ? submitBtn.textContent : 'Send to My Desk →';

                if (gotcha && gotcha.value.trim()) {
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-success';
                        statusEl.textContent = 'Sent to my desk — thank you.';
                    }
                    return;
                }

                syncSubtextDeskContext();
                subtextDeskForm.dataset.submitting = 'true';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
                if (statusEl) {
                    statusEl.className = 'desk-form-status';
                    statusEl.textContent = '';
                }

                try {
                    const res = await fetch(subtextDeskForm.action || 'https://formspree.io/f/mvkgrwvj', {
                        method: 'POST',
                        body: new FormData(subtextDeskForm),
                        headers: { 'Accept': 'application/json' }
                    });
                    if (!res.ok) throw new Error('Request failed');
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-success';
                        statusEl.textContent = 'Received at my desk in Northern Ireland. I will reply with 2 natural C1/C2 ways to phrase this within 24 hours.';
                    }
                    if (submitBtn) submitBtn.textContent = 'Sent to My Desk ✓';
                    trackSubtextEvent('desk_dropbox_submitted', { tool: 'between_the_lines' });
                } catch (_) {
                    if (statusEl) {
                        statusEl.className = 'desk-form-status is-error';
                        statusEl.innerHTML = 'Something stopped the form from sending. Please email me directly at <a href="mailto:gareth@garethenglish.com?subject=Between%20the%20Lines%20Subtext%20Check" style="color:inherit;text-decoration:underline;font-weight:700;">gareth@garethenglish.com</a>.';
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = origText;
                    }
                } finally {
                    subtextDeskForm.dataset.submitting = 'false';
                }
            });
        }

        // Keyboard shortcuts
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

            if (!scalpelFound && /^[1-6]$/.test(e.key)) {
                const segBtn = document.querySelector(`#speaker-b-segments .phrase-seg[data-seg-idx="${Number(e.key) - 1}"]`);
                if (segBtn) {
                    e.preventDefault();
                    segBtn.click();
                }
                return;
            }
            if (scalpelFound && !meaningSolved && /^[abcABC123]$/.test(e.key)) {
                const map = { a: 0, b: 1, c: 2, '1': 0, '2': 1, '3': 2 };
                const idx = map[e.key.toLowerCase()];
                const mBtn = document.querySelector(`#meaning-options .meaning-btn[data-meaning-idx="${idx}"]`);
                if (mBtn && !mBtn.disabled) {
                    e.preventDefault();
                    mBtn.click();
                }
                return;
            }
            if (meaningSolved && !phase2Solved && /^[1-9]$/.test(e.key)) {
                const cBtn = document.querySelector(`#chip-bank .word-chip[data-key="${e.key}"]`);
                if (cBtn) {
                    e.preventDefault();
                    cBtn.click();
                }
                return;
            }
            if (meaningSolved && !phase2Solved && e.key === 'Backspace') {
                if (undoLastChip()) e.preventDefault();
                return;
            }
            if ((e.key === 'h' || e.key === 'H') && !phase2Solved) {
                e.preventDefault();
                useHint();
                return;
            }
            if (e.key === 'Enter' && phase2Solved && $('btn-next') && !$('btn-next').disabled) {
                if (e.target !== $('btn-next')) {
                    e.preventDefault();
                    nextExchange();
                }
            }
        });

        const routed = applyUrlRoute();
        if (!routed) {
            currentExchange = D.allExchanges[state.currentIdx] || D.allExchanges[0];
            renderExchange();
            trackSubtextEvent('subtext_entry', { entry: 'direct', tier: currentExchange.act === 1 ? 'b2' : 'c1' });
        }

        if (/[?&]selftest=1\b/.test(location.search)) {
            runSelfTest();
        }
    });
})();
