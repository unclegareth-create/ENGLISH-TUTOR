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

    /* ---------- Form Success Handling ---------- */
    // If we've just been redirected from FormSubmit
    if (window.location.search.includes('submitted=true')) {
        const formStatus = document.getElementById('form-status');
        const leadForm = document.getElementById('lead-form');
        
        if (formStatus) {
            formStatus.innerHTML = '<div class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-semibold">Message sent successfully! I will be in touch shortly.</div>';
        } else if (leadForm) {
            const msg = document.createElement('div');
            msg.className = 'bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm font-semibold';
            msg.textContent = 'Message sent successfully! I will be in touch shortly.';
            leadForm.parentNode.insertBefore(msg, leadForm);
        }
        
        // Clean up the URL
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
    }
})();