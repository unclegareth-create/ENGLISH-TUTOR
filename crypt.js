/* ==========================================================
   Grammar Crypt – 2D game logic, URL router, Daily Seed & Autopsy
   ========================================================== */
(() => {
    'use strict';

    const L = window.CRYPT_LEVELS;
    if (!L) { console.error('crypt-levels.js must be loaded before crypt.js'); return; }

    const lootTable = L.loot;
    const milestonePrizes = L.milestones;   // keys are zero-based floor indexes (4 = Floor 5)
    const bosses = L.bosses;
    const levels = L.floors;

    const XP_PER_RANK = 100;
    const lastLevel = levels.length - 1;
    const BOSS_FLOORS = [4, 9, 14, 19, 24];
    const ACT_START_FLOORS = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 20 };
    const TIER_START_FLOORS = { b1: 0, b2: 5, c1: 10, c2: 20 };
    const DAILY_SHARE_URL = 'https://garethenglish.com/grammar-crypt.html?mode=daily';
    const DUEL_SHARE_BASE_URL = 'https://garethenglish.com/grammar-crypt.html';
    const TIER_BAR_DISMISS_KEY = 'gc_tier_bar_dismissed';

    const vibrate = (pattern) => {
        try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
    };

    const isSoundEnabled = () => {
        if (window.GCAudio && typeof window.GCAudio.isSfxEnabled === 'function') {
            return window.GCAudio.isSfxEnabled();
        }
        const audioBtn = document.getElementById('audio-toggle');
        return audioBtn ? audioBtn.getAttribute('aria-pressed') === 'true' : true;
    };

    const sfx = (name, arg) => {
        if (!isSoundEnabled()) return;
        try { if (window.GCAudio && typeof window.GCAudio.play === 'function') window.GCAudio.play(name, arg); } catch (_) {}
        if (name === 'grab' || name === 'drop') vibrate(15);
        else if (name === 'success') vibrate([30, 40, 60]);
        else if (name === 'error') vibrate([50, 50, 50]);
        else if (name === 'loot' || name === 'milestone') vibrate([40, 50, 40, 50, 80]);
        else if (name === 'boss') vibrate([60, 50, 60, 50, 100]);
    };

    function trackCryptEvent(eventName, params) {
        if (inSelfTest) return;
        try {
            if (typeof window.trackFunnelEvent === 'function') {
                window.trackFunnelEvent(eventName, params || {});
            }
        } catch (_) {}
    }

    function ensureStateShape(s) {
        const base = L.store.fresh(s);
        const out = Object.assign({}, base, s || {});
        if (!Array.isArray(out.completed)) out.completed = [];
        if (!Array.isArray(out.inventory)) out.inventory = [];
        if (!Array.isArray(out.relics)) out.relics = [];
        if (!Array.isArray(out.solvedIds)) out.solvedIds = [];
        if (!out.floorStars || typeof out.floorStars !== 'object' || Array.isArray(out.floorStars)) out.floorStars = {};
        out.dailyStreak = Math.max(parseInt(out.dailyStreak, 10) || 0, 0);
        out.lastDailyDate = typeof out.lastDailyDate === 'string' ? out.lastDailyDate : '';
        out.lastDailyGrid = typeof out.lastDailyGrid === 'string' ? out.lastDailyGrid : '';
        out.streakShields = Math.min(Math.max(parseInt(out.streakShields, 10) || 0, 0), 3);
        return out;
    }

    /* ---------------- STATE ---------------- */

    let state = ensureStateShape(L.store.fresh());
    let campaignLevel = null;    // preserved when Daily Seed, Boss Rush, or Duel is active
    let item = null;
    let locked = false;
    let targetedZone = null;
    let draggedBlock = null;
    let hintsUsed = 0;
    let levelMistakes = 0;
    let hintLevel = -1;
    let hintItemKey = null;
    let bossRushActive = false;
    let bossRushStep = 0;
    let bossRushResults = [];
    let dailySeedActive = false;
    let dailySeedStep = 0;
    let dailyGauntletData = null;
    let dailyStepResults = [];
    let dailyStepHadNearMiss = false;
    let duelActive = false;
    let duelStep = 0;
    let duelData = null;
    let duelLastSpec = null;
    let duelStepResults = [];
    let duelStepHadNearMiss = false;
    let duelElapsedMs = 0;
    let duelTurnStartedAt = null;
    let duelTimerInterval = null;
    let pendingDuelShareSpec = null;
    let pendingDuelShareLabel = '⚔️ Copy Counter-Duel Link';
    let deferredBootStatus = null;
    let deferredForgeOpen = false;
    let forgeSelectedIds = [];
    let forgeShowSentences = false;
    let forgeActivePreset = 'c1_random';
    let pendingRecapMode = null;
    let activeRecapMode = null;
    let firstMoveFired = false;
    let inSelfTest = false;

    let bossAudio = null;
    let milestoneTimer = null;
    let lootTimer = null;
    let hintGlowTimer = null;
    const floatTimers = new Set();

    let modalReturnFocus = null;
    let drawerReturnFocus = null;
    let recapReturnFocus = null;
    let activeAutopsyInfo = null;

    /* ---------------- DOM ---------------- */

    const $ = (id) => document.getElementById(id);
    const board = $('board');
    const bank = $('bank');
    const statusEl = $('status');
    const tipEl = $('tip');
    const nextBtn = $('next-btn');
    const undoBtn = $('undo-btn');
    const hintBtn = $('hint-btn');
    const blueprintBtn = $('blueprint-btn');
    const autopsyCard = $('syntax-autopsy-card');
    const floorDrawer = $('floor-drawer');
    const modal = $('prize-modal');
    const recapModal = $('recap-modal');
    const tierJumpBar = $('tier-jump-bar');

    /* ---------------- CLEAN SCREENSHARE GUARD ---------------- */

    function isCleanMode() {
        try {
            if (localStorage.getItem('gm_teacher_clean_screenshare') === 'true') return true;
        } catch (_) {}
        try {
            if (new URLSearchParams(location.search).get('wl') === '1') return true;
        } catch (_) {}
        return !!(document.body && document.body.classList.contains('gm-clean-screenshare'));
    }

    function syncCleanModeUI() {
        const clean = isCleanMode();
        if (clean && document.body && !document.body.classList.contains('gm-clean-screenshare')) {
            document.body.classList.add('gm-clean-screenshare');
        }
        const deskStrip = $('belfast-desk-strip');
        if (deskStrip) deskStrip.classList.toggle('hidden', clean);
        const storyLink = $('autopsy-story-link');
        if (storyLink && clean) storyLink.classList.add('hidden');
    }

    /* ---------------- VOICE & TIMERS ---------------- */

    function setBossVoiceBtnState(playing) {
        const btn = $('boss-voice-btn');
        if (!btn) return;
        btn.textContent = playing ? '⏹ Stop Voice' : '🔊 Boss Voice';
        btn.setAttribute('aria-pressed', playing ? 'true' : 'false');
    }

    function stopBossVoice() {
        if (bossAudio) {
            try { bossAudio.pause(); bossAudio.currentTime = 0; } catch (_) {}
            bossAudio = null;
        }
        setBossVoiceBtnState(false);
    }

    function playBossVoice(floorIdx, force) {
        if (inSelfTest) return;
        const boss = bosses[floorIdx];
        if (!boss || !boss.audio) return;
        if (!force && !isSoundEnabled()) return;
        stopBossVoice();
        try {
            const audio = new Audio(boss.audio);
            audio.volume = 0.85;
            bossAudio = audio;
            setBossVoiceBtnState(true);
            audio.addEventListener('ended', () => {
                if (bossAudio === audio) {
                    bossAudio = null;
                    setBossVoiceBtnState(false);
                }
            });
            audio.addEventListener('error', () => {
                if (bossAudio === audio) {
                    bossAudio = null;
                    setBossVoiceBtnState(false);
                }
            });
            const p = audio.play();
            if (p && typeof p.catch === 'function') {
                p.catch(() => {
                    if (bossAudio === audio) {
                        bossAudio = null;
                        setBossVoiceBtnState(false);
                    }
                });
            }
        } catch (_) {
            bossAudio = null;
            setBossVoiceBtnState(false);
        }
    }

    function clearDuelTimerInterval() {
        if (duelTimerInterval) {
            clearInterval(duelTimerInterval);
            duelTimerInterval = null;
        }
    }

    function formatDuration(sec) {
        const s = Math.max(0, Math.floor(Number(sec) || 0));
        const mins = Math.floor(s / 60);
        const rem = s % 60;
        return `${mins}:${String(rem).padStart(2, '0')}`;
    }

    function getDuelActiveMs() {
        return duelElapsedMs + (duelTurnStartedAt !== null ? Math.max(0, Date.now() - duelTurnStartedAt) : 0);
    }

    function getDuelActiveSec() {
        return Math.min(3600, Math.floor(getDuelActiveMs() / 1000));
    }

    function pauseDuelTimer() {
        if (duelTurnStartedAt !== null) {
            duelElapsedMs += Math.max(0, Date.now() - duelTurnStartedAt);
            duelTurnStartedAt = null;
        }
        clearDuelTimerInterval();
    }

    function refreshDuelTimerUI() {
        const badge = $('duel-badge');
        if (!badge || !duelActive || !duelData) return;
        badge.textContent = `⚔️ Duel ${duelStep + 1}/${duelData.steps.length} · ${formatDuration(getDuelActiveSec())}`;
    }

    function resumeDuelTimer() {
        if (!(duelActive || dailySeedActive || bossRushActive) || locked) return;
        if (duelTurnStartedAt === null) {
            duelTurnStartedAt = Date.now();
        }
        if (duelActive && !duelTimerInterval && !inSelfTest) {
            duelTimerInterval = setInterval(refreshDuelTimerUI, 500);
        }
    }

    function resetDuelState() {
        clearDuelTimerInterval();
        duelActive = false;
        duelStep = 0;
        duelData = null;
        duelStepResults = [];
        duelStepHadNearMiss = false;
        duelElapsedMs = 0;
        duelTurnStartedAt = null;
    }

    function clearTransientTimers() {
        clearDuelTimerInterval();
        if (milestoneTimer) { clearTimeout(milestoneTimer); milestoneTimer = null; }
        if (lootTimer) { clearTimeout(lootTimer); lootTimer = null; }
        if (hintGlowTimer) { clearTimeout(hintGlowTimer); hintGlowTimer = null; }
        floatTimers.forEach(t => clearTimeout(t));
        floatTimers.clear();
        const popup = $('loot-announcement');
        if (popup) popup.classList.remove('show');
        document.querySelectorAll('.floating-text').forEach(el => el.remove());
    }

    function loadState() {
        state = ensureStateShape(L.store.load());
    }

    function saveState() {
        if (inSelfTest) return;
        const toSave = ((dailySeedActive || bossRushActive || duelActive) && campaignLevel !== null)
            ? { ...state, level: campaignLevel }
            : state;
        L.store.save(toSave);
    }

    function setStatus(text, kind) {
        if (!statusEl) return;
        statusEl.textContent = text;
        statusEl.className = 'status-panel' + (kind ? ' ' + kind : '');
    }

    const zones = () => Array.from(board.querySelectorAll('.drop-zone'));
    const blockIn = (zone) => zone.querySelector('.block');

    function previousDaySeed(seedStr) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(seedStr || ''))) return '';
        const [y, m, d] = seedStr.split('-').map(Number);
        const dt = new Date(Date.UTC(y, m - 1, d));
        dt.setUTCDate(dt.getUTCDate() - 1);
        return dt.toISOString().slice(0, 10);
    }

    function tierForFloor(floorIdx) {
        if (floorIdx < 5) return 'b1';
        if (floorIdx < 10) return 'b2';
        if (floorIdx < 20) return 'c1';
        return 'c2';
    }

    function refreshHud() {
        const isOpen = floorDrawer && !floorDrawer.classList.contains('hidden');
        if ($('level-display')) {
            $('level-display').textContent = `Floor: ${state.level + 1}/${levels.length} ${isOpen ? '▴' : '▾'}`;
            $('level-display').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        if ($('progress-pill')) {
            $('progress-pill').setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        if ($('rank-display')) {
            const prefix = state.playerName ? `${state.playerName} · ` : '';
            $('rank-display').textContent = `⚔️ ${prefix}Rank ${Math.floor(state.xp / XP_PER_RANK) + 1}`;
        }
        if ($('gold-counter')) $('gold-counter').textContent = `🪙 ${state.gold}`;
        if ($('xp-counter')) $('xp-counter').textContent = `🔮 ${state.xp % XP_PER_RANK}/${XP_PER_RANK}`;

        const shields = state.streakShields || 0;
        if ($('streak-display')) {
            $('streak-display').textContent = shields > 0 ? `🔥 ${state.streak} 🛡️${shields}` : `🔥 ${state.streak}`;
            $('streak-display').title = shields > 0
                ? `Streak: ${state.streak} (${shields} Streak Shield${shields > 1 ? 's' : ''} active)`
                : 'Streak';
        }

        const shieldBtn = $('buy-shield-btn');
        if (shieldBtn) {
            shieldBtn.textContent = shields >= 3
                ? '🛡️ Streak Shields Full (3/3)'
                : `🛡️ Buy Streak Shield (50 🪙) · ${shields}/3`;
            shieldBtn.disabled = shields >= 3 || state.gold < 50;
        }

        if ($('boss-rush-badge')) {
            if (bossRushActive) {
                $('boss-rush-badge').classList.remove('hidden');
                $('boss-rush-badge').textContent = `⚔️ Boss Rush ${bossRushStep + 1}/${BOSS_FLOORS.length}`;
            } else {
                $('boss-rush-badge').classList.add('hidden');
            }
        }
        if ($('boss-rush-btn')) {
            $('boss-rush-btn').classList.toggle('active', bossRushActive);
            $('boss-rush-btn').textContent = bossRushActive
                ? `⏹️ Exit Boss Rush (${bossRushStep + 1}/${BOSS_FLOORS.length})`
                : '⚔️ Start 5-Boss Rush (Floors 5·10·15·20·25)';
        }
        if ($('pool-count-badge')) {
            const total = L.totalItems || levels.reduce((sum, fl) => sum + fl.pool.length, 0);
            $('pool-count-badge').textContent = `📜 ${total} Challenges`;
        }
        if ($('daily-seed-badge')) {
            if (dailySeedActive && dailyGauntletData) {
                $('daily-seed-badge').classList.remove('hidden');
                $('daily-seed-badge').textContent = `🎲 Seed ${dailyGauntletData.seed} (${dailySeedStep + 1}/${dailyGauntletData.steps.length})`;
            } else {
                $('daily-seed-badge').classList.add('hidden');
            }
        }
        if ($('daily-seed-hud-btn')) {
            $('daily-seed-hud-btn').classList.toggle('active', dailySeedActive);
            $('daily-seed-hud-btn').textContent = dailySeedActive
                ? `⏹️ Exit Daily (${dailySeedStep + 1}/5)`
                : '🎲 Daily Seed';
        }
        if ($('daily-seed-btn')) {
            const seedLabel = typeof L.getTodaySeed === 'function' ? L.getTodaySeed() : '';
            $('daily-seed-btn').classList.toggle('active', dailySeedActive);
            $('daily-seed-btn').textContent = dailySeedActive
                ? `⏹️ Exit Daily Crypt Seed (${dailySeedStep + 1}/5)`
                : `🎲 Daily Crypt Seed · ${seedLabel} (5-Q C1/C2)`;
        }
        if ($('duel-badge')) {
            if (duelActive && duelData) {
                $('duel-badge').classList.remove('hidden');
                refreshDuelTimerUI();
            } else {
                $('duel-badge').classList.add('hidden');
            }
        }
        if ($('duel-hud-btn')) {
            $('duel-hud-btn').classList.toggle('active', duelActive);
            $('duel-hud-btn').textContent = (duelActive && duelData)
                ? `⏹️ Exit Duel (${duelStep + 1}/${duelData.steps.length})`
                : '⚔️ Duel';
        }

        if (tierJumpBar) {
            const activeTier = tierForFloor(state.level);
            tierJumpBar.querySelectorAll('.tier-pill[data-jump-tier]').forEach(btn => {
                btn.classList.toggle('active', !dailySeedActive && !bossRushActive && !duelActive && btn.dataset.jumpTier === activeTier);
            });
            const dailyPill = tierJumpBar.querySelector('.tier-pill[data-jump-mode="daily"]');
            if (dailyPill) dailyPill.classList.toggle('active', dailySeedActive);
        }
    }

    function renderDuelTargetBanner() {
        const banner = $('duel-target-banner');
        if (!banner) return;
        if (!duelActive || !duelData) {
            banner.classList.add('hidden');
            banner.textContent = '';
            return;
        }
        const total = duelData.steps.length;
        banner.classList.remove('hidden');
        if (duelData.sec > 0) {
            const who = duelData.by ? duelData.by : 'Challenger';
            banner.textContent = `🎯 Target to beat: ${who} scored ${duelData.clean}/${total} Clean in ${formatDuration(duelData.sec)}`;
        } else if (total === 5) {
            banner.textContent = '⚔️ Custom 5-Rune Duel — set the benchmark!';
        } else {
            banner.textContent = `⚔️ Custom ${total}-Rune Duel — set the benchmark!`;
        }
    }

    function buildDuelShareUrl(token) {
        return `${DUEL_SHARE_BASE_URL}?duel=${encodeURIComponent(token)}`;
    }

    function ensureForgeSelection() {
        const hits = forgeSelectedIds.length === 5 ? forgeSelectedIds.map(id => L.findItemById(id)) : [];
        if (hits.length === 5 && hits.every(Boolean) && new Set(hits.map(h => h.item.id)).size === 5) {
            return;
        }
        if (typeof L.duelPreset === 'function') {
            const presetRes = L.duelPreset(forgeActivePreset || 'c1_random', state);
            forgeSelectedIds = presetRes.ids.slice();
            forgeActivePreset = presetRes.preset;
        }
    }

    function setForgeFeedback(msg, isError) {
        const fb = $('duel-forge-feedback');
        if (!fb) return;
        fb.textContent = msg || '';
        fb.classList.toggle('error', Boolean(isError));
    }

    function renderDuelForge() {
        const box = $('duel-forge-box');
        const slotsEl = $('duel-forge-slots');
        if (!box || !slotsEl) return;
        ensureForgeSelection();

        box.querySelectorAll('.duel-preset-pill[data-duel-preset]').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-duel-preset') === forgeActivePreset);
        });
        const toggleBtn = $('duel-show-sentences-btn');
        if (toggleBtn) {
            toggleBtn.setAttribute('aria-pressed', forgeShowSentences ? 'true' : 'false');
            toggleBtn.textContent = forgeShowSentences ? '🙈 Hide sentences' : '👁️ Show sentences';
        }

        slotsEl.textContent = '';
        forgeSelectedIds.forEach((selectedId, idx) => {
            const hit = L.findItemById(selectedId) || { floorIdx: 10, item: levels[10].pool[0] };
            const usedElsewhere = new Set(forgeSelectedIds.filter((_, j) => j !== idx));

            const row = document.createElement('div');
            row.className = 'duel-forge-slot';

            const numEl = document.createElement('span');
            numEl.className = 'duel-slot-num';
            numEl.textContent = `Rune ${idx + 1}`;

            const floorSelect = document.createElement('select');
            floorSelect.className = 'duel-floor-select';
            floorSelect.setAttribute('aria-label', `Rune ${idx + 1} floor`);
            levels.forEach((fl, fIdx) => {
                const opt = document.createElement('option');
                opt.value = String(fIdx);
                opt.textContent = `F${fIdx + 1} · ${fl.title} (${fl.cefr})`;
                if (fIdx === hit.floorIdx) opt.selected = true;
                floorSelect.appendChild(opt);
            });

            const itemSelect = document.createElement('select');
            itemSelect.className = 'duel-item-select';
            itemSelect.setAttribute('aria-label', `Rune ${idx + 1} challenge`);
            const flPool = levels[hit.floorIdx].pool;
            flPool.forEach((poolItem, itemIdx) => {
                const opt = document.createElement('option');
                opt.value = poolItem.id;
                opt.textContent = forgeShowSentences
                    ? `${poolItem.id} · ${L.formatSentence(poolItem.answers[0])}`
                    : `${poolItem.id} · Challenge ${itemIdx + 1} (${poolItem.tokens.length} slots)`;
                if (poolItem.id === hit.item.id) opt.selected = true;
                else if (usedElsewhere.has(poolItem.id)) opt.disabled = true;
                itemSelect.appendChild(opt);
            });

            floorSelect.addEventListener('change', () => {
                const nextFloor = parseInt(floorSelect.value, 10);
                if (Number.isNaN(nextFloor) || !levels[nextFloor]) return;
                const pool = levels[nextFloor].pool;
                const avail = pool.find(p => !usedElsewhere.has(p.id)) || pool[0];
                forgeSelectedIds[idx] = avail.id;
                forgeActivePreset = '';
                setForgeFeedback('', false);
                renderDuelForge();
            });

            itemSelect.addEventListener('change', () => {
                const nextId = itemSelect.value;
                if (usedElsewhere.has(nextId)) {
                    setForgeFeedback('Each rune must be unique across the 5 slots.', true);
                    renderDuelForge();
                    return;
                }
                forgeSelectedIds[idx] = nextId;
                forgeActivePreset = '';
                setForgeFeedback('', false);
                renderDuelForge();
            });

            row.append(numEl, floorSelect, itemSelect);
            if (forgeShowSentences) {
                const preview = document.createElement('div');
                preview.className = 'duel-slot-preview';
                preview.textContent = `${hit.item.id}: ${L.formatSentence(hit.item.answers[0])}`;
                row.appendChild(preview);
            }
            slotsEl.appendChild(row);
        });
    }

    function applyForgePreset(presetKey) {
        if (typeof L.duelPreset !== 'function') return;
        const res = L.duelPreset(presetKey, state);
        forgeSelectedIds = res.ids.slice();
        forgeActivePreset = res.preset;
        setForgeFeedback('', false);
        renderDuelForge();
        sfx('grab');
    }

    function copyInstantDuelLink() {
        ensureForgeSelection();
        if (typeof L.encodeDuel !== 'function') return;
        const token = L.encodeDuel({ ids: forgeSelectedIds, clean: 0, sec: 0, by: state.playerName || '' });
        if (!token) {
            setForgeFeedback('Pick 5 distinct challenges before copying a duel link.', true);
            return;
        }
        const url = buildDuelShareUrl(token);
        const btn = $('duel-copy-instant-btn');
        if (btn) btn.dataset.duelUrl = url;
        const markDone = () => {
            setForgeFeedback('✓ Instant Duel Link copied! Ready to paste in chat.', false);
            if (btn) {
                btn.textContent = '✓ Instant Duel Copied!';
                setTimeout(() => {
                    if (btn) btn.textContent = '📋 Copy Instant Duel Link';
                }, 2200);
            }
            trackCryptEvent('crypt_duel_forged', { tool: 'duel_forge', action: 'copy_instant', preset: forgeActivePreset || 'custom' });
            sfx('loot');
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(url).then(markDone).catch(() => fallbackCopyText(url, markDone));
        } else {
            fallbackCopyText(url, markDone);
        }
    }

    function playForgedDuel() {
        ensureForgeSelection();
        if (typeof L.encodeDuel !== 'function' || typeof L.decodeDuel !== 'function') return;
        const token = L.encodeDuel({ ids: forgeSelectedIds, clean: 0, sec: 0, by: '' });
        const spec = L.decodeDuel(token);
        if (!spec) {
            setForgeFeedback('Pick 5 distinct challenges to start the duel.', true);
            return;
        }
        trackCryptEvent('crypt_duel_forged', { tool: 'duel_forge', action: 'play', preset: forgeActivePreset || 'custom' });
        startDuel(spec, false);
    }

    function openDuelForge() {
        toggleFloorDrawer(true);
        const forgeBox = $('duel-forge-box');
        if (forgeBox) {
            forgeBox.open = true;
            renderDuelForge();
            try { forgeBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_) {}
            const focusTarget = forgeBox.querySelector('.duel-preset-pill') || forgeBox.querySelector('summary');
            if (focusTarget) {
                try { focusTarget.focus({ preventScroll: true }); } catch (_) { focusTarget.focus(); }
            }
        }
    }

    /* ---------------- FLOOR SELECTOR & MODE SWITCHING ---------------- */

    function renderFloorDrawer() {
        const grid = $('floor-grid');
        if (!grid) return;
        grid.textContent = '';
        const solvedSet = new Set(state.solvedIds || []);
        levels.forEach((fl, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.setAttribute('role', 'listitem');
            const isCurrent = state.level === idx;
            const isCleared = state.completed.includes(idx);
            const bossInfo = bosses[idx];
            btn.className = 'floor-card'
                + (isCurrent ? ' current' : '')
                + (isCleared ? ' completed' : '')
                + (bossInfo ? ' boss-floor' : '');
            btn.dataset.floorIdx = String(idx);

            const top = document.createElement('span');
            top.className = 'floor-card-top';
            const num = document.createElement('span');
            num.className = 'floor-card-num';
            num.textContent = `F${idx + 1}${bossInfo ? ' ' + bossInfo.emoji : ''}${isCleared ? ' ✓' : ''}`;
            const cefr = document.createElement('span');
            cefr.className = 'floor-card-cefr';
            cefr.textContent = fl.cefr;
            top.append(num, cefr);

            const title = document.createElement('span');
            title.className = 'floor-card-title';
            title.textContent = fl.title;

            const meta = document.createElement('span');
            meta.className = 'floor-card-meta';
            const starsCount = Math.min(3, Math.max(0, Number((state.floorStars && state.floorStars[idx]) || 0)));
            const starsEl = document.createElement('span');
            starsEl.className = 'floor-card-stars';
            starsEl.textContent = '★'.repeat(starsCount) + '☆'.repeat(3 - starsCount);
            starsEl.setAttribute('aria-label', `${starsCount} out of 3 stars`);

            const solvedInPool = fl.pool.filter(p => solvedSet.has(p.id)).length;
            const progEl = document.createElement('span');
            progEl.className = 'floor-card-progress';
            progEl.textContent = `${solvedInPool}/${fl.pool.length}`;
            meta.append(starsEl, progEl);

            btn.append(top, title, meta);
            btn.addEventListener('click', () => {
                trackCryptEvent('crypt_drawer_jump', { tool: `floor_${idx + 1}` });
                jumpToFloor(idx);
            });
            grid.appendChild(btn);
        });
    }

    function toggleFloorDrawer(forceOpen) {
        if (!floorDrawer) return;
        const wasOpen = !floorDrawer.classList.contains('hidden');
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : !wasOpen;
        if (willOpen && !wasOpen) {
            drawerReturnFocus = document.activeElement;
        }
        floorDrawer.classList.toggle('hidden', !willOpen);
        if (willOpen) {
            if ($('drawer-player-name')) $('drawer-player-name').value = state.playerName || '';
            renderFloorDrawer();
            renderDuelForge();
        } else if (wasOpen && drawerReturnFocus && document.contains(drawerReturnFocus) && floorDrawer.contains(document.activeElement)) {
            drawerReturnFocus.focus();
        } else if (!willOpen && wasOpen && drawerReturnFocus && document.contains(drawerReturnFocus) && document.activeElement === document.body) {
            drawerReturnFocus.focus();
        }
        refreshHud();
    }

    function exitSpecialModeAndRestoreCampaign() {
        bossRushActive = false;
        bossRushStep = 0;
        bossRushResults = [];
        dailySeedActive = false;
        dailySeedStep = 0;
        dailyGauntletData = null;
        dailyStepResults = [];
        dailyStepHadNearMiss = false;
        resetDuelState();
        pendingRecapMode = null;
        if (campaignLevel !== null) {
            state.level = campaignLevel;
            campaignLevel = null;
        }
        item = null;
        saveState();
        initLevel();
    }

    function jumpToFloor(floorIdx, keepSpecialMode) {
        if (floorIdx < 0 || floorIdx > lastLevel) return;
        clearTransientTimers();
        if (!keepSpecialMode) {
            bossRushActive = false;
            bossRushStep = 0;
            bossRushResults = [];
            dailySeedActive = false;
            dailySeedStep = 0;
            dailyGauntletData = null;
            dailyStepResults = [];
            dailyStepHadNearMiss = false;
            resetDuelState();
            campaignLevel = null;
        }
        state.level = floorIdx;
        item = null;
        saveState();
        toggleFloorDrawer(false);
        initLevel();
        sfx('grab');
    }

    function startBossRush(silent) {
        clearTransientTimers();
        if (campaignLevel === null) campaignLevel = state.level;
        dailySeedActive = false;
        dailySeedStep = 0;
        dailyGauntletData = null;
        dailyStepResults = [];
        dailyStepHadNearMiss = false;
        resetDuelState();
        bossRushActive = true;
        bossRushStep = 0;
        bossRushResults = [];
        state.level = BOSS_FLOORS[0];
        item = null;
        saveState();
        toggleFloorDrawer(false);
        initLevel();
        setStatus('⚔️ 5-Boss Rush engaged! Defeat all 5 Crypt Guardians (Floors 5, 10, 15, 20, 25).', '');
        trackCryptEvent('crypt_mode_started', { tool: 'boss_rush' });
        if (!silent) sfx('boss');
    }

    function toggleBossRush() {
        if (bossRushActive) {
            exitSpecialModeAndRestoreCampaign();
            setStatus('Exited Boss Rush — returned to your campaign floor.', '');
            return;
        }
        startBossRush(false);
    }

    function startDailySeed(silent) {
        if (typeof L.dailyGauntlet !== 'function') return;
        clearTransientTimers();
        if (campaignLevel === null) campaignLevel = state.level;
        bossRushActive = false;
        bossRushStep = 0;
        bossRushResults = [];
        resetDuelState();
        dailyGauntletData = L.dailyGauntlet();
        dailySeedActive = true;
        dailySeedStep = 0;
        dailyStepResults = [];
        dailyStepHadNearMiss = false;
        const firstStep = dailyGauntletData.steps[0];
        state.level = firstStep.floorIdx;
        item = firstStep.item;
        saveState();
        toggleFloorDrawer(false);
        initLevel(true);
        setStatus(`🎲 Daily Crypt Seed (${dailyGauntletData.seed}): 5-Question C1/C2 Gauntlet engaged!`, '');
        trackCryptEvent('crypt_mode_started', { tool: 'daily_seed', seed: dailyGauntletData.seed });
        if (!silent) sfx('epic');
    }

    function toggleDailySeed() {
        if (dailySeedActive) {
            exitSpecialModeAndRestoreCampaign();
            setStatus('Exited Daily Crypt Seed — returned to your campaign floor.', '');
            return;
        }
        startDailySeed(false);
    }

    function startDuel(duelSpec, silent) {
        if (!duelSpec || !Array.isArray(duelSpec.steps) || duelSpec.steps.length === 0) return false;
        clearTransientTimers();
        if (campaignLevel === null) campaignLevel = state.level;
        bossRushActive = false;
        bossRushStep = 0;
        bossRushResults = [];
        dailySeedActive = false;
        dailySeedStep = 0;
        dailyGauntletData = null;
        dailyStepResults = [];
        dailyStepHadNearMiss = false;
        resetDuelState();

        duelData = duelSpec;
        duelLastSpec = duelSpec;
        duelActive = true;
        duelStep = 0;
        duelStepResults = [];
        duelStepHadNearMiss = false;

        const firstStep = duelData.steps[0];
        state.level = firstStep.floorIdx;
        item = firstStep.item;
        saveState();
        toggleFloorDrawer(false);
        initLevel(true);

        const total = duelData.steps.length;
        if (duelData.sec > 0) {
            const who = duelData.by ? duelData.by : 'the challenger';
            setStatus(`⚔️ Duel engaged! Beat ${who}'s ${duelData.clean}/${total} Clean (${formatDuration(duelData.sec)}).`, '');
        } else {
            setStatus(`⚔️ ${total}-Rune Duel engaged! Solve cleanly and set the benchmark.`, '');
        }
        trackCryptEvent('crypt_mode_started', {
            tool: 'duel_link',
            count: total,
            timed: duelData.sec > 0 ? 'yes' : 'no'
        });
        if (!silent) sfx('epic');
        return true;
    }

    function toggleDuelMode() {
        if (duelActive) {
            exitSpecialModeAndRestoreCampaign();
            setStatus('Exited Duel — returned to your campaign floor.', '');
            return;
        }
        const drawerClosed = !floorDrawer || floorDrawer.classList.contains('hidden');
        const forgeBox = $('duel-forge-box');
        const forgeClosed = !forgeBox || !forgeBox.open;
        if (drawerClosed || forgeClosed) {
            openDuelForge();
        } else {
            toggleFloorDrawer(false);
        }
    }

    /* ---------------- BELFAST DESK SYNTAX AUTOPSY CARD ---------------- */

    function updateAutopsyCard(floorIdx, currentItem, solvedAnswer, revealFull) {
        if (!autopsyCard || !currentItem) return;
        const info = typeof L.autopsy === 'function'
            ? L.autopsy(floorIdx, currentItem, solvedAnswer || null)
            : {
                floor: floorIdx + 1,
                title: levels[floorIdx].title,
                cefr: levels[floorIdx].cefr,
                modelSentence: L.formatSentence(currentItem.answers[0]),
                altSentences: currentItem.answers.slice(1).map(L.formatSentence),
                formula: levels[floorIdx].formula || '',
                posChain: '',
                decoyDiagnosis: currentItem.explain,
                examTip: levels[floorIdx].examTip || '',
                bridge: currentItem.bridge || levels[floorIdx].bridge || null,
                darkAcademiaBridge: null
            };

        if ($('autopsy-floor-heading')) {
            $('autopsy-floor-heading').textContent = `Floor ${info.floor} · ${info.title}`;
        }
        if ($('autopsy-cefr-badge')) {
            $('autopsy-cefr-badge').textContent = info.cefr;
        }
        if ($('autopsy-formula')) {
            $('autopsy-formula').textContent = info.formula;
        }
        if ($('autopsy-pos-chain')) {
            $('autopsy-pos-chain').textContent = (locked || revealFull)
                ? `Token Map: ${info.posChain}`
                : 'Solve the sentence first to inspect the token-by-token map.';
        }
        if ($('autopsy-trap-text')) {
            $('autopsy-trap-text').textContent = locked
                ? info.decoyDiagnosis
                : 'Solve the sentence first to unlock the decoy diagnosis.';
        }
        if ($('autopsy-exam-text')) {
            $('autopsy-exam-text').textContent = info.examTip;
        }

        const modelOut = $('autopsy-model-output');
        const revealBtn = $('reveal-model-btn');
        const primarySentence = solvedAnswer ? L.formatSentence(solvedAnswer) : info.modelSentence;
        const allAlternatives = (info.altSentences || []).filter(s => s !== primarySentence);
        const altNote = allAlternatives.length > 0
            ? ` (Also accepted: ${allAlternatives.map(s => `"${s}"`).join(' · ')})`
            : '';

        const showModel = Boolean(locked || revealFull);
        if (modelOut) {
            modelOut.textContent = showModel
                ? `✔ Cambridge Model: "${primarySentence}" — ${currentItem.explain}${altNote}`
                : '';
            modelOut.classList.toggle('hidden', !showModel);
        }

        const isBossFloor = !!bosses[floorIdx];
        if (revealBtn) {
            if (!locked && isBossFloor) {
                revealBtn.disabled = true;
                revealBtn.textContent = '🔒 Model Locked on Boss Floors';
                revealBtn.classList.remove('hidden');
            } else {
                revealBtn.disabled = false;
                revealBtn.textContent = '👁️ Reveal Cambridge Model';
                revealBtn.classList.toggle('hidden', showModel);
            }
        }

        // Cambridge C1 Part 4 micro-drill bridge (post-solve only)
        activeAutopsyInfo = {
            floorIdx,
            title: levels[floorIdx].title,
            cefr: info.cefr,
            formula: info.formula,
            bridge: info.bridge || null
        };
        const bridgeBox = $('autopsy-bridge-box');
        if (bridgeBox) {
            if (locked && info.bridge) {
                const b = info.bridge;
                const bridgeKey = `${floorIdx}:${b.keyword || ''}:${b.answer || ''}`;
                const isNewBridge = bridgeBox.dataset.activeBridgeKey !== bridgeKey;
                bridgeBox.dataset.activeBridgeKey = bridgeKey;
                bridgeBox.classList.remove('hidden');
                const promptEl = bridgeBox.querySelector('.bridge-prompt');
                const kwEl = bridgeBox.querySelector('.bridge-keyword-badge');
                const frameEl = bridgeBox.querySelector('.bridge-frame');
                const revealBridgeBtn = $('btn-reveal-bridge');
                const ansEl = bridgeBox.querySelector('.bridge-answer-reveal');
                const attemptInput = $('bridge-attempt-input');
                const attemptFb = $('bridge-attempt-feedback');
                if (promptEl) promptEl.textContent = b.prompt || '';
                if (kwEl) kwEl.textContent = b.keyword ? `KEY WORD: ${b.keyword}` : '';
                if (frameEl) frameEl.textContent = `${b.frameBefore || ''} ________ ${b.frameAfter || ''}`.trim();
                if (ansEl) {
                    ansEl.textContent = `✔ ${b.answer || ''}${b.note ? ` — ${b.note}` : ''}`;
                    if (isNewBridge) ansEl.classList.add('hidden');
                }
                if (revealBridgeBtn && isNewBridge) {
                    revealBridgeBtn.classList.remove('hidden');
                    revealBridgeBtn.disabled = false;
                }
                if (attemptInput && isNewBridge) {
                    attemptInput.value = '';
                }
                if (attemptFb && isNewBridge) {
                    attemptFb.textContent = '';
                    attemptFb.className = 'bridge-attempt-feedback hidden';
                }
            } else {
                bridgeBox.dataset.activeBridgeKey = '';
                bridgeBox.classList.add('hidden');
            }
        }

        // Free Gothic Story Lesson link (post-solve & hidden in clean screenshare mode)
        const storyLink = $('autopsy-story-link');
        if (storyLink) {
            if (locked && info.darkAcademiaBridge && info.darkAcademiaBridge.href && !isCleanMode()) {
                storyLink.href = info.darkAcademiaBridge.href;
                storyLink.textContent = `📖 ${info.darkAcademiaBridge.title} →`;
                storyLink.classList.remove('hidden');
            } else {
                storyLink.href = '#';
                storyLink.textContent = '';
                storyLink.classList.add('hidden');
            }
        }
    }

    function toggleAutopsyCard(forceOpen, revealFull) {
        if (!autopsyCard) return;
        const willOpen = typeof forceOpen === 'boolean' ? forceOpen : autopsyCard.classList.contains('hidden');
        autopsyCard.classList.toggle('hidden', !willOpen);
        if (blueprintBtn) {
            blueprintBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            blueprintBtn.textContent = willOpen ? '🙈 Hide Structural Blueprint' : '👁️ Reveal Structural Blueprint';
        }
        if (willOpen) {
            updateAutopsyCard(state.level, item, locked ? item.answers[0] : null, locked || !!revealFull);
            if (!inSelfTest && typeof forceOpen !== 'boolean') {
                trackCryptEvent('crypt_autopsy_opened', { tool: `floor_${state.level + 1}`, solved: locked ? 'yes' : 'no' });
            }
        }
    }

    /* ---------------- LEVEL SETUP ---------------- */

    function initLevel(keepItem) {
        clearTransientTimers();
        if (duelActive && duelData && duelData.steps[duelStep]) {
            state.level = duelData.steps[duelStep].floorIdx;
        }
        const level = levels[state.level];
        locked = false;
        activeAutopsyInfo = {
            floorIdx: state.level,
            title: level.title,
            cefr: level.cefr,
            formula: level.formula || '',
            bridge: null
        };
        pendingRecapMode = null;
        dailyStepHadNearMiss = false;
        duelStepHadNearMiss = false;

        const boss = bosses[state.level];
        if (boss) {
            document.body.classList.add('boss-mode');
            $('boss-arena').classList.remove('hidden');
            $('boss-avatar').textContent = boss.emoji;
            $('boss-avatar').style.filter = 'drop-shadow(2px 4px 0 #000)';
            $('boss-name').textContent = boss.name;
            $('boss-taunt').textContent = `"${boss.taunt}"`;
            if (hintBtn) hintBtn.style.display = 'none';
            playBossVoice(state.level, false);
        } else {
            document.body.classList.remove('boss-mode');
            $('boss-arena').classList.add('hidden');
            if (hintBtn) hintBtn.style.display = 'inline-block';
            stopBossVoice();
        }

        targetedZone = null;

        if (dailySeedActive && dailyGauntletData && dailyGauntletData.steps[dailySeedStep]) {
            item = dailyGauntletData.steps[dailySeedStep].item;
        } else if (duelActive && duelData && duelData.steps[duelStep]) {
            item = duelData.steps[duelStep].item;
        } else if (!keepItem || !item || !level.pool.includes(item)) {
            item = L.pickItem(state.level, item && item.id);
        }

        const nextHintKey = `${state.level}:${item ? item.id : ''}:${duelActive ? 'd' + duelStep : (dailySeedActive ? 's' + dailySeedStep : (bossRushActive ? 'b' + bossRushStep : 'c'))}`;
        if (hintItemKey !== nextHintKey) {
            hintsUsed = 0;
            levelMistakes = 0;
            hintItemKey = nextHintKey;
            hintLevel = state.level;
        }

        if (tipEl) tipEl.textContent = '';
        resumeDuelTimer();
        refreshHud();
        renderDuelTargetBanner();
        $('quest-title').textContent = (dailySeedActive && dailyGauntletData)
            ? `🎲 Daily Seed ${dailySeedStep + 1}/${dailyGauntletData.steps.length} · ${level.title} (${level.cefr})`
            : (duelActive && duelData)
                ? `⚔️ Duel ${duelStep + 1}/${duelData.steps.length} · ${level.title} (${level.cefr})`
                : `${level.title} (${level.cefr})`;

        board.innerHTML = '';
        bank.innerHTML = '';
        nextBtn.disabled = true;
        nextBtn.textContent = dailySeedActive
            ? 'Next Seed ➔'
            : (duelActive
                ? 'Next Rune ➔'
                : (bossRushActive ? 'Next Boss ➔' : 'Next Floor ➔'));
        setStatus('Summon the sentence!', '');
        toggleAutopsyCard(false, false);

        item.slots.forEach((slot, i) => {
            const zone = document.createElement('div');
            const extraCls = slot.pos === 'any' ? ` ${(L.CSS && L.CSS.any) ? L.CSS.any : 'any-slot'}` : '';
            zone.className = 'drop-zone' + extraCls;
            zone.dataset.pos = slot.pos;
            zone.setAttribute('role', 'group');
            zone.setAttribute('aria-label', `Slot ${i + 1}: ${slot.label}`);
            const label = document.createElement('span');
            label.className = 'slot-label';
            label.textContent = slot.label;
            zone.appendChild(label);
            board.appendChild(zone);
        });

        const isCoarsePointer = Boolean(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
        L.shuffledRunes(item).forEach((r, i) => {
            const block = document.createElement('div');
            block.className = `block ${L.CSS[r.pos] || ''}`;
            block.id = `rune-${i}`;
            block.draggable = !isCoarsePointer;
            block.tabIndex = 0;
            block.setAttribute('role', 'button');
            block.dataset.pos = r.pos;
            block.dataset.text = r.text;
            block.textContent = r.text;
            bank.appendChild(block);
        });

        refreshZones();
        if (floorDrawer && !floorDrawer.classList.contains('hidden')) renderFloorDrawer();
    }

    const BANK_SHORTCUT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

    function refreshZones() {
        const currentZones = zones();
        let anyPlaced = false;
        currentZones.forEach(z => {
            const hasBlock = !!blockIn(z);
            if (hasBlock) anyPlaced = true;
            z.classList.toggle('filled', hasBlock);
            z.classList.remove('wrong');
        });
        if (undoBtn) undoBtn.disabled = locked || !anyPlaced;

        board.querySelectorAll('.block').forEach(b => b.removeAttribute('data-key'));
        Array.from(bank.querySelectorAll('.block')).forEach((b, idx) => {
            if (!locked && idx < BANK_SHORTCUT_KEYS.length) {
                b.dataset.key = BANK_SHORTCUT_KEYS[idx];
            } else {
                b.removeAttribute('data-key');
            }
        });
    }

    function setTarget(zone) {
        if (targetedZone) targetedZone.classList.remove('targeted');
        targetedZone = zone;
        if (zone) zone.classList.add('targeted');
    }

    const boardTexts = () => zones().map(z => (blockIn(z) ? blockIn(z).dataset.text : null));

    function getTipText(floorIdx, it, pos) {
        if (!pos) return '';
        if (typeof L.tipFor === 'function') return L.tipFor(floorIdx, it, pos) || '';
        return (L.TIPS && L.TIPS[pos]) || '';
    }

    function useHint() {
        if (locked) return;
        const slots = zones();
        const cost = hintsUsed === 0 ? 0 : 5;
        if (state.gold < cost) {
            setStatus('Not enough gold for another hint (5 🪙).', 'error');
            return;
        }

        const texts = boardTexts();
        const c = L.closest(item, texts);
        const firstWrongIndex = c.prefix;
        if (firstWrongIndex >= c.answer.length) return;

        const expectedText = c.answer[firstWrongIndex];
        const block = Array.from(bank.querySelectorAll('.block')).find(b => b.dataset.text === expectedText)
            || Array.from(board.querySelectorAll('.block')).find(b => b.dataset.text === expectedText && !slots[firstWrongIndex].contains(b));
        if (block) {
            block.classList.add('hint');
            if (hintGlowTimer) clearTimeout(hintGlowTimer);
            hintGlowTimer = setTimeout(() => {
                block.classList.remove('hint');
                hintGlowTimer = null;
            }, 2600);
        }

        state.gold -= cost;
        hintsUsed++;
        refreshHud();
        saveState();

        const slotInfo = item.slots && item.slots[firstWrongIndex];
        const expectedPos = (slotInfo && slotInfo.pos && slotInfo.pos !== 'any')
            ? slotInfo.pos
            : ((item.posOf && item.posOf[expectedText]) || 'any');
        setStatus(`Rune ${firstWrongIndex + 1} is glowing!` + (cost ? ' (-5 🪙)' : ' (first hint is free)'), '');
        if (tipEl) tipEl.textContent = getTipText(state.level, item, expectedPos);
        trackCryptEvent('crypt_hint_used', { tool: `floor_${state.level + 1}` });
        sfx('grab');
    }

    /* ---------------- MOVING RUNES ---------------- */

    function place(block, container) {
        container.appendChild(block);
        sfx('drop');
    }

    function afterMove() {
        if (!inSelfTest && !firstMoveFired) {
            firstMoveFired = true;
            trackCryptEvent('crypt_first_move', { tool: `act_${Math.floor(state.level / 5) + 1}` });
        }
        refreshZones();
        validateBoard();
    }

    function undoLastRune() {
        if (locked) return false;
        const occupiedZones = zones().filter(z => !!blockIn(z));
        if (occupiedZones.length === 0) return false;
        const lastBlock = blockIn(occupiedZones[occupiedZones.length - 1]);
        if (!lastBlock) return false;
        place(lastBlock, bank);
        setTarget(null);
        afterMove();
        return true;
    }

    function activateBlock(block) {
        if (locked) return;
        const zone = block.closest('.drop-zone');
        if (zone) {
            place(block, bank);
        } else {
            const target = (targetedZone && !blockIn(targetedZone)) ? targetedZone : zones().find(z => !blockIn(z));
            if (!target) return;
            place(block, target);
        }
        setTarget(null);
        afterMove();
    }

    function clearActive(except) {
        document.querySelectorAll('.drop-zone.active, .block-bank.active').forEach(el => {
            if (el !== except) el.classList.remove('active');
        });
    }

    function dropOn(container) {
        const dragged = draggedBlock;
        if (!dragged || locked) return;
        if (container.classList.contains('drop-zone')) {
            const occupant = blockIn(container);
            if (occupant === dragged) return;
            if (occupant) place(occupant, dragged.parentElement);
            place(dragged, container);
        } else {
            place(dragged, bank);
        }
        setTarget(null);
        afterMove();
    }

    function bindInteractions() {
        const playArea = board.closest('.panel');

        playArea.addEventListener('click', (e) => {
            const block = e.target.closest('.block');
            if (block) { activateBlock(block); return; }
            const zone = e.target.closest('.drop-zone');
            if (zone && !locked && !blockIn(zone)) setTarget(zone === targetedZone ? null : zone);
        });

        playArea.addEventListener('keydown', (e) => {
            const block = e.target.closest && e.target.closest('.block');
            if (block && !locked && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                e.stopPropagation();
                activateBlock(block);
            }
        });

        playArea.addEventListener('dragstart', (e) => {
            const block = e.target.closest && e.target.closest('.block');
            if (!block || locked) { e.preventDefault(); return; }
            draggedBlock = block;
            e.dataTransfer.setData('text/plain', block.id);
            e.dataTransfer.effectAllowed = 'move';
            block.classList.add('dragging');
            sfx('grab');
        });

        playArea.addEventListener('dragover', (e) => {
            if (!draggedBlock) return;
            const container = e.target.closest('.drop-zone, .block-bank');
            if (!container) { clearActive(); return; }
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            clearActive(container);
            container.classList.add('active');
        });

        playArea.addEventListener('drop', (e) => {
            const container = e.target.closest('.drop-zone, .block-bank');
            if (!container) return;
            e.preventDefault();
            clearActive();
            dropOn(container);
        });

        playArea.addEventListener('dragend', () => {
            if (draggedBlock) draggedBlock.classList.remove('dragging');
            draggedBlock = null;
            clearActive();
        });

        // Mobile Touch Drag & Drop (threshold > 10px, clean touchcancel separation)
        let touchDragEl = null;
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDragging = false;
        let touchScrollSuppressed = false;
        let touchClone = null;

        const clearTouchDragVisuals = () => {
            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }
            if (touchDragEl) {
                touchDragEl.classList.remove('dragging');
            }
            clearActive();
        };

        const cancelTouchDrag = () => {
            clearTouchDragVisuals();
            draggedBlock = null;
            touchDragEl = null;
            isTouchDragging = false;
            touchScrollSuppressed = false;
        };

        playArea.addEventListener('touchstart', (e) => {
            if (locked || (e.touches && e.touches.length > 1)) {
                cancelTouchDrag();
                return;
            }
            const block = e.target.closest('.block');
            if (!block) return;
            const t = e.touches[0];
            touchDragEl = block;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            isTouchDragging = false;
            touchScrollSuppressed = false;
        }, { passive: true });

        playArea.addEventListener('touchmove', (e) => {
            if (!touchDragEl || locked || touchScrollSuppressed) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const dist = Math.hypot(dx, dy);

            if (!isTouchDragging) {
                if (dist <= 10) return;
                if (!e.cancelable) {
                    touchScrollSuppressed = true;
                    touchDragEl = null;
                    return;
                }
                isTouchDragging = true;
                draggedBlock = touchDragEl;
                touchDragEl.classList.add('dragging');
                sfx('grab');

                touchClone = touchDragEl.cloneNode(true);
                touchClone.removeAttribute('id');
                touchClone.classList.add('touch-drag-proxy');
                touchClone.style.position = 'fixed';
                touchClone.style.pointerEvents = 'none';
                touchClone.style.zIndex = '9999';
                touchClone.style.opacity = '0.92';
                touchClone.style.transform = 'translate(-50%, -115%) scale(1.06)';
                touchClone.style.boxShadow = '0 12px 24px rgba(0,0,0,0.6)';
                document.body.appendChild(touchClone);
            }

            if (isTouchDragging) {
                if (!e.cancelable) {
                    cancelTouchDrag();
                    return;
                }
                e.preventDefault();
                if (touchClone) {
                    touchClone.style.left = t.clientX + 'px';
                    touchClone.style.top = t.clientY + 'px';
                }
                const elem = document.elementFromPoint(t.clientX, t.clientY);
                const container = elem ? elem.closest('.drop-zone, .block-bank') : null;
                clearActive();
                if (container) container.classList.add('active');
            }
        }, { passive: false });

        playArea.addEventListener('touchend', (e) => {
            const wasDragging = isTouchDragging;
            const block = touchDragEl;
            let container = null;
            if (wasDragging) {
                const t = e.changedTouches ? e.changedTouches[0] : null;
                if (t) {
                    const elem = document.elementFromPoint(t.clientX, t.clientY);
                    container = elem ? elem.closest('.drop-zone, .block-bank') : null;
                }
            }
            clearTouchDragVisuals();
            touchDragEl = null;
            isTouchDragging = false;
            touchScrollSuppressed = false;
            if (wasDragging && container && block) {
                draggedBlock = block;
                dropOn(container);
            }
            draggedBlock = null;
        }, { passive: true });

        playArea.addEventListener('touchcancel', cancelTouchDrag, { passive: true });
    }

    /* ---------------- VALIDATION ---------------- */

    function getCryptCategory(floorIdx, it) {
        const tokens = (it && Array.isArray(it.tokens)) ? it.tokens : [];
        if (floorIdx >= 0 && floorIdx <= 4) {
            return tokens.some(t => t.pos === 'part') ? 'phrasal_verbs' : 'prosody_cadence';
        }
        if (floorIdx >= 5 && floorIdx <= 9) return 'register_shift';
        if (floorIdx >= 10 && floorIdx <= 19) return 'inversion';
        if (floorIdx >= 20 && floorIdx <= 22) return 'cleft_clauses';
        if (floorIdx === 23) return 'nominalisation';
        if (tokens.some(t => t.pos === 'cleft' || t.pos === 'rel')) return 'cleft_clauses';
        if (tokens.some(t => t.pos === 'neg') || (tokens[0] && tokens[0].pos === 'aux')) return 'inversion';
        return 'register_shift';
    }

    function validateBoard() {
        const slots = zones();
        if (!slots.every(z => blockIn(z))) {
            if (!locked) setStatus('Summon the sentence!', '');
            return;
        }

        const currentTexts = boardTexts();
        const r = L.check(item, currentTexts);
        const questionText = levels[state.level] ? `${levels[state.level].title} (${levels[state.level].cefr})` : 'Grammar Crypt';
        const correctAns = L.formatSentence(r.answer || item.answers[0]);
        const chosenAns = L.formatSentence(currentTexts);
        const ruleExplanation = r.msg || item.explain || getTipText(state.level, item, r.expectedPos);

        if (r.result === 'correct') {
            if (!inSelfTest) {
                window.CandidateDossier?.recordAttempt({
                    category: getCryptCategory(state.level, item),
                    correct: true,
                    game: 'Grammar Crypt',
                    prompt: questionText,
                    targetAnswer: correctAns,
                    userAttempt: chosenAns,
                    explanation: item.explain || ruleExplanation
                });
            }
            solveLevel(r.answer);
        } else if (r.result === 'near') {
            if (dailySeedActive) dailyStepHadNearMiss = true;
            if (duelActive) duelStepHadNearMiss = true;
            setStatus('Almost!', '');
            if (tipEl) tipEl.textContent = r.msg;
            sfx('grab');
        } else {
            if (!inSelfTest) {
                window.CandidateDossier?.recordAttempt({
                    category: getCryptCategory(state.level, item),
                    correct: false,
                    game: 'Grammar Crypt',
                    prompt: questionText,
                    targetAnswer: correctAns,
                    userAttempt: chosenAns,
                    explanation: ruleExplanation
                });
            }

            let shieldMsg = '';
            if (state.streak > 0 && (state.streakShields || 0) > 0) {
                state.streakShields -= 1;
                shieldMsg = `🛡️ Streak Shield protected your ${state.streak}-streak! `;
            } else {
                state.streak = 0;
            }
            levelMistakes++;
            refreshHud();
            saveState();

            const firstWrongIndex = r.firstWrong;
            if (slots[firstWrongIndex]) slots[firstWrongIndex].classList.add('wrong');

            const baseMsg = r.isDecoy
                ? `Rune ${firstWrongIndex + 1} is a decoy: it does not belong in this sentence.`
                : `Rune ${firstWrongIndex + 1} is not right yet.`;
            setStatus(shieldMsg + baseMsg, 'error');
            if (tipEl) tipEl.textContent = r.msg || getTipText(state.level, item, r.expectedPos);

            board.classList.remove('shake');
            void board.offsetWidth;
            board.classList.add('shake');
            sfx('error');
        }
    }

    function showFloatingText(text, color, element) {
        if (inSelfTest || !element) return;
        const floater = document.createElement('div');
        floater.className = 'floating-text';
        floater.textContent = text;
        floater.style.color = color;
        const rect = element.getBoundingClientRect();
        floater.style.left = (rect.left + rect.width / 2 - 30 + window.scrollX) + 'px';
        floater.style.top = (rect.top - 20 + window.scrollY) + 'px';
        document.body.appendChild(floater);
        const t = setTimeout(() => {
            floatTimers.delete(t);
            floater.remove();
        }, 1000);
        floatTimers.add(t);
    }

    function solveLevel(answer) {
        locked = true;
        if (duelActive || dailySeedActive || bossRushActive) {
            pauseDuelTimer();
        }
        const solvedFloorIdx = state.level;
        const solvedOrder = answer || item.answers[0];
        board.querySelectorAll('.block').forEach(b => { b.classList.add('correct'); b.draggable = false; });
        bank.querySelectorAll('.block').forEach(b => { b.draggable = false; b.tabIndex = -1; });
        refreshZones();

        const isLast = solvedFloorIdx === lastLevel;
        const firstClear = !state.completed.includes(solvedFloorIdx);
        const stars = (levelMistakes === 0 && hintsUsed === 0)
            ? 3
            : ((levelMistakes <= 1 && hintsUsed <= 1) ? 2 : 1);

        if (!Array.isArray(state.solvedIds)) state.solvedIds = [];
        if (item && item.id && !state.solvedIds.includes(item.id)) {
            state.solvedIds.push(item.id);
        }
        if (!state.floorStars || typeof state.floorStars !== 'object') state.floorStars = {};
        if (stars > Number(state.floorStars[solvedFloorIdx] || 0)) {
            state.floorStars[solvedFloorIdx] = stars;
        }

        if (firstClear) {
            state.completed.push(solvedFloorIdx);
            state.streak++;
            if (levelMistakes === 0 && hintsUsed === 0) state.perfect++;
            const goldEarned = 15 + Math.min(state.streak - 1, 5) * 3;
            state.gold += goldEarned;
            state.xp += 20;

            const boss = bosses[solvedFloorIdx];
            if (boss) {
                state.gold += 50;
                $('boss-taunt').textContent = '"Impossible! My syntax is broken!"';
                $('boss-avatar').style.filter = 'grayscale(100%) blur(3px)';
                showFloatingText('+50 🪙 BOSS BONUS', '#facc15', $('gold-counter'));
                const xpT = setTimeout(() => {
                    floatTimers.delete(xpT);
                    showFloatingText('+20 🔮', '#a855f7', $('xp-counter'));
                }, 600);
                floatTimers.add(xpT);
            } else {
                showFloatingText('+' + goldEarned + ' 🪙', '#facc15', $('gold-counter'));
                const xpT = setTimeout(() => {
                    floatTimers.delete(xpT);
                    showFloatingText('+20 🔮', '#a855f7', $('xp-counter'));
                }, 300);
                floatTimers.add(xpT);
            }

            if (!inSelfTest && window.confetti) {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#22c55e', '#a855f7', '#facc15'],
                    disableForReducedMotion: true
                });
            }
        }

        const stepEmoji = levelMistakes >= 2
            ? '🟥'
            : ((levelMistakes === 0 && hintsUsed === 0 && !dailyStepHadNearMiss && !duelStepHadNearMiss) ? '🟩' : '🟨');

        if (dailySeedActive && dailyGauntletData) {
            dailyStepResults[dailySeedStep] = {
                step: dailySeedStep + 1,
                floorIdx: solvedFloorIdx,
                id: item ? item.id : '',
                cefr: levels[solvedFloorIdx].cefr,
                title: levels[solvedFloorIdx].title,
                sentence: L.formatSentence(solvedOrder),
                explain: item.explain,
                emoji: stepEmoji,
                mistakes: levelMistakes,
                hints: hintsUsed
            };
        }
        if (bossRushActive) {
            bossRushResults[bossRushStep] = {
                step: bossRushStep + 1,
                floorIdx: solvedFloorIdx,
                id: item ? item.id : '',
                cefr: levels[solvedFloorIdx].cefr,
                title: levels[solvedFloorIdx].title,
                sentence: L.formatSentence(solvedOrder),
                explain: item.explain,
                emoji: stepEmoji,
                mistakes: levelMistakes,
                hints: hintsUsed
            };
        }
        if (duelActive && duelData) {
            duelStepResults[duelStep] = {
                step: duelStep + 1,
                floorIdx: solvedFloorIdx,
                id: item ? item.id : '',
                cefr: levels[solvedFloorIdx].cefr,
                title: levels[solvedFloorIdx].title,
                sentence: L.formatSentence(solvedOrder),
                explain: item.explain,
                emoji: stepEmoji,
                mistakes: levelMistakes,
                hints: hintsUsed
            };
        }

        const isBossRushFinal = bossRushActive && bossRushStep >= BOSS_FLOORS.length - 1;
        const isDailyFinal = dailySeedActive && dailyGauntletData && dailySeedStep >= dailyGauntletData.steps.length - 1;
        const isDuelFinal = duelActive && duelData && duelStep >= duelData.steps.length - 1;

        if (isDailyFinal) {
            const seed = dailyGauntletData.seed;
            const grid = dailyStepResults.map(s => s ? s.emoji : '🟩').join('');
            const cleanCount = dailyStepResults.filter(s => s && s.emoji === '🟩').length;
            const firstDailyToday = state.lastDailyDate !== seed;
            if (firstDailyToday) {
                state.dailyStreak = state.lastDailyDate === previousDaySeed(seed)
                    ? (state.dailyStreak || 0) + 1
                    : 1;
                state.lastDailyDate = seed;
                state.gold += 100;
                setStatus(`🎲 Daily Crypt Seed (${seed}) Conquered! All 5 C1/C2 Runes Mastered! (+100 🪙)`, 'success');
            } else {
                setStatus(`🎲 Daily Crypt Seed (${seed}) Complete! (Today's +100 🪙 bonus already claimed)`, 'success');
            }
            state.lastDailyGrid = grid;
            pendingRecapMode = 'daily';
            trackCryptEvent('crypt_mode_completed', { tool: 'daily_seed', score: cleanCount, grid });
        } else if (isBossRushFinal) {
            const cleanCount = bossRushResults.filter(s => s && s.emoji === '🟩').length;
            state.gold += 100;
            setStatus('🏆 5-Boss Rush Conquered! All 5 Crypt Guardians Defeated! (+100 🪙)', 'success');
            pendingRecapMode = 'boss';
            trackCryptEvent('crypt_mode_completed', { tool: 'boss_rush', score: cleanCount });
        } else if (isDuelFinal) {
            const cleanCount = duelStepResults.filter(s => s && s.emoji === '🟩').length;
            const finalSec = getDuelActiveSec();
            const total = duelData.steps.length;
            setStatus(`⚔️ Duel Complete! ${cleanCount}/${total} Clean in ${formatDuration(finalSec)}.`, 'success');
            pendingRecapMode = 'duel';
            trackCryptEvent('crypt_mode_completed', { tool: 'duel_link', score: cleanCount, sec: finalSec });
        } else {
            pendingRecapMode = (isLast && !dailySeedActive && !bossRushActive && !duelActive) ? 'campaign' : null;
            setStatus(isLast ? 'The Crypt is Conquered!' : (firstClear ? 'The incantation is complete!' : 'The incantation is complete! (Rewards already claimed)'), 'success');
        }

        if (tipEl) tipEl.textContent = '✔ "' + L.formatSentence(solvedOrder) + '" ' + item.explain;
        sfx('success', state.streak);

        trackCryptEvent('crypt_floor_solved', {
            tool: `act_${Math.floor(solvedFloorIdx / 5) + 1}`,
            floor: solvedFloorIdx + 1,
            cefr: levels[solvedFloorIdx].cefr,
            stars
        });

        // Reveal Belfast Desk Syntax Autopsy Card post-solve
        if (autopsyCard && !inSelfTest) {
            autopsyCard.classList.remove('hidden');
            if (blueprintBtn) {
                blueprintBtn.setAttribute('aria-expanded', 'true');
                blueprintBtn.textContent = '🙈 Hide Structural Blueprint';
            }
            updateAutopsyCard(solvedFloorIdx, item, solvedOrder, true);
        }

        nextBtn.disabled = false;
        if (dailySeedActive && !isDailyFinal) {
            nextBtn.textContent = `Next Seed (${dailySeedStep + 2}/${dailyGauntletData.steps.length}) ➔`;
        } else if (isDailyFinal) {
            nextBtn.textContent = 'Finish Daily Seed ✔';
        } else if (duelActive && !isDuelFinal) {
            nextBtn.textContent = `Next Rune (${duelStep + 2}/${duelData.steps.length}) ➔`;
        } else if (isDuelFinal) {
            nextBtn.textContent = 'Finish Duel ⚔️';
        } else if (bossRushActive && !isBossRushFinal) {
            nextBtn.textContent = `Next Boss (${bossRushStep + 2}/${BOSS_FLOORS.length}) ➔`;
        } else if (isBossRushFinal) {
            nextBtn.textContent = 'Finish Boss Rush 🏆';
        } else if (isLast) {
            nextBtn.textContent = 'Finish Crypt 🏆';
        } else {
            nextBtn.textContent = 'Next Floor ➔';
        }

        if (firstClear) {
            const loot = rollLoot();
            state.inventory.push(loot.name);
            announceLoot(loot);
            checkMilestone(solvedFloorIdx);
            updateInventoryUI();
        }

        if (!bossRushActive && !dailySeedActive && !duelActive) {
            state.level = isLast ? state.level : state.level + 1;
        }
        saveState();
        refreshHud();
        if (floorDrawer && !floorDrawer.classList.contains('hidden')) renderFloorDrawer();
    }

    /* ---------------- LOOT & RELICS ---------------- */

    function rollLoot() {
        const total = lootTable.reduce((sum, l) => sum + l.chance, 0);
        let roll = Math.random() * total;
        for (const entry of lootTable) {
            roll -= entry.chance;
            if (roll < 0) return entry;
        }
        return lootTable[0];
    }

    function announceLoot(lootItem) {
        if (inSelfTest) return;
        const popup = $('loot-announcement');
        if (!popup) return;
        popup.textContent = '';
        const wrap = document.createElement('span');
        wrap.append('Uncovered: ');
        const name = document.createElement('span');
        name.style.color = lootItem.color;
        name.textContent = lootItem.name;
        wrap.append(name, '!');
        popup.appendChild(wrap);

        if (lootTimer) clearTimeout(lootTimer);
        lootTimer = setTimeout(() => {
            sfx('loot');
            popup.classList.add('show');
            lootTimer = setTimeout(() => {
                popup.classList.remove('show');
                lootTimer = null;
            }, 2200);
        }, 600);
    }

    function updateInventoryUI() {
        const list = $('inventory-list');
        if (!list) return;
        list.textContent = '';
        const relics = Array.isArray(state.relics) ? state.relics : [];
        const inventory = Array.isArray(state.inventory) ? state.inventory : [];

        if (relics.length === 0 && inventory.length === 0) {
            const note = document.createElement('p');
            note.className = 'empty-note';
            note.textContent = 'No relics yet. Solve a floor to uncover one.';
            list.appendChild(note);
            return;
        }

        const milestoneList = Object.values(milestonePrizes || {});
        relics.slice().reverse().forEach((relicName) => {
            const prize = milestoneList.find(m => m.name === relicName);
            const row = document.createElement('div');
            row.className = 'loot-item boss-relic';
            const icon = document.createElement('span');
            icon.className = 'loot-icon relic-emoji-icon';
            icon.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;font-size:20px;background:#1e1b4b;';
            icon.textContent = prize ? prize.emoji : '🏆';
            icon.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.textContent = relicName;
            const rarity = document.createElement('span');
            rarity.className = 'loot-rarity';
            rarity.textContent = 'Boss Relic';
            text.appendChild(rarity);
            row.append(icon, text);
            list.appendChild(row);
        });

        inventory.slice().reverse().forEach((itemName) => {
            const entry = lootTable.find(l => l.name === itemName);
            if (!entry) return;
            const row = document.createElement('div');
            row.className = 'loot-item';
            const icon = document.createElement('span');
            icon.className = 'loot-icon';
            icon.style.backgroundColor = entry.color;
            icon.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.textContent = entry.name;
            const rarity = document.createElement('span');
            rarity.className = 'loot-rarity';
            rarity.textContent = entry.rarity;
            text.appendChild(rarity);
            row.append(icon, text);
            list.appendChild(row);
        });
    }

    /* ---------------- MILESTONES ---------------- */

    function checkMilestone(solvedFloorIdx) {
        if (inSelfTest) return;
        const prize = milestonePrizes[solvedFloorIdx];
        if (!prize) return;
        if (!Array.isArray(state.relics)) state.relics = [];
        if (!state.relics.includes(prize.name)) {
            state.relics.push(prize.name);
        }
        $('prize-emoji').textContent = prize.emoji;
        $('prize-name').textContent = prize.name;
        $('prize-description').textContent = prize.desc;
        if (milestoneTimer) clearTimeout(milestoneTimer);
        milestoneTimer = setTimeout(() => {
            milestoneTimer = null;
            modalReturnFocus = document.activeElement;
            modal.classList.add('open');
            $('claim-btn').focus();
            sfx('epic');
        }, 1200);
    }

    function closePrizeModal() {
        modal.classList.remove('open');
        if (modalReturnFocus && document.contains(modalReturnFocus)) modalReturnFocus.focus();
    }

    /* ---------------- UNIFIED RECAP MODAL ---------------- */

    function computeDuelVerdict(playerClean, playerSec, challengerClean, challengerSec, challengerBy, totalSteps) {
        if (!(challengerSec > 0)) return null;
        const who = challengerBy || 'Challenger';
        const total = totalSteps || 5;
        if (playerClean > challengerClean) {
            return {
                outcome: 'victory',
                label: 'Victory',
                text: `🏆 Victory! You beat ${who}'s ${challengerClean}/${total} Clean (${formatDuration(challengerSec)}) with ${playerClean}/${total} Clean in ${formatDuration(playerSec)}.`
            };
        }
        if (playerClean < challengerClean) {
            return {
                outcome: 'defeat',
                label: 'Narrow Defeat',
                text: `⚔️ Narrow Defeat — ${who} scored ${challengerClean}/${total} Clean (${formatDuration(challengerSec)}) vs your ${playerClean}/${total} Clean (${formatDuration(playerSec)}).`
            };
        }
        if (playerSec < challengerSec) {
            return {
                outcome: 'victory',
                label: 'Victory',
                text: `🏆 Victory! Tied at ${playerClean}/${total} Clean, and you beat ${who} on time (${formatDuration(playerSec)} vs ${formatDuration(challengerSec)}).`
            };
        }
        if (playerSec > challengerSec) {
            return {
                outcome: 'defeat',
                label: 'Narrow Defeat',
                text: `⚔️ Narrow Defeat — Tied at ${playerClean}/${total} Clean, ${who} finished faster (${formatDuration(challengerSec)} vs ${formatDuration(playerSec)}).`
            };
        }
        return {
            outcome: 'tie',
            label: 'Tie',
            text: `🤝 Tie! Level pegging with ${who} at ${playerClean}/${total} Clean in ${formatDuration(playerSec)}.`
        };
    }

    function getRecapStats(mode) {
        if (mode === 'daily') {
            const steps = dailyStepResults.filter(Boolean);
            const cleanCount = steps.filter(s => s.emoji === '🟩').length;
            const activeMs = getDuelActiveMs();
            const duelSec = Math.min(3600, Math.max(activeMs > 0 ? 1 : 0, Math.round(activeMs / 1000)));
            return {
                score: cleanCount,
                maxScore: 5,
                grid: steps.map(s => s.emoji).join(''),
                steps,
                ids: steps.map(s => s.id).filter(Boolean),
                duelSec,
                seed: (dailyGauntletData && dailyGauntletData.seed) || state.lastDailyDate || L.getTodaySeed?.() || ''
            };
        }
        if (mode === 'boss') {
            const steps = bossRushResults.filter(Boolean);
            const cleanCount = steps.filter(s => s.emoji === '🟩').length;
            const activeMs = getDuelActiveMs();
            const duelSec = Math.min(3600, Math.max(activeMs > 0 ? 1 : 0, Math.round(activeMs / 1000)));
            return {
                score: cleanCount,
                maxScore: BOSS_FLOORS.length,
                steps,
                ids: steps.map(s => s.id).filter(Boolean),
                duelSec
            };
        }
        if (mode === 'duel') {
            const steps = duelStepResults.filter(Boolean);
            const cleanCount = steps.filter(s => s.emoji === '🟩').length;
            const total = (duelData && duelData.steps && duelData.steps.length) || steps.length || 5;
            const sec = getDuelActiveSec();
            const ids = (duelData && duelData.ids) ? duelData.ids.slice() : steps.map(s => s.id).filter(Boolean);
            const challengerClean = duelData ? duelData.clean : 0;
            const challengerSec = duelData ? duelData.sec : 0;
            const challengerBy = duelData ? duelData.by : '';
            const verdict = computeDuelVerdict(cleanCount, sec, challengerClean, challengerSec, challengerBy, total);
            return {
                score: cleanCount,
                maxScore: total,
                sec,
                timeText: formatDuration(sec),
                grid: steps.map(s => s.emoji).join(''),
                steps,
                ids,
                challengerClean,
                challengerSec,
                challengerBy,
                verdict
            };
        }
        const totalItems = L.totalItems || levels.reduce((sum, fl) => sum + fl.pool.length, 0);
        const cleared = state.completed.length;
        const cleanScore = Math.min(levels.length, state.perfect || cleared);
        return { score: cleanScore, maxScore: levels.length, cleared, totalItems, steps: [] };
    }

    function buildRecapStepRow(badgeText, sentence, explain) {
        const row = document.createElement('div');
        row.className = 'recap-step-row';
        const badge = document.createElement('span');
        badge.className = 'recap-step-badge';
        badge.style.flex = 'none';
        badge.textContent = badgeText;
        const body = document.createElement('div');
        body.style.cssText = 'display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;';
        const sent = document.createElement('strong');
        sent.className = 'recap-step-sentence';
        sent.textContent = sentence;
        const note = document.createElement('span');
        note.className = 'recap-step-note';
        note.style.cssText = 'color:#cbd5e1;font-size:12px;font-weight:500;';
        note.textContent = explain;
        body.append(sent, note);
        row.append(badge, body);
        return row;
    }

    function openRecapModal(mode) {
        if (!recapModal) return;
        activeRecapMode = mode;
        recapReturnFocus = document.activeElement;

        const heading = $('recap-heading');
        const summary = $('recap-summary');
        const verdictEl = $('recap-verdict');
        const listEl = $('recap-step-list');
        const copyBtn = $('btn-copy-daily');
        const copyDuelBtn = $('btn-copy-duel');
        const stats = getRecapStats(mode);

        if (listEl) listEl.textContent = '';
        if (verdictEl) {
            verdictEl.className = 'recap-verdict hidden';
            verdictEl.textContent = '';
        }
        pendingDuelShareSpec = null;
        if (copyDuelBtn) {
            copyDuelBtn.classList.add('hidden');
            copyDuelBtn.removeAttribute('data-duel-url');
        }

        if (mode === 'daily') {
            if (heading) heading.textContent = `🎲 Daily Crypt Seed (${stats.seed})`;
            if (summary) summary.textContent = `${stats.score}/5 Clean · ${stats.grid} · Daily Streak: 🔥 ${state.dailyStreak || 1}`;
            if (copyBtn) {
                copyBtn.classList.remove('hidden');
                copyBtn.textContent = '📋 Copy Daily Result';
            }
            if (copyDuelBtn && stats.ids.length >= 3 && stats.ids.length <= 5 && typeof L.encodeDuel === 'function') {
                pendingDuelShareSpec = { ids: stats.ids, clean: stats.score, sec: stats.duelSec, by: state.playerName || '' };
                pendingDuelShareLabel = '⚔️ Challenge a Friend on These 5 Runes';
                const tok = L.encodeDuel(pendingDuelShareSpec);
                if (tok) copyDuelBtn.dataset.duelUrl = buildDuelShareUrl(tok);
                copyDuelBtn.textContent = pendingDuelShareLabel;
                copyDuelBtn.classList.remove('hidden');
            }
            stats.steps.forEach((st) => {
                if (listEl) listEl.appendChild(buildRecapStepRow(`${st.emoji} ${st.cefr} · F${st.floorIdx + 1}`, st.sentence, st.explain));
            });
        } else if (mode === 'boss') {
            if (heading) heading.textContent = '🏆 5-Boss Rush Complete!';
            if (summary) summary.textContent = `All 5 Crypt Guardians defeated · ${stats.score}/5 Clean · Gold: 🪙 ${state.gold}`;
            if (copyBtn) copyBtn.classList.add('hidden');
            if (copyDuelBtn && stats.ids.length >= 3 && stats.ids.length <= 5 && typeof L.encodeDuel === 'function') {
                pendingDuelShareSpec = { ids: stats.ids, clean: stats.score, sec: stats.duelSec, by: state.playerName || '' };
                pendingDuelShareLabel = '⚔️ Challenge a Friend on These 5 Runes';
                const tok = L.encodeDuel(pendingDuelShareSpec);
                if (tok) copyDuelBtn.dataset.duelUrl = buildDuelShareUrl(tok);
                copyDuelBtn.textContent = pendingDuelShareLabel;
                copyDuelBtn.classList.remove('hidden');
            }
            stats.steps.forEach((st) => {
                if (listEl) listEl.appendChild(buildRecapStepRow(`${st.emoji} Boss F${st.floorIdx + 1} (${st.cefr})`, st.sentence, st.explain));
            });
        } else if (mode === 'duel') {
            if (heading) heading.textContent = `⚔️ ${stats.maxScore}-Rune Duel Complete!`;
            if (summary) summary.textContent = `${stats.score}/${stats.maxScore} Clean · ${stats.timeText} · ${stats.grid}`;
            if (copyBtn) copyBtn.classList.add('hidden');
            if (verdictEl) {
                verdictEl.classList.remove('hidden');
                if (stats.verdict) {
                    verdictEl.classList.add(stats.verdict.outcome);
                    verdictEl.textContent = stats.verdict.text;
                } else {
                    verdictEl.classList.add('benchmark');
                    verdictEl.textContent = `⚔️ Benchmark set: ${stats.score}/${stats.maxScore} Clean in ${stats.timeText} — copy your link below to challenge someone!`;
                }
            }
            if (copyDuelBtn && stats.ids.length >= 3 && stats.ids.length <= 5 && typeof L.encodeDuel === 'function') {
                pendingDuelShareSpec = { ids: stats.ids, clean: stats.score, sec: stats.sec, by: state.playerName || '' };
                pendingDuelShareLabel = '⚔️ Copy Counter-Duel Link';
                const tok = L.encodeDuel(pendingDuelShareSpec);
                if (tok) copyDuelBtn.dataset.duelUrl = buildDuelShareUrl(tok);
                copyDuelBtn.textContent = pendingDuelShareLabel;
                copyDuelBtn.classList.remove('hidden');
            }
            stats.steps.forEach((st) => {
                if (listEl) listEl.appendChild(buildRecapStepRow(`${st.emoji} ${st.cefr} · F${st.floorIdx + 1}`, st.sentence, st.explain));
            });
        } else {
            if (heading) heading.textContent = '👑 Crypt Floor 25 Conquered!';
            if (summary) summary.textContent = `Floors cleared: ${stats.cleared}/${levels.length} · Challenges solved: ${(state.solvedIds || []).length}/${stats.totalItems} · Flawless clears: ${state.perfect}`;
            if (copyBtn) copyBtn.classList.add('hidden');
            if (item && listEl) {
                listEl.appendChild(buildRecapStepRow(`👑 Final Floor 25 (${levels[lastLevel].cefr})`, L.formatSentence(item.answers[0]), item.explain));
            }
        }

        recapModal.classList.add('open');
        const firstFocus = (copyBtn && !copyBtn.classList.contains('hidden'))
            ? copyBtn
            : ((copyDuelBtn && !copyDuelBtn.classList.contains('hidden'))
                ? copyDuelBtn
                : ($('btn-open-diagnostic') || $('btn-close-recap')));
        if (firstFocus) firstFocus.focus();
    }

    function closeRecapModal(restoreFocusAndMode = true) {
        if (!recapModal) return;
        const closedMode = activeRecapMode;
        recapModal.classList.remove('open');
        activeRecapMode = null;

        if (restoreFocusAndMode) {
            if (closedMode === 'daily' || closedMode === 'boss' || closedMode === 'duel') {
                exitSpecialModeAndRestoreCampaign();
            }
            if (recapReturnFocus && document.contains(recapReturnFocus)) {
                try { recapReturnFocus.focus(); } catch (_) {}
            }
        }
    }

    function copyDuelChallengeLink() {
        if (!pendingDuelShareSpec || typeof L.encodeDuel !== 'function') return;
        const spec = { ...pendingDuelShareSpec, by: state.playerName || pendingDuelShareSpec.by || '' };
        const token = L.encodeDuel(spec);
        if (!token) return;
        const url = buildDuelShareUrl(token);
        const copyDuelBtn = $('btn-copy-duel');
        const restoreLabel = pendingDuelShareLabel || '⚔️ Copy Counter-Duel Link';
        if (copyDuelBtn) copyDuelBtn.dataset.duelUrl = url;
        const markCopied = () => {
            if (copyDuelBtn) {
                copyDuelBtn.textContent = '✓ Duel Link Copied!';
                setTimeout(() => {
                    if (copyDuelBtn) copyDuelBtn.textContent = restoreLabel;
                }, 2200);
            }
            trackCryptEvent('crypt_duel_shared', { tool: activeRecapMode || 'duel', clean: spec.clean, sec: spec.sec });
            sfx('loot');
        };
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(url).then(markCopied).catch(() => fallbackCopyText(url, markCopied));
        } else {
            fallbackCopyText(url, markCopied);
        }
    }

    function copyDailyResult() {
        const stats = getRecapStats('daily');
        const streakVal = state.dailyStreak || 1;
        const shareText = `Grammar Crypt · ${stats.seed} · ${stats.score}/5 Clean\n${stats.grid || '🟩🟩🟩🟩🟩'} 🔥 Streak: ${streakVal}\n${DAILY_SHARE_URL}`;
        const copyBtn = $('btn-copy-daily');
        const markCopied = () => {
            if (copyBtn) {
                copyBtn.textContent = '✓ Copied! Paste in chat';
                setTimeout(() => {
                    if (copyBtn) copyBtn.textContent = '📋 Copy Daily Result';
                }, 2200);
            }
            trackCryptEvent('crypt_daily_shared', { tool: 'daily_seed', seed: stats.seed });
            sfx('loot');
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            navigator.clipboard.writeText(shareText).then(markCopied).catch(() => fallbackCopyText(shareText, markCopied));
        } else {
            fallbackCopyText(shareText, markCopied);
        }
    }

    function fallbackCopyText(text, onDone) {
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

    function openDiagnosticFromRecap() {
        const mode = activeRecapMode || 'campaign';
        const stats = getRecapStats(mode);
        closeRecapModal(false);

        if (mode === 'daily' || mode === 'boss' || mode === 'duel') {
            exitSpecialModeAndRestoreCampaign();
            stopBossVoice();
        }

        if (location.protocol.startsWith('http') && typeof window.showDiagnosticGate === 'function') {
            window.showDiagnosticGate({
                gameName: mode === 'daily'
                    ? 'Grammar Crypt (Daily Seed)'
                    : (mode === 'boss'
                        ? 'Grammar Crypt (Boss Rush)'
                        : (mode === 'duel' ? 'Grammar Crypt (5-Rune Duel)' : 'Grammar Crypt')),
                score: stats.score,
                maxScore: stats.maxScore,
                category: 'inversion',
                weakArea: 'C1/C2 Inverted Syntax & Question Word Order',
                examImpact: 'In Cambridge C1/C2 Use of English and IELTS Writing Task 2, word-order and inversion slips cost marks in the top grammatical bands.',
                onReplay: () => {
                    if (mode === 'daily') startDailySeed(false);
                    else if (mode === 'boss') startBossRush(false);
                    else if (mode === 'duel' && duelLastSpec) startDuel(duelLastSpec, false);
                    else jumpToFloor(0);
                }
            });
        } else {
            window.location.href = 'index.html?offer=live_diagnostic_35#cal-booking-box';
        }
    }

    /* ---------------- NAVIGATION ---------------- */

    function resetBoard() {
        if (locked) return;
        initLevel(true);
    }

    function nextLevel() {
        if (!locked) return;
        clearTransientTimers();
        if (pendingRecapMode) {
            openRecapModal(pendingRecapMode);
            return;
        }
        if (dailySeedActive && dailyGauntletData) {
            if (dailySeedStep < dailyGauntletData.steps.length - 1) {
                dailySeedStep++;
                const nextStep = dailyGauntletData.steps[dailySeedStep];
                state.level = nextStep.floorIdx;
                item = nextStep.item;
                saveState();
                initLevel(true);
                return;
            }
            openRecapModal('daily');
            return;
        }
        if (duelActive && duelData) {
            if (duelStep < duelData.steps.length - 1) {
                duelStep++;
                const nextStep = duelData.steps[duelStep];
                state.level = nextStep.floorIdx;
                item = nextStep.item;
                saveState();
                initLevel(true);
                return;
            }
            openRecapModal('duel');
            return;
        }
        if (bossRushActive) {
            if (bossRushStep < BOSS_FLOORS.length - 1) {
                bossRushStep++;
                state.level = BOSS_FLOORS[bossRushStep];
                item = null;
                saveState();
                initLevel();
                return;
            }
            openRecapModal('boss');
            return;
        }
        initLevel();
    }

    /* ---------------- GOLD SHIELD PURCHASE ---------------- */

    function buyStreakShield() {
        const shields = state.streakShields || 0;
        if (shields >= 3) {
            setStatus('Streak Shields are already at the maximum (3/3).', '');
            return;
        }
        if (state.gold < 50) {
            setStatus('You need 50 🪙 to forge a Streak Shield.', 'error');
            return;
        }
        state.gold -= 50;
        state.streakShields = shields + 1;
        saveState();
        refreshHud();
        sfx('loot');
        setStatus(`🛡️ Streak Shield forged! (${state.streakShields}/3 active)`, 'success');
    }

    /* ---------------- URL DEEP-LINK ROUTER ---------------- */

    function applyUrlRoute() {
        const params = new URLSearchParams(location.search);
        if (params.get('success') === 'true') {
            state.leadSent = true;
            saveState();
            history.replaceState(null, '', location.pathname);
        }

        if (params.has('duel')) {
            const duelSpec = typeof L.decodeDuel === 'function' ? L.decodeDuel(params.get('duel')) : null;
            if (duelSpec && startDuel(duelSpec, true)) {
                trackCryptEvent('crypt_entry', { entry: 'duel', tier: 'c1', tool: 'duel_link' });
                return true;
            }
            deferredBootStatus = {
                text: 'That duel link could not be read — loaded your current floor instead.',
                kind: 'error'
            };
        }

        const mode = (params.get('mode') || '').toLowerCase();
        if (mode === 'daily') {
            startDailySeed(true);
            trackCryptEvent('crypt_entry', { entry: 'daily', tier: 'c1', tool: 'daily_seed' });
            return true;
        }
        if (mode === 'boss') {
            startBossRush(true);
            trackCryptEvent('crypt_entry', { entry: 'boss', tier: 'c1', tool: 'boss_rush' });
            return true;
        }

        if (params.get('forge') === '1') {
            deferredForgeOpen = true;
        }

        let targetFloor = null;
        let entryLabel = 'direct';
        if (params.has('floor')) {
            const f = parseInt(params.get('floor'), 10);
            if (!Number.isNaN(f) && f >= 1 && f <= levels.length) {
                targetFloor = f - 1;
                entryLabel = `floor_${f}`;
            }
        } else if (params.has('act')) {
            const a = parseInt(params.get('act'), 10);
            if (Object.prototype.hasOwnProperty.call(ACT_START_FLOORS, a)) {
                targetFloor = ACT_START_FLOORS[a];
                entryLabel = `act_${a}`;
            }
        } else if (params.has('tier')) {
            const t = (params.get('tier') || '').toLowerCase();
            if (Object.prototype.hasOwnProperty.call(TIER_START_FLOORS, t)) {
                targetFloor = TIER_START_FLOORS[t];
                entryLabel = `tier_${t}`;
            }
        }

        if (targetFloor !== null) {
            state.level = targetFloor;
            saveState();
        }
        trackCryptEvent('crypt_entry', {
            entry: entryLabel,
            tier: tierForFloor(state.level),
            tool: `floor_${state.level + 1}`
        });
        return false;
    }

    /* ---------------- ?selftest=1 (2D) ---------------- */

    function runSelfTest() {
        const out = document.createElement('pre');
        out.id = 'selftest';
        const res = L.dataTests();
        let pass = res.pass;
        const lines = ['GRAMMAR CRYPT 2D SELFTEST'].concat(res.lines);
        const saved = JSON.stringify(state);
        const savedCampaign = campaignLevel;
        const lsSnapshotBeforeSelfTest = (() => { try { return localStorage.getItem(L.store.KEY); } catch (_) { return null; } })();
        let testedItems = 0;

        inSelfTest = true;
        clearTransientTimers();

        try {
            levels.forEach((fl, f) => {
                fl.pool.forEach((poolItem) => {
                    testedItems++;
                    state.level = f;
                    item = poolItem;
                    initLevel(true);

                    if (zones().length !== poolItem.tokens.length) {
                        pass = false;
                        lines.push(`FAIL ${poolItem.id} (floor ${f + 1}): ${zones().length} zones for ${poolItem.tokens.length} tokens`);
                    }

                    const target = poolItem.answers[poolItem.answers.length - 1];
                    const blocks = Array.from(bank.querySelectorAll('.block'));
                    zones().forEach((z, i) => {
                        const b = blocks.find(x => x.dataset.text === target[i] && !x.closest('.drop-zone'));
                        if (b) z.appendChild(b);
                    });
                    validateBoard();
                    if (!locked) {
                        pass = false;
                        lines.push(`FAIL ${poolItem.id} (floor ${f + 1}): alt answer not accepted by the 2D board`);
                    }
                    if (typeof L.autopsy === 'function') {
                        const au = L.autopsy(f, poolItem, target);
                        if (!au || !au.modelSentence || !au.posChain) {
                            pass = false;
                            lines.push(`FAIL ${poolItem.id}: autopsy() incomplete`);
                        }
                    }
                });
            });

            // Verify dynamic 1-0 keycaps on a >10 rune sentence, Undo, and non-spoiler useHint
            const longFloorIdx = levels.findIndex(fl => fl.pool.some(p => (p.tokens.length + p.decoys.length) > 10));
            if (longFloorIdx >= 0) {
                const longItem = levels[longFloorIdx].pool.find(p => (p.tokens.length + p.decoys.length) > 10);
                state.level = longFloorIdx;
                item = longItem;
                initLevel(true);
                const keyedBefore = bank.querySelectorAll('.block[data-key]').length;
                if (keyedBefore !== 10) {
                    pass = false;
                    lines.push(`FAIL dynamic keycaps: expected 10 keyed bank runes on ${longItem.id}, got ${keyedBefore}`);
                }
                const firstBankBlock = bank.querySelector('.block');
                if (firstBankBlock) activateBlock(firstBankBlock);
                const keyedAfterPlace = bank.querySelectorAll('.block[data-key]').length;
                if (keyedAfterPlace !== Math.min(10, bank.querySelectorAll('.block').length)) {
                    pass = false;
                    lines.push(`FAIL dynamic keycaps after move: got ${keyedAfterPlace}`);
                }
                if (!undoLastRune()) {
                    pass = false;
                    lines.push('FAIL undoLastRune() did not return placed rune to bank');
                }
            }

            state.level = 1;
            item = levels[1].pool[0];
            initLevel(true);
            useHint();
            if (tipEl && item.explain && tipEl.textContent.includes(item.explain)) {
                pass = false;
                lines.push('FAIL useHint() leaked item.explain pre-solve');
            }

            // Verify Enter on last rune does NOT skip win state / Autopsy Card
            state.level = 0;
            item = levels[0].pool[0];
            initLevel(true);
            const ans0 = item.answers[0];
            for (let i = 0; i < ans0.length - 1; i++) {
                const b = Array.from(bank.querySelectorAll('.block')).find(x => x.dataset.text === ans0[i]);
                if (b) zones()[i].appendChild(b);
            }
            refreshZones();
            const lastB = Array.from(bank.querySelectorAll('.block')).find(x => x.dataset.text === ans0[ans0.length - 1]);
            if (lastB) {
                const titleBeforeEnter = $('quest-title') ? $('quest-title').textContent : '';
                lastB.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
                if (!locked || ($('quest-title') && $('quest-title').textContent !== titleBeforeEnter)) {
                    pass = false;
                    lines.push('FAIL Enter key on last rune skipped solved state');
                }
            }

            lines.push(`(2D) validated all ${testedItems}/${L.totalItems || testedItems} items across 25 floors + dynamic keys + undo + Enter lock`);

            // Verify Zero-Backend ?duel= Mode: startDuel, timer pause on solveLevel(), recap stats/verdict, campaignLevel restoration, localStorage isolation
            const lsBeforeDuel = (() => { try { return localStorage.getItem(L.store.KEY); } catch (_) { return null; } })();
            state.level = 3;
            campaignLevel = null;
            const duelToken = L.encodeDuel({ ids: ['f11a', 'f14b', 'f17f', 'f21g', 'f25a'], clean: 4, sec: 45, by: 'Igor' });
            const duelSpec = L.decodeDuel(duelToken);
            if (!duelSpec || !startDuel(duelSpec, true)) {
                pass = false;
                lines.push('FAIL duel self-test: startDuel(duelSpec, true) did not activate');
            } else {
                if (!duelActive || campaignLevel !== 3 || state.level !== duelSpec.steps[0].floorIdx || duelTurnStartedAt === null) {
                    pass = false;
                    lines.push('FAIL duel self-test: initial state/campaignLevel/timer check failed');
                }
                const bannerText = $('duel-target-banner') ? $('duel-target-banner').textContent : '';
                if (!bannerText.includes('Igor') || !bannerText.includes('4/5') || !bannerText.includes('0:45')) {
                    pass = false;
                    lines.push('FAIL duel self-test: target banner missing challenger info: ' + bannerText);
                }

                for (let si = 0; si < duelSpec.steps.length; si++) {
                    const stepItem = duelSpec.steps[si].item;
                    if (si === 0) duelTurnStartedAt = Date.now() - 5000;
                    else duelTurnStartedAt = Date.now() - 2000;
                    const targetAns = stepItem.answers[0];
                    const stepBlocks = Array.from(bank.querySelectorAll('.block'));
                    zones().forEach((z, zi) => {
                        const b = stepBlocks.find(x => x.dataset.text === targetAns[zi] && !x.closest('.drop-zone'));
                        if (b) z.appendChild(b);
                    });
                    validateBoard();
                    if (!locked || duelTurnStartedAt !== null) {
                        pass = false;
                        lines.push(`FAIL duel self-test: step ${si + 1} did not pause timer immediately on solveLevel()`);
                    }
                    if (si === 0) {
                        const pausedElapsed = duelElapsedMs;
                        if (pausedElapsed < 4800 || getDuelActiveMs() !== pausedElapsed) {
                            pass = false;
                            lines.push('FAIL duel self-test: solve timer did not accumulate or stay paused during autopsy');
                        }
                    }
                    if (si < duelSpec.steps.length - 1) {
                        nextLevel();
                        if (locked || duelStep !== si + 1 || duelTurnStartedAt === null) {
                            pass = false;
                            lines.push(`FAIL duel self-test: nextLevel() did not advance/resume timer for step ${si + 2}`);
                        }
                    }
                }

                if (pendingRecapMode !== 'duel' || nextBtn.textContent !== 'Finish Duel ⚔️') {
                    pass = false;
                    lines.push('FAIL duel self-test: final step pendingRecapMode or button label wrong: ' + nextBtn.textContent);
                }
                nextLevel(); // opens recap modal in 'duel' mode
                const dStats = getRecapStats('duel');
                const verdictText = $('recap-verdict') ? $('recap-verdict').textContent : '';
                const copyDuelBtnEl = $('btn-copy-duel');
                const counterTok = copyDuelBtnEl && copyDuelBtnEl.dataset.duelUrl
                    ? (new URL(copyDuelBtnEl.dataset.duelUrl)).searchParams.get('duel')
                    : '';
                const counterDec = counterTok ? L.decodeDuel(counterTok) : null;
                if (!recapModal.classList.contains('open') || dStats.score !== 5 || dStats.maxScore !== 5 ||
                    !dStats.verdict || dStats.verdict.outcome !== 'victory' ||
                    !verdictText.includes('Victory') || !copyDuelBtnEl || copyDuelBtnEl.classList.contains('hidden') ||
                    !counterDec || counterDec.clean !== 5 || counterDec.ids.join(',') !== duelSpec.ids.join(',')) {
                    pass = false;
                    lines.push('FAIL duel self-test: duel recap modal stats/verdict/counter-link check failed');
                }
                const vTie = computeDuelVerdict(4, 45, 4, 45, 'Igor', 5);
                const vLossClean = computeDuelVerdict(3, 20, 4, 45, 'Igor', 5);
                const vLossSec = computeDuelVerdict(4, 55, 4, 45, 'Igor', 5);
                const vWinSec = computeDuelVerdict(4, 30, 4, 45, 'Igor', 5);
                if (!vTie || vTie.outcome !== 'tie' || !vLossClean || vLossClean.outcome !== 'defeat' ||
                    !vLossSec || vLossSec.outcome !== 'defeat' || !vWinSec || vWinSec.outcome !== 'victory') {
                    pass = false;
                    lines.push('FAIL duel self-test: computeDuelVerdict tie-break cases failed');
                }

                closeRecapModal(true);
                if (duelActive || campaignLevel !== null || state.level !== 3 || duelTimerInterval !== null || duelTurnStartedAt !== null) {
                    pass = false;
                    lines.push('FAIL duel self-test: closeRecapModal(true) did not restore campaignLevel or clear timer');
                }
            }
            const lsAfterDuel = (() => { try { return localStorage.getItem(L.store.KEY); } catch (_) { return null; } })();
            if (lsBeforeDuel !== lsAfterDuel) {
                pass = false;
                lines.push('FAIL duel self-test: touched real localStorage during inSelfTest');
            }
            lines.push('(2D-duel) validated startDuel, guilt-free timer pause, duel recap verdict/counter-link, campaignLevel restoration & localStorage isolation');
        } catch (e) {
            pass = false;
            lines.push('FAIL 2D board: ' + e.message);
        }

        clearTransientTimers();
        inSelfTest = false;
        bossRushActive = false;
        bossRushStep = 0;
        bossRushResults = [];
        dailySeedActive = false;
        dailySeedStep = 0;
        dailyGauntletData = null;
        dailyStepResults = [];
        resetDuelState();
        duelLastSpec = null;
        pendingDuelShareSpec = null;
        pendingRecapMode = null;
        hintsUsed = 0;
        levelMistakes = 0;
        hintLevel = -1;
        hintItemKey = null;
        campaignLevel = savedCampaign;
        state = ensureStateShape(L.store.sanitize(JSON.parse(saved)));
        if (lsSnapshotBeforeSelfTest !== null) saveState();
        updateInventoryUI();
        item = null;
        initLevel();

        lines.push(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
        out.textContent = lines.join('\n');
        out.dataset.pass = pass ? 'true' : 'false';
        out.style.cssText = 'white-space:pre-wrap;background:#000;color:#0f0;padding:1rem;font-size:12px;position:relative;z-index:9999';
        document.body.appendChild(out);
    }

    /* ---------------- BOOT ---------------- */

    document.addEventListener('DOMContentLoaded', () => {
        loadState();
        syncCleanModeUI();

        try {
            new MutationObserver(syncCleanModeUI).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        } catch (_) {}
        window.addEventListener('storage', (e) => {
            if (e.key === 'gm_teacher_clean_screenshare') syncCleanModeUI();
            if (e.key === L.store.KEY && !inSelfTest) {
                loadState();
                refreshHud();
                updateInventoryUI();
            }
        });
        window.addEventListener('gc:sfxchange', (e) => {
            if (e && e.detail && !e.detail.enabled) stopBossVoice();
        });

        bindInteractions();
        if (undoBtn) undoBtn.addEventListener('click', undoLastRune);
        $('reset-btn').addEventListener('click', resetBoard);
        if (hintBtn) hintBtn.addEventListener('click', useHint);
        nextBtn.addEventListener('click', nextLevel);
        $('claim-btn').addEventListener('click', closePrizeModal);

        // Floor Selector, Mode & Utility bindings
        if ($('level-display')) $('level-display').addEventListener('click', () => toggleFloorDrawer());
        if ($('progress-pill')) $('progress-pill').addEventListener('click', () => toggleFloorDrawer());
        if ($('floor-drawer-close')) $('floor-drawer-close').addEventListener('click', () => toggleFloorDrawer(false));
        if ($('boss-rush-btn')) $('boss-rush-btn').addEventListener('click', toggleBossRush);
        if ($('daily-seed-btn')) $('daily-seed-btn').addEventListener('click', toggleDailySeed);
        if ($('daily-seed-hud-btn')) $('daily-seed-hud-btn').addEventListener('click', toggleDailySeed);
        if ($('duel-hud-btn')) $('duel-hud-btn').addEventListener('click', toggleDuelMode);
        if ($('buy-shield-btn')) $('buy-shield-btn').addEventListener('click', buyStreakShield);

        // Duel Forge bindings inside #floor-drawer
        document.querySelectorAll('.duel-preset-pill[data-duel-preset]').forEach(btn => {
            btn.addEventListener('click', () => applyForgePreset(btn.getAttribute('data-duel-preset')));
        });
        if ($('duel-show-sentences-btn')) {
            $('duel-show-sentences-btn').addEventListener('click', () => {
                forgeShowSentences = !forgeShowSentences;
                renderDuelForge();
                sfx('grab');
            });
        }
        if ($('duel-copy-instant-btn')) $('duel-copy-instant-btn').addEventListener('click', copyInstantDuelLink);
        if ($('duel-play-forge-btn')) $('duel-play-forge-btn').addEventListener('click', playForgedDuel);

        if ($('drawer-player-name')) {
            const nameInput = $('drawer-player-name');
            nameInput.value = state.playerName || '';
            const updateName = () => {
                state.playerName = nameInput.value.trim().slice(0, 30);
                saveState();
                refreshHud();
            };
            nameInput.addEventListener('input', updateName);
            nameInput.addEventListener('change', updateName);
        }

        if ($('boss-voice-btn')) {
            $('boss-voice-btn').addEventListener('click', () => {
                if (bossAudio && !bossAudio.paused) {
                    stopBossVoice();
                } else {
                    playBossVoice(state.level, true);
                }
            });
        }

        document.querySelectorAll('.act-pill[data-jump-floor]').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.getAttribute('data-jump-floor'), 10);
                if (!Number.isNaN(idx)) {
                    trackCryptEvent('crypt_drawer_jump', { tool: `floor_${idx + 1}` });
                    jumpToFloor(idx);
                }
            });
        });

        // Non-blocking Tier Jump Bar
        if (tierJumpBar) {
            try {
                if (sessionStorage.getItem(TIER_BAR_DISMISS_KEY) === '1') {
                    tierJumpBar.classList.add('hidden');
                }
            } catch (_) {}
            tierJumpBar.querySelectorAll('.tier-pill[data-jump-tier]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const tier = btn.dataset.jumpTier;
                    if (Object.prototype.hasOwnProperty.call(TIER_START_FLOORS, tier)) {
                        const targetIdx = TIER_START_FLOORS[tier];
                        trackCryptEvent('crypt_drawer_jump', { tool: `tier_${tier}` });
                        jumpToFloor(targetIdx);
                    }
                });
            });
            const dailyBarBtn = tierJumpBar.querySelector('.tier-pill[data-jump-mode="daily"]');
            if (dailyBarBtn) {
                dailyBarBtn.addEventListener('click', () => {
                    trackCryptEvent('crypt_drawer_jump', { tool: 'tier_daily' });
                    startDailySeed(false);
                });
            }
            if ($('tier-bar-dismiss')) {
                $('tier-bar-dismiss').addEventListener('click', () => {
                    tierJumpBar.classList.add('hidden');
                    try { sessionStorage.setItem(TIER_BAR_DISMISS_KEY, '1'); } catch (_) {}
                });
            }
        }

        // Belfast Desk Syntax Autopsy Card bindings
        if (blueprintBtn) {
            blueprintBtn.addEventListener('click', () => toggleAutopsyCard());
        }
        if ($('reveal-model-btn')) {
            $('reveal-model-btn').addEventListener('click', () => {
                if (!locked && bosses[state.level]) return;
                if (!locked) hintsUsed = Math.max(hintsUsed, 99);
                updateAutopsyCard(state.level, item, null, true);
                sfx('grab');
            });
        }
        if ($('btn-reveal-bridge')) {
            $('btn-reveal-bridge').addEventListener('click', () => {
                const bridgeBox = $('autopsy-bridge-box');
                if (!bridgeBox) return;
                const ansEl = bridgeBox.querySelector('.bridge-answer-reveal');
                if (ansEl) ansEl.classList.remove('hidden');
                $('btn-reveal-bridge').classList.add('hidden');
                sfx('grab');
            });
        }

        function countCambridgeBridgeWords(text) {
            const cleaned = String(text || '').replace(/[\u2018\u2019\u02BC]/g, "'").replace(/\s+/g, ' ').trim();
            if (!cleaned) return 0;
            const nonPossBases = new Set(['it', 'that', 'there', 'what', 'who', 'where', 'how', 'he', 'she', 'let', 'here', 'this', 'when', 'why']);
            const tokens = cleaned.split(' ').map(t => t.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, '')).filter(Boolean);
            let count = 0;
            for (const tok of tokens) {
                const w = tok.toLowerCase();
                if (/[a-z]n't$/.test(w) || /[a-z]'(ve|d|ll|re|m)$/.test(w)) {
                    count += 2;
                } else if (/'s$/.test(w) && nonPossBases.has(w.slice(0, -2))) {
                    count += 2;
                } else {
                    count += 1;
                }
            }
            return count;
        }

        function normaliseBridgeGap(text) {
            return String(text || '')
                .replace(/[\u2018\u2019\u02BC]/g, "'")
                .replace(/[.,;!?]+$/g, '')
                .replace(/\s+/g, ' ')
                .trim()
                .toLowerCase();
        }

        function checkBridgeAttempt() {
            const bridge = activeAutopsyInfo && activeAutopsyInfo.bridge;
            const attemptInput = $('bridge-attempt-input');
            const fbEl = $('bridge-attempt-feedback');
            const bridgeBox = $('autopsy-bridge-box');
            if (!bridge || !attemptInput || !fbEl) return;

            const raw = attemptInput.value.trim();
            const kw = String(bridge.keyword || '').trim();
            fbEl.classList.remove('hidden', 'is-ok', 'is-warn', 'is-bad');

            if (!raw) {
                fbEl.classList.add('is-warn');
                fbEl.textContent = `Type 3 to 6 words including the unchanged key word "${kw}".`;
                return;
            }

            const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const hasExactKw = kw ? new RegExp(`\\b${escapedKw}\\b`, 'i').test(raw) : true;
            if (!hasExactKw) {
                const stem = kw.toLowerCase().replace(/(?:ed|ing|es|s)$/, '');
                const inflected = stem.length >= 3 && new RegExp(`\\b${stem}[a-z]*\\b`, 'i').test(raw);
                fbEl.classList.add('is-bad');
                fbEl.textContent = inflected
                    ? `Never change the key word "${kw}" — keep its exact form unchanged.`
                    : `Include the exact unchanged key word "${kw}" in your gap.`;
                sfx('error');
                return;
            }

            const wc = countCambridgeBridgeWords(raw);
            if (wc < 3 || wc > 6) {
                fbEl.classList.add('is-warn');
                fbEl.textContent = `Cambridge Part 4 requires 3 to 6 words (your gap is ${wc} words; contractions count as 2).`;
                sfx('error');
                return;
            }

            const normUser = normaliseBridgeGap(raw);
            const normTarget = normaliseBridgeGap(bridge.answer || '');
            const normUserBritish = normUser.replace(/\brealize\b/g, 'realise');
            const normTargetBritish = normTarget.replace(/\brealize\b/g, 'realise');
            if (normUser === normTarget || normUserBritish === normTargetBritish) {
                fbEl.classList.add('is-ok');
                fbEl.textContent = `✓ Spot on! 2 / 2 Marks (${wc} words, unchanged "${kw}") — "${bridge.answer}"`;
                const ansEl = bridgeBox ? bridgeBox.querySelector('.bridge-answer-reveal') : null;
                if (ansEl) ansEl.classList.remove('hidden');
                if ($('btn-reveal-bridge')) $('btn-reveal-bridge').classList.add('hidden');
                sfx('success', state.streak);
                trackCryptEvent('crypt_bridge_solved', { floor: (activeAutopsyInfo.floorIdx || 0) + 1 });
            } else {
                fbEl.classList.add('is-bad');
                fbEl.textContent = `Not quite (${wc} words, "${kw}" intact). Check Tense Harmony, Voice Shift, or Preposition Lock — or click "👁️ Reveal Cambridge Model".`;
                sfx('error');
            }
        }

        if ($('btn-check-bridge')) {
            $('btn-check-bridge').addEventListener('click', checkBridgeAttempt);
        }
        if ($('bridge-attempt-input')) {
            $('bridge-attempt-input').addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    checkBridgeAttempt();
                }
            });
        }

        function syncCryptDeskContext() {
            const info = activeAutopsyInfo || {
                floorIdx: state.level,
                title: levels[state.level] ? levels[state.level].title : 'Grammar Crypt',
                cefr: levels[state.level] ? levels[state.level].cefr : 'C1',
                formula: levels[state.level] ? (levels[state.level].formula || '') : ''
            };
            const label = `Floor ${info.floorIdx + 1} (${info.cefr}) · ${info.title}`;
            const pillEl = $('crypt-desk-context-pill');
            const ctxHidden = $('crypt-desk-context-hidden');
            const dossierEl = $('crypt-desk-dossier');
            const attemptEl = $('bridge-attempt-input');
            const bridgeDraft = attemptEl && attemptEl.value.trim() ? ` | Part 4 attempt: ${attemptEl.value.trim()}` : '';
            if (pillEl) pillEl.textContent = label;
            if (ctxHidden) ctxHidden.value = `${label}${info.formula ? ` | Blueprint: ${info.formula}` : ''}${bridgeDraft}`;
            if (dossierEl) {
                try { dossierEl.value = localStorage.getItem('gm_active_dossier_summary') || ''; } catch (_) {}
            }
        }

        const toggleCryptDeskBtn = $('btn-toggle-crypt-desk');
        const cryptDeskDrawer = $('crypt-desk-drawer');
        if (toggleCryptDeskBtn && cryptDeskDrawer) {
            toggleCryptDeskBtn.addEventListener('click', () => {
                const willOpen = cryptDeskDrawer.classList.contains('hidden');
                cryptDeskDrawer.classList.toggle('hidden', !willOpen);
                toggleCryptDeskBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
                if (willOpen) {
                    syncCryptDeskContext();
                    const msgEl = $('crypt-desk-message');
                    if (msgEl) msgEl.focus();
                }
            });
        }

        const cryptDeskForm = $('crypt-desk-form');
        if (cryptDeskForm) {
            cryptDeskForm.addEventListener('submit', async (e) => {
                if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;
                e.preventDefault();
                if (cryptDeskForm.dataset.submitting === 'true') return;

                const gotcha = cryptDeskForm.querySelector('input[name="_gotcha"]');
                const statusBox = $('crypt-desk-status');
                const submitBtn = $('crypt-desk-submit');
                const origText = submitBtn ? submitBtn.textContent : 'Send to My Desk →';

                if (gotcha && gotcha.value.trim()) {
                    if (statusBox) {
                        statusBox.className = 'crypt-desk-status is-success';
                        statusBox.textContent = 'Sent to my desk — thank you.';
                    }
                    return;
                }

                syncCryptDeskContext();
                cryptDeskForm.dataset.submitting = 'true';
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Sending...';
                }
                if (statusBox) {
                    statusBox.className = 'crypt-desk-status';
                    statusBox.textContent = '';
                }

                try {
                    const res = await fetch(cryptDeskForm.action || 'https://formspree.io/f/mvkgrwvj', {
                        method: 'POST',
                        body: new FormData(cryptDeskForm),
                        headers: { 'Accept': 'application/json' }
                    });
                    if (!res.ok) throw new Error('Request failed');
                    if (statusBox) {
                        statusBox.className = 'crypt-desk-status is-success';
                        statusBox.textContent = 'Received at my desk in Northern Ireland. I will reply with a personal red-pen note within 24 hours.';
                    }
                    if (submitBtn) submitBtn.textContent = 'Sent to My Desk ✓';
                    trackCryptEvent('desk_dropbox_submitted', { tool: 'grammar_crypt' });
                } catch (_) {
                    if (statusBox) {
                        statusBox.className = 'crypt-desk-status is-error';
                        statusBox.innerHTML = 'Something stopped the form from sending. Please email me directly at <a href="mailto:gareth@garethenglish.com?subject=Grammar%20Crypt%20Sentence%20Check" style="color:inherit;text-decoration:underline;font-weight:700;">gareth@garethenglish.com</a>.';
                    }
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = origText;
                    }
                } finally {
                    cryptDeskForm.dataset.submitting = 'false';
                }
            });
        }

        // Recap Modal bindings
        if ($('btn-copy-daily')) $('btn-copy-daily').addEventListener('click', copyDailyResult);
        if ($('btn-copy-duel')) $('btn-copy-duel').addEventListener('click', copyDuelChallengeLink);
        if ($('btn-open-diagnostic')) $('btn-open-diagnostic').addEventListener('click', openDiagnosticFromRecap);
        if ($('btn-close-recap')) $('btn-close-recap').addEventListener('click', () => closeRecapModal(true));

        // Keyboard Accessibility: 1-0 place bank rune, Backspace undo, H hint, Enter next, Escape close drawers/modals
        document.addEventListener('keydown', (e) => {
            if (modal && modal.classList.contains('open')) {
                if (e.key === 'Escape') closePrizeModal();
                if (e.key === 'Tab') { e.preventDefault(); $('claim-btn').focus(); }
                return;
            }
            if (recapModal && recapModal.classList.contains('open')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeRecapModal(true);
                    return;
                }
                if (e.key === 'Tab') {
                    const focusables = Array.from(recapModal.querySelectorAll('button:not(.hidden):not([disabled]), a[href]:not(.hidden)'));
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
            if (floorDrawer && !floorDrawer.classList.contains('hidden') && e.key === 'Escape') {
                e.preventDefault();
                toggleFloorDrawer(false);
                if (drawerReturnFocus && document.contains(drawerReturnFocus)) {
                    drawerReturnFocus.focus();
                } else if ($('level-display')) {
                    $('level-display').focus();
                }
                return;
            }

            if (document.querySelector('.fullscreen-modal.open')) return;
            if (e.ctrlKey || e.altKey || e.metaKey) return;
            const tag = (e.target && e.target.tagName) ? e.target.tagName.toUpperCase() : '';
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (e.target && e.target.isContentEditable)) return;

            if (/^[0-9]$/.test(e.key) && !locked) {
                const targetRune = bank.querySelector(`.block[data-key="${e.key}"]`);
                if (targetRune) {
                    e.preventDefault();
                    activateBlock(targetRune);
                }
                return;
            }
            if (e.key === 'Backspace' && !locked) {
                if (undoLastRune()) e.preventDefault();
                return;
            }
            if ((e.key === 'h' || e.key === 'H') && !locked) {
                if (!bosses[state.level]) {
                    e.preventDefault();
                    useHint();
                }
                return;
            }
            if (e.key === 'Enter' && locked && !nextBtn.disabled) {
                if (e.target !== nextBtn) {
                    e.preventDefault();
                    nextLevel();
                }
            }
        });

        updateInventoryUI();
        const startedMode = applyUrlRoute();
        if (!startedMode) {
            initLevel();
            if (deferredBootStatus) {
                setStatus(deferredBootStatus.text, deferredBootStatus.kind);
                deferredBootStatus = null;
            }
            if (deferredForgeOpen) {
                deferredForgeOpen = false;
                openDuelForge();
            }
        }
        if (/[?&]selftest=1\b/.test(location.search)) runSelfTest();
    });
})();
