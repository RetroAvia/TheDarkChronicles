import { SaveManager } from './SaveManager.js';
import { AudioEngine } from './AudioEngine.js';
import { InputManager } from './InputManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Camera } from './Camera.js';
import { GFX, applyQuality, applyReducedMotion } from './quality.js';
import { Player } from '../entities/Player.js';
import { Projectile } from '../entities/Projectile.js';
import { LevelRuntime } from '../world/LevelRuntime.js';
import { LEVELS } from '../world/levels.js';
import { getPalette } from '../world/palettes.js';
import { drawBackground } from '../world/backgrounds.js';
import {
  drawPlatform, drawCollectible, drawEnemy, drawBoss, drawGoal, drawPlayer,
  drawHazard, drawProjectile, drawCheckpoint, drawPortalVortex, drawArenaAtmosphere,
  drawMeleeSlash, drawTutorialSign
} from './WorldRenderer.js';
import { getStory } from '../narrative/story.js';
import { shuffledQuizPool } from '../narrative/quiz.js';
import { generateRewardCode, getRewardInfo, getRewardTier, MIDPOINT_LEVEL } from '../rewards/rewards.js';
import { aabbIntersect, clamp } from '../utils/math.js';
import { mount, clearRoot, flashScreen } from '../ui/dom.js';
import { MainMenu } from '../ui/MainMenu.js';
import { HUD } from '../ui/HUD.js';
import { BossBar } from '../ui/BossBar.js';
import { StoryOverlay } from '../ui/StoryOverlay.js';
import { QuizOverlay } from '../ui/QuizOverlay.js';
import { PauseMenu, TutorialModal, TutorialCompleteModal, RewardModal, GameCompleteModal, GameOverModal } from '../ui/Modals.js';
import { MobileControls, TutorialHint } from '../ui/MobileControls.js';
import { OrientationOverlay } from '../ui/OrientationOverlay.js';
import { showToast } from '../ui/Toast.js';
import { isTouchDevice } from '../utils/device.js';

const MAX_LEVELS = LEVELS.length;
const REWARD_LEVELS = new Set([MIDPOINT_LEVEL, MAX_LEVELS]);

const ABILITY_LABEL = {
  doubleJump: '🦘 Nuova abilità: DOPPIO SALTO — premi di nuovo SPAZIO mentre sei in aria',
  dash: '💨 Nuova abilità: SCATTO — premi MAIUSC (o il pulsante blu su mobile) per uno scatto rapido'
};

export class Game {
  constructor(renderer) {
    this.renderer = renderer;
    this.appEl = document.getElementById('app');

    this.save = new SaveManager();
    applyQuality(this.save.data.settings.quality || 'auto');
    applyReducedMotion();
    this.renderer.allowPortrait = !!this.save.data.settings.allowPortrait;
    this.renderer.refreshQuality();

    this.audio = new AudioEngine(this.save);
    this.input = new InputManager();
    this.particles = new ParticleSystem();
    this.camera = new Camera();
    this.player = new Player();

    this.state = 'menu';
    this.currentLevelIndex = 1;
    this.level = null;
    this.score = 0;
    this.levelStartScore = 0;
    this.gameTime = 0;
    this.heroName = this.save.data.heroName || '';
    this.elapsed = 0;
    this._goalToastCooldown = 0;
    this.respawnPoint = null;
    this.hasCheckpoint = false;
    this.pendingAbilityToast = null;
    this.portal = null;
    this.collectedCrystalIndices = new Set();
    this._quizPool = [];
    this._orientationNode = null;

    this.hud = null;
    this.bossBar = null;
    this.mobileControls = null;
    this.tutorialHint = null;

    const unlock = () => this.audio.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    // iOS suspends the AudioContext when the app goes to the background and
    // never resumes it on its own — without this the game comes back silent.
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) this.audio.unlock();
    });

    this._onViewportChange = () => this._checkOrientation();
    window.addEventListener('resize', this._onViewportChange);
    window.addEventListener('orientationchange', this._onViewportChange);

    this.showMainMenu();
    this._checkOrientation();
  }

  // ----------------------------------------------------------- orientation

  /** A platformer needs horizontal room. Held upright, a phone shows barely a
   * third of what the level design assumes, so touch devices in portrait get
   * a rotate prompt (dismissible — see OrientationOverlay) and gameplay is
   * suspended behind it rather than run blind. */
  _checkOrientation() {
    const shouldBlock = isTouchDevice() && this.renderer.isPortrait && !this.renderer.allowPortrait;

    if (shouldBlock && !this._orientationNode) {
      if (this.state === 'playing') this.pause();
      this._orientationNode = OrientationOverlay({
        onDismiss: () => {
          this.renderer.allowPortrait = true;
          this.save.setSetting('allowPortrait', true);
          this._checkOrientation();
        }
      });
      document.body.appendChild(this._orientationNode);
    } else if (!shouldBlock && this._orientationNode) {
      this._orientationNode.remove();
      this._orientationNode = null;
    }
  }

  setQuality(setting) {
    this.save.setSetting('quality', setting);
    const tier = applyQuality(setting);
    this.renderer.refreshQuality();
    return tier;
  }

  // ---------------------------------------------------------------- screens

  _clearOverlay() {
    clearRoot();
    this.hud = null;
    this.bossBar = null;
    this.mobileControls = null;
    this.tutorialHint = null;
  }

  showMainMenu() {
    this.state = 'menu';
    this.audio.stopAmbient();
    this._clearOverlay();
    // Without this the canvas kept rendering the LAST level's background
    // (Omega's red storm, say) behind a menu whose CSS accent had already
    // reset to dimension 1's cyan.
    this.level = null;
    this.camera.reset(0, 0);
    this.particles.clear();
    this.appEl.dataset.dimension = '1';
    const node = MainMenu({
      save: this.save,
      audioEnabled: this.audio.enabled,
      onStart: (name, classId, levelOverride) => this.startGame(name, classId, levelOverride),
      onTutorial: () => this.showTutorial(),
      onPlayTutorial: () => this.startTutorial(),
      onToggleAudio: () => this.audio.toggle(),
      onReset: () => { this.save.reset(); this.showMainMenu(); }
    });
    mount(node);
  }

  showTutorial() {
    const prevState = this.state;
    this._clearOverlay();
    mount(TutorialModal({ onClose: () => (prevState === 'menu' ? this.showMainMenu() : this.pause()) }));
  }

  /** "Level 0": a short, real playable tutorial (see world/levels.js
   * TUTORIAL_LEVEL) — deliberately a separate entry point from startGame/
   * loadLevel so it can never touch save progress, the quiz pool, reward
   * logic, or currentLevelIndex bounds used elsewhere. */
  startTutorial() {
    this._fadeCanvasIn();

    this.currentLevelIndex = 0;
    this.level = new LevelRuntime(0);
    this.player.abilities = { doubleJump: true, dash: true, ranged: true, melee: true };
    this.player.maxEnergy = 3;
    this.respawnPoint = { x: this.level.data.spawn.x, y: this.level.data.spawn.y };
    this.collectedCrystalIndices = new Set();
    this.hasCheckpoint = true;
    this.score = 0;
    this.levelStartScore = 0;
    this.gameTime = 0;
    const spawn = this.respawnPoint;
    this.player.spawn(spawn.x, spawn.y);
    this._resetCameraTo(spawn.x, spawn.y);
    this.particles.clear();
    this.appEl.dataset.dimension = '1';
    this.audio.startAmbient(1);
    flashScreen();
    this.beginPlaying();

    const shootBtn = document.querySelector('.ra-touch-btn--shoot');
    if (shootBtn) shootBtn.hidden = false;
  }

  startGame(heroName, classId, levelOverride = null) {
    this.heroName = heroName;
    this.save.setHeroName(heroName);
    if (classId) this.save.setClass(classId);
    this.score = 0;
    this.levelStartScore = 0;
    this.gameTime = 0;
    this._quizPool = [];
    this._syncAbilitiesFromProgress();
    flashScreen();
    const unlockedUpTo = clamp(this.save.data.bestLevel, 1, MAX_LEVELS);
    // Level select (see MainMenu's map): any dimension already unlocked can be
    // replayed directly. Previously a player who finished the game was stuck
    // on "Continua — Dimensione 8" with no way back to the earlier worlds.
    const start = levelOverride ? clamp(levelOverride, 1, unlockedUpTo) : unlockedUpTo;
    this.loadLevel(start, { showIntro: true, resetCheckpoint: true });
  }

  /** Safety net: if bestLevel implies an ability should already be unlocked, make sure it is. */
  _syncAbilitiesFromProgress() {
    const best = this.save.data.bestLevel;
    if (best >= 2) this.save.unlockAbility('doubleJump');
    if (best >= 3) this.save.unlockAbility('dash');
    this.player.abilities = { ...this.save.data.abilities };
    this._applyClassBonuses();
  }

  /** The class chosen at game start grants a permanent, thematic head start.
   * Re-applied on every loadLevel too, since that resets player.abilities
   * from the raw save data first. */
  _applyClassBonuses() {
    // The plasma blade is a base weapon, not a class perk — everyone has it.
    this.player.abilities.melee = true;
    const cls = this.save.data.chosenClass;
    if (cls === 'acrobata') {
      this.player.abilities.doubleJump = true;
      this.player.abilities.dash = true;
    } else if (cls === 'tiratore') {
      this.player.abilities.ranged = true;
    }
    this.player.maxEnergy = cls === 'guardiano' ? 4 : 3;
  }

  _fadeCanvasIn() {
    const canvas = this.renderer.canvas;
    if (GFX.reduceMotion) { canvas.style.opacity = '1'; return; }
    canvas.style.transition = 'none';
    canvas.style.opacity = '0';
    requestAnimationFrame(() => {
      canvas.style.transition = 'opacity 0.4s ease';
      canvas.style.opacity = '1';
    });
  }

  /** Snaps the camera to a freshly-spawned player without the smooth follow
   * sliding in from wherever it was. */
  _resetCameraTo(x, y) {
    const { viewW, viewH } = this.renderer;
    const b = this.level.viewBounds;
    const camX = clamp(x + this.player.w / 2 - viewW / 2, 0, Math.max(0, b.worldW - viewW));
    const contentH = b.bottom - b.top;
    const camY = contentH <= viewH
      ? (b.top + b.bottom) / 2 - viewH / 2
      : clamp(y + this.player.h / 2 - viewH * 0.5, b.top, b.bottom - viewH);
    this.camera.reset(camX, camY);
  }

  loadLevel(index, { showIntro, resetCheckpoint = true }) {
    this._fadeCanvasIn();

    this.currentLevelIndex = index;
    this.level = new LevelRuntime(index);
    this.player.abilities = { ...this.save.data.abilities };
    this._applyClassBonuses();
    if (resetCheckpoint) {
      this.respawnPoint = { x: this.level.data.spawn.x, y: this.level.data.spawn.y };
      this.collectedCrystalIndices = new Set();
      this.hasCheckpoint = false;
    } else {
      for (const idx of this.collectedCrystalIndices) {
        const c = this.level.collectibles[idx];
        if (c) c.collected = true;
      }
    }
    this.levelStartScore = this.score;
    const spawn = this.respawnPoint || this.level.data.spawn;
    this.player.spawn(spawn.x, spawn.y);
    this._resetCameraTo(spawn.x, spawn.y);
    this.particles.clear();
    this.appEl.dataset.dimension = String(index);
    this.audio.startAmbient(index);

    if (showIntro) this.showStory(index, 'intro');
    else this.beginPlaying();
  }

  showStory(level, type) {
    this.state = 'story';
    this._clearOverlay();
    const story = getStory(level, type);
    mount(StoryOverlay({
      story,
      onContinue: () => {
        this.audio.play('button');
        if (type === 'intro') this.beginPlaying();
        else this._processAfterOutro();
      }
    }));
  }

  _processAfterOutro() {
    const level = this.currentLevelIndex;
    const unlockKey = LEVELS[level - 1]?.unlocksAfterClear;
    if (unlockKey && this.save.unlockAbility(unlockKey)) {
      this.pendingAbilityToast = ABILITY_LABEL[unlockKey];
    }

    const proceed = () => {
      if (REWARD_LEVELS.has(level)) {
        this.showReward(level);
      } else if (level < MAX_LEVELS) {
        this.loadLevel(level + 1, { showIntro: true, resetCheckpoint: true });
      } else {
        this.showGameComplete();
      }
    };

    if (level < MAX_LEVELS) this.showQuiz(proceed);
    else proceed();
  }

  showQuiz(onDone) {
    this.state = 'quiz';
    this._clearOverlay();
    const question = this._pickQuizQuestion();
    const bonusPoints = 250;
    const malusPoints = 100;
    mount(QuizOverlay({
      question,
      bonusPoints,
      malusPoints,
      onAnswer: (isCorrect) => {
        if (isCorrect) {
          this.score += bonusPoints;
          this.audio.play('quizCorrect');
        } else {
          // Never below 0, and score never gates a discount code — this can
          // only ever cost bragging rights, never a conversion.
          this.score = Math.max(0, this.score - malusPoints);
          this.audio.play('quizWrong');
        }
      },
      onContinue: () => {
        this.audio.play('button');
        onDone();
      }
    }));
  }

  _pickQuizQuestion() {
    if (this._quizPool.length === 0) this._quizPool = shuffledQuizPool();
    return this._quizPool.pop();
  }

  beginPlaying() {
    this.state = 'playing';
    this._clearOverlay();
    this.hud = new HUD({ maxEnergy: this.player.maxEnergy, onPause: () => this.pause() });
    mount(this.hud.node);
    if (this.level?.boss) {
      this.bossBar = new BossBar();
      mount(this.bossBar.node);
    }
    if (isTouchDevice()) {
      this.mobileControls = MobileControls(this.input, this.player.abilities.dash);
      mount(this.mobileControls);
      if (this.player.abilities.ranged) {
        const shootBtn = this.mobileControls.querySelector('.ra-touch-btn--shoot');
        if (shootBtn) shootBtn.hidden = false;
      }
    } else {
      this.tutorialHint = TutorialHint(this.player.abilities);
      mount(this.tutorialHint);
      const hint = this.tutorialHint;
      setTimeout(() => {
        if (!hint.isConnected) return;
        hint.style.transition = 'opacity 0.6s';
        hint.style.opacity = '0';
        setTimeout(() => hint.remove(), 650);
      }, 5500);
    }
    if (this.pendingAbilityToast) {
      showToast(this.pendingAbilityToast, 4200);
      this.pendingAbilityToast = null;
    }
    this._checkOrientation();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.audio.play('button');
    mount(PauseMenu({
      onResume: () => this.resume(),
      onRestart: () => {
        this._removePauseOverlay();
        // The tutorial never flows through loadLevel() (see startTutorial).
        if (this.currentLevelIndex === 0) this.startTutorial();
        else {
          this.score = this.levelStartScore;
          this.loadLevel(this.currentLevelIndex, { showIntro: false, resetCheckpoint: true });
        }
      },
      onHome: () => this.showMainMenu(),
      audioEnabled: this.audio.enabled,
      onToggleAudio: () => this.audio.toggle(),
      quality: this.save.data.settings.quality || 'auto',
      onSetQuality: (q) => this.setQuality(q)
    }));
  }

  _removePauseOverlay() {
    document.querySelectorAll('.ra-screen').forEach((n) => n.remove());
  }

  resume() {
    this.state = 'playing';
    this._removePauseOverlay();
    this.audio.play('button');
  }

  showReward(level) {
    this.state = 'reward';
    this._clearOverlay();
    const { discount, minimum } = getRewardInfo(level);
    const tier = getRewardTier(level);

    // One player, one code per tier — for good. Replaying a reward level
    // re-shows the code already issued instead of minting a new one, because
    // codes are redeemed by email and reconciled by hand.
    let code = this.save.getRewardCode(tier);
    const isNew = !code;
    if (isNew) {
      code = generateRewardCode(level, this.heroName);
      this.save.setRewardCode(tier, code);
    }

    this.audio.play('reward');
    mount(RewardModal({
      level, maxLevel: MAX_LEVELS, code, discount, minimum, score: this.score,
      heroName: this.heroName, isNew,
      onContinue: () => {
        this.audio.play('button');
        if (level < MAX_LEVELS) this.loadLevel(level + 1, { showIntro: true, resetCheckpoint: true });
        else this.showGameComplete();
      }
    }));
  }

  showGameComplete() {
    this.state = 'complete';
    this.save.markGameCompleted();
    this.save.recordLevelResult(MAX_LEVELS, this.score, true);
    this._clearOverlay();
    this.audio.play('goal');
    mount(GameCompleteModal({
      heroName: this.heroName, gameTime: this.gameTime, score: this.score,
      energy: this.player.energy, maxEnergy: this.player.maxEnergy,
      onHome: () => this.showMainMenu()
    }));
  }

  triggerGameOver() {
    this.state = 'gameover';
    this.save.recordLevelResult(this.currentLevelIndex, this.score, false);
    this.audio.stopAmbient();
    this.audio.play('gameover');
    this._clearOverlay();
    const finalScore = this.score;
    mount(GameOverModal({
      level: this.currentLevelIndex, maxLevel: MAX_LEVELS, score: finalScore, gameTime: this.gameTime,
      bestLevel: this.save.data.bestLevel,
      onRetry: () => {
        // Rewind the score to where this level started: without this, dying
        // repeatedly inflated both the run total and the saved best score.
        this.score = this.levelStartScore;
        this.loadLevel(this.currentLevelIndex, { showIntro: false, resetCheckpoint: false });
      },
      onHome: () => this.showMainMenu()
    }));
  }

  levelComplete() {
    this.state = 'level-complete';
    const bonus = 1000 + this.player.energy * 300;
    this.score += bonus;
    this.save.recordLevelResult(this.currentLevelIndex, this.score, true);
    this.audio.play('goal');
    this.camera.shake(4, 0.3);
    this.showStory(this.currentLevelIndex, 'outro');
  }

  // ----------------------------------------------------------------- update

  update(dt) {
    this.elapsed += dt;

    if (this.state === 'playing') {
      this.gameTime += dt * 1000;
      this._updateGameplay(dt);
    } else if (this.state === 'portal') {
      this._updatePortal(dt);
    } else if (this.state === 'paused') {
      // ESC/P now toggles the pause menu instead of only opening it.
      if (this.input.consumePausePressed()) { this.resume(); return; }
    }

    this.camera.update(dt);
  }

  /** One-time black-hole set-piece: freezes normal play, pulls the player in
   * visually, then drops them into the boss arena at a fixed entry point. */
  _startBossPortal() {
    const arena = this.level.data.bossArena;
    if (!arena || this.level.bossPortalTriggered) return;
    this.level.bossPortalTriggered = true;
    this.state = 'portal';
    this.portal = { t: 0, duration: 1.6, teleported: false, arena };
    this.player.vx = 0;
    this.player.vy = 0;
    this.audio.play('warp');
    this.camera.shake(3, 0.3);
  }

  _updatePortal(dt) {
    const p = this.portal;
    if (!p) { this.state = 'playing'; return; }
    p.t += dt;
    const { player, particles } = this;
    const cx = player.x + player.w / 2, cy = player.y + player.h / 2;

    if (!p.teleported && Math.random() < 0.85) {
      const a = Math.random() * Math.PI * 2;
      const r = 55 + Math.random() * 95;
      particles.emit('vortexIn', cx + Math.cos(a) * r, cy + Math.sin(a) * r, {
        targetX: cx, targetY: cy,
        color: Math.random() < 0.55 ? 'rgba(139,92,246,0.85)' : 'rgba(255,59,59,0.7)'
      });
    }
    particles.update(dt);

    if (!p.teleported && p.t > p.duration * 0.55) {
      p.teleported = true;
      player.resetPosition(p.arena.entryX, p.arena.entryY);
      player.invulnerable = true;
      player.invulnTime = 1.4;
      this.level.inBossArena = true;
      this.respawnPoint = { x: p.arena.entryX, y: p.arena.entryY };
      // Projectiles still in flight belong to the room we just left.
      this.level.projectiles.length = 0;
      this._resetCameraTo(p.arena.entryX, p.arena.entryY);
      this.audio.play('warpArrive');
      particles.clear();
      particles.emit('vortexIn', player.x + player.w / 2, player.y + player.h / 2 - 60, {
        targetX: player.x + player.w / 2, targetY: player.y + player.h / 2
      });
      if (this.level.boss && !this.bossBar) {
        this.bossBar = new BossBar();
        mount(this.bossBar.node);
      }
      // A one-fight power-up for the final showdown — never persisted.
      player.abilities.ranged = true;
      const shootBtn = document.querySelector('.ra-touch-btn--shoot');
      if (shootBtn) shootBtn.hidden = false;
    }

    if (p.t >= p.duration) {
      this.portal = null;
      this.state = 'playing';
      showToast('🔫 Nuovo potere: FUOCO A DISTANZA — premi F (o il pulsante viola) per colpire il boss da lontano', 5000);
    }
  }

  _updateGameplay(dt) {
    const { input, player, level, particles } = this;

    if (input.consumePausePressed()) { this.pause(); return; }
    if (input.consumeJumpPressed()) player.requestJump();
    if (input.consumeDashPressed()) { player.requestDash(); }
    if (input.consumeShootPressed()) player.requestShoot();
    if (input.consumeAttackPressed()) player.requestAttack();
    if (!input.state.jump) player.releaseJump();

    const wasOnGround = player.onGround;
    player.update(dt, input.state, level);

    if (player.jumpedThisFrame) { this.audio.play('jump'); particles.emit('jump', player.x + player.w / 2, player.y + player.h); }
    if (player.doubleJumpedThisFrame) { this.audio.play('doubleJump'); particles.emit('sparkle', player.x + player.w / 2, player.y + player.h / 2, { color: 'rgba(180,220,255,0.9)' }); }
    if (player.dashJustStarted) { this.audio.play('dash'); particles.emit('dust', player.x + player.w / 2, player.y + player.h / 2, { dir: player.facing }); }
    if (player.landedThisFrame && !wasOnGround) { this.audio.play('land'); particles.emit('dust', player.x + player.w / 2, player.y + player.h, { dir: 1 }); }
    if (player.justFired) {
      const muzzleX = player.x + player.w / 2 + player.facing * player.w * 0.6;
      const muzzleY = player.y + player.h * 0.4;
      level.addProjectile(new Projectile({
        x: muzzleX, y: muzzleY, vx: player.facing * 520, vy: 0,
        color: '#c58bff', w: 12, h: 12, owner: 'player'
      }));
      particles.emit('sparkle', muzzleX, muzzleY, { color: 'rgba(197,139,255,0.9)' });
      this.audio.play('playerShoot');
    }
    if (player.attackJustStarted) {
      const swingX = player.x + player.w / 2 + player.facing * player.w * 0.7;
      const swingY = player.y + player.h * 0.45;
      particles.emit('slash', swingX, swingY, { dir: player.facing });
      this.audio.play('melee');
    }
    if (player.springBouncedThisFrame) {
      this.audio.play('doubleJump');
      particles.emit('sparkle', player.x + player.w / 2, player.y + player.h, { color: 'rgba(255,210,63,0.9)' });
      particles.emit('dust', player.x + player.w / 2, player.y + player.h, { dir: 1 });
      this.camera.shake(2, 0.15);
    }
    if (Math.abs(player.vx) > 40 && player.onGround && Math.random() < 0.25) {
      particles.emit('dust', player.x + player.w / 2, player.y + player.h);
    }

    const arena = level.data.bossArena;
    if (arena && level.arenaBoss && level.arenaBoss.alive && !level.bossPortalTriggered) {
      if (player.x > arena.triggerX) {
        this._startBossPortal();
        return;
      }
      if (arena.triggerX - player.x < 420 && Math.random() < 0.4) {
        particles.emit('portal', arena.triggerX, player.y + player.h / 2 + (Math.random() * 80 - 40), {
          color: 'rgba(139,92,246,0.55)'
        });
      }
    }

    const impacts = level.update(dt, player.x, player.y);
    for (const hit of impacts) {
      particles.emit('hit', hit.x, hit.y, { color: hit.color });
    }
    this._processEmitters();

    if (level.boss && level.boss.consumeVulnerableFlag()) {
      const b = level.boss;
      this.audio.play('bossVulnerable');
      particles.emit('sparkle', b.x + b.w / 2, b.y + b.h / 2, { color: 'rgba(125,255,176,0.9)' });
    }

    if (level.inBossArena && level.boss && level.boss.alive && Math.random() < 0.15 * GFX.particles) {
      const bounds = level.viewBounds;
      const arenaFloorY = level.data.bossArena ? level.data.bossArena.entryY + 60 : bounds.bottom - 40;
      particles.emit('ember', this.camera.x + Math.random() * this.renderer.viewW, arenaFloorY, {
        color: 'rgba(255,100,60,0.55)'
      });
    }

    if (!player.isDying) {
      this._resolveCollectibles();
      this._resolveEnemies();
      this._resolveBoss();
      this._resolvePlayerProjectiles();
      this._resolveHazards();
      this._resolveProjectiles();
      this._resolveCheckpoints();
      this._resolveGoal();
      if (player.y > level.voidY) this._handleVoidFall();
    } else if (player.dyingTime > 0.65) {
      this.triggerGameOver();
      return;
    }

    this.camera.follow(player, this.renderer.viewW, this.renderer.viewH, level.viewBounds);

    if (this.hud) {
      this.hud.update({
        energy: player.energy, maxEnergy: player.maxEnergy,
        crystals: level.collectedCrystals, total: level.totalCrystals,
        levelName: level.data.name.toUpperCase(), score: this.score
      });
    }
    if (this.bossBar && level.boss) {
      this.bossBar.update(level.boss);
    }

    if (this._goalToastCooldown > 0) this._goalToastCooldown -= dt;

    particles.update(dt);
  }

  /** Spawns projectiles for any enemy/boss that flagged wantsToFire this tick. */
  _processEmitters() {
    const { level, player, particles } = this;
    for (const e of level.enemies) {
      if (e.type === 'turret' && e.wantsToFire) {
        particles.emit('sparkle', e.x + e.w / 2, e.y + e.h / 2, { color: 'rgba(255,107,53,0.8)' });
        level.addProjectile(new Projectile({
          x: e.x + e.w / 2, y: e.y + e.h / 2, vx: e.fireDir * 190, vy: 0, color: '#ff6b35'
        }));
        this.audio.play('shoot');
      }
    }
    if (level.boss && level.boss.wantsToFire) {
      const b = level.boss;
      const toPlayer = Math.atan2((player.y + player.h / 2) - (b.y + b.h / 2), (player.x + player.w / 2) - (b.x + b.w / 2));
      const count = b.shotSpread;
      const fanSpread = 0.34;
      for (let i = 0; i < count; i++) {
        const offset = count === 1 ? 0 : -fanSpread / 2 + (fanSpread / (count - 1)) * i;
        const a = toPlayer + offset;
        level.addProjectile(new Projectile({
          x: b.x + b.w / 2, y: b.y + b.h / 2,
          vx: Math.cos(a) * 230, vy: Math.sin(a) * 230,
          color: '#ff3b3b', w: 14, h: 14
        }));
      }
      particles.emit('sparkle', b.x + b.w / 2, b.y + b.h / 2, { color: 'rgba(255,59,59,0.9)' });
      this.audio.play('shoot');
    }

    // Phase 4 only: the instant a charge slams into the arena wall, a
    // shockwave punishes standing too close to the impact.
    if (level.boss) {
      const slam = level.boss.consumeSlamFlag();
      if (slam) {
        particles.emit('explosion', slam.x, slam.y, { color: 'rgba(255,140,40,0.9)' });
        this.camera.shake(7, 0.3);
        this.audio.play('hit');
        const dist = Math.hypot((player.x + player.w / 2) - slam.x, (player.y + player.h / 2) - slam.y);
        if (dist < slam.radius) {
          const hurt = player.takeHit(Math.sign(player.x - slam.x) || 1);
          if (hurt) {
            particles.emit('hit', player.x + player.w / 2, player.y + player.h / 2);
            if (player.energy <= 0) this._onPlayerDeath();
          }
        }
      }
    }
  }

  _resolveCollectibles() {
    const { player, level, particles } = this;
    for (let i = 0; i < level.collectibles.length; i++) {
      const c = level.collectibles[i];
      if (c.collected) continue;
      if (aabbIntersect(player.bounds, { x: c.x, y: c.renderY, w: c.w, h: c.h })) {
        c.collected = true;
        this.collectedCrystalIndices.add(i);
        this.score += 50;
        this.audio.play('crystal');
        particles.emit('sparkle', c.x + c.w / 2, c.renderY + c.h / 2, { color: 'rgba(0,255,200,0.9)' });
      }
    }
  }

  _resolveEnemies() {
    const { player, level, particles } = this;
    for (const e of level.enemies) {
      if (!e.alive) continue;

      if (player.isAttacking && aabbIntersect(player.meleeBounds, e.hurtBounds)) {
        e.kill();
        this.score += 100;
        this.audio.play('hit');
        particles.emit('explosion', e.x + e.w / 2, e.y + e.h / 2, { color: 'rgba(120,220,255,0.85)' });
        this.camera.shake(2, 0.15);
        continue;
      }

      if (!aabbIntersect(player.bounds, e.bounds)) continue;

      const stomping = player.vy > 40 && player.y + player.h - e.y < e.h * 0.6;
      if (stomping) {
        e.kill();
        player.vy = -420;
        player.vx *= 0.18;
        player.squash = -0.42;
        this.score += 100;
        this.audio.play('hit');
        particles.emit('explosion', e.x + e.w / 2, e.y + e.h / 2, { color: 'rgba(255,107,53,0.85)' });
        this.camera.shake(2.5, 0.2);
      } else if (aabbIntersect(player.hurtBounds, e.hurtBounds)) {
        const hurt = player.takeHit(Math.sign(player.x - e.x) || 1);
        if (hurt) {
          this.audio.play('hit');
          particles.emit('hit', player.x + player.w / 2, player.y + player.h / 2);
          this.camera.shake(4, 0.25);
          if (player.energy <= 0) this._onPlayerDeath();
        }
      }
    }
  }

  _resolveBoss() {
    const { player, level, particles } = this;
    const boss = level.boss;
    if (!boss || !boss.alive) return;

    if (player.isAttacking && boss.vulnerable && aabbIntersect(player.meleeBounds, boss.hurtBounds)) {
      const dealt = boss.takeDamage();
      if (dealt) {
        this.score += 150;
        this._onBossDamaged(boss);
        return;
      }
    }

    if (!aabbIntersect(player.bounds, boss.bounds)) return;

    const stomping = player.vy > 40 && player.y + player.h - boss.y < boss.h * 0.55;
    if (stomping && boss.vulnerable) {
      const dealt = boss.takeDamage();
      if (dealt) {
        player.vy = -460;
        const pushDir = Math.sign((player.x + player.w / 2) - (boss.x + boss.w / 2)) || (player.facing || 1);
        player.vx = pushDir * 260;
        player.squash = -0.48;
        player.invulnerable = true;
        player.invulnTime = Math.max(player.invulnTime, 0.5);
        this.score += 150;
        this._onBossDamaged(boss);
      }
    } else if ((!stomping || !boss.vulnerable) && aabbIntersect(player.hurtBounds, boss.hurtBounds)) {
      const hurt = player.takeHit(Math.sign(player.x - boss.x) || 1);
      if (hurt) {
        this.audio.play('hit');
        particles.emit('hit', player.x + player.w / 2, player.y + player.h / 2);
        this.camera.shake(5, 0.3);
        if (player.energy <= 0) this._onPlayerDeath();
      }
    }
  }

  /** The player's ranged shot: one-shots a regular enemy on contact, and
   * against the boss only lands during the same `vulnerable` window a stomp
   * needs — a real alternative to the stomp, not a way to skip the fight. */
  _resolvePlayerProjectiles() {
    const { level, particles } = this;
    const boss = level.boss;
    for (const p of level.projectiles) {
      if (p.dead || p.owner !== 'player') continue;

      let hit = false;
      for (const e of level.enemies) {
        if (!e.alive) continue;
        if (!aabbIntersect(p.hurtBounds, e.hurtBounds)) continue;
        e.kill();
        this.score += 80;
        this.audio.play('hit');
        particles.emit('explosion', e.x + e.w / 2, e.y + e.h / 2, { color: 'rgba(197,139,255,0.85)' });
        hit = true;
        break;
      }

      if (!hit && boss && boss.alive && aabbIntersect(p.hurtBounds, boss.hurtBounds)) {
        const dealt = boss.takeRangedDamage();
        if (dealt) {
          this.score += 60;
          particles.emit('sparkle', p.x, p.y, { color: 'rgba(197,139,255,0.9)' });
          this._onBossDamaged(boss, { small: true });
        }
        hit = true; // consumed even if not vulnerable — it visibly hit
      }

      if (hit) p.dead = true;
    }
  }

  _onBossDamaged(boss, { small = false } = {}) {
    const { particles } = this;
    this.audio.play('hit');
    particles.emit('explosion', boss.x + boss.w / 2, boss.y + boss.h / 2, {
      color: small ? 'rgba(197,139,255,0.85)' : 'rgba(255,59,59,0.9)'
    });
    this.camera.shake(small ? 3 : 6, small ? 0.15 : 0.25);

    const newPhase = boss.consumeEnrageFlag();
    if (newPhase) {
      const shakeByPhase = { 2: 8, 3: 12, 4: 16 };
      const messageByPhase = {
        2: '⚠️ Il boss si infuria!',
        3: '💀 Il boss è furioso!',
        4: '💢 ATTACCO DISPERATO — è allo stremo!'
      };
      this.audio.play('bossRoar');
      this.camera.shake(shakeByPhase[newPhase] || 8, 0.4);
      particles.emit('explosion', boss.x + boss.w / 2, boss.y + boss.h / 2, { color: 'rgba(255,45,74,0.9)' });
      showToast(messageByPhase[newPhase] || messageByPhase[2], 2200);
    }

    if (boss.defeated) {
      this.score += 500;
      particles.emit('explosion', boss.x + boss.w / 2, boss.y + boss.h / 2, { color: 'rgba(255,210,63,0.95)' });
      this.audio.play('bossDefeat');
      this.camera.shake(10, 0.5);
    }
  }

  _resolveHazards() {
    const { player, level, particles } = this;
    for (const h of level.hazards) {
      if (!h.active) continue;
      if (!aabbIntersect(player.hurtBounds, h.hurtBounds)) continue;
      const hurt = player.takeHit(Math.sign(player.x - h.x) || 1);
      if (hurt) {
        this.audio.play('hit');
        particles.emit('hit', player.x + player.w / 2, player.y + player.h / 2, { color: h.type === 'laser' ? 'rgba(255,59,180,0.85)' : 'rgba(255,107,53,0.85)' });
        this.camera.shake(4, 0.25);
        if (player.energy <= 0) this._onPlayerDeath();
      }
    }
  }

  _resolveProjectiles() {
    const { player, level, particles } = this;
    for (const p of level.projectiles) {
      if (p.dead || p.owner === 'player') continue;
      if (!aabbIntersect(player.bounds, p.bounds)) continue;
      if (!aabbIntersect(player.hurtBounds, p.hurtBounds)) continue;
      p.dead = true;
      const hurt = player.takeHit(Math.sign(p.vx) || 1);
      if (hurt) {
        this.audio.play('hit');
        particles.emit('hit', p.x, p.y, { color: p.color });
        this.camera.shake(3.5, 0.2);
        if (player.energy <= 0) this._onPlayerDeath();
      }
    }
  }

  _resolveCheckpoints() {
    const { player, level, particles } = this;
    for (const cp of level.checkpoints) {
      if (cp.activated) continue;
      if (!aabbIntersect(player.bounds, cp.bounds)) continue;
      cp.activated = true;
      this.hasCheckpoint = true;
      this.respawnPoint = { x: cp.x + cp.w / 2 - player.w / 2, y: cp.y + cp.h - player.h };
      this.audio.play('checkpoint');
      particles.emit('sparkle', cp.x + cp.w / 2, cp.y + cp.h / 2, { color: 'rgba(0,212,255,0.9)' });
      showToast('📍 Checkpoint raggiunto');
    }
  }

  /** Central "the player just ran out of energy" handler for every damage
   * source. Once a checkpoint has been reached this attempt, this is a soft
   * continue (respawn there, energy refilled) instead of a Game Over — except
   * in the boss arena, which is deliberately the one real challenge. */
  _onPlayerDeath() {
    const { player, level, particles } = this;
    if (level.inBossArena) {
      this.hasCheckpoint = false;
      this.respawnPoint = { x: level.data.spawn.x, y: level.data.spawn.y };
      player.die();
      return;
    }
    if (this.hasCheckpoint) {
      particles.emit('explosion', player.x + player.w / 2, player.y + player.h / 2, { color: 'rgba(255,59,59,0.8)' });
      this.audio.play('death');
      this.camera.shake(6, 0.3);
      level.resetCrumblingPlatforms();
      level.projectiles.length = 0;
      const rp = this.respawnPoint || level.data.spawn;
      player.energy = player.maxEnergy;
      player.resetPosition(rp.x, rp.y);
      player.isDying = false;
      player.dyingTime = 0;
      player.invulnerable = true;
      player.invulnTime = 1.5;
      this._resetCameraTo(rp.x, rp.y);
      showToast('📍 Colpito! Riparti dal checkpoint');
      return;
    }
    player.die();
  }

  _resolveGoal() {
    const { player, level } = this;
    const goal = level.goal;
    if (!aabbIntersect(player.bounds, { x: goal.x, y: goal.y, w: goal.w, h: goal.h })) return;

    if (this.currentLevelIndex === 0) { this._completeTutorial(); return; }

    // The boss-arena room is one-way, so gating its goal on `allCollected`
    // could softlock a player who beat the boss but skipped a crystal.
    if (!level.inBossArena && !level.allCollected) {
      if (this._goalToastCooldown <= 0) {
        showToast('💎 Raccogli tutti i cristalli prima di entrare nel portale!');
        this._goalToastCooldown = 2.2;
      }
      return;
    }
    if (!level.bossCleared) {
      if (this._goalToastCooldown <= 0) {
        showToast('⚔️ Sconfiggi prima l\'Entità Suprema!');
        this._goalToastCooldown = 2.2;
      }
      return;
    }
    this.levelComplete();
  }

  _completeTutorial() {
    this.state = 'tutorial-complete';
    this.audio.play('goal');
    this.camera.shake(3, 0.25);
    this._clearOverlay();
    mount(TutorialCompleteModal({ onHome: () => this.showMainMenu() }));
  }

  _handleVoidFall() {
    const { player, level, particles } = this;
    particles.emit('explosion', player.x + player.w / 2, level.viewBounds.bottom - 10, { color: 'rgba(139,92,246,0.8)' });
    this.audio.play('death');
    player.energy -= 1;
    if (player.energy <= 0) {
      this._onPlayerDeath();
    } else {
      level.resetCrumblingPlatforms();
      const rp = this.respawnPoint || level.data.spawn;
      player.resetPosition(rp.x, rp.y);
      player.invulnerable = true;
      player.invulnTime = 1.2;
      this._resetCameraTo(rp.x, rp.y);
    }
  }

  // ----------------------------------------------------------------- render

  render() {
    const { ctx, scale, viewW, viewH } = this.renderer;
    this.renderer.clear('#050508');

    const dimKey = this.level ? (this.level.inBossArena ? 'arena' : this.level.data.key) : LEVELS[0].key;
    const camX = this.camera.x;
    const camY = this.camera.y;

    ctx.save();
    ctx.translate(this.camera.shakeX, this.camera.shakeY);
    ctx.save();
    ctx.scale(scale, scale);

    drawBackground(ctx, viewW, viewH, camX, camY, dimKey, this.elapsed);

    if (this.level && this.state !== 'menu') {
      const palette = getPalette(dimKey);

      ctx.save();
      ctx.translate(0, -camY);

      if (this.level.inBossArena) {
        drawArenaAtmosphere(ctx, viewW, viewH, camX, camY, this.elapsed, this.level.boss, this.level.data.bossArena);
      }
      for (const p of this.level.platforms) drawPlatform(ctx, p, camX, palette, this.elapsed);
      if (this.level.data.signs) {
        for (const s of this.level.data.signs) drawTutorialSign(ctx, s, camX, this.elapsed, palette);
      }
      for (const cp of this.level.checkpoints) drawCheckpoint(ctx, cp, camX, this.elapsed, palette);
      drawGoal(ctx, this.level.goal, camX, this.elapsed, palette, this.level.allCollected && this.level.bossCleared);
      for (const h of this.level.hazards) drawHazard(ctx, h, camX, this.elapsed, palette);
      for (const c of this.level.collectibles) drawCollectible(ctx, c, camX, this.elapsed, palette);
      for (const e of this.level.enemies) drawEnemy(ctx, e, camX, this.elapsed, palette);
      if (this.level.boss) drawBoss(ctx, this.level.boss, camX, this.elapsed, palette);
      for (const p of this.level.projectiles) drawProjectile(ctx, p, camX);
      if (this.state === 'playing' || this.state === 'paused' || this.state === 'level-complete' || this.state === 'portal') {
        drawPlayer(ctx, this.player, camX, palette, this.elapsed);
        if (this.player.isAttacking) {
          drawMeleeSlash(ctx, this.player, camX, this.player.attackTime / this.player.attackDuration);
        }
      }
      this.particles.render(ctx, camX);

      ctx.restore(); // camera Y

      if (this.state === 'portal' && this.portal) {
        const cx = this.player.x + this.player.w / 2 - camX;
        const cy = this.player.y + this.player.h / 2 - camY;
        drawPortalVortex(ctx, viewW, viewH, cx, cy, clamp(this.portal.t / this.portal.duration, 0, 1), this.portal.teleported);
      }
    }

    ctx.restore();
    ctx.restore();
  }
}
