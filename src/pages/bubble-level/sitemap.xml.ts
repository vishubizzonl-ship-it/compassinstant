import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the bubble level silo only.
 * Output: /bubble-level/sitemap.xml  →  https://instanten.com/bubble-level/sitemap.xml
 *
 * Lists every indexable page under /bubble-level/ plus the localized bubble
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
  { path: '/bubble-level/', changefreq: 'weekly', priority: '1.0' },
  { path: '/bubble-level/blog/', changefreq: 'weekly', priority: '0.8' },
  {
    path: '/bubble-level/blog/how-to-use-an-online-bubble-level/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/bubble-level/blog/how-accurate-is-a-phone-bubble-level/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  {
    path: '/bubble-level/blog/level-furniture-shelves-appliances/',
    changefreq: 'monthly',
    priority: '0.7',
  },
  { path: '/bubble-level/blog/bubble-level-vs-spirit-level/', changefreq: 'monthly', priority: '0.7' },
  { path: '/bubble-level/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/bubble-level/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/bubble-level/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/bubble-level/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/bubble-level/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/bubble-level/', changefreq: 'monthly', priority: '0.6' },
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
