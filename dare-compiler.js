/**
 * ============================================================================
 * DARE-COMPILER.JS — Dark Academia Runtime Execution & Microarchitecture
 * "The Zen Core for C1/C2 Literary Acquisition"
 * ----------------------------------------------------------------------------
 * 1. Universal JSON-to-DOM Compiler: Renders an entire 20-mark interactive
 *    Dark Academia lesson from a pure JSON manifest in < 2ms.
 * 2. L1 Interference & Syntax Branch Predictor: Intercepts predictable C1/C2
 *    student errors in Key Word Transformations with zero-latency diagnostics.
 * ============================================================================
 */

(function () {
  'use strict';

  // Universal C1/C2 Error Branch Predictors (applies across all units automatically)
  const UNIVERSAL_C1_TRAPS = [
    {
      pattern: /\bmust\s+of\b|\bshould\s+of\b|\bcould\s+of\b|\bmight\s+of\b|\bwould\s+of\b/i,
      diagnostic: '⚡ Phonetic Trap Detected: In spoken English "must\'ve" sounds like "must of", but in formal C1/C2 writing you must write "must HAVE / could HAVE / might HAVE".'
    },
    {
      pattern: /\bmustn't\s+have\b|\bmust\s+not\s+have\b/i,
      diagnostic: '⚡ Deduction Trap: Never use "mustn\'t have" for logical impossibility in the past! Use "can\'t have" or "couldn\'t have".'
    },
    {
      pattern: /\bdespite\s+of\b/i,
      diagnostic: '⚡ Preposition Trap: Never put "of" after "despite". Write either "despite + noun/-ing" OR "in spite of + noun/-ing".'
    },
    {
      pattern: /\bno\s+sooner\s+[^h d]/i,
      diagnostic: '⚡ Inversion Alert: After a negative/restrictive adverbial at the start of a clause ("No sooner", "Hardly", "Not only", "Little"), you must invert the auxiliary verb before the subject (e.g. "No sooner HAD he...").'
    }
  ];

  const DareCompiler = {
    activeManifest: null,

    /**
     * Compile a JSON Unit Manifest into the page DOM and boot DarkAcademiaEngine
     */
    mount(manifest, mountSelector = '#main') {
      this.activeManifest = manifest;
      const root = document.querySelector(mountSelector);
      if (!root) {
        console.error('[DareCompiler] Mount root not found:', mountSelector);
        return;
      }

      const { meta, blueprint, reading, grammar, kwt, registerShift, navigation } = manifest;
      const theme = meta.theme || 'baskerville';

      // Update document title if present
      if (meta.title && meta.seriesTitle) {
        document.title = `${meta.seriesTitle} — ${meta.title} | Dark Academia C1/C2`;
      }

      root.innerHTML = `
        <!-- Nav Breadcrumb -->
        <nav class="nav-breadcrumb" aria-label="Breadcrumb">
          <a href="dark-academia-index.html">← Course Hub</a>
          <span aria-hidden="true">/</span>
          <span>${meta.seriesTitle}</span>
          <span aria-hidden="true">/</span>
          <span aria-current="page">${meta.title}</span>
        </nav>

        <!-- Hero Header -->
        <header class="unit-header ${theme}-theme">
          <div>
            <div class="header-badges">
              <span class="badge badge-canon-${theme}">${meta.badgeLabel || `Lesson ${meta.lessonNumber}`}</span>
              <span class="badge badge-cefr">${meta.cefr || 'C1 Advanced / C2 Proficiency'}</span>
              <span class="badge badge-time">⏱ ${meta.duration || '20 Mins'}</span>
            </div>
            <h1>${meta.title}</h1>
            <p>${meta.subtitleHtml}</p>
          </div>
          <div class="score-box ${theme}">
            <div class="score-title">Lesson Score</div>
            <div class="score-display" id="score-display" aria-live="polite">0 / ${meta.totalMarks || 20}</div>
          </div>
        </header>

        <!-- Visual Blueprint -->
        <section class="visual-scene-banner" aria-label="Lesson Overview">
          ${blueprint.svgHtml ? `
          <div class="scene-illustration-frame">
            ${blueprint.svgHtml}
            <div class="scene-caption-bar">
              <span>${blueprint.sceneCaptionLeft || ''}</span>
              <span>${blueprint.sceneCaptionRight || ''}</span>
            </div>
          </div>` : ''}
          <div class="syntax-visual-blueprint">
            <span class="blueprint-tag">${blueprint.tag || "What You'll Learn in This Lesson"}</span>
            <h2 class="blueprint-title">${blueprint.title}</h2>
            <div class="syntax-flow-nodes">
              ${(blueprint.nodes || []).map(n => `
                <div class="syntax-node">
                  <strong>${n.formula}</strong>
                  <span>${n.explanationHtml}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <!-- Section 1: Reading & Lexicon Filter -->
        <section class="card" aria-labelledby="section1-heading">
          <div class="card-header">
            <h2 id="section1-heading">1. Read the Scene &amp; Useful Vocabulary</h2>
            <span class="pill">${reading.pill || ''}</span>
          </div>
          <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1rem;">${reading.intro}</p>
          <div class="reading-frame ${theme}-frame">
            <div style="margin-bottom:0.75rem;">
              <span class="badge badge-verbatim">Original Novel Extract</span>
            </div>
            ${reading.passageHtml}
            <cite>
              <span>— ${reading.citation}</span>
              <span class="attribution-label attr-verbatim">Original Text</span>
            </cite>
          </div>

          <div class="lexicon-filter-grid">
            <div class="lex-box museum">
              <div class="lex-title" style="color:#94a3b8;">
                <span>Old-Fashioned Words (Just for Reading)</span>
                <span class="lex-tag tag-museum">Period Terms</span>
              </div>
              <div class="lex-desc">${reading.lexicon.museumDesc || '19th-century literary terms from the scene.'}</div>
              ${(reading.lexicon.museum || []).map(item => `
                <div class="lex-item">
                  <strong>${item.word}</strong> [${item.pos}]
                  <span>${item.defHtml}</span>
                </div>
              `).join('')}
            </div>

            <div class="lex-box arsenal">
              <div class="lex-title" style="color:var(--hound-bright, #bef264);">
                <span>Modern C1/C2 Words (Great for Exams)</span>
                <span class="lex-tag tag-arsenal">Use in Writing &amp; Speaking</span>
              </div>
              <div class="lex-desc">${reading.lexicon.arsenalDesc || 'High-value analytical words for C1/C2 and IELTS essays.'}</div>
              ${(reading.lexicon.arsenal || []).map(item => `
                <div class="lex-item">
                  <strong>${item.word}</strong> [${item.pos}]
                  <span>${item.defHtml}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="sort-instruction">
            <strong>Task 1: Vocabulary Check (4 Marks).</strong> Classify each word as a <strong>Modern C1/C2 Word</strong> or an <strong>Old-Fashioned Word</strong>:
          </div>
          <div class="sort-container" id="sorting-container"></div>
        </section>

        <!-- Section 2: Grammar Pattern & MCQs -->
        <section class="card" aria-labelledby="section2-heading">
          <div class="card-header">
            <h2 id="section2-heading">2. ${grammar.title}</h2>
            <span class="pill">${grammar.pill || 'C1/C2 Structural Focus'}</span>
          </div>
          <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1.35rem;">${grammar.introHtml}</p>
          <div class="pillars-grid">
            ${(grammar.pillars || []).map(p => `
              <div class="pillar-card">
                <h3>${p.heading}</h3>
                <p>${p.bodyHtml}</p>
                <div class="pillar-example">${p.exampleHtml}</div>
              </div>
            `).join('')}
          </div>

          <h3 style="font-size:1.05rem; margin-bottom:0.95rem; color:#f1f5f9;">Quick Grammar Check (3 Marks):</h3>
          ${(grammar.mcqs || []).map((q, qIdx) => `
            <div class="mc-block" data-correct="${q.correctIdx}" data-mcq-idx="${qIdx}">
              <div class="mc-prompt">${q.number}. ${q.promptHtml}</div>
              <div class="mc-options">
                ${q.options.map((opt, oIdx) => `
                  <button class="mc-btn" data-opt-idx="${oIdx}">
                    ${opt.textHtml}
                  </button>
                `).join('')}
              </div>
              <div class="feedback-box"></div>
            </div>
          `).join('')}
        </section>

        <!-- Section 3: Key Word Transformations -->
        <section class="card" aria-labelledby="section3-heading">
          <div class="card-header">
            <h2 id="section3-heading">3. Cambridge Use of English Part 4: Key Word Transformations</h2>
            <span class="pill">2 Marks Each (10 Marks Total)</span>
          </div>
          <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1.35rem;">
            Complete the second sentence so that it has a similar meaning to the first sentence, using the word given. <strong>Do not change the word given.</strong> Use between <strong>3 and 6 words</strong>, including the key word.
          </p>
          ${(kwt || []).map((item, kIdx) => `
            <div class="kwt-card ${theme}" data-kwt-idx="${kIdx}" data-valid="${item.validAnswers.join('|')}">
              <div class="kwt-original">${item.number}. ${item.original}</div>
              <span class="kwt-key">${item.keyWord}</span>
              <div class="kwt-input-row">
                <span>${item.leadIn}</span>
                <input type="text" class="kwt-input" placeholder="3–6 words..." aria-label="Transformation answer for question ${item.number}">
                <span>${item.leadOut}</span>
                <button class="btn-main ${theme} dare-kwt-check" data-kwt-idx="${kIdx}">Check</button>
              </div>
              <div class="feedback-box"></div>
            </div>
          `).join('')}
        </section>

        <!-- Section 4: Register Shift -->
        <section class="card" aria-labelledby="section4-heading">
          <div class="card-header">
            <h2 id="section4-heading">4. From Classic Fiction to Modern Exam Writing</h2>
            <span class="pill">Real-World C1/C2 Application</span>
          </div>
          <p style="font-size:0.94rem; color:var(--text-muted); margin-bottom:1rem;">${registerShift.introHtml}</p>
          <div class="shift-comparison">
            <div class="shift-pane victorian">
              <div class="shift-label" style="color:#fde047;">${registerShift.victorianLabel}</div>
              <div class="shift-text">${registerShift.victorianHtml}</div>
            </div>
            <div class="shift-pane modern">
              <div class="shift-label" style="color:#34d399;">${registerShift.modernLabel}</div>
              <div class="shift-text">${registerShift.modernHtml}</div>
            </div>
          </div>
          <div class="shift-drill-section">
            <h3 style="color:#ffffff; font-size:1.15rem; margin-bottom:0.5rem;">Modern Exam Writing Practice (Questions 13–15 • 3 Marks)</h3>
            <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:1.25rem;">
              Choose the most natural, accurate C1/C2 sentence for a modern essay or report:
            </p>
            <div id="style-shift-drills"></div>
          </div>
        </section>

        <div id="dynamic-completion-card" class="da-completion-card"></div>

        <!-- Footer -->
        <footer class="footer-bar ${theme}">
          <div>
            <strong style="color:white; font-size:1.05rem;">${navigation.seriesName}</strong>
            <p style="font-size:0.85rem; color:#cbd5e1; margin-top:0.25rem;">
              Next Lesson: <a href="${navigation.nextUrl}" style="color:#fde047; text-decoration:none; font-weight:700;">${navigation.nextTitle} →</a> (${navigation.nextTopicHtml}).
            </p>
          </div>
          <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
            <a href="dark-academia-index.html" class="btn-main" style="background:#334155; text-decoration:none;">← Course Hub</a>
            <a href="the-gothic-canon-c1-c2-compendium.html" class="dossier-pill-btn">📖 Study Guide</a>
            <button class="btn-main" style="background:#475569;" onclick="resetAll()">Reset Lesson</button>
            <button class="btn-main ${theme}" onclick="window.print()">Print / PDF</button>
          </div>
        </footer>
      `;

      // Boot DarkAcademiaEngine
      if (typeof DarkAcademiaEngine !== 'undefined') {
        window.darkEngine = new DarkAcademiaEngine({
          unitId: meta.unitId,
          totalMarks: meta.totalMarks || 20,
          sortItems: reading.sortItems || [],
          styleShiftItems: registerShift.styleShiftItems || []
        });
      }

      this.bindCleanEvents(root, manifest);
    },

    /**
     * Bind clean event listeners (zero inline onclick escaping required)
     * and wire up the Speculative Error Branch Predictor on KWT inputs.
     */
    bindCleanEvents(root, manifest) {
      // 1. MCQs
      root.querySelectorAll('.mc-block').forEach((block) => {
        const qIdx = Number(block.getAttribute('data-mcq-idx'));
        const qData = manifest.grammar.mcqs[qIdx];
        if (!qData) return;
        block.querySelectorAll('.mc-btn').forEach((btn) => {
          const oIdx = Number(btn.getAttribute('data-opt-idx'));
          const opt = qData.options[oIdx];
          btn.addEventListener('click', () => {
            if (window.darkEngine && opt) {
              window.darkEngine.handleMC(btn, oIdx, opt.feedback);
            }
          });
        });
      });

      // 2. KWT with Branch Prediction
      root.querySelectorAll('.dare-kwt-check').forEach((btn) => {
        const kIdx = Number(btn.getAttribute('data-kwt-idx'));
        const kData = manifest.kwt[kIdx];
        if (!kData) return;

        btn.addEventListener('click', () => {
          const card = btn.closest('.kwt-card');
          const input = card ? card.querySelector('.kwt-input') : null;
          const userVal = input ? input.value.trim() : '';

          // Run Branch Predictor BEFORE generic error fallback
          const branchDiag = this.predictErrorBranch(userVal, kData);

          if (window.darkEngine) {
            window.darkEngine.handleKWT(btn, kData.canonicalAnswer, kData.explanation);
          }

          // If the student was wrong AND our Branch Predictor matched a specific syntactic trap, surface it!
          if (branchDiag && card && !card.classList.contains('correct')) {
            const fb = card.querySelector('.feedback-box');
            if (fb) {
              const diagEl = document.createElement('div');
              diagEl.style.cssText = 'margin-top:0.5rem;padding:0.55rem 0.75rem;border-radius:6px;background:rgba(245,158,11,0.14);border-left:3px solid #f59e0b;color:#fde68a;font-size:0.86rem;';
              diagEl.textContent = branchDiag;
              fb.appendChild(diagEl);
            }
          }
        });
      });
    },

    /**
     * Speculative Error Branch Predictor:
     * Checks item-specific errorBranches first, then universal C1 traps.
     */
    predictErrorBranch(userText, kwtItem) {
      if (!userText) return null;

      // Check item-specific branches
      if (Array.isArray(kwtItem.errorBranches)) {
        for (const branch of kwtItem.errorBranches) {
          try {
            const re = new RegExp(branch.pattern, 'i');
            if (re.test(userText)) return branch.diagnostic;
          } catch (e) {}
        }
      }

      // Check if student forgot to include the required keyWord
      if (kwtItem.keyWord && !new RegExp(`\\b${kwtItem.keyWord}\\b`, 'i').test(userText)) {
        return `⚡ Key Word Missing: You must include the exact word "${kwtItem.keyWord}" unchanged in your answer.`;
      }

      // Check universal C1 traps
      for (const trap of UNIVERSAL_C1_TRAPS) {
        if (trap.pattern.test(userText)) {
          return trap.diagnostic;
        }
      }

      return null;
    }
  };

  window.DareCompiler = DareCompiler;
})();
