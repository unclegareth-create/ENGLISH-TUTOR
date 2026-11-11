// ============================================================================
// PHRAXOS ATMOSPHERE & ARCHITECTURAL GRANDEUR ENGINE (WAVE 2 REMASTER)
// Classic Browser Script (file:// & https:// compatible, zero ES module syntax)
// Exposes window.PhraxosAtmosphere:
//   - init(ctx)
//   - update(dt, now, ctx)
//   - onLightingChange(mode, ctx)
//   - onAudioToggle(enabled, ctx)
//   - triggerFootstep(surfaceType, ctx)
// ============================================================================
(function () {
  'use strict';

  // Headland centres & walkable radii matching Phraxos world layout
  var HEADLANDS = [
    { cx: 0.0, cz: 8.5, baseR: 16.5, r: 14.8, colR: 13.9, straitNorth: true, straitSouth: false, angles: [-132, -82, 82, 132] },
    { cx: 0.0, cz: -24.0, baseR: 15.0, r: 13.3, colR: 12.4, straitNorth: true, straitSouth: true, angles: [-118, 118] },
    { cx: 0.0, cz: -58.0, baseR: 15.0, r: 13.3, colR: 12.4, straitNorth: true, straitSouth: true, angles: [-138, -112, 112, 138] },
    { cx: 0.0, cz: -92.0, baseR: 15.5, r: 13.8, colR: 12.9, straitNorth: false, straitSouth: true, angles: [-142, -118, 118, 142] }
  ];

  var CAUSEWAY_Z = [-7.5, -41.0, -75.0];

  // Lighting presets: 0 = Aegean Noon, 1 = Firelit Bourani Dusk, 2 = Moonlit Masque
  // Tuned to harmonise cleanly with HDR bloom (threshold > 0.88) without washout
  var ATMOS_LIGHT_MODES = [
    {
      beamDir: [-0.34, 0.76, -0.55],
      shaftHex: 0xfff3c4,
      shaftOpacity: 0.068,
      mistColorA: 0xe0f2fe,
      mistColorB: 0xf8fafc,
      mistOpacity: 0.14,
      moteHex: 0xfef08a,
      moteOpacity: 0.56,
      foamHex: 0xf0f9ff,
      foamOpacity: 0.68
    },
    {
      beamDir: [-0.38, 0.46, -0.80],
      shaftHex: 0xfdba74,
      shaftOpacity: 0.096,
      mistColorA: 0xfed7aa,
      mistColorB: 0xc084fc,
      mistOpacity: 0.21,
      moteHex: 0xfbbf24,
      moteOpacity: 0.74,
      foamHex: 0xffedd5,
      foamOpacity: 0.60
    },
    {
      beamDir: [-0.25, 0.54, -0.80],
      shaftHex: 0x93c5fd,
      shaftOpacity: 0.080,
      mistColorA: 0x7dd3fc,
      mistColorB: 0x1e3a5f,
      mistOpacity: 0.26,
      moteHex: 0x6ee7b7,
      moteOpacity: 0.84,
      foamHex: 0xbae6fd,
      foamOpacity: 0.52
    }
  ];

  // Internal module state
  var savedCtx = null;
  var initialised3D = false;
  var elapsedSec = 0;
  var currentLightingMode = 1;
  var explicitAudioEnabled = null;
  var userGestureSeen = false;

  // 3D Scene References
  var rootGroup = null;
  var viaductGroup = null;
  var foamBatches = [];
  var foamSharedUniforms = null;

  var shaftBatches = [];
  var shaftUniforms = null;
  var currentBeamQuat = null;
  var targetBeamQuat = null;
  var currentShaftColor = null;
  var targetShaftColor = null;
  var currentShaftOpacity = 0.096;
  var targetShaftOpacity = 0.096;

  var mistRibbons = [];
  var mistUniforms = null;
  var currentMistColA = null;
  var targetMistColA = null;
  var currentMistColB = null;
  var targetMistColB = null;
  var currentMistOpacity = 0.21;
  var targetMistOpacity = 0.21;

  var motePoints = null;
  var moteUniforms = null;
  var moteData = [];
  var moteUpdateAccum = 1.0;
  var currentMoteColor = null;
  var targetMoteColor = null;
  var currentMoteOpacity = 0.74;
  var targetMoteOpacity = 0.74;

  var currentFoamColor = null;
  var targetFoamColor = null;
  var currentFoamOpacity = 0.60;
  var targetFoamOpacity = 0.60;

  // Web Audio Soundscape References
  var audioNodes = null;
  var fallbackAudioCtx = null;
  var stepParity = 0;
  var lastFootstepAt = 0;
  var owlCooldown = 9.5;
  var smoothedProximity = 0.55;

  // Passive user-gesture detector so audio never initialises before interaction
  if (typeof window !== 'undefined' && window.addEventListener) {
    var markGesture = function () {
      userGestureSeen = true;
    };
    window.addEventListener('pointerdown', markGesture, { passive: true, once: true });
    window.addEventListener('keydown', markGesture, { passive: true, once: true });
    window.addEventListener('touchstart', markGesture, { passive: true, once: true });
  }

  function getTHREE(ctx) {
    if (ctx && ctx.THREE) return ctx.THREE;
    if (savedCtx && savedCtx.THREE) return savedCtx.THREE;
    if (typeof window !== 'undefined' && window.THREE) return window.THREE;
    return null;
  }

  function isInIntro(ctx) {
    var c = ctx || savedCtx;
    if (!c || c.inIntro === undefined) return false;
    return typeof c.inIntro === 'function' ? !!c.inIntro() : !!c.inIntro;
  }

  function disableRaycastRecursive(obj) {
    if (!obj || !obj.traverse) return;
    var noop = function () {};
    obj.traverse(function (child) {
      if (child && (child.isMesh || child.isPoints || child.isLine)) {
        child.raycast = noop;
      }
    });
  }

  function smoothstepJS(edge0, edge1, x) {
    var t = Math.max(0.0, Math.min(1.0, (x - edge0) / (edge1 - edge0)));
    return t * t * (3.0 - 2.0 * t);
  }

  // Fast static world-space BufferGeometry batcher (collapses hundreds of stone parts into 1 VBO draw call per material)
  function pushBakedPart(bucket, geo, px, py, pz, rx, ry, rz, sx, sy, sz) {
    if (!geo || !geo.attributes || !geo.attributes.position) return;
    bucket.push({
      geo: geo,
      px: px || 0,
      py: py || 0,
      pz: pz || 0,
      rx: rx || 0,
      ry: ry || 0,
      rz: rz || 0,
      sx: sx !== undefined ? sx : 1.0,
      sy: sy !== undefined ? sy : 1.0,
      sz: sz !== undefined ? sz : 1.0
    });
  }

  function buildMergedMaterialMesh(THREE, bucket, material, castShadow, receiveShadow, meshName) {
    if (!bucket || bucket.length === 0) return null;

    var totalVerts = 0;
    for (var i = 0; i < bucket.length; i++) {
      var g0 = bucket[i].geo;
      var p0 = g0.attributes.position;
      var cnt0 = g0.index ? (g0.index.count || g0.index.array.length) : (p0.count || (p0.array ? p0.array.length / 3 : 0));
      totalVerts += cnt0;
    }
    if (totalVerts === 0) return null;

    var outPos = new Float32Array(totalVerts * 3);
    var outNorm = new Float32Array(totalVerts * 3);
    var outUv = new Float32Array(totalVerts * 2);
    var writeVert = 0;

    for (var b = 0; b < bucket.length; b++) {
      var item = bucket[b];
      var g = item.geo;
      var posAttr = g.attributes.position;
      var normAttr = g.attributes.normal || null;
      var uvAttr = g.attributes.uv || null;
      var posArr = posAttr.array || null;
      var normArr = normAttr ? (normAttr.array || null) : null;
      var uvArr = uvAttr ? (uvAttr.array || null) : null;
      var idxArr = g.index ? g.index.array : null;
      var vertCount = idxArr ? idxArr.length : (posAttr.count || (posArr ? posArr.length / 3 : 0));

      var cx = Math.cos(item.rx), sxr = Math.sin(item.rx);
      var cy = Math.cos(item.ry), syr = Math.sin(item.ry);
      var cz = Math.cos(item.rz), szr = Math.sin(item.rz);

      // Intrinsic XYZ Euler rotation matrix matching Three.js Object3D default order
      var r00 = cy * cz;
      var r01 = -cy * szr;
      var r02 = syr;
      var r10 = sxr * syr * cz + cx * szr;
      var r11 = -sxr * syr * szr + cx * cz;
      var r12 = -sxr * cy;
      var r20 = -cx * syr * cz + sxr * szr;
      var r21 = cx * syr * szr + sxr * cz;
      var r22 = cx * cy;

      var scX = item.sx, scY = item.sy, scZ = item.sz;
      var invScX = 1.0 / (scX || 1.0);
      var invScY = 1.0 / (scY || 1.0);
      var invScZ = 1.0 / (scZ || 1.0);
      var tx = item.px, ty = item.py, tz = item.pz;

      for (var k = 0; k < vertCount; k++) {
        var vi = idxArr ? idxArr[k] : k;
        var vi3 = vi * 3;
        var vi2 = vi * 2;

        var vx = posArr ? posArr[vi3] : posAttr.getX(vi);
        var vy = posArr ? posArr[vi3 + 1] : posAttr.getY(vi);
        var vz = posArr ? posArr[vi3 + 2] : posAttr.getZ(vi);

        var svx = vx * scX;
        var svy = vy * scY;
        var svz = vz * scZ;

        var pOut = writeVert * 3;
        outPos[pOut] = tx + r00 * svx + r01 * svy + r02 * svz;
        outPos[pOut + 1] = ty + r10 * svx + r11 * svy + r12 * svz;
        outPos[pOut + 2] = tz + r20 * svx + r21 * svy + r22 * svz;

        var nx = normArr ? normArr[vi3] : (normAttr && normAttr.getX ? normAttr.getX(vi) : 0.0);
        var ny = normArr ? normArr[vi3 + 1] : (normAttr && normAttr.getY ? normAttr.getY(vi) : 1.0);
        var nz = normArr ? normArr[vi3 + 2] : (normAttr && normAttr.getZ ? normAttr.getZ(vi) : 0.0);

        var inx = nx * invScX;
        var iny = ny * invScY;
        var inz = nz * invScZ;

        var wnx = r00 * inx + r01 * iny + r02 * inz;
        var wny = r10 * inx + r11 * iny + r12 * inz;
        var wnz = r20 * inx + r21 * iny + r22 * inz;
        var nLen = Math.hypot(wnx, wny, wnz) || 1.0;

        outNorm[pOut] = wnx / nLen;
        outNorm[pOut + 1] = wny / nLen;
        outNorm[pOut + 2] = wnz / nLen;

        var uOut = writeVert * 2;
        outUv[uOut] = uvArr ? uvArr[vi2] : (uvAttr && uvAttr.getX ? uvAttr.getX(vi) : 0.0);
        outUv[uOut + 1] = uvArr ? uvArr[vi2 + 1] : (uvAttr && uvAttr.getY ? uvAttr.getY(vi) : 0.0);

        writeVert++;
      }
    }

    var mergedGeo = new THREE.BufferGeometry();
    mergedGeo.setAttribute('position', new THREE.Float32BufferAttribute(outPos, 3));
    mergedGeo.setAttribute('normal', new THREE.Float32BufferAttribute(outNorm, 3));
    mergedGeo.setAttribute('uv', new THREE.Float32BufferAttribute(outUv, 2));
    if (typeof mergedGeo.computeBoundingSphere === 'function') mergedGeo.computeBoundingSphere();
    if (typeof mergedGeo.computeBoundingBox === 'function') mergedGeo.computeBoundingBox();

    var mesh = new THREE.Mesh(mergedGeo, material);
    mesh.name = meshName;
    mesh.castShadow = !!castShadow;
    mesh.receiveShadow = !!receiveShadow;
    mesh.raycast = function () {};
    mesh.userData = { phraxosPreBatched: true };
    return mesh;
  }

  // ==========================================================================
  // 1. PROCEDURAL PBR TEXTURES: COURSED ASHLAR MASONRY & MOSSY TIDAL ROCK
  // ==========================================================================
  function buildSobelNormalTexture(THREE, hCanvas, strength, repeatX, repeatY) {
    var size = hCanvas.width;
    var hCtx = hCanvas.getContext('2d');
    var src = hCtx.getImageData(0, 0, size, size).data;

    var normCanvas = document.createElement('canvas');
    normCanvas.width = size;
    normCanvas.height = size;
    var nCtx = normCanvas.getContext('2d');
    var nImg = nCtx.createImageData(size, size);
    var dst = nImg.data;

    var sampleH = function (px, py) {
      var sx = (px + size) % size;
      var sy = (py + size) % size;
      return src[(sy * size + sx) * 4] / 255.0;
    };

    for (var py = 0; py < size; py++) {
      for (var px = 0; px < size; px++) {
        var dx = (sampleH(px + 1, py) - sampleH(px - 1, py)) * strength;
        var dy = (sampleH(px, py + 1) - sampleH(px, py - 1)) * strength;
        var nz = 1.0;
        var invLen = 1.0 / Math.sqrt(dx * dx + dy * dy + nz * nz);
        var idx = (py * size + px) * 4;
        dst[idx] = Math.round((-dx * invLen * 0.5 + 0.5) * 255);
        dst[idx + 1] = Math.round((-dy * invLen * 0.5 + 0.5) * 255);
        dst[idx + 2] = Math.round((nz * invLen * 0.5 + 0.5) * 255);
        dst[idx + 3] = 255;
      }
    }
    nCtx.putImageData(nImg, 0, 0);

    var normalMap = new THREE.CanvasTexture(normCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(repeatX, repeatY);
    return normalMap;
  }

  function createViaductAshlarPBR(THREE) {
    var size = 256;
    var diffCanvas = document.createElement('canvas');
    diffCanvas.width = size;
    diffCanvas.height = size;
    var dCtx = diffCanvas.getContext('2d');

    var hCanvas = document.createElement('canvas');
    hCanvas.width = size;
    hCanvas.height = size;
    var hCtx = hCanvas.getContext('2d');

    // Warm Cycladic Pentelic / travertine stone base
    dCtx.fillStyle = '#ddd5c4';
    dCtx.fillRect(0, 0, size, size);

    hCtx.fillStyle = '#d0d0d0';
    hCtx.fillRect(0, 0, size, size);

    // Fine sedimentary limestone pores & warm sun-baked patina
    for (var i = 0; i < 1200; i++) {
      var gx = (i * 79) % size;
      var gy = (i * 149) % size;
      var gw = 3 + (i % 13);
      var gh = 2 + ((i * 5) % 7);
      dCtx.fillStyle = (i % 3 === 0)
        ? 'rgba(255, 252, 242, 0.16)'
        : (i % 3 === 1 ? 'rgba(88, 76, 60, 0.12)' : 'rgba(148, 132, 106, 0.10)');
      dCtx.fillRect(gx, gy, gw, gh);
      hCtx.fillStyle = (i % 2 === 0) ? 'rgba(235,235,235,0.16)' : 'rgba(155,155,155,0.16)';
      hCtx.fillRect(gx, gy, gw, gh);
    }

    // Rusticated classical ashlar courses with bevelled block margins & deep mortar joints
    var rows = 8;
    var rowH = size / rows;
    for (var r = 0; r < rows; r++) {
      var y0 = Math.round(r * rowH);
      var cols = (r % 2 === 0) ? 3 : 4;
      var colW = size / cols;
      var offset = (r % 2) * (colW * 0.48);

      for (var c = 0; c < cols + 1; c++) {
        var x0 = Math.round((c * colW + offset) % size);
        var bw = Math.round(colW);
        var shade = ((r * 11 + c * 17) % 7) - 3;
        if (shade !== 0) {
          dCtx.fillStyle = shade > 0 ? 'rgba(255, 250, 240, 0.09)' : 'rgba(84, 72, 55, 0.09)';
          dCtx.fillRect(x0 + 3, y0 + 3, Math.max(8, bw - 6), rowH - 6);
        }
        hCtx.fillStyle = 'rgba(246, 246, 246, 0.45)';
        hCtx.fillRect(x0 + 5, y0 + 5, Math.max(6, bw - 10), rowH - 10);

        dCtx.fillStyle = 'rgba(62, 53, 41, 0.48)';
        dCtx.fillRect(x0, y0, 2, rowH);
        dCtx.fillStyle = 'rgba(255, 252, 244, 0.28)';
        dCtx.fillRect(x0 + 2, y0 + 2, 1, rowH - 3);
        hCtx.fillStyle = '#424242';
        hCtx.fillRect(x0, y0, 3, rowH);
      }

      dCtx.fillStyle = 'rgba(58, 49, 38, 0.52)';
      dCtx.fillRect(0, y0, size, 2);
      dCtx.fillStyle = 'rgba(255, 252, 244, 0.30)';
      dCtx.fillRect(0, y0 + 2, size, 1);
      hCtx.fillStyle = '#3c3c3c';
      hCtx.fillRect(0, y0, size, 3);
    }

    var map = new THREE.CanvasTexture(diffCanvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(0.55, 0.55);
    if (THREE.sRGBEncoding) map.encoding = THREE.sRGBEncoding;

    var normalMap = buildSobelNormalTexture(THREE, hCanvas, 2.6, 0.55, 0.55);
    return { map: map, normalMap: normalMap };
  }

  function createMossyTidalRockPBR(THREE) {
    var size = 256;
    var diffCanvas = document.createElement('canvas');
    diffCanvas.width = size;
    diffCanvas.height = size;
    var dCtx = diffCanvas.getContext('2d');

    var hCanvas = document.createElement('canvas');
    hCanvas.width = size;
    hCanvas.height = size;
    var hCtx = hCanvas.getContext('2d');

    dCtx.fillStyle = '#686d5f';
    dCtx.fillRect(0, 0, size, size);
    hCtx.fillStyle = '#808080';
    hCtx.fillRect(0, 0, size, size);

    for (var i = 0; i < 900; i++) {
      var rx = (i * 97) % size;
      var ry = (i * 163) % size;
      var rw = 6 + (i % 20);
      var rh = 4 + ((i * 7) % 14);
      if (i % 4 === 0) {
        dCtx.fillStyle = (i % 8 === 0) ? 'rgba(68, 102, 56, 0.42)' : 'rgba(92, 122, 64, 0.34)';
        hCtx.fillStyle = 'rgba(215, 215, 215, 0.35)';
      } else if (i % 4 === 1) {
        dCtx.fillStyle = 'rgba(38, 44, 42, 0.34)';
        hCtx.fillStyle = 'rgba(42, 42, 42, 0.42)';
      } else if (i % 4 === 2) {
        dCtx.fillStyle = 'rgba(158, 150, 132, 0.28)';
        hCtx.fillStyle = 'rgba(175, 175, 175, 0.25)';
      } else {
        dCtx.fillStyle = 'rgba(220, 216, 202, 0.18)';
        hCtx.fillStyle = 'rgba(235, 235, 235, 0.22)';
      }
      dCtx.beginPath();
      dCtx.ellipse(rx, ry, rw * 0.5, rh * 0.5, (i % 6) * 0.5, 0, Math.PI * 2);
      dCtx.fill();

      hCtx.beginPath();
      hCtx.ellipse(rx, ry, rw * 0.5, rh * 0.5, (i % 6) * 0.5, 0, Math.PI * 2);
      hCtx.fill();
    }

    var map = new THREE.CanvasTexture(diffCanvas);
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(1.4, 1.4);
    if (THREE.sRGBEncoding) map.encoding = THREE.sRGBEncoding;

    var normalMap = buildSobelNormalTexture(THREE, hCanvas, 2.8, 1.4, 1.4);
    return { map: map, normalMap: normalMap };
  }

  // Low-profile tidal reef ledge geometry nestled around pier bases at the waterline
  function buildMossyKarstGeometry(THREE, radius, seed) {
    var geo = new THREE.IcosahedronGeometry(radius, 1);
    var pos = geo.attributes.position;
    for (var i = 0; i < pos.count; i++) {
      var vx = pos.getX(i);
      var vy = pos.getY(i);
      var vz = pos.getZ(i);
      var len = Math.hypot(vx, vy, vz) || 1.0;
      var nx = vx / len;
      var ny = vy / len;
      var nz = vz / len;

      var strata = Math.sin(ny * 6.2 + seed * 1.7) * 0.12;
      var crag = Math.sin(nx * 4.1 + seed) * Math.cos(nz * 3.9 - seed * 0.8) * 0.20;
      var scale = 1.0 + strata + crag;

      vx *= scale * 1.28;
      vz *= scale * 1.22;
      if (vy < 0) {
        vy *= 0.95;
      } else {
        vy *= 0.46 * scale; // Low coastal reef shelf so it never blocks the arch opening
      }
      pos.setXYZ(i, vx, vy, vz);
    }
    geo.computeVertexNormals();
    return geo;
  }

  // Build a true radial wedge-shaped bevelled stone voussoir block
  function buildBevelledVoussoirGeometry(THREE, innerHalfW, outerHalfW, radialH, depthX) {
    var sh = new THREE.Shape();
    sh.moveTo(-innerHalfW, -radialH * 0.5);
    sh.lineTo(innerHalfW, -radialH * 0.5);
    sh.lineTo(outerHalfW, radialH * 0.5);
    sh.lineTo(-outerHalfW, radialH * 0.5);
    sh.closePath();

    var geo = new THREE.ExtrudeGeometry(sh, {
      depth: depthX,
      bevelEnabled: true,
      bevelThickness: 0.018,
      bevelSize: 0.016,
      bevelSegments: 1
    });
    geo.translate(0, 0, -depthX * 0.5);
    geo.rotateY(Math.PI * 0.5);
    geo.computeVertexNormals();
    return geo;
  }

  // ==========================================================================
  // 2. MONUMENTAL CAUSEWAY SEA-ARCHES, VOUSSOIRS, KEYSTONES & MOSSY FOOTINGS
  // ==========================================================================
  function buildCausewayViaducts(THREE, parent) {
    viaductGroup = new THREE.Group();
    viaductGroup.name = 'PhraxosCausewayViaducts';
    parent.add(viaductGroup);

    var ashlarPBR = createViaductAshlarPBR(THREE);
    var mossyPBR = createMossyTidalRockPBR(THREE);

    var matSpandrelAshlar = new THREE.MeshStandardMaterial({
      map: ashlarPBR.map,
      normalMap: ashlarPBR.normalMap,
      normalScale: new THREE.Vector2(0.95, 0.95),
      color: 0xeae2d0,
      roughness: 0.62,
      metalness: 0.04
    });

    var matVoussoirStone = new THREE.MeshStandardMaterial({
      map: ashlarPBR.map,
      normalMap: ashlarPBR.normalMap,
      normalScale: new THREE.Vector2(0.75, 0.75),
      color: 0xf7f2e7,
      roughness: 0.46,
      metalness: 0.05
    });

    var matTerracottaTrim = new THREE.MeshStandardMaterial({
      map: ashlarPBR.map,
      normalMap: ashlarPBR.normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      color: 0xc25b3f,
      roughness: 0.56,
      metalness: 0.05
    });

    var matMossyFooting = new THREE.MeshStandardMaterial({
      map: mossyPBR.map,
      normalMap: mossyPBR.normalMap,
      normalScale: new THREE.Vector2(1.1, 1.1),
      color: 0x848d77,
      roughness: 0.84,
      metalness: 0.03
    });

    var matBronzeRelief = new THREE.MeshStandardMaterial({
      color: 0xc8933c,
      roughness: 0.32,
      metalness: 0.80
    });

    // Fast 2-octave procedural sea-foam ShaderMaterial (shared across all 3 viaducts, GPU wave-synced, pow()-free!)
    var initPreset = ATMOS_LIGHT_MODES[currentLightingMode] || ATMOS_LIGHT_MODES[1];
    currentFoamColor = new THREE.Color(initPreset.foamHex);
    targetFoamColor = currentFoamColor.clone();
    currentFoamOpacity = initPreset.foamOpacity;
    targetFoamOpacity = currentFoamOpacity;

    foamSharedUniforms = {
      uTime: { value: 0 },
      uWaveTime: { value: 0 },
      uWaveScale: { value: 1.0 },
      uColor: { value: currentFoamColor.clone() },
      uOpacity: { value: currentFoamOpacity }
    };

    var foamShaderMat = new THREE.ShaderMaterial({
      uniforms: foamSharedUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: [
        'attribute vec4 aPierMeta;',
        'uniform float uWaveTime;',
        'uniform float uWaveScale;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'varying float vPhase;',
        'void main() {',
        '  vUv = uv;',
        '  vPhase = aPierMeta.w;',
        '  float wx = aPierMeta.x;',
        '  float wz = aPierMeta.z + 26.0;',
        '  float w1 = sin(wx * 0.18 + wz * 0.12 + uWaveTime * 1.25) * 0.18;',
        '  float w2 = cos(wx * 0.42 - wz * 0.35 + uWaveTime * 1.7) * 0.08;',
        '  float w3 = sin(wx * 0.95 + wz * 0.82 + uWaveTime * 2.5) * 0.035;',
        '  float waveElev = (w1 + w2 + w3) * uWaveScale;',
        '  float swellScale = 1.0 + 0.055 * sin(uWaveTime * 1.3 + vPhase) - waveElev * 0.12;',
        '  vec3 wp = vec3(',
        '    aPierMeta.x + position.x * swellScale,',
        '    aPierMeta.y + waveElev,',
        '    aPierMeta.z + position.z * swellScale',
        '  );',
        '  vWorldPos = wp;',
        '  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'varying float vPhase;',
        'float hash(vec2 p) {',
        '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
        '}',
        'float vnoise(vec2 p) {',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),',
        '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
        '}',
        'float fbm2(vec2 p) {',
        '  float v = 0.6667 * vnoise(p);',
        '  p = p * 2.07 + vec2(1.7, 9.2);',
        '  return v + 0.3333 * vnoise(p);',
        '}',
        'void main() {',
        '  vec2 c = (vUv - 0.5) * 2.0;',
        '  float r = length(c);',
        '  if (r > 0.99) discard;',
        '  float ux = clamp(vUv.x, 0.0, 1.0);',
        '  float uy = clamp(vUv.y, 0.0, 1.0);',
        '  float bx = clamp(4.0 * ux * (1.0 - ux), 0.0, 1.0);',
        '  float by = clamp(4.0 * uy * (1.0 - uy), 0.0, 1.0);',
        '  float quadMask = bx * bx * by * by;',
        '  float breath = 0.045 * sin(uTime * 1.45 + vPhase);',
        '  float ringBand = smoothstep(0.18, 0.46, r + breath) * (1.0 - smoothstep(0.56, 0.96, r + breath));',
        '  if (ringBand * quadMask < 0.002) discard;',
        '  vec2 swirl = 0.24 * vec2(sin(c.y * 3.8 + uTime * 0.32 + vPhase), cos(c.x * 3.8 - uTime * 0.27 - vPhase));',
        '  float lace = fbm2(c * 4.8 + swirl - vec2(uTime * 0.14, 0.0));',
        '  float ripples = 0.5 + 0.5 * sin((r - uTime * 0.22) * 22.0 + lace * 4.2 + vPhase);',
        '  float foamAlpha = ringBand * quadMask * smoothstep(0.28, 0.78, lace * 0.78 + ripples * 0.28);',
        '  float distFade = 1.0 - smoothstep(50.0, 65.0, length(cameraPosition - vWorldPos));',
        '  float finalA = clamp(foamAlpha * uOpacity * distFade, 0.0, 1.0);',
        '  if (finalA < 0.0004) discard;',
        '  gl_FragColor = vec4(uColor, finalA);',
        '}'
      ].join('\n')
    });

    // Helper to build an open through-vaulted classical segmental spandrel barrel
    var buildOpenArchSpandrelGeo = function (dxSpan, halfBlockZ) {
      var ySpring = -0.58;
      var yCrown = 0.38;
      var rise = yCrown - ySpring;
      var archR = (rise * rise + dxSpan * dxSpan) / (2.0 * rise);
      var archCenterY = yCrown - archR;
      var angRight = Math.atan2(ySpring - archCenterY, dxSpan);
      var angLeft = Math.PI - angRight;

      var spShape = new THREE.Shape();
      spShape.moveTo(-halfBlockZ, ySpring);
      spShape.lineTo(-dxSpan, ySpring);
      spShape.absarc(0.0, archCenterY, archR, angLeft, angRight, true);
      spShape.lineTo(halfBlockZ, ySpring);
      spShape.lineTo(halfBlockZ, 0.50);
      spShape.lineTo(-halfBlockZ, 0.50);
      spShape.closePath();

      var geo = new THREE.ExtrudeGeometry(spShape, {
        depth: 4.16,
        bevelEnabled: false,
        curveSegments: 20
      });
      geo.translate(0, 0, -2.08);
      geo.rotateY(Math.PI * 0.5);
      geo.computeVertexNormals();

      return {
        geo: geo,
        archR: archR,
        archCenterY: archCenterY,
        angRight: angRight,
        yCrown: yCrown
      };
    };

    var VIADUCT_SPECS = [
      {
        zCenter: -7.5,
        arches: [{ az: -1.01, dxSpan: 1.30, halfBlockZ: 1.66 }],
        piers: [-2.62, 0.60],
        abutments: [
          { cz: -4.88, len: 3.94 },
          { cz: 3.88, len: 5.94 }
        ]
      },
      {
        zCenter: -41.0,
        arches: [
          { az: -1.62, dxSpan: 1.28, halfBlockZ: 1.62 },
          { az: 1.62, dxSpan: 1.28, halfBlockZ: 1.62 }
        ],
        piers: [-3.22, 0.00, 3.22],
        abutments: [
          { cz: -5.18, len: 3.34 },
          { cz: 5.18, len: 3.34 }
        ]
      },
      {
        zCenter: -75.0,
        arches: [
          { az: -1.22, dxSpan: 1.16, halfBlockZ: 1.48 },
          { az: 1.74, dxSpan: 1.16, halfBlockZ: 1.48 }
        ],
        piers: [-2.70, 0.26, 3.22],
        abutments: [
          { cz: -4.92, len: 3.86 },
          { cz: 5.18, len: 3.34 }
        ]
      }
    ];

    // Source stonework primitives (disposed immediately after baking into merged VBOs)
    var tempGeos = [];
    var trackGeo = function (g) {
      tempGeos.push(g);
      return g;
    };

    var voussoirGeo = trackGeo(buildBevelledVoussoirGeometry(THREE, 0.098, 0.126, 0.26, 0.14));
    var keystoneGeo = trackGeo(buildBevelledVoussoirGeometry(THREE, 0.132, 0.178, 0.36, 0.20));
    var keystoneScrollGeo = trackGeo(new THREE.BoxGeometry(0.24, 0.10, 0.28));
    var rosetteRingGeo = trackGeo(new THREE.TorusGeometry(0.16, 0.028, 6, 12));
    var rosetteBossGeo = trackGeo(new THREE.SphereGeometry(0.075, 6, 6));

    var corniceTopGeo = trackGeo(new THREE.BoxGeometry(4.36, 0.08, 13.76));
    var corniceFriezeGeo = trackGeo(new THREE.BoxGeometry(4.24, 0.07, 13.72));
    var dentilGeo = trackGeo(new THREE.BoxGeometry(4.30, 0.055, 0.17));

    var pierCoreGeo = trackGeo(new THREE.BoxGeometry(4.18, 2.26, 0.68));
    var pierSubBaseGeo = trackGeo(new THREE.BoxGeometry(4.56, 0.50, 1.06));
    var batteredButtressGeo = trackGeo(new THREE.CylinderGeometry(0.32, 0.46, 2.20, 4));
    var pierCapitalGeo = trackGeo(new THREE.BoxGeometry(0.56, 0.10, 0.68));
    var cutwaterPrismGeo = trackGeo(new THREE.CylinderGeometry(0.26, 0.40, 1.92, 4));
    var cutwaterHoodGeo = trackGeo(new THREE.ConeGeometry(0.28, 0.28, 4));

    // Material buckets across all 3 viaducts (merges ~380 meshes -> 5 static VBO meshes!)
    var bucketSpandrel = [];
    var bucketVoussoir = [];
    var bucketTerracotta = [];
    var bucketMossy = [];
    var bucketBronze = [];
    foamBatches = [];

    for (var vIdx = 0; vIdx < VIADUCT_SPECS.length; vIdx++) {
      var spec = VIADUCT_SPECS[vIdx];
      var zCenter = spec.zCenter;
      var isTerra = (vIdx === 1);
      var accentBucket = isTerra ? bucketTerracotta : bucketVoussoir;

      // Moulded cornice & dentil stringcourse
      pushBakedPart(accentBucket, corniceTopGeo, 0, 0.545, zCenter, 0, 0, 0, 1, 1, 1);
      pushBakedPart(bucketSpandrel, corniceFriezeGeo, 0, 0.47, zCenter, 0, 0, 0, 1, 1, 1);

      for (var d = -13; d <= 13; d++) {
        pushBakedPart(bucketVoussoir, dentilGeo, 0, 0.435, zCenter + d * 0.48, 0, 0, 0, 1, 1, 1);
      }

      // Open through-vaulted sea-arches over the Aegean channel
      for (var a = 0; a < spec.arches.length; a++) {
        var archDef = spec.arches[a];
        var az = archDef.az;
        var builtArch = buildOpenArchSpandrelGeo(archDef.dxSpan, archDef.halfBlockZ);
        trackGeo(builtArch.geo);

        pushBakedPart(bucketSpandrel, builtArch.geo, 0, 0, zCenter + az, 0, 0, 0, 1, 1, 1);

        var totalHalfSweep = Math.PI * 0.5 - builtArch.angRight;
        for (var side = -1; side <= 1; side += 2) {
          var faceX = side * 2.10;
          for (var v = -6; v <= 6; v++) {
            var frac = v / 6.35;
            var theta = Math.PI * 0.5 - frac * totalHalfSweep;
            var isKey = (v === 0);
            var rMid = builtArch.archR + (isKey ? 0.14 : 0.115);
            var vz = zCenter + az + Math.cos(theta) * rMid;
            var vy = builtArch.archCenterY + Math.sin(theta) * rMid;

            pushBakedPart(
              isKey ? accentBucket : bucketVoussoir,
              isKey ? keystoneGeo : voussoirGeo,
              faceX + (isKey ? side * 0.035 : 0),
              vy,
              vz,
              -(theta - Math.PI * 0.5),
              0,
              0,
              1,
              1,
              1
            );

            if (isKey) {
              pushBakedPart(bucketVoussoir, keystoneScrollGeo, faceX + side * 0.045, builtArch.yCrown + 0.12, zCenter + az, 0, 0, 0, 1, 1, 1);
              pushBakedPart(bucketBronze, rosetteBossGeo, faceX + side * 0.12, vy + 0.015, zCenter + az, 0, 0, 0, 0.55, 1.0, 1.0);
            }
          }
        }
      }

      // Monumental battered sea-piers, cutwaters & waterline footings + 1 merged sea-foam mesh per viaduct
      var nPiers = spec.piers.length;
      var foamPos = new Float32Array(nPiers * 6 * 3);
      var foamUv = new Float32Array(nPiers * 6 * 2);
      var foamMeta = new Float32Array(nPiers * 6 * 4);
      var fHw = 2.90;
      var fHz = 1.175;
      var quadCorners = [
        [-fHw, -fHz, 0.0, 1.0],
        [-fHw, fHz, 0.0, 0.0],
        [fHw, -fHz, 1.0, 1.0],
        [-fHw, fHz, 0.0, 0.0],
        [fHw, fHz, 1.0, 0.0],
        [fHw, -fHz, 1.0, 1.0]
      ];

      for (var p = 0; p < nPiers; p++) {
        var pz = spec.piers[p];
        var worldPz = zCenter + pz;

        pushBakedPart(bucketSpandrel, pierCoreGeo, 0, -0.60, worldPz, 0, 0, 0, 1, 1, 1);
        pushBakedPart(bucketMossy, pierSubBaseGeo, 0, -1.52, worldPz, 0, 0, 0, 1, 1, 1);

        for (var sx = -1; sx <= 1; sx += 2) {
          pushBakedPart(bucketSpandrel, batteredButtressGeo, sx * 2.12, -0.58, worldPz, 0, Math.PI * 0.25, 0, 0.76, 1.0, 0.92);
          pushBakedPart(accentBucket, pierCapitalGeo, sx * 2.14, 0.52, worldPz, 0, 0, 0, 1, 1, 1);
          pushBakedPart(bucketVoussoir, rosetteRingGeo, sx * 2.28, 0.33, worldPz, 0, Math.PI * 0.5, 0, 1, 1, 1);
          pushBakedPart(bucketBronze, rosetteBossGeo, sx * 2.30, 0.33, worldPz, 0, 0, 0, 0.45, 0.85, 0.85);
          pushBakedPart(bucketMossy, cutwaterPrismGeo, sx * 2.34, -0.80, worldPz, 0, Math.PI * 0.25, 0, 0.84, 1.0, 1.02);
          pushBakedPart(bucketVoussoir, cutwaterHoodGeo, sx * 2.32, 0.28, worldPz, 0, Math.PI * 0.25, 0, 0.84, 1.0, 1.02);

          var rockSeed = vIdx * 13.7 + p * 5.3 + (sx > 0 ? 2.1 : 0.4);
          var fRockGeo = trackGeo(buildMossyKarstGeometry(THREE, 0.36, rockSeed));
          pushBakedPart(bucketMossy, fRockGeo, sx * 2.38, -0.48, worldPz, 0, rockSeed, 0, 1, 1, 1);
        }

        var phaseVal = vIdx * 2.1 + p * 1.7;
        for (var qc = 0; qc < 6; qc++) {
          var vIndex = p * 6 + qc;
          var corner = quadCorners[qc];
          foamPos[vIndex * 3] = corner[0];
          foamPos[vIndex * 3 + 1] = 0.0;
          foamPos[vIndex * 3 + 2] = corner[1];
          foamUv[vIndex * 2] = corner[2];
          foamUv[vIndex * 2 + 1] = corner[3];
          foamMeta[vIndex * 4] = 0.0;
          foamMeta[vIndex * 4 + 1] = -0.345;
          foamMeta[vIndex * 4 + 2] = worldPz;
          foamMeta[vIndex * 4 + 3] = phaseVal;
        }
      }

      var vFoamGeo = new THREE.BufferGeometry();
      vFoamGeo.setAttribute('position', new THREE.Float32BufferAttribute(foamPos, 3));
      vFoamGeo.setAttribute('uv', new THREE.Float32BufferAttribute(foamUv, 2));
      vFoamGeo.setAttribute('aPierMeta', new THREE.Float32BufferAttribute(foamMeta, 4));
      var vFoamMesh = new THREE.Mesh(vFoamGeo, foamShaderMat);
      vFoamMesh.name = 'PhraxosViaductFoam_' + vIdx;
      vFoamMesh.frustumCulled = false;
      vFoamMesh.renderOrder = 2;
      vFoamMesh.raycast = function () {};
      viaductGroup.add(vFoamMesh);
      foamBatches.push({ mesh: vFoamMesh, anchorZ: zCenter });

      // Flanking ashlar headland abutments
      for (var e = 0; e < spec.abutments.length; e++) {
        var ab = spec.abutments[e];
        var abGeo = trackGeo(new THREE.BoxGeometry(4.14, 0.88, ab.len));
        pushBakedPart(bucketSpandrel, abGeo, 0, 0.06, zCenter + ab.cz, 0, 0, 0, 1, 1, 1);
      }
    }

    // Emit 1 merged BufferGeometry per material; castShadow = true ONLY on structural spandrel/pier mass!
    var mSpandrel = buildMergedMaterialMesh(THREE, bucketSpandrel, matSpandrelAshlar, true, true, 'PhraxosViaducts_SpandrelAshlar');
    var mVoussoir = buildMergedMaterialMesh(THREE, bucketVoussoir, matVoussoirStone, false, true, 'PhraxosViaducts_VoussoirStone');
    var mTerra = buildMergedMaterialMesh(THREE, bucketTerracotta, matTerracottaTrim, false, true, 'PhraxosViaducts_TerracottaTrim');
    var mMossy = buildMergedMaterialMesh(THREE, bucketMossy, matMossyFooting, false, true, 'PhraxosViaducts_MossyFootings');
    var mBronze = buildMergedMaterialMesh(THREE, bucketBronze, matBronzeRelief, false, true, 'PhraxosViaducts_BronzeReliefs');

    if (mSpandrel) viaductGroup.add(mSpandrel);
    if (mVoussoir) viaductGroup.add(mVoussoir);
    if (mTerra) viaductGroup.add(mTerra);
    if (mMossy) viaductGroup.add(mMossy);
    if (mBronze) viaductGroup.add(mBronze);

    for (var tg = 0; tg < tempGeos.length; tg++) {
      if (tempGeos[tg] && typeof tempGeos[tg].dispose === 'function') {
        tempGeos[tg].dispose();
      }
    }

    disableRaycastRecursive(viaductGroup);
  }

  // ==========================================================================
  // 3. BATCHED VOLUMETRIC SUN / MOONLIGHT SHAFTS (4 HEADLAND BATCHES, 65m CULL)
  // ==========================================================================
  function buildVolumetricLightShafts(THREE, parent) {
    var shaftsGroup = new THREE.Group();
    shaftsGroup.name = 'PhraxosLightShafts';
    parent.add(shaftsGroup);

    var modePreset = ATMOS_LIGHT_MODES[currentLightingMode] || ATMOS_LIGHT_MODES[1];
    currentShaftColor = new THREE.Color(modePreset.shaftHex);
    targetShaftColor = currentShaftColor.clone();
    currentShaftOpacity = modePreset.shaftOpacity;
    targetShaftOpacity = modePreset.shaftOpacity;

    var initDir = new THREE.Vector3(
      modePreset.beamDir[0],
      modePreset.beamDir[1],
      modePreset.beamDir[2]
    ).normalize();
    currentBeamQuat = new THREE.Quaternion(initDir.z, 0, -initDir.x, 1.0 + initDir.y).normalize();
    targetBeamQuat = currentBeamQuat.clone();

    var beamQuatUniform = THREE.Vector4
      ? new THREE.Vector4(currentBeamQuat.x, currentBeamQuat.y, currentBeamQuat.z, currentBeamQuat.w)
      : { x: currentBeamQuat.x, y: currentBeamQuat.y, z: currentBeamQuat.z, w: currentBeamQuat.w, set: function (x, y, z, w) { this.x = x; this.y = y; this.z = z; this.w = w; } };

    shaftUniforms = {
      uTime: { value: 0 },
      uColor: { value: currentShaftColor.clone() },
      uOpacity: { value: currentShaftOpacity },
      uBeamQuat: { value: beamQuatUniform }
    };

    var shaftMat = new THREE.ShaderMaterial({
      uniforms: shaftUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      vertexShader: [
        'attribute vec3 aAnchor;',
        'uniform vec4 uBeamQuat;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'varying vec3 vWorldNormal;',
        'vec3 quatRot(vec4 q, vec3 v) {',
        '  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);',
        '}',
        'void main() {',
        '  vUv = uv;',
        '  vec3 wp = aAnchor + quatRot(uBeamQuat, position);',
        '  vWorldPos = wp;',
        '  vWorldNormal = quatRot(uBeamQuat, normal);',
        '  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'varying vec3 vWorldNormal;',
        'void main() {',
        '  float ux = clamp(vUv.x, 0.0, 1.0);',
        '  float uy = clamp(vUv.y, 0.0, 1.0);',
        '  float bx = clamp(4.0 * ux * (1.0 - ux), 0.0, 1.0);',
        '  float dx = (ux - 0.5) * 2.85;',
        '  float horizFade = bx * bx * exp(-dx * dx);',
        '  float by = clamp(4.0 * uy * (1.0 - uy), 0.0, 1.0);',
        '  float vertFade = by * by * smoothstep(0.0, 0.28, uy) * smoothstep(1.0, 0.46, uy);',
        '  vec3 toCam = cameraPosition - vWorldPos;',
        '  float camDist = length(toCam);',
        '  vec3 viewDir = toCam / max(camDist, 0.001);',
        '  vec3 wn = vWorldNormal / max(length(vWorldNormal), 0.001);',
        '  float ndv = clamp(abs(dot(wn, viewDir)), 0.0, 1.0);',
        '  float grazingFade = ndv * ndv * (3.0 - 2.0 * ndv);',
        '  float nearFade = smoothstep(2.4, 7.0, camDist) * (1.0 - smoothstep(50.0, 65.0, camDist));',
        '  float dustWave = 0.86 + 0.14 * sin(ux * 9.42 + uTime * 0.38 + vWorldPos.z * 0.15)',
        '                        * cos(uy * 6.28 - uTime * 0.24 + vWorldPos.x * 0.12);',
        '  float alpha = clamp(horizFade * vertFade * grazingFade * nearFade * dustWave * uOpacity, 0.0, 1.0);',
        '  if (alpha < 0.0004) discard;',
        '  gl_FragColor = vec4(uColor, alpha);',
        '}'
      ].join('\n')
    });

    var shaftLen = 15.6;
    var segY = 4;
    var starAngles = [0.0, Math.PI / 3.0, (2.0 * Math.PI) / 3.0];
    shaftBatches = [];

    var buildShaftBatchMesh = function (anchors, centerZ, idx) {
      var vertsPerAnchor = starAngles.length * segY * 6;
      var totalV = anchors.length * vertsPerAnchor;
      var posArr = new Float32Array(totalV * 3);
      var normArr = new Float32Array(totalV * 3);
      var uvArr = new Float32Array(totalV * 2);
      var ancArr = new Float32Array(totalV * 3);
      var w = 0;

      var emitVert = function (px, py, pz, nx, ny, nz, u, v, ax, ay, az) {
        posArr[w * 3] = px;
        posArr[w * 3 + 1] = py;
        posArr[w * 3 + 2] = pz;
        normArr[w * 3] = nx;
        normArr[w * 3 + 1] = ny;
        normArr[w * 3 + 2] = nz;
        uvArr[w * 2] = u;
        uvArr[w * 2 + 1] = v;
        ancArr[w * 3] = ax;
        ancArr[w * 3 + 1] = ay;
        ancArr[w * 3 + 2] = az;
        w++;
      };

      for (var a = 0; a < anchors.length; a++) {
        var an = anchors[a];
        for (var p = 0; p < starAngles.length; p++) {
          var ang = starAngles[p];
          var ca = Math.cos(ang);
          var sa = Math.sin(ang);
          for (var iy = 0; iy < segY; iy++) {
            var v0 = iy / segY;
            var v1 = (iy + 1) / segY;
            var y0 = v0 * shaftLen;
            var y1 = v1 * shaftLen;
            var hw0 = 2.1 * (1.26 - 0.50 * v0) * an.ws;
            var hw1 = 2.1 * (1.26 - 0.50 * v1) * an.ws;

            emitVert(-hw0 * ca, y0, hw0 * sa, sa, 0, ca, 0.0, v0, an.x, an.y, an.z);
            emitVert(hw0 * ca, y0, -hw0 * sa, sa, 0, ca, 1.0, v0, an.x, an.y, an.z);
            emitVert(-hw1 * ca, y1, hw1 * sa, sa, 0, ca, 0.0, v1, an.x, an.y, an.z);

            emitVert(hw0 * ca, y0, -hw0 * sa, sa, 0, ca, 1.0, v0, an.x, an.y, an.z);
            emitVert(hw1 * ca, y1, -hw1 * sa, sa, 0, ca, 1.0, v1, an.x, an.y, an.z);
            emitVert(-hw1 * ca, y1, hw1 * sa, sa, 0, ca, 0.0, v1, an.x, an.y, an.z);
          }
        }
      }

      var bGeo = new THREE.BufferGeometry();
      bGeo.setAttribute('position', new THREE.Float32BufferAttribute(posArr, 3));
      bGeo.setAttribute('normal', new THREE.Float32BufferAttribute(normArr, 3));
      bGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvArr, 2));
      bGeo.setAttribute('aAnchor', new THREE.Float32BufferAttribute(ancArr, 3));

      var bMesh = new THREE.Mesh(bGeo, shaftMat);
      bMesh.name = 'PhraxosLightShaftBatch_' + idx;
      bMesh.frustumCulled = false;
      bMesh.renderOrder = 4;
      bMesh.raycast = function () {};
      shaftsGroup.add(bMesh);
      shaftBatches.push({ mesh: bMesh, anchorZ: centerZ });
    };

    for (var h = 0; h < HEADLANDS.length; h++) {
      var hl = HEADLANDS[h];
      var hlAnchors = [];
      for (var k = 0; k < hl.angles.length; k++) {
        var rad = (hl.angles[k] * Math.PI) / 180.0;
        var sx = hl.cx + Math.sin(rad) * (hl.colR - 1.5);
        var sz = hl.cz + Math.cos(rad) * (hl.colR - 1.5);
        hlAnchors.push({ x: sx, y: -0.25, z: sz, ws: 1.05 + (k % 2) * 0.18 });
      }
      if (h === 0) {
        hlAnchors.push({ x: 0.0, y: -0.15, z: 3.8, ws: 1.36 });
        hlAnchors.push({ x: -3.8, y: -0.05, z: 13.6, ws: 1.18 });
      }
      buildShaftBatchMesh(hlAnchors, hl.cz, h);
    }

    disableRaycastRecursive(shaftsGroup);
  }

  // ==========================================================================
  // 4. FAST 2-OCTAVE COVE SEA-MIST RIBBONS (65m CULL) & 30Hz POLLEN/FIREFLIES
  // ==========================================================================
  function buildCoveMistAndMotes(THREE, parent) {
    var mistGroup = new THREE.Group();
    mistGroup.name = 'PhraxosCoveMist';
    parent.add(mistGroup);

    var preset = ATMOS_LIGHT_MODES[currentLightingMode] || ATMOS_LIGHT_MODES[1];
    currentMistColA = new THREE.Color(preset.mistColorA);
    targetMistColA = currentMistColA.clone();
    currentMistColB = new THREE.Color(preset.mistColorB);
    targetMistColB = currentMistColB.clone();
    currentMistOpacity = preset.mistOpacity;
    targetMistOpacity = preset.mistOpacity;

    mistUniforms = {
      uTime: { value: 0 },
      uColorA: { value: currentMistColA.clone() },
      uColorB: { value: currentMistColB.clone() },
      uOpacity: { value: currentMistOpacity }
    };

    // Lightweight 2-octave sea-mist shader (cuts transparent overdraw ALU by >80%, pow()-free!)
    var mistShaderMat = new THREE.ShaderMaterial({
      uniforms: mistUniforms,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      vertexShader: [
        'uniform float uTime;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'void main() {',
        '  vUv = uv;',
        '  vec3 pos = position;',
        '  pos.y += sin(pos.x * 0.24 + uTime * 0.38) * 0.06 + cos(pos.z * 0.31 - uTime * 0.29) * 0.05;',
        '  pos.z += sin(pos.x * 0.18 + uTime * 0.28) * 0.24;',
        '  vec4 wp = modelMatrix * vec4(pos, 1.0);',
        '  vWorldPos = wp.xyz;',
        '  gl_Position = projectionMatrix * viewMatrix * wp;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform float uTime;',
        'uniform vec3 uColorA;',
        'uniform vec3 uColorB;',
        'uniform float uOpacity;',
        'varying vec2 vUv;',
        'varying vec3 vWorldPos;',
        'float hash(vec2 p) {',
        '  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);',
        '}',
        'float vnoise(vec2 p) {',
        '  vec2 i = floor(p);',
        '  vec2 f = fract(p);',
        '  f = f * f * (3.0 - 2.0 * f);',
        '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),',
        '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
        '}',
        'float fbm2(vec2 p) {',
        '  float v = 0.6667 * vnoise(p);',
        '  p = p * 2.03 + vec2(3.1, 5.7);',
        '  return v + 0.3333 * vnoise(p);',
        '}',
        'void main() {',
        '  float ux = clamp(vUv.x, 0.0, 1.0);',
        '  float uy = clamp(vUv.y, 0.0, 1.0);',
        '  float bx = clamp(4.0 * ux * (1.0 - ux), 0.0, 1.0);',
        '  float by = clamp(4.0 * uy * (1.0 - uy), 0.0, 1.0);',
        '  float env = bx * bx * by * by;',
        '  if (env < 0.002) discard;',
        '  vec2 baseP = vUv * vec2(3.2, 2.0) + vec2(uTime * 0.026, -uTime * 0.014);',
        '  vec2 flow = 0.32 * vec2(sin(baseP.y * 2.2 + uTime * 0.14), cos(baseP.x * 1.9 - uTime * 0.11));',
        '  float billow = fbm2(baseP + flow);',
        '  float wisp = smoothstep(0.26, 0.78, billow) * env;',
        '  float camDist = length(cameraPosition - vWorldPos);',
        '  float nearFade = smoothstep(2.6, 8.8, camDist) * (1.0 - smoothstep(50.0, 65.0, camDist));',
        '  vec3 col = mix(uColorB, uColorA, smoothstep(0.28, 0.76, billow));',
        '  float finalA = clamp(wisp * nearFade * uOpacity, 0.0, 1.0);',
        '  if (finalA < 0.0004) discard;',
        '  gl_FragColor = vec4(col, finalA);',
        '}'
      ].join('\n')
    });

    var ribbonGeo = new THREE.PlaneGeometry(24.0, 12.5, 10, 5);
    ribbonGeo.rotateX(-Math.PI * 0.5);

    var mistPlacements = [
      { x: -11.5, y: -0.18, z: -8.5, sx: 1.05, sz: 0.92, rot: 0.16, speed: 0.22 },
      { x: 11.8, y: -0.14, z: -8.0, sx: 1.10, sz: 0.96, rot: -0.20, speed: -0.19 },
      { x: -10.2, y: -0.16, z: -41.0, sx: 1.14, sz: 1.02, rot: -0.15, speed: 0.18 },
      { x: 10.5, y: -0.18, z: -41.2, sx: 1.10, sz: 0.98, rot: 0.24, speed: -0.21 },
      { x: -10.4, y: -0.16, z: -75.0, sx: 1.12, sz: 1.00, rot: 0.14, speed: 0.20 },
      { x: 10.8, y: -0.17, z: -74.6, sx: 1.14, sz: 0.98, rot: -0.19, speed: -0.17 },
      { x: 0.0, y: -0.12, z: -111.0, sx: 1.44, sz: 1.18, rot: 0.06, speed: 0.14 }
    ];

    mistRibbons = [];
    for (var m = 0; m < mistPlacements.length; m++) {
      var mp = mistPlacements[m];
      var rMesh = new THREE.Mesh(ribbonGeo, mistShaderMat);
      rMesh.position.set(mp.x, mp.y, mp.z);
      rMesh.scale.set(mp.sx, 1.0, mp.sz);
      rMesh.rotation.y = mp.rot;
      rMesh.renderOrder = 3;
      mistGroup.add(rMesh);
      mistRibbons.push({
        mesh: rMesh,
        baseX: mp.x,
        baseY: mp.y,
        baseZ: mp.z,
        speed: mp.speed,
        phase: m * 1.37
      });
    }

    disableRaycastRecursive(mistGroup);

    // Per-particle glowing radial Gaussian ShaderMaterial for Pollen & Nocturnal Firefly Motes (throttled to 30Hz)
    var moteCount = 105;
    var positions = new Float32Array(moteCount * 3);
    var phases = new Float32Array(moteCount);
    var scales = new Float32Array(moteCount);
    moteData = [];

    for (var i = 0; i < moteCount; i++) {
      var zone = i % 7;
      var anchorZ = 8.5;
      var spreadR = 13.5;
      var baseY = 1.1;

      if (zone === 0) { anchorZ = 8.5; spreadR = 14.2; baseY = 1.35; }
      else if (zone === 1) { anchorZ = -8.2; spreadR = 11.5; baseY = 0.65; }
      else if (zone === 2) { anchorZ = -24.0; spreadR = 12.8; baseY = 1.25; }
      else if (zone === 3) { anchorZ = -41.0; spreadR = 11.2; baseY = 0.65; }
      else if (zone === 4) { anchorZ = -58.0; spreadR = 12.8; baseY = 1.25; }
      else if (zone === 5) { anchorZ = -75.0; spreadR = 11.2; baseY = 0.65; }
      else { anchorZ = -92.0; spreadR = 13.2; baseY = 1.35; }

      var ang = i * 2.39996;
      var rad = (0.28 + 0.72 * (((i * 37) % 100) / 100.0)) * spreadR;
      var mx = Math.cos(ang) * rad;
      var mz = anchorZ + Math.sin(ang) * rad * 0.85;
      var my = baseY + ((i * 19) % 26) * 0.11;

      positions[i * 3] = mx;
      positions[i * 3 + 1] = my;
      positions[i * 3 + 2] = mz;
      phases[i] = i * 1.17;
      scales[i] = 0.75 + (i % 5) * 0.16;

      moteData.push({
        ox: mx,
        oy: my,
        oz: mz,
        driftR: 0.36 + (i % 5) * 0.14,
        speed: 0.36 + (i % 7) * 0.08,
        phase: i * 0.73
      });
    }

    var moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    moteGeo.setAttribute('aPhase', new THREE.Float32BufferAttribute(phases, 1));
    moteGeo.setAttribute('aScale', new THREE.Float32BufferAttribute(scales, 1));

    currentMoteColor = new THREE.Color(preset.moteHex);
    targetMoteColor = currentMoteColor.clone();
    currentMoteOpacity = preset.moteOpacity;
    targetMoteOpacity = preset.moteOpacity;

    var dpr = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2.0) : 1.0;
    moteUniforms = {
      uTime: { value: 0 },
      uColor: { value: currentMoteColor.clone() },
      uOpacity: { value: currentMoteOpacity },
      uPixelRatio: { value: dpr }
    };

    var moteShaderMat = new THREE.ShaderMaterial({
      uniforms: moteUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: [
        'attribute float aPhase;',
        'attribute float aScale;',
        'uniform float uTime;',
        'uniform float uPixelRatio;',
        'varying float vTwinkle;',
        'void main() {',
        '  vTwinkle = 0.45 + 0.55 * (0.5 + 0.5 * sin(uTime * 2.1 + aPhase));',
        '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
        '  float dist = max(-mvPos.z, 1.2);',
        '  gl_PointSize = clamp((88.0 * aScale * uPixelRatio) / dist, 1.5, 20.0);',
        '  gl_Position = projectionMatrix * mvPos;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uColor;',
        'uniform float uOpacity;',
        'varying float vTwinkle;',
        'void main() {',
        '  vec2 c = (gl_PointCoord - 0.5) * 2.0;',
        '  float r2 = dot(c, c);',
        '  if (r2 > 1.0) discard;',
        '  float halo = exp(-r2 * 4.2) * (1.0 - r2);',
        '  float finalA = clamp(halo * vTwinkle * uOpacity, 0.0, 1.0);',
        '  gl_FragColor = vec4(uColor, finalA);',
        '}'
      ].join('\n')
    });

    motePoints = new THREE.Points(moteGeo, moteShaderMat);
    motePoints.name = 'PhraxosAtmosphericMotes';
    motePoints.frustumCulled = false;
    motePoints.renderOrder = 5;
    motePoints.raycast = function () {};
    parent.add(motePoints);
  }

  // ==========================================================================
  // 5. SAFE OPTIONAL HTTP/HTTPS PHOTOGRAMMETRY PROP LOADER (ZERO file:// CORS)
  // ==========================================================================
  function tryLoadOptionalPhotogrammetryProps(THREE, parent) {
    if (typeof window === 'undefined' || !window.location) return;
    var proto = window.location.protocol;
    if (proto !== 'http:' && proto !== 'https:') return;

    var LoaderClass = (THREE && THREE.GLTFLoader) || window.GLTFLoader;
    if (typeof LoaderClass !== 'function' || typeof window.fetch !== 'function') return;

    var probeAndLoad = function (url, onModelReady) {
      window.fetch(url, { method: 'HEAD' })
        .then(function (res) {
          if (!res || !res.ok) return;
          var ct = (res.headers && res.headers.get('content-type')) || '';
          if (ct.indexOf('text/html') !== -1) return;
          try {
            var loader = new LoaderClass();
            loader.load(
              url,
              function (gltf) {
                if (gltf && gltf.scene) onModelReady(gltf.scene);
              },
              undefined,
              function () { /* silently ignore decode/load failure */ }
            );
          } catch (err) { /* ignore */ }
        })
        .catch(function () { /* silently ignore 404 or offline state */ });
    };

    var normaliseHeight = function (obj, desiredHeight) {
      var box = new THREE.Box3().setFromObject(obj);
      var size = new THREE.Vector3();
      box.getSize(size);
      if (size.y > 0.001) {
        var s = desiredHeight / size.y;
        obj.scale.multiplyScalar(s);
        box.setFromObject(obj);
        obj.position.y -= box.min.y;
      }
      obj.traverse(function (ch) {
        if (ch && ch.isMesh) {
          ch.castShadow = false;
          ch.receiveShadow = true;
          ch.raycast = function () {};
        }
      });
    };

    // 1) Photogrammetry Brass Vase flanking the Villa Bourani Portico steps
    probeAndLoad(
      'myst-grammar-island/assets/models/brass_vase_01/brass_vase_01.gltf',
      function (vaseScene) {
        var spots = [
          { x: -3.25, y: 0.48, z: 16.32, ry: 0.35 },
          { x: 3.25, y: 0.48, z: 16.32, ry: -0.35 }
        ];
        for (var i = 0; i < spots.length; i++) {
          var inst = vaseScene.clone(true);
          normaliseHeight(inst, 0.66);
          inst.position.x += spots[i].x;
          inst.position.y += spots[i].y;
          inst.position.z += spots[i].z;
          inst.rotation.y = spots[i].ry;
          parent.add(inst);
        }
      }
    );

    // 2) Photogrammetry Coastal Mossy Rocks nestled beside the Causeway sea-piers
    probeAndLoad(
      'myst-grammar-island/assets/models/rock_moss_set_01/rock_moss_set_01.gltf',
      function (rockScene) {
        var rockMeshes = [];
        rockScene.traverse(function (ch) {
          if (ch && ch.isMesh) rockMeshes.push(ch);
        });
        if (rockMeshes.length === 0) return;

        var reefSpots = [
          { x: -2.55, y: -0.52, z: -10.12, h: 0.38, ry: 0.6 },
          { x: 2.60, y: -0.50, z: -6.90, h: 0.40, ry: 2.1 },
          { x: -2.55, y: -0.52, z: -41.00, h: 0.42, ry: 1.3 },
          { x: 2.60, y: -0.50, z: -41.00, h: 0.40, ry: 3.7 },
          { x: -2.55, y: -0.52, z: -74.74, h: 0.40, ry: 0.9 },
          { x: 2.60, y: -0.50, z: -74.74, h: 0.38, ry: 2.8 }
        ];
        for (var r = 0; r < reefSpots.length; r++) {
          var sp = reefSpots[r];
          var wrap = new THREE.Group();
          var srcMesh = rockMeshes[r % rockMeshes.length].clone();
          srcMesh.position.set(0, 0, 0);
          wrap.add(srcMesh);
          normaliseHeight(wrap, sp.h);
          wrap.position.x += sp.x;
          wrap.position.y += sp.y;
          wrap.position.z += sp.z;
          wrap.rotation.y = sp.ry;
          parent.add(wrap);
        }
      }
    );
  }

  // ==========================================================================
  // 6. PROCEDURAL WEB AUDIO AEGEAN SOUNDSCAPE, BIOPHONY & MARBLE FOOTSTEPS
  // ==========================================================================
  function inspectHostAudio(ctx, allowEnsure) {
    var c = ctx || savedCtx;
    var enabled = explicitAudioEnabled !== null ? explicitAudioEnabled : true;
    var ac = null;
    var speaking = false;
    var hostCicadaGain = null;

    if (c && typeof c.getAudioState === 'function') {
      try {
        var st = c.getAudioState();
        if (typeof st === 'boolean') {
          enabled = st;
        } else if (st && typeof st === 'object') {
          if (st.audioEnabled !== undefined) enabled = !!st.audioEnabled;
          else if (st.enabled !== undefined) enabled = !!st.enabled;
          ac = st.audioCtx || st.ctx || st.context || null;
          speaking = !!(st.isConchisSpeaking || st.speaking);
          hostCicadaGain = st.cicadaGain || null;
        }
      } catch (e) { /* ignore */ }
    } else if (explicitAudioEnabled === false) {
      enabled = false;
    }

    if (!ac && allowEnsure && enabled && userGestureSeen) {
      if (c && typeof c.ensureAudio === 'function') {
        try {
          var ensured = c.ensureAudio();
          if (ensured && typeof ensured.createGain === 'function') {
            ac = ensured;
          } else if (c.getAudioState) {
            var stAfter = c.getAudioState();
            if (stAfter && typeof stAfter === 'object') {
              ac = stAfter.audioCtx || stAfter.ctx || stAfter.context || null;
            }
          }
        } catch (e2) { /* ignore */ }
      }
      if (!ac && typeof window !== 'undefined') {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          if (!fallbackAudioCtx) {
            try { fallbackAudioCtx = new AC(); } catch (e3) { /* ignore */ }
          }
          ac = fallbackAudioCtx;
        }
      }
    }

    if (!ac && fallbackAudioCtx) {
      ac = fallbackAudioCtx;
    }

    return {
      enabled: enabled,
      ac: ac,
      speaking: speaking,
      hostCicadaGain: hostCicadaGain
    };
  }

  function createPannerOrGain(ac, panVal) {
    if (typeof ac.createStereoPanner === 'function') {
      var p = ac.createStereoPanner();
      p.pan.value = panVal;
      return p;
    }
    return ac.createGain();
  }

  function buildSeamlessPinkBrownBuffer(ac, seconds) {
    var sr = ac.sampleRate;
    var total = Math.floor(sr * seconds);
    var fadeSamples = Math.floor(sr * 0.25);
    var buf = ac.createBuffer(1, total, sr);
    var out = buf.getChannelData(0);

    var b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    var brown = 0;
    var raw = new Float32Array(total + fadeSamples);

    for (var i = 0; i < raw.length; i++) {
      var white = Math.random() * 2.0 - 1.0;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      var pink = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;

      brown = (brown + 0.022 * white) / 1.022;
      raw[i] = pink * 0.62 + brown * 0.85;
    }

    for (var j = 0; j < total; j++) {
      if (j < fadeSamples) {
        var t = j / fadeSamples;
        out[j] = raw[j] * t + raw[total + j] * (1.0 - t);
      } else {
        out[j] = raw[j];
      }
    }

    return buf;
  }

  function ensureSoundscapeNodes(ac) {
    if (!ac) return null;
    if (audioNodes && audioNodes.ac === ac) return audioNodes;

    try {
      var noiseBuf = buildSeamlessPinkBrownBuffer(ac, 6.0);

      var stepLen = Math.floor(ac.sampleRate * 0.12);
      var stepBuf = ac.createBuffer(1, stepLen, ac.sampleRate);
      var stepData = stepBuf.getChannelData(0);
      for (var k = 0; k < stepLen; k++) {
        var uStep = 1.0 - k / stepLen;
        var env = uStep * uStep;
        stepData[k] = (Math.random() * 2.0 - 1.0) * env;
      }

      var masterBus = ac.createGain();
      masterBus.gain.value = 0.0;
      masterBus.connect(ac.destination);

      // 1A) Left Cliff Cove Surf Wash (0.13 Hz Mediterranean swell LFO)
      var surfLeftSrc = ac.createBufferSource();
      surfLeftSrc.buffer = noiseBuf;
      surfLeftSrc.loop = true;

      var surfLeftFilter = ac.createBiquadFilter();
      surfLeftFilter.type = 'bandpass';
      surfLeftFilter.frequency.value = 440;
      surfLeftFilter.Q.value = 0.82;

      var surfLeftLfo = ac.createOscillator();
      surfLeftLfo.type = 'sine';
      surfLeftLfo.frequency.value = 0.13;
      var surfLeftFreqMod = ac.createGain();
      surfLeftFreqMod.gain.value = 185;
      surfLeftLfo.connect(surfLeftFreqMod);
      surfLeftFreqMod.connect(surfLeftFilter.frequency);

      var surfLeftWaveVca = ac.createGain();
      surfLeftWaveVca.gain.value = 0.036;
      var surfLeftAmpMod = ac.createGain();
      surfLeftAmpMod.gain.value = 0.018;
      surfLeftLfo.connect(surfLeftAmpMod);
      surfLeftAmpMod.connect(surfLeftWaveVca.gain);

      var surfLeftPan = createPannerOrGain(ac, -0.66);
      var surfLeftProxGain = ac.createGain();
      surfLeftProxGain.gain.value = 0.55;

      surfLeftSrc.connect(surfLeftFilter);
      surfLeftFilter.connect(surfLeftWaveVca);
      surfLeftWaveVca.connect(surfLeftProxGain);
      surfLeftProxGain.connect(surfLeftPan);
      surfLeftPan.connect(masterBus);

      // 1B) Right Cliff Cove Shingle Wash (0.08 Hz long Aegean swell LFO)
      var surfRightSrc = ac.createBufferSource();
      surfRightSrc.buffer = noiseBuf;
      surfRightSrc.loop = true;

      var surfRightFilter = ac.createBiquadFilter();
      surfRightFilter.type = 'lowpass';
      surfRightFilter.frequency.value = 560;
      surfRightFilter.Q.value = 0.7;

      var surfRightLfo = ac.createOscillator();
      surfRightLfo.type = 'sine';
      surfRightLfo.frequency.value = 0.08;
      var surfRightFreqMod = ac.createGain();
      surfRightFreqMod.gain.value = 220;
      surfRightLfo.connect(surfRightFreqMod);
      surfRightFreqMod.connect(surfRightFilter.frequency);

      var surfRightWaveVca = ac.createGain();
      surfRightWaveVca.gain.value = 0.034;
      var surfRightAmpMod = ac.createGain();
      surfRightAmpMod.gain.value = 0.016;
      surfRightLfo.connect(surfRightAmpMod);
      surfRightAmpMod.connect(surfRightWaveVca.gain);

      var surfRightPan = createPannerOrGain(ac, 0.66);
      var surfRightProxGain = ac.createGain();
      surfRightProxGain.gain.value = 0.55;

      surfRightSrc.connect(surfRightFilter);
      surfRightFilter.connect(surfRightWaveVca);
      surfRightWaveVca.connect(surfRightProxGain);
      surfRightProxGain.connect(surfRightPan);
      surfRightPan.connect(masterBus);

      // 2) Warm Aleppo Pine Cicada Acoustic Shimmer (Noon & Dusk; hushed at Night)
      var cicadaSrc = ac.createBufferSource();
      cicadaSrc.buffer = noiseBuf;
      cicadaSrc.loop = true;

      var cicadaBand = ac.createBiquadFilter();
      cicadaBand.type = 'bandpass';
      cicadaBand.frequency.value = 3920;
      cicadaBand.Q.value = 3.8;

      var cicadaWarmRoll = ac.createBiquadFilter();
      cicadaWarmRoll.type = 'lowpass';
      cicadaWarmRoll.frequency.value = 5200;

      var cicadaPulseVca = ac.createGain();
      cicadaPulseVca.gain.value = 0.65;
      var cicadaPulseLfo = ac.createOscillator();
      cicadaPulseLfo.type = 'sine';
      cicadaPulseLfo.frequency.value = 4.1;
      var cicadaPulseDepth = ac.createGain();
      cicadaPulseDepth.gain.value = 0.28;
      cicadaPulseLfo.connect(cicadaPulseDepth);
      cicadaPulseDepth.connect(cicadaPulseVca.gain);

      var cicadaModeGain = ac.createGain();
      cicadaModeGain.gain.value = currentLightingMode === 2 ? 0.0 : (currentLightingMode === 0 ? 0.013 : 0.009);
      var cicadaPan = createPannerOrGain(ac, 0.28);

      cicadaSrc.connect(cicadaBand);
      cicadaBand.connect(cicadaWarmRoll);
      cicadaWarmRoll.connect(cicadaPulseVca);
      cicadaPulseVca.connect(cicadaModeGain);
      cicadaModeGain.connect(cicadaPan);
      cicadaPan.connect(masterBus);

      // 3) Soft Nocturnal Aegean Pine Breeze (Moonlit Masque mode === 2)
      var breezeSrc = ac.createBufferSource();
      breezeSrc.buffer = noiseBuf;
      breezeSrc.loop = true;

      var breezeFilter = ac.createBiquadFilter();
      breezeFilter.type = 'bandpass';
      breezeFilter.frequency.value = 285;
      breezeFilter.Q.value = 1.55;

      var breezeLfo = ac.createOscillator();
      breezeLfo.type = 'sine';
      breezeLfo.frequency.value = 0.065;
      var breezeLfoDepth = ac.createGain();
      breezeLfoDepth.gain.value = 95;
      breezeLfo.connect(breezeLfoDepth);
      breezeLfoDepth.connect(breezeFilter.frequency);

      var breezeModeGain = ac.createGain();
      breezeModeGain.gain.value = currentLightingMode === 2 ? 0.022 : (currentLightingMode === 1 ? 0.004 : 0.0);

      breezeSrc.connect(breezeFilter);
      breezeFilter.connect(breezeModeGain);
      breezeModeGain.connect(masterBus);

      var nowT = ac.currentTime;
      surfLeftSrc.start(nowT, 0.0);
      surfRightSrc.start(nowT, 2.7);
      surfLeftLfo.start(nowT);
      surfRightLfo.start(nowT);
      cicadaSrc.start(nowT, 1.3);
      cicadaPulseLfo.start(nowT);
      breezeSrc.start(nowT, 4.1);
      breezeLfo.start(nowT);

      audioNodes = {
        ac: ac,
        stepBuf: stepBuf,
        masterBus: masterBus,
        surfLeftProxGain: surfLeftProxGain,
        surfRightProxGain: surfRightProxGain,
        cicadaModeGain: cicadaModeGain,
        breezeModeGain: breezeModeGain
      };

      return audioNodes;
    } catch (e) {
      return null;
    }
  }

  function applyBiophonyTargets(mode, hostCicadaGain) {
    if (audioNodes && audioNodes.ac) {
      var now = audioNodes.ac.currentTime;
      var cicTarget = (mode === 0) ? 0.013 : (mode === 1 ? 0.009 : 0.0);
      var brzTarget = (mode === 2) ? 0.022 : (mode === 1 ? 0.004 : 0.0);
      audioNodes.cicadaModeGain.gain.setTargetAtTime(cicTarget, now, 0.45);
      audioNodes.breezeModeGain.gain.setTargetAtTime(brzTarget, now, 0.55);

      if (hostCicadaGain && hostCicadaGain.gain) {
        var hostTarget = (mode === 2) ? 0.0 : (mode === 1 ? 0.012 : 0.016);
        try { hostCicadaGain.gain.setTargetAtTime(hostTarget, now, 0.45); } catch (e) { /* ignore */ }
      }
    }
  }

  function playDistantScopsOwl(nodes) {
    if (!nodes || !nodes.ac || nodes.ac.state !== 'running') return;
    var ac = nodes.ac;
    var t0 = ac.currentTime + 0.04;
    var panSide = (Math.random() < 0.5 ? -1 : 1) * (0.42 + Math.random() * 0.28);

    var triggerFluteNote = function (startT, baseFreq, peakGain, panPos) {
      var osc = ac.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * 1.018, startT);
      osc.frequency.exponentialRampToValueAtTime(baseFreq, startT + 0.055);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.992, startT + 0.36);

      var overtone = ac.createOscillator();
      overtone.type = 'sine';
      overtone.frequency.setValueAtTime(baseFreq * 2.0, startT);
      var overGain = ac.createGain();
      overGain.gain.value = 0.05;

      var lp = ac.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1150;

      var env = ac.createGain();
      env.gain.setValueAtTime(0.0001, startT);
      env.gain.linearRampToValueAtTime(peakGain, startT + 0.038);
      env.gain.setValueAtTime(peakGain * 0.92, startT + 0.16);
      env.gain.exponentialRampToValueAtTime(0.0001, startT + 0.42);

      var panner = createPannerOrGain(ac, panPos);

      osc.connect(lp);
      overtone.connect(overGain);
      overGain.connect(lp);
      lp.connect(env);
      env.connect(panner);
      panner.connect(nodes.masterBus);

      osc.start(startT);
      overtone.start(startT);
      osc.stop(startT + 0.45);
      overtone.stop(startT + 0.45);
    };

    var pitch = 674 + (Math.random() - 0.5) * 16;
    triggerFluteNote(t0, pitch, 0.024, panSide);
    triggerFluteNote(t0 + 0.38, pitch * 0.997, 0.0075, -panSide * 0.65);
  }

  function computeCliffAndCausewayProximity(player) {
    if (!player) return { prox: 0.55, sideBias: 0.0 };
    var px = Number(player.x) || 0;
    var pz = Number(player.z) || 0;

    for (var c = 0; c < CAUSEWAY_Z.length; c++) {
      var dz = Math.abs(pz - CAUSEWAY_Z[c]);
      if (dz < 6.8 && Math.abs(px) < 2.6) {
        var bridgeFactor = 1.0 - (dz / 6.8) * 0.25;
        return { prox: Math.min(1.05, 0.78 + bridgeFactor * 0.27), sideBias: Math.max(-0.25, Math.min(0.25, px * 0.08)) };
      }
    }

    var bestEdgeRatio = 0.4;
    for (var h = 0; h < HEADLANDS.length; h++) {
      var hl = HEADLANDS[h];
      var dist = Math.hypot(px - hl.cx, pz - hl.cz);
      if (dist <= hl.r + 3.0) {
        bestEdgeRatio = Math.min(1.0, dist / hl.r);
        break;
      }
    }

    // Centre of terrace ~0.36, parapet cliff edge ~0.92
    var prox = 0.36 + bestEdgeRatio * Math.sqrt(bestEdgeRatio) * 0.58;
    var sideBias = Math.max(-0.32, Math.min(0.32, (px / 14.5) * 0.32));
    return { prox: prox, sideBias: sideBias };
  }

  // ==========================================================================
  // 7. PUBLIC SHARED CONTRACT METHODS
  // ==========================================================================
  function init(ctx) {
    if (ctx) savedCtx = ctx;
    var c = ctx || savedCtx;
    if (!c || !c.scene) return;
    var THREE = getTHREE(c);
    if (!THREE) return;

    if (typeof c.getLightingMode === 'function') {
      var m = Number(c.getLightingMode());
      if (m === 0 || m === 1 || m === 2) currentLightingMode = m;
    }

    if (!initialised3D) {
      initialised3D = true;

      rootGroup = new THREE.Group();
      rootGroup.name = 'PhraxosAtmosphereRoot';
      c.scene.add(rootGroup);

      buildCausewayViaducts(THREE, rootGroup);
      buildVolumetricLightShafts(THREE, rootGroup);
      buildCoveMistAndMotes(THREE, rootGroup);
      tryLoadOptionalPhotogrammetryProps(THREE, rootGroup);
    }

    onLightingChange(currentLightingMode, c);

    var audioInfo = inspectHostAudio(c, false);
    if (audioInfo.ac) {
      var nodes = ensureSoundscapeNodes(audioInfo.ac);
      if (nodes) {
        var targetMaster = audioInfo.enabled ? (audioInfo.speaking ? 0.45 : 1.0) : 0.0;
        nodes.masterBus.gain.setValueAtTime(targetMaster, audioInfo.ac.currentTime);
        applyBiophonyTargets(currentLightingMode, audioInfo.hostCicadaGain);
      }
    }
  }

  function onLightingChange(mode, ctx) {
    if (ctx) savedCtx = ctx;
    var c = ctx || savedCtx;
    var THREE = getTHREE(c);
    var m = (mode === 0 || mode === 1 || mode === 2) ? mode : 1;
    var prevMode = currentLightingMode;
    currentLightingMode = m;

    var preset = ATMOS_LIGHT_MODES[m];
    if (THREE && initialised3D) {
      var bDir = new THREE.Vector3(preset.beamDir[0], preset.beamDir[1], preset.beamDir[2]).normalize();
      if (targetBeamQuat) targetBeamQuat.set(bDir.z, 0, -bDir.x, 1.0 + bDir.y).normalize();
      if (targetShaftColor) targetShaftColor.setHex(preset.shaftHex);
      targetShaftOpacity = preset.shaftOpacity;

      if (targetMistColA) targetMistColA.setHex(preset.mistColorA);
      if (targetMistColB) targetMistColB.setHex(preset.mistColorB);
      targetMistOpacity = preset.mistOpacity;

      if (targetMoteColor) targetMoteColor.setHex(preset.moteHex);
      targetMoteOpacity = preset.moteOpacity;

      if (targetFoamColor) targetFoamColor.setHex(preset.foamHex);
      targetFoamOpacity = preset.foamOpacity;
    }

    if (m === 2 && prevMode !== 2) {
      owlCooldown = 5.5 + Math.random() * 3.5;
    }

    var audioInfo = inspectHostAudio(c, false);
    applyBiophonyTargets(m, audioInfo.hostCicadaGain);
  }

  function onAudioToggle(enabled, ctx) {
    if (ctx) savedCtx = ctx;
    userGestureSeen = true;
    explicitAudioEnabled = (enabled !== undefined) ? !!enabled : null;

    var c = ctx || savedCtx;
    var audioInfo = inspectHostAudio(c, explicitAudioEnabled !== false);
    var isOn = (explicitAudioEnabled !== null) ? explicitAudioEnabled : audioInfo.enabled;

    if (audioInfo.ac) {
      if (isOn && audioInfo.ac.state === 'suspended') {
        try { audioInfo.ac.resume().catch(function () {}); } catch (e) { /* ignore */ }
      }
      var nodes = ensureSoundscapeNodes(audioInfo.ac);
      if (nodes) {
        var now = audioInfo.ac.currentTime;
        nodes.masterBus.gain.setTargetAtTime(isOn ? (audioInfo.speaking ? 0.45 : 1.0) : 0.0, now, 0.09);
        applyBiophonyTargets(currentLightingMode, audioInfo.hostCicadaGain);
      }
    }
  }

  function triggerFootstep(surfaceType, ctx) {
    if (ctx) savedCtx = ctx;
    userGestureSeen = true;
    var c = ctx || savedCtx;
    if (isInIntro(c)) return;

    var audioInfo = inspectHostAudio(c, true);
    if (!audioInfo.enabled || !audioInfo.ac) return;

    var ac = audioInfo.ac;
    if (ac.state === 'suspended') {
      try { ac.resume().catch(function () {}); } catch (e) { /* ignore */ }
      return;
    }

    var now = ac.currentTime;
    if (now - lastFootstepAt < 0.16) return;
    lastFootstepAt = now;

    var nodes = ensureSoundscapeNodes(ac);
    if (!nodes || !nodes.stepBuf) return;

    stepParity = 1 - stepParity;
    var surf = String(surfaceType || 'marble').toLowerCase();
    var pitchJit = (stepParity === 0 ? 0.97 : 1.03) * (0.98 + Math.random() * 0.04);
    var panVal = (stepParity === 0 ? -0.11 : 0.11);

    var bandFreq = 1680;
    var bandQ = 2.35;
    var bodyStart = 152;
    var bodyEnd = 82;
    var heelDecay = 0.032;
    var level = 0.048;

    if (surf === 'causeway') {
      bandFreq = 1280;
      bandQ = 2.05;
      bodyStart = 126;
      bodyEnd = 66;
      heelDecay = 0.042;
      level = 0.054;
    } else if (surf === 'earth') {
      bandFreq = 980;
      bandQ = 1.35;
      bodyStart = 104;
      bodyEnd = 56;
      heelDecay = 0.052;
      level = 0.042;
    }

    if (audioInfo.speaking) level *= 0.55;

    var panNode = createPannerOrGain(ac, panVal);
    panNode.connect(nodes.masterBus);

    var heelNoise = ac.createBufferSource();
    heelNoise.buffer = nodes.stepBuf;
    heelNoise.playbackRate.value = pitchJit;

    var heelFilter = ac.createBiquadFilter();
    heelFilter.type = 'bandpass';
    heelFilter.frequency.value = bandFreq * pitchJit;
    heelFilter.Q.value = bandQ;

    var heelGain = ac.createGain();
    heelGain.gain.setValueAtTime(0.0001, now);
    heelGain.gain.linearRampToValueAtTime(level, now + 0.004);
    heelGain.gain.exponentialRampToValueAtTime(0.0001, now + heelDecay);

    heelNoise.connect(heelFilter);
    heelFilter.connect(heelGain);
    heelGain.connect(panNode);

    heelNoise.start(now);
    heelNoise.stop(now + heelDecay + 0.015);

    var bodyOsc = ac.createOscillator();
    bodyOsc.type = 'triangle';
    bodyOsc.frequency.setValueAtTime(bodyStart * pitchJit, now);
    bodyOsc.frequency.exponentialRampToValueAtTime(bodyEnd, now + heelDecay * 0.95);

    var bodyGain = ac.createGain();
    bodyGain.gain.setValueAtTime(level * 0.68, now);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + heelDecay * 1.1);

    bodyOsc.connect(bodyGain);
    bodyGain.connect(panNode);
    bodyOsc.start(now);
    bodyOsc.stop(now + heelDecay * 1.15 + 0.01);

    var toeT = now + 0.044;
    var toeNoise = ac.createBufferSource();
    toeNoise.buffer = nodes.stepBuf;
    toeNoise.playbackRate.value = pitchJit * 1.14;

    var toeFilter = ac.createBiquadFilter();
    toeFilter.type = 'bandpass';
    toeFilter.frequency.value = bandFreq * 1.24 * pitchJit;
    toeFilter.Q.value = bandQ * 0.9;

    var toeGain = ac.createGain();
    toeGain.gain.setValueAtTime(0.0001, toeT);
    toeGain.gain.linearRampToValueAtTime(level * 0.34, toeT + 0.003);
    toeGain.gain.exponentialRampToValueAtTime(0.0001, toeT + heelDecay * 0.72);

    toeNoise.connect(toeFilter);
    toeFilter.connect(toeGain);
    toeGain.connect(panNode);

    toeNoise.start(toeT);
    toeNoise.stop(toeT + heelDecay * 0.75 + 0.015);
  }

  function update(dt, now, ctx) {
    if (ctx) savedCtx = ctx;
    var c = ctx || savedCtx;
    var safeDt = Math.min(Math.max(Number(dt) || 0.016, 0.0), 0.1);
    elapsedSec += safeDt;
    var tSec = (typeof now === 'number' && now > 0) ? (now * 0.001) : elapsedSec;

    if (!initialised3D && c && c.scene) {
      init(c);
    }

    var lerpAmt = Math.min(1.0, safeDt * 3.2);
    var hasPlayerZ = !!(c && c.player && typeof c.player.z === 'number');
    var playerZ = hasPlayerZ ? c.player.z : ((c && c.camera && c.camera.position && typeof c.camera.position.z === 'number') ? c.camera.position.z : 8.5);
    var camZ = (c && c.camera && c.camera.position && typeof c.camera.position.z === 'number') ? c.camera.position.z : playerZ;
    var cullDistZ = 65.0;

    // 1) Smoothly transition volumetric light-shaft angles, colours & cull batches > 65m from player.z
    if (shaftUniforms) {
      shaftUniforms.uTime.value = tSec;
      if (currentBeamQuat && targetBeamQuat) {
        currentBeamQuat.slerp(targetBeamQuat, lerpAmt);
        var uq = shaftUniforms.uBeamQuat.value;
        if (uq && typeof uq.set === 'function') {
          uq.set(currentBeamQuat.x, currentBeamQuat.y, currentBeamQuat.z, currentBeamQuat.w);
        } else if (uq) {
          uq.x = currentBeamQuat.x;
          uq.y = currentBeamQuat.y;
          uq.z = currentBeamQuat.z;
          uq.w = currentBeamQuat.w;
        }
      }
      if (currentShaftColor && targetShaftColor) {
        currentShaftColor.lerp(targetShaftColor, lerpAmt);
        shaftUniforms.uColor.value.copy(currentShaftColor);
      }
      currentShaftOpacity += (targetShaftOpacity - currentShaftOpacity) * lerpAmt;
      shaftUniforms.uOpacity.value = currentShaftOpacity;

      for (var s = 0; s < shaftBatches.length; s++) {
        var sb = shaftBatches[s];
        var dShaft = Math.min(Math.abs(sb.anchorZ - playerZ), Math.abs(sb.anchorZ - camZ));
        sb.mesh.visible = (dShaft <= cullDistZ);
      }
    }

    // 2) Drift 2-octave Aegean sea-mist ribbons & cull ribbons > 65m from player.z
    if (mistUniforms) {
      mistUniforms.uTime.value = tSec;
      if (currentMistColA && targetMistColA) {
        currentMistColA.lerp(targetMistColA, lerpAmt);
        mistUniforms.uColorA.value.copy(currentMistColA);
      }
      if (currentMistColB && targetMistColB) {
        currentMistColB.lerp(targetMistColB, lerpAmt);
        mistUniforms.uColorB.value.copy(currentMistColB);
      }
      currentMistOpacity += (targetMistOpacity - currentMistOpacity) * lerpAmt;
      mistUniforms.uOpacity.value = currentMistOpacity;

      for (var m = 0; m < mistRibbons.length; m++) {
        var mr = mistRibbons[m];
        var dMist = Math.min(Math.abs(mr.baseZ - playerZ), Math.abs(mr.baseZ - camZ));
        var mistVis = (dMist <= cullDistZ);
        mr.mesh.visible = mistVis;
        if (mistVis) {
          mr.mesh.position.x = mr.baseX + Math.sin(tSec * mr.speed + mr.phase) * 2.1;
          mr.mesh.position.z = mr.baseZ + Math.cos(tSec * mr.speed * 0.75 + mr.phase) * 1.1;
          mr.mesh.position.y = mr.baseY + Math.sin(tSec * 0.45 + mr.phase) * 0.06;
        }
      }
    }

    // 3) Update GPU-driven 2-octave cove sea-foam collars & cull viaduct foam > 65m from player.z
    if (foamSharedUniforms) {
      foamSharedUniforms.uTime.value = tSec;
      if (currentFoamColor && targetFoamColor) {
        currentFoamColor.lerp(targetFoamColor, lerpAmt);
        foamSharedUniforms.uColor.value.copy(currentFoamColor);
      }
      currentFoamOpacity += (targetFoamOpacity - currentFoamOpacity) * lerpAmt;
      foamSharedUniforms.uOpacity.value = currentFoamOpacity;

      var freezeVal = (c && c.waterUniforms && c.waterUniforms.uFreeze) ? Number(c.waterUniforms.uFreeze.value) || 0 : 0;
      foamSharedUniforms.uWaveScale.value = 1.0 - freezeVal * 0.9;
      foamSharedUniforms.uWaveTime.value = tSec * (1.0 - freezeVal * 0.95);

      for (var f = 0; f < foamBatches.length; f++) {
        var fb = foamBatches[f];
        var dFoam = Math.min(Math.abs(fb.anchorZ - playerZ), Math.abs(fb.anchorZ - camZ));
        fb.mesh.visible = (dFoam <= cullDistZ);
      }
    }

    // 4) Meander soft Gaussian pollen / nocturnal firefly motes (CPU buffer upload throttled to 30Hz)
    if (motePoints && moteUniforms && moteData.length > 0) {
      moteUniforms.uTime.value = tSec;
      if (currentMoteColor && targetMoteColor) {
        currentMoteColor.lerp(targetMoteColor, lerpAmt);
        moteUniforms.uColor.value.copy(currentMoteColor);
      }
      currentMoteOpacity += (targetMoteOpacity - currentMoteOpacity) * lerpAmt;
      moteUniforms.uOpacity.value = currentMoteOpacity;

      moteUpdateAccum += safeDt;
      if (moteUpdateAccum >= 0.0333) {
        moteUpdateAccum = 0.0;
        var attr = motePoints.geometry.attributes.position;
        var arr = attr.array;
        for (var i = 0; i < moteData.length; i++) {
          var md = moteData[i];
          var ph = tSec * md.speed + md.phase;
          arr[i * 3] = md.ox + Math.sin(ph) * md.driftR;
          arr[i * 3 + 1] = md.oy + Math.sin(ph * 1.35 + 1.1) * 0.26;
          arr[i * 3 + 2] = md.oz + Math.cos(ph * 0.85) * md.driftR;
        }
        attr.needsUpdate = true;
      }
    }

    // 5) Update procedural stereo Aegean soundscape proximity & nocturnal Scops owl calls
    var introActive = isInIntro(c);
    var audioInfo = inspectHostAudio(c, !introActive && userGestureSeen);
    if (audioInfo.ac) {
      var nodes = ensureSoundscapeNodes(audioInfo.ac);
      if (nodes && audioInfo.ac.state === 'running') {
        var acNow = audioInfo.ac.currentTime;
        var desiredMaster = (audioInfo.enabled && !introActive)
          ? (audioInfo.speaking ? 0.45 : 1.0)
          : (audioInfo.enabled && introActive ? 0.55 : 0.0);
        nodes.masterBus.gain.setTargetAtTime(desiredMaster, acNow, 0.18);

        var proxInfo = computeCliffAndCausewayProximity(c ? c.player : null);
        smoothedProximity += (proxInfo.prox - smoothedProximity) * Math.min(1.0, safeDt * 2.5);

        var leftProx = Math.max(0.18, smoothedProximity * (1.0 - proxInfo.sideBias * 0.45));
        var rightProx = Math.max(0.18, smoothedProximity * (1.0 + proxInfo.sideBias * 0.45));
        nodes.surfLeftProxGain.gain.setTargetAtTime(leftProx, acNow, 0.22);
        nodes.surfRightProxGain.gain.setTargetAtTime(rightProx, acNow, 0.22);

        if (currentLightingMode === 2 && audioInfo.enabled && !introActive) {
          var pageHidden = (typeof document !== 'undefined' && document.visibilityState === 'hidden');
          if (!pageHidden) {
            owlCooldown -= safeDt;
            if (owlCooldown <= 0) {
              owlCooldown = 18.0 + Math.random() * 10.0;
              if (!audioInfo.speaking) {
                playDistantScopsOwl(nodes);
              }
            }
          }
        }
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.PhraxosAtmosphere = {
      init: init,
      update: update,
      onLightingChange: onLightingChange,
      onAudioToggle: onAudioToggle,
      triggerFootstep: triggerFootstep
    };
  }
})();
