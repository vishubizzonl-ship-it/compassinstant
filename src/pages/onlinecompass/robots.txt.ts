import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the compass silo.
 * Output: /onlinecompass/robots.txt  →  https://instanten.com/onlinecompass/robots.txt
 *
 * Allows the compass silo, blocks the four noindex error pages, and points
 * crawlers at /onlinecompass/sitemap.xml (the compass silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/onlinecompass/
Disallow: ${base}/onlinecompass/403/
Disallow: ${base}/onlinecompass/404/
Disallow: ${base}/onlinecompass/500/
Disallow: ${base}/onlinecompass/503/

Sitemap: ${SITE_URL}${base}/onlinecompass/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
