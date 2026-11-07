(() => {
    'use strict';

    // --- 20 High-Stakes Executive Negotiation & Stakeholder Scenarios across 4 Acts ---
    const allScenarios = [
        // ==========================================
        // ACT I: Budget & Scope Pushback (1 - 5)
        // ==========================================
        {
            id: 1,
            actId: "act1",
            act: "Act I: Budget & Scope Pushback",
            title: "1. Underfunded Phase Two",
            stakeholder: "Chief Financial Officer",
            thought: "We don't have enough money for this phase.",
            device: "Preparatory 'It': It remains doubtful whether...",
            formula: "It remains doubtful whether + Subject + Modal + Verb + without + Noun Phrase",
            whyItWorks: "Depersonalises the objection by shifting focus from personal refusal to objective resource constraints.",
            options: [
                { text: "We don't have enough money for this phase.", score: -30, type: "blunt" },
                { text: "It remains doubtful whether we can deliver this scope without a modest budget reallocation.", score: 10, type: "perfect" },
                { text: "The fiscal liquidity is immensely diminutive for this endeavour.", score: -15, type: "weird" }
            ]
        },
        {
            id: 2,
            actId: "act1",
            act: "Act I: Budget & Scope Pushback",
            title: "2. Last-Minute Feature Creep",
            stakeholder: "VP of Product",
            thought: "If we move people to these new features now, we'll blow the Q3 budget.",
            device: "Inverted Conditional: Should we reallocate...",
            formula: "Should + Subject + Bare Infinitive..., Main Clause (would require / need)",
            whyItWorks: "Frames scope pushback as a transparent trade-off decision for leadership rather than an obstructive 'no'.",
            options: [
                { text: "Should we reallocate engineering capacity to these new features now, we would need to revise the Q3 budget.", score: 10, type: "perfect" },
                { text: "Adding three new features now without extra budget is impossible.", score: -35, type: "blunt" },
                { text: "The augmentation of parameters necessitates pecuniary expansion.", score: -15, type: "weird" }
            ]
        },
        {
            id: 3,
            actId: "act1",
            act: "Act I: Budget & Scope Pushback",
            title: "3. Unviable Market Proposal",
            stakeholder: "Commercial Director",
            thought: "That idea is completely terrible and won't work in our market.",
            device: "Negative Litotes: I am not entirely convinced that...",
            formula: "Subject + BE + not entirely convinced that + Clause + is the most viable",
            whyItWorks: "Uses understated C1 hedging ('not entirely convinced') to dismantle a weak idea while preserving the speaker's dignity.",
            options: [
                { text: "I'm not entirely convinced that this approach is the most viable given current market conditions.", score: 10, type: "perfect" },
                { text: "That idea is completely terrible and won't work in our market.", score: -40, type: "blunt" },
                { text: "This conceptualisation exhibits catastrophic commercial futility.", score: -20, type: "weird" }
            ]
        },
        {
            id: 4,
            actId: "act1",
            act: "Act I: Budget & Scope Pushback",
            title: "4. Protecting Core Team Capacity",
            stakeholder: "Chief Operating Officer",
            thought: "I refuse to pull my team off their main project for this side task.",
            device: "Emphatic What-Cleft: What we must safeguard is...",
            formula: "What + Subject + Modal + Verb + BE + Noun Phrase",
            whyItWorks: "Uses a C1 cleft sentence to anchor your refusal in shared company priorities rather than personal stubbornness.",
            options: [
                { text: "I refuse to pull my team off their main project for this side task.", score: -35, type: "blunt" },
                { text: "What we must safeguard right now is our core engineering capacity for the flagship launch.", score: 10, type: "perfect" },
                { text: "Diverting human capital to peripheral tasks is something I veto.", score: -15, type: "weird" }
            ]
        },
        {
            id: 5,
            actId: "act1",
            act: "Act I: Budget & Scope Pushback",
            title: "5. Vendor Pricing Pushback",
            stakeholder: "Enterprise Vendor Partner",
            thought: "Your quote is way too expensive compared to your competitors.",
            device: "Inverted Second Conditional: Were you able to...",
            formula: "Were + Subject + able to + Infinitive..., Subject + would be + Adjective",
            whyItWorks: "Signals genuine buying intent while making fee reduction the polite precondition for signing.",
            options: [
                { text: "Were you able to bring the annual licensing fee closer to industry benchmarks, we would be keen to proceed.", score: 10, type: "perfect" },
                { text: "Your quote is way too expensive compared to your competitors.", score: -30, type: "blunt" },
                { text: "Your tariff exceeds tolerable financial thresholds by a wide margin.", score: -15, type: "weird" }
            ]
        },

        // ==========================================
        // ACT II: Crisis & Delay Management (6 - 10)
        // ==========================================
        {
            id: 6,
            actId: "act2",
            act: "Act II: Crisis & Delay Management",
            title: "6. Unrealistic Launch Deadline",
            stakeholder: "Chief Executive Officer",
            thought: "We will never finish by that deadline.",
            device: "Passive Reporting: The timeline is projected to...",
            formula: "Subject + BE + projected/estimated + to-infinitive",
            whyItWorks: "Presents timeline extensions as objective engineering projections rather than personal pessimism.",
            options: [
                { text: "We will never finish by that deadline.", score: -30, type: "blunt" },
                { text: "The temporal constraints are utterly disastrous.", score: -20, type: "weird" },
                { text: "The timeline is projected to require an additional two weeks to pass full security auditing.", score: 10, type: "perfect" }
            ]
        },
        {
            id: 7,
            actId: "act2",
            act: "Act II: Crisis & Delay Management",
            title: "7. Flagging a Financial Report Error",
            stakeholder: "VP of Finance",
            thought: "You made a huge mistake in this report.",
            device: "Existential Hedging: There appears to be a slight discrepancy...",
            formula: "There appears to be + a slight discrepancy in + Noun Phrase",
            whyItWorks: "Removes the accusatory 'you' completely so the numerical error is corrected without triggering defensiveness.",
            options: [
                { text: "You made a huge mistake in this report.", score: -30, type: "blunt" },
                { text: "There appears to be a slight discrepancy between these Q4 figures and the raw ledger.", score: 10, type: "perfect" },
                { text: "Your numerical data is fundamentally erroneous and flawed.", score: -20, type: "weird" }
            ]
        },
        {
            id: 8,
            actId: "act2",
            act: "Act II: Crisis & Delay Management",
            title: "8. Supply Chain Bottleneck",
            stakeholder: "Global Operations Director",
            thought: "Our supplier let us down, so the shipment is late.",
            device: "Perfect Participle Clause: Having encountered..., we have...",
            formula: "Having + Past Participle + Noun Phrase, Subject + have already + Past Participle",
            whyItWorks: "Subordinates the bad news inside a participle clause while placing the main clause spotlight on your solution.",
            options: [
                { text: "Having encountered an unexpected customs hold-up, we have already routed a backup consignment via air freight.", score: 10, type: "perfect" },
                { text: "Our supplier let us down, so the shipment is late.", score: -30, type: "blunt" },
                { text: "Logistical retardation has afflicted our external vendor network.", score: -15, type: "weird" }
            ]
        },
        {
            id: 9,
            actId: "act2",
            act: "Act II: Crisis & Delay Management",
            title: "9. Containing a Live Outage",
            stakeholder: "Key Account Director",
            thought: "The server crashed and we are still fixing it.",
            device: "Passive Continuous Assurance: The issue is currently being...",
            formula: "Subject + BE + currently being + Past Participle, with + Noun Phrase + to follow",
            whyItWorks: "Projects calm operational command and gives stakeholders a concrete timestamp for the next update.",
            options: [
                { text: "The latency issue is currently being isolated by our infrastructure team, with a full briefing scheduled for 3 p.m.", score: 10, type: "perfect" },
                { text: "The server crashed and we are still fixing it.", score: -40, type: "blunt" },
                { text: "A mysterious digital calamity has paralysed our computation nodes.", score: -20, type: "weird" }
            ]
        },
        {
            id: 10,
            actId: "act2",
            act: "Act II: Crisis & Delay Management",
            title: "10. Defending Quality Assurance Buffers",
            stakeholder: "Board Risk Committee",
            thought: "Rushed launches almost never work without proper testing.",
            device: "Softened Negative Inversion: Rarely do we see...",
            formula: "Rarely + Auxiliary (do/does/did) + Subject + Bare Infinitive...",
            whyItWorks: "Uses C1 negative inversion to lend gravitas and historical authority to your quality control standards.",
            options: [
                { text: "Rarely do we see rushed deployments succeed without a 48-hour quality assurance buffer.", score: 10, type: "perfect" },
                { text: "If we rush this release, it will break in front of clients.", score: -30, type: "blunt" },
                { text: "Premature launching precipitates inevitable client dissatisfaction.", score: -15, type: "weird" }
            ]
        },

        // ==========================================
        // ACT III: Cross-Functional Alignment (11 - 15)
        // ==========================================
        {
            id: 11,
            actId: "act3",
            act: "Act III: Cross-Functional Alignment",
            title: "11. Reclaiming the Floor in a Meeting",
            stakeholder: "Senior Partner",
            thought: "Stop talking, I need to say something.",
            device: "Polite Conditional Interjection: If I might just come in here...",
            formula: "If I could/might just come in here for a moment + on the question of...",
            whyItWorks: "Claims speaking space smoothly and respectfully without causing a jarring conversational collision.",
            options: [
                { text: "If I could just come in here for a moment on the question of regional compliance...", score: 10, type: "perfect" },
                { text: "Stop talking, I need to say something.", score: -40, type: "blunt" },
                { text: "I am interrupting your monologue now.", score: -25, type: "weird" }
            ]
        },
        {
            id: 12,
            actId: "act3",
            act: "Act III: Cross-Functional Alignment",
            title: "12. Clarifying an Ambiguous Brief",
            stakeholder: "Chief Strategy Officer",
            thought: "What? I didn't understand you.",
            device: "Modal Elaboration Frame: Could you possibly elaborate on...",
            formula: "Could you possibly elaborate on + Noun Phrase / Embedded Wh-Clause?",
            whyItWorks: "Frames the request for clarity as high-level strategic engagement rather than confusion or inattention.",
            options: [
                { text: "Could you possibly elaborate on how that transition will affect our enterprise accounts?", score: 10, type: "perfect" },
                { text: "What did you just say?", score: -30, type: "blunt" },
                { text: "I didn't hear your words accurately.", score: -15, type: "weird" }
            ]
        },
        {
            id: 13,
            actId: "act3",
            act: "Act III: Cross-Functional Alignment",
            title: "13. Chasing an Overdue Legal Sign-Off",
            stakeholder: "Head of Legal",
            thought: "Give me the document right now.",
            device: "Courtesy Conditional Request: Would you mind... / We would be grateful if...",
            formula: "Would you mind + V-ing + when you have a moment, so that + Clause?",
            whyItWorks: "Pairs polite collegial phrasing with a clear operational reason for urgency.",
            options: [
                { text: "Would you mind sending the signed contract over when you have a moment so we stay on track for Friday?", score: 10, type: "perfect" },
                { text: "Give me the document right now.", score: -30, type: "blunt" },
                { text: "I demand the immediate transfer of the juridical file.", score: -20, type: "weird" }
            ]
        },
        {
            id: 14,
            actId: "act3",
            act: "Act III: Cross-Functional Alignment",
            title: "14. Steering Back from a Tangent",
            stakeholder: "Regional Director",
            thought: "You're going completely off-topic and wasting our time.",
            device: "Fronted Concessive Clause: Valid as that point is...",
            formula: "Adjective + as + Subject + BE, perhaps we could + Verb...",
            whyItWorks: "Validates the colleague's insight publicly before firmly guiding the room back to the core agenda.",
            options: [
                { text: "Valid as that point is, perhaps we could park it for a separate session and finalise Q2 headcount first.", score: 10, type: "perfect" },
                { text: "You're going completely off-topic and wasting our time.", score: -35, type: "blunt" },
                { text: "Your digression is deleterious to our chronological efficiency.", score: -15, type: "weird" }
            ]
        },
        {
            id: 15,
            actId: "act3",
            act: "Act III: Cross-Functional Alignment",
            title: "15. Resolving Sales vs Engineering Friction",
            stakeholder: "VP of Global Sales",
            thought: "Sales promised the client something Engineering never agreed to build.",
            device: "Impersonal Alignment Frame: It appears that... may not have been...",
            formula: "It appears that + Noun Phrase + may not have been fully aligned with...",
            whyItWorks: "Identifies the cross-functional expectation gap without throwing another department under the bus.",
            options: [
                { text: "It appears that the initial client proposal may not have been fully aligned with our technical roadmap.", score: 10, type: "perfect" },
                { text: "Sales promised the client something Engineering never agreed to build.", score: -35, type: "blunt" },
                { text: "Commercial personnel fabricated unfeasible technical commitments.", score: -15, type: "weird" }
            ]
        },

        // ==========================================
        // ACT IV: C-Suite Pitch & Closing (16 - 20)
        // ==========================================
        {
            id: 16,
            actId: "act4",
            act: "Act IV: C-Suite Pitch & Closing",
            title: "16. Highlighting Competitive Edge",
            stakeholder: "Investment Committee",
            thought: "Our platform is way better than anything else on the market.",
            device: "Distinguishing What-Cleft: What sets our platform apart is...",
            formula: "What sets + Noun Phrase + apart from + Noun Phrase + BE + Noun/Clause",
            whyItWorks: "Replaces casual boasting with an authoritative cleft structure centered on measurable client value.",
            options: [
                { text: "What sets this architecture apart from legacy competitors is its ability to cut onboarding time by half.", score: 10, type: "perfect" },
                { text: "Our platform is way better than anything else on the market.", score: -25, type: "blunt" },
                { text: "Our merchandise possesses supreme superiority over rival fabrications.", score: -15, type: "weird" }
            ]
        },
        {
            id: 17,
            actId: "act4",
            act: "Act IV: C-Suite Pitch & Closing",
            title: "17. Defending Long-Term ROI",
            stakeholder: "Managing Director",
            thought: "This won't just save money; it will bring in huge enterprise revenue.",
            device: "Correlative Negative Inversion: Not only does..., but it also...",
            formula: "Not only + Auxiliary + Subject + Verb..., but + Subject + also + Verb...",
            whyItWorks: "Builds rhetorical momentum by linking immediate risk protection with long-term commercial growth.",
            options: [
                { text: "Not only does this investment insulate us against regulatory fines, but it also unlocks recurring enterprise revenue.", score: 10, type: "perfect" },
                { text: "Stop obsessing over this quarter's cost; this will make us rich next year.", score: -35, type: "blunt" },
                { text: "Short-termist parsimony blinds you to future monetary abundance.", score: -20, type: "weird" }
            ]
        },
        {
            id: 18,
            actId: "act4",
            act: "Act IV: C-Suite Pitch & Closing",
            title: "18. Addressing Adoption Risk Proactively",
            stakeholder: "Non-Executive Director",
            thought: "There is a risk that users won't adopt this quickly at first.",
            device: "Preparatory 'It' + Risk Mitigation: It is worth bearing in mind that...",
            formula: "It is worth bearing in mind that + Clause, which is why we have + Past Participle",
            whyItWorks: "Shows C-suite maturity by acknowledging a risk upfront and immediately pairing it with a built-in safeguard.",
            options: [
                { text: "It is worth bearing in mind that initial adoption may be gradual, which is why we have designed a phased rollout.", score: 10, type: "perfect" },
                { text: "There is a small risk this could fail if adoption is slow.", score: -30, type: "blunt" },
                { text: "A perilous probability of stagnation exists during nascent deployment.", score: -15, type: "weird" }
            ]
        },
        {
            id: 19,
            actId: "act4",
            act: "Act IV: C-Suite Pitch & Closing",
            title: "19. Handling a Hostile Board Question",
            stakeholder: "Board Chair",
            thought: "You clearly didn't read Section 4 of my briefing pack.",
            device: "Diplomatic Evidential Pivot: As outlined in Section 4...",
            formula: "As outlined in + Noun Phrase, our findings indicate that + Clause",
            whyItWorks: "Directs the room's attention to the documented evidence smoothly without embarrassing the questioner.",
            options: [
                { text: "As outlined in Section 4 of the briefing pack, our stress-testing confirms a 99.9% uptime threshold.", score: 10, type: "perfect" },
                { text: "You clearly didn't read Section 4 of my briefing pack.", score: -40, type: "blunt" },
                { text: "Your failure to peruse page four explains your current ignorance.", score: -20, type: "weird" }
            ]
        },
        {
            id: 20,
            actId: "act4",
            act: "Act IV: C-Suite Pitch & Closing",
            title: "20. Securing Final Board Sign-Off",
            stakeholder: "Chief Executive Officer",
            thought: "Stop hesitating and approve the project today.",
            device: "Inverted Conditional Closing: Should the Board grant approval...",
            formula: "Should + Subject + Bare Infinitive..., Subject + BE + positioned to + Infinitive",
            whyItWorks: "Closes the pitch with decisive executive readiness while respecting the Board's governance authority.",
            options: [
                { text: "Should the Board grant green-light approval today, we are positioned to initiate Phase One by Monday morning.", score: 10, type: "perfect" },
                { text: "Stop hesitating and approve the project today.", score: -35, type: "blunt" },
                { text: "Cease your vacillation and ratify this corporate endeavour forthwith.", score: -15, type: "weird" }
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
    const actSelect = document.getElementById('act-select');
    const modeSelect = document.getElementById('mode-select');

    const actBadge = document.getElementById('act-badge');
    const scenarioJump = document.getElementById('scenario-jump');
    const roleplayToggleBtn = document.getElementById('btn-roleplay-toggle');
    const stakeholderLabel = document.getElementById('stakeholder-label');
    const scenarioIndexEl = document.getElementById('scenario-index');
    const scenarioTotalEl = document.getElementById('scenario-total');
    const liveScoreEl = document.getElementById('live-score');
    const scenarioActTag = document.getElementById('scenario-act-tag');

    const patienceBar = document.getElementById('patience-bar');
    const thoughtEl = document.getElementById('scenario-thought');
    const optionsContainer = document.getElementById('options-container');

    const revealBlueprintBtn = document.getElementById('btn-reveal-blueprint');
    const blueprintPanel = document.getElementById('blueprint-panel');
    const blueprintDevice = document.getElementById('blueprint-device');
    const blueprintVerdict = document.getElementById('blueprint-verdict');
    const blueprintFormula = document.getElementById('blueprint-formula');
    const blueprintModelText = document.getElementById('blueprint-model-text');
    const blueprintWhy = document.getElementById('blueprint-why');
    const nextScenarioBtn = document.getElementById('btn-next-scenario');

    // --- State ---
    let queue = [];
    let currentScenario = null;
    let currentStep = 0;
    let patience = 100;
    let score = 0;
    let totalQuestions = 8;
    let isActive = false;
    let isUntimedRoleplay = false;
    let autoAdvanceTimer = null;

    // --- Populate Scenario Selector Dropdown (Grouped by 4 Acts) ---
    function populateScenarioSelector() {
        if (!scenarioJump) return;
        scenarioJump.innerHTML = '';
        const acts = [
            { id: 'act1', label: 'Act I: Budget & Scope Pushback' },
            { id: 'act2', label: 'Act II: Crisis & Delay Management' },
            { id: 'act3', label: 'Act III: Cross-Functional Alignment' },
            { id: 'act4', label: 'Act IV: C-Suite Pitch & Closing' }
        ];
        acts.forEach(actInfo => {
            const group = document.createElement('optgroup');
            group.label = actInfo.label;
            allScenarios.filter(s => s.actId === actInfo.id).forEach(s => {
                const opt = document.createElement('option');
                opt.value = String(s.id);
                opt.textContent = s.title;
                group.appendChild(opt);
            });
            scenarioJump.appendChild(group);
        });
    }
    populateScenarioSelector();

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
        isUntimedRoleplay = !!(modeSelect && modeSelect.value === 'untimed');
        syncRoleplayButton();
        startGame();
    });

    restartBtn.addEventListener('click', () => {
        endModal.classList.remove('open');
        startGame();
    });

    if (roleplayToggleBtn) {
        roleplayToggleBtn.addEventListener('click', () => {
            isUntimedRoleplay = !isUntimedRoleplay;
            if (modeSelect) modeSelect.value = isUntimedRoleplay ? 'untimed' : 'timed';
            syncRoleplayButton();
            if (isUntimedRoleplay && autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
                autoAdvanceTimer = null;
            }
            updatePatienceBar();
        });
    }

    function syncRoleplayButton() {
        if (!roleplayToggleBtn) return;
        roleplayToggleBtn.setAttribute('aria-pressed', isUntimedRoleplay ? 'true' : 'false');
        if (isUntimedRoleplay) {
            roleplayToggleBtn.textContent = '🛡️ Untimed Roleplay Mode';
            roleplayToggleBtn.classList.add('untimed-active');
        } else {
            roleplayToggleBtn.textContent = '⏱️ Timed Pitch';
            roleplayToggleBtn.classList.remove('untimed-active');
        }
    }

    if (scenarioJump) {
        scenarioJump.addEventListener('change', () => {
            const targetId = parseInt(scenarioJump.value, 10);
            const targetScenario = allScenarios.find(s => s.id === targetId);
            if (!targetScenario) return;
            if (autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
                autoAdvanceTimer = null;
            }
            // Place chosen scenario at front of queue or load directly
            queue = queue.filter(s => s.id !== targetId);
            queue.unshift(targetScenario);
            currentStep = Math.max(0, currentStep - 1);
            isActive = true;
            loadNext();
        });
    }

    if (revealBlueprintBtn) {
        revealBlueprintBtn.addEventListener('click', () => {
            if (!currentScenario || !blueprintPanel) return;
            if (blueprintPanel.hidden) {
                populateBlueprint(currentScenario, null);
                blueprintPanel.hidden = false;
                revealBlueprintBtn.textContent = '🙈 Hide C1 Diplomatic Blueprint';
                if (autoAdvanceTimer) {
                    clearTimeout(autoAdvanceTimer);
                    autoAdvanceTimer = null;
                }
            } else {
                blueprintPanel.hidden = true;
                revealBlueprintBtn.textContent = '👁️ Reveal C1 Diplomatic Blueprint';
            }
        });
    }

    if (nextScenarioBtn) {
        nextScenarioBtn.addEventListener('click', () => {
            if (autoAdvanceTimer) {
                clearTimeout(autoAdvanceTimer);
                autoAdvanceTimer = null;
            }
            isActive = true;
            if (!isUntimedRoleplay && patience <= 0) {
                endGame(false);
            } else {
                loadNext();
            }
        });
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

    function buildScenarioQueue() {
        const mode = actSelect ? actSelect.value : 'sprint8';
        if (mode === 'all20') {
            return [...allScenarios];
        }
        if (mode === 'act1' || mode === 'act2' || mode === 'act3' || mode === 'act4') {
            return allScenarios.filter(s => s.actId === mode);
        }
        // Default 'sprint8': 2 scenarios from each of the 4 Acts in chronological Act order
        const act1Pick = shuffle(allScenarios.filter(s => s.actId === 'act1')).slice(0, 2);
        const act2Pick = shuffle(allScenarios.filter(s => s.actId === 'act2')).slice(0, 2);
        const act3Pick = shuffle(allScenarios.filter(s => s.actId === 'act3')).slice(0, 2);
        const act4Pick = shuffle(allScenarios.filter(s => s.actId === 'act4')).slice(0, 2);
        return [...act1Pick, ...act2Pick, ...act3Pick, ...act4Pick];
    }

    function startGame() {
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }
        queue = buildScenarioQueue();
        totalQuestions = queue.length;
        currentStep = 0;
        patience = 100;
        score = 0;
        isActive = true;
        if (scenarioTotalEl) scenarioTotalEl.textContent = String(totalQuestions);
        if (liveScoreEl) liveScoreEl.textContent = '0';
        updatePatienceBar();
        loadNext();
    }

    function updatePatienceBar() {
        if (isUntimedRoleplay) {
            patience = 100;
        }
        patience = Math.max(0, Math.min(100, patience));
        patienceBar.style.width = patience + '%';
        patienceBar.setAttribute('aria-valuenow', String(patience));

        if (patience > 60) patienceBar.style.backgroundColor = 'var(--success)';
        else if (patience > 30) patienceBar.style.backgroundColor = '#f59e0b';
        else patienceBar.style.backgroundColor = 'var(--danger)';
    }

    function populateBlueprint(scenario, chosenOpt) {
        if (!blueprintPanel || !scenario) return;
        const perfectOpt = scenario.options.find(o => o.type === 'perfect');
        blueprintDevice.textContent = scenario.device;
        blueprintFormula.textContent = scenario.formula;
        blueprintModelText.textContent = `"${perfectOpt ? perfectOpt.text : ''}"`;
        blueprintWhy.textContent = scenario.whyItWorks;

        if (!chosenOpt) {
            blueprintVerdict.textContent = 'C1 BLUEPRINT PREVIEW';
            blueprintVerdict.className = 'blueprint-verdict';
        } else if (chosenOpt.type === 'perfect') {
            blueprintVerdict.textContent = '✓ DIPLOMATIC C1 MASTERY (+10)';
            blueprintVerdict.className = 'blueprint-verdict';
        } else if (chosenOpt.type === 'weird') {
            blueprintVerdict.textContent = '⚠ THESAURUS OVERLOAD (' + chosenOpt.score + '%)';
            blueprintVerdict.className = 'blueprint-verdict verdict-blunt';
        } else {
            blueprintVerdict.textContent = '✗ TOO BLUNT (' + chosenOpt.score + '%)';
            blueprintVerdict.className = 'blueprint-verdict verdict-blunt';
        }
    }

    function loadNext() {
        if (!isUntimedRoleplay && patience <= 0) {
            endGame(false);
            return;
        }
        if (queue.length === 0) {
            endGame(true);
            return;
        }

        currentScenario = queue.shift();
        currentStep++;

        if (actBadge) actBadge.textContent = currentScenario.act;
        if (stakeholderLabel) stakeholderLabel.textContent = currentScenario.stakeholder;
        if (scenarioIndexEl) scenarioIndexEl.textContent = String(currentStep);
        if (scenarioActTag) scenarioActTag.textContent = `${currentScenario.act.toUpperCase()} · SCENARIO #${currentScenario.id}`;
        if (scenarioJump) scenarioJump.value = String(currentScenario.id);

        if (blueprintPanel) blueprintPanel.hidden = true;
        if (revealBlueprintBtn) revealBlueprintBtn.textContent = '👁️ Reveal C1 Diplomatic Blueprint';

        thoughtEl.textContent = `"${currentScenario.thought}"`;
        optionsContainer.innerHTML = '';

        let options = shuffle([...currentScenario.options]);
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
            if (optData && optData.type === 'perfect') {
                btn.classList.add('correct');
            } else if (btn === selectedBtn) {
                btn.classList.add('wrong');
            }
        });

        const perfectOpt = allOpts.find(o => o.type === 'perfect');
        if (currentScenario) {
            window.CandidateDossier?.recordAttempt({
                category: 'diplomatic_register',
                correct: opt.type === 'perfect',
                game: 'The Boardroom Pitch',
                prompt: currentScenario.thought,
                keyword: currentScenario.device,
                targetAnswer: perfectOpt ? perfectOpt.text : '',
                userAttempt: opt.text,
                explanation: `${currentScenario.device} — ${currentScenario.formula}`
            });
        }

        if (opt.type === 'perfect') {
            score++;
            if (liveScoreEl) liveScoreEl.textContent = String(score);
            if (!isUntimedRoleplay) {
                patience = Math.min(100, patience + opt.score);
            }
        } else {
            if (!isUntimedRoleplay) {
                patience += opt.score;
            }
            const ceoPanel = document.querySelector('.ceo-panel');
            if (ceoPanel) {
                ceoPanel.classList.add('shake');
                setTimeout(() => ceoPanel.classList.remove('shake'), 400);
            }
        }

        updatePatienceBar();

        // Display C1 Diplomatic Blueprint immediately after choice
        if (currentScenario && blueprintPanel) {
            populateBlueprint(currentScenario, opt);
            blueprintPanel.hidden = false;
            if (revealBlueprintBtn) revealBlueprintBtn.textContent = '🙈 Hide C1 Diplomatic Blueprint';
        }

        if (!isUntimedRoleplay) {
            autoAdvanceTimer = setTimeout(() => {
                isActive = true;
                if (patience <= 0) endGame(false);
                else loadNext();
            }, 3200);
        }
    }

    function endGame(survived) {
        isActive = false;
        if (autoAdvanceTimer) {
            clearTimeout(autoAdvanceTimer);
            autoAdvanceTimer = null;
        }

        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');

        let finalReputation = Math.round((score / Math.max(1, totalQuestions)) * 100);
        if (!survived && !isUntimedRoleplay) finalReputation = 0;

        if (survived && finalReputation >= 80) {
            title.textContent = "MEETING SUCCESSFUL";
            title.style.color = "var(--success)";
            desc.textContent = "Outstanding executive poise! You navigated the boardroom with natural C1 diplomacy across every Act. Ready to master high-stakes phrasing for your real meetings?";
        } else if (survived) {
            title.textContent = "MEETING SURVIVED (NEEDS POLISH)";
            title.style.color = "#f59e0b";
            desc.textContent = "Scored under 80%? In high-stakes meetings, even small phrasing slips can undermine your credibility. In our 1-to-1 Business English sessions, we practice real-time diplomatic phrasing for your actual work calls.";
        } else {
            title.textContent = "YOU WERE FIRED";
            title.style.color = "var(--danger)";
            desc.textContent = "Your blunt phrasing alienated the board. In international business, linguistic nuance is influence. In our 1-to-1 Business English sessions, we build instinctive tact and diplomacy.";
        }

        document.getElementById('final-score').textContent = String(finalReputation);
        document.getElementById('lead-score').value = `Boardroom Pitch - Rep: ${finalReputation}% (${score}/${totalQuestions})`;
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
