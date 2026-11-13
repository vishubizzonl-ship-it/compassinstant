import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * Sitemap for the Qibla silo only.
 * Output: /onlineqibla/sitemap.xml  →  https://instanten.com/onlineqibla/sitemap.xml
 *
 * Lists every indexable page under /onlineqibla/ plus the localized Qibla
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
  { path: '/onlineqibla/', changefreq: 'weekly', priority: '1.0' },
  { path: '/onlineqibla/blog/', changefreq: 'weekly', priority: '0.8' },
  { path: '/onlineqibla/blog/qibla-direction-compass-degrees/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlineqibla/blog/why-is-my-qibla-direction-wrong/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlineqibla/blog/how-to-find-qibla-direction-anywhere/', changefreq: 'monthly', priority: '0.7' },
  { path: '/onlineqibla/about/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlineqibla/contact/', changefreq: 'yearly', priority: '0.5' },
  { path: '/onlineqibla/privacy/', changefreq: 'yearly', priority: '0.3' },
  { path: '/onlineqibla/terms/', changefreq: 'yearly', priority: '0.3' },
  { path: '/es/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/fr/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/de/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/it/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/pt/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ja/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
  { path: '/ko/onlineqibla/', changefreq: 'monthly', priority: '0.6' },
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
