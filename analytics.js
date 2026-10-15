/* ==========================================================
   Analytics + click tracking (GoatCounter)
   ----------------------------------------------------------
   GoatCounter is free for personal sites and sets NO cookies,
   so no cookie-consent banner is needed under UK/EU rules.

   TO SWITCH ON:
     1. Sign up at https://www.goatcounter.com/signup
     2. Choose a site code, e.g. "garethenglish"
        (your dashboard will be https://garethenglish.goatcounter.com)
     3. Put that code between the quotes below and re-upload this file.

   While the code is empty, this file does nothing at all.

   What gets tracked (visible under "Events" in the dashboard):
     - every page view (automatic)
     - clicks on any Preply booking button   -> "preply: <button text>"
     - clicks through to the Grammar Crypt game -> "game: <page>"
     - clicks on an article from the blog      -> "article: <page>"
   GoatCounter ignores visits from your own computer (file:// and
   localhost), so testing locally will not pollute your numbers.
   ========================================================== */
(() => {
    'use strict';

    const GOATCOUNTER_CODE = 'garethenglish';   // <-- Registered GoatCounter site code

    if (!GOATCOUNTER_CODE) return;

    // Load the GoatCounter counter script.
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://gc.zgo.at/count.js';
    s.dataset.goatcounter = `https://${GOATCOUNTER_CODE}.goatcounter.com/count`;
    document.head.appendChild(s);

    // Events clicked before the counter script has loaded are queued, then sent.
    const queue = [];
    const send = (name) => {
        const gc = window.goatcounter;
        if (gc && typeof gc.count === 'function') {
            gc.count({ path: name, title: name, event: true });
        } else {
            queue.push(name);
        }
    };
    s.addEventListener('load', () => { while (queue.length) send(queue.shift()); });

    const label = (el) => (el.textContent || el.getAttribute('aria-label') || '')
        .replace(/\s+/g, ' ').trim().slice(0, 60) || 'link';
    const page = (href) => href.split('/').pop().split(/[?#]/)[0] || 'index.html';

    // One delegated listener covers every link on the page, including the mobile menu.
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[href]');
        if (!a) return;
        const href = a.getAttribute('href');

        if (href === '#contact' || href.includes('#contact')) {
            send(`booking-cta: ${label(a)}`);
        } else if (href.includes('cal.com/gareth-montgomery-jgaefz')) {
            send('booking-external: cal.com');
        } else if (/(^|\/)(fce-friendship-conditionals|cae-essay-builder|cpe-psychometrics-passives)\.html/.test(href)) {
            send(`exam-lab: ${page(href)}`);
        } else if (/(^|\/)(grammar-crypt|reactor|factory|boardroom|phrasal-reactor|word-factory|boardroom-pitch)\.html/.test(href)) {
            send(`game: ${page(href)}`);
        } else if (a.closest('[data-track="articles"]')) {
            send(`article: ${page(href)}`);
        }
    });

    // Form submission tracking
    document.addEventListener('submit', (e) => {
        const form = e.target;
        if (!form) return;
        if (form.closest('#cheat-sheet')) {
            send('lead-magnet: cheat-sheet-download');
        } else if (form.id === 'contact-form' || form.id === 'lead-form') {
            send('contact-form: enquiry-sent');
        }
    });
})();
