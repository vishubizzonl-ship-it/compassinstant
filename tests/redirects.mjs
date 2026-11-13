/**
 * Redirect test — the server is started for real on a spare port and asked for
 * every URL that used to answer with Astro's blank meta-refresh stub.
 *
 * The bug this exists for: "/" served a stub page instead of a 301, so a phone
 * showed a white screen with one line of text.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 4398;
const BASE = `http://127.0.0.1:${PORT}`;

if (!existsSync('dist') || !existsSync('dist/index.html')) {
  console.log('SKIP redirect test — no dist/ (run npm run build first)');
  process.exit(0);
}

const server = spawn(process.execPath, ['serve-static.mjs'], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let log = '';
server.stdout.on('data', (d) => (log += d));
server.stderr.on('data', (d) => (log += d));

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  try {
    await fetch(BASE + '/', { redirect: 'manual' });
    up = true;
  } catch {
    await sleep(100);
  }
}
if (!up) {
  console.log('FAIL server did not start\n' + log);
  server.kill();
  process.exit(1);
}

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) {
    pass++;
    console.log(`PASS  ${name}`);
  } else {
    fail++;
    console.log(`FAIL  ${name} ${detail}`);
  }
}

/** The URL a browser would end up on, following our 301s. */
async function resolve(path) {
  let current = path;
  const hops = [];
  for (let i = 0; i < 5; i++) {
    const res = await fetch(BASE + current, { redirect: 'manual' });
    hops.push([current, res.status]);
    if (res.status !== 301 && res.status !== 308) {
      const body = await res.text();
      return { status: res.status, final: current, body, hops };
    }
    const loc = res.headers.get('location');
    if (!loc) return { status: res.status, final: current, body: '', hops, noLocation: true };
    current = loc;
  }
  return { status: 0, final: current, body: '', hops, loop: true };
}

// 1. The exact URL from the phone screenshot.
const root = await resolve('/');
check('GET / is a 301, not a stub page', root.hops[0][1] === 301, `got ${root.hops[0][1]}`);
check('GET / lands on the compass', root.final === '/onlinecompass/' && root.status === 200, `ended at ${root.final} (${root.status})`);
check('the compass page has real content', /<title>[^<]*Compass/i.test(root.body), 'title missing');
check('no meta-refresh stub reaches the browser', !/Redirecting from/i.test(root.body));

// 2. Locale roots and the retired site-wide pages.
for (const [from, want] of [
  ['/es/', '/es/onlinecompass/'],
  ['/de/', '/de/onlinecompass/'],
  ['/blog', '/onlinecompass/blog/'],
  ['/about', '/onlinecompass/about/'],
  ['/contact', '/onlinecompass/contact/'],
]) {
  const r = await resolve(from);
  check(`${from} -> ${want}`, r.final === want && r.status === 200, `ended at ${r.final} (${r.status})`);
}

// 3. Missing trailing slash is a 308, and the page still loads.
const slash = await fetch(BASE + '/onlineqibla', { redirect: 'manual' });
check('/onlineqibla is a 308 to /onlineqibla/', slash.status === 308 && slash.headers.get('location') === '/onlineqibla/', `got ${slash.status}`);

// 4. Every stub in the build output must be covered by the redirect table.
const { readdir } = await import('node:fs/promises');
const { readFile } = await import('node:fs/promises');
const { join } = await import('node:path');
const entries = await readdir('dist', { recursive: true, withFileTypes: true });
let stubs = 0;
let uncovered = 0;
for (const e of entries) {
  if (!e.isFile() || e.name !== 'index.html') continue;
  const full = join(e.parentPath ?? e.path, e.name);
  const html = await readFile(full, 'utf8');
  if (!/http-equiv=["']refresh["']/i.test(html)) continue;
  stubs++;
  const rel = '/' + full.slice(4).replace(/index\.html$/, '').replace(/\/$/, '');
  const res = await fetch(BASE + (rel === '/' ? '/' : rel), { redirect: 'manual' });
  if (res.status !== 301) {
    uncovered++;
    console.log(`FAIL  stub ${rel} answered ${res.status}, expected 301`);
  }
}
check(`all ${stubs} stubs answer 301`, uncovered === 0, `${uncovered} uncovered`);

// 5. Genuine pages are untouched, and real 404s stay 404.
const real = await fetch(BASE + '/onlinebubblelevel/', { redirect: 'manual' });
check('/onlinebubblelevel/ serves 200 directly', real.status === 200, `got ${real.status}`);
const notFound = await fetch(BASE + '/definitely-not-a-page/', { redirect: 'manual' });
check('unknown URL is a 404', notFound.status === 404, `got ${notFound.status}`);

server.kill();
console.log(`\n===== ${pass} passed, ${fail} failed =====`);
process.exit(fail ? 1 : 0);
