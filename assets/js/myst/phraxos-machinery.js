/* ==========================================================================
 * PHRAXOS MACHINERY — Diegetic 3D Myst Mechanical Contraptions (Wave 2 Remaster)
 * Classic Browser Script (100% file:// & https:// compatible, zero ES imports)
 * Exposes window.PhraxosMachinery
 * ========================================================================== */
(function () {
  'use strict';

  var STORAGE_KEY = 'phraxos-machinery-v1';

  var LINK_DESTINATIONS = [
    {
      id: 0,
      act: 'Act I',
      greek: 'ΑΠΟΛΛΩΝ',
      shortName: 'West Terrace',
      title: 'Bourani Courtyard (West)',
      subtitle: 'Negative Inversion & Correlative Linkers',
      chronicle: 'Sunlight strikes the fluted Doric colonnade where the schoolmaster first stepped out from the Aleppo pines.',
      palette: { top: '#0c3b75', mid: '#2d82bd', sea: '#0b5275', accent: '#fde047', glow: '#f59e0b' }
    },
    {
      id: 1,
      act: 'Act II',
      greek: 'ΑΡΤΕΜΙΣ',
      shortName: 'East Colonnade',
      title: 'East Colonnade of the Twin Sisters',
      subtitle: 'Cleft Sentences & Participle Clauses',
      chronicle: 'Across the firelit marble terrace, a scarlet ribbon glimmers beside rising Pentelic steps.',
      palette: { top: '#1e1b4b', mid: '#6d285c', sea: '#134e6f', accent: '#38bdf8', glow: '#f43f5e' }
    },
    {
      id: 2,
      act: 'Act III',
      greek: 'ΔΕΥΚΑΛΙΩΝ',
      shortName: '1943 Cove',
      title: '1943 Cove Amphitheatre',
      subtitle: 'Impersonal Passive Reporting',
      chronicle: 'Down by the turquoise cove, the ruined chapel arch still faces the quiet harbour water.',
      palette: { top: '#09223c', mid: '#155e75', sea: '#083344', accent: '#67e8f9', glow: '#38bdf8' }
    },
    {
      id: 3,
      act: 'Act IV',
      greek: 'ΜΥΣΤΗΣ',
      shortName: 'Trial Court',
      title: 'Subterranean Trial Court',
      subtitle: 'Inverted Conditionals & Past Subjunctive',
      chronicle: 'Beneath the limestone ridge, torchlight refracts through a suspended crystalline water-clock.',
      palette: { top: '#140f2d', mid: '#3b1d5e', sea: '#1e1b4b', accent: '#fbbf24', glow: '#c084fc' }
    },
    {
      id: 4,
      act: 'Act V',
      greek: 'ΕΛΕΥΘΕΡΙΑ',
      shortName: 'Parnassus',
      title: 'Parnassus Astrolabe Sanctuary',
      subtitle: 'Contrastive Clefts & Counterfactuals',
      chronicle: 'At the far northern headland, three consecrated marble altars encircle the celestial sanctuary.',
      palette: { top: '#051024', mid: '#0f294a', sea: '#082038', accent: '#fde68a', glow: '#22d3ee' }
    }
  ];

  var HARPSICHORD_KEYS_DEF = [
    { idx: 0, note: 'D4', freq: 293.66, x: -0.34, numeral: 'I' },
    { idx: 1, note: 'E4', freq: 329.63, x: -0.17, numeral: 'II' },
    { idx: 2, note: 'F4', freq: 349.23, x:  0.00, numeral: 'III' },
    { idx: 3, note: 'A4', freq: 440.00, x:  0.17, numeral: 'V' },
    { idx: 4, note: 'D5', freq: 587.33, x:  0.34, numeral: 'VIII' }
  ];

  var PRELUDE_MOTIF = ['D4', 'F4', 'A4', 'D5'];

  var savedCtx = null;
  var initialized = false;
  var fallbackAudioCtx = null;
  var solvedSet = new Set();
  var sharedMaterials = null;
  var rootSceneObjects = [];

  var linkingBooks = [];
  var linkWarpState = {
    active: false,
    elapsed: 0,
    duration: 0.72,
    targetAltarId: 0,
    teleported: false,
    baseFov: 46,
    overlayEl: null
  };

  var armillary = {
    group: null,
    rings: [],
    collars: [],
    pinions: [],
    gems: [],
    steps: [4, 3, 5],
    currentAngles: [(4 * Math.PI) / 3, (3 * Math.PI) / 3, (5 * Math.PI) / 3],
    ringNames: ['Outer Meridian Ring', 'Middle Ecliptic Band', 'Inner Azimuth Dial'],
    solved: false,
    revealMix: 0,
    beamGroup: null,
    beamUniformsList: [],
    coveFlareSprite: null,
    coveTargetRing: null,
    lensApparatus: null,
    lensInnerDisc: null,
    pulsePhase: 0
  };

  var harpsichord = {
    group: null,
    instGroup: null,
    roseAnchor: null,
    cofferAnchor: null,
    keys: [],
    playedNotes: [],
    solved: false,
    lidMesh: null,
    lidOpenProgress: 0,
    medallionGroup: null,
    medallionDisc: null,
    medallionHalo: null,
    plaqueCanvas: null,
    plaqueTex: null
  };

  // Unified Soft Radial Starlight Particle Pool (Zero Square Pixels, Zero Idle Uploads!)
  var particleSystem = {
    points: null,
    maxCount: 220,
    activeCount: 0,
    positions: null,
    colors: null,
    posAttr: null,
    colAttr: null,
    slots: [],
    cursor: 0
  };

  // --------------------------------------------------------------------------
  // Persistence, Static Batching & Utility Helpers
  // --------------------------------------------------------------------------
  function registerMachineryRoot(obj, tag) {
    if (!obj) return obj;
    obj.name = 'PhraxosMachinery_' + tag;
    obj.userData = Object.assign(obj.userData || {}, {
      phraxosModule: 'PhraxosMachinery',
      module: 'PhraxosMachinery',
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    });
    rootSceneObjects.push(obj);
    return obj;
  }

  function loadSolvedState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (raw && Array.isArray(raw.solved)) {
        raw.solved.forEach(function (id) {
          if (id === 'armillary' || id === 'harpsichord' || id === 'linking_book') {
            solvedSet.add(id);
          }
        });
      }
    } catch (e) { /* storage unavailable */ }
  }

  function saveSolvedState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        solved: Array.from(solvedSet)
      }));
    } catch (e) { /* storage unavailable */ }
  }

  function roundRectPath(c, x, y, w, h, r) {
    var rad = Math.min(r, w * 0.5, h * 0.5);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.lineTo(x + w - rad, y);
    c.quadraticCurveTo(x + w, y, x + w, y + rad);
    c.lineTo(x + w, y + h - rad);
    c.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    c.lineTo(x + rad, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - rad);
    c.lineTo(x, y + rad);
    c.quadraticCurveTo(x, y, x + rad, y);
    c.closePath();
  }

  function applyEncoding(THREE, tex) {
    if (THREE && THREE.sRGBEncoding !== undefined) {
      tex.encoding = THREE.sRGBEncoding;
    }
    return tex;
  }

  function setShadows(obj, cast, receive) {
    obj.traverse(function (child) {
      if (
        child.isMesh &&
        child.material &&
        child.material.visible !== false &&
        !child.material.transparent
      ) {
        child.castShadow = cast;
        child.receiveShadow = receive;
      }
    });
  }

  function getRelativeMatrix(THREE, node, ancestor) {
    var chain = [];
    var cur = node;
    while (cur && cur !== ancestor) {
      if (typeof cur.updateMatrix === 'function') cur.updateMatrix();
      if (cur.matrix) chain.push(cur.matrix);
      cur = cur.parent;
    }
    var rel = new THREE.Matrix4();
    for (var i = chain.length - 1; i >= 0; i--) {
      rel.multiply(chain[i]);
    }
    return rel;
  }

  function mergeStaticByMaterial(THREE, targetRoot, opts) {
    if (
      !THREE ||
      !THREE.Matrix4 ||
      !THREE.BufferGeometry ||
      !THREE.BufferAttribute ||
      !targetRoot
    ) {
      return 0;
    }

    var options = opts || {};
    var interactiveSet = new Set(options.interactiveList || []);
    var skipSet = new Set(options.skipNodes || []);
    var castShadowSet = new Set(options.castShadowMats || []);

    var buckets = new Map();

    function collect(node) {
      if (!node || skipSet.has(node)) return;
      if (node !== targetRoot && node.visible === false) return;

      if (
        node.isMesh &&
        node !== targetRoot &&
        !interactiveSet.has(node) &&
        !(node.userData && node.userData.interactType) &&
        node.geometry &&
        node.material &&
        !Array.isArray(node.material) &&
        node.material.visible !== false &&
        !node.material.transparent &&
        typeof node.geometry.clone === 'function'
      ) {
        var list = buckets.get(node.material);
        if (!list) {
          list = [];
          buckets.set(node.material, list);
        }
        list.push(node);
      }

      if (node.children && node.children.length) {
        for (var i = 0; i < node.children.length; i++) {
          collect(node.children[i]);
        }
      }
    }

    collect(targetRoot);

    var mergedDrawsSaved = 0;
    buckets.forEach(function (meshes, mat) {
      var shouldCast = castShadowSet.has(mat);
      if (meshes.length < 2) {
        if (meshes.length === 1) {
          meshes[0].castShadow = shouldCast;
          meshes[0].receiveShadow = true;
        }
        return;
      }

      var bakedGeos = [];
      var totalVerts = 0;
      var valid = true;

      for (var i = 0; i < meshes.length; i++) {
        var m = meshes[i];
        var srcGeo = m.geometry;
        var g = (srcGeo.index && typeof srcGeo.toNonIndexed === 'function')
          ? srcGeo.toNonIndexed()
          : srcGeo.clone();

        if (!g || !g.attributes || !g.attributes.position || !g.attributes.position.array) {
          valid = false;
          break;
        }

        if (typeof g.applyMatrix4 === 'function') {
          g.applyMatrix4(getRelativeMatrix(THREE, m, targetRoot));
        }
        if (!g.attributes.normal && typeof g.computeVertexNormals === 'function') {
          g.computeVertexNormals();
        }
        if (!g.attributes.normal || !g.attributes.normal.array) {
          valid = false;
          break;
        }

        bakedGeos.push(g);
        totalVerts += g.attributes.position.count;
      }

      if (!valid || totalVerts === 0) {
        for (var d = 0; d < bakedGeos.length; d++) {
          if (typeof bakedGeos[d].dispose === 'function') bakedGeos[d].dispose();
        }
        return;
      }

      var posArr = new Float32Array(totalVerts * 3);
      var normArr = new Float32Array(totalVerts * 3);
      var uvArr = new Float32Array(totalVerts * 2);
      var vCursor = 0;

      for (var j = 0; j < bakedGeos.length; j++) {
        var bg = bakedGeos[j];
        var vCount = bg.attributes.position.count;
        var pSrc = bg.attributes.position.array;
        var nSrc = bg.attributes.normal.array;
        posArr.set(pSrc.subarray(0, vCount * 3), vCursor * 3);
        normArr.set(nSrc.subarray(0, vCount * 3), vCursor * 3);

        var uvAttr = bg.attributes.uv;
        if (uvAttr && uvAttr.array) {
          if (uvAttr.itemSize === 2) {
            uvArr.set(uvAttr.array.subarray(0, vCount * 2), vCursor * 2);
          } else {
            for (var u = 0; u < vCount; u++) {
              uvArr[(vCursor + u) * 2] = uvAttr.array[u * uvAttr.itemSize] || 0;
              uvArr[(vCursor + u) * 2 + 1] = uvAttr.array[u * uvAttr.itemSize + 1] || 0;
            }
          }
        }

        vCursor += vCount;
        if (typeof bg.dispose === 'function') bg.dispose();
      }

      var mergedGeo = new THREE.BufferGeometry();
      mergedGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
      mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvArr, 2));
      if (typeof mergedGeo.computeBoundingSphere === 'function') mergedGeo.computeBoundingSphere();
      if (typeof mergedGeo.computeBoundingBox === 'function') mergedGeo.computeBoundingBox();

      for (var k = 0; k < meshes.length; k++) {
        if (meshes[k].parent && typeof meshes[k].parent.remove === 'function') {
          meshes[k].parent.remove(meshes[k]);
        }
      }

      var mergedMesh = new THREE.Mesh(mergedGeo, mat);
      mergedMesh.castShadow = shouldCast;
      mergedMesh.receiveShadow = true;
      targetRoot.add(mergedMesh);
      mergedDrawsSaved += (meshes.length - 1);
    });

    return mergedDrawsSaved;
  }

  function getWorldCoords(THREE, obj, fallbackX, fallbackY, fallbackZ) {
    if (obj && typeof obj.getWorldPosition === 'function') {
      if (savedCtx && savedCtx.scene && typeof savedCtx.scene.updateMatrixWorld === 'function') {
        savedCtx.scene.updateMatrixWorld();
      }
      var target = new THREE.Vector3();
      obj.getWorldPosition(target);
      if (isFinite(target.x) && (target.x !== 0 || target.y !== 0 || target.z !== 0)) {
        return target;
      }
    }
    return new THREE.Vector3(fallbackX, fallbackY, fallbackZ);
  }

  function notifyBanner(ctx, text, kind) {
    if (ctx && typeof ctx.showBanner === 'function') {
      ctx.showBanner(text, kind || 'clue');
      return;
    }
    var strip = typeof document !== 'undefined' ? document.getElementById('effect-strip') : null;
    var textEl = typeof document !== 'undefined' ? document.getElementById('effect-text') : null;
    if (strip && textEl) {
      strip.className = 'effect-strip ' + (kind === 'solved' ? 'solved' : 'clue') + ' interactive';
      textEl.textContent = text;
    }
  }

  function notifyToast(ctx, html) {
    if (ctx && typeof ctx.showUnlockToast === 'function') {
      ctx.showUnlockToast(html);
      return;
    }
    var toast = typeof document !== 'undefined' ? document.getElementById('unlock-toast') : null;
    if (toast) {
      toast.innerHTML = html;
      toast.classList.add('show');
    }
  }

  function markMachineSolved(machineId, ctx) {
    var wasNew = !solvedSet.has(machineId);
    solvedSet.add(machineId);
    saveSolvedState();

    var activeCtx = ctx || savedCtx;
    if (activeCtx && typeof activeCtx.onMachineSolved === 'function') {
      activeCtx.onMachineSolved(machineId, activeCtx);
    }
    if (typeof api.onMachineSolved === 'function') {
      api.onMachineSolved(machineId, activeCtx);
    }
    if (
      (!activeCtx || typeof activeCtx.onMachineSolved !== 'function') &&
      typeof window !== 'undefined' &&
      window.PhraxosNarrative &&
      typeof window.PhraxosNarrative.onProgressUpdate === 'function'
    ) {
      window.PhraxosNarrative.onProgressUpdate(activeCtx);
    }
    return wasNew;
  }

  // --------------------------------------------------------------------------
  // Procedural Web Audio Synthesis (100% Self-Contained, Respects Mute)
  // --------------------------------------------------------------------------
  function resolveAudio(ctx) {
    var activeCtx = ctx || savedCtx;
    var enabled = true;
    var ac = null;

    if (activeCtx && typeof activeCtx.getAudioState === 'function') {
      var st = activeCtx.getAudioState();
      if (typeof st === 'boolean') {
        enabled = st;
      } else if (st && typeof st === 'object') {
        if (typeof st.enabled === 'boolean') enabled = st.enabled;
        else if (typeof st.audioEnabled === 'boolean') enabled = st.audioEnabled;
        if (st.audioCtx && typeof st.audioCtx.createOscillator === 'function') ac = st.audioCtx;
        else if (st.ctx && typeof st.ctx.createOscillator === 'function') ac = st.ctx;
      }
    }
    if (!enabled) return null;

    if (activeCtx && typeof activeCtx.ensureAudio === 'function') {
      var ensured = activeCtx.ensureAudio();
      if (ensured && typeof ensured.createOscillator === 'function') {
        ac = ensured;
      } else if (ensured && typeof ensured === 'object' && ensured.audioCtx && typeof ensured.audioCtx.createOscillator === 'function') {
        ac = ensured.audioCtx;
      }
    }

    if (!ac && activeCtx && typeof activeCtx.getAudioState === 'function') {
      var stAfter = activeCtx.getAudioState();
      if (stAfter && typeof stAfter === 'object') {
        if (stAfter.audioCtx && typeof stAfter.audioCtx.createOscillator === 'function') ac = stAfter.audioCtx;
        else if (stAfter.ctx && typeof stAfter.ctx.createOscillator === 'function') ac = stAfter.ctx;
      }
    }

    if (!ac && typeof window !== 'undefined') {
      try {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          if (!fallbackAudioCtx) fallbackAudioCtx = new AC();
          ac = fallbackAudioCtx;
        }
      } catch (e) { /* ignore */ }
    }

    if (ac && ac.state === 'suspended' && typeof ac.resume === 'function') {
      ac.resume().catch(function () {});
    }
    return ac;
  }

  function playBookPageTurn(ctx, targetId) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var now = ac.currentTime;

    var len = Math.floor(ac.sampleRate * 0.11);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var ch = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var env = Math.sin((i / len) * Math.PI);
      ch[i] = (Math.random() * 2 - 1) * env * 0.35;
    }
    var src = ac.createBufferSource();
    src.buffer = buf;
    var bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1850, now);
    bp.Q.setValueAtTime(2.4, now);
    var g = ac.createGain();
    g.gain.setValueAtTime(0.08, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    src.connect(bp);
    bp.connect(g);
    g.connect(ac.destination);
    src.start(now);

    var pitches = [293.66, 329.63, 349.23, 392.00, 440.00];
    var osc = ac.createOscillator();
    var og = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitches[targetId % pitches.length] * 2, now + 0.02);
    og.gain.setValueAtTime(0.0001, now + 0.02);
    og.gain.linearRampToValueAtTime(0.055, now + 0.035);
    og.gain.exponentialRampToValueAtTime(0.0005, now + 0.42);
    osc.connect(og);
    og.connect(ac.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.45);
  }

  function playMystLinkingChime(ctx) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var now = ac.currentTime;

    var dur = 0.78;
    var len = Math.floor(ac.sampleRate * dur);
    var buf = ac.createBuffer(1, len, ac.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var p = i / len;
      var swell = Math.sin(p * Math.PI);
      data[i] = (Math.random() * 2 - 1) * swell;
    }
    var noise = ac.createBufferSource();
    noise.buffer = buf;

    var filter = ac.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.2, now);
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(2400, now + 0.34);
    filter.frequency.exponentialRampToValueAtTime(420, now + dur);

    var ng = ac.createGain();
    ng.gain.setValueAtTime(0.001, now);
    ng.gain.linearRampToValueAtTime(0.14, now + 0.24);
    ng.gain.exponentialRampToValueAtTime(0.0008, now + dur);

    noise.connect(filter);
    filter.connect(ng);
    ng.connect(ac.destination);
    noise.start(now);

    var partials = [293.66, 440.00, 587.33, 659.25, 880.00, 1174.66];
    partials.forEach(function (freq, idx) {
      var t0 = now + idx * 0.042;
      var osc = ac.createOscillator();
      var g = ac.createGain();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, t0);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.006, t0 + 0.9);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.055 / (1 + idx * 0.16), t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0004, t0 + 1.15);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(t0);
      osc.stop(t0 + 1.2);
    });
  }

  function playGearRatchet(ctx, ringIdx, alignedNow) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var now = ac.currentTime;

    [0.0, 0.036, 0.076].forEach(function (offset, tooth) {
      var t = now + offset;
      var thud = ac.createOscillator();
      var tg = ac.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(190 + ringIdx * 28 + tooth * 16, t);
      thud.frequency.exponentialRampToValueAtTime(84, t + 0.032);
      tg.gain.setValueAtTime(0.09, t);
      tg.gain.exponentialRampToValueAtTime(0.001, t + 0.036);
      thud.connect(tg);
      tg.connect(ac.destination);
      thud.start(t);
      thud.stop(t + 0.04);

      var ping = ac.createOscillator();
      var pg = ac.createGain();
      ping.type = 'sine';
      ping.frequency.setValueAtTime(1380 + ringIdx * 220 + tooth * 90, t);
      pg.gain.setValueAtTime(0.028, t);
      pg.gain.exponentialRampToValueAtTime(0.0006, t + 0.045);
      ping.connect(pg);
      pg.connect(ac.destination);
      ping.start(t);
      ping.stop(t + 0.05);
    });

    if (alignedNow) {
      var lockTime = now + 0.10;
      var bell = ac.createOscillator();
      var bg = ac.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(880 + ringIdx * 110, lockTime);
      bg.gain.setValueAtTime(0.0001, lockTime);
      bg.gain.linearRampToValueAtTime(0.065, lockTime + 0.015);
      bg.gain.exponentialRampToValueAtTime(0.0005, lockTime + 0.55);
      bell.connect(bg);
      bg.connect(ac.destination);
      bell.start(lockTime);
      bell.stop(lockTime + 0.58);
    }
  }

  function playEquinoxHarmonicChord(ctx) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var now = ac.currentTime + 0.08;
    var chord = [146.83, 220.00, 293.66, 369.99, 440.00, 587.33, 880.00];

    chord.forEach(function (freq, idx) {
      var t = now + idx * 0.055;
      var osc1 = ac.createOscillator();
      var osc2 = ac.createOscillator();
      var lp = ac.createBiquadFilter();
      var g = ac.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0, t);

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(3200, t);
      lp.frequency.exponentialRampToValueAtTime(720, t + 2.2);

      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.065 / (1 + idx * 0.12), t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0004, t + 2.35);

      var g2 = ac.createGain();
      g2.gain.setValueAtTime(0.24, t);

      osc1.connect(lp);
      osc2.connect(g2);
      g2.connect(lp);
      lp.connect(g);
      g.connect(ac.destination);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 2.4);
      osc2.stop(t + 2.4);
    });
  }

  function pluckChamberHarpsichord(ctx, freq, startOffset) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var t = ac.currentTime + (startOffset || 0);
    var dur = 1.48;

    var clickLen = Math.floor(ac.sampleRate * 0.012);
    var clickBuf = ac.createBuffer(1, clickLen, ac.sampleRate);
    var cData = clickBuf.getChannelData(0);
    for (var i = 0; i < clickLen; i++) {
      cData[i] = (Math.random() * 2 - 1) * (1 - i / clickLen) * 0.45;
    }
    var clickSrc = ac.createBufferSource();
    clickSrc.buffer = clickBuf;
    var hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.setValueAtTime(2100, t);
    var cg = ac.createGain();
    cg.gain.setValueAtTime(0.045, t);
    clickSrc.connect(hp);
    hp.connect(cg);
    cg.connect(ac.destination);
    clickSrc.start(t);

    var osc8a = ac.createOscillator();
    osc8a.type = 'sawtooth';
    osc8a.frequency.setValueAtTime(freq, t);

    var osc8b = ac.createOscillator();
    osc8b.type = 'sawtooth';
    osc8b.frequency.setValueAtTime(freq * 1.0014, t);
    var g8b = ac.createGain();
    g8b.gain.setValueAtTime(0.42, t);

    var osc4 = ac.createOscillator();
    osc4.type = 'triangle';
    osc4.frequency.setValueAtTime(freq * 2.0, t);
    var g4 = ac.createGain();
    g4.gain.setValueAtTime(0.28, t);
    g4.gain.exponentialRampToValueAtTime(0.02, t + dur * 0.6);

    var bodyFilter = ac.createBiquadFilter();
    bodyFilter.type = 'lowpass';
    bodyFilter.frequency.setValueAtTime(Math.min(5800, freq * 11.5), t);
    bodyFilter.frequency.exponentialRampToValueAtTime(Math.max(480, freq * 2.1), t + dur * 0.88);

    var master = ac.createGain();
    master.gain.setValueAtTime(0.0001, t);
    master.gain.linearRampToValueAtTime(0.082, t + 0.008);
    master.gain.exponentialRampToValueAtTime(0.032, t + 0.24);
    master.gain.exponentialRampToValueAtTime(0.0004, t + dur);

    osc8a.connect(bodyFilter);
    osc8b.connect(g8b);
    g8b.connect(bodyFilter);
    osc4.connect(g4);
    g4.connect(bodyFilter);
    bodyFilter.connect(master);
    master.connect(ac.destination);

    osc8a.start(t);
    osc8b.start(t);
    osc4.start(t);
    var stopAt = t + dur + 0.04;
    osc8a.stop(stopAt);
    osc8b.stop(stopAt);
    osc4.stop(stopAt);
  }

  function playCofferUnlockFlourish(ctx) {
    var ac = resolveAudio(ctx);
    if (!ac) return;
    var now = ac.currentTime + 0.22;

    var slideOsc = ac.createOscillator();
    var sg = ac.createGain();
    slideOsc.type = 'sine';
    slideOsc.frequency.setValueAtTime(220, now);
    slideOsc.frequency.linearRampToValueAtTime(460, now + 0.28);
    sg.gain.setValueAtTime(0.035, now);
    sg.gain.exponentialRampToValueAtTime(0.0006, now + 0.30);
    slideOsc.connect(sg);
    sg.connect(ac.destination);
    slideOsc.start(now);
    slideOsc.stop(now + 0.32);

    [293.66, 369.99, 440.00, 587.33, 739.99, 880.00].forEach(function (f, i) {
      pluckChamberHarpsichord(ctx, f, 0.28 + i * 0.095);
    });
  }

  // --------------------------------------------------------------------------
  // Procedural Materials, Sculpted Geometries & Soft Radial Particle Pool
  // --------------------------------------------------------------------------
  function makeRadialParticleTexture(THREE) {
    var can = document.createElement('canvas');
    can.width = 128;
    can.height = 128;
    var c = can.getContext('2d');
    c.clearRect(0, 0, 128, 128);

    var grad = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0.00, 'rgba(255, 253, 242, 1.0)');
    grad.addColorStop(0.18, 'rgba(254, 240, 138, 0.88)');
    grad.addColorStop(0.46, 'rgba(245, 158, 11, 0.34)');
    grad.addColorStop(0.78, 'rgba(56, 189, 248, 0.08)');
    grad.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');
    c.fillStyle = grad;
    c.fillRect(0, 0, 128, 128);

    return applyEncoding(THREE, new THREE.CanvasTexture(can));
  }

  function makeLuthiersRoseTexture(THREE) {
    var can = document.createElement('canvas');
    can.width = 256;
    can.height = 256;
    var c = can.getContext('2d');
    c.clearRect(0, 0, 256, 256);

    // Recessed dark acoustic soundhole cavity
    c.fillStyle = '#1a0d06';
    c.beginPath();
    c.arc(128, 128, 116, 0, Math.PI * 2);
    c.fill();

    // Concentric gilded brass filigree rings
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 8;
    c.beginPath();
    c.arc(128, 128, 112, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = '#fde68a';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(128, 128, 92, 0, Math.PI * 2);
    c.arc(128, 128, 48, 0, Math.PI * 2);
    c.stroke();

    // Twelve pierced baroque rosette petals
    c.save();
    c.translate(128, 128);
    for (var p = 0; p < 12; p++) {
      c.save();
      c.rotate((p * Math.PI) / 6);
      c.strokeStyle = p % 2 === 0 ? '#fbbf24' : '#d97706';
      c.lineWidth = 3.2;
      c.beginPath();
      c.moveTo(0, -24);
      c.quadraticCurveTo(22, -64, 0, -92);
      c.quadraticCurveTo(-22, -64, 0, -24);
      c.stroke();
      c.restore();
    }
    c.restore();

    // Central gilded Bourani Phi monogram
    c.fillStyle = '#fef08a';
    c.font = 'bold 44px Georgia, serif';
    c.textAlign = 'center';
    c.fillText('Φ', 128, 143);

    return applyEncoding(THREE, new THREE.CanvasTexture(can));
  }

  function buildSharedMaterials(THREE) {
    if (sharedMaterials) return sharedMaterials;

    // 1. Pentelic Marble Texture
    var mCan = document.createElement('canvas');
    mCan.width = 256;
    mCan.height = 256;
    var mc = mCan.getContext('2d');
    mc.fillStyle = '#f6f2e9';
    mc.fillRect(0, 0, 256, 256);
    for (var v = 0; v < 18; v++) {
      mc.strokeStyle = v % 2 === 0 ? 'rgba(186, 173, 152, 0.26)' : 'rgba(217, 179, 130, 0.16)';
      mc.lineWidth = 1 + (v % 3) * 0.8;
      mc.beginPath();
      var sy = (v * 17) % 256;
      mc.moveTo(0, sy);
      mc.bezierCurveTo(85, sy + ((v % 5) - 2) * 18, 170, sy - ((v % 4) - 1.5) * 16, 256, (sy + 28) % 256);
      mc.stroke();
    }
    var marbleTex = applyEncoding(THREE, new THREE.CanvasTexture(mCan));

    // 2. Mediterranean Walnut Woodgrain Texture
    var wCan = document.createElement('canvas');
    wCan.width = 256;
    wCan.height = 256;
    var wc = wCan.getContext('2d');
    var wGrad = wc.createLinearGradient(0, 0, 256, 256);
    wGrad.addColorStop(0, '#4a2511');
    wGrad.addColorStop(0.5, '#5c2f16');
    wGrad.addColorStop(1, '#3b1c0c');
    wc.fillStyle = wGrad;
    wc.fillRect(0, 0, 256, 256);
    for (var g = 0; g < 46; g++) {
      wc.strokeStyle = g % 2 === 0 ? 'rgba(28, 12, 5, 0.34)' : 'rgba(146, 84, 38, 0.18)';
      wc.lineWidth = 1.2;
      wc.beginPath();
      var gy = g * 5.6;
      wc.moveTo(0, gy);
      wc.quadraticCurveTo(128, gy + Math.sin(g * 0.7) * 7, 256, gy + Math.cos(g * 0.5) * 4);
      wc.stroke();
    }
    var walnutTex = applyEncoding(THREE, new THREE.CanvasTexture(wCan));

    // 3. Golden Spruce Soundboard Texture
    var sCan = document.createElement('canvas');
    sCan.width = 128;
    sCan.height = 128;
    var sc = sCan.getContext('2d');
    sc.fillStyle = '#cfa063';
    sc.fillRect(0, 0, 128, 128);
    for (var sl = 0; sl < 32; sl++) {
      sc.fillStyle = sl % 2 === 0 ? 'rgba(161, 108, 48, 0.18)' : 'rgba(245, 218, 170, 0.15)';
      sc.fillRect(sl * 4, 0, 2, 128);
    }
    var spruceTex = applyEncoding(THREE, new THREE.CanvasTexture(sCan));

    // 4. Blind-Tooled Oxblood Morocco Bookbinding Leather Texture
    var lCan = document.createElement('canvas');
    lCan.width = 256;
    lCan.height = 256;
    var lc = lCan.getContext('2d');
    var lGrad = lc.createLinearGradient(0, 0, 256, 256);
    lGrad.addColorStop(0, '#5a1919');
    lGrad.addColorStop(0.5, '#6b2121');
    lGrad.addColorStop(1, '#431111');
    lc.fillStyle = lGrad;
    lc.fillRect(0, 0, 256, 256);
    lc.strokeStyle = 'rgba(217, 155, 60, 0.52)';
    lc.lineWidth = 3;
    lc.strokeRect(14, 14, 228, 228);
    lc.strokeStyle = 'rgba(253, 230, 138, 0.28)';
    lc.lineWidth = 1.5;
    lc.strokeRect(22, 22, 212, 212);
    var leatherTex = applyEncoding(THREE, new THREE.CanvasTexture(lCan));

    var radialSpriteTex = makeRadialParticleTexture(THREE);
    var roseTex = makeLuthiersRoseTexture(THREE);

    sharedMaterials = {
      marble: new THREE.MeshStandardMaterial({
        map: marbleTex,
        roughness: 0.28,
        metalness: 0.06
      }),
      brass: new THREE.MeshStandardMaterial({
        color: 0xd99b3c,
        roughness: 0.22,
        metalness: 0.87
      }),
      giltBrass: new THREE.MeshStandardMaterial({
        color: 0xf0be59,
        roughness: 0.18,
        metalness: 0.90
      }),
      bronze: new THREE.MeshStandardMaterial({
        color: 0x6b4423,
        roughness: 0.35,
        metalness: 0.78
      }),
      walnut: new THREE.MeshStandardMaterial({
        map: walnutTex,
        roughness: 0.31,
        metalness: 0.09
      }),
      spruce: new THREE.MeshStandardMaterial({
        map: spruceTex,
        roughness: 0.40,
        metalness: 0.05
      }),
      leather: new THREE.MeshStandardMaterial({
        map: leatherTex,
        roughness: 0.46,
        metalness: 0.14
      }),
      parchmentBlock: new THREE.MeshStandardMaterial({
        color: 0xf4ead2,
        roughness: 0.58,
        metalness: 0.14
      }),
      ebony: new THREE.MeshStandardMaterial({
        color: 0x1c1917,
        roughness: 0.26,
        metalness: 0.12
      }),
      velvet: new THREE.MeshStandardMaterial({
        color: 0x4c0519,
        roughness: 0.85,
        metalness: 0.02
      }),
      lensGlass: new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x0c4a6e,
        emissiveIntensity: 0.32,
        roughness: 0.08,
        metalness: 0.18,
        transparent: true,
        opacity: 0.22,
        depthWrite: false
      }),
      roseOrnament: new THREE.MeshStandardMaterial({
        map: roseTex,
        transparent: true,
        roughness: 0.26,
        metalness: 0.72
      }),
      goldGlow: new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        emissive: 0xd97706,
        emissiveIntensity: 1.08,
        roughness: 0.20,
        metalness: 0.45
      }),
      cyanGlow: new THREE.MeshStandardMaterial({
        color: 0x7dd3fc,
        emissive: 0x0284c7,
        emissiveIntensity: 1.15,
        roughness: 0.18,
        metalness: 0.32
      }),
      amberGem: new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        emissive: 0xb45309,
        emissiveIntensity: 0.78,
        roughness: 0.22,
        metalness: 0.35
      }),
      radialSpriteTex: radialSpriteTex,
      invisibleHit: new THREE.MeshBasicMaterial({
        visible: false
      })
    };
    return sharedMaterials;
  }

  function makeToothedGearGeometry(THREE, outerR, rootR, boreR, teeth, thickness) {
    var shape = new THREE.Shape();
    var step = (Math.PI * 2) / teeth;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step;
      var a1 = a0 + step * 0.20;
      var a2 = a0 + step * 0.34;
      var a3 = a0 + step * 0.66;
      var a4 = a0 + step * 0.80;
      if (i === 0) {
        shape.moveTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
      } else {
        shape.lineTo(Math.cos(a0) * rootR, Math.sin(a0) * rootR);
      }
      shape.lineTo(Math.cos(a1) * rootR, Math.sin(a1) * rootR);
      shape.lineTo(Math.cos(a2) * outerR, Math.sin(a2) * outerR);
      shape.lineTo(Math.cos(a3) * outerR, Math.sin(a3) * outerR);
      shape.lineTo(Math.cos(a4) * rootR, Math.sin(a4) * rootR);
    }
    shape.closePath();

    if (boreR > 0.01 && THREE.Path) {
      var hole = new THREE.Path();
      var segs = 28;
      for (var h = 0; h <= segs; h++) {
        var ha = -((h / segs) * Math.PI * 2);
        var hx = Math.cos(ha) * boreR;
        var hy = Math.sin(ha) * boreR;
        if (h === 0) hole.moveTo(hx, hy);
        else hole.lineTo(hx, hy);
      }
      if (shape.holes) shape.holes.push(hole);
    }

    var bev = Math.min(0.004, thickness * 0.18);
    return new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: bev,
      bevelThickness: bev
    });
  }

  function makeCurvedPageGeometry(THREE, width, height, sideSign) {
    var geo = new THREE.PlaneGeometry(width, height, 20, 8);
    if (typeof geo.rotateX === 'function') {
      geo.rotateX(-Math.PI / 2);
    }
    var pos = geo.attributes && geo.attributes.position;
    if (pos && pos.array) {
      var arr = pos.array;
      var halfW = width * 0.5;
      for (var i = 0; i < pos.count; i++) {
        var lx = arr[i * 3];
        var t = sideSign < 0 ? (halfW - lx) / width : (lx + halfW) / width;
        t = Math.max(0, Math.min(1, t));
        var arch = Math.sin(t * Math.PI * 0.92) * 0.024 - Math.pow(1 - t, 3) * 0.012;
        arr[i * 3 + 1] += arch;
      }
      pos.needsUpdate = true;
      if (typeof geo.computeVertexNormals === 'function') {
        geo.computeVertexNormals();
      }
    }
    return geo;
  }

  function makeTurnedBalusterGeometry(THREE) {
    if (!THREE.LatheGeometry || !THREE.Vector2) {
      return new THREE.CylinderGeometry(0.036, 0.024, 0.74, 14);
    }
    var pts = [
      new THREE.Vector2(0.024, 0.00),
      new THREE.Vector2(0.032, 0.06),
      new THREE.Vector2(0.020, 0.10),
      new THREE.Vector2(0.028, 0.24),
      new THREE.Vector2(0.038, 0.42),
      new THREE.Vector2(0.022, 0.50),
      new THREE.Vector2(0.046, 0.60),
      new THREE.Vector2(0.032, 0.68),
      new THREE.Vector2(0.048, 0.74)
    ];
    return new THREE.LatheGeometry(pts, 18);
  }

  function initParticlePool(THREE, mats, ctx) {
    if (!THREE.BufferGeometry || !THREE.BufferAttribute || !THREE.Points) return;
    var count = particleSystem.maxCount;
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    particleSystem.positions = positions;
    particleSystem.colors = colors;
    particleSystem.slots = [];
    particleSystem.activeCount = 0;

    for (var i = 0; i < count; i++) {
      positions[i * 3] = 0;
      positions[i * 3 + 1] = -999;
      positions[i * 3 + 2] = 0;
      colors[i * 3] = 0;
      colors[i * 3 + 1] = 0;
      colors[i * 3 + 2] = 0;
      particleSystem.slots.push({
        active: false,
        age: 0,
        life: 1.0,
        x: 0, y: -999, z: 0,
        vx: 0, vy: 0, vz: 0,
        swirl: 0,
        r: 1.0, g: 0.88, b: 0.45
      });
    }

    var geo = new THREE.BufferGeometry();
    var posAttr = new THREE.BufferAttribute(positions, 3);
    var colAttr = new THREE.BufferAttribute(colors, 3);
    geo.setAttribute('position', posAttr);
    geo.setAttribute('color', colAttr);
    geo.boundingSphere = null;
    particleSystem.posAttr = posAttr;
    particleSystem.colAttr = colAttr;

    var pMat = new THREE.PointsMaterial({
      size: 0.26,
      map: mats.radialSpriteTex,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
      sizeAttenuation: true
    });

    var pts = new THREE.Points(geo, pMat);
    pts.frustumCulled = false;
    pts.visible = false;
    registerMachineryRoot(pts, 'BurstParticles');
    ctx.scene.add(pts);
    particleSystem.points = pts;
  }

  function emitStarlightMotes(origin, count, opts) {
    if (!particleSystem.slots.length || !origin || count <= 0) return;
    var options = opts || {};
    var spread = options.spread !== undefined ? options.spread : 0.28;
    var upMin = options.upMin !== undefined ? options.upMin : 0.35;
    var upMax = options.upMax !== undefined ? options.upMax : 1.15;
    var outSpeed = options.outSpeed !== undefined ? options.outSpeed : 0.55;
    var lifeMin = options.lifeMin !== undefined ? options.lifeMin : 0.85;
    var lifeMax = options.lifeMax !== undefined ? options.lifeMax : 1.75;
    var cyanMix = options.cyanMix !== undefined ? options.cyanMix : 0.22;

    for (var i = 0; i < count; i++) {
      var slot = particleSystem.slots[particleSystem.cursor];
      particleSystem.cursor = (particleSystem.cursor + 1) % particleSystem.maxCount;

      var ang = Math.random() * Math.PI * 2;
      var rad = Math.random() * spread;
      var spd = (0.25 + Math.random() * 0.75) * outSpeed;
      var useCyan = Math.random() < cyanMix;

      if (!slot.active) {
        slot.active = true;
        particleSystem.activeCount++;
      }
      slot.age = 0;
      slot.life = lifeMin + Math.random() * (lifeMax - lifeMin);
      slot.x = origin.x + Math.cos(ang) * rad;
      slot.y = origin.y + (Math.random() - 0.3) * spread * 0.5;
      slot.z = origin.z + Math.sin(ang) * rad;
      slot.vx = Math.cos(ang) * spd;
      slot.vy = upMin + Math.random() * (upMax - upMin);
      slot.vz = Math.sin(ang) * spd;
      slot.swirl = (Math.random() - 0.5) * 3.2;

      if (useCyan) {
        slot.r = 0.48;
        slot.g = 0.86;
        slot.b = 1.00;
      } else {
        slot.r = 1.00;
        slot.g = 0.88 + Math.random() * 0.10;
        slot.b = 0.42 + Math.random() * 0.25;
      }
    }

    if (particleSystem.points && particleSystem.activeCount > 0) {
      particleSystem.points.visible = true;
    }
  }

  function updateParticlePool(dt, tSec) {
    if (
      particleSystem.activeCount <= 0 ||
      !particleSystem.points ||
      !particleSystem.posAttr ||
      !particleSystem.colAttr
    ) {
      return;
    }

    var posArr = particleSystem.positions;
    var colArr = particleSystem.colors;

    for (var i = 0; i < particleSystem.maxCount; i++) {
      var s = particleSystem.slots[i];
      if (!s.active) continue;
      s.age += dt;
      if (s.age >= s.life) {
        s.active = false;
        particleSystem.activeCount = Math.max(0, particleSystem.activeCount - 1);
        posArr[i * 3 + 1] = -999;
        colArr[i * 3] = 0;
        colArr[i * 3 + 1] = 0;
        colArr[i * 3 + 2] = 0;
        continue;
      }

      var p = s.age / s.life;
      var fade = Math.sin(p * Math.PI);
      fade = fade * fade;

      var swX = Math.cos(tSec * 2.6 + i) * s.swirl * 0.08;
      var swZ = Math.sin(tSec * 2.6 + i) * s.swirl * 0.08;
      s.x += (s.vx + swX) * dt;
      s.y += s.vy * dt;
      s.z += (s.vz + swZ) * dt;
      s.vx *= (1 - dt * 1.1);
      s.vz *= (1 - dt * 1.1);

      posArr[i * 3] = s.x;
      posArr[i * 3 + 1] = s.y;
      posArr[i * 3 + 2] = s.z;

      colArr[i * 3] = s.r * fade;
      colArr[i * 3 + 1] = s.g * fade;
      colArr[i * 3 + 2] = s.b * fade;
    }

    particleSystem.posAttr.needsUpdate = true;
    particleSystem.colAttr.needsUpdate = true;

    if (particleSystem.activeCount <= 0) {
      particleSystem.points.visible = false;
    }
  }

  // --------------------------------------------------------------------------
  // 1. CONCHIS'S DIEGETIC 3D LINKING BOOKS (Tooled Leather, Bosses & Curved Pages)
  // --------------------------------------------------------------------------
  function wrapCanvasLines(c, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var cur = '';
    for (var i = 0; i < words.length; i++) {
      var test = cur ? cur + ' ' + words[i] : words[i];
      if (c.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = words[i];
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  function drawLinkingLeftPage(book) {
    var dest = LINK_DESTINATIONS[book.targetId];
    var c = book.leftCanvas.getContext('2d');
    var w = book.leftCanvas.width;
    var h = book.leftCanvas.height;

    var bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#f9f1dc');
    bg.addColorStop(0.5, '#f2e4c6');
    bg.addColorStop(1, '#e6d2aa');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // Curved book-gutter shadow on the spine side (right edge of left page)
    var spineGrad = c.createLinearGradient(w - 38, 0, w, 0);
    spineGrad.addColorStop(0, 'rgba(68, 40, 18, 0)');
    spineGrad.addColorStop(1, 'rgba(54, 28, 10, 0.36)');
    c.fillStyle = spineGrad;
    c.fillRect(w - 38, 0, 38, h);

    c.strokeStyle = '#854d0e';
    c.lineWidth = 2.5;
    c.strokeRect(14, 14, w - 28, h - 28);
    c.strokeStyle = 'rgba(133, 77, 14, 0.45)';
    c.lineWidth = 1;
    c.strokeRect(20, 20, w - 40, h - 40);

    c.fillStyle = '#78350f';
    c.textAlign = 'center';
    c.font = 'bold 13px Georgia, serif';
    c.fillText('BOURANI LINKING CHRONICLE', w * 0.5, 44);

    c.fillStyle = '#b45309';
    c.font = 'bold 20px Georgia, serif';
    c.fillText(dest.act + ' · ' + dest.greek, w * 0.5, 74);

    c.strokeStyle = 'rgba(146, 64, 14, 0.45)';
    c.beginPath();
    c.moveTo(38, 88);
    c.lineTo(w - 38, 88);
    c.stroke();

    c.fillStyle = '#1c1917';
    c.font = 'bold 16px Georgia, serif';
    var titleLines = wrapCanvasLines(c, dest.title, w - 56);
    var ty = 114;
    titleLines.forEach(function (ln) {
      c.fillText(ln, w * 0.5, ty);
      ty += 21;
    });

    c.fillStyle = '#92400e';
    c.font = 'italic 13px Georgia, serif';
    var subLines = wrapCanvasLines(c, dest.subtitle, w - 56);
    ty += 4;
    subLines.forEach(function (ln) {
      c.fillText(ln, w * 0.5, ty);
      ty += 17;
    });

    c.fillStyle = '#292524';
    c.font = '14px Georgia, serif';
    var loreLines = wrapCanvasLines(c, dest.chronicle, w - 62);
    ty += 14;
    loreLines.forEach(function (ln) {
      c.fillText(ln, w * 0.5, ty);
      ty += 19;
    });

    c.fillStyle = '#78350f';
    c.font = 'bold 11px Georgia, serif';
    c.fillText('TURN TAB TO CYCLE HEADLANDS (I–V)', w * 0.5, h - 28);

    book.leftTex.needsUpdate = true;
  }

  function drawLinkingRightPage(book, tSec) {
    var dest = LINK_DESTINATIONS[book.targetId];
    var pal = dest.palette;
    var c = book.rightCanvas.getContext('2d');
    var w = book.rightCanvas.width;
    var h = book.rightCanvas.height;

    var bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#f5e8cc');
    bg.addColorStop(1, '#e5cf9f');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    // Curved book-gutter shadow on left spine edge
    var spineGrad = c.createLinearGradient(0, 0, 36, 0);
    spineGrad.addColorStop(0, 'rgba(54, 28, 10, 0.38)');
    spineGrad.addColorStop(1, 'rgba(54, 28, 10, 0)');
    c.fillStyle = spineGrad;
    c.fillRect(0, 0, 36, h);

    c.strokeStyle = '#854d0e';
    c.lineWidth = 2.5;
    c.strokeRect(14, 14, w - 28, h - 28);

    c.fillStyle = '#78350f';
    c.textAlign = 'center';
    c.font = 'bold 12px Georgia, serif';
    c.fillText('AEGEAN LINKING PANEL', w * 0.5, 38);

    var px = 30;
    var py = 52;
    var pw = w - 60;
    var ph = 186;

    c.fillStyle = '#451a03';
    roundRectPath(c, px - 5, py - 5, pw + 10, ph + 10, 8);
    c.fill();
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2.2;
    c.stroke();

    c.save();
    roundRectPath(c, px, py, pw, ph, 5);
    c.clip();

    var sky = c.createLinearGradient(0, py, 0, py + ph * 0.66);
    sky.addColorStop(0, pal.top);
    sky.addColorStop(1, pal.mid);
    c.fillStyle = sky;
    c.fillRect(px, py, pw, ph * 0.68);

    for (var s = 0; s < 14; s++) {
      var sx = px + ((s * 37 + 19) % (pw - 16)) + 8;
      var sy = py + ((s * 23 + 11) % Math.floor(ph * 0.45)) + 6;
      var tw = 0.35 + 0.65 * Math.abs(Math.sin(tSec * 2.4 + s * 1.3));
      c.fillStyle = 'rgba(254, 249, 195, ' + tw.toFixed(2) + ')';
      c.beginPath();
      c.arc(sx, sy, 1.4 + (s % 2) * 0.6, 0, Math.PI * 2);
      c.fill();
    }

    var cx = px + pw * 0.5;
    var horizonY = py + ph * 0.64;

    var orbPulse = 18 + Math.sin(tSec * 2.1) * 3;
    var halo = c.createRadialGradient(cx, py + ph * 0.36, 2, cx, py + ph * 0.36, orbPulse * 2.4);
    halo.addColorStop(0, pal.accent);
    halo.addColorStop(0.45, pal.glow);
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = halo;
    c.fillRect(px, py, pw, ph);

    var sea = c.createLinearGradient(0, horizonY, 0, py + ph);
    sea.addColorStop(0, pal.mid);
    sea.addColorStop(0.35, pal.sea);
    sea.addColorStop(1, '#04101f');
    c.fillStyle = sea;
    c.fillRect(px, horizonY, pw, ph - (horizonY - py));

    for (var r = 0; r < 7; r++) {
      var ry = horizonY + 7 + r * 8;
      var rx = cx + Math.sin(tSec * 2.8 + r * 0.9) * 9;
      var rw = Math.max(10, 44 - r * 4.5 + Math.cos(tSec * 2.2 + r) * 5);
      c.fillStyle = 'rgba(254, 240, 138, 0.52)';
      c.beginPath();
      c.ellipse(rx, ry, rw, 1.5, 0, 0, Math.PI * 2);
      c.fill();
    }

    if (book.targetId === 0 || book.targetId === 1) {
      c.fillStyle = '#f8fafc';
      var cols = book.targetId === 0 ? [-56, -28, 28, 56] : [-48, -16, 16, 48];
      cols.forEach(function (dx) {
        c.fillRect(cx + dx - 4, horizonY - 46, 8, 48);
      });
      c.fillRect(cx - 64, horizonY - 52, 128, 7);
      if (book.targetId === 1) {
        c.strokeStyle = '#38bdf8';
        c.lineWidth = 2.6;
        c.beginPath();
        c.arc(cx, horizonY - 12, 36, Math.PI, 0);
        c.stroke();
      }
    } else if (book.targetId === 2) {
      c.fillStyle = '#0f172a';
      c.beginPath();
      c.moveTo(px, horizonY + 8);
      c.lineTo(px + 42, horizonY - 24);
      c.lineTo(px + 78, horizonY + 8);
      c.fill();
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 5;
      c.beginPath();
      c.arc(cx + 12, horizonY + 2, 24, Math.PI, 0);
      c.stroke();
    } else if (book.targetId === 3) {
      c.save();
      c.translate(cx, horizonY - 24 + Math.sin(tSec * 2.5) * 4);
      c.rotate(Math.sin(tSec * 1.2) * 0.25);
      c.strokeStyle = '#fde047';
      c.lineWidth = 2.2;
      c.beginPath();
      c.moveTo(0, -22);
      c.lineTo(16, 0);
      c.lineTo(0, 22);
      c.lineTo(-16, 0);
      c.closePath();
      c.stroke();
      c.restore();
    } else {
      [34, 24, 14].forEach(function (rad, idx) {
        c.save();
        c.translate(cx, horizonY - 22);
        c.rotate(tSec * (0.7 + idx * 0.4) * (idx % 2 === 0 ? 1 : -1));
        c.strokeStyle = idx === 1 ? '#38bdf8' : '#fde68a';
        c.lineWidth = 2;
        c.beginPath();
        c.ellipse(0, 0, rad, rad * 0.62, 0, 0, Math.PI * 2);
        c.stroke();
        c.restore();
      });
    }

    var sweepY = py + ((tSec * 38) % ph);
    var sweepGrad = c.createLinearGradient(0, sweepY - 12, 0, sweepY + 12);
    sweepGrad.addColorStop(0, 'rgba(125, 211, 252, 0)');
    sweepGrad.addColorStop(0.5, 'rgba(125, 211, 252, 0.22)');
    sweepGrad.addColorStop(1, 'rgba(125, 211, 252, 0)');
    c.fillStyle = sweepGrad;
    c.fillRect(px, sweepY - 12, pw, 24);

    c.restore();

    c.fillStyle = '#1c1917';
    c.font = 'bold 14px Georgia, serif';
    c.fillText(dest.shortName.toUpperCase(), w * 0.5, py + ph + 28);

    c.fillStyle = '#0369a1';
    c.font = 'bold 11px Georgia, serif';
    c.fillText('TOUCH PANEL TO LINK', w * 0.5, py + ph + 48);

    book.rightTex.needsUpdate = true;
  }

  function buildLinkingLectern(THREE, mats, ctx, cfg) {
    var root = new THREE.Group();
    root.position.set(cfg.x, cfg.y, cfg.z);
    root.rotation.y = cfg.rotY;
    registerMachineryRoot(root, 'LinkingLectern_' + cfg.bookIdx);
    ctx.scene.add(root);

    var stand = new THREE.Group();
    stand.position.set(cfg.localX || 0, 0, cfg.localZ || 0);
    root.add(stand);

    // Two-stepped Attic Pentelic Marble Pedestal + Moulded Torus Base
    var baseStep1 = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.10, 0.88), mats.marble);
    baseStep1.position.y = 0.03;
    stand.add(baseStep1);

    var baseStep2 = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.09, 0.74), mats.marble);
    baseStep2.position.y = 0.125;
    stand.add(baseStep2);

    var plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.16, 20), mats.marble);
    plinth.position.y = 0.25;
    stand.add(plinth);

    var collarBot = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.026, 10, 28), mats.brass);
    collarBot.rotation.x = Math.PI / 2;
    collarBot.position.y = 0.33;
    stand.add(collarBot);

    var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.165, 0.215, 0.68, 20), mats.marble);
    shaft.position.y = 0.67;
    stand.add(shaft);

    // Echinus capital & brass necking beneath reading desk
    var necking = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.024, 10, 28), mats.brass);
    necking.rotation.x = Math.PI / 2;
    necking.position.y = 0.99;
    stand.add(necking);

    var echinus = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.175, 0.10, 20), mats.marble);
    echinus.position.y = 1.05;
    stand.add(echinus);

    // Slanted Pentelic Marble & Brass Lectern Desk
    var desk = new THREE.Group();
    desk.position.set(0, 1.12, 0.04);
    desk.rotation.x = 0.42;
    stand.add(desk);

    var slab = new THREE.Mesh(new THREE.BoxGeometry(1.00, 0.055, 0.68), mats.marble);
    desk.add(slab);

    var brassTrim = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.036, 0.72), mats.brass);
    brassTrim.position.y = -0.014;
    desk.add(brassTrim);

    var lip = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.068, 0.046), mats.giltBrass);
    lip.position.set(0, 0.046, 0.325);
    desk.add(lip);

    // Open Tooled Morocco Leather & Brass Myst Linking Book
    var spine = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.56, 18), mats.leather);
    spine.rotation.x = Math.PI / 2;
    spine.position.set(0, 0.044, -0.01);
    desk.add(spine);

    // Five raised tooled leather spine bands flanked by fine gilt brass fillets
    [-0.22, -0.11, 0, 0.11, 0.22].forEach(function (sz) {
      var leatherBand = new THREE.Mesh(new THREE.TorusGeometry(0.047, 0.009, 10, 20), mats.leather);
      leatherBand.position.set(0, 0.044, sz - 0.01);
      desk.add(leatherBand);

      [-0.010, 0.010].forEach(function (fOff) {
        var giltFillet = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0035, 8, 20), mats.giltBrass);
        giltFillet.position.set(0, 0.044, sz - 0.01 + fOff);
        desk.add(giltFillet);
      });
    });

    // Brass spine headcap & tailcap finials
    [-0.285, 0.285].forEach(function (cz) {
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.018, 16), mats.brass);
      cap.rotation.x = Math.PI / 2;
      cap.position.set(0, 0.044, cz - 0.01);
      desk.add(cap);
    });

    // Left Open Folio Wing
    var leftWing = new THREE.Group();
    leftWing.position.set(-0.012, 0.048, -0.01);
    leftWing.rotation.z = -0.085;
    desk.add(leftWing);

    var coverL = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.022, 0.56), mats.leather);
    coverL.position.set(-0.215, 0, 0);
    leftWing.add(coverL);

    var pagesL = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.036, 0.51), mats.parchmentBlock);
    pagesL.position.set(-0.20, 0.024, 0);
    leftWing.add(pagesL);

    // Right Open Folio Wing
    var rightWing = new THREE.Group();
    rightWing.position.set(0.012, 0.048, -0.01);
    rightWing.rotation.z = 0.085;
    desk.add(rightWing);

    var coverR = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.022, 0.56), mats.leather);
    coverR.position.set(0.215, 0, 0);
    rightWing.add(coverR);

    var pagesR = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.036, 0.51), mats.parchmentBlock);
    pagesR.position.set(0.20, 0.024, 0);
    rightWing.add(pagesR);

    // Ornate L-Shaped Filigree Brass Corner Bosses + Domed Rivets on all 4 outer folio corners
    [
      { wing: leftWing,  x: -0.405, z: -0.255, sx:  1, sz:  1 },
      { wing: leftWing,  x: -0.405, z:  0.255, sx:  1, sz: -1 },
      { wing: rightWing, x:  0.405, z: -0.255, sx: -1, sz:  1 },
      { wing: rightWing, x:  0.405, z:  0.255, sx: -1, sz: -1 }
    ].forEach(function (corner) {
      var armX = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.028, 0.024), mats.giltBrass);
      armX.position.set(corner.x + corner.sx * 0.022, 0.004, corner.z);
      corner.wing.add(armX);

      var armZ = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.028, 0.075), mats.giltBrass);
      armZ.position.set(corner.x, 0.004, corner.z + corner.sz * 0.022);
      corner.wing.add(armZ);

      var rivet = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), mats.giltBrass);
      rivet.position.set(corner.x + corner.sx * 0.008, 0.018, corner.z + corner.sz * 0.008);
      corner.wing.add(rivet);
    });

    // Twin Open Hinged Brass Fore-Edge Book Clasps
    [-0.14, 0.14].forEach(function (claspZ) {
      var claspL = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.014, 0.028), mats.brass);
      claspL.position.set(-0.44, 0.006, claspZ);
      claspL.rotation.z = 0.25;
      leftWing.add(claspL);

      var claspR = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.014, 0.028), mats.brass);
      claspR.position.set(0.44, 0.006, claspZ);
      claspR.rotation.z = -0.25;
      rightWing.add(claspR);
    });

    // Softly Curved Left & Right Parchment Page Geometries
    var leftCanvas = document.createElement('canvas');
    leftCanvas.width = 256;
    leftCanvas.height = 320;
    var leftTex = applyEncoding(THREE, new THREE.CanvasTexture(leftCanvas));
    var leftMat = new THREE.MeshStandardMaterial({
      map: leftTex,
      roughness: 0.48,
      metalness: 0.06
    });

    var leftPageMesh = new THREE.Mesh(makeCurvedPageGeometry(THREE, 0.38, 0.49, -1), leftMat);
    leftPageMesh.position.set(-0.20, 0.044, 0);
    leftPageMesh.userData = {
      interactType: 'machinery',
      machineId: 'linking_tab',
      bookIdx: cfg.bookIdx
    };
    leftWing.add(leftPageMesh);
    ctx.interactables.push(leftPageMesh);

    var rightCanvas = document.createElement('canvas');
    rightCanvas.width = 256;
    rightCanvas.height = 320;
    var rightTex = applyEncoding(THREE, new THREE.CanvasTexture(rightCanvas));
    var rightMat = new THREE.MeshBasicMaterial({
      map: rightTex
    });

    var rightPageMesh = new THREE.Mesh(makeCurvedPageGeometry(THREE, 0.38, 0.49, 1), rightMat);
    rightPageMesh.position.set(0.20, 0.045, 0);
    rightPageMesh.userData = {
      interactType: 'machinery',
      machineId: 'linking_panel',
      bookIdx: cfg.bookIdx
    };
    rightWing.add(rightPageMesh);
    ctx.interactables.push(rightPageMesh);

    var panelHit = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.14, 0.50), mats.invisibleHit);
    panelHit.position.set(0.20, 0.075, 0);
    panelHit.userData = {
      interactType: 'machinery',
      machineId: 'linking_panel',
      bookIdx: cfg.bookIdx
    };
    rightWing.add(panelHit);
    ctx.interactables.push(panelHit);

    // Sculpted Brass Destination Cycle Tab on the Lectern Rim
    var tabGroup = new THREE.Group();
    tabGroup.position.set(0.48, 0.065, 0.14);
    desk.add(tabGroup);

    var tabArm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.030, 0.10), mats.giltBrass);
    tabArm.userData = {
      interactType: 'machinery',
      machineId: 'linking_tab',
      bookIdx: cfg.bookIdx
    };
    tabGroup.add(tabArm);
    ctx.interactables.push(tabArm);

    var tabSeal = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.036, 20), mats.goldGlow);
    tabSeal.position.set(0.04, 0.018, 0);
    tabSeal.userData = {
      interactType: 'machinery',
      machineId: 'linking_tab',
      bookIdx: cfg.bookIdx
    };
    tabGroup.add(tabSeal);
    ctx.interactables.push(tabSeal);

    var tabHit = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.24), mats.invisibleHit);
    tabHit.position.set(0.02, 0.03, 0);
    tabHit.userData = {
      interactType: 'machinery',
      machineId: 'linking_tab',
      bookIdx: cfg.bookIdx
    };
    tabGroup.add(tabHit);
    ctx.interactables.push(tabHit);

    // Faceted crystal focus gem floating gently over the Linking Panel
    var crystal = new THREE.Mesh(new THREE.OctahedronGeometry(0.048, 0), mats.cyanGlow);
    crystal.position.set(0.20, 0.23, 0.02);
    crystal.userData = {
      interactType: 'machinery',
      machineId: 'linking_panel',
      bookIdx: cfg.bookIdx
    };
    desk.add(crystal);
    ctx.interactables.push(crystal);

    setShadows(stand, false, true);
    mergeStaticByMaterial(THREE, stand, {
      interactiveList: ctx.interactables,
      castShadowMats: [mats.marble]
    });

    var sinY = Math.sin(cfg.rotY);
    var cosY = Math.cos(cfg.rotY);
    var worldX = cfg.x + (cfg.localX || 0) * cosY + (cfg.localZ || 0) * sinY;
    var worldZ = cfg.z - (cfg.localX || 0) * sinY + (cfg.localZ || 0) * cosY;

    var bookObj = {
      bookIdx: cfg.bookIdx,
      name: cfg.name,
      targetId: cfg.initialTargetId,
      root: root,
      crystal: crystal,
      tabSeal: tabSeal,
      leftCanvas: leftCanvas,
      leftTex: leftTex,
      rightCanvas: rightCanvas,
      rightTex: rightTex,
      worldX: worldX,
      worldZ: worldZ,
      bookZ: cfg.z,
      drawAccumMs: 0
    };

    drawLinkingLeftPage(bookObj);
    drawLinkingRightPage(bookObj, 0);
    linkingBooks.push(bookObj);
  }

  function ensureLinkOverlay() {
    if (linkWarpState.overlayEl || typeof document === 'undefined') return linkWarpState.overlayEl;
    var existing = document.getElementById('phraxos-link-vignette');
    if (existing) {
      linkWarpState.overlayEl = existing;
      return existing;
    }
    var el = document.createElement('div');
    el.id = 'phraxos-link-vignette';
    el.style.cssText = [
      'position:fixed',
      'inset:0',
      'pointer-events:none',
      'z-index:940',
      'opacity:0',
      'transition:none',
      'background:radial-gradient(circle at 50% 50%, rgba(254,249,195,0.92) 0%, rgba(56,189,248,0.68) 38%, rgba(7,25,46,0.94) 100%)'
    ].join(';');
    document.body.appendChild(el);
    linkWarpState.overlayEl = el;
    return el;
  }

  function triggerMystLink(book, ctx) {
    if (linkWarpState.active) return;
    var dest = LINK_DESTINATIONS[book.targetId];
    var THREE = (ctx && ctx.THREE) || (typeof window !== 'undefined' ? window.THREE : null);
    playMystLinkingChime(ctx);

    if (THREE && book.crystal) {
      var burstPos = getWorldCoords(THREE, book.crystal, book.worldX, 1.72, book.worldZ);
      emitStarlightMotes(burstPos, 48, {
        spread: 0.34,
        upMin: 0.55,
        upMax: 1.65,
        outSpeed: 0.72,
        lifeMin: 0.85,
        lifeMax: 1.65,
        cyanMix: 0.48
      });
    }

    if (typeof window !== 'undefined' && window.PhraxosNav && typeof window.PhraxosNav.cancelWaypoint === 'function') {
      window.PhraxosNav.cancelWaypoint();
    }

    ensureLinkOverlay();
    linkWarpState.active = true;
    linkWarpState.elapsed = 0;
    linkWarpState.targetAltarId = dest.id;
    linkWarpState.teleported = false;
    linkWarpState.baseFov = (ctx && ctx.camera) ? ctx.camera.fov : 46;

    var wasFirst = markMachineSolved('linking_book', ctx);
    notifyBanner(
      ctx,
      '📘 Linking through Conchis’s Chronicle → ' + dest.act + ': ' + dest.title,
      'solved'
    );

    if (wasFirst) {
      notifyToast(
        ctx,
        '<div style="font-size:0.68rem;color:#38bdf8;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">📘 Myst Linking Chronicle Awakened</div>' +
        '<div style="font-size:1.0rem;font-weight:800;color:#fff;margin:0.12rem 0;">Passage Opened to ' + dest.title + '</div>' +
        '<div style="font-size:0.76rem;color:#fde68a;">Turn the brass index clasp on either lectern to link instantaneously across all five headlands of Phraxos.</div>'
      );
    }
  }

  // --------------------------------------------------------------------------
  // 2. INTERACTIVE 3D ROTATING ARMILLARY ASTROLABE (Toothed Gears, Fresnel Beam & Brass-Ringed Glass Projection Lens)
  // --------------------------------------------------------------------------
  function createFresnelBeamMaterial(THREE, coreHex, outerHex, maxOpacity, edgePower) {
    var uniforms = {
      uTime: { value: 0 },
      uReveal: { value: 1.0 },
      uCoreColor: { value: new THREE.Color(coreHex) },
      uOuterColor: { value: new THREE.Color(outerHex) },
      uOpacity: { value: maxOpacity },
      uEdgePower: { value: edgePower }
    };
    armillary.beamUniformsList.push(uniforms);

    return new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormalView;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  vUv = uv;',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  vNormalView = normalize(normalMatrix * normal);',
        '  vViewDir = normalize(-mvPos.xyz);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uReveal;',
        'uniform vec3 uCoreColor;',
        'uniform vec3 uOuterColor;',
        'uniform float uOpacity;',
        'uniform float uEdgePower;',
        'varying vec2 vUv;',
        'varying vec3 vNormalView;',
        'varying vec3 vViewDir;',
        'void main() {',
        '  float ndv = abs(dot(normalize(vNormalView), normalize(vViewDir)));',
        '  float radial = pow(clamp(ndv, 0.0, 1.0), uEdgePower);',
        '  float endFade = smoothstep(0.0, 0.16, vUv.y) * (1.0 - smoothstep(0.82, 1.0, vUv.y));',
        '  float reach = smoothstep(vUv.y - 0.12, vUv.y + 0.02, uReveal * 1.15);',
        '  float shimmer = 0.82 + 0.18 * sin(vUv.y * 20.0 - uTime * 3.4) * cos(vUv.y * 7.0 + uTime * 1.8);',
        '  float alpha = radial * endFade * reach * uOpacity * shimmer;',
        '  if (alpha < 0.003) discard;',
        '  vec3 col = mix(uOuterColor, uCoreColor, smoothstep(0.22, 0.86, radial));',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
      ].join('\n')
    });
  }

  function makeLensCalligraphyTexture(THREE) {
    var can = document.createElement('canvas');
    can.width = 1024;
    can.height = 512;
    var c = can.getContext('2d');

    c.clearRect(0, 0, can.width, can.height);

    // Pure radial/elliptical caustic glow fading to 0.0 alpha well before edges (ZERO box borders!)
    c.save();
    c.translate(512, 256);
    c.scale(1.0, 0.48);
    var glow = c.createRadialGradient(0, 0, 12, 0, 0, 470);
    glow.addColorStop(0.00, 'rgba(10, 35, 66, 0.78)');
    glow.addColorStop(0.52, 'rgba(12, 46, 82, 0.64)');
    glow.addColorStop(0.78, 'rgba(14, 116, 144, 0.22)');
    glow.addColorStop(0.94, 'rgba(253, 230, 138, 0.04)');
    glow.addColorStop(1.00, 'rgba(0, 0, 0, 0.0)');
    c.fillStyle = glow;
    c.beginPath();
    c.arc(0, 0, 475, 0, Math.PI * 2);
    c.fill();

    // Delicate engraved astrolabe meridian hairlines inside the glass lens
    c.strokeStyle = 'rgba(253, 230, 138, 0.24)';
    c.lineWidth = 2.0;
    c.beginPath();
    c.arc(0, 0, 415, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = 'rgba(125, 211, 252, 0.18)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, 0, 365, 0, Math.PI * 2);
    c.stroke();
    c.restore();

    // Luminous Greek & English C1 Grammar Calligraphy (sized cleanly inside elliptical bezel)
    c.textAlign = 'center';

    c.fillStyle = 'rgba(125, 211, 252, 0.96)';
    c.font = 'bold 19px Georgia, serif';
    c.fillText('✦  Α Σ Τ Ρ Ο Λ Α Β Ο Σ  ·  A E G E A N   E Q U I N O X   K E Y  ✦', 512, 178, 720);

    c.fillStyle = '#fef08a';
    c.font = 'bold 26px Georgia, serif';
    c.fillText("ΦΩΣ · INVERT ONLY AFTER THE TIME CLAUSE IN 'ONLY WHEN'", 512, 262, 810);

    c.fillStyle = 'rgba(241, 245, 249, 0.95)';
    c.font = 'italic 21px Georgia, serif';
    c.fillText('Only when the cicadas fell silent did the Aegean freeze.', 512, 334, 720);

    return applyEncoding(THREE, new THREE.CanvasTexture(can));
  }

  function buildArmillaryContraption(THREE, mats, ctx) {
    var group = new THREE.Group();
    group.position.set(0, 0.45, 3.2);
    registerMachineryRoot(group, 'Armillary');
    ctx.scene.add(group);
    armillary.group = group;
    armillary.rings = [];
    armillary.collars = [];
    armillary.pinions = [];
    armillary.gems = [];
    armillary.beamUniformsList = [];
    var dynamicArmillarySubtrees = [];

    if (solvedSet.has('armillary')) {
      armillary.steps = [0, 0, 0];
      armillary.currentAngles = [0, 0, 0];
      armillary.solved = true;
      armillary.revealMix = 1.0;
    } else {
      armillary.steps = [4, 3, 5];
      armillary.currentAngles = [(4 * Math.PI) / 3, (3 * Math.PI) / 3, (5 * Math.PI) / 3];
      armillary.solved = false;
      armillary.revealMix = 0.0;
    }

    // Engraved Pentelic Marble Horizon Table + Toothed Azimuth Escape Crown (y = 1.15)
    var horizonPlate = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.50, 0.08, 28), mats.marble);
    horizonPlate.position.y = 1.15;
    group.add(horizonPlate);

    var escapeGearGeo = makeToothedGearGeometry(THREE, 0.63, 0.575, 0.48, 36, 0.032);
    var escapeGear = new THREE.Mesh(escapeGearGeo, mats.brass);
    escapeGear.rotation.x = -Math.PI / 2;
    escapeGear.position.y = 1.17;
    group.add(escapeGear);

    // Fixed Outer Bronze Meridian Cradle & North Equinox Sighting Fiducial (-Z points to Cove)
    var cradleRing = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.024, 12, 48), mats.bronze);
    cradleRing.rotation.y = Math.PI / 2;
    cradleRing.position.y = 1.68;
    group.add(cradleRing);

    var northSightRing = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.022, 12, 28), mats.cyanGlow);
    northSightRing.position.set(0, 1.68, -1.06);
    group.add(northSightRing);

    // Side Brass Escapement Bracket with Counter-Rotating Pinion Gears meshing with Pedestal Gear Wheels
    var bracketPillar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.54, 12), mats.bronze);
    bracketPillar.position.set(0.53, 0.86, 0);
    group.add(bracketPillar);

    var ringSpecs = [
      { idx: 0, radius: 0.98, tiltZ:  0.00, collarY: 1.03, gearOuter: 0.44, gearRoot: 0.39, teeth: 24 },
      { idx: 1, radius: 0.88, tiltZ:  0.58, collarY: 0.85, gearOuter: 0.47, gearRoot: 0.42, teeth: 28 },
      { idx: 2, radius: 0.78, tiltZ: -0.58, collarY: 0.67, gearOuter: 0.50, gearRoot: 0.45, teeth: 32 }
    ];

    ringSpecs.forEach(function (spec) {
      var tiltWrap = new THREE.Group();
      tiltWrap.position.y = 1.68;
      tiltWrap.rotation.z = spec.tiltZ;
      group.add(tiltWrap);

      var spinGroup = new THREE.Group();
      spinGroup.rotation.y = armillary.currentAngles[spec.idx];
      tiltWrap.add(spinGroup);

      var ringMesh = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.034, 14, 48), mats.brass);
      ringMesh.rotation.x = Math.PI / 2;
      ringMesh.userData = {
        interactType: 'machinery',
        machineId: 'armillary_ring',
        ringIdx: spec.idx
      };
      spinGroup.add(ringMesh);
      ctx.interactables.push(ringMesh);

      var ringHit = new THREE.Mesh(new THREE.TorusGeometry(spec.radius, 0.075, 10, 32), mats.invisibleHit);
      ringHit.rotation.x = Math.PI / 2;
      ringHit.userData = {
        interactType: 'machinery',
        machineId: 'armillary_ring',
        ringIdx: spec.idx
      };
      spinGroup.add(ringHit);
      ctx.interactables.push(ringHit);

      // Six 60-degree bevelled brass Vernier degree lugs around each ring
      for (var d = 1; d < 6; d++) {
        var ang = (d * Math.PI) / 3;
        var lug = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.058, 8), mats.giltBrass);
        lug.position.set(Math.sin(ang) * spec.radius, 0, -Math.cos(ang) * spec.radius);
        spinGroup.add(lug);
      }

      // North Equinox Aperture Lens & Bezel at (0, 0, -spec.radius) when step === 0
      var gemMat = armillary.steps[spec.idx] === 0 ? mats.cyanGlow : mats.amberGem;
      var gem = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), gemMat);
      gem.position.set(0, 0, -spec.radius);
      gem.userData = {
        interactType: 'machinery',
        machineId: 'armillary_ring',
        ringIdx: spec.idx
      };
      spinGroup.add(gem);
      ctx.interactables.push(gem);

      var bezel = new THREE.Mesh(new THREE.TorusGeometry(0.078, 0.016, 10, 24), mats.giltBrass);
      bezel.position.set(0, 0, -spec.radius);
      spinGroup.add(bezel);

      // Real Toothed Spoked Brass Gear Wheel (`ExtrudeGeometry`) on Pedestal Shaft
      var collarGroup = new THREE.Group();
      collarGroup.position.y = spec.collarY;
      collarGroup.rotation.y = armillary.currentAngles[spec.idx];
      group.add(collarGroup);

      var gearGeo = makeToothedGearGeometry(
        THREE,
        spec.gearOuter,
        spec.gearRoot,
        spec.gearRoot - 0.065,
        spec.teeth,
        0.044
      );
      var gearWheel = new THREE.Mesh(gearGeo, mats.brass);
      gearWheel.rotation.x = -Math.PI / 2;
      gearWheel.position.y = -0.022;
      gearWheel.userData = {
        interactType: 'machinery',
        machineId: 'armillary_ring',
        ringIdx: spec.idx
      };
      collarGroup.add(gearWheel);
      ctx.interactables.push(gearWheel);

      // Six radial brass spokes bridging pedestal hub to toothed gear rim
      for (var sp = 0; sp < 3; sp++) {
        var bar = new THREE.Mesh(new THREE.BoxGeometry(spec.gearRoot * 1.82, 0.026, 0.028), mats.bronze);
        bar.rotation.y = (sp * Math.PI) / 3;
        collarGroup.add(bar);
      }

      // Generous invisible click collar for effortless pedestal gear interaction
      var collarHit = new THREE.Mesh(new THREE.CylinderGeometry(spec.gearOuter + 0.03, spec.gearOuter + 0.03, 0.12, 18), mats.invisibleHit);
      collarHit.userData = {
        interactType: 'machinery',
        machineId: 'armillary_ring',
        ringIdx: spec.idx
      };
      collarGroup.add(collarHit);
      ctx.interactables.push(collarHit);

      var collarPip = new THREE.Mesh(new THREE.SphereGeometry(0.036, 12, 10), gemMat);
      collarPip.position.set(0, 0.022, -spec.gearRoot);
      collarGroup.add(collarPip);

      // Meshed Side Brass Pinion Gear (`10 teeth`) on the escapement bracket
      var pinionGeo = makeToothedGearGeometry(THREE, 0.11, 0.075, 0.02, 10, 0.038);
      var pinionGroup = new THREE.Group();
      pinionGroup.position.set(spec.gearOuter + 0.085, spec.collarY, 0);
      var pinionMesh = new THREE.Mesh(pinionGeo, mats.giltBrass);
      pinionMesh.rotation.x = -Math.PI / 2;
      pinionMesh.position.y = -0.019;
      pinionGroup.add(pinionMesh);
      group.add(pinionGroup);

      ringMesh.castShadow = (spec.idx === 0);
      ringMesh.receiveShadow = true;

      mergeStaticByMaterial(THREE, spinGroup, {
        interactiveList: ctx.interactables,
        castShadowMats: []
      });
      mergeStaticByMaterial(THREE, collarGroup, {
        interactiveList: ctx.interactables,
        skipNodes: [collarPip],
        castShadowMats: []
      });

      dynamicArmillarySubtrees.push(tiltWrap, collarGroup, pinionGroup);
      armillary.rings.push(spinGroup);
      armillary.collars.push(collarGroup);
      armillary.pinions.push({ group: pinionGroup, ratio: spec.teeth / 10 });
      armillary.gems.push({ gem: gem, pip: collarPip });
    });

    // Ornate Suspended Brass-Ringed Glass Projection Lens Apparatus mounted atop the Meridian Cradle
    // Spindle base sits atop cradle (y = 2.74 local -> 3.19 world)
    var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.048, 0.24, 16), mats.brass);
    spindle.position.set(0, 2.86, 0);
    group.add(spindle);

    var spindleCollar = new THREE.Mesh(new THREE.TorusGeometry(0.056, 0.015, 10, 20), mats.giltBrass);
    spindleCollar.rotation.x = Math.PI / 2;
    spindleCollar.position.set(0, 2.98, 0);
    group.add(spindleCollar);

    var lensApparatus = new THREE.Group();
    lensApparatus.position.set(0, 3.68, 3.2);
    lensApparatus.visible = armillary.solved;
    if (!armillary.solved) lensApparatus.scale.set(0.01, 0.01, 0.01);
    registerMachineryRoot(lensApparatus, 'ArmillaryLens');
    ctx.scene.add(lensApparatus);
    armillary.lensApparatus = lensApparatus;

    // Curved Brass Gimbal Yoke Arms embracing the elliptical glass lens
    var yokeBar = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.036, 0.038), mats.bronze);
    yokeBar.position.set(0, -0.25, 0);
    lensApparatus.add(yokeBar);

    var yokeStem = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 0.24, 12), mats.brass);
    yokeStem.position.set(0, -0.37, 0);
    lensApparatus.add(yokeStem);

    [-1.26, 1.26].forEach(function (yx) {
      var post = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.28, 12), mats.brass);
      post.position.set(yx, -0.12, 0);
      lensApparatus.add(post);

      var trunnion = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.068, 14), mats.giltBrass);
      trunnion.rotation.z = Math.PI / 2;
      trunnion.position.set(yx, 0, 0);
      lensApparatus.add(trunnion);
    });

    // Elliptical Bevelled Brass Lens Frame (exact 2:1 aspect matching 1024x512 calligraphy, zero rectangular corners!)
    var bezelWrap = new THREE.Group();
    bezelWrap.scale.set(2.20, 1.10, 1.0);
    lensApparatus.add(bezelWrap);

    var outerBrassRim = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.022, 14, 56), mats.giltBrass);
    bezelWrap.add(outerBrassRim);

    var innerBronzeRim = new THREE.Mesh(new THREE.TorusGeometry(0.536, 0.012, 10, 48), mats.bronze);
    bezelWrap.add(innerBronzeRim);

    // Translucent Sea-Glass Meniscus Disc inside the Brass Frame
    var glassGeo = THREE.CircleGeometry
      ? new THREE.CircleGeometry(0.54, 48)
      : new THREE.CylinderGeometry(0.54, 0.54, 0.008, 36);
    var glassDisc = new THREE.Mesh(glassGeo, mats.lensGlass);
    if (!THREE.CircleGeometry) glassDisc.rotation.x = Math.PI / 2;
    bezelWrap.add(glassDisc);

    // Calligraphic Optical Cipher Disc with Pure Radial Alpha Falloff (Zero Box Borders!)
    var cipherTex = makeLensCalligraphyTexture(THREE);
    var cipherMat = new THREE.MeshBasicMaterial({
      map: cipherTex,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var cipherGeo = THREE.CircleGeometry
      ? new THREE.CircleGeometry(0.545, 48)
      : new THREE.PlaneGeometry(1.08, 1.08);
    var cipherDisc = new THREE.Mesh(cipherGeo, cipherMat);
    cipherDisc.position.z = 0.008;
    bezelWrap.add(cipherDisc);

    var cipherDiscBack = new THREE.Mesh(cipherGeo, cipherMat);
    cipherDiscBack.rotation.y = Math.PI;
    cipherDiscBack.position.z = -0.008;
    bezelWrap.add(cipherDiscBack);
    armillary.lensInnerDisc = cipherDisc;

    // Top Crown Finial on the Elliptical Brass Lens
    var lensFinial = new THREE.Mesh(new THREE.OctahedronGeometry(0.055, 0), mats.goldGlow);
    lensFinial.position.set(0, 0.68, 0);
    lensApparatus.add(lensFinial);

    mergeStaticByMaterial(THREE, lensApparatus, {
      skipNodes: [glassDisc, cipherDisc, cipherDiscBack],
      castShadowMats: []
    });

    mergeStaticByMaterial(THREE, group, {
      interactiveList: ctx.interactables,
      skipNodes: dynamicArmillarySubtrees,
      castShadowMats: [mats.marble, mats.bronze]
    });

    // Custom Fresnel-Faded Golden Optical Sight-Line Beam (`ShaderMaterial`, open-ended cylinders fading at edges & ends!)
    var beamGroup = new THREE.Group();
    beamGroup.visible = armillary.solved;
    registerMachineryRoot(beamGroup, 'ArmillaryBeam');
    ctx.scene.add(beamGroup);
    armillary.beamGroup = beamGroup;

    var startPt = new THREE.Vector3(0, 2.13, 3.2);
    var endPt = new THREE.Vector3(0, 2.35, -24.0);
    var midPt = startPt.clone().add(endPt).multiplyScalar(0.5);
    var beamLen = startPt.distanceTo(endPt);

    var innerBeamMat = createFresnelBeamMaterial(THREE, 0xfffbeb, 0xfbbf24, 0.88, 2.3);
    var innerBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.095, beamLen, 28, 16, true),
      innerBeamMat
    );
    innerBeam.position.copy(midPt);
    innerBeam.lookAt(endPt);
    innerBeam.rotateX(Math.PI / 2);
    beamGroup.add(innerBeam);

    var outerBeamMat = createFresnelBeamMaterial(THREE, 0xfde68a, 0x38bdf8, 0.36, 3.1);
    var outerBeam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.36, beamLen, 28, 16, true),
      outerBeamMat
    );
    outerBeam.position.copy(midPt);
    outerBeam.lookAt(endPt);
    outerBeam.rotateX(Math.PI / 2);
    beamGroup.add(outerBeam);

    // Soft Radial Starlight Flare + Brass Astrolabe Target Ring above 1943 Cove Amphitheatre
    var coveFlareMat = new THREE.MeshBasicMaterial({
      map: mats.radialSpriteTex,
      color: 0xfef08a,
      transparent: true,
      opacity: 0.86,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    var coveFlare = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 2.1), coveFlareMat);
    coveFlare.position.copy(endPt);
    beamGroup.add(coveFlare);
    armillary.coveFlareSprite = coveFlare;

    var coveRing = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.022, 12, 36), mats.giltBrass);
    coveRing.position.copy(endPt);
    beamGroup.add(coveRing);
    armillary.coveTargetRing = coveRing;
  }

  function stepArmillaryRing(ringIdx, ctx) {
    if (ringIdx < 0 || ringIdx > 2) return;
    var mats = sharedMaterials;

    armillary.steps[ringIdx] = (armillary.steps[ringIdx] + 1) % 6;
    armillary.currentAngles[ringIdx] += Math.PI / 3;

    var alignedNow = armillary.steps[ringIdx] === 0;
    playGearRatchet(ctx, ringIdx, alignedNow);

    if (armillary.gems[ringIdx] && mats) {
      var targetMat = alignedNow ? mats.cyanGlow : mats.amberGem;
      armillary.gems[ringIdx].gem.material = targetMat;
      armillary.gems[ringIdx].pip.material = targetMat;
    }

    if (alignedNow) {
      emitStarlightMotes({ x: 0, y: 2.13, z: 3.2 }, 18, {
        spread: 0.55,
        upMin: 0.35,
        upMax: 0.95,
        outSpeed: 0.42,
        lifeMin: 0.7,
        lifeMax: 1.3,
        cyanMix: 0.55
      });
    }

    var allAligned = (
      armillary.steps[0] === 0 &&
      armillary.steps[1] === 0 &&
      armillary.steps[2] === 0
    );

    if (allAligned) {
      armillary.solved = true;
      armillary.revealMix = 0.02;
      if (armillary.beamGroup) armillary.beamGroup.visible = true;
      if (armillary.lensApparatus) armillary.lensApparatus.visible = true;
      playEquinoxHarmonicChord(ctx);

      emitStarlightMotes({ x: 0, y: 2.25, z: 3.2 }, 72, {
        spread: 0.85,
        upMin: 0.55,
        upMax: 1.85,
        outSpeed: 0.95,
        lifeMin: 1.0,
        lifeMax: 2.1,
        cyanMix: 0.38
      });

      var wasNew = markMachineSolved('armillary', ctx);
      notifyBanner(
        ctx,
        "🧭 Aegean Equinox Sight-Line Aligned! ΦΩΣ · INVERT ONLY AFTER THE TIME CLAUSE IN 'ONLY WHEN'",
        'solved'
      );
      if (wasNew) {
        notifyToast(
          ctx,
          '<div style="font-size:0.68rem;color:#fbbf24;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">🧭 Armillary Astrolabe Aligned</div>' +
          '<div style="font-size:1.0rem;font-weight:800;color:#fff;margin:0.12rem 0;">Aegean Equinox Optical Beam Ignited</div>' +
          '<div style="font-size:0.78rem;color:#7dd3fc;"><strong>ΦΩΣ ·</strong> Invert only after the subordinate time clause in <em>“Only when...”</em> — a golden optical sight-line now bridges Bourani Terrace and the 1943 Cove!</div>'
        );
      }
    } else {
      armillary.solved = false;
      armillary.revealMix = 0.0;
      if (armillary.beamGroup) armillary.beamGroup.visible = false;
      if (armillary.lensApparatus) {
        armillary.lensApparatus.visible = false;
        armillary.lensApparatus.scale.set(0.01, 0.01, 0.01);
      }
      var deg0 = (armillary.steps[0] * 60) % 360;
      var deg1 = (armillary.steps[1] * 60) % 360;
      var deg2 = (armillary.steps[2] * 60) % 360;
      notifyBanner(
        ctx,
        '🧭 Armillary Bearings — Ring I: ' + deg0 + '° · Ring II: ' + deg1 + '° · Ring III: ' + deg2 + '° (Align all three to 0° North Equinox)',
        'clue'
      );
    }
  }

  // --------------------------------------------------------------------------
  // 3. CONCHIS'S 3D LOGGIA HARPSICHORD PUZZLE (Bevelled Walnut, Turned Legs, Brass Hinges & Gilded Luthiers' Rose)
  // --------------------------------------------------------------------------
  function makeHarpsichordKeyTexture(THREE, noteLabel, numeral) {
    var can = document.createElement('canvas');
    can.width = 128;
    can.height = 256;
    var c = can.getContext('2d');

    var grad = c.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#efe3c8');
    grad.addColorStop(0.75, '#fbf6ea');
    grad.addColorStop(1, '#e2d1ae');
    c.fillStyle = grad;
    c.fillRect(0, 0, 128, 256);

    c.strokeStyle = '#92400e';
    c.lineWidth = 4;
    c.strokeRect(4, 4, 120, 248);

    c.strokeStyle = 'rgba(146, 64, 14, 0.45)';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(10, 148);
    c.lineTo(118, 148);
    c.moveTo(10, 155);
    c.lineTo(118, 155);
    c.stroke();

    c.textAlign = 'center';
    c.fillStyle = '#78350f';
    c.font = 'bold 18px Georgia, serif';
    c.fillText(numeral, 64, 188);

    c.fillStyle = '#1c1917';
    c.font = 'bold 34px Georgia, serif';
    c.fillText(noteLabel, 64, 230);

    return applyEncoding(THREE, new THREE.CanvasTexture(can));
  }

  function redrawHarpsichordPlaque() {
    if (!harpsichord.plaqueCanvas || !harpsichord.plaqueTex) return;
    var can = harpsichord.plaqueCanvas;
    var c = can.getContext('2d');
    var w = can.width;
    var h = can.height;

    var bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#fbf3dd');
    bg.addColorStop(0.5, '#f4e5c0');
    bg.addColorStop(1, '#e7cf9b');
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);

    c.strokeStyle = '#78350f';
    c.lineWidth = 5;
    c.strokeRect(10, 10, w - 20, h - 20);
    c.strokeStyle = '#b45309';
    c.lineWidth = 1.5;
    c.strokeRect(18, 18, w - 36, h - 36);

    c.textAlign = 'center';
    c.fillStyle = '#78350f';
    c.font = 'bold 20px Georgia, serif';
    c.fillText('BOURANI PRELUDE · M. CONCHIS', w * 0.5, 46);

    c.fillStyle = '#44403c';
    c.font = 'italic 15px Georgia, serif';
    c.fillText('“Strike the Dorian root, skip the second reed; climb third, fifth, and high octave.”', w * 0.5, 72);

    var staveTop = 94;
    var lineGap = 13;
    c.strokeStyle = 'rgba(68, 64, 60, 0.68)';
    c.lineWidth = 1.5;
    for (var l = 0; l < 5; l++) {
      var ly = staveTop + l * lineGap;
      c.beginPath();
      c.moveTo(58, ly);
      c.lineTo(w - 58, ly);
      c.stroke();
    }

    var motifVisuals = [
      { x: 135, y: staveTop + lineGap * 4.5, roman: 'I (Root)' },
      { x: 225, y: staveTop + lineGap * 3.5, roman: 'III' },
      { x: 315, y: staveTop + lineGap * 2.5, roman: 'V' },
      { x: 405, y: staveTop + lineGap * 1.0, roman: 'VIII (Octave)' }
    ];

    motifVisuals.forEach(function (n, idx) {
      var matched = harpsichord.solved || harpsichord.playedNotes[idx] === PRELUDE_MOTIF[idx];
      c.fillStyle = matched ? '#0284c7' : '#78350f';
      c.strokeStyle = matched ? '#0284c7' : '#451a03';
      c.lineWidth = 2.2;

      c.beginPath();
      c.moveTo(n.x, n.y - 7);
      c.lineTo(n.x + 9, n.y);
      c.lineTo(n.x, n.y + 7);
      c.lineTo(n.x - 9, n.y);
      c.closePath();
      c.fill();

      c.beginPath();
      c.moveTo(n.x + 8, n.y);
      c.lineTo(n.x + 8, n.y - 30);
      c.stroke();

      c.font = 'bold 13px Georgia, serif';
      c.fillText(n.roman, n.x, staveTop + lineGap * 4 + 34);
    });

    var seqText = harpsichord.solved
      ? '✓ COFFER UNSEALED: D4 — F4 — A4 — D5 (BOURANI MEDALLION REVEALED)'
      : 'RECENT NOTES: ' + (harpsichord.playedNotes.length ? harpsichord.playedNotes.join(' · ') : '— PLUCK KEYS BELOW —');
    c.fillStyle = harpsichord.solved ? '#065f46' : '#78350f';
    c.font = 'bold 14px Georgia, serif';
    c.fillText(seqText, w * 0.5, h - 28);

    harpsichord.plaqueTex.needsUpdate = true;
  }

  function buildHarpsichordContraption(THREE, mats, ctx) {
    var root = new THREE.Group();
    root.position.set(-3.8, 0.48, 15.2);
    root.rotation.y = Math.PI - 0.18;
    registerMachineryRoot(root, 'Harpsichord');
    ctx.scene.add(root);
    harpsichord.group = root;
    harpsichord.keys = [];
    harpsichord.playedNotes = [];
    harpsichord.solved = solvedSet.has('harpsichord');
    harpsichord.lidOpenProgress = harpsichord.solved ? 1.0 : 0.0;

    var inst = new THREE.Group();
    inst.position.set(0.55, 0, 1.25);
    root.add(inst);
    harpsichord.instGroup = inst;

    // 1. Multi-Tier Bevelled Walnut Wing Casework & Gilded Mouldings
    var wingShape = new THREE.Shape();
    wingShape.moveTo(-0.52, -0.34);
    wingShape.lineTo( 0.52, -0.34);
    wingShape.lineTo( 0.52,  0.04);
    wingShape.bezierCurveTo(0.50, 0.36, 0.16, 0.62, -0.18, 0.92);
    wingShape.lineTo(-0.52,  0.92);
    wingShape.closePath();

    // Lower bevelled base skirting moulding
    var skirtGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.026,
      bevelEnabled: true,
      bevelSegments: 3,
      steps: 1,
      bevelSize: 0.022,
      bevelThickness: 0.014
    });
    var skirtMesh = new THREE.Mesh(skirtGeo, mats.giltBrass);
    skirtMesh.rotation.x = -Math.PI / 2;
    skirtMesh.position.set(0, 0.725, 0.06);
    inst.add(skirtMesh);

    // Main bevelled walnut soundbox case
    var caseGeo = new THREE.ExtrudeGeometry(wingShape, {
      depth: 0.19,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.016,
      bevelThickness: 0.016
    });
    var caseMesh = new THREE.Mesh(caseGeo, mats.walnut);
    caseMesh.rotation.x = -Math.PI / 2;
    caseMesh.position.set(0, 0.745, 0.06);
    inst.add(caseMesh);

    // Upper gilded brass cap-rail trim along spine & tail
    var spineCapRail = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.022, 1.28), mats.giltBrass);
    spineCapRail.position.set(-0.52, 0.96, -0.22);
    inst.add(spineCapRail);

    // Articulated Brass Lid Strap Hinges along the left spine (3 barrel knuckles + scalloped strap plates)
    [-0.02, -0.36, -0.68].forEach(function (hz) {
      var knuckle = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.085, 12), mats.giltBrass);
      knuckle.rotation.x = Math.PI / 2;
      knuckle.position.set(-0.535, 0.958, hz);
      inst.add(knuckle);

      var strap = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.032), mats.giltBrass);
      strap.position.set(-0.46, 0.962, hz);
      inst.add(strap);

      var finialStud = new THREE.Mesh(new THREE.SphereGeometry(0.010, 8, 8), mats.giltBrass);
      finialStud.position.set(-0.40, 0.968, hz);
      inst.add(finialStud);
    });

    // Golden Spruce Soundboard Deck + Curved Acoustic Bridge + Pierced Gilded Luthiers' Rose Ornament
    var sbShape = new THREE.Shape();
    sbShape.moveTo(-0.46, -0.06);
    sbShape.lineTo( 0.46, -0.06);
    sbShape.bezierCurveTo(0.44, 0.28, 0.12, 0.55, -0.18, 0.84);
    sbShape.lineTo(-0.46,  0.84);
    sbShape.closePath();

    var sbGeo = new THREE.ExtrudeGeometry(sbShape, { depth: 0.018, bevelEnabled: false });
    var soundboard = new THREE.Mesh(sbGeo, mats.spruce);
    soundboard.rotation.x = -Math.PI / 2;
    soundboard.position.set(0, 0.94, 0.06);
    inst.add(soundboard);

    // Pierced Gilded Luthiers' Rose Soundboard Medallion
    var roseAnchor = new THREE.Group();
    roseAnchor.position.set(-0.24, 0.962, -0.26);
    inst.add(roseAnchor);
    harpsichord.roseAnchor = roseAnchor;

    var roseDiscGeo = THREE.CircleGeometry
      ? new THREE.CircleGeometry(0.105, 32)
      : new THREE.CylinderGeometry(0.105, 0.105, 0.004, 28);
    var roseDisc = new THREE.Mesh(roseDiscGeo, mats.roseOrnament);
    roseDisc.rotation.x = THREE.CircleGeometry ? -Math.PI / 2 : 0;
    roseAnchor.add(roseDisc);

    var roseBezel = new THREE.Mesh(new THREE.TorusGeometry(0.106, 0.011, 10, 32), mats.giltBrass);
    roseBezel.rotation.x = Math.PI / 2;
    roseAnchor.add(roseBezel);

    // Curved walnut acoustic soundboard bridge & stretched brass strings
    var bridgeRail = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.018, 0.022), mats.walnut);
    bridgeRail.position.set(-0.08, 0.964, -0.18);
    bridgeRail.rotation.y = 0.42;
    inst.add(bridgeRail);

    for (var st = 0; st < 8; st++) {
      var sx = -0.40 + st * 0.105;
      var sLen = 0.74 - st * 0.065;
      var strMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, sLen, 6), mats.giltBrass);
      strMesh.rotation.x = Math.PI / 2;
      strMesh.position.set(sx, 0.968, -0.02 - sLen * 0.44);
      inst.add(strMesh);
    }

    // Four Turned Baroque Baluster Legs (`LatheGeometry`) + Stretcher Frame + Brass Sabots
    var balusterGeo = makeTurnedBalusterGeometry(THREE);
    var legCoords = [
      [-0.45,  0.30],
      [ 0.45,  0.30],
      [-0.44, -0.74],
      [ 0.08, -0.52]
    ];
    legCoords.forEach(function (pt) {
      var leg = new THREE.Mesh(balusterGeo, mats.walnut);
      leg.position.set(pt[0], 0.02, pt[1]);
      inst.add(leg);

      var sabot = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.035, 0.065, 14), mats.giltBrass);
      sabot.position.set(pt[0], 0.032, pt[1]);
      inst.add(sabot);

      var neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.040, 0.009, 10, 20), mats.giltBrass);
      neckRing.rotation.x = Math.PI / 2;
      neckRing.position.set(pt[0], 0.60, pt[1]);
      inst.add(neckRing);
    });

    // Turned Walnut Stretcher Rails uniting the legs
    var frontStretcher = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.90, 12), mats.walnut);
    frontStretcher.rotation.z = Math.PI / 2;
    frontStretcher.position.set(0, 0.22, 0.30);
    inst.add(frontStretcher);

    var spineStretcher = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.04, 12), mats.walnut);
    spineStretcher.rotation.x = Math.PI / 2;
    spineStretcher.position.set(-0.445, 0.22, -0.22);
    inst.add(spineStretcher);

    // Recessed Front Keywell, Bevelled Cheek Blocks & Brass Nameboard
    var keybed = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.04, 0.34), mats.ebony);
    keybed.position.set(0, 0.855, 0.24);
    inst.add(keybed);

    [-0.49, 0.49].forEach(function (cx) {
      var cheek = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.115, 0.36), mats.walnut);
      cheek.position.set(cx, 0.905, 0.24);
      inst.add(cheek);

      var cheekTrim = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.016, 0.365), mats.giltBrass);
      cheekTrim.position.set(cx, 0.966, 0.24);
      inst.add(cheekTrim);
    });

    var nameboard = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.09, 0.05), mats.brass);
    nameboard.position.set(0, 0.935, 0.06);
    inst.add(nameboard);

    // 2. Five Individually Clickable 3D Keys (D4, E4, F4, A4, D5)
    HARPSICHORD_KEYS_DEF.forEach(function (kDef) {
      var pivot = new THREE.Group();
      pivot.position.set(kDef.x, 0.90, 0.10);
      inst.add(pivot);

      var keyTex = makeHarpsichordKeyTexture(THREE, kDef.note, kDef.numeral);
      var keyMat = new THREE.MeshStandardMaterial({
        map: keyTex,
        roughness: 0.24,
        metalness: 0.08
      });

      var keyMesh = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.046, 0.31), keyMat);
      keyMesh.position.set(0, 0, 0.155);
      keyMesh.userData = {
        interactType: 'machinery',
        machineId: 'harpsichord_key',
        keyIdx: kDef.idx,
        note: kDef.note,
        freq: kDef.freq
      };
      pivot.add(keyMesh);
      ctx.interactables.push(keyMesh);

      var keyHit = new THREE.Mesh(new THREE.BoxGeometry(0.152, 0.10, 0.33), mats.invisibleHit);
      keyHit.position.set(0, 0.025, 0.155);
      keyHit.userData = {
        interactType: 'machinery',
        machineId: 'harpsichord_key',
        keyIdx: kDef.idx,
        note: kDef.note,
        freq: kDef.freq
      };
      pivot.add(keyHit);
      ctx.interactables.push(keyHit);

      harpsichord.keys.push({
        def: kDef,
        pivot: pivot,
        mesh: keyMesh,
        press: 0
      });
    });

    [-0.255, 0.085, 0.255].forEach(function (bx) {
      var sharp = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.052, 0.15), mats.ebony);
      sharp.position.set(bx, 0.932, 0.165);
      inst.add(sharp);
    });

    // 3. Bevelled Walnut & Brass Music Stand with Hinged Support Prop
    var standGroup = new THREE.Group();
    standGroup.position.set(0, 1.155, 0.02);
    standGroup.rotation.x = 0.30;
    inst.add(standGroup);

    var backing = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.38, 0.026), mats.walnut);
    standGroup.add(backing);

    var frameRim = new THREE.Mesh(new THREE.BoxGeometry(0.80, 0.41, 0.018), mats.giltBrass);
    frameRim.position.z = -0.006;
    standGroup.add(frameRim);

    [-0.24, 0.24].forEach(function (hx) {
      var deskHinge = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.010, 0.06, 10), mats.giltBrass);
      deskHinge.rotation.z = Math.PI / 2;
      deskHinge.position.set(hx, -0.20, 0.01);
      standGroup.add(deskHinge);
    });

    var plaqueCanvas = document.createElement('canvas');
    plaqueCanvas.width = 512;
    plaqueCanvas.height = 256;
    var plaqueTex = applyEncoding(THREE, new THREE.CanvasTexture(plaqueCanvas));
    harpsichord.plaqueCanvas = plaqueCanvas;
    harpsichord.plaqueTex = plaqueTex;
    redrawHarpsichordPlaque();

    var plaqueMat = new THREE.MeshStandardMaterial({
      map: plaqueTex,
      roughness: 0.40,
      metalness: 0.06
    });
    var plaqueMesh = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.35), plaqueMat);
    plaqueMesh.position.z = 0.016;
    plaqueMesh.userData = {
      interactType: 'machinery',
      machineId: 'harpsichord_plaque'
    };
    standGroup.add(plaqueMesh);
    ctx.interactables.push(plaqueMesh);

    // 4. Secret Brass Lid Compartment, Hinged Track & Glowing Bourani Medallion
    var cofferGroup = new THREE.Group();
    cofferGroup.position.set(0.12, 0.965, -0.35);
    inst.add(cofferGroup);
    harpsichord.cofferAnchor = cofferGroup;

    var cofferRim = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.34), mats.bronze);
    cofferGroup.add(cofferRim);

    var velvetBed = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.062, 0.28), mats.velvet);
    cofferGroup.add(velvetBed);

    // Sliding Bevelled Brass Compartment Lid + Finial Knob
    var lidGroup = new THREE.Group();
    lidGroup.position.set(harpsichord.lidOpenProgress * 0.32, 0.038, 0);
    cofferGroup.add(lidGroup);
    harpsichord.lidMesh = lidGroup;

    var lidPlate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.024, 0.33), mats.giltBrass);
    lidGroup.add(lidPlate);

    var lidKnob = new THREE.Mesh(new THREE.SphereGeometry(0.020, 12, 10), mats.bronze);
    lidKnob.position.set(-0.12, 0.022, 0);
    lidGroup.add(lidKnob);

    // Glowing Bourani Medallion rising from the secret compartment when solved
    var medGroup = new THREE.Group();
    medGroup.position.set(0, harpsichord.solved ? 0.34 : 0.01, 0);
    medGroup.visible = harpsichord.solved;
    cofferGroup.add(medGroup);
    harpsichord.medallionGroup = medGroup;

    var medDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.026, 28), mats.goldGlow);
    medDisc.rotation.x = Math.PI / 2;
    medDisc.visible = harpsichord.solved;
    medDisc.userData = {
      interactType: 'machinery',
      machineId: 'bourani_medallion'
    };
    medGroup.add(medDisc);
    ctx.interactables.push(medDisc);
    harpsichord.medallionDisc = medDisc;

    var medRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.016, 12, 32), mats.giltBrass);
    medGroup.add(medRing);

    var medBar = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.24, 0.030), mats.cyanGlow);
    medGroup.add(medBar);

    // Soft Radial Glow Halo behind Bourani Medallion (using radial sprite texture — zero hard edges!)
    var medHalo = new THREE.Mesh(
      new THREE.PlaneGeometry(0.58, 0.58),
      new THREE.MeshBasicMaterial({
        map: sharedMaterials.radialSpriteTex,
        color: 0xfde68a,
        transparent: true,
        opacity: 0.68,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide
      })
    );
    medGroup.add(medHalo);
    harpsichord.medallionHalo = medHalo;

    setShadows(inst, false, true);
    var dynamicHarpsichordSubtrees = [lidGroup, medGroup];
    for (var kp = 0; kp < harpsichord.keys.length; kp++) {
      dynamicHarpsichordSubtrees.push(harpsichord.keys[kp].pivot);
    }
    mergeStaticByMaterial(THREE, inst, {
      interactiveList: ctx.interactables,
      skipNodes: dynamicHarpsichordSubtrees,
      castShadowMats: [mats.walnut]
    });
  }

  function pressHarpsichordKey(keyIdx, ctx) {
    var kObj = harpsichord.keys[keyIdx];
    if (!kObj) return;
    var THREE = (ctx && ctx.THREE) || (typeof window !== 'undefined' ? window.THREE : null);

    kObj.press = 1.0;
    pluckChamberHarpsichord(ctx, kObj.def.freq, 0);

    // Delicate golden acoustic shimmer rising from the gilded Luthiers' Rose on every plucked note
    if (THREE && harpsichord.roseAnchor) {
      var rosePos = getWorldCoords(THREE, harpsichord.roseAnchor, -4.1, 1.44, 14.1);
      emitStarlightMotes(rosePos, 10, {
        spread: 0.14,
        upMin: 0.28,
        upMax: 0.72,
        outSpeed: 0.22,
        lifeMin: 0.65,
        lifeMax: 1.25,
        cyanMix: 0.18
      });
    }

    harpsichord.playedNotes.push(kObj.def.note);
    if (harpsichord.playedNotes.length > 4) {
      harpsichord.playedNotes.shift();
    }

    var isMatch = (
      harpsichord.playedNotes.length === 4 &&
      harpsichord.playedNotes[0] === PRELUDE_MOTIF[0] &&
      harpsichord.playedNotes[1] === PRELUDE_MOTIF[1] &&
      harpsichord.playedNotes[2] === PRELUDE_MOTIF[2] &&
      harpsichord.playedNotes[3] === PRELUDE_MOTIF[3]
    );

    if (isMatch) {
      var wasFirst = !harpsichord.solved;
      harpsichord.solved = true;
      if (harpsichord.medallionGroup) harpsichord.medallionGroup.visible = true;
      if (harpsichord.medallionDisc) harpsichord.medallionDisc.visible = true;
      redrawHarpsichordPlaque();
      playCofferUnlockFlourish(ctx);

      if (THREE && harpsichord.cofferAnchor) {
        var cofferPos = getWorldCoords(THREE, harpsichord.cofferAnchor, -3.95, 1.50, 14.2);
        emitStarlightMotes(cofferPos, 64, {
          spread: 0.28,
          upMin: 0.55,
          upMax: 1.65,
          outSpeed: 0.68,
          lifeMin: 0.95,
          lifeMax: 1.95,
          cyanMix: 0.32
        });
      }

      var newlyRecorded = markMachineSolved('harpsichord', ctx);
      notifyBanner(
        ctx,
        '🎶 Bourani Prelude (D4 · F4 · A4 · D5) Completed — Secret Brass Compartment Unsealed!',
        'solved'
      );

      if (wasFirst || newlyRecorded) {
        notifyToast(
          ctx,
          '<div style="font-size:0.68rem;color:#fbbf24;text-transform:uppercase;letter-spacing:0.12em;font-weight:800;">🎶 Conchis’s Loggia Harpsichord Unsealed</div>' +
          '<div style="font-size:1.0rem;font-weight:800;color:#fff;margin:0.12rem 0;">The Bourani Medallion Revealed</div>' +
          '<div style="font-size:0.78rem;color:#fef3c7;"><em>“No sooner had the harpsichord played than the masque began.”</em> — Conchis’s secret brass coffer slides open before Villa Bourani!</div>'
        );
      }
    } else {
      redrawHarpsichordPlaque();
      notifyBanner(
        ctx,
        '🎹 Plucked ' + kObj.def.note + ' — Recent sequence: ' + harpsichord.playedNotes.join(' → ') + ' (Bourani Prelude seeks Root · III · V · Octave)',
        'clue'
      );
    }
  }

  // --------------------------------------------------------------------------
  // Public Shared Contract (window.PhraxosMachinery)
  // --------------------------------------------------------------------------
  function init(ctx) {
    if (!ctx || !ctx.scene) return;
    var THREE = ctx.THREE || (typeof window !== 'undefined' ? window.THREE : null);
    if (!THREE) return;

    savedCtx = ctx;
    if (initialized) return;
    initialized = true;

    loadSolvedState();
    var mats = buildSharedMaterials(THREE);
    initParticlePool(THREE, mats, ctx);

    // 1. Two Diegetic 3D Myst Linking Books
    buildLinkingLectern(THREE, mats, ctx, {
      bookIdx: 0,
      name: 'Villa Bourani Portico Lectern',
      x: 3.6,
      y: 0.48,
      z: 15.2,
      rotY: Math.PI + 0.18,
      localX: -0.45,
      localZ: 1.05,
      initialTargetId: 2
    });

    buildLinkingLectern(THREE, mats, ctx, {
      bookIdx: 1,
      name: 'Parnassus Sanctuary Lectern',
      x: -4.2,
      y: 0.48,
      z: -87.0,
      rotY: 0.72,
      localX: 0,
      localZ: 0,
      initialTargetId: 0
    });

    // 2. Interactive 3D Rotating Armillary Astrolabe & Spyglass Optical Beam (0, 0.45, 3.2)
    buildArmillaryContraption(THREE, mats, ctx);

    // 3. Conchis's 3D Loggia Harpsichord Puzzle (-3.8, 0.48, 15.2)
    buildHarpsichordContraption(THREE, mats, ctx);

    ctx.machineryGroups = rootSceneObjects;
  }

  function update(dt, now, ctx) {
    if (!initialized) return;
    var activeCtx = ctx || savedCtx;
    var safeDt = Math.min(Math.max(dt || 0.016, 0.001), 0.1);
    var tSec = (now || 0) * 0.001;
    var hasPlayer = !!(activeCtx && activeCtx.player && typeof activeCtx.player.z === 'number');
    var playerZ = hasPlayer ? activeCtx.player.z : 99999;

    // Update burst particle pool ONLY when active burst particles exist (activeCount > 0)
    if (particleSystem.activeCount > 0) {
      updateParticlePool(safeDt, tSec);
    }

    // 1. Distance-culled Linking Book Panel refresh (< 13.0m & throttled to 12 fps / 83.3ms)
    for (var b = 0; b < linkingBooks.length; b++) {
      var bk = linkingBooks[b];
      var distZ = Math.abs(playerZ - bk.worldZ);
      if (distZ < 28.0 && bk.crystal) {
        bk.crystal.rotation.y += safeDt * 1.35;
        bk.crystal.position.y = 0.22 + Math.sin(tSec * 2.5 + b * 1.7) * 0.022;
      }
      if (distZ < 13.0) {
        bk.drawAccumMs += safeDt * 1000.0;
        if (bk.drawAccumMs >= 83.3) {
          bk.drawAccumMs = 0;
          drawLinkingRightPage(bk, tSec + b * 2.1);
        }
      }
    }

    // Animate Myst Linking Vignette & FOV Warp
    if (linkWarpState.active) {
      linkWarpState.elapsed += safeDt;
      var p = Math.min(1.0, linkWarpState.elapsed / linkWarpState.duration);
      var arch = Math.sin(p * Math.PI);

      if (linkWarpState.overlayEl) {
        linkWarpState.overlayEl.style.opacity = (arch * 0.92).toFixed(3);
      }
      if (activeCtx && activeCtx.camera) {
        activeCtx.camera.fov = linkWarpState.baseFov + arch * 13.5;
        activeCtx.camera.updateProjectionMatrix();
      }
      if (!linkWarpState.teleported && p >= 0.42) {
        linkWarpState.teleported = true;
        if (activeCtx && typeof activeCtx.teleportToAltar === 'function') {
          activeCtx.teleportToAltar(linkWarpState.targetAltarId);
        }
      }
      if (p >= 1.0) {
        linkWarpState.active = false;
        if (linkWarpState.overlayEl) {
          linkWarpState.overlayEl.style.opacity = '0';
        }
        if (activeCtx && activeCtx.camera) {
          activeCtx.camera.fov = linkWarpState.baseFov;
          activeCtx.camera.updateProjectionMatrix();
        }
      }
    }

    // 2. Smoothly ease Armillary 60-degree rings, meshed toothed gears, Fresnel beam & suspended brass lens
    var nearArmillary = !hasPlayer || Math.abs(playerZ - 3.2) < 48.0;
    for (var r = 0; r < armillary.rings.length; r++) {
      var ringGrp = armillary.rings[r];
      var diff = armillary.currentAngles[r] - ringGrp.rotation.y;
      if (Math.abs(diff) > 0.0004) {
        ringGrp.rotation.y += diff * Math.min(1.0, safeDt * 11.5);
        if (armillary.collars[r]) {
          armillary.collars[r].rotation.y = ringGrp.rotation.y;
        }
        if (armillary.pinions[r]) {
          armillary.pinions[r].group.rotation.y = -ringGrp.rotation.y * armillary.pinions[r].ratio;
        }
      }
    }

    if (armillary.solved && (nearArmillary || armillary.revealMix < 1.0)) {
      armillary.pulsePhase += safeDt * 3.0;
      if (armillary.revealMix < 1.0) {
        armillary.revealMix = Math.min(1.0, armillary.revealMix + safeDt * 1.15);
      }
      var easeLens = 1 - Math.pow(1 - armillary.revealMix, 3);

      for (var u = 0; u < armillary.beamUniformsList.length; u++) {
        armillary.beamUniformsList[u].uTime.value = tSec;
        armillary.beamUniformsList[u].uReveal.value = armillary.revealMix;
      }

      if (armillary.coveFlareSprite && activeCtx && activeCtx.player) {
        var flareScale = (0.85 + 0.18 * Math.sin(tSec * 2.8)) * easeLens;
        armillary.coveFlareSprite.scale.set(flareScale, flareScale, 1);
        armillary.coveFlareSprite.rotation.y = Math.atan2(
          activeCtx.player.x - 0,
          activeCtx.player.z - (-24.0)
        );
      }
      if (armillary.coveTargetRing) {
        armillary.coveTargetRing.rotation.y += safeDt * 1.2;
        armillary.coveTargetRing.rotation.x = Math.sin(tSec * 1.6) * 0.35;
      }

      if (armillary.lensApparatus) {
        var sVal = Math.max(0.01, easeLens);
        armillary.lensApparatus.scale.set(sVal, sVal, sVal);
        armillary.lensApparatus.position.y = 3.68 + Math.sin(tSec * 1.8) * 0.032;
        if (activeCtx && activeCtx.player) {
          armillary.lensApparatus.rotation.y = Math.atan2(
            activeCtx.player.x - 0,
            activeCtx.player.z - 3.2
          );
        }
      }
    }

    // 3. Animate Harpsichord 3D Key Return, Secret Coffer Lid Slide & Bourani Medallion
    var nearHarpsichord = !hasPlayer || Math.abs(playerZ - 14.1) < 38.0;
    for (var k = 0; k < harpsichord.keys.length; k++) {
      var kState = harpsichord.keys[k];
      if (kState.press > 0.001) {
        kState.press = Math.max(0, kState.press - safeDt * 4.2);
        kState.pivot.rotation.x = kState.press * 0.085;
        kState.pivot.position.y = 0.90 - kState.press * 0.016;
      } else if (kState.pivot.rotation.x !== 0) {
        kState.pivot.rotation.x = 0;
        kState.pivot.position.y = 0.90;
      }
    }

    if (harpsichord.solved && (nearHarpsichord || harpsichord.lidOpenProgress < 1.0)) {
      if (harpsichord.lidOpenProgress < 1.0) {
        harpsichord.lidOpenProgress = Math.min(1.0, harpsichord.lidOpenProgress + safeDt * 1.65);
        var ease = 1 - Math.pow(1 - harpsichord.lidOpenProgress, 3);
        if (harpsichord.lidMesh) {
          harpsichord.lidMesh.position.x = ease * 0.32;
        }
      }
      if (harpsichord.medallionGroup) {
        var targetMedY = 0.34 + Math.sin(tSec * 2.3) * 0.03;
        harpsichord.medallionGroup.position.y += (targetMedY - harpsichord.medallionGroup.position.y) * Math.min(1.0, safeDt * 4.5);
        harpsichord.medallionGroup.rotation.y += safeDt * 1.25;
      }
      if (harpsichord.medallionHalo) {
        harpsichord.medallionHalo.material.opacity = 0.52 + 0.20 * Math.sin(tSec * 3.4);
      }
    }
  }

  function unwrapUserData(input) {
    if (!input) return null;
    if (input.interactType === 'machinery') return input;
    if (input.object && input.object.userData && input.object.userData.interactType === 'machinery') {
      return input.object.userData;
    }
    return input;
  }

  function getHoverLabel(userData, ctx) {
    var data = unwrapUserData(userData);
    if (!data || data.interactType !== 'machinery') return '';

    if (data.machineId === 'linking_panel') {
      var bk = linkingBooks[data.bookIdx] || linkingBooks[0];
      if (!bk) return '📘 Click Linking Panel to travel';
      var dest = LINK_DESTINATIONS[bk.targetId];
      return '📘 Touch Linking Panel → Link to ' + dest.act + ': ' + dest.title;
    }

    if (data.machineId === 'linking_tab') {
      var bkTab = linkingBooks[data.bookIdx] || linkingBooks[0];
      if (!bkTab) return '🔖 Click Brass Tab to cycle destination Headland';
      var nextDest = LINK_DESTINATIONS[(bkTab.targetId + 1) % LINK_DESTINATIONS.length];
      return '🔖 Turn Brass Index Tab → Switch Destination to ' + nextDest.act + ' (' + nextDest.shortName + ')';
    }

    if (data.machineId === 'armillary_ring') {
      var rIdx = data.ringIdx || 0;
      var deg = ((armillary.steps[rIdx] || 0) * 60) % 360;
      var rName = armillary.ringNames[rIdx] || 'Brass Ring';
      if (deg === 0) {
        return '🧭 ' + rName + ' (✓ 0° Equinox Aligned) — Click to step +60°';
      }
      return '🧭 ' + rName + ' (' + deg + '°) — Click to step +60° toward 0° Equinox';
    }

    if (data.machineId === 'harpsichord_key') {
      return '🎹 Pluck Harpsichord Key ' + data.note + ' (Bourani Prelude)';
    }

    if (data.machineId === 'harpsichord_plaque') {
      return '🎼 Read Bourani Prelude Score: “Root (D4) · Minor Third (F4) · Fifth (A4) · Octave (D5)”';
    }

    if (data.machineId === 'bourani_medallion') {
      return '🏅 Inspect Conchis’s Bourani Medallion';
    }

    return '';
  }

  function handleInteract(userData, hit, ctx) {
    var activeCtx = ctx;
    if (!activeCtx && hit && (hit.THREE || hit.scene || hit.teleportToAltar)) {
      activeCtx = hit;
    }
    if (!activeCtx) activeCtx = savedCtx;

    var data = unwrapUserData(userData) || unwrapUserData(hit);
    if (!data || data.interactType !== 'machinery') return false;

    if (data.machineId === 'linking_tab') {
      var bkTab = linkingBooks[data.bookIdx];
      if (!bkTab) return false;
      var THREE = (activeCtx && activeCtx.THREE) || (typeof window !== 'undefined' ? window.THREE : null);
      bkTab.targetId = (bkTab.targetId + 1) % LINK_DESTINATIONS.length;
      bkTab.drawAccumMs = 0;
      drawLinkingLeftPage(bkTab);
      drawLinkingRightPage(bkTab, (typeof performance !== 'undefined' ? performance.now() : 0) * 0.001);
      playBookPageTurn(activeCtx, bkTab.targetId);
      if (THREE && bkTab.crystal) {
        var pagePos = getWorldCoords(THREE, bkTab.crystal, bkTab.worldX, 1.72, bkTab.worldZ);
        emitStarlightMotes(pagePos, 14, {
          spread: 0.22,
          upMin: 0.25,
          upMax: 0.65,
          outSpeed: 0.25,
          lifeMin: 0.6,
          lifeMax: 1.1,
          cyanMix: 0.35
        });
      }
      var dest = LINK_DESTINATIONS[bkTab.targetId];
      notifyBanner(
        activeCtx,
        '🔖 Linking Book set to ' + dest.act + ' · ' + dest.title + ' — Touch the glowing right-hand panel to link!',
        'clue'
      );
      return true;
    }

    if (data.machineId === 'linking_panel') {
      var bk = linkingBooks[data.bookIdx];
      if (!bk) return false;
      triggerMystLink(bk, activeCtx);
      return true;
    }

    if (data.machineId === 'armillary_ring') {
      stepArmillaryRing(typeof data.ringIdx === 'number' ? data.ringIdx : 0, activeCtx);
      return true;
    }

    if (data.machineId === 'harpsichord_key') {
      pressHarpsichordKey(typeof data.keyIdx === 'number' ? data.keyIdx : 0, activeCtx);
      return true;
    }

    if (data.machineId === 'harpsichord_plaque') {
      playBookPageTurn(activeCtx, 0);
      notifyBanner(
        activeCtx,
        '🎼 Bourani Prelude Score: “From the Dorian root (D4), skip the second reed; climb the minor third (F4), the fifth (A4), and crown the octave (D5).”',
        'clue'
      );
      return true;
    }

    if (data.machineId === 'bourani_medallion') {
      playCofferUnlockFlourish(activeCtx);
      notifyBanner(
        activeCtx,
        '🏅 The Bourani Medallion — Engraved Φ: “No sooner had the harpsichord played than the masque began.”',
        'solved'
      );
      return true;
    }

    return false;
  }

  function getSolvedMachines() {
    return Array.from(solvedSet);
  }

  function getRootGroups() {
    return rootSceneObjects.slice();
  }

  var api = {
    init: init,
    update: update,
    getHoverLabel: getHoverLabel,
    handleInteract: handleInteract,
    getSolvedMachines: getSolvedMachines,
    getRootGroups: getRootGroups,
    onMachineSolved: null
  };

  if (typeof window !== 'undefined') {
    window.PhraxosMachinery = api;
  }
})();
