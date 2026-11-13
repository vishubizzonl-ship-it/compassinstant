import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

const SITE = 'https://instanten.com';
const LOCALES = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'];
const SILO_PAGES = ['blog', 'about', 'privacy', 'terms', 'contact'];

/**
 * The site opens on the compass tool, so there is no separate home page.
 * Every URL that used to render the old landing page or the old site-wide
 * pages now 301s to the equivalent page inside the compass silo.
 */
const redirects = {
  '/': '/onlinecompass/',
  ...Object.fromEntries(SILO_PAGES.map((page) => [`/${page}/`, `/onlinecompass/${page}/`])),
  ...Object.fromEntries(
    LOCALES.flatMap((locale) => [
      [`/${locale}/`, `/${locale}/onlinecompass/`],
      ...SILO_PAGES.map((page) => [`/${locale}/${page}/`, `/onlinecompass/${page}/`]),
    ]),
  ),
};

/** Paths that only exist as a redirect — never list them in a sitemap. */
const REDIRECT_PATHS = Object.keys(redirects);

export default defineConfig({
  site: SITE,
  trailingSlash: 'always',
  redirects,
  i18n: {
    defaultLocale: 'en',
    locales: ['en', ...LOCALES],
    routing: {
      // English lives at the root (/onlinecompass/) and every other locale is
      // prefixed (e.g. /es/onlinecompass/). This keeps existing English URLs stable.
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // Error pages are noindex and redirects are not real pages: neither may
      // appear in the sitemap.
      filter: (page) => {
        const path = page.replace(SITE, '') || '/';
        if (/\/(403|404|500|503)\/?$/.test(path)) return false;
        return !REDIRECT_PATHS.includes(path);
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', es: 'es', ja: 'ja', fr: 'fr', de: 'de', pt: 'pt', ko: 'ko', it: 'it' },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
