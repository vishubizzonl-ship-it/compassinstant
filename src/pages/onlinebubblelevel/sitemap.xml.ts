import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the bubble level silo only.
 * Output: /onlinebubblelevel/sitemap.xml  →  https://instanten.com/onlinebubblelevel/sitemap.xml
 *
 * Lists every indexable page under /onlinebubblelevel/ plus the localized bubble
 * level pages. The error pages (403/404/500/503) are noindex, so they are left
 * out here as well.
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

type Entry = {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

const entries: Entry[] = [
  { path: '/onlinebubblelevel/', changefreq: 'weekly', priority: '1.0' },
  { path: '/onlinebubblelevel/blog/', changefreq: 'weekly', priority: '0.8' },
  {
    path: '/onlinebubblelevel/blog/how-to-use-an-online-bubble-level/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/onlinebubblelevel/blog/how-accurate-is-a-phone-bubble-level/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/onlinebubblelevel/blog/level-furniture-shelves-appliances/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  { path: '/onlinebubblelevel/blog/bubble-level-vs-spirit-level/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlinebubblelevel/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinebubblelevel/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinebubblelevel/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/onlinebubblelevel/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/onlinebubblelevel/', changefreq: 'monthly', priority: '0.6' },
];

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = entries
    .map(
      (entry) => `  <url>
    <loc>${SITE_URL}${base}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
