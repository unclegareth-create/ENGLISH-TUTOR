/**
 * ============================================================================
 * GarethEnglish.com — Zero-Server P2P Live Classroom Sync (ClassroomSync)
 * ----------------------------------------------------------------------------
 * Real-time multiplayer classroom layer for ESL tutors and students:
 *
 * 1. Dual-Transport Architecture:
 *    - PeerJS WebRTC DataChannel (https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js)
 *      for cross-device tutor <-> student sync anywhere in the world.
 *    - Local BroadcastChannel ('gm_classroom_' + roomCode) for <5ms zero-latency
 *      sync across browser tabs/windows on the same computer (even offline or
 *      behind strict school/corporate firewalls).
 *
 * 2. Memorable Room Code Generator (e.g. CRYPT-482, VAULT-719):
 *    - ClassroomSync.hostRoom() initializes the host transport and generates a
 *      1-click Student Join URL (?room=CRYPT-482).
 *    - ClassroomSync.joinRoom(code) (or automatic join when ?room=XXXX is in
 *      window.location.search) connects the student's browser to the tutor's HUD.
 *
 * 3. Live Classroom Capabilities:
 *    - Live Student Keystroke Stream: Streams every character typed into any
 *      exercise input (input, textarea, [contenteditable]) to the Tutor HUD.
 *    - Live Boss Prompt / Custom Vocab Injector: Tutor pushes a custom C1/C2
 *      Key Word Transformation or vocabulary prompt to the student's screen,
 *      watches them type live, and clicks "✓ Award Point" or "💡 Send Hint".
 *    - Synchronized Reveal & Stage Reset: Tutor clicking "Reveal Answers" or
 *      "Reset Board" in the HUD syncs immediately to the student's screen.
 * ============================================================================
 */
(() => {
  'use strict';

  if (window.ClassroomSync) return;

  const PEERJS_CDN = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
  const ROOM_PREFIXES = ['CRYPT', 'VAULT', 'RUNE', 'QUILL', 'MOOR', 'BARD', 'ABBEY', 'FOLIO'];

  const PRESET_BOSS_CHALLENGES = [
    {
      label: 'C1 Inversion (INTENTION)',
      prompt: 'The board refused to delay the merger.',
      keyword: 'INTENTION',
      stemBefore: 'The board had',
      stemAfter: 'delaying the merger.',
      model: 'no intention of',
      hint: 'Use the negative noun phrase pattern: have + NO + INTENTION + of + -ing participle.'
    },
    {
      label: 'C1 Negative Inversion (SOONER)',
      prompt: 'As soon as the auditors arrived, the director shredded the ledger.',
      keyword: 'SOONER',
      stemBefore: 'No',
      stemAfter: 'the director shredded the ledger.',
      model: 'sooner had the auditors arrived than',
      hint: 'Invert the past perfect auxiliary after "No sooner": No sooner + HAD + subject + past participle + THAN...'
    },
    {
      label: 'C2 Passive Distancing (THOUGHT)',
      prompt: 'Commentators believe the manuscript was forged in the nineteenth century.',
      keyword: 'THOUGHT',
      stemBefore: 'The manuscript',
      stemAfter: 'in the nineteenth century.',
      model: 'is thought to have been forged',
      hint: 'Shift to impersonal passive + perfect passive infinitive: IS THOUGHT + TO HAVE BEEN + past participle.'
    },
    {
      label: 'C1 Regret / Preference (RATHER)',
      prompt: 'I would prefer you not to mention this proposal to the external client yet.',
      keyword: 'RATHER',
      stemBefore: 'I would',
      stemAfter: 'this proposal to the external client yet.',
      model: 'rather you did not mention',
      hint: 'After "would rather + new subject", use the past subjunctive (did not + infinitive) for present/future time.'
    }
  ];

  function normalizeRoomCode(raw) {
    const cleaned = String(raw || '')
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, '');
    return cleaned || '';
  }

  function peerIdForRoom(code, role, suffix) {
    const slug = normalizeRoomCode(code).toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (role === 'host') {
      return `gm-live-${slug}`;
    }
    return `gm-student-${slug}-${suffix || Math.random().toString(36).slice(2, 7)}`;
  }

  function countWords(str) {
    const trimmed = String(str || '').trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function playSyncChime(type) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = type === 'award'
        ? [523.25, 659.25, 783.99, 1046.5]
        : type === 'challenge'
          ? [440, 554.37, 659.25]
          : [587.33, 880];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    } catch (e) {}
  }

  function resolveFieldLabel(el) {
    if (!el || !el.tagName) return 'Exercise Input';
    if (el.id === 'gm-boss-student-input') {
      const kw = el.getAttribute('data-keyword') || 'LIVE';
      return `⚡ Boss Challenge [${kw}]`;
    }
    if (el.dataset && el.dataset.syncLabel) {
      return el.dataset.syncLabel;
    }
    const kwtCard = el.closest('[data-valid], .kwt-card, .kwt-item, .gm-pro-kwt');
    if (kwtCard) {
      const allCards = Array.from(document.querySelectorAll('[data-valid], .kwt-card, .kwt-item, .gm-pro-kwt'));
      const idx = allCards.indexOf(kwtCard);
      const badgeEl = kwtCard.querySelector('.kwt-key, .key-word, [style*="monospace"]');
      const kwText = badgeEl ? badgeEl.textContent.trim() : '';
      if (kwText && kwText.length <= 20) {
        return `Transform #${idx >= 0 ? idx + 1 : 1} [${kwText}]`;
      }
      return `Key Word Transform #${idx >= 0 ? idx + 1 : 1}`;
    }
    const aria = el.getAttribute('aria-label');
    if (aria) return aria;
    if (el.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape ? CSS.escape(el.id) : el.id}"]`);
      if (lbl && lbl.textContent.trim()) {
        return lbl.textContent.trim().slice(0, 48);
      }
    }
    const placeholder = el.getAttribute('placeholder');
    if (placeholder) return placeholder.slice(0, 40);
    return el.tagName.toLowerCase() === 'textarea' ? 'Essay / Long Response' : 'Exercise Input';
  }

  const ClassroomSync = {
    role: null,               // 'host' | 'student' | null
    roomCode: '',             // e.g. 'CRYPT-482'
    peer: null,               // PeerJS instance
    connections: [],          // Active PeerJS DataConnections
    bc: null,                 // BroadcastChannel('gm_classroom_' + code)
    seenMsgIds: new Set(),    // Deduplication cache across WebRTC + BroadcastChannel
    listeners: {},            // Custom event subscribers
    studentPoints: 0,         // Points awarded during session
    connectedPeersCount: 0,   // Number of connected student tabs/peers
    activeChallenge: null,    // Last pushed boss challenge
    keystrokeBound: false,
    peerJsLoading: null,

    PRESET_BOSS_CHALLENGES,

    generateRoomCode() {
      const prefix = ROOM_PREFIXES[Math.floor(Math.random() * ROOM_PREFIXES.length)];
      const num = Math.floor(100 + Math.random() * 900);
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let pin = '';
      for (let i = 0; i < 3; i++) {
        pin += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return `${prefix}-${num}-${pin}`;
    },

    on(event, handler) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(handler);
      return () => {
        this.listeners[event] = (this.listeners[event] || []).filter((fn) => fn !== handler);
      };
    },

    emit(event, data) {
      (this.listeners[event] || []).forEach((fn) => {
        try {
          fn(data);
        } catch (err) {
          console.error('[ClassroomSync] listener error:', err);
        }
      });
    },

    loadPeerJS() {
      if (window.Peer) return Promise.resolve(window.Peer);
      if (this.peerJsLoading) return this.peerJsLoading;

      this.peerJsLoading = new Promise((resolve) => {
        const existing = document.querySelector('script[data-gm-peerjs]');
        if (existing) {
          existing.addEventListener('load', () => resolve(window.Peer || null));
          existing.addEventListener('error', () => resolve(null));
          return;
        }
        const script = document.createElement('script');
        script.src = PEERJS_CDN;
        script.async = true;
        script.setAttribute('data-gm-peerjs', '1');
        script.onload = () => resolve(window.Peer || null);
        script.onerror = () => {
          console.warn('[ClassroomSync] PeerJS CDN unreachable; continuing on fast BroadcastChannel transport.');
          resolve(null);
        };
        document.head.appendChild(script);
      });

      return this.peerJsLoading;
    },

    openBroadcastChannel(code) {
      if (this.bc) {
        try { this.bc.close(); } catch (e) {}
        this.bc = null;
      }
      if (typeof window.BroadcastChannel !== 'function') return;
      const channelName = 'gm_classroom_' + normalizeRoomCode(code).toLowerCase();
      try {
        this.bc = new BroadcastChannel(channelName);
        this.bc.onmessage = (ev) => {
          if (ev && ev.data) {
            this.handleIncomingPacket(ev.data, 'broadcast');
          }
        };
      } catch (e) {
        console.warn('[ClassroomSync] BroadcastChannel error:', e);
      }
    },

    send(payload) {
      if (!this.roomCode) return null;
      const packet = {
        ...payload,
        roomCode: this.roomCode,
        senderRole: this.role || 'unknown',
        msgId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now()
      };
      this.seenMsgIds.add(packet.msgId);

      // 1. Local <5ms BroadcastChannel transport
      if (this.bc) {
        try {
          this.bc.postMessage(packet);
        } catch (e) {}
      }

      // 2. Cross-device PeerJS WebRTC DataChannel transport
      this.connections.forEach((conn) => {
        try {
          if (conn && conn.open) {
            conn.send(packet);
          }
        } catch (e) {}
      });

      return packet;
    },

    handleIncomingPacket(packet, transport) {
      if (!packet || typeof packet !== 'object') return;
      if (packet.msgId) {
        if (this.seenMsgIds.has(packet.msgId)) return;
        this.seenMsgIds.add(packet.msgId);
        if (this.seenMsgIds.size > 600) {
          const first = this.seenMsgIds.values().next().value;
          this.seenMsgIds.delete(first);
        }
      }

      packet._transport = transport;
      this.emit('message', packet);

      switch (packet.type) {
        case 'student_hello':
          if (this.role === 'host') {
            this.connectedPeersCount = Math.max(1, this.connectedPeersCount);
            this.send({
              type: 'host_welcome',
              studentPoints: this.studentPoints,
              activeChallenge: this.activeChallenge
            });
            this.emit('student_connected', packet);
          }
          break;

        case 'host_ready':
        case 'host_welcome':
          if (this.role === 'student') {
            if (typeof packet.studentPoints === 'number') {
              this.studentPoints = packet.studentPoints;
            }
            this.updateStudentPillUI('connected');
            if (packet.activeChallenge) {
              this.activeChallenge = packet.activeChallenge;
              this.renderStudentBossModal(packet.activeChallenge);
            }
            this.emit('host_connected', packet);
          }
          break;

        case 'keystroke':
          this.emit('keystroke', packet);
          break;

        case 'boss_challenge':
          this.activeChallenge = packet;
          if (this.role === 'student') {
            playSyncChime('challenge');
            this.renderStudentBossModal(packet);
          }
          this.emit('boss_challenge', packet);
          break;

        case 'boss_submit':
          this.emit('boss_submit', packet);
          break;

        case 'tutor_hint':
          if (this.role === 'student') {
            playSyncChime('hint');
            this.displayStudentHint(packet.hint);
          }
          this.emit('tutor_hint', packet);
          break;

        case 'award_point':
          if (typeof packet.totalPoints === 'number') {
            this.studentPoints = packet.totalPoints;
          } else {
            this.studentPoints += (packet.points || 1);
          }
          if (this.role === 'student') {
            playSyncChime('award');
            this.displayStudentAward(packet);
            this.updateStudentPillUI('connected');
          }
          this.emit('award_point', packet);
          break;

        case 'command':
          if (this.role === 'student') {
            this.executeSyncedCommand(packet.command, packet);
          }
          this.emit('command', packet);
          break;

        default:
          break;
      }
    },

    /**
     * Initialize Tutor Host Room (e.g. CRYPT-482)
     */
    async hostRoom(customCode) {
      this.cleanupTransports();
      this.role = 'host';
      this.roomCode = normalizeRoomCode(customCode) || this.generateRoomCode();
      this.connectedPeersCount = 0;

      try {
        sessionStorage.setItem('gm_active_host_room', this.roomCode);
      } catch (e) {}

      // 1. Bind instant local BroadcastChannel
      this.openBroadcastChannel(this.roomCode);
      this.send({ type: 'host_ready', roomCode: this.roomCode });

      // 2. Bind PeerJS WebRTC Host
      const PeerClass = await this.loadPeerJS();
      if (PeerClass) {
        try {
          const hostPeerId = peerIdForRoom(this.roomCode, 'host');
          const peer = new PeerClass(hostPeerId);
          this.peer = peer;

          peer.on('open', (id) => {
            this.emit('status', { state: 'hosting', roomCode: this.roomCode, peerId: id, transport: 'WebRTC + BroadcastChannel' });
          });

          peer.on('connection', (conn) => {
            this.connections.push(conn);
            this.connectedPeersCount = this.connections.filter((c) => c.open).length + 1;
            conn.on('open', () => {
              this.connectedPeersCount = this.connections.filter((c) => c.open).length;
              conn.send({
                type: 'host_welcome',
                roomCode: this.roomCode,
                studentPoints: this.studentPoints,
                activeChallenge: this.activeChallenge,
                msgId: `welcome-${Date.now()}`
              });
              this.emit('student_connected', { peerId: conn.peer, transport: 'webrtc' });
            });
            conn.on('data', (data) => {
              this.handleIncomingPacket(data, 'webrtc');
            });
            conn.on('close', () => {
              this.connections = this.connections.filter((c) => c !== conn);
              this.connectedPeersCount = this.connections.length;
              this.emit('student_disconnected', { peerId: conn.peer });
            });
          });

          peer.on('error', (err) => {
            // Even if PeerJS ID is taken in another tab or blocked, BroadcastChannel continues working seamlessly
            console.info('[ClassroomSync] PeerJS notice (BroadcastChannel active):', err ? err.type || err.message : '');
            this.emit('status', { state: 'hosting', roomCode: this.roomCode, transport: 'BroadcastChannel (Local Instant)' });
          });
        } catch (e) {
          this.emit('status', { state: 'hosting', roomCode: this.roomCode, transport: 'BroadcastChannel' });
        }
      } else {
        this.emit('status', { state: 'hosting', roomCode: this.roomCode, transport: 'BroadcastChannel' });
      }

      this.emit('room_hosted', { roomCode: this.roomCode, joinUrl: this.getStudentJoinUrl() });
      return {
        roomCode: this.roomCode,
        joinUrl: this.getStudentJoinUrl()
      };
    },

    /**
     * Join an active Tutor Room as Student
     */
    async joinRoom(rawCode, options) {
      const code = normalizeRoomCode(rawCode);
      if (!code) return null;
      const opts = options || {};

      this.cleanupTransports();
      this.role = 'student';
      this.roomCode = code;

      // 1. Bind instant local BroadcastChannel
      this.openBroadcastChannel(this.roomCode);

      // 2. Bind student keystroke telemetry
      this.bindStudentKeystrokeStream();

      // 3. Mount Student Sync Pill UI unless suppressed by inline demo
      if (!opts.silentUI) {
        this.mountStudentPillUI();
      }

      // Announce student presence over BroadcastChannel immediately (<5ms)
      this.send({
        type: 'student_hello',
        moduleTitle: document.title || 'Interactive Lesson',
        url: window.location.pathname.split('/').pop() || 'index.html'
      });

      // 4. Connect via PeerJS WebRTC for cross-device sync
      const PeerClass = await this.loadPeerJS();
      if (PeerClass) {
        try {
          const studentPeerId = peerIdForRoom(this.roomCode, 'student');
          const hostPeerId = peerIdForRoom(this.roomCode, 'host');
          const peer = new PeerClass(studentPeerId);
          this.peer = peer;

          peer.on('open', () => {
            const conn = peer.connect(hostPeerId, { reliable: true });
            this.connections.push(conn);
            conn.on('open', () => {
              this.updateStudentPillUI('connected');
              conn.send({
                type: 'student_hello',
                roomCode: this.roomCode,
                moduleTitle: document.title || 'Interactive Lesson',
                url: window.location.pathname.split('/').pop() || 'index.html',
                msgId: `hello-${Date.now()}`
              });
              this.emit('host_connected', { roomCode: this.roomCode, transport: 'webrtc' });
            });
            conn.on('data', (data) => {
              this.handleIncomingPacket(data, 'webrtc');
            });
          });

          peer.on('error', () => {
            // Local BroadcastChannel remains active
            this.updateStudentPillUI('connected');
          });
        } catch (e) {}
      }

      this.emit('room_joined', { roomCode: this.roomCode });
      return { roomCode: this.roomCode };
    },

    cleanupTransports() {
      if (this.bc) {
        try { this.bc.close(); } catch (e) {}
        this.bc = null;
      }
      this.connections.forEach((c) => {
        try { c.close(); } catch (e) {}
      });
      this.connections = [];
      if (this.peer) {
        try { this.peer.destroy(); } catch (e) {}
        this.peer = null;
      }
    },

    getStudentJoinUrl(targetFileOverride) {
      const code = this.roomCode || this.generateRoomCode();
      let baseHref = window.location.href.split('#')[0];
      if (targetFileOverride) {
        const baseDir = window.location.origin + window.location.pathname.replace(/[^/]*$/, '');
        baseHref = new URL(targetFileOverride, baseDir).toString();
      }
      const url = new URL(baseHref, window.location.origin);
      url.searchParams.set('room', code);
      url.searchParams.delete('teacher_key');
      url.searchParams.delete('teacher_unlocked');
      return url.toString();
    },

    copyStudentJoinLink(targetFileOverride) {
      const url = this.getStudentJoinUrl(targetFileOverride);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url);
      }
      return url;
    },

    /**
     * Streams live student keystrokes from any input, textarea, or [contenteditable]
     */
    bindStudentKeystrokeStream() {
      if (this.keystrokeBound) return;
      this.keystrokeBound = true;

      const handleInputEvent = (e) => {
        if (!this.roomCode) return;
        const t = e.target;
        if (!t || !t.tagName) return;

        // Do not stream tutor HUD inputs, contact/waitlist forms, or PII/license fields
        if (
          t.closest('#gm-teacher-presenter-hud') ||
          t.closest('[data-sync-ignore="true"]') ||
          t.closest('form[action*="formsubmit"]')
        ) {
          return;
        }

        const tag = t.tagName.toLowerCase();
        const isEditable = t.isContentEditable;
        if (tag !== 'input' && tag !== 'textarea' && !isEditable) return;

        const inputType = (t.getAttribute('type') || 'text').toLowerCase();
        if (['hidden', 'password', 'email', 'tel', 'checkbox', 'radio', 'file', 'submit', 'button'].includes(inputType)) {
          return;
        }

        const fieldIdent = `${t.id || ''} ${t.name || ''} ${t.getAttribute('autocomplete') || ''}`.toLowerCase();
        if (/\b(email|e-mail|phone|tel|password|passwd|card|cvc|iban|license|vault-key|teacher-key|wl-name|wl-email|t-name|t-email)\b/.test(fieldIdent)) {
          return;
        }

        const value = isEditable ? (t.innerText || t.textContent || '') : (t.value || '');
        const cursor = typeof t.selectionStart === 'number' ? t.selectionStart : value.length;
        const fieldLabel = resolveFieldLabel(t);

        this.send({
          type: 'keystroke',
          fieldLabel,
          value,
          cursor,
          wordCount: countWords(value),
          moduleTitle: document.title || 'Interactive Module'
        });
      };

      document.addEventListener('input', handleInputEvent, true);
      document.addEventListener('keyup', handleInputEvent, true);
    },

    /**
     * Tutor Action: Push a Live Boss Challenge / Custom Vocab Prompt to the student
     */
    pushBossChallenge(challengeData) {
      const data = challengeData || {};
      const prompt = String(data.prompt || 'The board refused to delay the merger.').trim();
      const keyword = String(data.keyword || 'INTENTION').trim().toUpperCase();
      const stemBefore = String(data.stemBefore !== undefined ? data.stemBefore : '').trim();
      const stemAfter = String(data.stemAfter !== undefined ? data.stemAfter : '').trim();
      const hint = String(data.hint || `Use the unchanged key word "${keyword}" in a 3 to 6 word C1/C2 transformation.`).trim();
      const model = String(data.model || '').trim();

      const payload = {
        type: 'boss_challenge',
        challengeId: `boss-${Date.now()}`,
        prompt,
        keyword,
        stemBefore,
        stemAfter,
        hint,
        model
      };

      this.activeChallenge = payload;
      this.send(payload);
      return payload;
    },

    /**
     * Tutor Action: Send a live hint to the student
     */
    sendHint(customHint) {
      const fallback = (this.activeChallenge && this.activeChallenge.hint)
        ? this.activeChallenge.hint
        : 'Check the tense of the original sentence and keep the key word completely unchanged (3–6 words).';
      const hintText = String(customHint || fallback).trim();
      this.send({
        type: 'tutor_hint',
        hint: hintText
      });
      return hintText;
    },

    /**
     * Tutor Action: Award +1 Point to the student
     */
    awardPoint(customMessage) {
      this.studentPoints += 1;
      const msg = String(customMessage || 'Spot-on C1/C2 syntactic transformation! +1 Classroom Point').trim();
      this.send({
        type: 'award_point',
        points: 1,
        totalPoints: this.studentPoints,
        message: msg
      });
      return this.studentPoints;
    },

    /**
     * Tutor Action: Broadcast Reveal All or Reset Board to synced student screen
     */
    broadcastCommand(commandName) {
      this.send({
        type: 'command',
        command: commandName
      });
    },

    executeSyncedCommand(commandName) {
      const wl = window.GarethTeacherWhiteLabel;
      if (commandName === 'reveal_all' && wl && typeof wl.revealAllPageAnswers === 'function') {
        const count = wl.revealAllPageAnswers();
        this.showStudentToast(`👁️ Your tutor revealed all ${count} model answers on this page.`, '#10b981');
      } else if (commandName === 'reset_all' && wl && typeof wl.resetAllPageExercises === 'function') {
        wl.resetAllPageExercises();
        const modal = document.getElementById('gm-student-boss-modal');
        if (modal) modal.remove();
        this.showStudentToast('🔄 Your tutor reset the exercise board for a fresh run.', '#38bdf8');
      }
    },

    /**
     * Student UI: Floating status pill showing live P2P classroom connection & score
     */
    mountStudentPillUI() {
      let pill = document.getElementById('gm-student-sync-pill');
      if (pill) {
        this.updateStudentPillUI('connecting');
        return;
      }

      pill = document.createElement('div');
      pill.id = 'gm-student-sync-pill';
      pill.setAttribute('role', 'status');
      pill.setAttribute('aria-live', 'polite');
      pill.style.cssText = `
        position: fixed;
        bottom: 16px;
        right: 16px;
        z-index: 9994;
        background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%);
        border: 1.5px solid #10b981;
        border-radius: 999px;
        padding: 8px 16px;
        color: #ecfdf5;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        font-weight: 800;
        box-shadow: 0 12px 30px rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        gap: 10px;
      `;

      pill.innerHTML = `
        <span id="gm-student-sync-dot" style="width:9px;height:9px;border-radius:999px;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;"></span>
        <span id="gm-student-sync-label">Live Room: <strong style="color:#6ee7b7;font-family:monospace;">${escapeHtml(this.roomCode)}</strong></span>
        <span id="gm-student-sync-points" style="background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#fde68a;padding:2px 8px;border-radius:999px;font-size:11px;">⭐ ${this.studentPoints} pts</span>
      `;

      document.body.appendChild(pill);
    },

    updateStudentPillUI(status) {
      const label = document.getElementById('gm-student-sync-label');
      const pts = document.getElementById('gm-student-sync-points');
      if (label) {
        label.innerHTML = status === 'connected'
          ? `🟢 Synced with Tutor &bull; <strong style="color:#6ee7b7;font-family:monospace;">${escapeHtml(this.roomCode)}</strong>`
          : `📡 Connecting Room <strong style="color:#7dd3fc;font-family:monospace;">${escapeHtml(this.roomCode)}</strong>`;
      }
      if (pts) {
        pts.textContent = `⭐ ${this.studentPoints} pts`;
      }
    },

    /**
     * Student UI: Interactive Live Boss Challenge Modal pushed by Tutor
     */
    renderStudentBossModal(challenge) {
      if (!challenge) return;
      const existing = document.getElementById('gm-student-boss-modal');
      if (existing) existing.remove();

      const modal = document.createElement('div');
      modal.id = 'gm-student-boss-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'false');
      modal.setAttribute('aria-label', 'Live Tutor Challenge');
      modal.style.cssText = `
        position: fixed;
        bottom: 64px;
        right: 16px;
        z-index: 9996;
        width: 410px;
        max-width: calc(100vw - 32px);
        background: linear-gradient(155deg, #0f172a 0%, #020617 100%);
        border: 2px solid #f59e0b;
        border-radius: 20px;
        padding: 20px;
        color: #f8fafc;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85);
      `;

      const hasStems = Boolean(challenge.stemBefore || challenge.stemAfter);

      modal.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:7px;">
            <span style="background:rgba(245,158,11,0.2);border:1px solid #f59e0b;color:#fcd34d;font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:999px;text-transform:uppercase;letter-spacing:0.06em;">
              ⚡ Live Tutor Boss Challenge
            </span>
            <span style="background:#312e81;border:1px solid #6366f1;color:#e0e7ff;font-family:monospace;font-size:12px;font-weight:800;padding:2px 9px;border-radius:6px;">
              ${escapeHtml(challenge.keyword || 'KEY')}
            </span>
          </div>
          <button type="button" id="gm-boss-modal-close" aria-label="Minimize challenge" style="background:none;border:none;color:#94a3b8;font-size:18px;cursor:pointer;line-height:1;">&times;</button>
        </div>

        <p style="font-size:13.5px;color:#e2e8f0;margin:0 0 10px 0;line-height:1.5;background:#1e293b;padding:10px 12px;border-radius:10px;border-left:3px solid #f59e0b;">
          <em>&ldquo;${escapeHtml(challenge.prompt)}&rdquo;</em>
        </p>

        <div style="font-size:11px;color:#94a3b8;margin-bottom:6px;display:flex;justify-content:space-between;">
          <span>Complete using <strong style="color:#fcd34d;font-family:monospace;">${escapeHtml(challenge.keyword)}</strong> (do not change the word):</span>
          <span id="gm-boss-word-count" style="font-family:monospace;color:#38bdf8;">0 words</span>
        </div>

        ${hasStems ? `
          <div style="font-size:13.5px;font-weight:700;color:#ffffff;margin-bottom:10px;line-height:1.6;">
            ${escapeHtml(challenge.stemBefore)}
            <input type="text" id="gm-boss-student-input" data-keyword="${escapeHtml(challenge.keyword)}" placeholder="Type 3–6 words (live-streamed to tutor)..." style="width:100%;margin:6px 0;background:#020617;border:1.5px solid #38bdf8;border-radius:10px;padding:9px 12px;color:#fff;font-size:13.5px;font-weight:700;box-sizing:border-box;" />
            ${escapeHtml(challenge.stemAfter)}
          </div>
        ` : `
          <div style="margin-bottom:10px;">
            <input type="text" id="gm-boss-student-input" data-keyword="${escapeHtml(challenge.keyword)}" placeholder="Type your transformation with ${escapeHtml(challenge.keyword)}..." style="width:100%;background:#020617;border:1.5px solid #38bdf8;border-radius:10px;padding:10px 12px;color:#fff;font-size:13.5px;font-weight:700;box-sizing:border-box;" />
          </div>
        `}

        <div style="display:flex;gap:8px;align-items:center;">
          <button type="button" id="gm-boss-student-submit" style="flex:1;background:#10b981;color:#022c22;border:none;border-radius:10px;padding:9px 14px;font-size:12.5px;font-weight:800;cursor:pointer;">
            🚀 Lock In Answer for Tutor
          </button>
        </div>

        <div id="gm-boss-student-hint" style="display:none;margin-top:10px;padding:9px 12px;border-radius:10px;background:rgba(245,158,11,0.16);border:1px solid #f59e0b;color:#fde68a;font-size:12px;line-height:1.45;"></div>
        <div id="gm-boss-student-award" style="display:none;margin-top:10px;padding:10px 12px;border-radius:10px;background:rgba(16,185,129,0.2);border:1px solid #10b981;color:#6ee7b7;font-size:12.5px;font-weight:800;line-height:1.45;"></div>
      `;

      document.body.appendChild(modal);

      const closeBtn = document.getElementById('gm-boss-modal-close');
      const inputEl = document.getElementById('gm-boss-student-input');
      const wcEl = document.getElementById('gm-boss-word-count');
      const submitBtn = document.getElementById('gm-boss-student-submit');

      if (closeBtn) closeBtn.onclick = () => modal.remove();

      if (inputEl) {
        setTimeout(() => inputEl.focus(), 80);
        inputEl.addEventListener('input', () => {
          const wc = countWords(inputEl.value);
          if (wcEl) {
            wcEl.textContent = `${wc} ${wc === 1 ? 'word' : 'words'}`;
            wcEl.style.color = (wc >= 3 && wc <= 6) ? '#10b981' : '#38bdf8';
          }
        });
        inputEl.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && submitBtn) submitBtn.click();
        });
      }

      if (submitBtn && inputEl) {
        submitBtn.onclick = () => {
          const val = inputEl.value.trim();
          if (!val) return;
          this.send({
            type: 'boss_submit',
            keyword: challenge.keyword,
            prompt: challenge.prompt,
            value: val,
            wordCount: countWords(val)
          });
          submitBtn.textContent = '✓ Sent to Tutor HUD!';
          submitBtn.style.background = '#0284c7';
          submitBtn.style.color = '#ffffff';
          setTimeout(() => {
            submitBtn.textContent = '🚀 Update Answer';
            submitBtn.style.background = '#10b981';
            submitBtn.style.color = '#022c22';
          }, 2000);
        };
      }
    },

    displayStudentHint(hintText) {
      const box = document.getElementById('gm-boss-student-hint');
      if (box) {
        box.style.display = 'block';
        box.innerHTML = `<strong>💡 Tutor Hint:</strong> ${escapeHtml(hintText)}`;
      } else {
        this.showStudentToast(`💡 Tutor Hint: ${hintText}`, '#f59e0b');
      }
    },

    displayStudentAward(packet) {
      const box = document.getElementById('gm-boss-student-award');
      const msg = (packet && packet.message) || 'Spot-on C1/C2 transformation! +1 Point!';
      if (box) {
        box.style.display = 'block';
        box.innerHTML = `🌟 <strong>+1 Point Awarded!</strong> ${escapeHtml(msg)} (Total: ${this.studentPoints} pts)`;
      } else {
        this.showStudentToast(`🌟 +1 Point Awarded! ${msg}`, '#10b981');
      }
    },

    showStudentToast(text, borderColor) {
      const existing = document.getElementById('gm-student-sync-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.id = 'gm-student-sync-toast';
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9998;
        background: #0f172a;
        border: 2px solid ${borderColor || '#38bdf8'};
        color: #f8fafc;
        padding: 12px 16px;
        border-radius: 14px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 13px;
        font-weight: 700;
        box-shadow: 0 15px 35px rgba(0,0,0,0.65);
        max-width: 360px;
      `;
      toast.textContent = text;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 4500);
    },

    /**
     * Auto-boot when ?room=XXXX is present in URL
     */
    initFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        this.joinRoom(roomParam);
        return;
      }
      // If tutor previously hosted a room in this tab session, keep reference available
      try {
        const savedHostRoom = sessionStorage.getItem('gm_active_host_room');
        if (savedHostRoom && !this.roomCode) {
          this.roomCode = savedHostRoom;
        }
      } catch (e) {}
    }
  };

  window.ClassroomSync = ClassroomSync;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => ClassroomSync.initFromUrl());
  } else {
    ClassroomSync.initFromUrl();
  }
})();
