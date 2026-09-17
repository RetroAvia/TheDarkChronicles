// Minimal DOM + Canvas2D + WebAudio stub, just rich enough to boot the real
// Game class in Node and run frames through it. This is not a browser: it
// exists to catch the class of bug that syntax checks cannot — undefined
// properties, bad call signatures, NaN creeping into the camera, exceptions
// thrown inside render(). Every canvas call is recorded so a NaN coordinate
// can be traced back to the method that produced it.

export const calls = { ctx: 0, nan: [] };

function isBadNum(v) {
  return typeof v === 'number' && !Number.isFinite(v);
}

// shadowBlur lives on a real prototype accessor, exactly like the browser's
// CanvasRenderingContext2D — that is what Renderer._installQualityHook
// shadows, so the quality switch gets exercised by these tests too.
class StubCtx {
  constructor() { this._shadowBlur = 0; }
  get shadowBlur() { return this._shadowBlur; }
  set shadowBlur(v) { this._shadowBlur = v; }
}

function makeCtx(tag = '2d') {
  const state = {
    fillStyle: '#000', strokeStyle: '#000', lineWidth: 1, globalAlpha: 1,
    shadowColor: '#000', font: '', textAlign: '', textBaseline: '',
    lineCap: '', lineJoin: '', globalCompositeOperation: 'source-over'
  };
  const methods = [
    'save', 'restore', 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'arcTo',
    'ellipse', 'rect', 'fillRect', 'strokeRect', 'clearRect', 'fill', 'stroke',
    'translate', 'rotate', 'scale', 'setTransform', 'resetTransform', 'clip',
    'quadraticCurveTo', 'bezierCurveTo', 'fillText', 'strokeText', 'drawImage',
    'putImageData', 'createPattern', 'measureText', 'roundRect'
  ];
  const ctx = Object.assign(new StubCtx(), state, { canvas: null });
  for (const m of methods) {
    ctx[m] = (...args) => {
      calls.ctx++;
      for (const a of args) {
        if (isBadNum(a)) calls.nan.push(`${m}(${args.join(',')})`);
      }
      if (m === 'measureText') return { width: 10 };
      if (m === 'createPattern') return {};
      return undefined;
    };
  }
  const grad = () => ({ addColorStop: (o, c) => { if (isBadNum(o)) calls.nan.push('addColorStop'); } });
  ctx.createLinearGradient = (...a) => { a.forEach((v) => isBadNum(v) && calls.nan.push('createLinearGradient')); return grad(); };
  ctx.createRadialGradient = (...a) => { a.forEach((v) => isBadNum(v) && calls.nan.push('createRadialGradient')); return grad(); };
  ctx.createImageData = () => ({ data: new Uint8ClampedArray(4) });
  ctx.getImageData = () => ({ data: new Uint8ClampedArray(4) });
  return ctx;
}

class StubClassList {
  constructor() { this._s = new Set(); }
  add(...c) { c.forEach((x) => this._s.add(x)); }
  remove(...c) { c.forEach((x) => this._s.delete(x)); }
  toggle(c, on) { const has = this._s.has(c); const want = on === undefined ? !has : !!on; want ? this._s.add(c) : this._s.delete(c); return want; }
  contains(c) { return this._s.has(c); }
  get value() { return [...this._s].join(' '); }
}

class StubElement {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.style = new Proxy({}, { get: (t, k) => t[k] ?? '', set: (t, k, v) => { t[k] = v; return true; } });
    this.dataset = {};
    this.classList = new StubClassList();
    this._attrs = {};
    this._text = '';
    this._listeners = {};
    this.hidden = false;
    this.width = 0; this.height = 0;
    this.isContentEditable = false;
  }
  get className() { return this.classList.value; }
  set className(v) { this.classList = new StubClassList(); String(v).split(/\s+/).filter(Boolean).forEach((c) => this.classList.add(c)); }
  get isConnected() {
    let n = this;
    while (n.parentElement) n = n.parentElement;
    return n === document.body || n === document.documentElement || n._isRoot === true;
  }
  get textContent() { return this._text; }
  set textContent(v) { this._text = String(v); this.children = []; }
  set innerHTML(v) { this._text = String(v); this.children = []; }
  get innerHTML() { return this._text; }
  get offsetWidth() { return 100; }
  setAttribute(k, v) { this._attrs[k] = String(v); if (k === 'class') this.className = v; }
  getAttribute(k) { return this._attrs[k] ?? null; }
  removeAttribute(k) { delete this._attrs[k]; }
  appendChild(n) { n.parentElement = this; this.children.push(n); return n; }
  removeChild(n) { this.children = this.children.filter((c) => c !== n); n.parentElement = null; }
  remove() { this.parentElement?.removeChild(this); }
  addEventListener(t, fn) { (this._listeners[t] ||= []).push(fn); }
  removeEventListener(t, fn) { this._listeners[t] = (this._listeners[t] || []).filter((f) => f !== fn); }
  dispatch(t, ev = {}) { (this._listeners[t] || []).forEach((fn) => fn({ type: t, target: this, preventDefault() {}, ...ev })); }
  click() { this.dispatch('click'); }
  getBoundingClientRect() { return { x: 0, y: 0, width: VIEWPORT.w, height: VIEWPORT.h, top: 0, left: 0 }; }
  getContext() { this._ctx ||= makeCtx(); this._ctx.canvas = this; return this._ctx; }
  querySelector(sel) { return findAll(this, sel)[0] || null; }
  querySelectorAll(sel) { return findAll(this, sel); }
  focus() {}
  toDataURL() { return 'data:,'; }
}

function matches(node, sel) {
  if (sel.startsWith('.')) return node.classList.contains(sel.slice(1));
  if (sel.startsWith('#')) return node._attrs.id === sel.slice(1) || node.id === sel.slice(1);
  return node.tagName === sel.toUpperCase();
}
function findAll(root, sel) {
  const out = [];
  const walk = (n) => { for (const c of n.children) { if (matches(c, sel)) out.push(c); walk(c); } };
  walk(root);
  out.forEach = Array.prototype.forEach.bind(out);
  return out;
}

export const VIEWPORT = { w: 1280, h: 720 };

const documentElement = new StubElement('html');
documentElement._isRoot = true;
const body = new StubElement('body');
documentElement.appendChild(body);

const byId = new Map();
function mk(tag, id) { const e = new StubElement(tag); e.id = id; e._attrs.id = id; byId.set(id, e); return e; }

const app = mk('div', 'app');
const canvas = mk('canvas', 'game-canvas');
const uiRoot = mk('div', 'ui-root');
const announcer = mk('div', 'ui-announcer');
app.appendChild(canvas); app.appendChild(uiRoot); app.appendChild(announcer);
body.appendChild(app);

const docListeners = {};
export const document = {
  documentElement, body,
  createElement: (t) => new StubElement(t),
  createTextNode: (t) => { const n = new StubElement('#text'); n._text = String(t); return n; },
  getElementById: (id) => byId.get(id) || null,
  querySelector: (sel) => findAll(documentElement, sel)[0] || null,
  querySelectorAll: (sel) => findAll(documentElement, sel),
  addEventListener: (t, fn) => { (docListeners[t] ||= []).push(fn); },
  removeEventListener: (t, fn) => { docListeners[t] = (docListeners[t] || []).filter((f) => f !== fn); },
  dispatch: (t, ev = {}) => (docListeners[t] || []).forEach((fn) => fn({ type: t, ...ev })),
  hidden: false
};

const store = new Map();
const winListeners = {};
export const window = {
  devicePixelRatio: 2,
  innerWidth: VIEWPORT.w,
  innerHeight: VIEWPORT.h,
  matchMedia: (q) => ({ matches: q.includes('coarse') ? false : false, addEventListener() {}, removeEventListener() {} }),
  addEventListener: (t, fn) => { (winListeners[t] ||= []).push(fn); },
  removeEventListener: (t, fn) => { winListeners[t] = (winListeners[t] || []).filter((f) => f !== fn); },
  dispatch: (t, ev = {}) => (winListeners[t] || []).forEach((fn) => fn({ type: t, preventDefault() {}, ...ev })),
  requestAnimationFrame: (fn) => setTimeout(() => fn(performance.now()), 0),
  cancelAnimationFrame: () => {},
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k)
  },
  visualViewport: null,
  AudioContext: null,
  webkitAudioContext: null
};

export function installGlobals() {
  globalThis.window = window;
  globalThis.document = document;
  globalThis.localStorage = window.localStorage;
  // Node 22 defines navigator as a getter-only global — redefine it.
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { maxTouchPoints: 0, hardwareConcurrency: 8, deviceMemory: 8, clipboard: { writeText: async () => {} } }
  });
  globalThis.matchMedia = window.matchMedia;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;
  globalThis.HTMLCanvasElement = StubElement;
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };
  globalThis.OffscreenCanvas = class {
    constructor(w, h) { this.width = w; this.height = h; }
    getContext() { this._c ||= makeCtx(); return this._c; }
  };
  globalThis.confirm = () => true;
}

export { canvas, uiRoot, app, announcer, StubElement };
