/* ==========================================================================
   Jet Set Willy (1984) · 8-Room ZX Spectrum C1 Mansion & Part 4 Riddle Vault
   Shared Data, 256-Byte Room Definitions, Cambridge Word Counter, #room= Codec
   Exposes window.JSW_MANSION_RIDDLES (and CommonJS module.exports)
   ========================================================================== */
(function (root) {
  'use strict';

  const NON_POSSESSIVE_S_BASES = new Set([
    'it', 'that', 'there', 'what', 'who', 'where', 'how',
    'he', 'she', 'let', 'here', 'this', 'when', 'why'
  ]);

  function normaliseAnswer(str) {
    return String(str || '')
      .replace(/[\u2018\u2019\u02BC]/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Cambridge C1 Part 4 word count:
   * Contractions ending in n't, 've, 'd, 'll, 're, 'm and non-possessive 's
   * on pronouns/demonstratives (it's, there's, let's, etc.) count as 2 words.
   */
  function countCambridgeWords(text) {
    const tokens = normaliseAnswer(text)
      .split(' ')
      .map((t) => t.replace(/^[^A-Za-z0-9']+|[^A-Za-z0-9']+$/g, ''))
      .filter(Boolean);
    let n = 0;
    for (const tok of tokens) {
      const w = tok.toLowerCase();
      if (/[a-z]n't$/.test(w) || /[a-z]'(ve|d|ll|re|m)$/.test(w)) {
        n += 2;
      } else if (/'s$/.test(w) && NON_POSSESSIVE_S_BASES.has(w.slice(0, -2))) {
        n += 2;
      } else {
        n += 1;
      }
    }
    return n;
  }

  function answerTokens(text) {
    return normaliseAnswer(text)
      .toLowerCase()
      .split(' ')
      .map((t) => t.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''))
      .filter(Boolean);
  }

  function keywordMutationIn(tokens, key) {
    const k = String(key || '').toLowerCase();
    if (!k) return null;
    const stem = k.replace(/e$/, '');
    return (
      tokens.find(
        (t) =>
          t !== k &&
          (t === k + 's' ||
            t === k + 'es' ||
            t === k + 'ed' ||
            t === k + 'd' ||
            t === stem + 'ing' ||
            t === k + 'ing' ||
            t === k + "'s")
      ) || null
    );
  }

  function validatePart4Answer(answer, keyword) {
    const cleanKey = String(keyword || '').trim().toUpperCase();
    const cleanAns = normaliseAnswer(answer);
    if (!cleanKey) {
      return { valid: false, wordCount: 0, keywordOk: false, reason: 'Enter a single uppercase keyword.' };
    }
    if (/\s/.test(cleanKey) || !/^[A-Z]+$/.test(cleanKey)) {
      return {
        valid: false,
        wordCount: countCambridgeWords(cleanAns),
        keywordOk: false,
        reason: 'Keyword must be a single uppercase word with no spaces or punctuation.'
      };
    }
    if (!cleanAns) {
      return { valid: false, wordCount: 0, keywordOk: false, reason: 'Type or assemble 3 to 6 words first.' };
    }
    const tokens = answerTokens(cleanAns);
    const wordCount = countCambridgeWords(cleanAns);
    const mutated = keywordMutationIn(tokens, cleanKey);
    const keywordOk = tokens.includes(cleanKey.toLowerCase()) && !mutated;

    if (!keywordOk) {
      return {
        valid: false,
        wordCount,
        keywordOk: false,
        reason: mutated
          ? `Do not alter the keyword ${cleanKey} ("${mutated}" scores zero marks).`
          : `Include the exact unchanged keyword ${cleanKey}.`
      };
    }
    if (wordCount < 3 || wordCount > 6) {
      return {
        valid: false,
        wordCount,
        keywordOk: true,
        reason: `Your answer has ${wordCount} Cambridge word${wordCount === 1 ? '' : 's'} (must be 3 to 6 words).`
      };
    }
    return { valid: true, wordCount, keywordOk: true, reason: 'Valid 3–6 word Cambridge Part 4 frame.' };
  }

  function evaluateRiddleAnswer(riddle, userAnswer) {
    if (!riddle) return { pass: false, reason: 'Missing riddle data.' };
    const cleanUser = normaliseAnswer(userAnswer);
    const check = validatePart4Answer(cleanUser, riddle.keyword);
    if (!check.valid) {
      return {
        pass: false,
        wordCount: check.wordCount,
        keywordOk: check.keywordOk,
        reason: check.reason
      };
    }
    const acceptedList = (riddle.acceptedAnswers && riddle.acceptedAnswers.length
      ? riddle.acceptedAnswers
      : [riddle.targetAnswer]
    ).map((a) => normaliseAnswer(a).toLowerCase());

    const normUserLower = cleanUser.toLowerCase();
    if (acceptedList.includes(normUserLower)) {
      return {
        pass: true,
        wordCount: check.wordCount,
        keywordOk: true,
        reason: `Spot on (${check.wordCount} Cambridge words, keyword ${riddle.keyword} unchanged).`
      };
    }
    return {
      pass: false,
      wordCount: check.wordCount,
      keywordOk: true,
      reason: `Word count (${check.wordCount}) and keyword ${riddle.keyword} are intact, yet the clause pattern does not match the Cambridge key.`
    };
  }

  // =========================================================================
  // 8 BRITISH PIPER AUDIO CLUES (one per room)
  // =========================================================================
  const audioClues = [
    {
      id: 'clue-33',
      roomId: 33,
      title: 'Room 33 Clue · The Bathroom',
      file: 'assets/audio/tts/jsw-clue-01-bathroom.mp3',
      transcript:
        'Welcome to the Bathroom. Listen for what happened first, and remember that after No sooner or would rather, English flips its word order and shifts one step further back in time.'
    },
    {
      id: 'clue-35',
      roomId: 35,
      title: 'Room 35 Clue · Master Bedroom',
      file: 'assets/audio/tts/jsw-clue-02-bedroom.mp3',
      transcript:
        'In the Master Bedroom, drop the word if and step straight into an inverted conditional. When reporting old rumours, reach for a passive infinitive that points back to the past.'
    },
    {
      id: 'clue-42',
      roomId: 42,
      title: 'Room 42 Clue · The Attic',
      file: 'assets/audio/tts/jsw-clue-03-attic.mp3',
      transcript:
        'Up here in the Attic, watch that stray arrow byte at hex ninety-one B six. Front a limiting adverb to invert the verb, or replace a long if-clause with a three-word prepositional opener.'
    },
    {
      id: 'clue-27',
      roomId: 27,
      title: 'Room 27 Clue · The Chapel',
      file: 'assets/audio/tts/jsw-clue-04-chapel.mp3',
      transcript:
        'Step lightly through the Chapel. Under no circumstances belongs at the very front of the clause before your modal verb, and an adjective can open a sentence cleanly before the word though.'
    },
    {
      id: 'clue-28',
      roomId: 28,
      title: 'Room 28 Clue · First Landing',
      file: 'assets/audio/tts/jsw-clue-05-landing.mp3',
      transcript:
        'On the First Landing, balance what troubled Willy with a crisp cleft structure, and let a comma plus a participle clause carry the consequence smoothly forward without another conjunction.'
    },
    {
      id: 'clue-32',
      roomId: 32,
      title: 'Room 32 Clue · The Banyan Tree',
      file: 'assets/audio/tts/jsw-clue-06-banyan.mp3',
      transcript:
        'High in the Banyan Tree, check which preposition locks onto prevented before a gerund, and keep the auxiliary verb straight after Not only before the main clause moves on.'
    },
    {
      id: 'clue-18',
      roomId: 18,
      title: 'Room 18 Clue · The Wine Cellar',
      file: 'assets/audio/tts/jsw-clue-07-cellar.mp3',
      transcript:
        'Down in the Wine Cellar, pair no intention with the preposition of and a gerund, and swap a full although-clause for a compact prepositional phrase beginning with In spite.'
    },
    {
      id: 'clue-34',
      roomId: 34,
      title: 'Room 34 Clue · The Belfast Study',
      file: 'assets/audio/tts/jsw-clue-08-study.mp3',
      transcript:
        'You have reached my Belfast Study. Use introductory It with a widely agreed passive frame, and lock At no time onto the front of the clause before inverting the past auxiliary.'
    }
  ];

  // =========================================================================
  // 8 INTERCONNECTED MANSION ROOMS (Valid 256-Byte Z80 Pages at 0xC000+)
  // =========================================================================
  const TILE_AIR_BLACK = { attr: 0x07, bitmap: [0, 0, 0, 0, 0, 0, 0, 0] };

  const rooms = [
    {
      id: 33,
      shortName: 'Bathroom',
      name: '       The Bathroom             ',
      border: 1, // Blue
      mapPos: { row: 1, col: 3 },
      audioClueId: 'clue-33',
      spawn: { x: 24, y: 104, dir: 0x80 },
      exits: [35, 34, 42, 33], // L:35 Bedroom, R:34 Belfast Study, U:42 Attic
      gridStrings: [
        '................................', // 0 (open top for Attic jump)
        '..............................##', // 1
        '..............................##', // 2
        '..............=======.........##', // 3 (top jump shelf -> Attic)
        '..............................##', // 4
        '....=======..........======...##', // 5 (both shelves reachable in 2 rows)
        '..............................##', // 6
        '............========..........##', // 7 (reachable from ramp top at row 8)
        '..........................*###..', // 8
        '..........................####..', // 9
        '....======................####..', // 10
        '................................', // 11
        '.......*........................', // 12 (Tap nasty on bath edge)
        '...====.........................', // 13 (Open L doorway cols 0..2; Bathtub conveyor cols 7..14)
        '................................', // 14 (Both L & R doorways open!)
        '################################'  // 15 Solid floor
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x05, bitmap: [0xff, 0xaa, 0x55, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x16, bitmap: [0xff, 0x80, 0x80, 0xff, 0x08, 0x08, 0x08, 0xff] },
      nastyTile: { attr: 0x46, bitmap: [0x18, 0x3c, 0x7e, 0x18, 0x18, 0x3c, 0x7e, 0xff] },
      rampTile: { attr: 0x45, bitmap: [0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0, 0x80] },
      convTile: { attr: 0x47, bitmap: [0xcc, 0x33, 0xff, 0x7e, 0x7e, 0x3c, 0x00, 0x00] },
      convDir: 1,
      convRow: 13,
      convCol: 7,
      convLen: 8,
      rampDir: 0,
      rampRow: 14,
      rampCol: 23,
      rampLen: 7,
      items: [
        { id: 'item-33-1', label: 'Porcelain Sponge', col: 6, row: 4, attr: 0x46, riddleId: 'jsw-33-1' },
        { id: 'item-33-2', label: 'Brass Tap Key', col: 23, row: 4, attr: 0x43, riddleId: 'jsw-33-2' }
      ],
      guardians: [
        {
          name: 'Razor Blade',
          kind: 'horizontal',
          col: 13,
          minCol: 12,
          maxCol: 18,
          y: 40, // Row 5 above middle platform
          frame: 0,
          dir: 1,
          attr: 0x43,
          typeByte: 0x01,
          startByte: 0x2d
        }
      ]
    },
    {
      id: 35,
      shortName: 'Bedroom',
      name: '      Master Bedroom            ',
      border: 3, // Magenta
      mapPos: { row: 1, col: 2 },
      audioClueId: 'clue-35',
      spawn: { x: 27, y: 104, dir: 0x80 },
      exits: [27, 33, 42, 35], // L:27 Chapel, R:33 Bathroom, U:42 Attic
      gridStrings: [
        '##..............................', // 0 (ceiling open on right for Attic)
        '##..............................', // 1
        '##..............................', // 2
        '##...................========...', // 3 (top right shelf -> Attic)
        '##..............................', // 4
        '##..........=======.............', // 5
        '##..............................', // 6
        '##..................========....', // 7
        '##..#........*........#.........', // 8 Bedposts
        '##..#.................#.........', // 9
        '##..#.................#.........', // 10
        '##..###################.........', // 11 Canopy
        '##..............................', // 12
        '................................', // 13 Open L & R doorways
        '................................', // 14
        '################################'  // 15
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x06, bitmap: [0xff, 0x55, 0xaa, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x27, bitmap: [0xff, 0x81, 0xbd, 0xa5, 0xa5, 0xbd, 0x81, 0xff] },
      nastyTile: { attr: 0x43, bitmap: [0x18, 0x3c, 0x7e, 0x5a, 0x3c, 0x18, 0x3c, 0xff] },
      rampTile: { attr: 0x45, bitmap: [0xc0, 0x60, 0x30, 0x18, 0x0c, 0x06, 0x03, 0x01] },
      convTile: { attr: 0x46, bitmap: [0x99, 0x66, 0xff, 0x3c, 0x3c, 0x7e, 0x00, 0x00] },
      convDir: 2,
      convRow: 10,
      convCol: 5,
      convLen: 13,
      rampDir: 1,
      rampRow: 14,
      rampCol: 18,
      rampLen: 6,
      items: [
        { id: 'item-35-1', label: 'Velvet Pillow', col: 14, row: 4, attr: 0x45, riddleId: 'jsw-35-1' },
        { id: 'item-35-2', label: 'Bedpost Compass', col: 25, row: 2, attr: 0x44, riddleId: 'jsw-35-2' }
      ],
      guardians: [
        {
          name: 'Housekeeper',
          kind: 'horizontal',
          col: 10,
          minCol: 6,
          maxCol: 20,
          y: 104,
          frame: 0,
          dir: 0,
          attr: 0x44,
          typeByte: 0x02,
          startByte: 0x6a
        }
      ]
    },
    {
      id: 42,
      shortName: 'Attic',
      name: '         The Attic              ',
      border: 2, // Red
      mapPos: { row: 0, col: 2 },
      audioClueId: 'clue-42',
      spawn: { x: 4, y: 104, dir: 0 },
      exits: [32, 34, 42, 33], // L:32 Banyan, R:34 Belfast Study, D:33 Bathroom
      gridStrings: [
        '##############....##############', // 0 Sloped roof
        '############........############', // 1
        '##########............##########', // 2
        '########................########', // 3
        '######.....==========.....######', // 4
        '####........................####', // 5
        '##.*.....======..======.....*.##', // 6 (2 rows from row 4 & row 8)
        '##............................##', // 7
        '##...======..........======...##', // 8 (2 rows from ramp top row 10)
        '##............................##', // 9
        '##...................======...##', // 10
        '##.............*..............##', // 11
        '##............................##', // 12
        '................................', // 13 Open L & R doorways
        '................................', // 14
        '=============......============='  // 15 Drop gap to Bathroom
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x05, bitmap: [0xff, 0xe7, 0xdb, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x16, bitmap: [0xff, 0x88, 0x88, 0xff, 0x22, 0x22, 0x22, 0xff] },
      nastyTile: { attr: 0x42, bitmap: [0x24, 0x7e, 0xff, 0x5a, 0x3c, 0x66, 0xc3, 0xff] },
      rampTile: { attr: 0x46, bitmap: [0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0, 0x80] },
      convTile: { attr: 0x47, bitmap: [0xcc, 0x33, 0xff, 0x7e, 0x7e, 0x3c, 0x00, 0x00] },
      convDir: 2,
      convRow: 6,
      convCol: 9,
      convLen: 6,
      rampDir: 0,
      rampRow: 14,
      rampCol: 22,
      rampLen: 5,
      items: [
        { id: 'item-42-1', label: 'Memory Register', col: 15, row: 3, attr: 0x46, riddleId: 'jsw-42-1' },
        { id: 'item-42-2', label: 'Unpatched Scroll', col: 24, row: 7, attr: 0x45, riddleId: 'jsw-42-2' }
      ],
      guardians: [
        {
          name: 'Attic Arrow (Valid)',
          kind: 'arrow',
          col: 30,
          xPx: 240,
          y: 72,
          dir: -1,
          attr: 0x47,
          typeByte: 0x04,
          startByte: 0x48
        },
        {
          name: 'Bugged Arrow (Y=0xB8 / 184px Overflow)',
          kind: 'arrow_bugged',
          col: 28,
          xPx: 224,
          y: 184,
          dir: -1,
          attr: 0x42,
          typeByte: 0x04,
          startByte: 0xb8
        }
      ]
    },
    {
      id: 27,
      shortName: 'Chapel',
      name: '         The Chapel             ',
      border: 5, // Cyan
      mapPos: { row: 1, col: 1 },
      audioClueId: 'clue-27',
      spawn: { x: 4, y: 104, dir: 0 },
      exits: [32, 35, 42, 28], // L:32 Banyan, R:35 Bedroom, U:42 Attic, D:28 Landing
      gridStrings: [
        '##............................##', // 0 Open skylight -> Attic
        '##.....*................*.....##', // 1
        '##............................##', // 2
        '##.........==========.........##', // 3 (2 rows from row 5)
        '##............................##', // 4
        '##........======..............##', // 5 (2 rows from row 7)
        '##............................##', // 6
        '##..=======..........======...##', // 7 (2 rows from row 9)
        '##.............##.............##', // 8 Altar cross
        '##........=====##.....======..##', // 9 (2 rows from row 11)
        '##.............##.............##', // 10
        '##..=======....##....=======..##', // 11 (reachable from ramp)
        '##............................##', // 12
        '................................', // 13 Open L & R doorways
        '................................', // 14
        '####################....########'  // 15 Gap cols 20..23 drops to Landing
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x07, bitmap: [0xff, 0xc3, 0x99, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x09, bitmap: [0xfe, 0x82, 0xba, 0xaa, 0xba, 0x82, 0xfe, 0x00] },
      nastyTile: { attr: 0x46, bitmap: [0x18, 0x3c, 0x7e, 0xff, 0x3c, 0x18, 0x3c, 0x7e] },
      rampTile: { attr: 0x45, bitmap: [0xc0, 0x60, 0x30, 0x18, 0x0c, 0x06, 0x03, 0x01] },
      convTile: { attr: 0x47, bitmap: [0xcc, 0x33, 0xff, 0x7e, 0x7e, 0x3c, 0x00, 0x00] },
      convDir: 0,
      convRow: 0,
      convCol: 0,
      convLen: 0,
      rampDir: 1,
      rampRow: 14,
      rampCol: 5,
      rampLen: 4,
      items: [
        { id: 'item-27-1', label: 'Choir Folio', col: 15, row: 2, attr: 0x46, riddleId: 'jsw-27-1' },
        { id: 'item-27-2', label: 'Brass Candlestick', col: 5, row: 6, attr: 0x45, riddleId: 'jsw-27-2' }
      ],
      guardians: [
        {
          name: 'Flying Monk',
          kind: 'horizontal',
          col: 12,
          minCol: 9,
          maxCol: 21,
          y: 40,
          frame: 0,
          dir: 0,
          attr: 0x45,
          typeByte: 0x01,
          startByte: 0x28
        }
      ]
    },
    {
      id: 28,
      shortName: 'Landing',
      name: '       First Landing            ',
      border: 4, // Green
      mapPos: { row: 2, col: 1 },
      audioClueId: 'clue-28',
      spawn: { x: 2, y: 104, dir: 0 },
      exits: [18, 34, 33, 28], // L:18 Wine Cellar, R:34 Belfast Study, U:33 Bathroom
      gridStrings: [
        '##............................##', // 0 Open ceiling for Bathroom
        '##............................##', // 1
        '##............................##', // 2
        '##............=====...=======.##', // 3 (2 rows from row 5)
        '##............................##', // 4
        '##................========....##', // 5 (2 rows from row 7)
        '##............................##', // 6
        '##..........=========.........##', // 7 Balcony conveyor (2 rows from row 9)
        '##............................##', // 8
        '##......======................##', // 9 (reachable from ramp)
        '##............................##', // 10
        '##.......................*....##', // 11
        '##....................=======.##', // 12
        '................................', // 13 Open L & R doorways
        '................................', // 14
        '################################'  // 15 Solid gallery floor
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x04, bitmap: [0xff, 0xdb, 0x24, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x17, bitmap: [0xff, 0x99, 0x99, 0xff, 0x66, 0x66, 0x66, 0xff] },
      nastyTile: { attr: 0x42, bitmap: [0x3c, 0x7e, 0xdb, 0xff, 0x7e, 0x3c, 0x66, 0xc3] },
      rampTile: { attr: 0x46, bitmap: [0xc0, 0x60, 0x30, 0x18, 0x0c, 0x06, 0x03, 0x01] },
      convTile: { attr: 0x44, bitmap: [0xaa, 0x55, 0xff, 0x3c, 0x7e, 0x18, 0x00, 0x00] },
      convDir: 2,
      convRow: 7,
      convCol: 12,
      convLen: 9,
      rampDir: 1,
      rampRow: 14,
      rampCol: 4,
      rampLen: 6,
      items: [
        { id: 'item-28-1', label: 'Staircase Lantern', col: 15, row: 6, attr: 0x46, riddleId: 'jsw-28-1' },
        { id: 'item-28-2', label: 'Gallery Frame', col: 26, row: 2, attr: 0x45, riddleId: 'jsw-28-2' }
      ],
      guardians: [
        {
          name: 'Landing Butler',
          kind: 'horizontal',
          col: 15,
          minCol: 10,
          maxCol: 22,
          y: 104,
          frame: 0,
          dir: 0,
          attr: 0x46,
          typeByte: 0x01,
          startByte: 0x6f
        }
      ]
    },
    {
      id: 32,
      shortName: 'Banyan',
      name: '      The Banyan Tree           ',
      border: 4, // Green
      mapPos: { row: 1, col: 0 },
      audioClueId: 'clue-32',
      spawn: { x: 4, y: 104, dir: 0 },
      exits: [32, 27, 42, 18], // R:27 Chapel, U:42 Attic, D:18 Wine Cellar
      gridStrings: [
        '##............................##', // 0
        '##............................##', // 1
        '##............................##', // 2
        '##....========................##', // 3 Canopy top branch (2 rows from row 5)
        '##............................##', // 4
        '##........=======.............##', // 5 (2 rows from row 7)
        '##............................##', // 6
        '##..............========......##', // 7 (2 rows from row 9)
        '##............................##', // 8
        '##.........========..=======..##', // 9 East bough (reachable from ramp)
        '##...............*............##', // 10 Thorn branch
        '##............................##', // 11
        '##............................##', // 12
        '##....======....................', // 13 Solid left edge, open right exit
        '##..............................', // 14
        '############....################'  // 15 Root hollow cols 12..15 -> Wine Cellar
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x44, bitmap: [0x7e, 0xff, 0xdb, 0x7e, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x16, bitmap: [0xbd, 0xdb, 0xe7, 0xbd, 0xdb, 0xe7, 0xbd, 0x7e] },
      nastyTile: { attr: 0x43, bitmap: [0x18, 0x5a, 0x3c, 0xff, 0x3c, 0x5a, 0x18, 0x00] },
      rampTile: { attr: 0x46, bitmap: [0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0, 0x80] },
      convTile: { attr: 0x44, bitmap: [0x33, 0xcc, 0xff, 0x66, 0x66, 0x3c, 0x00, 0x00] },
      convDir: 0,
      convRow: 0,
      convCol: 0,
      convLen: 0,
      rampDir: 0,
      rampRow: 14,
      rampCol: 25,
      rampLen: 5,
      items: [
        { id: 'item-32-1', label: 'Canopy Acorn', col: 8, row: 2, attr: 0x46, riddleId: 'jsw-32-1' },
        { id: 'item-32-2', label: 'Root Key', col: 24, row: 8, attr: 0x45, riddleId: 'jsw-32-2' }
      ],
      guardians: [
        {
          name: 'Canopy Beetle',
          kind: 'horizontal',
          col: 20,
          minCol: 17,
          maxCol: 26,
          y: 104,
          frame: 0,
          dir: 1,
          attr: 0x43,
          typeByte: 0x02,
          startByte: 0x6c
        }
      ]
    },
    {
      id: 18,
      shortName: 'Cellar',
      name: '      The Wine Cellar           ',
      border: 0, // Black
      mapPos: { row: 2, col: 0 },
      audioClueId: 'clue-18',
      spawn: { x: 3, y: 104, dir: 0 },
      exits: [18, 28, 32, 18], // R:28 First Landing, U:32 Banyan Tree
      gridStrings: [
        '##............................##', // 0
        '##............................##', // 1
        '##..........=======...........##', // 2 (2 rows from row 4)
        '##............................##', // 3
        '##.........========...........##', // 4 (2 rows from row 6)
        '##............................##', // 5
        '##.....=========..............##', // 6 (2 rows from row 8)
        '##............................##', // 7
        '##...........========.........##', // 8 (2 rows from row 10)
        '##....................*.......##', // 9
        '##.................==========.##', // 10 Cellar conveyor
        '##............................##', // 11
        '##....=======.................##', // 12 (Clear of Cellar Spider on floor)
        '##..............................', // 13 Open right doorway -> Landing
        '##..............................', // 14
        '################################'  // 15 Solid cellar stone
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x03, bitmap: [0xff, 0xc3, 0xbd, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x0e, bitmap: [0xff, 0x81, 0x81, 0xff, 0x99, 0x99, 0x81, 0xff] },
      nastyTile: { attr: 0x45, bitmap: [0x18, 0x18, 0x3c, 0x7e, 0x7e, 0x3c, 0x18, 0x00] },
      rampTile: { attr: 0x43, bitmap: [0xc0, 0x60, 0x30, 0x18, 0x0c, 0x06, 0x03, 0x01] },
      convTile: { attr: 0x47, bitmap: [0xcc, 0x33, 0xff, 0x3c, 0x7e, 0x3c, 0x00, 0x00] },
      convDir: 1,
      convRow: 10,
      convCol: 20,
      convLen: 7,
      rampDir: 1,
      rampRow: 14,
      rampCol: 14,
      rampLen: 4,
      items: [
        { id: 'item-18-1', label: 'Vintage Cork', col: 10, row: 5, attr: 0x46, riddleId: 'jsw-18-1' },
        { id: 'item-18-2', label: 'Cellar Ledger', col: 26, row: 9, attr: 0x44, riddleId: 'jsw-18-2' }
      ],
      guardians: [
        {
          name: 'Cellar Spider',
          kind: 'horizontal',
          col: 9,
          minCol: 6,
          maxCol: 13,
          y: 104,
          frame: 0,
          dir: 0,
          attr: 0x42,
          typeByte: 0x01,
          startByte: 0x69
        }
      ]
    },
    {
      id: 34,
      shortName: 'Belfast Study',
      name: '     The Belfast Study          ',
      border: 6, // Yellow
      mapPos: { row: 1, col: 4 },
      audioClueId: 'clue-34',
      spawn: { x: 27, y: 104, dir: 0x80 },
      exits: [33, 28, 42, 18], // L:33 Bathroom, R:28 Landing, U:42 Attic, D:18 Cellar
      gridStrings: [
        '..............................##', // 0
        '..............................##', // 1
        '..............................##', // 2
        '.............=======..........##', // 3 (2 rows from row 4/5 -> Attic)
        '....========..................##', // 4 Bookshelf (2 rows from row 6)
        '..............................##', // 5
        '.........========.............##', // 6 (2 rows from row 8)
        '..............................##', // 7
        '............========.=======..##', // 8 (2 rows from row 10)
        '..............................##', // 9
        '..................=========...##', // 10 Desk conveyor
        '..............................##', // 11
        '....======......*.............##', // 12 Step shelf & Red-pen inkwell nasty
        '................................', // 13 Open L & R doorways
        '................................', // 14
        '##############....##############'  // 15 Hatch gap cols 14..17 -> Wine Cellar
      ],
      bgTile: TILE_AIR_BLACK,
      floorTile: { attr: 0x06, bitmap: [0xff, 0xf0, 0x0f, 0xff, 0x00, 0x00, 0x00, 0x00] },
      wallTile: { attr: 0x16, bitmap: [0xff, 0xa5, 0xa5, 0xff, 0xbd, 0xbd, 0x81, 0xff] },
      nastyTile: { attr: 0x42, bitmap: [0x18, 0x3c, 0x3c, 0x7e, 0xff, 0xff, 0x7e, 0x3c] },
      rampTile: { attr: 0x45, bitmap: [0x03, 0x06, 0x0c, 0x18, 0x30, 0x60, 0xc0, 0x80] },
      convTile: { attr: 0x47, bitmap: [0x99, 0x66, 0xff, 0x7e, 0x3c, 0x18, 0x00, 0x00] },
      convDir: 1,
      convRow: 10,
      convCol: 20,
      convLen: 6,
      rampDir: 0,
      rampRow: 14,
      rampCol: 27,
      rampLen: 5,
      items: [
        { id: 'item-34-1', label: 'Mahogany Nib', col: 8, row: 3, attr: 0x46, riddleId: 'jsw-34-1' },
        { id: 'item-34-2', label: 'Red-Pen Folio', col: 24, row: 7, attr: 0x45, riddleId: 'jsw-34-2' }
      ],
      guardians: [
        {
          name: 'Pocket Watch',
          kind: 'horizontal',
          col: 9,
          minCol: 5,
          maxCol: 12,
          y: 104,
          frame: 0,
          dir: 0,
          attr: 0x46,
          typeByte: 0x02,
          startByte: 0x69
        }
      ]
    }
  ];

  // =========================================================================
  // 16 CAMBRIDGE C1 PART 4 RIDDLES (2 per Room)
  // =========================================================================
  const riddles = [
    // Rm 33: The Bathroom
    {
      id: 'jsw-33-1',
      roomId: 33,
      itemId: 'item-33-1',
      itemName: 'Porcelain Sponge',
      cefr: 'C1',
      category: 'Negative Inversion',
      dossierCategory: 'inversion',
      audioClueId: 'clue-33',
      s1Tokens: [
        { text: 'Willy', echo: false },
        { text: 'had', echo: false },
        { text: 'barely', echo: false },
        { text: 'stepped', echo: false },
        { text: 'into', echo: true },
        { text: 'the', echo: true },
        { text: 'bathroom', echo: true },
        { text: 'when', echo: false },
        { text: 'the', echo: true },
        { text: 'cold', echo: true },
        { text: 'tap', echo: true },
        { text: 'snapped.', echo: true }
      ],
      deficit: 'had barely stepped (→ sooner had Willy stepped)',
      tenseHarmony: 'Past perfect ("had stepped") stays past perfect in the inverted clause.',
      voiceShift: 'Barely ... when → Negative inversion No sooner ... than.',
      s2Before: 'No',
      s2After: 'into the bathroom than the cold tap snapped.',
      keyword: 'SOONER',
      targetAnswer: 'sooner had Willy stepped',
      acceptedAnswers: ['sooner had Willy stepped', 'sooner had he stepped'],
      wordChips: ['sooner', 'had', 'Willy', 'stepped', 'did', 'step', 'was', 'has'],
      formula: 'No sooner + Auxiliary (had) + Subject + Past Participle ... than',
      modelNote:
        'After "No sooner", you invert the auxiliary "had" before the subject "Willy" and pair it with "than", never "when".'
    },
    {
      id: 'jsw-33-2',
      roomId: 33,
      itemId: 'item-33-2',
      itemName: 'Brass Tap Key',
      cefr: 'C1',
      category: 'Unreal Past & Regret',
      dossierCategory: 'inversion',
      audioClueId: 'clue-33',
      s1Tokens: [
        { text: 'Willy', echo: true },
        { text: 'wishes', echo: false },
        { text: 'he', echo: false },
        { text: 'had', echo: false },
        { text: 'not', echo: false },
        { text: 'left', echo: false },
        { text: 'the', echo: true },
        { text: 'sponge', echo: true },
        { text: 'on', echo: true },
        { text: 'the', echo: true },
        { text: 'upper', echo: true },
        { text: 'shelf.', echo: true }
      ],
      deficit: 'wishes he had not left',
      tenseHarmony: 'Past regret ("wishes he had not left") → Perfect infinitive ("would rather not have left").',
      voiceShift: 'Wish + past perfect → Modal preference with would rather.',
      s2Before: 'Willy',
      s2After: 'the sponge on the upper shelf.',
      keyword: 'RATHER',
      targetAnswer: 'would rather not have left',
      acceptedAnswers: [
        'would rather not have left',
        'would rather he had not left',
        "would rather he hadn't left"
      ],
      wordChips: ['would', 'rather', 'not', 'have', 'left', 'had', 'leave', 'to'],
      formula: 'Subject + would rather + (not) + have + Past Participle',
      modelNote:
        'When the subject is the same person who acted earlier, "would rather not have + past participle" expresses regret cleanly in five words.'
    },

    // Rm 35: Master Bedroom
    {
      id: 'jsw-35-1',
      roomId: 35,
      itemId: 'item-35-1',
      itemName: 'Velvet Pillow',
      cefr: 'C1',
      category: 'Inverted Conditional',
      dossierCategory: 'inversion',
      audioClueId: 'clue-35',
      s1Tokens: [
        { text: 'If', echo: false },
        { text: 'Willy', echo: false },
        { text: 'jumped', echo: false },
        { text: 'from', echo: true },
        { text: 'the', echo: true },
        { text: 'top', echo: true },
        { text: 'canopy,', echo: true },
        { text: 'he', echo: true },
        { text: 'would', echo: true },
        { text: 'land', echo: true },
        { text: 'beside', echo: true },
        { text: 'the', echo: true },
        { text: 'housekeeper.', echo: true }
      ],
      deficit: 'If Willy jumped',
      tenseHarmony: 'Hypothetical second conditional ("If ... jumped") → Inverted "Were + Subject + to + infinitive".',
      voiceShift: 'Drop "If" and front "Were" ahead of the subject.',
      s2Before: '',
      s2After: 'from the top canopy, he would land beside the housekeeper.',
      keyword: 'WERE',
      targetAnswer: 'Were Willy to jump',
      acceptedAnswers: ['Were Willy to jump', 'Were he to jump'],
      wordChips: ['Were', 'Willy', 'to', 'jump', 'If', 'jumped', 'was', 'jumping'],
      formula: 'Were + Subject + to + Bare Infinitive, Subject + would + Verb',
      modelNote:
        'Dropping "if" and inverting with "Were ... to jump" is one of the cleanest ways to lift a hypothetical sentence to C1 standard.'
    },
    {
      id: 'jsw-35-2',
      roomId: 35,
      itemId: 'item-35-2',
      itemName: 'Bedpost Compass',
      cefr: 'C1',
      category: 'Passive Reporting',
      dossierCategory: 'register_shift',
      audioClueId: 'clue-35',
      s1Tokens: [
        { text: 'People', echo: false },
        { text: 'think', echo: false },
        { text: 'that', echo: false },
        { text: 'Maria', echo: true },
        { text: 'hid', echo: false },
        { text: 'the', echo: true },
        { text: 'brass', echo: true },
        { text: 'compass', echo: true },
        { text: 'behind', echo: true },
        { text: 'the', echo: true },
        { text: 'bedpost', echo: true },
        { text: 'years', echo: true },
        { text: 'ago.', echo: true }
      ],
      deficit: 'People think that ... hid (past event)',
      tenseHarmony: 'Present belief ("think") + past action ("hid") → "is believed to have hidden".',
      voiceShift: 'Active reporting ("People think") → Personal passive with perfect infinitive.',
      s2Before: 'Maria is',
      s2After: 'the brass compass behind the bedpost years ago.',
      keyword: 'BELIEVED',
      targetAnswer: 'believed to have hidden',
      acceptedAnswers: ['believed to have hidden'],
      wordChips: ['believed', 'to', 'have', 'hidden', 'having', 'hid', 'that', 'hide'],
      formula: 'Subject + BE + believed + to have + Past Participle',
      modelNote:
        'Because the hiding happened years ago while the belief is in the present, I pair passive "is believed" with the perfect infinitive "to have hidden".'
    },

    // Rm 42: The Attic
    {
      id: 'jsw-42-1',
      roomId: 42,
      itemId: 'item-42-1',
      itemName: 'Memory Register',
      cefr: 'C1',
      category: 'Negative Inversion',
      dossierCategory: 'inversion',
      audioClueId: 'clue-42',
      s1Tokens: [
        { text: 'Matthew', echo: false },
        { text: 'Smith', echo: false },
        { text: 'did', echo: false },
        { text: 'not', echo: false },
        { text: 'realise', echo: false },
        { text: 'at', echo: true },
        { text: 'the', echo: true },
        { text: 'time', echo: true },
        { text: 'that', echo: true },
        { text: 'a', echo: true },
        { text: 'stray', echo: true },
        { text: 'arrow', echo: true },
        { text: 'byte', echo: true },
        { text: 'would', echo: true },
        { text: 'corrupt', echo: true },
        { text: 'the', echo: true },
        { text: 'Chapel.', echo: true }
      ],
      deficit: 'Matthew Smith did not realise',
      tenseHarmony: 'Past simple negative ("did not realise") → Inverted past simple ("Little did ... realise").',
      voiceShift: 'Front limiting adverb "Little" and invert auxiliary "did" before the subject.',
      s2Before: '',
      s2After: 'at the time that a stray arrow byte would corrupt the Chapel.',
      keyword: 'LITTLE',
      targetAnswer: 'Little did Matthew Smith realise',
      acceptedAnswers: [
        'Little did Matthew Smith realise',
        'Little did Matthew Smith realize',
        'Little did he realise',
        'Little did he realize'
      ],
      wordChips: ['Little', 'did', 'Matthew', 'Smith', 'realise', 'realised', 'had', 'not'],
      formula: 'Little + did + Subject + Bare Infinitive',
      modelNote:
        'Fronting "Little" gives dramatic emphasis without exclamation marks; remember to keep "realise" in its bare infinitive after "did".'
    },
    {
      id: 'jsw-42-2',
      roomId: 42,
      itemId: 'item-42-2',
      itemName: 'Unpatched Scroll',
      cefr: 'C1',
      category: 'Counterfactual Conditional',
      dossierCategory: 'inversion',
      audioClueId: 'clue-42',
      s1Tokens: [
        { text: 'If', echo: false },
        { text: 'it', echo: false },
        { text: 'had', echo: false },
        { text: 'not', echo: false },
        { text: 'been', echo: false },
        { text: 'for', echo: false },
        { text: 'that', echo: false },
        { text: 'timely', echo: true },
        { text: 'patch,', echo: true },
        { text: 'the', echo: true },
        { text: 'stray', echo: true },
        { text: 'arrow', echo: true },
        { text: 'would', echo: true },
        { text: 'have', echo: true },
        { text: 'wrecked', echo: true },
        { text: 'the', echo: true },
        { text: 'room', echo: true },
        { text: 'data.', echo: true }
      ],
      deficit: 'If it had not been for that',
      tenseHarmony: 'Past counterfactual ("If it had not been for...") → "But for + noun phrase".',
      voiceShift: 'Full third-conditional clause compressed into a three-word prepositional phrase.',
      s2Before: '',
      s2After: 'timely patch, the stray arrow would have wrecked the room data.',
      keyword: 'FOR',
      targetAnswer: 'But for that',
      acceptedAnswers: ['But for that', 'Had it not been for that'],
      wordChips: ['But', 'for', 'that', 'had', 'not', 'without', 'if'],
      formula: 'But for + Determiner + Noun Phrase, Subject + would have + V3',
      modelNote:
        '"But for" replaces the whole six-word string "If it had not been for", and keeps "FOR" intact inside three clean words.'
    },

    // Rm 27: The Chapel
    {
      id: 'jsw-27-1',
      roomId: 27,
      itemId: 'item-27-1',
      itemName: 'Choir Folio',
      cefr: 'C1',
      category: 'Negative Inversion',
      dossierCategory: 'inversion',
      audioClueId: 'clue-27',
      s1Tokens: [
        { text: 'Willy', echo: false },
        { text: 'must', echo: false },
        { text: 'never', echo: false },
        { text: 'step', echo: true },
        { text: 'off', echo: true },
        { text: 'the', echo: true },
        { text: 'chancel', echo: true },
        { text: 'rail', echo: true },
        { text: 'while', echo: true },
        { text: 'the', echo: true },
        { text: 'flying', echo: true },
        { text: 'monk', echo: true },
        { text: 'is', echo: true },
        { text: 'passing.', echo: true }
      ],
      deficit: 'Willy must never',
      tenseHarmony: 'Prohibitive modal ("must never") → Inverted negative prohibition ("Under no circumstances must Willy").',
      voiceShift: 'Negative prepositional phrase fronted; modal auxiliary "must" comes before "Willy".',
      s2Before: 'Under',
      s2After: 'step off the chancel rail while the flying monk is passing.',
      keyword: 'CIRCUMSTANCES',
      targetAnswer: 'no circumstances must Willy',
      acceptedAnswers: [
        'no circumstances must Willy',
        'no circumstances should Willy',
        'no circumstances can Willy'
      ],
      wordChips: ['no', 'circumstances', 'must', 'Willy', 'any', 'never', 'has', 'did'],
      formula: 'Under no circumstances + Modal / Auxiliary + Subject + Bare Infinitive',
      modelNote:
        'Notice that "no" already carries the negation inside "Under no circumstances", so you drop "never" and never write "any".'
    },
    {
      id: 'jsw-27-2',
      roomId: 27,
      itemId: 'item-27-2',
      itemName: 'Brass Candlestick',
      cefr: 'C1',
      category: 'Fronted Concessive Clause',
      dossierCategory: 'cleft_clauses',
      audioClueId: 'clue-27',
      s1Tokens: [
        { text: 'Although', echo: false },
        { text: 'the', echo: false },
        { text: 'chapel', echo: false },
        { text: 'ceiling', echo: false },
        { text: 'looked', echo: false },
        { text: 'peaceful,', echo: true },
        { text: 'corrupted', echo: true },
        { text: 'tiles', echo: true },
        { text: 'could', echo: true },
        { text: 'appear', echo: true },
        { text: 'at', echo: true },
        { text: 'any', echo: true },
        { text: 'moment.', echo: true }
      ],
      deficit: 'Although the chapel ceiling looked',
      tenseHarmony: 'Past linking verb ("looked") stays past simple after "Peaceful though".',
      voiceShift: 'Front predicate adjective ("Peaceful") ahead of "though + Subject + Verb".',
      s2Before: 'Peaceful',
      s2After: ', corrupted tiles could appear at any moment.',
      keyword: 'THOUGH',
      targetAnswer: 'though the chapel ceiling looked',
      acceptedAnswers: ['though the chapel ceiling looked', 'though the ceiling looked'],
      wordChips: ['though', 'the', 'chapel', 'ceiling', 'looked', 'although', 'was', 'looking'],
      formula: 'Adjective + though + Subject + Linking Verb',
      modelNote:
        'Fronting the adjective before "though" creates crisp literary concession without repeating heavy conjunctions.'
    },

    // Rm 28: First Landing
    {
      id: 'jsw-28-1',
      roomId: 28,
      itemId: 'item-28-1',
      itemName: 'Staircase Lantern',
      cefr: 'C1',
      category: 'Wh-Cleft & Contrast',
      dossierCategory: 'cleft_clauses',
      audioClueId: 'clue-28',
      s1Tokens: [
        { text: 'Willy', echo: true },
        { text: 'worried', echo: true },
        { text: 'less', echo: false },
        { text: 'about', echo: false },
        { text: 'the', echo: true },
        { text: 'butler', echo: true },
        { text: 'than', echo: false },
        { text: 'about', echo: false },
        { text: 'the', echo: true },
        { text: 'steep', echo: true },
        { text: 'balcony', echo: true },
        { text: 'drop.', echo: true }
      ],
      deficit: 'less ... than (→ was not so much ... as)',
      tenseHarmony: 'Past simple ("worried") takes singular past linking verb "was" after the Wh-cleft.',
      voiceShift: 'Comparative ("less X than Y") → Correlative Wh-cleft ("was not so much X as Y").',
      s2Before: 'What worried Willy',
      s2After: 'the butler as the steep balcony drop.',
      keyword: 'MUCH',
      targetAnswer: 'was not so much',
      acceptedAnswers: ['was not so much', "wasn't so much"],
      wordChips: ['was', 'not', 'so', 'much', 'were', 'too', 'more'],
      formula: 'What + Clause + was not so much + X + as + Y',
      modelNote:
        'The Wh-clause "What worried Willy" takes singular "was", and the correlative pair "not so much ... as" replaces "less ... than".'
    },
    {
      id: 'jsw-28-2',
      roomId: 28,
      itemId: 'item-28-2',
      itemName: 'Gallery Frame',
      cefr: 'C1',
      category: 'Participle Clause of Result',
      dossierCategory: 'cleft_clauses',
      audioClueId: 'clue-28',
      s1Tokens: [
        { text: 'The', echo: true },
        { text: 'gallery', echo: true },
        { text: 'conveyor', echo: true },
        { text: 'carries', echo: true },
        { text: 'Willy', echo: true },
        { text: 'across', echo: true },
        { text: 'the', echo: true },
        { text: 'gap,', echo: true },
        { text: 'so', echo: false },
        { text: 'he', echo: false },
        { text: 'can', echo: false },
        { text: 'avoid', echo: false },
        { text: 'the', echo: true },
        { text: 'butler', echo: true },
        { text: 'below.', echo: true }
      ],
      deficit: 'so he can avoid',
      tenseHarmony: 'Present result clause ("so he can avoid") → Resultative participle ("thereby enabling him to avoid").',
      voiceShift: 'Coordinating conjunction ("so") replaced by adverbial participle clause.',
      s2Before: 'The gallery conveyor carries Willy across the gap,',
      s2After: 'the butler below.',
      keyword: 'ENABLING',
      targetAnswer: 'thereby enabling him to avoid',
      acceptedAnswers: ['thereby enabling him to avoid', 'enabling him to avoid'],
      wordChips: ['thereby', 'enabling', 'him', 'to', 'avoid', 'enable', 'from', 'avoiding'],
      formula: 'Main Clause, + thereby + -ing Participle + Object + to-Infinitive',
      modelNote:
        'A comma followed by "thereby enabling him to..." links cause and effect cleanly in one fluid C1 sentence.'
    },

    // Rm 32: The Banyan Tree
    {
      id: 'jsw-32-1',
      roomId: 32,
      itemId: 'item-32-1',
      itemName: 'Canopy Acorn',
      cefr: 'C1',
      category: 'Verb Pattern & Preposition',
      dossierCategory: 'phrasal_verbs',
      audioClueId: 'clue-32',
      s1Tokens: [
        { text: 'Thick', echo: true },
        { text: 'banyan', echo: true },
        { text: 'branches', echo: true },
        { text: 'meant', echo: false },
        { text: 'Willy', echo: false },
        { text: 'could', echo: false },
        { text: 'not', echo: false },
        { text: 'jump', echo: false },
        { text: 'straight', echo: true },
        { text: 'onto', echo: true },
        { text: 'the', echo: true },
        { text: 'top', echo: true },
        { text: 'canopy.', echo: true }
      ],
      deficit: 'meant Willy could not jump',
      tenseHarmony: 'Past inability ("meant ... could not jump") → Past reporting verb ("prevented Willy from jumping").',
      voiceShift: 'Negative result clause → Causative verb + object + from + gerund.',
      s2Before: 'Thick banyan branches',
      s2After: 'straight onto the top canopy.',
      keyword: 'PREVENTED',
      targetAnswer: 'prevented Willy from jumping',
      acceptedAnswers: ['prevented Willy from jumping', 'prevented him from jumping'],
      wordChips: ['prevented', 'Willy', 'from', 'jumping', 'to', 'jump', 'forbade', 'stopping'],
      formula: 'Subject + prevented + Object + from + -ing Gerund',
      modelNote:
        '"Prevent" always locks onto the preposition "from" plus a gerund ("jumping"), never a "to"-infinitive.'
    },
    {
      id: 'jsw-32-2',
      roomId: 32,
      itemId: 'item-32-2',
      itemName: 'Root Key',
      cefr: 'C1',
      category: 'Negative Inversion',
      dossierCategory: 'inversion',
      audioClueId: 'clue-32',
      s1Tokens: [
        { text: 'The', echo: false },
        { text: 'banyan', echo: false },
        { text: 'trunk', echo: false },
        { text: 'blocks', echo: false },
        { text: 'the', echo: true },
        { text: 'west', echo: true },
        { text: 'path', echo: true },
        { text: 'and', echo: false },
        { text: 'also', echo: true },
        { text: 'conceals', echo: true },
        { text: 'a', echo: true },
        { text: 'secret', echo: true },
        { text: 'drop', echo: true },
        { text: 'to', echo: true },
        { text: 'the', echo: true },
        { text: 'wine', echo: true },
        { text: 'cellar.', echo: true }
      ],
      deficit: 'The banyan trunk blocks',
      tenseHarmony: 'Present simple ("blocks") requires present auxiliary "does" + bare infinitive "block".',
      voiceShift: 'Front "Not only" and invert auxiliary "does" before the singular subject.',
      s2Before: 'Not only',
      s2After: 'the west path, but it also conceals a secret drop to the wine cellar.',
      keyword: 'BLOCK',
      targetAnswer: 'does the banyan trunk block',
      acceptedAnswers: ['does the banyan trunk block', 'does the trunk block'],
      wordChips: ['does', 'the', 'banyan', 'trunk', 'block', 'blocks', 'is', 'blocking'],
      formula: 'Not only + does/do/did + Subject + Bare Infinitive ... but ... also',
      modelNote:
        'Once "does" steps in front of "the banyan trunk", drop the final -s on "block" so the keyword stays untouched.'
    },

    // Rm 18: The Wine Cellar
    {
      id: 'jsw-18-1',
      roomId: 18,
      itemId: 'item-18-1',
      itemName: 'Vintage Cork',
      cefr: 'C1',
      category: 'Nominal Collocation',
      dossierCategory: 'phrasal_verbs',
      audioClueId: 'clue-18',
      s1Tokens: [
        { text: 'The', echo: true },
        { text: 'cellar', echo: true },
        { text: 'spider', echo: true },
        { text: 'definitely', echo: false },
        { text: 'does', echo: false },
        { text: 'not', echo: false },
        { text: 'plan', echo: false },
        { text: 'to', echo: false },
        { text: 'move', echo: false },
        { text: 'away', echo: true },
        { text: 'from', echo: true },
        { text: 'the', echo: true },
        { text: 'vintage', echo: true },
        { text: 'cask.', echo: true }
      ],
      deficit: 'definitely does not plan to move',
      tenseHarmony: 'Present simple ("does not plan") → Present possession ("has no intention of moving").',
      voiceShift: 'Verbal "does not plan to" → Noun phrase "has no intention of + gerund".',
      s2Before: 'The cellar spider',
      s2After: 'away from the vintage cask.',
      keyword: 'INTENTION',
      targetAnswer: 'has no intention of moving',
      acceptedAnswers: ['has no intention of moving', 'has no intention whatsoever of moving'],
      wordChips: ['has', 'no', 'intention', 'of', 'moving', 'to', 'move', 'not'],
      formula: 'Subject + have + no intention of + -ing Gerund',
      modelNote:
        'Candidates often slip by writing "intention to move"; Cambridge Part 4 specifically rewards "no intention of + -ing".'
    },
    {
      id: 'jsw-18-2',
      roomId: 18,
      itemId: 'item-18-2',
      itemName: 'Cellar Ledger',
      cefr: 'C1',
      category: 'Prepositional Concession',
      dossierCategory: 'register_shift',
      audioClueId: 'clue-18',
      s1Tokens: [
        { text: 'Even', echo: false },
        { text: 'though', echo: false },
        { text: 'the', echo: false },
        { text: 'cellar', echo: true },
        { text: 'floor', echo: true },
        { text: 'is', echo: false },
        { text: 'damp,', echo: false },
        { text: 'the', echo: true },
        { text: 'oak', echo: true },
        { text: 'barrels', echo: true },
        { text: 'remain', echo: true },
        { text: 'completely', echo: true },
        { text: 'dry', echo: true },
        { text: 'inside.', echo: true }
      ],
      deficit: 'Even though the ... is damp',
      tenseHarmony: 'Finite concessive clause ("Even though the floor is damp") → Prepositional noun phrase ("In spite of the damp").',
      voiceShift: 'Subordinate clause compressed into prepositional modifier ahead of "cellar floor".',
      s2Before: '',
      s2After: 'cellar floor, the oak barrels remain completely dry inside.',
      keyword: 'SPITE',
      targetAnswer: 'In spite of the damp',
      acceptedAnswers: ['In spite of the damp'],
      wordChips: ['In', 'spite', 'of', 'the', 'damp', 'Despite', 'for', 'a'],
      formula: 'In spite of + Noun Phrase, + Main Clause',
      modelNote:
        '"In spite of" always takes three words before the noun phrase; "Despite" never uses "of".'
    },

    // Rm 34: The Belfast Study
    {
      id: 'jsw-34-1',
      roomId: 34,
      itemId: 'item-34-1',
      itemName: 'Mahogany Nib',
      cefr: 'C1',
      category: 'Preparatory It & Passive',
      dossierCategory: 'register_shift',
      audioClueId: 'clue-34',
      s1Tokens: [
        { text: 'Most', echo: false },
        { text: 'examiners', echo: false },
        { text: 'agree', echo: false },
        { text: 'that', echo: true },
        { text: 'three', echo: true },
        { text: 'clear', echo: true },
        { text: 'C1', echo: true },
        { text: 'structures', echo: true },
        { text: 'lift', echo: true },
        { text: 'an', echo: true },
        { text: 'essay', echo: true },
        { text: 'more', echo: true },
        { text: 'than', echo: true },
        { text: 'obscure', echo: true },
        { text: 'vocabulary.', echo: true }
      ],
      deficit: 'Most examiners agree',
      tenseHarmony: 'Present general claim ("agree") → Present passive reporting ("It is widely agreed").',
      voiceShift: 'Active subject ("Most examiners") → Impersonal preparatory "It" + passive.',
      s2Before: '',
      s2After: 'that three clear C1 structures lift an essay more than obscure vocabulary.',
      keyword: 'WIDELY',
      targetAnswer: 'It is widely agreed',
      acceptedAnswers: ['It is widely agreed', "It's widely agreed"],
      wordChips: ['It', 'is', 'widely', 'agreed', 'There', 'are', 'agree', 'wide'],
      formula: 'It + is + Adverb + Past Participle + that + Clause',
      modelNote:
        'Using preparatory "It" with "widely agreed" removes informal openers cleanly in both Cambridge reports and IELTS essays.'
    },
    {
      id: 'jsw-34-2',
      roomId: 34,
      itemId: 'item-34-2',
      itemName: 'Red-Pen Folio',
      cefr: 'C1',
      category: 'Negative Inversion',
      dossierCategory: 'inversion',
      audioClueId: 'clue-34',
      s1Tokens: [
        { text: 'Gareth', echo: false },
        { text: 'never', echo: false },
        { text: 'advised', echo: false },
        { text: 'candidates', echo: true },
        { text: 'to', echo: true },
        { text: 'memorise', echo: true },
        { text: 'robotic', echo: true },
        { text: 'templates', echo: true },
        { text: 'at', echo: true },
        { text: 'his', echo: true },
        { text: 'Belfast', echo: true },
        { text: 'desk.', echo: true }
      ],
      deficit: 'Gareth never advised',
      tenseHarmony: 'Past simple negative ("never advised") → Inverted past simple ("no time did Gareth advise").',
      voiceShift: 'Front "At no time" and invert auxiliary "did" before "Gareth + bare infinitive".',
      s2Before: 'At',
      s2After: 'candidates to memorise robotic templates at his Belfast desk.',
      keyword: 'TIME',
      targetAnswer: 'no time did Gareth advise',
      acceptedAnswers: ['no time did Gareth advise', 'no time did he advise'],
      wordChips: ['no', 'time', 'did', 'Gareth', 'advise', 'advised', 'any', 'has'],
      formula: 'At no time + did + Subject + Bare Infinitive',
      modelNote:
        'Notice the British verb spelling "advise" here (with an s), and drop the past -ed ending once "did" steps forward.'
    }
  ];

  // =========================================================================
  // #room=<base64url> CUSTOM ROOM BUILDER CODEC
  // =========================================================================
  function base64UrlEncode(str) {
    const bytes =
      typeof TextEncoder !== 'undefined'
        ? new TextEncoder().encode(str)
        : Buffer.from(str, 'utf8');
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 =
      typeof btoa === 'function'
        ? btoa(binary)
        : Buffer.from(binary, 'binary').toString('base64');
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function base64UrlDecode(token) {
    let b64 = String(token || '').replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const binary =
      typeof atob === 'function'
        ? atob(b64)
        : Buffer.from(b64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return typeof TextDecoder !== 'undefined'
      ? new TextDecoder().decode(bytes)
      : Buffer.from(bytes).toString('utf8');
  }

  function compressGrid(gridStrings) {
    const flat = gridStrings.map((r) => (r + '................................').slice(0, 32)).join('');
    let out = '';
    let i = 0;
    while (i < flat.length) {
      const ch = flat[i];
      let run = 1;
      while (i + run < flat.length && flat[i + run] === ch && run < 99) run++;
      out += run > 2 ? `${run}${ch}` : ch.repeat(run);
      i += run;
    }
    return out;
  }

  function decompressGrid(rle) {
    let flat = '';
    const rx = /(\d*)([.=#*RC])/g;
    let m;
    while ((m = rx.exec(String(rle || ''))) !== null) {
      const count = m[1] ? Math.min(512, parseInt(m[1], 10)) : 1;
      flat += m[2].repeat(count);
      if (flat.length >= 512) break;
    }
    flat = (flat + '.'.repeat(512)).slice(0, 512);
    const rows = [];
    for (let r = 0; r < 16; r++) {
      rows.push(flat.slice(r * 32, (r + 1) * 32));
    }
    return rows;
  }

  function buildEchoTokens(s1, s2Before, s2After) {
    const s2Words = new Set(
      normaliseAnswer(`${s2Before || ''} ${s2After || ''}`)
        .toLowerCase()
        .split(' ')
        .map((w) => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ''))
        .filter(Boolean)
    );
    return normaliseAnswer(s1)
      .split(' ')
      .filter(Boolean)
      .map((word) => {
        const clean = word.toLowerCase().replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, '');
        return { text: word, echo: Boolean(clean && s2Words.has(clean)) };
      });
  }

  function buildChipsForCustomRiddle(targetAnswer, keyword) {
    const targetTokens = normaliseAnswer(targetAnswer).split(' ').filter(Boolean);
    const lowerSet = new Set(targetTokens.map((t) => t.toLowerCase()));
    const pool = ['did', 'had', 'were', 'not', 'would', 'to', 'having', 'no', 'any'];
    const extras = [];
    for (const p of pool) {
      if (!lowerSet.has(p) && targetTokens.length + extras.length < 8) {
        extras.push(p);
      }
    }
    const combined = targetTokens.concat(extras);
    // Deterministic weave so chips aren't in straight solved order
    const out = [];
    let lo = 0;
    let hi = combined.length - 1;
    while (lo <= hi) {
      if (lo !== hi) out.push(combined[hi]);
      out.push(combined[lo]);
      lo++;
      hi--;
    }
    if (keyword && !out.some((w) => w.toLowerCase() === keyword.toLowerCase())) {
      out[0] = keyword.toLowerCase();
    }
    return out;
  }

  function encodeCustomRoom(spec) {
    if (!spec || !Array.isArray(spec.gridStrings) || spec.gridStrings.length !== 16) return '';
    const payload = {
      v: 1,
      n: String(spec.name || 'Custom C1 Chamber').slice(0, 32),
      b: Number(spec.border) & 7,
      cd: Number(spec.convDir) === 2 ? 2 : 1,
      rd: Number(spec.rampDir) === 1 ? 1 : 0,
      g: compressGrid(spec.gridStrings),
      i: (spec.items || []).slice(0, 2).map((it) => [it.col | 0, it.row | 0]),
      u: (spec.guardians || []).slice(0, 4).map((gd) => [gd.col | 0, gd.row | 0, gd.minCol | 0, gd.maxCol | 0]),
      r: spec.riddle
        ? {
            s1: String(spec.riddle.s1 || '').slice(0, 220),
            sb: String(spec.riddle.s2Before || '').slice(0, 140),
            sa: String(spec.riddle.s2After || '').slice(0, 140),
            kw: String(spec.riddle.keyword || '').trim().toUpperCase().slice(0, 24),
            ans: normaliseAnswer(spec.riddle.targetAnswer || '').slice(0, 100),
            fm: String(spec.riddle.formula || '').slice(0, 140),
            nt: String(spec.riddle.modelNote || '').slice(0, 220)
          }
        : null
    };
    return base64UrlEncode(JSON.stringify(payload));
  }

  function decodeCustomRoom(hashOrToken) {
    try {
      let token = String(hashOrToken || '').trim();
      if (token.startsWith('#')) token = token.slice(1);
      if (token.startsWith('room=')) token = token.slice(5);
      if (!token || !/^[A-Za-z0-9_-]+$/.test(token)) return null;
      const parsed = JSON.parse(base64UrlDecode(token));
      if (!parsed || parsed.v !== 1 || typeof parsed.g !== 'string') return null;

      const gridStrings = decompressGrid(parsed.g);
      const items = Array.isArray(parsed.i)
        ? parsed.i
            .filter((p) => Array.isArray(p) && p.length >= 2)
            .slice(0, 2)
            .map((p, idx) => ({
              id: `custom-item-${idx + 1}`,
              label: `Custom Relic ${idx + 1}`,
              col: Math.max(0, Math.min(31, p[0] | 0)),
              row: Math.max(0, Math.min(14, p[1] | 0)),
              attr: idx === 0 ? 0x46 : 0x45,
              riddleId: 'custom-riddle-1'
            }))
        : [];

      const guardians = Array.isArray(parsed.u)
        ? parsed.u
            .filter((g) => Array.isArray(g) && g.length >= 4)
            .slice(0, 4)
            .map((g, idx) => {
              const col = Math.max(1, Math.min(29, g[0] | 0));
              const row = Math.max(1, Math.min(13, g[1] | 0));
              const minCol = Math.max(0, Math.min(col, g[2] | 0));
              const maxCol = Math.max(col, Math.min(30, g[3] | 0));
              return {
                name: `Builder Sentry ${idx + 1}`,
                kind: 'horizontal',
                col,
                row,
                minCol,
                maxCol,
                y: row * 8,
                frame: 0,
                dir: 0,
                attr: 0x43,
                typeByte: 0x01,
                startByte: ((row * 8) & 0xf8) | (col & 0x07)
              };
            })
        : [];

      let riddle = null;
      if (parsed.r && parsed.r.s1 && parsed.r.kw && parsed.r.ans) {
        const s1 = String(parsed.r.s1);
        const s2Before = String(parsed.r.sb || '');
        const s2After = String(parsed.r.sa || '');
        const keyword = String(parsed.r.kw).toUpperCase();
        const targetAnswer = normaliseAnswer(parsed.r.ans);
        riddle = {
          id: 'custom-riddle-1',
          roomId: 45,
          itemId: 'custom-item-1',
          itemName: 'Custom Chamber Relic',
          cefr: 'C1',
          category: 'Custom Builder Part 4',
          dossierCategory: 'inversion',
          audioClueId: 'clue-34',
          s1Tokens: buildEchoTokens(s1, s2Before, s2After),
          deficit: 'Isolate the words absent from Sentence 2',
          tenseHarmony: 'Keep the tense and aspect aligned with Sentence 1.',
          voiceShift: 'Keep the given keyword completely unchanged in 3 to 6 words.',
          s2Before,
          s2After,
          keyword,
          targetAnswer,
          acceptedAnswers: [targetAnswer],
          wordChips: buildChipsForCustomRiddle(targetAnswer, keyword),
          formula: String(parsed.r.fm || 'Clause Frame + Unchanged Keyword (3–6 words)'),
          modelNote: String(parsed.r.nt || 'Built in the 8-Bit Room Builder.')
        };
      }

      return {
        id: 45,
        name: String(parsed.n || 'Custom C1 Chamber').slice(0, 32),
        border: (Number(parsed.b) || 0) & 7,
        convDir: Number(parsed.cd) === 2 ? 2 : 1,
        rampDir: Number(parsed.rd) === 1 ? 1 : 0,
        gridStrings,
        items,
        guardians,
        riddle
      };
    } catch (_) {
      return null;
    }
  }

  function findRoom(roomId) {
    return rooms.find((r) => r.id === Number(roomId)) || null;
  }

  function findRiddle(riddleId) {
    return riddles.find((r) => r.id === riddleId) || null;
  }

  function findClueForRoom(roomId) {
    return audioClues.find((c) => c.roomId === Number(roomId)) || audioClues[0];
  }

  // =========================================================================
  // DATA TESTS (Run via Node or ?selftest=1)
  // =========================================================================
  function dataTests() {
    const lines = [];
    let pass = true;
    const fail = (msg) => {
      pass = false;
      lines.push('FAIL: ' + msg);
    };

    const bannedRx = new RegExp(
      '\\b(?:' +
        ['Tu' + 'tor\\s+Cue', 'Tea' + 'cher\\s+Note', 'Tu' + 'tor\\s+Note', 'Tea' + 'cher\\s+Cue', 'Socra' + 'tic\\s+Prompt', 'Instruc' + 'tor\\s+Prompt'].join('|') +
      ')\\s*:|\\b(?:' +
        ['cogni' + 'tive\\s+load', 'processing\\s+band' + 'width', 'canti' + 'lever(?:s|ed)?', 'truss(?:es)?', 'schem' + 'atic(?:s)?', 'through' + 'put', 'guaran' + 'teed(?:\\s+band)?', 'unbreak' + 'able', 'locks\\s+in', 'pure\\s+gold', 'supr' + 'eme', 'depleted\\s+talent\\s+pool'].join('|') +
      ')\\b',
      'i'
    );

    if (rooms.length !== 8) fail(`Expected 8 mansion rooms, got ${rooms.length}`);
    const expectedIds = [33, 35, 42, 27, 28, 32, 18, 34];
    const roomIdSet = new Set(rooms.map((r) => r.id));
    expectedIds.forEach((eid) => {
      if (!roomIdSet.has(eid)) fail(`Missing required room ID ${eid}`);
    });

    const seenItems = new Set();
    rooms.forEach((rm) => {
      if (!Array.isArray(rm.gridStrings) || rm.gridStrings.length !== 16) {
        fail(`Room ${rm.id} must have 16 grid rows`);
        return;
      }
      rm.gridStrings.forEach((row, rIdx) => {
        if (typeof row !== 'string' || row.length !== 32) {
          fail(`Room ${rm.id} row ${rIdx} length ${row && row.length} (must be 32)`);
        }
        if (/[^.=#*]/.test(row)) {
          fail(`Room ${rm.id} row ${rIdx} has invalid cell char`);
        }
      });
      if (!Array.isArray(rm.exits) || rm.exits.length !== 4) {
        fail(`Room ${rm.id} must have 4 exits`);
      } else {
        rm.exits.forEach((exId) => {
          if (!roomIdSet.has(exId)) fail(`Room ${rm.id} references unknown exit ${exId}`);
        });
      }
      if (!Array.isArray(rm.items) || rm.items.length !== 2) {
        fail(`Room ${rm.id} must have exactly 2 items`);
      } else {
        rm.items.forEach((it) => {
          if (seenItems.has(it.id)) fail(`Duplicate item id ${it.id}`);
          seenItems.add(it.id);
          const ch = rm.gridStrings[it.row] && rm.gridStrings[it.row][it.col];
          if (ch !== '.') fail(`Item ${it.id} in Room ${rm.id} overlaps non-air cell "${ch}" at (${it.col},${it.row})`);
          if (!findRiddle(it.riddleId)) fail(`Item ${it.id} missing riddle ${it.riddleId}`);
        });
      }
      // Verify spawn sits in open air above solid ground
      const sp = rm.spawn;
      if (!sp) fail(`Room ${rm.id} missing spawn`);
      else {
        const sRow = sp.y >> 3;
        for (let rr = sRow; rr <= sRow + 1; rr++) {
          for (let cc = sp.x; cc <= sp.x + 1; cc++) {
            const c = rm.gridStrings[rr][cc];
            if (c !== '.') fail(`Room ${rm.id} spawn (${sp.x},${sp.y}) hits '${c}' at (${cc},${rr})`);
          }
        }
        const footRow = (sp.y + 16) >> 3;
        const fL = rm.gridStrings[footRow][sp.x];
        const fR = rm.gridStrings[footRow][sp.x + 1];
        if (fL !== '#' && fL !== '=' && fR !== '#' && fR !== '=') {
          fail(`Room ${rm.id} spawn lacks solid ground under (${sp.x},${sp.y})`);
        }
      }
    });

    if (riddles.length !== 16) fail(`Expected 16 riddles, got ${riddles.length}`);
    const seenRiddles = new Set();
    riddles.forEach((rd) => {
      if (seenRiddles.has(rd.id)) fail(`Duplicate riddle id ${rd.id}`);
      seenRiddles.add(rd.id);
      if (!roomIdSet.has(rd.roomId)) fail(`Riddle ${rd.id} invalid roomId ${rd.roomId}`);
      if (/\s/.test(rd.keyword) || !/^[A-Z]+$/.test(rd.keyword)) {
        fail(`Riddle ${rd.id} invalid keyword "${rd.keyword}"`);
      }
      if (!Array.isArray(rd.acceptedAnswers) || rd.acceptedAnswers.length === 0) {
        fail(`Riddle ${rd.id} missing acceptedAnswers`);
      } else {
        rd.acceptedAnswers.forEach((ans) => {
          const check = validatePart4Answer(ans, rd.keyword);
          if (!check.valid) fail(`Riddle ${rd.id} answer "${ans}": ${check.reason}`);
        });
      }
      // Verify Word-Chip Forge can build targetAnswer
      if (!Array.isArray(rd.wordChips) || rd.wordChips.length < 7 || rd.wordChips.length > 8) {
        fail(`Riddle ${rd.id} wordChips length ${rd.wordChips && rd.wordChips.length} (expected 7-8)`);
      } else {
        const pool = rd.wordChips.slice();
        rd.targetAnswer.split(/\s+/).forEach((tok) => {
          const idx = pool.findIndex((c) => c === tok);
          if (idx === -1) fail(`Riddle ${rd.id} wordChips missing target token "${tok}"`);
          else pool.splice(idx, 1);
        });
      }
      if (!rd.s1Tokens.some((t) => t.echo) || !rd.s1Tokens.some((t) => !t.echo)) {
        fail(`Riddle ${rd.id} s1Tokens must have both echoes and deficit`);
      }
      const textBlob = [
        rd.category,
        rd.deficit,
        rd.tenseHarmony,
        rd.voiceShift,
        rd.s2Before,
        rd.s2After,
        rd.targetAnswer,
        rd.formula,
        rd.modelNote
      ].join(' ');
      if (bannedRx.test(textBlob)) {
        fail(`Riddle ${rd.id} triggered banned phrase check`);
      }
    });

    // Audio clues
    if (audioClues.length !== 8) fail(`Expected 8 audio clues, got ${audioClues.length}`);
    audioClues.forEach((c) => {
      if (!/^assets\/audio\/tts\/jsw-clue-0[1-8]-[a-z0-9-]+\.mp3$/.test(c.file)) {
        fail(`Invalid clue path ${c.file}`);
      }
      if (bannedRx.test(c.transcript)) fail(`Audio clue ${c.id} contains banned wording`);
    });

    // Cambridge contraction counting checks
    if (countCambridgeWords("don't") !== 2) fail("countCambridgeWords(\"don't\") !== 2");
    if (countCambridgeWords("would rather he hadn't left") !== 6) fail('contraction count check failed');
    if (countCambridgeWords("It's widely agreed") !== 4) fail("countCambridgeWords(\"It's widely agreed\") !== 4");
    if (countCambridgeWords("Willy's sponge") !== 2) fail('possessive count check failed');

    // #room= round-trip test
    const sampleRoom = {
      name: 'Belfast Builder Check',
      border: 5,
      convDir: 2,
      rampDir: 1,
      gridStrings: rooms[0].gridStrings.slice(),
      items: [{ col: 6, row: 3 }],
      guardians: [{ col: 14, row: 13, minCol: 10, maxCol: 20 }],
      riddle: {
        s1: 'Willy never stepped inside the dark study before midnight.',
        s2Before: 'At',
        s2After: 'inside the dark study before midnight.',
        keyword: 'TIME',
        targetAnswer: 'no time did Willy step',
        formula: 'At no time + did + Subject + Bare Infinitive',
        modelNote: 'Negative inversion test.'
      }
    };
    const tok = encodeCustomRoom(sampleRoom);
    const dec = decodeCustomRoom('#room=' + tok);
    if (
      !dec ||
      dec.name !== sampleRoom.name ||
      dec.border !== 5 ||
      dec.gridStrings.join('') !== sampleRoom.gridStrings.join('') ||
      dec.items.length !== 1 ||
      dec.guardians.length !== 1 ||
      !dec.riddle ||
      dec.riddle.targetAnswer !== 'no time did Willy step'
    ) {
      fail('#room= encode/decode round-trip failed');
    }
    if (decodeCustomRoom('#room=not!valid!!') !== null) fail('decodeCustomRoom accepted malformed hash');

    lines.push(`(a) validated ${rooms.length} interconnected Z80 rooms (16x32 grids, spawns, exits, 16 items)`);
    lines.push(`(b) validated ${riddles.length} Cambridge C1 Part 4 riddles (unchanged keywords, 3-6 words, 7-8 chips)`);
    lines.push(`(c) validated ${audioClues.length} British Piper audio clue records & Cambridge contraction rules`);
    lines.push(`(d) validated #room=<base64url> Room Builder round-trip codec`);
    return { pass, lines };
  }

  const api = {
    version: 1,
    rooms,
    riddles,
    audioClues,
    normaliseAnswer,
    countCambridgeWords,
    validatePart4Answer,
    evaluateRiddleAnswer,
    findRoom,
    findRiddle,
    findClueForRoom,
    buildEchoTokens,
    buildChipsForCustomRiddle,
    encodeCustomRoom,
    decodeCustomRoom,
    dataTests
  };

  root.JSW_MANSION_RIDDLES = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
