/**
 * ==============================================================================
 * GRAMMAR CRYPT — EXPANDED DATA REPOSITORY (cryptData.js)
 * Modular grammar floors, multi-tense dungeons, syntax assembly chunks,
 * and error-correction boss battles.
 * ==============================================================================
 */

// 1. MAIN CAMPAIGN: THE GRAND CATACOMBS (Progressive B2 -> C1 -> C2)
const mainCampaignFloors = [
  {
    roomId: 1,
    type: "assembly",
    category: "Question Syntax",
    title: "Chamber of Inquiries",
    description: "Assemble the ancient question by placing the clauses in correct English auxiliary order.",
    hint: "Wh-word + Auxiliary + Subject + Main Verb + Object.",
    targetOrder: ["What", "did", "the archivist", "discover", "in the tomb?"],
    scrambled: ["discover", "What", "in the tomb?", "did", "the archivist"]
  },
  {
    roomId: 2,
    type: "assembly",
    category: "Past Perfect",
    title: "Hall of the Vanished Predecessor",
    description: "Unseal the stone door by constructing an inquiry about past preceding actions.",
    hint: "Had + Subject + Past Participle + Object before past reference.",
    targetOrder: ["Had", "the explorer", "already mapped", "the subterranean catacombs?"],
    scrambled: ["the subterranean catacombs?", "Had", "already mapped", "the explorer"]
  },
  {
    roomId: 3,
    type: "assembly",
    category: "Negative Inversion (C1)",
    title: "The Portal of Inversion",
    description: "Negative adverbials placed in the initial clause demand inverted syntax.",
    hint: "Negative adverbial (Hardly had) + Subject + Past Participle + when + Past Simple.",
    targetOrder: ["Hardly had", "the torches", "been extinguished", "when the chamber", "sealed shut."],
    scrambled: ["when the chamber", "Hardly had", "sealed shut.", "been extinguished", "the torches"]
  },
  {
    roomId: 4,
    type: "assembly",
    category: "Conditionals Without If (C1)",
    title: "The Sanctum of Inverted Conditions",
    description: "Construct a third conditional without using the word 'if'.",
    hint: "Had + Subject + Past Participle + would have + Past Participle.",
    targetOrder: ["Had they heeded", "the warnings,", "they would not have", "awakened the guardian."],
    scrambled: ["they would not have", "awakened the guardian.", "the warnings,", "Had they heeded"]
  },
  {
    roomId: 5,
    type: "boss",
    category: "Boss Battle: Error Correction",
    title: "The Goblin of Gerunds (Boss Encounter)",
    bossName: "The Goblin of Gerunds",
    bossEmoji: "👺",
    bossMaxHp: 3,
    description: "The Goblin hurls corrupted sentences! Identify the flawed segment in each spell, then select the surgical grammatical fix before taking damage.",
    attacks: [
      {
        segments: [
          "Despite of",
          "the heavy iron gates,",
          "the rogue slipped",
          "silently into",
          "the inner crypt."
        ],
        errorIndex: 0, // "Despite of"
        options: [
          "Despite",
          "Although",
          "In spite"
        ],
        correctOption: "Despite",
        explanation: "'Despite' is a preposition used without 'of'. Alternatively, use 'In spite of'."
      },
      {
        segments: [
          "The warden",
          "admitted to enter",
          "the forbidden vault",
          "without authorization",
          "at midnight."
        ],
        errorIndex: 1, // "admitted to enter"
        options: [
          "admitted entering",
          "admitted to have enter",
          "admitted entered"
        ],
        correctOption: "admitted entering",
        explanation: "The verb 'admit' is followed by a gerund ('admitted entering' or 'admitted to entering'), not the bare infinitive."
      },
      {
        segments: [
          "She suggested",
          "him to consult",
          "the ancient codex",
          "before disturbing",
          "the altar."
        ],
        errorIndex: 1, // "him to consult"
        options: [
          "that he consult",
          "him consulting",
          "to him consulting"
        ],
        correctOption: "that he consult",
        explanation: "'Suggest' never takes an indirect object + infinitive ('suggested him to'). Use a subjunctive that-clause ('suggested that he consult') or a gerund ('suggested consulting')."
      }
    ]
  },
  {
    roomId: 6,
    type: "assembly",
    category: "Mixed Conditionals (C1/C2)",
    title: "The Chamber of Mixed Realities",
    description: "Bridge an unreal past event with an ongoing present reality.",
    hint: "Past condition (3rd conditional: If + had + pp) + Present consequence (2nd conditional: would + base verb).",
    targetOrder: ["If the scholar hadn't", "translated the glyphs,", "she would still be", "trapped in", "the labyrinth."],
    scrambled: ["she would still be", "If the scholar hadn't", "the labyrinth.", "translated the glyphs,", "trapped in"]
  },
  {
    roomId: 7,
    type: "assembly",
    category: "Cleft Sentences (C2)",
    title: "The Altar of Focus & Clefting",
    description: "Rearrange the clauses into an emphatic pseudo-cleft sentence.",
    hint: "What + clause + was + emphatic complement.",
    targetOrder: ["What bewildered", "the senior archaeologists", "was the pristine state", "of the central sarcophagus."],
    scrambled: ["of the central sarcophagus.", "What bewildered", "was the pristine state", "the senior archaeologists"]
  },
  {
    roomId: 8,
    type: "assembly",
    category: "Participle Clauses (C1)",
    title: "The Hall of Participles",
    description: "Assemble a perfect participle clause indicating cause and preceding action.",
    hint: "Having + Past Participle + Object, Subject + Verb + Complement.",
    targetOrder: ["Having deciphered", "the protective sigils,", "the brave expedition", "advanced into", "the royal vault."],
    scrambled: ["advanced into", "the protective sigils,", "the brave expedition", "Having deciphered", "the royal vault."]
  },
  {
    roomId: 9,
    type: "assembly",
    category: "Correlative Inversion (C2)",
    title: "The Corridor of Absolute Inversion",
    description: "Assemble a correlative structure starting with 'Not only'.",
    hint: "Not only + Auxiliary + Subject + Verb, but + Subject + also + Verb.",
    targetOrder: ["Not only did", "the tomb hold", "invaluable gold,", "but it also", "concealed dark relics."],
    scrambled: ["invaluable gold,", "concealed dark relics.", "Not only did", "but it also", "the tomb hold"]
  },
  {
    roomId: 10,
    type: "boss",
    category: "Grand Boss Battle: C1/C2 Syntax Master",
    title: "The Syntax Lich (Grand Boss Encounter)",
    bossName: "The Syntax Lich",
    bossEmoji: "💀",
    bossMaxHp: 4,
    description: "The Lich unleashes fatal corrupted C1/C2 spells! Identify the exact flawed clause in each dark incantation and select the surgical repair.",
    attacks: [
      {
        segments: [
          "Not only",
          "the council disregarded",
          "the ancient omen,",
          "but they also",
          "shattered the seal."
        ],
        errorIndex: 1, // "the council disregarded"
        options: [
          "did the council disregard",
          "had the council disregarded",
          "the council did disregard"
        ],
        correctOption: "did the council disregard",
        explanation: "When 'Not only' opens an independent clause, subject-auxiliary inversion is mandatory ('did the council disregard')."
      },
      {
        segments: [
          "Having been",
          "bitten by the serpent,",
          "the antidote",
          "was desperately administered",
          "by the healer."
        ],
        errorIndex: 2, // Dangling participle: "the antidote" wasn't bitten
        options: [
          "the healer desperately administered the antidote",
          "it was the antidote administered",
          "the antidote had been sought"
        ],
        correctOption: "the healer desperately administered the antidote",
        explanation: "Dangling participle trap: The subject following the comma must be the agent performing the participle action ('Having been bitten... the patient/healer')."
      },
      {
        segments: [
          "It is high time",
          "the guildmaster",
          "takes responsibility",
          "for the collapsed",
          "colonnade."
        ],
        errorIndex: 2, // "takes responsibility"
        options: [
          "took responsibility",
          "will take responsibility",
          "has taken responsibility"
        ],
        correctOption: "took responsibility",
        explanation: "Following 'It is high time' or 'It is about time', use the past simple ('took') to convey urgent present unreality."
      },
      {
        segments: [
          "Seldom",
          "we have witnessed",
          "such architectural brilliance",
          "in the deepest",
          "catacombs."
        ],
        errorIndex: 1, // "we have witnessed"
        options: [
          "have we witnessed",
          "did we witnessed",
          "had witnessed we"
        ],
        correctOption: "have we witnessed",
        explanation: "Limiting and negative adverbials ('Seldom', 'Rarely', 'Never') in front position trigger inverted word order ('have we witnessed')."
      }
    ]
  }
];

// 2. TARGETED DUNGEON: CAE / CPE INVERSION DUNGEON (?level=cae-inversion)
const caeInversionFloors = [
  {
    roomId: 1,
    type: "assembly",
    category: "Negative Inversion",
    title: "Chamber of Hardly & Scarcely",
    description: "Assemble the correlative clause: 'Hardly had... when'.",
    hint: "Hardly had + Subject + PP + when + past action.",
    targetOrder: ["Hardly had", "the scholar opened", "the grimoire", "when the flames", "turned azure."],
    scrambled: ["the grimoire", "Hardly had", "when the flames", "turned azure.", "the scholar opened"]
  },
  {
    roomId: 2,
    type: "assembly",
    category: "Rarely & Seldom",
    title: "Vault of Rare Occurrences",
    description: "Invert the subject and auxiliary following 'Seldom'.",
    hint: "Seldom + aux (had) + subject + verb.",
    targetOrder: ["Seldom had", "the guardians seen", "such resolve", "in an uninvited", "intruder."],
    scrambled: ["in an uninvited", "Seldom had", "the guardians seen", "such resolve", "intruder."]
  },
  {
    roomId: 3,
    type: "assembly",
    category: "Only After Inversion",
    title: "The Gate of Conditional Delay",
    description: "When 'Only after' opens a sentence, invert the second clause.",
    hint: "Only after + time clause + auxiliary + subject + main verb.",
    targetOrder: ["Only after", "the glyphs ignited", "did the mechanism", "reveal the hidden", "passageway."],
    scrambled: ["did the mechanism", "Only after", "passageway.", "reveal the hidden", "the glyphs ignited"]
  },
  {
    roomId: 4,
    type: "assembly",
    category: "Under No Circumstances",
    title: "Sanctum of Absolute Prohibition",
    description: "Prepositional negative phrases trigger modal inversion.",
    hint: "Under no circumstances + modal (should) + subject + be + verb.",
    targetOrder: ["Under no circumstances", "should the crimson crystal", "be removed from", "the pedestaled dais."],
    scrambled: ["be removed from", "the pedestaled dais.", "should the crimson crystal", "Under no circumstances"]
  },
  {
    roomId: 5,
    type: "boss",
    category: "Boss Battle: Inversion Specialist",
    title: "The Inquisitor of Inversion (Boss Encounter)",
    bossName: "The Inquisitor of Inversion",
    bossEmoji: "🧙‍♂️",
    bossMaxHp: 3,
    description: "Spot and rectify the broken inversion structures in the Inquisitor's spells!",
    attacks: [
      {
        segments: [
          "Under no circumstances",
          "visitors may touch",
          "the ancient artifacts",
          "behind the glass",
          "barrier."
        ],
        errorIndex: 1, // "visitors may touch"
        options: [
          "may visitors touch",
          "visitors must not touch",
          "touch may visitors"
        ],
        correctOption: "may visitors touch",
        explanation: "'Under no circumstances' requires modal inversion: 'may visitors touch'."
      },
      {
        segments: [
          "No sooner",
          "had she stepped",
          "across the threshold",
          "when the portcullis",
          "crashed down."
        ],
        errorIndex: 3, // "when the portcullis" -> should be "than"
        options: [
          "than the portcullis",
          "as the portcullis",
          "that the portcullis"
        ],
        correctOption: "than the portcullis",
        explanation: "'No sooner' pairs strictly with 'than' (unlike 'Hardly/Scarcely', which pair with 'when')."
      },
      {
        segments: [
          "Little",
          "they suspected",
          "that the crypt",
          "held a second",
          "subterranean level."
        ],
        errorIndex: 1, // "they suspected"
        options: [
          "did they suspect",
          "had they suspected",
          "they had suspected"
        ],
        correctOption: "did they suspect",
        explanation: "Negative adverb 'Little' takes subject-auxiliary inversion with past simple: 'did they suspect'."
      }
    ]
  }
];

// 3. TARGETED DUNGEON: IELTS & CONDITIONALS (?level=mixed-conditionals)
const mixedConditionalsFloors = [
  {
    roomId: 1,
    type: "assembly",
    category: "Mixed Conditional (Past -> Present)",
    title: "Chamber of Divergent Timelines",
    description: "Assemble a condition in the past with a present ongoing result.",
    hint: "If + had + past participle, subject + would + base verb.",
    targetOrder: ["If the scout had", "brought the perimeter map,", "we would not be", "lost in the dark."],
    scrambled: ["lost in the dark.", "If the scout had", "we would not be", "brought the perimeter map,"]
  },
  {
    roomId: 2,
    type: "assembly",
    category: "Mixed Conditional (Present -> Past)",
    title: "Vault of Permanent Traits",
    description: "A permanent present trait impacting a specific past action.",
    hint: "If + were + adjective, subject + would have + past participle.",
    targetOrder: ["If he were not", "so recklessly confident,", "he would have heeded", "the guide's warning."],
    scrambled: ["he would have heeded", "so recklessly confident,", "If he were not", "the guide's warning."]
  },
  {
    roomId: 3,
    type: "assembly",
    category: "Clefting for Band 8.0+",
    title: "The Focus Sanctum",
    description: "Construct an advanced introductory 'It-cleft' sentence.",
    hint: "It was + noun phrase + that/who + verb phrase.",
    targetOrder: ["It was", "the lack of fresh water", "that ultimately forced", "the team to retreat."],
    scrambled: ["that ultimately forced", "the lack of fresh water", "the team to retreat.", "It was"]
  },
  {
    roomId: 4,
    type: "boss",
    category: "Boss Battle: The Syntax Lich",
    title: "The Syntax Lich (IELTS Trial)",
    bossName: "The Syntax Lich",
    bossEmoji: "💀",
    bossMaxHp: 3,
    description: "Neutralise the Lich's corrupted grammatical traps before your torch burns out!",
    attacks: [
      {
        segments: [
          "If the government",
          "would invest more funds",
          "in green energy,",
          "pollution would decrease",
          "substantially."
        ],
        errorIndex: 1, // "would invest more funds" in if-clause
        options: [
          "invested more funds",
          "had invested more funds",
          "should have invested more funds"
        ],
        correctOption: "invested more funds",
        explanation: "In second conditionals, the if-clause takes the past simple ('invested'), never 'would'."
      },
      {
        segments: [
          "The committee",
          "demanded that",
          "the project leader",
          "submits a full report",
          "by dawn."
        ],
        errorIndex: 3, // "submits a full report" -> subjunctive base form
        options: [
          "submit a full report",
          "must submit a full report",
          "submitted a full report"
        ],
        correctOption: "submit a full report",
        explanation: "Verbs of demand/insistence (demand, insist, mandate) take the subjunctive base form: 'that he submit'."
      },
      {
        segments: [
          "There are",
          "less opportunities",
          "for candidates",
          "who lack",
          "C1 English certifications."
        ],
        errorIndex: 1, // "less opportunities" -> countable noun requires "fewer"
        options: [
          "fewer opportunities",
          "lesser opportunities",
          "few opportunities"
        ],
        correctOption: "fewer opportunities",
        explanation: "'Opportunities' is a countable noun, which strictly requires 'fewer', not 'less'."
      }
    ]
  }
];

// 4. BOSS TRIAL / GAUNTLET (?level=boss-trial)
const bossTrialFloors = [
  mainCampaignFloors[4], // Goblin of Gerunds
  caeInversionFloors[4],  // Inquisitor of Inversion
  mainCampaignFloors[9]   // The Syntax Lich
];

// Helper to load appropriate dungeon by query parameter or default
function getCryptFloorsForLevel(levelParam) {
  if (levelParam === "cae-inversion") return caeInversionFloors;
  if (levelParam === "mixed-conditionals") return mixedConditionalsFloors;
  if (levelParam === "boss-trial") return bossTrialFloors;
  return mainCampaignFloors;
}
