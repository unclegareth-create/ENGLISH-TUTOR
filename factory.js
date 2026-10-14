(() => {
    'use strict';

    // --- Data ---
    const allWords = [
        { root: "DESTROY", req: "NOUN", ans: "DESTRUCTION" },
        { root: "SUCCEED", req: "ADJECTIVE", ans: "SUCCESSFUL" },
        { root: "APPROVE", req: "NOUN (NEGATIVE)", ans: "DISAPPROVAL" },
        { root: "CARE", req: "ADVERB", ans: "CAREFULLY" },
        { root: "NATURE", req: "ADVERB", ans: "NATURALLY" },
        { root: "EXPECT", req: "NOUN", ans: "EXPECTATION" },
        { root: "FRIEND", req: "ADJECTIVE (NEGATIVE)", ans: "UNFRIENDLY" },
        { root: "RELY", req: "ADJECTIVE", ans: "RELIABLE" },
        { root: "DAY", req: "ADVERB", ans: "DAILY" },
        { root: "DANGER", req: "ADJECTIVE", ans: "DANGEROUS" },
        { root: "PRODUCE", req: "NOUN", ans: "PRODUCTION" },
        { root: "PROBABLE", req: "ADVERB (NEGATIVE)", ans: "IMPROBABLY" },
        { root: "SIGNIFY", req: "NOUN", ans: "SIGNIFICANCE" },
        { root: "LOGIC", req: "ADVERB (NEGATIVE)", ans: "ILLOGICALLY" },
        { root: "SATISFY", req: "ADJECTIVE (NEGATIVE)", ans: "DISSATISFIED" }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    
    const targetFormEl = document.getElementById('target-form');
    const rootWordEl = document.getElementById('root-word');
    const blockEl = document.getElementById('word-block');
    const beltEl = document.querySelector('.belt');
    const typingInput = document.getElementById('typing-input');
    
    const scoreEl = document.getElementById('score-display');
    const livesEl = document.getElementById('lives-display');

    // --- State ---
    let queue = [];
    let currentWord = null;
    let score = 0;
    let lives = 3;
    let isActive = false;
    let blockPos = 0; // percentage
    let speed = 0.15; // percentage per frame
    let gameLoopReq;

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
        queue = shuffle([...allWords]).slice(0, 10);
        score = 0;
        lives = 3;
        speed = 0.15;
        isActive = true;
        
        updateHud();
        typingInput.value = '';
        typingInput.disabled = false;
        typingInput.focus();
        beltEl.classList.remove('paused');
        
        nextWord();
    }

    function updateHud() {
        scoreEl.textContent = score;
        livesEl.textContent = "⚙️".repeat(lives);
    }

    function nextWord() {
        if (lives <= 0) {
            endGame(false);
            return;
        }
        if (queue.length === 0) {
            endGame(true);
            return;
        }

        currentWord = queue.shift();
        targetFormEl.textContent = currentWord.req;
        rootWordEl.textContent = currentWord.root;
        
        blockPos = 0;
        blockEl.style.left = '0%';
        blockEl.className = 'block';
        
        typingInput.value = '';
        typingInput.className = '';
        typingInput.focus();

        cancelAnimationFrame(gameLoopReq);
        gameLoop();
    }

    function gameLoop() {
        if (!isActive) return;

        blockPos += speed;
        // Adjust for block width vs furnace. Furnace is on right. Belt container relative.
        // Assuming block falls into furnace around 85% left.
        if (blockPos >= 85) {
            handleDrop();
            return;
        }

        blockEl.style.left = blockPos + '%';
        gameLoopReq = requestAnimationFrame(gameLoop);
    }

    function handleDrop() {
        isActive = false;
        lives--;
        updateHud();
        
        blockEl.className = 'block fail';
        typingInput.value = currentWord.ans; // show correct answer
        typingInput.className = 'error';
        
        setTimeout(() => {
            isActive = true;
            nextWord();
        }, 1500);
    }

    typingInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && isActive) {
            const guess = typingInput.value.trim().toUpperCase();
            if (guess === currentWord.ans) {
                // Success
                isActive = false;
                score++;
                speed += 0.02; // Speeds up slightly!
                updateHud();
                
                blockEl.className = 'block success';
                
                setTimeout(() => {
                    isActive = true;
                    nextWord();
                }, 800);
            } else {
                // Wrong
                typingInput.className = 'error';
                setTimeout(() => { typingInput.className = ''; }, 300);
            }
        }
    });

    function endGame(won) {
        isActive = false;
        cancelAnimationFrame(gameLoopReq);
        beltEl.classList.add('paused');
        typingInput.disabled = true;
        
        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');
        
        if (won && score >= 9) {
            title.textContent = "QUOTA MET (C2 LEVEL)";
            title.style.color = "var(--brass-light)";
            desc.textContent = "Masterful craftsmanship! You forged every complex derivative with zero hesitation. Ready to apply this lexical control in full C1/C2 exam tasks?";
        } else if (won) {
            title.textContent = "QUOTA MET (MARGINAL)";
            title.style.color = "var(--brass-light)";
            desc.textContent = "Scored under 9/10? Cambridge Part 3 Use of English penalises tricky prefixes and internal vowel shifts. In 1-to-1 sessions, we eliminate these recurring errors.";
        } else {
            title.textContent = "FACTORY SHUTDOWN";
            title.style.color = "var(--danger)";
            desc.textContent = "Word formation requires speed and morphological precision. In our 1-to-1 diagnostic lessons, we identify your exact spelling and affix weaknesses.";
        }
        
        document.getElementById('final-score').textContent = score + "/10";
        document.getElementById('lead-score').value = `Word Factory - Score: ${score}/10`;
        document.getElementById('lead-email').value = emailInput.value.trim();
        
        endModal.classList.add('open');
    }

})();
