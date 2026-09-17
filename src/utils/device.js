export function isTouchDevice() {
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    matchMedia('(pointer: coarse)').matches
  );
}

export function prefersReducedMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function getDevicePixelRatio() {
  // cap DPR to keep the canvas fast on high-density mobile panels
  return Math.min(window.devicePixelRatio || 1, 2);
}
