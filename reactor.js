(() => {
    'use strict';

    // --- 35 High-Frequency Cambridge C1/C2 Phrasal Verbs ---
    const allLevels = [
        {
            id: 1,
            def: "To abolish or get rid of an outdated rule, law, or system",
            verb: "DO",
            ans: "AWAY WITH",
            decoys: ["OUT OF", "DOWN ON", "UP WITH"],
            context: "The board voted unanimously to do away with paper expense claims before the new tax year.",
            modelNote: "3-part inseparable phrasal verb (do away with + noun). Frequently tested in Cambridge C1 Part 4 as the equivalent of 'abolish' or 'eliminate'."
        },
        {
            id: 2,
            def: "To use a reserve plan, skill, or savings when other options fail",
            verb: "FALL",
            ans: "BACK ON",
            decoys: ["BEHIND WITH", "THROUGH", "OUT WITH"],
            context: "When the research grant was delayed, Clara had to fall back on her emergency savings.",
            modelNote: "3-part inseparable phrasal verb (fall back on + noun). Contrast with 'fall behind with' (fail to keep level with payments or work)."
        },
        {
            id: 3,
            def: "To quickly revise or improve a skill you haven't used recently",
            verb: "BRUSH",
            ans: "UP ON",
            decoys: ["ASIDE", "OFF", "OVER"],
            context: "I need to brush up on my spoken Italian before next month's architectural symposium in Milan.",
            modelNote: "3-part inseparable phrasal verb (brush up on + subject/skill). High-value idiom for IELTS Speaking Part 1 and C1 essays on lifelong learning."
        },
        {
            id: 4,
            def: "To encounter serious difficulties, opposition, or legal obstacles",
            verb: "COME",
            ans: "UP AGAINST",
            decoys: ["UP WITH", "ACROSS", "ROUND TO"],
            context: "The coastal wind-farm proposal came up against fierce opposition from harbour authorities.",
            modelNote: "3-part inseparable phrasal verb (come up against + opposition/resistance/problems)."
        },
        {
            id: 5,
            def: "To be as good as expected or fulfil high standards",
            verb: "LIVE",
            ans: "UP TO",
            decoys: ["DOWN", "THROUGH", "ON"],
            context: "Despite the breathless publicity, the exhibition failed to live up to the critics' expectations.",
            modelNote: "Fixed C1 collocation: live up to + [someone's] expectations / reputation / promise."
        },
        {
            id: 6,
            def: "To finally find the time to do a task you have been delaying",
            verb: "GET",
            ans: "ROUND TO",
            decoys: ["AWAY WITH", "OUT OF", "THROUGH TO"],
            context: "I still haven't got round to proofreading the final chapter of the manuscript.",
            modelNote: "Pattern: get round to + Verb-ING / Noun. Because 'to' is a preposition here, any verb that follows MUST end in -ing."
        },
        {
            id: 7,
            def: "To reduce a wide list of possibilities to a few strong choices",
            verb: "NARROW",
            ans: "DOWN",
            decoys: ["OUT", "OFF", "UP"],
            context: "The selection committee has narrowed the shortlist down to three exceptional candidates.",
            modelNote: "Separable phrasal verb (narrow [something] down to...). Essential for decision-making contexts in Speaking Part 3."
        },
        {
            id: 8,
            def: "To gradually stop using a product, machine, or system over time",
            verb: "PHASE",
            ans: "OUT",
            decoys: ["IN", "OFF", "DOWN"],
            context: "The municipal council plans to phase out single-use plastics across all public venues by 2028.",
            modelNote: "Separable phrasal verb (phase out = gradually withdraw; phase in = gradually introduce)."
        },
        {
            id: 9,
            def: "To choose one person or thing from a group for special praise or criticism",
            verb: "SINGLE",
            ans: "OUT",
            decoys: ["UP", "OFF", "DOWN"],
            context: "The chief auditor singled out the Belfast logistics team for their spotless compliance record.",
            modelNote: "Often appears in the passive in C1 exams: 'be singled out for praise / criticism / attention'."
        },
        {
            id: 10,
            def: "To explain the cause of something or form a specific proportion of a total",
            verb: "ACCOUNT",
            ans: "FOR",
            decoys: ["TO", "ON", "WITH"],
            context: "Offshore wind turbines now account for nearly forty per cent of the region's electricity.",
            modelNote: "Dual C1 utility: (1) explain a discrepancy ('account for the missing funds'); (2) constitute a share in IELTS Task 1 data."
        },
        {
            id: 11,
            def: "To persuade someone to do something they were initially reluctant to do",
            verb: "TALK",
            ans: "INTO",
            decoys: ["OVER", "DOWN TO", "THROUGH"],
            context: "My colleagues eventually talked me into entering the regional photography competition.",
            modelNote: "Pattern: talk [someone] into + Verb-ING (persuade) vs talk [someone] out of + Verb-ING (dissuade)."
        },
        {
            id: 12,
            def: "To attribute a result, success, or problem to a particular cause",
            verb: "PUT",
            ans: "DOWN TO",
            decoys: ["UP WITH", "OFF", "THROUGH TO"],
            context: "Economists put the sudden dip in high-street spending down to unseasonably storms.",
            modelNote: "Separable C1/C2 frame: put [noun] down to [cause/noun/-ing] (= attribute to)."
        },
        {
            id: 13,
            def: "To tolerate or endure an unpleasant situation without complaining",
            verb: "PUT",
            ans: "UP WITH",
            decoys: ["ON", "DOWN TO", "OUT"],
            context: "Residents near the freight terminal refused to put up with overnight engine noise any longer.",
            modelNote: "3-part inseparable phrasal verb (put up with + noun/-ing) replacing formal 'tolerate' or 'endure'."
        },
        {
            id: 14,
            def: "To compensate for a past mistake, disappointment, or lost time",
            verb: "MAKE",
            ans: "UP FOR",
            decoys: ["OUT", "DO WITH", "OFF WITH"],
            context: "The hotel manager offered a complimentary dinner to make up for the mix-up with our booking.",
            modelNote: "3-part inseparable phrasal verb (make up for + noun). Frequently paired with 'lost time'."
        },
        {
            id: 15,
            def: "To think of or produce a new idea, solution, or financial sum",
            verb: "COME",
            ans: "UP WITH",
            decoys: ["ACROSS", "DOWN TO", "OUT IN"],
            context: "Our structural engineers came up with an ingenious way to reinforce the Victorian bridge.",
            modelNote: "3-part inseparable phrasal verb (come up with + a plan/idea/solution)."
        },
        {
            id: 16,
            def: "To regard someone with a feeling of superiority or contempt",
            verb: "LOOK",
            ans: "DOWN ON",
            decoys: ["UP TO", "INTO", "OVER"],
            context: "For decades, certain academic circles looked down on detective fiction as mere entertainment.",
            modelNote: "Contrast 'look down on' (despise/condescend) with 'look up to' (admire/respect)."
        },
        {
            id: 17,
            def: "To admit or confess openly that you are responsible for a mistake",
            verb: "OWN",
            ans: "UP TO",
            decoys: ["OUT OF", "DOWN ON", "OVER"],
            context: "Nobody in the laboratory was willing to own up to leaving the incubator unplugged.",
            modelNote: "Pattern: own up (intransitive) or own up to + Noun / Verb-ING ('to' is a preposition)."
        },
        {
            id: 18,
            def: "To accept and deal courageously with an unpleasant truth or problem",
            verb: "FACE",
            ans: "UP TO",
            decoys: ["OFF", "OUT OF", "DOWN"],
            context: "The board must finally face up to the fact that print advertising revenue is not returning.",
            modelNote: "Collocates strongly with 'responsibilities', 'the fact that', or 'reality'."
        },
        {
            id: 19,
            def: "To enforce rules much more strictly in order to stop illegal behaviour",
            verb: "CRACK",
            ans: "DOWN ON",
            decoys: ["UP", "OUT OF", "OVER"],
            context: "Aviation regulators have vowed to crack down on hidden baggage fees this summer.",
            modelNote: "3-part inseparable phrasal verb (crack down on + noun); forms the C1 compound noun 'a crackdown on'."
        },
        {
            id: 20,
            def: "To reduce spending on or consumption of something",
            verb: "CUT",
            ans: "BACK ON",
            decoys: ["OUT", "IN ON", "OFF"],
            context: "To fund the new library wing, the university had to cut back on administrative travel.",
            modelNote: "3-part inseparable phrasal verb (cut back on + noun) = reduce expenditure/intake."
        },
        {
            id: 21,
            def: "To temporarily take someone's place at work while they are absent",
            verb: "STAND",
            ans: "IN FOR",
            decoys: ["UP FOR", "OUT", "BY"],
            context: "Dr Mercier asked if I could stand in for her at Friday's doctoral viva.",
            modelNote: "Distinguish 'stand in for' (deputise/replace temporarily) from 'stand up for' (defend)."
        },
        {
            id: 22,
            def: "To exhaust the entire supply of something so that none remains",
            verb: "RUN",
            ans: "OUT OF",
            decoys: ["UP AGAINST", "DOWN", "OVER"],
            context: "The negotiators ran out of patience after six hours of circular procedural arguments.",
            modelNote: "Collocates with concrete supplies ('fuel') and abstract nouns ('time', 'patience', 'steam')."
        },
        {
            id: 23,
            def: "To escape punishment or detection for something wrong you have done",
            verb: "GET",
            ans: "AWAY WITH",
            decoys: ["ROUND TO", "THROUGH", "BY ON"],
            context: "How did the contractor get away with using substandard concrete for so many years?",
            modelNote: "Pattern: get away with + Noun / Verb-ING (= evade blame or penalty)."
        },
        {
            id: 24,
            def: "To move or progress at the same rapid pace as someone or something else",
            verb: "KEEP",
            ans: "UP WITH",
            decoys: ["ON AT", "DOWN", "BACK FROM"],
            context: "Small rural clinics often struggle to keep up with the pace of medical software updates.",
            modelNote: "3-part inseparable phrasal verb (keep up with + noun)."
        },
        {
            id: 25,
            def: "To investigate or examine the facts of a problem officially",
            verb: "LOOK",
            ans: "INTO",
            decoys: ["AFTER", "THROUGH", "OUT FOR"],
            context: "An independent committee has been appointed to look into the procurement irregularities.",
            modelNote: "Inseparable 2-part phrasal verb (look into + a complaint/matter/allegation)."
        },
        {
            id: 26,
            def: "To publicly demand action or require a specific skill or quality",
            verb: "CALL",
            ans: "FOR",
            decoys: ["OFF", "UP", "IN"],
            context: "Translating seventeenth-century legal charters calls for extraordinary historical precision.",
            modelNote: "Meaning 1: require/demand a quality; Meaning 2: publicly demand policy reform."
        },
        {
            id: 27,
            def: "To happen or prove to be in a particular way at the end, often unexpectedly",
            verb: "TURN",
            ans: "OUT",
            decoys: ["DOWN", "UP", "OVER"],
            context: "The dusty violin in the attic turned out to be an authentic eighteenth-century instrument.",
            modelNote: "Common C1 Part 4 patterns: 'turn out to be...' or 'It turned out that...'."
        },
        {
            id: 28,
            def: "To cause something new to happen, especially a major social or policy change",
            verb: "BRING",
            ans: "ABOUT",
            decoys: ["UP", "OUT", "ROUND"],
            context: "High-speed rail links have brought about a dramatic revival in the town's economy.",
            modelNote: "Replaces 'cause' or 'lead to' in formal Cambridge C1/C2 essays."
        },
        {
            id: 29,
            def: "To postpone an event to a later date or deter someone from doing something",
            verb: "PUT",
            ans: "OFF",
            decoys: ["ON", "OUT", "AWAY"],
            context: "Never put off revising your C1 inversions until the night before the examination.",
            modelNote: "Pattern 1: put off + Verb-ING (postpone); Pattern 2: put [someone] off + Verb-ING (discourage)."
        },
        {
            id: 30,
            def: "To discover something or meet someone unexpectedly by chance",
            verb: "COME",
            ans: "ACROSS",
            decoys: ["INTO", "OVER", "ROUND"],
            context: "While indexing the parish archives, I came across a bundle of unpublished letters.",
            modelNote: "Inseparable (come across + noun). Contrast with 'come across as' (make an impression)."
        },
        {
            id: 31,
            def: "To accept extra work and responsibility or employ new staff",
            verb: "TAKE",
            ans: "ON",
            decoys: ["OVER", "UP", "AFTER"],
            context: "Our legal department is taking on three additional paralegals to handle the merger.",
            modelNote: "Separable phrasal verb: take on + staff / extra workload / a challenge."
        },
        {
            id: 32,
            def: "To establish a new company, committee, or research programme",
            verb: "SET",
            ans: "UP",
            decoys: ["OFF", "OUT", "ASIDE"],
            context: "The charity was set up in 2019 to preserve endangered maritime dialects.",
            modelNote: "Separable phrasal verb replacing 'establish' or 'found'; forms the noun 'setup'."
        },
        {
            id: 33,
            def: "To introduce a delicate subject into a conversation or raise a child",
            verb: "BRING",
            ans: "UP",
            decoys: ["OUT", "ABOUT", "FORWARD"],
            context: "I wouldn't bring up the contract renegotiation until the quarterly figures are confirmed.",
            modelNote: "Separable (bring a topic up / bring it up)."
        },
        {
            id: 34,
            def: "To reject or refuse an offer, invitation, or formal application",
            verb: "TURN",
            ans: "DOWN",
            decoys: ["OFF", "AWAY", "BACK"],
            context: "Liam turned down the consultancy offer in Frankfurt because he preferred working from Belfast.",
            modelNote: "Separable (turn down an offer / turn it down)."
        },
        {
            id: 35,
            def: "To calculate an amount or devise a successful solution to a complex problem",
            verb: "WORK",
            ans: "OUT",
            decoys: ["UP", "ON", "OVER"],
            context: "Investigators still haven't worked out how the intruders bypassed the biometric lock.",
            modelNote: "Followed by a noun phrase or an embedded wh-clause (work out how/why/what...)."
        }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');

    const introModeMeltdownBtn = document.getElementById('intro-mode-meltdown');
    const introModeLabBtn = document.getElementById('intro-mode-lab');
    const introCount10Btn = document.getElementById('intro-count-10');
    const introCount35Btn = document.getElementById('intro-count-35');

    const liveModeToggleBtn = document.getElementById('btn-live-mode-toggle');
    const liveModeTextEl = document.getElementById('live-mode-text');
    const revealCambridgeBtn = document.getElementById('btn-reveal-cambridge');
    const targetTotalDisplay = document.getElementById('target-total-display');
    const coreProgressTag = document.getElementById('core-progress-tag');

    const defEl = document.getElementById('target-definition');
    const verbEl = document.getElementById('base-verb');
    const particlesContainer = document.querySelector('.particles-container');
    const particles = Array.from(document.querySelectorAll('.particle'));
    const scoreEl = document.getElementById('score-display');
    const timerBar = document.getElementById('timer-bar');

    const c1ContextCard = document.getElementById('c1-context-card');
    const c1CardVerbBadge = document.getElementById('c1-card-verb-badge');
    const c1CardStatus = document.getElementById('c1-card-status');
    const c1ContextSentence = document.getElementById('c1-context-sentence');
    const c1GrammarNote = document.getElementById('c1-grammar-note');
    const nextCoreBtn = document.getElementById('btn-next-core');

    // --- State ---
    let levels = [];
    let currentLevel = 0;
    let score = 0;
    let sessionSize = 10;
    let isUntimedLab = false;
    let timeLeft = 100; // Percentage
    let gameLoop = null;
    let lastTickTime = 0;
    let isActive = false;

    // --- Mode & Count Controls in Intro ---
    if (introModeMeltdownBtn && introModeLabBtn) {
        introModeMeltdownBtn.addEventListener('click', () => {
            isUntimedLab = false;
            introModeMeltdownBtn.classList.add('active');
            introModeLabBtn.classList.remove('active');
        });
        introModeLabBtn.addEventListener('click', () => {
            isUntimedLab = true;
            introModeLabBtn.classList.add('active');
            introModeMeltdownBtn.classList.remove('active');
        });
    }

    if (introCount10Btn && introCount35Btn) {
        introCount10Btn.addEventListener('click', () => {
            sessionSize = 10;
            introCount10Btn.classList.add('active');
            introCount35Btn.classList.remove('active');
        });
        introCount35Btn.addEventListener('click', () => {
            sessionSize = 35;
            introCount35Btn.classList.add('active');
            introCount10Btn.classList.remove('active');
        });
    }

    // --- Live Mode Toggle in Header ---
    if (liveModeToggleBtn) {
        liveModeToggleBtn.addEventListener('click', () => {
            isUntimedLab = !isUntimedLab;
            syncModeHud();
        });
    }

    function syncModeHud() {
        clearInterval(gameLoop);
        if (isUntimedLab) {
            if (liveModeTextEl) liveModeTextEl.textContent = 'TRAINING LAB (UNTIMED)';
            timeLeft = 100;
            renderTimerBar();
        } else {
            if (liveModeTextEl) liveModeTextEl.textContent = 'MELTDOWN (TIMED)';
            lastTickTime = performance.now();
            gameLoop = setInterval(updateTimer, 50);
        }
    }

    // --- Init (Instant Play — No Forced Sign-Up Gate) ---
    startBtn.disabled = false;
    const handleEnterStart = (e) => {
        if (e.key === 'Enter' && startModal.classList.contains('open')) {
            e.preventDefault();
            startBtn.click();
        }
    };
    if (nameInput) nameInput.addEventListener('keydown', handleEnterStart);
    if (emailInput) emailInput.addEventListener('keydown', handleEnterStart);

    startBtn.addEventListener('click', () => {
        startModal.classList.remove('open');
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        endModal.classList.remove('open');
        startGame();
    });

    // Event delegation on particle options container
    if (particlesContainer) {
        particlesContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.particle');
            if (!btn || !isActive) return;
            const lvl = levels[currentLevel];
            if (lvl) {
                const chosenParticle = btn.dataset.particle;
                handleGuess(chosenParticle === lvl.ans, chosenParticle, lvl);
            }
        });
    }

    // Reveal Cambridge Model Button
    if (revealCambridgeBtn) {
        revealCambridgeBtn.addEventListener('click', () => {
            const lvl = levels[currentLevel];
            if (!lvl || !c1ContextCard) return;
            if (c1ContextCard.classList.contains('hidden')) {
                populateContextCard(lvl, 'CAMBRIDGE C1/C2 MODEL REVEALED');
            } else {
                c1ContextCard.classList.add('hidden');
            }
        });
    }

    if (nextCoreBtn) {
        nextCoreBtn.addEventListener('click', () => {
            currentLevel++;
            isActive = true;
            loadLevel();
        });
    }

    function populateContextCard(lvl, statusLabel) {
        if (!c1ContextCard || !lvl) return;
        if (c1CardVerbBadge) c1CardVerbBadge.textContent = `${lvl.verb} ${lvl.ans}`;
        if (c1CardStatus) c1CardStatus.textContent = statusLabel || 'CAMBRIDGE C1/C2 MODEL';
        if (c1ContextSentence) c1ContextSentence.textContent = `"${lvl.context}"`;
        if (c1GrammarNote) c1GrammarNote.textContent = `Gareth's Note: ${lvl.modelNote}`;
        c1ContextCard.classList.remove('hidden');
    }

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function startGame() {
        levels = shuffle([...allLevels]).slice(0, sessionSize);
        currentLevel = 0;
        score = 0;
        timeLeft = 100;
        isActive = true;
        if (targetTotalDisplay) targetTotalDisplay.textContent = String(levels.length);
        updateScore();
        loadLevel();
        renderTimerBar();
        syncModeHud();
    }

    function loadLevel() {
        if (currentLevel >= levels.length) {
            endGame(true);
            return;
        }

        const lvl = levels[currentLevel];
        if (coreProgressTag) {
            coreProgressTag.textContent = `CORE #${String(currentLevel + 1).padStart(2, '0')} OF ${levels.length} // C1/C2 PARTICLE CONTAINMENT`;
        }
        defEl.textContent = lvl.def.toUpperCase();
        verbEl.textContent = lvl.verb;
        verbEl.className = 'core pulse';

        if (c1ContextCard) c1ContextCard.classList.add('hidden');

        const options = shuffle([lvl.ans, ...lvl.decoys]);
        particles.forEach((p, i) => {
            p.textContent = options[i];
            p.dataset.particle = options[i];
        });
    }

    function handleGuess(isCorrect, chosenParticle, lvl) {
        if (!isActive) return;

        const currentLvl = lvl || levels[currentLevel];
        if (currentLvl) {
            const promptText = `${currentLvl.def} (${currentLvl.verb} + ___)`;
            const targetPhrasal = `${currentLvl.verb} ${currentLvl.ans}`;
            const chosenPhrasal = chosenParticle ? `${currentLvl.verb} ${chosenParticle}` : '';
            const explanationText = `"${targetPhrasal}" means "${currentLvl.def.toLowerCase()}". Context: ${currentLvl.context}`;
            window.CandidateDossier?.recordAttempt({
                category: 'phrasal_verbs',
                correct: isCorrect,
                game: 'Phrasal Reactor',
                prompt: promptText,
                targetAnswer: targetPhrasal,
                userAttempt: chosenPhrasal,
                explanation: explanationText
            });
        }

        if (isCorrect) {
            verbEl.className = 'core success';
            score++;
            updateScore();
            isActive = false;
            populateContextCard(currentLvl, 'CORE STABILISED // C1 MODEL');

            if (!isUntimedLab) {
                timeLeft = Math.min(100, timeLeft + 10);
                renderTimerBar();
                setTimeout(() => {
                    currentLevel++;
                    isActive = true;
                    loadLevel();
                }, 1400);
            }
        } else {
            verbEl.className = 'core error';
            if (isUntimedLab) {
                populateContextCard(currentLvl, `CHECK MODEL: ${currentLvl.verb} ${currentLvl.ans}`);
                setTimeout(() => {
                    if (isActive) verbEl.className = 'core pulse';
                }, 400);
            } else {
                timeLeft = Math.max(0, timeLeft - 15); // Penalty
                renderTimerBar();
                if (timeLeft <= 0) {
                    endGame(false);
                    return;
                }
                setTimeout(() => {
                    if (isActive) verbEl.className = 'core pulse';
                }, 300);
            }
        }
    }

    function updateScore() {
        scoreEl.textContent = String(score);
    }

    function renderTimerBar() {
        timerBar.style.width = Math.max(0, timeLeft) + '%';
        if (isUntimedLab) {
            timerBar.style.backgroundColor = 'var(--success)';
        } else if (timeLeft > 50) {
            timerBar.style.backgroundColor = 'var(--core)';
        } else if (timeLeft > 20) {
            timerBar.style.backgroundColor = '#f59e0b';
        } else {
            timerBar.style.backgroundColor = 'var(--danger)';
        }
    }

    function updateTimer() {
        if (!isActive || isUntimedLab) return;

        const now = performance.now();
        const deltaMs = lastTickTime ? (now - lastTickTime) : 50;
        lastTickTime = now;

        // 100% deplete rate equivalent to ~55s base time
        timeLeft -= deltaMs * 0.0018;
        if (timeLeft <= 0) {
            timeLeft = 0;
            renderTimerBar();
            endGame(false);
            return;
        }

        renderTimerBar();
    }

    function endGame(won) {
        isActive = false;
        clearInterval(gameLoop);
        lastTickTime = 0;

        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');
        const total = levels.length || sessionSize;

        if (won && score >= Math.ceil(total * 0.85)) {
            title.textContent = "REACTOR STABILISED";
            title.style.color = "var(--success)";
            desc.textContent = "Outstanding reflexes, Agent. You have mastered high-level C1/C2 particle collocations. Ready to test your spoken fluency and writing with me?";
        } else if (won) {
            title.textContent = "CORE STABILISED (MARGINAL)";
            title.style.color = "#f59e0b";
            desc.textContent = "Phrasal verbs and dependent prepositions are the most frequent area where C1/C2 and IELTS candidates lose marks.";
        } else {
            title.textContent = "MELTDOWN OCCURRED";
            title.style.color = "var(--danger)";
            desc.textContent = "The core collapsed under unstable syntax. Try Untimed Training Lab mode or book a 1-to-1 diagnostic to map out your study plan.";
        }

        document.getElementById('final-score').textContent = `${score}/${total}`;
        document.getElementById('lead-score').value = `Phrasal Reactor - Score: ${score}/${total}`;
        document.getElementById('lead-email').value = emailInput ? emailInput.value.trim() : '';
        document.getElementById('lead-name').value = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Reactor Agent';

        endModal.classList.add('open');

        if (typeof window.showDiagnosticGate === 'function') {
            setTimeout(() => {
                window.showDiagnosticGate({
                    gameName: 'Phrasal Reactor',
                    score: score,
                    maxScore: total,
                    weakArea: 'C1 Particle Precision & Phrasal Collocations under Time Pressure',
                    examImpact: 'In Cambridge C1/C2 Use of English (Parts 1-4) and IELTS Speaking Part 3, hesitation on phrasal particles drops your Lexical Resource score from Band 7.5 to 6.5.',
                    onReplay: () => {
                        endModal.classList.remove('open');
                        startBtn.click();
                    }
                });
            }, 600);
        }
    }

})();
