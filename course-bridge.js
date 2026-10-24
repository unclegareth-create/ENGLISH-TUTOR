/* ==========================================================================
   course-bridge.js — "Try it through a story" end card
   --------------------------------------------------------------------------
   A small, dependency-free card that closes each free Lab tool with a gentle
   door into Lesson 1 of the Dark Academia C1/C2 course, so no free drill ends
   in a dead end.

   Where the card goes (first match wins):
     1. Any element carrying  data-course-bridge  (optional manual mount).
     2. A known finish panel: the end screen of Phrasal Reactor, Word Factory
        and Boardroom Pitch (#end-screen .modal-content), or the Grammar Crypt
        debrief (#lead-modal .modal-panel).
     3. Just before the page footer.
     4. Otherwise, at the end of <body>.

   When the card stays hidden:
     - On the course pages themselves (Gothic units, course hub, compendium)
       and the Young Learners page.
     - In teacher white-label / clean screen-share mode
       (localStorage gm_teacher_clean_screenshare === 'true', ?wl=1,
       or body.gm-clean-screenshare). If clean mode switches on later,
       the card removes itself.

   Tracking: clicks are forwarded to GoatCounter (if loaded) as
     course-bridge/<page-slug>/lesson-1
     course-bridge/<page-slug>/full-course
   and to window.trackFunnelEvent('course_bridge_clicked', ...) if present.
   ========================================================================== */
(() => {
    'use strict';

    const CARD_ID = 'gm-course-bridge';
    const STYLE_ID = 'gm-course-bridge-styles';
    const CLEAN_KEY = 'gm_teacher_clean_screenshare';
    const LESSON_ONE = 'dracula-unit1-carpathian-threshold.html';
    const COURSE_HUB = 'dark-academia-index.html';

    const path = (window.location.pathname || '').toLowerCase();

    // Never on the course itself, the compendium, or the Young Learners page.
    const EXCLUDED_RE = /(^|\/)((dracula|frankenstein|jekyll|baskerville|alice)-unit\d+[^/]*|dark-academia[^/]*|the-gothic-canon[^/]*|professor-west-study[^/]*)$/i;
    if (EXCLUDED_RE.test(path)) return;

    const slug = ((path.split('/').pop() || '').split(/[?#]/)[0].replace(/\.html?$/i, '')) || 'index';

    const isCleanMode = () => {
        try {
            if (localStorage.getItem(CLEAN_KEY) === 'true') return true;
        } catch (e) {}
        try {
            if (new URLSearchParams(window.location.search).get('wl') === '1') return true;
        } catch (e) {}
        return !!(document.body && document.body.classList.contains('gm-clean-screenshare'));
    };

    const track = (target) => {
        const name = `course-bridge/${slug}/${target}`;
        const gc = window.goatcounter;
        if (gc && typeof gc.count === 'function') {
            try { gc.count({ path: name, title: name, event: true }); } catch (e) {}
        }
        if (typeof window.trackFunnelEvent === 'function') {
            try { window.trackFunnelEvent('course_bridge_clicked', { tier: 'gothic_canon_24', from_free_tool: slug, target: target }); } catch (e) {}
        }
    };

    const injectStyles = () => {
        if (document.getElementById(STYLE_ID)) return;
        const css = `
#${CARD_ID}{box-sizing:border-box;max-width:720px;margin:48px auto;padding:28px 28px 24px;
  background:#1a1613;border:1px solid #3a3026;border-top:3px solid #c9a24a;border-radius:10px;
  color:#f4efe6;text-align:left;box-shadow:0 12px 32px rgba(0,0,0,.35);
  font-family:"EB Garamond","Cormorant Garamond",Georgia,"Times New Roman",serif;line-height:1.55;}
#${CARD_ID} *{box-sizing:border-box;}
#${CARD_ID} .gmcb-eyebrow{margin:0 0 6px;font:600 .72rem/1.3 "Plus Jakarta Sans",system-ui,sans-serif;
  letter-spacing:.14em;text-transform:uppercase;color:#c9a24a;}
#${CARD_ID} .gmcb-title{margin:0 0 10px;font:700 1.5rem/1.25 "Playfair Display",Georgia,serif;color:#f5ebd6;}
#${CARD_ID} .gmcb-text{margin:0 0 20px;font-size:1.08rem;color:#d8cfc0;}
#${CARD_ID} .gmcb-actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center;}
#${CARD_ID} a.gmcb-btn{display:inline-block;padding:11px 20px;border-radius:6px;text-decoration:none;
  font:700 .92rem/1.2 "Plus Jakarta Sans",system-ui,sans-serif;letter-spacing:.01em;transition:background-color .2s,border-color .2s,color .2s;}
#${CARD_ID} a.gmcb-primary{background:#c9a24a;color:#14110d;border:1px solid #c9a24a;}
#${CARD_ID} a.gmcb-primary:hover{background:#dbb663;border-color:#dbb663;}
#${CARD_ID} a.gmcb-secondary{background:transparent;color:#f5ebd6;border:1px solid #5a4a38;}
#${CARD_ID} a.gmcb-secondary:hover{border-color:#c9a24a;color:#fff;}
#${CARD_ID} a.gmcb-btn:focus-visible{outline:2px solid #f5ebd6;outline-offset:3px;}
#${CARD_ID}.gmcb-compact{margin:20px 0 8px;padding:18px 18px 16px;box-shadow:none;text-align:center;}
#${CARD_ID}.gmcb-compact .gmcb-title{font-size:1.15rem;}
#${CARD_ID}.gmcb-compact .gmcb-text{font-size:.98rem;margin-bottom:14px;}
#${CARD_ID}.gmcb-compact .gmcb-actions{justify-content:center;}
.gmcb-host-scroll{max-height:92vh;overflow-y:auto;}
@media (max-width:560px){
  #${CARD_ID}{margin:32px 14px;padding:22px 18px 18px;}
  #${CARD_ID} .gmcb-title{font-size:1.25rem;}
  #${CARD_ID} a.gmcb-btn{flex:1 1 100%;text-align:center;}
}
@media print{#${CARD_ID}{display:none !important;}}`;
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = css;
        document.head.appendChild(style);
    };

    const el = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text) node.textContent = text;
        return node;
    };

    const buildCard = (compact) => {
        const card = el('aside', compact ? 'gmcb-compact' : '');
        card.id = CARD_ID;
        card.setAttribute('aria-labelledby', 'gmcb-title');

        card.appendChild(el('p', 'gmcb-eyebrow', 'The Dark Academia Course'));

        const title = el('h2', 'gmcb-title', 'Enjoyed this? Try it through a story');
        title.id = 'gmcb-title';
        card.appendChild(title);

        card.appendChild(el('p', 'gmcb-text',
            'I teach the same C1/C2 grammar through Dracula, Frankenstein, Jekyll & Hyde, ' +
            'The Hound of the Baskervilles and Alice \u2014 real extracts, unpicked clause by clause. ' +
            'Lesson 1 is free, so you can see whether it suits you.'));

        const actions = el('div', 'gmcb-actions');

        const primary = el('a', 'gmcb-btn gmcb-primary', 'Start Lesson 1 free');
        primary.href = LESSON_ONE;
        primary.addEventListener('click', () => track('lesson-1'));

        const secondary = el('a', 'gmcb-btn gmcb-secondary', 'See the full course (\u00a324)');
        secondary.href = COURSE_HUB;
        secondary.addEventListener('click', () => track('full-course'));

        actions.appendChild(primary);
        actions.appendChild(secondary);
        card.appendChild(actions);
        return card;
    };

    const mount = () => {
        if (!document.body || document.getElementById(CARD_ID) || isCleanMode()) return;
        injectStyles();

        // 1. Manual mount point.
        const manual = document.querySelector('[data-course-bridge]');
        if (manual) {
            manual.appendChild(buildCard(manual.hasAttribute('data-course-bridge-compact')));
            return;
        }

        // 2. Known finish panels inside the arcade games.
        const finish = document.querySelector('#end-screen .modal-content, #lead-modal .modal-panel');
        if (finish) {
            finish.classList.add('gmcb-host-scroll');
            finish.appendChild(buildCard(true));
            return;
        }

        // 3. Just before the page footer; 4. otherwise the end of the page.
        const footers = document.querySelectorAll('body > footer, footer');
        const footer = footers.length ? footers[footers.length - 1] : null;
        const card = buildCard(false);
        if (footer && footer.parentNode) {
            footer.parentNode.insertBefore(card, footer);
        } else {
            document.body.appendChild(card);
        }
    };

    // Remove the card if a teacher switches clean screen-share on mid-lesson.
    const watchCleanMode = () => {
        const removeIfClean = () => {
            if (!isCleanMode()) return;
            const card = document.getElementById(CARD_ID);
            if (card) card.remove();
        };
        try {
            new MutationObserver(removeIfClean).observe(document.body, { attributes: true, attributeFilter: ['class'] });
        } catch (e) {}
        window.addEventListener('storage', (e) => { if (e.key === CLEAN_KEY) removeIfClean(); });
    };

    const start = () => { mount(); if (document.body) watchCleanMode(); };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
