// Centralised graphics-quality switch.
//
// The renderer leans heavily on canvas `shadowBlur` for its neon look, which
// is by far the most expensive Canvas2D operation there is: with 30+
// particles, half a dozen enemies and a boss on screen it is the first thing
// that costs frames on a mid-range phone. Rather than touching all ~40 draw
// sites, Renderer installs a one-line interceptor on the 2D context's
// `shadowBlur` setter (see Renderer._installQualityHook) that reads the flags
// below, so switching quality is instant and reversible at runtime.
//
// 'auto' picks a tier once at boot from what the device actually reports;
// the player can always override it from the pause menu, and the choice is
// persisted (SaveManager settings.quality).

import { prefersReducedMotion } from '../utils/device.js';

export const GFX = {
  /** Neon glow (canvas shadowBlur). The single biggest cost. */
  glow: true,
  /** Multiplier applied to every particle burst size (0.4 on low). */
  particles: 1,
  /** Cap for devicePixelRatio — fewer physical pixels to shade. */
  maxDpr: 2,
  /** Mirrors the OS "reduce motion" setting; also kills decorative CSS animation. */
  reduceMotion: false,
  /** Resolved tier: 'high' | 'low'. */
  tier: 'high'
};

/** Best-effort guess at whether this device can afford the full glow pass.
 * Deliberately conservative: a false "low" costs a little prettiness, a
 * false "high" costs playability. */
export function detectTier() {
  if (typeof navigator === 'undefined') return 'high';
  const mem = navigator.deviceMemory;            // Chrome/Android only
  const cores = navigator.hardwareConcurrency;   // most modern browsers
  const dpr = window.devicePixelRatio || 1;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches;

  if (typeof mem === 'number' && mem <= 4) return 'low';
  if (typeof cores === 'number' && cores <= 4 && coarse) return 'low';
  // A phone pushing a 3x panel has ~2.25x the fragments of a 2x one.
  if (coarse && dpr >= 3) return 'low';
  return 'high';
}

/** @param {'auto'|'high'|'low'} setting */
export function applyQuality(setting) {
  const tier = setting === 'auto' ? detectTier() : setting;
  GFX.tier = tier;
  GFX.glow = tier === 'high';
  GFX.particles = tier === 'high' ? 1 : 0.45;
  GFX.maxDpr = tier === 'high' ? 2 : 1.5;
  return tier;
}

export function applyReducedMotion() {
  GFX.reduceMotion = typeof window !== 'undefined' && prefersReducedMotion();
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('ra-reduce-motion', GFX.reduceMotion);
  }
  return GFX.reduceMotion;
}
