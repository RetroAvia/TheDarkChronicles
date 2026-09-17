import { GFX } from '../core/quality.js';

// ---------------------------------------------------------------------------
// Parallax backgrounds.
//
// Rework rationale: the old version drew a flat two-stop sky, one field of
// dots and a single silhouette per theme. With the camera now framing the
// level's real content box (see Camera/LevelRuntime.viewBounds) there is a lot
// more sky in frame, and "a gradient with dots on it" was not enough to carry
// it — every dimension read as the same empty space in a different tint.
//
// Each dimension now gets FOUR depth layers that move at different speeds:
//   0. sky      — three-stop vertical gradient + a drifting light source
//   1. stars    — pre-rendered once onto an offscreen tile, then blitted
//                 (the old per-star arc() loop was ~90 paths every frame)
//   2. far/mid  — two bands of theme-specific silhouettes on a shared horizon
//   3. near     — a foreground element that crosses in FRONT of the action
//                 (embers, rain, drifting motes...), which is what actually
//                 sells depth rather than more stuff far away
//
// Everything is deterministic (seeded PRNG, no Math.random in layout) so the
// scene never shimmers between frames, and every layer count scales with the
// quality tier.
// ---------------------------------------------------------------------------

const THEMES = {
  alpha: {
    sky: ['#0b1030', '#070a1c', '#050508'],
    glow: '#00d4ff', glow2: '#8b5cf6',
    stars: 1.0, mid: 'crystals', near: 'motes', horizon: 0.78
  },
  beta: {
    sky: ['#03202a', '#04141c', '#050c10'],
    glow: '#00ff88', glow2: '#00d4ff',
    stars: 0.55, mid: 'islands', near: 'motes', horizon: 0.82
  },
  gamma: {
    sky: ['#2a0c08', '#170707', '#0a0505'],
    glow: '#ff6b35', glow2: '#ff0080',
    stars: 0.2, mid: 'peaks', near: 'embers', horizon: 0.74
  },
  delta: {
    sky: ['#1d1d08', '#111106', '#08080a'],
    glow: '#ffd23f', glow2: '#00ffff',
    stars: 0.3, mid: 'grid', near: 'motes', horizon: 0.7
  },
  epsilon: {
    sky: ['#04222f', '#03161f', '#020a10'],
    glow: '#28c8ff', glow2: '#00ff88',
    stars: 0.7, mid: 'islands', near: 'rain', horizon: 0.8
  },
  zeta: {
    sky: ['#1b0640', '#100325', '#060114'],
    glow: '#c15cff', glow2: '#ff0080',
    stars: 0.9, mid: 'towers', near: 'rain', horizon: 0.76
  },
  eta: {
    sky: ['#2a1e06', '#1a1204', '#0a0702', ],
    glow: '#ffe066', glow2: '#ff6b35',
    stars: 0.25, mid: 'peaks', near: 'ash', horizon: 0.72
  },
  omega: {
    sky: ['#22040c', '#120308', '#050206'],
    glow: '#ff3b3b', glow2: '#8b5cf6',
    stars: 0.35, mid: 'towers', near: 'ash', horizon: 0.74, storm: true
  },
  // Boss-arena set-piece: a sunken cathedral under a blood moon.
  arena: {
    sky: ['#14030a', '#0a0005', '#020001'],
    glow: '#ff2d4a', glow2: '#8b5cf6',
    stars: 0, mid: 'spires', near: 'embers', horizon: 0.72, cathedral: true
  }
};

// --------------------------------------------------------------- utilities

/** Small deterministic PRNG (mulberry32) — layout must be identical on every
 * frame, so Math.random() is never used for placement. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexAlpha(hex, alpha) {
  const v = hex.replace('#', '');
  const r = parseInt(v.substring(0, 2), 16);
  const g = parseInt(v.substring(2, 4), 16);
  const b = parseInt(v.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function seedOf(key) {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Wraps `value` into [0, span) — used to tile every scrolling layer. */
function wrap(value, span) {
  return ((value % span) + span) % span;
}

// Gradients are keyed by theme + size, not rebuilt per frame: creating a
// handful of CanvasGradients every frame for a static sky was pure waste.
const gradientCache = new Map();
function skyGradient(ctx, theme, key, height) {
  const id = `${key}:${Math.round(height)}`;
  let g = gradientCache.get(id);
  if (!g) {
    g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, theme.sky[0]);
    g.addColorStop(0.55, theme.sky[1]);
    g.addColorStop(1, theme.sky[2]);
    gradientCache.set(id, g);
  }
  return g;
}

// --------------------------------------------------------------- star tile

const STAR_TILE = 512;
const starTiles = new Map();

/** Renders a star field ONCE onto an offscreen tile per theme. Drawing it is
 * then 2-4 drawImage calls instead of ~90 arc()+fill() paths per frame. */
function getStarTile(key, theme) {
  if (starTiles.has(key)) return starTiles.get(key);
  if (theme.stars <= 0) { starTiles.set(key, null); return null; }

  const c = typeof OffscreenCanvas !== 'undefined'
    ? new OffscreenCanvas(STAR_TILE, STAR_TILE)
    : Object.assign(document.createElement('canvas'), { width: STAR_TILE, height: STAR_TILE });
  const g = c.getContext('2d');
  const rand = rng(seedOf(key));
  const count = Math.round(140 * theme.stars);

  for (let i = 0; i < count; i++) {
    const x = rand() * STAR_TILE;
    const y = rand() * STAR_TILE;
    const r = 0.5 + rand() * 1.7;
    const a = 0.2 + rand() * 0.65;
    g.fillStyle = rand() < 0.14 ? hexAlpha(theme.glow, a) : `rgba(255,255,255,${a})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
  }
  // a few larger soft stars for depth
  for (let i = 0; i < Math.round(8 * theme.stars); i++) {
    const x = rand() * STAR_TILE;
    const y = rand() * STAR_TILE;
    const grad = g.createRadialGradient(x, y, 0, x, y, 7);
    grad.addColorStop(0, 'rgba(255,255,255,0.75)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(x - 7, y - 7, 14, 14);
  }
  starTiles.set(key, c);
  return c;
}

function drawStarLayer(ctx, width, height, camX, camY, key, theme, time) {
  const tile = getStarTile(key, theme);
  if (!tile) return;
  const ox = wrap(camX * 0.08, STAR_TILE);
  const oy = wrap(camY * 0.05, STAR_TILE);
  // One slow global shimmer instead of per-star twinkle maths.
  ctx.save();
  ctx.globalAlpha = 0.72 + Math.sin(time * 0.7) * 0.12;
  for (let x = -ox; x < width; x += STAR_TILE) {
    for (let y = -oy; y < height; y += STAR_TILE) {
      ctx.drawImage(tile, x, y);
    }
  }
  ctx.restore();
}

// ------------------------------------------------------- silhouette layers

/** Jagged mountain ridge. */
function shapePeaks(ctx, width, base, span, rand, amp) {
  ctx.moveTo(-60, base + 400);
  let x = -60;
  ctx.lineTo(x, base);
  while (x < width + 120) {
    const w = 60 + rand() * 90;
    const h = amp * (0.35 + rand() * 0.65);
    ctx.lineTo(x + w * 0.5, base - h);
    ctx.lineTo(x + w, base - h * (0.1 + rand() * 0.25));
    x += w;
  }
  ctx.lineTo(x, base + 400);
  ctx.closePath();
}

/** Angular towers / broken skyline. */
function shapeTowers(ctx, width, base, span, rand, amp) {
  ctx.moveTo(-60, base + 400);
  let x = -60;
  while (x < width + 120) {
    const w = 26 + rand() * 54;
    const h = amp * (0.2 + rand() * 0.8);
    ctx.lineTo(x, base - h);
    ctx.lineTo(x + w, base - h);
    x += w + rand() * 14;
  }
  ctx.lineTo(x, base + 400);
  ctx.closePath();
}

/** Gothic spires — tall, thin, sharply pointed. */
function shapeSpires(ctx, width, base, span, rand, amp) {
  ctx.moveTo(-60, base + 400);
  let x = -60;
  ctx.lineTo(x, base);
  while (x < width + 120) {
    const w = 40 + rand() * 55;
    const h = amp * (0.45 + rand() * 0.55);
    ctx.lineTo(x + w * 0.12, base - h * 0.35);
    ctx.lineTo(x + w * 0.5, base - h);
    ctx.lineTo(x + w * 0.88, base - h * 0.35);
    ctx.lineTo(x + w, base - h * 0.1);
    x += w;
  }
  ctx.lineTo(x, base + 400);
  ctx.closePath();
}

/** Floating islands: capped domes with a tapering underside. */
function shapeIslands(ctx, width, base, span, rand, amp) {
  let x = -120;
  while (x < width + 160) {
    const w = 110 + rand() * 150;
    const h = 14 + rand() * 16;
    const y = base - rand() * amp;
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + w * 0.5, y - h * 1.1, x + w, y);          // domed top
    ctx.quadraticCurveTo(x + w * 0.78, y + h * 1.5, x + w * 0.52, y + h * 2.2); // tapering keel
    ctx.quadraticCurveTo(x + w * 0.24, y + h * 1.3, x, y);
    ctx.closePath();
    x += w + 70 + rand() * 140;
  }
}

const SHAPES = { peaks: shapePeaks, towers: shapeTowers, spires: shapeSpires, islands: shapeIslands, crystals: shapeSpires, grid: shapeTowers };

function drawSilhouette(ctx, width, height, camX, camY, key, theme, depth, alpha, ampMult) {
  const shape = SHAPES[theme.mid] || shapePeaks;
  const span = 1600;
  const offset = wrap(camX * depth, span);
  const base = height * theme.horizon - camY * depth * 0.35;
  const amp = height * 0.26 * ampMult;

  ctx.save();
  ctx.fillStyle = `rgba(4,3,10,${alpha})`;
  ctx.beginPath();
  // Two passes side by side so the ridge tiles seamlessly as the camera pans.
  for (const pass of [0, 1]) {
    const rand = rng(seedOf(key + theme.mid + depth));
    ctx.save();
    ctx.translate(-offset + pass * span, 0);
    shape(ctx, span + 160, base, span, rand, amp);
    ctx.restore();
  }
  ctx.fill();

  // A thin rim light along the crest makes the silhouette read as a shape
  // against the sky rather than a hole punched in it.
  ctx.globalAlpha = 0.16 * alpha;
  ctx.strokeStyle = hexAlpha(theme.glow, 0.42);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

/** The band where the world's floor lives: a darker wash plus a glowing seam,
 * which keeps the lower third from reading as dead space. */
function drawHorizonBand(ctx, width, height, camY, theme, depth) {
  const y = height * theme.horizon - camY * depth * 0.35;
  if (y > height + 40 || y < -40) return;
  const grad = ctx.createLinearGradient(0, y - 30, 0, height);
  grad.addColorStop(0, hexAlpha(theme.glow2, 0.10));
  grad.addColorStop(0.45, hexAlpha(theme.glow2, 0.04));
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, y - 30, width, height - y + 40);

  ctx.save();
  ctx.strokeStyle = hexAlpha(theme.glow, 0.32);
  ctx.lineWidth = 1.5;
  ctx.shadowColor = theme.glow;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();
  ctx.restore();
}

// --------------------------------------------------------- foreground pass

/** Drawn last and moving FASTER than the camera, so it crosses in front of
 * the player. This is the layer that actually communicates depth. */
function drawNearLayer(ctx, width, height, camX, camY, key, theme, time) {
  const kind = theme.near;
  const density = Math.round((kind === 'rain' ? 46 : 26) * GFX.particles);
  const span = 1200;
  const rand = rng(seedOf(key + 'near'));
  ctx.save();

  for (let i = 0; i < density; i++) {
    const baseX = rand() * span;
    const baseY = rand();
    const size = 1 + rand() * 2.6;
    const speed = 0.9 + rand() * 0.5;
    const drift = rand() * 6.28;

    let x = wrap(baseX - camX * speed, span);
    if (x > width + 40) continue;
    let y;

    if (kind === 'rain') {
      y = wrap(baseY * height + time * (260 + size * 70), height + 60) - 30;
      ctx.strokeStyle = hexAlpha(theme.glow, 0.22);
      ctx.lineWidth = size * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - 3, y + 16 + size * 5);
      ctx.stroke();
      continue;
    }

    if (kind === 'embers' || kind === 'ash') {
      const rise = kind === 'embers' ? -1 : 1;
      y = wrap(baseY * height + rise * time * (26 + size * 12), height + 80) - 40;
      x += Math.sin(time * 0.8 + drift) * 12;
      ctx.fillStyle = kind === 'embers'
        ? `rgba(255,${120 + size * 20 | 0},60,${0.35 + Math.sin(time * 2 + drift) * 0.2})`
        : `rgba(210,200,190,${0.14 + size * 0.04})`;
    } else { // motes
      y = baseY * height + Math.sin(time * 0.5 + drift) * 26 - camY * 0.85;
      y = wrap(y, height + 80) - 40;
      ctx.fillStyle = hexAlpha(theme.glow, 0.2 + size * 0.06);
    }

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // A soft vignette pulls the eye back to the middle of the frame.
  const vign = ctx.createRadialGradient(width / 2, height * 0.5, height * 0.34, width / 2, height * 0.5, Math.max(width, height) * 0.75);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

// ------------------------------------------------------------ set-pieces

function drawBloodMoon(ctx, width, height, camY, time) {
  const mx = width * 0.78;
  const my = height * 0.22 - camY * 0.05;
  const R = Math.min(width, height) * 0.16;
  const blink = 0.85 + Math.sin(time * 0.6) * 0.15;

  const halo = ctx.createRadialGradient(mx, my, R * 0.3, mx, my, R * 2.6);
  halo.addColorStop(0, `rgba(255,45,74,${0.35 * blink})`);
  halo.addColorStop(1, 'rgba(255,45,74,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  const body = ctx.createRadialGradient(mx - R * 0.2, my - R * 0.2, R * 0.1, mx, my, R);
  body.addColorStop(0, '#ffb3bd');
  body.addColorStop(0.45, '#ff2d4a');
  body.addColorStop(1, '#4a0512');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(mx, my, R, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(10,0,3,0.8)';
  ctx.beginPath();
  ctx.ellipse(mx, my, R * 0.12, R * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
}

let flash = 0;
function drawLightning(ctx, width, height, color, chance) {
  flash *= 0.9;
  if (!GFX.reduceMotion && Math.random() < chance) flash = 1;
  if (flash > 0.02) {
    ctx.fillStyle = `rgba(${color},${flash * 0.16})`;
    ctx.fillRect(0, 0, width, height);
  }
}

// ------------------------------------------------------------------ entry

export function drawBackground(ctx, width, height, camX, camY, dimensionKey, time) {
  const key = dimensionKey in THEMES ? dimensionKey : 'alpha';
  const theme = THEMES[key];

  // 0 — sky
  ctx.fillStyle = skyGradient(ctx, theme, key, height);
  ctx.fillRect(0, 0, width, height);

  // drifting light source
  const glowX = width * 0.5 + Math.sin(time * 0.05) * width * 0.18;
  const glowY = height * 0.3 - camY * 0.04;
  const glow = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, width * 0.7);
  glow.addColorStop(0, hexAlpha(theme.glow, 0.17));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  if (theme.cathedral) drawBloodMoon(ctx, width, height, camY, time);

  // 1 — stars
  drawStarLayer(ctx, width, height, camX, camY, key, theme, time);

  // 2 — two silhouette bands + the horizon wash between them
  drawSilhouette(ctx, width, height, camX, camY, key, theme, 0.16, 0.55, 0.78);
  drawHorizonBand(ctx, width, height, camY, theme, 0.32);
  if (GFX.tier === 'high') {
    drawSilhouette(ctx, width, height, camX, camY, key, theme, 0.34, 0.85, 1);
  }

  if (theme.storm) drawLightning(ctx, width, height, '255,80,80', 0.004);
  if (theme.cathedral) drawLightning(ctx, width, height, '255,45,74', 0.006);

  // 3 — foreground
  drawNearLayer(ctx, width, height, camX, camY, key, theme, time);
}
