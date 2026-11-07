(() => {
    'use strict';

    // --- 40 Authentic Cambridge B2/C1/C2 Part 3 Word Formation Items ---
    const allWords = [
        // 15 Double-Affix & Internal Shift C1/C2 Families (Negative Prefix + Suffix + Stem/Vowel Shift)
        {
            root: "CONCEIVE",
            req: "ADVERB (NEGATIVE)",
            ans: "INCONCEIVABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + STEM SHIFT",
            sentence: "The deep-sea cables operate under ________ high hydrostatic pressures.",
            formula: "in- (neg. prefix) + conceiv(e) (drop silent -e) + -ab(le) + -ly = INCONCEIVABLY",
            rule: "Cambridge C1/C2 Double-Affix Rule: ' high' is an adjective, so it requires an adverb modifier; context demands the negative prefix in- + -ably."
        },
        {
            root: "EXPLAIN",
            req: "ADVERB (NEGATIVE)",
            ans: "INEXPLICABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + VOWEL SHIFT",
            sentence: "Although the weather was calm, the ferry was ________ delayed by three hours.",
            formula: "in- (neg. prefix) + explic- (Latinate stem shift: explain -> explic) + -ab(le) + -ly = INEXPLICABLY",
            rule: "Watch the internal vowel and consonant mutation: EXPLAIN drops the 'ai' diphthong and shifts to the Latinate root -EXPLIC- before taking -ably."
        },
        {
            root: "COMPARE",
            req: "ADVERB (NEGATIVE)",
            ans: "INCOMPARABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX NEGATIVE",
            sentence: "The acoustics in the restored concert hall are ________ superior to the old venue.",
            formula: "in- (neg. prefix) + compar(e) (drop -e) + -ab(le) + -ly = INCOMPARABLY",
            rule: "Before a comparative adjective ('superior', 'better', 'richer'), Cambridge Part 3 frequently tests the emphatic negative adverb INCOMPARABLY."
        },
        {
            root: "PROVE",
            req: "ADVERB (NEGATIVE)",
            ans: "IRREFUTABLY",
            alt: ["INDISPUTABLY", "UNPROVABLY"],
            category: "negative",
            badge: "C2 SUPPLETIVE / DOUBLE-AFFIX",
            sentence: "The ice-core samples ________ demonstrate that atmospheric temperatures rose rapidly.",
            formula: "ir- (assimilated in- before R) + refut(e)/prov(e) + -ab(le) + -ly = IRREFUTABLY",
            rule: "High-level C2 adverbial modifier meaning 'in a way that cannot be disproved or refuted'."
        },
        {
            root: "REPAIR",
            req: "ADVERB (NEGATIVE)",
            ans: "IRREPARABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + VOWEL SHIFT",
            sentence: "Trust between the two founding partners was ________ damaged during the dispute.",
            formula: "ir- (neg. prefix before R) + repar- (vowel reduction: ai -> a) + -ab(le) + -ly = IRREPARABLY",
            rule: "Classic Cambridge Part 3 spelling trap: REPAIR loses the 'i' in the second syllable when forming IRREPARABLE and IRREPARABLY."
        },
        {
            root: "REPLACE",
            req: "ADJECTIVE (NEGATIVE)",
            ans: "IRREPLACEABLE",
            category: "negative",
            badge: "DOUBLE-AFFIX + SOFT C GUARD",
            sentence: "Several ________ seventeenth-century manuscripts were rescued from the flooded cellar.",
            formula: "ir- (neg. prefix before R) + replace (keep silent -e!) + -able = IRREPLACEABLE",
            rule: "Soft-C Spelling Guard: Unlike 'conceive' or 'compare', REPLACE must retain its silent '-e' before '-able' to keep the 'c' soft (/s/)."
        },
        {
            root: "QUESTION",
            req: "ADVERB (NEGATIVE)",
            ans: "UNQUESTIONABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX NEGATIVE",
            sentence: "Dr Vance is ________ the foremost authority on Celtic maritime archaeology.",
            formula: "un- (neg. prefix) + question + -ab(le) + -ly = UNQUESTIONABLY",
            rule: "Sentence-modifying C1 adverb meaning 'beyond any doubt'; requires both the prefix un- and the compound suffix -ably."
        },
        {
            root: "DOUBT",
            req: "ADVERB (NEGATIVE)",
            ans: "UNDOUBTEDLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + PARTICIPIAL STEM",
            sentence: "This new battery chemistry will ________ transform regional commuter aviation.",
            formula: "un- (neg. prefix) + doubt + -ed (participial adj.) + -ly = UNDOUBTEDLY",
            rule: "Never write *undoubtly! You must retain the participial '-ed' syllable between the stem DOUBT and the adverbial suffix '-ly'."
        },
        {
            root: "MEASURE",
            req: "ADVERB (NEGATIVE)",
            ans: "IMMEASURABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + DOUBLE M",
            sentence: "Living abroad for a year improved her spoken fluency ________.",
            formula: "im- (neg. prefix before M) + measur(e) (drop -e) + -ab(le) + -ly = IMMEASURABLY",
            rule: "Because the stem MEASURE begins with 'm', the prefix 'in-' assimilates to 'im-', producing a double 'mm' (IMMEASURABLY)."
        },
        {
            root: "PRECEDE",
            req: "ADJECTIVE (NEGATIVE)",
            ans: "UNPRECEDENTED",
            category: "negative",
            badge: "DOUBLE-AFFIX + CONSONANT SHIFT",
            sentence: "The exhibition attracted an ________ number of international visitors in its opening week.",
            formula: "un- (neg. prefix) + precedent (noun stem) + -ed = UNPRECEDENTED",
            rule: "Notice the '-nt-' consonant insertion: PRECEDE shifts through the noun stem PRECEDENT before taking 'un-' and '-ed'."
        },
        {
            root: "RESIST",
            req: "ADJECTIVE (NEGATIVE)",
            ans: "IRRESISTIBLE",
            category: "negative",
            badge: "DOUBLE-AFFIX (-IBLE TRAP)",
            sentence: "For many urban commuters, the convenience of contactless ticketing proved ________.",
            formula: "ir- (neg. prefix before R) + resist + -ible (NOT -able) = IRRESISTIBLE",
            rule: "Double-R + -IBLE trap: RESIST takes 'ir-' (double r) and the Latinate suffix '-ible' rather than '-able'."
        },
        {
            root: "PERCEIVE",
            req: "ADVERB (NEGATIVE)",
            ans: "IMPERCEPTIBLY",
            category: "negative",
            badge: "DOUBLE-AFFIX + STEM MUTATION",
            sentence: "The glacier moves almost ________, advancing only a few millimetres each afternoon.",
            formula: "im- (before P) + percept- (stem shift: perceiv -> percept) + -ib(le) + -ly = IMPERCEPTIBLY",
            rule: "Verbs ending in -ceive (perceive, conceive, receive, deceive) shift to -cept- before -ible/-ion (IMPERCEPTIBLY)."
        },
        {
            root: "DESCRIBE",
            req: "ADVERB (NEGATIVE)",
            ans: "INDESCRIBABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX NEGATIVE",
            sentence: "Standing on the crater rim at dawn was an ________ exhilarating experience.",
            formula: "in- (neg. prefix) + describ(e) (drop -e) + -ab(le) + -ly = INDESCRIBABLY",
            rule: "Modifying the adjective 'exhilarating' requires an adverb; dropping the final '-e' of DESCRIBE yields INDESCRIBABLY."
        },
        {
            root: "PART",
            req: "NOUN (NEGATIVE)",
            ans: "IMPARTIALITY",
            category: "negative",
            badge: "TRIPLE DERIVATION CHAIN",
            sentence: "Judges and public broadcasters are expected to maintain strict ________ at all times.",
            formula: "im- (before P) + part + -ial (adj.) + -ity (abstract noun) = IMPARTIALITY",
            rule: "Triple morphological chain: Noun (part) -> Adjective (partial) -> Negative Adjective (impartial) -> Abstract Noun (IMPARTIALITY)."
        },
        {
            root: "MAINTAIN",
            req: "NOUN",
            ans: "MAINTENANCE",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "Deferred ________ on the suspension bridge eventually forced a six-month closure.",
            formula: "maintain -> mainten- (vowel shift: ai -> e) + -ance = MAINTENANCE",
            rule: "Cambridge's #1 spelling pitfall: MAINTAIN changes its second 'ai' to a single 'e' in MAINTENANCE (never *maintainance)."
        },

        // Internal Vowel & Stem Shifts (Cambridge C1/C2 Classics)
        {
            root: "LONG",
            req: "VERB",
            ans: "LENGTHEN",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "The council voted to ________ the consultation period by three weeks.",
            formula: "LONG (Adj) -> Vowel Mutation (O -> E) + -TH (Noun stem) + -EN (Verb suffix) = LENGTHEN",
            rule: "Monosyllabic dimension adjectives (long, strong, broad, wide, deep) first form a -th noun stem or vowel shift before taking -en."
        },
        {
            root: "STRONG",
            req: "VERB",
            ans: "STRENGTHEN",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "New maritime regulations were introduced to ________ harbour safety protocols.",
            formula: "STRONG (Adj) -> Vowel Mutation (O -> E) + -TH (Noun stem) + -EN (Verb suffix) = STRENGTHEN",
            rule: "Never write *strongen! STRONG shifts its vowel to STRENGTH before taking the causative verb suffix -EN."
        },
        {
            root: "DEEP",
            req: "NOUN",
            ans: "DEPTH",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "Submersibles must be tested to a ________ of four thousand metres before deployment.",
            formula: "DEEP (Adj) -> Vowel Shortening (EE -> E) + -TH (Abstract noun suffix) = DEPTH",
            rule: "Double 'ee' shortens to single 'e' when forming the abstract measurement noun DEPTH."
        },
        {
            root: "WIDE",
            req: "NOUN",
            ans: "WIDTH",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "Engineers measured the exact ________ of the canal lock before ordering the steel gates.",
            formula: "WIDE (Adj) -> Drop -E + Vowel Shortening + -TH = WIDTH",
            rule: "WIDE drops the silent '-e' and adds '-th' directly to form WIDTH (contrast with the verb WIDEN)."
        },
        {
            root: "PROUD",
            req: "NOUN",
            ans: "PRIDE",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "Master watchmakers take immense ________ in assembling every gear by hand.",
            formula: "PROUD (Adj) -> Diphthong Mutation (OU -> I) + Consonant Shift (D -> DE) = PRIDE",
            rule: "Fixed C1 collocation: 'take (immense/great) pride in + noun/-ing'."
        },
        {
            root: "BROAD",
            req: "VERB",
            ans: "BROADEN",
            category: "vowel",
            badge: "CAUSATIVE -EN VERB",
            sentence: "Studying architecture abroad helped ________ his appreciation of civic design.",
            formula: "BROAD (Adj) + -EN (Causative verb suffix) = BROADEN",
            rule: "Collocates with 'horizons', 'appeal', 'scope', and 'appreciation'."
        },
        {
            root: "DESTROY",
            req: "NOUN",
            ans: "DESTRUCTION",
            category: "vowel",
            badge: "INTERNAL VOWEL SHIFT",
            sentence: "Coastal wetlands provide a vital buffer against the ________ caused by winter storm surges.",
            formula: "destroy -> destruct- (stem shift: oy -> uct) + -ion = DESTRUCTION",
            rule: "The verb stem DESTROY mutates to the Latinate root DESTRUCT- before taking nominal -ion or adjectival -ive."
        },

        // C1/C2 Compound Nouns & Adjectives
        {
            root: "BREAK",
            req: "COMPOUND NOUN",
            ans: "OUTBREAK",
            category: "compound",
            badge: "C1 COMPOUND NOUN",
            sentence: "Rapid sanitation measures prevented a wider ________ of waterborne illness.",
            formula: "OUT (Particle prefix) + BREAK (Verb root) = OUTBREAK",
            rule: "Phrasal verb 'break out' inverts into the single-word compound noun OUTBREAK (collocates with 'of disease / hostilities')."
        },
        {
            root: "SHORT",
            req: "COMPOUND NOUN (PLURAL)",
            ans: "SHORTCOMINGS",
            alt: ["SHORTCOMING"],
            category: "compound",
            badge: "C1 COMPOUND NOUN",
            sentence: "Despite a few minor methodological ________, the report offers valuable insights.",
            formula: "SHORT + COM(E) + -ING + -S = SHORTCOMINGS",
            rule: "C1 compound noun meaning 'flaws or weaknesses'; almost always appears in the plural after 'despite its'."
        },
        {
            root: "COME",
            req: "COMPOUND NOUN",
            ans: "OUTCOME",
            category: "compound",
            badge: "C1 COMPOUND NOUN",
            sentence: "It is still too early to predict the final ________ of the trade negotiations.",
            formula: "OUT (Particle prefix) + COME (Verb root) = OUTCOME",
            rule: "High-frequency academic C1 replacement for 'result' ('the final outcome of...')."
        },
        {
            root: "DRAW",
            req: "COMPOUND NOUN",
            ans: "DRAWBACK",
            category: "compound",
            badge: "C1 COMPOUND NOUN",
            sentence: "The main ________ of the geothermal scheme is its high initial drilling cost.",
            formula: "DRAW (Verb root) + BACK (Particle suffix) = DRAWBACK",
            rule: "Essential C1 essay noun meaning 'disadvantage' ('The primary drawback of...')."
        },
        {
            root: "TURN",
            req: "COMPOUND NOUN",
            ans: "DOWNTURN",
            category: "compound",
            badge: "C1 COMPOUND NOUN",
            sentence: "Small manufacturing firms weathered the economic ________ better than expected.",
            formula: "DOWN (Particle prefix) + TURN (Noun/Verb root) = DOWNTURN",
            rule: "Collocates strongly with 'economic' or 'market' ('an economic downturn')."
        },
        {
            root: "STAND",
            req: "COMPOUND ADJECTIVE",
            ans: "OUTSTANDING",
            category: "compound",
            badge: "C1 COMPOUND ADJECTIVE",
            sentence: "Two ________ issues must be resolved before the merger contract can be signed.",
            formula: "OUT + STAND + -ING = OUTSTANDING",
            rule: "Dual C1 meaning: (1) exceptionally good; (2) not yet resolved or paid ('outstanding issues / balances')."
        },

        // Core B2–C1 Stem & Negative Derivations
        {
            root: "SUCCEED",
            req: "ADJECTIVE",
            ans: "SUCCESSFUL",
            category: "stem",
            badge: "STEM & SUFFIX SHIFT",
            sentence: "Only twelve percent of early-stage grant applications were ________ this year.",
            formula: "succeed -> success (noun stem) + -ful (adj. suffix) = SUCCESSFUL",
            rule: "Verb SUCCEED (-ceed) shifts to noun stem SUCCESS (-cess) before taking -ful."
        },
        {
            root: "APPROVE",
            req: "NOUN (NEGATIVE)",
            ans: "DISAPPROVAL",
            category: "negative",
            badge: "NEGATIVE PREFIX + -AL NOUN",
            sentence: "The committee expressed strong ________ of the unannounced timetable changes.",
            formula: "dis- (neg. prefix) + approv(e) (drop -e) + -al (deverbal noun suffix) = DISAPPROVAL",
            rule: "Verbs like approve, arrive, survive, refuse, and propose form abstract nouns with '-al' rather than '-tion'."
        },
        {
            root: "CARE",
            req: "ADVERB",
            ans: "CAREFULLY",
            category: "stem",
            badge: "DOUBLE SUFFIX (-FUL + -LY)",
            sentence: "Every archival photograph must be catalogued ________ before digitisation.",
            formula: "care + -ful (adj.) + -ly (adv.) = CAREFULLY",
            rule: "Retain the full '-ful' before adding '-ly', resulting in a double 'll' (CAREFULLY)."
        },
        {
            root: "NATURE",
            req: "ADVERB",
            ans: "NATURALLY",
            category: "stem",
            badge: "DOUBLE SUFFIX (-AL + -LY)",
            sentence: "________, local shopkeepers were concerned when the bridge closed for repairs.",
            formula: "natur(e) (drop -e) + -al (adj.) + -ly (adv.) = NATURALLY",
            rule: "Drop silent '-e' before '-al', then add '-ly' (double 'll')."
        },
        {
            root: "EXPECT",
            req: "NOUN",
            ans: "EXPECTATION",
            alt: ["EXPECTATIONS"],
            category: "stem",
            badge: "NOMINALISATION (-ATION)",
            sentence: "There is a growing ________ that interest rates will stabilise before autumn.",
            formula: "expect + -ation (abstract noun suffix) = EXPECTATION",
            rule: "Forms the abstract noun EXPECTATION ('beyond all expectations' / 'there is a growing expectation that...')."
        },
        {
            root: "FRIEND",
            req: "ADJECTIVE (NEGATIVE)",
            ans: "UNFRIENDLY",
            category: "negative",
            badge: "NEGATIVE ADJECTIVE IN -LY",
            sentence: "Despite the bleak, ________ weather, the coastal rescue crew completed the drill.",
            formula: "un- (neg. prefix) + friend + -ly (adjective suffix!) = UNFRIENDLY",
            rule: "Not all words ending in '-ly' are adverbs! Noun + -ly (friendly, costly, timely, lively) forms an ADJECTIVE."
        },
        {
            root: "RELY",
            req: "ADJECTIVE",
            ans: "RELIABLE",
            category: "stem",
            badge: "Y -> I SPELLING SHIFT",
            sentence: "Long-term climate models depend on ________ historical barometer records.",
            formula: "rely (change -y to -i) + -able = RELIABLE",
            rule: "Consonant + Y shifts to 'I' before '-able' (rely -> reliable, justify -> justifiable)."
        },
        {
            root: "DAY",
            req: "ADVERB",
            ans: "DAILY",
            category: "stem",
            badge: "Y -> I SPELLING SHIFT",
            sentence: "Water quality in the reservoir is monitored ________ by environmental chemists.",
            formula: "day (irregular y -> i shift) + -ly = DAILY",
            rule: "Exception to the vowel+y rule: DAY and GAY shift 'y' to 'i' before '-ly' (DAILY)."
        },
        {
            root: "DANGER",
            req: "ADJECTIVE",
            ans: "DANGEROUS",
            category: "stem",
            badge: "ADJECTIVAL -OUS",
            sentence: "Strong tidal currents make swimming near the breakwater extremely ________.",
            formula: "danger + -ous (adjectival suffix) = DANGEROUS",
            rule: "Retains the 'e' in DANGER when adding '-ous' (contrast with 'monster -> monstrous' or 'disaster -> disastrous')."
        },
        {
            root: "PRODUCE",
            req: "NOUN",
            ans: "PRODUCTION",
            category: "stem",
            badge: "NOMINALISATION (-TION)",
            sentence: "Industrial ________ of solar-grade silicon has doubled over the past five years.",
            formula: "produc(e) (drop -e) + -tion = PRODUCTION",
            rule: "Verbs in -duce (produce, reduce, introduce, deduce) drop '-e' and take '-tion'."
        },
        {
            root: "PROBABLE",
            req: "ADVERB (NEGATIVE)",
            ans: "IMPROBABLY",
            category: "negative",
            badge: "DOUBLE-AFFIX NEGATIVE",
            sentence: "The antique clock survived the warehouse fire ________ intact.",
            formula: "im- (neg. prefix before P) + probab(le) (drop -le) + -ly = IMPROBABLY",
            rule: "Adjectives ending in consonant + '-le' drop '-le' and replace it with '-ly' (probable -> improbably)."
        },
        {
            root: "SIGNIFY",
            req: "NOUN",
            ans: "SIGNIFICANCE",
            category: "stem",
            badge: "STEM & SUFFIX SHIFT",
            sentence: "Few contemporaries grasped the full historical ________ of the 1912 discovery.",
            formula: "signif(y) -> signific- (Latinate stem) + -ance = SIGNIFICANCE",
            rule: "Verbs ending in '-fy' (signify, clarify, modify) shift to '-fic-' in nominal and adjectival forms (SIGNIFICANCE)."
        },
        {
            root: "LOGIC",
            req: "ADVERB (NEGATIVE)",
            ans: "ILLOGICALLY",
            category: "negative",
            badge: "DOUBLE-AFFIX (-ALLY)",
            sentence: "Rather ________, the agency cut maintenance funding during the busiest travel season.",
            formula: "il- (neg. prefix before L) + logic + -al + -ly = ILLOGICALLY",
            rule: "Adjectives ending in '-ic' (logic/logical, tragic, scientific) form adverbs with '-ally' (ILLOGICALLY)."
        },
        {
            root: "SATISFY",
            req: "ADJECTIVE (NEGATIVE)",
            ans: "DISSATISFIED",
            alt: ["UNSATISFACTORY", "UNSATISFIED"],
            category: "negative",
            badge: "DOUBLE S + Y -> I SHIFT",
            sentence: "Several season-ticket holders remained ________ with the revised refund policy.",
            formula: "dis- (neg. prefix) + satisf(y -> i) + -ed = DISSATISFIED",
            rule: "Because 'dis-' ends in 's' and 'satisfy' starts with 's', both 's' letters are kept, producing a double 'ss' (DISSATISFIED)."
        }
    ];

    const SPEED_MAP = {
        relaxed: 0.065,
        standard: 0.135,
        master: 0.22
    };

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');

    const speedSelect = document.getElementById('speed-select');
    const categorySelect = document.getElementById('category-select');
    const liveSpeedSelect = document.getElementById('live-speed-select');

    const categoryBadgeEl = document.getElementById('category-badge');
    const revealModelBtn = document.getElementById('btn-reveal-model');
    const targetFormEl = document.getElementById('target-form');
    const contextSentenceEl = document.getElementById('context-sentence-text');
    const rootWordEl = document.getElementById('root-word');
    const blockEl = document.getElementById('word-block');
    const beltEl = document.querySelector('.belt');
    const typingInput = document.getElementById('typing-input');
    const forgeSubmitBtn = document.getElementById('btn-forge-submit');

    const morphPanel = document.getElementById('morph-blueprint-panel');
    const morphHeadline = document.getElementById('morph-headline');
    const morphStatusPill = document.getElementById('morph-status-pill');
    const morphFormulaCode = document.getElementById('morph-formula-code');
    const morphCompletedSentence = document.getElementById('morph-completed-sentence');
    const morphRuleNote = document.getElementById('morph-rule-note');
    const morphActionsRow = document.getElementById('morph-actions-row');
    const nextCrateBtn = document.getElementById('btn-next-crate');

    const scoreEl = document.getElementById('score-display');
    const quotaEl = document.getElementById('quota-display');
    const livesEl = document.getElementById('lives-display');

    // --- State ---
    let queue = [];
    let currentWord = null;
    let score = 0;
    let quota = 10;
    let lives = 3;
    let isActive = false;
    let blockPos = 0; // percentage
    let baseSpeed = SPEED_MAP.standard;
    let speed = SPEED_MAP.standard;
    let gameLoopReq = null;
    let advanceTimer = null;

    // --- Init (Instant Play — No Forced Sign-Up Gate) ---
    if (startBtn) startBtn.disabled = false;

    const handleEnterStart = (e) => {
        if (e.key === 'Enter' && startModal && startModal.classList.contains('open')) {
            e.preventDefault();
            startBtn.click();
        }
    };
    if (nameInput) nameInput.addEventListener('keydown', handleEnterStart);
    if (emailInput) emailInput.addEventListener('keydown', handleEnterStart);

    if (speedSelect) {
        speedSelect.addEventListener('change', () => {
            const mode = speedSelect.value;
            if (liveSpeedSelect) liveSpeedSelect.value = mode;
            baseSpeed = SPEED_MAP[mode] || SPEED_MAP.standard;
            speed = baseSpeed;
        });
    }

    if (liveSpeedSelect) {
        liveSpeedSelect.addEventListener('change', () => {
            const mode = liveSpeedSelect.value;
            if (speedSelect) speedSelect.value = mode;
            baseSpeed = SPEED_MAP[mode] || SPEED_MAP.standard;
            speed = baseSpeed + (score * 0.008);
        });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (startModal) startModal.classList.remove('open');
            startGame();
        });
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', () => {
            if (endModal) endModal.classList.remove('open');
            startGame();
        });
    }

    if (forgeSubmitBtn) {
        forgeSubmitBtn.addEventListener('click', () => {
            attemptForge();
        });
    }

    if (revealModelBtn) {
        revealModelBtn.addEventListener('click', () => {
            if (!currentWord) return;
            clearTimeout(advanceTimer);
            isActive = false;
            cancelAnimationFrame(gameLoopReq);
            if (beltEl) beltEl.classList.add('paused');
            renderContextSentence(currentWord, currentWord.ans, 'forged-ok');
            showBlueprint(currentWord, 'CAMBRIDGE C1/C2 MODEL REVEALED', false, true);
        });
    }

    if (nextCrateBtn) {
        nextCrateBtn.addEventListener('click', () => {
            clearTimeout(advanceTimer);
            isActive = true;
            if (beltEl) beltEl.classList.remove('paused');
            nextWord();
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

    function buildQueue() {
        const cat = categorySelect ? categorySelect.value : 'all';
        if (cat === 'marathon40') {
            return shuffle([...allWords]);
        }
        if (cat === 'vowel' || cat === 'negative' || cat === 'compound' || cat === 'stem') {
            const filtered = allWords.filter(item => item.category === cat);
            return shuffle([...filtered]).slice(0, Math.min(10, filtered.length));
        }
        return shuffle([...allWords]).slice(0, 10);
    }

    function startGame() {
        clearTimeout(advanceTimer);
        cancelAnimationFrame(gameLoopReq);

        const selectedSpeedMode = speedSelect ? speedSelect.value : 'standard';
        if (liveSpeedSelect) liveSpeedSelect.value = selectedSpeedMode;
        baseSpeed = SPEED_MAP[selectedSpeedMode] || SPEED_MAP.standard;
        speed = baseSpeed;

        queue = buildQueue();
        quota = queue.length;
        score = 0;
        lives = 3;
        isActive = true;

        updateHud();
        if (typingInput) {
            typingInput.value = '';
            typingInput.disabled = false;
            typingInput.focus();
        }
        if (beltEl) beltEl.classList.remove('paused');

        nextWord();
    }

    function updateHud() {
        if (scoreEl) scoreEl.textContent = String(score);
        if (quotaEl) quotaEl.textContent = String(quota);
        if (livesEl) livesEl.textContent = "⚙️".repeat(Math.max(0, lives));
    }

    function renderContextSentence(wordObj, gapFillText, gapStateClass) {
        if (!contextSentenceEl || !wordObj) return;
        const rawSentence = wordObj.sentence || `Form the ${wordObj.req} from ________.`;
        const gapHtml = `<span class="context-gap ${gapStateClass || ''}">${gapFillText || '________'}</span>`;
        const formatted = rawSentence.replace('________', gapHtml);
        contextSentenceEl.innerHTML = `${formatted} <strong class="context-root-tag">(${wordObj.root})</strong>`;
    }

    function showBlueprint(wordObj, statusText, isMiss, showNextButton) {
        if (!morphPanel || !wordObj) return;
        if (morphHeadline) {
            morphHeadline.textContent = `${wordObj.root} → ${wordObj.ans} (${wordObj.req})`;
        }
        if (morphStatusPill) {
            morphStatusPill.textContent = statusText || 'CAMBRIDGE C1/C2 MODEL';
            morphStatusPill.classList.toggle('status-miss', !!isMiss);
        }
        if (morphFormulaCode) {
            morphFormulaCode.textContent = wordObj.formula || `${wordObj.root} → ${wordObj.ans}`;
        }
        if (morphCompletedSentence) {
            const rawSentence = wordObj.sentence || '';
            morphCompletedSentence.innerHTML = rawSentence.replace('________', `<strong>${wordObj.ans}</strong>`);
        }
        if (morphRuleNote) {
            morphRuleNote.textContent = wordObj.rule || '';
        }
        if (morphActionsRow) {
            morphActionsRow.hidden = !showNextButton;
        }
        morphPanel.hidden = false;
    }

    function nextWord() {
        clearTimeout(advanceTimer);
        if (lives <= 0) {
            endGame(false);
            return;
        }
        if (queue.length === 0) {
            endGame(true);
            return;
        }

        currentWord = queue.shift();
        if (categoryBadgeEl) {
            categoryBadgeEl.textContent = currentWord.badge || 'CAMBRIDGE PART 3 MORPHOLOGY';
        }
        if (targetFormEl) targetFormEl.textContent = currentWord.req;
        if (rootWordEl) rootWordEl.textContent = currentWord.root;
        renderContextSentence(currentWord, '________', '');

        if (morphPanel) morphPanel.hidden = true;
        if (morphActionsRow) morphActionsRow.hidden = true;

        blockPos = 0;
        if (blockEl) {
            blockEl.style.left = '0%';
            blockEl.className = 'block';
        }

        if (typingInput) {
            typingInput.value = '';
            typingInput.className = '';
            typingInput.disabled = false;
            typingInput.focus();
        }
        if (beltEl) beltEl.classList.remove('paused');

        cancelAnimationFrame(gameLoopReq);
        gameLoop();
    }

    function gameLoop() {
        if (!isActive) return;

        blockPos += speed;
        if (blockPos >= 85) {
            handleDrop();
            return;
        }

        if (blockEl) blockEl.style.left = blockPos + '%';
        gameLoopReq = requestAnimationFrame(gameLoop);
    }

    function handleDrop() {
        isActive = false;
        cancelAnimationFrame(gameLoopReq);
        if (beltEl) beltEl.classList.add('paused');
        lives--;
        updateHud();

        if (currentWord) {
            const sentenceText = currentWord.sentence
                ? `${currentWord.sentence} (${currentWord.root})`
                : `Form the ${currentWord.req} from "${currentWord.root}"`;
            const userWord = (typingInput && typingInput.value.trim().toUpperCase()) || '(timed out)';
            const morphHint = `${currentWord.root} → ${currentWord.ans} (${currentWord.formula || currentWord.req})`;
            window.CandidateDossier?.recordAttempt({
                category: 'word_formation',
                correct: false,
                game: 'Word Factory',
                prompt: sentenceText,
                keyword: currentWord.root,
                targetAnswer: currentWord.ans,
                userAttempt: userWord,
                explanation: morphHint
            });
        }

        if (blockEl) blockEl.className = 'block fail';
        if (typingInput && currentWord) {
            typingInput.value = currentWord.ans;
            typingInput.className = 'error';
        }
        if (currentWord) {
            renderContextSentence(currentWord, currentWord.ans, 'forged-miss');
            showBlueprint(currentWord, 'INCINERATED // CAMBRIDGE MODEL', true, true);
        }

        advanceTimer = setTimeout(() => {
            isActive = true;
            nextWord();
        }, 2200);
    }

    function attemptForge() {
        if (!isActive || !currentWord || !typingInput) return;

        const guess = typingInput.value.trim().toUpperCase();
        if (!guess) return;

        const acceptedList = [currentWord.ans, ...(currentWord.alt || [])];
        const isCorrect = acceptedList.includes(guess);

        const sentenceText = currentWord.sentence
            ? `${currentWord.sentence} (${currentWord.root})`
            : `Form the ${currentWord.req} from "${currentWord.root}"`;
        const morphHint = `${currentWord.root} → ${currentWord.ans} (${currentWord.formula || currentWord.req})`;

        window.CandidateDossier?.recordAttempt({
            category: 'word_formation',
            correct: isCorrect,
            game: 'Word Factory',
            prompt: sentenceText,
            keyword: currentWord.root,
            targetAnswer: currentWord.ans,
            userAttempt: guess,
            explanation: morphHint
        });

        if (isCorrect) {
            isActive = false;
            cancelAnimationFrame(gameLoopReq);
            if (beltEl) beltEl.classList.add('paused');

            score++;
            speed = baseSpeed + (score * 0.008);
            updateHud();

            if (blockEl) blockEl.className = 'block success';
            renderContextSentence(currentWord, currentWord.ans, 'forged-ok');
            showBlueprint(currentWord, 'FORGED // CAMBRIDGE C1/C2 MODEL', false, true);

            advanceTimer = setTimeout(() => {
                isActive = true;
                nextWord();
            }, 1350);
        } else {
            typingInput.className = 'error';
            setTimeout(() => {
                if (typingInput) typingInput.className = '';
            }, 300);
        }
    }

    if (typingInput) {
        typingInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && isActive) {
                e.preventDefault();
                attemptForge();
            }
        });
    }

    function endGame(won) {
        clearTimeout(advanceTimer);
        isActive = false;
        cancelAnimationFrame(gameLoopReq);
        if (beltEl) beltEl.classList.add('paused');
        if (typingInput) typingInput.disabled = true;

        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');

        if (won && score >= Math.ceil(quota * 0.9)) {
            if (title) {
                title.textContent = "QUOTA MET (C2 LEVEL)";
                title.style.color = "var(--brass-light)";
            }
            if (desc) {
                desc.textContent = "Masterful craftsmanship! You forged every complex derivative with zero hesitation. Ready to apply this lexical control in full C1/C2 exam tasks?";
            }
        } else if (won) {
            if (title) {
                title.textContent = "QUOTA MET (MARGINAL)";
                title.style.color = "var(--brass-light)";
            }
            if (desc) {
                desc.textContent = `Scored under ${Math.ceil(quota * 0.9)}/${quota}? Cambridge Part 3 Use of English penalises tricky prefixes and internal vowel shifts. In 1-to-1 sessions, we eliminate these recurring errors.`;
            }
        } else {
            if (title) {
                title.textContent = "FACTORY SHUTDOWN";
                title.style.color = "var(--danger)";
            }
            if (desc) {
                desc.textContent = "Word formation requires speed and morphological precision. In our 1-to-1 diagnostic lessons, we identify your exact spelling and affix weaknesses.";
            }
        }

        const finalScoreEl = document.getElementById('final-score');
        if (finalScoreEl) finalScoreEl.textContent = `${score}/${quota}`;

        const leadScoreEl = document.getElementById('lead-score');
        if (leadScoreEl) leadScoreEl.value = `Word Factory - Score: ${score}/${quota}`;

        const leadEmailEl = document.getElementById('lead-email');
        if (leadEmailEl) leadEmailEl.value = emailInput ? emailInput.value.trim() : '';

        const leadNameEl = document.getElementById('lead-name');
        if (leadNameEl) leadNameEl.value = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : 'Foreman';

        if (endModal) endModal.classList.add('open');

        if (typeof window.showDiagnosticGate === 'function') {
            setTimeout(() => {
                window.showDiagnosticGate({
                    gameName: 'The Formation Factory',
                    score: score,
                    maxScore: quota,
                    weakArea: 'Morphological Derivation & Double-Affix Shifts (Use of English Part 3)',
                    examImpact: 'In Cambridge C1/C2 Use of English Part 3, missing double-affixes (e.g. in-explic-ab-ly or un-precedent-ed) drops your score directly into B2 territory.',
                    onReplay: () => {
                        if (endModal) endModal.classList.remove('open');
                        if (startBtn) startBtn.click();
                    }
                });
            }, 600);
        }
    }

})();
