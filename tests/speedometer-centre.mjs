/**
 * Centring test — the built speedometer script is executed against a stub DOM
 * whose measurements are fixed, and the inline styles it writes are checked.
 *
 * The point of the test: in fullscreen the space above the speedometer and the
 * space below it (the recorded list) must be equal, so the speedometer's own
 * centre lands exactly on the middle of the screen.
 */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

if (!existsSync('dist/onlinespeedometer/index.html')) {
  console.log('SKIP centring test — no dist/ (run npm run build first)');
  process.exit(0);
}

const html = readFileSync('dist/onlinespeedometer/index.html', 'utf8');
const src = html.match(/<script[^>]*src="(\/_astro\/SpeedometerPage[^"]+)"/)[1];
const code = readFileSync('dist' + src, 'utf8');

let CARD_H = 800; // mutable: the tall-screen case below changes it

function el(id, box = {}) {
  const e = {
    id,
    dataset: {},
    style: {},
    children: [],
    _rect: { top: 0, bottom: 0, left: 0, right: 0, width: 300, height: 300, ...box },
    _h: box.height || 0,
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener(t, fn) { (this._ev ||= {})[t] = fn; },
    removeEventListener() {},
    setAttribute() {},
    getAttribute: () => null,
    contains: () => false,
    append(...k) { this.children.push(...k); },
    getBoundingClientRect() { return this._rect; },
    get offsetHeight() { return this._h; },
    get clientHeight() { return this.id === 'speed-card' ? CARD_H : this._h; },
    querySelector: () => null,
    requestFullscreen() {},
  };
  return e;
}

// The real layout, as it looks on a phone: the card is 800 px tall, the title
// block starts at 16 px and the stats boxes end at 396 px.
const registry = new Map();
const card = el('speed-card');
registry.set('speed-card', card);
registry.set('speed-head', el('speed-head', { top: 16, bottom: 136, height: 120 }));
registry.set('speed-stats', el('speed-stats', { top: 250, bottom: 396, height: 146 }));
registry.set('records-in-card', el('records-in-card'));

const docHandlers = {};
const document = {
  getElementById(id) { return registry.get(id) || (registry.set(id, el(id)), registry.get(id)); },
  createElement: () => el('li'),
  addEventListener(t, fn) { (docHandlers[t] ||= []).push(fn); },
  querySelector: () => null,
  documentElement: el('html'),
  fullscreenElement: null,
  visibilityState: 'visible',
};
const win = {
  addEventListener() {},
  removeEventListener() {},
  requestAnimationFrame: (f) => f(),
  setInterval: () => 1,
  clearInterval() {},
  setTimeout: () => 0,
  matchMedia: () => ({ matches: false }),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { pathname: '/' },
};
win.window = win;

const ctx = vm.createContext({
  window: win,
  document,
  localStorage: win.localStorage,
  navigator: { geolocation: { watchPosition() { return 1; } } },
  location: win.location,
  requestAnimationFrame: win.requestAnimationFrame,
  setInterval: win.setInterval,
  clearInterval: () => {},
  setTimeout: () => 0,
  clearTimeout: () => {},
  console,
  Math,
  Date,
  JSON,
  Number,
  String,
  Object,
  Array,
  parseFloat,
  parseInt,
  isNaN,
  isFinite,
});
ctx.globalThis = ctx;
vm.runInContext(code, ctx, { timeout: 5000 });

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : '  ' + detail}`);
};

const head = registry.get('speed-head');
const panel = registry.get('records-in-card');

console.log('--- not fullscreen: the script must not touch anything');
check('no margin written outside fullscreen', !head.style.marginTop, `got ${head.style.marginTop}`);
check('no height written outside fullscreen', !panel.style.height, `got ${panel.style.height}`);

console.log('\n--- entering fullscreen');
document.fullscreenElement = card;
(docHandlers.fullscreenchange || []).forEach((fn) => fn());

const marginTop = parseFloat(head.style.marginTop || '0');
const panelHeight = parseFloat(panel.style.height || '0');
const blockHeight = 396 - 16; // title top to stats bottom
const blockTop = 16 + marginTop;
const blockBottom = blockTop + blockHeight;
// measure against the card's content box: the card has 16 px padding top+bottom
const gapAbove = blockTop - 16;
const gapBelow = CARD_H - 16 - blockBottom;

check('a gap was written above the speedometer', marginTop > 0, `marginTop=${marginTop}`);
check('a height was written for the list', panelHeight > 0, `height=${panelHeight}`);
check(
  'the space above equals the space below',
  Math.abs(gapAbove - gapBelow) <= 1,
  `above=${gapAbove} below=${gapBelow}`,
);
check(
  "the speedometer's centre is the middle of the screen",
  Math.abs(blockTop + blockHeight / 2 - CARD_H / 2) <= 1,
  `centre=${blockTop + blockHeight / 2} expected=${CARD_H / 2}`,
);
check(
  'the list fills the remaining space exactly',
  Math.abs(panelHeight - gapBelow) <= 1,
  `list=${panelHeight} space=${gapBelow}`,
);
check('the list cannot reach the speedometer', blockBottom + panelHeight <= CARD_H - 15, 'overlaps');
check('the list starts right under the stats boxes', blockBottom <= blockTop + blockHeight + 1, 'gap');

console.log('\n--- a tall screen: still centred');
CARD_H = 1400;
(docHandlers.fullscreenchange || []).forEach((fn) => fn());
const m2 = parseFloat(head.style.marginTop || '0');
const top2 = 16 + m2;
check(
  'centre holds on a 1400 px screen',
  Math.abs(top2 + blockHeight / 2 - CARD_H / 2) <= 1,
  `centre=${top2 + blockHeight / 2} expected ${CARD_H / 2}`,
);
check(
  'the list grew with the screen',
  parseFloat(panel.style.height) > panelHeight,
  `height=${panel.style.height}`,
);
CARD_H = 800;

console.log('\n--- leaving fullscreen clears the inline styles');
document.fullscreenElement = null;
(docHandlers.fullscreenchange || []).forEach((fn) => fn());
check('margin cleared', !head.style.marginTop, `got ${head.style.marginTop}`);
check('height cleared', !panel.style.height, `got ${panel.style.height}`);

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
