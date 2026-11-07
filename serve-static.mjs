import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';

const ROOT = '/home/user/compassinstant/dist';
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml',
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.startsWith('/onlinecompass')) p = p.slice('/onlinecompass'.length) || '/';
    if (p.endsWith('/')) p += 'index.html';
    let file = normalize(join(ROOT, p));
    if (!file.startsWith(ROOT)) throw new Error('bad path');
    let data;
    try { data = await readFile(file); }
    catch { data = await readFile(join(ROOT, 'index.html')); res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(data); }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    res.end(data);
  } catch (e) { res.writeHead(500); res.end('error'); }
}).listen(4321, '0.0.0.0', () => console.log('Serving on 0.0.0.0:4321'));
