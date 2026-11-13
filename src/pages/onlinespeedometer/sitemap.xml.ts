import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the speedometer silo only.
 * Output: /onlinespeedometer/sitemap.xml  →  https://instanten.com/onlinespeedometer/sitemap.xml
 *
 * Lists every indexable page under /onlinespeedometer/ plus the localized speedometer
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
  { path: '/onlinespeedometer/', changefreq: 'weekly', priority: '1.0' },
  { path: '/onlinespeedometer/blog/', changefreq: 'weekly', priority: '0.8' },
  { path: '/onlinespeedometer/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinespeedometer/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinespeedometer/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/onlinespeedometer/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/onlinespeedometer/', changefreq: 'monthly', priority: '0.6' },
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
