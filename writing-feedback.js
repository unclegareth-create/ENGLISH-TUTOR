/* === GARETHENGLISH INTERACTIVE WRITING FEEDBACK SUITE ===
   Standalone interactive engine for how-i-mark.html
   Provides dynamic context tab switching, view mode changes (draft, markup, polished, split),
   interactive annotation inspection, and accessible keyboard navigation.
======================================================================================== */

(() => {
  'use strict';

  function initWritingSuite() {
    const canvasBody = document.getElementById('essay-canvas-body');
    const displayArea = document.getElementById('essay-display-area');
    if (!canvasBody && !displayArea) return;

    const WRITING_SAMPLES = {
      "c1": {
        "title": "Cambridge C1 Advanced (CAE) — Part 1 Essay",
        "prompt": "Write an essay discussing two of the methods in your notes (subsidising fares, improving rail links, congestion charges). Explain which is more effective, giving reasons.",
        "draftBadge": "Student Draft (Solid B2 — 172/210)",
        "markupBadge": "Gareth's Line-by-Line Markup",
        "polishedBadge": "Polished C1 Pass (194/210 — Strong C1)",
        "cefrShift": "CEFR B2 → Strong C1",
        "splitBeforeBadge": "CEFR B2 (172/210)",
        "splitAfterBadge": "Strong C1 (194/210)",
        "scorePills": [
          { "label": "Content", "before": "3/5", "after": "5/5" },
          { "label": "Communicative Achievement", "before": "2/5", "after": "4/5" },
          { "label": "Organisation", "before": "2/5", "after": "4/5" },
          { "label": "Language", "before": "2/5", "after": "5/5" }
        ],
        "verdict": "Your argument is clear and logical, which comfortably passes at B2. To reach a strong C1 pass (190+ on the Cambridge scale), we need to replace everyday verbs like 'make tickets cheaper' with natural C1 noun phrases ('subsidising fares') and show confident control of complex structures like negative inversion.",
        "segments": [
          { "type": "text", "content": "In many modern cities, traffic congestion is a growing problem. " },
          {
            "type": "annotation",
            "id": 1,
            "category": "Negative Inversion",
            "criterion": "Language (Grammar)",
            "before": "Cars cause a lot of pollution, and they also waste people's time every day.",
            "after": "Not only do private vehicles exacerbate urban air pollution, but they also erode daily productivity.",
            "why": "Cambridge examiners reward ambitious C1/C2 grammar used naturally. Opening with 'Not only do...' demonstrates advanced structural control, while upgrading 'cause a lot of' to 'exacerbate' lifts the Language mark."
          },
          { "type": "text", "content": " Therefore, governments must take decisive action. " },
          {
            "type": "annotation",
            "id": 2,
            "category": "Nominalisation & Collocation",
            "criterion": "Language (Lexis)",
            "before": "First, if the government makes train and bus tickets cheaper,",
            "after": "First and foremost, heavily subsidising rail and bus fares would allow authorities to",
            "why": "Replacing the conversational conditional ('if the government makes... cheaper') with a gerund phrase and natural C1 collocation ('heavily subsidising... fares') establishes an authoritative essay register."
          },
          { "type": "text", "content": " encourage low-income commuters to leave their cars at home. " },
          {
            "type": "annotation",
            "id": 3,
            "category": "Abstract Nouns & Cohesion",
            "criterion": "Organisation",
            "before": "However, cheap tickets are not enough if the buses are always late.",
            "after": "Nevertheless, subsidising fares achieves little if services remain chronically unreliable.",
            "why": "Rather than repeating basic nouns ('tickets', 'buses'), shifting to natural nominalisation ('subsidising fares', 'services remain chronically unreliable') and 'Nevertheless' strengthens both Organisation and Communicative Achievement."
          },
          { "type": "text", "content": " " },
          {
            "type": "annotation",
            "id": 4,
            "category": "Evaluative Conclusion",
            "criterion": "Content & Register",
            "before": "Because of this, I think spending money on faster trains is the best choice.",
            "after": "Consequently, channelling investment into faster rail links is far more viable as a long-term strategy.",
            "why": "Part 1 Essays require you to evaluate which option is more effective. Expressing your reasoned conclusion with 'far more viable as a long-term strategy' maintains an academic C1 register right to the final sentence."
          }
        ]
      },
      "ielts": {
        "title": "IELTS Academic Writing Task 2 — Opinion Essay",
        "prompt": "Some people believe universities should only offer places to students with high academic marks, while others think people of all ages and abilities should be admitted. Discuss both views and give your opinion.",
        "draftBadge": "Student Draft (Stuck at Band 6.5)",
        "markupBadge": "Gareth's Band 7.5+ Upgrade",
        "polishedBadge": "Polished Band 7.5+ Paragraph",
        "cefrShift": "Band 6.5 → Band 7.5+",
        "splitBeforeBadge": "Band 6.5",
        "splitAfterBadge": "Band 7.5+",
        "scorePills": [
          { "label": "Task Response", "before": "6.5", "after": "7.5" },
          { "label": "Coherence & Cohesion", "before": "6.0", "after": "7.5" },
          { "label": "Lexical Resource", "before": "6.0", "after": "8.0" },
          { "label": "Grammatical Range & Accuracy", "before": "6.5", "after": "7.5" }
        ],
        "verdict": "Many capable professionals get stuck at Band 6.5 in Writing because they rely on memorised 'template' openings and sweeping claims. Here, we introduce academic hedging ('arguably') and precise topic vocabulary so your writing reads naturally at a Band 7.5–8.0 level.",
        "segments": [
          {
            "type": "annotation",
            "id": 1,
            "category": "Avoiding Memorised Templates",
            "criterion": "Task Response & Lexis",
            "before": "Nowadays, there is a big debate about who should go to university.",
            "after": "Whether higher education should remain strictly meritocratic or become universally accessible is a subject of ongoing debate.",
            "why": "IELTS examiners quickly spot generic openings like 'Nowadays, there is a big debate...'. Opening with a noun clause ('Whether higher education should...') sets a genuinely academic tone from sentence one."
          },
          { "type": "text", "content": " On the one hand, " },
          {
            "type": "annotation",
            "id": 2,
            "category": "Topic-Specific Collocations",
            "criterion": "Lexical Resource",
            "before": "people who want tough entry rules say that smart students learn faster",
            "after": "proponents of stringent admission criteria argue that academically gifted cohorts progress more rapidly",
            "why": "'People who want tough rules' and 'smart students' are everyday B2 phrasing. Upgrading to 'proponents of stringent admission criteria' and 'academically gifted cohorts' shows natural Band 8 lexical control."
          },
          { "type": "text", "content": " when lectures are pitched at a demanding level. " },
          {
            "type": "annotation",
            "id": 3,
            "category": "Academic Hedging",
            "criterion": "Grammatical Range & Accuracy",
            "before": "If universities let everyone in, the quality of the degree will definitely go down.",
            "after": "Were institutions to lower entry thresholds indiscriminately, rigorous academic standards could arguably be compromised.",
            "why": "Band 6.5 essays often make absolute claims ('will definitely go down'). Using an inverted conditional ('Were institutions to lower...') with cautious hedging ('could arguably be compromised') is typical of strong academic writing."
          },
          { "type": "text", "content": " However, I firmly believe that " },
          {
            "type": "annotation",
            "id": 4,
            "category": "Specific Idea Development",
            "criterion": "Task Response & Coherence",
            "before": "giving older people a second chance to study helps the whole country's economy.",
            "after": "widening participation to mature learners fosters social mobility and a more adaptable workforce.",
            "why": "Instead of broad statements like 'helps the whole country's economy', specify how ('fosters social mobility and a more adaptable workforce'). This directly addresses the Band 8 requirement for well-developed, supported ideas."
          }
        ]
      },
      "business": {
        "title": "Business English — Stakeholder Delay Email",
        "prompt": "Write an email to a senior client explaining that the November software rollout will be delayed by two weeks due to security testing, while maintaining trust.",
        "draftBadge": "Original Draft (Too Direct / Abrupt)",
        "markupBadge": "Gareth's Diplomatic Markup",
        "polishedBadge": "Polished Client Email",
        "cefrShift": "Direct B2 → Diplomatic C1/C2",
        "splitBeforeBadge": "Direct B2",
        "splitAfterBadge": "Diplomatic C1/C2",
        "scorePills": [
          { "label": "Diplomatic Tone", "before": "Blunt", "after": "Assured" },
          { "label": "Clarity & Impact", "before": "6/10", "after": "9/10" },
          { "label": "Client Confidence", "before": "Shaky", "after": "High" }
        ],
        "verdict": "When writing in a second language under time pressure, it is easy to translate directly—which can accidentally sound blunt or defensive ('We have a problem', 'You will have to wait'). Here, we reframe the delay around client security and clear next steps.",
        "segments": [
          { "type": "text", "content": "Dear Sarah,<br><br>Following our review of the November rollout, I am writing to share a brief status update.<br><br>" },
          {
            "type": "annotation",
            "id": 1,
            "category": "Constructive Framing",
            "criterion": "Diplomatic Register",
            "before": "Unfortunately, we have a problem with the new security update, so we cannot launch on Friday.",
            "after": "To ensure the platform meets your organisation's strict data-compliance standards, we are conducting an additional round of penetration testing prior to launch.",
            "why": "Avoid leading with alarmist phrasing like 'Unfortunately, we have a problem... we cannot'. Start with the benefit to the client ('To ensure the platform meets your strict standards...') before introducing the revised date."
          },
          { "type": "text", "content": " " },
          {
            "type": "annotation",
            "id": 2,
            "category": "Calm Ownership",
            "criterion": "Professional Tone",
            "before": "Because of this, you will have to wait two more weeks for the final version.",
            "after": "Accordingly, we have revised the go-live date to 18 November, allowing our engineering team to resolve two minor vulnerabilities.",
            "why": "'You will have to wait' puts the friction on the reader. 'We have revised the go-live date to 18 November' shows ownership and gives the client a clear, concrete date."
          },
          { "type": "text", "content": "<br><br>" },
          {
            "type": "annotation",
            "id": 3,
            "category": "Commercial Reassurance",
            "criterion": "Stakeholder Management",
            "before": "Don't worry, this won't change the price we agreed on.",
            "after": "Please rest assured that this adjustment will have no impact on your Q1 onboarding schedule or agreed project budget.",
            "why": "Informal imperatives like 'Don't worry' can feel dismissive to senior clients. 'Please rest assured that...' paired with specific commercial details answers their main concern immediately."
          },
          { "type": "text", "content": "<br><br>" },
          {
            "type": "annotation",
            "id": 4,
            "category": "Clear Next Step",
            "criterion": "Call to Action",
            "before": "Tell me if you want to talk about this on a call.",
            "after": "I have provisionally held 10:00 GMT tomorrow should you wish to walk through the updated deployment schedule.",
            "why": "'Tell me if you want to talk' leaves the effort to the client. Offering a specific time slot ('I have provisionally held 10:00 GMT tomorrow...') is polite, proactive, and easy to accept."
          },
          { "type": "text", "content": "<br><br>Kind regards,<br>Gareth" }
        ]
      }
    };

    let currentContextKey = 'c1';
    let currentViewMode = 'markup';
    let activeAnnotationId = 1;

    function escapeAttr(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function renderComponent() {
      const sample = WRITING_SAMPLES[currentContextKey];
      if (!sample) return;

      const promptEl = document.getElementById('task-prompt-text');
      const verdictEl = document.getElementById('gareth-verdict-text');
      const badgeEl = document.getElementById('doc-cefr-badge');

      if (promptEl) promptEl.textContent = `"${sample.prompt}"`;
      if (verdictEl) verdictEl.textContent = sample.verdict;
      if (badgeEl) badgeEl.textContent = sample.cefrShift;

      const pillsContainer = document.getElementById('score-pills-container');
      if (pillsContainer) {
        pillsContainer.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/90 text-slate-700">Illustrative Example</span>` + sample.scorePills.map(pill => `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
            <span class="text-slate-500 font-medium">${pill.label}:</span>
            <span class="text-rose-600 line-through font-mono text-xs">${pill.before}</span>
            <span class="text-slate-400" aria-hidden="true">&rarr;</span>
            <span class="text-emerald-700 font-bold font-mono text-xs bg-emerald-50 px-1.5 py-0.5 rounded">${pill.after}</span>
          </div>
        `).join('');
      }

      const statusBadge = document.getElementById('doc-status-badge');
      const legend = document.getElementById('markup-legend');
      if (statusBadge) {
        if (currentViewMode === 'draft') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span> ${sample.draftBadge}`;
          if (legend) legend.classList.add('opacity-50');
        } else if (currentViewMode === 'markup') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-600"></span> ${sample.markupBadge}`;
          if (legend) legend.classList.remove('opacity-50');
        } else if (currentViewMode === 'polished') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600"></span> ${sample.polishedBadge}`;
          if (legend) legend.classList.add('opacity-50');
        } else if (currentViewMode === 'split') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-sky-600"></span> Before &amp; After Comparison`;
          if (legend) legend.classList.add('opacity-50');
        }
      }

      const canvas = document.getElementById('essay-canvas-body');
      if (canvas) {
        if (currentViewMode === 'split') {
          let beforeHtml = '';
          let afterHtml = '';
          sample.segments.forEach(seg => {
            if (seg.type === 'text') {
              beforeHtml += `<span>${seg.content}</span>`;
              afterHtml += `<span>${seg.content}</span>`;
            } else if (seg.type === 'annotation') {
              beforeHtml += `<mark class="bg-rose-100 text-rose-900 rounded px-1">${seg.before}</mark>`;
              afterHtml += `<mark class="bg-emerald-100 text-emerald-900 font-medium rounded px-1">${seg.after}</mark>`;
            }
          });

          canvas.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="p-4 rounded-xl bg-rose-50/50 border border-rose-200/80">
                <div class="flex items-center justify-between pb-2 mb-3 border-b border-rose-200/60">
                  <span class="text-xs font-bold uppercase tracking-wider text-rose-700">Before (${sample.splitBeforeBadge})</span>
                  <span class="text-[11px] text-rose-600">Everyday phrasing</span>
                </div>
                <div class="text-slate-800 text-sm leading-relaxed">${beforeHtml}</div>
              </div>
              <div class="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/80">
                <div class="flex items-center justify-between pb-2 mb-3 border-b border-emerald-200/60">
                  <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">After (${sample.splitAfterBadge})</span>
                  <span class="text-[11px] text-emerald-700 font-medium">Cambridge/IELTS Standard</span>
                </div>
                <div class="text-slate-800 text-sm leading-relaxed">${afterHtml}</div>
              </div>
            </div>
          `;
        } else {
          let html = '';
          sample.segments.forEach(seg => {
            if (seg.type === 'text') {
              html += `<span>${seg.content}</span>`;
            } else if (seg.type === 'annotation') {
              if (currentViewMode === 'draft') {
                html += `<span class="text-slate-800">${seg.before}</span>`;
              } else if (currentViewMode === 'polished') {
                html += `<span class="text-slate-900 font-medium">${seg.after}</span>`;
              } else if (currentViewMode === 'markup') {
                const activeClass = seg.id === activeAnnotationId ? 'active-annotation' : '';
                const a11yAttrs = `role="button" tabindex="0" aria-pressed="${seg.id === activeAnnotationId}" aria-describedby="note-card-${seg.id}" aria-label="Feedback ${seg.id} (${escapeAttr(seg.category)}): Draft phrase '${escapeAttr(seg.before)}' upgraded to '${escapeAttr(seg.after)}'"`;
                html += `<span class="markup-group ${activeClass}" data-note-id="${seg.id}" ${a11yAttrs}><del class="markup-del" aria-hidden="true">${seg.before}</del><ins class="markup-ins no-underline" aria-hidden="true">${seg.after}</ins><span class="markup-badge" aria-hidden="true">${seg.id}</span></span>`;
              }
            }
          });
          canvas.innerHTML = `<p class="leading-relaxed">${html}</p>`;
        }
      }

      const commentary = document.getElementById('commentary-cards-container');
      if (commentary) {
        const annotations = sample.segments.filter(s => s.type === 'annotation');
        commentary.innerHTML = annotations.map(note => {
          const isActive = note.id === activeAnnotationId;
          const activeCardClass = isActive ? 'active-card' : 'border-slate-200/90';
          return `
            <div id="note-card-${note.id}" data-card-id="${note.id}" role="button" tabindex="0" aria-pressed="${isActive}" aria-label="Criterion card ${note.id}: ${escapeAttr(note.category)}" class="note-card bg-white p-3.5 sm:p-4 rounded-xl border ${activeCardClass} shadow-sm transition-all cursor-pointer hover:border-indigo-300">
              <div class="flex items-center justify-between gap-2 mb-2">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <span class="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">${note.id}</span>
                  ${note.category}
                </span>
                <span class="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">${note.criterion}</span>
              </div>
              <div class="space-y-1.5 text-xs mb-2">
                <div class="text-rose-700 bg-rose-50/80 p-1.5 rounded font-mono text-[11px] line-through">${note.before}</div>
                <div class="text-emerald-800 bg-emerald-50/80 p-1.5 rounded font-mono text-[11px] font-medium">&rarr; ${note.after}</div>
              </div>
              <p class="text-xs text-slate-600 leading-relaxed">${note.why}</p>
            </div>
          `;
        }).join('');
      }

      updateHighlightStates(false);
    }

    function switchContext(contextKey) {
      if (!WRITING_SAMPLES[contextKey]) return;
      currentContextKey = contextKey;
      activeAnnotationId = 1;

      document.querySelectorAll('[data-context-tab]').forEach(btn => {
        const isActive = btn.getAttribute('data-context-tab') === contextKey;
        btn.setAttribute('aria-selected', String(isActive));
        if (isActive) {
          btn.className = "context-tab active-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 bg-indigo-600 text-white shadow-sm";
        } else {
          btn.className = "context-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800";
        }
      });

      renderComponent();
    }

    function setViewMode(mode) {
      currentViewMode = mode;
      document.querySelectorAll('[data-view-mode]').forEach(btn => {
        const isActive = btn.getAttribute('data-view-mode') === mode;
        btn.setAttribute('aria-pressed', String(isActive));
        const isSplitBtn = btn.getAttribute('data-view-mode') === 'split';
        if (isActive) {
          btn.className = isSplitBtn
            ? "view-mode-btn hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm"
            : "view-mode-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm";
        } else {
          btn.className = isSplitBtn
            ? "view-mode-btn hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white"
            : "view-mode-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white";
        }
      });
      renderComponent();
    }

    const suiteContainer = document.getElementById('gareth-writing-markup') || document.body;

    suiteContainer.addEventListener('click', (e) => {
      const contextBtn = e.target.closest('[data-context-tab]');
      if (contextBtn) {
        switchContext(contextBtn.getAttribute('data-context-tab'));
        return;
      }

      const viewBtn = e.target.closest('[data-view-mode]');
      if (viewBtn) {
        setViewMode(viewBtn.getAttribute('data-view-mode'));
        return;
      }

      const noteGroup = e.target.closest('#essay-canvas-body [data-note-id]');
      if (noteGroup) {
        const id = parseInt(noteGroup.getAttribute('data-note-id'), 10);
        if (!isNaN(id)) {
          activeAnnotationId = id;
          updateHighlightStates(true);
        }
        return;
      }

      const card = e.target.closest('[data-card-id]');
      if (card) {
        const id = parseInt(card.getAttribute('data-card-id'), 10);
        if (!isNaN(id)) {
          activeAnnotationId = id;
          updateHighlightStates(false);
        }
      }
    });

    suiteContainer.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const contextBtn = e.target.closest('[data-context-tab]');
        if (contextBtn) {
          const keys = ['c1', 'ielts', 'business'];
          const idx = keys.indexOf(contextBtn.getAttribute('data-context-tab'));
          if (idx !== -1) {
            e.preventDefault();
            const nextIdx = e.key === 'ArrowRight'
              ? (idx + 1) % keys.length
              : (idx - 1 + keys.length) % keys.length;
            const nextBtn = document.querySelector(`[data-context-tab="${keys[nextIdx]}"]`);
            if (nextBtn) {
              nextBtn.focus();
              switchContext(keys[nextIdx]);
            }
          }
        }
      }

      if (e.key === 'Enter' || e.key === ' ') {
        const noteGroup = e.target.closest('#essay-canvas-body [data-note-id]');
        if (noteGroup) {
          e.preventDefault();
          const id = parseInt(noteGroup.getAttribute('data-note-id'), 10);
          if (!isNaN(id)) {
            activeAnnotationId = id;
            updateHighlightStates(true);
          }
          return;
        }

        const card = e.target.closest('[data-card-id]');
        if (card) {
          e.preventDefault();
          const id = parseInt(card.getAttribute('data-card-id'), 10);
          if (!isNaN(id)) {
            activeAnnotationId = id;
            updateHighlightStates(false);
          }
        }
      }
    });

    function updateHighlightStates(scrollCardIntoView) {
      document.querySelectorAll('#essay-canvas-body [data-note-id]').forEach(el => {
        const id = parseInt(el.getAttribute('data-note-id'), 10);
        const isMatch = id === activeAnnotationId;
        el.setAttribute('aria-pressed', String(isMatch));
        if (isMatch) {
          el.classList.add('active-annotation');
        } else {
          el.classList.remove('active-annotation');
        }
      });

      const sample = WRITING_SAMPLES[currentContextKey];
      if (!sample) return;
      const annotations = sample.segments.filter(s => s.type === 'annotation');
      annotations.forEach(note => {
        const card = document.getElementById(`note-card-${note.id}`);
        if (!card) return;
        const isMatch = note.id === activeAnnotationId;
        card.setAttribute('aria-pressed', String(isMatch));
        if (isMatch) {
          card.classList.add('active-card');
          card.classList.remove('border-slate-200/90');
          if (scrollCardIntoView) {
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        } else {
          card.classList.remove('active-card');
          card.classList.add('border-slate-200/90');
        }
      });

      const indicator = document.getElementById('active-note-indicator');
      if (indicator) {
        indicator.textContent = `Inspecting Note #${activeAnnotationId} of 4`;
      }
    }

    renderComponent();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWritingSuite);
  } else {
    initWritingSuite();
  }
})();
