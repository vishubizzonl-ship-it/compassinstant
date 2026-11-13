import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the speedometer silo only.
 * Output: /speedometer/sitemap.xml  →  https://instanten.com/speedometer/sitemap.xml
 *
 * Lists every indexable page under /speedometer/ plus the localized speedometer
 * pages. The error pages (403/404/500/503) are noindex, so they are left out
 * here as well.
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

type Entry = {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

const entries: Entry[] = [
  { path: '/speedometer/', changefreq: 'weekly', priority: '1.0' },
  { path: '/speedometer/blog/', changefreq: 'weekly', priority: '0.8' },
  { path: '/speedometer/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/speedometer/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/speedometer/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/speedometer/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/speedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/speedometer/', changefreq: 'monthly', priority: '0.6' },
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
