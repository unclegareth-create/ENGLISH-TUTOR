/* ==========================================================
   Connected Speech & Rhythm Lab
   Offline STFT Spectrogram, Dual-Layer Canvas, Live Mic Overlay,
   Contrast Scorer, Daily 5, Duel Mode & Self-Test
   ========================================================== */
(() => {
  'use strict';

  const D = window.CONNECTED_SPEECH_DATA;
  if (!D) {
    console.error('connected-speech-data.js must be loaded before connected-speech.js');
    return;
  }

  const STORAGE_KEY = 'gm_connected_speech_state_v1';
  const CLEAN_KEY = 'gm_teacher_clean_screenshare';
  const SHARE_BASE_URL = 'https://garethenglish.com/connected-speech-lab.html';
  const BUNDLE_URL = 'assets/audio/tts/connected-speech-bundle.js';

  const ENVELOPE_BUCKETS = 120;
  const SPEC_COLS = 96;
  const SPEC_BANDS = 36;
  const FFT_SIZE = 512;

  const $ = (id) => document.getElementById(id);

  /* ---------------- STATE ---------------- */
  let state = {
    currentIdx: 0,
    streak: 0,
    dailyStreak: 0,
    lastDailyDate: '',
    lastDailyGrid: '',
    completedIds: [],
    bestScores: {},
    playerName: ''
  };

  let currentDrill = D.allDrills[0];
  let renderGen = 0;
  let playbackSpeed = 1.0;
  let quietMode = false;
  let soundEnabled = false;
  let inSelfTest = false;

  // Audio contexts & bundle state
  let decodeCtx = null;
  let playCtx = null;
  let bundlePromise = null;
  const analysisCache = new Map();

  // Playback / recording state
  let isPlayingRef = false;
  let isPlayRefPending = false;
  let playRefSeq = 0;
  let isPlayingMine = false;
  let isComparing = false;
  let isRecording = false;
  let activeSourceNode = null;
  let fallbackAudioEl = null;
  let playStartTs = 0;
  let playTotalMs = 2000;
  let playSweepMode = 'ref'; // 'ref' | 'mine'
  let rafId = null;
  let compareAbort = false;

  // Mic / capture state
  let micStream = null;
  let micSource = null;
  let analyser = null;
  let freqData = null;
  let timeData = null;
  let mediaRecorder = null;
  let recChunks = [];
  let recordStartTs = 0;
  let recordWindowMs = 3200;

  // Student envelope & captured audio
  let studentEnvelope = new Float32Array(ENVELOPE_BUCKETS);
  let hasStudentTrace = false;
  let isSimulatedTake = false;
  let userAudioBuffer = null;
  let userAudioUrl = '';
  let lastScoreResult = null;
  let takeBaseStreak = null;
  let takeAttemptRecorded = false;
  let takeSolveSfxPlayed = false;
  let takeDailyWritten = false;
  let takeDuelWritten = false;
  let takeFinalized = false;

  // Modes
  let dailyActive = false;
  let dailyData = null;
  let dailyStep = 0;
  let dailyResults = [];

  let duelActive = false;
  let duelSpec = null;
  let duelStep = 0;
  let duelResults = [];
  let duelElapsedMs = 0;
  let duelTurnStartedAt = null;
  let duelTimerInterval = null;

  let activeRecapMode = null;
  let recapReturnFocus = null;

  /* ---------------- GENTLE UI SFX (DEFAULT OFF) ---------------- */
  function getPlayCtx() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    if (!playCtx) playCtx = new Ctx();
    if (playCtx.state === 'suspended') {
      playCtx.resume().catch(() => {});
    }
    return playCtx;
  }

  function getDecodeCtx() {
    if (decodeCtx) return decodeCtx;
    const OffCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (OffCtx) {
      decodeCtx = new OffCtx(1, 1, 44100);
      return decodeCtx;
    }
    return getPlayCtx();
  }

  function playUiTone(freq, dur, vol, type = 'sine', delay = 0) {
    if (!soundEnabled || inSelfTest) return;
    const ctx = getPlayCtx();
    if (!ctx) return;
    try {
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch (_) {}
  }

  function sfx(kind) {
    if (!soundEnabled || inSelfTest) return;
    if (kind === 'stress') playUiTone(520, 0.06, 0.032, 'triangle');
    else if (kind === 'weak') playUiTone(310, 0.04, 0.015, 'sine');
    else if (kind === 'solve') {
      playUiTone(523.25, 0.11, 0.03, 'sine', 0);
      playUiTone(659.25, 0.14, 0.03, 'sine', 0.08);
    }
  }

  /* ---------------- TELEMETRY & STORAGE ---------------- */
  function trackEvent(eventName, params) {
    if (inSelfTest) return;
    try {
      if (typeof window.trackFunnelEvent === 'function') {
        window.trackFunnelEvent(eventName, { tool: 'connected-speech-lab', ...(params || {}) });
      }
    } catch (_) {}
  }

  function ensureState(raw) {
    const out = {
      currentIdx: 0,
      streak: 0,
      dailyStreak: 0,
      lastDailyDate: '',
      lastDailyGrid: '',
      completedIds: [],
      bestScores: {},
      playerName: ''
    };
    if (raw && typeof raw === 'object') {
      const idx = parseInt(raw.currentIdx, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < D.allDrills.length) out.currentIdx = idx;
      out.streak = Math.max(0, parseInt(raw.streak, 10) || 0);
      out.dailyStreak = Math.max(0, parseInt(raw.dailyStreak, 10) || 0);
      out.lastDailyDate = typeof raw.lastDailyDate === 'string' ? raw.lastDailyDate : '';
      out.lastDailyGrid = typeof raw.lastDailyGrid === 'string' ? raw.lastDailyGrid : '';
      if (Array.isArray(raw.completedIds)) {
        out.completedIds = [...new Set(raw.completedIds.filter((id) => Boolean(D.findById(id))))];
      }
      if (raw.bestScores && typeof raw.bestScores === 'object') {
        Object.keys(raw.bestScores).forEach((k) => {
          if (D.findById(k)) {
            out.bestScores[k] = Math.max(0, Math.min(100, Math.round(Number(raw.bestScores[k]) || 0)));
          }
        });
      }
      if (typeof raw.playerName === 'string') {
        out.playerName = raw.playerName.replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 18);
      }
    }
    return out;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state = ensureState(raw ? JSON.parse(raw) : null);
    } catch (_) {
      state = ensureState(null);
    }
  }

  function saveState() {
    if (inSelfTest) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  /* ---------------- CLEAN SCREENSHARE / WHITE-LABEL GUARD ---------------- */
  function isCleanMode(forceClean) {
    if (forceClean === true) return true;
    if (forceClean === false) return false;
    try {
      if (localStorage.getItem(CLEAN_KEY) === 'true') return true;
    } catch (_) {}
    try {
      if (new URLSearchParams(location.search).get('wl') === '1') return true;
    } catch (_) {}
    return !!(document.body && document.body.classList.contains('gm-clean-screenshare'));
  }

  function syncCleanModeUI(forceClean) {
    const clean = isCleanMode(forceClean);
    if (clean && document.body && !document.body.classList.contains('gm-clean-screenshare')) {
      document.body.classList.add('gm-clean-screenshare');
    } else if (forceClean === false && document.body) {
      document.body.classList.remove('gm-clean-screenshare');
    }
    const strip = $('belfast-desk-strip');
    if (strip) strip.classList.toggle('hidden', clean);
    const bridgeWrap = document.querySelector('[data-course-bridge]');
    if (bridgeWrap) bridgeWrap.classList.toggle('hidden', clean);
    const bridgeCard = $('gm-course-bridge');
    if (bridgeCard) bridgeCard.classList.toggle('hidden', clean);
  }

  /* ---------------- PROTOCOL-ADAPTIVE BUNDLE & AUDIO DECODING ---------------- */
  function ensureFileBundleLoaded() {
    if (window.location.protocol !== 'file:') {
      return Promise.resolve();
    }
    if (window.GARETH_CONNECTED_SPEECH_B64) {
      return Promise.resolve();
    }
    if (bundlePromise) return bundlePromise;

    bundlePromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = BUNDLE_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = resolve;
      document.head.appendChild(script);
    });
    return bundlePromise;
  }

  async function fetchOrBundleArrayBuffer(url) {
    if (window.location.protocol === 'file:') {
      await ensureFileBundleLoaded();
      const map = window.GARETH_CONNECTED_SPEECH_B64;
      if (map && map[url]) {
        const bin = window.atob(map[url]);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        return bytes.buffer;
      }
    }
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
    return resp.arrayBuffer();
  }

  async function decodeBytesSafe(arrayBuffer) {
    const ctx = getDecodeCtx();
    if (!ctx) throw new Error('AudioContext unavailable');
    const copy = arrayBuffer.slice(0);
    return ctx.decodeAudioData(copy);
  }

  /* ---------------- OFFLINE STFT SPECTROGRAM & ENVELOPE DSP ---------------- */
  const hannWindow = (() => {
    const w = new Float32Array(FFT_SIZE);
    for (let i = 0; i < FFT_SIZE; i++) {
      w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1)));
    }
    return w;
  })();

  function fftRadix2(re, im) {
    const n = re.length;
    let j = 0;
    for (let i = 0; i < n; i++) {
      if (i < j) {
        const tr = re[i]; re[i] = re[j]; re[j] = tr;
        const ti = im[i]; im[i] = im[j]; im[j] = ti;
      }
      let m = n >> 1;
      while (m >= 1 && j >= m) {
        j -= m;
        m >>= 1;
      }
      j += m;
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const step = (-2 * Math.PI) / size;
      for (let start = 0; start < n; start += size) {
        for (let k = 0; k < half; k++) {
          const angle = k * step;
          const wr = Math.cos(angle);
          const wi = Math.sin(angle);
          const idx1 = start + k;
          const idx2 = idx1 + half;
          const tr = wr * re[idx2] - wi * im[idx2];
          const ti = wr * im[idx2] + wi * re[idx2];
          re[idx2] = re[idx1] - tr;
          im[idx2] = im[idx1] - ti;
          re[idx1] += tr;
          im[idx1] += ti;
        }
      }
    }
  }

  function findActiveSpeechBounds(samples, sampleRate) {
    const win = Math.max(64, Math.floor(sampleRate * 0.025));
    const step = Math.max(32, Math.floor(sampleRate * 0.01));
    const rmsList = [];
    let maxRms = 0;
    for (let i = 0; i + win <= samples.length; i += step) {
      let sum = 0;
      for (let k = 0; k < win; k++) {
        const v = samples[i + k];
        sum += v * v;
      }
      const r = Math.sqrt(sum / win);
      if (r > maxRms) maxRms = r;
      rmsList.push({ idx: i, r });
    }
    if (maxRms < 1e-4 || rmsList.length === 0) {
      return { startSample: 0, endSample: samples.length, maxRms };
    }
    const thresh = maxRms * 0.05;
    let firstIdx = 0;
    let lastIdx = rmsList.length - 1;
    for (let i = 0; i < rmsList.length; i++) {
      if (rmsList[i].r >= thresh) {
        firstIdx = i;
        break;
      }
    }
    for (let i = rmsList.length - 1; i >= 0; i--) {
      if (rmsList[i].r >= thresh) {
        lastIdx = i;
        break;
      }
    }
    const padLead = Math.floor(sampleRate * 0.03);
    const padTail = Math.floor(sampleRate * 0.04);
    const startSample = Math.max(0, rmsList[firstIdx].idx - padLead);
    const endSample = Math.min(samples.length, rmsList[lastIdx].idx + win + padTail);
    if (endSample - startSample < Math.floor(sampleRate * 0.25)) {
      return { startSample: 0, endSample: samples.length, maxRms };
    }
    return { startSample, endSample, maxRms };
  }

  function computeEnvelopeFromSamples(samples, startSample, endSample, bucketsCount) {
    const span = Math.max(1, endSample - startSample);
    const raw = new Float32Array(bucketsCount);
    let maxVal = 1e-5;
    for (let b = 0; b < bucketsCount; b++) {
      const a = startSample + Math.floor((b / bucketsCount) * span);
      const z = Math.max(a + 1, startSample + Math.floor(((b + 1) / bucketsCount) * span));
      let sum = 0;
      for (let i = a; i < z && i < samples.length; i++) {
        const s = samples[i];
        sum += s * s;
      }
      const rms = Math.sqrt(sum / Math.max(1, z - a));
      raw[b] = rms;
      if (rms > maxVal) maxVal = rms;
    }
    // Gentle 3-tap smoothing + normalization
    const out = new Float32Array(bucketsCount);
    for (let b = 0; b < bucketsCount; b++) {
      const prev = raw[Math.max(0, b - 1)];
      const cur = raw[b];
      const next = raw[Math.min(bucketsCount - 1, b + 1)];
      const smoothed = (prev * 0.2 + cur * 0.6 + next * 0.2) / maxVal;
      out[b] = Math.min(0.98, Math.max(0.03, smoothed));
    }
    return out;
  }

  function computeSpectrogram(samples, sampleRate, startSample, endSample) {
    const span = Math.max(FFT_SIZE, endSample - startSample);
    const grid = new Float32Array(SPEC_COLS * SPEC_BANDS);
    const re = new Float32Array(FFT_SIZE);
    const im = new Float32Array(FFT_SIZE);

    // Log-spaced frequency bins from 90 Hz to min(5200, nyquist)
    const minHz = 90;
    const maxHz = Math.min(5200, sampleRate * 0.48);
    const halfBins = FFT_SIZE / 2;
    const bandBounds = [];
    for (let band = 0; band < SPEC_BANDS; band++) {
      const f0 = minHz * Math.pow(maxHz / minHz, band / SPEC_BANDS);
      const f1 = minHz * Math.pow(maxHz / minHz, (band + 1) / SPEC_BANDS);
      const b0 = Math.max(1, Math.floor((f0 / sampleRate) * FFT_SIZE));
      const b1 = Math.min(halfBins - 1, Math.max(b0, Math.ceil((f1 / sampleRate) * FFT_SIZE)));
      bandBounds.push([b0, b1]);
    }

    let maxLog = 1e-4;
    for (let col = 0; col < SPEC_COLS; col++) {
      const center = startSample + Math.floor(((col + 0.5) / SPEC_COLS) * span);
      const frameStart = center - (FFT_SIZE >> 1);
      for (let i = 0; i < FFT_SIZE; i++) {
        const sIdx = frameStart + i;
        const val = (sIdx >= 0 && sIdx < samples.length) ? samples[sIdx] : 0;
        re[i] = val * hannWindow[i];
        im[i] = 0;
      }
      fftRadix2(re, im);

      for (let band = 0; band < SPEC_BANDS; band++) {
        const [b0, b1] = bandBounds[band];
        let peakMag = 0;
        for (let k = b0; k <= b1; k++) {
          const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / (FFT_SIZE * 0.5);
          if (mag > peakMag) peakMag = mag;
        }
        const logVal = Math.log1p(peakMag * 42);
        grid[col * SPEC_BANDS + band] = logVal;
        if (logVal > maxLog) maxLog = logVal;
      }
    }

    for (let i = 0; i < grid.length; i++) {
      grid[i] = Math.min(1, grid[i] / maxLog);
    }

    return { cols: SPEC_COLS, bands: SPEC_BANDS, grid };
  }

  function buildFallbackEnvelope(drill) {
    const env = new Float32Array(ENVELOPE_BUCKETS);
    for (let b = 0; b < ENVELOPE_BUCKETS; b++) {
      const pos = b / (ENVELOPE_BUCKETS - 1);
      let val = 0.22;
      drill.peaks.forEach((p) => {
        const d = (pos - p.pos) / 0.06;
        val += (p.amp - 0.22) * Math.exp(-0.5 * d * d);
      });
      drill.valleys.forEach((v) => {
        const d = (pos - v.pos) / 0.045;
        val -= 0.16 * Math.exp(-0.5 * d * d);
      });
      env[b] = Math.min(0.97, Math.max(0.06, val));
    }
    return env;
  }

  function analyzeAudioBuffer(buffer, drill) {
    const samples = buffer.getChannelData(0);
    const sampleRate = buffer.sampleRate;
    const { startSample, endSample } = findActiveSpeechBounds(samples, sampleRate);
    const envelope = computeEnvelopeFromSamples(samples, startSample, endSample, ENVELOPE_BUCKETS);
    const spectrogram = computeSpectrogram(samples, sampleRate, startSample, endSample);
    const activeStartSec = startSample / sampleRate;
    const activeEndSec = endSample / sampleRate;
    return {
      drillId: drill.id,
      buffer,
      sampleRate,
      durationSec: buffer.duration,
      activeStartSec,
      activeEndSec,
      activeSpanSec: Math.max(0.4, activeEndSec - activeStartSec),
      envelope,
      spectrogram,
      peaks: drill.peaks,
      valleys: drill.valleys
    };
  }

  async function ensureDrillAnalysis(drill) {
    if (analysisCache.has(drill.id)) {
      return analysisCache.get(drill.id);
    }
    try {
      const arr = await fetchOrBundleArrayBuffer(drill.audioSrc);
      const buf = await decodeBytesSafe(arr);
      const analysis = analyzeAudioBuffer(buf, drill);
      analysisCache.set(drill.id, analysis);
      return analysis;
    } catch (err) {
      const fallback = {
        drillId: drill.id,
        buffer: null,
        sampleRate: 22050,
        durationSec: 2.4,
        activeStartSec: 0,
        activeEndSec: 2.2,
        activeSpanSec: 2.2,
        envelope: buildFallbackEnvelope(drill),
        spectrogram: null,
        peaks: drill.peaks,
        valleys: drill.valleys
      };
      return fallback;
    }
  }

  /* ---------------- DUAL-LAYER CANVAS RENDERING ---------------- */
  function roundRectPath(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }

  function heatColor(t) {
    // Deep navy -> teal -> warm amber -> bright gold
    const x = Math.max(0, Math.min(1, t));
    let r, g, b;
    if (x < 0.35) {
      const k = x / 0.35;
      r = Math.round(6 + k * 8);
      g = Math.round(14 + k * 82);
      b = Math.round(32 + k * 128);
    } else if (x < 0.7) {
      const k = (x - 0.35) / 0.35;
      r = Math.round(14 + k * 230);
      g = Math.round(96 + k * 64);
      b = Math.round(160 - k * 145);
    } else {
      const k = (x - 0.7) / 0.3;
      r = Math.round(244 + k * 11);
      g = Math.round(160 + k * 82);
      b = Math.round(15 + k * 105);
    }
    return `rgb(${r},${g},${b})`;
  }

  function drawReferenceLayer() {
    const canvas = $('cs-ref-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const drill = currentDrill;
    const cached = analysisCache.get(drill.id);
    const refEnv = cached ? cached.envelope : buildFallbackEnvelope(drill);
    const spec = cached ? cached.spectrogram : null;

    ctx.clearRect(0, 0, W, H);

    const padTop = 26;
    const padBot = 30;
    const padX = 14;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBot;
    const baseLineY = H - padBot;

    // 1. Dark well backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, '#091225');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // 2. Offline STFT Spectrogram heatmap
    if (spec && spec.grid) {
      const cellW = usableW / spec.cols;
      const cellH = usableH / spec.bands;
      for (let col = 0; col < spec.cols; col++) {
        const x = padX + col * cellW;
        for (let band = 0; band < spec.bands; band++) {
          const val = spec.grid[col * spec.bands + band];
          if (val < 0.08) continue;
          const y = baseLineY - (band + 1) * cellH;
          ctx.fillStyle = heatColor(val);
          ctx.globalAlpha = 0.22 + val * 0.56;
          ctx.fillRect(x, y, Math.ceil(cellW), Math.ceil(cellH));
        }
      }
      ctx.globalAlpha = 1;
    }

    // 3. Subtle grid & Hz guides
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      const y = padTop + (usableH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(W - padX, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(148, 163, 184, 0.58)';
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('4 kHz', padX + 4, padTop + 10);
    ctx.fillText('1.5 kHz', padX + 4, padTop + usableH * 0.52);

    // 4. Weak-Form /ə/ Valley Zones (shaded vertical bands + labels at bottom)
    drill.valleys.forEach((v) => {
      const vx = padX + v.pos * usableW;
      const bandW = usableW * 0.07;
      ctx.save();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.11)';
      ctx.fillRect(vx - bandW * 0.5, padTop, bandW, usableH);
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(vx, padTop + 14);
      ctx.lineTo(vx, baseLineY);
      ctx.stroke();
      ctx.restore();

      // Valley pill along floor
      const label = v.label;
      ctx.font = '700 9.5px "JetBrains Mono", monospace';
      const tw = ctx.measureText(label).width + 10;
      const clampedX = Math.max(padX + tw / 2, Math.min(W - padX - tw / 2, vx));
      ctx.fillStyle = 'rgba(6, 78, 59, 0.85)';
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.7)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, clampedX - tw / 2, baseLineY - 21, tw, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#a7f3d0';
      ctx.textAlign = 'center';
      ctx.fillText(label, clampedX, baseLineY - 9.5);
    });

    // 5. Gold Reference Rhythm Envelope
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(padX, baseLineY);
    for (let b = 0; b < refEnv.length; b++) {
      const x = padX + (b / (refEnv.length - 1)) * usableW;
      const y = baseLineY - refEnv[b] * (usableH * 0.88);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W - padX, baseLineY);
    ctx.closePath();
    const areaGrad = ctx.createLinearGradient(0, padTop, 0, baseLineY);
    areaGrad.addColorStop(0, 'rgba(251, 191, 36, 0.28)');
    areaGrad.addColorStop(1, 'rgba(251, 191, 36, 0.03)');
    ctx.fillStyle = areaGrad;
    ctx.fill();

    ctx.beginPath();
    for (let b = 0; b < refEnv.length; b++) {
      const x = padX + (b / (refEnv.length - 1)) * usableW;
      const y = baseLineY - refEnv[b] * (usableH * 0.88);
      if (b === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    // 6. Stress Peak Callouts
    drill.peaks.forEach((p) => {
      const px = padX + p.pos * usableW;
      const envIdx = Math.min(refEnv.length - 1, Math.max(0, Math.round(p.pos * (refEnv.length - 1))));
      const envVal = Math.max(refEnv[envIdx], p.amp * 0.65);
      const py = baseLineY - envVal * (usableH * 0.88);

      ctx.beginPath();
      ctx.arc(px, py, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fde047';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.font = '700 10px "JetBrains Mono", monospace';
      const tw = ctx.measureText(p.label).width + 10;
      const lx = Math.max(padX + tw / 2, Math.min(W - padX - tw / 2, px));
      const ly = Math.max(6, py - 24);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.72)';
      ctx.lineWidth = 1;
      roundRectPath(ctx, lx - tw / 2, ly, tw, 16, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fde68a';
      ctx.textAlign = 'center';
      ctx.fillText(p.label, lx, ly + 11.5);
    });

    // 7. Bottom Time Axis
    const span = (cached ? cached.activeSpanSec : 2.1) / playbackSpeed;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('0.0s', padX, H - 9);
    ctx.textAlign = 'center';
    ctx.fillText(`${(span * 0.25).toFixed(1)}s`, padX + usableW * 0.25, H - 9);
    ctx.fillText(`${(span * 0.5).toFixed(1)}s`, padX + usableW * 0.5, H - 9);
    ctx.fillText(`${(span * 0.75).toFixed(1)}s`, padX + usableW * 0.75, H - 9);
    ctx.textAlign = 'right';
    ctx.fillText(`${span.toFixed(1)}s (${playbackSpeed.toFixed(playbackSpeed === 1 ? 1 : 2)}x)`, W - padX, H - 9);
  }

  function drawLiveLayer(playheadNorm = 0) {
    const canvas = $('cs-live-canvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const padTop = 26;
    const padBot = 30;
    const padX = 14;
    const usableW = W - padX * 2;
    const usableH = H - padTop - padBot;
    const baseLineY = H - padBot;

    // 1. Live / Captured Student Vocal Envelope (Cyan)
    if (hasStudentTrace || isRecording) {
      ctx.save();
      ctx.beginPath();
      for (let b = 0; b < ENVELOPE_BUCKETS; b++) {
        const x = padX + (b / (ENVELOPE_BUCKETS - 1)) * usableW;
        const y = baseLineY - studentEnvelope[b] * (usableH * 0.86);
        if (b === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.6;
      ctx.stroke();

      ctx.lineTo(W - padX, baseLineY);
      ctx.lineTo(padX, baseLineY);
      ctx.closePath();
      const cyanGrad = ctx.createLinearGradient(0, padTop, 0, baseLineY);
      cyanGrad.addColorStop(0, 'rgba(56, 189, 248, 0.30)');
      cyanGrad.addColorStop(1, 'rgba(56, 189, 248, 0.02)');
      ctx.fillStyle = cyanGrad;
      ctx.fill();
      ctx.restore();
    }

    // 2. Live 60fps Oscilloscope Waveform during Recording or Playback
    if (isRecording && analyser && timeData && !quietMode) {
      ctx.save();
      analyser.getByteTimeDomainData(timeData);
      const midY = padTop + usableH * 0.55;
      ctx.beginPath();
      for (let i = 0; i < timeData.length; i++) {
        const x = padX + (i / (timeData.length - 1)) * usableW;
        const v = (timeData[i] - 128) / 128;
        const y = midY + v * (usableH * 0.42);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.9)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.restore();
    } else if (isPlayingRef || isPlayingMine) {
      const midY = padTop + usableH * 0.56;
      const envArr = isPlayingMine ? studentEnvelope : (analysisCache.get(currentDrill.id)?.envelope || buildFallbackEnvelope(currentDrill));
      const idx = Math.min(envArr.length - 1, Math.max(0, Math.round(playheadNorm * (envArr.length - 1))));
      const amp = envArr[idx] || 0.3;
      const now = performance.now() * 0.015;
      ctx.save();
      ctx.beginPath();
      for (let px = padX; px <= W - padX; px += 4) {
        const wave = Math.sin(px * 0.05 + now) * Math.cos(px * 0.021 - now * 0.7) * amp * (usableH * 0.22);
        const y = midY + wave;
        if (px === padX) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.strokeStyle = isPlayingMine ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 191, 36, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // 3. Playhead Beam
    if (playheadNorm > 0 && playheadNorm <= 1) {
      const playX = padX + playheadNorm * usableW;
      ctx.save();
      ctx.strokeStyle = isRecording ? '#ef4444' : (playSweepMode === 'mine' ? '#38bdf8' : '#fbbf24');
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(playX, padTop - 4);
      ctx.lineTo(playX, baseLineY);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ---------------- CONTRAST SCORING & DOSSIER INTEGRATION ---------------- */
  function sampleEnvelopeWindow(env, centerPos, halfWidth) {
    const startB = Math.max(0, Math.floor((centerPos - halfWidth) * (ENVELOPE_BUCKETS - 1)));
    const endB = Math.min(ENVELOPE_BUCKETS - 1, Math.ceil((centerPos + halfWidth) * (ENVELOPE_BUCKETS - 1)));
    let peak = 0;
    let sum = 0;
    let count = 0;
    for (let b = startB; b <= endB; b++) {
      const v = env[b];
      if (v > peak) peak = v;
      sum += v;
      count++;
    }
    return { mean: count ? sum / count : 0, max: peak };
  }

  function cosineSimilarity(a, b) {
    let dot = 0;
    let na = 0;
    let nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    if (na < 1e-6 || nb < 1e-6) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  function scoreStudentTrace(drill, stuEnv) {
    const cached = analysisCache.get(drill.id);
    const refEnv = cached ? cached.envelope : buildFallbackEnvelope(drill);

    // Normalize student envelope if active peak is weak or loud so rhythm contrast drives score
    let maxStu = 0;
    for (let i = 0; i < stuEnv.length; i++) {
      if (stuEnv[i] > maxStu) maxStu = stuEnv[i];
    }
    const normStu = new Float32Array(ENVELOPE_BUCKETS);
    const scale = maxStu > 0.08 ? 0.94 / maxStu : 1;
    for (let i = 0; i < ENVELOPE_BUCKETS; i++) {
      normStu[i] = Math.min(0.98, stuEnv[i] * scale);
    }

    // 1. Peak Energy Hits on stressed syllables
    let peakSum = 0;
    let hitPeaks = 0;
    drill.peaks.forEach((p) => {
      const peakVal = sampleEnvelopeWindow(normStu, p.pos, 0.065).max;
      peakSum += peakVal;
      if (peakVal >= 0.28) hitPeaks++;
    });
    const peakMean = peakSum / Math.max(1, drill.peaks.length);
    const peakCov = hitPeaks / Math.max(1, drill.peaks.length);

    // 2. Weak-form / schwa valley compression (lower valley energy = stronger contrast!)
    let valleySum = 0;
    let hitValleys = 0;
    drill.valleys.forEach((v) => {
      const win = sampleEnvelopeWindow(normStu, v.pos, 0.05);
      valleySum += win.mean;
      if (win.max >= 0.02) hitValleys++;
    });
    const valleyMean = valleySum / Math.max(1, drill.valleys.length);
    const valleyCov = hitValleys / Math.max(1, drill.valleys.length);

    // 3. Stress-vs-Weak Contrast Ratio & Envelope Alignment
    const contrast = Math.max(0, peakMean - valleyMean);
    const sim = cosineSimilarity(refEnv, normStu);

    const peakPct = Math.round(Math.max(15, Math.min(100, peakMean * 104)));
    const valleyPct = Math.round(Math.max(15, Math.min(100, (1 - Math.max(0, valleyMean - 0.14) / 0.72) * 100)));
    const contrastBoost = Math.min(1, contrast / 0.52);
    const coverageScale = Math.pow(peakCov, 1.8) * (0.85 + 0.15 * valleyCov);
    const overallPct = Math.round(
      Math.max(25, Math.min(99, (sim * 46 + contrastBoost * 34 + (peakPct / 100) * 12 + (valleyPct / 100) * 8) * coverageScale))
    );

    const passed = overallPct >= 75 && contrast >= 0.22;
    let feedback = '';
    if (maxStu < 0.06) {
      return {
        overallPct: 0,
        peakPct: 0,
        valleyPct: 0,
        contrast: 0,
        passed: false,
        feedback: 'I could not pick up enough vocal energy — check your microphone or tap the rhythm pads below.'
      };
    }

    if (overallPct >= 86 && contrast >= 0.35 && peakCov === 1) {
      feedback = `Spot on! Your stressed peaks (${peakPct}%) stand sharply above your reduced /ə/ valleys (${valleyPct}% compression), giving this sentence genuine British stress-timing.`;
    } else if (valleyMean > 0.56) {
      feedback = `Your stressed words landed well, yet your weak forms stayed too loud (${valleyPct}% valley contrast). Let the unstressed syllables in "${drill.phoneticRespelling.split(' ')[0]}" drop almost to a whisper so the main verbs and nouns pop.`;
    } else if (peakMean < 0.58 || peakCov < 1) {
      feedback = `Good light valleys, though your main stress peaks need a firmer lift. Lean harder into the capitalised beats: ${drill.peaks.map((p) => p.label).join(' · ')}.`;
    } else {
      feedback = `Solid C1 rhythm (${overallPct}%). Listen once more at 0.85x and try exaggerating the gap between the loud peaks and the relaxed schwa valleys.`;
    }

    return { overallPct, peakPct, valleyPct, contrast, passed, feedback };
  }

  function applyScoreToUI(res, modeLabel, options = {}) {
    lastScoreResult = res;
    const card = $('score-card');
    const badge = $('score-badge');
    const syncNote = $('dossier-sync-note');
    const overallEl = $('metric-overall');
    const peaksEl = $('metric-peaks');
    const valleysEl = $('metric-valleys');
    const fbEl = $('score-feedback');

    if (card) {
      card.classList.remove('hidden');
      card.classList.toggle('is-developing', !res.passed);
    }
    if (badge) {
      badge.textContent = `${res.overallPct}% Match · ${res.passed ? 'Strong C1 Contrast' : 'Keep Tightening Weak Forms'}`;
    }
    if (syncNote) {
      syncNote.textContent = options.finalizeTake === false
        ? 'Preview · Tap remaining pad to log this take'
        : (modeLabel || '✓ Saved to your practice log');
    }
    if (overallEl) overallEl.textContent = `${res.overallPct}%`;
    if (peaksEl) peaksEl.textContent = `${res.peakPct}%`;
    if (valleysEl) valleysEl.textContent = `${res.valleyPct}%`;
    if (fbEl) fbEl.textContent = res.feedback;

    if (res.overallPct > 0 && options.finalizeTake !== false) {
      takeFinalized = true;
      if (takeBaseStreak === null) {
        takeBaseStreak = state.streak;
      }
      if (res.passed) {
        state.streak = takeBaseStreak + 1;
        if (!inSelfTest && !state.completedIds.includes(currentDrill.id)) {
          state.completedIds.push(currentDrill.id);
        }
      } else {
        state.streak = 0;
      }
      if (!inSelfTest) {
        const prevBest = state.bestScores[currentDrill.id] || 0;
        if (res.overallPct > prevBest) state.bestScores[currentDrill.id] = res.overallPct;
        saveState();
      }
      updateHudUI();

      if (res.passed && !takeSolveSfxPlayed) {
        takeSolveSfxPlayed = true;
        sfx('solve');
      }

      if (!takeAttemptRecorded) {
        takeAttemptRecorded = true;
        recordDossierAttempt(res);
      }

      if (dailyActive && (dailyResults[dailyStep] == null || takeDailyWritten)) {
        dailyResults[dailyStep] = {
          id: currentDrill.id,
          pct: res.overallPct,
          passed: res.passed,
          simulated: isSimulatedTake
        };
        takeDailyWritten = true;
      }
      if (duelActive && (duelResults[duelStep] == null || takeDuelWritten)) {
        duelResults[duelStep] = {
          id: currentDrill.id,
          pct: res.overallPct,
          passed: res.passed,
          simulated: isSimulatedTake
        };
        takeDuelWritten = true;
        if (res.passed) pauseDuelTimer();
      }
    }
  }

  function recordDossierAttempt(res) {
    if (inSelfTest) return;
    const payload = {
      game: 'Connected Speech Lab',
      category: 'prosody_cadence',
      drillId: currentDrill.id,
      title: currentDrill.title,
      correct: Boolean(res.passed),
      passed: Boolean(res.passed),
      score: res.overallPct,
      maxScore: 100,
      timestamp: new Date().toISOString()
    };
    try {
      if (window.CandidateDossier && typeof window.CandidateDossier.recordAttempt === 'function') {
        window.CandidateDossier.recordAttempt(payload);
      }
      window.dispatchEvent(new CustomEvent('dossier:attempt', { detail: payload }));
    } catch (_) {}
    trackEvent('connected_speech_attempt', {
      drillId: currentDrill.id,
      act: currentDrill.act,
      pct: res.overallPct,
      passed: res.passed
    });
  }

  /* ---------------- PLAYBACK & RECORDING CONTROLS ---------------- */
  function updateWellStatus(text, stateKind = 'ready') {
    const textEl = $('well-status-text');
    const dotEl = $('well-dot');
    if (textEl) textEl.textContent = text;
    if (dotEl) {
      dotEl.className = 'well-dot' + (
        stateKind === 'rec' ? ' is-rec' :
        stateKind === 'play' ? ' is-play' :
        stateKind === 'ok' ? ' is-ok' : ''
      );
    }
  }

  function updateWellTimer(elapsedSec, totalSec) {
    const el = $('well-timer');
    if (!el) return;
    const clamped = Math.max(0, Math.min(totalSec, elapsedSec));
    el.textContent = `${clamped.toFixed(1)}s / ${totalSec.toFixed(1)}s`;
  }

  function syncActionButtons() {
    const replayBtn = $('btn-replay-mine');
    const compareBtn = $('btn-compare');
    const canReplay = hasStudentTrace || Boolean(userAudioBuffer || userAudioUrl);
    if (replayBtn) replayBtn.disabled = !canReplay;
    if (compareBtn) compareBtn.disabled = !canReplay;
  }

  function ensureFallbackAudioEl() {
    if (!fallbackAudioEl && typeof Audio !== 'undefined') {
      fallbackAudioEl = new Audio();
      fallbackAudioEl.addEventListener('error', () => {
        if (isPlayingRef || isPlayingMine) {
          updateWellStatus('Audio unavailable · Rhythm envelope sweep active.', 'play');
        }
      });
    }
    return fallbackAudioEl;
  }

  function stopAllAudioAndAnim() {
    compareAbort = true;
    isPlayingRef = false;
    isPlayRefPending = false;
    playRefSeq += 1;
    isPlayingMine = false;
    isComparing = false;

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    if (activeSourceNode) {
      try { activeSourceNode.onended = null; activeSourceNode.stop(); } catch (_) {}
      activeSourceNode = null;
    }
    if (fallbackAudioEl) {
      try { fallbackAudioEl.pause(); fallbackAudioEl.currentTime = 0; } catch (_) {}
    }

    const playLbl = $('play-ref-label');
    const playBtn = $('btn-play-ref');
    if (playLbl) playLbl.textContent = 'Listen to British Model';
    if (playBtn) playBtn.classList.remove('is-playing');

    if (isRecording) {
      finishMicRecording(true);
    }
  }

  function startSweepLoop(onTick, onDone) {
    if (rafId) cancelAnimationFrame(rafId);
    const tick = () => {
      const elapsed = performance.now() - playStartTs;
      const progress = Math.min(1, elapsed / Math.max(200, playTotalMs));
      if (onTick) onTick(progress, elapsed);
      drawLiveLayer(progress);
      if (progress >= 1) {
        rafId = null;
        if (onDone) onDone();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  }

  async function playReferenceClip(onFinishedCallback) {
    if (isPlayRefPending) return;
    if (isPlayingRef && !onFinishedCallback) {
      stopAllAudioAndAnim();
      updateWellStatus('Ready · Listen, then shadow with your mic or tap rhythm.', 'ready');
      drawLiveLayer(0);
      return;
    }
    if (!onFinishedCallback) stopAllAudioAndAnim();

    const mySeq = ++playRefSeq;
    isPlayRefPending = true;
    let analysis;
    try {
      analysis = await ensureDrillAnalysis(currentDrill);
    } finally {
      isPlayRefPending = false;
    }
    if (mySeq !== playRefSeq || (onFinishedCallback && compareAbort)) return;

    const ctx = getPlayCtx();
    const startOffset = Math.max(0, (analysis.activeStartSec || 0) - 0.02);
    const activeDur = Math.max(0.5, (analysis.activeEndSec || analysis.durationSec) - startOffset);
    const scaledMs = (activeDur / playbackSpeed) * 1000;

    isPlayingRef = true;
    playSweepMode = 'ref';
    playStartTs = performance.now();
    playTotalMs = scaledMs;

    const playLbl = $('play-ref-label');
    const playBtn = $('btn-play-ref');
    if (playLbl) playLbl.textContent = 'Stop Model';
    if (playBtn) playBtn.classList.add('is-playing');
    updateWellStatus(`Playing British model (${playbackSpeed.toFixed(playbackSpeed === 1 ? 1 : 2)}x)...`, 'play');

    let playedViaNode = false;
    if (ctx && analysis.buffer) {
      try {
        const src = ctx.createBufferSource();
        src.buffer = analysis.buffer;
        src.playbackRate.value = playbackSpeed;
        src.connect(ctx.destination);
        activeSourceNode = src;
        src.start(0, startOffset, activeDur + 0.05);
        playedViaNode = true;
      } catch (_) {}
    }
    if (!playedViaNode && typeof Audio !== 'undefined') {
      try {
        const audioEl = ensureFallbackAudioEl();
        if (audioEl) {
          audioEl.src = currentDrill.audioSrc;
          audioEl.playbackRate = playbackSpeed;
          audioEl.onloadedmetadata = () => {
            if (isPlayingRef && Number.isFinite(audioEl.duration) && audioEl.duration > 0.4) {
              playTotalMs = (audioEl.duration / playbackSpeed) * 1000;
            }
          };
          audioEl.play().catch(() => {});
        }
      } catch (_) {}
    }

    startSweepLoop(
      (prog, elapsed) => updateWellTimer(elapsed / 1000, playTotalMs / 1000),
      () => {
        isPlayingRef = false;
        activeSourceNode = null;
        if (!playedViaNode && fallbackAudioEl) {
          try { fallbackAudioEl.pause(); fallbackAudioEl.currentTime = 0; } catch (_) {}
        }
        if (playLbl) playLbl.textContent = 'Listen to British Model';
        if (playBtn) playBtn.classList.remove('is-playing');
        drawLiveLayer(0);
        if (onFinishedCallback) {
          onFinishedCallback();
        } else {
          updateWellStatus('Model finished · Your turn to shadow or tap rhythm.', 'ready');
        }
      }
    );
  }

  async function playMyTake(onFinishedCallback) {
    if (!hasStudentTrace && !userAudioBuffer && !userAudioUrl) return;
    if (!onFinishedCallback) stopAllAudioAndAnim();

    const analysis = analysisCache.get(currentDrill.id);
    const refSpan = analysis ? analysis.activeSpanSec : 2.1;
    let durMs = Math.max(900, (refSpan / playbackSpeed) * 1000);
    let playedAudio = false;

    if (userAudioBuffer) {
      const ctx = getPlayCtx();
      if (ctx) {
        try {
          const samples = userAudioBuffer.getChannelData(0);
          const { startSample, endSample } = findActiveSpeechBounds(samples, userAudioBuffer.sampleRate);
          const startSec = startSample / userAudioBuffer.sampleRate;
          const spanSec = Math.max(0.35, (endSample - startSample) / userAudioBuffer.sampleRate);
          durMs = (spanSec / playbackSpeed) * 1000;
          const src = ctx.createBufferSource();
          src.buffer = userAudioBuffer;
          src.playbackRate.value = playbackSpeed;
          src.connect(ctx.destination);
          activeSourceNode = src;
          src.start(0, startSec, spanSec + 0.04);
          playedAudio = true;
        } catch (_) {}
      }
    } else if (userAudioUrl && typeof Audio !== 'undefined') {
      try {
        if (!fallbackAudioEl) fallbackAudioEl = new Audio();
        fallbackAudioEl.src = userAudioUrl;
        fallbackAudioEl.playbackRate = playbackSpeed;
        fallbackAudioEl.play().catch(() => {});
        playedAudio = true;
      } catch (_) {}
    }

    isPlayingMine = true;
    playSweepMode = 'mine';
    playStartTs = performance.now();
    playTotalMs = durMs;
    updateWellStatus(
      playedAudio ? 'Replaying your recorded take...' : 'Replaying your rhythm envelope trace...',
      'play'
    );

    // Optional soft rhythmic cadence pulse when in quiet/simulated mode with SFX enabled
    let nextPeakIdx = 0;
    const peaks = currentDrill.peaks || [];

    startSweepLoop(
      (prog, elapsed) => {
        updateWellTimer(elapsed / 1000, durMs / 1000);
        if (!playedAudio && soundEnabled && nextPeakIdx < peaks.length && prog >= peaks[nextPeakIdx].pos) {
          sfx('stress');
          nextPeakIdx++;
        }
      },
      () => {
        isPlayingMine = false;
        activeSourceNode = null;
        drawLiveLayer(0);
        if (onFinishedCallback) {
          onFinishedCallback();
        } else {
          updateWellStatus('Replay finished · Try Compare Ref → Mine or advance to the next clip.', 'ok');
        }
      }
    );
  }

  function playCompareRefThenMine() {
    if (!hasStudentTrace && !userAudioBuffer && !userAudioUrl) return;
    stopAllAudioAndAnim();
    compareAbort = false;
    isComparing = true;
    updateWellStatus('Compare 1/2 · Playing British Reference...', 'play');
    playReferenceClip(() => {
      if (compareAbort) return;
      updateWellStatus('Compare pause · Next up: Your Take...', 'play');
      setTimeout(() => {
        if (compareAbort) return;
        updateWellStatus('Compare 2/2 · Playing Your Take...', 'play');
        playMyTake(() => {
          isComparing = false;
          updateWellStatus('Ref → Mine comparison complete.', 'ok');
        });
      }, 240);
    });
  }

  async function startMicShadowing() {
    if (isRecording) {
      finishMicRecording(false);
      return;
    }
    stopAllAudioAndAnim();
    resetStudentTraceOnly();

    const analysis = await ensureDrillAnalysis(currentDrill);
    const refSpan = analysis ? analysis.activeSpanSec : 2.2;
    recordWindowMs = Math.max(2500, Math.round((refSpan / playbackSpeed) * 1000) + 950);

    const recBtn = $('btn-record-mic');
    if (!quietMode && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false }
          });
        } catch (_) {
          micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        const ctx = getPlayCtx();
        if (ctx) {
          micSource = ctx.createMediaStreamSource(micStream);
          analyser = ctx.createAnalyser();
          analyser.fftSize = 1024;
          analyser.smoothingTimeConstant = 0.72;
          micSource.connect(analyser);
          freqData = new Uint8Array(analyser.frequencyBinCount);
          timeData = new Uint8Array(analyser.fftSize);
        }
        if (typeof MediaRecorder !== 'undefined') {
          recChunks = [];
          const opts = MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported('audio/webm')
            ? { mimeType: 'audio/webm' }
            : undefined;
          mediaRecorder = opts ? new MediaRecorder(micStream, opts) : new MediaRecorder(micStream);
          mediaRecorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) recChunks.push(ev.data);
          };
          mediaRecorder.start(100);
        }
      } catch (_) {
        quietMode = true;
        syncQuietModeUI();
      }
    } else {
      quietMode = true;
      syncQuietModeUI();
    }

    isRecording = true;
    playSweepMode = 'mine';
    recordStartTs = performance.now();
    if (recBtn) {
      recBtn.classList.add('is-recording');
      recBtn.textContent = quietMode ? '⏹ Stop Rhythm Window' : '⏹ Stop & Score';
    }
    updateWellStatus(
      quietMode
        ? 'Quiet-room window active · Tap the rhythm pads below in order.'
        : 'Listening · Shadow the British rhythm now!',
      'rec'
    );

    const tickRec = () => {
      if (!isRecording) return;
      const elapsed = performance.now() - recordStartTs;
      const prog = Math.min(1, elapsed / recordWindowMs);
      updateWellTimer(elapsed / 1000, recordWindowMs / 1000);

      if (!quietMode && analyser && freqData) {
        analyser.getByteFrequencyData(freqData);
        let sumSq = 0;
        const maxBin = Math.min(freqData.length, 110);
        for (let i = 2; i < maxBin; i++) {
          const v = freqData[i] / 255;
          sumSq += v * v;
        }
        const rms = Math.sqrt(sumSq / Math.max(1, maxBin - 2));
        const bucket = Math.min(ENVELOPE_BUCKETS - 1, Math.max(0, Math.floor(prog * (ENVELOPE_BUCKETS - 1))));
        studentEnvelope[bucket] = Math.max(studentEnvelope[bucket], Math.min(0.98, rms * 1.9));
        if (rms > 0.03) hasStudentTrace = true;
      }

      drawLiveLayer(prog);
      if (elapsed >= recordWindowMs) {
        finishMicRecording(false);
        return;
      }
      rafId = requestAnimationFrame(tickRec);
    };
    rafId = requestAnimationFrame(tickRec);
  }

  function finishMicRecording(cancelled) {
    if (!isRecording) return;
    isRecording = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    const recBtn = $('btn-record-mic');
    if (recBtn) {
      recBtn.classList.remove('is-recording');
      recBtn.textContent = '🎙️ Shadow with Mic';
    }

    const stopTracks = () => {
      if (micStream) {
        micStream.getTracks().forEach((t) => t.stop());
        micStream = null;
      }
      micSource = null;
      analyser = null;
    };

    const finalizeScore = () => {
      if (cancelled) return;
      if (!hasStudentTrace && quietMode) {
        updateWellStatus('Tap the rhythm pads below or click Simulate C1 Shadowing.', 'ready');
        drawLiveLayer(0);
        return;
      }
      isSimulatedTake = false;
      syncActionButtons();
      drawLiveLayer(0);
      const res = scoreStudentTrace(currentDrill, studentEnvelope);
      applyScoreToUI(res, quietMode ? '✓ Quiet-room rhythm scored' : '✓ Live mic recording scored');
      updateWellStatus(`Scored: ${res.overallPct}% Match`, res.passed ? 'ok' : 'ready');
    };

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      const mr = mediaRecorder;
      mediaRecorder = null;
      mr.onstop = async () => {
        stopTracks();
        if (cancelled) return;
        try {
          if (recChunks.length > 0) {
            const blob = new Blob(recChunks, { type: mr.mimeType || 'audio/webm' });
            if (userAudioUrl) {
              try { URL.revokeObjectURL(userAudioUrl); } catch (_) {}
            }
            userAudioUrl = URL.createObjectURL(blob);
            const arr = await blob.arrayBuffer();
            const decoded = await decodeBytesSafe(arr);
            userAudioBuffer = decoded;
            const samples = decoded.getChannelData(0);
            const { startSample, endSample, maxRms } = findActiveSpeechBounds(samples, decoded.sampleRate);
            if (maxRms > 0.004) {
              studentEnvelope = computeEnvelopeFromSamples(samples, startSample, endSample, ENVELOPE_BUCKETS);
              hasStudentTrace = true;
            }
          }
        } catch (_) {
          // Keep live AnalyserNode envelope if WebM decode fails on short take
        }
        finalizeScore();
      };
      try { mr.stop(); } catch (_) { stopTracks(); finalizeScore(); }
    } else {
      mediaRecorder = null;
      stopTracks();
      finalizeScore();
    }
  }

  /* ---------------- QUIET-ROOM TAP-RHYTHM & SIMULATED C1 SHADOWING ---------------- */
  function injectEnvelopeGaussian(pos, amp, radiusBuckets = 7) {
    const center = Math.round(pos * (ENVELOPE_BUCKETS - 1));
    for (let i = -radiusBuckets; i <= radiusBuckets; i++) {
      const idx = center + i;
      if (idx >= 0 && idx < ENVELOPE_BUCKETS) {
        const w = Math.cos((i / (radiusBuckets + 1)) * (Math.PI / 2));
        const val = amp * w;
        if (val > studentEnvelope[idx]) {
          studentEnvelope[idx] = val;
        }
      }
    }
    hasStudentTrace = true;
  }

  function injectEnvelopeSpanFloor(spanStart, spanEnd, floorVal = 0.15) {
    const b0 = Math.max(0, Math.round(spanStart * (ENVELOPE_BUCKETS - 1)));
    const b1 = Math.min(ENVELOPE_BUCKETS - 1, Math.round(spanEnd * (ENVELOPE_BUCKETS - 1)));
    for (let b = b0; b <= b1; b++) {
      if (floorVal > studentEnvelope[b]) {
        studentEnvelope[b] = floorVal;
      }
    }
    hasStudentTrace = true;
  }

  function getStressChunkPeaks(drill, targetChunkIdx) {
    const chunks = drill.rhythmChunks || [];
    const stressChunks = chunks
      .map((c, idx) => ({ chunk: c, idx }))
      .filter((item) => item.chunk.role === 'stress');
    if (!stressChunks.length) return [];

    return (drill.peaks || []).filter((p) => {
      let nearestIdx = stressChunks[0].idx;
      let nearestDist = Math.abs(stressChunks[0].chunk.pos - p.pos);
      for (let i = 1; i < stressChunks.length; i++) {
        const dist = Math.abs(stressChunks[i].chunk.pos - p.pos);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = stressChunks[i].idx;
        }
      }
      return nearestIdx === targetChunkIdx;
    });
  }

  function handleRhythmPadTap(chunk, btnEl, chunkIdx) {
    if (btnEl) btnEl.classList.add('is-hit');
    const chunks = currentDrill.rhythmChunks || [];
    const idx = typeof chunkIdx === 'number' ? chunkIdx : chunks.indexOf(chunk);
    const spanStart = idx > 0 ? (chunks[idx - 1].pos + chunk.pos) / 2 : 0;
    const spanEnd = idx >= 0 && idx < chunks.length - 1 ? (chunk.pos + chunks[idx + 1].pos) / 2 : 1;

    injectEnvelopeSpanFloor(spanStart, spanEnd, 0.15);

    const isStress = chunk.role === 'stress';
    if (isStress) {
      const assignedPeaks = idx >= 0 ? getStressChunkPeaks(currentDrill, idx) : [];
      const pulseAmp = chunk.amp || 0.9;
      if (assignedPeaks.length > 0) {
        assignedPeaks.forEach((p) => injectEnvelopeGaussian(p.pos, pulseAmp, 5));
      } else {
        injectEnvelopeGaussian(chunk.pos, pulseAmp, 5);
      }
    } else {
      injectEnvelopeGaussian(chunk.pos, 0.19, 5);
    }

    sfx(isStress ? 'stress' : 'weak');
    isSimulatedTake = true;
    syncActionButtons();
    drawLiveLayer(chunk.pos);

    const hitCount = document.querySelectorAll('#rhythm-pads .rhythm-pad.is-hit').length;
    const isFinalPad = hitCount >= chunks.length;
    if (hitCount >= Math.max(2, chunks.length - 1)) {
      const res = scoreStudentTrace(currentDrill, studentEnvelope);
      applyScoreToUI(res, '✓ Tap-rhythm pattern scored', { finalizeTake: isFinalPad });
      updateWellStatus(
        isFinalPad ? `Rhythm tapped · ${res.overallPct}% Match` : `Preview · ${res.overallPct}% Match (tap remaining pad)`,
        isFinalPad && res.passed ? 'ok' : 'ready'
      );
    } else {
      updateWellStatus(`Tapped "${chunk.text}" (${hitCount}/${chunks.length})`, 'ready');
    }
  }

  function simulateC1Shadowing() {
    stopAllAudioAndAnim();
    resetStudentTraceOnly();

    const cached = analysisCache.get(currentDrill.id);
    const refEnv = cached ? cached.envelope : buildFallbackEnvelope(currentDrill);
    // Shape a realistic C1 high-contrast trace aligned to refEnv + boosted stress peaks / compressed valleys
    for (let i = 0; i < ENVELOPE_BUCKETS; i++) {
      studentEnvelope[i] = Math.min(0.95, Math.max(0.08, refEnv[i] * 0.88));
    }
    currentDrill.peaks.forEach((p) => injectEnvelopeGaussian(p.pos, Math.min(0.96, p.amp * 0.95), 7));
    currentDrill.valleys.forEach((v) => {
      const c = Math.round(v.pos * (ENVELOPE_BUCKETS - 1));
      for (let i = -4; i <= 4; i++) {
        const idx = c + i;
        if (idx >= 0 && idx < ENVELOPE_BUCKETS) {
          studentEnvelope[idx] = Math.min(studentEnvelope[idx], 0.27);
        }
      }
    });

    hasStudentTrace = true;
    isSimulatedTake = true;
    document.querySelectorAll('#rhythm-pads .rhythm-pad').forEach((b) => b.classList.add('is-hit'));

    syncActionButtons();
    drawLiveLayer(0);
    const res = scoreStudentTrace(currentDrill, studentEnvelope);
    applyScoreToUI(res, '✓ Simulated C1 shadowing scored');
    updateWellStatus(`Simulated C1 shadowing · ${res.overallPct}% Match`, res.passed ? 'ok' : 'ready');
  }

  function resetStudentTraceOnly() {
    studentEnvelope.fill(0);
    hasStudentTrace = false;
    isSimulatedTake = false;
    lastScoreResult = null;
    takeBaseStreak = null;
    takeAttemptRecorded = false;
    takeSolveSfxPlayed = false;
    takeDailyWritten = false;
    takeDuelWritten = false;
    takeFinalized = false;
    userAudioBuffer = null;
    if (userAudioUrl) {
      try { URL.revokeObjectURL(userAudioUrl); } catch (_) {}
      userAudioUrl = '';
    }
    document.querySelectorAll('#rhythm-pads .rhythm-pad').forEach((b) => b.classList.remove('is-hit'));
    const card = $('score-card');
    if (card) card.classList.add('hidden');
    syncActionButtons();
    drawLiveLayer(0);
  }

  function syncQuietModeUI() {
    const btn = $('btn-mode-toggle');
    if (btn) {
      btn.textContent = quietMode ? 'Switch to microphone' : 'Quiet room? Tap rhythm';
      btn.setAttribute('aria-pressed', quietMode ? 'true' : 'false');
    }
    const pill = $('engine-status-pill');
    if (pill) {
      pill.textContent = quietMode ? 'Quiet-Room Tap Rhythm Mode' : 'British Neural Audio Ready';
    }
  }

  /* ---------------- RENDERING & NAVIGATION ---------------- */
  function updateHudUI() {
    const prog = $('hud-progress');
    const streak = $('streak-display');
    if (prog) {
      if (duelActive && duelSpec) {
        prog.textContent = `Duel ${duelStep + 1}/${duelSpec.steps.length}`;
      } else if (dailyActive && dailyData) {
        prog.textContent = `Daily ${dailyStep + 1}/${dailyData.steps.length}`;
      } else {
        prog.textContent = `Clip ${state.currentIdx + 1}/${D.allDrills.length}`;
      }
    }
    if (streak) streak.textContent = `🔥 ${state.streak}`;
  }

  function syncActPills() {
    document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
      const actNum = parseInt(btn.dataset.act || '', 10);
      const mode = btn.dataset.mode || '';
      let active = false;
      if (duelActive) active = mode === 'duel';
      else if (dailyActive) active = mode === 'daily';
      else if (!Number.isNaN(actNum)) active = actNum === currentDrill.act;
      btn.classList.toggle('active', active);
    });
  }

  function toggleBlueprint(forceState) {
    const panel = $('blueprint-panel');
    const btn = $('btn-blueprint');
    if (!panel || !btn) return;
    const willShow = typeof forceState === 'boolean' ? forceState : panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !willShow);
    btn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
    btn.textContent = willShow ? '🙈 Hide Phonetic Blueprint' : '👁️ Reveal Phonetic Blueprint';
  }

  async function renderCurrentDrill() {
    const gen = ++renderGen;
    stopAllAudioAndAnim();
    resetStudentTraceOnly();
    toggleBlueprint(false);

    const d = currentDrill;
    const globalNum = Math.max(1, D.allDrills.findIndex((item) => item.id === d.id) + 1);
    updateHudUI();
    syncActPills();
    updateModeBadge();

    if ($('drill-meta-tag')) {
      const stepLabel = duelActive && duelSpec
        ? `DUEL ${duelStep + 1}/${duelSpec.steps.length}`
        : (dailyActive && dailyData ? `DAILY ${dailyStep + 1}/${dailyData.steps.length}` : `CLIP ${String(globalNum).padStart(2, '0')}/${D.allDrills.length}`);
      $('drill-meta-tag').textContent = `ACT ${d.act} · ${d.cefr} · ${stepLabel}`;
    }
    if ($('drill-title')) $('drill-title').textContent = `${globalNum}. ${d.title.replace(/^\d+\.\s*/, '')}`;
    if ($('scene-context')) $('scene-context').textContent = d.context;
    if ($('target-feature-badge')) $('target-feature-badge').textContent = d.targetFeature;

    // Sentence segments
    const segWrap = $('sentence-segments');
    if (segWrap) {
      segWrap.textContent = '';
      d.segments.forEach((seg) => {
        const chip = document.createElement('span');
        chip.className = `word-token ${seg.role === 'stress' ? 'is-stress' : 'is-weak'}`;
        const wordSpan = document.createElement('span');
        wordSpan.textContent = seg.text;
        const ipaSpan = document.createElement('span');
        ipaSpan.className = 'token-ipa';
        ipaSpan.textContent = seg.ipa;
        chip.append(wordSpan, ipaSpan);
        segWrap.appendChild(chip);
      });
    }

    // Rhythm pads
    const padsWrap = $('rhythm-pads');
    if (padsWrap) {
      padsWrap.textContent = '';
      d.rhythmChunks.forEach((chunk, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `rhythm-pad ${chunk.role === 'stress' ? 'pad-stress' : 'pad-weak'}`;
        btn.textContent = chunk.text;
        btn.addEventListener('click', () => handleRhythmPadTap(chunk, btn, idx));
        padsWrap.appendChild(btn);
      });
    }

    // Phonetic Blueprint fields
    if ($('bp-feature-title')) $('bp-feature-title').textContent = d.targetFeature;
    if ($('bp-cefr')) $('bp-cefr').textContent = d.cefr;
    if ($('bp-written')) $('bp-written').textContent = `“${d.writtenText}”`;
    if ($('bp-ipa')) $('bp-ipa').textContent = d.weakIpa;
    if ($('bp-respelling')) $('bp-respelling').textContent = d.phoneticRespelling;
    if ($('bp-formula')) $('bp-formula').textContent = d.formula;
    if ($('bp-note')) $('bp-note').textContent = d.belfastNote;

    if ($('btn-next')) {
      if (duelActive && duelSpec && duelStep === duelSpec.steps.length - 1) {
        $('btn-next').textContent = 'Finish Duel →';
      } else if (dailyActive && dailyData && dailyStep === dailyData.steps.length - 1) {
        $('btn-next').textContent = 'Finish Daily 5 →';
      } else if (!dailyActive && !duelActive && state.currentIdx === D.allDrills.length - 1) {
        $('btn-next').textContent = `Finish All ${D.allDrills.length} Clips →`;
      } else {
        $('btn-next').textContent = 'Next Clip →';
      }
    }

    drawReferenceLayer();
    drawLiveLayer(0);
    updateWellTimer(0, 2.1 / playbackSpeed);
    updateWellStatus('Decoding British spectrogram...', 'ready');

    const analysis = await ensureDrillAnalysis(d);
    if (gen === renderGen && currentDrill.id === d.id) {
      drawReferenceLayer();
      updateWellTimer(0, (analysis.activeSpanSec || 2.1) / playbackSpeed);
      updateWellStatus('Spectrogram ready · Listen to the British model, then shadow.', 'ready');
    }
  }

  function jumpToAct(actNum) {
    exitSpecialModes();
    const idx = D.allDrills.findIndex((d) => d.act === actNum);
    if (idx < 0) return;
    state.currentIdx = idx;
    currentDrill = D.allDrills[idx];
    saveState();
    renderCurrentDrill();
  }

  function nextClip() {
    const committedScore = takeFinalized ? lastScoreResult : null;
    if (duelActive && duelSpec) {
      if (duelResults[duelStep] == null) {
        duelResults[duelStep] = {
          id: currentDrill.id,
          pct: committedScore ? committedScore.overallPct : 0,
          passed: Boolean(committedScore && committedScore.passed),
          simulated: isSimulatedTake
        };
      }
      if (duelStep + 1 < duelSpec.steps.length) {
        duelStep += 1;
        currentDrill = duelSpec.steps[duelStep].drill;
        resumeDuelTimer();
        renderCurrentDrill();
      } else {
        pauseDuelTimer();
        openRecapModal('duel');
      }
      return;
    }

    if (dailyActive && dailyData) {
      if (dailyResults[dailyStep] == null) {
        dailyResults[dailyStep] = {
          id: currentDrill.id,
          pct: committedScore ? committedScore.overallPct : 0,
          passed: Boolean(committedScore && committedScore.passed),
          simulated: isSimulatedTake
        };
      }
      if (dailyStep + 1 < dailyData.steps.length) {
        dailyStep += 1;
        currentDrill = dailyData.steps[dailyStep].drill;
        renderCurrentDrill();
      } else {
        openRecapModal('daily');
      }
      return;
    }

    if (state.currentIdx + 1 < D.allDrills.length) {
      state.currentIdx += 1;
      currentDrill = D.allDrills[state.currentIdx];
      saveState();
      renderCurrentDrill();
    } else {
      openRecapModal('campaign');
    }
  }

  /* ---------------- DAILY 5 & DUEL MODES ---------------- */
  function formatClock(sec) {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(s / 60);
    const rem = String(s % 60).padStart(2, '0');
    return `${m}:${rem}`;
  }

  function currentDuelSeconds() {
    let totalMs = duelElapsedMs;
    if (duelTurnStartedAt !== null) {
      totalMs += Math.max(0, Date.now() - duelTurnStartedAt);
    }
    return Math.round(totalMs / 1000);
  }

  function updateModeBadge() {
    const badge = $('mode-badge');
    const exitBtn = $('exit-mode-btn');
    if (!badge || !exitBtn) return;

    if (duelActive && duelSpec) {
      badge.classList.remove('hidden', 'daily-active');
      exitBtn.classList.remove('hidden');
      badge.textContent = `⚔️ Duel ${duelStep + 1}/${duelSpec.steps.length} · ${formatClock(currentDuelSeconds())}`;
    } else if (dailyActive && dailyData) {
      badge.classList.remove('hidden');
      badge.classList.add('daily-active');
      exitBtn.classList.remove('hidden');
      badge.textContent = `🎲 Daily ${dailyStep + 1}/${dailyData.steps.length}`;
    } else {
      badge.classList.add('hidden');
      badge.classList.remove('daily-active');
      exitBtn.classList.add('hidden');
      badge.textContent = '';
    }
  }

  function resumeDuelTimer() {
    if (!duelActive) return;
    if (duelTurnStartedAt === null) duelTurnStartedAt = Date.now();
    if (!duelTimerInterval && !inSelfTest) {
      duelTimerInterval = setInterval(updateModeBadge, 250);
    }
    updateModeBadge();
  }

  function pauseDuelTimer() {
    if (duelTurnStartedAt !== null) {
      duelElapsedMs += Math.max(0, Date.now() - duelTurnStartedAt);
      duelTurnStartedAt = null;
    }
    if (duelTimerInterval) {
      clearInterval(duelTimerInterval);
      duelTimerInterval = null;
    }
    updateModeBadge();
  }

  function exitSpecialModes() {
    pauseDuelTimer();
    dailyActive = false;
    dailyData = null;
    dailyStep = 0;
    dailyResults = [];
    duelActive = false;
    duelSpec = null;
    duelStep = 0;
    duelResults = [];
    duelElapsedMs = 0;
    const banner = $('duel-target-banner');
    if (banner) {
      banner.classList.add('hidden');
      banner.textContent = '';
    }
    updateModeBadge();
  }

  function startDailyMode() {
    exitSpecialModes();
    toggleDuelDrawer(false);
    dailyActive = true;
    dailyData = D.dailyGauntlet(D.getTodaySeed());
    dailyStep = 0;
    dailyResults = [];
    currentDrill = dailyData.steps[0].drill;
    renderCurrentDrill();
  }

  function startDuelMode(spec) {
    if (!spec || !spec.steps || spec.steps.length < 3) return false;
    exitSpecialModes();
    toggleDuelDrawer(false);
    duelActive = true;
    duelSpec = spec;
    duelStep = 0;
    duelResults = [];
    duelElapsedMs = 0;
    duelTurnStartedAt = null;

    const banner = $('duel-target-banner');
    if (banner) {
      if (spec.avgPct > 0 || spec.sec > 0 || spec.by) {
        const who = spec.by ? `${spec.by} scored` : 'Target to beat:';
        const scorePart = spec.avgPct > 0 ? ` ${spec.avgPct}% avg` : '';
        const timePart = spec.sec > 0 ? ` in ${formatClock(spec.sec)}` : '';
        banner.textContent = `⚔️ Rhythm Duel · ${who}${scorePart}${timePart}`;
        banner.classList.remove('hidden');
      } else {
        banner.textContent = `⚔️ Rhythm Duel · ${spec.steps.length} Clips`;
        banner.classList.remove('hidden');
      }
    }

    currentDrill = duelSpec.steps[0].drill;
    resumeDuelTimer();
    renderCurrentDrill();
    return true;
  }

  /* ---------------- DUEL FORGE DRAWER ---------------- */
  function initDuelForgeUI() {
    const grid = $('duel-slots-grid');
    if (!grid) return;
    grid.textContent = '';
    const initial = D.duelPreset('all_mix').ids;
    for (let slot = 0; slot < 5; slot++) {
      const field = document.createElement('div');
      field.className = 'duel-slot-field';
      const lbl = document.createElement('label');
      lbl.setAttribute('for', `duel-slot-${slot}`);
      lbl.textContent = `Clip ${slot + 1}`;
      const sel = document.createElement('select');
      sel.id = `duel-slot-${slot}`;
      sel.className = 'duel-slot-select';

      D.acts.forEach((actMeta) => {
        const grp = document.createElement('optgroup');
        grp.label = actMeta.title;
        D.allDrills.filter((d) => d.act === actMeta.act).forEach((d) => {
          const opt = document.createElement('option');
          opt.value = d.id;
          const globalNum = String(D.allDrills.findIndex((item) => item.id === d.id) + 1).padStart(2, '0');
          opt.textContent = `${globalNum} · ${d.writtenText.slice(0, 32)} (${d.cefr})`;
          grp.appendChild(opt);
        });
        sel.appendChild(grp);
      });

      sel.value = initial[slot];
      sel.addEventListener('change', updateDuelPreview);
      field.append(lbl, sel);
      grid.appendChild(field);
    }
    updateDuelPreview();
  }

  function getSelectedDuelIds() {
    return Array.from(document.querySelectorAll('#duel-slots-grid .duel-slot-select')).map((s) => s.value);
  }

  function applyDuelPreset(presetKey) {
    const preset = D.duelPreset(presetKey);
    const sels = Array.from(document.querySelectorAll('#duel-slots-grid .duel-slot-select'));
    preset.ids.forEach((id, idx) => {
      if (sels[idx]) sels[idx].value = id;
    });
    if ($('duel-forge-status')) $('duel-forge-status').textContent = '';
    updateDuelPreview();
  }

  function updateDuelPreview() {
    const ids = getSelectedDuelIds();
    const uniqueIds = [...new Set(ids)];
    const statusEl = $('duel-forge-status');
    if (statusEl) {
      if (uniqueIds.length < ids.length) {
        const dupCount = ids.length - uniqueIds.length;
        statusEl.textContent = `${uniqueIds.length} distinct clips selected (${dupCount} duplicate slot${dupCount > 1 ? 's' : ''} omitted).`;
      } else if (/distinct clips selected/i.test(statusEl.textContent)) {
        statusEl.textContent = '';
      }
    }
    const preview = $('duel-preview-list');
    if (!preview || preview.classList.contains('hidden')) return;
    preview.textContent = '';
    ids.forEach((id, idx) => {
      const d = D.findById(id);
      if (!d) return;
      const line = document.createElement('div');
      line.textContent = `${idx + 1}. [${d.cefr}] "${d.writtenText}" -> ${d.phoneticRespelling}`;
      preview.appendChild(line);
    });
  }

  function toggleDuelDrawer(forceOpen) {
    const drawer = $('duel-forge-drawer');
    const btn = $('duel-forge-btn');
    if (!drawer) return;
    const willOpen = typeof forceOpen === 'boolean' ? forceOpen : drawer.classList.contains('hidden');
    drawer.classList.toggle('hidden', !willOpen);
    if (btn) btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  }

  function copyTextWithFallback(text, onDone) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(onDone).catch(() => fallbackCopy(text, onDone));
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, onDone) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (onDone) onDone();
    } catch (_) {}
  }

  function buildDuelUrl(token) {
    if (location.protocol.startsWith('http')) {
      return `${location.origin}${location.pathname}?duel=${encodeURIComponent(token)}`;
    }
    return `${SHARE_BASE_URL}?duel=${encodeURIComponent(token)}`;
  }

  /* ---------------- RECAP MODAL ---------------- */
  function getRecapStats(mode) {
    if (mode === 'daily' && dailyData) {
      const steps = dailyData.steps.map((st, idx) => {
        const res = dailyResults[idx] || { pct: 0, passed: false };
        return {
          emoji: res.passed ? '🟩' : (res.pct > 0 ? '🟨' : '⬜'),
          cefr: st.cefr,
          sentence: st.drill.writtenText,
          note: `${res.pct}% match · ${st.drill.phoneticRespelling}`,
          pct: res.pct,
          passed: res.passed
        };
      });
      const avgPct = Math.round(steps.reduce((a, b) => a + b.pct, 0) / Math.max(1, steps.length));
      const cleanCount = steps.filter((s) => s.passed).length;
      return {
        mode: 'daily',
        seed: dailyData.seed,
        ids: dailyData.steps.map((s) => s.id),
        grid: steps.map((s) => s.emoji).join(''),
        avgPct,
        score: cleanCount,
        maxScore: steps.length,
        steps
      };
    }

    if (mode === 'duel' && duelSpec) {
      const sec = currentDuelSeconds();
      const steps = duelSpec.steps.map((st, idx) => {
        const res = duelResults[idx] || { pct: 0, passed: false };
        return {
          emoji: res.passed ? '🟩' : (res.pct > 0 ? '🟨' : '⬜'),
          cefr: st.cefr,
          sentence: st.drill.writtenText,
          note: `${res.pct}% match · ${st.drill.phoneticRespelling}`,
          pct: res.pct,
          passed: res.passed
        };
      });
      const avgPct = Math.round(steps.reduce((a, b) => a + b.pct, 0) / Math.max(1, steps.length));
      const cleanCount = steps.filter((s) => s.passed).length;
      let verdict = null;
      if (duelSpec.avgPct > 0 || duelSpec.sec > 0) {
        const won = duelSpec.sec > 0
          ? (avgPct > duelSpec.avgPct || (avgPct === duelSpec.avgPct && sec <= duelSpec.sec))
          : (avgPct >= duelSpec.avgPct);
        const timePart = duelSpec.sec > 0 ? ` in ${formatClock(duelSpec.sec)}` : '';
        verdict = {
          kind: won ? 'win' : 'loss',
          text: won
            ? `🏆 You beat ${duelSpec.by || 'the challenger'} (${avgPct}% vs ${duelSpec.avgPct}%)!`
            : `Target was ${duelSpec.avgPct}%${timePart} — run again or copy a counter-duel!`
        };
      }
      return {
        mode: 'duel',
        ids: duelSpec.ids,
        avgPct,
        sec,
        score: cleanCount,
        maxScore: steps.length,
        verdict,
        steps
      };
    }

    const steps = D.allDrills.map((d) => {
      const best = state.bestScores[d.id] || 0;
      const passed = best >= 75;
      return {
        emoji: passed ? '🟩' : (best > 0 ? '🟨' : '⬜'),
        cefr: d.cefr,
        sentence: d.writtenText,
        note: `Best: ${best}% · ${d.phoneticRespelling}`,
        pct: best,
        passed
      };
    });
    const avgPct = Math.round(steps.reduce((a, b) => a + b.pct, 0) / steps.length);
    const cleanCount = steps.filter((s) => s.passed).length;
    return {
      mode: 'campaign',
      avgPct,
      score: cleanCount,
      maxScore: steps.length,
      steps
    };
  }

  function openRecapModal(mode) {
    const modal = $('recap-modal');
    if (!modal) return;
    recapReturnFocus = document.activeElement;
    activeRecapMode = mode;
    const stats = getRecapStats(mode);

    const heading = $('recap-heading');
    const summary = $('recap-summary');
    const verdictEl = $('recap-verdict');
    const listEl = $('recap-step-list');
    const copyDailyBtn = $('btn-copy-daily');
    const copyDuelBtn = $('btn-copy-duel');

    if (verdictEl) {
      verdictEl.classList.add('hidden');
      verdictEl.classList.remove('verdict-win', 'verdict-loss');
    }
    if (listEl) listEl.textContent = '';

    if (mode === 'daily') {
      if (!inSelfTest && state.lastDailyDate !== stats.seed) {
        state.dailyStreak += 1;
        state.lastDailyDate = stats.seed;
        state.lastDailyGrid = stats.grid;
        saveState();
      }
      if (heading) heading.textContent = '🎲 Daily 5 Connected Speech Complete!';
      if (summary) summary.textContent = `${stats.grid} · ${stats.score}/${stats.maxScore} Strong Contrast · Avg ${stats.avgPct}%`;
      if (copyDailyBtn) copyDailyBtn.classList.remove('hidden');
      if (copyDuelBtn) copyDuelBtn.classList.remove('hidden');
    } else if (mode === 'duel') {
      if (heading) heading.textContent = '⚔️ Rhythm Duel Complete!';
      if (summary) summary.textContent = `Average Match: ${stats.avgPct}% (${stats.score}/${stats.maxScore} Clean) in ${formatClock(stats.sec)}`;
      if (verdictEl && stats.verdict) {
        verdictEl.classList.remove('hidden');
        verdictEl.classList.add(stats.verdict.kind === 'win' ? 'verdict-win' : 'verdict-loss');
        verdictEl.textContent = stats.verdict.text;
      }
      if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
      if (copyDuelBtn) copyDuelBtn.classList.remove('hidden');
    } else {
      if (heading) heading.textContent = `🏆 All ${D.allDrills.length} Connected Speech Clips Complete!`;
      if (summary) summary.textContent = `${stats.score}/${stats.maxScore} Clips Mastered · Average Match: ${stats.avgPct}%`;
      if (copyDailyBtn) copyDailyBtn.classList.add('hidden');
      if (copyDuelBtn) copyDuelBtn.classList.add('hidden');
    }

    if (listEl) {
      stats.steps.forEach((st) => {
        const row = document.createElement('div');
        row.className = 'recap-step-row';
        const badge = document.createElement('span');
        badge.className = 'recap-step-badge';
        badge.textContent = `${st.emoji} ${st.cefr}`;
        const body = document.createElement('div');
        body.className = 'recap-step-body';
        const sent = document.createElement('span');
        sent.className = 'recap-step-sentence';
        sent.textContent = st.sentence;
        const note = document.createElement('span');
        note.className = 'recap-step-note';
        note.textContent = st.note;
        body.append(sent, note);
        row.append(badge, body);
        listEl.appendChild(row);
      });
    }

    modal.classList.add('open');
  }

  function closeRecapModal(restoreCampaign) {
    const modal = $('recap-modal');
    if (!modal) return;
    const closedMode = activeRecapMode;
    modal.classList.remove('open');
    activeRecapMode = null;
    if (restoreCampaign && (closedMode === 'daily' || closedMode === 'duel')) {
      exitSpecialModes();
      currentDrill = D.allDrills[state.currentIdx] || D.allDrills[0];
      renderCurrentDrill();
    }
    if (recapReturnFocus && document.contains(recapReturnFocus)) {
      try { recapReturnFocus.focus(); } catch (_) {}
    }
  }

  /* ---------------- URL ROUTING ---------------- */
  function applyUrlRoute() {
    const params = new URLSearchParams(location.search);
    const duelRaw = params.get('duel');
    if (duelRaw !== null) {
      const spec = D.decodeDuel(duelRaw);
      if (spec && startDuelMode(spec)) return true;
    }
    if ((params.get('mode') || '').toLowerCase() === 'daily') {
      startDailyMode();
      return true;
    }
    const clipRaw = params.get('clip');
    if (clipRaw) {
      const idx = D.allDrills.findIndex((d) => d.id.toLowerCase() === clipRaw.trim().toLowerCase());
      if (idx >= 0) {
        state.currentIdx = idx;
        currentDrill = D.allDrills[idx];
        renderCurrentDrill();
        return true;
      }
    }
    if (params.has('act')) {
      const actNum = parseInt(params.get('act'), 10);
      if (actNum >= 1 && actNum <= 4) {
        jumpToAct(actNum);
        return true;
      }
    }
    return false;
  }

  /* ---------------- ?selftest=1 ---------------- */
  async function runSelfTest() {
    const checks = [];
    let pass = true;
    const record = (name, ok, detail) => {
      checks.push({ name, pass: Boolean(ok), detail: String(detail || '') });
      if (!ok) pass = false;
    };

    let savedRawStorage = null;
    try { savedRawStorage = localStorage.getItem(STORAGE_KEY); } catch (_) {}
    const savedStateJson = JSON.stringify(state);
    inSelfTest = true;
    exitSpecialModes();

    try {
      const dataRes = D.dataTests();
      record('dataTests', dataRes.pass, dataRes.lines.join(' | '));

      // Verify all audio buffers decode + STFT spectrogram + RMS envelope
      let decodedOk = 0;
      const decodeErrors = [];
      for (let i = 0; i < D.allDrills.length; i++) {
        const d = D.allDrills[i];
        const a = await ensureDrillAnalysis(d);
        const envMax = a && a.envelope ? Math.max(...a.envelope) : 0;
        const envMin = a && a.envelope ? Math.min(...a.envelope) : 1;
        const hasBuf = Boolean(a && a.buffer && a.buffer.duration > 0.5);
        const hasSpec = Boolean(a && a.spectrogram && a.spectrogram.cols === SPEC_COLS && a.spectrogram.bands === SPEC_BANDS);
        const hasEnv = Boolean(a && a.envelope && a.envelope.length === ENVELOPE_BUCKETS && envMax > envMin);
        if (hasBuf && hasSpec && hasEnv) {
          decodedOk++;
        } else {
          decodeErrors.push(`${d.id}(buf:${hasBuf},spec:${hasSpec},env:${hasEnv})`);
        }
      }
      record(
        'audioDecodeAndSpectrogram',
        decodedOk === D.allDrills.length,
        `${decodedOk}/${D.allDrills.length} decoded with ${SPEC_COLS}x${SPEC_BANDS} STFT (${window.location.protocol})${decodeErrors.length ? ' err=' + decodeErrors.join(',') : ''}`
      );

      // Verify Act jumping (1..4) walks 6 sequential clips per Act
      let actJumpOk = true;
      const actSummary = [];
      for (let aNum = 1; aNum <= D.acts.length; aNum++) {
        jumpToAct(aNum);
        const seenInAct = [];
        for (let step = 0; step < 6; step++) {
          if (!currentDrill || currentDrill.act !== aNum) actJumpOk = false;
          else seenInAct.push(currentDrill.id);
          if (step < 5) nextClip();
        }
        if (new Set(seenInAct).size !== 6) actJumpOk = false;
        actSummary.push(`A${aNum}:${seenInAct[0]}..${seenInAct[seenInAct.length - 1]}`);
      }
      record('actJumpNavigation', actJumpOk, actSummary.join(' '));

      // Verify drill rendering, speed toggle, blueprint toggle, simulation + scoring
      state.currentIdx = 0;
      currentDrill = D.allDrills[0];
      await renderCurrentDrill();

      const speedBtn085 = document.querySelector('.speed-btn[data-speed="0.85"]');
      if (speedBtn085) speedBtn085.click();
      record('speedToggle', Math.abs(playbackSpeed - 0.85) < 0.01, `playbackSpeed=${playbackSpeed}`);
      const speedBtn10 = document.querySelector('.speed-btn[data-speed="1.0"]');
      if (speedBtn10) speedBtn10.click();

      toggleBlueprint(true);
      const bpOpen = !$('blueprint-panel').classList.contains('hidden') && $('bp-ipa').textContent.length > 0;
      record('phoneticBlueprintToggle', bpOpen, `ipa=${$('bp-ipa').textContent}`);
      toggleBlueprint(false);

      simulateC1Shadowing();
      const simOk = Boolean(
        lastScoreResult &&
        lastScoreResult.overallPct >= 75 &&
        !$('score-card').classList.contains('hidden') &&
        !$('btn-replay-mine').disabled &&
        !$('btn-compare').disabled
      );
      record(
        'simulatedShadowingAndScoring',
        simOk,
        `match=${lastScoreResult ? lastScoreResult.overallPct : 0}% contrast=${lastScoreResult ? lastScoreResult.contrast.toFixed(2) : 0}`
      );

      // Verify quiet-room tap rhythm pads across all 24 drills + single +1 streak per full take
      state.streak = 0;
      let tapAllOk = true;
      const tapScores = [];
      const tapFails = [];
      for (let i = 0; i < D.allDrills.length; i++) {
        state.currentIdx = i;
        currentDrill = D.allDrills[i];
        await renderCurrentDrill();
        const prevStreak = state.streak;
        const pads = Array.from(document.querySelectorAll('#rhythm-pads .rhythm-pad'));
        pads.forEach((p) => p.click());
        const okDrill = Boolean(
          pads.length >= 3 &&
          hasStudentTrace &&
          !$('score-card').classList.contains('hidden') &&
          lastScoreResult &&
          lastScoreResult.passed === true &&
          lastScoreResult.overallPct >= 75 &&
          state.streak === prevStreak + 1
        );
        if (!okDrill) {
          tapAllOk = false;
          tapFails.push(`${currentDrill.id}:${lastScoreResult ? lastScoreResult.overallPct : 0}%/s=${state.streak}`);
        }
        tapScores.push(`${currentDrill.id}:${lastScoreResult ? lastScoreResult.overallPct : 0}%`);
      }
      // Verify partial pad taps (only first 2 pads on last drill) stay < 75%
      resetStudentTraceOnly();
      const partialPads = Array.from(document.querySelectorAll('#rhythm-pads .rhythm-pad')).slice(0, 2);
      partialPads.forEach((p) => p.click());
      const partialRes = scoreStudentTrace(currentDrill, studentEnvelope);
      const partialRejected = !partialRes.passed && partialRes.overallPct < 75;
      if (!partialRejected) tapAllOk = false;
      record(
        'tapRhythmPads',
        tapAllOk && state.streak === D.allDrills.length,
        `${D.allDrills.length}/${D.allDrills.length} passed (${tapScores[0]}..${tapScores[tapScores.length - 1]}) streak=${state.streak} partial2=${partialRes.overallPct}%${tapFails.length ? ' fail=' + tapFails.join(',') : ''}`
      );

      // Verify Daily 5
      startDailyMode();
      record('daily5Mode', dailyActive && dailyData && dailyData.steps.length === 5, `seed=${dailyData ? dailyData.seed : ''}`);

      // Verify Duel mode + recap modal (including new cs13..cs24 IDs)
      const tok = D.encodeDuel({ ids: ['cs1', 'cs13', 'cs16', 'cs19', 'cs24'], avgPct: 86, sec: 40, by: 'Igor' });
      const spec = D.decodeDuel(tok);
      startDuelMode(spec);
      simulateC1Shadowing();
      const duelOk = duelActive && !$('duel-target-banner').classList.contains('hidden') && $('duel-target-banner').textContent.includes('Igor');
      openRecapModal('duel');
      const recapOk = $('recap-modal').classList.contains('open') && !$('btn-copy-duel').classList.contains('hidden');
      closeRecapModal(false);
      record('duelModeAndRecap', duelOk && recapOk, `banner="${$('duel-target-banner').textContent}"`);

      // Verify WL / Clean screenshare guard
      syncCleanModeUI(true);
      const wlOk = $('belfast-desk-strip').classList.contains('hidden');
      syncCleanModeUI(false);
      record('whiteLabelGuard', wlOk, 'belfast-desk-strip hidden under wl=1');
    } catch (err) {
      record('runtimeException', false, err.message);
    }

    // Restore clean initial state without modifying real localStorage
    exitSpecialModes();
    inSelfTest = false;
    state = ensureState(JSON.parse(savedStateJson));
    try {
      if (savedRawStorage === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, savedRawStorage);
    } catch (_) {}
    syncCleanModeUI();
    currentDrill = D.allDrills[state.currentIdx] || D.allDrills[0];
    await renderCurrentDrill();

    window.__SELFTEST_RESULT__ = { pass, checks };

    const existing = $('selftest-banner');
    if (existing) existing.remove();
    const banner = document.createElement('pre');
    banner.id = 'selftest-banner';
    banner.dataset.pass = pass ? 'true' : 'false';
    banner.textContent = [
      `CONNECTED SPEECH LAB SELFTEST: ${pass ? 'PASS' : 'FAIL'}`,
      ...checks.map((c) => `${c.pass ? 'PASS' : 'FAIL'} [${c.name}] ${c.detail}`)
    ].join('\n');
    banner.style.cssText = `white-space:pre-wrap;background:#0f172a;color:${pass ? '#34d399' : '#fca5a5'};border:2px solid ${pass ? '#10b981' : '#ef4444'};padding:14px;border-radius:10px;font-family:monospace;font-size:12px;margin:16px auto;max-width:920px;`;
    document.body.appendChild(banner);
  }

  /* ---------------- BOOT & EVENT WIRING ---------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    loadState();
    syncCleanModeUI();
    syncQuietModeUI();

    try {
      new MutationObserver(() => syncCleanModeUI()).observe(document.body, { attributes: true, attributeFilter: ['class'] });
    } catch (_) {}
    window.addEventListener('storage', (e) => {
      if (e.key === CLEAN_KEY) syncCleanModeUI();
    });

    initDuelForgeUI();

    if ($('player-name-input')) {
      $('player-name-input').value = state.playerName || '';
      $('player-name-input').addEventListener('input', () => {
        state.playerName = $('player-name-input').value.replace(/[^A-Za-z0-9 _.-]/g, '').trim().slice(0, 18);
        saveState();
      });
    }

    if ($('audio-toggle')) {
      $('audio-toggle').addEventListener('click', () => {
        soundEnabled = !soundEnabled;
        $('audio-toggle').setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
        $('audio-toggle').textContent = soundEnabled ? '🔊 Sound On' : '🔇 Sound Off';
        if (soundEnabled) sfx('stress');
      });
    }

    if ($('daily-seed-btn')) $('daily-seed-btn').addEventListener('click', startDailyMode);
    if ($('duel-forge-btn')) $('duel-forge-btn').addEventListener('click', () => toggleDuelDrawer());
    if ($('duel-forge-close')) $('duel-forge-close').addEventListener('click', () => toggleDuelDrawer(false));

    if ($('exit-mode-btn')) {
      $('exit-mode-btn').addEventListener('click', () => {
        exitSpecialModes();
        currentDrill = D.allDrills[state.currentIdx] || D.allDrills[0];
        renderCurrentDrill();
      });
    }

    document.querySelectorAll('#act-jump-bar .act-pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        const actNum = parseInt(btn.dataset.act || '', 10);
        if (!Number.isNaN(actNum)) jumpToAct(actNum);
        else if (btn.dataset.mode === 'daily') startDailyMode();
        else if (btn.dataset.mode === 'duel') toggleDuelDrawer();
      });
    });

    document.querySelectorAll('.speed-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const wasPlaying = isPlayingRef || isPlayingMine || isComparing || isPlayRefPending;
        if (wasPlaying) stopAllAudioAndAnim();
        const spd = Number(btn.dataset.speed) || 1.0;
        playbackSpeed = spd;
        document.querySelectorAll('.speed-btn').forEach((b) => b.classList.toggle('is-active', b === btn));
        drawReferenceLayer();
        const cached = analysisCache.get(currentDrill.id);
        updateWellTimer(0, (cached ? cached.activeSpanSec : 2.1) / playbackSpeed);
        if (wasPlaying) {
          updateWellStatus(`Speed set to ${spd.toFixed(spd === 1 ? 1 : 2)}x · Click Listen to replay.`, 'ready');
        }
      });
    });

    if ($('btn-play-ref')) $('btn-play-ref').addEventListener('click', () => playReferenceClip());
    if ($('btn-record-mic')) $('btn-record-mic').addEventListener('click', startMicShadowing);
    if ($('btn-replay-mine')) $('btn-replay-mine').addEventListener('click', () => playMyTake());
    if ($('btn-compare')) $('btn-compare').addEventListener('click', playCompareRefThenMine);
    if ($('btn-simulate')) $('btn-simulate').addEventListener('click', simulateC1Shadowing);

    if ($('btn-mode-toggle')) {
      $('btn-mode-toggle').addEventListener('click', () => {
        stopAllAudioAndAnim();
        quietMode = !quietMode;
        syncQuietModeUI();
      });
    }

    if ($('btn-clear-trace')) {
      $('btn-clear-trace').addEventListener('click', () => {
        stopAllAudioAndAnim();
        resetStudentTraceOnly();
        updateWellStatus('Trace cleared · Listen, shadow with your mic, or tap rhythm.', 'ready');
      });
    }

    if ($('btn-reset')) {
      $('btn-reset').addEventListener('click', () => {
        stopAllAudioAndAnim();
        resetStudentTraceOnly();
        toggleBlueprint(false);
        updateWellStatus('Ready · Listen, shadow with your mic, or tap rhythm.', 'ready');
      });
    }

    if ($('btn-blueprint')) {
      $('btn-blueprint').addEventListener('click', () => toggleBlueprint());
    }

    if ($('btn-next')) {
      $('btn-next').addEventListener('click', nextClip);
    }

    document.querySelectorAll('[data-duel-preset]').forEach((btn) => {
      btn.addEventListener('click', () => applyDuelPreset(btn.dataset.duelPreset));
    });

    if ($('duel-preview-toggle')) {
      $('duel-preview-toggle').addEventListener('click', () => {
        const list = $('duel-preview-list');
        if (!list) return;
        const willShow = list.classList.contains('hidden');
        list.classList.toggle('hidden', !willShow);
        $('duel-preview-toggle').setAttribute('aria-pressed', willShow ? 'true' : 'false');
        $('duel-preview-toggle').textContent = willShow ? '🙈 Hide sentences' : '👁️ Show sentences';
        updateDuelPreview();
      });
    }

    if ($('btn-copy-instant-duel')) {
      $('btn-copy-instant-duel').addEventListener('click', () => {
        const uniqueIds = [...new Set(getSelectedDuelIds())];
        if (uniqueIds.length < 3) {
          if ($('duel-forge-status')) $('duel-forge-status').textContent = 'Choose at least 3 distinct clips.';
          return;
        }
        const tok = D.encodeDuel({ ids: uniqueIds, avgPct: 0, sec: 0, by: state.playerName });
        const url = buildDuelUrl(tok);
        copyTextWithFallback(url, () => {
          if ($('duel-forge-status')) $('duel-forge-status').textContent = `✓ ${uniqueIds.length}-clip instant duel link copied!`;
        });
      });
    }

    if ($('btn-start-duel')) {
      $('btn-start-duel').addEventListener('click', () => {
        const uniqueIds = [...new Set(getSelectedDuelIds())];
        if (uniqueIds.length < 3) {
          if ($('duel-forge-status')) $('duel-forge-status').textContent = 'Choose at least 3 distinct clips.';
          return;
        }
        const tok = D.encodeDuel({ ids: uniqueIds, avgPct: 0, sec: 0, by: state.playerName });
        const spec = D.decodeDuel(tok);
        if (spec) startDuelMode(spec);
      });
    }

    if ($('btn-copy-daily')) {
      $('btn-copy-daily').addEventListener('click', () => {
        const stats = getRecapStats('daily');
        const txt = `Connected Speech Lab · ${stats.seed} · ${stats.score}/${stats.maxScore} Clean (${stats.avgPct}%)\n${stats.grid}\n${SHARE_BASE_URL}?mode=daily`;
        copyTextWithFallback(txt, () => {
          $('btn-copy-daily').textContent = '✓ Copied!';
          setTimeout(() => { if ($('btn-copy-daily')) $('btn-copy-daily').textContent = '📋 Copy Daily Result'; }, 2200);
        });
      });
    }

    if ($('btn-copy-duel')) {
      $('btn-copy-duel').addEventListener('click', () => {
        const mode = activeRecapMode === 'daily' ? 'daily' : 'duel';
        const stats = getRecapStats(mode);
        const tok = D.encodeDuel({ ids: stats.ids, avgPct: stats.avgPct, sec: stats.sec || 0, by: state.playerName });
        if (!tok) return;
        const url = buildDuelUrl(tok);
        copyTextWithFallback(`Connected Speech Duel · ${stats.avgPct}% average match\n${url}`, () => {
          $('btn-copy-duel').textContent = '✓ Duel Link Copied!';
          setTimeout(() => { if ($('btn-copy-duel')) $('btn-copy-duel').textContent = '⚔️ Copy Counter-Duel Link'; }, 2200);
        });
      });
    }

    if ($('btn-open-diagnostic')) {
      $('btn-open-diagnostic').addEventListener('click', () => {
        const mode = activeRecapMode || 'campaign';
        const stats = getRecapStats(mode);
        closeRecapModal(false);
        if (location.protocol.startsWith('http') && typeof window.showDiagnosticGate === 'function') {
          window.showDiagnosticGate({
            gameName: mode === 'daily' ? 'Connected Speech Lab (Daily 5)' : 'Connected Speech Lab',
            score: stats.score,
            maxScore: stats.maxScore,
            category: 'prosody_cadence',
            weakArea: 'Connected Speech Weak Forms & Stress-Timing',
            examImpact: 'In IELTS and Cambridge Speaking, giving full vowel weight to auxiliaries and prepositions breaks your natural flow and flattens sentence stress.',
            onReplay: () => {
              if (mode === 'daily') startDailyMode();
              else jumpToAct(1);
            }
          });
        } else {
          window.location.href = 'index.html?offer=live_diagnostic_35#cal-booking-box';
        }
      });
    }

    if ($('btn-close-recap')) $('btn-close-recap').addEventListener('click', () => closeRecapModal(true));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = $('recap-modal');
        if (modal && modal.classList.contains('open')) {
          e.preventDefault();
          closeRecapModal(true);
        }
      }
    });

    /* ---------------- BELFAST DESK INLINE DRAWER ---------------- */
    function syncCsDeskContext() {
      const summaryEl = $('cs-desk-active-summary');
      const ctxHidden = $('cs-desk-context-hidden');
      const dossierEl = $('cs-desk-dossier');
      const d = currentDrill;
      const drillLabel = d ? `Act ${d.act} · ${d.title} (${d.phoneticRespelling})` : 'Connected Speech Lab';
      const scoreLabel = lastScoreResult
        ? `Match ${lastScoreResult.overallPct}% (Peaks ${lastScoreResult.peakPct}% / Weak ${lastScoreResult.valleyPct}%)`
        : `${state.completedIds.length}/${D.allDrills.length} Clips Mastered`;
      if (summaryEl) summaryEl.textContent = `${drillLabel} · ${scoreLabel}`;
      if (ctxHidden) ctxHidden.value = `${drillLabel} | IPA: ${d ? d.weakIpa : ''} | ${scoreLabel}`;
      if (dossierEl) {
        let dossierVal = '';
        try {
          if (window.CandidateDossier && typeof window.CandidateDossier.getSummary === 'function') {
            const ds = window.CandidateDossier.getSummary();
            if (ds && ds.playedCategories > 0) {
              dossierVal = `${ds.code} | ${ds.cefrBand} | Focus: ${ds.weakestSkill || 'Speaking Prosody'}`;
            }
          }
        } catch (_) {}
        dossierEl.value = dossierVal;
      }
    }

    const toggleCsDeskBtn = $('btn-toggle-cs-desk');
    const csDeskDrawer = $('cs-desk-drawer');
    if (toggleCsDeskBtn && csDeskDrawer) {
      toggleCsDeskBtn.addEventListener('click', () => {
        const willOpen = csDeskDrawer.classList.contains('hidden');
        csDeskDrawer.classList.toggle('hidden', !willOpen);
        toggleCsDeskBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        if (willOpen) {
          syncCsDeskContext();
          const msgEl = $('cs-desk-message');
          if (msgEl) msgEl.focus();
        }
      });
    }

    const csDeskForm = $('cs-desk-form');
    if (csDeskForm) {
      csDeskForm.addEventListener('submit', async (e) => {
        if (typeof window.fetch !== 'function' || typeof window.FormData !== 'function') return;
        e.preventDefault();
        if (csDeskForm.dataset.submitting === 'true') return;

        const gotcha = csDeskForm.querySelector('input[name="_gotcha"]');
        const statusEl = $('cs-desk-status');
        const submitBtn = $('cs-desk-submit');
        const origText = submitBtn ? submitBtn.textContent : 'Send to My Desk →';

        if (gotcha && gotcha.value.trim()) {
          if (statusEl) {
            statusEl.className = 'desk-form-status is-success';
            statusEl.textContent = 'Sent to my desk — thank you.';
          }
          return;
        }

        syncCsDeskContext();
        csDeskForm.dataset.submitting = 'true';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Sending...';
        }
        if (statusEl) {
          statusEl.className = 'desk-form-status';
          statusEl.textContent = '';
        }

        try {
          const res = await fetch(csDeskForm.action || 'https://formspree.io/f/mvkgrwvj', {
            method: 'POST',
            body: new FormData(csDeskForm),
            headers: { Accept: 'application/json' }
          });
          if (!res.ok) throw new Error('Request failed');
          if (statusEl) {
            statusEl.className = 'desk-form-status is-success';
            statusEl.textContent = 'Received at my desk in Northern Ireland. I will reply within 24 hours with stressed beats, weak-form reductions, and natural rhythm notes.';
          }
          if (submitBtn) submitBtn.textContent = 'Sent to My Desk ✓';
          trackEvent('desk_dropbox_submitted', { tool: 'connected_speech_lab' });
        } catch (_) {
          if (statusEl) {
            statusEl.className = 'desk-form-status is-error';
            statusEl.innerHTML = 'Something stopped the form from sending. Please email me directly at <a href="mailto:gareth@garethenglish.com?subject=Connected%20Speech%20Lab%20Question" style="color:inherit;text-decoration:underline;font-weight:700;">gareth@garethenglish.com</a>.';
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
        } finally {
          csDeskForm.dataset.submitting = 'false';
        }
      });
    }

    const routed = applyUrlRoute();
    if (!routed) {
      currentDrill = D.allDrills[state.currentIdx] || D.allDrills[0];
      await renderCurrentDrill();
    }

    if (/[?&]selftest=1\b/.test(location.search)) {
      await runSelfTest();
    }
  });
})();
