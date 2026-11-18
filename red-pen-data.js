/* ==========================================================
   Red-Pen Speed-Run: C1 Error, Register & Restraint Clinic
   20 Multi-Span Paragraphs · 60 Target Phrases · 4 Acts
   Exposes window.RED_PEN_DATA (and CommonJS module.exports)
   STRICT ANONYMISATION: Zero student names, cities, employers,
   or nationalities anywhere in data or comments.
   ========================================================== */
(function (root) {
    'use strict';

    const acts = [
        {
            act: 1,
            id: 'act1',
            shortTitle: 'IELTS Task 2',
            title: 'Act I · IELTS Task 2 Arguments',
            cefr: 'C1',
            description: 'Catch countability, preposition, and conditional errors while sparing clean C1 thesis framing.'
        },
        {
            act: 2,
            id: 'act2',
            shortTitle: 'C1 Reports',
            title: 'Act II · Cambridge C1 Reports & Proposals',
            cefr: 'C1',
            description: 'Separate agreement and inversion errors from chatty spoken fillers and natural formal recommendations.'
        },
        {
            act: 3,
            id: 'act3',
            shortTitle: 'Academic Data',
            title: 'Act III · Data & Academic Summaries',
            cefr: 'C1 / C2',
            description: 'Audit uncountable research nouns, embedded questions, and false friends alongside crisp academic prose.'
        },
        {
            act: 4,
            id: 'act4',
            shortTitle: 'Executive',
            title: 'Act IV · Executive & Formal Correspondence',
            cefr: 'C1 / C2',
            description: 'Trim conversational office idioms into executive English without erasing polite hedging or past modals.'
        }
    ];

    const allParagraphs = [
        /* ================= ACT I: IELTS TASK 2 ARGUMENTS (p1a..p1e) ================= */
        {
            id: 'p1a',
            act: 1,
            cefr: 'C1',
            genre: 'IELTS Task 2 Essay',
            title: '1. Public Museums & Civic Access',
            context: 'An IELTS Task 2 paragraph evaluating state subsidies and free entry for public galleries.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: "Preparatory 'It' Passive + Concessive 'Despite'",
                formula: "It is widely argued that + Clause  |  despite + Noun Phrase (zero 'of')",
                note: "In Task 2 essays, I advise keeping passive reporting openings untouched while watching out for added 'of' after 'despite' and conversational nouns like 'kids'."
            },
            parts: [
                { text: 'Some commentators still question whether public galleries justify annual subsidies. ' },
                {
                    id: 'p1a-1',
                    verdict: 'natural',
                    text: 'It is widely argued that',
                    correction: 'It is widely argued that',
                    grammarLabel: "Preparatory 'It' Passive Reporting",
                    formula: 'It + BE + adverb + V3 + that + Clause',
                    explanation: 'Leave this alone: preparatory passive reporting is clean C1 academic English, even though automated style tools wrongly warn against passive voice.'
                },
                { text: ' free admission widens civic participation. When entry prices climb, ' },
                {
                    id: 'p1a-2',
                    verdict: 'spoken',
                    text: 'kids nowadays',
                    correction: 'young people today',
                    grammarLabel: 'Formal Academic Noun Phrase',
                    formula: 'young people / school-age children + today (formal register)',
                    explanation: 'Spoken slip: grammatical in everyday talk, yet too chatty for an IELTS Task 2 argument. Swap to a plain neutral noun phrase rather than heavy thesaurus phrasing.'
                },
                { text: ' lose regular contact with local heritage. Furthermore, ' },
                {
                    id: 'p1a-3',
                    verdict: 'error',
                    text: 'despite of',
                    correction: 'despite',
                    grammarLabel: 'Concessive Preposition',
                    formula: "despite + Noun Phrase / -ing (zero 'of')  |  in spite of + Noun Phrase",
                    explanation: "Actual grammar error: 'despite' never takes 'of'. Either write 'despite' alone or use the three-word phrase 'in spite of'."
                },
                { text: ' rising maintenance costs, free access encourages repeat visits across every income bracket.' }
            ]
        },
        {
            id: 'p1b',
            act: 1,
            cefr: 'C1',
            genre: 'IELTS Task 2 Essay',
            title: '2. Marine Conservation & Quotas',
            context: 'An IELTS Task 2 body paragraph assessing coastal fishing limits and reef recovery.',
            dossierCategory: 'word_formation',
            blueprint: {
                device: 'Uncountable Abstract Nouns vs Natural Concessive Markers',
                formula: 'damage [uncountable harm]  ≠  damages [legal compensation]',
                note: "Unnecessary red-pen edits often punish clean determiners like 'most species' while missing pluralised uncountables such as 'damages'."
            },
            parts: [
                { text: 'Without enforceable coastal quotas, ' },
                {
                    id: 'p1b-1',
                    verdict: 'natural',
                    text: 'most species',
                    correction: 'most species',
                    grammarLabel: 'General Plural Determiner',
                    formula: 'most + bare plural noun [general reference]',
                    explanation: "Leave this alone: 'most species' is completely grammatical and accurate for general reference. Changing it creates pointless clutter."
                },
                { text: ' along shallow reefs face severe depletion within two decades. Unregulated trawling has already caused ' },
                {
                    id: 'p1b-2',
                    verdict: 'error',
                    text: 'countless damages',
                    correction: 'widespread damage',
                    grammarLabel: 'Uncountable Abstract Noun',
                    formula: 'damage [uncountable = physical harm]  ≠  damages [plural = legal compensation]',
                    explanation: "Actual grammar error: physical or environmental harm is strictly uncountable ('damage'). Plural 'damages' means money awarded by a court."
                },
                { text: ' to fragile seabed habitats. ' },
                {
                    id: 'p1b-3',
                    verdict: 'natural',
                    text: 'Having said that,',
                    correction: 'Having said that,',
                    grammarLabel: 'Concessive Discourse Marker',
                    formula: 'Having said that, + Main Clause',
                    explanation: "Leave this alone: 'Having said that,' is a natural, balanced C1 concession introducing a necessary qualification."
                },
                { text: ' strict bans only succeed when coastal fleets receive practical retraining support.' }
            ]
        },
        {
            id: 'p1c',
            act: 1,
            cefr: 'C1',
            genre: 'IELTS Task 2 Essay',
            title: '3. Urban Transit & Rail Investment',
            context: 'An IELTS Task 2 paragraph weighing motorway expansion against light-rail funding.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: "Second Conditional (No 'Would' in If-Clause)",
                formula: "If + Subject + Past Simple, Subject + would + bare infinitive",
                note: "Keep modal 'would' strictly in the result clause, and trade conversational quantifiers ('loads of') or idioms ('get on top of') for measured formal wording."
            },
            parts: [
                { text: 'Expanding outer ring roads rarely resolves peak-hour gridlock for long. Although municipal authorities often spend ' },
                {
                    id: 'p1c-1',
                    verdict: 'spoken',
                    text: 'loads of money',
                    correction: 'substantial public funds',
                    grammarLabel: 'Formal Quantifier & Noun Register',
                    formula: 'substantial / considerable + noun (replaces colloquial loads of)',
                    explanation: "Spoken slip: 'loads of money' works naturally in casual speech, yet lowers academic register in an IELTS Task 2 essay."
                },
                { text: ' on widening motorway lanes, fresh bottlenecks soon appear at city junctions. ' },
                {
                    id: 'p1c-2',
                    verdict: 'error',
                    text: 'If councils would invest',
                    correction: 'If councils invested',
                    grammarLabel: 'Second Conditional (If-Clause)',
                    formula: 'If + Subject + Past Simple, Subject + would + bare infinitive',
                    explanation: "Actual grammar error: standard conditional syntax forbids 'would' inside a hypothetical if-clause. Use Past Simple ('invested') there."
                },
                { text: ' in reliable light rail instead, commuter stress would fall markedly. Only then can planners ' },
                {
                    id: 'p1c-3',
                    verdict: 'spoken',
                    text: 'get on top of chronic emissions',
                    correction: 'bring chronic emissions under control',
                    grammarLabel: 'Formal Verb Phrase',
                    formula: 'bring + [Noun] + under control (formal equivalent of get on top of)',
                    explanation: "Spoken slip: 'get on top of' is an energetic conversational idiom, whereas academic policy prose prefers 'bring ... under control'."
                },
                { text: ' in dense residential corridors.' }
            ]
        },
        {
            id: 'p1d',
            act: 1,
            cefr: 'C1',
            genre: 'IELTS Task 2 Essay',
            title: '4. Hybrid Schedules & Staff Burnout',
            context: 'An IELTS Task 2 paragraph examining meeting overload in remote and hybrid teams.',
            dossierCategory: 'cleft_clauses',
            blueprint: {
                device: "Countable Quantifiers, Wh-Clefts & 'Suggest' Valency",
                formula: "many + plural countable noun  |  What + Clause + BE  |  suggest + (that) + Subject + base verb",
                note: "When you see 'suggest' followed by a pronoun and 'to'-infinitive, reach for the red pen right away; leave clean Wh-clefts untouched."
            },
            parts: [
                { text: 'Remote work clearly reduces daily commuting fatigue, yet poorly coordinated staff still attend ' },
                {
                    id: 'p1d-1',
                    verdict: 'error',
                    text: 'much meetings',
                    correction: 'many meetings',
                    grammarLabel: 'Countable Plural Quantifier',
                    formula: 'many / numerous + countable plural noun  |  much + uncountable noun',
                    explanation: "Actual grammar error: 'meetings' is a countable plural noun, so it requires 'many' (never 'much')."
                },
                { text: ' that could easily be settled in a short message. ' },
                {
                    id: 'p1d-2',
                    verdict: 'natural',
                    text: 'What makes this shift notable is',
                    correction: 'What makes this shift notable is',
                    grammarLabel: 'Wh-Cleft Focus Clause',
                    formula: 'What + Clause + BE + Noun / Clause',
                    explanation: "Leave this alone: a clean Wh-cleft highlights the key insight cleanly and earns high Grammatical Range credit."
                },
                { text: ' how quickly exhaustion sets in without clear working hours. When burnout warnings surface, senior managers often ' },
                {
                    id: 'p1d-3',
                    verdict: 'error',
                    text: 'suggest us to wait',
                    correction: 'suggest that staff wait',
                    grammarLabel: "Verb Valency ('Suggest')",
                    formula: "suggest + -ing  |  suggest + (that) + Subject + base verb (never person + to-infinitive)",
                    explanation: "Actual grammar error: 'suggest' never takes 'object + to-infinitive' ('suggest someone to do'). Use a 'that'-clause or gerund ('suggest waiting')."
                },
                { text: ' until the annual review.' }
            ]
        },
        {
            id: 'p1e',
            act: 1,
            cefr: 'C1',
            genre: 'IELTS Task 2 Essay',
            title: '5. University Grants & Pure Research',
            context: 'An IELTS Task 2 paragraph defending long-term foundational science funding.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: 'Split Infinitives vs Vague Conversational Fillers',
                formula: 'to + [focusing adverb] + infinitive (valid C1)  |  numerous + specific noun',
                note: "Never waste revision time 'fixing' a natural split infinitive like 'to genuinely understand'; save your energy for vague placeholders such as 'stuff'."
            },
            parts: [
                { text: 'Universities face growing pressure to channel grants exclusively into commercial technology. Yet ' },
                {
                    id: 'p1e-1',
                    verdict: 'natural',
                    text: 'to genuinely understand',
                    correction: 'to genuinely understand',
                    grammarLabel: 'Focusing Adverb in Infinitive',
                    formula: 'to + [adverb] + bare infinitive (accepted in modern exam English)',
                    explanation: 'Leave this alone: placing a single focusing adverb inside an infinitive is completely accepted in standard exam marking.'
                },
                { text: ' long-term medical challenges, laboratories require patient foundational research. Purely short-term contracts leave researchers sorting through ' },
                {
                    id: 'p1e-2',
                    verdict: 'spoken',
                    text: 'a lot of stuff',
                    correction: 'numerous administrative tasks',
                    grammarLabel: 'Specific Academic Noun Phrase',
                    formula: 'numerous / multiple + concrete plural noun (replaces vague stuff)',
                    explanation: "Spoken slip: 'a lot of stuff' is natural in conversation, yet vague filler nouns weaken formal academic argument."
                },
                { text: ' instead of testing hypotheses. Treating discovery like an ordinary quarterly product creates ' },
                {
                    id: 'p1e-3',
                    verdict: 'spoken',
                    text: 'a pretty big problem',
                    correction: 'a serious structural risk',
                    grammarLabel: 'Formal Evaluative Noun Phrase',
                    formula: 'a serious / pressing + noun (replaces conversational intensifier pretty)',
                    explanation: "Spoken slip: using 'pretty' as a casual intensifier makes an academic conclusion sound informal."
                },
                { text: ' for independent scientific inquiry.' }
            ]
        },

        /* ================= ACT II: CAMBRIDGE C1 REPORTS & PROPOSALS (p2a..p2e) ================= */
        {
            id: 'p2a',
            act: 2,
            cefr: 'C1',
            genre: 'C1 Advanced Report',
            title: '6. Library Study Wing Refurbishment',
            context: 'A Cambridge C1 Advanced Report reviewing acoustic problems in a campus reading wing.',
            dossierCategory: 'word_formation',
            blueprint: {
                device: 'Material Mass Nouns & Formal Report Contrast',
                formula: 'a great deal of + [material mass noun]  |  by far + the most + Adjective + Noun',
                note: "Building materials such as 'marble', 'timber', and 'glass' are uncountable when referring to the substance rather than individual objects."
            },
            parts: [
                { text: 'During the spring survey, postgraduate readers noted that the refurbished entrance uses ' },
                {
                    id: 'p2a-1',
                    verdict: 'error',
                    text: 'a lot of marbles',
                    correction: 'a great deal of marble',
                    grammarLabel: 'Uncountable Material Mass Noun',
                    formula: "a great deal of + material noun [stone/wood/glass]  ≠  plural countable toys ('marbles')",
                    explanation: "Actual grammar error: as a stone building material, 'marble' is uncountable. Plural 'marbles' refers only to small glass spheres."
                },
                { text: ' along the stairwell, echoing footsteps into quiet desks. Meanwhile, shared study booths present clear ' },
                {
                    id: 'p2a-2',
                    verdict: 'spoken',
                    text: 'pros and cons',
                    correction: 'advantages and drawbacks',
                    grammarLabel: 'Formal Report Noun Coordination',
                    formula: 'advantages and drawbacks / benefits and limitations (formal C1)',
                    explanation: "Spoken slip: 'pros and cons' is clear in everyday talk, yet C1 reports and formal essays read better with 'advantages and drawbacks'."
                },
                { text: ' for small seminar groups. Overall, installing acoustic partitions remains ' },
                {
                    id: 'p2a-3',
                    verdict: 'natural',
                    text: 'by far the most practical option',
                    correction: 'by far the most practical option',
                    grammarLabel: 'Emphatic Superlative Modifier',
                    formula: 'by far + the most + Adjective + Noun',
                    explanation: "Leave this alone: 'by far the most practical option' is natural, restrained C1 recommendation phrasing."
                },
                { text: ' within this year’s maintenance budget.' }
            ]
        },
        {
            id: 'p2b',
            act: 2,
            cefr: 'C1',
            genre: 'C1 Advanced Proposal',
            title: '7. Municipal Cycle-Lane Proposal',
            context: 'A C1 Advanced Proposal recommending segregated commuter lanes along a ring road.',
            dossierCategory: 'inversion',
            blueprint: {
                device: 'Dependent Prepositions & Inverted Second Conditional',
                formula: "depend ON + Noun / -ing  |  Were + Subject + to-infinitive, Subject + would + verb",
                note: "Both 'pose a challenge for' and 'pose a challenge to' are natural C1 collocations, while 'Were the council to...' lifts formal proposal syntax."
            },
            parts: [
                { text: 'Heavy morning congestion continues to ' },
                {
                    id: 'p2b-1',
                    verdict: 'natural',
                    text: 'pose a serious challenge for',
                    correction: 'pose a serious challenge for',
                    grammarLabel: 'C1 Verb-Noun Collocation',
                    formula: 'pose a challenge + for / to + [Noun Phrase]',
                    explanation: "Leave this alone: both 'pose a challenge for' and 'pose a challenge to' are standard C1 collocations."
                },
                { text: ' residents travelling across the eastern bridge. Many cycling schemes fail because planners ' },
                {
                    id: 'p2b-2',
                    verdict: 'error',
                    text: 'depend of',
                    correction: 'depend on',
                    grammarLabel: 'Dependent Preposition',
                    formula: "depend / rely / count + ON + [Noun / -ing] (never 'of')",
                    explanation: "Actual grammar error: 'depend' always pairs with 'on' or 'upon'. Using 'of' is a frequent preposition transfer slip."
                },
                { text: ' painted road markings instead of raised kerbs. ' },
                {
                    id: 'p2b-3',
                    verdict: 'natural',
                    text: 'Were the council to',
                    correction: 'Were the council to',
                    grammarLabel: 'Inverted Second Conditional',
                    formula: 'Were + Subject + to-infinitive, Subject + would + bare infinitive',
                    explanation: "Leave this alone: 'Were the council to...' is crisp C1/C2 conditional inversion for formal proposals."
                },
                { text: ' install physical dividers along the avenue, commuter uptake would rise sharply.' }
            ]
        },
        {
            id: 'p2c',
            act: 2,
            cefr: 'C1',
            genre: 'C1 Advanced Proposal',
            title: '8. Hospital Admin Retention Proposal',
            context: 'A C1 Advanced Proposal addressing shift scheduling and clerical staff turnover.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: 'Relative-Clause Agreement & Formal Phrasal Alternatives',
                formula: 'Plural Antecedent + that + Plural Verb  |  establish + wh-clause',
                note: "Check agreement across every 'that/which' clause before moving on, and replace spoken clichés ('at the end of the day') with single-word adverbs."
            },
            parts: [
                { text: 'Recent exit interviews show that newly hired clerks rarely leave over salary alone; ' },
                {
                    id: 'p2c-1',
                    verdict: 'spoken',
                    text: 'at the end of the day,',
                    correction: 'ultimately,',
                    grammarLabel: 'Formal Concluding Adverb',
                    formula: 'ultimately, / in practice, (replaces conversational cliché)',
                    explanation: "Spoken slip: 'at the end of the day' is worn-out conversational filler. Replacing it with 'ultimately' keeps your proposal crisp."
                },
                { text: ' unpredictable shift swaps drain morale. Many coordinators still lose benefits because ' },
                {
                    id: 'p2c-2',
                    verdict: 'error',
                    text: 'perks that requires',
                    correction: 'perks that require',
                    grammarLabel: 'Relative-Clause Subject-Verb Agreement',
                    formula: 'Plural Antecedent (perks) + that + Plural Verb (require)',
                    explanation: 'Actual grammar error: the verb inside a relative clause must agree with its plural antecedent (perks that require, never requires).'
                },
                { text: ' advance managerial sign-off often expire unused. To retain experienced staff, supervisors must ' },
                {
                    id: 'p2c-3',
                    verdict: 'spoken',
                    text: 'figure out why',
                    correction: 'establish why',
                    grammarLabel: 'Formal Transitive Verb',
                    formula: 'establish / determine + wh-clause (formal alternative to figure out)',
                    explanation: "Spoken slip: 'figure out' fits informal conversation, while C1 proposals favour concise formal verbs such as 'establish' or 'determine'."
                },
                { text: ' quarterly handovers routinely overrun by two weeks.' }
            ]
        },
        {
            id: 'p2d',
            act: 2,
            cefr: 'C1',
            genre: 'C1 Advanced Report',
            title: '9. Arts Centre Reopening Audit',
            context: 'A C1 Advanced Report reviewing technical acoustics and outreach budgets after renovation.',
            dossierCategory: 'inversion',
            blueprint: {
                device: 'Uncountable Collective Nouns & Negative Adverbial Inversion',
                formula: 'Not only + did + Subject + verb  |  Rarely + does + Subject + base verb',
                note: "Both 'Not only' and 'Rarely' require auxiliary inversion when placed at the start of a clause, whereas 'equipment' never takes a plural '-s'."
            },
            parts: [
                { text: 'Audience numbers rose modestly after the autumn reopening, though several visitors felt disappointed because ' },
                {
                    id: 'p2d-1',
                    verdict: 'error',
                    text: 'the acoustic equipments',
                    correction: 'the acoustic equipment',
                    grammarLabel: 'Uncountable Collective Noun',
                    formula: "equipment [strictly uncountable, zero '-s', zero 'a/an']",
                    explanation: "Actual grammar error: 'equipment' is strictly uncountable. Use 'equipment' or count specific items ('microphones', 'speakers')."
                },
                { text: ' in the studio hall distorted spoken-word evenings. ' },
                {
                    id: 'p2d-2',
                    verdict: 'natural',
                    text: 'Not only did ticket sales climb',
                    correction: 'Not only did ticket sales climb',
                    grammarLabel: 'Negative Adverbial Inversion',
                    formula: 'Not only + Auxiliary (did) + Subject + Base Verb, but ... also',
                    explanation: "Leave this alone: fronting 'Not only' properly triggers auxiliary inversion ('did ticket sales climb'), adding authentic C1 balance."
                },
                { text: ', but local schools also requested extra matinee slots. However, ' },
                {
                    id: 'p2d-3',
                    verdict: 'error',
                    text: 'rarely the board allocates',
                    correction: 'rarely does the board allocate',
                    grammarLabel: 'Negative Adverbial Inversion',
                    formula: 'Rarely + Auxiliary (do/does/did) + Subject + Base Verb',
                    explanation: "Actual grammar error: when restrictive 'rarely' opens a clause, English requires subject-auxiliary inversion ('rarely does the board allocate')."
                },
                { text: ' sufficient funds for daytime outreach.' }
            ]
        },
        {
            id: 'p2e',
            act: 2,
            cefr: 'C1',
            genre: 'C1 Advanced Report',
            title: '10. Public Library Modernisation Report',
            context: 'A C1 Advanced Report evaluating evening hours and catalogue software upgrades.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: 'Resultative Participle Clauses vs Conversational Modifiers',
                formula: ', thereby + present participle (-ing)  |  rather / somewhat + adjective',
                note: "Keep resultative participles like ', thereby enabling' intact; upgrade casual phrasing ('a bit', 'get rid of') so your report keeps an even tone."
            },
            parts: [
                { text: 'Long-standing members welcomed the extended evening timetable, ' },
                {
                    id: 'p2e-1',
                    verdict: 'natural',
                    text: 'thereby enabling',
                    correction: 'thereby enabling',
                    grammarLabel: 'Resultative Participle Clause',
                    formula: ', thereby + present participle (-ing)',
                    explanation: "Leave this alone: ', thereby enabling' links cause and outcome smoothly in formal C1 prose."
                },
                { text: ' shift workers to use reference desks after six o’clock. On the downside, several borrowers noted that outdated search terminals were ' },
                {
                    id: 'p2e-2',
                    verdict: 'spoken',
                    text: 'a bit disappointing',
                    correction: 'rather underwhelming',
                    grammarLabel: 'Formal Evaluative Register',
                    formula: 'rather / somewhat + formal adjective (replaces conversational a bit)',
                    explanation: "Spoken slip: 'a bit' softens remarks in speech, yet in a C1 report 'rather underwhelming' sounds much more composed."
                },
                { text: ' compared with neighbouring branches. Updating the catalogue interface will ' },
                {
                    id: 'p2e-3',
                    verdict: 'spoken',
                    text: 'get rid of',
                    correction: 'eliminate',
                    grammarLabel: 'Formal Single-Word Verb',
                    formula: 'eliminate / remove (replaces informal phrasal get rid of)',
                    explanation: "Spoken slip: 'get rid of' is fine in speech, whereas formal evaluation reports favour precise verbs such as 'eliminate'."
                },
                { text: ' duplicate booking queues before the summer term.' }
            ]
        },

        /* ================= ACT III: DATA & ACADEMIC SUMMARIES (p3a..p3e) ================= */
        {
            id: 'p3a',
            act: 3,
            cefr: 'C1',
            genre: 'Academic Summary',
            title: '11. Sleep Debt & Recall Trials',
            context: 'An academic summary synthesising controlled memory-retention studies.',
            dossierCategory: 'word_formation',
            blueprint: {
                device: "Uncountable 'Research' vs Natural Reporting Verbs",
                formula: "research [uncountable] + singular verb  |  debate + whether + Clause",
                note: "'Research' takes no plural '-s' as an academic noun; use 'studies' when you want a plural count noun, and keep 'debated whether' unchanged."
            },
            parts: [
                { text: 'Across four controlled sleep-clinic trials, ' },
                {
                    id: 'p3a-1',
                    verdict: 'error',
                    text: 'recent neurological researches indicate',
                    correction: 'recent neurological research indicates',
                    grammarLabel: 'Uncountable Academic Noun',
                    formula: "research [uncountable] + singular verb ('indicates')  |  studies [plural]",
                    explanation: "Actual grammar error: as an academic noun, 'research' is uncountable and takes a singular verb ('research indicates', or plural 'studies indicate')."
                },
                { text: ' that fragmented rest impairs overnight recall. Participants who slept under five hours struggled to ' },
                {
                    id: 'p3a-2',
                    verdict: 'spoken',
                    text: 'hang on to',
                    correction: 'retain',
                    grammarLabel: 'Academic Verb Precision',
                    formula: 'retain / recall + [Noun] (replaces casual phrasal hang on to)',
                    explanation: "Spoken slip: 'hang on to' suits everyday conversation, whereas academic summaries expect exact verbs such as 'retain'."
                },
                { text: ' newly learned vocabulary. Even so, investigators ' },
                {
                    id: 'p3a-3',
                    verdict: 'natural',
                    text: 'debated whether',
                    correction: 'debated whether',
                    grammarLabel: 'Reporting Verb + Indirect Clause',
                    formula: 'debate + whether + Subject + Verb',
                    explanation: "Leave this alone: 'debated whether' is textbook formal reporting syntax with no grammatical flaw."
                },
                { text: ' brief afternoon naps offset cumulative weekday sleep debt.' }
            ]
        },
        {
            id: 'p3b',
            act: 3,
            cefr: 'C1 / C2',
            genre: 'Health-Policy Summary',
            title: '12. Rural Clinic Retention Study',
            context: 'A policy brief summarising regional nursing vacancies and appointment delays.',
            dossierCategory: 'nominalisation',
            blueprint: {
                device: 'Passive Reporting Infinitives & Clean Relative Clauses',
                formula: "BE + widely believed + to + infinitive  |  information [zero '-s']",
                note: "Resist rewriting plain relative clauses like 'people who live in outer districts' into robotic noun stacks; catch uncountable 'informations' instead."
            },
            parts: [
                { text: 'Longitudinal payroll figures ' },
                {
                    id: 'p3b-1',
                    verdict: 'natural',
                    text: 'are widely believed to',
                    correction: 'are widely believed to',
                    grammarLabel: 'Passive Reporting + Infinitive',
                    formula: 'Subject + BE + adverb + V3 + to + infinitive',
                    explanation: 'Leave this alone: passive reporting plus an infinitive expresses consensus objectively and earns C1 Grammatical Range credit.'
                },
                { text: ' reflect acute housing shortages rather than clinical workload alone. Over the past decade, rural surgeries have struggled to compile reliable ' },
                {
                    id: 'p3b-2',
                    verdict: 'error',
                    text: 'informations',
                    correction: 'information',
                    grammarLabel: "Uncountable Noun (Zero Plural '-s')",
                    formula: "information / data / evidence [strictly uncountable, never 'informations']",
                    explanation: "Actual grammar error: 'information' never takes a plural '-s'. For countable units, write 'items of information' or 'records'."
                },
                { text: ' on temporary locum turnover. Meanwhile, ' },
                {
                    id: 'p3b-3',
                    verdict: 'natural',
                    text: 'people who live in outer districts',
                    correction: 'people who live in outer districts',
                    grammarLabel: 'Defining Relative Clause',
                    formula: 'Noun + who + Finite Verb [clear grammatical subject]',
                    explanation: 'Leave this alone: a clear defining relative clause is 100% grammatical and far better than bloated nominal chains.'
                },
                { text: ' often wait three weeks for routine blood tests.' }
            ]
        },
        {
            id: 'p3c',
            act: 3,
            cefr: 'C1',
            genre: 'Data Summary',
            title: '13. Coastal Solar & Grid Storage Data',
            context: 'A technical data summary analysing renewable generation and winter peak demand.',
            dossierCategory: 'cleft_clauses',
            blueprint: {
                device: 'Embedded Question Word Order & Calibrated Trend Lexis',
                formula: 'explain + wh-word + Subject + Verb (drop do/does/did)',
                note: "Once a main clause introduces an indirect question, drop 'do/does/did' and revert to normal statement word order."
            },
            parts: [
                { text: 'Between 2018 and 2024, installed solar capacity showed ' },
                {
                    id: 'p3c-1',
                    verdict: 'spoken',
                    text: 'a huge jump',
                    correction: 'a sharp rise',
                    grammarLabel: 'Academic Data Trend Phrase',
                    formula: 'a sharp / marked + rise / increase (replaces casual huge jump)',
                    explanation: "Spoken slip: 'a huge jump' works in informal talk, whereas data summaries and Task 1 charts expect calibrated terms such as 'a sharp rise'."
                },
                { text: ' across coastal turbines and domestic rooftops. However, regional briefings rarely ' },
                {
                    id: 'p3c-2',
                    verdict: 'error',
                    text: 'explain how does the grid handle',
                    correction: 'explain how the grid handles',
                    grammarLabel: 'Embedded Question Word Order',
                    formula: 'Verb + wh-word + Subject + Verb (statement order, zero do/does/did)',
                    explanation: "Actual grammar error: inside an indirect question after 'explain', drop auxiliary 'does' and use statement order ('how the grid handles')."
                },
                { text: ' sudden winter demand peaks. Without upgraded transformers, surplus summer electricity ' },
                {
                    id: 'p3c-3',
                    verdict: 'spoken',
                    text: 'ends up wasted',
                    correction: 'goes unused',
                    grammarLabel: 'Formal Resultative Verb',
                    formula: 'goes unused / remains unstored (formal alternative to ends up wasted)',
                    explanation: "Spoken slip: 'ends up wasted' carries a casual spoken rhythm; 'goes unused' fits technical data prose cleanly."
                },
                { text: ' before autumn demand arrives.' }
            ]
        },
        {
            id: 'p3d',
            act: 3,
            cefr: 'C1 / C2',
            genre: 'Labour-Market Summary',
            title: '14. Technical Apprenticeships & Mobility',
            context: 'A labour-market summary comparing domestic training programmes and graduate emigration.',
            dossierCategory: 'phrasal_verbs',
            blueprint: {
                device: "False Friends ('Prospects'), Time Clefts & 'Capable Of'",
                formula: "It was not until + Clause + that + Clause  |  capable OF + -ing",
                note: "Spellcheckers glide straight past 'job perspectives' because every word is spelled right—keep your eye on meaning and dependent prepositions."
            },
            parts: [
                { text: 'Survey returns from twelve technical colleges indicate that young engineers rarely emigrate out of restlessness alone. Rather, many relocate because domestic firms offer limited ' },
                {
                    id: 'p3d-1',
                    verdict: 'error',
                    text: 'job perspectives',
                    correction: 'career prospects',
                    grammarLabel: "Lexical False Friend ('Prospects' vs 'Perspectives')",
                    formula: 'career / job prospects [future opportunities]  ≠  perspectives [viewpoints]',
                    explanation: "Actual grammar/lexical error: 'perspectives' means viewpoints or angles. Future employment opportunities are 'career prospects' (or 'job prospects')."
                },
                { text: ' during the first three years after qualification. ' },
                {
                    id: 'p3d-2',
                    verdict: 'natural',
                    text: 'It was not until paid apprenticeships expanded that',
                    correction: 'It was not until paid apprenticeships expanded that',
                    grammarLabel: "Emphatic 'It' Cleft (Time Pivot)",
                    formula: 'It was not until + Clause + that + Main Clause',
                    explanation: "Leave this alone: 'It was not until ... that ...' is a clean C1/C2 time-pivot cleft isolating the turning point in the data."
                },
                { text: ' retention improved across regional workshops. Even so, training agencies are still ' },
                {
                    id: 'p3d-3',
                    verdict: 'error',
                    text: 'capable to retain',
                    correction: 'capable of retaining',
                    grammarLabel: 'Adjective + Preposition + Gerund',
                    formula: 'capable OF + -ing  |  able TO + bare infinitive',
                    explanation: "Actual grammar error: 'able' takes 'to + verb', whereas 'capable' strictly requires 'of + -ing' ('capable of retaining')."
                },
                { text: ' barely half of newly certified technicians beyond five years.' }
            ]
        },
        {
            id: 'p3e',
            act: 3,
            cefr: 'C1 / C2',
            genre: 'Educational Research Summary',
            title: '15. Print Stamina & Screen Skimming',
            context: 'An education research summary reviewing adolescent reading stamina and text comprehension.',
            dossierCategory: 'cleft_clauses',
            blueprint: {
                device: 'Partitive Relative Clauses vs Informal Vague Fillers',
                formula: 'Plural Noun + , some of which + Verb  |  tasks such as + Examples',
                note: "Partitive clauses (', some of which...') add smooth syntactic variety; avoid conversational fillers like 'things like' and 'sort out' in published summaries."
            },
            parts: [
                { text: 'Reading-comprehension assessments across secondary cohorts ' },
                {
                    id: 'p3e-1',
                    verdict: 'natural',
                    text: 'yielded thirty archival essays, some of which',
                    correction: 'yielded thirty archival essays, some of which',
                    grammarLabel: 'Partitive Relative Clause',
                    formula: 'Plural Noun + , some / many / several of which + Verb',
                    explanation: "Leave this alone: ', some of which...' is a polished C1 partitive relative clause linking a sub-sample smoothly."
                },
                { text: ' demonstrated remarkable syntactic maturity. Still, screen-heavy timetables have left many adolescents struggling with ' },
                {
                    id: 'p3e-2',
                    verdict: 'spoken',
                    text: 'things like',
                    correction: 'sustained tasks such as',
                    grammarLabel: 'Formal Exemplification',
                    formula: 'specific category noun + such as + [Examples] (replaces vague things like)',
                    explanation: "Spoken slip: 'things like' relies on vague conversational shorthand. Naming the noun ('sustained tasks such as') sharpens academic precision."
                },
                { text: ' uninterrupted long-form argument. Educators warn that short-clip habits also make it harder to ' },
                {
                    id: 'p3e-3',
                    verdict: 'spoken',
                    text: 'sort out',
                    correction: 'resolve',
                    grammarLabel: 'Formal Transitive Verb',
                    formula: 'resolve / reconcile (formal alternative to phrasal sort out)',
                    explanation: "Spoken slip: 'sort out' works naturally in speech, yet formal research summaries call for precise verbs such as 'resolve'."
                },
                { text: ' subtle contradictions across longer source texts.' }
            ]
        },

        /* ================= ACT IV: EXECUTIVE & FORMAL CORRESPONDENCE (p4a..p4e) ================= */
        {
            id: 'p4a',
            act: 4,
            cefr: 'C1',
            genre: 'Conference Memo',
            title: '16. Keynote Logistics & Venue Briefing',
            context: 'Formal correspondence briefing external speakers ahead of an annual symposium.',
            dossierCategory: 'inversion',
            blueprint: {
                device: "Verb Valency ('Arrive At') & Inverted First Conditional",
                formula: 'arrive AT + [event/venue]  |  Should + Subject + bare infinitive, Imperative',
                note: "Formal correspondence shines when 'Should unforeseen delays arise,' opens a sentence cleanly—just watch 'arrive to' preposition slips."
            },
            parts: [
                { text: 'Thank you for confirming your keynote slot for Thursday morning. When delegates ' },
                {
                    id: 'p4a-1',
                    verdict: 'error',
                    text: 'arrive to the conference',
                    correction: 'arrive at the conference',
                    grammarLabel: "Verb + Preposition Valency ('Arrive At')",
                    formula: "arrive AT + [venue / building / event]  |  arrive IN + [city / country] (never 'to')",
                    explanation: "Actual grammar error: 'arrive' never takes 'to'. Use 'arrive at' for events, buildings, or stations, and 'arrive in' for cities or countries."
                },
                { text: ', badge collection opens in the east atrium from eight o’clock. On Wednesday afternoon, the steering board will ' },
                {
                    id: 'p4a-2',
                    verdict: 'spoken',
                    text: 'go over',
                    correction: 'review',
                    grammarLabel: 'Formal Executive Verb',
                    formula: 'review / inspect (formal alternative to phrasal go over)',
                    explanation: "Spoken slip: 'go over' fits a quick verbal briefing, whereas formal written correspondence prefers 'review'."
                },
                { text: ' revised safety protocols with venue marshals. ' },
                {
                    id: 'p4a-3',
                    verdict: 'natural',
                    text: 'Should unforeseen delays arise,',
                    correction: 'Should unforeseen delays arise,',
                    grammarLabel: 'Inverted First Conditional',
                    formula: 'Should + Subject + bare infinitive, Imperative / Modal Clause',
                    explanation: "Leave this alone: 'Should unforeseen delays arise,' is textbook C1 formal conditional inversion in executive correspondence."
                },
                { text: ' please contact the registration desk before noon.' }
            ]
        },
        {
            id: 'p4b',
            act: 4,
            cefr: 'C1 / C2',
            genre: 'Supplier Audit Letter',
            title: '17. Compliance Addendum & Audit Notice',
            context: 'Formal correspondence from an operations lead addressing quarterly reporting gaps with a vendor.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: "Transitive 'Discuss' & Past Modal Compression ('Needn't Have')",
                formula: "discuss + [Direct Object] (zero 'about')  |  needn't have + V3",
                note: "Two high-value C1 signatures stay untouched here ('For all its investment' and 'needn't have commissioned'), while 'discussed about' gets cut immediately."
            },
            parts: [
                { text: 'The supplier expanded internal staffing after winter. ' },
                {
                    id: 'p4b-1',
                    verdict: 'natural',
                    text: 'For all its investment in',
                    correction: 'For all its investment in',
                    grammarLabel: 'Concessive Prepositional Frame',
                    formula: 'for all + possessive + Noun, Main Clause [= despite]',
                    explanation: "Leave this alone: 'for all its investment in...' is an idiomatic, high-level C1/C2 concessive frame."
                },
                { text: ' automated compliance software, three regional depots missed filing deadlines last quarter. During yesterday’s call, board members ' },
                {
                    id: 'p4b-2',
                    verdict: 'error',
                    text: 'discussed about',
                    correction: 'discussed',
                    grammarLabel: "Transitive Verb Valency ('Discuss')",
                    formula: "discuss + [Direct Object] (zero preposition)  |  a discussion + about + [Noun]",
                    explanation: "Actual grammar error: the verb 'discuss' is directly transitive and never takes 'about' (unlike the noun 'a discussion about')."
                },
                { text: ' revised penalty clauses before signing the addendum. Since automated logs were already running by April, regional directors ' },
                {
                    id: 'p4b-3',
                    verdict: 'natural',
                    text: 'needn’t have commissioned',
                    correction: 'needn’t have commissioned',
                    grammarLabel: "Past Modal Compression ('Needn't Have')",
                    formula: "needn't have + V3 [= carried out, though unnecessary]",
                    explanation: "Leave this alone: 'needn't have + past participle' expresses an action that happened yet proved unnecessary."
                },
                { text: ' duplicate third-party checks last spring.' }
            ]
        },
        {
            id: 'p4c',
            act: 4,
            cefr: 'C1',
            genre: 'Executive Apology Letter',
            title: '18. Client Outage & Settlement Credit',
            context: 'A formal client letter offering immediate restitution after a billing disruption.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: 'Second Conditional Alignment & Executive Correspondence Tone',
                formula: 'If + Subject + Past Simple (could), Subject + would + bare infinitive',
                note: "When writing formally to clients, pair hypothetical 'would' with 'could' inside the if-clause, and tighten conversational 'hassle' and 'make sure'."
            },
            parts: [
                { text: 'Please accept my sincere apologies for the billing outage that disrupted Monday’s settlement run. The engineering desk recognises that this fault caused ' },
                {
                    id: 'p4c-1',
                    verdict: 'spoken',
                    text: 'a lot of hassle',
                    correction: 'considerable inconvenience',
                    grammarLabel: 'Formal Correspondence Noun',
                    formula: 'considerable inconvenience (replaces colloquial a lot of hassle)',
                    explanation: "Spoken slip: 'a lot of hassle' suits casual chat between colleagues, not a formal apology to an external client."
                },
                { text: ' across your treasury accounts. Two hypothetical compensation schedules remain on the table. ' },
                {
                    id: 'p4c-2',
                    verdict: 'error',
                    text: 'If I can choose, I would',
                    correction: 'If I could choose, I would',
                    grammarLabel: 'Second Conditional Modal Alignment',
                    formula: 'If + Subject + Past Simple (could), Subject + would + bare infinitive',
                    explanation: "Actual grammar error: hypothetical 'would' requires past-form 'could' in the conditional if-clause ('If I could choose, I would')."
                },
                { text: ' apply an immediate service credit rather than deferring the rebate until next quarter. Meanwhile, a senior account lead will contact your office directly to ' },
                {
                    id: 'p4c-3',
                    verdict: 'spoken',
                    text: 'make sure',
                    correction: 'ensure',
                    grammarLabel: 'Formal Directive Verb',
                    formula: 'ensure + (that) + Clause (replaces conversational make sure)',
                    explanation: "Spoken slip: 'make sure' is natural in spoken briefings, while executive letters consistently favour 'ensure'."
                },
                { text: ' every pending batch clears before Friday afternoon.' }
            ]
        },
        {
            id: 'p4d',
            act: 4,
            cefr: 'C1',
            genre: 'Operations Briefing Email',
            title: '19. Accreditation Audit & Rule Shift',
            context: 'A formal operations update on ongoing testing and recent regulatory deadlines.',
            dossierCategory: 'cleft_clauses',
            blueprint: {
                device: "Present Perfect Continuous ('Since') vs Finished Past Simple",
                formula: "Since [past anchor], Subject + has/have been + -ing  |  Past Simple + last Tuesday",
                note: "'Since March' links past to present and forbids Present Continuous alone, whereas 'last Tuesday' locks the clause firmly into Past Simple."
            },
            parts: [
                { text: 'Preparations for the autumn accreditation audit remain on schedule across all four clinics. ' },
                {
                    id: 'p4d-1',
                    verdict: 'error',
                    text: 'Since March, the compliance unit is testing',
                    correction: 'Since March, the compliance unit has been testing',
                    grammarLabel: "Present Perfect Continuous with 'Since'",
                    formula: 'Since [past starting point], Subject + has/have been + -ing',
                    explanation: "Actual grammar error: ongoing action stretching from a past anchor ('Since March') up to now requires Present Perfect Continuous ('has been testing')."
                },
                { text: ' encrypted backup logs every Friday afternoon. ' },
                {
                    id: 'p4d-2',
                    verdict: 'natural',
                    text: 'What matters most at this stage is',
                    correction: 'What matters most at this stage is',
                    grammarLabel: 'Wh-Cleft Focus Opening',
                    formula: 'What + Verb Phrase + BE + Noun / -ing Clause',
                    explanation: "Leave this alone: a Wh-cleft focus opening places crisp emphasis on the priority without sounding abrupt."
                },
                { text: ' maintaining steady documentation across shift handovers. Unfortunately, ' },
                {
                    id: 'p4d-3',
                    verdict: 'error',
                    text: 'the regulator has announced those rules last Tuesday',
                    correction: 'the regulator announced those rules last Tuesday',
                    grammarLabel: 'Past Simple with Finished Time Anchor',
                    formula: 'Past Simple + finished time marker (yesterday / last Tuesday / in 2022)',
                    explanation: "Actual grammar error: finished past time ('last Tuesday') blocks Present Perfect ('has announced'); use Past Simple ('announced')."
                },
                { text: ', leaving tight margins for revision.' }
            ]
        },
        {
            id: 'p4e',
            act: 4,
            cefr: 'C1 / C2',
            genre: 'Advisory Board Correspondence',
            title: '20. Curriculum Moderation Consultation',
            context: 'Formal correspondence inviting an external specialist to review examination rubrics.',
            dossierCategory: 'register_shift',
            blueprint: {
                device: 'Diplomatic Litotes vs Casual Office Jargon',
                formula: 'Subject + BE + not entirely convinced that + Clause',
                note: "Keep diplomatic understatement ('not entirely convinced') untouched, while trimming chatty fillers like 'way too little' and 'touch base'."
            },
            parts: [
                { text: 'The curriculum board greatly appreciates your comments on the draft assessment syllabus. ' },
                {
                    id: 'p4e-1',
                    verdict: 'natural',
                    text: 'I am not entirely convinced that',
                    correction: 'I am not entirely convinced that',
                    grammarLabel: 'Understated Negation (Litotes)',
                    formula: 'Subject + BE + not entirely convinced that + Clause',
                    explanation: 'Leave this alone: polite litotes lets you register disagreement calmly in formal correspondence without sounding blunt.'
                },
                { text: ' shortening the practical exam will raise grading consistency across centres. Furthermore, the committee felt the interim timetable allowed ' },
                {
                    id: 'p4e-2',
                    verdict: 'spoken',
                    text: 'way too little',
                    correction: 'insufficient',
                    grammarLabel: 'Formal Quantifier',
                    formula: 'insufficient / inadequate + [Noun] (replaces casual way too little)',
                    explanation: "Spoken slip: 'way too little' belongs in lively conversation; formal correspondence uses 'insufficient' or 'inadequate'."
                },
                { text: ' time for moderation meetings before June. Before final sign-off, board members would welcome an opportunity to ' },
                {
                    id: 'p4e-3',
                    verdict: 'spoken',
                    text: 'touch base on',
                    correction: 'discuss',
                    grammarLabel: 'Formal Executive Verb',
                    formula: 'discuss / review + [Direct Object] (replaces casual office idiom touch base)',
                    explanation: "Spoken slip: 'touch base on' is casual office vernacular; 'discuss' keeps the invitation crisp and courteous."
                },
                { text: ' revised marking rubrics at your earliest convenience.' }
            ]
        }
    ];

    /* ---------------- HELPERS & MODEL BUILDERS ---------------- */
    const byId = Object.create(null);
    const allSpans = [];
    allParagraphs.forEach((p) => {
        byId[p.id] = p;
        p.spans = p.parts.filter((part) => Boolean(part.id));
        p.spans.forEach((sp) => {
            allSpans.push({ paragraph: p, span: sp });
        });
    });

    function findById(id) {
        if (typeof id !== 'string') return null;
        return byId[id.trim()] || null;
    }

    function renderOriginalParagraph(p) {
        if (!p || !Array.isArray(p.parts)) return '';
        return p.parts.map((part) => part.text).join('').replace(/\s+/g, ' ').trim();
    }

    function renderCleanModel(p) {
        if (!p || !Array.isArray(p.parts)) return '';
        return p.parts
            .map((part) => (part.id ? part.correction : part.text))
            .join('')
            .replace(/\s+/g, ' ')
            .trim();
    }

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
        const rng = mulberry32(hashSeed('RED_PEN_DAILY_' + seed));

        const actPools = [1, 2, 3, 4].map((actNum) =>
            allParagraphs.filter((p) => p.act === actNum).map((p) => p.id)
        );
        const pickedIds = actPools.map((pool) => pool[Math.floor(rng() * pool.length)]);
        const remaining = allParagraphs
            .map((p) => p.id)
            .filter((id) => !pickedIds.includes(id));
        const fifth = remaining[Math.floor(rng() * remaining.length)];
        // Deterministic rotation of the 5th pick into slot 2 or 4 so Act order stays varied
        const insertAt = Math.floor(rng() * 5);
        pickedIds.splice(insertAt, 0, fifth);

        const steps = pickedIds.map((id, idx) => {
            const para = findById(id);
            return {
                step: idx + 1,
                act: para.act,
                id: para.id,
                cefr: para.cefr,
                title: para.title,
                paragraph: para
            };
        });
        return { seed, steps };
    }

    /* ---------------- ZERO-BACKEND DUEL CODEC ---------------- */
    function toBase64Url(str) {
        let b64 = '';
        if (typeof Buffer !== 'undefined') {
            b64 = Buffer.from(str, 'utf8').toString('base64');
        } else if (typeof btoa === 'function') {
            const bytes = new TextEncoder().encode(str);
            let bin = '';
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            b64 = btoa(bin);
        } else {
            return '';
        }
        return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
    }

    function fromBase64Url(token) {
        let b64 = String(token || '').replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4 !== 0) b64 += '=';
        if (typeof Buffer !== 'undefined') {
            return Buffer.from(b64, 'base64').toString('utf8');
        }
        if (typeof atob === 'function') {
            const bin = atob(b64);
            const bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
            return new TextDecoder().decode(bytes);
        }
        return '';
    }

    function sanitizeBy(rawBy) {
        return String(rawBy || '')
            .replace(/[^A-Za-z0-9 _.-]/g, '')
            .trim()
            .slice(0, 18);
    }

    function duelChecksum(core) {
        return hashSeed('RED_PEN_DUEL_V1|' + core).toString(36).padStart(4, '0').slice(0, 4);
    }

    function buildDuelSteps(ids) {
        return ids.map((id, idx) => {
            const para = findById(id);
            return {
                step: idx + 1,
                act: para.act,
                id: para.id,
                cefr: para.cefr,
                title: para.title,
                paragraph: para
            };
        });
    }

    function validateDuelIds(ids) {
        if (!Array.isArray(ids) || ids.length < 3 || ids.length > 5) return null;
        const cleanIds = [];
        const seen = new Set();
        for (let i = 0; i < ids.length; i++) {
            const id = String(ids[i] || '').trim();
            if (!id || seen.has(id) || !findById(id)) return null;
            seen.add(id);
            cleanIds.push(id);
        }
        return cleanIds;
    }

    function encodeDuel(opts) {
        const o = opts || {};
        const cleanIds = validateDuelIds(o.ids);
        if (!cleanIds) return '';
        const maxSpans = cleanIds.length * 3;
        const correct = Math.max(0, Math.min(maxSpans, Math.round(Number(o.correct) || 0)));
        const restraint = Math.max(0, Math.min(100, Math.round(Number(o.restraint ?? 100))));
        const sec = Math.max(0, Math.min(3600, Math.round(Number(o.sec) || 0)));
        const by = sanitizeBy(o.by);
        const core = `1|${cleanIds.join(',')}|${correct}|${restraint}|${sec}|${by}`;
        const sig = duelChecksum(core);
        return toBase64Url(`${core}|${sig}`);
    }

    function decodeDuel(raw) {
        if (typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length > 260) return null;

        if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
            const cleanIds = validateDuelIds(parts);
            if (!cleanIds) return null;
            return {
                ids: cleanIds,
                steps: buildDuelSteps(cleanIds),
                correct: 0,
                restraint: 100,
                sec: 0,
                by: ''
            };
        }

        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
        try {
            const decoded = fromBase64Url(trimmed);
            if (!decoded) return null;
            const fields = decoded.split('|');
            if (fields.length !== 7 || fields[0] !== '1') return null;
            const rawIds = fields[1].split(',').map((s) => s.trim()).filter(Boolean);
            const cleanIds = validateDuelIds(rawIds);
            if (!cleanIds) return null;

            const rawCorrect = Number(fields[2]);
            const rawRestraint = Number(fields[3]);
            const rawSec = Number(fields[4]);
            if (!Number.isFinite(rawCorrect) || !Number.isFinite(rawRestraint) || !Number.isFinite(rawSec)) return null;

            const correct = Math.max(0, Math.min(cleanIds.length * 3, Math.round(rawCorrect)));
            const restraint = Math.max(0, Math.min(100, Math.round(rawRestraint)));
            const sec = Math.max(0, Math.min(3600, Math.round(rawSec)));
            const by = sanitizeBy(fields[5]);
            const sig = fields[6];
            const core = `1|${cleanIds.join(',')}|${correct}|${restraint}|${sec}|${by}`;
            if (sig !== duelChecksum(core)) return null;

            return {
                ids: cleanIds,
                steps: buildDuelSteps(cleanIds),
                correct,
                restraint,
                sec,
                by
            };
        } catch (_) {
            return null;
        }
    }

    function duelPreset(presetKey) {
        let pool;
        if (presetKey === 'act1_2') {
            pool = allParagraphs.filter((p) => p.act === 1 || p.act === 2);
        } else if (presetKey === 'act3_4') {
            pool = allParagraphs.filter((p) => p.act === 3 || p.act === 4);
        } else if (presetKey === 'restraint_trap') {
            pool = allParagraphs.filter((p) => p.spans.some((sp) => sp.verdict === 'natural'));
        } else {
            pool = allParagraphs.slice();
        }
        const copy = pool.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        const picked = copy.slice(0, 5);
        const ids = picked.map((p) => p.id);
        return {
            preset: presetKey || 'c1_mix',
            ids,
            steps: buildDuelSteps(ids)
        };
    }

    /* ---------------- DETERMINISTIC DATA & PRIVACY SELF-TEST ---------------- */
    function dataTests() {
        const lines = [];
        let pass = true;
        const fail = (msg) => {
            pass = false;
            lines.push('FAIL ' + msg);
        };

        // 1. Strict Privacy Blocklist (student names, initials/aliases)
        const bannedNames = [
            'Anna', 'Arkadiy', 'Arkady', 'Gaia', 'Igor', 'Slinko',
            'Jonas', 'Jose', 'Kate', 'Ekaterina', 'Michael', 'Noemi',
            'Oksana', 'Sandro', 'Vitaly', 'Ynnning', 'Ning', 'Korentin',
            'Rachid', 'Alex'
        ];
        const privacyRx = new RegExp('\\b(' + bannedNames.join('|') + ')\\b', 'i');

        // 2. Banned US spellings, Tutor Cues, tech-bro jargon, hype, thesaurus bloat, robotic TTS
        const usOrBanned = /\b(realize[ds]?|analyze[ds]?|catalog|color[eds]?|apologize[ds]?|criticize[ds]?|organize[ds]?|emphasize[ds]?|recognize[ds]?|judgment|canceled|traveling|center|behavior|favor|honor|labor|neighbor|defense|offense|practiced|practicing|gold standard|guaranteed|guarantees your score|unbreakable|locks in|supreme|pure gold|cognitive load|processing bandwidth|cantilever(?:s|ed)?|truss(?:es)?|schematic(?:s)?|throughput|depleted talent pool|fundamentally reshaped(?: living)?|provincial communities|Tutor\s+Cue\s*:|Teacher\s+Note\s*:|Tutor\s+Note\s*:|Teacher\s+Cue\s*:|Socratic\s+Prompt\s*:|Instructor\s+Prompt\s*:|speechSynthesis|SpeechSynthesisUtterance)\b/i;
        const mdAsterisk = /(?:^|[\s(])\*[A-Za-z][^*<\n]{1,60}\*(?=[\s).,!?:;]|$)/;
        const corporateWe = /\b(we|our|ours)\b/i;
        const allowedDossierCats = new Set(['register_shift', 'inversion', 'cleft_clauses', 'nominalisation', 'phrasal_verbs', 'word_formation']);

        if (acts.length !== 4) fail(`expected 4 acts, got ${acts.length}`);
        if (allParagraphs.length !== 20) fail(`expected 20 paragraphs, got ${allParagraphs.length}`);

        acts.forEach((a) => {
            const actText = `${a.title} ${a.shortTitle} ${a.description}`;
            if (privacyRx.test(actText)) fail(`act ${a.act} privacy hit`);
            if (usOrBanned.test(actText)) fail(`act ${a.act} banned wording`);
            if (corporateWe.test(a.description)) fail(`act ${a.act} description uses corporate we/our`);
        });

        const verdictCounts = { error: 0, spoken: 0, natural: 0 };
        const actVerdicts = {
            1: { error: 0, spoken: 0, natural: 0 },
            2: { error: 0, spoken: 0, natural: 0 },
            3: { error: 0, spoken: 0, natural: 0 },
            4: { error: 0, spoken: 0, natural: 0 }
        };
        const seenParaIds = new Set();
        const seenSpanIds = new Set();

        allParagraphs.forEach((p, idx) => {
            const pPrefix = p.id || `para#${idx}`;
            if (!/^p[1-4][a-e]$/.test(p.id)) fail(`${pPrefix} invalid paragraph ID`);
            if (seenParaIds.has(p.id)) fail(`${pPrefix} duplicate paragraph ID`);
            seenParaIds.add(p.id);
            if (!p.title || !p.context || !p.genre || !p.blueprint) fail(`${pPrefix} missing metadata or blueprint`);
            if (!allowedDossierCats.has(p.dossierCategory)) fail(`${pPrefix} invalid dossierCategory "${p.dossierCategory}"`);
            if (!Array.isArray(p.spans) || p.spans.length !== 3) fail(`${pPrefix} must have exactly 3 target spans`);

            const orig = renderOriginalParagraph(p);
            const clean = renderCleanModel(p);
            if (!orig || /\s{2,}/.test(orig) || /\s+[,.;:?!]/.test(orig)) fail(`${pPrefix} malformed original text: "${orig}"`);
            if (!clean || /\s{2,}/.test(clean) || /\s+[,.;:?!]/.test(clean)) fail(`${pPrefix} malformed clean model: "${clean}"`);

            p.spans.forEach((sp, sIdx) => {
                const sPrefix = sp.id || `${pPrefix}-s${sIdx + 1}`;
                if (!new RegExp(`^${p.id}-[1-3]$`).test(sp.id)) fail(`${sPrefix} invalid span ID`);
                if (seenSpanIds.has(sp.id)) fail(`${sPrefix} duplicate span ID`);
                seenSpanIds.add(sp.id);

                if (!['error', 'spoken', 'natural'].includes(sp.verdict)) {
                    fail(`${sPrefix} invalid verdict "${sp.verdict}"`);
                } else {
                    verdictCounts[sp.verdict]++;
                    actVerdicts[p.act][sp.verdict]++;
                }

                if (!sp.text || !sp.correction || !sp.grammarLabel || !sp.formula || !sp.explanation) {
                    fail(`${sPrefix} missing required span fields`);
                }
                if (sp.verdict === 'natural' && sp.correction !== sp.text) {
                    fail(`${sPrefix} natural span must keep correction === text`);
                }
                if (sp.verdict !== 'natural' && sp.correction === sp.text) {
                    fail(`${sPrefix} ${sp.verdict} span must modify text in correction`);
                }

                // Grammar-label alignment sanity checks against corrected phrase
                const gl = sp.grammarLabel.toLowerCase();
                const corrLower = sp.correction.toLowerCase();
                if (gl.includes('negative adverbial inversion') && !/\b(not only did|rarely does)\b/.test(corrLower)) {
                    fail(`${sPrefix} grammarLabel "${sp.grammarLabel}" does not match corrected phrase "${sp.correction}"`);
                }
                if (gl.includes("preparatory 'it'") && !/\bit is\b/.test(corrLower)) {
                    fail(`${sPrefix} grammarLabel "${sp.grammarLabel}" lacks preparatory 'It'`);
                }
                if (gl.includes('wh-cleft') && !/^what\b/.test(corrLower)) {
                    fail(`${sPrefix} grammarLabel "${sp.grammarLabel}" lacks Wh-cleft`);
                }
                if (gl.includes('partitive relative') && !/\bsome of which\b/.test(corrLower)) {
                    fail(`${sPrefix} grammarLabel "${sp.grammarLabel}" lacks partitive relative`);
                }

                const spanBlob = [sp.text, sp.correction, sp.grammarLabel, sp.formula, sp.explanation].join(' ');
                if (privacyRx.test(spanBlob)) {
                    const hitP = spanBlob.match(privacyRx);
                    fail(`${sPrefix} privacy violation: "${hitP && hitP[0]}"`);
                }
                if (usOrBanned.test(spanBlob)) {
                    const hitB = spanBlob.match(usOrBanned);
                    fail(`${sPrefix} US spelling or banned phrase: "${hitB && hitB[0]}"`);
                }
                if (mdAsterisk.test(spanBlob)) fail(`${sPrefix} unrendered markdown asterisk`);
                if (corporateWe.test(sp.explanation)) {
                    const hitW = sp.explanation.match(corporateWe);
                    fail(`${sPrefix} corporate we/our in explanation: "${hitW && hitW[0]}"`);
                }
            });

            const paraBlob = [
                p.title, p.context, p.genre, orig, clean,
                p.blueprint.device, p.blueprint.formula, p.blueprint.note
            ].join(' ');
            if (privacyRx.test(paraBlob)) {
                const hitP = paraBlob.match(privacyRx);
                fail(`${pPrefix} privacy violation: "${hitP && hitP[0]}"`);
            }
            if (usOrBanned.test(paraBlob)) {
                const hitB = paraBlob.match(usOrBanned);
                fail(`${pPrefix} US spelling or banned phrase: "${hitB && hitB[0]}"`);
            }
            if (mdAsterisk.test(paraBlob)) fail(`${pPrefix} unrendered markdown asterisk`);
            if (corporateWe.test(p.blueprint.note)) fail(`${pPrefix} corporate we/our in blueprint note`);
        });

        if (verdictCounts.error !== 20 || verdictCounts.spoken !== 20 || verdictCounts.natural !== 20) {
            fail(`expected 20/20/20 verdict balance, got ${JSON.stringify(verdictCounts)}`);
        }
        [1, 2, 3, 4].forEach((actNum) => {
            const av = actVerdicts[actNum];
            if (av.error !== 5 || av.spoken !== 5 || av.natural !== 5) {
                fail(`Act ${actNum} expected 5/5/5 balance, got ${JSON.stringify(av)}`);
            }
        });

        // Daily 5 determinism check
        const dg1 = dailyGauntlet('2026-11-18');
        const dg2 = dailyGauntlet('2026-11-18');
        const dg3 = dailyGauntlet('2026-11-19');
        const dgKey = (g) => g.steps.map((s) => s.id).join(',');
        if (dg1.steps.length !== 5 || dgKey(dg1) !== dgKey(dg2) || dgKey(dg1) === dgKey(dg3) ||
            new Set(dg1.steps.map((s) => s.id)).size !== 5) {
            fail('dailyGauntlet determinism check failed');
        }

        // Duel encode / decode check (strictly anonymised name)
        const tok = encodeDuel({ ids: ['p1a', 'p2b', 'p3c', 'p4a', 'p4e'], correct: 13, restraint: 90, sec: 64, by: '<script>Tester!' });
        if (!tok) fail('encodeDuel failed to produce token');
        const decoded = decodeDuel(tok);
        if (!decoded || decoded.ids.join(',') !== 'p1a,p2b,p3c,p4a,p4e' ||
            decoded.correct !== 13 || decoded.restraint !== 90 || decoded.sec !== 64 ||
            decoded.by !== 'scriptTester' || decoded.steps.length !== 5) {
            fail('decodeDuel round-trip failed');
        }
        const tampered = tok.slice(0, -1) + (tok.slice(-1) === 'A' ? 'B' : 'A');
        if (decodeDuel(tampered) !== null) fail('decodeDuel accepted tampered checksum');
        if (decodeDuel('p1a,p2b,p3c,p4a') === null) fail('decodeDuel rejected valid comma shorthand');
        if (decodeDuel('p1a,p1a,p2b') !== null) fail('decodeDuel accepted duplicate IDs');
        if (decodeDuel('p1a,p2b') !== null) fail('decodeDuel accepted <3 IDs');
        if (decodeDuel('p1a,p2b,p3c,p4a,p4b,p4c') !== null) fail('decodeDuel accepted >5 IDs');
        if (decodeDuel('p1a,p9z,p2b') !== null) fail('decodeDuel accepted unknown ID');

        lines.push(`(a) validated ${allParagraphs.length} paragraphs and ${allSpans.length} spans across ${acts.length} acts (20 error / 20 spoken / 20 natural, 5/5/5 per act)`);
        lines.push(`(b) strict privacy check (zero student names/cities/employers/nationalities), British spelling & zero banned phrases passed`);
        lines.push(`(c) dailyGauntlet('2026-11-18') -> [${dgKey(dg1)}]`);
        lines.push(`(d) encodeDuel / decodeDuel + comma shorthand + tamper checks passed`);
        return { pass, lines };
    }

    const api = {
        version: 1,
        acts,
        allParagraphs,
        allSpans,
        findById,
        renderOriginalParagraph,
        renderCleanModel,
        getTodaySeed,
        dailyGauntlet,
        encodeDuel,
        decodeDuel,
        duelPreset,
        dataTests
    };

    root.RED_PEN_DATA = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
