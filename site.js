/* ==========================================================
   Shared behaviour for the tutor landing pages
   ========================================================== */
(() => {
    'use strict';

    /* ---------- Mobile menu ---------- */
    const btn = document.getElementById('menu-btn');
    const menu = document.getElementById('mobile-menu');

    if (btn && menu) {
        const icon = btn.querySelector('i');
        const setOpen = (open) => {
            menu.classList.toggle('hidden', !open);
            btn.setAttribute('aria-expanded', String(open));
            btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
            if (icon) icon.className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
        };

        btn.addEventListener('click', () => setOpen(menu.classList.contains('hidden')));
        menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !menu.classList.contains('hidden')) { setOpen(false); btn.focus(); }
        });
        window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- Copyright Year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* ---------- Form Success Handling ---------- */
    // If we've just been redirected from FormSubmit
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('submitted') === 'true') {
        const formStatus = document.getElementById('form-status');
        const targetForm = document.getElementById('lead-form') || document.getElementById('contact-form');
        const successMsg = "Thank you! I'll reply within 24 hours to schedule your trial lesson.";

        const createAlertBox = () => {
            const div = document.createElement('div');
            div.className = 'bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl mb-4 text-sm font-semibold shadow-sm flex items-center gap-3';
            div.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-lg"></i> <span>' + successMsg + '</span>';
            return div;
        };

        if (formStatus) {
            formStatus.textContent = '';
            formStatus.appendChild(createAlertBox());
        } else if (targetForm && targetForm.parentNode) {
            targetForm.parentNode.insertBefore(createAlertBox(), targetForm);
        }

        setTimeout(() => {
            const target = document.getElementById('contact') || targetForm;
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    if (urlParams.get('subscribed') === 'true') {
        const cheatSheetSection = document.getElementById('cheat-sheet');
        const cheatSheetForm = cheatSheetSection ? cheatSheetSection.querySelector('form') : null;

        const createSubAlertBox = () => {
            const div = document.createElement('div');
            div.className = 'bg-emerald-500/20 border border-emerald-400 text-emerald-100 px-5 py-4 rounded-xl mb-4 text-sm shadow-sm text-left max-w-lg mx-auto space-y-2.5';
            div.innerHTML =
                '<div class="flex items-center gap-2.5 font-bold text-emerald-300">' +
                '<i class="fa-solid fa-circle-check text-emerald-400 text-lg shrink-0"></i>' +
                '<span>Check your inbox! You can also access your guides &amp; PDF immediately below:</span>' +
                '</div>' +
                '<div class="flex flex-wrap gap-2 pt-1 text-xs font-semibold">' +
                '<a href="cpe-inversion.html" class="px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/40 transition">C1/C2 Inversion Guide &rarr;</a>' +
                '<a href="c1-c2-common-mistakes.html" class="px-3 py-1.5 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/40 text-white border border-emerald-400/40 transition">10 Common C1 Mistakes &rarr;</a>' +
                '<a href="ielts-7-syllabus.pdf" target="_blank" rel="noopener" class="px-3 py-1.5 rounded-lg bg-indigo-500/40 hover:bg-indigo-500/60 text-white border border-indigo-400/40 transition"><i class="fa-solid fa-file-pdf mr-1"></i>Download Study Syllabus PDF</a>' +
                '</div>';
            return div;
        };

        if (cheatSheetForm && cheatSheetForm.parentNode) {
            cheatSheetForm.parentNode.insertBefore(createSubAlertBox(), cheatSheetForm);
        }

        setTimeout(() => {
            if (cheatSheetSection) cheatSheetSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

    /* ---------- Pre-fill Package Intent on Inquiry Form ---------- */
    document.querySelectorAll('[data-prefill-package]').forEach(btn => {
        btn.addEventListener('click', () => {
            const pkg = btn.getAttribute('data-prefill-package');
            const goalInput = document.getElementById('goal');
            const messageInput = document.getElementById('message');
            const subjectInput = document.querySelector('#contact-form input[name="_subject"]');
            const nameInput = document.getElementById('name');

            if (goalInput && pkg) {
                goalInput.value = 'Selected Package: ' + pkg;
                goalInput.classList.add('ring-2', 'ring-sky-400', 'border-sky-400');
            }
            if (subjectInput && pkg) {
                subjectInput.value = 'Package Order / Enquiry: ' + pkg;
            }
            if (messageInput && pkg.includes('Async')) {
                messageInput.placeholder = 'Tell me which exam (IELTS, C1, C2) or business task you are submitting, and I will reply with your secure upload & Stripe payment link...';
            }
            setTimeout(() => {
                if (nameInput) nameInput.focus({ preventScroll: true });
            }, 450);
        });
    });
})();