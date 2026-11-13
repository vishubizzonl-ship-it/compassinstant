import { ui, defaultLang, showDefaultLang, languages } from "./ui";
import type { LangCode, TranslationKey } from "./ui";

export { languages, defaultLang, showDefaultLang };

export const SITE_URL = "https://instanten.com";

/**
 * The only routes that have a translated copy in every locale: the four tool
 * home pages. Silo sub-pages (blog / about / privacy / terms / contact) and the
 * blog posts exist in English only, so hreflang, the language switcher and the
 * header/footer links must never invent a localized URL for them — that is what
 * produced hundreds of 404s and dead hreflang entries.
 */
export const routePaths = [
  "/onlinecompass/",
  "/onlinebubblelevel/",
  "/onlinespeedometer/",
  "/onlineqibla/",
] as const;

/** True when `basePath` (locale-stripped) exists in every language. */
export function hasLocaleVersion(basePath: string): boolean {
  return (routePaths as readonly string[]).includes(normalizePath(basePath));
}

/**
 * Localize a path only when that locale version actually exists.
 * Otherwise return the English path, so a link never points at a missing page.
 */
export function translatePathIfExists(lang: LangCode, path: string): string {
  const normalized = normalizePath(path);
  return getLocalizedPath(hasLocaleVersion(normalized) ? lang : defaultLang, normalized);
}

export function isLang(value: string): value is LangCode {
  return value in languages;
}

/** Detect the locale from a pathname. Unknown paths fall back to English. */
export function getLangFromUrl(url: URL): LangCode {
  return getLangFromPath(url.pathname);
}

function stripBase(pathname: string): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
  if (base && base !== "/" && pathname.startsWith(base)) {
    const rest = pathname.slice(base.length);
    return rest.length ? rest : "/";
  }
  return pathname;
}

export function getLangFromPath(pathname: string): LangCode {
  const p = stripBase(pathname);
  const first = p.split("/").filter(Boolean)[0];
  return first && isLang(first) ? first : defaultLang;
}

/**
 * Remove the locale prefix from a pathname.
 * `/es/compass/` -> `/onlinecompass/`, `/ja/` -> `/`, `/` -> `/`.
 */
export function stripLocale(pathname: string): string {
  const p = stripBase(pathname);
  const parts = p.split("/").filter(Boolean);
  if (parts[0] && isLang(parts[0])) parts.shift();
  return parts.length === 0 ? "/" : `/${parts.join("/")}/`;
}

/** Ensure a path starts and ends with a slash, e.g. `compass` -> `/onlinecompass/`. */
export function normalizePath(path: string): string {
  const clean = path.split("/").filter(Boolean).join("/");
  return clean.length === 0 ? "/" : `/${clean}/`;
}

/**
 * Build the path for a route in a given locale.
 * English (the default) is not prefixed: `getLocalizedPath('en', '/onlinecompass/')` -> `/onlinecompass/`.
 */
export function getLocalizedPath(lang: LangCode, path: string): string {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const normalized = normalizePath(path);
  const localized = lang === defaultLang && !showDefaultLang ? normalized : `/${lang}${normalized}`;
  return base + localized;
}

/** Path for the same page in another locale. */
export function translatePathForLang(
  pathname: string,
  targetLang: LangCode,
): string {
  return getLocalizedPath(targetLang, stripLocale(pathname));
}

/** Absolute canonical URL for the current page. */
export function getCanonicalUrl(
  pathname: string,
  siteUrl: string = SITE_URL,
): string {
  return new URL(getLocalizedPath(getLangFromPath(pathname), stripLocale(pathname)), siteUrl).href;
}

export type AlternateLink = {
  lang: LangCode;
  hreflang: string;
  label: string;
  href: string;
};

/**
 * One hreflang entry per supported locale for the *current* page, plus
 * x-default pointing at the English version of that same page.
 */
export function getAlternateLinks(
  pathname: string,
  siteUrl: string = SITE_URL,
): { alternates: AlternateLink[]; xDefault: string } {
  const basePath = stripLocale(pathname);

  // English-only page (blog post, about, …): advertise just itself. Claiming
  // seven translations that do not exist is worse than claiming none.
  if (!hasLocaleVersion(basePath)) {
    return {
      alternates: [
        {
          lang: defaultLang,
          hreflang: defaultLang,
          label: languages[defaultLang],
          href: new URL(getLocalizedPath(defaultLang, basePath), siteUrl).href,
        },
      ],
      xDefault: new URL(getLocalizedPath(defaultLang, basePath), siteUrl).href,
    };
  }

  const alternates = (Object.keys(languages) as LangCode[]).map((lang) => ({
    lang,
    hreflang: lang,
    label: languages[lang],
    href: new URL(getLocalizedPath(lang, basePath), siteUrl).href,
  }));

  return {
    alternates,
    xDefault: new URL(getLocalizedPath(defaultLang, basePath), siteUrl).href,
  };
}

/** Open Graph locale identifiers (underscored, as required by the OG spec). */
export const ogLocales: Record<LangCode, string> = {
  en: "en_US",
  es: "es_ES",
  ja: "ja_JP",
  fr: "fr_FR",
  de: "de_DE",
  pt: "pt_BR",
  ko: "ko_KR",
  it: "it_IT",
};

const routeMetaKeys: Record<
  string,
  { title: TranslationKey; description: TranslationKey; brandSuffix: boolean }
> = {
  "/": { title: "meta.title", description: "meta.desc", brandSuffix: false },
  "/onlinecompass/": {
    title: "page.compass.title",
    description: "page.compass.desc",
    brandSuffix: true,
  },
  "/onlinebubblelevel/": {
    title: "page.bubble.title",
    description: "page.bubble.desc",
    brandSuffix: true,
  },
  "/onlinespeedometer/": {
    title: "page.speed.title",
    description: "page.speed.desc",
    brandSuffix: true,
  },
  "/onlineqibla/": {
    title: "page.qibla.title",
    description: "page.qibla.desc",
    brandSuffix: true,
  },
  "/privacy/": {
    title: "page.privacy.title",
    description: "page.privacy.desc",
    brandSuffix: true,
  },
  "/terms/": {
    title: "page.terms.title",
    description: "page.terms.desc",
    brandSuffix: true,
  },
  "/about/": {
    title: "page.about.title",
    description: "page.about.desc",
    brandSuffix: true,
  },
  "/contact/": {
    title: "page.contact.title",
    description: "page.contact.desc",
    brandSuffix: true,
  },
  "/blog/": {
    title: "page.blog.title",
    description: "page.blog.desc",
    brandSuffix: true,
  },
};

/** Localized <title> and meta description for the current route. */
const toolNameKeys: Record<string, TranslationKey> = {
  onlinecompass: "page.compass.title",
  "onlinebubblelevel": "page.bubble.title",
  onlinespeedometer: "page.speed.title",
  "onlineqibla": "page.qibla.title",
};

const siloTitleKeys: Record<string, TranslationKey> = {
  blog: "page.blog.title",
  about: "page.about.title",
  privacy: "page.privacy.title",
  terms: "page.terms.title",
  contact: "page.contact.title",
};

const siloDescKeys: Record<string, TranslationKey> = {
  blog: "page.blog.desc",
  about: "page.about.desc",
  privacy: "page.privacy.desc",
  terms: "page.terms.desc",
  contact: "page.contact.desc",
};

export function getPageSeo(lang: LangCode, pathname: string) {
  const t = useTranslations(lang);
  const basePath = stripLocale(pathname);

  // Tool sub-pages (/<tool>/<page>/) title themselves, e.g.
  // "Privacy Policy — Bubble Level". They must never inherit another tool's
  // title from the site-wide defaults.
  const segs = basePath.split("/").filter(Boolean);
  if (segs.length === 2 && toolNameKeys[segs[0]] && siloTitleKeys[segs[1]]) {
    const rawName = t(toolNameKeys[segs[0]]);
    // Normalise to the site's "Online <Tool>" phrasing.
    const toolName = /^online/i.test(rawName) ? rawName : `Online ${rawName}`;
    const pageName = t(siloTitleKeys[segs[1]]);
    return {
      title: `${pageName} — ${toolName}`,
      description: `${pageName} for ${toolName}. ${t(siloDescKeys[segs[1]])}`,
    };
  }

  const keys = routeMetaKeys[basePath] ?? routeMetaKeys["/"];

  const title = keys.brandSuffix
    ? `${t(keys.title)} — onlinecompass`
    : t(keys.title);

  return { title, description: t(keys.description) };
}

export function useTranslations(lang: LangCode) {
  // Each locale file may carry a slightly different key set, so the lookup is
  // typed as a plain string map rather than the English literal union.
  const localizedUI = (ui[lang] || ui[defaultLang]) as Record<string, string>;
  const fallbackUI = ui[defaultLang] as Record<string, string>;
  return function t(key: TranslationKey): string {
    return localizedUI[key] || fallbackUI[key] || key;
  };
}

export function useTranslatedPath(lang: LangCode) {
  return function translatePath(path: string, l: LangCode = lang): string {
    return getLocalizedPath(l, path);
  };
}

/**
 * Legacy helper kept for backwards compatibility. Prefer `routePaths` +
 * `getLocalizedPath` so route parity is guaranteed.
 */
export function getRouteTranslations() {
  return (Object.keys(languages) as LangCode[]).reduce(
    (acc, lang) => {
      acc[lang] = Object.fromEntries(
        routePaths.map((path) => [path, getLocalizedPath(lang, path)]),
      );
      return acc;
    },
    {} as Record<LangCode, Record<string, string>>,
  );
}
