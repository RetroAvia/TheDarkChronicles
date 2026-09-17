export const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const lerp = (a, b, t) => a + (b - a) * t;

// frame-rate independent damping lerp (Freya Holmer's exponential decay)
export const damp = (a, b, lambda, dt) => lerp(a, b, 1 - Math.exp(-lambda * dt));

export const randRange = (min, max) => min + Math.random() * (max - min);

export const randInt = (min, max) => Math.floor(randRange(min, max + 1));

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function aabbIntersect(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function aabbResolve(dynamic, prevY, staticBox) {
  // vertical resolution used for platform landings; returns 'top' | 'bottom' | null
  const wasAbove = prevY + dynamic.h <= staticBox.y + 1;
  if (wasAbove) return 'top';
  const wasBelow = prevY >= staticBox.y + staticBox.h - 1;
  if (wasBelow) return 'bottom';
  return null;
}

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = (t) => {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export function formatTime(ms) {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60).toString().padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
