(() => {
    'use strict';

    // --- Data ---
    const allLevels = [
        { def: "To suddenly start crying", verb: "BREAK", ans: "DOWN", decoys: ["OUT", "UP", "IN"] },
        { def: "To invent a story or excuse", verb: "MAKE", ans: "UP", decoys: ["OUT", "FOR", "OFF"] },
        { def: "To postpone or delay something", verb: "PUT", ans: "OFF", decoys: ["ON", "UP WITH", "OUT"] },
        { def: "To tolerate something unpleasant", verb: "PUT", ans: "UP WITH", decoys: ["ON", "DOWN", "OFF"] },
        { def: "To faint or lose consciousness", verb: "PASS", ans: "OUT", decoys: ["AWAY", "ON", "OVER"] },
        { def: "To mention something in conversation", verb: "BRING", ans: "UP", decoys: ["OUT", "ABOUT", "DOWN"] },
        { def: "To happen unexpectedly", verb: "COME", ans: "UP", decoys: ["ACROSS", "OVER", "DOWN WITH"] },
        { def: "To discover by chance", verb: "COME", ans: "ACROSS", decoys: ["UP WITH", "INTO", "DOWN TO"] },
        { def: "To cancel an event", verb: "CALL", ans: "OFF", decoys: ["OUT", "UP", "ON"] },
        { def: "To reject an offer", verb: "TURN", ans: "DOWN", decoys: ["OUT", "OFF", "AWAY"] },
        { def: "To resolve or calculate something", verb: "WORK", ans: "OUT", decoys: ["UP", "THROUGH", "ON"] },
        { def: "To compensate for something", verb: "MAKE", ans: "UP FOR", decoys: ["OUT", "DO WITH", "OFF WITH"] }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    
    const defEl = document.getElementById('target-definition');
    const verbEl = document.getElementById('base-verb');
    const particlesContainer = document.querySelector('.particles-container');
    const particles = Array.from(document.querySelectorAll('.particle'));
    const scoreEl = document.getElementById('score-display');
    const timerBar = document.getElementById('timer-bar');

    // --- State ---
    let levels = [];
    let currentLevel = 0;
    let score = 0;
    let timeLeft = 100; // Percentage
    let gameLoop;
    let lastTickTime = 0;
    let isActive = false;

    // --- Init ---
    const validateStart = () => {
        const n = nameInput.value.trim();
        const e = emailInput.value.trim();
        startBtn.disabled = !(n.length > 0 && e.includes('@') && e.includes('.'));
    };
    nameInput.addEventListener('input', validateStart);
    emailInput.addEventListener('input', validateStart);

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
                handleGuess(btn.dataset.particle === lvl.ans);
            }
        });
    }

    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex != 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function startGame() {
        levels = shuffle([...allLevels]).slice(0, 10); // Pick 10 random
        currentLevel = 0;
        score = 0;
        timeLeft = 100;
        isActive = true;
        updateScore();
        loadLevel();
        renderTimerBar();
        
        clearInterval(gameLoop);
        lastTickTime = performance.now();
        gameLoop = setInterval(updateTimer, 50);
    }

    function loadLevel() {
        if (currentLevel >= levels.length) {
            endGame(true);
            return;
        }

        const lvl = levels[currentLevel];
        defEl.textContent = lvl.def.toUpperCase();
        verbEl.textContent = lvl.verb;
        verbEl.className = 'core pulse';

        let options = shuffle([lvl.ans, ...lvl.decoys]);
        
        particles.forEach((p, i) => {
            p.textContent = options[i];
            p.dataset.particle = options[i];
        });
    }

    function handleGuess(isCorrect) {
        if (!isActive) return;

        if (isCorrect) {
            verbEl.className = 'core success';
            score++;
            updateScore();
            isActive = false;
            setTimeout(() => {
                currentLevel++;
                isActive = true;
                loadLevel();
            }, 600);
        } else {
            verbEl.className = 'core error';
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

    function updateScore() {
        scoreEl.textContent = score;
    }

    function renderTimerBar() {
        timerBar.style.width = Math.max(0, timeLeft) + '%';
        if (timeLeft > 50) {
            timerBar.style.backgroundColor = 'var(--core)';
        } else if (timeLeft > 20) {
            timerBar.style.backgroundColor = '#f59e0b'; // warning
        } else {
            timerBar.style.backgroundColor = 'var(--danger)';
        }
    }

    function updateTimer() {
        if (!isActive) return;
        
        const now = performance.now();
        const deltaMs = lastTickTime ? (now - lastTickTime) : 50;
        lastTickTime = now;

        // 100% deplete rate equivalent to ~50s base time (0.002% per ms)
        timeLeft -= deltaMs * 0.002;
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
        
        if (won && score >= 9) {
            title.textContent = "REACTOR STABILISED";
            title.style.color = "var(--success)";
            desc.textContent = "Outstanding reflexes, Agent. You have mastered high-level particle collocations. Ready to test your spoken fluency and writing with Gareth?";
        } else if (won) {
            title.textContent = "CORE STABILISED (MARGINAL)";
            title.style.color = "#f59e0b";
            desc.textContent = "Scored under 9/10? Phrasal verbs and prepositions are the most frequent area where C1/C2 and IELTS candidates lose marks.";
        } else {
            title.textContent = "MELTDOWN OCCURRED";
            title.style.color = "var(--danger)";
            desc.textContent = "The core collapsed under unstable syntax. In our 1-to-1 sessions, we diagnose your exact grammar hurdles and give you a structured study roadmap.";
        }
        
        document.getElementById('final-score').textContent = score + "/10";
        document.getElementById('lead-score').value = `Phrasal Reactor - Score: ${score}/10`;
        document.getElementById('lead-email').value = emailInput.value.trim();
        document.getElementById('lead-name').value = nameInput.value.trim();
        
        endModal.classList.add('open');

        if (typeof window.showDiagnosticGate === 'function') {
            setTimeout(() => {
                window.showDiagnosticGate({
                    gameName: 'Phrasal Reactor',
                    score: score,
                    maxScore: 10,
                    weakArea: 'C1 Particle Precision & Phrasal Collocations under Time Pressure',
                    examImpact: 'In Cambridge C1/C2 Use of English (Parts 1–4) and IELTS Speaking Part 3, hesitation on phrasal particles drops your Lexical Resource score from Band 7.5 to 6.5.',
                    onReplay: () => {
                        endModal.classList.remove('open');
                        btnStart.click();
                    }
                });
            }, 600);
        }
    }

})();
