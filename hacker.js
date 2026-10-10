(() => {
    'use strict';

    // --- Data ---
    const allPuzzles = [
        { orig: "I regret not studying harder for the exam.", key: "WISH", start: "I", end: "harder for the exam.", ans: ["WISH", "I", "HAD", "STUDIED"], decoys: ["STUDYING", "NOT", "REGRET"] },
        { orig: "He was too tired to go out.", key: "THAT", start: "He was", end: "he couldn't go out.", ans: ["SO", "TIRED", "THAT"], decoys: ["TOO", "VERY"] },
        { orig: "People believe that he is living abroad.", key: "BE", start: "He is", end: "abroad.", ans: ["BELIEVED", "TO", "BE", "LIVING"], decoys: ["THAT", "LIVE", "LIVES"] },
        { orig: "It was a mistake to leave the door unlocked.", key: "HAVE", start: "You", end: "the door unlocked.", ans: ["SHOULD", "NOT", "HAVE", "LEFT"], decoys: ["LEAVING", "OUGHT", "LEAVE"] },
        { orig: "They will probably win the match.", key: "LIKELY", start: "They", end: "the match.", ans: ["ARE", "LIKELY", "TO", "WIN"], decoys: ["WILL", "WINNING"] },
        { orig: "I didn't realize how late it was until I looked at my watch.", key: "DID", start: "Not until I looked at my watch", end: "how late it was.", ans: ["DID", "I", "REALIZE"], decoys: ["I", "REALIZED", "HAD"] },
        { orig: "The traffic was so bad that we missed the flight.", key: "RESULT", start: "The traffic was bad, and", end: "we missed the flight.", ans: ["AS", "A", "RESULT"], decoys: ["CONSEQUENCE", "SO", "OF"] },
        { orig: "I'm sure she didn't mean to offend you.", key: "MEANT", start: "She", end: "to offend you.", ans: ["CAN'T", "HAVE", "MEANT"], decoys: ["MUSTN'T", "DIDN'T", "MEAN"] },
        { orig: "He is saving money because he wants to buy a car.", key: "VIEW", start: "He is saving money", end: "a car.", ans: ["WITH", "A", "VIEW", "TO", "BUYING"], decoys: ["BUY", "FOR", "WANTING"] },
        { orig: "She only passed because you helped her.", key: "NOT", start: "Had", end: "she would not have passed.", ans: ["IT", "NOT", "BEEN", "FOR", "YOUR", "HELP"], decoys: ["YOU", "HELPED", "HER"] }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    
    const origSentenceEl = document.getElementById('original-sentence');
    const keyWordEl = document.getElementById('key-word');
    const startEl = document.getElementById('sent-start');
    const endEl = document.getElementById('sent-end');
    const slotsEl = document.getElementById('slot-container');
    const poolEl = document.getElementById('fragments-pool');
    
    const execBtn = document.getElementById('btn-execute');
    const scoreEl = document.getElementById('score-display');
    const timeEl = document.getElementById('time-display');

    // --- State ---
    let queue = [];
    let currentPuzzle = null;
    let score = 0;
    let timeRemaining = 180; // 3 minutes total
    let timerInterval;
    let currentGuess = []; // Array of string fragments

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

    function formatTime(sec) {
        let m = Math.floor(sec / 60);
        let s = sec % 60;
        return (m < 10 ? '0'+m : m) + ':' + (s < 10 ? '0'+s : s);
    }

    function startGame() {
        queue = shuffle([...allPuzzles]).slice(0, 8); // 8 puzzles
        score = 0;
        timeRemaining = 180;
        
        updateHud();
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateHud();
            if (timeRemaining <= 0) endGame(false);
        }, 1000);
        
        loadNext();
    }

    function updateHud() {
        scoreEl.textContent = score;
        timeEl.textContent = formatTime(timeRemaining);
        if (timeRemaining < 30) timeEl.style.color = 'var(--danger)';
        else timeEl.style.color = 'var(--neon)';
    }

    function loadNext() {
        if (queue.length === 0) {
            endGame(true);
            return;
        }

        currentPuzzle = queue.shift();
        currentGuess = [];
        
        origSentenceEl.textContent = "> " + currentPuzzle.orig;
        keyWordEl.textContent = currentPuzzle.key;
        startEl.textContent = currentPuzzle.start;
        endEl.textContent = currentPuzzle.end;
        
        slotsEl.innerHTML = '';
        poolEl.innerHTML = '';
        
        // Build fragment pool
        let fragments = shuffle([...currentPuzzle.ans, ...currentPuzzle.decoys]);
        fragments.forEach((frag, idx) => {
            let btn = document.createElement('button');
            btn.className = 'fragment';
            btn.textContent = frag;
            btn.dataset.id = idx;
            btn.onclick = () => moveToSlot(frag, idx, btn);
            poolEl.appendChild(btn);
        });

        execBtn.className = 'execute-btn';
        execBtn.textContent = '> EXECUTE DECRYPTION';
    }

    function moveToSlot(word, id, origBtn) {
        origBtn.classList.add('used');
        
        let slotBtn = document.createElement('button');
        slotBtn.className = 'fragment';
        slotBtn.textContent = word;
        slotBtn.onclick = () => {
            slotBtn.remove();
            origBtn.classList.remove('used');
             // Need better index handling if duplicate words, but this works for basic. Actually, let's rebuild array based on DOM.
            updateGuessArray();
        };
        slotsEl.appendChild(slotBtn);
        updateGuessArray();
    }

    function updateGuessArray() {
        currentGuess = Array.from(slotsEl.children).map(el => el.textContent);
    }

    execBtn.addEventListener('click', () => {
        if (!currentPuzzle) return;
        
        let guessStr = currentGuess.join(' ');
        let ansStr = currentPuzzle.ans.join(' ');
        
        if (guessStr === ansStr) {
            // Success
            execBtn.className = 'execute-btn success';
            execBtn.textContent = '> DECRYPTION SUCCESSFUL';
            score++;
            updateHud();
            setTimeout(loadNext, 1000);
        } else {
            // Error
            execBtn.className = 'execute-btn error';
            execBtn.textContent = '> SYNTAX ERROR';
            setTimeout(() => {
                execBtn.className = 'execute-btn';
                execBtn.textContent = '> EXECUTE DECRYPTION';
            }, 1000);
        }
    });

    function endGame(won) {
        clearInterval(timerInterval);
        
        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');
        
        if (won) {
            title.textContent = "> SYSTEM OVERRIDDEN";
            title.style.color = "var(--neon)";
            desc.textContent = "> FIREWALL BYPASSED. All syntactical nodes decrypted. Upload your data logs to claim a C1/C2 trial lesson discount.";
        } else {
            title.textContent = "> CONNECTION TRACED";
            title.style.color = "var(--danger)";
            desc.textContent = "> FIREWALL TRIGGERED. Your syntax exploit failed. Upload your partial logs to book a trial lesson and repair your code.";
        }
        
        document.getElementById('final-score').textContent = score + "/8";
        document.getElementById('lead-score').value = `Syntax Hacker - Score: ${score}/8`;
        document.getElementById('lead-email').value = emailInput.value.trim();
        
        endModal.classList.add('open');
    }

})();
