/**
 * Phraxos Island — True Myst Navigation, Collision & Terrain Physics
 * Classic dependency-free browser script (compatible with file:// and https://).
 * Exposes window.PhraxosNav.
 */
(function (global) {
  'use strict';

  var BASE_TERRACE_Y = 0.48;
  var BASE_EYE_HEIGHT = 2.75;
  var GLIDE_SPEED = 7.5;
  var DRAG_THRESHOLD_PX = 6;

  // Four circular Aegean promontories (centres & walkable radii inside stone parapets)
  var PROMONTORIES = [
    {
      id: 0,
      name: 'Bourani Terrace',
      cx: 0.0,
      cz: 8.5,
      walkableR: 14.8,
      visualR: 16.5,
      columnAngles: [-145, -120, -95, -65, 65, 95, 120, 145]
    },
    {
      id: 1,
      name: '1943 Cove Amphitheatre',
      cx: 0.0,
      cz: -24.0,
      walkableR: 13.3,
      visualR: 15.0,
      columnAngles: [-135, -100, 100, 135]
    },
    {
      id: 2,
      name: 'Trial Court',
      cx: 0.0,
      cz: -58.0,
      walkableR: 13.3,
      visualR: 15.0,
      columnAngles: [-150, -125, -100, 100, 125, 150]
    },
    {
      id: 3,
      name: 'Parnassus Sanctuary',
      cx: 0.0,
      cz: -92.0,
      walkableR: 13.8,
      visualR: 15.5,
      columnAngles: [-155, -130, -105, 105, 130, 155]
    }
  ];

  // Three arched limestone causeways bridging the headlands inside parapet rails
  var CAUSEWAYS = [
    { id: 0, zMin: -14.4, zMax: -0.6, zArchMin: -13.5, zArchMax: -1.5, zMid: -7.5, halfW: 1.55, crown: 0.22 },
    { id: 1, zMin: -47.9, zMax: -34.1, zArchMin: -47.0, zArchMax: -35.0, zMid: -41.0, halfW: 1.55, crown: 0.22 },
    { id: 2, zMin: -81.9, zMax: -68.1, zArchMin: -81.0, zArchMax: -69.0, zMid: -75.0, halfW: 1.55, crown: 0.22 }
  ];

  // Villa Bourani solid neoclassical facade at the southern boundary of Promontory I
  var VILLA_FACADE = {
    halfW: 7.8,
    zMin: 16.3,
    zMax: 23.0
  };

  // Rounded-rectangle stone plinths (5 Altar + Tablet Rack ensembles & permanent masonry towers)
  var ROUNDED_BOX_OBSTACLES = [
    { cx: -5.5, cz: 7.93, halfW: 3.16, halfD: 2.26, cornerR: 0.34 },   // Altar I + Rack (West Terrace)
    { cx: 5.5, cz: 7.93, halfW: 3.16, halfD: 2.26, cornerR: 0.34 },    // Altar II + Rack (East Colonnade)
    { cx: 0.0, cz: -24.07, halfW: 3.16, halfD: 2.26, cornerR: 0.34 },  // Altar III + Rack (1943 Cove)
    { cx: 0.0, cz: -58.07, halfW: 3.16, halfD: 2.26, cornerR: 0.34 },  // Altar IV + Rack (Trial Court)
    { cx: 0.0, cz: -91.07, halfW: 3.16, halfD: 2.26, cornerR: 0.34 },  // Altar V + Rack (Parnassus)
    { cx: -6.8, cz: -27.5, halfW: 1.46, halfD: 1.46, cornerR: 0.30 },  // 1943 Cove Belfry Tower
    { cx: -5.5, cz: 0.8, halfW: 1.05, halfD: 1.05, cornerR: 0.26 },    // West Terrace Obelisk Base
    // Six stone causeway parapet side-rails (inner face at |x| = 1.55, outer face at |x| = 2.15)
    { cx: -1.85, cz: -7.5, halfW: 0.30, halfD: 6.88, cornerR: 0.14 },
    { cx: 1.85, cz: -7.5, halfW: 0.30, halfD: 6.88, cornerR: 0.14 },
    { cx: -1.85, cz: -41.0, halfW: 0.30, halfD: 6.88, cornerR: 0.14 },
    { cx: 1.85, cz: -41.0, halfW: 0.30, halfD: 6.88, cornerR: 0.14 },
    { cx: -1.85, cz: -75.0, halfW: 0.30, halfD: 6.88, cornerR: 0.14 },
    { cx: 1.85, cz: -75.0, halfW: 0.30, halfD: 6.88, cornerR: 0.14 }
  ];

  // Circular stone plinths, Armillary pedestal, Doric column rings, braziers & lecterns
  var DISC_OBSTACLES = (function buildDiscObstacles() {
    var list = [
      // Central Terrace Armillary Sphere pedestal
      { cx: 0.0, cz: 3.2, r: 0.75 },

      // Two flanking marble altars of the Parnassus Sanctuary triad
      { cx: -6.2, cz: -90.5, r: 1.08 },
      { cx: 6.2, cz: -90.5, r: 1.08 },

      // Five Curiosity plinths (compact radii so players stand comfortably close)
      { cx: -8.8, cz: 7.4, r: 0.44 },
      { cx: 8.8, cz: 7.4, r: 0.52 },
      { cx: -4.2, cz: -24.2, r: 0.50 },
      { cx: -4.2, cz: -58.2, r: 0.50 },
      { cx: -4.2, cz: -91.2, r: 0.54 },

      // Bronze tripod fire braziers
      { cx: -9.2, cz: 8.8, r: 0.52 },
      { cx: -1.8, cz: 8.8, r: 0.52 },
      { cx: 1.8, cz: 8.8, r: 0.52 },
      { cx: 9.2, cz: 8.8, r: 0.52 },
      { cx: -3.5, cz: -22.5, r: 0.52 },
      { cx: 3.5, cz: -22.5, r: 0.52 },
      { cx: -3.5, cz: -56.5, r: 0.52 },
      { cx: 3.5, cz: -56.5, r: 0.52 },
      { cx: -3.5, cz: -89.5, r: 0.52 },
      { cx: 3.5, cz: -89.5, r: 0.52 },

      // Villa Portico braziers / Linking Lectern / Harpsichord & North Parnassus Stela plinths
      { cx: -3.7, cz: 15.45, r: 0.44 },
      { cx: 3.6, cz: 15.45, r: 0.44 },
      { cx: -4.2, cz: -87.0, r: 0.46 },
      { cx: 0.0, cz: -101.5, r: 0.56 }
    ];

    // Add all 24 fluted Doric columns around the 4 promontory peristyles
    for (var p = 0; p < PROMONTORIES.length; p++) {
      var prom = PROMONTORIES[p];
      var colRingR = prom.visualR - 2.6;
      for (var i = 0; i < prom.columnAngles.length; i++) {
        var rad = (prom.columnAngles[i] * Math.PI) / 180.0;
        list.push({
          cx: prom.cx + Math.sin(rad) * colRingR,
          cz: prom.cz + Math.cos(rad) * colRingR,
          r: 0.76
        });
      }
    }
    return list;
  })();

  // Eight Scenic Myst Viewpoint Nodes with inlaid marble-and-brass compass medallions
  var SCENIC_NODES = [
    { id: 'terrace_overlook', name: 'Terrace Overlook', x: 0.0, z: 5.4, yaw: 0.0, pitch: -0.04, altarId: null },
    { id: 'west_altar', name: 'West Terrace Altar', x: -5.5, z: 13.2, yaw: 0.0, pitch: -0.11, altarId: 0 },
    { id: 'east_colonnade', name: 'East Colonnade', x: 5.5, z: 13.2, yaw: 0.0, pitch: -0.11, altarId: 1 },
    { id: 'villa_portico', name: 'Villa Bourani Portico', x: 0.0, z: 12.6, yaw: Math.PI, pitch: 0.06, altarId: null },
    { id: 'cove_overlook', name: 'Aegean Cove Overlook', x: 6.4, z: -1.8, yaw: -0.35, pitch: -0.16, altarId: 1 },
    { id: 'cove_amphitheatre', name: '1943 Cove Amphitheatre', x: 0.0, z: -18.4, yaw: 0.0, pitch: -0.11, altarId: 2 },
    { id: 'trial_court', name: 'Trial Court', x: 0.0, z: -52.4, yaw: 0.0, pitch: -0.10, altarId: 3 },
    { id: 'parnassus_sanctuary', name: 'Parnassus Sanctuary', x: 0.0, z: -85.4, yaw: 0.0, pitch: -0.09, altarId: 4 }
  ];

  var MANUAL_MOVE_KEYS = [
    'KeyW', 'KeyA', 'KeyS', 'KeyD',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Space'
  ];

  // Runtime state
  var state = {
    initialized: false,
    ctx: null,
    navGroup: null,
    navGroundMeshes: [],
    medallionMeshes: [],
    medallionHalos: [],
    hoveredNodeIdx: -1,

    // Active Myst waypoint glide state
    waypoint: null, // { queue: [{x,z}], idx, finalX, finalZ, targetYaw, targetPitch, scenicNode, stallTimer, lastProgDist }
    markerGroup: null,
    markerInnerRing: null,
    markerRipples: [],
    markerPip: null,
    markerFade: 0.0,

    // Physics, head-bob, footsteps & landing spring
    elapsedSec: 0.0,
    lastPlayerX: null,
    lastPlayerZ: null,
    wasOnGround: true,
    bobPhase: 0.0,
    bobWeight: 0.0,
    lastStepIndex: 0,
    stepCooldown: 0.0,
    landingOffset: 0.0,
    landingVel: 0.0,

    // Built-in pointer drag guard state
    pointerDown: false,
    pointerStartX: 0,
    pointerStartY: 0,
    pointerLastX: 0,
    pointerLastY: 0,
    pointerMovedDist: 0,
    lastCompletedDragDist: 0,
    lastDragEndTime: 0
  };

  function clampNum(v, lo, hi) {
    return v < lo ? lo : (v > hi ? hi : v);
  }

  function smoothstep(edge0, edge1, x) {
    var t = clampNum((x - edge0) / (edge1 - edge0 || 1), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  function wrapAngle(rad) {
    var a = (rad + Math.PI) % (Math.PI * 2.0);
    if (a < 0) a += Math.PI * 2.0;
    return a - Math.PI;
  }

  function isIntroActive(ctx) {
    var c = ctx || state.ctx;
    if (!c || c.inIntro === undefined) return false;
    return typeof c.inIntro === 'function' ? !!c.inIntro() : !!c.inIntro;
  }

  // ---------------------------------------------------------------------------
  // 1. EXACT ISLAND WALKABILITY, SURFACE CLASSIFICATION & COLLISION SOLVER
  // ---------------------------------------------------------------------------

  function isPointInsideWalkable(x, z, extraMargin) {
    var m = extraMargin || 0.0;
    for (var i = 0; i < PROMONTORIES.length; i++) {
      var p = PROMONTORIES[i];
      var dx = x - p.cx;
      var dz = z - p.cz;
      var r = p.walkableR + m;
      if (dx * dx + dz * dz <= r * r) {
        if (p.id === 0 && z > VILLA_FACADE.zMin + m && Math.abs(x) < VILLA_FACADE.halfW - m) {
          return false;
        }
        return true;
      }
    }
    for (var j = 0; j < CAUSEWAYS.length; j++) {
      var c = CAUSEWAYS[j];
      if (Math.abs(x) <= c.halfW + m && z >= c.zMin - m && z <= c.zMax + m) {
        return true;
      }
    }
    return false;
  }

  function projectOntoWalkableUnion(x, z) {
    if (isPointInsideWalkable(x, z, 0.0)) {
      return { x: x, z: z, dist: 0.0 };
    }

    // If z lies directly in the open sea channel between two headlands, clamp straight onto that causeway
    var seaGaps = [
      { cwIdx: 0, zLo: -10.65, zHi: -6.35 },
      { cwIdx: 1, zLo: -44.65, zHi: -37.35 },
      { cwIdx: 2, zLo: -78.15, zHi: -71.35 }
    ];
    for (var g = 0; g < seaGaps.length; g++) {
      var gap = seaGaps[g];
      if (z >= gap.zLo && z <= gap.zHi) {
        var gCw = CAUSEWAYS[gap.cwIdx];
        var gx = clampNum(x, -gCw.halfW, gCw.halfW);
        return { x: gx, z: z, dist: Math.abs(x - gx) };
      }
    }

    var bestX = x;
    var bestZ = z;
    var bestDistSq = Infinity;

    for (var i = 0; i < PROMONTORIES.length; i++) {
      var p = PROMONTORIES[i];
      var dx = x - p.cx;
      var dz = z - p.cz;
      var d = Math.hypot(dx, dz);
      var px = d <= p.walkableR || d < 1e-6 ? x : p.cx + (dx / d) * p.walkableR;
      var pz = d <= p.walkableR || d < 1e-6 ? z : p.cz + (dz / d) * p.walkableR;

      if (p.id === 0 && pz > VILLA_FACADE.zMin && Math.abs(px) < VILLA_FACADE.halfW) {
        var penZ = pz - VILLA_FACADE.zMin;
        var penX = VILLA_FACADE.halfW - Math.abs(px);
        if (penZ <= penX) {
          pz = VILLA_FACADE.zMin;
        } else {
          px = px < 0 ? -VILLA_FACADE.halfW : VILLA_FACADE.halfW;
        }
      }

      var errSq = (x - px) * (x - px) + (z - pz) * (z - pz);
      if (errSq < bestDistSq) {
        bestDistSq = errSq;
        bestX = px;
        bestZ = pz;
      }
    }

    for (var j = 0; j < CAUSEWAYS.length; j++) {
      var c = CAUSEWAYS[j];
      var cx = clampNum(x, -c.halfW, c.halfW);
      var cz = clampNum(z, c.zMin, c.zMax);
      var cErrSq = (x - cx) * (x - cx) + (z - cz) * (z - cz);
      if (cErrSq < bestDistSq) {
        bestDistSq = cErrSq;
        bestX = cx;
        bestZ = cz;
      }
    }

    return { x: bestX, z: bestZ, dist: Math.sqrt(bestDistSq) };
  }

  function pushOutOfVillaFacade(x, z) {
    if (z > VILLA_FACADE.zMin && z < VILLA_FACADE.zMax && Math.abs(x) < VILLA_FACADE.halfW) {
      var penFront = z - VILLA_FACADE.zMin;
      var penLeft = x + VILLA_FACADE.halfW;
      var penRight = VILLA_FACADE.halfW - x;
      if (penFront <= penLeft && penFront <= penRight) {
        z = VILLA_FACADE.zMin;
      } else if (penLeft < penRight) {
        x = -VILLA_FACADE.halfW;
      } else {
        x = VILLA_FACADE.halfW;
      }
    }
    return { x: x, z: z };
  }

  function pushOutOfInteriorObstacles(x, z) {
    var v = pushOutOfVillaFacade(x, z);
    x = v.x;
    z = v.z;

    // Rounded-rectangle stone altars, racks, belfry & obelisk
    for (var i = 0; i < ROUNDED_BOX_OBSTACLES.length; i++) {
      var box = ROUNDED_BOX_OBSTACLES[i];
      var coreW = Math.max(0.01, box.halfW - box.cornerR);
      var coreD = Math.max(0.01, box.halfD - box.cornerR);
      var qx = clampNum(x, box.cx - coreW, box.cx + coreW);
      var qz = clampNum(z, box.cz - coreD, box.cz + coreD);
      var dx = x - qx;
      var dz = z - qz;
      var dist = Math.hypot(dx, dz);

      if (dist < box.cornerR) {
        if (dist > 1e-5) {
          x = qx + (dx / dist) * box.cornerR;
          z = qz + (dz / dist) * box.cornerR;
        } else {
          // Deep inside core box: push out through nearest face
          var pL = (x - (box.cx - box.halfW));
          var pR = ((box.cx + box.halfW) - x);
          var pB = (z - (box.cz - box.halfD));
          var pF = ((box.cz + box.halfD) - z);
          var minP = Math.min(pL, pR, pB, pF);
          if (minP === pF) z = box.cz + box.halfD;
          else if (minP === pB) z = box.cz - box.halfD;
          else if (minP === pL) x = box.cx - box.halfW;
          else x = box.cx + box.halfW;
        }
      }
    }

    // Circular plinths, Armillary pedestal & Doric column rings
    for (var j = 0; j < DISC_OBSTACLES.length; j++) {
      var disc = DISC_OBSTACLES[j];
      var cdx = x - disc.cx;
      var cdz = z - disc.cz;
      var cdist = Math.hypot(cdx, cdz);
      if (cdist < disc.r) {
        if (cdist > 1e-5) {
          x = disc.cx + (cdx / cdist) * disc.r;
          z = disc.cz + (cdz / cdist) * disc.r;
        } else {
          z = disc.cz + disc.r;
        }
      }
    }

    return { x: x, z: z };
  }

  function clampPosition(x, z, prevX, prevZ) {
    var nx = Number(x);
    var nz = Number(z);
    if (!Number.isFinite(nx) || !Number.isFinite(nz)) {
      return {
        x: Number.isFinite(prevX) ? prevX : -5.5,
        z: Number.isFinite(prevZ) ? prevZ : 13.6
      };
    }

    // Sub-step if large single-frame displacement (e.g. lag spike during walk, not a deliberate teleport)
    if (Number.isFinite(prevX) && Number.isFinite(prevZ)) {
      var stepLen = Math.hypot(nx - prevX, nz - prevZ);
      if (stepLen > 0.85 && stepLen < 4.5) {
        var steps = Math.min(6, Math.ceil(stepLen / 0.65));
        var sx = prevX;
        var sz = prevZ;
        var stepX = (nx - prevX) / steps;
        var stepZ = (nz - prevZ) / steps;
        for (var s = 0; s < steps; s++) {
          var sub = solveSingleClamp(sx + stepX, sz + stepZ);
          sx = sub.x;
          sz = sub.z;
        }
        return { x: sx, z: sz };
      }
    }

    return solveSingleClamp(nx, nz);
  }

  function solveSingleClamp(x, z) {
    var p1 = pushOutOfInteriorObstacles(x, z);
    var w1 = projectOntoWalkableUnion(p1.x, p1.z);
    var p2 = pushOutOfInteriorObstacles(w1.x, w1.z);
    var w2 = projectOntoWalkableUnion(p2.x, p2.z);
    var vf = pushOutOfVillaFacade(w2.x, w2.z);
    return { x: vf.x, z: vf.z };
  }

  // ---------------------------------------------------------------------------
  // 2. TERRAIN & STEPPED CAUSEWAY ELEVATION
  // ---------------------------------------------------------------------------

  function getSurfaceType(x, z) {
    for (var j = 0; j < CAUSEWAYS.length; j++) {
      var c = CAUSEWAYS[j];
      if (Math.abs(x) <= c.halfW + 0.35 && z >= c.zArchMin && z <= c.zArchMax) {
        // Check if well onto the bridge span rather than deep inside the marble terrace
        var onSpan = true;
        for (var k = 0; k < PROMONTORIES.length; k++) {
          var pk = PROMONTORIES[k];
          if (Math.hypot(x - pk.cx, z - pk.cz) < pk.walkableR - 1.35) {
            onSpan = false;
            break;
          }
        }
        if (onSpan) return 'causeway';
      }
    }

    for (var i = 0; i < PROMONTORIES.length; i++) {
      var p = PROMONTORIES[i];
      var d = Math.hypot(x - p.cx, z - p.cz);
      if (d <= p.walkableR + 0.5) {
        if (d > p.walkableR - 0.65 && Math.abs(x) > 1.85) {
          return 'earth';
        }
        return 'marble';
      }
    }

    return 'marble';
  }

  function getGroundHeight(x, z) {
    var h = BASE_TERRACE_Y;

    // 1. Subtle outer stylobate limestone rim step near circular cliff parapets
    for (var i = 0; i < PROMONTORIES.length; i++) {
      var p = PROMONTORIES[i];
      var d = Math.hypot(x - p.cx, z - p.cz);
      if (d <= p.walkableR + 0.8 && d > p.walkableR - 0.6 && Math.abs(x) > 1.9) {
        var rimMix = smoothstep(p.walkableR - 0.55, p.walkableR - 0.1, d);
        h = BASE_TERRACE_Y - 0.06 * rimMix;
        break;
      }
    }

    // 2. Gentle arched stone crown (+0.22m peak at midpoint) across all 3 causeways
    for (var j = 0; j < CAUSEWAYS.length; j++) {
      var c = CAUSEWAYS[j];
      if (z >= c.zArchMin && z <= c.zArchMax && Math.abs(x) <= c.halfW + 0.65) {
        var halfSpan = (c.zArchMax - c.zArchMin) * 0.5;
        var normZ = clampNum((z - c.zMid) / halfSpan, -1.0, 1.0);
        var arch = Math.cos(normZ * Math.PI * 0.5);
        var lateralFade = 1.0 - smoothstep(c.halfW + 0.05, c.halfW + 0.6, Math.abs(x));
        var bridgeH = BASE_TERRACE_Y + c.crown * arch * arch * lateralFade;
        if (bridgeH > h) h = bridgeH;
      }
    }

    // 3. Villa Bourani grand marble portico steps rising near z = 15.85 .. 16.3
    if (z >= 15.82 && z <= 16.45 && Math.abs(x) <= 2.95) {
      var lateralStep = 1.0 - smoothstep(2.65, 2.95, Math.abs(x));
      var step1 = smoothstep(15.85, 16.05, z) * 0.14;
      var step2 = smoothstep(16.08, 16.28, z) * 0.14;
      var porticoH = BASE_TERRACE_Y + (step1 + step2) * lateralStep;
      if (porticoH > h) h = porticoH;
    }

    return h;
  }

  // ---------------------------------------------------------------------------
  // 3. SMART MULTI-PROMONTORY WAYPOINT ROUTING & SCENIC MEDALLIONS
  // ---------------------------------------------------------------------------

  function getPromontoryZone(z) {
    if (z > -7.5) return 0;
    if (z > -41.0) return 1;
    if (z > -75.0) return 2;
    return 3;
  }

  function segmentHitsBox(ax, az, bx, bz, minX, maxX, minZ, maxZ) {
    var steps = 16;
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var px = ax + (bx - ax) * t;
      var pz = az + (bz - az) * t;
      if (px > minX && px < maxX && pz > minZ && pz < maxZ) {
        return true;
      }
    }
    return false;
  }

  function addArmillaryDetourIfNeeded(pts, ax, az, bx, bz) {
    var steps = 14;
    for (var i = 1; i < steps; i++) {
      var t = i / steps;
      var px = ax + (bx - ax) * t;
      var pz = az + (bz - az) * t;
      if (Math.hypot(px - 0.0, pz - 3.2) < 0.95) {
        var sideArm = (ax + bx) < -0.05 ? -1.4 : 1.4;
        pts.push({ x: sideArm, z: 3.2 });
        return;
      }
    }
  }

  function addRailTipDetourIfNeeded(pts, ax, az, bx, bz, railEndZ, isNorthEnd) {
    // Clear protruding causeway side-rails (|x| <= 2.2, extending to railEndZ) when turning sharply onto headland flanks
    var crossesRail = isNorthEnd
      ? segmentHitsBox(ax, az, bx, bz, -2.25, 2.25, railEndZ - 0.15, railEndZ + 5.5)
      : segmentHitsBox(ax, az, bx, bz, -2.25, 2.25, railEndZ - 5.5, railEndZ + 0.15);
    if (crossesRail && (Math.abs(ax) > 1.5 || Math.abs(bx) > 1.5)) {
      var tipZ = isNorthEnd ? railEndZ - 0.55 : railEndZ + 0.55;
      var flankX = (ax + bx) >= 0 ? 2.45 : -2.45;
      pts.push({ x: flankX, z: tipZ });
    }
  }

  function addDetoursWithinZone(pts, sx, sz, tx, tz, zone) {
    if (zone === 0) {
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -0.6, false);
      var curS = pts.length > 0 ? pts[pts.length - 1] : { x: sx, z: sz };
      sx = curS.x;
      sz = curS.z;

      var hitsWestAltar = segmentHitsBox(sx, sz, tx, tz, -9.85, -1.15, 5.5, 10.35);
      var hitsEastAltar = segmentHitsBox(sx, sz, tx, tz, 1.15, 9.85, 5.5, 10.35);
      var hitsObelisk = segmentHitsBox(sx, sz, tx, tz, -6.75, -4.25, -0.45, 2.05);

      if (hitsWestAltar || hitsEastAltar) {
        var goingSouth = tz >= sz;
        // Choose outer colonnade walkway if both endpoints are far on the same flank, else central aisle
        var aisleX = 0.0;
        if (sx > 4.2 && tx > 4.2) aisleX = 10.55;
        else if (sx < -4.2 && tx < -4.2) aisleX = -10.55;

        var northGate = { x: aisleX, z: 4.85 };
        var southGate = { x: aisleX, z: 11.25 };

        if (goingSouth) {
          if (sz < 5.55) {
            addArmillaryDetourIfNeeded(pts, sx, sz, northGate.x, northGate.z);
            pts.push(northGate);
          }
          if (tz > 10.25) {
            pts.push(southGate);
          }
        } else {
          if (sz > 10.25) {
            pts.push(southGate);
          }
          if (tz < 5.55) {
            pts.push(northGate);
            addArmillaryDetourIfNeeded(pts, northGate.x, northGate.z, tx, tz);
          }
        }
        return;
      }

      if (hitsObelisk) {
        var obSideX = (sx + tx) * 0.5 < -5.5 ? -7.2 : -3.6;
        pts.push({ x: obSideX, z: 0.8 });
      }

      var prev = pts.length > 0 ? pts[pts.length - 1] : { x: sx, z: sz };
      addArmillaryDetourIfNeeded(pts, prev.x, prev.z, tx, tz);
      var prev2 = pts.length > 0 ? pts[pts.length - 1] : { x: sx, z: sz };
      addRailTipDetourIfNeeded(pts, prev2.x, prev2.z, tx, tz, -0.6, false);
      return;
    }

    // Clear protruding causeway side-rails on Promontories II, III, IV
    if (zone === 1) {
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -14.4, true);
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -34.1, false);
    } else if (zone === 2) {
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -47.9, true);
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -68.1, false);
    } else if (zone === 3) {
      addRailTipDetourIfNeeded(pts, sx, sz, tx, tz, -81.9, true);
    }

    // Zones 1, 2, 3 each have a central Altar + Rack spanning x in [-3.2, 3.2]
    var altarZ = zone === 1 ? -24.07 : (zone === 2 ? -58.07 : -91.07);
    var southGateZ = altarZ + 3.15;
    var northGateZ = altarZ - 3.15;
    var bypassX = zone === 3 ? 4.55 : 5.15;
    if (sx < -0.6 && tx < -0.6) {
      bypassX = zone === 3 ? -4.55 : -5.35;
    }

    if (sz > southGateZ - 0.4 && tz < northGateZ + 0.4) {
      if (Math.min(Math.abs(sx), Math.abs(tx)) < 4.2 || sx * tx <= 0) {
        pts.push({ x: bypassX, z: southGateZ + 0.55 });
        pts.push({ x: bypassX, z: northGateZ - 0.55 });
      }
    } else if (sz < northGateZ + 0.4 && tz > southGateZ - 0.4) {
      if (Math.min(Math.abs(sx), Math.abs(tx)) < 4.2 || sx * tx <= 0) {
        pts.push({ x: bypassX, z: northGateZ - 0.55 });
        pts.push({ x: bypassX, z: southGateZ + 0.55 });
      }
    }
  }

  function buildIslandPath(sx, sz, tx, tz) {
    var zStart = getPromontoryZone(sz);
    var zEnd = getPromontoryZone(tz);
    var route = [];
    var curX = sx;
    var curZ = sz;

    if (zStart === zEnd) {
      addDetoursWithinZone(route, curX, curZ, tx, tz, zStart);
      route.push({ x: tx, z: tz });
      return route;
    }

    var dir = zEnd > zStart ? 1 : -1;
    for (var zIdx = zStart; zIdx !== zEnd; zIdx += dir) {
      var cwIdx = dir > 0 ? zIdx : zIdx - 1;
      var cw = CAUSEWAYS[cwIdx];
      var entryZ = dir > 0 ? cw.zMax + 0.65 : cw.zMin - 0.65;
      var exitZ = dir > 0 ? cw.zMin - 0.65 : cw.zMax + 0.65;

      addDetoursWithinZone(route, curX, curZ, 0.0, entryZ, zIdx);
      route.push({ x: 0.0, z: entryZ });
      route.push({ x: 0.0, z: exitZ });
      curX = 0.0;
      curZ = exitZ;
    }

    addDetoursWithinZone(route, curX, curZ, tx, tz, zEnd);
    route.push({ x: tx, z: tz });
    return route;
  }

  function makeCompassMedallionTexture(THREE) {
    var canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    var c = canvas.getContext('2d');
    var cx = 128;
    var cy = 128;

    c.clearRect(0, 0, 256, 256);

    // Outer inlaid Pentelic marble & Corinthian bronze bezel
    var stoneGrad = c.createRadialGradient(cx, cy, 12, cx, cy, 120);
    stoneGrad.addColorStop(0.0, 'rgba(30, 41, 59, 0.92)');
    stoneGrad.addColorStop(0.72, 'rgba(22, 31, 48, 0.90)');
    stoneGrad.addColorStop(0.88, 'rgba(180, 134, 52, 0.94)');
    stoneGrad.addColorStop(0.96, 'rgba(248, 244, 232, 0.88)');
    stoneGrad.addColorStop(1.0, 'rgba(248, 244, 232, 0.0)');
    c.fillStyle = stoneGrad;
    c.beginPath();
    c.arc(cx, cy, 122, 0, Math.PI * 2);
    c.fill();

    // Concentric azimuth degree rings & ticks
    c.strokeStyle = 'rgba(245, 198, 92, 0.78)';
    c.lineWidth = 2.4;
    c.beginPath();
    c.arc(cx, cy, 98, 0, Math.PI * 2);
    c.stroke();

    c.strokeStyle = 'rgba(245, 198, 92, 0.42)';
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(cx, cy, 66, 0, Math.PI * 2);
    c.stroke();

    for (var t = 0; t < 32; t++) {
      var ang = (t / 32) * Math.PI * 2;
      var innerR = t % 4 === 0 ? 78 : (t % 2 === 0 ? 86 : 91);
      c.strokeStyle = t % 4 === 0 ? '#fde68a' : 'rgba(217, 175, 90, 0.55)';
      c.lineWidth = t % 4 === 0 ? 2.2 : 1.1;
      c.beginPath();
      c.moveTo(cx + Math.cos(ang) * innerR, cy + Math.sin(ang) * innerR);
      c.lineTo(cx + Math.cos(ang) * 97, cy + Math.sin(ang) * 97);
      c.stroke();
    }

    // Eight-point Aegean compass rose star
    for (var s = 0; s < 8; s++) {
      var sa = (s / 8) * Math.PI * 2 - Math.PI * 0.5;
      var tipR = s % 2 === 0 ? 62 : 42;
      var shoulderR = 13;
      c.fillStyle = s % 2 === 0 ? '#fbbf24' : '#d97706';
      c.beginPath();
      c.moveTo(cx + Math.cos(sa) * tipR, cy + Math.sin(sa) * tipR);
      c.lineTo(cx + Math.cos(sa + 0.35) * shoulderR, cy + Math.sin(sa + 0.35) * shoulderR);
      c.lineTo(cx, cy);
      c.closePath();
      c.fill();

      c.fillStyle = s % 2 === 0 ? '#fef3c7' : '#92400e';
      c.beginPath();
      c.moveTo(cx + Math.cos(sa) * tipR, cy + Math.sin(sa) * tipR);
      c.lineTo(cx + Math.cos(sa - 0.35) * shoulderR, cy + Math.sin(sa - 0.35) * shoulderR);
      c.lineTo(cx, cy);
      c.closePath();
      c.fill();
    }

    // Greek cardinal compass points (Βορράς, Ανατολή, Νότος, Δύση)
    c.font = '700 16px Georgia, serif';
    c.fillStyle = '#fef3c7';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('Β', cx, cy - 73);
    c.fillText('Ν', cx, cy + 74);
    c.fillText('Α', cx + 74, cy + 1);
    c.fillText('Δ', cx - 74, cy + 1);

    // Central golden sun boss
    c.fillStyle = '#fef08a';
    c.beginPath();
    c.arc(cx, cy, 8, 0, Math.PI * 2);
    c.fill();

    var tex = new THREE.CanvasTexture(canvas);
    if (THREE.sRGBEncoding) tex.encoding = THREE.sRGBEncoding;
    tex.needsUpdate = true;
    return tex;
  }

  function buildSceneMeshes(ctx) {
    var THREE = ctx.THREE || global.THREE;
    if (!THREE || !ctx.scene) return;

    var group = new THREE.Group();
    group.name = 'PhraxosNavGroup';
    ctx.scene.add(group);
    state.navGroup = group;
    state.navGroundMeshes = [];
    state.medallionMeshes = [];
    state.medallionHalos = [];

    var invisibleMat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });

    // 1. Invisible raycastable ground discs across all 4 Promontories
    for (var i = 0; i < PROMONTORIES.length; i++) {
      var p = PROMONTORIES[i];
      var discMesh = new THREE.Mesh(new THREE.CircleGeometry(p.walkableR + 0.35, 48), invisibleMat);
      discMesh.rotation.x = -Math.PI * 0.5;
      discMesh.position.set(p.cx, BASE_TERRACE_Y + 0.01, p.cz);
      discMesh.userData = { navRole: 'ground', promontoryId: p.id };
      group.add(discMesh);
      state.navGroundMeshes.push(discMesh);
    }

    // 2. Arched marble flagstone camber slabs + invisible raycast deck along all 3 Causeways
    var camberMat = new THREE.MeshStandardMaterial({
      color: 0xf1ece1,
      roughness: 0.72,
      metalness: 0.05
    });

    for (var j = 0; j < CAUSEWAYS.length; j++) {
      var cw = CAUSEWAYS[j];
      var segCount = 11;
      var spanLen = cw.zArchMax - cw.zArchMin;
      var segLen = spanLen / segCount;

      for (var s = 0; s < segCount; s++) {
        var sz0 = cw.zArchMin + s * segLen;
        var sz1 = sz0 + segLen;
        var zCenter = (sz0 + sz1) * 0.5;
        var h0 = getGroundHeight(0.0, sz0);
        var h1 = getGroundHeight(0.0, sz1);
        var hMid = (h0 + h1) * 0.5;
        var slopePitch = Math.atan2(h1 - h0, segLen);

        // Subtle arched stone paving slab crowning the causeway
        if (hMid > BASE_TERRACE_Y + 0.025) {
          var slabThickness = 0.10;
          var slab = new THREE.Mesh(
            new THREE.BoxGeometry(cw.halfW * 2.0 + 0.28, slabThickness, segLen + 0.06),
            camberMat
          );
          slab.position.set(0.0, hMid - slabThickness * 0.5, zCenter);
          slab.rotation.x = -slopePitch;
          slab.receiveShadow = true;
          group.add(slab);
        }

        var hitSlab = new THREE.Mesh(
          new THREE.PlaneGeometry(cw.halfW * 2.0 + 0.3, segLen + 0.08),
          invisibleMat
        );
        hitSlab.rotation.x = -Math.PI * 0.5 - slopePitch;
        hitSlab.position.set(0.0, hMid + 0.012, zCenter);
        hitSlab.userData = { navRole: 'ground', causewayId: cw.id };
        group.add(hitSlab);
        state.navGroundMeshes.push(hitSlab);
      }
    }

    // 3. Eight Scenic Myst Floor Compass Medallions
    var compassTex = makeCompassMedallionTexture(THREE);
    var medallionMat = new THREE.MeshStandardMaterial({
      map: compassTex,
      transparent: true,
      roughness: 0.35,
      metalness: 0.45,
      polygonOffset: true,
      polygonOffsetFactor: -1
    });

    for (var n = 0; n < SCENIC_NODES.length; n++) {
      var node = SCENIC_NODES[n];
      var ny = getGroundHeight(node.x, node.z);

      var medGroup = new THREE.Group();
      medGroup.position.set(node.x, ny + 0.016, node.z);
      group.add(medGroup);

      var disc = new THREE.Mesh(new THREE.CircleGeometry(0.64, 36), medallionMat);
      disc.rotation.x = -Math.PI * 0.5;
      disc.receiveShadow = true;
      disc.userData = { navRole: 'scenic_node', nodeIndex: n, nodeId: node.id };
      medGroup.add(disc);
      state.medallionMeshes.push(disc);

      var haloMat = new THREE.MeshBasicMaterial({
        color: 0xfbbf24,
        transparent: true,
        opacity: 0.28,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      var halo = new THREE.Mesh(new THREE.RingGeometry(0.64, 0.76, 36), haloMat);
      halo.rotation.x = -Math.PI * 0.5;
      halo.position.y = 0.004;
      medGroup.add(halo);
      state.medallionHalos.push(halo);
    }

    // 4. Animated Golden Concentric Waypoint Ripple Marker
    var markerGroup = new THREE.Group();
    markerGroup.visible = false;
    group.add(markerGroup);
    state.markerGroup = markerGroup;

    var innerMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    var innerRing = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.26, 36), innerMat);
    innerRing.rotation.x = -Math.PI * 0.5;
    markerGroup.add(innerRing);
    state.markerInnerRing = innerRing;

    state.markerRipples = [];
    for (var r = 0; r < 2; r++) {
      var ripMat = new THREE.MeshBasicMaterial({
        color: r === 0 ? 0xfbbf24 : 0x38bdf8,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false
      });
      var ripMesh = new THREE.Mesh(new THREE.RingGeometry(0.28, 0.35, 40), ripMat);
      ripMesh.rotation.x = -Math.PI * 0.5;
      markerGroup.add(ripMesh);
      state.markerRipples.push(ripMesh);
    }

    var pipMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      transparent: true,
      opacity: 0.85
    });
    var pip = new THREE.Mesh(new THREE.OctahedronGeometry(0.09, 0), pipMat);
    pip.position.y = 0.28;
    markerGroup.add(pip);
    state.markerPip = pip;
  }

  // ---------------------------------------------------------------------------
  // 4. DRAG GUARD & POINT-AND-CLICK WAYPOINT CONTROLLERS
  // ---------------------------------------------------------------------------

  function makeDragGuard(targetEl, thresholdPx) {
    var limit = typeof thresholdPx === 'number' ? thresholdPx : DRAG_THRESHOLD_PX;
    var active = false;
    var lastX = 0;
    var lastY = 0;
    var moved = 0;
    var completedMoved = 0;
    var completedAt = 0;

    function onMouseDown(e) {
      active = true;
      moved = 0;
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onMouseMove(e) {
      if (!active) return;
      moved += Math.hypot(e.clientX - lastX, e.clientY - lastY);
      lastX = e.clientX;
      lastY = e.clientY;
    }
    function onMouseUp() {
      if (active) {
        completedMoved = moved;
        completedAt = Date.now();
        active = false;
      }
    }
    function onTouchStart(e) {
      if (e.touches && e.touches.length === 1) {
        active = true;
        moved = 0;
        lastX = e.touches[0].clientX;
        lastY = e.touches[0].clientY;
      }
    }
    function onTouchMove(e) {
      if (!active || !e.touches || e.touches.length !== 1) return;
      moved += Math.hypot(e.touches[0].clientX - lastX, e.touches[0].clientY - lastY);
      lastX = e.touches[0].clientX;
      lastY = e.touches[0].clientY;
    }
    function onTouchEnd() {
      if (active) {
        completedMoved = moved;
        completedAt = Date.now();
        active = false;
      }
    }

    if (targetEl && typeof targetEl.addEventListener === 'function') {
      targetEl.addEventListener('mousedown', onMouseDown, { passive: true });
      targetEl.addEventListener('touchstart', onTouchStart, { passive: true });
      targetEl.addEventListener('touchmove', onTouchMove, { passive: true });
      targetEl.addEventListener('touchend', onTouchEnd, { passive: true });
      if (typeof global.addEventListener === 'function') {
        global.addEventListener('mousemove', onMouseMove, { passive: true });
        global.addEventListener('mouseup', onMouseUp, { passive: true });
      }
    }

    return {
      isDrag: function (customLimit) {
        var thr = typeof customLimit === 'number' ? customLimit : limit;
        if (active) return moved > thr;
        if (Date.now() - completedAt < 450) return completedMoved > thr;
        return false;
      },
      getDistance: function () {
        return active ? moved : completedMoved;
      },
      reset: function () {
        moved = 0;
        completedMoved = 0;
      },
      destroy: function () {
        if (!targetEl || typeof targetEl.removeEventListener !== 'function') return;
        targetEl.removeEventListener('mousedown', onMouseDown);
        targetEl.removeEventListener('touchstart', onTouchStart);
        targetEl.removeEventListener('touchmove', onTouchMove);
        targetEl.removeEventListener('touchend', onTouchEnd);
        if (typeof global.removeEventListener === 'function') {
          global.removeEventListener('mousemove', onMouseMove);
          global.removeEventListener('mouseup', onMouseUp);
        }
      }
    };
  }

  function wasDragGesture(thresholdPx) {
    var thr = typeof thresholdPx === 'number' ? thresholdPx : DRAG_THRESHOLD_PX;
    if (state.pointerDown && state.pointerMovedDist > thr) return true;
    if (Date.now() - state.lastDragEndTime < 450 && state.lastCompletedDragDist > thr) return true;
    return false;
  }

  function startWaypointTo(rawX, rawZ, scenicNode, ctx) {
    var activeCtx = ctx || state.ctx;
    if (!activeCtx || !activeCtx.player) return false;

    var clamped = clampPosition(rawX, rawZ);
    var tx = clamped.x;
    var tz = clamped.z;
    var player = activeCtx.player;

    var totalDist = Math.hypot(tx - player.x, tz - player.z);
    if (totalDist < 0.22 && !scenicNode) {
      return false;
    }

    state.lastPlayerX = player.x;
    state.lastPlayerZ = player.z;

    var queue = buildIslandPath(player.x, player.z, tx, tz);
    state.waypoint = {
      queue: queue,
      idx: 0,
      finalX: tx,
      finalZ: tz,
      targetYaw: scenicNode && typeof scenicNode.yaw === 'number' ? scenicNode.yaw : null,
      targetPitch: scenicNode && typeof scenicNode.pitch === 'number' ? scenicNode.pitch : null,
      scenicNode: scenicNode || null,
      stallTimer: 0.0,
      lastCheckX: player.x,
      lastCheckZ: player.z
    };

    if (state.markerGroup) {
      var gy = getGroundHeight(tx, tz);
      state.markerGroup.position.set(tx, gy + 0.022, tz);
      state.markerGroup.visible = true;
      state.markerFade = 1.0;
    }

    return true;
  }

  function resolveGroundHit(raycaster) {
    if (!raycaster) return null;

    // 1. Check direct hit on one of the 8 Scenic Floor Compass Medallions
    if (state.medallionMeshes.length > 0) {
      var medHits = raycaster.intersectObjects(state.medallionMeshes, false);
      if (medHits.length > 0) {
        var idx = medHits[0].object.userData.nodeIndex;
        var node = SCENIC_NODES[idx];
        if (node) {
          return { x: node.x, z: node.z, scenicNode: node, nodeIndex: idx };
        }
      }
    }

    // 2. Intersect invisible promontory & arched causeway meshes
    var hitPoint = null;
    if (state.navGroundMeshes.length > 0) {
      var gHits = raycaster.intersectObjects(state.navGroundMeshes, false);
      if (gHits.length > 0) {
        hitPoint = gHits[0].point;
      }
    }

    // 3. Analytical horizontal plane fallback at terrace elevation
    if (!hitPoint && raycaster.ray && raycaster.ray.direction.y < -0.015) {
      var t = (BASE_TERRACE_Y - raycaster.ray.origin.y) / raycaster.ray.direction.y;
      if (t > 0.2 && t < 160.0) {
        hitPoint = {
          x: raycaster.ray.origin.x + raycaster.ray.direction.x * t,
          z: raycaster.ray.origin.z + raycaster.ray.direction.z * t
        };
      }
    }

    if (!hitPoint) return null;

    // Reject distant clicks on open Aegean water or far horizon crags (> 2.2m outside stone parapets)
    var proj = projectOntoWalkableUnion(hitPoint.x, hitPoint.z);
    if (proj.dist > 2.2) return null;

    // Snap cleanly if clicking right beside one of the 8 Scenic Compass Medallions
    for (var i = 0; i < SCENIC_NODES.length; i++) {
      var sn = SCENIC_NODES[i];
      if (Math.hypot(proj.x - sn.x, proj.z - sn.z) <= 0.92) {
        return { x: sn.x, z: sn.z, scenicNode: sn, nodeIndex: i };
      }
    }

    return { x: proj.x, z: proj.z, scenicNode: null, nodeIndex: -1 };
  }

  function onGroundHover(raycaster, ctx) {
    if (isIntroActive(ctx) || !raycaster) {
      state.hoveredNodeIdx = -1;
      return { hit: false, isScenicNode: false, node: null, label: null };
    }
    var res = resolveGroundHit(raycaster);
    if (!res) {
      state.hoveredNodeIdx = -1;
      return { hit: false, isScenicNode: false, node: null, label: null };
    }
    state.hoveredNodeIdx = res.nodeIndex;
    if (res.scenicNode) {
      return {
        hit: true,
        isScenicNode: true,
        node: res.scenicNode,
        label: '🧭 Click to glide: ' + res.scenicNode.name
      };
    }
    return {
      hit: true,
      isScenicNode: false,
      node: null,
      label: null
    };
  }

  function onGroundClick(raycaster, ctx) {
    var activeCtx = ctx || state.ctx;
    if (isIntroActive(activeCtx)) return false;
    if (wasDragGesture(DRAG_THRESHOLD_PX)) return false;

    var res = resolveGroundHit(raycaster);
    if (!res) return false;

    return startWaypointTo(res.x, res.z, res.scenicNode, activeCtx);
  }

  function onCanvasClick(event, raycaster, ctx) {
    var activeCtx = ctx || state.ctx;
    if (isIntroActive(activeCtx)) return false;
    if (wasDragGesture(DRAG_THRESHOLD_PX)) return false;

    var THREE = (activeCtx && activeCtx.THREE) || global.THREE;
    var cam = activeCtx && activeCtx.camera;
    var canvas = (activeCtx && activeCtx.canvas) || (event && event.currentTarget);
    var rc = raycaster || (activeCtx && activeCtx.raycaster);
    if (!rc) return false;

    if (event && typeof event.clientX === 'number' && THREE && cam && canvas && canvas.getBoundingClientRect) {
      var rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        var ndc = new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -((event.clientY - rect.top) / rect.height) * 2 + 1
        );
        rc.setFromCamera(ndc, cam);
      }
    }

    // Never hijack clicks on 3D Altar tablets, sockets, curiosities, machinery, or stelae
    if (activeCtx && Array.isArray(activeCtx.interactables) && activeCtx.interactables.length > 0) {
      var objHits = rc.intersectObjects(activeCtx.interactables, false);
      for (var i = 0; i < objHits.length; i++) {
        if (objHits[i].object && objHits[i].object.visible) {
          return false;
        }
      }
    }

    return onGroundClick(rc, activeCtx);
  }

  function cancelWaypoint() {
    state.waypoint = null;
  }

  function isWaypointActive() {
    return state.waypoint !== null;
  }

  function glideToNode(nodeIdOrIndex, ctx) {
    var node = null;
    if (typeof nodeIdOrIndex === 'number') {
      node = SCENIC_NODES[nodeIdOrIndex] || null;
    } else if (typeof nodeIdOrIndex === 'string') {
      for (var i = 0; i < SCENIC_NODES.length; i++) {
        if (SCENIC_NODES[i].id === nodeIdOrIndex) {
          node = SCENIC_NODES[i];
          break;
        }
      }
    }
    if (!node) return false;
    return startWaypointTo(node.x, node.z, node, ctx || state.ctx);
  }

  function getScenicNodes() {
    return SCENIC_NODES.map(function (n) {
      return { id: n.id, name: n.name, x: n.x, z: n.z, yaw: n.yaw, pitch: n.pitch, altarId: n.altarId };
    });
  }

  // ---------------------------------------------------------------------------
  // 5. INITIALISATION & FRAME UPDATE LOOP
  // ---------------------------------------------------------------------------

  function attachInputHooks(ctx) {
    if (!ctx) return;
    var canvas = ctx.canvas || (typeof document !== 'undefined' ? document.getElementById('webgl-canvas') : null);

    if (canvas && !canvas.__phraxosNavHooked) {
      canvas.__phraxosNavHooked = true;

      canvas.addEventListener('mousedown', function (e) {
        state.pointerDown = true;
        state.pointerMovedDist = 0;
        state.pointerStartX = e.clientX;
        state.pointerStartY = e.clientY;
        state.pointerLastX = e.clientX;
        state.pointerLastY = e.clientY;
      }, { passive: true });

      if (typeof global.addEventListener === 'function') {
        global.addEventListener('mousemove', function (e) {
          if (state.pointerDown) {
            state.pointerMovedDist += Math.hypot(e.clientX - state.pointerLastX, e.clientY - state.pointerLastY);
            state.pointerLastX = e.clientX;
            state.pointerLastY = e.clientY;
            return;
          }
          // Subtle passive compass-medallion hover highlight
          var THREE = ctx.THREE || global.THREE;
          if (THREE && ctx.camera && state.medallionMeshes.length > 0 && !isIntroActive(ctx)) {
            var rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              var hoverRay = new THREE.Raycaster();
              hoverRay.setFromCamera(
                new THREE.Vector2(
                  ((e.clientX - rect.left) / rect.width) * 2 - 1,
                  -((e.clientY - rect.top) / rect.height) * 2 + 1
                ),
                ctx.camera
              );
              var mHits = hoverRay.intersectObjects(state.medallionMeshes, false);
              state.hoveredNodeIdx = mHits.length > 0 ? mHits[0].object.userData.nodeIndex : -1;
            }
          }
        }, { passive: true });

        global.addEventListener('mouseup', function () {
          if (state.pointerDown) {
            state.lastCompletedDragDist = state.pointerMovedDist;
            state.lastDragEndTime = Date.now();
            state.pointerDown = false;
          }
        }, { passive: true });
      }

      canvas.addEventListener('touchstart', function (e) {
        if (e.touches && e.touches.length === 1) {
          state.pointerDown = true;
          state.pointerMovedDist = 0;
          state.pointerLastX = e.touches[0].clientX;
          state.pointerLastY = e.touches[0].clientY;
        }
      }, { passive: true });

      canvas.addEventListener('touchmove', function (e) {
        if (!state.pointerDown || !e.touches || e.touches.length !== 1) return;
        state.pointerMovedDist += Math.hypot(
          e.touches[0].clientX - state.pointerLastX,
          e.touches[0].clientY - state.pointerLastY
        );
        state.pointerLastX = e.touches[0].clientX;
        state.pointerLastY = e.touches[0].clientY;
      }, { passive: true });

      canvas.addEventListener('touchend', function () {
        if (state.pointerDown) {
          state.lastCompletedDragDist = state.pointerMovedDist;
          state.lastDragEndTime = Date.now();
          state.pointerDown = false;
        }
      }, { passive: true });
    }

    if (typeof global.addEventListener === 'function' && !global.__phraxosNavKeyHooked) {
      global.__phraxosNavKeyHooked = true;
      global.addEventListener('keydown', function (e) {
        if (!state.waypoint) return;
        if (MANUAL_MOVE_KEYS.indexOf(e.code) !== -1 || /^Digit[1-5]$/.test(e.code)) {
          cancelWaypoint();
        }
      }, { passive: true });
    }
  }

  function init(ctx) {
    if (!ctx) return;
    state.ctx = ctx;
    if (!state.initialized) {
      buildSceneMeshes(ctx);
      attachInputHooks(ctx);
      if (ctx.player) {
        state.lastPlayerX = ctx.player.x;
        state.lastPlayerZ = ctx.player.z;
        state.wasOnGround = ctx.player.onGround !== false;
      }
      state.initialized = true;
    }
  }

  function hasManualMovementInput(keys) {
    if (!keys) return false;
    for (var i = 0; i < MANUAL_MOVE_KEYS.length; i++) {
      if (keys[MANUAL_MOVE_KEYS[i]]) return true;
    }
    return false;
  }

  function updateWaypointGlide(dt, player, ctx) {
    var wp = state.waypoint;
    if (!wp) return;

    if (hasManualMovementInput(ctx && ctx.keys)) {
      cancelWaypoint();
      return;
    }

    var target = wp.queue[wp.idx];
    if (!target) {
      cancelWaypoint();
      return;
    }

    var dx = target.x - player.x;
    var dz = target.z - player.z;
    var dist = Math.hypot(dx, dz);
    var isFinalLeg = wp.idx >= wp.queue.length - 1;

    if (dist < (isFinalLeg ? 0.14 : 0.42)) {
      if (!isFinalLeg) {
        wp.idx += 1;
        wp.stallTimer = 0.0;
        wp.lastCheckX = player.x;
        wp.lastCheckZ = player.z;
        target = wp.queue[wp.idx];
        dx = target.x - player.x;
        dz = target.z - player.z;
        dist = Math.hypot(dx, dz);
        isFinalLeg = wp.idx >= wp.queue.length - 1;
      } else {
        player.x = target.x;
        player.z = target.z;
        if (!state.pointerDown) {
          if (typeof wp.targetYaw === 'number') {
            player.yaw += wrapAngle(wp.targetYaw - player.yaw) * 0.35;
          }
          if (typeof wp.targetPitch === 'number') {
            player.pitch += (wp.targetPitch - player.pitch) * 0.35;
          }
        }
        if (wp.scenicNode && typeof wp.scenicNode.altarId === 'number' && ctx && typeof ctx.setActiveAltarUI === 'function') {
          var curId = typeof ctx.getCurrentAltarId === 'function' ? ctx.getCurrentAltarId() : -1;
          if (curId !== wp.scenicNode.altarId) {
            ctx.setActiveAltarUI(wp.scenicNode.altarId);
          }
        }
        cancelWaypoint();
        return;
      }
    }

    var remFinalDist = Math.hypot(wp.finalX - player.x, wp.finalZ - player.z);
    var easeFactor = isFinalLeg ? clampNum(0.35 + (remFinalDist / 1.35) * 0.65, 0.35, 1.0) : 1.0;
    var speedMult = Number(player.speedMultiplier) || 1.0;
    var stepSpeed = GLIDE_SPEED * speedMult * easeFactor;
    var moveStep = Math.min(dist, stepSpeed * dt);

    if (dist > 1e-5) {
      var prevX = player.x;
      var prevZ = player.z;
      var nextX = prevX + (dx / dist) * moveStep;
      var nextZ = prevZ + (dz / dist) * moveStep;
      var clamped = clampPosition(nextX, nextZ, prevX, prevZ);
      player.x = clamped.x;
      player.z = clamped.z;

      // Gently align gaze with walking bearing (or arrival scenic vista near end of glide)
      if (!state.pointerDown) {
        var desiredYaw = (isFinalLeg && remFinalDist < 1.15 && typeof wp.targetYaw === 'number')
          ? wp.targetYaw
          : Math.atan2(-dx, -dz);
        player.yaw += wrapAngle(desiredYaw - player.yaw) * Math.min(1.0, 4.2 * dt);

        if (isFinalLeg && remFinalDist < 1.6 && typeof wp.targetPitch === 'number') {
          player.pitch += (wp.targetPitch - player.pitch) * Math.min(1.0, 3.2 * dt);
        }
      }
    }

    // Safety stall detector in case an unexpected obstacle blocks progress
    wp.stallTimer += dt;
    if (wp.stallTimer >= 0.45) {
      var progressed = Math.hypot(player.x - wp.lastCheckX, player.z - wp.lastCheckZ);
      wp.lastCheckX = player.x;
      wp.lastCheckZ = player.z;
      wp.stallTimer = 0.0;
      if (progressed < 0.12) {
        cancelWaypoint();
      }
    }
  }

  function animateVisualMarkers(dt) {
    var t = state.elapsedSec;

    // Pulse scenic compass medallions on the marble floor
    for (var i = 0; i < state.medallionHalos.length; i++) {
      var halo = state.medallionHalos[i];
      var isTarget = state.waypoint && state.waypoint.scenicNode && state.waypoint.scenicNode.id === SCENIC_NODES[i].id;
      var isHover = state.hoveredNodeIdx === i;
      var baseOp = isTarget ? 0.72 : (isHover ? 0.56 : 0.24);
      var pulse = 1.0 + (isTarget || isHover ? 0.08 : 0.03) * Math.sin(t * 3.4 + i * 0.9);
      halo.scale.set(pulse, pulse, 1.0);
      halo.material.opacity = baseOp + 0.08 * Math.sin(t * 2.8 + i);
    }

    // Animate concentric golden Myst waypoint ripple marker
    if (!state.markerGroup) return;
    if (state.waypoint) {
      state.markerFade = Math.min(1.0, state.markerFade + dt * 5.0);
    } else {
      state.markerFade = Math.max(0.0, state.markerFade - dt * 3.5);
    }

    if (state.markerFade <= 0.005) {
      state.markerGroup.visible = false;
      return;
    }

    state.markerGroup.visible = true;
    var fade = state.markerFade;

    if (state.markerInnerRing) {
      var innerSc = 0.92 + 0.1 * Math.sin(t * 5.2);
      state.markerInnerRing.scale.set(innerSc, innerSc, 1.0);
      state.markerInnerRing.material.opacity = 0.85 * fade;
    }

    for (var r = 0; r < state.markerRipples.length; r++) {
      var rip = state.markerRipples[r];
      var phase = (t * 0.95 + r * 0.5) % 1.0;
      var sc = 0.75 + phase * 2.35;
      rip.scale.set(sc, sc, 1.0);
      rip.material.opacity = (1.0 - phase) * 0.68 * fade;
    }

    if (state.markerPip) {
      state.markerPip.position.y = 0.28 + 0.06 * Math.sin(t * 4.2);
      state.markerPip.rotation.y += dt * 2.2;
      state.markerPip.material.opacity = 0.88 * fade;
    }
  }

  function update(dt, now, ctx) {
    var activeCtx = ctx || state.ctx;
    var safeDt = clampNum(Number(dt) || 0.016, 0.0005, 0.05);
    state.elapsedSec += safeDt;
    if (state.stepCooldown > 0) {
      state.stepCooldown = Math.max(0.0, state.stepCooldown - safeDt);
    }

    if (!activeCtx || !activeCtx.player || isIntroActive(activeCtx)) {
      animateVisualMarkers(safeDt);
      return {
        speed: 0.0,
        moving: false,
        surfaceType: 'marble',
        stepTriggered: false
      };
    }

    var player = activeCtx.player;

    if (state.lastPlayerX === null || state.lastPlayerZ === null) {
      state.lastPlayerX = player.x;
      state.lastPlayerZ = player.z;
    }

    // Detect external teleportation (Digit 1-5 or Linking Book) so waypoints cancel cleanly
    var externalJumpDist = Math.hypot(player.x - state.lastPlayerX, player.z - state.lastPlayerZ);
    if (externalJumpDist > 2.6) {
      cancelWaypoint();
      state.lastPlayerX = player.x;
      state.lastPlayerZ = player.z;
    }

    // Advance active point-and-click Myst waypoint glide
    if (state.waypoint) {
      updateWaypointGlide(safeDt, player, activeCtx);
    }

    // Enforce exact island walkability & interior obstacle collision
    var clamped = clampPosition(player.x, player.z, state.lastPlayerX, state.lastPlayerZ);
    player.x = clamped.x;
    player.z = clamped.z;

    // Measure true horizontal stride velocity across stone flagstones
    var frameMoveDist = Math.hypot(player.x - state.lastPlayerX, player.z - state.lastPlayerZ);
    var horizSpeed = frameMoveDist / safeDt;
    if (horizSpeed > 32.0) horizSpeed = 0.0;
    var moving = horizSpeed > 0.32;

    state.lastPlayerX = player.x;
    state.lastPlayerZ = player.z;

    var groundH = getGroundHeight(player.x, player.z);
    var groundDelta = groundH - BASE_TERRACE_Y;
    var surfaceType = getSurfaceType(player.x, player.z);
    var baseEyeTarget = (Number(player.targetEyeHeight) || BASE_EYE_HEIGHT) + groundDelta;

    var stepTriggered = false;
    var onGroundNow = player.onGround !== false;

    // Ensure jumping over raised causeways or portico steps lands cleanly on elevated stone
    if (!onGroundNow && player.y <= baseEyeTarget) {
      player.y = baseEyeTarget;
      player.vy = 0;
      player.onGround = true;
      onGroundNow = true;
    }

    // Trigger damped stone landing spring upon touching down from a jump
    if (onGroundNow && !state.wasOnGround) {
      state.landingVel = -1.25;
      if (state.stepCooldown <= 0.0) {
        stepTriggered = true;
        state.stepCooldown = 0.24;
      }
    }
    state.wasOnGround = onGroundNow;

    // Integrate damped landing spring
    var springAccel = -135.0 * state.landingOffset - 17.5 * state.landingVel;
    state.landingVel += springAccel * safeDt;
    state.landingOffset = clampNum(state.landingOffset + state.landingVel * safeDt, -0.13, 0.06);
    if (Math.abs(state.landingOffset) < 0.0005 && Math.abs(state.landingVel) < 0.005) {
      state.landingOffset = 0.0;
      state.landingVel = 0.0;
    }

    // Subtle grounded Myst stone-stride head-bob & rhythmic footstep cadence
    var targetBobWeight = (moving && onGroundNow) ? clampNum(horizSpeed / 6.5, 0.25, 1.25) : 0.0;
    state.bobWeight += (targetBobWeight - state.bobWeight) * Math.min(1.0, 9.0 * safeDt);

    if (moving && onGroundNow) {
      var stepOmega = clampNum(horizSpeed * 0.84, 3.6, 8.2);
      state.bobPhase += stepOmega * safeDt;
      var curStepIndex = Math.floor(state.bobPhase / Math.PI);
      if (curStepIndex > state.lastStepIndex && state.stepCooldown <= 0.0) {
        stepTriggered = true;
        state.stepCooldown = 0.26;
      }
      state.lastStepIndex = curStepIndex;
    } else {
      state.lastStepIndex = Math.floor(state.bobPhase / Math.PI);
    }

    var bobOffset = Math.sin(state.bobPhase * 2.0) * 0.032 * state.bobWeight;

    // Smoothly ground camera eye height to stepped stone elevation + head-bob + landing spring
    if (onGroundNow) {
      var desiredEyeY = baseEyeTarget + bobOffset + state.landingOffset;
      player.y += (desiredEyeY - player.y) * Math.min(1.0, 14.0 * safeDt);
    }

    // Keep camera synced if update() runs after the host camera transform step
    if (activeCtx.camera) {
      var sinY = Math.sin(player.yaw);
      var cosY = Math.cos(player.yaw);
      var cosP = Math.cos(player.pitch);
      activeCtx.camera.position.set(player.x, player.y, player.z);
      activeCtx.camera.lookAt(
        player.x - sinY * cosP * 10.0,
        player.y + Math.sin(player.pitch) * 10.0,
        player.z - cosY * cosP * 10.0
      );
    }

    animateVisualMarkers(safeDt);

    return {
      speed: horizSpeed,
      moving: moving,
      surfaceType: surfaceType,
      stepTriggered: stepTriggered,
      groundHeight: groundH,
      waypointActive: state.waypoint !== null
    };
  }

  global.PhraxosNav = {
    init: init,
    update: update,
    onGroundClick: onGroundClick,
    onCanvasClick: onCanvasClick,
    onGroundHover: onGroundHover,
    cancelWaypoint: cancelWaypoint,
    isWaypointActive: isWaypointActive,
    getGroundHeight: getGroundHeight,
    getSurfaceType: getSurfaceType,
    clampPosition: clampPosition,
    makeDragGuard: makeDragGuard,
    wasDragGesture: wasDragGesture,
    getScenicNodes: getScenicNodes,
    glideToNode: glideToNode
  };
})(typeof window !== 'undefined' ? window : globalThis);
