/**
 * Speedometer test — the built page's own script is executed against a fake GPS
 * and the big readout is inspected. The bug this guards against: a device lying
 * perfectly still kept showing a speed.
 */
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

if (!existsSync('dist/onlinespeedometer/index.html')) {
  console.log('SKIP speedometer test — no dist/ (run npm run build first)');
  process.exit(0);
}

const html = readFileSync('dist/onlinespeedometer/index.html', 'utf8');
let code = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  .filter((s) => s.includes('speed-display')).slice(-1)[0];
if (!code) {
  const src = html.match(/<script[^>]*src="(\/_astro\/SpeedometerPage[^"]+)"/)[1];
  code = readFileSync('dist' + src, 'utf8');
  console.log('bundle:', src.split('/').pop(), '(' + code.length + ' chars)');
}

const registry = new Map();
function el(id) {
  const e = { id, dataset: {}, style: {}, textContent: '0.0', innerHTML: '',
    classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    addEventListener(t, fn) { (this._ev ||= {})[t] = fn; }, removeEventListener() {},
    setAttribute() {}, getAttribute: () => null, contains: () => false,
    getBoundingClientRect: () => ({ width: 300, height: 300 }),
    querySelector: () => null, requestFullscreen() {} };
  registry.set(id, e); return e;
}
const document = { getElementById: (id) => registry.get(id) || el(id), addEventListener() {},
  querySelector: () => null, documentElement: el('html'), fullscreenElement: null, visibilityState: 'visible' };

let geoOk = null;
const navigator = { geolocation: { watchPosition(ok) { geoOk = ok; return 1; }, getCurrentPosition() {} } };
let intervals = [];
const win = {
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 0,
  setInterval: (f) => { intervals.push(f); return intervals.length; }, clearInterval() {},
  setTimeout: () => 0, matchMedia: () => ({ matches: false }),
  localStorage: { getItem: () => null, setItem() {} },
};
win.window = win;
const ctx = vm.createContext({ window: win, document, navigator, localStorage: win.localStorage,
  location: { pathname: '/' }, console, Math, Date, JSON, Number, String, Object, Array,
  parseFloat, parseInt, isNaN, isFinite, requestAnimationFrame: () => 0,
  setInterval: win.setInterval, clearInterval: () => {}, setTimeout: () => 0, clearTimeout: () => {} });
ctx.globalThis = ctx; win.location = ctx.location;
vm.runInContext(code, ctx, { timeout: 5000 });

const show = () => registry.get('speed-display').textContent;
const fix = (lat, lon, t, extra = {}) => ({
  coords: { latitude: lat, longitude: lon, accuracy: 8, altitude: null, speed: null, ...extra },
  timestamp: t,
});
// jitter: ±2 m wander around a fixed point (~0.00002 deg)
const jit = (i) => [(i % 2 ? 1 : -1) * 0.00002, (i % 3 ? 1 : -1) * 0.00002];

let clock = 1_000_000;
let pass = 0, fail = 0;
const check = (name, got, want) => {
  const ok = String(got) === String(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${got}${ok ? '' : `  expected ${want}`}`);
};

console.log('--- 1. Device sitting still, browser reports a noisy 0.3 m/s');
for (let i = 0; i < 6; i++) { geoOk(fix(25.5941, 85.1376, (clock += 1000), { speed: 0.3 })); }
check('still + noisy coords.speed', show(), '0.0');

console.log('--- 2. Device still, no coords.speed at all, GPS jitters by ~2 m per fix');
for (let i = 0; i < 12; i++) {
  const [dLat, dLon] = jit(i);
  geoOk(fix(25.5941 + dLat, 85.1376 + dLon, (clock += 1000)));
}
check('still + jitter, no reported speed', show(), '0.0');

console.log('--- 3. Real movement: 111 m per 10 s = 40 km/h');
geoOk(fix(25.5941, 85.1376, (clock += 1000)));
for (let i = 1; i <= 8; i++) geoOk(fix(25.5941 + i * 0.0001, 85.1376, (clock += 1000)));
const moving = parseFloat(show());
console.log('    (raw reading:', show(), ')');
check('moving 40 km/h (10% tolerance)', Math.abs(moving - 40) < 4, true);

console.log('--- 4. Tourist stops: no more usable fixes at all');
for (let i = 0; i < 5; i++) {
  intervals.forEach((f) => f());
  await new Promise((r) => setTimeout(r, 0));
}
// simulate the watchdog firing after HOLD_MS (now 5 s)
await new Promise((r) => setTimeout(r, 5400));
intervals.forEach((f) => f());
check('reading returns to 0 when fixes stop', show(), '0.0');

console.log('--- 5. Parked, fixes keep arriving but are too poor to use (accuracy 60 m)');
geoOk(fix(25.5942, 85.1376, (clock += 1000), { speed: 0.4, accuracy: 60 }));
check('poor fix does not invent a speed', show(), '0.0');

console.log('--- 6. Browser reports a real 10 m/s = 36 km/h');
geoOk(fix(25.5961, 85.1376, (clock += 1000), { speed: 10 }));
check('reported speed still works', show(), '36.0');

console.log('--- 7. It stops again with a reported 0 m/s');
geoOk(fix(25.5961, 85.1376, (clock += 1000), { speed: 0 }));
check('reported 0 m/s', show(), '0.0');

console.log('--- 8. Walking pace 5 km/h (1.39 m per second) with +/-1 m jitter');
for (let i = 0; i < 10; i++) {
  const j = (i % 2 ? 1 : -1) * 0.000009; // ~1 m
  geoOk(fix(25.5941 + i * 0.0000125 + j, 85.1376 + j, (clock += 1000)));
}
const walk = parseFloat(show());
check('walking is not flattened to zero', walk > 2, true);
check('walking reads close to 5 km/h', Math.abs(walk - 5) < 3, true);

console.log('--- 9. Stop, stay still, then drive off again');
geoOk(fix(25.5943, 85.1376, (clock += 1000), { speed: 0 }));
check('stopped', show(), '0.0');
for (let i = 0; i < 6; i++) geoOk(fix(25.5943, 85.1376, (clock += 1000), { speed: 0.2 }));
check('still still after six noisy fixes', show(), '0.0');
for (let i = 1; i <= 10; i++) geoOk(fix(25.5943 + i * 0.0002, 85.1376, (clock += 1000)));
const drive = parseFloat(show());
check('drives off again at ~80 km/h', Math.abs(drive - 80) < 8, true);

console.log('--- 10. Rough fix but a good Doppler speed (accuracy 55 m)');
geoOk(fix(25.5961, 85.1376, (clock += 1000), { speed: 15, accuracy: 55 }));
check('reported speed survives mediocre accuracy', show(), '54.0');

console.log('--- 11. Rough fix, no reported speed, real driving for 10 s');
geoOk(fix(25.5961, 85.1376, (clock += 1000), { accuracy: 55 }));
for (let i = 1; i <= 10; i++) geoOk(fix(25.5961 + i * 0.00045, 85.1376, (clock += 1000), { accuracy: 55 }));
const rough = parseFloat(show());
check('derived speed works from a long window on a rough fix', Math.abs(rough - 180) < 30, true);

console.log('--- 12. Standing still on a rough fix stays at zero');
for (let i = 0; i < 12; i++) {
  const j = (i % 2 ? 1 : -1) * 0.00003;
  geoOk(fix(25.6008 + j, 85.1376 + j, (clock += 1000), { accuracy: 55 }));
}
check('still device on a rough fix', show(), '0.0');

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
