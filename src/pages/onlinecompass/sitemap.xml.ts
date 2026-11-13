import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the compass silo only.
 * Output: /compass/sitemap.xml  →  https://instanten.com/onlinecompass/compass/sitemap.xml
 *
 * Lists every indexable page under /compass/ plus the localized compass pages.
 * The error pages (403/404/500/503) are noindex, so they are left out.
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

type Entry = {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
};

const entries: Entry[] = [
  { path: '/onlinecompass/', changefreq: 'weekly', priority: '1.0' },
  { path: '/onlinecompass/blog/', changefreq: 'weekly', priority: '0.8' },
  { path: '/onlinecompass/blog/how-to-use-an-online-compass/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlinecompass/blog/how-to-find-north-without-a-compass/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlinecompass/blog/how-to-read-a-compass-dial/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlinecompass/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinecompass/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlinecompass/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/onlinecompass/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/compass/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/compass/', changefreq: 'monthly', priority: '0.6' },
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
