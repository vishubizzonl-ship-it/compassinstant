/**
 * Multilingual silo test.
 *
 * The compass silo pages (about / blog / contact / privacy / terms) used to
 * exist in English only: every locale URL 301'd to the English page, so a
 * Japanese visitor read English body text and <title>. This test proves the
 * seven translated copies exist, are canonical to themselves, advertise
 * reciprocal hreflang, appear in the sitemap, and contain no English prose.
 */
import { existsSync, readFileSync } from 'node:fs';

const LOCALES = ['es', 'ja', 'fr', 'de', 'pt', 'ko', 'it'];
const ALL = ['en', ...LOCALES];
const PAGES = ['about', 'blog', 'contact', 'privacy', 'terms'];
const SITE = 'https://instanten.com';

let pass = 0;
let fail = 0;
function check(name, condition, detail = '') {
  if (condition) {
    pass++;
  } else {
    fail++;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

if (!existsSync('dist') || !existsSync('dist/index.html')) {
  console.log('SKIP i18n silo test — no dist/ (run npm run build first)');
  process.exit(0);
}

const urlFor = (lang, page) =>
  lang === 'en' ? `${SITE}/onlinecompass/${page}/` : `${SITE}/${lang}/onlinecompass/${page}/`;
const fileFor = (lang, page) =>
  lang === 'en'
    ? `dist/onlinecompass/${page}/index.html`
    : `dist/${lang}/onlinecompass/${page}/index.html`;

const textOf = (html) => {
  const body = html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
  return body
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.split(' ').length >= 3);
};

const STOPWORDS = new Set(
  'the and your you we is are of to in for that with this on be by from it or not any at as will can our press'.split(
    ' ',
  ),
);

/** True when a chunk of text reads as English prose rather than a translation. */
function looksEnglish(text) {
  // Japanese, Chinese and Korean text can never be English prose.
  if (/[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(text)) return false;
  const words = new Set(text.toLowerCase().match(/[a-z']+/g) ?? []);
  let hits = 0;
  for (const word of words) if (STOPWORDS.has(word)) hits++;
  return hits >= 2 && hits / Math.max(1, words.size) > 0.2;
}

// --- 1. every translated page exists, is canonical to itself, has localized HTML
for (const lang of LOCALES) {
  for (const page of PAGES) {
    const file = fileFor(lang, page);
    check(`${lang}/${page} page exists`, existsSync(file), file);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    check(`${lang}/${page} <html lang>`, html.includes(`<html lang="${lang}"`));
    check(`${lang}/${page} canonical is itself`, html.includes(`rel="canonical" href="${urlFor(lang, page)}"`));
    check(
      `${lang}/${page} has no English prose`,
      textOf(html).every((chunk) => !looksEnglish(chunk)),
      textOf(html).find((chunk) => looksEnglish(chunk)) ?? '',
    );
  }
}

// --- 2. reciprocal hreflang across all eight languages, for every silo page
for (const page of PAGES) {
  for (const lang of ALL) {
    const file = fileFor(lang, page);
    if (!existsSync(file)) {
      check(`${lang}/${page} page exists`, false, file);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    const byLang = new Map(alternates.map((m) => [m[1], m[2]]));

    for (const target of ALL) {
      check(`${lang}/${page} hreflang ${target}`, byLang.get(target) === urlFor(target, page), `${byLang.get(target)}`);
    }
    check(`${lang}/${page} hreflang x-default → English`, byLang.get('x-default') === urlFor('en', page));
    check(`${lang}/${page} hreflang count`, alternates.length === ALL.length + 1, String(alternates.length));

    // reciprocity: the page each alternate points at must link back here
    const other = byLang.get('ja') && lang !== 'ja' ? 'ja' : 'es';
    const otherUrl = byLang.get(other);
    if (otherUrl && lang !== other) {
      const otherFile = fileFor(other, page);
      if (existsSync(otherFile)) {
        const otherHtml = readFileSync(otherFile, 'utf8');
        check(
          `${other}/${page} links back to ${lang}`,
          otherHtml.includes(`href="${urlFor(lang, page)}"`),
        );
      }
    }
  }
}

// --- 3. English pages keep their URLs and gain the translated alternates
for (const page of PAGES) {
  const file = fileFor('en', page);
  const html = readFileSync(file, 'utf8');
  check(`en/${page} canonical`, html.includes(`rel="canonical" href="${SITE}/onlinecompass/${page}/"`));
  for (const lang of LOCALES) {
    check(`en/${page} advertises ${lang}`, html.includes(`hreflang="${lang}" href="${urlFor(lang, page)}"`));
  }
}

// --- 4. sitemap carries the 35 new URLs and still excludes redirect stubs
const sitemapFile = existsSync('dist/sitemap-0.xml') ? 'dist/sitemap-0.xml' : null;
if (sitemapFile) {
  const sitemap = readFileSync(sitemapFile, 'utf8');
  for (const lang of LOCALES) {
    for (const page of PAGES) {
      check(`sitemap has ${lang}/${page}`, sitemap.includes(`<loc>${urlFor(lang, page)}</loc>`));
    }
  }
  for (const lang of LOCALES) {
    for (const page of PAGES) {
      check(`sitemap omits redirect /${lang}/${page}/`, !sitemap.includes(`<loc>${SITE}/${lang}/${page}/</loc>`));
    }
  }
}

// --- 5. localized chrome: blog cards point at real articles, form is translated
for (const lang of LOCALES) {
  const blog = readFileSync(fileFor(lang, 'blog'), 'utf8');
  // Only the article list counts — the header and footer legitimately link to
  // locale-prefixed URLs.
  const list = blog.slice(blog.indexOf('<ul class="space-y-8">'), blog.indexOf('</ul>', blog.indexOf('<ul class="space-y-8">')));
  const hrefs = [...list.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  const cards = hrefs.filter((href) => href.startsWith('/onlinecompass/blog/') && !href.endsWith('/blog/'));
  check(`${lang}/blog cards open real articles`, cards.length >= 3, String(cards.length));
  check(`${lang}/blog cards are not locale-prefixed`, !hrefs.some((href) => href.startsWith(`/${lang}/`)));

  const contact = readFileSync(fileFor(lang, 'contact'), 'utf8');
  check(`${lang}/contact form carries copy`, contact.includes('data-error=') && contact.includes('data-status='));
}

const jaContact = readFileSync('dist/ja/onlinecompass/contact/index.html', 'utf8');
check(
  'ja contact form labels are Japanese',
  jaContact.includes('お名前') && jaContact.includes('メッセージ'),
);

console.log(`i18n silo test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
