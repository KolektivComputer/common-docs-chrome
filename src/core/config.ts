import { stripBase } from './paths.js';
import type { ChromeTheme, ThemeFamily } from './themes.js';

/** A single link in the sidebar / navigation. */
export interface NavItem {
  label: string;
  href: string;
  /** Optional inline SVG `d` path data rendered before the label. */
  icon?: string;
  /** Force external-link rendering (also inferred from the href). */
  external?: boolean;
  /** Optional one-line description, surfaced by the search dialog. */
  description?: string;
}

/** A titled group of navigation items. */
export interface NavSection {
  label: string;
  /** Optional inline SVG `d` path data for the group heading. */
  icon?: string;
  items: NavItem[];
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterConfig {
  /** Extra links rendered in the footer. */
  links?: FooterLink[];
  /** Copyright line. `{year}` is replaced with the current year. */
  copyright?: string;
  /** Short blurb shown next to the built-by mark. */
  tagline?: string;
}

export interface RepoConfig {
  /** Clone / browse URL, e.g. `https://github.com/KolektivComputer/kalendee`. */
  url: string;
  branch?: string;
  /** Base URL for "edit this page" links; used to derive the edit link. */
  editBaseUrl?: string;
}

export interface BuiltByConfig {
  href?: string;
  label?: string;
  /** Optional logo URL for the built-by mark. Falls back to `@kolektiv/brand-core`. */
  mark?: string;
}

/**
 * The complete site configuration consumed by the layouts and components.
 * `defineDocsChrome` fills in every optional field with a sensible default.
 */
export interface DocsChromeConfig {
  /** Product name used in titles, the lockup and the footer. */
  name: string;
  /** Full document title prefix. Defaults to `name`. */
  title?: string;
  description: string;
  /** Canonical site origin, e.g. `https://docs.kalendee.example`. */
  siteUrl: string;
  /** Astro base path. Defaults to `/`. */
  base?: string;
  /** Logo/wordmark URL for the navbar. */
  logo?: string;
  /** Icon/logo URL used by the mark. Falls back to the `@kolektiv/brand-core` icon mark. */
  mark?: string;
  repo?: RepoConfig;
  nav: NavSection[];
  /** Theme id applied on first visit and used for SSR. Required. */
  defaultTheme: string;
  /** Code theme id, or `follow` to track the site theme. Defaults to `follow`. */
  defaultCodeTheme?: string;
  /**
   * Restrict the built-in theme families offered in the picker, in display
   * order. Omit to offer every built-in family.
   */
  themeFamilies?: ThemeFamily[];
  /** Family assigned to site-specific `themes` entries. Defaults to `site`. */
  themeFamily?: ThemeFamily;
  /** Site-specific themes merged over the built-ins (matching id wins). */
  themes?: ChromeTheme[];
  langs?: { id: string; label: string }[];
  frameworks?: { id: string; label: string }[];
  defaultLang?: string;
  defaultFramework?: string;
  /** Source-control links for the SCM menu. Derived from `repo` when omitted. */
  scm?: FooterLink[];
  footer?: FooterConfig;
  builtBy?: BuiltByConfig;
}

export const DEFAULT_CODE_THEME = 'follow';
export const DEFAULT_THEME_FAMILY: ThemeFamily = 'site';
export const DEFAULT_BUILT_BY: Required<Pick<BuiltByConfig, 'href' | 'label'>> = {
  href: 'https://kolektiv.computer',
  label: 'Built by Kolektiv Computing',
};

/**
 * Fill in defaults for a site config. Returns a new object; the input is not
 * mutated.
 */
export function defineDocsChrome(config: DocsChromeConfig): DocsChromeConfig {
  const repo = config.repo;
  const scm =
    config.scm ??
    (repo
      ? [
          { label: 'Source', href: repo.url },
          { label: 'yuri.capital', href: repo.url },
        ]
      : []);
  return {
    ...config,
    title: config.title ?? config.name,
    base: config.base ?? '/',
    defaultCodeTheme: config.defaultCodeTheme ?? DEFAULT_CODE_THEME,
    themeFamily: config.themeFamily ?? DEFAULT_THEME_FAMILY,
    nav: config.nav ?? [],
    scm,
    builtBy: { ...DEFAULT_BUILT_BY, ...(config.builtBy ?? {}) },
    footer: {
      links: config.footer?.links ?? [],
      copyright: config.footer?.copyright ?? `© {year} Kolektiv Computing`,
      tagline: config.footer?.tagline,
    },
  };
}

/** Find the nav item matching a pathname, honouring the configured base. */
export function findNavItem(
  config: DocsChromeConfig,
  pathname: string,
): NavItem | undefined {
  const rel = stripBase(pathname, config.base);
  const normal = rel !== '/' ? rel.replace(/\/+$/, '') : '/';
  for (const section of config.nav) {
    for (const item of section.items) {
      if (item.external) continue;
      const href = stripBase(item.href, config.base);
      const candidate = href !== '/' ? href.replace(/\/+$/, '') : '/';
      if (candidate === normal) return item;
    }
  }
  return undefined;
}

/** Label for the current page, falling back to the configured product title. */
export function pageLabelFor(config: DocsChromeConfig, pathname: string): string {
  return findNavItem(config, pathname)?.label ?? config.title ?? config.name;
}

function cssEscape(value: string): string {
  return value.replace(/["\\]/g, '\\$&');
}

/**
 * Generate the visibility rules for `[data-lang-panel]` / `[data-framework-panel]`
 * blocks. The ids are only known at build time, so the rules are injected by the
 * layout rather than shipped in `chrome.css`.
 */
export function visibilityCss(config: DocsChromeConfig): string {
  const rules: string[] = [
    '[data-lang-panel],[data-framework-panel]{display:none}',
  ];
  for (const lang of config.langs ?? []) {
    const id = cssEscape(lang.id);
    rules.push(
      `html[data-lang="${id}"] [data-lang-panel="all"],html[data-lang="${id}"] [data-lang-panel="${id}"]{display:block}`,
    );
  }
  for (const framework of config.frameworks ?? []) {
    const id = cssEscape(framework.id);
    rules.push(
      `html[data-framework="${id}"] [data-framework-panel="all"],html[data-framework="${id}"] [data-framework-panel="${id}"]{display:block}`,
    );
  }
  return rules.join('\n');
}
