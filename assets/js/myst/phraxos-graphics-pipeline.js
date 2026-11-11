// ============================================================================
// PHRAXOS GRAPHICS PIPELINE, STATIC SCENE BATCHER, PMREM & COVE CAÏQUE REMASTER
// Self-Contained Classic Browser Script (file:// & https:// safe, zero ES modules)
// Exposes window.PhraxosGraphics:
//   - init(ctx)
//   - finalizeStaticBatching(ctx)
//   - update(dt, now, ctx)
//   - render(ctx, dt, now)
//   - onResize(ctx)
//   - onLightingChange(mode, ctx)
//   - setQualityMode(mode, ctx) / cycleQualityMode(ctx) / getQualityMode()
// ============================================================================
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Mode Presets: 0 = Aegean Noon, 1 = Firelit Bourani Dusk, 2 = Moonlit Masque
  // --------------------------------------------------------------------------
  var MODE_PRESETS = [
    {
      // 0: Crisp Sunlit Cycladic Limestone & Azure Sea
      exposure: 0.78,
      bloomStrength: 0.16,
      bloomThreshold: 1.08,
      shadowTint: [0.95, 0.98, 1.04],
      midTint: [1.00, 1.00, 1.01],
      highlightTint: [1.01, 0.99, 0.96],
      saturation: 1.06,
      contrast: 1.02,
      sunDir: [-0.35, 0.75, -0.55],
      pmremSkyTop: 0x0a3d7a,
      pmremSkyMid: 0x3b95d4,
      pmremHorizon: 0xfef3c7,
      pmremSeaBounce: 0x168aad,
      pmremStoneBounce: 0xe6d5b8,
      pmremSunCol: 0xfff8e1,
      pmremDomeScale: 0.36,
      pmremSunIntensity: 2.05,
      pmremFireIntensity: 0.30,
      lanternLightIntensity: 0.35,
      lanternGlowOpacity: 0.46
    },
    {
      // 1: Warm Golden-Amber Dusk & Deep Cobalt Shadows
      exposure: 0.84,
      bloomStrength: 0.20,
      bloomThreshold: 1.04,
      shadowTint: [0.93, 0.96, 1.06],
      midTint: [1.02, 0.99, 0.97],
      highlightTint: [1.04, 0.99, 0.92],
      saturation: 1.07,
      contrast: 1.03,
      sunDir: [-0.38, 0.28, -0.88],
      pmremSkyTop: 0x09152b,
      pmremSkyMid: 0x4c284e,
      pmremHorizon: 0xf97316,
      pmremSeaBounce: 0x134e63,
      pmremStoneBounce: 0xd99b56,
      pmremSunCol: 0xfdba74,
      pmremDomeScale: 0.34,
      pmremSunIntensity: 1.85,
      pmremFireIntensity: 1.05,
      lanternLightIntensity: 0.92,
      lanternGlowOpacity: 0.86
    },
    {
      // 2: Silvery Moonlit Marble & Warm Torch Contrast
      exposure: 0.92,
      bloomStrength: 0.24,
      bloomThreshold: 0.96,
      shadowTint: [0.91, 0.96, 1.09],
      midTint: [0.96, 0.99, 1.05],
      highlightTint: [1.03, 1.00, 0.95],
      saturation: 1.05,
      contrast: 1.04,
      sunDir: [-0.25, 0.45, -0.85],
      pmremSkyTop: 0x030712,
      pmremSkyMid: 0x0f172a,
      pmremHorizon: 0x1e293b,
      pmremSeaBounce: 0x0a2740,
      pmremStoneBounce: 0x5c4b3c,
      pmremSunCol: 0xbfdbfe,
      pmremDomeScale: 0.26,
      pmremSunIntensity: 1.40,
      pmremFireIntensity: 1.35,
      lanternLightIntensity: 1.25,
      lanternGlowOpacity: 0.98
    }
  ];

  // --------------------------------------------------------------------------
  // Internal State
  // --------------------------------------------------------------------------
  var initialized = false;
  var boundScene = null;
  var latestCtxRef = null;
  var pipelineReady = false;
  var pipelineFailed = false;
  var pipelineTier = 'uninitialized';

  // Quality Modes: 'auto' (⚡ 60fps 2-pass RGBA8), 'lite' (🪶 0-pass direct), 'ultra' (✨ 16F multi-pass)
  var qualityMode = 'auto';
  var isIntegratedGPU = false;
  var gpuRendererString = '';
  var canHalfFloatGlobal = false;
  var canByteRTGlobal = false;
  var gpuProbed = false;

  // Auto-FPS Render-Scale Governor (steps to 0.85x in 'auto' if rolling frame time > 20ms)
  var governorScale = 1.0;
  var effectiveDPR = 1.0;
  var rollingFrameMs = 16.6;
  var slowFrameStreak = 0;
  var fastFrameStreak = 0;
  var governorWarmupFrames = 20;
  var lastRenderStampMs = 0;

  var currentMode = 1;
  var gradeState = {
    exposure: MODE_PRESETS[1].exposure,
    bloomStrength: MODE_PRESETS[1].bloomStrength,
    bloomThreshold: MODE_PRESETS[1].bloomThreshold,
    shadowTint: MODE_PRESETS[1].shadowTint.slice(),
    midTint: MODE_PRESETS[1].midTint.slice(),
    highlightTint: MODE_PRESETS[1].highlightTint.slice(),
    saturation: MODE_PRESETS[1].saturation,
    contrast: MODE_PRESETS[1].contrast
  };

  // RenderTargets & Post-Processing Meshes/Materials
  var rtWidth = 0;
  var rtHeight = 0;
  var rtType = null;
  var rtIsPackedSRGB = true;
  var useMSAA = false;
  var sceneRT = null;
  var bloomHalfA = null;
  var bloomHalfB = null;
  var bloomQuarterA = null;
  var bloomQuarterB = null;

  var postScene = null;
  var postCamera = null;
  var postQuad = null;
  var fastKawaseBrightMat = null;
  var brightPassMat = null;
  var downsampleMat = null;
  var blurMat = null;
  var compositeMat = null;

  // Shared shader output mode uniform (0.0 = Lite sRGB, 1.0 = Auto sRGB-RT, 2.0 = Ultra Linear-16F)
  var sharedShaderOutMode = { value: 1.0 };
  var patchedShaders = [];

  // Static Scene Batching, PointLight Budget & Cached On-Demand Shadow State
  var staticBatchingDone = false;
  var batchedSceneRef = null;
  var batchedRootGroup = null;
  var pooledAccentLight = null;
  var accentFocalPoints = [];
  var renderFrameCounter = 0;

  var shadowBakedOnce = false;
  var lastShadowAnchorX = 99999;
  var lastShadowAnchorZ = 99999;
  var lastShadowUpdateMs = 0;
  var lastDiscoveredCount = -1;
  var wonderEmergenceUntilMs = 0;

  var hudBtnInjected = false;
  var keyListenerBound = false;

  var perfStats = {
    batchedMeshesMerged: 0,
    batchedBucketsCreated: 0,
    smallShadowCastersStripped: 0,
    activePointLights: 0,
    shadowUpdatesCount: 0
  };

  // PMREM Environment State
  var pmremGen = null;
  var activeEnvRT = null;

  // Cove Caïque & Dynamic Mooring State
  var caiqueRoot = null;
  var caiqueVessel = null;
  var caiqueRippleMesh = null;
  var caiqueLanternHalo = null;
  var caiqueLanternCore = null;
  var caiqueLanternGlassMat = null;
  var caiqueSailGroup = null;
  var mooringMesh = null;
  var mooringGeo = null;
  var mooringBollardTip = null;
  var bowBittLocal = null;

  var CAIQUE_ANCHOR = {
    x: 15.2,
    y: -0.34,
    z: -9.4,
    yaw: -0.58
  };
  var BOLLARD_POS = {
    x: 10.85,
    y: 0.15,
    z: -6.35
  };

  // Cached Procedural Textures
  var sharedTextures = {
    moteSprite: null,
    emberSprite: null,
    stoneRoughness: null,
    metalRoughness: null,
    organicRoughness: null
  };

  // Scratch objects to avoid per-frame allocations
  var tmpVecA = null;
  var tmpVecB = null;
  var tmpVecC = null;

  // ==========================================================================
  // 1. PROCEDURAL TEXTURES: GAUSSIAN SPRITES, ROUGHNESS MAPS & CAÏQUE HULL PBR
  // ==========================================================================
  function createGaussianSpriteTexture(THREE, stops, size) {
    var dim = size || 128;
    var canvas = document.createElement('canvas');
    canvas.width = dim;
    canvas.height = dim;
    var c2d = canvas.getContext('2d');
    var img = c2d.createImageData(dim, dim);
    var data = img.data;
    var half = (dim - 1) * 0.5;

    for (var y = 0; y < dim; y++) {
      for (var x = 0; x < dim; x++) {
        var dx = (x - half) / half;
        var dy = (y - half) / half;
        var r = Math.hypot(dx, dy);
        var idx = (y * dim + x) * 4;
        if (r >= 1.0) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
          continue;
        }
        // Smooth radial Gaussian envelope tapering cleanly to zero at r = 1
        var edgeWindow = Math.pow(1.0 - r * r, 2.0);
        var gauss = Math.exp(-r * r * stops.sigma) * edgeWindow;

        // Interpolate core -> mid -> outer RGB
        var tCore = Math.min(1.0, r / 0.42);
        var tOuter = Math.min(1.0, Math.max(0.0, (r - 0.35) / 0.65));
        var cr = stops.core[0] + (stops.mid[0] - stops.core[0]) * tCore;
        var cg = stops.core[1] + (stops.mid[1] - stops.core[1]) * tCore;
        var cb = stops.core[2] + (stops.mid[2] - stops.core[2]) * tCore;

        cr = cr + (stops.outer[0] - cr) * tOuter;
        cg = cg + (stops.outer[1] - cg) * tOuter;
        cb = cb + (stops.outer[2] - cb) * tOuter;

        data[idx] = Math.round(Math.max(0, Math.min(255, cr)));
        data[idx + 1] = Math.round(Math.max(0, Math.min(255, cg)));
        data[idx + 2] = Math.round(Math.max(0, Math.min(255, cb)));
        data[idx + 3] = Math.round(Math.max(0, Math.min(255, gauss * 255)));
      }
    }
    c2d.putImageData(img, 0, 0);

    var tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
    if (THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
    tex.needsUpdate = true;
    return tex;
  }

  // Deterministic PRNG so procedural textures are clean and repeatable
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createProceduralRoughnessMap(THREE, kind, repeat) {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var c2d = canvas.getContext('2d');
    var rand = mulberry32(kind === 'metal' ? 4109 : (kind === 'organic' ? 7723 : 1943));

    if (kind === 'metal') {
      // Hand-burnished bronze & antique brass micro-patina (grayscale [135..235])
      c2d.fillStyle = 'rgb(182,182,182)';
      c2d.fillRect(0, 0, size, size);
      for (var i = 0; i < 950; i++) {
        var v = Math.round(145 + rand() * 82);
        c2d.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.16)';
        c2d.fillRect(rand() * size, rand() * size, 10 + rand() * 44, 1 + rand() * 2.5);
      }
      for (var p = 0; p < 320; p++) {
        var vp = Math.round(195 + rand() * 52);
        c2d.fillStyle = 'rgba(' + vp + ',' + vp + ',' + vp + ',0.14)';
        c2d.beginPath();
        c2d.arc(rand() * size, rand() * size, 2 + rand() * 7, 0, Math.PI * 2);
        c2d.fill();
      }
    } else if (kind === 'organic') {
      // Matte bark & Mediterranean foliage variation (grayscale [185..252])
      c2d.fillStyle = 'rgb(218,218,218)';
      c2d.fillRect(0, 0, size, size);
      for (var j = 0; j < 1400; j++) {
        var vo = Math.round(182 + rand() * 68);
        c2d.fillStyle = 'rgba(' + vo + ',' + vo + ',' + vo + ',0.22)';
        c2d.beginPath();
        c2d.arc(rand() * size, rand() * size, 2 + rand() * 6, 0, Math.PI * 2);
        c2d.fill();
      }
    } else {
      // Pentelic marble & travertine mineral pore & calcite polish variation ([150..242])
      c2d.fillStyle = 'rgb(196,196,196)';
      c2d.fillRect(0, 0, size, size);
      for (var k = 0; k < 1600; k++) {
        var vs = Math.round(150 + rand() * 90);
        c2d.fillStyle = 'rgba(' + vs + ',' + vs + ',' + vs + ',0.15)';
        c2d.fillRect(rand() * size, rand() * size, 4 + rand() * 18, 3 + rand() * 12);
      }
      // Subtle weathered calcite veins with slightly smoother sheen
      for (var vIdx = 0; vIdx < 9; vIdx++) {
        c2d.strokeStyle = 'rgba(152,152,152,0.22)';
        c2d.lineWidth = 1.5 + rand() * 2.5;
        c2d.beginPath();
        var vx = rand() * size;
        var vy = 0;
        c2d.moveTo(vx, vy);
        while (vy < size) {
          vx += (rand() - 0.5) * 20;
          vy += 18;
          c2d.lineTo(vx, vy);
        }
        c2d.stroke();
      }
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    var rep = repeat || 3;
    tex.repeat.set(rep, rep);
    // Roughness maps are non-color linear scalar data
    if (THREE.LinearEncoding) {
      tex.encoding = THREE.LinearEncoding;
    }
    tex.needsUpdate = true;
    return tex;
  }

  function makeNormalMapFromCanvasLocal(THREE, srcCanvas, strength, repeatX, repeatY) {
    var w = srcCanvas.width;
    var h = srcCanvas.height;
    var srcData = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
    var normCanvas = document.createElement('canvas');
    normCanvas.width = w;
    normCanvas.height = h;
    var nCtx = normCanvas.getContext('2d');
    var outImg = nCtx.createImageData(w, h);
    var out = outImg.data;
    var str = strength || 1.8;

    function lum(x, y) {
      var wx = (x + w) % w;
      var wy = Math.max(0, Math.min(h - 1, y));
      var idx = (wy * w + wx) * 4;
      return (srcData[idx] * 0.299 + srcData[idx + 1] * 0.587 + srcData[idx + 2] * 0.114) / 255;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tl = lum(x - 1, y - 1);
        var l = lum(x - 1, y);
        var bl = lum(x - 1, y + 1);
        var t = lum(x, y - 1);
        var b = lum(x, y + 1);
        var tr = lum(x + 1, y - 1);
        var r = lum(x + 1, y);
        var br = lum(x + 1, y + 1);

        var dX = (tr + 2 * r + br) - (tl + 2 * l + bl);
        var dY = (bl + 2 * b + br) - (tl + 2 * t + tr);
        var nx = -dX * str;
        var ny = dY * str;
        var nz = 1.0;
        var inv = 1.0 / Math.hypot(nx, ny, nz);
        var oIdx = (y * w + x) * 4;
        out[oIdx] = Math.round((nx * inv * 0.5 + 0.5) * 255);
        out[oIdx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
        out[oIdx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
        out[oIdx + 3] = 255;
      }
    }
    nCtx.putImageData(outImg, 0, 0);
    var tex = new THREE.CanvasTexture(normCanvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(repeatX || 1, repeatY || 1);
    if (THREE.LinearEncoding) {
      tex.encoding = THREE.LinearEncoding;
    }
    tex.needsUpdate = true;
    return tex;
  }

  // Painted Cycladic Pine Hull Planking Texture (v=0 at keel -> v=1 at gunwale sheer)
  // Note: Canvas y=0 corresponds to UV v=1 (sheer), Canvas y=H corresponds to UV v=0 (keel)
  function createCaiqueHullTextures(THREE) {
    var w = 512;
    var h = 512;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var c = canvas.getContext('2d');
    var rand = mulberry32(1953);

    // 1. Upper Gunwale Ochre & White Trim (y: 0 .. 52 => v: 0.90 .. 1.00)
    c.fillStyle = '#d99326';
    c.fillRect(0, 0, w, 34);
    c.fillStyle = '#f8f4ea';
    c.fillRect(0, 34, w, 18);

    // 2. Cycladic Aegean Blue Sheer Band (y: 52 .. 118 => v: 0.77 .. 0.90)
    var blueGrad = c.createLinearGradient(0, 52, 0, 118);
    blueGrad.addColorStop(0, '#1d6496');
    blueGrad.addColorStop(1, '#154c73');
    c.fillStyle = blueGrad;
    c.fillRect(0, 52, w, 66);

    // Thin ochre pinstripe below blue band
    c.fillStyle = '#e0a034';
    c.fillRect(0, 118, w, 8);

    // 3. Oiled Honeyed Aegean Pine Topsides Planking (y: 126 .. 304 => v: 0.41 .. 0.75)
    var pineGrad = c.createLinearGradient(0, 126, 0, 304);
    pineGrad.addColorStop(0, '#cf914d');
    pineGrad.addColorStop(0.5, '#be7e3c');
    pineGrad.addColorStop(1, '#a6692c');
    c.fillStyle = pineGrad;
    c.fillRect(0, 126, w, 178);

    // 4. Crisp Whitewashed Boot-Top Waterline Stripe (y: 304 .. 334 => v: 0.35 .. 0.41)
    c.fillStyle = '#f4efe2';
    c.fillRect(0, 304, w, 30);

    // 5. Traditional Terracotta Red-Ochre Lower Hull (y: 334 .. 512 => v: 0.00 .. 0.35)
    var keelGrad = c.createLinearGradient(0, 334, 0, 512);
    keelGrad.addColorStop(0, '#a83c26');
    keelGrad.addColorStop(1, '#7c2818');
    c.fillStyle = keelGrad;
    c.fillRect(0, 334, w, 178);

    // Fine longitudinal wood grain streaks across whole hull
    for (var g = 0; g < 1600; g++) {
      var gy = rand() * h;
      var gx = rand() * w;
      var gw = 18 + rand() * 75;
      c.fillStyle = g % 2 === 0 ? 'rgba(255,245,225,0.055)' : 'rgba(35,18,6,0.075)';
      c.fillRect(gx, gy, gw, 1.2 + rand() * 1.6);
    }

    // Carvel plank strake caulked seams & countersunk bronze treenails
    var strakeYs = [34, 52, 86, 122, 152, 182, 212, 242, 272, 304, 334, 372, 412, 456];
    for (var s = 0; s < strakeYs.length; s++) {
      var sy = strakeYs[s];
      c.fillStyle = 'rgba(28, 15, 6, 0.46)';
      c.fillRect(0, sy - 1, w, 2.2);
      c.fillStyle = 'rgba(255, 248, 230, 0.18)';
      c.fillRect(0, sy + 1.2, w, 1.0);

      // Rib fastener studs along pine strakes
      if (sy >= 130 && sy <= 290) {
        for (var fx = 16; fx < w; fx += 32) {
          c.fillStyle = 'rgba(72, 44, 18, 0.38)';
          c.beginPath();
          c.arc(fx, sy + 14, 1.6, 0, Math.PI * 2);
          c.fill();
        }
      }
    }

    // Subtle salt-spray patina near waterline
    for (var sp = 0; sp < 260; sp++) {
      var spy = 290 + (rand() - 0.5) * 44;
      c.fillStyle = 'rgba(248, 246, 238, 0.08)';
      c.beginPath();
      c.ellipse(rand() * w, spy, 6 + rand() * 18, 2 + rand() * 4, 0, 0, Math.PI * 2);
      c.fill();
    }

    var map = new THREE.CanvasTexture(canvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.ClampToEdgeWrapping;
    map.anisotropy = 4;
    if (THREE.sRGBEncoding) {
      map.encoding = THREE.sRGBEncoding;
    }
    map.needsUpdate = true;

    var normalMap = makeNormalMapFromCanvasLocal(THREE, canvas, 1.9, 1, 1);
    return { map: map, normalMap: normalMap };
  }

  function createCanvasSailTexture(THREE) {
    var w = 256;
    var h = 256;
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var c = canvas.getContext('2d');
    var rand = mulberry32(8821);

    c.fillStyle = '#ece2ca';
    c.fillRect(0, 0, w, h);

    // Fine flax/cotton canvas weave & sun-bleached folds
    for (var i = 0; i < 1800; i++) {
      c.fillStyle = i % 2 === 0 ? 'rgba(255,252,244,0.12)' : 'rgba(148,126,94,0.10)';
      if (i % 3 === 0) {
        c.fillRect(rand() * w, rand() * h, 14 + rand() * 32, 1.2);
      } else {
        c.fillRect(rand() * w, rand() * h, 1.2, 14 + rand() * 32);
      }
    }
    // Stitched panel seams
    for (var x = 42; x < w; x += 42) {
      c.strokeStyle = 'rgba(132, 108, 76, 0.34)';
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, 0);
      c.lineTo(x, h);
      c.stroke();
    }

    var tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    if (THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
    tex.needsUpdate = true;
    return tex;
  }

  function createWaterlineRippleTexture(THREE) {
    var size = 256;
    var canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    var c = canvas.getContext('2d');
    c.clearRect(0, 0, size, size);

    var cx = size * 0.5;
    var cy = size * 0.5;

    // Nested boat-hull elliptical lapping ripples
    for (var r = 0; r < 3; r++) {
      c.save();
      c.translate(cx, cy);
      c.scale(0.46, 1.0);
      var rad = 74 + r * 17;
      var grad = c.createRadialGradient(0, 0, rad * 0.76, 0, 0, rad * 1.12);
      var alpha = r === 0 ? 0.42 : (r === 1 ? 0.24 : 0.11);
      grad.addColorStop(0.0, 'rgba(224, 247, 255, 0.0)');
      grad.addColorStop(0.55, 'rgba(240, 252, 255, ' + alpha.toFixed(2) + ')');
      grad.addColorStop(1.0, 'rgba(224, 247, 255, 0.0)');
      c.fillStyle = grad;
      c.beginPath();
      c.arc(0, 0, rad * 1.12, 0, Math.PI * 2);
      c.fill();
      c.restore();
    }

    // Clear inner hull footprint so water inside open cockpit never shows white foam
    c.save();
    c.globalCompositeOperation = 'destination-out';
    c.translate(cx, cy);
    c.scale(0.41, 1.0);
    var inner = c.createRadialGradient(0, 0, 42, 0, 0, 74);
    inner.addColorStop(0.0, 'rgba(0, 0, 0, 1.0)');
    inner.addColorStop(0.75, 'rgba(0, 0, 0, 0.85)');
    inner.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    c.fillStyle = inner;
    c.beginPath();
    c.arc(0, 0, 76, 0, Math.PI * 2);
    c.fill();
    c.restore();

    var tex = new THREE.CanvasTexture(canvas);
    if (THREE.sRGBEncoding) {
      tex.encoding = THREE.sRGBEncoding;
    }
    tex.needsUpdate = true;
    return tex;
  }

  // ==========================================================================
  // 2. MULTI-PASS WEBGL POST-PROCESSING PIPELINE (BLOOM + COMPOSITE + FALLBACK)
  // ==========================================================================
  var POST_VERT_GLSL = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = vec4(position.xy, 0.0, 1.0);',
    '}'
  ].join('\n');

  // Pass 1: 5-tap Dual-Kawase Anti-Firefly Downsample + Soft-Knee HDR Luminance Extraction
  var BRIGHT_PASS_FRAG_GLSL = [
    'uniform sampler2D tScene;',
    'uniform vec2 uTexelSize;',
    'uniform float uThreshold;',
    'uniform float uSoftKnee;',
    'varying vec2 vUv;',
    '',
    'float luma(vec3 c) {',
    '  return dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '}',
    '',
    'vec3 safeHdr(vec3 c) {',
    '  float r = (c.r >= 0.0) ? min(c.r, 24.0) : 0.0;',
    '  float g = (c.g >= 0.0) ? min(c.g, 24.0) : 0.0;',
    '  float b = (c.b >= 0.0) ? min(c.b, 24.0) : 0.0;',
    '  return vec3(r, g, b);',
    '}',
    '',
    'vec3 karisSample(vec2 uv) {',
    '  vec3 c = safeHdr(texture2D(tScene, uv).rgb);',
    '  return c / (1.0 + luma(c) * 0.12);',
    '}',
    '',
    'void main() {',
    '  vec2 h = uTexelSize * 0.75;',
    '  vec3 c0 = karisSample(vUv) * 0.50;',
    '  vec3 c1 = karisSample(vUv + vec2(-h.x, -h.y)) * 0.125;',
    '  vec3 c2 = karisSample(vUv + vec2( h.x, -h.y)) * 0.125;',
    '  vec3 c3 = karisSample(vUv + vec2(-h.x,  h.y)) * 0.125;',
    '  vec3 c4 = karisSample(vUv + vec2( h.x,  h.y)) * 0.125;',
    '  vec3 col = c0 + c1 + c2 + c3 + c4;',
    '',
    '  float br = max(luma(col), max(col.r, max(col.g, col.b)) * 0.82);',
    '  float knee = uThreshold * uSoftKnee + 0.0001;',
    '  float soft = clamp(br - uThreshold + knee, 0.0, 2.0 * knee);',
    '  soft = (soft * soft) / (4.0 * knee);',
    '  float contrib = max(soft, br - uThreshold) / max(br, 0.0001);',
    '  vec3 extracted = min(col * contrib, vec3(5.5));',
    '  gl_FragColor = vec4(extracted, 1.0);',
    '}'
  ].join('\n');

  // Dual-Kawase 5-Tap Downsample Pass (1/2 res -> 1/4 res)
  var DOWNSAMPLE_FRAG_GLSL = [
    'uniform sampler2D tInput;',
    'uniform vec2 uTexelSize;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 d = uTexelSize;',
    '  vec3 sum = texture2D(tInput, vUv).rgb * 0.50;',
    '  sum += texture2D(tInput, vUv + vec2(-d.x, -d.y)).rgb * 0.125;',
    '  sum += texture2D(tInput, vUv + vec2( d.x, -d.y)).rgb * 0.125;',
    '  sum += texture2D(tInput, vUv + vec2(-d.x,  d.y)).rgb * 0.125;',
    '  sum += texture2D(tInput, vUv + vec2( d.x,  d.y)).rgb * 0.125;',
    '  gl_FragColor = vec4(sum, 1.0);',
    '}'
  ].join('\n');

  // Separable 9-Tap Hardware-Bilinear Gaussian Blur (5 fetches = 9 true Gaussian weights)
  var BLUR_FRAG_GLSL = [
    'uniform sampler2D tInput;',
    'uniform vec2 uDirection;',
    'varying vec2 vUv;',
    'void main() {',
    '  vec2 off1 = uDirection * 1.3846153846;',
    '  vec2 off2 = uDirection * 3.2307692308;',
    '  vec3 col = texture2D(tInput, vUv).rgb * 0.2270270270;',
    '  col += texture2D(tInput, vUv + off1).rgb * 0.3162162162;',
    '  col += texture2D(tInput, vUv - off1).rgb * 0.3162162162;',
    '  col += texture2D(tInput, vUv + off2).rgb * 0.0702702703;',
    '  col += texture2D(tInput, vUv - off2).rgb * 0.0702702703;',
    '  gl_FragColor = vec4(col, 1.0);',
    '}'
  ].join('\n');

  // Fast 60fps Single-Pass 1/4-Res 5-Tap Kawase Bloom + sRGB-Unpack Bright Extraction
  var FAST_KAWASE_BRIGHT_FRAG_GLSL = [
    'uniform sampler2D tScene;',
    'uniform vec2 uTexelSize;',
    'uniform float uThreshold;',
    'uniform float uSoftKnee;',
    'uniform float uScenePacked;',
    'varying vec2 vUv;',
    '',
    'float luma(vec3 c) {',
    '  return dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '}',
    '',
    'vec3 safeHdr(vec3 c) {',
    '  float r = (c.r >= 0.0) ? min(c.r, 24.0) : 0.0;',
    '  float g = (c.g >= 0.0) ? min(c.g, 24.0) : 0.0;',
    '  float b = (c.b >= 0.0) ? min(c.b, 24.0) : 0.0;',
    '  return vec3(r, g, b);',
    '}',
    '',
    'vec3 srgbToLinear(vec3 s) {',
    '  s = clamp(s, 0.0, 1.0);',
    '  vec3 hi = pow(max((s + 0.055) / 1.055, vec3(0.00001)), vec3(2.4));',
    '  return mix(s / 12.92, hi, step(vec3(0.04045), s));',
    '}',
    '',
    'vec3 fetchLinear(vec2 uv) {',
    '  vec3 raw = texture2D(tScene, uv).rgb;',
    '  vec3 lin = (uScenePacked > 0.5) ? srgbToLinear(raw) : safeHdr(raw);',
    '  return lin / (1.0 + luma(lin) * 0.10);',
    '}',
    '',
    'void main() {',
    '  vec2 h = uTexelSize * 2.15;',
    '  vec3 col = fetchLinear(vUv) * 0.40;',
    '  col += fetchLinear(vUv + vec2(-h.x, -h.y)) * 0.15;',
    '  col += fetchLinear(vUv + vec2( h.x, -h.y)) * 0.15;',
    '  col += fetchLinear(vUv + vec2(-h.x,  h.y)) * 0.15;',
    '  col += fetchLinear(vUv + vec2( h.x,  h.y)) * 0.15;',
    '',
    '  float thr = (uScenePacked > 0.5) ? (uThreshold * 0.71) : uThreshold;',
    '  float br = max(luma(col), max(col.r, max(col.g, col.b)) * 0.86);',
    '  float knee = thr * uSoftKnee + 0.0001;',
    '  float soft = clamp(br - thr + knee, 0.0, 2.0 * knee);',
    '  soft = (soft * soft) / (4.0 * knee);',
    '  float contrib = max(soft, br - thr) / max(br, 0.0001);',
    '  float gain = (uScenePacked > 0.5) ? 2.65 : 1.0;',
    '  vec3 extracted = clamp(col * contrib * gain, 0.0, 1.0);',
    '  gl_FragColor = vec4(extracted, 1.0);',
    '}'
  ].join('\n');

  // Final Cinematic Composite: Sharp Scene + Soft Bloom + Mediterranean Grade + ACES + sRGB + Vignette + Dither
  var COMPOSITE_FRAG_GLSL = [
    'uniform sampler2D tScene;',
    'uniform sampler2D tBloomHalf;',
    'uniform sampler2D tBloomQuarter;',
    'uniform vec2 uQuarterTexel;',
    'uniform float uBloomStrength;',
    'uniform float uExposure;',
    'uniform float uVignette;',
    'uniform float uSaturation;',
    'uniform float uContrast;',
    'uniform float uScenePacked;',
    'uniform float uFastBloom;',
    'uniform vec3 uShadowTint;',
    'uniform vec3 uMidTint;',
    'uniform vec3 uHighlightTint;',
    'varying vec2 vUv;',
    '',
    'vec3 sampleTent(sampler2D tex, vec2 uv, vec2 texel) {',
    '  vec2 d = texel;',
    '  vec3 s = texture2D(tex, uv).rgb * 4.0;',
    '  s += texture2D(tex, uv + vec2(-d.x, 0.0)).rgb * 2.0;',
    '  s += texture2D(tex, uv + vec2( d.x, 0.0)).rgb * 2.0;',
    '  s += texture2D(tex, uv + vec2(0.0, -d.y)).rgb * 2.0;',
    '  s += texture2D(tex, uv + vec2(0.0,  d.y)).rgb * 2.0;',
    '  s += texture2D(tex, uv + vec2(-d.x, -d.y)).rgb;',
    '  s += texture2D(tex, uv + vec2( d.x, -d.y)).rgb;',
    '  s += texture2D(tex, uv + vec2(-d.x,  d.y)).rgb;',
    '  s += texture2D(tex, uv + vec2( d.x,  d.y)).rgb;',
    '  return s * (1.0 / 16.0);',
    '}',
    '',
    'vec3 RRTAndODTFit(vec3 v) {',
    '  vec3 a = v * (v + 0.0245786) - 0.000090537;',
    '  vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;',
    '  return a / b;',
    '}',
    '',
    'vec3 ACESFilmic(vec3 color, float exposure) {',
    '  const mat3 ACESInputMat = mat3(',
    '    vec3(0.59719, 0.07600, 0.02840),',
    '    vec3(0.35458, 0.90834, 0.13383),',
    '    vec3(0.04823, 0.01566, 0.83777)',
    '  );',
    '  const mat3 ACESOutputMat = mat3(',
    '    vec3( 1.60475, -0.10208, -0.00327),',
    '    vec3(-0.53108,  1.10813, -0.07276),',
    '    vec3(-0.07367, -0.00605,  1.07602)',
    '  );',
    '  color *= exposure / 0.6;',
    '  color = ACESInputMat * color;',
    '  color = RRTAndODTFit(color);',
    '  color = ACESOutputMat * color;',
    '  return clamp(color, 0.0, 1.0);',
    '}',
    '',
    'vec3 safeHdr(vec3 c) {',
    '  float r = (c.r >= 0.0) ? min(c.r, 24.0) : 0.0;',
    '  float g = (c.g >= 0.0) ? min(c.g, 24.0) : 0.0;',
    '  float b = (c.b >= 0.0) ? min(c.b, 24.0) : 0.0;',
    '  return vec3(r, g, b);',
    '}',
    '',
    'vec3 srgbToLinear(vec3 s) {',
    '  s = clamp(s, 0.0, 1.0);',
    '  vec3 hi = pow(max((s + 0.055) / 1.055, vec3(0.00001)), vec3(2.4));',
    '  return mix(s / 12.92, hi, step(vec3(0.04045), s));',
    '}',
    '',
    'vec3 linearToSRGB(vec3 c) {',
    '  c = clamp(c, 0.0, 1.0);',
    '  vec3 hi = 1.055 * pow(max(c, vec3(0.0031308)), vec3(1.0 / 2.4)) - 0.055;',
    '  return mix(c * 12.92, hi, step(vec3(0.0031308), c));',
    '}',
    '',
    'float interleavedGradientNoise(vec2 pix) {',
    '  return fract(52.9829189 * fract(dot(pix, vec2(0.06711056, 0.00583715))));',
    '}',
    '',
    'void main() {',
    '  vec3 rawScene = texture2D(tScene, vUv).rgb;',
    '  vec3 baseHdr = (uScenePacked > 0.5) ? srgbToLinear(rawScene) : safeHdr(rawScene);',
    '  vec3 bloom;',
    '  if (uFastBloom > 0.5) {',
    '    bloom = safeHdr(sampleTent(tBloomQuarter, vUv, uQuarterTexel * 1.25)) * 1.06;',
    '  } else {',
    '    vec3 bloomNear = safeHdr(sampleTent(tBloomHalf, vUv, uQuarterTexel * 0.5));',
    '    vec3 bloomWide = safeHdr(sampleTent(tBloomQuarter, vUv, uQuarterTexel));',
    '    bloom = bloomNear * 0.44 + bloomWide * 0.64;',
    '  }',
    '',
    '  vec3 hdr = baseHdr + bloom * uBloomStrength;',
    '',
    '  // Chromaticity-Preserving Filmic Highlight Shoulder so Pentelic marble & Cycladic plaster never clip to flat white',
    '  float preLum = dot(hdr, vec3(0.2126, 0.7152, 0.0722));',
    '  if (preLum > 0.46) {',
    '    float excess = preLum - 0.46;',
    '    float shoulder = 0.46 + excess / (1.0 + excess * 0.72);',
    '    hdr *= (shoulder / preLum);',
    '  }',
    '',
    '  // Mediterranean 3-Zone Split-Tone Color Balance in Linear HDR',
    '  float lum = dot(hdr, vec3(0.2126, 0.7152, 0.0722));',
    '  float wShadow = 1.0 - smoothstep(0.0, 0.32, lum);',
    '  float wHigh = smoothstep(0.38, 1.15, lum);',
    '  float wMid = max(0.0, 1.0 - wShadow - wHigh);',
    '  vec3 zoneBalance = uShadowTint * wShadow + uMidTint * wMid + uHighlightTint * wHigh;',
    '  hdr *= zoneBalance;',
    '',
    '  // ACES Filmic Tone Mapping + Accurate sRGB Transfer',
    '  vec3 mapped = ACESFilmic(hdr, uExposure);',
    '  vec3 srgb = linearToSRGB(mapped);',
    '',
    '  // Soft Non-Clipping Toe Contrast & Saturation Polish (preserves 100% of upper marble highlight texture)',
    '  vec3 curved = srgb * srgb * (3.0 - 2.0 * srgb);',
    '  srgb = mix(srgb, curved, clamp((uContrast - 1.0) * 3.5, 0.0, 0.35));',
    '  float sLum = dot(srgb, vec3(0.299, 0.587, 0.114));',
    '  srgb = clamp(mix(vec3(sLum), srgb, uSaturation), 0.0, 1.0);',
    '',
    '  // Natural Medium-Format Lens Vignette (0.14)',
    '  vec2 centered = (vUv - 0.5) * vec2(1.08, 1.0);',
    '  float distSq = dot(centered, centered) * 2.0;',
    '  float vig = 1.0 - uVignette * smoothstep(0.22, 1.35, distSq);',
    '  srgb *= vig;',
    '',
    '  // Ultra-Subtle Triangular-PDF Filmic Dither (eliminates 8-bit sky & water banding)',
    '  float n1 = interleavedGradientNoise(gl_FragCoord.xy);',
    '  float n2 = interleavedGradientNoise(gl_FragCoord.xy + vec2(17.0, 31.0));',
    '  float triDither = (n1 + n2 - 1.0) * (1.25 / 255.0);',
    '  srgb = clamp(srgb + vec3(triDither), 0.0, 1.0);',
    '',
    '  gl_FragColor = vec4(srgb, 1.0);',
    '}'
  ].join('\n');

  function disposeTarget(rt) {
    if (rt && typeof rt.dispose === 'function') {
      try {
        rt.dispose();
      } catch (e) {
        // Ignore disposal errors
      }
    }
  }

  function disposeAllPipelineTargets() {
    disposeTarget(sceneRT);
    disposeTarget(bloomHalfA);
    disposeTarget(bloomHalfB);
    disposeTarget(bloomQuarterA);
    disposeTarget(bloomQuarterB);
    sceneRT = null;
    bloomHalfA = null;
    bloomHalfB = null;
    bloomQuarterA = null;
    bloomQuarterB = null;
    rtWidth = 0;
    rtHeight = 0;
  }

  function detectGPUCapabilities(THREE, renderer) {
    if (gpuProbed) return;
    gpuProbed = true;

    var gl = renderer && renderer.getContext ? renderer.getContext() : null;
    if (!gl) return;

    try {
      var dbgExt = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgExt) {
        gpuRendererString = String(gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL) || '');
      }
      if (!gpuRendererString) {
        gpuRendererString = String(gl.getParameter(gl.RENDERER) || '');
      }
    } catch (e) {
      gpuRendererString = '';
    }

    isIntegratedGPU = /intel|uhd|iris|hd graphics|swiftshader|llvmpipe|mesa|microsoft basic/i.test(gpuRendererString);

    var isWebGL2 = !!(renderer.capabilities && renderer.capabilities.isWebGL2);
    var hasHalfExt = false;
    if (isWebGL2) {
      hasHalfExt = !!(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'));
    } else {
      hasHalfExt = !!(
        gl.getExtension('EXT_color_buffer_half_float') &&
        gl.getExtension('OES_texture_half_float') &&
        gl.getExtension('OES_texture_half_float_linear')
      );
    }

    var halfFloatConst = THREE.HalfFloatType || THREE.UnsignedByteType;
    var byteConst = THREE.UnsignedByteType;

    canByteRTGlobal = probeRenderTargetConfig(THREE, renderer, byteConst, false);
    canHalfFloatGlobal = hasHalfExt && probeRenderTargetConfig(THREE, renderer, halfFloatConst, false);
  }

  function computeEffectiveDPR() {
    var rawDPR = (typeof window !== 'undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1.0;
    if (qualityMode === 'lite') {
      return 0.80;
    }
    if (qualityMode === 'ultra') {
      return Math.min(rawDPR, 1.35);
    }
    // 'auto' 60fps mode: cap integrated GPUs (Intel UHD 630 etc.) to 1.0 DPR, discrete to 1.25 DPR
    var cap = isIntegratedGPU ? 1.0 : 1.25;
    return Math.max(0.65, Math.min(rawDPR, cap) * governorScale);
  }

  function syncRendererResolution(ctx) {
    if (!ctx || !ctx.renderer) return;
    var renderer = ctx.renderer;
    effectiveDPR = computeEffectiveDPR();
    var cssW = window.innerWidth || (ctx.canvas && ctx.canvas.clientWidth) || 1280;
    var cssH = window.innerHeight || (ctx.canvas && ctx.canvas.clientHeight) || 720;

    var curDPR = (typeof renderer.getPixelRatio === 'function') ? renderer.getPixelRatio() : 1.0;
    if (Math.abs(curDPR - effectiveDPR) > 0.002 && typeof renderer.setPixelRatio === 'function') {
      renderer.setPixelRatio(effectiveDPR);
      renderer.setSize(cssW, cssH, false);
    }
  }

  function getTargetPixelSize(ctx) {
    var renderer = ctx.renderer;
    var dpr = (renderer && typeof renderer.getPixelRatio === 'function')
      ? renderer.getPixelRatio()
      : effectiveDPR;
    var cssW = window.innerWidth || (ctx.canvas && ctx.canvas.clientWidth) || 1280;
    var cssH = window.innerHeight || (ctx.canvas && ctx.canvas.clientHeight) || 720;
    return {
      w: Math.max(4, Math.floor(cssW * dpr)),
      h: Math.max(4, Math.floor(cssH * dpr))
    };
  }

  function makeAuxTarget(THREE, w, h, texType) {
    var rt = new THREE.WebGLRenderTarget(w, h, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: texType,
      depthBuffer: false,
      stencilBuffer: false
    });
    if (THREE.LinearEncoding) {
      rt.texture.encoding = THREE.LinearEncoding;
    }
    rt.texture.generateMipmaps = false;
    return rt;
  }

  function makeSceneTarget(THREE, w, h, texType, msaa, useSRGBEncoding) {
    var opts = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: texType,
      depthBuffer: true,
      stencilBuffer: false
    };
    var rt = null;
    if (msaa && typeof THREE.WebGLMultisampleRenderTarget === 'function') {
      rt = new THREE.WebGLMultisampleRenderTarget(w, h, opts);
      rt.samples = 4;
    } else {
      rt = new THREE.WebGLRenderTarget(w, h, opts);
    }
    if (useSRGBEncoding && THREE.sRGBEncoding) {
      rt.texture.encoding = THREE.sRGBEncoding;
    } else if (THREE.LinearEncoding) {
      rt.texture.encoding = THREE.LinearEncoding;
    }
    rt.texture.generateMipmaps = false;
    return rt;
  }

  // Actively probe FBO completeness with a tiny test render so no GPU/driver ever black-screens
  function probeRenderTargetConfig(THREE, renderer, texType, msaa) {
    var gl = renderer.getContext ? renderer.getContext() : null;
    if (!gl) return false;
    while (gl.getError() !== gl.NO_ERROR) { /* flush prior GL errors */ }

    var testSceneRT = null;
    var testBloomRT = null;
    var prevRT = renderer.getRenderTarget();
    try {
      testSceneRT = makeSceneTarget(THREE, 16, 16, texType, msaa, false);
      testBloomRT = makeAuxTarget(THREE, 8, 8, texType);

      var dummyScene = new THREE.Scene();
      var dummyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      var dummyTri = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      dummyScene.add(dummyTri);

      renderer.setRenderTarget(testSceneRT);
      renderer.clear();
      var status1 = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      renderer.render(dummyScene, dummyCam);

      renderer.setRenderTarget(testBloomRT);
      renderer.clear();
      var status2 = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

      renderer.setRenderTarget(prevRT);
      dummyTri.geometry.dispose();
      dummyTri.material.dispose();
      disposeTarget(testSceneRT);
      disposeTarget(testBloomRT);

      var glErr = gl.getError();
      return (status1 === gl.FRAMEBUFFER_COMPLETE && status2 === gl.FRAMEBUFFER_COMPLETE && glErr === gl.NO_ERROR);
    } catch (e) {
      try { renderer.setRenderTarget(prevRT); } catch (ignore) {}
      disposeTarget(testSceneRT);
      disposeTarget(testBloomRT);
      return false;
    }
  }

  function allocatePipelineTargets(THREE, w, h) {
    disposeAllPipelineTargets();

    // 0-Pass Direct Mode ('lite') allocates zero offscreen render targets
    if (qualityMode === 'lite') {
      rtWidth = w;
      rtHeight = h;
      rtIsPackedSRGB = true;
      sharedShaderOutMode.value = 0.0;
      pipelineTier = 'lite-direct';
      return;
    }

    rtWidth = w;
    rtHeight = h;
    var qw = Math.max(2, Math.floor(w * 0.25));
    var qh = Math.max(2, Math.floor(h * 0.25));

    // 'ultra' uses 16-bit HalfFloat multi-pass when supported; 'auto' uses fast 2-pass UnsignedByteType sRGB-RT
    var useUltra16F = (qualityMode === 'ultra' && canHalfFloatGlobal);
    useMSAA = false;

    if (useUltra16F) {
      var hw = Math.max(2, Math.floor(w * 0.5));
      var hh = Math.max(2, Math.floor(h * 0.5));
      rtType = THREE.HalfFloatType || THREE.UnsignedByteType;
      rtIsPackedSRGB = false;
      sharedShaderOutMode.value = 2.0;
      pipelineTier = 'ultra-hdr16f';

      sceneRT = makeSceneTarget(THREE, w, h, rtType, false, false);
      bloomHalfA = makeAuxTarget(THREE, hw, hh, rtType);
      bloomHalfB = makeAuxTarget(THREE, hw, hh, rtType);
      bloomQuarterA = makeAuxTarget(THREE, qw, qh, rtType);
      bloomQuarterB = makeAuxTarget(THREE, qw, qh, rtType);

      if (brightPassMat) {
        brightPassMat.uniforms.uTexelSize.value.set(1.0 / w, 1.0 / h);
      }
      if (downsampleMat) {
        downsampleMat.uniforms.uTexelSize.value.set(1.0 / hw, 1.0 / hh);
      }
    } else {
      rtType = THREE.UnsignedByteType;
      rtIsPackedSRGB = true;
      sharedShaderOutMode.value = 1.0;
      pipelineTier = 'fast60-rgba8';

      sceneRT = makeSceneTarget(THREE, w, h, rtType, false, true);
      bloomQuarterA = makeAuxTarget(THREE, qw, qh, rtType);

      if (fastKawaseBrightMat) {
        fastKawaseBrightMat.uniforms.uTexelSize.value.set(1.0 / w, 1.0 / h);
        fastKawaseBrightMat.uniforms.uScenePacked.value = 1.0;
      }
    }

    if (compositeMat) {
      compositeMat.uniforms.uQuarterTexel.value.set(1.0 / qw, 1.0 / qh);
      compositeMat.uniforms.uScenePacked.value = rtIsPackedSRGB ? 1.0 : 0.0;
      compositeMat.uniforms.uFastBloom.value = useUltra16F ? 0.0 : 1.0;
    }
  }

  function initPostProcessing(ctx) {
    var THREE = ctx.THREE;
    var renderer = ctx.renderer;
    if (!THREE || !renderer) return false;

    try {
      detectGPUCapabilities(THREE, renderer);
      syncRendererResolution(ctx);

      if (!canByteRTGlobal && !canHalfFloatGlobal) {
        pipelineFailed = true;
        pipelineReady = false;
        pipelineTier = 'fallback-direct';
        sharedShaderOutMode.value = 0.0;
        return false;
      }

      postScene = new THREE.Scene();
      postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      fastKawaseBrightMat = new THREE.ShaderMaterial({
        uniforms: {
          tScene: { value: null },
          uTexelSize: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
          uThreshold: { value: gradeState.bloomThreshold },
          uSoftKnee: { value: 0.18 },
          uScenePacked: { value: 1.0 }
        },
        vertexShader: POST_VERT_GLSL,
        fragmentShader: FAST_KAWASE_BRIGHT_FRAG_GLSL,
        depthTest: false,
        depthWrite: false,
        transparent: false,
        blending: THREE.NoBlending
      });

      brightPassMat = new THREE.ShaderMaterial({
        uniforms: {
          tScene: { value: null },
          uTexelSize: { value: new THREE.Vector2(1 / 1280, 1 / 720) },
          uThreshold: { value: gradeState.bloomThreshold },
          uSoftKnee: { value: 0.16 }
        },
        vertexShader: POST_VERT_GLSL,
        fragmentShader: BRIGHT_PASS_FRAG_GLSL,
        depthTest: false,
        depthWrite: false,
        transparent: false,
        blending: THREE.NoBlending
      });

      downsampleMat = new THREE.ShaderMaterial({
        uniforms: {
          tInput: { value: null },
          uTexelSize: { value: new THREE.Vector2(1 / 640, 1 / 360) }
        },
        vertexShader: POST_VERT_GLSL,
        fragmentShader: DOWNSAMPLE_FRAG_GLSL,
        depthTest: false,
        depthWrite: false,
        transparent: false,
        blending: THREE.NoBlending
      });

      blurMat = new THREE.ShaderMaterial({
        uniforms: {
          tInput: { value: null },
          uDirection: { value: new THREE.Vector2(1 / 640, 0) }
        },
        vertexShader: POST_VERT_GLSL,
        fragmentShader: BLUR_FRAG_GLSL,
        depthTest: false,
        depthWrite: false,
        transparent: false,
        blending: THREE.NoBlending
      });

      compositeMat = new THREE.ShaderMaterial({
        uniforms: {
          tScene: { value: null },
          tBloomHalf: { value: null },
          tBloomQuarter: { value: null },
          uQuarterTexel: { value: new THREE.Vector2(1 / 320, 1 / 180) },
          uBloomStrength: { value: gradeState.bloomStrength },
          uExposure: { value: gradeState.exposure },
          uVignette: { value: 0.14 },
          uSaturation: { value: gradeState.saturation },
          uContrast: { value: gradeState.contrast },
          uScenePacked: { value: 1.0 },
          uFastBloom: { value: 1.0 },
          uShadowTint: { value: new THREE.Vector3().fromArray(gradeState.shadowTint) },
          uMidTint: { value: new THREE.Vector3().fromArray(gradeState.midTint) },
          uHighlightTint: { value: new THREE.Vector3().fromArray(gradeState.highlightTint) }
        },
        vertexShader: POST_VERT_GLSL,
        fragmentShader: COMPOSITE_FRAG_GLSL,
        depthTest: false,
        depthWrite: false,
        transparent: false,
        blending: THREE.NoBlending
      });

      postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat);
      postQuad.frustumCulled = false;
      postScene.add(postQuad);

      var dims = getTargetPixelSize(ctx);
      allocatePipelineTargets(THREE, dims.w, dims.h);

      pipelineReady = true;
      pipelineFailed = false;
      return true;
    } catch (err) {
      disposeAllPipelineTargets();
      pipelineReady = false;
      pipelineFailed = true;
      pipelineTier = 'fallback-direct';
      sharedShaderOutMode.value = 0.0;
      return false;
    }
  }

  var HLSL_SAFE_POW_PREAMBLE = [
    'float _phxPow(float x, float y) { return pow(max(abs(x), 0.000001), y); }',
    'vec2 _phxPow(vec2 x, vec2 y) { return pow(max(abs(x), vec2(0.000001)), y); }',
    'vec3 _phxPow(vec3 x, vec3 y) { return pow(max(abs(x), vec3(0.000001)), y); }',
    'vec4 _phxPow(vec4 x, vec4 y) { return pow(max(abs(x), vec4(0.000001)), y); }'
  ].join('\n') + '\n';

  function sanitizeShaderPowSource(src) {
    if (typeof src !== 'string' || src.indexOf('_phxPow') !== -1) return src;
    if (!/\bpow\s*\(/.test(src)) return src;
    return HLSL_SAFE_POW_PREAMBLE + src.replace(/\bpow\s*\(/g, '_phxPow(');
  }

  // Upgrade custom Sky, Water & Flame ShaderMaterials with zero-recompile uPhxOutMode support:
  //   uPhxOutMode < 1.5 ('lite' direct sRGB & 'auto' RGBA8 sRGB-RT) vs >= 1.5 ('ultra' HalfFloat Linear HDR)
  function patchSceneShadersForLinearHDR(scene) {
    if (!scene || !pipelineReady) return;

    scene.traverse(function (obj) {
      if (!obj || !obj.material) return;
      var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (var m = 0; m < mats.length; m++) {
        var mat = mats[m];
        if (!mat || !mat.isShaderMaterial || mat.isRawShaderMaterial) continue;
        if (!mat.userData) mat.userData = {};
        if (mat.userData._phraxosLinearPatched) continue;

        if (!mat.uniforms) mat.uniforms = {};
        var u = mat.uniforms;
        var origVert = typeof mat.vertexShader === 'string' ? mat.vertexShader : '';
        var origFrag = typeof mat.fragmentShader === 'string' ? mat.fragmentShader : '';
        var nextVert = origVert;
        var nextFrag = origFrag;
        var changed = false;
        var usesOutMode = false;

        // 1. Aegean Sky Dome Shader
        if (u.horizonColor && u.topColor && u.uNightMix && nextFrag.indexOf('gl_FragColor = vec4(col, 1.0);') !== -1) {
          nextFrag = nextFrag.replace(
            'gl_FragColor = vec4(col, 1.0);',
            [
              'vec3 _skyBase = clamp(col, 0.0, 1.0);',
              'vec3 _skyHdr = max(col - vec3(1.0), vec3(0.0));',
              'vec3 _skyOut = (uPhxOutMode > 1.5) ? (pow(_skyBase, vec3(2.2)) + _skyHdr * 1.45) : _skyBase;',
              'gl_FragColor = vec4(_skyOut, 1.0);'
            ].join('\n')
          );
          usesOutMode = true;
          changed = true;
        }

        // 2. Aegean Sea Shader
        var waterTarget = 'gl_FragColor = vec4(mix(waterCol, glassCol, uFreeze * 0.78), 1.0);';
        if (u.uDeepColor && u.uShallowColor && u.uFreeze && nextFrag.indexOf(waterTarget) !== -1) {
          nextFrag = nextFrag.replace(
            waterTarget,
            [
              'vec3 _wMix = mix(waterCol, glassCol, uFreeze * 0.78);',
              'vec3 _wBase = clamp(_wMix, 0.0, 1.0);',
              'vec3 _wHdr = max(_wMix - vec3(1.0), vec3(0.0));',
              'vec3 _wOut = (uPhxOutMode > 1.5) ? (pow(_wBase, vec3(2.2)) + _wHdr * 1.50) : _wBase;',
              'gl_FragColor = vec4(_wOut, 1.0);'
            ].join('\n')
          );
          usesOutMode = true;
          changed = true;
        }

        // 2b. Base Terrace Brazier 4-Plane Additive Flame Shader
        var flameTarget = 'gl_FragColor = vec4(col * alpha * 1.05, alpha * 0.78);';
        if (u.uTime && u.uSeed && nextFrag.indexOf(flameTarget) !== -1) {
          nextFrag = nextFrag.replace(
            flameTarget,
            [
              'vec3 _flLin = pow(clamp(col, 0.0, 1.0), vec3(2.45)) * vec3(0.36, 0.19, 0.045);',
              'vec3 _flSrgb = clamp(col, 0.0, 1.0) * vec3(0.34, 0.21, 0.065) * alpha;',
              'gl_FragColor = vec4((uPhxOutMode > 1.5) ? _flLin : _flSrgb, alpha * 0.54);'
            ].join('\n')
          );
          usesOutMode = true;
          changed = true;
        }

        // 2c. Wonder Beacon / Sanctuary Additive Flame Shader
        var wonderFlameTarget = 'gl_FragColor = vec4(col * a, a);';
        if (u.uTime && u.uReveal && nextFrag.indexOf(wonderFlameTarget) !== -1) {
          nextFrag = nextFrag.replace(
            wonderFlameTarget,
            [
              'vec3 _wFlLin = pow(clamp(col, 0.0, 1.0), vec3(2.45)) * vec3(0.40, 0.21, 0.052);',
              'vec3 _wFlSrgb = clamp(col, 0.0, 1.0) * vec3(0.36, 0.22, 0.072) * a;',
              'gl_FragColor = vec4((uPhxOutMode > 1.5) ? _wFlLin : _wFlSrgb, a * 0.58);'
            ].join('\n')
          );
          usesOutMode = true;
          changed = true;
        }

        if (usesOutMode && nextFrag.indexOf('uniform float uPhxOutMode;') === -1) {
          nextFrag = 'uniform float uPhxOutMode;\n' + nextFrag;
          u.uPhxOutMode = sharedShaderOutMode;
        }

        // 3. Guard all GLSL pow() calls against HLSL exp2(y * log2(negative)) -> NaN
        var safeVert = sanitizeShaderPowSource(nextVert);
        var safeFrag = sanitizeShaderPowSource(nextFrag);
        if (safeVert !== nextVert || safeFrag !== nextFrag) {
          nextVert = safeVert;
          nextFrag = safeFrag;
          changed = true;
        }

        mat.userData._phraxosLinearPatched = true;
        if (changed) {
          mat.userData._origVert = origVert;
          mat.userData._origFrag = origFrag;
          mat.vertexShader = nextVert;
          mat.fragmentShader = nextFrag;
          mat.needsUpdate = true;
          patchedShaders.push(mat);
        }
      }
    });
  }

  function restorePatchedSceneShaders() {
    for (var i = 0; i < patchedShaders.length; i++) {
      var mat = patchedShaders[i];
      if (mat && mat.userData) {
        if (typeof mat.userData._origVert === 'string') {
          mat.vertexShader = mat.userData._origVert;
        }
        if (typeof mat.userData._origFrag === 'string') {
          mat.fragmentShader = mat.userData._origFrag;
        }
        mat.userData._phraxosLinearPatched = false;
        mat.needsUpdate = true;
      }
    }
    patchedShaders = [];
  }

  // ==========================================================================
  // 3. DYNAMIC 3-MODE PMREM ENVIRONMENT & CACHED ON-DEMAND SHADOWS
  // ==========================================================================
  function smoothstepScalar(edge0, edge1, x) {
    var t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3.0 - 2.0 * t);
  }

  function srgbChannelToLinear(c) {
    var v = Math.max(0.0, Math.min(1.0, c));
    return v <= 0.04045 ? (v / 12.92) : Math.pow((v + 0.055) / 1.055, 2.4);
  }

  // GPU Readback Sanity Check: verifies generated PMREM texture produces healthy non-black, non-blown-out PBR reflections
  function validatePMREMEnvironment(THREE, renderer, envTex) {
    if (!envTex || typeof renderer.readRenderTargetPixels !== 'function') return true;
    var probeRT = null;
    var probeGeo = null;
    var probeMat = null;
    var prevTarget = renderer.getRenderTarget();
    var prevTone = renderer.toneMapping;
    var prevEnc = renderer.outputEncoding;
    var prevAutoClear = renderer.autoClear;

    try {
      probeRT = new THREE.WebGLRenderTarget(8, 8, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType,
        depthBuffer: true,
        stencilBuffer: false
      });
      if (THREE.sRGBEncoding) {
        probeRT.texture.encoding = THREE.sRGBEncoding;
      }

      var probeScene = new THREE.Scene();
      probeScene.background = new THREE.Color(0x05070a);
      probeScene.environment = envTex;

      var probeCam = new THREE.PerspectiveCamera(45, 1.0, 0.1, 10.0);
      probeCam.position.set(0, 0, 2.1);
      probeCam.lookAt(0, 0, 0);

      probeGeo = new THREE.SphereGeometry(0.85, 12, 10);
      probeMat = new THREE.MeshStandardMaterial({
        color: 0xd8cfc2,
        roughness: 0.28,
        metalness: 0.62,
        envMapIntensity: 1.0
      });
      probeScene.add(new THREE.Mesh(probeGeo, probeMat));

      renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.NoToneMapping;
      if (THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.autoClear = true;
      renderer.setRenderTarget(probeRT);
      renderer.clear();
      renderer.render(probeScene, probeCam);

      var pixels = new Uint8Array(8 * 8 * 4);
      renderer.readRenderTargetPixels(probeRT, 0, 0, 8, 8, pixels);

      renderer.toneMapping = prevTone;
      renderer.outputEncoding = prevEnc;
      renderer.autoClear = prevAutoClear;
      renderer.setRenderTarget(prevTarget);

      probeGeo.dispose();
      probeMat.dispose();
      disposeTarget(probeRT);

      // Inspect central 4x4 sphere pixels (x: 2..5, y: 2..5)
      var maxChan = 0;
      var sumChan = 0;
      var sampleCount = 0;
      for (var py = 2; py <= 5; py++) {
        for (var px = 2; px <= 5; px++) {
          var idx = (py * 8 + px) * 4;
          var r = pixels[idx];
          var g = pixels[idx + 1];
          var b = pixels[idx + 2];
          var m = Math.max(r, g, b);
          if (m > maxChan) maxChan = m;
          sumChan += (r + g + b) / 3.0;
          sampleCount++;
        }
      }
      var avgChan = sampleCount > 0 ? (sumChan / sampleCount) : 0;
      return (maxChan >= 8 && avgChan <= 242);
    } catch (err) {
      try {
        renderer.toneMapping = prevTone;
        renderer.outputEncoding = prevEnc;
        renderer.autoClear = prevAutoClear;
        renderer.setRenderTarget(prevTarget);
      } catch (ignore) {}
      if (probeGeo) probeGeo.dispose();
      if (probeMat) probeMat.dispose();
      disposeTarget(probeRT);
      return false;
    }
  }

  function rebuildPMREMEnvironment(mode, ctx) {
    if (!ctx || !ctx.THREE || !ctx.renderer || !ctx.scene) return;
    var THREE = ctx.THREE;
    var renderer = ctx.renderer;
    var scene = ctx.scene;
    var preset = MODE_PRESETS[mode] || MODE_PRESETS[1];

    try {
      if (!pmremGen) {
        pmremGen = new THREE.PMREMGenerator(renderer);
        if (typeof pmremGen.compileEquirectangularShader === 'function') {
          pmremGen.compileEquirectangularShader();
        }
      }

      var envScene = new THREE.Scene();

      // IMPORTANT (Three.js r128 compatibility):
      // PMREMGenerator.fromScene() renders into an internal RGBEEncoding render target.
      // Built-in Three.js materials (MeshBasicMaterial) include <encodings_fragment> (LinearToRGBE),
      // whereas custom ShaderMaterials do NOT (causing alpha=1.0 to decode as 2^127 = +Infinity!).
      // Therefore envScene uses 100% native MeshBasicMaterial with vertex colors & safe linear HDR values.
      var cTop = new THREE.Color(preset.pmremSkyTop);
      var cMid = new THREE.Color(preset.pmremSkyMid);
      var cHor = new THREE.Color(preset.pmremHorizon);
      var cSea = new THREE.Color(preset.pmremSeaBounce);
      var cStone = new THREE.Color(preset.pmremStoneBounce);
      var sunDirVec = new THREE.Vector3().fromArray(preset.sunDir).normalize();
      var domeScale = preset.pmremDomeScale || 0.40;

      var domeRadius = 60.0;
      var domeGeo = new THREE.SphereGeometry(domeRadius, 32, 20);
      var posAttr = domeGeo.attributes.position;
      var vCount = posAttr.count;
      var domeColors = new Float32Array(vCount * 3);

      for (var vi = 0; vi < vCount; vi++) {
        var vx = posAttr.getX(vi);
        var vy = posAttr.getY(vi);
        var vz = posAttr.getZ(vi);
        var vLen = Math.hypot(vx, vy, vz) || 1.0;
        var dx = vx / vLen;
        var dy = vy / vLen;
        var dz = vz / vLen;

        var sr = 0, sg = 0, sb = 0;
        if (dy >= 0.0) {
          var tMid = smoothstepScalar(0.0, 0.30, dy);
          var tTop = smoothstepScalar(0.28, 0.92, dy);
          sr = cHor.r + (cMid.r - cHor.r) * tMid;
          sg = cHor.g + (cMid.g - cHor.g) * tMid;
          sb = cHor.b + (cMid.b - cHor.b) * tMid;

          sr = sr + (cTop.r - sr) * tTop;
          sg = sg + (cTop.g - sg) * tTop;
          sb = sb + (cTop.b - sb) * tTop;

          var dotSun = Math.max(0.0, dx * sunDirVec.x + dy * sunDirVec.y + dz * sunDirVec.z);
          var sunHalo = Math.pow(dotSun, 7.0) * 0.42;
          sr += cHor.r * sunHalo;
          sg += cHor.g * sunHalo;
          sb += cHor.b * sunHalo;
        } else {
          var down = Math.min(1.0, -dy);
          var tGround = smoothstepScalar(0.0, 0.48, down);
          // Blend turquoise cove bounce (-z) and warm limestone terrace bounce (+z)
          var stoneWeight = 0.35 + 0.35 * smoothstepScalar(-0.6, 0.6, dz);
          var gr = cSea.r * (1.0 - stoneWeight) + cStone.r * stoneWeight;
          var gg = cSea.g * (1.0 - stoneWeight) + cStone.g * stoneWeight;
          var gb = cSea.b * (1.0 - stoneWeight) + cStone.b * stoneWeight;

          sr = cHor.r * 0.68 + (gr - cHor.r * 0.68) * tGround;
          sg = cHor.g * 0.68 + (gg - cHor.g * 0.68) * tGround;
          sb = cHor.b * 0.68 + (gb - cHor.b * 0.68) * tGround;
        }

        // Convert sRGB palette to linear radiance and keep strictly positive (>= 0.004) for clean RGBE log2()
        var lr = Math.max(0.004, srgbChannelToLinear(sr) * domeScale);
        var lg = Math.max(0.004, srgbChannelToLinear(sg) * domeScale);
        var lb = Math.max(0.004, srgbChannelToLinear(sb) * domeScale);

        domeColors[vi * 3] = lr;
        domeColors[vi * 3 + 1] = lg;
        domeColors[vi * 3 + 2] = lb;
      }

      domeGeo.setAttribute('color', new THREE.Float32BufferAttribute(domeColors, 3));
      var domeMat = new THREE.MeshBasicMaterial({
        vertexColors: true,
        side: THREE.BackSide,
        depthWrite: false
      });
      var domeMesh = new THREE.Mesh(domeGeo, domeMat);
      envScene.add(domeMesh);

      // Soft Solar / Lunar Corona + Crisp Specular Disc along mode solar vector
      var sunCol = new THREE.Color(preset.pmremSunCol);
      var sunLinR = srgbChannelToLinear(sunCol.r);
      var sunLinG = srgbChannelToLinear(sunCol.g);
      var sunLinB = srgbChannelToLinear(sunCol.b);

      var coronaGeo = new THREE.SphereGeometry(10.5, 16, 12);
      var coronaMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          Math.max(0.01, sunLinR * preset.pmremSunIntensity * 0.42),
          Math.max(0.01, sunLinG * preset.pmremSunIntensity * 0.42),
          Math.max(0.01, sunLinB * preset.pmremSunIntensity * 0.42)
        )
      });
      var coronaMesh = new THREE.Mesh(coronaGeo, coronaMat);
      coronaMesh.position.copy(sunDirVec).multiplyScalar(51.0);
      envScene.add(coronaMesh);

      var sunDiscGeo = new THREE.SphereGeometry(4.8, 16, 14);
      var sunHdrMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          Math.max(0.02, sunLinR * preset.pmremSunIntensity),
          Math.max(0.02, sunLinG * preset.pmremSunIntensity),
          Math.max(0.02, sunLinB * preset.pmremSunIntensity)
        )
      });
      var sunDisc = new THREE.Mesh(sunDiscGeo, sunHdrMat);
      sunDisc.position.copy(sunDirVec).multiplyScalar(46.0);
      envScene.add(sunDisc);

      // 4 Warm Terrace Brazier Firelight Bounce Nodes around lower horizon
      var fireGeo = new THREE.SphereGeometry(3.1, 12, 12);
      var fireI = preset.pmremFireIntensity;
      var fireMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          Math.max(0.01, 1.00 * fireI),
          Math.max(0.01, 0.44 * fireI),
          Math.max(0.01, 0.10 * fireI)
        )
      });
      var fireAngles = [0.65, 2.35, -0.75, -2.45];
      for (var f = 0; f < fireAngles.length; f++) {
        var fm = new THREE.Mesh(fireGeo, fireMat);
        fm.position.set(
          Math.cos(fireAngles[f]) * 34.0,
          3.2,
          Math.sin(fireAngles[f]) * 34.0
        );
        envScene.add(fm);
      }

      // Turquoise Aegean Cove Specular Bounce Patch
      var seaPatchGeo = new THREE.SphereGeometry(6.5, 12, 12);
      var seaPatchMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(
          Math.max(0.01, srgbChannelToLinear(cSea.r) * 1.15),
          Math.max(0.01, srgbChannelToLinear(cSea.g) * 1.30),
          Math.max(0.01, srgbChannelToLinear(cSea.b) * 1.45)
        )
      });
      var seaPatch = new THREE.Mesh(seaPatchGeo, seaPatchMat);
      seaPatch.position.set(6.0, -24.0, -26.0);
      envScene.add(seaPatch);

      var prevTarget = renderer.getRenderTarget();
      var prevTone = renderer.toneMapping;
      var prevEnc = renderer.outputEncoding;
      var prevAutoClear = renderer.autoClear;

      var newEnvRT = pmremGen.fromScene(envScene, 0.035);

      renderer.toneMapping = prevTone;
      renderer.outputEncoding = prevEnc;
      renderer.autoClear = prevAutoClear;
      renderer.setRenderTarget(prevTarget);

      // Dispose temporary envScene geometries & materials cleanly
      domeGeo.dispose();
      domeMat.dispose();
      coronaGeo.dispose();
      coronaMat.dispose();
      sunDiscGeo.dispose();
      sunHdrMat.dispose();
      fireGeo.dispose();
      fireMat.dispose();
      seaPatchGeo.dispose();
      seaPatchMat.dispose();

      // Verify generated PMREM environment on GPU before binding to scene.environment
      if (newEnvRT && newEnvRT.texture && validatePMREMEnvironment(THREE, renderer, newEnvRT.texture)) {
        if (activeEnvRT && activeEnvRT !== newEnvRT) {
          disposeTarget(activeEnvRT);
        }
        activeEnvRT = newEnvRT;
        scene.environment = newEnvRT.texture;
      } else {
        disposeTarget(newEnvRT);
        if (!activeEnvRT) {
          scene.environment = null;
        }
      }
    } catch (e) {
      // Safe fallback if PMREM fails on legacy WebGL1 hardware
    }
  }

  function resolveSunLight(ctx) {
    if (ctx && ctx.sunLight) return ctx.sunLight;
    var found = null;
    if (ctx && ctx.scene) {
      ctx.scene.traverse(function (obj) {
        if (!found && obj.isDirectionalLight && obj.castShadow) {
          found = obj;
        }
      });
    }
    return found;
  }

  function upgradeDirectionalShadows(ctx) {
    var sunLight = resolveSunLight(ctx);
    if (!sunLight || !sunLight.shadow) return;
    var THREE = ctx.THREE;

    if (ctx.renderer && ctx.renderer.shadowMap) {
      ctx.renderer.shadowMap.enabled = true;
      // Keep shadowMap.autoUpdate permanently disabled; rebake strictly on-demand
      ctx.renderer.shadowMap.autoUpdate = false;
      if (THREE && THREE.PCFSoftShadowMap) {
        ctx.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      }
    }

    var targetSize = (qualityMode === 'ultra') ? 1536 : 1024;
    if (sunLight.shadow.mapSize.width !== targetSize || sunLight.shadow.mapSize.height !== targetSize) {
      sunLight.shadow.mapSize.width = targetSize;
      sunLight.shadow.mapSize.height = targetSize;
      if (sunLight.shadow.map) {
        sunLight.shadow.map.dispose();
        sunLight.shadow.map = null;
      }
      shadowBakedOnce = false;
    }

    sunLight.shadow.radius = 2.0;
    sunLight.shadow.bias = -0.0005;
    if ('normalBias' in sunLight.shadow) {
      sunLight.shadow.normalBias = 0.02;
    }

    var cam = sunLight.shadow.camera;
    if (cam) {
      cam.near = 2.0;
      cam.far = 122.0;
      cam.left = -30.0;
      cam.right = 30.0;
      cam.top = 34.0;
      cam.bottom = -34.0;
      cam.updateProjectionMatrix();
    }

    if (sunLight.target && ctx.scene && !sunLight.target.parent) {
      ctx.scene.add(sunLight.target);
    }
  }

  function requestImmediateShadowBake(ctx) {
    shadowBakedOnce = false;
    if (ctx && ctx.renderer && ctx.renderer.shadowMap) {
      ctx.renderer.shadowMap.autoUpdate = false;
    }
  }

  function updateShadowFrustumTracking(ctx, anchorX, anchorZ) {
    var sunLight = resolveSunLight(ctx);
    if (!sunLight || !ctx.camera) return;

    var preset = MODE_PRESETS[currentMode] || MODE_PRESETS[1];
    var focusX = anchorX * 0.55;
    var focusZ = anchorZ;

    // Snap shadow target to 0.05m increments so Doric column flutes remain rock-steady
    var snap = 0.05;
    focusX = Math.round(focusX / snap) * snap;
    focusZ = Math.round(focusZ / snap) * snap;

    var sdx = preset.sunDir[0];
    var sdy = Math.max(0.34, preset.sunDir[1]);
    var sdz = preset.sunDir[2];
    var len = Math.hypot(sdx, sdy, sdz) || 1.0;
    var dist = 48.0;

    sunLight.target.position.set(focusX, 0.45, focusZ);
    sunLight.target.updateMatrixWorld();
    sunLight.position.set(
      focusX + (sdx / len) * dist,
      0.45 + (sdy / len) * dist,
      focusZ + (sdz / len) * dist
    );
    sunLight.updateMatrixWorld();
  }

  function evaluateOnDemandShadowBake(ctx, nowMs) {
    if (!ctx || !ctx.renderer || !ctx.renderer.shadowMap) return;
    ctx.renderer.shadowMap.autoUpdate = false;

    var inIntro = (typeof ctx.inIntro === 'function') ? ctx.inIntro() : false;
    var px = (inIntro || !ctx.player) ? 0.0 : (ctx.player.x || 0.0);
    var pz = (inIntro || !ctx.player) ? 10.5 : (ctx.player.z || 8.5);

    // Track Wonder discoveries & live altar solve choreography
    var discSet = (typeof ctx.getDiscoveredSet === 'function') ? ctx.getDiscoveredSet() : null;
    var discCount = (discSet && typeof discSet.size === 'number') ? discSet.size : 0;
    var forceBake = !shadowBakedOnce;

    if (lastDiscoveredCount < 0) {
      lastDiscoveredCount = discCount;
    } else if (discCount !== lastDiscoveredCount) {
      var deltaDisc = discCount - lastDiscoveredCount;
      lastDiscoveredCount = discCount;
      forceBake = true;
      // Single live Wonder unlock rises over ~4.5s; bulk save/test load settles immediately
      if (deltaDisc === 1 || deltaDisc === 2) {
        wonderEmergenceUntilMs = nowMs + 4500;
      }
    }

    var wg = ctx.wonderGroups;
    var isLiveSolve = !!(wg && typeof wg.solveTimer === 'number' && wg.solveTimer > 0.01);
    var inEmergenceWindow = isLiveSolve || (nowMs < wonderEmergenceUntilMs);

    var movedDist = Math.hypot(px - lastShadowAnchorX, pz - lastShadowAnchorZ);
    var movedBeyondStep = movedDist > 4.0;
    var emergenceTickDue = inEmergenceWindow && ((nowMs - lastShadowUpdateMs) >= 100.0);

    if (forceBake || movedBeyondStep || emergenceTickDue) {
      lastShadowAnchorX = px;
      lastShadowAnchorZ = pz;
      lastShadowUpdateMs = nowMs;
      shadowBakedOnce = true;
      updateShadowFrustumTracking(ctx, px, pz);
      ctx.renderer.shadowMap.needsUpdate = true;
      perfStats.shadowUpdatesCount++;
    }
  }

  // ==========================================================================
  // 4. SOFT PARTICLE SPRITES & ARCHITECTURE PBR MATERIAL POLISH
  // ==========================================================================
  function ensureSharedTextures(THREE) {
    if (!sharedTextures.moteSprite) {
      sharedTextures.moteSprite = createGaussianSpriteTexture(THREE, {
        sigma: 4.8,
        core: [255, 253, 240],
        mid: [253, 226, 132],
        outer: [242, 178, 72]
      }, 128);
    }
    if (!sharedTextures.emberSprite) {
      sharedTextures.emberSprite = createGaussianSpriteTexture(THREE, {
        sigma: 5.2,
        core: [255, 252, 235],
        mid: [255, 162, 38],
        outer: [232, 64, 12]
      }, 128);
    }
    if (!sharedTextures.stoneRoughness) {
      sharedTextures.stoneRoughness = createProceduralRoughnessMap(THREE, 'stone', 4);
    }
    if (!sharedTextures.metalRoughness) {
      sharedTextures.metalRoughness = createProceduralRoughnessMap(THREE, 'metal', 2);
    }
    if (!sharedTextures.organicRoughness) {
      sharedTextures.organicRoughness = createProceduralRoughnessMap(THREE, 'organic', 3);
    }
  }

  function upgradeParticleSystems(ctx) {
    var THREE = ctx.THREE;
    ensureSharedTextures(THREE);

    function polishPoints(pts, isEmber) {
      if (!pts || !pts.material) return;
      var mat = pts.material;
      mat.map = isEmber ? sharedTextures.emberSprite : sharedTextures.moteSprite;
      mat.transparent = true;
      mat.alphaTest = 0.005;
      mat.depthWrite = false;
      mat.sizeAttenuation = true;
      mat.blending = THREE.AdditiveBlending;
      if (isEmber) {
        mat.color.setHex(0xffbe55);
        mat.size = 0.28;
        mat.opacity = 0.95;
      } else {
        mat.color.setHex(0xfef08a);
        mat.size = 0.24;
        mat.opacity = 0.78;
      }
      mat.needsUpdate = true;
    }

    if (ctx.dustParticles) {
      polishPoints(ctx.dustParticles, false);
    }
    if (ctx.emberParticles) {
      polishPoints(ctx.emberParticles, true);
    }

    // Also discover any un-textured Points in ctx.scene so zero square pixels remain
    if (ctx.scene) {
      ctx.scene.traverse(function (obj) {
        if (!obj.isPoints || !obj.material) return;
        if (obj === ctx.dustParticles || obj === ctx.emberParticles) return;
        if (!obj.material.map && obj.material.isPointsMaterial) {
          var colHex = obj.material.color ? obj.material.color.getHex() : 0xfde68a;
          var looksLikeEmber = (colHex === 0xffa834 || colHex === 0xff7718 || colHex === 0xff4500);
          polishPoints(obj, looksLikeEmber);
        }
      });
    }
  }

  function isExternalSpecialistObject(obj) {
    var cur = obj;
    while (cur) {
      var n = cur.name || '';
      if (
        n.indexOf('PhraxosMachinery') !== -1 ||
        n.indexOf('PhraxosNarrative') !== -1 ||
        n.indexOf('PhraxosWonders') !== -1 ||
        n.indexOf('PhraxosCaique') !== -1
      ) {
        return true;
      }
      cur = cur.parent;
    }
    return false;
  }

  function polishArchitecturePBR(ctx) {
    if (!ctx || !ctx.scene || !ctx.THREE) return;
    ensureSharedTextures(ctx.THREE);

    var visitedMats = new Set();

    ctx.scene.traverse(function (obj) {
      if (!obj.isMesh || !obj.material) return;
      if (isExternalSpecialistObject(obj)) return;

      var uData = obj.userData || {};
      var isTabletOrSlot = (uData.interactType === 'rack_tablet' || uData.interactType === 'slot');

      var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      for (var i = 0; i < mats.length; i++) {
        var mat = mats[i];
        if (!mat || !mat.isMeshStandardMaterial) continue;
        if (visitedMats.has(mat)) continue;
        visitedMats.add(mat);

        // Keep carved word tablets & altar sockets matte-honed and glare-free for 100% text clarity in all lighting modes
        if (isTabletOrSlot) {
          mat.roughness = 0.78;
          mat.metalness = 0.04;
          mat.envMapIntensity = 0.22;
          if (!mat.roughnessMap) {
            mat.roughnessMap = sharedTextures.stoneRoughness;
            mat.needsUpdate = true;
          }
          continue;
        }

        var emHex = mat.emissive ? mat.emissive.getHex() : 0x000000;
        var colHex = mat.color ? mat.color.getHex() : 0xffffff;

        // 1. Tame harsh cartoon-neon matGoldGlow (0xd97706) -> Warm Metallic Gilt
        if (emHex === 0xd97706 && mat.emissiveIntensity >= 1.2) {
          mat.color.setHex(0xf5d076);
          mat.emissive.setHex(0xc97310);
          mat.emissiveIntensity = 0.90;
          mat.metalness = 0.58;
          mat.roughness = 0.24;
          mat.envMapIntensity = 1.35;
          mat.roughnessMap = sharedTextures.metalRoughness;
          mat.needsUpdate = true;
          continue;
        }

        // 2. Tame harsh cartoon-neon matCyanGlow (0x0284c7) -> Refined Aegean Sea-Glass / Aquamarine
        if (emHex === 0x0284c7 && mat.emissiveIntensity >= 1.1) {
          mat.color.setHex(0x67e8f9);
          mat.emissive.setHex(0x0e7490);
          mat.emissiveIntensity = 0.78;
          mat.metalness = 0.32;
          mat.roughness = 0.18;
          mat.envMapIntensity = 1.45;
          mat.roughnessMap = sharedTextures.stoneRoughness;
          mat.needsUpdate = true;
          continue;
        }

        // 3. Hot Brazier Coals (0xff2a00) -> Deep smoldering cherry-amber coals (never flat yellow-white)
        if (emHex === 0xff2a00) {
          mat.color.setHex(0x240b05);
          mat.emissive.setHex(0xd93800);
          mat.emissiveIntensity = 0.72;
          mat.roughness = 0.88;
          mat.metalness = 0.04;
          mat.envMapIntensity = 0.18;
          if (!mat.roughnessMap) {
            mat.roughnessMap = sharedTextures.organicRoughness;
          }
          mat.needsUpdate = true;
          continue;
        }

        // Ensure procedural CanvasTexture albedo maps decode as sRGB in our Linear HDR pipeline
        // so marble veins, ashlar mortar lines & travertine pores keep full micro-contrast
        if (mat.map && ctx.THREE.sRGBEncoding && mat.map.encoding !== ctx.THREE.sRGBEncoding) {
          mat.map.encoding = ctx.THREE.sRGBEncoding;
          mat.map.needsUpdate = true;
        }

        // 4. Polished Antique Brass & Bronze (matBrass: metalness > 0.6)
        if (mat.metalness >= 0.6) {
          mat.roughness = 0.26;
          mat.metalness = 0.88;
          mat.envMapIntensity = 1.28;
          if (!mat.roughnessMap) {
            mat.roughnessMap = sharedTextures.metalRoughness;
            mat.needsUpdate = true;
          }
          continue;
        }

        // 5. Aegean Painted Wood Shutters (0x1e5b7a)
        if (colHex === 0x1e5b7a) {
          mat.roughness = 0.48;
          mat.metalness = 0.08;
          mat.envMapIntensity = 0.68;
          if (!mat.roughnessMap) {
            mat.roughnessMap = sharedTextures.stoneRoughness;
            mat.needsUpdate = true;
          }
          continue;
        }

        // 6. Pentelic Marble, Whitewashed Villa Limewash, Travertine, Limestone, Terracotta, Cliffs & Foliage
        if (colHex === 0xf8fafc || (mat.color && mat.color.r > 0.94 && mat.color.g > 0.94 && mat.color.b > 0.94 && !mat.map)) {
          // Physical Cycladic limewash albedo (~0.82) so direct sunlight + portico lights never bleach Villa walls
          mat.color.setHex(0xece6da);
        }
        if (!mat.roughnessMap) {
          if (mat.roughness <= 0.35) {
            // Pentelic Column & Villa Marble
            if (colHex === 0xffffff) {
              mat.color.setHex(0xf1ece1);
            }
            mat.roughness = 0.32;
            mat.metalness = 0.05;
            mat.envMapIntensity = 0.56;
            mat.roughnessMap = sharedTextures.stoneRoughness;
          } else if (mat.roughness >= 0.70) {
            // Cypress, Olive Foliage, Bark & Karst Sea-Cliffs
            mat.envMapIntensity = 0.38;
            mat.roughnessMap = sharedTextures.organicRoughness;
          } else {
            // Honed Limestone, Travertine Flagstones & Terracotta Amphorae
            mat.envMapIntensity = 0.48;
            mat.roughnessMap = sharedTextures.stoneRoughness;
          }
          mat.needsUpdate = true;
        }
      }
    });
  }

  // ==========================================================================
  // 5. TRADITIONAL WOODEN GREEK CAÏQUE (TREHANDIRI) IN THE TURQUOISE COVE
  // ==========================================================================
  function removeLegacyCylinderBoat(ctx) {
    if (!ctx || !ctx.scene) return;
    var toRemove = [];

    if (ctx.coveBoat && ctx.coveBoat.parent) {
      toRemove.push(ctx.coveBoat);
    }

    // Locate the legacy sideways-cylinder coveBoat at (8.5, -0.22, -6.5)
    for (var i = 0; i < ctx.scene.children.length; i++) {
      var child = ctx.scene.children[i];
      if (!child || !child.isGroup || child.name === 'PhraxosCaiqueRoot') continue;
      var dx = child.position.x - 8.5;
      var dz = child.position.z - (-6.5);
      if (Math.hypot(dx, dz) < 1.8 && Math.abs(child.position.y - (-0.22)) < 0.8) {
        toRemove.push(child);
      }
    }

    for (var r = 0; r < toRemove.length; r++) {
      var old = toRemove[r];
      old.visible = false;
      old.traverse(function (node) {
        if (node.isMesh) {
          node.visible = false;
          node.castShadow = false;
          node.receiveShadow = false;
        }
      });
      if (old.parent) {
        old.parent.remove(old);
      }
    }
  }

  // Analytic Trehandiri hull surface functions so hull, ribs, decks & thwarts fit with zero clipping
  function hullParamsAt(s) {
    var absS = Math.min(1.0, Math.abs(s));
    var beamFactor = Math.pow(Math.max(0.0, 1.0 - Math.pow(absS, 2.12)), 0.66);
    var halfBeam = 0.88 * beamFactor;
    var keelY = -0.42 * (1.0 - 0.34 * absS * absS);
    var bowLift = 0.32 * Math.pow(Math.max(0.0, s), 1.65);
    var sternLift = 0.25 * Math.pow(Math.max(0.0, -s), 1.75);
    var sheerY = 0.38 + bowLift + sternLift;
    return {
      absS: absS,
      halfBeam: halfBeam,
      keelY: keelY,
      sheerY: sheerY
    };
  }

  function evalHullPoint(s, v, side, inset) {
    var p = hullParamsAt(s);
    // Plump rounded Aegean bilge with subtle classical tumblehome at gunwale
    var widthCurve = Math.sin(v * Math.PI * 0.54) * (0.93 + 0.07 * v);
    var heightCurve = Math.pow(v, 1.26);

    var rawHalfW = 0.022 + p.halfBeam * widthCurve;
    var w = Math.max(0.008, rawHalfW - (inset || 0.0) * (0.35 + 0.65 * v));
    var y = p.keelY + (inset ? inset * 0.65 * (1.0 - v) : 0.0) + (p.sheerY - p.keelY) * heightCurve;

    // Classic raked Greek stempost (+z) and sternpost (-z) overhang
    var zSpan = 2.06 + Math.pow(v, 1.32) * 0.64;
    var z = s * zSpan;

    return { x: side * w, y: y, z: z };
  }

  function buildLoftedTrehandiriHullGeometry(THREE) {
    var segS = 32; // stern to bow
    var segV = 16; // keel to sheer
    var positions = [];
    var uvs = [];
    var indices = [];

    function addShell(side, inset, flipWinding) {
      var baseVert = positions.length / 3;
      for (var i = 0; i <= segS; i++) {
        var u = i / segS;
        var s = u * 2.0 - 1.0;
        for (var j = 0; j <= segV; j++) {
          var v = j / segV;
          var pt = evalHullPoint(s, v, side, inset);
          positions.push(pt.x, pt.y, pt.z);
          uvs.push(u, v);
        }
      }

      var stride = segV + 1;
      for (var si = 0; si < segS; si++) {
        for (var vj = 0; vj < segV; vj++) {
          var a = baseVert + si * stride + vj;
          var b = a + 1;
          var c = baseVert + (si + 1) * stride + vj;
          var d = c + 1;
          // Starboard (+1) outer: (a, b, c) & (c, b, d) => outward +x normal
          var starboardOuter = (side > 0) !== !!flipWinding;
          if (starboardOuter) {
            indices.push(a, b, c, c, b, d);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
      return baseVert;
    }

    var sbOuter = addShell(1, 0.0, false);
    var ptOuter = addShell(-1, 0.0, false);
    var sbInner = addShell(1, 0.058, true);
    var ptInner = addShell(-1, 0.058, true);

    // Bridge top gunwale rim (j = segV) between outer and inner shells so planks have solid thickness
    var stride = segV + 1;
    for (var i = 0; i < segS; i++) {
      // Starboard gunwale cap (+y normal)
      var so0 = sbOuter + i * stride + segV;
      var so1 = sbOuter + (i + 1) * stride + segV;
      var si0 = sbInner + i * stride + segV;
      var si1 = sbInner + (i + 1) * stride + segV;
      indices.push(so0, si0, so1, so1, si0, si1);

      // Port gunwale cap (+y normal)
      var po0 = ptOuter + i * stride + segV;
      var po1 = ptOuter + (i + 1) * stride + segV;
      var pi0 = ptInner + i * stride + segV;
      var pi1 = ptInner + (i + 1) * stride + segV;
      indices.push(po0, po1, pi0, pi0, po1, pi1);

      // Keel bottom stitch (j = 0) between starboard & port outer shells
      var sk0 = sbOuter + i * stride;
      var sk1 = sbOuter + (i + 1) * stride;
      var pk0 = ptOuter + i * stride;
      var pk1 = ptOuter + (i + 1) * stride;
      indices.push(sk0, sk1, pk0, pk0, sk1, pk1);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  // Build fitted foredeck / aft deck or bilge floorboard slab clipped cleanly to inner hull beam
  function buildFittedDeckGeometry(THREE, sStart, sEnd, vLevel, steps) {
    var count = steps || 10;
    var pos = [];
    var uvs = [];
    var idx = [];

    for (var i = 0; i <= count; i++) {
      var t = i / count;
      var s = sStart + (sEnd - sStart) * t;
      var pL = evalHullPoint(s, vLevel, -1, 0.052);
      var pR = evalHullPoint(s, vLevel, 1, 0.052);
      // Slight camber crown along centerline
      var pC = {
        x: 0,
        y: (pL.y + pR.y) * 0.5 + 0.022,
        z: (pL.z + pR.z) * 0.5
      };
      pos.push(pL.x, pL.y, pL.z);
      pos.push(pC.x, pC.y, pC.z);
      pos.push(pR.x, pR.y, pR.z);

      uvs.push(0.0, t * 2.0);
      uvs.push(0.5, t * 2.0);
      uvs.push(1.0, t * 2.0);
    }

    for (var r = 0; r < count; r++) {
      var b0 = r * 3;
      var b1 = (r + 1) * 3;
      // Port half (+y normal)
      idx.push(b0, b1, b0 + 1);
      idx.push(b0 + 1, b1, b1 + 1);
      // Starboard half (+y normal)
      idx.push(b0 + 1, b1 + 1, b0 + 2);
      idx.push(b0 + 2, b1 + 1, b1 + 2);
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }

  function updateDynamicMooringGeometry(THREE, startWorld, endWorld) {
    if (!mooringGeo) return;
    var radialSegs = 6;
    var tubularSegs = 18;
    var radius = 0.024;
    var posAttr = mooringGeo.attributes.position;
    var arr = posAttr.array;

    for (var i = 0; i <= tubularSegs; i++) {
      var t = i / tubularSegs;
      // Natural catenary slack dipping gently toward the cove surface
      var sag = Math.sin(t * Math.PI) * 0.34;
      var cx = startWorld.x + (endWorld.x - startWorld.x) * t;
      var cy = startWorld.y + (endWorld.y - startWorld.y) * t - sag;
      var cz = startWorld.z + (endWorld.z - startWorld.z) * t;

      // Tangent approx along rope
      var tx = endWorld.x - startWorld.x;
      var ty = (endWorld.y - startWorld.y) - Math.cos(t * Math.PI) * Math.PI * 0.34;
      var tz = endWorld.z - startWorld.z;
      var tLen = Math.hypot(tx, ty, tz) || 1.0;
      tx /= tLen; ty /= tLen; tz /= tLen;

      // Orthonormal frame around rope tangent (up = (0, 1, 0))
      var nx = tz;
      var ny = 0;
      var nz = -tx;
      var nLen = Math.hypot(nx, nz) || 1.0;
      nx /= nLen; nz /= nLen;

      var bx = ty * nz - tz * ny;
      var by = tz * nx - tx * nz;
      var bz = tx * ny - ty * nx;

      for (var r = 0; r <= radialSegs; r++) {
        var ang = (r / radialSegs) * Math.PI * 2;
        var cosA = Math.cos(ang);
        var sinA = Math.sin(ang);
        var vIdx = (i * (radialSegs + 1) + r) * 3;
        arr[vIdx] = cx + (nx * cosA + bx * sinA) * radius;
        arr[vIdx + 1] = cy + (ny * cosA + by * sinA) * radius;
        arr[vIdx + 2] = cz + (nz * cosA + bz * sinA) * radius;
      }
    }
    posAttr.needsUpdate = true;
    mooringGeo.computeVertexNormals();
  }

  function buildAegeanCaique(ctx) {
    var THREE = ctx.THREE;
    var scene = ctx.scene;
    if (!THREE || !scene) return;

    removeLegacyCylinderBoat(ctx);
    ensureSharedTextures(THREE);

    caiqueRoot = new THREE.Group();
    caiqueRoot.name = 'PhraxosCaiqueRoot';
    scene.add(caiqueRoot);

    var hullPBR = createCaiqueHullTextures(THREE);
    var sailTex = createCanvasSailTexture(THREE);
    var rippleTex = createWaterlineRippleTexture(THREE);

    var matHull = new THREE.MeshStandardMaterial({
      map: hullPBR.map,
      normalMap: hullPBR.normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughnessMap: sharedTextures.stoneRoughness,
      roughness: 0.48,
      metalness: 0.05,
      envMapIntensity: 0.92
    });

    var matOakTimber = new THREE.MeshStandardMaterial({
      color: 0x6b4226,
      roughnessMap: sharedTextures.organicRoughness,
      roughness: 0.66,
      metalness: 0.04,
      envMapIntensity: 0.65
    });

    var matTeakDeck = new THREE.MeshStandardMaterial({
      color: 0xa6713d,
      roughnessMap: sharedTextures.organicRoughness,
      roughness: 0.58,
      metalness: 0.04,
      envMapIntensity: 0.72
    });

    var matCycladicBlue = new THREE.MeshStandardMaterial({
      color: 0x1b5e8c,
      roughnessMap: sharedTextures.stoneRoughness,
      roughness: 0.44,
      metalness: 0.08,
      envMapIntensity: 0.88
    });

    var matOchreTrim = new THREE.MeshStandardMaterial({
      color: 0xd99326,
      roughnessMap: sharedTextures.stoneRoughness,
      roughness: 0.42,
      metalness: 0.12,
      envMapIntensity: 0.92
    });

    var matSpruceSpar = new THREE.MeshStandardMaterial({
      color: 0xb57c43,
      roughnessMap: sharedTextures.organicRoughness,
      roughness: 0.46,
      metalness: 0.05,
      envMapIntensity: 0.80
    });

    var matCanvasSail = new THREE.MeshStandardMaterial({
      map: sailTex,
      roughnessMap: sharedTextures.organicRoughness,
      roughness: 0.84,
      metalness: 0.01,
      envMapIntensity: 0.42
    });

    var matHempRope = new THREE.MeshStandardMaterial({
      color: 0xb99c6b,
      roughnessMap: sharedTextures.organicRoughness,
      roughness: 0.88,
      metalness: 0.02
    });

    var matNauticalBrass = new THREE.MeshStandardMaterial({
      color: 0xdca03d,
      roughnessMap: sharedTextures.metalRoughness,
      roughness: 0.24,
      metalness: 0.88,
      envMapIntensity: 1.38
    });

    // ------------------------------------------------------------------------
    // A. Coastal Stone & Weathered Iron Mooring Bollard on Promontory I Ledge
    // ------------------------------------------------------------------------
    var bollardGroup = new THREE.Group();
    bollardGroup.position.set(BOLLARD_POS.x, BOLLARD_POS.y, BOLLARD_POS.z);
    caiqueRoot.add(bollardGroup);

    var matBollardStone = new THREE.MeshStandardMaterial({
      color: 0xcab899,
      roughnessMap: sharedTextures.stoneRoughness,
      roughness: 0.72,
      metalness: 0.04
    });
    var matWeatheredIron = new THREE.MeshStandardMaterial({
      color: 0x3b332e,
      roughnessMap: sharedTextures.metalRoughness,
      roughness: 0.52,
      metalness: 0.72
    });

    var bPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.46, 0.34, 14), matBollardStone);
    bPlinth.position.y = 0.08;
    bPlinth.castShadow = true;
    bPlinth.receiveShadow = true;
    bollardGroup.add(bPlinth);

    var bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, 0.44, 14), matWeatheredIron);
    bPost.position.y = 0.42;
    bPost.castShadow = true;
    bollardGroup.add(bPost);

    var bCap = new THREE.Mesh(new THREE.SphereGeometry(0.155, 14, 10), matWeatheredIron);
    bCap.scale.set(1.0, 0.65, 1.0);
    bCap.position.y = 0.64;
    bollardGroup.add(bCap);

    // Coiled rope wraps around the bollard post
    for (var rw = 0; rw < 3; rw++) {
      var wrap = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.024, 8, 18), matHempRope);
      wrap.rotation.x = Math.PI * 0.5;
      wrap.position.y = 0.34 + rw * 0.05;
      bollardGroup.add(wrap);
    }

    mooringBollardTip = new THREE.Vector3(BOLLARD_POS.x, BOLLARD_POS.y + 0.42, BOLLARD_POS.z);

    // ------------------------------------------------------------------------
    // B. Waterline Elliptical Sea-Ripple Collar (hugs water plane at y = -0.365)
    // ------------------------------------------------------------------------
    var rippleGeo = new THREE.PlaneGeometry(6.8, 6.8);
    rippleGeo.rotateX(-Math.PI * 0.5);
    var rippleMat = new THREE.MeshBasicMaterial({
      map: rippleTex,
      transparent: true,
      opacity: 0.68,
      depthWrite: false
    });
    caiqueRippleMesh = new THREE.Mesh(rippleGeo, rippleMat);
    caiqueRippleMesh.position.set(CAIQUE_ANCHOR.x, -0.365, CAIQUE_ANCHOR.z);
    caiqueRippleMesh.rotation.y = CAIQUE_ANCHOR.yaw;
    caiqueRoot.add(caiqueRippleMesh);

    // ------------------------------------------------------------------------
    // C. Main Sculpted Caïque Vessel Group (Moored at y = -0.34)
    // ------------------------------------------------------------------------
    caiqueVessel = new THREE.Group();
    caiqueVessel.position.set(CAIQUE_ANCHOR.x, CAIQUE_ANCHOR.y, CAIQUE_ANCHOR.z);
    caiqueVessel.rotation.y = CAIQUE_ANCHOR.yaw;
    caiqueRoot.add(caiqueVessel);

    // 1. Double-Walled Curved Trehandiri Hull
    var hullGeo = buildLoftedTrehandiriHullGeometry(THREE);
    var hullMesh = new THREE.Mesh(hullGeo, matHull);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    caiqueVessel.add(hullMesh);

    // 2. Curved External Keel, Bow Stempost (Koraki) & Sternpost Spine
    var spinePts = [
      new THREE.Vector3(0, 0.88, -2.76),
      new THREE.Vector3(0, 0.52, -2.58),
      new THREE.Vector3(0, -0.28, -2.02),
      new THREE.Vector3(0, -0.45, -1.05),
      new THREE.Vector3(0, -0.46, 0.0),
      new THREE.Vector3(0, -0.44, 1.10),
      new THREE.Vector3(0, -0.26, 2.04),
      new THREE.Vector3(0, 0.58, 2.64),
      new THREE.Vector3(0, 1.06, 2.82)
    ];
    var spineCurve = new THREE.CatmullRomCurve3(spinePts);
    var spineGeo = new THREE.TubeGeometry(spineCurve, 44, 0.048, 8, false);
    var spineMesh = new THREE.Mesh(spineGeo, matOakTimber);
    spineMesh.castShadow = true;
    spineMesh.receiveShadow = true;
    caiqueVessel.add(spineMesh);

    // Traditional Painted Finial Cap & Rope Ring (Kouloura) on Bow Stempost
    var stemFinial = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), matOchreTrim);
    stemFinial.position.set(0, 1.08, 2.82);
    caiqueVessel.add(stemFinial);

    var bowKouloura = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.022, 8, 18), matHempRope);
    bowKouloura.position.set(0, 0.88, 2.74);
    bowKouloura.rotation.x = 0.35;
    caiqueVessel.add(bowKouloura);

    // Sculpted Stern Rudder Blade & Curved Wooden Tiller
    var rudderBlade = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.72, 0.34), matOakTimber);
    rudderBlade.position.set(0, 0.08, -2.68);
    rudderBlade.rotation.x = -0.18;
    rudderBlade.castShadow = true;
    caiqueVessel.add(rudderBlade);

    var tillerCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.74, -2.72),
      new THREE.Vector3(0, 0.78, -2.35),
      new THREE.Vector3(0, 0.70, -1.92)
    ]);
    var tillerMesh = new THREE.Mesh(new THREE.TubeGeometry(tillerCurve, 12, 0.024, 8, false), matSpruceSpar);
    caiqueVessel.add(tillerMesh);

    // 3. Curved Cycladic Blue & Ochre Gunwale Rub-Rails (Port & Starboard)
    [-1, 1].forEach(function (side) {
      var railPts = [];
      var accentPts = [];
      for (var i = 0; i <= 20; i++) {
        var s = (i / 20) * 2.0 - 1.0;
        var gp = evalHullPoint(s, 1.0, side, 0.015);
        railPts.push(new THREE.Vector3(gp.x, gp.y + 0.015, gp.z));
        var ap = evalHullPoint(s, 0.93, side, -0.008);
        accentPts.push(new THREE.Vector3(ap.x, ap.y, ap.z));
      }
      var railCurve = new THREE.CatmullRomCurve3(railPts);
      var railMesh = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 32, 0.036, 8, false), matCycladicBlue);
      railMesh.castShadow = true;
      caiqueVessel.add(railMesh);

      var accentCurve = new THREE.CatmullRomCurve3(accentPts);
      var accentMesh = new THREE.Mesh(new THREE.TubeGeometry(accentCurve, 32, 0.020, 6, false), matOchreTrim);
      caiqueVessel.add(accentMesh);
    });

    // 4. Fitted Foredeck, Aft Cuddy Deck & Recessed Cockpit Floorboards (Zero Hull Clipping)
    var foreDeck = new THREE.Mesh(buildFittedDeckGeometry(THREE, 0.50, 0.98, 0.90, 8), matTeakDeck);
    foreDeck.receiveShadow = true;
    caiqueVessel.add(foreDeck);

    var aftDeck = new THREE.Mesh(buildFittedDeckGeometry(THREE, -0.98, -0.56, 0.88, 8), matTeakDeck);
    aftDeck.receiveShadow = true;
    caiqueVessel.add(aftDeck);

    var cockpitSole = new THREE.Mesh(buildFittedDeckGeometry(THREE, -0.56, 0.52, 0.28, 10), matOakTimber);
    cockpitSole.receiveShadow = true;
    caiqueVessel.add(cockpitSole);

    // Fore & Aft Cockpit Coaming Bulkhead Timbers
    [0.50, -0.56].forEach(function (sBulk) {
      var pPort = evalHullPoint(sBulk, 0.90, -1, 0.06);
      var pStar = evalHullPoint(sBulk, 0.90, 1, 0.06);
      var spanW = Math.max(0.2, pStar.x - pPort.x);
      var coaming = new THREE.Mesh(new THREE.BoxGeometry(spanW, 0.09, 0.06), matCycladicBlue);
      coaming.position.set(0, pPort.y + 0.03, pPort.z);
      caiqueVessel.add(coaming);
    });

    // 5. 9 Exposed Curved Interior Framing Ribs (Stravoksyla)
    for (var rIdx = -4; rIdx <= 4; rIdx++) {
      var sRib = rIdx * 0.115;
      var ribPts = [];
      for (var k = -6; k <= 6; k++) {
        var frac = Math.abs(k) / 6.0;
        var sideSign = k < 0 ? -1 : 1;
        var vRib = 0.28 + frac * 0.68;
        var rp = (k === 0)
          ? { x: 0, y: evalHullPoint(sRib, 0.28, 1, 0.055).y + 0.01, z: evalHullPoint(sRib, 0.28, 1, 0.055).z }
          : evalHullPoint(sRib, vRib, sideSign, 0.048);
        ribPts.push(new THREE.Vector3(rp.x, rp.y, rp.z));
      }
      var ribCurve = new THREE.CatmullRomCurve3(ribPts);
      var ribMesh = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 18, 0.022, 6, false), matOakTimber);
      ribMesh.castShadow = true;
      ribMesh.receiveShadow = true;
      caiqueVessel.add(ribMesh);
    }

    // 6. 3 Transverse Wooden Thwarts (Rowing Benches) + Brass Knees
    [-0.32, 0.0, 0.28].forEach(function (sThwart, tIdx) {
      var tpL = evalHullPoint(sThwart, 0.76, -1, 0.065);
      var tpR = evalHullPoint(sThwart, 0.76, 1, 0.065);
      var benchW = Math.max(0.3, tpR.x - tpL.x);
      var benchMat = (tIdx === 1) ? matCycladicBlue : matTeakDeck;
      var bench = new THREE.Mesh(new THREE.BoxGeometry(benchW, 0.045, 0.26), benchMat);
      bench.position.set(0, tpL.y, tpL.z);
      bench.castShadow = true;
      bench.receiveShadow = true;
      caiqueVessel.add(bench);

      // Brass Mast Partner Collar on Forward-Center Thwart
      if (tIdx === 2) {
        var partner = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.105, 0.07, 14), matNauticalBrass);
        partner.position.set(0, tpL.y + 0.025, tpL.z);
        caiqueVessel.add(partner);
      }
    });

    // Stowed Wooden Ash Oars resting along Port & Starboard Thwarts
    [-1, 1].forEach(function (side) {
      var oarGroup = new THREE.Group();
      oarGroup.position.set(side * 0.52, 0.30, -0.05);
      oarGroup.rotation.y = side * 0.06;
      oarGroup.rotation.x = 0.03;
      var loom = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.024, 2.35, 8), matSpruceSpar);
      loom.rotation.x = Math.PI * 0.5;
      oarGroup.add(loom);
      var blade = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.018, 0.68), matOchreTrim);
      blade.position.set(0, 0, -1.18);
      oarGroup.add(blade);
      oarGroup.castShadow = true;
      caiqueVessel.add(oarGroup);
    });

    // Small Bow Samson Post (Mooring Bitt) + Coiled Foredeck Rope
    var bittY = evalHullPoint(0.76, 0.90, 1, 0.05).y;
    var bittZ = evalHullPoint(0.76, 0.90, 1, 0.05).z;
    var samsonPost = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.26, 0.09), matOakTimber);
    samsonPost.position.set(0, bittY + 0.11, bittZ);
    samsonPost.castShadow = true;
    caiqueVessel.add(samsonPost);

    var crossPin = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.24, 8), matNauticalBrass);
    crossPin.rotation.z = Math.PI * 0.5;
    crossPin.position.set(0, bittY + 0.18, bittZ);
    caiqueVessel.add(crossPin);

    bowBittLocal = new THREE.Vector3(0, bittY + 0.16, bittZ + 0.04);

    // Coiled hemp hawser on foredeck
    for (var cr = 0; cr < 4; cr++) {
      var coil = new THREE.Mesh(new THREE.TorusGeometry(0.06 + cr * 0.036, 0.016, 6, 18), matHempRope);
      coil.rotation.x = Math.PI * 0.5;
      coil.position.set(0.22, bittY - 0.01, bittZ - 0.34);
      caiqueVessel.add(coil);
    }

    // 7. Tapered Wooden Mast, Slanted Lateen Yard, Furled Canvas Sail & Rigging Shrouds
    var mastZ = evalHullPoint(0.28, 0.76, 1, 0.065).z;
    var mastHeight = 4.15;
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.068, mastHeight, 14), matSpruceSpar);
    mast.position.set(0, mastHeight * 0.5 - 0.22, mastZ);
    mast.rotation.x = -0.04; // Subtle classic Aegean aft rake
    mast.castShadow = true;
    caiqueVessel.add(mast);

    // Brass masthead truck & halyard sheave band
    var mastBand = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.048, 0.08, 12), matNauticalBrass);
    mastBand.position.set(0, 3.55, mastZ - 0.14);
    caiqueVessel.add(mastBand);

    var mastTruck = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), matOchreTrim);
    mastTruck.scale.set(1.0, 0.65, 1.0);
    mastTruck.position.set(0, 3.92, mastZ - 0.16);
    caiqueVessel.add(mastTruck);

    // Slung Lateen Yard & Sculpted Furled Canvas Sail Bundle
    caiqueSailGroup = new THREE.Group();
    caiqueSailGroup.position.set(0.05, 2.48, mastZ - 0.08);
    caiqueSailGroup.rotation.x = -0.36; // Angled low forward, high aft
    caiqueSailGroup.rotation.z = 0.07;
    caiqueVessel.add(caiqueSailGroup);

    var yardLen = 4.35;
    var yardSpar = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.042, yardLen, 12), matSpruceSpar);
    yardSpar.rotation.x = Math.PI * 0.5;
    yardSpar.castShadow = true;
    caiqueSailGroup.add(yardSpar);

    // Organic Lathe-profiled Furled Canvas Sail (swells between 7 rope gasket ties)
    var sailPts = [];
    var sailSteps = 42;
    for (var spIdx = 0; spIdx <= sailSteps; spIdx++) {
      var uSail = spIdx / sailSteps;
      var yLathe = (uSail - 0.5) * (yardLen * 0.92);
      var env = Math.sin(uSail * Math.PI);
      // Cinch inward at 7 gasket tie stations for gathered cloth realism
      var cinch = 0.78 + 0.22 * Math.abs(Math.sin(uSail * Math.PI * 7.0));
      var rSail = Math.max(0.018, (0.032 + 0.088 * Math.pow(env, 0.72)) * cinch);
      sailPts.push(new THREE.Vector2(rSail, yLathe));
    }
    var furledGeo = new THREE.LatheGeometry(sailPts, 14);
    furledGeo.rotateX(Math.PI * 0.5);
    var furledSail = new THREE.Mesh(furledGeo, matCanvasSail);
    furledSail.position.set(0, -0.075, 0);
    furledSail.castShadow = true;
    furledSail.receiveShadow = true;
    caiqueSailGroup.add(furledSail);

    // Rope Gasket Ties lashed around Yard + Furled Sail
    for (var gIdx = 1; gIdx <= 6; gIdx++) {
      var gz = ((gIdx / 7.0) - 0.5) * (yardLen * 0.92);
      var gEnv = Math.sin((gIdx / 7.0) * Math.PI);
      var gRad = 0.042 + 0.068 * Math.pow(gEnv, 0.72);
      var gasket = new THREE.Mesh(new THREE.TorusGeometry(gRad, 0.012, 6, 14), matHempRope);
      gasket.position.set(0, -0.045, gz);
      caiqueSailGroup.add(gasket);
    }

    // Standing Rigging Shrouds (Port, Starboard & Forestay)
    var houndPos = new THREE.Vector3(0, 3.54, mastZ - 0.14);
    var shroudTargets = [
      new THREE.Vector3(-0.78, 0.44, mastZ - 0.22),
      new THREE.Vector3(0.78, 0.44, mastZ - 0.22),
      new THREE.Vector3(0.0, 0.92, 2.72)
    ];
    for (var st = 0; st < shroudTargets.length; st++) {
      var stCurve = new THREE.LineCurve3(houndPos, shroudTargets[st]);
      var stMesh = new THREE.Mesh(new THREE.TubeGeometry(stCurve, 4, 0.011, 6, false), matHempRope);
      caiqueVessel.add(stMesh);
    }

    // 8. Warm Brass Bow Anchor Lantern on Swan-Neck Bracket
    var bracketCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.72, 2.48),
      new THREE.Vector3(0, 1.08, 2.58),
      new THREE.Vector3(0, 1.18, 2.40),
      new THREE.Vector3(0, 1.08, 2.32)
    ]);
    var bracketMesh = new THREE.Mesh(new THREE.TubeGeometry(bracketCurve, 16, 0.016, 8, false), matNauticalBrass);
    bracketMesh.castShadow = true;
    caiqueVessel.add(bracketMesh);

    var lanternGroup = new THREE.Group();
    lanternGroup.position.set(0, 0.94, 2.32);
    caiqueVessel.add(lanternGroup);

    var lanTopCap = new THREE.Mesh(new THREE.ConeGeometry(0.105, 0.09, 12), matNauticalBrass);
    lanTopCap.position.y = 0.11;
    lanternGroup.add(lanTopCap);

    var lanBaseCup = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.092, 0.055, 12), matNauticalBrass);
    lanBaseCup.position.y = -0.10;
    lanternGroup.add(lanBaseCup);

    caiqueLanternGlassMat = new THREE.MeshStandardMaterial({
      color: 0xffe4a3,
      emissive: 0xff9424,
      emissiveIntensity: 2.35,
      roughness: 0.15,
      metalness: 0.05
    });
    var lanGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.15, 12), caiqueLanternGlassMat);
    lanternGroup.add(lanGlass);

    // 4 Delicate Brass Guard Bars around Lantern Globe
    for (var gb = 0; gb < 4; gb++) {
      var gAng = (gb / 4) * Math.PI * 2 + 0.4;
      var bar = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.16, 6), matNauticalBrass);
      bar.position.set(Math.cos(gAng) * 0.078, 0, Math.sin(gAng) * 0.078);
      lanternGroup.add(bar);
    }

    // Soft Dual-Layer Gaussian Halo Sprites on Bow Lantern (Zero PointLight shader overhead)
    var haloMat = new THREE.SpriteMaterial({
      map: sharedTextures.emberSprite,
      color: 0xffb84d,
      transparent: true,
      opacity: MODE_PRESETS[currentMode].lanternGlowOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    caiqueLanternHalo = new THREE.Sprite(haloMat);
    caiqueLanternHalo.scale.set(0.86, 0.86, 1.0);
    lanternGroup.add(caiqueLanternHalo);

    var coreMat = new THREE.SpriteMaterial({
      map: sharedTextures.moteSprite,
      color: 0xfff3d1,
      transparent: true,
      opacity: Math.min(1.0, MODE_PRESETS[currentMode].lanternGlowOpacity * 1.12),
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    caiqueLanternCore = new THREE.Sprite(coreMat);
    caiqueLanternCore.scale.set(0.32, 0.32, 1.0);
    lanternGroup.add(caiqueLanternCore);

    // ------------------------------------------------------------------------
    // D. Dynamic Catenary Hemp Mooring Hawser (Shore Bollard -> Caïque Bow Bitt)
    // ------------------------------------------------------------------------
    var dummyCurve = new THREE.LineCurve3(
      mooringBollardTip,
      new THREE.Vector3(CAIQUE_ANCHOR.x, CAIQUE_ANCHOR.y + 0.5, CAIQUE_ANCHOR.z + 1.8)
    );
    mooringGeo = new THREE.TubeGeometry(dummyCurve, 18, 0.024, 6, false);
    mooringMesh = new THREE.Mesh(mooringGeo, matHempRope);
    mooringMesh.castShadow = false;
    caiqueRoot.add(mooringMesh);

    caiqueVessel.updateMatrixWorld(true);
    bollardGroup.updateMatrixWorld(true);
    tmpVecA = new THREE.Vector3();
    tmpVecB = new THREE.Vector3();
    tmpVecC = new THREE.Vector3();
    tmpVecA.copy(bowBittLocal).applyMatrix4(caiqueVessel.matrixWorld);
    updateDynamicMooringGeometry(THREE, mooringBollardTip, tmpVecA);

    // Merge static sub-meshes inside bollardGroup & caiqueVessel in local space (~56 parts -> ~12 draws)
    var vesselExclude = new Set();
    vesselExclude.add(lanGlass);
    mergeStaticChildrenInLocalSpace(THREE, bollardGroup, null);
    mergeStaticChildrenInLocalSpace(THREE, caiqueVessel, vesselExclude);
  }

  // Sample exact Aegean sea wave elevation matching myst-island.html waterMat vertex shader
  function sampleAegeanWaveHeight(worldX, worldZ, tSec, freezeAmt) {
    var f = Math.max(0.0, Math.min(1.0, freezeAmt || 0.0));
    var t = tSec * (1.0 - f * 0.95);
    // waterMesh sits at z = -26 rotated -PI/2 around X => local pos.z = worldZ + 26
    var px = worldX;
    var pz = worldZ + 26.0;
    var w1 = Math.sin(px * 0.18 + pz * 0.12 + t * 1.25) * 0.18;
    var w2 = Math.cos(px * 0.42 - pz * 0.35 + t * 1.7) * 0.08;
    var w3 = Math.sin(px * 0.95 + pz * 0.82 + t * 2.5) * 0.035;
    return (w1 + w2 + w3) * (1.0 - f * 0.9);
  }

  // ==========================================================================
  // 5B. STATIC SCENE GEOMETRY BATCHER, SHADOW CASTER PRUNING & POINTLIGHT CAP
  // ==========================================================================
  function computeMeshWorldRadius(THREE, mesh) {
    if (!mesh || !mesh.geometry) return 0;
    var geo = mesh.geometry;
    if (!geo.boundingSphere) {
      geo.computeBoundingSphere();
    }
    if (!geo.boundingSphere) return 0;
    var e = mesh.matrixWorld.elements;
    var sx = Math.hypot(e[0], e[1], e[2]);
    var sy = Math.hypot(e[4], e[5], e[6]);
    var sz = Math.hypot(e[8], e[9], e[10]);
    var maxScale = Math.max(sx, sy, sz, 0.0001);
    return geo.boundingSphere.radius * maxScale;
  }

  function mergeMeshEntriesIntoGeometry(THREE, entries, invRootMatrix) {
    if (!entries || entries.length === 0) return null;

    var totalVerts = 0;
    var totalIndices = 0;
    var valid = [];
    var xformTmp = new THREE.Matrix4();

    for (var i = 0; i < entries.length; i++) {
      var m = entries[i];
      var g = m && m.geometry;
      if (!g || !g.attributes || !g.attributes.position) continue;
      var vCount = g.attributes.position.count;
      if (vCount <= 0) continue;
      var iCount = g.index ? g.index.count : vCount;
      if (iCount < 3) continue;

      var xform = new THREE.Matrix4();
      if (invRootMatrix) {
        xform.multiplyMatrices(invRootMatrix, m.matrixWorld);
      } else {
        xform.copy(m.matrixWorld);
      }
      valid.push({ mesh: m, geo: g, xform: xform, vCount: vCount, iCount: iCount });
      totalVerts += vCount;
      totalIndices += iCount;
    }

    if (valid.length === 0 || totalVerts === 0 || totalIndices === 0) return null;

    var posOut = new Float32Array(totalVerts * 3);
    var normOut = new Float32Array(totalVerts * 3);
    var uvOut = new Float32Array(totalVerts * 2);
    var idxOut = (totalVerts > 65535) ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);

    var vertOffset = 0;
    var idxOffset = 0;
    var vTmp = new THREE.Vector3();
    var nTmp = new THREE.Vector3();
    var normMat = new THREE.Matrix3();

    for (var k = 0; k < valid.length; k++) {
      var item = valid[k];
      var geo = item.geo;
      var mat4 = item.xform;
      var tempNormGeo = null;

      if (!geo.attributes.normal) {
        tempNormGeo = geo.clone();
        tempNormGeo.computeVertexNormals();
      }

      var posAttr = geo.attributes.position;
      var normAttr = (tempNormGeo || geo).attributes.normal;
      var uvAttr = geo.attributes.uv;

      normMat.getNormalMatrix(mat4);
      var flipWinding = (mat4.determinant() < 0.0);

      for (var v = 0; v < item.vCount; v++) {
        var dstV = vertOffset + v;
        vTmp.set(posAttr.getX(v), posAttr.getY(v), posAttr.getZ(v)).applyMatrix4(mat4);
        posOut[dstV * 3] = vTmp.x;
        posOut[dstV * 3 + 1] = vTmp.y;
        posOut[dstV * 3 + 2] = vTmp.z;

        if (normAttr) {
          nTmp.set(normAttr.getX(v), normAttr.getY(v), normAttr.getZ(v)).applyMatrix3(normMat);
          var nLen = Math.hypot(nTmp.x, nTmp.y, nTmp.z) || 1.0;
          normOut[dstV * 3] = nTmp.x / nLen;
          normOut[dstV * 3 + 1] = nTmp.y / nLen;
          normOut[dstV * 3 + 2] = nTmp.z / nLen;
        } else {
          normOut[dstV * 3] = 0.0;
          normOut[dstV * 3 + 1] = 1.0;
          normOut[dstV * 3 + 2] = 0.0;
        }

        if (uvAttr) {
          uvOut[dstV * 2] = uvAttr.getX(v);
          uvOut[dstV * 2 + 1] = uvAttr.getY(v);
        } else {
          uvOut[dstV * 2] = (vTmp.x + vTmp.y * 0.5) * 0.25;
          uvOut[dstV * 2 + 1] = (vTmp.z + vTmp.y * 0.5) * 0.25;
        }
      }

      if (geo.index) {
        var srcIdx = geo.index.array;
        for (var t = 0; t + 2 < item.iCount; t += 3) {
          var a = vertOffset + srcIdx[t];
          var b = vertOffset + srcIdx[t + 1];
          var c = vertOffset + srcIdx[t + 2];
          idxOut[idxOffset++] = a;
          idxOut[idxOffset++] = flipWinding ? c : b;
          idxOut[idxOffset++] = flipWinding ? b : c;
        }
      } else {
        for (var u = 0; u + 2 < item.vCount; u += 3) {
          var a0 = vertOffset + u;
          var b0 = vertOffset + u + 1;
          var c0 = vertOffset + u + 2;
          idxOut[idxOffset++] = a0;
          idxOut[idxOffset++] = flipWinding ? c0 : b0;
          idxOut[idxOffset++] = flipWinding ? b0 : c0;
        }
      }

      if (tempNormGeo) {
        tempNormGeo.dispose();
      }
      vertOffset += item.vCount;
    }

    var merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.Float32BufferAttribute(posOut, 3));
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normOut, 3));
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvOut, 2));
    merged.setIndex(
      (totalVerts > 65535)
        ? new THREE.Uint32BufferAttribute(idxOut, 1)
        : new THREE.Uint16BufferAttribute(idxOut, 1)
    );
    merged.computeBoundingBox();
    merged.computeBoundingSphere();
    return merged;
  }

  function mergeStaticChildrenInLocalSpace(THREE, group, excludeSet) {
    if (!THREE || !group) return;
    group.updateMatrixWorld(true);
    var invGroupMat = group.matrixWorld.clone().invert();
    var buckets = new Map();

    group.traverse(function (obj) {
      if (obj === group || !obj.isMesh || obj.isInstancedMesh || obj.isSkinnedMesh) return;
      if (excludeSet && excludeSet.has(obj)) return;
      if (!obj.visible || !obj.geometry || !obj.material || Array.isArray(obj.material)) return;
      var mat = obj.material;
      if (mat.isShaderMaterial || mat.isRawShaderMaterial || mat.transparent) return;

      var rWorld = computeMeshWorldRadius(THREE, obj);
      var castS = !!(obj.castShadow && rWorld >= 0.70);
      var recvS = !!obj.receiveShadow;
      var key = mat.uuid + '|' + (castS ? '1' : '0') + '|' + (recvS ? '1' : '0');
      if (!buckets.has(key)) {
        buckets.set(key, { mat: mat, castShadow: castS, receiveShadow: recvS, meshes: [] });
      }
      buckets.get(key).meshes.push(obj);
    });

    buckets.forEach(function (bucket) {
      if (bucket.meshes.length < 2) {
        if (bucket.meshes.length === 1) {
          bucket.meshes[0].castShadow = bucket.castShadow;
        }
        return;
      }
      var mergedGeo = mergeMeshEntriesIntoGeometry(THREE, bucket.meshes, invGroupMat);
      if (!mergedGeo) return;

      var mergedMesh = new THREE.Mesh(mergedGeo, bucket.mat);
      mergedMesh.castShadow = bucket.castShadow;
      mergedMesh.receiveShadow = bucket.receiveShadow;
      group.add(mergedMesh);

      for (var i = 0; i < bucket.meshes.length; i++) {
        var old = bucket.meshes[i];
        if (old.parent) {
          old.parent.remove(old);
        }
      }
    });
  }

  function collectProtectedSubtrees(rootVal, outSet, depth) {
    if (!rootVal || depth > 5) return;
    if (rootVal.isObject3D) {
      if (!outSet.has(rootVal)) {
        outSet.add(rootVal);
        rootVal.traverse(function (desc) {
          outSet.add(desc);
        });
      }
      return;
    }
    if (Array.isArray(rootVal)) {
      for (var i = 0; i < rootVal.length; i++) {
        collectProtectedSubtrees(rootVal[i], outSet, depth + 1);
      }
      return;
    }
    if (typeof rootVal === 'object') {
      var keys = Object.keys(rootVal);
      for (var k = 0; k < keys.length; k++) {
        var prop = keys[k];
        if (prop === 'parent' || prop === 'children' || prop === 'scene') continue;
        collectProtectedSubtrees(rootVal[prop], outSet, depth + 1);
      }
    }
  }

  function isEligibleStaticBaseMesh(obj, scene, THREE, protectedSet) {
    if (!obj || !obj.isMesh || obj.isInstancedMesh || obj.isSkinnedMesh) return false;
    if (!obj.geometry || !obj.material || Array.isArray(obj.material)) return false;
    if (protectedSet.has(obj)) return false;

    var mat = obj.material;
    if (mat.isShaderMaterial || mat.isRawShaderMaterial) return false;
    if (mat.transparent) return false;
    if (mat.blending && mat.blending !== THREE.NormalBlending) return false;
    if (mat.vertexColors) return false;

    var cur = obj;
    while (cur && cur !== scene) {
      if (cur.visible === false) return false;
      if (protectedSet.has(cur)) return false;
      var nm = cur.name || '';
      if (nm.indexOf('Phraxos') === 0) return false;
      var ud = cur.userData;
      if (ud && (ud.interactType || ud.skipStaticBatch || ud.noBatch || ud.isDynamic || ud.phraxosModule)) {
        return false;
      }
      cur = cur.parent;
    }
    return cur === scene;
  }

  function batchStaticBaseMeshes(ctx) {
    if (!ctx || !ctx.THREE || !ctx.scene) return;
    var THREE = ctx.THREE;
    var scene = ctx.scene;

    scene.updateMatrixWorld(true);

    var protectedSet = new Set();
    if (Array.isArray(ctx.interactables)) {
      for (var i = 0; i < ctx.interactables.length; i++) {
        var inter = ctx.interactables[i];
        if (!inter) continue;
        collectProtectedSubtrees(inter, protectedSet, 0);
        // Keep curiosity prop groups intact alongside their spinning markers
        if (inter.userData && inter.userData.interactType === 'curiosity' && inter.parent && inter.parent !== scene) {
          collectProtectedSubtrees(inter.parent, protectedSet, 0);
        }
      }
    }
    collectProtectedSubtrees(ctx.tabletMeshes3D, protectedSet, 0);
    collectProtectedSubtrees(ctx.rackMeshes3D, protectedSet, 0);
    collectProtectedSubtrees(ctx.wonderGroups, protectedSet, 0);
    if (ctx.coveBoat) collectProtectedSubtrees(ctx.coveBoat, protectedSet, 0);
    if (caiqueRoot) collectProtectedSubtrees(caiqueRoot, protectedSet, 0);
    if (ctx.dustParticles) protectedSet.add(ctx.dustParticles);
    if (ctx.emberParticles) protectedSet.add(ctx.emberParticles);

    var buckets = new Map();
    var worldCenter = new THREE.Vector3();

    scene.traverse(function (obj) {
      if (!isEligibleStaticBaseMesh(obj, scene, THREE, protectedSet)) return;

      var wRadius = computeMeshWorldRadius(THREE, obj);
      if (wRadius <= 0 || wRadius > 75.0) return;

      var geo = obj.geometry;
      worldCenter.copy(geo.boundingSphere.center).applyMatrix4(obj.matrixWorld);

      // 3 spatial Z-zones preserve frustum culling across South Terrace, 1943 Cove & North Sanctuary
      var zZone = (worldCenter.z >= -12.0) ? 0 : ((worldCenter.z >= -46.0) ? 1 : 2);
      var castShadow = !!(obj.castShadow && wRadius >= 0.70);
      var receiveShadow = !!obj.receiveShadow;
      var mat = obj.material;

      var bKey = mat.uuid + '|z' + zZone + '|cs' + (castShadow ? '1' : '0') + '|rs' + (receiveShadow ? '1' : '0');
      if (!buckets.has(bKey)) {
        buckets.set(bKey, {
          mat: mat,
          castShadow: castShadow,
          receiveShadow: receiveShadow,
          zZone: zZone,
          meshes: []
        });
      }
      buckets.get(bKey).meshes.push(obj);
    });

    if (!batchedRootGroup || batchedRootGroup.parent !== scene) {
      batchedRootGroup = new THREE.Group();
      batchedRootGroup.name = 'PhraxosBatchedStatic';
      scene.add(batchedRootGroup);
    }

    var mergedCount = 0;
    var bucketCount = 0;

    buckets.forEach(function (bucket) {
      if (bucket.meshes.length < 2) {
        if (bucket.meshes.length === 1) {
          bucket.meshes[0].castShadow = bucket.castShadow;
        }
        return;
      }

      var mergedGeo = mergeMeshEntriesIntoGeometry(THREE, bucket.meshes, null);
      if (!mergedGeo) return;

      var batchMesh = new THREE.Mesh(mergedGeo, bucket.mat);
      batchMesh.name = 'PhraxosStaticBatch_z' + bucket.zZone + '_' + bucketCount;
      batchMesh.castShadow = bucket.castShadow;
      batchMesh.receiveShadow = bucket.receiveShadow;
      batchMesh.matrixAutoUpdate = false;
      batchMesh.updateMatrix();
      batchedRootGroup.add(batchMesh);

      for (var m = 0; m < bucket.meshes.length; m++) {
        var src = bucket.meshes[m];
        if (src.parent) {
          src.parent.remove(src);
        }
      }

      mergedCount += bucket.meshes.length;
      bucketCount++;
    });

    // Prune now-empty anonymous static wrapper groups from scene root to cut per-frame scene traversal
    for (var c = scene.children.length - 1; c >= 0; c--) {
      var ch = scene.children[c];
      if (!ch || !ch.isGroup || ch.children.length > 0) continue;
      if (protectedSet.has(ch)) continue;
      if (ch.name && ch.name.indexOf('Phraxos') === 0) continue;
      scene.remove(ch);
    }

    perfStats.batchedMeshesMerged = mergedCount;
    perfStats.batchedBucketsCreated = bucketCount;
  }

  function stripSmallShadowCasters(THREE, scene, minWorldRadius) {
    if (!THREE || !scene) return;
    var stripped = 0;
    scene.traverse(function (obj) {
      if (!obj || !obj.isMesh || obj.isInstancedMesh || !obj.castShadow) return;
      var r = computeMeshWorldRadius(THREE, obj);
      if (r < minWorldRadius) {
        obj.castShadow = false;
        stripped++;
      }
    });
    perfStats.smallShadowCastersStripped = stripped;
  }

  function enforcePointLightBudget(ctx) {
    if (!ctx || !ctx.THREE || !ctx.scene) return;
    var THREE = ctx.THREE;
    var scene = ctx.scene;
    scene.updateMatrixWorld(true);

    // Seed standard headland altar/brazier focal anchors
    accentFocalPoints = [
      { x: -5.5, y: 2.75, z: 8.2, intensity: 2.35 },
      { x: 5.5, y: 2.75, z: 8.2, intensity: 2.35 },
      { x: 0.0, y: 3.10, z: 15.6, intensity: 2.15 },
      { x: -3.2, y: 2.75, z: -22.8, intensity: 2.35 },
      { x: -3.2, y: 2.75, z: -56.8, intensity: 2.35 },
      { x: -3.2, y: 2.75, z: -89.8, intensity: 2.45 }
    ];

    var rootLights = [];
    var nestedLights = [];
    var wPos = new THREE.Vector3();

    scene.traverse(function (obj) {
      if (!obj || !obj.isPointLight) return;
      if (obj === ctx.playerLight || obj === pooledAccentLight) {
        obj.castShadow = false;
        return;
      }
      obj.getWorldPosition(wPos);
      accentFocalPoints.push({
        x: wPos.x,
        y: Math.max(1.2, wPos.y),
        z: wPos.z,
        intensity: Math.min(2.6, Math.max(1.4, obj.intensity || 2.2))
      });

      if (obj.parent === scene && obj.visible !== false) {
        rootLights.push(obj);
      } else {
        nestedLights.push(obj);
      }
    });

    // Always remove nested PointLights (e.g. inside toggleable Wonder groups) to prevent mid-game shader recompiles
    for (var n = 0; n < nestedLights.length; n++) {
      var nl = nestedLights[n];
      nl.visible = false;
      nl.castShadow = false;
      if (nl.parent) {
        nl.parent.remove(nl);
      }
    }

    // Cooperate cleanly if myst-island.html already has <= 1 root dynamic fireLight alongside playerLight
    if (rootLights.length === 1) {
      rootLights[0].castShadow = false;
      rootLights[0].visible = true;
      if (pooledAccentLight && pooledAccentLight.parent) {
        pooledAccentLight.visible = false;
        pooledAccentLight.parent.remove(pooledAccentLight);
        pooledAccentLight = null;
      }
    } else {
      for (var r = 0; r < rootLights.length; r++) {
        var rl = rootLights[r];
        rl.visible = false;
        rl.castShadow = false;
        if (rl.parent) {
          rl.parent.remove(rl);
        }
      }
      if (!pooledAccentLight) {
        pooledAccentLight = new THREE.PointLight(0xff7d1e, 2.25, 24.0, 1.45);
        pooledAccentLight.castShadow = false;
        pooledAccentLight.visible = true;
        pooledAccentLight.position.set(-5.5, 2.75, 8.2);
      }
      if (pooledAccentLight.parent !== scene) {
        scene.add(pooledAccentLight);
      }
      pooledAccentLight.visible = true;
    }

    if (ctx.playerLight) {
      ctx.playerLight.castShadow = false;
      ctx.playerLight.visible = true;
    }

    var activeCount = 0;
    scene.traverse(function (obj) {
      if (obj && obj.isPointLight && obj.visible !== false) {
        activeCount++;
      }
    });
    perfStats.activePointLights = activeCount;
  }

  function finalizeStaticBatching(ctx) {
    var activeCtx = ctx || latestCtxRef;
    if (!activeCtx || !activeCtx.THREE || !activeCtx.scene) return;
    latestCtxRef = activeCtx;

    if (!initialized || boundScene !== activeCtx.scene) {
      init(activeCtx);
    }
    if (staticBatchingDone && batchedSceneRef === activeCtx.scene) {
      return;
    }

    staticBatchingDone = true;
    batchedSceneRef = activeCtx.scene;

    // Ensure all materials & ShaderMaterials created by peer modules before finalization are polished & HLSL-safe
    polishArchitecturePBR(activeCtx);
    if (pipelineReady && !pipelineFailed) {
      patchSceneShadersForLinearHDR(activeCtx.scene);
    }

    // 1. Merge static base-island architecture & flora by (Material, Z-Zone, ShadowFlag)
    batchStaticBaseMeshes(activeCtx);

    // 2. Strip castShadow from small decorative geometry (world radius < 0.70m) across entire scene
    stripSmallShadowCasters(activeCtx.THREE, activeCtx.scene, 0.70);

    // 3. Enforce <= 2 persistent PointLights across entire scene (zero mid-game visible toggling)
    enforcePointLightBudget(activeCtx);

    // 4. Rebake cached directional shadow map once against the batched static scene
    upgradeDirectionalShadows(activeCtx);
    requestImmediateShadowBake(activeCtx);
    governorWarmupFrames = 20;
  }

  // ==========================================================================
  // 5C. HUD QUALITY SWITCHER (⚡ GFX: 60fps | 🪶 Lite | ✨ Ultra) & [G] SHORTCUT
  // ==========================================================================
  function formatQualityLabel(mode) {
    if (mode === 'lite') return '🪶 GFX: Lite';
    if (mode === 'ultra') return '✨ GFX: Ultra';
    return '⚡ GFX: 60fps';
  }

  function updateHudQualityButton() {
    if (typeof document === 'undefined') return;
    var labelEl = document.getElementById('gfx-quality-label');
    if (labelEl) {
      labelEl.textContent = formatQualityLabel(qualityMode);
    }
  }

  function injectHudQualityControl() {
    if (typeof document === 'undefined') return;

    if (!hudBtnInjected) {
      var existing = document.getElementById('gfx-quality-btn');
      if (existing) {
        hudBtnInjected = true;
        updateHudQualityButton();
      } else {
        var lightBtn = document.getElementById('lighting-btn');
        var container = (lightBtn && lightBtn.parentNode)
          ? lightBtn.parentNode
          : document.querySelector('.top-bar .nav-pills');

        if (container) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'hud-btn';
          btn.id = 'gfx-quality-btn';
          btn.title = 'Cycle Graphics Quality (Auto 60fps / Lite / Ultra) [Key: G]';

          var span = document.createElement('span');
          span.id = 'gfx-quality-label';
          span.textContent = formatQualityLabel(qualityMode);
          btn.appendChild(span);

          btn.addEventListener('click', function () {
            cycleQualityMode(latestCtxRef, true);
          });

          if (lightBtn && lightBtn.nextSibling) {
            container.insertBefore(btn, lightBtn.nextSibling);
          } else {
            container.appendChild(btn);
          }
          hudBtnInjected = true;
        }
      }
    }

    if (!keyListenerBound && typeof window !== 'undefined') {
      keyListenerBound = true;
      window.addEventListener('keydown', function (ev) {
        if (!ev || ev.defaultPrevented || ev.repeat) return;
        if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
        var t = ev.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) {
          return;
        }
        if (ev.key === 'g' || ev.key === 'G') {
          cycleQualityMode(latestCtxRef, true);
        }
      });
    }
  }

  function setQualityMode(mode, ctx, announce) {
    var next = (mode === 'lite' || mode === 'ultra' || mode === 'auto') ? mode : 'auto';
    qualityMode = next;
    governorScale = 1.0;
    slowFrameStreak = 0;
    fastFrameStreak = 0;
    governorWarmupFrames = 20;

    var activeCtx = ctx || latestCtxRef;
    if (activeCtx && activeCtx.renderer && activeCtx.THREE) {
      latestCtxRef = activeCtx;
      syncRendererResolution(activeCtx);
      var dims = getTargetPixelSize(activeCtx);
      if (!pipelineFailed) {
        try {
          allocatePipelineTargets(activeCtx.THREE, dims.w, dims.h);
          pipelineReady = true;
        } catch (e) {
          disposeAllPipelineTargets();
          pipelineReady = false;
          pipelineFailed = true;
          sharedShaderOutMode.value = 0.0;
        }
      }
      upgradeDirectionalShadows(activeCtx);
      requestImmediateShadowBake(activeCtx);
    }

    updateHudQualityButton();

    if (announce && activeCtx && typeof activeCtx.showBanner === 'function') {
      var msg = (next === 'lite')
        ? '🪶 Graphics: Lite — Direct fast rendering for maximum frame rate.'
        : ((next === 'ultra')
          ? '✨ Graphics: Ultra — Full 16-bit HDR multi-pass bloom & high-resolution shadows.'
          : '⚡ Graphics: Auto 60fps — Balanced soft Kawase bloom & crisp cached shadows.');
      activeCtx.showBanner(msg, 'clue');
    }
    return qualityMode;
  }

  function cycleQualityMode(ctx, announce) {
    var order = ['auto', 'lite', 'ultra'];
    var idx = order.indexOf(qualityMode);
    var next = order[(idx + 1) % order.length];
    return setQualityMode(next, ctx || latestCtxRef, announce !== false);
  }

  // ==========================================================================
  // 6. PUBLIC LIFECYCLE CONTRACT (window.PhraxosGraphics)
  // ==========================================================================
  function init(ctx) {
    if (!ctx || !ctx.THREE || !ctx.renderer || !ctx.scene) return;
    latestCtxRef = ctx;
    if (initialized && boundScene === ctx.scene) {
      injectHudQualityControl();
      return;
    }

    boundScene = ctx.scene;
    initialized = true;
    staticBatchingDone = false;
    renderFrameCounter = 0;
    shadowBakedOnce = false;
    lastDiscoveredCount = -1;

    if (typeof ctx.getLightingMode === 'function') {
      var m = ctx.getLightingMode();
      if (m === 0 || m === 1 || m === 2) {
        currentMode = m;
      }
    }
    var initPreset = MODE_PRESETS[currentMode] || MODE_PRESETS[1];
    gradeState.exposure = initPreset.exposure;
    gradeState.bloomStrength = initPreset.bloomStrength;
    gradeState.bloomThreshold = initPreset.bloomThreshold;
    gradeState.shadowTint = initPreset.shadowTint.slice();
    gradeState.midTint = initPreset.midTint.slice();
    gradeState.highlightTint = initPreset.highlightTint.slice();
    gradeState.saturation = initPreset.saturation;
    gradeState.contrast = initPreset.contrast;

    // 1. Multi-Tier Post-Processing Pipeline + Unified Sky/Water/Flame Shader Patching
    initPostProcessing(ctx);
    if (pipelineReady) {
      patchSceneShadersForLinearHDR(ctx.scene);
    }

    // 2. Soft Gaussian Particle Sprites + Base Architecture PBR Material Polish
    upgradeParticleSystems(ctx);
    polishArchitecturePBR(ctx);

    // 3. Sculpted Curved-Hull Greek Caïque in Cove Water (local-batched, zero PointLight)
    buildAegeanCaique(ctx);

    // 4. Cached On-Demand Soft Shadows + Dynamic 3-Mode PMREM Environment + HUD Quality Switcher
    upgradeDirectionalShadows(ctx);
    requestImmediateShadowBake(ctx);
    rebuildPMREMEnvironment(currentMode, ctx);
    injectHudQualityControl();
  }

  function onLightingChange(mode, ctx) {
    var safeMode = (mode === 0 || mode === 1 || mode === 2) ? mode : 1;
    currentMode = safeMode;

    var activeCtx = ctx || latestCtxRef;
    if (!activeCtx || !activeCtx.renderer || !activeCtx.scene || !activeCtx.THREE) return;
    latestCtxRef = activeCtx;

    upgradeDirectionalShadows(activeCtx);
    requestImmediateShadowBake(activeCtx);
    rebuildPMREMEnvironment(safeMode, activeCtx);
    governorWarmupFrames = Math.max(governorWarmupFrames, 12);

    var preset = MODE_PRESETS[safeMode];
    if (caiqueLanternHalo && caiqueLanternHalo.material) {
      caiqueLanternHalo.material.opacity = preset.lanternGlowOpacity;
    }
    if (caiqueLanternCore && caiqueLanternCore.material) {
      caiqueLanternCore.material.opacity = Math.min(1.0, preset.lanternGlowOpacity * 1.12);
    }
  }

  function onResize(ctx) {
    var activeCtx = ctx || latestCtxRef;
    if (!activeCtx || !activeCtx.renderer || !activeCtx.THREE) return;
    latestCtxRef = activeCtx;

    syncRendererResolution(activeCtx);
    if (!pipelineReady || pipelineFailed) return;

    var dims = getTargetPixelSize(activeCtx);
    if (dims.w === rtWidth && dims.h === rtHeight) return;

    try {
      allocatePipelineTargets(activeCtx.THREE, dims.w, dims.h);
      governorWarmupFrames = Math.max(governorWarmupFrames, 10);
    } catch (e) {
      disposeAllPipelineTargets();
      restorePatchedSceneShaders();
      pipelineReady = false;
      pipelineFailed = true;
      sharedShaderOutMode.value = 0.0;
    }
  }

  function updatePooledAccentLight(safeDt, tSec, ctx) {
    if (!pooledAccentLight || !pooledAccentLight.visible || accentFocalPoints.length === 0) return;

    var inIntro = (typeof ctx.inIntro === 'function') ? ctx.inIntro() : false;
    var refX = (inIntro || !ctx.player) ? (ctx.camera ? ctx.camera.position.x : 0.0) : ctx.player.x;
    var refZ = (inIntro || !ctx.player) ? 8.2 : ctx.player.z;

    var best = accentFocalPoints[0];
    var bestDistSq = Infinity;
    for (var i = 0; i < accentFocalPoints.length; i++) {
      var fp = accentFocalPoints[i];
      var dx = fp.x - refX;
      var dz = fp.z - refZ;
      var dSq = dx * dx + dz * dz;
      if (dSq < bestDistSq) {
        bestDistSq = dSq;
        best = fp;
      }
    }

    var glide = Math.min(1.0, safeDt * 6.5);
    var jx = Math.sin(tSec * 7.2) * 0.08;
    var jy = Math.cos(tSec * 11.4) * 0.05;
    var jz = Math.cos(tSec * 6.8) * 0.08;

    pooledAccentLight.position.x += ((best.x + jx) - pooledAccentLight.position.x) * glide;
    pooledAccentLight.position.y += ((best.y + jy) - pooledAccentLight.position.y) * glide;
    pooledAccentLight.position.z += ((best.z + jz) - pooledAccentLight.position.z) * glide;

    var fireBoost = (currentMode === 2) ? 1.28 : ((currentMode === 1) ? 1.05 : 0.68);
    var flicker = 1.0 + 0.14 * Math.sin(tSec * 9.3) + 0.08 * Math.cos(tSec * 15.7);
    pooledAccentLight.intensity = best.intensity * fireBoost * flicker;
  }

  function update(dt, now, ctx) {
    if (!ctx) return;
    latestCtxRef = ctx;
    if (!initialized && ctx.THREE && ctx.renderer && ctx.scene) {
      init(ctx);
    }

    var safeDt = Math.min(Math.max(dt || 0.016, 0.0), 0.1);
    var tSec = (typeof now === 'number' ? now : performance.now()) * 0.001;

    // 1. Smoothly ease Mediterranean Color Balance & Bloom parameters toward active lightingMode
    var target = MODE_PRESETS[currentMode] || MODE_PRESETS[1];
    var blend = Math.min(1.0, safeDt * 4.5);
    gradeState.exposure += (target.exposure - gradeState.exposure) * blend;
    gradeState.bloomStrength += (target.bloomStrength - gradeState.bloomStrength) * blend;
    gradeState.bloomThreshold += (target.bloomThreshold - gradeState.bloomThreshold) * blend;
    gradeState.saturation += (target.saturation - gradeState.saturation) * blend;
    gradeState.contrast += (target.contrast - gradeState.contrast) * blend;
    for (var c = 0; c < 3; c++) {
      gradeState.shadowTint[c] += (target.shadowTint[c] - gradeState.shadowTint[c]) * blend;
      gradeState.midTint[c] += (target.midTint[c] - gradeState.midTint[c]) * blend;
      gradeState.highlightTint[c] += (target.highlightTint[c] - gradeState.highlightTint[c]) * blend;
    }

    // 1b. Glide Pooled Nearest Brazier/Altar Accent PointLight smoothly
    updatePooledAccentLight(safeDt, tSec, ctx);

    // 2. Gently Bob, Pitch & Roll the Moored Greek Caïque in Phase with Aegean Cove Swell
    if (caiqueVessel && ctx.THREE) {
      var freezeAmt = (ctx.waterUniforms && ctx.waterUniforms.uFreeze)
        ? ctx.waterUniforms.uFreeze.value
        : 0.0;

      var cosY = Math.cos(CAIQUE_ANCHOR.yaw);
      var sinY = Math.sin(CAIQUE_ANCHOR.yaw);

      var hCenter = sampleAegeanWaveHeight(CAIQUE_ANCHOR.x, CAIQUE_ANCHOR.z, tSec, freezeAmt);
      var hBow = sampleAegeanWaveHeight(
        CAIQUE_ANCHOR.x + sinY * 1.9,
        CAIQUE_ANCHOR.z + cosY * 1.9,
        tSec,
        freezeAmt
      );
      var hStern = sampleAegeanWaveHeight(
        CAIQUE_ANCHOR.x - sinY * 1.9,
        CAIQUE_ANCHOR.z - cosY * 1.9,
        tSec,
        freezeAmt
      );
      var hStarboard = sampleAegeanWaveHeight(
        CAIQUE_ANCHOR.x + cosY * 0.85,
        CAIQUE_ANCHOR.z - sinY * 0.85,
        tSec,
        freezeAmt
      );
      var hPort = sampleAegeanWaveHeight(
        CAIQUE_ANCHOR.x - cosY * 0.85,
        CAIQUE_ANCHOR.z + sinY * 0.85,
        tSec,
        freezeAmt
      );

      var heave = hCenter * 0.48;
      var pitch = Math.atan2((hStern - hBow) * 0.42, 3.8);
      var roll = Math.atan2((hPort - hStarboard) * 0.52, 1.7);
      var surge = Math.sin(tSec * 0.72) * 0.06 * (1.0 - freezeAmt * 0.9);

      caiqueVessel.position.set(
        CAIQUE_ANCHOR.x + sinY * surge,
        CAIQUE_ANCHOR.y + heave,
        CAIQUE_ANCHOR.z + cosY * surge
      );
      caiqueVessel.rotation.set(
        pitch,
        CAIQUE_ANCHOR.yaw + Math.sin(tSec * 0.48) * 0.024 * (1.0 - freezeAmt * 0.9),
        roll
      );

      if (caiqueRippleMesh) {
        caiqueRippleMesh.position.set(
          caiqueVessel.position.x,
          -0.365 + hCenter * 0.72,
          caiqueVessel.position.z
        );
        caiqueRippleMesh.rotation.y = caiqueVessel.rotation.y;
        var ripplePulse = 1.0 + Math.sin(tSec * 1.9) * 0.035 * (1.0 - freezeAmt);
        caiqueRippleMesh.scale.set(ripplePulse, 1.0, ripplePulse);
        caiqueRippleMesh.material.opacity = 0.62 * (1.0 - freezeAmt * 0.75);
      }

      // Subtle warm bow lantern candle flicker (sprite halo + core + emissive glass)
      var flicker = 1.0 + 0.11 * Math.sin(tSec * 8.4) + 0.06 * Math.cos(tSec * 14.7);
      if (caiqueLanternGlassMat) {
        caiqueLanternGlassMat.emissiveIntensity = (currentMode === 0 ? 1.45 : 2.35) * flicker;
      }
      if (caiqueLanternHalo) {
        var hScale = 0.80 + 0.08 * flicker;
        caiqueLanternHalo.scale.set(hScale, hScale, 1.0);
      }
      if (caiqueLanternCore) {
        var cScale = 0.30 + 0.04 * flicker;
        caiqueLanternCore.scale.set(cScale, cScale, 1.0);
      }

      // Keep mooring rope physically attached to bobbing bow bitt
      if (mooringGeo && mooringBollardTip && bowBittLocal && tmpVecA) {
        caiqueVessel.updateMatrixWorld(true);
        tmpVecA.copy(bowBittLocal).applyMatrix4(caiqueVessel.matrixWorld);
        updateDynamicMooringGeometry(ctx.THREE, mooringBollardTip, tmpVecA);
      }
    }
  }

  function updateAutoFpsGovernor(ctx, nowMs) {
    if (lastRenderStampMs <= 0) {
      lastRenderStampMs = nowMs;
      return;
    }
    var frameMs = nowMs - lastRenderStampMs;
    lastRenderStampMs = nowMs;

    if (governorWarmupFrames > 0) {
      governorWarmupFrames--;
      return;
    }
    if (qualityMode !== 'auto' || frameMs <= 0.5 || frameMs > 250.0) {
      return;
    }

    rollingFrameMs += (frameMs - rollingFrameMs) * 0.08;

    if (governorScale > 0.90) {
      if (rollingFrameMs > 20.0) {
        slowFrameStreak++;
        if (slowFrameStreak >= 24) {
          governorScale = 0.85;
          slowFrameStreak = 0;
          fastFrameStreak = 0;
          governorWarmupFrames = 24;
          onResize(ctx);
        }
      } else {
        slowFrameStreak = Math.max(0, slowFrameStreak - 1);
      }
    } else if (rollingFrameMs < 11.5) {
      fastFrameStreak++;
      if (fastFrameStreak >= 180) {
        governorScale = 1.0;
        fastFrameStreak = 0;
        slowFrameStreak = 0;
        governorWarmupFrames = 24;
        onResize(ctx);
      }
    } else {
      fastFrameStreak = 0;
    }
  }

  function render(ctx, dt, now) {
    if (!ctx || !ctx.renderer || !ctx.scene || !ctx.camera) return;
    latestCtxRef = ctx;

    if (!initialized && ctx.THREE) {
      init(ctx);
    }

    // Idempotent auto-batching fallback if integrator has not yet called finalizeStaticBatching explicitly
    if (!staticBatchingDone && renderFrameCounter >= 1) {
      finalizeStaticBatching(ctx);
    }

    // One-time late shader check on frame 12 for any deferred materials (zero steady-state scene traversal)
    if (renderFrameCounter === 12 && pipelineReady && !pipelineFailed) {
      patchSceneShadersForLinearHDR(ctx.scene);
    }
    renderFrameCounter++;

    var nowMs = (typeof now === 'number' && now > 0) ? now : performance.now();
    updateAutoFpsGovernor(ctx, nowMs);

    // Ensure renderer pixelRatio stays locked to active quality tier & governor scale
    syncRendererResolution(ctx);

    // Evaluate cached on-demand directional shadow rebake (keeps shadowMap.autoUpdate = false permanently!)
    evaluateOnDemandShadowBake(ctx, nowMs);

    var renderer = ctx.renderer;
    var scene = ctx.scene;
    var camera = ctx.camera;
    var THREE = ctx.THREE;

    // 0-Pass Direct Render Path ('lite' mode or hardware fallback)
    if (qualityMode === 'lite' || !pipelineReady || pipelineFailed || !compositeMat) {
      sharedShaderOutMode.value = 0.0;
      renderer.toneMapping = THREE.ACESFilmicToneMapping || THREE.NoToneMapping;
      renderer.toneMappingExposure = gradeState.exposure * 1.06;
      if (THREE.sRGBEncoding) {
        renderer.outputEncoding = THREE.sRGBEncoding;
      }
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
      if (renderer.shadowMap) {
        renderer.shadowMap.autoUpdate = false;
      }
      return;
    }

    // Auto-sync render target resolution if viewport/DPR changed without an explicit onResize call
    var dims = getTargetPixelSize(ctx);
    if (!sceneRT || dims.w !== rtWidth || dims.h !== rtHeight) {
      onResize(ctx);
      if (!pipelineReady || pipelineFailed || !sceneRT) {
        sharedShaderOutMode.value = 0.0;
        renderer.render(scene, camera);
        return;
      }
    }

    var prevTarget = renderer.getRenderTarget();
    var prevToneMapping = renderer.toneMapping;
    var prevAutoClear = renderer.autoClear;

    var useUltra16F = !rtIsPackedSRGB && !!bloomHalfA && !!bloomHalfB && !!bloomQuarterB;
    sharedShaderOutMode.value = useUltra16F ? 2.0 : 1.0;

    var hasFogColor = useUltra16F && !!(scene.fog && scene.fog.color);
    var savedFogR = 0, savedFogG = 0, savedFogB = 0;
    if (hasFogColor) {
      savedFogR = scene.fog.color.r;
      savedFogG = scene.fog.color.g;
      savedFogB = scene.fog.color.b;
    }

    var hasBgColor = useUltra16F && !!(scene.background && scene.background.isColor);
    var savedBgR = 0, savedBgG = 0, savedBgB = 0;
    if (hasBgColor) {
      savedBgR = scene.background.r;
      savedBgG = scene.background.g;
      savedBgB = scene.background.b;
    }

    try {
      // ----------------------------------------------------------------------
      // Pass 1: Render Main 3D Scene into sceneRT (RGBA8 sRGB in Auto 60fps; HalfFloat Linear in Ultra)
      // ----------------------------------------------------------------------
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.autoClear = true;

      if (hasFogColor) {
        scene.fog.color.setRGB(
          Math.pow(Math.max(0, savedFogR), 2.2),
          Math.pow(Math.max(0, savedFogG), 2.2),
          Math.pow(Math.max(0, savedFogB), 2.2)
        );
      }
      if (hasBgColor) {
        scene.background.setRGB(
          Math.pow(Math.max(0, savedBgR), 2.2),
          Math.pow(Math.max(0, savedBgG), 2.2),
          Math.pow(Math.max(0, savedBgB), 2.2)
        );
      }

      renderer.setRenderTarget(sceneRT);
      renderer.render(scene, camera);

      if (hasFogColor) {
        scene.fog.color.setRGB(savedFogR, savedFogG, savedFogB);
      }
      if (hasBgColor) {
        scene.background.setRGB(savedBgR, savedBgG, savedBgB);
      }

      if (renderer.shadowMap) {
        renderer.shadowMap.autoUpdate = false;
      }

      if (!useUltra16F) {
        // --------------------------------------------------------------------
        // Fast 60fps Pass 2: Single 1/4-Res 5-Tap Kawase Downsample + Bright Extract
        // --------------------------------------------------------------------
        fastKawaseBrightMat.uniforms.tScene.value = sceneRT.texture;
        fastKawaseBrightMat.uniforms.uThreshold.value = gradeState.bloomThreshold;
        fastKawaseBrightMat.uniforms.uScenePacked.value = 1.0;
        postQuad.material = fastKawaseBrightMat;
        renderer.setRenderTarget(bloomQuarterA);
        renderer.render(postScene, postCamera);

        compositeMat.uniforms.tScene.value = sceneRT.texture;
        compositeMat.uniforms.tBloomHalf.value = bloomQuarterA.texture;
        compositeMat.uniforms.tBloomQuarter.value = bloomQuarterA.texture;
        compositeMat.uniforms.uScenePacked.value = 1.0;
        compositeMat.uniforms.uFastBloom.value = 1.0;
      } else {
        // --------------------------------------------------------------------
        // Ultra 16F Multi-Pass Dual-Kawase + Separable 9-Tap Gaussian Bloom
        // --------------------------------------------------------------------
        var hw = bloomHalfA.width;
        var hh = bloomHalfA.height;
        var qw = bloomQuarterA.width;
        var qh = bloomQuarterA.height;

        brightPassMat.uniforms.tScene.value = sceneRT.texture;
        brightPassMat.uniforms.uThreshold.value = gradeState.bloomThreshold;
        postQuad.material = brightPassMat;
        renderer.setRenderTarget(bloomHalfA);
        renderer.render(postScene, postCamera);

        postQuad.material = blurMat;
        blurMat.uniforms.tInput.value = bloomHalfA.texture;
        blurMat.uniforms.uDirection.value.set(1.0 / hw, 0.0);
        renderer.setRenderTarget(bloomHalfB);
        renderer.render(postScene, postCamera);

        blurMat.uniforms.tInput.value = bloomHalfB.texture;
        blurMat.uniforms.uDirection.value.set(0.0, 1.0 / hh);
        renderer.setRenderTarget(bloomHalfA);
        renderer.render(postScene, postCamera);

        postQuad.material = downsampleMat;
        downsampleMat.uniforms.tInput.value = bloomHalfA.texture;
        downsampleMat.uniforms.uTexelSize.value.set(1.0 / hw, 1.0 / hh);
        renderer.setRenderTarget(bloomQuarterA);
        renderer.render(postScene, postCamera);

        postQuad.material = blurMat;
        blurMat.uniforms.tInput.value = bloomQuarterA.texture;
        blurMat.uniforms.uDirection.value.set(1.45 / qw, 0.0);
        renderer.setRenderTarget(bloomQuarterB);
        renderer.render(postScene, postCamera);

        blurMat.uniforms.tInput.value = bloomQuarterB.texture;
        blurMat.uniforms.uDirection.value.set(0.0, 1.45 / qh);
        renderer.setRenderTarget(bloomQuarterA);
        renderer.render(postScene, postCamera);

        compositeMat.uniforms.tScene.value = sceneRT.texture;
        compositeMat.uniforms.tBloomHalf.value = bloomHalfA.texture;
        compositeMat.uniforms.tBloomQuarter.value = bloomQuarterA.texture;
        compositeMat.uniforms.uScenePacked.value = 0.0;
        compositeMat.uniforms.uFastBloom.value = 0.0;
      }

      // ----------------------------------------------------------------------
      // Final Composite Pass: Highlight Shoulder + Split-Tone + ACES + Vignette + Dither
      // ----------------------------------------------------------------------
      compositeMat.uniforms.uBloomStrength.value = gradeState.bloomStrength;
      compositeMat.uniforms.uExposure.value = gradeState.exposure;
      compositeMat.uniforms.uSaturation.value = gradeState.saturation;
      compositeMat.uniforms.uContrast.value = gradeState.contrast;
      compositeMat.uniforms.uShadowTint.value.fromArray(gradeState.shadowTint);
      compositeMat.uniforms.uMidTint.value.fromArray(gradeState.midTint);
      compositeMat.uniforms.uHighlightTint.value.fromArray(gradeState.highlightTint);

      postQuad.material = compositeMat;
      renderer.setRenderTarget(prevTarget);
      renderer.render(postScene, postCamera);

      renderer.toneMapping = prevToneMapping;
      renderer.autoClear = prevAutoClear;
      if (renderer.shadowMap) {
        renderer.shadowMap.autoUpdate = false;
      }
    } catch (err) {
      if (hasFogColor) {
        scene.fog.color.setRGB(savedFogR, savedFogG, savedFogB);
      }
      if (hasBgColor) {
        scene.background.setRGB(savedBgR, savedBgG, savedBgB);
      }
      renderer.toneMapping = prevToneMapping;
      renderer.autoClear = prevAutoClear;
      if (renderer.shadowMap) {
        renderer.shadowMap.autoUpdate = false;
      }
      try { renderer.setRenderTarget(prevTarget); } catch (ignore) {}

      disposeAllPipelineTargets();
      restorePatchedSceneShaders();
      pipelineReady = false;
      pipelineFailed = true;
      pipelineTier = 'fallback-direct';
      sharedShaderOutMode.value = 0.0;

      renderer.render(scene, camera);
    }
  }

  window.PhraxosGraphics = {
    init: init,
    finalizeStaticBatching: finalizeStaticBatching,
    batchStaticBaseMeshes: batchStaticBaseMeshes,
    update: update,
    render: render,
    onResize: onResize,
    onLightingChange: onLightingChange,
    setQualityMode: setQualityMode,
    cycleQualityMode: cycleQualityMode,
    getQualityMode: function () { return qualityMode; },
    getPipelineTier: function () { return pipelineTier; },
    getStats: function () {
      return {
        qualityMode: qualityMode,
        pipelineTier: pipelineTier,
        isIntegratedGPU: isIntegratedGPU,
        gpuRenderer: gpuRendererString,
        effectiveDPR: effectiveDPR,
        governorScale: governorScale,
        rollingFrameMs: Math.round(rollingFrameMs * 100) / 100,
        batchedMeshesMerged: perfStats.batchedMeshesMerged,
        batchedBucketsCreated: perfStats.batchedBucketsCreated,
        smallShadowCastersStripped: perfStats.smallShadowCastersStripped,
        activePointLights: perfStats.activePointLights,
        shadowUpdatesCount: perfStats.shadowUpdatesCount
      };
    }
  };
})();
