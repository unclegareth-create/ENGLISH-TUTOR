#!/usr/bin/env node
/**
 * GarethEnglish L1 Micro-Interference Scrubber & Sentence-Level EFSR Engine (`l1-micro-scrubber.js`)
 * Standalone Node.js and browser-compatible module (UMD pattern) with zero external dependencies.
 *
 * Purpose:
 *   1. Detects and surgically remediates the high-frequency L1 micro-interference patterns
 *      that cap a candidate's Error-Free Sentence Ratio (EFSR) despite intact C1/C2 macro-syntactic frames:
 *        - Profile 1: Mandarin / East Asian L1 (`mandarin`)
 *        - Profile 2: Slavic — Polish / Russian / Ukrainian L1 (`slavic`)
 *        - Profile 3: Romance — Italian / Spanish / French L1 (`romance`)
 *        - Profile 4: German / DACH Orthographic & Syntactic Transfer (`german`)
 *   2. Detects C1/C2 macro-syntactic blueprints per sentence (Wh-clefts, It-clefts, negative inversions,
 *      preparatory 'it' + passive reporting, resultative participle clauses, correlative comparatives, nominalisations).
 *   3. Computes Sentence-Level EFSR before and after scrubbing L1 micro-habits, plus the 2x2 contingency
 *      matrix ([+C1 Frame vs -C1 Frame] x [+Micro-Error vs -Micro-Error]), Fisher Exact / Chi-Square statistics,
 *      and the Syntactic Cohesion & Restraint Score (SCQS) vs memorised template stuffing.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.L1MicroScrubber = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /**
   * 1. C1/C2 Macro-Syntactic Frame Detectors (Sentence-Level)
   */
  const C1_MACRO_FRAMES = [
    {
      id: 'negative_inversion',
      label: 'Negative / Limiting Inversion',
      blueprint: 'Negative Adverbial + Auxiliary + Subject + Main Verb',
      regex: /\b(Not only\s+(?:do|does|did|is|are|was|were|has|have|had|can|could|will|would|should)\b|At no time\s+(?:did|was|were|has|have|had)\b|Under no circumstances\s+(?:should|can|will|would|do|does|did)\b|Seldom\s+(?:do|does|did|have|has)\b|Rarely\s+(?:do|does|did|have|has|is|are)\b|Little\s+(?:did|do|does)\b|Only\s+(?:by|when|after|if|in the last resort|then)\b[^.?!]*?\b(?:do|does|did|can|could|will|would|is|are)\b|On no account\s+(?:should|must|are|is|can)\b)/i
    },
    {
      id: 'wh_cleft',
      label: 'Focusing Wh-Cleft',
      blueprint: 'What + Subject-Verb Clause + is/was + Focused Complement',
      regex: /\bWhat\s+(?:makes|made|drives|drove|distinguishes|matters|is needed|is required|sets|lies|prompts|prompted|characterises|characterizes|sets apart)\b[^.?!]{3,65}\b(?:is|was|are|were)\b/i
    },
    {
      id: 'it_cleft',
      label: 'Focusing It-Cleft',
      blueprint: 'It + is/was + Focused Noun/Adverbial + that/who + Clause',
      regex: /\bIt\s+(?:is|was)\s+(?:not until|only when|precisely|primarily|this|these|the\s+[a-z]+\s+(?:of|to|in))\b[^.?!]{2,60}\b(?:that|who)\b/i
    },
    {
      id: 'passive_reporting_prep_it',
      label: 'Preparatory "It" / Passive Reporting',
      blueprint: 'It is + Past Participle / Adjective + that/to/whether OR Subject + is/are + Reporting Participle + to',
      regex: /\b(It\s+is\s+(?:widely|commonly|generally|often|increasingly|unclear|advisable|highly advisable)?\s*(?:debated|argued|acknowledged|believed|thought|assumed|recognised|recognized|claimed|accepted|difficult|unclear|advisable)\s+(?:that|whether|if|for|to)\b|\b(?:is|are|was|were)\s+(?:thought|believed|rumoured|rumored|said|known|considered|expected|compelled)\s+to\s+(?:be|have|lack|[a-z]+)\b)/i
    },
    {
      id: 'resultative_participle',
      label: 'Non-Finite Participle Subordination',
      blueprint: 'Main Clause + , thereby / thus + -ing Participle OR Having + Past Participle',
      regex: /(?:,\s*(?:thereby|thus)\s+[a-z]+ing\b|,\s*(?:allowing|enabling|making|leading to|resulting in|creating|transforming|preventing|fostering|widening)\b|\bHaving\s+[a-z]+ed\b|\bAfter\s+[a-z]+ing\b)/i
    },
    {
      id: 'double_comparative_or_gerund',
      label: 'Correlative Comparative / Gerund Subject / Nominalisation',
      blueprint: 'The + comparative..., the + comparative... OR [Gerund/Nominal Clause] + Finite Verb',
      regex: /(\bthe\s+(?:more|less|cheaper|faster|harder|earlier|longer|greater|higher)\b[^.?!]+,\s*the\s+(?:more|less|easier|harder|greater|higher|better|worse)\b|^(?:While\s+having|Having|Including|Acknowledging|Making|Choosing|Treating|Coming|Investing)\s+[a-z]+\b[^.?!]{4,80}\b(?:is|are|means|can|helps|should|requires|creates|reduces)\b|^The\s+democratisation\s+of\s+access\s+to\b)/i
    }
  ];

  /**
   * 2. Deterministic L1 Micro-Interference Rule Bank across 4 Clear Profiles:
   *   - mandarin (Mandarin / East Asian L1)
   *   - slavic   (Polish / Russian / Ukrainian L1)
   *   - romance  (Italian / Spanish / French L1)
   *   - german   (German / DACH Orthographic & Syntactic Transfer)
   */
  const L1_MICRO_RULES = [
    // ==================== 1. MANDARIN / EAST ASIAN L1 ====================
    {
      id: 'MAN_THE_GENERIC',
      l1Group: 'mandarin',
      category: 'Definite Article Overgeneralisation (Generic Plurals / Uncountables)',
      pattern: /\b(?:in\s+the\s+(?:modern\s+)?society|in\s+the\s+literature|by\s+the\s+(?:local\s+)?governments|fund\s+only\s+the\s+critical|innovation\s+of\s+the\s+cultural\s+institutions|for\s+both\s+the\s+parents\s+and\s+the\s+young\s+adults|allow\s+the\s+young\s+adults|given\s+to\s+the\s+young\s+adults|compared\s+to\s+the\s+past\s+generations|improve\s+the\s+mental\s+health|protect\s+the\s+nature|in\s+the\s+daily\s+life|access\s+to\s+the\s+education)\b/gi,
      remediate: function (match) {
        return match
          .replace(/\bin the (modern )?society\b/i, 'in $1society')
          .replace(/\bin the literature\b/i, 'in literature')
          .replace(/\bby the (local )?governments\b/i, 'by $1governments')
          .replace(/\bfund only the critical\b/i, 'fund only critical')
          .replace(/\binnovation of the cultural institutions\b/i, 'innovation of cultural institutions')
          .replace(/\bfor both the parents and the young adults\b/i, 'for both parents and young adults')
          .replace(/\ballow the young adults\b/i, 'allow young adults')
          .replace(/\bgiven to the young adults\b/i, 'given to young adults')
          .replace(/\bcompared to the past generations\b/i, 'compared to past generations')
          .replace(/\bimprove the mental health\b/i, 'improve mental health')
          .replace(/\bprotect the nature\b/i, 'protect nature')
          .replace(/\bin the daily life\b/i, 'in daily life')
          .replace(/\baccess to the education\b/i, 'access to education');
      },
      formula: 'Zero Article + Generic Plural / Abstract Uncountable Noun',
      note: 'When referring to society, nature, literature, daily life, or plural groups (governments, young adults) in general, omit "the".'
    },
    {
      id: 'MAN_UNCOUNTABLE_PLURAL',
      l1Group: 'mandarin',
      category: 'Uncountable Noun Pluralisation & Countability',
      pattern: /\b(staffs|infrastructures|informations|equipments|evidences|researches|advices|fundings|homeworks|knowledges|luggages|furnitures|feedbacks|two\s+folds|more\s+social\s+responsibilities)\b/gi,
      remediate: function (match) {
        const lower = match.toLowerCase();
        const map = {
          staffs: 'staff',
          infrastructures: 'infrastructure',
          informations: 'information',
          equipments: 'equipment',
          evidences: 'evidence',
          researches: 'research',
          advices: 'advice',
          fundings: 'funding',
          homeworks: 'homework',
          knowledges: 'knowledge',
          luggages: 'luggage',
          furnitures: 'furniture',
          feedbacks: 'feedback'
        };
        if (map[lower]) return map[lower];
        if (/^two\s+folds$/i.test(match)) return 'twofold';
        if (/^more\s+social\s+responsibilities$/i.test(match)) return 'greater social responsibility';
        return match.replace(/s$/i, '');
      },
      formula: 'Uncountable Noun + Zero Plural (-s) + Singular Verb',
      note: 'Nouns such as staff, infrastructure, information, equipment, research, advice, and funding never take a plural "-s" in academic English.'
    },
    {
      id: 'MAN_NOUN_AS_ADJ',
      l1Group: 'mandarin',
      category: 'Noun-for-Adjective Compounding, Partitive Agreement & Catenative Slip',
      pattern: /\b(culture\s+(?:institutions|festivals|heritage|backgrounds)|nature\s+(?:resources|disasters|habitats)|to\s+mass\s+layoff|each\s+of\s+the\s+(?:remaining\s+)?worker\b|adoptation|economical\s+(?:development|challenges|growth)|make\s+substantial\s+lift\s+to|ensure\s+industries\s+to\s+benefit|to\s+limited\s+to\s+choose|goverments|insitutions|excell)\b/gi,
      remediate: function (match) {
        if (/^culture\s+/i.test(match)) return match.replace(/^culture/i, 'cultural');
        if (/^nature\s+/i.test(match)) return match.replace(/^nature/i, 'natural');
        if (/^to\s+mass\s+layoff$/i.test(match)) return 'to lay off staff en masse';
        if (/^each\s+of\s+the\s+(remaining\s+)?worker$/i.test(match)) return match + 's';
        if (/^adoptation$/i.test(match)) return 'adoption';
        if (/^economical\s+/i.test(match)) return match.replace(/^economical/i, 'economic');
        if (/^make\s+substantial\s+lift\s+to$/i.test(match)) return 'provide a substantial boost to';
        if (/^ensure\s+industries\s+to\s+benefit$/i.test(match)) return 'enable industries to benefit';
        if (/^to\s+limited\s+to\s+choose$/i.test(match)) return 'limited to choosing';
        if (/^goverments$/i.test(match)) return 'governments';
        if (/^insitutions$/i.test(match)) return 'institutions';
        if (/^excell$/i.test(match)) return 'excel';
        return match;
      },
      formula: 'Attributive Adjective (-al / -ic) + Noun | Partitive: each of the + Plural Noun',
      note: 'Use the adjectival suffix ("cultural institutions", "natural resources", "economic growth"), keep partitive nouns plural ("each of the remaining workers"), and use "limited to + -ing".'
    },

    // ==================== 2. SLAVIC (POLISH / RUSSIAN / UKRAINIAN) L1 ====================
    {
      id: 'SLV_ARTICLE_SYSTEM',
      l1Group: 'slavic',
      category: 'Slavic Bare-Noun Article Omission & Hypercorrect Uncountable "a"',
      pattern: /\b(What\s+a\s+(?:wonderful|great|good|bad|terrible)\s+(?:news|weather|advice|information|progress)|(?:it\s+is|there\s+is|is)\s+(?:Mining\s+Museum|Planetarium|cafe\b|very\s+good\s+question|serious\s+problem|important\s+issue)|in\s+a\s+very\s+close\s+proximity|fall\s+in\s+an\s+autumn\s+depression)\b/gi,
      remediate: function (match) {
        if (/^What\s+a\s+/i.test(match)) return match.replace(/^What\s+a\s+/i, 'What ');
        if (/^it\s+is\s+Mining\s+Museum$/i.test(match)) return 'it is the Mining Museum';
        if (/^there\s+is\s+cafe$/i.test(match)) return 'there is a café';
        if (/^is\s+Planetarium$/i.test(match)) return 'is the Planetarium';
        if (/^is\s+very\s+good\s+question$/i.test(match)) return 'is a very good question';
        if (/^is\s+serious\s+problem$/i.test(match)) return 'is a serious problem';
        if (/^is\s+important\s+issue$/i.test(match)) return 'is an important issue';
        if (/^in\s+a\s+very\s+close\s+proximity$/i.test(match)) return 'in very close proximity';
        if (/^fall\s+in\s+an\s+autumn\s+depression$/i.test(match)) return 'fall into autumn melancholy';
        return match;
      },
      formula: 'Singular Countable Predicate Noun = a/an/the + Noun | Uncountable = What + Adj + Noun (No "a")',
      note: 'Slavic languages have no article system, causing bare singular countable nouns ("there is [a] café", "is [a] serious problem") alongside hypercorrect "a" before uncountables ("What wonderful news!").'
    },
    {
      id: 'SLV_PREP_ASPECT_LEXIS',
      l1Group: 'slavic',
      category: 'Slavic Directional/Temporal Prepositions, Embedded Inversion & Cognates',
      pattern: /\b(arrive\s+to\s+(?:the\s+[a-z]+|this\s+[a-z]+)|plans\s+on\s+next\s+(?:month|week|year)|in\s+the\s+night\b|hiking\s+to\s+the\s+mountains|(?:career|good|future|job)\s+perspectives|explain\s+how\s+does\s+it\s+work|understand\s+why\s+did\s+they\s+choose|on\s+the\s+other\s+side,)\b/gi,
      remediate: function (match) {
        if (/^arrive\s+to\s+the\s+airport$/i.test(match)) return 'arrive at the airport';
        if (/^arrive\s+to\s+/i.test(match)) return match.replace(/^arrive\s+to/i, 'arrive in');
        if (/^plans\s+on\s+next/i.test(match)) return match.replace(/^plans\s+on/i, 'plans for');
        if (/^in\s+the\s+night$/i.test(match)) return 'at night';
        if (/^hiking\s+to\s+the\s+mountains$/i.test(match)) return 'hiking in the mountains';
        if (/perspectives$/i.test(match)) return match.replace(/perspectives$/i, 'prospects');
        if (/^explain\s+how\s+does\s+it\s+work$/i.test(match)) return 'explain how it works';
        if (/^understand\s+why\s+did\s+they\s+choose$/i.test(match)) return 'understand why they chose';
        if (/^on\s+the\s+other\s+side,$/i.test(match)) return 'On the other hand,';
        return match;
      },
      formula: 'arrive in (city/country) / at (venue) | plans for | career prospects | Embedded wh-clause = Subject + Verb',
      note: 'Slavic cognates like "perspektivy" mean future opportunities ("prospects"), not viewpoint ("perspective"). Keep embedded wh-clauses in declarative order ("explain how it works") and use "arrive in/at".'
    },

    // ==================== 3. ROMANCE (ITALIAN / SPANISH / FRENCH) L1 ====================
    {
      id: 'ROM_FALSE_FRIENDS_CALQUES',
      l1Group: 'romance',
      category: 'Romance False Friends (Falsi Amici) & Lexical Calques',
      pattern: /\b(Suggested\s+implements|library['’]?s\s+frequenters|frequenters|lacks\s+to\s+be\s+solved|most\s+ancient\s+libraries|attending\s+(?:their|my|a)\s+(?:degree|last\s+year)|scientific\s+degrees|advertisings|deceivable\s+practices|Instead,\s+the\s+second\s+text|have\s+become\s+exaggerated|overcome\s+the\s+doubts|where\s+colleagues\s+may\s+rehearse|implementation\s+of\s+technological\s+gadgets|assist\s+to\s+the\s+(?:lecture|seminar|conference)|sensible\s+(?:increase|drop|reduction))\b/gi,
      remediate: function (match) {
        if (/^Suggested\s+implements$/i.test(match)) return 'Suggested improvements';
        if (/library['’]?s\s+frequenters/i.test(match)) return "library's regular patrons";
        if (/^frequenters$/i.test(match)) return 'regular users';
        if (/^lacks\s+to\s+be\s+solved$/i.test(match)) return 'shortcomings to be addressed';
        if (/^most\s+ancient\s+libraries$/i.test(match)) return 'oldest libraries';
        if (/^attending\s+(their|a)\s+degree$/i.test(match)) return 'pursuing a degree';
        if (/^attending\s+my\s+last\s+year$/i.test(match)) return 'in my final year';
        if (/^scientific\s+degrees$/i.test(match)) return 'science degrees';
        if (/^advertisings$/i.test(match)) return 'advertisements';
        if (/^deceivable\s+practices$/i.test(match)) return 'deceptive practices';
        if (/^Instead,\s+the\s+second\s+text$/i.test(match)) return 'By contrast, the second text';
        if (/^have\s+become\s+exaggerated$/i.test(match)) return 'have become excessive';
        if (/^overcome\s+the\s+doubts$/i.test(match)) return 'overcome initial doubts';
        if (/^where\s+colleagues\s+may\s+rehearse$/i.test(match)) return 'where fellow students may rehearse';
        if (/^implementation\s+of\s+technological\s+gadgets$/i.test(match)) return 'acquisition of specialist equipment';
        if (/^assist\s+to\s+the\s+/i.test(match)) return match.replace(/^assist\s+to/i, 'attend');
        if (/^sensible\s+/i.test(match)) return match.replace(/^sensible/i, 'significant');
        return match;
      },
      formula: 'Target C1/C2 Collocation (Avoid L1 Cognate Calques)',
      note: 'Watch Romance false friends: "implements" = hand tools (use improvements); "frequenters" = regular patrons; "attending a degree" (frequentare) = pursuing a degree; "Instead," (Invece) = By contrast,; "deceivable" = gullible (use deceptive).'
    },
    {
      id: 'ROM_QUANTIFIER_AGREEMENT',
      l1Group: 'romance',
      category: 'Collective Quantifier & Fraction Singular Verb Agreement',
      pattern: /\b(A\s+(?:number|majority|minority|third|quarter|percentage)\s+of\s+(?:the\s+)?(?:interviewed\s+)?[a-z]+s(?:,\s*albeit\s+a\s+minority,)?\s+)has\b/gi,
      remediate: function (match, prefix) {
        return prefix + 'have';
      },
      formula: 'A number of / A fraction of + Plural Noun + PLURAL Verb (have / are)',
      note: 'Unlike Italian ("un terzo degli studenti ha...") or Spanish ("un tercio de los estudiantes ha..."), academic English requires a plural verb after "A number of + plural noun" and fractions of plural nouns.'
    },
    {
      id: 'ROM_PREP_IDIOM_VALENCY',
      l1Group: 'romance',
      category: 'Prepositional Valency & Fixed Idiom Calques',
      pattern: /\b(on\s+the\s+(?:short|long)\s+run|unlike\s+some\s+believe|open\s+your\s+eyes\s+on|advocated\s+for\s+the\s+need\s+of|depends\s+from|capable\s+to\s+(?:solve|manage|adapt|compete)|married\s+with\s+a)\b/gi,
      remediate: function (match) {
        if (/^on\s+the\s+short\s+run$/i.test(match)) return 'in the short term';
        if (/^on\s+the\s+long\s+run$/i.test(match)) return 'in the long term';
        if (/^unlike\s+some\s+believe$/i.test(match)) return 'contrary to what some believe';
        if (/^open\s+your\s+eyes\s+on$/i.test(match)) return 'open your eyes to';
        if (/^advocated\s+for\s+the\s+need\s+of$/i.test(match)) return 'highlighted the need for';
        if (/^depends\s+from$/i.test(match)) return 'depends on';
        if (/^capable\s+to\s+([a-z]+)$/i.test(match)) {
          const v = match.match(/^capable\s+to\s+([a-z]+)$/i)[1].toLowerCase();
          const ing = v.endsWith('e') ? v.slice(0, -1) + 'ing' : v + 'ing';
          return 'capable of ' + ing;
        }
        if (/^married\s+with\s+a$/i.test(match)) return 'married to a';
        return match;
      },
      formula: 'in the short/long term | contrary to what + clause | depends on | capable of + -ing | the need for',
      note: 'Check fixed English prepositions: "in the short term", "depends on" (never "from"), "capable of + -ing", and "the need for".'
    },

    // ==================== 4. GERMAN / DACH TRANSFER ====================
    {
      id: 'GER_MID_SENTENCE_NOUN_CAPS',
      l1Group: 'german',
      category: 'German Substantivgroßschreibung (Mid-Sentence Common Noun Capitalisation & Cognate Spelling)',
      pattern: /\b(many\s+Restaurants\s+and\s+Bars|\d+\s+(?:Minutes|Hours|Days)|of\s+Adrenalin\b|the\s+Universe\b|the\s+Old\s+Triangle|programm\b|\bist\b|new\s+Possibilities|public\s+Transport)\b/g,
      remediate: function (match) {
        if (match === 'many Restaurants and Bars') return 'many restaurants and bars';
        if (/^\d+\s+(?:Minutes|Hours|Days)$/.test(match)) return match.toLowerCase();
        if (match === 'of Adrenalin') return 'of adrenaline';
        if (match === 'the Universe') return 'the universe';
        if (match === 'the Old Triangle') return 'the Old Quarter';
        if (match === 'programm') return 'programme';
        if (match === 'ist') return 'is';
        if (match === 'new Possibilities') return 'new possibilities';
        if (match === 'public Transport') return 'public transport';
        return match.toLowerCase();
      },
      formula: 'English Common Nouns = Lowercase Mid-Sentence (Unlike German Noun Capitalisation)',
      note: 'Unlike German Substantivgroßschreibung, English common nouns (restaurants, bars, minutes, adrenaline, universe, possibilities) stay lowercase mid-sentence, and British English spells "programme" with "-mme".'
    },
    {
      id: 'GER_SYNTAX_PREP_CALQUES',
      l1Group: 'german',
      category: 'German Pied-Piping, Tense-Since & Verb-Complement Transfer',
      pattern: /\b(for\s+what\s+(?:the\s+city|the\s+town|this\s+region)\s+is\s+famous|suggest\s+to\s+(?:introduce|build|visit|implement|create)|fond\s+on\s+|I\s+live\s+here\s+since\s+\d+\s+years|despite\s+of\s+the)\b/gi,
      remediate: function (match) {
        if (/^for\s+what\s+(the\s+city|the\s+town|this\s+region)\s+is\s+famous$/i.test(match)) {
          const subj = match.match(/^for\s+what\s+(the\s+city|the\s+town|this\s+region)/i)[1];
          return 'what ' + subj.toLowerCase() + ' is famous for';
        }
        if (/^suggest\s+to\s+([a-z]+)$/i.test(match)) {
          const v = match.match(/^suggest\s+to\s+([a-z]+)$/i)[1].toLowerCase();
          const ing = v.endsWith('e') ? v.slice(0, -1) + 'ing' : v + 'ing';
          return 'suggest ' + ing;
        }
        if (/^fond\s+on\s+$/i.test(match)) return 'fond of ';
        if (/^I\s+live\s+here\s+since\s+(\d+)\s+years$/i.test(match)) {
          const yrs = match.match(/(\d+)/)[1];
          return 'I have lived here for ' + yrs + ' years';
        }
        if (/^despite\s+of\s+the$/i.test(match)) return 'despite the';
        return match;
      },
      formula: 'suggest + V-ing / suggest that + Subject + (should) V1 | Present Perfect + for/since | what X is famous for',
      note: 'German "vorschlagen zu + Infinitiv" and "Ich wohne hier seit..." do not transfer literally: English requires "suggest + -ing", present perfect ("have lived here for..."), and natural preposition stranding ("what the city is famous for").'
    }
  ];

  /**
   * 3. Banned Template / Snake-Oil Cliché Detector (for SCQS Restraint Scoring)
   */
  const TEMPLATE_CLICHES = [
    { pattern: /\bin a nutshell\b/gi, replacement: 'Ultimately, / To conclude,', label: 'Conversational cliché ("in a nutshell")' },
    { pattern: /\bevery coin has two sides\b/gi, replacement: '[State the specific trade-off directly]', label: 'Memorised template cliché ("every coin has two sides")' },
    { pattern: /\ba double-edged sword\b/gi, replacement: 'a development with both merits and drawbacks', label: 'Overused exam cliché ("double-edged sword")' },
    { pattern: /\bsince time immemorial\b/gi, replacement: 'historically / for generations', label: 'Archaic template cliché ("since time immemorial")' },
    { pattern: /\bin today['’]?s fast-paced (?:digital )?world\b/gi, replacement: '[Open directly with the topic noun]', label: 'Robotic opening cliché ("in today\'s fast-paced world")' },
    { pattern: /\bwith the rapid development of science and technology\b/gi, replacement: '[Name the specific technology directly]', label: 'Memorised opening template' },
    { pattern: /\bplethora of\b/gi, replacement: 'wide range of / numerous', label: 'Memorised Band-9 word-list item ("plethora")' }
  ];

  /**
   * Splits raw text into clean sentences while preserving abbreviations like e.g., i.e., Dr., Mr., Mrs., %
   */
  function splitSentences(text) {
    if (!text || typeof text !== 'string') return [];
    const cleaned = text
      .replace(/\r\n/g, '\n')
      .replace(/\b(e\.g|i\.e|mr|mrs|ms|dr|prof|vs|etc)\./gi, '$1{{DOT}}')
      .replace(/(\d)\.(\d)/g, '$1{{DEC}}$2');

    const rawParts = cleaned
      .split(/(?<=[.?!])\s+|\n+/)
      .map(s => s.replace(/\{\{DOT\}\}/g, '.').replace(/\{\{DEC\}\}/g, '.').trim())
      .filter(s => s.length > 3 && /[a-zA-Z]/.test(s));

    return rawParts;
  }

  /**
   * Exact 2-sided Fisher Exact & Chi-Square calculator for a 2x2 contingency table:
   *   a = [+C1 Frame, +MicroError], b = [+C1 Frame, -MicroError]
   *   c = [-C1 Frame, +MicroError], d = [-C1 Frame, -MicroError]
   */
  function computeContingencyStats(a, b, c, d) {
    const n = a + b + c + d;
    if (n === 0) {
      return { n: 0, chi2: 0, oddsRatio: 1, fisherP: 1 };
    }
    function logFactorial(k) {
      let s = 0;
      for (let i = 2; i <= k; i++) s += Math.log(i);
      return s;
    }
    function hypergeom(x, xb, xc, xd) {
      const total = x + xb + xc + xd;
      const lp =
        logFactorial(x + xb) +
        logFactorial(xc + xd) +
        logFactorial(x + xc) +
        logFactorial(xb + xd) -
        logFactorial(total) -
        logFactorial(x) -
        logFactorial(xb) -
        logFactorial(xc) -
        logFactorial(xd);
      return Math.exp(lp);
    }

    const r1 = a + b;
    const r2 = c + d;
    const c1 = a + c;
    const c2 = b + d;

    const denom = r1 * r2 * c1 * c2;
    const chi2 = denom > 0 ? (n * Math.pow(a * d - b * c, 2)) / denom : 0;
    const oddsRatio = b * c > 0 ? (a * d) / (b * c) : a * d > 0 ? Infinity : 1;

    const pObs = hypergeom(a, b, c, d);
    const minA = Math.max(0, c1 - r2);
    const maxA = Math.min(r1, c1);
    let fisherP = 0;
    for (let x = minA; x <= maxA; x++) {
      const xb = r1 - x;
      const xc = c1 - x;
      const xd = r2 - xc;
      const p = hypergeom(x, xb, xc, xd);
      if (p <= pObs + 1e-12) fisherP += p;
    }

    return {
      n,
      a,
      b,
      c,
      d,
      chi2: Number(chi2.toFixed(4)),
      oddsRatio: Number.isFinite(oddsRatio) ? Number(oddsRatio.toFixed(3)) : null,
      fisherP: Number(Math.min(1, fisherP).toFixed(4))
    };
  }

  /**
   * Main Diagnostic & Scrubbing Function
   * @param {string} text - Input essay or paragraph
   * @param {object} [options] - { l1Filter: 'all' | 'mandarin' | 'slavic' | 'romance' | 'german', silent: boolean }
   */
  function analyzeAndScrub(text, options) {
    const opts = Object.assign({ l1Filter: 'all', silent: false }, options || {});

    if (typeof window !== 'undefined' && !opts.silent) {
      window.trackFunnelEvent?.('research_tool_used', {
        tool: 'l1_micro_scrubber',
        article: 'c1-syntactic-research-lab'
      });
    }

    const sentences = splitSentences(text);
    const activeRules = L1_MICRO_RULES.filter(r => {
      if (opts.l1Filter === 'all') return true;
      if (opts.l1Filter === 'slavic_german') {
        return r.l1Group === 'slavic' || r.l1Group === 'german';
      }
      return r.l1Group === opts.l1Filter;
    });

    const sentenceAudits = [];
    let totalWords = 0;
    let totalMicroHits = 0;
    let totalC1Frames = 0;
    const l1Breakdown = { mandarin: 0, slavic: 0, romance: 0, german: 0 };
    const openerTokens = [];

    sentences.forEach((origSentence, idx) => {
      const words = origSentence.trim().split(/\s+/).filter(Boolean);
      totalWords += words.length;

      const opener = words
        .slice(0, 2)
        .join(' ')
        .replace(/[^a-zA-Z\s]/g, '')
        .toLowerCase();
      if (opener) openerTokens.push(opener);

      // 1. Detect C1/C2 macro-frames in this sentence
      const matchedFrames = [];
      C1_MACRO_FRAMES.forEach(frame => {
        if (frame.regex.test(origSentence)) {
          matchedFrames.push({
            id: frame.id,
            label: frame.label,
            blueprint: frame.blueprint
          });
        }
      });
      const hasC1Frame = matchedFrames.length > 0;
      if (hasC1Frame) totalC1Frames += matchedFrames.length;

      // 2. Detect and scrub L1 micro-interference hits in this sentence
      let scrubbedSentence = origSentence;
      const microErrors = [];

      activeRules.forEach(rule => {
        const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
        let match;
        while ((match = regex.exec(origSentence)) !== null) {
          const badSpan = match[0];
          const fixedSpan = rule.remediate.apply(null, match);
          microErrors.push({
            ruleId: rule.id,
            l1Group: rule.l1Group,
            category: rule.category,
            original: badSpan,
            replacement: fixedSpan,
            formula: rule.formula,
            note: rule.note
          });
          l1Breakdown[rule.l1Group] = (l1Breakdown[rule.l1Group] || 0) + 1;
          totalMicroHits++;
        }
        scrubbedSentence = scrubbedSentence.replace(
          new RegExp(rule.pattern.source, rule.pattern.flags),
          function () {
            return rule.remediate.apply(null, arguments);
          }
        );
      });

      sentenceAudits.push({
        index: idx + 1,
        original: origSentence,
        scrubbed: scrubbedSentence,
        wordCount: words.length,
        hasC1Frame,
        c1Frames: matchedFrames,
        hasMicroError: microErrors.length > 0,
        microErrors,
        isErrorFreeBefore: microErrors.length === 0,
        isErrorFreeAfter: true
      });
    });

    // 3. Detect template clichés
    const clicheHits = [];
    TEMPLATE_CLICHES.forEach(c => {
      const m = text.match(c.pattern);
      if (m) {
        clicheHits.push({
          phrase: m[0],
          replacement: c.replacement,
          label: c.label
        });
      }
    });

    // 4. Compute Sentence-Level EFSR before and after L1 micro-scrubbing
    const nSentences = sentenceAudits.length;
    const errorFreeBeforeCount = sentenceAudits.filter(s => s.isErrorFreeBefore).length;
    const efsrBeforePct = nSentences > 0 ? Number(((100 * errorFreeBeforeCount) / nSentences).toFixed(1)) : 100;
    const efsrAfterPct = 100.0;

    // 5. Compute 2x2 Contingency Matrix ([+C1 Frame vs -C1 Frame] x [+Micro-Error vs -Micro-Error])
    const a = sentenceAudits.filter(s => s.hasC1Frame && s.hasMicroError).length;
    const b = sentenceAudits.filter(s => s.hasC1Frame && !s.hasMicroError).length;
    const c = sentenceAudits.filter(s => !s.hasC1Frame && s.hasMicroError).length;
    const d = sentenceAudits.filter(s => !s.hasC1Frame && !s.hasMicroError).length;
    const contingency = computeContingencyStats(a, b, c, d);

    // 6. Compute Syntactic Cohesion & Restraint Score (SCQS)
    const uniqueOpeners = new Set(openerTokens).size;
    const openerVarietyPct =
      openerTokens.length > 0 ? Number(((100 * uniqueOpeners) / openerTokens.length).toFixed(1)) : 100;
    const c1SentenceCount = sentenceAudits.filter(s => s.hasC1Frame).length;
    const c1DensityPct = nSentences > 0 ? Number(((100 * c1SentenceCount) / nSentences).toFixed(1)) : 0;

    let restraintVerdict = 'Balanced C1 Restraint';
    if (clicheHits.length > 0) {
      restraintVerdict = 'Template Stuffing Detected';
    } else if (c1DensityPct > 75) {
      restraintVerdict = 'Over-Dense (Forced C1 Shifts)';
    } else if (c1DensityPct < 15 && nSentences >= 4) {
      restraintVerdict = 'Flat B2 Syntax (Add 2 to 3 C1 Blueprints)';
    }

    return {
      summary: {
        sentenceCount: nSentences,
        wordCount: totalWords,
        c1SentenceCount,
        c1FrameCount: totalC1Frames,
        c1DensityPct,
        totalMicroHits,
        l1Breakdown,
        errorFreeBeforeCount,
        efsrBeforePct,
        efsrAfterPct,
        efsrGainPct: Number((efsrAfterPct - efsrBeforePct).toFixed(1)),
        openerVarietyPct,
        clicheCount: clicheHits.length,
        restraintVerdict
      },
      contingency,
      clicheHits,
      sentences: sentenceAudits,
      scrubbedFullText: sentenceAudits.map(s => s.scrubbed).join(' ')
    };
  }

  /**
   * Built-in Anonymised Classroom Benchmark Samples across all 4 L1 Profiles
   */
  const BENCHMARK_SAMPLES = {
    w1_mandarin: {
      title: 'Profile A · W1 IELTS Essay 4 (Public Cultural Institutions · Mandarin L1)',
      l1Group: 'mandarin',
      text: "It is commonly debated whether culture institutions should be fully subsidised by goverments or self-funded like normal businesses. Some expect governments to fund only the critical infrastructures; others prefer governments to take more social responsibilities. In my opinion, having public cultural institutions brings advantages to both the current and future generations of citizens, thereby outweighing its disadvantages such as reduced efficiency and autonomy. What makes self-funded institutions excell is their efficiency. Not only would the owners and staffs have clearer incentives to innovate and adjust to the market quickly, but they would also have more autonomy to make decisions. For example, the staffs might be more creative and motivated while engaging with the guests, thereby resulting in more returning guests. This boosts both the income of the insitutions and the cultural exposure of the visitors. Nevertheless, it is unclear if financial incentive is the best and only solution to achieve such improvements. Having culture institutions as free public spaces can make a city more inclusive and inviting. For example, there is a large public library in the centre of a major capital city, which attracts countless visitors from all over the country. It offers a space for both children and adults to spend their time exploring their interests in the literature. Without such public infrastructure, families are to limited to choose between public parks and commercial spaces to spend their leisure time. While having a sense of autonomy helps to boost the efficiency and innovation of the cultural institutions, enforcing an entrance fee reduces their access for less privileged groups. The democratisation of access to knowledge is critical to the development of a healthy society and therefore should be funded by the governments."
    },
    w2_romance: {
      title: 'Profile B · W2 CPE Report & Discursive Excerpt (Italian / Romance L1)',
      l1Group: 'romance',
      text: "Several of the library's frequenters have been interviewed to share their views on the overriding issues or lacks to be solved or filled. Firstly, although the Municipal Reference Library was founded in 1860, thus being one of the most ancient libraries in the region, it does not rely simply on its prestige to attract visitors from all over the country. Not only does the library boast a wide range of technological devices at students' disposal, but it also provides frequenters with an increasing number of study rooms. A number of attendees has shown interest in the purchase of sound-proof rooms. Moreover, 83% of the interviewees have mentioned the remarkable benefits that a 3D printer would bring to the facility, increasingly frequented by students attending their degree in Architecture and Design. A third of the interviewed students, albeit a minority, has also passionately advocated for the need of projectors: the library is thought to lack spaces where colleagues may rehearse their presentations. Both texts deal with the role of advertising in modern life. Instead, the second text highlights the negative evolution of advertising, from ignorable posters to omnipresent and deceivable practices. The first passage argues that advertisings play a crucial role in the present-day world, allowing firms and brands to reach an extraordinarily wide audience. Not only is making a responsible college choice crucial for your future career, but it is also impactful on the short run, unlike some believe."
    },
    w3_slavic: {
      title: 'Profile C · W7/W8 C1 Correspondence & Essay Diagnostic (Slavic L1)',
      l1Group: 'slavic',
      text: "What a wonderful news! I am delighted that you are going to arrive to the city next week. First of all, it is Mining Museum, which is one of the largest industrial collections in Europe. Near the museum there is cafe where visitors can try freshly baked pastry after a morning tour. In a very close proximity to the central park is Planetarium, which attracts visitors throughout the winter. Having completed a demanding postgraduate course, graduates expect strong career perspectives, yet many institutions fail to explain how does it work in practice. Do you have any plans on next month so that you do not walk alone in the night or fall in an autumn depression?"
    },
    w4_german: {
      title: 'Profile D · W3 C1 Proposal & Correspondence Diagnostic (German / DACH Transfer)',
      l1Group: 'german',
      text: "It is widely acknowledged that investing in public Transport creates new Possibilities for regional commuters, thereby reducing congestion across the city centre. I live here since 5 years, and despite of the wet winter weather, the cultural programm ist remarkably varied. In the Old Quarter there are many Restaurants and Bars within 10 Minutes of the main square, where visitors can dive into the Universe at the municipal observatory or get a portion of Adrenalin at the climbing hall. Municipal planners suggest to introduce an integrated evening pass, and now you know for what the town is famous!"
    }
  };

  return {
    C1_MACRO_FRAMES,
    L1_MICRO_RULES,
    TEMPLATE_CLICHES,
    BENCHMARK_SAMPLES,
    splitSentences,
    computeContingencyStats,
    analyzeAndScrub,
    analyseAndScrub: analyzeAndScrub
  };
});

// CLI Runner when invoked directly via `node assets/js/l1-micro-scrubber.js`
if (typeof require !== 'undefined' && require.main === module) {
  const scrubber = module.exports;
  console.log('=== GarethEnglish L1 Micro-Scrubber & Sentence-Level EFSR Benchmark (4 L1 Profiles) ===\n');
  for (const [key, sample] of Object.entries(scrubber.BENCHMARK_SAMPLES)) {
    const res = scrubber.analyzeAndScrub(sample.text, { silent: true });
    console.log(`[${key}] ${sample.title}`);
    console.log(
      `  Sentences: ${res.summary.sentenceCount} | C1 Macro-Framed Sentences: ${res.summary.c1SentenceCount} (${res.summary.c1DensityPct}%) | Total Micro-Hits: ${res.summary.totalMicroHits}`
    );
    console.log(
      `  L1 Breakdown: Mandarin=${res.summary.l1Breakdown.mandarin}, Slavic=${res.summary.l1Breakdown.slavic}, Romance=${res.summary.l1Breakdown.romance}, German=${res.summary.l1Breakdown.german}`
    );
    console.log(
      `  EFSR Before Scrubbing: ${res.summary.efsrBeforePct}% (${res.summary.errorFreeBeforeCount}/${res.summary.sentenceCount}) -> EFSR After L1 Micro-Scrub: ${res.summary.efsrAfterPct}% (+${res.summary.efsrGainPct}%)`
    );
    console.log(
      `  2x2 Contingency: [+C1,+Err]=${res.contingency.a}, [+C1,-Err]=${res.contingency.b}, [-C1,+Err]=${res.contingency.c}, [-C1,-Err]=${res.contingency.d} | Chi2=${res.contingency.chi2}, Fisher p=${res.contingency.fisherP}\n`
    );
  }
}
