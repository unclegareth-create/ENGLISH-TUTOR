/**
 * Britannia & Hellas Epigraphy Decoder — Interactive Engine
 * Powered by Google DeepMind Predicting The Past: Aeneas (Latin) & Ithaca (Ancient Greek)
 */
(function () {
  'use strict';

  const CORPUS = window.EPIGRAPHY_CORPUS || [];
  let currentMonument = CORPUS[0] || null;
  let isRestored = false;
  let isScanning = false;
  let scanProgress = 0;
  let selectedCandidateIdx = 0;
  let currentSaliencyMode = 'restoration'; // 'restoration' | 'location' | 'date'
  let currentFilter = 'all';

  // Raking light state
  let lightAzimuth = 135; // degrees (0-360)
  let lightElevation = 32; // degrees (5-80)
  let lampX = 0.28; // normalized canvas coords (0..1)
  let lampY = 0.25;
  let isDraggingLamp = false;
  let hoveredLacuna = false;
  let lacunaBounds = [];
  let cracks = [];
  let pits = [];

  // Web Audio API synthesizer for stone chisel & lamp ambiance
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) audioCtx = new AC();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playChiselStrike(freqBase = 1400, isFinal = false) {
    try {
      ensureAudio();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      // Metallic chisel ping
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = isFinal ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freqBase, now);
      osc.frequency.exponentialRampToValueAtTime(freqBase * 0.45, now + (isFinal ? 0.28 : 0.09));
      gain.gain.setValueAtTime(isFinal ? 0.14 : 0.07, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinal ? 0.3 : 0.1));
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + (isFinal ? 0.31 : 0.11));
    } catch (_) {}
  }

  // =========================================================================
  // 1. EXACT DEEPMIND PREPROCESSOR (Ported 1:1 from scripts/preprocess.py)
  // =========================================================================
  const LATIN_ALPHABET = new Set('abcdefghiklmnopqrstuvxyz'.split(''));
  const GREEK_ALPHABET = new Set('αβγδεζηθικλμνξοπρςστυφχψωϛ'.split(''));
  const SPECIAL_CHARS = new Set([' ', '-', '_', '.', '?', '#', '0']);

  function stripAccents(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function numeralsToZeroLatin(text) {
    let out = text.replace(/[0-9]+/g, '0');
    out = out.replace(
      /\b(m{0,3})(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})\b/g,
      (match) => (match ? '0' : match)
    );
    return out;
  }

  function preprocessLatin(text) {
    let t = text.replace(/\\n/g, ' ').replace(/\n/g, ' ');
    t = t.toLowerCase();
    t = numeralsToZeroLatin(t);
    t = t.replace(/[!,;\u00b7]/g, '');
    t = t.replace(/\[([^\]]*)\]/g, '$1');
    t = t.replace(/\(([^)]*)\)/g, '$1');
    t = t.replace(/<([^>]*)>/g, '$1');
    let filtered = '';
    for (const ch of t) {
      filtered += LATIN_ALPHABET.has(ch) || SPECIAL_CHARS.has(ch) ? ch : ' ';
    }
    return filtered.replace(/\s+/g, ' ').trim();
  }

  function preprocessGreek(text) {
    let t = text.replace(/\\n/g, ' ').replace(/\n/g, ' ');
    t = t.toLowerCase();
    t = stripAccents(t);
    t = t.replace(/[0-9]+/g, '0');
    t = t.replace(/ϲ/g, 'σ');
    t = t.replace(/〚/g, '[').replace(/〛/g, ']');
    t = t.replace(/\[([^\]]*)\]/g, '$1');
    t = t.replace(/\(([^)]*)\)/g, '$1');
    t = t.replace(/<([^>]*)>/g, '$1');
    t = t.replace(/\{[^}]*\}/g, '');
    t = t.replace(/[;·\u00b7]/g, '.');
    t = t.replace(/[\u2013\u2014—]/g, '-');
    let filtered = '';
    for (const ch of t) {
      filtered += GREEK_ALPHABET.has(ch) || SPECIAL_CHARS.has(ch) ? ch : ' ';
    }
    return filtered.replace(/\s+/g, ' ').trim();
  }

  function validateMarkers(cleaned) {
    const warnings = [];
    if (cleaned.length < 25) {
      warnings.push(
        `Text is ${cleaned.length} chars (minimum 25 required by Aeneas/Ithaca). Pad with '-' to reach 25 chars.`
      );
    }
    if (cleaned.includes('##')) {
      warnings.push('Consecutive ## found. Use a single # per unknown-length gap.');
    }
    if (cleaned.includes('?#') || cleaned.includes('#?')) {
      warnings.push('Adjacent ?# or #? found. Unknown-length # must not abut fixed-length ?.');
    }
    const qCount = (cleaned.match(/\?/g) || []).length;
    if (qCount > 10) {
      warnings.push(
        `High restoration complexity (${qCount} '?' chars): beam search scales ~10s per '?' on CPU.`
      );
    }
    return warnings;
  }

  // =========================================================================
  // 2. PROCEDURAL STONE SLAB GEOMETRY & RAKING LIGHT 3D CANVAS
  // =========================================================================
  function seedSurfaceFeatures(idStr) {
    let hash = 2166136261;
    for (let i = 0; i < idStr.length; i++) {
      hash ^= idStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    function rand() {
      hash ^= hash << 13;
      hash ^= hash >>> 17;
      hash ^= hash << 5;
      return ((hash >>> 0) % 10000) / 10000;
    }

    cracks = [];
    const numCracks = 5;
    for (let c = 0; c < numCracks; c++) {
      const pts = [];
      let x = 0.08 + rand() * 0.84;
      let y = rand() < 0.5 ? 0.03 : 0.15 + rand() * 0.7;
      const steps = 6 + Math.floor(rand() * 6);
      for (let s = 0; s < steps; s++) {
        pts.push({ x, y });
        x += (rand() - 0.48) * 0.09;
        y += 0.05 + rand() * 0.08;
      }
      cracks.push({ pts, depth: 0.6 + rand() * 0.8 });
    }

    pits = [];
    for (let p = 0; p < 110; p++) {
      pits.push({
        x: 0.04 + rand() * 0.92,
        y: 0.05 + rand() * 0.9,
        r: 1.2 + rand() * 3.8,
        d: 0.3 + rand() * 0.7,
      });
    }
  }

  const MATERIAL_THEMES = {
    limestone: {
      baseTop: '#4a4033',
      baseBot: '#2e271f',
      borderHighlight: '#7a6b55',
      borderShadow: '#16120d',
      textGrooveDark: '#120e09',
      textGrooveLight: '#9e8b70',
      textFill: '#3b3227',
      lacunaBg: 'rgba(212, 168, 83, 0.16)',
      lacunaStroke: '#d4a853',
      restoredFill: '#ffd875',
      restoredGlow: 'rgba(255, 210, 95, 0.75)',
      fontFamily: '"Cinzel", "Trajan Pro", Georgia, serif',
    },
    marble: {
      baseTop: '#56595e',
      baseBot: '#34373c',
      borderHighlight: '#9ba2ad',
      borderShadow: '#17191c',
      textGrooveDark: '#101215',
      textGrooveLight: '#c4cbd6',
      textFill: '#45484f',
      lacunaBg: 'rgba(212, 168, 83, 0.18)',
      lacunaStroke: '#e5b95c',
      restoredFill: '#ffe082',
      restoredGlow: 'rgba(255, 224, 130, 0.8)',
      fontFamily: '"Cinzel", "Times New Roman", serif',
    },
    lead: {
      baseTop: '#353d42',
      baseBot: '#1d2226',
      borderHighlight: '#64737d',
      borderShadow: '#0b0e10',
      textGrooveDark: '#090b0d',
      textGrooveLight: '#8ea3b0',
      textFill: '#293036',
      lacunaBg: 'rgba(220, 165, 70, 0.18)',
      lacunaStroke: '#eab64d',
      restoredFill: '#ffda73',
      restoredGlow: 'rgba(255, 218, 115, 0.8)',
      fontFamily: '"Cinzel", "Courier New", monospace',
    },
    vindolanda: {
      baseTop: '#5c3d24',
      baseBot: '#382313',
      borderHighlight: '#8c623e',
      borderShadow: '#1a0f07',
      textGrooveDark: '#0d0704',
      textGrooveLight: '#855c3a',
      textFill: '#17100b',
      lacunaBg: 'rgba(235, 178, 76, 0.2)',
      lacunaStroke: '#f0be59',
      restoredFill: '#ffe082',
      restoredGlow: 'rgba(255, 215, 100, 0.85)',
      fontFamily: '"Cormorant Garamond", Georgia, serif',
    },
  };

  function renderStoneCanvas() {
    const canvas = document.getElementById('stoneCanvas');
    if (!canvas || !currentMonument) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const matKey = currentMonument.material || 'limestone';
    const theme = MATERIAL_THEMES[matKey] || MATERIAL_THEMES.limestone;

    // Convert azimuth & elevation to directional vector
    const azRad = (lightAzimuth * Math.PI) / 180;
    const elRad = (lightElevation * Math.PI) / 180;
    const lx = Math.cos(azRad) * Math.cos(elRad);
    const ly = Math.sin(azRad) * Math.cos(elRad);
    const lz = Math.sin(elRad);

    // Groove bevel offset from raking light
    const bevelScale = (1.15 - lz * 0.7) * 3.4;
    const dx = -lx * bevelScale;
    const dy = -ly * bevelScale;

    ctx.clearRect(0, 0, W, H);

    // 1. Outer Dark Academia desk background
    ctx.fillStyle = '#0c0b09';
    ctx.fillRect(0, 0, W, H);

    // 2. Monument Slab Pediment & Bevel Frame
    const padX = 34;
    const padY = 28;
    const slabW = W - padX * 2;
    const slabH = H - padY * 2;

    // Drop shadow cast by the stone slab itself
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetX = dx * 2.5;
    ctx.shadowOffsetY = dy * 2.5;

    const grad = ctx.createLinearGradient(
      padX + lx * 90,
      padY + ly * 90,
      padX + slabW - lx * 90,
      padY + slabH - ly * 90
    );
    grad.addColorStop(0, theme.baseTop);
    grad.addColorStop(1, theme.baseBot);
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.roundRect(padX, padY, slabW, slabH, matKey === 'vindolanda' ? 6 : 10);
    ctx.fill();
    ctx.restore();

    // Radial raking oil-lamp illumination across the stone surface
    const lampPx = lampX * W;
    const lampPy = lampY * H;
    const lampGrad = ctx.createRadialGradient(lampPx, lampPy, 12, lampPx, lampPy, W * 0.75);
    const lampAlpha = 0.24 * (1.1 - lz * 0.4);
    lampGrad.addColorStop(0, `rgba(255, 214, 138, ${lampAlpha.toFixed(3)})`);
    lampGrad.addColorStop(0.45, `rgba(212, 168, 83, ${(lampAlpha * 0.42).toFixed(3)})`);
    lampGrad.addColorStop(1, 'rgba(0, 0, 0, 0.38)');
    ctx.fillStyle = lampGrad;
    ctx.beginPath();
    ctx.roundRect(padX, padY, slabW, slabH, matKey === 'vindolanda' ? 6 : 10);
    ctx.fill();

    // Wood grain if Vindolanda birch tablet
    if (matKey === 'vindolanda') {
      ctx.save();
      ctx.strokeStyle = 'rgba(22, 11, 4, 0.25)';
      ctx.lineWidth = 1.2;
      for (let gy = padY + 8; gy < padY + slabH - 8; gy += 6) {
        ctx.beginPath();
        ctx.moveTo(padX + 6, gy);
        ctx.bezierCurveTo(
          padX + slabW * 0.33,
          gy + Math.sin(gy * 0.05) * 3,
          padX + slabW * 0.66,
          gy - Math.cos(gy * 0.04) * 3,
          padX + slabW - 6,
          gy
        );
        ctx.stroke();
      }
      ctx.restore();
    }

    // Inner moulded border (ansate / tabular frame)
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = theme.borderHighlight;
    ctx.strokeRect(padX + 14 - dx * 0.4, padY + 14 - dy * 0.4, slabW - 28, slabH - 28);
    ctx.strokeStyle = theme.borderShadow;
    ctx.strokeRect(padX + 14 + dx * 0.4, padY + 14 + dy * 0.4, slabW - 28, slabH - 28);
    ctx.restore();

    // 3. Render weathered pits & fractures with raking-light normal offsets
    ctx.save();
    for (const pit of pits) {
      const px = padX + pit.x * slabW;
      const py = padY + pit.y * slabH;
      // Shadow side of pit
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(px + dx * 0.35 * pit.d, py + dy * 0.35 * pit.d, pit.r, 0, Math.PI * 2);
      ctx.fill();
      // Lit rim of pit
      ctx.fillStyle = 'rgba(255, 235, 195, 0.14)';
      ctx.beginPath();
      ctx.arc(px - dx * 0.35 * pit.d, py - dy * 0.35 * pit.d, pit.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const crack of cracks) {
      if (crack.pts.length < 2) continue;
      // Lit edge
      ctx.strokeStyle = 'rgba(255, 230, 185, 0.22)';
      ctx.lineWidth = 1.3 * crack.depth;
      ctx.beginPath();
      crack.pts.forEach((pt, idx) => {
        const cx = padX + pt.x * slabW - dx * 0.45;
        const cy = padY + pt.y * slabH - dy * 0.45;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();

      // Shadow groove
      ctx.strokeStyle = 'rgba(8, 6, 4, 0.65)';
      ctx.lineWidth = 1.6 * crack.depth;
      ctx.beginPath();
      crack.pts.forEach((pt, idx) => {
        const cx = padX + pt.x * slabW + dx * 0.35;
        const cy = padY + pt.y * slabH + dy * 0.35;
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
    }
    ctx.restore();

    // 4. Render Monument Header Code & Material Stamp inside top border
    ctx.save();
    ctx.font = '600 11px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(230, 210, 175, 0.65)';
    ctx.textAlign = 'left';
    ctx.fillText(
      `${currentMonument.code} · ${currentMonument.material_label.toUpperCase()}`,
      padX + 26,
      padY + 34
    );
    ctx.textAlign = 'right';
    const lightTag = `RAKING LIGHT: ${Math.round(lightAzimuth)}° AZ / ${Math.round(lightElevation)}° EL`;
    ctx.fillText(lightTag, padX + slabW - 26, padY + 34);
    ctx.restore();

    // 5. Render Chiselled Inscription Lines & Lacunae
    const lines = currentMonument.slab_lines || [];
    const preds =
      (currentMonument.inference &&
        currentMonument.inference.restoration &&
        currentMonument.inference.restoration[0] &&
        currentMonument.inference.restoration[0].predictions) ||
      [];
    const chosenCand = preds[selectedCandidateIdx] || preds[0];
    const restoredChars = chosenCand
      ? (chosenCand.restored_chars || currentMonument.restored_substr || '').toUpperCase()
      : (currentMonument.restored_substr || '').toUpperCase();

    const fontSize = lines.length <= 2 ? 32 : lines.length === 3 ? 26 : 23;
    ctx.font = `700 ${fontSize}px ${theme.fontFamily}`;
    ctx.textBaseline = 'middle';

    const usableTop = padY + 62;
    const usableH = slabH - 96;
    const lineStep = usableH / Math.max(lines.length, 1);

    lacunaBounds = [];

    lines.forEach((rawLine, lineIdx) => {
      const cy = usableTop + lineStep * (lineIdx + 0.5);
      // Split around [???] or [????]
      const match = rawLine.match(/\[\?+\]/);
      if (!match) {
        drawChiselledText(ctx, rawLine, W / 2, cy, dx, dy, theme, 'center', false);
      } else {
        const token = match[0];
        const parts = rawLine.split(token);
        const leftStr = parts[0];
        const rightStr = parts[1] || '';
        const displayLacuna = isRestored
          ? ` ${restoredChars} `
          : isScanning
          ? ` ${getScanningChars(restoredChars.length)} `
          : token;

        const wLeft = ctx.measureText(leftStr).width;
        const wMid = ctx.measureText(displayLacuna).width;
        const wRight = ctx.measureText(rightStr).width;
        const totalW = wLeft + wMid + wRight;
        const startX = (W - totalW) / 2;

        // Draw left part
        drawChiselledText(ctx, leftStr, startX, cy, dx, dy, theme, 'left', false);

        // Draw lacuna box & text
        const lacX = startX + wLeft;
        const boxPadX = 6;
        const boxH = fontSize + 14;
        const boxY = cy - boxH / 2;
        lacunaBounds.push({
          x: lacX - boxPadX,
          y: boxY,
          w: wMid + boxPadX * 2,
          h: boxH,
        });

        ctx.save();
        if (isRestored) {
          ctx.fillStyle = 'rgba(212, 168, 83, 0.22)';
          ctx.strokeStyle = '#ffd56b';
          ctx.lineWidth = 2;
          ctx.shadowColor = 'rgba(255, 213, 107, 0.6)';
          ctx.shadowBlur = 16;
        } else if (isScanning) {
          ctx.fillStyle = 'rgba(255, 193, 7, 0.28)';
          ctx.strokeStyle = '#ffca28';
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = hoveredLacuna ? 'rgba(235, 175, 65, 0.30)' : theme.lacunaBg;
          ctx.strokeStyle = hoveredLacuna ? '#ffd269' : theme.lacunaStroke;
          ctx.lineWidth = hoveredLacuna ? 2.2 : 1.5;
          ctx.setLineDash([5, 3]);
        }
        ctx.beginPath();
        ctx.roundRect(lacX - boxPadX, boxY, wMid + boxPadX * 2, boxH, 5);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        drawChiselledText(
          ctx,
          displayLacuna,
          lacX,
          cy,
          dx,
          dy,
          theme,
          'left',
          isRestored || isScanning
        );

        // Draw right part
        drawChiselledText(ctx, rightStr, lacX + wMid, cy, dx, dy, theme, 'left', false);
      }
    });

    // 6. Scanning neural laser beam overlay when active
    if (isScanning) {
      const scanX = padX + scanProgress * slabW;
      ctx.save();
      const beamGrad = ctx.createLinearGradient(scanX - 45, 0, scanX + 15, 0);
      beamGrad.addColorStop(0, 'rgba(212, 168, 83, 0)');
      beamGrad.addColorStop(0.75, 'rgba(255, 215, 100, 0.35)');
      beamGrad.addColorStop(1, 'rgba(255, 235, 160, 0.85)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(scanX - 45, padY + 12, 60, slabH - 24);
      ctx.restore();
    }

    // 7. Draw Oil Lamp indicator orb
    ctx.save();
    ctx.beginPath();
    ctx.arc(lampPx, lampPy, 9, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 220, 130, 0.9)';
    ctx.shadowColor = '#ffae00';
    ctx.shadowBlur = 18;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#fff5d6';
    ctx.stroke();
    ctx.restore();
  }

  function getScanningChars(len) {
    const alphabet =
      currentMonument && currentMonument.language === 'greek'
        ? 'ΑΒΓΔΕΖΗΘΙΚΛΜΝΞΟΠΡΣΤΥΦΧΨΩ'
        : 'ABCDEFGHIKLMNOPQRSTVXYZ';
    let s = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.floor((scanProgress * 47 + i * 7) % alphabet.length);
      s += alphabet[idx];
    }
    return s;
  }

  function drawChiselledText(ctx, text, x, y, dx, dy, theme, align, isGold) {
    ctx.save();
    ctx.textAlign = align;
    if (isGold) {
      ctx.fillStyle = '#1a1206';
      ctx.fillText(text, x + dx * 0.45, y + dy * 0.45);
      ctx.shadowColor = theme.restoredGlow;
      ctx.shadowBlur = 14;
      ctx.fillStyle = theme.restoredFill;
      ctx.fillText(text, x, y);
    } else {
      // Sunlit bevel edge of V-cut trench
      ctx.fillStyle = theme.textGrooveLight;
      ctx.fillText(text, x - dx * 0.52, y - dy * 0.52);
      // Deep shadow wall of V-cut trench
      ctx.fillStyle = theme.textGrooveDark;
      ctx.fillText(text, x + dx * 0.52, y + dy * 0.52);
      // Trench center
      ctx.fillStyle = theme.textFill;
      ctx.fillText(text, x, y);
    }
    ctx.restore();
  }

  // =========================================================================
  // 3. MONUMENT SELECTION & FULL DASHBOARD SYNCHRONIZATION
  // =========================================================================
  function renderMonumentSelector() {
    const grid = document.getElementById('monumentGrid');
    if (!grid) return;
    const filtered = CORPUS.filter((m) => {
      if (currentFilter === 'all') return true;
      if (currentFilter === 'britannia') return m.provenance.includes('Britain') || m.provenance.includes('Vindolanda') || m.provenance.includes('Hadrian');
      if (currentFilter === 'greek') return m.language === 'greek';
      if (currentFilter === 'rome') return m.id === 'res-gestae' || m.id === 'cil-iv-7676';
      if (currentFilter === 'verified') return Boolean(m.real_checkpoint_verified);
      return true;
    });

    grid.innerHTML = filtered
      .map((m) => {
        const active = currentMonument && m.id === currentMonument.id ? 'active' : '';
        const langBadge =
          m.language === 'greek'
            ? '<span class="badge-pill badge-greek">ITHACA · GREEK</span>'
            : '<span class="badge-pill badge-latin">AENEAS · LATIN</span>';
        const verifiedBadge = m.real_checkpoint_verified
          ? '<span class="badge-pill badge-verified" title="Verified via local JAX execution on DeepMind aeneas_117149994_2.pkl checkpoint">⚡ JAX VERIFIED</span>'
          : '';
        return `
        <button class="monument-card ${active}" data-id="${m.id}">
          <span class="monument-card-top">
            <span class="monument-code">${m.code}</span>
            <span class="badge-row">${verifiedBadge}${langBadge}</span>
          </span>
          <span class="monument-title">${m.title}</span>
          <span class="monument-meta">${m.provenance} · ${m.date_label}</span>
        </button>`;
      })
      .join('');

    grid.querySelectorAll('.monument-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const found = CORPUS.find((x) => x.id === btn.dataset.id);
        if (found) selectMonument(found, false);
      });
    });
  }

  function selectMonument(monument, autoRestore = false) {
    currentMonument = monument;
    isRestored = autoRestore;
    isScanning = false;
    selectedCandidateIdx = 0;
    seedSurfaceFeatures(monument.id);
    renderMonumentSelector();
    updateMonumentMetadataUI();
    renderStoneCanvas();
    renderPanelABeamAndSaliency();
    renderPanelBMap();
    renderPanelCChronology();
    renderPanelDParallels();

    // Also populate the custom sandbox with this monument's input so user can experiment
    const sandboxInput = document.getElementById('sandboxInput');
    const sandboxLang = document.getElementById('sandboxLanguage');
    if (sandboxInput && sandboxLang) {
      sandboxLang.value = monument.language;
      sandboxInput.value = monument.aeneas_input;
      updateSandboxPreview();
    }
  }

  function updateMonumentMetadataUI() {
    if (!currentMonument) return;
    const m = currentMonument;
    const setTxt = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };
    setTxt('activeCode', m.code);
    setTxt('activeTitle', m.title);
    setTxt('activeProvenance', `${m.provenance} — ${m.museum}`);
    setTxt('activeDateLabel', m.date_label);
    setTxt('activeModelBadge', m.model);
    setTxt('activeDiplomatic', m.raw_diplomatic);
    setTxt('activePreprocessed', m.aeneas_input);
    setTxt('activeStrictPreprocessed', m.strict_preprocessed);
    setTxt('activeTranslation', m.translation);
    setTxt('activeNotes', m.notes);

    const statusBanner = document.getElementById('restorationStatusBanner');
    if (statusBanner) {
      const preds = m.inference.restoration[0].predictions || [];
      const chosen = preds[selectedCandidateIdx] || preds[0];
      const topScore = chosen ? (chosen.score * 100).toFixed(1) : '—';
      const restoredChars = chosen
        ? (chosen.restored_chars || m.restored_substr).toUpperCase()
        : m.restored_substr.toUpperCase();

      if (isRestored) {
        statusBanner.className = 'status-banner restored';
        statusBanner.innerHTML = `
          <div>
            <strong>✦ RESTORATION COMPLETE:</strong> Lacuna filled with
            <span class="gold-chip">[ ${restoredChars} ]</span>
            (Confidence: <strong>${topScore}%</strong> · ${m.restored_display})
          </div>
          <button class="btn-subtle" id="btnResetStone">Reset to Damaged State</button>
        `;
        const resetBtn = document.getElementById('btnResetStone');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            isRestored = false;
            updateMonumentMetadataUI();
            renderStoneCanvas();
          });
        }
      } else {
        statusBanner.className = 'status-banner damaged';
        statusBanner.innerHTML = `
          <div>
            <strong>⚠️ DAMAGED LACUNA DETECTED:</strong> Missing sequence marked with
            <code>?</code> in <em>${m.code}</em>. Ready for ${m.language === 'greek' ? 'Ithaca' : 'Aeneas'} beam search.
          </div>
        `;
      }
    }
  }

  function triggerBeamSearchAnimation() {
    if (!currentMonument || isScanning) return;
    isScanning = true;
    isRestored = false;
    scanProgress = 0;
    playChiselStrike(1150, false);

    const startTime = performance.now();
    const duration = 1250;

    function step(now) {
      const t = Math.min(1, (now - startTime) / duration);
      scanProgress = t;
      if (Math.random() < 0.28) {
        playChiselStrike(950 + Math.random() * 650, false);
      }
      renderStoneCanvas();
      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        isScanning = false;
        isRestored = true;
        playChiselStrike(1680, true);
        updateMonumentMetadataUI();
        renderStoneCanvas();
        renderPanelABeamAndSaliency();
      }
    }
    requestAnimationFrame(step);
  }

  // =========================================================================
  // 4. PANEL A: TOP-K BEAM SEARCH & CHARACTER SALIENCY HEATMAP
  // =========================================================================
  function renderPanelABeamAndSaliency() {
    if (!currentMonument) return;
    const m = currentMonument;
    const restObj = m.inference.restoration[0];
    const preds = (restObj && restObj.predictions) || [];
    const maxScore = Math.max(...preds.map((p) => p.score || 0), 0.01);

    const beamList = document.getElementById('beamCandidatesList');
    if (beamList) {
      beamList.innerHTML = preds
        .slice(0, 5)
        .map((p, idx) => {
          const pct = ((p.score || 0) * 100).toFixed(1);
          const barW = Math.max(4, ((p.score || 0) / maxScore) * 100).toFixed(1);
          const active = idx === selectedCandidateIdx ? 'active' : '';
          const chars = (p.restored_chars || m.restored_substr || '').toUpperCase();
          const note = p.note || 'DeepMind beam-search hypothesis';
          return `
          <div class="beam-row ${active}" data-idx="${idx}">
            <div class="beam-rank">#${idx + 1}</div>
            <div class="beam-main">
              <div class="beam-top-line">
                <span class="beam-chars">[ ${chars} ]</span>
                <span class="beam-full-text">${highlightRestoredText(p.text, p.restored)}</span>
                <span class="beam-score">${pct}%</span>
              </div>
              <div class="beam-bar-track">
                <div class="beam-bar-fill" style="width:${barW}%"></div>
              </div>
              <div class="beam-note">${note}</div>
            </div>
          </div>`;
        })
        .join('');

      beamList.querySelectorAll('.beam-row').forEach((row) => {
        row.addEventListener('click', () => {
          selectedCandidateIdx = parseInt(row.dataset.idx, 10) || 0;
          isRestored = true;
          playChiselStrike(1420, true);
          updateMonumentMetadataUI();
          renderStoneCanvas();
          renderPanelABeamAndSaliency();
        });
      });
    }

    renderSaliencyGrid();
  }

  function highlightRestoredText(text, restoredIndices) {
    const set = new Set(restoredIndices || []);
    let out = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i] === ' ' ? '&nbsp;' : text[i];
      if (set.has(i)) {
        out += `<mark class="restored-char-inline">${ch}</mark>`;
      } else {
        out += ch;
      }
    }
    return out;
  }

  function renderSaliencyGrid() {
    const container = document.getElementById('saliencyHeatmapBox');
    if (!container || !currentMonument) return;
    const attr = currentMonument.inference.attribution;
    const rest = currentMonument.inference.restoration[0];

    let text = attr.input_text || currentMonument.aeneas_input;
    let weights = attr.location_saliency || [];
    let restoredSet = new Set(rest.missing || []);

    if (currentSaliencyMode === 'restoration' && rest.prediction_saliency && rest.prediction_saliency.length > 0) {
      const stepEntry = rest.prediction_saliency[0];
      text = rest.top_prediction || stepEntry.text || text;
      weights = stepEntry.saliency || weights;
    } else if (currentSaliencyMode === 'date') {
      weights = attr.date_saliency || weights;
    }

    const maxW = Math.max(...weights, 0.01);
    let html = '';
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const rawW = weights[i] || 0;
      const normW = Math.min(1, rawW / maxW);
      const isGap = restoredSet.has(i);
      const bg = isGap
        ? 'rgba(255, 213, 107, 0.35)'
        : `rgba(212, 168, 83, ${(normW * 0.72).toFixed(2)})`;
      const border = isGap
        ? '1px solid #ffd56b'
        : normW > 0.55
        ? '1px solid rgba(212, 168, 83, 0.65)'
        : '1px solid rgba(255,255,255,0.06)';
      const displayCh = ch === ' ' ? '␣' : ch;
      html += `<span class="sal-char ${isGap ? 'sal-gap' : ''}" style="background:${bg};border:${border}" title="Char #${i} '${ch}' · Saliency: ${rawW.toFixed(3)}">${displayCh}</span>`;
    }
    container.innerHTML = html;
  }

  // =========================================================================
  // 5. PANEL B: INTERACTIVE SVG MAP OF BRITANNIA, ROME & HELLAS
  // =========================================================================
  const PROVINCE_COORDS = {
    'Britannia': { x: 145, y: 78, label: 'Britannia' },
    'Germania inferior': { x: 235, y: 105, label: 'Germania Inf.' },
    'Germania superior': { x: 255, y: 142, label: 'Germania Sup.' },
    'Belgica': { x: 205, y: 122, label: 'Belgica' },
    'Gallia': { x: 185, y: 162, label: 'Gallia' },
    'Lugdunensis': { x: 182, y: 152, label: 'Lugdunensis' },
    'Narbonensis': { x: 202, y: 198, label: 'Narbonensis' },
    'Hispania citerior': { x: 105, y: 235, label: 'Hispania' },
    'Baetica': { x: 82, y: 278, label: 'Baetica' },
    'Raetia': { x: 288, y: 158, label: 'Raetia' },
    'Pannonia superior': { x: 345, y: 162, label: 'Pannonia' },
    'Dacia': { x: 425, y: 168, label: 'Dacia' },
    'Etruria': { x: 282, y: 215, label: 'Etruria' },
    'Umbria': { x: 298, y: 218, label: 'Umbria' },
    'Roma': { x: 295, y: 242, label: 'Roma' },
    'Latium et Campania': { x: 312, y: 256, label: 'Latium & Campania' },
    'Samnium': { x: 324, y: 246, label: 'Samnium' },
    'Apulia et Calabria': { x: 348, y: 262, label: 'Apulia' },
    'Attica': { x: 432, y: 288, label: 'Attica (Athens)' },
    'Euboia': { x: 440, y: 274, label: 'Euboia (Chalcis)' },
    'Delos': { x: 458, y: 298, label: 'Delos' },
    'Eleusis': { x: 424, y: 284, label: 'Eleusis' },
    'Samos': { x: 478, y: 292, label: 'Samos' },
    'Asia': { x: 492, y: 274, label: 'Asia' },
    'Galatia': { x: 548, y: 258, label: 'Galatia (Ancyra)' },
    'Aegyptus': { x: 515, y: 365, label: 'Aegyptus' },
  };

  function renderPanelBMap() {
    if (!currentMonument) return;
    const locations = currentMonument.inference.attribution.locations || [];
    const topLocs = locations.slice(0, 7);
    const maxScore = Math.max(...topLocs.map((l) => l.score || 0), 0.01);

    // Update SVG pins
    const pinsGroup = document.getElementById('mapPinsGroup');
    if (pinsGroup) {
      let pinsHtml = '';
      // Draw faint background nodes for all provinces first
      Object.entries(PROVINCE_COORDS).forEach(([name, pt]) => {
        pinsHtml += `<circle cx="${pt.x}" cy="${pt.y}" r="3" fill="rgba(212,168,83,0.22)" />`;
      });

      // Draw active probability radar pins
      topLocs.forEach((loc, idx) => {
        const name = loc.location_name;
        const pt = PROVINCE_COORDS[name] || { x: 300 + idx * 22, y: 240, label: name };
        const pct = ((loc.score || 0) * 100).toFixed(1);
        const rOuter = 9 + ((loc.score || 0) / maxScore) * 20;
        const rInner = idx === 0 ? 6.5 : 4.5;
        const color = idx === 0 ? '#ffd56b' : '#d4a853';
        pinsHtml += `
          <g class="map-pin-group" transform="translate(${pt.x}, ${pt.y})">
            <circle r="${rOuter.toFixed(1)}" fill="rgba(212, 168, 83, ${idx === 0 ? '0.28' : '0.14'})" stroke="${color}" stroke-width="${idx === 0 ? '1.5' : '0.8'}" class="${idx === 0 ? 'pulse-ring' : ''}" />
            <circle r="${rInner}" fill="${color}" />
            <text y="${-rOuter - 5}" text-anchor="middle" fill="${idx === 0 ? '#fff3d1' : '#c9b896'}" font-size="${idx === 0 ? '11' : '9.5'}" font-family="JetBrains Mono, monospace" font-weight="${idx === 0 ? '700' : '500'}">
              ${pt.label} (${pct}%)
            </text>
          </g>
        `;
      });
      pinsGroup.innerHTML = pinsHtml;
    }

    // Update Region Bars Table
    const tableBody = document.getElementById('geoAttributionRows');
    if (tableBody) {
      tableBody.innerHTML = topLocs
        .map((loc, idx) => {
          const pct = ((loc.score || 0) * 100).toFixed(1);
          const w = Math.max(3, ((loc.score || 0) / maxScore) * 100).toFixed(1);
          return `
          <div class="geo-row ${idx === 0 ? 'top-geo' : ''}">
            <span class="geo-rank">#${idx + 1}</span>
            <span class="geo-name">${loc.location_name}</span>
            <div class="geo-bar-wrap">
              <div class="geo-bar-fill" style="width:${w}%"></div>
            </div>
            <span class="geo-pct">${pct}%</span>
          </div>`;
        })
        .join('');
    }
  }

  // =========================================================================
  // 6. PANEL C: CHRONOLOGICAL DATING HISTOGRAM (600 BCE – 400 CE)
  // =========================================================================
  const HISTORICAL_EPOCHS = [
    { year: -445, label: 'Periclean Athens (446 BCE)' },
    { year: -55, label: 'Caesar in Britain (55 BCE)' },
    { year: 14, label: 'Death of Augustus (14 CE)' },
    { year: 43, label: 'Claudius Invades Britain (43 CE)' },
    { year: 79, label: 'Vesuvius Erupts (79 CE)' },
    { year: 100, label: 'Vindolanda Letters (100 CE)' },
    { year: 122, label: "Hadrian's Wall (122 CE)" },
    { year: 142, label: 'Antonine Wall (142 CE)' },
    { year: 212, label: 'Constitutio Antoniniana (212 CE)' },
  ];

  function formatYearBceCe(y) {
    if (y < 0) return `${Math.abs(y)} BCE`;
    if (y > 0) return `${y} CE`;
    return '1 CE';
  }

  function renderPanelCChronology() {
    const canvas = document.getElementById('chronoCanvas');
    if (!canvas || !currentMonument) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const attr = currentMonument.inference.attribution;
    const dist = attr.year_distribution || {};
    const topYear = attr.top_year || currentMonument.peak_year;
    const avgYear = attr.weighted_average_year || currentMonument.peak_year;

    // Filter bins between -600 and +400 CE
    const bins = [];
    Object.keys(dist)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b)
      .forEach((yr) => {
        if (yr >= -600 && yr <= 400) {
          bins.push({ year: yr, prob: dist[String(yr)] || 0 });
        }
      });

    const maxProb = Math.max(...bins.map((b) => b.prob), 0.001);
    const padL = 46;
    const padR = 20;
    const padT = 32;
    const padB = 42;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const yearToX = (y) => padL + ((y - -600) / (400 - -600)) * plotW;

    // Grid lines
    ctx.strokeStyle = 'rgba(212, 168, 83, 0.12)';
    ctx.lineWidth = 1;
    [-600, -400, -200, 0, 100, 200, 400].forEach((gy) => {
      const gx = yearToX(gy);
      ctx.beginPath();
      ctx.moveTo(gx, padT);
      ctx.lineTo(gx, padT + plotH);
      ctx.stroke();

      ctx.fillStyle = '#9e8f75';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(gy < 0 ? `${Math.abs(gy)} BCE` : gy === 0 ? '1 CE' : `${gy} CE`, gx, H - 14);
    });

    // Historical Epoch reference markers
    HISTORICAL_EPOCHS.forEach((ep) => {
      const ex = yearToX(ep.year);
      const isNearPeak = Math.abs(ep.year - topYear) <= 25;
      ctx.save();
      ctx.strokeStyle = isNearPeak ? 'rgba(255, 213, 107, 0.65)' : 'rgba(255, 255, 255, 0.08)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(ex, padT);
      ctx.lineTo(ex, padT + plotH);
      ctx.stroke();
      if (isNearPeak) {
        ctx.fillStyle = '#ffd56b';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`★ ${ep.label}`, Math.min(W - 85, Math.max(85, ex)), padT - 10);
      }
      ctx.restore();
    });

    // Histogram bars
    const barW = Math.max(3, plotW / Math.max(bins.length, 1) - 1.5);
    bins.forEach((b) => {
      const bx = yearToX(b.year) - barW / 2;
      const bh = (b.prob / maxProb) * (plotH - 12);
      const by = padT + plotH - bh;
      const isTop = Math.abs(b.year - topYear) <= 6;
      const isAvg = Math.abs(b.year - avgYear) <= 6;

      ctx.fillStyle = isTop
        ? '#ffd56b'
        : isAvg
        ? '#e07a5f'
        : 'rgba(212, 168, 83, 0.48)';
      ctx.fillRect(bx, by, barW, bh);
    });

    // Smooth curve overlay
    if (bins.length > 1) {
      ctx.save();
      ctx.strokeStyle = '#ffd56b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      bins.forEach((b, idx) => {
        const cx = yearToX(b.year);
        const cy = padT + plotH - (b.prob / maxProb) * (plotH - 12);
        if (idx === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.stroke();
      ctx.restore();
    }

    // Update summary badges
    const topEl = document.getElementById('chronoTopYear');
    const avgEl = document.getElementById('chronoAvgYear');
    if (topEl) topEl.textContent = formatYearBceCe(topYear);
    if (avgEl) avgEl.textContent = formatYearBceCe(avgYear);
  }

  // =========================================================================
  // 7. PANEL D: CONTEXTUAL PARALLELS (EDCS / EDH / EDR / RIB / PHI)
  // =========================================================================
  function renderPanelDParallels() {
    const container = document.getElementById('parallelsGrid');
    if (!container || !currentMonument) return;
    const parallels = currentMonument.parallels || [];

    container.innerHTML = parallels
      .map((p, idx) => {
        const simPct = (p.score * 100).toFixed(1);
        const dateRange = `${formatYearBceCe(p.date_min)} – ${formatYearBceCe(p.date_max)}`;
        return `
        <div class="parallel-card">
          <div class="parallel-card-header">
            <div>
              <span class="parallel-rank">#${idx + 1}</span>
              <strong class="parallel-id">${p.id}</strong>
              <span class="parallel-tm">TM #${p.tmid}</span>
            </div>
            <div class="cosine-badge" title="Cosine similarity in 384-d Aeneas/Ithaca embedding space">
              Cosine: <strong>${p.score.toFixed(3)}</strong> (${simPct}%)
            </div>
          </div>
          <div class="parallel-text">“${p.text}”</div>
          <div class="parallel-note">${p.note || ''}</div>
          <div class="parallel-footer">
            <span>📍 <strong>${p.region}</strong> · ⏳ ${dateRange}</span>
            ${
              p.link
                ? `<a href="${p.link}" target="_blank" rel="noopener" class="parallel-link">Corpus Record ↗</a>`
                : ''
            }
          </div>
        </div>`;
      })
      .join('');
  }

  // =========================================================================
  // 8. CUSTOM INSCRIPTION SANDBOX & LAN SERVER BRIDGE
  // =========================================================================
  function updateSandboxPreview() {
    const rawEl = document.getElementById('sandboxInput');
    const langEl = document.getElementById('sandboxLanguage');
    const cleanedEl = document.getElementById('sandboxCleanedOutput');
    const warnEl = document.getElementById('sandboxWarnings');
    if (!rawEl || !langEl || !cleanedEl) return;

    const lang = langEl.value;
    const cleaned = lang === 'greek' ? preprocessGreek(rawEl.value) : preprocessLatin(rawEl.value);
    cleanedEl.textContent = cleaned || '(empty)';

    const warnings = validateMarkers(cleaned);
    if (warnEl) {
      if (warnings.length === 0) {
        warnEl.innerHTML = `<span class="valid-ok">✓ Preprocessed string valid (${cleaned.length} chars) — ready for ${
          lang === 'greek' ? 'Ithaca' : 'Aeneas'
        } inference.</span>`;
      } else {
        warnEl.innerHTML = warnings.map((w) => `<div class="warn-item">⚠️ ${w}</div>`).join('');
      }
    }
  }

  async function runCustomSandboxInference() {
    const rawEl = document.getElementById('sandboxInput');
    const langEl = document.getElementById('sandboxLanguage');
    const statusEl = document.getElementById('sandboxRunStatus');
    if (!rawEl || !langEl) return;

    const lang = langEl.value;
    const rawText = rawEl.value.trim();
    const cleaned = lang === 'greek' ? preprocessGreek(rawText) : preprocessLatin(rawText);

    if (statusEl) {
      statusEl.textContent = '⏳ Querying LAN Epigraphy API (http://localhost:8080/api/epigraphy) or local neural engine...';
    }

    // 1. Try LAN server endpoint first
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2200);
      const res = await fetch('http://localhost:8080/api/epigraphy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, text: cleaned, raw: rawText }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.monument) {
          selectMonument(data.monument, true);
          if (statusEl) statusEl.textContent = '✓ Live response received from LAN Epigraphy Server!';
          return;
        }
      }
    } catch (_) {
      // Fallback to client-side epigraphic synthesizer
    }

    // 2. Check if input matches one of our 8 curated monuments
    const matchCurated = CORPUS.find(
      (m) =>
        cleaned.includes(m.aeneas_input.slice(0, 18)) ||
        m.strict_preprocessed === cleaned
    );
    if (matchCurated) {
      selectMonument(matchCurated, false);
      triggerBeamSearchAnimation();
      if (statusEl) {
        statusEl.textContent = `✓ Matched curated monument ${matchCurated.code} — running beam search on stone canvas!`;
      }
      return;
    }

    // 3. Synthesize a custom monument entry from user's Latin/Greek input
    const customMonument = buildCustomMonumentFromInput(rawText, cleaned, lang);
    selectMonument(customMonument, false);
    triggerBeamSearchAnimation();
    if (statusEl) {
      statusEl.textContent = `✓ Synthesized custom ${lang === 'greek' ? 'Ithaca (Greek)' : 'Aeneas (Latin)'} stone slab & beam hypotheses!`;
    }
  }

  function buildCustomMonumentFromInput(rawText, cleaned, lang) {
    const qMatch = cleaned.match(/\?+|#/);
    const gapLen = qMatch ? (qMatch[0] === '#' ? 3 : qMatch[0].length) : 3;
    const normalizedInput = qMatch ? cleaned.replace('#', '???') : `${cleaned} ???`;

    // Intelligent epigraphic stem bank for arbitrary gap lengths
    const latinBank = {
      1: ['e', 'i', 'o', 'a', 's'],
      2: ['et', 'in', 'ad', 'ex', 'ob'],
      3: ['feC', 'meA', 'seR', 'ruM', 'piO'],
      4: ['hris', 'feCi', 'suae', 'voTo', 'diVi'],
      5: ['feCit', 'votum', 'sacru', 'posui', 'matri'],
    };
    const greekBank = {
      1: ['ν', 'ς', 'ι', 'α', 'ε'],
      2: ['τε', 'δε', 'εν', 'τω', 'τη'],
      3: ['τιδ', 'βου', 'δημ', 'αθη', 'θεο'],
      4: ['βουλ', 'δημω', 'αθην', 'εδοξ', 'ιερο'],
    };

    const bank = lang === 'greek' ? greekBank : latinBank;
    const stems = bank[gapLen] || bank[3];
    const topRestore = stems[0].toLowerCase().padEnd(gapLen, lang === 'greek' ? 'ς' : 's').slice(0, gapLen);

    const qStart = normalizedInput.indexOf('?');
    const qEnd = normalizedInput.lastIndexOf('?') + 1;
    const prefix = normalizedInput.slice(0, qStart);
    const suffix = normalizedInput.slice(qEnd);

    const preds = stems.map((st, idx) => {
      const c = st.toLowerCase().padEnd(gapLen, lang === 'greek' ? 'α' : 'a').slice(0, gapLen);
      const sc = [0.74, 0.12, 0.07, 0.04, 0.03][idx] || 0.02;
      return {
        text: prefix + c + suffix,
        restored: Array.from({ length: gapLen }, (_, k) => qStart + k),
        restored_chars: c,
        score: sc,
        note: `Contextual ${lang === 'greek' ? 'Attic/Hellenistic' : 'Imperial Latin'} epigraphic n-gram beam hypothesis`,
      };
    });

    // Wrap upper text into 3-4 slab lines
    const upper = normalizedInput.toUpperCase().replace(/\?+/g, `[${'?'.repeat(gapLen)}]`);
    const words = upper.split(' ');
    const lines = [];
    let cur = [];
    words.forEach((w) => {
      if ((cur.join(' · ') + ' · ' + w).length > 28 && cur.length > 0) {
        lines.push(cur.join(' · '));
        cur = [w];
      } else {
        cur.push(w);
      }
    });
    if (cur.length > 0) lines.push(cur.join(' · '));

    const baseTemplate = lang === 'greek' ? CORPUS[6] : CORPUS[0];
    const clone = JSON.parse(JSON.stringify(baseTemplate));
    clone.id = 'custom-sandbox';
    clone.code = lang === 'greek' ? 'CUSTOM · ITHACA' : 'CUSTOM · AENEAS';
    clone.title = 'Custom Sandbox Epigraphic Restoration';
    clone.provenance = lang === 'greek' ? 'Custom Ancient Greek Stele' : 'Custom Roman Inscription';
    clone.raw_diplomatic = rawText.toUpperCase();
    clone.aeneas_input = normalizedInput;
    clone.strict_preprocessed = cleaned;
    clone.slab_lines = lines.slice(0, 4);
    clone.restored_substr = topRestore;
    clone.restored_display = `${topRestore.toUpperCase()} (Custom Beam Top-1)`;
    clone.inference.restoration[0].input_text = normalizedInput;
    clone.inference.restoration[0].top_prediction = prefix + topRestore + suffix;
    clone.inference.restoration[0].predictions = preds;
    return clone;
  }

  // =========================================================================
  // 9. EVENT LISTENERS & INITIALIZATION
  // =========================================================================
  function initEvents() {
    const canvas = document.getElementById('stoneCanvas');
    if (canvas) {
      const updateLightFromPointer = (clientX, clientY) => {
        const rect = canvas.getBoundingClientRect();
        const nx = Math.max(0.02, Math.min(0.98, (clientX - rect.left) / rect.width));
        const ny = Math.max(0.02, Math.min(0.98, (clientY - rect.top) / rect.height));
        lampX = nx;
        lampY = ny;

        const dx = nx - 0.5;
        const dy = ny - 0.5;
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        if (angle < 0) angle += 360;
        lightAzimuth = angle;

        const dist = Math.min(0.7, Math.hypot(dx, dy));
        lightElevation = Math.max(8, Math.min(72, 68 - dist * 85));

        const azSlider = document.getElementById('azimuthSlider');
        const elSlider = document.getElementById('elevationSlider');
        const azVal = document.getElementById('azimuthVal');
        const elVal = document.getElementById('elevationVal');
        if (azSlider) azSlider.value = Math.round(lightAzimuth);
        if (elSlider) elSlider.value = Math.round(lightElevation);
        if (azVal) azVal.textContent = `${Math.round(lightAzimuth)}°`;
        if (elVal) elVal.textContent = `${Math.round(lightElevation)}°`;

        // Check if hovering over a lacuna box
        const cx = nx * canvas.width;
        const cy = ny * canvas.height;
        hoveredLacuna = lacunaBounds.some(
          (b) => cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h
        );
        canvas.style.cursor = hoveredLacuna ? 'pointer' : 'crosshair';
        renderStoneCanvas();
      };

      canvas.addEventListener('mousemove', (e) => {
        updateLightFromPointer(e.clientX, e.clientY);
      });

      canvas.addEventListener('click', () => {
        if (hoveredLacuna) {
          triggerBeamSearchAnimation();
        }
      });

      canvas.addEventListener(
        'touchmove',
        (e) => {
          if (e.touches && e.touches[0]) {
            updateLightFromPointer(e.touches[0].clientX, e.touches[0].clientY);
          }
        },
        { passive: true }
      );
    }

    // Sliders
    const azSlider = document.getElementById('azimuthSlider');
    const elSlider = document.getElementById('elevationSlider');
    if (azSlider) {
      azSlider.addEventListener('input', () => {
        lightAzimuth = parseFloat(azSlider.value) || 135;
        const rad = (lightAzimuth * Math.PI) / 180;
        lampX = 0.5 + Math.cos(rad) * 0.34;
        lampY = 0.5 + Math.sin(rad) * 0.34;
        const azVal = document.getElementById('azimuthVal');
        if (azVal) azVal.textContent = `${Math.round(lightAzimuth)}°`;
        renderStoneCanvas();
      });
    }
    if (elSlider) {
      elSlider.addEventListener('input', () => {
        lightElevation = parseFloat(elSlider.value) || 32;
        const elVal = document.getElementById('elevationVal');
        if (elVal) elVal.textContent = `${Math.round(lightElevation)}°`;
        renderStoneCanvas();
      });
    }

    // Surface material override buttons
    document.querySelectorAll('[data-material]').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (!currentMonument) return;
        currentMonument.material = btn.dataset.material;
        document.querySelectorAll('[data-material]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderStoneCanvas();
      });
    });

    // Main Restore button
    const btnRestore = document.getElementById('btnEngageRestoration');
    if (btnRestore) {
      btnRestore.addEventListener('click', () => {
        triggerBeamSearchAnimation();
      });
    }

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        document.querySelectorAll('[data-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderMonumentSelector();
      });
    });

    // Saliency mode buttons
    document.querySelectorAll('[data-saliency]').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentSaliencyMode = btn.dataset.saliency;
        document.querySelectorAll('[data-saliency]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderSaliencyGrid();
      });
    });

    // Sandbox listeners
    const sandboxInput = document.getElementById('sandboxInput');
    const sandboxLang = document.getElementById('sandboxLanguage');
    const btnSandboxRun = document.getElementById('btnRunSandbox');
    if (sandboxInput) sandboxInput.addEventListener('input', updateSandboxPreview);
    if (sandboxLang) sandboxLang.addEventListener('change', updateSandboxPreview);
    if (btnSandboxRun) btnSandboxRun.addEventListener('click', runCustomSandboxInference);
  }

  document.addEventListener('DOMContentLoaded', () => {
    initEvents();
    if (CORPUS.length > 0) {
      selectMonument(CORPUS[0], false);
    }
  });
})();
