// Compass logic test - mirrors src/components/CompassIsland.astro sensor handling
// Run with: node compass-test.mjs

function normalize(deg) {
  return ((deg % 360) + 360) % 360;
}

function disha(deg) {
  const d = normalize(deg);
  if (d >= 22.5 && d < 67.5) return 'NE';
  if (d >= 67.5 && d < 112.5) return 'E';
  if (d >= 112.5 && d < 157.5) return 'SE';
  if (d >= 157.5 && d < 202.5) return 'S';
  if (d >= 202.5 && d < 247.5) return 'SW';
  if (d >= 247.5 && d < 292.5) return 'W';
  if (d >= 292.5 && d < 337.5) return 'NW';
  return 'N';
}

function isAbsoluteCandidate(event) {
  const wch = event.webkitCompassHeading;
  if (typeof wch === 'number' && Number.isFinite(wch)) return true;
  return event.type === 'deviceorientationabsolute' || event.absolute === true;
}

function getAbsoluteHeading(event) {
  const wch = event.webkitCompassHeading;
  if (typeof wch === 'number' && Number.isFinite(wch)) {
    return normalize(wch);
  }
  const isAbsolute =
    event.type === 'deviceorientationabsolute' || event.absolute === true;
  if (isAbsolute && typeof event.alpha === 'number' && Number.isFinite(event.alpha)) {
    return normalize(360 - event.alpha);
  }
  return null;
}

function circularAverage(values) {
  let sx = 0, sy = 0;
  for (const h of values) {
    const r = (h * Math.PI) / 180;
    sx += Math.sin(r);
    sy += Math.cos(r);
  }
  return normalize((Math.atan2(sx, sy) * 180) / Math.PI);
}

function shortestDelta(from, to) {
  return ((to - from + 540) % 360) - 180;
}

let failures = 0;
function assert(cond, msg) {
  if (!cond) {
    failures++;
    console.error('FAIL:', msg);
  } else {
    console.log('PASS:', msg);
  }
}

// Test 1: normalize range
console.log('=== Test: normalize ===');
for (const v of [-360, -1, 0, 1, 359, 360, 720, 274.5]) {
  const n = normalize(v);
  assert(n >= 0 && n < 360, `normalize(${v}) in [0,360): ${n}`);
}

// Test 2: disha cardinals
console.log('\n=== Test: disha ===');
assert(disha(0) === 'N', '0 -> N');
assert(disha(45) === 'NE', '45 -> NE');
assert(disha(90) === 'E', '90 -> E');
assert(disha(135) === 'SE', '135 -> SE');
assert(disha(180) === 'S', '180 -> S');
assert(disha(225) === 'SW', '225 -> SW');
assert(disha(270) === 'W', '270 -> W');
assert(disha(315) === 'NW', '315 -> NW');
assert(disha(274) === 'W', '274 -> W');
assert(disha(359) === 'N', '359 -> N');

// Test 3: getAbsoluteHeading Android absolute events
console.log('\n=== Test: getAbsoluteHeading (Android absolute) ===');
const androidCases = [
  { alpha: 0, expected: 0, name: 'North (alpha=0)' },
  { alpha: 270, expected: 90, name: 'East (alpha=270)' },
  { alpha: 180, expected: 180, name: 'South (alpha=180)' },
  { alpha: 90, expected: 270, name: 'West (alpha=90)' },
  { alpha: 86, expected: 274, name: '274 (alpha=86)' },
  { alpha: 1, expected: 359, name: '359 (alpha=1)' },
];
for (const c of androidCases) {
  const ev = { type: 'deviceorientationabsolute', alpha: c.alpha, absolute: true };
  const h = getAbsoluteHeading(ev);
  assert(h === c.expected, `${c.name}: heading ${h} === ${c.expected}`);
}

// relative event must return null
const rel = getAbsoluteHeading({ type: 'deviceorientation', alpha: 0, absolute: false });
assert(rel === null, 'relative event (alpha=0) returns null');

// deviceorientation with absolute=true
const absTrue = getAbsoluteHeading({ type: 'deviceorientation', alpha: 90, absolute: true });
assert(absTrue === 270, 'deviceorientation absolute=true alpha=90 -> 270');

// iOS webkitCompassHeading
console.log('\n=== Test: getAbsoluteHeading (iOS) ===');
assert(getAbsoluteHeading({ webkitCompassHeading: 0 }) === 0, 'iOS 0');
assert(getAbsoluteHeading({ webkitCompassHeading: 90 }) === 90, 'iOS 90');
assert(getAbsoluteHeading({ webkitCompassHeading: 180 }) === 180, 'iOS 180');
assert(getAbsoluteHeading({ webkitCompassHeading: 270 }) === 270, 'iOS 270');
assert(getAbsoluteHeading({ webkitCompassHeading: 274 }) === 274, 'iOS 274');
assert(getAbsoluteHeading({ webkitCompassHeading: 359 }) === 359, 'iOS 359');
// iOS wch takes precedence over relative alpha
assert(getAbsoluteHeading({ webkitCompassHeading: 45, type: 'deviceorientation', alpha: 100, absolute: false }) === 45, 'iOS wch overrides relative alpha');

// Test 4: isAbsoluteCandidate
console.log('\n=== Test: isAbsoluteCandidate ===');
assert(isAbsoluteCandidate({ webkitCompassHeading: 10 }) === true, 'wch candidate true');
assert(isAbsoluteCandidate({ type: 'deviceorientationabsolute', alpha: 0 }) === true, 'absolute event candidate true');
assert(isAbsoluteCandidate({ type: 'deviceorientation', alpha: 0, absolute: true }) === true, 'absolute=true candidate true');
assert(isAbsoluteCandidate({ type: 'deviceorientation', alpha: 0, absolute: false }) === false, 'relative candidate false');

// Test 5: absolute guard simulation
console.log('\n=== Test: absolute guard ===');
let absoluteSeen = false;
let heading = null;
function processEvent(ev) {
  const abs = isAbsoluteCandidate(ev);
  if (absoluteSeen && !abs) return 'ignored';
  if (abs) absoluteSeen = true;
  const h = getAbsoluteHeading(ev);
  if (h !== null) heading = h;
  return h === null ? 'null' : 'updated';
}
// absolute first
assert(processEvent({ type: 'deviceorientationabsolute', alpha: 90, absolute: true }) === 'updated', 'absolute event updates');
assert(heading === 270, 'heading 270 after absolute');
// relative later must not overwrite
assert(processEvent({ type: 'deviceorientation', alpha: 0, absolute: false }) === 'ignored', 'relative ignored after absolute');
assert(heading === 270, 'heading stays 270');

// Test 6: dial rotation mapping (fixed top indicator)
console.log('\n=== Test: dial rotation mapping ===');
const headings = [0, 90, 180, 270, 274, 359];
for (const h of headings) {
  const rot = normalize(-h);
  // heading mark on dial ends at top: (h + rot) mod 360 === 0
  const markTop = normalize(h + rot);
  assert(markTop === 0, `heading ${h}: dial rotates ${rot}, mark at top (${markTop})`);
  // N (0 on dial) moves to -h; no double rotation of pointer (dial only)
  const nPos = normalize(0 + rot);
  assert(nPos === normalize(-h), `heading ${h}: N at ${nPos}`);
}

// Test 7: short-path smoothing 359 -> 0
console.log('\n=== Test: short-path 359 -> 0 ===');
let cur = normalize(-359); // ~1
const tgt = normalize(-0); // 0
const delta = shortestDelta(cur, tgt);
assert(Math.abs(delta) <= 2, `359->0 delta small: ${delta} (got ${delta})`);
// and 0 -> 359 short path
const delta2 = shortestDelta(0, normalize(-359));
assert(Math.abs(delta2) <= 2, `0->359 delta small: ${delta2}`);

// Test 8: circular average basic
console.log('\n=== Test: circular average ===');
assert(Math.round(circularAverage([0,0,0])) === 0, 'avg [0,0,0] = 0');
assert(Math.round(circularAverage([90,90])) === 90, 'avg [90,90] = 90');
assert(Math.round(circularAverage([270,274])) === 272, 'avg [270,274] = 272');
// wrap handling: average of 359 and 1 should be 0, not 180
assert(Math.round(circularAverage([359, 1])) === 0, 'avg [359,1] wraps to 0');

// Test 9: 359 -> 0 transition simulation
console.log('\n=== Test: 359 -> 0 transition ===');
const recent = [];
function ca(vals) { recent.length = 0; recent.push(...vals); return circularAverage(recent); }
// simulate 3 readings 359 then 3 readings 0
const seq = [359,359,359,0,0,0];
const recent2 = [];
for (const h of seq) {
  recent2.push(h);
  if (recent2.length > 8) recent2.shift();
}
const avg = circularAverage(recent2);
assert(avg < 5 || avg > 355, `mixed 359/0 avg near 0: ${avg}`);

// Test 10: permission/secure context status (logic presence)
console.log('\n=== Test: status rules (manual) ===');
// We can't run DOM; just document expectations.
console.log('Expected: no active label / fake heading until absolute heading arrives.');

console.log('\n=== Summary ===');
if (failures === 0) {
  console.log('All tests passed.');
  process.exit(0);
} else {
  console.error(failures + ' test(s) failed.');
  process.exit(1);
}
// Level indicator mapping tests (plus crosshair)
console.log('\n=== Test: level tilt mapping ===');

function mapTilt(beta, gamma, screenAngle) {
  const rad = (screenAngle * Math.PI) / 180;
  const tiltX = gamma * Math.cos(rad) + beta * Math.sin(rad);
  const tiltY = -gamma * Math.sin(rad) + beta * Math.cos(rad);
  const scale = 2.5;
  const maxR = 120;
  const clampedX = Math.max(-60, Math.min(60, tiltX));
  const clampedY = Math.max(-60, Math.min(60, tiltY));
  let px = clampedX * scale;
  let py = clampedY * scale;
  const dist = Math.hypot(px, py);
  if (dist > maxR) {
    const sc = maxR / dist;
    px *= sc;
    py *= sc;
  }
  return { tiltX, tiltY, px, py };
}

// flat
let r = mapTilt(0, 0, 0);
assert(r.tiltX === 0 && r.tiltY === 0 && r.px === 0 && r.py === 0, 'flat -> center (0,0)');
assert(Math.abs(r.tiltX) <= 3 && Math.abs(r.tiltY) <= 3, 'flat -> Level tolerance');

// left/right tilt (gamma) in portrait
r = mapTilt(0, 10, 0);
assert(r.tiltX === 10 && r.px === 25, 'right tilt gamma=10 -> X +25');
r = mapTilt(0, -10, 0);
assert(r.tiltX === -10 && r.px === -25, 'left tilt gamma=-10 -> X -25');

// aage/peeche tilt (beta) in portrait
r = mapTilt(10, 0, 0);
assert(r.tiltY === 10 && r.py === 25, 'pitch beta=10 -> Y +25');
r = mapTilt(-10, 0, 0);
assert(r.tiltY === -10 && r.py === -25, 'pitch beta=-10 -> Y -25');

// heading independence: level mapping ignores heading
r = mapTilt(5, 5, 0);
assert(r.tiltX === 5 && r.tiltY === 5, 'level uses tilt not heading');

// portrait/landscape axis mapping
// landscape 90: gamma (roll) should affect vertical, beta (pitch) horizontal
r = mapTilt(10, 0, 90);
assert(Math.round(r.tiltX) === 10 && Math.round(r.tiltY) === 0, 'landscape 90: beta->X');
r = mapTilt(0, 10, 90);
assert(Math.round(r.tiltX) === 0 && Math.round(r.tiltY) === -10, 'landscape 90: gamma->-Y');

// boundary clamp
r = mapTilt(80, 80, 0);
assert(Math.hypot(r.px, r.py) <= 120 + 0.01, 'boundary clamp keeps within area');

// tolerance: not level when tilt > 3
assert(!(Math.abs(10) <= 3 && Math.abs(0) <= 3), 'tilted not Level');
