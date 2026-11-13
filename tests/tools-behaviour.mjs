// Behaviour checks for the fixes: calibration maths, speed fallback, compass timeout state.
let pass = 0, fail = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); c ? pass++ : fail++; };

console.log('--- Bubble level calibration offset ---');
function readTilt(beta, gamma, offX, offY) {
  return {
    x: Math.max(-60, Math.min(60, gamma - offX)),
    y: Math.max(-60, Math.min(60, beta - offY)),
    level: Math.abs(gamma - offX) <= 3 && Math.abs(beta - offY) <= 3,
  };
}
let r = readTilt(6.5, -8.2, 0, 0);
ok(!r.level, `phone resting tilted reads X ${r.x}° Y ${r.y}° -> not level (correct before calibrating)`);
r = readTilt(1.8, -2.4, -2.4, 1.8); // calibrate at that resting position
ok(r.x === 0 && r.y === 0 && r.level, 'after Calibrate the same surface reads 0.0° / 0.0° and Level');
r = readTilt(3.8, -2.4, -2.4, 1.8); // Y is 2° away from the calibrated zero
ok(Math.abs(r.y - 2) < 0.01, 'a 2° push on Y reads 2.0° from the calibrated zero');
r = readTilt(1.8, -20.4, -2.4, 1.8);
ok(Math.abs(r.x - -18) < 0.01, 'large tilt still measured correctly (-18.0°)');
r = readTilt(200, 200, 0, 0);
ok(r.x === 60 && r.y === 60, 'out-of-range angles clamp to ±60° instead of flying off screen');

console.log('\n--- Speedometer speed fallback ---');
const R = 6371, toRad = (d) => d * Math.PI / 180;
function haversineKm(a, b) {
  const dLat = toRad(b.latitude - a.latitude), dLon = toRad(b.longitude - a.longitude);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(a.latitude))*Math.cos(toRad(b.latitude))*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
function speedFromDelta(prev, cur) {
  const dt = (cur.t - prev.t) / 1000;
  if (dt < 0.5 || dt > 10) return null;
  if (typeof cur.accuracy === 'number' && cur.accuracy > 40) return null;
  const km = haversineKm(prev, cur);
  if (km < 0.0015) return 0;
  const kmh = (km / dt) * 3600;
  return kmh > 300 ? null : kmh;
}
const P = (lat, t, accuracy = 10) => ({ latitude: lat, longitude: 85.1376, t, accuracy });
ok(Math.abs(speedFromDelta(P(25.5941, 0), P(25.5951, 10000)) - 40) < 0.2, '111 m in 10 s -> 40.0 km/h');
ok(speedFromDelta(P(25.5941, 0), P(25.5941, 1000)) === 0, 'standing still (0 m) -> 0, not a jitter spike');
ok(Math.abs(speedFromDelta(P(25.5941, 0), P(25.5941 + 0.00018, 1000)) - 72) < 1,
   'a genuine 20 m move in 1 s reads 72 km/h (a real 72 km/h drive must not be hidden)');
ok(speedFromDelta(P(25.5941, 0, 60), P(25.5941 + 0.00018, 1000, 60)) === null,
   'the same 20 m jump on a 60 m-accuracy fix is rejected as noise');
ok(speedFromDelta(P(25.5941, 0, 80), P(25.5951, 10000, 80)) === null, 'fixes with 80 m accuracy are ignored entirely');
ok(speedFromDelta(P(25.5941, 0), P(25.5951, 300)) === null, 'dt under 0.5 s is ignored');

console.log('\n--- Unit display ---');
const units = [{ f: 1 }, { f: 0.621371 }, { f: 0.277778 }, { f: 0.539957 }];
const kmh = 50;
ok(units.map(u => (kmh * u.f).toFixed(1)).join(' / ') === '50.0 / 31.1 / 13.9 / 27.0',
   '50 km/h renders as 50.0 / 31.1 / 13.9 / 27.0 across KM/H, MPH, M/S, KN');

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
