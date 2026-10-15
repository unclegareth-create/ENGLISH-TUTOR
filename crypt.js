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

    const sfx = (name, arg) => {
        try { if (window.GCAudio) window.GCAudio.play(name, arg); } catch (_) { /* audio is optional */ }
        if (name === 'grab' || name === 'drop') vibrate(15);
        else if (name === 'success') vibrate([30, 40, 60]);
        else if (name === 'error') vibrate([50, 50, 50]);
        else if (name === 'loot' || name === 'milestone') vibrate([40, 50, 40, 50, 80]);
        else if (name === 'boss') vibrate([60, 50, 60, 50, 100]);
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

            const bosses = {
        4: { name: "The Goblin of Gerunds", emoji: "👺", taunt: "You'll never master the -ing form, mortal!" },
        9: { name: "Phantom of the Past Perfect", emoji: "👻", taunt: "I had already won before you even arrived!" },
        14: { name: "Vampire of the Passive Voice", emoji: "🧛", taunt: "Your active sentences will be drained of life!" },
        19: { name: "Inquisitor of Inversion", emoji: "🧙‍♂️", taunt: "Seldom have I seen such weak syntax!" },
        24: { name: "The Syntax Dragon (C2)", emoji: "🐉", taunt: "Only absolute perfection will pierce my scales." }
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
        createLevel("L19: C2 Proficiency Trial",   [['w','Wh'], ['a','Aux'], ['s','Sub'], ['adv','Adv'], ['v','Verb'], ['o','Obj'], ['p','?']], [['w','Whom'], ['a','Did'], ['s','The Director'], ['adv','Ultimately'], ['v','Appoint'], ['o','As Successor'], ['p','?']]),
        // Floor 20 - Prize 4
        createLevel("L20: The Master's Final Test",[['a','Aux'], ['s','Sub'], ['adv','Adv'], ['v','Verb'], ['o','Obj'], ['p','?']], [['a','Did'], ['s','They'], ['adv','Scrupulously'], ['v','Examine'], ['o','The Transcript'], ['p','?']]),
        createLevel("L21: Negative Inversion (C1)",[['adv','Neg Adv'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['o','Obj'], ['p','.']], [['adv','Never'], ['a','Had'], ['s','I'], ['v','Seen'], ['o','Such Chaos'], ['p','.'], ['d','Saw']]),
        createLevel("L22: Conditionals Without If",[['a','Aux'], ['s','Sub'], ['v','V-PastPart'], ['o','Obj'], ['adv','Result'], ['p','.']], [['a','Had'], ['s','He'], ['v','Known'], ['o','The Truth'], ['adv','He Would Have Fled'], ['p','.'], ['d','If']]),
        createLevel("L23: Only After Inversion",   [['adv','Only After'], ['s','Sub'], ['v','Verb'], ['a','Aux'], ['s','Sub2'], ['v','Verb2'], ['p','.']], [['adv','Only After'], ['s','She'], ['v','Left'], ['a','Did'], ['s','We'], ['v','Speak'], ['p','.']]),
        createLevel("L24: Cleft Sentence (C2)",    [['s','It'], ['v','Be'], ['adv','Phrase'], ['w','That'], ['s','Sub'], ['v','Verb'], ['p','.']], [['s','It'], ['v','Was'], ['adv','With Reluctance'], ['w','That'], ['s','They'], ['v','Agreed'], ['p','.']]),
        createLevel("L25: The Ultimate Syntax",    [['adv','Not Only'], ['a','Aux'], ['s','Sub'], ['v','Verb'], ['adv','But'], ['s','Sub2'], ['adv','Also'], ['v','Verb2'], ['p','.']], [['adv','Not Only'], ['a','Did'], ['s','He'], ['v','Fail'], ['adv','But'], ['s','He'], ['adv','Also'], ['v','Lied'], ['p','.']])
    ];

    const explain = {
        0: "After a Wh-word comes did, then the subject, then the BASE verb (say, not said).",
        1: "Yes/no questions: did + subject + base verb + object.",
        2: "Did already shows the past, so the main verb stays in the base form: hide, not hid.",
        3: "Time questions: When + auxiliary + subject + base verb.",
        4: "Past continuous questions: was/were + subject + verb-ing.",
        5: "Why + was/were + subject + verb-ing: the auxiliary still comes before the subject.",
        6: "The object follows the verb: did + subject + base verb + object.",
        7: "Past perfect: had + subject + past participle. Adverbs like fully follow the participle.",
        8: "Why + did + subject + base verb: the subject stays before the verb.",
        9: "How long + had + subject + been + verb-ing asks about duration up to a past moment.",
        10: "Mid-position adverbs sit between the subject and the main verb.",
        11: "Modal + have + past participle talks about uncertain or unreal past events.",
        12: "Would have + past participle speculates about a different past.",
        13: "Passive past perfect: had + subject + been + past participle.",
        14: "Lest introduces a precaution and takes a subjunctive-style verb: lest he be caught.",
        15: "How + did + subject + base verb + object.",
        16: "Had can open a question like any auxiliary: had + subject + past participle.",
        17: "Manner adverbs usually sit before the main verb: deliberately mislead.",
        18: "Whom asks about the object. Auxiliary and subject still precede the verb; the adverb goes before the main verb.",
        19: "Same pattern as a normal yes/no question, with the adverb before the verb.",
        20: "A negative adverb at the start forces inversion: Never had I seen...",
        21: "Dropping 'if' inverts the auxiliary: Had he known = If he had known.",
        22: "Only after + clause is followed by inversion in the main clause: did we speak.",
        23: "A cleft sentence puts focus on a phrase: It was ___ that ...",
        24: "Not only + inversion, then but ... also."
    };

    /* ---------------- STATE (persisted) ---------------- */

    const SAVE_KEY = 'grammarCrypt.v1';
    const XP_PER_RANK = 100;
    const lastLevel = levels.length - 1;

    let state = { level: 0, gold: 0, xp: 0, streak: 0, playerName: '', playerEmail: '', perfect: 0, leadSent: false, inventory: [], completed: [] };
    let locked = false;          // true once the current floor is solved
    let targetedZone = null;     // tap-to-place: slot chosen by the player
    let draggedBlock = null;
    let lootTimer = null;
    let hintsUsed = 0;
    let levelMistakes = 0;
    let hintLevel = -1;       // hints/mistakes persist across Reset on the same floor (no free-hint farming)

    const tips = {
        'wh-word': 'A Wh-word opens a question and asks for information.',
        'aux': 'In a question, the auxiliary comes before the subject.',
        'subject': 'The subject is who or what does the action.',
        'verb': 'The verb follows the subject. Check its form: base, -ing or past participle.',
        'object': 'The object receives the action or completes the meaning.',
        'adverb': 'An adverb tells us how, when or to what degree.',
        'punctuation': 'End with the right punctuation: ? for a question, . for a statement.'
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
            state.playerEmail = typeof raw.playerEmail === 'string' ? raw.playerEmail : '';
            state.perfect   = Math.max(parseInt(raw.perfect, 10) || 0, 0);
            state.leadSent  = !!raw.leadSent;
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
            levelMistakes++;
            wrong.slice(0, 1).forEach(z => z.classList.add('wrong'));   // only the first error: no solving by elimination
            
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
        if (tipEl) tipEl.textContent = '✔ "' + levels[state.level].answer.map(a => a.text).join(' ').replace(/ ([?.])/g, '$1') + '" ' + (explain[state.level] || '');
        sfx('success', state.streak);

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
        state = { level: 0, gold: 0, xp: 0, streak: 0, playerName: state.playerName, playerEmail: state.playerEmail, perfect: 0, leadSent: state.leadSent, inventory: [], completed: [] };
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

    /* ---------------- BOOT ---------------- */

    document.addEventListener('DOMContentLoaded', () => {
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
            
            const validateStart = () => {
                const n = nameInput.value.trim();
                const e = emailInput ? emailInput.value.trim() : '';
                startBtn.disabled = !(n.length > 0 && (e === '' || emailInput.checkValidity()));
            };
            
            nameInput.addEventListener('input', validateStart);
            if(emailInput) emailInput.addEventListener('input', validateStart);
            
            if(emailInput) emailInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !startBtn.disabled) startBtn.click();
            });
            
            startBtn.addEventListener('click', () => {
                const name = nameInput.value.trim();
                const email = emailInput ? emailInput.value.trim() : '';
                if (name) {
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
        if (justSubmitted) {
            setStatus(`Thanks, ${state.playerName}! Use code ${DISCOUNT_CODE} for 50% off your trial lesson.` + (BOOKING_URL ? ' Book at ' + BOOKING_URL : '') + ' Descend again?', 'success');
        }
    });
})();
