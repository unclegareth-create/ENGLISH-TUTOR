(() => {
    'use strict';

    // --- Data ---
    const allScenarios = [
        { 
            thought: "We don't have enough money for this.", 
            options: [
                { text: "We don't have enough money for this.", score: -30, type: "blunt" },
                { text: "I have some concerns regarding the budget allocation for this phase.", score: 10, type: "perfect" },
                { text: "The fiscal liquidity is immensely diminutive.", score: -15, type: "weird" }
            ] 
        },
        { 
            thought: "That idea is completely terrible and won't work.", 
            options: [
                { text: "I'm not entirely convinced that this approach is the most viable.", score: 10, type: "perfect" },
                { text: "That idea is completely terrible and won't work.", score: -40, type: "blunt" },
                { text: "I refuse to accept this proposal.", score: -25, type: "blunt" }
            ] 
        },
        { 
            thought: "What? I didn't understand you.", 
            options: [
                { text: "Could you possibly elaborate on that last point?", score: 10, type: "perfect" },
                { text: "What did you just say?", score: -30, type: "blunt" },
                { text: "I didn't hear your words accurately.", score: -15, type: "weird" }
            ] 
        },
        { 
            thought: "We will never finish by that deadline.", 
            options: [
                { text: "We will never finish by that deadline.", score: -30, type: "blunt" },
                { text: "The temporal constraints are disastrous.", score: -20, type: "weird" },
                { text: "That timeframe might be somewhat ambitious given our current resources.", score: 10, type: "perfect" }
            ] 
        },
        { 
            thought: "Stop talking, I need to say something.", 
            options: [
                { text: "If I could just come in here for a moment...", score: 10, type: "perfect" },
                { text: "Stop talking, I need to say something.", score: -40, type: "blunt" },
                { text: "I am interrupting you now.", score: -25, type: "weird" }
            ] 
        },
        { 
            thought: "You made a mistake in this report.", 
            options: [
                { text: "You made a mistake in this report.", score: -30, type: "blunt" },
                { text: "It seems there might be a slight discrepancy in these figures.", score: 10, type: "perfect" },
                { text: "Your numerical data is fundamentally flawed.", score: -20, type: "blunt" }
            ] 
        },
        { 
            thought: "I refuse to do this.", 
            options: [
                { text: "I refuse to do this.", score: -40, type: "blunt" },
                { text: "I'm afraid that doesn't really align with our current priorities.", score: 10, type: "perfect" },
                { text: "I will not participate in this endeavor.", score: -25, type: "blunt" }
            ] 
        },
        { 
            thought: "Give me the document right now.", 
            options: [
                { text: "Would you mind sending that document over when you have a moment?", score: 10, type: "perfect" },
                { text: "Give me the document right now.", score: -30, type: "blunt" },
                { text: "I demand the immediate transfer of the file.", score: -20, type: "weird" }
            ] 
        }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    
    const patienceBar = document.getElementById('patience-bar');
    const thoughtEl = document.getElementById('scenario-thought');
    const optionsContainer = document.getElementById('options-container');

    // --- State ---
    let queue = [];
    let patience = 100;
    let score = 0; // Tracks perfect answers
    let totalQuestions = 8;
    let isActive = false;

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
        queue = shuffle([...allScenarios]).slice(0, totalQuestions);
        patience = 100;
        score = 0;
        isActive = true;
        updatePatienceBar();
        loadNext();
    }

    function updatePatienceBar() {
        patience = Math.max(0, Math.min(100, patience));
        patienceBar.style.width = patience + '%';
        
        if (patience > 60) patienceBar.style.backgroundColor = 'var(--success)';
        else if (patience > 30) patienceBar.style.backgroundColor = '#f59e0b';
        else patienceBar.style.backgroundColor = 'var(--danger)';
    }

    function loadNext() {
        if (patience <= 0) {
            endGame(false);
            return;
        }
        if (queue.length === 0) {
            endGame(true);
            return;
        }

        const scenario = queue.shift();
        thoughtEl.textContent = `"${scenario.thought}"`;
        optionsContainer.innerHTML = '';
        
        let options = shuffle([...scenario.options]);
        options.forEach(opt => {
            let btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = opt.text;
            btn.onclick = () => handleChoice(opt, btn, options);
            optionsContainer.appendChild(btn);
        });
    }

    function handleChoice(opt, selectedBtn, allOpts) {
        if (!isActive) return;
        isActive = false;
        
        // Show correct/wrong
        Array.from(optionsContainer.children).forEach(btn => {
            btn.disabled = true;
            let optData = allOpts.find(o => o.text === btn.textContent);
            if (optData.type === 'perfect') {
                btn.classList.add('correct');
            } else if (btn === selectedBtn) {
                btn.classList.add('wrong');
            }
        });

        if (opt.type === 'perfect') {
            score++;
            patience = Math.min(100, patience + opt.score);
        } else {
            patience += opt.score;
            document.querySelector('.ceo-panel').classList.add('shake');
            setTimeout(() => document.querySelector('.ceo-panel').classList.remove('shake'), 400);
        }
        
        updatePatienceBar();
        
        setTimeout(() => {
            isActive = true;
            if (patience <= 0) endGame(false);
            else loadNext();
        }, 1500);
    }

    function endGame(survived) {
        isActive = false;
        
        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');
        
        // Calculate a percentage based on perfect answers (e.g. 8/8 = 100%)
        let finalReputation = Math.round((score / totalQuestions) * 100);
        if (!survived) finalReputation = 0; // Fired
        
        if (survived && finalReputation >= 80) {
            title.textContent = "MEETING SUCCESSFUL";
            title.style.color = "var(--success)";
            desc.textContent = "Outstanding executive poise! You navigated the boardroom with natural diplomacy. Ready to master high-stakes phrasing for your real meetings?";
        } else if (survived) {
            title.textContent = "MEETING SURVIVED (NEEDS POLISH)";
            title.style.color = "#f59e0b";
            desc.textContent = "Scored under 80%? In high-stakes meetings, even small phrasing slips can undermine your credibility. In our 1-to-1 Business English sessions, we practice real-time diplomatic phrasing for your actual work calls.";
        } else {
            title.textContent = "YOU WERE FIRED";
            title.style.color = "var(--danger)";
            desc.textContent = "Your blunt phrasing alienated the board. In international business, linguistic nuance is influence. In our 1-to-1 Business English sessions, we build instinctive tact and diplomacy.";
        }
        
        document.getElementById('final-score').textContent = finalReputation;
        document.getElementById('lead-score').value = `Boardroom Pitch - Rep: ${finalReputation}%`;
        document.getElementById('lead-email').value = emailInput ? emailInput.value.trim() : '';
        document.getElementById('lead-name').value = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Executive Player';
        
        endModal.classList.add('open');

        if (typeof window.showDiagnosticGate === 'function') {
            setTimeout(() => {
                window.showDiagnosticGate({
                    gameName: 'The Boardroom Pitch',
                    score: Math.max(0, score),
                    maxScore: totalQuestions || 8,
                    weakArea: 'Executive Diplomatic Nuance & C1/C2 Register Precision',
                    examImpact: 'In international executive meetings and Cambridge C2 speaking, blunt or informal phrasing undermines professional authority and reduces your discourse management score.',
                    onReplay: () => {
                        endModal.classList.remove('open');
                        startBtn.click();
                    }
                });
            }, 600);
        }
    }

})();
