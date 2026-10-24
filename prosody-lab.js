/* ==========================================================================
   Gareth English — Acoustic Shadowing & Prosody Lab (prosody-lab.js)
   Zero-dependency Web Audio API + Web Speech API C1/C2 Reformulation Simulator
   ========================================================================== */
(function () {
  'use strict';

  const DRILLS = [
    {
      id: 'boardroom-inversion',
      num: '01',
      context: 'Executive Boardroom • Negative Inversion',
      limpB1: 'I think we should delay the launch because it’s too risky.',
      targetKeys: ['UNDER NO CIRCUMSTANCES', 'ILL-ADVISED'],
      requiredMatches: ['under no circumstances'],
      bonusMatches: ['ill-advised', 'ill advised', 'premature', 'proceed', 'commercially', 'should we'],
      modelC2: 'Under no circumstances should we proceed with a premature launch; doing so would be commercially ill-advised.',
      stressGuide: 'UN-der NO CIR-cum-stan-ces... COM-mer-cially ILL-ad-VISED',
      stressSyllablesFull: 'UN-der NO CIR-cum-stan-ces should we pro-CEED with a pre-ma-TURE LAUNCH; DO-ing so would be com-MER-cial-ly ILL-ad-VISED.',
      rhythmChunks: [
        'UN-der NO',
        'CIR-cum-stan-ces',
        'should we pro-CEED',
        'with a pre-ma-TURE LAUNCH;',
        'DO-ing so would be',
        'COM-mer-cially',
        'ILL-ad-VISED.'
      ],
      peaks: [
        { pos: 0.09, amp: 0.88, label: 'UN-der' },
        { pos: 0.19, amp: 0.96, label: 'NO' },
        { pos: 0.31, amp: 0.90, label: 'CIR-cum-stan-ces' },
        { pos: 0.47, amp: 0.76, label: 'pro-CEED' },
        { pos: 0.61, amp: 0.85, label: 'LAUNCH' },
        { pos: 0.77, amp: 0.84, label: 'COM-mer-cially' },
        { pos: 0.91, amp: 0.95, label: 'ILL-ad-VISED' }
      ],
      garethTip: 'Anchor your vocal pitch on "UN-der NO CIR-cum-stan-ces" and trigger the auxiliary inversion ("should we proceed") without hesitation. Pause 250ms at the semicolon before landing firmly on "ILL-ad-VISED".'
    },
    {
      id: 'ielts-part3-hedging',
      num: '02',
      context: 'IELTS Part 3 Hedging • Impersonal Passive Reporting',
      limpB1: 'Everyone knows that social media makes teenagers less focused.',
      targetKeys: ['WIDELY BELIEVED TO', 'ATTENTION SPAN'],
      requiredMatches: ['widely believed to'],
      bonusMatches: ['attention span', 'attention spans', 'erode', 'algorithmic', 'adolescent'],
      modelC2: 'Algorithmic feeds are widely believed to erode adolescent attention spans.',
      stressGuide: 'Al-go-RITH-mic FEEDS... WIDE-ly be-LIEVED to e-RODE... at-TEN-tion SPANS',
      stressSyllablesFull: 'Al-go-RITH-mic FEEDS are WIDE-ly be-LIEVED to e-RODE ad-o-LES-cent at-TEN-tion SPANS.',
      rhythmChunks: [
        'Al-go-RITH-mic FEEDS',
        'are WIDE-ly',
        'be-LIEVED to',
        'e-RODE',
        'ad-o-LES-cent',
        'at-TEN-tion SPANS.'
      ],
      peaks: [
        { pos: 0.13, amp: 0.86, label: 'RITH-mic FEEDS' },
        { pos: 0.31, amp: 0.92, label: 'WIDE-ly' },
        { pos: 0.45, amp: 0.88, label: 'be-LIEVED' },
        { pos: 0.60, amp: 0.91, label: 'e-RODE' },
        { pos: 0.75, amp: 0.80, label: 'ad-o-LES-cent' },
        { pos: 0.90, amp: 0.94, label: 'at-TEN-tion SPANS' }
      ],
      garethTip: 'In IELTS Speaking Part 3, sweep away sweeping generalisations ("Everyone knows...") with an impersonal passive reporting frame ("are widely believed to erode"). Keep articles and auxiliary verbs unstressed so the content nouns carry the weight.'
    },
    {
      id: 'cleft-emphasis',
      num: '03',
      context: 'Cleft Emphasis • Structural Contrast Pivot',
      limpB1: 'The main problem isn’t the budget, it’s the lack of clear leadership.',
      targetKeys: ['WHAT UNDERMINES'],
      requiredMatches: ['what undermines', 'what truly undermines'],
      bonusMatches: ['budgetary', 'constraint', 'decisive', 'leadership', 'is not'],
      modelC2: 'What truly undermines the project is not budgetary constraint, but a lack of decisive leadership.',
      stressGuide: 'WHAT TRU-ly un-der-MINES... NOT con-STRAINT... de-CI-sive LEAD-er-ship',
      stressSyllablesFull: 'WHAT TRU-ly un-der-MINES the PRO-ject is NOT bud-get-a-ry con-STRAINT, but a LACK of de-CI-sive LEAD-er-ship.',
      rhythmChunks: [
        'WHAT TRU-ly',
        'un-der-MINES the PRO-ject',
        'is NOT',
        'bud-get-a-ry con-STRAINT,',
        'but a LACK of',
        'de-CI-sive LEAD-er-ship.'
      ],
      peaks: [
        { pos: 0.10, amp: 0.88, label: 'WHAT TRU-ly' },
        { pos: 0.25, amp: 0.94, label: 'un-der-MINES' },
        { pos: 0.39, amp: 0.78, label: 'PRO-ject' },
        { pos: 0.56, amp: 0.91, label: 'NOT con-STRAINT' },
        { pos: 0.76, amp: 0.86, label: 'de-CI-sive' },
        { pos: 0.91, amp: 0.95, label: 'LEAD-er-ship' }
      ],
      garethTip: 'A Wh-cleft ("What truly undermines the project is...") gathers rhetorical tension before the verb BE. Use a slight rising intonation on "constraint," before dropping decisively on "LEAD-er-ship".'
    },
    {
      id: 'participle-consequence',
      num: '04',
      context: 'Participle Consequence • Resultative -ing Clause',
      limpB1: 'The central bank raised interest rates, and this slowed down local investment.',
      targetKeys: ['THEREBY CURBING'],
      requiredMatches: ['thereby curbing'],
      bonusMatches: ['tightened', 'monetary policy', 'speculative', 'local investment', 'investment'],
      modelC2: 'The central bank tightened monetary policy, thereby curbing speculative local investment.',
      stressGuide: 'TIGH-tened MON-e-ta-ry POL-i-cy... THERE-by CUR-bing... in-VEST-ment',
      stressSyllablesFull: 'The CEN-tral BANK TIGH-tened MON-e-ta-ry POL-i-cy, THERE-by CUR-bing SPEC-u-la-tive LO-cal in-VEST-ment.',
      rhythmChunks: [
        'The CEN-tral BANK',
        'TIGH-tened',
        'MON-e-ta-ry POL-i-cy,',
        'THERE-by CUR-bing',
        'SPEC-u-la-tive',
        'LO-cal in-VEST-ment.'
      ],
      peaks: [
        { pos: 0.12, amp: 0.82, label: 'CEN-tral BANK' },
        { pos: 0.28, amp: 0.90, label: 'TIGH-tened' },
        { pos: 0.44, amp: 0.86, label: 'MON-e-tary POL-icy' },
        { pos: 0.64, amp: 0.95, label: 'THERE-by CUR-bing' },
        { pos: 0.80, amp: 0.84, label: 'SPEC-u-la-tive' },
        { pos: 0.92, amp: 0.91, label: 'in-VEST-ment' }
      ],
      garethTip: 'Replace clumsy ", and this..." coordinate chains with a resultative participle clause (", thereby curbing..."). Let the comma act as a clean pivot before stressing "THERE-by CUR-bing".'
    },
    {
      id: 'diplomatic-pushback',
      num: '05',
      context: 'Diplomatic Pushback • Executive Register Upgrade',
      limpB1: 'I disagree with your timeline because we don’t have enough staff.',
      targetKeys: ['REALISTICALLY FEASIBLE'],
      requiredMatches: ['realistically feasible'],
      bonusMatches: ['given our', 'staffing constraints', 'constraints', 'question whether', 'timeline'],
      modelC2: 'Given our current staffing constraints, I question whether that timeline is realistically feasible.',
      stressGuide: 'GIV-en... STAF-fing con-STRAINTS... QUES-tion... re-a-LIS-ti-cally FEA-si-ble',
      stressSyllablesFull: 'GIV-en our CUR-rent STAF-fing con-STRAINTS, I QUES-tion whe-ther that TIME-line is re-a-LIS-ti-cally FEA-si-ble.',
      rhythmChunks: [
        'GIV-en our CUR-rent',
        'STAF-fing con-STRAINTS,',
        'I QUES-tion whe-ther',
        'that TIME-line is',
        're-a-LIS-ti-cally',
        'FEA-si-ble.'
      ],
      peaks: [
        { pos: 0.10, amp: 0.82, label: 'GIV-en' },
        { pos: 0.28, amp: 0.90, label: 'STAF-fing con-STRAINTS' },
        { pos: 0.50, amp: 0.88, label: 'I QUES-tion' },
        { pos: 0.68, amp: 0.84, label: 'TIME-line' },
        { pos: 0.82, amp: 0.92, label: 're-a-LIS-ti-cally' },
        { pos: 0.93, amp: 0.96, label: 'FEA-si-ble' }
      ],
      garethTip: 'Blunt refusal ("I disagree...") sounds confrontational in British boardrooms. Front the constraint ("Given our current staffing constraints,") and frame the pushback as an objective inquiry ("I question whether... is realistically feasible").'
    }
  ];

  const CHALLENGE_DURATION_MS = 8000;

  let currentDrillIndex = 0;
  let isRecording = false;
  let isSpeakingModel = false;
  let fallbackMode = false;
  let recordStartTime = 0;
  let modelStartTime = 0;
  let rafId = null;
  let timerIntervalId = null;

  // Web Audio & Mic state
  let audioCtx = null;
  let analyser = null;
  let micStream = null;
  let micSource = null;
  let freqData = null;
  let timeData = null;

  // SpeechRecognition state
  let recognition = null;
  let liveTranscript = '';
  let interimTranscript = '';

  // Envelope history across the 8.0s window (160 buckets)
  const ENVELOPE_BUCKETS = 160;
  let studentEnvelope = new Float32Array(ENVELOPE_BUCKETS);
  let rhythmTapIndex = 0;
  let synthPulseEnergy = 0;

  function hasSpeechRecognitionSupport() {
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  function injectScopedStyles() {
    if (document.getElementById('prosody-lab-scoped-css')) return;
    const style = document.createElement('style');
    style.id = 'prosody-lab-scoped-css';
    style.textContent = `
      .prosody-shell {
        background: linear-gradient(165deg, rgba(11, 17, 36, 0.96) 0%, rgba(5, 8, 20, 0.99) 100%);
        border: 1px solid rgba(56, 189, 248, 0.28);
        border-radius: 1.5rem;
        box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.85), 0 0 40px rgba(14, 165, 233, 0.1);
        overflow: hidden;
      }
      .prosody-canvas-wrap {
        position: relative;
        background: radial-gradient(circle at 50% 50%, rgba(14, 165, 233, 0.08), rgba(2, 6, 23, 0.98) 75%);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 1rem;
        overflow: hidden;
      }
      .prosody-mic-btn {
        transition: all 0.2s ease;
      }
      .prosody-mic-btn.is-recording {
        background: #ef4444 !important;
        color: #ffffff !important;
        box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.28), 0 10px 25px rgba(239, 68, 68, 0.4);
        animation: prosodyMicPulse 1.2s infinite ease-in-out;
      }
      @keyframes prosodyMicPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @media (prefers-reduced-motion: reduce) {
        .prosody-mic-btn.is-recording {
          animation: none !important;
        }
      }
      .prosody-drill-tab {
        transition: all 0.18s ease;
        cursor: pointer;
      }
      .prosody-drill-tab.is-active {
        background: rgba(14, 165, 233, 0.22);
        border-color: #38bdf8;
        color: #ffffff;
        box-shadow: 0 0 16px rgba(56, 189, 248, 0.2);
      }
      .prosody-rhythm-chip {
        transition: all 0.15s ease;
        cursor: pointer;
        user-select: none;
      }
      .prosody-rhythm-chip:hover {
        border-color: #f59e0b;
        background: rgba(245, 158, 11, 0.18);
      }
      .prosody-rhythm-chip.is-hit {
        border-color: #10b981;
        background: rgba(16, 185, 129, 0.22);
        color: #d1fae5;
      }
      details.young-learners-quarantine > summary {
        list-style: none;
        cursor: pointer;
      }
      details.young-learners-quarantine > summary::-webkit-details-marker {
        display: none;
      }
      details.young-learners-quarantine[open] > summary .quarantine-chevron {
        transform: rotate(180deg);
      }
    `;
    document.head.appendChild(style);
  }

  function renderUI(mount) {
    injectScopedStyles();
    if (!hasSpeechRecognitionSupport()) {
      fallbackMode = true;
    }

    mount.innerHTML = `
      <div class="prosody-shell p-6 sm:p-9">
        <!-- Top Bar: Status Badge & Mode Switcher -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/90">
          <div class="flex flex-wrap items-center gap-2">
            <span id="prosody-engine-badge" class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>${fallbackMode ? 'Tap-rhythm & typing mode ready' : 'Microphone & speech recognition ready'}</span>
            </span>
            <span class="text-xs text-slate-300">Pick one of the 5 sentences below:</span>
          </div>

          <!-- Mode Switcher (Live Mic vs Simulated Rhythm Tap / Type Fallback) -->
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button type="button" id="prosody-mode-toggle-btn" class="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition cursor-pointer flex items-center gap-2">
              <i class="fa-solid fa-sliders text-sky-400" aria-hidden="true"></i>
              <span id="prosody-mode-toggle-label">${fallbackMode ? 'Switch to microphone mode' : 'In a quiet room? Tap rhythm or type instead'}</span>
            </button>
          </div>
        </div>

        <!-- 5 Drill Selector Tabs -->
        <div class="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-6" role="tablist" aria-label="Select speaking practice sentence">
          ${DRILLS.map((d, idx) => `
            <button type="button" role="tab" id="prosody-tab-${idx}" aria-selected="${idx === 0 ? 'true' : 'false'}" data-drill-idx="${idx}"
              class="prosody-drill-tab ${idx === 0 ? 'is-active' : ''} text-left p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
              <div class="flex items-center justify-between text-xs text-sky-300 font-bold mb-1">
                <span>Sentence ${d.num}</span>
                <span class="text-amber-300">C1/C2</span>
              </div>
              <div class="text-xs font-extrabold text-white truncate">${d.context.split('•')[0].trim()}</div>
              <div class="text-xs text-slate-400 truncate mt-0.5">${d.targetKeys[0]}</div>
            </button>
          `).join('')}
        </div>

        <!-- Main 2-Column Workbench -->
        <div class="grid lg:grid-cols-12 gap-7 items-start">

          <!-- Left Column (5 cols): Everyday Sentence, Target Key Prompt, Stress Guide & Model Reveal -->
          <div class="lg:col-span-5 space-y-4">
            <!-- Everyday Sentence Card -->
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-rose-500/30 space-y-2">
              <div class="flex items-center justify-between gap-2">
                <span id="prosody-drill-context" class="text-xs font-bold text-rose-300">
                  Sentence 01 / 05 • Executive Boardroom
                </span>
                <span class="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  Everyday phrasing
                </span>
              </div>
              <p id="prosody-limp-sentence" class="text-base sm:text-lg font-bold text-slate-200 italic leading-snug">
                “I think we should delay the launch because it’s too risky.”
              </p>
            </div>

            <!-- Target Key Structural Anchor -->
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-amber-500/40 space-y-3">
              <div class="flex items-center justify-between gap-2">
                <span class="text-xs font-extrabold text-amber-300">
                  <i class="fa-solid fa-key mr-1" aria-hidden="true"></i> Key phrase to include
                </span>
                <span class="text-xs text-slate-300">Keep these words unchanged</span>
              </div>
              <div id="prosody-target-keys" class="flex flex-wrap gap-2">
                <!-- Populated dynamically -->
              </div>

              <div class="pt-2 border-t border-slate-800/90 space-y-1.5">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-sky-300">Syllables to stress:</span>
                  <span class="text-xs text-amber-300">CAPITALS = main stress</span>
                </div>
                <div id="prosody-stress-guide" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-200 leading-relaxed">
                  UN-der NO CIR-cum-stan-ces... COM-mer-cially ILL-ad-VISED
                </div>
              </div>
            </div>

            <!-- Listen to Model Sentence + Reveal Model Box -->
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
              <div class="flex flex-wrap items-center gap-2.5">
                <button type="button" id="prosody-hear-model-btn" class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition cursor-pointer">
                  <i class="fa-solid fa-volume-high" aria-hidden="true"></i>
                  <span id="prosody-hear-model-label">🔊 Listen to clip (synthetic voice)</span>
                </button>
                <button type="button" id="prosody-reveal-model-btn" class="px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer">
                  👁️ Show answer
                </button>
              </div>

              <div id="prosody-model-reveal-box" class="hidden p-3.5 rounded-xl bg-slate-900/95 border border-amber-500/35 space-y-2">
                <div class="text-xs font-bold text-amber-300">Model C1/C2 sentence:</div>
                <p id="prosody-model-text" class="text-sm font-extrabold text-white leading-relaxed"></p>
                <div id="prosody-model-syllables" class="text-xs font-mono text-sky-300 leading-relaxed"></div>
                <p id="prosody-gareth-tip" class="text-xs text-slate-300 pt-1.5 border-t border-slate-800 leading-relaxed"></p>
              </div>
            </div>
          </div>

          <!-- Right Column (7 cols): Stress Rhythm Canvas + Record Controls + Evaluation -->
          <div class="lg:col-span-7 space-y-4">
            <div class="prosody-canvas-wrap p-4 sm:p-5">
              <!-- Topbar -->
              <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2.5">
                  <span id="prosody-status-dot" class="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
                  <span id="prosody-status-text" class="text-xs font-bold text-sky-300" aria-live="polite">
                    Ready • 8-second practice window
                  </span>
                </div>
                <div class="flex items-center gap-3 text-xs">
                  <span class="inline-flex items-center gap-1.5 text-amber-300">
                    <span class="w-3 h-0.5 bg-amber-400 inline-block"></span> Target stress
                  </span>
                  <span class="inline-flex items-center gap-1.5 text-sky-300">
                    <span class="w-3 h-0.5 bg-sky-400 inline-block"></span> Your voice
                  </span>
                  <span id="prosody-timer-readout" class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-white font-mono font-bold">
                    0.0s / 8.0s
                  </span>
                </div>
              </div>

              <!-- HTML5 Waveform & Stress Rhythm Canvas -->
              <div class="relative w-full h-52 sm:h-60 rounded-xl overflow-hidden bg-slate-950/90 border border-slate-800/90">
                <canvas id="prosody-waveform-canvas" width="760" height="240" class="w-full h-full block" aria-label="Rhythm and word-stress comparison chart"></canvas>
              </div>

              <!-- Action Controls Row -->
              <div class="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button type="button" id="prosody-record-btn" class="prosody-mic-btn flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-sky-500/25 cursor-pointer">
                  <i class="fa-solid fa-microphone" id="prosody-record-icon" aria-hidden="true"></i>
                  <span id="prosody-record-label">🎙️ Record yourself and compare (8s)</span>
                </button>
                <button type="button" id="prosody-demo-fill-btn" class="px-4 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-bold transition cursor-pointer whitespace-nowrap">
                  ⚡ See a sample attempt
                </button>
              </div>

              <!-- Plain-language Speech Recognition Privacy & Browser Note -->
              <p class="mt-2.5 text-xs text-slate-400 leading-relaxed">
                To turn your speech into text, your browser may send the audio to its provider. Chrome does this, and Firefox doesn’t support it (in Firefox, you can tap the rhythm buttons below or type your sentence). See the <a href="privacy-policy.html" class="underline text-slate-300 hover:text-white">Privacy Policy</a>.
              </p>

              <!-- Interactive Rhythm-Tap Pads (Always accessible for tactile stress-timing or Fallback Mode) -->
              <div id="prosody-rhythm-box" class="mt-4 pt-3.5 border-t border-slate-800/80 space-y-2">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-bold text-slate-300">
                    <i class="fa-solid fa-drum text-amber-400 mr-1.5" aria-hidden="true"></i>
                    Or tap the stressed chunks in rhythm:
                  </span>
                  <button type="button" id="prosody-clear-btn" class="text-xs text-slate-400 hover:text-white underline cursor-pointer">
                    Start over
                  </button>
                </div>
                <div id="prosody-rhythm-pads" class="flex flex-wrap gap-1.5">
                  <!-- Populated dynamically -->
                </div>
              </div>
            </div>

            <!-- Live Speech Recognition Transcript / Editable Reformulation Box -->
            <div class="p-4 sm:p-5 rounded-2xl bg-slate-900/95 border border-slate-800 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <label for="prosody-transcript-input" class="text-xs font-bold text-sky-300">
                  <i class="fa-solid fa-microphone-lines mr-1" aria-hidden="true"></i>
                  Your spoken or typed sentence:
                </label>
                <span class="text-xs text-slate-400">
                  You can also type or edit your answer directly below
                </span>
              </div>
              <div class="flex flex-col sm:flex-row gap-2.5">
                <input type="text" id="prosody-transcript-input" spellcheck="false" autocomplete="off"
                  placeholder="Speak into your microphone, tap the rhythm chunks above, or type your sentence..."
                  class="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-sky-400" />
                <button type="button" id="prosody-evaluate-btn" class="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-md transition cursor-pointer whitespace-nowrap">
                  ✓ Check my sentence
                </button>
              </div>
            </div>

            <!-- Instant Feedback Output -->
            <div id="prosody-score-card" aria-live="polite" class="hidden p-5 rounded-2xl bg-slate-950 border border-emerald-500/45 shadow-xl space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div class="flex items-center gap-2.5">
                  <span id="prosody-band-pill" class="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    Band 8.5 / C2
                  </span>
                  <span id="prosody-dossier-sync-badge" class="text-xs text-sky-300">
                    ✓ Saved to your practice log
                  </span>
                </div>
                <span id="prosody-metrics-readout" class="text-xs text-slate-300">
                  Key phrase included • Time: 6.2s
                </span>
              </div>
              <p id="prosody-feedback-copy" class="text-xs sm:text-sm text-slate-200 leading-relaxed"></p>
            </div>

          </div>
        </div>
      </div>
    `;
  }

  function getActiveDrill() {
    return DRILLS[currentDrillIndex] || DRILLS[0];
  }

  function resetEnvelope() {
    studentEnvelope.fill(0);
    rhythmTapIndex = 0;
    synthPulseEnergy = 0;
  }

  function populateDrill(index) {
    stopAllActiveProcesses();
    currentDrillIndex = ((index % DRILLS.length) + DRILLS.length) % DRILLS.length;
    const drill = getActiveDrill();
    resetEnvelope();

    document.querySelectorAll('.prosody-drill-tab').forEach((btn, idx) => {
      const active = idx === currentDrillIndex;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });

    const ctxEl = document.getElementById('prosody-drill-context');
    const limpEl = document.getElementById('prosody-limp-sentence');
    const keysEl = document.getElementById('prosody-target-keys');
    const guideEl = document.getElementById('prosody-stress-guide');
    const modelBox = document.getElementById('prosody-model-reveal-box');
    const modelText = document.getElementById('prosody-model-text');
    const modelSyl = document.getElementById('prosody-model-syllables');
    const tipEl = document.getElementById('prosody-gareth-tip');
    const padsEl = document.getElementById('prosody-rhythm-pads');
    const inputEl = document.getElementById('prosody-transcript-input');
    const scoreCard = document.getElementById('prosody-score-card');

    if (ctxEl) ctxEl.textContent = `Sentence ${drill.num} / 05 • ${drill.context}`;
    if (limpEl) limpEl.textContent = `“${drill.limpB1}”`;
    if (guideEl) guideEl.textContent = drill.stressGuide;
    if (modelText) modelText.textContent = `“${drill.modelC2}”`;
    if (modelSyl) modelSyl.textContent = `Stress map: ${drill.stressSyllablesFull}`;
    if (tipEl) tipEl.textContent = `Tip: ${drill.garethTip}`;
    if (modelBox) modelBox.classList.add('hidden');
    if (inputEl) inputEl.value = '';
    if (scoreCard) scoreCard.classList.add('hidden');

    if (keysEl) {
      keysEl.innerHTML = drill.targetKeys
        .map(
          (k) =>
            `<span class="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-200 font-mono text-xs font-extrabold tracking-wide">${k}</span>`
        )
        .join('<span class="text-slate-500 font-mono text-xs self-center">+</span>');
    }

    if (padsEl) {
      padsEl.innerHTML = '';
      drill.rhythmChunks.forEach((chunk, cIdx) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className =
          'prosody-rhythm-chip px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-slate-200';
        chip.textContent = chunk;
        chip.addEventListener('click', () => handleRhythmChunkTap(cIdx, chunk, chip));
        padsEl.appendChild(chip);
      });
    }

    updateStatus('Ready • 8-second practice window', 'sky');
    updateTimerDisplay(0);
    drawCanvasFrame(0);
  }

  function updateStatus(text, color) {
    const statusText = document.getElementById('prosody-status-text');
    const statusDot = document.getElementById('prosody-status-dot');
    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (statusText) statusText.textContent = text;
    if (statusDot) {
      statusDot.className =
        color === 'red'
          ? `w-2.5 h-2.5 rounded-full bg-rose-500${reducedMotion ? '' : ' animate-ping'}`
          : color === 'amber'
          ? `w-2.5 h-2.5 rounded-full bg-amber-400${reducedMotion ? '' : ' animate-pulse'}`
          : color === 'emerald'
          ? 'w-2.5 h-2.5 rounded-full bg-emerald-400'
          : 'w-2.5 h-2.5 rounded-full bg-sky-400';
    }
  }

  function updateTimerDisplay(elapsedMs) {
    const el = document.getElementById('prosody-timer-readout');
    if (!el) return;
    const clamped = Math.min(CHALLENGE_DURATION_MS, Math.max(0, elapsedMs));
    el.textContent = `${(clamped / 1000).toFixed(1)}s / 8.0s`;
  }

  function injectSyntheticEnvelopePeak(normPos, amplitude) {
    const centerBucket = Math.floor(normPos * (ENVELOPE_BUCKETS - 1));
    const radius = 7;
    for (let i = -radius; i <= radius; i++) {
      const idx = centerBucket + i;
      if (idx >= 0 && idx < ENVELOPE_BUCKETS) {
        const falloff = Math.cos((i / (radius + 1)) * (Math.PI / 2));
        const val = Math.min(0.98, amplitude * falloff);
        if (val > studentEnvelope[idx]) {
          studentEnvelope[idx] = val;
        }
      }
    }
    synthPulseEnergy = Math.max(synthPulseEnergy, amplitude);
  }

  function handleRhythmChunkTap(chunkIdx, chunkText, chipEl) {
    const drill = getActiveDrill();
    if (chipEl) chipEl.classList.add('is-hit');

    // Clean syllable hyphens and restore normal casing from model sentence or chunk
    const totalChunks = drill.rhythmChunks.length;
    const normPos = (chunkIdx + 0.5) / totalChunks;
    const peakMatch = drill.peaks[Math.min(chunkIdx, drill.peaks.length - 1)];
    const targetAmp = peakMatch ? peakMatch.amp : 0.85;

    injectSyntheticEnvelopePeak(normPos, targetAmp);

    // Append to input or build the model sentence progressively
    const inputEl = document.getElementById('prosody-transcript-input');
    if (inputEl) {
      rhythmTapIndex = Math.max(rhythmTapIndex, chunkIdx + 1);
      if (rhythmTapIndex >= totalChunks) {
        inputEl.value = drill.modelC2;
      } else {
        const words = drill.modelC2.split(/\s+/);
        const sliceCount = Math.ceil((rhythmTapIndex / totalChunks) * words.length);
        inputEl.value = words.slice(0, sliceCount).join(' ');
      }
    }

    playSynthClick(440 + chunkIdx * 55);
    drawCanvasFrame(normPos);
  }

  function playSynthClick(freq) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 0.065);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  function targetCurveAt(normX, peaks) {
    let val = 0.14;
    for (let i = 0; i < peaks.length; i++) {
      const p = peaks[i];
      const dist = (normX - p.pos) / 0.055;
      val += (p.amp - 0.14) * Math.exp(-0.5 * dist * dist);
    }
    return Math.min(0.97, val);
  }

  function drawCanvasFrame(playheadProgress) {
    const canvas = document.getElementById('prosody-waveform-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const drill = getActiveDrill();

    ctx.clearRect(0, 0, W, H);

    // 1. Subtle Observatory Grid
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += W / 8) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = H * 0.25; y < H; y += H * 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    const baseLineY = H - 26;
    const usableH = H - 56;

    // 2. Target Stress Peaks Guide (Gold Envelope + Vertical Peak Pillars + Labels)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, baseLineY);
    for (let px = 0; px <= W; px += 4) {
      const normX = px / W;
      const amp = targetCurveAt(normX, drill.peaks);
      const y = baseLineY - amp * usableH;
      ctx.lineTo(px, y);
    }
    ctx.lineTo(W, baseLineY);
    ctx.closePath();
    const goldGrad = ctx.createLinearGradient(0, 20, 0, baseLineY);
    goldGrad.addColorStop(0, 'rgba(245, 158, 11, 0.22)');
    goldGrad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
    ctx.fillStyle = goldGrad;
    ctx.fill();

    // Dashed Gold Contour
    ctx.beginPath();
    ctx.setLineDash([5, 4]);
    for (let px = 0; px <= W; px += 4) {
      const normX = px / W;
      const amp = targetCurveAt(normX, drill.peaks);
      const y = baseLineY - amp * usableH;
      if (px === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.75)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // Peak Nodes & Syllable Callouts
    drill.peaks.forEach((p) => {
      const x = p.pos * W;
      const y = baseLineY - p.amp * usableH;
      const isHighlighted = playheadProgress > 0 && Math.abs(playheadProgress - p.pos) < 0.06;

      ctx.beginPath();
      ctx.arc(x, y, isHighlighted ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isHighlighted ? '#fde047' : '#f59e0b';
      ctx.fill();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      ctx.fillStyle = isHighlighted ? '#ffffff' : '#fde68a';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, x, Math.max(14, y - 9));
    });

    // 3. Student Recorded Vocal Stress Envelope (Sky Cyan Curve)
    ctx.save();
    ctx.beginPath();
    for (let b = 0; b < ENVELOPE_BUCKETS; b++) {
      const x = (b / (ENVELOPE_BUCKETS - 1)) * W;
      const y = baseLineY - studentEnvelope[b] * usableH;
      if (b === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.lineTo(W, baseLineY);
    ctx.lineTo(0, baseLineY);
    ctx.closePath();
    const cyanGrad = ctx.createLinearGradient(0, 20, 0, baseLineY);
    cyanGrad.addColorStop(0, 'rgba(56, 189, 248, 0.30)');
    cyanGrad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
    ctx.fillStyle = cyanGrad;
    ctx.fill();
    ctx.restore();

    // 4. Live 60fps Oscilloscope Waveform Overlay (When Recording or Simulating)
    if (isRecording || isSpeakingModel || synthPulseEnergy > 0.02) {
      ctx.save();
      ctx.beginPath();
      const midY = H * 0.55;
      if (analyser && timeData && !fallbackMode && isRecording) {
        analyser.getByteTimeDomainData(timeData);
        const sliceW = W / timeData.length;
        let x = 0;
        for (let i = 0; i < timeData.length; i++) {
          const v = (timeData[i] - 128) / 128.0;
          const y = midY + v * (usableH * 0.45);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceW;
        }
      } else {
        // Synthesized live acoustic wave for Fallback / Model Cadence playback
        const now = performance.now() * 0.012;
        const envEnergy = isSpeakingModel
          ? targetCurveAt(playheadProgress, drill.peaks)
          : Math.max(0.25, synthPulseEnergy);
        for (let x = 0; x <= W; x += 5) {
          const wave =
            Math.sin(x * 0.045 + now) *
            Math.cos(x * 0.018 - now * 0.7) *
            envEnergy *
            (usableH * 0.28);
          const y = midY + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
      }
      ctx.strokeStyle = isSpeakingModel ? 'rgba(251, 191, 36, 0.85)' : 'rgba(16, 185, 129, 0.85)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
      synthPulseEnergy *= 0.92;
    }

    // 5. Playhead Sweep Line
    if (playheadProgress > 0 && playheadProgress <= 1) {
      const playX = playheadProgress * W;
      ctx.save();
      ctx.strokeStyle = isSpeakingModel ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(playX, 0);
      ctx.lineTo(playX, baseLineY);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Bottom Time Axis Labels (0.0s -> 8.0s)
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0.0s', 6, H - 8);
    ctx.textAlign = 'center';
    ctx.fillText('2.0s', W * 0.25, H - 8);
    ctx.fillText('4.0s', W * 0.5, H - 8);
    ctx.fillText('6.0s', W * 0.75, H - 8);
    ctx.textAlign = 'right';
    ctx.fillText('8.0s', W - 6, H - 8);
  }

  function sampleLiveMicAmplitude(normProgress) {
    const bucketIdx = Math.min(
      ENVELOPE_BUCKETS - 1,
      Math.max(0, Math.floor(normProgress * (ENVELOPE_BUCKETS - 1)))
    );

    if (analyser && freqData && !fallbackMode) {
      analyser.getByteFrequencyData(freqData);
      let sum = 0;
      const vocalBins = Math.min(64, freqData.length);
      for (let i = 2; i < vocalBins; i++) {
        sum += freqData[i];
      }
      const avg = sum / (vocalBins - 2);
      const normAmp = Math.min(0.98, (avg / 145) * 1.15);
      studentEnvelope[bucketIdx] = Math.max(studentEnvelope[bucketIdx], normAmp);
    } else if (fallbackMode && isRecording) {
      // In fallback simulated mic mode, trace the target curve softly and boost on taps/typing
      const drill = getActiveDrill();
      const baseSim = targetCurveAt(normProgress, drill.peaks) * 0.78;
      studentEnvelope[bucketIdx] = Math.max(studentEnvelope[bucketIdx], baseSim);
    }
  }

  function startAnimationLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    const tick = () => {
      if (isRecording) {
        const elapsed = performance.now() - recordStartTime;
        const progress = Math.min(1, elapsed / CHALLENGE_DURATION_MS);
        updateTimerDisplay(elapsed);
        sampleLiveMicAmplitude(progress);
        drawCanvasFrame(progress);
        if (elapsed >= CHALLENGE_DURATION_MS) {
          finishRecordingSession();
          return;
        }
        rafId = requestAnimationFrame(tick);
      } else if (isSpeakingModel) {
        const elapsed = performance.now() - modelStartTime;
        const modelDur = 5800;
        const progress = Math.min(1, elapsed / modelDur);
        drawCanvasFrame(progress);
        if (elapsed >= modelDur) {
          isSpeakingModel = false;
          const lbl = document.getElementById('prosody-hear-model-label');
          if (lbl) lbl.textContent = '🔊 Listen to clip (synthetic voice)';
          updateStatus('Clip finished • Your turn', 'sky');
          drawCanvasFrame(0);
          return;
        }
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
  }

  async function startRecordingSession() {
    if (isRecording) {
      finishRecordingSession();
      return;
    }
    stopAllActiveProcesses();
    resetEnvelope();

    const recordBtn = document.getElementById('prosody-record-btn');
    const recordLbl = document.getElementById('prosody-record-label');
    const inputEl = document.getElementById('prosody-transcript-input');

    // Attempt Web Audio getUserMedia unless user explicitly toggled Fallback Mode
    if (!fallbackMode && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!audioCtx) audioCtx = new Ctx();
        if (audioCtx.state === 'suspended') await audioCtx.resume();
        micSource = audioCtx.createMediaStreamSource(micStream);
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.75;
        micSource.connect(analyser);
        freqData = new Uint8Array(analyser.frequencyBinCount);
        timeData = new Uint8Array(analyser.fftSize);
      } catch (err) {
        // Gracefully switch to Simulated Mic mode if permission declined or unavailable
        fallbackMode = true;
        syncModeBadge();
      }
    } else {
      fallbackMode = true;
      syncModeBadge();
    }

    // Attempt Web Speech API SpeechRecognition
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!fallbackMode && SpeechRec) {
      try {
        recognition = new SpeechRec();
        recognition.lang = 'en-GB';
        recognition.continuous = true;
        recognition.interimResults = true;
        liveTranscript = '';
        interimTranscript = '';

        recognition.onresult = (event) => {
          let finalStr = '';
          let interimStr = '';
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res.isFinal) finalStr += res[0].transcript + ' ';
            else interimStr += res[0].transcript;
          }
          liveTranscript = finalStr.trim();
          interimTranscript = interimStr.trim();
          if (inputEl) {
            inputEl.value = (liveTranscript + ' ' + interimTranscript).trim();
          }
        };
        recognition.onerror = () => {
          // Non-blocking fallback
        };
        recognition.start();
      } catch (e) {}
    }

    isRecording = true;
    recordStartTime = performance.now();
    if (recordBtn) recordBtn.classList.add('is-recording');
    if (recordLbl) {
      recordLbl.textContent = fallbackMode
        ? '⏹ Stop 8s window (tap chunks or type)'
        : '⏹ Stop & check (listening... 8s)';
    }
    updateStatus(
      fallbackMode
        ? 'Tap-rhythm mode active • Tap chunks or type below'
        : 'Listening • Speak your sentence now',
      'red'
    );

    startAnimationLoop();
  }

  function finishRecordingSession() {
    if (!isRecording) return;
    isRecording = false;
    const elapsedSec = Math.min(8.0, Math.max(1.2, (performance.now() - recordStartTime) / 1000));

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {}
      recognition = null;
    }
    if (micStream) {
      micStream.getTracks().forEach((t) => t.stop());
      micStream = null;
    }

    const recordBtn = document.getElementById('prosody-record-btn');
    const recordLbl = document.getElementById('prosody-record-label');
    if (recordBtn) recordBtn.classList.remove('is-recording');
    if (recordLbl) recordLbl.textContent = '🎙️ Record yourself and compare (8s)';

    const inputEl = document.getElementById('prosody-transcript-input');
    const drill = getActiveDrill();
    if (inputEl && !inputEl.value.trim() && fallbackMode) {
      inputEl.value = drill.modelC2;
    }

    drawCanvasFrame(0);
    evaluateCurrentAttempt(elapsedSec);
  }

  function stopAllActiveProcesses() {
    if (isRecording) {
      isRecording = false;
      if (recognition) {
        try {
          recognition.stop();
        } catch (e) {}
        recognition = null;
      }
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }
      const recordBtn = document.getElementById('prosody-record-btn');
      const recordLbl = document.getElementById('prosody-record-label');
      if (recordBtn) recordBtn.classList.remove('is-recording');
      if (recordLbl) recordLbl.textContent = '🎙️ Record yourself and compare (8s)';
    }
    if (isSpeakingModel) {
      isSpeakingModel = false;
      if ('speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {}
      }
      const lbl = document.getElementById('prosody-hear-model-label');
      if (lbl) lbl.textContent = '🔊 Listen to clip (synthetic voice)';
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      timerIntervalId = null;
    }
  }

  function playModelCadence() {
    if (isSpeakingModel) {
      stopAllActiveProcesses();
      updateStatus('Ready • 8-second practice window', 'sky');
      drawCanvasFrame(0);
      return;
    }
    stopAllActiveProcesses();
    const drill = getActiveDrill();
    isSpeakingModel = true;
    modelStartTime = performance.now();

    const lbl = document.getElementById('prosody-hear-model-label');
    if (lbl) lbl.textContent = '⏹ Stop clip';
    updateStatus('Playing model clip (synthetic voice)...', 'amber');

    if ('speechSynthesis' in window && typeof window.SpeechSynthesisUtterance === 'function') {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(drill.modelC2);
        utter.lang = 'en-GB';
        utter.rate = 0.94;
        utter.pitch = 0.96;

        const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
        const gbVoice =
          voices.find((v) => /en-GB/i.test(v.lang) && /Daniel|Arthur|George|Oliver|Google UK English Male/i.test(v.name)) ||
          voices.find((v) => /en-GB/i.test(v.lang));
        if (gbVoice) utter.voice = gbVoice;

        utter.onend = () => {
          isSpeakingModel = false;
          if (lbl) lbl.textContent = '🔊 Listen to clip (synthetic voice)';
          updateStatus('Clip finished • Your turn', 'sky');
          drawCanvasFrame(0);
        };
        window.speechSynthesis.speak(utter);
      } catch (e) {}
    }

    startAnimationLoop();
  }

  function simulateC2Attempt() {
    stopAllActiveProcesses();
    const drill = getActiveDrill();
    resetEnvelope();

    // Populate envelope with target stress peaks
    drill.peaks.forEach((p) => {
      injectSyntheticEnvelopePeak(p.pos, p.amp);
    });

    const inputEl = document.getElementById('prosody-transcript-input');
    if (inputEl) {
      inputEl.value = drill.modelC2;
    }

    document.querySelectorAll('.prosody-rhythm-chip').forEach((c) => c.classList.add('is-hit'));
    playSynthClick(660);
    setTimeout(() => playSynthClick(880), 80);

    drawCanvasFrame(1);
    evaluateCurrentAttempt(5.8);
  }

  function evaluateCurrentAttempt(durationSec = 5.6) {
    const drill = getActiveDrill();
    const inputEl = document.getElementById('prosody-transcript-input');
    const rawText = inputEl ? inputEl.value.trim() : '';
    const normText = rawText.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

    if (!normText) {
      updateStatus('Speak, tap the chunks, or type your sentence first', 'amber');
      return;
    }

    // 1. Check required target key presence
    const hasRequiredKey = drill.requiredMatches.some((req) => normText.includes(req.toLowerCase()));
    const matchedAllKeys = drill.targetKeys.every((k) =>
      normText.includes(k.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim())
    );

    // 2. Check bonus lexical upgrades
    let bonusHits = 0;
    drill.bonusMatches.forEach((bm) => {
      if (normText.includes(bm.toLowerCase())) bonusHits++;
    });

    // 3. Calculate prosody envelope activity
    let activeBuckets = 0;
    for (let i = 0; i < ENVELOPE_BUCKETS; i++) {
      if (studentEnvelope[i] > 0.2) activeBuckets++;
    }
    if (activeBuckets < 10) {
      // Synthesize envelope trace from typed words if user typed directly
      drill.peaks.forEach((p) => injectSyntheticEnvelopePeak(p.pos, p.amp * 0.85));
      drawCanvasFrame(0);
    }

    let bandNumeric = 6.5;
    let bandLabel = 'Band 6.5 / B2';
    let scorePct = 68;
    let feedbackHtml = '';

    if (matchedAllKeys && bonusHits >= 2) {
      bandNumeric = 8.5;
      bandLabel = 'Band 8.5 / C2';
      scorePct = 96;
      feedbackHtml = `<strong class="text-emerald-300">Spot on!</strong> You kept the exact key phrase (${drill.targetKeys.join(' + ')}), used natural C1/C2 phrasing around it, and delivered it in ${durationSec.toFixed(1)}s.`;
    } else if (hasRequiredKey || matchedAllKeys) {
      bandNumeric = 7.5;
      bandLabel = 'Band 7.5 / C1';
      scorePct = 84;
      feedbackHtml = `<strong class="text-sky-300">Good C1 structure!</strong> You used the key phrase (${drill.targetKeys[0]}). Compare yours with the model sentence: <em>“${drill.modelC2}”</em>.`;
    } else {
      bandNumeric = 6.5;
      bandLabel = 'Key phrase missing';
      scorePct = 62;
      feedbackHtml = `<strong class="text-amber-300">Watch the key phrase!</strong> Make sure you build your sentence around <code class="text-amber-200 font-mono">${drill.targetKeys.join(' / ')}</code> without changing the words. Click <strong>👁️ Show answer</strong> on the left to see the model sentence.`;
    }

    const scoreCard = document.getElementById('prosody-score-card');
    const bandPill = document.getElementById('prosody-band-pill');
    const metricsEl = document.getElementById('prosody-metrics-readout');
    const feedbackEl = document.getElementById('prosody-feedback-copy');

    if (scoreCard) scoreCard.classList.remove('hidden');
    if (bandPill) {
      bandPill.textContent = bandLabel;
      bandPill.className =
        bandNumeric >= 8.0
          ? 'px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
          : bandNumeric >= 7.5
          ? 'px-3 py-1 rounded-full text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-400/40'
          : 'px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-400/40';
    }
    if (metricsEl) {
      metricsEl.textContent = `Key phrase: ${matchedAllKeys ? 'Included' : hasRequiredKey ? 'Partial' : 'Missing'} • Time: ${durationSec.toFixed(1)}s`;
    }
    if (feedbackEl) {
      feedbackEl.innerHTML = feedbackHtml;
    }

    updateStatus(`Checked: ${bandLabel}`, bandNumeric >= 7.5 ? 'emerald' : 'amber');

    // Log attempt to CandidateDossier if present
    const payload = {
      category: 'prosody_cadence',
      drillId: drill.id,
      title: drill.context,
      targetKey: drill.targetKeys.join(' / '),
      band: bandNumeric,
      bandScore: bandNumeric,
      bandLabel: bandLabel,
      score: scorePct,
      maxScore: 100,
      passed: bandNumeric >= 7.5,
      transcript: rawText,
      durationSec: Number(durationSec.toFixed(1)),
      timestamp: new Date().toISOString()
    };

    try {
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt(payload);
      }
      window.dispatchEvent(new CustomEvent('dossier:attempt', { detail: payload }));
    } catch (e) {}
  }

  function syncModeBadge() {
    const badge = document.getElementById('prosody-engine-badge');
    const toggleLbl = document.getElementById('prosody-mode-toggle-label');
    if (badge) {
      badge.innerHTML = `
        <span class="w-2 h-2 rounded-full ${fallbackMode ? 'bg-amber-400' : 'bg-emerald-400'}"></span>
        <span>${fallbackMode ? 'Tap-rhythm & typing mode active' : 'Microphone & speech recognition ready'}</span>
      `;
    }
    if (toggleLbl) {
      toggleLbl.textContent = fallbackMode
        ? 'Switch to microphone mode'
        : 'In a quiet room? Tap rhythm or type instead';
    }
  }

  function bindEvents(mount) {
    // Drill tabs
    mount.querySelectorAll('.prosody-drill-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.getAttribute('data-drill-idx')) || 0;
        populateDrill(idx);
      });
    });

    // Mode toggle
    const modeBtn = document.getElementById('prosody-mode-toggle-btn');
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        stopAllActiveProcesses();
        fallbackMode = !fallbackMode;
        syncModeBadge();
        updateStatus(
          fallbackMode
            ? 'Tap-rhythm & typing mode enabled'
            : 'Microphone mode enabled',
          'sky'
        );
      });
    }

    // Hear Model Clip
    const hearBtn = document.getElementById('prosody-hear-model-btn');
    if (hearBtn) {
      hearBtn.addEventListener('click', playModelCadence);
    }

    // Reveal Model Answer
    const revealBtn = document.getElementById('prosody-reveal-model-btn');
    if (revealBtn) {
      revealBtn.addEventListener('click', () => {
        const box = document.getElementById('prosody-model-reveal-box');
        if (box) box.classList.toggle('hidden');
      });
    }

    // Record / Speak 8s Challenge
    const recBtn = document.getElementById('prosody-record-btn');
    if (recBtn) {
      recBtn.addEventListener('click', startRecordingSession);
    }

    // Simulate C2 Attempt
    const simBtn = document.getElementById('prosody-demo-fill-btn');
    if (simBtn) {
      simBtn.addEventListener('click', simulateC2Attempt);
    }

    // Clear trace
    const clearBtn = document.getElementById('prosody-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        stopAllActiveProcesses();
        resetEnvelope();
        const inputEl = document.getElementById('prosody-transcript-input');
        if (inputEl) inputEl.value = '';
        document.querySelectorAll('.prosody-rhythm-chip').forEach((c) => c.classList.remove('is-hit'));
        const scoreCard = document.getElementById('prosody-score-card');
        if (scoreCard) scoreCard.classList.add('hidden');
        updateStatus('Ready • 8-second practice window', 'sky');
        updateTimerDisplay(0);
        drawCanvasFrame(0);
      });
    }

    // Evaluate button & Enter key
    const evalBtn = document.getElementById('prosody-evaluate-btn');
    if (evalBtn) {
      evalBtn.addEventListener('click', () => evaluateCurrentAttempt(5.4));
    }
    const inputEl = document.getElementById('prosody-transcript-input');
    if (inputEl) {
      inputEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          evaluateCurrentAttempt(5.4);
        } else {
          // Typing also feeds a subtle acoustic pulse onto the waveform
          const len = inputEl.value.length;
          const normPos = Math.min(0.95, (len % 85) / 85);
          injectSyntheticEnvelopePeak(normPos, 0.72);
          drawCanvasFrame(normPos);
        }
      });
    }

    // Auto-expand Young Learners quarantine drawer if user clicks a Teen/Kids wing filter or hash link
    document.addEventListener('click', (e) => {
      const wingBtn = e.target.closest('[data-wing-btn="teens"], [data-wing-btn="kids"]');
      const hashLink = e.target.closest('a[href="#chronicle-88"], a[href="#professor-west"]');
      if (wingBtn || hashLink) {
        const drawer = document.querySelector('details.young-learners-quarantine');
        if (drawer) drawer.open = true;
      }
    });
  }

  function init() {
    const mount = document.getElementById('prosody-lab-mount');
    if (!mount) return;
    renderUI(mount);
    bindEvents(mount);
    populateDrill(0);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.ProsodyLab = {
    init,
    selectDrill: populateDrill,
    playModelCadence,
    simulateC2Attempt,
    evaluateCurrentAttempt,
    DRILLS
  };
})();
