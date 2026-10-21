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
        pack_5_375: '',
        pack_5_275: '',     // e.g. 'https://buy.stripe.com/...' (5-Lesson Pack - £275)
        sprint_10_650: '',
        sprint_10_500: '',  // e.g. 'https://buy.stripe.com/...' (10-Lesson Pack - £500)
        pack_12_780: '',
        pack_12_600: '',    // e.g. 'https://buy.stripe.com/...' (12-Lesson Pack - £600)
        vip_12_600: '',     // legacy alias
        single_85: '',
        single_65: '',      // e.g. 'https://buy.stripe.com/...' (Single Session - £65)
        audit_async_39: '',
        audit_async_29: ''  // e.g. 'https://buy.stripe.com/...' (Written Essay Audit - £29)
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
        const isAudit = pkg.includes('Audit') || pkg.includes('Async');

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
            formSubtitle.textContent = isAudit
                ? 'Complete your details below for your £39 Stripe Payment Link and Google Doc essay upload instructions (Wise or PayPal also available on request).'
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
            submitBtn.innerHTML = isAudit
                ? 'Request £39 Stripe Link &amp; Upload Details &rarr;'
                : 'Request Payment Link &amp; Schedule &rarr;';
        }
        if (enquiryCard) {
            enquiryCard.classList.add('border-emerald-400/70', 'ring-2', 'ring-emerald-400/25');
            enquiryCard.classList.remove('border-slate-700');
        }
        if (messageInput) {
            messageInput.placeholder = isAudit
                ? 'Tell me which exam (IELTS, C1, C2) or professional writing task you are submitting (let me know if you prefer Stripe, Wise, or PayPal)...'
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

/* === INTERACTIVE WRITING MARKUP SUITE ===
   Decoupled into writing-feedback.js and dedicated to how-i-mark.html
   for optimal landing page performance and modular architecture. === */
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
