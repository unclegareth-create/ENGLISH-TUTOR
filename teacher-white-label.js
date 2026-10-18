/**
 * ============================================================================
 * GarethEnglish.com — Commercial Teacher Classroom & White-Label Studio Runtime
 * ----------------------------------------------------------------------------
 * Powers the B2B / B2B2C Licensing Engine across all 25 interactive
 * modules, games, exam builders, Dark Academia literature units, and compendium:
 *
 * 1. Open Core + Gated Pro Extension Architecture:
 *    - Stages 1–3 remain open for student self-practice, SEO indexing, and
 *      Gareth Montgomery's 1-to-1 trial funnel.
 *    - Stages 4–5 (Pro Exam Extension Set B, Mark-Scheme Speaking Cards, Full
 *      Model Answer Key, 60-Min CELTA Lesson Plan) are gated behind:
 *        a) Student Pro Course Key (£24)
 *        b) Solo Tutor Classroom License (£49)
 *        c) White-Label Studio License (£149)
 *        d) Branded module-scoped Student Homework URL (?wl=1&sig=...)
 *
 * 2. Solo Tutor Classroom License (£49):
 *    - Unlocks all 12 Dark Academia C1/C2 units + Compendium + all Set B Vaults
 *    - Enables Clean Screen-Share Mode (hides Gareth Montgomery student CTAs)
 *    - Mounts the floating Teacher Presenter HUD (Live Classroom Timer,
 *      1-Click Reveal All Answers, 1-Click Reset Board, Print Handout,
 *      CEFR C1/C2 & IELTS Mark-Scheme Notes)
 *
 * 3. White-Label Studio & School License (£149):
 *    - Includes all Solo Tutor Classroom features
 *    - Branded Student Homework Links (?wl=1&tutor=...&sig=...) scoped to the
 *      specific assigned module without exposing the license key in the URL
 *      or unlocking the entire 12-unit course in localStorage
 *    - Dynamically replaces header branding & end-of-game showDiagnosticGate()
 *      CTAs with the licensed tutor/school's name, accent color, and URL
 * ============================================================================
 */
(() => {
  'use strict';

  if (window.GarethTeacherWhiteLabel) return;

  const STORAGE_KEYS = {
    LICENSE_TIER: 'gm_teacher_license_tier',       // 'solo' | 'studio'
    LICENSE_HASH: 'gm_teacher_license_hash',       // verified 64-bit hash
    STUDIO_CONFIG: 'gm_teacher_studio_config_v1',  // JSON { tutor, studio, cta, ctaLabel, color }
    CLEAN_MODE: 'gm_teacher_clean_screenshare',    // 'true' | 'false'
    DA_UNLOCK_1: 'da_archive_unlocked',
    DA_UNLOCK_2: 'da_canon_unlocked',
    DA_UNLOCK_3: 'da_course_unlocked_v1'
  };

  // Verified 64-bit FNV-1a + DJB2 hashes for Solo Tutor (£49), Studio White-Label (£149), and Student Pro (£24)
  const SOLO_CODE_HASHES = [
    '8720a773c24deac9',
    '68943376c022200c',
    'e32febaa231630ba'
  ];

  const STUDIO_CODE_HASHES = [
    'f7c46303a42395e1',
    '69f9d176bc781314',
    '642ef07c8176b90a'
  ];

  const STUDENT_PRO_HASHES = [
    '69d0b37588c5f1d3',
    '76194e86377ca58a',
    '8c0169334cd13d01',
    'ab0c08a56e1c455d',
    'e3983fcdd03203a9'
  ];

  const STRIPE_LINKS = {
    STUDENT_24: 'https://buy.stripe.com/9B63cuadm8gs5Mhc4Xb3q01',
    SOLO_49: 'teacher-vault.html#teacher-order-box',
    STUDIO_149: 'teacher-vault.html#teacher-order-box'
  };

  const ACCENT_PALETTES = {
    emerald: { bg: '#064e3b', border: '#10b981', badge: '#059669', text: '#ecfdf5', accent: '#6ee7b7', btn: '#10b981', btnText: '#022c22' },
    sky:     { bg: '#0c4a6e', border: '#38bdf8', badge: '#0284c7', text: '#f0f9ff', accent: '#7dd3fc', btn: '#38bdf8', btnText: '#082f49' },
    amber:   { bg: '#451a03', border: '#f59e0b', badge: '#d97706', text: '#fffbeb', accent: '#fcd34d', btn: '#f59e0b', btnText: '#1c1917' },
    violet:  { bg: '#2e1065', border: '#a855f7', badge: '#7c3aed', text: '#faf5ff', accent: '#d8b4fe', btn: '#a855f7', btnText: '#1e1b4b' },
    rose:    { bg: '#4c0519', border: '#f43f5e', badge: '#e11d48', text: '#fff1f2', accent: '#fda4af', btn: '#f43f5e', btnText: '#1f0910' }
  };

  // Module-specific Mark-Scheme Notes & Answer Key Briefings for the Teacher Presenter HUD
  const MODULE_TEACHER_GUIDES = {
    'chronicle': {
      title: 'Chronicle ’88: 8-Bit Mystery Visual Novel & 2d6 CYOA',
      cefr: 'CEFR B1 Preliminary to B2 First (Teens & Adults)',
      timing: '45–60 mins Episodic Screen-Share',
      notes: [
        'Classroom Mode Tip: Have students read character dialogue aloud (Inspector Deck, Chief Miller, suspect) to practice rhythm, intonation, and drama.',
        '2d6 Hazard Mechanics: Let the student call high/low or roll live dice. If Composure is depleted, use the B2 Rewind Transformation Parry to turn damage into grammar drills.',
        'Homework Assignment: Assign individual Tape cartridges as self-paced mystery homework with your white-label studio link.'
      ]
    },
    'professor-west': {
      title: 'Professor West’s 3D Study & Pencil the Cat',
      cefr: 'CEFR A1–B1 Young Learners & Lower-Intermediate',
      timing: '30–45 mins Interactive 3D Screen-Share',
      notes: [
        'Intro Movie: Play the 4-act animated intro with sound on to establish context before stepping into the 3D room.',
        'Screen-Share Interaction: Call on young learners to spot objects in the 3D room (compass, globe, phonograph, bookshelf) before clicking.',
        'Pencil the Cat Quests: Complete the 6 spelling and vocabulary mini-quests together to reinforce lexical retention without test anxiety.'
      ]
    },
    'dracula': {
      title: 'Dark Academia: Bram Stoker’s Dracula (C1/C2)',
      cefr: 'CEFR C1–C2 • Reading & Use of English Part 4',
      timing: '45–50 mins (Screen-Share + Guided Transform)',
      notes: [
        'Mark-Scheme Focus: Emphasize why present/perfect participle clauses ("Fearing...", "Having crossed...") elevate Writing Part 1/2 Cohesion & Coherence marks.',
        'Negative Inversion Trap: Remind learners that auxiliary inversion ("Scarcely had I...", "Little did he know...") requires past perfect + "when/before" (not "than" for scarcely).',
        'Quick Answer Key Tip: Use "👁️ Reveal All Answers" below during feedback to display all 6 Part 4 transformations simultaneously.'
      ]
    },
    'frankenstein': {
      title: 'Dark Academia: Mary Shelley’s Frankenstein (C1/C2)',
      cefr: 'CEFR C1–C2 • Cleft Sentences & Concession',
      timing: '45–50 mins',
      notes: [
        'Mark-Scheme Focus: Contrast It-clefts ("It was on a dreary night that...") with What-clefts ("What terrified me most was...") for persuasive essay introductions.',
        'Advanced Concession: Drill "Much as I admired...", "Be that as it may", and "Notwithstanding" to replace repetitive "Although/However".'
      ]
    },
    'jekyll': {
      title: 'Dark Academia: Strange Case of Dr Jekyll & Mr Hyde (C1/C2)',
      cefr: 'CEFR C1–C2 • Register Duality & Subjunctive Mood',
      timing: '45–50 mins',
      notes: [
        'Mark-Scheme Focus: Highlight the shift between Anglo-Saxon phrasal verbs (spoken B2) and Latinate nominalisation (academic C1/C2 reports).',
        'Formulaic Subjunctive: Drill "suffice it to say", "be that as it may", and mandative subjunctive ("insisted that he be...").'
      ]
    },
    'baskerville': {
      title: 'Dark Academia: The Hound of the Baskervilles (C1/C2)',
      cefr: 'CEFR C1–C2 • Past Modal Deductions & Hedging',
      timing: '45–50 mins',
      notes: [
        'Mark-Scheme Focus: Contrast "must have been" (logical certainty) vs "can\'t/couldn\'t have been" (impossibility) vs "may well have been" (strong probability).',
        'Academic Hedging: Transfer Holmesian deduction structures directly into IELTS Task 2 / CAE Report evidence evaluation.'
      ]
    },
    'cae-essay': {
      title: 'C1 Advanced (CAE) Interactive Essay Builder',
      cefr: 'Cambridge C1 Writing Part 1 • 220–260 Words',
      timing: '50 mins (25m Guided Build + 15m Live Rubric Audit)',
      notes: [
        'Cambridge Mark Scheme (4 x 5 marks): Content (must address 2 prompt points + select 1 as more important), Communicative Achievement (consistent academic register), Organisation (linking across paragraphs), Language (C1 syntax: inversion, clefts, complex passives).',
        'Common Band-3 Trap: Students summarize both bullet points in Paragraph 2 and 3 but forget to explicitly argue WHICH point is more impactful in the conclusion.'
      ]
    },
    'ielts-essay': {
      title: 'IELTS Writing Task 2 Masterclass (Band 7.0–8.5)',
      cefr: 'IELTS Academic & General Task 2 • 250+ Words',
      timing: '50 mins',
      notes: [
        'Task Response (TR) Rule: In "Outweigh" essays, the weaker side MUST go in Body 1 and the stronger side in Body 2 so the progression matches the thesis.',
        'Lexical Resource (LR) Upgrade: Have the student complete the Register Shift drill aloud before writing their own introduction.'
      ]
    },
    'fce-friendship': {
      title: 'B2 First (FCE): Compound Adjectives & Conditionals',
      cefr: 'Cambridge B2 First • Reading & Use of English Part 4',
      timing: '45–60 mins',
      notes: [
        'Hyphenation Rule: Compound personality adjectives before a noun ("a level-headed manager") take a hyphen; after a verb they often drop it.',
        'Conditional Traps: Ensure students distinguish "unless" (= if not) from "as long as / provided that" (= only if) in Part 4 transformations.'
      ]
    },
    'cpe-psychometrics': {
      title: 'C2 Proficiency (CPE): Psychometrics & Distancing Passives',
      cefr: 'Cambridge C2 Proficiency • Academic Reporting Structures',
      timing: '50–60 mins',
      notes: [
        'Impersonal Distancing Formula: Contrast "It is widely assumed that..." with Subject + Passive + Perfect Infinitive ("The test is thought to have been manipulated").',
        'Part 4 Double-Structure Requirement: Every C2 transformation requires two distinct grammatical shifts (1 mark each).'
      ]
    },
    'reactor': {
      title: 'Phrasal Reactor: C1 Particle Reflex Trainer',
      cefr: 'CEFR B2–C2 • Use of English Parts 1, 2 & 4',
      timing: '15–20 mins Warm-Up or Assigned Homework',
      notes: [
        'Particle Semantics: Group particles by metaphor—UP (completion/increase), DOWN (suppression/recording), OUT (exhaustion/resolution), OFF (detachment/triggering).',
        'Classroom Mode Idea: Have the student justify WHY the distractor particles fail before clicking the core injection button.'
      ]
    },
    'factory': {
      title: 'Word Factory: Cambridge Part 3 Morphology Engine',
      cefr: 'CEFR B2–C2 • Use of English Part 3 Word Formation',
      timing: '15–25 mins',
      notes: [
        'Double-Change Rule: At C1/C2, at least 2 of the 8 items require BOTH a prefix (un-, in-, mis-, over-) AND a suffix (-able, -ity, -lessly).',
        'Ask students to identify the syntactic slot (noun, adverb, negative adjective) BEFORE looking at the stem.'
      ]
    },
    'boardroom': {
      title: 'Executive Business English: Meetings & Diplomacy Lab',
      cefr: 'CEFR B2+ to C2 • Executive Pragmatics & Negotiation',
      timing: '40–50 mins Roleplay & Pragmatics',
      notes: [
        'Pragmatic Hedging Formula: Softener ("I see what we\'re aiming for, though...") + Qualifier ("as it stands") + Constructive Pivot ("could we stress-test...?").',
        'Have the student role-play their real upcoming stakeholder call using 3 target phrases from the lab.'
      ]
    },
    'crypt': {
      title: 'The Grammar Crypt (2D & 3D Raycaster Dungeon)',
      cefr: 'CEFR B2–C2 • Key Word Transformations (Part 4)',
      timing: '20–30 mins Live or Homework Sprint',
      notes: [
        'Scoring Strategy: Every Cambridge Part 4 item is worth 2 marks (1 mark for each half of the transformation). Teach students never to leave a blank—partial structure still scores 1/2.',
        'Use the 2-Try Forgiving Hint system in class to elicit the grammar rule before revealing the second half.'
      ]
    },
    'default': {
      title: 'Interactive Classroom Module',
      cefr: 'CEFR B2–C2 & IELTS 7.0–8.5',
      timing: '30–50 mins Live Screen-Share or Homework',
      notes: [
        'Screen-Share Tip: Toggle "Clean Screen-Share" in this Teacher HUD to hide all external booking banners during your lesson.',
        'Homework Assignment: Click "Copy Student Link" below to send your student a branded homework URL that credits your studio.'
      ]
    }
  };

  // Stage 4 & 5 Pro Exam Extension (Set B) & Teacher Pack Data per Module
  const MODULE_PRO_EXTENSIONS = {
    'fce-friendship': {
      badge: 'B2 First (FCE) • Pro Exam Extension (Set B)',
      title: 'Stages 4 & 5: Set B Exam Bank, Mark-Scheme Speaking Cards & Teacher Pack',
      previewItem: {
        topic: 'Speculative Conditionals (Part 4 Preview)',
        keyWord: 'SUPPOSING',
        prompt: 'What would you do if your closest friend accidentally revealed your secret?',
        stemBefore: '',
        stemAfter: 'accidentally revealed your secret, how would you react?',
        valid: 'supposing your closest friend|supposing that your closest friend',
        model: 'Supposing your closest friend'
      },
      setBItems: [
        {
          topic: 'Inverted 3rd/2nd Mixed Conditional',
          keyWord: 'BEEN',
          prompt: 'If Clara had not mediated the argument, the two co-founders would not be speaking today.',
          stemBefore: 'Had it',
          stemAfter: 'Clara mediating the argument, the two co-founders would not be speaking today.',
          valid: 'not been for',
          model: 'not been for'
        },
        {
          topic: 'Implied Conditional with OTHERWISE',
          keyWord: 'OTHERWISE',
          prompt: 'Liam is very level-headed, which is the only reason the negotiation didn’t collapse.',
          stemBefore: 'Liam is very level-headed;',
          stemAfter: 'collapsed.',
          valid: 'otherwise the negotiation would have',
          model: 'otherwise the negotiation would have'
        },
        {
          topic: 'Strict Condition with LONG',
          keyWord: 'LONG',
          prompt: 'You can borrow my vintage jacket only if you promise not to wear it in the rain.',
          stemBefore: 'I will lend you my vintage jacket',
          stemAfter: 'promise not to wear it in the rain.',
          valid: 'as long as you|so long as you',
          model: 'as long as you'
        }
      ],
      speakingPrompts: [
        'Part 3 Collaborative Task: "To what extent is it better for business partners to be like-minded rather than having opposite personalities?" (Target: level-headed, strong-willed, provided that)',
        'Part 4 Follow-Up Prompt: "If social media had never been invented, how different would our friendships be today?" (Target: Mixed conditional — If + Past Perfect, would + infinitive)',
        'Error-Correction Drill: Have the student explain why *"Unless you don\'t call me, I\'ll leave"* is ungrammatical and reformulate it aloud.'
      ],
      lessonPlan: [
        '00–10m Lead-In: Elicit compound personality adjectives from 3 famous film/literary duos.',
        '10–25m Guided Discovery (Stages 1–2): Complete the Reading Extract & 8-item Compound Adjective Matcher; drill word stress shift.',
        '25–45m Exam Transformation Clinic (Stages 3–4): Run Set A & Set B Part 4 Key Word Transformations (2 marks per item: 1 for conjunction, 1 for tense shift).',
        '45–60m Speaking Part 3/4 Simulation (Stage 5): Timed 4-minute paired/tutor discussion using the Mark-Scheme Speaking Cards.'
      ]
    },
    'cpe-psychometrics': {
      badge: 'C2 Proficiency (CPE) • Pro Exam Extension (Set B)',
      title: 'Stages 4 & 5: C2 Set B Transformations, Long-Turn Cards & Teacher Pack',
      previewItem: {
        topic: 'Passive + Perfect Infinitive (Part 4 Preview)',
        keyWord: 'THOUGHT',
        prompt: 'Independent auditors believe the recruitment algorithm penalized unconventional candidates.',
        stemBefore: 'The recruitment algorithm',
        stemAfter: 'unconventional candidates.',
        valid: 'is thought to have penalized|is thought to have penalised',
        model: 'is thought to have penalised'
      },
      setBItems: [
        {
          topic: 'Passive Reporting with CREDITED',
          keyWord: 'CREDITED',
          prompt: 'Historians generally agree that Dr Thorne pioneered modern psychometric profiling.',
          stemBefore: 'Dr Thorne is widely',
          stemAfter: 'modern psychometric profiling.',
          valid: 'credited with having pioneered|credited with pioneering',
          model: 'credited with having pioneered'
        },
        {
          topic: 'Negative Passive Inversion',
          keyWord: 'CIRCUMSTANCES',
          prompt: 'Raw psychometric scores must never be used as the sole criterion for dismissal.',
          stemBefore: 'Under',
          stemAfter: 'be used as the sole criterion for dismissal.',
          valid: 'no circumstances should raw psychometric scores|no circumstances must raw psychometric scores',
          model: 'no circumstances should raw psychometric scores'
        },
        {
          topic: 'C2 Idiomatic Distancing',
          keyWord: 'FOREGONE',
          prompt: 'Everyone assumes that automated screening will completely replace initial human interviews.',
          stemBefore: 'It is treated as a',
          stemAfter: 'automated screening will completely replace initial human interviews.',
          valid: 'foregone conclusion that',
          model: 'foregone conclusion that'
        }
      ],
      speakingPrompts: [
        'C2 Speaking Part 3 Card (2-Minute Long Turn): "How far can human character and leadership potential ever be reduced to quantifiable metrics?" (Target: It is widely contended that..., ostensibly, reductionist)',
        'Part 3 Counter-Question: "Isn\'t an imperfect algorithm still fairer than the unconscious bias of a human interviewer?" (Target: Be that as it may..., alleged to be...)',
        'Register Upgrade Challenge: Convert 3 blunt claims about corporate hiring into impersonal C2 academic prose.'
      ],
      lessonPlan: [
        '00–10m Lead-In: Critique a real Myers-Briggs / Big Five corporate hiring prompt.',
        '10–25m Lexical Nuance & Reading (Stages 1–2): Contrast pejorative vs. analytical C2 lexis (reductionist, ostensibly, pigeonhole).',
        '25–45m Impersonal Passive Architecture (Stages 3–4): Complete Set A & Set B C2 Part 4 Transformations; highlight tense changes in perfect infinitives.',
        '45–60m C2 Part 3 Long-Turn Simulation (Stage 5): 2-minute timed monologue + discussion follow-up.'
      ]
    },
    'boardroom': {
      badge: 'Executive Business English • Pro Diplomacy Extension (Set B)',
      title: 'Stages 4 & 5: High-Stakes Negotiation Set B, Roleplay Briefs & Trainer Pack',
      previewItem: {
        topic: 'Checking Strategic Alignment (Preview)',
        keyWord: 'ALIGNED',
        prompt: 'Blunt: "I want to make sure everyone agrees on the Q4 deliverables before we leave."',
        stemBefore: 'Diplomatic: "Just to make sure we',
        stemAfter: 'on the Q4 deliverables before we wrap up..."',
        valid: 'are fully aligned|are all aligned|are aligned',
        model: 'are fully aligned'
      },
      setBItems: [
        {
          topic: 'Nominalising Stakeholder Resistance',
          keyWord: 'PUSHBACK',
          prompt: 'Blunt: "The German sales directors complained loudly about the new commission structure."',
          stemBefore: 'Diplomatic: "We experienced',
          stemAfter: 'the DACH directors regarding the revised commission structure."',
          valid: 'some pushback from|significant pushback from|considerable pushback from',
          model: 'significant pushback from'
        },
        {
          topic: 'Testing Counter-Arguments Diplomatically',
          keyWord: 'ADVOCATE',
          prompt: 'Blunt: "Here is why your expansion forecast might fail."',
          stemBefore: 'Diplomatic: "If I could just',
          stemAfter: 'for a moment—what happens if enterprise churn rises in Q2?"',
          valid: "play devil's advocate|play devils advocate",
          model: "play devil's advocate"
        },
        {
          topic: 'Negotiating Scope Concessions',
          keyWord: 'FLEXIBILITY',
          prompt: 'Blunt: "Your agency fee is too high; lower it by 15%."',
          stemBefore: 'Diplomatic: "Is there',
          stemAfter: 'the retainer structure if we commit to a 12-month term?"',
          valid: 'any flexibility on|some flexibility on|any flexibility around',
          model: 'any flexibility on'
        }
      ],
      speakingPrompts: [
        'Live Roleplay Brief A (The Overpromising VP): Your Sales VP just promised a client a custom integration in 2 weeks. Engineering needs 6 weeks. Push back in front of the CEO without undermining the VP.',
        'Live Roleplay Brief B (The Hijacked Stand-Up): A senior stakeholder spends 6 minutes debating a minor branding colour during a 20-minute crisis call. Reclaim the agenda politely.',
        'Live Roleplay Brief C (The Unassigned Action): Everyone nods at the end of a board review, but nobody commits to owning the audit deliverable. Pin down ownership and a Friday 5pm deadline.'
      ],
      lessonPlan: [
        '00–10m Diagnostic Warm-Up: Have the client/student respond spontaneously to 3 blunt boardroom provocations.',
        '10–25m Pragmatic Calibration (Stages 1–2): Contrast direct B2 phrasing with C1/C2 British/International hedging formulas.',
        '25–45m Active Transformation Drills (Stages 3–4): Complete Set A & Set B Key Word Transformations under time pressure.',
        '45–60m High-Stakes Boardroom Simulation (Stage 5): Run Roleplay Briefs A, B, and C with live trainer interruption.'
      ]
    },
    'cae-essay': {
      badge: 'C1 Advanced (CAE) • Mark-Scheme Extension (Set B)',
      title: 'Stages 4 & 5: C1 Syntactic Prestige Set B, Speaking Part 4 & Teacher Pack',
      previewItem: {
        topic: 'Prepositional Concession (Part 4 Preview)',
        keyWord: 'NOTWITHSTANDING',
        prompt: 'Although digital textbooks reduce printing costs, they frequently increase screen fatigue.',
        stemBefore: '',
        stemAfter: 'in printing costs, digital textbooks frequently increase screen fatigue.',
        valid: 'notwithstanding the reduction|notwithstanding a reduction',
        model: 'Notwithstanding the reduction'
      },
      setBItems: [
        {
          topic: 'Negative Introductory Inversion for Essay Hooks',
          keyWord: 'RARELY',
          prompt: 'Urban planners seldom consider the psychological impact of noise pollution on school performance.',
          stemBefore: '',
          stemAfter: 'the psychological impact of noise pollution on school performance.',
          valid: 'rarely do urban planners consider',
          model: 'Rarely do urban planners consider'
        },
        {
          topic: 'Wh-Cleft for Persuasive Conclusions',
          keyWord: 'WHAT',
          prompt: 'Universities must reform assessment methods rather than banning artificial intelligence.',
          stemBefore: 'Instead of banning artificial intelligence,',
          stemAfter: 'is reform assessment methods.',
          valid: 'what universities must do',
          model: 'what universities must do'
        },
        {
          topic: 'Correlative Contrast (Far from + -ing)',
          keyWord: 'FAR',
          prompt: 'Unpaid internships do not improve social mobility; in fact, they widen the socioeconomic gap.',
          stemBefore: '',
          stemAfter: 'social mobility, unpaid internships actually widen the socioeconomic gap.',
          valid: 'far from improving',
          model: 'Far from improving'
        }
      ],
      speakingPrompts: [
        'CAE Speaking Part 4 Discussion: "Should governments fund university degrees based on graduate employment rates, or does that destroy the value of the humanities?"',
        'Oral Synthesis Challenge: Summarize your 260-word CAE essay argument in 45 seconds using at least one negative inversion and one cleft sentence.',
        'Peer/Tutor Rubric Audit: Score the student’s draft across Content (0–5), Communicative Achievement (0–5), Organisation (0–5), and Language (0–5).'
      ],
      lessonPlan: [
        '00–10m Prompt Deconstruction: Identify the 3 bullet points and select which 2 to develop (plus which 1 to crown in the conclusion).',
        '10–30m Guided Paragraph Assembly: Build Introduction, Body 1, Body 2, and Conclusion using C1 cohesive devices.',
        '30–45m Syntactic Prestige Upgrade (Set B): Inject negative inversion, Wh-clefts, and "Far from + -ing" into the draft.',
        '45–60m Live 20-Point Cambridge Rubric Audit & Speaking Part 4 Debate.'
      ]
    },
    'ielts-essay': {
      badge: 'IELTS Band 8.5 Masterclass • Mark-Scheme Extension (Set B)',
      title: 'Stages 4 & 5: Band 8.5 Lexical & Syntax Set B, Speaking Part 3 & Teacher Pack',
      previewItem: {
        topic: 'Band 8.5 Evaluative Thesis (Preview)',
        keyWord: 'OUTWEIGH',
        prompt: 'The long-term economic benefits of high-speed rail are much greater than the initial construction costs.',
        stemBefore: 'The long-term economic benefits of high-speed rail',
        stemAfter: 'initial construction costs.',
        valid: 'far outweigh the|significantly outweigh the|outweigh the',
        model: 'far outweigh the'
      },
      setBItems: [
        {
          topic: 'Causal Nominalisation (Band 8+ Lexical Resource)',
          keyWord: 'STEMS',
          prompt: 'Youth unemployment in rural areas is largely caused by a lack of vocational training centres.',
          stemBefore: 'Youth unemployment in rural areas',
          stemAfter: 'a lack of vocational training centres.',
          valid: 'largely stems from|stems largely from|stems from',
          model: 'largely stems from'
        },
        {
          topic: 'Nuanced Concession (Task Response Band 8+)',
          keyWord: 'EXTENT',
          prompt: 'While I agree with congestion charges up to a point, they disproportionately affect shift workers.',
          stemBefore: 'While I endorse congestion charges',
          stemAfter: ', they disproportionately penalise shift workers.',
          valid: 'to a certain extent|to some extent',
          model: 'to a certain extent'
        },
        {
          topic: 'Academic Passive Hedging',
          keyWord: 'COMPELLED',
          prompt: 'When inner-city rents surge, essential public-sector workers are forced to commute from distant suburbs.',
          stemBefore: 'When inner-city rents surge, essential public-sector workers',
          stemAfter: 'from distant suburbs.',
          valid: 'are compelled to commute',
          model: 'are compelled to commute'
        }
      ],
      speakingPrompts: [
        'IELTS Speaking Part 3 Follow-Up: "Why do many governments struggle to balance short-term voter popularity with long-term infrastructure planning?"',
        'Band 7.0 to Band 8.5 Oral Rewrite: Take a simple opinion ("I think cars should be banned in city centres because of pollution") and deliver it aloud using a concessive clause + nominalisation.',
        'Cohesion & Coherence Check: Replace mechanical linkers ("Firstly, Secondly, In a nutshell") with organic lexical referencing ("This disparity...", "Such measures...").'
      ],
      lessonPlan: [
        '00–10m Prompt Classification: Distinguish Opinion, Discussion, Outweigh, Problem/Solution, and Two-Part prompts.',
        '10–25m Register Shift & Paragraph Architecture: Upgrade B2 informal claims to Band 8.5 academic register.',
        '25–45m Timed Task 2 Drafting + Set B Transformation Clinic.',
        '45–60m Live 4-Criterion Band Descriptor Audit (TR, CC, LR, GRA) & Speaking Part 3 extension.'
      ]
    },
    'default': {
      badge: 'CEFR C1/C2 • Pro Exam Extension (Set B)',
      title: 'Stages 4 & 5: Advanced Set B Exam Bank & Teacher Classroom Pack',
      previewItem: {
        topic: 'Negative Inversion (Part 4 Preview)',
        keyWord: 'SOONER',
        prompt: 'As soon as the committee published the findings, the minister resigned.',
        stemBefore: 'No',
        stemAfter: 'the findings than the minister resigned.',
        valid: 'sooner had the committee published',
        model: 'sooner had the committee published'
      },
      setBItems: [
        {
          topic: 'Strict Prohibition Inversion',
          keyWord: 'ACCOUNT',
          prompt: 'Candidates must never remove examination materials from the hall.',
          stemBefore: 'On',
          stemAfter: 'remove examination materials from the hall.',
          valid: 'no account must candidates|no account should candidates',
          model: 'no account must candidates'
        },
        {
          topic: 'Perfect Passive Participle Clause',
          keyWord: 'BEING',
          prompt: 'Because she had been overlooked for promotion twice, Elena decided to launch her own consultancy.',
          stemBefore: 'Having',
          stemAfter: 'for promotion twice, Elena decided to launch her own consultancy.',
          valid: 'been overlooked',
          model: 'been overlooked'
        },
        {
          topic: 'Resultative Inversion with SUCH',
          keyWord: 'SUCH',
          prompt: 'The complexity of the regulatory framework was so great that small firms needed legal counsel.',
          stemBefore: '',
          stemAfter: 'the regulatory framework that small firms needed legal counsel.',
          valid: 'such was the complexity of',
          model: 'Such was the complexity of'
        }
      ],
      speakingPrompts: [
        'C1/C2 Oral Transfer: Formulate two original sentences about your own work or studies using the target structures from today’s module.',
        'Mark-Scheme Precision Check: Identify the two grammatical components that earn 1 mark each in every Part 4 transformation above.'
      ],
      lessonPlan: [
        '00–15m Diagnostic Run (Stages 1–2): Assess baseline speed and accuracy on the core interactive engine.',
        '15–35m Guided Error Analysis (Stage 3): Elicit why common distractor patterns fail.',
        '35–50m Set B Exam Extension & Oral Transfer (Stages 4–5): Consolidate under exam conditions.'
      ]
    }
  };

  function hashString64(raw) {
    const clean = String(raw || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!clean) return '';
    let h1 = 0x811c9dc5;
    let h2 = 5381;
    for (let i = 0; i < clean.length; i++) {
      const c = clean.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
      h2 = (Math.imul(h2, 33) ^ c) >>> 0;
    }
    return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
  }

  function normalizeField(str) {
    return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  function resolveTargetModuleBasename(targetFile) {
    const raw = String(targetFile || window.location.pathname || 'index.html')
      .split('?')[0]
      .split('#')[0]
      .split('/')
      .pop();
    return normalizeField(raw || 'index.html');
  }

  function computeHomeworkSig(studioHash, tutor, studio, cta, targetFile) {
    const idx = STUDIO_CODE_HASHES.indexOf(studioHash);
    if (idx === -1) return '';
    const payload = [
      studioHash,
      normalizeField(tutor),
      normalizeField(studio),
      normalizeField(cta),
      resolveTargetModuleBasename(targetFile)
    ].join('x');
    return String(idx) + hashString64(payload).slice(0, 12);
  }

  function verifyHomeworkSig(sig, tutor, studio, cta, targetFile) {
    if (!sig || sig.length < 13) return false;
    const idx = parseInt(sig.charAt(0), 10);
    if (isNaN(idx) || idx < 0 || idx >= STUDIO_CODE_HASHES.length) return false;
    const studioHash = STUDIO_CODE_HASHES[idx];
    const expected = computeHomeworkSig(studioHash, tutor, studio, cta, targetFile);
    return sig === expected;
  }

  function detectModuleKey() {
    const p = (window.location.pathname || '').toLowerCase();
    if (p.includes('chronicle') || p.includes('88')) return 'chronicle';
    if (p.includes('professor-west') || p.includes('study')) return 'professor-west';
    if (p.includes('dracula')) return 'dracula';
    if (p.includes('frankenstein')) return 'frankenstein';
    if (p.includes('jekyll')) return 'jekyll';
    if (p.includes('baskerville')) return 'baskerville';
    if (p.includes('cae-essay')) return 'cae-essay';
    if (p.includes('ielts') || p.includes('ynnning')) return 'ielts-essay';
    if (p.includes('fce-friendship')) return 'fce-friendship';
    if (p.includes('cpe-psychometrics')) return 'cpe-psychometrics';
    if (p.includes('reactor')) return 'reactor';
    if (p.includes('factory') || p.includes('word-formation')) return 'factory';
    if (p.includes('boardroom') || p.includes('business-english')) return 'boardroom';
    if (p.includes('crypt') || p.includes('transformation')) return 'crypt';
    return 'default';
  }

  function detectModuleGuide() {
    const key = detectModuleKey();
    return MODULE_TEACHER_GUIDES[key] || MODULE_TEACHER_GUIDES['default'];
  }

  function detectProExtension() {
    const key = detectModuleKey();
    return MODULE_PRO_EXTENSIONS[key] || MODULE_PRO_EXTENSIONS['default'];
  }

  function shouldMountProExtensionVault() {
    const p = (window.location.pathname || '').toLowerCase();
    return (
      p.includes('fce-friendship-conditionals.html') ||
      p.includes('cpe-psychometrics-passives.html') ||
      p.includes('business-english-meetings.html') ||
      p.includes('cae-essay-builder-v2.html') ||
      p.includes('ielts-essay-masterclass.html') ||
      p.includes('ielts-task2-paragraphing-slides.html') ||
      p.includes('ynnning-lesson-slides-task2-paragraphing.html') ||
      p.includes('boardroom.html')
    );
  }

  const GarethTeacherWhiteLabel = {
    SOLO_CODE_HASHES,
    STUDIO_CODE_HASHES,
    STRIPE_LINKS,
    ACCENT_PALETTES,
    timerInterval: null,
    timerSeconds: 900, // 15m default
    timerRunning: false,

    hashAccessCode: hashString64,
    computeHomeworkSig,
    verifyHomeworkSig,

    getLicenseState() {
      try {
        const tier = localStorage.getItem(STORAGE_KEYS.LICENSE_TIER) || '';
        const hash = localStorage.getItem(STORAGE_KEYS.LICENSE_HASH) || '';
        if (tier === 'studio' && STUDIO_CODE_HASHES.includes(hash)) {
          return { active: true, tier: 'studio', hash };
        }
        if (tier === 'solo' && SOLO_CODE_HASHES.includes(hash)) {
          return { active: true, tier: 'solo', hash };
        }
      } catch (e) {}
      return { active: false, tier: null, hash: null };
    },

    isProContentUnlocked() {
      const lic = this.getLicenseState();
      if (lic.active) return true;
      if (window.__GM_SIGNED_HOMEWORK_PAGE_UNLOCK === true) return true;
      try {
        if (
          localStorage.getItem(STORAGE_KEYS.DA_UNLOCK_1) === 'true' ||
          localStorage.getItem(STORAGE_KEYS.DA_UNLOCK_2) === 'true' ||
          localStorage.getItem(STORAGE_KEYS.DA_UNLOCK_3) === 'true'
        ) {
          return true;
        }
      } catch (e) {}
      const params = new URLSearchParams(window.location.search);
      if (params.get('wl') === '1') {
        const sig = params.get('sig') || '';
        const tutor = params.get('tutor') || 'Licensed Tutor';
        const studio = params.get('studio') || 'English Coaching Studio';
        const cta = params.get('cta') || '';
        if (verifyHomeworkSig(sig, tutor, studio, cta, window.location.pathname)) return true;
      }
      return false;
    },

    activateLicense(rawCode) {
      const digest = hashString64(rawCode);
      let tier = null;
      if (STUDIO_CODE_HASHES.includes(digest)) {
        tier = 'studio';
      } else if (SOLO_CODE_HASHES.includes(digest)) {
        tier = 'solo';
      } else if (STUDENT_PRO_HASHES.includes(digest)) {
        tier = 'student_pro';
      }
      if (!tier) return { ok: false, tier: null };

      try {
        if (tier === 'studio' || tier === 'solo') {
          localStorage.setItem(STORAGE_KEYS.LICENSE_TIER, tier);
          localStorage.setItem(STORAGE_KEYS.LICENSE_HASH, digest);
          localStorage.setItem(STORAGE_KEYS.CLEAN_MODE, 'true');
        }
        // Unlock all Dark Academia units, Compendium & Set B Pro Extensions
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_1, 'true');
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_2, 'true');
        localStorage.setItem(STORAGE_KEYS.DA_UNLOCK_3, 'true');
      } catch (e) {}

      if (window.DarkAcademiaGate && typeof window.DarkAcademiaGate.syncUI === 'function') {
        window.DarkAcademiaGate.syncUI();
      }
      this.initPageRuntime();
      this.syncProExtensionVaultUI();
      return { ok: true, tier, hash: digest };
    },

    deactivateLicense() {
      try {
        localStorage.removeItem(STORAGE_KEYS.LICENSE_TIER);
        localStorage.removeItem(STORAGE_KEYS.LICENSE_HASH);
        localStorage.removeItem(STORAGE_KEYS.CLEAN_MODE);
      } catch (e) {}
      const hud = document.getElementById('gm-teacher-presenter-hud');
      if (hud) hud.remove();
      const banner = document.getElementById('gm-wl-top-banner');
      if (banner) banner.remove();
      document.body.classList.remove('gm-clean-screenshare');
      this.syncProExtensionVaultUI();
    },

    getStudioConfig() {
      const defaults = {
        tutor: 'Your Name',
        studio: 'Language Studio',
        cta: 'https://',
        ctaLabel: 'Book Next Lesson / Submit Homework',
        color: 'emerald'
      };
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.STUDIO_CONFIG) || '{}');
        return { ...defaults, ...saved };
      } catch (e) {
        return defaults;
      }
    },

    saveStudioConfig(cfg) {
      const current = this.getStudioConfig();
      const merged = { ...current, ...(cfg || {}) };
      try {
        localStorage.setItem(STORAGE_KEYS.STUDIO_CONFIG, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    },

    buildSignedHomeworkUrl(targetFile, cfgOverride) {
      const state = this.getLicenseState();
      const cfg = { ...this.getStudioConfig(), ...(cfgOverride || {}) };
      const base = new URL(targetFile, window.location.origin + window.location.pathname.replace(/[^/]*$/, ''));
      base.searchParams.set('wl', '1');
      base.searchParams.set('tutor', cfg.tutor || 'Licensed Tutor');
      base.searchParams.set('studio', cfg.studio || 'English Studio');
      if (cfg.cta && cfg.cta !== 'https://') {
        base.searchParams.set('cta', cfg.cta);
      }
      if (cfg.ctaLabel) {
        base.searchParams.set('cta_label', cfg.ctaLabel);
      }
      base.searchParams.set('color', cfg.color || 'emerald');

      if (state.active && state.tier === 'studio') {
        const sig = computeHomeworkSig(state.hash, cfg.tutor, cfg.studio, cfg.cta || '', targetFile);
        base.searchParams.set('sig', sig);
      } else {
        base.searchParams.set('wl_preview', '1');
      }
      return base.toString();
    },

    isCleanModeEnabled() {
      try {
        return localStorage.getItem(STORAGE_KEYS.CLEAN_MODE) === 'true';
      } catch (e) {
        return false;
      }
    },

    setCleanMode(enabled) {
      try {
        localStorage.setItem(STORAGE_KEYS.CLEAN_MODE, enabled ? 'true' : 'false');
      } catch (e) {}
      this.applyCleanScreenShareDOM(enabled);
    },

    applyCleanScreenShareDOM(enabled) {
      let styleEl = document.getElementById('gm-clean-screenshare-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'gm-clean-screenshare-styles';
        styleEl.textContent = `
          body.gm-clean-screenshare #sticky-mobile-cta,
          body.gm-clean-screenshare #sticky-booking-bar,
          body.gm-clean-screenshare aside[aria-label="Book Diagnostic Session"],
          body.gm-clean-screenshare a[href*="#contact"],
          body.gm-clean-screenshare a[href*="#book-diagnostic"],
          body.gm-clean-screenshare a[href*="cal.com/gareth-montgomery"],
          body.gm-clean-screenshare .da-btn-stripe,
          body.gm-clean-screenshare #da-hub-access-code-btn,
          body.gm-clean-screenshare [data-prefill-package] {
            display: none !important;
          }
        `;
        document.head.appendChild(styleEl);
      }
      document.body.classList.toggle('gm-clean-screenshare', Boolean(enabled));
      const toggleBtn = document.getElementById('gm-hud-clean-toggle');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-pressed', String(Boolean(enabled)));
        toggleBtn.textContent = enabled ? '✓ Clean Screen-Share: ON' : 'Clean Screen-Share: OFF';
        toggleBtn.style.background = enabled ? '#059669' : '#1e293b';
      }
    },

    /**
     * Live Classroom Tool 1: 1-Click Reveal All Answers across any module
     */
    revealAllPageAnswers() {
      let revealedCount = 0;

      // 1. Multiple Choice Blocks (.mc-block[data-correct])
      document.querySelectorAll('.mc-block[data-correct]').forEach((block) => {
        const correctIdx = parseInt(block.getAttribute('data-correct'), 10);
        const btns = block.querySelectorAll('.mc-btn');
        if (!isNaN(correctIdx) && btns[correctIdx]) {
          btns.forEach((b) => (b.disabled = true));
          btns[correctIdx].classList.add('correct');
          const fb = block.querySelector('.feedback, .feedback-box');
          const exp = block.getAttribute('data-explanation');
          if (fb) {
            fb.classList.remove('hidden');
            fb.style.display = 'block';
            if (exp && !fb.textContent.trim()) {
              fb.innerHTML = `<strong>✓ Answer Key:</strong> ${exp}`;
            }
          }
          revealedCount++;
        }
      });

      // 2. Dropdown Selectors (.vocab-select)
      document.querySelectorAll('.vocab-select').forEach((sel) => {
        const onchangeAttr = sel.getAttribute('onchange') || '';
        const match = onchangeAttr.match(/checkVocab\([^,]+,\s*'([^']+)'\)/);
        if (match && match[1]) {
          sel.value = match[1];
          sel.classList.remove('wrong');
          sel.classList.add('correct');
          sel.disabled = true;
          revealedCount++;
        }
      });

      // 3. Sorting Buttons (.sort-btn with checkSort)
      document.querySelectorAll('button[onclick*="checkSort"]').forEach((btn) => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        const m = onclickAttr.match(/checkSort\([^,]+,\s*'([^']+)',\s*'([^']+)'\)/);
        if (m && m[1] === m[2]) {
          btn.classList.add('correct');
          revealedCount++;
        }
        btn.disabled = true;
      });

      // 4. Key Word Transformations (.kwt-card[data-valid], .kwt-item[data-valid], .gm-pro-kwt[data-valid])
      document.querySelectorAll('[data-valid]').forEach((card) => {
        const rawValid = card.getAttribute('data-valid') || '';
        const canonical = rawValid.split('|')[0];
        const input = card.querySelector('.kwt-input, input[type="text"]');
        if (input && canonical) {
          input.value = canonical;
          input.disabled = true;
          input.style.borderColor = '#10b981';
          const btn = card.querySelector('.check-btn, .btn-main');
          if (btn) btn.disabled = true;
          const fb = card.querySelector('.feedback, .feedback-msg, .feedback-box');
          if (fb) {
            fb.classList.remove('hidden');
            fb.style.display = 'block';
            fb.innerHTML = `<strong>✓ Model Answer Key:</strong> "${this.escapeHtml(canonical)}"`;
          }
          revealedCount++;
        }
      });

      return revealedCount;
    },

    /**
     * Live Classroom Tool 2: 1-Click Reset All Exercises for next class
     */
    resetAllPageExercises() {
      if (typeof window.resetAll === 'function') {
        try { window.resetAll(); } catch (e) {}
      }

      // Reset MCQs
      document.querySelectorAll('.mc-block').forEach((block) => {
        delete block.dataset.answered;
        block.querySelectorAll('.mc-btn').forEach((b) => {
          b.disabled = false;
          b.classList.remove('correct', 'wrong');
        });
        const fb = block.querySelector('.feedback, .feedback-box');
        if (fb) {
          fb.style.display = 'none';
          fb.classList.add('hidden');
        }
      });

      // Reset Dropdowns
      document.querySelectorAll('.vocab-select').forEach((sel) => {
        sel.disabled = false;
        sel.value = '';
        sel.classList.remove('correct', 'wrong');
        const parent = sel.parentElement;
        if (parent) {
          parent.querySelectorAll('.vocab-reveal-note, span').forEach((s) => {
            if (s.textContent.includes('✓')) s.remove();
          });
        }
      });

      // Reset Sort Buttons
      document.querySelectorAll('button[onclick*="checkSort"]').forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove('correct', 'wrong');
      });

      // Reset KWTs
      document.querySelectorAll('[data-valid]').forEach((card) => {
        delete card.dataset.answered;
        delete card.dataset.attempts;
        const input = card.querySelector('.kwt-input, input[type="text"]');
        if (input) {
          input.disabled = false;
          input.value = '';
          input.style.borderColor = '';
        }
        card.querySelectorAll('.check-btn, .btn-main, .kwt-word-tile, .kwt-mini-btn').forEach((b) => {
          b.disabled = false;
          b.classList.remove('used');
        });
        const fb = card.querySelector('.feedback, .feedback-msg, .feedback-box');
        if (fb) {
          fb.style.display = 'none';
          fb.classList.add('hidden');
        }
      });

      // Reset global score variable if present
      try {
        if (typeof window.score === 'number') window.score = 0;
        const scoreEl = document.getElementById('score-display');
        if (scoreEl && scoreEl.textContent.includes('/')) {
          const total = scoreEl.textContent.split('/')[1].trim();
          scoreEl.textContent = `0 / ${total}`;
        }
      } catch (e) {}
    },

    /**
     * Mounts the Stage 4 & 5 Pro Exam Extension (Set B) & Teacher Classroom Vault
     * at the bottom of Exam Lab & Business English modules to resolve Free vs. Paid value.
     */
    mountProExtensionVault() {
      if (!shouldMountProExtensionVault()) return;
      if (document.getElementById('gm-pro-extension-vault')) return;

      const ext = detectProExtension();
      const unlocked = this.isProContentUnlocked();

      const vault = document.createElement('section');
      vault.id = 'gm-pro-extension-vault';
      vault.setAttribute('aria-label', 'Pro Exam Extension and Teacher Classroom Pack');
      vault.style.cssText = `
        max-width: 896px;
        margin: 36px auto;
        padding: 0 16px;
        font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      `;

      vault.innerHTML = this.renderProExtensionVaultHTML(ext, unlocked);

      const mainEl = document.querySelector('main') || document.querySelector('.container') || document.body;
      const asideAuthor = mainEl.querySelector('aside');
      if (asideAuthor && asideAuthor.parentElement === mainEl) {
        mainEl.insertBefore(vault, asideAuthor);
      } else {
        mainEl.appendChild(vault);
      }

      this.bindProExtensionEvents(vault);
    },

    renderProExtensionVaultHTML(ext, unlocked) {
      const p = ext.previewItem;
      const setBHtml = ext.setBItems.map((item, idx) => `
        <div class="gm-pro-kwt kwt-card" data-valid="${this.escapeHtml(item.valid)}" style="background:#0f172a;border:1px solid #334155;border-radius:16px;padding:18px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
            <span style="font-size:11px;font-weight:800;color:#38bdf8;text-transform:uppercase;letter-spacing:0.05em;">Set B Item ${idx + 2} &bull; ${this.escapeHtml(item.topic)}</span>
            <span style="background:#312e81;color:#c7d2fe;font-family:monospace;font-size:12px;font-weight:800;padding:2px 9px;border-radius:6px;border:1px solid #4f46e5;">${this.escapeHtml(item.keyWord)}</span>
          </div>
          <p style="font-size:13.5px;color:#cbd5e1;margin:0 0 10px 0;"><em>&ldquo;${this.escapeHtml(item.prompt)}&rdquo;</em></p>
          <p style="font-size:14.5px;font-weight:700;color:#f8fafc;margin:0 0 12px 0;line-height:1.6;">
            ${this.escapeHtml(item.stemBefore)}
            <input type="text" class="kwt-input" data-model="${this.escapeHtml(item.model)}" placeholder="3–6 words" aria-label="Set B Transformation ${idx + 2}" style="background:#1e293b;border:1px solid #475569;border-bottom:2px solid #38bdf8;color:#fff;padding:5px 10px;border-radius:6px;font-size:13.5px;font-weight:700;width:230px;max-width:100%;margin:0 4px;">
            ${this.escapeHtml(item.stemAfter)}
          </p>
          <button type="button" class="check-btn gm-pro-check-btn" style="background:#0284c7;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;">Check 2-Mark Answer</button>
          <div class="feedback" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;font-size:12.5px;font-weight:600;"></div>
        </div>
      `).join('');

      const speakingHtml = ext.speakingPrompts.map((sp) => `
        <li style="margin-bottom:8px;color:#e2e8f0;font-size:13.5px;line-height:1.5;">${this.escapeHtml(sp)}</li>
      `).join('');

      const planHtml = ext.lessonPlan.map((step) => `
        <li style="margin-bottom:6px;color:#cbd5e1;font-size:13px;line-height:1.45;">${this.escapeHtml(step)}</li>
      `).join('');

      return `
        <div style="background:linear-gradient(145deg,#090d16 0%,#0f172a 100%);border:2px solid ${unlocked ? '#10b981' : '#38bdf8'};border-radius:24px;padding:28px;color:#f8fafc;box-shadow:0 20px 45px rgba(0,0,0,0.45);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
            <span style="background:${unlocked ? 'rgba(16,185,129,0.18)' : 'rgba(56,189,248,0.16)'};border:1px solid ${unlocked ? '#10b981' : '#38bdf8'};color:${unlocked ? '#6ee7b7' : '#7dd3fc'};font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;text-transform:uppercase;letter-spacing:0.06em;">
              ${unlocked ? '✓ Pro Exam Vault & Teacher Pack Unlocked' : this.escapeHtml(ext.badge)}
            </span>
            <span style="font-size:12px;color:#94a3b8;font-weight:600;">
              ${unlocked ? 'Licensed Classroom / Pro Access Active' : 'Stages 1–3 Free • Stages 4–5 Pro / Teacher License'}
            </span>
          </div>

          <h2 style="font-size:22px;font-weight:800;color:#ffffff;margin:0 0 8px 0;line-height:1.25;">
            ${this.escapeHtml(ext.title)}
          </h2>
          <p style="font-size:14px;color:#cbd5e1;margin:0 0 20px 0;line-height:1.55;">
            Stages 1–3 above are free for independent student practice. Try <strong>Set B Item 1</strong> free below—or unlock the complete <strong>Set B Exam Bank, Mark-Scheme Speaking Cards, 1-Click Answer Key Reveal &amp; 60-Min CELTA Lesson Plan</strong>.
          </p>

          <!-- Free Preview Set B Item 1 -->
          <div class="gm-pro-kwt kwt-card" data-valid="${this.escapeHtml(p.valid)}" style="background:#111c33;border:1px solid #38bdf8;border-radius:16px;padding:18px;margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;">
              <span style="font-size:11px;font-weight:800;color:#6ee7b7;text-transform:uppercase;letter-spacing:0.05em;">★ Free Set B Preview &bull; ${this.escapeHtml(p.topic)}</span>
              <span style="background:#065f46;color:#a7f3d0;font-family:monospace;font-size:12px;font-weight:800;padding:2px 9px;border-radius:6px;">${this.escapeHtml(p.keyWord)}</span>
            </div>
            <p style="font-size:13.5px;color:#cbd5e1;margin:0 0 10px 0;"><em>&ldquo;${this.escapeHtml(p.prompt)}&rdquo;</em></p>
            <p style="font-size:14.5px;font-weight:700;color:#f8fafc;margin:0 0 12px 0;line-height:1.6;">
              ${this.escapeHtml(p.stemBefore)}
              <input type="text" class="kwt-input" data-model="${this.escapeHtml(p.model)}" placeholder="Type 3–5 words..." aria-label="Preview Set B Transformation" style="background:#090d16;border:1px solid #475569;border-bottom:2px solid #10b981;color:#fff;padding:5px 10px;border-radius:6px;font-size:13.5px;font-weight:700;width:230px;max-width:100%;margin:0 4px;">
              ${this.escapeHtml(p.stemAfter)}
            </p>
            <button type="button" class="check-btn gm-pro-check-btn" style="background:#10b981;color:#022c22;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;">Check Preview Item</button>
            <div class="feedback" style="display:none;margin-top:10px;padding:10px 12px;border-radius:8px;font-size:12.5px;font-weight:600;"></div>
          </div>

          ${unlocked ? `
            <!-- UNLOCKED PRO CONTENT -->
            <div style="margin-top:18px;">
              <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px;padding:12px;background:#020617;border:1px solid #1e293b;border-radius:12px;align-items:center;justify-content:space-between;">
                <span style="font-size:12px;font-weight:800;color:#6ee7b7;">⚡ Live Classroom Board Controls:</span>
                <div style="display:flex;flex-wrap:wrap;gap:8px;">
                  <button type="button" id="gm-vault-reveal-btn" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:800;cursor:pointer;">👁️ Reveal All Page Answers</button>
                  <button type="button" id="gm-vault-reset-btn" style="background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;">🔄 Reset All Exercises</button>
                  <button type="button" id="gm-vault-print-btn" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;">🖨️ Print A4 Handout</button>
                </div>
              </div>

              <h3 style="font-size:16px;font-weight:800;color:#38bdf8;margin:0 0 12px 0;">Stage 4: Set B High-Difficulty Exam Transformations</h3>
              ${setBHtml}

              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;margin-top:18px;">
                <div style="background:#020617;border:1px solid #1e293b;border-radius:16px;padding:18px;">
                  <h4 style="font-size:14px;font-weight:800;color:#fbbf24;margin:0 0 10px 0;">🎙️ Stage 5: Mark-Scheme Speaking Prompts</h4>
                  <ul style="margin:0;padding-left:18px;">${speakingHtml}</ul>
                </div>
                <div style="background:#020617;border:1px solid #1e293b;border-radius:16px;padding:18px;">
                  <h4 style="font-size:14px;font-weight:800;color:#a7f3d0;margin:0 0 10px 0;">📋 60-Min CELTA / Corporate Lesson Plan</h4>
                  <ol style="margin:0;padding-left:18px;">${planHtml}</ol>
                </div>
              </div>
            </div>
          ` : `
            <!-- LOCKED GATE OVERLAY -->
            <div style="background:#020617;border:1px dashed #475569;border-radius:18px;padding:22px;text-align:center;">
              <div style="font-size:13px;font-weight:800;color:#fbbf24;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">
                🔒 Locked Pro Exam Vault &amp; Classroom Controls
              </div>
              <p style="font-size:13.5px;color:#cbd5e1;max-width:640px;margin:0 auto 16px auto;line-height:1.5;">
                Unlock <strong>Set B Exam Items 2–4</strong>, <strong>Mark-Scheme Speaking Cards</strong>, <strong>1-Click Reveal All Page Answers</strong>, <strong>Print-Ready A4 Handouts</strong>, and <strong>Clean Screen-Share Mode</strong>.
              </p>

              <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-bottom:18px;">
                <a href="${STRIPE_LINKS.STUDENT_24}" style="background:#10b981;color:#022c22;font-weight:800;font-size:13px;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
                  <span>🎓 Student Full Course Key (£24)</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
                <a href="teacher-vault.html#pricing" style="background:#0284c7;color:#ffffff;font-weight:800;font-size:13px;padding:11px 18px;border-radius:10px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;">
                  <span>💼 Teacher &amp; White-Label License (£49 / £149)</span>
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </div>

              <div style="max-width:440px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:12px;">
                <div style="font-size:11.5px;color:#94a3b8;margin-bottom:8px;font-weight:600;">
                  Already have a Student Course Key (£24) or Teacher License Key (£49/£149)?
                </div>
                <div style="display:flex;gap:6px;">
                  <input type="text" id="gm-inline-vault-key" placeholder="Enter Key (e.g. BORGO-89 or Teacher Key)" aria-label="License or Course Access Key" style="flex:1;background:#020617;border:1px solid #334155;border-radius:8px;padding:8px 10px;color:#fff;font-size:12.5px;font-family:monospace;text-transform:uppercase;">
                  <button type="button" id="gm-inline-vault-unlock-btn" style="background:#38bdf8;color:#082f49;border:none;border-radius:8px;padding:8px 14px;font-size:12.5px;font-weight:800;cursor:pointer;">Unlock</button>
                </div>
                <div id="gm-inline-vault-feedback" style="font-size:12px;margin-top:6px;font-weight:700;"></div>
              </div>
            </div>
          `}
        </div>
      `;
    },

    bindProExtensionEvents(vault) {
      vault.querySelectorAll('.gm-pro-check-btn').forEach((btn) => {
        btn.onclick = () => {
          const card = btn.closest('.gm-pro-kwt');
          if (!card) return;
          const input = card.querySelector('.kwt-input');
          const fb = card.querySelector('.feedback');
          const validList = (card.getAttribute('data-valid') || '').split('|').map((s) => s.trim().toLowerCase());
          const model = input ? input.getAttribute('data-model') || validList[0] : validList[0];
          const userVal = (input ? input.value : '').trim().toLowerCase().replace(/['’]/g, "'").replace(/\s+/g, ' ');
          if (!userVal) return;

          input.disabled = true;
          btn.disabled = true;
          if (validList.includes(userVal)) {
            input.style.borderColor = '#10b981';
            fb.style.background = 'rgba(16, 185, 129, 0.2)';
            fb.style.color = '#6ee7b7';
            fb.textContent = `✓ Full 2 Marks! "${model}" is exact C1/C2 exam register.`;
          } else {
            input.style.borderColor = '#ef4444';
            fb.style.background = 'rgba(239, 68, 68, 0.2)';
            fb.style.color = '#fca5a5';
            fb.textContent = `✗ Expected C1/C2 structure: "${model}"`;
          }
          fb.style.display = 'block';
        };
      });

      const unlockBtn = vault.querySelector('#gm-inline-vault-unlock-btn');
      const keyInput = vault.querySelector('#gm-inline-vault-key');
      const fbEl = vault.querySelector('#gm-inline-vault-feedback');
      if (unlockBtn && keyInput) {
        const handleUnlock = () => {
          const res = this.activateLicense(keyInput.value);
          if (res.ok) {
            if (fbEl) {
              fbEl.style.color = '#6ee7b7';
              fbEl.textContent = '✓ Key verified! Unlocking Set B Exam Bank & Teacher Pack...';
            }
          } else if (fbEl) {
            fbEl.style.color = '#fca5a5';
            fbEl.textContent = '✗ Unrecognized key. Check your confirmation email or Teacher Vault key.';
          }
        };
        unlockBtn.onclick = handleUnlock;
        keyInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleUnlock();
        });
      }

      const revBtn = vault.querySelector('#gm-vault-reveal-btn');
      if (revBtn) {
        revBtn.onclick = () => {
          const n = this.revealAllPageAnswers();
          revBtn.textContent = `✓ Revealed (${n} Items)`;
        };
      }
      const resBtn = vault.querySelector('#gm-vault-reset-btn');
      if (resBtn) {
        resBtn.onclick = () => {
          this.resetAllPageExercises();
          if (revBtn) revBtn.textContent = '👁️ Reveal All Page Answers';
        };
      }
      const prtBtn = vault.querySelector('#gm-vault-print-btn');
      if (prtBtn) {
        prtBtn.onclick = () => window.print();
      }
    },

    syncProExtensionVaultUI() {
      const existing = document.getElementById('gm-pro-extension-vault');
      if (!existing) return;
      const ext = detectProExtension();
      const unlocked = this.isProContentUnlocked();
      existing.innerHTML = this.renderProExtensionVaultHTML(ext, unlocked);
      this.bindProExtensionEvents(existing);
    },

    injectWhiteLabelBanner(wlConfig, isPreview) {
      const existing = document.getElementById('gm-wl-top-banner');
      if (existing) existing.remove();

      const palette = ACCENT_PALETTES[wlConfig.color] || ACCENT_PALETTES.emerald;
      const safeTutor = this.escapeHtml(wlConfig.tutor || 'Licensed Tutor');
      const safeStudio = this.escapeHtml(wlConfig.studio || 'English Coaching Studio');
      const safeCtaLabel = this.escapeHtml(wlConfig.ctaLabel || 'Return to Classroom / Book Session');
      const safeCtaUrl = this.sanitizeUrl(wlConfig.cta);
      const currentPath = (window.location.pathname || '').toLowerCase();
      const isKidsModule = currentPath.includes('professor-west') || currentPath.includes('study');

      const banner = document.createElement('div');
      banner.id = 'gm-wl-top-banner';
      banner.setAttribute('role', 'region');
      banner.setAttribute('aria-label', 'Assigned Classroom Banner');
      banner.style.cssText = `
        background: linear-gradient(90deg, ${palette.bg} 0%, #0f172a 100%);
        border-bottom: 2px solid ${palette.border};
        color: ${palette.text};
        padding: 10px 18px;
        font-family: system-ui, -apple-system, sans-serif;
        position: sticky;
        top: 0;
        z-index: 9990;
        box-shadow: 0 8px 25px rgba(0,0,0,0.45);
      `;

      const ctaHtml = (!isKidsModule && safeCtaUrl)
        ? `<a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer" style="background:${palette.btn};color:${palette.btnText};font-weight:800;font-size:12px;padding:7px 14px;border-radius:999px;text-decoration:none;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;">
             <span>${safeCtaLabel}</span>
             <span aria-hidden="true">&rarr;</span>
           </a>`
        : (isKidsModule ? `<span style="font-size:11px;color:#94a3b8;font-weight:600;">🛡️ 100% Ad-Free Young Learner Mode</span>` : '');

      const previewPill = isPreview
        ? `<a href="teacher-vault.html#pricing" style="background:#f59e0b;color:#1c1917;font-weight:800;font-size:11px;padding:5px 11px;border-radius:6px;text-decoration:none;white-space:nowrap;">
             ⚡ Live Preview Mode — Unlock Studio License (£149) &rarr;
           </a>`
        : `<span style="font-size:11px;color:#94a3b8;font-weight:600;">✓ Licensed Interactive Classroom</span>`;

      banner.innerHTML = `
        <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <span style="background:${palette.badge};color:#fff;font-size:11px;font-weight:800;padding:3px 9px;border-radius:6px;text-transform:uppercase;letter-spacing:0.06em;">
              ${safeStudio}
            </span>
            <span style="font-size:13px;font-weight:700;color:#ffffff;">
              Assigned by <strong style="color:${palette.accent};">${safeTutor}</strong>
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            ${previewPill}
            ${ctaHtml}
          </div>
        </div>
      `;

      document.body.insertBefore(banner, document.body.firstChild);
      this.applyCleanScreenShareDOM(true);
      this.overrideDiagnosticGateForWhiteLabel(wlConfig, palette);
    },

    overrideDiagnosticGateForWhiteLabel(wlConfig, palette) {
      const safeTutor = this.escapeHtml(wlConfig.tutor || 'Your Tutor');
      const safeStudio = this.escapeHtml(wlConfig.studio || 'Language Studio');
      const safeCtaUrl = this.sanitizeUrl(wlConfig.cta) || '#';
      const safeCtaLabel = this.escapeHtml(wlConfig.ctaLabel || `Send Score to ${wlConfig.tutor || 'Your Tutor'}`);
      const currentPath = (window.location.pathname || '').toLowerCase();
      const isKidsModule = currentPath.includes('professor-west') || currentPath.includes('study');

      window.showDiagnosticGate = function (opts) {
        opts = opts || {};
        const gameName = opts.gameName || 'Interactive Skill Test';
        const score = typeof opts.score === 'number' ? opts.score : 0;
        const maxScore = typeof opts.maxScore === 'number' ? opts.maxScore : 10;
        const weakArea = opts.weakArea || 'C1/C2 Linguistic Precision under Time Pressure';
        const examImpact = opts.examImpact || 'Review these items with your tutor in your next session to lock in active recall.';
        const onReplay = typeof opts.onReplay === 'function' ? opts.onReplay : null;
        const pct = Math.max(0, Math.min(100, Math.round((score / (maxScore || 1)) * 100)));
        const cefrEstimate = pct >= 85 ? 'C1 Advanced / C2 Ready' : pct >= 65 ? 'B2 Upper-Intermediate (Borderline C1)' : 'B1/B2 Transition';

        const existing = document.getElementById('gm-diag-overlay');
        if (existing) existing.remove();

        const modalHtml = `
          <div id="gm-diag-overlay" role="dialog" aria-modal="true" aria-label="Homework Completion Report" style="position:fixed;inset:0;background:rgba(10,15,28,0.88);backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;">
            <div style="background:#111827;border:2px solid ${palette.border};border-radius:16px;max-width:540px;width:100%;padding:28px;color:#f9fafb;box-shadow:0 25px 50px -12px rgba(0,0,0,0.7);box-sizing:border-box;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span style="background:${palette.badge};color:#ffffff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.05em;">
                  ${safeStudio} &bull; ${gameName}
                </span>
                <button id="gm-diag-close" type="button" aria-label="Close" style="background:none;border:none;color:#9ca3af;font-size:24px;line-height:1;cursor:pointer;padding:4px;">&times;</button>
              </div>
              <h3 style="font-size:22px;font-weight:800;margin:0 0 8px 0;color:#ffffff;line-height:1.2;">
                Module Complete: ${score}/${maxScore} (${pct}%)
              </h3>
              <p style="margin:0 0 16px 0;font-size:14px;color:#d1d5db;">
                Estimated Performance Band: <strong style="color:${palette.accent};">${cefrEstimate}</strong> &bull; Tutor: <strong>${safeTutor}</strong>
              </p>
              <div style="background:#1f2937;border-left:4px solid ${palette.border};padding:14px;border-radius:8px;margin-bottom:20px;font-size:14px;line-height:1.5;">
                <strong style="color:${palette.accent};display:block;margin-bottom:4px;">Focus Area for Next Lesson: ${weakArea}</strong>
                <span style="color:#e5e7eb;">${examImpact}</span>
              </div>
              <div style="display:grid;gap:10px;">
                ${isKidsModule ? `
                <div style="text-align:center;padding:12px;background:#1e293b;border-radius:10px;color:${palette.accent};font-weight:800;font-size:14px;">
                  ⭐ Fantastic work completing Professor West's Study! Share your stars with your teacher in class!
                </div>
                <button id="gm-diag-replay" type="button" style="background:${palette.btn};color:${palette.btnText};font-size:14px;font-weight:800;cursor:pointer;padding:12px;border-radius:10px;border:none;">
                  &#8635; Play Again to Win More Golden Scarabs!
                </button>
                ` : `
                ${safeCtaUrl !== '#' ? `
                <a href="${safeCtaUrl}" target="_blank" rel="noopener noreferrer"
                   style="display:block;text-align:center;background:${palette.btn};color:${palette.btnText};font-weight:800;padding:14px;border-radius:10px;text-decoration:none;font-size:15px;">
                  ${safeCtaLabel} &rarr;
                </a>` : ''}
                <button id="gm-diag-replay" type="button" style="background:#1f2937;border:1px solid #374151;color:#f9fafb;font-size:14px;font-weight:700;cursor:pointer;padding:11px;border-radius:10px;">
                  &#8635; Practise Again to Beat ${pct}%
                </button>
                `}
              </div>
            </div>
          </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        const overlay = document.getElementById('gm-diag-overlay');
        const closeBtn = document.getElementById('gm-diag-close');
        const replayBtn = document.getElementById('gm-diag-replay');
        if (closeBtn) closeBtn.onclick = () => overlay.remove();
        if (replayBtn) replayBtn.onclick = () => { overlay.remove(); if (onReplay) onReplay(); };
      };
    },

    mountTeacherPresenterHUD(tier) {
      if (document.getElementById('gm-teacher-presenter-hud')) return;
      const currentPath = (window.location.pathname || '').toLowerCase();
      // Do not mount presenter HUD on homepage, lab directory hub, blog, or legal pages
      if (
        currentPath.endsWith('/index.html') ||
        currentPath.endsWith('/lab.html') ||
        currentPath.endsWith('/blog.html') ||
        currentPath === '/' ||
        currentPath.includes('terms.html') ||
        currentPath.includes('privacy-policy.html')
      ) {
        return;
      }

      const guide = detectModuleGuide();
      const cleanEnabled = this.isCleanModeEnabled();
      this.applyCleanScreenShareDOM(cleanEnabled);

      const hud = document.createElement('aside');
      hud.id = 'gm-teacher-presenter-hud';
      hud.setAttribute('aria-label', 'Teacher Presenter Controls');
      hud.style.cssText = `
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 9995;
        font-family: system-ui, -apple-system, sans-serif;
      `;

      hud.innerHTML = `
        <div id="gm-hud-drawer" style="display:none;background:#0f172a;border:1px solid #38bdf8;border-radius:16px;padding:16px;width:350px;max-width:calc(100vw - 32px);color:#f8fafc;box-shadow:0 20px 45px rgba(0,0,0,0.75);margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #1e293b;padding-bottom:10px;margin-bottom:12px;">
            <div>
              <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#38bdf8;display:block;">
                ${tier === 'studio' ? '★ White-Label Studio HUD' : '✓ Solo Tutor Presenter HUD'}
              </span>
              <strong style="font-size:13px;color:#fff;">${guide.title}</strong>
            </div>
            <button type="button" id="gm-hud-minimize" aria-label="Minimize Teacher HUD" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;border-radius:6px;padding:3px 8px;cursor:pointer;font-size:12px;">Hide</button>
          </div>

          <!-- Classroom Countdown Timer -->
          <div style="background:#020617;border:1px solid #1e293b;border-radius:10px;padding:10px 12px;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div>
              <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Class Drill Timer</div>
              <div id="gm-hud-timer-display" style="font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;color:#fbbf24;">15:00</div>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
              <button type="button" id="gm-hud-timer-start" style="background:#0284c7;color:#fff;border:none;border-radius:6px;padding:5px 9px;font-size:11px;font-weight:700;cursor:pointer;">Start</button>
              <button type="button" id="gm-hud-timer-5m" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:6px;padding:5px 7px;font-size:11px;cursor:pointer;">5m</button>
              <button type="button" id="gm-hud-timer-15m" style="background:#1e293b;color:#cbd5e1;border:1px solid #334155;border-radius:6px;padding:5px 7px;font-size:11px;cursor:pointer;">15m</button>
            </div>
          </div>

          <!-- Mark-Scheme Briefing & Teaching Notes -->
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;font-weight:800;color:#6ee7b7;margin-bottom:6px;">
              📋 Teaching &amp; Mark-Scheme Notes (${guide.timing}):
            </div>
            <ul style="margin:0;padding-left:16px;font-size:11.5px;color:#cbd5e1;line-height:1.45;display:grid;gap:6px;">
              ${guide.notes.map(n => `<li>${n}</li>`).join('')}
            </ul>
          </div>

          <!-- Live Board Controls (Reveal Answers / Reset / Print) -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:7px;">
            <button type="button" id="gm-hud-reveal-all" style="background:#059669;color:#fff;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:800;cursor:pointer;">
              👁️ Reveal Answers
            </button>
            <button type="button" id="gm-hud-reset-board" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;">
              🔄 Reset Board
            </button>
          </div>

          <!-- Action Controls -->
          <div style="display:grid;gap:7px;">
            <button type="button" id="gm-hud-clean-toggle" aria-pressed="${cleanEnabled}" style="background:${cleanEnabled ? '#059669' : '#1e293b'};color:#fff;border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:8px 10px;font-size:11.5px;font-weight:700;cursor:pointer;text-align:center;">
              ${cleanEnabled ? '✓ Clean Screen-Share: ON' : 'Clean Screen-Share: OFF'}
            </button>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
              <button type="button" id="gm-hud-copy-hw" style="background:#2563eb;color:#fff;border:none;border-radius:8px;padding:8px;font-size:11px;font-weight:700;cursor:pointer;">
                🔗 Copy Student Link
              </button>
              <a href="teacher-vault.html" style="background:#1e293b;color:#e2e8f0;border:1px solid #334155;border-radius:8px;padding:8px;font-size:11px;font-weight:700;text-decoration:none;text-align:center;">
                ⚙️ Studio Vault
              </a>
            </div>
          </div>
        </div>

        <button type="button" id="gm-hud-pill-btn" style="background:linear-gradient(135deg,#0284c7,#0f172a);color:#ffffff;border:1px solid #38bdf8;border-radius:999px;padding:9px 15px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;">
          <span>🎓 Teacher HUD</span>
          <span id="gm-hud-pill-timer" style="background:rgba(0,0,0,0.35);padding:2px 7px;border-radius:99px;color:#fbbf24;font-variant-numeric:tabular-nums;">15:00</span>
        </button>
      `;

      document.body.appendChild(hud);

      const drawer = document.getElementById('gm-hud-drawer');
      const pillBtn = document.getElementById('gm-hud-pill-btn');
      const minBtn = document.getElementById('gm-hud-minimize');
      const cleanBtn = document.getElementById('gm-hud-clean-toggle');
      const copyHwBtn = document.getElementById('gm-hud-copy-hw');
      const revealBtn = document.getElementById('gm-hud-reveal-all');
      const resetBtn = document.getElementById('gm-hud-reset-board');
      const startBtn = document.getElementById('gm-hud-timer-start');
      const btn5m = document.getElementById('gm-hud-timer-5m');
      const btn15m = document.getElementById('gm-hud-timer-15m');

      const updateTimerUI = () => {
        const m = String(Math.floor(this.timerSeconds / 60)).padStart(2, '0');
        const s = String(this.timerSeconds % 60).padStart(2, '0');
        const str = `${m}:${s}`;
        const d1 = document.getElementById('gm-hud-timer-display');
        const d2 = document.getElementById('gm-hud-pill-timer');
        if (d1) d1.textContent = str;
        if (d2) d2.textContent = str;
      };

      pillBtn.onclick = () => {
        drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
      };
      minBtn.onclick = () => {
        drawer.style.display = 'none';
      };
      cleanBtn.onclick = () => {
        this.setCleanMode(!this.isCleanModeEnabled());
      };
      if (revealBtn) {
        revealBtn.onclick = () => {
          const count = this.revealAllPageAnswers();
          revealBtn.textContent = `✓ Revealed (${count})`;
          setTimeout(() => { revealBtn.textContent = '👁️ Reveal Answers'; }, 2500);
        };
      }
      if (resetBtn) {
        resetBtn.onclick = () => {
          this.resetAllPageExercises();
          resetBtn.textContent = '✓ Board Reset!';
          setTimeout(() => { resetBtn.textContent = '🔄 Reset Board'; }, 2000);
        };
      }
      copyHwBtn.onclick = () => {
        const file = window.location.pathname.split('/').pop() || 'index.html';
        const hwUrl = this.buildSignedHomeworkUrl(file);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(hwUrl);
        }
        copyHwBtn.textContent = '✓ Link Copied!';
        copyHwBtn.style.background = '#059669';
        setTimeout(() => {
          copyHwBtn.textContent = '🔗 Copy Student Link';
          copyHwBtn.style.background = '#2563eb';
        }, 2000);
      };

      startBtn.onclick = () => {
        if (this.timerRunning) {
          clearInterval(this.timerInterval);
          this.timerRunning = false;
          startBtn.textContent = 'Resume';
        } else {
          this.timerRunning = true;
          startBtn.textContent = 'Pause';
          this.timerInterval = setInterval(() => {
            if (this.timerSeconds > 0) {
              this.timerSeconds--;
              updateTimerUI();
            } else {
              clearInterval(this.timerInterval);
              this.timerRunning = false;
              startBtn.textContent = 'Done!';
            }
          }, 1000);
        }
      };
      btn5m.onclick = () => {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerSeconds = 300;
        startBtn.textContent = 'Start';
        updateTimerUI();
      };
      btn15m.onclick = () => {
        clearInterval(this.timerInterval);
        this.timerRunning = false;
        this.timerSeconds = 900;
        startBtn.textContent = 'Start';
        updateTimerUI();
      };
    },

    escapeHtml(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    sanitizeUrl(url) {
      const clean = String(url || '').trim();
      if (!clean || clean === 'https://') return '';
      if (/^https?:\/\//i.test(clean) || /^mailto:/i.test(clean)) return clean;
      return '';
    },

    initPageRuntime() {
      const params = new URLSearchParams(window.location.search);

      // 1. Check direct license unlock via URL parameter (?teacher_key=...)
      const keyParam = params.get('teacher_key');
      if (keyParam) {
        const res = this.activateLicense(keyParam);
        if (res.ok) {
          params.delete('teacher_key');
          const cleanSearch = params.toString();
          const newUrl = window.location.pathname + (cleanSearch ? '?' + cleanSearch : '') + window.location.hash;
          window.history.replaceState({}, document.title, newUrl);
        }
      }

      // 2. Mount the Stage 4 & 5 Pro Exam Extension (Set B) & Teacher Pack Vault on Lab modules
      this.mountProExtensionVault();

      // 3. Check if this page was opened via a White-Label Student Homework URL (?wl=1)
      if (params.get('wl') === '1') {
        const tutor = params.get('tutor') || 'Licensed Tutor';
        const studio = params.get('studio') || 'English Coaching Studio';
        const cta = params.get('cta') || '';
        const ctaLabel = params.get('cta_label') || 'Return to Classroom / Book Session';
        const color = params.get('color') || 'emerald';
        const sig = params.get('sig') || '';
        const isPreview = params.get('wl_preview') === '1';

        const isValidSigned = verifyHomeworkSig(sig, tutor, studio, cta, window.location.pathname);
        if (isValidSigned) {
          // Unlock ONLY this assigned page in memory—never persist full-course unlock to localStorage
          window.__GM_SIGNED_HOMEWORK_PAGE_UNLOCK = true;
          if (window.DarkAcademiaGate && typeof window.DarkAcademiaGate.syncUI === 'function') {
            window.DarkAcademiaGate.syncUI();
          }
          this.syncProExtensionVaultUI();
          this.injectWhiteLabelBanner({ tutor, studio, cta, ctaLabel, color }, false);
          return;
        } else if (isPreview) {
          this.injectWhiteLabelBanner({ tutor, studio, cta, ctaLabel, color }, true);
          this.mountTeacherPresenterHUD('studio');
          return;
        }
      }

      // 4. Check if the browser holds an active Teacher License (Solo or Studio)
      const license = this.getLicenseState();
      if (license.active) {
        this.mountTeacherPresenterHUD(license.tier);
      }
    }
  };

  window.GarethTeacherWhiteLabel = GarethTeacherWhiteLabel;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => GarethTeacherWhiteLabel.initPageRuntime());
  } else {
    GarethTeacherWhiteLabel.initPageRuntime();
  }
})();
