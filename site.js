/* ==========================================================
   Shared behaviour for the tutor landing pages (index.html, web.html)
   - Accessible mobile menu
   - Contact form: submitted natively by the browser to FormSubmit
     (no JavaScript involved), so it works from any host.
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
        // If the window grows past the mobile breakpoint, reset the menu.
        window.matchMedia('(min-width: 768px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
    }

    /* ---------- Contact form ---------- */
    // We intentionally let the browser handle form submission natively 
    // to ensure formsubmit.co handles spam, captchas, and delivery reliably.
})();
