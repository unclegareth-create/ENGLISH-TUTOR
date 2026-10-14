/**
 * ==============================================================================
 * GRAMMAR CRYPT — MODULAR GAME ENGINE (cryptEngine.js)
 * Multi-Room Crypt Engine, Syntax Chunk Assembly & Error-Correction Boss Battles.
 * ==============================================================================
 */

class GrammarCryptEngine {
  constructor() {
    // 1. Detect level from URL parameter (?level=cae-inversion, mixed-conditionals, boss-trial)
    const urlParams = new URLSearchParams(window.location.search);
    this.currentLevelParam = urlParams.get('level') || 'main';
    this.floors = getCryptFloorsForLevel(this.currentLevelParam);

    // 2. Player State
    this.currentRoomIndex = 0;
    this.playerHp = 3;
    this.score = 0;
    this.streak = 0;
    this.timerInterval = null;
    this.timeLeft = 25; // seconds for boss rounds

    // Educational Analytics Tracker
    this.categoryStats = {};

    // Assembly State
    this.assembledChunks = [];
    this.availableChunks = [];

    // Boss State
    this.bossHp = 0;
    this.currentAttackIndex = 0;
    this.selectedSegmentIndex = null;

    // Cache DOM & Bind Events
    this.cacheDOM();
    this.bindEvents();
    this.restoreSaveOrInit();
  }

  cacheDOM() {
    this.hpEl = document.getElementById("player-hp");
    this.scoreEl = document.getElementById("player-score");
    this.streakEl = document.getElementById("streak-counter");
    this.titleEl = document.getElementById("room-title");
    this.descEl = document.getElementById("room-desc");
    this.categoryBadge = document.getElementById("room-category");
    this.modeBadge = document.getElementById("mode-badge");

    this.bossHud = document.getElementById("boss-hud");
    this.bossHpEl = document.getElementById("boss-hp");
    this.bossAvatar = document.getElementById("boss-avatar");
    this.bossNameEl = document.getElementById("boss-name");
    this.bossTimer = document.getElementById("boss-timer");
    this.bossTimerBar = document.getElementById("boss-timer-bar");

    this.puzzleZone = document.getElementById("puzzle-zone");
    this.bankZone = document.getElementById("bank-zone");
    this.feedbackBox = document.getElementById("feedback-box");

    this.actionBtn = document.getElementById("action-btn");
    this.hintBtn = document.getElementById("hint-btn");
    this.nextBtn = document.getElementById("next-btn");
    this.resetBtn = document.getElementById("reset-btn");

    this.debriefModal = document.getElementById("debrief-modal");
    this.debriefTitle = document.getElementById("debrief-title");
    this.debriefSummary = document.getElementById("debrief-summary");
    this.debriefStats = document.getElementById("debrief-stats");
  }

  bindEvents() {
    this.actionBtn.addEventListener("click", () => this.evaluateAssemblyRoom());
    this.hintBtn.addEventListener("click", () => this.showHint());
    this.resetBtn.addEventListener("click", () => this.resetCurrentRoom());
    this.nextBtn.addEventListener("click", () => {
      this.currentRoomIndex++;
      this.saveProgress();
      this.loadRoom();
    });

    // Level selector dropdown/links if present
    document.querySelectorAll('[data-load-dungeon]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dungeon = e.currentTarget.getAttribute('data-load-dungeon');
        window.location.search = `?level=${dungeon}`;
      });
    });

    // Drag and Drop Zone Listeners
    if (this.puzzleZone) {
      this.puzzleZone.addEventListener("dragover", (e) => e.preventDefault());
      this.puzzleZone.addEventListener("drop", (e) => {
        e.preventDefault();
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data.source === "bank" && this.availableChunks[data.index] !== undefined) {
            this.sfx("grab");
            this.assembledChunks.push(this.availableChunks.splice(data.index, 1)[0]);
            this.renderAssemblyRoom();
          }
        } catch (_) {}
      });
    }

    if (this.bankZone) {
      this.bankZone.addEventListener("dragover", (e) => e.preventDefault());
      this.bankZone.addEventListener("drop", (e) => {
        e.preventDefault();
        try {
          const raw = e.dataTransfer.getData("text/plain");
          if (!raw) return;
          const data = JSON.parse(raw);
          if (data.source === "altar" && this.assembledChunks[data.index] !== undefined) {
            this.sfx("drop");
            this.availableChunks.push(this.assembledChunks.splice(data.index, 1)[0]);
            this.renderAssemblyRoom();
          }
        } catch (_) {}
      });
    }
  }

  // --- AUDIO & HAPTIC HELPERS ---
  sfx(name, arg) {
    try {
      if (window.GCAudio && typeof window.GCAudio.play === "function") {
        window.GCAudio.play(name, arg);
      }
    } catch (_) {}
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      if (name === "grab" || name === "drop") navigator.vibrate(12);
      else if (name === "success") navigator.vibrate([25, 35, 50]);
      else if (name === "error") navigator.vibrate([40, 40, 40]);
    }
  }

  // --- PERSISTENCE ---
  saveProgress() {
    const data = {
      levelParam: this.currentLevelParam,
      roomIndex: this.currentRoomIndex,
      score: this.score,
      playerHp: this.playerHp,
      streak: this.streak
    };
    try {
      localStorage.setItem(`grammar_crypt_${this.currentLevelParam}`, JSON.stringify(data));
    } catch (_) {}
  }

  restoreSaveOrInit() {
    try {
      const saved = localStorage.getItem(`grammar_crypt_${this.currentLevelParam}`);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.roomIndex && d.roomIndex < this.floors.length) {
          this.currentRoomIndex = d.roomIndex;
          this.score = d.score || 0;
          this.playerHp = Math.max(1, d.playerHp || 3);
          this.streak = d.streak || 0;
        }
      }
    } catch (_) {}
    this.updateHUD();
    this.loadRoom();
  }

  updateHUD() {
    if (this.hpEl) {
      this.hpEl.textContent = "🔥".repeat(Math.max(0, this.playerHp)) || "💀";
    }
    if (this.scoreEl) {
      this.scoreEl.textContent = this.score;
    }
    if (this.streakEl) {
      this.streakEl.textContent = this.streak > 0 ? `🔥 Streak: ${this.streak}` : "";
    }
    if (this.modeBadge) {
      const modeLabels = {
        'main': 'Catacombs Campaign',
        'cae-inversion': 'C1/C2 Inversion Dungeon',
        'mixed-conditionals': 'IELTS & Mixed Conditionals',
        'boss-trial': 'Grand Boss Trial'
      };
      this.modeBadge.textContent = modeLabels[this.currentLevelParam] || 'Grammar Crypt';
    }
  }

  trackCategory(category, isCorrect) {
    if (!this.categoryStats[category]) {
      this.categoryStats[category] = { correct: 0, total: 0 };
    }
    this.categoryStats[category].total++;
    if (isCorrect) this.categoryStats[category].correct++;
  }

  // --- LOAD ROOM ---
  loadRoom() {
    this.stopBossTimer();

    if (this.currentRoomIndex >= this.floors.length) {
      return this.renderVictory();
    }

    const room = this.floors[this.currentRoomIndex];
    this.titleEl.textContent = `Floor ${room.roomId}: ${room.title}`;
    this.descEl.textContent = room.description;
    if (this.categoryBadge) this.categoryBadge.textContent = room.category || "Syntax Trial";

    this.feedbackBox.classList.add("hidden");
    this.nextBtn.classList.add("hidden");
    this.hintBtn.classList.remove("hidden");
    this.resetBtn.classList.remove("hidden");

    if (room.type === "assembly") {
      this.bossHud.classList.add("hidden");
      this.actionBtn.classList.remove("hidden");
      this.assembledChunks = [];
      this.availableChunks = [...room.scrambled];
      this.renderAssemblyRoom();
    } else if (room.type === "boss") {
      this.bossHud.classList.remove("hidden");
      this.actionBtn.classList.add("hidden");
      this.bossHp = room.bossMaxHp || room.attacks.length;
      this.currentAttackIndex = 0;
      this.renderBossRoom();
    }
  }

  showHint() {
    const room = this.floors[this.currentRoomIndex];
    if (room.hint) {
      this.showFeedback(`💡 Crypt Hint: ${room.hint}`, "info");
    } else {
      this.showFeedback("💡 Inspect the auxiliary verbs and subject positions carefully.", "info");
    }
  }

  resetCurrentRoom() {
    const room = this.floors[this.currentRoomIndex];
    if (room.type === "assembly") {
      this.assembledChunks = [];
      this.availableChunks = [...room.scrambled];
      this.renderAssemblyRoom();
      this.feedbackBox.classList.add("hidden");
    } else {
      this.renderBossRoom();
    }
  }

  // ==========================================================================
  // ROOM TYPE 1: SYNTAX CHUNK ASSEMBLY
  // ==========================================================================
  renderAssemblyRoom() {
    this.puzzleZone.innerHTML = "";
    this.bankZone.innerHTML = "";

    // Target Altar Area (Assembled Chunks)
    if (this.assembledChunks.length === 0) {
      const placeholder = document.createElement("div");
      placeholder.className = "empty-altar-placeholder";
      placeholder.textContent = "⚡ Tap or drag runes from below to assemble the clause in order...";
      this.puzzleZone.appendChild(placeholder);
    } else {
      this.assembledChunks.forEach((chunk, idx) => {
        const tile = this.createTile(chunk, "chunk-tile altar-tile", () => {
          this.sfx("drop");
          this.availableChunks.push(this.assembledChunks.splice(idx, 1)[0]);
          this.renderAssemblyRoom();
        });
        tile.setAttribute("draggable", "true");
        this.addDragHandlers(tile, idx, "altar");
        this.puzzleZone.appendChild(tile);
      });
    }

    // Rune Bank Area (Available Chunks)
    this.availableChunks.forEach((chunk, idx) => {
      const tile = this.createTile(chunk, "chunk-tile bank-tile", () => {
        this.sfx("grab");
        this.assembledChunks.push(this.availableChunks.splice(idx, 1)[0]);
        this.renderAssemblyRoom();
      });
      tile.setAttribute("draggable", "true");
      this.addDragHandlers(tile, idx, "bank");
      this.bankZone.appendChild(tile);
    });
  }

  addDragHandlers(tile, index, source) {
    tile.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ index, source }));
      tile.classList.add("dragging");
    });
    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
    });
  }

  evaluateAssemblyRoom() {
    const room = this.floors[this.currentRoomIndex];
    const isCorrect =
      this.assembledChunks.length === room.targetOrder.length &&
      this.assembledChunks.every((val, i) => val === room.targetOrder[i]);

    this.trackCategory(room.category, isCorrect);

    if (isCorrect) {
      this.streak++;
      const bonus = Math.min(this.streak * 25, 100);
      this.score += (100 + bonus);
      this.updateHUD();
      this.sfx("success", this.streak);

      this.showFeedback("✨ The ancient seal resonates! Sentence syntax verified.", "success");
      this.actionBtn.classList.add("hidden");
      this.hintBtn.classList.add("hidden");
      this.resetBtn.classList.add("hidden");
      this.nextBtn.classList.remove("hidden");

      if (typeof confetti === "function") {
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      this.streak = 0;
      this.playerHp--;
      this.updateHUD();
      this.sfx("error");

      this.puzzleZone.classList.add("shake-animation");
      setTimeout(() => this.puzzleZone.classList.remove("shake-animation"), 400);

      this.showFeedback(`⚠️ Dark feedback strikes your torch! Hint: ${room.hint}`, "error");

      if (this.playerHp <= 0) {
        this.renderGameOver();
      }
    }
  }

  // ==========================================================================
  // ROOM TYPE 2: BOSS BATTLE (ERROR CORRECTION)
  // ==========================================================================
  renderBossRoom() {
    const room = this.floors[this.currentRoomIndex];
    if (this.bossNameEl) this.bossNameEl.textContent = room.bossName || "The Corrupted Lich";
    if (this.bossAvatar) this.bossAvatar.textContent = room.bossEmoji || "💀";
    if (this.bossHpEl) this.bossHpEl.textContent = "💀".repeat(Math.max(0, this.bossHp)) || "✨ VANQUISHED";

    this.puzzleZone.innerHTML = "";
    this.bankZone.innerHTML = "";
    this.selectedSegmentIndex = null;

    const attack = room.attacks[this.currentAttackIndex];
    if (!attack) return;

    // Boss Instruction bar
    const instruction = document.createElement("div");
    instruction.className = "boss-instruction";
    instruction.innerHTML = `<strong>Spell Phase ${this.currentAttackIndex + 1}/${room.attacks.length}:</strong> Tap the <span class="highlight-error">corrupted grammatical segment</span> below:`;
    this.puzzleZone.appendChild(instruction);

    const sentenceContainer = document.createElement("div");
    sentenceContainer.className = "boss-sentence-box";

    attack.segments.forEach((seg, idx) => {
      const segTile = this.createTile(seg, "segment-tile", () => {
        this.handleBossSegmentClick(idx, attack);
      });
      sentenceContainer.appendChild(segTile);
    });

    this.puzzleZone.appendChild(sentenceContainer);

    // Start 25-second boss countdown
    this.startBossTimer();
  }

  startBossTimer() {
    this.stopBossTimer();
    this.timeLeft = 25;
    if (this.bossTimer && this.bossTimerBar) {
      this.bossTimer.classList.remove("hidden");
      this.bossTimerBar.style.width = "100%";
      this.bossTimerBar.className = "boss-timer-bar";
    }

    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.bossTimerBar) {
        const pct = Math.max(0, (this.timeLeft / 25) * 100);
        this.bossTimerBar.style.width = `${pct}%`;
        if (pct < 30) this.bossTimerBar.className = "boss-timer-bar critical";
      }

      if (this.timeLeft <= 0) {
        this.stopBossTimer();
        this.playerHp--;
        this.updateHUD();
        this.sfx("error");
        this.showFeedback("⏳ The Lich's spell detonated before you isolated the flaw!", "error");
        if (this.playerHp <= 0) {
          this.renderGameOver();
        } else {
          setTimeout(() => this.renderBossRoom(), 1500);
        }
      }
    }, 1000);
  }

  stopBossTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.bossTimer) this.bossTimer.classList.add("hidden");
  }

  handleBossSegmentClick(index, attack) {
    // Visual selection
    const tiles = this.puzzleZone.querySelectorAll(".segment-tile");
    tiles.forEach((el, i) => {
      el.classList.toggle("selected-error", i === index);
    });

    if (index !== attack.errorIndex) {
      this.playerHp--;
      this.streak = 0;
      this.updateHUD();
      this.sfx("error");
      this.showFeedback("❌ That clause is grammatically sound! The corrupted spell strikes your torch.", "error");

      if (this.playerHp <= 0) {
        this.stopBossTimer();
        this.renderGameOver();
      }
      return;
    }

    // Correct error isolated! Stop timer & display surgical repair options
    this.stopBossTimer();
    this.sfx("grab");
    this.showFeedback("🎯 Corrupted syntax isolated! Now select the surgical grammatical fix:", "success");

    this.bankZone.innerHTML = "";
    const repairHeader = document.createElement("div");
    repairHeader.className = "repair-header";
    repairHeader.textContent = "Select Grammatical Counter-Measure:";
    this.bankZone.appendChild(repairHeader);

    attack.options.forEach(opt => {
      const optBtn = this.createTile(opt, "repair-option", () => {
        this.evaluateBossRepair(opt, attack);
      });
      this.bankZone.appendChild(optBtn);
    });
  }

  evaluateBossRepair(chosenOption, attack) {
    const room = this.floors[this.currentRoomIndex];
    const isCorrect = chosenOption === attack.correctOption;

    this.trackCategory(room.category, isCorrect);

    if (isCorrect) {
      this.bossHp--;
      this.score += 200;
      this.streak++;
      this.updateHUD();
      this.sfx("loot");

      if (this.bossHpEl) {
        this.bossHpEl.textContent = "💀".repeat(Math.max(0, this.bossHp)) || "✨ VANQUISHED";
      }

      this.showFeedback(`⚡ Counter-spell successful! ${attack.explanation}`, "success");
      this.bankZone.innerHTML = "";

      this.currentAttackIndex++;

      if (this.bossHp <= 0 || this.currentAttackIndex >= room.attacks.length) {
        this.sfx("victory");
        if (typeof confetti === "function") {
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
        this.showFeedback(`🏆 Boss Vanquished! The chamber doors crumble open. ${attack.explanation}`, "success");
        this.nextBtn.classList.remove("hidden");
      } else {
        setTimeout(() => this.renderBossRoom(), 2200);
      }
    } else {
      this.playerHp--;
      this.streak = 0;
      this.updateHUD();
      this.sfx("error");
      this.showFeedback("❌ Flawed repair choice! The spell backfires and singes your torch.", "error");

      if (this.playerHp <= 0) {
        this.renderGameOver();
      }
    }
  }

  // --- HELPERS & MODALS ---
  createTile(text, className, onClick) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = className;
    el.textContent = text;
    el.addEventListener("click", onClick);
    return el;
  }

  showFeedback(msg, type) {
    this.feedbackBox.innerHTML = msg;
    this.feedbackBox.className = `feedback-box ${type}`;
    this.feedbackBox.classList.remove("hidden");
  }

  renderGameOver() {
    this.stopBossTimer();
    this.sfx("error");

    this.puzzleZone.innerHTML = `
      <div class="game-over-panel">
        <h3 class="death-title">🔥 Your Torch Has Burned Out...</h3>
        <p class="death-desc">The catacomb shadows consumed you on Floor ${this.currentRoomIndex + 1}.</p>
      </div>
    `;

    this.bankZone.innerHTML = "";
    this.actionBtn.classList.add("hidden");
    this.hintBtn.classList.add("hidden");
    this.nextBtn.classList.add("hidden");
    this.resetBtn.classList.add("hidden");

    const restartBtn = this.createTile("Reignite Torch & Try Floor Again", "crypt-btn primary", () => {
      this.playerHp = 3;
      this.updateHUD();
      this.loadRoom();
    });

    const debriefBtn = this.createTile("View Diagnostic Report & Coaching Roadmap", "crypt-btn debrief-btn", () => {
      this.showDiagnosticDebrief(false);
    });

    this.bankZone.appendChild(restartBtn);
    this.bankZone.appendChild(debriefBtn);
  }

  renderVictory() {
    this.stopBossTimer();
    this.sfx("victory");

    if (typeof confetti === "function") {
      confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 } });
    }

    this.titleEl.textContent = "🏆 Crypt Conquered!";
    this.descEl.textContent = "You navigated the ancient syntax traps and emerged victorious.";
    this.bossHud.classList.add("hidden");
    this.actionBtn.classList.add("hidden");
    this.hintBtn.classList.add("hidden");
    this.resetBtn.classList.add("hidden");
    this.nextBtn.classList.add("hidden");

    this.puzzleZone.innerHTML = `
      <div class="victory-panel">
        <h3 class="victory-title">👑 Master of Advanced English Syntax</h3>
        <p>You have conquered the chamber with a grand score of <strong>${this.score}</strong>.</p>
      </div>
    `;

    this.bankZone.innerHTML = "";
    const debriefBtn = this.createTile("View Full Diagnostic Debrief & Certificate", "crypt-btn primary", () => {
      this.showDiagnosticDebrief(true);
    });
    this.bankZone.appendChild(debriefBtn);
  }

  // --- DIAGNOSTIC DEBRIEF ---
  showDiagnosticDebrief(isVictory) {
    if (!this.debriefModal) return;

    this.debriefTitle.textContent = isVictory ? "🏆 Crypt Master: Diagnostic Debrief" : "⚔️ Crypt Debrief & Diagnostic Assessment";
    
    // Calculate category accuracy
    let statsHtml = `<div class="stats-grid">`;
    const categories = Object.keys(this.categoryStats);
    if (categories.length === 0) {
      statsHtml += `
        <div class="stat-row">
          <span class="stat-name">Trial Diagnostic Baseline</span>
          <span class="stat-bar-box">
            <span class="stat-bar-fill" style="width: 50%"></span>
          </span>
          <span class="stat-val pass">50%</span>
        </div>
      `;
    } else {
      categories.forEach(cat => {
        const s = this.categoryStats[cat];
        const pct = Math.round((s.correct / Math.max(1, s.total)) * 100);
        statsHtml += `
          <div class="stat-row">
            <span class="stat-name">${cat}</span>
            <span class="stat-bar-box">
              <span class="stat-bar-fill" style="width: ${pct}%"></span>
            </span>
            <span class="stat-val ${pct >= 70 ? 'pass' : 'fail'}">${pct}%</span>
          </div>
        `;
      });
    }
    statsHtml += `</div>`;
    this.debriefStats.innerHTML = statsHtml;

    // Populate hidden inputs for lead capture form if present
    const leadScoreInput = document.getElementById("lead-score");
    if (leadScoreInput) leadScoreInput.value = `${this.score} pts (${this.currentLevelParam})`;

    this.debriefModal.classList.remove("hidden");
  }
}

// Initialise on DOM Ready
document.addEventListener("DOMContentLoaded", () => {
  window.GCEngine = new GrammarCryptEngine();
});
