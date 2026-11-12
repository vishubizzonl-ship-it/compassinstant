import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://instanten.com',
  base: '/onlinecompass',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'es', 'ja', 'fr', 'de', 'pt', 'ko', 'it'],
    routing: {
      // English lives at the root (/, /compass/) and every other locale is
      // prefixed (e.g. /es/compass/). This keeps existing English URLs stable.
      prefixDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // Error pages are noindex, so they must never be listed in the sitemap.
      filter: (page) => !/\/(403|404|500|503)\/?$/.test(page),
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          es: 'es',
          ja: 'ja',
          fr: 'fr',
          de: 'de',
          pt: 'pt',
          ko: 'ko',
          it: 'it',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
