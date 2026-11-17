/* ==========================================================
   Between the Lines: C1/C2 Subtext & Surgical Politeness
   Curriculum, Daily Seed, Duel Codec & Editorial Self-Test
   Exposes window.SUBTEXT_DATA (and CommonJS module.exports)
   ========================================================== */
(function (root) {
    'use strict';

    const acts = [
        {
            act: 1,
            id: 'act1',
            shortTitle: 'Understatement',
            title: 'Act I · British Understatement & Litotes',
            cefr: 'B2+ / C1',
            description: 'Spot polite shields, faint praise, and double negatives, then reply without sounding blunt.'
        },
        {
            act: 2,
            id: 'act2',
            shortTitle: 'Diplomacy',
            title: 'Act II · Diplomatic Stonewalling & Press Briefings',
            cefr: 'C1',
            description: 'Read passive reporting shields, modal past distancing, and fronted negative denials.'
        },
        {
            act: 3,
            id: 'act3',
            shortTitle: 'Peer Review',
            title: 'Act III · Academic & Peer-Review Knives',
            cefr: 'C1 / C2',
            description: 'Isolate concessive pivots, negative inversions, and diagnostic clefts in scholarly critique.'
        },
        {
            act: 4,
            id: 'act4',
            shortTitle: 'Verbal Fencing',
            title: 'Act IV · Tarmac & High-Stakes Verbal Fencing',
            cefr: 'C2',
            description: 'Cut through institutional bluster with inverted conditionals, contrastive clefts, and icy courtesy.'
        }
    ];

    const allExchanges = [
        /* ===== ACT 1: BRITISH UNDERSTATEMENT & LITOTES (s1a..s1f) ===== */
        {
            id: 's1a',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'B2+',
            title: '1. The Friday Rebrand',
            context: 'A senior partner responds to a consultant pitching an overnight overhaul of a ten-year client newsletter.',
            speakerA: {
                name: 'Brand Consultant',
                line: 'If we scrap the newsletter tonight and switch entirely to thirty-second dance clips, renewals will double by Monday.'
            },
            speakerB: {
                name: 'Managing Partner',
                segments: [
                    'With the greatest respect,',
                    'such an abrupt pivot',
                    'would carry',
                    'considerable risk',
                    'for our existing clients.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Prepositional Polite Shield ('With the greatest respect')",
                wrongSpanHint: 'Look at the opening prepositional phrase that conventionally signals a firm disagreement is about to land.'
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The partner strongly disagrees and is bracing the consultant for a polite refusal.',
                    explanation: "In British professional exchange, 'With the greatest respect' almost always precedes a blunt rejection wrapped in courtesy."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The partner deeply admires the consultant and plans to approve the video switch tonight.',
                    explanation: 'Literal trap: taking the respectful opener at face value misses its standard warning signal.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The partner is ending the consulting contract immediately and calling legal.',
                    explanation: 'Overread trap: the tone signals firm pushback on this proposal, not immediate termination.'
                }
            ],
            bluntPrompt: 'That idea makes no sense for what regular readers expect.',
            replyBefore: 'I am',
            replyAfter: 'this shift matches what our regular readers expect.',
            targetTokens: ['not', 'entirely', 'convinced', 'that'],
            distractorTokens: ['completely', 'disagreeing', 'about'],
            formula: 'Subject + BE + not entirely convinced that + Clause',
            modelNote: "Litotes ('not entirely convinced') lets me reject a weak pitch calmly. Cambridge examiners prefer understated negation over blunt adjectives like 'wrong' or 'useless'.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's1b',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'B2+',
            title: '2. Cutting Compliance',
            context: 'A junior analyst proposes halving the compliance desk two weeks before an annual inspection.',
            speakerA: {
                name: 'Junior Analyst',
                line: 'Halving compliance headcount before next Tuesday will trim three hundred thousand pounds off overheads immediately.'
            },
            speakerB: {
                name: 'Finance Chair',
                segments: [
                    'That is certainly',
                    'a brave proposal',
                    'to bring before',
                    'the audit committee',
                    'this week.'
                ],
                scalpelIndex: 1,
                scalpelDevice: "Ironic Adjective ('a brave proposal')",
                wrongSpanHint: 'Focus on the two-word noun phrase praising apparent courage rather than the committee time phrase.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The chair applauds the analyst’s courage and expects the committee to pass the cuts.',
                    explanation: "Literal trap: outside heroic rescues, calling an office plan 'brave' rarely means admirable."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The chair views the proposal as naive, dangerous, and politically reckless ahead of an audit.',
                    explanation: "Spot on: 'brave' in British understatement gently translates to 'reckless enough to end your week badly'."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The chair suspects the analyst has already leaked private ledgers to regulators.',
                    explanation: 'Overread trap: the remark mocks poor judgement, not unlawful conduct.'
                }
            ],
            bluntPrompt: 'Cutting checks before an audit would be a complete disaster.',
            replyBefore: 'Trimming oversight before an audit',
            replyAfter: 'given the scrutiny expected next month.',
            targetTokens: ['would', 'seem', 'unwise'],
            distractorTokens: ['is', 'totally', 'unwisely'],
            formula: 'Gerund Subject + would seem + Adjective',
            modelNote: "Pairing 'would seem' with a restrained adjective ('unwise') turns panic into measured judgement. In C1 speaking, quiet restraint carries far more weight than dramatic exaggeration.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's1c',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'C1',
            title: '3. The First Literature Draft',
            context: 'A doctoral supervisor reads a messy first literature review chapter that wanders away from the thesis.',
            speakerA: {
                name: 'Doctoral Candidate',
                line: 'The citations still need tidying, yet I think my opening thirty pages cover the whole field.'
            },
            speakerB: {
                name: 'Supervisor',
                segments: [
                    'Your summary',
                    'of the early studies',
                    'is not entirely unhelpful,',
                    'though the central argument',
                    'still eludes me.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Double-Negative Litotes ('not entirely unhelpful')",
                wrongSpanHint: 'Spot the double-negative phrase that damns the draft with very faint praise.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The chapter is thorough and nearly ready for external examiners.',
                    explanation: "Literal trap: 'not entirely unhelpful' stops far short of calling a draft good."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The supervisor wants the candidate to withdraw from the doctorate.',
                    explanation: 'Overread trap: the critique points to a missing thesis thread, not expulsion.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The background notes have slight value, yet the chapter lacks a clear guiding argument.',
                    explanation: 'Double negation here strips out praise cleanly while telling the writer to tighten the focus.'
                }
            ],
            bluntPrompt: 'Your opening chapter misses the actual research question.',
            replyBefore: '',
            replyAfter: 'a sharper link back to your central question.',
            targetTokens: ['What', 'this', 'draft', 'lacks', 'is'],
            distractorTokens: ['That', 'needs', 'are'],
            formula: 'What + Noun Phrase + lacks + BE (singular) + Noun Phrase',
            modelNote: "A Wh-cleft ('What this draft lacks is...') isolates the missing piece constructively while keeping the singular verb 'is' anchored to the cleft clause.",
            dossierCategory: 'cleft_clauses'
        },
        {
            id: 's1d',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'B2+',
            title: '4. Overtime at the Podium',
            context: 'An external examiner reacts to a mock presentation that ran five minutes past the bell.',
            speakerA: {
                name: 'Candidate',
                line: 'Did the pacing work all right for the panel, do you reckon?'
            },
            speakerB: {
                name: 'External Examiner',
                segments: [
                    'The opening section',
                    'was quite promising,',
                    'provided you trim',
                    'the middle slides',
                    'by half.'
                ],
                scalpelIndex: 1,
                scalpelDevice: "Downtoned Praise ('quite promising')",
                wrongSpanHint: "Look at the tempered praise phrase using 'quite'—paired with a gradable adjective, it signals mild disappointment."
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The start showed potential, yet the talk as a whole fell noticeably short on focus and timing.',
                    explanation: "In British feedback, 'quite promising' followed by a heavy cut request means only the opening held together."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The examiner found the full talk crisp and tightly timed.',
                    explanation: 'Literal trap: asking to cut half the middle slides contradicts full approval.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The examiner thinks the candidate has already failed the oral exam.',
                    explanation: 'Overread trap: the feedback is actionable coaching, not a final fail notice.'
                }
            ],
            bluntPrompt: 'You talked for far too long in the middle.',
            replyBefore: 'You might find the middle section',
            replyAfter: 'so your closing conclusion lands on time.',
            targetTokens: ['benefits', 'from', 'tighter', 'editing'],
            distractorTokens: ['is', 'needing', 'shorter'],
            formula: "Modal Hedging ('You might find') + Clause ('benefits from' + Noun Phrase)",
            modelNote: "Saying a section 'benefits from tighter editing' critiques the structure rather than the speaker, which keeps feedback calm and practical.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's1e',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'C1',
            title: '5. The Monday Timetable',
            context: 'A newly appointed headteacher hears a governor insist that every Year 9 class begin translating Virgil on Monday.',
            speakerA: {
                name: 'School Governor',
                line: 'Surely you can put every Year 9 group onto Latin hexameters first thing Monday morning?'
            },
            speakerB: {
                name: 'Headteacher',
                segments: [
                    'Thank you',
                    'for raising that point;',
                    'I will certainly bear it in mind',
                    'once timetable planning',
                    'reopens next autumn.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Polite Shelf Idiom ('bear it in mind')",
                wrongSpanHint: 'Find the polite promise idiom that quietly parks the request without agreeing to carry it out.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The headteacher plans to write new Latin timetables over the weekend.',
                    explanation: "Literal trap: 'bear it in mind' paired with 'next autumn' politely kills the Monday deadline."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The headteacher is shelving an impractical demand courteously without making any promise.',
                    explanation: "Classic British deflection: acknowledge the suggestion warmly, then place it safely on an indefinite shelf."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The headteacher intends to resign before Monday morning.',
                    explanation: 'Overread trap: nothing in the reply hints at resignation.'
                }
            ],
            bluntPrompt: 'Nobody can possibly change the timetable before Monday.',
            replyBefore: 'It would be',
            replyAfter: 'changes to the syllabus before next term.',
            targetTokens: ['unrealistic', 'to', 'expect', 'immediate'],
            distractorTokens: ['impossible', 'for', 'demanding'],
            formula: "Preparatory 'It' + would be + Adjective + to-infinitive",
            modelNote: "Preparatory 'It would be unrealistic to expect...' shifts a personal refusal onto practical timing, keeping authority intact without friction.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's1f',
            act: 1,
            actTitle: acts[0].title,
            cefr: 'C1',
            title: '6. Ten-Day Planning Permission',
            context: 'A property developer expects council approval within ten days for a twelve-storey riverside block.',
            speakerA: {
                name: 'Developer',
                line: 'If your studio uploads the drawings tonight, the planning office will stamp them by Friday week.'
            },
            speakerB: {
                name: 'Lead Architect',
                segments: [
                    'That schedule',
                    'strikes me',
                    'as somewhat ambitious',
                    'given how slowly',
                    'planning appeals move.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Adverbial Downtoner ('somewhat ambitious')",
                wrongSpanHint: "Pick the understated adjective phrase translating 'completely unrealistic' into calm professional English."
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The architect believes the developer is bribing planning officers.',
                    explanation: 'Overread trap: the comment points to statutory bottlenecks, not corruption.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The architect admires the developer’s energy and backs the Friday deadline.',
                    explanation: "Literal trap: 'somewhat ambitious' here means 'impossible under actual council rules'."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The architect considers the ten-day deadline completely unrealistic.',
                    explanation: "'Somewhat + positive adjective' is a staple C1 understatement for dismissing wishful thinking gently."
                }
            ],
            bluntPrompt: 'Council consultation rules are the real reason this cannot happen in ten days.',
            replyBefore: '',
            replyAfter: 'that prevents any approval inside ten days.',
            targetTokens: ['It', 'is', 'the', 'statutory', 'consultation'],
            distractorTokens: ['There', 'are', 'delaying'],
            formula: 'It + is + Focused Noun Phrase + that + Verb Clause',
            modelNote: 'An It-cleft spotlights the statutory consultation as the true obstacle, keeping the refusal grounded in public procedure rather than personal reluctance.',
            dossierCategory: 'cleft_clauses'
        },

        /* ===== ACT 2: DIPLOMATIC STONEWALLING & PRESS BRIEFINGS (s2a..s2f) ===== */
        {
            id: 's2a',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '7. Morning Signalling Failure',
            context: 'A transport spokesperson faces cameras after three commuter rail lines stall during the morning rush.',
            speakerA: {
                name: 'Reporter',
                line: 'Will you confirm right now that last year’s maintenance cuts caused this morning’s signalling collapse?'
            },
            speakerB: {
                name: 'Transport Spokesperson',
                segments: [
                    'While inquiries remain active,',
                    'it would be premature to speculate',
                    'on any single cause',
                    'until engineers examine',
                    'the relay logs.'
                ],
                scalpelIndex: 1,
                scalpelDevice: "Preparatory 'It' Shield ('premature to speculate')",
                wrongSpanHint: "Look for the preparatory 'it' phrase used to deflect a yes/no accusation without answering it."
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The spokesperson refuses to concede blame before a formal report compels an answer.',
                    explanation: "'It would be premature to speculate' is the standard C1 press shield for buying time and avoiding an on-record admission."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'No engineers have reached the site yet and nothing can be guessed.',
                    explanation: 'Literal trap: technical staff may already suspect the cause, yet the brief bans public admission.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The spokesperson is admitting the maintenance cuts broke the signals.',
                    explanation: 'Overread trap: the phrase avoids any admission rather than making one.'
                }
            ],
            bluntPrompt: 'Do not guess who is to blame until inspectors read the actual records.',
            replyBefore: 'It remains',
            replyAfter: 'firm conclusions before the full inspection concludes.',
            targetTokens: ['too', 'early', 'to', 'draw'],
            distractorTokens: ['much', 'prematurely', 'drawing'],
            formula: 'It remains + too + Adjective + to-infinitive + Object',
            modelNote: "Pairing 'It remains too early to draw' with 'firm conclusions' models classic C1 impersonal restraint: clear, formal, and impossible to misquote.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's2b',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '8. The Misdirected Letters',
            context: 'A hospital trust chair answers questions after clinic letters were posted to outdated addresses.',
            speakerA: {
                name: 'Health Correspondent',
                line: 'Did your records office fail to verify the updated postal register before printing four thousand letters?'
            },
            speakerB: {
                name: 'Trust Chair',
                segments: [
                    'Clearly,',
                    'mistakes appear to have been made',
                    'during the database handover,',
                    'and steps are underway',
                    'to update the register.'
                ],
                scalpelIndex: 1,
                scalpelDevice: "Agentless Passive + Perfect Infinitive ('appear to have been made')",
                wrongSpanHint: 'Spot the classic agentless passive clause that admits an error happened without naming who caused it.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Nobody in the office handled the mailing; the error happened spontaneously.',
                    explanation: 'Literal trap: passive verbs remove the agent from grammar, not from real life.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The chair is blaming the journalist for misreading the register.',
                    explanation: 'Overread trap: the chair concedes an internal error occurred while keeping responsibility impersonal.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The chair acknowledges an error occurred while shielding individual staff from direct blame.',
                    explanation: "Pairing 'appear' with a passive perfect infinitive softens responsibility into an abstract event."
                }
            ],
            bluntPrompt: 'People say the data team skipped the final check last week.',
            replyBefore: 'The final verification check',
            replyAfter: "during Friday's scheduled server migration.",
            targetTokens: ['appears', 'to', 'have', 'been', 'omitted'],
            distractorTokens: ['seems', 'being', 'skipped'],
            formula: 'Subject + appears/is thought + to have been + Past Participle',
            modelNote: "Passive reporting plus a perfect passive infinitive ('appears to have been omitted') reports a past mistake in formal C1 register without pointing fingers.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's2c',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '9. Three Hours Past Deadline',
            context: 'A senior civil servant responds to a committee memo delivered three hours after the statutory deadline.',
            speakerA: {
                name: 'Committee Clerk',
                line: 'The briefing pack went out just after four; surely that still counts as timely notice?'
            },
            speakerB: {
                name: 'Senior Official',
                segments: [
                    'Given the scale',
                    'of the procurement review,',
                    'one might have hoped for',
                    'rather clearer oversight',
                    'ahead of the vote.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Impersonal Modal Past Rebuke ('one might have hoped for')",
                wrongSpanHint: "Isolate the impersonal 'one + modal perfect' phrase that turns irritation into icy institutional disappointment."
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The official is cancelling the entire procurement contract tonight.',
                    explanation: 'Overread trap: the rebuke targets sloppy preparation, not contract cancellation.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The official is delivering a cold, formal rebuke over a late and inadequate briefing.',
                    explanation: "'One might have hoped for' replaces an angry accusation with effortless C1/C2 institutional weight."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The official feels mildly cheerful that future memos may arrive around four.',
                    explanation: "Literal trap: modal perfect 'might have hoped' expresses sharp disappointment, not cheer."
                }
            ],
            bluntPrompt: 'You really should have warned everyone much earlier.',
            replyBefore: 'One might',
            replyAfter: 'notification before the afternoon session convened.',
            targetTokens: ['reasonably', 'have', 'expected', 'earlier'],
            distractorTokens: ['probably', 'had', 'expecting'],
            formula: 'One + might + Adverb + have + Past Participle + Noun Phrase',
            modelNote: "Impersonal 'One might reasonably have expected...' replaces an accusatory 'you should have' with composed C1/C2 authority.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's2d',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '10. Closed-Door Tariffs',
            context: 'A trade negotiator answers rumours that sensitive agricultural tariffs were traded away during dinner.',
            speakerA: {
                name: 'Delegate',
                line: 'Growers are hearing that quiet tariff cuts were offered during Tuesday’s bilateral dinner.'
            },
            speakerB: {
                name: 'Chief Negotiator',
                segments: [
                    'Let me be unequivocal:',
                    'at no stage was',
                    'any tariff concession',
                    'placed on the table',
                    'during these talks.'
                ],
                scalpelIndex: 1,
                scalpelDevice: "Fronted Negative Inversion ('at no stage was')",
                wrongSpanHint: 'Identify the fronted negative time phrase plus inverted auxiliary that establishes a categorical denial.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Tariff cuts were raised only after dinner, not during the meal itself.',
                    explanation: "Literal trap: 'at no stage' paired with 'during these talks' covers the whole summit."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The negotiator issues a formal, airtight denial covering the entire summit.',
                    explanation: 'Fronting a negative time adverbial forces subject-auxiliary inversion and creates unmistakable legalistic finality.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The negotiator is walking out of the trade summit permanently.',
                    explanation: 'Overread trap: a firm denial is not a threat to abandon negotiations.'
                }
            ],
            bluntPrompt: 'Nobody ever agreed to relax safety rules at any point.',
            replyBefore: '',
            replyAfter: 'consent to relax existing inspection standards.',
            targetTokens: ['At', 'no', 'point', 'did', 'anyone'],
            distractorTokens: ['Never', 'were', 'had'],
            formula: 'At no point / At no stage + Auxiliary (did/was) + Subject + Base Verb',
            modelNote: "Fronting 'At no point' triggers strict subject-auxiliary inversion ('did anyone consent') and carries immediate formal clarity.",
            dossierCategory: 'inversion'
        },
        {
            id: 's2e',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '11. Six Hours, No Communique',
            context: 'An ambassador speaks to reporters after a six-hour border summit ends without a signed joint statement.',
            speakerA: {
                name: 'Correspondent',
                line: 'Was the afternoon session basically deadlocked from the first hour?'
            },
            speakerB: {
                name: 'Ambassador',
                segments: [
                    'The exchange of views',
                    'was frank,',
                    'and the border dossier',
                    'remains not without its complexities',
                    "ahead of next month's talks."
                ],
                scalpelIndex: 3,
                scalpelDevice: "Diplomatic Litotes ('not without its complexities')",
                wrongSpanHint: 'Choose the double-negative diplomatic phrase that signals serious friction without admitting collapse.'
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The summit hit serious disagreements and stalled, though formal contact stays alive.',
                    explanation: "In diplomatic English, 'frank' plus 'not without its complexities' translates cleanly to 'heated and deadlocked'."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Everything went smoothly apart from one minor formatting detail.',
                    explanation: 'Literal trap: understated diplomatic language hides deep friction, not clerical trivia.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The ambassador is announcing an immediate border closure.',
                    explanation: 'Overread trap: noting next month’s talks shows channels remain open.'
                }
            ],
            bluntPrompt: 'Outside observers have no idea how delicate these talks really are.',
            replyBefore: '',
            replyAfter: 'how finely balanced the border clause remains.',
            targetTokens: ['Little', 'do', 'outside', 'observers', 'realise'],
            distractorTokens: ['Few', 'did', 'realising'],
            formula: 'Little + Auxiliary (do/did) + Subject + Base Verb + Clause',
            modelNote: "Opening with 'Little do...' followed by 'realise' (British -ise) adds quiet insider weight without breaking diplomatic restraint.",
            dossierCategory: 'inversion'
        },
        {
            id: 's2f',
            act: 2,
            actTitle: acts[1].title,
            cefr: 'C1',
            title: '12. The Vanishing Bill',
            context: 'A minister is pressed on why a flagship housing bill disappeared from this quarter’s parliamentary timetable.',
            speakerA: {
                name: 'Opposition MP',
                line: 'Have you quietly buried the housing bill because your own backbenchers refused to vote for it?'
            },
            speakerB: {
                name: 'Housing Minister',
                segments: [
                    'The draft legislation',
                    'has not been abandoned;',
                    'it simply remains',
                    'subject to further consultation',
                    'with regional councils.'
                ],
                scalpelIndex: 3,
                scalpelDevice: "Procedural Deferral ('subject to further consultation')",
                wrongSpanHint: 'Spot the bureaucratic deferral phrase that shelves a controversial bill indefinitely without conceding defeat.'
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The minister is resigning tonight to trigger a snap election.',
                    explanation: 'Overread trap: delaying a bill buys time rather than forcing an election.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Regional councils asked to speed up the vote so it passes this week.',
                    explanation: "Literal trap: 'subject to further consultation' signals delay, not acceleration."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The bill is quietly stalled indefinitely to spare the government an embarrassing defeat.',
                    explanation: 'Procedural phrasing keeps the door nominally open while taking the bill off the live calendar.'
                }
            ],
            bluntPrompt: 'The revised timetable will only appear once all regional councils agree.',
            replyBefore: '',
            replyAfter: 'will the revised timetable be laid before Parliament.',
            targetTokens: ['Only', 'once', 'regional', 'councils', 'agree'],
            distractorTokens: ['Until', 'will', 'agreed'],
            formula: 'Only once + Subordinate Clause + Auxiliary (will) + Subject + Base Verb',
            modelNote: "With 'Only once...', keep standard order inside the time clause ('regional councils agree') and invert only the main clause ('will the revised timetable be laid').",
            dossierCategory: 'inversion'
        },

        /* ===== ACT 3: ACADEMIC & PEER-REVIEW KNIVES (s3a..s3f) ===== */
        {
            id: 's3a',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C1',
            title: '13. Fourteen Undergraduates',
            context: 'A peer reviewer evaluates a paper claiming one smartphone app can cure urban loneliness nationwide.',
            speakerA: {
                name: 'Journal Editor',
                line: 'Can this manuscript move straight into the autumn issue as submitted?'
            },
            speakerB: {
                name: 'Peer Reviewer',
                segments: [
                    "While the authors' ambition is commendable,",
                    'the sample size',
                    'of fourteen undergraduates',
                    'hardly supports',
                    'a universal policy claim.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Concessive Setup ('While the authors' ambition is commendable,')",
                wrongSpanHint: "Find the polite concessive opening clause whose only job is to cushion the sharp rejection that follows."
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The reviewer gives brief credit to intent solely to sharpen a dismissal of the evidence.',
                    explanation: "In peer review, praising an author's 'ambition' inside a 'While...' clause almost always precedes a fatal methodological strike."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The reviewer warmly recommends publishing the study untouched in autumn.',
                    explanation: "Literal trap: the main clause states the data 'hardly supports' the claim."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The reviewer accuses the authors of fabricating participant interviews.',
                    explanation: 'Overread trap: fourteen participants is a statistical scope problem, not fraud.'
                }
            ],
            bluntPrompt: 'Your sample is far too small to prove a broad rule.',
            replyBefore: 'What undermines',
            replyAfter: 'the unusually narrow student sample.',
            targetTokens: ['this', 'broad', 'conclusion', 'is'],
            distractorTokens: ['these', 'claiming', 'are'],
            formula: 'What + Transitive Verb + Noun Phrase + BE (singular) + Focused Cause',
            modelNote: "A diagnostic Wh-cleft ('What undermines this broad conclusion is...') names the methodological flaw crisply without turning personal.",
            dossierCategory: 'cleft_clauses'
        },
        {
            id: 's3b',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C2',
            title: '14. The Sweeping Thesis',
            context: 'A medieval historian reviews a bestselling book blaming one county tax for toppling three European kingdoms.',
            speakerA: {
                name: 'Radio Host',
                line: 'Did you find the book’s central thesis persuasive as serious history?'
            },
            speakerB: {
                name: 'Historian',
                segments: [
                    'Seldom has such a sweeping claim',
                    'rested on',
                    'so slender a foundation',
                    'of surviving',
                    'parish records.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Negative Inversion Knife ('Seldom has such a sweeping claim')",
                wrongSpanHint: "Click the inverted opening clause where 'Seldom' pulls 'has' before the subject for crisp academic sting."
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The historian notes the author carefully avoids sweeping generalisations.',
                    explanation: "Literal trap: 'Seldom has...' inverts to emphasise how extreme and unsupported this claim is."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The historian argues no parish records survive from that century.',
                    explanation: 'Overread trap: the problem is building a huge claim on narrow evidence.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The book advances an extravagant thesis backed by almost no primary proof.',
                    explanation: "Pairing 'Seldom has...' with 'so slender a foundation' delivers surgical scholarly demolition without shouting."
                }
            ],
            bluntPrompt: 'I have almost never seen such a selective use of historical sources.',
            replyBefore: '',
            replyAfter: 'a selective reading of the archival evidence.',
            targetTokens: ['Rarely', 'have', 'I', 'encountered', 'such'],
            distractorTokens: ['Seldom', 'did', 'encountering'],
            formula: 'Rarely / Seldom + have + Subject + Past Participle + such + Noun Phrase',
            modelNote: "Notice how 'Rarely have I encountered...' keeps first-person scholarly composure while landing an unmistakable critical verdict.",
            dossierCategory: 'inversion'
        },
        {
            id: 's3c',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C1',
            title: '15. Empty High Streets',
            context: 'An urban economist responds to a think-tank brief blaming home working alone for empty town-centre shops.',
            speakerA: {
                name: 'Think-Tank Fellow',
                line: 'Our chart shows beyond doubt that remote working alone emptied the high street.'
            },
            speakerB: {
                name: 'Urban Economist',
                segments: [
                    'Your chart tracks footfall neatly;',
                    'yet',
                    'what the analysis overlooks is',
                    'the simultaneous tripling',
                    'of commercial business rates.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Diagnostic Wh-Cleft ('what the analysis overlooks is')",
                wrongSpanHint: 'Select the Wh-cleft pivot that steers attention straight onto the omitted variable.'
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The economist dismisses footfall data as fabricated nonsense.',
                    explanation: 'Overread trap: the opening clause explicitly credits the chart for tracking footfall.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The report tracks one real trend while missing a decisive confounding factor.',
                    explanation: 'A Wh-cleft lets you grant half the argument first and then aim the spotlight straight at the blind spot.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The economist agrees remote work is the sole cause of shop closures.',
                    explanation: 'Literal trap: missing a tripled tax cost overturns the single-cause claim.'
                }
            ],
            bluntPrompt: 'You completely ignored rising rents when writing this report.',
            replyBefore: '',
            replyAfter: 'account for is the sharp rise in commercial rents.',
            targetTokens: ['What', 'the', 'report', 'fails', 'to'],
            distractorTokens: ['Which', 'forgets', 'for'],
            formula: 'What + Subject + fails to + Base Verb + BE + Focused Noun Phrase',
            modelNote: "Combining a Wh-cleft with 'fails to account for' gives incisive C1/C2 essay prose focused cleanly on evidence rather than motive.",
            dossierCategory: 'cleft_clauses'
        },
        {
            id: 's3d',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C1',
            title: '16. Twelve-Person Pilot',
            context: 'A clinical statistician reviews an unblinded twelve-person supplement trial funded by the seller.',
            speakerA: {
                name: 'Sponsor Representative',
                line: 'Since twelve volunteers felt livelier after fortnight two, can the leaflet call it clinically proven?'
            },
            speakerB: {
                name: 'Biostatistician',
                segments: [
                    'Participants reported mild improvement,',
                    'yet',
                    'it remains doubtful whether',
                    'an unblinded twelve-person pilot',
                    'meets clinical standards.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Preparatory 'It' Scepticism ('it remains doubtful whether')",
                wrongSpanHint: "Isolate the impersonal preparatory-'it' frame that expresses calm scientific doubt."
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Twelve participants are sufficient to print a clinical proof label.',
                    explanation: "Literal trap: 'remains doubtful whether' firmly rejects the adequacy of the pilot."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The pilot design is far too weak to justify any claim of clinical proof.',
                    explanation: 'Impersonal academic hedging delivers a decisive methodological veto without emotional language.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The statistician warns the supplement is toxic and must be recalled.',
                    explanation: 'Overread trap: the critique concerns weak trial evidence, not toxicity.'
                }
            ],
            bluntPrompt: 'I doubt this small poll proves anything about national opinion.',
            replyBefore: '',
            replyAfter: 'self-selected poll can represent national opinion.',
            targetTokens: ['It', 'remains', 'doubtful', 'whether', 'a'],
            distractorTokens: ['There', 'stays', 'if'],
            formula: 'It remains doubtful whether + Clause',
            modelNote: "In formal Cambridge writing, 'It remains doubtful whether...' (preferred over 'if') signals disciplined scepticism without sounding dismissive.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's3e',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C2',
            title: '17. The Chilly Letters',
            context: 'A literary critic assesses a biography claiming two bitter lifelong rivals remained affectionate friends.',
            speakerA: {
                name: 'Biographer',
                line: 'I chose to read their terse final letters as warm teasing between old friends.'
            },
            speakerB: {
                name: 'Literary Critic',
                segments: [
                    'Your reading',
                    'of those letters',
                    'is perhaps more charitable',
                    'than the surviving correspondence',
                    'strictly warrants.'
                ],
                scalpelIndex: 2,
                scalpelDevice: "Comparative Understatement ('more charitable')",
                wrongSpanHint: 'Spot the comparative adjective phrase that gently exposes wishful thinking.'
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The critic accuses the biographer of forging archival correspondence.',
                    explanation: 'Overread trap: the criticism targets rosy interpretation, not forgery.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The critic congratulates the biographer for generous historical insight.',
                    explanation: "Literal trap: calling an interpretation 'more charitable than evidence warrants' means 'unsupported'."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The biographer is glossing over clear hostility that the actual letters reveal.',
                    explanation: "Praising someone's 'charity' toward weak evidence is classic C2 critical irony."
                }
            ],
            bluntPrompt: 'Your summary is too soft and ignores three factual errors in section three.',
            replyBefore: 'That verdict',
            replyAfter: 'the factual slips noted in section three.',
            targetTokens: ['may', 'be', 'rather', 'generous', 'given'],
            distractorTokens: ['is', 'too', 'because'],
            formula: "Subject + may be + Downtoner ('rather') + Positive Adjective + given + Evidence",
            modelNote: "Describing an overly lenient claim as 'rather generous given...' uses polite irony to expose an evidential gap.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's3f',
            act: 3,
            actTitle: acts[2].title,
            cefr: 'C2',
            title: '18. The Missing Wind Lulls',
            context: 'An energy researcher reviews a grid forecast that leaves out winter wind lulls and storage losses.',
            speakerA: {
                name: 'Policy Adviser',
                line: 'Even if one minor input shifts slightly, the core projection holds steady.'
            },
            speakerB: {
                name: 'Energy Analyst',
                segments: [
                    'Not only does the model fail',
                    'to price grid storage losses,',
                    'but it also omits',
                    'seven-day winter',
                    'wind lulls altogether.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Fronted 'Not only' Inversion ('Not only does the model fail')",
                wrongSpanHint: "Look at the opening 'Not only + auxiliary + subject' clause that turns a single objection into a double blow."
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The forecast has two compounding omissions that undermine its reassuring claim.',
                    explanation: "Fronted 'Not only' inversion pairs two distinct defects into one authoritative rebuttal."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The model misses only minor rounding fees and captures winter weather accurately.',
                    explanation: "Literal trap: omitting week-long winter wind lulls invalidates the forecast's safety margin."
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The analyst opposes clean power projects on ideological grounds.',
                    explanation: 'Overread trap: the objection is purely technical modelling rigour.'
                }
            ],
            bluntPrompt: 'This method misses maintenance costs and also mixes up two regions.',
            replyBefore: '',
            replyAfter: 'overlook maintenance costs, but it also conflates two regions.',
            targetTokens: ['Not', 'only', 'does', 'this', 'method'],
            distractorTokens: ['Never', 'do', 'methods'],
            formula: 'Not only + does/do/did + Subject + Base Verb..., but + Subject + also...',
            modelNote: "Pairing 'Not only does this method...' with 'but it also...' is one of the cleanest C1/C2 tools for stacking two criticisms into one balanced sentence.",
            dossierCategory: 'inversion'
        },

        /* ===== ACT 4: TARMAC & HIGH-STAKES VERBAL FENCING (s4a..s4f) ===== */
        {
            id: 's4a',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '19. Ten Past Nine on Page Four',
            context: 'After an inquiry hearing, an official denies ever seeing an emergency memo before midnight.',
            speakerA: {
                name: 'Deputy Director',
                line: 'Nobody in my office ever laid eyes on an urgent alert before midnight—I am quite certain of that.'
            },
            speakerB: {
                name: 'Senior Inspector',
                segments: [
                    'Far be it from me',
                    'to question your recollection,',
                    'yet your own timestamped signature',
                    'appears on page four',
                    'at ten past nine.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Subjunctive Disclaimer ('Far be it from me')",
                wrongSpanHint: 'Select the formal subjunctive disclaimer that feigns deference right before dropping documentary proof.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The inspector genuinely trusts the director’s memory over the signed log.',
                    explanation: "Literal trap: 'Far be it from me' announces an imminent contradiction, never agreement."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The inspector uses ice-cold courtesy to expose a direct, documented contradiction.',
                    explanation: 'Fossilised subjunctive deference makes the timestamped proof twice as cutting.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The inspector concedes page four may belong to an unrelated file.',
                    explanation: 'Overread trap: naming the exact page and timestamp leaves zero ambiguity.'
                }
            ],
            bluntPrompt: 'I do not want to call you a liar, yet the signed receipt proves you got it.',
            replyBefore: 'Far be it from me',
            replyAfter: ', yet the signed delivery log records otherwise.',
            targetTokens: ['to', 'doubt', 'your', 'recollection'],
            distractorTokens: ['for', 'doubting', 'memory'],
            formula: 'Far be it from me + to + Base Verb + Noun Phrase, yet + Evidence',
            modelNote: "The fossilised subjunctive 'Far be it from me to doubt...' keeps immaculate composure while letting written proof speak for itself.",
            dossierCategory: 'register_shift'
        },
        {
            id: 's4b',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '20. Under Sworn Questioning',
            context: 'A board chair speaks quietly with a chief executive planning to blame a junior engineer before tomorrow’s inquiry.',
            speakerA: {
                name: 'Chief Executive',
                line: 'If I tell the panel the configuration error sat purely with junior staff, the board stays clear.'
            },
            speakerB: {
                name: 'Board Chair',
                segments: [
                    'Were I in your position,',
                    'I might pause',
                    'before repeating that line',
                    'under sworn questioning',
                    'tomorrow morning.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Inverted Subjunctive Conditional ('Were I in your position,')",
                wrongSpanHint: "Identify the inverted conditional opener ('Were I...') that turns polite advice into quiet steel."
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The board chair is offering to swap job titles with the chief executive.',
                    explanation: 'Overread trap: the conditional idiom gives a stark warning, not a career offer.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The chair thinks blaming junior staff is a safe, clever plan.',
                    explanation: "Literal trap: warning someone to pause before swearing an alibi means the alibi will break."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The chair delivers a calm warning that shifting blame will fail badly under oath.',
                    explanation: "Inverted subjunctive 'Were I...' projects cool, decisive authority without raising a voice."
                }
            ],
            bluntPrompt: 'If I were you, I would check the July emails before testifying.',
            replyBefore: '',
            replyAfter: ', I might review the July correspondence before testifying.',
            targetTokens: ['Were', 'I', 'in', 'your', 'place'],
            distractorTokens: ['Was', 'If', 'shoes'],
            formula: 'Were + Subject + in + Possessive + place/position, Subject + might + Base Verb',
            modelNote: "Inverted conditionals always require 'Were', never 'Was', and dropping 'if' lifts spoken advice into poised C2 register.",
            dossierCategory: 'inversion'
        },
        {
            id: 's4c',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '21. Midnight Correction',
            context: 'A treasury auditor faces a department head whose press release overstated savings by forty million pounds.',
            speakerA: {
                name: 'Department Head',
                line: 'The spreadsheet slip was tiny; surely nobody outside Whitehall will spot it?'
            },
            speakerB: {
                name: 'Treasury Auditor',
                segments: [
                    'Had those figures been checked beforehand,',
                    'nobody would now',
                    'be drafting',
                    'an emergency correction',
                    'at midnight.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Inverted Third Conditional ('Had those figures been checked beforehand,')",
                wrongSpanHint: 'Spot the inverted past conditional clause that links an avoidable lapse straight to the midnight crisis.'
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The auditor pins an avoidable midnight crisis directly on sloppy checking beforehand.',
                    explanation: "Fronting 'Had...' without 'if' ties a past failure cleanly to present fallout in one tight mixed conditional."
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The auditor agrees the error is minor and can wait until next month.',
                    explanation: 'Literal trap: drafting a midnight correction proves the error is severe and urgent.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The auditor is asking for extra overtime pay to rewrite spreadsheets.',
                    explanation: 'Overread trap: the focus is accountability for negligent publication, not pay.'
                }
            ],
            bluntPrompt: 'If someone had checked those figures earlier, this late retraction would not be needed.',
            replyBefore: '',
            replyAfter: ', this late retraction would not be necessary.',
            targetTokens: ['Had', 'those', 'figures', 'been', 'checked', 'beforehand'],
            distractorTokens: ['If', 'was', 'checking'],
            formula: 'Had + Subject + been + Past Participle, Subject + would (not) + Base Verb',
            modelNote: "Dropping 'if' and opening with 'Had those figures been checked beforehand...' delivers classic C2 mixed-conditional precision.",
            dossierCategory: 'inversion'
        },
        {
            id: 's4d',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '22. Goodwill vs Disclosure',
            context: 'Senior counsel questions a director who keeps citing good intentions despite failing to declare a conflicting stake.',
            speakerA: {
                name: 'Board Witness',
                line: 'Every colleague knows my devotion to this charity; I only ever meant well.'
            },
            speakerB: {
                name: 'Senior Counsel',
                segments: [
                    'It is not your goodwill',
                    'that is in question,',
                    'but your failure',
                    'to disclose',
                    'a conflicting shareholding.'
                ],
                scalpelIndex: 0,
                scalpelDevice: "Contrastive It-Cleft ('It is not your goodwill')",
                wrongSpanHint: 'Click the negated It-cleft opener that sets character aside to pin down the exact breach.'
            },
            meanings: [
                {
                    kind: 'literal',
                    correct: false,
                    text: 'Counsel accepts the witness’s goodwill and closes the inquiry.',
                    explanation: 'Literal trap: conceding goodwill is simply clearing away an irrelevant excuse.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'Counsel says character references are the sole issue before the hearing.',
                    explanation: "Overread trap: the 'but...' clause moves straight to undisclosed shares."
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'Counsel brushes aside appeals to motive to isolate an undeniable breach of rules.',
                    explanation: "A contrastive cleft ('It is not X that..., but Y') neutralises emotional deflection calmly."
                }
            ],
            bluntPrompt: 'Nobody cares how hard you tried; the real issue is the missing release.',
            replyBefore: 'It is not',
            replyAfter: ', but the absence of a countersigned release.',
            targetTokens: ['your', 'effort', 'that', 'concerns', 'me'],
            distractorTokens: ['about', 'which', 'concern'],
            formula: 'It is not + Focus A + that + Verb..., but + Focus B',
            modelNote: "The contrastive It-cleft grants effort on the surface while pinning full scrutiny on the missing legal document.",
            dossierCategory: 'cleft_clauses'
        },
        {
            id: 's4e',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '23. Initials on the Sub-Ledger',
            context: 'At a cross-examination, a chief clerk denies seeing off-books bank transfers, though his own initials appear on the sheet.',
            speakerA: {
                name: 'Chief Clerk',
                line: 'I delegated routine banking to deputies; I never once laid eyes on that sub-ledger.'
            },
            speakerB: {
                name: 'Tribunal Chair',
                segments: [
                    'I appreciate how busy',
                    'your office was,',
                    'yet',
                    'did you initial the transfer ledger yourself',
                    'on the fourth of November?'
                ],
                scalpelIndex: 3,
                scalpelDevice: "Surgical Counter-Question ('did you initial the transfer ledger yourself')",
                wrongSpanHint: 'Choose the pointed yes/no counter-question that cuts straight through a vague alibi.'
            },
            meanings: [
                {
                    kind: 'correct',
                    correct: true,
                    text: 'The chair narrows the hearing to one concrete physical act that forces a binding admission.',
                    explanation: 'When a witness hides behind broad delegation claims, a tight factual yes/no question closes the escape route.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The chair is making polite conversation about clerical stationery.',
                    explanation: 'Literal trap: citing an exact ledger and date is cross-examination steel, not small talk.'
                },
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The chair agrees the deputies forged the clerk’s initials.',
                    explanation: 'Overread trap: the question tests whether the clerk signed personally.'
                }
            ],
            bluntPrompt: 'Stop dodging and tell the panel who authorised that payment.',
            replyBefore: '',
            replyAfter: 'a direct answer on who authorised that payment.',
            targetTokens: ['What', 'the', 'panel', 'needs', 'is'],
            distractorTokens: ['That', 'want', 'are'],
            formula: 'What + Subject + needs + BE (singular) + Noun Phrase',
            modelNote: "Note 'authorised' (British -ise) inside a calm Wh-cleft: instead of snapping 'Stop dodging!', I state clearly what the record still lacks.",
            dossierCategory: 'cleft_clauses'
        },
        {
            id: 's4f',
            act: 4,
            actTitle: acts[3].title,
            cefr: 'C2',
            title: '24. Frost at the Reception',
            context: 'Leaving a strained bilateral meeting, a patronising minister tries to brush aside a junior envoy with light dismissal.',
            speakerA: {
                name: 'Senior Minister',
                line: 'Well, run along and enjoy the reception—try not to fret over the small print tonight.'
            },
            speakerB: {
                name: 'Junior Envoy',
                segments: [
                    'Most kind of you',
                    'to worry,',
                    'though I suspect the treaty text',
                    'will still be waiting in the morning,',
                    'Minister.'
                ],
                scalpelIndex: 3,
                scalpelDevice: "Deadpan Parting Shot ('will still be waiting in the morning,')",
                wrongSpanHint: 'Look for the calm closing reminder that refuses dismissal and leaves the dispute squarely on the table.'
            },
            meanings: [
                {
                    kind: 'overread',
                    correct: false,
                    text: 'The envoy is asking the minister for an early breakfast meeting.',
                    explanation: 'Overread trap: the parting shot refers to the unresolved treaty dispute, not dining.'
                },
                {
                    kind: 'correct',
                    correct: true,
                    text: 'With cool composure, the envoy rejects being patronised and signals the fight resumes tomorrow.',
                    explanation: 'Accepting surface kindness while pointing calmly to morning reality turns a dismissal back on the speaker.'
                },
                {
                    kind: 'literal',
                    correct: false,
                    text: 'The envoy feels relieved to forget the treaty details for good.',
                    explanation: 'Literal trap: reminding the minister the text stays intact cancels any relief.'
                }
            ],
            bluntPrompt: 'I hear your optimism, yet nobody should assume this dispute is settled before tomorrow.',
            replyBefore: 'I note your optimism; nor should',
            replyAfter: "settled before tomorrow's session reconvenes.",
            targetTokens: ['anyone', 'assume', 'this', 'matter', 'is'],
            distractorTokens: ['nobody', 'assumes', 'are'],
            formula: 'Nor + Modal Auxiliary (should/can) + Subject + Base Verb + Clause',
            modelNote: "Fronting 'nor should anyone assume...' triggers crisp C2 negative inversion ('anyone', never double-negative 'nobody') and closes an exchange with quiet steel.",
            dossierCategory: 'inversion'
        }
    ];

    /* ---------------- FAST LOOKUP ---------------- */
    const byId = Object.create(null);
    allExchanges.forEach((ex) => {
        byId[ex.id] = ex;
    });

    function findById(id) {
        if (typeof id !== 'string') return null;
        return byId[id.trim()] || null;
    }

    /* ---------------- FORMATTING & SEED HELPERS ---------------- */
    function formatReply(before, tokens, after) {
        const mid = Array.isArray(tokens) ? tokens.join(' ').trim() : '';
        const b = String(before || '').trim();
        const a = String(after || '').trim();
        let out = '';
        if (b) out += b;
        if (mid) {
            if (out) out += ' ';
            out += mid;
        }
        if (a) {
            if (out && !/^[,.;:?!)]/.test(a)) out += ' ';
            out += a;
        }
        return out.replace(/\s+/g, ' ').trim();
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
        const rng = mulberry32(hashSeed('SUBTEXT_DAILY_' + seed));
        // 5 distinct brackets strictly drawn from C1 and C2 exchanges across Acts 1-4
        const brackets = [
            ['s1c', 's1e', 's1f'],
            ['s2a', 's2b', 's2c'],
            ['s2d', 's2e', 's2f'],
            ['s3a', 's3b', 's3c', 's3d', 's3e', 's3f'],
            ['s4a', 's4b', 's4c', 's4d', 's4e', 's4f']
        ];
        const steps = brackets.map((pool, idx) => {
            const pickedId = pool[Math.floor(rng() * pool.length)];
            const ex = findById(pickedId);
            return {
                step: idx + 1,
                act: ex.act,
                id: ex.id,
                cefr: ex.cefr,
                title: ex.title,
                exchange: ex
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
        return hashSeed('SUBTEXT_DUEL_V1|' + core).toString(36).padStart(4, '0').slice(0, 4);
    }

    function buildDuelSteps(ids) {
        return ids.map((id, idx) => {
            const ex = findById(id);
            return {
                step: idx + 1,
                act: ex.act,
                id: ex.id,
                cefr: ex.cefr,
                title: ex.title,
                exchange: ex
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
        const clean = Math.max(0, Math.min(cleanIds.length, Math.round(Number(o.clean) || 0)));
        const sec = Math.max(0, Math.min(3600, Math.round(Number(o.sec) || 0)));
        const by = sanitizeBy(o.by);
        const core = `1|${cleanIds.join(',')}|${clean}|${sec}|${by}`;
        const sig = duelChecksum(core);
        return toBase64Url(`${core}|${sig}`);
    }

    function decodeDuel(raw) {
        if (typeof raw !== 'string') return null;
        const trimmed = raw.trim();
        if (!trimmed || trimmed.length > 240) return null;

        // Branch 1: Plain comma-separated shorthand (e.g. s1a,s2b,s3c,s4a,s4f)
        if (trimmed.includes(',')) {
            const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
            const cleanIds = validateDuelIds(parts);
            if (!cleanIds) return null;
            return {
                ids: cleanIds,
                steps: buildDuelSteps(cleanIds),
                clean: 0,
                sec: 0,
                by: ''
            };
        }

        // Branch 2: Signed base64url v1 token
        if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
        try {
            const decoded = fromBase64Url(trimmed);
            if (!decoded) return null;
            const fields = decoded.split('|');
            if (fields.length !== 6 || fields[0] !== '1') return null;
            const rawIds = fields[1].split(',').map((s) => s.trim()).filter(Boolean);
            const cleanIds = validateDuelIds(rawIds);
            if (!cleanIds) return null;

            const rawClean = Number(fields[2]);
            const rawSec = Number(fields[3]);
            if (!Number.isFinite(rawClean) || !Number.isFinite(rawSec)) return null;
            const clean = Math.max(0, Math.min(cleanIds.length, Math.round(rawClean)));
            const sec = Math.max(0, Math.min(3600, Math.round(rawSec)));
            const by = sanitizeBy(fields[4]);
            const sig = fields[5];
            const core = `1|${cleanIds.join(',')}|${clean}|${sec}|${by}`;
            if (sig !== duelChecksum(core)) return null;

            return {
                ids: cleanIds,
                steps: buildDuelSteps(cleanIds),
                clean,
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
            pool = allExchanges.filter((e) => e.act === 1 || e.act === 2);
        } else if (presetKey === 'act3_4') {
            pool = allExchanges.filter((e) => e.act === 3 || e.act === 4);
        } else if (presetKey === 'c2_fencing') {
            pool = allExchanges.filter((e) => e.cefr === 'C2');
        } else {
            pool = allExchanges.filter((e) => /^C[12]$/.test(e.cefr));
        }
        const copy = pool.slice();
        for (let i = copy.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = copy[i];
            copy[i] = copy[j];
            copy[j] = tmp;
        }
        const picked = copy.slice(0, 5);
        const ids = picked.map((e) => e.id);
        return {
            preset: presetKey || 'c1_random',
            ids,
            steps: buildDuelSteps(ids)
        };
    }

    /* ---------------- DATA SELF-TEST ---------------- */
    function dataTests() {
        const lines = [];
        let pass = true;
        const fail = (msg) => {
            pass = false;
            lines.push('FAIL ' + msg);
        };

        const usOrBanned = /\b(realize[ds]?|analyze[ds]?|catalog|color[eds]?|apologize[ds]?|criticize[ds]?|organize[ds]?|emphasize[ds]?|recognize[ds]?|judgment|canceled|traveling|center|behavior|favor|honor|labor|neighbor|defense|offense|practiced|practicing|gold standard|guaranteed|guarantees your score|unbreakable|locks in|supreme grammatical|pure gold|cognitive load|processing bandwidth|cantilever(?:s|ed)?|truss(?:es)?|schematic(?:s)?|throughput|depleted talent pool|fundamentally reshaped|provincial communities|Tutor\s+Cue\s*:|Teacher\s+Note\s*:|Tutor\s+Note\s*:|Teacher\s+Cue\s*:|Socratic\s+Prompt\s*:|Instructor\s+Prompt\s*:)\b/i;
        const mdAsterisk = /(?:^|[\s(])\*[A-Za-z][^*<\n]{1,60}\*(?=[\s).,!?:;]|$)/;
        const corporateWe = /\b(we|our|ours)\b/i;
        const allowedDossierCats = new Set(['register_shift', 'inversion', 'cleft_clauses']);

        if (acts.length !== 4) fail(`expected 4 acts, got ${acts.length}`);
        if (allExchanges.length !== 24) fail(`expected 24 exchanges, got ${allExchanges.length}`);

        acts.forEach((a) => {
            if (usOrBanned.test(a.title + ' ' + a.description)) fail(`act ${a.act} banned wording`);
            if (corporateWe.test(a.description)) fail(`act ${a.act} description uses corporate we/our`);
        });

        const seenIds = new Set();
        allExchanges.forEach((ex, idx) => {
            const prefix = `${ex.id || 'item#' + idx}`;
            if (!/^s[1-4][a-f]$/.test(ex.id)) fail(`${prefix} invalid ID format`);
            if (seenIds.has(ex.id)) fail(`${prefix} duplicate ID`);
            seenIds.add(ex.id);
            if (!ex.context || !ex.speakerA || !ex.speakerA.name || !ex.speakerA.line) fail(`${prefix} missing Phase 1 context/speakerA`);
            if (!ex.speakerB || !ex.speakerB.name || !Array.isArray(ex.speakerB.segments)) fail(`${prefix} missing speakerB segments`);

            const segs = ex.speakerB.segments;
            if (segs.length < 4 || segs.length > 6) fail(`${prefix} segments length ${segs.length} (must be 4-6)`);
            segs.forEach((seg, si) => {
                if (typeof seg !== 'string' || !seg.trim() || seg !== seg.trim()) {
                    fail(`${prefix} segment ${si} invalid whitespace/empty`);
                }
            });
            const joinedB = segs.join(' ');
            if (/\s{2,}/.test(joinedB) || /\s+[,.;:?!]/.test(joinedB)) {
                fail(`${prefix} non-contiguous segment join: "${joinedB}"`);
            }
            if (!Number.isInteger(ex.speakerB.scalpelIndex) || ex.speakerB.scalpelIndex < 0 || ex.speakerB.scalpelIndex >= segs.length) {
                fail(`${prefix} invalid scalpelIndex ${ex.speakerB.scalpelIndex}`);
            }
            if (!ex.speakerB.scalpelDevice || !ex.speakerB.wrongSpanHint) fail(`${prefix} missing scalpelDevice or wrongSpanHint`);

            if (!Array.isArray(ex.meanings) || ex.meanings.length !== 3) {
                fail(`${prefix} must have exactly 3 meanings`);
            } else {
                const correctCount = ex.meanings.filter((m) => m.correct === true).length;
                const kinds = new Set(ex.meanings.map((m) => m.kind));
                if (correctCount !== 1) fail(`${prefix} meanings must have exactly 1 correct (got ${correctCount})`);
                if (!kinds.has('literal') || !kinds.has('overread') || !kinds.has('correct')) {
                    fail(`${prefix} meanings must include literal, overread, and correct`);
                }
                ex.meanings.forEach((m, mi) => {
                    if (!m.text || !m.explanation) fail(`${prefix} meaning ${mi} empty text/explanation`);
                });
            }

            if (!ex.bluntPrompt || typeof ex.replyBefore !== 'string' || typeof ex.replyAfter !== 'string') {
                fail(`${prefix} missing Phase 2 framing`);
            }
            if (!Array.isArray(ex.targetTokens) || ex.targetTokens.length < 3 || ex.targetTokens.length > 6) {
                fail(`${prefix} targetTokens length ${ex.targetTokens && ex.targetTokens.length} (must be 3-6)`);
            }
            if (!Array.isArray(ex.distractorTokens) || ex.distractorTokens.length < 2 || ex.distractorTokens.length > 3) {
                fail(`${prefix} distractorTokens length (must be 2-3)`);
            }
            const tSet = new Set(ex.targetTokens.map((t) => t.toLowerCase()));
            ex.distractorTokens.forEach((d) => {
                if (tSet.has(d.toLowerCase())) fail(`${prefix} distractor "${d}" collides with targetTokens`);
            });
            const fullReply = formatReply(ex.replyBefore, ex.targetTokens, ex.replyAfter);
            if (!fullReply || /\s+[,.;:?!]/.test(fullReply) || /\s{2,}/.test(fullReply)) {
                fail(`${prefix} malformed reply: "${fullReply}"`);
            }
            if (!ex.formula || !ex.modelNote) fail(`${prefix} missing formula or modelNote`);
            if (!allowedDossierCats.has(ex.dossierCategory)) fail(`${prefix} invalid dossierCategory "${ex.dossierCategory}"`);

            // Editorial & British spelling check across every field
            const allText = [
                ex.title, ex.context, ex.speakerA.line, joinedB,
                ex.speakerB.scalpelDevice, ex.speakerB.wrongSpanHint,
                ex.bluntPrompt, fullReply, ex.formula, ex.modelNote,
                ...ex.meanings.map((m) => m.text + ' ' + m.explanation)
            ].join(' ');
            if (usOrBanned.test(allText)) {
                const hit = allText.match(usOrBanned);
                fail(`${prefix} US spelling or banned phrase: "${hit && hit[0]}"`);
            }
            if (mdAsterisk.test(allText)) fail(`${prefix} unrendered markdown asterisk`);

            const editorialOnly = [
                ex.speakerB.wrongSpanHint,
                ex.modelNote,
                ...ex.meanings.map((m) => m.explanation)
            ].join(' ');
            if (corporateWe.test(editorialOnly)) {
                const hitWe = editorialOnly.match(corporateWe);
                fail(`${prefix} corporate we/our in editorial note: "${hitWe && hitWe[0]}"`);
            }
        });

        // findById checks
        if (!findById('s1a') || !findById('s4f') || findById('s9z') !== null) {
            fail('findById lookup check failed');
        }

        // dailyGauntlet checks
        const dg1 = dailyGauntlet('2026-11-17');
        const dg2 = dailyGauntlet('2026-11-17');
        const dg3 = dailyGauntlet('2026-11-18');
        const dgKey = (g) => g.steps.map((s) => s.id).join(',');
        if (dg1.steps.length !== 5 || dgKey(dg1) !== dgKey(dg2) || dgKey(dg1) === dgKey(dg3) ||
            new Set(dg1.steps.map((s) => s.id)).size !== 5 ||
            dg1.steps.some((s) => !/^C[12]$/.test(s.cefr))) {
            fail('dailyGauntlet determinism / C1-C2 check failed');
        }

        // encodeDuel / decodeDuel checks
        const duelTok = encodeDuel({ ids: ['s1c', 's2b', 's3b', 's4a', 's4f'], clean: 4, sec: 63, by: '<script>Gareth!' });
        if (!duelTok) fail('encodeDuel failed to produce token');
        const decoded = decodeDuel(duelTok);
        if (!decoded || decoded.ids.join(',') !== 's1c,s2b,s3b,s4a,s4f' ||
            decoded.clean !== 4 || decoded.sec !== 63 || decoded.by !== 'scriptGareth' ||
            decoded.steps.length !== 5) {
            fail('decodeDuel round-trip failed');
        }
        const tampered = duelTok.slice(0, -1) + (duelTok.slice(-1) === 'A' ? 'B' : 'A');
        if (decodeDuel(tampered) !== null) fail('decodeDuel accepted tampered checksum');
        if (decodeDuel('s1a,s2b,s3c,s4a') === null) fail('decodeDuel rejected valid comma shorthand');
        if (decodeDuel('s1a,s1a,s2b') !== null) fail('decodeDuel accepted duplicate IDs');
        if (decodeDuel('s1a,s2b') !== null) fail('decodeDuel accepted <3 IDs');
        if (decodeDuel('s1a,s2b,s3c,s4a,s4b,s4c') !== null) fail('decodeDuel accepted >5 IDs');
        if (decodeDuel('s1a,s9z,s2b') !== null) fail('decodeDuel accepted unknown ID');
        if (encodeDuel({ ids: ['s1a', 's2b'] }) !== '') fail('encodeDuel accepted <3 IDs');

        lines.push(`(a) validated ${allExchanges.length} exchanges across ${acts.length} acts (Phase 1 segments + Phase 2 3-6 word forge)`);
        lines.push(`(b) British spelling, Gareth voice & zero banned phrases verified across all 24 items`);
        lines.push(`(c) dailyGauntlet('2026-11-17') -> [${dgKey(dg1)}]`);
        lines.push(`(d) encodeDuel / decodeDuel + comma shorthand + tamper checks passed`);
        return { pass, lines };
    }

    const api = {
        version: 1,
        acts,
        allExchanges,
        findById,
        formatReply,
        getTodaySeed,
        dailyGauntlet,
        encodeDuel,
        decodeDuel,
        duelPreset,
        dataTests
    };

    root.SUBTEXT_DATA = api;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
