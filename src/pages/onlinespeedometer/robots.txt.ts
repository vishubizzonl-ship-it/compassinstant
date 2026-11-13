import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the speedometer silo.
 * Output: /onlinespeedometer/robots.txt  →  https://instanten.com/onlinespeedometer/robots.txt
 *
 * Allows the speedometer silo, blocks the four noindex error pages, and points
 * crawlers at /onlinespeedometer/sitemap.xml (the speedometer silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/onlinespeedometer/
Disallow: ${base}/onlinespeedometer/403/
Disallow: ${base}/onlinespeedometer/404/
Disallow: ${base}/onlinespeedometer/500/
Disallow: ${base}/onlinespeedometer/503/

Sitemap: ${SITE_URL}${base}/onlinespeedometer/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
