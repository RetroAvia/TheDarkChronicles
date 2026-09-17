import { Player } from '../src/entities/Player.js';
import { Platform } from '../src/entities/Platform.js';
import { LEVELS, TUTORIAL_LEVEL } from '../src/world/levels.js';

const DT = 1/60;
// brute-force: from a start platform, try many jump plans, see which platforms/crystals we can reach
function simulate(level, startPlat, abilities, plan) {
  const platforms = level.platforms.map(p => new Platform(p));
  const world = { platforms };
  const p = new Player();
  p.abilities = { ...abilities, melee:true };
  // start standing at right edge of startPlat, running right
  p.spawn(startPlat.x + startPlat.w - p.w - plan.runup, startPlat.y - p.h);
  p.onGround = true;
  const touched = new Set();
  let t = 0;
  let jumped=false, dj=false, dashed=false;
  const input = { left:false, right:true };
  const trail=[];
  while (t < 4) {
    for (const pl of platforms) pl.update(DT);
    if (!jumped && p.onGround && t > plan.runTime) { p.requestJump(); jumped=true; }
    if (jumped && !dj && plan.doubleJumpAt!=null && t > plan.runTime+plan.doubleJumpAt) { p.requestJump(); dj=true; }
    if (jumped && !dashed && plan.dashAt!=null && t > plan.runTime+plan.dashAt) { p.requestDash(); dashed=true; }
    if (plan.cutAt!=null && t > plan.runTime+plan.cutAt) p.releaseJump();
    p.update(DT, input, world);
    trail.push({x:p.x,y:p.y});
    level.collectibles.forEach((c,i)=>{
      const cy = c.y; // ignore bob
      if (p.x < c.x+20 && p.x+p.w > c.x && p.y < cy+20+6 && p.y+p.h > cy-6) touched.add(i);
    });
    if (p.onGround && jumped && t > plan.runTime+0.2) {
      return { landedX: p.x, landedY: p.y, plat: platforms.find(q=>q===p.groundPlatform), touched, trail };
    }
    if (p.y > 800) return { fell:true, touched, trail };
    t += DT;
  }
  return { timeout:true, touched, trail };
}

const plans=[];
for (const runup of [0, 60, 140, 240]) for (const runTime of [0.35]) {
  plans.push({runup,runTime});
  for (const cut of [0.08,0.14,0.22]) plans.push({runup,runTime,cutAt:cut});
  for (const dja of [0.1,0.2,0.3,0.4]) plans.push({runup,runTime,doubleJumpAt:dja});
  for (const da of [0.05,0.15,0.25,0.35]) plans.push({runup,runTime,dashAt:da});
  for (const dja of [0.2,0.3]) for (const da of [0.35,0.45,0.55]) plans.push({runup,runTime,doubleJumpAt:dja,dashAt:da});
}

for (const level of [...LEVELS]) {
  const abil = { doubleJump: level.id>=2, dash: level.id>=3 };
  const plats = level.platforms;
  const reachableCrystals = new Set();
  const gapReports=[];
  for (let i=0;i<plats.length;i++){
    let bestTarget = -1;
    for (const plan of plans) {
      const r = simulate(level, plats[i], abil, plan);
      r.touched.forEach(c=>reachableCrystals.add(c));
      if (r.plat) {
        const idx = plats.indexOf(plats.find(q=>q.x===r.plat.baseX && q.y===r.plat.baseY));
        if (idx>bestTarget) bestTarget=idx;
      }
    }
    if (i < plats.length-1 && bestTarget <= i) gapReports.push(`  plat#${i} (x${plats[i].x}) -> CANNOT reach plat#${i+1} (x${plats[i+1].x}) with abilities DJ=${abil.doubleJump} dash=${abil.dash}`);
  }
  const missing = level.collectibles.map((c,i)=>i).filter(i=>!reachableCrystals.has(i));
  console.log(`L${level.id} ${level.name}: crystals unreachable-in-sim = [${missing.join(',')}]`);
  gapReports.forEach(g=>console.log(g));
}
