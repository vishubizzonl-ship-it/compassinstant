import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the compass silo.
 * Output: /compass/robots.txt  →  https://instanten.com/onlinecompass/compass/robots.txt
 *
 * Allows the compass silo, blocks the four noindex error pages, and points
 * crawlers at /compass/sitemap.xml (the compass silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/compass/
Disallow: ${base}/compass/403/
Disallow: ${base}/compass/404/
Disallow: ${base}/compass/500/
Disallow: ${base}/compass/503/

Sitemap: ${SITE_URL}${base}/compass/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
