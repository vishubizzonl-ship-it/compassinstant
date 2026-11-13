// Extracted verbatim from the site components, then checked against known values.
const KAABA = { lat: 21.4225, lng: 39.8262 };

function qiblaBearing(lat, lng) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const phi1 = toRad(lat), phi2 = toRad(KAABA.lat);
  const dLambda = toRad(KAABA.lng - lng);
  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function normalize(deg) { return ((deg % 360) + 360) % 360; }
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
function circularAverage(vals) {
  let sx = 0, sy = 0;
  for (const h of vals) { const r = (h * Math.PI) / 180; sx += Math.sin(r); sy += Math.cos(r); }
  return normalize((Math.atan2(sx, sy) * 180) / Math.PI);
}
const UNITS = [
  { label: 'KM/H', factor: 1 },
  { label: 'MPH', factor: 0.621371 },
  { label: 'M/S', factor: 0.277778 },
  { label: 'KN', factor: 0.539957 },
];

let pass = 0, fail = 0;
function check(name, got, want, tol = 0.35) {
  const ok = Math.abs(got - want) <= tol;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}: got ${typeof got === 'number' ? got.toFixed(2) : got}  expected ~${want}`);
  ok ? pass++ : fail++;
}

console.log('--- Qibla bearing (published values from IslamicFinder / halalgps) ---');
// city, lat, lng, published qibla bearing
const cities = [
  ['London',     51.5074,  -0.1278, 118.99],
  ['New York',   40.7128, -74.0060,  58.48],
  ['Paris',      48.8566,   2.3522, 119.16],
  ['Istanbul',   41.0082,  28.9784, 151.62],
  ['Jakarta',    -6.2088, 106.8456, 295.15],
  ['Karachi',    24.8607,  67.0011, 267.86],
  ['Delhi',      28.6139,  77.2090, 266.71],
  ['Patna',      25.5941,  85.1376, 274.28],
  ['Cape Town', -33.9249,  18.4241,  23.35],
  ['Tokyo',      35.6762, 139.6503, 293.02],
  ['Sydney',    -33.8688, 151.2093, 277.50],
  ['Riyadh',     24.7136,  46.6753, 243.80],
];
for (const [name, lat, lng, want] of cities) check(name, qiblaBearing(lat, lng), want, 0.6);

console.log('\n--- Qibla at the Kaaba itself (should be stable, not NaN) ---');
const atKaaba = qiblaBearing(KAABA.lat, KAABA.lng);
console.log('   bearing at Kaaba =', atKaaba.toFixed(2), Number.isFinite(atKaaba) ? '(finite, no NaN)' : '(NaN!)');

console.log('\n--- Compass normalisation ---');
check('normalize(-10)', normalize(-10), 350);
check('normalize(370)', normalize(370), 10);
check('normalize(720)', normalize(720), 0);
check('heading = 360 - alpha (alpha 0 => N)', normalize(360 - 0), 0);
check('heading = 360 - alpha (alpha 90 => W)', normalize(360 - 90), 270);
check('heading = 360 - alpha (alpha 270 => E)', normalize(360 - 270), 90);

console.log('\n--- Cardinal boundaries ---');
const cases = [[0,'N'],[22.4,'N'],[22.5,'NE'],[45,'NE'],[67.4,'NE'],[67.5,'E'],[90,'E'],[112.5,'SE'],
               [157.5,'S'],[180,'S'],[202.5,'SW'],[247.5,'W'],[292.5,'NW'],[337.5,'N'],[359.9,'N']];
for (const [deg, want] of cases) {
  const got = disha(deg);
  console.log(`${got === want ? 'PASS' : 'FAIL'}  disha(${deg}) = ${got} (want ${want})`);
  got === want ? pass++ : fail++;
}

console.log('\n--- Circular average across north (the 359/0 trap) ---');
check('avg([359,1])', circularAverage([359, 1]), 0, 0.01);
check('avg([350,10])', circularAverage([350, 10]), 0, 0.01);
check('avg([10,20,30])', circularAverage([10, 20, 30]), 20, 0.01);
check('avg([350,355,5])', circularAverage([350, 355, 5]), 356.67, 0.01);

console.log('\n--- Speed unit conversion ---');
const kmh = 100;
check('100 km/h -> mph', kmh * UNITS[1].factor, 62.14, 0.01);
check('100 km/h -> m/s', kmh * UNITS[2].factor, 27.78, 0.01);
check('100 km/h -> knots', kmh * UNITS[3].factor, 54.00, 0.01);
check('GPS m/s 27.7778 -> km/h', 27.7778 * 3.6, 100, 0.01);

console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
