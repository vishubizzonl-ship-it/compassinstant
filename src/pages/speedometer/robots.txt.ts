import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the speedometer silo.
 * Output: /speedometer/robots.txt  →  https://instanten.com/speedometer/robots.txt
 *
 * Allows the speedometer silo, blocks the four noindex error pages, and points
 * crawlers at /speedometer/sitemap.xml (the speedometer silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/speedometer/
Disallow: ${base}/speedometer/403/
Disallow: ${base}/speedometer/404/
Disallow: ${base}/speedometer/500/
Disallow: ${base}/speedometer/503/

Sitemap: ${SITE_URL}${base}/speedometer/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
