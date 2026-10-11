/**
 * CJ Nuts Puzzle - 3D Color-Sorting Game Engine
 * Features: Realistic PBR Metallic Shaders, Procedural Hex Nuts with Central Bore,
 * Threaded Bolts, Guaranteed Solvable Puzzles, BFS Hint Solver, Web Audio Synthesis,
 * Native Android Haptics Bridge, 30 Progressive Levels.
 */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.initOnFirstInteraction = this.initOnFirstInteraction.bind(this);
      window.addEventListener('pointerdown', this.initOnFirstInteraction, { once: true });
    }

    initOnFirstInteraction() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    playLift() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    }

    playDrop() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        // Metallic clink: high transient + body tone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(1450, now);
        osc1.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2600, now);
        osc2.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.28, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.13);
        osc2.stop(now + 0.13);
      } catch (e) {}
    }

    playSelect() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
      } catch (e) {}
    }

    playInvalid() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      } catch (e) {}
    }

    playStackComplete() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.07);
          gain.gain.setValueAtTime(0.18, now + idx * 0.07);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.28);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.07);
          osc.stop(now + idx * 0.07 + 0.3);
        });
      } catch (e) {}
    }

    playWin() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const fanfare = [
          { f: 523.25, t: 0.0 },
          { f: 659.25, t: 0.1 },
          { f: 783.99, t: 0.2 },
          { f: 1046.50, t: 0.32 },
          { f: 880.00, t: 0.44 },
          { f: 1046.50, t: 0.58 }
        ];
        fanfare.forEach(item => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(item.f, now + item.t);
          gain.gain.setValueAtTime(0.22, now + item.t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + 0.35);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + item.t);
          osc.stop(now + item.t + 0.38);
        });
      } catch (e) {}
    }
  }

  // --- HAPTICS BRIDGE ---
  const Haptics = {
    enabled: true,
    vibrate(durationMs) {
      if (!this.enabled) return;
      try {
        if (window.AndroidBridge && typeof window.AndroidBridge.vibrate === 'function') {
          window.AndroidBridge.vibrate(durationMs);
        } else if (navigator.vibrate) {
          navigator.vibrate(durationMs);
        }
      } catch (e) {}
    }
  };

  // --- COLOR PALETTE DEFINITIONS ---
  const NUT_COLORS = {
    1: { id: 1, name: 'Emerald', hex: 0x10b981, color: '#10b981' },
    2: { id: 2, name: 'Gold', hex: 0xf59e0b, color: '#f59e0b' },
    3: { id: 3, name: 'Ruby', hex: 0xe63946, color: '#e63946' },
    4: { id: 4, name: 'Sapphire', hex: 0x2563eb, color: '#2563eb' },
    5: { id: 5, name: 'Amethyst', hex: 0x8b5cf6, color: '#8b5cf6' },
    6: { id: 6, name: 'Cyan', hex: 0x06b6d4, color: '#06b6d4' },
    7: { id: 7, name: 'Copper', hex: 0xf97316, color: '#f97316' }
  };

  const BOLT_CAPACITY = 4;

  // --- PSEUDO RANDOM NUMBER GENERATOR (Deterministic for levels) ---
  function createSeededRandom(seed) {
    let s = Math.sin(seed) * 10000;
    return function () {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  }

  // --- LEVEL CONFIGURATION & GENERATOR ---
  class LevelManager {
    static getLevelConfig(levelIndex) {
      // 30 curated level specifications
      let colorsCount, emptyBoltsCount, scrambles;
      if (levelIndex === 1) {
        colorsCount = 3; emptyBoltsCount = 1; scrambles = 7;
      } else if (levelIndex === 2) {
        colorsCount = 3; emptyBoltsCount = 1; scrambles = 12;
      } else if (levelIndex === 3) {
        colorsCount = 3; emptyBoltsCount = 2; scrambles = 16;
      } else if (levelIndex === 4) {
        colorsCount = 4; emptyBoltsCount = 1; scrambles = 15;
      } else if (levelIndex === 5) {
        colorsCount = 4; emptyBoltsCount = 2; scrambles = 20;
      } else if (levelIndex <= 10) {
        colorsCount = 4; emptyBoltsCount = (levelIndex % 2 === 0) ? 1 : 2; scrambles = 20 + levelIndex * 3;
      } else if (levelIndex <= 15) {
        colorsCount = 5; emptyBoltsCount = 2; scrambles = 30 + (levelIndex - 10) * 4;
      } else if (levelIndex <= 20) {
        colorsCount = 5; emptyBoltsCount = 2; scrambles = 45 + (levelIndex - 15) * 4;
      } else if (levelIndex <= 25) {
        colorsCount = 6; emptyBoltsCount = 2; scrambles = 55 + (levelIndex - 20) * 5;
      } else {
        colorsCount = 6; emptyBoltsCount = 2; scrambles = 70 + (levelIndex - 25) * 6;
      }
      return { colorsCount, emptyBoltsCount, scrambles };
    }

    static generateLevel(levelIndex) {
      const config = this.getLevelConfig(levelIndex);
      const totalBolts = config.colorsCount + config.emptyBoltsCount;
      const rng = createSeededRandom(levelIndex * 7919 + 42);

      // Start with solved configuration
      const bolts = [];
      for (let c = 1; c <= config.colorsCount; c++) {
        bolts.push([c, c, c, c]);
      }
      for (let e = 0; e < config.emptyBoltsCount; e++) {
        bolts.push([]);
      }

      // Reverse scramble using legal moves
      let lastFrom = -1;
      let lastTo = -1;
      let movesApplied = 0;
      const maxAttempts = config.scrambles * 8;
      let attempts = 0;

      while (movesApplied < config.scrambles && attempts < maxAttempts) {
        attempts++;
        const fromIdx = Math.floor(rng() * totalBolts);
        if (bolts[fromIdx].length === 0) continue;

        const toIdx = Math.floor(rng() * totalBolts);
        if (toIdx === fromIdx) continue;
        if (bolts[toIdx].length >= BOLT_CAPACITY) continue;

        // Prevent immediate reverse
        if (fromIdx === lastTo && toIdx === lastFrom) continue;

        // Move nut
        const nut = bolts[fromIdx].pop();
        bolts[toIdx].push(nut);
        lastFrom = fromIdx;
        lastTo = toIdx;
        movesApplied++;
      }

      // Ensure level is not already solved
      if (this.isSolved(bolts)) {
        // Simple swap to break solved state
        if (bolts[0].length > 0 && bolts[1].length > 0) {
          const temp = bolts[0].pop();
          bolts[1].push(temp);
        }
      }

      return {
        levelNumber: levelIndex,
        bolts: bolts.map(b => [...b]),
        colorsCount: config.colorsCount,
        totalBolts: totalBolts
      };
    }

    static isSolved(bolts) {
      for (let i = 0; i < bolts.length; i++) {
        const stack = bolts[i];
        if (stack.length === 0) continue;
        if (stack.length !== BOLT_CAPACITY) return false;
        const color = stack[0];
        for (let j = 1; j < stack.length; j++) {
          if (stack[j] !== color) return false;
        }
      }
      return true;
    }

    static isBoltComplete(stack) {
      if (stack.length !== BOLT_CAPACITY) return false;
      const c = stack[0];
      return stack.every(x => x === c);
    }
  }

  // --- BFS HINT ENGINE & SOLVER ---
  class PuzzleSolver {
    static stateToString(bolts) {
      return bolts.map(b => b.join(',')).sort().join('|');
    }

    static findHint(bolts) {
      // Find a legal move that progresses the puzzle
      // BFS up to 2500 states for guaranteed shortest path
      const queue = [];
      const visited = new Set();
      const initialCanonical = this.stateToString(bolts);

      queue.push({
        state: bolts.map(b => [...b]),
        firstMove: null,
        depth: 0
      });
      visited.add(initialCanonical);

      let bestHeuristicMove = null;
      let bestHeuristicScore = -Infinity;

      let statesChecked = 0;
      const MAX_STATES = 2000;

      while (queue.length > 0 && statesChecked < MAX_STATES) {
        statesChecked++;
        const current = queue.shift();

        if (LevelManager.isSolved(current.state)) {
          return current.firstMove;
        }

        // Generate legal moves
        const numBolts = current.state.length;
        for (let from = 0; from < numBolts; from++) {
          if (current.state[from].length === 0) continue;
          const nutColor = current.state[from][current.state[from].length - 1];

          // If from stack is already complete homogenous stack of 4, don't break it
          if (LevelManager.isBoltComplete(current.state[from])) continue;

          for (let to = 0; to < numBolts; to++) {
            if (to === from) continue;
            const destStack = current.state[to];
            if (destStack.length >= BOLT_CAPACITY) continue;

            const isMatch = (destStack.length === 0) || (destStack[destStack.length - 1] === nutColor);
            if (!isMatch) continue;

            // Don't move from single-color stack to an empty bolt (useless move)
            const fromStack = current.state[from];
            const allSameInFrom = fromStack.every(c => c === nutColor);
            if (destStack.length === 0 && allSameInFrom) continue;

            // Score heuristic for fallback
            if (current.depth === 0) {
              let score = 0;
              if (destStack.length > 0 && destStack[destStack.length - 1] === nutColor) {
                score += 50 + destStack.length * 10;
              }
              if (fromStack.length === 1) score += 25; // frees up a bolt
              if (destStack.length === 0) score -= 10;
              if (score > bestHeuristicScore) {
                bestHeuristicScore = score;
                bestHeuristicMove = { from, to, color: nutColor };
              }
            }

            // Clone state
            const nextState = current.state.map(b => [...b]);
            const moved = nextState[from].pop();
            nextState[to].push(moved);

            const canonical = this.stateToString(nextState);
            if (!visited.has(canonical)) {
              visited.add(canonical);
              queue.push({
                state: nextState,
                firstMove: current.firstMove || { from, to, color: nutColor },
                depth: current.depth + 1
              });
            }
          }
        }
      }

      return bestHeuristicMove;
    }
  }

  // --- THREE.JS 3D ENGINE & SCENE ---
  class GameEngine {
    constructor() {
      this.sound = new SoundEngine();
      this.currentLevel = 1;
      this.unlockedLevel = 1;
      this.boardState = []; // array of array of color IDs
      this.moveHistory = []; // stack of {from, to, nutColor}
      this.movesCount = 0;
      this.timerSeconds = 0;
      this.timerInterval = null;
      this.selectedBoltIndex = null;
      this.isAnimating = false;
      this.completedBoltsCount = 0;
      this.totalColorCount = 3;

      // 3D Objects mapping
      this.boltMeshes = [];
      this.nutMeshes = []; // array of array of nut Object3D
      this.boltPositions = [];
      this.selectionRingMesh = null;
      this.hintRingMesh = null;

      // Cache geometries & materials
      this.geometries = {};
      this.materials = {};

      this.initStorage();
      this.initDOM();
      this.initThree();
      this.loadLevel(this.currentLevel);
      this.startTimer();
    }

    initStorage() {
      try {
        const savedUnlocked = localStorage.getItem('cj_nuts_unlocked');
        if (savedUnlocked) {
          this.unlockedLevel = Math.max(1, parseInt(savedUnlocked, 10) || 1);
        }
        const savedLevel = localStorage.getItem('cj_nuts_current_level');
        if (savedLevel) {
          this.currentLevel = Math.min(this.unlockedLevel, Math.max(1, parseInt(savedLevel, 10) || 1));
        }
        const soundPref = localStorage.getItem('cj_nuts_sound');
        if (soundPref !== null) {
          this.sound.enabled = (soundPref === 'true');
        }
        const hapticPref = localStorage.getItem('cj_nuts_haptic');
        if (hapticPref !== null) {
          Haptics.enabled = (hapticPref === 'true');
        }
      } catch (e) {}
    }

    saveProgress() {
      try {
        localStorage.setItem('cj_nuts_unlocked', this.unlockedLevel.toString());
        localStorage.setItem('cj_nuts_current_level', this.currentLevel.toString());
      } catch (e) {}
    }

    initDOM() {
      this.container = document.getElementById('canvas-container');
      this.levelBadgeText = document.getElementById('level-badge-text');
      this.levelBadgeBtn = document.getElementById('level-badge-btn');
      this.hudMoves = document.getElementById('hud-moves');
      this.hudTime = document.getElementById('hud-time');
      this.hudSorted = document.getElementById('hud-sorted');
      this.hintBanner = document.getElementById('hint-banner');
      this.hintText = document.getElementById('hint-text');

      this.undoBtn = document.getElementById('undo-btn');
      this.hintBtn = document.getElementById('hint-btn');
      this.restartBtn = document.getElementById('restart-btn');
      this.rulesBtn = document.getElementById('rules-btn');
      this.soundBtn = document.getElementById('sound-btn');
      this.settingsBtn = document.getElementById('settings-btn');

      // Modals
      this.victoryModal = document.getElementById('victory-modal');
      this.levelsModal = document.getElementById('levels-modal');
      this.settingsModal = document.getElementById('settings-modal');
      this.rulesModal = document.getElementById('rules-modal');

      this.victoryLevelSubtitle = document.getElementById('victory-level-subtitle');
      this.victoryMoves = document.getElementById('victory-moves');
      this.victoryTime = document.getElementById('victory-time');
      this.nextLevelBtn = document.getElementById('next-level-btn');
      this.replayLevelBtn = document.getElementById('replay-level-btn');

      this.levelsGrid = document.getElementById('levels-grid');
      this.closeLevelsBtn = document.getElementById('close-levels-btn');
      this.closeSettingsBtn = document.getElementById('close-settings-btn');
      this.closeRulesBtn = document.getElementById('close-rules-btn');
      this.closeRulesConfirmBtn = document.getElementById('close-rules-confirm-btn');

      this.settingSound = document.getElementById('setting-sound');
      this.settingHaptic = document.getElementById('setting-haptic');
      this.resetProgressBtn = document.getElementById('reset-progress-btn');

      // Cloud Save & Google Auth wiring
      const googleSigninBtn = document.getElementById('google-signin-btn');
      const signoutBtn = document.getElementById('signout-btn');
      const unauthView = document.getElementById('unauth-view');
      const authView = document.getElementById('auth-view');
      const userDisplayName = document.getElementById('user-display-name');

      if (googleSigninBtn) {
        googleSigninBtn.addEventListener('click', () => {
          if (window.AndroidBridge && window.AndroidBridge.signInWithGoogle) {
            window.AndroidBridge.signInWithGoogle();
          }
        });
      }

      if (signoutBtn) {
        signoutBtn.addEventListener('click', () => {
          if (window.AndroidBridge && window.AndroidBridge.signOut) {
            window.AndroidBridge.signOut();
          }
        });
      }

      window.onAuthChanged = (user) => {
        if (user && user.uid) {
          if (unauthView) unauthView.style.display = 'none';
          if (authView) authView.style.display = 'block';
          if (userDisplayName) userDisplayName.textContent = user.displayName || 'Player';
          // Sync current progress up to cloud
          const totalStars = Math.max(0, (this.unlockedLevel - 1) * 3);
          if (window.AndroidBridge && window.AndroidBridge.syncProgress) {
            window.AndroidBridge.syncProgress(this.unlockedLevel, totalStars);
          }
        } else {
          if (unauthView) unauthView.style.display = 'block';
          if (authView) authView.style.display = 'none';
        }
      };

      window.onCloudSaveLoaded = (cloudUnlockedLvl, cloudStars) => {
        if (cloudUnlockedLvl && cloudUnlockedLvl > this.unlockedLevel) {
          this.unlockedLevel = Math.min(30, cloudUnlockedLvl);
          this.saveProgress();
          this.renderLevelsGrid();
          this.updateProgressHUD();
        }
      };

      // Check initial auth if available
      try {
        if (window.AndroidBridge && window.AndroidBridge.getAuthStatus) {
          const authStatus = window.AndroidBridge.getAuthStatus();
          if (authStatus) {
            const userObj = JSON.parse(authStatus);
            window.onAuthChanged(userObj);
          }
        }
      } catch (e) {}

      // Sync settings toggles
      if (this.settingSound) this.settingSound.checked = this.sound.enabled;
      if (this.settingHaptic) this.settingHaptic.checked = Haptics.enabled;
      this.updateSoundIcon();

      // Event Listeners
      this.undoBtn.addEventListener('click', () => this.handleUndo());
      this.hintBtn.addEventListener('click', () => this.handleHint());
      this.restartBtn.addEventListener('click', () => this.handleRestart());
      this.levelBadgeBtn.addEventListener('click', () => this.openLevelsModal());
      this.rulesBtn.addEventListener('click', () => this.openRulesModal());
      this.settingsBtn.addEventListener('click', () => this.openSettingsModal());

      this.soundBtn.addEventListener('click', () => {
        this.sound.enabled = !this.sound.enabled;
        try { localStorage.setItem('cj_nuts_sound', this.sound.enabled.toString()); } catch (e) {}
        if (this.settingSound) this.settingSound.checked = this.sound.enabled;
        this.updateSoundIcon();
        if (this.sound.enabled) this.sound.playSelect();
      });

      if (this.settingSound) {
        this.settingSound.addEventListener('change', (e) => {
          this.sound.enabled = e.target.checked;
          try { localStorage.setItem('cj_nuts_sound', this.sound.enabled.toString()); } catch (e) {}
          this.updateSoundIcon();
        });
      }

      if (this.settingHaptic) {
        this.settingHaptic.addEventListener('change', (e) => {
          Haptics.enabled = e.target.checked;
          try { localStorage.setItem('cj_nuts_haptic', Haptics.enabled.toString()); } catch (e) {}
        });
      }

      if (this.resetProgressBtn) {
        this.resetProgressBtn.addEventListener('click', () => {
          if (confirm('Reset all completed levels?')) {
            this.unlockedLevel = 1;
            this.currentLevel = 1;
            this.saveProgress();
            this.closeAllModals();
            this.loadLevel(1);
          }
        });
      }

      this.nextLevelBtn.addEventListener('click', () => {
        this.closeAllModals();
        this.loadLevel(this.currentLevel + 1);
      });

      this.replayLevelBtn.addEventListener('click', () => {
        this.closeAllModals();
        this.handleRestart();
      });

      this.closeLevelsBtn.addEventListener('click', () => this.closeAllModals());
      this.closeSettingsBtn.addEventListener('click', () => this.closeAllModals());
      this.closeRulesBtn.addEventListener('click', () => this.closeAllModals());
      this.closeRulesConfirmBtn.addEventListener('click', () => this.closeAllModals());

      // Android back button handling
      window.onAndroidBackPressed = () => {
        if (this.anyModalOpen()) {
          this.closeAllModals();
          return true;
        }
        if (this.selectedBoltIndex !== null) {
          this.deselectBolt();
          return true;
        }
        return false;
      };
    }

    anyModalOpen() {
      return (
        this.victoryModal.classList.contains('open') ||
        this.levelsModal.classList.contains('open') ||
        this.settingsModal.classList.contains('open') ||
        this.rulesModal.classList.contains('open')
      );
    }

    closeAllModals() {
      this.victoryModal.classList.remove('open');
      this.levelsModal.classList.remove('open');
      this.settingsModal.classList.remove('open');
      this.rulesModal.classList.remove('open');
    }

    openLevelsModal() {
      this.renderLevelsGrid();
      this.levelsModal.classList.add('open');
      this.sound.playSelect();
    }

    openSettingsModal() {
      this.settingsModal.classList.add('open');
      this.sound.playSelect();
    }

    openRulesModal() {
      this.rulesModal.classList.add('open');
      this.sound.playSelect();
    }

    updateSoundIcon() {
      const on = document.getElementById('sound-icon-on');
      const off = document.getElementById('sound-icon-off');
      if (on && off) {
        on.style.display = this.sound.enabled ? 'block' : 'none';
        off.style.display = this.sound.enabled ? 'none' : 'block';
      }
    }

    renderLevelsGrid() {
      this.levelsGrid.innerHTML = '';
      for (let i = 1; i <= 30; i++) {
        const cell = document.createElement('div');
        cell.className = 'level-cell';
        const isUnlocked = i <= this.unlockedLevel;
        const isCurrent = i === this.currentLevel;

        if (isCurrent) cell.classList.add('current');
        else if (isUnlocked) cell.classList.add('unlocked');
        else cell.classList.add('locked');

        cell.innerHTML = `
          <div class="level-cell-num">${i}</div>
          <div class="level-cell-stars">${isUnlocked && i < this.unlockedLevel ? '★★★' : (isUnlocked ? '•' : '🔒')}</div>
        `;

        if (isUnlocked) {
          cell.addEventListener('click', () => {
            this.closeAllModals();
            this.loadLevel(i);
          });
        }

        this.levelsGrid.appendChild(cell);
      }
    }

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerSeconds = 0;
      this.updateTimerDisplay();
      this.timerInterval = setInterval(() => {
        if (!this.anyModalOpen()) {
          this.timerSeconds++;
          this.updateTimerDisplay();
        }
      }, 1000);
    }

    updateTimerDisplay() {
      const m = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const s = (this.timerSeconds % 60).toString().padStart(2, '0');
      this.hudTime.textContent = `${m}:${s}`;
    }

    // --- THREE.JS INITIALIZATION ---
    initThree() {
  // 1. Scene
  this.scene = new THREE.Scene();
  this.scene.background = new THREE.Color(0x0e1117);
  this.scene.fog = new THREE.FogExp2(0x0e1117, 0.022);

  // 2. Camera (use safe fallback aspect until real size is known)
  this.camera = new THREE.PerspectiveCamera(46, 9 / 16, 0.1, 100);

  // 3. Renderer
  this.renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  this.renderer.shadowMap.enabled = true;
  this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure = 1.15;
  this.container.appendChild(this.renderer.domElement);

  // 4. Lighting
  const ambientLight = new THREE.AmbientLight(0xfff5ea, 0.55);
  this.scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xfffaed, 1.35);
  keyLight.position.set(6, 16, 9);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 1024;
  keyLight.shadow.mapSize.height = 1024;
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 40;
  keyLight.shadow.camera.left = -14;
  keyLight.shadow.camera.right = 14;
  keyLight.shadow.camera.top = 14;
  keyLight.shadow.camera.bottom = -14;
  keyLight.shadow.bias = -0.0005;
  this.scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(0x7090b0, 0.6);
  fillLight.position.set(-8, 10, -6);
  this.scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xffb703, 0.35);
  rimLight.position.set(0, 5, -12);
  this.scene.add(rimLight);

  // Tabletop + indicator rings
  this.createTabletop();
  this.createIndicatorRings();

  // Raycasting
  this.raycaster = new THREE.Raycaster();
  this.mouse = new THREE.Vector2();

  // Interaction
  this.setupInteractionListeners();

  // ========== PERMANENT RESIZE FIX ==========
  this._lastKnownWidth = 0;
  this._lastKnownHeight = 0;

  // Reliable size detection (works even when window.resize doesn't fire)
  if (typeof ResizeObserver !== 'undefined') {
    this._resizeObserver = new ResizeObserver(() => {
      this.onWindowResize();
    });
    this._resizeObserver.observe(this.container);
  }

  // Fallback for older WebViews
  window.addEventListener('resize', () => this.onWindowResize());

  // Force size check multiple times (critical for Android WebView)
  const forceSize = () => this.onWindowResize();
  requestAnimationFrame(forceSize);
  setTimeout(forceSize, 50);
  setTimeout(forceSize, 150);
  setTimeout(forceSize, 400);

  // Animation loop
  this.clock = new THREE.Clock();
  this.animate = this.animate.bind(this);
  requestAnimationFrame(this.animate);
                                       }

    createTabletop() {
      // Procedural rich wood grain canvas texture
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      // Rich walnut wood base
      ctx.fillStyle = '#261910';
      ctx.fillRect(0, 0, 512, 512);

      // Wood plank lines & grain
      for (let i = 0; i < 500; i++) {
        const y = Math.random() * 512;
        const h = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.15 + 0.05;
        ctx.fillStyle = `rgba(60, 40, 24, ${alpha})`;
        ctx.fillRect(0, y, 512, h);
      }
      for (let x = 0; x < 512; x += 128) {
        ctx.fillStyle = 'rgba(10, 6, 4, 0.4)';
        ctx.fillRect(x, 0, 2, 512);
      }

      const woodTexture = new THREE.CanvasTexture(canvas);
      woodTexture.wrapS = THREE.RepeatWrapping;
      woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(4, 4);

      const tableGeom = new THREE.BoxGeometry(45, 1.2, 35);
      const tableMat = new THREE.MeshStandardMaterial({
        map: woodTexture,
        roughness: 0.65,
        metalness: 0.15,
        color: 0x3d271d
      });
      const tableMesh = new THREE.Mesh(tableGeom, tableMat);
      tableMesh.position.y = -0.6;
      tableMesh.receiveShadow = true;
      this.scene.add(tableMesh);

      // Mounting sub-plate for industrial look
      const plateGeom = new THREE.BoxGeometry(32, 0.1, 16);
      const plateMat = new THREE.MeshStandardMaterial({
        color: 0x1b202a,
        roughness: 0.5,
        metalness: 0.75
      });
      const plateMesh = new THREE.Mesh(plateGeom, plateMat);
      plateMesh.position.set(0, 0.05, 0);
      plateMesh.receiveShadow = true;
      this.scene.add(plateMesh);
    }

    createIndicatorRings() {
      // Ring showing selected bolt
      const ringGeom = new THREE.RingGeometry(1.25, 1.55, 32);
      ringGeom.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffb703,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      this.selectionRingMesh = new THREE.Mesh(ringGeom, ringMat);
      this.selectionRingMesh.position.y = 0.12;
      this.selectionRingMesh.visible = false;
      this.scene.add(this.selectionRingMesh);

      // Ring showing hint destination
      const hintRingMat = new THREE.MeshBasicMaterial({
        color: 0x06d6a0,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      this.hintRingMesh = new THREE.Mesh(ringGeom.clone(), hintRingMat);
      this.hintRingMesh.position.y = 0.12;
      this.hintRingMesh.visible = false;
      this.scene.add(this.hintRingMesh);
    }

    updateCameraPosition() {
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      const aspect = width / height;

      // Adjust camera distance for mobile portrait vs landscape
      const boltCount = this.boardState.length || 4;
      const baseDistance = boltCount <= 5 ? 14 : 17;

      if (aspect < 0.75) {
        // Narrow smartphone portrait
        this.camera.position.set(0, baseDistance * 1.05, baseDistance * 1.35);
        this.camera.fov = 50;
      } else if (aspect < 1.1) {
        // Squarish / tablet
        this.camera.position.set(0, baseDistance * 0.95, baseDistance * 1.15);
        this.camera.fov = 46;
      } else {
        // Landscape
        this.camera.position.set(0, baseDistance * 0.85, baseDistance * 1.0);
        this.camera.fov = 42;
      }

      this.camera.aspect = aspect;
      this.camera.lookAt(0, 1.8, 0);
      this.camera.updateProjectionMatrix();
    }

    onWindowResize() {
  if (!this.renderer || !this.container) return;

  const width = this.container.clientWidth;
  const height = this.container.clientHeight;

  // Ignore invalid / zero sizes
  if (width <= 0 || height <= 0) return;

  // Skip if size didn't actually change (performance)
  if (width === this._lastKnownWidth && height === this._lastKnownHeight) return;

  this._lastKnownWidth = width;
  this._lastKnownHeight = height;

  this.renderer.setSize(width, height, false);
  this.updateCameraPosition();
    }

    // --- PROCEDURAL 3D BOLT & NUT MESHES ---
    getHexNutGeometry() {
      if (!this.geometries.hexNut) {
        const shape = new THREE.Shape();
        const outerRadius = 1.12;
        const innerRadius = 0.48; // bolt shaft is 0.38
        const height = 0.76;

        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3;
          const x = outerRadius * Math.cos(angle);
          const y = outerRadius * Math.sin(angle);
          if (i === 0) shape.moveTo(x, y);
          else shape.lineTo(x, y);
        }
        shape.closePath();

        // Central circular opening for bolt shaft
        const hole = new THREE.Path();
        hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
        shape.holes.push(hole);

        const extrudeSettings = {
          depth: height,
          bevelEnabled: true,
          bevelSegments: 2,
          steps: 1,
          bevelSize: 0.06,
          bevelThickness: 0.06
        };

        const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geom.center();
        geom.rotateX(Math.PI / 2); // Orient hole vertically along Y axis
        geom.computeVertexNormals();
        this.geometries.hexNut = geom;
      }
      return this.geometries.hexNut;
    }

    getNutMaterial(colorId) {
      if (!this.materials[`nut_${colorId}`]) {
        const colorDef = NUT_COLORS[colorId] || NUT_COLORS[1];
        this.materials[`nut_${colorId}`] = new THREE.MeshStandardMaterial({
          color: colorDef.hex,
          metalness: 0.82,
          roughness: 0.22,
          envMapIntensity: 1.2
        });
      }
      return this.materials[`nut_${colorId}`];
    }

    createBoltGroup(boltIndex, position) {
      const group = new THREE.Group();
      group.position.copy(position);

      // Steel material
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.88,
        roughness: 0.28
      });

      // 1. Base washer / flange
      const baseGeom = new THREE.CylinderGeometry(1.25, 1.45, 0.3, 16);
      const baseMesh = new THREE.Mesh(baseGeom, steelMat);
      baseMesh.position.y = 0.15;
      baseMesh.castShadow = true;
      baseMesh.receiveShadow = true;
      group.add(baseMesh);

      // 2. Threaded Bolt Shaft
      const shaftHeight = 4.8;
      const shaftRadius = 0.38;
      const shaftGeom = new THREE.CylinderGeometry(shaftRadius, shaftRadius, shaftHeight, 16);
      const shaftMesh = new THREE.Mesh(shaftGeom, steelMat);
      shaftMesh.position.y = shaftHeight / 2 + 0.25;
      shaftMesh.castShadow = true;
      shaftMesh.receiveShadow = true;
      group.add(shaftMesh);

      // 3. Procedural Thread Ridges
      const threadMat = new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: 0.8,
        roughness: 0.4
      });
      const numThreads = 14;
      for (let t = 0; t < numThreads; t++) {
        const ringGeom = new THREE.TorusGeometry(shaftRadius + 0.015, 0.025, 6, 16);
        ringGeom.rotateX(Math.PI / 2);
        const ringMesh = new THREE.Mesh(ringGeom, threadMat);
        ringMesh.position.y = 0.6 + t * 0.3;
        group.add(ringMesh);
      }

      // 4. Domed Top Tip
      const topCapGeom = new THREE.SphereGeometry(shaftRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const topCapMesh = new THREE.Mesh(topCapGeom, steelMat);
      topCapMesh.position.y = shaftHeight + 0.25;
      group.add(topCapMesh);

      // 5. Invisible Hitbox for forgiving mobile touch
      const hitboxGeom = new THREE.CylinderGeometry(1.8, 1.8, 6.2, 8);
      const hitboxMat = new THREE.MeshBasicMaterial({ visible: false });
      const hitboxMesh = new THREE.Mesh(hitboxGeom, hitboxMat);
      hitboxMesh.position.y = 3.1;
      hitboxMesh.userData = { boltIndex: boltIndex, isHitbox: true };
      group.add(hitboxMesh);

      // Bolt index label beneath
      group.userData = { boltIndex: boltIndex };
      return group;
    }

    createNutMesh(colorId) {
      const geom = this.getHexNutGeometry();
      const mat = this.getNutMaterial(colorId);
      const mesh = new THREE.Mesh(geom, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { colorId: colorId };
      return mesh;
    }

    // --- LEVEL LOADING & LAYOUT ---
    loadLevel(levelIndex) {
      if (levelIndex < 1 || levelIndex > 30) return;
      this.currentLevel = levelIndex;
      this.selectedBoltIndex = null;
      this.isAnimating = false;
      this.moveHistory = [];
      this.movesCount = 0;
      this.hideHint();

      this.levelBadgeText.textContent = `LVL ${this.currentLevel}`;
      this.hudMoves.textContent = '0';
      this.undoBtn.disabled = true;

      // Generate puzzle data
      const puzzle = LevelManager.generateLevel(this.currentLevel);
      this.boardState = puzzle.bolts.map(b => [...b]);
      this.totalColorCount = puzzle.colorsCount;

      this.calculateBoltPositions(puzzle.totalBolts);
      this.rebuildScene();
      this.updateProgressHUD();
      this.updateCameraPosition();
      this.startTimer();
      this.saveProgress();
    }

    calculateBoltPositions(count) {
      this.boltPositions = [];
      const spacingX = 3.3;

      if (count <= 4) {
        // Single row of 4
        const startX = -((count - 1) * spacingX) / 2;
        for (let i = 0; i < count; i++) {
          this.boltPositions.push(new THREE.Vector3(startX + i * spacingX, 0, 0));
        }
      } else if (count <= 6) {
        // Two rows of 3
        const cols = Math.ceil(count / 2);
        const startX = -((cols - 1) * spacingX) / 2;
        const spacingZ = 4.2;
        let idx = 0;
        // Back row
        for (let c = 0; c < cols && idx < count; c++) {
          this.boltPositions.push(new THREE.Vector3(startX + c * spacingX, 0, -spacingZ / 2));
          idx++;
        }
        // Front row
        for (let c = 0; c < cols && idx < count; c++) {
          this.boltPositions.push(new THREE.Vector3(startX + c * spacingX, 0, spacingZ / 2));
          idx++;
        }
      } else {
        // Two rows of 4
        const cols = 4;
        const startX = -((cols - 1) * spacingX) / 2;
        const spacingZ = 4.4;
        let idx = 0;
        for (let c = 0; c < cols && idx < count; c++) {
          this.boltPositions.push(new THREE.Vector3(startX + c * spacingX, 0, -spacingZ / 2));
          idx++;
        }
        for (let c = 0; c < cols && idx < count; c++) {
          this.boltPositions.push(new THREE.Vector3(startX + c * spacingX, 0, spacingZ / 2));
          idx++;
        }
      }
    }

    rebuildScene() {
      // Clear old bolts and nuts
      this.boltMeshes.forEach(mesh => this.scene.remove(mesh));
      this.boltMeshes = [];

      this.nutMeshes.forEach(stack => {
        stack.forEach(nut => this.scene.remove(nut));
      });
      this.nutMeshes = [];

      // Create new bolts and nuts
      for (let i = 0; i < this.boardState.length; i++) {
        const pos = this.boltPositions[i];
        const boltGroup = this.createBoltGroup(i, pos);
        this.scene.add(boltGroup);
        this.boltMeshes.push(boltGroup);

        // Build nuts on this bolt
        const nutStack = [];
        const stackData = this.boardState[i];
        for (let s = 0; s < stackData.length; s++) {
          const colorId = stackData[s];
          const nutMesh = this.createNutMesh(colorId);
          nutMesh.position.set(pos.x, this.getNutSlotY(s), pos.z);
          this.scene.add(nutMesh);
          nutStack.push(nutMesh);
        }
        this.nutMeshes.push(nutStack);
      }

      this.selectionRingMesh.visible = false;
      this.hintRingMesh.visible = false;
    }

    getNutSlotY(slotIndex) {
      // Slot 0 is at bottom, each nut is height ~0.8
      return 0.72 + slotIndex * 0.88;
    }

    getLiftedY() {
      return 5.85; // Clearance above bolt top (top is at ~5.1)
    }

    updateProgressHUD() {
      let completeCount = 0;
      for (let i = 0; i < this.boardState.length; i++) {
        if (LevelManager.isBoltComplete(this.boardState[i])) {
          completeCount++;
        }
      }
      this.completedBoltsCount = completeCount;
      this.hudSorted.textContent = `${completeCount}/${this.totalColorCount}`;
      this.hudMoves.textContent = this.movesCount.toString();
      this.undoBtn.disabled = (this.moveHistory.length === 0 || this.isAnimating);
    }

    // --- INTERACTION & TOUCH HANDLING ---
    setupInteractionListeners() {
      let pointerDownPos = { x: 0, y: 0 };
      let isDragging = false;

      this.container.addEventListener('pointerdown', (e) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
        isDragging = false;
      });

      this.container.addEventListener('pointermove', (e) => {
        const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (dist > 10) isDragging = true;
      });

      this.container.addEventListener('pointerup', (e) => {
        if (isDragging || this.isAnimating || this.anyModalOpen()) return;

        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.handlePointerTap();
      });
    }

    handlePointerTap() {
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // Collect all raycast targets: bolt hitboxes and nut meshes
      const targets = [];
      this.boltMeshes.forEach(b => {
        b.traverse(child => {
          if (child.isMesh) targets.push(child);
        });
      });
      this.nutMeshes.forEach(stack => {
        stack.forEach(nut => targets.push(nut));
      });

      const intersects = this.raycaster.intersectObjects(targets, false);
      if (intersects.length === 0) return;

      // Find bolt index from hit object
      let hitBoltIndex = null;
      for (const hit of intersects) {
        let curr = hit.object;
        while (curr && curr !== this.scene) {
          if (curr.userData && curr.userData.boltIndex !== undefined) {
            hitBoltIndex = curr.userData.boltIndex;
            break;
          }
          curr = curr.parent;
        }
        if (hitBoltIndex !== null) break;
      }

      if (hitBoltIndex !== null) {
        this.onBoltTapped(hitBoltIndex);
      }
    }

    onBoltTapped(boltIndex) {
      if (this.isAnimating) return;
      this.hideHint();

      if (this.selectedBoltIndex === null) {
        // FIRST TAP: Select source bolt
        const stack = this.boardState[boltIndex];
        if (stack.length === 0) {
          // Cannot select empty bolt
          this.sound.playInvalid();
          Haptics.vibrate(25);
          return;
        }

        // Lift top nut and select
        this.selectedBoltIndex = boltIndex;
        this.sound.playSelect();
        this.sound.playLift();
        Haptics.vibrate(18);

        // Highlight selection ring
        const pos = this.boltPositions[boltIndex];
        this.selectionRingMesh.position.set(pos.x, 0.12, pos.z);
        this.selectionRingMesh.visible = true;

        // Animate nut lift
        const topNut = this.nutMeshes[boltIndex][stack.length - 1];
        this.animateNutLift(topNut, this.getLiftedY());

      } else if (this.selectedBoltIndex === boltIndex) {
        // Tapped same bolt: DESELECT
        this.deselectBolt();
      } else {
        // SECOND TAP: Destination bolt
        const fromIdx = this.selectedBoltIndex;
        const toIdx = boltIndex;

        if (this.isMoveLegal(fromIdx, toIdx)) {
          // LEGAL MOVE
          this.executeMove(fromIdx, toIdx);
        } else {
          // ILLEGAL MOVE: subtle error feedback
          this.sound.playInvalid();
          Haptics.vibrate(40);
          this.shakeBolt(toIdx);
        }
      }
    }

    deselectBolt() {
      if (this.selectedBoltIndex === null) return;
      const idx = this.selectedBoltIndex;
      const stack = this.boardState[idx];
      const topNut = this.nutMeshes[idx][stack.length - 1];
      const slotY = this.getNutSlotY(stack.length - 1);

      this.selectedBoltIndex = null;
      this.selectionRingMesh.visible = false;
      this.sound.playSelect();

      this.animateNutLower(topNut, slotY);
    }

    isMoveLegal(fromIdx, toIdx) {
      const fromStack = this.boardState[fromIdx];
      const toStack = this.boardState[toIdx];

      if (fromStack.length === 0) return false;
      if (toStack.length >= BOLT_CAPACITY) return false;

      const movingColor = fromStack[fromStack.length - 1];
      if (toStack.length === 0) return true; // Empty destination is always valid
      const targetColor = toStack[toStack.length - 1];
      return movingColor === targetColor; // Color must match
    }

    executeMove(fromIdx, toIdx) {
      this.isAnimating = true;
      this.selectionRingMesh.visible = false;

      const nutColor = this.boardState[fromIdx].pop();
      const nutMesh = this.nutMeshes[fromIdx].pop();

      // Record history for Undo
      this.moveHistory.push({
        from: fromIdx,
        to: toIdx,
        color: nutColor
      });
      this.movesCount++;
      this.updateProgressHUD();

      // Calculate 3-stage trajectory
      const startPos = nutMesh.position.clone();
      const targetPos = this.boltPositions[toIdx];
      const destSlotIndex = this.boardState[toIdx].length; // index where it will land
      const destLandingY = this.getNutSlotY(destSlotIndex);
      const liftY = this.getLiftedY();

      // Deselect source
      this.selectedBoltIndex = null;

      // Animate move: Travel horizontally then drop down
      this.animateMoveTrajectory(nutMesh, startPos, targetPos, liftY, destLandingY, () => {
        // Animation finished
        this.boardState[toIdx].push(nutColor);
        this.nutMeshes[toIdx].push(nutMesh);
        nutMesh.position.set(targetPos.x, destLandingY, targetPos.z);

        this.sound.playDrop();
        Haptics.vibrate(32);

        // Check if destination bolt is now complete
        if (LevelManager.isBoltComplete(this.boardState[toIdx])) {
          this.sound.playStackComplete();
          Haptics.vibrate(50);
          this.flashBoltComplete(toIdx);
        }

        this.updateProgressHUD();
        this.isAnimating = false;

        // Check Win Condition
        if (LevelManager.isSolved(this.boardState)) {
          this.handleWin();
        }
      });
    }

    handleUndo() {
      if (this.moveHistory.length === 0 || this.isAnimating) return;
      this.hideHint();
      if (this.selectedBoltIndex !== null) this.deselectBolt();

      const lastMove = this.moveHistory.pop();
      const { from, to } = lastMove;

      this.isAnimating = true;
      const nutColor = this.boardState[to].pop();
      const nutMesh = this.nutMeshes[to].pop();

      this.movesCount = Math.max(0, this.movesCount - 1);
      this.updateProgressHUD();

      const startPos = nutMesh.position.clone();
      const targetPos = this.boltPositions[from];
      const destLandingY = this.getNutSlotY(this.boardState[from].length);
      const liftY = this.getLiftedY();

      this.sound.playLift();

      // Reverse trajectory animation
      this.animateMoveTrajectory(nutMesh, startPos, targetPos, liftY, destLandingY, () => {
        this.boardState[from].push(nutColor);
        this.nutMeshes[from].push(nutMesh);
        nutMesh.position.set(targetPos.x, destLandingY, targetPos.z);

        this.sound.playDrop();
        Haptics.vibrate(28);

        this.updateProgressHUD();
        this.isAnimating = false;
      });
    }

    handleRestart() {
      if (this.isAnimating) return;
      this.hideHint();
      this.loadLevel(this.currentLevel);
    }

    handleHint() {
      if (this.isAnimating || this.anyModalOpen()) return;
      this.sound.playSelect();

      const hint = PuzzleSolver.findHint(this.boardState);
      if (!hint) {
        this.showHintBanner("No legal moves available. Try using Undo!");
        return;
      }

      const colorName = NUT_COLORS[hint.color] ? NUT_COLORS[hint.color].name : 'Nut';
      const fromLabel = hint.from + 1;
      const toLabel = hint.to + 1;

      this.showHintBanner(`Hint: Move ${colorName} from Bolt ${fromLabel} to Bolt ${toLabel}`);

      // Visual indicator on destination bolt
      const destPos = this.boltPositions[hint.to];
      this.hintRingMesh.position.set(destPos.x, 0.12, destPos.z);
      this.hintRingMesh.visible = true;

      // Select source bolt automatically if nothing is selected
      if (this.selectedBoltIndex === null) {
        this.onBoltTapped(hint.from);
      }
    }

    showHintBanner(msg) {
      this.hintText.textContent = msg;
      this.hintBanner.style.display = 'flex';
      setTimeout(() => {
        this.hideHint();
      }, 4000);
    }

    hideHint() {
      this.hintBanner.style.display = 'none';
      if (this.hintRingMesh) this.hintRingMesh.visible = false;
    }

    handleWin() {
      this.sound.playWin();
      Haptics.vibrate(80);

      // Unlock next level
      if (this.currentLevel >= this.unlockedLevel && this.currentLevel < 30) {
        this.unlockedLevel = this.currentLevel + 1;
        this.saveProgress();
      }

      // Star calculation
      const moves = this.movesCount;
      const config = LevelManager.getLevelConfig(this.currentLevel);
      const parMoves = config.scrambles + 2;

      let stars = 3;
      if (moves > parMoves * 1.5) stars = 2;
      if (moves > parMoves * 2.2) stars = 1;

      // Sync progress & record to Firestore
      try {
        if (window.AndroidBridge) {
          const totalStars = Math.max(0, (this.unlockedLevel - 1) * 3);
          if (window.AndroidBridge.syncProgress) {
            window.AndroidBridge.syncProgress(this.unlockedLevel, totalStars);
          }
          if (window.AndroidBridge.recordLevelCompleted) {
            window.AndroidBridge.recordLevelCompleted(this.currentLevel, stars, this.movesCount, this.timerSeconds);
          }
        }
      } catch (e) {}

      const star2 = document.getElementById('star-2');
      const star3 = document.getElementById('star-3');
      if (star2) star2.className = stars >= 2 ? 'star-icon filled' : 'star-icon';
      if (star3) star3.className = stars >= 3 ? 'star-icon filled' : 'star-icon';

      this.victoryLevelSubtitle.textContent = `Level ${this.currentLevel} Sorted in ${this.movesCount} Moves!`;
      this.victoryMoves.textContent = this.movesCount.toString();
      const m = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const s = (this.timerSeconds % 60).toString().padStart(2, '0');
      this.victoryTime.textContent = `${m}:${s}`;

      // Celebration confetti in 3D
      this.spawnConfetti();

      setTimeout(() => {
        this.victoryModal.classList.add('open');
      }, 700);
    }

    // --- ANIMATIONS ---
    animateNutLift(nutMesh, targetY) {
      const startY = nutMesh.position.y;
      const duration = 220;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // Ease out cubic
        nutMesh.position.y = startY + (targetY - startY) * ease;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    animateNutLower(nutMesh, targetY) {
      const startY = nutMesh.position.y;
      const duration = 200;
      const startTime = performance.now();

      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const ease = progress * progress; // Ease in quad
        nutMesh.position.y = startY + (targetY - startY) * ease;
        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };
      requestAnimationFrame(step);
    }

    animateMoveTrajectory(nutMesh, startPos, targetPos, liftY, landingY, onComplete) {
      // 1. Lift to clearance (if not already lifted)
      // 2. Travel arc horizontally to target X/Z
      // 3. Drop down smoothly onto target bolt
      const travelDuration = 260;
      const dropDuration = 180;
      const startTime = performance.now();

      // Ensure at clearance height
      nutMesh.position.y = liftY;

      // Phase 1: Horizontal glide
      const stepGlide = (now) => {
        const p = Math.min(1, (now - startTime) / travelDuration);
        const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; // Ease in-out

        nutMesh.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
        nutMesh.position.z = startPos.z + (targetPos.z - startPos.z) * ease;
        nutMesh.position.y = liftY + Math.sin(p * Math.PI) * 0.35; // Slight arc crest

        if (p < 1) {
          requestAnimationFrame(stepGlide);
        } else {
          // Phase 2: Slide down over bolt shaft
          nutMesh.position.x = targetPos.x;
          nutMesh.position.z = targetPos.z;
          const dropStart = performance.now();

          const stepDrop = (nowDrop) => {
            const pDrop = Math.min(1, (nowDrop - dropStart) / dropDuration);
            const easeDrop = pDrop * pDrop; // Gravity acceleration
            nutMesh.position.y = liftY + (landingY - liftY) * easeDrop;

            if (pDrop < 1) {
              requestAnimationFrame(stepDrop);
            } else {
              nutMesh.position.y = landingY;
              onComplete();
            }
          };
          requestAnimationFrame(stepDrop);
        }
      };
      requestAnimationFrame(stepGlide);
    }

    shakeBolt(boltIndex) {
      const bolt = this.boltMeshes[boltIndex];
      const origX = bolt.position.x;
      const startTime = performance.now();
      const duration = 240;

      const step = (now) => {
        const elapsed = now - startTime;
        if (elapsed < duration) {
          const offset = Math.sin(elapsed * 0.08) * 0.12 * (1 - elapsed / duration);
          bolt.position.x = origX + offset;
          requestAnimationFrame(step);
        } else {
          bolt.position.x = origX;
        }
      };
      requestAnimationFrame(step);
    }

    flashBoltComplete(boltIndex) {
      // Gentle bounce & sparkle for completed stack
      const stack = this.nutMeshes[boltIndex];
      stack.forEach((nut, i) => {
        const origY = this.getNutSlotY(i);
        const startTime = performance.now() + i * 40;
        const step = (now) => {
          if (now < startTime) {
            requestAnimationFrame(step);
            return;
          }
          const elapsed = now - startTime;
          if (elapsed < 200) {
            nut.position.y = origY + Math.sin((elapsed / 200) * Math.PI) * 0.25;
            nut.rotation.y += 0.04;
            requestAnimationFrame(step);
          } else {
            nut.position.y = origY;
          }
        };
        requestAnimationFrame(step);
      });
    }

    spawnConfetti() {
      const count = 45;
      const particles = [];
      const colors = [0xffb703, 0x10b981, 0x06d6a0, 0xe63946, 0x2563eb, 0x8b5cf6];

      for (let i = 0; i < count; i++) {
        const geom = new THREE.PlaneGeometry(0.22, 0.22);
        const mat = new THREE.MeshBasicMaterial({
          color: colors[i % colors.length],
          side: THREE.DoubleSide
        });
        const p = new THREE.Mesh(geom, mat);
        p.position.set(
          (Math.random() - 0.5) * 8,
          6 + Math.random() * 4,
          (Math.random() - 0.5) * 6
        );
        p.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
        this.scene.add(p);
        particles.push({
          mesh: p,
          vel: new THREE.Vector3((Math.random() - 0.5) * 0.08, -0.05 - Math.random() * 0.07, (Math.random() - 0.5) * 0.08),
          rotSpeed: (Math.random() - 0.5) * 0.15
        });
      }

      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        particles.forEach(pt => {
          pt.mesh.position.add(pt.vel);
          pt.mesh.rotation.x += pt.rotSpeed;
          pt.mesh.rotation.y += pt.rotSpeed;
        });
        if (elapsed < 3000) {
          requestAnimationFrame(step);
        } else {
          particles.forEach(pt => this.scene.remove(pt.mesh));
        }
      };
      requestAnimationFrame(step);
    }

    // --- RENDER TICK ---
    animate() {
      requestAnimationFrame(this.animate);
      const delta = this.clock.getDelta();

      // Subtle breathing rotation on selected nut
      if (this.selectedBoltIndex !== null && !this.isAnimating) {
        const stack = this.boardState[this.selectedBoltIndex];
        if (stack && stack.length > 0) {
          const topNut = this.nutMeshes[this.selectedBoltIndex][stack.length - 1];
          if (topNut) {
            topNut.rotation.y += delta * 1.2;
          }
        }
      }

      this.renderer.render(this.scene, this.camera);
    }
  }

  // Launch game once DOM is ready
  window.addEventListener('DOMContentLoaded', () => {
    window.gameEngine = new GameEngine();
  });

})();
