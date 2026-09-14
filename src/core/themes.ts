import {
  colorKeys,
  getTheme,
  themeCss as paletteThemeCss,
  themeIds,
  themes as paletteThemes,
  shikiThemeFor as paletteShikiThemeFor,
} from '@kolektiv/themes';
import { kolektivDark, kolektivLight } from '@kolektiv/themes/shiki';
import type { DocsChromeConfig } from './config.js';

export type ThemeScheme = 'light' | 'dark';

/**
 * Built-in families plus any site-specific family name. The branded literals
 * give autocomplete without preventing a site from introducing its own family.
 */
export type ThemeFamily =
  | 'kolektiv'
  | 'catppuccin'
  | 'nord'
  | 'daisyui'
  | (string & {});

export interface ChromeTheme {
  id: string;
  label: string;
  scheme: ThemeScheme;
  /** Defaults to the site family when omitted on a `config.themes` entry. */
  family?: ThemeFamily;
  /** A Shiki preset id or a full Shiki theme registration object. */
  shiki: string | object;
  /** daisyUI colour tokens. Missing keys fall back to the active theme's. */
  colors?: Record<string, string>;
  /** Alternative ids that should resolve to this theme (e.g. legacy names). */
  aliases?: string[];
}

const FAMILY_LABELS: Record<string, string> = {
  kolektiv: 'Kolektiv',
  catppuccin: 'Catppuccin',
  nord: 'Nord',
  daisyui: 'daisyUI',
  site: 'Site',
};

const PALETTE_IDS = new Set<string>(themeIds);

function familyForPalette(id: string): ThemeFamily {
  if (id.startsWith('catppuccin-')) return 'catppuccin';
  if (id.startsWith('kolektiv-')) return 'kolektiv';
  if (id === 'nord') return 'nord';
  return 'kolektiv';
}

/** daisyUI's own built-in themes, offered alongside the Kolektiv palettes. */
const DAISY_THEMES: ChromeTheme[] = [
  {
    id: 'light',
    label: 'Light',
    scheme: 'light',
    family: 'daisyui',
    shiki: 'github-light',
    colors: {
      'base-100': '#ffffff',
      'base-200': '#f2f2f2',
      'base-300': '#e5e6e6',
      'base-content': '#1f2937',
      primary: '#4f46e5',
    },
  },
  {
    id: 'dark',
    label: 'Dark',
    scheme: 'dark',
    family: 'daisyui',
    shiki: 'github-dark',
    colors: {
      'base-100': '#1d232a',
      'base-200': '#191e24',
      'base-300': '#15191e',
      'base-content': '#e5e7eb',
      primary: '#818cf8',
    },
  },
];

function paletteToChrome(theme: {
  id: string;
  label: string;
  scheme: ThemeScheme;
  shiki: string;
  colors: Record<string, string>;
  aliases?: readonly string[];
}): ChromeTheme {
  return {
    id: theme.id,
    label: theme.label,
    scheme: theme.scheme,
    family: familyForPalette(theme.id),
    shiki: theme.shiki,
    colors: { ...theme.colors },
    aliases: theme.aliases ? [...theme.aliases] : undefined,
  };
}

/** Every built-in theme: Kolektiv palettes, then daisyUI light/dark. */
export function allChromeThemes(): ChromeTheme[] {
  return [...paletteThemes.map(paletteToChrome), ...DAISY_THEMES];
}

/** Human label for a family id. */
export function themeFamilyLabel(family: ThemeFamily): string {
  return FAMILY_LABELS[family] ?? family.charAt(0).toUpperCase() + family.slice(1);
}

/** Group themes by family, preserving first-seen order within each family. */
export function themesByFamily(
  themes: ChromeTheme[] = allChromeThemes(),
): Record<string, ChromeTheme[]> {
  const grouped: Record<string, ChromeTheme[]> = {};
  for (const theme of themes) {
    const family = theme.family ?? 'site';
    (grouped[family] ??= []).push(theme);
  }
  return grouped;
}

export interface ChromeThemeGroup {
  family: ThemeFamily;
  label: string;
  themes: ChromeTheme[];
}

/**
 * Ordered family groups for UI. Families listed in `order` come first (in that
 * order); any remaining families follow in first-seen order.
 */
export function groupChromeThemes(
  themes: ChromeTheme[] = allChromeThemes(),
  order: ThemeFamily[] = [],
): ChromeThemeGroup[] {
  const grouped = themesByFamily(themes);
  const families = Object.keys(grouped);
  const ordered = [
    ...order.filter((family) => family in grouped),
    ...families.filter((family) => !order.includes(family)),
  ];
  return ordered.map((family) => ({
    family,
    label: themeFamilyLabel(family),
    themes: grouped[family] ?? [],
  }));
}

/** Resolve a theme id (or alias) within a theme list. */
export function resolveTheme(
  id: string,
  themes: ChromeTheme[] = allChromeThemes(),
): ChromeTheme | undefined {
  return themes.find(
    (theme) => theme.id === id || (theme.aliases?.includes(id) ?? false),
  );
}

/** True when the id belongs to a `@kolektiv/themes` palette with shipped CSS. */
export function isBuiltinPalette(id: string): boolean {
  return PALETTE_IDS.has(id);
}

/**
 * The Shiki registration for a chrome theme. Kolektiv palettes use the
 * generated registrations; daisyUI falls back to GitHub light/dark.
 */
export function shikiThemeForChrome(
  id: string,
  themes: ChromeTheme[] = allChromeThemes(),
): string | object {
  if (id === 'kolektiv-light') return kolektivLight;
  if (id === 'kolektiv-dark') return kolektivDark;
  const theme = resolveTheme(id, themes);
  if (theme?.shiki) return theme.shiki;
  return paletteShikiThemeFor(id, theme?.scheme ?? 'dark');
}

/**
 * The full theme list for a site: built-ins restricted to `themeFamilies` (when
 * set) plus `config.themes`, with site themes overriding a built-in of the same
 * id.
 */
export function siteThemes(
  config: Pick<
    DocsChromeConfig,
    'themes' | 'themeFamilies' | 'themeFamily'
  > = {},
): ChromeTheme[] {
  const builtins = allChromeThemes();
  const families = config.themeFamilies;
  const allowed =
    families && families.length > 0
      ? builtins.filter((theme) => families.includes(theme.family ?? ''))
      : builtins;
  const siteFamily = config.themeFamily ?? 'site';
  const byId = new Map<string, ChromeTheme>(
    allowed.map((theme) => [theme.id, theme]),
  );
  for (const theme of config.themes ?? []) {
    byId.set(theme.id, { ...theme, family: theme.family ?? siteFamily });
  }
  return [...byId.values()];
}

function themeCssForOne(theme: ChromeTheme): string {
  const ids = [theme.id, ...(theme.aliases ?? [])];
  const selectors = ids.flatMap((id) => [
    `html[data-theme='${id}']`,
    `[data-theme='${id}']`,
  ]);
  const lines = [`${selectors.join(',\n')} {`, `  color-scheme: ${theme.scheme};`];
  for (const key of colorKeys) {
    const value = theme.colors?.[key];
    if (value) lines.push(`  --color-${key}: ${value};`);
  }
  lines.push('}');
  return lines.join('\n');
}

/**
 * daisyUI-compatible CSS for the supplied themes. Palettes reuse the CSS
 * generated by `@kolektiv/themes`; site themes are generated from their
 * `colors`.
 */
export function themeCssFor(themes: ChromeTheme[]): string {
  return themes
    .map((theme) => {
      const palette = getTheme(theme.id);
      if (palette) return paletteThemeCss(palette);
      return themeCssForOne(theme);
    })
    .join('\n\n');
}
