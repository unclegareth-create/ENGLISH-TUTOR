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
        window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- Copyright Year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = String(new Date().getFullYear());
    }

    /* ---------- Form Success Handling ---------- */
    // If we've just been redirected from FormSubmit
    if (window.location.search.includes('submitted=true')) {
        const formStatus = document.getElementById('form-status');
        const targetForm = document.getElementById('lead-form') || document.getElementById('contact-form');
        const successMsg = "Thank you! I'll reply within 24 hours to schedule your trial lesson.";

        const createAlertBox = () => {
            const div = document.createElement('div');
            div.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-semibold';
            div.textContent = successMsg;
            return div;
        };

        if (formStatus) {
            formStatus.textContent = '';
            formStatus.appendChild(createAlertBox());
        } else if (targetForm && targetForm.parentNode) {
            targetForm.parentNode.insertBefore(createAlertBox(), targetForm);
        }

        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }

    /* ---------- Sticky Mobile CTA visibility ---------- */
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
            const contactForm = document.getElementById('contact-form');
            if (goalInput && pkg) {
                goalInput.value = pkg;
                if (contactForm) {
                    setTimeout(() => {
                        contactForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        goalInput.focus();
                        goalInput.classList.add('ring-2', 'ring-sky-400');
                        setTimeout(() => goalInput.classList.remove('ring-2', 'ring-sky-400'), 2200);
                    }, 60);
                }
            }
        });
    });
})();