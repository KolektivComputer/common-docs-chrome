import {
  allChromeThemes,
  resolveTheme,
  shikiThemeForChrome,
  type ChromeTheme,
} from './themes.js';

export type ShikiThemeInput = string | object;

/**
 * Map of Shiki config key -> theme, keyed by chrome theme id. Keys become the
 * CSS custom properties Shiki emits (`--shiki-<key>` / `--shiki-<key>-bg`), so
 * the id must match the `data-code-theme` value used by `chrome.css`.
 */
export const defaultShikiThemes: Record<string, ShikiThemeInput> =
  Object.fromEntries(
    allChromeThemes().map((theme) => [theme.id, shikiThemeForChrome(theme.id)]),
  );

/**
 * An Astro-compatible `markdown.shikiConfig` value covering every built-in
 * theme plus any site-specific `extraThemes`.
 */
export function createShikiConfig(extraThemes: ChromeTheme[] = []): {
  themes: Record<string, any>;
  defaultColor: false;
} {
  const themes: Record<string, any> = { ...defaultShikiThemes };
  for (const theme of extraThemes) {
    themes[theme.id] = shikiThemeForChrome(theme.id, extraThemes);
  }
  return { themes, defaultColor: false };
}

/**
 * The CSS that switches `.astro-code` blocks to the active code theme. Injected
 * by the layout so site-specific themes work without touching `chrome.css`.
 */
export function shikiThemeCss(themes: ChromeTheme[] = allChromeThemes()): string {
  const rules: string[] = [];
  for (const theme of themes) {
    const id = theme.id;
    const bg = `var(--shiki-${id}-bg)`;
    const fg = `var(--shiki-${id})`;
    rules.push(
      `html[data-code-theme="${id}"] .astro-code{background-color:${bg}!important}`,
      `html[data-code-theme="${id}"] .astro-code span{color:${fg}!important}`,
      `html[data-code-theme="follow"][data-theme="${id}"] .astro-code{background-color:${bg}!important}`,
      `html[data-code-theme="follow"][data-theme="${id}"] .astro-code span{color:${fg}!important}`,
    );
  }
  return rules.join('\n');
}

/** Resolve the Shiki registration for an id from a specific theme list. */
export function shikiFor(id: string, themes?: ChromeTheme[]): ShikiThemeInput {
  const list = themes ?? allChromeThemes();
  return shikiThemeForChrome(id, list);
}

/** True when a theme id has a Shiki registration in `createShikiConfig`. */
export function hasShikiTheme(id: string, themes?: ChromeTheme[]): boolean {
  if (id in defaultShikiThemes) return true;
  return resolveTheme(id, themes ?? allChromeThemes()) !== undefined;
}
