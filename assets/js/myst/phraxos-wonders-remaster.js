/**
 * Phraxos Island — Remastered 3D World Wonders & Diegetic Myst Solve Choreography
 * Classic dependency-free browser script (100% file:// & https:// compatible, zero ES imports).
 * Exposes window.PhraxosWonders:
 *   - init(ctx)
 *   - update(dt, now, ctx)
 *   - applyWorldWonders(activeWonderArr, discoveredSet, ctx)
 *   - triggerSolve(altarId, solvedIdx, isFullAct, ctx)
 */
(function (global) {
  'use strict';

  // True 3D Altar Lectern world coordinates (matching myst-island.html lines 4875-4968)
  var ALTAR_LECTERNS = [
    { id: 0, x: -5.5, y: 1.55, z: 6.8 },
    { id: 1, x: 5.5,  y: 1.55, z: 6.8 },
    { id: 2, x: 0.0,  y: 1.55, z: -25.2 },
    { id: 3, x: 0.0,  y: 1.55, z: -59.2 },
    { id: 4, x: 0.0,  y: 1.55, z: -92.2 }
  ];

  // Deterministic PRNG so procedural stone veins, olive boughs & karst crags never flicker
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function easeOutCubic(t) {
    var inv = 1.0 - clamp(t, 0.0, 1.0);
    return 1.0 - inv * inv * inv;
  }

  function smoothstepJS(edge0, edge1, x) {
    var t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  // Evaluate island water swell at (wx, wz) matching myst-island.html water shader
  function sampleSeaSwell(wx, wz, tSec, freezeAmt) {
    var f = 1.0 - clamp(freezeAmt || 0.0, 0.0, 1.0) * 0.92;
    var t = tSec * f;
    var w1 = Math.sin(wx * 0.18 + wz * 0.12 + t * 1.25) * 0.14;
    var w2 = Math.cos(wx * 0.42 - wz * 0.35 + t * 1.7) * 0.06;
    return (w1 + w2) * f;
  }

  // ============================================================================
  // PROCEDURAL TEXTURES, SOBEL NORMAL MAPS & SOFT RADIAL SPRITES
  // ============================================================================
  function makeSoftRadialTexture(THREE, innerRGBA, midRGBA, outerRGBA) {
    var canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    var c = canvas.getContext('2d');
    var g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0.0, innerRGBA || 'rgba(255, 252, 235, 1.0)');
    g.addColorStop(0.26, midRGBA || 'rgba(251, 191, 36, 0.72)');
    g.addColorStop(0.62, outerRGBA || 'rgba(217, 119, 6, 0.18)');
    g.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
    var tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  function makeSobelNormalMap(THREE, srcCanvas, strength, repeatX, repeatY) {
    var w = srcCanvas.width;
    var h = srcCanvas.height;
    var src = srcCanvas.getContext('2d').getImageData(0, 0, w, h).data;
    var dstCanvas = document.createElement('canvas');
    dstCanvas.width = w;
    dstCanvas.height = h;
    var dstCtx = dstCanvas.getContext('2d');
    var out = dstCtx.createImageData(w, h);
    var od = out.data;
    var str = strength || 1.6;

    function lum(x, y) {
      var wx = ((x % w) + w) % w;
      var wy = ((y % h) + h) % h;
      var idx = (wy * w + wx) * 4;
      return (src[idx] * 0.299 + src[idx + 1] * 0.587 + src[idx + 2] * 0.114) / 255.0;
    }

    for (var y = 0; y < h; y++) {
      for (var x = 0; x < w; x++) {
        var tl = lum(x - 1, y - 1), l = lum(x - 1, y), bl = lum(x - 1, y + 1);
        var t  = lum(x, y - 1),                        b  = lum(x, y + 1);
        var tr = lum(x + 1, y - 1), r = lum(x + 1, y), br = lum(x + 1, y + 1);
        var dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
        var dY = (bl + 2.0 * b + br) - (tl + 2.0 * t + tr);
        var nx = -dX * str;
        var ny = dY * str;
        var nz = 1.0;
        var inv = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
        var idx = (y * w + x) * 4;
        od[idx]     = Math.round((nx * inv * 0.5 + 0.5) * 255);
        od[idx + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
        od[idx + 2] = Math.round((nz * inv * 0.5 + 0.5) * 255);
        od[idx + 3] = 255;
      }
    }
    dstCtx.putImageData(out, 0, 0);
    var tex = new THREE.CanvasTexture(dstCanvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX || 2, repeatY || repeatX || 2);
    return tex;
  }

  function createMaterials(THREE) {
    var rng = mulberry32(195309);

    function makeStoneSet(kind, repX, repY, normStr) {
      var cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 256;
      var c = cv.getContext('2d');

      if (kind === 'marble') {
        c.fillStyle = '#f3ece0';
        c.fillRect(0, 0, 256, 256);
        for (var i = 0; i < 420; i++) {
          c.fillStyle = i % 2 === 0 ? 'rgba(225, 211, 188, 0.16)' : 'rgba(255, 252, 246, 0.22)';
          c.beginPath();
          c.ellipse(rng() * 256, rng() * 256, 8 + rng() * 28, 4 + rng() * 14, rng() * Math.PI, 0, Math.PI * 2);
          c.fill();
        }
        for (var v = 0; v < 14; v++) {
          c.strokeStyle = v % 3 === 0 ? 'rgba(196, 164, 114, 0.26)' : 'rgba(158, 150, 138, 0.18)';
          c.lineWidth = 0.8 + rng() * 1.8;
          c.beginPath();
          var vx = rng() * 256;
          var vy = 0;
          c.moveTo(vx, vy);
          while (vy < 256) {
            vy += 16;
            vx += (rng() - 0.46) * 18;
            c.lineTo(vx, vy);
          }
          c.stroke();
        }
      } else if (kind === 'granite') {
        c.fillStyle = '#a85d4c';
        c.fillRect(0, 0, 256, 256);
        var cols = ['#c97b68', '#7d3f32', '#e4c2b2', '#4a2a24', '#d49a6a'];
        for (var g = 0; g < 2600; g++) {
          c.fillStyle = cols[g % cols.length];
          c.globalAlpha = 0.28 + rng() * 0.35;
          c.beginPath();
          c.arc(rng() * 256, rng() * 256, 0.8 + rng() * 2.6, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1.0;
      } else if (kind === 'limestone') {
        c.fillStyle = '#d9ccb4';
        c.fillRect(0, 0, 256, 256);
        for (var l = 0; l < 700; l++) {
          c.fillStyle = l % 3 === 0 ? 'rgba(168, 148, 118, 0.18)' : 'rgba(242, 233, 216, 0.18)';
          c.fillRect(rng() * 256, rng() * 256, 4 + rng() * 18, 3 + rng() * 10);
        }
        c.strokeStyle = 'rgba(110, 92, 68, 0.32)';
        c.lineWidth = 1.5;
        for (var row = 0; row < 8; row++) {
          var ry = row * 32;
          c.beginPath();
          c.moveTo(0, ry);
          c.lineTo(256, ry);
          c.stroke();
          var off = (row % 2) * 32;
          for (var col = 0; col < 4; col++) {
            var rx = (col * 64 + off) % 256;
            c.beginPath();
            c.moveTo(rx, ry);
            c.lineTo(rx, ry + 32);
            c.stroke();
          }
        }
      } else if (kind === 'karst') {
        var grd = c.createLinearGradient(0, 0, 0, 256);
        grd.addColorStop(0.0, '#ccbba0');
        grd.addColorStop(0.68, '#a69174');
        grd.addColorStop(1.0, '#4f5643');
        c.fillStyle = grd;
        c.fillRect(0, 0, 256, 256);
        for (var k = 0; k < 1200; k++) {
          c.fillStyle = k % 3 === 0 ? 'rgba(72, 62, 46, 0.22)' : 'rgba(232, 220, 198, 0.15)';
          c.beginPath();
          c.ellipse(rng() * 256, rng() * 256, 3 + rng() * 14, 2 + rng() * 9, rng() * 0.5, 0, Math.PI * 2);
          c.fill();
        }
      } else if (kind === 'timber') {
        c.fillStyle = '#6f482a';
        c.fillRect(0, 0, 256, 256);
        for (var p = 0; p < 8; p++) {
          var py = p * 32;
          c.fillStyle = p % 2 === 0 ? 'rgba(92, 56, 30, 0.35)' : 'rgba(132, 88, 52, 0.25)';
          c.fillRect(0, py, 256, 30);
          c.strokeStyle = 'rgba(38, 20, 8, 0.55)';
          c.lineWidth = 1.4;
          c.beginPath();
          c.moveTo(0, py);
          c.lineTo(256, py);
          c.stroke();
        }
        for (var wg = 0; wg < 180; wg++) {
          c.strokeStyle = 'rgba(48, 28, 12, 0.18)';
          c.lineWidth = 0.9;
          var wy = rng() * 256;
          c.beginPath();
          c.moveTo(0, wy);
          c.bezierCurveTo(85, wy + (rng() - 0.5) * 6, 170, wy + (rng() - 0.5) * 6, 256, wy);
          c.stroke();
        }
      } else if (kind === 'bark') {
        c.fillStyle = '#5c5042';
        c.fillRect(0, 0, 256, 256);
        for (var bk = 0; bk < 220; bk++) {
          c.strokeStyle = bk % 2 === 0 ? 'rgba(36, 30, 24, 0.45)' : 'rgba(128, 118, 98, 0.28)';
          c.lineWidth = 1.4 + rng() * 2.4;
          var bx = rng() * 256;
          c.beginPath();
          c.moveTo(bx, 0);
          for (var by = 32; by <= 256; by += 32) {
            bx += (rng() - 0.5) * 14;
            c.lineTo(bx, by);
          }
          c.stroke();
        }
      } else if (kind === 'terracotta') {
        c.fillStyle = '#b65337';
        c.fillRect(0, 0, 256, 256);
        for (var tc = 0; tc < 700; tc++) {
          c.fillStyle = tc % 2 === 0 ? 'rgba(150, 58, 34, 0.22)' : 'rgba(218, 124, 88, 0.18)';
          c.beginPath();
          c.arc(rng() * 256, rng() * 256, 2 + rng() * 8, 0, Math.PI * 2);
          c.fill();
        }
      } else if (kind === 'bronze') {
        c.fillStyle = '#4e4637';
        c.fillRect(0, 0, 256, 256);
        for (var bz = 0; bz < 520; bz++) {
          c.fillStyle = bz % 4 === 0 ? 'rgba(78, 124, 106, 0.22)' : 'rgba(138, 108, 66, 0.18)';
          c.beginPath();
          c.arc(rng() * 256, rng() * 256, 3 + rng() * 12, 0, Math.PI * 2);
          c.fill();
        }
      } else if (kind === 'olive_leaf') {
        c.fillStyle = '#2a3f28';
        c.fillRect(0, 0, 256, 256);
        var lCols = ['#365132', '#456440', '#5c7c56', '#72906c', '#8ca687', '#a2b89e'];
        for (var ol = 0; ol < 1900; ol++) {
          c.fillStyle = lCols[ol % lCols.length];
          c.beginPath();
          c.ellipse(rng() * 256, rng() * 256, 6.5 + rng() * 6.0, 1.7 + rng() * 1.9, rng() * Math.PI, 0, Math.PI * 2);
          c.fill();
        }
      }

      var map = new THREE.CanvasTexture(cv);
      map.wrapS = THREE.RepeatWrapping;
      map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(repX || 2, repY || repX || 2);
      var normalMap = makeSobelNormalMap(THREE, cv, normStr || 1.4, repX || 2, repY || repX || 2);
      return { map: map, normalMap: normalMap };
    }

    var marble = makeStoneSet('marble', 2, 2, 0.9);
    var granite = makeStoneSet('granite', 1, 3, 1.3);
    var limestone = makeStoneSet('limestone', 3, 3, 1.5);
    var karst = makeStoneSet('karst', 2, 2, 1.8);
    var timber = makeStoneSet('timber', 2, 2, 1.4);
    var bark = makeStoneSet('bark', 2, 3, 1.9);
    var terracotta = makeStoneSet('terracotta', 3, 3, 1.2);
    var bronze = makeStoneSet('bronze', 2, 2, 1.0);
    var oliveLeaf = makeStoneSet('olive_leaf', 4, 4, 2.2);

    function applyOliveGoldRim(mat, rimStrength) {
      var str = rimStrength !== undefined ? rimStrength : 0.22;
      mat.onBeforeCompile = function (shader) {
        shader.fragmentShader = shader.fragmentShader.replace(
          'gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
          [
            'float oliveNdotV = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);',
            'float oliveUp = clamp(normal.y * 0.5 + 0.5, 0.0, 1.0);',
            'float oliveRim = pow(1.0 - oliveNdotV, 3.1) * (0.35 + 0.65 * oliveUp);',
            'outgoingLight += vec3(0.94, 0.83, 0.46) * oliveRim * ' + str.toFixed(3) + ';',
            'gl_FragColor = vec4( outgoingLight, diffuseColor.a );'
          ].join('\n')
        );
      };
      mat.customProgramCacheKey = function () {
        return 'phraxos_olive_rim_' + str.toFixed(3);
      };
      return mat;
    }

    return {
      pentelicMarble: new THREE.MeshStandardMaterial({
        map: marble.map,
        normalMap: marble.normalMap,
        normalScale: new THREE.Vector2(0.55, 0.55),
        roughness: 0.30,
        metalness: 0.06
      }),
      whitewash: new THREE.MeshStandardMaterial({
        color: 0xfaf7f0,
        normalMap: limestone.normalMap,
        normalScale: new THREE.Vector2(0.35, 0.35),
        roughness: 0.52,
        metalness: 0.02
      }),
      roseGranite: new THREE.MeshStandardMaterial({
        map: granite.map,
        normalMap: granite.normalMap,
        normalScale: new THREE.Vector2(0.75, 0.75),
        roughness: 0.36,
        metalness: 0.08
      }),
      limestone: new THREE.MeshStandardMaterial({
        map: limestone.map,
        normalMap: limestone.normalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughness: 0.65,
        metalness: 0.03
      }),
      karstRock: new THREE.MeshStandardMaterial({
        map: karst.map,
        normalMap: karst.normalMap,
        normalScale: new THREE.Vector2(1.0, 1.0),
        roughness: 0.84,
        metalness: 0.02
      }),
      polishedBrass: new THREE.MeshStandardMaterial({
        color: 0xd89b3c,
        roughness: 0.22,
        metalness: 0.88
      }),
      giltGold: new THREE.MeshStandardMaterial({
        color: 0xf4c44e,
        emissive: 0x6b3e08,
        emissiveIntensity: 0.22,
        roughness: 0.16,
        metalness: 0.92
      }),
      mirrorGilt: new THREE.MeshStandardMaterial({
        color: 0xfde68a,
        emissive: 0xb45309,
        emissiveIntensity: 0.34,
        roughness: 0.09,
        metalness: 0.95
      }),
      patinatedBronze: new THREE.MeshStandardMaterial({
        map: bronze.map,
        normalMap: bronze.normalMap,
        normalScale: new THREE.Vector2(0.5, 0.5),
        roughness: 0.40,
        metalness: 0.78
      }),
      terracotta: new THREE.MeshStandardMaterial({
        map: terracotta.map,
        normalMap: terracotta.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.58,
        metalness: 0.05
      }),
      carvedTimber: new THREE.MeshStandardMaterial({
        map: timber.map,
        normalMap: timber.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.62,
        metalness: 0.04
      }),
      darkKeelTimber: new THREE.MeshStandardMaterial({
        color: 0x3f2615,
        normalMap: timber.normalMap,
        normalScale: new THREE.Vector2(0.7, 0.7),
        roughness: 0.68,
        metalness: 0.04
      }),
      cycladicBlue: new THREE.MeshStandardMaterial({
        color: 0x1b5c8e,
        roughness: 0.36,
        metalness: 0.10
      }),
      sailCanvas: new THREE.MeshStandardMaterial({
        color: 0xf5ecd8,
        roughness: 0.78,
        metalness: 0.02,
        side: THREE.DoubleSide
      }),
      seaQuartz: new THREE.MeshStandardMaterial({
        color: 0xcffafe,
        emissive: 0x0e7490,
        emissiveIntensity: 0.28,
        roughness: 0.11,
        metalness: 0.18,
        transparent: true,
        opacity: 0.84
      }),
      chronosGlass: new THREE.MeshStandardMaterial({
        color: 0xbae6fd,
        emissive: 0x0369a1,
        emissiveIntensity: 0.35,
        roughness: 0.09,
        metalness: 0.15,
        transparent: true,
        opacity: 0.68
      }),
      lanternParchment: new THREE.MeshStandardMaterial({
        color: 0xfef08a,
        emissive: 0xd97706,
        emissiveIntensity: 0.92,
        roughness: 0.32,
        metalness: 0.04
      }),
      warmCandleGlow: new THREE.MeshStandardMaterial({
        color: 0xfffbeb,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.25,
        roughness: 0.20
      }),
      oliveBark: new THREE.MeshStandardMaterial({
        map: bark.map,
        normalMap: bark.normalMap,
        normalScale: new THREE.Vector2(1.15, 1.15),
        roughness: 0.86,
        metalness: 0.02
      }),
      oliveDeep: applyOliveGoldRim(new THREE.MeshStandardMaterial({
        color: 0x486344,
        map: oliveLeaf.map,
        normalMap: oliveLeaf.normalMap,
        normalScale: new THREE.Vector2(1.20, 1.20),
        roughness: 0.82,
        metalness: 0.02
      }), 0.16),
      oliveSilver: applyOliveGoldRim(new THREE.MeshStandardMaterial({
        color: 0x678363,
        map: oliveLeaf.map,
        normalMap: oliveLeaf.normalMap,
        normalScale: new THREE.Vector2(1.18, 1.18),
        roughness: 0.74,
        metalness: 0.03
      }), 0.22),
      oliveSunGold: applyOliveGoldRim(new THREE.MeshStandardMaterial({
        color: 0x829c7d,
        map: oliveLeaf.map,
        normalMap: oliveLeaf.normalMap,
        normalScale: new THREE.Vector2(1.12, 1.12),
        roughness: 0.68,
        metalness: 0.04
      }), 0.28),
      maskBronze: new THREE.MeshStandardMaterial({
        color: 0x98703d,
        map: bronze.map,
        normalMap: bronze.normalMap,
        normalScale: new THREE.Vector2(0.65, 0.65),
        roughness: 0.34,
        metalness: 0.80,
        side: THREE.DoubleSide
      }),
      maskHighlightBronze: new THREE.MeshStandardMaterial({
        color: 0xc99648,
        roughness: 0.25,
        metalness: 0.86
      }),
      maskCavityDark: new THREE.ShaderMaterial({
        vertexShader: 'void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'void main() { gl_FragColor = vec4(0.018, 0.012, 0.008, 1.0); }'
      }),
      planetIvory: new THREE.MeshStandardMaterial({ color: 0xfaf3e3, roughness: 0.24, metalness: 0.06 }),
      planetAmber: new THREE.MeshStandardMaterial({ color: 0xeab308, emissive: 0x78350f, emissiveIntensity: 0.18, roughness: 0.20, metalness: 0.25 }),
      planetLapis: new THREE.MeshStandardMaterial({ color: 0x1d4ed8, emissive: 0x1e3a8a, emissiveIntensity: 0.16, roughness: 0.22, metalness: 0.18 }),
      planetAgate: new THREE.MeshStandardMaterial({ color: 0xb93822, roughness: 0.25, metalness: 0.12 }),
      starSpriteTex: makeSoftRadialTexture(THREE, 'rgba(255,253,240,1.0)', 'rgba(253,224,71,0.78)', 'rgba(217,119,6,0.16)'),
      aquaSpriteTex: makeSoftRadialTexture(THREE, 'rgba(240,253,255,0.95)', 'rgba(125,211,252,0.58)', 'rgba(14,116,144,0.12)')
    };
  }

  // Bespoke Engraved Canvas Textures (Obelisk Glyphs, Attic Stelae Epitaphs, Zodiac & Sail Borders)
  function makeObeliskGlyphMaterial(THREE, baseMat) {
    var cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 1024;
    var c = cv.getContext('2d');
    c.fillStyle = '#a45b4a';
    c.fillRect(0, 0, 256, 1024);
    var rng = mulberry32(4411);
    var cols = ['#c77a66', '#7b3e31', '#dfb9a6', '#562f27'];
    for (var i = 0; i < 3400; i++) {
      c.fillStyle = cols[i % 4];
      c.globalAlpha = 0.34;
      c.fillRect(rng() * 256, rng() * 1024, 2 + rng() * 3, 2 + rng() * 3);
    }
    c.globalAlpha = 1.0;
    // Recessed gilt cartouche border & classical Greek astronomical glyphs
    c.strokeStyle = '#eab308';
    c.lineWidth = 5;
    c.strokeRect(42, 48, 172, 928);
    c.lineWidth = 2;
    c.strokeRect(52, 58, 152, 908);
    c.fillStyle = '#fde68a';
    c.font = 'bold 42px Georgia, serif';
    c.textAlign = 'center';
    var glyphs = ['Η', 'Λ', 'Ι', 'Ο', 'Σ', '•', 'Φ', 'Ω', 'Σ', '•', 'Λ', 'Ο', 'Γ', 'Ο', 'Σ', '•', 'Φ', 'Ρ', 'Α', 'Ξ'];
    for (var g = 0; g < glyphs.length; g++) {
      c.fillText(glyphs[g], 128, 110 + g * 44);
    }
    var tex = new THREE.CanvasTexture(cv);
    var norm = makeSobelNormalMap(THREE, cv, 1.8, 1, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: norm,
      roughness: 0.32,
      metalness: 0.22
    });
  }

  function makeEpitaphMaterial(THREE, lines) {
    var cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 512;
    var c = cv.getContext('2d');
    c.fillStyle = '#ece3d2';
    c.fillRect(0, 0, 256, 512);
    var rng = mulberry32(lines[0].length * 97 + 13);
    for (var i = 0; i < 450; i++) {
      c.fillStyle = i % 2 === 0 ? 'rgba(182, 166, 140, 0.16)' : 'rgba(255, 251, 242, 0.2)';
      c.fillRect(rng() * 256, rng() * 512, 6 + rng() * 18, 4 + rng() * 12);
    }
    // Recessed Attic inscription panel + Greek key border
    c.strokeStyle = '#9a7b4f';
    c.lineWidth = 5;
    c.strokeRect(22, 26, 212, 460);
    c.strokeStyle = '#c2923c';
    c.lineWidth = 2;
    c.strokeRect(30, 34, 196, 444);

    // Laurel rosette emblem at top
    c.strokeStyle = '#b47b24';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(128, 96, 28, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = '#85581a';
    c.font = 'bold 26px Georgia, serif';
    c.textAlign = 'center';
    c.fillText('Φ', 128, 105);

    c.fillStyle = '#4a3c2c';
    c.font = 'bold 21px Georgia, serif';
    for (var l = 0; l < lines.length; l++) {
      c.fillText(lines[l], 128, 178 + l * 46);
    }
    var tex = new THREE.CanvasTexture(cv);
    var norm = makeSobelNormalMap(THREE, cv, 2.0, 1, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: norm,
      roughness: 0.44,
      metalness: 0.08
    });
  }

  function makeOrchestraMosaicMaterial(THREE) {
    var cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    var c = cv.getContext('2d');
    c.fillStyle = '#e7dcc6';
    c.fillRect(0, 0, 512, 512);
    var cx = 256, cy = 256;
    var rings = [
      [246, '#334155', 10],
      [226, '#b45309', 8],
      [196, '#1e293b', 14],
      [154, '#c28e36', 6],
      [96,  '#334155', 8]
    ];
    for (var r = 0; r < rings.length; r++) {
      c.strokeStyle = rings[r][1];
      c.lineWidth = rings[r][2];
      c.beginPath();
      c.arc(cx, cy, rings[r][0], 0, Math.PI * 2);
      c.stroke();
    }
    // 16-point Classical Compass / Sunburst Mosaic
    for (var s = 0; s < 16; s++) {
      var a = (s / 16) * Math.PI * 2;
      c.fillStyle = s % 2 === 0 ? '#b45309' : '#334155';
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a - 0.11) * 90, cy + Math.sin(a - 0.11) * 90);
      c.lineTo(cx + Math.cos(a) * 146, cy + Math.sin(a) * 146);
      c.lineTo(cx + Math.cos(a + 0.11) * 90, cy + Math.sin(a + 0.11) * 90);
      c.closePath();
      c.fill();
    }
    // Tesserae stone grid impression
    c.strokeStyle = 'rgba(90, 76, 58, 0.16)';
    c.lineWidth = 1;
    for (var g = 0; g < 512; g += 8) {
      c.beginPath(); c.moveTo(g, 0); c.lineTo(g, 512); c.stroke();
      c.beginPath(); c.moveTo(0, g); c.lineTo(512, g); c.stroke();
    }
    var tex = new THREE.CanvasTexture(cv);
    var norm = makeSobelNormalMap(THREE, cv, 1.5, 1, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: norm,
      roughness: 0.38,
      metalness: 0.08
    });
  }

  function makeZodiacDialMaterial(THREE) {
    var cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = 512;
    var c = cv.getContext('2d');
    c.fillStyle = '#2d261c';
    c.fillRect(0, 0, 512, 512);
    var cx = 256, cy = 256;
    var grad = c.createRadialGradient(cx, cy, 20, cx, cy, 250);
    grad.addColorStop(0.0, '#574427');
    grad.addColorStop(0.65, '#3b2e1b');
    grad.addColorStop(1.0, '#785722');
    c.fillStyle = grad;
    c.beginPath();
    c.arc(cx, cy, 250, 0, Math.PI * 2);
    c.fill();

    var radii = [242, 218, 172, 128, 78];
    c.strokeStyle = '#eab308';
    for (var i = 0; i < radii.length; i++) {
      c.lineWidth = i === 0 ? 5 : 2.5;
      c.beginPath();
      c.arc(cx, cy, radii[i], 0, Math.PI * 2);
      c.stroke();
    }
    // 365 Parapegma degree ticks
    for (var d = 0; d < 72; d++) {
      var ang = (d / 72) * Math.PI * 2;
      var r0 = d % 6 === 0 ? 172 : 206;
      c.lineWidth = d % 6 === 0 ? 2.4 : 1.1;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
      c.lineTo(cx + Math.cos(ang) * 218, cy + Math.sin(ang) * 218);
      c.stroke();
    }
    var zodiac = ['ΚΡΙΟΣ', 'ΤΑΥΡΟΣ', 'ΔΙΔΥΜΟΙ', 'ΚΑΡΚΙΝΟΣ', 'ΛΕΩΝ', 'ΠΑΡΘΕΝΟΣ', 'ΖΥΓΟΣ', 'ΣΚΟΡΠΙΟΣ', 'ΤΟΞΟΤΗΣ', 'ΑΙΓΟΚΕΡΩΣ', 'ΥΔΡΟΧΟΟΣ', 'ΙΧΘΥΕΣ'];
    c.fillStyle = '#fde68a';
    c.font = 'bold 15px Georgia, serif';
    c.textAlign = 'center';
    for (var z = 0; z < 12; z++) {
      var za = (z + 0.5) * (Math.PI * 2 / 12);
      c.save();
      c.translate(cx + Math.cos(za) * 194, cy + Math.sin(za) * 194);
      c.rotate(za + Math.PI / 2);
      c.fillText(zodiac[z], 0, 5);
      c.restore();
    }
    var tex = new THREE.CanvasTexture(cv);
    var norm = makeSobelNormalMap(THREE, cv, 1.6, 1, 1);
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: norm,
      roughness: 0.30,
      metalness: 0.76
    });
  }

  // ============================================================================
  // CUSTOM VOLUMETRIC & ATMOSPHERIC GLSL SHADERS (ZERO HARD EDGES!)
  // ============================================================================
  function createVolumetricBeamMaterial(THREE, shaderList, opts) {
    var o = opts || {};
    var uniforms = {
      uTime:      { value: 0.0 },
      uReveal:    { value: 1.0 },
      uOpacity:   { value: o.opacity !== undefined ? o.opacity : 0.62 },
      uSpeed:     { value: o.speed !== undefined ? o.speed : 1.4 },
      uColorBase: { value: new THREE.Color(o.colorBase !== undefined ? o.colorBase : 0xfde68a) },
      uColorTip:  { value: new THREE.Color(o.colorTip !== undefined ? o.colorTip : 0xf59e0b) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  vUv = uv;',
        '  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vViewPosition = -mvPosition.xyz;',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uReveal;',
        'uniform float uOpacity;',
        'uniform float uSpeed;',
        'uniform vec3 uColorBase;',
        'uniform vec3 uColorTip;',
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  float fresnel = pow(max(dot(normalize(vNormal), normalize(vViewPosition)), 0.0), 2.4);',
        '  float vFade = smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.55, 1.0, vUv.y));',
        '  float alpha = fresnel * vFade;',
        '  float shimmer = 0.88 + 0.12 * sin(vUv.y * 12.0 - uTime * uSpeed + vUv.x * 6.2831853);',
        '  vec3 col = mix(uColorBase, uColorTip, smoothstep(0.05, 0.85, vUv.y));',
        '  float finalA = alpha * shimmer * uOpacity * uReveal;',
        '  if (finalA < 0.002) discard;',
        '  gl_FragColor = vec4(col * finalA, finalA);',
        '}'
      ].join('\n')
    });
    mat.userData = { noMerge: true };
    shaderList.push(uniforms);
    return mat;
  }

  function createRadialHaloMaterial(THREE, shaderList, colorInner, colorOuter) {
    var uniforms = {
      uTime:       { value: 0.0 },
      uProgress:   { value: 0.0 },
      uOpacity:    { value: 0.0 },
      uColorInner: { value: new THREE.Color(colorInner || 0xfffbeb) },
      uColorOuter: { value: new THREE.Color(colorOuter || 0xf59e0b) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uProgress;',
        'uniform float uOpacity;',
        'uniform vec3 uColorInner;',
        'uniform vec3 uColorOuter;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = (vUv - 0.5) * 2.0;',
        '  float r = length(p);',
        '  if (r > 1.0) discard;',
        '  float ang = atan(p.y, p.x);',
        '  float edgeFade = pow(1.0 - smoothstep(0.55, 1.0, r), 2.0);',
        '  float coreGlow = exp(-r * r * 5.2) * 0.65;',
        '  float ringR = mix(0.16, 0.78, uProgress);',
        '  float waveRing = exp(-pow((r - ringR) * 8.5, 2.0));',
        '  float meander = 0.72 + 0.28 * cos(ang * 16.0 + r * 18.0 - uTime * 3.0);',
        '  float a = (coreGlow + waveRing * meander * 0.95) * edgeFade * uOpacity;',
        '  if (a < 0.003) discard;',
        '  vec3 col = mix(uColorOuter, uColorInner, clamp(coreGlow + waveRing * 0.5, 0.0, 1.0));',
        '  gl_FragColor = vec4(col * a, a);',
        '}'
      ].join('\n')
    });
    mat.userData = { noMerge: true };
    shaderList.push(uniforms);
    return mat;
  }

  function createSilkArcRibbonMaterial(THREE, shaderList) {
    var uniforms = {
      uTime:    { value: 0.0 },
      uHead:    { value: 0.0 },
      uOpacity: { value: 0.0 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
      vertexShader: [
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'varying vec3 vViewPos;',
        'void main() {',
        '  vUv = uv;',
        '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
        '  vNormal = normalize(normalMatrix * normal);',
        '  vViewPos = -mv.xyz;',
        '  gl_Position = projectionMatrix * mv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uHead;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'varying vec3 vNormal;',
        'varying vec3 vViewPos;',
        'void main() {',
        '  float fresnel = pow(max(dot(normalize(vNormal), normalize(vViewPos)), 0.0), 1.85);',
        '  float endSoft = smoothstep(0.0, 0.08, vUv.x) * (1.0 - smoothstep(0.90, 1.0, vUv.x));',
        '  float trail = smoothstep(uHead - 0.52, uHead - 0.06, vUv.x) * (1.0 - smoothstep(uHead - 0.03, uHead + 0.04, vUv.x));',
        '  float pulse = 0.85 + 0.15 * sin(vUv.x * 24.0 - uTime * 9.0);',
        '  float a = fresnel * endSoft * trail * pulse * uOpacity;',
        '  if (a < 0.003) discard;',
        '  vec3 col = mix(vec3(0.96, 0.62, 0.12), vec3(1.0, 0.96, 0.78), smoothstep(uHead - 0.25, uHead, vUv.x));',
        '  gl_FragColor = vec4(col * a, a);',
        '}'
      ].join('\n')
    });
    mat.userData = { noMerge: true };
    shaderList.push(uniforms);
    return mat;
  }

  function createWaterRippleMaterial(THREE, shaderList, tintHex) {
    var uniforms = {
      uTime:   { value: 0.0 },
      uReveal: { value: 1.0 },
      uFreeze: { value: 0.0 },
      uTint:   { value: new THREE.Color(tintHex || 0xe0f2fe) }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: [
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uReveal;',
        'uniform float uFreeze;',
        'uniform vec3 uTint;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 p = (vUv - 0.5) * 2.0;',
        '  float r = length(p);',
        '  if (r > 1.0 || r < 0.18) discard;',
        '  float t = uTime * (1.0 - uFreeze * 0.9);',
        '  float ang = atan(p.y, p.x);',
        '  float wobble = 0.035 * sin(ang * 5.0 + t * 1.6) + 0.02 * cos(ang * 9.0 - t * 2.1);',
        '  float rw = r + wobble;',
        '  float rings = 0.5 + 0.5 * sin(rw * 24.0 - t * 3.4);',
        '  float collar = exp(-pow((rw - 0.48) * 5.5, 2.0));',
        '  float radialFade = smoothstep(0.20, 0.42, r) * pow(1.0 - smoothstep(0.45, 1.0, r), 2.1);',
        '  float a = (collar * 0.52 + rings * radialFade * 0.28) * uReveal;',
        '  if (a < 0.004) discard;',
        '  gl_FragColor = vec4(uTint, a);',
        '}'
      ].join('\n')
    });
    shaderList.push(uniforms);
    return mat;
  }

  function createWindSilkMaterial(THREE, shaderList) {
    var uniforms = {
      uTime:   { value: 0.0 },
      uReveal: { value: 1.0 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  vec3 pos = position;',
        '  float sag = sin(uv.x * 3.14159265);',
        '  pos.y -= sag * 0.26;',
        '  pos.z += sin(uv.x * 7.5 - uTime * 3.2) * 0.16 * sag;',
        '  pos.y += cos(uv.x * 5.0 - uTime * 2.4) * 0.05 * sag;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uReveal;',
        'varying vec2 vUv;',
        'void main() {',
        '  float endFade = smoothstep(0.0, 0.12, vUv.x) * (1.0 - smoothstep(0.88, 1.0, vUv.x));',
        '  float edgeFade = pow(sin(vUv.y * 3.14159265), 1.35);',
        '  float stripe = 0.82 + 0.18 * sin(vUv.y * 18.8495 + vUv.x * 4.0 - uTime * 2.5);',
        '  vec3 col = mix(vec3(0.95, 0.84, 0.56), vec3(0.99, 0.97, 0.90), edgeFade);',
        '  float a = endFade * edgeFade * stripe * 0.68 * uReveal;',
        '  if (a < 0.004) discard;',
        '  gl_FragColor = vec4(col, a);',
        '}'
      ].join('\n')
    });
    mat.userData = { noMerge: true };
    shaderList.push(uniforms);
    return mat;
  }

  function createFlameMaterial(THREE, shaderList) {
    var uniforms = {
      uTime:   { value: 0.0 },
      uReveal: { value: 1.0 }
    };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'void main() {',
        '  vUv = uv;',
        '  vec3 pos = position;',
        '  float sway = pow(uv.y, 1.5);',
        '  pos.x += sin(uTime * 8.5 + uv.y * 6.0) * 0.08 * sway;',
        '  pos.z += cos(uTime * 7.2 + uv.y * 5.0) * 0.07 * sway;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform float uReveal;',
        'varying vec2 vUv;',
        'void main() {',
        '  float xDist = abs(vUv.x - 0.5) * 2.0;',
        '  float taper = 1.0 - vUv.y * 0.82;',
        '  float shape = smoothstep(taper, 0.0, xDist) * smoothstep(0.0, 0.18, vUv.y) * (1.0 - smoothstep(0.65, 1.0, vUv.y));',
        '  float flick = 0.84 + 0.16 * sin(uTime * 14.0 - vUv.y * 9.0);',
        '  vec3 col = mix(vec3(0.95, 0.38, 0.06), vec3(1.0, 0.95, 0.68), smoothstep(0.55, 0.0, xDist) * (1.0 - vUv.y * 0.55));',
        '  float a = shape * flick * 0.92 * uReveal;',
        '  if (a < 0.004) discard;',
        '  gl_FragColor = vec4(col * a, a);',
        '}'
      ].join('\n')
    });
    shaderList.push(uniforms);
    return mat;
  }

  // ============================================================================
  // REUSABLE ARCHITECTURAL, BATCHING & MECHANICAL GEOMETRY SCULPTORS
  // ============================================================================
  function enableShadows(root, cast, receive) {
    var c = cast !== false;
    var r = receive !== false;
    root.traverse(function (obj) {
      if (obj.isMesh) {
        if (obj.material && obj.material.transparent) return;
        var rad = 1.0;
        if (obj.geometry && typeof obj.geometry.computeBoundingSphere === 'function') {
          if (!obj.geometry.boundingSphere) obj.geometry.computeBoundingSphere();
          if (obj.geometry.boundingSphere) rad = obj.geometry.boundingSphere.radius;
        }
        obj.castShadow = c && rad >= 0.85;
        obj.receiveShadow = r;
      }
    });
  }

  function makeWarmGlowSprite(THREE, mats, colorHex, scaleX, scaleY, opacity) {
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mats.starSpriteTex,
      color: colorHex !== undefined ? colorHex : 0xfde68a,
      transparent: true,
      opacity: opacity !== undefined ? opacity : 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    sp.scale.set(scaleX || 2.4, scaleY || scaleX || 2.4, 1.0);
    return sp;
  }

  // Batches all static child meshes inside rootGroup by shared Material reference
  // into single indexed BufferGeometries, collapsing >1,300 draw calls on integrated GPUs.
  function mergeStaticChildrenByMaterial(THREE, rootGroup, excludeList) {
    if (!rootGroup || !THREE || !THREE.Matrix4 || !THREE.Matrix3 || !THREE.Quaternion) return 0;

    var excluded = excludeList || [];
    function isExcluded(obj) {
      for (var i = 0; i < excluded.length; i++) {
        if (excluded[i] === obj) return true;
      }
      return false;
    }

    var buckets = [];
    var survivorGeos = [];
    var emptyGroupCandidates = [];

    function findBucket(mat) {
      for (var i = 0; i < buckets.length; i++) {
        if (buckets[i].mat === mat) return buckets[i];
      }
      var b = { mat: mat, items: [] };
      buckets.push(b);
      return b;
    }

    function recordSurvivorGeos(subRoot) {
      subRoot.traverse(function (o) {
        if (o.geometry) survivorGeos.push(o.geometry);
      });
    }

    function walk(node, parentMat, isRoot) {
      if (!isRoot && isExcluded(node)) {
        recordSurvivorGeos(node);
        return;
      }

      var curMat = parentMat;
      if (!isRoot) {
        var q = new THREE.Quaternion();
        q.setFromEuler(node.rotation);
        var localM = new THREE.Matrix4();
        localM.compose(node.position, q, node.scale);
        curMat = new THREE.Matrix4().multiplyMatrices(parentMat, localM);
      }

      if (node.isMesh) {
        var mat = node.material;
        var skip = !node.geometry ||
          !node.geometry.attributes ||
          !node.geometry.attributes.position ||
          !mat ||
          Array.isArray(mat) ||
          (mat.userData && mat.userData.noMerge);
        if (skip) {
          if (node.geometry) survivorGeos.push(node.geometry);
        } else {
          findBucket(mat).items.push({ mesh: node, matrix: curMat });
        }
      }

      if (node.children && node.children.length > 0) {
        var kids = node.children.slice();
        for (var c = 0; c < kids.length; c++) {
          walk(kids[c], curMat, false);
        }
        if (!isRoot && !node.isMesh && !node.isSprite && !node.isPoints) {
          emptyGroupCandidates.push(node);
        }
      }
    }

    walk(rootGroup, new THREE.Matrix4(), true);

    var mergedGeoPool = [];
    var mergedCount = 0;
    var tmpV = new THREE.Vector3();
    var tmpN = new THREE.Vector3();

    for (var bIdx = 0; bIdx < buckets.length; bIdx++) {
      var bucket = buckets[bIdx];
      if (bucket.items.length < 2) {
        if (bucket.items.length === 1 && bucket.items[0].mesh.geometry) {
          survivorGeos.push(bucket.items[0].mesh.geometry);
        }
        continue;
      }

      var totalVerts = 0;
      var totalIndices = 0;
      for (var m = 0; m < bucket.items.length; m++) {
        var g0 = bucket.items[m].mesh.geometry;
        if (!g0.attributes.normal) g0.computeVertexNormals();
        var vCount = g0.attributes.position.count;
        totalVerts += vCount;
        totalIndices += g0.index ? g0.index.count : vCount;
      }

      var posOut = new Float32Array(totalVerts * 3);
      var normOut = new Float32Array(totalVerts * 3);
      var uvOut = new Float32Array(totalVerts * 2);
      var idxOut = totalVerts > 65535 ? new Uint32Array(totalIndices) : new Uint16Array(totalIndices);

      var vOffset = 0;
      var iOffset = 0;

      for (var k = 0; k < bucket.items.length; k++) {
        var item = bucket.items[k];
        var srcGeo = item.mesh.geometry;
        var mat4 = item.matrix;
        var normMat3 = new THREE.Matrix3().getNormalMatrix(mat4);
        var flipWinding = mat4.determinant() < 0;

        var posAttr = srcGeo.attributes.position;
        var normAttr = srcGeo.attributes.normal;
        var uvAttr = srcGeo.attributes.uv;
        var vc = posAttr.count;

        for (var v = 0; v < vc; v++) {
          var pBase = (vOffset + v) * 3;
          tmpV.set(posAttr.getX(v), posAttr.getY(v), posAttr.getZ(v)).applyMatrix4(mat4);
          posOut[pBase]     = tmpV.x;
          posOut[pBase + 1] = tmpV.y;
          posOut[pBase + 2] = tmpV.z;

          if (normAttr) {
            tmpN.set(normAttr.getX(v), normAttr.getY(v), normAttr.getZ(v)).applyMatrix3(normMat3).normalize();
            normOut[pBase]     = tmpN.x;
            normOut[pBase + 1] = tmpN.y;
            normOut[pBase + 2] = tmpN.z;
          } else {
            normOut[pBase + 1] = 1.0;
          }

          var uBase = (vOffset + v) * 2;
          if (uvAttr) {
            uvOut[uBase]     = uvAttr.getX(v);
            uvOut[uBase + 1] = uvAttr.getY(v);
          }
        }

        if (srcGeo.index) {
          var srcIdxArr = srcGeo.index.array;
          var ic = srcGeo.index.count;
          for (var t = 0; t < ic; t += 3) {
            var a = srcIdxArr[t] + vOffset;
            var b2 = srcIdxArr[t + 1] + vOffset;
            var c2 = srcIdxArr[t + 2] + vOffset;
            idxOut[iOffset++] = a;
            idxOut[iOffset++] = flipWinding ? c2 : b2;
            idxOut[iOffset++] = flipWinding ? b2 : c2;
          }
        } else {
          for (var t2 = 0; t2 < vc; t2 += 3) {
            var a0 = vOffset + t2;
            var b0 = vOffset + t2 + 1;
            var c0 = vOffset + t2 + 2;
            idxOut[iOffset++] = a0;
            idxOut[iOffset++] = flipWinding ? c0 : b0;
            idxOut[iOffset++] = flipWinding ? b0 : c0;
          }
        }

        vOffset += vc;
      }

      var mergedGeo = new THREE.BufferGeometry();
      mergedGeo.setAttribute('position', new THREE.BufferAttribute(posOut, 3));
      mergedGeo.setAttribute('normal', new THREE.BufferAttribute(normOut, 3));
      mergedGeo.setAttribute('uv', new THREE.BufferAttribute(uvOut, 2));
      mergedGeo.setIndex(new THREE.BufferAttribute(idxOut, 1));
      mergedGeo.computeBoundingSphere();

      var mergedMesh = new THREE.Mesh(mergedGeo, bucket.mat);
      mergedMesh.userData = {
        phraxosModule: 'PhraxosWonders',
        phraxosPreBatched: true,
        skipStaticBatch: true,
        noBatch: true
      };
      rootGroup.add(mergedMesh);

      for (var r = 0; r < bucket.items.length; r++) {
        var oldMesh = bucket.items[r].mesh;
        if (oldMesh.geometry && mergedGeoPool.indexOf(oldMesh.geometry) === -1) {
          mergedGeoPool.push(oldMesh.geometry);
        }
        if (oldMesh.parent) oldMesh.parent.remove(oldMesh);
        mergedCount++;
      }
    }

    // Prune any intermediate static Groups (post-order: deepest leaf groups first) that now have zero children
    for (var gIdx = 0; gIdx < emptyGroupCandidates.length; gIdx++) {
      var grp = emptyGroupCandidates[gIdx];
      if (grp.children.length === 0 && grp.parent && !isExcluded(grp)) {
        grp.parent.remove(grp);
      }
    }

    // Safely dispose temporary source geometries no longer referenced by any surviving mesh
    for (var d = 0; d < mergedGeoPool.length; d++) {
      var candGeo = mergedGeoPool[d];
      if (survivorGeos.indexOf(candGeo) === -1 && typeof candGeo.dispose === 'function') {
        candGeo.dispose();
      }
    }

    return mergedCount;
  }

  // Real Toothed Brass/Bronze Clockwork Gear with Cut-Out Spokes
  function buildToothedGearGeometry(THREE, outerR, rootR, thickness, numTeeth, numSpokes, hubR) {
    var shape = new THREE.Shape();
    var step = (Math.PI * 2.0) / numTeeth;
    for (var i = 0; i < numTeeth; i++) {
      var a0 = i * step;
      var a1 = a0 + step * 0.22;
      var a2 = a0 + step * 0.34;
      var a3 = a0 + step * 0.66;
      var a4 = a0 + step * 0.78;
      var x0 = Math.cos(a0) * rootR,  y0 = Math.sin(a0) * rootR;
      var x1 = Math.cos(a1) * rootR,  y1 = Math.sin(a1) * rootR;
      var x2 = Math.cos(a2) * outerR, y2 = Math.sin(a2) * outerR;
      var x3 = Math.cos(a3) * outerR, y3 = Math.sin(a3) * outerR;
      var x4 = Math.cos(a4) * rootR,  y4 = Math.sin(a4) * rootR;
      if (i === 0) shape.moveTo(x0, y0);
      else shape.lineTo(x0, y0);
      shape.lineTo(x1, y1);
      shape.lineTo(x2, y2);
      shape.lineTo(x3, y3);
      shape.lineTo(x4, y4);
    }
    shape.closePath();

    var innerRimR = rootR * 0.78;
    var coreR = hubR || rootR * 0.26;
    if (numSpokes && numSpokes >= 3 && innerRimR > coreR * 1.45) {
      var spStep = (Math.PI * 2.0) / numSpokes;
      var gapHalf = spStep * 0.34;
      for (var s = 0; s < numSpokes; s++) {
        var sa = s * spStep;
        var hole = new THREE.Path();
        var segs = 8;
        hole.moveTo(Math.cos(sa - gapHalf) * (coreR * 1.25), Math.sin(sa - gapHalf) * (coreR * 1.25));
        for (var k = 0; k <= segs; k++) {
          var angOut = (sa - gapHalf) + (k / segs) * (gapHalf * 2.0);
          hole.lineTo(Math.cos(angOut) * innerRimR, Math.sin(angOut) * innerRimR);
        }
        for (var k2 = segs; k2 >= 0; k2--) {
          var angIn = (sa - gapHalf) + (k2 / segs) * (gapHalf * 2.0);
          hole.lineTo(Math.cos(angIn) * (coreR * 1.25), Math.sin(angIn) * (coreR * 1.25));
        }
        hole.closePath();
        shape.holes.push(hole);
      }
    }

    // Central axle bore hole
    var axleHole = new THREE.Path();
    axleHole.absarc(0, 0, coreR * 0.45, 0, Math.PI * 2, true);
    shape.holes.push(axleHole);

    var geo = new THREE.ExtrudeGeometry(shape, {
      depth: thickness,
      bevelEnabled: true,
      bevelThickness: Math.min(0.014, thickness * 0.2),
      bevelSize: Math.min(0.012, (outerR - rootR) * 0.22),
      bevelSegments: 2,
      curveSegments: 8
    });
    geo.translate(0, 0, -thickness * 0.5);
    return geo;
  }

  // True 20-Flute Classical Greek Column (Doric or Ionic)
  function buildClassicalColumn(THREE, mats, radiusTop, radiusBot, shaftH, isIonic) {
    var g = new THREE.Group();
    // Moulded Attic base
    var plinth = new THREE.Mesh(new THREE.BoxGeometry(radiusBot * 2.65, 0.14, radiusBot * 2.65), mats.limestone);
    plinth.position.y = 0.07;
    g.add(plinth);
    var torusBot = new THREE.Mesh(new THREE.TorusGeometry(radiusBot * 1.12, radiusBot * 0.14, 10, 24), mats.pentelicMarble);
    torusBot.rotation.x = Math.PI / 2;
    torusBot.position.y = 0.19;
    g.add(torusBot);

    // 20-flute concave carved marble shaft
    var flutes = 20;
    var radSegs = flutes * 3;
    var shaftGeo = new THREE.CylinderGeometry(radiusTop, radiusBot, shaftH, radSegs, 6);
    var pos = shaftGeo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var vx = pos.getX(i);
      var vy = pos.getY(i);
      var vz = pos.getZ(i);
      var r = Math.sqrt(vx * vx + vz * vz);
      if (r > 0.001) {
        var ang = Math.atan2(vz, vx);
        var fluteDepth = Math.max(0.0, Math.cos(ang * flutes)) * 0.065 * r;
        // Subtle classical entasis curve
        var hNorm = (vy + shaftH * 0.5) / shaftH;
        var entasis = Math.sin(hNorm * Math.PI) * 0.025 * r;
        var newR = r - fluteDepth + entasis;
        pos.setX(i, (vx / r) * newR);
        pos.setZ(i, (vz / r) * newR);
      }
    }
    shaftGeo.computeVertexNormals();
    var shaft = new THREE.Mesh(shaftGeo, mats.pentelicMarble);
    shaft.position.y = 0.24 + shaftH * 0.5;
    g.add(shaft);

    var topY = 0.24 + shaftH;
    var echinus = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop * 1.38, radiusTop * 0.98, 0.16, 24), mats.pentelicMarble);
    echinus.position.y = topY + 0.08;
    g.add(echinus);

    if (isIonic) {
      [-1, 1].forEach(function (sx) {
        [-1, 1].forEach(function (sz) {
          var volute = new THREE.Mesh(new THREE.TorusGeometry(radiusTop * 0.34, radiusTop * 0.08, 8, 18), mats.pentelicMarble);
          volute.position.set(sx * radiusTop * 1.05, topY + 0.09, sz * radiusTop * 0.62);
          g.add(volute);
        });
      });
    }

    var abacus = new THREE.Mesh(new THREE.BoxGeometry(radiusTop * 2.75, 0.14, radiusTop * 2.75), mats.pentelicMarble);
    abacus.position.y = topY + 0.22;
    g.add(abacus);
    return g;
  }

  // Organic Sculpted Rock / Canopy Cloud Geometry (never flat disco polyhedra!)
  function buildOrganicSculptGeo(THREE, radius, detail, seed, flattenBase) {
    var geo = new THREE.IcosahedronGeometry(radius, detail || 2);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var y = pos.getY(i);
      var z = pos.getZ(i);
      var n = 1.0
        + 0.18 * Math.sin(x * 2.3 + seed) * Math.cos(z * 2.1 - seed * 0.7)
        + 0.11 * Math.cos(y * 3.4 + z * 2.7 + seed * 1.3)
        + 0.07 * Math.sin((x + y + z) * 4.2 - seed);
      x *= n;
      y *= n;
      z *= n;
      if (flattenBase && y < -radius * 0.45) {
        y = -radius * 0.45 + (y + radius * 0.45) * 0.2;
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Flame Torch Sub-Assembly
  function buildTorchFlameMesh(THREE, flameMat, scale) {
    var fg = new THREE.Group();
    var sc = scale || 1.0;
    for (var p = 0; p < 2; p++) {
      var plane = new THREE.Mesh(new THREE.PlaneGeometry(0.42 * sc, 0.72 * sc, 4, 8), flameMat);
      plane.position.y = 0.30 * sc;
      plane.rotation.y = p * (Math.PI * 0.5);
      fg.add(plane);
    }
    return fg;
  }

  // True Lofted Curved-Plank Wooden Greek Hull (Caïque & Classical Galley)
  function buildLoftedWoodenHull(THREE, mats, opts) {
    var L = opts.length || 9.6;
    var B = opts.beam || 2.9;
    var D = opts.depth || 1.42;
    var sheerBow = opts.sheerBow || 0.58;
    var sheerStern = opts.sheerStern || 0.48;
    var isGalley = !!opts.isGalley;

    var g = new THREE.Group();
    var nZ = 28;
    var nP = 17;
    var positions = [];
    var uvs = [];
    var indices = [];

    for (var iz = 0; iz <= nZ; iz++) {
      var u = iz / nZ; // 0 = bow (-Z), 1 = stern (+Z)
      var z = (u - 0.5) * L;
      // Smooth Greek hull beam curve: sharp raked bow, full midship, tapered counter stern
      var beamFactor = Math.pow(Math.sin(Math.pow(u, 0.86) * Math.PI), isGalley ? 0.58 : 0.66);
      var halfBeam = Math.max(0.03, (B * 0.5) * beamFactor);
      // Rocker keel line rising toward stempost and sternpost
      var rocker = Math.pow(Math.abs(u - 0.5) * 2.0, 2.4) * (D * 0.38);
      var keelY = -D * 0.52 + rocker;
      var sheerLift = (1.0 - u) * (1.0 - u) * sheerBow + u * u * sheerStern;
      var gunwaleY = D * 0.48 + sheerLift * (0.35 + 0.65 * Math.abs(u - 0.5) * 2.0);

      for (var ip = 0; ip <= nP; ip++) {
        var v = ip / nP; // 0 = port gunwale (-X), 0.5 = keel (0), 1 = starboard gunwale (+X)
        var s = (v - 0.5) * 2.0; // -1 .. +1
        var absS = Math.abs(s);
        // Wineglass bilge section
        var x = Math.sign(s) * Math.pow(absS, 0.76) * halfBeam;
        var y = keelY + Math.pow(absS, 1.55) * (gunwaleY - keelY);
        positions.push(x, y, z);
        uvs.push(u * 4.0, v * 2.0);
      }
    }

    var rowStride = nP + 1;
    for (var rz = 0; rz < nZ; rz++) {
      for (var rp = 0; rp < nP; rp++) {
        var a = rz * rowStride + rp;
        var b = (rz + 1) * rowStride + rp;
        var c = (rz + 1) * rowStride + (rp + 1);
        var d = rz * rowStride + (rp + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    var hullGeo = new THREE.BufferGeometry();
    hullGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    hullGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    hullGeo.setIndex(indices);
    hullGeo.computeVertexNormals();

    var hullMat = mats.carvedTimber.clone();
    hullMat.side = THREE.DoubleSide;
    var hullMesh = new THREE.Mesh(hullGeo, hullMat);
    g.add(hullMesh);

    // Painted Cycladic Cobalt / Crimson Sheer Gunwale Mouldings + Planked Wooden Deck
    var portCurvePts = [];
    var stbdCurvePts = [];
    var deckPos = [];
    var deckUV = [];
    var deckIdx = [];
    for (var dz = 0; dz <= nZ; dz++) {
      var du = dz / nZ;
      var pIdx = (dz * rowStride) * 3;
      var sIdx = (dz * rowStride + nP) * 3;
      var px = positions[pIdx], py = positions[pIdx + 1], pz = positions[pIdx + 2];
      var sx = positions[sIdx], sy = positions[sIdx + 1], sz = positions[sIdx + 2];
      portCurvePts.push(new THREE.Vector3(px, py, pz));
      stbdCurvePts.push(new THREE.Vector3(sx, sy, sz));
      var deckY = py - 0.14;
      deckPos.push(px * 0.94, deckY, pz, sx * 0.94, deckY, sz);
      deckUV.push(0, du * 4.0, 1, du * 4.0);
      if (dz < nZ) {
        var base = dz * 2;
        deckIdx.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
      }
    }
    var deckGeo = new THREE.BufferGeometry();
    deckGeo.setAttribute('position', new THREE.Float32BufferAttribute(deckPos, 3));
    deckGeo.setAttribute('uv', new THREE.Float32BufferAttribute(deckUV, 2));
    deckGeo.setIndex(deckIdx);
    deckGeo.computeVertexNormals();
    g.add(new THREE.Mesh(deckGeo, mats.carvedTimber));

    var trimMat = isGalley ? mats.terracotta : mats.cycladicBlue;
    [portCurvePts, stbdCurvePts].forEach(function (pts) {
      var railCurve = new THREE.CatmullRomCurve3(pts);
      var railMesh = new THREE.Mesh(new THREE.TubeGeometry(railCurve, 32, 0.075, 8, false), trimMat);
      g.add(railMesh);
      var capPts = pts.map(function (v) { return new THREE.Vector3(v.x, v.y + 0.06, v.z); });
      var capMesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(capPts), 32, 0.045, 8, false), mats.polishedBrass);
      g.add(capMesh);
    });

    // External Spine Keel, Raked Stempost & Curved Sternpost
    var keelPts = [
      new THREE.Vector3(0, D * 0.48 + sheerBow + 0.55, -L * 0.52),
      new THREE.Vector3(0, -D * 0.18, -L * 0.46),
      new THREE.Vector3(0, -D * 0.54, 0),
      new THREE.Vector3(0, -D * 0.22, L * 0.45),
      new THREE.Vector3(0, D * 0.48 + sheerStern + (isGalley ? 1.15 : 0.42), L * 0.52)
    ];
    var keelTube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(keelPts), 32, 0.085, 8, false),
      mats.darkKeelTimber
    );
    g.add(keelTube);

    // Wooden Rowing Thwarts / Deck Benches
    var nThwarts = isGalley ? 7 : 4;
    for (var t = 0; t < nThwarts; t++) {
      var tu = 0.22 + (t / (nThwarts - 1)) * 0.56;
      var tz = (tu - 0.5) * L;
      var tw = B * 0.82 * Math.pow(Math.sin(Math.pow(tu, 0.86) * Math.PI), 0.62);
      var thwart = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.06, 0.26), mats.darkKeelTimber);
      thwart.position.set(0, D * 0.36, tz);
      g.add(thwart);
    }

    return g;
  }

  // Vertex-Bellied Canvas Sail Mesh (Lateen or Square)
  function buildBillowingSail(THREE, sailMat, width, height, isLateen, bellyDepth) {
    var segX = 16, segY = 16;
    var geo = new THREE.PlaneGeometry(width, height, segX, segY);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var x = pos.getX(i);
      var y = pos.getY(i);
      var u = (x / width) + 0.5;  // 0 .. 1
      var v = (y / height) + 0.5; // 0 .. 1
      if (isLateen) {
        // Triangular Greek lateen sail tapering toward forward tack corner (u=0, v=0)
        var topY = -height * 0.42 + u * height * 0.96;
        var botY = -height * 0.42 + u * height * 0.12;
        y = botY + v * (topY - botY);
        var belly = Math.sin(u * Math.PI) * Math.sin(v * Math.PI) * (bellyDepth || 0.55);
        pos.setXYZ(i, belly, y, (u - 0.5) * width);
      } else {
        // Billowing Hellenistic square sail
        var archLift = Math.sin(u * Math.PI) * 0.18 * (1.0 - v);
        var sqBelly = Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.92 + 0.08) * (bellyDepth || 0.72);
        pos.setXYZ(i, x, y + archLift, -sqBelly);
      }
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, sailMat);
  }

  // ============================================================================
  // STATE & REGISTRY
  // ============================================================================
  var state = {
    initialized: false,
    ctx: null,
    mats: null,
    shaderUniforms: [],
    waterRippleUniforms: [],
    wonders: {}, // key -> { key, group, inner, basePos, focalPos, buryY, mode, targetReveal, revealProgress, revealDelay, isRevealing, baseRing, baseRingUniforms, anim }
    initialSyncDone: false,
    hasRenderedLiveFrame: false,
    lastLevelMode: null,
    cameraLiftTimer: 0,
    cameraTargetYaw: null,
    // Solve Choreography State
    choreoGroup: null,
    choreo: {
      active: false,
      elapsed: 0,
      duration: 2.75,
      altarId: 0,
      solvedIdx: 0,
      isFullAct: false,
      startPos: null,
      ctrlPos: null,
      endPos: null,
      hasTwinArc: false,
      twinEndPos: null,
      twinCtrlPos: null,
      lecternHalo: null,
      lecternHaloUni: null,
      socketPads: [],
      altarGlow: null,
      ribbonMesh: null,
      ribbonUni: null,
      twinRibbonMesh: null,
      twinRibbonUni: null,
      motePoints: null,
      moteSeeds: [],
      cometSprite: null,
      activeTabletRefs: []
    }
  };

  // ============================================================================
  // LEGACY CLEANUP (Tears out old plastic cylinders, cages, knots & logs)
  // ============================================================================
  function disposeObject3D(obj) {
    if (!obj) return;
    obj.traverse(function (child) {
      if (child.geometry && typeof child.geometry.dispose === 'function') {
        child.geometry.dispose();
      }
      if (child.material) {
        var list = Array.isArray(child.material) ? child.material : [child.material];
        for (var i = 0; i < list.length; i++) {
          if (list[i] && typeof list[i].dispose === 'function') {
            list[i].dispose();
          }
        }
      }
    });
  }

  function purgeLegacyWonders(ctx) {
    var scene = ctx.scene;
    var wg = ctx.wonderGroups || {};
    var singleKeys = [
      'solveFXGroup',
      'solarBeacon', 'floatingStones', 'hermesGateways', 'centralObelisk', 'crystallineFrost',
      'hearthLanterns', 'energyArch', 'marbleStairs', 'astrolabeGroup', 'aegisDome',
      'shatteredArch', 'runicStelae', 'windShip', 'sovereignDais',
      'clockPendulum', 'clockGear1', 'clockGear2',
      'timePrismGroup', 'skyIslands', 'skyArk', 'triadBeams', 'goldenGrove',
      'parnassusSanctuaryGroup', 'belfry'
    ];
    for (var i = 0; i < singleKeys.length; i++) {
      var k = singleKeys[i];
      var obj = wg[k];
      if (obj && obj.parent) {
        obj.parent.remove(obj);
        disposeObject3D(obj);
      }
      wg[k] = null;
    }
    if (Array.isArray(wg.clockChimeRings)) {
      for (var c = 0; c < wg.clockChimeRings.length; c++) {
        var cr = wg.clockChimeRings[c];
        if (cr && cr.parent) {
          cr.parent.remove(cr);
          disposeObject3D(cr);
        }
      }
    }
    // Also find & remove the unnamed legacy blocky belfry Group at (-6.8, 0.4, -27.5)
    if (scene && Array.isArray(scene.children)) {
      for (var s = scene.children.length - 1; s >= 0; s--) {
        var ch = scene.children[s];
        if (
          ch && ch.type === 'Group' &&
          Math.abs(ch.position.x - (-6.8)) < 0.2 &&
          Math.abs(ch.position.y - 0.4) < 0.2 &&
          Math.abs(ch.position.z - (-27.5)) < 0.2
        ) {
          scene.remove(ch);
          disposeObject3D(ch);
        }
      }
    }

    // Keep legacy arrays intact as empty arrays so external code never hits null
    wg.solveRings = [];
    wg.solveSparkData = [];
    wg.solarRings = [];
    wg.floatingItems = [];
    wg.hermesRings = [];
    wg.frostRings = [];
    wg.lanternFloaters = [];
    wg.archRibs = [];
    wg.astrolabeRings = [];
    wg.astrolabePlanets = [];
    wg.stelaeBeams = [];
    wg.shipWakeRings = [];
    wg.clockChimeRings = [];
    wg.timeRings = [];
    wg.skyIslandList = [];
    wg.skyArkOars = [];
    wg.searchlightCones = [];
    wg.groveCanopies = [];
    wg.parnassusRings = [];
    wg.parnassusVaultRibs = [];
    wg.solveTimer = 0;
    wg.cameraRevealTimer = 0;
  }

  // ============================================================================
  // WONDER REGISTRATION HELPER (With Base Shimmer Ring & Grounded Emergence)
  // ============================================================================
  function registerWonder(THREE, scene, key, wgProp, baseX, baseY, baseZ, focalX, focalY, focalZ, buryOffset, buildFn) {
    var outer = new THREE.Group();
    outer.position.set(baseX, baseY, baseZ);
    outer.visible = false;
    outer.userData = {
      phraxosModule: 'PhraxosWonders',
      phraxosPreBatched: true,
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    };
    scene.add(outer);

    var inner = new THREE.Group();
    inner.userData = {
      phraxosModule: 'PhraxosWonders',
      phraxosPreBatched: true,
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    };
    outer.add(inner);

    // Base emergence golden shimmer ring flush with stone/water surface at the Wonder's focal footprint
    var ringShaderList = [];
    var ringMat = createRadialHaloMaterial(THREE, ringShaderList, 0xfef3c7, 0xd97706);
    var baseRing = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), ringMat);
    baseRing.rotation.x = -Math.PI / 2;
    var ringWorldY = (focalX * focalX + (focalZ - 8.5) * (focalZ - 8.5) > 235 && focalZ > -10) || Math.abs(focalX) > 13.5 ? -0.33 : 0.50;
    baseRing.position.set(focalX - baseX, ringWorldY - baseY, focalZ - baseZ);
    baseRing.visible = false;
    outer.add(baseRing);

    var animData = buildFn(inner, outer) || {};
    mergeStaticChildrenByMaterial(THREE, inner, animData.excludeFromMerge || []);
    // Offshore water wonders sit over custom ocean shader (which does not sample Three's shadowMap)
    var offshoreOnly = (key === '0_4' || key === '2_2' || key === '3_1' || key === '3_2');
    enableShadows(inner, !offshoreOnly, true);

    var actPrefix = key.charAt(0);
    var headlandZ = (actPrefix === '0' || actPrefix === '1')
      ? 2.0
      : (actPrefix === '2' ? -28.0 : (actPrefix === '3' ? -59.0 : -97.5));

    var entry = {
      key: key,
      wgProp: wgProp,
      group: outer,
      inner: inner,
      basePos: new THREE.Vector3(baseX, baseY, baseZ),
      focalPos: new THREE.Vector3(focalX, focalY, focalZ),
      headlandZ: headlandZ,
      buryY: buryOffset !== undefined ? buryOffset : -5.5,
      targetReveal: 0.0,
      revealProgress: 0.0,
      revealDelay: 0.0,
      shimmerTimer: 0.0,
      settled: false,
      choreoRevealing: false,
      baseRing: baseRing,
      baseRingUni: ringShaderList[0],
      anim: animData
    };
    state.wonders[key] = entry;
    if (state.ctx && state.ctx.wonderGroups && wgProp) {
      state.ctx.wonderGroups[wgProp] = outer;
    }
    return entry;
  }

  // ============================================================================
  // PART B: SCULPTING ALL 21 REMASTERED WORLD WONDERS
  // ============================================================================
  function buildAllRemasteredWonders(ctx) {
    var THREE = ctx.THREE;
    var scene = ctx.scene;
    var mats = state.mats;
    var flameMat = createFlameMaterial(THREE, state.shaderUniforms);

    // Subtle permanent flush Hermes milestone kerb at (-5.5, 0.45, 0.8) & Belfry foundation kerb
    // matching existing terrace flagstone obstacles cleanly even before unlocking
    var hermesKerb = new THREE.Group();
    hermesKerb.position.set(-5.5, 0.45, 0.8);
    var hkStep = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.16, 1.42), mats.limestone);
    hkStep.position.y = 0.08;
    hermesKerb.add(hkStep);
    var hkDial = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.52, 0.12, 16), mats.patinatedBronze);
    hkDial.position.y = 0.22;
    hermesKerb.add(hkDial);
    enableShadows(hermesKerb, true, true);
    scene.add(hermesKerb);

    var belfryKerb = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.18, 2.55), mats.limestone);
    belfryKerb.position.set(-6.95, 0.54, -27.7);
    belfryKerb.receiveShadow = true;
    scene.add(belfryKerb);

    // --------------------------------------------------------------------------
    // ACT I (WEST TERRACE)
    // --------------------------------------------------------------------------

    // 0_0: Solar Beacon — Grounded Fluted Helios Column + Geared Bronze Yoke + Concave Archimedes Mirror
    registerWonder(THREE, scene, '0_0', 'solarBeacon', -7.8, 0.45, 0.6, -7.8, 4.9, 0.6, -5.8, function (g) {
      var step1 = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.52, 0.22, 8), mats.limestone);
      step1.position.y = 0.11;
      g.add(step1);
      var step2 = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.24, 0.24, 8), mats.pentelicMarble);
      step2.position.y = 0.34;
      g.add(step2);

      var col = buildClassicalColumn(THREE, mats, 0.36, 0.44, 2.95, false);
      col.position.y = 0.46;
      g.add(col);

      // Geared bronze azimuth turntable & elevation yoke
      var azimuthPivot = new THREE.Group();
      azimuthPivot.position.y = 3.92;
      g.add(azimuthPivot);

      var baseGear = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.68, 0.58, 0.10, 24, 6, 0.18), mats.polishedBrass);
      baseGear.rotation.x = Math.PI / 2;
      azimuthPivot.add(baseGear);

      var yokeBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.50, 0.18, 16), mats.patinatedBronze);
      yokeBase.position.y = 0.12;
      azimuthPivot.add(yokeBase);

      [-0.86, 0.86].forEach(function (ax) {
        var armCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(ax * 0.35, 0.16, 0),
          new THREE.Vector3(ax * 0.95, 0.52, 0),
          new THREE.Vector3(ax, 1.15, 0)
        ]);
        azimuthPivot.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 16, 0.08, 10, false), mats.patinatedBronze));
      });

      var sideGear = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.38, 0.31, 0.08, 16, 5, 0.10), mats.polishedBrass);
      sideGear.rotation.y = Math.PI / 2;
      sideGear.position.set(0.96, 1.15, 0);
      azimuthPivot.add(sideGear);

      // Concave Parabolic Archimedes Mirror Dish
      var dishGroup = new THREE.Group();
      dishGroup.position.y = 1.15;
      dishGroup.rotation.x = -0.58; // Aimed gracefully skyward & seaward
      azimuthPivot.add(dishGroup);

      var dishPts = [];
      for (var p = 0; p <= 12; p++) {
        var r = (p / 12) * 0.82;
        dishPts.push(new THREE.Vector2(Math.max(0.01, r), r * r * 0.56));
      }
      var mirrorFrontGeo = new THREE.LatheGeometry(dishPts, 32);
      mirrorFrontGeo.rotateX(Math.PI / 2);
      var mirrorFront = new THREE.Mesh(mirrorFrontGeo, mats.mirrorGilt);
      mirrorFront.material.side = THREE.DoubleSide;
      dishGroup.add(mirrorFront);

      var backPts = dishPts.map(function (v) { return new THREE.Vector2(v.x + 0.03, v.y - 0.06); });
      var mirrorBackGeo = new THREE.LatheGeometry(backPts, 32);
      mirrorBackGeo.rotateX(Math.PI / 2);
      dishGroup.add(new THREE.Mesh(mirrorBackGeo, mats.patinatedBronze));

      var rimRing = new THREE.Mesh(new THREE.TorusGeometry(0.83, 0.055, 12, 36), mats.polishedBrass);
      rimRing.position.z = 0.82 * 0.82 * 0.56;
      dishGroup.add(rimRing);

      // 3 spider struts holding focal crystal sun-spark
      for (var st = 0; st < 3; st++) {
        var sa = (st / 3) * Math.PI * 2;
        var strutCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(sa) * 0.80, Math.sin(sa) * 0.80, 0.38),
          new THREE.Vector3(0, 0, 0.92)
        ]);
        dishGroup.add(new THREE.Mesh(new THREE.TubeGeometry(strutCurve, 8, 0.02, 6, false), mats.polishedBrass));
      }
      var focalSpark = new THREE.Sprite(new THREE.SpriteMaterial({
        map: mats.starSpriteTex,
        color: 0xfffbeb,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      focalSpark.scale.set(1.35, 1.35, 1.0);
      focalSpark.position.z = 0.95;
      dishGroup.add(focalSpark);

      // Volumetric Fresnel Sunbeam cast along mirror optical axis (+Z of dishGroup)
      var sunBeamMat = createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
        colorBase: 0xfffbeb,
        colorTip: 0xf59e0b,
        opacity: 0.64,
        speed: 1.6
      });
      var sunBeam = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 0.58, 28.0, 32, 1, true), sunBeamMat);
      sunBeam.rotation.x = Math.PI / 2;
      sunBeam.position.z = 14.3;
      dishGroup.add(sunBeam);

      mergeStaticChildrenByMaterial(THREE, dishGroup, []);
      mergeStaticChildrenByMaterial(THREE, azimuthPivot, [dishGroup, sideGear]);

      return {
        azimuthPivot: azimuthPivot,
        dishGroup: dishGroup,
        sideGear: sideGear,
        excludeFromMerge: [azimuthPivot]
      };
    });

    // 0_1: Levitation Sight-Line — Grounded Brass Optical Sight-Posts on Parapet + 7 Marble Architrave Prisms over Western Cove
    registerWonder(THREE, scene, '0_1', 'floatingStones', 0, 0.45, 0, -14.5, 3.1, 2.2, -3.5, function (g) {
      // Grounded brass optical sight-posts near the western terrace parapet (keeps terrace view clean!)
      var postCoords = [[-11.4, 0.0, 3.0], [-13.1, 0.0, 2.5]];
      postCoords.forEach(function (pc, idx) {
        var pg = new THREE.Group();
        pg.position.set(pc[0], pc[1], pc[2]);
        var pBase = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.24, 16), mats.pentelicMarble);
        pBase.position.y = 0.12;
        pg.add(pBase);
        var pCol = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.095, 1.38, 14), mats.polishedBrass);
        pCol.position.y = 0.88;
        pg.add(pCol);
        var sightRing = new THREE.Mesh(new THREE.TorusGeometry(0.22 - idx * 0.03, 0.028, 10, 28), mats.giltGold);
        sightRing.rotation.y = Math.PI / 2 - 0.28;
        sightRing.position.y = 1.68;
        pg.add(sightRing);
        var lens = new THREE.Mesh(new THREE.CylinderGeometry(0.18 - idx * 0.03, 0.18 - idx * 0.03, 0.03, 24), mats.seaQuartz);
        lens.rotation.z = Math.PI / 2;
        lens.rotation.y = -0.28;
        lens.position.y = 1.68;
        pg.add(lens);
        g.add(pg);
      });

      // Delicate Fresnel golden optical sight-beam projecting from the brass diopter out across the 7 suspended fragments
      var sightBeamMat = createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
        colorBase: 0xfef3c7,
        colorTip: 0x38bdf8,
        opacity: 0.46,
        speed: 2.0
      });
      var sightBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.10, 14.5, 24, 1, true), sightBeamMat);
      sightBeam.position.set(-18.2, 2.85, 1.05);
      sightBeam.rotation.z = Math.PI / 2 - 0.17;
      sightBeam.rotation.y = -0.28;
      g.add(sightBeam);

      // 7 authentic carved Pentelic marble temple spolia fragments (fluted drums, dentil cornices, broken triglyphs)
      var fragments = [];
      for (var i = 0; i < 7; i++) {
        var t = i / 6.0;
        var fx = -15.6 - Math.sin(t * Math.PI) * 4.2 - t * 3.8;
        var fy = 1.95 + t * 2.35 + Math.sin(t * Math.PI * 1.6) * 0.48;
        var fz = 5.20 - t * 11.4;

        var fg = new THREE.Group();
        fg.position.set(fx, fy, fz);

        var kind = i % 3;
        var baseRotX = 0;
        var baseRotY = 0;
        var baseRotZ = 0;

        if (kind === 0) {
          // Variant A: Broken 20-Flute Doric Column Drum (Tambour) with sheared fracture top & empolion socket
          var drumR = 0.50 + (i === 3 ? 0.06 : 0.0);
          var drumH = 0.94 + (i === 0 ? 0.08 : 0.0);
          var flutes = 20;
          var drumGeo = new THREE.CylinderGeometry(drumR * 0.95, drumR, drumH, flutes * 3, 10);
          var dPos = drumGeo.attributes.position;
          for (var dv = 0; dv < dPos.count; dv++) {
            var vx = dPos.getX(dv);
            var vy = dPos.getY(dv);
            var vz = dPos.getZ(dv);
            var rr = Math.sqrt(vx * vx + vz * vz);
            var ang = Math.atan2(vz, vx);
            if (rr > 0.001 && Math.abs(vy) < drumH * 0.495) {
              var flDepth = Math.max(0.0, Math.cos(ang * flutes)) * 0.145 * rr;
              var nr = rr - flDepth;
              vx = (vx / rr) * nr;
              vz = (vz / rr) * nr;
            }
            if (vy > 0.04) {
              var slant = vx * 0.46 + vz * 0.24;
              var crag = 0.055 * Math.sin(ang * 5.0 + i * 1.7) + 0.035 * Math.cos(ang * 9.0 - i);
              vy = Math.max(-drumH * 0.30, vy - slant + crag);
            }
            dPos.setXYZ(dv, vx, vy, vz);
          }
          drumGeo.computeVertexNormals();
          fg.add(new THREE.Mesh(drumGeo, mats.limestone));

          // Pentelic marble fluted arris collar & recessed empolion dowel socket
          var anaRing = new THREE.Mesh(new THREE.CylinderGeometry(drumR * 0.74, drumR * 0.74, 0.04, 24), mats.pentelicMarble);
          anaRing.position.y = -drumH * 0.5 - 0.01;
          fg.add(anaRing);
          var dowel = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 0.16), mats.karstRock);
          dowel.position.y = -drumH * 0.5 - 0.02;
          fg.add(dowel);

          baseRotX = i === 3 ? -0.36 : 0.38;
          baseRotY = 0.35 + i * 0.55;
          baseRotZ = i === 0 ? -0.26 : 0.24;
        } else if (kind === 1) {
          // Variant B: Stepped Ionic Dentil Cornice (Geison) Corner Fragment with projecting dentil teeth
          var archLower = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.16, 0.50), mats.limestone);
          archLower.position.set(-0.04, -0.24, 0);
          fg.add(archLower);

          var archUpper = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.15, 0.54), mats.pentelicMarble);
          archUpper.position.set(0.0, -0.09, 0.01);
          fg.add(archUpper);

          // Recessed shadow frieze behind the dentil row so every carved marble tooth reads crisply
          var dentilBed = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.16, 0.48), mats.karstRock);
          dentilBed.position.set(0.02, 0.06, -0.01);
          fg.add(dentilBed);

          for (var dt = 0; dt < 7; dt++) {
            var dx = -0.50 + dt * 0.17;
            var tooth = new THREE.Mesh(new THREE.BoxGeometry(0.105, 0.155, 0.16), mats.pentelicMarble);
            tooth.position.set(dx, 0.06, 0.23);
            fg.add(tooth);
          }
          for (var ds = 0; ds < 3; ds++) {
            var dz = 0.08 - ds * 0.16;
            var sideTooth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.155, 0.10), mats.pentelicMarble);
            sideTooth.position.set(0.56, 0.06, dz);
            fg.add(sideTooth);
          }

          // Projecting Pentelic corona drip-ledge & weathered cyma moulding cap
          var corona = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.13, 0.72), mats.pentelicMarble);
          corona.position.set(0.04, 0.20, 0.08);
          fg.add(corona);

          var sima = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.09, 0.66), mats.limestone);
          sima.position.set(0.08, 0.30, 0.09);
          fg.add(sima);

          // Rugged snapped stone break on the fractured left end
          var fracChunk = new THREE.Mesh(buildOrganicSculptGeo(THREE, 0.24, 1, 91 + i * 13, false), mats.limestone);
          fracChunk.scale.set(0.85, 0.95, 1.05);
          fracChunk.position.set(-0.56, -0.04, -0.02);
          fg.add(fracChunk);

          baseRotX = 0.18;
          baseRotY = i === 1 ? 0.72 : 1.05;
          baseRotZ = i === 1 ? 0.12 : -0.14;
        } else {
          // Variant C: Broken Doric Triglyph-and-Metope Frieze Fragment with carved 3-bar glyphs & guttae
          var epistyle = new THREE.Mesh(new THREE.BoxGeometry(1.20, 0.20, 0.50), mats.pentelicMarble);
          epistyle.position.set(0, -0.28, 0);
          fg.add(epistyle);

          var taenia = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.055, 0.56), mats.limestone);
          taenia.position.set(0.02, -0.155, 0.02);
          fg.add(taenia);

          // Recessed metope stone core
          var friezeBack = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.42, 0.44), mats.limestone);
          friezeBack.position.set(0.02, 0.08, -0.02);
          fg.add(friezeBack);

          // Two carved marble triglyphs (each with 3 bevelled vertical stone femora bars + regula & guttae)
          [-0.36, 0.38].forEach(function (tx) {
            var grooveBack = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.40, 0.06), mats.karstRock);
            grooveBack.position.set(tx, 0.08, 0.20);
            fg.add(grooveBack);

            for (var bar = -1; bar <= 1; bar++) {
              var femur = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.41, 4), mats.pentelicMarble);
              femur.rotation.y = Math.PI / 4;
              femur.position.set(tx + bar * 0.105, 0.08, 0.235);
              fg.add(femur);
            }

            var trigCap = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.055, 0.11), mats.pentelicMarble);
            trigCap.position.set(tx, 0.30, 0.22);
            fg.add(trigCap);

            var regula = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.036, 0.08), mats.pentelicMarble);
            regula.position.set(tx, -0.20, 0.25);
            fg.add(regula);

            for (var gt = 0; gt < 5; gt++) {
              var gutta = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 6), mats.limestone);
              gutta.position.set(tx - 0.13 + gt * 0.065, -0.235, 0.25);
              fg.add(gutta);
            }
          });

          // Carved marble patera relief medallion in the central metope
          var pateraRim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.026, 8, 20), mats.pentelicMarble);
          pateraRim.position.set(0.01, 0.08, 0.21);
          fg.add(pateraRim);
          var pateraBoss = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), mats.pentelicMarble);
          pateraBoss.scale.set(1.0, 1.0, 0.5);
          pateraBoss.position.set(0.01, 0.08, 0.22);
          fg.add(pateraBoss);

          // Broken weathered cornice cap on one side
          var mutuleCap = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.10, 0.62), mats.pentelicMarble);
          mutuleCap.position.set(0.12, 0.36, 0.05);
          fg.add(mutuleCap);

          var brokenSide = new THREE.Mesh(buildOrganicSculptGeo(THREE, 0.22, 1, 147 + i * 19, false), mats.limestone);
          brokenSide.position.set(-0.56, 0.08, -0.02);
          fg.add(brokenSide);

          baseRotX = -0.14;
          baseRotY = i === 2 ? 0.88 : 0.58;
          baseRotZ = 0.10;
        }

        fg.rotation.set(baseRotX, baseRotY, baseRotZ);
        fg.scale.setScalar(1.06 + (i % 3) * 0.08);
        mergeStaticChildrenByMaterial(THREE, fg, []);
        g.add(fg);

        fragments.push({
          group: fg,
          baseY: fy,
          baseRotX: baseRotX,
          baseRotY: baseRotY,
          baseRotZ: baseRotZ,
          phase: i * 0.85
        });
      }
      var fragGroups = fragments.map(function (f) { return f.group; });
      return { fragments: fragments, excludeFromMerge: fragGroups };
    });

    // 0_2: Hermes Gateways — 3 Classical Pentelic Marble Twin-Columned Portals with Winged Torches & Wind-Silk Ribbons
    registerWonder(THREE, scene, '0_2', 'hermesGateways', -5.5, 0.45, 0, -5.5, 2.8, 2.4, -4.8, function (g) {
      var zList = [2.4, -1.2, -4.6];
      var silkMat = createWindSilkMaterial(THREE, state.shaderUniforms);

      // Wing silhouette shape for sculpted bronze Hermes torches
      var wingShape = new THREE.Shape();
      wingShape.moveTo(0, 0);
      wingShape.quadraticCurveTo(0.24, 0.12, 0.42, 0.38);
      wingShape.lineTo(0.28, 0.28);
      wingShape.lineTo(0.36, 0.20);
      wingShape.lineTo(0.22, 0.14);
      wingShape.lineTo(0.28, 0.06);
      wingShape.quadraticCurveTo(0.12, -0.02, 0, -0.06);
      wingShape.closePath();
      var wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.03, bevelEnabled: false });

      zList.forEach(function (pz) {
        var portal = new THREE.Group();
        portal.position.set(0, 0, pz);

        [-1.82, 1.82].forEach(function (px, sideIdx) {
          var col = buildClassicalColumn(THREE, mats, 0.24, 0.29, 3.15, true);
          col.position.set(px, 0, 0);
          portal.add(col);

          // Sculpted patinated-bronze winged torch sconce on inner shaft
          var sconce = new THREE.Group();
          var dir = sideIdx === 0 ? 1 : -1;
          sconce.position.set(px + dir * 0.30, 2.25, 0);
          var torchShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.03, 0.46, 10), mats.patinatedBronze);
          sconce.add(torchShaft);
          var wingL = new THREE.Mesh(wingGeo, mats.giltGold);
          wingL.position.set(0, 0.08, 0.02);
          wingL.rotation.y = sideIdx === 0 ? -0.35 : Math.PI + 0.35;
          sconce.add(wingL);
          var flame = buildTorchFlameMesh(THREE, flameMat, 0.65);
          flame.position.y = 0.22;
          sconce.add(flame);
          portal.add(sconce);
        });

        // Pentelic marble architrave lintel & cornice spanning overhead (3.64m clear center passage!)
        var lintel = new THREE.Mesh(new THREE.BoxGeometry(4.36, 0.28, 0.68), mats.pentelicMarble);
        lintel.position.y = 3.76;
        portal.add(lintel);
        var cornice = new THREE.Mesh(new THREE.BoxGeometry(4.58, 0.12, 0.84), mats.limestone);
        cornice.position.y = 3.96;
        portal.add(cornice);
        var terracottaCrest = new THREE.Mesh(new THREE.BoxGeometry(4.48, 0.09, 0.72), mats.terracotta);
        terracottaCrest.position.y = 4.06;
        portal.add(terracottaCrest);

        // Gilt-bronze Hermes winged medallion in center of architrave
        var boss = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.08, 20), mats.giltGold);
        boss.rotation.x = Math.PI / 2;
        boss.position.set(0, 3.76, 0.35);
        portal.add(boss);

        // Soft flowing wind-silk shader ribbon draped gracefully below lintel (above head clearance!)
        var silk = new THREE.Mesh(new THREE.PlaneGeometry(3.35, 0.42, 24, 6), silkMat);
        silk.position.set(0, 3.42, 0);
        portal.add(silk);

        g.add(portal);
      });

      // Longitudinal wind-silk streamers linking the 3 portals along left & right eaves
      [-1.82, 1.82].forEach(function (sx) {
        for (var seg = 0; seg < 2; seg++) {
          var sideSilk = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.36, 24, 6), silkMat);
          sideSilk.rotation.y = Math.PI / 2;
          sideSilk.position.set(sx, 3.48, 0.6 - seg * 3.5);
          g.add(sideSilk);
        }
      });
      return {};
    });

    // 0_3: Watchtower Obelisk — Grounded Stepped Plinth + Rose-Granite Obelisk with Gilt Glyphs & Electrum Pyramidion
    // Emerges from y = -6.5 UP TO flush y = 0.45 (NEVER hovering at y = 5.2!)
    registerWonder(THREE, scene, '0_3', 'centralObelisk', -9.5, 0.45, 3.8, -9.5, 4.4, 3.8, -7.2, function (g) {
      var step1 = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.22, 2.15), mats.limestone);
      step1.position.y = 0.11;
      g.add(step1);
      var step2 = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.24, 1.78), mats.pentelicMarble);
      step2.position.y = 0.34;
      g.add(step2);
      var dado = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.72, 1.38), mats.pentelicMarble);
      dado.position.y = 0.82;
      g.add(dado);
      var dadoCap = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.12, 1.52), mats.limestone);
      dadoCap.position.y = 1.24;
      g.add(dadoCap);

      // 4 cast-bronze astragal corner mounts at the base of the granite shaft
      [-0.44, 0.44].forEach(function (cx) {
        [-0.44, 0.44].forEach(function (cz) {
          var mount = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), mats.patinatedBronze);
          mount.position.set(cx, 1.36, cz);
          g.add(mount);
        });
      });

      // Authentic tapered 4-sided Syene rose-granite shaft with incised gilt Greek glyphs
      var glyphMat = makeObeliskGlyphMaterial(THREE, mats.roseGranite);
      var shaftGeo = new THREE.CylinderGeometry(0.32 * Math.SQRT2, 0.56 * Math.SQRT2, 5.25, 4, 1);
      shaftGeo.rotateY(Math.PI / 4);
      var shaft = new THREE.Mesh(shaftGeo, glyphMat);
      shaft.position.y = 1.42 + 2.625;
      g.add(shaft);

      // Gilt collar & gleaming 4-sided Electrum Pyramidion
      var collar = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.08, 0.68), mats.polishedBrass);
      collar.position.y = 6.66;
      g.add(collar);

      var pyrGeo = new THREE.ConeGeometry(0.32 * Math.SQRT2, 0.78, 4);
      pyrGeo.rotateY(Math.PI / 4);
      var pyramidion = new THREE.Mesh(pyrGeo, mats.mirrorGilt);
      pyramidion.position.y = 6.68 + 0.39;
      g.add(pyramidion);

      return { pyramidion: pyramidion, excludeFromMerge: [pyramidion] };
    });

    // 0_4: Crystalline Sea-Quartz & Ice-Rime Cove Crown (Waterline around (-13.5..-20.5, -0.38, 3.5) & Western Parapet)
    registerWonder(THREE, scene, '0_4', 'crystallineFrost', 0, 0, 0, -16.8, 1.2, 3.5, -3.2, function (g) {
      var rng = mulberry32(804);
      var frostRippleMat = createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xcffafe);

      // Helper to build a natural hexagonal sea-quartz crystal cluster
      function spawnQuartzCluster(cx, cy, cz, scale) {
        var cg = new THREE.Group();
        cg.position.set(cx, cy, cz);
        var count = 4 + Math.floor(rng() * 3);
        for (var k = 0; k < count; k++) {
          var h = (0.85 + rng() * 1.45) * scale;
          var r = (0.12 + rng() * 0.14) * scale;
          var shard = new THREE.Group();
          var body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r, h, 6), mats.seaQuartz);
          body.position.y = h * 0.5;
          shard.add(body);
          var tip = new THREE.Mesh(new THREE.ConeGeometry(r * 0.88, r * 1.9, 6), mats.seaQuartz);
          tip.position.y = h + r * 0.95;
          shard.add(tip);
          if (k > 0) {
            var a = (k / (count - 1)) * Math.PI * 2 + rng() * 0.4;
            shard.rotation.z = Math.cos(a) * (0.22 + rng() * 0.28);
            shard.rotation.x = Math.sin(a) * (0.22 + rng() * 0.28);
            shard.position.set(Math.cos(a) * r * 1.1, -0.08 * scale, Math.sin(a) * r * 1.1);
          }
          cg.add(shard);
        }
        g.add(cg);
      }

      // 11 crystal formations rising naturally from the western sea cove waterline (y = -0.38)
      var coveSpots = [
        [-16.4, 5.2, 1.15], [-17.8, 3.6, 1.35], [-16.6, 1.8, 1.05], [-18.9, 0.4, 1.25],
        [-20.2, 4.4, 1.45], [-21.4, 2.2, 1.15], [-15.8, -0.8, 0.95], [-19.4, 6.4, 1.1],
        [-17.2, 7.6, 1.0],  [-22.2, 5.0, 1.30], [-18.2, -2.2, 1.05]
      ];
      coveSpots.forEach(function (sp) {
        spawnQuartzCluster(sp[0], -0.42, sp[1], sp[2]);
        var icePad = new THREE.Mesh(new THREE.PlaneGeometry(3.4 * sp[2], 3.4 * sp[2]), frostRippleMat);
        icePad.rotation.x = -Math.PI / 2;
        icePad.position.set(sp[0], -0.34, sp[1]);
        g.add(icePad);
      });

      // Delicate rime-ice facets gripping the western stone parapet coping (r = 15.15 around (0, 8.5))
      for (var d = 0; d < 7; d++) {
        var deg = -108 + d * 10;
        var rad = (deg * Math.PI) / 180;
        var px = Math.sin(rad) * 15.15;
        var pz = 8.5 + Math.cos(rad) * 15.15;
        spawnQuartzCluster(px, 1.04, pz, 0.42);
      }

      // Soft sea-mist sprites hovering gently above the cove crystal garden
      for (var m = 0; m < 8; m++) {
        var mist = new THREE.Sprite(new THREE.SpriteMaterial({
          map: mats.aquaSpriteTex,
          color: 0xe0f2fe,
          transparent: true,
          opacity: 0.26,
          depthWrite: false
        }));
        mist.position.set(-16.5 - (m % 3) * 2.2, 0.45 + (m % 2) * 0.4, 6.2 - m * 1.15);
        mist.scale.set(4.8, 1.9, 1.0);
        g.add(mist);
      }
      return {};
    });

    // --------------------------------------------------------------------------
    // ACT II (EAST COLONNADE)
    // --------------------------------------------------------------------------

    // 1_0: Hearth Lanterns — Ornate Bronze Brazier at (8.2, 0.45, 3.6) + 16 Hexagonal Wrought-Bronze Mediterranean Lanterns
    registerWonder(THREE, scene, '1_0', 'hearthLanterns', 0, 0, 0, 8.2, 2.0, 3.6, -3.2, function (g) {
      // Ornate Tripod Bronze Terrace Brazier at (8.2, 0.45, 3.6)
      var brazier = new THREE.Group();
      brazier.position.set(8.2, 0.45, 3.6);
      var bPlinth = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.84, 0.18, 16), mats.pentelicMarble);
      bPlinth.position.y = 0.09;
      brazier.add(bPlinth);
      for (var lg = 0; lg < 3; lg++) {
        var la = (lg / 3) * Math.PI * 2;
        var legCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(Math.cos(la) * 0.56, 0.16, Math.sin(la) * 0.56),
          new THREE.Vector3(Math.cos(la) * 0.34, 0.62, Math.sin(la) * 0.34),
          new THREE.Vector3(Math.cos(la) * 0.52, 1.08, Math.sin(la) * 0.52)
        ]);
        brazier.add(new THREE.Mesh(new THREE.TubeGeometry(legCurve, 14, 0.055, 8, false), mats.patinatedBronze));
      }
      var bowlPts = [
        new THREE.Vector2(0.02, 0.88),
        new THREE.Vector2(0.38, 0.94),
        new THREE.Vector2(0.68, 1.18),
        new THREE.Vector2(0.74, 1.26),
        new THREE.Vector2(0.62, 1.26)
      ];
      brazier.add(new THREE.Mesh(new THREE.LatheGeometry(bowlPts, 24), mats.patinatedBronze));
      var rimBrass = new THREE.Mesh(new THREE.TorusGeometry(0.70, 0.038, 10, 28), mats.polishedBrass);
      rimBrass.rotation.x = Math.PI / 2;
      rimBrass.position.y = 1.26;
      brazier.add(rimBrass);
      var bFlame = buildTorchFlameMesh(THREE, flameMat, 1.35);
      bFlame.position.y = 1.22;
      brazier.add(bFlame);
      var bGlow = makeWarmGlowSprite(THREE, mats, 0xfbbf24, 2.9, 2.9, 0.58);
      bGlow.position.y = 1.52;
      brazier.add(bGlow);
      g.add(brazier);

      // 16 Wrought-Bronze Hexagonal Mediterranean Lanterns drifting out over the eastern cove
      var rng = mulberry32(1100);
      var lanterns = [];
      for (var i = 0; i < 16; i++) {
        var lx = 9.0 + (i / 15) * 9.5 + (rng() - 0.5) * 1.4;
        var lz = 4.2 - (i % 6) * 1.32 + (rng() - 0.5) * 0.9;
        var ly = 2.15 + (i % 5) * 0.72 + rng() * 0.5;

        var lg2 = new THREE.Group();
        lg2.position.set(lx, ly, lz);

        // Warm amber parchment core
        var pane = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.16, 0.44, 6), mats.lanternParchment);
        lg2.add(pane);
        // Wrought-bronze hexagonal ribs, base tray & pierced cupola dome
        var botCap = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.10, 0.10, 6), mats.patinatedBronze);
        botCap.position.y = -0.26;
        lg2.add(botCap);
        var topRim = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.20, 0.06, 6), mats.patinatedBronze);
        topRim.position.y = 0.24;
        lg2.add(topRim);
        var dome = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.22, 6), mats.polishedBrass);
        dome.position.y = 0.38;
        lg2.add(dome);
        var ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.014, 8, 16), mats.polishedBrass);
        ring.position.y = 0.52;
        lg2.add(ring);
        for (var r = 0; r < 6; r++) {
          var ra = (r / 6) * Math.PI * 2;
          var strut = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 6), mats.patinatedBronze);
          strut.position.set(Math.cos(ra) * 0.185, 0, Math.sin(ra) * 0.185);
          lg2.add(strut);
        }
        var halo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: mats.starSpriteTex,
          color: 0xfde68a,
          transparent: true,
          opacity: 0.48,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        }));
        halo.scale.set(1.15, 1.15, 1.0);
        lg2.add(halo);

        mergeStaticChildrenByMaterial(THREE, lg2, []);
        g.add(lg2);
        lanterns.push({ mesh: lg2, baseX: lx, baseY: ly, baseZ: lz, phase: i * 0.62 });
      }
      var lanternGroups = lanterns.map(function (lf) { return lf.mesh; });
      return { lanterns: lanterns, brazierGlow: bGlow, excludeFromMerge: lanternGroups };
    });

    // 1_1: Venetian-Aegean Stepped Pentelic Marble Arched Footbridge & Coastal Rock Shrine at (11.5, 0.45, 1.5)
    registerWonder(THREE, scene, '1_1', 'energyArch', 11.5, 0.45, 1.5, 16.2, 2.35, 1.5, -5.2, function (g) {
      // Coordinates relative to (11.5, 0.45, 1.5): parapet is at local x = +1.94 (world x = 13.44), sea is at local x = +6..+12
      var spanStart = 0.2;
      var spanEnd = 9.4;
      var spanLen = spanEnd - spanStart;
      var archMid = (spanStart + spanEnd) * 0.5; // 4.8

      // Terrace marble abutment & approach steps
      var abutW = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.52, 2.3), mats.pentelicMarble);
      abutW.position.set(spanStart, 0.26, 0);
      g.add(abutW);

      // Sculpted Coastal Rock Sea-Stack & Miniature Shrine at Eastern Pier (local x = 10.6 -> world x = 22.1)
      var seaRock = new THREE.Mesh(buildOrganicSculptGeo(THREE, 2.35, 2, 111, true), mats.karstRock);
      seaRock.scale.set(1.25, 0.95, 1.15);
      seaRock.position.set(10.6, -1.05, 0);
      g.add(seaRock);

      var rockFoam = new THREE.Mesh(
        new THREE.PlaneGeometry(6.8, 6.8),
        createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe)
      );
      rockFoam.rotation.x = -Math.PI / 2;
      rockFoam.position.set(10.6, -0.80, 0);
      g.add(rockFoam);

      var shrinePlinth = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.85, 0.46, 16), mats.limestone);
      shrinePlinth.position.set(10.6, 0.23, 0);
      g.add(shrinePlinth);

      // 4-Column Coastal Naiskos Shrine with Terracotta Roof & Sanctuary Lamp
      [[-0.68, -0.68], [0.68, -0.68], [-0.68, 0.68], [0.68, 0.68]].forEach(function (sc) {
        var sCol = buildClassicalColumn(THREE, mats, 0.14, 0.17, 1.75, true);
        sCol.position.set(10.6 + sc[0], 0.46, sc[1]);
        g.add(sCol);
      });
      var sLintel = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.18, 1.82), mats.pentelicMarble);
      sLintel.position.set(10.6, 2.64, 0);
      g.add(sLintel);
      var sRoof = new THREE.Mesh(new THREE.ConeGeometry(1.48, 0.68, 4), mats.terracotta);
      sRoof.rotation.y = Math.PI / 4;
      sRoof.position.set(10.6, 3.07, 0);
      g.add(sRoof);
      var shrineFlame = buildTorchFlameMesh(THREE, flameMat, 0.78);
      shrineFlame.position.set(10.6, 0.95, 0);
      g.add(shrineFlame);
      var sBrazier = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.16, 0.52, 12), mats.patinatedBronze);
      sBrazier.position.set(10.6, 0.72, 0);
      g.add(sBrazier);

      // Arched Venetian-Aegean Pentelic Marble Bridge Deck, Voussoirs & Stepped Treads
      var nSegs = 20;
      for (var i = 0; i < nSegs; i++) {
        var u0 = i / nSegs;
        var u1 = (i + 1) / nSegs;
        var um = (u0 + u1) * 0.5;
        var x0 = spanStart + u0 * spanLen;
        var x1 = spanStart + u1 * spanLen;
        var xm = (x0 + x1) * 0.5;
        var y0 = 0.48 + Math.sin(u0 * Math.PI) * 1.92;
        var y1 = 0.48 + Math.sin(u1 * Math.PI) * 1.92;
        var ym = (y0 + y1) * 0.5;
        var dx = x1 - x0;
        var dy = y1 - y0;
        var segLen = Math.sqrt(dx * dx + dy * dy);
        var tilt = Math.atan2(dy, dx);

        // Arch structural barrel rib
        var archSeg = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.06, 0.34, 1.86), mats.pentelicMarble);
        archSeg.position.set(xm, ym - 0.16, 0);
        archSeg.rotation.z = tilt;
        g.add(archSeg);

        // Horizontal stepped Pentelic marble tread on top
        var stepTread = new THREE.Mesh(new THREE.BoxGeometry(dx + 0.05, 0.12, 1.72), mats.whitewash);
        stepTread.position.set(xm, ym + 0.06, 0);
        g.add(stepTread);

        // Parapet side kerbs & wrought-brass balusters
        [-0.88, 0.88].forEach(function (bz) {
          var railTop = new THREE.Mesh(new THREE.BoxGeometry(segLen + 0.05, 0.08, 0.12), mats.pentelicMarble);
          railTop.position.set(xm, ym + 0.78, bz);
          railTop.rotation.z = tilt;
          g.add(railTop);

          var bal = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.042, 0.68, 8), mats.polishedBrass);
          bal.position.set(xm, ym + 0.42, bz);
          g.add(bal);

          // 6 Wrought-Brass Lantern Balusters at intervals along the bridge
          if (i === 2 || i === 9 || i === 17) {
            var lPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.96, 0.18), mats.pentelicMarble);
            lPost.position.set(xm, ym + 0.52, bz);
            g.add(lPost);
            var globe = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), mats.lanternParchment);
            globe.position.set(xm, ym + 1.12, bz);
            g.add(globe);
            var cap = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.12, 8), mats.patinatedBronze);
            cap.position.set(xm, ym + 1.24, bz);
            g.add(cap);
          }
        });
      }
      return { archMid: archMid };
    });

    // 1_2: Cliffside Limestone Stairway Descending DOWN from Terrace (y = 0.45) to Torchlit Cove Quay (y = -0.32)
    registerWonder(THREE, scene, '1_2', 'marbleStairs', 12.2, 0.45, 5.2, 15.8, 0.5, 4.5, -5.0, function (g) {
      // Parapet at z = 5.2 is at world x = 14.78 (local x = 2.58); sea waterline y = -0.38 (local y = -0.83)
      // Crossover threshold steps over parapet rim, then 14 solid coursed limestone steps descending DOWN to local y = -0.77 (world y = -0.32)
      var thresh = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.68, 2.1), mats.limestone);
      thresh.position.set(2.15, 0.34, 0);
      g.add(thresh);
      // Twin entry pillars framing the cliff stair head
      [-1.08, 1.08].forEach(function (pz) {
        var pil = new THREE.Mesh(new THREE.BoxGeometry(0.42, 1.35, 0.42), mats.pentelicMarble);
        pil.position.set(1.5, 0.68, pz);
        g.add(pil);
        var finial = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), mats.polishedBrass);
        finial.position.set(1.5, 1.46, pz);
        g.add(finial);
      });

      var nSteps = 14;
      for (var s = 0; s < nSteps; s++) {
        var frac = s / (nSteps - 1);
        var sx = 3.25 + frac * 4.95; // world x: 15.45 -> 20.4
        var sz = -frac * 1.75;       // gentle seaward curve
        var sy = 0.62 - frac * 1.39; // DESCENDS from +0.62 (world 1.07) DOWN to -0.77 (world -0.32)!
        var yaw = -0.32;

        // Solid coursed limestone cliff-masonry foundation block under every step (ZERO floating boxes!)
        var masonryH = Math.max(0.45, sy + 1.85);
        var sg = new THREE.Group();
        sg.position.set(sx, 0, sz);
        sg.rotation.y = yaw;

        var underWall = new THREE.Mesh(new THREE.BoxGeometry(0.56, masonryH, 1.92), mats.karstRock);
        underWall.position.y = sy - masonryH * 0.5;
        sg.add(underWall);

        var tread = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.14, 1.84), mats.limestone);
        tread.position.y = sy;
        sg.add(tread);

        // Low stepped stone side-parapets descending with the stairs
        [-0.96, 0.96].forEach(function (rz) {
          var kerb = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.20), mats.limestone);
          kerb.position.set(0, sy + 0.26, rz);
          sg.add(kerb);
        });
        g.add(sg);
      }

      // Torchlit Cove Boat-Landing Quay at the Waterline (world y = -0.32, local y = -0.77)
      var quay = new THREE.Group();
      quay.position.set(9.2, -0.77, -2.1);
      quay.rotation.y = -0.32;

      var quayBase = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.45, 3.6), mats.limestone);
      quayBase.position.y = -0.62;
      quay.add(quayBase);
      var quayDeck = new THREE.Mesh(new THREE.BoxGeometry(2.92, 0.14, 3.72), mats.pentelicMarble);
      quayDeck.position.y = 0.08;
      quay.add(quayDeck);

      var quayFoam = new THREE.Mesh(
        new THREE.PlaneGeometry(6.2, 6.2),
        createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe)
      );
      quayFoam.rotation.x = -Math.PI / 2;
      quayFoam.position.y = -0.02;
      quay.add(quayFoam);

      // Timber mooring bollard, coiled rope & twin flaming bronze cresset torches on the quay
      var bollard = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.62, 12), mats.carvedTimber);
      bollard.position.set(0.95, 0.42, 1.25);
      quay.add(bollard);
      var ropeCoil = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.055, 8, 20), mats.sailCanvas);
      ropeCoil.rotation.x = Math.PI / 2;
      ropeCoil.position.set(0.95, 0.19, 1.25);
      quay.add(ropeCoil);

      [-1.45, 1.45].forEach(function (tz) {
        var tPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 1.55, 10), mats.patinatedBronze);
        tPost.position.set(1.05, 0.85, tz);
        quay.add(tPost);
        var basket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.09, 0.22, 10), mats.polishedBrass);
        basket.position.set(1.05, 1.68, tz);
        quay.add(basket);
        var qFlame = buildTorchFlameMesh(THREE, flameMat, 0.82);
        qFlame.position.set(1.05, 1.78, tz);
        quay.add(qFlame);
        var qGlow = makeWarmGlowSprite(THREE, mats, 0xfbbf24, 2.25, 2.25, 0.52);
        qGlow.position.set(1.05, 1.98, tz);
        quay.add(qGlow);
      });

      g.add(quay);
      return {};
    });

    // 1_3: Precision Myst-Style Geared Brass Clockwork Orrery Grounded on Marble Pedestal at (8.2, 0.45, 0.2)
    registerWonder(THREE, scene, '1_3', 'astrolabeGroup', 8.2, 0.45, 0.2, 8.2, 2.55, 0.2, -4.6, function (g) {
      // Carved octagonal Pentelic marble pedestal
      var base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.02, 1.15, 0.22, 8), mats.limestone);
      base1.position.y = 0.11;
      g.add(base1);
      var base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.94, 0.18, 8), mats.pentelicMarble);
      base2.position.y = 0.31;
      g.add(base2);
      var drum = buildClassicalColumn(THREE, mats, 0.42, 0.48, 0.82, false);
      drum.position.y = 0.36;
      g.add(drum);
      var horizonPlate = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 0.98, 0.10, 32), makeZodiacDialMaterial(THREE));
      horizonPlate.position.y = 1.52;
      g.add(horizonPlate);

      // Visible toothed brass gear train at the pedestal crown
      var gearMain = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.56, 0.48, 0.08, 22, 6, 0.14), mats.polishedBrass);
      gearMain.rotation.x = Math.PI / 2;
      gearMain.position.y = 1.64;
      g.add(gearMain);

      var gearPinion = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.28, 0.22, 0.08, 12, 4, 0.08), mats.giltGold);
      gearPinion.rotation.x = Math.PI / 2;
      gearPinion.position.set(0.68, 1.64, 0);
      g.add(gearPinion);

      var gearBevel = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.30, 0.24, 0.07, 14, 4, 0.08), mats.patinatedBronze);
      gearBevel.position.set(0, 1.92, 0.30);
      g.add(gearBevel);

      // Outer meridian cradle & inclined engraved ecliptic band
      var orreryCenter = new THREE.Group();
      orreryCenter.position.y = 2.68;
      g.add(orreryCenter);

      var meridianArc = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.045, 12, 48), mats.patinatedBronze);
      orreryCenter.add(meridianArc);

      var eclipticTilt = new THREE.Group();
      eclipticTilt.rotation.z = 0.41; // 23.5 deg obliquity
      orreryCenter.add(eclipticTilt);

      var eclipticBand = new THREE.Mesh(new THREE.CylinderGeometry(1.14, 1.14, 0.16, 42, 1, true), mats.polishedBrass);
      eclipticBand.material = mats.polishedBrass.clone();
      eclipticBand.material.side = THREE.DoubleSide;
      eclipticTilt.add(eclipticBand);

      var innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.028, 10, 40), mats.giltGold);
      innerRing.rotation.x = Math.PI / 2;
      eclipticTilt.add(innerRing);

      // Central radiant gilt-brass Helios sphere + spindle
      var spindle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 2.25, 12), mats.polishedBrass);
      spindle.position.y = -0.35;
      orreryCenter.add(spindle);
      var helios = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), mats.mirrorGilt);
      eclipticTilt.add(helios);

      // 4 Geared Semi-Precious Planets (Ivory, Amber, Lapis + Silver Moon, Carnelian Agate)
      var planetSpecs = [
        { r: 0.42, size: 0.065, mat: mats.planetIvory, speed: 1.55, hasMoon: false },
        { r: 0.60, size: 0.088, mat: mats.planetAmber, speed: 1.05, hasMoon: false },
        { r: 0.82, size: 0.105, mat: mats.planetLapis, speed: 0.68, hasMoon: true },
        { r: 1.02, size: 0.082, mat: mats.planetAgate, speed: 0.44, hasMoon: false }
      ];
      var planetPivots = [];
      planetSpecs.forEach(function (ps, idx) {
        var piv = new THREE.Group();
        piv.rotation.y = idx * 1.4;
        var hubGear = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.14 + idx * 0.02, 0.11 + idx * 0.02, 0.03, 12, 0, 0.05), mats.polishedBrass);
        hubGear.rotation.x = Math.PI / 2;
        hubGear.position.y = -0.14 - idx * 0.05;
        piv.add(hubGear);

        var armCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, -0.14 - idx * 0.05, 0),
          new THREE.Vector3(ps.r, -0.14 - idx * 0.05, 0),
          new THREE.Vector3(ps.r, 0, 0)
        ]);
        piv.add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 12, 0.014, 6, false), mats.polishedBrass));

        var sphere = new THREE.Mesh(new THREE.SphereGeometry(ps.size, 18, 18), ps.mat);
        sphere.position.set(ps.r, 0, 0);
        piv.add(sphere);

        var moonPiv = null;
        if (ps.hasMoon) {
          moonPiv = new THREE.Group();
          moonPiv.position.set(ps.r, 0, 0);
          var moonArm = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.19, 6), mats.polishedBrass);
          moonArm.rotation.z = Math.PI / 2;
          moonArm.position.x = 0.095;
          moonPiv.add(moonArm);
          var moon = new THREE.Mesh(new THREE.SphereGeometry(0.034, 12, 12), mats.planetIvory);
          moon.position.x = 0.19;
          moonPiv.add(moon);
          piv.add(moonPiv);
        }

        mergeStaticChildrenByMaterial(THREE, piv, moonPiv ? [moonPiv] : []);
        eclipticTilt.add(piv);
        planetPivots.push({ pivot: piv, speed: ps.speed, moonPivot: moonPiv });
      });

      var dynOrrery = [gearMain, gearPinion, gearBevel, innerRing];
      for (var dp = 0; dp < planetPivots.length; dp++) dynOrrery.push(planetPivots[dp].pivot);

      return {
        gearMain: gearMain,
        gearPinion: gearPinion,
        gearBevel: gearBevel,
        innerRing: innerRing,
        planets: planetPivots,
        excludeFromMerge: dynOrrery
      };
    });

    // 1_4: Classical Delphi-Style Circular Pentelic Marble Tholos of Athena at (6.5, 0.45, -2.0)
    registerWonder(THREE, scene, '1_4', 'aegisDome', 6.5, 0.45, -2.0, 6.5, 3.2, -2.0, -5.8, function (g) {
      // 3-stepped circular Pentelic marble crepidoma (low walkable steps!)
      [
        [2.42, 0.08, 0.04, mats.limestone],
        [2.26, 0.08, 0.12, mats.pentelicMarble],
        [2.10, 0.08, 0.20, mats.pentelicMarble]
      ].forEach(function (st) {
        var step = new THREE.Mesh(new THREE.CylinderGeometry(st[0], st[0] + 0.04, st[1], 40), st[3]);
        step.position.y = st[2];
        g.add(step);
      });

      // Inlaid floor mosaic medallion
      var floorMosaic = new THREE.Mesh(new THREE.CylinderGeometry(1.72, 1.72, 0.02, 36), makeOrchestraMosaicMaterial(THREE));
      floorMosaic.position.y = 0.25;
      g.add(floorMosaic);

      // 8 fluted Doric/Ionic Pentelic marble columns in an open walkable ring (offset PI/8 for clear sightlines!)
      var colR = 1.84;
      for (var c = 0; c < 8; c++) {
        var ang = (c / 8) * Math.PI * 2 + Math.PI / 8;
        var col = buildClassicalColumn(THREE, mats, 0.19, 0.23, 2.85, true);
        col.position.set(Math.sin(ang) * colR, 0.24, Math.cos(ang) * colR);
        col.rotation.y = ang;
        g.add(col);
      }

      // Circular Pentelic marble entablature: architrave, triglyph/shield frieze & projecting cornice
      var entY = 3.46;
      var archRing = new THREE.Mesh(new THREE.CylinderGeometry(2.02, 2.00, 0.24, 40, 1, false), mats.pentelicMarble);
      archRing.position.y = entY + 0.12;
      g.add(archRing);

      var friezeDrum = new THREE.Mesh(new THREE.CylinderGeometry(2.00, 2.00, 0.28, 40), mats.cycladicBlue);
      friezeDrum.position.y = entY + 0.38;
      g.add(friezeDrum);

      // 16 embossed bronze Athena shield bosses & marble triglyphs around the circular frieze
      for (var f = 0; f < 16; f++) {
        var fa = (f / 16) * Math.PI * 2;
        if (f % 2 === 0) {
          var shield = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.05, 16), mats.giltGold);
          shield.rotation.z = Math.PI / 2;
          shield.rotation.y = -fa + Math.PI / 2;
          shield.position.set(Math.sin(fa) * 2.01, entY + 0.38, Math.cos(fa) * 2.01);
          g.add(shield);
        } else {
          var trig = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 0.08), mats.pentelicMarble);
          trig.position.set(Math.sin(fa) * 1.99, entY + 0.38, Math.cos(fa) * 1.99);
          trig.rotation.y = fa;
          g.add(trig);
        }
      }

      var corniceRing = new THREE.Mesh(new THREE.CylinderGeometry(2.26, 2.06, 0.14, 44), mats.pentelicMarble);
      corniceRing.position.y = entY + 0.59;
      g.add(corniceRing);

      // Conical terracotta roof with radial ridge tiles & gilt-bronze Athena finial
      var roofY = entY + 0.66;
      var roofCone = new THREE.Mesh(new THREE.ConeGeometry(2.32, 1.18, 36), mats.terracotta);
      roofCone.position.y = roofY + 0.59;
      g.add(roofCone);

      for (var rt = 0; rt < 16; rt++) {
        var ra = (rt / 16) * Math.PI * 2;
        var antefix = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.14, 0.08), mats.pentelicMarble);
        antefix.position.set(Math.sin(ra) * 2.26, roofY + 0.06, Math.cos(ra) * 2.26);
        antefix.rotation.y = ra;
        g.add(antefix);
      }

      // Gilt-bronze finial (urn + spear crest)
      var finialBase = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), mats.polishedBrass);
      finialBase.position.y = roofY + 1.24;
      g.add(finialBase);
      var finialSpire = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.48, 12), mats.mirrorGilt);
      finialSpire.position.y = roofY + 1.56;
      g.add(finialSpire);

      // Warm coffered inner sanctuary lamp
      var lampOrb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), mats.warmCandleGlow);
      lampOrb.position.y = entY - 0.18;
      g.add(lampOrb);
      var tholosGlow = makeWarmGlowSprite(THREE, mats, 0xfde68a, 2.75, 2.25, 0.56);
      tholosGlow.position.y = entY - 0.22;
      g.add(tholosGlow);

      return {};
    });

    // --------------------------------------------------------------------------
    // ACT III (1943 COVE AMPHITHEATRE)
    // --------------------------------------------------------------------------

    // 2_0: Grounded Pentelic Marble Propylaea Gateway & Sculpted Curved-Horn Greek Kithara at (0, 0.45, -31.8)
    // Emerges from y = -5.4 UP TO grounded y = 0.45 (fixing the 3.5m floating UFO bug!)
    registerWonder(THREE, scene, '2_0', 'shatteredArch', 0, 0.45, -31.8, 0, 3.6, -31.8, -5.8, function (g) {
      // Twin flanking stylobate piers leaving wide 3.9m walkable gateway at x = 0!
      [-2.85, 2.85].forEach(function (sx) {
        var pier = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.24, 1.38), mats.limestone);
        pier.position.set(sx, 0.12, 0);
        g.add(pier);
      });

      [-3.45, -2.25, 2.25, 3.45].forEach(function (cx) {
        var col = buildClassicalColumn(THREE, mats, 0.26, 0.32, 3.65, false);
        col.position.set(cx, 0.24, 0);
        g.add(col);
      });

      // Full-span Classical Entablature, Triglyph Frieze & Pediment
      var lintelY = 4.38;
      var architrave = new THREE.Mesh(new THREE.BoxGeometry(8.15, 0.34, 1.18), mats.pentelicMarble);
      architrave.position.y = lintelY;
      g.add(architrave);

      var frieze = new THREE.Mesh(new THREE.BoxGeometry(8.05, 0.32, 1.10), mats.cycladicBlue);
      frieze.position.y = lintelY + 0.33;
      g.add(frieze);
      for (var t = -5; t <= 5; t++) {
        var tr = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.30, 1.16), mats.pentelicMarble);
        tr.position.set(t * 0.72, lintelY + 0.33, 0);
        g.add(tr);
      }

      var cornice = new THREE.Mesh(new THREE.BoxGeometry(8.45, 0.16, 1.36), mats.pentelicMarble);
      cornice.position.y = lintelY + 0.57;
      g.add(cornice);

      // Triangular Classical Pediment (extruded prism so roof slopes cleanly with zero skew!)
      var pedShape = new THREE.Shape();
      pedShape.moveTo(-4.25, 0);
      pedShape.lineTo(0, 1.28);
      pedShape.lineTo(4.25, 0);
      pedShape.closePath();
      var pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 1.12, bevelEnabled: false });
      pedGeo.translate(0, 0, -0.56);
      var pediment = new THREE.Mesh(pedGeo, mats.pentelicMarble);
      pediment.position.y = lintelY + 0.65;
      g.add(pediment);

      // Raking terracotta sima roof slopes
      [-1, 1].forEach(function (side) {
        var rSlope = new THREE.Mesh(new THREE.BoxGeometry(4.52, 0.12, 1.32), mats.terracotta);
        rSlope.position.set(side * 2.12, lintelY + 1.32, 0);
        rSlope.rotation.z = -side * Math.atan2(1.28, 4.25);
        g.add(rSlope);
      });

      // Sculpted Curved-Horn Greek Kithara mounted gracefully in the upper archway (full walkable clearance below y = 3.05m!)
      var kithara = new THREE.Group();
      kithara.position.set(0, 3.12, 0);

      // Trapezoidal wooden & gilt-bronze soundbox (echeion)
      var sbShape = new THREE.Shape();
      sbShape.moveTo(-0.36, 0);
      sbShape.lineTo(0.36, 0);
      sbShape.lineTo(0.48, 0.42);
      sbShape.lineTo(-0.48, 0.42);
      sbShape.closePath();
      var sbGeo = new THREE.ExtrudeGeometry(sbShape, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 });
      sbGeo.translate(0, 0, -0.08);
      kithara.add(new THREE.Mesh(sbGeo, mats.carvedTimber));

      var rosette = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 20), mats.giltGold);
      rosette.position.set(0, 0.22, 0.09);
      kithara.add(rosette);

      // Twin S-curved sculpted horns (pecheis)
      [-1, 1].forEach(function (side) {
        var hornCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(side * 0.40, 0.38, 0),
          new THREE.Vector3(side * 0.68, 0.68, 0),
          new THREE.Vector3(side * 0.62, 1.04, 0),
          new THREE.Vector3(side * 0.42, 1.24, 0)
        ]);
        kithara.add(new THREE.Mesh(new THREE.TubeGeometry(hornCurve, 20, 0.048, 10, false), mats.polishedBrass));
      });

      // Horizontal brass tuning crossbar (zygos) + finials
      var zygos = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 1.12, 12), mats.giltGold);
      zygos.rotation.z = Math.PI / 2;
      zygos.position.y = 1.14;
      kithara.add(zygos);

      // 7 Taut Golden Strings!
      var strings = [];
      for (var st = 0; st < 7; st++) {
        var sx = (st - 3) * 0.088;
        var strMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.96, 6), mats.mirrorGilt);
        strMesh.position.set(sx, 0.64, 0);
        kithara.add(strMesh);
        var peg = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.09, 6), mats.patinatedBronze);
        peg.position.set(sx, 1.16, 0);
        kithara.add(peg);
        strings.push(strMesh);
      }

      g.add(kithara);
      return { kithara: kithara, strings: strings, excludeFromMerge: strings };
    });

    // 2_1: 6 Weathered Attic Marble Pedimented Memorial Stelae with Chiseled Greek Epitaphs & Flickering Oil Lamps
    registerWonder(THREE, scene, '2_1', 'runicStelae', 0, 0.45, 0, -5.6, 2.1, -24.2, -3.6, function (g) {
      var stelaeDefs = [
        { x: -5.6, z: -23.6, yaw:  0.38, lines: ['ΕΛΕΥΘΕΡΙΑ', 'Η ΘΑΝΑΤΟΣ', '• ΑΩΜΓ •', 'ΦΡΑΞΟΣ'] },
        { x:  5.6, z: -23.6, yaw: -0.38, lines: ['ΜΝΗΜΗ ΤΩΝ', 'ΑΝΔΡΩΝ ΤΗΣ', 'ΘΑΛΑΣΣΗΣ', '• 1943 •'] },
        { x: -8.4, z: -24.8, yaw:  0.65, lines: ['ΟΥΚ ΕΔΕΙΣΑΝ', 'ΤΟΝ ΖΥΓΟΝ', 'ΕΝ ΤΗ ΝΥΚΤΙ', 'ΒΟΥΡΑΝΙ'] },
        { x:  8.4, z: -24.8, yaw: -0.65, lines: ['ΔΕΥΚΑΛΙΩΝ', 'ΚΑΙ ΛΟΓΟΣ', 'ΑΘΑΝΑΤΟΣ', '• ΦΩΣ •'] },
        { x: -5.2, z: -30.5, yaw:  0.22, lines: ['ΟΙ ΠΕΣΟΝΤΕΣ', 'ΥΠΕΡ ΤΗΣ', 'ΝΗΣΟΥ ΗΜΩΝ', 'ΧΑΙΡΕΤΕ'] },
        { x:  5.2, z: -30.5, yaw: -0.22, lines: ['Η ΑΡΕΤΗ', 'ΛΑΜΠΕΙ ΕΙΣ', 'ΤΟΝ ΑΙΩΝΑ', '• ΜΥΣΤΗΣ •'] }
      ];
      var lamps = [];

      var pedShape = new THREE.Shape();
      pedShape.moveTo(-0.50, 0);
      pedShape.lineTo(0, 0.28);
      pedShape.lineTo(0.50, 0);
      pedShape.closePath();
      var pedGeo = new THREE.ExtrudeGeometry(pedShape, { depth: 0.26, bevelEnabled: false });
      pedGeo.translate(0, 0, -0.13);

      stelaeDefs.forEach(function (sd) {
        var sg = new THREE.Group();
        sg.position.set(sd.x, 0, sd.z);
        sg.rotation.y = sd.yaw;

        var sBase1 = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.16, 0.86), mats.limestone);
        sBase1.position.y = 0.08;
        sg.add(sBase1);
        var sBase2 = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.16, 0.56), mats.pentelicMarble);
        sBase2.position.y = 0.24;
        sg.add(sBase2);

        var epMat = makeEpitaphMaterial(THREE, sd.lines);
        var shaftMats = [
          mats.pentelicMarble, mats.pentelicMarble,
          mats.pentelicMarble, mats.pentelicMarble,
          epMat, epMat
        ];
        var shaft = new THREE.Mesh(new THREE.BoxGeometry(0.88, 2.08, 0.22), shaftMats);
        shaft.position.y = 0.32 + 1.04;
        sg.add(shaft);

        var crownMould = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.09, 0.28), mats.pentelicMarble);
        crownMould.position.y = 2.44;
        sg.add(crownMould);

        var ped = new THREE.Mesh(pedGeo, mats.pentelicMarble);
        ped.position.y = 2.48;
        sg.add(ped);

        // Carved palmette acroterion finial
        var acro = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.06, 0.20, 8), mats.polishedBrass);
        acro.position.y = 2.84;
        sg.add(acro);

        // Patinated-bronze oil lamp (lychnos) flickering on the front stone step
        var lampBody = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.patinatedBronze);
        lampBody.scale.set(1.3, 0.65, 1.0);
        lampBody.position.set(0, 0.22, 0.32);
        sg.add(lampBody);
        var spout = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.12, 8), mats.polishedBrass);
        spout.rotation.x = Math.PI / 3;
        spout.position.set(0, 0.24, 0.42);
        sg.add(spout);
        var lFlame = buildTorchFlameMesh(THREE, flameMat, 0.45);
        lFlame.position.set(0, 0.28, 0.45);
        sg.add(lFlame);

        g.add(sg);
      });
      return { lamps: lamps };
    });

    // 2_2: Moored Traditional Wooden Greek Caïque IN the Aegean Sea at (19.6, -0.34, -27.5)
    registerWonder(THREE, scene, '2_2', 'windShip', 19.6, -0.34, -27.5, 19.6, 2.2, -27.5, -3.4, function (g) {
      var vessel = new THREE.Group();
      vessel.rotation.y = -0.38;
      g.add(vessel);

      var hull = buildLoftedWoodenHull(THREE, mats, {
        length: 9.8,
        beam: 2.95,
        depth: 1.42,
        sheerBow: 0.62,
        sheerStern: 0.48,
        isGalley: false
      });
      hull.position.y = 0.28;
      vessel.add(hull);

      // Whitewashed aft deckhouse cabin with brass portholes & timber roof
      var cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.82, 2.15), mats.whitewash);
      cabin.position.set(0, 1.12, 1.55);
      vessel.add(cabin);
      var cabinRoof = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.09, 2.28), mats.carvedTimber);
      cabinRoof.position.set(0, 1.56, 1.55);
      vessel.add(cabinRoof);
      [-0.82, 0.82].forEach(function (px) {
        var portHole = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 8, 16), mats.polishedBrass);
        portHole.rotation.y = Math.PI / 2;
        portHole.position.set(px, 1.16, 1.55);
        vessel.add(portHole);
      });

      // Raked wooden bowsprit
      var bowsprit = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.085, 2.65, 10), mats.carvedTimber);
      bowsprit.rotation.x = Math.PI / 2 - 0.34;
      bowsprit.position.set(0, 1.48, -5.55);
      vessel.add(bowsprit);

      // Twin Masts (Mainmast & Foremast) with slanted Lateen Yards, Billowing Canvas Sails & Rigging!
      var sails = [];
      [
        { mz: -0.45, mh: 6.4, yardL: 6.2, sailW: 4.8, sailH: 4.6 },
        { mz: -2.95, mh: 4.8, yardL: 4.5, sailW: 3.4, sailH: 3.3 }
      ].forEach(function (ms, mIdx) {
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.125, ms.mh, 12), mats.carvedTimber);
        mast.position.set(0, 0.65 + ms.mh * 0.5, ms.mz);
        vessel.add(mast);

        // Slanted lateen yardarm (antena)
        var yard = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, ms.yardL, 10), mats.darkKeelTimber);
        yard.rotation.x = Math.PI / 2 - 0.68;
        yard.position.set(0.08, 0.65 + ms.mh * 0.68, ms.mz + 0.15);
        vessel.add(yard);

        // Curved billowing lateen canvas sail
        var sailMesh = buildBillowingSail(THREE, mats.sailCanvas, ms.sailW, ms.sailH, true, 0.52 - mIdx * 0.12);
        sailMesh.position.set(0.08, 0.65 + ms.mh * 0.52, ms.mz + 0.25);
        vessel.add(sailMesh);
        sails.push(sailMesh);

        //Standing rigging shrouds to port and starboard gunwales
        [-1.22, 1.22].forEach(function (rx) {
          var shroudCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0.65 + ms.mh * 0.88, ms.mz),
            new THREE.Vector3(rx, 0.98, ms.mz + 0.15)
          ]);
          vessel.add(new THREE.Mesh(new THREE.TubeGeometry(shroudCurve, 6, 0.012, 5, false), mats.darkKeelTimber));
        });
      });

      // Forestay from mainmast head to bowsprit tip
      var stayCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 6.85, -0.45),
        new THREE.Vector3(0, 5.15, -2.95),
        new THREE.Vector3(0, 1.92, -6.65)
      ]);
      vessel.add(new THREE.Mesh(new THREE.TubeGeometry(stayCurve, 12, 0.012, 5, false), mats.darkKeelTimber));

      // Warm glowing brass masthead & bow lanterns
      var mastLamp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 12), mats.warmCandleGlow);
      mastLamp.position.set(0, 7.18, -0.45);
      vessel.add(mastLamp);
      var mastHalo = new THREE.Sprite(new THREE.SpriteMaterial({
        map: mats.starSpriteTex,
        color: 0xfde68a,
        transparent: true,
        opacity: 0.78,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      }));
      mastHalo.scale.set(1.85, 1.85, 1.0);
      mastHalo.position.set(0, 7.18, -0.45);
      vessel.add(mastHalo);
      var deckGlow = makeWarmGlowSprite(THREE, mats, 0xfbbf24, 2.75, 2.15, 0.48);
      deckGlow.position.set(0, 1.85, 0.85);
      vessel.add(deckGlow);

      mergeStaticChildrenByMaterial(THREE, vessel, sails);

      // Soft shader water wake ripples around the floating hull
      var wakeMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(13.5, 15.5),
        createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe)
      );
      wakeMesh.rotation.x = -Math.PI / 2;
      wakeMesh.rotation.z = -0.38;
      wakeMesh.position.y = 0.02;
      g.add(wakeMesh);

      return { vessel: vessel, sails: sails, excludeFromMerge: [vessel] };
    });

    // 2_3: Classical Greek Circular Stone Orchestra Mosaic & Bronze Masque Proscenium at (0, 0.45, -29.2)
    registerWonder(THREE, scene, '2_3', 'sovereignDais', 0, 0.45, -29.2, 0, 1.35, -29.2, -2.6, function (g) {
      // Flush walkable circular Pentelic & Eleusinian stone Orchestra mosaic floor
      var kerbOuter = new THREE.Mesh(new THREE.CylinderGeometry(3.28, 3.38, 0.07, 48), mats.limestone);
      kerbOuter.position.y = 0.035;
      g.add(kerbOuter);

      var mosaicDisc = new THREE.Mesh(new THREE.CylinderGeometry(3.12, 3.16, 0.085, 48), makeOrchestraMosaicMaterial(THREE));
      mosaicDisc.position.y = 0.045;
      g.add(mosaicDisc);

      // Curved low marble proscenium balustrades on the East & West flanks (center |x| < 1.95m stays 100% open & walkable!)
      [-1, 1].forEach(function (side) {
        for (var b = 0; b < 4; b++) {
          var ang = side * (0.72 + b * 0.28);
          var r = 3.18;
          var bx = Math.sin(ang) * r;
          var bz = -Math.cos(ang) * r * 0.65;
          var wall = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.68, 0.28), mats.pentelicMarble);
          wall.position.set(bx, 0.36, bz);
          wall.rotation.y = -ang;
          g.add(wall);
          var cap = new THREE.Mesh(new THREE.BoxGeometry(0.94, 0.09, 0.36), mats.limestone);
          cap.position.set(bx, 0.74, bz);
          cap.rotation.y = -ang;
          g.add(cap);
        }

        // Sculpted patinated-bronze Tragic & Comic Masque relief pedestals on left/right stage wings
        var isTragic = side < 0; // Left = Melpomene (Tragedy), Right = Thalia (Comedy)
        var mPed = new THREE.Group();
        mPed.position.set(side * 2.85, 0.08, -0.35);
        mPed.rotation.y = -side * 0.42;

        var plinth = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.86, 0.54), mats.pentelicMarble);
        plinth.position.y = 0.43;
        mPed.add(plinth);
        var pedCap = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.08, 0.62), mats.limestone);
        pedCap.position.y = 0.90;
        mPed.add(pedCap);

        // Carved marble relief backing stele behind the bronze theatre mask
        var steleBack = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.94, 0.10), mats.pentelicMarble);
        steleBack.position.set(0, 1.41, -0.06);
        mPed.add(steleBack);
        var stelePediment = new THREE.Mesh(new THREE.ConeGeometry(0.54, 0.20, 4), mats.limestone);
        stelePediment.rotation.y = Math.PI / 4;
        stelePediment.scale.set(1.0, 1.0, 0.24);
        stelePediment.position.set(0, 1.98, -0.06);
        mPed.add(stelePediment);

        // Sculpted Hellenistic Cast-Bronze Prosopon Mask (Onkos silhouette, pierced hollow eyes & open mouth)
        var maskGroup = new THREE.Group();
        maskGroup.position.set(0, 1.40, 0.06);
        maskGroup.scale.setScalar(1.08);

        var maskShape = new THREE.Shape();
        maskShape.moveTo(0.0, -0.44);
        maskShape.bezierCurveTo(0.14, -0.43, 0.25, -0.31, 0.29, -0.15);
        maskShape.bezierCurveTo(0.35, -0.02, 0.36, 0.11, 0.32, 0.23);
        maskShape.bezierCurveTo(0.31, 0.36, 0.19, 0.47, 0.0, 0.50);
        maskShape.bezierCurveTo(-0.19, 0.47, -0.31, 0.36, -0.32, 0.23);
        maskShape.bezierCurveTo(-0.36, 0.11, -0.35, -0.02, -0.29, -0.15);
        maskShape.bezierCurveTo(-0.25, -0.31, -0.14, -0.43, 0.0, -0.44);

        // Pierced Hollow Eye Sockets (CW winding)
        var leftEyeHole = new THREE.Path();
        var rightEyeHole = new THREE.Path();
        if (isTragic) {
          leftEyeHole.moveTo(-0.060, 0.145);
          leftEyeHole.quadraticCurveTo(-0.145, 0.205, -0.242, 0.085);
          leftEyeHole.quadraticCurveTo(-0.145, 0.035, -0.060, 0.145);

          rightEyeHole.moveTo(0.242, 0.085);
          rightEyeHole.quadraticCurveTo(0.145, 0.205, 0.060, 0.145);
          rightEyeHole.quadraticCurveTo(0.145, 0.035, 0.242, 0.085);
        } else {
          leftEyeHole.moveTo(-0.060, 0.095);
          leftEyeHole.quadraticCurveTo(-0.148, 0.215, -0.242, 0.128);
          leftEyeHole.quadraticCurveTo(-0.148, 0.052, -0.060, 0.095);

          rightEyeHole.moveTo(0.242, 0.128);
          rightEyeHole.quadraticCurveTo(0.148, 0.215, 0.060, 0.095);
          rightEyeHole.quadraticCurveTo(0.148, 0.052, 0.242, 0.128);
        }
        maskShape.holes.push(leftEyeHole, rightEyeHole);

        // Pierced Wide Acoustic Open Mouth Aperture (CW winding)
        var mouthHole = new THREE.Path();
        if (isTragic) {
          mouthHole.moveTo(-0.185, -0.295);
          mouthHole.bezierCurveTo(-0.120, -0.095, 0.120, -0.095, 0.185, -0.295);
          mouthHole.bezierCurveTo(0.095, -0.345, -0.095, -0.345, -0.185, -0.295);
        } else {
          mouthHole.moveTo(-0.205, -0.105);
          mouthHole.bezierCurveTo(-0.090, -0.158, 0.090, -0.158, 0.205, -0.105);
          mouthHole.bezierCurveTo(0.145, -0.342, -0.145, -0.342, -0.205, -0.105);
        }
        maskShape.holes.push(mouthHole);

        var maskGeo = new THREE.ExtrudeGeometry(maskShape, {
          depth: 0.048,
          bevelEnabled: true,
          bevelThickness: 0.008,
          bevelSize: 0.005,
          bevelSegments: 2,
          curveSegments: 14
        });
        var mPos = maskGeo.attributes.position;
        for (var mv = 0; mv < mPos.count; mv++) {
          var mx = mPos.getX(mv);
          var my = mPos.getY(mv);
          var mz = mPos.getZ(mv);
          var faceCurve = Math.cos(mx * 3.35) * 0.135 - Math.max(0.0, -my) * 0.045;
          mPos.setZ(mv, mz + faceCurve);
        }
        maskGeo.computeVertexNormals();
        maskGroup.add(new THREE.Mesh(maskGeo, mats.maskBronze));

        // Zero-specular deep matte interior shadow cavity right behind pierced hollow eyes & open mouth
        var voidGeo = new THREE.PlaneGeometry(0.56, 0.76, 14, 14);
        var vPos = voidGeo.attributes.position;
        for (var vv = 0; vv < vPos.count; vv++) {
          var vx = vPos.getX(vv);
          var vy = vPos.getY(vv);
          var vCurve = Math.cos(vx * 3.35) * 0.135 - Math.max(0.0, -vy) * 0.045;
          vPos.setZ(vv, vCurve + 0.018);
        }
        voidGeo.computeVertexNormals();
        maskGroup.add(new THREE.Mesh(voidGeo, mats.maskCavityDark));

        function maskZ(x, y) {
          return Math.cos(x * 3.35) * 0.135 - Math.max(0.0, -y) * 0.045 + 0.062;
        }

        // Sculpted 3D Dramatic Brow Ridges (knitted anguished brows for Tragedy, high arched brows for Comedy)
        [-1, 1].forEach(function (bs) {
          var browPts = isTragic
            ? [
                new THREE.Vector3(bs * 0.032, 0.225, maskZ(bs * 0.032, 0.225) + 0.015),
                new THREE.Vector3(bs * 0.145, 0.188, maskZ(bs * 0.145, 0.188) + 0.018),
                new THREE.Vector3(bs * 0.265, 0.105, maskZ(bs * 0.265, 0.105) + 0.010)
              ]
            : [
                new THREE.Vector3(bs * 0.045, 0.165, maskZ(bs * 0.045, 0.165) + 0.012),
                new THREE.Vector3(bs * 0.150, 0.262, maskZ(bs * 0.150, 0.262) + 0.020),
                new THREE.Vector3(bs * 0.268, 0.160, maskZ(bs * 0.268, 0.160) + 0.010)
              ];
          var browTube = new THREE.Mesh(
            new THREE.TubeGeometry(new THREE.CatmullRomCurve3(browPts), 12, 0.025, 8, false),
            mats.maskHighlightBronze
          );
          maskGroup.add(browTube);
        });

        if (isTragic) {
          // Anguished vertical glabella frown creases above the tragic nose bridge
          [-0.024, 0.024].forEach(function (fx) {
            var furrow = new THREE.Mesh(new THREE.CylinderGeometry(0.010, 0.012, 0.09, 6), mats.maskHighlightBronze);
            furrow.position.set(fx, 0.245, maskZ(fx, 0.245) + 0.012);
            furrow.rotation.z = fx < 0 ? -0.15 : 0.15;
            maskGroup.add(furrow);
          });
        } else {
          // Expressive raised comic cheek-apples flanking the grin
          [-0.215, 0.215].forEach(function (cx) {
            var cheek = new THREE.Mesh(new THREE.SphereGeometry(0.068, 10, 8), mats.maskBronze);
            cheek.scale.set(1.1, 0.85, 0.55);
            cheek.position.set(cx, -0.03, maskZ(cx, -0.03) - 0.01);
            maskGroup.add(cheek);
          });
        }

        // Sculpted 3D Classical Greek Nose Bridge & Nostril Wings
        var nosePts = [
          new THREE.Vector3(0, 0.175, maskZ(0, 0.175) + 0.008),
          new THREE.Vector3(0, 0.055, maskZ(0, 0.055) + 0.048),
          new THREE.Vector3(0, -0.052, maskZ(0, -0.052) + 0.068),
          new THREE.Vector3(0, -0.078, maskZ(0, -0.078) + 0.018)
        ];
        var noseBridge = new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(nosePts), 10, 0.032, 6, false),
          mats.maskHighlightBronze
        );
        noseBridge.scale.set(0.82, 1.0, 1.15);
        maskGroup.add(noseBridge);
        [-0.042, 0.042].forEach(function (nx) {
          var ala = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), mats.maskBronze);
          ala.position.set(nx, -0.055, maskZ(nx, -0.055) + 0.022);
          maskGroup.add(ala);
        });

        // Contoured 3D Bronze Acoustic Lip Moulding framing the pierced open mouth
        var upperLipPts = isTragic
          ? [
              new THREE.Vector3(-0.185, -0.285, maskZ(-0.185, -0.285) + 0.010),
              new THREE.Vector3(-0.085, -0.150, maskZ(-0.085, -0.150) + 0.022),
              new THREE.Vector3(0.0, -0.132, maskZ(0.0, -0.132) + 0.026),
              new THREE.Vector3(0.085, -0.150, maskZ(0.085, -0.150) + 0.022),
              new THREE.Vector3(0.185, -0.285, maskZ(0.185, -0.285) + 0.010)
            ]
          : [
              new THREE.Vector3(-0.205, -0.112, maskZ(-0.205, -0.112) + 0.012),
              new THREE.Vector3(-0.095, -0.152, maskZ(-0.095, -0.152) + 0.020),
              new THREE.Vector3(0.0, -0.158, maskZ(0.0, -0.158) + 0.024),
              new THREE.Vector3(0.095, -0.152, maskZ(0.095, -0.152) + 0.020),
              new THREE.Vector3(0.205, -0.112, maskZ(0.205, -0.112) + 0.012)
            ];
        var lowerLipPts = isTragic
          ? [
              new THREE.Vector3(-0.185, -0.285, maskZ(-0.185, -0.285) + 0.010),
              new THREE.Vector3(0.0, -0.322, maskZ(0.0, -0.322) + 0.018),
              new THREE.Vector3(0.185, -0.285, maskZ(0.185, -0.285) + 0.010)
            ]
          : [
              new THREE.Vector3(-0.205, -0.112, maskZ(-0.205, -0.112) + 0.012),
              new THREE.Vector3(-0.110, -0.268, maskZ(-0.110, -0.268) + 0.018),
              new THREE.Vector3(0.0, -0.292, maskZ(0.0, -0.292) + 0.020),
              new THREE.Vector3(0.110, -0.268, maskZ(0.110, -0.268) + 0.018),
              new THREE.Vector3(0.205, -0.112, maskZ(0.205, -0.112) + 0.012)
            ];
        maskGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(upperLipPts), 16, 0.020, 8, false),
          mats.maskHighlightBronze
        ));
        maskGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lowerLipPts), 14, 0.018, 8, false),
          mats.maskHighlightBronze
        ));

        // Sculpted Classical Onkos Hair-Crown Curls & Dionysian Forehead Fillet
        var filletPts = [
          new THREE.Vector3(-0.28, 0.25, maskZ(-0.28, 0.25) + 0.012),
          new THREE.Vector3(0.0, 0.31, maskZ(0.0, 0.31) + 0.016),
          new THREE.Vector3(0.28, 0.25, maskZ(0.28, 0.25) + 0.012)
        ];
        maskGroup.add(new THREE.Mesh(
          new THREE.TubeGeometry(new THREE.CatmullRomCurve3(filletPts), 12, 0.016, 6, false),
          mats.polishedBrass
        ));
        for (var hc = 0; hc < 11; hc++) {
          var hu = hc / 10.0;
          var hAng = (hu - 0.5) * Math.PI * 0.96;
          var hx = Math.sin(hAng) * 0.335;
          var hy = 0.08 + Math.cos(hAng) * 0.42;
          var curl = new THREE.Mesh(new THREE.SphereGeometry(0.068 + (1.0 - Math.abs(hu - 0.5)) * 0.018, 10, 8), mats.patinatedBronze);
          curl.scale.set(0.88, 1.25, 0.85);
          curl.position.set(hx, hy, maskZ(hx * 0.85, hy * 0.85) - 0.015);
          maskGroup.add(curl);
        }

        mPed.add(maskGroup);

        // Warm bronze footlight brazier beside each Masque relief
        var fb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.14, 0.34, 12), mats.patinatedBronze);
        fb.position.set(-side * 0.55, 0.22, 0.35);
        mPed.add(fb);
        var fFlame = buildTorchFlameMesh(THREE, flameMat, 0.62);
        fFlame.position.set(-side * 0.55, 0.38, 0.35);
        mPed.add(fFlame);

        // Soft Fresnel theatrical stage beam washing inward onto the mosaic
        var stageBeam = new THREE.Mesh(
          new THREE.CylinderGeometry(0.18, 1.15, 4.6, 24, 1, true),
          createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
            colorBase: 0xfffbeb,
            colorTip: 0xf59e0b,
            opacity: 0.36,
            speed: 1.2
          })
        );
        stageBeam.position.set(side * 2.4, 2.35, -0.2);
        stageBeam.rotation.z = side * 0.42;
        g.add(stageBeam);

        g.add(mPed);
      });

      return {};
    });

    // 2_4: Arched Stone Bell-Tower, Cast-Bronze Bell, Real Toothed Brass Clockwork Gears & Swinging Pendulum at (-7.1, 0.45, -27.9)
    registerWonder(THREE, scene, '2_4', 'belfry', -7.1, 0.45, -27.9, -7.1, 4.5, -27.9, -6.8, function (g) {
      // Rusticated limestone base plinth
      var base = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.52, 2.48), mats.limestone);
      base.position.y = 0.26;
      g.add(base);

      // 4 open stone corner piers so clockwork gears, pendulum & bell are visible in full 3D!
      var pierH = 4.65;
      [-0.92, 0.92].forEach(function (px) {
        [-0.92, 0.92].forEach(function (pz) {
          var pier = new THREE.Mesh(new THREE.BoxGeometry(0.46, pierH, 0.46), mats.limestone);
          pier.position.set(px, 0.52 + pierH * 0.5, pz);
          g.add(pier);
          var imp = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.12, 0.54), mats.pentelicMarble);
          imp.position.set(px, 0.52 + pierH, pz);
          g.add(imp);
        });
      });

      // 4 Semicircular Classical Stone Arches connecting the piers at y = 5.17
      for (var side = 0; side < 4; side++) {
        var archGroup = new THREE.Group();
        archGroup.position.y = 5.17;
        archGroup.rotation.y = side * (Math.PI / 2);
        var archRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.20, 10, 24, Math.PI), mats.pentelicMarble);
        archRing.position.z = 0.92;
        archGroup.add(archRing);
        var spandrel = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.28, 0.44), mats.limestone);
        spandrel.position.set(0, 0.86, 0.92);
        archGroup.add(spandrel);
        g.add(archGroup);
      }

      // Pyramidal terracotta-tiled belfry roof & bronze finial
      var cornice = new THREE.Mesh(new THREE.BoxGeometry(2.58, 0.16, 2.58), mats.pentelicMarble);
      cornice.position.y = 6.18;
      g.add(cornice);
      var roof = new THREE.Mesh(new THREE.ConeGeometry(1.92, 1.32, 4), mats.terracotta);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 6.26 + 0.66;
      g.add(roof);
      var vane = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.55, 8), mats.polishedBrass);
      vane.position.y = 7.72;
      g.add(vane);

      // Lathe-Turned Cast-Bronze Chapel Bell & Timber Yoke under the stone vault
      var bellPivot = new THREE.Group();
      bellPivot.position.set(0, 5.42, 0);
      var yoke = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.18, 0.24), mats.carvedTimber);
      bellPivot.add(yoke);
      var bellPts = [
        new THREE.Vector2(0.01, 0.0),
        new THREE.Vector2(0.18, -0.04),
        new THREE.Vector2(0.24, -0.28),
        new THREE.Vector2(0.29, -0.58),
        new THREE.Vector2(0.48, -0.82),
        new THREE.Vector2(0.44, -0.84)
      ];
      var bellGeo = new THREE.LatheGeometry(bellPts, 28);
      var bellMesh = new THREE.Mesh(bellGeo, mats.patinatedBronze);
      bellMesh.material.side = THREE.DoubleSide;
      bellPivot.add(bellMesh);
      var clapper = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), mats.polishedBrass);
      clapper.position.y = -0.78;
      bellPivot.add(clapper);
      g.add(bellPivot);

      // Brass Skeleton Clockwork Frame & 4 Real Interlocking Toothed Brass Gears!
      var frameBar1 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.10), mats.patinatedBronze);
      frameBar1.position.set(0, 3.65, 0.32);
      g.add(frameBar1);
      var frameBar2 = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.08, 0.10), mats.patinatedBronze);
      frameBar2.position.set(0, 2.85, 0.32);
      g.add(frameBar2);

      var gear1 = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.58, 0.50, 0.08, 20, 6, 0.14), mats.polishedBrass);
      gear1.position.set(-0.28, 3.25, 0.38);
      g.add(gear1);

      var gear2 = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.36, 0.29, 0.08, 12, 4, 0.09), mats.giltGold);
      gear2.position.set(0.56, 3.52, 0.38);
      g.add(gear2);

      var gear3 = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.44, 0.36, 0.07, 16, 5, 0.11), mats.patinatedBronze);
      gear3.position.set(0.32, 2.74, 0.28);
      g.add(gear3);

      var gear4 = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.26, 0.20, 0.07, 10, 4, 0.07), mats.polishedBrass);
      gear4.position.set(-0.42, 3.92, 0.28);
      g.add(gear4);

      // Swinging Brass Pendulum Rod & Lenticular Gilt Bob
      var pendulum = new THREE.Group();
      pendulum.position.set(0, 3.95, -0.05);
      var pRod = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 2.75, 10), mats.polishedBrass);
      pRod.position.y = -1.375;
      pendulum.add(pRod);
      var bobPts = [
        new THREE.Vector2(0.01, -0.10),
        new THREE.Vector2(0.28, -0.04),
        new THREE.Vector2(0.36, 0.0),
        new THREE.Vector2(0.28, 0.04),
        new THREE.Vector2(0.01, 0.10)
      ];
      var bobGeo = new THREE.LatheGeometry(bobPts, 24);
      bobGeo.rotateX(Math.PI / 2);
      var bob = new THREE.Mesh(bobGeo, mats.mirrorGilt);
      bob.position.y = -2.75;
      pendulum.add(bob);
      g.add(pendulum);

      return {
        bellPivot: bellPivot,
        gears: [gear1, gear2, gear3, gear4],
        pendulum: pendulum,
        excludeFromMerge: [bellPivot, gear1, gear2, gear3, gear4, pendulum]
      };
    });

    // --------------------------------------------------------------------------
    // ACT IV (THE TRIAL COURT)
    // --------------------------------------------------------------------------

    // 3_0: Clepsydra of Chronos — Grounded Hellenistic Bronze-and-Marble Water-Clock Monument at (0, 0.45, -65.2)
    registerWonder(THREE, scene, '3_0', 'timePrismGroup', 0, 0.45, -65.2, 0, 2.9, -65.2, -5.2, function (g) {
      // Compact octagonal stepped Pentelic marble base (leaving >2m walkable passage around to Causeway 3!)
      var base1 = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.24, 0.20, 8), mats.limestone);
      base1.position.y = 0.10;
      g.add(base1);
      var base2 = new THREE.Mesh(new THREE.CylinderGeometry(0.94, 1.04, 0.20, 8), mats.pentelicMarble);
      base2.position.y = 0.30;
      g.add(base2);

      // 4 slender fluted marble columns framing the Clepsydra water cylinder
      for (var c = 0; c < 4; c++) {
        var ca = (c / 4) * Math.PI * 2 + Math.PI / 4;
        var col = buildClassicalColumn(THREE, mats, 0.13, 0.16, 2.35, true);
        col.position.set(Math.cos(ca) * 0.78, 0.40, Math.sin(ca) * 0.78);
        g.add(col);
      }

      // Central bronze water basin & translucent aquamarine glass reservoir cylinder
      var basinBot = new THREE.Mesh(new THREE.CylinderGeometry(0.54, 0.62, 0.36, 24), mats.patinatedBronze);
      basinBot.position.y = 0.58;
      g.add(basinBot);

      var glassVessel = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 1.68, 28), mats.chronosGlass);
      glassVessel.position.y = 1.60;
      g.add(glassVessel);

      // Warm golden inner float & glowing water column core
      var floatGroup = new THREE.Group();
      floatGroup.position.y = 1.55;
      var innerCore = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 1.15, 20), mats.warmCandleGlow);
      floatGroup.add(innerCore);
      var floatPointer = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.55, 8), mats.mirrorGilt);
      floatPointer.position.y = 0.65;
      floatGroup.add(floatPointer);
      g.add(floatGroup);

      // Bronze calibration straps & 2 Engraved Meridian Hour Dials (front +Z & back -Z) + Toothed Escapement Gear
      [0.95, 1.60, 2.25].forEach(function (by) {
        var strap = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.028, 10, 28), mats.polishedBrass);
        strap.rotation.x = Math.PI / 2;
        strap.position.y = by;
        g.add(strap);
      });

      var dialMat = makeZodiacDialMaterial(THREE);
      var dialFront = new THREE.Mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.06, 28), dialMat);
      dialFront.rotation.x = Math.PI / 2;
      dialFront.position.set(0, 2.98, 0.54);
      g.add(dialFront);

      var dialHand = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.34, 0.03), mats.mirrorGilt);
      dialHand.position.set(0, 2.98, 0.59);
      g.add(dialHand);

      var waterGear = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.34, 0.28, 0.06, 16, 5, 0.08), mats.polishedBrass);
      waterGear.position.set(0.56, 2.15, 0);
      waterGear.rotation.y = Math.PI / 2;
      g.add(waterGear);

      // Circular marble-and-bronze canopy entablature & cupola
      var topRing = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.02, 0.24, 32), mats.pentelicMarble);
      topRing.position.y = 3.12;
      g.add(topRing);
      var cupola = new THREE.Mesh(new THREE.SphereGeometry(0.76, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.5), mats.patinatedBronze);
      cupola.position.y = 3.24;
      g.add(cupola);

      // Gentle volumetric Fresnel time-ray rising from the Clepsydra oculus
      var chronosBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.75, 0.28, 18.0, 28, 1, true),
        createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
          colorBase: 0xfef3c7,
          colorTip: 0x38bdf8,
          opacity: 0.44,
          speed: 1.1
        })
      );
      chronosBeam.position.y = 12.2;
      g.add(chronosBeam);

      var cGlow = makeWarmGlowSprite(THREE, mats, 0xfbbf24, 2.55, 2.85, 0.56);
      cGlow.position.y = 1.68;
      g.add(cGlow);

      return {
        floatGroup: floatGroup,
        dialHand: dialHand,
        waterGear: waterGear,
        excludeFromMerge: [floatGroup, dialHand, waterGear]
      };
    });

    // 3_1: 5 Torchlit Cycladic Sea-Stacks Rising Out of the Aegean Sea (r = 23..26 around z = -58)
    registerWonder(THREE, scene, '3_1', 'skyIslands', 0, 0, 0, 22.5, 2.8, -50.5, -5.6, function (g) {
      var stackDefs = [
        { x: -22.8, z: -49.0, h: 3.9, seed: 31, yaw:  0.55 },
        { x:  22.8, z: -49.0, h: 4.2, seed: 47, yaw: -0.55 },
        { x: -25.4, z: -67.2, h: 3.7, seed: 63, yaw:  0.85 },
        { x:  24.2, z: -60.5, h: 4.4, seed: 79, yaw: -0.72 },
        { x:  19.6, z: -73.8, h: 3.8, seed: 95, yaw: -0.35 }
      ];
      var foamMat = createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe);

      stackDefs.forEach(function (sd) {
        var sg = new THREE.Group();
        sg.position.set(sd.x, -0.38, sd.z);
        sg.rotation.y = sd.yaw;

        // Shoreline sea-foam collar right on the Aegean surface
        var foam = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 9.6), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.y = 0.04;
        sg.add(foam);

        // Craggy multi-lobe karst limestone sea-stack rising naturally from y = -1.4 to +sd.h
        var mainCrag = new THREE.Mesh(buildOrganicSculptGeo(THREE, 2.85, 2, sd.seed, true), mats.karstRock);
        mainCrag.scale.set(1.18, sd.h * 0.42, 1.12);
        mainCrag.position.y = sd.h * 0.36;
        sg.add(mainCrag);

        var sideCrag = new THREE.Mesh(buildOrganicSculptGeo(THREE, 1.85, 2, sd.seed + 9, true), mats.karstRock);
        sideCrag.scale.set(1.15, 0.85, 1.05);
        sideCrag.position.set(1.65, 0.65, 0.75);
        sg.add(sideCrag);

        // Narrow whitewashed cliffside stone steps winding up from a shoreline torch landing
        for (var st = 0; st < 7; st++) {
          var sf = st / 6.0;
          var sa = 0.2 + sf * 1.45;
          var sr = 2.45 - sf * 0.85;
          var step = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.42), mats.whitewash);
          step.position.set(Math.cos(sa) * sr, 0.35 + sf * (sd.h - 0.65), Math.sin(sa) * sr);
          step.rotation.y = -sa;
          sg.add(step);
        }

        // Shoreline landing flickering bronze torch
        var tPost = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 1.15, 8), mats.patinatedBronze);
        tPost.position.set(2.35, 0.92, 0.45);
        sg.add(tPost);
        var tFlame = buildTorchFlameMesh(THREE, flameMat, 0.72);
        tFlame.position.set(2.35, 1.52, 0.45);
        sg.add(tFlame);

        // Whitewashed summit terrace & miniature Cycladic Chapel (Parakklisi) with Cobalt Dome!
        var terrace = new THREE.Mesh(new THREE.CylinderGeometry(1.78, 1.95, 0.32, 18), mats.whitewash);
        terrace.position.y = sd.h - 0.12;
        sg.add(terrace);

        var chY = sd.h + 0.04;
        var nave = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.08, 1.68), mats.whitewash);
        nave.position.y = chY + 0.54;
        sg.add(nave);

        // Barrel-vault roof + Cycladic cobalt-blue dome + gilt finial
        var vault = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 1.66, 16, 1, false, 0, Math.PI), mats.whitewash);
        vault.rotation.z = Math.PI / 2;
        vault.rotation.y = Math.PI / 2;
        vault.scale.set(1.0, 0.48, 1.0);
        vault.position.y = chY + 1.08;
        sg.add(vault);

        var drum = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.50, 0.26, 18), mats.whitewash);
        drum.position.y = chY + 1.28;
        sg.add(drum);

        var dome = new THREE.Mesh(new THREE.SphereGeometry(0.49, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), mats.cycladicBlue);
        dome.position.y = chY + 1.40;
        sg.add(dome);

        var crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.04), mats.mirrorGilt);
        crossV.position.y = chY + 1.98;
        sg.add(crossV);
        var crossH = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.04, 0.04), mats.mirrorGilt);
        crossH.position.y = chY + 2.02;
        sg.add(crossH);

        // Bell-cote arch at front gable & warm candlelit windows!
        var bellCote = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.48, 0.14), mats.whitewash);
        bellCote.position.set(0, chY + 1.46, -0.82);
        sg.add(bellCote);

        [[-0.69, 0], [0.69, 0], [0, -0.85]].forEach(function (wc, wIdx) {
          var win = new THREE.Mesh(
            new THREE.BoxGeometry(wIdx < 2 ? 0.05 : 0.28, 0.42, wIdx < 2 ? 0.24 : 0.05),
            mats.warmCandleGlow
          );
          win.position.set(wc[0], chY + 0.48, wc[1]);
          sg.add(win);
        });

        var winHalo = new THREE.Sprite(new THREE.SpriteMaterial({
          map: mats.starSpriteTex,
          color: 0xfde68a,
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        }));
        winHalo.scale.set(1.8, 1.8, 1.0);
        winHalo.position.set(0, chY + 0.75, -1.05);
        sg.add(winHalo);

        g.add(sg);
      });
      return {};
    });

    // 3_2: Bronze-Prowed Classical Aegean Galley Sailing on the Water at (-20.8, -0.32, -58.0)
    registerWonder(THREE, scene, '3_2', 'skyArk', -20.8, -0.32, -58.0, -20.8, 1.9, -58.0, -3.4, function (g) {
      var galley = new THREE.Group();
      g.add(galley);

      var hull = buildLoftedWoodenHull(THREE, mats, {
        length: 12.2,
        beam: 2.65,
        depth: 1.30,
        sheerBow: 0.55,
        sheerStern: 0.88,
        isGalley: true
      });
      hull.position.y = 0.24;
      galley.add(hull);

      // Triple-Bladed Patinated-Bronze Waterline Ram (Embolon) at Bow (-Z)
      var ramGroup = new THREE.Group();
      ramGroup.position.set(0, 0.14, -6.35);
      var ramCone = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.28, 6), mats.patinatedBronze);
      ramCone.rotation.x = -Math.PI / 2;
      ramCone.scale.set(0.82, 1.0, 0.68);
      ramGroup.add(ramCone);
      [-0.12, 0.0, 0.12].forEach(function (by) {
        var blade = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.045, 0.95), mats.giltGold);
        blade.position.set(0, by, -0.15);
        ramGroup.add(blade);
      });
      galley.add(ramGroup);

      // Classical Greek Painted Prow-Eyes (Ophthalmoi) on Port & Starboard Bow
      [-0.64, 0.64].forEach(function (ex) {
        var eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), mats.whitewash);
        eyeWhite.scale.set(0.35, 0.72, 1.25);
        eyeWhite.position.set(ex, 0.78, -4.85);
        galley.add(eyeWhite);
        var pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), mats.darkKeelTimber);
        pupil.scale.set(0.45, 0.75, 0.85);
        pupil.position.set(ex * 1.08, 0.78, -4.88);
        galley.add(pupil);
      });

      // Plumed Curved Sternpost Fan (Aphlaston) at Stern (+Z)
      for (var pl = -1; pl <= 1; pl++) {
        var plumeCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(pl * 0.08, 1.35, 5.85),
          new THREE.Vector3(pl * 0.14, 2.35, 6.25),
          new THREE.Vector3(pl * 0.18, 2.85, 5.55)
        ]);
        galley.add(new THREE.Mesh(new THREE.TubeGeometry(plumeCurve, 14, 0.042, 8, false), mats.giltGold));
      }

      // Central Mast, Yardarm & Billowing Square Canvas Sail with Greek Meander Trim
      var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 6.8, 12), mats.carvedTimber);
      mast.position.set(0, 3.7, -0.35);
      galley.add(mast);

      var yard = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 5.6, 10), mats.darkKeelTimber);
      yard.rotation.z = Math.PI / 2;
      yard.position.set(0, 6.15, -0.45);
      galley.add(yard);

      var sqSail = buildBillowingSail(THREE, mats.sailCanvas, 5.2, 3.85, false, 0.78);
      sqSail.position.set(0, 4.18, -0.48);
      galley.add(sqSail);

      // Braided stays & stern lantern
      [[-5.8, 1.15], [5.6, 1.65]].forEach(function (st) {
        var c = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 6.75, -0.35),
          new THREE.Vector3(0, st[1], st[0])
        ]);
        galley.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.014, 5, false), mats.darkKeelTimber));
      });
      var sternLamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 12), mats.warmCandleGlow);
      sternLamp.position.set(0, 2.45, 5.25);
      galley.add(sternLamp);
      var sternGlow = makeWarmGlowSprite(THREE, mats, 0xfde68a, 1.85, 1.85, 0.62);
      sternGlow.position.set(0, 2.45, 5.25);
      galley.add(sternGlow);

      // 14 Wooden Oars (7 per side) Dipping Rhythmically into the Waves!
      var oars = [];
      for (var r = 0; r < 7; r++) {
        var oz = -2.85 + r * 0.95;
        [-1, 1].forEach(function (side) {
          var oarPivot = new THREE.Group();
          oarPivot.position.set(side * 1.24, 0.76, oz);

          var shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.032, 2.85, 8), mats.carvedTimber);
          shaft.rotation.z = -side * 1.12;
          shaft.position.set(side * 1.22, -0.58, 0);
          oarPivot.add(shaft);

          var blade = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.03, 0.16), mats.polishedBrass);
          blade.rotation.z = -side * 1.12;
          blade.position.set(side * 2.42, -1.16, 0);
          oarPivot.add(blade);

          galley.add(oarPivot);
          oars.push({ pivot: oarPivot, side: side, idx: r });
        });
      }

      var galleyDynamic = [sqSail];
      for (var od = 0; od < oars.length; od++) galleyDynamic.push(oars[od].pivot);
      mergeStaticChildrenByMaterial(THREE, galley, galleyDynamic);

      // Soft water wake ripples around the galley
      var gWake = new THREE.Mesh(
        new THREE.PlaneGeometry(11.5, 17.5),
        createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe)
      );
      gWake.rotation.x = -Math.PI / 2;
      gWake.position.y = 0.02;
      g.add(gWake);

      return { galley: galley, oars: oars, sail: sqSail, excludeFromMerge: [galley] };
    });

    // 3_3: Twin Hellenistic 3-Tier Pharos Lighthouses Grounded on Coastal Rocks at (-13.8, -0.6, -64.5) & (13.8, -0.6, -64.5)
    registerWonder(THREE, scene, '3_3', 'triadBeams', 0, 0, 0, -13.8, 6.8, -64.5, -7.8, function (g) {
      var foamMat = createWaterRippleMaterial(THREE, state.waterRippleUniforms, 0xe0f2fe);
      var rotors = [];

      [-13.8, 13.8].forEach(function (px, idx) {
        var pharos = new THREE.Group();
        pharos.position.set(px, -0.6, -64.5);

        // Coastal karst rock outcrop foundation & sea-foam collar
        var rock = new THREE.Mesh(buildOrganicSculptGeo(THREE, 2.45, 2, 330 + idx * 17, true), mats.karstRock);
        rock.scale.set(1.25, 0.68, 1.20);
        rock.position.y = 0.15;
        pharos.add(rock);

        var foam = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 7.6), foamMat);
        foam.rotation.x = -Math.PI / 2;
        foam.position.y = 0.25;
        pharos.add(foam);

        // Plinth & Tier 1: Square Battered Rusticated Limestone Base (Alexandria Pharos Tier I)
        var plinth = new THREE.Mesh(new THREE.BoxGeometry(2.75, 0.36, 2.75), mats.limestone);
        plinth.position.y = 0.92;
        pharos.add(plinth);

        var tier1Geo = new THREE.CylinderGeometry(1.36 * Math.SQRT2, 1.62 * Math.SQRT2, 3.15, 4);
        tier1Geo.rotateY(Math.PI / 4);
        var tier1 = new THREE.Mesh(tier1Geo, mats.limestone);
        tier1.position.y = 1.10 + 1.575;
        pharos.add(tier1);

        var cornice1 = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.18, 2.38), mats.pentelicMarble);
        cornice1.position.y = 4.34;
        pharos.add(cornice1);

        // 4 bronze corner Triton finials on Tier 1 parapet
        [-1.02, 1.02].forEach(function (tx) {
          [-1.02, 1.02].forEach(function (tz) {
            var triton = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.36, 8), mats.patinatedBronze);
            triton.position.set(tx, 4.61, tz);
            pharos.add(triton);
          });
        });

        // Tier 2: Octagonal Pentelic Marble Shaft (Alexandria Pharos Tier II)
        var tier2 = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 1.02, 2.35, 8), mats.pentelicMarble);
        tier2.position.y = 4.43 + 1.175;
        pharos.add(tier2);

        var cornice2 = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 0.96, 0.16, 8), mats.pentelicMarble);
        cornice2.position.y = 6.86;
        pharos.add(cornice2);

        // Tier 3: Open Circular Columned Cupola / Lantern Tholos (Alexandria Pharos Tier III)
        var cupolaY = 6.94;
        for (var c = 0; c < 6; c++) {
          var ca = (c / 6) * Math.PI * 2;
          var col = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.09, 1.38, 12), mats.pentelicMarble);
          col.position.set(Math.cos(ca) * 0.68, cupolaY + 0.69, Math.sin(ca) * 0.68);
          pharos.add(col);
        }
        var domeRing = new THREE.Mesh(new THREE.CylinderGeometry(0.84, 0.80, 0.14, 24), mats.pentelicMarble);
        domeRing.position.y = cupolaY + 1.45;
        pharos.add(domeRing);
        var dome = new THREE.Mesh(new THREE.ConeGeometry(0.86, 0.72, 24), mats.patinatedBronze);
        dome.position.y = cupolaY + 1.88;
        pharos.add(dome);
        var spire = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.46, 10), mats.mirrorGilt);
        spire.position.y = cupolaY + 2.46;
        pharos.add(spire);

        // Blazing Fire-Basket & Rotating Parabolic Reflector + Sweeping Fresnel Searchlight Beam!
        var fireBasket = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.16, 0.32, 12), mats.patinatedBronze);
        fireBasket.position.y = cupolaY + 0.24;
        pharos.add(fireBasket);
        var pFlame = buildTorchFlameMesh(THREE, flameMat, 0.95);
        pFlame.position.y = cupolaY + 0.42;
        pharos.add(pFlame);
        var pGlow = makeWarmGlowSprite(THREE, mats, 0xfde68a, 2.6, 2.6, 0.65);
        pGlow.position.y = cupolaY + 0.65;
        pharos.add(pGlow);

        var beamRotor = new THREE.Group();
        beamRotor.position.y = cupolaY + 0.68;

        var reflector = new THREE.Mesh(new THREE.SphereGeometry(0.36, 16, 12, 0, Math.PI, 0, Math.PI), mats.mirrorGilt);
        reflector.rotation.y = Math.PI;
        reflector.position.z = 0.12;
        beamRotor.add(reflector);

        var beamMat = createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
          colorBase: 0xfffbeb,
          colorTip: idx === 0 ? 0xf59e0b : 0x38bdf8,
          opacity: 0.56,
          speed: 1.5
        });
        var searchBeam = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 0.32, 46.0, 32, 1, true), beamMat);
        searchBeam.rotation.x = -Math.PI / 2 - 0.08;
        searchBeam.position.z = -23.2;
        beamRotor.add(searchBeam);

        pharos.add(beamRotor);
        g.add(pharos);
        rotors.push({ rotor: beamRotor, idx: idx });
      });

      var rotorGroups = rotors.map(function (rt) { return rt.rotor; });
      return { rotors: rotors, excludeFromMerge: rotorGroups };
    });

    // 3_4: Sacred Olive Grove — 8 Gnarled Organic Mediterranean Olive Trees, Stone Wells & Warm Drifting Fireflies
    registerWonder(THREE, scene, '3_4', 'goldenGrove', 0, 0.45, 0, -6.8, 2.8, -54.0, -4.4, function (g) {
      var treeCoords = [
        [-6.8, -53.8,  0.2], [ 6.8, -53.8, -0.4],
        [-8.6, -57.8,  1.1], [ 8.6, -57.8, -1.2],
        [-7.2, -62.2,  2.1], [ 7.2, -62.2, -2.0],
        [-4.5, -64.8,  0.7], [ 4.5, -64.8, -0.8]
      ];
      var crowns = [];

      treeCoords.forEach(function (tc, idx) {
        var tg = new THREE.Group();
        tg.position.set(tc[0], 0, tc[1]);
        tg.rotation.y = tc[2];

        // Circular carved limestone tree-well kerb & dark Mediterranean earth
        var wellKerb = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.11, 10, 24), mats.limestone);
        wellKerb.rotation.x = Math.PI / 2;
        wellKerb.position.y = 0.09;
        tg.add(wellKerb);
        var soil = new THREE.Mesh(new THREE.CylinderGeometry(0.86, 0.88, 0.08, 20), mats.darkKeelTimber);
        soil.position.y = 0.04;
        tg.add(soil);

        // Gnarled intertwined ancient olive bark trunk (2 organic CatmullRom strands + 3 spreading boughs)
        var strand1 = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.14, 0.04, -0.06),
          new THREE.Vector3( 0.16, 0.72,  0.12),
          new THREE.Vector3(-0.12, 1.48, -0.08),
          new THREE.Vector3( 0.06, 2.15,  0.05)
        ]);
        var strand2 = new THREE.CatmullRomCurve3([
          new THREE.Vector3( 0.15, 0.04,  0.08),
          new THREE.Vector3(-0.14, 0.78, -0.10),
          new THREE.Vector3( 0.14, 1.52,  0.09),
          new THREE.Vector3(-0.05, 2.18, -0.04)
        ]);
        tg.add(new THREE.Mesh(new THREE.TubeGeometry(strand1, 16, 0.15, 9, false), mats.oliveBark));
        tg.add(new THREE.Mesh(new THREE.TubeGeometry(strand2, 16, 0.13, 9, false), mats.oliveBark));

        var boughTargets = [
          [-0.86, 2.68,  0.42],
          [ 0.90, 2.74, -0.38],
          [ 0.16, 2.88,  0.76],
          [-0.30, 2.80, -0.70],
          [-0.48, 3.08, -0.16],
          [ 0.52, 3.04,  0.28]
        ];
        boughTargets.forEach(function (bt, bIdx) {
          var bCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 1.98, 0),
            new THREE.Vector3(bt[0] * 0.52, 2.38, bt[2] * 0.52),
            new THREE.Vector3(bt[0], bt[1], bt[2])
          ]);
          tg.add(new THREE.Mesh(new THREE.TubeGeometry(bCurve, 10, bIdx < 4 ? 0.068 : 0.048, 7, false), mats.oliveBark));
        });

        // Airy multi-tiered Mediterranean silver-green olive foliage tufts with soft light-gold grazing rim
        var crownGroup = new THREE.Group();
        var tuftSpecs = [
          // Lower shaded olive under-boughs (tier 0: deep Mediterranean olive)
          [-0.96, 2.68,  0.46, 0.58, 0,  0.10, -0.08],
          [ 0.98, 2.74, -0.42, 0.60, 0, -0.10,  0.08],
          [ 0.22, 2.80,  0.84, 0.55, 0,  0.08,  0.10],
          [-0.34, 2.74, -0.78, 0.56, 0, -0.08, -0.10],
          // Mid-crown olive foliage clusters (tier 1: dusty olive-green)
          [-0.58, 2.98,  0.22, 0.66, 1,  0.06,  0.05],
          [ 0.62, 3.02, -0.18, 0.68, 1, -0.05, -0.06],
          [-0.14, 3.04, -0.48, 0.62, 1,  0.04, -0.05],
          [ 0.18, 3.08,  0.46, 0.62, 1, -0.04,  0.06],
          // Upper wind-turned silvery-sage tufts catching the light-gold rim (tier 2)
          [ 0.00, 3.30,  0.00, 0.72, 2,  0.00,  0.00],
          [-0.54, 3.24, -0.20, 0.56, 2,  0.08, -0.06],
          [ 0.56, 3.22,  0.26, 0.58, 2, -0.07,  0.07],
          [-0.08, 3.36,  0.34, 0.48, 2,  0.05,  0.04]
        ];
        tuftSpecs.forEach(function (ts, pIdx) {
          var seed = idx * 37 + pIdx * 11;
          var tGeo = new THREE.SphereGeometry(ts[3], 18, 14);
          var tPos = tGeo.attributes.position;
          for (var tv = 0; tv < tPos.count; tv++) {
            var tx = tPos.getX(tv);
            var ty = tPos.getY(tv);
            var tz = tPos.getZ(tv);
            var disp = 1.0
              + 0.15 * Math.sin(tx * 4.2 + seed) * Math.cos(tz * 3.9 - seed * 0.7)
              + 0.11 * Math.cos(ty * 4.8 + tx * 3.3 + seed * 1.3)
              + 0.07 * Math.sin((tx - tz) * 5.4 + ty * 3.6 - seed * 0.5);
            tPos.setXYZ(tv, tx * disp, ty * disp, tz * disp);
          }
          tGeo.computeVertexNormals();
          var tMat = ts[4] === 0 ? mats.oliveDeep : (ts[4] === 1 ? mats.oliveSilver : mats.oliveSunGold);
          var cMesh = new THREE.Mesh(tGeo, tMat);
          cMesh.scale.set(1.36, 0.56, 1.28);
          cMesh.position.set(ts[0], ts[1], ts[2]);
          cMesh.rotation.set(ts[5], pIdx * 0.52, ts[6]);
          crownGroup.add(cMesh);
        });
        mergeStaticChildrenByMaterial(THREE, crownGroup, []);
        tg.add(crownGroup);
        g.add(tg);
        crowns.push({ mesh: crownGroup, phase: idx * 0.75 });
      });

      // 42 Warm Drifting Fireflies (soft radial Gaussian sprite texture, zero square pixels!)
      var ffCount = 42;
      var ffGeo = new THREE.BufferGeometry();
      var ffPos = new Float32Array(ffCount * 3);
      var ffSeeds = [];
      var rng = mulberry32(3434);
      for (var f = 0; f < ffCount; f++) {
        var treeRef = treeCoords[f % treeCoords.length];
        var ox = treeRef[0] + (rng() - 0.5) * 3.2;
        var oy = 1.2 + rng() * 2.4;
        var oz = treeRef[1] + (rng() - 0.5) * 3.2;
        ffPos[f * 3]     = ox;
        ffPos[f * 3 + 1] = oy;
        ffPos[f * 3 + 2] = oz;
        ffSeeds.push({ ox: ox, oy: oy, oz: oz, phase: rng() * Math.PI * 2, speed: 0.7 + rng() * 0.8 });
      }
      ffGeo.setAttribute('position', new THREE.BufferAttribute(ffPos, 3));
      var ffMat = new THREE.PointsMaterial({
        map: mats.starSpriteTex,
        color: 0xfde68a,
        size: 0.42,
        transparent: true,
        opacity: 0.88,
        alphaTest: 0.005,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      var fireflies = new THREE.Points(ffGeo, ffMat);
      g.add(fireflies);

      var crownGroups = crowns.map(function (c) { return c.mesh; });
      return { crowns: crowns, fireflies: fireflies, ffSeeds: ffSeeds, excludeFromMerge: crownGroups };
    });

    // --------------------------------------------------------------------------
    // ACT V (PARNASSUS SANCTUARY — z = -97.5)
    // --------------------------------------------------------------------------

    // 4_x: Monumental Antikythera Celestial Mechanism Grounded at (0, 0.45, -97.5)
    registerWonder(THREE, scene, '4_all', 'parnassusSanctuaryGroup', 0, 0.45, -97.5, 0, 3.4, -97.5, -6.2, function (g) {
      // Grounded Bronze-and-Marble Zodiac Sanctuary Floor Ring (walkable flush medallion!)
      var outerStep = new THREE.Mesh(new THREE.CylinderGeometry(4.65, 4.82, 0.08, 56), mats.limestone);
      outerStep.position.y = 0.04;
      g.add(outerStep);

      var zodiacFloor = new THREE.Mesh(new THREE.CylinderGeometry(4.42, 4.48, 0.09, 56), makeZodiacDialMaterial(THREE));
      zodiacFloor.position.y = 0.05;
      g.add(zodiacFloor);

      // 6 Curved Pentelic Marble Sanctuary Colonnade Ribs on East & West Crescents
      // (Leaves central |x| < 2.65m sightline & walkway completely open to the Stela of Eleutheria at z = -101.5!)
      var ribAngles = [-2.25, -1.57, -0.89, 0.89, 1.57, 2.25];
      ribAngles.forEach(function (ang) {
        var rx = Math.sin(ang) * 4.15;
        var rz = Math.cos(ang) * 3.45;
        var col = buildClassicalColumn(THREE, mats, 0.20, 0.25, 3.15, true);
        col.position.set(rx, 0.08, rz);
        g.add(col);

        // Curved Pentelic marble sanctuary vault rib arching from column capital up to the celestial oculus ring (y = 5.65)
        var ribCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(rx, 3.62, rz),
          new THREE.Vector3(rx * 0.72, 4.95, rz * 0.72),
          new THREE.Vector3(Math.sin(ang) * 1.85, 5.65, Math.cos(ang) * 1.85)
        ]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 18, 0.14, 10, false), mats.pentelicMarble));
        var bronzeTrimCurve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(rx * 0.96, 3.60, rz * 0.96),
          new THREE.Vector3(rx * 0.69, 4.88, rz * 0.69),
          new THREE.Vector3(Math.sin(ang) * 1.82, 5.58, Math.cos(ang) * 1.82)
        ]);
        g.add(new THREE.Mesh(new THREE.TubeGeometry(bronzeTrimCurve, 18, 0.04, 8, false), mats.polishedBrass));
      });

      // Overhead Gilt-Bronze Celestial Oculus Ring at y = 5.65
      var oculusRing = new THREE.Mesh(new THREE.TorusGeometry(1.88, 0.14, 14, 48), mats.polishedBrass);
      oculusRing.rotation.x = Math.PI / 2;
      oculusRing.position.y = 5.65;
      g.add(oculusRing);

      // Central Stepped Marble-and-Bronze Antikythera Pedestal & Interlocking Toothed Calendar Gear Train!
      var ped = new THREE.Mesh(new THREE.CylinderGeometry(1.12, 1.28, 0.68, 24), mats.pentelicMarble);
      ped.position.y = 0.38;
      g.add(ped);
      var bronzeCollar = new THREE.Mesh(new THREE.CylinderGeometry(1.16, 1.16, 0.10, 24), mats.patinatedBronze);
      bronzeCollar.position.y = 0.74;
      g.add(bronzeCollar);

      // Horizontal Metonic & Saros Differential Toothed Bronze Gears + Vertical Crown Drive
      // Note: rotated PI/2 around X into XZ plane; in Three.js 'XYZ' Euler order, local axle spin is rotation.z!
      var antiGears = [];
      var gMain = new THREE.Mesh(buildToothedGearGeometry(THREE, 1.38, 1.24, 0.09, 32, 8, 0.28), mats.patinatedBronze);
      gMain.rotation.x = Math.PI / 2;
      gMain.position.y = 0.92;
      g.add(gMain);
      antiGears.push({ mesh: gMain, axis: 'z', speed: 0.28 });

      var gMetonic = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.96, 0.84, 0.08, 24, 6, 0.20), mats.polishedBrass);
      gMetonic.rotation.x = Math.PI / 2;
      gMetonic.position.y = 1.12;
      g.add(gMetonic);
      antiGears.push({ mesh: gMetonic, axis: 'z', speed: -0.42 });

      var gSaros = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.56, 0.47, 0.08, 18, 5, 0.12), mats.giltGold);
      gSaros.rotation.x = Math.PI / 2;
      gSaros.position.set(0.82, 1.02, 0.45);
      g.add(gSaros);
      antiGears.push({ mesh: gSaros, axis: 'z', speed: 0.74 });

      var gCallippic = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.48, 0.40, 0.08, 15, 5, 0.11), mats.polishedBrass);
      gCallippic.rotation.x = Math.PI / 2;
      gCallippic.position.set(-0.78, 1.02, -0.42);
      g.add(gCallippic);
      antiGears.push({ mesh: gCallippic, axis: 'z', speed: 0.88 });

      // Central Brass Axle Column & Vertical Toothed Epicyclic Gear + 3 Precessing Engraved Zodiac Rings
      var axle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 2.85, 16), mats.polishedBrass);
      axle.position.y = 2.15;
      g.add(axle);

      var gCrown = new THREE.Mesh(buildToothedGearGeometry(THREE, 0.78, 0.68, 0.08, 22, 6, 0.16), mats.mirrorGilt);
      gCrown.position.set(0, 3.25, 0);
      g.add(gCrown);
      antiGears.push({ mesh: gCrown, axis: 'z', speed: 0.36 });

      var zodiacRings = [];
      [2.15, 1.68, 1.22].forEach(function (zr, idx) {
        var ringGroup = new THREE.Group();
        ringGroup.position.y = 3.25;
        ringGroup.rotation.set(0.28 + idx * 0.35, idx * 0.6, -0.22 * idx);
        var band = new THREE.Mesh(
          new THREE.CylinderGeometry(zr, zr, 0.14 - idx * 0.02, 48, 1, true),
          idx === 1 ? mats.giltGold.clone() : mats.polishedBrass.clone()
        );
        band.material.side = THREE.DoubleSide;
        ringGroup.add(band);
        var rimA = new THREE.Mesh(new THREE.TorusGeometry(zr, 0.024, 8, 48), mats.mirrorGilt);
        rimA.rotation.x = Math.PI / 2;
        rimA.position.y = 0.07 - idx * 0.01;
        ringGroup.add(rimA);
        g.add(ringGroup);
        zodiacRings.push(ringGroup);
      });

      // Soft Volumetric Fresnel Starlight Oculus Shaft descending into the Sanctuary!
      var oculusBeam = new THREE.Mesh(
        new THREE.CylinderGeometry(2.15, 1.35, 26.0, 36, 1, true),
        createVolumetricBeamMaterial(THREE, state.shaderUniforms, {
          colorBase: 0xfef3c7,
          colorTip: 0x7dd3fc,
          opacity: 0.48,
          speed: 1.0
        })
      );
      oculusBeam.position.y = 14.5;
      g.add(oculusBeam);

      var sancGlow = makeWarmGlowSprite(THREE, mats, 0xfde68a, 3.8, 3.4, 0.54);
      sancGlow.position.y = 3.25;
      g.add(sancGlow);

      var dynSanctuary = [oculusRing];
      for (var agi = 0; agi < antiGears.length; agi++) dynSanctuary.push(antiGears[agi].mesh);
      for (var zri = 0; zri < zodiacRings.length; zri++) dynSanctuary.push(zodiacRings[zri]);

      return {
        antiGears: antiGears,
        zodiacRings: zodiacRings,
        oculusRing: oculusRing,
        excludeFromMerge: dynSanctuary
      };
    });
  }

  // ============================================================================
  // PART A: BESPOKE 3-STAGE DIEGETIC MYST SOLVE CHOREOGRAPHY
  // ============================================================================
  function initSolveChoreography(ctx) {
    var THREE = ctx.THREE;
    var scene = ctx.scene;
    var mats = state.mats;

    var cg = new THREE.Group();
    cg.visible = false;
    cg.userData = {
      phraxosModule: 'PhraxosWonders',
      skipStaticBatch: true,
      noBatch: true,
      isDynamic: true
    };
    scene.add(cg);
    state.choreoGroup = cg;

    // Stage 1: Altar Lectern Engraved Greek-Key Radial Halo (soft ShaderMaterial, zero hard edges!)
    var haloList = [];
    var haloMat = createRadialHaloMaterial(THREE, haloList, 0xfffbeb, 0xf59e0b);
    var haloMesh = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 3.2), haloMat);
    cg.add(haloMesh);
    state.choreo.lecternHalo = haloMesh;
    state.choreo.lecternHaloUni = haloList[0];

    // 3 Sequential Socket Resonance Glow Pads (Socket I -> II -> III)
    state.choreo.socketPads = [];
    for (var s = 0; s < 3; s++) {
      var spMat = new THREE.SpriteMaterial({
        map: mats.starSpriteTex,
        color: 0xfffbeb,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      var sp = new THREE.Sprite(spMat);
      sp.scale.set(2.2, 1.35, 1.0);
      cg.add(sp);
      state.choreo.socketPads.push(sp);
    }

    var altarGlow = makeWarmGlowSprite(THREE, mats, 0xfbbf24, 4.2, 2.7, 0.0);
    cg.add(altarGlow);
    state.choreo.altarGlow = altarGlow;

    // Stage 2: Tapered Fresnel Silk Ribbon + Twin Pharos Companion Ribbon
    var ribList = [];
    var ribMat = createSilkArcRibbonMaterial(THREE, ribList);
    var ribMesh = new THREE.Mesh(new THREE.BufferGeometry(), ribMat);
    ribMesh.frustumCulled = false;
    cg.add(ribMesh);
    state.choreo.ribbonMesh = ribMesh;
    state.choreo.ribbonUni = ribList[0];

    var twinList = [];
    var twinMat = createSilkArcRibbonMaterial(THREE, twinList);
    var twinMesh = new THREE.Mesh(new THREE.BufferGeometry(), twinMat);
    twinMesh.frustumCulled = false;
    twinMesh.visible = false;
    cg.add(twinMesh);
    state.choreo.twinRibbonMesh = twinMesh;
    state.choreo.twinRibbonUni = twinList[0];

    // Parabolic Stream of 96 Soft Radial Starlight Motes + Leading Comet Focal Star
    var moteCount = 96;
    var mGeo = new THREE.BufferGeometry();
    var mPos = new Float32Array(moteCount * 3);
    mGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
    state.choreo.moteSeeds = [];
    var rng = mulberry32(9901);
    for (var i = 0; i < moteCount; i++) {
      state.choreo.moteSeeds.push({
        lag: (i / moteCount) * 0.56,
        swirlPhase: rng() * Math.PI * 2,
        swirlRad: 0.06 + rng() * 0.28,
        speed: 4.5 + rng() * 4.0
      });
    }
    var mMat = new THREE.PointsMaterial({
      map: mats.starSpriteTex,
      color: 0xfef08a,
      size: 0.46,
      transparent: true,
      opacity: 0.0,
      alphaTest: 0.004,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var mPoints = new THREE.Points(mGeo, mMat);
    mPoints.frustumCulled = false;
    cg.add(mPoints);
    state.choreo.motePoints = mPoints;

    var comet = new THREE.Sprite(new THREE.SpriteMaterial({
      map: mats.starSpriteTex,
      color: 0xfffbeb,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    }));
    comet.scale.set(2.1, 2.1, 1.0);
    cg.add(comet);
    state.choreo.cometSprite = comet;
  }

  function rebuildTaperedArcGeometry(THREE, mesh, p0, p1, p2) {
    var curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    var tubularSegs = 44;
    var radialSegs = 10;
    var frames = curve.computeFrenetFrames(tubularSegs, false);
    var positions = [];
    var normals = [];
    var uvs = [];
    var indices = [];

    for (var i = 0; i <= tubularSegs; i++) {
      var u = i / tubularSegs;
      var pt = curve.getPointAt(u);
      var N = frames.normals[i];
      var B = frames.binormals[i];
      // Tapered silk profile: slender at altar & wonder tips, fuller in mid-arc
      var radius = 0.03 + Math.sin(u * Math.PI) * 0.22;
      for (var j = 0; j <= radialSegs; j++) {
        var v = j / radialSegs;
        var theta = v * Math.PI * 2;
        var sinT = Math.sin(theta);
        var cosT = Math.cos(theta);
        var nx = cosT * N.x + sinT * B.x;
        var ny = cosT * N.y + sinT * B.y;
        var nz = cosT * N.z + sinT * B.z;
        positions.push(pt.x + radius * nx, pt.y + radius * ny, pt.z + radius * nz);
        normals.push(nx, ny, nz);
        uvs.push(u, v);
      }
    }
    var stride = radialSegs + 1;
    for (var s = 0; s < tubularSegs; s++) {
      for (var r = 0; r < radialSegs; r++) {
        var a = s * stride + r;
        var b = (s + 1) * stride + r;
        var c = (s + 1) * stride + (r + 1);
        var d = s * stride + (r + 1);
        indices.push(a, b, d, b, c, d);
      }
    }

    var newGeo = new THREE.BufferGeometry();
    newGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    newGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    newGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    newGeo.setIndex(indices);

    if (mesh.geometry) mesh.geometry.dispose();
    mesh.geometry = newGeo;
  }

  function evalQuadraticBezier(out, p0, p1, p2, t) {
    var inv = 1.0 - t;
    out.x = inv * inv * p0.x + 2.0 * inv * t * p1.x + t * t * p2.x;
    out.y = inv * inv * p0.y + 2.0 * inv * t * p1.y + t * t * p2.y;
    out.z = inv * inv * p0.z + 2.0 * inv * t * p1.z + t * t * p2.z;
    return out;
  }

  function restoreActiveTabletEmissive() {
    var refs = state.choreo.activeTabletRefs;
    if (!refs || !refs.length) return;
    for (var i = 0; i < refs.length; i++) {
      var tr = refs[i];
      if (tr && tr.mat && tr.mat.emissive) {
        tr.mat.emissive.setHex(tr.origHex);
        tr.mat.emissiveIntensity = tr.origIntensity;
      }
    }
    state.choreo.activeTabletRefs = [];
  }

  function triggerSolve(altarId, solvedIdx, isFullAct, ctx) {
    var useCtx = ctx || state.ctx;
    if (!useCtx || !state.initialized) return;
    var THREE = useCtx.THREE;

    var safeAltar = clamp(typeof altarId === 'number' ? altarId : 0, 0, 4);
    var safeIdx = typeof solvedIdx === 'number' && solvedIdx >= 0 ? solvedIdx : 0;
    var wKey = safeAltar === 4 ? '4_all' : (safeAltar + '_' + safeIdx);
    var wonder = state.wonders[wKey];
    var altar = ALTAR_LECTERNS[safeAltar];

    restoreActiveTabletEmissive();

    // Capture 3D socket tablet materials if provided on ctx so we can sweep a warm golden pulse across Socket I->II->III
    if (useCtx.tabletMeshes3D && Array.isArray(useCtx.tabletMeshes3D[safeAltar])) {
      var tabs = useCtx.tabletMeshes3D[safeAltar];
      for (var s = 0; s < 3; s++) {
        if (tabs[s] && tabs[s].material && tabs[s].material.emissive) {
          state.choreo.activeTabletRefs.push({
            slot: s,
            mat: tabs[s].material,
            origHex: tabs[s].material.emissive.getHex(),
            origIntensity: tabs[s].material.emissiveIntensity || 0
          });
        }
      }
    }

    var p0 = new THREE.Vector3(altar.x, altar.y + 0.16, altar.z + 0.08);
    var p2 = wonder ? wonder.focalPos.clone() : new THREE.Vector3(altar.x, altar.y + 3.5, altar.z - 6.0);
    var horizDist = Math.hypot(p2.x - p0.x, p2.z - p0.z);
    var apexH = Math.max(p0.y, p2.y) + clamp(horizDist * 0.34, 3.0, 9.2);
    var p1 = new THREE.Vector3((p0.x + p2.x) * 0.5, apexH, (p0.z + p2.z) * 0.5);

    state.choreo.active = true;
    state.choreo.elapsed = 0.0;
    state.choreo.duration = isFullAct ? 3.1 : 2.75;
    state.choreo.altarId = safeAltar;
    state.choreo.solvedIdx = safeIdx;
    state.choreo.isFullAct = !!isFullAct;
    state.choreo.startPos = p0;
    state.choreo.ctrlPos = p1;
    state.choreo.endPos = p2;

    // Position Stage 1 Altar Halo & 3 Socket Resonance Pads right on the true Altar Lectern!
    state.choreo.lecternHalo.position.set(altar.x, altar.y + 0.12, altar.z + 0.08);
    state.choreo.lecternHalo.rotation.set(-Math.PI / 2 + 0.28, 0, 0);
    for (var sp = 0; sp < 3; sp++) {
      state.choreo.socketPads[sp].position.set(altar.x + (sp - 1) * 1.84, altar.y + 0.22, altar.z + 0.08);
    }
    state.choreo.altarGlow.position.set(altar.x, altar.y + 0.88, altar.z + 0.24);

    rebuildTaperedArcGeometry(THREE, state.choreo.ribbonMesh, p0, p1, p2);

    // Twin Pharos (3_3) gets a simultaneous twin symmetrical arc to the East Lighthouse!
    if (wKey === '3_3') {
      var tp2 = new THREE.Vector3(13.8, 6.8, -64.5);
      var tp1 = new THREE.Vector3((p0.x + tp2.x) * 0.5, apexH, (p0.z + tp2.z) * 0.5);
      state.choreo.hasTwinArc = true;
      state.choreo.twinEndPos = tp2;
      state.choreo.twinCtrlPos = tp1;
      rebuildTaperedArcGeometry(THREE, state.choreo.twinRibbonMesh, p0, tp1, tp2);
      state.choreo.twinRibbonMesh.visible = true;
    } else {
      state.choreo.hasTwinArc = false;
      state.choreo.twinRibbonMesh.visible = false;
    }

    state.choreoGroup.visible = true;

    // Stage 3: Prepare physical emergence & golden base shimmer on the solved Wonder
    if (wonder) {
      wonder.targetReveal = 1.0;
      wonder.choreoRevealing = true;
      if (!wonder.settled) {
        wonder.revealProgress = 0.0;
        wonder.revealDelay = 0.62;
        wonder.inner.position.y = wonder.buryY;
      } else {
        // Re-solving an already standing wonder plays a gentle mechanical crest & base shimmer
        wonder.revealProgress = 0.76;
        wonder.revealDelay = 0.45;
      }
      wonder.shimmerTimer = 2.45;
      wonder.group.visible = true;
    }

    // Gentle camera look-elevation toward the awakening Wonder
    state.cameraLiftTimer = isFullAct ? 2.8 : 2.1;
    if (useCtx.wonderGroups) {
      useCtx.wonderGroups.solveTimer = 0;
      useCtx.wonderGroups.cameraRevealTimer = 0;
      if (useCtx.wonderGroups.solveFXGroup) {
        useCtx.wonderGroups.solveFXGroup.visible = false;
      }
    }
  }

  function updateSolveChoreography(dt, tSec, ctx) {
    var ch = state.choreo;
    if (!ch.active) return;

    ch.elapsed += dt;
    var e = ch.elapsed;

    // 1) Stage 1 (0.0s - 0.55s sweep, decaying smoothly by 1.25s): Altar Tablet Resonance & Greek Key Halo
    var haloFade = smoothstepJS(0.0, 0.14, e) * (1.0 - smoothstepJS(0.55, 1.25, e));
    ch.lecternHaloUni.uProgress.value = clamp(e / 1.15, 0.0, 1.0);
    ch.lecternHaloUni.uOpacity.value = haloFade * 0.92;
    ch.altarGlow.material.opacity = haloFade * 0.68;
    var agScale = 3.8 + haloFade * 1.4;
    ch.altarGlow.scale.set(agScale, agScale * 0.65, 1.0);

    for (var s = 0; s < 3; s++) {
      var sStart = s * 0.14;
      var sWave = smoothstepJS(sStart, sStart + 0.12, e) * (1.0 - smoothstepJS(sStart + 0.24, sStart + 0.78, e));
      ch.socketPads[s].material.opacity = sWave * 0.85;
      var sc = 1.6 + sWave * 0.95;
      ch.socketPads[s].scale.set(sc, sc * 0.62, 1.0);
    }

    for (var tr = 0; tr < ch.activeTabletRefs.length; tr++) {
      var ref = ch.activeTabletRefs[tr];
      var tw = smoothstepJS(ref.slot * 0.14, ref.slot * 0.14 + 0.12, e) * (1.0 - smoothstepJS(0.52, 1.15, e));
      if (ref.mat && ref.mat.emissive) {
        ref.mat.emissive.setHex(0xd97706);
        ref.mat.emissiveIntensity = ref.origIntensity + tw * 0.55;
      }
    }

    // 2) Stage 2 (0.20s - 1.35s): Parabolic Focusing Arc -> Target Wonder
    var arcRaw = clamp((e - 0.18) / 1.18, 0.0, 1.35);
    var arcFade = smoothstepJS(0.18, 0.30, e) * (1.0 - smoothstepJS(1.15, 1.58, e));
    ch.ribbonUni.uHead.value = arcRaw;
    ch.ribbonUni.uOpacity.value = arcFade * 0.95;
    if (ch.hasTwinArc) {
      ch.twinRibbonUni.uHead.value = arcRaw;
      ch.twinRibbonUni.uOpacity.value = arcFade * 0.95;
    }

    // Update Parabolic Golden Starlight Motes & Leading Comet Sprite
    var posAttr = ch.motePoints.geometry.attributes.position;
    var arr = posAttr.array;
    var tmp = { x: 0, y: 0, z: 0 };
    for (var i = 0; i < ch.moteSeeds.length; i++) {
      var ms = ch.moteSeeds[i];
      var useTwin = ch.hasTwinArc && (i % 2 === 1);
      var uMote = clamp(arcRaw - ms.lag, 0.0, 1.0);
      evalQuadraticBezier(
        tmp,
        ch.startPos,
        useTwin ? ch.twinCtrlPos : ch.ctrlPos,
        useTwin ? ch.twinEndPos : ch.endPos,
        uMote
      );
      var env = Math.sin(uMote * Math.PI);
      var ang = tSec * ms.speed + ms.swirlPhase;
      arr[i * 3]     = tmp.x + Math.cos(ang) * ms.swirlRad * env;
      arr[i * 3 + 1] = tmp.y + Math.sin(ang * 1.3) * ms.swirlRad * env;
      arr[i * 3 + 2] = tmp.z + Math.sin(ang) * ms.swirlRad * env;
    }
    posAttr.needsUpdate = true;
    ch.motePoints.material.opacity = arcFade * 0.92;

    var headClamped = clamp(arcRaw, 0.0, 1.0);
    evalQuadraticBezier(tmp, ch.startPos, ch.ctrlPos, ch.endPos, headClamped);
    ch.cometSprite.position.set(tmp.x, tmp.y, tmp.z);
    var cometVis = smoothstepJS(0.20, 0.28, e) * (1.0 - smoothstepJS(1.02, 1.38, e));
    ch.cometSprite.material.opacity = cometVis * 0.96;
    var cScale = 1.6 + Math.sin(tSec * 16.0) * 0.28;
    ch.cometSprite.scale.set(cScale, cScale, 1.0);

    // Finish choreography cleanly
    if (e >= ch.duration) {
      ch.active = false;
      state.choreoGroup.visible = false;
      restoreActiveTabletEmissive();
    }
  }

  // ============================================================================
  // PUBLIC API: applyWorldWonders, update, init
  // ============================================================================
  function applyWorldWonders(activeWonderArr, discoveredSet, ctx) {
    var useCtx = ctx || state.ctx;
    if (!useCtx || !state.initialized) return;

    var aw = Array.isArray(activeWonderArr) ? activeWonderArr : [-1, -1, -1, -1, -1];
    var disc = discoveredSet || (useCtx.getDiscoveredSet ? useCtx.getDiscoveredSet() : new Set());
    var curMode = useCtx.getLevelMode ? useCtx.getLevelMode() : 'c1';
    var modeChanged = state.lastLevelMode !== null && state.lastLevelMode !== curMode;
    var instantSettle = !state.hasRenderedLiveFrame || modeChanged;

    // Apply player physics modifiers cleanly matching myst-island.html contract
    if (useCtx.player) {
      useCtx.player.speedMultiplier = 1.0;
      useCtx.player.gravityMultiplier = 1.0;
      useCtx.player.targetEyeHeight = 2.75;
    }
    if (useCtx.playerLight) {
      useCtx.playerLight.intensity = 0.65;
    }
    if (useCtx.waterUniforms && useCtx.waterUniforms.uFreeze) {
      useCtx.waterUniforms.uFreeze.value = 0.0;
    }

    var w0 = aw[0];
    if (w0 === 0 && useCtx.playerLight) {
      useCtx.playerLight.intensity = 2.8;
    } else if (w0 === 1 && useCtx.player && useCtx.player.gravityMultiplier !== undefined) {
      useCtx.player.gravityMultiplier = 0.32;
    } else if (w0 === 2 && useCtx.player) {
      useCtx.player.speedMultiplier = 2.1;
    } else if (w0 === 3 && useCtx.player) {
      useCtx.player.targetEyeHeight = 5.2;
    } else if (w0 === 4 && useCtx.waterUniforms && useCtx.waterUniforms.uFreeze) {
      useCtx.waterUniforms.uFreeze.value = 1.0;
    }

    if (aw[4] !== undefined && aw[4] !== -1 && useCtx.playerLight) {
      useCtx.playerLight.intensity = 2.6;
    }

    function isUnlocked(a, w) {
      return aw[a] === w || (disc && typeof disc.has === 'function' && disc.has(a + '_' + w));
    }

    function syncEntry(entry, active) {
      entry.targetReveal = active ? 1.0 : 0.0;
      if (entry.choreoRevealing && active) {
        entry.group.visible = true;
        return;
      }
      if (instantSettle) {
        entry.revealProgress = active ? 1.0 : 0.0;
        entry.revealDelay = 0.0;
        entry.shimmerTimer = 0.0;
        entry.settled = active;
        entry.choreoRevealing = false;
        entry.group.visible = active;
        entry.inner.position.y = active ? 0.0 : entry.buryY;
      } else if (active && !entry.group.visible) {
        entry.revealProgress = 0.0;
        entry.inner.position.y = entry.buryY;
        entry.group.visible = true;
        entry.shimmerTimer = 2.1;
      } else if (!active) {
        entry.settled = false;
        entry.choreoRevealing = false;
      }
    }

    for (var a = 0; a < 4; a++) {
      for (var w = 0; w < 5; w++) {
        var entry = state.wonders[a + '_' + w];
        if (entry) syncEntry(entry, isUnlocked(a, w));
      }
    }

    // Act V cumulative Sanctuary mechanism (4_0 .. 4_4)
    var w4Entry = state.wonders['4_all'];
    if (w4Entry) {
      var w4Count = 0;
      for (var k = 0; k < 5; k++) {
        if (isUnlocked(4, k)) w4Count++;
      }
      w4Entry.anim.unlockedCount = w4Count;
      syncEntry(w4Entry, w4Count > 0);
    }

    state.initialSyncDone = true;
    state.lastLevelMode = curMode;
  }

  function update(dt, now, ctx) {
    var useCtx = ctx || state.ctx;
    if (!state.initialized || !useCtx) return;
    state.hasRenderedLiveFrame = true;

    var safeDt = Math.min(Math.max(dt || 0.016, 0.0), 0.1);
    var tSec = (now || 0) * 0.001;
    var freezeAmt = (useCtx.waterUniforms && useCtx.waterUniforms.uFreeze)
      ? useCtx.waterUniforms.uFreeze.value
      : 0.0;

    // Update shared shader time & water-freeze uniforms
    for (var i = 0; i < state.shaderUniforms.length; i++) {
      state.shaderUniforms[i].uTime.value = tSec;
    }
    for (var wr = 0; wr < state.waterRippleUniforms.length; wr++) {
      state.waterRippleUniforms[wr].uTime.value = tSec;
      state.waterRippleUniforms[wr].uFreeze.value = freezeAmt;
    }

    // Gentle camera look-elevation during solve emergence
    if (state.cameraLiftTimer > 0 && useCtx.player) {
      state.cameraLiftTimer = Math.max(0.0, state.cameraLiftTimer - safeDt);
      useCtx.player.pitch += (0.075 - useCtx.player.pitch) * 2.6 * safeDt;
    }

    // Update 3-Stage Solve Choreography
    updateSolveChoreography(safeDt, tSec, useCtx);

    // Resolve player Z coordinate for 48m headland distance-culling of CPU wonder loops & GPU buffer uploads
    var playerZ = null;
    if (useCtx.player && typeof useCtx.player.z === 'number') {
      playerZ = useCtx.player.z;
    } else if (useCtx.camera && useCtx.camera.position && typeof useCtx.camera.position.z === 'number') {
      playerZ = useCtx.camera.position.z;
    }

    // Update physical emergence, base shimmer rings & bespoke mechanical animations on all 21 Wonders
    var keys = Object.keys(state.wonders);
    for (var k = 0; k < keys.length; k++) {
      var w = state.wonders[keys[k]];
      if (!w.group.visible && w.targetReveal <= 0.0) continue;

      if (w.revealDelay > 0.0) {
        w.revealDelay = Math.max(0.0, w.revealDelay - safeDt);
      } else if (w.targetReveal > w.revealProgress) {
        w.revealProgress = Math.min(1.0, w.revealProgress + safeDt / 1.92);
        if (w.revealProgress >= 1.0) {
          w.settled = true;
          w.choreoRevealing = false;
        }
      } else if (w.targetReveal < w.revealProgress) {
        w.revealProgress = Math.max(0.0, w.revealProgress - safeDt * 1.4);
        if (w.revealProgress <= 0.001) {
          w.group.visible = false;
          continue;
        }
      }

      var eased = easeOutCubic(w.revealProgress);
      w.inner.position.y = (1.0 - eased) * w.buryY;

      // Base golden shimmer ring during physical emergence
      if (w.shimmerTimer > 0.0) {
        w.shimmerTimer = Math.max(0.0, w.shimmerTimer - safeDt);
        var sProg = 1.0 - (w.shimmerTimer / 2.45);
        var sFade = smoothstepJS(0.0, 0.22, sProg) * (1.0 - smoothstepJS(0.55, 1.0, sProg));
        w.baseRing.visible = sFade > 0.004;
        w.baseRingUni.uProgress.value = sProg;
        w.baseRingUni.uOpacity.value = sFade * 0.85;
      } else if (w.baseRing.visible) {
        w.baseRing.visible = false;
      }

      // Distance-cull per-frame CPU animation & GPU BufferAttribute uploads when headland is > 48m from player
      var isMidSolve = w.choreoRevealing || w.shimmerTimer > 0.0 || w.revealDelay > 0.0 || Math.abs(w.targetReveal - w.revealProgress) > 0.001;
      if (!isMidSolve && playerZ !== null && Math.abs(playerZ - w.headlandZ) > 48.0) {
        continue;
      }

      // Per-Wonder Mechanical & Natural Animations
      var an = w.anim;
      if (w.key === '0_0' && an.azimuthPivot) {
        an.azimuthPivot.rotation.y = Math.sin(tSec * 0.35) * 0.28 + (1.0 - eased) * 0.9;
        an.dishGroup.rotation.x = -0.58 + (1.0 - eased) * 0.65 + Math.sin(tSec * 0.7) * 0.03;
        an.sideGear.rotation.z = tSec * 0.6;
      } else if (w.key === '0_1' && an.fragments) {
        for (var f = 0; f < an.fragments.length; f++) {
          var fr = an.fragments[f];
          fr.group.position.y = fr.baseY + Math.sin(tSec * 1.15 + fr.phase) * 0.14;
          fr.group.rotation.y = fr.baseRotY + Math.sin(tSec * 0.42 + fr.phase) * 0.10;
          fr.group.rotation.z = fr.baseRotZ + Math.cos(tSec * 0.55 + fr.phase) * 0.045;
        }
      } else if (w.key === '0_3' && an.pyramidion) {
        // Grounded obelisk — never floats! Only a subtle gleam on its electrum pyramidion
        an.pyramidion.material.emissiveIntensity = 0.26 + 0.10 * Math.sin(tSec * 1.8);
      } else if (w.key === '1_0' && an.lanterns) {
        for (var l = 0; l < an.lanterns.length; l++) {
          var lf = an.lanterns[l];
          lf.mesh.position.y = lf.baseY + Math.sin(tSec * 1.15 + lf.phase) * 0.26;
          lf.mesh.position.x = lf.baseX + Math.cos(tSec * 0.65 + lf.phase) * 0.18;
          lf.mesh.rotation.y = Math.sin(tSec * 0.5 + lf.phase) * 0.35;
        }
      } else if (w.key === '1_3' && an.planets) {
        an.gearMain.rotation.z += safeDt * 0.42;
        an.gearPinion.rotation.z -= safeDt * 0.42 * (22 / 12);
        an.gearBevel.rotation.z += safeDt * 0.65;
        an.innerRing.rotation.z -= safeDt * 0.22;
        for (var p = 0; p < an.planets.length; p++) {
          var pl = an.planets[p];
          pl.pivot.rotation.y += safeDt * pl.speed;
          if (pl.moonPivot) pl.moonPivot.rotation.y += safeDt * 2.6;
        }
      } else if (w.key === '2_0' && an.strings) {
        for (var st = 0; st < an.strings.length; st++) {
          var vib = 1.0 + 0.18 * Math.sin(tSec * (14.0 + st * 2.2));
          an.strings[st].scale.set(vib, 1.0, vib);
        }
      } else if (w.key === '2_2' && an.vessel) {
        var swell = sampleSeaSwell(19.6, -27.5, tSec, freezeAmt);
        an.vessel.position.y = swell;
        an.vessel.rotation.z = Math.sin(tSec * 1.15) * 0.038 * (1.0 - freezeAmt * 0.9);
        an.vessel.rotation.x = Math.cos(tSec * 0.92) * 0.024 * (1.0 - freezeAmt * 0.9);
        for (var sl = 0; sl < an.sails.length; sl++) {
          an.sails[sl].scale.x = 1.0 + 0.06 * Math.sin(tSec * 1.8 + sl);
        }
      } else if (w.key === '2_4' && an.pendulum) {
        an.pendulum.rotation.z = Math.sin(tSec * 2.4) * 0.28;
        an.bellPivot.rotation.z = Math.sin(tSec * 1.2) * 0.08;
        an.gears[0].rotation.z += safeDt * 0.55;
        an.gears[1].rotation.z -= safeDt * 0.55 * (20 / 12);
        an.gears[2].rotation.z -= safeDt * 0.55 * (20 / 16);
        an.gears[3].rotation.z += safeDt * 0.55 * (20 / 10);
      } else if (w.key === '3_0' && an.floatGroup) {
        an.floatGroup.position.y = 1.50 + Math.sin(tSec * 0.85) * 0.18;
        an.dialHand.rotation.z = -tSec * 0.35;
        an.waterGear.rotation.z += safeDt * 0.65;
      } else if (w.key === '3_2' && an.galley) {
        var gSwell = sampleSeaSwell(-20.8, -58.0, tSec, freezeAmt);
        an.galley.position.y = gSwell;
        an.galley.position.z = Math.sin(tSec * 0.42) * 1.35 * (1.0 - freezeAmt * 0.9);
        an.galley.rotation.z = Math.sin(tSec * 1.1) * 0.032 * (1.0 - freezeAmt * 0.9);
        an.galley.rotation.x = Math.cos(tSec * 0.85) * 0.022 * (1.0 - freezeAmt * 0.9);
        // True elliptical rowing stroke: dip into water, pull aft, lift & feather forward!
        var rowRate = tSec * 2.2 * (1.0 - freezeAmt * 0.85);
        for (var o = 0; o < an.oars.length; o++) {
          var oar = an.oars[o];
          var stroke = rowRate - oar.idx * 0.18;
          oar.pivot.rotation.y = oar.side * Math.cos(stroke) * 0.28;
          oar.pivot.rotation.z = oar.side * Math.sin(stroke) * 0.16;
        }
      } else if (w.key === '3_3' && an.rotors) {
        for (var r = 0; r < an.rotors.length; r++) {
          var rt = an.rotors[r];
          rt.rotor.rotation.y = Math.sin(tSec * 0.52 + rt.idx * Math.PI * 0.85) * 0.78;
        }
      } else if (w.key === '3_4' && an.crowns) {
        for (var c = 0; c < an.crowns.length; c++) {
          var cr = an.crowns[c];
          cr.mesh.rotation.z = Math.sin(tSec * 1.1 + cr.phase) * 0.024;
          cr.mesh.rotation.x = Math.cos(tSec * 0.9 + cr.phase) * 0.018;
        }
        var ffAttr = an.fireflies.geometry.attributes.position;
        var ffArr = ffAttr.array;
        for (var fp = 0; fp < an.ffSeeds.length; fp++) {
          var sd = an.ffSeeds[fp];
          ffArr[fp * 3]     = sd.ox + Math.sin(tSec * sd.speed + sd.phase) * 0.55;
          ffArr[fp * 3 + 1] = sd.oy + Math.cos(tSec * sd.speed * 1.3 + sd.phase) * 0.36;
          ffArr[fp * 3 + 2] = sd.oz + Math.cos(tSec * sd.speed * 0.9 - sd.phase) * 0.55;
        }
        ffAttr.needsUpdate = true;
      } else if (w.key === '4_all' && an.antiGears) {
        var speedBoost = 0.65 + (an.unlockedCount || 1) * 0.18;
        for (var ag = 0; ag < an.antiGears.length; ag++) {
          var gItem = an.antiGears[ag];
          gItem.mesh.rotation[gItem.axis] += safeDt * gItem.speed * speedBoost;
        }
        for (var zr = 0; zr < an.zodiacRings.length; zr++) {
          var zRing = an.zodiacRings[zr];
          zRing.rotation.y += safeDt * (0.24 + zr * 0.11) * (zr % 2 === 0 ? 1 : -1) * speedBoost;
          zRing.rotation.x += safeDt * 0.08 * (zr === 1 ? -1 : 1);
        }
        an.oculusRing.rotation.z += safeDt * 0.18;
      }
    }
  }

  function init(ctx) {
    if (!ctx || !ctx.THREE || !ctx.scene) return;
    if (state.initialized) return;

    state.ctx = ctx;
    purgeLegacyWonders(ctx);
    state.mats = createMaterials(ctx.THREE);
    buildAllRemasteredWonders(ctx);
    initSolveChoreography(ctx);
    state.initialized = true;

    // Immediately sync any pre-existing discovered wonders from localStorage at revealProgress = 1
    var disc = ctx.getDiscoveredSet ? ctx.getDiscoveredSet() : null;
    applyWorldWonders([-1, -1, -1, -1, -1], disc, ctx);
  }

  function getRootGroups() {
    var list = [];
    var keys = Object.keys(state.wonders);
    for (var i = 0; i < keys.length; i++) {
      var w = state.wonders[keys[i]];
      if (w && w.group) list.push(w.group);
    }
    if (state.choreoGroup) list.push(state.choreoGroup);
    return list;
  }

  global.PhraxosWonders = {
    init: init,
    update: update,
    applyWorldWonders: applyWorldWonders,
    triggerSolve: triggerSolve,
    getRootGroups: getRootGroups
  };
})(window);
