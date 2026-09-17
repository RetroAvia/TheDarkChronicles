// Fully procedural Web Audio engine — zero audio assets to load, tiny footprint.
// Built around a shared major-pentatonic scale per dimension so every sting,
// chime and pad stays "in key" together instead of clashing — and a light
// send-reverb so nothing sounds like a bare, dry beep.
//
// Round 8 pass: the original ambient pad was a single frozen chord (four
// oscillators locked to fixed ratios, only a slow filter sweep moving) and
// the most-repeated SFX (jump, land, dash, hit...) fired the exact same
// pitch every single time. Fixed with chord-tone drift, per-voice detune
// LFOs, stereo width, shimmer notes, SFX jitter and a smoothed reverb tail.
//
// Round 9 pass: even with all of that moving, plain sine/triangle oscillators
// are thin — four single waveforms stacked read as "one frequency" no matter
// how much they drift, because none of them have real harmonic content. This
// pass replaces the pad's and the bells' oscillators with custom additive
// waveforms built via createPeriodicWave (a warm, cello-like timbre for the
// low anchor voices; a brighter, richer timbre for the mid/high voices and
// for chimes/bells), adds two-oscillator unison detuning to every sustained
// pad voice for a real chorus width instead of a single thin tone, and makes
// the mid+high voices move TOGETHER between whole consonant chord-tone pairs
// every 20-35s (instead of one lone upper voice drifting alone) while the
// bass+root stay put as a stable tonal anchor. The richer "bright" timbre is
// also used for _bell(), so crystal/checkpoint/quiz/goal/reward/bossDefeat/
// warpArrive all pick up some of the added harmonic complexity too.

const DIMENSION_ROOTS = [220.0, 246.94, 196.0, 261.63, 174.61, 207.65, 185.0, 233.08]; // A3, B3, G3, C4, F3, G#3, F#3, A#3 — one per dimension
const PENTA = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2]; // just-intonation major pentatonic + octave extension

// Consonant mid/high ratio pairs (relative to the dimension root) that the
// ambient pad's two upper voices glide between together. Each pair is a
// stack of just-intonation intervals against the root, so whichever pair is
// "live" always sounds settled rather than dissonant against the fixed
// bass+root anchor below it.
const CHORD_PAIR_SETS = [
  { mid: 1.5, high: 2 },        // fifth + octave — the original, most grounded pairing
  { mid: 1.25, high: 5 / 3 },   // major third + major sixth — warmer/sweeter
  { mid: 5 / 3, high: 2.25 },   // major sixth + ninth — brighter
  { mid: 1.5, high: 2.5 }       // fifth + tenth — wide, open spread
];

export class AudioEngine {
  constructor(saveManager) {
    this.save = saveManager;
    this.ctx = null;
    this.master = null;
    this.dry = null;
    this.wet = null;
    this.convolver = null;
    this.padNodes = null;
    this.root = DIMENSION_ROOTS[0];
    this.enabled = saveManager.data.settings.audio !== false;
    this._waveCache = null;
  }

  _ensureContext() {
    if (this.ctx) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.master.gain.value = this.enabled ? 0.7 : 0;
    this.master.connect(this.ctx.destination);

    this.dry = this.ctx.createGain();
    this.dry.gain.value = 1;
    this.dry.connect(this.master);

    this.wet = this.ctx.createGain();
    this.wet.gain.value = 0.22;
    this.convolver = this.ctx.createConvolver();
    this.convolver.buffer = this._buildImpulse(1.9, 2.6);
    this.wet.connect(this.convolver).connect(this.master);
  }

  // A raw-noise impulse response reads as a harsh, grainy "tin can" tail —
  // running it through a gentle lowpass before baking it into the buffer
  // (a simple one-pole smoothing pass, cheap and allocation-free) rounds it
  // into something closer to a soft room/hall than white noise.
  _buildImpulse(duration, decay) {
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * duration);
    const buffer = this.ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let smoothed = 0;
      const smoothing = 0.12; // lower = smoother/darker tail
      for (let i = 0; i < length; i++) {
        const raw = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
        smoothed += (raw - smoothed) * smoothing;
        data[i] = smoothed;
      }
    }
    return buffer;
  }

  _out(node) {
    node.connect(this.dry);
    node.connect(this.wet);
  }

  /** Routes through an optional stereo panner when available, else straight
   * to _out — used by the ambient pad's individual voices for width. */
  _outPanned(node, pan = 0) {
    if (this.ctx.createStereoPanner) {
      const p = this.ctx.createStereoPanner();
      p.pan.value = pan;
      node.connect(p);
      this._out(p);
      return p;
    }
    this._out(node);
    return node;
  }

  /** Builds (and caches) a custom additive-synthesis PeriodicWave — a real
   * harmonic series instead of a bare sine/triangle, so tones have actual
   * "body" to them. 'warm' rolls off fast (soft, cello/horn-like, for the
   * pad's low anchor voices); 'bright' keeps more upper harmonics alive
   * (glassy/bell-like, for the pad's moving voices and for _bell()). */
  _wave(kind) {
    if (!this.ctx) return null;
    if (!this._waveCache) this._waveCache = {};
    if (this._waveCache[kind]) return this._waveCache[kind];
    const harmonics = kind === 'bright'
      ? [0, 1, 0.62, 0.48, 0.34, 0.26, 0.19, 0.13, 0.09, 0.06, 0.04]
      : [0, 1, 0.5, 0.28, 0.16, 0.09, 0.05, 0.025, 0.012];
    const real = new Float32Array(harmonics.length);
    const imag = new Float32Array(harmonics);
    const wave = this.ctx.createPeriodicWave(real, imag, { disableNormalization: false });
    this._waveCache[kind] = wave;
    return wave;
  }

  /** Call on first user gesture to satisfy autoplay policies. */
  unlock() {
    this._ensureContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.save.setSetting('audio', enabled);
    if (this.master) {
      const now = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(now);
      this.master.gain.linearRampToValueAtTime(enabled ? 0.7 : 0, now + 0.15);
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  scaleFreq(degree, octave = 0) {
    const idx = ((degree % PENTA.length) + PENTA.length) % PENTA.length;
    const wrap = Math.floor(degree / PENTA.length);
    return this.root * PENTA[idx] * Math.pow(2, octave + wrap);
  }

  /** Small pseudo-random jitter helper — keeps repeated SFX from sounding
   * like the exact same sample played back a thousand times. `cents` is a
   * detune spread (±cents/2), `time`/`gain` are fractional spreads applied
   * multiplicatively. */
  _jitter({ cents = 25, time = 0, gain = 0 } = {}) {
    return {
      detune: (Math.random() * 2 - 1) * cents,
      durMult: 1 + (Math.random() * 2 - 1) * time,
      gainMult: 1 + (Math.random() * 2 - 1) * gain
    };
  }

  _tone({ type = 'sine', freq = 440, start = 0, dur = 0.22, gain = 0.18, freqEnd = null, attack = 0.012, detune = 0, wave = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + start;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    const periodicWave = wave ? this._wave(wave) : null;
    if (periodicWave) osc.setPeriodicWave(periodicWave);
    else osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + dur);
    osc.detune.value = detune;
    amp.gain.setValueAtTime(0.0001, t0);
    amp.gain.exponentialRampToValueAtTime(Math.max(gain, 0.0001), t0 + attack);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp);
    this._out(amp);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  /** A "bell": fundamental + a soft octave partial, both riding the rich
   * 'bright' additive waveform (Round 9) instead of bare sines — gives every
   * pickup/checkpoint/quiz/goal/reward chime real harmonic body. */
  _bell({ freq, start = 0, dur = 0.5, gain = 0.16 }) {
    if (!this.ctx) return;
    this._tone({ wave: 'bright', freq, start, dur, gain, attack: 0.006 });
    this._tone({ wave: 'bright', freq: freq * 2, start: start + 0.01, dur: dur * 0.7, gain: gain * 0.3, attack: 0.006 });
  }

  /** A soft sine "body" laid under a percussive hit — thickens jump/land/dash
   * without changing their character, so they read as fuller instead of a
   * bare single-oscillator beep. */
  _body({ freq, start = 0, dur = 0.16, gain = 0.07 }) {
    this._tone({ type: 'sine', freq, start, dur, gain, attack: 0.008 });
  }

  _noiseBurst({ start = 0, dur = 0.1, gain = 0.14, lpFreq = 2200, hp = 0 }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + start;
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.4);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = lpFreq;
    const amp = this.ctx.createGain();
    amp.gain.value = gain;
    let chain = src.connect(lp);
    if (hp) {
      const hpF = this.ctx.createBiquadFilter();
      hpF.type = 'highpass';
      hpF.frequency.value = hp;
      chain = chain.connect(hpF);
    }
    chain.connect(amp);
    this._out(amp);
    src.start(t0);
  }

  _arp(degrees, { start = 0, spacing = 0.09, dur = 0.4, gain = 0.15, type = 'sine', octave = 0 } = {}) {
    degrees.forEach((deg, i) => {
      this._bell({ freq: this.scaleFreq(deg, octave), start: start + i * spacing, dur, gain });
      void type;
    });
  }

  play(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'jump': {
        const j = this._jitter({ cents: 35, time: 0.12, gain: 0.15 });
        this._tone({
          type: 'triangle', freq: this.scaleFreq(0, 1), freqEnd: this.scaleFreq(3, 1),
          dur: 0.13 * j.durMult, gain: 0.14 * j.gainMult, attack: 0.004, detune: j.detune
        });
        this._body({ freq: this.scaleFreq(0, 0), start: 0, dur: 0.1, gain: 0.045 });
        break;
      }
      case 'doubleJump': {
        const j = this._jitter({ cents: 30, time: 0.1, gain: 0.12 });
        this._bell({ freq: this.scaleFreq(4, 1) * (1 + j.detune / 1200), dur: 0.18 * j.durMult, gain: 0.13 * j.gainMult });
        this._bell({ freq: this.scaleFreq(7, 1), start: 0.05, dur: 0.2, gain: 0.12 });
        break;
      }
      case 'dash': {
        const j = this._jitter({ cents: 25, time: 0.15, gain: 0.15 });
        this._noiseBurst({ dur: 0.14 * j.durMult, gain: 0.1 * j.gainMult, lpFreq: 4000, hp: 600 });
        this._tone({
          type: 'triangle', freq: this.scaleFreq(5, 1), freqEnd: this.scaleFreq(5, 2),
          dur: 0.14 * j.durMult, gain: 0.1 * j.gainMult, attack: 0.003, detune: j.detune
        });
        break;
      }
      case 'land': {
        const j = this._jitter({ time: 0.25, gain: 0.3 });
        this._noiseBurst({ dur: 0.07 * j.durMult, gain: 0.09 * j.gainMult, lpFreq: 750 + Math.random() * 400 });
        this._body({ freq: this.scaleFreq(-3, 0), start: 0, dur: 0.09, gain: 0.03 });
        break;
      }
      case 'crystal': {
        // Picks from a small set of consonant upper degrees instead of always
        // the same two notes — pickups start to feel like a little melody
        // rather than one repeating jingle over a run with 60+ crystals.
        const degreeChoices = [4, 6, 7, 9];
        const deg = degreeChoices[Math.floor(Math.random() * degreeChoices.length)];
        this._bell({ freq: this.scaleFreq(deg, 1), dur: 0.22, gain: 0.16 });
        this._bell({ freq: this.scaleFreq(deg + 3, 1), start: 0.06, dur: 0.28, gain: 0.13 });
        break;
      }
      case 'shoot': {
        const j = this._jitter({ cents: 20, gain: 0.2 });
        this._tone({ type: 'triangle', freq: this.scaleFreq(2, 1), freqEnd: this.scaleFreq(2, 0), dur: 0.09, gain: 0.09 * j.gainMult, attack: 0.003, detune: j.detune });
        break;
      }
      case 'hit': {
        const j = this._jitter({ cents: 40, time: 0.15, gain: 0.15 });
        this._tone({ type: 'triangle', freq: 220, freqEnd: 90, dur: 0.2 * j.durMult, gain: 0.15 * j.gainMult, attack: 0.004, detune: j.detune });
        this._noiseBurst({ dur: 0.1, gain: 0.08, lpFreq: 650 + Math.random() * 300 });
        break;
      }
      case 'death':
        this._tone({ type: 'triangle', freq: 260, freqEnd: 55, dur: 0.65, gain: 0.16, attack: 0.01 });
        break;
      case 'checkpoint':
        this._bell({ freq: this.scaleFreq(3, 1), dur: 0.2, gain: 0.13 });
        this._bell({ freq: this.scaleFreq(5, 1), start: 0.09, dur: 0.3, gain: 0.14 });
        break;
      case 'button': {
        const j = this._jitter({ cents: 15 });
        this._tone({ type: 'triangle', freq: this.scaleFreq(2, 1), dur: 0.05, gain: 0.08, attack: 0.003, detune: j.detune });
        break;
      }
      case 'hover':
        this._tone({ type: 'sine', freq: this.scaleFreq(5, 1), dur: 0.035, gain: 0.04, attack: 0.003 });
        break;
      case 'goal':
        this._arp([0, 2, 4, 7], { spacing: 0.1, dur: 0.4, gain: 0.15, octave: 1 });
        break;
      case 'reward':
        this._arp([0, 2, 4, 5, 7], { spacing: 0.09, dur: 0.5, gain: 0.15, octave: 1 });
        break;
      case 'bossDefeat':
        this._arp([0, 2, 4, 5, 7, 9], { spacing: 0.1, dur: 0.55, gain: 0.16, octave: 1 });
        setTimeout(() => { if (this.ctx) this._arp([0, 4, 7], { spacing: 0, dur: 1.1, gain: 0.12, octave: 2 }); }, 700);
        break;
      case 'gameover':
        this._arp([7, 5, 2, 0], { spacing: 0.16, dur: 0.5, gain: 0.14, octave: 0 });
        break;
      case 'warp':
        this._noiseBurst({ dur: 0.9, gain: 0.11, lpFreq: 2600, hp: 180 });
        this._tone({ type: 'sawtooth', freq: this.scaleFreq(9, 1), freqEnd: this.scaleFreq(0, -1), dur: 0.85, gain: 0.12, attack: 0.05 });
        break;
      case 'warpArrive':
        this._arp([0, 4, 7, 9], { spacing: 0.07, dur: 0.35, gain: 0.15, octave: 1 });
        break;
      case 'quizCorrect':
        this._bell({ freq: this.scaleFreq(4, 1), dur: 0.2, gain: 0.15 });
        this._bell({ freq: this.scaleFreq(9, 1), start: 0.07, dur: 0.3, gain: 0.13 });
        break;
      case 'quizWrong':
        this._tone({ type: 'triangle', freq: 200, freqEnd: 120, dur: 0.28, gain: 0.11, attack: 0.005 });
        break;
      case 'playerShoot': {
        const j = this._jitter({ cents: 20, gain: 0.15 });
        this._noiseBurst({ dur: 0.05, gain: 0.07 * j.gainMult, lpFreq: 5200, hp: 900 });
        this._tone({ type: 'sawtooth', freq: this.scaleFreq(9, 2), freqEnd: this.scaleFreq(4, 2), dur: 0.09, gain: 0.11 * j.gainMult, attack: 0.002, detune: j.detune });
        break;
      }
      case 'bossRoar':
        this._noiseBurst({ dur: 0.5, gain: 0.13, lpFreq: 500, hp: 40 });
        this._tone({ type: 'sawtooth', freq: 90, freqEnd: 46, dur: 0.55, gain: 0.16, attack: 0.01 });
        this._tone({ type: 'triangle', freq: 130, freqEnd: 60, dur: 0.5, gain: 0.1, attack: 0.02 });
        break;
      case 'melee': {
        // A quick whoosh (rising noise) plus a sharp metallic tick, distinct
        // from the ranged shot's laser-y sawtooth — reads as a close blade
        // swing rather than a gunshot.
        const j = this._jitter({ cents: 25, gain: 0.15 });
        this._noiseBurst({ dur: 0.09, gain: 0.09 * j.gainMult, lpFreq: 3400, hp: 500 });
        this._tone({ type: 'triangle', freq: this.scaleFreq(7, 2), freqEnd: this.scaleFreq(4, 2), dur: 0.07, gain: 0.1 * j.gainMult, attack: 0.002, detune: j.detune });
        break;
      }
      case 'bossVulnerable':
        // A bright, unmistakable "now!" chime — the audio half of the
        // vulnerable-window cue (see Boss.justBecameVulnerable), so the
        // opening doesn't rely on spotting a colour change alone.
        this._arp([4, 7, 9], { spacing: 0.06, dur: 0.3, gain: 0.16, octave: 1 });
        break;
      default:
        break;
    }
  }

  /** Builds one sustained pad voice as a two-oscillator unison: both
   * oscillators share the same frequency/waveform but sit a few cents apart
   * (plus their own independent slow detune LFO on top), so the voice has a
   * real chorus width instead of a single thin tone. Returns handles needed
   * to move the voice's pitch later (for the mid/high chord-pair drift) and
   * to tear it all down in stopAmbient(). */
  _makeUnisonVoice(ctx, bus, { freq, waveKind, gain, pan, lfoRate, unisonCents = 6 }) {
    const g = ctx.createGain();
    g.gain.value = gain;
    const wave = waveKind ? this._wave(waveKind) : null;

    const oscs = [-1, 1].map((sign) => {
      const osc = ctx.createOscillator();
      if (wave) osc.setPeriodicWave(wave);
      else osc.type = 'sine';
      osc.frequency.value = freq;
      osc.detune.value = sign * unisonCents;
      osc.connect(g);
      osc.start();

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = lfoRate * (0.9 + Math.random() * 0.2);
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 2.5 + Math.random() * 2;
      lfo.connect(lfoGain).connect(osc.detune);
      lfo.start();

      return { osc, lfo, baseDetune: sign * unisonCents };
    });

    let panner = null;
    if (ctx.createStereoPanner) {
      panner = ctx.createStereoPanner();
      panner.pan.value = pan;
      g.connect(panner).connect(bus);
    } else {
      g.connect(bus);
    }

    return { gain: g, oscs, panner };
  }

  /** Ambient evolving pad, one root frequency per dimension (1-indexed).
   *
   * Round 9: every sustained voice is now a two-oscillator unison built on a
   * custom additive waveform (warm for the bass+root anchor, bright for the
   * mid+high pair) instead of a single sine/triangle, so the pad has real
   * harmonic body and width even standing still. The mid+high voices glide
   * TOGETHER between whole consonant chord-tone pairs (fifth+octave, third
   * +sixth, sixth+ninth, fifth+tenth) every 20-35s, while bass+root stay
   * fixed as a stable tonal anchor underneath. Shimmer notes now use the
   * bright waveform too. */
  startAmbient(dimension = 1) {
    if (!this.ctx) return;
    this.stopAmbient();
    this.root = DIMENSION_ROOTS[(dimension - 1) % DIMENSION_ROOTS.length];
    const root = this.root;
    const ctx = this.ctx;

    const bus = ctx.createGain();
    bus.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 780;
    filter.Q.value = 0.5;
    bus.connect(filter);
    this._out(filter);

    // Fixed anchor voices — bass (an octave down) and root, both on the warm
    // waveform, both two-oscillator unison for width. These never move: they
    // are the stable tonal center the mid/high pair drifts around.
    const bass = this._makeUnisonVoice(ctx, bus, { freq: root * 0.5, waveKind: 'warm', gain: 0.16, pan: 0, lfoRate: 0.04, unisonCents: 5 });
    const rootVoice = this._makeUnisonVoice(ctx, bus, { freq: root, waveKind: 'warm', gain: 0.20, pan: 0, lfoRate: 0.028, unisonCents: 6 });

    // Movable voices — mid (fifth-ish) and high (octave-ish), both on the
    // bright waveform, both unison. They start on CHORD_PAIR_SETS[0] and
    // glide together to a new pair on the same schedule.
    let pairIdx = 0;
    const mid = this._makeUnisonVoice(ctx, bus, { freq: root * CHORD_PAIR_SETS[0].mid, waveKind: 'bright', gain: 0.11, pan: -0.3, lfoRate: 0.06, unisonCents: 7 });
    const high = this._makeUnisonVoice(ctx, bus, { freq: root * CHORD_PAIR_SETS[0].high, waveKind: 'bright', gain: 0.09, pan: 0.3, lfoRate: 0.05, unisonCents: 7 });

    // Both recursive schedulers below write their latest setTimeout id into
    // this shared, mutable box (rather than a `let` captured only at the
    // first call) so stopAmbient can always cancel whichever timer is
    // CURRENTLY pending, no matter how many times it has rescheduled itself.
    // `cancelled` is a belt-and-suspenders guard against the rare race where
    // a timer's callback is already running the instant stopAmbient fires.
    const timers = { move: null, shimmer: null, cancelled: false };

    const rampVoiceTo = (voice, targetFreq, rampTime) => {
      const now = ctx.currentTime;
      voice.oscs.forEach(({ osc }) => {
        osc.frequency.cancelScheduledValues(now);
        osc.frequency.setValueAtTime(osc.frequency.value, now);
        osc.frequency.linearRampToValueAtTime(targetFreq, now + rampTime);
      });
    };

    const scheduleMove = () => {
      const delay = 20000 + Math.random() * 15000;
      timers.move = setTimeout(() => {
        if (timers.cancelled) return;
        let nextIdx = pairIdx;
        while (nextIdx === pairIdx) nextIdx = Math.floor(Math.random() * CHORD_PAIR_SETS.length);
        pairIdx = nextIdx;
        const pair = CHORD_PAIR_SETS[pairIdx];
        rampVoiceTo(mid, root * pair.mid, 6);
        rampVoiceTo(high, root * pair.high, 6);
        scheduleMove();
      }, delay);
    };
    scheduleMove();

    // Sparse shimmer: soft, slow bell-like notes (bright waveform) fading in
    // and out at random intervals and random stereo positions — the
    // "something is gently alive in here" layer a fully static pad can't have.
    const scheduleShimmer = () => {
      const delay = 6000 + Math.random() * 9000;
      timers.shimmer = setTimeout(() => {
        if (timers.cancelled) return;
        if (this.enabled) {
          const shimmerDegrees = [4, 5, 7, 9, 12];
          const deg = shimmerDegrees[Math.floor(Math.random() * shimmerDegrees.length)];
          const freq = this.scaleFreq(deg, 1);
          const pan = Math.random() * 1.6 - 0.8;
          const t0 = ctx.currentTime;
          const osc = ctx.createOscillator();
          const wave = this._wave('bright');
          if (wave) osc.setPeriodicWave(wave);
          else osc.type = 'sine';
          osc.frequency.value = freq;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.04, t0 + 1.4);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 4.2);
          osc.connect(g);
          this._outPanned(g, pan);
          osc.start(t0);
          osc.stop(t0 + 4.3);
        }
        scheduleShimmer();
      }, delay);
    };
    scheduleShimmer();

    // Slow, gentle filter breathing (same idea as before, slightly subtler
    // so it reads as "room" rather than an obvious wah sweep).
    const filterLfo = ctx.createOscillator();
    filterLfo.frequency.value = 0.045;
    const filterLfoGain = ctx.createGain();
    filterLfoGain.gain.value = 190;
    filterLfo.connect(filterLfoGain).connect(filter.frequency);
    filterLfo.start();

    const now = ctx.currentTime;
    bus.gain.linearRampToValueAtTime(0.075, now + 2.8);

    const voiceOscNodes = [bass, rootVoice, mid, high].flatMap((v) => v.oscs.flatMap((o) => [o.osc, o.lfo]));

    this.padNodes = {
      bus, filter, timers,
      oscillators: [...voiceOscNodes, filterLfo]
    };
  }

  stopAmbient() {
    if (!this.padNodes || !this.ctx) return;
    const { bus, oscillators, timers } = this.padNodes;
    timers.cancelled = true;
    clearTimeout(timers.move);
    clearTimeout(timers.shimmer);
    const now = this.ctx.currentTime;
    bus.gain.cancelScheduledValues(now);
    bus.gain.linearRampToValueAtTime(0, now + 0.6);
    oscillators.forEach((o) => { try { o.stop(now + 0.65); } catch { /* already stopped */ } });
    this.padNodes = null;
  }
}
