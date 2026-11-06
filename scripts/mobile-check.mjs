import puppeteer from 'puppeteer-core';

const BASE = 'http://localhost:4321';
const PAGES = ['/', '/compass/'];
const VIEW_W = 375;
const CHROME = '/data/data/com.termux/files/usr/bin/chromium-browser';

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage();
await page.setViewport({ width: VIEW_W, height: 800 });

let errors = [];
page.on('pageerror', (e) => errors.push(e.message));

let failed = false;
for (const path of PAGES) {
  errors = [];
  await page.goto(BASE + path, { waitUntil: 'networkidle0' });
  const r = await page.evaluate(() => {
    const h1 = document.querySelector('h1, h2');
    const main = document.querySelector('main') || document.body;
    return {
      h1: h1 ? Math.round(h1.getBoundingClientRect().width) : 0,
      main: Math.round(main.getBoundingClientRect().width),
      scroll: document.documentElement.scrollWidth,
    };
  });
  const ok = r.h1 >= VIEW_W * 0.8 && r.main >= VIEW_W * 0.8 && r.scroll <= VIEW_W && errors.length === 0;
  if (!ok) failed = true;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${path} | h1=${r.h1}px main=${r.main}px scrollWidth=${r.scroll}px errors=${errors.length}`);
}

await browser.close();
process.exit(failed ? 1 : 0);
