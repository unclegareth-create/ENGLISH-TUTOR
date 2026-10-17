/* ==========================================================
   Grammar Crypt – synthesized audio (used by sounds.html only)
   Exposes window.GCAudio.play(name); crypt.js calls it if present.
   Sounds are scheduled on the AudioContext clock (not setTimeout), so
   timing stays tight and nothing fires after the player mutes.
   ========================================================== */
(() => {
    'use strict';

    const Ctx = window.AudioContext || window.webkitAudioContext;
    const btn = document.getElementById('audio-toggle');

    if (!Ctx) {                       // very old browsers: hide the control, game still works
        if (btn) btn.hidden = true;
        return;
    }

    let ctx = null;
    let master = null;
    let enabled = true;
    let userMuted = false;
    let bgm = null;
    let bgmStepTimer = null;
    let bgmStep = 0;

    const GOTHIC_ARPEGGIO = [146.83, 174.61, 220.00, 233.08, 220.00, 174.61, 164.81, 138.59];

    function ensureContext() {
        if (ctx) return;
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.8;
        master.connect(ctx.destination);
    }

    // One enveloped note. A tiny attack and a ramp to ~0 avoid clicks at start and end.
    function tone(freq, type, dur, vol, delay = 0) {
        if (!ctx) return;
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(master);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    const sounds = {
        grab:    () => tone(300, 'triangle', 0.1, 0.05),
        drop:    () => tone(150, 'square', 0.1, 0.05),
        success: (streak = 0) => {                 // chime climbs a semitone per streak step (max one octave)
            const k = Math.pow(2, Math.min(streak, 12) / 12);
            tone(261.6 * k, 'sine', 0.3, 0.1, 0);       // C4 root
            tone(329.6 * k, 'sine', 0.3, 0.1, 0.15);    // E4
            tone(392.0 * k, 'sine', 0.6, 0.1, 0.30);    // G4
        },
        error:   () => {
            tone(150, 'sawtooth', 0.3, 0.1, 0);
            tone(140, 'sawtooth', 0.3, 0.1, 0.15);
        },
        loot:    () => [523, 659, 783, 1046].forEach((f, i) => tone(f, 'sine', 0.4, 0.05, i * 0.08)),
        epic:    () => {
            tone(220, 'square', 1.5, 0.08, 0);
            tone(277, 'square', 1.5, 0.08, 0.2);
            tone(330, 'square', 2.0, 0.08, 0.4);
        }
    };

    function play(name, arg) {
        if (!enabled || !ctx || ctx.state !== 'running') return;
        const fn = sounds[name];
        if (fn) fn(arg);
    }

    /* ---- Background soundtrack: Gothic D-minor arpeggio + deep subterranean drone ---- */
    function startBGM() {
        if (bgm || !ctx) return;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, ctx.currentTime);
        out.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.5);
        out.connect(master);

        const lfo = ctx.createOscillator();
        const lfoDepth = ctx.createGain();
        lfo.frequency.value = 0.18;
        lfoDepth.gain.value = 0.012;
        lfo.connect(lfoDepth);
        lfoDepth.connect(out.gain);
        lfo.start();

        const oscs = [[73.42, 0.9], [73.8, 0.85], [146.83, 0.35]].map(([f, level]) => {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            g.gain.value = level;
            o.connect(g);
            g.connect(out);
            o.start();
            return o;
        });

        bgmStep = 0;
        if (bgmStepTimer) clearInterval(bgmStepTimer);
        bgmStepTimer = setInterval(() => {
            if (!enabled || !ctx || ctx.state !== 'running') return;
            const note = GOTHIC_ARPEGGIO[bgmStep % GOTHIC_ARPEGGIO.length];
            bgmStep++;
            tone(note, 'triangle', 0.36, 0.032, 0);
            if (bgmStep % 4 === 1) {
                tone(note * 1.5, 'sine', 0.48, 0.018, 0.04);
            }
        }, 420);

        bgm = { out, lfo, oscs };
    }

    function stopBGM() {
        if (bgmStepTimer) {
            clearInterval(bgmStepTimer);
            bgmStepTimer = null;
        }
        if (!bgm) return;
        const { out, lfo, oscs } = bgm;
        bgm = null;
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        [lfo, ...oscs].forEach(o => o.stop(t + 0.6));
    }

    function setEnabled(on, fromUserToggle = false) {
        enabled = on;
        if (fromUserToggle) userMuted = !on;
        if (btn) {
            btn.setAttribute('aria-pressed', String(on));
            btn.textContent = on ? '🔊 Sound On' : '🔈 Sound Off';
        }
        if (on) {
            ensureContext();
            const go = () => { startBGM(); };
            if (ctx.state === 'suspended') {
                ctx.resume().then(go).catch(() => {});
            } else {
                go();
            }
        } else {
            stopBGM();
        }
    }

    if (btn) {
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = '🔊 Sound On';
        btn.addEventListener('click', () => setEnabled(!enabled, true));
    }

    // Auto-start music immediately on page load + unlock on first gesture if browser suspended AudioContext
    setEnabled(true, false);
    const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
    const unlockOnGesture = (e) => {
        if (e && e.target && e.target.closest && e.target.closest('#audio-toggle')) return;
        if (!userMuted && enabled) {
            ensureContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().then(() => startBGM()).catch(() => {});
            } else {
                startBGM();
            }
        }
        if (ctx && ctx.state === 'running') {
            unlockEvents.forEach(ev => window.removeEventListener(ev, unlockOnGesture, true));
        }
    };
    unlockEvents.forEach(ev => window.addEventListener(ev, unlockOnGesture, { capture: true, passive: true }));

    // Be polite: silence when the tab is in the background.
    document.addEventListener('visibilitychange', () => {
        if (!ctx || !enabled) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    window.GCAudio = { play };
})();
