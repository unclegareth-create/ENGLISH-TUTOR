/* ==========================================================
   Grammar Crypt – shared game logic (fantasy.html + sounds.html)

   Optional audio: if audio.js is loaded it exposes window.GCAudio
   with a play(name) method. Without it, every sound call is a no-op.
   ========================================================== */
(() => {
    'use strict';

    // EDIT THESE: shown to players after they submit the lead form
    const DISCOUNT_CODE = 'CRYPT50';
    const BOOKING_URL = '';   // e.g. your booking page; leave empty to hide

    const vibrate = (pattern) => {
        try { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern); } catch (_) {}
    };

    const isSoundEnabled = () => {
        const audioBtn = document.getElementById('audio-toggle');
        return audioBtn ? audioBtn.getAttribute('aria-pressed') === 'true' : false;
    };

    const sfx = (name, arg) => {
        if (!isSoundEnabled()) return;
        try { if (window.GCAudio) window.GCAudio.play(name, arg); } catch (_) { /* audio is optional */ }
        if (name === 'grab' || name === 'drop') vibrate(15);
        else if (name === 'success') vibrate([30, 40, 60]);
        else if (name === 'error') vibrate([50, 50, 50]);
        else if (name === 'loot' || name === 'milestone') vibrate([40, 50, 40, 50, 80]);
        else if (name === 'boss') vibrate([60, 50, 60, 50, 100]);
    };

    /* ---------------- DATA (shared with the 3D crypt: crypt-levels.js) ---------------- */

    const L = window.CRYPT_LEVELS;
    if (!L) { console.error('crypt-levels.js must be loaded before crypt.js'); return; }
    const lootTable = L.loot;
    const milestonePrizes = L.milestones;   // keys are zero-based floor indexes (4 = Floor 5)
    const bosses = L.bosses;
    const levels = L.floors;                // each floor: { title, cefr, boss, pool: [item...] }

    /* ---------------- STATE (persisted, one versioned key shared with 3D) ---------------- */

    const XP_PER_RANK = 100;
    const lastLevel = levels.length - 1;

    let state = L.store.fresh();
    let item = null;             // the pool sentence currently on the board
    let locked = false;          // true once the current floor is solved
    let targetedZone = null;     // tap-to-place: slot chosen by the player
    let draggedBlock = null;
    let lootTimer = null;
    let hintsUsed = 0;
    let levelMistakes = 0;
    let hintLevel = -1;       // hints/mistakes persist across Reset on the same floor (no free-hint farming)

    const tips = L.TIPS;

    function loadState() { state = L.store.load(); }
    function saveState() { L.store.save(state); }

    /* ---------------- DOM ---------------- */

    const $ = (id) => document.getElementById(id);
    const board = $('board');
    const bank = $('bank');
    const statusEl = $('status');
    const tipEl = $('tip');
    const nextBtn = $('next-btn');
    const hintBtn = $('hint-btn');
    const modal = $('prize-modal');
    let modalReturnFocus = null;

    function setStatus(text, kind) {
        statusEl.textContent = text;
        statusEl.className = 'status-panel' + (kind ? ' ' + kind : '');
    }

    function shuffle(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const zones = () => Array.from(board.querySelectorAll('.drop-zone'));
    const blockIn = (zone) => zone.querySelector('.block');

    function refreshHud() {
        if ($('level-display')) $('level-display').textContent = `Floor: ${state.level + 1}/${levels.length}`;
        if ($('rank-display')) {
            const prefix = state.playerName ? `${state.playerName} - ` : '';
            $('rank-display').textContent  = `⚔️ ${prefix}Rank ${Math.floor(state.xp / XP_PER_RANK) + 1}`;
        }
        if ($('gold-counter')) $('gold-counter').textContent  = `🪙 ${state.gold}`;
        if ($('xp-counter')) $('xp-counter').textContent    = `🔮 ${state.xp % XP_PER_RANK}/${XP_PER_RANK}`;
        if ($('streak-display')) $('streak-display').textContent = `🔥 ${state.streak}`;
    }

    /* ---------------- LEVEL SETUP ---------------- */

    function initLevel(keepItem) {
        const level = levels[state.level];
        locked = false;
        
        const boss = bosses[state.level];
        if (boss) {
            document.body.classList.add('boss-mode');
            $('boss-arena').classList.remove('hidden');
            $('boss-avatar').textContent = boss.emoji;
            $('boss-avatar').style.filter = 'drop-shadow(2px 4px 0 #000)';
            $('boss-name').textContent = boss.name;
            $('boss-taunt').textContent = `"${boss.taunt}"`;
            if (hintBtn) hintBtn.style.display = 'none'; // No hints in boss fights!
        } else {
            document.body.classList.remove('boss-mode');
            $('boss-arena').classList.add('hidden');
            if (hintBtn) hintBtn.style.display = 'inline-block';
        }
        targetedZone = null;
        if (hintLevel !== state.level) { hintsUsed = 0; levelMistakes = 0; hintLevel = state.level; }
        // A fresh sentence from the floor's pool (Reset keeps the same one).
        if (!keepItem || !item || !level.pool.includes(item)) item = L.pickItem(state.level, item && item.id);
        if (tipEl) tipEl.textContent = '';
        refreshHud();
        $('quest-title').textContent = `${level.title} (${level.cefr})`;

        board.innerHTML = '';
        bank.innerHTML = '';
        nextBtn.disabled = true;
        nextBtn.textContent = 'Next Floor ➔';
        setStatus('Summon the sentence!', '');

        item.slots.forEach((slot, i) => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.pos = slot.pos;
            zone.setAttribute('role', 'group');
            zone.setAttribute('aria-label', `Slot ${i + 1}: ${slot.label}`);
            const label = document.createElement('span');
            label.className = 'slot-label';
            label.textContent = slot.label;
            zone.appendChild(label);
            board.appendChild(zone);
        });

        // Shuffled copy that never starts in an accepted order.
        L.shuffledRunes(item).forEach((r, i) => {
            const block = document.createElement('div');
            block.className = `block ${L.CSS[r.pos] || ''}`;
            block.id = `rune-${i}`;
            block.draggable = true;
            block.tabIndex = 0;
            block.setAttribute('role', 'button');
            block.dataset.pos = r.pos;
            block.dataset.text = r.text;
            block.textContent = r.text;
            bank.appendChild(block);
        });
        refreshZones();
    }

    function refreshZones() {
        zones().forEach(z => {
            z.classList.toggle('filled', !!blockIn(z));
            z.classList.remove('wrong');
        });
    }

    function setTarget(zone) {
        if (targetedZone) targetedZone.classList.remove('targeted');
        targetedZone = zone;
        if (zone) zone.classList.add('targeted');
    }

    const boardTexts = () => zones().map(z => (blockIn(z) ? blockIn(z).dataset.text : null));

    function useHint() {
        if (locked) return;
        const slots = zones();
        const cost = hintsUsed === 0 ? 0 : 5;
        if (state.gold < cost) { 
            setStatus('Not enough gold for another hint (5 🪙).', 'error'); 
            return; 
        }
        
        // Closest accepted ordering to what is on the board: first slot that deviates from it.
        const texts = boardTexts();
        const c = L.closest(item, texts);
        const firstWrongIndex = c.prefix;
        if (firstWrongIndex >= c.answer.length) return;
        
        const expectedText = c.answer[firstWrongIndex];
        const block = Array.from(document.querySelectorAll('.block')).find(b => b.dataset.text === expectedText && !slots[firstWrongIndex].contains(b));
        if (block) { 
            block.classList.add('hint'); 
            setTimeout(() => block.classList.remove('hint'), 2600); 
        }
        
        state.gold -= cost; 
        hintsUsed++; 
        refreshHud(); 
        saveState();
        
        setStatus(`Rune ${firstWrongIndex + 1} is glowing!` + (cost ? ' (-5 🪙)' : ' (first hint is free)'), '');
        if (tipEl) tipEl.textContent = (L.TIPS[item.posOf[expectedText]] || '') + ' ' + item.explain;
        sfx('grab');
    }

    /* ---------------- MOVING RUNES ---------------- */

    function place(block, container) {
        container.appendChild(block);
        sfx('drop');
    }

    function afterMove() {
        refreshZones();
        validateBoard();
    }

    // Click / tap / keyboard: bank -> first free (or chosen) slot; placed -> back to bank.
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
        document.querySelectorAll('.drop-zone.active, .block-bank.active').forEach(el => { if (el !== except) el.classList.remove('active'); });
    }

    function dropOn(container) {
        const dragged = draggedBlock;
        if (!dragged || locked) return;
        if (container.classList.contains('drop-zone')) {
            const occupant = blockIn(container);
            if (occupant === dragged) return;
            if (occupant) place(occupant, dragged.parentElement);   // swap with the dragged rune's origin
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
            if (block && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activateBlock(block); }
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

        // Mobile Touch Drag & Drop
        let touchDragEl = null;
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouchDragging = false;
        let touchClone = null;

        playArea.addEventListener('touchstart', (e) => {
            if (locked) return;
            const block = e.target.closest('.block');
            if (!block) return;
            const t = e.touches[0];
            touchDragEl = block;
            touchStartX = t.clientX;
            touchStartY = t.clientY;
            isTouchDragging = false;
        }, { passive: true });

        playArea.addEventListener('touchmove', (e) => {
            if (!touchDragEl || locked) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;

            if (!isTouchDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
                isTouchDragging = true;
                draggedBlock = touchDragEl;
                touchDragEl.classList.add('dragging');
                sfx('grab');

                touchClone = touchDragEl.cloneNode(true);
                touchClone.classList.add('touch-drag-proxy');
                touchClone.style.position = 'fixed';
                touchClone.style.pointerEvents = 'none';
                touchClone.style.zIndex = '9999';
                touchClone.style.opacity = '0.9';
                touchClone.style.transform = 'translate(-50%, -50%) scale(1.08)';
                touchClone.style.boxShadow = '0 12px 24px rgba(0,0,0,0.6)';
                document.body.appendChild(touchClone);
            }

            if (isTouchDragging) {
                if (e.cancelable) e.preventDefault();
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

        const endTouchDrag = (e) => {
            if (touchClone) {
                touchClone.remove();
                touchClone = null;
            }
            if (touchDragEl) {
                touchDragEl.classList.remove('dragging');
            }
            if (isTouchDragging) {
                const t = e.changedTouches ? e.changedTouches[0] : null;
                if (t) {
                    const elem = document.elementFromPoint(t.clientX, t.clientY);
                    const container = elem ? elem.closest('.drop-zone, .block-bank') : null;
                    if (container) {
                        dropOn(container);
                    }
                }
                clearActive();
                draggedBlock = null;
                touchDragEl = null;
                isTouchDragging = false;
            } else {
                touchDragEl = null;
            }
        };

        playArea.addEventListener('touchend', endTouchDrag, { passive: true });
        playArea.addEventListener('touchcancel', endTouchDrag, { passive: true });
    }

    /* ---------------- VALIDATION ---------------- */

    let inSelfTest = false;

    function getCryptCategory(floorIdx, it) {
        if (it && it.tokens) {
            if (it.tokens.some(t => t.pos === 'cleft' || t.pos === 'rel')) return 'cleft_clauses';
            if (it.tokens.some(t => t.pos === 'neg')) return 'inversion';
        }
        if (floorIdx >= 20 && floorIdx <= 23) return 'cleft_clauses';
        if (floorIdx === 8 || floorIdx === 9) return 'register_shift';
        if (floorIdx === 5 || floorIdx === 6 || floorIdx === 7) return 'nominalisation';
        return 'inversion';
    }

    function validateBoard() {
        const slots = zones();
        if (!slots.every(z => blockIn(z))) {
            if (!locked) setStatus('Summon the sentence!', '');
            return;
        }

        // Any accepted ordering wins; near-misses are grammatical but not this floor's structure.
        const currentTexts = boardTexts();
        const r = L.check(item, currentTexts);
        const questionText = levels[state.level] ? `${levels[state.level].title} (${levels[state.level].cefr})` : 'Grammar Crypt';
        const correctAns = L.formatSentence(r.answer || item.answers[0]);
        const chosenAns = L.formatSentence(currentTexts);
        const ruleExplanation = r.msg || item.explain || (L.TIPS[r.expectedPos] || '');

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
            state.streak = 0;
            refreshHud();
            saveState();
            levelMistakes++;
            const firstWrongIndex = r.firstWrong;
            slots[firstWrongIndex].classList.add('wrong');   // only the first error: no solving by elimination
            
            setStatus(r.isDecoy ? `Rune ${firstWrongIndex + 1} is a decoy: it does not belong in this sentence.` : `Rune ${firstWrongIndex + 1} is not right yet.`, 'error');
            if (tipEl) tipEl.textContent = r.msg || L.TIPS[r.expectedPos] || '';
            
            board.classList.remove('shake'); 
            void board.offsetWidth; 
            board.classList.add('shake');
            sfx('error');
        }
    }

        function showFloatingText(text, color, element) {
        const floater = document.createElement('div');
        floater.className = 'floating-text';
        floater.textContent = text;
        floater.style.color = color;
        const rect = element.getBoundingClientRect();
        floater.style.left = (rect.left + rect.width / 2 - 30 + window.scrollX) + 'px';
        floater.style.top = (rect.top - 20 + window.scrollY) + 'px';
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1000);
    }

    function solveLevel(answer) {
        locked = true;
        board.querySelectorAll('.block').forEach(b => { b.classList.add('correct'); b.draggable = false; });
        bank.querySelectorAll('.block').forEach(b => { b.draggable = false; b.tabIndex = -1; });

        const isLast = state.level === lastLevel;
        const firstClear = !state.completed.includes(state.level);

        if (firstClear) {
            state.completed.push(state.level);
            state.streak++;
            if (levelMistakes === 0) state.perfect++;
            const goldEarned = 15 + Math.min(state.streak - 1, 5) * 3;
            state.gold += goldEarned;
            state.xp += 20;
            
            const boss = bosses[state.level];
            if (boss) {
                state.gold += 50; // Boss clear bonus
                $('boss-taunt').textContent = '"Impossible! My syntax is broken!"';
                $('boss-avatar').style.filter = 'grayscale(100%) blur(3px)';
                showFloatingText('+50 🪙 BOSS BONUS', '#facc15', $('gold-counter'));
                setTimeout(() => showFloatingText('+20 🔮', '#a855f7', $('xp-counter')), 600);
            } else {
                showFloatingText('+' + goldEarned + ' 🪙', '#facc15', $('gold-counter'));
                setTimeout(() => showFloatingText('+20 🔮', '#a855f7', $('xp-counter')), 300);
            }
            
            if (window.confetti) {
                confetti({
                    particleCount: 100,
                    spread: 80,
                    origin: { y: 0.6 },
                    colors: ['#22c55e', '#a855f7', '#facc15'],
                    disableForReducedMotion: true
                });
            }
        }
        setStatus(isLast ? 'The Crypt is Conquered!' : (firstClear ? 'The incantation is complete!' : 'The incantation is complete! (Rewards already claimed)'), 'success');
        if (tipEl) tipEl.textContent = '✔ "' + L.formatSentence(answer || item.answers[0]) + '" ' + item.explain;
        sfx('success', state.streak);

        nextBtn.disabled = false;
        nextBtn.textContent = isLast ? 'Restart Crypt ↺' : 'Next Floor ➔';

        if (firstClear) {
            const loot = rollLoot();
            state.inventory.push(loot.name);
            announceLoot(loot);
            updateInventoryUI();
            checkMilestone();
        }

        state.level = isLast ? state.level : state.level + 1;   // progress is saved as "next floor"
        saveState();
        refreshHud();
    }

    /* ---------------- LOOT ---------------- */

    function rollLoot() {
        const total = lootTable.reduce((sum, l) => sum + l.chance, 0);
        let roll = Math.random() * total;
        for (const item of lootTable) {
            roll -= item.chance;
            if (roll < 0) return item;
        }
        return lootTable[0];
    }

    function announceLoot(item) {
        const popup = $('loot-announcement');
        popup.textContent = '';
        const wrap = document.createElement('span');
        wrap.append('Uncovered: ');
        const name = document.createElement('span');
        name.style.color = item.color;
        name.textContent = item.name;
        wrap.append(name, '!');
        popup.appendChild(wrap);

        clearTimeout(lootTimer);
        lootTimer = setTimeout(() => {
            sfx('loot');
            popup.classList.add('show');
            lootTimer = setTimeout(() => popup.classList.remove('show'), 2200);
        }, 600);   // slight delay after the success chime
    }

    function updateInventoryUI() {
        const list = $('inventory-list');
        list.textContent = '';
        if (state.inventory.length === 0) {
            const note = document.createElement('p');
            note.className = 'empty-note';
            note.textContent = 'No relics yet. Solve a floor to uncover one.';
            list.appendChild(note);
            return;
        }
        state.inventory.slice().reverse().forEach((itemName) => {
            const item = lootTable.find(l => l.name === itemName);
            if (!item) return;
            const row = document.createElement('div');
            row.className = 'loot-item';
            const icon = document.createElement('span');
            icon.className = 'loot-icon';
            icon.style.backgroundColor = item.color;
            icon.setAttribute('aria-hidden', 'true');
            const text = document.createElement('span');
            text.textContent = item.name;
            const rarity = document.createElement('span');
            rarity.className = 'loot-rarity';
            rarity.textContent = item.rarity;
            text.appendChild(rarity);
            row.append(icon, text);
            list.appendChild(row);
        });
    }

    /* ---------------- MILESTONES ---------------- */

    function checkMilestone() {
        const prize = milestonePrizes[state.level];
        if (!prize) return;
        $('prize-emoji').textContent = prize.emoji;
        $('prize-name').textContent = prize.name;
        $('prize-description').textContent = prize.desc;
        setTimeout(() => {
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

    /* ---------------- NAVIGATION ---------------- */

    function resetBoard() {
        if (locked) return;      // a solved floor stays solved; use Next Floor
        initLevel(true);
    }

    function restartCrypt() {
        state = L.store.fresh(state);
        saveState();
        updateInventoryUI();
        initLevel();
    }

    function nextLevel() {
        if (!locked) return;
        if (nextBtn.textContent.startsWith('Restart')) {
            if (state.leadSent) restartCrypt(); else showLeadModal();
            return;
        }
        initLevel();
    }

    function showLeadModal() {
        const leadModal = $('lead-modal');
        if (!leadModal) { restartCrypt(); return; }
        $('lead-name').value = state.playerName;
        $('lead-email').value = state.playerEmail;
        $('lead-score').value = `${state.playerName} - Flawless floors: ${state.perfect}/${levels.length}, Gold: ${state.gold}`;
        const h = $('lead-heading');
        const p = leadModal.querySelector('p');
        h.style.color = 'var(--gold)';
        if (state.perfect >= 20) {
            h.textContent = 'Your Syntax is Flawless!';
            p.textContent = "You're ready for C1 Advanced or IELTS 8.0. Add your email to claim your Grammar Crypt Certificate and a 50% discount on a trial lesson to polish your speaking.";
        } else if (state.perfect >= 12) {
            h.textContent = 'You Survived!';
            p.textContent = 'Solid grammar, with a few cracks in the armor. Add your email for your score breakdown and 50% off a trial lesson to fix those gaps.';
        } else {
            h.textContent = 'The Crypt is Conquered!';
            p.textContent = 'You made it through. Some floors took a few tries, which is how grammar sticks. Add your email for targeted practice tips and 50% off a trial lesson.';
        }
        leadModal.classList.add('open');
        $('lead-email').focus();

        if (typeof window.showDiagnosticGate === 'function') {
            setTimeout(() => {
                window.showDiagnosticGate({
                    gameName: 'Grammar Crypt',
                    score: state.perfect || state.completed.length || 18,
                    maxScore: levels.length || 25,
                    weakArea: 'C1/C2 Inverted Syntax & Complex Question Architecture',
                    examImpact: 'In Cambridge C1/C2 Use of English and IELTS Writing Task 2, inverted syntax errors prevent you from scoring in the top grammatical band.',
                    onReplay: () => {
                        leadModal.classList.remove('open');
                        restartCrypt();
                    }
                });
            }, 800);
        }

        const form = $('lead-form');
        if (!form.dataset.bound) {
            form.dataset.bound = 'true';
            form.addEventListener('submit', () => {
                state.playerEmail = $('lead-email').value.trim();
                saveState();
                form.querySelector('[name="_next"]').value = location.href.split('?')[0] + '?success=true';
            });
            $('btn-skip-lead').addEventListener('click', () => {
                leadModal.classList.remove('open');
                restartCrypt();
            });
        }
    }

    /* ---------------- ?selftest=1 (2D) ---------------- */
    function runSelfTest() {
        const out = document.createElement('pre');
        out.id = 'selftest';
        const res = L.dataTests();
        let pass = res.pass;
        const lines = ['GRAMMAR CRYPT 2D SELFTEST'].concat(res.lines);
        // Board integration: every floor renders one zone per token, and solving with answers[last] locks the board.
        const saved = JSON.stringify(state);
        inSelfTest = true;
        try {
            levels.forEach((fl, f) => {
                state.level = f; item = null; initLevel();
                if (zones().length !== item.tokens.length) { pass = false; lines.push(`FAIL floor ${f + 1}: ${zones().length} zones for ${item.tokens.length} tokens`); }
                const target = item.answers[item.answers.length - 1];
                const blocks = Array.from(bank.querySelectorAll('.block'));
                zones().forEach((z, i) => { const b = blocks.find(x => x.dataset.text === target[i] && !x.closest('.drop-zone')); if (b) z.appendChild(b); });
                const before = state.completed.length;
                validateBoard();
                if (!locked) { pass = false; lines.push(`FAIL floor ${f + 1} (${item.id}) alt answer not accepted by the 2D board`); }
                state.completed = state.completed.slice(0, before);
            });
            lines.push('(2D) all 25 floors render and accept an alternative ordering on the live board');
        } catch (e) { pass = false; lines.push('FAIL 2D board: ' + e.message); }
        inSelfTest = false;
        state = L.store.sanitize(JSON.parse(saved)); saveState();
        item = null; initLevel();
        lines.push(pass ? 'RESULT: PASS' : 'RESULT: FAIL');
        out.textContent = lines.join('\n');
        out.dataset.pass = pass ? 'true' : 'false';
        out.style.cssText = 'white-space:pre-wrap;background:#000;color:#0f0;padding:1rem;font-size:12px;position:relative;z-index:9999';
        document.body.appendChild(out);
    }

    /* ---------------- BOOT ---------------- */

    // Ensure audio/music is OFF/muted by default until the user explicitly toggles sound on
    const muteAudioByDefault = () => {
        const audioBtn = document.getElementById('audio-toggle');
        if (audioBtn && audioBtn.getAttribute('aria-pressed') === 'true') {
            audioBtn.click();
        }
    };
    muteAudioByDefault();

    document.addEventListener('DOMContentLoaded', () => {
        muteAudioByDefault();
        loadState();
        const justSubmitted = location.search.includes('success=true');
        if (justSubmitted) {
            state.leadSent = true;
            saveState();
            history.replaceState(null, '', location.pathname);
            restartCrypt();
        }
        bindInteractions();
        $('reset-btn').addEventListener('click', resetBoard);
        if (hintBtn) hintBtn.addEventListener('click', useHint);
        nextBtn.addEventListener('click', nextLevel);
        $('claim-btn').addEventListener('click', closePrizeModal);
        document.addEventListener('keydown', (e) => {
            if (!modal.classList.contains('open')) return;
            if (e.key === 'Escape') closePrizeModal();
            if (e.key === 'Tab') { e.preventDefault(); $('claim-btn').focus(); }   // single focusable control: keep focus in the dialog
        });

        // Intro / Name Entry Flow
        const introScreen = $('intro-screen');
        const nameScreen = $('name-screen');
        if (introScreen && nameScreen && !state.playerName) {
            introScreen.classList.add('open');
            $('btn-continue-intro').addEventListener('click', () => {
                introScreen.classList.remove('open');
                nameScreen.classList.add('open');
                $('player-name-input').focus();
            });
            
            const nameInput = $('player-name-input');
            const emailInput = $('player-email-input');
            const startBtn = $('btn-start-game');
            startBtn.disabled = false;

            const handleEnterKey = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    startBtn.click();
                }
            };
            if (nameInput) nameInput.addEventListener('keydown', handleEnterKey);
            if (emailInput) emailInput.addEventListener('keydown', handleEnterKey);

            startBtn.addEventListener('click', () => {
                const name = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Adventurer';
                const email = emailInput ? emailInput.value.trim() : '';
                state.playerName = name;
                state.playerEmail = email;
                saveState();
                nameScreen.classList.remove('open');
                refreshHud();
                sfx('epic');
            });
        }

        updateInventoryUI();
        initLevel();
        if (/[?&]selftest=1\b/.test(location.search)) runSelfTest();
        if (justSubmitted) {
            setStatus(`Thanks, ${state.playerName}! Use code ${DISCOUNT_CODE} for 50% off your trial lesson.` + (BOOKING_URL ? ' Book at ' + BOOKING_URL : '') + ' Descend again?', 'success');
        }
    });
})();
