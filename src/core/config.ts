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

/**
 * Per-site (or per-page) navbar customisation. Every flag defaults to `true`,
 * so omitting `navbar` preserves the stock navbar exactly.
 */
export interface NavbarConfig {
  /** Show the brand lockup. Default true. */
  showBrand?: boolean;
  /** Show the current page label. Default true. */
  showLabel?: boolean;
  /** Show the language switch. Default true. */
  showLang?: boolean;
  /** Show extra configured switchers. Default true. */
  showSwitchers?: boolean;
  /** Show the framework dropdown. Default true. */
  showFramework?: boolean;
  /** Show the SCM menu. Default true. */
  showScm?: boolean;
  /** Show the theme picker. Default true. */
  showTheme?: boolean;
  /** Extra navbar links, rendered after the switchers and before SCM/theme. */
  links?: NavItem[];
}

export interface FooterConfig {
  /** Extra links rendered in the footer. */
  links?: FooterLink[];
  /** Copyright line. `{year}` is replaced with the current year. */
  copyright?: string;
  /** Short blurb shown next to the built-by mark. */
  tagline?: string;
}

/** A single option inside a generic documentation switcher. */
export interface SwitcherOption {
  id: string;
  label: string;
}

/**
 * A named either/or (or n-option) switch rendered by the chrome. Every
 * switcher gets an `<html data-<id>>` attribute and a matching
 * `[data-<id>-panel]` visibility contract, mirroring the built-in language
 * pair.
 */
export interface SwitcherConfig {
  /** Stable id, used for the html attribute `data-<id>` and `[data-<id>-panel]`. */
  id: string;
  /** Group label for a11y; defaults to the id. */
  label?: string;
  options: SwitcherOption[];
  /** Defaults to options[0].id. */
  default?: string;
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
  /**
   * Additional generic switchers (e.g. TypeScript/JavaScript or
   * Kotlin/Groovy build scripts). The built-in `lang` switcher is derived from
   * `langs`; ids reserved for the built-in controls are ignored here.
   */
  switchers?: SwitcherConfig[];
  /** Source-control links for the SCM menu. Derived from `repo` when omitted. */
  scm?: FooterLink[];
  /**
   * Navbar customisation: toggle the built-in controls and add extra links.
   * Individual layouts accept a per-page `navbar` override.
   */
  navbar?: NavbarConfig;
  footer?: FooterConfig;
  builtBy?: BuiltByConfig;
}

export const DEFAULT_CODE_THEME = 'follow';
export const DEFAULT_THEME_FAMILY: ThemeFamily = 'site';
export const DEFAULT_BUILT_BY: Required<Pick<BuiltByConfig, 'href' | 'label'>> = {
  href: 'https://kolektiv.computer',
  label: 'Built by Kolektiv Computing',
};

/** Every navbar visibility flag defaults to on; `links` defaults to `[]`. */
export const DEFAULT_NAVBAR: Required<Omit<NavbarConfig, 'links'>> = {
  showBrand: true,
  showLabel: true,
  showLang: true,
  showSwitchers: true,
  showFramework: true,
  showScm: true,
  showTheme: true,
};

const NAVBAR_FLAG_KEYS = Object.keys(DEFAULT_NAVBAR) as (keyof typeof DEFAULT_NAVBAR)[];

/**
 * Resolve the effective navbar options by layering `DEFAULT_NAVBAR`, the site
 * config and an optional per-page override. Undefined flags are ignored so a
 * layer never blanks a default; the last supplied `links` array wins.
 */
export function resolveNavbar(
  config: DocsChromeConfig,
  override?: Partial<NavbarConfig>,
): Required<NavbarConfig> {
  const flags = { ...DEFAULT_NAVBAR };
  let links: NavItem[] | undefined;
  for (const layer of [config.navbar, override]) {
    if (!layer) continue;
    for (const key of NAVBAR_FLAG_KEYS) {
      const value = layer[key];
      if (typeof value === 'boolean') flags[key] = value;
    }
    if (Array.isArray(layer.links)) links = layer.links;
  }
  return { ...flags, links: links ?? [] };
}

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
 * Switcher ids owned by the built-in controls: `lang` (LangToggle), `framework`
 * (FrameworkPicker), `theme` and `codeTheme` (ThemePicker). They already have
 * dedicated preference keys, `<html>` attributes and no-flash handling, so a
 * generic switcher may not take them over — a custom switcher reusing one would
 * collide with the `[data-pref]` routing and silently hijack the built-in
 * control.
 */
export const RESERVED_SWITCHER_IDS = ['lang', 'framework', 'theme', 'codeTheme'] as const;

function isReservedSwitcherId(id: string): boolean {
  return (RESERVED_SWITCHER_IDS as readonly string[]).includes(id);
}

/**
 * Resolve the ordered switcher list for a config: the implicit `lang` switcher
 * (when `langs` is set) followed by every configured generic switcher.
 * Switchers with no options and switchers using a reserved id are ignored.
 */
export function resolveSwitchers(config: DocsChromeConfig): SwitcherConfig[] {
  const switchers: SwitcherConfig[] = [];
  const seen = new Set<string>();
  const langs = config.langs ?? [];
  if (langs.length > 0) {
    switchers.push({
      id: 'lang',
      label: 'Language',
      options: langs,
      default: config.defaultLang,
    });
    seen.add('lang');
  }
  for (const switcher of config.switchers ?? []) {
    if (!switcher) continue;
    const options = Array.isArray(switcher.options) ? switcher.options : [];
    if (options.length === 0) continue;
    if (isReservedSwitcherId(switcher.id)) continue;
    if (seen.has(switcher.id)) continue;
    seen.add(switcher.id);
    switchers.push({ ...switcher, options });
  }
  return switchers;
}

/**
 * Generate the visibility rules for every switcher panel (`[data-<id>-panel]`)
 * plus the framework panels. The ids are only known at build time, so the rules
 * are injected by the layout rather than shipped in `chrome.css`. The built-in
 * `lang` switcher emits the exact legacy `data-lang-panel` selectors.
 */
export function visibilityCss(config: DocsChromeConfig): string {
  const switchers = resolveSwitchers(config);
  const base = [
    ...switchers.map((switcher) => `[data-${cssEscape(switcher.id)}-panel]`),
    '[data-framework-panel]',
  ].join(',');
  const rules: string[] = [`${base}{display:none}`];
  for (const switcher of switchers) {
    const switcherId = cssEscape(switcher.id);
    for (const option of switcher.options) {
      const id = cssEscape(option.id);
      rules.push(
        `html[data-${switcherId}="${id}"] [data-${switcherId}-panel="all"],html[data-${switcherId}="${id}"] [data-${switcherId}-panel="${id}"]{display:block}`,
      );
    }
  }
  for (const framework of config.frameworks ?? []) {
    const id = cssEscape(framework.id);
    rules.push(
      `html[data-framework="${id}"] [data-framework-panel="all"],html[data-framework="${id}"] [data-framework-panel="${id}"]{display:block}`,
    );
  }
  return rules.join('\n');
}
