/* ==========================================================
   Grammar Crypt – synthesized Web Audio SFX & optional ambience
   Exposes window.GCAudio = {
     play, isSfxEnabled, setSfxEnabled, isBgmEnabled, setBgmEnabled
   }
   - AudioContext is created lazily on the first user gesture (never on load).
   - SFX + Piper Boss Voices default ON (sfxEnabled = true).
   - Ambient BGM defaults OFF (bgmEnabled = false), controlled by #bgm-toggle.
   - Zero browser SpeechSynthesis APIs anywhere.
   ========================================================== */
(() => {
    'use strict';

    const Ctx = window.AudioContext || window.webkitAudioContext;

    let ctx = null;
    let sfxMaster = null;
    let bgmMaster = null;
    let sfxEnabled = true;
    let bgmEnabled = false;
    let hasGestured = false;
    let bgm = null;
    let bgmStepTimer = null;
    let bgmStep = 0;

    const GOTHIC_ARPEGGIO = [146.83, 174.61, 220.00, 233.08, 220.00, 174.61, 164.81, 138.59];

    function ensureContext() {
        if (ctx || !Ctx || !hasGestured) return false;
        try {
            ctx = new Ctx();
            sfxMaster = ctx.createGain();
            sfxMaster.gain.value = 0.8;
            sfxMaster.connect(ctx.destination);

            bgmMaster = ctx.createGain();
            bgmMaster.gain.value = 0.8;
            bgmMaster.connect(ctx.destination);
            return true;
        } catch (_) {
            ctx = null;
            return false;
        }
    }

    function tone(freq, type, dur, vol, delay = 0, targetGain = null) {
        if (!ctx) return;
        const dest = targetGain || sfxMaster;
        if (!dest) return;
        const t = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(vol, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + dur + 0.05);
    }

    const sounds = {
        grab: () => tone(300, 'triangle', 0.1, 0.05),
        drop: () => tone(150, 'square', 0.1, 0.05),
        success: (streak = 0) => {
            const k = Math.pow(2, Math.min(streak, 12) / 12);
            tone(261.6 * k, 'sine', 0.3, 0.1, 0);
            tone(329.6 * k, 'sine', 0.3, 0.1, 0.15);
            tone(392.0 * k, 'sine', 0.6, 0.1, 0.30);
        },
        error: () => {
            tone(150, 'sawtooth', 0.3, 0.1, 0);
            tone(140, 'sawtooth', 0.3, 0.1, 0.15);
        },
        loot: () => [523, 659, 783, 1046].forEach((f, i) => tone(f, 'sine', 0.4, 0.05, i * 0.08)),
        epic: () => {
            tone(220, 'square', 1.5, 0.08, 0);
            tone(277, 'square', 1.5, 0.08, 0.2);
            tone(330, 'square', 2.0, 0.08, 0.4);
        },
        boss: () => {
            tone(110, 'sawtooth', 0.6, 0.07, 0);
            tone(138.59, 'sawtooth', 0.8, 0.06, 0.14);
        }
    };

    function play(name, arg) {
        if (!sfxEnabled || !Ctx || !hasGestured) return;
        const fn = sounds[name];
        if (!fn) return;
        if (!ensureContext() && !ctx) return;
        if (ctx.state === 'running') {
            fn(arg);
        } else if (ctx.state === 'suspended') {
            ctx.resume().then(() => {
                if (sfxEnabled && ctx && ctx.state === 'running') fn(arg);
            }).catch(() => {});
        }
    }

    function startBGM() {
        if (bgm || !bgmEnabled || !ctx || !bgmMaster) return;
        const out = ctx.createGain();
        out.gain.setValueAtTime(0.0001, ctx.currentTime);
        out.gain.linearRampToValueAtTime(0.045, ctx.currentTime + 1.5);
        out.connect(bgmMaster);

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
            if (!bgmEnabled || !ctx || ctx.state !== 'running') return;
            const note = GOTHIC_ARPEGGIO[bgmStep % GOTHIC_ARPEGGIO.length];
            bgmStep++;
            tone(note, 'triangle', 0.36, 0.032, 0, bgmMaster);
            if (bgmStep % 4 === 1) {
                tone(note * 1.5, 'sine', 0.48, 0.018, 0.04, bgmMaster);
            }
        }, 420);

        bgm = { out, lfo, oscs };
    }

    function stopBGM() {
        if (bgmStepTimer) {
            clearInterval(bgmStepTimer);
            bgmStepTimer = null;
        }
        if (!bgm || !ctx) {
            bgm = null;
            return;
        }
        const { out, lfo, oscs } = bgm;
        bgm = null;
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t);
        out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), t);
        out.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
        [lfo, ...oscs].forEach(o => {
            try { o.stop(t + 0.6); } catch (_) {}
        });
    }

    function syncSfxButton() {
        const sfxBtn = document.getElementById('audio-toggle');
        if (!sfxBtn) return;
        sfxBtn.setAttribute('aria-pressed', sfxEnabled ? 'true' : 'false');
        sfxBtn.textContent = sfxEnabled ? '🔊 Sound On' : '🔈 Sound Off';
    }

    function syncBgmButton() {
        const bgmBtn = document.getElementById('bgm-toggle');
        if (!bgmBtn) return;
        if (!Ctx) {
            bgmBtn.hidden = true;
            return;
        }
        bgmBtn.setAttribute('aria-pressed', bgmEnabled ? 'true' : 'false');
        bgmBtn.textContent = bgmEnabled ? '🎵 Ambience On' : '🎵 Ambience Off';
    }

    function setSfxEnabled(on) {
        sfxEnabled = Boolean(on);
        syncSfxButton();
        if (sfxEnabled && hasGestured && Ctx) {
            ensureContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch(() => {});
            }
        }
        try {
            window.dispatchEvent(new CustomEvent('gc:sfxchange', { detail: { enabled: sfxEnabled } }));
        } catch (_) {}
        return sfxEnabled;
    }

    function setBgmEnabled(on) {
        bgmEnabled = Boolean(on) && Boolean(Ctx);
        syncBgmButton();
        if (bgmEnabled) {
            if (hasGestured) {
                ensureContext();
                if (ctx) {
                    if (ctx.state === 'suspended') {
                        ctx.resume().then(() => { if (bgmEnabled) startBGM(); }).catch(() => {});
                    } else {
                        startBGM();
                    }
                }
            }
        } else {
            stopBGM();
        }
        return bgmEnabled;
    }

    function bindControls() {
        const sfxBtn = document.getElementById('audio-toggle');
        if (sfxBtn && !sfxBtn.dataset.gcAudioBound) {
            sfxBtn.dataset.gcAudioBound = 'true';
            syncSfxButton();
            sfxBtn.addEventListener('click', () => {
                hasGestured = true;
                setSfxEnabled(!sfxEnabled);
            });
        }
        const bgmBtn = document.getElementById('bgm-toggle');
        if (bgmBtn && !bgmBtn.dataset.gcAudioBound) {
            bgmBtn.dataset.gcAudioBound = 'true';
            syncBgmButton();
            bgmBtn.addEventListener('click', () => {
                hasGestured = true;
                setBgmEnabled(!bgmEnabled);
            });
        }
    }

    const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
    const unlockOnGesture = () => {
        hasGestured = true;
        if ((sfxEnabled || bgmEnabled) && Ctx) {
            ensureContext();
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().then(() => {
                    if (bgmEnabled && !bgm) startBGM();
                }).catch(() => {});
            } else if (bgmEnabled && !bgm) {
                startBGM();
            }
        }
        if (ctx && ctx.state === 'running') {
            unlockEvents.forEach(ev => window.removeEventListener(ev, unlockOnGesture, true));
        }
    };
    unlockEvents.forEach(ev => window.addEventListener(ev, unlockOnGesture, { capture: true, passive: true }));

    document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) {
            if (ctx.state === 'running') ctx.suspend().catch(() => {});
        } else if (sfxEnabled || bgmEnabled) {
            ctx.resume().catch(() => {});
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindControls);
    }
    bindControls();

    window.GCAudio = {
        play,
        isSfxEnabled: () => sfxEnabled,
        setSfxEnabled,
        isBgmEnabled: () => bgmEnabled,
        setBgmEnabled
    };
})();
