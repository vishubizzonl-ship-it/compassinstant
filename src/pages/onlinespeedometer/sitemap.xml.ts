import { buildSiloSitemap } from '../../utils/siloSitemap';

/**
 * Sitemap for the onlinespeedometer silo only.
 * Output: /onlinespeedometer/sitemap.xml → https://instanten.com/onlinespeedometer/sitemap.xml
 *
 * Every indexable page in the silo plus its seven localized mirrors. Blog posts
 * are discovered automatically; the 403/404/500/503 pages are noindex and are
 * never listed.
 */
export const GET = buildSiloSitemap('onlinespeedometer');
