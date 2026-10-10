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
    let enabled = false;
    let bgm = null;

    function ensureContext() {
        if (ctx) return;
        ctx = new Ctx();
        master = ctx.createGain();
        master.gain.value = 0.8;
        master.connect(ctx.destination);
    }

    // One enveloped note. A tiny attack and a ramp to ~0 avoid clicks at start and end.
    function tone(freq, type, dur, vol, delay = 0) {
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

    /* ---- Background drone: low, slightly detuned pair with slow tremolo ---- */
    function startBGM() {
        if (bgm) return;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, ctx.currentTime);
        out.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2);   // fade in
        out.connect(master);

        const lfo = ctx.createOscillator();
        const lfoDepth = ctx.createGain();
        lfo.frequency.value = 0.15;
        lfoDepth.gain.value = 0.015;
        lfo.connect(lfoDepth);
        lfoDepth.connect(out.gain);
        lfo.start();

        // 55 Hz alone is inaudible on laptop speakers, so add its octave for body.
        const oscs = [[55, 1], [55.4, 1], [110, 0.35]].map(([f, level]) => {
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
        bgm = { out, lfo, oscs };
    }

    function stopBGM() {
        if (!bgm) return;
        const { out, lfo, oscs } = bgm;
        bgm = null;
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);        // fade out
        [lfo, ...oscs].forEach(o => o.stop(t + 0.6));
    }

    function setEnabled(on) {
        enabled = on;
        if (btn) {
            btn.setAttribute('aria-pressed', String(on));
            btn.textContent = on ? '🔊 Sound On' : '🔈 Sound Off';
        }
        if (on) {
            ensureContext();                       // must happen inside a user gesture
            const go = () => { startBGM(); play('grab'); };
            if (ctx.state === 'suspended') ctx.resume().then(go); else go();
        } else {
            stopBGM();
        }
    }

    if (btn) {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', () => setEnabled(!enabled));
    }

    // Be polite: silence when the tab is in the background.
    document.addEventListener('visibilitychange', () => {
        if (!ctx || !enabled) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
    });

    window.GCAudio = { play };
})();
