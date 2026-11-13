import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the bubble level silo.
 * Output: /onlinebubblelevel/robots.txt  →  https://instanten.com/onlinebubblelevel/robots.txt
 *
 * Allows the bubble level silo, blocks the four noindex error pages, and points
 * crawlers at /onlinebubblelevel/sitemap.xml (the bubble level silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/onlinebubblelevel/
Disallow: ${base}/onlinebubblelevel/403/
Disallow: ${base}/onlinebubblelevel/404/
Disallow: ${base}/onlinebubblelevel/500/
Disallow: ${base}/onlinebubblelevel/503/

Sitemap: ${SITE_URL}${base}/onlinebubblelevel/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
