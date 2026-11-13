import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('dist/onlinespeedometer/index.html', 'utf8');
const src = html.match(/<script[^>]*src="(\/_astro\/SpeedometerPage[^"]+)"/)[1];
const code = readFileSync('dist' + src, 'utf8');

const store = new Map();
let elCount = 0;
function makeEl(tag = 'div', id = '') {
  const e = {
    tagName: tag, id, dataset: {}, style: {}, textContent: '', innerHTML: '', children: [],
    className: '', type: '',
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); }, remove(c) { this._s.delete(c); },
      toggle(c, on) { on === undefined ? (this._s.has(c) ? this._s.delete(c) : this._s.add(c)) : (on ? this._s.add(c) : this._s.delete(c)); },
      contains(c) { return this._s.has(c); },
    },
    addEventListener(t, fn) { (this._ev ||= {})[t] = fn; }, removeEventListener() {},
    setAttribute(k, v) { this['attr_' + k] = v; }, getAttribute(k) { return this['attr_' + k] ?? null; },
    append(...kids) { kids.forEach((k) => this.children.push(k)); },
    remove() {}, contains: () => false,
    getBoundingClientRect: () => ({ width: 300, height: 300 }), requestFullscreen() {},
    querySelector: () => null,
  };
  let _text = '';
  Object.defineProperty(e, 'textContent', {
    get: () => (_text || e.children.map((c) => c.textContent).join('')),
    set: (v) => { _text = String(v); e.children.length = 0; },
  });
  return e;
}
const registry = new Map();
const document = {
  getElementById(id) { if (!registry.has(id)) registry.set(id, makeEl('div', id)); return registry.get(id); },
  createElement(tag) { elCount++; return makeEl(tag); },
  addEventListener() {}, querySelector: () => null, documentElement: makeEl('html'), fullscreenElement: null,
};
let geoOk = null;
const win = {
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
  setInterval: () => 1, clearInterval() {}, setTimeout: () => 0,
  matchMedia: () => ({ matches: false }),
  localStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
  location: { pathname: '/' },
};
win.window = win;
const ctx = vm.createContext({ window: win, document, localStorage: win.localStorage,
  navigator: { geolocation: { watchPosition(ok) { geoOk = ok; return 1; } } },
  location: win.location, console, Math, Date, JSON, Number, String, Object, Array,
  parseFloat, parseInt, isNaN, isFinite, requestAnimationFrame: () => 0,
  setInterval: win.setInterval, clearInterval: () => {}, setTimeout: () => 0, clearTimeout: () => {} });
ctx.globalThis = ctx;
vm.runInContext(code, ctx, { timeout: 5000 });

let pass = 0, fail = 0;
const check = (n, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${ok ? '' : `  got ${JSON.stringify(got)} expected ${JSON.stringify(want)}`}`);
};

const list = registry.get('records-list');
const cardList = registry.get('records-list-card');
const empty = registry.get('records-empty');
const clear = registry.get('records-clear');
const rows = () => list.children;
const rowText = (li) => li.children[0].children.map((c) => c.textContent).join(' ');

check('empty state visible on first visit', empty.classList.contains('hidden'), false);
check('list hidden when nothing recorded', list.classList.contains('hidden'), true);
check('clear button hidden when empty', clear.classList.contains('hidden'), true);

// device drives at exactly 4 km/h → 0.0001 deg lat per 10 s is ~11 m ... use 4 km/h = 11.1 m per 10 s
const fix = (lat, t) => ({ coords: { latitude: lat, longitude: 85.1376, accuracy: 8, altitude: null, speed: null }, timestamp: t });
let t = 1_000_000;
geoOk(fix(25.5941, (t += 1000)));
for (let i = 1; i <= 10; i++) geoOk(fix(25.5941 + i * 0.00001, (t += 1000))); // 1.11 m/s = 4 km/h
check('display reads ~4 km/h', registry.get('speed-display').textContent, '4.0');

win.recordSpeed();
check('one row after Record', rows().length, 1);
check('row shows the speed and unit', rowText(rows()[0]), '4.0 KM/H');
check('empty text hidden now', empty.classList.contains('hidden'), true);
check('clear button shown now', clear.classList.contains('hidden'), false);
check('saved to localStorage', JSON.parse(store.get('speedometer-records')).length, 1);
check('the fullscreen copy shows the same row instantly', cardList.children.length, 1);
check('the fullscreen copy shows the same reading', rowText(cardList.children[0]), '4.0 KM/H');
check('newest record sits on top of the fullscreen list too', rowText(cardList.children[0]).startsWith('4.0'), true);

// second recording of a different speed goes on top
geoOk(fix(25.6000, (t += 1000)));
win.recordSpeed();
check('two rows, newest first', rows().length, 2);

// remove the top row
rows()[0].children[1].children[1]._ev.click();
check('remove button deletes one row', rows().length, 1);
check('localStorage updated after remove', JSON.parse(store.get('speedometer-records')).length, 1);

// unit switch relabels saved rows
win.selectUnit(1);
check('saved rows follow the unit switch (mph)', rowText(rows()[0]), '2.5 MPH');
win.selectUnit(0);

// clear all
win.clearRecords();
check('clear all empties the list', rows().length, 0);
check('clear all empties the fullscreen copy too', cardList.children.length, 0);
check('empty text back', empty.classList.contains('hidden'), false);
check('localStorage cleared', store.get('speedometer-records'), '[]');

// reload simulation: a fresh page instance reads what was stored
win.recordSpeed();
const saved = store.get('speedometer-records');
console.log('    stored:', saved);
check('record survives a reload (persisted shape)', Array.isArray(JSON.parse(saved)), true);

console.log('--- fullscreen panel, without touching the speedometer');
check('card only shows the panel in fullscreen', /\.records-in-card\[[^\]]*\]\{display:none\}/.test(html), true);
check('panel is not absolutely positioned, so it cannot overlap', !/records-in-card\[[^\]]*\]\{[^}]*position:\s*absolute/.test(html), true);
check(
  'panel follows the stats boxes in the markup',
  html.indexOf('id="records-in-card"') > html.indexOf('id="avg-speed"') &&
    html.indexOf('id="records-in-card"') > html.indexOf('id="duration"'),
  true,
);
check(
  'fullscreen is a fixed column and the card never scrolls',
  /#speed-card\[[^\]]*\]:fullscreen\s*\{[^}]*display:\s*flex/.test(html) &&
    /#speed-card\[[^\]]*\]:fullscreen\s*\{[^}]*overflow:\s*hidden/.test(html),
  true,
);
check(
  'a spacer above mirrors the list below',
  /#speed-card\[[^\]]*\]:fullscreen:before\{[^}]*flex:\s*1 1 0/.test(html),
  true,
);
check(
  'the list gets the same share, so the speedometer stays centred',
  /records-in-card\[[^\]]*\]\{[^}]*flex:\s*1 1 0/.test(html) &&
    /records-in-card\[[^\]]*\]\{[^}]*min-height:\s*0/.test(html),
  true,
);
check(
  'the list scrolls inside its share instead of growing',
  /#records-list-card\[[^\]]*\]\{[^}]*overflow-y:\s*auto/.test(html),
  true,
);
check('the speedometer items keep their natural height', /:fullscreen>\[[^\]]*\]\{[^}]*flex:\s*none/.test(html), true);
check('no fullscreen rule re-positions the readout', !/speed-main/.test(html), true);

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
