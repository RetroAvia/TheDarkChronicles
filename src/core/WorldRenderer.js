// All game-world visuals are procedurally drawn on Canvas2D — no sprite assets,
// keeps the bundle tiny while still reading as a deliberate, cohesive art style.

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const SPRING_COLOR = '#ffd23f';
const SPRING_COLOR_DARK = '#c98f00';

export function drawPlatform(ctx, p, camX, palette, time = 0) {
  if (p.gone) return;
  const x = p.x - camX + (Math.random() - 0.5) * p.shakeAmount;
  const y = p.y;
  const isCrumbling = p.crumbleTimer !== null;

  if (p.spring) {
    // The pad itself squashes flat on bounce, then springs back — the visual
    // read of "this will launch you" doubles as feedback that it just did.
    const squash = p.bounceSquash;
    const padH = p.h * (1 - squash * 0.55);
    const padY = y + (p.h - padH);
    const grad = ctx.createLinearGradient(x, padY, x, padY + padH);
    grad.addColorStop(0, palette.platformDark);
    grad.addColorStop(1, palette.platformDark);
    ctx.fillStyle = grad;
    roundRect(ctx, x, padY, p.w, padH, 5);
    ctx.fill();

    ctx.shadowColor = SPRING_COLOR;
    ctx.shadowBlur = 10;
    const coilGrad = ctx.createLinearGradient(x, padY, x, padY + padH * 0.5);
    coilGrad.addColorStop(0, SPRING_COLOR);
    coilGrad.addColorStop(1, SPRING_COLOR_DARK);
    ctx.fillStyle = coilGrad;
    roundRect(ctx, x + 3, padY, p.w - 6, Math.max(4, padH * 0.45), 3);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = SPRING_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, padY + 0.5);
    ctx.lineTo(x + p.w - 3, padY + 0.5);
    ctx.stroke();

    // upward chevron hinting the launch direction
    ctx.globalAlpha = 0.7 + Math.sin(Date.now() * 0.006) * 0.25;
    ctx.strokeStyle = SPRING_COLOR;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const cx = x + p.w / 2;
    ctx.moveTo(cx - 7, y - 4);
    ctx.lineTo(cx, y - 12);
    ctx.lineTo(cx + 7, y - 4);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }

  ctx.save();

  // A grounded drop shadow: without it the platforms read as flat stickers
  // floating on the sky rather than solid objects standing in a space.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  roundRect(ctx, x + 2, y + 4, p.w, p.h, 5);
  ctx.fill();

  const grad = ctx.createLinearGradient(x, y, x, y + p.h);
  grad.addColorStop(0, isCrumbling ? 'rgba(255,107,53,0.9)' : palette.platform);
  grad.addColorStop(0.55, palette.platform);
  grad.addColorStop(1, palette.platformDark);
  ctx.fillStyle = grad;
  roundRect(ctx, x, y, p.w, p.h, 5);
  ctx.fill();

  // Surface detail: evenly spaced seams cut into the slab, so a 200px-wide
  // platform no longer reads as one undifferentiated bar of colour. Cheap —
  // a handful of 2px rects clipped to the slab itself.
  ctx.save();
  roundRect(ctx, x, y, p.w, p.h, 5);
  ctx.clip();
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  const seamStep = 26;
  for (let sx = x + seamStep; sx < x + p.w - 4; sx += seamStep) {
    ctx.fillRect(sx, y + 3, 1.5, p.h);
  }
  // one lighter bevel line under the lip
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.fillRect(x, y + 3.5, p.w, 1);
  ctx.restore();

  // Glowing top lip, plus short returns down the two front corners — the
  // silhouette cue that tells the player exactly where the landable surface
  // ends, which matters on the narrower ledges of the later dimensions.
  const edge = isCrumbling ? 'rgba(255,150,80,0.95)' : palette.platformEdge;
  ctx.strokeStyle = edge;
  ctx.shadowColor = edge;
  ctx.shadowBlur = isCrumbling ? 12 : 7;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 1.5);
  ctx.lineTo(x + p.w - 3, y + 1.5);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 1.2, y + 2);
  ctx.lineTo(x + 1.2, y + p.h * 0.62);
  ctx.moveTo(x + p.w - 1.2, y + 2);
  ctx.lineTo(x + p.w - 1.2, y + p.h * 0.62);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Crumbling platforms get a visible fracture running through them, so the
  // warning is readable even with the screen shake going.
  if (isCrumbling) {
    ctx.strokeStyle = 'rgba(255,220,180,0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    const midX = x + p.w * 0.5;
    ctx.moveTo(midX - p.w * 0.3, y + 1);
    ctx.lineTo(midX - p.w * 0.08, y + p.h * 0.6);
    ctx.lineTo(midX + p.w * 0.12, y + p.h * 0.25);
    ctx.lineTo(midX + p.w * 0.34, y + p.h);
    ctx.stroke();
  }

  // Moving platforms carry a faint motion tell so they can be told apart
  // from static ones at a glance, before they have visibly moved.
  if (p.moving) {
    ctx.globalAlpha = 0.35 + Math.sin(time * 3) * 0.15;
    ctx.fillStyle = palette.platformEdge;
    const cx = x + p.w / 2;
    const arrow = p.moving.axis === 'x' ? ['‹', '›'] : ['⌃', '⌄'];
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(arrow[0], cx - 9, y + p.h / 2 + 1);
    ctx.fillText(arrow[1], cx + 9, y + p.h / 2 + 1);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function drawCollectible(ctx, c, camX, time, palette) {
  if (c.collected) return;
  const x = c.x - camX + c.w / 2;
  const y = c.renderY + c.h / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(c.spin) * 0.25);
  ctx.shadowColor = palette.crystal;
  ctx.shadowBlur = 18;
  const g = ctx.createLinearGradient(0, -c.h / 2, 0, c.h / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.45, palette.crystal);
  g.addColorStop(1, palette.crystalDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  const w = c.w / 2, h = c.h / 2;
  ctx.moveTo(0, -h);
  ctx.lineTo(w * 0.75, -h * 0.15);
  ctx.lineTo(0, h);
  ctx.lineTo(-w * 0.75, -h * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Round 9 pass: every enemy and the boss used to be the exact same "spiky
// ball" polygon at different sizes/colours — cheap, but it reads as
// placeholder rather than "beautiful enemies, terrifying boss". Below:
// jaggedSilhouette lets a body be a hand-tuned asymmetric shape instead of a
// uniform alternating-spike ring, and each creature type (ground crawler,
// flyer, turret, boss) gets its own distinct silhouette, limbs and face
// built from it, so nothing in the game is "the same blob" anymore.

function shadeColor(hex, percent) {
  const num = parseInt(hex.slice(1), 16);
  let r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const amt = Math.round(2.55 * percent);
  r = Math.min(255, Math.max(0, r + amt));
  g = Math.min(255, Math.max(0, g + amt));
  b = Math.min(255, Math.max(0, b + amt));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Fills a closed silhouette from an explicit [angleDeg, radiusMult] table
 * instead of a uniform spike loop — angle 0 = right, clockwise, -90 = up.
 * The caller sets fillStyle/shadow before calling. */
function jaggedSilhouette(ctx, r, profile) {
  ctx.beginPath();
  profile.forEach(([deg, mult], i) => {
    const a = (deg * Math.PI) / 180;
    const px = Math.cos(a) * r * mult;
    const py = Math.sin(a) * r * mult;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.closePath();
}

/** Ground creature (the 'patrol' and 'hunter' enemy types): a hunched,
 * four-legged feral silhouette with a spined back ridge and a fanged jaw,
 * instead of a symmetric spiky ball. Eyes narrow to a wary slit on patrol
 * and flare wide red once a hunter has spotted the player. */
function drawGroundCreature(ctx, r, palette, hurtFlash, walkT, hunting) {
  const color = palette.enemy;
  const colorDark = palette.enemyDark;
  const colorLight = shadeColor(color, 25);

  // short clawed legs, alternating slightly for a skitter gait
  ctx.strokeStyle = colorDark;
  ctx.lineWidth = Math.max(1.6, r * 0.14);
  ctx.lineCap = 'round';
  const legLift = Math.sin(walkT) * r * 0.12;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.5, r * 0.32);
    ctx.lineTo(side * r * 0.72, r * 0.95 + legLift * side);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side * r * 0.15, r * 0.5);
    ctx.lineTo(side * r * 0.28, r * 1.0 - legLift * side);
    ctx.stroke();
  }

  // hunched, irregular body — low at the front, rising toward the back
  const body = [
    [-160, 0.55], [-120, 0.85], [-95, 1.05], [-70, 0.8],
    [-40, 0.95], [-10, 0.62], [15, 0.72], [40, 0.5],
    [70, 0.68], [100, 0.52], [140, 0.62], [180, 0.5]
  ];
  ctx.shadowColor = hurtFlash > 0 ? '#ffffff' : color;
  ctx.shadowBlur = 12;
  const g = ctx.createRadialGradient(-r * 0.25, -r * 0.35, 1, 0, 0, r * 1.1);
  g.addColorStop(0, hurtFlash > 0 ? '#ffffff' : colorLight);
  g.addColorStop(0.55, color);
  g.addColorStop(1, colorDark);
  ctx.fillStyle = g;
  jaggedSilhouette(ctx, r, body);
  ctx.fill();
  ctx.shadowBlur = 0;

  // spined back ridge
  ctx.fillStyle = colorDark;
  for (let i = -2; i <= 1; i++) {
    const bx = i * r * 0.35;
    const by = -r * 0.55 - Math.abs(i) * r * 0.06;
    ctx.beginPath();
    ctx.moveTo(bx - r * 0.1, -r * 0.3);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + r * 0.12, -r * 0.28);
    ctx.closePath();
    ctx.fill();
  }

  // fanged jaw
  ctx.fillStyle = '#0a0a0f';
  ctx.beginPath();
  ctx.moveTo(r * 0.25, r * 0.05);
  ctx.lineTo(r * 0.75, r * 0.18);
  ctx.lineTo(r * 0.3, r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(r * 0.38, r * 0.12);
  ctx.lineTo(r * 0.44, r * 0.2);
  ctx.lineTo(r * 0.32, r * 0.2);
  ctx.closePath();
  ctx.fill();

  // eyes — narrow and calm on patrol, wide and red once hunting
  const eyeW = hunting ? r * 0.22 : r * 0.15;
  const eyeH = hunting ? r * 0.12 : r * 0.07;
  ctx.save();
  ctx.shadowColor = hunting ? '#ff2d4a' : '#fff7f2';
  ctx.shadowBlur = hunting ? 10 : 5;
  ctx.fillStyle = hunting ? '#ff2d4a' : '#fff7f2';
  for (const ex of [-r * 0.12, r * 0.3]) {
    ctx.beginPath();
    ctx.ellipse(ex, -r * 0.2, eyeW, eyeH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Flyer enemy: real filled membrane wings (not stroked lines) that flap on
 * a sine cycle, a small hunched body, tucked clawed feet, and eyes that
 * flare on the alert/dive telegraph. */
function drawFlyerCreature(ctx, r, palette, hurtFlash, flap, alert) {
  const color = palette.enemy;
  const colorDark = palette.enemyDark;

  const wingSpread = 0.55 + flap * 0.45;
  ctx.fillStyle = `${colorDark}cc`;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.3, -r * 0.1);
    ctx.quadraticCurveTo(side * r * (1.3 + wingSpread * 0.6), -r * (0.9 + wingSpread * 0.5), side * r * (1.9 + wingSpread * 0.4), -r * 0.1);
    ctx.quadraticCurveTo(side * r * 1.1, r * 0.15, side * r * 0.3, r * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = colorDark;
  ctx.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(side * r * 0.35, -r * 0.05);
      ctx.lineTo(side * r * (0.9 + i * 0.4), -r * (0.35 + i * 0.2 * wingSpread));
      ctx.stroke();
    }
  }

  ctx.shadowColor = hurtFlash > 0 ? '#ffffff' : color;
  ctx.shadowBlur = 10;
  const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 1, 0, 0, r * 0.8);
  g.addColorStop(0, hurtFlash > 0 ? '#ffffff' : '#fff7f2');
  g.addColorStop(0.55, color);
  g.addColorStop(1, colorDark);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.68, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = colorDark;
  ctx.lineWidth = 1.4;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * r * 0.25, r * 0.55);
    ctx.lineTo(side * r * 0.4, r * 0.78);
    ctx.stroke();
  }

  ctx.save();
  ctx.shadowColor = alert ? '#ff2d4a' : '#fff7f2';
  ctx.shadowBlur = alert ? 9 : 5;
  ctx.fillStyle = alert ? '#ff2d4a' : '#fff7f2';
  ctx.beginPath();
  ctx.ellipse(-r * 0.15, -r * 0.08, r * (alert ? 0.16 : 0.11), r * 0.08, 0, 0, Math.PI * 2);
  ctx.ellipse(r * 0.2, -r * 0.1, r * (alert ? 0.16 : 0.11), r * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawEnemy(ctx, e, camX, time, palette) {
  const x = e.x - camX + e.w / 2;
  const y = e.y + e.h / 2;
  const squashT = e.alive ? 0 : e.squashT;
  const scaleY = e.alive ? 1 + Math.sin(time * 8 + e.t) * 0.05 : Math.max(0.08, 1 - squashT);
  const alpha = e.alive ? 1 : Math.max(0, 1 - squashT * 1.4);
  const r = e.w / 2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);

  if (e.type === 'turret') {
    // stationary cannon: armoured base plate + rotating barrel + a glowing
    // targeting lens that brightens right before it fires
    ctx.shadowColor = palette.enemy;
    ctx.shadowBlur = 10;
    ctx.fillStyle = palette.enemyDark;
    roundRect(ctx, -r * 1.05, r * 0.15, e.w * 1.05, r * 0.5, 4);
    ctx.fill();
    const g = ctx.createLinearGradient(0, -r, 0, r);
    g.addColorStop(0, '#fff7f2');
    g.addColorStop(0.5, palette.enemy);
    g.addColorStop(1, palette.enemyDark);
    ctx.fillStyle = g;
    roundRect(ctx, -r, -r * 0.7, e.w, e.h * 0.75, 6);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = palette.enemyDark;
    for (const rx of [-r * 0.6, 0, r * 0.6]) {
      ctx.beginPath();
      ctx.arc(rx, -r * 0.35, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const chargeGlow = e.fireTimer < 0.25 ? 1 - e.fireTimer / 0.25 : 0;
    ctx.save();
    ctx.shadowColor = e.hurtFlash > 0 ? '#ffffff' : '#ff2d4a';
    ctx.shadowBlur = 6 + chargeGlow * 6;
    ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : `rgba(255,45,74,${0.6 + chargeGlow * 0.4})`;
    ctx.beginPath();
    ctx.arc(0, -r * 0.35, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = e.hurtFlash > 0 ? '#ffffff' : palette.enemyDark;
    const barrelLen = r * 1.15;
    ctx.fillRect(e.fireDir > 0 ? 0 : -barrelLen, -4, barrelLen, 8);
    if (chargeGlow > 0) {
      ctx.globalAlpha = alpha * chargeGlow;
      ctx.fillStyle = '#fff7f2';
      ctx.shadowColor = '#fff7f2';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(e.fireDir > 0 ? barrelLen : -barrelLen, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  ctx.scale(e.dir, scaleY);

  if (e.type === 'flyer') {
    const flap = Math.sin(time * 12) * 0.5 + 0.5;
    drawFlyerCreature(ctx, r, palette, e.hurtFlash, flap, e.state === 'alert' || e.state === 'diving');
  } else {
    const hunting = e.type === 'hunter' && (e.state === 'alert' || e.state === 'chase');
    drawGroundCreature(ctx, r, palette, e.hurtFlash, time * 9 + e.t, hunting);
  }
  ctx.restore();
}

// A hunched, asymmetric horned silhouette for the boss — tall jagged "crown"
// spikes concentrated up top, shorter grounded claws around the base — built
// once here rather than inline so both the main body and its charge-trail
// afterimages share the exact same shape.
const BOSS_PROFILE = [
  [-100, 1.05], [-75, 1.7], [-55, 1.15], [-30, 1.5],
  [-8, 1.0], [15, 1.55], [35, 1.1], [60, 1.35],
  [85, 0.95], [110, 1.2], [140, 0.85], [180, 1.05],
  [-155, 0.9], [-130, 1.15]
];

function bossProfile(phase) {
  const scale = 1 + (phase - 1) * 0.08;
  return BOSS_PROFILE.map(([deg, mult]) => [deg, mult > 1.25 ? mult * scale : mult]);
}

/** The boss's actual body: a dark, corrupted hide (never fully recoloured)
 * with glowing cracks, eyes and jaw carrying the state colour on top — so it
 * reads as "a menacing thing" at rest AND still gives the clear telegraph/
 * attack/vulnerable colour cue the fight depends on. */
function drawBossBody(ctx, r, phase, palette, stateColor, hurtFlash, time, mouthOpen) {
  const hide = palette.enemyDark;
  const hideLight = shadeColor(palette.enemyDark, 30);
  const profile = bossProfile(phase);

  ctx.shadowColor = hurtFlash > 0 ? '#ffffff' : stateColor;
  ctx.shadowBlur = 16;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.4, 1, 0, 0, r * 1.7);
  g.addColorStop(0, hurtFlash > 0 ? '#ffffff' : hideLight);
  g.addColorStop(0.5, hide);
  g.addColorStop(1, '#050508');
  ctx.fillStyle = g;
  jaggedSilhouette(ctx, r, profile);
  ctx.fill();
  ctx.shadowBlur = 0;

  // glowing cracks in the current state colour — the telegraph/attack/
  // vulnerable read, layered over a body that always stays dark and menacing
  ctx.save();
  ctx.strokeStyle = stateColor;
  ctx.lineWidth = 1.6;
  ctx.shadowColor = stateColor;
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.55 + 0.35 * Math.sin(time * 9);
  const cracks = [
    [[0, 0], [-r * 0.3, -r * 0.5], [-r * 0.55, -r * 0.35]],
    [[0, 0], [r * 0.35, -r * 0.45], [r * 0.5, -r * 0.75]],
    [[0, r * 0.1], [r * 0.4, r * 0.3], [r * 0.65, r * 0.2]],
    [[0, r * 0.1], [-r * 0.35, r * 0.35], [-r * 0.5, r * 0.15]]
  ];
  for (const path of cracks) {
    ctx.beginPath();
    path.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.stroke();
  }
  ctx.restore();

  // fanged maw — widens visibly while winding up / firing
  const jawOpen = 0.15 + mouthOpen * 0.55;
  ctx.fillStyle = '#050508';
  ctx.beginPath();
  ctx.moveTo(-r * 0.32, r * 0.3);
  ctx.lineTo(r * 0.32, r * 0.3);
  ctx.lineTo(r * 0.24, r * (0.3 + jawOpen));
  ctx.lineTo(-r * 0.24, r * (0.3 + jawOpen));
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fff';
  const teeth = 5;
  for (let i = 0; i < teeth; i++) {
    const tx = -r * 0.26 + (i / (teeth - 1)) * r * 0.52;
    ctx.beginPath();
    ctx.moveTo(tx - r * 0.035, r * 0.3);
    ctx.lineTo(tx + r * 0.035, r * 0.3);
    ctx.lineTo(tx, r * (0.3 + jawOpen * 0.7));
    ctx.closePath();
    ctx.fill();
  }

  // slit eyes — an extra pair appears each phase, the clearest "this is
  // getting worse" cue short of the body itself changing
  const eyePairs = [[-r * 0.3, -r * 0.42], [r * 0.05, -r * 0.5]];
  if (phase >= 2) eyePairs.push([r * 0.32, -r * 0.3]);
  if (phase >= 3) eyePairs.push([-r * 0.05, -r * 0.62]);
  if (phase >= 4) eyePairs.push([-r * 0.34, -r * 0.15]);
  const eyeGlow = 0.6 + 0.4 * Math.sin(time * 11);
  ctx.save();
  ctx.shadowColor = '#ff2d4a';
  ctx.shadowBlur = 10 + phase * 4;
  ctx.fillStyle = `rgba(255,45,74,${0.75 + eyeGlow * 0.25})`;
  for (const [ex, ey] of eyePairs) {
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ex >= 0 ? 0.35 : -0.35);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.1, r * 0.035, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

export function drawBoss(ctx, b, camX, time, palette) {
  const x = b.x - camX + b.w / 2;
  const y = b.y + b.h / 2;
  const r = b.w / 2;
  const phase = b.currentPhase || 1;

  if (b.defeated) {
    const t = b.squashT;
    const alpha = Math.max(0, 1 - t);
    if (alpha <= 0) return;
    ctx.save();
    ctx.translate(x, y);

    // fracturing shards flying outward — reads as "breaking apart" instead
    // of a plain expanding disc
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + i * 0.4;
      const dist = t * r * (1.6 + (i % 3) * 0.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(Math.cos(a) * dist, Math.sin(a) * dist);
      ctx.rotate(a + t * 6);
      ctx.fillStyle = palette.enemyDark;
      ctx.beginPath();
      ctx.moveTo(-r * 0.1, -r * 0.14);
      ctx.lineTo(r * 0.12, -r * 0.04);
      ctx.lineTo(0, r * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.globalAlpha = alpha;
    ctx.scale(1 + t * 1.4, 1 + t * 1.4);
    ctx.fillStyle = 'rgba(255,210,63,0.7)';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }

  let stateColor = palette.boss;
  let pulseSpeed = 6;
  if (b.state === 'telegraph' || b.isChargeTelegraph) { stateColor = '#ffffff'; pulseSpeed = 20; }
  else if (b.state === 'attack' || b.isCharging) { stateColor = '#ff2d2d'; pulseSpeed = 14; }
  else if (b.state === 'vulnerable') { stateColor = '#7dffb0'; pulseSpeed = 4; }

  const pulse = 1 + Math.sin(time * pulseSpeed) * (b.state === 'vulnerable' ? 0.03 : 0.07);

  // A motion-blur afterimage trail while charging — the clearest possible
  // "get out of the way" read for a fast, screen-crossing attack.
  if (b.isCharging) {
    for (let i = 1; i <= 4; i++) {
      const trailX = x - b.chargeDir * i * 14;
      ctx.save();
      ctx.globalAlpha = 0.16 - i * 0.03;
      ctx.translate(trailX, y);
      ctx.scale(b.dir >= 0 ? 1 : -1, 1);
      ctx.fillStyle = stateColor;
      jaggedSilhouette(ctx, r, bossProfile(phase));
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(x, y);

  // A slow crouch-and-flash while winding up a charge — telegraphs the
  // attack clearly before the boss becomes a fast-moving hazard.
  if (b.isChargeTelegraph) {
    const flash = 0.5 + 0.5 * Math.sin(time * 28);
    ctx.save();
    ctx.globalAlpha = 0.5 + flash * 0.4;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, r + 18 + flash * 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Layered orbiting rings — more of them, and faster, the angrier it gets.
  const ringCount = phase >= 4 ? 4 : phase === 3 ? 3 : phase === 2 ? 2 : 1;
  for (let i = 0; i < ringCount; i++) {
    ctx.save();
    ctx.rotate(time * (b.state === 'vulnerable' ? 0.3 : 0.9 + i * 0.4) * (i % 2 === 0 ? 1 : -1));
    ctx.strokeStyle = `${stateColor}55`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 12 + i * 10, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // A brooding red aura that thickens each phase — the single biggest cue
  // that this thing is bigger and angrier than a normal enemy.
  ctx.save();
  const auraR = r * (1.5 + phase * 0.18);
  const aura = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, auraR);
  aura.addColorStop(0, `rgba(255,45,74,${0.05 + phase * 0.05})`);
  aura.addColorStop(1, 'rgba(255,45,74,0)');
  ctx.fillStyle = aura;
  ctx.beginPath();
  ctx.arc(0, 0, auraR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.scale(b.dir >= 0 ? 1 : -1, pulse);
  const mouthOpen = b.state === 'attack' ? 1 : b.state === 'telegraph' ? 0.5 : 0;
  drawBossBody(ctx, r, phase, palette, stateColor, b.hurtFlash, time, mouthOpen);

  ctx.restore();
}

export function drawHazard(ctx, h, camX, time, palette) {
  const x = h.x - camX;
  if (h.type === 'spikes') {
    const teeth = Math.max(2, Math.round(h.w / 12));
    const tw = h.w / teeth;
    ctx.save();
    ctx.shadowColor = palette.enemy;
    ctx.shadowBlur = 8;
    ctx.fillStyle = palette.enemy;
    for (let i = 0; i < teeth; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * tw, h.y + h.h);
      ctx.lineTo(x + i * tw + tw / 2, h.y);
      ctx.lineTo(x + i * tw + tw, h.y + h.h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // laser gate
  const active = h.active;
  const telegraph = h.telegraph;
  ctx.save();
  const color = active ? '#ff2d7a' : telegraph ? '#ff8fb8' : 'rgba(255,45,122,0.18)';
  const flicker = telegraph ? 0.5 + 0.5 * Math.sin(time * 30) : 1;
  ctx.globalAlpha = active ? 0.95 : telegraph ? 0.55 * flicker : 0.3;
  ctx.fillStyle = color;
  ctx.shadowColor = '#ff2d7a';
  ctx.shadowBlur = active ? 18 : 4;
  roundRect(ctx, x, h.y, h.w, h.h, 3);
  ctx.fill();
  ctx.restore();
}

export function drawProjectile(ctx, p, camX) {
  const x = p.x - camX;
  ctx.save();
  ctx.translate(x, p.y);
  ctx.rotate(p.spin);
  ctx.shadowColor = p.color;
  ctx.shadowBlur = 14;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.w / 2);
  g.addColorStop(0, '#fff7f2');
  g.addColorStop(1, p.color);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

/** The black-hole boss-arena transition: converging rings + a bright core
 * pulling everything toward (cx,cy) while the player is en route, then a
 * brief arrival flash that settles into the arena's darker mood once
 * `teleported` flips true. Drawn on top of the normal scene, in the same
 * world-space coordinates as everything else. */
export function drawPortalVortex(ctx, width, height, cx, cy, progress, teleported) {
  ctx.save();
  if (!teleported) {
    const pull = clamp01(progress / 0.55);
    const vign = ctx.createRadialGradient(cx, cy, 4, cx, cy, Math.max(width, height) * (1 - pull * 0.3));
    vign.addColorStop(0, 'rgba(10,5,20,0)');
    vign.addColorStop(0.55, `rgba(10,5,25,${0.25 + pull * 0.4})`);
    vign.addColorStop(1, `rgba(0,0,0,${0.5 + pull * 0.4})`);
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < 4; i++) {
      const ringT = clamp01(pull * 1.3 - i * 0.18);
      if (ringT <= 0 || ringT >= 1) continue;
      const r = (1 - ringT) * Math.max(width, height) * 0.5 + 6;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(ringT * 9 + i * 1.4);
      ctx.strokeStyle = `rgba(139,92,246,${(1 - ringT) * 0.65})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.42, 0, 0, Math.PI * 1.6);
      ctx.stroke();
      ctx.restore();
    }

    const coreR = 6 + pull * 14;
    const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR * 3);
    core.addColorStop(0, 'rgba(255,255,255,0.95)');
    core.addColorStop(0.35, 'rgba(180,120,255,0.85)');
    core.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR * 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const settle = clamp01((progress - 0.55) / 0.45);
    const flashA = Math.max(0, 1 - settle * 1.6);
    if (flashA > 0) {
      ctx.fillStyle = `rgba(255,255,255,${flashA * 0.5})`;
      ctx.fillRect(0, 0, width, height);
    }
    const edge = ctx.createRadialGradient(cx, cy, height * 0.15, cx, cy, height * 0.85);
    edge.addColorStop(0, 'rgba(0,0,0,0)');
    edge.addColorStop(1, `rgba(0,0,0,${0.3 * settle})`);
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

/** Persistent boss-arena mood once the player has been warped in: a heavier
 * vignette, two dark boundary pillars flanking the arena, and a slow red
 * pulse synced to the boss's telegraph/attack states so the room itself
 * seems to react to the fight. */
export function drawArenaAtmosphere(ctx, width, height, camX, camY, time, boss, arenaData) {
  ctx.save();
  // Drawn inside the camera's vertical translate, so every full-frame fill
  // has to be offset back by camY to stay locked to the viewport.
  const top = camY;
  const cxView = camX + width / 2;
  const cyView = camY + height * 0.45;

  const vign = ctx.createRadialGradient(cxView - camX, cyView, height * 0.22, cxView - camX, cyView, Math.max(width, height) * 0.72);
  vign.addColorStop(0, 'rgba(0,0,0,0)');
  vign.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vign;
  ctx.fillRect(0, top, width, height);

  // Boundary pillars derived from the arena's OWN wall geometry (levels.js
  // bossArena.platforms) instead of two hard-coded x values left over from
  // before the arena became a separate room at x >= 5000 — they were being
  // drawn 3400px away from the fight.
  const walls = (arenaData?.platforms || [])
    .filter((p) => p.h > 200)
    .map((p) => p.x + p.w / 2);
  for (const wx of walls) {
    const x = wx - camX;
    if (x < -80 || x > width + 80) continue;
    const grad = ctx.createLinearGradient(x - 34, 0, x + 34, 0);
    grad.addColorStop(0, 'rgba(20,6,10,0)');
    grad.addColorStop(0.5, 'rgba(20,6,10,0.92)');
    grad.addColorStop(1, 'rgba(20,6,10,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 34, top, 68, height * 0.85);
    ctx.strokeStyle = 'rgba(255,59,59,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height * 0.85);
    ctx.stroke();
  }

  if (boss && !boss.defeated) {
    const phase = boss.currentPhase || 1;
    if (boss.state === 'attack' || boss.state === 'telegraph') {
      const pulse = 0.5 + 0.5 * Math.sin(time * (boss.state === 'attack' ? 16 : 10));
      ctx.fillStyle = `rgba(255,40,40,${(0.04 + pulse * 0.06) * (0.7 + phase * 0.15)})`;
      ctx.fillRect(0, top, width, height);
    } else if (boss.isChargeTelegraph || boss.isCharging) {
      // A sharper, whiter warning flash for the charge — distinct from the
      // steadier red pulse of the ranged-attack windup, so the two attacks
      // never read as the same threat.
      const flash = 0.5 + 0.5 * Math.sin(time * 26);
      ctx.fillStyle = `rgba(255,255,255,${0.03 + flash * 0.05})`;
      ctx.fillRect(0, top, width, height);
    }
  }
  ctx.restore();
}

// A floating holographic instruction placard used only by the tutorial level
// (see world/levels.js TUTORIAL_LEVEL.signs) — the first canvas-drawn text in
// this file. Every other UI text in the game goes through DOM (HUD/BossBar/
// modals), but these need to live IN world space, panning/scaling exactly
// with the platforms and entities they're pointing at, so drawing them here
// alongside everything else avoids keeping a second screen-space coordinate
// system in sync with the camera.
export function drawTutorialSign(ctx, sign, camX, time, palette) {
  const bob = Math.sin(time * 1.6 + sign.x * 0.01) * 6;
  const x = sign.x - camX;
  const y = sign.y + bob;
  const w = 216;
  const lineH = 20;
  const h = 44 + sign.lines.length * lineH;
  const left = x - w / 2;
  const top = y - h;

  ctx.save();

  ctx.shadowColor = palette.accent;
  ctx.shadowBlur = 16;
  const grad = ctx.createLinearGradient(left, top, left, top + h);
  grad.addColorStop(0, 'rgba(10,14,26,0.85)');
  grad.addColorStop(1, 'rgba(5,7,14,0.9)');
  ctx.fillStyle = grad;
  roundRect(ctx, left, top, w, h, 12);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = 0.7 + Math.sin(time * 2.4 + sign.x * 0.02) * 0.2;
  roundRect(ctx, left, top, w, h, 12);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '24px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(sign.icon, x, top + 24);

  sign.lines.forEach((line, i) => {
    ctx.font = i === 0
      ? "700 14px 'Orbitron', 'Courier New', monospace"
      : "600 12.5px 'Rajdhani', Arial, sans-serif";
    ctx.fillStyle = i === 0 ? palette.accent : 'rgba(235,245,255,0.92)';
    ctx.fillText(line, x, top + 48 + i * lineH);
  });

  // A short stem toward the ground, echoing the checkpoint flagpole look so
  // the sign reads as "planted" at this spot rather than floating at random.
  ctx.strokeStyle = palette.accent;
  ctx.globalAlpha = 0.32;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, top + h);
  ctx.lineTo(x, top + h + 22);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

export function drawCheckpoint(ctx, cp, camX, time, palette) {
  const x = cp.x - camX + cp.w / 2;
  const baseY = cp.y + cp.h;
  const color = cp.activated ? palette.accent : 'rgba(255,255,255,0.25)';

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, cp.y);
  ctx.stroke();

  const flagWave = cp.activated ? Math.sin(time * 4 + cp.t) * 3 : 0;
  ctx.beginPath();
  ctx.moveTo(x, cp.y);
  ctx.lineTo(x + 16 + flagWave, cp.y + 8);
  ctx.lineTo(x, cp.y + 16);
  ctx.closePath();
  ctx.fillStyle = color;
  if (cp.activated) { ctx.shadowColor = color; ctx.shadowBlur = 12; }
  ctx.fill();

  if (cp.activated) {
    ctx.shadowBlur = 0;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(time * 3 + cp.t);
    ctx.beginPath();
    ctx.arc(x, baseY - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // One-shot expanding "activation" ring, plays once right after the
    // checkpoint is reached and then never again.
    const RING_DURATION = 0.6;
    if (cp.activeTime < RING_DURATION) {
      const t = cp.activeTime / RING_DURATION;
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 * (1 - t) + 1;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(x, cp.y + cp.h / 2, 6 + t * 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function drawGoal(ctx, goal, camX, time, palette, unlocked = true) {
  const x = goal.x - camX + goal.w / 2;
  const yTop = goal.y;
  const yBottom = goal.y + goal.h;
  const color = unlocked ? palette.goal : '#4a4a58';

  ctx.save();
  const beamGrad = ctx.createLinearGradient(x, yTop - 40, x, yBottom);
  beamGrad.addColorStop(0, `${color}00`);
  beamGrad.addColorStop(1, unlocked ? `${color}33` : `${color}11`);
  ctx.fillStyle = beamGrad;
  ctx.fillRect(x - goal.w / 2, yTop - 40, goal.w, goal.h + 40);

  const ringCount = unlocked ? 3 : 2;
  for (let i = 0; i < ringCount; i++) {
    const t = time * (unlocked ? 1.2 + i * 0.3 : 0.3) + i * 2;
    const ry = (goal.h / 2) * (0.5 + i * 0.22);
    ctx.save();
    ctx.translate(x, yTop + goal.h / 2);
    ctx.rotate(t);
    ctx.strokeStyle = unlocked ? `${color}${i === 0 ? 'ff' : '77'}` : `${color}55`;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = unlocked ? 18 : 4;
    ctx.beginPath();
    ctx.ellipse(0, 0, goal.w / 2.4, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- the hero
// Design matches the RetroAvia mascot: red flight helmet + aviator goggles,
// red jacket over black flight suit, silver-finned jetpack. Brand colors
// (red/black) stay constant across dimensions; only the goggle/visor and
// thruster glow pick up each dimension's accent so the hero still reads as
// "home turf" everywhere without losing his identity.

const BRAND_RED = '#c81e2e';
const BRAND_RED_DARK = '#7a0f1c';
const BRAND_RED_LIGHT = '#e8455a';
const BRAND_BLACK = '#12121a';
const BRAND_BLACK_LIGHT = '#26263a';
const GOGGLE_LENS = '#8fb8c8';

export function drawPlayer(ctx, p, camX, palette, time) {
  const x = p.x - camX + p.w / 2;
  const y = p.y + p.h / 2;

  ctx.save();
  if (p.invulnerable && !p.isDashing && Math.floor(time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

  ctx.translate(x, y);

  if (p.isDying) {
    const t = Math.min(p.dyingTime / 0.6, 1);
    ctx.rotate(t * 4);
    ctx.globalAlpha = Math.max(0, 1 - t);
    ctx.scale(1 - t * 0.3, 1 - t * 0.3);
  }

  // Squash & stretch: a single signed value from Player.js (positive =
  // takeoff stretch, negative = landing/impact squash), decayed to neutral
  // over a few frames — cheap but goes a long way toward making jumps and
  // landings feel weighty instead of robotic.
  const squashScaleY = 1 + (p.squash || 0) * 0.5;
  const squashScaleX = 1 - (p.squash || 0) * 0.35;
  ctx.scale(p.facing * squashScaleX, squashScaleY);

  const legPhase = p.animTime * 11;
  const isRun = p.animState === 'run';
  const isAir = p.animState === 'jump' || p.animState === 'fall';
  const isDash = p.animState === 'dash';
  const legSwing = isDash ? 0.5 : isRun ? Math.sin(legPhase) * 0.55 : isAir ? 0.25 : 0.06;
  const bob = isRun ? Math.abs(Math.sin(legPhase)) * 2 : 0;
  const lean = isDash ? 0.35 : isRun ? 0.12 : 0;

  ctx.save();
  ctx.rotate(lean);

  // dash speed-lines trail
  if (isDash) {
    ctx.save();
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ly = -p.h * 0.3 + i * (p.h * 0.3);
      ctx.beginPath();
      ctx.moveTo(-p.w * 0.6 - i * 6, ly);
      ctx.lineTo(-p.w * 1.6 - i * 10, ly);
      ctx.stroke();
    }
    ctx.restore();
  }

  // jetpack (drawn behind the body, offset backward)
  const packX = -p.w * 0.34;
  const packY = -p.h * 0.32 - bob;
  ctx.save();
  ctx.fillStyle = '#b9c2cf';
  ctx.shadowColor = palette.thruster;
  ctx.shadowBlur = 4;
  roundRect(ctx, packX - 5, packY, 7, p.h * 0.42, 3);
  ctx.fill();
  // wing fin
  ctx.fillStyle = '#dfe4ea';
  ctx.beginPath();
  ctx.moveTo(packX - 5, packY + 4);
  ctx.lineTo(packX - 15, packY - 2);
  ctx.lineTo(packX - 5, packY + 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // thruster glow when airborne / dashing
  if (isAir || isDash) {
    const flick = 0.6 + Math.random() * 0.4;
    ctx.save();
    ctx.globalAlpha *= flick;
    ctx.fillStyle = palette.thruster;
    ctx.shadowColor = palette.thruster;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(packX - 5, packY + p.h * 0.42, 4, 7 + Math.random() * 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // legs — black flight suit
  ctx.strokeStyle = BRAND_BLACK;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, p.h * 0.08 - bob);
  ctx.lineTo(-4 + legSwing * 10, p.h / 2 - 2);
  ctx.moveTo(4, p.h * 0.08 - bob);
  ctx.lineTo(4 - legSwing * 10, p.h / 2 - 2);
  ctx.stroke();
  // boots
  ctx.strokeStyle = '#050508';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-4 + legSwing * 10, p.h / 2 - 2);
  ctx.lineTo(-4 + legSwing * 10, p.h / 2 + 1);
  ctx.moveTo(4 - legSwing * 10, p.h / 2 - 2);
  ctx.lineTo(4 - legSwing * 10, p.h / 2 + 1);
  ctx.stroke();

  // torso — red jacket
  const torsoY = -p.h * 0.42 - bob;
  const torsoH = p.h * 0.55;
  const grad = ctx.createLinearGradient(0, torsoY, 0, torsoY + torsoH);
  grad.addColorStop(0, BRAND_RED_LIGHT);
  grad.addColorStop(1, BRAND_RED_DARK);
  ctx.fillStyle = grad;
  ctx.shadowColor = BRAND_RED_DARK;
  ctx.shadowBlur = 6;
  roundRect(ctx, -p.w * 0.32, torsoY, p.w * 0.64, torsoH, 8);
  ctx.fill();

  // utility belt
  ctx.shadowBlur = 0;
  ctx.fillStyle = BRAND_BLACK;
  ctx.fillRect(-p.w * 0.32, torsoY + torsoH * 0.72, p.w * 0.64, 3.5);

  // chest light (dimension accent)
  ctx.shadowColor = palette.accent;
  ctx.shadowBlur = 8;
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(0, torsoY + torsoH * 0.4, 3, 0, Math.PI * 2);
  ctx.fill();

  // arm
  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRAND_RED;
  ctx.lineWidth = 5.5;
  ctx.lineCap = 'round';
  const armSwing = isDash ? -0.9 : isRun ? Math.sin(legPhase + Math.PI) * 0.5 : isAir ? -0.6 : 0.15;
  ctx.beginPath();
  ctx.moveTo(p.w * 0.28, torsoY + 4);
  ctx.lineTo(p.w * 0.28 + armSwing * 9, torsoY + torsoH * 0.75);
  ctx.stroke();
  // glove
  ctx.fillStyle = BRAND_BLACK_LIGHT;
  ctx.beginPath();
  ctx.arc(p.w * 0.28 + armSwing * 9, torsoY + torsoH * 0.75, 3, 0, Math.PI * 2);
  ctx.fill();

  // helmet — red with dark centre stripe
  const headY = torsoY - p.h * 0.2;
  const headR = p.w * 0.36;
  ctx.shadowColor = BRAND_RED_DARK;
  ctx.shadowBlur = 6;
  const headGrad = ctx.createRadialGradient(-3, headY - 3, 1, 0, headY, headR);
  headGrad.addColorStop(0, BRAND_RED_LIGHT);
  headGrad.addColorStop(1, BRAND_RED);
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(0, headY, headR, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = BRAND_RED_DARK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headY - headR);
  ctx.lineTo(0, headY + headR * 0.3);
  ctx.stroke();

  // aviator goggles: two lenses joined by a strap, glowing with the
  // dimension's accent colour so each world still feels distinct
  const gY = headY + headR * 0.05;
  const gR = headR * 0.42;
  ctx.fillStyle = '#3a3a44';
  ctx.fillRect(-gR * 1.9, gY - 2.5, gR * 3.8, 5);

  for (const side of [-1, 1]) {
    const gx = side * gR * 1.15;
    ctx.save();
    ctx.shadowColor = palette.accent;
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#2a2a32';
    ctx.beginPath();
    ctx.arc(gx, gY, gR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 6;
    const lensGrad = ctx.createRadialGradient(gx - gR * 0.3, gY - gR * 0.3, 0.5, gx, gY, gR * 0.75);
    lensGrad.addColorStop(0, '#eaf6ff');
    lensGrad.addColorStop(0.5, palette.accent);
    lensGrad.addColorStop(1, GOGGLE_LENS);
    ctx.fillStyle = lensGrad;
    ctx.beginPath();
    ctx.arc(gx, gY, gR * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // lean
  ctx.restore();
}

/** The plasma blade's swing arc — a bright forward-facing crescent that
 * fades over the attack's short active window. `t` is 1 the instant the
 * swing starts and 0 the instant it ends (see Player.attackTime/attackDuration). */
export function drawMeleeSlash(ctx, p, camX, t) {
  const cx = p.x - camX + p.w / 2 + p.facing * p.w * 0.35;
  const cy = p.y + p.h * 0.45;
  const reach = p.w * 1.35;
  const spread = 1.0; // half-angle of the arc, radians
  const centerAngle = p.facing > 0 ? 0 : Math.PI;

  ctx.save();
  ctx.globalAlpha = Math.max(0, t);
  ctx.strokeStyle = '#eafaff';
  ctx.shadowColor = '#7ad9ff';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 4.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy, reach * (0.7 + (1 - t) * 0.35), centerAngle - spread, centerAngle + spread, false);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#bfe9ff';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, reach * (0.45 + (1 - t) * 0.25), centerAngle - spread * 0.7, centerAngle + spread * 0.7, false);
  ctx.stroke();
  ctx.restore();
}
