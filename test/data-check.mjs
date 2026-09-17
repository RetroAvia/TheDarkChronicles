import { LEVELS, TUTORIAL_LEVEL, DESIGN_HEIGHT } from '../src/world/levels.js';
import { QUIZ_QUESTIONS } from '../src/narrative/quiz.js';
import { STORY } from '../src/narrative/story.js';

const all = [TUTORIAL_LEVEL, ...LEVELS];
const issues = [];

function rects(l){ return l.platforms.map(p=>({...p})); }

for (const l of all) {
  const plats = rects(l);
  // 1. collectibles reachable? check each collectible sits above some platform within jump reach
  l.collectibles.forEach((c,i)=>{
    const below = plats.filter(p=> c.x+20 > p.x && c.x < p.x+p.w && p.y >= c.y);
    if (!below.length) issues.push(`L${l.id} crystal#${i} @(${c.x},${c.y}) has NO platform underneath`);
    else {
      const nearest = below.reduce((a,b)=> (b.y-c.y < a.y-c.y ? b : a));
      const dy = nearest.y - (c.y+20);
      if (dy > 200) issues.push(`L${l.id} crystal#${i} @(${c.x},${c.y}) floats ${dy}px above nearest platform y=${nearest.y}`);
    }
  });
  // 2. entities inside platforms?
  const solids=[...(l.enemies||[]).map((e,i)=>({n:`enemy#${i}`,x:e.x,y:e.y,w:e.w||28,h:e.h||28})),
    ...(l.checkpoints||[]).map((c,i)=>({n:`checkpoint#${i}`,x:c.x,y:c.y,w:c.w||28,h:c.h||60})),
    {n:'goal',x:l.goal.x,y:l.goal.y,w:40,h:70}];
  for (const s of solids){
    for (const p of plats){
      const ox = Math.min(s.x+s.w,p.x+p.w)-Math.max(s.x,p.x);
      const oy = Math.min(s.y+s.h,p.y+p.h)-Math.max(s.y,p.y);
      if (ox>1 && oy>1) issues.push(`L${l.id} ${s.n} @(${s.x},${s.y}) OVERLAPS platform @(${p.x},${p.y},${p.w}x${p.h}) by ${ox.toFixed(0)}x${oy.toFixed(0)}`);
    }
  }
  // 3. goal x beyond world width?
  const worldW = Math.max(...plats.map(p=>p.x+p.w))+220;
  if (l.goal.x+40 > worldW) issues.push(`L${l.id} goal beyond worldWidth`);
  // 4. checkpoint on crumble platform
  (l.checkpoints||[]).forEach((c,i)=>{
    const under = plats.find(p=> c.x+ (c.w||28) > p.x && c.x < p.x+p.w && p.y >= c.y+(c.h||60)-5 && p.y < c.y+(c.h||60)+80);
    if (!under) issues.push(`L${l.id} checkpoint#${i} @(${c.x},${c.y}) has no platform directly beneath its base`);
    else if (under.crumble) issues.push(`L${l.id} checkpoint#${i} sits on a CRUMBLE platform`);
  });
  // 5. platform below VOID
  plats.forEach(p=>{ if (p.y > DESIGN_HEIGHT) issues.push(`L${l.id} platform y=${p.y} below DESIGN_HEIGHT ${DESIGN_HEIGHT}`); });
  // 6. enemies above void / hazards misplaced
  (l.hazards||[]).forEach((h,i)=>{ if(h.y+h.h>DESIGN_HEIGHT+50) issues.push(`L${l.id} hazard#${i} below world`); });
}

// quiz integrity
const seen=new Map();
QUIZ_QUESTIONS.forEach((q,i)=>{
  if (typeof q.correct!=='number'||q.correct<0||q.correct>=q.answers.length) issues.push(`QUIZ#${i} bad correct index`);
  if (new Set(q.answers).size!==q.answers.length) issues.push(`QUIZ#${i} duplicate answers: ${q.question.slice(0,50)}`);
  if (!q.fact) issues.push(`QUIZ#${i} missing fact`);
  if (!q.category) issues.push(`QUIZ#${i} missing category`);
  const k=q.question.trim().toLowerCase();
  if (seen.has(k)) issues.push(`QUIZ duplicate question: "${q.question.slice(0,60)}"`);
  seen.set(k,i);
});
console.log('LEVELS:', LEVELS.length, '| quiz:', QUIZ_QUESTIONS.length);
console.log('STORY keys:', Object.keys(STORY||{}).length);
console.log('\n--- ISSUES ('+issues.length+') ---');
issues.forEach(i=>console.log(' •',i));
