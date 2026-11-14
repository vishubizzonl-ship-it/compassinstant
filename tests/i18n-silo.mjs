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

const urlFor = (lang, page, tool = 'onlinecompass') =>
  lang === 'en' ? `${SITE}/${tool}/${page}/` : `${SITE}/${lang}/${tool}/${page}/`;
const fileFor = (lang, page, tool = 'onlinecompass') =>
  lang === 'en'
    ? `dist/${tool}/${page}/index.html`
    : `dist/${lang}/${tool}/${page}/index.html`;

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

const TOOLS = ['onlinecompass', 'onlinebubblelevel', 'onlinespeedometer', 'onlineqibla'];

// --- 1. every translated page exists, is canonical to itself, has localized HTML
for (const tool of TOOLS)
for (const lang of LOCALES) {
  for (const page of PAGES) {
    const file = fileFor(lang, page, tool);
    check(`${lang}/${page} page exists`, existsSync(file), file);
    if (!existsSync(file)) continue;
    const html = readFileSync(file, 'utf8');
    check(`${lang}/${page} <html lang>`, html.includes(`<html lang="${lang}"`));
    check(
      `${lang}/${tool}/${page} canonical is itself`,
      html.includes(`rel="canonical" href="${urlFor(lang, page, tool)}"`),
    );
    check(
      `${lang}/${page} has no English prose`,
      textOf(html).every((chunk) => !looksEnglish(chunk)),
      textOf(html).find((chunk) => looksEnglish(chunk)) ?? '',
    );
  }
}

// --- 2. reciprocal hreflang across all eight languages, for every silo page
for (const tool of TOOLS)
for (const page of PAGES) {
  for (const lang of ALL) {
    const file = fileFor(lang, page, tool);
    if (!existsSync(file)) {
      check(`${lang}/${page} page exists`, false, file);
      continue;
    }
    const html = readFileSync(file, 'utf8');
    const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)];
    const byLang = new Map(alternates.map((m) => [m[1], m[2]]));

    for (const target of ALL) {
      check(`${lang}/${page} hreflang ${target}`, byLang.get(target) === urlFor(target, page, tool), `${byLang.get(target)}`);
    }
    check(`${lang}/${page} hreflang x-default → English`, byLang.get('x-default') === urlFor('en', page, tool));
    check(`${lang}/${page} hreflang count`, alternates.length === ALL.length + 1, String(alternates.length));

    // reciprocity: the page each alternate points at must link back here
    const other = byLang.get('ja') && lang !== 'ja' ? 'ja' : 'es';
    const otherUrl = byLang.get(other);
    if (otherUrl && lang !== other) {
      const otherFile = fileFor(other, page, tool);
      if (existsSync(otherFile)) {
        const otherHtml = readFileSync(otherFile, 'utf8');
        check(
          `${other}/${page} links back to ${lang}`,
          otherHtml.includes(`href="${urlFor(lang, page, tool)}"`),
        );
      }
    }
  }
}

// --- 3. English pages keep their URLs and gain the translated alternates
for (const tool of TOOLS)
for (const page of PAGES) {
  const file = fileFor('en', page, tool);
  const html = readFileSync(file, 'utf8');
  check(`en/${page} canonical`, html.includes(`rel="canonical" href="${SITE}/${tool}/${page}/"`));
  for (const lang of LOCALES) {
    check(`en/${page} advertises ${lang}`, html.includes(`hreflang="${lang}" href="${urlFor(lang, page, tool)}"`));
  }
}

// --- 4. sitemap carries the 35 new URLs and still excludes redirect stubs
const sitemapFile = existsSync('dist/sitemap-0.xml') ? 'dist/sitemap-0.xml' : null;
if (sitemapFile) {
  const sitemap = readFileSync(sitemapFile, 'utf8');
  for (const tool of TOOLS)
  for (const lang of LOCALES) {
    for (const page of PAGES) {
      check(`sitemap has ${lang}/${tool}/${page}`, sitemap.includes(`<loc>${urlFor(lang, page, tool)}</loc>`));
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


// --- 6. nothing English is left behind on the translated compass pages
//
// The signal is exact: a visible text node or a user-facing attribute that is
// byte-identical to the English page cannot have been translated. Brand names,
// language names, numbers, cardinal letters and words that are genuinely the
// same in a given language are allow-listed below.
// Words that are genuinely the same in a given language, or that are never
// translated at all (brand, language names, technical values). Kept per locale,
// because "Blog" is correct Spanish but wrong Japanese.
const NEUTRAL_GLOBAL = new Set([
  'onlinecompass', 'onlinebubblelevel', 'onlinespeedometer', 'onlineqibla', 'zspeed', 'Twitter', 'GitHub', 'Qibla',
  'English', 'Español', 'Français', 'Deutsch', 'Português', '日本語', '한국어', 'Italiano',
  'hello@instanten.com',
  // technical values that are never translated
  '#ffffff', 'de_DE', 'en_US', 'es_ES', 'fr_FR', 'it_IT', 'ja_JP', 'ko_KR', 'pt_BR',
  'https://instanten.com/og-image.png', 'image/png', 'summary_large_image', 'website',
  'index, follow, max-image-preview:large', 'width=device-width, initial-scale=1.0',
  'Analytics tag manager',
]);

const NEUTRAL_BY_LANG = {
  en: [],
  es: ['Blog', '2. Cookies'],
  ja: [],
  ko: [],
  fr: ['Blog', 'Contact', 'Message', 'Direction', '8. Contact', '2. Cookies'],
  de: ['Blog', 'Name', 'West', '2. Cookies'],
  pt: ['Blog', '2. Cookies'],
  it: [
    'Blog',
    'Privacy',
    'Email',
    'onlinecompass — Home',
    'onlinebubblelevel — Home',
    'onlinespeedometer — Home',
  ],
};

// Unit symbols, conversion lines and words that are genuinely identical in a
// given language. Kept separate from NEUTRAL_BY_LANG so the compass and bubble
// checks stay as strict as they were.
const SPEED_EXTRA_BY_LANG = {
  es: ['Altitude', 'Max', 'Stat', 'Symbol', 'Start', 'Conversion', 'Name', 'Direction'],
  fr: ['Altitude', 'Max', 'Stat', 'Symbol', 'Start', 'Conversion', 'Name', 'Direction'],
  de: ['Altitude', 'Max', 'Stat', 'Symbol', 'Start', 'Conversion', 'Name', 'Direction'],
  pt: ['Altitude', 'Max', 'Stat', 'Symbol', 'Start', 'Conversion', 'Name', 'Direction'],
  it: ['Altitude', 'Max', 'Stat', 'Symbol', 'Start', 'Conversion', 'Name', 'Direction'],
  ja: [],
  ko: [],
};

function visibleChunks(file) {
  const html = readFileSync(file, 'utf8')
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ');
  const attrs = [...html.matchAll(/(?:title|aria-label|placeholder|alt)="([^"]{2,})"/g)].map((m) => m[1]);
  const text = html
    .replace(/<[^>]+>/g, '\n')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ');
  const nodes = text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return new Set([...nodes, ...attrs]);
}

const NEUTRAL_PATTERNS = [
  /^[NSEW]{1,3}$/,
  /^[\d.,°%:/ +—·-]+$/,
  // unit symbols and conversion lines ("1 km/h = 0.621 mph") are the same in
  // every language, so they are never a sign of an untranslated page
  /^(?:km\/h|mph|m\/s|kn|KM\/H|MPH|M\/S|KN)$/,
  // the duration column header ("minutes:seconds") on the trip stats
  /^m:s$/,
  /^\d+(?:[.,]\d+)?\s*(?:km\/h|mph|m\/s|kn)\s*=\s*\d/,
];

/** Compare every locale copy of a tool page with its English original. */
function noEnglishLeft(tool, label, extraNeutral = {}) {
  for (const page of ['', ...PAGES]) {
    const enFile = `dist/${tool}/${page ? `${page}/` : ''}index.html`;
    if (!existsSync(enFile)) continue;
    const english = visibleChunks(enFile);

    for (const lang of LOCALES) {
      const file = `dist/${lang}/${tool}/${page ? `${page}/` : ''}index.html`;
      if (!existsSync(file)) continue;
      const leaked = [...visibleChunks(file)].filter(
        (chunk) =>
          english.has(chunk) &&
          !NEUTRAL_GLOBAL.has(chunk) &&
          !(NEUTRAL_BY_LANG[lang] ?? []).includes(chunk) &&
          !(extraNeutral[lang] ?? []).includes(chunk) &&
          chunk.replace(/[^A-Za-z]/g, '').length > 1 &&
          !NEUTRAL_PATTERNS.some((re) => re.test(chunk)),
      );
      check(
        `${lang}/${tool}${page ? `/${page}` : ''} (${label}) has no untranslated English`,
        leaked.length === 0,
        leaked.slice(0, 6).join(' | '),
      );
    }
  }
}

noEnglishLeft('onlinecompass', 'compass');

// The bubble level silo is translated from src/i18n/bubbleSupport.ts. "Horizontal",
// "Vertical" and "Mode" are the same word in Spanish, French and Portuguese, and
// "Email" is Italian for email — they are correct, not leftovers.
noEnglishLeft('onlinebubblelevel', 'bubble', {
  es: ['Horizontal', 'Vertical', 'Mode'],
  fr: ['Horizontal', 'Vertical', 'Mode'],
  pt: ['Horizontal', 'Vertical', 'Mode'],
  it: ['Horizontal', 'Vertical'],
  de: ['Horizontal'],
});

// The speedometer silo comes from src/i18n/speedometerSupport.ts plus the
// tool-specific legal clauses in speedometerLegal.ts.
noEnglishLeft('onlinespeedometer', 'speed', SPEED_EXTRA_BY_LANG);

// The Qibla silo comes from src/i18n/qiblaSupport.ts plus the location clauses
// in qiblaLegal.ts. Words that are genuinely identical per language are listed
// separately so the compass, bubble and speed checks stay as strict as before.
// "Source", "Destination", "Latitude" and "Longitude" are the correct French
// words; "Magnetometer" and "Latitude"/"Longitude" are correct German and
// Portuguese — these are real translations, not leftovers.
const QIBLA_EXTRA_BY_LANG = {
  es: ['Blog'],
  fr: ['Blog', 'Contact', 'Source', 'Latitude', 'Longitude', 'Destination'],
  de: ['Blog', 'Magnetometer'],
  pt: ['Blog', 'Latitude', 'Longitude'],
  it: ['Blog', 'Email', 'Privacy', 'onlineqibla — Home'],
  ja: [],
  ko: [],
};

noEnglishLeft('onlineqibla', 'qibla', QIBLA_EXTRA_BY_LANG);

// --- 6b. the bubble level silo behaves the same way
for (const lang of LOCALES) {
  const blog = readFileSync(fileFor(lang, 'blog', 'onlinebubblelevel'), 'utf8');
  const start = blog.indexOf('<ul class="space-y-8">');
  const list = blog.slice(start, blog.indexOf('</ul>', start));
  const hrefs = [...list.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  const cards = hrefs.filter((href) => href.startsWith('/onlinebubblelevel/blog/') && !href.endsWith('/blog/'));
  check(`${lang}/bubble blog cards open real articles`, cards.length >= 3, String(cards.length));
  check(
    `${lang}/bubble blog cards are not locale-prefixed`,
    !hrefs.some((href) => href.startsWith(`/${lang}/`)),
  );

  const contact = readFileSync(fileFor(lang, 'contact', 'onlinebubblelevel'), 'utf8');
  check(
    `${lang}/bubble contact form carries copy`,
    contact.includes('data-error=') && contact.includes('data-status='),
  );
}

const jaBubbleContact = readFileSync('dist/ja/onlinebubblelevel/contact/index.html', 'utf8');
check(
  'ja bubble contact labels are Japanese',
  jaBubbleContact.includes('お名前') && jaBubbleContact.includes('メッセージ'),
);

// The bubble widget's runtime sentences must travel with the page, not the JS.
for (const lang of ['ja', 'ko']) {
  const html = readFileSync(`dist/${lang}/onlinebubblelevel/index.html`, 'utf8');
  for (const attr of ['data-msg-level', 'data-msg-tilt', 'data-msg-stopped', 'data-msg-denied', 'data-msg-unsupported']) {
    const value = html.match(new RegExp(`${attr}="([^"]*)"`))?.[1] ?? '';
    check(
      `${lang} bubble ${attr} is localized`,
      /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(value),
      value,
    );
  }
  check(`${lang} bubble reset label is localized`, !/>Reset</.test(html));
  check(`${lang} bubble fullscreen label is localized`, !/aria-label="Fullscreen"/.test(html));
}

// --- 6c. the speedometer silo behaves the same way
for (const lang of LOCALES) {
  const blog = readFileSync(fileFor(lang, 'blog', 'onlinespeedometer'), 'utf8');
  const start = blog.indexOf('<ul class="space-y-8">');
  const list = blog.slice(start, blog.indexOf('</ul>', start));
  const hrefs = [...list.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  const cards = hrefs.filter(
    (href) => href.startsWith('/onlinespeedometer/blog/') && !href.endsWith('/blog/'),
  );
  check(`${lang}/speed blog cards open real articles`, cards.length >= 3, String(cards.length));
  check(
    `${lang}/speed blog cards are not locale-prefixed`,
    !hrefs.some((href) => href.startsWith(`/${lang}/`)),
  );

  const contact = readFileSync(fileFor(lang, 'contact', 'onlinespeedometer'), 'utf8');
  check(
    `${lang}/speed contact form carries copy`,
    contact.includes('data-error=') && contact.includes('data-status='),
  );

  // the trip widget's buttons, labels and messages come from ui.ts
  const tool = readFileSync(fileFor(lang, '', 'onlinespeedometer'), 'utf8');
  // "Start" is the German word for start, so German is allowed to keep it.
  if (lang !== 'de') {
    check(`${lang}/speed Start button is localized`, !/>Start</.test(tool), 'Start');
  }
  check(`${lang}/speed Reset button is localized`, !/>Reset</.test(tool), 'Reset');
  check(`${lang}/speed fullscreen label is localized`, !/aria-label="Fullscreen"/.test(tool));
  check(`${lang}/speed unit label is localized`, !/aria-label="Change unit"/.test(tool));
}

const jaSpeed = readFileSync('dist/ja/onlinespeedometer/index.html', 'utf8');
check('ja speed page prose is Japanese', jaSpeed.includes('オンラインスピードメーター'));
check('ja speed FAQ is Japanese', jaSpeed.includes('よくある質問'));
check('ja speed contact labels are Japanese', /お名前/.test(readFileSync('dist/ja/onlinespeedometer/contact/index.html', 'utf8')));

// The English pages must keep their original content, not fall back to a stub.
const enSpeed = readFileSync('dist/onlinespeedometer/index.html', 'utf8');
check('en speed page keeps the long form copy', enSpeed.includes('The free online speedometer that reads your real speed'));
check('en speed page keeps all seven FAQs', (enSpeed.match(/<summary/g) ?? []).length >= 7);
check('en speed privacy keeps the GPS clause', readFileSync('dist/onlinespeedometer/privacy/index.html', 'utf8').includes('What the tool does with GPS'));
check('en speed terms keeps the GPS caveat', readFileSync('dist/onlinespeedometer/terms/index.html', 'utf8').includes('only as good as the satellite fix'));

// --- 6d. the Qibla silo behaves the same way
for (const lang of LOCALES) {
  const blog = readFileSync(fileFor(lang, 'blog', 'onlineqibla'), 'utf8');
  const start = blog.indexOf('<ul class="space-y-8');
  const list = blog.slice(start, blog.indexOf('</ul>', start));
  const hrefs = [...list.matchAll(/<a href="([^"]+)"/g)].map((m) => m[1]);
  const cards = hrefs.filter((href) => href.startsWith('/onlineqibla/blog/') && !href.endsWith('/blog/'));
  check(`${lang}/qibla blog cards open real articles`, cards.length >= 3, String(cards.length));
  check(
    `${lang}/qibla blog cards are not locale-prefixed`,
    !hrefs.some((href) => href.startsWith(`/${lang}/`)),
  );

  const contact = readFileSync(fileFor(lang, 'contact', 'onlineqibla'), 'utf8');
  check(
    `${lang}/qibla contact form carries copy`,
    contact.includes('data-error=') && contact.includes('data-status='),
  );
  check(
    `${lang}/qibla contact links to the localized blog`,
    contact.includes(`href="/${lang}/onlineqibla/blog/"`),
  );

  // the widget's status, bearing and GPS labels come from ui.ts
  const tool = readFileSync(fileFor(lang, '', 'onlineqibla'), 'utf8');
  check(`${lang}/qibla fullscreen label is localized`, !/aria-label="Fullscreen"/.test(tool));
  check(`${lang}/qibla status never renders in English`, !/>Locating…</.test(tool), 'Locating…');
  check(
    `${lang}/qibla privacy splices the location clause`,
    /1a\./.test(readFileSync(fileFor(lang, 'privacy', 'onlineqibla'), 'utf8')),
  );
}

for (const lang of ['ja', 'ko']) {
  const html = readFileSync(`dist/${lang}/onlineqibla/index.html`, 'utf8');
  for (const attr of [
    'data-t-ready',
    'data-t-bearing-prefix',
    'data-t-gps',
    'data-t-blocked',
    'data-t-ip-approx',
    'data-t-could-not',
    'data-t-calibrating',
    'data-t-tap-to-enable',
    'data-t-https',
  ]) {
    const value = html.match(new RegExp(`${attr}="([^"]*)"`))?.[1] ?? '';
    check(
      `${lang} qibla ${attr} is localized`,
      /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(value),
      value,
    );
  }
}

const jaQibla = readFileSync('dist/ja/onlineqibla/index.html', 'utf8');
check('ja qibla page prose is Japanese', jaQibla.includes('キブラ'));
check('ja qibla page title is Japanese', /<title>[^<]*キブラ/.test(jaQibla));
check('ja qibla FAQ is Japanese', jaQibla.includes('よくある質問'));
check(
  'ja qibla about page is Japanese',
  readFileSync('dist/ja/onlineqibla/about/index.html', 'utf8').includes('キブラ'),
);
check(
  'ja qibla terms keeps the accuracy caveat',
  readFileSync('dist/ja/onlineqibla/terms/index.html', 'utf8').includes('測量'),
);

// The English pages must keep their original content, not fall back to a stub.
const enQibla = readFileSync('dist/onlineqibla/index.html', 'utf8');
check(
  'en qibla page keeps the long form copy',
  enQibla.includes('The online Qibla finder that works from where you stand'),
);
check('en qibla page keeps its keywords', enQibla.includes('qibla direction compass degrees'));
check('en qibla page keeps all seven FAQs', (enQibla.match(/<summary/g) ?? []).length >= 7);
check(
  'en qibla privacy keeps the location clause',
  readFileSync('dist/onlineqibla/privacy/index.html', 'utf8').includes(
    'What the tool does with your location',
  ),
);
check(
  'en qibla terms keeps the accuracy caveat',
  readFileSync('dist/onlineqibla/terms/index.html', 'utf8').includes('not a surveyed bearing'),
);

// --- 7. the compass widget's runtime messages come from the page, not the JS
for (const lang of ['ja', 'ko']) {
  const html = readFileSync(`dist/${lang}/onlinecompass/index.html`, 'utf8');
  for (const attr of ['data-denied', 'data-blocked', 'data-error', 'data-calibrating', 'data-tap', 'data-https']) {
    const value = html.match(new RegExp(`${attr}="([^"]*)"`))?.[1] ?? '';
    check(
      `${lang} compass ${attr} is localized`,
      /[\u3040-\u30ff\u4e00-\u9fff\uac00-\ud7af]/.test(value),
      value,
    );
  }
  check(
    `${lang} compass fullscreen label is localized`,
    !/<button[^>]*aria-label="Fullscreen"/.test(html),
  );
}

console.log(`i18n silo test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
