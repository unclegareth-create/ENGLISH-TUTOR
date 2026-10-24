/* === GARETHENGLISH LIVE ESSAY SYNTAX STRESS-TESTER ===
   Deterministic client-side lexical & syntactic diagnostic engine for how-i-mark.html.
   Exposes window.SyntaxStressTester and mounts into #live-syntax-stress-tester.
   Zero external dependencies.
======================================================================================== */

(() => {
  'use strict';

  const STORAGE_KEY = 'gm_last_essay_scan';

  // 1. B1/B2 Crutch Words & Template Cliché Dictionary (Flagged in Amber)
  // Ordered longest-first during regex compilation to prevent partial sub-matches.
  const AMBER_RULES = [
    {
      id: 'cliche-rapid-dev',
      phrase: 'with the rapid development of',
      kind: 'cliche',
      label: 'Canned Factory Opener',
      replacement: 'The proliferation of [noun]... / As [sector] continues to accelerate,...',
      note: 'The classic template opener taught by test-prep factories. Examiners spot it in three seconds flat. Open with an abstract noun phrase ("The rapid proliferation of...") or a specific active clause.'
    },
    {
      id: 'cliche-coin',
      phrase: 'every coin has two sides',
      kind: 'cliche',
      label: 'Memorised Template Idiom',
      replacement: 'While this approach yields clear benefits, its systemic drawbacks warrant scrutiny.',
      note: 'This phrase puts Cambridge and IELTS examiners straight to sleep. It is the textbook hallmark of a memorised Band 6.0 template. Use a concessive "While..." clause instead.'
    },
    {
      id: 'cliche-undeniable',
      phrase: 'it is undeniable that',
      kind: 'cliche',
      label: 'Overstated Template Claim',
      replacement: 'It is widely argued that... / Empirical evidence increasingly suggests that...',
      note: 'In academic writing, very little is truly "undeniable". Sweeping claims sound rehearsed; cautious hedging ("It is widely argued that...") immediately signals C1 composure.'
    },
    {
      id: 'cliche-last-least',
      phrase: 'last but not least',
      kind: 'cliche',
      label: 'Conversational Cliché',
      replacement: 'Finally, and perhaps most significantly,... / Equally worthy of consideration is...',
      note: 'A worn-out toastmaster\'s phrase. If your final argument matters, elevate it with "Finally, and perhaps most significantly," or an inverted structure.'
    },
    {
      id: 'cliche-sword',
      phrase: 'double-edged sword',
      kind: 'cliche',
      label: 'Overused Essay Metaphor',
      replacement: 'carries both distinct merits and systemic risks / a catalyst for both progress and friction',
      note: 'If I had a pound for every "double-edged sword" in an IELTS script, I could buy half of Belfast. Name the specific policy tension instead of hiding behind a stock cliché.'
    },
    {
      id: 'cliche-nutshell',
      phrase: 'in a nutshell',
      kind: 'cliche',
      label: 'Informal Spoken Idiom',
      replacement: 'Ultimately,... / Taken together, these factors suggest that...',
      note: '"In a nutshell" belongs in a pub chat, not a formal essay. Anchor your concluding paragraph with "Ultimately," or "Consequently,".'
    },
    {
      id: 'weak-a-lot-of',
      phrase: 'a lot of',
      kind: 'weak',
      label: 'Informal B1 Quantifier',
      replacement: 'a substantial proportion of / considerable / numerous',
      note: '"A lot of" drops your register straight into casual speech. Distinguish countable nouns ("numerous", "a wide array of") from uncountable nouns ("considerable", "extensive").'
    },
    {
      id: 'weak-lots-of',
      phrase: 'lots of',
      kind: 'weak',
      label: 'Informal B1 Quantifier',
      replacement: 'a significant number of / extensive / widespread',
      note: 'Far too conversational for IELTS Task 2 or Cambridge C1 Advanced. Upgrade to "a significant number of" or "extensive".'
    },
    {
      id: 'cliche-nowadays',
      phrase: 'nowadays',
      kind: 'cliche',
      label: 'Overused Template Opener',
      replacement: 'In contemporary urban/academic contexts,... (or open directly with a "Whether..." noun clause)',
      note: 'Examiners mark forty scripts before lunch, and thirty-five of them start with "Nowadays". Toss it out right off the bat and open with the core subject noun or a "Whether..." clause.'
    },
    {
      id: 'cliche-furthermore',
      phrase: 'furthermore',
      kind: 'cliche',
      label: 'Mechanical Linker Overuse',
      replacement: 'What further reinforces this view is... / Equally significant is...',
      note: 'Like "Moreover", "Furthermore" is often bolted onto sentences like a blunt brick. Stitch your clauses together using a cleft sentence ("What further complicates this is...") instead.'
    },
    {
      id: 'cliche-moreover',
      phrase: 'moreover',
      kind: 'cliche',
      label: 'Mechanical Linker Overuse',
      replacement: 'Not only [aux + subject + verb], but... also... / Compounding this issue,...',
      note: 'Starting every second sentence with "Moreover" makes your paragraph march like a robot. Replace mechanical linkers with a negative inversion ("Not only does...") or a participial link.'
    },
    {
      id: 'cliche-ubiquitous',
      phrase: 'ubiquitous',
      kind: 'cliche',
      label: 'Forced "Band 9 List" Lexis',
      replacement: 'pervasive / deeply embedded in daily life / widespread',
      note: 'Unless you are writing carefully about digital surveillance, dropping "ubiquitous" into an everyday sentence feels bolted on from a vocabulary list. Try "pervasive" or "deeply embedded in...".'
    },
    {
      id: 'cliche-paramount',
      phrase: 'paramount',
      kind: 'cliche',
      label: 'Overworked "Band 9" Adjective',
      replacement: 'of central importance / crucial / vital to long-term viability',
      note: 'Frequently misused in scripts ("is paramount important" is a classic grammar slip). Keep your footing sure with "of central importance" or "crucial".'
    },
    {
      id: 'cliche-conundrum',
      phrase: 'conundrum',
      kind: 'cliche',
      label: 'Forced Thesaurus Lexis',
      replacement: 'policy dilemma / systemic challenge / structural tension',
      note: 'Another favourite of memorised Reddit vocabulary lists. A "conundrum" is a parlour riddle; in an academic essay, call it a "policy dilemma" or "systemic challenge".'
    },
    {
      id: 'cliche-plethora',
      phrase: 'plethora',
      kind: 'cliche',
      label: 'Forced "Band 9 List" Lexis',
      replacement: 'a wide array of / a multitude of / numerous',
      note: '"Plethora" originally meant a medical excess of bodily fluid, and examiners spot it a mile away as memorised word-list stuffing. Use "a wide array of" or "numerous".'
    },
    {
      id: 'weak-things',
      phrase: 'things',
      kind: 'weak',
      label: 'Vague Placeholder Noun (B1)',
      replacement: 'factors / measures / considerations / dimensions',
      note: '"Things" is an empty sack. Name the exact academic category: "socio-economic factors", "regulatory measures", or "practical considerations".'
    },
    {
      id: 'weak-really',
      phrase: 'really',
      kind: 'weak',
      label: 'Spoken Intensifier (B1)',
      replacement: 'considerably / demonstrably / markedly',
      note: 'Leave "really" at the door when sitting a formal writing paper. Use "considerably", "demonstrably", or "markedly".'
    },
    {
      id: 'weak-stuff',
      phrase: 'stuff',
      kind: 'weak',
      label: 'Colloquial Noun (B1)',
      replacement: 'materials / commodities / provisions / aspects',
      note: 'Never let "stuff" slip into an exam script—it triggers an immediate register penalty under Communicative Achievement and Lexical Resource.'
    },
    {
      id: 'weak-small',
      phrase: 'small',
      kind: 'weak',
      label: 'Basic B1 Adjective',
      replacement: 'negligible / marginal / modest',
      note: 'In academic evaluation, replace "small effect" or "small change" with precise collocations: "marginal gains", "negligible impact", or "modest reduction".'
    },
    {
      id: 'weak-very',
      phrase: 'very',
      kind: 'weak',
      label: 'Weak Intensifier (B1)',
      replacement: 'markedly / acutely / profoundly (or choose a stronger base adjective)',
      note: '"Very" is the lazy cousin of precise lexis. Instead of "very important", write "crucial"; instead of "very different", write "markedly distinct".'
    },
    {
      id: 'weak-good',
      phrase: 'good',
      kind: 'weak',
      label: 'Vague B1 Adjective',
      replacement: 'beneficial / constructive / advantageous / viable',
      note: '"Good" tells the examiner nothing about how or why a policy works. Is it "economically viable", "socially constructive", or "pedagogically sound"?'
    },
    {
      id: 'weak-make',
      phrase: 'make',
      kind: 'weak',
      label: 'Delexicalised B1 Verb',
      replacement: 'generate / foster / render / implement / establish',
      note: 'Relying on "make" ("make laws", "make people happy") starves your essay of topic collocations. Use "enact legislation", "foster well-being", or "render policies effective".'
    },
    {
      id: 'weak-bad',
      phrase: 'bad',
      kind: 'weak',
      label: 'Vague B1 Adjective',
      replacement: 'detrimental / counterproductive / adverse / corrosive',
      note: 'Swap blunt "bad" for precise academic impact: "detrimental to public health", "counterproductive", or "adverse outcomes".'
    },
    {
      id: 'weak-big',
      phrase: 'big',
      kind: 'weak',
      label: 'Vague B1 Adjective',
      replacement: 'substantial / far-reaching / profound / pronounced',
      note: '"Big problem" or "big impact" caps your Lexical Resource. Upgrade to "far-reaching implications", "pronounced disparity", or "substantial hurdle".'
    },
    {
      id: 'weak-get',
      phrase: 'get',
      kind: 'weak',
      label: 'Delexicalised B1 Verb',
      replacement: 'acquire / obtain / secure / attain',
      note: '"Get" is the Swiss Army knife of spoken English, which makes it poison for formal essays. Swap "get skills/jobs" for "acquire competencies" or "secure employment".'
    }
  ];

  // 2. C1/C2 High-Scoring Structural Marker Categories (Highlighted in Emerald Green)
  const EMERALD_CATEGORIES = [
    {
      id: 'inversion',
      title: 'Negative & Restrictive Inversions',
      formula: 'Negative Adverbial + Auxiliary + Subject + Main Verb',
      tip: 'Try opening a key rebuttal sentence with "Not only do/does...", "Seldom has...", or "Only by investing in... can authorities...".',
      patterns: [
        /\bNot only\s+(?:do|does|did|is|are|was|were|can|could|should|will|would|have|has|had)\b(?:\s+[a-zA-Z'-]+){1,4}/gi,
        /\b(?:Seldom|Rarely)\s+(?:do|does|did|have|has|had|is|are|was|were|can|could|will|would)\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bLittle\s+(?:did|do|does)\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bUnder no circumstances\s+(?:should|must|can|could|will|would|do|does|did|is|are)\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bAt no time\s+(?:did|do|does|was|were|have|has|had|should)\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bHardly\s+had\b(?:\s+[a-zA-Z'-]+){1,4}/gi,
        /\bNo sooner\s+had\b(?:\s+[a-zA-Z'-]+){1,4}/gi,
        /\bOnly\s+(?:by|when|after|through|once)\b[^.?!,;]{3,55}?\b(?:can|could|will|would|do|does|did|is|are|should)\b/gi
      ]
    },
    {
      id: 'cleft',
      title: 'Cleft Sentences (Syntactic Focusing)',
      formula: 'What + Clause + is/was... | It is/was + [Focus] + that/who...',
      tip: 'Spotlight your core thesis claim with a Wh-cleft ("What distinguishes sustainable policy is...") or It-cleft ("It is precisely this imbalance that...").',
      patterns: [
        /\bWhat\s+(?:[a-zA-Z'-]+\s+){1,6}(?:is|was|remains)\b/gi,
        /\bIt\s+(?:is|was)\s+(?:not\s+only\s+|precisely\s+|largely\s+|primarily\s+)?(?:the\s+|a\s+|an\s+|this\s+|that\s+)?(?:[a-zA-Z'-]+\s+){1,6}(?:that|who)\b/gi
      ]
    },
    {
      id: 'hedging',
      title: 'Passive Reporting & Academic Hedging',
      formula: 'is/are believed to... | it is widely argued that... | tend(s) to be',
      tip: 'Replace sweeping personal opinions ("I think everyone knows") with impersonal reporting structures ("It is widely argued that...", "...are believed to...").',
      patterns: [
        /\b(?:is|are|was|were)\s+(?:widely\s+|often\s+|generally\s+|commonly\s+)?(?:believed|thought|argued|considered|assumed)\s+to\b/gi,
        /\b(?:is|are|was|were)\s+widely\s+argued\b/gi,
        /\bit\s+is\s+(?:widely\s+|often\s+|generally\s+)?(?:suggested|argued|believed|thought|acknowledged)\s+that\b/gi,
        /\bappear(?:s)?\s+to\s+have\s+been\b/gi,
        /\btend(?:s)?\s+to\s+be\b/gi
      ]
    },
    {
      id: 'participle',
      title: 'Participle Clauses (Cause & Consequence)',
      formula: '..., thereby/thus + [verb]ing | Having + [past participle], ... | Faced with...',
      tip: 'Convert clunky "and this causes..." clauses into crisp consequential participle clauses (", thereby fostering...", "Faced with rising costs,...").',
      patterns: [
        /,\s*thereby\s+[a-z]+ing\b(?:\s+[a-zA-Z'-]+){0,3}/gi,
        /,\s*thus\s+[a-z]+ing\b(?:\s+[a-zA-Z'-]+){0,3}/gi,
        /\bHaving\s+[a-z]+(?:ed|en|wn|un|t)\b(?:\s+[a-zA-Z'-]+){0,3}/gi,
        /\bFaced\s+with\b(?:\s+[a-zA-Z'-]+){1,4}/gi
      ]
    },
    {
      id: 'nominalisation',
      title: 'Nominalisations & Abstract Noun Phrases',
      formula: 'the proliferation/erosion/implementation/viability of... | a shift towards...',
      tip: 'Pack verb-heavy B2 clauses into dense academic noun phrases ("the implementation of congestion tariffs", "the discrepancy between...").',
      patterns: [
        /\bthe\s+proliferation\s+of\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bthe\s+erosion\s+of\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bthe\s+implementation\s+of\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\ba\s+shift\s+towards\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bthe\s+viability\s+of\b(?:\s+[a-zA-Z'-]+){1,3}/gi,
        /\bthe\s+discrepancy\s+between\b(?:\s+[a-zA-Z'-]+){1,3}/gi
      ]
    }
  ];

  // 3. Three One-Click Sample Draft Presets
  const SAMPLE_PRESETS = {
    trap: {
      id: 'trap',
      badge: 'Sample 1',
      title: 'The Band 6.5 Template Trap',
      subtitle: 'Full of "Nowadays", "Moreover", memorised clichés & flat rhythm',
      text: `Nowadays, with the rapid development of modern technology, working from home has become ubiquitous in many countries. It is undeniable that remote work changes how companies operate every day. Every coin has two sides, and telecommuting is a double-edged sword for workers and bosses.

On the one hand, working from home has a plethora of good benefits for employees. People can save a lot of time because they do not need to get on crowded trains every morning. Moreover, workers can make a very comfortable schedule for their family things. Furthermore, companies do not need to rent big offices in the city centre, which is paramount for saving money.

On the other hand, remote work also has some bad effects on team spirit. When staff stay at home all week, they really miss talking to colleagues face to face. Moreover, new workers cannot get help quickly when they face a difficult conundrum at work. Last but not least, some people find it very hard to separate office stuff from home life.

In a nutshell, remote work has both good and bad points for modern society. Companies should make a balanced plan so employees can get the best results.`
    },
    borderline: {
      id: 'borderline',
      badge: 'Sample 2',
      title: 'Borderline B2/C1 Essay',
      subtitle: 'Sensible ideas & clear flow, but zero inversions or clefts',
      text: `Should universities admit only top-scoring school-leavers? Across higher education, whether institutions ought to restrict admission to academically elite applicants or widen access to adult learners remains a central policy question. Selective entry protects rigorous standards, yet broader inclusion strengthens long-term social mobility.

Advocates of strict selection argue that demanding degrees require strong foundational knowledge. When lecture halls are filled with well-prepared candidates who have mastered core theory at secondary school, professors can cover complex material at an advanced pace without repeating basic concepts. If universities lower entry requirements too far, dropout rates inevitably climb. For specialist fields like medicine, high thresholds are essential.

However, restricting university places solely to teenagers with top examination grades overlooks the considerable potential of mature students who return to education later in life. Many adults develop practical discipline and analytical maturity through years of employment. Opening degree pathways to diverse age groups enriches seminar discussions.

In conclusion, universities do not need to choose between excellence and inclusion. By combining rigorous graduation standards with flexible foundation programmes, higher education can serve both gifted school-leavers and ambitious adult learners.`
    },
    benchmark: {
      id: 'benchmark',
      badge: 'Sample 3',
      title: 'Band 8.0 / C1+ Benchmark',
      subtitle: 'Restrained inversions, clefts, participle clauses & rhythmic variance',
      text: `Urban gridlock defies simple fixes. While expanding motorway capacity was once thought to relieve congestion, it is widely argued that building additional lanes merely induces further private car dependency across metropolitan regions. What distinguishes genuinely sustainable transport policy is a shift towards integrated public transit backed by targeted fiscal disincentives.

On the one hand, the implementation of congestion pricing forces motorists to confront the true environmental cost of solo commuting. Faced with daily tolls, drivers reconsider routine journeys. Not only do such tariffs reduce peak-hour emissions in historic city centres, but they also generate ring-fenced revenue for municipal authorities, thereby funding high-frequency rail and bus corridors.

Nevertheless, financial penalties alone appear to have been insufficient where suburban transit remains fragmented. The discrepancy between affluent central zones and underserved commuter towns means that flat-rate charges can disproportionately burden lower-income shift workers who lack viable rail links. Having analysed transport reforms across European capitals, urban planners increasingly emphasise that the viability of road pricing depends on prior investment in reliable alternatives. Only by guaranteeing affordable, punctual rail links can governments legitimately penalise car use.

Ultimately, infrastructural investment must precede taxation. When rapid transit expansion comes first, cities achieve lasting reductions in congestion.`
    }
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Sentence splitter & variance calculator
  function analyzeSentenceRhythm(text) {
    const cleaned = text
      .replace(/\b(e\.g|i\.e|mr|mrs|ms|dr|prof|vs|etc|st|uk|u\.k|u\.s)\./gi, '$1\u0000')
      .trim();

    if (!cleaned) {
      return {
        sentences: [],
        sentenceCount: 0,
        wordCount: 0,
        meanLength: 0,
        stdDev: 0,
        cadenceCode: 'empty',
        cadenceLabel: 'Awaiting Text',
        cadenceBadgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        cadenceAdvice: 'Paste a paragraph or full essay to measure your sentence-length standard deviation (σ).'
      };
    }

    const rawParts = cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [cleaned];
    const sentences = [];

    rawParts.forEach((part) => {
      const restored = part.replace(/\u0000/g, '.').trim();
      const words = restored.split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w));
      if (words.length >= 2) {
        sentences.push({
          text: restored,
          wordCount: words.length
        });
      }
    });

    const totalWords = text.trim().split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w)).length;
    const count = sentences.length;

    if (count === 0) {
      return {
        sentences: [],
        sentenceCount: 0,
        wordCount: totalWords,
        meanLength: totalWords,
        stdDev: 0,
        cadenceCode: 'short',
        cadenceLabel: 'Too Few Sentences',
        cadenceBadgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        cadenceAdvice: 'Write at least 3–4 full sentences so we can calculate your syntactic cadence and standard deviation.'
      };
    }

    const mean = sentences.reduce((acc, s) => acc + s.wordCount, 0) / count;
    const variance = sentences.reduce((acc, s) => acc + Math.pow(s.wordCount - mean, 2), 0) / count;
    const stdDev = Math.sqrt(variance);

    const roundedMean = Math.round(mean * 10) / 10;
    const roundedStd = Math.round(stdDev * 10) / 10;

    let cadenceCode = 'balanced';
    let cadenceLabel = 'Balanced Academic Cadence';
    let cadenceBadgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-300';
    let cadenceAdvice = `Spot on (σ = ${roundedStd} words). Your sentence lengths rise and fall naturally, pairing concise topic claims with multi-clause academic explanations.`;

    if (stdDev < 4.5) {
      cadenceCode = 'monotonous';
      cadenceLabel = 'Monotonous / Robotic';
      cadenceBadgeClass = 'bg-amber-50 text-amber-900 border-amber-300';
      cadenceAdvice = `Metronomic flatness detected (σ = ${roundedStd} < 4.5). Nearly all your sentences march at ~${Math.round(mean)} words. Break the robotic rhythm: follow a crisp 10–12 word claim with a 24–28 word subordinate or participial sentence.`;
    } else if (stdDev > 11) {
      cadenceCode = 'sprawling';
      cadenceLabel = 'Fragmented / Over-sprawling';
      cadenceBadgeClass = 'bg-rose-50 text-rose-800 border-rose-300';
      cadenceAdvice = `Extreme length swings detected (σ = ${roundedStd} > 11). Watch out for breathless 38+ word run-on sentences where clause control unravels, or abrupt 4-word fragments.`;
    }

    return {
      sentences,
      sentenceCount: count,
      wordCount: totalWords,
      meanLength: roundedMean,
      stdDev: roundedStd,
      cadenceCode,
      cadenceLabel,
      cadenceBadgeClass,
      cadenceAdvice
    };
  }

  // Deterministic lexical & syntactic scanner
  function scanEssay(rawText) {
    const text = String(rawText || '');
    const rhythm = analyzeSentenceRhythm(text);

    // Collect all candidate spans (Emerald C1/C2 markers + Amber B1/B2 crutches)
    const candidateSpans = [];

    // 1. Scan Emerald C1/C2 Structural Markers
    const c1Counts = {};
    EMERALD_CATEGORIES.forEach((cat) => {
      c1Counts[cat.id] = {
        id: cat.id,
        title: cat.title,
        formula: cat.formula,
        tip: cat.tip,
        count: 0,
        examples: []
      };

      cat.patterns.forEach((regex) => {
        const re = new RegExp(regex.source, regex.flags);
        let match;
        while ((match = re.exec(text)) !== null) {
          candidateSpans.push({
            start: match.index,
            end: match.index + match[0].length,
            matchedText: match[0],
            type: 'emerald',
            categoryId: cat.id,
            label: cat.title,
            formula: cat.formula,
            note: `High-scoring C1/C2 syntactic pivot (${cat.title}). Examiners actively reward this structure under Grammatical Range & Accuracy.`
          });
        }
      });
    });

    // 2. Scan Amber B1/B2 Crutches & Clichés
    AMBER_RULES.forEach((rule) => {
      const pattern = new RegExp(`\\b${escapeRegex(rule.phrase)}\\b`, 'gi');
      let match;
      while ((match = pattern.exec(text)) !== null) {
        candidateSpans.push({
          start: match.index,
          end: match.index + match[0].length,
          matchedText: match[0],
          type: 'amber',
          ruleId: rule.id,
          phraseKey: rule.phrase,
          kind: rule.kind,
          label: rule.label,
          replacement: rule.replacement,
          note: rule.note
        });
      }
    });

    // Sort spans by start index ascending; if tied, prefer emerald or longer span
    candidateSpans.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    // Filter out overlapping spans
    const acceptedSpans = [];
    let lastEnd = -1;
    candidateSpans.forEach((span) => {
      if (span.start >= lastEnd) {
        acceptedSpans.push(span);
        lastEnd = span.end;
      }
    });

    // Tally accepted spans
    const amberMatches = [];
    const emeraldMatches = [];

    acceptedSpans.forEach((span, idx) => {
      span.spanIndex = idx + 1;
      if (span.type === 'amber') {
        amberMatches.push(span);
      } else {
        emeraldMatches.push(span);
        const catBucket = c1Counts[span.categoryId];
        if (catBucket) {
          catBucket.count += 1;
          if (catBucket.examples.length < 3) {
            catBucket.examples.push(span.matchedText.trim());
          }
        }
      }
    });

    const clicheCount = amberMatches.filter((m) => m.kind === 'cliche').length;
    const weakWordCount = amberMatches.filter((m) => m.kind === 'weak').length;
    const c1CategoriesHit = Object.values(c1Counts).filter((c) => c.count > 0).length;
    const missingCategories = Object.values(c1Counts)
      .filter((c) => c.count === 0)
      .map((c) => c.title);

    // Compute Instant "Structural Ceiling Score"
    let ceilingScore = 'B2.4 (IELTS 6.5)';
    let cefrCode = 'B2.4';
    let ieltsBand = '6.5';
    let ceilingBadgeColor = 'from-amber-500 to-amber-600 text-slate-950';
    let ceilingHeadline = 'Capped at the B2 / Band 6.5 Threshold';

    if (rhythm.wordCount < 25) {
      ceilingScore = 'Pending (Need 40+ Words)';
      cefrCode = 'N/A';
      ieltsBand = 'N/A';
      ceilingHeadline = 'Paste a longer paragraph or full essay to unlock your ceiling score';
    } else if (clicheCount >= 3 || amberMatches.length >= 7 || (amberMatches.length >= 4 && emeraldMatches.length === 0)) {
      ceilingScore = 'B1.8 (IELTS 6.0)';
      cefrCode = 'B1.8';
      ieltsBand = '6.0';
      ceilingBadgeColor = 'from-rose-500 to-amber-500 text-white';
      ceilingHeadline = 'Template Clichés & B1 Crutch Lexis Cap Your Score at 6.0';
    } else if (c1CategoriesHit >= 4 && clicheCount === 0 && weakWordCount <= 1 && rhythm.cadenceCode === 'balanced') {
      ceilingScore = 'C2.0 (IELTS 8.0+)';
      cefrCode = 'C2.0';
      ieltsBand = '8.0+';
      ceilingBadgeColor = 'from-emerald-400 to-teal-500 text-slate-950';
      ceilingHeadline = 'Authoritative C1/C2 Syntactic Range & Restrained Academic Register';
    } else if (c1CategoriesHit >= 2 && clicheCount <= 1 && amberMatches.length <= 3) {
      ceilingScore = 'C1.2 (IELTS 7.5)';
      cefrCode = 'C1.2';
      ieltsBand = '7.5';
      ceilingBadgeColor = 'from-emerald-500 to-indigo-500 text-white';
      ceilingHeadline = 'Strong C1 / Band 7.5 Structural Control Confirmed';
    } else {
      ceilingScore = 'B2.4 (IELTS 6.5)';
      cefrCode = 'B2.4';
      ieltsBand = '6.5';
      ceilingBadgeColor = 'from-amber-400 to-amber-500 text-slate-950';
      ceilingHeadline = 'The Classic "6.5 Plateau": Sensible Ideas, Zero C1 Syntactic Pivots';
    }

    // Build specific, actionable ceiling reasons
    const ceilingReasons = [];
    if (clicheCount > 0) {
      ceilingReasons.push(
        `Flagged ${clicheCount} memorised template cliché${clicheCount === 1 ? '' : 's'} (${amberMatches.filter((m) => m.kind === 'cliche').slice(0, 3).map((m) => `"${m.matchedText}"`).join(', ')}). Examiners immediately discount memorised openers and "Band 9 word list" nouns.`
      );
    } else {
      ceilingReasons.push('Zero canned template openers or fake "Band 9 vocabulary list" clichés detected.');
    }

    if (weakWordCount > 0) {
      ceilingReasons.push(
        `Detected ${weakWordCount} B1/B2 crutch word${weakWordCount === 1 ? '' : 's'} (${amberMatches.filter((m) => m.kind === 'weak').slice(0, 4).map((m) => `"${m.matchedText}"`).join(', ')}) where precise academic collocations are required.`
      );
    } else {
      ceilingReasons.push('Clean lexical register: no vague B1 crutch verbs ("make", "get") or weak intensifiers ("very", "really").');
    }

    if (c1CategoriesHit < 3) {
      ceilingReasons.push(
        `Only ${c1CategoriesHit} of 5 C1/C2 structural categories present (${emeraldMatches.length} total marker${emeraldMatches.length === 1 ? '' : 's'}). Missing: ${missingCategories.slice(0, 3).join(', ')}. Without inversions, clefts, or participle clauses, Grammatical Range stays capped at Band 6.5.`
      );
    } else {
      ceilingReasons.push(
        `Strong syntactic variety: ${emeraldMatches.length} C1/C2 structural marker${emeraldMatches.length === 1 ? '' : 's'} across ${c1CategoriesHit}/5 rubric categories.`
      );
    }

    ceilingReasons.push(
      `Sentence Rhythm: Mean ${rhythm.meanLength} words/sentence with standard deviation σ = ${rhythm.stdDev} (${rhythm.cadenceLabel}).`
    );

    return {
      rawText: text,
      wordCount: rhythm.wordCount,
      sentenceCount: rhythm.sentenceCount,
      sentences: rhythm.sentences,
      meanLength: rhythm.meanLength,
      stdDev: rhythm.stdDev,
      cadenceCode: rhythm.cadenceCode,
      cadenceLabel: rhythm.cadenceLabel,
      cadenceBadgeClass: rhythm.cadenceBadgeClass,
      cadenceAdvice: rhythm.cadenceAdvice,
      acceptedSpans,
      amberMatches,
      emeraldMatches,
      clicheCount,
      weakWordCount,
      c1Counts,
      c1CategoriesHit,
      missingCategories,
      ceilingScore,
      cefrCode,
      ieltsBand,
      ceilingBadgeColor,
      ceilingHeadline,
      ceilingReasons
    };
  }

  // Render annotated HTML with paragraphs preserved
  function buildAnnotatedHtml(rawText, acceptedSpans, activeSpanIndex) {
    if (!rawText.trim()) {
      return '<p class="text-slate-400 italic">Your annotated red-pen &amp; emerald markup will appear here as soon as you scan an essay...</p>';
    }

    let cursor = 0;
    let html = '';

    acceptedSpans.forEach((span) => {
      if (span.start > cursor) {
        html += formatPlainSegment(rawText.slice(cursor, span.start));
      }

      const isSelected = activeSpanIndex === span.spanIndex;
      if (span.type === 'amber') {
        const ringClass = isSelected ? 'ring-2 ring-amber-600 bg-amber-200/90' : 'bg-amber-100 hover:bg-amber-200/80';
        html += `<button type="button" data-stress-span="${span.spanIndex}" class="stress-token stress-token-amber inline items-baseline gap-1 px-1.5 py-0.5 mx-0.5 rounded border border-amber-400 text-amber-950 font-semibold text-left transition cursor-pointer ${ringClass}" title="${escapeHtml(span.label + ' — Click for Gareth\'s Belfast Desk replacement')}">` +
          `<span class="underline decoration-amber-600 decoration-wavy underline-offset-2">${escapeHtml(span.matchedText)}</span>` +
          `<span class="ml-1 inline-flex items-center justify-center px-1 rounded bg-amber-600 text-white text-[10px] font-bold uppercase tracking-tighter">Fix</span>` +
          `</button>`;
      } else {
        const ringClass = isSelected ? 'ring-2 ring-emerald-700 bg-emerald-200/90' : 'bg-emerald-100/90 hover:bg-emerald-200/80';
        html += `<button type="button" data-stress-span="${span.spanIndex}" class="stress-token stress-token-emerald inline items-baseline gap-1 px-1.5 py-0.5 mx-0.5 rounded border border-emerald-400 text-emerald-950 font-semibold text-left transition cursor-pointer ${ringClass}" title="${escapeHtml(span.label + ' — Verified C1/C2 Structural Pivot')}">` +
          `<span>${escapeHtml(span.matchedText)}</span>` +
          `<span class="ml-1 inline-flex items-center justify-center px-1 rounded bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-tighter">C1+</span>` +
          `</button>`;
      }

      cursor = span.end;
    });

    if (cursor < rawText.length) {
      html += formatPlainSegment(rawText.slice(cursor));
    }

    return `<div class="leading-relaxed text-sm sm:text-base text-slate-800 space-y-3">${html}</div>`;
  }

  function formatPlainSegment(segment) {
    return escapeHtml(segment).replace(/\n\s*\n/g, '<br><br>').replace(/\n/g, '<br>');
  }

  // Persist scan to localStorage and CandidateDossier
  function persistScanResult(result, triggerSource) {
    const payload = {
      timestamp: new Date().toISOString(),
      trigger: triggerSource || 'manual',
      ceilingScore: result.ceilingScore,
      cefrLevel: result.cefrCode,
      ieltsBand: result.ieltsBand,
      wordCount: result.wordCount,
      sentenceCount: result.sentenceCount,
      meanSentenceLength: result.meanLength,
      stdDevSentenceLength: result.stdDev,
      cadenceDiagnosis: result.cadenceLabel,
      amberCount: result.amberMatches.length,
      clicheCount: result.clicheCount,
      weakWordCount: result.weakWordCount,
      emeraldCount: result.emeraldMatches.length,
      c1CategoriesHit: result.c1CategoriesHit,
      missingCategories: result.missingCategories,
      ceilingReasons: result.ceilingReasons,
      draftText: result.rawText
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      // Ignore storage quota errors in private browsing
    }

    // Feed into CandidateDossier if present and triggered by user interaction
    if (triggerSource && triggerSource !== 'init') {
      try {
        if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
          window.CandidateDossier.recordAttempt({
            toolId: 'writing-stress-tester',
            toolName: 'Essay Syntax Stress-Tester',
            category: 'C1 Writing Syntax & Register',
            score: result.c1CategoriesHit,
            maxScore: 5,
            ceilingScore: result.ceilingScore,
            cefrLevel: result.cefrCode,
            ieltsBand: result.ieltsBand,
            amberFlags: result.amberMatches.length,
            emeraldMarkers: result.emeraldMatches.length,
            stdDev: result.stdDev,
            cadence: result.cadenceLabel,
            weaknesses: result.missingCategories,
            summary: `Ceiling ${result.ceilingScore} (${result.emeraldMatches.length} C1 pivots, ${result.amberMatches.length} B1/B2 flags, σ=${result.stdDev})`
          });
        }
      } catch (err) {
        // Non-blocking
      }

      try {
        if (window.AnalyticsFunnel && typeof window.AnalyticsFunnel.track === 'function') {
          window.AnalyticsFunnel.track('essay_stress_test_run', {
            ceilingScore: result.ceilingScore,
            amberCount: result.amberMatches.length,
            emeraldCount: result.emeraldMatches.length,
            stdDev: result.stdDev
          });
        }
      } catch (err) {
        // Non-blocking
      }
    }
  }

  function injectScopedStyles() {
    if (document.getElementById('gm-stress-tester-styles')) return;
    const style = document.createElement('style');
    style.id = 'gm-stress-tester-styles';
    style.textContent = `
      .gm-sparkline-grid {
        display: flex;
        align-items: flex-end;
        gap: 6px;
        height: 112px;
        padding: 12px 8px 4px;
        overflow-x: auto;
      }
      .gm-spark-col {
        flex: 1 1 0%;
        min-width: 28px;
        max-width: 56px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
      }
      .gm-spark-bar {
        width: 100%;
        border-radius: 6px 6px 2px 2px;
        transition: height 0.25s ease, background-color 0.2s ease;
        min-height: 8px;
      }
      .gm-spark-bar:hover {
        filter: brightness(1.1);
      }
    `;
    document.head.appendChild(style);
  }

  function mountStressTester(containerSelector = '#live-syntax-stress-tester') {
    const root = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!root) return null;
    injectScopedStyles();

    let activePresetId = 'trap';
    let currentText = SAMPLE_PRESETS.trap.text;
    let currentResult = scanEssay(currentText);
    let activeSpanIndex = currentResult.acceptedSpans.length > 0 ? currentResult.acceptedSpans[0].spanIndex : null;

    // Persist initial default state so booking link always has context
    persistScanResult(currentResult, 'init');

    root.innerHTML = `
      <div class="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden">
        <!-- Top Header Bar -->
        <div class="bg-slate-900 text-white px-5 sm:px-8 py-5 border-b border-slate-800">
          <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <i class="fa-solid fa-bolt" aria-hidden="true"></i>
                <span>Interactive Red-Pen Diagnostic Engine</span>
              </div>
              <h3 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                Test Your Own Essay: Live Syntax &amp; Cliché Stress-Tester
              </h3>
              <p class="text-xs sm:text-sm text-slate-300 mt-1">
                Paste a 150–350 word IELTS Task 2 or Cambridge C1 essay below—or test one of my 3 calibrated benchmark drafts with a single click.
              </p>
            </div>

            <!-- 3 One-Click Sample Draft Presets -->
            <div class="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 shrink-0" role="group" aria-label="Load Sample Essay Preset">
              <button type="button" data-preset-btn="trap" class="preset-btn px-3.5 py-2 rounded-xl text-xs font-bold transition text-left border bg-amber-500 text-slate-950 border-amber-400 shadow-sm">
                <span class="block text-[10px] uppercase tracking-wider opacity-80">Sample 1 &bull; Band 6.0–6.5</span>
                <span>The Template Trap</span>
              </button>
              <button type="button" data-preset-btn="borderline" class="preset-btn px-3.5 py-2 rounded-xl text-xs font-bold transition text-left border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">
                <span class="block text-[10px] uppercase tracking-wider text-amber-400">Sample 2 &bull; Borderline B2/C1</span>
                <span>Good Ideas, Zero Clefts</span>
              </button>
              <button type="button" data-preset-btn="benchmark" class="preset-btn px-3.5 py-2 rounded-xl text-xs font-bold transition text-left border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700">
                <span class="block text-[10px] uppercase tracking-wider text-emerald-400">Sample 3 &bull; Band 8.0 / C1+</span>
                <span>Belfast Desk Benchmark</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Input & Instant Score Banner Row -->
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
          <!-- Left: Textarea Input (7 cols) -->
          <div class="lg:col-span-7 p-5 sm:p-6 bg-slate-50/60 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <label for="gm-stress-textarea" class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i class="fa-solid fa-keyboard text-indigo-600" aria-hidden="true"></i>
                  <span>Your Essay Draft (Paste or Edit Live)</span>
                </label>
                <div class="flex items-center gap-3 text-xs font-mono text-slate-500">
                  <span id="gm-live-word-count">0 words</span>
                  <span>&bull;</span>
                  <span id="gm-live-sentence-count">0 sentences</span>
                  <button type="button" id="gm-clear-essay-btn" class="text-rose-600 hover:text-rose-700 font-sans font-semibold underline ml-1">
                    Clear
                  </button>
                </div>
              </div>

              <textarea
                id="gm-stress-textarea"
                rows="10"
                placeholder="Paste your IELTS Task 2 or Cambridge C1 essay here (e.g., 150–350 words)..."
                class="w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm sm:text-base text-slate-800 leading-relaxed shadow-inner focus:outline-none focus:border-indigo-600 transition resize-y"
              ></textarea>
            </div>

            <div class="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p class="text-xs text-slate-500">
                <i class="fa-solid fa-lock text-emerald-600 mr-1" aria-hidden="true"></i>
                100% browser-local analysis. Your draft stays on your device.
              </p>
              <button
                type="button"
                id="gm-run-scan-btn"
                class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              >
                <i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i>
                <span>Run Red-Pen Syntax Audit</span>
              </button>
            </div>
          </div>

          <!-- Right: Instant Structural Ceiling Score Card (5 cols) -->
          <div class="lg:col-span-5 p-5 sm:p-6 bg-slate-950 text-white flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between gap-2 mb-3">
                <span class="text-xs font-bold uppercase tracking-widest text-indigo-400">
                  Estimated Structural Ceiling
                </span>
                <span class="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  GRA + LR Rubric
                </span>
              </div>

              <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 mb-4">
                <div class="text-xs text-slate-400 mb-1">Projected Grammar &amp; Lexis Ceiling:</div>
                <div id="gm-ceiling-score-pill" class="inline-block px-3.5 py-1.5 rounded-xl font-black text-xl sm:text-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-sm mb-2">
                  B2.4 (IELTS 6.5)
                </div>
                <p id="gm-ceiling-headline" class="text-xs sm:text-sm font-bold text-white leading-snug">
                  Loading diagnostic...
                </p>
              </div>

              <!-- Quick 3-Metric Strip -->
              <div class="grid grid-cols-3 gap-2 mb-4 text-center">
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30">
                  <div id="gm-stat-amber" class="text-lg sm:text-xl font-black text-amber-400">0</div>
                  <div class="text-[11px] text-slate-400 leading-tight">Amber Crutches &amp; Clichés</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30">
                  <div id="gm-stat-emerald" class="text-lg sm:text-xl font-black text-emerald-400">0</div>
                  <div class="text-[11px] text-slate-400 leading-tight">C1/C2 Structural Pivots</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900/90 border border-indigo-400/30">
                  <div id="gm-stat-sigma" class="text-lg sm:text-xl font-black text-indigo-300">0.0</div>
                  <div class="text-[11px] text-slate-400 leading-tight">Sentence Rhythm (&sigma;)</div>
                </div>
              </div>

              <!-- Why Your Ceiling Is Capped -->
              <div>
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Why Your Score Ceiling Lands Here:
                </h4>
                <ul id="gm-ceiling-reasons-list" class="space-y-2 text-xs text-slate-300 leading-relaxed">
                </ul>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Synced to your Candidate Dossier</span>
              <span class="text-emerald-400 font-semibold"><i class="fa-solid fa-check mr-1" aria-hidden="true"></i>Ready for Live Diagnostic</span>
            </div>
          </div>
        </div>

        <!-- Annotated Essay Output & Red-Pen Inspector Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-12 border-b border-slate-200">
          <!-- Annotated Draft Canvas (7 cols) -->
          <div class="lg:col-span-7 p-5 sm:p-7 bg-white border-b lg:border-b-0 lg:border-r border-slate-200">
            <div class="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <h4 class="text-sm sm:text-base font-bold text-slate-900">
                  Live Annotated Script (Click Any Highlighted Phrase)
                </h4>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs">
                <span class="inline-flex items-center gap-1.5 text-amber-900 font-semibold">
                  <span class="w-3 h-3 rounded-sm bg-amber-200 border border-amber-500"></span>
                  Amber = B1/B2 Crutch / Cliché
                </span>
                <span class="inline-flex items-center gap-1.5 text-emerald-900 font-semibold">
                  <span class="w-3 h-3 rounded-sm bg-emerald-200 border border-emerald-500"></span>
                  Emerald = C1/C2 Structural Pivot
                </span>
              </div>
            </div>

            <div id="gm-annotated-essay-box" class="p-4 sm:p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 min-h-[220px]">
            </div>
          </div>

          <!-- Right Column: Red-Pen Replacement Inspector & C1 Checklist (5 cols) -->
          <div class="lg:col-span-5 p-5 sm:p-7 bg-slate-50/80 flex flex-col justify-between space-y-6">
            <!-- Active Token Red-Pen Inspector Card -->
            <div>
              <div class="flex items-center justify-between mb-2.5">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <i class="fa-solid fa-pen-nib text-rose-600" aria-hidden="true"></i>
                  <span>Belfast Desk Red-Pen Inspector</span>
                </h4>
                <span id="gm-inspector-counter" class="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Click a highlight
                </span>
              </div>

              <div id="gm-redpen-inspector-card" class="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2.5">
              </div>

              <!-- Quick Flagged Crutch Pills List -->
              <div id="gm-amber-pills-wrap" class="mt-3">
              </div>
            </div>

            <!-- C1/C2 5-Pillar Structural Marker Checklist -->
            <div class="pt-4 border-t border-slate-200">
              <div class="flex items-center justify-between mb-2.5">
                <h4 class="text-xs font-bold uppercase tracking-wider text-slate-700">
                  5-Pillar C1/C2 Syntactic Marker Audit
                </h4>
                <span id="gm-c1-pillar-score" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  0 / 5 Pillars Hit
                </span>
              </div>
              <div id="gm-c1-checklist" class="space-y-2">
              </div>
            </div>
          </div>
        </div>

        <!-- Sentence Length Variance & Rhythm Sparkline Bar -->
        <div class="p-5 sm:p-7 bg-slate-50 border-b border-slate-200">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div>
              <div class="flex flex-wrap items-center gap-2.5">
                <h4 class="text-sm sm:text-base font-bold text-slate-900">
                  Sentence Length Variance &amp; Rhythm Analyzer
                </h4>
                <span id="gm-cadence-badge" class="px-2.5 py-0.5 rounded-full text-xs font-bold border">
                  Balanced Academic Cadence
                </span>
              </div>
              <p id="gm-cadence-advice" class="text-xs sm:text-sm text-slate-600 mt-1">
              </p>
            </div>
            <div class="flex items-center gap-4 shrink-0 text-xs font-mono bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <span class="text-slate-400 block text-[10px] uppercase">Mean Length</span>
                <span id="gm-rhythm-mean" class="font-bold text-slate-900">0.0 words</span>
              </div>
              <div class="h-6 w-px bg-slate-200"></div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase">Std Dev (&sigma;)</span>
                <span id="gm-rhythm-sigma" class="font-bold text-indigo-600">&sigma; = 0.0</span>
              </div>
              <div class="h-6 w-px bg-slate-200"></div>
              <div>
                <span class="text-slate-400 block text-[10px] uppercase">Target Zone</span>
                <span class="font-bold text-emerald-700">4.5 &le; &sigma; &le; 11.0</span>
              </div>
            </div>
          </div>

          <!-- Visual Bar-Chart Sparkline -->
          <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-inner">
            <div id="gm-sparkline-bars" class="gm-sparkline-grid" aria-label="Sentence length sparkline chart">
            </div>
            <div class="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <span>Each bar = 1 sentence in your draft (hover a bar to inspect sentence &amp; word count)</span>
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-indigo-500"></span> 12–28w (Optimal Academic Clause)</span>
                <span class="inline-flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> &lt;12w (Short Punch) or &gt;28w (Long Complex)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- High-Converting Diagnostic Prescription Card (The Conversion Hook) -->
        <div class="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div class="max-w-2xl space-y-2.5">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <i class="fa-solid fa-user-check" aria-hidden="true"></i>
                <span>Next Step: Human Examiner Line-by-Line Rebuild</span>
              </div>
              <h4 class="text-xl sm:text-2xl font-black tracking-tight text-white">
                Bring This Exact Draft to a 30-Minute Live Diagnostic (£35)
              </h4>
              <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Automated scanners can spot your syntax patterns, but they can't fix your argument logic or natural collocations. Bring this exact draft to a 30-Minute Live Diagnostic (£35) — I will mark it up beforehand and we will rebuild your weakest paragraphs live on screen.
              </p>
              <p id="gm-conversion-copy-feedback" class="text-xs text-emerald-400 font-semibold hidden">
                <i class="fa-solid fa-circle-check mr-1" aria-hidden="true"></i>
                Draft &amp; diagnostic report copied to your clipboard and attached to your booking form!
              </p>
            </div>

            <div class="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <a
                href="index.html?source=essay_scanner#contact"
                id="gm-send-draft-book-btn"
                class="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl font-black text-sm sm:text-base bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg transition text-center"
              >
                <span>Send This Draft + Book £35 Live Diagnostic &amp; Markup &rarr;</span>
              </a>
              <span class="text-[11px] text-slate-400 text-center lg:text-right">
                Auto-copies your draft + diagnostic report &bull; £35 credited toward any 10- or 12-lesson pack
              </span>
            </div>
          </div>
        </div>
      </div>
    `;

    const textarea = root.querySelector('#gm-stress-textarea');
    const wordCountEl = root.querySelector('#gm-live-word-count');
    const sentenceCountEl = root.querySelector('#gm-live-sentence-count');
    const clearBtn = root.querySelector('#gm-clear-essay-btn');
    const runScanBtn = root.querySelector('#gm-run-scan-btn');
    const presetBtns = root.querySelectorAll('[data-preset-btn]');
    const ceilingPill = root.querySelector('#gm-ceiling-score-pill');
    const ceilingHeadline = root.querySelector('#gm-ceiling-headline');
    const statAmber = root.querySelector('#gm-stat-amber');
    const statEmerald = root.querySelector('#gm-stat-emerald');
    const statSigma = root.querySelector('#gm-stat-sigma');
    const ceilingReasonsList = root.querySelector('#gm-ceiling-reasons-list');
    const annotatedBox = root.querySelector('#gm-annotated-essay-box');
    const inspectorCounter = root.querySelector('#gm-inspector-counter');
    const inspectorCard = root.querySelector('#gm-redpen-inspector-card');
    const amberPillsWrap = root.querySelector('#gm-amber-pills-wrap');
    const c1PillarScore = root.querySelector('#gm-c1-pillar-score');
    const c1Checklist = root.querySelector('#gm-c1-checklist');
    const cadenceBadge = root.querySelector('#gm-cadence-badge');
    const cadenceAdvice = root.querySelector('#gm-cadence-advice');
    const rhythmMean = root.querySelector('#gm-rhythm-mean');
    const rhythmSigma = root.querySelector('#gm-rhythm-sigma');
    const sparklineBars = root.querySelector('#gm-sparkline-bars');
    const sendDraftBookBtn = root.querySelector('#gm-send-draft-book-btn');
    const copyFeedbackEl = root.querySelector('#gm-conversion-copy-feedback');

    textarea.value = currentText;

    function renderInspector() {
      const spans = currentResult.acceptedSpans;
      if (spans.length === 0) {
        inspectorCounter.textContent = '0 highlights';
        inspectorCard.innerHTML = `
          <div class="text-xs text-slate-500 leading-relaxed">
            No highlighted phrases selected yet. Run a scan or click any <span class="text-amber-800 font-semibold">Amber flag</span> or <span class="text-emerald-800 font-semibold">Emerald C1 pivot</span> in the script on the left.
          </div>
        `;
        amberPillsWrap.innerHTML = '';
        return;
      }

      const activeSpan = spans.find((s) => s.spanIndex === activeSpanIndex) || spans[0];
      activeSpanIndex = activeSpan.spanIndex;
      const pos = spans.indexOf(activeSpan) + 1;
      inspectorCounter.textContent = `Highlight #${pos} of ${spans.length}`;

      if (activeSpan.type === 'amber') {
        inspectorCard.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <i class="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true"></i>${escapeHtml(activeSpan.label)}
            </span>
            <span class="text-[11px] font-mono text-slate-400">Amber Flag</span>
          </div>
          <div class="p-2.5 rounded-xl bg-rose-50/70 border border-rose-200 text-xs">
            <span class="text-rose-700 font-bold uppercase text-[10px] block mb-0.5">Flagged in Draft:</span>
            <span class="line-through text-rose-900 font-semibold">"${escapeHtml(activeSpan.matchedText)}"</span>
          </div>
          <div class="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
            <span class="text-emerald-800 font-bold uppercase text-[10px] block mb-0.5">Gareth's C1 Red-Pen Upgrade:</span>
            <span class="text-emerald-950 font-bold">${escapeHtml(activeSpan.replacement)}</span>
          </div>
          <p class="text-xs text-slate-600 leading-relaxed pt-1">
            <strong class="text-slate-900">Belfast Desk Note:</strong> ${escapeHtml(activeSpan.note)}
          </p>
        `;
      } else {
        inspectorCard.innerHTML = `
          <div class="flex items-center justify-between gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
              <i class="fa-solid fa-circle-check mr-1" aria-hidden="true"></i>${escapeHtml(activeSpan.label)}
            </span>
            <span class="text-[11px] font-mono text-emerald-700 font-semibold">C1/C2 Pivot</span>
          </div>
          <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
            <span class="text-emerald-800 font-bold uppercase text-[10px] block mb-0.5">Detected in Your Draft:</span>
            <span class="text-emerald-950 font-bold">"${escapeHtml(activeSpan.matchedText)}"</span>
          </div>
          <div class="p-2 rounded-lg bg-slate-100 text-[11px] font-mono text-slate-700">
            Blueprint: ${escapeHtml(activeSpan.formula)}
          </div>
          <p class="text-xs text-slate-600 leading-relaxed pt-1">
            <strong class="text-slate-900">Examiner Impact:</strong> ${escapeHtml(activeSpan.note)}
          </p>
        `;
      }

      // Render clickable quick-jump pills for all Amber flags so visitor can cycle through every replacement
      if (currentResult.amberMatches.length > 0) {
        const pillsHtml = currentResult.amberMatches
          .map((m) => {
            const isCurr = m.spanIndex === activeSpanIndex;
            const cls = isCurr
              ? 'bg-amber-500 text-slate-950 border-amber-600 font-bold shadow-sm'
              : 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50 font-medium';
            return `<button type="button" data-stress-span="${m.spanIndex}" class="px-2.5 py-1 rounded-lg text-xs border transition ${cls}">"${escapeHtml(m.matchedText)}"</button>`;
          })
          .join('');
        amberPillsWrap.innerHTML = `
          <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Flagged Crutches &amp; Clichés (${currentResult.amberMatches.length}) — Click to Inspect Upgrade:
          </div>
          <div class="flex flex-wrap gap-1.5">${pillsHtml}</div>
        `;
      } else {
        amberPillsWrap.innerHTML = `
          <div class="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
            <i class="fa-solid fa-check-double mr-1 text-emerald-600" aria-hidden="true"></i>
            Zero B1/B2 crutch words or memorised clichés flagged in this draft!
          </div>
        `;
      }
    }

    function renderAll() {
      wordCountEl.textContent = `${currentResult.wordCount} words`;
      sentenceCountEl.textContent = `${currentResult.sentenceCount} sentences`;

      // Update preset buttons active styling
      presetBtns.forEach((btn) => {
        const id = btn.getAttribute('data-preset-btn');
        if (id === activePresetId) {
          btn.className = 'preset-btn px-3.5 py-2 rounded-xl text-xs font-bold transition text-left border bg-amber-500 text-slate-950 border-amber-400 shadow-sm';
        } else {
          btn.className = 'preset-btn px-3.5 py-2 rounded-xl text-xs font-bold transition text-left border bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700';
        }
      });

      // Ceiling score pill & reasons
      ceilingPill.className = `inline-block px-3.5 py-1.5 rounded-xl font-black text-xl sm:text-2xl bg-gradient-to-r ${currentResult.ceilingBadgeColor} shadow-sm mb-2`;
      ceilingPill.textContent = currentResult.ceilingScore;
      ceilingHeadline.textContent = currentResult.ceilingHeadline;

      statAmber.textContent = String(currentResult.amberMatches.length);
      statEmerald.textContent = String(currentResult.emeraldMatches.length);
      statSigma.textContent = String(currentResult.stdDev);

      ceilingReasonsList.innerHTML = currentResult.ceilingReasons
        .map(
          (reason) => `
          <li class="flex items-start gap-2">
            <span class="text-indigo-400 mt-0.5">&bull;</span>
            <span>${escapeHtml(reason)}</span>
          </li>`
        )
        .join('');

      // Annotated essay HTML
      annotatedBox.innerHTML = buildAnnotatedHtml(
        currentResult.rawText,
        currentResult.acceptedSpans,
        activeSpanIndex
      );

      // Red-Pen Inspector
      renderInspector();

      // C1 5-Pillar Checklist
      c1PillarScore.textContent = `${currentResult.c1CategoriesHit} / 5 Pillars Hit`;
      c1Checklist.innerHTML = Object.values(currentResult.c1Counts)
        .map((cat) => {
          const hit = cat.count > 0;
          const badge = hit
            ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">${cat.count} detected</span>`
            : `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">0 found</span>`;
          const subtext = hit
            ? `<div class="text-[11px] text-emerald-800 font-medium mt-1">Matched: ${cat.examples.map((ex) => `"${escapeHtml(ex)}"`).join(', ')}</div>`
            : `<div class="text-[11px] text-slate-500 mt-1">${escapeHtml(cat.tip)}</div>`;
          return `
            <div class="p-3 rounded-xl bg-white border ${hit ? 'border-emerald-300' : 'border-slate-200'} shadow-sm">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <i class="fa-solid ${hit ? 'fa-circle-check text-emerald-600' : 'fa-circle-dot text-slate-400'}" aria-hidden="true"></i>
                  <span>${escapeHtml(cat.title)}</span>
                </span>
                ${badge}
              </div>
              ${subtext}
            </div>
          `;
        })
        .join('');

      // Rhythm & Sparkline
      cadenceBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-bold border ${currentResult.cadenceBadgeClass}`;
      cadenceBadge.textContent = currentResult.cadenceLabel;
      cadenceAdvice.textContent = currentResult.cadenceAdvice;
      rhythmMean.textContent = `${currentResult.meanLength} words`;
      rhythmSigma.textContent = `\u03C3 = ${currentResult.stdDev}`;

      if (currentResult.sentences.length === 0) {
        sparklineBars.innerHTML = `<div class="text-xs text-slate-400 italic py-6 mx-auto">Add at least two sentences to render your sentence-length sparkline.</div>`;
      } else {
        const maxWords = Math.max(34, ...currentResult.sentences.map((s) => s.wordCount));
        sparklineBars.innerHTML = currentResult.sentences
          .map((s, idx) => {
            const pct = Math.max(12, Math.min(100, Math.round((s.wordCount / maxWords) * 100)));
            const isOptimal = s.wordCount >= 12 && s.wordCount <= 28;
            const barColor = isOptimal ? 'bg-indigo-600' : 'bg-amber-500';
            const preview = s.text.length > 90 ? s.text.slice(0, 87) + '...' : s.text;
            return `
              <div class="gm-spark-col" title="Sentence ${idx + 1} (${s.wordCount} words): ${escapeHtml(preview)}">
                <span class="text-[10px] font-mono font-bold text-slate-600 mb-1">${s.wordCount}w</span>
                <div class="gm-spark-bar ${barColor}" style="height: ${pct}%"></div>
                <span class="text-[10px] font-mono text-slate-400 mt-1">S${idx + 1}</span>
              </div>
            `;
          })
          .join('');
      }
    }

    // Event Delegation for clicking or hovering highlighted spans
    root.addEventListener('click', (e) => {
      const spanBtn = e.target.closest('[data-stress-span]');
      if (spanBtn) {
        activeSpanIndex = Number(spanBtn.getAttribute('data-stress-span'));
        annotatedBox.innerHTML = buildAnnotatedHtml(
          currentResult.rawText,
          currentResult.acceptedSpans,
          activeSpanIndex
        );
        renderInspector();
        return;
      }

      const presetBtn = e.target.closest('[data-preset-btn]');
      if (presetBtn) {
        const presetKey = presetBtn.getAttribute('data-preset-btn');
        const preset = SAMPLE_PRESETS[presetKey];
        if (preset) {
          activePresetId = presetKey;
          currentText = preset.text;
          textarea.value = currentText;
          currentResult = scanEssay(currentText);
          activeSpanIndex = currentResult.acceptedSpans.length > 0 ? currentResult.acceptedSpans[0].spanIndex : null;
          persistScanResult(currentResult, `preset_${presetKey}`);
          renderAll();
        }
      }
    });

    // Also allow hovering over any highlighted phrase in the annotated essay box to preview its red-pen replacement
    annotatedBox.addEventListener('mouseover', (e) => {
      const spanBtn = e.target.closest('[data-stress-span]');
      if (!spanBtn) return;
      const hoveredIdx = Number(spanBtn.getAttribute('data-stress-span'));
      if (hoveredIdx && hoveredIdx !== activeSpanIndex) {
        activeSpanIndex = hoveredIdx;
        renderInspector();
      }
    });

    // Run Scan button
    runScanBtn.addEventListener('click', () => {
      activePresetId = null;
      currentText = textarea.value;
      currentResult = scanEssay(currentText);
      activeSpanIndex = currentResult.acceptedSpans.length > 0 ? currentResult.acceptedSpans[0].spanIndex : null;
      persistScanResult(currentResult, 'manual_scan');
      renderAll();
    });

    // Live typing updates (debounced so typing feels instantaneous)
    let debounceTimer = null;
    textarea.addEventListener('input', () => {
      activePresetId = null;
      currentText = textarea.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentResult = scanEssay(currentText);
        if (!currentResult.acceptedSpans.some((s) => s.spanIndex === activeSpanIndex)) {
          activeSpanIndex = currentResult.acceptedSpans.length > 0 ? currentResult.acceptedSpans[0].spanIndex : null;
        }
        persistScanResult(currentResult, 'live_input');
        renderAll();
      }, 180);
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      activePresetId = null;
      currentText = '';
      textarea.value = '';
      currentResult = scanEssay('');
      activeSpanIndex = null;
      renderAll();
      textarea.focus();
    });

    // Conversion Hook CTA: Copy draft & diagnostic summary to clipboard + localStorage, then navigate
    sendDraftBookBtn.addEventListener('click', (e) => {
      currentText = textarea.value || currentText;
      currentResult = scanEssay(currentText);
      persistScanResult(currentResult, 'conversion_cta_click');

      const clipboardSummary = [
        `=== GARETH MONTGOMERY ESSAY DIAGNOSTIC REPORT ===`,
        `Estimated Structural Ceiling: ${currentResult.ceilingScore}`,
        `Word Count: ${currentResult.wordCount} words (${currentResult.sentenceCount} sentences)`,
        `Sentence Rhythm: Mean ${currentResult.meanLength}w | Std Dev σ = ${currentResult.stdDev} (${currentResult.cadenceLabel})`,
        `Amber Flags (Clichés / B1 Crutches): ${currentResult.amberMatches.length}`,
        `Emerald C1/C2 Structural Pivots: ${currentResult.emeraldMatches.length} (${currentResult.c1CategoriesHit}/5 pillars)`,
        ``,
        `--- STUDENT DRAFT ---`,
        currentResult.rawText.trim()
      ].join('\n');

      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        e.preventDefault();
        const targetHref = sendDraftBookBtn.getAttribute('href') || 'index.html?source=essay_scanner#contact';
        navigator.clipboard.writeText(clipboardSummary).catch(() => {}).finally(() => {
          if (copyFeedbackEl) copyFeedbackEl.classList.remove('hidden');
          setTimeout(() => {
            window.location.href = targetHref;
          }, 220);
        });
      }
    });

    renderAll();

    return {
      scanEssay,
      getCurrentResult: () => currentResult,
      loadPreset: (presetKey) => {
        if (SAMPLE_PRESETS[presetKey]) {
          activePresetId = presetKey;
          currentText = SAMPLE_PRESETS[presetKey].text;
          textarea.value = currentText;
          currentResult = scanEssay(currentText);
          activeSpanIndex = currentResult.acceptedSpans.length > 0 ? currentResult.acceptedSpans[0].spanIndex : null;
          persistScanResult(currentResult, `api_preset_${presetKey}`);
          renderAll();
        }
      }
    };
  }

  window.SyntaxStressTester = {
    mount: mountStressTester,
    scan: scanEssay,
    presets: SAMPLE_PRESETS,
    amberRules: AMBER_RULES,
    emeraldCategories: EMERALD_CATEGORIES
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      mountStressTester('#live-syntax-stress-tester');
    });
  } else {
    mountStressTester('#live-syntax-stress-tester');
  }
})();
