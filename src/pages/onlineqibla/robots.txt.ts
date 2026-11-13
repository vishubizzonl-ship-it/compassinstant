import type { APIRoute } from 'astro';
import { SITE_URL } from '../../i18n/utils';

/**
 * robots.txt for the Qibla silo.
 * Output: /onlineqibla/robots.txt  →  https://instanten.com/onlineqibla/robots.txt
 *
 * Allows the Qibla silo, blocks the four noindex error pages, and points
 * crawlers at /onlineqibla/sitemap.xml (the Qibla silo sitemap).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

export const GET: APIRoute = () => {
  const body = `User-agent: *
Allow: ${base}/onlineqibla/
Disallow: ${base}/onlineqibla/403/
Disallow: ${base}/onlineqibla/404/
Disallow: ${base}/onlineqibla/500/
Disallow: ${base}/onlineqibla/503/

Sitemap: ${SITE_URL}${base}/onlineqibla/sitemap.xml
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
