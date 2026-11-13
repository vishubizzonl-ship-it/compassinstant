import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the Qibla silo only.
 * Output: /qibla-finder/sitemap.xml  →  https://instanten.com/qibla-finder/sitemap.xml
 *
 * Lists every indexable page under /qibla-finder/ plus the localized Qibla
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
  { path: '/qibla-finder/', changefreq: 'weekly', priority: '1.0' },
  { path: '/qibla-finder/blog/', changefreq: 'weekly', priority: '0.8' },
  { path: '/qibla-finder/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/qibla-finder/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/qibla-finder/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/qibla-finder/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/qibla-finder/', changefreq: 'monthly', priority: '0.6' },
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
