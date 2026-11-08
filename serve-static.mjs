// Minimal static server for the built Astro site.
// Serves dist/ at the root, strips the /onlinecompass base prefix,
// and falls back to index.html for unknown routes.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT || 4321);
const ROOT = new URL('./dist/', import.meta.url).pathname;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json; charset=utf-8',
};

async function tryFile(path) {
  try {
    const s = await stat(path);
    if (s.isFile()) return path;
    if (s.isDirectory()) {
      const idx = join(path, 'index.html');
      const s2 = await stat(idx);
      if (s2.isFile()) return idx;
    }
  } catch {}
  return null;
}

const server = createServer(async (req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Strip the deploy-time base prefix.
  urlPath = urlPath.replace(/^\/onlinecompass(?=\/|$)/, '') || '/';

  // Path traversal guard.
  const safe = normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
  let file = await tryFile(join(ROOT, safe));

  if (!file) file = await tryFile(join(ROOT, safe + '.html'));
  if (!file) file = await tryFile(join(ROOT, safe, 'index.html'));
  if (!file) file = await tryFile(join(ROOT, '404.html'));
  if (!file) file = await tryFile(join(ROOT, 'index.html'));

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }

  try {
    const body = await readFile(file);
    res.writeHead(200, {
      'content-type': TYPES[extname(file)] || 'application/octet-stream',
      'cache-control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end('Internal error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Serving on 0.0.0.0:${PORT}`);
});
