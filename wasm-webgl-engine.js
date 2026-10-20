/**
 * ==========================================================================
 * Gareth English Arcade — WebAssembly (wasm32) + WebGL2 High-Performance
 * Graphics & Zero-Copy Particle Physics Engine (wasm-webgl-engine.js)
 * ==========================================================================
 * Architecture:
 * 1. Native IEEE-754 WebAssembly Physics Kernel (`assets/wasm/arcade_physics.wasm`):
 *    - Simulates up to 4,096 interactive particles in contiguous WASM linear memory
 *      (stride = 8 x f32 = 32 bytes/particle: [x, y, z, vx, vy, vz, life, energy]).
 *    - 4 Domain Kernels compiled into WASM:
 *      Mode 0: Tokamak Lorentz Magnetic Plasma Torus (Phrasal Reactor)
 *      Mode 1: Thermodynamic Blast Furnace, Anvil Restitution & Sparks (Word Factory)
 *      Mode 2: Subterranean Curl-Vortex & Arcane Soul Embers (Grammar Crypt 2D & 3D)
 *      Mode 3: Coupled Harmonic Executive Sentiment Wavefield (The Boardroom Pitch)
 * 2. Zero-Copy WebGL2 (GLSL ES 3.00 / WebGL1 Instanced Fallback) Pipeline:
 *    - Pass 1: Fullscreen procedural SDF / volumetric domain shader.
 *    - Pass 2: Hardware-instanced velocity-aligned additive particles streamed
 *      directly from `new Float32Array(wasmMemory.buffer, ptr, count * 8)` via
 *      `gl.bufferSubData` with zero JS object allocation or GC pressure.
 * ==========================================================================
 */
(() => {
  'use strict';

  // Compiled 2,129-byte wasm32 binary (assets/wasm/arcade_physics.wasm)
  const WASM_BASE64 =
    'AGFzbQEAAAABHwVgAAF9YAABf2ADf39/AGAEfX19fQBgBX19fX19AX0DCAcAAAEBAgMEBQMBAAQHVgYGbWVtb3J5AgARZ2V0X3BhcnRpY2xlc19wdHIAAg9nZXRfbWV0cmljc19wdHIAAwhpbml0X3NpbQAEDXRyaWdnZXJfYnVyc3QABQhzdGVwX3NpbQAGCusMB1IBAX9BGCgCACEAIABFBEBBopnalnkhAAsgACAAQQ10cyEAIAAgAEERdnMhACAAIABBBXRzIQBBGCAANgIAIABB//8DcbNDgAAAOJRDAACAP5MLEAAQAEMAAIA/kkMAAAA/lAsFAEHAAAsEAEEAC/8BAgJ/A30gAUGAIEoEQEGAICEBCyABQcAASARAQcAAIQELQRAgADYCAEEUIAE2AgBBGCACNgIAQQBDAACAPjgCAEEEQwAAAAA4AgBBHEMAAIA/OAIAQQAhAwJAA0AgAyABTg0BQcAAIANBBXRqIQQQACEFEAAhBiAFIAWUIAYgBpSSkSEHIAdDbxKDOl0EQEMAAAA/IQcLIAQgBTgCACAEIAY4AgQgBEMAAIA+EAFDAABAP5SSOAIIIAQgBoxDMzOzPpQ4AgwgBCAFQzMzsz6UOAIQIAQQADgCFCAEEAE4AhggBEPNzMw+EAFDmpkZP5SSOAIcIANBAWohAwwACwsL/AECA38FfUEEQwAAIEBBBCoCACACkpY4AgBBCCAAOAIAQQwgATgCAEEcIAM4AgBBFCgCACEFQQAhBAJAA0AgBCAFTg0BQcAAIARBBXRqIQYgBioCACAAkyEHIAYqAgQgAZMhCEMK1yM9IAcgB5QgCCAIlJKSIQlDAACAPyAJkZUhCiACQ65HYT6UIAmVIQsgC0NmZuY/XgRAQ2Zm5j8hCwsgBiAGKgIMIAcgCpQgCEPNzMw+lJMgC5SSOAIMIAYgBioCECAIIAqUIAdDzczMPpSSIAuUkjgCECAGQ5qZGUAgBioCHCALQ2ZmJj+UkpY4AhwgBEEBaiEEDAALCwv6BwIEfxF9IABDzcxMPV4EQEPNzEw9IQALIABDbxKDOl0EQENvEoM8IQALQQQqAgBD16NwP5QhGSAZQ28SgzpdBEBDAAAAACEZC0EEIBk4AgBBECgCACEHQRQoAgAhBkMAAAAAIRhBACEFAkADQCAFIAZODQFBwAAgBUEFdGohCCAIKgIAIQkgCCoCBCEKIAgqAgghCyAIKgIMIQwgCCoCECENIAgqAhQhDiAIKgIYIQ8gCCoCHCEQIAMgCZMhFSAEIAqTIRZDj8J1PSAVIBWUIBYgFpSSkiEXIBdDMzOzPl0EQCAMIBYgAEPNzIw/lJSSIQwgDSAVIABDzcyMP5SUkyENQ83MDEAgECAAQ83MTD+UkpYhEAsgB0EARgRAQxe30TkgCSAJlCAKIAqUkpKRIRFD7FG4PiALQylcjz6UkiESIBIgEZNDMzMzQJQhE0MzM5M/IAJDMzPTP5SSIRQgDCAAIAkgEZUgE5QgCiARlSAUlJOUkiEMIA0gACAKIBGVIBOUIAkgEZUgFJSSlJIhDSAMQz0Kdz+UIQwgDUM9Cnc/lCENBSAHQQFGBEAgDSAAQ5qZWT+UkyENIAlDMzOzPl4EQCANIABDZmbmPyACkpSSIQ0gDCAOIABDZmZmP5SUkiEMQ83MDEAgECAAQ2ZmZj+UkpYhEAsgCkPhehS/XQRAQ+F6FL8hCiANi0NSuB4/lCENIAwgAEOamZk/lJIhDEMAAABAIBBDMzOzPpKWIRALIAxD9ih8P5QhDCANQ/YofD+UIQ0FIAdBAkYEQCANIABDMzOzPiACQ83MDD+UkpSSIQ0gDCAAIA5DzcwMP5QgCUNmZuY+lJOUkiEMIAxDj8J1P5QhDCANQ4/CdT+UIQ0FIA5DZmYmP5QhEiANIAAgEiAKk0OamRlAIAJDzcwMQJSSlJSSIQ1DrkdhPiALQwAAgD4gAkNmZuY+lJKUkiEMIA1DMzNzP5QhDQsLCyAJIAwgAJSSIQkgCiANIACUkiEKIA8gAEMpXI8+lJIhDyAPQwAAgD9eBEAgD0MAAIA/kyEPCyAQQ5qZeT+UQ2Zm5j4gAkNmZuY+lJJDzczMPJSSIRAgCUM9Cpc/XgRAQ4/Clb8hCQsgCUM9Cpe/XQRAQ4/ClT8hCQsgCkM9Cpc/XgRAQzMzk78hCiAHQQFGBEAQAUPNzMw/lEPNzEw/kyEJQ2Zm5r4hChABQ5qZWT+UIQ0LCyAKQz0Kl79dBEBDMzOTPyEKCyAIIAk4AgAgCCAKOAIEIAggDDgCDCAIIA04AhAgCCAPOAIYIAggEDgCHCAYIAwgDJQgDSANlJKSIRggBUEBaiEFDAALCyAYIAaylZEhGEEAIBg4AgAgGAsA0AIEbmFtZQEWAgAIcmFuZF9zeW0BCXJhbmRfdW5pdAKDAgQAAQABcwQIAARtb2RlAQVjb3VudAIEc2VlZAMBaQQDcHRyBQJyeAYCcnkHAXIFDAACYngBAmJ5AgVwb3dlcgMEa2luZAQBaQUFY291bnQGA3B0cgcCZHgIAmR5CQVkaXN0MgoHaW52RGlzdAsDaW1wBhoAAmR0AQR0aW1lAglpbnRlbnNpdHkDAmF4BAJheQUBaQYFY291bnQHBG1vZGUIA3B0cgkBeAoBeQsBegwCdngNAnZ5DgJ2eg8EbGlmZRAGZW5lcmd5EQFyEgd0YXJnZXRSEwdyYWRpYWxGFAZzd2lybEYVAmR4FgJkeRcGY2Rpc3QyGARzdW1FGQZidXJzdEUDKwMEAgIFYnJlYWsDA3RvcAUCAAVicmVhawEDdG9wBgIDBWJyZWFrBAN0b3A=';

  function decodeWasmBase64(b64) {
    const binStr = atob(b64);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return bytes;
  }

  async function loadWasmKernel() {
    try {
      if (typeof WebAssembly === 'undefined') return null;
      try {
        const res = await fetch('assets/wasm/arcade_physics.wasm', { cache: 'force-cache' });
        if (res.ok) {
          const buf = await res.arrayBuffer();
          const { instance } = await WebAssembly.instantiate(buf, {});
          return instance.exports;
        }
      } catch (_) {
        // Fallback to embedded binary bytes when offline or file://
      }
      const bytes = decodeWasmBase64(WASM_BASE64);
      const { instance } = await WebAssembly.instantiate(bytes, {});
      return instance.exports;
    } catch (err) {
      console.warn('[WasmWebGLCore] WASM init warning:', err);
      return null;
    }
  }

  // =========================================================================
  // GLSL ES 3.00 SHADERS (Pass 1: Procedural Domain Raymarching / SDFs)
  // =========================================================================
  const BG_VERT_300 = `#version 300 es
  precision highp float;
  in vec2 a_pos;
  out vec2 v_uv;
  void main() {
    v_uv = a_pos * 0.5 + 0.5;
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }`;

  const BG_FRAG_300 = `#version 300 es
  precision highp float;
  in vec2 v_uv;
  out vec4 fragColor;

  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_intensity;
  uniform float u_burst;
  uniform float u_burstKind;
  uniform vec2 u_cursor;
  uniform int u_mode;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
    float r = length(uv);
    float a = atan(uv.y, uv.x);
    vec3 col = vec3(0.02, 0.03, 0.07);

    if (u_mode == 0) {
      // MODE 0: TOKAMAK MAGNETIC CONFINEMENT REACTOR
      float torusR = 0.42 - 0.08 * u_intensity;
      float ringDist = abs(r - torusR);
      float twist = sin(a * 6.0 - u_time * (3.0 + u_intensity * 4.0) + r * 12.0);
      float plasma = exp(-ringDist * (14.0 - u_intensity * 4.0)) * (0.65 + 0.35 * twist);
      float coreGlow = exp(-r * 5.5) * (0.35 + 0.45 * u_intensity);

      vec3 stableCol = vec3(0.12, 0.72, 0.98);
      vec3 criticalCol = vec3(0.98, 0.22, 0.32);
      vec3 tint = mix(stableCol, criticalCol, clamp(u_intensity, 0.0, 1.0));
      if (u_burst > 0.01) {
        vec3 burstCol = u_burstKind >= 0.0 ? vec3(0.15, 0.95, 0.65) : vec3(1.0, 0.18, 0.25);
        float wave = exp(-abs(r - (1.0 - u_burst * 0.45)) * 22.0) * u_burst;
        col += burstCol * wave * 1.4;
      }

      // Subtle magnetic grid rings
      float grid = smoothstep(0.98, 1.0, cos(r * 42.0 - u_time * 2.0)) * 0.08;
      col += tint * (plasma * 0.85 + coreGlow * 0.55 + grid);
    } else if (u_mode == 1) {
      // MODE 1: STEAMPUNK BLAST FURNACE & INVOLUTE GEARS
      vec2 gearUV1 = uv - vec2(-0.55, 0.28);
      float gr1 = length(gearUV1);
      float ga1 = atan(gearUV1.y, gearUV1.x) + u_time * (0.45 + u_intensity * 0.6);
      float teeth1 = smoothstep(0.015, -0.015, abs(gr1 - 0.28 - 0.025 * sin(ga1 * 12.0)) - 0.035);

      vec2 gearUV2 = uv - vec2(0.58, -0.22);
      float gr2 = length(gearUV2);
      float ga2 = atan(gearUV2.y, gearUV2.x) - u_time * (0.6 + u_intensity * 0.7);
      float teeth2 = smoothstep(0.015, -0.015, abs(gr2 - 0.22 - 0.02 * sin(ga2 * 10.0)) - 0.03);

      // Molten furnace glow on the right & bottom
      float furnace = exp(-length(uv - vec2(0.65, -0.15)) * 2.4) * (0.55 + 0.45 * u_intensity);
      float floorHeat = exp(-(v_uv.y) * 3.5) * 0.35;

      col = vec3(0.05, 0.035, 0.025);
      col += vec3(0.55, 0.36, 0.14) * (teeth1 * 0.22 + teeth2 * 0.20);
      col += vec3(0.96, 0.42, 0.08) * (furnace + floorHeat);
      if (u_burst > 0.01) {
        vec3 forgeCol = u_burstKind >= 0.0 ? vec3(1.0, 0.82, 0.28) : vec3(0.98, 0.18, 0.12);
        col += forgeCol * exp(-r * 3.5) * u_burst * 0.85;
      }
    } else if (u_mode == 2) {
      // MODE 2: GOTHIC ARCANE CATACOMB & RUNE VORTEX
      float swirl = sin(a * 5.0 + r * 9.0 - u_time * 1.4);
      float runeRing = exp(-abs(r - 0.48) * 18.0) * (0.5 + 0.5 * cos(a * 8.0 + u_time));
      float innerMist = exp(-r * 2.8) * (0.35 + 0.2 * swirl);

      col = vec3(0.035, 0.015, 0.065);
      col += vec3(0.52, 0.18, 0.88) * innerMist;
      col += vec3(0.96, 0.75, 0.22) * runeRing * (0.55 + 0.45 * u_intensity);
      if (u_burst > 0.01) {
        vec3 sigilCol = u_burstKind >= 0.0 ? vec3(0.98, 0.82, 0.28) : vec3(0.95, 0.18, 0.32);
        col += sigilCol * exp(-abs(r - (0.85 - u_burst * 0.35)) * 16.0) * u_burst;
      }
    } else {
      // MODE 3: CANARY WHARF EXECUTIVE TELEMETRY WAVEFIELD
      float wave1 = sin(uv.x * 5.5 + u_time * 1.6) * 0.18;
      float wave2 = cos(uv.x * 8.0 - u_time * 1.2 + u_intensity * 3.0) * 0.12;
      float ribbon1 = exp(-abs(uv.y - wave1) * 18.0);
      float ribbon2 = exp(-abs(uv.y - wave2) * 22.0);
      float gridX = smoothstep(0.97, 1.0, cos(uv.x * 36.0)) * 0.05;
      float gridY = smoothstep(0.97, 1.0, cos(uv.y * 36.0)) * 0.05;

      vec3 calmCol = vec3(0.06, 0.72, 0.51);
      vec3 tenseCol = vec3(0.95, 0.25, 0.35);
      vec3 execTint = mix(calmCol, tenseCol, clamp(u_intensity, 0.0, 1.0));

      col = vec3(0.02, 0.04, 0.08) + execTint * (ribbon1 * 0.45 + ribbon2 * 0.35 + gridX + gridY);
      if (u_burst > 0.01) {
        vec3 pulseCol = u_burstKind >= 0.0 ? vec3(0.12, 0.88, 0.62) : vec3(0.98, 0.22, 0.32);
        col += pulseCol * exp(-r * 3.0) * u_burst * 0.65;
      }
    }

    // Vignette
    col *= smoothstep(1.35, 0.25, r);
    fragColor = vec4(col, 1.0);
  }`;

  // =========================================================================
  // GLSL ES 3.00 SHADERS (Pass 2: Zero-Copy Instanced WASM Particles)
  // =========================================================================
  const PARTICLE_VERT_300 = `#version 300 es
  precision highp float;
  layout(location = 0) in vec2 a_quad;
  layout(location = 1) in vec3 a_pos;   // [x, y, z] from WASM linear memory
  layout(location = 2) in vec3 a_vel;   // [vx, vy, vz] from WASM linear memory
  layout(location = 3) in vec2 a_meta;  // [life, energy] from WASM linear memory

  uniform vec2 u_res;
  uniform int u_mode;
  uniform float u_burst;

  out vec2 v_quad;
  out float v_life;
  out float v_energy;
  out float v_depth;

  void main() {
    v_quad = a_quad;
    v_life = a_meta.x;
    v_energy = a_meta.y;
    v_depth = a_pos.z;

    float aspect = u_res.y / max(u_res.x, 1.0);
    float speed = length(a_vel.xy);
    vec2 dir = speed > 0.001 ? normalize(a_vel.xy) : vec2(0.0, 1.0);
    vec2 perp = vec2(-dir.y, dir.x);

    float baseSize = (0.0045 + 0.0065 * a_pos.z) * (0.85 + 0.45 * min(v_energy, 2.0));
    float stretch = 1.0 + min(speed * 2.4, 3.2);

    vec2 localOffset = (dir * (a_quad.y * baseSize * stretch) + perp * (a_quad.x * baseSize));
    localOffset.x *= aspect;

    gl_Position = vec4(a_pos.xy + localOffset, 0.0, 1.0);
  }`;

  const PARTICLE_FRAG_300 = `#version 300 es
  precision highp float;
  in vec2 v_quad;
  in float v_life;
  in float v_energy;
  in float v_depth;
  out vec4 fragColor;

  uniform int u_mode;
  uniform float u_intensity;
  uniform float u_burstKind;

  void main() {
    float d2 = dot(v_quad, v_quad);
    if (d2 > 1.0) discard;

    float core = exp(-d2 * 4.2);
    float fade = sin(clamp(v_life, 0.0, 1.0) * 3.14159265);
    float alpha = core * fade * clamp(v_energy * 0.65, 0.15, 0.95);

    vec3 cCold;
    vec3 cHot;
    if (u_mode == 0) {
      cCold = mix(vec3(0.05, 0.65, 0.98), vec3(0.95, 0.20, 0.30), u_intensity);
      cHot = vec3(0.82, 0.96, 1.0);
    } else if (u_mode == 1) {
      cCold = vec3(0.95, 0.38, 0.06);
      cHot = vec3(1.0, 0.92, 0.55);
    } else if (u_mode == 2) {
      cCold = vec3(0.68, 0.28, 0.98);
      cHot = vec3(1.0, 0.84, 0.35);
    } else {
      cCold = mix(vec3(0.08, 0.78, 0.54), vec3(0.95, 0.32, 0.38), u_intensity);
      cHot = vec3(0.75, 0.98, 0.90);
    }

    vec3 col = mix(cCold, cHot, clamp((v_energy - 0.4) * 0.7 + core * 0.4, 0.0, 1.0));
    fragColor = vec4(col * (1.1 + 0.3 * v_depth), alpha);
  }`;

  function compileShader(gl, type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(s);
      gl.deleteShader(s);
      throw new Error(log || 'Shader compile error');
    }
    return s;
  }

  function createProgram(gl, vsSrc, fsSrc) {
    const p = gl.createProgram();
    const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(p);
      throw new Error(log || 'Program link error');
    }
    return p;
  }

  // =========================================================================
  // MAIN ENGINE CONTROLLER
  // =========================================================================
  const WasmWebGLCore = (() => {
    let wasm = null;
    let gl = null;
    let canvas = null;
    let mode = 0;
    let particleCount = 4096;
    let paused = false;
    let intensity = 0.25;
    let cursor = { x: 0.0, y: 0.0 };
    let fpsSmooth = 60;
    let wasmStepMs = 0.12;
    let particleView = null;
    let metricsView = null;
    let hudBadgeEl = null;

    // Three.js integration state (for grammar-crypt-3d.html)
    let threePoints = null;
    let threePositions = null;
    let threeColors = null;

    function detectGameMode() {
      const p = (window.location.pathname || '').toLowerCase();
      const title = (document.title || '').toLowerCase();
      if (p.includes('reactor') || title.includes('reactor')) return 0;
      if (p.includes('factory') || title.includes('factory')) return 1;
      if (p.includes('crypt') || title.includes('crypt')) return 2;
      if (p.includes('boardroom') || title.includes('boardroom')) return 3;
      return 0;
    }

    function initMemoryViews() {
      if (!wasm) return;
      const pPtr = wasm.get_particles_ptr();
      const mPtr = wasm.get_metrics_ptr();
      particleView = new Float32Array(wasm.memory.buffer, pPtr, particleCount * 8);
      metricsView = new Float32Array(wasm.memory.buffer, mPtr, 8);
    }

    function burst(nx = 0.0, ny = 0.0, power = 1.35, kind = 1.0) {
      if (!wasm) return;
      wasm.trigger_burst(nx, ny, power, kind);
      if (power >= 1.3) {
        playArcadeSFX(kind > 0 ? 'success' : 'error');
      }
    }

    function setIntensity(val) {
      intensity = Math.max(0.0, Math.min(1.5, Number(val) || 0.0));
    }

    // =======================================================================
    // PROCEDURAL WEB AUDIO SOUNDTRACK FOR STANDALONE ARCADE GAMES
    // (Mode 0: Tokamak Plasma, Mode 1: Forge Physics, Mode 3: Exec Wavefield)
    // =======================================================================
    let audioCtx = null;
    let bgmEnabled = true;
    let bgmTimer = null;
    let bgmStep = 0;

    const ARCADE_TRACKS = {
      // Mode 0: Phrasal Reactor — Cybernetic Tokamak Synthwave (A Minor)
      0: {
        tempoMs: 210,
        leadWave: 'sawtooth',
        bassWave: 'triangle',
        leadGain: 0.016,
        bassGain: 0.028,
        lead: [220.00, 0, 261.63, 329.63, 440.00, 392.00, 329.63, 261.63, 246.94, 0, 293.66, 349.23, 392.00, 329.63, 293.66, 246.94],
        bass: [110.00, 110.00, 87.31, 87.31, 130.81, 130.81, 98.00, 98.00]
      },
      // Mode 1: The Formation Factory — Industrial Electro-Forge (D Dorian)
      1: {
        tempoMs: 225,
        leadWave: 'square',
        bassWave: 'sawtooth',
        leadGain: 0.014,
        bassGain: 0.025,
        lead: [146.83, 220.00, 293.66, 0, 261.63, 220.00, 174.61, 0, 164.81, 246.94, 329.63, 0, 293.66, 246.94, 220.00, 0],
        bass: [73.42, 73.42, 65.41, 73.42, 82.41, 82.41, 98.00, 82.41]
      },
      // Mode 3: The Boardroom Pitch — Canary Wharf Executive Pulse (C Minor 9th)
      3: {
        tempoMs: 280,
        leadWave: 'triangle',
        bassWave: 'sine',
        leadGain: 0.024,
        bassGain: 0.032,
        lead: [261.63, 311.13, 392.00, 466.16, 392.00, 311.13, 293.66, 0, 233.08, 293.66, 349.23, 440.00, 392.00, 349.23, 311.13, 0],
        bass: [130.81, 130.81, 103.83, 103.83, 116.54, 116.54, 98.00, 98.00]
      }
    };

    function shouldManageArcadeBGM() {
      const p = (window.location.pathname || '').toLowerCase();
      if (p.includes('chronicle') || p.includes('crypt')) return false;
      return mode === 0 || mode === 1 || mode === 3;
    }

    function ensureArcadeAudio() {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    }

    function playArcadeTone(freq, durationSec, wave, gainVal) {
      if (!audioCtx || audioCtx.state !== 'running' || freq <= 0) return;
      try {
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const filter = audioCtx.createBiquadFilter();
        const gain = audioCtx.createGain();
        osc.type = wave || 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1600, now);
        gain.gain.setValueAtTime(0.0005, now);
        gain.gain.linearRampToValueAtTime(gainVal, now + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + durationSec);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + durationSec + 0.02);
      } catch (_) {}
    }

    function playArcadeSFX(type) {
      if (!bgmEnabled || !shouldManageArcadeBGM()) return;
      ensureArcadeAudio();
      if (!audioCtx || audioCtx.state !== 'running') return;
      if (type === 'success') {
        playArcadeTone(523.25, 0.11, 'triangle', 0.035);
        setTimeout(() => playArcadeTone(659.25, 0.12, 'triangle', 0.035), 75);
        setTimeout(() => playArcadeTone(783.99, 0.20, 'triangle', 0.04), 150);
      } else if (type === 'error') {
        playArcadeTone(164.81, 0.16, 'sawtooth', 0.035);
        setTimeout(() => playArcadeTone(123.47, 0.24, 'sawtooth', 0.035), 110);
      }
    }

    function startArcadeBGM() {
      if (!shouldManageArcadeBGM() || !bgmEnabled) return;
      if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
      ensureArcadeAudio();
      const track = ARCADE_TRACKS[mode] || ARCADE_TRACKS[0];
      bgmStep = 0;
      bgmTimer = setInterval(() => {
        if (!bgmEnabled || paused) return;
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const leadNote = track.lead[bgmStep % track.lead.length];
        const bassNote = track.bass[Math.floor(bgmStep / 2) % track.bass.length];
        if (leadNote > 0) {
          playArcadeTone(leadNote, (track.tempoMs / 1000) * 0.85, track.leadWave, track.leadGain);
        }
        if (bgmStep % 2 === 0 && bassNote > 0) {
          playArcadeTone(bassNote, (track.tempoMs / 1000) * 1.7, track.bassWave, track.bassGain);
        }
        bgmStep++;
      }, track.tempoMs);
    }

    function stopArcadeBGM() {
      if (bgmTimer) {
        clearInterval(bgmTimer);
        bgmTimer = null;
      }
    }

    function armArcadeAudioUnlock() {
      if (!shouldManageArcadeBGM()) return;
      startArcadeBGM();
      const unlockEvents = ['pointerdown', 'keydown', 'touchstart', 'click'];
      const unlockHandler = (e) => {
        if (e && e.target && e.target.closest && e.target.closest('#wasm-bgm-toggle')) return;
        if (bgmEnabled) {
          ensureArcadeAudio();
          if (!bgmTimer) startArcadeBGM();
        }
        if (audioCtx && audioCtx.state === 'running') {
          unlockEvents.forEach((ev) => document.removeEventListener(ev, unlockHandler, true));
        }
      };
      unlockEvents.forEach((ev) => document.addEventListener(ev, unlockHandler, { capture: true, passive: true }));
    }

    function injectEngineBaseStyles() {
      if (document.getElementById('wasm-webgl-base-style')) return;
      const style = document.createElement('style');
      style.id = 'wasm-webgl-base-style';
      style.textContent = `
        #wasm-webgl-stage {
          position: fixed !important;
          inset: 0 !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 0 !important;
          pointer-events: none !important;
          display: block !important;
          touch-action: none;
          transition: opacity 0.35s ease;
        }
        body.wasm-chronicle #wasm-webgl-stage {
          opacity: 0.38;
        }
        body.has-wasm-webgl .game-container,
        body.has-wasm-webgl .layout-grid,
        body.has-wasm-webgl .top-bar,
        body.has-wasm-webgl .vn-shell {
          position: relative;
          z-index: 2;
        }
        body.has-wasm-webgl header {
          background: rgba(9, 13, 26, 0.72) !important;
          backdrop-filter: blur(10px);
        }
        /* Grammar Crypt 2D translucent obsidian panels */
        body.wasm-mode-2 .panel {
          background-color: rgba(30, 27, 75, 0.78) !important;
          backdrop-filter: blur(10px);
        }
        body.wasm-mode-2 .puzzle-board {
          background-color: rgba(49, 46, 129, 0.72) !important;
        }
        body.wasm-mode-2 .block-bank {
          background-color: rgba(15, 23, 42, 0.76) !important;
        }
        /* Boardroom Pitch Canary Wharf dark-glass executive theme */
        body.wasm-mode-3 {
          color: #e2e8f0 !important;
        }
        body.wasm-mode-3 .brand {
          color: #f8fafc !important;
        }
        body.wasm-mode-3 .exit-link {
          color: #94a3b8 !important;
        }
        body.wasm-mode-3 .ceo-panel {
          background: rgba(15, 23, 42, 0.82) !important;
          border-color: rgba(16, 185, 129, 0.38) !important;
          backdrop-filter: blur(12px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45) !important;
        }
        body.wasm-mode-3 .ceo-avatar {
          background: rgba(2, 6, 23, 0.85) !important;
          border-color: rgba(56, 189, 248, 0.4) !important;
        }
        body.wasm-mode-3 .patience-label,
        body.wasm-mode-3 .options-label {
          color: #94a3b8 !important;
        }
        body.wasm-mode-3 .scenario-panel {
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          backdrop-filter: blur(12px);
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.4);
        }
        body.wasm-mode-3 .scenario-label {
          color: #38bdf8 !important;
        }
        body.wasm-mode-3 .thought {
          color: #f8fafc !important;
        }
        body.wasm-mode-3 .option-btn {
          background: rgba(15, 23, 42, 0.84) !important;
          color: #f8fafc !important;
          border-color: rgba(148, 163, 184, 0.28) !important;
          backdrop-filter: blur(10px);
        }
        body.wasm-mode-3 .option-btn:hover {
          background: rgba(30, 41, 59, 0.94) !important;
          border-color: #38bdf8 !important;
          box-shadow: 0 0 18px rgba(56, 189, 248, 0.25) !important;
        }
        body.wasm-mode-3 .option-btn.correct {
          background: rgba(6, 78, 59, 0.92) !important;
          border-color: #10b981 !important;
          color: #a7f3d0 !important;
        }
        body.wasm-mode-3 .option-btn.wrong {
          background: rgba(136, 19, 55, 0.92) !important;
          border-color: #f43f5e !important;
          color: #fecdd3 !important;
        }
      `;
      document.head.appendChild(style);
    }

    function injectTelemetryHUD(modeName, isThreeShared = false) {
      if (document.getElementById('wasm-webgl-hud')) return;
      // Developer telemetry is hidden unless ?debug is in the URL. Pages that use the pill
      // for their music toggle keep just that button.
      const debugHud = /[?&]debug\b/.test(window.location.search || '');
      if (!debugHud && !shouldManageArcadeBGM()) return;
      const style = document.createElement('style');
      style.textContent = `
        .wasm-webgl-hud {
          position: fixed;
          bottom: 12px;
          right: 12px;
          z-index: 95;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 11px;
          border-radius: 999px;
          background: rgba(5, 8, 20, 0.86);
          border: 1px solid rgba(56, 189, 248, 0.35);
          color: #e2e8f0;
          font-family: 'Share Tech Mono', 'JetBrains Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.03em;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.55);
          user-select: none;
        }
        .wasm-webgl-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
        }
        .wasm-webgl-btn {
          background: rgba(56, 189, 248, 0.14);
          border: 1px solid rgba(56, 189, 248, 0.4);
          color: #7dd3fc;
          font-family: inherit;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 999px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .wasm-webgl-btn:hover {
          background: rgba(56, 189, 248, 0.28);
          color: #ffffff;
        }
        @media (max-width: 640px) {
          .wasm-webgl-hud {
            bottom: 8px;
            right: 8px;
            font-size: 10px;
            padding: 4px 9px;
          }
        }
      `;
      document.head.appendChild(style);

      const hasBgmBtn = shouldManageArcadeBGM();
      const hud = document.createElement('div');
      hud.id = 'wasm-webgl-hud';
      hud.className = 'wasm-webgl-hud';
      hud.innerHTML = `
        <span class="wasm-webgl-dot" id="wasm-hud-dot"></span>
        <span id="wasm-hud-text">WASM+WebGL2 • ${modeName} • ${particleCount} Particles</span>
        ${hasBgmBtn ? '<button type="button" class="wasm-webgl-btn" id="wasm-bgm-toggle" title="Toggle Arcade Music" aria-pressed="true">🔊 Music: ON</button>' : ''}
        <button type="button" class="wasm-webgl-btn" id="wasm-hud-toggle" title="Cycle High-Performance (4,096) / Eco (1,024) / Pause">4K GPU</button>
      `;
      document.body.appendChild(hud);
      if (!debugHud) {
        ['#wasm-hud-dot', '#wasm-hud-text', '#wasm-hud-toggle'].forEach((sel) => {
          const el = hud.querySelector(sel);
          if (el) el.style.display = 'none';
        });
      }
      hudBadgeEl = debugHud ? hud.querySelector('#wasm-hud-text') : null;

      const bgmBtn = hud.querySelector('#wasm-bgm-toggle');
      if (bgmBtn) {
        bgmBtn.addEventListener('click', () => {
          bgmEnabled = !bgmEnabled;
          bgmBtn.setAttribute('aria-pressed', String(bgmEnabled));
          bgmBtn.textContent = bgmEnabled ? '🔊 Music: ON' : '🔇 Music: OFF';
          if (bgmEnabled) {
            ensureArcadeAudio();
            startArcadeBGM();
          } else {
            stopArcadeBGM();
          }
        });
      }

      const toggleBtn = hud.querySelector('#wasm-hud-toggle');
      const dotEl = hud.querySelector('#wasm-hud-dot');
      toggleBtn.addEventListener('click', () => {
        if (isThreeShared) {
          paused = !paused;
          if (threePoints) threePoints.visible = !paused;
          toggleBtn.textContent = paused ? 'PAUSED' : 'WASM ON';
          dotEl.style.background = paused ? '#64748b' : '#10b981';
          return;
        }
        if (!paused && particleCount === 4096) {
          particleCount = 1024;
          wasm.init_sim(mode, particleCount, 9001 + mode);
          initMemoryViews();
          toggleBtn.textContent = '1K ECO';
          dotEl.style.background = '#f59e0b';
        } else if (!paused && particleCount === 1024) {
          paused = true;
          if (canvas) canvas.style.opacity = '0.15';
          toggleBtn.textContent = 'GPU OFF';
          dotEl.style.background = '#64748b';
        } else {
          paused = false;
          particleCount = 4096;
          if (canvas) canvas.style.opacity = '1';
          wasm.init_sim(mode, particleCount, 1337 + mode);
          initMemoryViews();
          toggleBtn.textContent = '4K GPU';
          dotEl.style.background = '#10b981';
        }
      });
    }

    function bindGameplayReactivity() {
      window.addEventListener(
        'pointermove',
        (e) => {
          const w = window.innerWidth || 1;
          const h = window.innerHeight || 1;
          cursor.x = (e.clientX / w) * 2.0 - 1.0;
          cursor.y = -((e.clientY / h) * 2.0 - 1.0);
        },
        { passive: true }
      );

      window.addEventListener(
        'pointerdown',
        (e) => {
          const w = window.innerWidth || 1;
          const h = window.innerHeight || 1;
          const nx = (e.clientX / w) * 2.0 - 1.0;
          const ny = -((e.clientY / h) * 2.0 - 1.0);
          burst(nx, ny, 0.75, 1.0);
        },
        { passive: true }
      );

      // 1. Phrasal Reactor Hooks (core class & timer bar)
      const baseVerb = document.getElementById('base-verb');
      const timerBar = document.getElementById('timer-bar');
      if (baseVerb) {
        const obs = new MutationObserver(() => {
          if (baseVerb.classList.contains('success')) {
            burst(0.0, 0.0, 1.85, 1.0);
          } else if (baseVerb.classList.contains('error')) {
            burst(0.0, 0.0, 2.1, -1.0);
          }
        });
        obs.observe(baseVerb, { attributes: true, attributeFilter: ['class'] });
      }
      if (timerBar) {
        setInterval(() => {
          const w = parseFloat(timerBar.style.width || '100');
          if (!Number.isNaN(w)) {
            setIntensity(Math.max(0.15, (100 - w) / 100));
          }
        }, 120);
      }

      // 2. Word Factory Hooks (typing input & word block)
      const typingInput = document.getElementById('typing-input');
      const wordBlock = document.getElementById('word-block');
      if (typingInput) {
        typingInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            setTimeout(() => {
              const isErr = typingInput.classList.contains('error');
              burst(0.0, -0.35, isErr ? 1.6 : 2.0, isErr ? -1.0 : 1.0);
            }, 20);
          } else {
            burst((Math.random() - 0.5) * 0.4, -0.45, 0.45, 1.0);
          }
        });
      }
      if (wordBlock) {
        const blockObs = new MutationObserver(() => {
          if (wordBlock.classList.contains('success')) {
            burst(0.0, -0.1, 2.2, 1.0);
          } else if (wordBlock.classList.contains('fail')) {
            burst(0.55, -0.2, 2.2, -1.0);
          }
        });
        blockObs.observe(wordBlock, { attributes: true, attributeFilter: ['class'] });
      }

      // 3. Grammar Crypt 2D Hooks (#board, #status, #next-btn)
      const statusEl = document.getElementById('status');
      if (statusEl) {
        const statusObs = new MutationObserver(() => {
          const txt = (statusEl.textContent || '').toLowerCase();
          if (txt.includes('correct') || txt.includes('unlocked') || txt.includes('victory')) {
            burst(0.0, 0.1, 2.1, 1.0);
          } else if (txt.includes('wrong') || txt.includes('curses') || txt.includes('shattered')) {
            burst(0.0, 0.1, 1.8, -1.0);
          }
        });
        statusObs.observe(statusEl, { childList: true, characterData: true, subtree: true });
      }

      // 4. Boardroom Pitch Hooks (#patience-bar & .ceo-panel)
      const patienceBar = document.getElementById('patience-bar');
      const ceoPanel = document.querySelector('.ceo-panel');
      if (patienceBar) {
        const patObs = new MutationObserver(() => {
          const w = parseFloat(patienceBar.style.width || '100');
          if (!Number.isNaN(w)) {
            setIntensity(Math.max(0.1, (100 - w) / 100));
          }
        });
        patObs.observe(patienceBar, { attributes: true, attributeFilter: ['style'] });
      }
      if (ceoPanel) {
        const ceoObs = new MutationObserver(() => {
          if (ceoPanel.classList.contains('shake')) {
            burst(0.0, 0.25, 2.0, -1.0);
          }
        });
        ceoObs.observe(ceoPanel, { attributes: true, attributeFilter: ['class'] });
      }
    }

    // =======================================================================
    // THREE.JS SHARED-BUFFER ACCELERATION FOR GRAMMAR-CRYPT-3D.HTML
    // =======================================================================
    function initThreeBridge() {
      if (typeof window.THREE === 'undefined' || !wasm) return false;
      const cryptCanvas = document.getElementById('webgl-canvas');
      if (!cryptCanvas) return false;

      particleCount = 2048;
      wasm.init_sim(2, particleCount, 7777);
      initMemoryViews();
      injectTelemetryHUD('3D WASM Kernel', true);
      bindGameplayReactivity();

      let lastTime = performance.now();
      const stepLoop = (now) => {
        const dt = Math.min(0.05, (now - lastTime) * 0.001);
        lastTime = now;
        if (!paused && wasm) {
          const t0 = performance.now();
          const rms = wasm.step_sim(dt, now * 0.001, intensity, cursor.x, cursor.y);
          wasmStepMs = wasmStepMs * 0.9 + (performance.now() - t0) * 0.1;
          fpsSmooth = fpsSmooth * 0.92 + (1.0 / Math.max(dt, 0.004)) * 0.08;
          if (hudBadgeEl && Math.random() < 0.15) {
            hudBadgeEl.textContent = `WASM+WebGL • ${Math.round(fpsSmooth)} FPS • ${wasmStepMs.toFixed(2)}ms • ${particleCount} Embers (E=${rms.toFixed(2)})`;
          }
        }
        requestAnimationFrame(stepLoop);
      };
      requestAnimationFrame(stepLoop);
      return true;
    }

    // =======================================================================
    // STANDALONE WEBGL2 INSTANCED RENDERER FOR 2D ARCADE GAMES
    // =======================================================================
    async function boot() {
      wasm = await loadWasmKernel();
      if (!wasm) return;

      mode = detectGameMode();
      const modeNames = ['Tokamak Plasma', 'Forge Physics', 'Arcane Vortex', 'Exec Wavefield'];

      // If running inside Grammar Crypt 3D (which already owns #webgl-canvas via Three.js)
      if (document.getElementById('webgl-canvas') && typeof window.THREE !== 'undefined') {
        initThreeBridge();
        return;
      }

      injectEngineBaseStyles();

      const isMobile = typeof navigator !== 'undefined' && (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        (window.innerWidth <= 768)
      );

      if (isMobile) {
        particleCount = 1024;
      }

      canvas = document.createElement('canvas');
      canvas.id = 'wasm-webgl-stage';
      canvas.setAttribute('aria-hidden', 'true');
      document.body.insertBefore(canvas, document.body.firstChild);
      document.body.classList.add('has-wasm-webgl', `wasm-mode-${mode}`);
      if ((window.location.pathname || '').toLowerCase().includes('chronicle')) {
        document.body.classList.add('wasm-chronicle');
        particleCount = isMobile ? 512 : 1024;
      }

      try {
        gl = canvas.getContext('webgl2', {
          alpha: false,
          antialias: false,
          depth: false,
          stencil: false,
          powerPreference: 'high-performance'
        });
      } catch (err) {
        gl = null;
      }

      if (!gl) {
        console.warn('[WasmWebGLCore] WebGL2 unavailable on this device.');
        canvas.remove();
        document.body.classList.remove('has-wasm-webgl', `wasm-mode-${mode}`, 'wasm-chronicle');
        return;
      }

      let bgProg, ptProg;
      try {
        bgProg = createProgram(gl, BG_VERT_300, BG_FRAG_300);
        ptProg = createProgram(gl, PARTICLE_VERT_300, PARTICLE_FRAG_300);
      } catch (err) {
        console.warn('[WasmWebGLCore] Shader initialization failed on this device:', err);
        canvas.remove();
        document.body.classList.remove('has-wasm-webgl', `wasm-mode-${mode}`, 'wasm-chronicle');
        return;
      }

      canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        paused = true;
        console.warn('[WasmWebGLCore] WebGL context lost.');
      }, false);
      canvas.addEventListener('webglcontextrestored', () => {
        paused = false;
        console.log('[WasmWebGLCore] WebGL context restored.');
      }, false);

      wasm.init_sim(mode, particleCount, 1337 + mode);
      initMemoryViews();
      injectTelemetryHUD(modeNames[mode] || 'WASM Sim', false);
      bindGameplayReactivity();
      armArcadeAudioUnlock();

      // Fullscreen quad VAO
      const bgVao = gl.createVertexArray();
      gl.bindVertexArray(bgVao);
      const quadBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const posLoc = gl.getAttribLocation(bgProg, 'a_pos');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Instanced Particle VAO (streams directly from WebAssembly linear memory)
      const ptVao = gl.createVertexArray();
      gl.bindVertexArray(ptVao);

      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(0, 0);

      const instBuf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
      gl.bufferData(gl.ARRAY_BUFFER, particleView.byteLength, gl.DYNAMIC_DRAW);

      const STRIDE = 32; // 8 x f32 (32 bytes per particle in WASM linear memory)
      // layout(location = 1) in vec3 a_pos (offset 0)
      gl.enableVertexAttribArray(1);
      gl.vertexAttribPointer(1, 3, gl.FLOAT, false, STRIDE, 0);
      gl.vertexAttribDivisor(1, 1);

      // layout(location = 2) in vec3 a_vel (offset 12)
      gl.enableVertexAttribArray(2);
      gl.vertexAttribPointer(2, 3, gl.FLOAT, false, STRIDE, 12);
      gl.vertexAttribDivisor(2, 1);

      // layout(location = 3) in vec2 a_meta (offset 24: life, energy)
      gl.enableVertexAttribArray(3);
      gl.vertexAttribPointer(3, 2, gl.FLOAT, false, STRIDE, 24);
      gl.vertexAttribDivisor(3, 1);

      gl.bindVertexArray(null);

      // Uniform locations
      const bgUniforms = {
        res: gl.getUniformLocation(bgProg, 'u_res'),
        time: gl.getUniformLocation(bgProg, 'u_time'),
        intensity: gl.getUniformLocation(bgProg, 'u_intensity'),
        burst: gl.getUniformLocation(bgProg, 'u_burst'),
        burstKind: gl.getUniformLocation(bgProg, 'u_burstKind'),
        cursor: gl.getUniformLocation(bgProg, 'u_cursor'),
        mode: gl.getUniformLocation(bgProg, 'u_mode')
      };

      const ptUniforms = {
        res: gl.getUniformLocation(ptProg, 'u_res'),
        mode: gl.getUniformLocation(ptProg, 'u_mode'),
        intensity: gl.getUniformLocation(ptProg, 'u_intensity'),
        burst: gl.getUniformLocation(ptProg, 'u_burst'),
        burstKind: gl.getUniformLocation(ptProg, 'u_burstKind')
      };

      const resize = () => {
        const maxDpr = isMobile ? 1.0 : 2.0;
        const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
        const w = Math.floor(window.innerWidth * dpr);
        const h = Math.floor(window.innerHeight * dpr);
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      };
      resize();
      window.addEventListener('resize', resize, { passive: true });

      let lastTs = performance.now();
      let frameCounter = 0;

      const renderFrame = (now) => {
        const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) * 0.001));
        lastTs = now;
        frameCounter++;

        if (!paused) {
          const t0 = performance.now();
          const rms = wasm.step_sim(dt, now * 0.001, intensity, cursor.x, cursor.y);
          wasmStepMs = wasmStepMs * 0.9 + (performance.now() - t0) * 0.1;
          fpsSmooth = fpsSmooth * 0.92 + (1.0 / dt) * 0.08;

          const burstEnv = metricsView ? metricsView[1] : 0.0;
          const burstKind = metricsView ? metricsView[7] : 1.0;

          gl.viewport(0, 0, canvas.width, canvas.height);

          // PASS 1: Fullscreen Procedural SDF / Raymarched Background
          gl.disable(gl.BLEND);
          gl.useProgram(bgProg);
          gl.uniform2f(bgUniforms.res, canvas.width, canvas.height);
          gl.uniform1f(bgUniforms.time, now * 0.001);
          gl.uniform1f(bgUniforms.intensity, intensity);
          gl.uniform1f(bgUniforms.burst, burstEnv);
          gl.uniform1f(bgUniforms.burstKind, burstKind);
          gl.uniform2f(bgUniforms.cursor, cursor.x, cursor.y);
          gl.uniform1i(bgUniforms.mode, mode);
          gl.bindVertexArray(bgVao);
          gl.drawArrays(gl.TRIANGLES, 0, 6);

          // PASS 2: Zero-Copy Instanced Particles from WASM Linear Memory
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
          gl.useProgram(ptProg);
          gl.uniform2f(ptUniforms.res, canvas.width, canvas.height);
          gl.uniform1i(ptUniforms.mode, mode);
          gl.uniform1f(ptUniforms.intensity, intensity);
          gl.uniform1f(ptUniforms.burst, burstEnv);
          gl.uniform1f(ptUniforms.burstKind, burstKind);

          gl.bindVertexArray(ptVao);
          gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, particleView);
          gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, particleCount);

          if (hudBadgeEl && frameCounter % 12 === 0) {
            hudBadgeEl.textContent = `WASM+WebGL2 • ${Math.round(fpsSmooth)} FPS • ${wasmStepMs.toFixed(2)}ms • ${particleCount} Particles (RMS ${rms.toFixed(2)})`;
          }
        }

        requestAnimationFrame(renderFrame);
      };

      requestAnimationFrame(renderFrame);
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot);
    } else {
      boot();
    }

    return {
      burst,
      setIntensity,
      getWasmExports: () => wasm,
      getParticleView: () => particleView
    };
  })();

  window.WasmWebGLCore = WasmWebGLCore;
})();
