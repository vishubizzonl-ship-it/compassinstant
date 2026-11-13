import type { APIRoute } from 'astro';
import { SITE_URL } from '../i18n/utils';

/**
 * One generator for all four silo sitemaps.
 *
 * Blog posts are discovered from the file system instead of being hand-listed,
 * so a new post can never be missing from its silo sitemap again (that is
 * exactly what happened to the speedometer posts).
 */

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

type Tool = 'onlinecompass' | 'onlinebubblelevel' | 'onlinespeedometer' | 'onlineqibla';

type Entry = { path: string; changefreq: string; priority: string };

// Each glob is static on purpose: import.meta.glob cannot take a variable.
const postsByTool: Record<Tool, string[]> = {
  onlinecompass: Object.keys(import.meta.glob('/src/pages/onlinecompass/blog/*.astro')).map(toSlug).filter(isPost),
  onlinebubblelevel: Object.keys(import.meta.glob('/src/pages/onlinebubblelevel/blog/*.astro')).map(toSlug).filter(isPost),
  onlinespeedometer: Object.keys(import.meta.glob('/src/pages/onlinespeedometer/blog/*.astro')).map(toSlug).filter(isPost),
  onlineqibla: Object.keys(import.meta.glob('/src/pages/onlineqibla/blog/*.astro')).map(toSlug).filter(isPost),
};

function toSlug(filePath: string): string {
  return filePath.split('/').pop()!.replace(/\.astro$/, '');
}

/** The blog index page is listed separately, not as a post. */
function isPost(slug: string): boolean {
  return slug !== 'index';
}

const LOCALES = ['es', 'fr', 'de', 'it', 'pt', 'ja', 'ko'] as const;

/** The four locales' mirrored tool pages (the only translated routes). */
const localeEntries = (tool: Tool): Entry[] =>
  LOCALES.map((locale) => ({
    path: `/${locale}/${tool}/`,
    changefreq: 'monthly',
    priority: '0.6',
  }));

const pageEntries = (tool: Tool): Entry[] => [
  { path: `/${tool}/blog/`, changefreq: 'weekly', priority: '0.8' },
  { path: `/${tool}/about/`, changefreq: 'yearly', priority: '0.5' },
  { path: `/${tool}/contact/`, changefreq: 'yearly', priority: '0.5' },
  { path: `/${tool}/privacy/`, changefreq: 'yearly', priority: '0.3' },
  { path: `/${tool}/terms/`, changefreq: 'yearly', priority: '0.3' },
];

export function buildSiloSitemap(tool: Tool): APIRoute {
  return () => {
    const lastmod = new Date().toISOString().slice(0, 10);

    const entries: Entry[] = [
      { path: `/${tool}/`, changefreq: 'weekly', priority: '1.0' },
      ...pageEntries(tool),
      ...postsByTool[tool]
        .sort()
        .map((slug) => ({
          path: `/${tool}/blog/${slug}/`,
          changefreq: 'monthly',
          priority: '0.7',
        })),
      ...localeEntries(tool),
    ];

    const urls = entries
      .map(
        (entry) => `  <url>
    <loc>${SITE_URL}${base}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
      )
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  };
}
