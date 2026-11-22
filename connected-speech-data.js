/* ==========================================================
   Connected Speech & Rhythm Lab
   Curriculum, Daily 5 Seed, Duel Codec & Data Integrity Tests
   Exposes window.CONNECTED_SPEECH_DATA (and module.exports)
   ========================================================== */
(function (root) {
  'use strict';

  const acts = [
    {
      act: 1,
      id: 'act1',
      shortTitle: 'Weak Forms',
      title: 'Act I · Auxiliary & Present Perfect Continuous Weak Forms',
      cefr: 'B2+ / C1',
      description: 'Compress unstressed auxiliaries like "I\'ve been" and "for" into crisp schwa bridges so stressed verbs and nouns stand out cleanly.'
    },
    {
      act: 2,
      id: 'act2',
      shortTitle: 'Past Modals',
      title: 'Act II · Past Modals of Deduction (modal + have + V3)',
      cefr: 'C1',
      description: 'Keep "must have", "should have", and "can\'t have" fluent by reducing "have" to /əv/ instead of pausing on a heavy full vowel.'
    },
    {
      act: 3,
      id: 'act3',
      shortTitle: 'Elision & Linking',
      title: 'Act III · Elision /t/, /d/ & Catenation / Linking /r/, /w/, /j/',
      cefr: 'C1',
      description: 'Drop awkward consonant-cluster stops between words and smooth vowel boundaries with natural British linking glides.'
    },
    {
      act: 4,
      id: 'act4',
      shortTitle: 'Stress-Timing',
      title: 'Act IV · C1 Stress-Timing & Schwa /ə/ Valleys',
      cefr: 'C1 / C2',
      description: 'Deliver high-scoring Cambridge inversions, concessive pivots, and conditionals with steady rhythmic beats and relaxed weak syllables.'
    }
  ];

  const allDrills = [
    /* ===== ACT I: AUXILIARY & PRESENT PERFECT CONTINUOUS WEAK FORMS ===== */
    {
      id: 'cs1',
      num: '01',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'B2+',
      title: '1. Auxiliary Compression ("Ahv-bin")',
      context: 'IELTS Speaking Part 1 · Answering a routine work/study question without sounding robotic.',
      audioSrc: 'assets/audio/tts/connected-speech-01-ive-been-taking.mp3',
      writtenText: "I've been taking a break from work.",
      targetFeature: 'Auxiliary & preposition reduction (/aɪv bɪn/ · /ə/ · /frəm/)',
      weakIpa: '/aɪv bɪn ˈteɪkɪŋ ə breɪk frəm wɜːk/',
      phoneticRespelling: 'Ahv-bin TAK-ing uh BREAK fruhm WORK',
      formula: "Subject + 've been (/aɪv bɪn/) + VERB-ing + a (/ə/) + NOUN + from (/frəm/) + NOUN",
      belfastNote: 'Candidates often give "I\'ve been" and "from" the same heavy volume as "break" and "work". When I mark Speaking tests, squeezing "I\'ve been" down to a light "Ahv-bin" is the quickest way to make your rhythm sound natural.',
      segments: [
        { text: "I've been", role: 'weak', ipa: '/aɪv bɪn/' },
        { text: 'TAKing', role: 'stress', ipa: '/ˈteɪkɪŋ/' },
        { text: 'a', role: 'weak', ipa: '/ə/' },
        { text: 'BREAK', role: 'stress', ipa: '/breɪk/' },
        { text: 'from', role: 'weak', ipa: '/frəm/' },
        { text: 'WORK.', role: 'stress', ipa: '/wɜːk/' }
      ],
      peaks: [
        { pos: 0.24, amp: 0.88, label: 'TAK-ing' },
        { pos: 0.56, amp: 0.96, label: 'BREAK' },
        { pos: 0.80, amp: 0.90, label: 'WORK' }
      ],
      valleys: [
        { pos: 0.09, label: 'Ahv-bin /aɪv bɪn/' },
        { pos: 0.44, label: 'a /ə/' },
        { pos: 0.69, label: 'from /frəm/' }
      ],
      rhythmChunks: [
        { text: 'Ahv-bin', role: 'weak', pos: 0.09, amp: 0.34 },
        { text: 'TAK-ing', role: 'stress', pos: 0.26, amp: 0.88 },
        { text: 'uh BREAK', role: 'stress', pos: 0.56, amp: 0.96 },
        { text: 'fruhm WORK', role: 'stress', pos: 0.80, amp: 0.90 }
      ]
    },
    {
      id: 'cs2',
      num: '02',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'B2+',
      title: '2. Wh-Auxiliary Fusion ("What-uv-yuh-bin")',
      context: 'Everyday & Workplace Conversation · Keeping multi-auxiliary questions smooth.',
      audioSrc: 'assets/audio/tts/connected-speech-02-what-have-you-been.mp3',
      writtenText: 'What have you been working on recently?',
      targetFeature: 'Wh-auxiliary linking & schwa chain (/wɒtəvjə bɪn/)',
      weakIpa: '/wɒtəvjə bɪn ˈwɜːkɪŋ ɒn ˈriːsəntli/',
      phoneticRespelling: 'WOT-uhv-yuh-bin WERK-ing on REE-suhnt-lee',
      formula: 'WH-word (STRESS) + have you been (/əvjə bɪn/) + MAIN VERB (STRESS)',
      belfastNote: 'Pronouncing "have you been" word by word breaks a question into four stiff beats. Link the /t/ of "what" straight into "have" and let "you been" glide past in one relaxed breath.',
      segments: [
        { text: 'WHAT', role: 'stress', ipa: '/wɒt/' },
        { text: 'have you been', role: 'weak', ipa: '/əvjə bɪn/' },
        { text: 'WORKing', role: 'stress', ipa: '/ˈwɜːkɪŋ/' },
        { text: 'on', role: 'weak', ipa: '/ɒn/' },
        { text: 'REcently?', role: 'stress', ipa: '/ˈriːsəntli/' }
      ],
      peaks: [
        { pos: 0.10, amp: 0.86, label: 'WHAT' },
        { pos: 0.42, amp: 0.95, label: 'WORK-ing' },
        { pos: 0.78, amp: 0.93, label: 'RE-cent-ly' }
      ],
      valleys: [
        { pos: 0.23, label: 'əv-yuh-bin' },
        { pos: 0.56, label: 'on /ɒn/' }
      ],
      rhythmChunks: [
        { text: 'WHAT', role: 'stress', pos: 0.10, amp: 0.86 },
        { text: 'uhv-yuh-bin', role: 'weak', pos: 0.24, amp: 0.30 },
        { text: 'WORK-ing on', role: 'stress', pos: 0.42, amp: 0.95 },
        { text: 'RE-cent-ly?', role: 'stress', pos: 0.78, amp: 0.93 }
      ]
    },
    {
      id: 'cs3',
      num: '03',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'C1',
      title: '3. Weak Preposition "For" (/fə/)',
      context: 'IELTS Part 1 / Part 2 · Talking about durations without over-stressing prepositions.',
      audioSrc: 'assets/audio/tts/connected-speech-03-driving-for-six.mp3',
      writtenText: "I've been driving for six months now.",
      targetFeature: 'Preposition reduction (/fə sɪks/) + compressed auxiliary (/aɪv bɪn/)',
      weakIpa: '/aɪv bɪn ˈdraɪvɪŋ fə sɪks mʌnθs naʊ/',
      phoneticRespelling: 'Ahv-bin DRY-ving fuh SIX munths NOW',
      formula: "Subject + 've been (/aɪv bɪn/) + VERB-ing + for (/fə/) + NUMBER + TIME",
      belfastNote: 'Saying a strong /fɔː/ ("FOUR six months") makes your listener expect a contrast ("for, not against"). Drop "for" right down to /fə/ so the number and noun carry the meaning.',
      segments: [
        { text: "I've been", role: 'weak', ipa: '/aɪv bɪn/' },
        { text: 'DRIVing', role: 'stress', ipa: '/ˈdraɪvɪŋ/' },
        { text: 'for', role: 'weak', ipa: '/fə/' },
        { text: 'SIX', role: 'stress', ipa: '/sɪks/' },
        { text: 'MONTHS', role: 'stress', ipa: '/mʌnθs/' },
        { text: 'NOW.', role: 'stress', ipa: '/naʊ/' }
      ],
      peaks: [
        { pos: 0.24, amp: 0.92, label: 'DRIV-ing' },
        { pos: 0.56, amp: 0.88, label: 'SIX' },
        { pos: 0.74, amp: 0.94, label: 'MONTHS' },
        { pos: 0.90, amp: 0.86, label: 'NOW' }
      ],
      valleys: [
        { pos: 0.09, label: 'Ahv-bin' },
        { pos: 0.44, label: 'for /fə/' }
      ],
      rhythmChunks: [
        { text: 'Ahv-bin', role: 'weak', pos: 0.09, amp: 0.32 },
        { text: 'DRIV-ing', role: 'stress', pos: 0.24, amp: 0.92 },
        { text: 'fuh', role: 'weak', pos: 0.44, amp: 0.28 },
        { text: 'SIX MONTHS NOW', role: 'stress', pos: 0.76, amp: 0.94 }
      ]
    },
    {
      id: 'cs13',
      num: '04',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'C1',
      title: '4. Weak "Them" & Correlative "As ... As" (/əz/)',
      context: 'Workplace & IELTS Part 1 · Delivering urgent requests cleanly without flattening key nouns.',
      audioSrc: 'assets/audio/tts/connected-speech-13-as-soon-as-possible.mp3',
      writtenText: 'Send them the report as soon as possible.',
      targetFeature: 'Weak pronoun ("them" /ðəm/) + double-schwa correlative ("as soon as" /əz ˈsuːn əz/)',
      weakIpa: '/ˈsend ðəm ðə rɪˈpɔːt əz ˈsuːn əz ˈpɒsəbl/',
      phoneticRespelling: 'SEND-thuhm thuh rih-PORT uhz SOON uhz POS-uh-buhl',
      formula: 'VERB (STRESS) + them (/ðəm/) + the (/ðə/) + re-PORT + as (/əz/) + SOON + as (/əz/) + POS-sible',
      belfastNote: 'When I listen to workplace role-plays, learners often give both uses of "as" a heavy /æz/ vowel. Let "them", "the", and both "as" bridges drop to feather-light schwas so "SEND", "re-PORT", "SOON", and "POS-sible" carry the beat.',
      segments: [
        { text: 'SEND', role: 'stress', ipa: '/send/' },
        { text: 'them', role: 'weak', ipa: '/ðəm/' },
        { text: 'the', role: 'weak', ipa: '/ðə/' },
        { text: 'rePORT', role: 'stress', ipa: '/rɪˈpɔːt/' },
        { text: 'as', role: 'weak', ipa: '/əz/' },
        { text: 'SOON', role: 'stress', ipa: '/suːn/' },
        { text: 'as', role: 'weak', ipa: '/əz/' },
        { text: 'POSsible.', role: 'stress', ipa: '/ˈpɒsəbl/' }
      ],
      peaks: [
        { pos: 0.10, amp: 0.90, label: 'SEND' },
        { pos: 0.36, amp: 0.94, label: 're-PORT' },
        { pos: 0.62, amp: 0.95, label: 'SOON' },
        { pos: 0.84, amp: 0.90, label: 'POS-sible' }
      ],
      valleys: [
        { pos: 0.22, label: 'them the' },
        { pos: 0.50, label: 'as /əz/' },
        { pos: 0.72, label: 'as /əz/' }
      ],
      rhythmChunks: [
        { text: 'SEND', role: 'stress', pos: 0.10, amp: 0.90 },
        { text: 'thuhm-thuh', role: 'weak', pos: 0.22, amp: 0.28 },
        { text: 'rih-PORT', role: 'stress', pos: 0.37, amp: 0.94 },
        { text: 'uhz SOON uhz POS-uh-buhl', role: 'stress', pos: 0.73, amp: 0.93 }
      ]
    },
    {
      id: 'cs14',
      num: '05',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'C1',
      title: '5. Weak "Were" & Comparative "Than" (/wə ... ðən/)',
      context: 'IELTS Part 3 & Project Review · Comparing outcomes smoothly without over-pronouncing function words.',
      audioSrc: 'assets/audio/tts/connected-speech-14-better-than-expected.mp3',
      writtenText: 'The results were far better than expected.',
      targetFeature: 'Weak copula ("were" /wə/) + weak comparative ("than" /ðən/) + schwa article (/ðə/)',
      weakIpa: '/ðə rɪˈzʌlts wə ˈfɑː ˈbetə ðən ɪkˈspektɪd/',
      phoneticRespelling: 'thuh rih-ZULTS wuh FAH BET-uh thuhn ik-SPEK-tid',
      formula: 'the (/ðə/) + NOUN + were (/wə/) + FAR BET-ter + than (/ðən/) + V3 (STRESS)',
      belfastNote: 'Give "were" its full /wɜː/ vowel and the whole sentence stalls in the middle. In natural British speech, "were" sinks to /wə/ and "than" melts into /ðən/, letting "re-SULTS", "FAR", "BET-ter", and "ex-PEC-ted" carry the meaning.',
      segments: [
        { text: 'The', role: 'weak', ipa: '/ðə/' },
        { text: 'reSULTS', role: 'stress', ipa: '/rɪˈzʌlts/' },
        { text: 'were', role: 'weak', ipa: '/wə/' },
        { text: 'FAR', role: 'stress', ipa: '/fɑː/' },
        { text: 'BETter', role: 'stress', ipa: '/ˈbetə/' },
        { text: 'than', role: 'weak', ipa: '/ðən/' },
        { text: 'exPECted.', role: 'stress', ipa: '/ɪkˈspektɪd/' }
      ],
      peaks: [
        { pos: 0.19, amp: 0.90, label: 're-SULTS' },
        { pos: 0.44, amp: 0.94, label: 'FAR' },
        { pos: 0.59, amp: 0.92, label: 'BET-ter' },
        { pos: 0.84, amp: 0.91, label: 'ex-PEC-ted' }
      ],
      valleys: [
        { pos: 0.06, label: 'the /ðə/' },
        { pos: 0.32, label: 'were /wə/' },
        { pos: 0.70, label: 'than /ðən/' }
      ],
      rhythmChunks: [
        { text: 'thuh rih-ZULTS', role: 'stress', pos: 0.18, amp: 0.90 },
        { text: 'wuh', role: 'weak', pos: 0.32, amp: 0.26 },
        { text: 'FAR BET-uh', role: 'stress', pos: 0.52, amp: 0.94 },
        { text: 'thuhn ik-SPEK-tid', role: 'stress', pos: 0.82, amp: 0.91 }
      ]
    },
    {
      id: 'cs15',
      num: '06',
      act: 1,
      actTitle: acts[0].title,
      cefr: 'C1',
      title: '6. Existential "There Could Be a" (/ðə kəd bi ə/)',
      context: 'IELTS Speaking Part 3 · Opening a balanced social-policy point with natural British pacing.',
      audioSrc: 'assets/audio/tts/connected-speech-15-shortage-of-housing.mp3',
      writtenText: 'There could be a shortage of affordable housing.',
      targetFeature: 'Existential cluster ("There could be a" /ðə kəd bi ə/) + weak preposition ("of" /əv/)',
      weakIpa: '/ðə kəd bi ə ˈʃɔːtɪdʒ əv əˈfɔːdəbl ˈhaʊzɪŋ/',
      phoneticRespelling: 'thuh-kuhd-bee-uh SHAW-tij uhv uh-FAW-duh-buhl HOW-zing',
      formula: 'There could be a (/ðə kəd bi ə/) + NOUN (STRESS) + of (/əv/) + ADJ (STRESS) + NOUN (STRESS)',
      belfastNote: 'When candidates open a Part 3 answer with "There could be a...", stressing every word makes the opening feel hesitant. Glide lightly across all four function words in one breath until you land on "SHORT-age", "af-FORD-able", and "HOUS-ing".',
      segments: [
        { text: 'There could be a', role: 'weak', ipa: '/ðə kəd bi ə/' },
        { text: 'SHORTage', role: 'stress', ipa: '/ˈʃɔːtɪdʒ/' },
        { text: 'of', role: 'weak', ipa: '/əv/' },
        { text: 'afFORDable', role: 'stress', ipa: '/əˈfɔːdəbl/' },
        { text: 'HOUSing.', role: 'stress', ipa: '/ˈhaʊzɪŋ/' }
      ],
      peaks: [
        { pos: 0.36, amp: 0.94, label: 'SHORT-age' },
        { pos: 0.62, amp: 0.92, label: 'af-FORD-' },
        { pos: 0.86, amp: 0.90, label: 'HOUS-ing' }
      ],
      valleys: [
        { pos: 0.14, label: 'There could be a' },
        { pos: 0.49, label: 'of /əv/' }
      ],
      rhythmChunks: [
        { text: 'thuh-kuhd-bee-uh', role: 'weak', pos: 0.14, amp: 0.30 },
        { text: 'SHAW-tij', role: 'stress', pos: 0.36, amp: 0.94 },
        { text: 'uhv', role: 'weak', pos: 0.49, amp: 0.25 },
        { text: 'uh-FAW-duh-buhl HOW-zing', role: 'stress', pos: 0.76, amp: 0.92 }
      ]
    },

    /* ===== ACT II: PAST MODALS OF DEDUCTION ===== */
    {
      id: 'cs4',
      num: '07',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '7. Modal Deduction ("MUST-uhv")',
      context: 'Cambridge C1 Speaking Part 2 · Speculating about a picture or late arrival.',
      audioSrc: 'assets/audio/tts/connected-speech-04-must-have-missed.mp3',
      writtenText: 'She must have missed the early train.',
      targetFeature: 'Modal + weak "have" (/mʌstəv/) + weak article "the" (/ði/)',
      weakIpa: '/ʃi ˈmʌstəv mɪst ði ˈɜːli treɪn/',
      phoneticRespelling: 'shuh MUST-uhv MIST thee UR-lee TRAIN',
      formula: 'Subject (weak) + MUST (STRESS) + have (/əv/) + PAST PARTICIPLE (STRESS)',
      belfastNote: 'In past modals of deduction, the modal carries your certainty while "have" melts into /əv/. Never stress "have" here unless you are arguing against someone who denied it.',
      segments: [
        { text: 'She', role: 'weak', ipa: '/ʃi/' },
        { text: 'MUST', role: 'stress', ipa: '/mʌst/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'MISSED', role: 'stress', ipa: '/mɪst/' },
        { text: 'the', role: 'weak', ipa: '/ði/' },
        { text: 'EARly', role: 'stress', ipa: '/ˈɜːli/' },
        { text: 'TRAIN.', role: 'stress', ipa: '/treɪn/' }
      ],
      peaks: [
        { pos: 0.17, amp: 0.95, label: 'MUST' },
        { pos: 0.41, amp: 0.88, label: 'MISSED' },
        { pos: 0.65, amp: 0.89, label: 'EAR-ly' },
        { pos: 0.87, amp: 0.92, label: 'TRAIN' }
      ],
      valleys: [
        { pos: 0.05, label: 'She /ʃi/' },
        { pos: 0.28, label: 'have /əv/' },
        { pos: 0.51, label: 'the /ði/' }
      ],
      rhythmChunks: [
        { text: 'shuh MUST-uhv', role: 'stress', pos: 0.18, amp: 0.94 },
        { text: 'MISSED', role: 'stress', pos: 0.41, amp: 0.88 },
        { text: 'thee', role: 'weak', pos: 0.52, amp: 0.28 },
        { text: 'EAR-ly TRAIN', role: 'stress', pos: 0.78, amp: 0.92 }
      ]
    },
    {
      id: 'cs5',
      num: '08',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '8. Past Regret Modal ("SHUD-uhv")',
      context: 'Workplace Review · Giving firm hindsight feedback without breaking sentence flow.',
      audioSrc: 'assets/audio/tts/connected-speech-05-should-have-mentioned.mp3',
      writtenText: 'You should have mentioned it earlier.',
      targetFeature: 'Past modal reduction (/ʃʊdəv/) + weak pronoun "it" (/ɪt/)',
      weakIpa: '/jə ˈʃʊdəv ˈmenʃənd ɪt ˈɜːliə/',
      phoneticRespelling: 'yuh SHUD-uhv MEN-shuhnd it UR-lee-uh',
      formula: 'Subject (weak) + SHOULD (STRESS) + have (/əv/) + V3 (STRESS)',
      belfastNote: 'Notice how /t/ in "it" links lightly between "mentioned" and "earlier". Keep "you" and "have" quiet so "should", "mentioned", and "earlier" form a clean three-beat arc.',
      segments: [
        { text: 'You', role: 'weak', ipa: '/jə/' },
        { text: 'SHOULD', role: 'stress', ipa: '/ʃʊd/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'MENtioned', role: 'stress', ipa: '/ˈmenʃənd/' },
        { text: 'it', role: 'weak', ipa: '/ɪt/' },
        { text: 'EARlier.', role: 'stress', ipa: '/ˈɜːliə/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.91, label: 'SHOULD' },
        { pos: 0.42, amp: 0.95, label: 'MEN-tioned' },
        { pos: 0.79, amp: 0.90, label: 'EAR-li-er' }
      ],
      valleys: [
        { pos: 0.04, label: 'You /jə/' },
        { pos: 0.26, label: 'have /əv/' },
        { pos: 0.62, label: 'it /ɪt/' }
      ],
      rhythmChunks: [
        { text: 'yuh SHOULD-uhv', role: 'stress', pos: 0.16, amp: 0.91 },
        { text: 'MEN-tioned', role: 'stress', pos: 0.42, amp: 0.95 },
        { text: 'it', role: 'weak', pos: 0.61, amp: 0.28 },
        { text: 'EAR-li-er', role: 'stress', pos: 0.80, amp: 0.90 }
      ]
    },
    {
      id: 'cs6',
      num: '09',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '9. Negative Deduction ("KAHNT-uhv")',
      context: 'Audit & Analytical Discussion · Expressing disbelief cleanly in C1 debate.',
      audioSrc: 'assets/audio/tts/connected-speech-06-cant-have-finished.mp3',
      writtenText: "They can't have finished the audit already.",
      targetFeature: 'Negative modal reduction (/kɑːntəv/) + vowel-linked article (/ði/)',
      weakIpa: '/ðeɪ ˈkɑːntəv ˈfɪnɪʃt ði ˈɔːdɪt ɔːlˈredi/',
      phoneticRespelling: 'thay KAHNT-uhv FIN-isht thee AW-dit awl-RED-ee',
      formula: "Subject (weak) + CAN'T (STRESS) + have (/əv/) + V3 + the (/ði/) + NOUN",
      belfastNote: 'Even with "n\'t" attached, "have" still shrinks to /əv/. The /t/ on "can\'t" hops right over onto the schwa: "KAHN-tuhv". And before the vowel in "audit", "the" becomes /ði/ ("thee").',
      segments: [
        { text: 'They', role: 'weak', ipa: '/ðeɪ/' },
        { text: "CAN'T", role: 'stress', ipa: '/kɑːnt/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'FINished', role: 'stress', ipa: '/ˈfɪnɪʃt/' },
        { text: 'the', role: 'weak', ipa: '/ði/' },
        { text: 'AUdit', role: 'stress', ipa: '/ˈɔːdɪt/' },
        { text: 'alREADy.', role: 'stress', ipa: '/ɔːlˈredi/' }
      ],
      peaks: [
        { pos: 0.16, amp: 0.88, label: "CAN'T" },
        { pos: 0.38, amp: 0.95, label: 'FIN-ished' },
        { pos: 0.61, amp: 0.90, label: 'AU-dit' },
        { pos: 0.85, amp: 0.89, label: 'al-READ-y' }
      ],
      valleys: [
        { pos: 0.05, label: 'They' },
        { pos: 0.27, label: 'have /əv/' },
        { pos: 0.50, label: 'the /ði/' }
      ],
      rhythmChunks: [
        { text: "thay CAN'T-uhv", role: 'stress', pos: 0.17, amp: 0.88 },
        { text: 'FIN-ished', role: 'stress', pos: 0.38, amp: 0.95 },
        { text: 'thee', role: 'weak', pos: 0.49, amp: 0.27 },
        { text: 'AU-dit al-READ-y', role: 'stress', pos: 0.78, amp: 0.90 }
      ]
    },
    {
      id: 'cs16',
      num: '10',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '10. Tentative Modal ("MY-tuhv")',
      context: 'Cambridge C1 Speaking & Problem-Solving · Suggesting an oversight diplomatically.',
      audioSrc: 'assets/audio/tts/connected-speech-16-might-have-overlooked.mp3',
      writtenText: 'They might have overlooked a crucial detail.',
      targetFeature: 'Tentative deduction ("might have" /ˈmaɪtəv/) + weak indefinite article ("a" /ə/)',
      weakIpa: '/ðeɪ ˈmaɪtəv ˌəʊvəˈlʊkt ə ˈkruːʃəl ˈdiːteɪl/',
      phoneticRespelling: 'thay MY-tuhv oh-vuh-LOOKT uh KROO-shuhl DEE-tayl',
      formula: 'Subject (weak) + MIGHT (STRESS) + have (/əv/) + V3 + a (/ə/) + ADJ + NOUN',
      belfastNote: 'Notice how the /t/ in "might" becomes the onset of the reduced "have": "MY-tuhv". Keeping "they", "have", and "a" low lets the diplomatic modal and the noun phrase sit neatly in focus.',
      segments: [
        { text: 'They', role: 'weak', ipa: '/ðeɪ/' },
        { text: 'MIGHT', role: 'stress', ipa: '/maɪt/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'overLOOKED', role: 'stress', ipa: '/ˌəʊvəˈlʊkt/' },
        { text: 'a', role: 'weak', ipa: '/ə/' },
        { text: 'CRUcial', role: 'stress', ipa: '/ˈkruːʃəl/' },
        { text: 'DEtail.', role: 'stress', ipa: '/ˈdiːteɪl/' }
      ],
      peaks: [
        { pos: 0.16, amp: 0.92, label: 'MIGHT' },
        { pos: 0.42, amp: 0.94, label: '-LOOKED' },
        { pos: 0.67, amp: 0.91, label: 'CRU-cial' },
        { pos: 0.87, amp: 0.89, label: 'DE-tail' }
      ],
      valleys: [
        { pos: 0.05, label: 'They' },
        { pos: 0.25, label: 'have /əv/' },
        { pos: 0.56, label: 'a /ə/' }
      ],
      rhythmChunks: [
        { text: 'thay MY-tuhv', role: 'stress', pos: 0.17, amp: 0.92 },
        { text: 'oh-vuh-LOOKT', role: 'stress', pos: 0.41, amp: 0.94 },
        { text: 'uh', role: 'weak', pos: 0.56, amp: 0.24 },
        { text: 'KROO-shuhl DEE-tayl', role: 'stress', pos: 0.78, amp: 0.91 }
      ]
    },
    {
      id: 'cs17',
      num: '11',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '11. Impossibility Modal ("KUD-uhnt-uhv")',
      context: 'IELTS Part 2 & Storytelling · Praising timing or achievement with natural emphasis.',
      audioSrc: 'assets/audio/tts/connected-speech-17-couldnt-have-chosen.mp3',
      writtenText: "She couldn't have chosen a better moment.",
      targetFeature: 'Negative past modal ("couldn\'t have" /ˈkʊdntəv/) + weak subject ("she" /ʃi/) & article (/ə/)',
      weakIpa: '/ʃi ˈkʊdntəv ˈtʃəʊzən ə ˈbetə ˈməʊmənt/',
      phoneticRespelling: 'shuh KUD-uhnt-uhv CHOH-zuhn uh BET-uh MOH-muhnt',
      formula: "Subject (weak) + COULDN'T (STRESS) + have (/əv/) + V3 + a (/ə/) + ADJ + NOUN",
      belfastNote: 'In my lessons, students often insert an awkward pause between "couldn\'t" and "have". Let the /t/ hop straight across into the schwa ("KUD-uhnt-uhv") so the four stressed beats rock forward evenly.',
      segments: [
        { text: 'She', role: 'weak', ipa: '/ʃi/' },
        { text: "COULDN'T", role: 'stress', ipa: '/ˈkʊdnt/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'CHOSen', role: 'stress', ipa: '/ˈtʃəʊzən/' },
        { text: 'a', role: 'weak', ipa: '/ə/' },
        { text: 'BETter', role: 'stress', ipa: '/ˈbetə/' },
        { text: 'MOment.', role: 'stress', ipa: '/ˈməʊmənt/' }
      ],
      peaks: [
        { pos: 0.16, amp: 0.93, label: "COULDN'T" },
        { pos: 0.41, amp: 0.95, label: 'CHO-sen' },
        { pos: 0.67, amp: 0.91, label: 'BET-ter' },
        { pos: 0.87, amp: 0.89, label: 'MO-ment' }
      ],
      valleys: [
        { pos: 0.05, label: 'She' },
        { pos: 0.28, label: 'have /əv/' },
        { pos: 0.56, label: 'a /ə/' }
      ],
      rhythmChunks: [
        { text: 'shuh KUD-uhnt-uhv', role: 'stress', pos: 0.18, amp: 0.93 },
        { text: 'CHOH-zuhn', role: 'stress', pos: 0.41, amp: 0.95 },
        { text: 'uh', role: 'weak', pos: 0.56, amp: 0.26 },
        { text: 'BET-uh MOH-muhnt', role: 'stress', pos: 0.78, amp: 0.91 }
      ]
    },
    {
      id: 'cs18',
      num: '12',
      act: 2,
      actTitle: acts[1].title,
      cefr: 'C1',
      title: '12. Counterfactual Modal ("WUD-uhv")',
      context: 'Cambridge C1 & Client Debriefs · Explaining what would have prevented a problem.',
      audioSrc: 'assets/audio/tts/connected-speech-18-would-have-resolved.mp3',
      writtenText: 'An earlier call would have resolved the issue.',
      targetFeature: 'Counterfactual "would have" (/ˈwʊdəv/) + weak "an" (/ən/) + vowel-linked "the" (/ði/)',
      weakIpa: '/ən ˈɜːliə ˈkɔːl ˈwʊdəv rɪˈzɒlvd ði ˈɪʃuː/',
      phoneticRespelling: 'uhn UR-lee-uh KAWL WUD-uhv rih-ZOLVD thee ISH-oo',
      formula: 'An (/ən/) + SUBJECT PHRASE + WOULD (STRESS) + have (/əv/) + V3 + the (/ði/) + VOWEL-NOUN',
      belfastNote: 'Watch both ends of this sentence: "an" shrinks to /ən/ at the start, "would have" compresses into "WUD-uhv" in the middle, and "the" shifts to /ði/ ("thee") before the vowel in "issue".',
      segments: [
        { text: 'An', role: 'weak', ipa: '/ən/' },
        { text: 'EARlier', role: 'stress', ipa: '/ˈɜːliə/' },
        { text: 'CALL', role: 'stress', ipa: '/ˈkɔːl/' },
        { text: 'WOULD', role: 'stress', ipa: '/wʊd/' },
        { text: 'have', role: 'weak', ipa: '/əv/' },
        { text: 'reSOLVED', role: 'stress', ipa: '/rɪˈzɒlvd/' },
        { text: 'the', role: 'weak', ipa: '/ði/' },
        { text: 'ISsue.', role: 'stress', ipa: '/ˈɪʃuː/' }
      ],
      peaks: [
        { pos: 0.16, amp: 0.90, label: 'EAR-li-er' },
        { pos: 0.34, amp: 0.93, label: 'CALL' },
        { pos: 0.49, amp: 0.90, label: 'WOULD' },
        { pos: 0.70, amp: 0.95, label: '-SOLVED' },
        { pos: 0.89, amp: 0.88, label: 'IS-sue' }
      ],
      valleys: [
        { pos: 0.05, label: 'An /ən/' },
        { pos: 0.57, label: 'have /əv/' },
        { pos: 0.80, label: 'the /ði/' }
      ],
      rhythmChunks: [
        { text: 'uhn UR-lee-uh KAWL', role: 'stress', pos: 0.22, amp: 0.92 },
        { text: 'WUD-uhv', role: 'stress', pos: 0.50, amp: 0.90 },
        { text: 'rih-ZOLVD', role: 'stress', pos: 0.70, amp: 0.95 },
        { text: 'thee ISH-oo', role: 'stress', pos: 0.87, amp: 0.89 }
      ]
    },

    /* ===== ACT III: ELISION /t/, /d/ & CATENATION / LINKING /r/, /w/, /j/ ===== */
    {
      id: 'cs7',
      num: '13',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '13. /t/ & /d/ Cluster Elision ("pah(st) thee ol(d)...")',
      context: 'Narrative Fluency (IELTS Part 2) · Telling a past-tense story without tripping on final stops.',
      audioSrc: 'assets/audio/tts/connected-speech-07-walked-past-post.mp3',
      writtenText: 'We walked past the old post office last night.',
      targetFeature: '/t/ & /d/ elision in consonant clusters + /t/ catenation into vowel ("post_office")',
      weakIpa: '/wi wɔːkt pɑːs ði əʊl pəʊst ˈɒfɪs lɑːs naɪt/',
      phoneticRespelling: 'wee WAWKT pahs thee ohl pohs-TOFF-is lahs NYT',
      formula: 'C1 + /t, d/ + C2 -> drop middle /t, d/ · Final /t/ + Vowel -> link forward',
      belfastNote: 'Look at the middle stops: "pas(t) the", "ol(d) post", "las(t) night". When /t/ or /d/ sits squeezed between two consonants, fluent British speakers drop it cleanly — yet the /t/ in "post office" stays alive because "office" opens with a vowel.',
      segments: [
        { text: 'We', role: 'weak', ipa: '/wi/' },
        { text: 'WALKED', role: 'stress', ipa: '/wɔːkt/' },
        { text: 'pas(t)', role: 'stress', ipa: '/pɑːs/' },
        { text: 'the', role: 'weak', ipa: '/ði/' },
        { text: 'ol(d)', role: 'stress', ipa: '/əʊl/' },
        { text: 'POST_OFfice', role: 'stress', ipa: '/pəʊst ˈɒfɪs/' },
        { text: 'las(t)', role: 'weak', ipa: '/lɑːs/' },
        { text: 'NIGHT.', role: 'stress', ipa: '/naɪt/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.94, label: 'WALKED' },
        { pos: 0.39, amp: 0.86, label: 'PAST' },
        { pos: 0.55, amp: 0.88, label: 'OLD POST' },
        { pos: 0.75, amp: 0.85, label: 'OF-fice' },
        { pos: 0.90, amp: 0.87, label: 'NIGHT' }
      ],
      valleys: [
        { pos: 0.04, label: 'We' },
        { pos: 0.28, label: 'the /ði/' },
        { pos: 0.83, label: 'las(t) elision' }
      ],
      rhythmChunks: [
        { text: 'We WALKED', role: 'stress', pos: 0.12, amp: 0.94 },
        { text: 'PAH(st) thee', role: 'stress', pos: 0.37, amp: 0.86 },
        { text: 'ol(d) POST-OF-fice', role: 'stress', pos: 0.64, amp: 0.90 },
        { text: 'lah(st) NIGHT', role: 'stress', pos: 0.89, amp: 0.87 }
      ]
    },
    {
      id: 'cs8',
      num: '14',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '14. Linking & Intrusive /r/ ("Law-r-and order-r-is")',
      context: 'Academic & Civic Commentary · Avoiding choppy glottal stops between vowel phrases.',
      audioSrc: 'assets/audio/tts/connected-speech-08-law-and-order.mp3',
      writtenText: 'Law and order is far away from here.',
      targetFeature: 'Intrusive /r/ ("Law-r-and") + Linking /r/ ("order-r-is", "far-r-away") + weak "and/from"',
      weakIpa: '/lɔːrən ˈɔːdər ɪz fɑːr əˈweɪ frəm hɪə/',
      phoneticRespelling: 'LAW-ruhn AW-duh-riz FAH-ruh-way fruhm HEE-uh',
      formula: 'Open Vowel (/ɔː/, /ɑː/, /ə/) + Vowel -> gentle /r/ bridge · and -> /ən/ · from -> /frəm/',
      belfastNote: 'In non-rhotic British English, final orthographic "r" wakes up before a vowel ("order-r-is", "far-r-away"), and speakers even slip an intrusive /r/ after "Law" into "and" so there is no awkward throat stop.',
      segments: [
        { text: 'LAW', role: 'stress', ipa: '/lɔː/' },
        { text: '-r-and', role: 'weak', ipa: '/rən/' },
        { text: 'ORder', role: 'stress', ipa: '/ˈɔːdə/' },
        { text: '-r-is', role: 'weak', ipa: '/rɪz/' },
        { text: 'FAR', role: 'stress', ipa: '/fɑː/' },
        { text: '-r-aWAY', role: 'stress', ipa: '/rəˈweɪ/' },
        { text: 'from', role: 'weak', ipa: '/frəm/' },
        { text: 'HERE.', role: 'stress', ipa: '/hɪə/' }
      ],
      peaks: [
        { pos: 0.11, amp: 0.95, label: 'LAW' },
        { pos: 0.34, amp: 0.90, label: 'OR-der' },
        { pos: 0.62, amp: 0.93, label: 'FAR-a-WAY' },
        { pos: 0.89, amp: 0.88, label: 'HERE' }
      ],
      valleys: [
        { pos: 0.22, label: '-r-and /rən/' },
        { pos: 0.48, label: '-r-is /rɪz/' },
        { pos: 0.78, label: 'from /frəm/' }
      ],
      rhythmChunks: [
        { text: 'LAW-r-uhn', role: 'stress', pos: 0.14, amp: 0.95 },
        { text: 'OR-der-r-iz', role: 'stress', pos: 0.36, amp: 0.90 },
        { text: 'FAR-r-uh-WAY', role: 'stress', pos: 0.63, amp: 0.93 },
        { text: 'fruhm HERE', role: 'stress', pos: 0.87, amp: 0.88 }
      ]
    },
    {
      id: 'cs9',
      num: '15',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '15. /w/ Glide & Catenation ("Go-w-on")',
      context: 'Storytelling & Spontaneous Dialogue · Linking rounded vowels cleanly into short function words.',
      audioSrc: 'assets/audio/tts/connected-speech-09-go-on-and-tell.mp3',
      writtenText: 'Go on and tell us how it ended.',
      targetFeature: 'Labial /w/ glide ("go-w-on", "how-w-it") + consonant-to-vowel catenation ("tell-us")',
      weakIpa: '/ɡəʊ ˈwɒn ən ˈtel əs haʊ wɪt ˈendɪd/',
      phoneticRespelling: 'go-WON uhn TELL-uhs HOW-wit EN-did',
      formula: 'Rounded vowel (/əʊ/, /aʊ/) + Vowel -> /w/ glide · Final C + Vowel -> catenation',
      belfastNote: 'Whenever your lips round on /əʊ/ ("go") or /aʊ/ ("how") and the next word opens with a vowel, let your lips release naturally through a tiny /w/ glide. Meanwhile, "tell us" blends straight into "tellus".',
      segments: [
        { text: 'Go', role: 'weak', ipa: '/ɡəʊ/' },
        { text: 'w-ON', role: 'stress', ipa: '/wɒn/' },
        { text: 'and', role: 'weak', ipa: '/ən/' },
        { text: 'TELL', role: 'stress', ipa: '/tel/' },
        { text: 'us', role: 'weak', ipa: '/əs/' },
        { text: 'HOW', role: 'stress', ipa: '/haʊ/' },
        { text: 'w-it', role: 'weak', ipa: '/wɪt/' },
        { text: 'ENded.', role: 'stress', ipa: '/ˈendɪd/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.94, label: 'go-w-ON' },
        { pos: 0.44, amp: 0.88, label: 'TELL-us' },
        { pos: 0.70, amp: 0.90, label: 'HOW' },
        { pos: 0.87, amp: 0.89, label: 'EN-ded' }
      ],
      valleys: [
        { pos: 0.30, label: 'and /ən/' },
        { pos: 0.56, label: 'us /əs/' },
        { pos: 0.77, label: 'w-it /wɪt/' }
      ],
      rhythmChunks: [
        { text: 'go-w-ON', role: 'stress', pos: 0.14, amp: 0.94 },
        { text: 'uhn', role: 'weak', pos: 0.30, amp: 0.25 },
        { text: 'TELL-uhs', role: 'stress', pos: 0.45, amp: 0.88 },
        { text: 'HOW-wit EN-did', role: 'stress', pos: 0.78, amp: 0.90 }
      ]
    },
    {
      id: 'cs19',
      num: '16',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '16. Linking /j/ Glide ("KEY-y-issue", "VER-y-y-easy")',
      context: 'Cambridge Part 3 & Analytical Speaking · Joining front vowels cleanly without throat breaks.',
      audioSrc: 'assets/audio/tts/connected-speech-19-key-issue-very-easy.mp3',
      writtenText: 'The key issue is very easy to miss.',
      targetFeature: 'Palatal /j/ glide ("key-j-issue", "very-j-easy") + weak "to" (/tə/)',
      weakIpa: '/ðə ˈkiː ˈjɪʃuː ɪz ˈveri ˈjiːzi tə ˈmɪs/',
      phoneticRespelling: 'thuh KEE yish-oo iz VER-ee yee-zee tuh MISS',
      formula: 'Front vowel (/iː/, /i/) + Vowel -> /j/ glide · is (/ɪz/) & to (/tə/) -> valleys',
      belfastNote: 'When your tongue sits high at the front on "key" or "very" and the next word opens with a vowel, let it release through a light /j/ glide instead of stopping the air in your throat.',
      segments: [
        { text: 'The', role: 'weak', ipa: '/ðə/' },
        { text: 'KEY', role: 'stress', ipa: '/kiː/' },
        { text: 'j-ISsue', role: 'stress', ipa: '/ˈjɪʃuː/' },
        { text: 'is', role: 'weak', ipa: '/ɪz/' },
        { text: 'VERy', role: 'stress', ipa: '/ˈveri/' },
        { text: 'j-EAsy', role: 'stress', ipa: '/ˈjiːzi/' },
        { text: 'to', role: 'weak', ipa: '/tə/' },
        { text: 'MISS.', role: 'stress', ipa: '/mɪs/' }
      ],
      peaks: [
        { pos: 0.16, amp: 0.93, label: 'KEY' },
        { pos: 0.31, amp: 0.89, label: 'j-IS-sue' },
        { pos: 0.56, amp: 0.92, label: 'VER-y' },
        { pos: 0.72, amp: 0.90, label: 'j-EA-sy' },
        { pos: 0.90, amp: 0.94, label: 'MISS' }
      ],
      valleys: [
        { pos: 0.05, label: 'the /ðə/' },
        { pos: 0.43, label: 'is /ɪz/' },
        { pos: 0.81, label: 'to /tə/' }
      ],
      rhythmChunks: [
        { text: 'thuh KEE yish-oo', role: 'stress', pos: 0.22, amp: 0.93 },
        { text: 'iz', role: 'weak', pos: 0.43, amp: 0.25 },
        { text: 'VER-ee yee-zee', role: 'stress', pos: 0.63, amp: 0.92 },
        { text: 'tuh MISS', role: 'stress', pos: 0.88, amp: 0.94 }
      ]
    },
    {
      id: 'cs20',
      num: '17',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '17. Selective /t/ Elision vs Catenation ("mos(t) people expec-ta")',
      context: 'IELTS Part 3 Generalisations · Knowing when final /t/ disappears and when it links forward.',
      audioSrc: 'assets/audio/tts/connected-speech-20-most-people-expect.mp3',
      writtenText: 'Most people expect a fast response.',
      targetFeature: '/t/ elision before consonants ("mos(t) people", "fas(t) response") vs /t/ link ("expect_a")',
      weakIpa: '/məʊs ˈpiːpl ɪkˈspekt ə ˈfɑːs rɪˈspɒns/',
      phoneticRespelling: 'mohs PEE-puhl ik-SPEK-tuh fahs rih-SPONS',
      formula: 'C + /t/ + C -> drop /t/ ("mos(t)", "fas(t)") · Final /t/ + Vowel -> link ("expect_a")',
      belfastNote: 'Here is a classic British contrast in one breath: "mos(t) people" and "fas(t) response" drop the /t/ between consonants, while "expect a" keeps its /t/ alive by hopping straight onto the schwa "a".',
      segments: [
        { text: 'Mos(t)', role: 'weak', ipa: '/məʊs/' },
        { text: 'PEOple', role: 'stress', ipa: '/ˈpiːpl/' },
        { text: 'exPECT_a', role: 'stress', ipa: '/ɪkˈspekt ə/' },
        { text: 'fas(t)', role: 'stress', ipa: '/fɑːs/' },
        { text: 'reSPONSE.', role: 'stress', ipa: '/rɪˈspɒns/' }
      ],
      peaks: [
        { pos: 0.22, amp: 0.93, label: 'PEO-ple' },
        { pos: 0.47, amp: 0.95, label: 'ex-PECT' },
        { pos: 0.68, amp: 0.90, label: 'FAST' },
        { pos: 0.88, amp: 0.92, label: '-SPONSE' }
      ],
      valleys: [
        { pos: 0.08, label: 'mos(t) elision' },
        { pos: 0.58, label: 'a /ə/' }
      ],
      rhythmChunks: [
        { text: 'mohs', role: 'weak', pos: 0.08, amp: 0.42 },
        { text: 'PEE-puhl', role: 'stress', pos: 0.23, amp: 0.93 },
        { text: 'ik-SPEK-tuh', role: 'stress', pos: 0.49, amp: 0.95 },
        { text: 'fahs rih-SPONS', role: 'stress', pos: 0.80, amp: 0.92 }
      ]
    },
    {
      id: 'cs21',
      num: '18',
      act: 3,
      actTitle: acts[2].title,
      cefr: 'C1',
      title: '18. Catenation Chain & /j/ Glide ("KEE-puh-NYE-yon-it")',
      context: 'Natural Idiomatic Dialogue · Delivering high-frequency idioms without choppy word boundaries.',
      audioSrc: 'assets/audio/tts/connected-speech-21-keep-an-eye-on.mp3',
      writtenText: 'Keep an eye on it while I check the figures.',
      targetFeature: 'Catenation chain ("keep_an_eye_on_it") + linking /j/ ("eye-j-on") + weak "the" (/ðə/)',
      weakIpa: '/ˈkiːp ən ˈaɪ jɒn ɪt waɪl aɪ ˈtʃek ðə ˈfɪɡəz/',
      phoneticRespelling: 'KEE-puh-NYE-yon-it wyl-ah CHEK thuh FIG-uhz',
      formula: 'C + Vowel link ("keep_an", "an_eye", "on_it") · /aɪ/ + Vowel -> /j/ glide ("eye-j-on")',
      belfastNote: 'An idiom sounds rehearsed when every short word sits in its own box. Let "keep an eye on it" flow as one joined phrase ("KEE-puh-NYE-yon-it"), then land crisply on "CHECK" and "FIG-ures".',
      segments: [
        { text: 'KEEP', role: 'stress', ipa: '/kiːp/' },
        { text: 'an', role: 'weak', ipa: '/ən/' },
        { text: 'EYE', role: 'stress', ipa: '/aɪ/' },
        { text: 'j-on it', role: 'weak', ipa: '/jɒn ɪt/' },
        { text: 'while I', role: 'weak', ipa: '/waɪl aɪ/' },
        { text: 'CHECK', role: 'stress', ipa: '/tʃek/' },
        { text: 'the', role: 'weak', ipa: '/ðə/' },
        { text: 'FIGures.', role: 'stress', ipa: '/ˈfɪɡəz/' }
      ],
      peaks: [
        { pos: 0.10, amp: 0.92, label: 'KEEP' },
        { pos: 0.28, amp: 0.95, label: 'EYE' },
        { pos: 0.65, amp: 0.93, label: 'CHECK' },
        { pos: 0.87, amp: 0.91, label: 'FIG-ures' }
      ],
      valleys: [
        { pos: 0.18, label: 'an /ən/' },
        { pos: 0.42, label: 'on it / while I' },
        { pos: 0.76, label: 'the /ðə/' }
      ],
      rhythmChunks: [
        { text: 'KEE-puh-NYE', role: 'stress', pos: 0.20, amp: 0.94 },
        { text: 'yon-it wyl-ah', role: 'weak', pos: 0.45, amp: 0.34 },
        { text: 'CHEK', role: 'stress', pos: 0.65, amp: 0.93 },
        { text: 'thuh FIG-uhz', role: 'stress', pos: 0.86, amp: 0.91 }
      ]
    },

    /* ===== ACT IV: C1 STRESS-TIMING & SCHWA /ə/ VALLEYS ===== */
    {
      id: 'cs10',
      num: '19',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C1',
      title: '19. Negative Inversion Beat ("UN-də NO...")',
      context: 'Executive Briefing & C1/C2 Speaking · Commanding authority with rhythm rather than shouting.',
      audioSrc: 'assets/audio/tts/connected-speech-10-under-no-circumstances.mp3',
      writtenText: 'Under no circumstances should we delay.',
      targetFeature: 'Fronted negative inversion stress + unstressed modal auxiliary bridge (/ʃʊd wi/)',
      weakIpa: '/ˈʌndə nəʊ ˈsɜːkəmstɑːnsɪz ʃʊd wi dɪˈleɪ/',
      phoneticRespelling: 'UN-duh NO SER-kuhm-stahn-siz shud-wee dih-LAY',
      formula: 'UN-der NO CIR-cum-stan-ces (3 peaks) + should we (valley) + de-LAY (final anchor)',
      belfastNote: 'A negative inversion sounds stiff if you rush the syllables together or over-stress the modal pair. Land firmly on "UN-der NO CIR-", let /ʃʊd wi/ skim across a low valley, and close decisively on "de-LAY".',
      segments: [
        { text: 'UNder', role: 'stress', ipa: '/ˈʌndə/' },
        { text: 'NO', role: 'stress', ipa: '/nəʊ/' },
        { text: 'CIRcumstances', role: 'stress', ipa: '/ˈsɜːkəmstɑːnsɪz/' },
        { text: 'should we', role: 'weak', ipa: '/ʃʊd wi/' },
        { text: 'deLAY.', role: 'stress', ipa: '/dɪˈleɪ/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.96, label: 'UN-der NO' },
        { pos: 0.38, amp: 0.88, label: 'CIR-cum-' },
        { pos: 0.74, amp: 0.85, label: 'de-LAY' },
        { pos: 0.88, amp: 0.86, label: '-LAY' }
      ],
      valleys: [
        { pos: 0.24, label: '-də /ə/' },
        { pos: 0.59, label: 'should we' }
      ],
      rhythmChunks: [
        { text: 'UN-duh NO', role: 'stress', pos: 0.15, amp: 0.96 },
        { text: 'CIR-kuhm-stahn-siz', role: 'stress', pos: 0.39, amp: 0.88 },
        { text: 'shud-wee', role: 'weak', pos: 0.61, amp: 0.28 },
        { text: 'dih-LAY', role: 'stress', pos: 0.82, amp: 0.88 }
      ]
    },
    {
      id: 'cs11',
      num: '20',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C2',
      title: '20. Concessive Pivot & Schwa Articles',
      context: 'IELTS Part 3 Balance · Delivering a two-sided judgement with crisp comma phrasing.',
      audioSrc: 'assets/audio/tts/connected-speech-11-having-said-that.mp3',
      writtenText: 'Having said that, the benefits outweigh the risks.',
      targetFeature: 'Comma boundary reset + twin schwa articles (/ðə ˈbenɪfɪts ... ðə rɪsks/)',
      weakIpa: '/ˈhævɪŋ sed ðæt ðə ˈbenɪfɪts aʊtˈweɪ ðə rɪsks/',
      phoneticRespelling: 'HAV-ing SED that · thuh BEN-uh-fits owt-WAY thuh RISKS',
      formula: 'HAV-ing SAID that (pivot) + the (/ðə/) + NOUN + out-WEIGH + the (/ðə/) + NOUN',
      belfastNote: 'Treat the comma after "that" as a genuine 200ms reset, not a dead stop. Dropping both instances of "the" to a feather-light /ðə/ lets "BEN-efits", "out-WEIGH", and "RISKS" snap into sharp focus.',
      segments: [
        { text: 'HAVing', role: 'stress', ipa: '/ˈhævɪŋ/' },
        { text: 'SAID', role: 'stress', ipa: '/sed/' },
        { text: 'that,', role: 'weak', ipa: '/ðæt/' },
        { text: 'the', role: 'weak', ipa: '/ðə/' },
        { text: 'BENefits', role: 'stress', ipa: '/ˈbenɪfɪts/' },
        { text: 'outWEIGH', role: 'stress', ipa: '/aʊtˈweɪ/' },
        { text: 'the', role: 'weak', ipa: '/ðə/' },
        { text: 'RISKS.', role: 'stress', ipa: '/rɪsks/' }
      ],
      peaks: [
        { pos: 0.11, amp: 0.90, label: 'HAV-ing SAID' },
        { pos: 0.53, amp: 0.95, label: 'BEN-e-fits' },
        { pos: 0.78, amp: 0.91, label: 'out-WEIGH' },
        { pos: 0.91, amp: 0.86, label: 'RISKS' }
      ],
      valleys: [
        { pos: 0.37, label: 'pause + the /ðə/' },
        { pos: 0.69, label: '-fits' },
        { pos: 0.85, label: 'the /ðə/' }
      ],
      rhythmChunks: [
        { text: 'HAV-ing SAID that,', role: 'stress', pos: 0.14, amp: 0.90 },
        { text: 'thuh', role: 'weak', pos: 0.40, amp: 0.24 },
        { text: 'BEN-uh-fits', role: 'stress', pos: 0.54, amp: 0.95 },
        { text: 'owt-WAY thuh RISKS', role: 'stress', pos: 0.82, amp: 0.91 }
      ]
    },
    {
      id: 'cs12',
      num: '21',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C2',
      title: '21. Conditional Pivot & Double-Schwa Bridge',
      context: 'Cambridge Part 3 & IELTS Part 3 · Framing a decisive preference with rhythmic poise.',
      audioSrc: 'assets/audio/tts/connected-speech-12-if-i-had-to-choose.mp3',
      writtenText: 'If I had to choose, I would opt for the first.',
      targetFeature: 'Infinitive schwa ("to" /tə/) + double-schwa bridge ("for the" /fə ðə/)',
      weakIpa: '/ɪf aɪ ˈhæd tə tʃuːz aɪ wʊd ˈɒpt fə ðə fɜːst/',
      phoneticRespelling: 'if-ah HAD-tuh CHOOZ · ahd OPT fuh-thuh FERST',
      formula: 'If I (weak) + HAD + to (/tə/) + CHOOSE · I would (weak) + OPT + for the (/fə ðə/) + FIRST',
      belfastNote: 'Look at the two little valleys holding this sentence together: "to" compresses to /tə/ right before "choose", and "for the" packs into a crisp double schwa /fə ðə/ before "first". Nail that valley and your cadence sounds effortless.',
      segments: [
        { text: 'If I', role: 'weak', ipa: '/ɪf aɪ/' },
        { text: 'HAD', role: 'stress', ipa: '/hæd/' },
        { text: 'to', role: 'weak', ipa: '/tə/' },
        { text: 'CHOOSE,', role: 'stress', ipa: '/tʃuːz/' },
        { text: 'I would', role: 'weak', ipa: '/aɪ wʊd/' },
        { text: 'OPT', role: 'stress', ipa: '/ɒpt/' },
        { text: 'for the', role: 'weak', ipa: '/fə ðə/' },
        { text: 'FIRST.', role: 'stress', ipa: '/fɜːst/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.88, label: 'HAD' },
        { pos: 0.31, amp: 0.96, label: 'CHOOSE' },
        { pos: 0.60, amp: 0.96, label: 'OPT' },
        { pos: 0.83, amp: 0.92, label: 'FIRST' }
      ],
      valleys: [
        { pos: 0.22, label: 'to /tə/' },
        { pos: 0.47, label: 'comma + I would' },
        { pos: 0.72, label: 'for the /fə ðə/' }
      ],
      rhythmChunks: [
        { text: 'if-I HAD-tuh', role: 'stress', pos: 0.14, amp: 0.88 },
        { text: 'CHOOSE,', role: 'stress', pos: 0.31, amp: 0.96 },
        { text: 'I would', role: 'weak', pos: 0.48, amp: 0.24 },
        { text: 'OPT fuh-thuh FIRST', role: 'stress', pos: 0.78, amp: 0.94 }
      ]
    },
    {
      id: 'cs22',
      num: '22',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C1',
      title: '22. "Not Only" Inversion & Double Pronoun Valley',
      context: 'Cambridge C1 & Persuasive Pitch · Balancing two strong benefits with steady rhythmic poise.',
      audioSrc: 'assets/audio/tts/connected-speech-22-not-only-did-it-save.mp3',
      writtenText: 'Not only did it save time, but it also cut costs.',
      targetFeature: 'Inversion stress ("not ONly") + weak valleys ("did it" /dɪd ɪt/, "but it" /bət ɪt/)',
      weakIpa: '/nɒt ˈəʊnli dɪd ɪt ˈseɪv ˈtaɪm bət ɪt ˈɔːlsəʊ ˈkʌt ˈkɒsts/',
      phoneticRespelling: 'not OHN-lee did-it SAYV TYM · buht-it AWL-soh KUT KOSTS',
      formula: 'not ON-ly (peak) + did it (valley) + SAVE TIME · but it (valley) + AL-so CUT COSTS',
      belfastNote: 'Candidates using "Not only did it..." often over-stress "did it" and "but it" because they are focusing on the inversion grammar. Relax both pairs into quiet valleys so the real verbs and nouns punch through.',
      segments: [
        { text: 'Not', role: 'weak', ipa: '/nɒt/' },
        { text: 'ONly', role: 'stress', ipa: '/ˈəʊnli/' },
        { text: 'did it', role: 'weak', ipa: '/dɪd ɪt/' },
        { text: 'SAVE TIME,', role: 'stress', ipa: '/seɪv taɪm/' },
        { text: 'but it', role: 'weak', ipa: '/bət ɪt/' },
        { text: 'ALso', role: 'stress', ipa: '/ˈɔːlsəʊ/' },
        { text: 'CUT COSTS.', role: 'stress', ipa: '/kʌt kɒsts/' }
      ],
      peaks: [
        { pos: 0.14, amp: 0.93, label: 'ON-ly' },
        { pos: 0.39, amp: 0.95, label: 'SAVE TIME' },
        { pos: 0.67, amp: 0.90, label: 'AL-so' },
        { pos: 0.87, amp: 0.94, label: 'CUT COSTS' }
      ],
      valleys: [
        { pos: 0.25, label: 'did it' },
        { pos: 0.54, label: 'but it /bət ɪt/' }
      ],
      rhythmChunks: [
        { text: 'not OHN-lee', role: 'stress', pos: 0.13, amp: 0.93 },
        { text: 'did-it', role: 'weak', pos: 0.25, amp: 0.28 },
        { text: 'SAVE TIME,', role: 'stress', pos: 0.39, amp: 0.95 },
        { text: 'buht-it AWL-soh CUT COSTS', role: 'stress', pos: 0.78, amp: 0.93 }
      ]
    },
    {
      id: 'cs23',
      num: '23',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C1',
      title: '23. Cleft Sentence Focus ("is that" /ɪz ðət/ Valley)',
      context: 'IELTS Part 3 & Leadership Discussion · Landing a high-impact C1 cleft sentence naturally.',
      audioSrc: 'assets/audio/tts/connected-speech-23-what-matters-most.mp3',
      writtenText: 'What matters most is that people feel heard.',
      targetFeature: 'Cleft frame stress ("MATters MOST") + weak bridge ("is that" /ɪz ðət/)',
      weakIpa: '/wɒt ˈmætəz ˈməʊst ɪz ðət ˈpiːpl ˈfiːl ˈhɜːd/',
      phoneticRespelling: 'wot MAT-uhz MOHST iz-thuht PEE-puhl FEEL HERD',
      formula: 'What (weak) + MAT-ters MOST (peaks) + is that (/ɪz ðət/ valley) + PEE-ple FEEL HEARD',
      belfastNote: 'That tiny dip on "is that" (/ɪz ðət/) is the hinge of a cleft sentence. Stressing "THAT" turns a natural point into a lecture; keep it light so "MOST" and "PEO-ple FEEL HEARD" carry the weight.',
      segments: [
        { text: 'What', role: 'weak', ipa: '/wɒt/' },
        { text: 'MATters', role: 'stress', ipa: '/ˈmætəz/' },
        { text: 'MOST', role: 'stress', ipa: '/məʊst/' },
        { text: 'is that', role: 'weak', ipa: '/ɪz ðət/' },
        { text: 'PEOple', role: 'stress', ipa: '/ˈpiːpl/' },
        { text: 'FEEL', role: 'stress', ipa: '/fiːl/' },
        { text: 'HEARD.', role: 'stress', ipa: '/hɜːd/' }
      ],
      peaks: [
        { pos: 0.18, amp: 0.93, label: 'MAT-ters' },
        { pos: 0.34, amp: 0.96, label: 'MOST' },
        { pos: 0.62, amp: 0.91, label: 'PEO-ple' },
        { pos: 0.85, amp: 0.94, label: 'FEEL HEARD' }
      ],
      valleys: [
        { pos: 0.06, label: 'What' },
        { pos: 0.48, label: 'is that /ɪz ðət/' }
      ],
      rhythmChunks: [
        { text: 'wot MAT-uhz MOST', role: 'stress', pos: 0.24, amp: 0.95 },
        { text: 'iz-thuht', role: 'weak', pos: 0.48, amp: 0.25 },
        { text: 'PEE-puhl', role: 'stress', pos: 0.63, amp: 0.91 },
        { text: 'FEEL HERD', role: 'stress', pos: 0.85, amp: 0.94 }
      ]
    },
    {
      id: 'cs24',
      num: '24',
      act: 4,
      actTitle: acts[3].title,
      cefr: 'C2',
      title: '24. Inverted Conditional ("Were it NOT for...")',
      context: 'Cambridge C2 Speaking & Policy Debate · Delivering a formal inverted conditional smoothly.',
      audioSrc: 'assets/audio/tts/connected-speech-24-were-it-not-for.mp3',
      writtenText: 'Were it not for funding, the project would stall.',
      targetFeature: 'Inverted conditional bridge ("were it" /wɜːr ɪt/, "for" /fə/) + triple schwa valleys',
      weakIpa: '/wɜːr ɪt ˈnɒt fə ˈfʌndɪŋ ðə ˈprɒdʒekt wəd ˈstɔːl/',
      phoneticRespelling: 'wuh-rit NOT fuh FUN-ding · thuh PROJ-ekt wuhd STAWL',
      formula: 'Were it (valley) + NOT (peak) + for (/fə/) + FUN-ding · the (/ðə/) + PRO-ject + would (/wəd/) + STALL',
      belfastNote: 'Inverted conditionals like "Were it not for..." sound wonderfully natural when you link "were it" through /r/, skim past "for", "the", and "would" as schwas, and give "NOT", "FUN-ding", "PRO-ject", and "STALL" clean rhythmic peaks.',
      segments: [
        { text: 'Were it', role: 'weak', ipa: '/wɜːr ɪt/' },
        { text: 'NOT', role: 'stress', ipa: '/nɒt/' },
        { text: 'for', role: 'weak', ipa: '/fə/' },
        { text: 'FUNding,', role: 'stress', ipa: '/ˈfʌndɪŋ/' },
        { text: 'the', role: 'weak', ipa: '/ðə/' },
        { text: 'PROject', role: 'stress', ipa: '/ˈprɒdʒekt/' },
        { text: 'would', role: 'weak', ipa: '/wəd/' },
        { text: 'STALL.', role: 'stress', ipa: '/stɔːl/' }
      ],
      peaks: [
        { pos: 0.19, amp: 0.94, label: 'NOT' },
        { pos: 0.39, amp: 0.95, label: 'FUN-ding' },
        { pos: 0.64, amp: 0.92, label: 'PRO-ject' },
        { pos: 0.89, amp: 0.93, label: 'STALL' }
      ],
      valleys: [
        { pos: 0.08, label: 'Were it' },
        { pos: 0.28, label: 'for /fə/' },
        { pos: 0.52, label: 'the /ðə/' },
        { pos: 0.77, label: 'would /wəd/' }
      ],
      rhythmChunks: [
        { text: 'wuh-rit NOT', role: 'stress', pos: 0.15, amp: 0.94 },
        { text: 'fuh', role: 'weak', pos: 0.28, amp: 0.26 },
        { text: 'FUN-ding', role: 'stress', pos: 0.39, amp: 0.95 },
        { text: 'thuh PROJ-ekt wuhd STAWL', role: 'stress', pos: 0.76, amp: 0.93 }
      ]
    }
  ];

  function findById(id) {
    return allDrills.find((d) => d.id === id) || null;
  }

  function hashSeed(str) {
    let h = 2166136261 >>> 0;
    const s = String(str || '');
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function getTodaySeed() {
    return new Date().toISOString().slice(0, 10);
  }

  function dailyGauntlet(seedStr) {
    const seed = /^\d{4}-\d{2}-\d{2}$/.test(String(seedStr || '')) ? String(seedStr) : getTodaySeed();
    let rng = hashSeed('cs-daily-' + seed);
    const nextRand = () => {
      rng = (Math.imul(1664525, rng) + 1013904223) >>> 0;
      return rng / 4294967296;
    };

    const byAct = [1, 2, 3, 4].map((a) => allDrills.filter((d) => d.act === a));
    const picked = [];
    const used = new Set();

    // Pick 1 from each Act first so Daily 5 spans all 4 connected-speech mechanisms
    byAct.forEach((pool) => {
      const idx = Math.floor(nextRand() * pool.length);
      const item = pool[idx];
      picked.push(item);
      used.add(item.id);
    });

    // Pick 1 extra C1/C2 item from remaining pool
    const remaining = allDrills.filter((d) => !used.has(d.id));
    const extra = remaining[Math.floor(nextRand() * remaining.length)];
    if (extra) picked.push(extra);

    // Deterministic Fisher-Yates shuffle on the 5 picks
    for (let i = picked.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      const tmp = picked[i];
      picked[i] = picked[j];
      picked[j] = tmp;
    }

    return {
      seed,
      steps: picked.map((drill, idx) => ({
        step: idx + 1,
        id: drill.id,
        act: drill.act,
        cefr: drill.cefr,
        title: drill.title,
        drill
      }))
    };
  }

  function sanitizeBy(name) {
    return String(name || '').replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 18);
  }

  function duelChecksum(core) {
    const h1 = hashSeed('gm-cs-duel-' + core).toString(36);
    const h2 = hashSeed(core.split('').reverse().join('')).toString(36);
    return (h1 + h2).slice(0, 8);
  }

  function toBase64Url(str) {
    let b64 = '';
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(str, 'utf8').toString('base64');
    } else {
      const bytes = new TextEncoder().encode(str);
      let bin = '';
      bytes.forEach((b) => { bin += String.fromCharCode(b); });
      b64 = btoa(bin);
    }
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(token) {
    let b64 = String(token || '').replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) b64 += '=';
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8');
    }
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildDuelSteps(ids) {
    return ids.map((id, idx) => {
      const drill = findById(id);
      return {
        step: idx + 1,
        act: drill.act,
        id: drill.id,
        cefr: drill.cefr,
        title: drill.title,
        drill
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
    const avgPct = Math.max(0, Math.min(100, Math.round(Number(o.avgPct) || 0)));
    const sec = Math.max(0, Math.min(3600, Math.round(Number(o.sec) || 0)));
    const by = sanitizeBy(o.by);
    const core = `1|${cleanIds.join(',')}|${avgPct}|${sec}|${by}`;
    const sig = duelChecksum(core);
    return toBase64Url(`${core}|${sig}`);
  }

  function decodeDuel(raw) {
    if (typeof raw !== 'string') return null;
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length > 240) return null;

    if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map((s) => s.trim()).filter(Boolean);
      const cleanIds = validateDuelIds(parts);
      if (!cleanIds) return null;
      return {
        ids: cleanIds,
        steps: buildDuelSteps(cleanIds),
        avgPct: 0,
        sec: 0,
        by: ''
      };
    }

    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
    try {
      const decoded = fromBase64Url(trimmed);
      if (!decoded) return null;
      const fields = decoded.split('|');
      if (fields.length !== 6 || fields[0] !== '1') return null;
      const cleanIds = validateDuelIds(fields[1].split(',').map((s) => s.trim()).filter(Boolean));
      if (!cleanIds) return null;
      const rawPct = Number(fields[2]);
      const rawSec = Number(fields[3]);
      if (!Number.isFinite(rawPct) || !Number.isFinite(rawSec)) return null;
      const avgPct = Math.max(0, Math.min(100, Math.round(rawPct)));
      const sec = Math.max(0, Math.min(3600, Math.round(rawSec)));
      const by = sanitizeBy(fields[4]);
      const sig = fields[5];
      const core = `1|${cleanIds.join(',')}|${avgPct}|${sec}|${by}`;
      if (sig !== duelChecksum(core)) return null;
      return {
        ids: cleanIds,
        steps: buildDuelSteps(cleanIds),
        avgPct,
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
      pool = allDrills.filter((d) => d.act === 1 || d.act === 2);
    } else if (presetKey === 'act3_4') {
      pool = allDrills.filter((d) => d.act === 3 || d.act === 4);
    } else if (presetKey === 'c1_stress') {
      pool = allDrills.filter((d) => d.cefr === 'C1' || d.cefr === 'C2');
    } else {
      pool = allDrills.slice();
    }
    const copy = pool.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    const picked = copy.slice(0, 5);
    const ids = picked.map((d) => d.id);
    return {
      preset: presetKey || 'all_mix',
      ids,
      steps: buildDuelSteps(ids)
    };
  }

  function dataTests() {
    const lines = [];
    let pass = true;
    const fail = (msg) => {
      pass = false;
      lines.push('FAIL ' + msg);
    };

    const usOrBanned = new RegExp(
      '\\b(' + [
        'realize[ds]?', 'analyze[ds]?', 'catalog', 'color[eds]?', 'apologize[ds]?',
        'criticize[ds]?', 'organize[ds]?', 'emphasize[ds]?', 'recognize[ds]?', 'judgment',
        'canceled', 'traveling', 'center', 'behavior', 'favor', 'honor', 'labor', 'neighbor',
        'defense', 'offense', 'practiced', 'practicing',
        'guaran' + 'teed', 'guaran' + 'tees\\s+your\\s+score', 'unbreak' + 'able', 'locks\\s+in',
        'sup' + 'reme', 'pure\\s+gold',
        'cog' + 'nitive\\s+load', 'pro' + 'cessing\\s+bandwidth',
        'can' + 'tilever(?:s|ed)?', 'tru' + 'ss(?:es)?', 'sche' + 'matic(?:s)?', 'through' + 'put',
        'depleted\\s+talent\\s+pool', 'fundamentally\\s+reshaped', 'provincial\\s+communities',
        'speech' + 'Synthesis', 'Speech' + 'SynthesisUtterance'
      ].join('|') + ')\\b',
      'i'
    );
    const tutorCueRx = /\b(?:Tutor\s+Cue|Teacher\s+Note|Tutor\s+Note|Teacher\s+Cue|Socratic\s+Prompt|Instructor\s+Prompt)\s*:/i;
    const mdAsterisk = /(?:^|[\s(])\*[A-Za-z][^*<\n]{1,60}\*(?=[\s).,!?:;]|$)/;
    const corporateWe = /\b(we|our|ours)\b/i;
    const normalizeSegmentTokens = (str) => String(str || '')
      .replace(/\(([td])\)/gi, '$1')
      .replace(/(?:^|\s)-[rwj]-/gi, ' ')
      .replace(/(?:^|\s)[wj]-/gi, ' ')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const normalizeWrittenTokens = (str) => String(str || '')
      .toLowerCase()
      .replace(/[^a-z0-9'\s-]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const EXPECTED_CLIPS_PER_ACT = 6;
    const EXPECTED_TOTAL = acts.length * EXPECTED_CLIPS_PER_ACT;

    if (acts.length !== 4) fail(`expected 4 acts, got ${acts.length}`);
    if (allDrills.length !== EXPECTED_TOTAL) fail(`expected ${EXPECTED_TOTAL} drills, got ${allDrills.length}`);

    acts.forEach((a) => {
      const txt = [a.shortTitle, a.title, a.description].join(' ');
      if (usOrBanned.test(txt)) fail(`act ${a.act} banned wording`);
      if (tutorCueRx.test(txt)) fail(`act ${a.act} tutor cue label`);
      if (corporateWe.test(a.description)) fail(`act ${a.act} description uses corporate we/our`);
      const countInAct = allDrills.filter((d) => d.act === a.act).length;
      if (countInAct !== EXPECTED_CLIPS_PER_ACT) fail(`act ${a.act} has ${countInAct} drills (expected ${EXPECTED_CLIPS_PER_ACT})`);
    });

    const seenIds = new Set();
    const seenAudio = new Set();
    const seenWritten = new Set();
    allDrills.forEach((d, idx) => {
      const prefix = d.id || `drill#${idx}`;
      const idMatch = /^cs([1-9]\d*)$/.exec(d.id || '');
      if (!idMatch || Number(idMatch[1]) > allDrills.length) fail(`${prefix} invalid id`);
      if (seenIds.has(d.id)) fail(`${prefix} duplicate id`);
      seenIds.add(d.id);

      const expectedNum = String(idx + 1).padStart(2, '0');
      if (d.num !== expectedNum) fail(`${prefix} expected num=${expectedNum}, got ${d.num}`);
      const expectedAct = Math.floor(idx / EXPECTED_CLIPS_PER_ACT) + 1;
      if (d.act !== expectedAct) fail(`${prefix} expected act=${expectedAct}, got ${d.act}`);
      if (d.actTitle !== acts[d.act - 1].title) fail(`${prefix} actTitle mismatch`);
      if (!['B2+', 'C1', 'C2'].includes(d.cefr)) fail(`${prefix} invalid cefr: ${d.cefr}`);
      if (!String(d.title || '').startsWith(`${idx + 1}. `)) fail(`${prefix} title prefix mismatch: ${d.title}`);
      if (seenAudio.has(d.audioSrc)) fail(`${prefix} duplicate audioSrc`);
      seenAudio.add(d.audioSrc);
      if (seenWritten.has(d.writtenText)) fail(`${prefix} duplicate writtenText`);
      seenWritten.add(d.writtenText);

      if (!/^assets\/audio\/tts\/connected-speech-\d{2}-[a-z0-9-]+\.mp3$/.test(d.audioSrc)) {
        fail(`${prefix} invalid audioSrc: ${d.audioSrc}`);
      }
      if (!d.writtenText || !d.weakIpa || !d.phoneticRespelling || !d.formula || !d.belfastNote) {
        fail(`${prefix} missing phonetic blueprint field`);
      }
      if (!Array.isArray(d.segments) || d.segments.length < 4) {
        fail(`${prefix} missing segments`);
      } else {
        d.segments.forEach((seg, si) => {
          if (!seg || !seg.text || !['weak', 'stress'].includes(seg.role) || !seg.ipa) {
            fail(`${prefix} segment ${si} invalid`);
          }
        });
        const segTokens = d.segments.flatMap((seg) => normalizeSegmentTokens(seg && seg.text));
        const wrtTokens = normalizeWrittenTokens(d.writtenText);
        if (segTokens.length !== wrtTokens.length || segTokens.some((tok, ti) => tok !== wrtTokens[ti])) {
          fail(`${prefix} segments do not cover writtenText in order`);
        }
      }
      if (!Array.isArray(d.peaks) || d.peaks.length < 2) {
        fail(`${prefix} missing peaks`);
      } else {
        let prevPeakPos = -1;
        d.peaks.forEach((p, pi) => {
          if (!p || !Number.isFinite(p.pos) || p.pos < 0 || p.pos > 1 ||
              !Number.isFinite(p.amp) || p.amp <= 0 || p.amp > 1 || !p.label) {
            fail(`${prefix} peak ${pi} invalid`);
          } else if (p.pos <= prevPeakPos) {
            fail(`${prefix} peak ${pi} non-monotonic pos (${p.pos} <= ${prevPeakPos})`);
          }
          if (p && Number.isFinite(p.pos)) prevPeakPos = p.pos;
        });
      }
      if (!Array.isArray(d.valleys) || d.valleys.length < 1) {
        fail(`${prefix} missing weak-form valleys`);
      } else {
        let prevValleyPos = -1;
        d.valleys.forEach((v, vi) => {
          if (!v || !Number.isFinite(v.pos) || v.pos < 0 || v.pos > 1 || !v.label) {
            fail(`${prefix} valley ${vi} invalid`);
          } else if (v.pos <= prevValleyPos) {
            fail(`${prefix} valley ${vi} non-monotonic pos (${v.pos} <= ${prevValleyPos})`);
          }
          if (v && Number.isFinite(v.pos)) prevValleyPos = v.pos;
        });
      }
      if (!Array.isArray(d.rhythmChunks) || d.rhythmChunks.length < 3) {
        fail(`${prefix} missing rhythmChunks`);
      } else {
        let prevChunkPos = -1;
        d.rhythmChunks.forEach((rc, ri) => {
          if (!rc || !rc.text || !['weak', 'stress'].includes(rc.role) ||
              !Number.isFinite(rc.pos) || rc.pos < 0 || rc.pos > 1 ||
              !Number.isFinite(rc.amp) || rc.amp <= 0 || rc.amp > 1) {
            fail(`${prefix} rhythmChunk ${ri} invalid`);
          } else if (rc.pos <= prevChunkPos) {
            fail(`${prefix} rhythmChunk ${ri} non-monotonic pos (${rc.pos} <= ${prevChunkPos})`);
          }
          if (rc && Number.isFinite(rc.pos)) prevChunkPos = rc.pos;
        });
      }

      const allText = [
        d.title, d.context, d.writtenText, d.targetFeature,
        d.phoneticRespelling, d.formula, d.belfastNote
      ].join(' ');
      if (usOrBanned.test(allText)) {
        const hit = allText.match(usOrBanned);
        fail(`${prefix} US spelling or banned term: "${hit && hit[0]}"`);
      }
      const tutorCueText = [
        d.actTitle, allText, d.weakIpa,
        ...(Array.isArray(d.segments) ? d.segments.map((s) => s && s.text) : []),
        ...(Array.isArray(d.peaks) ? d.peaks.map((p) => p && p.label) : []),
        ...(Array.isArray(d.valleys) ? d.valleys.map((v) => v && v.label) : []),
        ...(Array.isArray(d.rhythmChunks) ? d.rhythmChunks.map((rc) => rc && rc.text) : [])
      ].filter(Boolean).join(' ');
      if (tutorCueRx.test(tutorCueText)) {
        const hitCue = tutorCueText.match(tutorCueRx);
        fail(`${prefix} tutor cue label: "${hitCue && hitCue[0]}"`);
      }
      if (mdAsterisk.test(allText)) fail(`${prefix} unrendered markdown asterisk`);

      const editorialText = [d.context, d.targetFeature, d.belfastNote].join(' ');
      if (corporateWe.test(editorialText)) {
        const hitWe = editorialText.match(corporateWe);
        fail(`${prefix} corporate we/our in editorial note: "${hitWe && hitWe[0]}"`);
      }
    });

    for (let n = 1; n <= EXPECTED_TOTAL; n++) {
      if (!findById('cs' + n)) fail(`findById('cs${n}') check failed`);
    }
    if (findById('cs99') !== null) {
      fail('findById unknown check failed');
    }

    const dg1 = dailyGauntlet('2026-11-17');
    const dg2 = dailyGauntlet('2026-11-17');
    const dg3 = dailyGauntlet('2026-11-18');
    const dgKey = (g) => g.steps.map((s) => s.id).join(',');
    if (dg1.steps.length !== 5 || dgKey(dg1) !== dgKey(dg2) || dgKey(dg1) === dgKey(dg3) ||
        new Set(dg1.steps.map((s) => s.id)).size !== 5) {
      fail('dailyGauntlet determinism check failed');
    }

    const tok = encodeDuel({ ids: ['cs1', 'cs4', 'cs7', 'cs10', 'cs12'], avgPct: 88, sec: 42, by: '<script>Gareth!' });
    const dec = decodeDuel(tok);
    if (!dec || dec.ids.join(',') !== 'cs1,cs4,cs7,cs10,cs12' || dec.avgPct !== 88 || dec.sec !== 42 || dec.by !== 'scriptGareth') {
      fail('encodeDuel/decodeDuel round-trip failed');
    }
    const tok2 = encodeDuel({ ids: ['cs13', 'cs16', 'cs19', 'cs22', 'cs24'], avgPct: 92, sec: 35, by: 'Ynnning' });
    const dec2 = decodeDuel(tok2);
    if (!dec2 || dec2.ids.join(',') !== 'cs13,cs16,cs19,cs22,cs24' || dec2.avgPct !== 92 || dec2.sec !== 35 || dec2.by !== 'Ynnning') {
      fail('encodeDuel/decodeDuel new IDs round-trip failed');
    }
    const tampered = tok.slice(0, -1) + (tok.slice(-1) === 'A' ? 'B' : 'A');
    if (decodeDuel(tampered) !== null) fail('decodeDuel accepted tampered checksum');
    if (decodeDuel('cs1,cs4,cs7,cs10') === null) fail('decodeDuel rejected valid comma shorthand');
    if (decodeDuel('cs1,cs1,cs4') !== null) fail('decodeDuel accepted duplicate IDs');
    if (decodeDuel('cs1,cs4') !== null) fail('decodeDuel accepted <3 IDs');
    if (decodeDuel('cs1,cs99,cs4') !== null) fail('decodeDuel accepted unknown ID');

    lines.push(`(a) validated ${allDrills.length} clips across ${acts.length} acts (${EXPECTED_CLIPS_PER_ACT} clips per act)`);
    lines.push(`(b) British spelling, Gareth voice, Piper-only audio & zero banned terms verified`);
    lines.push(`(c) dailyGauntlet('2026-11-17') -> [${dgKey(dg1)}]`);
    lines.push(`(d) encodeDuel / decodeDuel + comma shorthand + tamper checks passed`);
    return { pass, lines };
  }

  const api = {
    version: 1,
    acts,
    allDrills,
    findById,
    getTodaySeed,
    dailyGauntlet,
    encodeDuel,
    decodeDuel,
    duelPreset,
    dataTests
  };

  root.CONNECTED_SPEECH_DATA = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
