/**
 * Site integrity test — the checks that catch "it looked done but wasn't".
 *
 * Every assertion here is about the BUILT site, not the source, so a page that
 * silently stopped rendering, a link to a page that no longer exists, or a
 * locale page that lost its <html lang> fails immediately.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://instanten.com';
const LOCALES = ['es', 'ja', 'fr', 'de', 'pt', 'ko', 'it'];
const LANGS = ['en', ...LOCALES];

let pass = 0;
let fail = 0;
function check(name, ok, detail = '') {
  if (ok) pass++;
  else {
    fail++;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

if (!existsSync('dist') || !existsSync('dist/index.html')) {
  console.log('SKIP site integrity test — no dist/ (run npm run build first)');
  process.exit(0);
}

/** Every index.html under dist/, as paths relative to dist/. */
function walk(dir = 'dist', out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (entry === 'index.html') out.push(full);
  }
  return out;
}

const pages = walk();
const read = (file) => readFileSync(file, 'utf8');

/** Map an internal href to the file the static server would serve. */
function hrefToFile(href) {
  const clean = href.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) return null;
  let path = join('dist', decodeURIComponent(clean));
  if (clean.endsWith('/')) path = join(path, 'index.html');
  if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
  return path;
}

// --- 1. no internal link points at a page that was not built
const broken = new Map();
for (const page of pages) {
  for (const match of read(page).matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http')) continue;
    const file = hrefToFile(href);
    if (file && !existsSync(file)) {
      if (!broken.has(href)) broken.set(href, []);
      if (broken.get(href).length < 3) broken.get(href).push(page);
    }
  }
}
check(
  'no broken internal links',
  broken.size === 0,
  [...broken.keys()].slice(0, 6).join(', '),
);

// --- 2. every sitemap URL resolves to a built page
const sitemap = read('dist/sitemap-0.xml');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check('sitemap is not empty', locs.length > 0);
const unresolved = locs.filter((url) => {
  const file = hrefToFile(url.replace(SITE, ''));
  return !file || !existsSync(file);
});
check('every sitemap URL is a real page', unresolved.length === 0, unresolved.slice(0, 5).join(', '));

// --- 3. <html lang> matches the URL prefix on every real page
//     (the 48 redirect stubs carry no <html> at all — they are meta-refresh only)
const langMismatch = [];
let realPages = 0;
for (const page of pages) {
  const html = read(page);
  const match = html.match(/<html lang="([^"]+)"/);
  if (!match) {
    check(`${page} without <html> is a redirect stub`, html.includes('http-equiv="refresh"'), page);
    continue;
  }
  realPages++;
  const rel = page.replace(/^dist\//, '');
  const first = rel.split('/')[0];
  const expected = LOCALES.includes(first) ? first : 'en';
  if (match[1] !== expected) langMismatch.push(`${rel} has ${match[1]}, expected ${expected}`);
}
check('118 real pages built', realPages >= 118, String(realPages));
check('every page has the right <html lang>', langMismatch.length === 0, langMismatch.slice(0, 4).join(' | '));

// --- 4. language switcher never points at a missing page
const switchBroken = [];
for (const page of pages) {
  const html = read(page);
  for (const match of html.matchAll(/<a[^>]*href="([^"]+)"[^>]*hreflang="([^"]+)"/g)) {
    const file = hrefToFile(match[1]);
    if (!file || !existsSync(file)) switchBroken.push(`${page} → ${match[1]}`);
  }
}
check('language switcher targets all exist', switchBroken.length === 0, switchBroken.slice(0, 4).join(' | '));

// --- 5. translation tables are complete: no locale is missing an English key
const ui = read('src/i18n/ui.ts');
function parseRegion(startMarker, endMarker) {
  const start = ui.indexOf(startMarker);
  const region = ui.slice(start, ui.indexOf(endMarker, start));
  const heads = [...region.matchAll(/\n  (en|es|ja|fr|de|pt|ko|it): \{/g)];
  const out = {};
  heads.forEach((head, i) => {
    const stop = i + 1 < heads.length ? heads[i + 1].index : region.length;
    out[head[1]] = Object.fromEntries(
      [...region.slice(head.index, stop).matchAll(/"([^"]+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => [m[1], m[2]]),
    );
  });
  return out;
}
const baseUI = parseRegion('const baseUI = {', 'const extraUI = {');
const extraUI = parseRegion('const extraUI = {', 'export const ui = {');
const merged = Object.fromEntries(
  LANGS.map((lang) => [lang, { ...(baseUI[lang] ?? {}), ...(extraUI[lang] ?? {}) }]),
);
const englishKeys = Object.keys(merged.en);
check('English UI has keys', englishKeys.length > 100, String(englishKeys.length));
for (const lang of LOCALES) {
  const missing = englishKeys.filter((key) => !(key in merged[lang]));
  check(`${lang} UI has every English key`, missing.length === 0, missing.slice(0, 5).join(', '));
}

// --- 6. every silo support page carries real prose, not an empty shell
// Minimum number of real paragraphs on each silo page. Terms is 11 because two
// of its sections are a single sentence plus a bullet list.
const prose = [
  ['about', 5],
  ['privacy', 15],
  ['terms', 11],
  ['contact', 1],
  ['blog', 3],
];
const CJK = /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/;
for (const lang of LANGS) {
  for (const [page, minimum] of prose) {
    const file = lang === 'en' ? `dist/onlinecompass/${page}/index.html` : `dist/${lang}/onlinecompass/${page}/index.html`;
    if (!existsSync(file)) {
      check(`${lang}/${page} exists`, false, file);
      continue;
    }
    const html = read(file);
    const body = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    const paragraphs = [...body.matchAll(/<p [^>]*>([\s\S]*?)<\/p>/g)]
      .map((m) => m[1].replace(/<[^>]+>/g, '').trim())
      // Japanese, Chinese and Korean have no spaces between words, so a
      // whitespace word count would score a full sentence as one "word".
      .filter((text) => text.split(/\s+/).length >= 4 || (CJK.test(text) && text.length >= 12));
    check(`${lang}/${page} has prose`, paragraphs.length >= minimum, `${paragraphs.length} paragraphs`);
  }
}

console.log(`site integrity test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
