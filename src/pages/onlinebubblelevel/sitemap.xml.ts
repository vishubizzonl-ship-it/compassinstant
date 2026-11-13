import { buildSiloSitemap } from '../../utils/siloSitemap';

/**
 * Sitemap for the onlinebubblelevel silo only.
 * Output: /onlinebubblelevel/sitemap.xml → https://instanten.com/onlinebubblelevel/sitemap.xml
 *
 * Every indexable page in the silo plus its seven localized mirrors. Blog posts
 * are discovered automatically; the 403/404/500/503 pages are noindex and are
 * never listed.
 */
export const GET = buildSiloSitemap('onlinebubblelevel');
