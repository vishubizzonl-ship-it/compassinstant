import { createServer } from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const P = +process.env.PORT || 4321;
const R = new URL('./dist/', import.meta.url).pathname;
const ROOT = new URL('./', import.meta.url).pathname;

const T = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.woff2': 'font/woff2',
};

/**
 * Real 301 redirects, read from vercel.json so localhost behaves exactly like
 * production. Astro also writes a meta-refresh stub for every redirect entry,
 * but nothing should ever see it: a browser that ignores the meta refresh shows
 * a blank white page — which is exactly what "/" looked like on a phone.
 */
async function loadRedirects() {
  try {
    const cfg = JSON.parse(await readFile(join(ROOT, 'vercel.json'), 'utf8'));
    const map = new Map();
    for (const r of cfg.redirects || []) {
      map.set(r.source.replace(/\/$/, '') || '/', r.destination);
    }
    return map;
  } catch {
    return new Map();
  }
}

/**
 * Astro emits a meta-refresh stub for every redirect it knows about. We never
 * want a browser to *see* one, so the stubs in the build output are turned into
 * real 301s as well. This keeps localhost correct even if vercel.json drifts.
 */
async function loadStubs() {
  const map = new Map();
  let entries = [];
  try {
    entries = await readdir(R, { recursive: true, withFileTypes: true });
  } catch {
    return map;
  }
  for (const e of entries) {
    if (!e.isFile() || e.name !== 'index.html') continue;
    const dir = e.parentPath ?? e.path;
    const full = join(dir, e.name);
    let html;
    try {
      html = await readFile(full, 'utf8');
    } catch {
      continue;
    }
    const m = html.match(/http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)/i);
    if (!m) continue;
    const rel = full.slice(R.length).replace(/index\.html$/, '');
    map.set('/' + rel.replace(/\/$/, ''), m[1].replace(/^\/+/, '/'));
  }
  return map;
}

const stubs = await loadStubs();
const redirects = new Map([...stubs, ...(await loadRedirects())]);

async function f(p) {
  try {
    const s = await stat(p);
    if (s.isFile()) return p;
    if (s.isDirectory()) {
      const i = join(p, 'index.html');
      if ((await stat(i)).isFile()) return i;
    }
  } catch {}
  return null;
}

createServer(async (q, r) => {
  const raw = decodeURIComponent((q.url || '/').split('?')[0]) || '/';
  const u = normalize(raw);

  // 301 for the retired landing page and the old site-wide pages.
  const key = u.length > 1 ? u.replace(/\/$/, '') : '/';
  const target = redirects.get(key);
  if (target) {
    r.writeHead(301, { location: target, 'cache-control': 'no-cache' });
    return r.end();
  }

  // /onlineqibla -> /onlineqibla/  (matches trailingSlash: 'always' on Vercel)
  if (u !== '/' && !u.endsWith('/') && !extname(u)) {
    const dir = await f(join(R, u));
    if (dir && dir.endsWith('index.html')) {
      r.writeHead(308, { location: u + '/', 'cache-control': 'no-cache' });
      return r.end();
    }
  }

  let x = await f(join(R, u));
  if (!x) x = await f(join(R, u.replace(/\/$/, '') + '.html'));

  // Last line of defence: never hand a meta-refresh stub to a browser.
  if (x && x.endsWith('index.html') && x.slice(R.length).split('/').length <= 3) {
    const html = await readFile(x, 'utf8');
    const m = html.match(/http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>\s]+)/i);
    if (m) {
      r.writeHead(301, { location: m[1], 'cache-control': 'no-cache' });
      return r.end();
    }
  }

  let c = 200;
  if (!x) {
    x = await f(join(R, '404.html'));
    c = 404;
  }
  if (!x) {
    r.writeHead(404);
    return r.end('404');
  }

  r.writeHead(c, {
    'content-type': T[extname(x)] || 'application/octet-stream',
    'cache-control':
      x.includes('/fonts/') || x.includes('/_astro/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'strict-origin-when-cross-origin',
  });
  r.end(await readFile(x));
}).listen(P, '0.0.0.0', () => {
  console.log('Serving ' + P + ' (' + redirects.size + ' redirects)');
});
