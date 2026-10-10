/* ==========================================================
   Grammar Crypt – shared game logic (fantasy.html + sounds.html)

   Optional audio: if audio.js is loaded it exposes window.GCAudio
   with a play(name) method. Without it, every sound call is a no-op.
   ========================================================== */
(() => {
    'use strict';

    const sfx = (name) => {
        try { if (window.GCAudio) window.GCAudio.play(name); } catch (_) { /* audio is optional */ }
    };

    /* ---------------- DATA ---------------- */

    const lootTable = [
        { name: "Dusty Syntax Cobweb",       rarity: "Common",    color: "#475569", chance: 50 },
        { name: "Vial of Red Ink",           rarity: "Uncommon",  color: "#b91c1c", chance: 25 },
        { name: "C1 Advanced Grimoire",      rarity: "Rare",      color: "#1d4ed8", chance: 15 },
        { name: "Tome of Mottola",           rarity: "Epic",      color: "#7e22ce", chance: 8 },
        { name: "Golden Chalk of Inversion", rarity: "Legendary", color: "#fbbf24", chance: 2 }
    ];

    // Keys are zero-based level indexes (4 = Floor 5, etc.)
    const milestonePrizes = {
        4:  { name: "Goblet of Huel Stamina",      emoji: "🍷",   desc: "Dark sustenance for endless midnight tutoring sessions." },
        9:  { name: "Trezor Vault of Souls",       emoji: "🗄️",  desc: "A cryptographically secure phylactery for your assets." },
        14: { name: "Obsidian Phantom Carriage",   emoji: "🦇",   desc: "A sleek E220d ghost coupe to traverse the foggy moors." },
        19: { name: "Pencil the Shadow Familiar",  emoji: "🐈‍⬛", desc: "A void-feline that purrs at the sight of C2-level syntax." },
        24: { name: "The Crown of Fluency",        emoji: "👑", desc: "You have mastered the Crypt. C2 Proficiency is yours." }
    };

    const TYPES = { w: 'wh-word', a: 'aux', s: 'subject', v: 'verb', o: 'object', p: 'punctuation', d: 'decoy', adv: 'adverb' };

    /**
     * patternArr: the slots shown on the board, in order: [typeKey, label]
     * blocksArr:  the runes, listed in CORRECT order, followed by any decoys ('d').
     *             The correct sentence is every non-decoy block, in listed order.
     */
    function createLevel(title, patternArr, blocksArr) {
        const pattern = patternArr.map(p => ({ type: TYPES[p[0]], label: p[1] }));
        const blocks  = blocksArr.map(b => ({ type: TYPES[b[0]], text: b[1] }));
        const answer  = blocks.filter(b => b.type !== TYPES.d);
        if (answer.length !== pattern.length) console.warn(`Level "${title}": ${pattern.length} slots but ${answer.length} answer runes.`);
        return { title, pattern, blocks, answer };
    }

    const levels = [
        createLevel("L1: A Simple Inquiry",        [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['p','?']], [['w','What'], ['a','Did'], ['s','She'], ['v','Say'], ['p','?'], ['d','Said']]),
        createLevel("L2: The Direct Approach",     [['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','They'], ['v','Win'], ['o','The Game'], ['p','?']]),
        createLevel("L3: Location Assessment",     [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['p','?']], [['w','Where'], ['a','Did'], ['s','He'], ['v','Hide'], ['p','?'], ['d','Hid']]),
        createLevel("L4: Temporal Inquiry",        [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['p','?']], [['w','When'], ['a','Did'], ['s','We'], ['v','Agree'], ['p','?']]),
        // Floor 5 - Prize 1
        createLevel("L5: Ongoing Past Action",     [['a','Aux'], ['s','Sub'], ['v','V-ing'], ['p','?']], [['a','Were'], ['s','They'], ['v','Arguing'], ['p','?'], ['d','Argued']]),
        createLevel("L6: Continuous State",        [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','V-ing'], ['p','?']], [['w','Why'], ['a','Was'], ['s','He'], ['v','Running'], ['p','?']]),
        createLevel("L7: Professional Scrutiny",   [['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','The Manager'], ['v','Approve'], ['o','The Budget'], ['p','?']]),
        createLevel("L8: Past Perfect Check",      [['a','Aux'], ['s','Sub'], ['v','V-PastPart'], ['adv','Adv'], ['p','?']], [['a','Had'], ['s','The Patient'], ['v','Recovered'], ['adv','Fully'], ['p','?']]),
        createLevel("L9: Corporate Strategy",      [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['p','?']], [['w','Why'], ['a','Did'], ['s','The Executive'], ['v','Resign'], ['p','?']]),
        // Floor 10 - Prize 2
        createLevel("L10: Duration of Action",     [['w','Wh'], ['a','Aux'], ['s','Sub'], ['a','Been'], ['v','V-ing'], ['p','?']], [['w','How Long'], ['a','Had'], ['s','You'], ['a','Been'], ['v','Waiting'], ['p','?']]),
        createLevel("L11: Medical Assessment",     [['a','Aux'], ['s','Sub'], ['adv','Adv'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','The Specialist'], ['adv','Quickly'], ['v','Review'], ['o','The Chart'], ['p','?']]),
        createLevel("L12: The Modal Past",         [['w','Wh'], ['a','Aux'], ['s','Sub'], ['a','Have'], ['v','V-PastPart'], ['p','?']], [['w','What'], ['a','Could'], ['s','They'], ['a','Have'], ['v','Done'], ['p','?']]),
        createLevel("L13: Conditional Speculation",[['a','Aux'], ['s','Sub'], ['a','Have'], ['v','V-PastPart'], ['adv','Adv'], ['p','?']], [['a','Would'], ['s','She'], ['a','Have'], ['v','Survived'], ['adv','Otherwise'], ['p','?']]),
        createLevel("L14: Past Perfect Passive",   [['a','Aux'], ['s','Sub'], ['a','Been'], ['v','V-PastPart'], ['p','?']], [['a','Had'], ['s','The Ledger'], ['a','Been'], ['v','Updated'], ['p','?'], ['d','Update']]),
        // Floor 15 - Prize 3
        createLevel("L15: Avoiding Consequences",  [['a','Aux'], ['s','Sub'], ['v','Verb'], ['adv','Lest'], ['s','Sub2'], ['v','Verb2'], ['p','?']], [['a','Did'], ['s','He'], ['v','Flee'], ['adv','Lest'], ['s','He'], ['v','Be Caught'], ['p','?']]),
        createLevel("L16: Analyzing Assets",       [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['p','?']], [['w','How'], ['a','Did'], ['s','Sony'], ['v','Value'], ['o','The Catalog'], ['p','?']]),
        createLevel("L17: Inversion Preview",      [['a','Had'], ['s','Sub'], ['v','V-PastPart'], ['o','Obj'], ['p','?']], [['a','Had'], ['s','The Board'], ['v','Realized'], ['o','The Error'], ['p','?']]),
        createLevel("L18: C1 Level Nuance",        [['a','Aux'], ['s','Sub'], ['adv','Adv'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','The Counsel'], ['adv','Deliberately'], ['v','Mislead'], ['o','The Jury'], ['p','?']]),
        createLevel("L19: C2 Proficiency Trial",   [['w','Wh'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['adv','Adv'], ['p','?']], [['w','Whom'], ['a','Did'], ['s','The Director'], ['v','Appoint'], ['o','As Successor'], ['adv','Ultimately'], ['p','?']]),
        // Floor 20 - Prize 4
        createLevel("L20: The Master's Final Test",[['a','Aux'], ['s','Sub'], ['adv','Adv'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','They'], ['adv','Scrupulously'], ['v','Examine'], ['o','The Transcript'], ['p','?']]),
        createLevel("L21: Negative Inversion (C1)",[['adv','Neg Adv'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['p','.']], [['adv','Never'], ['a','Had'], ['s','I'], ['v','Seen'], ['o','Such Chaos'], ['p','.'], ['d','Saw']]),
        createLevel("L22: Conditionals Without If",[['a','Aux'], ['s','Sub'], ['v','V-PastPart'], ['o','Obj'], ['adv','Result'], ['p','.']], [['a','Had'], ['s','He'], ['v','Known'], ['o','The Truth'], ['adv','He Would Have Fled'], ['p','.'], ['d','If']]),
        createLevel("L23: Only After Inversion",   [['adv','Only After'], ['s','Sub'], ['v','Verb'], ['a','Aux'], ['s','Sub2'], ['v','Verb2'], ['p','.']], [['adv','Only After'], ['s','She'], ['v','Left'], ['a','Did'], ['s','We'], ['v','Speak'], ['p','.']]),
        createLevel("L24: Cleft Sentence (C2)",    [['s','It'], ['v','Be'], ['adv','Phrase'], ['w','That'], ['s','Sub'], ['v','Verb'], ['p','.']], [['s','It'], ['v','Was'], ['adv','With Reluctance'], ['w','That'], ['s','They'], ['v','Agreed'], ['p','.']]),
        createLevel("L25: The Ultimate Syntax",    [['adv','Not Only'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['adv','But'], ['s','Sub2'], ['adv','Also'], ['v','Verb2'], ['p','.']], [['adv','Not Only'], ['a','Did'], ['s','He'], ['v','Fail'], ['adv','But'], ['s','He'], ['adv','Also'], ['v','Lied'], ['p','.']])
    ];

    /* ---------------- STATE (persisted) ---------------- */

    const SAVE_KEY = 'grammarCrypt.v1';
    const XP_PER_RANK = 100;
    const lastLevel = levels.length - 1;

    let state = { level: 0, gold: 0, xp: 0, streak: 0, playerName: '', playerEmail: '', inventory: [], completed: [] };
    let locked = false;          // true once the current floor is solved
    let targetedZone = null;     // tap-to-place: slot chosen by the player
    let draggedBlock = null;
    let lootTimer = null;
    let hintsUsed = 0;

    const tips = {
        'wh-word': 'A Wh-word opens a question and asks for information.',
        'aux': 'In a question, the auxiliary comes before the subject.',
        'subject': 'The subject is who or what does the action.',
        'verb': 'The verb follows the subject. Check its form: base, -ing or past participle.',
        'object': 'The object receives the action or completes the meaning.',
        'adverb': 'An adverb tells us how, when or to what degree.',
        'punctuation': 'A question always ends with a question mark.'
    };

    function loadState() {
        try {
            const raw = JSON.parse(localStorage.getItem(SAVE_KEY));
            if (!raw || typeof raw !== 'object') return;
            state.level     = Math.min(Math.max(parseInt(raw.level, 10) || 0, 0), lastLevel);
            state.gold      = Math.max(parseInt(raw.gold, 10) || 0, 0);
            state.xp        = Math.max(parseInt(raw.xp, 10) || 0, 0);
            state.streak    = Math.max(parseInt(raw.streak, 10) || 0, 0);
            state.playerName = raw.playerName || '';
            state.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(n => lootTable.some(l => l.name === n)) : [];
            state.completed = Array.isArray(raw.completed) ? raw.completed.filter(i => Number.isInteger(i) && i >= 0 && i <= lastLevel) : [];
        } catch (_) { /* corrupted or unavailable storage: start fresh */ }
    }

    function saveState() {
        try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (_) { /* private mode etc. */ }
    }

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

    function initLevel() {
        const level = levels[state.level];
        locked = false;
        targetedZone = null;
        hintsUsed = 0;
        if (tipEl) tipEl.textContent = '';
        refreshHud();
        $('quest-title').textContent = level.title;

        board.innerHTML = '';
        bank.innerHTML = '';
        nextBtn.disabled = true;
        nextBtn.textContent = 'Next Floor ➔';
        setStatus('Summon the sentence!', '');

        level.pattern.forEach((slot) => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.dataset.type = slot.type;
            zone.setAttribute('role', 'group');
            zone.setAttribute('aria-label', `Slot: ${slot.label}`);
            const label = document.createElement('span');
            label.className = 'slot-label';
            label.textContent = slot.label;
            zone.appendChild(label);
            board.appendChild(zone);
        });

        // Shuffle a copy (never mutate level data) and avoid starting already solved.
        let order = shuffle(level.blocks);
        for (let tries = 0; tries < 10 && order.every((b, i) => b === level.blocks[i]); tries++) order = shuffle(level.blocks);

        order.forEach((b, i) => {
            const block = document.createElement('div');
            block.className = `block ${b.type}`;
            block.id = `rune-${i}`;
            block.draggable = true;
            block.tabIndex = 0;
            block.setAttribute('role', 'button');
            block.dataset.type = b.type;
            block.dataset.text = b.text;
            block.textContent = b.text;
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

    function useHint() {
        if (locked) return;
        const slots = zones();
        const level = levels[state.level];
        const cost = hintsUsed === 0 ? 0 : 5;
        if (state.gold < cost) { 
            setStatus('Not enough gold for another hint (5 🪙).', 'error'); 
            return; 
        }
        
        const firstWrongIndex = slots.findIndex((z, i) => !blockIn(z) || blockIn(z).dataset.text !== level.answer[i].text);
        if (firstWrongIndex < 0) return;
        
        const expected = level.answer[firstWrongIndex];
        const block = Array.from(document.querySelectorAll('.block')).find(b => b.dataset.text === expected.text && !slots[firstWrongIndex].contains(b));
        if (block) { 
            block.classList.add('hint'); 
            setTimeout(() => block.classList.remove('hint'), 2600); 
        }
        
        state.gold -= cost; 
        hintsUsed++; 
        refreshHud(); 
        saveState();
        
        setStatus(`Rune ${firstWrongIndex + 1} is glowing!` + (cost ? ' (-5 🪙)' : ' (first hint is free)'), '');
        if (tipEl) tipEl.textContent = tips[level.pattern[firstWrongIndex].type] || '';
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
    }

    /* ---------------- VALIDATION ---------------- */

    function validateBoard() {
        const slots = zones();
        const level = levels[state.level];
        if (!slots.every(z => blockIn(z))) {
            if (!locked) setStatus('Summon the sentence!', '');
            return;
        }

        // Strict, position-by-position check against the answer key.
        const wrong = slots.filter((zone, i) => {
            const b = blockIn(zone);
            const expected = level.answer[i];
            return !(b.dataset.text === expected.text && b.dataset.type === expected.type);
        });

        if (wrong.length === 0) {
            solveLevel();
        } else {
            state.streak = 0;
            refreshHud();
            wrong.forEach(z => z.classList.add('wrong'));
            
            const firstWrongIndex = slots.indexOf(wrong[0]);
            const need = level.pattern[firstWrongIndex];
            const isDecoy = blockIn(wrong[0]).dataset.type === 'decoy';
            
            setStatus(`${wrong.length} rune${wrong.length > 1 ? 's' : ''} misplaced. ` + (isDecoy ? 'That one is a decoy!' : `Rune ${firstWrongIndex + 1} needs: ${need.label}.`), 'error');
            if (tipEl) tipEl.textContent = tips[need.type] || '';
            
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

    function solveLevel() {
        locked = true;
        board.querySelectorAll('.block').forEach(b => { b.classList.add('correct'); b.draggable = false; });
        bank.querySelectorAll('.block').forEach(b => { b.draggable = false; b.tabIndex = -1; });

        const isLast = state.level === lastLevel;
        const firstClear = !state.completed.includes(state.level);

        if (firstClear) {
            state.completed.push(state.level);
            state.streak++;
            const goldEarned = 15 + Math.min(state.streak - 1, 5) * 3;
            state.gold += goldEarned;
            state.xp += 20;
            
            showFloatingText('+' + goldEarned + ' 🪙', '#facc15', gold-counter);
            setTimeout(() => showFloatingText('+20 🔮', '#a855f7', xp-counter), 300);
            
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
        if (tipEl) tipEl.textContent = '✔ "' + levels[state.level].answer.map(a => a.text).join(' ').replace(/ \?/g, '?') + '"';
        sfx('success');

        nextBtn.disabled = false;
        nextBtn.textContent = isLast ? 'Restart Crypt ↺' : 'Next Floor ➔';

        if (firstClear) {
            const item = rollLoot();
            state.inventory.push(item.name);
            announceLoot(item);
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
        initLevel();
    }

    function restartCrypt() {
        state = { level: 0, gold: 0, xp: 0, streak: 0, playerName: state.playerName, inventory: [], completed: [] };
        saveState();
        updateInventoryUI();
        initLevel();
    }

    function nextLevel() {
        if (!locked) return;
        // After solving, state.level already points at the next floor (or stays on the last).
        const justSolvedLast = nextBtn.textContent.startsWith('Restart');
        if (justSolvedLast) { 
            const leadModal = $('lead-modal');
            if (leadModal) {
                // Populate the hidden score field so Gareth knows how they did
                if ($('lead-email-hidden')) $('lead-email-hidden').value = state.playerEmail;
                if ($('lead-score')) {
                    $('lead-score').value = `${state.playerName} - Gold: ${state.gold}, Streak: ${state.streak}`;
                }
                const leadHeading = $('lead-heading');
                const leadPara = leadModal.querySelector('p');
                if (state.streak >= 20) {
                    leadHeading.textContent = "Your Syntax is Flawless!";
                    leadPara.textContent = "You're ready for C1 Advanced or IELTS 8.0. Click below to claim your Grammar Crypt Certificate, and get a special 50% discount on a trial lesson to polish your speaking!";
                } else if (state.streak >= 10) {
                    leadHeading.textContent = "You Survived!";
                    leadPara.textContent = "Solid grammar, but a few cracks in the armor. Click below to reveal your final score and get a 50% discount on a trial lesson to fix those gaps.";
                } else {
                    leadHeading.textContent = "The Crypt Defeated You...";
                    leadPara.textContent = "Time for some targeted practice! Click below to get your score breakdown and book a 50% off trial lesson to level up your English.";
                    leadHeading.style.color = "#ef4444";
                }
                leadModal.classList.add('open');
                
                const form = $('lead-form');
                if (form && !form.dataset.bound) {
                    form.dataset.bound = "true";
                    form.addEventListener('submit', (e) => {
                        // After submit, let formsubmit redirect them back to the game page (or handle gracefully)
                        // By default, formsubmit will show a thank you and link back.
                        // We will set the _next field to the current URL with ?success=true
                        const nextField = form.querySelector('[name="_next"]');
                        if (nextField) nextField.value = window.location.href.split('?')[0] + '?success=true';
                    });
                }
                
                // If they've already submitted before and returned (success=true), just restart
                if (window.location.search.includes('success=true')) {
                    leadModal.classList.remove('open');
                    restartCrypt();
                }
            } else {
                restartCrypt(); 
            }
            return; 
        }
        initLevel();
    }

    /* ---------------- BOOT ---------------- */

    document.addEventListener('DOMContentLoaded', () => {
        loadState();
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
            
            const validateStart = () => {
                const n = nameInput.value.trim();
                const e = emailInput ? emailInput.value.trim() : '';
                startBtn.disabled = !(n.length > 0 && e.includes('@') && e.includes('.'));
            };
            
            nameInput.addEventListener('input', validateStart);
            if(emailInput) emailInput.addEventListener('input', validateStart);
            
            if(emailInput) emailInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
            });
            
            startBtn.addEventListener('click', () => {
                const name = nameInput.value.trim();
                const email = emailInput ? emailInput.value.trim() : '';
                if (name && email) {
                    state.playerName = name;
                    state.playerEmail = email;
                    saveState();
                    nameScreen.classList.remove('open');
                    refreshHud();
                    sfx('epic');
                }
            });
        }

        updateInventoryUI();
        initLevel();
    });
})();
