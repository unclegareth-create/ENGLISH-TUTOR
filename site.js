/* ==========================================================
   Shared behaviour for the tutor landing pages
   ========================================================== */
(() => {
    'use strict';

    /* ---------- Mobile menu (with aria-hidden sync & focus management) ---------- */
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        const icon = btn.querySelector('i');
        const setOpen = (open, moveFocus = false) => {
            menu.classList.toggle('hidden', !open);
            menu.setAttribute('aria-hidden', String(!open));
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
            if (open && moveFocus) {
                const firstLink = menu.querySelector('a[href], button:not([disabled])');
                if (firstLink) {
                    requestAnimationFrame(() => firstLink.focus());
                }
            }
        };

        btn.addEventListener('click', () => {
            const willOpen = menu.classList.contains('hidden');
            setOpen(willOpen, true);
        });
        menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => {
            if (menu.classList.contains('hidden')) return;
            if (e.key === 'Escape') {
                setOpen(false);
                btn.focus();
            } else if (e.key === 'Tab') {
                const focusables = [btn, ...menu.querySelectorAll('a[href], button:not([disabled])')];
                const first = focusables[0];
                const last = focusables[focusables.length - 1];
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        });
        window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- Click-to-Load Vimeo Video Facade (Zero Cookie / Fast LCP) ---------- */
    const videoFacadeBtn = document.getElementById('video-facade-btn');
    const videoFacadeContainer = document.getElementById('video-facade-container');
    if (videoFacadeBtn && videoFacadeContainer) {
        videoFacadeBtn.addEventListener('click', () => {
            const vimeoSrc = videoFacadeBtn.getAttribute('data-vimeo-src') || 'https://player.vimeo.com/video/1117062710?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
            const iframe = document.createElement('iframe');
            iframe.src = vimeoSrc;
            iframe.className = 'absolute top-0 left-0 w-full h-full border-0';
            iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media');
            iframe.setAttribute('allowfullscreen', '');
            iframe.setAttribute('title', 'Gareth Montgomery - English Tutor Introduction');
            videoFacadeContainer.innerHTML = '';
            videoFacadeContainer.appendChild(iframe);
        });
    }

    /* ---------- Legacy Anchor Hash Mapping (Replaces hacky -top-20 empty divs) ---------- */
    const LEGACY_HASH_MAP = {
        '#writing-markup': '#gareth-writing-markup',
        '#sample-markup': '#gareth-writing-markup',
        '#courses': '#resources',
        '#gothic-course': '#resources',
        '#exam-lab': '#resources',
        '#interactive-tools': '#resources',
        '#cal-embed': '#contact',
        '#booking': '#contact'
    };

    const resolveLegacyHash = (hash) => {
        if (!hash || !LEGACY_HASH_MAP[hash]) return;
        const targetEl = document.querySelector(LEGACY_HASH_MAP[hash]);
        if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    if (window.location.hash && LEGACY_HASH_MAP[window.location.hash]) {
        setTimeout(() => resolveLegacyHash(window.location.hash), 100);
    }

    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[href^="#"]');
        if (!link) return;
        const href = link.getAttribute('href');
        if (href && LEGACY_HASH_MAP[href] && !document.getElementById(href.slice(1))) {
            const mappedTarget = document.querySelector(LEGACY_HASH_MAP[href]);
            if (mappedTarget) {
                e.preventDefault();
                mappedTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, '', href);
            }
        }
    });

    /* ---------- Copyright Year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* ---------- Form Success Handling (?submitted=true) ---------- */
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === 'true') {
        const successBanner = document.getElementById('form-success-banner');
        const formStatus = document.getElementById('form-status');
        const targetForm = document.getElementById('lead-form') || document.getElementById('contact-form');
        const successMsg = "Thank you! I've received your message and will reply within 24 hours to schedule your lesson.";

        if (successBanner) {
            successBanner.classList.remove('hidden');
        }

        const createAlertBox = () => {
            const div = document.createElement('div');
            div.className = 'bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl mb-4 text-sm font-semibold shadow-sm flex items-center gap-3';
            div.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-lg" aria-hidden="true"></i> <span>' + successMsg + '</span>';
            return div;
        };

        if (formStatus) {
            formStatus.textContent = '';
            formStatus.appendChild(createAlertBox());
        } else if (!successBanner && targetForm && targetForm.parentNode) {
            targetForm.parentNode.insertBefore(createAlertBox(), targetForm);
        }

        setTimeout(() => {
            const target = successBanner || document.getElementById('enquiry-card') || document.getElementById('contact') || targetForm;
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        // Clean up the URL query parameter while preserving hash
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    if (urlParams.get('subscribed') === 'true') {
        const hashId = (window.location.hash || '').replace('#', '');
        const targetSection = (hashId && document.getElementById(hashId)) || document.getElementById('cheat-sheet') || document.getElementById('arcade-signup');
        const targetForm = targetSection ? targetSection.querySelector('form') : null;

        const createSubAlertBox = () => {
            const div = document.createElement('div');
            div.setAttribute('role', 'status');
            div.setAttribute('aria-live', 'polite');
            div.className = 'bg-emerald-500/20 border border-emerald-400 text-emerald-100 px-5 py-4 rounded-xl mb-4 text-sm shadow-sm text-left max-w-lg mx-auto space-y-2.5';
            div.innerHTML =
                '<div class="flex items-center gap-2.5 font-bold text-emerald-300">' +
                '<i class="fa-solid fa-circle-check text-emerald-400 text-lg shrink-0" aria-hidden="true"></i>' +
                '<span>Check your inbox! You can also access your guides &amp; PDF immediately below:</span>' +
                '</div>' +
                '<div class="flex flex-wrap gap-2 pt-1 text-xs font-semibold">' +
                '<a href="cpe-inversion.html" class="px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/40 transition">C1/C2 Inversion Guide &rarr;</a>' +
                '<a href="c1-c2-common-mistakes.html" class="px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/40 transition">10 Common C1 Mistakes &rarr;</a>' +
                '<a href="ielts-7-syllabus.pdf" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-indigo-400/40 transition"><i class="fa-solid fa-file-pdf mr-1" aria-hidden="true"></i>Download Study Syllabus PDF</a>' +
                '</div>';
            return div;
        };

        if (targetForm && targetForm.parentNode) {
            targetForm.parentNode.insertBefore(createSubAlertBox(), targetForm);
        }

        setTimeout(() => {
            if (targetSection) targetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    /* ---------- Sticky Mobile CTA visibility ---------- */
    const stickyBar = document.getElementById('sticky-mobile-cta');
    const contactSection = document.getElementById('contact');
    if (stickyBar) {
        let isContactVisible = false;

        const updateStickyVisibility = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const heroThreshold = 320;
            const shouldHide = scrollY <= heroThreshold || isContactVisible;

            stickyBar.classList.toggle('translate-y-full', shouldHide);
            stickyBar.classList.toggle('opacity-0', shouldHide);
            stickyBar.classList.toggle('pointer-events-none', shouldHide);
            stickyBar.classList.toggle('translate-y-0', !shouldHide);
            stickyBar.classList.toggle('opacity-100', !shouldHide);
        };

        if (contactSection && 'IntersectionObserver' in window) {
            new IntersectionObserver(([entry]) => {
                isContactVisible = entry.isIntersecting;
                updateStickyVisibility();
            }, { threshold: 0.08 }).observe(contactSection);
        }

        window.addEventListener('scroll', updateStickyVisibility, { passive: true });
        updateStickyVisibility();
    }

    /* ---------- Stripe Payment Links & Pre-fill Package Intent ---------- */
    const STRIPE_PAYMENT_LINKS = window.GARETH_STRIPE_LINKS || {
        pack_5_275: '',     // e.g. 'https://buy.stripe.com/...' (5-Lesson Pack - £275)
        sprint_10_500: '',  // e.g. 'https://buy.stripe.com/...' (10-Lesson Pack - £500)
        vip_12_600: '',     // e.g. 'https://buy.stripe.com/...' (12-Lesson Pack - £600)
        single_65: '',      // e.g. 'https://buy.stripe.com/...' (Single Session - £65)
        audit_async_29: ''  // e.g. 'https://buy.stripe.com/...' (24h Async Audit - £29)
    };

    const applyPackagePrefill = (pkg, tierKey) => {
        const goalInput = document.getElementById('goal');
        const messageInput = document.getElementById('message');
        const subjectInput = document.querySelector('#contact-form input[name="_subject"]');
        const nameInput = document.getElementById('name');
        const formTitle = document.getElementById('enquiry-form-title');
        const formSubtitle = document.getElementById('enquiry-form-subtitle');
        const formBadge = document.getElementById('enquiry-form-badge');
        const pkgBanner = document.getElementById('selected-package-banner');
        const pkgNameEl = document.getElementById('selected-package-name');
        const pkgNextStepEl = document.getElementById('selected-package-next-step');
        const stripeBtn = document.getElementById('selected-package-stripe-link');
        const submitBtn = document.getElementById('contact-submit-btn');
        const enquiryCard = document.getElementById('enquiry-card');

        if (!pkg) return;

        const stripeUrl = (tierKey && STRIPE_PAYMENT_LINKS[tierKey]) || '';

        if (goalInput) {
            goalInput.value = 'Selected Package: ' + pkg;
            goalInput.classList.add('ring-2', 'ring-emerald-400', 'border-emerald-400');
        }
        if (subjectInput) {
            subjectInput.value = 'Package Order / Enquiry: ' + pkg;
        }
        if (formTitle) {
            formTitle.textContent = 'Selected: ' + pkg;
        }
        if (formSubtitle) {
            formSubtitle.textContent = pkg.includes('Async')
                ? 'Complete your details below for your £29 Stripe Payment Link and essay/voice-note upload instructions (Wise or PayPal also available on request).'
                : 'Complete your details and preferred days/times below for your Stripe Payment Link (or request Wise / PayPal).';
        }
        if (formBadge) {
            formBadge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 mb-2';
            formBadge.innerHTML = '<i class="fa-solid fa-bag-shopping" aria-hidden="true"></i> Package Checkout &amp; Scheduling';
        }
        if (pkgBanner && pkgNameEl) {
            pkgNameEl.textContent = pkg;
            if (pkgNextStepEl) {
                pkgNextStepEl.textContent = stripeUrl
                    ? 'Click "Pay Instantly via Stripe" to check out now, or submit the form below to request Wise/PayPal or confirm times first.'
                    : 'Enter your name, email, and time zone below—I will send your Stripe Payment Link (or Wise/PayPal details on request) and confirm your schedule.';
            }
            if (stripeBtn) {
                if (stripeUrl) {
                    stripeBtn.href = stripeUrl;
                    stripeBtn.classList.remove('hidden');
                } else {
                    stripeBtn.classList.add('hidden');
                }
            }
            pkgBanner.classList.remove('hidden');
        }
        if (submitBtn) {
            submitBtn.innerHTML = pkg.includes('Async')
                ? 'Request £29 Stripe Link &amp; Upload Details &rarr;'
                : 'Request Payment Link &amp; Schedule &rarr;';
        }
        if (enquiryCard) {
            enquiryCard.classList.add('border-emerald-400/70', 'ring-2', 'ring-emerald-400/25');
            enquiryCard.classList.remove('border-slate-700');
        }
        if (messageInput) {
            messageInput.placeholder = pkg.includes('Async')
                ? 'Tell me which exam (IELTS, C1, C2) or business task you are submitting (let me know if you prefer Stripe, Wise, or PayPal)...'
                : 'Let me know your target exam or goal, your time zone, preferred days/times, and if you prefer Stripe, Wise, or PayPal...';
        }
        setTimeout(() => {
            if (enquiryCard) {
                enquiryCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (nameInput) nameInput.focus({ preventScroll: true });
        }, 250);
    };

    const urlPkg = urlParams.get('package');
    if (urlPkg) {
        applyPackagePrefill(urlPkg, urlParams.get('tier') || '');
    }

    const clearPackageBtn = document.getElementById('clear-package-btn');
    if (clearPackageBtn) {
        clearPackageBtn.addEventListener('click', () => {
            const goalInput = document.getElementById('goal');
            const messageInput = document.getElementById('message');
            const subjectInput = document.querySelector('#contact-form input[name="_subject"]');
            const formTitle = document.getElementById('enquiry-form-title');
            const formSubtitle = document.getElementById('enquiry-form-subtitle');
            const formBadge = document.getElementById('enquiry-form-badge');
            const pkgBanner = document.getElementById('selected-package-banner');
            const stripeBtn = document.getElementById('selected-package-stripe-link');
            const submitBtn = document.getElementById('contact-submit-btn');
            const enquiryCard = document.getElementById('enquiry-card');

            if (goalInput) {
                goalInput.value = '';
                goalInput.classList.remove('ring-2', 'ring-emerald-400', 'border-emerald-400', 'ring-sky-400', 'border-sky-400');
            }
            if (subjectInput) subjectInput.value = 'New Student Enquiry (Website)';
            if (formTitle) formTitle.textContent = 'Ask a Question or Reserve a Lesson Pack';
            if (formSubtitle) formSubtitle.textContent = 'Select a lesson pack above or let me know your goals below—pay via Stripe Payment Link (or request Wise/PayPal).';
            if (formBadge) {
                formBadge.className = 'hidden items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 mb-2';
            }
            if (stripeBtn) stripeBtn.classList.add('hidden');
            if (pkgBanner) pkgBanner.classList.add('hidden');
            if (submitBtn) submitBtn.innerHTML = 'Send Message &rarr;';
            if (enquiryCard) {
                enquiryCard.classList.remove('border-emerald-400/70', 'ring-2', 'ring-emerald-400/25');
                enquiryCard.classList.add('border-slate-700');
            }
            if (messageInput) {
                messageInput.placeholder = 'Tell me a bit about your current level, goals, and time zone...';
            }
        });
    }

    document.querySelectorAll('[data-prefill-package]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pkg = btn.getAttribute('data-prefill-package');
            const tierKey = btn.getAttribute('data-tier') || '';
            if (pkg) {
                e.preventDefault();
                applyPackagePrefill(pkg, tierKey);
            }
        });
    });
})();

/* === HOMEPAGE INTERACTIVE WRITING MARKUP MODULE (EVENT DELEGATED & ACCESSIBLE) === */
(() => {
  const markupSection = document.getElementById('gareth-writing-markup');
  if (document.getElementById('essay-canvas-body') || document.getElementById('essay-display-area')) {
    const WRITING_SAMPLES = {
        "c1": {
          "title": "Cambridge C1 Advanced (CAE) — Part 1 Essay",
          "prompt": "Discuss two ways governments can encourage people to use public transport instead of private cars, and evaluate which is more effective.",
          "draftBadge": "Student Draft (Solid B2 — 172/210)",
          "markupBadge": "Gareth's Line-by-Line Markup",
          "polishedBadge": "Polished C1/C2 Pass (204/210 — Grade A)",
          "cefrShift": "CEFR B2 → C1/C2",
          "splitBeforeBadge": "CEFR B2 (172/210)",
          "splitAfterBadge": "C1/C2 (204/210)",
          "scorePills": [
            { "label": "Content", "before": "3/5", "after": "5/5" },
            { "label": "Communicative Achievement", "before": "2/5", "after": "5/5" },
            { "label": "Organisation", "before": "2/5", "after": "5/5" },
            { "label": "Language", "before": "2/5", "after": "5/5" }
          ],
          "verdict": "Your argument is clear and logical, which comfortably passes at B2. To reach Grade A (200+ on the Cambridge scale), we need to replace everyday verbs like 'make tickets cheaper' with natural C1 noun phrases ('subsidising fares') and show confident control of complex structures like negative inversion.",
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
          "markupBadge": "Gareth's Band 8.0+ Upgrade",
          "polishedBadge": "Polished Band 8.0+ Paragraph",
          "cefrShift": "Band 6.5 → Band 8.0+",
          "splitBeforeBadge": "Band 6.5",
          "splitAfterBadge": "Band 8.0+",
          "scorePills": [
            { "label": "Task Response", "before": "6.5", "after": "8.0" },
            { "label": "Coherence & Cohesion", "before": "6.0", "after": "8.0" },
            { "label": "Lexical Resource", "before": "6.0", "after": "8.5" },
            { "label": "Grammatical Range & Accuracy", "before": "6.5", "after": "8.0" }
          ],
          "verdict": "Many capable professionals get stuck at Band 6.5 in Writing because they rely on memorised 'template' openings and sweeping claims. Here, we introduce academic hedging ('arguably') and precise topic vocabulary so your writing reads naturally at a Band 8.0+ level.",
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
            { "label": "Clarity & Impact", "before": "6/10", "after": "9.5/10" },
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

        document.getElementById('task-prompt-text').textContent = `"${sample.prompt}"`;
        document.getElementById('gareth-verdict-text').textContent = sample.verdict;
        document.getElementById('doc-cefr-badge').textContent = sample.cefrShift;

        const pillsContainer = document.getElementById('score-pills-container');
        pillsContainer.innerHTML = `<span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-200/90 text-slate-700">Illustrative Example</span>` + sample.scorePills.map(pill => `
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-xs">
            <span class="text-slate-500 font-medium">${pill.label}:</span>
            <span class="text-rose-600 line-through font-mono text-xs">${pill.before}</span>
            <span class="text-slate-400" aria-hidden="true">&rarr;</span>
            <span class="text-emerald-700 font-bold font-mono text-xs bg-emerald-50 px-1.5 py-0.5 rounded">${pill.after}</span>
          </div>
        `).join('');

        const statusBadge = document.getElementById('doc-status-badge');
        const legend = document.getElementById('markup-legend');
        if (currentViewMode === 'draft') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-500"></span> ${sample.draftBadge}`;
          legend.classList.add('opacity-50');
        } else if (currentViewMode === 'markup') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-600"></span> ${sample.markupBadge}`;
          legend.classList.remove('opacity-50');
        } else if (currentViewMode === 'polished') {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-600"></span> ${sample.polishedBadge}`;
          legend.classList.add('opacity-50');
        } else {
          statusBadge.className = "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300";
          statusBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-indigo-600"></span> Side-by-Side Comparison`;
          legend.classList.add('opacity-50');
        }

        const canvasBody = document.getElementById('essay-canvas-body');
        if (currentViewMode === 'split') {
          canvasBody.innerHTML = renderSplitView(sample);
        } else {
          canvasBody.innerHTML = `<p class="leading-relaxed">${renderParagraphSegments(sample.segments, currentViewMode)}</p>`;
        }

        renderCommentaryCards(sample);
      }

      function renderParagraphSegments(segments, mode) {
        return segments.map(seg => {
          if (seg.type === 'text') {
            return `<span>${seg.content}</span>`;
          }
          const isActive = seg.id === activeAnnotationId;
          const activeClass = isActive ? 'active-annotation' : '';
          const summaryLabel = escapeAttr(`Feedback ${seg.id} (${seg.category}): Draft phrase '${seg.before}' upgraded to '${seg.after}'`);
          const a11yAttrs = `data-note-id="${seg.id}" role="button" tabindex="0" aria-pressed="${isActive}" aria-describedby="note-card-${seg.id}" aria-label="${summaryLabel}"`;

          if (mode === 'draft') {
            return `<span class="draft-weakness ${activeClass}" ${a11yAttrs}>${seg.before}<span class="markup-badge" aria-hidden="true">${seg.id}</span></span>`;
          } else if (mode === 'polished') {
            return `<span class="polished-highlight ${activeClass}" ${a11yAttrs}>${seg.after}<span class="markup-badge" aria-hidden="true">${seg.id}</span></span>`;
          } else {
            return `<span class="markup-group ${activeClass}" ${a11yAttrs}><del class="markup-del" aria-hidden="true">${seg.before}</del><ins class="markup-ins no-underline" aria-hidden="true">${seg.after}</ins><span class="markup-badge" aria-hidden="true">${seg.id}</span></span>`;
          }
        }).join('');
      }

      function renderSplitView(sample) {
        const beforeHtml = renderParagraphSegments(sample.segments, 'draft');
        const afterHtml = renderParagraphSegments(sample.segments, 'polished');
        const shiftParts = (sample.cefrShift || '').split(' → ');
        const beforeBadge = sample.splitBeforeBadge || shiftParts[0] || 'B2';
        const afterBadge = sample.splitAfterBadge || shiftParts[1] || 'C1/C2';
        return `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5 text-base">
            <div class="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80">
              <div class="text-xs font-sans font-bold uppercase tracking-wider text-rose-700 mb-2 flex items-center justify-between">
                <span>Before: Student Draft</span>
                <span class="font-mono text-xs bg-rose-100 px-2 py-0.5 rounded">${beforeBadge}</span>
              </div>
              <p class="text-[1rem] leading-relaxed text-slate-700">${beforeHtml}</p>
            </div>
            <div class="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80">
              <div class="text-xs font-sans font-bold uppercase tracking-wider text-emerald-800 mb-2 flex items-center justify-between">
                <span>After: Polished Upgrade</span>
                <span class="font-mono text-xs bg-emerald-100 px-2 py-0.5 rounded">${afterBadge}</span>
              </div>
              <p class="text-[1rem] leading-relaxed text-slate-900">${afterHtml}</p>
            </div>
          </div>
        `;
      }

      function renderCommentaryCards(sample) {
        const annotations = sample.segments.filter(s => s.type === 'annotation');
        const container = document.getElementById('commentary-cards-container');

        container.innerHTML = annotations.map(note => {
          const isActive = note.id === activeAnnotationId;
          return `
            <div id="note-card-${note.id}"
                 data-note-id="${note.id}"
                 role="button"
                 tabindex="0"
                 aria-pressed="${isActive}"
                 aria-label="Mark-scheme note ${note.id}: ${escapeAttr(note.category)}"
                 class="note-card cursor-pointer rounded-xl p-4 bg-white border ${isActive ? 'active-card' : 'border-slate-200/90 hover:border-indigo-300'}">
              <div class="flex items-center justify-between gap-2 mb-2">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'} font-bold text-xs flex items-center justify-center transition-colors">
                    ${note.id}
                  </span>
                  <span class="font-bold text-xs sm:text-sm text-slate-900">${note.category}</span>
                </div>
                <span class="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                  ${note.criterion}
                </span>
              </div>

              <div class="bg-slate-50 rounded-lg p-3 mb-2.5 border border-slate-200/60 text-sm space-y-1.5">
                <div class="flex items-start gap-1.5 text-rose-700">
                  <span class="font-bold shrink-0" aria-hidden="true">✗</span>
                  <span class="line-through opacity-85">"${note.before}"</span>
                </div>
                <div class="flex items-start gap-1.5 text-emerald-800 font-medium">
                  <span class="font-bold shrink-0" aria-hidden="true">✓</span>
                  <span>"${note.after}"</span>
                </div>
              </div>

              <p class="text-sm text-slate-600 leading-relaxed">
                <strong class="text-slate-800">Why it scores higher:</strong> ${note.why}
              </p>
            </div>
          `;
        }).join('');
      }

      function switchContext(contextKey) {
        if (!WRITING_SAMPLES[contextKey]) return;
        currentContextKey = contextKey;
        activeAnnotationId = 1;

        ['c1', 'ielts', 'business'].forEach(key => {
          const btn = document.getElementById(`tab-${key}`);
          if (!btn) return;
          if (key === contextKey) {
            btn.className = "context-tab active-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 bg-indigo-600 text-white shadow-sm";
            btn.setAttribute('aria-selected', 'true');
          } else {
            btn.className = "context-tab px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 text-slate-300 hover:text-white hover:bg-slate-800";
            btn.setAttribute('aria-selected', 'false');
          }
        });

        const tabpanel = document.getElementById('writing-tabpanel');
        if (tabpanel) tabpanel.setAttribute('aria-labelledby', 'tab-' + contextKey);
        renderComponent();
      }

      function switchViewMode(mode) {
        currentViewMode = mode;

        ['draft', 'markup', 'polished', 'split'].forEach(m => {
          const btn = document.getElementById(`mode-${m}`);
          if (!btn) return;
          const isSelected = m === mode;
          btn.setAttribute('aria-pressed', String(isSelected));
          if (isSelected) {
            btn.className = m === 'split'
              ? "view-mode-btn hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm"
              : "view-mode-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-slate-900 shadow-sm";
          } else {
            btn.className = m === 'split'
              ? "view-mode-btn hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white"
              : "view-mode-btn px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-300 hover:text-white";
          }
        });

        renderComponent();
      }

      function selectAnnotation(id) {
        activeAnnotationId = id;
        updateHighlightStates(true);
      }

      // Expose globals for backwards compatibility if any external script calls them
      window.switchContext = switchContext;
      window.switchViewMode = switchViewMode;
      window.selectAnnotation = selectAnnotation;

      // Event Delegation for Context Tabs, View Mode Buttons, and Annotations
      if (markupSection) {
        markupSection.addEventListener('click', (e) => {
          const contextBtn = e.target.closest('[data-context-tab]');
          if (contextBtn) {
            switchContext(contextBtn.getAttribute('data-context-tab'));
            return;
          }
          const modeBtn = e.target.closest('[data-view-mode]');
          if (modeBtn) {
            switchViewMode(modeBtn.getAttribute('data-view-mode'));
            return;
          }
          const noteEl = e.target.closest('[data-note-id]');
          if (noteEl) {
            const noteId = parseInt(noteEl.getAttribute('data-note-id'), 10);
            if (!isNaN(noteId)) selectAnnotation(noteId);
          }
        });

        markupSection.addEventListener('keydown', (e) => {
          const noteEl = e.target.closest('[data-note-id]');
          if (noteEl && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            const noteId = parseInt(noteEl.getAttribute('data-note-id'), 10);
            if (!isNaN(noteId)) selectAnnotation(noteId);
            return;
          }
          const contextBtn = e.target.closest('[data-context-tab]');
          if (contextBtn && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
            e.preventDefault();
            const keys = ['c1', 'ielts', 'business'];
            const idx = keys.indexOf(contextBtn.getAttribute('data-context-tab'));
            const nextIdx = e.key === 'ArrowRight' ? (idx + 1) % keys.length : (idx - 1 + keys.length) % keys.length;
            const nextKey = keys[nextIdx];
            switchContext(nextKey);
            const nextTab = document.getElementById('tab-' + nextKey);
            if (nextTab) nextTab.focus();
          }
        });
      }

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

      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', renderComponent);
      } else {
        renderComponent();
      }
  }
})();

(() => {
  'use strict';
  window.switchResourceTab = function switchResourceTab(tabKey) {
    const keys = ['modules', 'games', 'guides'];
    keys.forEach((key) => {
      const btn = document.getElementById('res-tab-' + key);
      const panel = document.getElementById('res-panel-' + key);
      const isActive = key === tabKey;
      if (btn) {
        btn.setAttribute('aria-selected', String(isActive));
        btn.className = isActive
          ? 'res-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all bg-white text-slate-900 shadow-sm cursor-pointer'
          : 'res-tab-btn px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-slate-600 hover:text-slate-900 cursor-pointer';
      }
      if (panel) {
        panel.classList.toggle('hidden', !isActive);
      }
    });
  };

  window.filterLabs = function filterLabs(level, btn) {
    document.querySelectorAll('.lab-filter-btn, #exam-lab .filter-btn').forEach(function(b) {
      b.classList.remove('active', 'bg-brand-600', 'text-white', 'shadow-sm');
      if (b.classList.contains('lab-filter-btn')) {
        b.classList.add('bg-white', 'text-slate-600', 'border', 'border-slate-200');
      }
    });
    if (btn) {
      btn.classList.add('active');
      if (btn.classList.contains('lab-filter-btn')) {
        btn.classList.remove('bg-white', 'text-slate-600', 'border', 'border-slate-200');
        btn.classList.add('bg-brand-600', 'text-white', 'shadow-sm');
      }
    }

    document.querySelectorAll('.lab-card').forEach(function(card) {
      const cardLevel = card.getAttribute('data-level') || '';
      if (level === 'all' || cardLevel === level || cardLevel.indexOf(level) !== -1) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  };

  // Automatically switch to the matching tab when navigating to #exam-lab or #interactive-tools
  document.querySelectorAll('a[href="#exam-lab"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof window.switchResourceTab === 'function') window.switchResourceTab('modules');
    });
  });
  document.querySelectorAll('a[href="#interactive-tools"]').forEach(function(link) {
    link.addEventListener('click', function() {
      if (typeof window.switchResourceTab === 'function') window.switchResourceTab('games');
    });
  });

  if (window.location.hash === '#interactive-tools') {
    window.switchResourceTab('games');
  } else if (window.location.hash === '#study-guides') {
    window.switchResourceTab('guides');
  }
})();

// Lazy-load Cal.com only when #contact approaches the viewport
(function() {
  const calEl = document.getElementById('my-cal-inline');
  const fallbackCard = document.getElementById('cal-fallback-card');
  if (!calEl) return;

  calEl.classList.remove('pointer-events-none');
  calEl.classList.add('pointer-events-auto');

  let calLoaded = false;

  function initCalEmbed() {
    if (calLoaded) return;
    calLoaded = true;
    calEl.classList.remove('pointer-events-none');
    calEl.classList.add('pointer-events-auto');

    (function (C, A, L) {
      let p = function (a, ar) { a.q.push(ar); };
      let d = C.document;
      C.Cal = C.Cal || function () {
        let cal = C.Cal;
        let ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement("script")).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === "string") {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ["initNamespace", namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");

    Cal("init", { origin: "https://cal.com" });
    Cal("inline", {
      elementOrSelector: "#my-cal-inline",
      calLink: "gareth-montgomery-jgaefz/30min",
      layout: "month_view"
    });
    Cal("ui", {
      styles: { branding: { brandColor: "#0284c7" } },
      hideEventTypeDetails: false,
      layout: "month_view"
    });

    const checkState = function() {
      const mountedEmbed = calEl.querySelector('iframe, cal-inline');
      if (mountedEmbed) {
        calEl.classList.remove('pointer-events-none');
        calEl.classList.add('pointer-events-auto');
        if (fallbackCard) fallbackCard.style.display = 'none';
      }
      if (calEl.textContent && (calEl.textContent.includes('Something went wrong') || calEl.textContent.includes('enable JavaScript'))) {
        const existingIframe = calEl.querySelector('iframe, cal-inline');
        if (!existingIframe && fallbackCard) {
          calEl.innerHTML = '';
          fallbackCard.style.display = 'flex';
          calEl.appendChild(fallbackCard);
        }
      }
    };

    const mutationObserver = new MutationObserver(checkState);
    mutationObserver.observe(calEl, { childList: true, subtree: true, characterData: true });
  }

  if ('IntersectionObserver' in window) {
    const viewportObserver = new IntersectionObserver(function(entries) {
      if (entries[0].isIntersecting) {
        initCalEmbed();
        viewportObserver.disconnect();
      }
    }, { rootMargin: '400px 0px' });
    viewportObserver.observe(calEl);
  } else {
    initCalEmbed();
  }

  document.querySelectorAll('a[href="#contact"], a[href="#booking"], a[href="#cal-embed"], a[href="#book-diagnostic"]').forEach(function(link) {
    link.addEventListener('mouseenter', initCalEmbed, { once: true });
    link.addEventListener('click', initCalEmbed, { once: true });
  });
})();
