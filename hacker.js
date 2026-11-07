(() => {
    'use strict';

    // --- 25 Authentic Cambridge C1/C2 Key Word Transformation Nodes across 5 Security Clearance Tiers ---
    const allPuzzles = [
        // TIER 1: NEGATIVE INVERSIONS (Nodes 1-5)
        {
            id: 1,
            tier: "Tier 1: Negative Inversions",
            orig: "I didn't realise how late it was until I looked at my watch.",
            strikeHtml: "<del class='echo-strike'>I</del> <mark class='deficit-focus'>didn't realise</mark> <del class='echo-strike'>how late it was until I looked at my watch.</del>",
            deficitNote: "ISOLATED DEFICIT: 'I didn't realise' -> 'Not until...' triggers main-clause auxiliary inversion.",
            tenseVoice: "TENSE: Past Simple ('didn't realise') -> Past Auxiliary Inversion ('did I realise') | VOICE: Active -> Active",
            formula: "Not until + [Time Clause] + DID + Subject + Bare Infinitive",
            key: "DID",
            start: "Not until I looked at my watch",
            end: "how late it was.",
            ans: ["DID", "I", "REALISE"],
            decoys: ["REALISED", "HAD", "NOT", "DO"],
            splitMarks: "DID I (1 mark) // REALISE (1 mark)",
            explanation: "When 'Not until + time clause' opens a sentence, the main clause must invert like a question (Auxiliary + Subject + Bare Infinitive). Notice the inversion happens in the main clause ('did I realise'), not right after 'Not until'."
        },
        {
            id: 2,
            tier: "Tier 1: Negative Inversions",
            orig: "As soon as we sat down for dinner, the fire alarm went off.",
            strikeHtml: "<mark class='deficit-focus'>As soon as we sat down</mark> <del class='echo-strike'>for dinner, the fire alarm went off.</del>",
            deficitNote: "ISOLATED DEFICIT: 'As soon as we sat down' -> 'No sooner...' requires Past Perfect inversion.",
            tenseVoice: "TENSE: Past Simple sequence ('sat down') -> Past Perfect Inversion ('had we sat down') | VOICE: Active -> Active",
            formula: "No sooner + HAD + Subject + Past Participle ... than",
            key: "SOONER",
            start: "No",
            end: "for dinner than the fire alarm went off.",
            ans: ["SOONER", "HAD", "WE", "SAT", "DOWN"],
            decoys: ["DID", "SIT", "WHEN", "HAVE"],
            splitMarks: "SOONER HAD WE (1 mark) // SAT DOWN (1 mark)",
            explanation: "Pair comparative 'No sooner' with 'than' (already in the sentence ending) and invert the past perfect auxiliary ('had we sat down') to mark the first of two rapid past events."
        },
        {
            id: 3,
            tier: "Tier 1: Negative Inversions",
            orig: "Staff must never share their security credentials with external contractors.",
            strikeHtml: "<del class='echo-strike'>Staff</del> <mark class='deficit-focus'>must never</mark> <del class='echo-strike'>share their security credentials with external contractors.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Staff must never' -> Negative fronted prepositional phrase + inverted modal.",
            tenseVoice: "TENSE: Modal Prohibition ('must never') -> Negative Prepositional Inversion ('no circumstances must staff') | VOICE: Active -> Active",
            formula: "Under no circumstances + Modal/Auxiliary + Subject + Bare Infinitive",
            key: "CIRCUMSTANCES",
            start: "Under",
            end: "share their security credentials with external contractors.",
            ans: ["NO", "CIRCUMSTANCES", "MUST", "STAFF"],
            decoys: ["ANY", "NEVER", "SHOULD", "TO"],
            splitMarks: "NO CIRCUMSTANCES (1 mark) // MUST STAFF (1 mark)",
            explanation: "Because 'Under no circumstances' already carries the negative meaning at the front of the clause, strip out 'never' and invert the modal and subject ('must staff')."
        },
        {
            id: 4,
            tier: "Tier 1: Negative Inversions",
            orig: "She had no idea that the board had already approved her promotion.",
            strikeHtml: "<mark class='deficit-focus'>She had no idea</mark> <del class='echo-strike'>that the board had already approved her promotion.</del>",
            deficitNote: "ISOLATED DEFICIT: 'She had no idea' -> Restrictive adverb 'Little' + past auxiliary inversion.",
            tenseVoice: "TENSE: Past Simple ('had no idea') -> Past Simple Negative Adverbial Inversion ('little did she know') | VOICE: Active -> Active",
            formula: "Little + DID + Subject + KNOW / REALISE / SUSPECT",
            key: "LITTLE",
            start: "So secretive was the meeting that",
            end: "that the board had already approved her promotion.",
            ans: ["LITTLE", "DID", "SHE", "KNOW"],
            decoys: ["KNEW", "HAD", "DOES", "IDEA"],
            splitMarks: "LITTLE DID (1 mark) // SHE KNOW (1 mark)",
            explanation: "When restrictive 'little' leads a clause meaning 'had no idea', invert with the past auxiliary 'did' plus the bare infinitive 'know' ('little did she know')."
        },
        {
            id: 5,
            tier: "Tier 1: Negative Inversions",
            orig: "The update fixed the security flaw and it also doubled the server speed.",
            strikeHtml: "<del class='echo-strike'>The update</del> <mark class='deficit-focus'>fixed</mark> <del class='echo-strike'>the security flaw</del> <mark class='deficit-focus'>and</mark> <del class='echo-strike'>it also doubled the server speed.</del>",
            deficitNote: "ISOLATED DEFICIT: 'The update fixed ... and' -> Correlative 'Not only' inversion.",
            tenseVoice: "TENSE: Past Simple ('fixed') -> Past Simple Correlative Inversion ('only did the update fix') | VOICE: Active -> Active",
            formula: "Not only + DID + Subject + Bare Infinitive ... but also",
            key: "ONLY",
            start: "Not",
            end: "the security flaw, but it also doubled the server speed.",
            ans: ["ONLY", "DID", "THE", "UPDATE", "FIX"],
            decoys: ["FIXED", "HAS", "DOES", "IT"],
            splitMarks: "ONLY DID THE UPDATE (1 mark) // FIX (1 mark)",
            explanation: "Since 'fixed' is past simple with no auxiliary verb in Sentence 1, supply 'did' after 'Not only' and revert 'fixed' to the bare infinitive 'fix'."
        },

        // TIER 2: UNREAL PAST & SUBJUNCTIVE (Nodes 6-10)
        {
            id: 6,
            tier: "Tier 2: Unreal Past & Subjunctive",
            orig: "I regret not backing up my research files before the system crashed.",
            strikeHtml: "<del class='echo-strike'>I</del> <mark class='deficit-focus'>regret not backing</mark> <del class='echo-strike'>up my research files before the system crashed.</del>",
            deficitNote: "ISOLATED DEFICIT: 'regret not backing' -> Past regret requires WISH + Past Perfect.",
            tenseVoice: "TENSE: Past Regret ('regret not backing') -> Past Perfect after WISH ('wish I had backed') | VOICE: Active -> Active",
            formula: "Subject + WISH + Subject + HAD + Past Participle",
            key: "WISH",
            start: "I",
            end: "up my research files before the system crashed.",
            ans: ["WISH", "I", "HAD", "BACKED"],
            decoys: ["BACKING", "NOT", "REGRET", "HAVE"],
            splitMarks: "WISH I (1 mark) // HAD BACKED (1 mark)",
            explanation: "For regrets about a completed past event, 'wish' must be followed by the Past Perfect ('had backed'). Notice how negative 'not backing' flips to affirmative 'had backed'."
        },
        {
            id: 7,
            tier: "Tier 2: Unreal Past & Subjunctive",
            orig: "Please don't mention the audit findings during tomorrow's briefing.",
            strikeHtml: "<mark class='deficit-focus'>Please don't mention</mark> <del class='echo-strike'>the audit findings during tomorrow's briefing.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Please don't mention' -> Polite preference with a new subject ('you') takes Unreal Past.",
            tenseVoice: "TENSE: Present/Future Request ('don't mention') -> Unreal Past ('rather you did not mention') | VOICE: Active -> Active",
            formula: "would rather + New Subject + DID NOT + Bare Infinitive",
            key: "RATHER",
            start: "I would",
            end: "the audit findings during tomorrow's briefing.",
            ans: ["RATHER", "YOU", "DID", "NOT", "MENTION"],
            decoys: ["DO", "TO", "MENTIONED", "HAVE"],
            splitMarks: "RATHER YOU (1 mark) // DID NOT MENTION (1 mark)",
            explanation: "When 'would rather' introduces a new subject ('you'), the verb shifts into the Unreal Past ('did not mention') for present or future actions. Never write 'would rather you don't'."
        },
        {
            id: 8,
            tier: "Tier 2: Unreal Past & Subjunctive",
            orig: "We really ought to upgrade our encryption protocol before next month.",
            strikeHtml: "<mark class='deficit-focus'>We really ought to upgrade</mark> <del class='echo-strike'>our encryption protocol before next month.</del>",
            deficitNote: "ISOLATED DEFICIT: 'We really ought to upgrade' -> Overdue action after 'It is high time'.",
            tenseVoice: "TENSE: Present Obligation ('ought to upgrade') -> Unreal Past ('high time we upgraded') | VOICE: Active -> Active",
            formula: "It is high time + Subject + Past Simple",
            key: "HIGH",
            start: "It is",
            end: "our encryption protocol before next month.",
            ans: ["HIGH", "TIME", "WE", "UPGRADED"],
            decoys: ["UPGRADE", "TO", "SHOULD", "HAVE"],
            splitMarks: "HIGH TIME (1 mark) // WE UPGRADED (1 mark)",
            explanation: "Even though the obligation is for now or the near future, the verb following 'It is high time + subject' must step back into the Past Simple ('upgraded')."
        },
        {
            id: 9,
            tier: "Tier 2: Unreal Past & Subjunctive",
            orig: "He spoke with such confidence that people assumed he owned the company.",
            strikeHtml: "<del class='echo-strike'>He spoke</del> <mark class='deficit-focus'>with such confidence that people assumed he owned</mark> <del class='echo-strike'>the company.</del>",
            deficitNote: "ISOLATED DEFICIT: 'with such confidence that people assumed he owned' -> Counterfactual manner clause.",
            tenseVoice: "TENSE: Counterfactual Comparison -> Unreal Past ('as though he owned') | VOICE: Active -> Active",
            formula: "Verb + AS THOUGH / AS IF + Subject + Past Simple",
            key: "THOUGH",
            start: "He spoke",
            end: "the company.",
            ans: ["AS", "THOUGH", "HE", "OWNED"],
            decoys: ["LIKE", "OWNS", "IF", "WAS"],
            splitMarks: "AS THOUGH (1 mark) // HE OWNED (1 mark)",
            explanation: "Use 'as though' (or 'as if') + Past Simple ('he owned') to describe someone acting in a way that suggests an untrue situation."
        },
        {
            id: 10,
            tier: "Tier 2: Unreal Past & Subjunctive",
            orig: "It is a pity that you didn't tell me about the deadline extension earlier.",
            strikeHtml: "<mark class='deficit-focus'>It is a pity that you didn't tell</mark> <del class='echo-strike'>me about the deadline extension earlier.</del>",
            deficitNote: "ISOLATED DEFICIT: 'It is a pity that you didn't tell' -> Past regret using 'If only'.",
            tenseVoice: "TENSE: Past Regret ('didn't tell') -> Past Perfect Optative ('If only you had told') | VOICE: Active -> Active",
            formula: "If only + Subject + HAD + Past Participle",
            key: "ONLY",
            start: "If",
            end: "me about the deadline extension earlier.",
            ans: ["ONLY", "YOU", "HAD", "TOLD"],
            decoys: ["TOLD", "DID", "HAVE", "NOT"],
            splitMarks: "ONLY YOU (1 mark) // HAD TOLD (1 mark)",
            explanation: "Like 'I wish', 'If only' takes the Past Perfect ('you had told') when expressing regret that something did not happen in the past."
        },

        // TIER 3: PASSIVE REPORTING VERBS (Nodes 11-15)
        {
            id: 11,
            tier: "Tier 3: Passive Reporting Verbs",
            orig: "Investigators believe that the hacker is operating from an offshore server.",
            strikeHtml: "<mark class='deficit-focus'>Investigators believe that</mark> <del class='echo-strike'>the hacker</del> <mark class='deficit-focus'>is operating</mark> <del class='echo-strike'>from an offshore server.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Investigators believe that ... is operating' -> Personal passive reporting + continuous infinitive.",
            tenseVoice: "TENSE: Present Belief + Present Continuous ('is operating') -> Continuous Infinitive ('to be operating') | VOICE: Active -> Passive Reporting",
            formula: "Subject + IS BELIEVED + TO BE + -ing",
            key: "BELIEVED",
            start: "The hacker",
            end: "from an offshore server.",
            ans: ["IS", "BELIEVED", "TO", "BE", "OPERATING"],
            decoys: ["OPERATE", "THAT", "BEEN", "WAS"],
            splitMarks: "IS BELIEVED (1 mark) // TO BE OPERATING (1 mark)",
            explanation: "When the reported action is happening right now ('is operating'), pair the passive reporting verb ('is believed') with the continuous infinitive ('to be operating')."
        },
        {
            id: 12,
            tier: "Tier 3: Passive Reporting Verbs",
            orig: "Journalists say that the minister leaked the classified dossier last week.",
            strikeHtml: "<mark class='deficit-focus'>Journalists say that</mark> <del class='echo-strike'>the minister</del> <mark class='deficit-focus'>leaked</mark> <del class='echo-strike'>the classified dossier last week.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Journalists say that ... leaked' -> Present report of an earlier past action.",
            tenseVoice: "TENSE: Present Report ('say') + Past Action ('leaked') -> Perfect Infinitive ('to have leaked') | VOICE: Active -> Passive Reporting",
            formula: "Subject + IS SAID + TO HAVE + Past Participle",
            key: "SAID",
            start: "The minister",
            end: "the classified dossier last week.",
            ans: ["IS", "SAID", "TO", "HAVE", "LEAKED"],
            decoys: ["WAS", "LEAK", "BE", "HAVING"],
            splitMarks: "IS SAID (1 mark) // TO HAVE LEAKED (1 mark)",
            explanation: "Keep 'is said' in the present tense (matching 'Journalists say'), and shift the earlier past event ('leaked') into the perfect infinitive ('to have leaked')."
        },
        {
            id: 13,
            tier: "Tier 3: Passive Reporting Verbs",
            orig: "People are saying that the chief executive will resign before Friday.",
            strikeHtml: "<mark class='deficit-focus'>People are saying</mark> <del class='echo-strike'>that the chief executive will resign before Friday.</del>",
            deficitNote: "ISOLATED DEFICIT: 'People are saying' -> Fixed C1/C2 reporting idiom with 'RUMOUR'.",
            tenseVoice: "TENSE: Present Continuous Report -> Idiomatic Reporting Frame ('rumour has it') | VOICE: Active Impersonal",
            formula: "Rumour has it + that-clause",
            key: "RUMOUR",
            start: "Apparently,",
            end: "that the chief executive will resign before Friday.",
            ans: ["RUMOUR", "HAS", "IT"],
            decoys: ["IS", "SAID", "THERE", "GOES"],
            splitMarks: "RUMOUR (1 mark) // HAS IT (1 mark)",
            explanation: "The fixed idiom 'rumour has it (that)...' is a classic Cambridge C1/C2 replacement for 'People are saying that...' or 'It is rumoured that...'."
        },
        {
            id: 14,
            tier: "Tier 3: Passive Reporting Verbs",
            orig: "Experts think that over three hundred files were erased during the breach.",
            strikeHtml: "<mark class='deficit-focus'>Experts think that</mark> <del class='echo-strike'>over three hundred files were erased during the breach.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Experts think that' -> Preparatory 'It' impersonal passive.",
            tenseVoice: "TENSE: Present Simple ('think') -> Preparatory 'It' Passive ('It is thought that') | VOICE: Active -> Impersonal Passive",
            formula: "It + IS THOUGHT + THAT + Finite Clause",
            key: "THOUGHT",
            start: "It",
            end: "over three hundred files were erased during the breach.",
            ans: ["IS", "THOUGHT", "THAT"],
            decoys: ["WAS", "TO", "HAVE", "BE"],
            splitMarks: "IS THOUGHT (1 mark) // THAT (1 mark)",
            explanation: "When Sentence 2 begins with preparatory 'It' and ends with a full finite clause ('over three hundred files were erased'), use 'is thought that'."
        },
        {
            id: 15,
            tier: "Tier 3: Passive Reporting Verbs",
            orig: "You were meant to encrypt the client database before leaving the office.",
            strikeHtml: "<del class='echo-strike'>You</del> <mark class='deficit-focus'>were meant to encrypt</mark> <del class='echo-strike'>the client database before leaving the office.</del>",
            deficitNote: "ISOLATED DEFICIT: 'were meant to encrypt' -> Unfulfilled past obligation with 'SUPPOSED'.",
            tenseVoice: "TENSE: Unfulfilled Past Duty ('were meant to encrypt') -> Past Expectation + Perfect Infinitive | VOICE: Passive Expectation",
            formula: "Subject + WERE SUPPOSED + TO HAVE + Past Participle",
            key: "SUPPOSED",
            start: "You",
            end: "the client database before leaving the office.",
            ans: ["WERE", "SUPPOSED", "TO", "HAVE", "ENCRYPTED"],
            decoys: ["ARE", "BEEN", "ENCRYPTING", "HAD"],
            splitMarks: "WERE SUPPOSED (1 mark) // TO HAVE ENCRYPTED (1 mark)",
            explanation: "'Were supposed to have encrypted' (or 'were supposed to encrypt') expresses a past duty that was neglected."
        },

        // TIER 4: CLEFTS & PARTICIPLE CLAUSES (Nodes 16-20)
        {
            id: 16,
            tier: "Tier 4: Clefts & Participle Clauses",
            orig: "The sheer speed of the neural network impressed the team most.",
            strikeHtml: "<del class='echo-strike'>The sheer speed of the neural network</del> <mark class='deficit-focus'>impressed the team most.</mark>",
            deficitNote: "ISOLATED DEFICIT: 'impressed the team most' -> Fronted Wh-cleft subject clause.",
            tenseVoice: "TENSE: Past Simple ('impressed') -> Wh-Cleft Nominal Clause ('What impressed the team most') | VOICE: Active -> Wh-Cleft",
            formula: "WHAT + Clause + BE + Focused Noun Phrase",
            key: "WHAT",
            start: "Ultimately,",
            end: "was the sheer speed of the neural network.",
            ans: ["WHAT", "IMPRESSED", "THE", "TEAM", "MOST"],
            decoys: ["THAT", "WHICH", "IMPRESSING", "IT"],
            splitMarks: "WHAT IMPRESSED (1 mark) // THE TEAM MOST (1 mark)",
            explanation: "A Wh-cleft turns 'impressed the team most' into a nominal subject clause ('What impressed the team most'), throwing emphasis onto the complement after 'was'."
        },
        {
            id: 17,
            tier: "Tier 4: Clefts & Participle Clauses",
            orig: "We only noticed the corrupted sector when we ran the diagnostic scan.",
            strikeHtml: "<del class='echo-strike'>We</del> <mark class='deficit-focus'>only</mark> <del class='echo-strike'>noticed the corrupted sector</del> <mark class='deficit-focus'>when we ran</mark> <del class='echo-strike'>the diagnostic scan.</del>",
            deficitNote: "ISOLATED DEFICIT: 'only ... when we ran' -> 'It-cleft' time emphasis with 'not until'.",
            tenseVoice: "TENSE: Past Simple ('ran') -> It-Cleft Time Focus ('It was not until we ran') | VOICE: Active -> It-Cleft",
            formula: "It was not until + Time Clause + that + Main Clause",
            key: "UNTIL",
            start: "It",
            end: "the diagnostic scan that we noticed the corrupted sector.",
            ans: ["WAS", "NOT", "UNTIL", "WE", "RAN"],
            decoys: ["ONLY", "WHEN", "DID", "HAD"],
            splitMarks: "WAS NOT UNTIL (1 mark) // WE RAN (1 mark)",
            explanation: "Unlike 'Not until' at the start of a sentence, 'It was not until + clause + that...' is a cleft structure and does NOT invert the verb."
        },
        {
            id: 18,
            tier: "Tier 4: Clefts & Participle Clauses",
            orig: "Because she had never used the terminal before, Clara asked for instructions.",
            strikeHtml: "<mark class='deficit-focus'>Because she had never used</mark> <del class='echo-strike'>the terminal before, Clara asked for instructions.</del>",
            deficitNote: "ISOLATED DEFICIT: 'Because she had never used' -> Negative Perfect Participle clause.",
            tenseVoice: "TENSE: Past Perfect Reason ('had never used') -> Perfect Participle ('never having used') | VOICE: Active Participle Clause",
            formula: "NEVER + HAVING + Past Participle",
            key: "HAVING",
            start: "Clara,",
            end: "the terminal before, asked for instructions.",
            ans: ["NEVER", "HAVING", "USED"],
            decoys: ["HAD", "NOT", "USING", "BEEN"],
            splitMarks: "NEVER HAVING (1 mark) // USED (1 mark)",
            explanation: "When one action happened (or never happened) before the main past verb, compress 'Because she had never used' into a perfect participle clause: 'never having used'."
        },
        {
            id: 19,
            tier: "Tier 4: Clefts & Participle Clauses",
            orig: "The power grid failed, and consequently all unsaved data was lost.",
            strikeHtml: "<del class='echo-strike'>The power grid failed,</del> <mark class='deficit-focus'>and consequently</mark> <del class='echo-strike'>all unsaved data was lost.</del>",
            deficitNote: "ISOLATED DEFICIT: 'and consequently' -> Prepositional result frame ('with the result that').",
            tenseVoice: "TENSE: Coordinate Clause -> Subordinated Result Clause ('with the result that') | VOICE: Passive Result Preserved",
            formula: ", with + THE RESULT THAT + Finite Clause",
            key: "RESULT",
            start: "The power grid failed, with",
            end: "all unsaved data was lost.",
            ans: ["THE", "RESULT", "THAT"],
            decoys: ["A", "CONSEQUENCE", "OF", "WHICH"],
            splitMarks: "THE RESULT (1 mark) // THAT (1 mark)",
            explanation: "Because 'all unsaved data was lost' is a full finite clause (not a gerund), follow 'with' by 'the result that' (whereas 'with the result of' would require a noun/-ing)."
        },
        {
            id: 20,
            tier: "Tier 4: Clefts & Participle Clauses",
            orig: "Liam didn't cause the server outage; the outdated router did.",
            strikeHtml: "<mark class='deficit-focus'>Liam didn't cause</mark> <del class='echo-strike'>the server outage; the outdated router</del> <mark class='deficit-focus'>did.</mark>",
            deficitNote: "ISOLATED DEFICIT: 'Liam didn't cause' -> Possessive noun cleft ('not Liam's fault that').",
            tenseVoice: "TENSE: Past Simple Negation -> It-Cleft Noun Complement ('It was not Liam's fault that') | VOICE: Active",
            formula: "It was not + Possessive + FAULT + THAT + Clause",
            key: "FAULT",
            start: "It was",
            end: "the server outage occurred; the outdated router caused it.",
            ans: ["NOT", "LIAM'S", "FAULT", "THAT"],
            decoys: ["BY", "OF", "BECAUSE", "BLAME"],
            splitMarks: "NOT LIAM'S FAULT (1 mark) // THAT (1 mark)",
            explanation: "Use 'It was not [someone's] fault that + clause' to shift from a verb ('didn't cause') to a cleft noun structure."
        },

        // TIER 5: ADVANCED CONDITIONALS & PREPOSITIONAL NOUNS (Nodes 21-25)
        {
            id: 21,
            tier: "Tier 5: Advanced Conditionals & Prepositional Nouns",
            orig: "She only passed the security audit because you helped her.",
            strikeHtml: "<del class='echo-strike'>She</del> <mark class='deficit-focus'>only</mark> <del class='echo-strike'>passed the security audit</del> <mark class='deficit-focus'>because you helped her.</mark>",
            deficitNote: "ISOLATED DEFICIT: 'only ... because you helped her' -> Inverted 3rd conditional + nominalisation.",
            tenseVoice: "TENSE: Past Counterfactual -> Inverted 3rd Conditional ('Had it not been for your help') | VOICE: Verbal -> Nominalised",
            formula: "Had + IT NOT BEEN FOR + Noun Phrase",
            key: "NOT",
            start: "Had",
            end: "she would not have passed the security audit.",
            ans: ["IT", "NOT", "BEEN", "FOR", "YOUR", "HELP"],
            decoys: ["YOU", "HELPED", "HER", "HAVE"],
            splitMarks: "IT NOT BEEN (1 mark) // FOR YOUR HELP (1 mark)",
            explanation: "'Had it not been for + noun phrase' inverts 'If it had not been for' and converts the verb clause 'you helped her' into the noun phrase 'your help'."
        },
        {
            id: 22,
            tier: "Tier 5: Advanced Conditionals & Prepositional Nouns",
            orig: "He is learning Python because he wants to automate his daily reports.",
            strikeHtml: "<del class='echo-strike'>He is learning Python</del> <mark class='deficit-focus'>because he wants to automate</mark> <del class='echo-strike'>his daily reports.</del>",
            deficitNote: "ISOLATED DEFICIT: 'because he wants to automate' -> Prepositional purpose phrase + gerund.",
            tenseVoice: "TENSE: Purpose Infinitive ('to automate') -> Prepositional Gerund ('with a view to automating') | VOICE: Active -> Active",
            formula: "with a view to + Verb-ING",
            key: "VIEW",
            start: "He is learning Python",
            end: "his daily reports.",
            ans: ["WITH", "A", "VIEW", "TO", "AUTOMATING"],
            decoys: ["AUTOMATE", "FOR", "THE", "IN"],
            splitMarks: "WITH A VIEW TO (1 mark) // AUTOMATING (1 mark)",
            explanation: "In 'with a view to', the word 'to' is a preposition, not an infinitive marker. Therefore, the following verb MUST take the -ing form ('automating')."
        },
        {
            id: 23,
            tier: "Tier 5: Advanced Conditionals & Prepositional Nouns",
            orig: "If the engineer hadn't intervened quickly, the server would have overheated.",
            strikeHtml: "<mark class='deficit-focus'>If the engineer hadn't intervened</mark> <del class='echo-strike'>quickly, the server would have overheated.</del>",
            deficitNote: "ISOLATED DEFICIT: 'If the engineer hadn't intervened' -> 'but for' + possessive noun phrase.",
            tenseVoice: "TENSE: 3rd Conditional ('hadn't intervened') -> Prepositional Counterfactual ('but for the engineer's') | VOICE: Verbal -> Nominalised",
            formula: "but for + Possessive Noun Phrase",
            key: "BUT",
            start: "The server would have overheated",
            end: "quick intervention.",
            ans: ["BUT", "FOR", "THE", "ENGINEER'S"],
            decoys: ["WITHOUT", "NOT", "IF", "HAD"],
            splitMarks: "BUT FOR (1 mark) // THE ENGINEER'S (1 mark)",
            explanation: "'But for + noun phrase' means 'if it had not been for'. Notice how the adverb+verb ('intervened quickly') becomes 'the engineer's quick intervention'."
        },
        {
            id: 24,
            tier: "Tier 5: Advanced Conditionals & Prepositional Nouns",
            orig: "I definitely won't renew my subscription at that inflated price.",
            strikeHtml: "<del class='echo-strike'>I</del> <mark class='deficit-focus'>definitely won't renew</mark> <del class='echo-strike'>my subscription at that inflated price.</del>",
            deficitNote: "ISOLATED DEFICIT: 'definitely won't renew' -> Noun 'intention' + dependent preposition 'of' + gerund.",
            tenseVoice: "TENSE: Future Refusal ('won't renew') -> Present Nominalised Refusal ('have no intention of renewing') | VOICE: Active",
            formula: "have no intention of + Verb-ING",
            key: "INTENTION",
            start: "I",
            end: "my subscription at that inflated price.",
            ans: ["HAVE", "NO", "INTENTION", "OF", "RENEWING"],
            decoys: ["TO", "RENEW", "NOT", "ANY"],
            splitMarks: "HAVE NO INTENTION (1 mark) // OF RENEWING (1 mark)",
            explanation: "Transform emphatic 'won't + verb' into 'have no intention of + -ing'. Never follow 'no intention' with an infinitive in formal Cambridge transformations when 'of' is available."
        },
        {
            id: 25,
            tier: "Tier 5: Advanced Conditionals & Prepositional Nouns",
            orig: "If there is a security breach, disconnect the main terminal immediately.",
            strikeHtml: "<mark class='deficit-focus'>If there is</mark> <del class='echo-strike'>a security breach, disconnect the main terminal immediately.</del>",
            deficitNote: "ISOLATED DEFICIT: 'If there is' -> Formal prepositional conditional phrase.",
            tenseVoice: "TENSE: 1st Conditional ('If there is') -> Prepositional Condition ('in the event of') | VOICE: Clause -> Prepositional Phrase",
            formula: "in the event of + Noun Phrase",
            key: "EVENT",
            start: "Disconnect the main terminal immediately",
            end: "a security breach.",
            ans: ["IN", "THE", "EVENT", "OF"],
            decoys: ["CASE", "THAT", "IF", "ON"],
            splitMarks: "IN THE EVENT (1 mark) // OF (1 mark)",
            explanation: "'In the event of + noun phrase' replaces 'If there is + noun phrase' in formal instructions and protocols."
        }
    ];

    // --- Elements ---
    const startModal = document.getElementById('intro-screen');
    const endModal = document.getElementById('end-screen');
    const startBtn = document.getElementById('btn-start');
    const restartBtn = document.getElementById('btn-restart');
    const nameInput = document.getElementById('player-name');
    const emailInput = document.getElementById('player-email');
    const tierFilterSelect = document.getElementById('tier-filter-select');
    const introModeTimedBtn = document.getElementById('intro-mode-timed');
    const introModeUntimedBtn = document.getElementById('intro-mode-untimed');

    const origSentenceEl = document.getElementById('original-sentence');
    const nodeIdLabelEl = document.getElementById('node-id-label');
    const currentTierBadgeEl = document.getElementById('current-tier-badge');
    const keyWordEl = document.getElementById('key-word');
    const startEl = document.getElementById('sent-start');
    const endEl = document.getElementById('sent-end');
    const slotsEl = document.getElementById('slot-container');
    const poolEl = document.getElementById('fragments-pool');

    const strikeEchoesBtn = document.getElementById('btn-strike-echoes');
    const tenseVoiceBtn = document.getElementById('btn-tense-voice');
    const step1Banner = document.getElementById('step1-deficit-banner');
    const step2Banner = document.getElementById('step2-tense-banner');

    const fragmentCounterPill = document.getElementById('fragment-counter');
    const fragCountValEl = document.getElementById('frag-count-val');
    const keyIntegrityGuardPill = document.getElementById('key-integrity-guard');
    const keyGuardValEl = document.getElementById('key-guard-val');

    const clearSlotsBtn = document.getElementById('btn-clear-slots');
    const revealModelBtn = document.getElementById('btn-reveal-model');
    const cambridgeModelLog = document.getElementById('cambridge-model-log');
    const modelFullSentenceEl = document.getElementById('model-full-sentence');
    const modelSplitMarksEl = document.getElementById('model-split-marks');
    const modelFormulaEl = document.getElementById('model-formula-code') || document.getElementById('model-formula');
    const modelExplanationEl = document.getElementById('model-explanation');

    const execBtn = document.getElementById('btn-execute');
    const nextNodeBtn = document.getElementById('btn-next-node');
    const scoreEl = document.getElementById('score-display');
    const totalNodesEl = document.getElementById('total-nodes-display');
    const timeEl = document.getElementById('time-display');
    const timerStatWrap = document.getElementById('timer-stat-wrap');
    const modeToggleBtn = document.getElementById('btn-mode-toggle');
    const modeLabelEl = document.getElementById('mode-label');

    const openDrawerBtn = document.getElementById('btn-open-drawer');
    const closeDrawerBtn = document.getElementById('btn-close-drawer');
    const nodeDrawer = document.getElementById('node-drawer');
    const nodeDrawerList = document.getElementById('node-drawer-list');

    // --- State ---
    let queue = [];
    let currentPuzzle = null;
    let score = 0;
    let solvedIds = new Set();
    let isUntimedMode = false;
    let timeRemaining = 120; // 02:00 Trace Timer
    let timerInterval = null;
    let currentGuess = [];
    let isEchoStruck = false;
    let isTenseShown = false;

    // --- Mode Selection in Intro ---
    if (introModeTimedBtn && introModeUntimedBtn) {
        introModeTimedBtn.addEventListener('click', () => {
            isUntimedMode = false;
            introModeTimedBtn.classList.add('active');
            introModeUntimedBtn.classList.remove('active');
        });
        introModeUntimedBtn.addEventListener('click', () => {
            isUntimedMode = true;
            introModeUntimedBtn.classList.add('active');
            introModeTimedBtn.classList.remove('active');
        });
    }

    // --- Live Mode Toggle in Header ---
    if (modeToggleBtn) {
        modeToggleBtn.addEventListener('click', () => {
            isUntimedMode = !isUntimedMode;
            syncTimerMode();
        });
    }

    function syncTimerMode() {
        clearInterval(timerInterval);
        if (isUntimedMode) {
            if (modeLabelEl) modeLabelEl.textContent = 'UNTIMED LAB';
            if (timeEl) {
                timeEl.textContent = 'PAUSED (LAB)';
                timeEl.style.color = 'var(--cyan)';
            }
        } else {
            if (modeLabelEl) modeLabelEl.textContent = 'TIMED (02:00)';
            if (timeRemaining <= 0) timeRemaining = 120;
            updateHud();
            timerInterval = setInterval(() => {
                timeRemaining--;
                updateHud();
                if (timeRemaining <= 0) endGame(false);
            }, 1000);
        }
    }

    // --- Node Selector Drawer ---
    function renderNodeDrawer() {
        if (!nodeDrawerList) return;
        nodeDrawerList.innerHTML = '';
        const tiers = [
            "Tier 1: Negative Inversions",
            "Tier 2: Unreal Past & Subjunctive",
            "Tier 3: Passive Reporting Verbs",
            "Tier 4: Clefts & Participle Clauses",
            "Tier 5: Advanced Conditionals & Prepositional Nouns"
        ];

        tiers.forEach(tierName => {
            const groupDiv = document.createElement('div');
            const titleEl = document.createElement('div');
            titleEl.className = 'tier-group-title';
            titleEl.textContent = '> ' + tierName.toUpperCase();
            groupDiv.appendChild(titleEl);

            allPuzzles.filter(p => p.tier === tierName).forEach(puzzle => {
                const btn = document.createElement('button');
                btn.type = 'button';
                let cls = 'drawer-node-btn';
                if (currentPuzzle && currentPuzzle.id === puzzle.id) cls += ' active-node';
                if (solvedIds.has(puzzle.id)) cls += ' solved-node';
                btn.className = cls;

                const statusTag = solvedIds.has(puzzle.id) ? '[DECRYPTED]' : `[KEY: ${puzzle.key}]`;
                btn.innerHTML = `<span>#${String(puzzle.id).padStart(2, '0')} ${puzzle.orig.slice(0, 38)}...</span><span>${statusTag}</span>`;
                btn.addEventListener('click', () => {
                    loadPuzzle(puzzle);
                    closeDrawer();
                });
                groupDiv.appendChild(btn);
            });

            nodeDrawerList.appendChild(groupDiv);
        });
    }

    function openDrawer() {
        if (!nodeDrawer) return;
        renderNodeDrawer();
        nodeDrawer.classList.add('open');
        nodeDrawer.setAttribute('aria-hidden', 'false');
    }

    function closeDrawer() {
        if (!nodeDrawer) return;
        nodeDrawer.classList.remove('open');
        nodeDrawer.setAttribute('aria-hidden', 'true');
    }

    if (openDrawerBtn) openDrawerBtn.addEventListener('click', openDrawer);
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', closeDrawer);

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
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    function formatTime(sec) {
        const safeSec = Math.max(0, sec);
        const m = Math.floor(safeSec / 60);
        const s = safeSec % 60;
        return (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
    }

    function startGame() {
        const selectedTier = tierFilterSelect ? tierFilterSelect.value : 'ALL';
        const filtered = selectedTier === 'ALL'
            ? [...allPuzzles]
            : allPuzzles.filter(p => p.tier === selectedTier);

        queue = isUntimedMode ? [...filtered] : shuffle([...filtered]);
        score = 0;
        solvedIds.clear();
        timeRemaining = 120; // 02:00 Trace Timer

        if (totalNodesEl) totalNodesEl.textContent = String(queue.length);
        syncTimerMode();
        updateHud();
        loadNext();
    }

    function updateHud() {
        if (scoreEl) scoreEl.textContent = String(score);
        if (!isUntimedMode && timeEl) {
            timeEl.textContent = formatTime(timeRemaining);
            if (timeRemaining < 30) timeEl.style.color = 'var(--danger)';
            else timeEl.style.color = 'var(--neon)';
        }
    }

    function loadNext() {
        if (queue.length === 0) {
            endGame(true);
            return;
        }
        const nextPuzzle = queue.shift();
        loadPuzzle(nextPuzzle);
    }

    function loadPuzzle(puzzle) {
        currentPuzzle = puzzle;
        currentGuess = [];
        isEchoStruck = false;
        isTenseShown = false;

        if (nodeIdLabelEl) nodeIdLabelEl.textContent = `NODE #${String(puzzle.id).padStart(2, '0')} //`;
        if (currentTierBadgeEl) currentTierBadgeEl.textContent = puzzle.tier.toUpperCase();
        origSentenceEl.textContent = "> " + puzzle.orig;
        keyWordEl.textContent = puzzle.key;
        startEl.textContent = puzzle.start;
        endEl.textContent = puzzle.end;

        if (strikeEchoesBtn) strikeEchoesBtn.classList.remove('active');
        if (tenseVoiceBtn) tenseVoiceBtn.classList.remove('active');
        if (step1Banner) {
            step1Banner.classList.add('hidden');
            step1Banner.textContent = '';
        }
        if (step2Banner) {
            step2Banner.classList.add('hidden');
            step2Banner.textContent = '';
        }
        if (cambridgeModelLog) {
            cambridgeModelLog.classList.add('hidden');
        }

        buildSlotsAndPool();
        updateGuards();

        execBtn.className = 'execute-btn';
        execBtn.textContent = '> EXECUTE DECRYPTION';
    }

    function buildSlotsAndPool() {
        slotsEl.innerHTML = '';
        poolEl.innerHTML = '';
        if (!currentPuzzle) return;

        const fragments = shuffle([...currentPuzzle.ans, ...currentPuzzle.decoys]);
        fragments.forEach((frag, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'fragment';
            btn.textContent = frag;
            btn.dataset.id = String(idx);
            btn.onclick = () => moveToSlot(frag, idx, btn);
            poolEl.appendChild(btn);
        });
    }

    function moveToSlot(word, id, origBtn) {
        origBtn.classList.add('used');

        const slotBtn = document.createElement('button');
        slotBtn.type = 'button';
        slotBtn.className = 'fragment';
        slotBtn.textContent = word;
        slotBtn.onclick = () => {
            slotBtn.remove();
            origBtn.classList.remove('used');
            updateGuessArray();
        };
        slotsEl.appendChild(slotBtn);
        updateGuessArray();
    }

    function updateGuessArray() {
        currentGuess = Array.from(slotsEl.children).map(el => el.textContent);
        updateGuards();
    }

    // --- Live Fragment Counter (3-6 Words Required) & Bypass Key Integrity Guard ---
    function updateGuards() {
        const count = currentGuess.length;
        if (fragCountValEl) fragCountValEl.textContent = String(count);

        if (fragmentCounterPill) {
            fragmentCounterPill.classList.remove('guard-ok', 'guard-warn', 'guard-err');
            if (count === 0) {
                fragmentCounterPill.classList.add('guard-warn');
            } else if (count >= 3 && count <= 6) {
                fragmentCounterPill.classList.add('guard-ok');
            } else {
                fragmentCounterPill.classList.add('guard-err');
            }
        }

        if (currentPuzzle && keyIntegrityGuardPill && keyGuardValEl) {
            const hasExactKey = currentGuess.includes(currentPuzzle.key);
            keyIntegrityGuardPill.classList.remove('guard-ok', 'guard-warn', 'guard-err');
            if (hasExactKey) {
                keyIntegrityGuardPill.classList.add('guard-ok');
                keyGuardValEl.textContent = `VERIFIED [${currentPuzzle.key}]`;
            } else {
                keyIntegrityGuardPill.classList.add(count > 0 ? 'guard-err' : 'guard-warn');
                keyGuardValEl.textContent = `MISSING [${currentPuzzle.key}]`;
            }
        }
    }

    // --- Gareth's 4-Step Deconstruction Terminal Controls ---
    if (strikeEchoesBtn) {
        strikeEchoesBtn.addEventListener('click', () => {
            if (!currentPuzzle) return;
            isEchoStruck = !isEchoStruck;
            strikeEchoesBtn.classList.toggle('active', isEchoStruck);
            if (isEchoStruck) {
                origSentenceEl.innerHTML = "&gt; " + currentPuzzle.strikeHtml;
                if (step1Banner) {
                    step1Banner.textContent = "> [STEP 1 ECHO STRIKE]: " + currentPuzzle.deficitNote;
                    step1Banner.classList.remove('hidden');
                }
            } else {
                origSentenceEl.textContent = "> " + currentPuzzle.orig;
                if (step1Banner) step1Banner.classList.add('hidden');
            }
        });
    }

    if (tenseVoiceBtn) {
        tenseVoiceBtn.addEventListener('click', () => {
            if (!currentPuzzle) return;
            isTenseShown = !isTenseShown;
            tenseVoiceBtn.classList.toggle('active', isTenseShown);
            if (step2Banner) {
                if (isTenseShown) {
                    step2Banner.textContent = "> [STEP 2/3 SCAN]: " + currentPuzzle.tenseVoice + " // PATTERN: " + currentPuzzle.formula;
                    step2Banner.classList.remove('hidden');
                } else {
                    step2Banner.classList.add('hidden');
                }
            }
        });
    }

    if (clearSlotsBtn) {
        clearSlotsBtn.addEventListener('click', () => {
            currentGuess = [];
            slotsEl.innerHTML = '';
            Array.from(poolEl.children).forEach(btn => btn.classList.remove('used'));
            updateGuards();
        });
    }

    function showCambridgeModelLog() {
        if (!currentPuzzle || !cambridgeModelLog) return;
        const fullAns = `${currentPuzzle.start} ${currentPuzzle.ans.join(' ')} ${currentPuzzle.end}`;
        if (modelFullSentenceEl) modelFullSentenceEl.textContent = fullAns;
        if (modelSplitMarksEl) modelSplitMarksEl.textContent = currentPuzzle.splitMarks;
        if (modelFormulaEl) modelFormulaEl.textContent = currentPuzzle.formula;
        if (modelExplanationEl) modelExplanationEl.textContent = currentPuzzle.explanation;
        cambridgeModelLog.classList.remove('hidden');
    }

    if (revealModelBtn) {
        revealModelBtn.addEventListener('click', () => {
            if (!cambridgeModelLog) return;
            if (cambridgeModelLog.classList.contains('hidden')) {
                showCambridgeModelLog();
            } else {
                cambridgeModelLog.classList.add('hidden');
            }
        });
    }

    if (nextNodeBtn) {
        nextNodeBtn.addEventListener('click', () => {
            loadNext();
        });
    }

    execBtn.addEventListener('click', () => {
        if (!currentPuzzle) return;

        const guessStr = currentGuess.join(' ');
        const ansStr = currentPuzzle.ans.join(' ');
        const hasKey = currentGuess.includes(currentPuzzle.key);
        const validCount = currentGuess.length >= 3 && currentGuess.length <= 6;

        if (guessStr === ansStr) {
            execBtn.className = 'execute-btn success';
            execBtn.textContent = '> DECRYPTION SUCCESSFUL (2/2 MARKS)';
            if (!solvedIds.has(currentPuzzle.id)) {
                solvedIds.add(currentPuzzle.id);
                score++;
            }
            if (!isUntimedMode) {
                timeRemaining = Math.min(180, timeRemaining + 12); // +12s time bonus per node
            }
            updateHud();
            showCambridgeModelLog();
            if (!isUntimedMode) {
                setTimeout(loadNext, 1400);
            }
        } else {
            execBtn.className = 'execute-btn error';
            if (!hasKey) {
                execBtn.textContent = `> ERROR: BYPASS KEY [${currentPuzzle.key}] MISSING`;
            } else if (!validCount) {
                execBtn.textContent = `> ERROR: ${currentGuess.length} WORDS (3-6 REQUIRED)`;
            } else {
                execBtn.textContent = '> SYNTAX ERROR: SEQUENCE REJECTED';
            }
            setTimeout(() => {
                execBtn.className = 'execute-btn';
                execBtn.textContent = '> EXECUTE DECRYPTION';
            }, 1300);
        }
    });

    function endGame(won) {
        clearInterval(timerInterval);

        const title = document.getElementById('end-title');
        const desc = document.getElementById('end-desc');
        const total = totalNodesEl ? totalNodesEl.textContent : '25';

        if (won) {
            title.textContent = "> SYSTEM OVERRIDDEN";
            title.style.color = "var(--neon)";
            desc.textContent = "> FIREWALL BYPASSED. All selected Cambridge C1/C2 syntactical nodes decrypted. Upload your logs to claim a 1-to-1 trial diagnostic.";
        } else {
            title.textContent = "> CONNECTION TRACED";
            title.style.color = "var(--danger)";
            desc.textContent = "> TRACE TIMER EXPIRED. Switch to Untimed Training Lab to inspect each Cambridge C1/C2 node with Gareth's 4-Step Deconstruction tools.";
        }

        document.getElementById('final-score').textContent = `${score}/${total}`;
        document.getElementById('lead-score').value = `Syntax Hacker - Score: ${score}/${total}`;
        if (emailInput) {
            document.getElementById('lead-email').value = emailInput.value.trim();
        }

        endModal.classList.add('open');
    }

})();
