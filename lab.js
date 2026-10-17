/* ==========================================================================
   Gareth English Interactive Lab — Controller (lab.js)
   ========================================================================== */
const LabObservatory = (() => {
  'use strict';

  const SFX_STORAGE_KEY = 'gm_lab_sfx';
  // Default sound effects to OFF unless the user previously enabled them
  let sfxOn = false;
  try {
    sfxOn = localStorage.getItem(SFX_STORAGE_KEY) === 'on';
  } catch (e) {}

  let audioCtx = null;
  let sampleAudio = null;
  let currentGothicIdx = 0;

  const HOLODECK_WORLDS = [
    {
      badge: 'C1/C2 Gothic Course • 12 Lessons',
      title: 'Dark Academia: Bram Stoker’s Dracula & Participle Clauses',
      desc: '18th- and 19th-century oil paintings, British English dramatic narration, and 60 Cambridge Part 4 transformations.',
      img: 'assets/gothic/dracula_carpathian.jpg',
      alt: 'Caspar David Friedrich — Abbey in the Oakwood (1809–1810), illustrating Dracula Lesson 1',
      url: 'dark-academia-index.html',
      quizTag: '⚡ Live 5-Second Challenge (C1 Negative Inversion):',
      prompt: '“_______ had Jonathan Harker crossed the bridge than the wolves began to howl.”',
      options: [
        { text: 'A) No sooner', correct: true, explain: 'Spot on! “No sooner + had + subject + past participle ... than” is a high-scoring C1/C2 negative inversion.' },
        { text: 'B) Hardly when', correct: false, explain: 'Close—remember “Hardly/Scarcely” pairs with “when”, whereas “than” requires “No sooner”!' },
        { text: 'C) Not only', correct: false, explain: '“Not only” pairs with “but also”. For immediate sequence with “than”, use “No sooner”.' }
      ]
    },
    {
      badge: 'Teens B1–B2 • PC-98 Visual Novel + 2d6',
      title: 'CHRONICLE ’88: Neon Alibi 1989 & The Citadel of Echoes',
      desc: 'Interrogate suspects using Past Perfect timelines, roll 2d6 Composure checks, and parry hits with B2 transforms.',
      img: 'assets/arcade/c88_neon_alibi.svg',
      alt: 'Chronicle 88 Tape 01: Neon Alibi 1989 detective interrogation scene',
      url: 'chronicle-88.html',
      quizTag: '⚡ Live 5-Second Alibi Trap (B2 Narrative Tenses):',
      prompt: 'Which suspect was ALREADY out of the room when the 23:15 alarm went off?',
      options: [
        { text: 'A) “When the alarm went off, I left the vault.”', correct: false, explain: 'Past Simple (“I left”) means they left AFTER the alarm sounded—caught red-handed!' },
        { text: 'B) “When the alarm went off, I had left the vault.”', correct: true, explain: 'Correct! Past Perfect (“had left”) proves the action finished BEFORE the 23:15 alarm.' }
      ]
    },
    {
      badge: 'Browser Arcade • 4 Games, 5 Modes',
      title: 'Grammar Crypt (2D/3D), Phrasal Reactor & Word Factory',
      desc: 'Slot C1/C2 syntax runes into order, stabilise phrasal verb particles, or negotiate in The Boardroom Pitch.',
      img: 'assets/arcade/grammar_crypt.svg',
      alt: 'Grammar Crypt dungeon vault with glowing syntax runes and the Arch-Lich boss',
      url: 'grammar-crypt.html',
      quizTag: '⚡ Live Phrasal Reactor Check (C1 Collocations):',
      prompt: '“The new transport policy is expected to bring _______ a major drop in emissions.”',
      options: [
        { text: 'A) about (cause to happen)', correct: true, explain: 'Reactor stabilised! “Bring about” means to cause or produce a significant result.' },
        { text: 'B) around (persuade)', correct: false, explain: '“Bring around” means to persuade someone or restore consciousness. Use “about” (“bring about”) for results!' }
      ]
    },
    {
      badge: 'Young Learners A1–B1 • Interactive 3D Room',
      title: 'Professor West’s 3D Study & Pencil the Cat',
      desc: 'Watch the 4-Act animated intro movie with British storytelling and play 6 word quests inside a 3D room.',
      img: 'assets/study/act4_study.jpg',
      alt: 'Professor West and Pencil the Cat inside the warm mahogany 3D Study',
      url: 'professor-west-study.html?v=6&intro=1',
      quizTag: '⚡ Pencil the Cat’s Word Quest Preview (A2/B1):',
      prompt: 'Which word means “curious and eager to learn new things”?',
      options: [
        { text: 'A) Inquisitive', correct: true, explain: 'Purr-fect! Professor West awards you +10 Golden Scarabs!' },
        { text: 'B) Exhausted', correct: false, explain: '“Exhausted” means very tired. Try “Inquisitive”!' }
      ]
    }
  ];

  const GOTHIC_BOOKS = [
    {
      tag: 'Plate I • Caspar David Friedrich, Abbey in the Oakwood (1809–10)',
      grammar: 'Bram Stoker’s Dracula: Participle Clauses & Negative Inversion',
      img: 'assets/gothic/dracula_carpathian.jpg',
      alt: 'Caspar David Friedrich, Abbey in the Oakwood (1809–1810) — Book I: Dracula',
      audio: 'assets/audio/gothic_act1_dracula.mp3?v=2'
    },
    {
      tag: 'Plate II • Joseph Wright of Derby, Experiment on a Bird in the Air Pump (1768)',
      grammar: 'Mary Shelley’s Frankenstein: Inverted Conditionals & Cleft Sentences',
      img: 'assets/gothic/frankenstein_lab.jpg',
      alt: 'Joseph Wright of Derby, An Experiment on a Bird in the Air Pump (1768) — Book II: Frankenstein',
      audio: 'assets/audio/gothic_act2_frankenstein.mp3?v=2'
    },
    {
      tag: 'Plate III • John Atkinson Grimshaw, Reflections on the Thames (1880)',
      grammar: 'Stevenson’s Dr Jekyll & Mr Hyde: Concessive Clauses & Time Inversion',
      img: 'assets/gothic/jekyll_apothecary.jpg',
      alt: 'John Atkinson Grimshaw, Reflections on the Thames, Westminster (1880) — Book III: Dr Jekyll and Mr Hyde',
      audio: 'assets/audio/gothic_act3_jekyll.mp3?v=2'
    },
    {
      tag: 'Plate IV • Caspar David Friedrich, Two Men Contemplating the Moon (1819)',
      grammar: 'Conan Doyle’s Baskervilles: Past Modals of Deduction & Place Inversion',
      img: 'assets/gothic/baskerville_moor.jpg',
      alt: 'Caspar David Friedrich, Two Men Contemplating the Moon (1819) — Book IV: The Hound of the Baskervilles',
      audio: 'assets/audio/gothic_act4_baskerville.mp3?v=2'
    }
  ];

  const PROF_WEST_ACTS = [
    {
      img: 'assets/study/act1_desert.jpg',
      alt: 'Act 1: Professor West and Pencil the Cat at the Egyptian Desert Excavation at sunset'
    },
    {
      img: 'assets/study/act2_pencil.jpg',
      alt: 'Act 2: Close-up of Pencil the Cat wearing her explorer hat and spotting a golden clue'
    },
    {
      img: 'assets/study/act3_cavern.jpg',
      alt: 'Act 3: Professor West holding up a brass lantern inside the ancient hieroglyphic cavern'
    },
    {
      img: 'assets/study/act4_study.jpg',
      alt: 'Act 4: Professor West and Pencil the Cat inside the interactive 3D Study'
    }
  ];

  function ensureAudio() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      audioCtx = new Ctx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  }

  function playTone(freq = 640, dur = 0.05, type = 'sine', vol = 0.03) {
    if (!sfxOn) return;
    try {
      ensureAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (e) {}
  }

  // Click-only sound: hoverBlip is intentionally silent so hovering cards never annoys visitors
  function hoverBlip() {}

  function syncSFXButtons() {
    document.querySelectorAll('[data-sfx-toggle]').forEach((btn) => {
      btn.classList.toggle('sfx-on', sfxOn);
      btn.setAttribute('aria-pressed', String(sfxOn));
      const lbl = btn.querySelector('[data-sfx-label]');
      const icon = btn.querySelector('[data-sfx-icon]');
      if (lbl) lbl.textContent = sfxOn ? 'SFX: ON' : 'SFX: OFF';
      if (icon) icon.className = sfxOn ? 'fa-solid fa-volume-high text-xs' : 'fa-solid fa-volume-xmark text-xs';
    });
  }

  function toggleSFX() {
    sfxOn = !sfxOn;
    try {
      localStorage.setItem(SFX_STORAGE_KEY, sfxOn ? 'on' : 'off');
    } catch (e) {}
    syncSFXButtons();
    if (sfxOn) playTone(880, 0.06, 'triangle', 0.04);
  }

  function setHolodeck(idx) {
    const safeIdx = idx % HOLODECK_WORLDS.length;
    const w = HOLODECK_WORLDS[safeIdx];
    playTone(540 + safeIdx * 90, 0.06, 'triangle', 0.035);

    document.querySelectorAll('.holodeck-tab').forEach((t, i) => {
      const isSelected = i === safeIdx;
      t.classList.toggle('active', isSelected);
      t.setAttribute('aria-selected', String(isSelected));
    });

    const panel = document.getElementById('holodeck-panel');
    if (panel) {
      panel.setAttribute('aria-labelledby', `holodeck-tab-${safeIdx}`);
    }

    const img = document.getElementById('holodeck-img');
    const badge = document.getElementById('holodeck-badge');
    const title = document.getElementById('holodeck-title');
    const desc = document.getElementById('holodeck-desc');
    const link = document.getElementById('holodeck-launch-link');
    const qTag = document.getElementById('holodeck-quiz-tag');
    const qPrompt = document.getElementById('holodeck-quiz-prompt');
    const qOpts = document.getElementById('holodeck-quiz-options');
    const qFeed = document.getElementById('holodeck-quiz-feedback');
    const qStatus = document.getElementById('holodeck-quiz-status');

    if (img) {
      img.src = w.img;
      img.alt = w.alt;
    }
    if (badge) badge.textContent = w.badge;
    if (title) title.textContent = w.title;
    if (desc) desc.textContent = w.desc;
    if (link) link.href = w.url;
    if (qTag) qTag.textContent = w.quizTag;
    if (qPrompt) qPrompt.textContent = w.prompt;
    if (qStatus) qStatus.textContent = 'Tap to test';
    if (qFeed) {
      qFeed.classList.add('hidden');
      qFeed.textContent = '';
    }

    if (qOpts) {
      qOpts.innerHTML = '';
      w.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'holodeck-choice-btn';
        btn.textContent = opt.text;
        btn.addEventListener('click', () => {
          qOpts.querySelectorAll('.holodeck-choice-btn').forEach((b) => {
            b.classList.remove('correct', 'wrong');
          });
          btn.classList.add(opt.correct ? 'correct' : 'wrong');
          if (opt.correct) {
            playTone(660, 0.08, 'triangle', 0.05);
            setTimeout(() => playTone(880, 0.12, 'triangle', 0.05), 70);
            if (qStatus) qStatus.textContent = '✓ Solved!';
          } else {
            playTone(220, 0.12, 'sawtooth', 0.04);
            if (qStatus) qStatus.textContent = '↺ Try again';
          }
          if (qFeed) {
            qFeed.textContent = opt.explain;
            qFeed.classList.remove('hidden');
          }
        });
        qOpts.appendChild(btn);
      });
    }
  }

  function filterWing(wing, btnEl) {
    playTone(620, 0.05, 'triangle', 0.035);
    const pills = document.querySelectorAll('.wing-pill');
    pills.forEach((b) => {
      const bWing = b.getAttribute('data-wing-btn');
      const isMatch = btnEl ? b === btnEl : bWing === wing;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-pressed', String(isMatch));
    });

    document.querySelectorAll('.lab-wing-section').forEach((sec) => {
      const secWings = sec.getAttribute('data-wing') || '';
      if (wing === 'all' || secWings.includes(wing)) {
        sec.classList.remove('wing-hidden');
      } else {
        sec.classList.add('wing-hidden');
      }
    });
  }

  function selectGothicBook(idx) {
    currentGothicIdx = idx % GOTHIC_BOOKS.length;
    const b = GOTHIC_BOOKS[currentGothicIdx];
    playTone(480 + currentGothicIdx * 70, 0.05, 'triangle', 0.035);

    const img = document.getElementById('da-spotlight-img');
    const tag = document.getElementById('da-spotlight-tag');
    const gram = document.getElementById('da-spotlight-grammar');
    if (img) {
      img.src = b.img;
      img.alt = b.alt;
    }
    if (tag) tag.textContent = b.tag;
    if (gram) gram.textContent = b.grammar;

    document.querySelectorAll('.da-book-thumb').forEach((t, i) => {
      const active = i === currentGothicIdx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', String(active));
    });

    if (sampleAudio && !sampleAudio.paused) {
      sampleAudio.pause();
      const lbl = document.getElementById('da-preview-audio-label');
      if (lbl) lbl.textContent = 'Hear Sample';
    }
  }

  function playGothicSample() {
    const b = GOTHIC_BOOKS[currentGothicIdx];
    const lbl = document.getElementById('da-preview-audio-label');
    if (!sampleAudio) {
      sampleAudio = new Audio();
    }
    if (!sampleAudio.paused) {
      sampleAudio.pause();
      if (lbl) lbl.textContent = 'Hear Sample';
      return;
    }
    sampleAudio.src = b.audio;
    if (lbl) lbl.textContent = '⏹ Stop Audio';
    sampleAudio.onended = () => {
      if (lbl) lbl.textContent = 'Hear Sample';
    };
    sampleAudio.play().catch(() => {
      if (lbl) lbl.textContent = 'Hear Sample';
    });
  }

  function selectProfWestAct(idx, src) {
    const safeIdx = idx % PROF_WEST_ACTS.length;
    const act = PROF_WEST_ACTS[safeIdx];
    playTone(520 + safeIdx * 65, 0.05, 'triangle', 0.035);
    const img = document.getElementById('pw-spotlight-img');
    if (img) {
      img.src = src || act.img;
      img.alt = act.alt;
    }
    document.querySelectorAll('.pw-act-thumb').forEach((t, i) => {
      const active = i === safeIdx;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-pressed', String(active));
    });
  }

  function roll2d6Demo() {
    const d1 = 1 + Math.floor(Math.random() * 6);
    const d2 = 1 + Math.floor(Math.random() * 6);
    const sum = d1 + d2;
    const passed = sum <= 9;
    playTone(passed ? 740 : 280, 0.09, 'square', 0.04);
    const readout = document.getElementById('c88-dice-readout');
    if (readout) {
      readout.textContent = `🎲 Rolled ${d1}+${d2}=${sum} (${passed ? 'PASS ≤9!' : 'PARRY!'})`;
    }
  }

  function unlockCoursePasskey() {
    const input = document.getElementById('lab-da-passkey-input');
    const feedback = document.getElementById('lab-da-passkey-feedback');
    if (!input || !feedback) return;
    const cleaned = input.value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const validHashes = ['GOTHIC12', 'GARETHC2', 'DARKACADEMIA24', 'STOKER1897'];
    if (validHashes.includes(cleaned)) {
      try {
        localStorage.setItem('da_course_unlocked_v1', 'true');
      } catch (e) {}
      feedback.className = 'text-xs font-bold text-emerald-400 mt-1.5';
      feedback.textContent = '✓ All 12 lessons unlocked! Opening Course Hub...';
      setTimeout(() => {
        window.location.href = 'dark-academia-index.html?unlocked=true';
      }, 450);
    } else {
      feedback.className = 'text-xs font-bold text-rose-400 mt-1.5';
      feedback.textContent = '✗ Invalid passkey. Check your receipt email or contact Gareth.';
    }
  }

  function initHeroParticles() {
    const canvas = document.getElementById('lab-hero-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const resize = () => {
      canvas.width = (canvas.parentElement && canvas.parentElement.clientWidth) || 1200;
      canvas.height = (canvas.parentElement && canvas.parentElement.clientHeight) || 680;
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const nodes = Array.from({ length: 34 }, (_, i) => ({
      x: ((i * 97) % 100) / 100,
      y: ((i * 53) % 100) / 100,
      vx: (i % 2 === 0 ? 1 : -1) * (0.00015 + (i % 4) * 0.00005),
      vy: (i % 3 === 0 ? 1 : -1) * (0.00012 + (i % 5) * 0.00004),
      r: 1.3 + (i % 3) * 0.8,
      color: i % 3 === 0 ? '#38bdf8' : i % 3 === 1 ? '#f59e0b' : '#a855f7'
    }));

    const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let isHeroVisible = true;
    let rafId = null;

    const drawScene = (advance) => {
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      nodes.forEach((n, idx) => {
        if (advance) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < 0 || n.x > 1) n.vx *= -1;
          if (n.y < 0 || n.y > 1) n.vy *= -1;
        }

        const px = n.x * W;
        const py = n.y * H;

        for (let j = idx + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const dx = px - m.x * W;
          const dy = py - m.y * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.strokeStyle = `rgba(125, 211, 252, ${((1 - dist / 140) * 0.14).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(m.x * W, m.y * H);
            ctx.stroke();
          }
        }

        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(px, py, n.r, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    if (reducedMotion) {
      drawScene(false);
      return;
    }

    const renderLoop = () => {
      if (!isHeroVisible) {
        rafId = null;
        return;
      }
      drawScene(true);
      rafId = requestAnimationFrame(renderLoop);
    };

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            isHeroVisible = entry.isIntersecting;
            if (isHeroVisible && !rafId) {
              rafId = requestAnimationFrame(renderLoop);
            }
          });
        },
        { threshold: 0.02 }
      );
      observer.observe(canvas);
    }

    rafId = requestAnimationFrame(renderLoop);
  }

  document.addEventListener('DOMContentLoaded', () => {
    syncSFXButtons();
    setHolodeck(0);
    initHeroParticles();

    // Ensure clicking any anchor link (nav, mobile menu, bento cards, footer) un-hides filtered wings first
    document.addEventListener('click', (e) => {
      const anchor = e.target.closest('a[href^="#"]');
      if (!anchor) return;
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#' || hash === '#main-content') return;
      const targetEl = document.querySelector(hash);
      if (!targetEl) return;
      const parentWing = targetEl.closest('.lab-wing-section') || (targetEl.nextElementSibling && targetEl.nextElementSibling.closest('.lab-wing-section'));
      if (parentWing && parentWing.classList.contains('wing-hidden')) {
        filterWing('all');
      } else {
        // Always ensure all sections are reachable when jumping via anchor links
        filterWing('all');
      }
    });

    // Exam Lab level filter with aria-pressed support
    window.filterLabs = function (level, btn) {
      playTone(600, 0.045, 'triangle', 0.03);
      document.querySelectorAll('.lab-filter-btn').forEach((b) => {
        const active = b === btn;
        b.setAttribute('aria-pressed', String(active));
        b.className = active
          ? 'lab-filter-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-sky-500 text-slate-950 shadow-sm transition cursor-pointer'
          : 'lab-filter-btn px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 text-slate-300 border border-slate-700 hover:border-sky-400 transition cursor-pointer';
      });
      document.querySelectorAll('.lab-card').forEach((card) => {
        const cardLevel = card.getAttribute('data-level') || '';
        if (level === 'all' || cardLevel === level || cardLevel.indexOf(level) !== -1) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    };

    const passkeyInput = document.getElementById('lab-da-passkey-input');
    if (passkeyInput) {
      passkeyInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          unlockCoursePasskey();
        }
      });
    }
  });

  return {
    setHolodeck,
    filterWing,
    selectGothicBook,
    selectProfWestAct,
    playGothicSample,
    roll2d6Demo,
    hoverBlip,
    toggleSFX,
    unlockCoursePasskey
  };
})();
