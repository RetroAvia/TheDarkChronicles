// Renders every level at a range of real device viewports — the scaling and
// camera framing rework is the change most likely to break somewhere other
// than the one screen size it was developed on.
import { installGlobals, calls, canvas, VIEWPORT, window as win } from './harness.mjs';
installGlobals();

const { Renderer } = await import('../src/core/Renderer.js');
const { Game } = await import('../src/core/Game.js');
const { LEVELS } = await import('../src/world/levels.js');
const { applyQuality } = await import('../src/core/quality.js');

let failures = 0;
const rows = [];
function check(name, cond, detail = '') {
  if (!cond) { failures++; console.log(`  ✗ ${name} ${detail}`); }
  return cond;
}

const DEVICES = [
  { name: 'Desktop 1920x1080', w: 1920, h: 1080, touch: false },
  { name: 'Laptop 1440x780',   w: 1440, h: 780,  touch: false },
  { name: 'Laptop 1280x620',   w: 1280, h: 620,  touch: false },
  { name: 'iPad landscape',    w: 1180, h: 820,  touch: true },
  { name: 'iPhone landscape',  w: 844,  h: 390,  touch: true },
  { name: 'Android landscape', w: 915,  h: 412,  touch: true },
  { name: 'iPhone PORTRAIT',   w: 390,  h: 844,  touch: true },
  { name: 'Ultrawide 2560x1080', w: 2560, h: 1080, touch: false }
];

for (const dev of DEVICES) {
  VIEWPORT.w = dev.w; VIEWPORT.h = dev.h;
  win.innerWidth = dev.w; win.innerHeight = dev.h;
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { maxTouchPoints: dev.touch ? 5 : 0, hardwareConcurrency: 8, deviceMemory: 8, clipboard: { writeText: async () => {} } }
  });
  globalThis.matchMedia = (q) => ({ matches: q.includes('coarse') ? dev.touch : false, addEventListener() {}, removeEventListener() {} });
  win.matchMedia = globalThis.matchMedia;

  applyQuality(dev.touch ? 'low' : 'high');
  const renderer = new Renderer(canvas);
  const game = new Game(renderer);
  game.renderer.allowPortrait = true; // exercise the "play anyway" path too

  calls.nan.length = 0;
  let worstViewW = Infinity;
  let ok = true, err = null;
  try {
    for (const lvl of LEVELS) {
      game.save.data.bestLevel = lvl.id;
      game.startGame('Tester', 'acrobata', lvl.id);
      game.beginPlaying();
      for (let i = 0; i < 90; i++) {
        game.input.state.right = true;
        if (i % 31 === 0) game.input._jumpEdge = true;
        game.update(1 / 60);
        game.render();
      }
      game.input.state.right = false;
      worstViewW = Math.min(worstViewW, renderer.viewW);
    }
  } catch (e) { ok = false; err = e; }

  const okRender = check(`${dev.name}: render senza eccezioni`, ok, err ? err.message : '');
  const okNan = check(`${dev.name}: nessun NaN`, calls.nan.length === 0, calls.nan.slice(0, 2).join(' | '));
  // Old behaviour, for comparison: the scale was height-only, so the visible
  // world width was width / (height / 575).
  const oldViewW = dev.w / (dev.h / 575);
  const okWidth = check(`${dev.name}: campo visivo utilizzabile`, renderer.viewW >= 700,
    `viewW=${renderer.viewW.toFixed(0)}`);

  rows.push({
    Dispositivo: dev.name,
    'prima (px mondo)': Math.round(oldViewW),
    'dopo (px mondo)': Math.round(renderer.viewW),
    'altezza vista': Math.round(renderer.viewH),
    scala: renderer.scale.toFixed(2),
    portrait: renderer.isPortrait ? 'sì' : 'no',
    esito: okRender && okNan && okWidth ? 'OK' : 'KO'
  });
}

console.table(rows);
console.log(failures === 0 ? '\n✅ TUTTI I VIEWPORT OK' : `\n❌ ${failures} problemi`);
process.exit(failures === 0 ? 0 : 1);
