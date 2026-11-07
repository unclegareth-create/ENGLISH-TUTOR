/* ==========================================================
   Grammar Crypt: shared curriculum, checker and save store.
   Loaded by grammar-crypt.html (crypt.js) and grammar-crypt-3d.html.
   Exposes window.CRYPT_LEVELS.

   ITEM SCHEMA (built by item()):
     tokens   [{pos, text}]   runes that belong in the sentence (natural case)
     decoys   [{pos, text}]   extra runes that never belong
     slots    [{pos, label}]  one per token; label is generic ('Any') where the
                              accepted answers disagree on the part of speech
     answers  string[][]      every accepted ordering (answers[0] = model)
     nearMiss [{order, msg}]  grammatical but not the target structure:
                              no penalty, tailored message
     traps    [{order, msg}]  classic errors: wrong, but with a tailored tip
     explain  string          shown after a win / in the first hint

   AUTHORING SHORTHAND: 'pos:text|pos:text|?'  (',', '.', '?' are punctuation).
   Orders in alt / near / trap are token texts joined with '|'.
   ========================================================== */
(function (root) {
    'use strict';

    const POS = {
        wh: 'Wh-word', aux: 'Auxiliary', subj: 'Subject', verb: 'Verb', obj: 'Object',
        comp: 'Complement', adv: 'Adverbial', neg: 'Neg./restrictive', conj: 'Conjunction',
        prep: 'Preposition', part: 'Particle', rel: 'Relative', cleft: 'Cleft opener', punct: 'Punct.'
    };
    // CSS class used by the 2D board (crypt.css colours)
    const CSS = {
        wh: 'wh-word', aux: 'aux', subj: 'subject', verb: 'verb', obj: 'object', comp: 'complement',
        adv: 'adverb', neg: 'negative', conj: 'conjunction', prep: 'preposition', part: 'particle',
        rel: 'relative', cleft: 'cleft', punct: 'punctuation'
    };
    const TIPS = {
        wh: 'A wh-word opens a question (or a wh-cleft) and asks for information.',
        aux: 'Questions and inversions put the auxiliary before the subject.',
        subj: 'The subject is who or what does the action.',
        verb: 'Check the verb form: base after do/did/modals, past participle after have, -ing after be.',
        obj: 'The object normally follows the verb.',
        comp: 'A complement completes be/seem: it describes the subject.',
        adv: 'Adverbials say how, when or where; check whether this one can move.',
        neg: 'A fronted negative or restrictive adverbial (never, only then...) triggers inversion.',
        conj: 'Conjunctions link clauses: than after no sooner, when after hardly, that after so/such.',
        prep: 'In informal questions the preposition goes to the end: Who did you speak to?',
        part: 'Particles (out, to...) stay close to the verb they belong to.',
        rel: 'In it-clefts, the focused phrase is followed by that/who.',
        cleft: 'Cleft openers (it, all, the thing, the reason) start the sentence or follow be.',
        punct: 'Questions end with ?, statements with a full stop; commas separate fronted clauses.',
        any: 'More than one order works here, but this rune is not one of them.'
    };
    const PUNCT = /^[,.;:?!]$/;

    function parseTok(s) {
        s = s.trim();
        if (PUNCT.test(s)) return { pos: 'punct', text: s };
        const i = s.indexOf(':');
        const pos = s.slice(0, i), text = s.slice(i + 1);
        if (!POS[pos]) throw new Error('Unknown POS "' + pos + '" in ' + s);
        return { pos, text };
    }
    const splitOrder = (o) => o.split('|').map(t => t.trim());

    let autoId = 0;
    function item(spec, o = {}) {
        const tokens = spec.split('|').map(parseTok);
        const decoys = (o.d ? o.d.split('|') : []).map(parseTok);
        const model = tokens.map(t => t.text);
        const answers = [model].concat((o.alt || []).map(splitOrder));
        const posOf = {};
        decoys.concat(tokens).forEach(t => { posOf[t.text] = t.pos; });
        const slots = model.map((text, i) => {
            const p = tokens[i].pos;
            return { pos: p, label: POS[p] || 'Word' };
        });
        const nearMiss = (o.near || []).map(n => Array.isArray(n) ? { order: splitOrder(n[0]), msg: n[1] } : { order: splitOrder(n), msg: null });
        const traps = (o.trap || []).map(n => ({ order: splitOrder(n[0]), msg: n[1] }));
        return { id: o.id || ('i' + (++autoId)), tokens, decoys, slots, answers, nearMiss, traps, explain: o.ex || '', posOf };
    }

    const NEAR = {
        neg: 'Grammatical, but this floor needs inversion: put the negative/restrictive adverbial first, then the auxiliary, then the subject.',
        cond: "Grammatical, but this floor needs inversion: drop 'if' and open with the auxiliary.",
        so: 'Grammatical, but this floor needs so/such inversion: front so + adjective (or such), then invert.',
        cleft: 'Grammatical, but this floor wants the cleft structure, with the focus placed by the cleft.',
        front: 'Grammatical, but this floor needs fronting: move the phrase to the start of the sentence.'
    };
    const WERE = "Inverted conditionals need were, never was: 'Were I you...', 'Were it not for...'.";

    /* ---------------- 25 FLOORS x 6-8 ITEMS ---------------- */
    const floors = [
        /* ===== ACT I: B1 QUESTIONS (1-5) ===== */
        { title: 'Wh- Questions in the Past', cefr: 'B1',
          formula: 'Wh-Word + did + Subject + Base Verb (+ Object / Adverbial)',
          examTip: 'IELTS Speaking Part 1 & 3: Keep auxiliary-subject inversion clean and use the base verb after "did" (never double-mark the past with "did... said" or "did... went").',
          pool: [
            item('wh:what|aux:did|subj:she|verb:say|?', { d: 'verb:said', trap: [['what|did|she|said|?', 'Did already marks the past tense, so use the base verb say, not said.']], ex: 'Wh-word + did + subject + BASE verb. Did already carries the past, so say, not said.' }),
            item('wh:where|aux:did|subj:he|verb:hide|obj:the key|?', { d: 'verb:hid', trap: [['where|did|he|hid|the key|?', 'Did shows the past, so keep the main verb in the base form: hide, not hid.']], ex: 'Did shows the past, so the main verb stays in the base form: hide, not hid.' }),
            item('wh:why|aux:did|subj:they|verb:leave|adv:so early|?', { d: 'verb:left', trap: [['why|did|they|left|so early|?', 'Use the base verb leave after did, never the past form left.']], ex: 'Why + did + subject + base verb; the adverbial goes at the end.' }),
            item('wh:when|aux:did|subj:you|verb:arrive|adv:in London|?', { d: 'verb:arrived', trap: [['when|did|you|arrived|in London|?', 'After did, use the base verb arrive, not arrived.']], ex: 'When + did + subject + base verb + place.' }),
            item('wh:how|aux:did|subj:you|verb:find|obj:the answer|?', { d: 'verb:found', trap: [['how|did|you|found|the answer|?', 'Did already marks the past tense, so use the base verb: find, not found.'], ['how|you|did|find|the answer|?', 'In a question, the auxiliary did must come before the subject you.']], ex: 'How + did + subject + base verb (find, not found).' }),
            item('wh:who|aux:did|subj:they|verb:invite|adv:to the party|?', { d: 'verb:invited', trap: [['who|did|they|invited|to the party|?', 'Never use a past simple verb after did: use the base form invite.']], ex: 'Object question in the past: Who + did + subject + base verb.' }),
            item('wh:which train|aux:did|subj:she|verb:catch|adv:this morning|?', { d: 'verb:caught', alt: ['this morning|which train|did|she|catch|?'], trap: [['which train|did|she|caught|this morning|?', 'After did, keep the main verb in the base form: catch, not caught.']], ex: 'Which + noun + did + subject + base verb (catch, not caught).' }),
            item('wh:what time|aux:did|subj:the flight|verb:land|adv:yesterday|?', { d: 'verb:landed', alt: ['yesterday|what time|did|the flight|land|?'], trap: [['what time|did|the flight|landed|yesterday|?', 'Did already marks the past tense, so use the base verb land, not landed.']], ex: 'What time + did + subject + base verb (land, not landed).' }),
            item('wh:how much|aux:did|subj:they|verb:pay|prep:for|obj:the tickets|?', { d: 'verb:paid', trap: [['how much|did|they|paid|for|the tickets|?', 'After did, keep the main verb in the base form: pay, not paid.']], ex: 'How much + did + subject + base verb + prepositional phrase.' })
        ] },
        { title: 'Yes/No Questions', cefr: 'B1',
          formula: 'Auxiliary (do / does / did) + Subject + Base Verb (+ Object / Adverbial)',
          examTip: 'Cambridge Speaking Part 3 (Collaborative Task): Essential for natural turn-taking prompts ("Do you reckon...?", "Did that strike you as...?").',
          pool: [
            item('aux:did|subj:they|verb:win|obj:the match|?', { d: 'verb:won', trap: [['did|they|won|the match|?', 'After did, use the base verb win, not won.']], ex: 'Yes/no questions open with the auxiliary: did + subject + base verb + object.' }),
            item('aux:does|subj:your sister|verb:work|adv:in a bank|?', { d: 'verb:works', trap: [['does|your sister|works|in a bank|?', 'Does already carries the third-person -s, so use work, not works.']], ex: 'Does already shows third person -s, so the verb stays base: work, not works.' }),
            item('aux:do|subj:you|adv:often|verb:eat|part:out|?', { d: 'aux:does', alt: ['do|you|eat|out|often|?'], trap: [['does|you|often|eat|out|?', 'You takes the auxiliary do, never does.']], ex: 'Frequency adverbs sit before the main verb (Do you often eat out?) or at the end (Do you eat out often?).' }),
            item('aux:did|subj:the manager|verb:approve|obj:the budget|?', { d: 'verb:approved', trap: [['did|the manager|approved|the budget|?', 'Use the base verb approve after did, not approved.']], ex: 'Did + subject + base verb + object.' }),
            item('aux:does|subj:the train|verb:stop|adv:at Oxford|?', { d: 'verb:stops', trap: [['does|the train|stops|at Oxford|?', 'Does already carries the third-person -s ending, so use stop, not stops.']], ex: 'Does + singular subject + base verb (stop, not stops).' }),
            item('aux:did|subj:you|verb:remember|part:to|verb:lock|obj:the door|?', { d: 'verb:remembered', trap: [['did|you|remembered|to|lock|the door|?', 'After did, the main verb stays in the base form: remember, not remembered.']], ex: 'Did + subject + base verb + to-infinitive.' }),
            item('aux:do|subj:these keys|verb:belong|prep:to|obj:you|?', { d: 'aux:does', trap: [['does|these keys|belong|to|you|?', 'These keys is plural, so use do, not does.']], ex: 'Do + plural subject + base verb (belong to someone).' }),
            item('aux:does|subj:he|verb:know|obj:the way|adv:to the station|?', { d: 'verb:knows', trap: [['does|he|knows|the way|to the station|?', 'Does already carries the third-person -s, so use the base verb know, not knows.']], ex: 'Does + singular subject + base verb (know, not knows).' }),
            item('aux:did|subj:she|verb:mention|obj:the deadline|adv:at lunch|?', { d: 'verb:mentioned', trap: [['did|she|mentioned|the deadline|at lunch|?', 'Use the base verb mention after did, never mentioned.']], ex: 'Did + subject + base verb + object + time/place.' })
        ] },
        { title: 'Questions with Be', cefr: 'B1',
          formula: '(Wh-Word +) am / is / are / was / were + Subject + Verb-ing (+ Preposition)',
          examTip: 'IELTS Speaking Part 2 & 3: Keeps past and present continuous scene-setting accurate without mixing "did" and "-ing" forms.',
          pool: [
            item('aux:were|subj:they|verb:arguing|?', { d: 'verb:argued', trap: [['were|they|argued|?', 'For an active past continuous question, pair were with the -ing form arguing.']], ex: 'Past continuous questions: was/were + subject + verb-ing.' }),
            item('wh:why|aux:was|subj:he|verb:running|?', { d: 'verb:run', trap: [['why|was|he|run|?', 'After was, use the present participle running, not base run.']], ex: 'Why + was/were + subject + verb-ing: the auxiliary still precedes the subject.' }),
            item('wh:what|aux:were|subj:you|verb:doing|adv:at midnight|?', { d: 'aux:did', trap: [['what|did|you|doing|at midnight|?', 'Never pair did with an -ing verb; use were doing.']], ex: 'What + were + subject + doing: be + -ing, not did + -ing.' }),
            item('wh:who|aux:was|subj:she|verb:talking|prep:to|?', { d: 'aux:did', trap: [['who|did|she|talking|to|?', 'Talking requires the auxiliary was, not did.']], ex: 'In everyday questions the preposition goes to the end: Who was she talking to?' }),
            item('aux:are|subj:you|verb:waiting|prep:for|obj:the bus|?', { d: 'aux:do', trap: [['do|you|waiting|for|the bus|?', 'With an -ing verb in the present continuous, use are, never do.']], ex: 'Present continuous question: Are + subject + verb-ing + prepositional phrase.' }),
            item('wh:where|aux:was|subj:she|verb:staying|adv:in Dublin|?', { d: 'aux:did', trap: [['where|did|she|staying|in Dublin|?', 'Did takes a base verb; for an -ing form, use was/were.']], ex: 'Where + was + subject + verb-ing.' }),
            item('wh:why|aux:are|subj:they|verb:laughing|prep:at|obj:us|?', { d: 'verb:laugh', trap: [['why|are|they|laugh|at|us|?', 'After are, use the present participle (-ing): laughing, not laugh.']], ex: 'Why + are + subject + verb-ing + preposition + object.' }),
            item('aux:was|subj:it|verb:raining|adv:when you left|?', { d: 'aux:did', trap: [['did|it|raining|when you left|?', 'Raining (-ing) needs the auxiliary was, never did.']], ex: 'Past continuous yes/no question: Was + it + raining + time clause.' }),
            item('wh:what|aux:is|subj:he|verb:complaining|prep:about|?', { d: 'aux:does', trap: [['what|does|he|complaining|about|?', 'With the -ing participle complaining, use is, never does.']], ex: 'What + is + subject + verb-ing + stranded preposition (about).' })
        ] },
        { title: 'Present Perfect Questions', cefr: 'B1',
          formula: '(Wh-Word +) have / has + Subject (+ ever) + Past Participle (+ yet)',
          examTip: 'Cambridge C1 Part 4 & Speaking: Connects past actions to present consequences ("How long have you...", "Have you ever..."). Watch irregular participles (spoken, taken, been).',
          pool: [
            item('aux:have|subj:you|adv:ever|verb:been|adv:to Rome|?', { d: 'verb:went', trap: [['have|you|ever|went|to Rome|?', 'After have, use the past participle been, never the past simple went.']], ex: 'Have + subject + ever + past participle. Been to = visited and came back.' }),
            item('wh:how long|aux:have|subj:they|verb:lived|adv:here|?', { d: 'verb:live', trap: [['how long|have|they|live|here|?', 'After have, use the past participle lived, not base live.']], ex: 'How long + have + subject + past participle asks about duration up to now.' }),
            item('aux:has|subj:the parcel|verb:arrived|adv:yet|?', { d: 'verb:arrive', trap: [['has|the parcel|arrive|yet|?', 'Has requires the past participle arrived, not arrive.']], ex: 'Yet goes at the end of present perfect questions.' }),
            item('wh:what|aux:has|subj:she|verb:done|adv:with my keys|?', { d: 'verb:did', trap: [['what|has|she|did|with my keys|?', 'After has, use the past participle done, never did.']], ex: 'Has + subject + past participle: done, not did.' }),
            item('aux:have|subj:you|verb:spoken|prep:to|obj:the director|adv:yet|?', { d: 'verb:spoke', trap: [['have|you|spoke|to|the director|yet|?', 'After have, use the past participle spoken, never the past simple spoke.']], ex: 'Have + subject + past participle (spoken, not spoke) + yet.' }),
            item('wh:where|aux:have|subj:you|verb:put|obj:my glasses|?', { d: 'aux:did', near: [['where|did|you|put|my glasses|?', 'Grammatical in the past simple, but this floor practises present perfect for present results: Where have you put my glasses?']], ex: 'Where + have + subject + past participle focuses on where the glasses are now.' }),
            item('wh:how many times|aux:has|subj:he|verb:taken|obj:the exam|?', { d: 'verb:took', trap: [['how many times|has|he|took|the exam|?', 'After has, use the past participle taken, not took.']], ex: 'How many times + has + subject + past participle for repeated experiences up to now.' }),
            item('aux:has|subj:she|adv:ever|verb:flown|adv:in a helicopter|?', { d: 'verb:flew', trap: [['has|she|ever|flew|in a helicopter|?', 'After has, use the past participle flown, never the past simple flew.']], ex: 'Has + subject + ever + past participle (flown, not flew).' }),
            item('wh:why|aux:have|subj:they|verb:cancelled|obj:the concert|?', { d: 'verb:cancel', trap: [['why|have|they|cancel|the concert|?', 'After have, use the past participle cancelled, not base cancel.']], ex: 'Why + have + subject + past participle asks about a past action with a present result.' })
        ] },
        { title: 'Subject & Object Questions', cefr: 'B1+', boss: true,
          formula: 'Subject Q: Wh-Subject + Inflected Verb | Object Q: Wh-Object + Auxiliary + Subject + Base Verb',
          examTip: 'Cambridge Use of English & Speaking: When "Who", "What", or "Which + noun" is the subject, never insert "do/does/did" ("What happened?", not "What did happen?").',
          pool: [
            item('wh:who|verb:broke|obj:the window|?', { d: 'aux:did', ex: 'When who/what is the SUBJECT, there is no auxiliary: Who broke the window?' }),
            item('wh:who|aux:did|subj:you|verb:speak|prep:to|?', { d: 'verb:spoke', trap: [['who|did|you|spoke|to|?', 'After did, use the base verb speak, not spoke.']], ex: 'Who is the object of to, so we need did + subject + base verb, with the preposition at the end.' }),
            item('wh:what|verb:happened|adv:at the meeting|?', { d: 'aux:did', ex: 'What is the subject of happened, so no did: What happened?' }),
            item('wh:what|aux:are|subj:you|verb:looking|prep:for|?', { d: 'verb:look', trap: [['what|are|you|look|for|?', 'After are, use the -ing form looking, not look.']], ex: 'Present continuous question with the preposition stranded at the end: looking for.' }),
            item('wh:which team|verb:won|obj:the championship|?', { d: 'aux:did', ex: 'Subject question: Which team is the subject, so the past verb follows directly without did.' }),
            item('wh:who|verb:left|obj:this umbrella|adv:in the hall|?', { d: 'aux:did', ex: 'Who is the subject of left, so no auxiliary did is used.' }),
            item('wh:what|aux:did|subj:the witness|verb:tell|obj:the police|?', { d: 'verb:told', trap: [['what|did|the witness|told|the police|?', 'Here what is the object and the witness is the subject, so use did + base verb tell.']], ex: 'Object question: What + did + subject + base verb (tell, not told).' }),
            item('wh:what|verb:caused|obj:the delay|adv:this morning|?', { d: 'aux:did', ex: 'Subject question: What is the subject of caused, so do not insert did.' }),
            item('wh:which candidate|aux:did|subj:the board|verb:choose|?', { d: 'verb:chose', trap: [['which candidate|did|the board|chose|?', 'Here the board is the subject and which candidate is the object, so use did + base verb choose.']], ex: 'Object question: Which candidate + did + subject (the board) + base verb (choose).' })
        ] },

        /* ===== ACT II: PERFECT, MODAL, PASSIVE (6-10) ===== */
        { title: 'Perfect Tenses', cefr: 'B2',
          formula: 'Subject + have / has / had (+ been) + Past Participle / Verb-ing + Time Anchor',
          examTip: 'IELTS Speaking Part 2 (Act 1 Context) & C1 Part 4: Past perfect ("had already left") anchors background narrative before your main past event.',
          pool: [
            item('subj:she|aux:has|verb:lived|adv:here|adv:since 2019|.', { d: 'aux:is', alt: ['since 2019|she|has|lived|here|.'], trap: [['she|is|lived|here|since 2019|.', 'With since + point in time, use the present perfect has lived, not is.']], ex: 'Present perfect + since for a state continuing to now. Short time phrases can also open the sentence.' }),
            item('subj:they|aux:had|adv:already|verb:left|adv:when we arrived|.', { d: 'verb:leave', alt: ['they|had|left|already|when we arrived|.', 'when we arrived|they|had|already|left|.', 'when we arrived|they|had|left|already|.'], trap: [['they|had|already|leave|when we arrived|.', 'After had, use the past participle left, not base leave.']], ex: 'Past perfect (had + past participle) for the earlier of two past events.' }),
            item('wh:how long|aux:have|subj:you|aux:been|verb:waiting|?', { d: 'aux:did', trap: [['how long|did|you|been|waiting|?', 'Been waiting requires have, never did.']], ex: 'Present perfect continuous question: how long + have + subject + been + -ing.' }),
            item('subj:I|aux:have|aux:been|verb:working|adv:all morning|.', { d: 'verb:worked', alt: ['all morning|I|have|been|working|.'], trap: [['I|have|been|worked|all morning|.', 'Active present perfect continuous uses have been + verb-ing (working), not worked.']], ex: 'Have been + -ing stresses an activity continuing up to now.' }),
            item('adv:by the time|subj:we|verb:arrived|,|subj:the film|aux:had|verb:started|.', { d: 'aux:has', alt: ['the film|had|started|,|by the time|we|arrived|.'], trap: [['by the time|we|arrived|,|the film|has|started|.', 'With a past time marker (by the time we arrived), use the past perfect had started, not has started.']], ex: 'By the time + past simple, past perfect (had + past participle) for the earlier past action.' }),
            item('subj:she|aux:has|aux:been|verb:teaching|adv:for|adv:nineteen years|.', { d: 'verb:taught', trap: [['she|has|been|taught|for|nineteen years|.', 'She is the one teaching (active), so use has been teaching; has been taught is passive.']], ex: 'Present perfect continuous (has been + -ing) emphasises an unbroken activity continuing into the present.' }),
            item('subj:I|aux:had|neg:never|verb:seen|obj:the sea|adv:before that day|.', { d: 'verb:saw', alt: ['before that day|I|had|never|seen|the sea|.'], trap: [['I|had|never|saw|the sea|before that day|.', 'After had, always use the past participle seen, never saw.']], ex: 'Past perfect (had never seen) looks back from a past point (before that day).' }),
            item('subj:they|aux:have|aux:been|verb:rehearsing|adv:since|adv:nine o\'clock|.', { d: 'verb:rehearsed', alt: ['since|nine o\'clock|they|have|been|rehearsing|.'], trap: [['they|have|been|rehearsed|since|nine o\'clock|.', 'Active present perfect continuous uses have been + verb-ing (rehearsing).']], ex: 'Have been + verb-ing + since + starting point for an ongoing activity.' }),
            item('subj:he|aux:had|adv:just|verb:stepped|adv:outside|adv:when it poured|.', { d: 'verb:step', alt: ['when it poured|he|had|just|stepped|outside|.'], trap: [['he|had|just|step|outside|when it poured|.', 'After had, use the past participle stepped, not base step.']], ex: 'Past perfect (had just stepped) marks the action immediately before a past event.' })
        ] },
        { title: 'Modals of Deduction', cefr: 'B2',
          formula: 'Subject + Modal (must / might / may / can\'t) + have (+ been) + Past Participle',
          examTip: 'Cambridge C1 Part 4 Key Word Transformations: "I am certain she didn\'t see us" -> "She CAN\'T HAVE SEEN us" (never "mustn\'t have" for deduction).',
          pool: [
            item('subj:she|aux:must|aux:have|verb:forgotten|.', { d: 'verb:forgot', trap: [['she|must|have|forgot|.', 'After must have, use the past participle forgotten, not forgot.']], ex: 'Must have + past participle = I am sure this happened.' }),
            item("subj:they|aux:can't|aux:have|verb:seen|obj:us|.", { d: 'verb:saw', trap: [["they|can't|have|saw|us|.", 'After have you need the past participle: seen, not saw.']], ex: "Can't have + past participle = I am sure this did NOT happen." }),
            item('subj:he|aux:might|aux:have|verb:missed|obj:the train|.', { d: 'verb:miss', trap: [['he|might|have|miss|the train|.', 'After might have, use the past participle missed, not miss.']], ex: 'Might have + past participle = perhaps this happened.' }),
            item('subj:the thief|aux:must|aux:have|verb:climbed|adv:through the window|.', { d: 'verb:climb', trap: [['the thief|must|have|climb|through the window|.', 'After must have, use the past participle climbed.']], ex: 'Modal + have + past participle for deductions about the past.' }),
            item("subj:you|aux:can't|aux:have|verb:read|obj:the instructions|adv:properly|.", { d: "aux:mustn't", trap: [["you|mustn't|have|read|the instructions|properly|.", "For a negative logical deduction about the past, use can't have + past participle, never mustn't have."]], ex: "Can't have + past participle expresses certainty that something did not happen (never mustn't have for deduction)." }),
            item('subj:she|aux:may|aux:have|aux:been|verb:delayed|adv:by traffic|.', { d: 'verb:delay', trap: [['she|may|have|been|delay|by traffic|.', 'Passive modal deduction requires the past participle delayed after been.']], ex: 'Modal perfect passive of possibility: may + have + been + past participle.' }),
            item('subj:he|aux:must|aux:have|aux:been|verb:sleeping|adv:when you called|.', { d: 'verb:slept', trap: [['he|must|have|been|slept|when you called|.', 'Sleep is active here, so after must have been use the -ing form sleeping.']], ex: 'Must + have + been + verb-ing deduces an action that was in progress in the past.' }),
            item('subj:they|aux:must|aux:have|verb:taken|obj:the wrong turning|.', { d: 'verb:took', trap: [['they|must|have|took|the wrong turning|.', 'After must have, use the past participle taken, never took.']], ex: 'Must have + past participle (taken) expresses a strong logical conclusion about the past.' }),
            item("subj:she|aux:can't|aux:have|verb:known|prep:about|obj:the change|.", { d: 'verb:knew', trap: [["she|can't|have|knew|about|the change|.", "After can't have, use the past participle known, not knew."]], ex: "Can't have + past participle (known) = it is impossible that she knew." })
        ] },
        { title: 'Modals of Regret & Criticism', cefr: 'B2',
          formula: 'should / ought to / could / needn\'t + have + V3 | would rather / high time + Subject + Past Simple',
          examTip: 'Cambridge C1 Part 4 Favourite: "I\'d prefer you to speak to her" -> "I WOULD RATHER YOU SPOKE to her" & "We really ought to leave" -> "It is HIGH TIME WE LEFT".',
          pool: [
            item('subj:you|aux:should|aux:have|verb:told|obj:me|.', { d: 'verb:tell', trap: [['you|should|have|tell|me|.', 'After should have, use the past participle told, not tell.']], ex: 'Should have + past participle criticises a past action that did not happen.' }),
            item('subj:we|aux:could|aux:have|verb:won|obj:the final|.', { d: 'verb:win', trap: [['we|could|have|win|the final|.', 'After could have, use the past participle won, not win.']], ex: 'Could have + past participle: a past possibility that did not happen.' }),
            item('wh:what|aux:would|subj:you|aux:have|verb:done|?', { d: 'verb:did', trap: [['what|would|you|have|did|?', 'After would have, use the past participle done, not did.']], ex: 'Question form: wh-word + would + subject + have + past participle.' }),
            item("subj:she|aux:needn't|aux:have|verb:worried|.", { d: 'verb:worry', trap: [["she|needn't|have|worry|.", "After needn't have, use the past participle worried, not worry."]], ex: "Needn't have + past participle: she worried, but it was unnecessary." }),
            item('subj:I|verb:would rather|subj:you|verb:spoke|prep:to|obj:her|adv:directly|.', { d: 'verb:speak', trap: [['I|would rather|you|speak|to|her|directly|.', 'When would rather has a different subject (would rather you...), use the past simple (unreal past) for present/future preference: spoke, not speak.']], ex: 'Would rather + new subject + past simple (spoke) expresses a present or future preference.' }),
            item('cleft:it|verb:is|comp:high time|subj:we|verb:left|obj:this place|.', { d: 'verb:leave', trap: [['it|is|high time|we|leave|this place|.', 'After It is high time + subject, use the past simple (unreal past): left, not leave.']], ex: 'It is high time + subject + past simple (left) says something should happen right now.' }),
            item('subj:you|aux:ought to|aux:have|verb:apologised|prep:for|obj:the delay|.', { d: 'verb:apologise', trap: [['you|ought to|have|apologise|for|the delay|.', 'After ought to have, use the past participle: apologised, not apologise.']], ex: 'Ought to have + past participle criticises a past failure to act.' }),
            item('subj:he|aux:should|neg:not|aux:have|verb:signed|obj:that contract|.', { d: 'verb:sign', trap: [['he|should|not|have|sign|that contract|.', 'After should not have, use the past participle signed, not sign.']], ex: 'Should not have + past participle expresses regret or criticism about a past action.' }),
            item('subj:I|verb:would rather|subj:they|aux:had|verb:stayed|adv:at home|.', { d: 'verb:stay', trap: [['I|would rather|they|had|stay|at home|.', 'For a past preference with a new subject, use would rather + subject + had + past participle (stayed).']], ex: 'Would rather + subject + past perfect (had stayed) expresses regret about someone else\'s past action.' })
        ] },
        { title: 'The Passive Voice', cefr: 'B2',
          formula: 'Subject (Recipient) + be (was / are / is being / have been) + Past Participle (+ by / to)',
          examTip: 'IELTS Writing Task 1 (Process Diagrams) & Task 2: Depersonalises arguments and shifts focus to outcomes. Remember "be made TO do" in the passive!',
          pool: [
            item('subj:the bridge|aux:was|verb:built|adv:in 1890|.', { d: 'verb:build', alt: ['in 1890|the bridge|was|built|.'], trap: [['the bridge|was|build|in 1890|.', 'Passive voice needs be + past participle: built, not build.']], ex: 'Passive: be + past participle. The doer is unknown or unimportant.' }),
            item('subj:the letters|aux:are|verb:delivered|adv:every morning|.', { d: 'verb:deliver', alt: ['every morning|the letters|are|delivered|.'], trap: [['the letters|are|deliver|every morning|.', 'After are in the passive, use the past participle delivered.']], ex: 'Present simple passive: am/is/are + past participle.' }),
            item('subj:the suspect|aux:is|aux:being|verb:questioned|adv:by the police|.', { d: 'verb:question', trap: [['the suspect|is|being|question|by the police|.', 'After is being, use the past participle questioned.']], ex: 'Present continuous passive: is + being + past participle; by introduces the agent.' }),
            item('subj:the ledger|aux:had|aux:been|verb:updated|.', { d: 'verb:update', trap: [['the ledger|had|been|update|.', 'After had been, use the past participle updated.']], ex: 'Past perfect passive: had + been + past participle.' }),
            item('subj:all flights|aux:have|aux:been|verb:cancelled|adv:due to fog|.', { d: 'verb:cancel', alt: ['due to fog|all flights|have|been|cancelled|.'], trap: [['all flights|have|been|cancel|due to fog|.', 'Passive requires the past participle after been: cancelled, not cancel.']], ex: 'Present perfect passive: have/has + been + past participle.' }),
            item('subj:we|aux:were|verb:made|part:to|verb:wait|adv:outside|.', { d: 'verb:waiting', trap: [['we|were|made|to|waiting|outside|.', 'After were made to, use the base verb wait, not waiting.']], ex: 'In the passive, make requires a to-infinitive: be made to + base verb.' }),
            item('subj:the roof|aux:is|aux:being|verb:repaired|adv:this week|.', { d: 'aux:been', alt: ['this week|the roof|is|being|repaired|.'], trap: [['the roof|is|been|repaired|this week|.', 'After is/are in the continuous passive, use being, not been.']], ex: 'Present continuous passive: is/are + being + past participle.' }),
            item('subj:the winners|aux:will|aux:be|verb:announced|adv:tomorrow|.', { d: 'verb:announce', alt: ['tomorrow|the winners|will|be|announced|.'], trap: [['the winners|will|be|announce|tomorrow|.', 'Future passive requires will be + past participle: announced, not announce.']], ex: 'Future simple passive: will + be + past participle.' }),
            item('subj:the castle|aux:was|verb:destroyed|prep:by|obj:fire|.', { d: 'verb:destroy', trap: [['the castle|was|destroy|by|fire|.', 'After was in the passive, use the past participle destroyed, not destroy.']], ex: 'Past simple passive: was/were + past participle + by + agent.' })
        ] },
        { title: 'Advanced Passives', cefr: 'C1', boss: true,
          formula: 'Subject + is said / believed / rumoured + to have been + V3 (or Modal + have been + V3)',
          examTip: 'IELTS Writing Task 2 Band 7.5+ & C1 Part 4: Replaces weak personal claims ("People think...") with authoritative C1 passive reporting ("...is widely believed to have been...").',
          pool: [
            item('subj:the report|aux:will|aux:have|aux:been|verb:finished|adv:by Friday|.', { d: 'verb:finish', alt: ['by Friday|the report|will|have|been|finished|.'], trap: [['the report|will|have|been|finish|by Friday|.', 'Future perfect passive ends with the past participle finished, not finish.']], ex: 'Future perfect passive: will + have + been + past participle.' }),
            item('subj:he|aux:is|verb:said|part:to|aux:have|verb:been|comp:a spy|.', { d: 'verb:saying', ex: 'Reporting passive: subject + is said + to have + past participle for an earlier situation.' }),
            item('subj:the documents|aux:must|aux:have|aux:been|verb:stolen|.', { d: 'verb:stole', trap: [['the documents|must|have|been|stole|.', 'After been, use the past participle stolen, never stole.']], ex: 'Modal perfect passive: must + have + been + past participle.' }),
            item('subj:the patient|aux:should|aux:be|verb:seen|adv:by a specialist|.', { d: 'verb:saw', trap: [['the patient|should|be|saw|by a specialist|.', 'After should be, use the past participle seen, not saw.']], ex: 'Modal passive: modal + be + past participle.' }),
            item('subj:the painting|aux:is|verb:believed|part:to|aux:have|aux:been|verb:destroyed|.', { d: 'verb:destroy', trap: [['the painting|is|believed|to|have|been|destroy|.', 'After to have been, use the past participle destroyed, not destroy.']], ex: 'Passive reporting verb + perfect passive infinitive: is believed + to have been + past participle.' }),
            item('subj:nobody|verb:likes|aux:being|verb:told|wh:what|part:to|verb:do|.', { d: 'aux:be', trap: [['nobody|likes|be|told|what|to|do|.', 'After like/dislike/hate, the passive gerund uses being + past participle: being told.']], ex: 'Passive gerund: being + past participle follows verbs like enjoy, hate, and like.' }),
            item('subj:the CEO|aux:is|verb:rumoured|part:to|aux:be|verb:considering|obj:resignation|.', { d: 'verb:considered', trap: [['the CEO|is|rumoured|to|be|considered|resignation|.', 'The CEO is actively considering resignation, so use the continuous infinitive to be considering.']], ex: 'Reporting passive + continuous infinitive: is rumoured + to be + verb-ing for an action in progress now.' }),
            item('subj:the manuscript|aux:is|verb:thought|part:to|aux:have|verb:originated|adv:in Venice|.', { d: 'verb:originate', trap: [['the manuscript|is|thought|to|have|originate|in Venice|.', 'After to have, use the past participle originated, not originate.']], ex: 'Personal reporting passive: is thought + to have + past participle for an earlier event.' }),
            item('subj:the suspect|aux:was|verb:seen|part:to|verb:enter|obj:the building|.', { d: 'verb:entering', trap: [['the suspect|was|seen|to|entering|the building|.', 'After passive was seen to, use the base verb enter, not entering.']], ex: 'In the passive, see + bare infinitive becomes be seen + to-infinitive (was seen to enter).' })
        ] },

        /* ===== ACT III: NEGATIVE INVERSION (11-15) ===== */
        { title: 'Never, Rarely, Seldom', cefr: 'C1',
          formula: 'Negative Adverbial (Never / Rarely / Seldom / At no time) + Auxiliary + Subject + Main Verb',
          examTip: 'Cambridge C1 Part 4 & IELTS Task 2: Placing a negative frequency adverb at the start of a sentence forces question word order. One well-placed inversion elevates Grammatical Range.',
          pool: [
            item('neg:never|aux:had|subj:I|verb:seen|obj:such chaos|.', { d: 'verb:saw', near: ['I|had|never|seen|such chaos|.'], trap: [['never|had|I|saw|such chaos|.', 'After had you need the past participle: seen.'], ['I|never|had|seen|such chaos|.', 'In normal order, never goes after the auxiliary: I had never seen. But this floor needs inversion.']], ex: 'A fronted negative adverb forces question order: Never + had + subject + past participle.' }),
            item('neg:rarely|aux:do|subj:we|verb:see|obj:such talent|.', { d: 'verb:sees', near: ['we|rarely|do|see|such talent|.'], trap: [['we|do|rarely|see|such talent|.', 'Do + rarely sounds unnatural. Normal order is we rarely (do) see, but this floor needs inversion: Rarely do we see...']], ex: 'Rarely + do/does/did + subject + base verb: present simple needs do-support when inverted.' }),
            item('neg:seldom|aux:has|subj:the city|verb:looked|comp:so beautiful|.', { d: 'verb:look', near: ['the city|has|seldom|looked|so beautiful|.'], trap: [['the city|seldom|has|looked|so beautiful|.', 'In normal order, seldom goes after the auxiliary: the city has seldom looked. But this floor needs inversion.']], ex: 'Seldom + has + subject + past participle.' }),
            item('neg:at no time|aux:was|subj:the public|verb:informed|.', { d: 'verb:inform', near: ['the public|was|at no time|informed|.', 'the public|was|informed|at no time|.'], ex: 'At no time + auxiliary + subject. Here the auxiliary is the passive was.' }),
            item('neg:never before|aux:have|subj:we|verb:witnessed|obj:such a crisis|.', { d: 'verb:witness', near: ['we|have|never before|witnessed|such a crisis|.'], trap: [['never before|we|have|witnessed|such a crisis|.', 'After fronted Never before, invert the auxiliary and subject: have we, not we have.']], ex: 'Never before + have/has + subject + past participle.' }),
            item('neg:seldom|aux:does|subj:a debut novel|verb:receive|obj:such praise|.', { d: 'verb:receives', near: ['a debut novel|does|seldom|receive|such praise|.'], trap: [['seldom|does|a debut novel|receives|such praise|.', 'Does already carries the third-person -s, so the main verb must be base form: receive.'], ['seldom|a debut novel|does|receive|such praise|.', 'Invert the auxiliary before the subject: Seldom does a debut novel...']], ex: 'Seldom + does + singular subject + base verb (receive, not receives).' }),
            item('neg:rarely|aux:had|subj:the panel|aux:been|verb:faced|prep:with|obj:such a dilemma|.', { d: 'verb:face', near: ['the panel|had|rarely|been|faced|with|such a dilemma|.'], trap: [['rarely|the panel|had|been|faced|with|such a dilemma|.', 'Fronting Rarely requires subject-auxiliary inversion: Rarely had the panel...']], ex: 'Rarely + had + subject + been + past participle (past perfect passive inversion).' }),
            item('neg:never|aux:will|subj:I|verb:forget|obj:that evening|.', { d: 'verb:forgets', near: ['I|will|never|forget|that evening|.'], trap: [['never|I|will|forget|that evening|.', 'After fronted Never, invert the modal will before the subject I.']], ex: 'Never + modal (will) + subject + base verb.' }),
            item('neg:seldom|aux:have|subj:two rivals|verb:fought|adv:so fiercely|.', { d: 'verb:fight', near: ['two rivals|have|seldom|fought|so fiercely|.'], trap: [['seldom|have|two rivals|fight|so fiercely|.', 'After have, use the past participle fought, not fight.']], ex: 'Seldom + have + plural subject + past participle.' })
        ] },
        { title: 'Little, Not Once, Nowhere', cefr: 'C1',
          formula: 'Restrictive Opening (Little / Not once / Nowhere / In no way) + Auxiliary / Be + Subject + Base Verb',
          examTip: 'Cambridge C1 Part 4 Classic: "He had no idea of the danger" -> "LITTLE DID HE REALISE the danger." Always check whether present ("does") or past ("did") is required.',
          pool: [
            item('neg:little|aux:did|subj:he|verb:realise|obj:the danger|.', { d: 'verb:realised', trap: [['little|did|he|realised|the danger|.', 'Did already carries the past tense, so use the base verb realise, not realised.']], ex: 'Little (= not at all) + did + subject + base verb.' }),
            item('neg:not once|aux:did|subj:she|verb:complain|.', { d: 'verb:complained', near: ['she|did|not once|complain|.'], trap: [['not once|did|she|complained|.', 'After did, use the base verb complain, not complained.']], ex: 'Not once + did + subject + base verb.' }),
            item('neg:nowhere|adv:else|aux:will|subj:you|verb:find|obj:such hospitality|.', { d: 'verb:found', near: ['you|will|find|such hospitality|nowhere|else|.'], trap: [['nowhere|else|you|will|find|such hospitality|.', 'Fronting Nowhere else triggers inversion: will you find, not you will find.']], ex: 'Nowhere (else) + modal + subject + base verb.' }),
            item('neg:in no way|verb:is|subj:this|comp:acceptable|.', { d: 'verb:are', near: ['this|is|in no way|acceptable|.'], trap: [['in no way|this|is|acceptable|.', 'Invert the verb be before the subject: In no way is this acceptable.']], ex: 'With be as the main verb, be itself inverts: In no way is this acceptable.' }),
            item('neg:little|aux:does|subj:she|verb:know|wh:what|verb:awaits|obj:her|.', { d: 'verb:knows', trap: [['little|does|she|knows|what|awaits|her|.', 'After does, the main verb must be in the base form: know, not knows.'], ['little|she|does|know|what|awaits|her|.', 'Fronted Little triggers inversion: Little does she know...']], ex: 'Little + does + subject + base verb (know) for present lack of awareness.' }),
            item('neg:not once|aux:have|subj:they|verb:offered|part:to|verb:help|.', { d: 'verb:offer', near: ['they|have|not once|offered|to|help|.'], trap: [['not once|they|have|offered|to|help|.', 'Put the auxiliary have before the subject they after Not once.']], ex: 'Not once + have/has + subject + past participle.' }),
            item('neg:in no way|aux:should|subj:this|aux:be|verb:seen|prep:as|obj:a defeat|.', { d: 'verb:see', near: ['this|should|in no way|be|seen|as|a defeat|.'], trap: [['in no way|this|should|be|seen|as|a defeat|.', 'Invert the modal auxiliary and subject after In no way: should this, not this should.']], ex: 'In no way + modal + subject + passive infinitive (be seen).' }),
            item('neg:nowhere|aux:was|subj:the key|part:to|aux:be|verb:found|.', { d: 'verb:find', near: ['the key|was|nowhere|to|be|found|.'], trap: [['nowhere|the key|was|to|be|found|.', 'Fronting Nowhere forces inversion of was before the subject the key.']], ex: 'Nowhere + was + subject + to be found.' }),
            item('neg:little|aux:did|subj:they|verb:expect|obj:such a warm welcome|.', { d: 'verb:expected', trap: [['little|did|they|expected|such a warm welcome|.', 'After did, use the base verb expect, never expected.']], ex: 'Little + did + subject + base verb (expect).' })
        ] },
        { title: 'No Sooner, Hardly, Scarcely', cefr: 'C1',
          formula: 'No sooner + had + Subject + V3 + THAN... | Hardly / Scarcely + had + Subject + V3 + WHEN...',
          examTip: 'Cambridge C1/C2 Part 4 Staple: Examiners test two things simultaneously: (1) past perfect inversion ("had we...") and (2) the exact conjunction pair ("No sooner... than" vs "Hardly/Scarcely... when").',
          pool: [
            item('neg:no sooner|aux:had|subj:we|verb:sat down|conj:than|subj:the phone|verb:rang|.', { d: 'conj:when', near: ['we|had|no sooner|sat down|than|the phone|rang|.'], trap: [['no sooner|had|we|sat down|when|the phone|rang|.', 'No sooner pairs with than, not when.']], ex: 'No sooner + had + subject + past participle + than + past simple.' }),
            item('neg:hardly|aux:had|subj:she|verb:arrived|conj:when|subj:the trouble|verb:started|.', { d: 'conj:than', near: ['she|had|hardly|arrived|when|the trouble|started|.'], trap: [['hardly|had|she|arrived|than|the trouble|started|.', 'Hardly pairs with when (or before), not than.']], ex: 'Hardly + had + subject + past participle + when + past simple.' }),
            item('neg:scarcely|aux:had|subj:the play|verb:begun|conj:when|subj:the lights|verb:failed|.', { d: 'verb:began', near: ['the play|had|scarcely|begun|when|the lights|failed|.'], trap: [['scarcely|had|the play|began|when|the lights|failed|.', 'After had, use the past participle begun, never the past simple began.']], ex: 'Scarcely + had + subject + past participle (begun, not began) + when.' }),
            item('neg:no sooner|aux:had|subj:I|verb:closed|obj:my eyes|conj:than|subj:the alarm|verb:went off|.', { d: 'conj:when', near: ['I|had|no sooner|closed|my eyes|than|the alarm|went off|.'], trap: [['no sooner|had|I|closed|my eyes|when|the alarm|went off|.', 'No sooner is comparative (-er), so it must pair with than, never when.']], ex: 'No sooner + had + subject + past participle + than + past simple clause.' }),
            item('neg:hardly|aux:had|subj:the train|verb:left|obj:the station|conj:when|subj:it|verb:began|adv:to snow|.', { d: 'conj:than', near: ['the train|had|hardly|left|the station|when|it|began|to snow|.'], trap: [['hardly|had|the train|left|the station|than|it|began|to snow|.', 'Hardly pairs with when (or before), never than.']], ex: 'Hardly + had + subject + past participle + when + past simple.' }),
            item('neg:scarcely|aux:had|subj:he|verb:spoken|obj:those words|conj:when|subj:the door|verb:flew|comp:open|.', { d: 'verb:spoke', near: ['he|had|scarcely|spoken|those words|when|the door|flew|open|.'], trap: [['scarcely|had|he|spoke|those words|when|the door|flew|open|.', 'After had, use the past participle spoken, never spoke.']], ex: 'Scarcely + had + subject + past participle (spoken) + when + past simple.' }),
            item('neg:no sooner|aux:had|subj:she|verb:opened|obj:the letter|conj:than|subj:she|verb:smiled|.', { d: 'conj:when', near: ['she|had|no sooner|opened|the letter|than|she|smiled|.'], trap: [['no sooner|had|she|opened|the letter|when|she|smiled|.', 'No sooner always pairs with than, never when.']], ex: 'No sooner + had + subject + past participle + than + past simple.' }),
            item('neg:hardly|aux:had|subj:we|verb:set off|conj:when|subj:the engine|verb:stalled|.', { d: 'conj:than', near: ['we|had|hardly|set off|when|the engine|stalled|.'], trap: [['hardly|had|we|set off|than|the engine|stalled|.', 'Hardly pairs with when, never than.']], ex: 'Hardly + had + subject + past participle + when + past simple.' }),
            item('neg:scarcely|aux:had|subj:the ship|verb:docked|conj:when|subj:the passengers|verb:disembarked|.', { d: 'conj:than', near: ['the ship|had|scarcely|docked|when|the passengers|disembarked|.'], trap: [['scarcely|had|the ship|docked|than|the passengers|disembarked|.', 'Scarcely pairs with when (or before), never than.']], ex: 'Scarcely + had + subject + past participle + when + past simple.' })
        ] },
        { title: 'Not Until & Only...', cefr: 'C1',
          formula: 'Only after / Only when / Not until + [Normal Subordinate Clause] + Auxiliary + Subject + Main Verb',
          examTip: 'Cambridge C1 Part 4 Trap: When "Only when" or "Not until" opens a two-clause sentence, NEVER invert the first clause—hold the inversion until the MAIN clause ("...did we speak").',
          pool: [
            item('neg:not until|adv:the next day|aux:did|subj:we|verb:hear|obj:the news|.', { d: 'verb:heard', trap: [['not until|the next day|did|we|heard|the news|.', 'After did, use the base verb hear, not heard.']], ex: 'Not until + time + did + subject + base verb.' }),
            item('neg:only after|subj:she|verb:left|aux:did|subj:we|verb:speak|.', { d: 'verb:spoke', alt: ['only after|we|left|did|she|speak|.'], trap: [['only after|she|left|did|we|spoke|.', 'In the inverted main clause, did requires the base verb speak, not spoke.']], ex: 'Only after + clause, then inversion in the MAIN clause: did we speak. The time clause itself is not inverted.' }),
            item('neg:only then|aux:did|subj:I|verb:understand|obj:the problem|.', { d: 'verb:understood', trap: [['only then|did|I|understood|the problem|.', 'After did, use the base verb understand, not understood.']], ex: 'Only then + did + subject + base verb.' }),
            item('neg:only when|subj:the results|verb:arrived|aux:did|subj:they|verb:celebrate|.', { d: 'verb:celebrated', trap: [['only when|the results|arrived|did|they|celebrated|.', 'After did, use the base verb celebrate, not celebrated.']], ex: 'Only when + clause + inverted main clause.' }),
            item('neg:not until|subj:the sun|verb:rose|aux:did|subj:the search|verb:begin|.', { d: 'verb:began', trap: [['not until|the sun|rose|did|the search|began|.', 'Did already carries the past tense, so use the base verb begin, not began.'], ['not until|did|the sun|begin|the search|rose|.', 'Do not invert the subordinate Not until clause; invert the main clause (did the search begin).']], ex: 'Not until + subordinate clause (normal order) + inverted main clause (did + subject + base verb).' }),
            item('neg:only by|verb:working|adv:together|aux:can|subj:we|verb:solve|obj:this crisis|.', { d: 'verb:solved', near: ['we|can|solve|this crisis|only by|working|together|.'], trap: [['only by|working|together|we|can|solve|this crisis|.', 'Fronting Only by + -ing forces inversion in the main clause: can we solve, not we can solve.']], ex: 'Only by + gerund phrase + modal/auxiliary + subject + base verb.' }),
            item('neg:only in|adv:an emergency|aux:should|subj:this button|aux:be|verb:pressed|.', { d: 'verb:press', near: ['this button|should|be|pressed|only in|an emergency|.'], trap: [['only in|an emergency|this button|should|be|pressed|.', 'After fronted Only in an emergency, invert the modal and subject: should this button.']], ex: 'Only in + prepositional phrase + modal + subject + passive verb.' }),
            item('neg:only later|aux:did|subj:she|verb:discover|obj:the truth|.', { d: 'verb:discovered', trap: [['only later|did|she|discovered|the truth|.', 'After did, use the base verb discover, not discovered.']], ex: 'Only later + did + subject + base verb.' }),
            item('neg:not until|adv:midnight|aux:did|subj:the storm|verb:subside|.', { d: 'verb:subsided', trap: [['not until|midnight|did|the storm|subsided|.', 'After did, use the base verb subside, not subsided.']], ex: 'Not until + time phrase + did + subject + base verb.' })
        ] },
        { title: 'Under No Circumstances', cefr: 'C1', boss: true,
          formula: 'Under no circumstances / On no account / Not only + Auxiliary / Modal + Subject + Main Verb',
          examTip: 'IELTS Writing Task 2 & C1 Proposals/Reports: "Not only is the plan expensive, but it is also risky" links two arguments with high-level C1 syntactic cohesion.',
          pool: [
            item('neg:under no circumstances|aux:should|subj:you|verb:open|obj:this door|.', { d: 'verb:opened', near: ['you|should|under no circumstances|open|this door|.', 'you|should|open|this door|under no circumstances|.'], trap: [['under no circumstances|you|should|open|this door|.', 'Invert the modal should before the subject you.']], ex: 'Under no circumstances + modal + subject + base verb.' }),
            item('neg:not only|verb:is|subj:the plan|comp:expensive|,|conj:but|subj:it|verb:is|adv:also|comp:risky|.', { d: 'aux:does', near: [['the plan|is|not only|expensive|,|but|it|is|also|risky|.', NEAR.neg]], ex: 'Not only + be + subject + complement, but + subject + be + also. With be as the main verb, be itself inverts (no do-support).' }),
            item('neg:on no account|aux:must|subj:the alarm|aux:be|verb:switched off|.', { d: 'verb:switch', near: ['the alarm|must|on no account|be|switched off|.'], trap: [['on no account|the alarm|must|be|switched off|.', 'Invert the modal must before the subject the alarm.']], ex: 'On no account + modal + subject + passive (be + past participle).' }),
            item('neg:not since|adv:the war|aux:had|subj:the country|verb:faced|obj:such hardship|.', { d: 'verb:face', trap: [['not since|the war|had|the country|face|such hardship|.', 'After had, use the past participle faced, not face.']], ex: 'Not since + time + had + subject + past participle.' }),
            item('neg:under no circumstances|aux:are|subj:visitors|verb:permitted|adv:beyond this point|.', { d: 'verb:permit', near: ['visitors|are|under no circumstances|permitted|beyond this point|.'], trap: [['under no circumstances|visitors|are|permitted|beyond this point|.', 'Invert the passive auxiliary are before the subject visitors.']], ex: 'Under no circumstances + be + subject + past participle (formal prohibition).' }),
            item('neg:at no point|aux:did|subj:the minister|verb:admit|obj:responsibility|.', { d: 'verb:admitted', trap: [['at no point|did|the minister|admitted|responsibility|.', 'Use the base verb admit after did, never admitted.'], ['at no point|the minister|did|admit|responsibility|.', 'Fronted At no point requires did before the subject.']], ex: 'At no point + did + subject + base verb.' }),
            item('neg:not only|aux:did|subj:she|verb:write|obj:the script|,|conj:but|subj:she|adv:also|verb:directed|obj:it|.', { d: 'verb:wrote', trap: [['not only|did|she|wrote|the script|,|but|she|also|directed|it|.', 'In the inverted first clause, did takes the base form write; the second clause stays in normal past simple (directed).']], ex: 'Not only + did + subject + base verb, but + subject + also + past simple.' }),
            item('neg:on no account|aux:should|subj:children|aux:be|verb:left|comp:unattended|.', { d: 'verb:leave', near: ['children|should|on no account|be|left|unattended|.'], trap: [['on no account|children|should|be|left|unattended|.', 'Invert should before the subject children after On no account.']], ex: 'On no account + should + subject + passive infinitive (be left).' }),
            item('neg:under no circumstances|aux:must|subj:you|verb:reveal|obj:the password|.', { d: 'verb:revealed', near: ['you|must|under no circumstances|reveal|the password|.'], trap: [['under no circumstances|you|must|reveal|the password|.', 'Invert must before the subject you after Under no circumstances.']], ex: 'Under no circumstances + must + subject + base verb.' })
        ] },

        /* ===== ACT IV: CONDITIONAL & SO/SUCH INVERSION (16-20) ===== */
        { title: 'Conditional Inversion: Had', cefr: 'C1',
          formula: 'Had + Subject (+ not) + Past Participle, Subject + would / might + have + Past Participle',
          examTip: 'Cambridge C1 Part 4 & Formal Essays: Drops "if" and fronts "Had". In negative clauses, never contract "hadn\'t"—keep "not" after the subject ("Had it not been for...").',
          pool: [
            item('aux:had|subj:he|verb:known|obj:the truth|,|subj:he|aux:would|aux:have|verb:fled|.', { d: 'conj:if', alt: ['he|would|have|fled|,|had|he|known|the truth|.'], ex: 'Had he known = If he had known. Drop if and invert had (third conditional).' }),
            item('aux:had|subj:we|verb:left|adv:earlier|,|subj:we|aux:would|aux:have|verb:caught|obj:the train|.', { d: 'verb:leave', alt: ['we|would|have|caught|the train|,|had|we|left|earlier|.'], trap: [['had|we|leave|earlier|,|we|would|have|caught|the train|.', 'After Had + subject, use the past participle left, not base leave.']], ex: 'Had + subject + past participle replaces if + past perfect.' }),
            item('aux:had|subj:it|neg:not|verb:been|adv:for your help|,|subj:I|aux:would|aux:have|verb:failed|.', { d: 'verb:be', alt: ['I|would|have|failed|,|had|it|not|been|for your help|.'], trap: [['had|not|it|been|for your help|,|I|would|have|failed|.', 'In formal conditional inversion, not stays after the subject: Had it not been...']], ex: "Had it not been for = If it hadn't been for. In inversion, not follows the subject." }),
            item('aux:had|subj:she|verb:followed|obj:my advice|,|subj:she|aux:would|neg:not|aux:have|verb:lost|.', { d: 'conj:if', alt: ['she|would|not|have|lost|,|had|she|followed|my advice|.'], trap: [['had|not|she|followed|my advice|,|she|would|have|lost|.', 'Never invert not before the subject; in formal inversion, not stays after the subject.']], ex: 'Had + subject + past participle replaces If + subject + had + past participle in third conditionals.' }),
            item('aux:had|subj:they|neg:not|verb:intervened|,|subj:the dispute|aux:might|aux:have|verb:escalated|.', { d: 'verb:intervene', alt: ['the dispute|might|have|escalated|,|had|they|not|intervened|.'], trap: [['had|they|not|intervene|,|the dispute|might|have|escalated|.', 'After had, use the past participle intervened, not base intervene.']], ex: 'In negative inverted conditionals, not always follows the subject: Had they not intervened...' }),
            item('aux:had|subj:you|verb:checked|obj:the timetable|,|subj:we|aux:would|verb:be|adv:there|adv:by now|.', { d: 'verb:check', alt: ['we|would|be|there|by now|,|had|you|checked|the timetable|.'], trap: [['had|you|check|the timetable|,|we|would|be|there|by now|.', 'After had, use the past participle checked, not check.']], ex: 'Mixed conditional with inversion: Had + subject + past participle (past condition), subject + would + base verb (present result).' }),
            item('aux:had|subj:I|verb:seen|obj:the sign|,|subj:I|aux:would|aux:have|verb:stopped|.', { d: 'verb:saw', alt: ['I|would|have|stopped|,|had|I|seen|the sign|.'], trap: [['had|I|saw|the sign|,|I|would|have|stopped|.', 'After Had + subject, use the past participle seen, never saw.']], ex: 'Had + subject + past participle (seen) replaces If + past perfect.' }),
            item('aux:had|subj:the alarm|neg:not|verb:sounded|,|subj:nobody|aux:would|aux:have|verb:escaped|.', { d: 'verb:sound', alt: ['nobody|would|have|escaped|,|had|the alarm|not|sounded|.'], trap: [['had|the alarm|not|sound|,|nobody|would|have|escaped|.', 'After Had + subject + not, use the past participle sounded, not sound.']], ex: 'Had + subject + not + past participle (sounded) = If the alarm had not sounded.' })
        ] },
        { title: 'Conditional Inversion: Should', cefr: 'C1',
          formula: 'Should + Subject + Bare Infinitive, Imperative / Future Main Clause',
          examTip: 'Cambridge C1 Formal Letters & Proposals: "Should you require further details, please contact..." is the gold standard for polite, formal conditional closing lines.',
          pool: [
            item('aux:should|subj:you|verb:need|obj:assistance|,|adv:please|verb:call|obj:reception|.', { d: 'conj:if', alt: ['please|call|reception|,|should|you|need|assistance|.'], near: [['if|you|need|assistance|,|please|call|reception|.', 'Grammatical, but this floor needs inversion: replace if with should at the front.']], ex: 'Should you need = If you need. A formal, slightly tentative first conditional.' }),
            item('aux:should|subj:the weather|verb:improve|,|subj:we|aux:will|verb:eat|adv:outside|.', { d: 'verb:improves', alt: ['we|will|eat|outside|,|should|the weather|improve|.'], trap: [['should|the weather|improves|,|we|will|eat|outside|.', 'After modal should, use the bare infinitive improve, never improves.']], ex: 'Should + subject + BASE verb (improve, not improves).' }),
            item('aux:should|subj:anyone|verb:ask|,|verb:say|obj:nothing|.', { d: 'verb:asks', alt: ['say|nothing|,|should|anyone|ask|.'], trap: [['should|anyone|asks|,|say|nothing|.', 'Should takes the bare infinitive ask, not asks.']], ex: 'Should anyone ask = If anyone asks; the main clause can be an imperative.' }),
            item('aux:should|subj:you|verb:require|obj:further details|,|adv:please|verb:contact|obj:our office|.', { d: 'conj:if', alt: ['please|contact|our office|,|should|you|require|further details|.'], near: [['if|you|require|further details|,|please|contact|our office|.', NEAR.cond]], ex: 'Should you require = If you should require (classic C1 formal correspondence formula).' }),
            item('aux:should|subj:the alarm|verb:sound|,|verb:leave|obj:the building|adv:immediately|.', { d: 'verb:sounds', alt: ['leave|the building|immediately|,|should|the alarm|sound|.'], trap: [['should|the alarm|sounds|,|leave|the building|immediately|.', 'Should is a modal auxiliary, so the verb must be bare infinitive: sound, never sounds.']], ex: 'Should + singular subject + bare infinitive (sound, not sounds) + imperative main clause.' }),
            item('aux:should|subj:there|verb:be|obj:any delay|,|subj:passengers|aux:will|aux:be|verb:notified|.', { d: 'verb:is', alt: ['passengers|will|be|notified|,|should|there|be|any delay|.'], trap: [['should|there|is|any delay|,|passengers|will|be|notified|.', 'After modal should, always use the bare infinitive be, never is.']], ex: 'Should there be = If there is (formal existential conditional).' }),
            item('aux:should|subj:he|verb:call|adv:again|,|verb:take|obj:a message|.', { d: 'verb:calls', alt: ['take|a message|,|should|he|call|again|.'], trap: [['should|he|calls|again|,|take|a message|.', 'After modal should, use the bare infinitive call, never calls.']], ex: 'Should + singular subject + bare infinitive (call) + imperative main clause.' }),
            item('aux:should|subj:the parcel|verb:arrive|adv:early|,|adv:please|verb:sign|prep:for|obj:it|.', { d: 'verb:arrives', alt: ['please|sign|for|it|,|should|the parcel|arrive|early|.'], trap: [['should|the parcel|arrives|early|,|please|sign|for|it|.', 'After should, use the bare infinitive arrive, never arrives.']], ex: 'Should + subject + bare infinitive (arrive) in formal first conditionals.' })
        ] },
        { title: 'Conditional Inversion: Were', cefr: 'C1',
          formula: 'Were + Subject (+ not) + Complement / to-Infinitive, Subject + would / could + Base Verb',
          examTip: 'Cambridge C1/C2 Part 4: "If the government raised taxes" -> "WERE THE GOVERNMENT TO RAISE taxes" and "But for the rain" -> "WERE IT NOT FOR the rain". Always "Were", never "Was".',
          pool: [
            item('aux:were|subj:I|comp:you|,|subj:I|aux:would|verb:apologise|.', { d: 'aux:was', alt: ['I|would|apologise|,|were|I|you|.'], trap: [['was|I|you|,|I|would|apologise|.', WERE]], ex: 'Were I you = If I were you (second conditional, formal).' }),
            item('aux:were|subj:it|neg:not|adv:for the rain|,|subj:we|aux:would|verb:go|verb:hiking|.', { d: 'aux:was', alt: ['we|would|go|hiking|,|were|it|not|for the rain|.'], trap: [['was|it|not|for the rain|,|we|would|go|hiking|.', WERE]], ex: "Were it not for = If it weren't for." }),
            item('aux:were|subj:the government|verb:to raise|obj:taxes|,|subj:there|aux:would|verb:be|comp:protests|.', { d: 'verb:raised', alt: ['there|would|be|protests|,|were|the government|to raise|taxes|.'], trap: [['were|the government|raised|taxes|,|there|would|be|protests|.', 'In second conditional inversion with an action verb, use Were + subject + to-infinitive (to raise).']], ex: 'Were + subject + to-infinitive: a formal, hypothetical future.' }),
            item('aux:were|subj:we|verb:to accept|obj:their terms|,|subj:we|aux:would|verb:lose|obj:our independence|.', { d: 'verb:accept', alt: ['we|would|lose|our independence|,|were|we|to accept|their terms|.'], trap: [['were|we|accept|their terms|,|we|would|lose|our independence|.', 'With action verbs in second conditional inversion, use Were + subject + to-infinitive (to accept).']], ex: 'Were + subject + to-infinitive replaces If + subject + past simple for tentative hypotheses.' }),
            item('aux:were|subj:it|neg:not|prep:for|obj:her scholarship|,|subj:she|aux:could not|verb:study|adv:here|.', { d: 'aux:was', alt: ['she|could not|study|here|,|were|it|not|for|her scholarship|.'], trap: [['was|it|not|for|her scholarship|,|she|could not|study|here|.', WERE]], ex: 'Were it not for + noun phrase = If it were not for (but for).' }),
            item('aux:were|subj:he|neg:not|comp:so stubborn|,|subj:he|aux:would|verb:ask|prep:for|obj:help|.', { d: 'aux:was', alt: ['he|would|ask|for|help|,|were|he|not|so stubborn|.'], trap: [['was|he|not|so stubborn|,|he|would|ask|for|help|.', WERE]], ex: 'With be as a main verb, invert were directly: Were + subject + (not) + adjective.' }),
            item('aux:were|subj:she|verb:to discover|obj:the secret|,|subj:she|aux:would|verb:be|comp:furious|.', { d: 'verb:discovered', alt: ['she|would|be|furious|,|were|she|to discover|the secret|.'], trap: [['were|she|discovered|the secret|,|she|would|be|furious|.', 'In second conditional inversion with an action verb, use Were + subject + to-infinitive (to discover).']], ex: 'Were + subject + to-infinitive (to discover) for formal hypothetical events.' }),
            item('aux:were|subj:they|verb:to cancel|obj:the project|,|subj:millions|aux:would|aux:be|verb:wasted|.', { d: 'verb:cancelled', alt: ['millions|would|be|wasted|,|were|they|to cancel|the project|.'], trap: [['were|they|cancelled|the project|,|millions|would|be|wasted|.', 'Use Were + subject + to-infinitive (to cancel), not past simple cancelled.']], ex: 'Were + subject + to-infinitive + passive result clause (would be wasted).' })
        ] },
        { title: 'So & Such Inversion', cefr: 'C2',
          formula: 'So + Adj / Adv + Auxiliary / Be + Subject + that-Clause | Such + Be + Noun Phrase + that-Clause',
          examTip: 'Cambridge C2 Proficiency & C1 Part 4: "The demand was so great that..." -> "SO GREAT WAS THE DEMAND that..." or "SUCH WAS THE DEMAND that...". Ensure "was/were" agrees with the subject after it!',
          pool: [
            item('adv:so|comp:great|verb:was|subj:the demand|conj:that|subj:tickets|verb:sold out|adv:in minutes|.', { d: 'verb:were', alt: ['so|great|was|the demand|that|in minutes|tickets|sold out|.'], near: ['the demand|was|so|great|that|tickets|sold out|in minutes|.', 'the demand|was|so|great|that|in minutes|tickets|sold out|.'], trap: [['so|great|were|the demand|that|tickets|sold out|in minutes|.', 'The demand is singular, so use was, not were.']], ex: 'So + adjective + be + subject + that-clause. Be agrees with the subject: was the demand.' }),
            item('comp:such|verb:was|subj:her anger|conj:that|subj:she|aux:could not|verb:speak|.', { d: 'verb:were', near: ['her anger|was|such|that|she|could not|speak|.'], trap: [['such|were|her anger|that|she|could not|speak|.', 'Her anger is uncountable/singular, so use Such was her anger.']], ex: 'Such + be + noun phrase + that: Such was her anger that...' }),
            item('adv:so|adv:quietly|aux:did|subj:she|verb:speak|conj:that|subj:nobody|verb:heard|obj:her|.', { d: 'verb:spoke', trap: [['so|quietly|did|she|spoke|that|nobody|heard|her|.', 'After did, use the base verb speak, not spoke.']], ex: 'So + adverb + did + subject + base verb + that-clause.' }),
            item('adv:so|comp:rapid|verb:was|subj:the change|conj:that|subj:few people|aux:could|verb:adapt|.', { d: 'verb:were', near: [['the change|was|so|rapid|that|few people|could|adapt|.', NEAR.so]], trap: [['so|rapid|were|the change|that|few people|could|adapt|.', 'The subject the change is singular, so the inverted verb must be was, not were.']], ex: 'So + adjective + be + subject + that-clause. Match the verb to the subject that follows it.' }),
            item('comp:such|verb:were|subj:the difficulties|conj:that|subj:the team|verb:turned back|.', { d: 'verb:was', near: [['the difficulties|were|such|that|the team|turned back|.', NEAR.so]], trap: [['such|was|the difficulties|that|the team|turned back|.', 'The subject the difficulties is plural, so use Such were the difficulties, not Such was.']], ex: 'Such + plural be (were) + plural subject + that-clause.' }),
            item('adv:so|adv:convincingly|aux:did|subj:he|verb:argue|conj:that|subj:the jury|verb:acquitted|obj:him|.', { d: 'verb:argued', trap: [['so|convincingly|did|he|argued|that|the jury|acquitted|him|.', 'After did, use the base verb argue, not argued.']], ex: 'So + adverb + did/do/does + subject + base verb + that-clause.' }),
            item('adv:so|comp:steep|verb:was|subj:the climb|conj:that|subj:we|verb:had to|verb:turn back|.', { d: 'verb:were', near: [['the climb|was|so|steep|that|we|had to|turn back|.', NEAR.so]], trap: [['so|steep|were|the climb|that|we|had to|turn back|.', 'The climb is singular, so use was, not were.']], ex: 'So + adjective + was + singular subject + that-clause.' }),
            item('comp:such|verb:was|subj:the noise|conj:that|subj:nobody|verb:heard|obj:the bell|.', { d: 'verb:were', near: [['the noise|was|such|that|nobody|heard|the bell|.', NEAR.so]], trap: [['such|were|the noise|that|nobody|heard|the bell|.', 'The noise is uncountable/singular, so use Such was the noise.']], ex: 'Such + was + singular noun phrase + that-clause.' })
        ] },
        { title: 'The Inversion Gauntlet', cefr: 'C2', boss: true,
          formula: 'Limiting / Conditional / Degree Trigger + Auxiliary + Subject + Main Verb + Result Clause',
          examTip: 'Cambridge C1/C2 Exam Mastery: Combines negative adverbials, third-conditional inversions, and degree inversions. Follow Gareth\'s 4-Step Deconstruction: check tense harmony and voice first.',
          pool: [
            item('aux:had|subj:I|verb:realised|obj:the risk|,|subj:I|aux:would|adv:never|aux:have|verb:agreed|.', { d: 'verb:realise', alt: ['I|would|never|have|agreed|,|had|I|realised|the risk|.'], trap: [['had|I|realise|the risk|,|I|would|never|have|agreed|.', 'After Had + subject, use the past participle realised, not realise.']], ex: 'Had I realised = If I had realised.' }),
            item('adv:so|comp:severe|verb:were|subj:the floods|conj:that|subj:the roads|verb:closed|.', { d: 'verb:was', near: [['the floods|were|so|severe|that|the roads|closed|.', NEAR.so]], trap: [['so|severe|was|the floods|that|the roads|closed|.', 'The floods is plural, so use were, not was.']], ex: 'So + adjective + were + plural subject + that-clause.' }),
            item('aux:were|subj:she|verb:to resign|,|subj:the company|aux:would|verb:collapse|.', { d: 'aux:was', alt: ['the company|would|collapse|,|were|she|to resign|.'], trap: [['was|she|to resign|,|the company|would|collapse|.', WERE]], ex: 'Were she to resign = If she resigned (formal hypothesis).' }),
            item('neg:little|aux:did|subj:they|verb:suspect|conj:that|subj:the butler|verb:was lying|.', { d: 'verb:suspected', trap: [['little|did|they|suspected|that|the butler|was lying|.', 'After did, use the base verb suspect, not suspected.']], ex: 'Little + did + subject + base verb, then a normal that-clause.' }),
            item('neg:not until|subj:the audit|verb:ended|aux:did|subj:the truth|verb:come|adv:to light|.', { d: 'verb:came', trap: [['not until|the audit|ended|did|the truth|came|to light|.', 'Did already carries the past tense, so use the base verb come, not came.']], ex: 'Not until + time clause + did + subject + base verb (come to light).' }),
            item('neg:scarcely|aux:had|subj:the debate|verb:started|conj:when|subj:the microphone|verb:cut out|.', { d: 'conj:than', near: [['the debate|had|scarcely|started|when|the microphone|cut out|.', NEAR.neg]], trap: [['scarcely|had|the debate|started|than|the microphone|cut out|.', 'Scarcely pairs with when, never than.']], ex: 'Scarcely + had + subject + past participle + when + past simple.' }),
            item('aux:had|subj:it|neg:not|verb:been|prep:for|obj:the lighthouse|,|subj:the ship|aux:would|aux:have|verb:sunk|.', { d: 'verb:sank', alt: ['the ship|would|have|sunk|,|had|it|not|been|for|the lighthouse|.'], trap: [['had|it|not|been|for|the lighthouse|,|the ship|would|have|sank|.', 'After would have, use the past participle sunk, not sank.']], ex: 'Had it not been for + noun phrase, subject + would have + past participle.' }),
            item('adv:so|adv:rapidly|aux:did|subj:the fire|verb:spread|conj:that|subj:everyone|verb:fled|.', { d: 'verb:spreads', trap: [['so|rapidly|did|the fire|spreads|that|everyone|fled|.', 'After did, use the base verb spread, never spreads.']], ex: 'So + adverb + did + subject + base verb + that-clause.' }),
            item('aux:should|subj:the talks|verb:fail|,|subj:a strike|aux:will|aux:be|comp:inevitable|.', { d: 'verb:fails', alt: ['a strike|will|be|inevitable|,|should|the talks|fail|.'], trap: [['should|the talks|fails|,|a strike|will|be|inevitable|.', 'After modal should, use the bare infinitive fail, never fails.']], ex: 'Should + subject + bare infinitive (fail) + future result clause.' })
        ] },

        /* ===== ACT V: CLEFTS & FRONTING (21-25) ===== */
        { title: 'It-Clefts', cefr: 'C1',
          formula: 'It + is / was (+ not) + [Focused Element] + that / who + Remainder of Clause',
          examTip: 'IELTS Writing Task 2 & Speaking Part 3: Spotlights the exact cause, person, or time ("It is the long-term cost that worries economists, rather than..."). Use "that", never "what" or "why".',
          pool: [
            item('cleft:it|verb:was|adv:with reluctance|rel:that|subj:they|verb:agreed|.', { d: 'rel:what', alt: ['it|was|they|that|agreed|with reluctance|.'], trap: [['it|was|with reluctance|what|they|agreed|.', 'An it-cleft uses that after the focused phrase, never what.']], ex: 'It + be + FOCUS + that + rest of the clause: the focus gets the emphasis.' }),
            item('cleft:it|verb:was|subj:Sarah|rel:who|verb:found|obj:the error|.', { d: 'rel:which', trap: [['it|was|Sarah|which|found|the error|.', 'When focusing a person in an it-cleft, use who (or that), never which.']], ex: 'Focus on a person: It was Sarah who...' }),
            item('cleft:it|verb:is|subj:the cost|rel:that|verb:worries|obj:me|.', { d: 'rel:what', near: [['it|is|me|that|the cost|worries|.', 'In formal C1 English, focus the subject here: It is the cost that worries me (or It is I who...).']], trap: [['it|is|the cost|what|worries|me|.', 'Use that in an it-cleft, never what.']], ex: 'It is + focus + that: the cost (not the time) worries me.' }),
            item("cleft:it|verb:wasn't|adv:until midnight|rel:that|subj:the guests|verb:left|.", { d: 'verb:leave', trap: [["it|wasn't|until midnight|that|the guests|leave|.", 'With past tense wasn\'t, the verb in the that-clause must be past simple: left.']], ex: "It wasn't until + time + that: stresses how late something happened." }),
            item('cleft:it|verb:was|adv:in Belfast|rel:that|subj:they|adv:first|verb:met|.', { d: 'rel:where', trap: [['it|was|in Belfast|where|they|first|met|.', 'In an it-cleft focusing a prepositional phrase (in Belfast), formal Cambridge English requires that, not where.']], ex: 'It + be + prepositional phrase + that + clause puts sharp emphasis on the place or time.' }),
            item('cleft:it|verb:is|neg:not|subj:the price|rel:that|verb:matters|,|conj:but|obj:the quality|.', { d: 'rel:what', trap: [['it|is|not|the price|what|matters|,|but|the quality|.', 'An it-cleft uses that or who after the focused noun, never what.']], ex: 'Contrastive it-cleft: It is not X that + verb, but Y.' }),
            item('cleft:it|verb:was|adv:because of the storm|rel:that|subj:the ferry|aux:was|verb:delayed|.', { d: 'conj:why', trap: [['it|was|because of the storm|why|the ferry|was|delayed|.', 'After It was because of..., link the clause with that, never why.']], ex: 'It + be + because of + noun phrase + that + clause highlights the cause.' }),
            item('cleft:it|verb:was|subj:the butler|rel:who|verb:left|obj:the gate|comp:unlocked|.', { d: 'rel:which', trap: [['it|was|the butler|which|left|the gate|unlocked|.', 'When focusing a person (the butler), use who (or that), never which.']], ex: 'It + was + focused person + who + rest of the clause.' }),
            item('cleft:it|verb:is|subj:trust|rel:that|verb:holds|obj:a team|adv:together|.', { d: 'rel:what', trap: [['it|is|trust|what|holds|a team|together|.', 'In an it-cleft, follow the focused noun with that, never what.']], ex: 'It + is + focused abstract noun + that + verb phrase.' })
        ] },
        { title: 'Wh-Clefts', cefr: 'C1',
          formula: 'What + Subject + Verb (or What + Verb + Object) + is / was + [Focused Element]',
          examTip: 'IELTS Speaking & Writing Task 2: "What makes this policy effective is..." or "What governments should do is invest..." creates immediate C1 rhetorical focus.',
          pool: [
            item('wh:what|subj:I|verb:need|verb:is|comp:a holiday|.', { d: 'verb:are', alt: ['a holiday|is|what|I|need|.'], trap: [['what|I|need|are|a holiday|.', 'A wh-cleft with a singular focus (a holiday) takes is, not are.']], ex: 'What + clause + is + focus. The reversed form (A holiday is what I need) is also correct.' }),
            item('wh:what|verb:surprised|obj:me|verb:was|comp:his honesty|.', { d: 'verb:were', alt: ['his honesty|was|what|surprised|me|.'], trap: [['what|surprised|me|were|his honesty|.', 'What surprised me is singular, so use was, not were.']], ex: 'What surprised me was + focus.' }),
            item('wh:what|subj:she|verb:did|verb:was|comp:resign|.', { d: 'verb:resigns', trap: [['what|she|did|was|resigns|.', 'After What + subject + did + was, use the bare infinitive resign, not resigns.']], ex: 'What + subject + did + was + bare infinitive: focus on an action.' }),
            item('wh:what|subj:we|aux:should|verb:do|verb:is|comp:wait|.', { d: 'verb:waits', trap: [['what|we|should|do|is|waits|.', 'After What we should do is, use the bare infinitive wait, not waits.']], ex: 'What we should do is + bare infinitive.' }),
            item('wh:what|verb:makes|obj:this essay|comp:effective|verb:is|comp:its clear structure|.', { d: 'verb:are', alt: ['its clear structure|is|what|makes|this essay|effective|.'], trap: [['what|makes|this essay|effective|are|its clear structure|.', 'A wh-cleft clause (What makes...) is singular, so use is, not are.']], ex: 'What + verb + object + complement + is + focused noun phrase.' }),
            item('wh:what|subj:the committee|verb:decided|part:to|verb:do|verb:was|comp:postpone|obj:the vote|.', { d: 'verb:postponed', trap: [['what|the committee|decided|to|do|was|postponed|the vote|.', 'After What they decided to do was, use the bare infinitive postpone, not postponed.']], ex: 'What + subject + decided to do + was + bare infinitive phrase.' }),
            item('wh:what|verb:troubles|obj:me|adv:most|verb:is|conj:that|subj:nobody|verb:complained|.', { d: 'rel:which', trap: [['which|troubles|me|most|is|that|nobody|complained|.', 'A pseudo-cleft opens with What (= the thing that), never Which.']], ex: 'What + clause + is + that-clause packages an entire statement as the focus.' }),
            item('wh:what|verb:convinced|obj:the panel|verb:was|comp:her calm delivery|.', { d: 'verb:were', alt: ['her calm delivery|was|what|convinced|the panel|.'], trap: [['what|convinced|the panel|were|her calm delivery|.', 'What convinced the panel is singular, so use was, not were.']], ex: 'What + verb + object + was + singular noun phrase.' }),
            item('wh:what|subj:they|verb:failed|part:to|verb:consider|verb:was|comp:the human cost|.', { d: 'verb:were', alt: ['the human cost|was|what|they|failed|to|consider|.'], trap: [['what|they|failed|to|consider|were|the human cost|.', 'The wh-cleft clause takes a singular verb: was, not were.']], ex: 'What + subject + failed to consider + was + focused noun phrase.' })
        ] },
        { title: 'All-Clefts & The Reason', cefr: 'C2',
          formula: 'All / The thing that / The reason + Clause + is / was + Focus / that-Clause',
          examTip: 'Cambridge C1 Part 4 & Formal Writing: Always write "The reason... is THAT" (never "is because") in academic writing, and treat "All + clause" as singular ("was", not "were").',
          pool: [
            item('cleft:all|subj:I|verb:want|verb:is|comp:a quiet life|.', { d: 'verb:are', alt: ['a quiet life|is|all|I|want|.'], trap: [['all|I|want|are|a quiet life|.', 'All (= the only thing) is singular, so use is, not are.']], ex: 'All (= the only thing) + clause + is + focus.' }),
            item('cleft:all|subj:you|verb:have to do|verb:is|comp:sign|adv:here|.', { d: 'verb:signing', trap: [['all|you|have to do|is|signing|here|.', 'After All you have to do is, use the bare infinitive sign, not signing.']], ex: 'All you have to do is + bare infinitive.' }),
            item('cleft:the reason|subj:I|verb:called|verb:is|conj:that|subj:I|verb:need|obj:your help|.', { d: 'conj:because', trap: [['the reason|I|called|is|because|I|need|your help|.', "Common in speech, but formal English uses 'The reason... is that', not 'is because'."]], ex: 'The reason + clause + is that + clause.' }),
            item('cleft:the thing|rel:that|verb:annoys|obj:me|verb:is|comp:his arrogance|.', { d: 'rel:what', alt: ['his arrogance|is|the thing|that|annoys|me|.'], trap: [['the thing|what|annoys|me|is|his arrogance|.', 'After The thing, use the relative pronoun that, never what.']], ex: 'The thing that + clause + is + focus.' }),
            item('cleft:all|subj:she|verb:asked|prep:for|verb:was|comp:a fair hearing|.', { d: 'verb:were', alt: ['a fair hearing|was|all|she|asked|for|.'], trap: [['all|she|asked|for|were|a fair hearing|.', 'All (= the only thing) takes a singular verb: was, not were.']], ex: 'All (= the only thing) + subject + verb + was + singular focus.' }),
            item('cleft:the place|rel:where|subj:they|verb:hid|obj:the gold|verb:remains|comp:a mystery|.', { d: 'rel:that', trap: [['the place|that|they|hid|the gold|remains|a mystery|.', 'Without a preposition (in/at), The place requires the relative adverb where, not that.']], ex: 'Nominal relative cleft with The place where + clause + singular verb.' }),
            item('cleft:the person|rel:who|verb:impressed|obj:the panel|adv:most|verb:was|comp:the youngest candidate|.', { d: 'rel:which', alt: ['the youngest candidate|was|the person|who|impressed|the panel|most|.'], trap: [['the person|which|impressed|the panel|most|was|the youngest candidate|.', 'Use who (or that) for a person, never which.']], ex: 'The person who + clause + be + focused person.' }),
            item('cleft:all|subj:he|verb:did|verb:was|comp:ask|obj:a simple question|.', { d: 'verb:asked', trap: [['all|he|did|was|asked|a simple question|.', 'After All he did was, use the bare infinitive ask, not asked.']], ex: 'All + subject + did + was + bare infinitive phrase.' }),
            item('cleft:the reason|subj:she|verb:resigned|verb:was|conj:that|subj:she|verb:felt|comp:ignored|.', { d: 'conj:because', trap: [['the reason|she|resigned|was|because|she|felt|ignored|.', "In formal C1/C2 writing, pair The reason... was with that, never because."]], ex: 'The reason + clause + was + that-clause.' })
        ] },
        { title: 'Fronting & Locative Inversion', cefr: 'C2',
          formula: 'Having + V3 / Past Participle, Main Clause | Place Adverbial + Verb + Noun Subject | Adj + as + Subj + Verb',
          examTip: 'Cambridge C1/C2 Writing & Reading Part 4: Fronted participle clauses ("Having finished...", "Exhausted by...") and concessive fronting ("Much as I admire...") pack dense meaning into sleek C1/C2 sentences.',
          pool: [
            item('adv:into the room|verb:burst|subj:the inspector|.', { d: 'aux:did', near: ['the inspector|burst|into the room|.'], ex: 'Fronted place/direction + verb + subject: a dramatic, literary inversion (no do-support).' }),
            item('adv:on the hill|verb:stood|subj:an old castle|.', { d: 'verb:standing', near: ['an old castle|stood|on the hill|.'], trap: [['on the hill|standing|an old castle|.', 'Locative inversion needs a finite main verb: stood, not standing.']], ex: 'Locative inversion: place + verb + subject puts the new information at the end.' }),
            item('obj:this|subj:I|aux:cannot|verb:accept|.', { d: 'verb:accepts', near: ['I|cannot|accept|this|.'], trap: [['this|I|cannot|accepts|.', 'After modal cannot, use the base verb accept, not accepts.']], ex: 'Object fronting for emphasis or contrast: no inversion, just move the object.' }),
            item('adv:here|verb:comes|subj:the bus|.', { d: 'verb:come', near: ['the bus|comes|here|.'], trap: [['here|come|the bus|.', 'The bus is singular, so the inverted verb must be comes, not come.']], ex: 'Here/There + verb + NOUN subject inverts (Here comes the bus), but not with pronouns (Here it comes).' }),
            item('comp:strange|conj:as|subj:it|aux:may|verb:seem|,|subj:I|verb:agree|.', { d: 'verb:seems', alt: ['I|agree|,|strange|as|it|may|seem|.'], trap: [['strange|as|it|may|seems|,|I|agree|.', 'After modal may, use the bare infinitive seem, not seems.']], ex: 'Adjective + as + subject + verb = although: Strange as it may seem...' }),
            item('verb:having|verb:finished|obj:the report|,|subj:she|verb:closed|obj:her laptop|.', { d: 'verb:finish', alt: ['she|closed|her laptop|,|having|finished|the report|.'], trap: [['having|finish|the report|,|she|closed|her laptop|.', 'A perfect participle clause requires Having + past participle (finished), not base finish.']], ex: 'Fronted perfect participle clause (Having + past participle) shows an action completed before the main clause.' }),
            item('verb:exhausted|adv:by the climb|,|subj:the hikers|verb:rested|adv:in the shade|.', { d: 'verb:exhausting', alt: ['the hikers|rested|in the shade|,|exhausted|by the climb|.'], trap: [['exhausting|by the climb|,|the hikers|rested|in the shade|.', 'Use the past participle Exhausted to describe how the hikers felt; exhausting means causing tiredness.']], ex: 'Fronted past participle clause (Exhausted by...) gives the reason for the main clause.' }),
            item('comp:much|conj:as|subj:I|verb:admire|obj:his courage|,|subj:I|verb:doubt|obj:his judgement|.', { d: 'conj:although', alt: ['I|doubt|his judgement|,|much|as|I|admire|his courage|.'], trap: [['much|although|I|admire|his courage|,|I|doubt|his judgement|.', 'Fronted Much pairs with as (Much as I admire...), not although.']], ex: 'Much as + subject + verb = Although I very much... (C2 concessive fronting).' }),
            item('adv:at the back|adv:of the hall|verb:sat|subj:an elderly man|.', { d: 'verb:sitting', near: ['an elderly man|sat|at the back|of the hall|.'], trap: [['at the back|of the hall|sitting|an elderly man|.', 'Locative inversion requires a finite main verb: sat, not sitting.']], ex: 'Locative inversion: fronted place phrase + finite verb (sat) + noun subject.' }),
            item('comp:tired|conj:as|subj:she|verb:was|,|subj:she|verb:kept|verb:working|.', { d: 'conj:although', alt: ['she|kept|working|,|tired|as|she|was|.'], trap: [['tired|although|she|was|,|she|kept|working|.', 'In fronted adjective concessions, use Adjective + as (or though) + subject + verb, never although.']], ex: 'Fronted adjective + as + subject + verb (= Although she was tired).' })
        ] },
        { title: "The Syntax Dragon's Hoard", cefr: 'C2', boss: true,
          formula: 'Master C1/C2 Synthesis: Correlative Inversions + Cleft Clauses + Inverted Conditionals + Passive Reporting',
          examTip: 'C1/C2 Exam Restraint Rule: In real essays, you do not need ten inversions on one page—two or three surgical structural shifts (an It-cleft, a "Not only" inversion, or a participle opener) secure top marks for Grammatical Range.',
          pool: [
            item('neg:not only|aux:did|subj:he|verb:fail|obj:the audit|,|conj:but|subj:he|adv:also|verb:lied|.', { d: 'verb:failed', trap: [['not only|did|he|failed|the audit|,|but|he|also|lied|.', 'After did in the inverted clause, use the base verb fail, not failed.']], ex: 'Not only + inversion, then but + subject + also + verb.' }),
            item('cleft:it|verb:was|adv:only|conj:when|subj:the lights|verb:went out|rel:that|subj:we|verb:panicked|.', { d: 'verb:panic', trap: [['it|was|only|when|the lights|went out|that|we|panic|.', 'With past tense was and went out, the verb in the that-clause must be past simple: panicked.']], ex: 'It-cleft with a focused time clause: It was only when... that...' }),
            item('neg:never before|aux:had|subj:so many|verb:owed|obj:so much|adv:to so few|.', { d: 'verb:owe', near: [['so many|had|never before|owed|so much|to so few|.', NEAR.neg]], trap: [['never before|had|so many|owe|so much|to so few|.', 'After had, use the past participle owed, not owe.']], ex: 'Never before + had + subject + past participle (after Churchill).' }),
            item('comp:such|verb:was|subj:the force|adv:of the blast|conj:that|subj:windows|verb:shattered|.', { d: 'verb:were', near: [['the force|of the blast|was|such|that|windows|shattered|.', NEAR.so]], trap: [['such|were|the force|of the blast|that|windows|shattered|.', 'The subject is the force (singular), so use Such was the force, not were.']], ex: 'Such + be + subject + that-clause.' }),
            item('neg:little|aux:did|subj:we|verb:know|wh:what|verb:lay|adv:ahead|.', { d: 'verb:knew', trap: [['little|did|we|knew|what|lay|ahead|.', 'After did, use the base verb know, not knew.']], ex: 'Little did we know + wh-clause (normal order inside the wh-clause).' }),
            item('neg:no sooner|aux:had|subj:the treaty|aux:been|verb:signed|conj:than|subj:fresh disputes|verb:erupted|.', { d: 'conj:when', near: [['the treaty|had|no sooner|been|signed|than|fresh disputes|erupted|.', NEAR.neg]], trap: [['no sooner|had|the treaty|been|signed|when|fresh disputes|erupted|.', 'No sooner requires than, never when.']], ex: 'No sooner + had + subject + been + past participle (passive) + than + past simple.' }),
            item('aux:had|subj:it|neg:not|verb:been|prep:for|obj:the lighthouse|,|subj:the ship|aux:would|aux:have|verb:sunk|.', { d: 'verb:sank', alt: ['the ship|would|have|sunk|,|had|it|not|been|for|the lighthouse|.'], trap: [['had|it|not|been|for|the lighthouse|,|the ship|would|have|sank|.', 'After would have, use the past participle sunk, not sank.']], ex: 'Had it not been for + noun phrase, subject + would have + past participle.' }),
            item('wh:what|subj:the inquiry|verb:revealed|verb:was|conj:that|subj:vital warnings|aux:had|aux:been|verb:ignored|.', { d: 'verb:were', trap: [['what|the inquiry|revealed|were|that|vital warnings|had|been|ignored|.', 'A wh-cleft followed by a singular that-clause takes was, not were.']], ex: 'Wh-cleft (What + clause + was + that-clause) combined with past perfect passive (had been ignored).' }),
            item('neg:on no account|aux:must|subj:this document|aux:be|verb:shared|prep:with|obj:outsiders|.', { d: 'verb:share', near: [['this document|must|on no account|be|shared|with|outsiders|.', NEAR.neg]], trap: [['on no account|this document|must|be|shared|with|outsiders|.', 'Invert the modal must before the subject this document.']], ex: 'On no account + modal + subject + passive infinitive (be shared).' }),
            item('aux:were|subj:the bank|verb:to collapse|,|subj:thousands|prep:of|obj:jobs|aux:would|aux:be|verb:lost|.', { d: 'verb:collapsed', alt: ['thousands|of|jobs|would|be|lost|,|were|the bank|to collapse|.'], trap: [['were|the bank|collapsed|,|thousands|of|jobs|would|be|lost|.', 'In second conditional inversion with an action verb, use Were + subject + to-infinitive (to collapse).']], ex: 'Were + subject + to-infinitive + passive conditional result clause.' })
        ] }
    ];

    // ids + near-miss defaults per floor topic
    const nearDefault = (f) => f < 10 ? 'Grammatical, but not the structure this floor practises.' : f < 15 ? NEAR.neg : f === 18 ? NEAR.so : f < 20 ? NEAR.cond : f < 23 ? NEAR.cleft : NEAR.front;
    floors.forEach((fl, f) => {
        fl.floor = f + 1;
        fl.pool.forEach((it, k) => {
            it.id = 'f' + (f + 1) + String.fromCharCode(97 + k);
            it.nearMiss.forEach(n => { if (!n.msg) n.msg = nearDefault(f); });
        });
    });

    const bosses = {
        4:  { name: 'The Goblin of Questions', emoji: '👺', taunt: 'Who taught you to ask questions? Nobody did!', color: 0x4d7c0f, audio: 'assets/audio/crypt/boss-act1-goblin.mp3' },
        9:  { name: 'Phantom of the Passive', emoji: '👻', taunt: 'Mistakes were made... but never by me!', color: 0x94a3b8, audio: 'assets/audio/crypt/boss-act2-wraith.mp3' },
        14: { name: 'Vampire of Negation', emoji: '🧛', taunt: 'Never before have I tasted such feeble syntax!', color: 0x991b1b, audio: 'assets/audio/crypt/boss-act3-lich.mp3' },
        19: { name: 'Inquisitor of Inversion', emoji: '🧙‍♂️', taunt: 'Were you to defeat me, I would be astonished!', color: 0x1e40af, audio: 'assets/audio/crypt/boss-act4-golem.mp3' },
        24: { name: 'The Syntax Dragon (C2)', emoji: '🐉', taunt: 'It is perfection that I demand.', color: 0x047857, audio: 'assets/audio/crypt/boss-act5-archdemon.mp3' }
    };
    const milestones = {
        4:  { name: 'Goblet of Huel Stamina', emoji: '🍷', desc: 'Dark sustenance for endless midnight tutoring sessions.' },
        9:  { name: 'Trezor Vault of Souls', emoji: '🗄️', desc: 'A cryptographically secure phylactery for your assets.' },
        14: { name: 'Obsidian Phantom Carriage', emoji: '🦇', desc: 'A sleek E220d ghost coupe to traverse the foggy moors.' },
        19: { name: 'Pencil the Shadow Familiar', emoji: '🐈‍⬛', desc: 'A void-feline that purrs at the sight of C2-level syntax.' },
        24: { name: 'The Crown of Fluency', emoji: '👑', desc: 'You have mastered the Crypt. C2 Proficiency is yours.' }
    };
    const loot = [
        { name: 'Dusty Syntax Cobweb',       rarity: 'Common',    color: '#475569', chance: 50 },
        { name: 'Vial of Red Ink',           rarity: 'Uncommon',  color: '#b91c1c', chance: 25 },
        { name: 'C1 Advanced Grimoire',      rarity: 'Rare',      color: '#1d4ed8', chance: 15 },
        { name: 'Tome of Mottola',           rarity: 'Epic',      color: '#7e22ce', chance: 8 },
        { name: 'Golden Chalk of Inversion', rarity: 'Legendary', color: '#fbbf24', chance: 2 }
    ];

    /* ---------------- HELPERS ---------------- */
    /** Tokens -> display sentence: capitalise the first word, attach punctuation. */
    function formatSentence(texts) {
        let out = '';
        (texts || []).forEach(t => {
            if (!t) return;
            if (PUNCT.test(t)) out += t;
            else out += (out ? ' ' : '') + t;
        });
        return out.charAt(0).toUpperCase() + out.slice(1);
    }

    function shuffle(list) {
        const a = list.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    const key = (arr) => arr.join('\u0001');

    /** All runes for an item, shuffled so the bank never starts in an accepted order. */
    function shuffledRunes(it) {
        const all = it.tokens.concat(it.decoys);
        const n = it.tokens.length;
        const solvedStart = (o) => it.answers.some(a => key(a) === key(o.slice(0, n).map(r => r.text)));
        let order = shuffle(all);
        for (let i = 0; i < 20 && solvedStart(order); i++) order = shuffle(all);
        return order;
    }

    function pickItem(floorIdx, avoidId) {
        const pool = floors[floorIdx].pool;
        const choices = pool.length > 1 ? pool.filter(p => p.id !== avoidId) : pool;
        return choices[Math.floor(Math.random() * choices.length)];
    }

    /** Closest accepted answer: longest correct prefix, then most positional matches. */
    function closest(it, texts) {
        let best = it.answers[0], bp = -1, bm = -1;
        it.answers.forEach(a => {
            let p = 0; while (p < a.length && texts[p] === a[p]) p++;
            const m = a.reduce((n, t, i) => n + (texts[i] === t ? 1 : 0), 0);
            if (p > bp || (p === bp && m > bm)) { best = a; bp = p; bm = m; }
        });
        return { answer: best, prefix: bp };
    }

    /**
     * texts: one entry per slot (rune text, or null when empty).
     * returns {result: 'incomplete'|'correct'|'near'|'trap'|'wrong', msg, firstWrong, expected, expectedPos, isDecoy, answer}
     */
    function check(it, texts) {
        if (!texts || texts.length !== it.tokens.length) return { result: 'incomplete', firstWrong: -1 };
        if (texts.some(t => !t)) {
            const c = closest(it, texts);
            return { result: 'incomplete', firstWrong: c.prefix, expected: c.answer[c.prefix], expectedPos: it.posOf[c.answer[c.prefix]], answer: c.answer };
        }
        const k = key(texts);
        if (it.answers.some(a => key(a) === k)) return { result: 'correct', firstWrong: -1, answer: texts.slice() };
        const near = it.nearMiss.find(n => key(n.order) === k);
        if (near) return { result: 'near', msg: near.msg, firstWrong: -1 };
        const c = closest(it, texts);
        const fw = c.prefix;
        const res = {
            result: 'wrong', firstWrong: fw, expected: c.answer[fw], expectedPos: it.posOf[c.answer[fw]],
            isDecoy: it.decoys.some(d => d.text === texts[fw]) && !it.tokens.some(t => t.text === texts[fw]),
            answer: c.answer
        };
        const trap = it.traps.find(n => key(n.order) === k);
        if (trap) { res.result = 'trap'; res.msg = trap.msg; }
        return res;
    }

    /* ---------------- PERSISTENCE (one versioned key shared by 2D + 3D) ---------------- */
    const STORE_KEY = 'grammarCrypt.v2';
    const LAST = floors.length - 1;
    const int = (v) => Math.max(parseInt(v, 10) || 0, 0);
    function fresh(keep) {
        return {
            v: 2, level: 0, gold: 0, xp: 0, streak: 0, perfect: 0, completed: [], inventory: [], relics: [],
            playerName: (keep && typeof keep.playerName === 'string') ? keep.playerName.slice(0, 30) : '',
            playerEmail: (keep && typeof keep.playerEmail === 'string') ? keep.playerEmail : '',
            leadSent: !!(keep && keep.leadSent)
        };
    }
    function sanitize(raw) {
        const s = fresh(raw);
        if (!raw || typeof raw !== 'object') return s;
        s.level = Math.min(int(raw.level), LAST);
        s.gold = int(raw.gold); s.xp = int(raw.xp); s.streak = int(raw.streak); s.perfect = int(raw.perfect);
        s.completed = Array.isArray(raw.completed) ? [...new Set(raw.completed.filter(i => Number.isInteger(i) && i >= 0 && i <= LAST))] : [];
        s.inventory = Array.isArray(raw.inventory) ? raw.inventory.filter(n => loot.some(l => l.name === n)) : [];
        const relicNames = Object.values(milestones).map(m => m.name);
        s.relics = Array.isArray(raw.relics) ? [...new Set(raw.relics.map(r => (r && r.name) || r).filter(n => relicNames.includes(n)))] : [];
        return s;
    }
    function save(s) {
        try { root.localStorage.setItem(STORE_KEY, JSON.stringify(sanitize(s))); return true; } catch (_) { return false; }
    }
    function load() {
        let ls = null;
        try { ls = root.localStorage; } catch (_) { return fresh(); }
        if (!ls) return fresh();
        try {
            const v2 = ls.getItem(STORE_KEY);
            if (v2) return sanitize(JSON.parse(v2));
        } catch (_) { /* corrupt: fall through to migration */ }
        // One-off migration: grammarCrypt.v1 (2D) + gc3d_* (old 3D)
        let merged = {};
        try { merged = JSON.parse(ls.getItem('grammarCrypt.v1')) || {}; } catch (_) { merged = {}; }
        try {
            const g = (k) => ls.getItem('gc3d_' + k);
            if (g('level') !== null || g('gold') !== null) {
                merged.level = Math.max(int(merged.level), int(g('level')));
                merged.gold = Math.max(int(merged.gold), int(g('gold')));
                merged.xp = Math.max(int(merged.xp), int(g('xp')));
                merged.streak = Math.max(int(merged.streak), int(g('streak')));
                let rel = [];
                try { rel = JSON.parse(g('relics') || '[]'); } catch (_) { rel = []; }
                merged.relics = (Array.isArray(merged.relics) ? merged.relics : []).concat(Array.isArray(rel) ? rel : []);
                ['level', 'gold', 'xp', 'streak', 'relics'].forEach(k => { try { ls.removeItem('gc3d_' + k); } catch (_) {} });
            }
        } catch (_) { /* storage blocked */ }
        const s = sanitize(merged);
        save(s);
        return s;
    }

    /* ---------------- SYNTAX AUTOPSY HELPER ---------------- */
    function buildDecoyDiagnosis(it) {
        const d = it && it.decoys && it.decoys[0];
        if (!d) return 'No decoy rune on this floor.';
        if (it.traps && it.traps.length > 0 && it.traps[0].msg) {
            return `Decoy "${d.text}" (${POS[d.pos] || d.pos}): ${it.traps[0].msg}`;
        }
        const tokTexts = (it.tokens || []).map(t => t.text);
        if (d.text === 'did' && it.tokens.some(t => t.pos === 'wh')) {
            return `Decoy "did": When the wh-word is the subject of the verb, never insert "did" (use direct subject-verb order).`;
        }
        if (d.text === 'did' && it.tokens.some(t => t.pos === 'adv')) {
            return `Decoy "did": Locative inversion fronts the place phrase and inverts the main verb directly without "do"-support.`;
        }
        if (d.text === 'if') {
            return `Decoy "if": Formal inverted conditionals drop "if" and move the auxiliary (Had / Should / Were) to the front.`;
        }
        if (d.text === 'when' && tokTexts.includes('no sooner')) {
            return `Decoy "when": "No sooner" is a comparative form (-er), so it must pair with "than", never "when".`;
        }
        if (d.text === 'than' && (tokTexts.includes('hardly') || tokTexts.includes('scarcely'))) {
            return `Decoy "than": "Hardly" and "Scarcely" always pair with "when" (or "before"), never "than".`;
        }
        return `Decoy "${d.text}" (${POS[d.pos] || d.pos}): Distractor form that breaks tense harmony, agreement, or clause linking. ${it.explain}`;
    }

    function autopsy(floorIdx, it) {
        const fl = floors[floorIdx] || floors[0];
        const targetItem = it || fl.pool[0];
        const posChain = targetItem.tokens
            .filter(t => t.pos !== 'punct')
            .map(t => `${POS[t.pos] || t.pos} (${t.text})`)
            .join(' + ');
        return {
            floor: (floorIdx || 0) + 1,
            title: fl.title,
            cefr: fl.cefr,
            modelSentence: formatSentence(targetItem.answers[0]),
            altSentences: targetItem.answers.slice(1).map(formatSentence),
            formula: fl.formula || posChain,
            posChain,
            decoyText: targetItem.decoys[0] ? targetItem.decoys[0].text : '',
            decoyDiagnosis: buildDecoyDiagnosis(targetItem),
            nearExample: targetItem.nearMiss[0] ? formatSentence(targetItem.nearMiss[0].order) : '',
            explain: targetItem.explain,
            examTip: fl.examTip || ''
        };
    }

    const totalItems = floors.reduce((sum, fl) => sum + fl.pool.length, 0);

    /* ---------------- DAILY SEEDED 5-QUESTION C1/C2 GAUNTLET ---------------- */
    function getTodaySeed() {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    function hashSeed(str) {
        let h = 2166136261 >>> 0;
        const s = String(str || getTodaySeed());
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
    }

    function mulberry32(a) {
        return function () {
            let t = (a += 0x6D2B79F5) >>> 0;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function dailyGauntlet(seedStr) {
        const seed = (typeof seedStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(seedStr)) ? seedStr : getTodaySeed();
        const rng = mulberry32(hashSeed('CRYPT_DAILY_' + seed));
        const brackets = [
            [9, 10, 11],
            [12, 13, 14],
            [15, 16, 17],
            [18, 19, 20, 21],
            [22, 23, 24]
        ];
        const steps = brackets.map((b, idx) => {
            const floorIdx = b[Math.floor(rng() * b.length)];
            const pool = floors[floorIdx].pool;
            const picked = pool[Math.floor(rng() * pool.length)];
            return {
                step: idx + 1,
                floorIdx,
                item: picked,
                title: floors[floorIdx].title,
                cefr: floors[floorIdx].cefr
            };
        });
        return { seed, steps };
    }

    /* ---------------- DATA SELF-TEST (used by ?selftest=1 pages) ---------------- */
    function multiset(arr) { return arr.slice().sort().join('\u0001'); }
    function dataTests() {
        const lines = [];
        let pass = true, nItems = 0, nAns = 0, nNear = 0, nTrap = 0;
        const fail = (m) => { pass = false; lines.push('FAIL ' + m); };
        if (floors.length !== 25) fail('expected 25 floors, got ' + floors.length);
        floors.forEach((fl, f) => {
            if (fl.pool.length < 6 || fl.pool.length > 10) fail(`floor ${f + 1} pool size ${fl.pool.length}`);
            if (!fl.formula || !fl.examTip) fail(`floor ${f + 1} missing formula or examTip`);
            fl.pool.forEach(it => {
                nItems++;
                const tokSet = multiset(it.tokens.map(t => t.text));
                if (it.tokens.length > 12) fail(`${it.id} has ${it.tokens.length} slots (>12)`);
                it.decoys.forEach(d => { if (it.tokens.some(t => t.text === d.text)) fail(`${it.id} decoy "${d.text}" duplicates a token`); });
                it.answers.forEach((a, ai) => {
                    nAns++;
                    if (multiset(a) !== tokSet) fail(`${it.id} answer ${ai} is not a permutation of the tokens: ${a.join(' ')}`);
                    const r = check(it, a);
                    if (r.result !== 'correct') fail(`${it.id} answer ${ai} -> ${r.result}`);
                });
                const allTexts = it.tokens.concat(it.decoys).map(t => t.text);
                it.nearMiss.forEach((n, ni) => {
                    nNear++;
                    if (n.order.length !== it.tokens.length || n.order.some(t => !allTexts.includes(t))) fail(`${it.id} nearMiss ${ni} uses unknown runes / wrong length`);
                    const r = check(it, n.order);
                    if (r.result !== 'near' || r.msg !== n.msg) fail(`${it.id} nearMiss ${ni} -> ${r.result}`);
                });
                it.traps.forEach((n, ni) => {
                    nTrap++;
                    if (n.order.length !== it.tokens.length || n.order.some(t => !allTexts.includes(t))) fail(`${it.id} trap ${ni} uses unknown runes / wrong length`);
                    const r = check(it, n.order);
                    if (r.result !== 'trap' || r.msg !== n.msg) fail(`${it.id} trap ${ni} -> ${r.result}`);
                });
                // a scrambled board must never pass
                const rev = it.answers[0].slice().reverse();
                if (check(it, rev).result === 'correct' && !it.answers.some(a => key(a) === key(rev))) fail(`${it.id} reversed order accepted`);
                if (!it.explain) fail(`${it.id} has no explanation`);
                if (/\b(realize|realized|analyze|catalog|color|apologize)\b/i.test(it.tokens.map(t => t.text).join(' ') + ' ' + it.explain)) fail(`${it.id} US spelling`);
            });
        });
        if (nItems !== 223) fail(`expected 223 total items, got ${nItems}`);
        lines.unshift(`(a) answers: ${nAns} accepted orderings across ${nItems} items all pass the checker`);
        lines.splice(1, 0, `(b) near-misses: ${nNear} return their tailored message (not success); traps: ${nTrap} return their tip`);
        const it0 = floors[24].pool[0];
        const seen = new Set();
        let solvedStart = 0;
        for (let i = 0; i < 40; i++) {
            const o = shuffledRunes(it0).map(r => r.text);
            seen.add(o.join('|'));
            if (key(o.slice(0, it0.tokens.length)) === key(it0.answers[0])) solvedStart++;
        }
        if (seen.size < 30 || solvedStart) fail(`shuffle variety ${seen.size}/40, solved starts ${solvedStart}`);
        lines.push(`(c) shuffle: ${seen.size}/40 distinct orders, ${solvedStart} pre-solved starts`);
        const dg1 = dailyGauntlet('2026-11-07'), dg2 = dailyGauntlet('2026-11-07'), dg3 = dailyGauntlet('2026-11-08');
        const dgKey = (g) => g.steps.map(s => s.item.id).join(',');
        if (dg1.steps.length !== 5 || dgKey(dg1) !== dgKey(dg2) || dgKey(dg1) === dgKey(dg3) || dg1.steps.some(s => !/^C[12]$/.test(s.cefr))) {
            fail('dailyGauntlet determinism / C1-C2 check failed');
        }
        lines.push(`(d-daily) dailyGauntlet('2026-11-07') deterministic 5-Q C1/C2 gauntlet: [${dgKey(dg1)}]`);
        const ex = [
            ['what', 'did', 'she', 'say', '?'],
            ['had', 'he', 'known', 'the truth', ',', 'he', 'would', 'have', 'fled', '.'],
            ['I', 'would', 'apologise', ',', 'were', 'I', 'you', '.']
        ];
        const want = ['What did she say?', 'Had he known the truth, he would have fled.', 'I would apologise, were I you.'];
        ex.forEach((e, i) => { const got = formatSentence(e); if (got !== want[i]) fail(`formatSentence -> "${got}"`); });
        lines.push('(f) formatSentence: ' + ex.map(e => '"' + formatSentence(e) + '"').join(' | '));
        return { pass, lines };
    }

    root.CRYPT_LEVELS = {
        version: 2, POS, CSS, TIPS, NEAR, floors, bosses, milestones, loot, totalItems,
        explain: (f, id) => { const it = floors[f] && floors[f].pool.find(p => p.id === id); return it ? it.explain : ''; },
        autopsy,
        getTodaySeed, dailyGauntlet,
        formatSentence, shuffle, shuffledRunes, pickItem, check, closest,
        store: { KEY: STORE_KEY, load, save, fresh, sanitize },
        dataTests
    };
})(typeof window !== 'undefined' ? window : globalThis);
