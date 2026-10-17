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

    /* ---------------- 25 FLOORS x 3-5 ITEMS ---------------- */
    const floors = [
        /* ===== ACT I: B1 QUESTIONS (1-5) ===== */
        { title: 'Wh- Questions in the Past', cefr: 'B1', pool: [
            item('wh:what|aux:did|subj:she|verb:say|?', { d: 'verb:said', ex: 'Wh-word + did + subject + BASE verb. Did already carries the past, so say, not said.' }),
            item('wh:where|aux:did|subj:he|verb:hide|obj:the key|?', { d: 'verb:hid', ex: 'Did shows the past, so the main verb stays in the base form: hide, not hid.' }),
            item('wh:why|aux:did|subj:they|verb:leave|adv:so early|?', { d: 'verb:left', ex: 'Why + did + subject + base verb; the adverbial goes at the end.' }),
            item('wh:when|aux:did|subj:you|verb:arrive|adv:in London|?', { d: 'verb:arrived', ex: 'When + did + subject + base verb + place.' })
        ] },
        { title: 'Yes/No Questions', cefr: 'B1', pool: [
            item('aux:did|subj:they|verb:win|obj:the match|?', { d: 'verb:won', ex: 'Yes/no questions open with the auxiliary: did + subject + base verb + object.' }),
            item('aux:does|subj:your sister|verb:work|adv:in a bank|?', { d: 'verb:works', ex: 'Does already shows third person -s, so the verb stays base: work, not works.' }),
            item('aux:do|subj:you|adv:often|verb:eat|part:out|?', { d: 'aux:does', alt: ['do|you|eat|out|often|?'], ex: 'Frequency adverbs sit before the main verb (Do you often eat out?) or at the end (Do you eat out often?).' }),
            item('aux:did|subj:the manager|verb:approve|obj:the budget|?', { d: 'verb:approved', ex: 'Did + subject + base verb + object.' })
        ] },
        { title: 'Questions with Be', cefr: 'B1', pool: [
            item('aux:were|subj:they|verb:arguing|?', { d: 'verb:argued', ex: 'Past continuous questions: was/were + subject + verb-ing.' }),
            item('wh:why|aux:was|subj:he|verb:running|?', { d: 'verb:run', ex: 'Why + was/were + subject + verb-ing: the auxiliary still precedes the subject.' }),
            item('wh:what|aux:were|subj:you|verb:doing|adv:at midnight|?', { d: 'aux:did', ex: 'What + were + subject + doing: be + -ing, not did + -ing.' }),
            item('wh:who|aux:was|subj:she|verb:talking|prep:to|?', { d: 'aux:did', ex: 'In everyday questions the preposition goes to the end: Who was she talking to?' })
        ] },
        { title: 'Present Perfect Questions', cefr: 'B1', pool: [
            item('aux:have|subj:you|adv:ever|verb:been|adv:to Rome|?', { d: 'verb:went', ex: 'Have + subject + ever + past participle. Been to = visited and came back.' }),
            item('wh:how long|aux:have|subj:they|verb:lived|adv:here|?', { d: 'verb:live', ex: 'How long + have + subject + past participle asks about duration up to now.' }),
            item('aux:has|subj:the parcel|verb:arrived|adv:yet|?', { d: 'verb:arrive', ex: 'Yet goes at the end of present perfect questions.' }),
            item('wh:what|aux:has|subj:she|verb:done|adv:with my keys|?', { d: 'verb:did', ex: 'Has + subject + past participle: done, not did.' })
        ] },
        { title: 'Subject & Object Questions', cefr: 'B1+', boss: true, pool: [
            item('wh:who|verb:broke|obj:the window|?', { d: 'aux:did', ex: 'When who/what is the SUBJECT, there is no auxiliary: Who broke the window?' }),
            item('wh:who|aux:did|subj:you|verb:speak|prep:to|?', { d: 'verb:spoke', ex: 'Who is the object of to, so we need did + subject + base verb, with the preposition at the end.' }),
            item('wh:what|verb:happened|adv:at the meeting|?', { d: 'aux:did', ex: 'What is the subject of happened, so no did: What happened?' }),
            item('wh:what|aux:are|subj:you|verb:looking|prep:for|?', { d: 'verb:look', ex: 'Present continuous question with the preposition stranded at the end: looking for.' })
        ] },

        /* ===== ACT II: PERFECT, MODAL, PASSIVE (6-10) ===== */
        { title: 'Perfect Tenses', cefr: 'B2', pool: [
            item('subj:she|aux:has|verb:lived|adv:here|adv:since 2019|.', { d: 'aux:is', alt: ['since 2019|she|has|lived|here|.'], ex: 'Present perfect + since for a state continuing to now. Short time phrases can also open the sentence.' }),
            item('subj:they|aux:had|adv:already|verb:left|adv:when we arrived|.', { d: 'verb:leave', alt: ['they|had|left|already|when we arrived|.', 'when we arrived|they|had|already|left|.', 'when we arrived|they|had|left|already|.'], ex: 'Past perfect (had + past participle) for the earlier of two past events.' }),
            item('wh:how long|aux:have|subj:you|aux:been|verb:waiting|?', { d: 'aux:did', ex: 'Present perfect continuous question: how long + have + subject + been + -ing.' }),
            item('subj:I|aux:have|aux:been|verb:working|adv:all morning|.', { d: 'verb:worked', alt: ['all morning|I|have|been|working|.'], ex: 'Have been + -ing stresses an activity continuing up to now.' })
        ] },
        { title: 'Modals of Deduction', cefr: 'B2', pool: [
            item('subj:she|aux:must|aux:have|verb:forgotten|.', { d: 'verb:forgot', ex: 'Must have + past participle = I am sure this happened.' }),
            item("subj:they|aux:can't|aux:have|verb:seen|obj:us|.", { d: 'verb:saw', trap: [["they|can't|have|saw|us|.", 'After have you need the past participle: seen, not saw.']], ex: "Can't have + past participle = I am sure this did NOT happen." }),
            item('subj:he|aux:might|aux:have|verb:missed|obj:the train|.', { d: 'verb:miss', ex: 'Might have + past participle = perhaps this happened.' }),
            item('subj:the thief|aux:must|aux:have|verb:climbed|adv:through the window|.', { d: 'verb:climb', ex: 'Modal + have + past participle for deductions about the past.' })
        ] },
        { title: 'Modals of Regret & Criticism', cefr: 'B2', pool: [
            item('subj:you|aux:should|aux:have|verb:told|obj:me|.', { d: 'verb:tell', ex: 'Should have + past participle criticises a past action that did not happen.' }),
            item('subj:we|aux:could|aux:have|verb:won|obj:the final|.', { d: 'verb:win', ex: 'Could have + past participle: a past possibility that did not happen.' }),
            item('wh:what|aux:would|subj:you|aux:have|verb:done|?', { d: 'verb:did', ex: 'Question form: wh-word + would + subject + have + past participle.' }),
            item("subj:she|aux:needn't|aux:have|verb:worried|.", { d: 'verb:worry', ex: "Needn't have + past participle: she worried, but it was unnecessary." })
        ] },
        { title: 'The Passive Voice', cefr: 'B2', pool: [
            item('subj:the bridge|aux:was|verb:built|adv:in 1890|.', { d: 'verb:build', alt: ['in 1890|the bridge|was|built|.'], ex: 'Passive: be + past participle. The doer is unknown or unimportant.' }),
            item('subj:the letters|aux:are|verb:delivered|adv:every morning|.', { d: 'verb:deliver', alt: ['every morning|the letters|are|delivered|.'], ex: 'Present simple passive: am/is/are + past participle.' }),
            item('subj:the suspect|aux:is|aux:being|verb:questioned|adv:by the police|.', { d: 'verb:question', ex: 'Present continuous passive: is + being + past participle; by introduces the agent.' }),
            item('subj:the ledger|aux:had|aux:been|verb:updated|.', { d: 'verb:update', ex: 'Past perfect passive: had + been + past participle.' })
        ] },
        { title: 'Advanced Passives', cefr: 'C1', boss: true, pool: [
            item('subj:the report|aux:will|aux:have|aux:been|verb:finished|adv:by Friday|.', { d: 'verb:finish', alt: ['by Friday|the report|will|have|been|finished|.'], ex: 'Future perfect passive: will + have + been + past participle.' }),
            item('subj:he|aux:is|verb:said|part:to|aux:have|verb:been|comp:a spy|.', { d: 'verb:saying', ex: 'Reporting passive: subject + is said + to have + past participle for an earlier situation.' }),
            item('subj:the documents|aux:must|aux:have|aux:been|verb:stolen|.', { d: 'verb:stole', ex: 'Modal perfect passive: must + have + been + past participle.' }),
            item('subj:the patient|aux:should|aux:be|verb:seen|adv:by a specialist|.', { d: 'verb:saw', ex: 'Modal passive: modal + be + past participle.' })
        ] },

        /* ===== ACT III: NEGATIVE INVERSION (11-15) ===== */
        { title: 'Never, Rarely, Seldom', cefr: 'C1', pool: [
            item('neg:never|aux:had|subj:I|verb:seen|obj:such chaos|.', { d: 'verb:saw', near: ['I|had|never|seen|such chaos|.'], trap: [['never|had|I|saw|such chaos|.', 'After had you need the past participle: seen.'], ['I|never|had|seen|such chaos|.', 'In normal order, never goes after the auxiliary: I had never seen. But this floor needs inversion.']], ex: 'A fronted negative adverb forces question order: Never + had + subject + past participle.' }),
            item('neg:rarely|aux:do|subj:we|verb:see|obj:such talent|.', { d: 'verb:sees', near: ['we|rarely|do|see|such talent|.'], trap: [['we|do|rarely|see|such talent|.', 'Do + rarely sounds unnatural. Normal order is we rarely (do) see, but this floor needs inversion: Rarely do we see...']], ex: 'Rarely + do/does/did + subject + base verb: present simple needs do-support when inverted.' }),
            item('neg:seldom|aux:has|subj:the city|verb:looked|comp:so beautiful|.', { d: 'verb:look', near: ['the city|has|seldom|looked|so beautiful|.'], trap: [['the city|seldom|has|looked|so beautiful|.', 'In normal order, seldom goes after the auxiliary: the city has seldom looked. But this floor needs inversion.']], ex: 'Seldom + has + subject + past participle.' }),
            item('neg:at no time|aux:was|subj:the public|verb:informed|.', { d: 'verb:inform', near: ['the public|was|at no time|informed|.', 'the public|was|informed|at no time|.'], ex: 'At no time + auxiliary + subject. Here the auxiliary is the passive was.' })
        ] },
        { title: 'Little, Not Once, Nowhere', cefr: 'C1', pool: [
            item('neg:little|aux:did|subj:he|verb:realise|obj:the danger|.', { d: 'verb:realised', ex: 'Little (= not at all) + did + subject + base verb.' }),
            item('neg:not once|aux:did|subj:she|verb:complain|.', { d: 'verb:complained', near: ['she|did|not once|complain|.'], ex: 'Not once + did + subject + base verb.' }),
            item('neg:nowhere|adv:else|aux:will|subj:you|verb:find|obj:such hospitality|.', { d: 'verb:found', near: ['you|will|find|such hospitality|nowhere|else|.'], ex: 'Nowhere (else) + modal + subject + base verb.' }),
            item('neg:in no way|verb:is|subj:this|comp:acceptable|.', { d: 'verb:are', near: ['this|is|in no way|acceptable|.'], ex: 'With be as the main verb, be itself inverts: In no way is this acceptable.' })
        ] },
        { title: 'No Sooner, Hardly, Scarcely', cefr: 'C1', pool: [
            item('neg:no sooner|aux:had|subj:we|verb:sat down|conj:than|subj:the phone|verb:rang|.', { d: 'conj:when', near: ['we|had|no sooner|sat down|than|the phone|rang|.'], trap: [['no sooner|had|we|sat down|when|the phone|rang|.', 'No sooner pairs with than, not when.']], ex: 'No sooner + had + subject + past participle + than + past simple.' }),
            item('neg:hardly|aux:had|subj:she|verb:arrived|conj:when|subj:the trouble|verb:started|.', { d: 'conj:than', near: ['she|had|hardly|arrived|when|the trouble|started|.'], trap: [['hardly|had|she|arrived|than|the trouble|started|.', 'Hardly pairs with when (or before), not than.']], ex: 'Hardly + had + subject + past participle + when + past simple.' }),
            item('neg:scarcely|aux:had|subj:the play|verb:begun|conj:when|subj:the lights|verb:failed|.', { d: 'verb:began', near: ['the play|had|scarcely|begun|when|the lights|failed|.'], ex: 'Scarcely + had + subject + past participle (begun, not began) + when.' })
        ] },
        { title: 'Not Until & Only...', cefr: 'C1', pool: [
            item('neg:not until|adv:the next day|aux:did|subj:we|verb:hear|obj:the news|.', { d: 'verb:heard', ex: 'Not until + time + did + subject + base verb.' }),
            item('neg:only after|subj:she|verb:left|aux:did|subj:we|verb:speak|.', { d: 'verb:spoke', alt: ['only after|we|left|did|she|speak|.'], ex: 'Only after + clause, then inversion in the MAIN clause: did we speak. The time clause itself is not inverted.' }),
            item('neg:only then|aux:did|subj:I|verb:understand|obj:the problem|.', { d: 'verb:understood', ex: 'Only then + did + subject + base verb.' }),
            item('neg:only when|subj:the results|verb:arrived|aux:did|subj:they|verb:celebrate|.', { d: 'verb:celebrated', ex: 'Only when + clause + inverted main clause.' })
        ] },
        { title: 'Under No Circumstances', cefr: 'C1', boss: true, pool: [
            item('neg:under no circumstances|aux:should|subj:you|verb:open|obj:this door|.', { d: 'verb:opened', near: ['you|should|under no circumstances|open|this door|.', 'you|should|open|this door|under no circumstances|.'], ex: 'Under no circumstances + modal + subject + base verb.' }),
            item('neg:not only|verb:is|subj:the plan|comp:expensive|,|conj:but|subj:it|verb:is|adv:also|comp:risky|.', { d: 'aux:does', near: [['the plan|is|not only|expensive|,|but|it|is|also|risky|.', NEAR.neg]], ex: 'Not only + be + subject + complement, but + subject + be + also. With be as the main verb, be itself inverts (no do-support).' }),
            item('neg:on no account|aux:must|subj:the alarm|aux:be|verb:switched off|.', { d: 'verb:switch', near: ['the alarm|must|on no account|be|switched off|.'], ex: 'On no account + modal + subject + passive (be + past participle).' }),
            item('neg:not since|adv:the war|aux:had|subj:the country|verb:faced|obj:such hardship|.', { d: 'verb:face', ex: 'Not since + time + had + subject + past participle.' })
        ] },

        /* ===== ACT IV: CONDITIONAL & SO/SUCH INVERSION (16-20) ===== */
        { title: 'Conditional Inversion: Had', cefr: 'C1', pool: [
            item('aux:had|subj:he|verb:known|obj:the truth|,|subj:he|aux:would|aux:have|verb:fled|.', { d: 'conj:if', alt: ['he|would|have|fled|,|had|he|known|the truth|.'], ex: 'Had he known = If he had known. Drop if and invert had (third conditional).' }),
            item('aux:had|subj:we|verb:left|adv:earlier|,|subj:we|aux:would|aux:have|verb:caught|obj:the train|.', { d: 'verb:leave', alt: ['we|would|have|caught|the train|,|had|we|left|earlier|.'], ex: 'Had + subject + past participle replaces if + past perfect.' }),
            item('aux:had|subj:it|neg:not|verb:been|adv:for your help|,|subj:I|aux:would|aux:have|verb:failed|.', { d: 'verb:be', alt: ['I|would|have|failed|,|had|it|not|been|for your help|.'], ex: "Had it not been for = If it hadn't been for. In inversion, not follows the subject." })
        ] },
        { title: 'Conditional Inversion: Should', cefr: 'C1', pool: [
            item('aux:should|subj:you|verb:need|obj:assistance|,|adv:please|verb:call|obj:reception|.', { d: 'conj:if', alt: ['please|call|reception|,|should|you|need|assistance|.'], near: [['if|you|need|assistance|,|please|call|reception|.', 'Grammatical, but this floor needs inversion: replace if with should at the front.']], ex: 'Should you need = If you need. A formal, slightly tentative first conditional.' }),
            item('aux:should|subj:the weather|verb:improve|,|subj:we|aux:will|verb:eat|adv:outside|.', { d: 'verb:improves', alt: ['we|will|eat|outside|,|should|the weather|improve|.'], ex: 'Should + subject + BASE verb (improve, not improves).' }),
            item('aux:should|subj:anyone|verb:ask|,|verb:say|obj:nothing|.', { d: 'verb:asks', alt: ['say|nothing|,|should|anyone|ask|.'], ex: 'Should anyone ask = If anyone asks; the main clause can be an imperative.' })
        ] },
        { title: 'Conditional Inversion: Were', cefr: 'C1', pool: [
            item('aux:were|subj:I|comp:you|,|subj:I|aux:would|verb:apologise|.', { d: 'aux:was', alt: ['I|would|apologise|,|were|I|you|.'], trap: [['was|I|you|,|I|would|apologise|.', WERE]], ex: 'Were I you = If I were you (second conditional, formal).' }),
            item('aux:were|subj:it|neg:not|adv:for the rain|,|subj:we|aux:would|verb:go|verb:hiking|.', { d: 'aux:was', alt: ['we|would|go|hiking|,|were|it|not|for the rain|.'], trap: [['was|it|not|for the rain|,|we|would|go|hiking|.', WERE]], ex: "Were it not for = If it weren't for." }),
            item('aux:were|subj:the government|verb:to raise|obj:taxes|,|subj:there|aux:would|verb:be|comp:protests|.', { d: 'verb:raised', alt: ['there|would|be|protests|,|were|the government|to raise|taxes|.'], ex: 'Were + subject + to-infinitive: a formal, hypothetical future.' })
        ] },
        { title: 'So & Such Inversion', cefr: 'C2', pool: [
            item('adv:so|comp:great|verb:was|subj:the demand|conj:that|subj:tickets|verb:sold out|adv:in minutes|.', { d: 'verb:were', alt: ['so|great|was|the demand|that|in minutes|tickets|sold out|.'], near: ['the demand|was|so|great|that|tickets|sold out|in minutes|.', 'the demand|was|so|great|that|in minutes|tickets|sold out|.'], ex: 'So + adjective + be + subject + that-clause. Be agrees with the subject: was the demand.' }),
            item('comp:such|verb:was|subj:her anger|conj:that|subj:she|aux:could not|verb:speak|.', { d: 'verb:were', near: ['her anger|was|such|that|she|could not|speak|.'], ex: 'Such + be + noun phrase + that: Such was her anger that...' }),
            item('adv:so|adv:quietly|aux:did|subj:she|verb:speak|conj:that|subj:nobody|verb:heard|obj:her|.', { d: 'verb:spoke', ex: 'So + adverb + did + subject + base verb + that-clause.' })
        ] },
        { title: 'The Inversion Gauntlet', cefr: 'C2', boss: true, pool: [
            item('aux:had|subj:I|verb:realised|obj:the risk|,|subj:I|aux:would|adv:never|aux:have|verb:agreed|.', { d: 'verb:realise', alt: ['I|would|never|have|agreed|,|had|I|realised|the risk|.'], ex: 'Had I realised = If I had realised.' }),
            item('adv:so|comp:severe|verb:were|subj:the floods|conj:that|subj:the roads|verb:closed|.', { d: 'verb:was', near: [['the floods|were|so|severe|that|the roads|closed|.', NEAR.so]], ex: 'So + adjective + were + plural subject + that-clause.' }),
            item('aux:were|subj:she|verb:to resign|,|subj:the company|aux:would|verb:collapse|.', { d: 'aux:was', alt: ['the company|would|collapse|,|were|she|to resign|.'], trap: [['was|she|to resign|,|the company|would|collapse|.', WERE]], ex: 'Were she to resign = If she resigned (formal hypothesis).' }),
            item('neg:little|aux:did|subj:they|verb:suspect|conj:that|subj:the butler|verb:was lying|.', { d: 'verb:suspected', ex: 'Little + did + subject + base verb, then a normal that-clause.' })
        ] },

        /* ===== ACT V: CLEFTS & FRONTING (21-25) ===== */
        { title: 'It-Clefts', cefr: 'C1', pool: [
            item('cleft:it|verb:was|adv:with reluctance|rel:that|subj:they|verb:agreed|.', { d: 'rel:what', alt: ['it|was|they|that|agreed|with reluctance|.'], ex: 'It + be + FOCUS + that + rest of the clause: the focus gets the emphasis.' }),
            item('cleft:it|verb:was|subj:Sarah|rel:who|verb:found|obj:the error|.', { d: 'rel:which', ex: 'Focus on a person: It was Sarah who...' }),
            item('cleft:it|verb:is|subj:the cost|rel:that|verb:worries|obj:me|.', { d: 'rel:what', near: [['it|is|me|that|the cost|worries|.', 'In formal C1 English, focus the subject here: It is the cost that worries me (or It is I who...).']], ex: 'It is + focus + that: the cost (not the time) worries me.' }),
            item("cleft:it|verb:wasn't|adv:until midnight|rel:that|subj:the guests|verb:left|.", { d: 'verb:leave', ex: "It wasn't until + time + that: stresses how late something happened." })
        ] },
        { title: 'Wh-Clefts', cefr: 'C1', pool: [
            item('wh:what|subj:I|verb:need|verb:is|comp:a holiday|.', { d: 'verb:are', alt: ['a holiday|is|what|I|need|.'], ex: 'What + clause + is + focus. The reversed form (A holiday is what I need) is also correct.' }),
            item('wh:what|verb:surprised|obj:me|verb:was|comp:his honesty|.', { d: 'verb:were', alt: ['his honesty|was|what|surprised|me|.'], ex: 'What surprised me was + focus.' }),
            item('wh:what|subj:she|verb:did|verb:was|comp:resign|.', { d: 'verb:resigns', ex: 'What + subject + did + was + bare infinitive: focus on an action.' }),
            item('wh:what|subj:we|aux:should|verb:do|verb:is|comp:wait|.', { d: 'verb:waits', ex: 'What we should do is + bare infinitive.' })
        ] },
        { title: 'All-Clefts & The Reason', cefr: 'C2', pool: [
            item('cleft:all|subj:I|verb:want|verb:is|comp:a quiet life|.', { d: 'verb:are', alt: ['a quiet life|is|all|I|want|.'], ex: 'All (= the only thing) + clause + is + focus.' }),
            item('cleft:all|subj:you|verb:have to do|verb:is|comp:sign|adv:here|.', { d: 'verb:signing', ex: 'All you have to do is + bare infinitive.' }),
            item('cleft:the reason|subj:I|verb:called|verb:is|conj:that|subj:I|verb:need|obj:your help|.', { d: 'conj:because', trap: [['the reason|I|called|is|because|I|need|your help|.', "Common in speech, but formal English uses 'The reason... is that', not 'is because'."]], ex: 'The reason + clause + is that + clause.' }),
            item('cleft:the thing|rel:that|verb:annoys|obj:me|verb:is|comp:his arrogance|.', { d: 'rel:what', alt: ['his arrogance|is|the thing|that|annoys|me|.'], ex: 'The thing that + clause + is + focus.' })
        ] },
        { title: 'Fronting & Locative Inversion', cefr: 'C2', pool: [
            item('adv:into the room|verb:burst|subj:the inspector|.', { d: 'aux:did', near: ['the inspector|burst|into the room|.'], ex: 'Fronted place/direction + verb + subject: a dramatic, literary inversion (no do-support).' }),
            item('adv:on the hill|verb:stood|subj:an old castle|.', { d: 'verb:standing', near: ['an old castle|stood|on the hill|.'], ex: 'Locative inversion: place + verb + subject puts the new information at the end.' }),
            item('obj:this|subj:I|aux:cannot|verb:accept|.', { d: 'verb:accepts', near: ['I|cannot|accept|this|.'], ex: 'Object fronting for emphasis or contrast: no inversion, just move the object.' }),
            item('adv:here|verb:comes|subj:the bus|.', { d: 'verb:come', near: ['the bus|comes|here|.'], ex: 'Here/There + verb + NOUN subject inverts (Here comes the bus), but not with pronouns (Here it comes).' }),
            item('comp:strange|conj:as|subj:it|aux:may|verb:seem|,|subj:I|verb:agree|.', { d: 'verb:seems', alt: ['I|agree|,|strange|as|it|may|seem|.'], ex: 'Adjective + as + subject + verb = although: Strange as it may seem...' })
        ] },
        { title: "The Syntax Dragon's Hoard", cefr: 'C2', boss: true, pool: [
            item('neg:not only|aux:did|subj:he|verb:fail|obj:the audit|,|conj:but|subj:he|adv:also|verb:lied|.', { d: 'verb:failed', ex: 'Not only + inversion, then but + subject + also + verb.' }),
            item('cleft:it|verb:was|adv:only|conj:when|subj:the lights|verb:went out|rel:that|subj:we|verb:panicked|.', { d: 'verb:panic', ex: 'It-cleft with a focused time clause: It was only when... that...' }),
            item('neg:never before|aux:had|subj:so many|verb:owed|obj:so much|adv:to so few|.', { d: 'verb:owe', near: [['so many|had|never before|owed|so much|to so few|.', NEAR.neg]], ex: 'Never before + had + subject + past participle (after Churchill).' }),
            item('comp:such|verb:was|subj:the force|adv:of the blast|conj:that|subj:windows|verb:shattered|.', { d: 'verb:were', near: [['the force|of the blast|was|such|that|windows|shattered|.', NEAR.so]], ex: 'Such + be + subject + that-clause.' }),
            item('neg:little|aux:did|subj:we|verb:know|wh:what|verb:lay|adv:ahead|.', { d: 'verb:knew', ex: 'Little did we know + wh-clause (normal order inside the wh-clause).' })
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
        4:  { name: 'The Goblin of Questions', emoji: '👺', taunt: 'Who taught you to ask questions? Nobody did!', color: 0x4d7c0f },
        9:  { name: 'Phantom of the Passive', emoji: '👻', taunt: 'Mistakes were made... but never by me!', color: 0x94a3b8 },
        14: { name: 'Vampire of Negation', emoji: '🧛', taunt: 'Never before have I tasted such feeble syntax!', color: 0x991b1b },
        19: { name: 'Inquisitor of Inversion', emoji: '🧙‍♂️', taunt: 'Were you to defeat me, I would be astonished!', color: 0x1e40af },
        24: { name: 'The Syntax Dragon (C2)', emoji: '🐉', taunt: 'It is perfection that I demand.', color: 0x047857 }
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

    /* ---------------- DATA SELF-TEST (used by ?selftest=1 pages) ---------------- */
    function multiset(arr) { return arr.slice().sort().join('\u0001'); }
    function dataTests() {
        const lines = [];
        let pass = true, nItems = 0, nAns = 0, nNear = 0, nTrap = 0;
        const fail = (m) => { pass = false; lines.push('FAIL ' + m); };
        if (floors.length !== 25) fail('expected 25 floors, got ' + floors.length);
        floors.forEach((fl, f) => {
            if (fl.pool.length < 3 || fl.pool.length > 5) fail(`floor ${f + 1} pool size ${fl.pool.length}`);
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
        version: 2, POS, CSS, TIPS, NEAR, floors, bosses, milestones, loot,
        explain: (f, id) => { const it = floors[f] && floors[f].pool.find(p => p.id === id); return it ? it.explain : ''; },
        formatSentence, shuffle, shuffledRunes, pickItem, check, closest,
        store: { KEY: STORE_KEY, load, save, fresh, sanitize },
        dataTests
    };
})(window);
